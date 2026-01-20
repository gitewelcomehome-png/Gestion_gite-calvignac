-- ================================================================
-- NETTOYAGE COMPLET AVANT RECRÉATION
-- ================================================================
-- Supprime tous les triggers et contraintes problématiques
-- ================================================================

-- Supprimer tous les triggers sur reservations
DROP TRIGGER IF EXISTS trigger_calculate_restant ON reservations;
DROP TRIGGER IF EXISTS trigger_sync_aliases ON reservations;
DROP TRIGGER IF EXISTS trigger_sync_gite_name ON reservations;

-- Supprimer les contraintes CHECK sur cleaning_schedule
DO $$ 
BEGIN
    ALTER TABLE cleaning_schedule DROP CONSTRAINT IF EXISTS cleaning_schedule_type_check;
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

-- Supprimer les foreign keys sur cleaning_schedule
DO $$ 
BEGIN
    ALTER TABLE cleaning_schedule DROP CONSTRAINT IF EXISTS cleaning_schedule_reservation_id_fkey;
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

DO $$ 
BEGIN
    ALTER TABLE cleaning_schedule DROP CONSTRAINT IF EXISTS cleaning_schedule_reservation_id_key;
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

-- Supprimer retours_menage foreign key vers cleaning_schedule
DO $$ 
BEGIN
    ALTER TABLE retours_menage DROP CONSTRAINT IF EXISTS retours_menage_cleaning_id_fkey;
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

SELECT '✅ Nettoyage terminé - Vous pouvez maintenant exécuter CREATION_SANS_INDEX.sql' as status;
