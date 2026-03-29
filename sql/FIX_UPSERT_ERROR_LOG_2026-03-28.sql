-- ============================================================
-- FIX : Remplacement du STUB upsert_error_log par une vraie logique
-- Date    : 2026-03-28 (v2 corrigée le 2026-03-29)
-- Raison  : La fonction était un stub (BEGIN NULL; END) → cm_error_logs
--           restait toujours vide → dashboard admin-monitoring aveugle.
--
-- Architecture réelle (découverte à l'exécution) :
--   • public.error_logs    = TABLE réelle
--   • public.cm_error_logs = VIEW sur error_logs (alias error_message→message, etc.)
--
-- Idempotent : oui (CREATE OR REPLACE + ADD COLUMN IF NOT EXISTS + DROP/CREATE VIEW)
-- À exécuter dans : Supabase SQL Editor (production)
-- ============================================================

-- ============================================================
-- ÉTAPE 1 — Ajouter les colonnes manquantes sur la TABLE réelle
-- (cm_error_logs est une VIEW — on ne peut pas l'ALTER)
-- ============================================================
ALTER TABLE public.error_logs
    ADD COLUMN IF NOT EXISTS source           TEXT          DEFAULT 'unknown',
    ADD COLUMN IF NOT EXISTS user_email       TEXT,
    ADD COLUMN IF NOT EXISTS occurrence_count INTEGER       NOT NULL DEFAULT 1,
    ADD COLUMN IF NOT EXISTS last_occurrence  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS affected_users   TEXT[]        NOT NULL DEFAULT '{}';

-- ============================================================
-- ÉTAPE 2 — Recréer la VIEW cm_error_logs avec toutes les colonnes
-- (La vue existante ne les exposait pas — DROP requis pour modification)
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
    metadata,
    occurrence_count,
    last_occurrence,
    affected_users
FROM public.error_logs;

-- ============================================================
-- ÉTAPE 3 — Index de déduplication sur la TABLE (pas la vue)
-- Clé : error_type + source + début de message (200 chars)
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_error_logs_dedup
    ON public.error_logs (error_type, source, LEFT(error_message, 200))
    WHERE resolved = false;

-- ============================================================
-- ÉTAPE 4 — Remplacer le stub par la vraie fonction
-- La fonction INSERT/UPDATE dans error_logs (noms de colonnes réels)
-- ============================================================
CREATE OR REPLACE FUNCTION public.upsert_error_log(
    p_error_type   TEXT,
    p_message      TEXT,
    p_metadata     JSONB    DEFAULT NULL,
    p_source       TEXT     DEFAULT NULL,
    p_stack_trace  TEXT     DEFAULT NULL,
    p_url          TEXT     DEFAULT NULL,
    p_user_agent   TEXT     DEFAULT NULL,
    p_user_email   TEXT     DEFAULT NULL,
    p_user_id      UUID     DEFAULT NULL
) RETURNS void AS $$
DECLARE
    v_existing_id    UUID;
    v_user_email_val TEXT := LOWER(TRIM(COALESCE(p_user_email, '')));
BEGIN
    -- Chercher une erreur identique non résolue dans les 24 dernières heures
    -- Clé de déduplication : error_type + source + début du message (200 chars)
    SELECT id INTO v_existing_id
    FROM public.error_logs
    WHERE resolved = false
      AND error_type = p_error_type
      AND source = COALESCE(p_source, 'unknown')
      AND LEFT(error_message, 200) = LEFT(p_message, 200)
      AND last_occurrence > NOW() - INTERVAL '24 hours'
    ORDER BY last_occurrence DESC
    LIMIT 1;

    IF v_existing_id IS NOT NULL THEN
        -- Erreur déjà connue — incrémenter le compteur
        UPDATE public.error_logs
        SET occurrence_count = occurrence_count + 1,
            last_occurrence  = NOW(),
            affected_users   = CASE
                WHEN v_user_email_val <> '' AND NOT (affected_users @> ARRAY[v_user_email_val])
                THEN array_append(affected_users, v_user_email_val)
                ELSE affected_users
            END,
            metadata = COALESCE(metadata, '{}'::jsonb) || COALESCE(p_metadata, '{}'::jsonb)
        WHERE id = v_existing_id;
    ELSE
        -- Nouvelle erreur — insérer
        INSERT INTO public.error_logs (
            error_type,
            error_message,
            error_stack,
            source,
            url,
            user_agent,
            user_id,
            user_email,
            metadata,
            timestamp,
            last_occurrence,
            occurrence_count,
            affected_users,
            resolved
        ) VALUES (
            p_error_type,
            p_message,
            NULLIF(TRIM(COALESCE(p_stack_trace, '')), ''),
            COALESCE(p_source, 'unknown'),
            p_url,
            p_user_agent,
            p_user_id,
            NULLIF(v_user_email_val, ''),
            COALESCE(p_metadata, '{}'::jsonb),
            NOW(),
            NOW(),
            1,
            CASE WHEN v_user_email_val <> '' THEN ARRAY[v_user_email_val] ELSE '{}'::TEXT[] END,
            false
        );
    END IF;

EXCEPTION
    WHEN OTHERS THEN
        -- Ne jamais faire planter l'appelant à cause du logging
        NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- ÉTAPE 5 — Droits d'exécution
-- ============================================================
REVOKE ALL ON FUNCTION public.upsert_error_log(TEXT, TEXT, JSONB, TEXT, TEXT, TEXT, TEXT, TEXT, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.upsert_error_log(TEXT, TEXT, JSONB, TEXT, TEXT, TEXT, TEXT, TEXT, UUID) TO anon, authenticated;

-- Accès SELECT sur la vue pour le dashboard admin
GRANT SELECT ON public.cm_error_logs TO authenticated;

-- ============================================================
-- ÉTAPE 6 — Vérification rapide
-- ============================================================
-- Vérifier que la fonction n'est plus un stub
SELECT
    p.proname                                                        AS fonction,
    pg_get_function_identity_arguments(p.oid)                        AS signature,
    p.prosecdef                                                      AS security_definer,
    pg_get_functiondef(p.oid) LIKE '%BEGIN%NULL;%END%'               AS is_stub
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname = 'upsert_error_log';
-- Attendre : is_stub = false

-- Vérifier que la vue expose bien toutes les colonnes attendues
SELECT column_name
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'cm_error_logs'
ORDER BY ordinal_position;
-- Attendre : message, stack_trace, source, user_email, occurrence_count, last_occurrence, affected_users
