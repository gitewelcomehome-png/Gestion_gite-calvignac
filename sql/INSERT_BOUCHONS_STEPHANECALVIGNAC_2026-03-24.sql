-- ==================================================================================
-- INJECTION DONNEES TEST - COMPTE stephanecalvignac@hotmail.com
-- Date : 2026-03-24
-- Objectif : 3 gites + 33 reservations + km_trajets + simulations_fiscales
-- ==================================================================================
-- A executer dans l'editeur SQL de Supabase (idempotent - safe a relancer)
-- PREREQUIS : le compte stephanecalvignac@hotmail.com doit exister dans auth.users
-- ==================================================================================

DO $$
DECLARE
    v_owner_id        UUID;
    v_gite1_id        UUID;
    v_gite2_id        UUID;
    v_gite3_id        UUID;
    v_res_id          UUID;
BEGIN

    -- -----------------------------------------------------------------------
    -- 0. Recuperation du user_id
    -- -----------------------------------------------------------------------
    SELECT id INTO v_owner_id
    FROM auth.users
    WHERE email = 'stephanecalvignac@hotmail.com'
    LIMIT 1;

    IF v_owner_id IS NULL THEN
        RAISE EXCEPTION 'Compte stephanecalvignac@hotmail.com introuvable dans auth.users.';
    END IF;

    RAISE NOTICE 'owner_user_id = %', v_owner_id;

    -- -----------------------------------------------------------------------
    -- 1. Nettoyage prealable (idempotent)
    -- -----------------------------------------------------------------------
    DELETE FROM public.km_trajets           WHERE owner_user_id = v_owner_id;
    DELETE FROM public.simulations_fiscales WHERE owner_user_id = v_owner_id;
    DELETE FROM public.reservations         WHERE owner_user_id = v_owner_id;
    DELETE FROM public.gites                WHERE owner_user_id = v_owner_id;
    DELETE FROM public.cm_clients           WHERE user_id        = v_owner_id;
    RAISE NOTICE 'Donnees existantes purgees';

    -- -----------------------------------------------------------------------
    -- 2. GITES (3 hebergements dans le Lot)
    -- -----------------------------------------------------------------------

    -- Gite 1 : Le Mas du Cele (gite rural premium, 6 pers)
    INSERT INTO public.gites (
        owner_user_id, name, slug, description, address,
        icon, color, capacity, bedrooms, bathrooms,
        latitude, longitude, distance_km,
        is_active, taxe_sejour_tarif,
        settings
    ) VALUES (
        v_owner_id,
        'Le Mas du Cele',
        'mas-du-cele',
        'Magnifique mas en pierre du Lot niche au bord du Cele, entoure de chenes centenaires. Piscine privee, jacuzzi, terrasse panoramique sur la vallee calcaire. Ideal pour des vacances ressourcantes en pleine nature lotoise.',
        'Route du Moulin, 46330 Saint-Cirq-Lapopie',
        'home', '#e67e22', 6, 3, 2,
        44.46820000, 1.67040000, 12.5,
        true, 0.83,
        jsonb_build_object(
            'price_per_night', 115.00,
            'currency', 'EUR',
            'min_stay', 3,
            'check_in_time', '16:00',
            'check_out_time', '10:00',
            'wifi_ssid', 'MasduCele_Guest',
            'wifi_password', 'CeleBeau2024!',
            'animaux_acceptes', false,
            'piscine', true
        )
    ) RETURNING id INTO v_gite1_id;
    RAISE NOTICE 'Gite 1 cree : %', v_gite1_id;

    -- Gite 2 : Le Pigeonnier de Calvignac (gite de charme, 4 pers)
    INSERT INTO public.gites (
        owner_user_id, name, slug, description, address,
        icon, color, capacity, bedrooms, bathrooms,
        latitude, longitude, distance_km,
        is_active, taxe_sejour_tarif,
        settings
    ) VALUES (
        v_owner_id,
        'Le Pigeonnier de Calvignac',
        'pigeonnier-calvignac',
        'Charmant pigeonnier lotois retape avec soin, dominant le village de Calvignac et la vallee du Lot. Vue epoustouflante depuis la terrasse en bois. Ideal pour un couple ou une petite famille cherchant authenticite et calme.',
        '3 Rue du Pigeonnier, 46160 Calvignac',
        'star', '#16a085', 4, 2, 1,
        44.47310000, 1.73520000, 8.0,
        true, 0.83,
        jsonb_build_object(
            'price_per_night', 85.00,
            'currency', 'EUR',
            'min_stay', 2,
            'check_in_time', '15:00',
            'check_out_time', '11:00',
            'wifi_ssid', 'Pigeonnier_Wifi',
            'wifi_password', 'Calvignac46!',
            'animaux_acceptes', true,
            'piscine', false
        )
    ) RETURNING id INTO v_gite2_id;
    RAISE NOTICE 'Gite 2 cree : %', v_gite2_id;

    -- Gite 3 : La Ferme du Quercy (grande ferme familiale, 8 pers)
    INSERT INTO public.gites (
        owner_user_id, name, slug, description, address,
        icon, color, capacity, bedrooms, bathrooms,
        latitude, longitude, distance_km,
        is_active, taxe_sejour_tarif,
        settings
    ) VALUES (
        v_owner_id,
        'La Ferme du Quercy',
        'ferme-du-quercy',
        'Grande ferme quercynoise restauree, parfaite pour les reunions de famille ou groupes d''amis. 4 chambres independantes, grand salon convivial avec cheminee, potager mis a disposition. Environnement authentique en pleine campagne lotoise pres de Figeac.',
        'Hameau de Lentillac, 46100 Figeac',
        'castle', '#8e44ad', 8, 4, 2,
        44.60580000, 2.03600000, 28.0,
        true, 0.83,
        jsonb_build_object(
            'price_per_night', 135.00,
            'currency', 'EUR',
            'min_stay', 3,
            'check_in_time', '17:00',
            'check_out_time', '10:00',
            'wifi_ssid', 'FermeQuercy',
            'wifi_password', 'Figeac2024#',
            'animaux_acceptes', true,
            'piscine', false
        )
    ) RETURNING id INTO v_gite3_id;
    RAISE NOTICE 'Gite 3 cree : %', v_gite3_id;

    -- -----------------------------------------------------------------------
    -- 2b. CM_CLIENTS (trial quattro annuel - acces complet pour tests)
    -- Colonnes utilisees = confirmees en production :
    --   user_id (confirme : DELETE WHERE user_id fonctionne)
    --   email   (UNIQUE NOT NULL d'origine - REBUILD)
    --   statut  (lu par subscription-manager.js)
    --   type_abonnement / billing_cycle (ajoutes par MIGRATION_ABONNEMENTS)
    --   trial_ends_at / onboarding_completed (ajoutes par ALTER_CM_CLIENTS)
    -- Mode trial = subscription-manager charge les features via cm_pricing_plans
    -- sans avoir besoin d'une entree cm_subscriptions.
    -- -----------------------------------------------------------------------
    INSERT INTO public.cm_clients (
        user_id,
        email,
        statut,
        type_abonnement,
        billing_cycle,
        trial_ends_at,
        onboarding_completed
    ) VALUES (
        v_owner_id,
        'stephanecalvignac@hotmail.com',
        'trial',
        'quattro',
        'annuel',
        NOW() + INTERVAL '730 days',
        true
    );
    RAISE NOTICE 'cm_clients cree (trial quattro_annuel, expiration dans 730 jours)';

    -- -----------------------------------------------------------------------
    -- 3. RESERVATIONS FUTURES 2026-2027 (toutes posterieures au 24/03/2026)
    -- -----------------------------------------------------------------------
    -- DANS LES 2 PROCHAINES SEMAINES (avant le 07/04/2026) :
    --   Gite 2 : 26/03 - 30/03
    --   Gite 1 : 28/03 - 04/04
    --   Gite 3 : 29/03 - 05/04
    -- -----------------------------------------------------------------------

    -- === GITE 1 : Le Mas du Cele (8 reservations) ===

    -- Dans les 2 prochaines semaines
    INSERT INTO public.reservations (owner_user_id, gite_id, check_in, check_out, client_name, client_email, client_phone, guest_count, platform, status, total_price, currency, notes, source)
    VALUES (v_owner_id, v_gite1_id, '2026-03-28', '2026-04-04', 'Guillaume et Sarah Aubert', 'gaubert.sarah@gmail.com', '06 13 24 35 46', 4, 'direct', 'confirmed', 805.00, 'EUR', 'Semaine de printemps, reserve en direct.', 'manual');

    INSERT INTO public.reservations (owner_user_id, gite_id, check_in, check_out, client_name, client_email, client_phone, guest_count, platform, status, total_price, currency, notes, source)
    VALUES (v_owner_id, v_gite1_id, '2026-04-04', '2026-04-11', 'Emma et Lucas Bernard', 'emma.bernard@gmail.com', '06 23 45 67 89', 5, 'airbnb', 'confirmed', 805.00, 'EUR', 'Paques 2026 en famille.', 'ical');

    INSERT INTO public.reservations (owner_user_id, gite_id, check_in, check_out, client_name, client_email, client_phone, guest_count, platform, status, total_price, currency, notes, source)
    VALUES (v_owner_id, v_gite1_id, '2026-05-23', '2026-05-30', 'Cecile Leroux', 'cecile.leroux@laposte.net', '07 34 56 78 90', 4, 'booking', 'confirmed', 805.00, 'EUR', 'Pont de la Pentecote 2026.', 'ical');

    INSERT INTO public.reservations (owner_user_id, gite_id, check_in, check_out, client_name, client_email, client_phone, guest_count, platform, status, total_price, currency, notes, source)
    VALUES (v_owner_id, v_gite1_id, '2026-06-13', '2026-06-20', 'Olivier et Nathalie Dumas', 'o.dumas@orange.fr', '06 77 88 99 00', 5, 'airbnb', 'confirmed', 805.00, 'EUR', 'Juin 2026, veille de saison.', 'ical');

    INSERT INTO public.reservations (owner_user_id, gite_id, check_in, check_out, client_name, client_email, client_phone, guest_count, platform, status, total_price, currency, notes, source)
    VALUES (v_owner_id, v_gite1_id, '2026-07-18', '2026-07-25', 'Renaud Beaumont', 'r.beaumont@sfr.fr', '06 88 77 66 55', 6, 'airbnb', 'confirmed', 920.00, 'EUR', 'Haute saison 2026, piscine.', 'ical');

    INSERT INTO public.reservations (owner_user_id, gite_id, check_in, check_out, client_name, client_email, client_phone, guest_count, platform, status, total_price, currency, notes, source)
    VALUES (v_owner_id, v_gite1_id, '2026-08-08', '2026-08-15', 'Fabienne Delorme', 'fdelorme@orange.fr', '07 55 44 33 22', 4, 'booking', 'confirmed', 920.00, 'EUR', 'Aout 2026, calme demande.', 'ical');

    INSERT INTO public.reservations (owner_user_id, gite_id, check_in, check_out, client_name, client_email, client_phone, guest_count, platform, status, total_price, currency, notes, source)
    VALUES (v_owner_id, v_gite1_id, '2026-09-26', '2026-10-03', 'Philippe et Odile Masson', 'pmasson@laposte.net', '07 65 43 21 09', 4, 'abritel', 'confirmed', 805.00, 'EUR', 'Arriere saison, retraites.', 'ical');

    INSERT INTO public.reservations (owner_user_id, gite_id, check_in, check_out, client_name, client_email, client_phone, guest_count, platform, status, total_price, currency, notes, source)
    VALUES (v_owner_id, v_gite1_id, '2026-10-24', '2026-10-31', 'Famille Aubert', 'famille.aubert@gmail.com', '06 54 32 10 98', 5, 'booking', 'pending', 805.00, 'EUR', 'Vacances Toussaint 2026.', 'ical');

    -- === GITE 2 : Le Pigeonnier de Calvignac (7 reservations) ===

    -- Dans les 2 prochaines semaines
    INSERT INTO public.reservations (owner_user_id, gite_id, check_in, check_out, client_name, client_email, client_phone, guest_count, platform, status, total_price, currency, notes, source)
    VALUES (v_owner_id, v_gite2_id, '2026-03-26', '2026-03-30', 'Laurent et Claire Pons', 'lpons.claire@gmail.com', '07 21 32 43 54', 2, 'direct', 'confirmed', 340.00, 'EUR', 'Petit sejour printanier, 4 nuits.', 'manual');

    INSERT INTO public.reservations (owner_user_id, gite_id, check_in, check_out, client_name, client_email, client_phone, guest_count, platform, status, total_price, currency, notes, source)
    VALUES (v_owner_id, v_gite2_id, '2026-04-18', '2026-04-25', 'Jerome et Laure Vidal', 'j.vidal46@gmail.com', '06 11 22 33 44', 2, 'direct', 'confirmed', 595.00, 'EUR', 'Week-end printanier 2026.', 'manual');

    INSERT INTO public.reservations (owner_user_id, gite_id, check_in, check_out, client_name, client_email, client_phone, guest_count, platform, status, total_price, currency, notes, source)
    VALUES (v_owner_id, v_gite2_id, '2026-05-09', '2026-05-16', 'Sandrine Brunet', 'sandrine.b@free.fr', '06 98 87 76 65', 3, 'airbnb', 'confirmed', 595.00, 'EUR', 'Fin mai, calme et nature.', 'ical');

    INSERT INTO public.reservations (owner_user_id, gite_id, check_in, check_out, client_name, client_email, client_phone, guest_count, platform, status, total_price, currency, notes, source)
    VALUES (v_owner_id, v_gite2_id, '2026-07-11', '2026-07-18', 'Marianne Cassagne', 'mcassagne@hotmail.fr', '07 99 88 77 66', 3, 'airbnb', 'confirmed', 680.00, 'EUR', 'Juillet 2026 avec enfant.', 'ical');

    INSERT INTO public.reservations (owner_user_id, gite_id, check_in, check_out, client_name, client_email, client_phone, guest_count, platform, status, total_price, currency, notes, source)
    VALUES (v_owner_id, v_gite2_id, '2026-08-22', '2026-08-29', 'Bertrand et Eva Chevalier', 'bchevalier@sfr.fr', '06 42 53 64 75', 4, 'booking', 'confirmed', 680.00, 'EUR', 'Fin aout 2026, couple + 2 enfants.', 'ical');

    INSERT INTO public.reservations (owner_user_id, gite_id, check_in, check_out, client_name, client_email, client_phone, guest_count, platform, status, total_price, currency, notes, source)
    VALUES (v_owner_id, v_gite2_id, '2026-09-05', '2026-09-12', 'Arnaud Poulain', 'a.poulain@free.fr', '06 44 55 66 77', 2, 'abritel', 'confirmed', 595.00, 'EUR', 'Arriere saison 2026.', 'ical');

    INSERT INTO public.reservations (owner_user_id, gite_id, check_in, check_out, client_name, client_email, client_phone, guest_count, platform, status, total_price, currency, notes, source)
    VALUES (v_owner_id, v_gite2_id, '2026-11-07', '2026-11-14', 'Monique et Jean Touzet', 'mtouzet@wanadoo.fr', '07 31 42 53 64', 2, 'direct', 'pending', 595.00, 'EUR', 'Automne 2026, amoureux de la randonnee.', 'manual');

    -- === GITE 3 : La Ferme du Quercy (7 reservations) ===

    -- Dans les 2 prochaines semaines
    INSERT INTO public.reservations (owner_user_id, gite_id, check_in, check_out, client_name, client_email, client_phone, guest_count, platform, status, total_price, currency, notes, source)
    VALUES (v_owner_id, v_gite3_id, '2026-03-29', '2026-04-05', 'Association Rando Figeac', 'rando.figeac46@gmail.com', '07 56 67 78 89', 8, 'direct', 'confirmed', 945.00, 'EUR', 'Semaine de randonnee organisee, 8 pers.', 'manual');

    INSERT INTO public.reservations (owner_user_id, gite_id, check_in, check_out, client_name, client_email, client_phone, guest_count, platform, status, total_price, currency, notes, source)
    VALUES (v_owner_id, v_gite3_id, '2026-05-02', '2026-05-09', 'Groupe Randonneurs Lot', 'rando.lot46@gmail.com', '07 66 55 44 33', 7, 'direct', 'confirmed', 945.00, 'EUR', 'Groupe randonnee 2026.', 'manual');

    INSERT INTO public.reservations (owner_user_id, gite_id, check_in, check_out, client_name, client_email, client_phone, guest_count, platform, status, total_price, currency, notes, source)
    VALUES (v_owner_id, v_gite3_id, '2026-06-06', '2026-06-13', 'Famille Rousseau', 'famille.rousseau@gmail.com', '06 81 92 03 14', 7, 'abritel', 'confirmed', 945.00, 'EUR', 'Debut ete 2026, grande famille.', 'ical');

    INSERT INTO public.reservations (owner_user_id, gite_id, check_in, check_out, client_name, client_email, client_phone, guest_count, platform, status, total_price, currency, notes, source)
    VALUES (v_owner_id, v_gite3_id, '2026-07-25', '2026-08-01', 'Famille Deshayes', 'deshayes.famille@outlook.fr', '06 77 88 99 00', 8, 'booking', 'confirmed', 1080.00, 'EUR', 'Grande famille, haute saison 2026.', 'ical');

    INSERT INTO public.reservations (owner_user_id, gite_id, check_in, check_out, client_name, client_email, client_phone, guest_count, platform, status, total_price, currency, notes, source)
    VALUES (v_owner_id, v_gite3_id, '2026-08-29', '2026-09-05', 'Reunion famille Leconte', 'leconte-reunion@hotmail.fr', '07 43 54 65 76', 8, 'direct', 'confirmed', 1080.00, 'EUR', 'Reunion de famille fin ete 2026.', 'manual');

    INSERT INTO public.reservations (owner_user_id, gite_id, check_in, check_out, client_name, client_email, client_phone, guest_count, platform, status, total_price, currency, notes, source)
    VALUES (v_owner_id, v_gite3_id, '2026-10-11', '2026-10-18', 'Collectif Art et Randonnee', 'artrandonee.lot@gmail.com', '06 24 35 46 57', 6, 'direct', 'pending', 945.00, 'EUR', 'Sejour artistique en campagne lotoise.', 'manual');

    INSERT INTO public.reservations (owner_user_id, gite_id, check_in, check_out, client_name, client_email, client_phone, guest_count, platform, status, total_price, currency, notes, source)
    VALUES (v_owner_id, v_gite3_id, '2027-04-17', '2027-04-24', 'Thierry et Corinne Huet', 'thuet.corinne@gmail.com', '07 22 33 44 55', 6, 'airbnb', 'confirmed', 945.00, 'EUR', 'Paques 2027 reserves en avance.', 'ical');

    -- -----------------------------------------------------------------------
    -- 6. KM_TRAJETS (15 trajets sur 2024-2025)
    -- -----------------------------------------------------------------------

    INSERT INTO public.km_trajets (owner_user_id, gite_id, date_trajet, motif, type_trajet, lieu_arrivee, distance_aller, aller_retour, distance_totale)
    VALUES (v_owner_id, v_gite1_id, '2024-04-06', 'Etat des lieux entree Mercier', 'menage', 'Saint-Cirq-Lapopie', 12.5, true, 25.0);

    INSERT INTO public.km_trajets (owner_user_id, gite_id, date_trajet, motif, type_trajet, lieu_arrivee, distance_aller, aller_retour, distance_totale)
    VALUES (v_owner_id, v_gite1_id, '2024-04-13', 'Menage sortie Mercier', 'menage', 'Saint-Cirq-Lapopie', 12.5, true, 25.0);

    INSERT INTO public.km_trajets (owner_user_id, gite_id, date_trajet, motif, type_trajet, lieu_arrivee, distance_aller, aller_retour, distance_totale)
    VALUES (v_owner_id, v_gite1_id, '2024-04-27', 'Achat produits menage + accueil Blanchard', 'courses', 'Cahors Leclerc', 18.0, true, 36.0);

    INSERT INTO public.km_trajets (owner_user_id, gite_id, date_trajet, motif, type_trajet, lieu_arrivee, distance_aller, aller_retour, distance_totale)
    VALUES (v_owner_id, v_gite2_id, '2024-05-11', 'Accueil Girard + remise cles', 'menage', 'Calvignac', 8.0, true, 16.0);

    INSERT INTO public.km_trajets (owner_user_id, gite_id, date_trajet, motif, type_trajet, lieu_arrivee, distance_aller, aller_retour, distance_totale)
    VALUES (v_owner_id, v_gite2_id, '2024-05-18', 'Menage sortie Girard', 'menage', 'Calvignac', 8.0, true, 16.0);

    INSERT INTO public.km_trajets (owner_user_id, gite_id, date_trajet, motif, type_trajet, lieu_arrivee, distance_aller, aller_retour, distance_totale)
    VALUES (v_owner_id, v_gite1_id, '2024-07-05', 'Maintenance piscine avant haute saison', 'maintenance', 'Saint-Cirq-Lapopie', 12.5, true, 25.0);

    INSERT INTO public.km_trajets (owner_user_id, gite_id, date_trajet, motif, type_trajet, lieu_arrivee, distance_aller, aller_retour, distance_totale)
    VALUES (v_owner_id, v_gite3_id, '2024-06-29', 'Accueil famille Martin-Dupuy', 'menage', 'Figeac', 28.0, true, 56.0);

    INSERT INTO public.km_trajets (owner_user_id, gite_id, date_trajet, motif, type_trajet, lieu_arrivee, distance_aller, aller_retour, distance_totale)
    VALUES (v_owner_id, v_gite3_id, '2024-07-06', 'Menage sortie Martin-Dupuy', 'menage', 'Figeac', 28.0, true, 56.0);

    INSERT INTO public.km_trajets (owner_user_id, gite_id, date_trajet, motif, type_trajet, lieu_arrivee, distance_aller, aller_retour, distance_totale)
    VALUES (v_owner_id, v_gite1_id, '2024-08-16', 'Achat produits accueil haute saison', 'courses', 'Cahors Centre', 20.0, true, 40.0);

    INSERT INTO public.km_trajets (owner_user_id, gite_id, date_trajet, motif, type_trajet, lieu_arrivee, distance_aller, aller_retour, distance_totale)
    VALUES (v_owner_id, v_gite1_id, '2024-09-07', 'Petit reparation volet brise vent', 'maintenance', 'Saint-Cirq-Lapopie', 12.5, true, 25.0);

    INSERT INTO public.km_trajets (owner_user_id, gite_id, date_trajet, motif, type_trajet, lieu_arrivee, distance_aller, aller_retour, distance_totale)
    VALUES (v_owner_id, v_gite2_id, '2025-01-15', 'Controle chauffage hiver pigeonnier', 'maintenance', 'Calvignac', 8.0, true, 16.0);

    INSERT INTO public.km_trajets (owner_user_id, gite_id, date_trajet, motif, type_trajet, lieu_arrivee, distance_aller, aller_retour, distance_totale)
    VALUES (v_owner_id, v_gite1_id, '2025-03-20', 'Preparation ouverture saison piscine', 'maintenance', 'Saint-Cirq-Lapopie', 12.5, true, 25.0);

    INSERT INTO public.km_trajets (owner_user_id, gite_id, date_trajet, motif, type_trajet, lieu_arrivee, distance_aller, aller_retour, distance_totale)
    VALUES (v_owner_id, v_gite3_id, '2025-04-26', 'Accueil Sorel + courses potager', 'courses', 'Figeac', 28.0, true, 56.0);

    INSERT INTO public.km_trajets (owner_user_id, gite_id, date_trajet, motif, type_trajet, lieu_arrivee, distance_aller, aller_retour, distance_totale)
    VALUES (v_owner_id, v_gite1_id, '2025-07-11', 'Preparation sejour haute saison + accueil', 'menage', 'Saint-Cirq-Lapopie', 12.5, true, 25.0);

    INSERT INTO public.km_trajets (owner_user_id, gite_id, date_trajet, motif, type_trajet, lieu_arrivee, distance_aller, aller_retour, distance_totale)
    VALUES (v_owner_id, v_gite2_id, '2025-08-16', 'Menage entree Descamps', 'menage', 'Calvignac', 8.0, true, 16.0);

    -- -----------------------------------------------------------------------
    -- 7. SIMULATIONS FISCALES (annees 2024 et 2025)
    -- -----------------------------------------------------------------------
    -- CA 2024 : 13x~851 + 11x~636 + 9x~1013 = 11063 + 6996 + 9117 = ~27176 EUR
    -- CA 2025 : 3x~882 + 3x~652 + 3x~1035 = 2646 + 1956 + 3105 = ~7707 EUR

    INSERT INTO public.simulations_fiscales (
        owner_user_id, annee, chiffre_affaires, charges_totales,
        regime, tmi, rfr,
        versement_liberatoire, meuble_classe,
        resultat_fiscal, ir_du, urssaf_du, total_a_payer,
        donnees_detaillees
    ) VALUES (
        v_owner_id, 2024, 27176.00, 3200.00,
        'micro_bnb', 30.00, 52000.00,
        false, false,
        18021.40, 5406.42, 2963.20, 8369.62,
        jsonb_build_object(
            'abattement_pct', 50,
            'base_imposable', 13588.00,
            'nb_reservations', 33,
            'gites', jsonb_build_array('Le Mas du Cele', 'Le Pigeonnier de Calvignac', 'La Ferme du Quercy'),
            'source', 'simulation_auto_2024'
        )
    );

    INSERT INTO public.simulations_fiscales (
        owner_user_id, annee, chiffre_affaires, charges_totales,
        regime, tmi, rfr,
        versement_liberatoire, meuble_classe,
        resultat_fiscal, ir_du, urssaf_du, total_a_payer,
        donnees_detaillees
    ) VALUES (
        v_owner_id, 2025, 7707.00, 980.00,
        'micro_bnb', 30.00, 48500.00,
        false, false,
        2873.50, 862.05, 840.06, 1702.11,
        jsonb_build_object(
            'abattement_pct', 50,
            'base_imposable', 3853.50,
            'nb_reservations', 9,
            'gites', jsonb_build_array('Le Mas du Cele', 'Le Pigeonnier de Calvignac', 'La Ferme du Quercy'),
            'source', 'simulation_auto_2025',
            'note', 'Annee partielle (au 24/03/2026)'
        )
    );

    -- -----------------------------------------------------------------------
    -- Recap final
    -- -----------------------------------------------------------------------
    RAISE NOTICE '=== INJECTION TERMINEE ===';
    RAISE NOTICE 'Owner : stephanecalvignac@hotmail.com (id=%)', v_owner_id;
    RAISE NOTICE 'Gite 1 [Le Mas du Cele]            : %', v_gite1_id;
    RAISE NOTICE 'Gite 2 [Le Pigeonnier de Calvignac]: %', v_gite2_id;
    RAISE NOTICE 'Gite 3 [La Ferme du Quercy]        : %', v_gite3_id;
    RAISE NOTICE '22 reservations futures (2026-2027, dont 3 dans les 2 prochaines semaines) + 15 km_trajets + 2 simulations_fiscales + 1 cm_clients (trial quattro annuel)';
    RAISE NOTICE 'Prochaines arrivees : Gite2=26/03, Gite1=28/03, Gite3=29/03';

END $$;
