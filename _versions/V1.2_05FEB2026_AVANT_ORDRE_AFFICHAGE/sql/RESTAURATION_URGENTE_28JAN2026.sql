-- ============================================================================
-- RESTAURATION URGENTE - 28 JANVIER 2026
-- ============================================================================
-- RAISON : Tables supprimées par erreur le 23/01/2026
-- Les fonctionnalités ÉTAIENT développées et fonctionnelles !
-- Les clients utilisent ces features sur la fiche client.
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. RESTAURER demandes_horaires
-- ============================================================================
-- Feature : Demandes de changement d'horaires (arrivée anticipée / départ tardif)
-- Utilisée dans : pages/fiche-client.html + js/fiche-client-app.js

CREATE TABLE IF NOT EXISTS demandes_horaires AS 
SELECT * FROM backup_demandes_horaires_20260123;

-- Vérification
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'demandes_horaires') THEN
        RAISE NOTICE '✅ Table demandes_horaires restaurée avec succès';
    ELSE
        RAISE EXCEPTION '❌ Échec restauration demandes_horaires';
    END IF;
END $$;

-- ============================================================================
-- 2. RESTAURER problemes_signales
-- ============================================================================
-- Feature : Demandes retours/améliorations/problèmes
-- Utilisée dans : pages/fiche-client.html + js/fiche-client-app.js

CREATE TABLE IF NOT EXISTS problemes_signales AS 
SELECT * FROM backup_problemes_signales_20260123;

-- Vérification
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'problemes_signales') THEN
        RAISE NOTICE '✅ Table problemes_signales restaurée avec succès';
    ELSE
        RAISE EXCEPTION '❌ Échec restauration problemes_signales';
    END IF;
END $$;

COMMIT;

-- ============================================================================
-- VÉRIFICATIONS FINALES
-- ============================================================================

-- Compter les enregistrements restaurés
SELECT 
    'demandes_horaires' as table_name,
    COUNT(*) as nb_lignes
FROM demandes_horaires

UNION ALL

SELECT 
    'problemes_signales' as table_name,
    COUNT(*) as nb_lignes
FROM problemes_signales;

-- Message de confirmation
DO $$
BEGIN
    RAISE NOTICE '✅ RESTAURATION TERMINÉE - Les 2 tables sont à nouveau disponibles';
    RAISE NOTICE 'ℹ️  Prochaine étape : Vérifier que les formulaires fonctionnent sur la fiche client';
END $$;
