-- ================================================================
-- CORRECTION : Activer la semaine 1, désactiver les autres
-- ================================================================

-- Passer TOUTES les semaines en 'planifié'
UPDATE cm_ai_strategies 
SET statut = 'planifié' 
WHERE annee = 2026;

-- Activer UNIQUEMENT la semaine 1
UPDATE cm_ai_strategies 
SET statut = 'actif' 
WHERE semaine = 1 AND annee = 2026;

-- Vérification
SELECT semaine, statut, objectif 
FROM cm_ai_strategies 
WHERE annee = 2026 
ORDER BY semaine;
