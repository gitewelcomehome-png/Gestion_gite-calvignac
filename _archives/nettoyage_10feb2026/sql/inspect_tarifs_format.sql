-- Script d'inspection du format des tarifs_calendrier
-- Pour comprendre pourquoi les clés sont "0, 1, 2..." au lieu de dates ISO

-- 1. Voir le contenu brut du JSON tarifs_calendrier pour Trévoux
SELECT 
  id,
  name,
  jsonb_typeof(tarifs_calendrier) as type_json,
  jsonb_pretty(tarifs_calendrier) as tarifs_brut
FROM gites 
WHERE name ILIKE '%trévoux%' OR name ILIKE '%trevoux%';

-- 2. Voir les clés du JSON (devrait être des dates comme "2026-02-16")
SELECT 
  name,
  jsonb_object_keys(tarifs_calendrier) as date_key
FROM gites 
WHERE name ILIKE '%trévoux%' OR name ILIKE '%trevoux%'
  AND tarifs_calendrier IS NOT NULL
LIMIT 10;

-- 3. Vérifier le format pour tous les gîtes
SELECT 
  id,
  name,
  jsonb_typeof(tarifs_calendrier) as type_json,
  CASE 
    WHEN tarifs_calendrier IS NULL THEN 'NULL'
    WHEN jsonb_typeof(tarifs_calendrier) = 'array' THEN 'ARRAY (❌ MAUVAIS FORMAT)'
    WHEN jsonb_typeof(tarifs_calendrier) = 'object' THEN 'OBJECT (✅ BON FORMAT)'
    ELSE 'AUTRE'
  END as diagnostic,
  (
    SELECT string_agg(key, ', ') 
    FROM (
      SELECT jsonb_object_keys(tarifs_calendrier) as key 
      LIMIT 5
    ) sub
  ) as exemples_cles
FROM gites 
WHERE owner_user_id = '12296d3d-696b-4c5d-95b7-e0b3a1dd1814'
  AND is_active = true
ORDER BY name;

-- 4. Vérifier si c'est un problème de conversion array -> object
SELECT 
  name,
  tarifs_calendrier->'0' as valeur_index_0,
  tarifs_calendrier->'2026-02-16' as valeur_date_iso
FROM gites 
WHERE name ILIKE '%trévoux%';

-- 5. Afficher la structure complète d'un gîte avec tarifs
SELECT 
  id,
  name,
  tarifs_calendrier
FROM gites 
WHERE name = '3ème'
  AND owner_user_id = '12296d3d-696b-4c5d-95b7-e0b3a1dd1814';
