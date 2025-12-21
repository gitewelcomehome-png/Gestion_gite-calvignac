-- ====================================
-- EXEMPLE D'INSERTION POUR STRUCTURE RÉELLE
-- Table: activites_gites (Supabase)
-- ====================================
-- Adapté à la structure réelle de votre table
-- Généré: 2025-12-21

-- ====================================
-- STRUCTURE DE LA TABLE
-- ====================================
-- gite: 'Trévoux' ou 'Couzon'
-- nom: String (nom de l'activité)
-- categorie: String (type d'activité)
-- description: Text (optionnel)
-- adresse: String (adresse complète)
-- distance: Numeric(5,1) (distance en km depuis gîte)
-- website: Text (URL si disponible)
-- telephone: Text (téléphone si disponible)
-- note: Numeric(2,1) (0-5 étoiles, NULL par défaut)
-- avis: Integer (nombre d'avis, NULL par défaut)
-- prix: Text ('€', '€€', '€€€', '€€€€', NULL)
-- google_maps_link: Text (lien Google Maps)
-- latitude/longitude: Numeric (coordonnées GPS)

-- ====================================
-- EXEMPLE D'INSERTION (10 POIs)
-- ====================================

INSERT INTO activites_gites (
    gite, nom, categorie, adresse, 
    latitude, longitude, distance, 
    website, telephone, note, avis, prix, google_maps_link
) VALUES

-- TRÉVOUX - Restaurants
('Trévoux', 'Restaurant Le Vieux Moulin', 'Restaurant', '42 Rue de la Côte, Trévoux', 45.97315, 4.80080, 0.5, 'http://levieuxmoulin.fr', '+33 4 74 00 85 09', 4.5, 128, '€€', 'https://www.google.com/maps?q=45.97315,4.80080'),
('Trévoux', 'Brasserie Central', 'Restaurant', 'Place Centrale, Trévoux', 45.97402, 4.80156, 0.3, NULL, '+33 4 74 00 90 23', NULL, NULL, '€€', 'https://www.google.com/maps?q=45.97402,4.80156'),

-- TRÉVOUX - Attractions
('Trévoux', 'Château de Trévoux', 'Château', 'Route du Château, Trévoux', 45.97250, 4.79950, 1.2, 'http://chateau-trevoux.com', '+33 4 74 00 95 45', 4.7, 256, NULL, 'https://www.google.com/maps?q=45.97250,4.79950'),
('Trévoux', 'Musée Local', 'Musée', 'Rue de la Mairie, Trévoux', 45.97440, 4.80300, 0.7, NULL, '+33 4 74 00 88 12', 4.2, 89, NULL, 'https://www.google.com/maps?q=45.97440,4.80300'),
('Trévoux', 'Parc de la Côte', 'Parc', 'Avenue du Parc, Trévoux', 45.97850, 4.80500, 1.5, NULL, NULL, NULL, NULL, NULL, 'https://www.google.com/maps?q=45.97850,4.80500'),

-- COUZON - Restaurants
('Couzon', 'Restaurant La Montagne', 'Restaurant', 'Route du Mont, Couzon', 45.82450, 4.81560, 0.4, 'http://lamontagne.fr', '+33 4 74 05 70 22', 4.6, 142, '€€€', 'https://www.google.com/maps?q=45.82450,4.81560'),
('Couzon', 'Bar de l''Altitude', 'Café/Bar', 'Centre Village, Couzon', 45.82490, 4.81520, 0.2, NULL, '+33 4 74 05 75 88', NULL, NULL, '€', 'https://www.google.com/maps?q=45.82490,4.81520'),

-- COUZON - Attractions
('Couzon', 'Chapelle Saint-Michel', 'Chapelle', 'Sommet du Mont, Couzon', 45.82920, 4.81250, 2.3, NULL, NULL, 4.8, 312, NULL, 'https://www.google.com/maps?q=45.82920,4.81250'),
('Couzon', 'Pharmacie Centrale', 'Pharmacie', 'Rue Principale, Couzon', 45.82400, 4.81600, 0.1, 'http://pharmacie-couzon.fr', '+33 4 74 05 80 44', NULL, NULL, NULL, 'https://www.google.com/maps?q=45.82400,4.81600'),
('Couzon', 'Point Pique-Nique Vue', 'Parc', 'Clairière, Couzon', 45.83120, 4.81890, 1.8, NULL, NULL, NULL, NULL, NULL, 'https://www.google.com/maps?q=45.83120,4.81890');

-- ====================================
-- VÉRIFICATION
-- ====================================

-- Compter par gîte et catégorie
SELECT 
    gite,
    categorie,
    COUNT(*) as count,
    ROUND(AVG(distance)::numeric, 1) as distance_moyenne
FROM activites_gites
WHERE created_at >= NOW() - INTERVAL '1 hour'
GROUP BY gite, categorie
ORDER BY gite, count DESC;

-- Voir les 10 POIs les plus proches
SELECT 
    gite,
    nom,
    categorie,
    distance,
    CASE WHEN website IS NOT NULL THEN '🌐' ELSE '' END as web,
    CASE WHEN telephone IS NOT NULL THEN '📞' ELSE '' END as tel,
    note
FROM activites_gites
WHERE created_at >= NOW() - INTERVAL '1 hour'
ORDER BY distance
LIMIT 10;

-- Statistiques complètes par gîte
SELECT 
    gite,
    COUNT(*) as total,
    COUNT(DISTINCT categorie) as categories,
    ROUND(AVG(distance)::numeric, 1) as distance_moyenne,
    COUNT(CASE WHEN website IS NOT NULL THEN 1 END) as avec_website,
    COUNT(CASE WHEN telephone IS NOT NULL THEN 1 END) as avec_telephone,
    COUNT(CASE WHEN note IS NOT NULL THEN 1 END) as avec_note
FROM activites_gites
WHERE created_at >= NOW() - INTERVAL '1 hour'
GROUP BY gite;

-- ====================================
-- REQUÊTES UTILES
-- ====================================

-- Tous les restaurants à Trévoux
-- SELECT nom, adresse, distance, telephone, website, note
-- FROM activites_gites
-- WHERE gite = 'Trévoux'
--   AND categorie = 'Restaurant'
-- ORDER BY distance;

-- POIs avec évaluation (note >= 4)
-- SELECT gite, nom, categorie, distance, note, avis
-- FROM activites_gites
-- WHERE note IS NOT NULL AND note >= 4
-- ORDER BY note DESC, avis DESC;

-- POIs avec information complète (website + telephone)
-- SELECT gite, nom, categorie, distance, telephone, website
-- FROM activites_gites
-- WHERE website IS NOT NULL AND telephone IS NOT NULL
-- ORDER BY gite, distance;

-- ====================================
-- FIN EXEMPLE
-- ====================================
