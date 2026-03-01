-- ================================================================
-- CRÉATION TABLES AUTO-TICKET (VERSION CANONIQUE)
-- ================================================================

CREATE TABLE IF NOT EXISTS public.cm_support_ticket_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL,
    action TEXT NOT NULL,
    description TEXT,
    created_by TEXT DEFAULT 'system',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ticket_history_ticket
    ON public.cm_support_ticket_history(ticket_id);

CREATE INDEX IF NOT EXISTS idx_ticket_history_created
    ON public.cm_support_ticket_history(created_at DESC);

CREATE TABLE IF NOT EXISTS public.cm_error_corrections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    error_id UUID NOT NULL,
    file_path TEXT NOT NULL,
    old_code TEXT,
    new_code TEXT,
    description TEXT,
    applied_by TEXT DEFAULT 'copilot',
    applied_at TIMESTAMPTZ DEFAULT NOW(),
    test_status TEXT,
    test_results JSONB
);

CREATE INDEX IF NOT EXISTS idx_error_corrections_error
    ON public.cm_error_corrections(error_id);

CREATE INDEX IF NOT EXISTS idx_error_corrections_applied
    ON public.cm_error_corrections(applied_at DESC);

CREATE INDEX IF NOT EXISTS idx_error_corrections_status
    ON public.cm_error_corrections(test_status)
    WHERE test_status IS NOT NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'cm_support_tickets' AND column_name = 'error_signature'
    ) THEN
        ALTER TABLE public.cm_support_tickets ADD COLUMN error_signature TEXT;
        CREATE INDEX IF NOT EXISTS idx_support_tickets_error_sig
            ON public.cm_support_tickets(error_signature)
            WHERE error_signature IS NOT NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'cm_support_tickets' AND column_name = 'error_id'
    ) THEN
        ALTER TABLE public.cm_support_tickets ADD COLUMN error_id UUID;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'cm_support_tickets' AND column_name = 'source'
    ) THEN
        ALTER TABLE public.cm_support_tickets ADD COLUMN source TEXT DEFAULT 'manual';
        CREATE INDEX IF NOT EXISTS idx_support_tickets_source
            ON public.cm_support_tickets(source);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'cm_support_tickets' AND column_name = 'resolution'
    ) THEN
        ALTER TABLE public.cm_support_tickets ADD COLUMN resolution TEXT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'cm_support_tickets' AND column_name = 'closed_at'
    ) THEN
        ALTER TABLE public.cm_support_tickets ADD COLUMN closed_at TIMESTAMPTZ;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'cm_support_tickets' AND column_name = 'metadata'
    ) THEN
        ALTER TABLE public.cm_support_tickets ADD COLUMN metadata JSONB;
    END IF;
END $$;
