-- ==========================================
-- MIGRATION COMPLÈTE: Ajouter TOUTES les colonnes manquantes
-- ==========================================

-- Section 3: Arrivée - Colonnes manquantes
ALTER TABLE infos_gites ADD COLUMN IF NOT EXISTS ascenseur TEXT;
ALTER TABLE infos_gites ADD COLUMN IF NOT EXISTS ascenseur_en TEXT;
ALTER TABLE infos_gites ADD COLUMN IF NOT EXISTS itineraire_logement TEXT;
ALTER TABLE infos_gites ADD COLUMN IF NOT EXISTS itineraire_logement_en TEXT;
ALTER TABLE infos_gites ADD COLUMN IF NOT EXISTS premiere_visite TEXT;
ALTER TABLE infos_gites ADD COLUMN IF NOT EXISTS premiere_visite_en TEXT;

-- Section 4: Logement - Colonnes manquantes (en camelCase dans JS mais snake_case en SQL)
ALTER TABLE infos_gites ADD COLUMN IF NOT EXISTS type_chauffage TEXT;
ALTER TABLE infos_gites ADD COLUMN IF NOT EXISTS type_chauffage_en TEXT;
ALTER TABLE infos_gites ADD COLUMN IF NOT EXISTS climatisation TEXT;
ALTER TABLE infos_gites ADD COLUMN IF NOT EXISTS climatisation_en TEXT;
ALTER TABLE infos_gites ADD COLUMN IF NOT EXISTS instructions_chauffage TEXT;
ALTER TABLE infos_gites ADD COLUMN IF NOT EXISTS instructions_chauffage_en TEXT;
ALTER TABLE infos_gites ADD COLUMN IF NOT EXISTS equipements_cuisine TEXT;
ALTER TABLE infos_gites ADD COLUMN IF NOT EXISTS equipements_cuisine_en TEXT;
ALTER TABLE infos_gites ADD COLUMN IF NOT EXISTS instructions_four TEXT;
ALTER TABLE infos_gites ADD COLUMN IF NOT EXISTS instructions_four_en TEXT;
ALTER TABLE infos_gites ADD COLUMN IF NOT EXISTS instructions_plaques TEXT;
ALTER TABLE infos_gites ADD COLUMN IF NOT EXISTS instructions_plaques_en TEXT;
ALTER TABLE infos_gites ADD COLUMN IF NOT EXISTS instructions_lave_vaisselle TEXT;
ALTER TABLE infos_gites ADD COLUMN IF NOT EXISTS instructions_lave_vaisselle_en TEXT;
ALTER TABLE infos_gites ADD COLUMN IF NOT EXISTS instructions_lave_linge TEXT;
ALTER TABLE infos_gites ADD COLUMN IF NOT EXISTS instructions_lave_linge_en TEXT;
ALTER TABLE infos_gites ADD COLUMN IF NOT EXISTS seche_linge TEXT;
ALTER TABLE infos_gites ADD COLUMN IF NOT EXISTS seche_linge_en TEXT;
ALTER TABLE infos_gites ADD COLUMN IF NOT EXISTS fer_repasser TEXT;
ALTER TABLE infos_gites ADD COLUMN IF NOT EXISTS fer_repasser_en TEXT;
ALTER TABLE infos_gites ADD COLUMN IF NOT EXISTS linge_fourni TEXT;
ALTER TABLE infos_gites ADD COLUMN IF NOT EXISTS linge_fourni_en TEXT;
ALTER TABLE infos_gites ADD COLUMN IF NOT EXISTS configuration_chambres TEXT;
ALTER TABLE infos_gites ADD COLUMN IF NOT EXISTS configuration_chambres_en TEXT;

-- Vérification
SELECT 
    'Total colonnes après migration:' as info,
    COUNT(*) as nombre
FROM information_schema.columns 
WHERE table_name = 'infos_gites';

SELECT 
    'Colonnes _en:' as info,
    COUNT(*) as nombre
FROM information_schema.columns 
WHERE table_name = 'infos_gites' 
AND column_name LIKE '%\_en';

-- Liste des nouvelles colonnes
SELECT 
    column_name
FROM information_schema.columns 
WHERE table_name = 'infos_gites'
AND column_name IN (
    'ascenseur', 'ascenseur_en',
    'itineraire_logement', 'itineraire_logement_en',
    'premiere_visite', 'premiere_visite_en',
    'type_chauffage', 'type_chauffage_en',
    'climatisation', 'climatisation_en',
    'instructions_chauffage', 'instructions_chauffage_en',
    'equipements_cuisine', 'equipements_cuisine_en',
    'instructions_four', 'instructions_four_en',
    'instructions_plaques', 'instructions_plaques_en',
    'instructions_lave_vaisselle', 'instructions_lave_vaisselle_en',
    'instructions_lave_linge', 'instructions_lave_linge_en',
    'seche_linge', 'seche_linge_en',
    'fer_repasser', 'fer_repasser_en',
    'linge_fourni', 'linge_fourni_en',
    'configuration_chambres', 'configuration_chambres_en'
)
ORDER BY column_name;
