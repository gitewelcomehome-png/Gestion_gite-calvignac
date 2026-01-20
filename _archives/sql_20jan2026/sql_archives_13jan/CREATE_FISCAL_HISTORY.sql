-- Créer table pour données fiscales historiques (année par année)
CREATE TABLE IF NOT EXISTS fiscal_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    year INT NOT NULL,
    gite TEXT NOT NULL,
    revenus DECIMAL(10, 2) DEFAULT 0,
    charges DECIMAL(10, 2) DEFAULT 0,
    resultat DECIMAL(10, 2) DEFAULT 0,
    taux_occupation DECIMAL(5, 2) DEFAULT 0,
    nb_reservations INT DEFAULT 0,
    donnees_detaillees JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(owner_user_id, year, gite)
);

CREATE INDEX IF NOT EXISTS idx_fiscal_history_owner ON fiscal_history(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_fiscal_history_year ON fiscal_history(year);

-- Activer RLS
ALTER TABLE fiscal_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS fiscal_history_policy ON fiscal_history;
CREATE POLICY fiscal_history_policy ON fiscal_history
    FOR ALL 
    USING (owner_user_id = auth.uid())
    WITH CHECK (owner_user_id = auth.uid());

SELECT '✅ Table fiscal_history créée' as status;
