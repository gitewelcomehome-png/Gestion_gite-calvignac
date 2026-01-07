-- ============================================================================
-- BACKUP STRUCTURE - État AVANT Phase 1 Multi-Tenant
-- Date: 7 janvier 2026
-- ============================================================================

-- Pour restaurer cette structure en cas de problème, exécutez ce fichier
-- dans Supabase SQL Editor après avoir supprimé les tables créées en Phase 1

-- Ce fichier sert de point de sauvegarde de votre schéma actuel
-- Les tables multi-tenant ajoutées peuvent être supprimées avec :
-- DROP TABLE IF EXISTS organization_members CASCADE;
-- DROP TABLE IF EXISTS gites CASCADE;
-- DROP TABLE IF EXISTS organizations CASCADE;

-- ============================================================================
-- TABLES EXISTANTES AVANT MIGRATION
-- ============================================================================
-- reservations
-- charges
-- retours_menage
-- stocks_draps
-- user_roles
-- infos_pratiques

-- NOTE: Pour un backup complet de la structure, exécutez cette requête
-- dans Supabase SQL Editor et sauvegardez le résultat :

SELECT 
    'TABLE: ' || table_name as info,
    table_name
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Puis pour chaque table, obtenir sa définition :
-- SELECT pg_get_tabledef('nom_de_la_table');

