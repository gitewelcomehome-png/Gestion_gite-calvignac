-- ==============================================================================
-- FIX FICHE CLIENT : Fonction RPC SECURITY DEFINER pour accès par token
-- Date: 17 mars 2026
--
-- Problème: Le header x-client-token passé par Supabase JS v2 (global.headers)
-- n'est pas transmis par la passerelle Kong jusqu'à PostgREST, donc
-- current_setting('request.headers')::json->>'x-client-token' retourne NULL.
-- Toutes les RLS policies qui en dépendent (client_token_value()) échouent.
--
-- Solution: Utiliser une fonction SECURITY DEFINER qui reçoit le token
-- en paramètre direct (pas via header). Elle valide et retourne la réservation.
-- ==============================================================================

-- Fonction principale : valider token et retourner la réservation
CREATE OR REPLACE FUNCTION public.get_reservation_by_client_token(p_token text)
RETURNS SETOF public.reservations
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT r.*
    FROM public.reservations r
    INNER JOIN public.client_access_tokens cat ON cat.reservation_id = r.id
    WHERE cat.token = p_token
      AND cat.is_active = true
      AND cat.expires_at > now()
    LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_reservation_by_client_token(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_reservation_by_client_token(text) TO anon, authenticated;

-- Fonction secondaire : valider token et retourner les données du token
-- (id, reservation_id, owner_user_id, expires_at, is_active)
CREATE OR REPLACE FUNCTION public.get_client_token_data(p_token text)
RETURNS TABLE (
    token_id        uuid,
    reservation_id  uuid,
    owner_user_id   uuid,
    expires_at      timestamptz,
    is_active       boolean
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT
        cat.id,
        cat.reservation_id,
        cat.owner_user_id,
        cat.expires_at,
        cat.is_active
    FROM public.client_access_tokens cat
    WHERE cat.token = p_token
      AND cat.is_active = true
      AND cat.expires_at > now()
    LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_client_token_data(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_client_token_data(text) TO anon, authenticated;

-- Vérification
SELECT
    routine_name,
    routine_type,
    security_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('get_reservation_by_client_token', 'get_client_token_data')
ORDER BY routine_name;
