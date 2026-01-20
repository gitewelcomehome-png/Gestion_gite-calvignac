-- ================================================================
-- SUPPRESSION DES BLOCAGES EN DOUBLON
-- ================================================================
-- Date: 13 janvier 2026
-- Objectif: Supprimer les "blocked" qui sont des doublons de vraies réservations
-- Quand une date est réservée sur Airbnb, Booking la bloque automatiquement
-- Ces blocages ne doivent pas être en base
-- ================================================================

-- 1. IDENTIFIER LES BLOCAGES DOUBLONS
-- Blocages dont les dates se chevauchent avec une vraie réservation sur une autre plateforme
WITH blocked_entries AS (
    SELECT 
        id,
        gite_id,
        check_in,
        check_out,
        platform,
        client_name,
        synced_from
    FROM reservations
    WHERE 
        LOWER(client_name) LIKE '%block%' 
        OR LOWER(client_name) LIKE '%not available%'
        OR LOWER(client_name) LIKE '%indisponible%'
        OR LOWER(client_name) LIKE '%unavailable%'
),
real_reservations AS (
    SELECT 
        id,
        gite_id,
        check_in,
        check_out,
        platform,
        client_name
    FROM reservations
    WHERE 
        LOWER(client_name) NOT LIKE '%block%' 
        AND LOWER(client_name) NOT LIKE '%not available%'
        AND LOWER(client_name) NOT LIKE '%indisponible%'
        AND LOWER(client_name) NOT LIKE '%unavailable%'
        AND check_out::date - check_in::date > 1  -- Vraies réservations uniquement
)
SELECT 
    b.id,
    b.gite_id,
    b.check_in,
    b.check_out,
    b.platform as blocked_platform,
    b.client_name as blocked_name,
    r.platform as real_platform,
    r.client_name as real_client,
    r.check_in as real_check_in,
    r.check_out as real_check_out
FROM blocked_entries b
JOIN real_reservations r ON 
    b.gite_id = r.gite_id
    AND b.platform != r.platform  -- Différentes plateformes
    AND (
        -- Chevauchement de dates
        (b.check_in >= r.check_in AND b.check_in < r.check_out) OR
        (b.check_out > r.check_in AND b.check_out <= r.check_out) OR
        (b.check_in <= r.check_in AND b.check_out >= r.check_out)
    )
ORDER BY b.check_in DESC;

-- 2. COMPTER LES BLOCAGES DOUBLONS
WITH blocked_entries AS (
    SELECT id, gite_id, check_in, check_out, platform, client_name
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
)
SELECT COUNT(DISTINCT b.id) as nb_blocked_doublons
FROM blocked_entries b
JOIN real_reservations r ON 
    b.gite_id = r.gite_id
    AND b.platform != r.platform
    AND (
        (b.check_in >= r.check_in AND b.check_in < r.check_out) OR
        (b.check_out > r.check_in AND b.check_out <= r.check_out) OR
        (b.check_in <= r.check_in AND b.check_out >= r.check_out)
    );

-- 3. SUPPRESSION DES BLOCAGES DOUBLONS
-- ⚠️ DÉCOMMENTER LES LIGNES CI-DESSOUS POUR EXÉCUTER LA SUPPRESSION
/*
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
*/

-- 4. VÉRIFICATION POST-SUPPRESSION
-- SELECT COUNT(*) as nb_reservations_restantes FROM reservations;
