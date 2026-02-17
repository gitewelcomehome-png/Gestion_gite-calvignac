-- ================================================================
-- 🔓 AJOUT POLICY AUTO-INSCRIPTION CLIENTS
-- ================================================================
-- Date: 30 janvier 2026
-- Objectif: Permettre aux utilisateurs authentifiés de créer leur compte client
-- ================================================================

-- Supprimer l'ancienne policy si elle existe
DROP POLICY IF EXISTS "Users can self register as clients" ON public.cm_clients;

-- Créer la policy permettant l'auto-inscription
CREATE POLICY "Users can self register as clients" ON public.cm_clients
  FOR INSERT 
  WITH CHECK (
    auth.uid() IS NOT NULL AND 
    user_id = auth.uid()
  );

-- ================================================================
-- ✅ VÉRIFICATION
-- ================================================================
-- Lister les policies sur cm_clients
SELECT 
  policyname,
  cmd as "Operation",
  qual as "USING expression",
  with_check as "WITH CHECK expression"
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'cm_clients'
ORDER BY policyname;

-- ================================================================
-- 📝 RÉSULTAT ATTENDU
-- ================================================================
-- Vous devriez voir 3 policies:
-- 1. "Admin full access cm_clients" (ALL) 
-- 2. "Clients read own data" (SELECT)
-- 3. "Users can self register as clients" (INSERT) ← NOUVELLE
-- ================================================================
