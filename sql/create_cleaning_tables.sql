-- Table pour le planning de ménage
CREATE TABLE IF NOT EXISTS cleaning_schedule (
    id SERIAL PRIMARY KEY,
    reservation_id INTEGER UNIQUE REFERENCES reservations(id) ON DELETE CASCADE,
    gite VARCHAR(50) NOT NULL,
    scheduled_date DATE NOT NULL,
    time_of_day VARCHAR(20) DEFAULT 'afternoon', -- morning ou afternoon
    week_number VARCHAR(10), -- S1, S2, S3, etc.
    status VARCHAR(20) DEFAULT 'pending', -- pending, validated, modified
    validated_by_company BOOLEAN DEFAULT FALSE,
    proposed_date DATE, -- Date proposée par la société si différente
    reservation_end DATE, -- Date de fin de réservation avant
    reservation_start_after DATE, -- Date de début de réservation après
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_cleaning_schedule_date ON cleaning_schedule(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_cleaning_schedule_gite ON cleaning_schedule(gite);
CREATE INDEX IF NOT EXISTS idx_cleaning_schedule_status ON cleaning_schedule(status);

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_cleaning_schedule_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour updated_at
DROP TRIGGER IF EXISTS set_cleaning_schedule_timestamp ON cleaning_schedule;
CREATE TRIGGER set_cleaning_schedule_timestamp
    BEFORE UPDATE ON cleaning_schedule
    FOR EACH ROW
    EXECUTE FUNCTION update_cleaning_schedule_timestamp();

-- Permissions (à ajuster selon vos besoins)
ALTER TABLE cleaning_schedule ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre la lecture à tous
CREATE POLICY "Allow public read access on cleaning_schedule"
    ON cleaning_schedule FOR SELECT
    USING (true);

-- Politique pour permettre l'insertion/mise à jour à tous (à sécuriser en production)
CREATE POLICY "Allow public insert on cleaning_schedule"
    ON cleaning_schedule FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Allow public update on cleaning_schedule"
    ON cleaning_schedule FOR UPDATE
    USING (true);

CREATE POLICY "Allow public delete on cleaning_schedule"
    ON cleaning_schedule FOR DELETE
    USING (true);
