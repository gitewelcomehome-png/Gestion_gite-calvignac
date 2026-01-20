-- ================================================================
-- VÉRIFICATION ET AJOUT DE LA COLONNE gite_id DANS TODOS
-- ================================================================
-- Date: 15 janvier 2026
-- Contexte: Erreur "Could not find the 'gite_id' column of 'todos'"

-- 1. Vérifier si la colonne existe
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'todos'
    AND column_name = 'gite_id';

-- 2. Si elle n'existe pas, l'ajouter
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'todos' 
        AND column_name = 'gite_id'
    ) THEN
        ALTER TABLE todos ADD COLUMN gite_id UUID REFERENCES gites(id) ON DELETE CASCADE;
        RAISE NOTICE '✅ Colonne gite_id ajoutée à la table todos';
    ELSE
        RAISE NOTICE '✅ Colonne gite_id existe déjà';
    END IF;
END $$;

-- 3. Vérifier la structure complète de la table todos
SELECT 
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'todos'
ORDER BY ordinal_position;
