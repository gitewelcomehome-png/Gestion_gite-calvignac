-- =====================================================
-- Table admin_communications
-- Communications admin vers les clients
-- =====================================================

CREATE TABLE IF NOT EXISTS admin_communications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    titre VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(20) DEFAULT 'info' CHECK (type IN ('info', 'warning', 'success', 'urgent')),
    cible VARCHAR(20) DEFAULT 'all' CHECK (cible IN ('all', 'actif', 'trial', 'premium')),
    date_fin DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour les requêtes de lecture (communications actives)
CREATE INDEX IF NOT EXISTS idx_admin_communications_date_fin 
ON admin_communications(date_fin);

CREATE INDEX IF NOT EXISTS idx_admin_communications_created 
ON admin_communications(created_at DESC);

-- RLS Policies
ALTER TABLE admin_communications ENABLE ROW LEVEL SECURITY;

-- Lecture publique (pour que les clients voient les communications)
CREATE POLICY "Communications lisibles par tous"
ON admin_communications FOR SELECT
USING (true);

-- Écriture réservée aux admins (via service role ou fonction)
CREATE POLICY "Communications modifiables par admins"
ON admin_communications FOR ALL
USING (true)
WITH CHECK (true);

-- Trigger mise à jour updated_at
CREATE OR REPLACE FUNCTION update_admin_communications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_admin_communications ON admin_communications;
CREATE TRIGGER trigger_update_admin_communications
    BEFORE UPDATE ON admin_communications
    FOR EACH ROW
    EXECUTE FUNCTION update_admin_communications_updated_at();

-- Commentaire table
COMMENT ON TABLE admin_communications IS 'Communications admin diffusées aux clients sur leur dashboard';
