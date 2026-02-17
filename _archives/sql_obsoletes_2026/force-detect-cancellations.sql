-- =====================================================
-- SCRIPT : Détecter et annuler les réservations orphelines
-- =====================================================
-- Ce script détecte les réservations qui ont :
-- 1. Un ical_uid (donc viennent d'un flux iCal)
-- 2. Un last_seen_in_ical ancien (pas vu depuis > 7 jours)
-- 3. Un status='confirmed' (donc pas encore annulées)
-- 
-- ATTENTION : Exécutez ce script APRÈS avoir fait une sync iCal
-- pour vous assurer que last_seen_in_ical est à jour.
-- =====================================================

-- 1. VOIR les réservations qui seraient marquées comme annulées
SELECT 
    id,
    client_name,
    check_in,
    check_out,
    platform,
    synced_from,
    last_seen_in_ical,
    NOW() - last_seen_in_ical as "age",
    CASE 
        WHEN last_seen_in_ical IS NULL THEN 'Jamais vu dans iCal'
        WHEN NOW() - last_seen_in_ical > INTERVAL '7 days' THEN 'Probablement annulée'
        ELSE 'Récente'
    END as "statut_detection"
FROM reservations
WHERE 
    ical_uid IS NOT NULL                    -- Vient d'un flux iCal
    AND status = 'confirmed'                 -- Pas encore annulée
    AND (
        last_seen_in_ical IS NULL            -- Jamais vu
        OR NOW() - last_seen_in_ical > INTERVAL '7 days'  -- Pas vu depuis 7 jours
    )
ORDER BY check_in DESC;

-- 2. ANNULER automatiquement ces réservations (décommentez pour exécuter)
/*
UPDATE reservations
SET 
    status = 'cancelled',
    notes = CONCAT(COALESCE(notes, ''), ' [Annulée automatiquement le ', NOW()::date, ' - disparue du flux iCal]')
WHERE 
    ical_uid IS NOT NULL
    AND status = 'confirmed'
    AND (
        last_seen_in_ical IS NULL
        OR NOW() - last_seen_in_ical > INTERVAL '7 days'
    );
*/

-- 3. VOIR toutes les réservations avec leur status actuel
SELECT 
    status,
    COUNT(*) as nombre,
    COUNT(*) FILTER (WHERE ical_uid IS NOT NULL) as "depuis_ical"
FROM reservations
GROUP BY status
ORDER BY nombre DESC;
