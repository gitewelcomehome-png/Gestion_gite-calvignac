-- ================================================================
-- FIX : RPC insert_probleme_signale_by_token
-- DATE : 2026-04-12
-- CAUSE : L'insert direct anon sur problemes_signales est bloqué par
--         la politique RLS RESTRICTIVE gc_anon_insert_problemes_token
--         (owner_user_id NOT NULL + RESTRICTIVE policy non franchissable
--         selon l'environnement d'exécution PostgREST)
-- SOLUTION : RPC SECURITY DEFINER — même pattern que
--            upsert_checklist_progress_by_token et insert_retour_client_by_token
-- ================================================================

CREATE OR REPLACE FUNCTION public.insert_probleme_signale_by_token(
    p_token       text,
    p_type        text,
    p_sujet       text,
    p_description text,
    p_urgence     text    DEFAULT 'normale',
    p_gite        text    DEFAULT NULL,
    p_client_name text    DEFAULT NULL,
    p_telephone   text    DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_reservation_id uuid;
    v_owner_user_id  uuid;
    v_gite_id        uuid;
BEGIN
    -- Valider le token et récupérer reservation_id + owner_user_id
    SELECT cat.reservation_id, cat.owner_user_id
    INTO v_reservation_id, v_owner_user_id
    FROM public.client_access_tokens cat
    WHERE cat.token = p_token
      AND cat.is_active = true
      AND cat.expires_at > now()
    LIMIT 1;

    IF v_reservation_id IS NULL THEN
        RAISE EXCEPTION 'Token invalide ou expiré';
    END IF;

    -- Récupérer gite_id depuis la réservation
    SELECT r.gite_id INTO v_gite_id
    FROM public.reservations r
    WHERE r.id = v_reservation_id
    LIMIT 1;

    INSERT INTO public.problemes_signales (
        owner_user_id,
        reservation_id,
        gite_id,
        gite,
        client_name,
        type,
        sujet,
        urgence,
        description,
        telephone,
        statut,
        created_at
    ) VALUES (
        v_owner_user_id,
        v_reservation_id,
        v_gite_id,
        p_gite,
        p_client_name,
        p_type,
        p_sujet,
        p_urgence,
        p_description,
        p_telephone,
        'nouveau',
        now()
    );
END;
$$;

REVOKE ALL ON FUNCTION public.insert_probleme_signale_by_token(text,text,text,text,text,text,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.insert_probleme_signale_by_token(text,text,text,text,text,text,text,text) TO anon, authenticated;
