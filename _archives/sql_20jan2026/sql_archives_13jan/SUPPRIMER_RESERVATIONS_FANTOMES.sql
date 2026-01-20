-- ================================================================
-- SUPPRESSION DES RÉSERVATIONS FANTÔMES (1 NUIT OU MOINS)
-- ================================================================
-- Date: 13 janvier 2026
-- Objectif: Supprimer toutes les réservations de 1 jour ou moins
-- qui bloquent le calendrier et ne sont pas réelles
-- ================================================================

-- 1. VÉRIFICATION : Compter les réservations fantômes
SELECT 
    COUNT(*) as nb_fantomes,
    gite_id,
    platform
FROM reservations
WHERE check_out::date - check_in::date <= 1
GROUP BY gite_id, platform
ORDER BY nb_fantomes DESC;

-- 2. AFFICHER LES RÉSERVATIONS FANTÔMES (pour validation)
SELECT 
    id,
    gite_id,
    check_in,
    check_out,
    check_out::date - check_in::date as nb_jours,
    client_name,
    platform,
    synced_from,
    created_at
FROM reservations
WHERE check_out::date - check_in::date <= 1
ORDER BY check_in DESC
LIMIT 100;

-- 3. SUPPRESSION : Supprimer TOUTES les réservations de 1 jour ou moins
-- ⚠️ DÉCOMMENTER LA LIGNE CI-DESSOUS POUR EXÉCUTER LA SUPPRESSION
-- DELETE FROM reservations WHERE check_out::date - check_in::date <= 1;

-- 4. VÉRIFICATION POST-SUPPRESSION
-- SELECT COUNT(*) as nb_reservations_restantes FROM reservations;
