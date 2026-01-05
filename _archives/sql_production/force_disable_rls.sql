-- DÉSACTIVATION FORCÉE DU RLS - Version agressive
-- Désactive RLS + supprime toutes les politiques existantes

-- Désactiver RLS sur TOUTES les tables
DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- Pour chaque table dans public
    FOR r IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
    LOOP
        -- Désactiver RLS
        EXECUTE format('ALTER TABLE public.%I DISABLE ROW LEVEL SECURITY', r.tablename);
        
        -- Supprimer toutes les politiques
        EXECUTE format('DROP POLICY IF EXISTS anon_read ON public.%I', r.tablename);
        EXECUTE format('DROP POLICY IF EXISTS authenticated_all ON public.%I', r.tablename);
        EXECUTE format('DROP POLICY IF EXISTS service_role_policy ON public.%I', r.tablename);
        
        RAISE NOTICE 'RLS désactivé sur: %', r.tablename;
    END LOOP;
END $$;

-- Vérification finale
SELECT 
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;
