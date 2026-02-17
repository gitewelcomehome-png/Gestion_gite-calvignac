-- ============================================
-- Script : Ajouter exemple de prix promo
-- Date : 09/02/2026
-- ============================================
-- Ce script ajoute un exemple de prix promotionnel
-- pour la semaine du 16 février 2026 sur le gîte Trévoux

-- 1. Récupérer l'ID du gîte Trévoux
-- (remplacer par le bon ID si différent)

-- 2. Exemple de mise à jour avec prix promo pour la semaine du 16 février
UPDATE gites
SET tarifs_calendrier = jsonb_set(
  COALESCE(tarifs_calendrier, '{}'::jsonb),
  '{2026-02-16}',
  '{"prix": 170, "promo": true, "prixOriginal": 210}'::jsonb
)
WHERE name ILIKE '%trévoux%' OR name ILIKE '%trevoux%';

-- Ajouter d'autres jours de la semaine avec promo
UPDATE gites
SET tarifs_calendrier = 
  jsonb_set(
    jsonb_set(
      jsonb_set(
        jsonb_set(
          jsonb_set(
            jsonb_set(
              COALESCE(tarifs_calendrier, '{}'::jsonb),
              '{2026-02-17}', '{"prix": 170, "promo": true, "prixOriginal": 210}'::jsonb
            ),
            '{2026-02-18}', '{"prix": 170, "promo": true, "prixOriginal": 210}'::jsonb
          ),
          '{2026-02-19}', '{"prix": 170, "promo": true, "prixOriginal": 210}'::jsonb
        ),
        '{2026-02-20}', '{"prix": 170, "promo": true, "prixOriginal": 210}'::jsonb
      ),
      '{2026-02-21}', '{"prix": 170, "promo": true, "prixOriginal": 210}'::jsonb
    ),
    '{2026-02-22}', '{"prix": 170, "promo": true, "prixOriginal": 210}'::jsonb
  )
WHERE name ILIKE '%trévoux%' OR name ILIKE '%trevoux%';

-- 3. Vérifier les modifications
SELECT 
  id,
  name,
  tarifs_calendrier->'2026-02-16' as tarif_16_fev,
  tarifs_calendrier->'2026-02-17' as tarif_17_fev,
  tarifs_calendrier->'2026-02-18' as tarif_18_fev
FROM gites
WHERE name ILIKE '%trévoux%' OR name ILIKE '%trevoux%';

-- ============================================
-- NOTES IMPORTANTES
-- ============================================
-- 
-- Format des tarifs avec promo :
-- {
--   "prix": 170,           // Prix actuel (en promo)
--   "promo": true,         // Indicateur de promo
--   "prixOriginal": 210    // Prix barré (avant promo)
-- }
--
-- Format des tarifs normaux (reste compatible) :
-- Simple nombre : 210
-- 
-- L'application mobile affiche automatiquement :
-- - Prix barré si prixOriginal existe
-- - Prix en rouge si promo = true
-- - Badge 🎉 pour indiquer la promo
-- ============================================
