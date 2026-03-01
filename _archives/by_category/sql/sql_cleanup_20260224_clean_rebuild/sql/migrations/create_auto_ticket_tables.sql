-- ================================================================
-- TABLES POUR LE SYSTÈME DE TICKETING AUTOMATIQUE
-- ================================================================

-- Table : Historique des tickets
CREATE TABLE IF NOT EXISTS cm_support_ticket_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES cm_support_tickets(id) ON DELETE CASCADE,
    action TEXT NOT NULL, -- 'created', 'status_changed', 'email_sent', 'auto_closed'
    description TEXT,
    created_by TEXT DEFAULT 'system',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table : Corrections d'erreurs
CREATE TABLE IF NOT EXISTS cm_error_corrections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    error_id UUID NOT NULL REFERENCES cm_error_logs(id) ON DELETE CASCADE,
    file_path TEXT NOT NULL,
    old_code TEXT,
    new_code TEXT,
    description TEXT,
    applied_by TEXT DEFAULT 'copilot',
    applied_at TIMESTAMPTZ DEFAULT NOW(),
    test_status TEXT, -- 'passed', 'failed', 'pending'
    test_results JSONB
);

-- Ajouter colonnes à cm_support_tickets si nécessaire
ALTER TABLE cm_support_tickets 
ADD COLUMN IF NOT EXISTS error_signature TEXT,
ADD COLUMN IF NOT EXISTS error_id UUID REFERENCES cm_error_logs(id),
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual',
ADD COLUMN IF NOT EXISTS resolution TEXT,
ADD COLUMN IF NOT EXISTS closed_at TIMESTAMPTZ;

-- Ajouter colonne metadata à cm_support_tickets si elle n'existe pas
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cm_support_tickets' AND column_name = 'metadata'
    ) THEN
        ALTER TABLE cm_support_tickets ADD COLUMN metadata JSONB;
    END IF;
END $$;

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_ticket_history_ticket ON cm_support_ticket_history(ticket_id);
CREATE INDEX IF NOT EXISTS idx_error_corrections_error ON cm_error_corrections(error_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_error_sig ON cm_support_tickets(error_signature) WHERE error_signature IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_support_tickets_source ON cm_support_tickets(source);

-- Commentaires
COMMENT ON TABLE cm_support_ticket_history IS 'Historique des actions sur les tickets support';
COMMENT ON TABLE cm_error_corrections IS 'Historique des corrections apportées aux erreurs';
COMMENT ON COLUMN cm_support_tickets.error_signature IS 'Signature unique de l''erreur associée (file|message|line)';
COMMENT ON COLUMN cm_support_tickets.error_id IS 'ID de l''erreur dans cm_error_logs';
COMMENT ON COLUMN cm_support_tickets.source IS 'Source du ticket: manual, auto_detection, import';
COMMENT ON COLUMN cm_support_tickets.resolution IS 'Méthode de résolution: auto_closed, manual_fix, etc.';
