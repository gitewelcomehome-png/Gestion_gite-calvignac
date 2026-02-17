-- Marquer toutes les notifications comme lues
-- Ce script réinitialise le compteur de notifications

UPDATE notifications
SET is_read = true
WHERE is_read = false;

-- Afficher le résultat
SELECT 
    COUNT(*) as total_notifications,
    SUM(CASE WHEN is_read THEN 1 ELSE 0 END) as lues,
    SUM(CASE WHEN NOT is_read THEN 1 ELSE 0 END) as non_lues
FROM notifications;
