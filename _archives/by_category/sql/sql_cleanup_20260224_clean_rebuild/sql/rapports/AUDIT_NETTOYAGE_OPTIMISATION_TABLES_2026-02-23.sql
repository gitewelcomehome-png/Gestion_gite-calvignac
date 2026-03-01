-- ==================================================================================
-- AUDIT NETTOYAGE & OPTIMISATION TABLES (READ-ONLY)
-- Date: 23 février 2026
-- Objectif: cartographier les optimisations à faire sans aucune modification de données
-- ==================================================================================

-- IMPORTANT:
-- - Script strictement non destructif (SELECT uniquement)
-- - À exécuter dans Supabase SQL Editor

-- ------------------------------------------------------------------------------
-- 0) Horodatage audit
-- ------------------------------------------------------------------------------
SELECT now() AS audit_executed_at;

-- ------------------------------------------------------------------------------
-- 1) Inventaire global des tables (taille + estimation volumétrie)
-- ------------------------------------------------------------------------------
SELECT
    n.nspname AS schema_name,
    c.relname AS table_name,
    c.reltuples::BIGINT AS estimated_rows,
    pg_total_relation_size(c.oid) AS total_bytes,
    pg_size_pretty(pg_total_relation_size(c.oid)) AS total_size,
    pg_relation_size(c.oid) AS table_bytes,
    pg_size_pretty(pg_relation_size(c.oid)) AS table_size,
    (pg_total_relation_size(c.oid) - pg_relation_size(c.oid)) AS indexes_toast_bytes,
    pg_size_pretty(pg_total_relation_size(c.oid) - pg_relation_size(c.oid)) AS indexes_toast_size
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE c.relkind = 'r'
  AND n.nspname = 'public'
ORDER BY pg_total_relation_size(c.oid) DESC;

-- ------------------------------------------------------------------------------
-- 2) Santé des tables (dead tuples / vacuum / analyze)
-- ------------------------------------------------------------------------------
SELECT
    schemaname,
    relname AS table_name,
    n_live_tup,
    n_dead_tup,
    ROUND((n_dead_tup::NUMERIC / NULLIF(n_live_tup + n_dead_tup, 0)) * 100, 2) AS dead_tuple_pct,
    last_vacuum,
    last_autovacuum,
    last_analyze,
    last_autoanalyze,
    vacuum_count,
    autovacuum_count,
    analyze_count,
    autoanalyze_count
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY dead_tuple_pct DESC NULLS LAST, n_dead_tup DESC;

-- ------------------------------------------------------------------------------
-- 3) Index non utilisés (candidats optimisation)
--    Exclusion: index PK/UNIQUE/EXCLUSION (contraintes)
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

-- ------------------------------------------------------------------------------
-- 4) Index potentiellement dupliqués (même définition logique)
-- ------------------------------------------------------------------------------
WITH idx AS (
    SELECT
        n.nspname AS schema_name,
        t.relname AS table_name,
        i.relname AS index_name,
        pg_get_indexdef(i.oid) AS index_def,
        regexp_replace(pg_get_indexdef(i.oid), '^CREATE( UNIQUE)? INDEX [^ ]+ ON ', 'CREATE INDEX ON ') AS normalized_def
    FROM pg_class t
    JOIN pg_namespace n ON n.oid = t.relnamespace
    JOIN pg_index x ON x.indrelid = t.oid
    JOIN pg_class i ON i.oid = x.indexrelid
    WHERE n.nspname = 'public'
      AND t.relkind = 'r'
)
SELECT
    schema_name,
    table_name,
    normalized_def,
    COUNT(*) AS duplicate_count,
    string_agg(index_name, ', ' ORDER BY index_name) AS duplicate_indexes
FROM idx
GROUP BY schema_name, table_name, normalized_def
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC, table_name;

-- ------------------------------------------------------------------------------
-- 5) Colonnes FK sans index de support (candidats priorité perf)
-- ------------------------------------------------------------------------------
WITH fk_columns AS (
    SELECT
        c.oid AS constraint_oid,
        n.nspname AS schema_name,
        t.relname AS table_name,
        c.conname AS constraint_name,
        c.conkey AS fk_attnums,
        array_agg(a.attname ORDER BY k.ordinality) AS fk_columns
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    JOIN LATERAL unnest(c.conkey) WITH ORDINALITY AS k(attnum, ordinality) ON true
    JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = k.attnum
    WHERE c.contype = 'f'
      AND n.nspname = 'public'
    GROUP BY c.oid, n.nspname, t.relname, c.conname, c.conkey
),
indexed_prefix AS (
    SELECT
        n.nspname AS schema_name,
        t.relname AS table_name,
        i.indexrelid,
        i.indkey
    FROM pg_index i
    JOIN pg_class t ON t.oid = i.indrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public'
)
SELECT
    f.schema_name,
    f.table_name,
    f.constraint_name,
    f.fk_columns,
    'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_' || f.table_name || '_' || array_to_string(f.fk_columns, '_') || ' ON public.' || f.table_name || ' (' || array_to_string(f.fk_columns, ', ') || ');' AS suggested_index_sql
FROM fk_columns f
WHERE NOT EXISTS (
    SELECT 1
    FROM indexed_prefix p
    WHERE p.schema_name = f.schema_name
      AND p.table_name = f.table_name
      AND p.indkey[0:array_length(f.fk_attnums, 1) - 1] = f.fk_attnums
)
ORDER BY f.table_name, f.constraint_name;

-- ------------------------------------------------------------------------------
-- 6) État RLS par table
-- ------------------------------------------------------------------------------
SELECT
    n.nspname AS schema_name,
    c.relname AS table_name,
    c.relrowsecurity AS rls_enabled,
    c.relforcerowsecurity AS rls_forced,
    COALESCE(p.policy_count, 0) AS policy_count
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
LEFT JOIN (
    SELECT schemaname, tablename, COUNT(*) AS policy_count
    FROM pg_policies
    WHERE schemaname = 'public'
    GROUP BY schemaname, tablename
) p ON p.schemaname = n.nspname AND p.tablename = c.relname
WHERE c.relkind = 'r'
  AND n.nspname = 'public'
ORDER BY c.relname;

-- ------------------------------------------------------------------------------
-- 7) Policies anon permissives suspectes (USING true / WITH CHECK true)
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
-- 8) Vérification règle métier réservations (chevauchements par gîte)
-- ------------------------------------------------------------------------------
SELECT
    r1.gite_id,
    r1.id AS reservation_id_1,
    r2.id AS reservation_id_2,
    r1.check_in AS check_in_1,
    r1.check_out AS check_out_1,
    r2.check_in AS check_in_2,
    r2.check_out AS check_out_2
FROM public.reservations r1
JOIN public.reservations r2
    ON r1.gite_id = r2.gite_id
   AND r1.id < r2.id
   AND daterange(r1.check_in, r1.check_out, '[)') && daterange(r2.check_in, r2.check_out, '[)')
ORDER BY r1.gite_id, r1.check_in
LIMIT 200;

-- ------------------------------------------------------------------------------
-- 9) Vérification règle métier réservations (même date de début)
-- ------------------------------------------------------------------------------
SELECT
    gite_id,
    check_in,
    COUNT(*) AS bookings_same_start_day,
    array_agg(id ORDER BY id) AS reservation_ids
FROM public.reservations
GROUP BY gite_id, check_in
HAVING COUNT(*) > 1
ORDER BY bookings_same_start_day DESC, gite_id, check_in;

-- ------------------------------------------------------------------------------
-- 10) Synthèse rapide (KPIs audit)
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
