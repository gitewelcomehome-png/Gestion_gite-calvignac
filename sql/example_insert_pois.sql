-- ====================================
-- EXEMPLE COMPLET D'INSERTION
-- Gîtes de Calvignac - POIs
-- ====================================
-- Ce fichier montre exactement ce que le script génère
-- Généré: 2025-12-21

-- ====================================
-- 1. CRÉER LA TABLE (Une seule fois)
-- ====================================

CREATE TABLE IF NOT EXISTS activites_gites (
    id SERIAL PRIMARY KEY,
    gite VARCHAR(100) NOT NULL,
    nom VARCHAR(255) NOT NULL,
    type VARCHAR(100),
    adresse TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    distance_km DECIMAL(5, 2),
    website VARCHAR(500),
    phone VARCHAR(50),
    opening_hours TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Créer les index
CREATE INDEX IF NOT EXISTS idx_activites_gite ON activites_gites(gite);
CREATE INDEX IF NOT EXISTS idx_activites_type ON activites_gites(type);
CREATE INDEX IF NOT EXISTS idx_activites_coords ON activites_gites(latitude, longitude);

-- ====================================
-- 2. EXEMPLE D'INSERTION (À ADAPTER)
-- ====================================

-- Exemple pour Trévoux - 5 POIs
INSERT INTO activites_gites (gite, nom, type, adresse, latitude, longitude, distance_km, website, phone, opening_hours)
VALUES
-- Restaurants
('trevoux', 'Restaurant Le Vieux Moulin', 'Restaurant', '42 Rue de la Côte, Trévoux', 45.97315, 4.80080, 0.5, 'http://levieuxmoulin.fr', '+33 4 74 00 85 09', '12:00-14:00,19:00-22:00'),
('trevoux', 'Café de la Place', 'Café/Bar', 'Place Centrale, Trévoux', 45.97402, 4.80156, 0.3, NULL, '+33 4 74 00 90 23', '08:00-23:00'),

-- Attractions
('trevoux', 'Château de Trévoux', 'Château', 'Route du Château, Trévoux', 45.97250, 4.79950, 1.2, 'http://chateau-trevoux.com', '+33 4 74 00 95 45', '10:00-18:00'),
('trevoux', 'Musée Local', 'Musée', 'Rue de la Mairie, Trévoux', 45.97440, 4.80300, 0.7, NULL, '+33 4 74 00 88 12', 'Mer-Dim 14:00-18:00'),

-- Parc
('trevoux', 'Parc de la Côte', 'Parc', 'Avenue du Parc, Trévoux', 45.97850, 4.80500, 1.5, NULL, NULL, NULL),

-- Exemple pour Couzon - 5 POIs
('couzon', 'Restaurant La Montagne', 'Restaurant', 'Route du Mont, Couzon', 45.82450, 4.81560, 0.4, 'http://lamontagne.fr', '+33 4 74 05 70 22', '12:00-14:00,19:00-21:30'),
('couzon', 'Bar de l''Altitude', 'Café/Bar', 'Centre Village, Couzon', 45.82490, 4.81520, 0.2, NULL, '+33 4 74 05 75 88', '07:00-23:00'),

-- Attraction
('couzon', 'Chapelle Saint-Michel', 'Chapelle', 'Sommet du Mont, Couzon', 45.82920, 4.81250, 2.3, NULL, NULL, NULL),

-- POI avec tous les champs
('couzon', 'Pharmacie Centrale', 'Pharmacie', 'Rue Principale, Couzon', 45.82400, 4.81600, 0.1, 'http://pharmacie-couzon.fr', '+33 4 74 05 80 44', 'Lun-Sam 09:00-12:30,14:30-19:00'),

-- POI minimaliste
('couzon', 'Point Pique-Nique Vue', 'Pique-nique', 'Clairière, Couzon', 45.83120, 4.81890, 1.8, NULL, NULL, NULL);

-- ====================================
-- 3. VÉRIFICATION
-- ====================================

-- Vérifier le nombre d'insertions
SELECT COUNT(*) as total FROM activites_gites WHERE created_at >= NOW() - INTERVAL '1 hour';

-- Compter par gîte
SELECT gite, COUNT(*) as count
FROM activites_gites
WHERE created_at >= NOW() - INTERVAL '1 hour'
GROUP BY gite;

-- Compter par type
SELECT type, COUNT(*) as count
FROM activites_gites
WHERE created_at >= NOW() - INTERVAL '1 hour'
GROUP BY type
ORDER BY count DESC;

-- Voir les POIs avec tous les champs
SELECT 
    gite,
    nom,
    type,
    distance_km,
    CASE 
        WHEN website IS NOT NULL THEN '🌐'
        ELSE ''
    END as web,
    CASE 
        WHEN phone IS NOT NULL THEN '📞'
        ELSE ''
    END as tel
FROM activites_gites
WHERE created_at >= NOW() - INTERVAL '1 hour'
ORDER BY gite, type, distance_km
LIMIT 20;

-- ====================================
-- 4. REQUÊTES UTILES
-- ====================================

-- Trouver tous les restaurants à Trévoux (rayon 10 km)
SELECT nom, adresse, distance_km, phone, website
FROM activites_gites
WHERE gite = 'trevoux'
  AND type = 'Restaurant'
  AND distance_km <= 10
ORDER BY distance_km;

-- TOP 10 POIs les plus proches par gîte
WITH ranked AS (
    SELECT 
        gite,
        nom,
        type,
        distance_km,
        ROW_NUMBER() OVER (PARTITION BY gite ORDER BY distance_km) as rank
    FROM activites_gites
)
SELECT gite, nom, type, distance_km
FROM ranked
WHERE rank <= 10
ORDER BY gite, distance_km;

-- Statistiques par gîte
SELECT 
    gite,
    COUNT(*) as total_pois,
    COUNT(DISTINCT type) as types_differents,
    ROUND(AVG(distance_km)::numeric, 2) as distance_moyenne,
    MIN(distance_km) as poi_le_plus_proche,
    MAX(distance_km) as poi_le_plus_loin,
    SUM(CASE WHEN phone IS NOT NULL THEN 1 ELSE 0 END) as avec_telephone,
    SUM(CASE WHEN website IS NOT NULL THEN 1 ELSE 0 END) as avec_website
FROM activites_gites
GROUP BY gite;

-- POIs avec informations complètes (web + téléphone)
SELECT 
    gite,
    nom,
    type,
    adresse,
    distance_km,
    website,
    phone,
    opening_hours
FROM activites_gites
WHERE website IS NOT NULL 
  OR phone IS NOT NULL
ORDER BY gite, distance_km
LIMIT 20;

-- ====================================
-- 5. NETTOYAGE (SI BESOIN)
-- ====================================

-- Supprimer les doublons (garder le plus ancien)
DELETE FROM activites_gites a
WHERE a.id NOT IN (
    SELECT MIN(b.id)
    FROM activites_gites b
    WHERE a.gite = b.gite
      AND a.nom = b.nom
      AND a.type = b.type
    GROUP BY b.gite, b.nom, b.type
);

-- Supprimer les POIs sans coordonnées (optionnel)
-- DELETE FROM activites_gites WHERE latitude IS NULL OR longitude IS NULL;

-- ====================================
-- 6. MISE À JOUR
-- ====================================

-- Ajouter des coordonnées manquantes
-- UPDATE activites_gites
-- SET latitude = 45.9731, longitude = 4.8008
-- WHERE gite = 'trevoux' AND latitude IS NULL;

-- Recalculer les distances (si vous avez les coordonnées des gîtes)
-- UPDATE activites_gites
-- SET distance_km = haversine_distance(45.9731, 4.8008, latitude, longitude)
-- WHERE gite = 'trevoux';

-- ====================================
-- NOTES IMPORTANTES
-- ====================================

/*
1. Les structures de table générées automatiquement par search_pois.js 
   contiennent TOUS les champs nécessaires.

2. Champ 'distance_km' = distance depuis le gîte
   Calculée avec la formule de Haversine

3. Les données du web/téléphone/horaires viennent d'OpenStreetMap
   Certaines peuvent être vides (c'est normal)

4. Les coordonnées (latitude/longitude) sont au format:
   - Latitude: -90 à +90 (format: 45.97315)
   - Longitude: -180 à +180 (format: 4.80080)

5. Vous pouvez ajouter d'autres colonnes selon vos besoins:
   ALTER TABLE activites_gites ADD COLUMN IF NOT EXISTS reviews_count INT;
   ALTER TABLE activites_gites ADD COLUMN IF NOT EXISTS rating DECIMAL(2,1);

6. Pour les requêtes géospatiales avancées, installez PostGIS:
   CREATE EXTENSION IF NOT EXISTS PostGIS;
   ALTER TABLE activites_gites ADD COLUMN geom GEOMETRY(POINT, 4326);
   UPDATE activites_gites SET geom = ST_Point(longitude, latitude, 4326);
*/

-- ====================================
-- FIN
-- ====================================
