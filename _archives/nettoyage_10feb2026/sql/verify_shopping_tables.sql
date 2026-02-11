-- ============================================================================
-- VÉRIFICATION TABLES LISTES D'ACHATS
-- Test rapide pour voir si les tables existent et contiennent des données
-- ============================================================================

-- 1. Vérifier existence des tables
SELECT 
    table_name,
    CASE 
        WHEN table_name IN ('shopping_lists', 'shopping_list_items', 'km_lieux_favoris', 'km_trajets') 
        THEN '✅ Existe'
        ELSE '❌ Manquante'
    END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('shopping_lists', 'shopping_list_items', 'km_lieux_favoris', 'km_trajets')
ORDER BY table_name;

-- 2. Compter les listes de courses
SELECT 
    'shopping_lists' as table_name,
    COUNT(*) as total,
    COUNT(CASE WHEN status = 'en_cours' THEN 1 END) as en_cours,
    COUNT(CASE WHEN status = 'validé' THEN 1 END) as valide
FROM shopping_lists;

-- 3. Compter les items de listes
SELECT 
    'shopping_list_items' as table_name,
    COUNT(*) as total,
    COUNT(CASE WHEN is_checked = true THEN 1 END) as checked,
    COUNT(CASE WHEN is_checked = false THEN 1 END) as unchecked
FROM shopping_list_items;

-- 4. Compter les lieux favoris
SELECT 
    'km_lieux_favoris' as table_name,
    COUNT(*) as total,
    AVG(distance_km) as distance_moyenne
FROM km_lieux_favoris;

-- 5. Voir les dernières listes créées
SELECT 
    id,
    name,
    status,
    created_date,
    owner_user_id
FROM shopping_lists
ORDER BY created_date DESC
LIMIT 5;

-- 6. Vérifier les policies RLS
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE tablename IN ('shopping_lists', 'shopping_list_items')
ORDER BY tablename, policyname;

-- 7. TEST IMPORTANT : Voir si l'utilisateur actuel peut accéder aux données
-- (Cela va retourner les listes de l'utilisateur connecté)
SELECT 
    'TEST ACCESS' as test,
    COUNT(*) as mes_listes
FROM shopping_lists
WHERE owner_user_id = auth.uid();

-- 8. Voir les lieux favoris de l'utilisateur connecté
SELECT 
    'TEST LIEUX' as test,
    COUNT(*) as mes_lieux
FROM km_lieux_favoris
WHERE owner_user_id = auth.uid();
