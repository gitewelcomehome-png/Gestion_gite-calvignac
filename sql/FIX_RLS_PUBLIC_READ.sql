-- ================================================================
-- FIX: Autoriser lecture publique des stratégies IA
-- ================================================================
-- Les stratégies ne contiennent pas de données sensibles
-- et doivent être accessibles sans authentification
-- ================================================================

-- Vérifier les données existantes
SELECT semaine, annee, statut, 
       LEFT(strategie_complete::text, 100) as apercu,
       created_at
FROM cm_ai_strategies 
WHERE annee = 2026
ORDER BY semaine;

-- Si besoin de recréer la policy :
-- DROP POLICY IF EXISTS "Public read strategies" ON cm_ai_strategies;
-- CREATE POLICY "Public read strategies" ON cm_ai_strategies
--     FOR SELECT USING (true);
