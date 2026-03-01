-- ==================================================================================
-- LOT 3 RLS FICHE-CLIENT (PROD) - POST-CHECK
-- Exécuter APRÈS security_hardening_rls_fiche_client_token.sql
-- ==================================================================================

-- 1) Vérifier la présence des fonctions de contexte token
SELECT
    p.proname AS function_name,
    pg_get_function_identity_arguments(p.oid) AS args
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN (
      'client_token_value',
      'client_token_owner_id',
      'client_token_reservation_id',
      'client_token_gite_id',
      'client_token_gite_name'
  )
ORDER BY p.proname;

-- 2) Vérifier l'absence de policies anon permissives USING true / WITH CHECK true
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
  AND (
      lower(coalesce(qual, '')) = 'true'
      OR lower(coalesce(with_check, '')) = 'true'
  )
ORDER BY tablename, policyname, cmd;

-- 3) Vérifier les policies strictes du lot 3 présentes
SELECT
    tablename,
    policyname,
    cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND policyname IN (
      'anon_client_token_select_strict',
      'anon_client_token_update_strict',
      'anon_client_reservation_read_strict',
      'anon_client_infos_gites_read_strict',
      'anon_client_activites_read_strict',
      'anon_client_faq_read_strict',
      'anon_client_cleaning_read_strict',
      'anon_client_templates_read_strict'
  )
ORDER BY tablename, policyname, cmd;

-- 4) Smoke-test contexte vide (doit retourner NULL)
SELECT set_config('request.headers', '{}', true);
SELECT
    public.client_token_value() AS token,
    public.client_token_owner_id() AS owner_id,
    public.client_token_reservation_id() AS reservation_id,
    public.client_token_gite_id() AS gite_id,
    public.client_token_gite_name() AS gite_name;
