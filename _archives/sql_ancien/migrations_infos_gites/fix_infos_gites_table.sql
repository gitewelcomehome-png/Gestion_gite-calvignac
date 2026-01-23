-- ==========================================
-- FIX: Table infos_gites manquante
-- À exécuter dans Supabase SQL Editor
-- ==========================================

-- 1. Vérifier si la table existe
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'infos_gites') THEN
        RAISE NOTICE '❌ Table infos_gites n''existe pas - Création...';
        
        -- Créer la table
        CREATE TABLE infos_gites (
            id SERIAL PRIMARY KEY,
            gite VARCHAR(50) UNIQUE NOT NULL,
            owner_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
            
            -- Section 1: Base (FR)
            adresse TEXT,
            telephone TEXT,
            gps_lat TEXT,
            gps_lon TEXT,
            email TEXT,
            
            -- Section 1: Base (EN)
            adresse_en TEXT,
            telephone_en TEXT,
            email_en TEXT,
            
            -- Section 2: WiFi (FR)
            wifi_ssid TEXT,
            wifi_password TEXT,
            wifi_debit TEXT,
            wifi_localisation TEXT,
            wifi_zones TEXT,
            
            -- Section 2: WiFi (EN)
            wifi_ssid_en TEXT,
            wifi_password_en TEXT,
            wifi_debit_en TEXT,
            wifi_localisation_en TEXT,
            wifi_zones_en TEXT,
            
            -- Section 3: Arrivée (FR)
            heure_arrivee TEXT,
            arrivee_tardive TEXT,
            parking_dispo TEXT,
            parking_places TEXT,
            parking_details TEXT,
            type_acces TEXT,
            code_acces TEXT,
            instructions_cles TEXT,
            etage TEXT,
            
            -- Section 3: Arrivée (EN)
            heure_arrivee_en TEXT,
            arrivee_tardive_en TEXT,
            parking_dispo_en TEXT,
            parking_places_en TEXT,
            parking_details_en TEXT,
            type_acces_en TEXT,
            code_acces_en TEXT,
            instructions_cles_en TEXT,
            etage_en TEXT,
            
            -- Section 4: Logement (FR)
            chauffage TEXT,
            eau_chaude TEXT,
            cuisine_details TEXT,
            four TEXT,
            micro_ondes TEXT,
            cafetiere TEXT,
            lave_vaisselle TEXT,
            lave_linge TEXT,
            seche_linge TEXT,
            fer_repasser TEXT,
            linge_fourni TEXT,
            configuration_chambres TEXT,
            
            -- Section 4: Logement (EN)
            chauffage_en TEXT,
            eau_chaude_en TEXT,
            cuisine_details_en TEXT,
            four_en TEXT,
            micro_ondes_en TEXT,
            cafetiere_en TEXT,
            lave_vaisselle_en TEXT,
            lave_linge_en TEXT,
            seche_linge_en TEXT,
            fer_repasser_en TEXT,
            linge_fourni_en TEXT,
            configuration_chambres_en TEXT,
            
            -- Section 5: Déchets (FR)
            instructions_tri TEXT,
            jours_collecte TEXT,
            decheterie TEXT,
            
            -- Section 5: Déchets (EN)
            instructions_tri_en TEXT,
            jours_collecte_en TEXT,
            decheterie_en TEXT,
            
            -- Section 6: Sécurité (FR)
            detecteur_fumee TEXT,
            extincteur TEXT,
            coupure_eau TEXT,
            disjoncteur TEXT,
            consignes_urgence TEXT,
            
            -- Section 6: Sécurité (EN)
            detecteur_fumee_en TEXT,
            extincteur_en TEXT,
            coupure_eau_en TEXT,
            disjoncteur_en TEXT,
            consignes_urgence_en TEXT,
            
            -- Section 7: Départ (FR)
            heure_depart TEXT,
            depart_tardif TEXT,
            checklist_depart TEXT,
            restitution_cles TEXT,
            
            -- Section 7: Départ (EN)
            heure_depart_en TEXT,
            depart_tardif_en TEXT,
            checklist_depart_en TEXT,
            restitution_cles_en TEXT,
            
            -- Section 8: Règlement (FR)
            tabac TEXT,
            animaux TEXT,
            nb_max_personnes TEXT,
            caution TEXT,
            
            -- Section 8: Règlement (EN)
            tabac_en TEXT,
            animaux_en TEXT,
            nb_max_personnes_en TEXT,
            caution_en TEXT,
            
            -- Métadonnées
            date_creation TIMESTAMP DEFAULT NOW(),
            date_modification TIMESTAMP DEFAULT NOW()
        );
        
        RAISE NOTICE '✅ Table infos_gites créée';
    ELSE
        RAISE NOTICE '✅ Table infos_gites existe déjà';
    END IF;
END $$;

-- 2. Activer RLS
ALTER TABLE infos_gites ENABLE ROW LEVEL SECURITY;

-- 3. Supprimer les anciennes policies si elles existent
DROP POLICY IF EXISTS "Utilisateurs peuvent voir leurs propres infos gîtes" ON infos_gites;
DROP POLICY IF EXISTS "Utilisateurs peuvent insérer leurs propres infos gîtes" ON infos_gites;
DROP POLICY IF EXISTS "Utilisateurs peuvent modifier leurs propres infos gîtes" ON infos_gites;
DROP POLICY IF EXISTS "Utilisateurs peuvent supprimer leurs propres infos gîtes" ON infos_gites;

-- 4. Créer les policies RLS
CREATE POLICY "Utilisateurs peuvent voir leurs propres infos gîtes"
    ON infos_gites FOR SELECT
    USING (auth.uid() = owner_user_id);

CREATE POLICY "Utilisateurs peuvent insérer leurs propres infos gîtes"
    ON infos_gites FOR INSERT
    WITH CHECK (auth.uid() = owner_user_id);

CREATE POLICY "Utilisateurs peuvent modifier leurs propres infos gîtes"
    ON infos_gites FOR UPDATE
    USING (auth.uid() = owner_user_id);

CREATE POLICY "Utilisateurs peuvent supprimer leurs propres infos gîtes"
    ON infos_gites FOR DELETE
    USING (auth.uid() = owner_user_id);

-- 5. Vérification finale
SELECT 
    'infos_gites' as table_name,
    COUNT(*) as nombre_lignes,
    (SELECT relrowsecurity FROM pg_class WHERE relname = 'infos_gites') as rls_actif
FROM infos_gites;
