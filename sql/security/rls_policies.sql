-- ================================================================
-- ROW LEVEL SECURITY POLICIES
-- ================================================================
-- Date: 7 janvier 2026
-- Objectif: Définir les règles d'accès granulaires par table
-- Architecture: Basé sur les rôles dans user_roles
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
CREATE POLICY "admin_full_access_reservations"
ON reservations
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = auth.uid() 
        AND role = 'admin'
    )
);

-- Policy: Femme de ménage voit les réservations confirmées/ongoing
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
    AND status IN ('confirmed', 'ongoing')
);

-- ================================================================
-- 2. TABLE: cleaning_schedule
-- ================================================================

-- Policy: Admins accès complet
CREATE POLICY "admin_full_access_cleaning_schedule"
ON cleaning_schedule
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = auth.uid() 
        AND role = 'admin'
    )
);

-- Policy: Femme de ménage lit et modifie ses interventions
CREATE POLICY "femme_menage_access_cleaning_schedule"
ON cleaning_schedule
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = auth.uid() 
        AND role = 'femme_menage'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = auth.uid() 
        AND role = 'femme_menage'
    )
);

-- ================================================================
-- 3. TABLE: user_roles
-- ================================================================

-- Policy: Admins gèrent tous les rôles
CREATE POLICY "admin_manage_user_roles"
ON user_roles
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = auth.uid() 
        AND role = 'admin'
    )
);

-- Policy: Utilisateurs voient leurs propres rôles
CREATE POLICY "users_see_own_roles"
ON user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- ================================================================
-- 4. TABLE: retours_menage
-- ================================================================

-- Policy: Admins accès complet
CREATE POLICY "admin_full_access_retours_menage"
ON retours_menage
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = auth.uid() 
        AND role = 'admin'
    )
);

-- Policy: Femme de ménage crée et lit ses retours
CREATE POLICY "femme_menage_access_retours_menage"
ON retours_menage
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = auth.uid() 
        AND role = 'femme_menage'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = auth.uid() 
        AND role = 'femme_menage'
    )
);

-- ================================================================
-- 5. TABLE: stocks_draps
-- ================================================================

-- Policy: Admins accès complet
CREATE POLICY "admin_full_access_stocks_draps"
ON stocks_draps
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = auth.uid() 
        AND role = 'admin'
    )
);

-- Policy: Femme de ménage lit et met à jour les stocks
CREATE POLICY "femme_menage_access_stocks_draps"
ON stocks_draps
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = auth.uid() 
        AND role = 'femme_menage'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = auth.uid() 
        AND role = 'femme_menage'
    )
);

-- ================================================================
-- 6. TABLE: infos_gites
-- ================================================================

-- Policy: Admins accès complet
CREATE POLICY "admin_full_access_infos_gites"
ON infos_gites
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = auth.uid() 
        AND role = 'admin'
    )
);

-- Policy: Femme de ménage lecture seule des infos pratiques
CREATE POLICY "femme_menage_read_infos_gites"
ON infos_gites
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = auth.uid() 
        AND role = 'femme_menage'
    )
);

-- ================================================================
-- 7. TABLE: activites_gites
-- ================================================================

-- Policy: Admins accès complet
CREATE POLICY "admin_full_access_activites_gites"
ON activites_gites
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = auth.uid() 
        AND role = 'admin'
    )
);

-- Policy: Tous les utilisateurs authentifiés lisent les activités
CREATE POLICY "authenticated_read_activites_gites"
ON activites_gites
FOR SELECT
TO authenticated
USING (true);

-- ================================================================
-- 8. TABLE: client_access_tokens
-- ================================================================

-- Policy: Admins accès complet
CREATE POLICY "admin_full_access_client_tokens"
ON client_access_tokens
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = auth.uid() 
        AND role = 'admin'
    )
);

-- Policy: Accès anonyme lecture via token valide
CREATE POLICY "anon_access_via_valid_token"
ON client_access_tokens
FOR SELECT
TO anon
USING (
    expires_at > NOW()
    AND used_at IS NULL
);

-- ================================================================
-- 9. TABLE: historical_data (Charges fiscalité)
-- ================================================================

-- Policy: Admins accès complet
CREATE POLICY "admin_full_access_historical_data"
ON historical_data
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = auth.uid() 
        AND role = 'admin'
    )
);

-- ================================================================
-- 10. TABLE: simulations_fiscales
-- ================================================================

-- Policy: Admins accès complet
CREATE POLICY "admin_full_access_simulations_fiscales"
ON simulations_fiscales
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = auth.uid() 
        AND role = 'admin'
    )
);

-- ================================================================
-- 11. TABLE: todos
-- ================================================================

-- Policy: Admins accès complet
CREATE POLICY "admin_full_access_todos"
ON todos
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = auth.uid() 
        AND role = 'admin'
    )
);

-- ================================================================
-- 12. TABLE: commits_log
-- ================================================================

-- Policy: Admins accès complet
CREATE POLICY "admin_full_access_commits_log"
ON commits_log
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = auth.uid() 
        AND role = 'admin'
    )
);

-- ================================================================
-- 13. TABLE: faq_questions
-- ================================================================

-- Policy: Admins accès complet
CREATE POLICY "admin_full_access_faq_questions"
ON faq_questions
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = auth.uid() 
        AND role = 'admin'
    )
);

-- Policy: Lecture publique des FAQ (pour clients)
CREATE POLICY "public_read_faq_questions"
ON faq_questions
FOR SELECT
TO authenticated, anon
USING (true);

-- ================================================================
-- NOTES D'IMPLÉMENTATION
-- ================================================================
-- 
-- 1. Ordre d'exécution:
--    a) rls_enable.sql (activer RLS)
--    b) rls_policies.sql (ce fichier - créer policies)
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
