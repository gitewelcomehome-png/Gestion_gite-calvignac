-- ==========================================
-- DIAGNOSTIC COMPLET: Pourquoi l'erreur 406 ?
-- ==========================================

-- 1. Vérifier que la table existe
SELECT 
    schemaname, 
    tablename, 
    tableowner
FROM pg_tables 
WHERE tablename = 'infos_gites';

-- 2. Vérifier le schéma de la table
SELECT 
    table_schema,
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_name = 'infos_gites';

-- 3. Vérifier les permissions détaillées
SELECT 
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.table_privileges 
WHERE table_name = 'infos_gites'
ORDER BY grantee, privilege_type;

-- 4. Vérifier les policies RLS
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'infos_gites';

-- 5. Vérifier si RLS est actif
SELECT 
    relname,
    relrowsecurity as rls_enabled,
    relforcerowsecurity as rls_forced
FROM pg_class 
WHERE relname = 'infos_gites';

-- 6. Vérifier les colonnes
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'infos_gites'
ORDER BY ordinal_position
LIMIT 10;

-- 7. Compter les lignes
SELECT COUNT(*) as total_rows FROM infos_gites;

-- 8. Vérifier l'exposition dans l'API (via pg_catalog)
SELECT 
    n.nspname as schema_name,
    c.relname as table_name,
    c.relkind as table_type,
    CASE 
        WHEN c.relrowsecurity THEN 'RLS Enabled'
        ELSE 'No RLS'
    END as security_status
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE c.relname = 'infos_gites' 
AND n.nspname = 'public';
