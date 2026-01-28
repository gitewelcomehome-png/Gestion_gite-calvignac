-- ============================================================================
-- SÉCURISATION TABLES & NETTOYAGE BACKUPS - 23 JANVIER 2026
-- ============================================================================
-- 
-- Ce script :
-- 1. Active RLS sur les tables actives qui en ont besoin
-- 2. Supprime les backups après validation (à exécuter après 7 jours)
-- 
-- ⚠️  IMPORTANT : 
-- - Exécuter PARTIE 1 immédiatement (sécurisation)
-- - Exécuter PARTIE 2 après 7 jours (suppression backups)
-- 
-- ============================================================================

-- ============================================================================
-- PARTIE 1 : SÉCURISER LES TABLES ACTIVES (À EXÉCUTER MAINTENANT)
-- ============================================================================

BEGIN;

-- Activer RLS sur cleaning_rules si pas déjà fait
ALTER TABLE cleaning_rules ENABLE ROW LEVEL SECURITY;

-- Créer policy pour cleaning_rules
DROP POLICY IF EXISTS "Users can view their own cleaning rules" ON cleaning_rules;
CREATE POLICY "Users can view their own cleaning rules"
ON cleaning_rules FOR SELECT
USING (owner_user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert their own cleaning rules" ON cleaning_rules;
CREATE POLICY "Users can insert their own cleaning rules"
ON cleaning_rules FOR INSERT
WITH CHECK (owner_user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own cleaning rules" ON cleaning_rules;
CREATE POLICY "Users can update their own cleaning rules"
ON cleaning_rules FOR UPDATE
USING (owner_user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete their own cleaning rules" ON cleaning_rules;
CREATE POLICY "Users can delete their own cleaning rules"
ON cleaning_rules FOR DELETE
USING (owner_user_id = auth.uid());

COMMIT;

DO $$ BEGIN
    RAISE NOTICE '✅ RLS activé sur cleaning_rules';
END $$;

-- ============================================================================
-- PARTIE 2 : SUPPRIMER LES BACKUPS (À EXÉCUTER APRÈS VALIDATION - 30 JAN)
-- ============================================================================
-- ⚠️  NE PAS EXÉCUTER AVANT D'AVOIR VALIDÉ QUE TOUT FONCTIONNE
-- Attendre au moins 7 jours après le nettoyage

/*
BEGIN;

-- Supprimer les backups du nettoyage du 23 janvier
DROP TABLE IF EXISTS backup_infos_pratiques_20260123;
DROP TABLE IF EXISTS backup_checklists_20260123;
DROP TABLE IF EXISTS backup_demandes_horaires_20260123;
DROP TABLE IF EXISTS backup_evaluations_sejour_20260123;
DROP TABLE IF EXISTS backup_problemes_signales_20260123;
DROP TABLE IF EXISTS backup_retours_menage_20260123;
DROP TABLE IF EXISTS backup_suivi_soldes_bancaires_20260123;

-- Supprimer ancien backup trevoux si confirmé inutile
DROP TABLE IF EXISTS infos_gites_backup_trevoux;

COMMIT;

DO $$ BEGIN
    RAISE NOTICE '✅ Tous les backups ont été supprimés';
    RAISE NOTICE '⚠️  Les tables ne peuvent plus être restaurées';
END $$;
*/

-- ============================================================================
-- VÉRIFICATION : LISTER TOUTES LES TABLES UNRESTRICTED
-- ============================================================================

SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND rowsecurity = false
ORDER BY tablename;

-- ============================================================================
-- FIN DU SCRIPT
-- ============================================================================
