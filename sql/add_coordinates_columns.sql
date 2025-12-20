-- Ajouter les colonnes latitude et longitude à la table activites_gites
ALTER TABLE activites_gites
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

-- Commenter les colonnes
COMMENT ON COLUMN activites_gites.latitude IS 'Latitude GPS de l''activité (géocodée depuis l''adresse)';
COMMENT ON COLUMN activites_gites.longitude IS 'Longitude GPS de l''activité (géocodée depuis l''adresse)';
