-- ==========================================
-- AUDIT COMPLET: Vérifier toutes les colonnes de infos_gites
-- ==========================================

-- 1. Lister TOUTES les colonnes actuelles
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'infos_gites' 
ORDER BY ordinal_position;

-- 2. Compter le total de colonnes
SELECT 
    COUNT(*) as total_colonnes
FROM information_schema.columns 
WHERE table_name = 'infos_gites';

-- 3. Vérifier les colonnes _en spécifiquement
SELECT 
    'Colonnes _en:' as type,
    COUNT(*) as nombre
FROM information_schema.columns 
WHERE table_name = 'infos_gites' 
AND column_name LIKE '%\_en';

-- 4. Liste des colonnes _en
SELECT 
    column_name
FROM information_schema.columns 
WHERE table_name = 'infos_gites' 
AND column_name LIKE '%\_en'
ORDER BY column_name;

-- 5. Vérifier les données existantes
SELECT 
    gite,
    adresse,
    adresse_en,
    wifi_ssid,
    wifi_ssid_en,
    heure_arrivee,
    heure_arrivee_en
FROM infos_gites
LIMIT 5;
