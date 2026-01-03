-- Désactiver RLS sur TOUTES les tables utilisées par l'application
ALTER TABLE public.reservations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.cleaning_schedule DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.charges DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.activites_gites DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.historical_data DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.todos DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.faq DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.commits_log DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.infos_gites DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklists DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_validations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.demandes_horaires DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.retours_clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_access_tokens DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.fiche_generation_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.activites_consultations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.simulations_fiscalite DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.suivi_soldes_bancaires DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurrent_actions DISABLE ROW LEVEL SECURITY;

SELECT '✅ RLS désactivé sur toutes les tables' as status;
