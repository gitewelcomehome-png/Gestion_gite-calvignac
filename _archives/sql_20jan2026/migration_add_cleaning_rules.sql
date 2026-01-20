-- =====================================================
-- MIGRATION: Ajout du système de règles de ménage
-- Date: 15 janvier 2026
-- Description: Permet aux utilisateurs de configurer
--              les règles de planification des ménages
-- =====================================================

-- Vérifier que la table n'existe pas déjà
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'cleaning_rules') THEN
        RAISE NOTICE 'La table cleaning_rules existe déjà, migration annulée.';
        RETURN;
    END IF;
    
    RAISE NOTICE 'Création de la table cleaning_rules...';
END
$$;

-- =====================================================
-- TABLE RÈGLES DE MÉNAGE CONFIGURABLES
-- =====================================================

CREATE TABLE IF NOT EXISTS cleaning_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_code VARCHAR(50) UNIQUE NOT NULL,
    rule_name VARCHAR(255) NOT NULL,
    description TEXT,
    is_enabled BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 0,
    config JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertion des règles par défaut
INSERT INTO cleaning_rules (rule_code, rule_name, description, is_enabled, priority, config) VALUES
-- RÈGLE 1: Ménage après-midi par défaut
('default_afternoon', 'Ménage l''après-midi par défaut', 'Le ménage est programmé l''après-midi (12h) par défaut', true, 10, '{"default_time": "afternoon", "default_hour": "12h00"}'),

-- RÈGLE 2: Éviter les jours fériés
('avoid_holidays', 'Éviter les jours fériés', 'Reporter le ménage au jour ouvrable suivant si c''est un jour férié (sauf enchainement)', true, 20, '{"postpone_if_holiday": true, "unless_same_day_checkin": true}'),

-- RÈGLE 3: Ménage obligatoire entre deux réservations
('mandatory_between_bookings', 'Ménage obligatoire entre deux réservations', 'Un ménage doit toujours être effectué entre deux réservations consécutives', true, 5, '{"mandatory": true}'),

-- RÈGLE 4: Gestion des dimanches
('sunday_postpone', 'Reporter les dimanches au lundi', 'Reporter le ménage au lundi si départ un dimanche (sauf enchainement)', true, 30, '{"postpone_to": "monday", "unless_same_day_checkin": true, "morning_if_checkin": true}'),

-- RÈGLE 5: Gestion des samedis
('saturday_conditional', 'Samedi: reporter si pas de réservation week-end', 'Reporter au lundi si pas de réservation samedi/dimanche, sinon ménage le samedi', true, 35, '{"check_weekend_bookings": true, "postpone_to": "monday", "keep_if_weekend_booking": true}'),

-- RÈGLE 6: Gestion mercredi/jeudi
('midweek_conditional', 'Mercredi/Jeudi: reporter au vendredi si possible', 'Reporter au vendredi si pas de réservation avant, sinon jour même', true, 40, '{"days": ["wednesday", "thursday"], "postpone_to": "friday", "unless_booking_before": true}'),

-- RÈGLE 7: Enchainement le jour même
('same_day_checkin', 'Enchainement: ménage le jour même', 'Si une nouvelle réservation commence le jour du départ, faire le ménage entre les deux', true, 1, '{"time": "between_checkout_checkin", "default_time": "12h00"}'),

-- RÈGLE 8: Ménage du matin si arrivée le jour même
('morning_if_same_day', 'Matin si arrivée le même jour', 'Programmer le ménage le matin (7h) si une nouvelle réservation arrive le jour du ménage', true, 15, '{"time": "morning", "hour": "07h00"}'),

-- RÈGLE 9: Éviter les week-ends (optionnel)
('avoid_weekends', 'Éviter les week-ends (optionnel)', 'Reporter le ménage en semaine si départ un week-end et pas d''enchainement', false, 50, '{"postpone_weekend": true, "unless_same_day_checkin": true}')

ON CONFLICT (rule_code) DO NOTHING;

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_cleaning_rules_enabled ON cleaning_rules(is_enabled);
CREATE INDEX IF NOT EXISTS idx_cleaning_rules_priority ON cleaning_rules(priority);

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_cleaning_rules_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_cleaning_rules_timestamp ON cleaning_rules;

CREATE TRIGGER trigger_update_cleaning_rules_timestamp
    BEFORE UPDATE ON cleaning_rules
    FOR EACH ROW
    EXECUTE FUNCTION update_cleaning_rules_timestamp();

-- Commentaires
COMMENT ON TABLE cleaning_rules IS 'Règles configurables pour la planification automatique des ménages';
COMMENT ON COLUMN cleaning_rules.rule_code IS 'Code unique identifiant la règle';
COMMENT ON COLUMN cleaning_rules.is_enabled IS 'Si false, la règle n''est pas appliquée';
COMMENT ON COLUMN cleaning_rules.priority IS 'Plus le nombre est petit, plus la règle est prioritaire';
COMMENT ON COLUMN cleaning_rules.config IS 'Configuration JSON spécifique à chaque règle';

-- Vérification post-migration
DO $$
DECLARE
    rule_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO rule_count FROM cleaning_rules;
    
    IF rule_count > 0 THEN
        RAISE NOTICE '✓ Migration réussie: % règles créées', rule_count;
    ELSE
        RAISE WARNING '⚠ Aucune règle trouvée après migration';
    END IF;
END
$$;
