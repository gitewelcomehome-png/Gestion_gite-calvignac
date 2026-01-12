-- ================================================================
-- DIAGNOSTIC COMPLET DE LA BASE DE DONNÉES
-- ================================================================
-- Exécutez ce script pour voir l'état actuel de votre base
-- ================================================================

-- 1. Vérifier quelles tables existent
SELECT 
    'TABLE EXISTANTE: ' || table_name as info
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 2. Vérifier si owner_user_id existe sur chaque table
SELECT 
    t.table_name,
    CASE WHEN c.column_name IS NOT NULL THEN '✅ owner_user_id EXISTE' ELSE '❌ owner_user_id MANQUANT' END as status,
    c.is_nullable,
    c.data_type
FROM information_schema.tables t
LEFT JOIN information_schema.columns c 
    ON t.table_name = c.table_name 
    AND c.column_name = 'owner_user_id'
WHERE t.table_schema = 'public'
  AND t.table_type = 'BASE TABLE'
  AND t.table_name NOT LIKE 'pg_%'
ORDER BY t.table_name;

-- 3. Compter les données dans les tables principales
DO $$
DECLARE
    table_record RECORD;
    row_count INTEGER;
BEGIN
    RAISE NOTICE '=== NOMBRE DE LIGNES PAR TABLE ===';
    
    FOR table_record IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_type = 'BASE TABLE'
        ORDER BY table_name
    LOOP
        EXECUTE format('SELECT COUNT(*) FROM %I', table_record.table_name) INTO row_count;
        RAISE NOTICE 'Table %: % lignes', table_record.table_name, row_count;
    END LOOP;
END $$;

-- 4. Vérifier les utilisateurs dans auth.users
SELECT 
    COUNT(*) as nombre_utilisateurs,
    MIN(created_at) as premier_utilisateur_date
FROM auth.users;

SELECT 
    id,
    email,
    created_at
FROM auth.users
ORDER BY created_at
LIMIT 5;

-- 5. Vérifier les colonnes manquantes dans cleaning_schedule
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'cleaning_schedule'
ORDER BY ordinal_position;

-- 6. Vérifier les colonnes dans reservations
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'reservations'
ORDER BY ordinal_position;
