-- ==================================================================================
-- LOT 1 — Planificateur de séjour : fondations base de données
-- Tables : partenaires_activites, activites_partenaires, planning_sejour,
--          reservations_activites
-- RLS alignées sur le pattern token fiche-client (client_token_reservation_id)
-- Seed : partenaire "Gîtes de France" + 10 activités autour du gîte Le Levade
--        (Calvignac, Lot — lat 44.4633 / lon 1.7747)
-- Commit cible : feat(db): tables planning sejour et activites partenaires
-- Date : 2026-04-22
-- ==================================================================================

BEGIN;

-- ==================================================================================
-- EXTENSIONS (requises pour index spatial earthdistance)
-- ==================================================================================
CREATE EXTENSION IF NOT EXISTS cube;
CREATE EXTENSION IF NOT EXISTS earthdistance;

-- ==================================================================================
-- TABLE 1 : partenaires_activites
-- Organismes externes référencés (Gîtes de France, prestataires directs…)
-- ==================================================================================
CREATE TABLE IF NOT EXISTS public.partenaires_activites (
    id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    nom                   text NOT NULL,
    type                  text CHECK (type IN ('organisme', 'commercant_direct')),
    contact_email         text,
    contact_telephone     text,
    commission_pct_defaut numeric(5,2) DEFAULT 5.00,
    actif                 boolean DEFAULT true,
    created_at            timestamptz DEFAULT now()
);

-- RLS : lecture publique (anon) — filtrage géo côté appli
ALTER TABLE public.partenaires_activites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_partenaires_read" ON public.partenaires_activites;
CREATE POLICY "anon_partenaires_read"
    ON public.partenaires_activites FOR SELECT TO anon
    USING (actif = true);

DROP POLICY IF EXISTS "owner_partenaires_all" ON public.partenaires_activites;
CREATE POLICY "owner_partenaires_all"
    ON public.partenaires_activites FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

-- ==================================================================================
-- TABLE 2 : activites_partenaires
-- Catalogue d'activités proposées par les partenaires
-- ==================================================================================
CREATE TABLE IF NOT EXISTS public.activites_partenaires (
    id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    partenaire_id        uuid REFERENCES public.partenaires_activites(id),
    nom                  text NOT NULL,
    categorie            text,                  -- restaurant, cave, visite, loisir, culturel, nature
    description          text,
    latitude             numeric(9,6),
    longitude            numeric(9,6),
    adresse              text,
    code_postal          text,
    ville                text,
    telephone            text,
    email                text,
    site_web             text,
    prix_unitaire        numeric(10,2),          -- prix par personne ou forfait
    unite_prix           text,                   -- 'personne', 'forfait', 'heure'
    duree_estimee_min    integer,                -- durée de l'activité en minutes
    capacite_max         integer,
    jours_ouverture      jsonb,                  -- {"lun":true,"mar":false,...}
    horaires_ouverture   jsonb,                  -- [{"debut":"09:00","fin":"12:00"},...]
    photos               text[],
    commission_pct       numeric(5,2),           -- override du défaut partenaire
    zone_rayon_km        integer DEFAULT 30,     -- rayon de pertinence géo
    validation_mode      text CHECK (validation_mode IN ('auto','manuelle')) DEFAULT 'manuelle',
    actif                boolean DEFAULT true,
    created_at           timestamptz DEFAULT now()
);

-- Index spatial
CREATE INDEX IF NOT EXISTS idx_activites_part_geo
    ON public.activites_partenaires
    USING GIST (ll_to_earth(latitude::float8, longitude::float8));

CREATE INDEX IF NOT EXISTS idx_activites_part_partenaire
    ON public.activites_partenaires(partenaire_id);

CREATE INDEX IF NOT EXISTS idx_activites_part_categorie
    ON public.activites_partenaires(categorie);

-- RLS : lecture publique anon (filtrée géo côté appli)
ALTER TABLE public.activites_partenaires ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_activites_part_read" ON public.activites_partenaires;
CREATE POLICY "anon_activites_part_read"
    ON public.activites_partenaires FOR SELECT TO anon
    USING (actif = true);

DROP POLICY IF EXISTS "owner_activites_part_all" ON public.activites_partenaires;
CREATE POLICY "owner_activites_part_all"
    ON public.activites_partenaires FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

-- ==================================================================================
-- TABLE 3 : planning_sejour
-- Le planning personnel du client pour sa réservation
-- ==================================================================================
CREATE TABLE IF NOT EXISTS public.planning_sejour (
    id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    reservation_id           uuid REFERENCES public.reservations(id) ON DELETE CASCADE,
    token_fiche_client       text NOT NULL,     -- double clé de sécurité (pattern existant)
    jour                     date NOT NULL,
    heure_debut              time NOT NULL,
    heure_fin                time,
    source                   text CHECK (source IN ('gite','partenaire','libre')) NOT NULL,
    activite_gite_id         uuid REFERENCES public.activites_gites(id),
    activite_partenaire_id   uuid REFERENCES public.activites_partenaires(id),
    titre_libre              text,              -- si source='libre'
    notes                    text,
    mode_transport           text CHECK (mode_transport IN ('voiture','velo','pied')) DEFAULT 'voiture',
    distance_km              numeric(6,2),
    duree_trajet_min         integer,
    heure_depart_suggeree    time,
    latitude_dest            numeric(9,6),
    longitude_dest           numeric(9,6),
    statut                   text CHECK (statut IN ('planifie','reserve','confirme','termine','annule')) DEFAULT 'planifie',
    reservation_activite_id  uuid,              -- FK vers reservations_activites (ajoutée après)
    created_at               timestamptz DEFAULT now(),
    updated_at               timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_planning_reservation
    ON public.planning_sejour(reservation_id);

CREATE INDEX IF NOT EXISTS idx_planning_jour
    ON public.planning_sejour(reservation_id, jour, heure_debut);

CREATE INDEX IF NOT EXISTS idx_planning_token
    ON public.planning_sejour(token_fiche_client);

-- RLS alignée sur le pattern token fiche-client
ALTER TABLE public.planning_sejour ENABLE ROW LEVEL SECURITY;

-- Anon : accès strictement limité à la réservation du token en cours
DROP POLICY IF EXISTS "anon_planning_select" ON public.planning_sejour;
CREATE POLICY "anon_planning_select"
    ON public.planning_sejour FOR SELECT TO anon
    USING (reservation_id = public.client_token_reservation_id());

DROP POLICY IF EXISTS "anon_planning_insert" ON public.planning_sejour;
CREATE POLICY "anon_planning_insert"
    ON public.planning_sejour FOR INSERT TO anon
    WITH CHECK (reservation_id = public.client_token_reservation_id());

DROP POLICY IF EXISTS "anon_planning_update" ON public.planning_sejour;
CREATE POLICY "anon_planning_update"
    ON public.planning_sejour FOR UPDATE TO anon
    USING (reservation_id = public.client_token_reservation_id())
    WITH CHECK (reservation_id = public.client_token_reservation_id());

DROP POLICY IF EXISTS "anon_planning_delete" ON public.planning_sejour;
CREATE POLICY "anon_planning_delete"
    ON public.planning_sejour FOR DELETE TO anon
    USING (reservation_id = public.client_token_reservation_id());

-- Authenticated (propriétaire) : voit les plannings de ses propres réservations
DROP POLICY IF EXISTS "owner_planning_all" ON public.planning_sejour;
CREATE POLICY "owner_planning_all"
    ON public.planning_sejour FOR ALL TO authenticated
    USING (
        reservation_id IN (
            SELECT id FROM public.reservations
            WHERE owner_user_id = auth.uid()
        )
    )
    WITH CHECK (
        reservation_id IN (
            SELECT id FROM public.reservations
            WHERE owner_user_id = auth.uid()
        )
    );

-- ==================================================================================
-- TABLE 4 : reservations_activites
-- Demandes de réservation client → prestataire partenaire
-- ==================================================================================
CREATE TABLE IF NOT EXISTS public.reservations_activites (
    id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    reservation_id           uuid REFERENCES public.reservations(id),
    token_fiche_client       text NOT NULL,
    activite_partenaire_id   uuid REFERENCES public.activites_partenaires(id),
    date_prevue              date NOT NULL,
    heure_prevue             time NOT NULL,
    nb_personnes             integer DEFAULT 2,
    prix_brut                numeric(10,2),
    commission_pct           numeric(5,2),
    commission_montant       numeric(10,2),
    prix_net_partenaire      numeric(10,2),
    statut                   text CHECK (statut IN ('en_attente','confirmee','refusee','annulee')) DEFAULT 'en_attente',
    motif_refus              text,
    created_at               timestamptz DEFAULT now(),
    confirmed_at             timestamptz
);

CREATE INDEX IF NOT EXISTS idx_resa_activites_reservation
    ON public.reservations_activites(reservation_id);

CREATE INDEX IF NOT EXISTS idx_resa_activites_statut
    ON public.reservations_activites(statut);

-- RLS alignée sur le pattern token fiche-client
ALTER TABLE public.reservations_activites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_resa_activites_select" ON public.reservations_activites;
CREATE POLICY "anon_resa_activites_select"
    ON public.reservations_activites FOR SELECT TO anon
    USING (reservation_id = public.client_token_reservation_id());

DROP POLICY IF EXISTS "anon_resa_activites_insert" ON public.reservations_activites;
CREATE POLICY "anon_resa_activites_insert"
    ON public.reservations_activites FOR INSERT TO anon
    WITH CHECK (reservation_id = public.client_token_reservation_id());

DROP POLICY IF EXISTS "anon_resa_activites_update" ON public.reservations_activites;
CREATE POLICY "anon_resa_activites_update"
    ON public.reservations_activites FOR UPDATE TO anon
    USING (reservation_id = public.client_token_reservation_id())
    WITH CHECK (reservation_id = public.client_token_reservation_id());

-- Authenticated (propriétaire) : voit les résas activités de ses réservations
DROP POLICY IF EXISTS "owner_resa_activites_all" ON public.reservations_activites;
CREATE POLICY "owner_resa_activites_all"
    ON public.reservations_activites FOR ALL TO authenticated
    USING (
        reservation_id IN (
            SELECT id FROM public.reservations
            WHERE owner_user_id = auth.uid()
        )
    )
    WITH CHECK (
        reservation_id IN (
            SELECT id FROM public.reservations
            WHERE owner_user_id = auth.uid()
        )
    );

-- ==================================================================================
-- FK différée : planning_sejour.reservation_activite_id → reservations_activites
-- (créée après les deux tables)
-- ==================================================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'fk_planning_resa_activite'
          AND table_name = 'planning_sejour'
    ) THEN
        ALTER TABLE public.planning_sejour
            ADD CONSTRAINT fk_planning_resa_activite
            FOREIGN KEY (reservation_activite_id)
            REFERENCES public.reservations_activites(id)
            ON DELETE SET NULL;
    END IF;
END $$;

-- ==================================================================================
-- SEED : partenaire "Gîtes de France" + 10 activités autour du gîte Le Levade
-- Centre géo : Calvignac (Lot) — lat 44.4633 / lon 1.7747
-- ==================================================================================
DO $$
DECLARE
    v_partenaire_id uuid;
BEGIN
    -- Insérer le partenaire si absent
    INSERT INTO public.partenaires_activites (nom, type, contact_email, contact_telephone, commission_pct_defaut, actif)
    VALUES ('Gîtes de France', 'organisme', 'lot@gites-de-france.fr', '05 65 35 07 09', 5.00, true)
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_partenaire_id;

    -- Si le partenaire existait déjà, récupérer son id
    IF v_partenaire_id IS NULL THEN
        SELECT id INTO v_partenaire_id FROM public.partenaires_activites WHERE nom = 'Gîtes de France' LIMIT 1;
    END IF;

    -- 10 activités d'exemple autour du gîte Le Levade (rayon ~30km, Lot/Aveyron)
    INSERT INTO public.activites_partenaires
        (partenaire_id, nom, categorie, description, latitude, longitude, adresse, code_postal, ville,
         telephone, prix_unitaire, unite_prix, duree_estimee_min, jours_ouverture,
         horaires_ouverture, commission_pct, zone_rayon_km, validation_mode, actif)
    VALUES
        -- 1. Grotte du Pech Merle
        (v_partenaire_id,
         'Grotte du Pech Merle',
         'culturel',
         'Grotte préhistorique ornée avec peintures rupestres de 25 000 ans. UNESCO. Visite guidée obligatoire.',
         44.5122, 1.6406,
         'Le Pech Merle', '46330', 'Cabrerets',
         '05 65 31 27 05',
         14.50, 'personne', 90,
         '{"lun":true,"mar":true,"mer":true,"jeu":true,"ven":true,"sam":true,"dim":true}',
         '[{"debut":"09:30","fin":"12:00"},{"debut":"13:30","fin":"17:00"}]',
         5.00, 30, 'manuelle', true),

        -- 2. Château de Cénevières
        (v_partenaire_id,
         'Château de Cénevières',
         'culturel',
         'Château Renaissance dominant le Lot avec panorama exceptionnel. Visite des appartements et jardins.',
         44.4811, 1.7150,
         'Château de Cénevières', '46330', 'Cénevières',
         '05 65 31 27 33',
         7.00, 'personne', 60,
         '{"lun":false,"mar":true,"mer":true,"jeu":true,"ven":true,"sam":true,"dim":true}',
         '[{"debut":"10:00","fin":"12:00"},{"debut":"14:00","fin":"18:00"}]',
         5.00, 30, 'manuelle', true),

        -- 3. Canoë Lot Aventure
        (v_partenaire_id,
         'Descente en canoë sur le Lot',
         'loisir',
         'Location canoë-kayak pour descendre le Lot entre Calvignac et Conduché. Parcours 8 km ou 15 km.',
         44.4540, 1.7380,
         'Base nautique de Calvignac', '46160', 'Calvignac',
         '06 12 34 56 78',
         22.00, 'personne', 180,
         '{"lun":true,"mar":true,"mer":true,"jeu":true,"ven":true,"sam":true,"dim":true}',
         '[{"debut":"09:00","fin":"18:00"}]',
         5.00, 15, 'auto', true),

        -- 4. Domaine de Lacave – Grottes
        (v_partenaire_id,
         'Grottes de Lacave',
         'nature',
         'Grottes majestueuses avec concrétions. Petit train + ascenseur. Incontournable dans le Lot.',
         44.8290, 1.5710,
         'Lacave', '46200', 'Lacave',
         '05 65 37 87 03',
         12.50, 'personne', 75,
         '{"lun":true,"mar":true,"mer":true,"jeu":true,"ven":true,"sam":true,"dim":true}',
         '[{"debut":"09:30","fin":"12:00"},{"debut":"14:00","fin":"17:00"}]',
         5.00, 30, 'manuelle', true),

        -- 5. Véloroute Vallée du Lot
        (v_partenaire_id,
         'Location vélo – Véloroute du Lot',
         'loisir',
         'Location VTT et vélos électriques pour parcourir la véloroute longeant le Lot. Casques fournis.',
         44.4720, 1.7620,
         'Route de Figeac', '46160', 'Cajarc',
         '05 65 40 72 89',
         18.00, 'heure',  180,
         '{"lun":true,"mar":false,"mer":true,"jeu":true,"ven":true,"sam":true,"dim":true}',
         '[{"debut":"09:00","fin":"19:00"}]',
         5.00, 25, 'auto', true),

        -- 6. Cave de Cahors – Dégustation
        (v_partenaire_id,
         'Dégustation Malbec – Cave Château La Reyne',
         'cave',
         'Visite du vignoble AOC Cahors et dégustation de 5 vins Malbec avec accord mets. Réservation conseillée.',
         44.5010, 1.4820,
         'Château La Reyne, route de Pradines', '46090', 'Luzech',
         '05 65 20 15 98',
         12.00, 'personne', 90,
         '{"lun":false,"mar":true,"mer":true,"jeu":true,"ven":true,"sam":true,"dim":false}',
         '[{"debut":"10:00","fin":"12:00"},{"debut":"15:00","fin":"17:00"}]',
         5.00, 30, 'manuelle', true),

        -- 7. Escalade Falaises de Calvignac
        (v_partenaire_id,
         'Escalade – Falaises de Calvignac',
         'nature',
         'Via ferrata et escalade sur les falaises calcaires dominant le Lot. Encadrement par moniteur BEES.',
         44.4660, 1.7720,
         'Falaises de Calvignac', '46160', 'Calvignac',
         '06 78 90 12 34',
         35.00, 'personne', 240,
         '{"lun":false,"mar":false,"mer":true,"jeu":false,"ven":false,"sam":true,"dim":true}',
         '[{"debut":"09:00","fin":"13:00"},{"debut":"14:00","fin":"18:00"}]',
         5.00, 10, 'manuelle', true),

        -- 8. Restaurant Le Médiéval – Cajarc
        (v_partenaire_id,
         'Table d''hôtes Le Médiéval',
         'restaurant',
         'Cuisine du Quercy à base de produits locaux : truffes, foie gras, agneau du Quercy. Terrasse vue rivière.',
         44.4818, 1.8426,
         '12 pl. du Foirail', '46160', 'Cajarc',
         '05 65 40 61 25',
         32.00, 'personne', 90,
         '{"lun":false,"mar":false,"mer":true,"jeu":true,"ven":true,"sam":true,"dim":true}',
         '[{"debut":"12:00","fin":"14:00"},{"debut":"19:30","fin":"21:30"}]',
         5.00, 15, 'manuelle', true),

        -- 9. Moulin de Cransac – Art & Patrimoine
        (v_partenaire_id,
         'Visite Moulin de Cransac',
         'visite',
         'Moulin à eau restauré du XVIe siècle, démonstration de mouture et vente de farine d''épeautre bio.',
         44.4450, 1.7900,
         'Moulin de Cransac', '46160', 'Larnagol',
         '05 65 31 19 42',
         6.00, 'personne', 45,
         '{"lun":false,"mar":true,"mer":true,"jeu":true,"ven":true,"sam":true,"dim":false}',
         '[{"debut":"10:00","fin":"12:30"},{"debut":"14:30","fin":"17:30"}]',
         5.00, 20, 'auto', true),

        -- 10. Randonnée GR36 – Boucle des Causses
        (v_partenaire_id,
         'Randonnée guidée GR36 – Boucle des Causses',
         'nature',
         'Randonnée 12 km sur le causse de Limogne avec guide naturaliste. Flore, faune, dolmens. Niveau facile.',
         44.3980, 1.7630,
         'Office de Tourisme du Grand-Figeac', '46160', 'Cajarc',
         '05 65 34 06 25',
         15.00, 'personne', 300,
         '{"lun":false,"mar":false,"mer":false,"jeu":false,"ven":false,"sam":true,"dim":false}',
         '[{"debut":"09:00","fin":"14:00"}]',
         5.00, 30, 'manuelle', true)
    ON CONFLICT DO NOTHING;

END $$;

COMMIT;

-- ==================================================================================
-- Vérification post-migration
-- ==================================================================================
-- SELECT table_name FROM information_schema.tables WHERE table_schema='public'
--   AND table_name IN ('partenaires_activites','activites_partenaires','planning_sejour','reservations_activites');
-- SELECT COUNT(*) FROM public.activites_partenaires;
-- SELECT COUNT(*) FROM public.partenaires_activites;
