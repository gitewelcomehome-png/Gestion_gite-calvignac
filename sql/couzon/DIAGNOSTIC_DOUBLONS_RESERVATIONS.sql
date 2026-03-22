-- ============================================================
-- DIAGNOSTIC DOUBLONS RÉSERVATIONS
-- ============================================================

-- 1. Compter le total et les doublons
SELECT
    COUNT(*)                                        AS total_reservations,
    COUNT(DISTINCT id)                              AS ids_uniques,
    COUNT(*) - COUNT(DISTINCT id)                   AS doublons_par_id,
    COUNT(DISTINCT (gite_id, check_in, check_out))  AS combos_uniques,
    COUNT(*) - COUNT(DISTINCT (gite_id, check_in, check_out)) AS doublons_par_dates
FROM public.reservations;

-- 2. Voir les doublons exacts par id
SELECT id, COUNT(*) AS nb
FROM public.reservations
GROUP BY id
HAVING COUNT(*) > 1
ORDER BY nb DESC;

-- 3. Voir les doublons par même gîte + mêmes dates
SELECT
    g.name AS gite,
    r.check_in,
    r.check_out,
    r.platform,
    COUNT(*) AS nb_doublons
FROM public.reservations r
JOIN public.gites g ON g.id = r.gite_id
GROUP BY g.name, r.check_in, r.check_out, r.platform
HAVING COUNT(*) > 1
ORDER BY r.check_in;
