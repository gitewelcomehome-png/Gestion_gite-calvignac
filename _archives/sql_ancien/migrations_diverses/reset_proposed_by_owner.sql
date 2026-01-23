-- ================================================================
-- RESET proposed_by = 'owner' vers NULL
-- Les lignes avec proposed_by='owner' ne montrent pas les boutons
-- ================================================================

-- Réinitialiser toutes les lignes 'owner' vers NULL
UPDATE cleaning_schedule
SET proposed_by = NULL
WHERE proposed_by = 'owner'
  AND status != 'validated'; -- Ne pas toucher aux validés

-- Vérifier le résultat
SELECT 
    COUNT(*) FILTER (WHERE proposed_by IS NULL) as "NULL (normal)",
    COUNT(*) FILTER (WHERE proposed_by = 'owner') as "owner (problème)",
    COUNT(*) FILTER (WHERE proposed_by = 'company') as "company (propositions)",
    COUNT(*) as total
FROM cleaning_schedule;
