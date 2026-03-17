-- ==============================================================================
-- FIX FICHE CLIENT COMPLET : RPCs SECURITY DEFINER + policies anon read
-- Date: 17 mars 2026
--
-- Problème: Le header x-client-token passé par Supabase JS v2 (global.headers)
-- n'est pas transmis par la passerelle Kong jusqu'à PostgREST.
-- Toutes les RLS policies basées sur client_token_value() (headers) échouent.
--
-- Solution:
--   1) RPCs SECURITY DEFINER pour les données token-scoped (reservation, infos)
--   2) Policies anon READ simple pour les tables de contenu public (FAQ, activités...)
--   3) RPCs pour les écritures (demandes_horaires, checklist_progress, retours)
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

-- Fonction : récupérer les infos gîte par token client
CREATE OR REPLACE FUNCTION public.get_gite_info_by_client_token(p_token text)
RETURNS SETOF public.infos_gites
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT ig.*
    FROM public.infos_gites ig
    INNER JOIN public.reservations r ON lower(ig.gite) = lower(r.gite)
    INNER JOIN public.client_access_tokens cat ON cat.reservation_id = r.id
    WHERE cat.token = p_token
      AND cat.is_active = true
      AND cat.expires_at > now()
    LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_gite_info_by_client_token(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_gite_info_by_client_token(text) TO anon, authenticated;

-- ==============================================================================
-- RPCs WRITE : Écritures sécurisées via token (pas de header)
-- ==============================================================================

-- Insérer ou mettre à jour une demande d'horaire
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
        -- Mettre à jour
        UPDATE public.demandes_horaires
        SET heure_demandee = p_heure,
            motif = p_motif,
            updated_at = now()
        WHERE id = v_existing_id;
        RETURN v_existing_id;
    ELSE
        -- Insérer
        INSERT INTO public.demandes_horaires (
            owner_user_id, reservation_id, type, heure_demandee, motif, statut
        ) VALUES (
            v_owner_user_id, v_reservation_id, p_type, p_heure, p_motif, 'en_attente'
        )
        RETURNING id INTO v_result_id;
        RETURN v_result_id;
    END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.upsert_demande_horaire_by_token(text,text,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.upsert_demande_horaire_by_token(text,text,text,text) TO anon, authenticated;

-- Insérer ou mettre à jour la progression d'une checklist
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

    INSERT INTO public.checklist_progress (reservation_id, template_id, completed, completed_at)
    VALUES (v_reservation_id, p_template_id, p_completed, CASE WHEN p_completed THEN now() ELSE NULL END)
    ON CONFLICT (reservation_id, template_id)
    DO UPDATE SET
        completed    = EXCLUDED.completed,
        completed_at = EXCLUDED.completed_at,
        updated_at   = now();
END;
$$;

REVOKE ALL ON FUNCTION public.upsert_checklist_progress_by_token(text,uuid,boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.upsert_checklist_progress_by_token(text,uuid,boolean) TO anon, authenticated;

-- Insérer un retour client
CREATE OR REPLACE FUNCTION public.insert_retour_client_by_token(
    p_token       text,
    p_type        text,
    p_sujet       text,
    p_description text,
    p_urgence     text DEFAULT 'normale'
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

    INSERT INTO public.retours_clients (reservation_id, type, sujet, description, urgence)
    VALUES (v_reservation_id, p_type, p_sujet, p_description, p_urgence);
END;
$$;

REVOKE ALL ON FUNCTION public.insert_retour_client_by_token(text,text,text,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.insert_retour_client_by_token(text,text,text,text,text) TO anon, authenticated;

-- ==============================================================================
-- POLICIES ANON READ : Tables de contenu (non sensibles, visibles par les clients)
-- ==============================================================================
DO $$
DECLARE t text;
BEGIN
    -- Activer RLS sur toutes les tables concernées
    FOREACH t IN ARRAY ARRAY[
        'infos_gites', 'activites_gites', 'faq',
        'cleaning_schedule', 'checklist_templates', 'checklist_progress',
        'demandes_horaires', 'retours_clients'
    ]
    LOOP
        IF to_regclass('public.' || t) IS NOT NULL THEN
            EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
        END IF;
    END LOOP;
END $$;

-- infos_gites : données configurées par l'owner pour ses clients
DO $$ BEGIN
    IF to_regclass('public.infos_gites') IS NOT NULL THEN
        DROP POLICY IF EXISTS anon_read_infos_gites ON public.infos_gites;
        CREATE POLICY anon_read_infos_gites ON public.infos_gites FOR SELECT TO anon USING (true);
    END IF;
END $$;

-- activites_gites : activités visibles des clients
DO $$ BEGIN
    IF to_regclass('public.activites_gites') IS NOT NULL THEN
        DROP POLICY IF EXISTS anon_read_activites_gites ON public.activites_gites;
        CREATE POLICY anon_read_activites_gites ON public.activites_gites FOR SELECT TO anon USING (true);
    END IF;
END $$;

-- faq : FAQ visible des clients
DO $$ BEGIN
    IF to_regclass('public.faq') IS NOT NULL THEN
        DROP POLICY IF EXISTS anon_read_faq ON public.faq;
        CREATE POLICY anon_read_faq ON public.faq FOR SELECT TO anon USING (true);
    END IF;
END $$;

-- cleaning_schedule : planning ménage visible du client
DO $$ BEGIN
    IF to_regclass('public.cleaning_schedule') IS NOT NULL THEN
        DROP POLICY IF EXISTS anon_read_cleaning_schedule_client ON public.cleaning_schedule;
        CREATE POLICY anon_read_cleaning_schedule_client ON public.cleaning_schedule FOR SELECT TO anon USING (true);
    END IF;
END $$;

-- checklist_templates : templates visibles des clients
DO $$ BEGIN
    IF to_regclass('public.checklist_templates') IS NOT NULL THEN
        DROP POLICY IF EXISTS anon_read_checklist_templates ON public.checklist_templates;
        CREATE POLICY anon_read_checklist_templates ON public.checklist_templates FOR SELECT TO anon USING (true);
    END IF;
END $$;

-- checklist_progress : lecture par reservation_id
DO $$ BEGIN
    IF to_regclass('public.checklist_progress') IS NOT NULL THEN
        DROP POLICY IF EXISTS anon_read_checklist_progress ON public.checklist_progress;
        CREATE POLICY anon_read_checklist_progress ON public.checklist_progress FOR SELECT TO anon USING (true);
    END IF;
END $$;

-- demandes_horaires : lecture par reservation_id
DO $$ BEGIN
    IF to_regclass('public.demandes_horaires') IS NOT NULL THEN
        DROP POLICY IF EXISTS anon_read_demandes_horaires_client ON public.demandes_horaires;
        CREATE POLICY anon_read_demandes_horaires_client ON public.demandes_horaires FOR SELECT TO anon USING (true);
    END IF;
END $$;

-- Vérification
SELECT
    routine_name,
    routine_type,
    security_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('get_reservation_by_client_token', 'get_client_token_data', 'get_gite_info_by_client_token')
ORDER BY routine_name;
