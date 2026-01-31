-- ================================================================
-- ✅ VÉRIFICATION POLICIES cm_clients
-- ================================================================

SELECT 
  policyname,
  cmd as "Operation",
  qual as "USING expression",
  with_check as "WITH CHECK expression"
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'cm_clients'
ORDER BY policyname;
