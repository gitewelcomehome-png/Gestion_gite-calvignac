-- Vérifier si la table notifications existe
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'notifications'
) as table_exists;

-- Si la table existe, vérifier les notifications en attente
-- SELECT 
--     id,
--     type,
--     title,
--     message,
--     is_read,
--     created_at,
--     CASE 
--         WHEN NOW() - created_at < INTERVAL '1 hour' THEN '🟢 < 1h'
--         WHEN NOW() - created_at < INTERVAL '1 day' THEN '🟡 < 1j'
--         WHEN NOW() - created_at < INTERVAL '7 days' THEN '🟠 < 7j'
--         ELSE '🔴 > 7j'
--     END as age
-- FROM notifications
-- WHERE is_read = false
-- ORDER BY created_at DESC;

-- -- Résumé
-- SELECT 
--     COUNT(*) as total_non_lues,
--     COUNT(CASE WHEN type = 'info' THEN 1 END) as info,
--     COUNT(CASE WHEN type = 'warning' THEN 1 END) as warning,
--     COUNT(CASE WHEN type = 'error' THEN 1 END) as error,
--     COUNT(CASE WHEN type = 'success' THEN 1 END) as success
-- FROM notifications
-- WHERE is_read = false;
