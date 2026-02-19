-- ================================================================
-- 🤖 LOGS USAGE SUPPORT IA (consommation, coût, incidents)
-- ================================================================

CREATE TABLE IF NOT EXISTS public.cm_support_ai_usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    endpoint TEXT NOT NULL DEFAULT 'support-ai',
    request_source TEXT NOT NULL DEFAULT 'unknown',
    origin TEXT,
    client_ip_hash TEXT,
    model TEXT,
    prompt_chars INTEGER NOT NULL DEFAULT 0,
    prompt_tokens INTEGER NOT NULL DEFAULT 0,
    completion_tokens INTEGER NOT NULL DEFAULT 0,
    total_tokens INTEGER NOT NULL DEFAULT 0,
    estimated_cost_eur NUMERIC(12,6) NOT NULL DEFAULT 0,
    latency_ms INTEGER,
    status_code INTEGER NOT NULL,
    success BOOLEAN NOT NULL DEFAULT false,
    error_code TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT cm_support_ai_usage_logs_prompt_chars_ck CHECK (prompt_chars >= 0),
    CONSTRAINT cm_support_ai_usage_logs_prompt_tokens_ck CHECK (prompt_tokens >= 0),
    CONSTRAINT cm_support_ai_usage_logs_completion_tokens_ck CHECK (completion_tokens >= 0),
    CONSTRAINT cm_support_ai_usage_logs_total_tokens_ck CHECK (total_tokens >= 0),
    CONSTRAINT cm_support_ai_usage_logs_estimated_cost_ck CHECK (estimated_cost_eur >= 0)
);

COMMENT ON TABLE public.cm_support_ai_usage_logs IS 'Journal des appels IA support: usage tokens, coût estimé, statut et latence';
COMMENT ON COLUMN public.cm_support_ai_usage_logs.request_source IS 'Origine fonctionnelle: client-support, admin-support-copilot, etc.';
COMMENT ON COLUMN public.cm_support_ai_usage_logs.client_ip_hash IS 'Hash SHA-256 de l IP client salé (aucune IP brute stockée)';

ALTER TABLE public.cm_support_ai_usage_logs
    ADD COLUMN IF NOT EXISTS requester_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS requester_client_id UUID REFERENCES public.cm_clients(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS requester_ticket_id UUID REFERENCES public.cm_support_tickets(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS error_signature TEXT,
    ADD COLUMN IF NOT EXISTS auto_ticket_id UUID REFERENCES public.cm_support_tickets(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS auto_ticket_status TEXT,
    ADD COLUMN IF NOT EXISTS auto_ticket_note TEXT,
    ADD COLUMN IF NOT EXISTS auto_ticket_processed_at TIMESTAMPTZ;

COMMENT ON COLUMN public.cm_support_ai_usage_logs.requester_user_id IS 'auth.users.id ayant déclenché l appel IA si disponible';
COMMENT ON COLUMN public.cm_support_ai_usage_logs.requester_client_id IS 'cm_clients.id du client concerné si disponible';
COMMENT ON COLUMN public.cm_support_ai_usage_logs.requester_ticket_id IS 'Ticket support source si l appel provient d un ticket existant';
COMMENT ON COLUMN public.cm_support_ai_usage_logs.error_signature IS 'Signature stable de l incident pour anti-doublon de tickets auto';
COMMENT ON COLUMN public.cm_support_ai_usage_logs.auto_ticket_id IS 'Ticket auto créé/lié pour cet incident';
COMMENT ON COLUMN public.cm_support_ai_usage_logs.auto_ticket_status IS 'Etat du workflow auto-ticket (created, linked, ignored)';
COMMENT ON COLUMN public.cm_support_ai_usage_logs.auto_ticket_note IS 'Note technique associée au traitement auto-ticket';
COMMENT ON COLUMN public.cm_support_ai_usage_logs.auto_ticket_processed_at IS 'Horodatage de traitement du log par l auto-ticketing';

CREATE INDEX IF NOT EXISTS idx_cm_support_ai_usage_logs_created_at
    ON public.cm_support_ai_usage_logs (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_cm_support_ai_usage_logs_endpoint_created
    ON public.cm_support_ai_usage_logs (endpoint, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_cm_support_ai_usage_logs_success_created
    ON public.cm_support_ai_usage_logs (success, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_cm_support_ai_usage_logs_error_code
    ON public.cm_support_ai_usage_logs (error_code)
    WHERE error_code IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_cm_support_ai_usage_logs_requester_client_created
    ON public.cm_support_ai_usage_logs (requester_client_id, created_at DESC)
    WHERE requester_client_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_cm_support_ai_usage_logs_auto_ticket_pending
    ON public.cm_support_ai_usage_logs (created_at DESC)
    WHERE auto_ticket_processed_at IS NULL
      AND requester_client_id IS NOT NULL
      AND success = false;

ALTER TABLE public.cm_support_ai_usage_logs ENABLE ROW LEVEL SECURITY;

-- Helper admin dédié aux logs support IA (sans email hardcodé)
-- Configuration attendue côté BDD:
-- ALTER DATABASE postgres SET app.support_ai_admin_emails = 'admin1@domaine.tld,admin2@domaine.tld';
CREATE OR REPLACE FUNCTION public.is_support_ai_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    WITH cfg AS (
        SELECT regexp_split_to_array(
            lower(COALESCE(NULLIF(current_setting('app.support_ai_admin_emails', true), ''), '')),
            '\\s*,\\s*'
        ) AS emails
    )
    SELECT EXISTS (
        SELECT 1
        FROM cfg, unnest(cfg.emails) AS email
        WHERE email <> ''
          AND email = lower(COALESCE(auth.jwt()->>'email', ''))
    );
$$;

COMMENT ON FUNCTION public.is_support_ai_admin() IS 'Retourne true si le JWT courant appartient à un email listé dans app.support_ai_admin_emails';

DROP POLICY IF EXISTS "Admin read support ai usage logs" ON public.cm_support_ai_usage_logs;
CREATE POLICY "Admin read support ai usage logs"
    ON public.cm_support_ai_usage_logs
    FOR SELECT
    USING (public.is_support_ai_admin());
