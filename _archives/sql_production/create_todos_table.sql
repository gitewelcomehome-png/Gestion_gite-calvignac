-- Table pour les todo listes du dashboard
CREATE TABLE IF NOT EXISTS todos (
    id BIGSERIAL PRIMARY KEY,
    category VARCHAR(50) NOT NULL, -- 'reservations', 'travaux', 'achats'
    title TEXT NOT NULL,
    description TEXT,
    gite VARCHAR(50), -- 'Trévoux', 'Couzon', ou NULL pour les deux
    completed BOOLEAN DEFAULT FALSE,
    archived_at TIMESTAMP WITH TIME ZONE, -- Date d'archivage (NULL = actif)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Supprimer le trigger s'il existe déjà, puis le recréer
DROP TRIGGER IF EXISTS update_todos_updated_at ON todos;
CREATE TRIGGER update_todos_updated_at
    BEFORE UPDATE ON todos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_todos_category ON todos(category);
CREATE INDEX IF NOT EXISTS idx_todos_completed ON todos(completed);
CREATE INDEX IF NOT EXISTS idx_todos_archived ON todos(archived_at);
CREATE INDEX IF NOT EXISTS idx_todos_gite ON todos(gite);
