-- ============================================================
-- RPC sécurisée : validation d'un token société de ménage
-- 
-- Problème résolu :
--   La table cleaner_tokens est protégée par RLS et ne peut pas
--   être lue par le rôle anon. Plutôt qu'ouvrir toute la table
--   (dangereux), on expose UNE fonction qui ne retourne que la
--   ligne correspondant au token fourni.
--
-- Sécurité :
--   - SECURITY DEFINER = s'exécute avec les droits du propriétaire
--   - La table cleaner_tokens reste entièrement protégée côté RLS
--   - L'appelant ne peut jamais voir d'autres tokens que le sien
--   - GRANT EXECUTE TO anon = appelable sans authentification
-- ============================================================

CREATE OR REPLACE FUNCTION public.validate_cleaner_token(p_token text)
RETURNS TABLE(owner_user_id uuid, type text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT ct.owner_user_id, ct.type
    FROM public.cleaner_tokens ct
    WHERE ct.token = p_token
      AND ct.type IN ('company', 'cleaner')
    LIMIT 1;
END;
$$;

-- Permettre aux utilisateurs non connectés d'appeler cette fonction
GRANT EXECUTE ON FUNCTION public.validate_cleaner_token(text) TO anon;

-- Vérification
SELECT routine_name, security_type
FROM information_schema.routines
WHERE routine_name = 'validate_cleaner_token';
