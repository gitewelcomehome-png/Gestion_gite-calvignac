-- ================================================================
-- SUPPRESSION TOTALE DE TOUTES LES RÉSERVATIONS (BYPASS RLS)
-- ================================================================
-- Date: 13 janvier 2026
-- VIDE COMPLÈTEMENT LA TABLE reservations
-- À EXÉCUTER DANS LE SQL EDITOR DE SUPABASE (pas dans le Table Editor)
-- ================================================================

-- 1. COMPTER AVANT SUPPRESSION
SELECT COUNT(*) as total_avant_suppression FROM reservations;

-- 2. COMPTER LES BLOCKED/NOT AVAILABLE
SELECT COUNT(*) as total_blocked_not_available 
FROM reservations
WHERE LOWER(client_name) LIKE '%blocked%'
   OR LOWER(client_name) LIKE '%not available%'
   OR LOWER(client_name) LIKE '%indisponible%';

-- 3. DÉSACTIVER TEMPORAIREMENT LES RLS
ALTER TABLE reservations DISABLE ROW LEVEL SECURITY;

-- 4. SUPPRESSION DES BLOCKED/NOT AVAILABLE
DELETE FROM reservations
WHERE LOWER(client_name) LIKE '%blocked%'
   OR LOWER(client_name) LIKE '%not available%'
   OR LOWER(client_name) LIKE '%indisponible%';

-- 5. RÉACTIVER LES RLS
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

-- 6. VÉRIFIER LE RÉSULTAT
SELECT COUNT(*) as total_apres_nettoyage FROM reservations;

-- 7. VÉRIFIER QU'IL NE RESTE AUCUN BLOCKED
SELECT COUNT(*) as verification_blocked 
FROM reservations
WHERE LOWER(client_name) LIKE '%blocked%'
   OR LOWER(client_name) LIKE '%not available%';
