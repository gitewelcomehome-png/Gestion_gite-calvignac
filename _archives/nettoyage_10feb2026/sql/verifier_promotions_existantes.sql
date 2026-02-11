-- 🔍 Vérifier les promotions EXISTANTES pour Trévoux

-- 1. Voir toutes les données de Trévoux
SELECT 
  id,
  name,
  jsonb_pretty(regles_tarifaires) as regles_completes
FROM gites
WHERE name ILIKE '%trévoux%'
  OR name ILIKE '%trevoux%';

-- 2. Extraction spécifique des promotions
SELECT 
  name,
  regles_tarifaires->'promotions' as promotions_config,
  regles_tarifaires->'prix_base' as prix_base
FROM gites
WHERE name ILIKE '%trévoux%';

-- 3. Vérifier tous les gîtes avec promotions actives
SELECT 
  name,
  regles_tarifaires->'promotions'->'last_minute' as last_minute_config,
  regles_tarifaires->'promotions'->'early_booking' as early_booking_config
FROM gites
WHERE owner_user_id = '12296d3d-696b-4c5d-95b7-e0b3a1dd1814'
  AND is_active = true
ORDER BY name;
