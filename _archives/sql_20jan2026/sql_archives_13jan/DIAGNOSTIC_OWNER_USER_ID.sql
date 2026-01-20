-- ================================================================
-- DIAGNOSTIC: Vérifier les owner_user_id manquants
-- ================================================================
-- Date: 13 janvier 2026
-- Objectif: Identifier les réservations sans owner_user_id ou avec un mauvais owner
-- ================================================================

-- 1. Compter les réservations par owner_user_id
SELECT 
    owner_user_id,
    COUNT(*) as nb_reservations,
    MIN(check_in) as premiere_resa,
    MAX(check_in) as derniere_resa
FROM reservations
GROUP BY owner_user_id
ORDER BY nb_reservations DESC;

-- 2. Trouver les réservations SANS owner_user_id
SELECT 
    COUNT(*) as nb_sans_owner,
    MIN(check_in) as premiere,
    MAX(check_in) as derniere
FROM reservations
WHERE owner_user_id IS NULL;

-- 3. Afficher quelques réservations SANS owner
SELECT 
    id,
    check_in,
    check_out,
    client_name,
    platform,
    gite_id,
    owner_user_id
FROM reservations
WHERE owner_user_id IS NULL
ORDER BY check_in DESC
LIMIT 20;

-- 4. Récupérer l'UUID de l'utilisateur actuel (à exécuter côté auth)
-- SELECT auth.uid();

-- 5. CORRECTION: Attribuer le bon owner_user_id aux réservations orphelines
-- ⚠️ REMPLACER 'VOTRE-UUID-ICI' par votre vrai UUID utilisateur
-- ⚠️ DÉCOMMENTER LA LIGNE CI-DESSOUS POUR EXÉCUTER
-- UPDATE reservations SET owner_user_id = 'VOTRE-UUID-ICI' WHERE owner_user_id IS NULL;
