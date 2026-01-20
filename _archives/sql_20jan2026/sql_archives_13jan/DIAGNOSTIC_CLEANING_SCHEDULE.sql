-- ================================================================
-- DIAGNOSTIC COMPLET: cleaning_schedule
-- ================================================================
-- Ce script analyse l'état actuel de la table cleaning_schedule
-- ================================================================

-- 1. Vérifier si la table existe
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_name = 'cleaning_schedule'
        ) THEN '✅ Table cleaning_schedule existe'
        ELSE '❌ Table cleaning_schedule n''existe PAS'
    END as table_status;

-- 2. Lister TOUTES les colonnes actuelles
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'cleaning_schedule'
ORDER BY ordinal_position;

-- 3. Vérifier les contraintes
SELECT
    conname as constraint_name,
    contype as constraint_type
FROM pg_constraint
WHERE conrelid = 'cleaning_schedule'::regclass;

-- 4. Vérifier les index
SELECT
    indexname as index_name,
    indexdef as index_definition
FROM pg_indexes
WHERE tablename = 'cleaning_schedule';

-- 5. Vérifier les foreign keys
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = 'cleaning_schedule';

-- 6. Compter les enregistrements
SELECT COUNT(*) as nombre_lignes FROM cleaning_schedule;

-- 7. Voir un échantillon des données (5 premières lignes)
SELECT * FROM cleaning_schedule LIMIT 5;
