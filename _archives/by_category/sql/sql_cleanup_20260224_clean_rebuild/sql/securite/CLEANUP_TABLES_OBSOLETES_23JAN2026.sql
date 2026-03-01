-- ========================================
-- 🗑️ NETTOYAGE TABLES OBSOLÈTES
-- ========================================
-- Date: 23 janvier 2026
-- Raison: Suppression tables inutilisées
-- ATTENTION: Exécuter après sauvegarde complète !
-- ========================================

-- ⚠️ SÉCURITÉ: Commencer par une TRANSACTION
BEGIN;

-- 📋 TABLES À SUPPRIMER (7 tables)
-- 2 obsolètes + 5 features non implémentées

-- ========================================
-- 1. TABLES OBSOLÈTES (2 tables)
-- ========================================

-- 1.1 infos_pratiques (remplacée par infos_gites)
DROP TABLE IF EXISTS public.infos_pratiques CASCADE;
-- CASCADE supprime aussi les FK et indexes liés

-- 1.2 checklists (remplacée par checklist_templates + checklist_progress)
DROP TABLE IF EXISTS public.checklists CASCADE;

-- ========================================
-- 2. FEATURES NON IMPLÉMENTÉES (5 tables)
-- ========================================

-- 2.1 demandes_horaires (feature jamais développée)
DROP TABLE IF EXISTS public.demandes_horaires CASCADE;

-- 2.2 evaluations_sejour (système d'évaluation jamais implémenté)
DROP TABLE IF EXISTS public.evaluations_sejour CASCADE;

-- 2.3 problemes_signales (feature signalements jamais développée)
DROP TABLE IF EXISTS public.problemes_signales CASCADE;

-- 2.4 retours_menage (feature retours détaillés jamais utilisée)
DROP TABLE IF EXISTS public.retours_menage CASCADE;

-- 2.5 suivi_soldes_bancaires (trésorerie jamais implémentée)
DROP TABLE IF EXISTS public.suivi_soldes_bancaires CASCADE;

-- ========================================
-- ⚠️ VALIDATION FINALE
-- ========================================

-- Vérifier les tables restantes (doit retourner 22 tables)
-- 19 actives + 3 optionnelles = 22
SELECT 
    count(*) as tables_actives,
    string_agg(tablename, ', ' ORDER BY tablename) as liste_tables
FROM pg_tables 
WHERE schemaname = 'public'
  AND tablename NOT IN (
    'infos_pratiques', 
    'checklists', 
    'demandes_horaires', 
    'evaluations_sejour', 
    'problemes_signales', 
    'retours_menage',
    'suivi_soldes_bancaires'
  );

-- ========================================
-- 🔍 RÉSUMÉ SUPPRESSION
-- ========================================

-- Tables supprimées: 7
--   - Obsolètes: 2 (infos_pratiques, checklists)
--   - Non implémentées: 5 (demandes_horaires, evaluations_sejour, problemes_signales, retours_menage, suivi_soldes_bancaires)

-- Tables conservées: 22
--   - Actives: 19 (gites, reservations, infos_gites, linen_stocks, linen_stock_items, linen_needs, 
--                   cleaning_schedule, cleaning_rules, checklist_templates, checklist_progress, faq, 
--                   activites_gites, km_trajets, km_lieux_favoris, km_config_auto, 
--                   simulations_fiscales, fiscal_history, client_access_tokens, todos)
--   - Optionnelles: 3 (activites_consultations, fiche_generation_logs, historical_data)

-- ========================================
-- ⚠️ IMPORTANT: Valider visuellement le résultat
-- ========================================

-- Si tout est OK, VALIDER:
COMMIT;

-- Si problème, ANNULER:
-- ROLLBACK;

-- ========================================
-- 📝 LOGS
-- ========================================
-- Tables supprimées archivées dans: _archives/TABLES_SUPPRIMEES_23JAN2026.md
-- Structure complète conservée pour restauration éventuelle
