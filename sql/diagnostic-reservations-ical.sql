-- DIAGNOSTIC COMPLET : Toutes les réservations futures synchronisées par iCal
SELECT 
    g.name as gite,
    r.client_name,
    r.check_in,
    r.check_out,
    r.status,
    r.synced_from,
    r.last_seen_in_ical,
    CASE 
        WHEN r.last_seen_in_ical IS NULL THEN '⚠️ JAMAIS VU'
        WHEN NOW() - r.last_seen_in_ical < INTERVAL '1 hour' THEN '✅ Récent (<1h)'
        WHEN NOW() - r.last_seen_in_ical < INTERVAL '1 day' THEN '🟡 < 1 jour'
        WHEN NOW() - r.last_seen_in_ical < INTERVAL '7 days' THEN '🟠 < 7 jours'
        ELSE '🔴 > 7 jours (PROBABLEMENT ANNULÉE)'
    END as "statut_sync"
FROM reservations r
LEFT JOIN gites g ON g.id = r.gite_id
WHERE 
    r.ical_uid IS NOT NULL
    AND r.check_out >= CURRENT_DATE
ORDER BY r.check_in ASC;
