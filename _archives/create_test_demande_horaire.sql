-- ============================================================================
-- CRÉER UNE DEMANDE DE TEST (si table vide)
-- ============================================================================
-- À exécuter uniquement si vous voulez tester l'affichage

-- 1. Récupérer un owner_user_id et une reservation_id valides
-- (Remplacer les UUIDs ci-dessous par vos vraies valeurs)

-- Exemple d'insertion de test:
/*
INSERT INTO demandes_horaires (
    id,
    owner_user_id,
    reservation_id,
    type,
    heure_demandee,
    motif,
    statut,
    created_at,
    updated_at
)
VALUES (
    gen_random_uuid(),
    'VOTRE_USER_ID_ICI', -- Remplacer par un vrai UUID d'utilisateur
    'VOTRE_RESERVATION_ID_ICI', -- Remplacer par un vrai UUID de réservation
    'arrivee', -- ou 'depart'
    '15:00:00', -- Heure demandée
    'Je souhaite arriver plus tôt pour profiter de la piscine', -- Motif
    'en_attente', -- IMPORTANT: doit être 'en_attente' pour apparaître
    NOW(),
    NOW()
);
*/

-- Pour obtenir vos IDs réels:
SELECT 
    'User ID:' as label,
    id as value
FROM auth.users
LIMIT 1;

SELECT 
    'Reservation ID:' as label,
    id as value,
    client_name,
    check_in,
    check_out
FROM reservations
WHERE check_in >= CURRENT_DATE - INTERVAL '7 days'
AND check_out >= CURRENT_DATE
ORDER BY check_in
LIMIT 5;
