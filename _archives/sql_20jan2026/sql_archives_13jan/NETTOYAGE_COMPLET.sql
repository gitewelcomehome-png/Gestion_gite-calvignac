-- ================================================================
-- NETTOYAGE COMPLET - EXÉCUTER DANS L'ORDRE
-- ================================================================
-- Date: 13 janvier 2026
-- ================================================================

-- ÉTAPE 1: Supprimer les réservations fantômes (≤ 1 jour)
DELETE FROM reservations WHERE check_out::date - check_in::date <= 1;

-- ÉTAPE 2: Supprimer les blocages en doublon
WITH blocked_entries AS (
    SELECT id, gite_id, check_in, check_out, platform
    FROM reservations
    WHERE 
        LOWER(client_name) LIKE '%block%' 
        OR LOWER(client_name) LIKE '%not available%'
        OR LOWER(client_name) LIKE '%indisponible%'
),
real_reservations AS (
    SELECT id, gite_id, check_in, check_out, platform
    FROM reservations
    WHERE 
        LOWER(client_name) NOT LIKE '%block%' 
        AND LOWER(client_name) NOT LIKE '%not available%'
        AND check_out::date - check_in::date > 1
),
doublons_to_delete AS (
    SELECT DISTINCT b.id
    FROM blocked_entries b
    JOIN real_reservations r ON 
        b.gite_id = r.gite_id
        AND b.platform != r.platform
        AND (
            (b.check_in >= r.check_in AND b.check_in < r.check_out) OR
            (b.check_out > r.check_in AND b.check_out <= r.check_out) OR
            (b.check_in <= r.check_in AND b.check_out >= r.check_out)
        )
)
DELETE FROM reservations WHERE id IN (SELECT id FROM doublons_to_delete);

-- ÉTAPE 3: Vérification finale
SELECT COUNT(*) as nb_reservations_restantes FROM reservations;
