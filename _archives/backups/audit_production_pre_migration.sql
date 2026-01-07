-- ================================================================
-- AUDIT PRODUCTION PRE-MIGRATION
-- ================================================================
-- Date: 7 janvier 2026
-- Objectif: Compter toutes les données AVANT migration pour validation
-- À exécuter dans: Supabase Production SQL Editor
-- ================================================================

-- ----------------------------------------------------------------
-- 1. COMPTAGE GLOBAL PAR TABLE
-- ----------------------------------------------------------------

SELECT 'reservations' as table_name, COUNT(*) as count FROM reservations
UNION ALL
SELECT 'cleaning_schedule', COUNT(*) FROM cleaning_schedule
ORDER BY table_name;

-- ----------------------------------------------------------------
-- 2. RÉPARTITION PAR GÎTE
-- ----------------------------------------------------------------

SELECT 
    'RÉSERVATIONS PAR GÎTE' as metric,
    gite,
    COUNT(*) as count
FROM reservations 
GROUP BY gite 
ORDER BY gite;

-- ----------------------------------------------------------------
-- 3. RÉSERVATIONS PAR STATUT (si colonne existe)
-- ----------------------------------------------------------------

SELECT 
    'RÉSERVATIONS PAR STATUT' as metric,
    COALESCE(status, 'non défini') as status,
    COUNT(*) as count
FROM reservations 
GROUP BY status
ORDER BY count DESC;

-- ----------------------------------------------------------------
-- 4. MÉNAGES PAR GÎTE ET STATUT
-- ----------------------------------------------------------------

SELECT 
    'MÉNAGES PAR GÎTE' as metric,
    gite,
    status,
    COUNT(*) as count
FROM cleaning_schedule 
GROUP BY gite, status 
ORDER BY gite, status;

-- ----------------------------------------------------------------
-- 5. PÉRIODE COUVERTE PAR LES RÉSERVATIONS
-- ----------------------------------------------------------------

SELECT 
    'PÉRIODE RÉSERVATIONS' as metric,
    MIN(date_debut) as premiere_reservation,
    MAX(date_fin) as derniere_reservation,
    COUNT(*) as total_reservations,
    COUNT(DISTINCT nom_client) as clients_uniques
FROM reservations;

-- ----------------------------------------------------------------
-- 6. RÉSERVATIONS RÉCENTES (derniers 30 jours)
-- ----------------------------------------------------------------

SELECT 
    'RÉSERVATIONS RÉCENTES' as metric,
    gite,
    COUNT(*) as count
FROM reservations 
WHERE date_debut >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY gite;

-- ----------------------------------------------------------------
-- 7. VÉRIFICATION INTÉGRITÉ (valeurs NULL problématiques)
-- ----------------------------------------------------------------

SELECT 
    'RÉSERVATIONS SANS GÎTE' as metric,
    COUNT(*) as count
FROM reservations 
WHERE gite IS NULL OR gite = '';

SELECT 
    'RÉSERVATIONS SANS CLIENT' as metric,
    COUNT(*) as count
FROM reservations 
WHERE nom_client IS NULL OR nom_client = '';

SELECT 
    'MÉNAGES SANS GÎTE' as metric,
    COUNT(*) as count
FROM cleaning_schedule 
WHERE gite IS NULL OR gite = '';

-- ----------------------------------------------------------------
-- 8. VALEURS DISTINCTES DE "gite" (important pour mapping)
-- ----------------------------------------------------------------

SELECT 
    'VALEURS DISTINCTES GÎTE' as metric,
    gite,
    COUNT(*) as occurrences
FROM (
    SELECT gite FROM reservations
    UNION ALL
    SELECT gite FROM cleaning_schedule
) all_gites
WHERE gite IS NOT NULL
GROUP BY gite
ORDER BY gite;

-- ================================================================
-- RÉSULTATS ATTENDUS
-- ================================================================
-- 
-- ✅ Vérifier que:
-- 1. Toutes les tables ont des données (count > 0)
-- 2. Les gîtes sont 'Trevoux' et 'Couzon' uniquement
-- 3. Aucune valeur NULL dans les colonnes critiques
-- 4. Les counts correspondent à la réalité
--
-- 📝 NOTER TOUS LES RÉSULTATS pour comparaison post-migration
-- ================================================================
