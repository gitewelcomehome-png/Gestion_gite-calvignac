-- ==================================================================================
-- FIX PROD - RECURSION RLS user_roles (42P17)
-- Date: 23 février 2026
-- Objectif: supprimer les policies auto-référentes sur user_roles
-- ==================================================================================

BEGIN;

ALTER TABLE IF EXISTS public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins gèrent les rôles" ON public.user_roles;
DROP POLICY IF EXISTS "Service role gère les rôles" ON public.user_roles;
DROP POLICY IF EXISTS "Utilisateurs voient leurs rôles" ON public.user_roles;

CREATE POLICY "Utilisateurs voient leurs rôles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Service role gère les rôles"
ON public.user_roles
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

COMMIT;

-- Post-check: aucune policy user_roles ne doit référencer user_roles elle-même
SELECT
		schemaname,
		tablename,
		policyname,
		cmd,
		qual,
		with_check
FROM pg_policies
WHERE schemaname = 'public'
	AND tablename = 'user_roles'
ORDER BY policyname, cmd;
