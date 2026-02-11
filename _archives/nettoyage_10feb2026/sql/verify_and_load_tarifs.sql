-- ============================================
-- Script : Vérifier et charger les tarifs
-- Date : 09/02/2026
-- ============================================

-- 1. Vérifier les tarifs existants pour tous les gîtes
SELECT 
  id,
  name,
  CASE 
    WHEN tarifs_calendrier IS NULL THEN '❌ Aucun tarif'
    WHEN jsonb_typeof(tarifs_calendrier) = 'object' THEN 
      '✅ ' || (SELECT COUNT(*) FROM jsonb_object_keys(tarifs_calendrier)) || ' jours configurés'
    ELSE '⚠️ Format inconnu'
  END as statut_tarifs,
  jsonb_pretty(tarifs_calendrier) as preview_tarifs
FROM gites
WHERE owner_user_id = (SELECT id FROM auth.users WHERE email = 'stephanecalvignac@hotmail.fr')
  AND is_active = true
ORDER BY name;

-- 2. Vérifier spécifiquement le gîte Trévoux
SELECT 
  id,
  name,
  tarifs_calendrier->'2026-02-16' as tarif_16_fev,
  tarifs_calendrier->'2026-02-17' as tarif_17_fev,
  tarifs_calendrier->'2026-02-20' as tarif_20_fev,
  tarifs_calendrier->'2026-02-21' as tarif_21_fev
FROM gites
WHERE (name ILIKE '%trévoux%' OR name ILIKE '%trevoux%')
  AND owner_user_id = (SELECT id FROM auth.users WHERE email = 'stephanecalvignac@hotmail.fr');

-- ============================================
-- IMPORT MANUEL DES TARIFS (si nécessaire)
-- ============================================

-- Si les tarifs ne sont pas présents, vous pouvez les importer manuellement :

-- Option A : Copier les tarifs depuis un autre gîte
-- UPDATE gites
-- SET tarifs_calendrier = (
--   SELECT tarifs_calendrier FROM gites WHERE name = 'Gîte Source'
-- )
-- WHERE name ILIKE '%trévoux%';

-- Option B : Ajouter des tarifs manuellement pour un mois
-- UPDATE gites
-- SET tarifs_calendrier = jsonb_build_object(
--   '2026-02-16', 210,
--   '2026-02-17', 210,
--   '2026-02-18', 210,
--   '2026-02-19', 210,
--   '2026-02-20', 210,
--   '2026-02-21', 210,
--   '2026-02-22', 210,
--   '2026-02-23', 210
-- )
-- WHERE name ILIKE '%trévoux%';

-- Option C : Charger depuis regles_tarifaires.prix_base pour un mois complet
-- DO $$
-- DECLARE
--   gite_row RECORD;
--   prix_base NUMERIC;
--   date_courante DATE;
--   tarifs_obj JSONB := '{}'::jsonb;
-- BEGIN
--   -- Récupérer le gîte
--   SELECT * INTO gite_row FROM gites 
--   WHERE name ILIKE '%trévoux%' 
--     AND owner_user_id = (SELECT id FROM auth.users WHERE email = 'stephanecalvignac@hotmail.fr')
--   LIMIT 1;
--   
--   -- Récupérer le prix de base
--   prix_base := (gite_row.regles_tarifaires->>'prix_base')::NUMERIC;
--   
--   IF prix_base IS NOT NULL THEN
--     -- Générer tarifs pour février 2026
--     FOR i IN 1..29 LOOP
--       date_courante := ('2026-02-' || LPAD(i::TEXT, 2, '0'))::DATE;
--       tarifs_obj := jsonb_set(
--         tarifs_obj,
--         ARRAY[to_char(date_courante, 'YYYY-MM-DD')],
--         to_jsonb(prix_base)
--       );
--     END LOOP;
--     
--     -- Mettre à jour le gîte
--     UPDATE gites
--     SET tarifs_calendrier = COALESCE(tarifs_calendrier, '{}'::jsonb) || tarifs_obj
--     WHERE id = gite_row.id;
--     
--     RAISE NOTICE 'Tarifs générés pour février 2026 avec prix de base: %', prix_base;
--   ELSE
--     RAISE NOTICE 'Aucun prix de base trouvé dans regles_tarifaires';
--   END IF;
-- END $$;

-- ============================================
-- DIAGNOSTIC DES PROBLÈMES COURANTS
-- ============================================

-- Problème 1 : Tarifs dans un mauvais format (tableau au lieu d'objet)
-- SELECT id, name, jsonb_typeof(tarifs_calendrier) as type_tarifs
-- FROM gites
-- WHERE jsonb_typeof(tarifs_calendrier) != 'object' AND tarifs_calendrier IS NOT NULL;

-- Problème 2 : Gîte sans prix de base
-- SELECT id, name, regles_tarifaires
-- FROM gites
-- WHERE regles_tarifaires->>'prix_base' IS NULL OR regles_tarifaires IS NULL;

-- ============================================
-- NOTES
-- ============================================
-- 
-- L'application mobile attend le format suivant dans tarifs_calendrier :
-- {
--   "2026-02-16": 210,
--   "2026-02-17": 210,
--   ...
-- }
-- 
-- Ou avec promotions :
-- {
--   "2026-02-16": {"prix": 170, "promo": true, "prixOriginal": 210},
--   ...
-- }
-- 
-- Les tarifs peuvent être importés depuis :
-- 1. La page web de gestion (/pages/tarifs.html)
-- 2. Import iCal des plateformes (Airbnb, Booking, etc.)
-- 3. Saisie manuelle via ce script SQL
-- ============================================
