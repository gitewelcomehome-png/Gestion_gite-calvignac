-- ================================================================
-- FIX : Colonnes nb_gites_max et level dans cm_pricing_plans
-- Date : 2026-03-23
-- Objectif : Rendre ces colonnes lisibles directement par le JS
--            (subscription-manager.js, gites-manager.js, calendrier-tarifs.js)
-- ================================================================
-- ⚠️ À exécuter dans Supabase SQL Editor après MIGRATION_ABONNEMENTS_6_PLANS
-- ================================================================

BEGIN;

-- ----------------------------------------------------------------
-- 1. Ajouter les colonnes nb_gites_max et level
-- ----------------------------------------------------------------
ALTER TABLE public.cm_pricing_plans
    ADD COLUMN IF NOT EXISTS nb_gites_max INTEGER,
    ADD COLUMN IF NOT EXISTS level        INTEGER;

-- ----------------------------------------------------------------
-- 2. Peupler depuis les données JSONB existantes
-- ----------------------------------------------------------------
UPDATE public.cm_pricing_plans SET
    nb_gites_max = (limits->>'nb_gites')::integer,
    level = CASE
        WHEN slug LIKE 'solo%'     THEN 1
        WHEN slug LIKE 'duo%'      THEN 2
        WHEN slug LIKE 'quattro%'  THEN 3
        ELSE 1
    END;

-- ----------------------------------------------------------------
-- 3. Ajouter billing_cycle dans user_subscriptions
--    (pour que le manager puisse savoir mensuel vs annuel)
-- ----------------------------------------------------------------
ALTER TABLE public.user_subscriptions
    ADD COLUMN IF NOT EXISTS billing_cycle TEXT DEFAULT 'mensuel'
        CHECK (billing_cycle IN ('mensuel', 'annuel'));

COMMENT ON COLUMN public.user_subscriptions.billing_cycle IS
    'Cycle de facturation de cet abonnement utilisateur';

-- ----------------------------------------------------------------
-- 4. Recréer subscriptions_plans comme vue (c'est une TABLE existante)
-- ----------------------------------------------------------------
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables
               WHERE table_schema = 'public' AND table_name = 'subscriptions_plans'
               AND table_type = 'BASE TABLE') THEN
        DROP TABLE public.subscriptions_plans CASCADE;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.views
               WHERE table_schema = 'public' AND table_name = 'subscriptions_plans') THEN
        DROP VIEW public.subscriptions_plans;
    END IF;
END $$;
CREATE VIEW public.subscriptions_plans AS
    SELECT * FROM public.cm_pricing_plans;

-- ----------------------------------------------------------------
-- 5. Vérification
-- ----------------------------------------------------------------
SELECT name, slug, nb_gites_max, level, price_monthly,
       (features->>'fiscalite')::boolean AS fiscalite
FROM public.cm_pricing_plans
ORDER BY sort_order;

COMMIT;
