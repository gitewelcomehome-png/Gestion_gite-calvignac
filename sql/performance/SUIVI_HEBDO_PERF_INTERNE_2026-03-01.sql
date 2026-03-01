-- ==================================================================================
-- SUIVI HEBDO PERFORMANCE INTERNE (READ-ONLY)
-- Date: 01 mars 2026
-- Objectif: mesurer la perf interne (hors abonnements/services externes)
-- ==================================================================================

-- IMPORTANT:
-- - Script strictement non destructif (SELECT uniquement)
-- - À exécuter dans Supabase SQL Editor

-- ------------------------------------------------------------------------------
-- 0) Horodatage
-- ------------------------------------------------------------------------------
SELECT now() AS suivi_perf_executed_at;

-- ------------------------------------------------------------------------------
-- 1) Santé tables métier clés (taille + dead tuples)
-- ------------------------------------------------------------------------------
SELECT
    relname AS table_name,
    n_live_tup,
    n_dead_tup,
    ROUND(100 * n_dead_tup::NUMERIC / NULLIF(n_live_tup + n_dead_tup, 0), 2) AS dead_tuple_pct,
    pg_size_pretty(pg_total_relation_size(relid)) AS total_size,
    last_autovacuum,
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
ORDER BY pg_total_relation_size(relid) DESC;

-- ------------------------------------------------------------------------------
-- 2) Index non utilisés sur tables cœur métier
-- ------------------------------------------------------------------------------
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

-- ------------------------------------------------------------------------------
-- 3) Couverture des index FK (risque de scans coûteux)
-- ------------------------------------------------------------------------------
WITH fk_cols AS (
    SELECT
        c.conrelid,
        c.conname,
        c.conkey,
        c.conrelid::regclass::text AS table_name
    FROM pg_constraint c
    JOIN pg_namespace n ON n.oid = c.connamespace
    WHERE c.contype = 'f'
      AND n.nspname = 'public'
),
idx AS (
    SELECT
        i.indrelid,
        i.indkey,
        i.indexrelid::regclass::text AS index_name
    FROM pg_index i
)
SELECT
    fk.table_name,
    fk.conname AS fk_name,
    CASE WHEN EXISTS (
        SELECT 1
        FROM idx
        WHERE idx.indrelid = fk.conrelid
          AND idx.indkey::text LIKE (fk.conkey::text || '%')
    ) THEN 'OK' ELSE 'MISSING' END AS fk_index_status
FROM fk_cols fk
WHERE fk.table_name IN (
    'reservations',
    'cleaning_schedule',
    'commandes_prestations',
    'demandes_horaires',
    'checklist_progress',
    'fiscal_history',
    'gites'
)
ORDER BY fk.table_name, fk.conname;

-- ------------------------------------------------------------------------------
-- 4) Verrous actifs potentiellement bloquants
-- ------------------------------------------------------------------------------
SELECT
    a.pid,
    a.usename,
    a.state,
    a.wait_event_type,
    a.wait_event,
    now() - a.query_start AS query_age,
    LEFT(a.query, 180) AS query_snippet
FROM pg_stat_activity a
WHERE a.datname = current_database()
  AND a.state <> 'idle'
  AND a.pid <> pg_backend_pid()
ORDER BY query_age DESC;

-- ------------------------------------------------------------------------------
-- 5) KPI synthèse perf interne
-- ------------------------------------------------------------------------------
WITH dead_stats AS (
    SELECT COUNT(*) AS tables_dead_over_20pct
    FROM pg_stat_user_tables
    WHERE schemaname = 'public'
      AND relname IN (
          'reservations', 'cleaning_schedule', 'commandes_prestations',
          'demandes_horaires', 'checklist_progress', 'fiscal_history', 'gites'
      )
      AND (n_live_tup + n_dead_tup) >= 500
      AND (n_dead_tup::NUMERIC / NULLIF(n_live_tup + n_dead_tup, 0)) > 0.20
),
unused_idx AS (
    SELECT COUNT(*) AS unused_non_constraint_indexes
    FROM pg_stat_user_indexes s
    JOIN pg_index i ON i.indexrelid = s.indexrelid
    WHERE s.schemaname = 'public'
      AND s.relname IN (
          'reservations', 'cleaning_schedule', 'commandes_prestations',
          'demandes_horaires', 'checklist_progress', 'fiscal_history', 'gites'
      )
      AND s.idx_scan = 0
      AND i.indisprimary = false
      AND i.indisunique = false
      AND NOT EXISTS (
          SELECT 1 FROM pg_constraint c WHERE c.conindid = s.indexrelid
      )
),
active_long_queries AS (
    SELECT COUNT(*) AS running_queries_over_30s
    FROM pg_stat_activity a
    WHERE a.datname = current_database()
      AND a.state <> 'idle'
      AND now() - a.query_start > interval '30 seconds'
      AND a.pid <> pg_backend_pid()
)
SELECT
    ds.tables_dead_over_20pct,
    ui.unused_non_constraint_indexes,
    aq.running_queries_over_30s
FROM dead_stats ds
CROSS JOIN unused_idx ui
CROSS JOIN active_long_queries aq;

-- ------------------------------------------------------------------------------
-- 6) Optionnel (si extension activée): top requêtes lentes
-- ------------------------------------------------------------------------------
-- Décommenter uniquement si pg_stat_statements est activé:
-- SELECT
--     calls,
--     ROUND(total_exec_time::numeric, 2) AS total_exec_ms,
--     ROUND(mean_exec_time::numeric, 2) AS mean_exec_ms,
--     rows,
--     LEFT(query, 200) AS query_snippet
-- FROM pg_stat_statements
-- WHERE query ILIKE '%reservations%'
--    OR query ILIKE '%cleaning_schedule%'
--    OR query ILIKE '%commandes_prestations%'
-- ORDER BY mean_exec_time DESC
-- LIMIT 20;
