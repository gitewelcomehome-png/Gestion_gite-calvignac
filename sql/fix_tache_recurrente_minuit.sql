-- Corriger les tâches récurrentes existantes pour qu'elles soient visibles dès minuit
-- au lieu de l'heure de création

UPDATE todos 
SET next_occurrence = DATE_TRUNC('day', next_occurrence)
WHERE is_recurrent = true 
  AND next_occurrence IS NOT NULL;

-- Vérifier le résultat
SELECT 
    id,
    title,
    category,
    is_recurrent,
    TO_CHAR(next_occurrence, 'DD/MM/YYYY HH24:MI') as prochaine_occurrence,
    CASE 
        WHEN next_occurrence <= CURRENT_TIMESTAMP THEN '✅ VISIBLE MAINTENANT'
        ELSE '⏳ Visible le ' || TO_CHAR(next_occurrence, 'DD/MM/YYYY à HH24:MI')
    END as statut
FROM todos
WHERE is_recurrent = true
ORDER BY next_occurrence;
