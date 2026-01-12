-- ================================================================
-- TABLE FAQ (Frequently Asked Questions)
-- ================================================================
-- Reliée aux gîtes pour permettre des FAQ spécifiques par logement
-- Si gite_id est NULL, la FAQ s'applique à toute l'organisation
-- ================================================================

-- Supprimer la table si elle existe déjà
DROP TABLE IF EXISTS faq CASCADE;

CREATE TABLE faq (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    gite_id UUID REFERENCES gites(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    reponse TEXT NOT NULL,
    categorie TEXT,
    ordre INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_faq_org ON faq(organization_id);
CREATE INDEX idx_faq_gite ON faq(gite_id);
CREATE INDEX idx_faq_ordre ON faq(ordre);
CREATE INDEX idx_faq_categorie ON faq(categorie);

ALTER TABLE faq ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members_all_faq" ON faq FOR ALL TO authenticated 
USING (organization_id IN (SELECT get_user_orgs()));

-- ================================================================
-- MESSAGE DE CONFIRMATION
-- ================================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Table FAQ créée avec succès';
    RAISE NOTICE '🏠 Colonne gite_id ajoutée pour FAQ par logement';
    RAISE NOTICE '📌 Si gite_id = NULL → FAQ pour toute l''organisation';
    RAISE NOTICE '📌 Si gite_id = UUID → FAQ spécifique à ce gîte';
    RAISE NOTICE '🔒 RLS activé avec policy pour organization_members';
END $$;
