-- ============================================================
-- FIX : Remplacement du STUB upsert_error_log par une vraie logique
-- Date    : 2026-03-28
-- Raison  : La fonction était un stub (BEGIN NULL; END) → cm_error_logs
--           restait toujours vide → dashboard admin-monitoring aveugle.
-- Idempotent : oui (CREATE OR REPLACE + ADD COLUMN IF NOT EXISTS)
-- À exécuter dans : Supabase SQL Editor (production)
-- ============================================================

-- ============================================================
-- ÉTAPE 1 — S'assurer que les colonnes de déduplication existent
-- (au cas où la table a été créée sans elles)
-- ============================================================
ALTER TABLE IF EXISTS public.cm_error_logs
    ADD COLUMN IF NOT EXISTS occurrence_count  INTEGER        NOT NULL DEFAULT 1,
    ADD COLUMN IF NOT EXISTS last_occurrence   TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS affected_users    TEXT[]         NOT NULL DEFAULT '{}';

-- Index de déduplication (erreurs non résolues dans les 24h)
-- Clé : error_type + source + début de message (200 chars) pour éviter les faux positifs
CREATE INDEX IF NOT EXISTS idx_cm_error_logs_dedup
    ON public.cm_error_logs (error_type, source, LEFT(message, 200))
    WHERE resolved = false;

-- ============================================================
-- ÉTAPE 2 — Remplacer le stub par la vraie fonction
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
    v_existing_id UUID;
    v_user_email_val TEXT := LOWER(TRIM(COALESCE(p_user_email, '')));
BEGIN
    -- Chercher une erreur identique non résolue dans les 24 dernières heures
    -- Clé de déduplication : error_type + source + début du message (200 chars)
    SELECT id INTO v_existing_id
    FROM public.cm_error_logs
    WHERE resolved = false
      AND error_type = p_error_type
      AND source = COALESCE(p_source, 'unknown')
      AND LEFT(message, 200) = LEFT(p_message, 200)
      AND last_occurrence > NOW() - INTERVAL '24 hours'
    ORDER BY last_occurrence DESC
    LIMIT 1;

    IF v_existing_id IS NOT NULL THEN
        -- Erreur déjà connue — incrementer le compteur
        UPDATE public.cm_error_logs
        SET occurrence_count = occurrence_count + 1,
            last_occurrence  = NOW(),
            -- Ajouter l'email utilisateur à la liste si absent et non vide
            affected_users   = CASE
                WHEN v_user_email_val <> '' AND NOT (affected_users @> ARRAY[v_user_email_val])
                THEN array_append(affected_users, v_user_email_val)
                ELSE affected_users
            END,
            -- Mettre à jour metadata avec les nouvelles infos
            metadata = COALESCE(metadata, '{}'::jsonb) || COALESCE(p_metadata, '{}'::jsonb)
        WHERE id = v_existing_id;
    ELSE
        -- Nouvelle erreur — insérer
        INSERT INTO public.cm_error_logs (
            error_type,
            message,
            metadata,
            source,
            stack_trace,
            url,
            user_agent,
            user_email,
            user_id,
            timestamp,
            last_occurrence,
            occurrence_count,
            affected_users,
            resolved
        ) VALUES (
            p_error_type,
            p_message,
            COALESCE(p_metadata, '{}'::jsonb),
            COALESCE(p_source, 'unknown'),
            NULLIF(TRIM(COALESCE(p_stack_trace, '')), ''),
            p_url,
            p_user_agent,
            NULLIF(v_user_email_val, ''),
            p_user_id,
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
        -- Erreur silencieuse côté DB (déjà loguée dans pg_log Supabase)
        NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Réattribuer les droits EXECUTE
REVOKE ALL ON FUNCTION public.upsert_error_log(TEXT, TEXT, JSONB, TEXT, TEXT, TEXT, TEXT, TEXT, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.upsert_error_log(TEXT, TEXT, JSONB, TEXT, TEXT, TEXT, TEXT, TEXT, UUID) TO anon, authenticated;

-- ============================================================
-- ÉTAPE 3 — Vérification rapide
-- ============================================================
SELECT
    p.proname AS fonction,
    pg_get_function_identity_arguments(p.oid) AS signature,
    p.prosecdef AS security_definer,
    pg_get_functiondef(p.oid) LIKE '%NULL;%' AS is_stub
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname = 'upsert_error_log';
-- Attendre : is_stub = false
