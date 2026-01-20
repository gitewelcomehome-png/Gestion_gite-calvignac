-- ==========================================
-- MIGRATION : Ajout colonne type_amortissement
-- Date : 19/01/2026
-- Objectif : Stocker le type d'amortissement choisi manuellement par l'utilisateur
-- ==========================================

-- Ajouter la colonne type_amortissement si elle n'existe pas
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'fiscalite_amortissements' 
        AND column_name = 'type_amortissement'
    ) THEN
        ALTER TABLE public.fiscalite_amortissements 
        ADD COLUMN type_amortissement TEXT;
        
        RAISE NOTICE 'Colonne type_amortissement ajoutée à fiscalite_amortissements';
    ELSE
        RAISE NOTICE 'Colonne type_amortissement existe déjà';
    END IF;
END $$;

-- Commentaire sur la nouvelle colonne
COMMENT ON COLUMN public.fiscalite_amortissements.type_amortissement IS 'Type d''amortissement choisi manuellement : informatique, electromenager, mobilier, equipement, renovation_legere, gros_travaux, ou autre';

-- Vérifier que la colonne a bien été ajoutée
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'fiscalite_amortissements'
AND column_name = 'type_amortissement';
