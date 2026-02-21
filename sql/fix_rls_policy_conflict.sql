-- ============================================================
-- CORRECTIF : Conflit policies RLS fiche-client vs cleaner
-- À exécuter dans Supabase SQL Editor
-- 
-- Problème : create_cleaner_tokens.sql avait écrasé les policies
--            "anon_read_reservations" et "anon_read_cleaning_schedule"
--            créées pour fiche-client (USING(true)) avec des policies
--            restrictives (cleaner_token_owner_id()), cassant fiche-client.
--
-- Solution :
--   - Supprimer les anciennes policies mal nommées (restrictives)
--   - Créer les policies cleaner avec les NOUVEAUX noms distincts
--   - Restaurer les policies fiche-client avec USING(true)
--
-- Note : En PostgreSQL/Supabase, plusieurs policies SELECT sur la même
--        table sont combinées en OR → coexistence sans conflit.
-- ============================================================

-- ── 1. Supprimer les policies conflictuelles (noms génériques) ──────────
DROP POLICY IF EXISTS "anon_read_reservations" ON public.reservations;
DROP POLICY IF EXISTS "anon_read_cleaning_schedule" ON public.cleaning_schedule;

-- ── 2. Créer les policies cleaner avec noms distincts ───────────────────

-- reservations : lecture filtrée par token ménage
DROP POLICY IF EXISTS "anon_cleaner_read_reservations" ON public.reservations;
CREATE POLICY "anon_cleaner_read_reservations"
ON public.reservations FOR SELECT TO anon
USING (owner_user_id = public.cleaner_token_owner_id());

-- cleaning_schedule : lecture filtrée par token ménage
DROP POLICY IF EXISTS "anon_cleaner_read_cleaning_schedule" ON public.cleaning_schedule;
CREATE POLICY "anon_cleaner_read_cleaning_schedule"
ON public.cleaning_schedule FOR SELECT TO anon
USING (owner_user_id = public.cleaner_token_owner_id());

-- ── 3. Restaurer les policies fiche-client (accès ouvert pour lien client) ──

-- reservations : lecture ouverte pour fiche-client (anon, token via client_access_tokens)
DROP POLICY IF EXISTS "anon_read_reservations" ON public.reservations;
CREATE POLICY "anon_read_reservations"
ON public.reservations FOR SELECT TO anon
USING (true);

-- cleaning_schedule : lecture ouverte pour fiche-client
DROP POLICY IF EXISTS "anon_read_cleaning_schedule" ON public.cleaning_schedule;
CREATE POLICY "anon_read_cleaning_schedule"
ON public.cleaning_schedule FOR SELECT TO anon
USING (true);

-- ── Vérification ────────────────────────────────────────────────────────
-- Lister toutes les policies actives sur ces deux tables :
SELECT schemaname, tablename, policyname, roles, cmd, qual
FROM pg_policies
WHERE tablename IN ('reservations', 'cleaning_schedule')
ORDER BY tablename, policyname;
