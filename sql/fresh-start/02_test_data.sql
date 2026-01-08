-- ================================================================
-- TEST ONBOARDING - À exécuter APRÈS avoir testé l'interface
-- ================================================================
-- Ce script vérifie que l'onboarding a correctement créé les données
-- ================================================================

-- 1. Vérifier qu'une organization existe
SELECT 
    'ORGANIZATIONS' as table_name,
    count(*) as count,
    CASE 
        WHEN count(*) > 0 THEN '✅ OK'
        ELSE '❌ AUCUNE ORGANIZATION'
    END as status
FROM organizations;

-- 2. Voir les details de l'organization
SELECT 
    id,
    name,
    slug,
    email,
    phone,
    created_at
FROM organizations
ORDER BY created_at DESC
LIMIT 1;

-- 3. Vérifier les gîtes
SELECT 
    'GITES' as table_name,
    count(*) as count,
    CASE 
        WHEN count(*) > 0 THEN '✅ OK'
        ELSE '❌ AUCUN GITE'
    END as status
FROM gites;

-- 4. Voir les détails des gîtes
SELECT 
    g.id,
    g.name,
    g.icon,
    g.color,
    g.capacity,
    o.name as organization_name
FROM gites g
JOIN organizations o ON o.id = g.organization_id
ORDER BY g.created_at DESC;

-- 5. Vérifier les members
SELECT 
    'MEMBERS' as table_name,
    count(*) as count,
    CASE 
        WHEN count(*) > 0 THEN '✅ OK'
        ELSE '❌ AUCUN MEMBER'
    END as status
FROM organization_members;

-- 6. Voir les détails du member
SELECT 
    om.role,
    o.name as organization_name,
    au.email as user_email,
    om.created_at
FROM organization_members om
JOIN organizations o ON o.id = om.organization_id
JOIN auth.users au ON au.id = om.user_id
ORDER BY om.created_at DESC;

-- 7. Vérifier que le RLS fonctionne
SELECT 
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('organizations', 'gites', 'organization_members', 'reservations')
ORDER BY tablename;

-- 8. Compter les policies
SELECT 
    schemaname,
    tablename,
    count(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY schemaname, tablename
ORDER BY tablename;

-- ================================================================
-- RÉSULTAT ATTENDU SI TOUT EST OK:
-- ================================================================
-- - 1 organization
-- - 2+ gîtes
-- - 1 member avec role='owner'
-- - RLS enabled = true sur toutes les tables
-- - 3 policies par table minimum
