-- AUDIT COMPLET - cleaning_schedule
-- Exécutez ce script dans Supabase SQL Editor pour diagnostiquer le problème

-- 1) Vérifier que la table existe
SELECT 'Table cleaning_schedule existe' AS check_1, 
       EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cleaning_schedule') AS resultat;

-- 2) Lister toutes les colonnes de la table
SELECT 'Colonnes de cleaning_schedule' AS check_2;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'cleaning_schedule'
ORDER BY ordinal_position;

-- 3) Vérifier si RLS est activé
SELECT 'RLS activé?' AS check_3,
       relrowsecurity AS rls_enabled
FROM pg_class
WHERE relname = 'cleaning_schedule';

-- 4) Lister les politiques RLS actives
SELECT 'Politiques RLS' AS check_4;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'cleaning_schedule';

-- 5) Tester l'user ID actuel
SELECT 'User ID actuel' AS check_5, auth.uid() AS current_user_id;

-- 6) Compter les lignes existantes pour cet utilisateur
SELECT 'Nombre de ménages pour cet utilisateur' AS check_6, 
       COUNT(*) as count
FROM cleaning_schedule
WHERE owner_user_id = auth.uid();

-- 7) Afficher les 5 dernières lignes
SELECT 'Derniers ménages' AS check_7;
SELECT id, owner_user_id, reservation_id, scheduled_date, status, 
       validated_by_company, proposed_by
FROM cleaning_schedule
WHERE owner_user_id = auth.uid()
ORDER BY created_at DESC
LIMIT 5;
