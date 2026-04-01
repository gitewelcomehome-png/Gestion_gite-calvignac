-- ============================================================
-- FIX : Ajout colonnes resolved_by et resolution_note sur error_logs
-- Date    : 2026-04-01
-- Raison  : admin-monitoring.js utilisait ces colonnes dans ses UPDATE
--           mais elles n'existaient pas → 400 Bad Request sur Supabase.
--           La VIEW cm_error_logs est recréée pour les exposer.
-- Idempotent : oui (ADD COLUMN IF NOT EXISTS + DROP/CREATE VIEW)
-- À exécuter dans : Supabase SQL Editor (production)
-- ============================================================

-- ============================================================
-- ÉTAPE 1 — Ajouter les colonnes sur la TABLE réelle
-- ============================================================
ALTER TABLE public.error_logs
    ADD COLUMN IF NOT EXISTS resolved_by      TEXT,
    ADD COLUMN IF NOT EXISTS resolution_note  TEXT;

-- ============================================================
-- ÉTAPE 2 — Recréer la VIEW cm_error_logs avec les nouvelles colonnes
-- ============================================================
DROP VIEW IF EXISTS public.cm_error_logs;

CREATE VIEW public.cm_error_logs AS
SELECT
    id,
    user_id,
    error_message     AS message,
    error_stack       AS stack_trace,
    error_type,
    source,
    url,
    user_agent,
    browser,
    os,
    user_email,
    timestamp,
    severity,
    resolved,
    resolved_at,
    resolved_by,
    resolution_note,
    metadata,
    occurrence_count,
    last_occurrence,
    affected_users
FROM public.error_logs;

GRANT SELECT ON public.cm_error_logs TO authenticated;
