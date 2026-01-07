-- ================================================================
-- TABLE USER_ROLES - Gestion des rôles utilisateurs
-- Phase 1.3 - Politiques RLS granulaires
-- ================================================================
-- Date: 5 janvier 2026
-- À exécuter après activation RLS et authentification fonctionnelle
-- ================================================================

-- ================================================================
-- CRÉATION DE LA TABLE
-- ================================================================

CREATE TABLE IF NOT EXISTS user_roles (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('owner', 'cleaner', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    
    -- Un utilisateur ne peut avoir le même rôle qu'une fois
    UNIQUE(user_id, role)
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);

-- Commentaires
COMMENT ON TABLE user_roles IS 'Gestion des rôles utilisateurs pour contrôle d''accès granulaire';
COMMENT ON COLUMN user_roles.role IS 'owner: Propriétaire (accès complet), cleaner: Femme de ménage (limité), admin: Administrateur';

-- ================================================================
-- ACTIVER RLS SUR LA TABLE user_roles
-- ================================================================

ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- ================================================================
-- POLITIQUES RLS POUR user_roles
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
        auth.uid() IN (
            SELECT user_id FROM user_roles WHERE role = 'admin'
        )
    );

-- ================================================================
-- FONCTION HELPER: Vérifier si un utilisateur a un rôle
-- ================================================================

CREATE OR REPLACE FUNCTION has_role(check_role TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM user_roles 
        WHERE user_id = auth.uid() 
        AND role = check_role
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION has_role IS 'Vérifier si l''utilisateur actuel a un rôle spécifique';

-- ================================================================
-- FONCTION HELPER: Obtenir les rôles d'un utilisateur
-- ================================================================

CREATE OR REPLACE FUNCTION get_user_roles()
RETURNS TABLE(role TEXT) AS $$
BEGIN
    RETURN QUERY
    SELECT ur.role
    FROM user_roles ur
    WHERE ur.user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_user_roles IS 'Récupérer tous les rôles de l''utilisateur actuel';

-- ================================================================
-- DONNÉES INITIALES (À ADAPTER)
-- ================================================================

-- ⚠️ IMPORTANT: Remplacer les UUIDs par les vrais IDs utilisateurs
-- Récupérer les UUIDs depuis: Supabase Dashboard → Authentication → Users

-- Exemple: Assigner le rôle 'owner' au premier utilisateur
-- INSERT INTO user_roles (user_id, role)
-- VALUES (
--     'VOTRE_UUID_UTILISATEUR',  -- À remplacer par le vrai UUID
--     'owner'
-- );

-- Exemple: Créer un utilisateur femme de ménage
-- INSERT INTO user_roles (user_id, role)
-- VALUES (
--     'UUID_FEMME_MENAGE',  -- À remplacer
--     'cleaner'
-- );

-- ================================================================
-- VÉRIFICATION
-- ================================================================

-- Voir la structure de la table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'user_roles'
ORDER BY ordinal_position;

-- Lister les politiques
SELECT 
    policyname,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'user_roles'
ORDER BY policyname;

-- Tester la fonction has_role (après avoir assigné des rôles)
-- SELECT has_role('owner') AS is_owner;
-- SELECT * FROM get_user_roles();

-- ================================================================
-- NOTES:
-- ================================================================
-- 📝 Rôles disponibles:
--    - owner: Propriétaire (accès complet à tout)
--    - cleaner: Femme de ménage (accès limité aux retours ménage)
--    - admin: Administrateur technique (gestion des rôles)
--
-- 📝 Un utilisateur peut avoir plusieurs rôles
-- 📝 Utiliser has_role('owner') dans les politiques RLS des autres tables
-- 📝 Prochaine étape: Affiner les politiques RLS (03_policies_by_role.sql)
-- ================================================================
