-- ================================================================
-- 📊 CRÉATION TABLE: error_corrections
-- Date: 07/02/2026
-- Description: Table pour tracer les corrections appliquées aux erreurs
-- ================================================================

-- Supprimer la table si elle existe déjà
DROP TABLE IF EXISTS cm_error_corrections CASCADE;

-- Créer la table cm_error_corrections
CREATE TABLE cm_error_corrections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    error_id UUID REFERENCES cm_error_logs(id) ON DELETE CASCADE,
    
    -- Informations sur la correction
    file_path TEXT NOT NULL,
    old_code TEXT NOT NULL,
    new_code TEXT NOT NULL,
    description TEXT,
    
    -- Métadonnées
    applied_at TIMESTAMPTZ DEFAULT NOW(),
    applied_by UUID REFERENCES auth.users(id),
    
    -- Validation
    validated BOOLEAN DEFAULT FALSE,
    validated_at TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Contrainte unique pour éviter les doublons
    UNIQUE(error_id, file_path, old_code)
);

-- Index pour optimiser les requêtes
CREATE INDEX idx_cm_error_corrections_error_id ON cm_error_corrections(error_id);
CREATE INDEX idx_cm_error_corrections_applied_at ON cm_error_corrections(applied_at);
CREATE INDEX idx_cm_error_corrections_validated ON cm_error_corrections(validated);
CREATE INDEX idx_cm_error_corrections_file_path ON cm_error_corrections(file_path);

-- Commentaire sur la table
COMMENT ON TABLE cm_error_corrections IS 'Historique des corrections appliquées aux erreurs console';

-- Commentaires sur les colonnes
COMMENT ON COLUMN cm_error_corrections.error_id IS 'ID de l''erreur corrigée (peut être NULL pour corrections préventives)';
COMMENT ON COLUMN cm_error_corrections.file_path IS 'Chemin du fichier corrigé';
COMMENT ON COLUMN cm_error_corrections.old_code IS 'Code avant correction';
COMMENT ON COLUMN cm_error_corrections.new_code IS 'Code après correction';
COMMENT ON COLUMN cm_error_corrections.description IS 'Description de la correction appliquée';
COMMENT ON COLUMN cm_error_corrections.applied_by IS 'Utilisateur ayant appliqué la correction';
COMMENT ON COLUMN cm_error_corrections.validated IS 'Si la correction a été testée et validée';

-- RLS (Row Level Security)
ALTER TABLE cm_error_corrections ENABLE ROW LEVEL SECURITY;

-- Politique: Les admins peuvent tout voir
CREATE POLICY "Admins can view all corrections"
    ON cm_error_corrections FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND auth.users.email = 'stephanecalvignac@hotmail.fr'
        )
    );

-- Politique: Les admins peuvent insérer
CREATE POLICY "Admins can insert corrections"
    ON cm_error_corrections FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND auth.users.email = 'stephanecalvignac@hotmail.fr'
        )
    );

-- Politique: Les admins peuvent modifier
CREATE POLICY "Admins can update corrections"
    ON cm_error_corrections FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND auth.users.email = 'stephanecalvignac@hotmail.fr'
        )
    );

-- Fonction trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_cm_error_corrections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour updated_at
CREATE TRIGGER trigger_update_cm_error_corrections_updated_at
    BEFORE UPDATE ON cm_error_corrections
    FOR EACH ROW
    EXECUTE FUNCTION update_cm_error_corrections_updated_at();

-- Message de confirmation
DO $$
BEGIN
    RAISE NOTICE '✅ Table cm_error_corrections créée avec succès';
    RAISE NOTICE '✅ Index créés';
    RAISE NOTICE '✅ Politiques RLS configurées';
    RAISE NOTICE '✅ Trigger updated_at configuré';
END $$;
