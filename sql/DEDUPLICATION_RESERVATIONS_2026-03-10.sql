-- ============================================================
-- DÉDOUBLONNAGE RÉSERVATIONS TRÉVOUX
-- ============================================================
-- Supprime les doublons : garde 1 ligne par `id` (la plus ancienne
-- selon created_at, ou la première par ordre alphanumérique si égale)
-- ============================================================

BEGIN;

-- 1. Compter avant
SELECT
    COUNT(*)                        AS total_avant,
    COUNT(DISTINCT id)              AS ids_uniques,
    COUNT(*) - COUNT(DISTINCT id)   AS nb_doublons
FROM public.reservations;

-- 2. Supprimer les doublons en gardant la ligne avec le MIN(created_at) pour chaque id
--    (si created_at identique, on garde arbitrairement une seule via ROW_NUMBER)
DELETE FROM public.reservations
WHERE id IN (
    SELECT id
    FROM (
        SELECT
            id,
            ROW_NUMBER() OVER (
                PARTITION BY id
                ORDER BY created_at ASC
            ) AS rn
        FROM public.reservations
    ) sub
    WHERE rn > 1
);

-- 3. Compter après
SELECT
    COUNT(*)                        AS total_apres,
    COUNT(DISTINCT id)              AS ids_uniques,
    COUNT(*) - COUNT(DISTINCT id)   AS doublons_restants
FROM public.reservations;

-- 4. Confirmation : aucun doublon
SELECT id, COUNT(*) AS nb
FROM public.reservations
GROUP BY id
HAVING COUNT(*) > 1;

-- 5. Vue des réservations Trévoux restantes
SELECT r.id, r.check_in, r.check_out, r.platform, r.status, r.total_price
FROM public.reservations r
JOIN public.gites g ON g.id = r.gite_id
WHERE g.name ILIKE '%trévoux%' OR g.name ILIKE '%trevoux%'
ORDER BY r.check_in;

COMMIT;
