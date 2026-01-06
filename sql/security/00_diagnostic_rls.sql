-- ================================================================
-- DIAGNOSTIC RLS - Phase 1 Sécurité
-- Vérifier l'état actuel de Row Level Security sur toutes les tables
-- ================================================================
-- Date: 5 janvier 2026
-- À exécuter via Supabase SQL Editor
-- ================================================================

-- 1. LISTER TOUTES LES TABLES AVEC STATUT RLS
SELECT 
    schemaname,
    tablename,
    rowsecurity AS rls_enabled,
    CASE 
        WHEN rowsecurity = true THEN '✅ Activé'
        ELSE '❌ DÉSACTIVÉ'
    END AS statut
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- 2. COMPTER LES TABLES SANS RLS
SELECT 
    COUNT(*) AS total_tables,
    SUM(CASE WHEN rowsecurity = false THEN 1 ELSE 0 END) AS tables_sans_rls,
    SUM(CASE WHEN rowsecurity = true THEN 1 ELSE 0 END) AS tables_avec_rls
FROM pg_tables 
WHERE schemaname = 'public';

-- 3. LISTER LES POLITIQUES RLS EXISTANTES
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
ORDER BY tablename, policyname;

-- 4. TABLES CRITIQUES SANS PROTECTION (À CORRIGER EN PRIORITÉ)
SELECT 
    tablename,
    '⚠️ CRITIQUE - Données sensibles non protégées' AS alerte
FROM pg_tables 
WHERE schemaname = 'public'
  AND rowsecurity = false
  AND tablename IN (
    'reservations',
    'charges',
    'fiches_clients',
    'transactions_clients',
    'retours_menage',
    'stocks_draps',
    'fiscalite',
    'soldes_bancaires'
  )
ORDER BY tablename;

-- ================================================================
-- RÉSULTATS ATTENDUS:
-- - Liste complète des tables et leur statut RLS
-- - Nombre de tables à sécuriser
-- - Liste des politiques existantes
-- - Tables critiques nécessitant une protection immédiate
-- ================================================================
