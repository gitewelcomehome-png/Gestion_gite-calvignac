-- ==================================================================================
-- RLS HARDENING - CM / ADMIN TABLES
-- Date: 06 mars 2026
-- Objectif: eliminer les tables unrestricted restantes apres rebuild
-- ==================================================================================

BEGIN;

-- ------------------------------------------------------------------------------
-- 0) Helper admin (sans hardcoding)
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
-- 1) Tables cibles
-- ------------------------------------------------------------------------------
DO $$
DECLARE
    t text;
    targets text[] := ARRAY[
        'auto_ticket_diagnostics',
        'cleaning_rules',
        'error_corrections',
        'cm_activity_logs',
        'cm_ai_content_queue',
        'cm_clients',
        'cm_error_corrections',
        'cm_invoices',
        'cm_pricing_plans',
        'cm_promo_usage',
        'cm_promotions',
        'cm_referrals',
        'cm_revenue_tracking',
        'cm_subscriptions',
        'cm_support_comments',
        'cm_support_diagnostics',
        'cm_support_solutions',
        'cm_support_ticket_history',
        'cm_support_tickets',
        'cm_website_pages'
    ];
BEGIN
    FOREACH t IN ARRAY targets
    LOOP
        IF to_regclass('public.' || t) IS NOT NULL THEN
            EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t);
            EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY;', t);
        END IF;
    END LOOP;
END $$;

-- ------------------------------------------------------------------------------
-- 2) Nettoyage policies existantes
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
              'auto_ticket_diagnostics',
              'cleaning_rules',
              'error_corrections',
              'cm_activity_logs',
              'cm_ai_content_queue',
              'cm_clients',
              'cm_error_corrections',
              'cm_invoices',
              'cm_pricing_plans',
              'cm_promo_usage',
              'cm_promotions',
              'cm_referrals',
              'cm_revenue_tracking',
              'cm_subscriptions',
              'cm_support_comments',
              'cm_support_diagnostics',
              'cm_support_solutions',
              'cm_support_ticket_history',
              'cm_support_tickets',
              'cm_website_pages'
          )
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I;', p.policyname, p.tablename);
    END LOOP;
END $$;

-- ------------------------------------------------------------------------------
-- 3) Policies admin-only pour tables CM
-- ------------------------------------------------------------------------------
DO $$
DECLARE
    t text;
    cm_tables text[] := ARRAY[
        'error_corrections',
        'cm_activity_logs',
        'cm_ai_content_queue',
        'cm_clients',
        'cm_error_corrections',
        'cm_invoices',
        'cm_pricing_plans',
        'cm_promo_usage',
        'cm_promotions',
        'cm_referrals',
        'cm_revenue_tracking',
        'cm_subscriptions',
        'cm_support_comments',
        'cm_support_diagnostics',
        'cm_support_solutions',
        'cm_support_ticket_history',
        'cm_support_tickets',
        'cm_website_pages'
    ];
BEGIN
    FOREACH t IN ARRAY cm_tables
    LOOP
        IF to_regclass('public.' || t) IS NOT NULL THEN
            EXECUTE format(
                'CREATE POLICY %I ON public.%I FOR ALL TO authenticated USING (public.gc_is_admin()) WITH CHECK (public.gc_is_admin());',
                'gc_admin_full_' || t,
                t
            );
            EXECUTE format(
                'CREATE POLICY %I ON public.%I FOR ALL TO service_role USING (true) WITH CHECK (true);',
                'gc_service_role_full_' || t,
                t
            );
        END IF;
    END LOOP;
END $$;

-- ------------------------------------------------------------------------------
-- 4) auto_ticket_diagnostics (owner + admin)
-- ------------------------------------------------------------------------------
DO $$
BEGIN
    IF to_regclass('public.auto_ticket_diagnostics') IS NOT NULL THEN
        CREATE POLICY gc_owner_or_admin_auto_ticket_diagnostics
            ON public.auto_ticket_diagnostics
            FOR ALL
            TO authenticated
            USING (user_id = auth.uid() OR public.gc_is_admin())
            WITH CHECK (user_id = auth.uid() OR public.gc_is_admin());

        CREATE POLICY gc_service_role_auto_ticket_diagnostics
            ON public.auto_ticket_diagnostics
            FOR ALL
            TO service_role
            USING (true)
            WITH CHECK (true);
    END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 5) cleaning_rules (read auth / write admin)
-- ------------------------------------------------------------------------------
DO $$
BEGIN
    IF to_regclass('public.cleaning_rules') IS NOT NULL THEN
        CREATE POLICY gc_read_cleaning_rules_authenticated
            ON public.cleaning_rules
            FOR SELECT
            TO authenticated
            USING (true);

        CREATE POLICY gc_admin_write_cleaning_rules
            ON public.cleaning_rules
            FOR INSERT
            TO authenticated
            WITH CHECK (public.gc_is_admin());

        CREATE POLICY gc_admin_update_cleaning_rules
            ON public.cleaning_rules
            FOR UPDATE
            TO authenticated
            USING (public.gc_is_admin())
            WITH CHECK (public.gc_is_admin());

        CREATE POLICY gc_admin_delete_cleaning_rules
            ON public.cleaning_rules
            FOR DELETE
            TO authenticated
            USING (public.gc_is_admin());

        CREATE POLICY gc_service_role_cleaning_rules
            ON public.cleaning_rules
            FOR ALL
            TO service_role
            USING (true)
            WITH CHECK (true);
    END IF;
END $$;

COMMIT;

-- Post-check rapide
SELECT c.relname AS table_name, c.relrowsecurity AS rls_enabled, c.relforcerowsecurity AS rls_forced
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE c.relkind = 'r'
  AND n.nspname = 'public'
  AND c.relname IN (
      'auto_ticket_diagnostics',
      'cleaning_rules',
      'cm_activity_logs',
      'cm_ai_content_queue',
      'cm_clients',
      'cm_error_corrections',
      'cm_invoices',
      'cm_pricing_plans',
      'cm_promo_usage',
      'cm_promotions',
      'cm_referrals',
      'cm_revenue_tracking',
      'cm_subscriptions',
      'cm_support_comments',
      'cm_support_diagnostics',
      'cm_support_solutions',
      'cm_support_ticket_history',
      'cm_support_tickets',
      'cm_website_pages'
  )
ORDER BY c.relname;