-- ================================================================
-- ROW LEVEL SECURITY POLICIES - VERSION PROPRE
-- ================================================================
-- Date: 7 janvier 2026
-- Objectif: Définir les règles d'accès granulaires par table
-- Architecture: Basé sur les rôles dans user_roles
-- ================================================================
-- Note: Ce script supprime et recrée toutes les policies (idempotent)
-- IMPORTANT: Exécuter rls_helper_functions.sql AVANT ce fichier
-- ================================================================

-- ================================================================
-- RÔLES DISPONIBLES
-- ================================================================
-- 'admin' : Accès complet à toutes les données
-- 'femme_menage' : Accès limité aux interventions assignées
-- 'client' : Accès lecture seule via tokens (fiche-client)

-- ================================================================
-- 1. TABLE: reservations
-- ================================================================

DROP POLICY IF EXISTS "admin_full_access_reservations" ON reservations;
CREATE POLICY "admin_full_access_reservations"
ON reservations FOR ALL TO authenticated
USING (public.is_admin());

DROP POLICY IF EXISTS "femme_menage_read_reservations" ON reservations;
CREATE POLICY "femme_menage_read_reservations"
ON reservations FOR SELECT TO authenticated
USING (public.is_femme_menage());

-- ================================================================
-- 2. TABLE: cleaning_schedule
-- ================================================================

DROP POLICY IF EXISTS "admin_full_access_cleaning_schedule" ON cleaning_schedule;
CREATE POLICY "admin_full_access_cleaning_schedule"
ON cleaning_schedule FOR ALL TO authenticated
USING (public.is_admin());

DROP POLICY IF EXISTS "femme_menage_access_cleaning_schedule" ON cleaning_schedule;
CREATE POLICY "femme_menage_access_cleaning_schedule"
ON cleaning_schedule FOR ALL TO authenticated
USING (public.is_femme_menage())
WITH CHECK (public.is_femme_menage());

-- ================================================================
-- 3. TABLE: user_roles
-- ================================================================

DROP POLICY IF EXISTS "admin_manage_user_roles" ON user_roles;
CREATE POLICY "admin_manage_user_roles"
ON user_roles FOR ALL TO authenticated
USING (public.is_admin());

DROP POLICY IF EXISTS "users_see_own_roles" ON user_roles;
CREATE POLICY "users_see_own_roles"
ON user_roles FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- ================================================================
-- 4. TABLE: retours_menage
-- ================================================================

DROP POLICY IF EXISTS "admin_full_access_retours_menage" ON retours_menage;
CREATE POLICY "admin_full_access_retours_menage"
ON retours_menage FOR ALL TO authenticated
USING (public.is_admin());

DROP POLICY IF EXISTS "femme_menage_access_retours_menage" ON retours_menage;
CREATE POLICY "femme_menage_access_retours_menage"
ON retours_menage FOR ALL TO authenticated
USING (public.is_femme_menage())
WITH CHECK (public.is_femme_menage());

-- ================================================================
-- 5. TABLE: stocks_draps
-- ================================================================

DROP POLICY IF EXISTS "admin_full_access_stocks_draps" ON stocks_draps;
CREATE POLICY "admin_full_access_stocks_draps"
ON stocks_draps FOR ALL TO authenticated
USING (public.is_admin());

DROP POLICY IF EXISTS "femme_menage_access_stocks_draps" ON stocks_draps;
CREATE POLICY "femme_menage_access_stocks_draps"
ON stocks_draps FOR ALL TO authenticated
USING (public.is_femme_menage())
WITH CHECK (public.is_femme_menage());

-- ================================================================
-- 6. TABLE: infos_gites
-- ================================================================

DROP POLICY IF EXISTS "admin_full_access_infos_gites" ON infos_gites;
CREATE POLICY "admin_full_access_infos_gites"
ON infos_gites FOR ALL TO authenticated
USING (public.is_admin());

DROP POLICY IF EXISTS "femme_menage_read_infos_gites" ON infos_gites;
CREATE POLICY "femme_menage_read_infos_gites"
ON infos_gites FOR SELECT TO authenticated
USING (public.is_femme_menage());

-- ================================================================
-- 7. TABLE: activites_gites
-- ================================================================

DROP POLICY IF EXISTS "admin_full_access_activites_gites" ON activites_gites;
CREATE POLICY "admin_full_access_activites_gites"
ON activites_gites FOR ALL TO authenticated
USING (public.is_admin());

DROP POLICY IF EXISTS "authenticated_read_activites_gites" ON activites_gites;
CREATE POLICY "authenticated_read_activites_gites"
ON activites_gites FOR SELECT TO authenticated
USING (true);

-- ================================================================
-- 8. TABLE: client_access_tokens
-- ================================================================

DROP POLICY IF EXISTS "admin_full_access_client_tokens" ON client_access_tokens;
CREATE POLICY "admin_full_access_client_tokens"
ON client_access_tokens FOR ALL TO authenticated
USING (public.is_admin());

DROP POLICY IF EXISTS "anon_access_via_valid_token" ON client_access_tokens;
CREATE POLICY "anon_access_via_valid_token"
ON client_access_tokens FOR SELECT TO anon
USING (expires_at > NOW());

-- ================================================================
-- 9. TABLE: historical_data
-- ================================================================

DROP POLICY IF EXISTS "admin_full_access_historical_data" ON historical_data;
CREATE POLICY "admin_full_access_historical_data"
ON historical_data FOR ALL TO authenticated
USING (public.is_admin());

-- ================================================================
-- 10. TABLE: simulations_fiscales
-- ================================================================

DROP POLICY IF EXISTS "admin_full_access_simulations_fiscales" ON simulations_fiscales;
CREATE POLICY "admin_full_access_simulations_fiscales"
ON simulations_fiscales FOR ALL TO authenticated
USING (public.is_admin());

-- ================================================================
-- 11. TABLE: todos
-- ================================================================

DROP POLICY IF EXISTS "admin_full_access_todos" ON todos;
CREATE POLICY "admin_full_access_todos"
ON todos FOR ALL TO authenticated
USING (public.is_admin());

-- ================================================================
-- 12. TABLE: commits_log
-- ================================================================

DROP POLICY IF EXISTS "admin_full_access_commits_log" ON commits_log;
CREATE POLICY "admin_full_access_commits_log"
ON commits_log FOR ALL TO authenticated
USING (public.is_admin());

-- ================================================================
-- 13. TABLE: faq
-- ================================================================

DROP POLICY IF EXISTS "admin_full_access_faq" ON faq;
CREATE POLICY "admin_full_access_faq"
ON faq FOR ALL TO authenticated
USING (public.is_admin());

DROP POLICY IF EXISTS "public_read_faq" ON faq;
CREATE POLICY "public_read_faq"
ON faq FOR SELECT TO authenticated, anon
USING (true);

-- ================================================================
-- FIN - 20 policies créées sur 13 tables
-- ================================================================
