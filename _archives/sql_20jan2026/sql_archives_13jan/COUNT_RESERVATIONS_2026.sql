-- ================================================================
-- COMPTAGE DES RÉSERVATIONS SUR 2026
-- ================================================================
-- Date: 13 janvier 2026
-- ================================================================

-- Nombre total de réservations en 2026
SELECT COUNT(*) as total_reservations_2026
FROM reservations
WHERE EXTRACT(YEAR FROM check_in) = 2026 
   OR EXTRACT(YEAR FROM check_out) = 2026;

-- Détail par gîte
SELECT 
    gite_nom,
    COUNT(*) as nb_reservations
FROM reservations
WHERE EXTRACT(YEAR FROM check_in) = 2026 
   OR EXTRACT(YEAR FROM check_out) = 2026
GROUP BY gite_nom
ORDER BY nb_reservations DESC;

-- Détail par mois
SELECT 
    TO_CHAR(check_in, 'YYYY-MM') as mois,
    COUNT(*) as nb_reservations
FROM reservations
WHERE EXTRACT(YEAR FROM check_in) = 2026
GROUP BY TO_CHAR(check_in, 'YYYY-MM')
ORDER BY mois;
