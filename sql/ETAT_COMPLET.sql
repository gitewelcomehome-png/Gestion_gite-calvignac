-- ================================================================
-- VÉRIFICATION COMPLÈTE DE LA BASE
-- ================================================================

-- 1. Compter toutes les données
SELECT 'gites' as table_name, COUNT(*) as count FROM gites
UNION ALL
SELECT 'reservations', COUNT(*) FROM reservations
UNION ALL
SELECT 'cleaning_schedule', COUNT(*) FROM cleaning_schedule
UNION ALL
SELECT 'charges', COUNT(*) FROM charges;

-- 2. Voir s'il y a des sauvegardes dans historical_data
SELECT COUNT(*) as backups_count 
FROM historical_data 
WHERE table_name = 'reservations';

-- 3. Lister les gîtes existants
SELECT id, name, slug FROM gites;
