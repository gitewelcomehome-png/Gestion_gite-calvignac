-- ================================================================
-- RESTAURATION TABLE: retours_menage
-- Date: 07/02/2026
-- Description: Réactivation de la fonctionnalité de retours ménage
-- ================================================================

-- Supprimer la table si elle existe déjà (pour éviter les conflits)
DROP TABLE IF EXISTS retours_menage CASCADE;

-- Créer la table retours_menage
CREATE TABLE retours_menage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    gite_id UUID NOT NULL REFERENCES gites(id) ON DELETE CASCADE,
    
    -- Date et responsable
    date_menage DATE NOT NULL,
    reported_by UUID NOT NULL REFERENCES auth.users(id),
    
    -- Checklist et problèmes
    tasks_completed JSONB DEFAULT '[]',
    issues_found JSONB DEFAULT '[]',
    
    -- Approvisionnement
    supplies_needed JSONB DEFAULT '[]',
    urgent_repairs JSONB DEFAULT '[]',
    
    -- Temps passé
    duration_minutes INT CHECK (duration_minutes > 0),
    
    -- Notes et commentaires
    commentaires TEXT,
    notes TEXT,
    photos JSONB DEFAULT '[]',
    
    -- Validation
    validated BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour optimiser les requêtes
CREATE INDEX idx_retours_menage_owner ON retours_menage(owner_user_id);
CREATE INDEX idx_retours_menage_gite ON retours_menage(gite_id);
CREATE INDEX idx_retours_menage_date ON retours_menage(date_menage);
CREATE INDEX idx_retours_menage_validated ON retours_menage(validated);

-- Commentaire sur la table
COMMENT ON TABLE retours_menage IS 'Rapports de ménage effectués par la femme de ménage';

-- RLS (Row Level Security)
ALTER TABLE retours_menage ENABLE ROW LEVEL SECURITY;

-- Politique: Les utilisateurs peuvent voir leurs propres retours
CREATE POLICY "Users can view own retours_menage"
    ON retours_menage FOR SELECT
    USING (auth.uid() = owner_user_id OR auth.uid() = reported_by);

-- Politique: Les utilisateurs peuvent créer leurs propres retours
CREATE POLICY "Users can insert own retours_menage"
    ON retours_menage FOR INSERT
    WITH CHECK (auth.uid() = owner_user_id OR auth.uid() = reported_by);

-- Politique: Les utilisateurs peuvent modifier leurs propres retours
CREATE POLICY "Users can update own retours_menage"
    ON retours_menage FOR UPDATE
    USING (auth.uid() = owner_user_id);

-- Fonction trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_retours_menage_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour updated_at
CREATE TRIGGER trigger_update_retours_menage_updated_at
    BEFORE UPDATE ON retours_menage
    FOR EACH ROW
    EXECUTE FUNCTION update_retours_menage_updated_at();

-- Message de confirmation
DO $$
BEGIN
    RAISE NOTICE '✅ Table retours_menage créée avec succès';
END $$;
