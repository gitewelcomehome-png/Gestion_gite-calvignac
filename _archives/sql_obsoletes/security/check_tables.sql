-- ================================================================
-- VÉRIFICATION DES TABLES EXISTANTES
-- ================================================================
-- Exécutez ce script AVANT rls_enable.sql pour voir quelles tables existent
-- ================================================================

SELECT 
    tablename,
    CASE 
        WHEN tablename IN (
            'reservations', 'cleaning_schedule', 'user_roles', 
            'retours_menage', 'stocks_draps', 'infos_gites',
            'activites_gites', 'client_access_tokens', 'historical_data',
            'simulations_fiscales', 'todos', 'commits_log', 'faq',
            'checklist_templates', 'checklist_progress'
        ) THEN '✅ À sécuriser avec RLS'
        ELSE 'ℹ️ Autre table'
    END as status
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- Résumé des tables critiques
SELECT 
    'Tables critiques existantes' as info,
    COUNT(*) as nombre
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename IN (
    'reservations', 'cleaning_schedule', 'user_roles', 
    'retours_menage', 'stocks_draps', 'infos_gites',
    'activites_gites', 'client_access_tokens', 'historical_data',
    'simulations_fiscales', 'todos', 'commits_log', 'faq'
);
