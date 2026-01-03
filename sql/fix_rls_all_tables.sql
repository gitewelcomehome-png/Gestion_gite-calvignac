-- Désactiver RLS sur TOUTES les tables utilisées par l'application
-- Utilisation de DO pour ignorer les erreurs si une table n'existe pas

DO $$ 
BEGIN
    -- Tables principales
    ALTER TABLE IF EXISTS public.reservations DISABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS public.cleaning_schedule DISABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS public.charges DISABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS public.activites_gites DISABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS public.historical_data DISABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS public.todos DISABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS public.faq DISABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS public.commits_log DISABLE ROW LEVEL SECURITY;
    
    -- Tables fiches clients
    ALTER TABLE IF EXISTS public.infos_gites DISABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS public.checklists DISABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS public.checklist_validations DISABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS public.demandes_horaires DISABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS public.retours_clients DISABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS public.client_access_tokens DISABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS public.fiche_generation_logs DISABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS public.activites_consultations DISABLE ROW LEVEL SECURITY;
    
    -- Tables supplémentaires (si elles existent)
    ALTER TABLE IF EXISTS public.suivi_soldes_bancaires DISABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS public.recurrent_actions DISABLE ROW LEVEL SECURITY;
    
    RAISE NOTICE '✅ RLS désactivé sur toutes les tables existantes';
END $$;

SELECT '✅ RLS désactivé avec succès' as status;
