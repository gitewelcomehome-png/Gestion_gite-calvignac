-- ==========================================
-- VÉRIFICATION: Table infos_gites
-- À exécuter dans Supabase SQL Editor
-- ==========================================

-- 1. Vérifier que la table existe
SELECT 
    'Table existe:' as check_type,
    COUNT(*) > 0 as resultat
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'infos_gites';

-- 2. Vérifier RLS
SELECT 
    'RLS activé:' as check_type,
    relrowsecurity as resultat
FROM pg_class 
WHERE relname = 'infos_gites';

-- 3. Lister les policies
SELECT 
    'Policies RLS:' as check_type,
    policyname as resultat
FROM pg_policies 
WHERE tablename = 'infos_gites';

-- 4. Vérifier les colonnes
SELECT 
    'Colonnes (20 premières):' as check_type,
    string_agg(column_name, ', ') as resultat
FROM (
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'infos_gites' 
    ORDER BY ordinal_position 
    LIMIT 20
) t;

-- 5. Compter les lignes existantes
SELECT 
    'Nombre de lignes:' as check_type,
    COUNT(*) as resultat
FROM infos_gites;

-- 6. Test d'insertion (commenté - décommentez si besoin)
/*
-- Remplacez YOUR_USER_ID par votre vrai user ID (récupérez-le avec: SELECT auth.uid();)
INSERT INTO infos_gites (gite, owner_user_id, adresse, telephone, email)
VALUES (
    '3ème', 
    'YOUR_USER_ID'::uuid,
    'Test adresse',
    '06 12 34 56 78',
    'test@example.com'
)
ON CONFLICT (gite) DO UPDATE SET
    adresse = EXCLUDED.adresse,
    date_modification = NOW();
*/
