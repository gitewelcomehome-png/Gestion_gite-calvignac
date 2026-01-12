-- ================================================================
-- DIAGNOSTIC COMPLET : État réel de la base de données
-- ================================================================

-- 1. Vérifier les colonnes réelles de la table organizations
SELECT 
    'organizations' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'organizations'
ORDER BY ordinal_position;

-- 2. Vérifier les colonnes réelles de la table gites
SELECT 
    'gites' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'gites'
ORDER BY ordinal_position;

-- 3. Vérifier l'état RLS
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public' 
AND tablename IN ('organizations', 'gites', 'organization_members')
ORDER BY tablename;

-- 4. Vérifier les fonctions disponibles
SELECT 
    proname as function_name,
    pronargs as arg_count
FROM pg_proc
WHERE proname LIKE '%onboarding%'
   OR proname LIKE '%organization%';

-- 5. Tester si PostgREST voit la table
-- Copie ce résultat et dis-moi ce que tu vois
