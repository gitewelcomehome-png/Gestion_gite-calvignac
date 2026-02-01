-- ================================================================
-- GESTION AUTOMATIQUE DES SEMAINES PASSÉES
-- ================================================================
-- Fonction pour archiver automatiquement les semaines terminées
-- À appeler quotidiennement via cron job ou trigger
-- ================================================================

CREATE OR REPLACE FUNCTION archive_old_weeks()
RETURNS void AS $$
DECLARE
    current_week INT;
    current_year INT;
BEGIN
    -- Obtenir semaine et année actuelles
    SELECT EXTRACT(WEEK FROM CURRENT_DATE)::INT, EXTRACT(YEAR FROM CURRENT_DATE)::INT 
    INTO current_week, current_year;
    
    -- Marquer les semaines passées comme 'terminé'
    UPDATE cm_ai_strategies
    SET statut = 'termine'
    WHERE statut = 'actif'
    AND (
        annee < current_year
        OR (annee = current_year AND semaine < current_week)
    );
    
    -- Log
    RAISE NOTICE 'Semaines archivées: année < % ou semaine < %', current_year, current_week;
END;
$$ LANGUAGE plpgsql;

-- Créer un trigger pour vérifier automatiquement chaque jour
-- (Nécessite pg_cron extension - sinon appeler manuellement ou via API)
-- SELECT cron.schedule('archive-old-weeks', '0 3 * * *', 'SELECT archive_old_weeks()');

-- ================================================================
-- FONCTION: Récupérer insights des semaines passées
-- ================================================================

CREATE OR REPLACE FUNCTION get_learning_insights()
RETURNS TABLE (
    plateforme_top VARCHAR(50),
    type_top VARCHAR(50),
    avg_leads NUMERIC,
    avg_engagement NUMERIC,
    total_actions INT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT plateforme_publie 
         FROM cm_ai_actions 
         WHERE archive = true AND metriques IS NOT NULL
         GROUP BY plateforme_publie 
         ORDER BY SUM((metriques->>'leads')::int) DESC 
         LIMIT 1) as plateforme_top,
        
        (SELECT type 
         FROM cm_ai_actions 
         WHERE archive = true AND metriques IS NOT NULL
         GROUP BY type 
         ORDER BY SUM((metriques->>'leads')::int) DESC 
         LIMIT 1) as type_top,
        
        (SELECT AVG((metriques->>'leads')::int)
         FROM cm_ai_actions 
         WHERE archive = true AND metriques IS NOT NULL) as avg_leads,
        
        (SELECT AVG(
            (metriques->>'likes')::int + 
            (metriques->>'commentaires')::int +
            (metriques->>'partages')::int
         )
         FROM cm_ai_actions 
         WHERE archive = true AND metriques IS NOT NULL) as avg_engagement,
        
        (SELECT COUNT(*)::int
         FROM cm_ai_actions 
         WHERE archive = true) as total_actions;
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- INDEX POUR PERFORMANCES
-- ================================================================

CREATE INDEX IF NOT EXISTS idx_strategies_statut_annee_semaine 
ON cm_ai_strategies(statut, annee, semaine);

CREATE INDEX IF NOT EXISTS idx_actions_archive_metriques 
ON cm_ai_actions(archive) WHERE metriques IS NOT NULL;

-- ================================================================
-- EXEMPLES D'UTILISATION
-- ================================================================

-- Archiver manuellement les semaines passées
-- SELECT archive_old_weeks();

-- Obtenir les insights d'apprentissage
-- SELECT * FROM get_learning_insights();

-- Voir les semaines terminées
-- SELECT semaine, annee, statut, created_at 
-- FROM cm_ai_strategies 
-- WHERE statut = 'termine' 
-- ORDER BY annee DESC, semaine DESC;
