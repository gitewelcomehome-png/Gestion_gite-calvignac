-- ================================================================
-- AJOUT: Tracking performances actions marketing
-- ================================================================
-- Ajoute les champs pour tracker les métriques réelles après publication
-- ================================================================

-- Ajouter colonnes de performance à cm_ai_actions
ALTER TABLE cm_ai_actions
ADD COLUMN IF NOT EXISTS date_publication TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS plateforme_publie VARCHAR(50), -- linkedin, facebook, instagram, etc.
ADD COLUMN IF NOT EXISTS url_publication TEXT,
ADD COLUMN IF NOT EXISTS metriques JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS archive BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS notes_performance TEXT;

-- Commentaires
COMMENT ON COLUMN cm_ai_actions.date_publication IS 'Date de publication réelle du contenu';
COMMENT ON COLUMN cm_ai_actions.plateforme_publie IS 'Plateforme où le contenu a été publié';
COMMENT ON COLUMN cm_ai_actions.url_publication IS 'Lien vers la publication';
COMMENT ON COLUMN cm_ai_actions.metriques IS 'Métriques réelles: {vues: 150, likes: 23, commentaires: 5, partages: 2, clics: 12, leads: 3}';
COMMENT ON COLUMN cm_ai_actions.archive IS 'Action archivée et disponible pour réutilisation';
COMMENT ON COLUMN cm_ai_actions.notes_performance IS 'Notes sur la performance et enseignements';

-- Exemple de structure JSON pour metriques:
-- {
--   "vues": 150,
--   "likes": 23,
--   "commentaires": 5,
--   "partages": 2,
--   "clics": 12,
--   "leads": 3,
--   "taux_engagement": "15.3%",
--   "cout_acquisition": 8.50,
--   "roi": "250%"
-- }

-- Index pour recherche archives
CREATE INDEX IF NOT EXISTS idx_actions_archive ON cm_ai_actions(archive) WHERE archive = true;
CREATE INDEX IF NOT EXISTS idx_actions_date_pub ON cm_ai_actions(date_publication);

-- Vue pour meilleures performances
CREATE OR REPLACE VIEW cm_ai_top_actions AS
SELECT 
    id,
    titre,
    type,
    plateforme_publie,
    date_publication,
    metriques,
    (metriques->>'vues')::int as vues,
    (metriques->>'likes')::int as likes,
    (metriques->>'commentaires')::int as commentaires,
    (metriques->>'leads')::int as leads,
    notes_performance
FROM cm_ai_actions
WHERE archive = true 
  AND metriques IS NOT NULL
  AND metriques::text != '{}'
ORDER BY 
    (metriques->>'leads')::int DESC NULLS LAST,
    (metriques->>'vues')::int DESC NULLS LAST;

COMMENT ON VIEW cm_ai_top_actions IS 'Actions archivées triées par performance pour réutilisation';
