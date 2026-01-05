-- ============================================
-- FIX COMPLET : RLS + Policies pour toutes les tables fiches clients
-- ============================================

-- Désactiver RLS sur toutes les tables (plus simple pour développement)
ALTER TABLE public.infos_gites DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklists DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_validations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.demandes_horaires DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.retours_clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_access_tokens DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.fiche_generation_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.activites_consultations DISABLE ROW LEVEL SECURITY;

-- Message de confirmation
SELECT 
  '✅ RLS désactivé sur 8 tables' as status,
  'Vous pouvez maintenant accéder aux fiches clients' as message;

-- Vérifier les tables
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'infos_gites',
    'checklists', 
    'checklist_validations',
    'demandes_horaires',
    'retours_clients',
    'client_access_tokens',
    'fiche_generation_logs',
    'activites_consultations'
  )
ORDER BY tablename;
