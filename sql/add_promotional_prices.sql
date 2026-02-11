-- 🎉 Ajouter des tarifs promotionnels
-- Format object : {"2026-02-16": {prix: 170, promo: true, prixOriginal: 210}}

-- ✅ MÉTHODE 1 : Ajouter une promo pour une période (exemple Trévoux)
UPDATE gites
SET tarifs_calendrier = jsonb_set(
  jsonb_set(
    jsonb_set(
      jsonb_set(
        jsonb_set(
          jsonb_set(
            jsonb_set(
              tarifs_calendrier,
              '{2026-02-16}',
              '{"prix": 170, "promo": true, "prixOriginal": 210}'::jsonb,
              true
            ),
            '{2026-02-17}',
            '{"prix": 170, "promo": true, "prixOriginal": 210}'::jsonb,
            true
          ),
          '{2026-02-18}',
          '{"prix": 170, "promo": true, "prixOriginal": 210}'::jsonb,
          true
        ),
        '{2026-02-19}',
        '{"prix": 170, "promo": true, "prixOriginal": 210}'::jsonb,
        true
      ),
      '{2026-02-20}',
      '{"prix": 170, "promo": true, "prixOriginal": 210}'::jsonb,
      true
    ),
    '{2026-02-21}',
    '{"prix": 170, "promo": true, "prixOriginal": 210}'::jsonb,
    true
  ),
  '{2026-02-22}',
  '{"prix": 170, "promo": true, "prixOriginal": 210}'::jsonb,
  true
),
updated_at = NOW()
WHERE name ILIKE '%trévoux%' 
  AND owner_user_id = '12296d3d-696b-4c5d-95b7-e0b3a1dd1814';


-- ✅ MÉTHODE 2 : Fonction pour générer automatiquement une période de promo
DO $$
DECLARE
  gite_id_param UUID := '2ee6c0bb-1a6a-4490-85e6-af75a1ff3f03'; -- ID du gîte Trévoux
  date_debut DATE := '2026-02-16';
  date_fin DATE := '2026-02-22';
  prix_promo NUMERIC := 170;
  prix_normal NUMERIC := 210;
  current_date DATE;
  tarifs_updated JSONB;
BEGIN
  -- Récupérer les tarifs existants
  SELECT tarifs_calendrier INTO tarifs_updated
  FROM gites
  WHERE id = gite_id_param;
  
  -- Si null, initialiser
  IF tarifs_updated IS NULL THEN
    tarifs_updated := '{}'::jsonb;
  END IF;
  
  -- Boucle sur la période
  current_date := date_debut;
  WHILE current_date <= date_fin LOOP
    tarifs_updated := jsonb_set(
      tarifs_updated,
      ARRAY[current_date::text],
      jsonb_build_object(
        'prix', prix_promo,
        'promo', true,
        'prixOriginal', prix_normal
      ),
      true
    );
    current_date := current_date + INTERVAL '1 day';
  END LOOP;
  
  -- Mettre à jour le gîte
  UPDATE gites
  SET 
    tarifs_calendrier = tarifs_updated,
    updated_at = NOW()
  WHERE id = gite_id_param;
  
  RAISE NOTICE '✅ Promo ajoutée du % au % : %€ au lieu de %€', 
    date_debut, date_fin, prix_promo, prix_normal;
END $$;


-- 📊 Vérifier les promos ajoutées
SELECT 
  name,
  tarifs_calendrier->'2026-02-16' as promo_16_fev,
  tarifs_calendrier->'2026-02-17' as promo_17_fev,
  tarifs_calendrier->'2026-02-20' as promo_20_fev
FROM gites
WHERE name ILIKE '%trévoux%';


-- 🔍 Lister tous les jours en promo pour un gîte
SELECT 
  g.name,
  key as date,
  value->>'prix' as prix_promo,
  value->>'prixOriginal' as prix_original,
  value->>'promo' as en_promo
FROM gites g,
     jsonb_each(g.tarifs_calendrier)
WHERE g.name ILIKE '%trévoux%'
  AND value->>'promo' = 'true'
ORDER BY key;


-- ℹ️ Pour RETIRER une promo (revenir au prix normal)
-- UPDATE gites
-- SET tarifs_calendrier = jsonb_set(
--   tarifs_calendrier,
--   '{2026-02-16}',
--   (tarifs_calendrier->'2026-02-16'->>'prixOriginal')::jsonb,
--   true
-- )
-- WHERE name ILIKE '%trévoux%';
