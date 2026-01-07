-- ================================================================
-- FONCTION HELPER POUR ÉVITER RÉCURSION INFINIE
-- ================================================================
-- Cette fonction contourne RLS pour vérifier les rôles
-- Date: 7 janvier 2026
-- ================================================================

-- Fonction qui vérifie si l'utilisateur actuel a un rôle donné
-- SECURITY DEFINER permet de contourner RLS
CREATE OR REPLACE FUNCTION auth.user_has_role(required_role TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid()
        AND role = required_role
    );
END;
$$;

-- Fonction qui retourne TRUE si l'utilisateur est admin
CREATE OR REPLACE FUNCTION auth.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid()
        AND role = 'admin'
    );
END;
$$;

-- Fonction qui retourne TRUE si l'utilisateur est femme de ménage
CREATE OR REPLACE FUNCTION auth.is_femme_menage()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid()
        AND role = 'femme_menage'
    );
END;
$$;

-- ================================================================
-- NOTES
-- ================================================================
-- 
-- SECURITY DEFINER : La fonction s'exécute avec les droits du créateur
--                    Cela contourne RLS et évite la récursion infinie
-- 
-- Utilisation dans les policies:
--   USING (auth.is_admin())
--   USING (auth.user_has_role('admin'))
-- 
-- ================================================================
