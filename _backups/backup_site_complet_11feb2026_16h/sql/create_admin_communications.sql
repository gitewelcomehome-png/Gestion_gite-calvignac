-- ================================================================
-- TABLE: admin_communications
-- ================================================================
-- Permet aux admins d'envoyer des informations aux clients
-- Les clients verront ces messages dans leur interface
-- ================================================================

CREATE TABLE IF NOT EXISTS admin_communications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    titre TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'info', -- 'info', 'warning', 'success', 'urgent'
    date_fin TIMESTAMP WITH TIME ZONE, -- Date d'expiration (null = permanent)
    cible TEXT NOT NULL DEFAULT 'all', -- 'all', 'actif', 'trial', 'premium'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_communications_created ON admin_communications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_communications_type ON admin_communications(type);
CREATE INDEX IF NOT EXISTS idx_communications_cible ON admin_communications(cible);

-- RLS: Seuls les admins peuvent gérer
ALTER TABLE admin_communications ENABLE ROW LEVEL SECURITY;

-- Policy: Admins peuvent tout faire
CREATE POLICY "Admins can manage communications"
    ON admin_communications
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'admin')
    WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Policy: Clients peuvent lire les communications qui les concernent
CREATE POLICY "Clients can read their communications"
    ON admin_communications
    FOR SELECT
    USING (
        -- Communications pour tous
        cible = 'all'
        OR
        -- Ou communications qui correspondent au statut du client
        (cible != 'all' AND date_fin IS NULL OR date_fin > NOW())
    );

COMMENT ON TABLE admin_communications IS 'Messages et informations envoyés par les admins aux clients';
COMMENT ON COLUMN admin_communications.type IS 'Type de message: info, warning, success, urgent';
COMMENT ON COLUMN admin_communications.cible IS 'Cible: all, actif, trial, premium';
COMMENT ON COLUMN admin_communications.date_fin IS 'Date d''expiration du message (NULL = permanent)';
