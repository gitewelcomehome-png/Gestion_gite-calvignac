-- ====================================
-- Ajouter la colonne distance_km à la table activites_gites
-- Exécuter ce script dans Supabase SQL Editor
-- ====================================

-- Ajouter la colonne distance_km si elle n'existe pas
ALTER TABLE activites_gites 
ADD COLUMN IF NOT EXISTS distance_km DECIMAL(5, 2);

-- Ajouter un commentaire
COMMENT ON COLUMN activites_gites.distance_km IS 'Distance en kilomètres depuis le gîte correspondant';

-- Créer un index pour optimiser les recherches par distance
CREATE INDEX IF NOT EXISTS idx_activites_distance 
    ON activites_gites(gite, distance_km);

-- Mettre à jour les distances existantes (optionnel)
-- Cette requête calcule les distances en utilisant la formule de Haversine
-- Coordonnées Trévoux: 45.9406, 4.7715
-- Coordonnées Couzon: 45.8383, 4.8286

UPDATE activites_gites
SET distance_km = CASE 
    WHEN gite = 'Trévoux' THEN 
        ROUND(
            (6371 * acos(
                cos(radians(45.9406)) * cos(radians(latitude)) * 
                cos(radians(longitude) - radians(4.7715)) + 
                sin(radians(45.9406)) * sin(radians(latitude))
            ))::numeric, 
            2
        )
    WHEN gite = 'Couzon' THEN 
        ROUND(
            (6371 * acos(
                cos(radians(45.8383)) * cos(radians(latitude)) * 
                cos(radians(longitude) - radians(4.8286)) + 
                sin(radians(45.8383)) * sin(radians(latitude))
            ))::numeric, 
            2
        )
END
WHERE latitude IS NOT NULL 
    AND longitude IS NOT NULL 
    AND distance_km IS NULL;

-- Vérifier le résultat
SELECT gite, nom, distance_km, latitude, longitude 
FROM activites_gites 
ORDER BY gite, distance_km 
LIMIT 20;
