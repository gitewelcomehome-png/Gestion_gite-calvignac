-- 🔍 Diagnostic complet : Où sont les promotions ?

-- 1. Structure COMPLÈTE de la table gites
SELECT 
  column_name,
  data_type,
  column_default
FROM information_schema.columns
WHERE table_name = 'gites'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Voir TOUTES les colonnes pour Trévoux
SELECT *
FROM gites
WHERE name ILIKE '%trévoux%'
  OR name ILIKE '%trevoux%';

-- 3. Vérifier si les promos sont dans une autre table
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND (
    table_name ILIKE '%promo%'
    OR table_name ILIKE '%tarif%'
    OR table_name ILIKE '%regle%'
  );

-- 4. Chercher "last_minute" dans toutes les colonnes JSONB
SELECT 
  name,
  regles_tarifaires::text ILIKE '%last_minute%' as dans_regles_tarifaires,
  tarifs_calendrier::text ILIKE '%last_minute%' as dans_tarifs_calendrier,
  CASE 
    WHEN regles_tarifaires::text ILIKE '%last_minute%' THEN regles_tarifaires
    ELSE NULL
  END as contenu_regles
FROM gites
WHERE name ILIKE '%trévoux%';

-- 5. Extraire la structure exacte si trouvée
SELECT 
  name,
  jsonb_typeof(regles_tarifaires) as type_regles,
  jsonb_pretty(regles_tarifaires) as regles_completes
FROM gites
WHERE name ILIKE '%trévoux%'
  AND regles_tarifaires IS NOT NULL;
