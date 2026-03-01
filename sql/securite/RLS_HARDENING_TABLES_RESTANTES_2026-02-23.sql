-- ==================================================================================
-- RLS HARDENING - TABLES RESTANTES (SAFE & DYNAMIQUE)
-- Date: 23 février 2026
-- Objectif: passer les tables métier restantes en RLS sans casser les flux actifs
-- ==================================================================================

-- IMPORTANT:
-- - Script structurel (ALTER TABLE / CREATE POLICY)
-- - À exécuter dans Supabase SQL Editor
-- - Conçu pour environnement hétérogène (colonnes variables selon migrations)

-- ------------------------------------------------------------------------------
-- 0) Helper admin (sans hardcoding email)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.gc_is_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    has_is_active boolean;
    is_admin boolean := false;
BEGIN
    IF auth.uid() IS NULL OR COALESCE(auth.role(), 'anon') = 'anon' THEN
        RETURN false;
    END IF;

    SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'user_roles'
          AND column_name = 'is_active'
    ) INTO has_is_active;

    IF has_is_active THEN
        EXECUTE '
            SELECT EXISTS (
                SELECT 1
                FROM public.user_roles ur
                WHERE ur.user_id = auth.uid()
                  AND ur.is_active = true
                  AND ur.role IN (''admin'', ''super_admin'')
            )
        ' INTO is_admin;
    ELSE
        EXECUTE '
            SELECT EXISTS (
                SELECT 1
                FROM public.user_roles ur
                WHERE ur.user_id = auth.uid()
                  AND ur.role IN (''admin'', ''super_admin'')
            )
        ' INTO is_admin;
    END IF;

    RETURN COALESCE(is_admin, false);
END;
$$;

REVOKE ALL ON FUNCTION public.gc_is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.gc_is_admin() TO authenticated;

-- ------------------------------------------------------------------------------
-- 1) Activer RLS sur les tables ciblées
-- ------------------------------------------------------------------------------
ALTER TABLE IF EXISTS public._cleanup_dropped_tables_20260223 ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.cleaning_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.cm_content_generated ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.cm_error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.cm_support_ticket_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.commandes_prestations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.lignes_commande_prestations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.prestations_catalogue ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.problemes_signales ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.system_config ENABLE ROW LEVEL SECURITY;

ALTER TABLE IF EXISTS public._cleanup_dropped_tables_20260223 FORCE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.cleaning_rules FORCE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.cm_content_generated FORCE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.cm_error_logs FORCE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.cm_support_ticket_history FORCE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.commandes_prestations FORCE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.lignes_commande_prestations FORCE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.prestations_catalogue FORCE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.problemes_signales FORCE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.system_config FORCE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 2) Nettoyer policies existantes sur ce périmètre
-- ------------------------------------------------------------------------------
DO $$
DECLARE
    p record;
BEGIN
    FOR p IN
        SELECT schemaname, tablename, policyname
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename IN (
            '_cleanup_dropped_tables_20260223',
            'cleaning_rules',
            'cm_content_generated',
            'cm_error_logs',
            'cm_support_ticket_history',
            'commandes_prestations',
            'lignes_commande_prestations',
            'prestations_catalogue',
            'problemes_signales',
            'system_config'
          )
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I;', p.policyname, p.tablename);
    END LOOP;
END $$;

-- ------------------------------------------------------------------------------
-- 3) Policies admin-only (tables techniques / backoffice)
-- ------------------------------------------------------------------------------
DO $$
DECLARE
    t text;
BEGIN
    FOREACH t IN ARRAY ARRAY[
        '_cleanup_dropped_tables_20260223',
        'cm_content_generated',
        'cm_error_logs',
        'cm_support_ticket_history',
        'system_config'
    ]
    LOOP
        IF to_regclass('public.' || t) IS NOT NULL THEN
            EXECUTE format(
                'CREATE POLICY %I ON public.%I FOR ALL TO authenticated USING (public.gc_is_admin()) WITH CHECK (public.gc_is_admin());',
                'gc_admin_full_' || t,
                t
            );
        END IF;
    END LOOP;
END $$;

-- ------------------------------------------------------------------------------
-- 4) cleaning_rules (owner + admin)
-- ------------------------------------------------------------------------------
DO $$
BEGIN
    IF to_regclass('public.cleaning_rules') IS NOT NULL THEN
        IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'cleaning_rules' AND column_name = 'owner_user_id'
        ) THEN
            EXECUTE 'CREATE POLICY gc_owner_cleaning_rules ON public.cleaning_rules FOR ALL TO authenticated USING (owner_user_id = auth.uid() OR public.gc_is_admin()) WITH CHECK (owner_user_id = auth.uid() OR public.gc_is_admin())';
        ELSE
            EXECUTE 'CREATE POLICY gc_admin_cleaning_rules_only ON public.cleaning_rules FOR ALL TO authenticated USING (public.gc_is_admin()) WITH CHECK (public.gc_is_admin())';
        END IF;
    END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 5) prestations_catalogue (fiche-client anon + owner/admin)
-- ------------------------------------------------------------------------------
DO $$
DECLARE
    g_owner_col text;
BEGIN
    IF to_regclass('public.prestations_catalogue') IS NOT NULL THEN
        IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema='public' AND table_name='gites' AND column_name='owner_id'
        ) THEN
            g_owner_col := 'owner_id';
        ELSIF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema='public' AND table_name='gites' AND column_name='owner_user_id'
        ) THEN
            g_owner_col := 'owner_user_id';
        ELSE
            g_owner_col := NULL;
        END IF;

        IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema='public' AND table_name='prestations_catalogue' AND column_name='gite_id'
        ) THEN
            EXECUTE 'CREATE POLICY gc_anon_read_prestations_token ON public.prestations_catalogue AS RESTRICTIVE FOR SELECT TO anon USING (public.client_token_gite_id() IS NOT NULL AND is_active = true AND gite_id = public.client_token_gite_id())';

            IF g_owner_col IS NOT NULL THEN
                EXECUTE format(
                    'CREATE POLICY gc_owner_manage_prestations ON public.prestations_catalogue FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.gites g WHERE g.id = prestations_catalogue.gite_id AND (g.%I = auth.uid() OR public.gc_is_admin()))) WITH CHECK (EXISTS (SELECT 1 FROM public.gites g WHERE g.id = prestations_catalogue.gite_id AND (g.%I = auth.uid() OR public.gc_is_admin())))',
                    g_owner_col,
                    g_owner_col
                );
            ELSE
                EXECUTE 'CREATE POLICY gc_admin_manage_prestations_only ON public.prestations_catalogue FOR ALL TO authenticated USING (public.gc_is_admin()) WITH CHECK (public.gc_is_admin())';
            END IF;
        ELSE
            EXECUTE 'CREATE POLICY gc_admin_manage_prestations_fallback ON public.prestations_catalogue FOR ALL TO authenticated USING (public.gc_is_admin()) WITH CHECK (public.gc_is_admin())';
        END IF;
    END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 6) commandes_prestations (fiche-client anon + owner/admin)
-- ------------------------------------------------------------------------------
DO $$
DECLARE
    g_owner_col text;
BEGIN
    IF to_regclass('public.commandes_prestations') IS NOT NULL THEN
        IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema='public' AND table_name='gites' AND column_name='owner_id'
        ) THEN
            g_owner_col := 'owner_id';
        ELSIF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema='public' AND table_name='gites' AND column_name='owner_user_id'
        ) THEN
            g_owner_col := 'owner_user_id';
        ELSE
            g_owner_col := NULL;
        END IF;

        IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema='public' AND table_name='commandes_prestations' AND column_name='reservation_id'
        ) THEN
            EXECUTE 'CREATE POLICY gc_anon_read_commandes_token ON public.commandes_prestations AS RESTRICTIVE FOR SELECT TO anon USING (public.client_token_reservation_id() IS NOT NULL AND reservation_id = public.client_token_reservation_id())';
            EXECUTE 'CREATE POLICY gc_anon_insert_commandes_token ON public.commandes_prestations AS RESTRICTIVE FOR INSERT TO anon WITH CHECK (public.client_token_reservation_id() IS NOT NULL AND reservation_id = public.client_token_reservation_id())';
        END IF;

        IF g_owner_col IS NOT NULL
           AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='commandes_prestations' AND column_name='gite_id') THEN
            EXECUTE format(
                'CREATE POLICY gc_owner_manage_commandes ON public.commandes_prestations FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.gites g WHERE g.id = commandes_prestations.gite_id AND (g.%I = auth.uid() OR public.gc_is_admin()))) WITH CHECK (EXISTS (SELECT 1 FROM public.gites g WHERE g.id = commandes_prestations.gite_id AND (g.%I = auth.uid() OR public.gc_is_admin())))',
                g_owner_col,
                g_owner_col
            );
        ELSE
            EXECUTE 'CREATE POLICY gc_admin_manage_commandes_only ON public.commandes_prestations FOR ALL TO authenticated USING (public.gc_is_admin()) WITH CHECK (public.gc_is_admin())';
        END IF;
    END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 7) lignes_commande_prestations (fiche-client anon + owner/admin)
-- ------------------------------------------------------------------------------
DO $$
DECLARE
    g_owner_col text;
BEGIN
    IF to_regclass('public.lignes_commande_prestations') IS NOT NULL THEN
        IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema='public' AND table_name='gites' AND column_name='owner_id'
        ) THEN
            g_owner_col := 'owner_id';
        ELSIF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema='public' AND table_name='gites' AND column_name='owner_user_id'
        ) THEN
            g_owner_col := 'owner_user_id';
        ELSE
            g_owner_col := NULL;
        END IF;

        IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema='public' AND table_name='lignes_commande_prestations' AND column_name='commande_id'
        ) THEN
            EXECUTE 'CREATE POLICY gc_anon_read_lignes_token ON public.lignes_commande_prestations AS RESTRICTIVE FOR SELECT TO anon USING (public.client_token_reservation_id() IS NOT NULL AND EXISTS (SELECT 1 FROM public.commandes_prestations c WHERE c.id = lignes_commande_prestations.commande_id AND c.reservation_id = public.client_token_reservation_id()))';
            EXECUTE 'CREATE POLICY gc_anon_insert_lignes_token ON public.lignes_commande_prestations AS RESTRICTIVE FOR INSERT TO anon WITH CHECK (public.client_token_reservation_id() IS NOT NULL AND EXISTS (SELECT 1 FROM public.commandes_prestations c WHERE c.id = lignes_commande_prestations.commande_id AND c.reservation_id = public.client_token_reservation_id()))';
        END IF;

        IF g_owner_col IS NOT NULL THEN
            EXECUTE format(
                'CREATE POLICY gc_owner_manage_lignes ON public.lignes_commande_prestations FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.commandes_prestations c JOIN public.gites g ON g.id = c.gite_id WHERE c.id = lignes_commande_prestations.commande_id AND (g.%I = auth.uid() OR public.gc_is_admin()))) WITH CHECK (EXISTS (SELECT 1 FROM public.commandes_prestations c JOIN public.gites g ON g.id = c.gite_id WHERE c.id = lignes_commande_prestations.commande_id AND (g.%I = auth.uid() OR public.gc_is_admin())))',
                g_owner_col,
                g_owner_col
            );
        ELSE
            EXECUTE 'CREATE POLICY gc_admin_manage_lignes_only ON public.lignes_commande_prestations FOR ALL TO authenticated USING (public.gc_is_admin()) WITH CHECK (public.gc_is_admin())';
        END IF;
    END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 8) problemes_signales (fiche-client anon + owner/admin, version tolérante)
-- ------------------------------------------------------------------------------
DO $$
DECLARE
    has_owner_user_id boolean;
    has_reservation_id boolean;
BEGIN
    IF to_regclass('public.problemes_signales') IS NOT NULL THEN
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema='public' AND table_name='problemes_signales' AND column_name='owner_user_id'
        ) INTO has_owner_user_id;

        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema='public' AND table_name='problemes_signales' AND column_name='reservation_id'
        ) INTO has_reservation_id;

        IF has_reservation_id THEN
            EXECUTE 'CREATE POLICY gc_anon_insert_problemes_token ON public.problemes_signales AS RESTRICTIVE FOR INSERT TO anon WITH CHECK (public.client_token_reservation_id() IS NOT NULL AND reservation_id = public.client_token_reservation_id())';
            EXECUTE 'CREATE POLICY gc_anon_read_problemes_token ON public.problemes_signales AS RESTRICTIVE FOR SELECT TO anon USING (public.client_token_reservation_id() IS NOT NULL AND reservation_id = public.client_token_reservation_id())';
        END IF;

        IF has_owner_user_id THEN
            EXECUTE 'CREATE POLICY gc_owner_manage_problemes_owner_col ON public.problemes_signales FOR ALL TO authenticated USING (owner_user_id = auth.uid() OR public.gc_is_admin()) WITH CHECK (owner_user_id = auth.uid() OR public.gc_is_admin())';
        ELSIF has_reservation_id THEN
            EXECUTE 'CREATE POLICY gc_owner_manage_problemes_reservation_col ON public.problemes_signales FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.reservations r WHERE r.id = problemes_signales.reservation_id AND (COALESCE(r.owner_id::text, '''') = auth.uid()::text OR public.gc_is_admin()))) WITH CHECK (EXISTS (SELECT 1 FROM public.reservations r WHERE r.id = problemes_signales.reservation_id AND (COALESCE(r.owner_id::text, '''') = auth.uid()::text OR public.gc_is_admin())))';
        ELSE
            EXECUTE 'CREATE POLICY gc_admin_manage_problemes_only ON public.problemes_signales FOR ALL TO authenticated USING (public.gc_is_admin()) WITH CHECK (public.gc_is_admin())';
        END IF;
    END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 9) Post-check
-- ------------------------------------------------------------------------------
SELECT
  c.relname AS table_name,
  c.relrowsecurity AS rls_enabled,
  c.relforcerowsecurity AS rls_forced,
  COALESCE(p.policy_count, 0) AS policy_count
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
LEFT JOIN (
    SELECT schemaname, tablename, COUNT(*) AS policy_count
    FROM pg_policies
    WHERE schemaname = 'public'
    GROUP BY schemaname, tablename
) p ON p.schemaname = n.nspname AND p.tablename = c.relname
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
  AND c.relname IN (
    '_cleanup_dropped_tables_20260223',
    'cleaning_rules',
    'cm_content_generated',
    'cm_error_logs',
    'cm_support_ticket_history',
    'commandes_prestations',
    'lignes_commande_prestations',
    'prestations_catalogue',
    'problemes_signales',
    'system_config'
  )
ORDER BY c.relname;

-- Contrôle strict: tables du lot encore sans FORCE RLS (cible: 0 ligne)
SELECT
    c.relname AS table_name,
    c.relrowsecurity AS rls_enabled,
    c.relforcerowsecurity AS rls_forced
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
    AND c.relkind = 'r'
    AND c.relname IN (
        '_cleanup_dropped_tables_20260223',
        'cleaning_rules',
        'cm_content_generated',
        'cm_error_logs',
        'cm_support_ticket_history',
        'commandes_prestations',
        'lignes_commande_prestations',
        'prestations_catalogue',
        'problemes_signales',
        'system_config'
    )
    AND c.relforcerowsecurity = false
ORDER BY c.relname;

-- Contrôle global: tables public encore sans RLS
SELECT
  c.relname AS table_name,
  c.relrowsecurity AS rls_enabled,
  c.relforcerowsecurity AS rls_forced
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
  AND c.relrowsecurity = false
ORDER BY c.relname;

-- Contrôle policies anon encore permissives sur le périmètre (cible: 0 ligne)
SELECT
        schemaname,
        tablename,
        policyname,
        permissive,
        cmd,
        roles
FROM pg_policies
WHERE schemaname = 'public'
    AND tablename IN (
        'prestations_catalogue',
        'commandes_prestations',
        'lignes_commande_prestations',
        'problemes_signales'
    )
    AND array_to_string(roles, ',') ILIKE '%anon%'
    AND permissive = 'PERMISSIVE'
ORDER BY tablename, policyname, cmd;

-- Contrôle durcissement: policies anon sans garde explicite IS NOT NULL (cible: 0 ligne)
SELECT
        schemaname,
        tablename,
        policyname,
        cmd,
        qual,
        with_check
FROM pg_policies
WHERE schemaname = 'public'
    AND tablename IN (
        'prestations_catalogue',
        'commandes_prestations',
        'lignes_commande_prestations',
        'problemes_signales'
    )
    AND array_to_string(roles, ',') ILIKE '%anon%'
    AND (
        (
            cmd IN ('SELECT', 'ALL')
            AND lower(coalesce(qual, '')) NOT LIKE '%is not null%'
        )
        OR
        (
            cmd IN ('INSERT', 'UPDATE', 'ALL')
            AND lower(coalesce(with_check, '')) NOT LIKE '%is not null%'
        )
    )
ORDER BY tablename, policyname, cmd;

-- Contrôle helper admin + privilèges d'exécution
SELECT
    p.proname AS function_name,
    pg_get_functiondef(p.oid) ILIKE '%stephanecalvignac@hotmail.fr%' AS contains_hardcoded_email,
        pg_get_functiondef(p.oid) ILIKE '%auth.role(), ''anon'') = ''anon''%' AS has_explicit_anon_guard,
    has_function_privilege('anon', p.oid, 'EXECUTE') AS anon_can_execute,
        has_function_privilege('authenticated', p.oid, 'EXECUTE') AS authenticated_can_execute,
        (
            (pg_get_functiondef(p.oid) ILIKE '%auth.role(), ''anon'') = ''anon''%')
            AND (pg_get_functiondef(p.oid) ILIKE '%auth.uid() IS NULL%')
            AND NOT (pg_get_functiondef(p.oid) ILIKE '%stephanecalvignac@hotmail.fr%')
        ) AS helper_hardened_effective
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
    AND p.proname = 'gc_is_admin';
