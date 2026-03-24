-- ================================================================
-- RPC : create_client_onboarding
-- Date : 2026-03-24
-- Objectif : Permettre la création de cm_clients depuis l'onboarding
--            même si la session Supabase n'est pas encore établie
--            (confirmation email en attente → pas de JWT → RLS refuse).
--            SECURITY DEFINER = s'exécute avec droits admin (contourne RLS).
-- ================================================================
-- ⚠️ À exécuter dans Supabase SQL Editor
-- ================================================================

CREATE OR REPLACE FUNCTION public.create_client_onboarding(
    p_user_id          UUID,
    p_email_principal  TEXT,
    p_prenom_contact   TEXT,
    p_nom_contact      TEXT,
    p_telephone        TEXT DEFAULT NULL,
    p_nom_entreprise   TEXT DEFAULT NULL,
    p_adresse          TEXT DEFAULT NULL,
    p_code_postal      TEXT DEFAULT NULL,
    p_ville            TEXT DEFAULT NULL,
    p_pays             TEXT DEFAULT 'France',
    p_type_abonnement  TEXT DEFAULT 'solo',
    p_billing_cycle    TEXT DEFAULT 'mensuel',
    p_trial_ends_at    TIMESTAMPTZ DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_client_id UUID;
BEGIN
    -- Vérifier si un client existe déjà pour ce user_id
    SELECT id INTO v_client_id
    FROM public.cm_clients
    WHERE user_id = p_user_id
    LIMIT 1;

    IF v_client_id IS NOT NULL THEN
        -- Mettre à jour
        UPDATE public.cm_clients SET
            email_principal    = p_email_principal,
            prenom_contact     = p_prenom_contact,
            nom_contact        = p_nom_contact,
            telephone          = p_telephone,
            nom_entreprise     = p_nom_entreprise,
            adresse            = p_adresse,
            code_postal        = p_code_postal,
            ville              = p_ville,
            pays               = COALESCE(p_pays, 'France'),
            type_abonnement    = p_type_abonnement,
            billing_cycle      = p_billing_cycle,
            statut             = 'trial',
            onboarding_completed = true,
            trial_ends_at      = COALESCE(p_trial_ends_at, NOW() + INTERVAL '14 days'),
            updated_at         = NOW()
        WHERE id = v_client_id;
    ELSE
        -- Insérer
        INSERT INTO public.cm_clients (
            user_id, email_principal, prenom_contact, nom_contact,
            telephone, nom_entreprise, adresse, code_postal, ville, pays,
            type_abonnement, billing_cycle, statut,
            onboarding_completed, trial_ends_at
        ) VALUES (
            p_user_id, p_email_principal, p_prenom_contact, p_nom_contact,
            p_telephone, p_nom_entreprise, p_adresse, p_code_postal, p_ville,
            COALESCE(p_pays, 'France'),
            p_type_abonnement, p_billing_cycle, 'trial',
            true, COALESCE(p_trial_ends_at, NOW() + INTERVAL '14 days')
        )
        RETURNING id INTO v_client_id;
    END IF;

    RETURN v_client_id;
END;
$$;

-- Permettre l'appel depuis le client (anon ou authenticated)
GRANT EXECUTE ON FUNCTION public.create_client_onboarding TO anon, authenticated;

COMMENT ON FUNCTION public.create_client_onboarding IS
    'Crée ou met à jour un client lors de l''onboarding. SECURITY DEFINER pour contourner RLS quand la session n''est pas encore établie (confirmation email en attente).';
