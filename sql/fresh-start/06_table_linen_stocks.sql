-- ================================================================
-- TABLE LINEN_STOCKS (Stocks de linge)
-- ================================================================

CREATE TABLE IF NOT EXISTS linen_stocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    gite_id UUID NOT NULL REFERENCES gites(id) ON DELETE CASCADE,
    draps_plats_grands INT DEFAULT 0,
    draps_plats_petits INT DEFAULT 0,
    housses_couettes_grandes INT DEFAULT 0,
    housses_couettes_petites INT DEFAULT 0,
    taies_oreillers INT DEFAULT 0,
    serviettes INT DEFAULT 0,
    tapis_bain INT DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(gite_id)
);

CREATE INDEX idx_linen_stocks_org ON linen_stocks(organization_id);
CREATE INDEX idx_linen_stocks_gite ON linen_stocks(gite_id);

ALTER TABLE linen_stocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members_all_linen_stocks" ON linen_stocks FOR ALL TO authenticated 
USING (organization_id IN (SELECT get_user_orgs()));

-- ================================================================
-- MESSAGE
-- ================================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Table linen_stocks créée avec succès';
    RAISE NOTICE '🧺 Stocks de linge par gîte';
    RAISE NOTICE '🔒 RLS activé';
END $$;
