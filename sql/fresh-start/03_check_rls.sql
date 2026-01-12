-- ================================================================
-- VÉRIFICATION DES RLS ET POLICIES
-- ================================================================
-- Copier-coller dans SQL Editor Supabase
-- ================================================================

-- 1. Vérifier que RLS est activé sur chaque table
SELECT 
    schemaname,
    tablename,
    CASE 
        WHEN rowsecurity THEN '✅ RLS activé' 
        ELSE '❌ RLS désactivé' 
    END as status
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN (
    'todos', 
    'cleaning_schedule', 
    'retours_menage', 
    'demandes_horaires', 
    'problemes_signales', 
    'simulations_fiscales', 
    'suivi_soldes_bancaires',
    'organizations',
    'gites',
    'organization_members',
    'reservations'
  )
ORDER BY tablename;

-- 2. Voir TOUTES les policies créées
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
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 3. Résumé par table
SELECT 
    tablename,
    COUNT(*) as nb_policies
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;
