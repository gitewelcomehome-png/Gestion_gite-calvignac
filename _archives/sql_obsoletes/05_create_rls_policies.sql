-- ================================================================
-- RLS POLICIES MULTI-TENANT
-- Phase Multi-Tenant - Étape 5
-- ================================================================
-- Date: 7 janvier 2026
-- Description: Politiques Row Level Security pour isolation complète
--              IMPORTANT: À exécuter APRÈS 04_add_tenant_columns.sql
-- ================================================================

-- ================================================================
-- NOTES IMPORTANTES
-- ================================================================
-- Ce script DOIT être exécuté EN DERNIER après:
-- 1. Création des tables (01, 02, 03)
-- 2. Ajout des colonnes (04)
-- 3. Migration des données (06)
-- Puis ce script (05) pour activer l'isolation

-- ================================================================
-- FONCTION HELPER: Obtenir organization_id du user
-- ================================================================

CREATE OR REPLACE FUNCTION get_current_user_organization_ids()
RETURNS TABLE (organization_id UUID) AS $$
BEGIN
    RETURN QUERY
    SELECT om.organization_id
    FROM organization_members om
    WHERE om.user_id = auth.uid()
    AND om.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION get_current_user_organization_ids() IS 
'Retourne toutes les organizations auxquelles le user connecté appartient';

-- ================================================================
-- FONCTION HELPER: Vérifier rôle user
-- ================================================================

CREATE OR REPLACE FUNCTION user_has_role_in_org(
    p_organization_id UUID,
    p_required_roles TEXT[]
)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM organization_members
        WHERE user_id = auth.uid()
        AND organization_id = p_organization_id
        AND role = ANY(p_required_roles)
        AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION user_has_role_in_org IS 
'Vérifie si le user a un des rôles requis dans l''organization';

-- ================================================================
-- FONCTION HELPER: Vérifier permission spécifique
-- ================================================================

CREATE OR REPLACE FUNCTION user_has_permission_in_org(
    p_organization_id UUID,
    p_permission TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM organization_members
        WHERE user_id = auth.uid()
        AND organization_id = p_organization_id
        AND is_active = true
        AND (permissions->p_permission)::boolean = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ================================================================
-- TABLE: reservations
-- ================================================================

-- Activer RLS si pas déjà fait
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

-- Politique SELECT: Les members voient les réservations de leur org
DROP POLICY IF EXISTS "Users can view their organization reservations" ON reservations;
CREATE POLICY "Users can view their organization reservations" 
ON reservations FOR SELECT
USING (
    organization_id IN (SELECT * FROM get_current_user_organization_ids())
);

-- Politique INSERT: Les managers peuvent créer des réservations
DROP POLICY IF EXISTS "Managers can create reservations" ON reservations;
CREATE POLICY "Managers can create reservations" 
ON reservations FOR INSERT
WITH CHECK (
    user_has_permission_in_org(organization_id, 'create_reservations')
);

-- Politique UPDATE: Les managers peuvent modifier des réservations
DROP POLICY IF EXISTS "Managers can update reservations" ON reservations;
CREATE POLICY "Managers can update reservations" 
ON reservations FOR UPDATE
USING (
    user_has_permission_in_org(organization_id, 'edit_reservations')
);

-- Politique DELETE: Les admins peuvent supprimer des réservations
DROP POLICY IF EXISTS "Admins can delete reservations" ON reservations;
CREATE POLICY "Admins can delete reservations" 
ON reservations FOR DELETE
USING (
    user_has_permission_in_org(organization_id, 'delete_reservations')
);

-- ================================================================
-- TABLE: charges
-- ================================================================

ALTER TABLE charges ENABLE ROW LEVEL SECURITY;

-- SELECT: Voir les charges selon permissions finances
DROP POLICY IF EXISTS "Users can view organization charges" ON charges;
CREATE POLICY "Users can view organization charges" 
ON charges FOR SELECT
USING (
    organization_id IN (SELECT * FROM get_current_user_organization_ids())
    AND user_has_permission_in_org(organization_id, 'view_finances')
);

-- INSERT: Créer des charges
DROP POLICY IF EXISTS "Finance managers can create charges" ON charges;
CREATE POLICY "Finance managers can create charges" 
ON charges FOR INSERT
WITH CHECK (
    user_has_permission_in_org(organization_id, 'edit_finances')
);

-- UPDATE: Modifier des charges
DROP POLICY IF EXISTS "Finance managers can update charges" ON charges;
CREATE POLICY "Finance managers can update charges" 
ON charges FOR UPDATE
USING (
    user_has_permission_in_org(organization_id, 'edit_finances')
);

-- DELETE: Supprimer des charges
DROP POLICY IF EXISTS "Finance managers can delete charges" ON charges;
CREATE POLICY "Finance managers can delete charges" 
ON charges FOR DELETE
USING (
    user_has_permission_in_org(organization_id, 'edit_finances')
);

-- ================================================================
-- TABLE: retours_menage
-- ================================================================

ALTER TABLE retours_menage ENABLE ROW LEVEL SECURITY;

-- SELECT: Voir les retours ménage
DROP POLICY IF EXISTS "Users can view cleaning reports" ON retours_menage;
CREATE POLICY "Users can view cleaning reports" 
ON retours_menage FOR SELECT
USING (
    organization_id IN (SELECT * FROM get_current_user_organization_ids())
    AND user_has_permission_in_org(organization_id, 'view_cleaning')
);

-- INSERT: Créer des retours (femmes de ménage aussi)
DROP POLICY IF EXISTS "Housekeepers can create reports" ON retours_menage;
CREATE POLICY "Housekeepers can create reports" 
ON retours_menage FOR INSERT
WITH CHECK (
    user_has_permission_in_org(organization_id, 'edit_cleaning')
);

-- UPDATE: Modifier des retours
DROP POLICY IF EXISTS "Housekeepers can update reports" ON retours_menage;
CREATE POLICY "Housekeepers can update reports" 
ON retours_menage FOR UPDATE
USING (
    user_has_permission_in_org(organization_id, 'edit_cleaning')
);

-- DELETE: Supprimer (managers uniquement)
DROP POLICY IF EXISTS "Managers can delete reports" ON retours_menage;
CREATE POLICY "Managers can delete reports" 
ON retours_menage FOR DELETE
USING (
    user_has_role_in_org(organization_id, ARRAY['owner', 'admin', 'manager'])
);

-- ================================================================
-- TABLE: stocks_draps
-- ================================================================

ALTER TABLE stocks_draps ENABLE ROW LEVEL SECURITY;

-- SELECT: Tous les members peuvent voir le stock
DROP POLICY IF EXISTS "Users can view linen stocks" ON stocks_draps;
CREATE POLICY "Users can view linen stocks" 
ON stocks_draps FOR SELECT
USING (
    organization_id IN (SELECT * FROM get_current_user_organization_ids())
);

-- INSERT/UPDATE/DELETE: Managers et femmes de ménage
DROP POLICY IF EXISTS "Housekeepers can manage stocks" ON stocks_draps;
CREATE POLICY "Housekeepers can manage stocks" 
ON stocks_draps FOR ALL
USING (
    user_has_permission_in_org(organization_id, 'edit_cleaning')
);

-- ================================================================
-- TABLE: infos_pratiques (si existe)
-- ================================================================

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'infos_pratiques') THEN
        EXECUTE 'ALTER TABLE infos_pratiques ENABLE ROW LEVEL SECURITY';
        
        -- SELECT
        DROP POLICY IF EXISTS "Users can view practical infos" ON infos_pratiques;
        EXECUTE '
        CREATE POLICY "Users can view practical infos" 
        ON infos_pratiques FOR SELECT
        USING (
            organization_id IN (SELECT * FROM get_current_user_organization_ids())
        )';
        
        -- UPDATE: Managers uniquement
        DROP POLICY IF EXISTS "Managers can edit practical infos" ON infos_pratiques;
        EXECUTE '
        CREATE POLICY "Managers can edit practical infos" 
        ON infos_pratiques FOR ALL
        USING (
            user_has_role_in_org(organization_id, ARRAY[''owner'', ''admin'', ''manager''])
        )';
        
        RAISE NOTICE 'RLS policies créées pour infos_pratiques';
    END IF;
END $$;

-- ================================================================
-- POLICIES SPÉCIALES: Super Admin (optionnel)
-- ================================================================

-- Pour un éventuel compte super-admin qui peut voir toutes les orgs
-- Décommenter si nécessaire

/*
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM auth.users
        WHERE id = auth.uid()
        AND raw_user_meta_data->>'is_super_admin' = 'true'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Ajouter à chaque policy:
-- OR is_super_admin()
*/

-- ================================================================
-- VÉRIFICATION RLS
-- ================================================================

-- Fonction pour vérifier que RLS est activé partout
CREATE OR REPLACE FUNCTION verify_rls_enabled()
RETURNS TABLE (
    table_name TEXT,
    rls_enabled BOOLEAN,
    policy_count INTEGER,
    status TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.tablename::TEXT,
        t.rowsecurity as rls_enabled,
        (
            SELECT COUNT(*)::INTEGER
            FROM pg_policies p
            WHERE p.tablename = t.tablename
        ) as policy_count,
        CASE 
            WHEN t.rowsecurity = true AND (
                SELECT COUNT(*) FROM pg_policies p WHERE p.tablename = t.tablename
            ) >= 4 THEN '✅ OK'
            WHEN t.rowsecurity = false THEN '❌ RLS DÉSACTIVÉ'
            ELSE '⚠️ PEU DE POLICIES'
        END as status
    FROM pg_tables t
    WHERE t.schemaname = 'public'
    AND t.tablename IN (
        'organizations',
        'gites',
        'organization_members',
        'reservations',
        'charges',
        'retours_menage',
        'stocks_draps',
        'infos_pratiques'
    )
    ORDER BY t.tablename;
END;
$$ LANGUAGE plpgsql;

-- Lancer la vérification
-- SELECT * FROM verify_rls_enabled();

-- ================================================================
-- FONCTION: Tester isolation
-- ================================================================

-- Test manuel pour vérifier que l'isolation fonctionne
CREATE OR REPLACE FUNCTION test_rls_isolation()
RETURNS TABLE (
    test_name TEXT,
    result TEXT,
    details TEXT
) AS $$
DECLARE
    v_org1_id UUID;
    v_org2_id UUID;
    v_user1_id UUID;
    v_user2_id UUID;
BEGIN
    -- Créer 2 organizations test
    INSERT INTO organizations (name, slug, email)
    VALUES ('Test Org 1', 'test-org-1', 'test1@example.com')
    RETURNING id INTO v_org1_id;
    
    INSERT INTO organizations (name, slug, email)
    VALUES ('Test Org 2', 'test-org-2', 'test2@example.com')
    RETURNING id INTO v_org2_id;
    
    -- TODO: Créer users et tester
    
    RETURN QUERY SELECT 
        'Test isolation'::TEXT,
        '⏳ En cours'::TEXT,
        'Fonction à compléter après migration auth'::TEXT;
    
    -- Cleanup
    DELETE FROM organizations WHERE slug LIKE 'test-org-%';
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- MONITORING: Logs d'accès (optionnel)
-- ================================================================

-- Table pour logger les accès (debugging)
CREATE TABLE IF NOT EXISTS rls_access_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID,
    organization_id UUID,
    table_name TEXT,
    operation TEXT,
    accessed_at TIMESTAMPTZ DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT
);

-- Fonction pour logger (à appeler depuis les triggers si nécessaire)
CREATE OR REPLACE FUNCTION log_rls_access(
    p_table_name TEXT,
    p_operation TEXT,
    p_organization_id UUID
)
RETURNS void AS $$
BEGIN
    INSERT INTO rls_access_logs (user_id, organization_id, table_name, operation)
    VALUES (auth.uid(), p_organization_id, p_table_name, p_operation);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Auto-purge des logs > 30 jours
CREATE OR REPLACE FUNCTION purge_old_rls_logs()
RETURNS void AS $$
BEGIN
    DELETE FROM rls_access_logs
    WHERE accessed_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- RÉSUMÉ
-- ================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '==================================================';
    RAISE NOTICE 'RLS POLICIES MULTI-TENANT CRÉÉES';
    RAISE NOTICE '==================================================';
    RAISE NOTICE '✅ organizations → Policies créées dans 01';
    RAISE NOTICE '✅ gites → Policies créées dans 02';
    RAISE NOTICE '✅ organization_members → Policies créées dans 03';
    RAISE NOTICE '✅ reservations → 4 policies (SELECT/INSERT/UPDATE/DELETE)';
    RAISE NOTICE '✅ charges → 4 policies avec check finances';
    RAISE NOTICE '✅ retours_menage → 4 policies avec check cleaning';
    RAISE NOTICE '✅ stocks_draps → 2 policies';
    RAISE NOTICE '✅ infos_pratiques → 2 policies (si table existe)';
    RAISE NOTICE '';
    RAISE NOTICE 'VÉRIFICATION:';
    RAISE NOTICE '→ SELECT * FROM verify_rls_enabled();';
    RAISE NOTICE '';
    RAISE NOTICE 'PROCHAINE ÉTAPE:';
    RAISE NOTICE '→ Tester avec différents users';
    RAISE NOTICE '→ Vérifier isolation complète';
    RAISE NOTICE '==================================================';
END $$;

-- ================================================================
-- FIN DU SCRIPT
-- ================================================================
