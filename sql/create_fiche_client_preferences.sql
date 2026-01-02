-- ================================================================
-- CRÉATION TABLES POUR FICHE CLIENT PERSONNALISÉE
-- ================================================================

-- Table pour stocker les préférences d'horaires des clients
CREATE TABLE IF NOT EXISTS clients_preferences (
    id BIGSERIAL PRIMARY KEY,
    reservation_id BIGINT NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
    heure_arrivee TIME,
    heure_depart TIME,
    commentaires TEXT,
    date_soumission TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table pour historique des accès à la fiche
CREATE TABLE IF NOT EXISTS fiches_consultations (
    id BIGSERIAL PRIMARY KEY,
    reservation_id BIGINT NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
    date_consultation TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ip_address TEXT,
    user_agent TEXT
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_clients_prefs_reservation ON clients_preferences(reservation_id);
CREATE INDEX IF NOT EXISTS idx_fiches_consultations_reservation ON fiches_consultations(reservation_id);
CREATE INDEX IF NOT EXISTS idx_clients_prefs_date ON clients_preferences(date_soumission DESC);

-- Trigger pour updated_at
DROP TRIGGER IF EXISTS update_clients_preferences_updated_at ON clients_preferences;
CREATE TRIGGER update_clients_preferences_updated_at
    BEFORE UPDATE ON clients_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security)
ALTER TABLE clients_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE fiches_consultations ENABLE ROW LEVEL SECURITY;

-- Supprimer les politiques existantes
DROP POLICY IF EXISTS "Clients preferences are viewable by everyone" ON clients_preferences;
DROP POLICY IF EXISTS "Clients preferences are insertable by everyone" ON clients_preferences;
DROP POLICY IF EXISTS "Clients preferences are updatable by everyone" ON clients_preferences;
DROP POLICY IF EXISTS "Fiches consultations are viewable by everyone" ON fiches_consultations;
DROP POLICY IF EXISTS "Fiches consultations are insertable by everyone" ON fiches_consultations;

-- Politique : lecture pour tous
CREATE POLICY "Clients preferences are viewable by everyone"
    ON clients_preferences FOR SELECT
    USING (true);

CREATE POLICY "Fiches consultations are viewable by everyone"
    ON fiches_consultations FOR SELECT
    USING (true);

-- Politique : insertion pour tous
CREATE POLICY "Clients preferences are insertable by everyone"
    ON clients_preferences FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Fiches consultations are insertable by everyone"
    ON fiches_consultations FOR INSERT
    WITH CHECK (true);

-- Politique : mise à jour pour tous
CREATE POLICY "Clients preferences are updatable by everyone"
    ON clients_preferences FOR UPDATE
    USING (true);

-- ================================================================
-- MODIFIER LA TABLE FAQ POUR DISTINGUER LES GÎTES
-- ================================================================

-- Les données existent déjà, on va juste vérifier la structure
-- La colonne 'gite' existe déjà avec les valeurs: 'tous', 'trevoux', 'calvignac'

-- Vérifier la structure
SELECT 
    column_name, 
    data_type, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'faq'
ORDER BY ordinal_position;

-- ================================================================
-- VÉRIFICATION
-- ================================================================

-- Afficher la structure des nouvelles tables
SELECT 
    column_name, 
    data_type, 
    column_default,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'clients_preferences'
ORDER BY ordinal_position;

SELECT 
    column_name, 
    data_type, 
    column_default,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'fiches_consultations'
ORDER BY ordinal_position;

-- Test : Afficher les FAQ par gîte
SELECT 
    gite,
    categorie,
    COUNT(*) as nb_questions
FROM faq
GROUP BY gite, categorie
ORDER BY gite, categorie;
