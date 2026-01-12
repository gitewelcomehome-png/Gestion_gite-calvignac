-- Vérifier les réservations et leur owner_user_id
SELECT 
    id,
    client_name,
    check_in,
    check_out,
    gite,
    owner_user_id,
    CASE 
        WHEN owner_user_id IS NULL THEN '❌ NULL'
        WHEN owner_user_id = (SELECT id FROM auth.users ORDER BY created_at LIMIT 1) THEN '✅ OK'
        ELSE '⚠️ DIFFÉRENT'
    END as status
FROM reservations
ORDER BY check_in DESC
LIMIT 10;

-- Compter total
SELECT COUNT(*) as total_reservations FROM reservations;

-- Vérifier l'utilisateur actuel
SELECT 
    id as user_id,
    email,
    created_at
FROM auth.users 
ORDER BY created_at 
LIMIT 1;
