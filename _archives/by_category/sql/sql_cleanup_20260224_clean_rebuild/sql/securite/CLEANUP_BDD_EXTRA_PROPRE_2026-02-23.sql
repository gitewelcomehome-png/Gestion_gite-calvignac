-- ==================================================================================
-- CLEANUP BDD EXTRA PROPRE (DESTRUCTIF CIBLE)
-- Date: 23 février 2026
-- Objectif: supprimer uniquement les tables legacy/backup confirmées inutiles
-- ==================================================================================

-- IMPORTANT:
-- - Script destructif (DROP TABLE)
-- - À exécuter dans Supabase SQL Editor
-- - Ne cible PAS les tables encore utilisées par le runtime

-- ------------------------------------------------------------------------------
-- 0) Pré-check visuel des tables à supprimer
-- ------------------------------------------------------------------------------
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    '_backup_tarifs_calendrier_09feb2026',
    '_idx_backup_ops',
    'backup_checklists_20260123',
    'backup_demandes_horaires_20260123',
    'backup_evaluations_sejour_20260123',
    'backup_infos_pratiques_20260123',
    'backup_problemes_signales_20260123',
    'backup_reservations_conflicts_20260223',
    'backup_retours_menage_20260123',
    'infos_gites_backup_trevoux',
    'rls_policy_backups_cleanup_20260223',
    'rls_policy_backups_cleanup_20260223_v2',
    'rls_policy_backups_fiche_client'
  )
ORDER BY tablename;

-- ------------------------------------------------------------------------------
-- 1) Journal de purge
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public._cleanup_dropped_tables_20260223 (
  id BIGSERIAL PRIMARY KEY,
  dropped_at timestamptz NOT NULL DEFAULT now(),
  table_name text NOT NULL,
  row_count bigint NOT NULL DEFAULT 0,
  note text
);

-- ------------------------------------------------------------------------------
-- 2) Suppression ciblée avec journalisation
-- ------------------------------------------------------------------------------
DO $$
DECLARE
  t text;
  v_count bigint;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    '_backup_tarifs_calendrier_09feb2026',
    '_idx_backup_ops',
    'backup_checklists_20260123',
    'backup_demandes_horaires_20260123',
    'backup_evaluations_sejour_20260123',
    'backup_infos_pratiques_20260123',
    'backup_problemes_signales_20260123',
    'backup_reservations_conflicts_20260223',
    'backup_retours_menage_20260123',
    'infos_gites_backup_trevoux',
    'rls_policy_backups_cleanup_20260223',
    'rls_policy_backups_cleanup_20260223_v2',
    'rls_policy_backups_fiche_client'
  ]
  LOOP
    IF to_regclass('public.' || t) IS NOT NULL THEN
      EXECUTE format('SELECT count(*) FROM public.%I', t) INTO v_count;

      INSERT INTO public._cleanup_dropped_tables_20260223(table_name, row_count, note)
      VALUES (t, COALESCE(v_count, 0), 'Purge legacy/backup validée 2026-02-23');

      EXECUTE format('DROP TABLE public.%I', t);
      RAISE NOTICE 'DROP OK: % (rows=%)', t, COALESCE(v_count, 0);
    ELSE
      RAISE NOTICE 'SKIP (absente): %', t;
    END IF;
  END LOOP;
END $$;

-- ------------------------------------------------------------------------------
-- 3) Post-check: plus aucune table legacy ciblée
-- ------------------------------------------------------------------------------
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    '_backup_tarifs_calendrier_09feb2026',
    '_idx_backup_ops',
    'backup_checklists_20260123',
    'backup_demandes_horaires_20260123',
    'backup_evaluations_sejour_20260123',
    'backup_infos_pratiques_20260123',
    'backup_problemes_signales_20260123',
    'backup_reservations_conflicts_20260223',
    'backup_retours_menage_20260123',
    'infos_gites_backup_trevoux',
    'rls_policy_backups_cleanup_20260223',
    'rls_policy_backups_cleanup_20260223_v2',
    'rls_policy_backups_fiche_client'
  )
ORDER BY tablename;

-- ------------------------------------------------------------------------------
-- 4) Contrôle final sécurité: tables encore sans RLS
-- ------------------------------------------------------------------------------
SELECT
  c.relname AS table_name,
  c.relrowsecurity AS rls_enabled,
  c.relforcerowsecurity AS rls_forced
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
  AND c.relrowsecurity = false
ORDER BY c.relname;

-- ------------------------------------------------------------------------------
-- NOTES IMPORTANTES
-- ------------------------------------------------------------------------------
-- Tables volontairement NON supprimées car utilisées dans le runtime:
-- - problemes_signales
-- - suivi_soldes_bancaires
-- - commandes_prestations
-- - lignes_commande_prestations
-- - prestations_catalogue
-- - system_config
-- - cm_content_generated
-- - cm_error_logs
-- - cm_support_ticket_history
-- - cleaning_rules
