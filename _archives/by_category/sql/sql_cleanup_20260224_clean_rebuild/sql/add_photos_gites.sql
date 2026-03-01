-- ==========================================
-- AJOUT SYSTÈME DE PHOTOS POUR LES GÎTES
-- Date: 14 février 2026
-- ==========================================
-- Description:
-- Ajoute une colonne JSONB pour stocker les photos des gîtes
-- avec catégorisation pour différents usages (couverture, galerie, photos pratiques)
-- Les photos sont stockées dans infos_gites (pas gites) car c'est là que sont gérées toutes les infos détaillées
-- ==========================================

-- Ajout de la colonne photos avec structure par défaut dans infos_gites
ALTER TABLE infos_gites 
ADD COLUMN IF NOT EXISTS photos JSONB DEFAULT '{
  "couverture": null,
  "galerie": [],
  "boite_cles": [],
  "parking": [],
  "entree": [],
  "autres": []
}'::jsonb;

-- Index GIN pour permettre des requêtes rapides sur le JSONB
CREATE INDEX IF NOT EXISTS idx_infos_gites_photos ON infos_gites USING GIN (photos);

-- Commentaire sur la colonne pour documentation
COMMENT ON COLUMN infos_gites.photos IS 'Photos du gîte catégorisées par usage: couverture (string URL), galerie/boite_cles/parking/entree/autres (arrays de {url, description})';

-- Fonction helper pour valider la structure photos (optionnel mais recommandé)
CREATE OR REPLACE FUNCTION validate_infos_gites_photos()
RETURNS TRIGGER AS $$
BEGIN
  -- Vérifier que la structure contient les clés requises
  IF NOT (NEW.photos ? 'couverture' AND 
          NEW.photos ? 'galerie' AND 
          NEW.photos ? 'boite_cles' AND 
          NEW.photos ? 'parking' AND 
          NEW.photos ? 'entree' AND
          NEW.photos ? 'autres') THEN
    RAISE EXCEPTION 'Structure photos invalide. Clés requises: couverture, galerie, boite_cles, parking, entree, autres';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour valider la structure à chaque update
DROP TRIGGER IF EXISTS trigger_validate_infos_gites_photos ON infos_gites;
CREATE TRIGGER trigger_validate_infos_gites_photos
  BEFORE INSERT OR UPDATE OF photos ON infos_gites
  FOR EACH ROW
  EXECUTE FUNCTION validate_infos_gites_photos();

-- ==========================================
-- EXEMPLES D'UTILISATION
-- ==========================================

-- Exemple 1: Ajouter une photo de couverture
-- UPDATE infos_gites 
-- SET photos = jsonb_set(photos, '{couverture}', '"https://storage.supabase.co/.../facade.jpg"')
-- WHERE gite = 'Trevoux';

-- Exemple 2: Ajouter une photo à la galerie
-- UPDATE infos_gites 
-- SET photos = jsonb_set(
--   photos, 
--   '{galerie}', 
--   photos->'galerie' || '{"url": "https://storage.supabase.co/.../salon.jpg", "description": "Salon spacieux"}'::jsonb
-- )
-- WHERE gite = 'Trevoux';

-- Exemple 3: Ajouter des photos de la boîte à clés
-- UPDATE infos_gites 
-- SET photos = jsonb_set(
--   photos, 
--   '{boite_cles}', 
--   '[
--     {"url": "https://storage.supabase.co/.../boite-face.jpg", "description": "Boîte à droite de la porte bleue"},
--     {"url": "https://storage.supabase.co/.../boite-code.jpg", "description": "Vue rapprochée du code"}
--   ]'::jsonb
-- )
-- WHERE gite = 'Trevoux';

-- Exemple 4: Requête pour récupérer tous les gîtes avec leur photo de couverture
-- SELECT id, gite, photos->>'couverture' as photo_couverture
-- FROM infos_gites
-- WHERE photos->>'couverture' IS NOT NULL;

-- ==========================================
-- VÉRIFICATIONS
-- ==========================================

-- Vérifier que la colonne a été ajoutée
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'infos_gites' AND column_name = 'photos';

-- Afficher les gîtes et leur structure photos
SELECT id, gite, photos
FROM infos_gites
LIMIT 5;
