-- ============================================================================
-- DIAGNOSTIC AUTHENTIFICATION
-- Vérifier quel utilisateur est connecté et comparer avec les données
-- ============================================================================

-- 1. Quel est MON user_id actuel ?
SELECT 
    'MON USER ID' as info,
    auth.uid() as user_id,
    auth.email() as email;

-- 2. Comparer avec les owner_user_id des listes
SELECT 
    'COMPARAISON' as info,
    auth.uid() as mon_id,
    owner_user_id,
    CASE 
        WHEN auth.uid() = owner_user_id THEN '✅ MATCH'
        ELSE '❌ DIFFÉRENT'
    END as match_status,
    name,
    status
FROM shopping_lists
ORDER BY created_date DESC;

-- 3. Comparer avec les lieux favoris
SELECT 
    'LIEUX - COMPARAISON' as info,
    auth.uid() as mon_id,
    owner_user_id,
    CASE 
        WHEN auth.uid() = owner_user_id THEN '✅ MATCH'
        ELSE '❌ DIFFÉRENT'
    END as match_status,
    nom,
    distance_km
FROM km_lieux_favoris;


