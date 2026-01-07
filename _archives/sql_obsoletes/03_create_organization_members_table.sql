-- ================================================================
-- TABLE ORGANIZATION_MEMBERS - Gestion des membres et rôles
-- Phase Multi-Tenant - Étape 1.3
-- ================================================================
-- Date: 7 janvier 2026
-- Description: Table de liaison entre users et organizations
--              Gère les rôles et permissions
-- ================================================================

-- ================================================================
-- CRÉATION DE LA TABLE
-- ================================================================

CREATE TABLE IF NOT EXISTS organization_members (
    -- Identifiants
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Rôle de l'utilisateur dans cette organization
    role TEXT NOT NULL CHECK (
        role IN ('owner', 'admin', 'manager', 'housekeeping', 'viewer')
    ),
    
    -- Permissions spécifiques (override le rôle si nécessaire)
    permissions JSONB DEFAULT '{
        "view_reservations": true,
        "create_reservations": false,
        "edit_reservations": false,
        "delete_reservations": false,
        "view_finances": false,
        "edit_finances": false,
        "view_cleaning": false,
        "edit_cleaning": false,
        "view_statistics": false,
        "manage_users": false,
        "manage_settings": false,
        "manage_billing": false
    }'::jsonb,
    
    -- Restrictions d'accès par gîte (si vide = accès à tous)
    allowed_gites JSONB DEFAULT '[]'::jsonb,  -- Array de gite_ids
    
    -- Invitation
    invited_by UUID REFERENCES auth.users(id),
    invited_at TIMESTAMPTZ DEFAULT NOW(),
    invitation_accepted_at TIMESTAMPTZ,
    invitation_token TEXT UNIQUE,  -- Token pour accepter l'invitation
    invitation_expires_at TIMESTAMPTZ,
    
    -- Statut
    is_active BOOLEAN DEFAULT true,
    deactivated_at TIMESTAMPTZ,
    deactivated_by UUID REFERENCES auth.users(id),
    deactivation_reason TEXT,
    
    -- Préférences utilisateur
    notification_preferences JSONB DEFAULT '{
        "email_new_booking": true,
        "email_cleaning_reminder": true,
        "email_payment_received": true,
        "sms_urgent_only": false
    }'::jsonb,
    
    -- Métadonnées
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_activity_at TIMESTAMPTZ,
    
    -- Contraintes
    UNIQUE(organization_id, user_id),  -- Un user ne peut avoir qu'un seul rôle par org
    CONSTRAINT valid_invitation_token CHECK (
        invitation_token IS NULL OR 
        length(invitation_token) >= 32
    )
);

-- ================================================================
-- INDEX POUR PERFORMANCES
-- ================================================================

CREATE INDEX IF NOT EXISTS idx_org_members_organization ON organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_members_user ON organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_role ON organization_members(role);
CREATE INDEX IF NOT EXISTS idx_org_members_active ON organization_members(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_org_members_token ON organization_members(invitation_token) WHERE invitation_token IS NOT NULL;

-- ================================================================
-- COMMENTAIRES
-- ================================================================

COMMENT ON TABLE organization_members IS 'Liaison users ↔ organizations avec rôles';
COMMENT ON COLUMN organization_members.role IS 'owner: Propriétaire, admin: Admin, manager: Gestionnaire, housekeeping: Ménage, viewer: Lecture seule';
COMMENT ON COLUMN organization_members.permissions IS 'Permissions granulaires (JSON) - override le rôle par défaut';
COMMENT ON COLUMN organization_members.allowed_gites IS 'Liste des gîtes accessibles (vide = tous)';
COMMENT ON COLUMN organization_members.invitation_token IS 'Token unique pour accepter une invitation';

-- ================================================================
-- FONCTIONS HELPER POUR PERMISSIONS
-- ================================================================

-- Obtenir le rôle d'un user dans une organization
CREATE OR REPLACE FUNCTION get_user_role_in_org(
    p_organization_id UUID,
    p_user_id UUID DEFAULT auth.uid()
)
RETURNS TEXT AS $$
    SELECT role 
    FROM organization_members 
    WHERE organization_id = p_organization_id 
    AND user_id = p_user_id 
    AND is_active = true
    LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER;

-- Vérifier si un user a une permission spécifique
CREATE OR REPLACE FUNCTION user_has_permission(
    p_organization_id UUID,
    p_permission TEXT,
    p_user_id UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN AS $$
    SELECT COALESCE(
        (permissions->p_permission)::boolean,
        false
    )
    FROM organization_members 
    WHERE organization_id = p_organization_id 
    AND user_id = p_user_id 
    AND is_active = true
    LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER;

-- Obtenir toutes les organizations d'un user
CREATE OR REPLACE FUNCTION get_user_organizations(p_user_id UUID DEFAULT auth.uid())
RETURNS TABLE (
    organization_id UUID,
    organization_name TEXT,
    organization_slug TEXT,
    user_role TEXT,
    is_owner BOOLEAN
) AS $$
    SELECT 
        o.id,
        o.name,
        o.slug,
        om.role,
        om.role = 'owner'
    FROM organizations o
    INNER JOIN organization_members om ON o.id = om.organization_id
    WHERE om.user_id = p_user_id
    AND om.is_active = true
    AND o.is_active = true
    ORDER BY om.role = 'owner' DESC, o.name;
$$ LANGUAGE SQL SECURITY DEFINER;

-- ================================================================
-- TRIGGER UPDATED_AT
-- ================================================================

CREATE OR REPLACE FUNCTION update_org_members_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_org_members_updated_at ON organization_members;
CREATE TRIGGER trigger_org_members_updated_at
    BEFORE UPDATE ON organization_members
    FOR EACH ROW
    EXECUTE FUNCTION update_org_members_updated_at();

-- ================================================================
-- TRIGGER MISE À JOUR COMPTEUR USERS ORGANIZATION
-- ================================================================

CREATE OR REPLACE FUNCTION update_organization_users_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.is_active = true THEN
        -- Incrémenter le compteur
        UPDATE organizations 
        SET current_users_count = current_users_count + 1
        WHERE id = NEW.organization_id;
        
    ELSIF TG_OP = 'DELETE' AND OLD.is_active = true THEN
        -- Décrémenter le compteur
        UPDATE organizations 
        SET current_users_count = current_users_count - 1
        WHERE id = OLD.organization_id;
        
    ELSIF TG_OP = 'UPDATE' THEN
        -- Changement de statut actif
        IF OLD.is_active = true AND NEW.is_active = false THEN
            UPDATE organizations 
            SET current_users_count = current_users_count - 1
            WHERE id = NEW.organization_id;
        ELSIF OLD.is_active = false AND NEW.is_active = true THEN
            UPDATE organizations 
            SET current_users_count = current_users_count + 1
            WHERE id = NEW.organization_id;
        END IF;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_organization_users_count ON organization_members;
CREATE TRIGGER trigger_update_organization_users_count
    AFTER INSERT OR UPDATE OR DELETE ON organization_members
    FOR EACH ROW
    EXECUTE FUNCTION update_organization_users_count();

-- ================================================================
-- TRIGGER VALIDATION PROPRIÉTAIRE UNIQUE
-- ================================================================

CREATE OR REPLACE FUNCTION validate_single_owner()
RETURNS TRIGGER AS $$
DECLARE
    owner_count INTEGER;
BEGIN
    IF NEW.role = 'owner' THEN
        -- Compter les owners existants (excluant le current)
        SELECT COUNT(*) INTO owner_count
        FROM organization_members
        WHERE organization_id = NEW.organization_id
        AND role = 'owner'
        AND is_active = true
        AND (TG_OP = 'INSERT' OR id != NEW.id);
        
        IF owner_count > 0 THEN
            RAISE EXCEPTION 'Une organization ne peut avoir qu''un seul owner. Transférez d''abord la propriété.';
        END IF;
        
        -- Mettre à jour owner_user_id dans organizations
        UPDATE organizations
        SET owner_user_id = NEW.user_id
        WHERE id = NEW.organization_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_validate_single_owner ON organization_members;
CREATE TRIGGER trigger_validate_single_owner
    BEFORE INSERT OR UPDATE ON organization_members
    FOR EACH ROW
    EXECUTE FUNCTION validate_single_owner();

-- ================================================================
-- TRIGGER GÉNÉRATION TOKEN INVITATION
-- ================================================================

CREATE OR REPLACE FUNCTION generate_invitation_token()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.invitation_token IS NULL AND NEW.invitation_accepted_at IS NULL THEN
        -- Générer un token aléatoire de 64 caractères
        NEW.invitation_token = encode(gen_random_bytes(32), 'hex');
        NEW.invitation_expires_at = NOW() + INTERVAL '7 days';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_generate_invitation_token ON organization_members;
CREATE TRIGGER trigger_generate_invitation_token
    BEFORE INSERT ON organization_members
    FOR EACH ROW
    EXECUTE FUNCTION generate_invitation_token();

-- ================================================================
-- ROW LEVEL SECURITY (RLS)
-- ================================================================
-- NOTE: RLS sera activé dans le script 05_create_rls_policies.sql
--       APRÈS la migration des données

-- ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

-- Policy 1: Les users voient les membres de leurs organizations
-- DROP POLICY IF EXISTS "Users can view members of their organizations" ON organization_members;
-- CREATE POLICY "Users can view members of their organizations" ON organization_members
--     FOR SELECT
--     USING (
--         organization_id IN (
--             SELECT organization_id 
--             FROM organization_members 
--             WHERE user_id = auth.uid()
--         )
--     );

-- Policy 2: Seuls owner/admin peuvent ajouter des membres
-- DROP POLICY IF EXISTS "Admins can add members" ON organization_members;
-- CREATE POLICY "Admins can add members" ON organization_members
--     FOR INSERT
--     WITH CHECK (
--         organization_id IN (
--             SELECT organization_id 
--             FROM organization_members 
--             WHERE user_id = auth.uid() 
--             AND role IN ('owner', 'admin')
--         )
--     );

-- Policy 3: Seuls owner/admin peuvent modifier des membres
-- DROP POLICY IF EXISTS "Admins can update members" ON organization_members;
-- CREATE POLICY "Admins can update members" ON organization_members
--     FOR UPDATE
--     USING (
--         organization_id IN (
--             SELECT organization_id 
--             FROM organization_members 
--             WHERE user_id = auth.uid() 
--             AND role IN ('owner', 'admin')
--         )
--     );

-- Policy 4: Seuls owner/admin peuvent supprimer des membres
-- DROP POLICY IF EXISTS "Admins can delete members" ON organization_members;
-- CREATE POLICY "Admins can delete members" ON organization_members
--     FOR DELETE
--     USING (
--         organization_id IN (
--             SELECT organization_id 
--             FROM organization_members 
--             WHERE user_id = auth.uid() 
--             AND role IN ('owner', 'admin')
--         )
--     );

-- ================================================================
-- PERMISSIONS PAR RÔLE (Valeurs par défaut)
-- ================================================================

-- Fonction pour obtenir les permissions par défaut d'un rôle
CREATE OR REPLACE FUNCTION get_default_permissions_for_role(p_role TEXT)
RETURNS JSONB AS $$
BEGIN
    RETURN CASE p_role
        WHEN 'owner' THEN '{
            "view_reservations": true,
            "create_reservations": true,
            "edit_reservations": true,
            "delete_reservations": true,
            "view_finances": true,
            "edit_finances": true,
            "view_cleaning": true,
            "edit_cleaning": true,
            "view_statistics": true,
            "manage_users": true,
            "manage_settings": true,
            "manage_billing": true
        }'::jsonb
        
        WHEN 'admin' THEN '{
            "view_reservations": true,
            "create_reservations": true,
            "edit_reservations": true,
            "delete_reservations": true,
            "view_finances": true,
            "edit_finances": true,
            "view_cleaning": true,
            "edit_cleaning": true,
            "view_statistics": true,
            "manage_users": true,
            "manage_settings": true,
            "manage_billing": false
        }'::jsonb
        
        WHEN 'manager' THEN '{
            "view_reservations": true,
            "create_reservations": true,
            "edit_reservations": true,
            "delete_reservations": false,
            "view_finances": true,
            "edit_finances": false,
            "view_cleaning": true,
            "edit_cleaning": true,
            "view_statistics": true,
            "manage_users": false,
            "manage_settings": false,
            "manage_billing": false
        }'::jsonb
        
        WHEN 'housekeeping' THEN '{
            "view_reservations": true,
            "create_reservations": false,
            "edit_reservations": false,
            "delete_reservations": false,
            "view_finances": false,
            "edit_finances": false,
            "view_cleaning": true,
            "edit_cleaning": true,
            "view_statistics": false,
            "manage_users": false,
            "manage_settings": false,
            "manage_billing": false
        }'::jsonb
        
        WHEN 'viewer' THEN '{
            "view_reservations": true,
            "create_reservations": false,
            "edit_reservations": false,
            "delete_reservations": false,
            "view_finances": false,
            "edit_finances": false,
            "view_cleaning": false,
            "edit_cleaning": false,
            "view_statistics": true,
            "manage_users": false,
            "manage_settings": false,
            "manage_billing": false
        }'::jsonb
        
        ELSE '{}'::jsonb
    END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Trigger pour appliquer les permissions par défaut
CREATE OR REPLACE FUNCTION apply_default_permissions()
RETURNS TRIGGER AS $$
BEGIN
    -- Si permissions non fournies, utiliser celles du rôle
    IF NEW.permissions = '{}'::jsonb OR NEW.permissions IS NULL THEN
        NEW.permissions = get_default_permissions_for_role(NEW.role);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_apply_default_permissions ON organization_members;
CREATE TRIGGER trigger_apply_default_permissions
    BEFORE INSERT ON organization_members
    FOR EACH ROW
    EXECUTE FUNCTION apply_default_permissions();

-- ================================================================
-- DONNÉES DE TEST (à supprimer en production)
-- ================================================================

-- Exemple d'ajout d'un membre
-- INSERT INTO organization_members (organization_id, user_id, role, invited_by)
-- VALUES (
--     'xxx-org-id-xxx',
--     'xxx-user-id-xxx',
--     'owner',
--     NULL
-- );

-- ================================================================
-- FIN DU SCRIPT
-- ================================================================
