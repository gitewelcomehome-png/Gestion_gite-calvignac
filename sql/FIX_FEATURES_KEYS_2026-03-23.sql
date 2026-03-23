-- ================================================================
-- FIX : Clés JSONB manquantes dans cm_pricing_plans.features
-- Date : 2026-03-23
-- Problème : subscription-manager.js utilisait des clés (ai_autocomplete,
--            gdf_table) absentes de la BDD → toujours false pour tous
-- Solution : Ajouter les clés dans les plans DUO+ et QUATTRO
-- ================================================================
-- ⚠️ À exécuter dans Supabase SQL Editor
-- ================================================================

BEGIN;

-- ----------------------------------------------------------------
-- 1. Ajouter ai_autocomplete et gdf_table pour DUO+ et QUATTRO
--    (features internes non affichées sur la page pricing)
-- ----------------------------------------------------------------
UPDATE public.cm_pricing_plans
SET features = features || '{"ai_autocomplete": true, "gdf_table": true}'::jsonb
WHERE slug IN ('duo_mensuel', 'duo_annuel', 'quattro_mensuel', 'quattro_annuel');

-- ----------------------------------------------------------------
-- 2. Vérification
-- ----------------------------------------------------------------
SELECT
    name,
    slug,
    features->>'ai_autocomplete' AS ai_autocomplete,
    features->>'gdf_table'       AS gdf_table,
    features->>'communication'   AS communication,
    features->>'multi_gites'     AS multi_gites,
    features->>'tableaux_avances' AS tableaux_avances
FROM public.cm_pricing_plans
ORDER BY sort_order;

COMMIT;
