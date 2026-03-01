-- ==================================================================================
-- REMEDIATION PERF INTERNE (SAFE-FIRST)
-- Date: 01 mars 2026
-- Objectif: réduire dead tuples et restaurer statistiques planner (hors externes)
-- ==================================================================================
-- IMPORTANT:
-- - Non destructif dans ce script (pas de DROP/ALTER)
-- - Exécuter hors pic trafic
-- - Vérifier l'impact avec le script de suivi après exécution
-- - NOTE SUPABASE SQL EDITOR: VACUUM échoue si exécuté dans un bloc transactionnel
--   => exécuter les commandes VACUUM une par une (Run selected) hors transaction

-- 1) ANALYZE global ciblé (rapide)
ANALYZE public.reservations;
ANALYZE public.cleaning_schedule;
ANALYZE public.commandes_prestations;
ANALYZE public.demandes_horaires;
ANALYZE public.checklist_templates;
ANALYZE public.checklist_progress;
ANALYZE public.fiscal_history;
ANALYZE public.gites;
ANALYZE public.charges;

-- 2) Générateur de commandes VACUUM (texte uniquement, hors transaction)
SELECT format('VACUUM (ANALYZE, VERBOSE) public.%I;', relname) AS vacuum_sql
FROM pg_stat_user_tables
WHERE schemaname = 'public'
  AND relname IN (
      'reservations', 'cleaning_schedule', 'commandes_prestations',
      'demandes_horaires', 'checklist_templates', 'checklist_progress',
      'fiscal_history', 'gites', 'charges'
  )
  AND (n_dead_tup::NUMERIC / NULLIF(n_live_tup + n_dead_tup, 0)) > 0.20
ORDER BY relname;

-- Exécution recommandée:
-- 1) lancer ce script pour obtenir la liste vacuum_sql
-- 2) exécuter ensuite chaque ligne VACUUM séparément (Run selected), hors transaction
-- 3) relancer ce script pour la vérification post-action

-- 3) Vérification post-action immédiate
SELECT
    relname AS table_name,
    n_live_tup,
    n_dead_tup,
    ROUND(100 * n_dead_tup::NUMERIC / NULLIF(n_live_tup + n_dead_tup, 0), 2) AS dead_tuple_pct,
    last_autovacuum,
    last_autoanalyze
FROM pg_stat_user_tables
WHERE schemaname = 'public'
  AND relname IN (
      'reservations', 'cleaning_schedule', 'commandes_prestations',
      'demandes_horaires', 'checklist_templates', 'checklist_progress',
      'fiscal_history', 'gites', 'charges'
  )
ORDER BY dead_tuple_pct DESC NULLS LAST;

-- 4) NOTE INDEX NON UTILISES
-- Les index candidats à suppression doivent être validés sur 2-3 snapshots hebdo
-- avant tout DROP INDEX CONCURRENTLY.
-- Utiliser: sql/performance/DIAGNOSTIC_PERF_INTERNE_DETAILS_2026-03-01.sql
--
-- Cas courant ici: idx_gites_region / idx_gites_type_hebergement / idx_gites_label_classement
-- -> index récents (module tarification), taille faible (16 kB).
-- -> ne pas supprimer immédiatement; confirmer inutilisation sur 2-3 snapshots en charge réelle.
