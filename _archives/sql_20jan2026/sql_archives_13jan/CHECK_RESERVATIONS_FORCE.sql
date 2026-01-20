-- DÉSACTIVER TEMPORAIREMENT LE RLS pour voir les données
ALTER TABLE reservations DISABLE ROW LEVEL SECURITY;

-- Vérifier combien de réservations existent VRAIMENT
SELECT COUNT(*) as total_reservations FROM reservations;

-- Voir quelques réservations avec leur owner_user_id
SELECT 
    id,
    client_name,
    check_in,
    gite,
    owner_user_id,
    created_at
FROM reservations
ORDER BY created_at DESC
LIMIT 5;

-- Comparer avec l'utilisateur actuel
SELECT 
    'Utilisateur actuel:' as info,
    id,
    email
FROM auth.users 
ORDER BY created_at 
LIMIT 1;

-- RÉACTIVER LE RLS
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
