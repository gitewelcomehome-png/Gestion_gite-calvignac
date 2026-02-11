-- ============================================================================
-- TRANSFERT DES LISTES À UN AUTRE UTILISATEUR
-- Si vous êtes connecté avec un compte différent sur mobile vs web
-- ============================================================================

-- ATTENTION : Remplacez NEW_USER_ID par votre vrai user_id de l'app mobile
-- Pour le trouver, exécutez d'abord debug_auth.sql sur l'app mobile

-- 1. Transférer toutes les listes de courses
UPDATE shopping_lists
SET owner_user_id = 'NEW_USER_ID'  -- ⚠️ REMPLACER PAR LE BON ID
WHERE owner_user_id = '12296d3d-696b-4c5d-95b7-e0b3a1dd1814';

-- 2. Transférer tous les lieux favoris
UPDATE km_lieux_favoris
SET owner_user_id = 'NEW_USER_ID'  -- ⚠️ REMPLACER PAR LE BON ID
WHERE owner_user_id = '12296d3d-696b-4c5d-95b7-e0b3a1dd1814';

-- 3. Vérifier le transfert
SELECT 
    'APRÈS TRANSFERT' as info,
    COUNT(*) as nb_listes
FROM shopping_lists
WHERE owner_user_id = 'NEW_USER_ID';  -- ⚠️ REMPLACER PAR LE BON ID
