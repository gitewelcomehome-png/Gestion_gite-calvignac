-- ============================================================================
-- RESTAURATION TABLES - 23 JANVIER 2026
-- Script de restauration en cas de problème après nettoyage
-- ============================================================================
-- 
-- Ce script permet de restaurer les tables supprimées à partir des backups
-- créés automatiquement par NETTOYAGE_SECURISE_BDD_20260123.sql
-- 
-- ⚠️  N'UTILISER QU'EN CAS DE PROBLÈME !
-- 
-- Tables disponibles pour restauration :
--   1. infos_pratiques
--   2. checklists
--   3. demandes_horaires
--   4. evaluations_sejour
--   5. problemes_signales
--   6. retours_menage
--   7. suivi_soldes_bancaires
-- 
-- ============================================================================

-- ============================================================================
-- OPTION 1 : RESTAURER UNE SEULE TABLE
-- ============================================================================
-- Décommentez la section correspondant à la table à restaurer

/*
-- Restaurer infos_pratiques
CREATE TABLE infos_pratiques AS 
SELECT * FROM backup_infos_pratiques_20260123;
*/

/*
-- Restaurer checklists
CREATE TABLE checklists AS 
SELECT * FROM backup_checklists_20260123;
*/

/*
-- Restaurer demandes_horaires
CREATE TABLE demandes_horaires AS 
SELECT * FROM backup_demandes_horaires_20260123;
*/

/*
-- Restaurer evaluations_sejour
CREATE TABLE evaluations_sejour AS 
SELECT * FROM backup_evaluations_sejour_20260123;
*/

/*
-- Restaurer problemes_signales
CREATE TABLE problemes_signales AS 
SELECT * FROM backup_problemes_signales_20260123;
*/

/*
-- Restaurer retours_menage
CREATE TABLE retours_menage AS 
SELECT * FROM backup_retours_menage_20260123;
*/

/*
-- Restaurer suivi_soldes_bancaires
CREATE TABLE suivi_soldes_bancaires AS 
SELECT * FROM backup_suivi_soldes_bancaires_20260123;
*/

-- ============================================================================
-- OPTION 2 : RESTAURER TOUTES LES TABLES (ROLLBACK COMPLET)
-- ============================================================================
-- ⚠️  ATTENTION : Ceci restaure TOUTES les tables obsolètes
-- N'utiliser que si le nettoyage a causé des problèmes majeurs

/*
BEGIN;

-- Restaurer toutes les tables
CREATE TABLE infos_pratiques AS 
SELECT * FROM backup_infos_pratiques_20260123;

CREATE TABLE checklists AS 
SELECT * FROM backup_checklists_20260123;

CREATE TABLE demandes_horaires AS 
SELECT * FROM backup_demandes_horaires_20260123;

CREATE TABLE evaluations_sejour AS 
SELECT * FROM backup_evaluations_sejour_20260123;

CREATE TABLE problemes_signales AS 
SELECT * FROM backup_problemes_signales_20260123;

CREATE TABLE retours_menage AS 
SELECT * FROM backup_retours_menage_20260123;

CREATE TABLE suivi_soldes_bancaires AS 
SELECT * FROM backup_suivi_soldes_bancaires_20260123;

COMMIT;

RAISE NOTICE '✓ Toutes les tables ont été restaurées';
*/

-- ============================================================================
-- OPTION 3 : SUPPRIMER LES BACKUPS (APRÈS VALIDATION)
-- ============================================================================
-- Une fois que vous êtes sûr que le nettoyage n'a causé aucun problème
-- et que tout fonctionne correctement (attendre quelques jours)
-- Vous pouvez supprimer les backups pour libérer de l'espace

/*
BEGIN;

DROP TABLE IF EXISTS backup_infos_pratiques_20260123;
DROP TABLE IF EXISTS backup_checklists_20260123;
DROP TABLE IF EXISTS backup_demandes_horaires_20260123;
DROP TABLE IF EXISTS backup_evaluations_sejour_20260123;
DROP TABLE IF EXISTS backup_problemes_signales_20260123;
DROP TABLE IF EXISTS backup_retours_menage_20260123;
DROP TABLE IF EXISTS backup_suivi_soldes_bancaires_20260123;

COMMIT;

RAISE NOTICE '✓ Tous les backups ont été supprimés';
RAISE NOTICE '⚠️  Les tables ne peuvent plus être restaurées';
*/

-- ============================================================================
-- VÉRIFICATION DES BACKUPS DISPONIBLES
-- ============================================================================

SELECT 
    table_name,
    pg_size_pretty(pg_total_relation_size(quote_ident(table_name))) as taille
FROM information_schema.tables
WHERE table_schema = 'public' 
AND table_name LIKE 'backup_%_20260123'
ORDER BY table_name;

-- ============================================================================
-- FIN DU SCRIPT
-- ============================================================================
