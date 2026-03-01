-- ==================================================================================
-- DIAGNOSTIC DETAILS PERF INTERNE (READ-ONLY)
-- Date: 01 mars 2026
-- Objectif: détailler les 5 tables avec dead tuples élevés + 3 index non utilisés
-- ==================================================================================

-- 1) Top tables dead tuples (métier)
SELECT
    relname AS table_name,
    n_live_tup,
    n_dead_tup,
    ROUND(100 * n_dead_tup::NUMERIC / NULLIF(n_live_tup + n_dead_tup, 0), 2) AS dead_tuple_pct,
    pg_size_pretty(pg_total_relation_size(relid)) AS total_size,
    last_vacuum,
    last_autovacuum,
    last_analyze,
    last_autoanalyze
FROM pg_stat_user_tables
WHERE schemaname = 'public'
  AND relname IN (
      'reservations',
      'cleaning_schedule',
      'commandes_prestations',
      'demandes_horaires',
      'checklist_templates',
      'checklist_progress',
      'fiscal_history',
      'gites',
      'charges'
  )
ORDER BY dead_tuple_pct DESC NULLS LAST, n_dead_tup DESC
LIMIT 20;

-- 2) Index non utilisés (métier)
SELECT
    s.relname AS table_name,
    s.indexrelname AS index_name,
    s.idx_scan,
    pg_size_pretty(pg_relation_size(s.indexrelid)) AS index_size,
    pg_get_indexdef(s.indexrelid) AS index_def
FROM pg_stat_user_indexes s
JOIN pg_index i ON i.indexrelid = s.indexrelid
WHERE s.schemaname = 'public'
  AND s.relname IN (
      'reservations',
      'cleaning_schedule',
      'commandes_prestations',
      'demandes_horaires',
      'checklist_progress',
      'fiscal_history',
      'gites'
  )
  AND s.idx_scan = 0
  AND i.indisprimary = false
  AND i.indisunique = false
  AND NOT EXISTS (
      SELECT 1
      FROM pg_constraint c
      WHERE c.conindid = s.indexrelid
  )
ORDER BY pg_relation_size(s.indexrelid) DESC;

-- 3) Générateur de commandes de maintenance (texte uniquement)
SELECT format('VACUUM (ANALYZE, VERBOSE) public.%I;', relname) AS vacuum_sql
FROM pg_stat_user_tables
WHERE schemaname = 'public'
  AND relname IN (
      'reservations',
      'cleaning_schedule',
      'commandes_prestations',
      'demandes_horaires',
      'checklist_templates',
      'checklist_progress',
      'fiscal_history',
      'gites',
      'charges'
  )
  AND (n_dead_tup::NUMERIC / NULLIF(n_live_tup + n_dead_tup, 0)) > 0.20
ORDER BY relname;

-- 4) Générateur de DROP INDEX candidats (texte uniquement; ne pas exécuter sans validation)
SELECT format('DROP INDEX CONCURRENTLY IF EXISTS public.%I;', s.indexrelname) AS drop_index_sql,
       s.relname AS table_name,
       pg_size_pretty(pg_relation_size(s.indexrelid)) AS index_size
FROM pg_stat_user_indexes s
JOIN pg_index i ON i.indexrelid = s.indexrelid
WHERE s.schemaname = 'public'
  AND s.relname IN (
      'reservations',
      'cleaning_schedule',
      'commandes_prestations',
      'demandes_horaires',
      'checklist_progress',
      'fiscal_history',
      'gites'
  )
  AND s.idx_scan = 0
  AND i.indisprimary = false
  AND i.indisunique = false
  AND NOT EXISTS (
      SELECT 1
      FROM pg_constraint c
      WHERE c.conindid = s.indexrelid
  )
ORDER BY pg_relation_size(s.indexrelid) DESC;
