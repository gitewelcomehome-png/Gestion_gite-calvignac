-- ==================================================================================
-- SETUP PROFIL ADMIN - gite.welcomehome@gmail.com
-- Date : 2026-03-26
-- Objectif : Créer/mettre à jour le profil admin avec plan Quattro Annuel actif
--            → plus de bannière trial, accès complet à toutes les fonctionnalités
-- ==================================================================================

DO $$
DECLARE
    v_user_id   UUID;
    v_client_id UUID;
    v_plan_id   UUID;
BEGIN

    -- 1. Récupérer le user_id
    SELECT id INTO v_user_id
    FROM auth.users
    WHERE email = 'gite.welcomehome@gmail.com'
    LIMIT 1;

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Compte gite.welcomehome@gmail.com introuvable dans auth.users.';
    END IF;

    RAISE NOTICE 'user_id = %', v_user_id;

    -- 2. Récupérer l'id du plan quattro_annuel
    SELECT id INTO v_plan_id
    FROM public.cm_pricing_plans
    WHERE slug = 'quattro_annuel'
    LIMIT 1;

    IF v_plan_id IS NULL THEN
        RAISE EXCEPTION 'Plan quattro_annuel introuvable dans cm_pricing_plans.';
    END IF;

    RAISE NOTICE 'plan_id quattro_annuel = %', v_plan_id;

    -- 3. Upsert cm_clients (statut = 'active', plus de trial)
    -- Vérifier si une entrée existe déjà pour ce user_id
    SELECT id INTO v_client_id
    FROM public.cm_clients
    WHERE user_id = v_user_id
    LIMIT 1;

    IF v_client_id IS NOT NULL THEN
        -- Mise à jour du profil existant
        UPDATE public.cm_clients SET
            statut              = 'active',
            type_abonnement     = 'quattro',
            billing_cycle       = 'annuel',
            onboarding_completed = true,
            trial_ends_at       = NULL
        WHERE id = v_client_id;
        RAISE NOTICE 'cm_clients mis à jour, id = %', v_client_id;
    ELSE
        -- Création du profil admin
        INSERT INTO public.cm_clients (
            user_id,
            email,
            statut,
            type_abonnement,
            billing_cycle,
            onboarding_completed,
            trial_ends_at
        ) VALUES (
            v_user_id,
            'gite.welcomehome@gmail.com',
            'active',
            'quattro',
            'annuel',
            true,
            NULL
        )
        ON CONFLICT (email) DO UPDATE SET
            user_id             = v_user_id,
            statut              = 'active',
            type_abonnement     = 'quattro',
            billing_cycle       = 'annuel',
            onboarding_completed = true,
            trial_ends_at       = NULL
        RETURNING id INTO v_client_id;

        IF v_client_id IS NULL THEN
            SELECT id INTO v_client_id FROM public.cm_clients WHERE email = 'gite.welcomehome@gmail.com';
        END IF;

        RAISE NOTICE 'cm_clients créé, id = %', v_client_id;
    END IF;

    -- 4. Supprimer les anciens abonnements actifs pour éviter les doublons
    DELETE FROM public.cm_subscriptions
    WHERE client_id = v_client_id AND status = 'active';

    -- 5. Créer l'abonnement actif Quattro Annuel
    INSERT INTO public.cm_subscriptions (
        client_id,
        plan_id,
        status,
        billing_cycle,
        current_period_start,
        current_period_end
    ) VALUES (
        v_client_id,
        v_plan_id,
        'active',
        'annuel',
        NOW(),
        NOW() + INTERVAL '10 years'
    );

    RAISE NOTICE '✅ Profil admin mis à jour : Quattro Annuel actif, plus de bannière trial.';

END $$;
