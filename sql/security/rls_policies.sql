-- ================================================================
-- ROW LEVEL SECURITY POLICIES
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

-- Policy: Les admins voient toutes les réservations
DROP POLICY IF EXISTS "admin_full_access_reservations" ON reservations;
CREATE POLICY "admin_full_access_reservations"
ON reservations
FOR ALL
TO authenticated
USING (public.is_admin());

-- Policy: Femme de ménage voit les réservations confirmées/ongoing
DROP POLICY IF EXISTS "femme_menage_read_reservations" ON reservations;
CREATE POLICY "femme_menage_read_reservations"
ON reservations
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = auth.uid() 
        AND role = 'femme_menage'
    )
);public.is_femme_menage()-- Policy: Admins accès complet
DROP POLICY IF EXISTS "admin_full_access_cleaning_schedule" ON cleaning_schedule;
CREATE POLICY "admin_full_access_cleaning_schedule"
ON cleaning_schedule
FOR ALL
TO authenticated
USING (public.is_admin());

-- Policy: Femme de ménage lit et modifie ses interventions
DROP POLICY IF EXISTS "femme_menage_access_cleaning_schedule" ON cleaning_schedule;
CREATE POLICY "femme_menage_access_cleaning_schedule"
ON cleaning_schedule
FOR ALL
TO authenticated
USING (public.is_femme_menage())
WITH CHECK (public.is_femme_menage());

-- ================================================================
-- 3. TABLE: user_roles
-- ================================================================

-- Policy: Admins gèrent tous les rôles
DROP POLICY IF EXISTS "admin_manage_user_roles" ON user_roles;
CREATE POLICY "admin_manage_user_roles"
ON user_roles
FOR ALL
TO authenticated
USING (public.is_admin());

-- Policy: Utilisateurs voient leurs propres rôles
DROP POLICY IF EXISTS "users_see_own_roles" ON user_roles;
CREATE POLICY "users_see_own_roles"
ON user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- ================================================================
-- 4. TABLE: retours_menage
-- ================================================================

-- Policy: Admins accès complet
DROP POLICY IF EXISTS "admin_full_access_retours_menage" ON retours_menage;
CREATE POLICY "admin_full_access_retours_menage"
ON retours_menage
FOR ALL
TO authenticated
USING (public.is_admin());

-- Policy: Femme de ménage crée et lit ses retours
DROP POLICY IF EXISTS "femme_menage_access_retours_menage" ON retours_menage;
CREATE POLICY "femme_menage_access_retours_menage"
ON retours_menage
FOR ALL
TO authenticated
USING (public.is_femme_menage())
WITH CHECK (public.is_femme_menage());

-- ================================================================
-- 5. TABLE: stocks_draps
-- ================================================================

-- Policy: Admins accès complet
DROP POLICY IF EXISTS "admin_full_access_stocks_draps" ON stocks_draps;
CREATE POLICY "admin_full_access_stocks_draps"
ON stocks_draps
FOR ALL
TO authenticated
USING (public.is_admin());

-- Policy: Femme de ménage lit et met à jour les stocks
DROP POLICY IF EXISTS "femme_menage_access_stocks_draps" ON stocks_draps;
CREATE POLICY "femme_menage_access_stocks_draps"
ON stocks_draps
FOR ALL
TO authenticated
USING (public.is_femme_menage())
WITH CHECK (public.is_femme_menage());

-- ================================================================
-- 6. TABLE: infos_gites
-- ================================================================

-- Policy: Admins accès complet
DROP POLICY IF EXISTS "admin_full_access_infos_gites" ON infos_gites;
CREATE POLICY "admin_full_access_infos_gites"
ON infos_gites
FOR ALL
TO authenticated
USING (public.is_admin());

-- Policy: Femme de ménage lecture seule des infos pratiques
DROP POLICY IF EXISTS "femme_menage_read_infos_gites" ON infos_gites;
CREATE POLICY "femme_menage_read_infos_gites"
ON infos_gites
FOR SELECT
TO authenticated
USING (public.is_femme_menage());

-- ================================================================
-- 7. TABLE: activites_gites
-- ================================================================

-- Policy: Admins accès complet
DROP POLICY IF EXISTS "admin_full_access_activites_gites" ON activites_gites;
CREATE POLICY "admin_full_access_activites_gites"
ON activites_gites
FOR ALL
TO authenticated
USING (public.is_admin());

-- Policy: Tous les utilisateurs authentifiés lisent les activités
DROP POLICY IF EXISTS "authenticated_read_activites_gites" ON activites_gites;
CREATE POLICY "authenticated_read_activites_gites"
ON activites_gites
FOR SELECT
TO authenticated
USING (true);

-- ================================================================
-- 8. TABLE: client_access_tokens
-- ================================================================

-- Policy: Admins accès complet
DROP POLICY IF EXISTS "admin_full_access_client_tokens" ON client_access_tokens;
CREATE POLICY "admin_full_access_client_tokens"
ON client_access_tokens
FOR ALL
TO authenticated
USING (public.is_admin());

-- Policy: Accès anonyme lecture via token valide
DROP POLICY IF EXISTS "anon_access_via_valid_token" ON client_access_tokens;
CREATE POLICY "anon_access_via_valid_token"
ON client_access_tokens
FOR SELECT
TO anon
USING (
    expires_at > NOW()
);

-- ================================================================
-- 9. TABLE: historical_data (Charges fiscalité)
-- ================================================================

-- Policy: Admins accès complet
DROP POLICY IF EXISTS "admin_full_access_historical_data" ON historical_data;
CREATE POLICY "admin_full_access_historical_data"
ON historical_data
FOR ALL
TO authenticated
USING (public.is_admin());

-- ================================================================
-- 10. TABLE: simulations_fiscales
-- ================================================================

-- Policy: Admins accès complet
DROP POLICY IF EXISTS "admin_full_access_simulations_fiscales" ON simulations_fiscales;
CREATE POLICY "admin_full_access_simulations_fiscales"
ON simulations_fiscales
FOR ALL
TO authenticated
USING (public.is_admin());

-- ================================================================
-- 11. TABLE: todos
-- ================================================================

-- Policy: Admins accès complet
DROP POLICY IF EXISTS "admin_full_access_todos" ON todos;
CREATE POLICY "admin_full_access_todos"
ON todos
FOR ALL
TO authenticated
USING (public.is_admin());

-- ================================================================
-- 12. TABLE: commits_log
-- ================================================================

-- Policy: Admins accès complet
DROP POLICY IF EXISTS "admin_full_access_commits_log" ON commits_log;
CREATE POLICY "admin_full_access_commits_log"
ON commits_log
FOR ALL
TO authenticated
USING (public.is_admin());

-- ================================================================
-- 13. TABLE: faq
-- ================================================================

-- Policy: Admins accès complet
DROP POLICY IF EXISTS "admin_full_access_faq" ON faq;
CREATE POLICY "admin_full_access_faq"
ON faq
FOR ALL
TO authenticated
USING (public.is_admin());

-- Policy: Lecture publique des FAQ (pour clients)
DROP POLICY IF EXISTS "public_read_faq" ON faq;
CREATE POLICY "public_read_faq"
ON faq
FOR SELECT
TO authenticated, anon
USING (true);

-- ================================================================
-- NOTES D'IMPLÉMENTATION
-- ================================================================
-- 
-- 1. Ordre d'exécution:
--    a) rls_helper_functions.sql (créer les fonctions d'aide)
--    b) rls_enable.sql (activer RLS)
--    c) rls_policies.sql (ce fichier - créer policies)
--
-- 2. Test des policies:
--    SELECT * FROM reservations; -- Devrait filtrer selon le rôle
--
-- 3. Vérifier les policies actives:
--    SELECT tablename, policyname, permissive, roles, cmd, qual 
--    FROM pg_policies 
--    WHERE schemaname = 'public';
--
-- 4. Supprimer une policy (si besoin):
--    DROP POLICY "policy_name" ON table_name;
--
-- 5. Performance:
--    Les policies RLS sont évaluées à chaque requête
--    Créer des index sur user_roles(user_id, role) si lenteur
--
-- ================================================================
