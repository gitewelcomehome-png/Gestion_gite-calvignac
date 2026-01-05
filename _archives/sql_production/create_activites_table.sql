-- ====================================
-- Table pour les activités et POIs
-- Gîtes de Calvignac
-- ====================================

-- Créer la table si elle n'existe pas
CREATE TABLE IF NOT EXISTS activites_gites (
    id SERIAL PRIMARY KEY,
    gite VARCHAR(100) NOT NULL,           -- Nom du gîte (trevoux, couzon)
    nom VARCHAR(255) NOT NULL,             -- Nom de l'activité/POI
    type VARCHAR(100),                     -- Type (Restaurant, Musée, Parc, etc.)
    adresse TEXT,                          -- Adresse physique
    latitude DECIMAL(10, 8),               -- Latitude GPS
    longitude DECIMAL(11, 8),              -- Longitude GPS
    distance_km DECIMAL(5, 2),             -- Distance depuis le gîte (km)
    website VARCHAR(500),                  -- URL du site web
    phone VARCHAR(50),                     -- Numéro de téléphone
    opening_hours TEXT,                    -- Horaires d'ouverture (format OSM)
    created_at TIMESTAMP DEFAULT NOW(),    -- Date de création
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- Date de mise à jour
);

-- Ajouter des colonnes optionnelles si besoin
-- ALTER TABLE activites_gites ADD COLUMN IF NOT EXISTS rating DECIMAL(2,1);
-- ALTER TABLE activites_gites ADD COLUMN IF NOT EXISTS wheelchair_accessible BOOLEAN;
-- ALTER TABLE activites_gites ADD COLUMN IF NOT EXISTS outdoor BOOLEAN;

-- Créer les index pour optimiser les recherches
CREATE INDEX IF NOT EXISTS idx_activites_gite 
    ON activites_gites(gite);

CREATE INDEX IF NOT EXISTS idx_activites_type 
    ON activites_gites(type);

CREATE INDEX IF NOT EXISTS idx_activites_coords 
    ON activites_gites(latitude, longitude);

CREATE INDEX IF NOT EXISTS idx_activites_distance 
    ON activites_gites(gite, distance_km);

-- Créer un index pour recherche texte (optionnel, pour recherche par nom)
CREATE INDEX IF NOT EXISTS idx_activites_nom 
    ON activites_gites(nom);

-- ====================================
-- Row Level Security (RLS)
-- ====================================

-- Activer RLS si vous le souhaitez
-- ALTER TABLE activites_gites ENABLE ROW LEVEL SECURITY;

-- Politique pour autoriser la lecture publique
-- CREATE POLICY "Allow public read on activites_gites"
--     ON activites_gites FOR SELECT
--     USING (true);

-- Politique pour autoriser l'insertion (ajuster selon vos besoins)
-- CREATE POLICY "Allow insert on activites_gites"
--     ON activites_gites FOR INSERT
--     WITH CHECK (true);

-- ====================================
-- Vues utiles (optionnel)
-- ====================================

-- Vue pour avoir les stats par gîte et type
CREATE OR REPLACE VIEW v_activites_stats AS
SELECT 
    gite,
    type,
    COUNT(*) as count,
    ROUND(AVG(distance_km)::numeric, 2) as avg_distance,
    MIN(distance_km) as min_distance,
    MAX(distance_km) as max_distance
FROM activites_gites
GROUP BY gite, type
ORDER BY gite, count DESC;

-- Vue pour activités avec coordonnées uniquement
CREATE OR REPLACE VIEW v_activites_avec_coords AS
SELECT *
FROM activites_gites
WHERE latitude IS NOT NULL 
  AND longitude IS NOT NULL
ORDER BY gite, type, distance_km;

-- ====================================
-- Fonctions utiles (optionnel)
-- ====================================

-- Fonction pour calculer la distance entre deux points
CREATE OR REPLACE FUNCTION haversine_distance(
    lat1 DECIMAL,
    lon1 DECIMAL,
    lat2 DECIMAL,
    lon2 DECIMAL
) RETURNS DECIMAL AS $$
DECLARE
    R CONSTANT DECIMAL := 6371;
    delta_lat DECIMAL;
    delta_lon DECIMAL;
    a DECIMAL;
    c DECIMAL;
BEGIN
    delta_lat := RADIANS(lat2 - lat1);
    delta_lon := RADIANS(lon2 - lon1);
    
    a := POWER(SIN(delta_lat / 2), 2) + 
         COS(RADIANS(lat1)) * COS(RADIANS(lat2)) * 
         POWER(SIN(delta_lon / 2), 2);
    
    c := 2 * ASIN(SQRT(a));
    
    RETURN R * c;
END;
$$ LANGUAGE plpgsql;

-- ====================================
-- Exemple d'utilisation
-- ====================================

-- Compter les POIs par gîte
-- SELECT gite, COUNT(*) as total, COUNT(DISTINCT type) as types
-- FROM activites_gites
-- GROUP BY gite;

-- Trouver tous les restaurants dans un rayon de 10 km
-- SELECT nom, adresse, distance_km, phone
-- FROM activites_gites
-- WHERE type LIKE '%Restaurant%'
--   AND gite = 'trevoux'
--   AND distance_km <= 10
-- ORDER BY distance_km;

-- Voir les POIs les plus proches de chaque gîte
-- SELECT gite, nom, type, distance_km
-- FROM activites_gites
-- WHERE (gite, distance_km) IN (
--     SELECT gite, MIN(distance_km)
--     FROM activites_gites
--     GROUP BY gite
-- );

-- Statistiques complètes
-- SELECT * FROM v_activites_stats ORDER BY count DESC;
