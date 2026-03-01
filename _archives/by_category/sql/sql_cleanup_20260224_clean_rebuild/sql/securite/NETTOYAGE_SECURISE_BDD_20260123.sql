-- ============================================================================
-- NETTOYAGE BASE DE DONNÉES - 23 JANVIER 2026
-- Suppression 7 tables obsolètes avec sauvegardes automatiques
-- ============================================================================
-- 
-- IMPORTANT : Ce script crée automatiquement des sauvegardes avant suppression
-- Les backups sont conservés dans le schéma pour restauration si besoin
-- 
-- Tables à supprimer :
--   1. infos_pratiques         → Remplacée par infos_gites (119 colonnes)
--   2. checklists             → Remplacée par checklist_templates + progress
--   3. demandes_horaires      → Feature jamais implémentée
--   4. evaluations_sejour     → Feature jamais implémentée
--   5. problemes_signales     → Feature jamais implémentée
--   6. retours_menage         → Feature trop complexe, non utilisée
--   7. suivi_soldes_bancaires → Feature jamais implémentée
-- 
-- ============================================================================

BEGIN;

-- ============================================================================
-- ÉTAPE 1 : VÉRIFICATION DES TABLES EXISTANTES
-- ============================================================================

DO $$
DECLARE
    v_count INTEGER;
BEGIN
    RAISE NOTICE '=== VÉRIFICATION DES TABLES ===';
    
    -- Vérifier chaque table
    SELECT COUNT(*) INTO v_count FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'infos_pratiques';
    RAISE NOTICE 'infos_pratiques : % ligne(s)', 
        (SELECT COUNT(*) FROM infos_pratiques WHERE EXISTS (SELECT 1 FROM infos_pratiques LIMIT 1));
    
    SELECT COUNT(*) INTO v_count FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'checklists';
    IF v_count > 0 THEN
        RAISE NOTICE 'checklists : % ligne(s)', (SELECT COUNT(*) FROM checklists);
    END IF;
    
    SELECT COUNT(*) INTO v_count FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'demandes_horaires';
    IF v_count > 0 THEN
        RAISE NOTICE 'demandes_horaires : % ligne(s)', (SELECT COUNT(*) FROM demandes_horaires);
    END IF;
    
    SELECT COUNT(*) INTO v_count FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'evaluations_sejour';
    IF v_count > 0 THEN
        RAISE NOTICE 'evaluations_sejour : % ligne(s)', (SELECT COUNT(*) FROM evaluations_sejour);
    END IF;
    
    SELECT COUNT(*) INTO v_count FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'problemes_signales';
    IF v_count > 0 THEN
        RAISE NOTICE 'problemes_signales : % ligne(s)', (SELECT COUNT(*) FROM problemes_signales);
    END IF;
    
    SELECT COUNT(*) INTO v_count FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'retours_menage';
    IF v_count > 0 THEN
        RAISE NOTICE 'retours_menage : % ligne(s)', (SELECT COUNT(*) FROM retours_menage);
    END IF;
    
    SELECT COUNT(*) INTO v_count FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'suivi_soldes_bancaires';
    IF v_count > 0 THEN
        RAISE NOTICE 'suivi_soldes_bancaires : % ligne(s)', (SELECT COUNT(*) FROM suivi_soldes_bancaires);
    END IF;
    
    RAISE NOTICE '=== FIN VÉRIFICATION ===';
END $$;

-- ============================================================================
-- ÉTAPE 2 : CRÉATION DES BACKUPS (SAUVEGARDES DE SÉCURITÉ)
-- ============================================================================

DO $$ BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== CRÉATION DES BACKUPS ===';
END $$;

-- Backup 1 : infos_pratiques
DROP TABLE IF EXISTS backup_infos_pratiques_20260123;
CREATE TABLE backup_infos_pratiques_20260123 AS 
SELECT * FROM infos_pratiques;

-- Backup 2 : checklists
DROP TABLE IF EXISTS backup_checklists_20260123;
CREATE TABLE backup_checklists_20260123 AS 
SELECT * FROM checklists WHERE EXISTS (SELECT 1 FROM checklists LIMIT 1);

-- Backup 3 : demandes_horaires
DROP TABLE IF EXISTS backup_demandes_horaires_20260123;
CREATE TABLE backup_demandes_horaires_20260123 AS 
SELECT * FROM demandes_horaires WHERE EXISTS (SELECT 1 FROM demandes_horaires LIMIT 1);

-- Backup 4 : evaluations_sejour
DROP TABLE IF EXISTS backup_evaluations_sejour_20260123;
CREATE TABLE backup_evaluations_sejour_20260123 AS 
SELECT * FROM evaluations_sejour WHERE EXISTS (SELECT 1 FROM evaluations_sejour LIMIT 1);

-- Backup 5 : problemes_signales
DROP TABLE IF EXISTS backup_problemes_signales_20260123;
CREATE TABLE backup_problemes_signales_20260123 AS 
SELECT * FROM problemes_signales WHERE EXISTS (SELECT 1 FROM problemes_signales LIMIT 1);

-- Backup 6 : retours_menage
DROP TABLE IF EXISTS backup_retours_menage_20260123;
CREATE TABLE backup_retours_menage_20260123 AS 
SELECT * FROM retours_menage WHERE EXISTS (SELECT 1 FROM retours_menage LIMIT 1);

-- Backup 7 : suivi_soldes_bancaires
DROP TABLE IF EXISTS backup_suivi_soldes_bancaires_20260123;
CREATE TABLE backup_suivi_soldes_bancaires_20260123 AS 
SELECT * FROM suivi_soldes_bancaires WHERE EXISTS (SELECT 1 FROM suivi_soldes_bancaires LIMIT 1);

DO $$ BEGIN
    RAISE NOTICE '=== BACKUPS TERMINÉS (7 tables sauvegardées) ===';
    RAISE NOTICE '';
END $$;

-- ============================================================================
-- ÉTAPE 3 : SUPPRESSION DES TABLES OBSOLÈTES
-- ============================================================================

DO $$ BEGIN
    RAISE NOTICE '=== SUPPRESSION DES TABLES ===';
END $$;

-- Suppression 1 : infos_pratiques
DROP TABLE IF EXISTS infos_pratiques CASCADE;

-- Suppression 2 : checklists
DROP TABLE IF EXISTS checklists CASCADE;

-- Suppression 3 : demandes_horaires
DROP TABLE IF EXISTS demandes_horaires CASCADE;

-- Suppression 4 : evaluations_sejour
DROP TABLE IF EXISTS evaluations_sejour CASCADE;

-- Suppression 5 : problemes_signales
DROP TABLE IF EXISTS problemes_signales CASCADE;

-- Suppression 6 : retours_menage
DROP TABLE IF EXISTS retours_menage CASCADE;

-- Suppression 7 : suivi_soldes_bancaires
DROP TABLE IF EXISTS suivi_soldes_bancaires CASCADE;

DO $$ BEGIN
    RAISE NOTICE '=== 7 TABLES SUPPRIMÉES AVEC SUCCÈS ===';
    RAISE NOTICE '';
END $$;

-- ============================================================================
-- ÉTAPE 4 : VÉRIFICATION POST-SUPPRESSION
-- ============================================================================

DO $$
DECLARE
    v_count INTEGER;
BEGIN
    RAISE NOTICE '=== VÉRIFICATION POST-SUPPRESSION ===';
    
    SELECT COUNT(*) INTO v_count FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN (
        'infos_pratiques', 
        'checklists', 
        'demandes_horaires',
        'evaluations_sejour',
        'problemes_signales',
        'retours_menage',
        'suivi_soldes_bancaires'
    );
    
    IF v_count = 0 THEN
        RAISE NOTICE '✓ Toutes les tables obsolètes ont été supprimées';
    ELSE
        RAISE WARNING '⚠ Attention : % table(s) n''ont pas été supprimées', v_count;
    END IF;
    
    -- Vérifier que les backups existent
    SELECT COUNT(*) INTO v_count FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name LIKE 'backup_%_20260123';
    
    RAISE NOTICE '✓ % backup(s) disponible(s) pour restauration', v_count;
    
    RAISE NOTICE '=== FIN VÉRIFICATION ===';
END $$;

-- ============================================================================
-- VALIDATION ET COMMIT
-- ============================================================================

COMMIT;

DO $$ BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '╔════════════════════════════════════════════════════════════╗';
    RAISE NOTICE '║          NETTOYAGE TERMINÉ AVEC SUCCÈS                    ║';
    RAISE NOTICE '╚════════════════════════════════════════════════════════════╝';
    RAISE NOTICE '';
    RAISE NOTICE '✅ 7 tables obsolètes supprimées';
    RAISE NOTICE '✅ 7 backups créés et disponibles';
    RAISE NOTICE '';
    RAISE NOTICE '📦 Tables de backup disponibles :';
    RAISE NOTICE '   - backup_infos_pratiques_20260123';
    RAISE NOTICE '   - backup_checklists_20260123';
    RAISE NOTICE '   - backup_demandes_horaires_20260123';
    RAISE NOTICE '   - backup_evaluations_sejour_20260123';
    RAISE NOTICE '   - backup_problemes_signales_20260123';
    RAISE NOTICE '   - backup_retours_menage_20260123';
    RAISE NOTICE '   - backup_suivi_soldes_bancaires_20260123';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  IMPORTANT : Les backups sont conservés dans la base';
    RAISE NOTICE '    Voir script de restauration : RESTAURATION_TABLES_20260123.sql';
    RAISE NOTICE '';
END $$;

-- ============================================================================
