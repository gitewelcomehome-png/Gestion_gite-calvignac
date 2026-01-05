-- Migration : Ajout des colonnes pour la section "Reste à vivre"
-- Date : 2026-01-02

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
