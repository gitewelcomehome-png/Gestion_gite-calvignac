-- ==========================================
-- FIX COMPLET: Permissions PostgREST pour infos_gites
-- L'erreur 406 vient d'un problème de permissions PostgREST
-- ==========================================

-- 1. Supprimer et recréer la table proprement
DROP TABLE IF EXISTS infos_gites CASCADE;

CREATE TABLE infos_gites (
    id SERIAL PRIMARY KEY,
    gite VARCHAR(50) UNIQUE NOT NULL,
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Section 1: Base
    adresse TEXT,
    telephone TEXT,
    gps_lat TEXT,
    gps_lon TEXT,
    email TEXT,
    adresse_en TEXT,
    telephone_en TEXT,
    email_en TEXT,
    
    -- Section 2: WiFi
    wifi_ssid TEXT,
    wifi_password TEXT,
    wifi_debit TEXT,
    wifi_localisation TEXT,
    wifi_zones TEXT,
    wifi_ssid_en TEXT,
    wifi_password_en TEXT,
    wifi_debit_en TEXT,
    wifi_localisation_en TEXT,
    wifi_zones_en TEXT,
    
    -- Section 3: Arrivée
    heure_arrivee TEXT,
    arrivee_tardive TEXT,
    parking_dispo TEXT,
    parking_places TEXT,
    parking_details TEXT,
    type_acces TEXT,
    code_acces TEXT,
    instructions_cles TEXT,
    etage TEXT,
    heure_arrivee_en TEXT,
    arrivee_tardive_en TEXT,
    parking_dispo_en TEXT,
    parking_places_en TEXT,
    parking_details_en TEXT,
    type_acces_en TEXT,
    code_acces_en TEXT,
    instructions_cles_en TEXT,
    etage_en TEXT,
    
    -- Section 4: Logement
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
    
    -- Section 5: Déchets
    instructions_tri TEXT,
    jours_collecte TEXT,
    decheterie TEXT,
    instructions_tri_en TEXT,
    jours_collecte_en TEXT,
    decheterie_en TEXT,
    
    -- Section 6: Sécurité
    detecteur_fumee TEXT,
    extincteur TEXT,
    coupure_eau TEXT,
    disjoncteur TEXT,
    consignes_urgence TEXT,
    detecteur_fumee_en TEXT,
    extincteur_en TEXT,
    coupure_eau_en TEXT,
    disjoncteur_en TEXT,
    consignes_urgence_en TEXT,
    
    -- Section 7: Départ
    heure_depart TEXT,
    depart_tardif TEXT,
    checklist_depart TEXT,
    restitution_cles TEXT,
    heure_depart_en TEXT,
    depart_tardif_en TEXT,
    checklist_depart_en TEXT,
    restitution_cles_en TEXT,
    
    -- Section 8: Règlement
    tabac TEXT,
    animaux TEXT,
    nb_max_personnes TEXT,
    caution TEXT,
    tabac_en TEXT,
    animaux_en TEXT,
    nb_max_personnes_en TEXT,
    caution_en TEXT,
    
    date_creation TIMESTAMP DEFAULT NOW(),
    date_modification TIMESTAMP DEFAULT NOW()
);

-- 2. Donner les permissions EXPLICITES à PostgREST (rôle anon + authenticated)
GRANT SELECT, INSERT, UPDATE, DELETE ON infos_gites TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON infos_gites TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE infos_gites_id_seq TO anon;
GRANT USAGE, SELECT ON SEQUENCE infos_gites_id_seq TO authenticated;

-- 3. Activer RLS
ALTER TABLE infos_gites ENABLE ROW LEVEL SECURITY;

-- 4. Policies RLS (IMPORTANT: avec anon ET authenticated)
CREATE POLICY "Utilisateurs peuvent voir leurs infos"
    ON infos_gites FOR SELECT
    TO authenticated
    USING (auth.uid() = owner_user_id);

CREATE POLICY "Utilisateurs peuvent insérer leurs infos"
    ON infos_gites FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = owner_user_id);

CREATE POLICY "Utilisateurs peuvent modifier leurs infos"
    ON infos_gites FOR UPDATE
    TO authenticated
    USING (auth.uid() = owner_user_id);

CREATE POLICY "Utilisateurs peuvent supprimer leurs infos"
    ON infos_gites FOR DELETE
    TO authenticated
    USING (auth.uid() = owner_user_id);

-- 5. Vérification des permissions
SELECT 
    'Permissions anon:' as check_type,
    string_agg(privilege_type, ', ') as privileges
FROM information_schema.table_privileges
WHERE table_name = 'infos_gites' AND grantee = 'anon';

SELECT 
    'Permissions authenticated:' as check_type,
    string_agg(privilege_type, ', ') as privileges
FROM information_schema.table_privileges
WHERE table_name = 'infos_gites' AND grantee = 'authenticated';

-- 6. Test de fonctionnement
SELECT 'Table accessible via PostgREST' as test_result;
