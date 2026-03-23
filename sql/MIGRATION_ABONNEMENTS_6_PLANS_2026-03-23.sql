-- ================================================================
-- MIGRATION : 6 ABONNEMENTS (Solo/Duo/Quattro × Mensuel/Annuel)
-- Date : 2026-03-23
-- Objectif : Aligner la BDD avec les 6 formules affichées sur le site
-- ================================================================
-- ⚠️ À exécuter dans Supabase SQL Editor
-- ⚠️ Faire un backup avant exécution
-- ================================================================

BEGIN;

-- ----------------------------------------------------------------
-- 1. Ajouter la colonne billing_cycle à cm_clients
-- ----------------------------------------------------------------
ALTER TABLE public.cm_clients
    ADD COLUMN IF NOT EXISTS billing_cycle TEXT DEFAULT 'mensuel'
        CHECK (billing_cycle IN ('mensuel', 'annuel'));

COMMENT ON COLUMN public.cm_clients.billing_cycle IS
    'Cycle de facturation : mensuel (sans engagement) ou annuel (avec engagement 12 mois)';

-- ----------------------------------------------------------------
-- 2. Migrer les noms de plans : basic→solo, pro→duo, premium→quattro
-- ----------------------------------------------------------------
UPDATE public.cm_clients SET type_abonnement = 'solo'    WHERE type_abonnement = 'basic';
UPDATE public.cm_clients SET type_abonnement = 'duo'     WHERE type_abonnement = 'pro';
UPDATE public.cm_clients SET type_abonnement = 'quattro' WHERE type_abonnement = 'premium';

COMMENT ON COLUMN public.cm_clients.type_abonnement IS
    'Formule abonnement : solo (1 gîte), duo (2 gîtes), quattro (4 gîtes)';

-- ----------------------------------------------------------------
-- 3. Mettre à jour la contrainte si elle existe
-- ----------------------------------------------------------------
ALTER TABLE public.cm_clients
    DROP CONSTRAINT IF EXISTS cm_clients_type_abonnement_check;

ALTER TABLE public.cm_clients
    ADD CONSTRAINT cm_clients_type_abonnement_check
        CHECK (type_abonnement IN ('solo', 'duo', 'quattro'));

-- ----------------------------------------------------------------
-- 4. Vider et recréer cm_pricing_plans avec les 6 formules
-- ----------------------------------------------------------------
TRUNCATE public.cm_pricing_plans CASCADE;

INSERT INTO public.cm_pricing_plans
    (name, slug, description, price_monthly, price_yearly, features, limits, is_active, sort_order)
VALUES
    -- Solo
    ('Solo Mensuel',    'solo_mensuel',
     '1 gîte, sans engagement',
     15.00, NULL,
     '{"calendrier": true, "menage": true, "fiscalite": false, "fiche_voyageur": true, "analytics": true}'::jsonb,
     '{"nb_gites": 1}'::jsonb,
     true, 1),

    ('Solo Annuel',     'solo_annuel',
     '1 gîte, avec engagement 12 mois – 10€/mois',
     10.00, 120.00,
     '{"calendrier": true, "menage": true, "fiscalite": true, "fiche_voyageur": true, "analytics": true}'::jsonb,
     '{"nb_gites": 1}'::jsonb,
     true, 2),

    -- Duo
    ('Duo Mensuel',     'duo_mensuel',
     '2 gîtes, sans engagement',
     22.00, NULL,
     '{"calendrier": true, "menage": true, "fiscalite": false, "fiche_voyageur": true, "analytics": true, "multi_gites": true, "communication": true, "formation": true}'::jsonb,
     '{"nb_gites": 2}'::jsonb,
     true, 3),

    ('Duo Annuel',      'duo_annuel',
     '2 gîtes, avec engagement 12 mois – 15€/mois',
     15.00, 180.00,
     '{"calendrier": true, "menage": true, "fiscalite": true, "fiche_voyageur": true, "analytics": true, "multi_gites": true, "communication": true, "formation": true}'::jsonb,
     '{"nb_gites": 2}'::jsonb,
     true, 4),

    -- Quattro
    ('Quattro Mensuel', 'quattro_mensuel',
     '4 gîtes, sans engagement',
     33.00, NULL,
     '{"calendrier": true, "menage": true, "fiscalite": false, "fiche_voyageur": true, "analytics": true, "multi_gites": true, "tableaux_avances": true, "communication": true, "support_vip": true, "formation_perso": true}'::jsonb,
     '{"nb_gites": 4}'::jsonb,
     true, 5),

    ('Quattro Annuel',  'quattro_annuel',
     '4 gîtes, avec engagement 12 mois – 23€/mois',
     23.00, 276.00,
     '{"calendrier": true, "menage": true, "fiscalite": true, "fiche_voyageur": true, "analytics": true, "multi_gites": true, "tableaux_avances": true, "communication": true, "support_vip": true, "formation_perso": true}'::jsonb,
     '{"nb_gites": 4}'::jsonb,
     true, 6);

-- ----------------------------------------------------------------
-- 5. Vérification finale
-- ----------------------------------------------------------------
SELECT
    name, slug, price_monthly, price_yearly,
    (limits->>'nb_gites')::int AS nb_gites,
    is_active, sort_order
FROM public.cm_pricing_plans
ORDER BY sort_order;

SELECT
    type_abonnement,
    billing_cycle,
    COUNT(*) AS nb_clients
FROM public.cm_clients
GROUP BY type_abonnement, billing_cycle
ORDER BY type_abonnement, billing_cycle;

COMMIT;
