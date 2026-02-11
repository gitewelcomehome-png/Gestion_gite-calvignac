-- =====================================================
-- DIAGNOSTIC : Réservations et synchronisation iCal
-- =====================================================

-- 1. Vue d'ensemble des réservations par status
SELECT 
    status,
    COUNT(*) as nombre,
    COUNT(*) FILTER (WHERE ical_uid IS NOT NULL) as "avec_ical_uid",
    COUNT(*) FILTER (WHERE synced_from IS NOT NULL) as "avec_synced_from"
FROM reservations
GROUP BY status
ORDER BY nombre DESC;

ECHO '==============================================';

-- 2. Réservations avec ical_uid par plateforme
SELECT 
    synced_from as plateforme,
    COUNT(*) as nombre,
    COUNT(*) FILTER (WHERE status = 'confirmed') as "confirmees",
    COUNT(*) FILTER (WHERE status = 'cancelled') as "annulees",
    MIN(check_in) as "premiere_date",
    MAX(check_in) as "derniere_date"
FROM reservations
WHERE ical_uid IS NOT NULL
GROUP BY synced_from
ORDER BY nombre DESC;

ECHO '==============================================';

-- 3. Dernières réservations synchronisées (last_seen_in_ical)
SELECT 
    id,
    client_name,
    check_in,
    check_out,
    status,
    synced_from,
    last_seen_in_ical,
    NOW() - last_seen_in_ical as "age_derniere_sync",
    CASE 
        WHEN last_seen_in_ical IS NULL THEN '⚠️ Jamais vu'
        WHEN NOW() - last_seen_in_ical < INTERVAL '1 hour' THEN '✅ Récent (<1h)'
        WHEN NOW() - last_seen_in_ical < INTERVAL '1 day' THEN '🟡 < 1 jour'
        WHEN NOW() - last_seen_in_ical < INTERVAL '7 days' THEN '🟠 < 7 jours'
        ELSE '🔴 > 7 jours'
    END as "statut_sync"
FROM reservations
WHERE ical_uid IS NOT NULL
ORDER BY last_seen_in_ical DESC NULLS LAST
LIMIT 30;

ECHO '==============================================';

-- 4. Réservations confirmées sans last_seen_in_ical (suspects)
SELECT 
    id,
    client_name,
    check_in,
    check_out,
    status,
    synced_from,
    ical_uid,
    created_at
FROM reservations
WHERE 
    ical_uid IS NOT NULL
    AND status = 'confirmed'
    AND last_seen_in_ical IS NULL
ORDER BY check_in DESC
LIMIT 20;

ECHO '==============================================';

-- 5. Valeurs distinctes de synced_from (vérifier casse et format)
SELECT DISTINCT
    synced_from,
    COUNT(*) as nombre_reservations
FROM reservations
WHERE synced_from IS NOT NULL
GROUP BY synced_from
ORDER BY nombre_reservations DESC;

ECHO '==============================================';

-- 6. Réservations futures avec iCal (candidates à la vérification)
SELECT 
    g.name as gite,
    r.client_name,
    r.check_in,
    r.check_out,
    r.status,
    r.synced_from,
    r.ical_uid,
    r.last_seen_in_ical
FROM reservations r
LEFT JOIN gites g ON g.id = r.gite_id
WHERE 
    r.ical_uid IS NOT NULL
    AND r.check_out >= CURRENT_DATE
    AND r.status = 'confirmed'
ORDER BY r.check_in ASC;
