-- =====================================================
-- SCRIPT DE NETTOYAGE COMPLET
-- =====================================================
-- ATTENTION : Ce script supprime TOUTES les données
-- À utiliser uniquement en développement/test
-- =====================================================

-- 1. Supprimer toutes les réservations
DELETE FROM public.reservations;

-- 2. Supprimer tous les gîtes
DELETE FROM public.gites;

-- 3. Supprimer tous les membres d'organisations
DELETE FROM public.organization_members;

-- 4. Supprimer toutes les organisations
DELETE FROM public.organizations;

-- 5. Supprimer tous les utilisateurs (auth.users)
-- ATTENTION : nécessite les permissions service_role
DELETE FROM auth.users;

-- 6. Réinitialiser les séquences (IDs)
ALTER SEQUENCE IF EXISTS public.organizations_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS public.gites_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS public.reservations_id_seq RESTART WITH 1;

-- 7. Vérification : afficher le nombre d'enregistrements restants
SELECT 
  'organizations' as table_name, 
    COUNT(*) as count 
    FROM public.organizations
    UNION ALL
    SELECT 
      'gites', 
        COUNT(*) 
        FROM public.gites
        UNION ALL
        SELECT 
          'organization_members', 
            COUNT(*) 
            FROM public.organization_members
            UNION ALL
            SELECT 
              'reservations', 
                COUNT(*) 
                FROM public.reservations
                UNION ALL
                SELECT 
                  'auth.users', 
                    COUNT(*) 
                    FROM auth.users;

                    -- =====================================================
                    -- FIN DU SCRIPT
                    -- =====================================================
                    -- Résultat attendu : toutes les tables doivent avoir count = 0
                    -- =====================================================
                    