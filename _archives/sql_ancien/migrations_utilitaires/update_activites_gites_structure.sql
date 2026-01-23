-- ==========================================
-- MISE À JOUR STRUCTURE activites_gites
-- Ajout: adresse, note, nb_avis
-- Suppression: horaires, tarifs
-- ==========================================

-- Ajouter les nouvelles colonnes
ALTER TABLE activites_gites 
ADD COLUMN IF NOT EXISTS adresse TEXT,
ADD COLUMN IF NOT EXISTS note NUMERIC(2,1) CHECK (note >= 0 AND note <= 5),
ADD COLUMN IF NOT EXISTS nb_avis INTEGER CHECK (nb_avis >= 0);

-- Supprimer les anciennes colonnes (si elles existent)
ALTER TABLE activites_gites 
DROP COLUMN IF EXISTS horaires,
DROP COLUMN IF EXISTS tarifs;

-- Vérifier la structure finale
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'activites_gites' 
ORDER BY ordinal_position;
