-- ================================================================
-- TABLE RETOURS MÉNAGE
-- Stocke les retours de la femme de ménage après chaque intervention
-- ================================================================

CREATE TABLE IF NOT EXISTS retours_menage (
    id SERIAL PRIMARY KEY,
    gite TEXT NOT NULL,
    date_menage DATE NOT NULL,
    
    -- État de la maison à l'arrivée
    etat_arrivee TEXT CHECK (etat_arrivee IN ('propre', 'sale', 'dégâts', 'autre')),
    details_etat TEXT,
    
    -- Déroulement du ménage
    deroulement TEXT CHECK (deroulement IN ('bien', 'problèmes', 'difficultés')),
    details_deroulement TEXT,
    
    -- Photos éventuelles (URLs)
    photos TEXT[], -- Array de URLs de photos
    
    -- Validation par le propriétaire
    validated BOOLEAN DEFAULT FALSE,
    validated_at TIMESTAMP WITH TIME ZONE,
    validated_by TEXT,
    
    -- Métadonnées
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by TEXT DEFAULT 'Femme de ménage'
);

-- Index pour les recherches fréquentes
CREATE INDEX IF NOT EXISTS idx_retours_menage_gite ON retours_menage(gite);
CREATE INDEX IF NOT EXISTS idx_retours_menage_date ON retours_menage(date_menage);
CREATE INDEX IF NOT EXISTS idx_retours_menage_validated ON retours_menage(validated);

-- Désactiver RLS pour simplifier l'accès
ALTER TABLE retours_menage DISABLE ROW LEVEL SECURITY;

COMMENT ON TABLE retours_menage IS 'Retours de la femme de ménage après chaque intervention';
COMMENT ON COLUMN retours_menage.etat_arrivee IS 'État de la maison à l''arrivée (propre/sale/dégâts/autre)';
COMMENT ON COLUMN retours_menage.deroulement IS 'Comment s''est passé le ménage (bien/problèmes/difficultés)';
COMMENT ON COLUMN retours_menage.validated IS 'Retour validé par le propriétaire';
