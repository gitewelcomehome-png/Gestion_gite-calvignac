-- Vérifier les réservations avec différents status
SELECT 
    id,
    client_name,
    check_in,
    check_out,
    status,
    platform,
    synced_from,
    ical_uid,
    last_seen_in_ical
FROM reservations
ORDER BY check_in DESC
LIMIT 20;
