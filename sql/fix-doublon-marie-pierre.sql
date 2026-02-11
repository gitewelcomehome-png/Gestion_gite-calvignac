-- ================================================================
-- NETTOYAGE DOUBLON : Marie-Pierre Guillaud (2026-10-23 → 2026-10-25)
-- ================================================================
-- SITUATION ACTUELLE :
-- - 2 réservations avec les mêmes dates sur le même gîte (Trévoux)
-- - Marie-Pierre Guillaud (cancelled, ID: 2c62b492-43a9-46bb-b196-19d8d0920f68)
-- - Reserved (confirmed, ID: 820754cf-7438-4295-8582-efab6402e69b)
-- 
-- ACTION : Supprimer Marie-Pierre Guillaud (déjà cancelled)
-- ================================================================

-- 1. VÉRIFIER LES DOUBLONS ACTUELS
SELECT 
    id,
    client_name,
    check_in,
    check_out,
    status,
    synced_from,
    created_at
FROM reservations
WHERE gite_id = '2ee6c0bb-1a6a-4490-85e6-af75a1ff3f03' -- Trévoux
  AND check_in = '2026-10-23'
  AND check_out = '2026-10-25'
ORDER BY status DESC, created_at DESC;

-- 2. SUPPRIMER LE DOUBLON CANCELLED
DELETE FROM reservations
WHERE id = '2c62b492-43a9-46bb-b196-19d8d0920f68'
RETURNING id, client_name, check_in, check_out, status;

