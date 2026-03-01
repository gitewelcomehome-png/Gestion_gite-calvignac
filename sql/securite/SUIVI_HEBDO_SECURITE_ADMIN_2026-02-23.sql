-- ==================================================================================
-- SUIVI HEBDO SECURITE ADMIN (READ-ONLY)
-- Date: 23 février 2026
-- Objectif: surveillance rapide des risques sécurité/perf en production (sans modification)
-- ==================================================================================

-- IMPORTANT:
-- - Script strictement non destructif (SELECT uniquement)
-- - À exécuter dans Supabase SQL Editor

-- ------------------------------------------------------------------------------
-- 0) Horodatage
-- ------------------------------------------------------------------------------
SELECT now() AS suivi_executed_at;

-- ------------------------------------------------------------------------------
-- 1) KPI principal sécurité/perf
-- ------------------------------------------------------------------------------
WITH dead_stats AS (
    SELECT COUNT(*) AS tables_with_dead_over_20pct
    FROM pg_stat_user_tables
    WHERE schemaname = 'public'
      AND (n_dead_tup::NUMERIC / NULLIF(n_live_tup + n_dead_tup, 0)) > 0.20
),
unused_idx AS (
    SELECT COUNT(*) AS unused_non_constraint_indexes
    FROM pg_stat_user_indexes s
    JOIN pg_index i ON i.indexrelid = s.indexrelid
    WHERE s.schemaname = 'public'
      AND s.idx_scan = 0
      AND i.indisprimary = false
      AND i.indisunique = false
      AND NOT EXISTS (
          SELECT 1
          FROM pg_constraint c
          WHERE c.conindid = s.indexrelid
      )
),
rls_permissive AS (
    SELECT COUNT(*) AS permissive_anon_policies
    FROM pg_policies
    WHERE schemaname = 'public'
      AND (
          array_to_string(roles, ',') ILIKE '%anon%'
          OR array_to_string(roles, ',') ILIKE '%public%'
      )
      AND (
          lower(coalesce(qual, '')) = 'true'
          OR lower(coalesce(with_check, '')) = 'true'
      )
)
SELECT
    ds.tables_with_dead_over_20pct,
    ui.unused_non_constraint_indexes,
    rp.permissive_anon_policies
FROM dead_stats ds
CROSS JOIN unused_idx ui
CROSS JOIN rls_permissive rp;

-- ------------------------------------------------------------------------------
-- 2) Hotspots dead tuples (valeur absolue)
-- ------------------------------------------------------------------------------
SELECT
    relname AS table_name,
    n_live_tup,
    n_dead_tup,
    ROUND(100 * n_dead_tup::NUMERIC / NULLIF(n_live_tup + n_dead_tup, 0), 2) AS dead_tuple_pct,
    last_autovacuum,
    last_autoanalyze
FROM pg_stat_user_tables
WHERE schemaname = 'public'
  AND n_dead_tup >= 1000
ORDER BY n_dead_tup DESC;

-- ------------------------------------------------------------------------------
-- 3) Contrôle strict policies permissives anon/public
-- ------------------------------------------------------------------------------
SELECT
    schemaname,
    tablename,
    policyname,
    cmd,
    roles,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND (
      array_to_string(roles, ',') ILIKE '%anon%'
      OR array_to_string(roles, ',') ILIKE '%public%'
  )
  AND (
      lower(coalesce(qual, '')) = 'true'
      OR lower(coalesce(with_check, '')) = 'true'
  )
ORDER BY tablename, policyname, cmd;

-- ------------------------------------------------------------------------------
-- 4) Vérification index non contraints non utilisés (doit rester à 0)
-- ------------------------------------------------------------------------------
SELECT
    s.schemaname,
    s.relname AS table_name,
    s.indexrelname AS index_name,
    s.idx_scan,
    pg_size_pretty(pg_relation_size(s.indexrelid)) AS index_size,
    pg_get_indexdef(s.indexrelid) AS index_def
FROM pg_stat_user_indexes s
JOIN pg_index i ON i.indexrelid = s.indexrelid
WHERE s.schemaname = 'public'
  AND s.idx_scan = 0
  AND i.indisprimary = false
  AND i.indisunique = false
  AND NOT EXISTS (
      SELECT 1
      FROM pg_constraint c
      WHERE c.conindid = s.indexrelid
  )
ORDER BY pg_relation_size(s.indexrelid) DESC;
