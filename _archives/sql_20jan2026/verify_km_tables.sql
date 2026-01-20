-- ==========================================
-- VÉRIFICATION DES TABLES KILOMÈTRES
-- Date : 19/01/2026
-- ==========================================

-- 1. Vérifier si les tables existent
SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'public' AND table_name = t.table_name) as colonnes
FROM information_schema.tables t
WHERE table_schema = 'public' 
AND table_name IN ('km_trajets', 'km_config_auto', 'km_lieux_favoris')
ORDER BY table_name;

-- 2. Vérifier la colonne distance_km dans gites
SELECT 
    EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'gites' 
        AND column_name = 'distance_km'
    ) as colonne_distance_km_existe;

-- 3. Compter les trajets existants
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'km_trajets')
        THEN (SELECT COUNT(*) FROM public.km_trajets)
        ELSE 0
    END as nb_trajets;

-- 4. Vérifier les politiques RLS
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE tablename IN ('km_trajets', 'km_config_auto', 'km_lieux_favoris')
ORDER BY tablename, policyname;
