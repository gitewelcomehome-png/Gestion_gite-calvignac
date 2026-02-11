-- ================================================================
-- TEST : Vérification des colonnes cm_error_logs
-- ================================================================
-- Date: 06/02/2026
-- ================================================================

-- 1. Lister TOUTES les colonnes de cm_error_logs
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'cm_error_logs'
ORDER BY ordinal_position;

-- 2. Vérifier colonnes CRITIQUES (doivent exister)
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cm_error_logs' AND column_name = 'user_id')
        THEN '✅ user_id existe'
        ELSE '❌ user_id MANQUANT'
    END as check_user_id,
    
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cm_error_logs' AND column_name = 'user_email')
        THEN '✅ user_email existe'
        ELSE '❌ user_email MANQUANT'
    END as check_user_email,
    
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cm_error_logs' AND column_name = 'resolved')
        THEN '✅ resolved existe'
        ELSE '❌ resolved MANQUANT'
    END as check_resolved,
    
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cm_error_logs' AND column_name = 'error_fingerprint')
        THEN '✅ error_fingerprint existe'
        ELSE '❌ error_fingerprint MANQUANT'
    END as check_error_fingerprint,
    
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cm_error_logs' AND column_name = 'affected_users')
        THEN '✅ affected_users existe'
        ELSE '❌ affected_users MANQUANT'
    END as check_affected_users,
    
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cm_error_logs' AND column_name = 'occurrence_count')
        THEN '✅ occurrence_count existe'
        ELSE '❌ occurrence_count MANQUANT'
    END as check_occurrence_count,
    
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cm_error_logs' AND column_name = 'last_occurrence')
        THEN '✅ last_occurrence existe'
        ELSE '❌ last_occurrence MANQUANT'
    END as check_last_occurrence;

-- 3. Vérifier les INDEX
SELECT 
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'cm_error_logs'
ORDER BY indexname;

-- 4. Vérifier les FONCTIONS RPC
SELECT 
    routine_name,
    routine_type,
    data_type as return_type
FROM information_schema.routines
WHERE routine_name IN (
    'upsert_error_log',
    'get_user_errors',
    'format_user_errors_for_ticket',
    'generate_error_fingerprint'
)
ORDER BY routine_name;

-- 5. Vérifier la VUE
SELECT 
    table_name,
    table_type
FROM information_schema.tables
WHERE table_name = 'v_cm_errors_with_users';

-- ✅ Test terminé
