-- ================================================================
-- ACTIVATION RLS - Phase 1 Sécurité
-- Activer Row Level Security sur TOUTES les tables
-- ================================================================
-- Date: 5 janvier 2026
-- À exécuter via Supabase SQL Editor APRÈS avoir lu le diagnostic
-- ATTENTION: Après exécution, les tables seront inaccessibles sans politiques
-- ================================================================

-- IMPORTANT: Créer d'abord les politiques temporaires (voir 02_policies_temp.sql)
-- avant d'exécuter ce script, sinon l'application cessera de fonctionner !

-- ================================================================
-- ÉTAPE 1: ACTIVER RLS SUR LES TABLES PRINCIPALES
-- ================================================================

-- Tables de réservations et planning
ALTER TABLE IF EXISTS reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS cleaning_schedules ENABLE ROW LEVEL SECURITY;

-- Tables financières
ALTER TABLE IF EXISTS charges ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS fiscalite ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS soldes_bancaires ENABLE ROW LEVEL SECURITY;

-- Tables ménage et linge
ALTER TABLE IF EXISTS retours_menage ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS stocks_draps ENABLE ROW LEVEL SECURITY;

-- Tables clients
ALTER TABLE IF EXISTS fiches_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS transactions_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS communications_clients ENABLE ROW LEVEL SECURITY;

-- Tables gestion
ALTER TABLE IF EXISTS todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS infos_gites ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS activites ENABLE ROW LEVEL SECURITY;

-- Tables support
ALTER TABLE IF EXISTS faq ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS commits_log ENABLE ROW LEVEL SECURITY;

-- ================================================================
-- ÉTAPE 2: VÉRIFICATION POST-ACTIVATION
-- ================================================================

-- Vérifier que RLS est bien activé
SELECT 
    tablename,
    CASE 
        WHEN rowsecurity = true THEN '✅ RLS ACTIVÉ'
        ELSE '❌ ÉCHEC'
    END AS statut
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- Compter les tables sécurisées
SELECT 
    COUNT(*) AS total_tables,
    SUM(CASE WHEN rowsecurity = true THEN 1 ELSE 0 END) AS tables_securisees,
    CASE 
        WHEN SUM(CASE WHEN rowsecurity = false THEN 1 ELSE 0 END) = 0 
        THEN '✅ TOUTES LES TABLES SONT PROTÉGÉES'
        ELSE '⚠️ IL RESTE DES TABLES NON PROTÉGÉES'
    END AS resultat
FROM pg_tables 
WHERE schemaname = 'public';

-- ================================================================
-- ROLLBACK SI PROBLÈME
-- ================================================================

-- Si l'application ne fonctionne plus, désactiver temporairement RLS:
-- (À UTILISER UNIQUEMENT EN CAS D'URGENCE)

/*
ALTER TABLE reservations DISABLE ROW LEVEL SECURITY;
ALTER TABLE charges DISABLE ROW LEVEL SECURITY;
ALTER TABLE retours_menage DISABLE ROW LEVEL SECURITY;
-- etc... pour chaque table
*/

-- ================================================================
-- NOTES:
-- - Ne pas exécuter avant d'avoir créé les politiques temporaires
-- - Tester d'abord sur une table non critique
-- - Avoir un backup de la branche production/v5-stable
-- ================================================================
