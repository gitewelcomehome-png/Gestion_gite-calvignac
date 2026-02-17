/**
 * ============================================================================
 * TABLE : user_notification_preferences
 * Préférences de notifications par email des utilisateurs
 * ============================================================================
 */

CREATE TABLE IF NOT EXISTS user_notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Activation globale
    email_enabled BOOLEAN DEFAULT true,
    email_address TEXT, -- Email de notification (si différent de l'email du compte)
    
    -- Préférences par type
    notify_demandes BOOLEAN DEFAULT true,
    notify_reservations BOOLEAN DEFAULT true,
    notify_taches BOOLEAN DEFAULT true,
    
    -- Fréquence d'envoi
    email_frequency TEXT DEFAULT 'immediate', -- immediate, hourly, daily
    
    -- Métadonnées
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Index et contraintes
    UNIQUE(user_id)
);

-- Index pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_notif_prefs_user ON user_notification_preferences(user_id);

-- RLS (Row Level Security)
ALTER TABLE user_notification_preferences ENABLE ROW LEVEL SECURITY;

-- Nettoyer les policies existantes
DROP POLICY IF EXISTS "Users can view own notification preferences" ON user_notification_preferences;
DROP POLICY IF EXISTS "Users can insert own notification preferences" ON user_notification_preferences;
DROP POLICY IF EXISTS "Users can update own notification preferences" ON user_notification_preferences;

-- Policy : Les utilisateurs peuvent voir et modifier leurs propres préférences
CREATE POLICY "Users can view own notification preferences"
    ON user_notification_preferences FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notification preferences"
    ON user_notification_preferences FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notification preferences"
    ON user_notification_preferences FOR UPDATE
    USING (auth.uid() = user_id);

-- Fonction pour mettre à jour updated_at automatiquement
DROP TRIGGER IF EXISTS set_notification_preferences_updated_at ON user_notification_preferences;
DROP FUNCTION IF EXISTS update_notification_preferences_updated_at();

CREATE OR REPLACE FUNCTION update_notification_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_notification_preferences_updated_at
    BEFORE UPDATE ON user_notification_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_notification_preferences_updated_at();

-- Commentaires
COMMENT ON TABLE user_notification_preferences IS 'Préférences de notifications par email des utilisateurs';
COMMENT ON COLUMN user_notification_preferences.email_enabled IS 'Activer/désactiver toutes les notifications par email';
COMMENT ON COLUMN user_notification_preferences.email_address IS 'Email de notification personnalisé (optionnel)';
COMMENT ON COLUMN user_notification_preferences.notify_demandes IS 'Recevoir emails pour nouvelles demandes horaires';
COMMENT ON COLUMN user_notification_preferences.notify_reservations IS 'Recevoir emails pour nouvelles réservations';
COMMENT ON COLUMN user_notification_preferences.notify_taches IS 'Recevoir emails pour nouvelles tâches ménage';
COMMENT ON COLUMN user_notification_preferences.email_frequency IS 'Fréquence envoi: immediate, hourly, daily';
