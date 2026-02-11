-- ============================================================================
-- FIX CRITIQUE : Ajouter colonnes ID manquantes
-- ============================================================================
-- DATE : 28 Janvier 2026
-- PROBLÈME : CREATE TABLE AS SELECT ne copie pas les colonnes avec DEFAULT
-- IMPACT : Impossible de créer ou modifier des demandes (erreur UUID "null")
-- SOLUTION : Ajouter manuellement les colonnes id avec génération auto
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. FIX demandes_horaires
-- ============================================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'demandes_horaires' 
        AND column_name = 'id'
    ) THEN
        RAISE NOTICE '📝 Ajout de la colonne id à demandes_horaires...';
        
        ALTER TABLE demandes_horaires 
        ADD COLUMN id UUID DEFAULT gen_random_uuid() PRIMARY KEY;
        
        RAISE NOTICE '✅ Colonne id ajoutée à demandes_horaires';
    ELSE
        RAISE NOTICE '⚠️ Colonne id existe déjà dans demandes_horaires';
        
        -- Vérifier si c'est une PRIMARY KEY
        IF NOT EXISTS (
            SELECT 1 
            FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu 
                ON tc.constraint_name = kcu.constraint_name
            WHERE tc.table_name = 'demandes_horaires' 
            AND tc.constraint_type = 'PRIMARY KEY'
            AND kcu.column_name = 'id'
        ) THEN
            -- Générer des UUIDs pour les lignes existantes
            UPDATE demandes_horaires SET id = gen_random_uuid() WHERE id IS NULL;
            
            -- Définir comme primary key
            ALTER TABLE demandes_horaires ADD PRIMARY KEY (id);
            
            RAISE NOTICE '✅ id défini comme PRIMARY KEY sur demandes_horaires';
        END IF;
    END IF;
    
    -- S'assurer du default
    ALTER TABLE demandes_horaires 
    ALTER COLUMN id SET DEFAULT gen_random_uuid();
END $$;

-- ============================================================================
-- 2. FIX problemes_signales
-- ============================================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'problemes_signales' 
        AND column_name = 'id'
    ) THEN
        RAISE NOTICE '📝 Ajout de la colonne id à problemes_signales...';
        
        ALTER TABLE problemes_signales 
        ADD COLUMN id UUID DEFAULT gen_random_uuid() PRIMARY KEY;
        
        RAISE NOTICE '✅ Colonne id ajoutée à problemes_signales';
    ELSE
        RAISE NOTICE '⚠️ Colonne id existe déjà dans problemes_signales';
        
        -- Vérifier si c'est une PRIMARY KEY
        IF NOT EXISTS (
            SELECT 1 
            FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu 
                ON tc.constraint_name = kcu.constraint_name
            WHERE tc.table_name = 'problemes_signales' 
            AND tc.constraint_type = 'PRIMARY KEY'
            AND kcu.column_name = 'id'
        ) THEN
            -- Générer des UUIDs pour les lignes existantes
            UPDATE problemes_signales SET id = gen_random_uuid() WHERE id IS NULL;
            
            -- Définir comme primary key
            ALTER TABLE problemes_signales ADD PRIMARY KEY (id);
            
            RAISE NOTICE '✅ id défini comme PRIMARY KEY sur problemes_signales';
        END IF;
    END IF;
    
    -- S'assurer du default
    ALTER TABLE problemes_signales 
    ALTER COLUMN id SET DEFAULT gen_random_uuid();
END $$;

COMMIT;

-- ============================================================================
-- VÉRIFICATION
-- ============================================================================

-- Vérifier demandes_horaires
SELECT 
    'demandes_horaires' as table_name,
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'demandes_horaires'
AND column_name = 'id'

UNION ALL

-- Vérifier problemes_signales
SELECT 
    'problemes_signales' as table_name,
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'problemes_signales'
AND column_name = 'id';

-- Compter les enregistrements
SELECT 
    'demandes_horaires' as table_name,
    COUNT(*) as total_records,
    COUNT(id) as records_with_id
FROM demandes_horaires

UNION ALL

SELECT 
    'problemes_signales' as table_name,
    COUNT(*) as total_records,
    COUNT(id) as records_with_id
FROM problemes_signales;
