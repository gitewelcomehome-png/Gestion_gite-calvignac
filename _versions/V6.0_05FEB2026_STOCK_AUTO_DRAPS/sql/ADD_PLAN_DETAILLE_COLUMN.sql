-- ================================================================
-- AJOUT: Colonne plan_detaille pour stocker les plans d'action IA
-- ================================================================

ALTER TABLE cm_ai_content_queue
ADD COLUMN IF NOT EXISTS plan_detaille JSONB;

COMMENT ON COLUMN cm_ai_content_queue.plan_detaille IS 'Plan d''action détaillé généré par IA: {etapes: [...], metriques_succes: "..."}';

-- Index pour recherche des actions avec plan
CREATE INDEX IF NOT EXISTS idx_queue_with_plan ON cm_ai_content_queue(id) WHERE plan_detaille IS NOT NULL;
