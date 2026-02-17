-- ================================================================
-- Migration : Ajout colonnes de validation automatique
-- Table : cm_error_logs
-- ================================================================

-- Ajouter colonne validation_status
ALTER TABLE cm_error_logs 
ADD COLUMN IF NOT EXISTS validation_status TEXT DEFAULT NULL;

-- Ajouter colonne monitoring_start
ALTER TABLE cm_error_logs 
ADD COLUMN IF NOT EXISTS monitoring_start TIMESTAMPTZ DEFAULT NULL;

-- Ajouter colonne resolution_method
ALTER TABLE cm_error_logs 
ADD COLUMN IF NOT EXISTS resolution_method TEXT DEFAULT NULL;

-- Créer index pour les requêtes de monitoring
CREATE INDEX IF NOT EXISTS idx_error_logs_validation 
ON cm_error_logs(validation_status, resolved);

CREATE INDEX IF NOT EXISTS idx_error_logs_monitoring 
ON cm_error_logs(monitoring_start) 
WHERE validation_status = 'monitoring';

-- Commentaires
COMMENT ON COLUMN cm_error_logs.validation_status IS 'Statut de validation : test_passed, monitoring, auto_resolved, test_failed, validation_failed';
COMMENT ON COLUMN cm_error_logs.monitoring_start IS 'Date de début du monitoring progressif (24h)';
COMMENT ON COLUMN cm_error_logs.resolution_method IS 'Méthode de résolution : manual, auto_validation, batch_fix';
