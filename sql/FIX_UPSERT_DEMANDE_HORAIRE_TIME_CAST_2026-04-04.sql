-- ============================================================
-- FIX : upsert_demande_horaire_by_token — cast text → time
-- Date : 2026-04-04
-- Problème : p_heure (text) assigné directement à heure_demandee
--            (time without time zone) → erreur PostgreSQL 42804
-- Solution : p_heure::time dans les clauses SET et VALUES
-- ============================================================

CREATE OR REPLACE FUNCTION public.upsert_demande_horaire_by_token(
    p_token         text,
    p_type          text,       -- 'arrivee' ou 'depart'
    p_heure         text,       -- ex: '14:30'
    p_motif         text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_reservation_id uuid;
    v_owner_user_id  uuid;
    v_existing_id    uuid;
    v_result_id      uuid;
BEGIN
    -- Valider le token
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

    -- Chercher une demande existante en attente
    SELECT id INTO v_existing_id
    FROM public.demandes_horaires
    WHERE reservation_id = v_reservation_id
      AND type = p_type
      AND statut = 'en_attente'
    LIMIT 1;

    IF v_existing_id IS NOT NULL THEN
        -- Mettre à jour (cast text → time)
        UPDATE public.demandes_horaires
        SET heure_demandee = p_heure::time,
            motif = p_motif,
            updated_at = now()
        WHERE id = v_existing_id;
        RETURN v_existing_id;
    ELSE
        -- Insérer (cast text → time)
        INSERT INTO public.demandes_horaires (
            owner_user_id, reservation_id, type, heure_demandee, motif, statut
        ) VALUES (
            v_owner_user_id, v_reservation_id, p_type, p_heure::time, p_motif, 'en_attente'
        )
        RETURNING id INTO v_result_id;
        RETURN v_result_id;
    END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.upsert_demande_horaire_by_token(text,text,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.upsert_demande_horaire_by_token(text,text,text,text) TO anon, authenticated;
