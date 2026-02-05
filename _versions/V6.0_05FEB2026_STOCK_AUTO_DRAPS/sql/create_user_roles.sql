-- ================================================================
-- TABLE USER_ROLES - Gestion des rôles utilisateurs
-- ================================================================
-- Date: 29 janvier 2026
-- Objectif: Gérer les rôles des utilisateurs (owner, admin, cleaner)
-- ================================================================

-- Créer la table si elle n'existe pas
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'cleaner', 'viewer')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Un utilisateur ne peut avoir le même rôle qu'une seule fois
    UNIQUE(user_id, role)
);

-- Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);

-- Commentaires
COMMENT ON TABLE user_roles IS 'Rôles des utilisateurs pour contrôle d''accès';
COMMENT ON COLUMN user_roles.role IS 'owner: Propriétaire complet, admin: Administrateur, cleaner: Femme de ménage, viewer: Lecture seule';

-- ================================================================
-- ACTIVER RLS (Row Level Security)
-- ================================================================

ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- ================================================================
-- POLITIQUES RLS
-- ================================================================

-- Politique 1: Les utilisateurs peuvent voir leurs propres rôles
DROP POLICY IF EXISTS "Utilisateurs voient leurs rôles" ON user_roles;
CREATE POLICY "Utilisateurs voient leurs rôles" ON user_roles
    FOR SELECT
    USING (user_id = auth.uid());

-- Politique 2: Seuls les admins peuvent gérer les rôles
DROP POLICY IF EXISTS "Admins gèrent les rôles" ON user_roles;
CREATE POLICY "Admins gèrent les rôles" ON user_roles
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

-- ================================================================
-- FONCTION HELPER: Vérifier si un utilisateur a un rôle
-- ================================================================

CREATE OR REPLACE FUNCTION has_role(check_user_id UUID, check_role TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = check_user_id
        AND role = check_role
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================================
-- DONNÉES INITIALES: Attribuer le rôle admin au propriétaire
-- ================================================================

-- Ajouter le rôle admin à stephanecalvignac@hotmail.fr
DO $$
DECLARE
    owner_user_id UUID;
BEGIN
    -- Trouver l'utilisateur par email
    SELECT id INTO owner_user_id
    FROM auth.users
    WHERE email = 'stephanecalvignac@hotmail.fr'
    LIMIT 1;
    
    IF owner_user_id IS NOT NULL THEN
        -- Insérer les rôles owner et admin s'ils n'existent pas
        INSERT INTO user_roles (user_id, role)
        VALUES 
            (owner_user_id, 'owner'),
            (owner_user_id, 'admin')
        ON CONFLICT (user_id, role) DO NOTHING;
        
        RAISE NOTICE 'Rôles admin et owner attribués à stephanecalvignac@hotmail.fr';
    ELSE
        RAISE NOTICE 'Utilisateur stephanecalvignac@hotmail.fr non trouvé';
    END IF;
END $$;

-- ================================================================
-- TRIGGER: Mettre à jour updated_at automatiquement
-- ================================================================

CREATE OR REPLACE FUNCTION update_user_roles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_user_roles_updated_at ON user_roles;
CREATE TRIGGER trigger_update_user_roles_updated_at
    BEFORE UPDATE ON user_roles
    FOR EACH ROW
    EXECUTE FUNCTION update_user_roles_updated_at();

-- ================================================================
-- VÉRIFICATION
-- ================================================================

-- Afficher les rôles existants
SELECT 
    ur.id,
    u.email,
    ur.role,
    ur.created_at
FROM user_roles ur
JOIN auth.users u ON u.id = ur.user_id
ORDER BY ur.created_at DESC;
