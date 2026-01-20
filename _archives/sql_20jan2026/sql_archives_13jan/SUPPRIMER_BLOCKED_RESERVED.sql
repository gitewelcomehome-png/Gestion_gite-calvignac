-- ================================================================
-- SUPPRIMER LES ENTRÉES BLOCKED / Reserved / Not available
-- ================================================================
-- Date: 13 janvier 2026
-- Supprime uniquement les réservations fantômes
-- ================================================================

-- 1. COMPTER COMBIEN IL Y EN A
SELECT COUNT(*) as total_blocked_reserved,
       client_name
FROM reservations
WHERE LOWER(client_name) LIKE '%blocked%'
   OR LOWER(client_name) LIKE '%reserved%'
   OR LOWER(client_name) LIKE '%not available%'
   OR LOWER(client_name) LIKE '%indisponible%'
   OR LOWER(client_name) LIKE '%bloqué%'
GROUP BY client_name
ORDER BY total_blocked_reserved DESC;

-- 2. DÉSACTIVER TEMPORAIREMENT LES RLS
ALTER TABLE reservations DISABLE ROW LEVEL SECURITY;

-- 3. SUPPRIMER LES ENTRÉES BLOCKED/RESERVED
DELETE FROM reservations
WHERE LOWER(client_name) LIKE '%blocked%'
   OR LOWER(client_name) LIKE '%reserved%'
   OR LOWER(client_name) LIKE '%not available%'
   OR LOWER(client_name) LIKE '%indisponible%'
   OR LOWER(client_name) LIKE '%bloqué%';

-- 4. RÉACTIVER LES RLS
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

-- 5. VÉRIFIER QU'ELLES ONT ÉTÉ SUPPRIMÉES
SELECT COUNT(*) as reste_apres_suppression
FROM reservations
WHERE LOWER(client_name) LIKE '%blocked%'
   OR LOWER(client_name) LIKE '%reserved%'
   OR LOWER(client_name) LIKE '%not available%';
