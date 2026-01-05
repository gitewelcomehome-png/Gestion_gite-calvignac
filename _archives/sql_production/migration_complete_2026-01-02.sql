-- =====================================================
-- MIGRATION COMPLÈTE - 2 janvier 2026
-- =====================================================
-- Ce script combine toutes les migrations nécessaires:
-- 1. Colonnes pour reste à vivre
-- 2. Colonne année pour simulations
-- 3. Table suivi soldes bancaires
-- =====================================================

-- =====================================================
-- PARTIE 1: RESTE À VIVRE
-- =====================================================

-- Ajouter la liste des crédits (JSONB)
ALTER TABLE simulations_fiscales 
ADD COLUMN IF NOT EXISTS credits_liste JSONB DEFAULT '[]'::jsonb;

-- Ajouter les frais personnels mensuels de la maison
ALTER TABLE simulations_fiscales 
ADD COLUMN IF NOT EXISTS frais_perso_internet DECIMAL(10,2) DEFAULT 0;

ALTER TABLE simulations_fiscales 
ADD COLUMN IF NOT EXISTS frais_perso_electricite DECIMAL(10,2) DEFAULT 0;

ALTER TABLE simulations_fiscales 
ADD COLUMN IF NOT EXISTS frais_perso_eau DECIMAL(10,2) DEFAULT 0;

ALTER TABLE simulations_fiscales 
ADD COLUMN IF NOT EXISTS frais_perso_assurance DECIMAL(10,2) DEFAULT 0;

ALTER TABLE simulations_fiscales 
ADD COLUMN IF NOT EXISTS frais_perso_taxe DECIMAL(10,2) DEFAULT 0;

ALTER TABLE simulations_fiscales 
ADD COLUMN IF NOT EXISTS frais_perso_autres DECIMAL(10,2) DEFAULT 0;

-- Commentaires pour documentation
COMMENT ON COLUMN simulations_fiscales.credits_liste IS 'Liste des crédits (JSONB) : description, mensualité, capital restant';
COMMENT ON COLUMN simulations_fiscales.frais_perso_internet IS 'Frais internet mensuel de la résidence principale';
COMMENT ON COLUMN simulations_fiscales.frais_perso_electricite IS 'Frais électricité mensuel de la résidence principale';
COMMENT ON COLUMN simulations_fiscales.frais_perso_eau IS 'Frais eau mensuel de la résidence principale';
COMMENT ON COLUMN simulations_fiscales.frais_perso_assurance IS 'Frais assurance mensuel de la résidence principale';
COMMENT ON COLUMN simulations_fiscales.frais_perso_taxe IS 'Taxes annuelles de la résidence principale';
COMMENT ON COLUMN simulations_fiscales.frais_perso_autres IS 'Autres frais personnels mensuels';

-- =====================================================
-- PARTIE 2: ANNÉE DES SIMULATIONS
-- =====================================================

-- Ajouter l'année aux simulations fiscales
ALTER TABLE simulations_fiscales 
ADD COLUMN IF NOT EXISTS annee INTEGER DEFAULT EXTRACT(YEAR FROM NOW());

-- Index pour rechercher rapidement par année
CREATE INDEX IF NOT EXISTS idx_simulations_annee ON simulations_fiscales(annee DESC);

COMMENT ON COLUMN simulations_fiscales.annee IS 'Année fiscale de la simulation';

-- =====================================================
-- PARTIE 3: SUIVI SOLDES BANCAIRES
-- =====================================================

-- Créer la table pour le suivi des soldes bancaires mensuels
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

-- Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Supprimer le trigger s'il existe déjà
DROP TRIGGER IF EXISTS update_soldes_updated_at ON suivi_soldes_bancaires;

-- Créer le trigger
CREATE TRIGGER update_soldes_updated_at
    BEFORE UPDATE ON suivi_soldes_bancaires
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- MIGRATION TERMINÉE
-- =====================================================
-- Toutes les colonnes et tables sont maintenant créées
-- L'application peut fonctionner correctement
-- =====================================================
