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

CREATE INDEX IF NOT EXISTS idx_cm_support_ai_usage_logs_created_at
    ON public.cm_support_ai_usage_logs (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_cm_support_ai_usage_logs_endpoint_created
    ON public.cm_support_ai_usage_logs (endpoint, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_cm_support_ai_usage_logs_success_created
    ON public.cm_support_ai_usage_logs (success, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_cm_support_ai_usage_logs_error_code
    ON public.cm_support_ai_usage_logs (error_code)
    WHERE error_code IS NOT NULL;

ALTER TABLE public.cm_support_ai_usage_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin read support ai usage logs" ON public.cm_support_ai_usage_logs;
CREATE POLICY "Admin read support ai usage logs"
    ON public.cm_support_ai_usage_logs
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1
            FROM auth.users
            WHERE auth.uid() = id
            AND email = 'stephanecalvignac@hotmail.fr'
        )
    );
