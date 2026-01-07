-- ================================================================
-- SCRIPT ADMIN - Donner droits administrateur
-- ================================================================
-- Date: 7 janvier 2026
-- Objectif: Donner les droits admin à l'utilisateur principal
-- 
-- ⚠️ À exécuter APRÈS avoir créé ton compte via onboarding.html
-- ================================================================

-- Méthode 1: Par email (RECOMMANDÉ)
-- Remplace 'ton@email.com' par ton email de connexion

UPDATE organization_members
SET role = 'owner',
    permissions = '{"admin": true, "full_access": true}'::jsonb
FROM auth.users
WHERE organization_members.user_id = auth.users.id
  AND auth.users.email = 'gite.welcomehome@gmail.com';  -- ⚠️ CHANGE TON EMAIL ICI

-- Vérifier que ça a marché
SELECT 
    u.email,
    om.role,
    o.name as organization_name
FROM organization_members om
JOIN auth.users u ON u.id = om.user_id
JOIN organizations o ON o.id = om.organization_id
WHERE u.email = 'gite.welcomehome@gmail.com';  -- ⚠️ CHANGE TON EMAIL ICI

-- ================================================================
-- Méthode 2: Par ID utilisateur (si tu connais ton user_id)
-- ================================================================

-- Trouver ton user_id
-- SELECT id, email FROM auth.users WHERE email = 'ton@email.com';

-- Puis donner les droits
-- UPDATE organization_members
-- SET role = 'owner',
--     permissions = '{"admin": true, "full_access": true}'::jsonb
-- WHERE user_id = 'REMPLACE-PAR-TON-USER-ID';

-- ================================================================
-- Méthode 3: Donner droits admin à TOUS les owners (pratique pour dev)
-- ================================================================

-- UPDATE organization_members
-- SET permissions = jsonb_set(
--     COALESCE(permissions, '{}'::jsonb),
--     '{admin}',
--     'true'::jsonb
-- )
-- WHERE role = 'owner';

-- ================================================================
-- RÉSULTAT ATTENDU
-- ================================================================
-- 
-- Tu devrais voir:
-- email                      | role  | organization_name
-- -------------------------- | ----- | ------------------
-- gite.welcomehome@gmail.com | owner | Gîtes Calvignac
-- 
-- ✅ Si tu vois ça, tu as les pleins pouvoirs !
-- ================================================================
