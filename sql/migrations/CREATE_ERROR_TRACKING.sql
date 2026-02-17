-- ================================================================
-- TABLE ERROR TRACKING - Surveillance Erreurs Critiques
-- ================================================================

CREATE TABLE IF NOT EXISTS cm_error_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    error_type TEXT NOT NULL, -- 'critical', 'warning', 'info'
    source TEXT NOT NULL, -- page où l'erreur s'est produite
    message TEXT NOT NULL,
    stack_trace TEXT,
    user_email TEXT,
    user_agent TEXT,
    url TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMPTZ,
    resolved_by TEXT
);

-- Index pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_error_logs_timestamp ON cm_error_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_type ON cm_error_logs(error_type);
CREATE INDEX IF NOT EXISTS idx_error_logs_resolved ON cm_error_logs(resolved) WHERE resolved = false;
CREATE INDEX IF NOT EXISTS idx_error_logs_source ON cm_error_logs(source);

-- Vue des erreurs non résolues
CREATE OR REPLACE VIEW v_cm_errors_unresolved AS
SELECT 
    error_type,
    source,
    message,
    COUNT(*) as occurrences,
    MAX(timestamp) as last_occurrence,
    MIN(timestamp) as first_occurrence
FROM cm_error_logs
WHERE resolved = false
GROUP BY error_type, source, message
ORDER BY MAX(timestamp) DESC;

COMMENT ON TABLE cm_error_logs IS 'Logs des erreurs critiques de l''application';
