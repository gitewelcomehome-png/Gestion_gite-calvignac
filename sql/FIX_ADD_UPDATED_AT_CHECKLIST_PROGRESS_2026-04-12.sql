-- ================================================================
-- FIX : Ajout colonne updated_at dans checklist_progress
-- DATE : 2026-04-12
-- CAUSE : La fonction upsert_checklist_progress_by_token référence
--         updated_at dans son DO UPDATE SET, mais la colonne n'existe
--         pas dans la table → erreur 400 code 42703
-- SOLUTION : Ajouter la colonne + recréer la fonction (idempotent)
-- ================================================================

-- 1. Ajouter la colonne updated_at si elle n'existe pas
ALTER TABLE public.checklist_progress
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- 2. Recréer la fonction avec owner_user_id récupéré depuis le token
CREATE OR REPLACE FUNCTION public.upsert_checklist_progress_by_token(
    p_token        text,
    p_template_id  uuid,
    p_completed    boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_reservation_id uuid;
    v_owner_user_id  uuid;
BEGIN
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

    INSERT INTO public.checklist_progress (owner_user_id, reservation_id, template_id, completed, completed_at)
    VALUES (v_owner_user_id, v_reservation_id, p_template_id, p_completed, CASE WHEN p_completed THEN now() ELSE NULL END)
    ON CONFLICT (reservation_id, template_id)
    DO UPDATE SET
        completed    = EXCLUDED.completed,
        completed_at = EXCLUDED.completed_at,
        updated_at   = now();
END;
$$;

REVOKE ALL ON FUNCTION public.upsert_checklist_progress_by_token(text,uuid,boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.upsert_checklist_progress_by_token(text,uuid,boolean) TO anon, authenticated;
