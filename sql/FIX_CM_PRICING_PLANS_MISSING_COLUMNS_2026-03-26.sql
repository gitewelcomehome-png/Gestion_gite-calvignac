-- ==================================================================================
-- FIX : Colonnes manquantes dans cm_pricing_plans
-- Date : 2026-03-26
-- Problème : subscription-manager.js lit plan.display_name, plan.level, plan.nb_gites_max
--            mais ces colonnes n'existent pas → badge "UNDEFINED", plan affiché "SOLO"
-- ==================================================================================

-- 1. Ajouter les colonnes manquantes
ALTER TABLE public.cm_pricing_plans
  ADD COLUMN IF NOT EXISTS display_name   TEXT,
  ADD COLUMN IF NOT EXISTS level          INTEGER,
  ADD COLUMN IF NOT EXISTS nb_gites_max   INTEGER;

-- 2. Peupler à partir des données existantes
UPDATE public.cm_pricing_plans SET
  display_name  = name,
  level         = CASE
                    WHEN slug LIKE 'solo%'     THEN 1
                    WHEN slug LIKE 'duo%'      THEN 2
                    WHEN slug LIKE 'quattro%'  THEN 3
                    ELSE 1
                  END,
  nb_gites_max  = (limits->>'nb_gites')::int;

-- 3. Vérification
SELECT slug, display_name, level, nb_gites_max
FROM public.cm_pricing_plans
ORDER BY sort_order;
