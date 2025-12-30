-- Ajouter les colonnes pour gérer la récurrence directement dans todos
ALTER TABLE todos ADD COLUMN IF NOT EXISTS is_recurrent BOOLEAN DEFAULT false;
ALTER TABLE todos ADD COLUMN IF NOT EXISTS frequency VARCHAR(20); -- 'weekly', 'biweekly', 'monthly'
ALTER TABLE todos ADD COLUMN IF NOT EXISTS frequency_detail JSONB; -- ex: {"day_of_week": 1} pour lundi
ALTER TABLE todos ADD COLUMN IF NOT EXISTS next_occurrence TIMESTAMP WITH TIME ZONE;
ALTER TABLE todos ADD COLUMN IF NOT EXISTS last_generated TIMESTAMP WITH TIME ZONE;

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_todos_recurrent ON todos(is_recurrent);
CREATE INDEX IF NOT EXISTS idx_todos_next_occurrence ON todos(next_occurrence);

-- Commentaires pour documentation
COMMENT ON COLUMN todos.is_recurrent IS 'Indique si cette tâche doit se régénérer automatiquement';
COMMENT ON COLUMN todos.frequency IS 'Fréquence de récurrence: weekly, biweekly, monthly';
COMMENT ON COLUMN todos.frequency_detail IS 'Détails de la fréquence (jour de la semaine, etc.)';
COMMENT ON COLUMN todos.next_occurrence IS 'Date de la prochaine génération automatique';
COMMENT ON COLUMN todos.last_generated IS 'Date de la dernière génération automatique';

-- Exemples d'insertions de tâches récurrentes
-- Tâche hebdomadaire : Vérifier réservations tous les lundis
-- INSERT INTO todos (title, description, category, gite, is_recurrent, frequency, frequency_detail, next_occurrence, completed, archived_at)
-- VALUES (
--     'Vérifier réservations de la semaine',
--     'Contrôler les paiements et envoyer les fiches clients',
--     'reservations',
--     NULL,
--     true,
--     'weekly',
--     '{"day_of_week": 1}'::jsonb,
--     DATE_TRUNC('week', CURRENT_TIMESTAMP) + INTERVAL '1 week' + INTERVAL '0 days',
--     false,
--     NULL
-- );

-- Tâche toutes les 2 semaines : Inventaire produits d'entretien
-- INSERT INTO todos (title, description, category, gite, is_recurrent, frequency, frequency_detail, next_occurrence, completed, archived_at)
-- VALUES (
--     'Inventaire produits d''entretien',
--     'Vérifier stock et commander si nécessaire',
--     'achats',
--     'Trévoux',
--     true,
--     'biweekly',
--     NULL,
--     CURRENT_TIMESTAMP + INTERVAL '2 weeks',
--     false,
--     NULL
-- );

-- Tâche mensuelle : Contrôle qualité
-- INSERT INTO todos (title, description, category, gite, is_recurrent, frequency, frequency_detail, next_occurrence, completed, archived_at)
-- VALUES (
--     'Contrôle qualité gîte',
--     'Vérifier l''état général, équipements, literie',
--     'travaux',
--     'Calvignac',
--     true,
--     'monthly',
--     '{"day_of_month": 1}'::jsonb,
--     DATE_TRUNC('month', CURRENT_TIMESTAMP) + INTERVAL '1 month',
--     false,
--     NULL
-- );
