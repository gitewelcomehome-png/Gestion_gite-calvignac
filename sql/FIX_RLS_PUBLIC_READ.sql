-- ================================================================
-- FIX: Autoriser lecture publique des stratégies IA
-- ================================================================
-- Les stratégies ne contiennent pas de données sensibles
-- et doivent être accessibles sans authentification
-- ================================================================

-- Ajouter une politique de lecture publique
CREATE POLICY "Public read strategies" ON cm_ai_strategies
    FOR SELECT USING (true);

-- Commentaire
COMMENT ON POLICY "Public read strategies" ON cm_ai_strategies IS 'Autoriser la lecture publique des stratégies IA (pas de données sensibles)';
