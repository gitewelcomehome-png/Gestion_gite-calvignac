-- ================================================================
-- POLITIQUES RLS TEMPORAIRES - Phase 1 Sécurité
-- Créer des politiques RLS de base pour utilisateurs authentifiés
-- ================================================================
-- Date: 5 janvier 2026
-- À exécuter AVANT d'activer RLS (01_enable_rls_all_tables.sql)
-- Ces politiques sont TEMPORAIRES - Elles seront affinées en Phase 1.3
-- ================================================================

-- STRATÉGIE TEMPORAIRE:
-- Accès complet pour TOUT utilisateur authentifié (auth.uid() IS NOT NULL)
-- Permet de tester l'authentification sans bloquer l'application

-- ================================================================
-- CRÉATION AUTOMATIQUE DES POLITIQUES POUR TOUTES LES TABLES
-- ================================================================

DO $$
DECLARE
    table_record RECORD;
    policy_name TEXT;
BEGIN
    -- Boucle sur toutes les tables publiques
    FOR table_record IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
    LOOP
        policy_name := 'Temp: Utilisateurs authentifiés - Accès complet';
        
        -- Supprimer la politique si elle existe déjà
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', 
            policy_name, 
            table_record.tablename
        );
        
        -- Créer la politique temporaire
        EXECUTE format('
            CREATE POLICY %I ON %I
            FOR ALL 
            USING (auth.uid() IS NOT NULL)
            WITH CHECK (auth.uid() IS NOT NULL)',
            policy_name,
            table_record.tablename
        );
        
        RAISE NOTICE 'Politique créée pour: %', table_record.tablename;
    END LOOP;
    
    RAISE NOTICE '✅ Politiques temporaires créées pour toutes les tables';
END $$;

-- ================================================================
-- VÉRIFICATION DES POLITIQUES CRÉÉES
-- ================================================================

SELECT 
    tablename,
    policyname,
    CASE 
        WHEN cmd = 'ALL' THEN '✅ Toutes opérations'
        ELSE cmd
    END AS operations,
    CASE 
        WHEN qual LIKE '%auth.uid()%' THEN '✅ Authentification requise'
        ELSE '❌ Accès public'
    END AS securite
FROM pg_policies
WHERE schemaname = 'public'
  AND policyname LIKE 'Temp:%'
ORDER BY tablename;

-- ================================================================
-- ALTERNATIVE: POLITIQUES MANUELLES POUR TABLES CRITIQUES
-- (Si le script automatique échoue)
-- ================================================================

/*
-- Réservations
DROP POLICY IF EXISTS "Temp: Auth complet" ON reservations;
CREATE POLICY "Temp: Auth complet" ON reservations
    FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- Charges
DROP POLICY IF EXISTS "Temp: Auth complet" ON charges;
CREATE POLICY "Temp: Auth complet" ON charges
    FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- Retours ménage
DROP POLICY IF EXISTS "Temp: Auth complet" ON retours_menage;
CREATE POLICY "Temp: Auth complet" ON retours_menage
    FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- Fiches clients
DROP POLICY IF EXISTS "Temp: Auth complet" ON fiches_clients;
CREATE POLICY "Temp: Auth complet" ON fiches_clients
    FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- Répéter pour chaque table...
*/

-- ================================================================
-- NOTES IMPORTANTES:
-- ================================================================
-- ⚠️ Ces politiques sont TEMPORAIRES et PERMISSIVES
-- ⚠️ Tout utilisateur authentifié a accès à TOUT
-- ⚠️ Elles seront remplacées par des politiques granulaires en Phase 1.3
-- ✅ Permettent de tester l'authentification sans tout casser
-- ✅ Bloquent l'accès anonyme (non authentifié)
-- 
-- PROCHAINE ÉTAPE: Créer la table user_roles et affiner les politiques
-- ================================================================
