-- 🔧 Migration des tarifs_calendrier : ARRAY → OBJECT
-- Problème : Les tarifs sont stockés en format array [{date, prix_nuit}]
-- Solution : Convertir en format object {"2026-02-16": 170}

-- ⚠️ BACKUP AUTOMATIQUE avant migration
CREATE TABLE IF NOT EXISTS _backup_tarifs_calendrier_09feb2026 AS
SELECT id, name, tarifs_calendrier, updated_at
FROM gites
WHERE tarifs_calendrier IS NOT NULL
  AND jsonb_typeof(tarifs_calendrier) = 'array';

-- 📊 Diagnostic : Combien de gîtes à migrer ?
SELECT 
  COUNT(*) as total_gites,
  SUM(CASE WHEN jsonb_typeof(tarifs_calendrier) = 'array' THEN 1 ELSE 0 END) as format_array,
  SUM(CASE WHEN jsonb_typeof(tarifs_calendrier) = 'object' THEN 1 ELSE 0 END) as format_object,
  SUM(CASE WHEN tarifs_calendrier IS NULL THEN 1 ELSE 0 END) as sans_tarifs
FROM gites
WHERE owner_user_id = '12296d3d-696b-4c5d-95b7-e0b3a1dd1814';

-- 🔄 MIGRATION : Convertir array en object
DO $$
DECLARE
  gite_record RECORD;
  tarif_item JSONB;
  new_tarifs JSONB;
  date_key TEXT;
  prix_value NUMERIC;
BEGIN
  -- Pour chaque gîte avec tarifs en format array
  FOR gite_record IN 
    SELECT id, name, tarifs_calendrier
    FROM gites
    WHERE owner_user_id = '12296d3d-696b-4c5d-95b7-e0b3a1dd1814'
      AND jsonb_typeof(tarifs_calendrier) = 'array'
  LOOP
    RAISE NOTICE '🔄 Migration gîte: %', gite_record.name;
    
    -- Initialiser l'objet vide
    new_tarifs := '{}'::jsonb;
    
    -- Pour chaque élément du tableau
    FOR tarif_item IN 
      SELECT * FROM jsonb_array_elements(gite_record.tarifs_calendrier)
    LOOP
      -- Extraire date et prix_nuit
      date_key := tarif_item->>'date';
      prix_value := (tarif_item->>'prix_nuit')::numeric;
      
      IF date_key IS NOT NULL AND prix_value IS NOT NULL THEN
        -- Ajouter au nouvel objet : {"2026-02-16": 170}
        new_tarifs := jsonb_set(
          new_tarifs, 
          ARRAY[date_key], 
          to_jsonb(prix_value),
          true
        );
      END IF;
    END LOOP;
    
    -- Mettre à jour le gîte
    UPDATE gites
    SET 
      tarifs_calendrier = new_tarifs,
      updated_at = NOW()
    WHERE id = gite_record.id;
    
    RAISE NOTICE '✅ % : % dates migrées', gite_record.name, (SELECT COUNT(*) FROM jsonb_object_keys(new_tarifs));
  END LOOP;
  
  RAISE NOTICE '🎉 Migration terminée !';
END $$;

-- ✅ Vérification post-migration
SELECT 
  name,
  jsonb_typeof(tarifs_calendrier) as nouveau_type,
  (
    SELECT COUNT(*) 
    FROM jsonb_object_keys(tarifs_calendrier)
  ) as nb_dates,
  (
    SELECT string_agg(key, ', ')
    FROM (
      SELECT jsonb_object_keys(tarifs_calendrier) as key
      LIMIT 3
    ) sub
  ) as exemples_dates
FROM gites
WHERE owner_user_id = '12296d3d-696b-4c5d-95b7-e0b3a1dd1814'
  AND tarifs_calendrier IS NOT NULL
ORDER BY name;

-- 📋 Exemple de données migrées pour Trévoux
SELECT 
  name,
  tarifs_calendrier->'2026-02-16' as prix_16_fev,
  tarifs_calendrier->'2026-02-17' as prix_17_fev,
  tarifs_calendrier->'2026-02-18' as prix_18_fev
FROM gites
WHERE name ILIKE '%trévoux%';

-- ℹ️ ROLLBACK si besoin :
-- UPDATE gites g
-- SET tarifs_calendrier = b.tarifs_calendrier, updated_at = b.updated_at
-- FROM _backup_tarifs_calendrier_09feb2026 b
-- WHERE g.id = b.id;
