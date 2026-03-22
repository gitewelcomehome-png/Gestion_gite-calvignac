-- ==================================================================================
-- RLS ALIGNMENT - FICHE CLIENT + FEMME DE MENAGE
-- Date: 07 mars 2026
-- Objectif:
--   1) Aligner les politiques tokenisees des pages fiche-client et femme-menage
--   2) Eviter les collisions de policies (noms distincts par usage)
--   3) Conserver un acces strict scope token (x-client-token / x-cleaner-token)
--
-- Usage: Supabase SQL Editor (nouveau projet)
-- ==================================================================================

BEGIN;

-- ------------------------------------------------------------------------------
-- PRE-REQ GLOBAL: cleaner_tokens (si absent sur nouveau projet)
-- ------------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.cleaner_tokens (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    token text UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
    owner_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    label text NOT NULL DEFAULT 'Femme de menage',
    type text NOT NULL DEFAULT 'cleaner' CHECK (type IN ('cleaner', 'company')),
    created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cleaner_tokens_token
    ON public.cleaner_tokens(token);

CREATE INDEX IF NOT EXISTS idx_cleaner_tokens_owner
    ON public.cleaner_tokens(owner_user_id, type);

ALTER TABLE public.cleaner_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS anon_read_cleaner_tokens ON public.cleaner_tokens;
CREATE POLICY anon_read_cleaner_tokens
ON public.cleaner_tokens
FOR SELECT TO anon
USING (true);

DROP POLICY IF EXISTS owner_manage_cleaner_tokens ON public.cleaner_tokens;
CREATE POLICY owner_manage_cleaner_tokens
ON public.cleaner_tokens
FOR ALL TO authenticated
USING (owner_user_id = auth.uid())
WITH CHECK (owner_user_id = auth.uid());

-- ------------------------------------------------------------------------------
-- 0) Helpers token (client + cleaner)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.client_token_value()
RETURNS text
LANGUAGE sql
STABLE
AS $$
    SELECT (NULLIF(current_setting('request.headers', true), '')::json->>'x-client-token');
$$;

CREATE OR REPLACE FUNCTION public.cleaner_token_value()
RETURNS text
LANGUAGE sql
STABLE
AS $$
    SELECT (NULLIF(current_setting('request.headers', true), '')::json->>'x-cleaner-token');
$$;

CREATE OR REPLACE FUNCTION public.client_token_owner_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
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
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
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
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT r.gite_id
    FROM public.reservations r
    WHERE r.id = public.client_token_reservation_id()
    LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.client_token_gite_name()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT r.gite
    FROM public.reservations r
    WHERE r.id = public.client_token_reservation_id()
    LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.cleaner_token_owner_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT ct.owner_user_id
    FROM public.cleaner_tokens ct
    WHERE ct.token = public.cleaner_token_value()
    LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.cleaner_token_owner_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cleaner_token_owner_id() TO anon, authenticated, service_role;

-- ------------------------------------------------------------------------------
-- 0-bis) Reparation data tokens client (post-migration)
--   - Reactiver les tokens existants non expires
--   - Creer un token pour chaque reservation qui n'en a pas
-- ------------------------------------------------------------------------------
DO $$
DECLARE
    reservation_owner_col text;
BEGIN
    IF to_regclass('public.client_access_tokens') IS NOT NULL THEN
        -- Rendre exploitables les tokens deja presents
        UPDATE public.client_access_tokens
        SET is_active = true,
            updated_at = now()
        WHERE COALESCE(is_active, false) = false
          AND expires_at > now();
    END IF;

    IF to_regclass('public.reservations') IS NOT NULL
       AND to_regclass('public.client_access_tokens') IS NOT NULL
    THEN
        IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema='public' AND table_name='reservations' AND column_name='owner_user_id'
        ) THEN
            reservation_owner_col := 'owner_user_id';
        ELSIF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema='public' AND table_name='reservations' AND column_name='owner_id'
        ) THEN
            reservation_owner_col := 'owner_id';
        END IF;

        IF reservation_owner_col IS NOT NULL THEN
            EXECUTE format($sql$
                INSERT INTO public.client_access_tokens (
                    owner_user_id,
                    reservation_id,
                    token,
                    expires_at,
                    is_active,
                    created_at,
                    updated_at
                )
                SELECT
                    r.%I,
                    r.id,
                    encode(gen_random_bytes(32), 'hex'),
                    now() + interval '180 days',
                    true,
                    now(),
                    now()
                FROM public.reservations r
                WHERE r.%I IS NOT NULL
                  AND NOT EXISTS (
                      SELECT 1
                      FROM public.client_access_tokens cat
                      WHERE cat.reservation_id = r.id
                  )
            $sql$, reservation_owner_col, reservation_owner_col);
        END IF;
    END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 1) RLS ON (tables utilisees par fiche-client / femme-menage)
-- ------------------------------------------------------------------------------
DO $$
DECLARE
    t text;
BEGIN
    FOREACH t IN ARRAY ARRAY[
        'client_access_tokens',
        'reservations',
        'demandes_horaires',
        'cleaning_schedule',
        'cleaner_tokens',
        'gites',
        'todos',
        'retours_menage',
        'linen_needs',
        'linen_stock_items'
    ]
    LOOP
        IF to_regclass('public.' || t) IS NOT NULL THEN
            EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
        END IF;
    END LOOP;
END $$;

-- ------------------------------------------------------------------------------
-- 2) Nettoyage de policies conflictuelles/generiques connues
-- ------------------------------------------------------------------------------
DO $$
DECLARE
    p record;
BEGIN
    FOR p IN
        SELECT *
        FROM (VALUES
            ('reservations', 'anon_read_reservations'),
            ('cleaning_schedule', 'anon_read_cleaning_schedule'),
            ('gites', 'anon_read_gites'),
            ('todos', 'anon_insert_todos'),
            ('retours_menage', 'anon_read_retours_menage'),
            ('retours_menage', 'anon_insert_retours_menage'),
            ('retours_menage', 'anon_delete_retours_menage'),
            ('linen_needs', 'anon_read_linen_needs'),
            ('linen_stock_items', 'anon_read_linen_stock_items'),
            ('linen_stock_items', 'anon_insert_linen_stock_items'),
            ('linen_stock_items', 'anon_update_linen_stock_items')
        ) AS v(table_name, policy_name)
    LOOP
        IF to_regclass('public.' || p.table_name) IS NOT NULL THEN
            EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', p.policy_name, p.table_name);
        END IF;
    END LOOP;
END $$;

-- ------------------------------------------------------------------------------
-- 3) Policies fiche-client (x-client-token)
-- ------------------------------------------------------------------------------
DO $$
BEGIN
    IF to_regclass('public.client_access_tokens') IS NOT NULL THEN
        DROP POLICY IF EXISTS gc_client_token_select_strict ON public.client_access_tokens;
        CREATE POLICY gc_client_token_select_strict
        ON public.client_access_tokens
        FOR SELECT TO anon
        USING (
            token = public.client_token_value()
            AND is_active = true
            AND expires_at > now()
        );

        DROP POLICY IF EXISTS gc_client_token_update_strict ON public.client_access_tokens;
        CREATE POLICY gc_client_token_update_strict
        ON public.client_access_tokens
        FOR UPDATE TO anon
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
    END IF;
END $$;

DO $$
BEGIN
    IF to_regclass('public.reservations') IS NOT NULL
       AND to_regclass('public.client_access_tokens') IS NOT NULL
       AND EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'reservations' AND column_name = 'owner_user_id'
       )
    THEN
        DROP POLICY IF EXISTS gc_client_reservations_read_strict ON public.reservations;
        CREATE POLICY gc_client_reservations_read_strict
        ON public.reservations
        FOR SELECT TO anon
        USING (
            id = public.client_token_reservation_id()
            AND owner_user_id = public.client_token_owner_id()
        );
    END IF;
END $$;

DO $$
BEGIN
    IF to_regclass('public.demandes_horaires') IS NOT NULL
       AND EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'demandes_horaires' AND column_name = 'reservation_id'
       )
    THEN
        DROP POLICY IF EXISTS gc_client_demandes_read_strict ON public.demandes_horaires;
        CREATE POLICY gc_client_demandes_read_strict
        ON public.demandes_horaires
        FOR SELECT TO anon
        USING (reservation_id = public.client_token_reservation_id());

        DROP POLICY IF EXISTS gc_client_demandes_insert_strict ON public.demandes_horaires;
        CREATE POLICY gc_client_demandes_insert_strict
        ON public.demandes_horaires
        FOR INSERT TO anon
        WITH CHECK (reservation_id = public.client_token_reservation_id());

        DROP POLICY IF EXISTS gc_client_demandes_update_strict ON public.demandes_horaires;
        CREATE POLICY gc_client_demandes_update_strict
        ON public.demandes_horaires
        FOR UPDATE TO anon
        USING (reservation_id = public.client_token_reservation_id())
        WITH CHECK (reservation_id = public.client_token_reservation_id());
    END IF;
END $$;

DO $$
DECLARE
    has_reservation_id boolean;
    has_gite_id boolean;
    has_gite_text boolean;
BEGIN
    IF to_regclass('public.cleaning_schedule') IS NOT NULL
       AND EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'cleaning_schedule' AND column_name = 'owner_user_id'
       )
    THEN
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'cleaning_schedule' AND column_name = 'reservation_id'
        ) INTO has_reservation_id;

        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'cleaning_schedule' AND column_name = 'gite_id'
        ) INTO has_gite_id;

        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'cleaning_schedule' AND column_name = 'gite'
        ) INTO has_gite_text;

        DROP POLICY IF EXISTS gc_client_cleaning_read_strict ON public.cleaning_schedule;

        IF has_reservation_id THEN
            CREATE POLICY gc_client_cleaning_read_strict
            ON public.cleaning_schedule
            FOR SELECT TO anon
            USING (
                owner_user_id = public.client_token_owner_id()
                AND reservation_id = public.client_token_reservation_id()
            );
        ELSIF has_gite_id THEN
            CREATE POLICY gc_client_cleaning_read_strict
            ON public.cleaning_schedule
            FOR SELECT TO anon
            USING (
                owner_user_id = public.client_token_owner_id()
                AND gite_id = public.client_token_gite_id()
            );
        ELSIF has_gite_text THEN
            CREATE POLICY gc_client_cleaning_read_strict
            ON public.cleaning_schedule
            FOR SELECT TO anon
            USING (
                owner_user_id = public.client_token_owner_id()
                AND lower(gite) = lower(public.client_token_gite_name())
            );
        ELSE
            CREATE POLICY gc_client_cleaning_read_strict
            ON public.cleaning_schedule
            FOR SELECT TO anon
            USING (owner_user_id = public.client_token_owner_id());
        END IF;
    END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 4) Policies femme-menage (x-cleaner-token)
-- ------------------------------------------------------------------------------
DO $$
DECLARE
    gite_owner_col text;
BEGIN
    IF to_regclass('public.gites') IS NOT NULL THEN
        IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema='public' AND table_name='gites' AND column_name='owner_user_id'
        ) THEN
            gite_owner_col := 'owner_user_id';
        ELSIF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema='public' AND table_name='gites' AND column_name='owner_id'
        ) THEN
            gite_owner_col := 'owner_id';
        END IF;

        IF gite_owner_col IS NOT NULL THEN
            DROP POLICY IF EXISTS gc_cleaner_gites_read_token ON public.gites;
            EXECUTE format(
                'CREATE POLICY gc_cleaner_gites_read_token ON public.gites FOR SELECT TO anon USING (%I = public.cleaner_token_owner_id())',
                gite_owner_col
            );
        END IF;
    END IF;
END $$;

DO $$
DECLARE
    reservation_owner_col text;
BEGIN
    IF to_regclass('public.reservations') IS NOT NULL THEN
        IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema='public' AND table_name='reservations' AND column_name='owner_user_id'
        ) THEN
            reservation_owner_col := 'owner_user_id';
        ELSIF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema='public' AND table_name='reservations' AND column_name='owner_id'
        ) THEN
            reservation_owner_col := 'owner_id';
        END IF;

        IF reservation_owner_col IS NOT NULL THEN
            DROP POLICY IF EXISTS gc_cleaner_reservations_read_token ON public.reservations;
            EXECUTE format(
                'CREATE POLICY gc_cleaner_reservations_read_token ON public.reservations FOR SELECT TO anon USING (%I = public.cleaner_token_owner_id())',
                reservation_owner_col
            );
        END IF;
    END IF;
END $$;

DO $$
BEGIN
    IF to_regclass('public.cleaning_schedule') IS NOT NULL
       AND EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema='public' AND table_name='cleaning_schedule' AND column_name='owner_user_id'
       )
    THEN
        DROP POLICY IF EXISTS gc_cleaner_cleaning_read_token ON public.cleaning_schedule;
        CREATE POLICY gc_cleaner_cleaning_read_token
        ON public.cleaning_schedule
        FOR SELECT TO anon
        USING (owner_user_id = public.cleaner_token_owner_id());

        DROP POLICY IF EXISTS gc_cleaner_cleaning_insert_token ON public.cleaning_schedule;
        CREATE POLICY gc_cleaner_cleaning_insert_token
        ON public.cleaning_schedule
        FOR INSERT TO anon
        WITH CHECK (owner_user_id = public.cleaner_token_owner_id());

        DROP POLICY IF EXISTS gc_cleaner_cleaning_update_token ON public.cleaning_schedule;
        CREATE POLICY gc_cleaner_cleaning_update_token
        ON public.cleaning_schedule
        FOR UPDATE TO anon
        USING (owner_user_id = public.cleaner_token_owner_id())
        WITH CHECK (owner_user_id = public.cleaner_token_owner_id());
    END IF;
END $$;

DO $$
BEGIN
    IF to_regclass('public.todos') IS NOT NULL
       AND EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema='public' AND table_name='todos' AND column_name='owner_user_id'
       )
    THEN
        DROP POLICY IF EXISTS gc_cleaner_todos_insert_token ON public.todos;
        CREATE POLICY gc_cleaner_todos_insert_token
        ON public.todos
        FOR INSERT TO anon
        WITH CHECK (owner_user_id = public.cleaner_token_owner_id());
    END IF;
END $$;

DO $$
BEGIN
    IF to_regclass('public.retours_menage') IS NOT NULL
       AND EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema='public' AND table_name='retours_menage' AND column_name='owner_user_id'
       )
    THEN
        DROP POLICY IF EXISTS gc_cleaner_retours_read_token ON public.retours_menage;
        CREATE POLICY gc_cleaner_retours_read_token
        ON public.retours_menage
        FOR SELECT TO anon
        USING (owner_user_id = public.cleaner_token_owner_id());

        DROP POLICY IF EXISTS gc_cleaner_retours_insert_token ON public.retours_menage;
        CREATE POLICY gc_cleaner_retours_insert_token
        ON public.retours_menage
        FOR INSERT TO anon
        WITH CHECK (owner_user_id = public.cleaner_token_owner_id());

        DROP POLICY IF EXISTS gc_cleaner_retours_delete_token ON public.retours_menage;
        CREATE POLICY gc_cleaner_retours_delete_token
        ON public.retours_menage
        FOR DELETE TO anon
        USING (owner_user_id = public.cleaner_token_owner_id());
    END IF;
END $$;

DO $$
BEGIN
    IF to_regclass('public.linen_needs') IS NOT NULL
       AND EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema='public' AND table_name='linen_needs' AND column_name='owner_user_id'
       )
    THEN
        DROP POLICY IF EXISTS gc_cleaner_linen_needs_read_token ON public.linen_needs;
        CREATE POLICY gc_cleaner_linen_needs_read_token
        ON public.linen_needs
        FOR SELECT TO anon
        USING (owner_user_id = public.cleaner_token_owner_id());
    END IF;
END $$;

DO $$
BEGIN
    IF to_regclass('public.linen_stock_items') IS NOT NULL
       AND EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema='public' AND table_name='linen_stock_items' AND column_name='owner_user_id'
       )
    THEN
        DROP POLICY IF EXISTS gc_cleaner_linen_stock_read_token ON public.linen_stock_items;
        CREATE POLICY gc_cleaner_linen_stock_read_token
        ON public.linen_stock_items
        FOR SELECT TO anon
        USING (owner_user_id = public.cleaner_token_owner_id());

        DROP POLICY IF EXISTS gc_cleaner_linen_stock_insert_token ON public.linen_stock_items;
        CREATE POLICY gc_cleaner_linen_stock_insert_token
        ON public.linen_stock_items
        FOR INSERT TO anon
        WITH CHECK (owner_user_id = public.cleaner_token_owner_id());

        DROP POLICY IF EXISTS gc_cleaner_linen_stock_update_token ON public.linen_stock_items;
        CREATE POLICY gc_cleaner_linen_stock_update_token
        ON public.linen_stock_items
        FOR UPDATE TO anon
        USING (owner_user_id = public.cleaner_token_owner_id())
        WITH CHECK (owner_user_id = public.cleaner_token_owner_id());
    END IF;
END $$;

COMMIT;

-- ------------------------------------------------------------------------------
-- Post-check policies cibles
-- ------------------------------------------------------------------------------
SELECT tablename, policyname, roles, cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
      'client_access_tokens',
      'reservations',
      'demandes_horaires',
      'cleaning_schedule',
      'gites',
      'todos',
      'retours_menage',
      'linen_needs',
      'linen_stock_items'
  )
  AND (
      policyname LIKE 'gc_client_%'
      OR policyname LIKE 'gc_cleaner_%'
  )
ORDER BY tablename, policyname;
