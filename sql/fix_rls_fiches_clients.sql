-- ============================================
-- FIX RLS : Désactiver temporairement ou créer policies permissives
-- ============================================

-- OPTION 1 : Désactiver RLS temporairement (développement)
-- Décommentez si vous voulez désactiver RLS pour tester

-- ALTER TABLE public.client_access_tokens DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.fiche_generation_logs DISABLE ROW LEVEL SECURITY;


-- OPTION 2 : Créer policies permissives (RECOMMANDÉ)
-- Permet l'accès en lecture/écriture pour développement

-- Supprimer les anciennes policies si elles existent
DROP POLICY IF EXISTS "Allow public read access to client_access_tokens" ON client_access_tokens;
DROP POLICY IF EXISTS "Allow public insert access to client_access_tokens" ON client_access_tokens;
DROP POLICY IF EXISTS "Allow public update access to client_access_tokens" ON client_access_tokens;

DROP POLICY IF EXISTS "Allow public read access to fiche_generation_logs" ON fiche_generation_logs;
DROP POLICY IF EXISTS "Allow public insert access to fiche_generation_logs" ON fiche_generation_logs;
DROP POLICY IF EXISTS "Allow public update access to fiche_generation_logs" ON fiche_generation_logs;

-- Policies pour client_access_tokens (lecture/écriture publique)
CREATE POLICY "Allow public read access to client_access_tokens"
ON client_access_tokens FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Allow public insert access to client_access_tokens"
ON client_access_tokens FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Allow public update access to client_access_tokens"
ON client_access_tokens FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- Policies pour fiche_generation_logs (lecture/écriture publique)
CREATE POLICY "Allow public read access to fiche_generation_logs"
ON fiche_generation_logs FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Allow public insert access to fiche_generation_logs"
ON fiche_generation_logs FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Allow public update access to fiche_generation_logs"
ON fiche_generation_logs FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- Message de confirmation
SELECT '✅ RLS policies créées avec succès' as status;
