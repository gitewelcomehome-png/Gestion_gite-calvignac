-- ================================================================
-- CRÉATION TABLES AUTO-TICKET - VERSION SIMPLIFIÉE
-- ================================================================
-- Compatible avec la structure cm_support_tickets existante
-- Crée uniquement les nouvelles tables nécessaires
-- ================================================================

-- ================================================================
-- 1. TABLE : Historique des tickets
-- ================================================================
CREATE TABLE IF NOT EXISTS cm_support_ticket_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL,  -- Pas de FK pour éviter erreurs si structure différente
    action TEXT NOT NULL,
    description TEXT,
    created_by TEXT DEFAULT 'system',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ticket_history_ticket 
ON cm_support_ticket_history(ticket_id);

CREATE INDEX IF NOT EXISTS idx_ticket_history_created 
ON cm_support_ticket_history(created_at DESC);

COMMENT ON TABLE cm_support_ticket_history IS 'Historique des actions sur les tickets support';

-- ================================================================
-- 2. TABLE : Corrections d'erreurs
-- ================================================================
CREATE TABLE IF NOT EXISTS cm_error_corrections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    error_id UUID NOT NULL,  -- Pas de FK pour éviter erreurs
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
ON cm_error_corrections(error_id);

CREATE INDEX IF NOT EXISTS idx_error_corrections_applied 
ON cm_error_corrections(applied_at DESC);

CREATE INDEX IF NOT EXISTS idx_error_corrections_status 
ON cm_error_corrections(test_status) WHERE test_status IS NOT NULL;

COMMENT ON TABLE cm_error_corrections IS 'Historique des corrections apportées aux erreurs';

-- ================================================================
-- 3. COLONNES OPTIONNELLES pour cm_support_tickets
-- ================================================================
-- Ajouter colonnes uniquement si elles n'existent pas
-- Ne génère PAS d'erreur si la table a une structure différente

DO $$ 
BEGIN
    -- error_signature
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cm_support_tickets' AND column_name = 'error_signature'
    ) THEN
        ALTER TABLE cm_support_tickets ADD COLUMN error_signature TEXT;
        CREATE INDEX idx_support_tickets_error_sig ON cm_support_tickets(error_signature) WHERE error_signature IS NOT NULL;
    END IF;

    -- error_id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cm_support_tickets' AND column_name = 'error_id'
    ) THEN
        ALTER TABLE cm_support_tickets ADD COLUMN error_id UUID;
    END IF;

    -- source
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cm_support_tickets' AND column_name = 'source'
    ) THEN
        ALTER TABLE cm_support_tickets ADD COLUMN source TEXT DEFAULT 'manual';
        CREATE INDEX idx_support_tickets_source ON cm_support_tickets(source);
    END IF;

    -- resolution
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cm_support_tickets' AND column_name = 'resolution'
    ) THEN
        ALTER TABLE cm_support_tickets ADD COLUMN resolution TEXT;
    END IF;

    -- closed_at
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cm_support_tickets' AND column_name = 'closed_at'
    ) THEN
        ALTER TABLE cm_support_tickets ADD COLUMN closed_at TIMESTAMPTZ;
    END IF;

    -- metadata (JSONB)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cm_support_tickets' AND column_name = 'metadata'
    ) THEN
        ALTER TABLE cm_support_tickets ADD COLUMN metadata JSONB;
    END IF;

END $$;

-- ================================================================
-- 4. VÉRIFICATION
-- ================================================================
-- Afficher les tables créées
SELECT 
    'cm_support_ticket_history' as table_name,
    COUNT(*) as row_count
FROM cm_support_ticket_history
UNION ALL
SELECT 
    'cm_error_corrections',
    COUNT(*)
FROM cm_error_corrections;

-- Afficher les colonnes ajoutées à cm_support_tickets
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'cm_support_tickets'
AND column_name IN ('error_signature', 'error_id', 'source', 'resolution', 'closed_at', 'metadata')
ORDER BY column_name;

-- ================================================================
-- ✅ TERMINÉ
-- ================================================================
-- Si vous voyez ce message sans erreur, les tables sont créées !
