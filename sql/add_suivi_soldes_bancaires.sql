-- Migration : Ajout année aux simulations + table suivi soldes bancaires
-- Date : 2026-01-02

-- 1. Ajouter l'année aux simulations fiscales
ALTER TABLE simulations_fiscales 
ADD COLUMN IF NOT EXISTS annee INTEGER DEFAULT EXTRACT(YEAR FROM NOW());

-- Index pour rechercher rapidement par année
CREATE INDEX IF NOT EXISTS idx_simulations_annee ON simulations_fiscales(annee DESC);

-- 2. Créer la table pour le suivi des soldes bancaires mensuels
CREATE TABLE IF NOT EXISTS suivi_soldes_bancaires (
    id SERIAL PRIMARY KEY,
    annee INTEGER NOT NULL,
    mois INTEGER NOT NULL CHECK (mois >= 1 AND mois <= 12),
    solde DECIMAL(10,2) NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Une seule entrée par mois/année
    UNIQUE(annee, mois)
);

-- Index pour les recherches par année
CREATE INDEX IF NOT EXISTS idx_soldes_annee ON suivi_soldes_bancaires(annee DESC, mois ASC);

-- Commentaires pour documentation
COMMENT ON TABLE suivi_soldes_bancaires IS 'Suivi mensuel des soldes bancaires pour la courbe de trésorerie';
COMMENT ON COLUMN suivi_soldes_bancaires.annee IS 'Année du relevé (ex: 2026)';
COMMENT ON COLUMN suivi_soldes_bancaires.mois IS 'Mois du relevé (1-12)';
COMMENT ON COLUMN suivi_soldes_bancaires.solde IS 'Solde en banque à la fin du mois';
COMMENT ON COLUMN suivi_soldes_bancaires.notes IS 'Notes optionnelles sur le mois';
COMMENT ON COLUMN simulations_fiscales.annee IS 'Année fiscale de la simulation';

-- Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_soldes_updated_at
    BEFORE UPDATE ON suivi_soldes_bancaires
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
