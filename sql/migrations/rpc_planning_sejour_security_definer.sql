-- ==================================================================================
-- Migration : RPCs SECURITY DEFINER pour planning_sejour (INSERT + DELETE)
-- Problème : Kong ne transmet pas x-client-token à PostgREST
--            → client_token_reservation_id() = NULL → RLS bloque les écritures
-- Solution  : RPCs SECURITY DEFINER qui valident le token en paramètre
-- Date : 2026-04-22
-- ==================================================================================

-- ==================================================================================
-- RPC 1 : Insérer une entrée planning (validation token interne)
-- ==================================================================================
CREATE OR REPLACE FUNCTION public.insert_planning_sejour(
    p_token              text,
    p_reservation_id     uuid,
    p_jour               date,
    p_heure_debut        time,
    p_heure_fin          time,
    p_source             text,
    p_activite_gite_id   uuid,
    p_activite_part_id   uuid,
    p_titre_libre        text,
    p_mode_transport     text,
    p_distance_km        numeric,
    p_duree_trajet_min   integer,
    p_heure_depart       time,
    p_latitude_dest      numeric,
    p_longitude_dest     numeric
)
RETURNS SETOF public.planning_sejour
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_reservation_id uuid;
BEGIN
    -- Valider le token et récupérer la reservation_id associée
    SELECT cat.reservation_id INTO v_reservation_id
    FROM public.client_access_tokens cat
    WHERE cat.token = p_token
      AND cat.is_active = true
      AND cat.expires_at > now()
    LIMIT 1;

    IF v_reservation_id IS NULL THEN
        RAISE EXCEPTION 'Token invalide ou expiré';
    END IF;

    -- Vérifier que l'appelant ne tente pas d'insérer sur une autre réservation
    IF p_reservation_id IS DISTINCT FROM v_reservation_id THEN
        RAISE EXCEPTION 'reservation_id ne correspond pas au token';
    END IF;

    RETURN QUERY
    INSERT INTO public.planning_sejour (
        reservation_id, token_fiche_client, jour, heure_debut, heure_fin,
        source, activite_gite_id, activite_partenaire_id, titre_libre,
        mode_transport, distance_km, duree_trajet_min, heure_depart_suggeree,
        latitude_dest, longitude_dest, statut
    ) VALUES (
        v_reservation_id, p_token, p_jour, p_heure_debut, p_heure_fin,
        p_source, p_activite_gite_id, p_activite_part_id, p_titre_libre,
        p_mode_transport, p_distance_km, p_duree_trajet_min, p_heure_depart,
        p_latitude_dest, p_longitude_dest, 'planifie'
    )
    RETURNING *;
END;
$$;

REVOKE ALL ON FUNCTION public.insert_planning_sejour(text,uuid,date,time,time,text,uuid,uuid,text,text,numeric,integer,time,numeric,numeric) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.insert_planning_sejour(text,uuid,date,time,time,text,uuid,uuid,text,text,numeric,integer,time,numeric,numeric) TO anon, authenticated;

-- ==================================================================================
-- RPC 2 : Supprimer une entrée planning (validation token interne)
-- ==================================================================================
CREATE OR REPLACE FUNCTION public.delete_planning_sejour(
    p_token      text,
    p_planning_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_reservation_id uuid;
BEGIN
    SELECT cat.reservation_id INTO v_reservation_id
    FROM public.client_access_tokens cat
    WHERE cat.token = p_token
      AND cat.is_active = true
      AND cat.expires_at > now()
    LIMIT 1;

    IF v_reservation_id IS NULL THEN
        RAISE EXCEPTION 'Token invalide ou expiré';
    END IF;

    DELETE FROM public.planning_sejour
    WHERE id = p_planning_id
      AND reservation_id = v_reservation_id;
END;
$$;

REVOKE ALL ON FUNCTION public.delete_planning_sejour(text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_planning_sejour(text, uuid) TO anon, authenticated;

-- ==================================================================================
-- RPC 3 : Lire le planning (validation token interne — remplace SELECT direct)
-- ==================================================================================
CREATE OR REPLACE FUNCTION public.get_planning_sejour(p_token text)
RETURNS SETOF public.planning_sejour
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT ps.*
    FROM public.planning_sejour ps
    INNER JOIN public.client_access_tokens cat ON cat.reservation_id = ps.reservation_id
    WHERE cat.token = p_token
      AND cat.is_active = true
      AND cat.expires_at > now()
    ORDER BY ps.jour, ps.heure_debut;
$$;

REVOKE ALL ON FUNCTION public.get_planning_sejour(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_planning_sejour(text) TO anon, authenticated;

-- Vérification
-- SELECT routine_name FROM information_schema.routines
-- WHERE routine_schema = 'public'
--   AND routine_name IN ('insert_planning_sejour','delete_planning_sejour','get_planning_sejour');
