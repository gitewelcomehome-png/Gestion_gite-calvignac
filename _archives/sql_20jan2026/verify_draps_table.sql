-- ================================================================
-- SCRIPT DE VÉRIFICATION - Mapping Draps
-- ================================================================
-- Date: 14 janvier 2026
-- Objectif: Vérifier que la table linen_stocks existe et est bien configurée

-- 1. Vérifier l'existence de la table linen_stocks
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'linen_stocks'
        ) THEN '✅ Table linen_stocks existe'
        ELSE '❌ Table linen_stocks MANQUANTE'
    END AS status_table;

-- 2. Vérifier les colonnes de la table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'linen_stocks'
ORDER BY ordinal_position;

-- 3. Vérifier les contraintes
SELECT
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
WHERE tc.table_schema = 'public'
    AND tc.table_name = 'linen_stocks'
ORDER BY tc.constraint_type, tc.constraint_name;

-- 4. Vérifier les index
SELECT
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
    AND tablename = 'linen_stocks'
ORDER BY indexname;

-- 5. Vérifier les politiques RLS
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE schemaname = 'public'
    AND tablename = 'linen_stocks';

-- 6. Compter les enregistrements existants
SELECT 
    COUNT(*) as nb_stocks,
    COUNT(DISTINCT gite_id) as nb_gites_avec_stocks
FROM linen_stocks;

-- 7. Vérifier qu'il n'y a pas d'ancienne table stocks_draps
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'stocks_draps'
        ) THEN '⚠️ Ancienne table stocks_draps existe encore'
        ELSE '✅ Ancienne table stocks_draps supprimée'
    END AS status_ancienne_table;

-- ================================================================
-- FIN DES VÉRIFICATIONS
-- ================================================================
