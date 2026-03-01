-- ==========================================
-- AJOUT COLONNE charges_fiscales
-- Date: 15 février 2026
-- ==========================================

-- Ajouter la colonne charges_fiscales si elle n'existe pas
ALTER TABLE prestations_catalogue 
ADD COLUMN IF NOT EXISTS charges_fiscales DECIMAL(10,2) DEFAULT 0 CHECK (charges_fiscales >= 0);

-- Vérification
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'prestations_catalogue' 
AND column_name = 'charges_fiscales';
