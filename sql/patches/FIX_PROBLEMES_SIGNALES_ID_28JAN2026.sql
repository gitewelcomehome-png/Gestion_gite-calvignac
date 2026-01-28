-- ============================================================================
-- FIX : Ajouter colonne ID manquante à problemes_signales
-- ============================================================================
-- PROBLÈME : CREATE TABLE AS SELECT ne copie pas la définition de l'id auto-généré
-- SOLUTION : Ajouter manuellement une colonne id de type UUID avec génération auto
-- ============================================================================

BEGIN;

-- 1. Vérifier si la colonne id existe déjà
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'problemes_signales' 
        AND column_name = 'id'
    ) THEN
        -- Ajouter la colonne id
        ALTER TABLE problemes_signales 
        ADD COLUMN id UUID DEFAULT gen_random_uuid() PRIMARY KEY;
        
        RAISE NOTICE '✅ Colonne id ajoutée à problemes_signales';
    ELSE
        -- Si id existe mais n'est pas primary key
        IF NOT EXISTS (
            SELECT 1 
            FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu 
                ON tc.constraint_name = kcu.constraint_name
            WHERE tc.table_name = 'problemes_signales' 
            AND tc.constraint_type = 'PRIMARY KEY'
            AND kcu.column_name = 'id'
        ) THEN
            -- Ajouter une valeur par défaut si NULL
            UPDATE problemes_signales SET id = gen_random_uuid() WHERE id IS NULL;
            
            -- Définir comme primary key
            ALTER TABLE problemes_signales ADD PRIMARY KEY (id);
            
            RAISE NOTICE '✅ id défini comme PRIMARY KEY sur problemes_signales';
        ELSE
            RAISE NOTICE '⚠️ Colonne id existe déjà et est PRIMARY KEY';
        END IF;
    END IF;
END $$;

-- 2. Ajouter un default pour les insertions futures (si pas déjà présent)
ALTER TABLE problemes_signales 
ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- 3. Vérification finale
SELECT 
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'problemes_signales'
AND column_name = 'id';

COMMIT;
