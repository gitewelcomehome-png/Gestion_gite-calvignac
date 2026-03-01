-- ================================================================
-- SYSTÈME DE DÉDUPLICATION DES ERREURS + TRACKING MULTI-USERS
-- ================================================================
-- Date: 06/02/2026
-- Objectif: 
--   1. Éviter les doublons d'erreurs (même erreur = 1 seule ligne)
--   2. Tracker tous les clients affectés par une erreur
--   3. Supprimer les erreurs quand résolues (pas juste flagged)
-- ================================================================

-- 0. Créer colonnes de base si elles n'existent pas
ALTER TABLE cm_error_logs 
ADD COLUMN IF NOT EXISTS user_id UUID;

ALTER TABLE cm_error_logs 
ADD COLUMN IF NOT EXISTS user_email TEXT;

ALTER TABLE cm_error_logs 
ADD COLUMN IF NOT EXISTS resolved BOOLEAN DEFAULT false;

-- 1. Ajouter colonne pour fingerprint (hash unique de l'erreur)
ALTER TABLE cm_error_logs 
ADD COLUMN IF NOT EXISTS error_fingerprint TEXT;

-- 2. Ajouter colonne pour liste des utilisateurs affectés
ALTER TABLE cm_error_logs 
ADD COLUMN IF NOT EXISTS affected_users JSONB DEFAULT '[]'::jsonb;

-- 3. Ajouter colonne occurrence_count
ALTER TABLE cm_error_logs 
ADD COLUMN IF NOT EXISTS occurrence_count INTEGER DEFAULT 1;

-- 4. Ajouter colonne last_occurrence
ALTER TABLE cm_error_logs 
ADD COLUMN IF NOT EXISTS last_occurrence TIMESTAMPTZ DEFAULT NOW();

-- 5. Index pour recherche rapide par fingerprint
CREATE INDEX IF NOT EXISTS idx_error_logs_fingerprint ON cm_error_logs(error_fingerprint);

-- 6. Index GIN pour recherche dans affected_users
CREATE INDEX IF NOT EXISTS idx_error_logs_affected_users ON cm_error_logs USING GIN (affected_users);

-- 7. Fonction pour générer le fingerprint (hash MD5 du message + source + type)
CREATE OR REPLACE FUNCTION generate_error_fingerprint(
    p_error_type TEXT,
    p_source TEXT,
    p_message TEXT
) RETURNS TEXT AS $$
BEGIN
    RETURN md5(p_error_type || '|' || COALESCE(p_source, '') || '|' || p_message);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 8. Fonction pour insérer ou mettre à jour une erreur (déduplication)
CREATE OR REPLACE FUNCTION upsert_error_log(
    p_error_type TEXT,
    p_source TEXT,
    p_message TEXT,
    p_stack_trace TEXT,
    p_user_id UUID,
    p_user_email TEXT,
    p_user_agent TEXT,
    p_url TEXT,
    p_metadata JSONB
) RETURNS UUID AS $$
DECLARE
    v_fingerprint TEXT;
    v_error_id UUID;
    v_user_exists BOOLEAN;
BEGIN
    -- Générer le fingerprint
    v_fingerprint := generate_error_fingerprint(p_error_type, p_source, p_message);
    
    -- Chercher si erreur existe déjà
    SELECT id INTO v_error_id
    FROM cm_error_logs
    WHERE error_fingerprint = v_fingerprint
    AND resolved = false
    LIMIT 1;
    
    IF v_error_id IS NOT NULL THEN
        -- Erreur existe : vérifier si user déjà dans la liste
        SELECT EXISTS(
            SELECT 1 FROM jsonb_array_elements(affected_users) AS usr
            WHERE usr->>'user_id' = p_user_id::text
        ) INTO v_user_exists
        FROM cm_error_logs
        WHERE id = v_error_id;
        
        -- Mettre à jour l'erreur existante
        UPDATE cm_error_logs
        SET 
            occurrence_count = occurrence_count + 1,
            last_occurrence = NOW(),
            affected_users = CASE 
                WHEN p_user_id IS NOT NULL AND NOT v_user_exists THEN
                    affected_users || jsonb_build_object(
                        'user_id', p_user_id,
                        'user_email', p_user_email,
                        'first_seen', NOW()
                    )
                ELSE affected_users
            END
        WHERE id = v_error_id;
        
        RETURN v_error_id;
    ELSE
        -- Erreur n'existe pas : créer nouvelle ligne
        INSERT INTO cm_error_logs (
            error_type,
            source,
            message,
            stack_trace,
            user_id,
            user_email,
            user_agent,
            url,
            metadata,
            error_fingerprint,
            affected_users,
            occurrence_count,
            last_occurrence
        ) VALUES (
            p_error_type,
            p_source,
            p_message,
            p_stack_trace,
            p_user_id,
            p_user_email,
            p_user_agent,
            p_url,
            p_metadata,
            v_fingerprint,
            CASE 
                WHEN p_user_id IS NOT NULL THEN
                    jsonb_build_array(jsonb_build_object(
                        'user_id', p_user_id,
                        'user_email', p_user_email,
                        'first_seen', NOW()
                    ))
                ELSE '[]'::jsonb
            END,
            1,
            NOW()
        )
        RETURNING id INTO v_error_id;
        
        RETURN v_error_id;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 9. Vue des erreurs avec nombre de clients affectés
CREATE OR REPLACE VIEW v_cm_errors_with_users AS
SELECT 
    id,
    timestamp,
    error_type,
    source,
    message,
    error_fingerprint,
    occurrence_count,
    last_occurrence,
    jsonb_array_length(affected_users) as affected_users_count,
    affected_users,
    resolved
FROM cm_error_logs
ORDER BY last_occurrence DESC;

-- 10. Fonction pour récupérer les erreurs d'un client (pour tickets)
CREATE OR REPLACE FUNCTION get_user_errors(
    p_user_id UUID,
    p_days_back INTEGER DEFAULT 7
) RETURNS TABLE (
    error_id UUID,
    error_type TEXT,
    message TEXT,
    source TEXT,
    occurrence_count INTEGER,
    last_occurrence TIMESTAMPTZ,
    affected_users_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.id,
        e.error_type,
        e.message,
        e.source,
        e.occurrence_count,
        e.last_occurrence,
        jsonb_array_length(e.affected_users) as affected_users_count
    FROM cm_error_logs e
    WHERE e.resolved = false
    AND e.last_occurrence >= NOW() - (p_days_back || ' days')::INTERVAL
    AND (
        e.user_id = p_user_id
        OR e.affected_users @> jsonb_build_array(jsonb_build_object('user_id', p_user_id))
    )
    ORDER BY e.last_occurrence DESC;
END;
$$ LANGUAGE plpgsql;

-- 11. Fonction pour formater les erreurs pour tickets (texte)
CREATE OR REPLACE FUNCTION format_user_errors_for_ticket(
    p_user_id UUID,
    p_days_back INTEGER DEFAULT 7
) RETURNS TEXT AS $$
DECLARE
    v_output TEXT := '';
    v_error RECORD;
    v_count INTEGER := 0;
BEGIN
    FOR v_error IN 
        SELECT * FROM get_user_errors(p_user_id, p_days_back)
    LOOP
        v_count := v_count + 1;
        v_output := v_output || E'\n' || v_count || '. [' || UPPER(v_error.error_type) || '] ';
        v_output := v_output || v_error.message || E'\n';
        v_output := v_output || '   📁 Source: ' || v_error.source || E'\n';
        v_output := v_output || '   🔄 Occurrences: ' || v_error.occurrence_count || E'\n';
        v_output := v_output || '   👥 Clients affectés: ' || v_error.affected_users_count || E'\n';
        v_output := v_output || '   🕐 Dernière occurrence: ' || TO_CHAR(v_error.last_occurrence, 'DD/MM/YYYY HH24:MI') || E'\n';
    END LOOP;
    
    IF v_count = 0 THEN
        RETURN '✅ Aucune erreur active détectée pour ce client.';
    ELSE
        RETURN '⚠️ ' || v_count || ' erreur(s) active(s) détectée(s):' || E'\n' || v_output;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 12. Commentaires
COMMENT ON COLUMN cm_error_logs.error_fingerprint IS 'Hash MD5 unique pour déduplication (type|source|message)';
COMMENT ON COLUMN cm_error_logs.affected_users IS 'Liste JSON des clients affectés par cette erreur';
COMMENT ON COLUMN cm_error_logs.occurrence_count IS 'Nombre de fois où cette erreur s''est produite';
COMMENT ON COLUMN cm_error_logs.last_occurrence IS 'Date de la dernière occurrence de l''erreur';
COMMENT ON FUNCTION upsert_error_log IS 'Insère ou met à jour une erreur (déduplication automatique)';
COMMENT ON FUNCTION get_user_errors IS 'Récupère toutes les erreurs actives d''un client';
COMMENT ON FUNCTION format_user_errors_for_ticket IS 'Formate les erreurs d''un client pour insertion dans ticket support';

-- ✅ Migration terminée
