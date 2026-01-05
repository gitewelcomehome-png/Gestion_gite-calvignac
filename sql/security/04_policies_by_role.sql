-- ================================================================
-- POLITIQUES RLS GRANULAIRES PAR RÔLE - Phase 1.3
-- Remplacer les politiques temporaires par des politiques basées sur les rôles
-- ================================================================
-- Date: 5 janvier 2026
-- À exécuter APRÈS:
--   - Authentification fonctionnelle
--   - Table user_roles créée
--   - Rôles assignés aux utilisateurs
-- ================================================================

-- ================================================================
-- RÉSERVATIONS
-- Owner et Admin: Accès complet
-- Cleaner: Lecture seule (pour voir les arrivées/départs)
-- ================================================================

DROP POLICY IF EXISTS "Temp: Utilisateurs authentifiés - Accès complet" ON reservations;

CREATE POLICY "Owner et Admin - Accès complet" ON reservations
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role IN ('owner', 'admin')
        )
    );

CREATE POLICY "Cleaner - Lecture seule" ON reservations
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role = 'cleaner'
        )
    );

-- ================================================================
-- CHARGES & FISCALITÉ
-- Owner uniquement (données financières sensibles)
-- ================================================================

-- CHARGES
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'charges') THEN
        EXECUTE 'DROP POLICY IF EXISTS "Temp: Utilisateurs authentifiés - Accès complet" ON charges';
        EXECUTE 'CREATE POLICY "Owner uniquement" ON charges FOR ALL USING (has_role(''owner''))';
    END IF;
END $$;

-- FISCALITE
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'fiscalite') THEN
        EXECUTE 'DROP POLICY IF EXISTS "Temp: Utilisateurs authentifiés - Accès complet" ON fiscalite';
        EXECUTE 'CREATE POLICY "Owner uniquement" ON fiscalite FOR ALL USING (has_role(''owner''))';
    END IF;
END $$;

-- SOLDES BANCAIRES
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'soldes_bancaires') THEN
        EXECUTE 'DROP POLICY IF EXISTS "Temp: Utilisateurs authentifiés - Accès complet" ON soldes_bancaires';
        EXECUTE 'CREATE POLICY "Owner uniquement" ON soldes_bancaires FOR ALL USING (has_role(''owner''))';
    END IF;
END $$;

-- ================================================================
-- RETOURS MÉNAGE
-- Cleaner: Peut créer et voir ses propres retours
-- Owner: Peut tout voir et valider
-- ================================================================

DROP POLICY IF EXISTS "Temp: Utilisateurs authentifiés - Accès complet" ON retours_menage;

-- Cleaner peut créer des retours
CREATE POLICY "Cleaner - Créer retours" ON retours_menage
    FOR INSERT
    WITH CHECK (
        has_role('cleaner') AND
        created_by = (SELECT email FROM auth.users WHERE id = auth.uid())
    );

-- Cleaner peut voir ses propres retours
CREATE POLICY "Cleaner - Voir ses retours" ON retours_menage
    FOR SELECT
    USING (
        has_role('cleaner') AND
        created_by = (SELECT email FROM auth.users WHERE id = auth.uid())
    );

-- Owner peut tout voir
CREATE POLICY "Owner - Tout voir" ON retours_menage
    FOR SELECT
    USING (has_role('owner'));

-- Owner peut mettre à jour (validation)
CREATE POLICY "Owner - Valider" ON retours_menage
    FOR UPDATE
    USING (has_role('owner'));

-- Owner peut supprimer
CREATE POLICY "Owner - Supprimer" ON retours_menage
    FOR DELETE
    USING (has_role('owner'));

-- ================================================================
-- STOCKS DRAPS
-- Owner uniquement
-- ================================================================

DROP POLICY IF EXISTS "Temp: Utilisateurs authentifiés - Accès complet" ON stocks_draps;

CREATE POLICY "Owner uniquement" ON stocks_draps
    FOR ALL
    USING (has_role('owner'));

-- ================================================================
-- FICHES CLIENTS
-- Owner uniquement (données personnelles sensibles)
-- ================================================================

DROP POLICY IF EXISTS "Temp: Utilisateurs authentifiés - Accès complet" ON fiches_clients;

CREATE POLICY "Owner uniquement" ON fiches_clients
    FOR ALL
    USING (has_role('owner'));

DROP POLICY IF EXISTS "Temp: Utilisateurs authentifiés - Accès complet" ON transactions_clients;

CREATE POLICY "Owner uniquement" ON transactions_clients
    FOR ALL
    USING (has_role('owner'));

DROP POLICY IF EXISTS "Temp: Utilisateurs authentifiés - Accès complet" ON communications_clients;

CREATE POLICY "Owner uniquement" ON communications_clients
    FOR ALL
    USING (has_role('owner'));

-- ================================================================
-- TODOS
-- Owner: Accès complet
-- Cleaner: Peut voir et modifier les tâches ménage
-- ================================================================

DROP POLICY IF EXISTS "Temp: Utilisateurs authentifiés - Accès complet" ON todos;

CREATE POLICY "Owner - Accès complet" ON todos
    FOR ALL
    USING (has_role('owner'));

CREATE POLICY "Cleaner - Tâches ménage" ON todos
    FOR ALL
    USING (
        has_role('cleaner') AND
        type = 'menage'
    );

-- ================================================================
-- CLEANING_SCHEDULES
-- Owner: Accès complet
-- Cleaner: Lecture seule
-- ================================================================

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'cleaning_schedules') THEN
        EXECUTE 'DROP POLICY IF EXISTS "Temp: Utilisateurs authentifiés - Accès complet" ON cleaning_schedules';
        EXECUTE 'CREATE POLICY "Owner - Accès complet" ON cleaning_schedules FOR ALL USING (has_role(''owner''))';
        EXECUTE 'CREATE POLICY "Cleaner - Lecture seule" ON cleaning_schedules FOR SELECT USING (has_role(''cleaner''))';
    END IF;
END $$;

-- ================================================================
-- INFOS_GITES (Publique en lecture, Owner en écriture)
-- ================================================================

DROP POLICY IF EXISTS "Temp: Utilisateurs authentifiés - Accès complet" ON infos_gites;

CREATE POLICY "Tous - Lecture" ON infos_gites
    FOR SELECT
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "Owner - Modification" ON infos_gites
    FOR ALL
    USING (has_role('owner'));

-- ================================================================
-- ACTIVITÉS (Publique en lecture, Owner en écriture)
-- ================================================================

DROP POLICY IF EXISTS "Temp: Utilisateurs authentifiés - Accès complet" ON activites;

CREATE POLICY "Tous - Lecture" ON activites
    FOR SELECT
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "Owner - Modification" ON activites
    FOR ALL
    USING (has_role('owner'));

-- ================================================================
-- FAQ (Publique en lecture, Owner en écriture)
-- ================================================================

DROP POLICY IF EXISTS "Temp: Utilisateurs authentifiés - Accès complet" ON faq;

CREATE POLICY "Tous - Lecture" ON faq
    FOR SELECT
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "Owner - Modification" ON faq
    FOR ALL
    USING (has_role('owner'));

-- ================================================================
-- COMMITS_LOG (Admin uniquement)
-- ================================================================

DROP POLICY IF EXISTS "Temp: Utilisateurs authentifiés - Accès complet" ON commits_log;
O $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'commits_log') THEN
        EXECUTE 'DROP POLICY IF EXISTS "Temp: Utilisateurs authentifiés - Accès complet" ON commits_log';
        EXECUTE 'CREATE POLICY "Admin uniquement" ON commits_log FOR ALL USING (has_role(''admin''))';
    END IF;
END $$
-- ================================================================
-- VÉRIFICATION DES POLITIQUES
-- ================================================================

-- Lister toutes les nouvelles politiques
SELECT 
    tablename,
    policyname,
    cmd AS operations,
    CASE 
        WHEN qual LIKE '%has_role%' THEN '✅ Basé sur rôle'
        WHEN qual LIKE '%auth.uid()%' THEN '✅ Authentifié'
        ELSE '⚠️ Vérifier'
    END AS type_politique
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Compter les politiques par table
SELECT 
    tablename,
    COUNT(*) AS nb_politiques
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- ================================================================
-- ROLLBACK SI PROBLÈME
-- ================================================================

-- Pour revenir aux politiques temporaires:
/*
DROP POLICY IF EXISTS "Owner et Admin - Accès complet" ON reservations;
DROP POLICY IF EXISTS "Cleaner - Lecture seule" ON reservations;

CREATE POLICY "Temp: Auth complet" ON reservations
    FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- Répéter pour chaque table...
*/

-- ================================================================
-- NOTES IMPORTANTES:
-- ================================================================
-- ✅ Politiques granulaires par rôle
-- ✅ Owner a accès complet à tout
-- ✅ Cleaner limité aux fonctions ménage
-- ✅ Données financières protégées (owner uniquement)
-- ✅ Données clients protégées (owner uniquement)
--
-- 📝 Pour tester:
-- 1. Se connecter avec un compte owner → Tout doit fonctionner
-- 2. Se connecter avec un compte cleaner → Limité au ménage
-- 3. Tester sans authentification → Accès refusé
--
-- ⚠️ Si un utilisateur n'a aucun rôle assigné, il ne pourra rien faire
-- ================================================================
