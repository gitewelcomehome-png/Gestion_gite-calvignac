-- ================================================================
-- NETTOYAGE PRÉ-MIGRATION - UNIFORMISATION DES DONNÉES
-- ================================================================
-- Date: 7 janvier 2026
-- Objectif: Corriger les incohérences AVANT migration
-- 
-- Problèmes détectés:
-- 1. "Trévoux" (avec accent) vs "Trevoux" (sans accent) → même gîte
-- 2. "Le Rive Droite" vs "Couzon" → même gîte (ancien nom)
-- 
-- ⚠️ EXÉCUTER AVANT sql/migration_production_preserve_data.sql
-- ================================================================

BEGIN;

-- ----------------------------------------------------------------
-- ÉTAPE 1: BACKUP (vérification avant modification)
-- ----------------------------------------------------------------

-- Compter les données AVANT nettoyage
SELECT 
    'AVANT NETTOYAGE' as phase,
    gite,
    COUNT(*) as count
FROM reservations
GROUP BY gite
ORDER BY gite;

-- ----------------------------------------------------------------
-- ÉTAPE 2: NORMALISATION "Trévoux" → "Trevoux"
-- ----------------------------------------------------------------

DO $$
DECLARE
    res_count INT;
    clean_count INT;
BEGIN
    -- Dans reservations
    UPDATE reservations 
    SET gite = 'Trevoux'
    WHERE gite = 'Trévoux';
    GET DIAGNOSTICS res_count = ROW_COUNT;
    RAISE NOTICE '✅ reservations: % lignes Trévoux → Trevoux', res_count;

    -- Dans cleaning_schedule
    UPDATE cleaning_schedule 
    SET gite = 'Trevoux'
    WHERE gite = 'Trévoux';
    GET DIAGNOSTICS clean_count = ROW_COUNT;
    RAISE NOTICE '✅ cleaning_schedule: % lignes Trévoux → Trevoux', clean_count;
END $$;

-- ----------------------------------------------------------------
-- ÉTAPE 3: NORMALISATION "Le Rive Droite" → "Couzon"
-- ----------------------------------------------------------------

DO $$
DECLARE
    res_count INT;
    clean_count INT;
BEGIN
    -- "Le Rive Droite" est l'ancien nom de "Couzon"
    UPDATE reservations 
    SET gite = 'Couzon'
    WHERE gite = 'Le Rive Droite';
    GET DIAGNOSTICS res_count = ROW_COUNT;
    RAISE NOTICE '✅ reservations: % lignes Le Rive Droite → Couzon', res_count;

    UPDATE cleaning_schedule 
    SET gite = 'Couzon'
    WHERE gite = 'Le Rive Droite';
    GET DIAGNOSTICS clean_count = ROW_COUNT;
    RAISE NOTICE '✅ cleaning_schedule: % lignes Le Rive Droite → Couzon', clean_count;
END $$;

-- ----------------------------------------------------------------
-- ÉTAPE 4: VÉRIFICATION POST-NETTOYAGE
-- ----------------------------------------------------------------

-- Compter les données APRÈS nettoyage
SELECT 
    'APRÈS NETTOYAGE' as phase,
    gite,
    COUNT(*) as count
FROM reservations
GROUP BY gite
ORDER BY gite;

-- Vérifier cleaning_schedule
SELECT 
    'CLEANING APRÈS NETTOYAGE' as phase,
    gite,
    COUNT(*) as count
FROM cleaning_schedule
GROUP BY gite
ORDER BY gite;

-- ----------------------------------------------------------------
-- ÉTAPE 5: VALIDATION
-- ----------------------------------------------------------------

DO $$
DECLARE
    gite_count INT;
    trevoux_accent_count INT;
BEGIN
    -- Vérifier qu'il ne reste plus de "Trévoux" avec accent
    SELECT COUNT(*) INTO trevoux_accent_count
    FROM (
        SELECT gite FROM reservations WHERE gite = 'Trévoux'
        UNION ALL
        SELECT gite FROM cleaning_schedule WHERE gite = 'Trévoux'
    ) tmp;
    
    IF trevoux_accent_count > 0 THEN
        RAISE EXCEPTION '❌ Il reste % occurrences de "Trévoux" avec accent!', trevoux_accent_count;
    END IF;
    
    -- Compter le nombre de gîtes distincts
    SELECT COUNT(DISTINCT gite) INTO gite_count
    FROM (
        SELECT gite FROM reservations
        UNION
        SELECT gite FROM cleaning_schedule
    ) tmp;
    
    RAISE NOTICE '✅ Nombre de gîtes distincts: %', gite_count;
    
    IF gite_count = 2 THEN
        RAISE NOTICE '✅ 2 gîtes (Trevoux + Couzon) - Migration standard OK';
    ELSIF gite_count = 3 THEN
        RAISE NOTICE '⚠️  3 gîtes détectés - Script migration doit être adapté!';
    ELSE
        RAISE WARNING '⚠️  % gîtes détectés - Vérifier manuellement', gite_count;
    END IF;
END $$;

COMMIT;

-- ================================================================
-- RÉSULTATS ATTENDUS
-- ================================================================
--
-- ✅ SUCCÈS si:
-- 1. "Trévoux" (avec accent) n'existe plus
-- 2. Seulement "Trevoux" (sans accent) reste
-- 3. Décision prise pour "Le Rive Droite"
--
-- PROCHAINES ÉTAPES:
-- 1. Si 2 gîtes: Exécuter sql/migration_production_preserve_data.sql
-- 2. Si 3 gîtes: Adapter script migration pour créer 3 gîtes
-- ================================================================
