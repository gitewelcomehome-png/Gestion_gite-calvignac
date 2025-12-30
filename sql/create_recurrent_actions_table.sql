-- Table pour les actions récurrentes
CREATE TABLE IF NOT EXISTS recurrent_actions (
    id BIGSERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL, -- 'menage', 'entretien', 'administratif', etc.
    gite VARCHAR(50), -- NULL = tous les gîtes
    frequency VARCHAR(20) NOT NULL, -- 'daily', 'weekly', 'monthly', 'yearly'
    frequency_detail JSONB, -- ex: {"day_of_week": 1} pour lundi, {"day_of_month": 15} pour le 15
    next_occurrence TIMESTAMP WITH TIME ZONE NOT NULL,
    last_generated TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_recurrent_actions_active ON recurrent_actions(is_active);
CREATE INDEX IF NOT EXISTS idx_recurrent_actions_next_occurrence ON recurrent_actions(next_occurrence);
CREATE INDEX IF NOT EXISTS idx_recurrent_actions_category ON recurrent_actions(category);

-- Trigger pour mettre à jour updated_at
DROP TRIGGER IF EXISTS update_recurrent_actions_updated_at ON recurrent_actions;

CREATE TRIGGER update_recurrent_actions_updated_at
    BEFORE UPDATE ON recurrent_actions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Exemples d'insertions
-- Action hebdomadaire : Vérifier les réservations tous les lundis
-- INSERT INTO recurrent_actions (title, description, category, frequency, frequency_detail, next_occurrence)
-- VALUES (
--     'Vérifier réservations de la semaine',
--     'Contrôler les paiements et envoyer les fiches clients',
--     'administratif',
--     'weekly',
--     '{"day_of_week": 1}',
--     CURRENT_TIMESTAMP + INTERVAL '1 week'
-- );

-- Action mensuelle : Contrôle qualité des gîtes
-- INSERT INTO recurrent_actions (title, description, category, gite, frequency, frequency_detail, next_occurrence)
-- VALUES (
--     'Contrôle qualité gîte',
--     'Vérifier l''état général, équipements, literie',
--     'entretien',
--     'Trévoux',
--     'monthly',
--     '{"day_of_month": 1}',
--     DATE_TRUNC('month', CURRENT_TIMESTAMP) + INTERVAL '1 month'
-- );
