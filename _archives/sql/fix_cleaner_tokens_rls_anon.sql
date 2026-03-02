-- ============================================================
-- FIX : Lecture de cleaner_tokens par les utilisateurs anon
-- Problème : La page validation.html est ouverte par la société
--            de ménage SANS être connectée (rôle anon).
--            Sans cette policy, 0 lignes retournées → 406 / "Lien expiré"
-- ============================================================

-- S'assurer que RLS est bien activé
ALTER TABLE public.cleaner_tokens ENABLE ROW LEVEL SECURITY;

-- Supprimer la policy existante si elle existe (pour la recréer proprement)
DROP POLICY IF EXISTS anon_read_cleaner_tokens ON public.cleaner_tokens;

-- Policy : tout utilisateur anon peut LIRE les tokens
-- (lecture seule, pas d'écriture)
CREATE POLICY anon_read_cleaner_tokens
    ON public.cleaner_tokens
    FOR SELECT
    TO anon
    USING (true);

-- Vérification : doit retourner la policy ci-dessus
SELECT policyname, cmd, roles, qual
FROM pg_policies
WHERE tablename = 'cleaner_tokens'
ORDER BY policyname;
