-- ==================================================================================
-- LOT 3 RLS FICHE-CLIENT (PROD) - ROLLBACK COMPLET POLICIES
-- Prérequis: backup créé via fiche_client_rls_lot3_pre_backup_20260223.sql
-- ==================================================================================

BEGIN;

DO $$
DECLARE
    v_backup_id CONSTANT TEXT := 'lot3_rls_fiche_client_20260223';
    rec RECORD;
    t RECORD;
    role_sql TEXT;
    stmt TEXT;
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM public.rls_policy_backups_fiche_client
        WHERE backup_id = v_backup_id
    ) THEN
        RAISE EXCEPTION 'Aucun backup trouvé pour backup_id=%', v_backup_id;
    END IF;

    FOR t IN
        SELECT DISTINCT tablename
        FROM public.rls_policy_backups_fiche_client
        WHERE backup_id = v_backup_id
    LOOP
        FOR rec IN
            SELECT policyname
            FROM pg_policies
            WHERE schemaname = 'public'
              AND tablename = t.tablename
        LOOP
            EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', rec.policyname, t.tablename);
        END LOOP;
    END LOOP;

    FOR rec IN
        SELECT
            tablename,
            policyname,
            permissive,
            roles,
            cmd,
            qual,
            with_check
        FROM public.rls_policy_backups_fiche_client
        WHERE backup_id = v_backup_id
        ORDER BY tablename, policyname, cmd
    LOOP
        role_sql := (
            SELECT string_agg(quote_ident(r::text), ', ')
            FROM unnest(rec.roles) AS r
        );

        IF role_sql IS NULL OR btrim(role_sql) = '' THEN
            role_sql := 'PUBLIC';
        END IF;

        stmt := format(
            'CREATE POLICY %I ON public.%I AS %s FOR %s TO %s',
            rec.policyname,
            rec.tablename,
            rec.permissive,
            rec.cmd,
            role_sql
        );

        IF rec.qual IS NOT NULL THEN
            stmt := stmt || format(' USING (%s)', rec.qual);
        END IF;

        IF rec.with_check IS NOT NULL THEN
            stmt := stmt || format(' WITH CHECK (%s)', rec.with_check);
        END IF;

        EXECUTE stmt;
    END LOOP;
END $$;

COMMIT;

SELECT
    schemaname,
    tablename,
    policyname,
    cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
        'client_access_tokens',
        'reservations',
        'infos_gites',
        'demandes_horaires',
        'cleaning_schedule',
        'activites_gites',
        'activites_consultations',
        'retours_clients',
        'faq',
        'checklist_templates',
        'checklist_progress',
        'problemes_signales',
        'evaluations_sejour'
  )
ORDER BY tablename, policyname, cmd;
