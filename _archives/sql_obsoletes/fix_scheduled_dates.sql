-- 🔧 Correction des dates de ménage erronées
-- Toutes les scheduled_date à 2026-01-06 doivent être supprimées
-- Le système les régénérera automatiquement avec les bonnes dates

-- Afficher d'abord les lignes concernées
SELECT 
    id, 
    reservation_id, 
    gite, 
    scheduled_date,
    time_of_day,
    status
FROM cleaning_schedule 
WHERE scheduled_date = '2026-01-06'
ORDER BY gite, scheduled_date;

-- Supprimer les lignes erronées (décommenter pour exécuter)
-- DELETE FROM cleaning_schedule WHERE scheduled_date = '2026-01-06';

-- Vérifier qu'il ne reste plus de lignes à cette date
-- SELECT COUNT(*) FROM cleaning_schedule WHERE scheduled_date = '2026-01-06';
