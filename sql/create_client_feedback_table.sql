-- ================================================================
-- CRÉATION TABLE CLIENT_FEEDBACK - RETOURS CLIENTS
-- ================================================================

-- Créer la table pour les feedbacks clients
CREATE TABLE IF NOT EXISTS client_feedback (
    id BIGSERIAL PRIMARY KEY,
    reservation_id BIGINT NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
    
    -- Notes globales (1-5)
    note_globale INT CHECK (note_globale BETWEEN 1 AND 5),
    note_proprete INT CHECK (note_proprete BETWEEN 1 AND 5),
    note_confort INT CHECK (note_confort BETWEEN 1 AND 5),
    note_equipements INT CHECK (note_equipements BETWEEN 1 AND 5),
    note_localisation INT CHECK (note_localisation BETWEEN 1 AND 5),
    note_communication INT CHECK (note_communication BETWEEN 1 AND 5),
    
    -- Commentaires textuels
    points_positifs TEXT,
    problemes_rencontres TEXT,
    suggestions TEXT,
    
    -- Catégories de problèmes (array)
    categories_problemes TEXT[],
    
    -- Recommandation
    recommandation VARCHAR(20) CHECK (recommandation IN ('oui', 'non', 'peut-etre')),
    
    -- Photos (URLs)
    photos_urls TEXT[],
    
    -- Métadonnées
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ip_address TEXT,
    user_agent TEXT
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_feedback_reservation ON client_feedback(reservation_id);
CREATE INDEX IF NOT EXISTS idx_feedback_date ON client_feedback(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_note_globale ON client_feedback(note_globale);

-- Trigger pour mettre à jour updated_at
DROP TRIGGER IF EXISTS update_client_feedback_updated_at ON client_feedback;
CREATE TRIGGER update_client_feedback_updated_at
    BEFORE UPDATE ON client_feedback
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security)
ALTER TABLE client_feedback ENABLE ROW LEVEL SECURITY;

-- Supprimer les politiques existantes
DROP POLICY IF EXISTS "Client feedback are viewable by everyone" ON client_feedback;
DROP POLICY IF EXISTS "Client feedback are insertable by everyone" ON client_feedback;
DROP POLICY IF EXISTS "Client feedback are updatable by everyone" ON client_feedback;

-- Politiques : lecture pour tous
CREATE POLICY "Client feedback are viewable by everyone"
    ON client_feedback FOR SELECT
    USING (true);

-- Politiques : insertion pour tous (clients)
CREATE POLICY "Client feedback are insertable by everyone"
    ON client_feedback FOR INSERT
    WITH CHECK (true);

-- Politiques : mise à jour pour tous
CREATE POLICY "Client feedback are updatable by everyone"
    ON client_feedback FOR UPDATE
    USING (true);

-- ================================================================
-- VÉRIFICATION
-- ================================================================

-- Afficher la structure
SELECT 
    column_name, 
    data_type, 
    column_default,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'client_feedback'
ORDER BY ordinal_position;

-- Test : compter les feedbacks
SELECT COUNT(*) as total_feedbacks FROM client_feedback;
