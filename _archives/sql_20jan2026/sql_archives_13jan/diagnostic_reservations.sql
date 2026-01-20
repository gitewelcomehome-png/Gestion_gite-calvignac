-- ================================================================
-- DIAGNOSTIC: Vérifier pourquoi les réservations ne s'affichent pas
-- ================================================================

-- 1. Vérifier la structure de la table reservations
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'reservations'
ORDER BY ordinal_position;

-- 2. Vérifier les utilisateurs dans auth.users
SELECT 
    id,
    email,
    created_at,
    last_sign_in_at
FROM auth.users
ORDER BY created_at;

-- 3. Vérifier le nombre total de réservations (SANS RLS)
-- Note: Ceci nécessite des privilèges service_role
-- Pour exécuter depuis le Dashboard Supabase, utilisez le SQL Editor
SELECT COUNT(*) as total_reservations FROM reservations;

-- 4. Vérifier combien de réservations ont un owner_user_id
SELECT 
    COUNT(*) as total,
    COUNT(owner_user_id) as avec_owner,
    COUNT(*) - COUNT(owner_user_id) as sans_owner
FROM reservations;

-- 5. Voir les réservations qui n'ont pas d'owner
SELECT 
    id,
    check_in,
    check_out,
    client_name,
    owner_user_id,
    created_at
FROM reservations
WHERE owner_user_id IS NULL
ORDER BY check_in DESC
LIMIT 10;

-- 6. Vérifier les politiques RLS actives
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
WHERE tablename = 'reservations';

-- 7. Vérifier si RLS est activé
SELECT 
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = 'reservations';

-- ================================================================
-- SOLUTION RAPIDE: Désactiver temporairement RLS pour tester
-- ================================================================
-- ⚠️ NE PAS UTILISER EN PRODUCTION!
-- Décommentez les lignes ci-dessous UNIQUEMENT pour tester:

-- ALTER TABLE reservations DISABLE ROW LEVEL SECURITY;

-- Après le test, réactivez immédiatement:
-- ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
