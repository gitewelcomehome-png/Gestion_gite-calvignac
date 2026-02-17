-- ================================================================
-- AJOUT user_id (UUID) dans cm_error_logs pour filtrage par client
-- ================================================================
-- Date: 06/02/2026
-- Objectif: Permettre le filtrage des erreurs par client UUID
-- ================================================================

-- Ajouter colonne user_id si elle n'existe pas
ALTER TABLE cm_error_logs 
ADD COLUMN IF NOT EXISTS user_id UUID;

-- Créer index pour recherche rapide par user_id
CREATE INDEX IF NOT EXISTS idx_error_logs_user_id ON cm_error_logs(user_id);

-- Commentaire
COMMENT ON COLUMN cm_error_logs.user_id IS 'UUID du client (depuis window.currentUser.id)';

-- Vue des erreurs par utilisateur
CREATE OR REPLACE VIEW v_cm_errors_by_user AS
SELECT 
    user_id,
    user_email,
    error_type,
    COUNT(*) as error_count,
    MAX(timestamp) as last_error,
    MIN(timestamp) as first_error
FROM cm_error_logs
WHERE user_id IS NOT NULL
GROUP BY user_id, user_email, error_type
ORDER BY error_count DESC;

COMMENT ON VIEW v_cm_errors_by_user IS 'Statistiques erreurs par utilisateur pour filtrage tickets support';
