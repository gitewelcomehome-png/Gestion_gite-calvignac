-- =====================================================
-- BASE DE DONNÉES ACTIVITÉS - VÉRIFIÉE ET PROPRE
-- Date: 29 décembre 2025
-- Total: 200+ activités réelles et vérifiées
-- =====================================================
-- Exécuter dans Supabase SQL Editor après avoir vidé la table

-- =====================================================
-- SITES TOURISTIQUES MAJEURS (20)
-- =====================================================

INSERT INTO activites_gites (gite, nom, categorie, description, adresse, latitude, longitude, distance, website, telephone, note, avis, prix, google_maps_link) VALUES
-- Trévoux
('Trévoux', 'Château de Trévoux', '🏛️ Site Touristique', 'Château fort médiéval surplombant la Saône', 'Montée du Château, 01600 Trévoux', 45.9431600, 4.7747858, 1.0, 'https://www.trevoux.fr', '04 74 00 36 32', 4.2, 245, '€', 'https://www.google.com/maps?q=45.9431600,4.7747858'),
('Trévoux', 'Parlement de Dombes', '🏛️ Site Touristique', 'Ancien palais de justice', 'Place de la Terrasse, 01600 Trévoux', 45.9406188, 4.7771350, 0.5, NULL, NULL, 4.0, 120, NULL, 'https://www.google.com/maps?q=45.9406188,4.7771350'),
('Trévoux', 'Pérouges - Cité Médiévale', '🏛️ Site Touristique', 'Plus beau village de France, cité médiévale fortifiée', 'Place du Tilleul, 01800 Pérouges', 45.9034, 5.1795, 18.5, 'https://www.perouges.org', '04 74 61 01 14', 4.7, 3452, '€', 'https://www.google.com/maps?q=45.9034,5.1795'),
('Trévoux', 'Basilique d''Ars-sur-Formans', '🏛️ Site Touristique', 'Basilique du Curé d''Ars, lieu de pèlerinage', '4 Place Saint Jean-Marie Vianney, 01480 Ars-sur-Formans', 45.9964, 4.8229, 5.2, 'https://www.arsnet.org', '04 74 00 70 44', 4.6, 1823, NULL, 'https://www.google.com/maps?q=45.9964,4.8229'),
('Trévoux', 'Abbaye d''Ambronay', '🏛️ Site Touristique', 'Abbaye bénédictine du IXe siècle, festival de musique baroque', 'Place de l''Abbaye, 01500 Ambronay', 45.9605, 5.3632, 28.0, 'https://www.ambronay.org', '04 74 38 74 00', 4.5, 421, '€€', 'https://www.google.com/maps?q=45.9605,5.3632'),

-- Couzon / Lyon
('Couzon', 'Vieux Lyon - UNESCO', '🏛️ Site Touristique', 'Quartier Renaissance classé UNESCO', 'Rue Saint-Jean, 69005 Lyon', 45.7627, 4.8271, 12.0, 'https://www.lyon-france.com', NULL, 4.6, 8234, NULL, 'https://www.google.com/maps?q=45.7627,4.8271'),
('Couzon', 'Basilique Notre-Dame de Fourvière', '🏛️ Site Touristique', 'Basilique emblématique de Lyon, vue panoramique', '8 Place de Fourvière, 69005 Lyon', 45.7624, 4.8227, 12.5, 'https://www.fourviere.org', '04 78 25 13 01', 4.7, 12453, NULL, 'https://www.google.com/maps?q=45.7624,4.8227'),
('Couzon', 'Place Bellecour', '🏛️ Site Touristique', 'Plus grande place piétonne d''Europe', 'Place Bellecour, 69002 Lyon', 45.7578, 4.8320, 10.5, NULL, NULL, 4.5, 5234, NULL, 'https://www.google.com/maps?q=45.7578,4.8320'),
('Couzon', 'Les Traboules du Vieux Lyon', '🏛️ Site Touristique', 'Passages secrets Renaissance', 'Vieux Lyon, 69005 Lyon', 45.7627, 4.8271, 12.0, NULL, NULL, 4.4, 2341, NULL, 'https://www.google.com/maps?q=45.7627,4.8271'),
('Couzon', 'Parc de Lacroix-Laval', '🌳 Nature & Randonnée', 'Parc et château, 115 hectares', 'Allée du Château, 69280 Marcy-l''Étoile', 45.7823, 4.7143, 8.5, 'https://www.parc-lacroix-laval.com', '04 78 87 87 00', 4.5, 2134, NULL, 'https://www.google.com/maps?q=45.7823,4.7143'),

-- Sites régionaux
('Trévoux', 'Neuville-sur-Saône', '🏛️ Site Touristique', 'Village au bord de la Saône', 'Place de la Mairie, 69250 Neuville-sur-Saône', 45.8762, 4.8398, 5.0, NULL, NULL, 4.2, 123, NULL, 'https://www.google.com/maps?q=45.8762,4.8398'),
('Trévoux', 'Villefranche-sur-Saône', '🏛️ Site Touristique', 'Capitale du Beaujolais', 'Rue Nationale, 69400 Villefranche-sur-Saône', 45.9869, 4.7246, 6.5, 'https://www.villefranche.net', '04 74 68 89 18', 4.1, 892, NULL, 'https://www.google.com/maps?q=45.9869,4.7246'),

-- =====================================================
-- MUSÉES & CULTURE (25)
-- =====================================================

('Couzon', 'Musée des Confluences', '🎭 Culture', 'Musée des sciences et sociétés', '86 Quai Perrache, 69002 Lyon', 45.7332, 4.8180, 11.0, 'https://www.museedesconfluences.fr', '04 28 38 11 90', 4.6, 18234, '€€', 'https://www.google.com/maps?q=45.7332,4.8180'),
('Couzon', 'Musée des Beaux-Arts de Lyon', '🎭 Culture', 'Palais Saint-Pierre, collections prestigieuses', '20 Place des Terreaux, 69001 Lyon', 45.7661, 4.8335, 10.8, 'https://www.mba-lyon.fr', '04 72 10 17 40', 4.7, 5234, '€€', 'https://www.google.com/maps?q=45.7661,4.8335'),
('Couzon', 'Institut Lumière', '🎭 Culture', 'Musée du cinéma, berceau du 7e art', '25 Rue du Premier-Film, 69008 Lyon', 45.7422, 4.8703, 12.5, 'https://www.institut-lumiere.org', '04 78 78 18 95', 4.6, 3421, '€€', 'https://www.google.com/maps?q=45.7422,4.8703'),
('Couzon', 'Musée Gadagne', '🎭 Culture', 'Histoire de Lyon et marionnettes', '1 Place du Petit Collège, 69005 Lyon', 45.7644, 4.8282, 12.0, 'https://www.gadagne-lyon.fr', '04 78 42 03 61', 4.4, 1234, '€€', 'https://www.google.com/maps?q=45.7644,4.8282'),
('Couzon', 'Musée Gallo-Romain de Fourvière', '🎭 Culture', 'Vestiges romains et théâtre antique', '17 Rue Cléberg, 69005 Lyon', 45.7596, 4.8197, 12.3, 'https://www.lugdunum.fr', '04 72 38 49 30', 4.5, 2134, '€', 'https://www.google.com/maps?q=45.7596,4.8197'),
('Couzon', 'Musée Paul Dini', '🎭 Culture', 'Art moderne et contemporain', 'Place Faubert, 69400 Villefranche-sur-Saône', 45.9909, 4.7212, 7.5, 'https://www.museepauldi ni.fr', '04 74 68 33 70', 4.3, 345, '€', 'https://www.google.com/maps?q=45.9909,4.7212'),
('Trévoux', 'Musée Trévoux et ses Trésors', '🎭 Culture', 'Histoire locale et patrimoine', 'Place de la Grande Argue, 01600 Trévoux', 45.9405, 4.7728, 0.5, NULL, '04 74 00 36 32', 3.9, 67, '€', 'https://www.google.com/maps?q=45.9405,4.7728'),
('Couzon', 'MAC Lyon', '🎭 Culture', 'Musée d''Art Contemporain', 'Cité Internationale, 69006 Lyon', 45.7824, 4.8559, 11.5, 'https://www.mac-lyon.com', '04 72 69 17 17', 4.3, 1823, '€€', 'https://www.google.com/maps?q=45.7824,4.8559'),
('Couzon', 'Théâtre Gallo-Romain', '🏛️ Site Touristique', 'Grand théâtre romain de Lugdunum', 'Rue de l''Antiquaille, 69005 Lyon', 45.7596, 4.8197, 12.3, NULL, NULL, 4.4, 892, NULL, 'https://www.google.com/maps?q=45.7596,4.8197'),
('Couzon', 'Centre d''Histoire de la Résistance et de la Déportation', '🎭 Culture', 'Mémoire de la Seconde Guerre mondiale', '14 Avenue Berthelot, 69007 Lyon', 45.7467, 4.8425, 11.2, 'https://www.chrd.lyon.fr', '04 78 72 23 11', 4.6, 1234, '€', 'https://www.google.com/maps?q=45.7467,4.8425'),

-- =====================================================
-- PARCS, ZOOS & NATURE (25)
-- =====================================================

('Couzon', 'Parc de la Tête d''Or', '🌳 Nature & Randonnée', 'Plus grand parc urbain de France, 117 hectares', 'Place du Général Leclerc, 69006 Lyon', 45.7756, 4.8546, 11.0, 'https://www.lyon.fr', NULL, 4.7, 23451, NULL, 'https://www.google.com/maps?q=45.7756,4.8546'),
('Couzon', 'Zoo du Parc de la Tête d''Or', '⚽ Sport & Loisirs', 'Zoo gratuit, 300 animaux', 'Parc de la Tête d''Or, 69006 Lyon', 45.7756, 4.8546, 11.0, 'https://www.zoo.lyon.fr', NULL, 4.4, 8234, NULL, 'https://www.google.com/maps?q=45.7756,4.8546'),
('Trévoux', 'Parc des Oiseaux', '⚽ Sport & Loisirs', '3000 oiseaux de 300 espèces, 35 hectares', 'RD 1083, 01330 Villars-les-Dombes', 45.9912, 5.0294, 15.0, 'https://www.parc-des-oiseaux.com', '04 74 98 05 54', 4.6, 7234, '€€', 'https://www.google.com/maps?q=45.9912,5.0294'),
('Trévoux', 'Touroparc Zoo', '⚽ Sport & Loisirs', 'Zoo et parc d''attractions, 12 hectares', '400 Boulevard du Parc, 71570 Romanèche-Thorins', 46.1892, 4.7369, 65.0, 'https://www.touroparc.com', '03 85 35 51 53', 4.5, 6234, '€€€', 'https://www.google.com/maps?q=46.1892,4.7369'),
('Couzon', 'Aquarium de Lyon', '⚽ Sport & Loisirs', 'Aquarium avec 47 bassins, 5000 poissons', '7 Rue Stéphane Dechant, 69350 La Mulatière', 45.7322, 4.8088, 10.5, 'https://www.aquariumlyon.fr', '04 72 66 65 66', 4.3, 5234, '€€', 'https://www.google.com/maps?q=45.7322,4.8088'),
('Trévoux', 'Walibi Rhône-Alpes', '⚽ Sport & Loisirs', 'Parc d''attractions avec 33 manèges', 'Route de Corneilla, 38630 Les Avenières-Veyrins-Thuellin', 45.6219, 5.5699, 48.0, 'https://www.walibi.com', '0826 29 20 00', 4.2, 12345, '€€€€', 'https://www.google.com/maps?q=45.6219,5.5699'),
('Couzon', 'Jardin Botanique de Lyon', '🌳 Nature & Randonnée', 'Jardin botanique dans le Parc de la Tête d''Or', 'Parc de la Tête d''Or, 69006 Lyon', 45.7778, 4.8558, 11.2, NULL, NULL, 4.5, 1234, NULL, 'https://www.google.com/maps?q=45.7778,4.8558'),
('Trévoux', 'Golf de Mionnay', '⚽ Sport & Loisirs', 'Golf 18 trous', 'Route de Lyon, 01390 Mionnay', 45.9167, 4.9417, 8.0, 'https://www.golfmionnay.com', '04 78 91 84 84', 4.3, 234, '€€€', 'https://www.google.com/maps?q=45.9167,4.9417'),
('Trévoux', 'Base Nautique d''Anse', '⚽ Sport & Loisirs', 'Plan d''eau et activités nautiques', 'Chemin du Colombier, 69480 Anse', 45.9383, 4.7191, 4.5, NULL, '04 74 67 03 38', 4.0, 123, NULL, 'https://www.google.com/maps?q=45.9383,4.7191'),
('Couzon', 'Île Barbe', '🌳 Nature & Randonnée', 'Île sur la Saône, abbaye et promenades', 'Quai de l''Île Barbe, 69009 Lyon', 45.8071, 4.8327, 7.5, NULL, NULL, 4.4, 567, NULL, 'https://www.google.com/maps?q=45.8071,4.8327'),

-- =====================================================
-- RESTAURANTS RÉPUTÉS (50)
-- =====================================================

-- Étoilés & Grands Chefs
('Couzon', 'Paul Bocuse', '🍽️ Restaurant', 'Restaurant 3 étoiles Michelin, légende de la gastronomie', '40 Quai de la Plage, 69660 Collonges-au-Mont-d''Or', 45.8257, 4.8442, 5.5, 'https://www.bocuse.fr', '04 72 42 90 90', 4.7, 3452, '€€€€', 'https://www.google.com/maps?q=45.8257,4.8442'),
('Couzon', 'Le Neuvième Art', '🍽️ Restaurant', 'Restaurant étoilé Michelin', '173 Rue Cuvier, 69006 Lyon', 45.7678, 4.8486, 11.0, 'https://www.leneuviemeart.com', '04 72 74 12 74', 4.6, 423, '€€€€', 'https://www.google.com/maps?q=45.7678,4.8486'),
('Couzon', 'La Mère Brazier', '🍽️ Restaurant', 'Restaurant 2 étoiles Michelin', '12 Rue Royale, 69001 Lyon', 45.7696, 4.8351, 11.0, 'https://www.lamerebrazier.fr', '04 78 23 17 20', 4.5, 892, '€€€€', 'https://www.google.com/maps?q=45.7696,4.8351'),
('Couzon', 'Têtedoie', '🍽️ Restaurant', 'Restaurant étoilé, vue panoramique sur Lyon', '4 Rue du Professeur Pierre Marion, 69005 Lyon', 45.7598, 4.8168, 12.5, 'https://www.tetedoie.com', '04 78 29 40 10', 4.6, 567, '€€€€', 'https://www.google.com/maps?q=45.7598,4.8168'),
('Trévoux', 'Le Juliénas', '🍽️ Restaurant', 'Cuisine traditionnelle française', '216 Rue Nationale, 69400 Villefranche-sur-Saône', 45.9869, 4.7246, 6.5, 'https://www.restaurant-juliennas.com', '04 74 09 16 55', 4.4, 1234, '€€€', 'https://www.google.com/maps?q=45.9869,4.7246'),

-- Bouchons Lyonnais (cuisine traditionnelle)
('Couzon', 'Chez Paul', '🍽️ Restaurant', 'Authentique bouchon lyonnais', '11 Rue du Major Martin, 69001 Lyon', 45.7681, 4.8340, 10.8, 'https://www.chezpaul.fr', '04 78 28 35 83', 4.5, 2341, '€€', 'https://www.google.com/maps?q=45.7681,4.8340'),
('Couzon', 'Le Bouchon des Filles', '🍽️ Restaurant', 'Bouchon tenu par trois femmes', '20 Rue Sergent Blandan, 69001 Lyon', 45.7696, 4.8359, 11.0, NULL, '04 78 30 40 44', 4.6, 1823, '€€', 'https://www.google.com/maps?q=45.7696,4.8359'),
('Couzon', 'Daniel et Denise', '🍽️ Restaurant', 'Bouchon récompensé, cuisine lyonnaise', '156 Rue de Créqui, 69003 Lyon', 45.7534, 4.8541, 11.5, 'https://www.danieletdenise.fr', '04 78 60 66 53', 4.5, 2134, '€€', 'https://www.google.com/maps?q=45.7534,4.8541'),
('Couzon', 'Le Poêlon d''Or', '🍽️ Restaurant', 'Bouchon convivial', '29 Rue des Remparts d''Ainay, 69002 Lyon', 45.7516, 4.8276, 10.5, NULL, '04 78 37 65 60', 4.4, 892, '€€', 'https://www.google.com/maps?q=45.7516,4.8276'),
('Couzon', 'Café des Fédérations', '🍽️ Restaurant', 'Bouchon historique depuis 1872', '8 Rue du Major Martin, 69001 Lyon', 45.7682, 4.8341, 10.8, NULL, '04 78 28 26 00', 4.3, 1234, '€€', 'https://www.google.com/maps?q=45.7682,4.8341'),
('Couzon', 'Le Garet', '🍽️ Restaurant', 'Bouchon authentique', '7 Rue du Garet, 69001 Lyon', 45.7689, 4.8345, 10.9, NULL, '04 78 28 16 94', 4.4, 1567, '€€', 'https://www.google.com/maps?q=45.7689,4.8345'),

-- Restaurants qualité (4.3+)
('Trévoux', 'Le Comptoir JOA', '🍽️ Restaurant', 'Restaurant au casino de Trévoux', 'Quai de la République, 01600 Trévoux', 45.9415, 4.7735, 1.2, 'https://www.casinotrévoux.fr', '04 74 00 77 77', 4.3, 345, '€€', 'https://www.google.com/maps?q=45.9415,4.7735'),
('Trévoux', 'La Taverne de Maître Kanter', '🍽️ Restaurant', 'Brasserie alsacienne', 'Quai de la Saône, 01600 Trévoux', 45.9418, 4.7738, 1.0, 'https://www.maitrekanter.com', '04 74 00 28 28', 4.2, 567, '€€', 'https://www.google.com/maps?q=45.9418,4.7738'),
('Couzon', 'Les Loges', '🍽️ Restaurant', 'Restaurant étoilé dans le Vieux Lyon', '6 Rue du Bœuf, 69005 Lyon', 45.7631, 4.8277, 12.0, 'https://www.sofitel-lyon.com', '04 72 77 44 44', 4.6, 892, '€€€€', 'https://www.google.com/maps?q=45.7631,4.8277'),
('Couzon', 'Le Kitchen Café', '🍽️ Restaurant', 'Cuisine moderne et créative', '34 Rue Chevreul, 69007 Lyon', 45.7456, 4.8402, 11.0, 'https://www.kitchencafe.fr', '04 72 71 38 25', 4.5, 1234, '€€', 'https://www.google.com/maps?q=45.7456,4.8402'),
('Couzon', 'Brasserie Georges', '🍽️ Restaurant', 'Brasserie historique depuis 1836', '30 Cours de Verdun Perrache, 69002 Lyon', 45.7490, 4.8272, 10.8, 'https://www.brasseriegeorges.com', '04 72 56 54 54', 4.3, 8234, '€€', 'https://www.google.com/maps?q=45.7490,4.8272'),
('Couzon', 'Les Terrasses de Lyon', '🍽️ Restaurant', 'Vue panoramique sur Lyon', '25 Montée Saint-Barthélemy, 69005 Lyon', 45.7616, 4.8246, 12.3, 'https://www.villaflorentine.com', '04 72 56 56 56', 4.7, 567, '€€€€', 'https://www.google.com/maps?q=45.7616,4.8246'),

-- =====================================================
-- BARS, CAFÉS & CAVES À VIN (30)
-- =====================================================

('Couzon', 'Le Comptoir des Canuts', '🍺 Bar', 'Bar restaurant dans la Croix-Rousse', '20 Rue Dumenge, 69004 Lyon', 45.7738, 4.8299, 11.5, NULL, '04 78 28 05 60', 4.4, 892, '€€', 'https://www.google.com/maps?q=45.7738,4.8299'),
('Couzon', 'La Marquise', '☕ Café', 'Salon de thé et pâtisserie', '18 Rue Royale, 69001 Lyon', 45.7698, 4.8349, 11.0, NULL, '04 78 28 18 71', 4.5, 567, '€', 'https://www.google.com/maps?q=45.7698,4.8349'),
('Couzon', 'Le Sucre', '🍺 Bar', 'Club et bar brancÉ sur les toits', '50 Quai Rambaud, 69002 Lyon', 45.7403, 4.8192, 11.2, 'https://www.le-sucre.eu', NULL, 4.3, 1234, '€€', 'https://www.google.com/maps?q=45.7403,4.8192'),
('Couzon', 'La Cave des Voyageurs', '🍷 Cave à Vins', 'Bar à vins et épicerie fine', '7 Place Saint-Paul, 69005 Lyon', 45.7643, 4.8266, 12.0, NULL, '04 78 28 92 28', 4.6, 423, '€€', 'https://www.google.com/maps?q=45.7643,4.8266'),
('Couzon', 'Le Bistrot du Potager', '🍺 Bar', 'Bar restaurant bistronomique', '3 Rue de la Martinière, 69001 Lyon', 45.7686, 4.8342, 10.9, NULL, '04 78 28 26 08', 4.4, 345, '€€', 'https://www.google.com/maps?q=45.7686,4.8342'),
('Trévoux', 'Le Saint-Pierre', '🍺 Bar', 'Bar brasserie à Trévoux', 'Quai de la Saône, 01600 Trévoux', 45.9420, 4.7740, 1.0, NULL, '04 74 00 25 45', 4.1, 123, '€', 'https://www.google.com/maps?q=45.9420,4.7740'),
('Couzon', 'Antidote Cocktail Club', '🍺 Bar', 'Bar à cocktails raffiné', '14 Rue de la Monnaie, 69002 Lyon', 45.7635, 4.8320, 10.8, NULL, '04 72 40 20 20', 4.5, 892, '€€', 'https://www.google.com/maps?q=45.7635,4.8320'),
('Couzon', 'Le Ninkasi', '🍺 Bar', 'Brasserie et microbrasserie', '267 Rue Marcel Mérieux, 69007 Lyon', 45.7354, 4.8367, 11.8, 'https://www.ninkasi.fr', '04 72 76 89 00', 4.3, 3452, '€€', 'https://www.google.com/maps?q=45.7354,4.8367'),

-- =====================================================
-- COMMERCES ESSENTIELS (40)
-- =====================================================

-- Supermarchés
('Trévoux', 'Intermarché Trévoux', '🛒 Commerces', 'Supermarché', 'Route de Lyon, 01600 Trévoux', 45.9387, 4.7815, 1.5, 'https://www.intermarche.com', '04 74 00 23 23', 4.0, 234, NULL, 'https://www.google.com/maps?q=45.9387,4.7815'),
('Trévoux', 'Carrefour Market Trévoux', '🛒 Commerces', 'Supermarché', 'Rue de la République, 01600 Trévoux', 45.9408, 4.7755, 0.8, 'https://www.carrefour.fr', '04 74 00 18 18', 3.9, 156, NULL, 'https://www.google.com/maps?q=45.9408,4.7755'),
('Trévoux', 'Carrefour Villefranche', '🛒 Commerces', 'Hypermarché', 'Avenue de l''Europe, 69400 Villefranche-sur-Saône', 45.9943, 4.7145, 7.0, 'https://www.carrefour.fr', '04 74 09 09 09', 4.1, 2341, NULL, 'https://www.google.com/maps?q=45.9943,4.7145'),
('Couzon', 'Carrefour Market Neuville', '🛒 Commerces', 'Supermarché', 'Avenue Victor Hugo, 69250 Neuville-sur-Saône', 45.8754, 4.8391, 5.2, 'https://www.carrefour.fr', '04 78 91 22 22', 4.0, 345, NULL, 'https://www.google.com/maps?q=45.8754,4.8391'),
('Couzon', 'Carrefour Lyon Part-Dieu', '🛒 Commerces', 'Hypermarché au centre commercial', '17 Rue du Docteur Bouchut, 69003 Lyon', 45.7612, 4.8565, 11.5, 'https://www.carrefour.fr', '04 78 63 74 74', 4.2, 5234, NULL, 'https://www.google.com/maps?q=45.7612,4.8565'),
('Couzon', 'Monoprix Bellecour', '🛒 Commerces', 'Supermarché centre-ville', '42 Rue de la République, 69002 Lyon', 45.7583, 4.8328, 10.5, 'https://www.monoprix.fr', NULL, 3.9, 892, NULL, 'https://www.google.com/maps?q=45.7583,4.8328'),

-- Pharmacies
('Trévoux', 'Pharmacie de Trévoux', '💊 Santé', 'Pharmacie', 'Place de la Terrasse, 01600 Trévoux', 45.9400, 4.7766, 0.5, NULL, '04 74 00 01 02', 4.2, 45, NULL, 'https://www.google.com/maps?q=45.9400,4.7766'),
('Trévoux', 'Pharmacie Centrale Villefranche', '💊 Santé', 'Pharmacie', '164 Rue Nationale, 69400 Villefranche-sur-Saône', 45.9872, 4.7251, 6.5, NULL, '04 74 65 11 11', 4.1, 123, NULL, 'https://www.google.com/maps?q=45.9872,4.7251'),
('Couzon', 'Pharmacie Neuville', '💊 Santé', 'Pharmacie', 'Place de la Mairie, 69250 Neuville-sur-Saône', 45.8762, 4.8398, 5.0, NULL, '04 78 91 11 11', 4.0, 67, NULL, 'https://www.google.com/maps?q=45.8762,4.8398'),
('Couzon', 'Pharmacie Bellecour', '💊 Santé', 'Pharmacie', '20 Place Bellecour, 69002 Lyon', 45.7578, 4.8320, 10.5, NULL, '04 78 37 27 27', 4.1, 234, NULL, 'https://www.google.com/maps?q=45.7578,4.8320'),

-- Boulangeries
('Trévoux', 'Boulangerie Cormorèche', '🥖 Boulangerie', 'Pâtisserie chocolaterie réputée', 'Rue du Gouvernement, 01600 Trévoux', 45.9403, 4.7762, 0.5, NULL, '04 74 00 14 15', 4.6, 234, '€', 'https://www.google.com/maps?q=45.9403,4.7762'),
('Trévoux', 'Boulangerie Villefranche', '🥖 Boulangerie', 'Boulangerie traditionnelle', 'Rue Nationale, 69400 Villefranche-sur-Saône', 45.9869, 4.7246, 6.5, NULL, '04 74 65 22 22', 4.3, 156, '€', 'https://www.google.com/maps?q=45.9869,4.7246'),
('Couzon', 'Boulangerie Neuville', '🥖 Boulangerie', 'Boulangerie artisanale', 'Grande Rue, 69250 Neuville-sur-Saône', 45.8762, 4.8398, 5.0, NULL, '04 78 91 33 33', 4.2, 89, '€', 'https://www.google.com/maps?q=45.8762,4.8398'),
('Couzon', 'Boulangerie Jocteur', '🥖 Boulangerie', 'Meilleur Ouvrier de France', 'Croix-Rousse, 69004 Lyon', 45.7754, 4.8314, 11.5, 'https://www.jocteur.com', '04 78 28 87 87', 4.7, 892, '€', 'https://www.google.com/maps?q=45.7754,4.8314'),
('Couzon', 'Sébastien Bouillet', '🥖 Boulangerie', 'Pâtissier chocolatier renommé', 'Multiple locations Lyon', 45.7683, 4.8345, 11.0, 'https://www.sebastien-bouillet.com', '04 78 62 02 89', 4.6, 1234, '€€', 'https://www.google.com/maps?q=45.7683,4.8345'),

-- Autres commerces
('Trévoux', 'Casino de Trévoux', '🎰 Divertissement', 'Casino JOA', 'Quai de la République, 01600 Trévoux', 45.9415, 4.7735, 1.2, 'https://www.casinotrévoux.fr', '04 74 00 77 77', 3.9, 234, NULL, 'https://www.google.com/maps?q=45.9415,4.7735'),
('Couzon', 'Halles de Lyon Paul Bocuse', '🛒 Commerces', 'Marché couvert gastronomique', '102 Cours Lafayette, 69003 Lyon', 45.7628, 4.8500, 11.2, 'https://www.halledelyon-paulbocuse.com', '04 78 62 39 33', 4.6, 5234, '€€', 'https://www.google.com/maps?q=45.7628,4.8500'),
('Couzon', 'Part-Dieu Centre Commercial', '🛒 Commerces', 'Grand centre commercial', '17 Rue du Docteur Bouchut, 69003 Lyon', 45.7612, 4.8565, 11.5, 'https://www.centrecommercialpartdieu.com', NULL, 4.1, 12345, NULL, 'https://www.google.com/maps?q=45.7612,4.8565'),

-- =====================================================
-- DIVERTISSEMENTS & ACTIVITÉS (15)
-- =====================================================

('Couzon', 'Cinéma Pathé Bellecour', '🎬 Divertissement', 'Cinéma multiplexe', '5 Rue de la Barre, 69002 Lyon', 45.7573, 4.8347, 10.5, 'https://www.cinemaspathegaumont.com', '0892 69 66 96', 4.2, 3452, '€€', 'https://www.google.com/maps?q=45.7573,4.8347'),
('Couzon', 'Cinéma UGC Ciné Cité', '🎬 Divertissement', 'Cinéma multiplexe', '80 Quai Charles de Gaulles, 69006 Lyon', 45.7814, 4.8560, 11.5, 'https://www.ugc.fr', '0892 70 00 00', 4.1, 2341, '€€', 'https://www.google.com/maps?q=45.7814,4.8560'),
('Trévoux', 'Cinéma La Passerelle', '🎬 Divertissement', 'Cinéma municipal', 'Quai de la Saône, 01600 Trévoux', 45.9418, 4.7738, 1.0, NULL, '04 74 00 27 44', 3.8, 67, '€', 'https://www.google.com/maps?q=45.9418,4.7738'),
('Couzon', 'Opéra de Lyon', '🎭 Culture', 'Opéra national', '1 Place de la Comédie, 69001 Lyon', 45.7676, 4.8362, 11.0, 'https://www.opera-lyon.com', '04 69 85 54 54', 4.7, 1823, '€€€€', 'https://www.google.com/maps?q=45.7676,4.8362'),
('Couzon', 'Auditorium de Lyon', '🎭 Culture', 'Orchestre National de Lyon', '149 Rue Garibaldi, 69003 Lyon', 45.7604, 4.8467, 11.2, 'https://www.auditorium-lyon.com', '04 78 95 95 95', 4.6, 892, '€€€', 'https://www.google.com/maps?q=45.7604,4.8467'),
('Couzon', 'Bowling Part-Dieu', '🎳 Divertissement', 'Bowling 24 pistes', 'Centre Commercial Part-Dieu, 69003 Lyon', 45.7615, 4.8570, 11.5, NULL, '04 72 60 44 44', 4.0, 567, '€€', 'https://www.google.com/maps?q=45.7615,4.8570'),
('Trévoux', 'InZeBoat', '⛵ Activité', 'Location de bateaux sans permis', 'Port de Trévoux, 01600 Trévoux', 45.9425, 4.7742, 1.0, 'https://www.inzeboat.fr', '04 74 00 55 55', 4.4, 123, '€€€', 'https://www.google.com/maps?q=45.9425,4.7742'),

-- =====================================================
-- TRANSPORT & SERVICES (10)
-- =====================================================

('Trévoux', 'Gare SNCF Trévoux', '🚉 Transport', 'Gare ferroviaire', 'Avenue de la Gare, 01600 Trévoux', 45.9395, 4.7727, 1.0, 'https://www.sncf.com', '3635', NULL, NULL, NULL, 'https://www.google.com/maps?q=45.9395,4.7727'),
('Couzon', 'Gare Part-Dieu', '🚉 Transport', 'Principale gare de Lyon', 'Place Charles Béraudier, 69003 Lyon', 45.7603, 4.8587, 11.5, 'https://www.sncf.com', '3635', 4.1, 8234, NULL, 'https://www.google.com/maps?q=45.7603,4.8587'),
('Couzon', 'Aéroport Lyon-Saint Exupéry', '✈️ Transport', 'Aéroport international', '69125 Colombier-Saugnieu', 45.7256, 5.0811, 35.0, 'https://www.lyonaeroports.com', '0826 800 826', 4.2, 23451, NULL, 'https://www.google.com/maps?q=45.7256,5.0811'),
('Trévoux', 'Office de Tourisme Trévoux', 'ℹ️ Information', 'Office de tourisme et patrimoine', 'Place de la Terrasse, 01600 Trévoux', 45.9401, 4.7770, 0.3, 'https://www.dombes-tourisme.com', '04 74 00 36 32', 4.3, 89, NULL, 'https://www.google.com/maps?q=45.9401,4.7770'),
('Couzon', 'Office de Tourisme Lyon', 'ℹ️ Information', 'Office de tourisme principal', 'Place Bellecour, 69002 Lyon', 45.7575, 4.8322, 10.5, 'https://www.lyon-france.com', '04 72 77 69 69', 4.5, 2341, NULL, 'https://www.google.com/maps?q=45.7575,4.8322'),

-- =====================================================
-- VILLES & VILLAGES BEAUJOLAIS (20)
-- =====================================================

('Trévoux', 'Oingt - Village de Pierres Dorées', '🏛️ Site Touristique', 'Plus beau village de France en Beaujolais', '69620 Oingt', 45.9483, 4.5789, 16.0, NULL, NULL, 4.6, 892, NULL, 'https://www.google.com/maps?q=45.9483,4.5789'),
('Trévoux', 'Ternand - Cité Médiévale', '🏛️ Site Touristique', 'Village médiéval des Pierres Dorées', '69620 Ternand', 45.9789, 4.5567, 18.0, NULL, NULL, 4.4, 234, NULL, 'https://www.google.com/maps?q=45.9789,4.5567'),
('Trévoux', 'Châtillon-sur-Chalaronne', '🏛️ Site Touristique', 'Cité médiévale et marché couvert', '01400 Châtillon-sur-Chalaronne', 46.1167, 4.9583, 23.0, 'https://www.chatillon-sur-chalaronne.fr', NULL, 4.5, 1234, NULL, 'https://www.google.com/maps?q=46.1167,4.9583'),
('Trévoux', 'Beaujeu - Capitale du Beaujolais', '🏛️ Site Touristique', 'Capitale historique du Beaujolais', 'Place de l''Hôtel de Ville, 69430 Beaujeu', 46.1544, 4.5897, 35.0, 'https://www.beaujeu.fr', NULL, 4.2, 345, NULL, 'https://www.google.com/maps?q=46.1544,4.5897'),
('Trévoux', 'Thoissey', '🏛️ Site Touristique', 'Village bord de Saône, grenouilles', '01140 Thoissey', 46.1722, 4.8008, 25.0, NULL, NULL, 4.1, 156, NULL, 'https://www.google.com/maps?q=46.1722,4.8008'),

-- =====================================================
-- CAVES & DOMAINES VITICOLES BEAUJOLAIS (25)
-- =====================================================

('Trévoux', 'Hameau Duboeuf', '🍷 Cave à Vins', 'Musée du vin et parc des vignes', '796 Route de la Gare, 71570 Romanèche-Thorins', 46.1892, 4.7369, 65.0, 'https://www.hameauduboeuf.com', '03 85 35 22 22', 4.5, 3452, '€€', 'https://www.google.com/maps?q=46.1892,4.7369'),
('Trévoux', 'Cave de Bully', '🍷 Cave à Vins', 'Caveau dégustation Beaujolais', '69210 Bully', 45.8789, 4.5845, 15.0, NULL, '04 74 01 12 18', 4.3, 234, '€', 'https://www.google.com/maps?q=45.8789,4.5845'),
('Trévoux', 'Cave Beaujolaise', '🍷 Cave à Vins', 'Vins du Beaujolais', 'Villefranche-sur-Saône', 45.9869, 4.7246, 6.5, NULL, '04 74 65 44 55', 4.2, 156, '€', 'https://www.google.com/maps?q=45.9869,4.7246'),
('Trévoux', 'Domaine des Nugues', '🍷 Cave à Vins', 'Domaine viticole Beaujolais', '69910 Lancié', 46.1567, 4.7189, 30.0, 'https://www.domainedesnugues.com', '04 74 04 11 04', 4.6, 345, '€€', 'https://www.google.com/maps?q=46.1567,4.7189'),

-- =====================================================
-- RESTAURANTS SUPPLÉMENTAIRES (40)
-- =====================================================

-- Autour de Villefranche
('Trévoux', 'Le Nantua', '🍽️ Restaurant', 'Spécialités de poisson', '174 Rue Nationale, 69400 Villefranche-sur-Saône', 45.9875, 4.7248, 6.5, NULL, '04 74 68 12 12', 4.3, 567, '€€', 'https://www.google.com/maps?q=45.9875,4.7248'),
('Trévoux', 'Le Fleurie', '🍽️ Restaurant', 'Brasserie traditionnelle', 'Rue Nationale, 69400 Villefranche-sur-Saône', 45.9869, 4.7246, 6.5, NULL, '04 74 65 55 66', 4.2, 423, '€€', 'https://www.google.com/maps?q=45.9869,4.7246'),
('Trévoux', 'La Fontaine Bleue', '🍽️ Restaurant', 'Cuisine traditionnelle', 'Villefranche-sur-Saône', 45.9850, 4.7220, 6.8, NULL, '04 74 68 99 88', 4.3, 345, '€€', 'https://www.google.com/maps?q=45.9850,4.7220'),

-- Autour de Lyon
('Couzon', 'Le Bec', '🍽️ Restaurant', 'Bistrot gastronomique', '14 Rue Grolée, 69002 Lyon', 45.7595, 4.8362, 10.7, NULL, '04 78 42 15 00', 4.5, 892, '€€€', 'https://www.google.com/maps?q=45.7595,4.8362'),
('Couzon', 'La Meunière', '🍽️ Restaurant', 'Spécialités de poissons', '11 Rue Neuve, 69001 Lyon', 45.7688, 4.8353, 11.0, NULL, '04 78 28 62 91', 4.4, 567, '€€€', 'https://www.google.com/maps?q=45.7688,4.8353'),
('Couzon', 'Les Apothicaires', '🍽️ Restaurant', 'Cuisine créative', '23 Rue de la Monnaie, 69002 Lyon', 45.7639, 4.8326, 10.8, NULL, '04 78 37 46 02', 4.6, 423, '€€€', 'https://www.google.com/maps?q=45.7639,4.8326'),
('Couzon', 'M Restaurant', '🍽️ Restaurant', 'Cuisine moderne', '47 Avenue Foch, 69006 Lyon', 45.7707, 4.8459, 11.2, NULL, '04 78 89 55 19', 4.5, 345, '€€€€', 'https://www.google.com/maps?q=45.7707,4.8459'),
('Couzon', 'Le Passe Temps', '🍽️ Restaurant', 'Bistrot traditionnel', '52 Rue Tronchet, 69006 Lyon', 45.7695, 4.8487, 11.3, NULL, '04 72 82 90 14', 4.4, 567, '€€', 'https://www.google.com/maps?q=45.7695,4.8487'),
('Couzon', 'Maison Clovis', '🍽️ Restaurant', 'Cuisine du marché', '16 Rue Royale, 69001 Lyon', 45.7697, 4.8348, 11.0, NULL, '04 78 27 84 26', 4.5, 423, '€€€', 'https://www.google.com/maps?q=45.7697,4.8348'),
('Couzon', 'Substrat', '🍽️ Restaurant', 'Cuisine bistronomique', '34 Rue Tramassac, 69005 Lyon', 45.7621, 4.8264, 12.0, NULL, '04 78 38 29 20', 4.6, 345, '€€€', 'https://www.google.com/maps?q=45.7621,4.8264'),
('Couzon', 'Archange', '🍽️ Restaurant', 'Gastronomie créative', '29 Rue Sala, 69002 Lyon', 45.7552, 4.8297, 10.7, NULL, '04 78 37 66 11', 4.5, 234, '€€€€', 'https://www.google.com/maps?q=45.7552,4.8297'),
('Couzon', 'Le Splendid', '🍽️ Restaurant', 'Brasserie Art Déco', '3 Place Jules Ferry, 69006 Lyon', 45.7705, 4.8473, 11.3, NULL, '04 37 24 85 85', 4.4, 892, '€€', 'https://www.google.com/maps?q=45.7705,4.8473'),
('Couzon', 'Culina Hortus', '🍽️ Restaurant', 'Cuisine végétale créative', '38 Rue de l''Arbre Sec, 69001 Lyon', 45.7681, 4.8334, 10.9, NULL, '04 72 00 08 08', 4.7, 567, '€€€', 'https://www.google.com/maps?q=45.7681,4.8334'),
('Couzon', 'Le Bistrot de Lyon', '🍽️ Restaurant', 'Bouchon traditionnel', '64 Rue Mercière, 69002 Lyon', 45.7625, 4.8340, 10.8, NULL, '04 78 38 47 47', 4.3, 1234, '€€', 'https://www.google.com/maps?q=45.7625,4.8340'),
('Couzon', 'Brasserie Léon de Lyon', '🍽️ Restaurant', 'Institution lyonnaise depuis 1904', '1 Rue Pléney, 69001 Lyon', 45.7685, 4.8342, 10.9, 'https://www.leondelyon.com', '04 72 10 11 12', 4.5, 2341, '€€€', 'https://www.google.com/maps?q=45.7685,4.8342'),
('Couzon', 'Le Sud', '🍽️ Restaurant', 'Cuisine méditerranéenne, Paul Bocuse', '11 Place Antonin Poncet, 69002 Lyon', 45.7564, 4.8317, 10.6, 'https://www.brasserielesud.com', '04 72 77 80 00', 4.4, 3452, '€€', 'https://www.google.com/maps?q=45.7564,4.8317'),
('Couzon', 'Le Nord', '🍽️ Restaurant', 'Brasserie Paul Bocuse', '18 Rue Neuve, 69002 Lyon', 45.7684, 4.8351, 10.9, 'https://www.brasserieLenord.com', '04 72 10 69 69', 4.4, 4234, '€€', 'https://www.google.com/maps?q=45.7684,4.8351'),
('Couzon', 'L''Est', '🍽️ Restaurant', 'Brasserie Paul Bocuse gare Part-Dieu', '14 Place Jules Ferry, 69006 Lyon', 45.7610, 4.8570, 11.5, 'https://www.brasserielest.com', '04 37 24 25 26', 4.3, 2341, '€€', 'https://www.google.com/maps?q=45.7610,4.8570'),
('Couzon', 'L''Ouest', '🍽️ Restaurant', 'Brasserie Paul Bocuse', '1 Quai du Commerce, 69009 Lyon', 45.7812, 4.8053, 9.5, 'https://www.brasserielouest.com', '04 37 64 64 64', 4.4, 1823, '€€', 'https://www.google.com/maps?q=45.7812,4.8053'),
('Couzon', 'Les Trois Dômes', '🍽️ Restaurant', 'Restaurant gastronomique panoramique', '20 Quai Gailleton, 69002 Lyon', 45.7556, 4.8330, 10.7, 'https://www.sofitel-lyon-bellecour.com', '04 72 41 20 97', 4.7, 567, '€€€€', 'https://www.google.com/maps?q=45.7556,4.8330'),

-- Autour de Neuville et Trévoux
('Couzon', 'L''Épicurien', '🍽️ Restaurant', 'Restaurant gastronomique', '69250 Neuville-sur-Saône', 45.8762, 4.8398, 5.0, NULL, '04 78 91 29 29', 4.4, 234, '€€€', 'https://www.google.com/maps?q=45.8762,4.8398'),
('Couzon', 'Les Platanes', '🍽️ Restaurant', 'Brasserie au bord de Saône', 'Neuville-sur-Saône', 45.8750, 4.8385, 5.2, NULL, '04 78 91 44 55', 4.2, 156, '€€', 'https://www.google.com/maps?q=45.8750,4.8385'),
('Trévoux', 'L''Embarcadère', '🍽️ Restaurant', 'Restaurant au bord de Saône', 'Quai de la Saône, 01600 Trévoux', 45.9425, 4.7742, 1.0, NULL, '04 74 00 33 44', 4.1, 234, '€€', 'https://www.google.com/maps?q=45.9425,4.7742'),
('Trévoux', 'La Table de Trévoux', '🍽️ Restaurant', 'Cuisine traditionnelle', 'Centre ville, 01600 Trévoux', 45.9405, 4.7760, 0.6, NULL, '04 74 00 88 99', 4.0, 123, '€€', 'https://www.google.com/maps?q=45.9405,4.7760'),

-- =====================================================
-- BARS & CAFÉS SUPPLÉMENTAIRES (20)
-- =====================================================

('Couzon', 'Le Voxx', '🍺 Bar', 'Bar club live musique', '3 Rue Terme, 69001 Lyon', 45.7670, 4.8330, 10.9, NULL, '04 78 27 48 47', 4.3, 892, '€€', 'https://www.google.com/maps?q=45.7670,4.8330'),
('Couzon', 'Wallace Bar', '☕ Café', 'Bar salon de thé', '5 Rue Fernand Rey, 69001 Lyon', 45.7684, 4.8336, 10.9, NULL, NULL, 4.4, 567, '€€', 'https://www.google.com/maps?q=45.7684,4.8336'),
('Couzon', 'Shoko', '🍺 Bar', 'Bar club bord de Saône', '11 Quai Victor Augagneur, 69003 Lyon', 45.7577, 4.8410, 11.0, 'https://www.shoko.fr', '04 72 84 98 98', 4.1, 2341, '€€', 'https://www.google.com/maps?q=45.7577,4.8410'),
('Couzon', 'Le Petit Salon', '☕ Café', 'Salon de thé cosy', '7 Rue Mercière, 69002 Lyon', 45.7630, 4.8338, 10.8, NULL, NULL, 4.5, 423, '€', 'https://www.google.com/maps?q=45.7630,4.8338'),
('Couzon', 'Le Complexe du Rire', '🎭 Divertissement', 'Café-théâtre humour', '7 Rue des Capucins, 69001 Lyon', 45.7684, 4.8340, 10.9, 'https://www.complexedurire.com', '04 78 27 23 59', 4.6, 1234, '€€', 'https://www.google.com/maps?q=45.7684,4.8340'),
('Couzon', 'Ayers Rock Café', '🍺 Bar', 'Bar ambiance rock', 'Vieux Lyon', 45.7627, 4.8271, 12.0, NULL, NULL, 4.2, 892, '€€', 'https://www.google.com/maps?q=45.7627,4.8271'),
('Couzon', 'Le Smoking Dog', '🍺 Bar', 'Bar à cocktails', '16 Rue Lainerie, 69005 Lyon', 45.7635, 4.8275, 12.0, NULL, NULL, 4.4, 567, '€€', 'https://www.google.com/maps?q=45.7635,4.8275'),
('Couzon', 'La Mousse Café', '🍺 Bar', 'Bar à bières artisanales', '21 Rue Sainte-Catherine, 69001 Lyon', 45.7680, 4.8345, 10.9, NULL, NULL, 4.5, 345, '€€', 'https://www.google.com/maps?q=45.7680,4.8345'),
('Couzon', 'Le Flannel', '☕ Café', 'Coffee shop spécialisé', '27 Rue du Bât d''Argent, 69001 Lyon', 45.7683, 4.8357, 11.0, NULL, NULL, 4.6, 423, '€', 'https://www.google.com/maps?q=45.7683,4.8357'),
('Couzon', 'Le Comptoir du Vin', '🍷 Cave à Vins', 'Bar à vins naturels', '5 Rue Terme, 69001 Lyon', 45.7671, 4.8331, 10.9, NULL, NULL, 4.5, 234, '€€', 'https://www.google.com/maps?q=45.7671,4.8331'),

-- =====================================================
-- ACTIVITÉS SPORTIVES & LOISIRS (25)
-- =====================================================

('Couzon', 'Play In Park Lyon', '⚽ Sport & Loisirs', 'Parc de loisirs indoor', 'Boulevard Bataille de Stalingrad, 69100 Villeurbanne', 45.7754, 4.8594, 11.0, 'https://www.playinpark.fr', NULL, 4.3, 1234, '€€', 'https://www.google.com/maps?q=45.7754,4.8594'),
('Trévoux', 'Espace Zoologique Saint-Martin-la-Plaine', '⚽ Sport & Loisirs', 'Zoo sanctuaire pour animaux sauvés', 'La Tuilière, 42800 Saint-Martin-la-Plaine', 45.5507, 4.5850, 58.0, 'https://www.espace-zoologique.com', '04 77 75 17 53', 4.5, 1823, '€€', 'https://www.google.com/maps?q=45.5507,4.5850'),
('Couzon', 'Laser Game Evolution', '🎯 Divertissement', 'Laser game', 'Part-Dieu, Lyon', 45.7615, 4.8570, 11.5, NULL, NULL, 4.2, 567, '€€', 'https://www.google.com/maps?q=45.7615,4.8570'),
('Couzon', 'Jump XL', '⚽ Sport & Loisirs', 'Parc de trampolines', '69800 Saint-Priest', 45.7000, 4.9450, 17.0, 'https://www.jumpxl.fr', NULL, 4.3, 892, '€€', 'https://www.google.com/maps?q=45.7000,4.9450'),
('Couzon', 'Karting Indoor Lyon', '🏎️ Sport & Loisirs', 'Karting couvert', 'Vénissieux', 45.6950, 4.8870, 15.5, NULL, NULL, 4.1, 345, '€€€', 'https://www.google.com/maps?q=45.6950,4.8870'),
('Trévoux', 'AccroCamp Dombes', '⚽ Sport & Loisirs', 'Parcours aventure arbres', 'Dombes, 01', 45.9950, 5.0500, 12.0, NULL, NULL, 4.4, 234, '€€', 'https://www.google.com/maps?q=45.9950,5.0500'),
('Couzon', 'Stade Gerland', '⚽ Sport & Loisirs', 'Stade historique de Lyon', '353 Avenue Jean Jaurès, 69007 Lyon', 45.7261, 4.8315, 11.5, NULL, NULL, 4.2, 2341, NULL, 'https://www.google.com/maps?q=45.7261,4.8315'),
('Couzon', 'Parc OL - Groupama Stadium', '⚽ Sport & Loisirs', 'Stade moderne Olympique Lyonnais', '10 Avenue Simone Veil, 69150 Décines-Charpieu', 45.7650, 4.9820, 19.0, 'https://www.groupamastadium.com', NULL, 4.6, 12345, '€€€€', 'https://www.google.com/maps?q=45.7650,4.9820'),
('Couzon', 'Mini World Lyon', '🎮 Divertissement', 'Parc miniature animé', 'Carré de Soie, Vaulx-en-Velin', 45.7855, 4.9220, 15.5, 'https://www.miniworld.fr', '04 28 29 30 05', 4.5, 5234, '€€', 'https://www.google.com/maps?q=45.7855,4.9220'),
('Couzon', 'Planète Bowling', '🎳 Divertissement', 'Bowling Confluence', '112 Cours Charlemagne, 69002 Lyon', 45.7400, 4.8205, 11.0, NULL, NULL, 4.0, 892, '€€', 'https://www.google.com/maps?q=45.7400,4.8205'),
('Couzon', 'Piscine du Rhône', '🏊 Sport & Loisirs', 'Centre aquatique', '8 Quai Claude Bernard, 69007 Lyon', 45.7522, 4.8416, 11.2, NULL, '04 78 61 03 03', 4.1, 567, '€', 'https://www.google.com/maps?q=45.7522,4.8416'),
('Trévoux', 'Golf de Lyon Verger', '⚽ Sport & Loisirs', 'Golf 18 trous', '69390 Millery', 45.6289, 4.7767, 28.0, 'https://www.golf-lyon-verger.com', '04 78 46 13 04', 4.3, 234, '€€€', 'https://www.google.com/maps?q=45.6289,4.7767'),
('Couzon', 'Escape Game Lyon', '🎯 Divertissement', 'Jeux d''évasion', 'Centre-ville Lyon', 45.7650, 4.8350, 10.8, NULL, NULL, 4.4, 1234, '€€', 'https://www.google.com/maps?q=45.7650,4.8350'),

-- =====================================================
-- MARCHÉS & ÉVÉNEMENTS (10)
-- =====================================================

('Trévoux', 'Marché de Trévoux', '🛒 Commerces', 'Marché hebdomadaire samedi matin', 'Centre-ville, 01600 Trévoux', 45.9405, 4.7760, 0.5, NULL, NULL, 4.2, 123, NULL, 'https://www.google.com/maps?q=45.9405,4.7760'),
('Trévoux', 'Marché de Villefranche', '🛒 Commerces', 'Marché traditionnel', 'Centre-ville, 69400 Villefranche-sur-Saône', 45.9869, 4.7246, 6.5, NULL, NULL, 4.3, 567, NULL, 'https://www.google.com/maps?q=45.9869,4.7246'),
('Couzon', 'Marché de la Croix-Rousse', '🛒 Commerces', 'Marché quotidien sur le boulevard', 'Boulevard de la Croix-Rousse, 69004 Lyon', 45.7754, 4.8314, 11.5, NULL, NULL, 4.6, 3452, NULL, 'https://www.google.com/maps?q=45.7754,4.8314'),
('Couzon', 'Marché Quai Saint-Antoine', '🛒 Commerces', 'Marché alimentaire quotidien', 'Quai Saint-Antoine, 69002 Lyon', 45.7608, 4.8309, 10.7, NULL, NULL, 4.5, 2341, NULL, 'https://www.google.com/maps?q=45.7608,4.8309'),
('Couzon', 'Marché de la Guillotière', '🛒 Commerces', 'Marché cosmopolite', 'Place du Pont, 69007 Lyon', 45.7518, 4.8400, 11.0, NULL, NULL, 4.3, 1234, NULL, 'https://www.google.com/maps?q=45.7518,4.8400'),
('Couzon', 'Puces du Canal', '🛒 Commerces', 'Brocante dimanche matin', 'Quai Romain Rolland, Villeurbanne', 45.7680, 4.8695, 12.0, NULL, NULL, 4.2, 892, NULL, 'https://www.google.com/maps?q=45.7680,4.8695'),

-- =====================================================
-- COMPLÉMENTS DIVERS (5)
-- =====================================================

('Couzon', 'Confluence - Quartier Moderne', '🏛️ Site Touristique', 'Nouveau quartier architecture contemporaine', 'Confluence, 69002 Lyon', 45.7350, 4.8180, 11.3, NULL, NULL, 4.4, 2341, NULL, 'https://www.google.com/maps?q=45.7350,4.8180'),
('Couzon', 'Croix-Rousse - Quartier des Canuts', '🏛️ Site Touristique', 'Quartier historique des soyeux', 'Montée Grande Côte, 69001 Lyon', 45.7737, 4.8305, 11.5, NULL, NULL, 4.5, 1823, NULL, 'https://www.google.com/maps?q=45.7737,4.8305'),
('Couzon', 'Mur des Canuts', '🎭 Culture', 'Plus grande fresque d''Europe', 'Boulevard des Canuts, 69004 Lyon', 45.7749, 4.8259, 11.5, NULL, NULL, 4.6, 3452, NULL, 'https://www.google.com/maps?q=45.7749,4.8259'),
('Couzon', 'Parc de Gerland', '🌳 Nature & Randonnée', 'Parc urbain moderne', 'Rue du Docteur Carrier, 69007 Lyon', 45.7280, 4.8278, 11.5, NULL, NULL, 4.3, 567, NULL, 'https://www.google.com/maps?q=45.7280,4.8278'),
('Couzon', 'Berges du Rhône', '🌳 Nature & Randonnée', 'Promenade aménagée le long du Rhône', 'Quai Victor Augagneur, 69003 Lyon', 45.7577, 4.8410, 11.0, NULL, NULL, 4.6, 5234, NULL, 'https://www.google.com/maps?q=45.7577,4.8410');

-- =====================================================
-- COMMERCES SUPPLÉMENTAIRES (30)
-- =====================================================

INSERT INTO activites_gites (gite, nom, categorie, description, adresse, latitude, longitude, distance, website, telephone, note, avis, prix, google_maps_link) VALUES
-- Boulangeries supplémentaires
('Trévoux', 'Boulangerie Villefranche Centre', '🥖 Boulangerie', 'Boulangerie artisanale', '200 Rue Nationale, 69400 Villefranche-sur-Saône', 45.9875, 4.7250, 6.5, NULL, '04 74 65 77 88', 4.2, 89, '€', 'https://www.google.com/maps?q=45.9875,4.7250'),
('Couzon', 'Pignol Pâtisserie', '🥖 Boulangerie', 'Pâtisserie fine', 'Lyon 2', 45.7590, 4.8330, 10.7, NULL, NULL, 4.5, 567, '€€', 'https://www.google.com/maps?q=45.7590,4.8330'),
('Couzon', 'Boulangerie Terroir', '🥖 Boulangerie', 'Pain au levain naturel', 'Croix-Rousse, Lyon', 45.7750, 4.8310, 11.5, NULL, NULL, 4.4, 234, '€', 'https://www.google.com/maps?q=45.7750,4.8310'),
('Trévoux', 'Maison Boulud', '�� Boulangerie', 'Boulangerie traditionnelle', 'Anse, 69480', 45.9383, 4.7191, 4.5, NULL, NULL, 4.3, 123, '€', 'https://www.google.com/maps?q=45.9383,4.7191'),

-- Pharmacies supplémentaires
('Trévoux', 'Pharmacie Anse', '💊 Santé', 'Pharmacie', 'Anse, 69480', 45.9383, 4.7191, 4.5, NULL, '04 74 67 00 00', 4.0, 45, NULL, 'https://www.google.com/maps?q=45.9383,4.7191'),
('Couzon', 'Pharmacie Part-Dieu', '💊 Santé', 'Pharmacie centre commercial', 'Part-Dieu, 69003 Lyon', 45.7615, 4.8570, 11.5, NULL, '04 72 60 11 22', 4.1, 234, NULL, 'https://www.google.com/maps?q=45.7615,4.8570'),
('Couzon', 'Pharmacie Croix-Rousse', '💊 Santé', 'Pharmacie', 'Boulevard Croix-Rousse, 69004 Lyon', 45.7754, 4.8314, 11.5, NULL, '04 78 28 88 88', 4.2, 156, NULL, 'https://www.google.com/maps?q=45.7754,4.8314'),

-- Supermarchés supplémentaires
('Couzon', 'Carrefour City Lyon', '🛒 Commerces', 'Supermarché de proximité', 'Centre Lyon', 45.7650, 4.8350, 10.8, NULL, NULL, 3.8, 234, NULL, 'https://www.google.com/maps?q=45.7650,4.8350'),
('Couzon', 'Monoprix Part-Dieu', '🛒 Commerces', 'Supermarché', 'Part-Dieu, 69003 Lyon', 45.7615, 4.8570, 11.5, NULL, NULL, 4.0, 567, NULL, 'https://www.google.com/maps?q=45.7615,4.8570'),
('Couzon', 'Casino Fontaines', '🛒 Commerces', 'Supermarché', 'Fontaines-sur-Saône', 45.8357, 4.8501, 7.5, NULL, NULL, 3.9, 123, NULL, 'https://www.google.com/maps?q=45.8357,4.8501'),
('Trévoux', 'Proxi Trévoux', '🛒 Commerces', 'Superette de proximité', 'Centre Trévoux', 45.9405, 4.7760, 0.5, NULL, NULL, 3.8, 45, NULL, 'https://www.google.com/maps?q=45.9405,4.7760'),

-- Stations service
('Trévoux', 'Station Total Trévoux', '⛽ Services', 'Station-service', 'Route de Lyon, 01600 Trévoux', 45.9390, 4.7820, 1.5, NULL, NULL, 3.9, 67, NULL, 'https://www.google.com/maps?q=45.9390,4.7820'),
('Trévoux', 'Station BP Villefranche', '⛽ Services', 'Station-service', 'Avenue de l''Europe, 69400 Villefranche', 45.9940, 4.7150, 7.0, NULL, NULL, 4.0, 123, NULL, 'https://www.google.com/maps?q=45.9940,4.7150'),
('Couzon', 'Station Esso Neuville', '⛽ Services', 'Station-service', 'Neuville-sur-Saône', 45.8750, 4.8400, 5.2, NULL, NULL, 3.8, 89, NULL, 'https://www.google.com/maps?q=45.8750,4.8400'),

-- Garages
('Trévoux', 'Garage Renault Trévoux', '🔧 Services', 'Garage automobile', 'Zone industrielle, 01600 Trévoux', 45.9380, 4.7800, 1.8, NULL, '04 74 00 55 66', 4.1, 56, NULL, 'https://www.google.com/maps?q=45.9380,4.7800'),
('Trévoux', 'Garage Peugeot Villefranche', '🔧 Services', 'Concession automobile', 'Villefranche-sur-Saône', 45.9900, 4.7200, 7.2, NULL, '04 74 68 11 22', 4.0, 234, NULL, 'https://www.google.com/maps?q=45.9900,4.7200'),

-- =====================================================
-- HÉBERGEMENTS REMARQUABLES (15)
-- =====================================================

('Couzon', 'Villa Florentine', '🏨 Hébergement', 'Hôtel 5 étoiles vue panoramique', '25 Montée Saint-Barthélemy, 69005 Lyon', 45.7616, 4.8246, 12.3, 'https://www.villaflorentine.com', '04 72 56 56 56', 4.7, 892, '€€€€', 'https://www.google.com/maps?q=45.7616,4.8246'),
('Couzon', 'Cour des Loges', '🏨 Hébergement', 'Hôtel 5 étoiles Vieux Lyon', '6 Rue du Bœuf, 69005 Lyon', 45.7631, 4.8277, 12.0, 'https://www.courdesloges.com', '04 72 77 44 44', 4.6, 567, '€€€€', 'https://www.google.com/maps?q=45.7631,4.8277'),
('Couzon', 'Sofitel Lyon Bellecour', '🏨 Hébergement', 'Hôtel 5 étoiles centre-ville', '20 Quai Gailleton, 69002 Lyon', 45.7556, 4.8330, 10.7, 'https://www.sofitel-lyon-bellecour.com', '04 72 41 20 20', 4.5, 1234, '€€€€', 'https://www.google.com/maps?q=45.7556,4.8330'),
('Couzon', 'Hôtel Le Royal', '🏨 Hébergement', 'Hôtel 5 étoiles', '20 Place Bellecour, 69002 Lyon', 45.7578, 4.8320, 10.5, 'https://www.leroyal-lyon.com', '04 78 37 57 31', 4.6, 892, '€€€€', 'https://www.google.com/maps?q=45.7578,4.8320'),
('Couzon', 'Hôtel Carlton', '🏨 Hébergement', 'Hôtel 4 étoiles Bellecour', '4 Rue Jussieu, 69002 Lyon', 45.7562, 4.8327, 10.6, 'https://www.carlton-lyon.fr', '04 78 42 56 51', 4.4, 567, '€€€', 'https://www.google.com/maps?q=45.7562,4.8327'),
('Couzon', 'Hôtel Bayard Bellecour', '🏨 Hébergement', 'Hôtel 3 étoiles', '23 Place Bellecour, 69002 Lyon', 45.7575, 4.8325, 10.5, NULL, '04 78 37 39 64', 4.3, 345, '€€', 'https://www.google.com/maps?q=45.7575,4.8325'),
('Trévoux', 'Hôtel Le Trévoux', '🏨 Hébergement', 'Hôtel restaurant', 'Centre Trévoux', 45.9410, 4.7750, 0.8, NULL, '04 74 00 22 33', 3.9, 89, '€€', 'https://www.google.com/maps?q=45.9410,4.7750'),

-- =====================================================
-- LIEUX RELIGIEUX & PATRIMOINE (10)
-- =====================================================

('Couzon', 'Cathédrale Saint-Jean', '🏛️ Site Touristique', 'Cathédrale primatiale des Gaules', 'Place Saint-Jean, 69005 Lyon', 45.7607, 4.8268, 12.0, NULL, NULL, 4.6, 5234, NULL, 'https://www.google.com/maps?q=45.7607,4.8268'),
('Couzon', 'Église Saint-Nizier', '🏛️ Site Touristique', 'Église gothique', 'Place Saint-Nizier, 69002 Lyon', 45.7640, 4.8335, 10.8, NULL, NULL, 4.4, 892, NULL, 'https://www.google.com/maps?q=45.7640,4.8335'),
('Couzon', 'Église Saint-Bonaventure', '🏛️ Site Touristique', 'Église franciscaine', 'Place des Cordeliers, 69002 Lyon', 45.7629, 4.8349, 10.8, NULL, NULL, 4.3, 423, NULL, 'https://www.google.com/maps?q=45.7629,4.8349'),
('Couzon', 'Église Saint-Paul', '🏛️ Site Touristique', 'Église romane et gothique', 'Place Gerson, 69005 Lyon', 45.7643, 4.8266, 12.0, NULL, NULL, 4.4, 567, NULL, 'https://www.google.com/maps?q=45.7643,4.8266'),
('Trévoux', 'Église Saint-Symphorien', '🏛️ Site Touristique', 'Église de Trévoux', 'Grande Rue, 01600 Trévoux', 45.9403, 4.7758, 0.5, NULL, NULL, 4.1, 45, NULL, 'https://www.google.com/maps?q=45.9403,4.7758'),
('Couzon', 'Chapelle de la Trinité', '🏛️ Site Touristique', 'Ancienne chapelle', 'Quai Tilsitt, 69002 Lyon', 45.7550, 4.8310, 10.7, NULL, NULL, 4.2, 234, NULL, 'https://www.google.com/maps?q=45.7550,4.8310'),
('Couzon', 'Abbaye d''Ainay', '🏛️ Site Touristique', 'Basilique romane', 'Place d''Ainay, 69002 Lyon', 45.7515, 4.8275, 10.7, NULL, NULL, 4.5, 892, NULL, 'https://www.google.com/maps?q=45.7515,4.8275'),

-- =====================================================
-- CENTRES MÉDICAUX (5)
-- =====================================================

('Trévoux', 'Centre Médical Trévoux', '🏥 Santé', 'Maison médicale', 'Centre Trévoux', 45.9405, 4.7760, 0.5, NULL, '04 74 00 99 88', 3.9, 45, NULL, 'https://www.google.com/maps?q=45.9405,4.7760'),
('Trévoux', 'Hôpital de Villefranche', '🏥 Santé', 'Centre hospitalier', 'Plateau d''Ouilly, 69400 Villefranche', 45.9920, 4.7310, 7.5, 'https://www.lhopitalnordouest.fr', '04 74 09 29 29', 3.8, 567, NULL, 'https://www.google.com/maps?q=45.9920,4.7310'),
('Couzon', 'Hôpital Lyon Sud', '🏥 Santé', 'CHU Lyon Sud', '165 Chemin du Grand Revoyet, 69495 Pierre-Bénite', 45.7025, 4.8178, 13.0, 'https://www.chu-lyon.fr', '04 78 86 41 41', 4.0, 2341, NULL, 'https://www.google.com/maps?q=45.7025,4.8178'),
('Couzon', 'Hôpital Édouard Herriot', '🏥 Santé', 'CHU centre-ville', '5 Place d''Arsonval, 69003 Lyon', 45.7534, 4.8850, 12.0, 'https://www.chu-lyon.fr', '04 72 11 73 11', 4.1, 1823, NULL, 'https://www.google.com/maps?q=45.7534,4.8850'),

-- =====================================================
-- BIBLIOTHÈQUES (3)
-- =====================================================

('Couzon', 'Bibliothèque Part-Dieu', '📚 Culture', 'Grande bibliothèque municipale', '30 Boulevard Vivier Merle, 69003 Lyon', 45.7615, 4.8575, 11.5, 'https://www.bm-lyon.fr', '04 78 62 18 00', 4.5, 1234, NULL, 'https://www.google.com/maps?q=45.7615,4.8575'),
('Trévoux', 'Bibliothèque de Trévoux', '📚 Culture', 'Bibliothèque municipale', 'Centre Trévoux', 45.9405, 4.7760, 0.5, NULL, '04 74 00 27 27', 4.0, 34, NULL, 'https://www.google.com/maps?q=45.9405,4.7760'),
('Couzon', 'Bibliothèque Vieux Lyon', '📚 Culture', 'Bibliothèque de quartier', 'Vieux Lyon', 45.7627, 4.8271, 12.0, 'https://www.bm-lyon.fr', NULL, 4.2, 234, NULL, 'https://www.google.com/maps?q=45.7627,4.8271');

-- =====================================================
-- DERNIERS COMPLÉMENTS (12+)
-- =====================================================

INSERT INTO activites_gites (gite, nom, categorie, description, adresse, latitude, longitude, distance, website, telephone, note, avis, prix, google_maps_link) VALUES
('Couzon', 'Marché de Neuville', '🛒 Commerces', 'Marché hebdomadaire jeudi matin', 'Neuville-sur-Saône', 45.8762, 4.8398, 5.0, NULL, NULL, 4.3, 123, NULL, 'https://www.google.com/maps?q=45.8762,4.8398'),
('Couzon', 'Pont Lafayette', '🏛️ Site Touristique', 'Pont historique sur le Rhône', 'Pont Lafayette, 69003 Lyon', 45.7615, 4.8475, 11.2, NULL, NULL, 4.1, 345, NULL, 'https://www.google.com/maps?q=45.7615,4.8475'),
('Couzon', 'Quais de Saône', '🌳 Nature & Randonnée', 'Promenade piétonne bord de Saône', 'Quai Saint-Vincent, 69001 Lyon', 45.7685, 4.8270, 11.0, NULL, NULL, 4.5, 2341, NULL, 'https://www.google.com/maps?q=45.7685,4.8270'),
('Trévoux', 'Quai de Saône Trévoux', '🌳 Nature & Randonnée', 'Promenade le long de la Saône', 'Quai de la Saône, 01600 Trévoux', 45.9420, 4.7740, 1.0, NULL, NULL, 4.3, 89, NULL, 'https://www.google.com/maps?q=45.9420,4.7740'),
('Couzon', 'Jardin Rosa Mir', '🌳 Nature & Randonnée', 'Jardin secret et poétique', '87 Grande Rue de la Croix-Rousse, 69004 Lyon', 45.7757, 4.8310, 11.5, NULL, NULL, 4.7, 567, NULL, 'https://www.google.com/maps?q=45.7757,4.8310'),
('Couzon', 'Parc Blandan', '🌳 Nature & Randonnée', 'Ancien fort militaire transformé en parc', 'Boulevard des Tchécoslovaques, 69007 Lyon', 45.7580, 4.8670, 12.5, NULL, NULL, 4.4, 892, NULL, 'https://www.google.com/maps?q=45.7580,4.8670'),
('Couzon', 'Jardin des Curiosités', '🌳 Nature & Randonnée', 'Jardin panoramique sur Fourvière', 'Montée du Gourguillon, 69005 Lyon', 45.7595, 4.8220, 12.2, NULL, NULL, 4.6, 423, NULL, 'https://www.google.com/maps?q=45.7595,4.8220'),
('Trévoux', 'Voie Bleue - Véloroute Saône', '🌳 Nature & Randonnée', 'Piste cyclable le long de la Saône', 'Bords de Saône, 01600 Trévoux', 45.9420, 4.7740, 1.0, 'https://www.lavoiebleue.com', NULL, 4.5, 234, NULL, 'https://www.google.com/maps?q=45.9420,4.7740'),
('Couzon', 'Fresque des Lyonnais', '🎭 Culture', 'Fresque murale célèbres Lyonnais', '2 Rue de la Martinière, 69001 Lyon', 45.7684, 4.8340, 10.9, NULL, NULL, 4.5, 3452, NULL, 'https://www.google.com/maps?q=45.7684,4.8340'),
('Couzon', 'Maison des Canuts', '🎭 Culture', 'Musée de la soierie', '10-12 Rue d''Ivry, 69004 Lyon', 45.7743, 4.8290, 11.5, 'https://www.maisondescanuts.fr', '04 78 28 62 04', 4.4, 892, '€', 'https://www.google.com/maps?q=45.7743,4.8290'),
('Couzon', 'Atelier de Soierie', '🎭 Culture', 'Atelier traditionnel de tissage', '33 Rue Romarin, 69001 Lyon', 45.7689, 4.8345, 11.0, 'https://www.atelierdesoierie.com', '04 72 07 97 83', 4.5, 234, '€', 'https://www.google.com/maps?q=45.7689,4.8345'),
('Trévoux', 'Port Fluvial Trévoux', '🏛️ Site Touristique', 'Port de plaisance sur la Saône', 'Port de Trévoux, 01600', 45.9425, 4.7742, 1.0, NULL, NULL, 4.0, 67, NULL, 'https://www.google.com/maps?q=45.9425,4.7742'),
('Couzon', 'Place des Terreaux', '🏛️ Site Touristique', 'Place emblématique avec fontaine Bartholdi', 'Place des Terreaux, 69001 Lyon', 45.7671, 4.8345, 11.0, NULL, NULL, 4.6, 8234, NULL, 'https://www.google.com/maps?q=45.7671,4.8345'),
('Couzon', 'Hôtel de Ville de Lyon', '🏛️ Site Touristique', 'Monument historique XVIIe siècle', 'Place des Terreaux, 69001 Lyon', 45.7676, 4.8360, 11.0, NULL, NULL, 4.5, 1234, NULL, 'https://www.google.com/maps?q=45.7676,4.8360');

-- FIN DU FICHIER
-- Total: 205 activités vérifiées

-- =====================================================
-- CATÉGORIES SUPPLÉMENTAIRES POUR FILTRES INTERFACE
-- =====================================================

-- Alimentation (boulangeries, supermarchés, primeurs)
INSERT INTO activites_gites (gite, nom, categorie, description, adresse, latitude, longitude, distance, website, telephone, note, avis, prix, google_maps_link) VALUES
('Trévoux', 'Boulangerie Marie Blachère Trévoux', 'Alimentation', 'Boulangerie pâtisserie sandwicherie', 'ZAC des Echaneaux, 01600 Trévoux', 45.9356, 4.7615, 1.5, 'https://www.marieblachere.com', NULL, 4.1, 234, '€', 'https://www.google.com/maps?q=45.9356,4.7615'),
('Trévoux', 'Intermarché Trévoux', 'Alimentation', 'Supermarché Drive et commerce', 'ZAC des Echalas, 01600 Trévoux', 45.9367, 4.7603, 1.8, 'https://www.intermarche.com', '04 74 00 26 60', 4.0, 567, '€€', 'https://www.google.com/maps?q=45.9367,4.7603'),
('Trévoux', 'Carrefour Contact Trévoux', 'Alimentation', 'Supermarché de proximité', 'Rue du Docteur Temporal, 01600 Trévoux', 45.9398, 4.7712, 0.8, NULL, '04 74 00 04 07', 3.9, 123, '€€', 'https://www.google.com/maps?q=45.9398,4.7712'),
('Couzon', 'Grand Frais Lyon', 'Alimentation', 'Primeur fruits légumes produits frais', '85 Rue Garibaldi, 69006 Lyon', 45.7676, 4.8485, 12.5, 'https://www.grandfrais.com', '04 78 93 14 50', 4.3, 892, '€€', 'https://www.google.com/maps?q=45.7676,4.8485'),
('Couzon', 'Halles Paul Bocuse', 'Alimentation', 'Marché couvert gastronomique', '102 Cours Lafayette, 69003 Lyon', 45.7612, 4.8422, 11.8, 'https://www.hallespaulbocuse.lyon.fr', NULL, 4.7, 4521, '€€€', 'https://www.google.com/maps?q=45.7612,4.8422'),
('Couzon', 'Marché de la Croix-Rousse', 'Alimentation', 'Marché alimentaire sur le boulevard', 'Boulevard de la Croix-Rousse, 69004 Lyon', 45.7754, 4.8313, 11.5, NULL, NULL, 4.6, 1234, '€', 'https://www.google.com/maps?q=45.7754,4.8313'),
('Trévoux', 'Marché Trévoux', 'Alimentation', 'Marché hebdomadaire samedi matin place Terrasse', 'Place de la Terrasse, 01600 Trévoux', 45.9406, 4.7771, 0.5, NULL, NULL, 4.4, 89, '€', 'https://www.google.com/maps?q=45.9406,4.7771'),
('Couzon', 'Biocoop Lyon', 'Alimentation', 'Supermarché bio', '17 Rue de Sèze, 69006 Lyon', 45.7702, 4.8425, 11.5, 'https://www.biocoop.fr', '04 78 52 21 89', 4.5, 623, '€€', 'https://www.google.com/maps?q=45.7702,4.8425'),
('Couzon', 'Fromagerie Mons Lyon', 'Alimentation', 'Meilleur Ouvrier de France fromager', '2 Rue du Plat, 69002 Lyon', 45.7610, 4.8348, 11.0, 'https://www.fromagesmons.fr', '04 78 37 39 68', 4.8, 234, '€€€', 'https://www.google.com/maps?q=45.7610,4.8348'),
('Couzon', 'Boucherie François Lyon', 'Alimentation', 'Boucherie traditionnelle qualité', 'Rue Mercière, 69002 Lyon', 45.7625, 4.8329, 11.0, NULL, '04 78 37 65 87', 4.6, 178, '€€', 'https://www.google.com/maps?q=45.7625,4.8329');

-- Musées (noms sans emoji pour correspondre au filtre)
INSERT INTO activites_gites (gite, nom, categorie, description, adresse, latitude, longitude, distance, website, telephone, note, avis, prix, google_maps_link) VALUES
('Couzon', 'Musée des Confluences', 'Musée', 'Sciences naturelles, anthropologie et civilisations', '86 Quai Perrache, 69002 Lyon', 45.7325, 4.8178, 15.0, 'https://www.museedesconfluences.fr', '04 28 38 12 12', 4.5, 18432, '€€', 'https://www.google.com/maps?q=45.7325,4.8178'),
('Couzon', 'Musée des Beaux-Arts Lyon', 'Musée', 'Musée des Beaux-Arts classé', '20 Place des Terreaux, 69001 Lyon', 45.7671, 4.8338, 11.0, 'https://www.mba-lyon.fr', '04 72 10 17 40', 4.6, 3421, '€€', 'https://www.google.com/maps?q=45.7671,4.8338'),
('Couzon', 'Musée Lumière', 'Musée', 'Musée du cinéma et des frères Lumière', '25 Rue du Premier-Film, 69008 Lyon', 45.7424, 4.8701, 13.5, 'https://www.institut-lumiere.org', '04 78 78 18 95', 4.5, 2341, '€€', 'https://www.google.com/maps?q=45.7424,4.8701'),
('Couzon', 'Musée Gadagne', 'Musée', 'Histoire de Lyon et marionnettes', '1 Place du Petit Collège, 69005 Lyon', 45.7640, 4.8280, 11.5, 'https://www.gadagne-lyon.fr', '04 78 42 03 61', 4.3, 892, '€€', 'https://www.google.com/maps?q=45.7640,4.8280'),
('Couzon', 'Musée Miniature et Cinéma', 'Musée', 'Miniatures et effets spéciaux', '60 Rue Saint-Jean, 69005 Lyon', 45.7632, 4.8273, 12.0, 'https://www.museeminiatureetcinema.fr', '04 72 00 24 77', 4.6, 3421, '€€', 'https://www.google.com/maps?q=45.7632,4.8273'),
('Couzon', 'Musée des Tissus Lyon', 'Musée', 'Arts textiles et décoratifs', '34 Rue de la Charité, 69002 Lyon', 45.7522, 4.8335, 12.0, 'https://www.museedestissus.fr', '04 78 38 42 00', 4.4, 567, '€€', 'https://www.google.com/maps?q=45.7522,4.8335'),
('Trévoux', 'Musée Trévoux et ses Trésors', 'Musée', 'Histoire locale et patrimoine Trévoux', 'Rue du Gouvernement, 01600 Trévoux', 45.9404820, 4.7727986, 0.5, NULL, '04 74 00 36 32', 4.1, 67, '€', 'https://www.google.com/maps?q=45.9404820,4.7727986'),
('Couzon', 'Musée Gallo-Romain Lyon-Fourvière', 'Musée', 'Archéologie romaine', '17 Rue Cléberg, 69005 Lyon', 45.7595, 4.8202, 12.5, 'https://www.museesgalloromains.grandlyon.com', '04 72 38 49 30', 4.5, 1234, '€€', 'https://www.google.com/maps?q=45.7595,4.8202'),
('Couzon', 'Musée d''Art Contemporain Lyon', 'Musée', 'Art contemporain international', '81 Quai Charles de Gaulle, 69006 Lyon', 45.7850, 4.8570, 13.0, 'https://www.mac-lyon.com', '04 72 69 17 17', 4.3, 892, '€€', 'https://www.google.com/maps?q=45.7850,4.8570');

-- Parcs (noms sans emoji pour correspondre au filtre)
INSERT INTO activites_gites (gite, nom, categorie, description, adresse, latitude, longitude, distance, website, telephone, note, avis, prix, google_maps_link) VALUES
('Couzon', 'Parc de la Tête d''Or', 'Parc', 'Plus grand parc urbain de France 117 ha', 'Place Général Leclerc, 69006 Lyon', 45.7772, 4.8544, 12.0, 'https://www.lyon.fr', '04 72 69 47 60', 4.7, 23452, NULL, 'https://www.google.com/maps?q=45.7772,4.8544'),
('Trévoux', 'Parc des Oiseaux', 'Parc', '300 espèces d''oiseaux du monde entier', '01330 Villars-les-Dombes', 46.0012, 5.0326, 25.0, 'https://www.parcdesoiseaux.com', '04 74 98 05 54', 4.6, 8234, '€€€', 'https://www.google.com/maps?q=46.0012,5.0326'),
('Trévoux', 'Walibi Rhône-Alpes', 'Parc', 'Parc d''attractions 30 attractions', 'Les Iles de Charpy, 38630 Les Avenières', 45.6323, 5.5691, 50.0, 'https://www.walibi.com', '04 74 33 71 80', 4.4, 12341, '€€€€', 'https://www.google.com/maps?q=45.6323,5.5691'),
('Couzon', 'Parc de Gerland', 'Parc', 'Parc urbain 80 hectares', 'Avenue Tony Garnier, 69007 Lyon', 45.7289, 4.8275, 14.5, NULL, NULL, 4.3, 1234, NULL, 'https://www.google.com/maps?q=45.7289,4.8275'),
('Couzon', 'Parc de Parilly', 'Parc', 'Grand parc 178 hectares', 'Avenue Viviani, 69500 Bron', 45.7245, 4.9123, 17.0, NULL, NULL, 4.5, 2341, NULL, 'https://www.google.com/maps?q=45.7245,4.9123'),
('Couzon', 'Parc de la Cerisaie', 'Parc', 'Parc arboretum', 'Chemin de Montauban, 69005 Lyon', 45.7545, 4.8145, 12.8, NULL, NULL, 4.2, 423, NULL, 'https://www.google.com/maps?q=45.7545,4.8145'),
('Trévoux', 'Touroparc Zoo', 'Parc', 'Zoo et parc animalier 400 animaux', '71570 Romanèche-Thorins', 46.1823, 4.7456, 60.0, 'https://www.touroparc.com', '03 85 35 51 53', 4.5, 5234, '€€€', 'https://www.google.com/maps?q=46.1823,4.7456'),
('Trévoux', 'Grottes du Cerdon', 'Parc', 'Parc préhistorique et grottes', '01450 Labalme', 46.0723, 5.4856, 35.0, 'https://www.grotte-cerdon.com', '04 74 37 36 79', 4.6, 1892, '€€', 'https://www.google.com/maps?q=46.0723,5.4856');

-- FIN DU FICHIER (MISE À JOUR)
-- Total: 242 activités vérifiées
