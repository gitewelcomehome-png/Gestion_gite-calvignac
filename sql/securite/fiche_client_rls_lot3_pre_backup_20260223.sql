-- ==================================================================================
-- LOT 3 RLS FICHE-CLIENT (PROD) - PRE-BACKUP POLICIES
-- Exécuter AVANT security_hardening_rls_fiche_client_token.sql
-- ==================================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.rls_policy_backups_fiche_client (
    backup_id TEXT NOT NULL,
    captured_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    schemaname TEXT NOT NULL,
    tablename TEXT NOT NULL,
    policyname TEXT NOT NULL,
    permissive TEXT NOT NULL,
    roles name[] NOT NULL,
    cmd TEXT NOT NULL,
    qual TEXT,
    with_check TEXT,
    PRIMARY KEY (backup_id, schemaname, tablename, policyname, cmd)
);

DO $$
DECLARE
    v_backup_id CONSTANT TEXT := 'lot3_rls_fiche_client_20260223';
BEGIN
    DELETE FROM public.rls_policy_backups_fiche_client WHERE backup_id = v_backup_id;

    INSERT INTO public.rls_policy_backups_fiche_client (
        backup_id,
        schemaname,
        tablename,
        policyname,
        permissive,
        roles,
        cmd,
        qual,
        with_check
    )
    SELECT
        v_backup_id,
        p.schemaname,
        p.tablename,
        p.policyname,
        p.permissive,
        p.roles,
        p.cmd,
        p.qual,
        p.with_check
    FROM pg_policies p
    WHERE p.schemaname = 'public'
      AND p.tablename IN (
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
      );
END $$;

COMMIT;

SELECT
    backup_id,
    COUNT(*) AS policies_captured,
    MIN(captured_at) AS captured_at
FROM public.rls_policy_backups_fiche_client
WHERE backup_id = 'lot3_rls_fiche_client_20260223'
GROUP BY backup_id;
