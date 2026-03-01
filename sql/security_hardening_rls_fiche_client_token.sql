-- ==================================================================================
-- HARDENING RLS PROD : fiche-client via header x-client-token
-- Objectif : supprimer les accès anon permissifs (USING true) et limiter au token URL
-- Exécution : Supabase SQL Editor (en prod après validation)
-- ==================================================================================

BEGIN;

-- ------------------------------------------------------------------------------
-- Helpers token fiche-client
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.client_token_value()
RETURNS TEXT
LANGUAGE sql
STABLE
AS $$
    SELECT (NULLIF(current_setting('request.headers', true), '')::json->>'x-client-token');
$$;

CREATE OR REPLACE FUNCTION public.client_token_owner_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT cat.owner_user_id
    FROM public.client_access_tokens cat
    WHERE cat.token = public.client_token_value()
      AND cat.is_active = true
      AND cat.expires_at > now()
    ORDER BY cat.created_at DESC
    LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.client_token_reservation_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT cat.reservation_id
    FROM public.client_access_tokens cat
    WHERE cat.token = public.client_token_value()
      AND cat.is_active = true
      AND cat.expires_at > now()
    ORDER BY cat.created_at DESC
    LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.client_token_gite_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT r.gite_id
    FROM public.reservations r
    WHERE r.id = public.client_token_reservation_id()
    LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.client_token_gite_name()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT r.gite
    FROM public.reservations r
    WHERE r.id = public.client_token_reservation_id()
    LIMIT 1;
$$;

-- ------------------------------------------------------------------------------
-- Nettoyage policies anon permissives connues (sans casser si table absente)
-- ------------------------------------------------------------------------------
DO $$
DECLARE
    item RECORD;
BEGIN
    FOR item IN
        SELECT * FROM (VALUES
            ('client_access_tokens', 'anon_access_via_valid_token'),
            ('client_access_tokens', 'anon_update_access_count'),
            ('reservations', 'anon_read_reservations'),
            ('infos_gites', 'anon_read_infos_gites'),
            ('demandes_horaires', 'anon_read_demandes_horaires'),
            ('demandes_horaires', 'anon_insert_demandes_horaires'),
            ('demandes_horaires', 'anon_update_demandes_horaires'),
            ('cleaning_schedule', 'anon_read_cleaning_schedule'),
            ('activites_gites', 'anon_read_activites_gites'),
            ('activites_consultations', 'anon_insert_activites_consultations'),
            ('retours_clients', 'anon_insert_retours_clients'),
            ('faq', 'anon_read_faq'),
            ('checklist_templates', 'anon_read_checklist_templates'),
            ('checklist_progress', 'anon_read_checklist_progress'),
            ('checklist_progress', 'anon_insert_checklist_progress'),
            ('checklist_progress', 'anon_update_checklist_progress')
        ) AS t(table_name, policy_name)
    LOOP
        IF to_regclass('public.' || item.table_name) IS NOT NULL THEN
            EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', item.policy_name, item.table_name);
        END IF;
    END LOOP;
END $$;

-- ------------------------------------------------------------------------------
-- client_access_tokens (validation + MAJ usage)
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "anon_client_token_select_strict" ON public.client_access_tokens;
CREATE POLICY "anon_client_token_select_strict"
ON public.client_access_tokens FOR SELECT TO anon
USING (
    token = public.client_token_value()
    AND is_active = true
    AND expires_at > now()
);

DROP POLICY IF EXISTS "anon_client_token_update_strict" ON public.client_access_tokens;
CREATE POLICY "anon_client_token_update_strict"
ON public.client_access_tokens FOR UPDATE TO anon
USING (
    token = public.client_token_value()
    AND is_active = true
    AND expires_at > now()
)
WITH CHECK (
    token = public.client_token_value()
    AND is_active = true
    AND expires_at > now()
);

-- ------------------------------------------------------------------------------
-- reservations (lecture strictement sur la réservation du token)
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "anon_client_reservation_read_strict" ON public.reservations;
CREATE POLICY "anon_client_reservation_read_strict"
ON public.reservations FOR SELECT TO anon
USING (
    id = public.client_token_reservation_id()
    AND owner_user_id = public.client_token_owner_id()
);

-- ------------------------------------------------------------------------------
-- Tables owner-scoped : infos_gites / activites_gites / faq / cleaning_schedule / checklist_templates
-- ------------------------------------------------------------------------------
DO $$
DECLARE
    has_gite_id BOOLEAN;
    has_gite_text BOOLEAN;
    has_reservation_id BOOLEAN;
BEGIN
    IF to_regclass('public.infos_gites') IS NOT NULL THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='infos_gites' AND column_name='owner_user_id') THEN
            SELECT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_schema='public' AND table_name='infos_gites' AND column_name='gite_id'
            ) INTO has_gite_id;

            SELECT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_schema='public' AND table_name='infos_gites' AND column_name='gite'
            ) INTO has_gite_text;

            DROP POLICY IF EXISTS "anon_client_infos_gites_read_strict" ON public.infos_gites;

            IF has_gite_id THEN
                EXECUTE 'CREATE POLICY "anon_client_infos_gites_read_strict" ON public.infos_gites FOR SELECT TO anon USING (owner_user_id = public.client_token_owner_id() AND gite_id = public.client_token_gite_id())';
            ELSIF has_gite_text THEN
                EXECUTE 'CREATE POLICY "anon_client_infos_gites_read_strict" ON public.infos_gites FOR SELECT TO anon USING (owner_user_id = public.client_token_owner_id() AND lower(gite) = lower(public.client_token_gite_name()))';
            ELSE
                EXECUTE 'CREATE POLICY "anon_client_infos_gites_read_strict" ON public.infos_gites FOR SELECT TO anon USING (owner_user_id = public.client_token_owner_id())';
            END IF;
        END IF;
    END IF;

    IF to_regclass('public.activites_gites') IS NOT NULL THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='activites_gites' AND column_name='owner_user_id') THEN
            SELECT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_schema='public' AND table_name='activites_gites' AND column_name='gite_id'
            ) INTO has_gite_id;

            DROP POLICY IF EXISTS "anon_client_activites_read_strict" ON public.activites_gites;

            IF has_gite_id THEN
                EXECUTE 'CREATE POLICY "anon_client_activites_read_strict" ON public.activites_gites FOR SELECT TO anon USING (owner_user_id = public.client_token_owner_id() AND gite_id = public.client_token_gite_id())';
            ELSE
                EXECUTE 'CREATE POLICY "anon_client_activites_read_strict" ON public.activites_gites FOR SELECT TO anon USING (owner_user_id = public.client_token_owner_id())';
            END IF;
        END IF;
    END IF;

    IF to_regclass('public.faq') IS NOT NULL THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='faq' AND column_name='owner_user_id') THEN
            SELECT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_schema='public' AND table_name='faq' AND column_name='gite_id'
            ) INTO has_gite_id;

            DROP POLICY IF EXISTS "anon_client_faq_read_strict" ON public.faq;

            IF has_gite_id THEN
                EXECUTE 'CREATE POLICY "anon_client_faq_read_strict" ON public.faq FOR SELECT TO anon USING (owner_user_id = public.client_token_owner_id() AND (gite_id IS NULL OR gite_id = public.client_token_gite_id()))';
            ELSE
                EXECUTE 'CREATE POLICY "anon_client_faq_read_strict" ON public.faq FOR SELECT TO anon USING (owner_user_id = public.client_token_owner_id())';
            END IF;
        END IF;
    END IF;

    IF to_regclass('public.cleaning_schedule') IS NOT NULL THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='cleaning_schedule' AND column_name='owner_user_id') THEN
            SELECT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_schema='public' AND table_name='cleaning_schedule' AND column_name='reservation_id'
            ) INTO has_reservation_id;

            SELECT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_schema='public' AND table_name='cleaning_schedule' AND column_name='gite_id'
            ) INTO has_gite_id;

            SELECT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_schema='public' AND table_name='cleaning_schedule' AND column_name='gite'
            ) INTO has_gite_text;

            DROP POLICY IF EXISTS "anon_client_cleaning_read_strict" ON public.cleaning_schedule;

            IF has_reservation_id THEN
                EXECUTE 'CREATE POLICY "anon_client_cleaning_read_strict" ON public.cleaning_schedule FOR SELECT TO anon USING (owner_user_id = public.client_token_owner_id() AND reservation_id = public.client_token_reservation_id())';
            ELSIF has_gite_id THEN
                EXECUTE 'CREATE POLICY "anon_client_cleaning_read_strict" ON public.cleaning_schedule FOR SELECT TO anon USING (owner_user_id = public.client_token_owner_id() AND gite_id = public.client_token_gite_id())';
            ELSIF has_gite_text THEN
                EXECUTE 'CREATE POLICY "anon_client_cleaning_read_strict" ON public.cleaning_schedule FOR SELECT TO anon USING (owner_user_id = public.client_token_owner_id() AND lower(gite) = lower(public.client_token_gite_name()))';
            ELSE
                EXECUTE 'CREATE POLICY "anon_client_cleaning_read_strict" ON public.cleaning_schedule FOR SELECT TO anon USING (owner_user_id = public.client_token_owner_id())';
            END IF;
        END IF;
    END IF;

    IF to_regclass('public.checklist_templates') IS NOT NULL THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='checklist_templates' AND column_name='owner_user_id') THEN
            SELECT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_schema='public' AND table_name='checklist_templates' AND column_name='gite_id'
            ) INTO has_gite_id;

            DROP POLICY IF EXISTS "anon_client_templates_read_strict" ON public.checklist_templates;

            IF has_gite_id THEN
                EXECUTE 'CREATE POLICY "anon_client_templates_read_strict" ON public.checklist_templates FOR SELECT TO anon USING (owner_user_id = public.client_token_owner_id() AND gite_id = public.client_token_gite_id())';
            ELSE
                EXECUTE 'CREATE POLICY "anon_client_templates_read_strict" ON public.checklist_templates FOR SELECT TO anon USING (owner_user_id = public.client_token_owner_id())';
            END IF;
        END IF;
    END IF;
END $$;

-- ------------------------------------------------------------------------------
-- Tables reservation-scoped : demandes_horaires / checklist_progress / retours / évaluations / problèmes
-- ------------------------------------------------------------------------------
DO $$
DECLARE
    t TEXT;
BEGIN
    FOREACH t IN ARRAY ARRAY[
        'demandes_horaires',
        'checklist_progress',
        'retours_clients',
        'problemes_signales',
        'evaluations_sejour',
        'activites_consultations'
    ]
    LOOP
        IF to_regclass('public.' || t) IS NULL THEN
            CONTINUE;
        END IF;

        IF EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema='public' AND table_name=t AND column_name='reservation_id'
        ) THEN
            EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'anon_client_' || t || '_read_strict', t);
            EXECUTE format(
                'CREATE POLICY %I ON public.%I FOR SELECT TO anon USING (reservation_id = public.client_token_reservation_id())',
                'anon_client_' || t || '_read_strict',
                t
            );

            EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'anon_client_' || t || '_insert_strict', t);
            EXECUTE format(
                'CREATE POLICY %I ON public.%I FOR INSERT TO anon WITH CHECK (reservation_id = public.client_token_reservation_id())',
                'anon_client_' || t || '_insert_strict',
                t
            );

            IF t IN ('demandes_horaires', 'checklist_progress') THEN
                EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'anon_client_' || t || '_update_strict', t);
                EXECUTE format(
                    'CREATE POLICY %I ON public.%I FOR UPDATE TO anon USING (reservation_id = public.client_token_reservation_id()) WITH CHECK (reservation_id = public.client_token_reservation_id())',
                    'anon_client_' || t || '_update_strict',
                    t
                );
            END IF;
        END IF;
    END LOOP;
END $$;

COMMIT;

SELECT '✅ Hardening RLS fiche-client prêt (scope par x-client-token)' AS status;
