-- ================================================================
-- FIX TABLE DRAPS - MIGRATION vers linen_stocks
-- ================================================================
-- Date: 14 janvier 2026
-- Objectif: Créer la table linen_stocks utilisée par draps.js
-- Note: Remplace l'ancienne table stocks_draps qui a une structure inadaptée

-- 1. Supprimer l'ancienne table stocks_draps si elle existe
DROP TABLE IF EXISTS stocks_draps CASCADE;

-- 2. Créer la nouvelle table linen_stocks avec la bonne structure
CREATE TABLE IF NOT EXISTS linen_stocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    gite_id UUID NOT NULL REFERENCES gites(id) ON DELETE CASCADE,
    
    -- Colonnes pour chaque type de linge (correspondant au code JS)
    draps_plats_grands INT DEFAULT 0 CHECK (draps_plats_grands >= 0),
    draps_plats_petits INT DEFAULT 0 CHECK (draps_plats_petits >= 0),
    housses_couettes_grandes INT DEFAULT 0 CHECK (housses_couettes_grandes >= 0),
    housses_couettes_petites INT DEFAULT 0 CHECK (housses_couettes_petites >= 0),
    taies_oreillers INT DEFAULT 0 CHECK (taies_oreillers >= 0),
    serviettes INT DEFAULT 0 CHECK (serviettes >= 0),
    tapis_bain INT DEFAULT 0 CHECK (tapis_bain >= 0),
    
    -- Métadonnées
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Contrainte UNIQUE pour on_conflict dans JS (upsert par gite_id)
    CONSTRAINT linen_stocks_gite_id_unique UNIQUE(gite_id)
);

-- 3. Index pour performances
CREATE INDEX IF NOT EXISTS idx_linen_stocks_owner ON linen_stocks(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_linen_stocks_gite ON linen_stocks(gite_id);

-- 4. Activer RLS
ALTER TABLE linen_stocks ENABLE ROW LEVEL SECURITY;

-- 5. Politique RLS : Les utilisateurs ne voient que leurs propres stocks
DROP POLICY IF EXISTS linen_stocks_owner_policy ON linen_stocks;
CREATE POLICY linen_stocks_owner_policy ON linen_stocks
    FOR ALL
    USING (owner_user_id = auth.uid());

-- 6. Commenter la table
COMMENT ON TABLE linen_stocks IS 'Stocks de linge par gîte - utilisé par l''onglet Draps';
COMMENT ON COLUMN linen_stocks.draps_plats_grands IS 'Draps plats pour lits 140x190 et +';
COMMENT ON COLUMN linen_stocks.draps_plats_petits IS 'Draps plats pour lits 90x190';
COMMENT ON COLUMN linen_stocks.housses_couettes_grandes IS 'Housses de couette pour lits 140x190 et +';
COMMENT ON COLUMN linen_stocks.housses_couettes_petites IS 'Housses de couette pour lits 90x190';
COMMENT ON COLUMN linen_stocks.taies_oreillers IS 'Taies d''oreiller';
COMMENT ON COLUMN linen_stocks.serviettes IS 'Serviettes de bain';
COMMENT ON COLUMN linen_stocks.tapis_bain IS 'Tapis de bain';

-- ================================================================
-- MISE À JOUR DU SCHÉMA COMPLET
-- ================================================================
-- TODO: Remplacer la section stocks_draps dans SCHEMA_COMPLET_FINAL_2026.sql
-- par cette nouvelle structure linen_stocks

SELECT '✅ Table linen_stocks créée avec succès' AS status;
