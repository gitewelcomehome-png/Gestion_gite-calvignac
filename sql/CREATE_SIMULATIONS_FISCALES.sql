-- Table pour simulations fiscales (régimes d'imposition)
CREATE TABLE IF NOT EXISTS simulations_fiscales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    annee INT NOT NULL,
    gite TEXT,
    regime TEXT NOT NULL CHECK (regime IN ('reel', 'micro-bic', 'lmnp')),
    revenus_bruts DECIMAL(10, 2) DEFAULT 0,
    charges_deductibles DECIMAL(10, 2) DEFAULT 0,
    abattement_forfaitaire DECIMAL(5, 2) DEFAULT 0,
    base_imposable DECIMAL(10, 2) DEFAULT 0,
    impots_estimes DECIMAL(10, 2) DEFAULT 0,
    cotisations_sociales DECIMAL(10, 2) DEFAULT 0,
    resultat_net DECIMAL(10, 2) DEFAULT 0,
    parametres JSONB DEFAULT '{}',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(owner_user_id, annee, gite, regime)
);

CREATE INDEX IF NOT EXISTS idx_simulations_fiscales_owner ON simulations_fiscales(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_simulations_fiscales_annee ON simulations_fiscales(annee);

-- Activer RLS
ALTER TABLE simulations_fiscales ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS simulations_fiscales_policy ON simulations_fiscales;
CREATE POLICY simulations_fiscales_policy ON simulations_fiscales
    FOR ALL 
    USING (owner_user_id = auth.uid())
    WITH CHECK (owner_user_id = auth.uid());

SELECT '✅ Table simulations_fiscales créée' as status;
