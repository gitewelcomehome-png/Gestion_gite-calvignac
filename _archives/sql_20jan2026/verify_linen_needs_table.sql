-- ================================================================
-- VÉRIFICATION : Table linen_needs
-- ================================================================
-- Ce script vérifie que la table linen_needs a été correctement créée

-- 1. Vérifier l'existence de la table
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'linen_needs'
) as table_linen_needs_exists;

-- 2. Afficher la structure de la table
\d public.linen_needs;

-- 3. Vérifier les index
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'linen_needs' 
AND schemaname = 'public';

-- 4. Vérifier RLS activé
SELECT relname, relrowsecurity 
FROM pg_class 
WHERE relname = 'linen_needs';

-- 5. Vérifier les policies RLS
SELECT policyname, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'linen_needs';

-- 6. Compter les besoins par gîte
SELECT 
    g.name as gite_name,
    COUNT(ln.id) as nb_besoins_configures,
    SUM(CASE WHEN ln.is_custom THEN 1 ELSE 0 END) as nb_custom,
    SUM(CASE WHEN NOT ln.is_custom THEN 1 ELSE 0 END) as nb_standard
FROM public.gites g
LEFT JOIN public.linen_needs ln ON ln.gite_id = g.id
GROUP BY g.id, g.name
ORDER BY g.name;

-- 7. Afficher un exemple de besoins configurés
SELECT 
    g.name as gite,
    ln.item_key,
    ln.item_label,
    ln.quantity,
    ln.is_custom,
    ln.created_at
FROM public.linen_needs ln
JOIN public.gites g ON g.id = ln.gite_id
ORDER BY g.name, ln.is_custom, ln.item_key
LIMIT 20;

-- 8. Vérifier les doublons (ne devrait rien retourner)
SELECT gite_id, item_key, COUNT(*) as nb_doublons
FROM public.linen_needs
GROUP BY gite_id, item_key
HAVING COUNT(*) > 1;
