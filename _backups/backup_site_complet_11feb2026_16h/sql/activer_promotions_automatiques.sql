-- 🔍 Vérifier et activer les promotions automatiques

-- 1. État actuel des promotions pour tous les gîtes
SELECT 
  id,
  name,
  jsonb_pretty(regles_tarifaires->'promotions') as promotions_actuelles,
  regles_tarifaires->'prix_base' as prix_base
FROM gites
WHERE owner_user_id = '12296d3d-696b-4c5d-95b7-e0b3a1dd1814'
  AND is_active = true
ORDER BY name;

-- 2. Activer Last Minute (-20%, 7 jours) pour TOUS les gîtes
UPDATE gites
SET regles_tarifaires = jsonb_set(
  COALESCE(regles_tarifaires, '{}'::jsonb),
  '{promotions,last_minute}',
  '{"actif": true, "pourcentage": 20, "jours_avant": 7}'::jsonb,
  true
),
updated_at = NOW()
WHERE owner_user_id = '12296d3d-696b-4c5d-95b7-e0b3a1dd1814'
  AND is_active = true;

-- 3. Activer Early Bird (-10%, 30 jours) pour TOUS les gîtes
UPDATE gites
SET regles_tarifaires = jsonb_set(
  regles_tarifaires,
  '{promotions,early_booking}',
  '{"actif": true, "pourcentage": 10, "jours_avant": 30}'::jsonb,
  true
),
updated_at = NOW()
WHERE owner_user_id = '12296d3d-696b-4c5d-95b7-e0b3a1dd1814'
  AND is_active = true;

-- 4. Vérification après activation
SELECT 
  name,
  regles_tarifaires->'prix_base' as prix_base,
  regles_tarifaires->'promotions'->'last_minute'->>'actif' as last_minute_actif,
  regles_tarifaires->'promotions'->'last_minute'->>'pourcentage' as last_minute_pct,
  regles_tarifaires->'promotions'->'early_booking'->>'actif' as early_booking_actif,
  regles_tarifaires->'promotions'->'early_booking'->>'pourcentage' as early_booking_pct
FROM gites
WHERE owner_user_id = '12296d3d-696b-4c5d-95b7-e0b3a1dd1814'
  AND is_active = true
ORDER BY name;

-- 5. Vérifier que les gîtes ont bien un prix_base défini
SELECT 
  name,
  COALESCE(regles_tarifaires->'prix_base', 'NULL'::jsonb) as prix_base_actuel,
  CASE 
    WHEN regles_tarifaires->'prix_base' IS NULL THEN '❌ MANQUANT'
    ELSE '✅ OK'
  END as statut
FROM gites
WHERE owner_user_id = '12296d3d-696b-4c5d-95b7-e0b3a1dd1814'
  AND is_active = true;

-- 6. Si prix_base manquant, le définir à 150€ par défaut
UPDATE gites
SET regles_tarifaires = jsonb_set(
  COALESCE(regles_tarifaires, '{}'::jsonb),
  '{prix_base}',
  '150'::jsonb,
  true
)
WHERE owner_user_id = '12296d3d-696b-4c5d-95b7-e0b3a1dd1814'
  AND is_active = true
  AND (regles_tarifaires->'prix_base' IS NULL);

-- 7. Résumé final
SELECT 
  '✅ Configuration promotions' as titre,
  COUNT(*) as nb_gites,
  SUM(CASE WHEN regles_tarifaires->'promotions'->'last_minute'->>'actif' = 'true' THEN 1 ELSE 0 END) as avec_last_minute,
  SUM(CASE WHEN regles_tarifaires->'promotions'->'early_booking'->>'actif' = 'true' THEN 1 ELSE 0 END) as avec_early_booking,
  SUM(CASE WHEN regles_tarifaires->'prix_base' IS NOT NULL THEN 1 ELSE 0 END) as avec_prix_base
FROM gites
WHERE owner_user_id = '12296d3d-696b-4c5d-95b7-e0b3a1dd1814'
  AND is_active = true;
