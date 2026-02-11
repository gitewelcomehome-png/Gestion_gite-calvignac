-- Ajouter la colonne preferences à la table cm_clients
-- Cette colonne stockera les préférences utilisateur (thème, style, etc.)

ALTER TABLE cm_clients 
ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}'::jsonb;

-- Créer un index pour les requêtes sur les préférences
CREATE INDEX IF NOT EXISTS idx_cm_clients_preferences 
ON cm_clients USING gin (preferences);

-- Commentaire sur la colonne
COMMENT ON COLUMN cm_clients.preferences IS 'Préférences utilisateur : thème, style interface, thème fiche client';

-- Exemple de structure attendue :
-- {
--   "theme": "dark",
--   "ficheClientTheme": "cyan",
--   "style": "sidebar"
-- }
