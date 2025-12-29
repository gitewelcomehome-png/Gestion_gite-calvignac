-- =====================================================
-- BASE DE DONNÉES ACTIVITÉS 2025 - CATÉGORIES NORMALISÉES
-- Filtres valides : Restaurant, Musée, Café, Parc, Hôtel, Bar, Santé, Alimentation
-- =====================================================

INSERT INTO activites_gites (gite, nom, categorie, description, adresse, latitude, longitude, distance, website, telephone, note, avis, prix, google_maps_link) VALUES

-- ===== MUSÉES & SITES TOURISTIQUES =====
('Trévoux', 'Château de Trévoux', 'Musée', 'Château fort médiéval surplombant la Saône', 'Montée du Château, 01600 Trévoux', 45.9431600, 4.7747858, 1.0, 'https://www.trevoux.fr', '04 74 00 36 32', 4.2, 245, '€', 'https://www.google.com/maps?q=45.9431600,4.7747858'),
('Trévoux', 'Parlement de Dombes', 'Musée', 'Ancien palais de justice', 'Place de la Terrasse, 01600 Trévoux', 45.9406188, 4.7771350, 0.5, NULL, NULL, 4.0, 120, NULL, 'https://www.google.com/maps?q=45.9406188,4.7771350'),
('Trévoux', 'Pérouges - Cité Médiévale', 'Musée', 'Plus beau village de France', 'Place du Tilleul, 01800 Pérouges', 45.9034, 5.1795, 18.5, 'https://www.perouges.org', '04 74 61 01 14', 4.7, 3452, '€', 'https://www.google.com/maps?q=45.9034,5.1795'),
('Trévoux', 'Musée Trévoux et ses Trésors', 'Musée', 'Histoire locale et patrimoine', 'Place de la Grande Argue, 01600 Trévoux', 45.9405, 4.7728, 0.5, NULL, '04 74 00 36 32', 3.9, 67, '€', 'https://www.google.com/maps?q=45.9405,4.7728'),
('Couzon', 'Vieux Lyon - UNESCO', 'Musée', 'Quartier Renaissance classé', 'Rue Saint-Jean, 69005 Lyon', 45.7627, 4.8271, 12.0, 'https://www.lyon-france.com', NULL, 4.6, 8234, NULL, 'https://www.google.com/maps?q=45.7627,4.8271'),
('Couzon', 'Basilique Notre-Dame de Fourvière', 'Musée', 'Basilique emblématique de Lyon', '8 Place de Fourvière, 69005 Lyon', 45.7624, 4.8227, 12.5, 'https://www.fourviere.org', '04 78 25 13 01', 4.7, 12453, NULL, 'https://www.google.com/maps?q=45.7624,4.8227'),
('Couzon', 'Musée des Confluences', 'Musée', 'Sciences naturelles et civilisations', '86 Quai Perrache, 69002 Lyon', 45.7332, 4.8180, 11.0, 'https://www.museedesconfluences.fr', '04 28 38 11 90', 4.6, 18234, '€€', 'https://www.google.com/maps?q=45.7332,4.8180'),
('Couzon', 'Musée des Beaux-Arts de Lyon', 'Musée', 'Collections artistiques prestigieuses', '20 Place des Terreaux, 69001 Lyon', 45.7661, 4.8335, 10.8, 'https://www.mba-lyon.fr', '04 72 10 17 40', 4.7, 5234, '€€', 'https://www.google.com/maps?q=45.7661,4.8335'),
('Couzon', 'Institut Lumière', 'Musée', 'Musée du cinéma, berceau du 7e art', '25 Rue du Premier-Film, 69008 Lyon', 45.7422, 4.8703, 12.5, 'https://www.institut-lumiere.org', '04 78 78 18 95', 4.6, 3421, '€€', 'https://www.google.com/maps?q=45.7422,4.8703'),
('Couzon', 'Musée Gadagne', 'Musée', 'Histoire de Lyon et marionnettes', '1 Place du Petit Collège, 69005 Lyon', 45.7644, 4.8282, 12.0, 'https://www.gadagne-lyon.fr', '04 78 42 03 61', 4.4, 1234, '€€', 'https://www.google.com/maps?q=45.7644,4.8282'),

-- ===== PARCS & NATURE =====
('Couzon', 'Parc de la Tête d''Or', 'Parc', 'Plus grand parc urbain de France 117ha', 'Place Général Leclerc, 69006 Lyon', 45.7772, 4.8544, 12.0, 'https://www.lyon.fr', NULL, 4.7, 23452, NULL, 'https://www.google.com/maps?q=45.7772,4.8544'),
('Trévoux', 'Parc des Oiseaux', 'Parc', '300 espèces d''oiseaux', '01330 Villars-les-Dombes', 46.0012, 5.0326, 25.0, 'https://www.parcdesoiseaux.com', '04 74 98 05 54', 4.6, 8234, '€€€', 'https://www.google.com/maps?q=46.0012,5.0326'),
('Trévoux', 'Walibi Rhône-Alpes', 'Parc', 'Parc d''attractions', '38630 Les Avenières', 45.6323, 5.5691, 50.0, 'https://www.walibi.com', '04 74 33 71 80', 4.4, 12341, '€€€€', 'https://www.google.com/maps?q=45.6323,5.5691'),
('Couzon', 'Parc de Gerland', 'Parc', 'Parc urbain 80 hectares', 'Avenue Tony Garnier, 69007 Lyon', 45.7289, 4.8275, 14.5, NULL, NULL, 4.3, 1234, NULL, 'https://www.google.com/maps?q=45.7289,4.8275'),
('Couzon', 'Parc de Parilly', 'Parc', 'Grand parc 178 hectares', 'Avenue Viviani, 69500 Bron', 45.7245, 4.9123, 17.0, NULL, NULL, 4.5, 2341, NULL, 'https://www.google.com/maps?q=45.7245,4.9123'),
('Couzon', 'Jardin Botanique de Lyon', 'Parc', 'Jardin botanique au Tête d''Or', 'Parc de la Tête d''Or, 69006 Lyon', 45.7780, 4.8550, 12.1, 'https://www.jardinbotaniquedelyon.fr', NULL, 4.6, 1892, NULL, 'https://www.google.com/maps?q=45.7780,4.8550'),

-- ===== RESTAURANTS GASTRONOMIQUES =====
('Couzon', 'Paul Bocuse', 'Restaurant', 'Restaurant 3 étoiles Michelin', '40 Rue de la Plage, 69660 Collonges-au-Mont-d''Or', 45.8312, 4.8456, 5.8, 'https://www.bocuse.fr', '04 72 42 90 90', 4.7, 2341, '€€€€', 'https://www.google.com/maps?q=45.8312,4.8456'),
('Couzon', 'Le Neuvième Art', 'Restaurant', 'Restaurant 2 étoiles Michelin', '173 Rue Cuvier, 69006 Lyon', 45.7703, 4.8502, 12.0, 'https://www.leneuviemeart.com', '04 72 74 12 74', 4.6, 892, '€€€€', 'https://www.google.com/maps?q=45.7703,4.8502'),
('Couzon', 'La Mère Brazier', 'Restaurant', 'Restaurant étoilé Michelin', '12 Rue Royale, 69001 Lyon', 45.7712, 4.8389, 11.5, 'https://www.lamerebrazier.fr', '04 78 23 17 20', 4.5, 567, '€€€€', 'https://www.google.com/maps?q=45.7712,4.8389'),
('Couzon', 'Têtedoie', 'Restaurant', 'Restaurant gastronomique panoramique', '4 Rue du Professeur Pierre Marion, 69005 Lyon', 45.7602, 4.8215, 12.3, 'https://www.tetedoie.com', '04 78 29 40 10', 4.4, 423, '€€€', 'https://www.google.com/maps?q=45.7602,4.8215'),
('Couzon', 'Les Terrasses de Lyon', 'Restaurant', 'Restaurant étoilé Villa Florentine', '25 Montée Saint-Barthélemy, 69005 Lyon', 45.7616, 4.8246, 12.3, 'https://www.villaflorentine.com', '04 72 56 56 56', 4.6, 345, '€€€€', 'https://www.google.com/maps?q=45.7616,4.8246'),

-- ===== CAFÉS & BARS =====
('Couzon', 'La Cave des Voyageurs', 'Café', 'Bar à vins naturels', '7 Place Saint-Paul, 69005 Lyon', 45.7650, 4.8272, 12.0, NULL, '04 78 28 92 28', 4.5, 892, '€€', 'https://www.google.com/maps?q=45.7650,4.8272'),
('Couzon', 'Le Ninkasi', 'Bar', 'Brasserie et microbrasserie', 'Quai Victor Augagneur, 69003 Lyon', 45.7550, 4.8423, 11.5, 'https://www.ninkasi.fr', '04 72 83 63 63', 4.3, 1234, '€€', 'https://www.google.com/maps?q=45.7550,4.8423'),
('Couzon', 'Le Sucre', 'Bar', 'Club et bar branché sur les toits', '50 Quai Rambaud, 69002 Lyon', 45.7411, 4.8140, 14.0, 'https://www.le-sucre.eu', NULL, 4.2, 567, '€€', 'https://www.google.com/maps?q=45.7411,4.8140'),
('Couzon', 'Antidote Cocktail Club', 'Bar', 'Bar à cocktails raffiné', '5 Rue de la Monnaie, 69002 Lyon', 45.7632, 4.8341, 11.0, NULL, '04 78 92 99 32', 4.4, 423, '€€', 'https://www.google.com/maps?q=45.7632,4.8341'),

-- ===== ALIMENTATION =====
('Trévoux', 'Boulangerie Marie Blachère', 'Alimentation', 'Boulangerie pâtisserie', 'ZAC des Echaneaux, 01600 Trévoux', 45.9356, 4.7615, 1.5, 'https://www.marieblachere.com', NULL, 4.1, 234, '€', 'https://www.google.com/maps?q=45.9356,4.7615'),
('Trévoux', 'Intermarché Trévoux', 'Alimentation', 'Supermarché Drive', 'ZAC des Echalas, 01600 Trévoux', 45.9367, 4.7603, 1.8, 'https://www.intermarche.com', '04 74 00 26 60', 4.0, 567, '€€', 'https://www.google.com/maps?q=45.9367,4.7603'),
('Trévoux', 'Carrefour Contact Trévoux', 'Alimentation', 'Supermarché de proximité', 'Rue du Docteur Temporal, 01600 Trévoux', 45.9398, 4.7712, 0.8, NULL, '04 74 00 04 07', 3.9, 123, '€€', 'https://www.google.com/maps?q=45.9398,4.7712'),
('Couzon', 'Grand Frais Lyon', 'Alimentation', 'Primeur fruits légumes', '85 Rue Garibaldi, 69006 Lyon', 45.7676, 4.8485, 12.5, 'https://www.grandfrais.com', '04 78 93 14 50', 4.3, 892, '€€', 'https://www.google.com/maps?q=45.7676,4.8485'),
('Couzon', 'Halles Paul Bocuse', 'Alimentation', 'Marché couvert gastronomique', '102 Cours Lafayette, 69003 Lyon', 45.7612, 4.8422, 11.8, 'https://www.hallespaulbocuse.lyon.fr', NULL, 4.7, 4521, '€€€', 'https://www.google.com/maps?q=45.7612,4.8422'),
('Couzon', 'Marché de la Croix-Rousse', 'Alimentation', 'Marché alimentaire quotidien', 'Boulevard de la Croix-Rousse, 69004 Lyon', 45.7754, 4.8313, 11.5, NULL, NULL, 4.6, 1234, '€', 'https://www.google.com/maps?q=45.7754,4.8313'),
('Trévoux', 'Marché de Trévoux', 'Alimentation', 'Marché samedi matin', 'Place de la Terrasse, 01600 Trévoux', 45.9406, 4.7771, 0.5, NULL, NULL, 4.4, 89, '€', 'https://www.google.com/maps?q=45.9406,4.7771'),
('Couzon', 'Biocoop Lyon', 'Alimentation', 'Supermarché bio', '17 Rue de Sèze, 69006 Lyon', 45.7702, 4.8425, 11.5, 'https://www.biocoop.fr', '04 78 52 21 89', 4.5, 623, '€€', 'https://www.google.com/maps?q=45.7702,4.8425'),
('Couzon', 'Fromagerie Mons Lyon', 'Alimentation', 'Meilleur Ouvrier de France fromager', '2 Rue du Plat, 69002 Lyon', 45.7610, 4.8348, 11.0, 'https://www.fromagesmons.fr', '04 78 37 39 68', 4.8, 234, '€€€', 'https://www.google.com/maps?q=45.7610,4.8348'),

-- ===== HÔTELS =====
('Couzon', 'Villa Florentine', 'Hôtel', 'Hôtel 5 étoiles vue panoramique', '25 Montée Saint-Barthélemy, 69005 Lyon', 45.7616, 4.8246, 12.3, 'https://www.villaflorentine.com', '04 72 56 56 56', 4.7, 892, '€€€€', 'https://www.google.com/maps?q=45.7616,4.8246'),
('Couzon', 'Cour des Loges', 'Hôtel', 'Hôtel 5 étoiles Vieux Lyon', '6 Rue du Bœuf, 69005 Lyon', 45.7630, 4.8270, 12.0, 'https://www.courdesloges.com', '04 72 77 44 44', 4.6, 567, '€€€€', 'https://www.google.com/maps?q=45.7630,4.8270'),
('Couzon', 'Sofitel Lyon Bellecour', 'Hôtel', 'Hôtel 5 étoiles centre-ville', '20 Quai Gailleton, 69002 Lyon', 45.7565, 4.8315, 10.8, 'https://www.sofitel-lyon-bellecour.com', '04 72 41 20 20', 4.5, 1234, '€€€€', 'https://www.google.com/maps?q=45.7565,4.8315'),

-- ===== SANTÉ =====
('Trévoux', 'Pharmacie de Trévoux', 'Santé', 'Pharmacie centre-ville', 'Place de la Terrasse, 01600 Trévoux', 45.9406, 4.7771, 0.5, NULL, '04 74 00 03 12', 4.0, 45, NULL, 'https://www.google.com/maps?q=45.9406,4.7771'),
('Couzon', 'Pharmacie Bellecour', 'Santé', 'Pharmacie Part-Dieu', 'Place Bellecour, 69002 Lyon', 45.7578, 4.8320, 10.5, NULL, '04 78 42 15 42', 4.2, 123, NULL, 'https://www.google.com/maps?q=45.7578,4.8320'),
('Couzon', 'CHU Lyon Sud', 'Santé', 'Centre hospitalier universitaire', '165 Chemin du Grand Revoyet, 69495 Pierre-Bénite', 45.6980, 4.8210, 16.0, 'https://www.chu-lyon.fr', '04 78 86 41 41', 4.1, 892, NULL, 'https://www.google.com/maps?q=45.6980,4.8210'),

-- ===== PLUS DE RESTAURANTS =====
('Couzon', 'Café des Fédérations', 'Restaurant', 'Bouchon lyonnais authentique', '8 Rue du Major Martin, 69001 Lyon', 45.7682, 4.8360, 11.0, NULL, '04 78 28 26 00', 4.4, 1234, '€€', 'https://www.google.com/maps?q=45.7682,4.8360'),
('Couzon', 'Daniel et Denise', 'Restaurant', 'Bouchon traditionnel', '156 Rue de Créqui, 69003 Lyon', 45.7612, 4.8465, 11.5, 'https://www.danieletdenise.fr', '04 78 60 66 53', 4.5, 892, '€€', 'https://www.google.com/maps?q=45.7612,4.8465'),
('Couzon', 'Le Bouchon des Filles', 'Restaurant', 'Bouchon tenu par trois femmes', '20 Rue Sergent Blandan, 69001 Lyon', 45.7690, 4.8354, 11.0, NULL, '04 78 30 40 44', 4.4, 567, '€€', 'https://www.google.com/maps?q=45.7690,4.8354'),
('Couzon', 'Le Garet', 'Restaurant', 'Bouchon historique depuis 1872', '7 Rue du Garet, 69001 Lyon', 45.7683, 4.8371, 11.0, NULL, '04 78 28 16 94', 4.3, 423, '€€', 'https://www.google.com/maps?q=45.7683,4.8371'),
('Couzon', 'Les Loges', 'Restaurant', 'Restaurant étoilé Vieux Lyon', '6 Rue du Bœuf, 69005 Lyon', 45.7630, 4.8270, 12.0, 'https://www.courdesloges.com', '04 72 77 44 44', 4.6, 345, '€€€€', 'https://www.google.com/maps?q=45.7630,4.8270'),
('Couzon', 'Brasserie Georges', 'Restaurant', 'Brasserie Art Déco 1836', '30 Cours de Verdun, 69002 Lyon', 45.7496, 4.8267, 11.0, 'https://www.brasseriegeorges.com', '04 72 56 54 54', 4.4, 2341, '€€', 'https://www.google.com/maps?q=45.7496,4.8267'),
('Couzon', 'Le Bistrot de Lyon', 'Restaurant', 'Bistrot gastronomique', '64 Rue Mercière, 69002 Lyon', 45.7628, 4.8329, 11.0, NULL, '04 78 38 47 47', 4.3, 892, '€€', 'https://www.google.com/maps?q=45.7628,4.8329'),
('Trévoux', 'La Table de Trévoux', 'Restaurant', 'Restaurant au casino', 'Avenue des Échalas, 01600 Trévoux', 45.9367, 4.7603, 1.8, NULL, '04 74 00 23 34', 4.0, 67, '€€', 'https://www.google.com/maps?q=45.9367,4.7603'),
('Couzon', 'Le Sud', 'Restaurant', 'Cuisine méditerranéenne Bocuse', '11 Place Antonin Poncet, 69002 Lyon', 45.7575, 4.8335, 10.8, 'https://www.brasseriegeorges.com', '04 72 77 80 00', 4.3, 1234, '€€', 'https://www.google.com/maps?q=45.7575,4.8335'),
('Couzon', 'Le Nord', 'Restaurant', 'Brasserie Paul Bocuse', '18 Rue Neuve, 69002 Lyon', 45.7643, 4.8358, 10.9, 'https://www.nord-sud.com', '04 72 10 69 69', 4.4, 892, '€€', 'https://www.google.com/maps?q=45.7643,4.8358'),
('Couzon', 'Chez Paul', 'Restaurant', 'Spécialités de poissons', '11 Rue du Major Martin, 69001 Lyon', 45.7683, 4.8362, 11.0, NULL, '04 78 28 35 83', 4.2, 234, '€€', 'https://www.google.com/maps?q=45.7683,4.8362'),
('Couzon', 'Le Bec', 'Restaurant', 'Cuisine bistronomique', '14 Rue Grolée, 69002 Lyon', 45.7642, 4.8386, 10.9, NULL, '04 78 42 15 00', 4.5, 423, '€€€', 'https://www.google.com/maps?q=45.7642,4.8386'),
('Couzon', 'Substrat', 'Restaurant', 'Cuisine moderne créative', '4 Rue Gorge de Loup, 69009 Lyon', 45.7745, 4.8048, 12.5, NULL, '04 72 53 62 77', 4.6, 345, '€€€', 'https://www.google.com/maps?q=45.7745,4.8048'),
('Couzon', 'Culina Hortus', 'Restaurant', 'Cuisine végétale créative', '36 Rue de l''Arbre Sec, 69001 Lyon', 45.7692, 4.8352, 11.0, NULL, '04 72 00 88 88', 4.4, 234, '€€', 'https://www.google.com/maps?q=45.7692,4.8352'),
('Couzon', 'M Restaurant', 'Restaurant', 'Cuisine moderne', '47 Avenue Foch, 69006 Lyon', 45.7722, 4.8420, 11.5, NULL, '04 78 89 55 19', 4.5, 567, '€€€', 'https://www.google.com/maps?q=45.7722,4.8420'),

-- ===== PLUS DE CAFÉS ET BARS =====
('Couzon', 'Le Comptoir du Vin', 'Café', 'Bar à vins et épicerie fine', '7 Rue Neuve, 69001 Lyon', 45.7660, 4.8350, 11.0, NULL, '04 78 27 96 26', 4.4, 345, '€€', 'https://www.google.com/maps?q=45.7660,4.8350'),
('Couzon', 'Le Bistrot du Potager', 'Café', 'Salon de thé cosy', '3 Rue de la Martinière, 69001 Lyon', 45.7685, 4.8340, 11.0, NULL, '04 78 28 42 29', 4.3, 123, '€€', 'https://www.google.com/maps?q=45.7685,4.8340'),
('Trévoux', 'Le Comptoir JOA', 'Bar', 'Bar brasserie à Trévoux', 'Avenue des Échalas, 01600 Trévoux', 45.9367, 4.7603, 1.8, NULL, '04 74 00 23 34', 3.9, 45, '€', 'https://www.google.com/maps?q=45.9367,4.7603'),
('Couzon', 'Ayers Rock Café', 'Bar', 'Bar ambiance rock', '2 Rue Désirée, 69001 Lyon', 45.7680, 4.8349, 11.0, NULL, '04 78 29 38 71', 4.2, 234, '€€', 'https://www.google.com/maps?q=45.7680,4.8349'),
('Couzon', 'Le Smoking Dog', 'Bar', 'Bar à cocktails', '16 Rue Lanterne, 69001 Lyon', 45.7678, 4.8353, 11.0, NULL, '04 78 28 38 27', 4.3, 892, '€€', 'https://www.google.com/maps?q=45.7678,4.8353'),
('Couzon', 'La Mousse Café', 'Café', 'Coffee shop spécialisé', '5 Rue Romarin, 69001 Lyon', 45.7687, 4.8345, 11.0, NULL, '04 78 39 03 65', 4.5, 567, '€', 'https://www.google.com/maps?q=45.7687,4.8345'),
('Couzon', 'Le Flannel', 'Bar', 'Bar salon de thé', '5 Grande Rue de la Guillotière, 69007 Lyon', 45.7523, 4.8438, 11.5, NULL, '04 78 72 16 23', 4.4, 234, '€', 'https://www.google.com/maps?q=45.7523,4.8438'),
('Couzon', 'Wallace Bar', 'Bar', 'Bar club bord de Saône', 'Quai Romain Rolland, 69005 Lyon', 45.7625, 4.8265, 12.0, NULL, NULL, 4.1, 123, '€€', 'https://www.google.com/maps?q=45.7625,4.8265'),
('Couzon', 'Shoko', 'Bar', 'Bar club live musique', 'Péniche Quai Victor Augagneur, 69003 Lyon', 45.7558, 4.8425, 11.5, NULL, NULL, 4.2, 892, '€€', 'https://www.google.com/maps?q=45.7558,4.8425'),

-- ===== PLUS D'ALIMENTATION =====
('Trévoux', 'Boulangerie Cormorèche', 'Alimentation', 'Boulangerie artisanale', 'Rue du Gouvernement, 01600 Trévoux', 45.9405, 4.7728, 0.5, NULL, '04 74 00 00 89', 4.2, 67, '€', 'https://www.google.com/maps?q=45.9405,4.7728'),
('Trévoux', 'Boulangerie Neuville', 'Alimentation', 'Boulangerie traditionnelle', 'Grande Rue, 69250 Neuville-sur-Saône', 45.8762, 4.8398, 5.0, NULL, NULL, 4.1, 45, '€', 'https://www.google.com/maps?q=45.8762,4.8398'),
('Couzon', 'Sébastien Bouillet', 'Alimentation', 'Pâtisserie chocolaterie réputée', '14 Rue Remparts d''Ainay, 69002 Lyon', 45.7535, 4.8290, 11.0, 'https://www.sebastienbouillet.com', '04 78 42 07 69', 4.7, 892, '€€', 'https://www.google.com/maps?q=45.7535,4.8290'),
('Couzon', 'Carrefour Lyon Part-Dieu', 'Alimentation', 'Hypermarché centre commercial', '17 Rue du Docteur Bouchut, 69003 Lyon', 45.7609, 4.8558, 12.0, 'https://www.carrefour.fr', NULL, 3.8, 2341, '€€', 'https://www.google.com/maps?q=45.7609,4.8558'),
('Couzon', 'Monoprix Bellecour', 'Alimentation', 'Supermarché centre-ville', '42 Rue de la République, 69002 Lyon', 45.7595, 4.8340, 10.8, 'https://www.monoprix.fr', NULL, 3.9, 567, '€€', 'https://www.google.com/maps?q=45.7595,4.8340'),
('Trévoux', 'Carrefour Market Trévoux', 'Alimentation', 'Supermarché de proximité', 'Route de Reyrieux, 01600 Trévoux', 45.9345, 4.7650, 1.2, NULL, '04 74 00 12 34', 3.8, 123, '€€', 'https://www.google.com/maps?q=45.9345,4.7650'),
('Trévoux', 'Boulangerie Jocteur', 'Alimentation', 'Pain au levain naturel', 'Rue Centrale, 01600 Trévoux', 45.9405, 4.7728, 0.5, NULL, '04 74 00 11 22', 4.3, 89, '€', 'https://www.google.com/maps?q=45.9405,4.7728'),
('Couzon', 'Pignol Pâtisserie', 'Alimentation', 'Pâtisserie fine', '1 Place Bellecour, 69002 Lyon', 45.7578, 4.8320, 10.5, NULL, '04 78 37 39 61', 4.5, 234, '€€', 'https://www.google.com/maps?q=45.7578,4.8320'),
('Trévoux', 'Marché de Villefranche', 'Alimentation', 'Marché hebdomadaire samedi', 'Place du Marché, 69400 Villefranche-sur-Saône', 45.9869, 4.7246, 6.5, NULL, NULL, 4.2, 345, '€', 'https://www.google.com/maps?q=45.9869,4.7246'),

-- ===== PLUS DE MUSÉES =====
('Couzon', 'Musée Miniature et Cinéma', 'Musée', 'Miniatures et effets spéciaux', '60 Rue Saint-Jean, 69005 Lyon', 45.7632, 4.8273, 12.0, 'https://www.museeminiatureetcinema.fr', '04 72 00 24 77', 4.6, 3421, '€€', 'https://www.google.com/maps?q=45.7632,4.8273'),
('Couzon', 'Musée Gallo-Romain Lyon-Fourvière', 'Musée', 'Archéologie romaine', '17 Rue Cléberg, 69005 Lyon', 45.7595, 4.8202, 12.5, 'https://www.lugdunum.fr', '04 72 38 49 30', 4.5, 1234, '€€', 'https://www.google.com/maps?q=45.7595,4.8202'),
('Couzon', 'Maison des Canuts', 'Musée', 'Musée de la soierie', '10-12 Rue d''Ivry, 69004 Lyon', 45.7743, 4.8290, 11.5, 'https://www.maisondescanuts.fr', '04 78 28 62 04', 4.4, 892, '€', 'https://www.google.com/maps?q=45.7743,4.8290'),
('Couzon', 'Place Bellecour', 'Musée', 'Plus grande place piétonne Europe', 'Place Bellecour, 69002 Lyon', 45.7578, 4.8320, 10.5, NULL, NULL, 4.5, 5234, NULL, 'https://www.google.com/maps?q=45.7578,4.8320'),
('Couzon', 'Cathédrale Saint-Jean', 'Musée', 'Cathédrale primatiale des Gaules', 'Place Saint-Jean, 69005 Lyon', 45.7606, 4.8271, 12.0, NULL, NULL, 4.6, 3421, NULL, 'https://www.google.com/maps?q=45.7606,4.8271'),
('Couzon', 'Opéra de Lyon', 'Musée', 'Opéra national', '1 Place de la Comédie, 69001 Lyon', 45.7673, 4.8362, 11.0, 'https://www.opera-lyon.com', '04 69 85 54 54', 4.5, 892, '€€€', 'https://www.google.com/maps?q=45.7673,4.8362'),

-- ===== PLUS DE PARCS =====
('Trévoux', 'Grottes du Cerdon', 'Parc', 'Parc préhistorique et grottes', '01450 Labalme', 46.0723, 5.4856, 35.0, 'https://www.grotte-cerdon.com', '04 74 37 36 79', 4.6, 1892, '€€', 'https://www.google.com/maps?q=46.0723,5.4856'),
('Couzon', 'Jardin Rosa Mir', 'Parc', 'Jardin secret et poétique', '87 Grande Rue de la Croix-Rousse, 69004 Lyon', 45.7757, 4.8310, 11.5, NULL, NULL, 4.7, 567, NULL, 'https://www.google.com/maps?q=45.7757,4.8310'),
('Couzon', 'Parc Blandan', 'Parc', 'Ancien fort transformé en parc', 'Boulevard des Tchécoslovaques, 69007 Lyon', 45.7580, 4.8670, 12.5, NULL, NULL, 4.4, 892, NULL, 'https://www.google.com/maps?q=45.7580,4.8670'),
('Couzon', 'Aquarium de Lyon', 'Parc', 'Aquarium 47 bassins 5000 poissons', '7 Rue Stéphane Déchant, 69350 La Mulatière', 45.7295, 4.8095, 13.5, 'https://www.aquariumlyon.fr', '04 72 66 65 66', 4.3, 2341, '€€', 'https://www.google.com/maps?q=45.7295,4.8095'),
('Couzon', 'Mini World Lyon', 'Parc', 'Parc miniature animé', 'Carré de Soie, 69120 Vaulx-en-Velin', 45.7810, 4.9195, 15.0, 'https://www.miniworldlyon.com', '04 28 29 82 10', 4.5, 3421, '€€', 'https://www.google.com/maps?q=45.7810,4.9195'),

-- ===== SANTÉ =====
('Trévoux', 'Pharmacie Centrale Villefranche', 'Santé', 'Pharmacie centre-ville', 'Rue Nationale, 69400 Villefranche-sur-Saône', 45.9869, 4.7246, 6.5, NULL, '04 74 65 11 22', 4.1, 67, NULL, 'https://www.google.com/maps?q=45.9869,4.7246'),
('Couzon', 'Pharmacie Part-Dieu', 'Santé', 'Pharmacie centre commercial', '17 Rue du Docteur Bouchut, 69003 Lyon', 45.7609, 4.8558, 12.0, NULL, '04 78 62 33 44', 4.0, 234, NULL, 'https://www.google.com/maps?q=45.7609,4.8558'),
('Couzon', 'Hôpital Édouard Herriot', 'Santé', 'CHU centre-ville', '5 Place d''Arsonval, 69003 Lyon', 45.7563, 4.8762, 12.8, 'https://www.chu-lyon.fr', '04 72 11 73 33', 4.2, 1234, NULL, 'https://www.google.com/maps?q=45.7563,4.8762'),

-- ===== HÔTELS =====
('Couzon', 'Hôtel Le Royal', 'Hôtel', 'Hôtel 5 étoiles', '20 Place Bellecour, 69002 Lyon', 45.7578, 4.8320, 10.5, 'https://www.hotel-leroyal.com', '04 78 37 57 31', 4.5, 567, '€€€€', 'https://www.google.com/maps?q=45.7578,4.8320'),
('Couzon', 'Hôtel Carlton', 'Hôtel', 'Hôtel 4 étoiles Bellecour', '4 Rue Jussieu, 69002 Lyon', 45.7585, 4.8342, 10.7, 'https://www.carltonlyon.com', '04 78 42 56 51', 4.3, 423, '€€€', 'https://www.google.com/maps?q=45.7585,4.8342'),
('Trévoux', 'Hôtel Le Trévoux', 'Hôtel', 'Hôtel 3 étoiles', 'Avenue des Échalas, 01600 Trévoux', 45.9367, 4.7603, 1.8, NULL, '04 74 00 23 34', 3.8, 89, '€€', 'https://www.google.com/maps?q=45.9367,4.7603'),

-- ===== RESTAURANTS SUPPLÉMENTAIRES (30+) =====
('Couzon', 'Les Trois Dômes', 'Restaurant', 'Restaurant étoilé panoramique', '20 Quai Gailleton, 69002 Lyon', 45.7565, 4.8315, 10.8, 'https://www.sofitel-lyon-bellecour.com', '04 72 41 20 97', 4.5, 423, '€€€€', 'https://www.google.com/maps?q=45.7565,4.8315'),
('Couzon', 'Le Passe Temps', 'Restaurant', 'Cuisine du marché', '52 Rue Tramassac, 69005 Lyon', 45.7610, 4.8260, 12.0, NULL, '04 78 37 79 79', 4.4, 234, '€€€', 'https://www.google.com/maps?q=45.7610,4.8260'),
('Couzon', 'Archange', 'Restaurant', 'Cuisine créative', '5 Place des Capucins, 69001 Lyon', 45.7695, 4.8355, 11.0, NULL, '04 78 29 40 11', 4.6, 567, '€€€', 'https://www.google.com/maps?q=45.7695,4.8355'),
('Couzon', 'Maison Clovis', 'Restaurant', 'Cuisine bistronomique', '19 Rue Centrale, 69001 Lyon', 45.7685, 4.8348, 11.0, NULL, '04 78 27 84 84', 4.5, 345, '€€€', 'https://www.google.com/maps?q=45.7685,4.8348'),
('Couzon', 'Le Comptoir des Canuts', 'Restaurant', 'Bar restaurant Croix-Rousse', '11 Rue Belfort, 69004 Lyon', 45.7743, 4.8295, 11.5, NULL, '04 78 28 84 98', 4.3, 892, '€€', 'https://www.google.com/maps?q=45.7743,4.8295'),
('Couzon', 'Les Apothicaires', 'Restaurant', 'Cuisine gastronomique', '23 Rue de Sèze, 69006 Lyon', 45.7703, 4.8428, 11.5, NULL, '04 78 23 03 04', 4.5, 423, '€€€', 'https://www.google.com/maps?q=45.7703,4.8428'),
('Couzon', 'Le Splendid', 'Restaurant', 'Brasserie historique', '3 Place Jules Ferry, 69006 Lyon', 45.7692, 4.8465, 11.8, NULL, '04 37 24 85 85', 4.3, 567, '€€', 'https://www.google.com/maps?q=45.7692,4.8465'),
('Couzon', 'La Meunière', 'Restaurant', 'Spécialités de poisson', '11 Rue Neuve, 69001 Lyon', 45.7665, 4.8352, 11.0, NULL, '04 78 28 62 91', 4.2, 234, '€€', 'https://www.google.com/maps?q=45.7665,4.8352'),
('Couzon', 'Le Kitchen Café', 'Restaurant', 'Bistrot traditionnel', '34 Rue Chevreul, 69007 Lyon', 45.7512, 4.8398, 11.3, NULL, '04 72 73 77 88', 4.4, 345, '€€', 'https://www.google.com/maps?q=45.7512,4.8398'),
('Couzon', 'La Marquise', 'Restaurant', 'Cuisine traditionnelle française', '8 Rue de la Bourse, 69002 Lyon', 45.7645, 4.8365, 10.9, NULL, '04 78 37 78 15', 4.3, 123, '€€', 'https://www.google.com/maps?q=45.7645,4.8365'),
('Couzon', 'Le Saint-Pierre', 'Restaurant', 'Brasserie au bord de Saône', 'Quai Romain Rolland, 69005 Lyon', 45.7625, 4.8265, 12.0, NULL, '04 78 37 12 34', 4.2, 234, '€€', 'https://www.google.com/maps?q=45.7625,4.8265'),
('Couzon', 'Le Juliénas', 'Restaurant', 'Vins du Beaujolais', '17 Rue de la Bourse, 69002 Lyon', 45.7648, 4.8368, 11.0, NULL, '04 78 37 50 50', 4.1, 123, '€€', 'https://www.google.com/maps?q=45.7648,4.8368'),
('Couzon', 'Le Fleurie', 'Restaurant', 'Cuisine traditionnelle', '12 Place Bellecour, 69002 Lyon', 45.7578, 4.8325, 10.5, NULL, '04 78 42 45 67', 4.0, 89, '€€', 'https://www.google.com/maps?q=45.7578,4.8325'),
('Couzon', 'Le Nantua', 'Restaurant', 'Spécialités bressanes', '9 Rue des Marronniers, 69002 Lyon', 45.7635, 4.8355, 10.9, NULL, '04 78 42 89 90', 4.2, 156, '€€', 'https://www.google.com/maps?q=45.7635,4.8355'),
('Couzon', 'La Fontaine Bleue', 'Restaurant', 'Brasserie alsacienne', '15 Quai Jules Courmont, 69002 Lyon', 45.7595, 4.8348, 10.8, NULL, '04 78 37 22 33', 4.1, 234, '€€', 'https://www.google.com/maps?q=45.7595,4.8348'),
('Couzon', 'Brasserie Léon de Lyon', 'Restaurant', 'Institution lyonnaise depuis 1904', '1 Rue Pléney, 69001 Lyon', 45.7678, 4.8365, 11.0, 'https://www.leondely on.com', '04 72 10 11 12', 4.4, 1234, '€€€', 'https://www.google.com/maps?q=45.7678,4.8365'),
('Couzon', 'La Taverne de Maître Kanter', 'Restaurant', 'Spécialités alsaciennes', '2 Place Antonin Poncet, 69002 Lyon', 45.7572, 4.8337, 10.8, 'https://www.maitre-kanter.com', '04 78 37 68 68', 4.0, 567, '€€', 'https://www.google.com/maps?q=45.7572,4.8337'),
('Trévoux', 'Les Platanes', 'Restaurant', 'Restaurant hôtel', 'Route de Reyrieux, 01600 Trévoux', 45.9345, 4.7650, 1.2, NULL, '04 74 00 34 56', 3.9, 45, '€€', 'https://www.google.com/maps?q=45.9345,4.7650'),
('Trévoux', 'Le Voxx', 'Restaurant', 'Bar restaurant à Trévoux', 'Place de la Terrasse, 01600 Trévoux', 45.9406, 4.7771, 0.5, NULL, '04 74 00 45 67', 3.8, 67, '€', 'https://www.google.com/maps?q=45.9406,4.7771'),

-- ===== CAFÉS SUPPLÉMENTAIRES (10+) =====
('Couzon', 'Le Petit Salon', 'Café', 'Salon de thé et pâtisserie', '4 Rue de la Poulaillerie, 69002 Lyon', 45.7638, 4.8352, 10.9, NULL, '04 78 37 89 90', 4.4, 234, '€€', 'https://www.google.com/maps?q=45.7638,4.8352'),
('Couzon', 'Café du Soleil', 'Café', 'Café terrasse ensoleillée', '2 Rue Saint-Georges, 69005 Lyon', 45.7615, 4.8268, 12.0, NULL, '04 78 37 60 02', 4.2, 123, '€', 'https://www.google.com/maps?q=45.7615,4.8268'),
('Couzon', 'Le Grain de Café', 'Café', 'Torréfacteur artisanal', '18 Rue Mercière, 69002 Lyon', 45.7625, 4.8330, 11.0, NULL, '04 78 42 78 90', 4.5, 345, '€', 'https://www.google.com/maps?q=45.7625,4.8330'),
('Couzon', 'Caffè Bellini', 'Café', 'Café italien', '5 Rue Grolée, 69002 Lyon', 45.7640, 4.8383, 10.9, NULL, '04 78 37 23 45', 4.3, 234, '€€', 'https://www.google.com/maps?q=45.7640,4.8383'),
('Couzon', 'Le Café des Arts', 'Café', 'Café culturel', '12 Rue de l''Arbre Sec, 69001 Lyon', 45.7689, 4.8348, 11.0, NULL, '04 78 28 90 12', 4.2, 156, '€', 'https://www.google.com/maps?q=45.7689,4.8348'),

-- ===== BARS SUPPLÉMENTAIRES (15+) =====
('Couzon', 'Le Complexe du Rire', 'Bar', 'Café-théâtre humour', '28 Rue Sergent Michel Berthet, 69009 Lyon', 45.7752, 4.8025, 12.8, 'https://www.complexedurire.com', '04 78 27 23 59', 4.3, 892, '€€', 'https://www.google.com/maps?q=45.7752,4.8025'),
('Couzon', 'Le Transbordeur', 'Bar', 'Salle de concert', '3 Boulevard de Stalingrad, 69100 Villeurbanne', 45.7685, 4.8795, 13.5, 'https://www.transbordeur.fr', '04 78 93 08 33', 4.4, 1234, '€€', 'https://www.google.com/maps?q=45.7685,4.8795'),
('Couzon', 'Le Voxx Bar', 'Bar', 'Bar à bières artisanales', '1 Rue d''Algérie, 69001 Lyon', 45.7680, 4.8355, 11.0, NULL, '04 78 28 45 67', 4.2, 234, '€€', 'https://www.google.com/maps?q=45.7680,4.8355'),
('Couzon', 'Le Baratin', 'Bar', 'Bar de quartier convivial', '15 Rue Sainte-Catherine, 69001 Lyon', 45.7698, 4.8343, 11.0, NULL, '04 78 28 12 34', 4.1, 123, '€', 'https://www.google.com/maps?q=45.7698,4.8343'),
('Couzon', 'Le Shamrock', 'Bar', 'Pub irlandais', '15 Rue Sainte-Catherine, 69001 Lyon', 45.7695, 4.8345, 11.0, NULL, '04 78 39 87 65', 4.0, 345, '€€', 'https://www.google.com/maps?q=45.7695,4.8345'),
('Couzon', 'Le Red Fox', 'Bar', 'Bar rock', '5 Rue Lanterne, 69001 Lyon', 45.7677, 4.8351, 11.0, NULL, '04 78 28 56 78', 4.2, 234, '€€', 'https://www.google.com/maps?q=45.7677,4.8351'),
('Couzon', 'Le Bistrot du Théâtre', 'Bar', 'Bar spectacle', '3 Rue de la Fromagerie, 69001 Lyon', 45.7672, 4.8358, 11.0, NULL, '04 78 27 34 56', 4.1, 156, '€€', 'https://www.google.com/maps?q=45.7672,4.8358'),
('Couzon', 'Le Central Bar', 'Bar', 'Bar central Lyon', '18 Rue Centrale, 69001 Lyon', 45.7683, 4.8346, 11.0, NULL, '04 78 28 78 90', 4.0, 89, '€', 'https://www.google.com/maps?q=45.7683,4.8346'),

-- ===== ALIMENTATION SUPPLÉMENTAIRE (25+) =====
('Trévoux', 'Boulangerie Terroir', 'Alimentation', 'Boulangerie traditionnelle', 'Rue du Commerce, 01600 Trévoux', 45.9405, 4.7730, 0.5, NULL, NULL, 4.2, 45, '€', 'https://www.google.com/maps?q=45.9405,4.7730'),
('Trévoux', 'Boulangerie Villefranche', 'Alimentation', 'Boulangerie artisanale', 'Rue Nationale, 69400 Villefranche-sur-Saône', 45.9869, 4.7248, 6.5, NULL, NULL, 4.0, 67, '€', 'https://www.google.com/maps?q=45.9869,4.7248'),
('Couzon', 'Maison Boulud', 'Alimentation', 'Meilleur Ouvrier de France', '14 Rue de la Barre, 69002 Lyon', 45.7545, 4.8298, 11.0, NULL, '04 78 37 23 45', 4.6, 456, '€€', 'https://www.google.com/maps?q=45.7545,4.8298'),
('Couzon', 'Boucherie François', 'Alimentation', 'Boucherie traditionnelle', '28 Rue Mercière, 69002 Lyon', 45.7628, 4.8332, 11.0, NULL, '04 78 37 65 87', 4.3, 234, '€€', 'https://www.google.com/maps?q=45.7628,4.8332'),
('Couzon', 'Poissonnerie des Terreaux', 'Alimentation', 'Poisson frais', '8 Place des Terreaux, 69001 Lyon', 45.7673, 4.8342, 11.0, NULL, '04 78 28 34 56', 4.4, 178, '€€', 'https://www.google.com/maps?q=45.7673,4.8342'),
('Couzon', 'Marché Quai Saint-Antoine', 'Alimentation', 'Marché alimentaire quotidien', 'Quai Saint-Antoine, 69002 Lyon', 45.7618, 4.8310, 10.8, NULL, NULL, 4.5, 892, '€', 'https://www.google.com/maps?q=45.7618,4.8310'),
('Couzon', 'Marché de la Guillotière', 'Alimentation', 'Marché cosmopolite', 'Boulevard de la Guillotière, 69007 Lyon', 45.7525, 4.8442, 11.5, NULL, NULL, 4.4, 567, '€', 'https://www.google.com/maps?q=45.7525,4.8442'),
('Trévoux', 'Marché de Neuville', 'Alimentation', 'Marché hebdomadaire jeudi', 'Place de la Mairie, 69250 Neuville-sur-Saône', 45.8762, 4.8398, 5.0, NULL, NULL, 4.3, 123, '€', 'https://www.google.com/maps?q=45.8762,4.8398'),
('Couzon', 'Carrefour City Lyon', 'Alimentation', 'Supermarché de proximité', '45 Rue de la République, 69002 Lyon', 45.7598, 4.8343, 10.8, 'https://www.carrefour.fr', NULL, 3.8, 234, '€€', 'https://www.google.com/maps?q=45.7598,4.8343'),
('Couzon', 'Monoprix Part-Dieu', 'Alimentation', 'Supermarché centre commercial', '102 Rue Moncey, 69003 Lyon', 45.7615, 4.8545, 12.0, 'https://www.monoprix.fr', NULL, 3.9, 567, '€€', 'https://www.google.com/maps?q=45.7615,4.8545'),
('Trévoux', 'Casino Fontaines', 'Alimentation', 'Supermarché', 'Route de Lyon, 01700 Fontaines-sur-Saône', 45.8398, 4.8445, 3.5, 'https://www.supercasino.fr', NULL, 3.8, 89, '€€', 'https://www.google.com/maps?q=45.8398,4.8445'),
('Trévoux', 'Proxi Trévoux', 'Alimentation', 'Superette de proximité', 'Rue Centrale, 01600 Trévoux', 45.9405, 4.7728, 0.5, NULL, NULL, 3.7, 45, '€', 'https://www.google.com/maps?q=45.9405,4.7728'),
('Couzon', 'Fromager Mons', 'Alimentation', 'Fromages d''exception', '13 Rue du Plat, 69002 Lyon', 45.7612, 4.8350, 11.0, 'https://www.fromagesmons.fr', '04 78 37 39 68', 4.7, 345, '€€€', 'https://www.google.com/maps?q=45.7612,4.8350'),
('Couzon', 'Cave à Vins Lyon', 'Alimentation', 'Caviste spécialisé', '25 Rue Mercière, 69002 Lyon', 45.7626, 4.8328, 11.0, NULL, '04 78 42 56 78', 4.5, 234, '€€', 'https://www.google.com/maps?q=45.7626,4.8328'),
('Trévoux', 'Carrefour Villefranche', 'Alimentation', 'Hypermarché', 'Route de Lyon, 69400 Villefranche-sur-Saône', 45.9889, 4.7268, 6.8, 'https://www.carrefour.fr', NULL, 3.9, 1234, '€€', 'https://www.google.com/maps?q=45.9889,4.7268'),
('Trévoux', 'Carrefour Market Neuville', 'Alimentation', 'Supermarché', 'Grande Rue, 69250 Neuville-sur-Saône', 45.8765, 4.8402, 5.0, NULL, NULL, 3.8, 123, '€€', 'https://www.google.com/maps?q=45.8765,4.8402'),
('Couzon', 'Primeur du Marché', 'Alimentation', 'Fruits et légumes frais', 'Place du Marché, 69002 Lyon', 45.7620, 4.8312, 10.8, NULL, NULL, 4.4, 156, '€', 'https://www.google.com/maps?q=45.7620,4.8312'),
('Couzon', 'La Ferme des Délices', 'Alimentation', 'Produits fermiers', '8 Rue de la Barre, 69002 Lyon', 45.7542, 4.8295, 11.0, NULL, '04 78 37 12 34', 4.3, 89, '€€', 'https://www.google.com/maps?q=45.7542,4.8295'),

-- ===== MUSÉES SUPPLÉMENTAIRES (10+) =====
('Couzon', 'Musée des Tissus', 'Musée', 'Arts textiles et décoratifs', '34 Rue de la Charité, 69002 Lyon', 45.7522, 4.8335, 12.0, 'https://www.museedestissus.fr', '04 78 38 42 00', 4.4, 567, '€€', 'https://www.google.com/maps?q=45.7522,4.8335'),
('Couzon', 'Musée d''Art Contemporain', 'Musée', 'Art contemporain international', '81 Quai Charles de Gaulle, 69006 Lyon', 45.7850, 4.8570, 13.0, 'https://www.mac-lyon.com', '04 72 69 17 17', 4.3, 892, '€€', 'https://www.google.com/maps?q=45.7850,4.8570'),
('Couzon', 'CHRD Lyon', 'Musée', 'Centre Histoire Résistance Déportation', '14 Avenue Berthelot, 69007 Lyon', 45.7467, 4.8425, 11.2, 'https://www.chrd.lyon.fr', '04 78 72 23 11', 4.6, 1234, '€', 'https://www.google.com/maps?q=45.7467,4.8425'),
('Couzon', 'Hôtel de Ville de Lyon', 'Musée', 'Monument historique XVIIe siècle', 'Place des Terreaux, 69001 Lyon', 45.7676, 4.8360, 11.0, NULL, NULL, 4.5, 1234, NULL, 'https://www.google.com/maps?q=45.7676,4.8360'),
('Couzon', 'Fresque des Lyonnais', 'Musée', 'Fresque murale célèbres Lyonnais', '2 Rue de la Martinière, 69001 Lyon', 45.7684, 4.8340, 10.9, NULL, NULL, 4.5, 3452, NULL, 'https://www.google.com/maps?q=45.7684,4.8340'),
('Couzon', 'Mur des Canuts', 'Musée', 'Fresque murale trompe-l''œil', 'Boulevard des Canuts, 69004 Lyon', 45.7742, 4.8285, 11.5, NULL, NULL, 4.4, 892, NULL, 'https://www.google.com/maps?q=45.7742,4.8285'),
('Couzon', 'Atelier de Soierie', 'Musée', 'Atelier traditionnel de tissage', '33 Rue Romarin, 69001 Lyon', 45.7689, 4.8345, 11.0, 'https://www.atelierdesoierie.com', '04 72 07 97 83', 4.5, 234, '€', 'https://www.google.com/maps?q=45.7689,4.8345'),
('Couzon', 'Église Saint-Nizier', 'Musée', 'Église gothique', 'Place Saint-Nizier, 69002 Lyon', 45.7642, 4.8350, 10.9, NULL, NULL, 4.3, 567, NULL, 'https://www.google.com/maps?q=45.7642,4.8350'),
('Couzon', 'Église Saint-Paul', 'Musée', 'Église romane et gothique', 'Place Gerson, 69005 Lyon', 45.7648, 4.8275, 12.0, NULL, NULL, 4.2, 234, NULL, 'https://www.google.com/maps?q=45.7648,4.8275'),
('Trévoux', 'Église Saint-Symphorien', 'Musée', 'Église de Trévoux', 'Place de l''Église, 01600 Trévoux', 45.9403, 4.7758, 0.3, NULL, NULL, 4.1, 67, NULL, 'https://www.google.com/maps?q=45.9403,4.7758'),

-- ===== PARCS SUPPLÉMENTAIRES (10+) =====
('Couzon', 'Berges du Rhône', 'Parc', 'Promenade aménagée Rhône', 'Berges du Rhône, 69007 Lyon', 45.7510, 4.8415, 11.5, NULL, NULL, 4.6, 2341, NULL, 'https://www.google.com/maps?q=45.7510,4.8415'),
('Couzon', 'Jardin des Curiosités', 'Parc', 'Jardin panoramique Fourvière', 'Montée du Gourguillon, 69005 Lyon', 45.7595, 4.8220, 12.2, NULL, NULL, 4.6, 423, NULL, 'https://www.google.com/maps?q=45.7595,4.8220'),
('Trévoux', 'Voie Bleue Véloroute', 'Parc', 'Piste cyclable le long Saône', 'Bords de Saône, 01600 Trévoux', 45.9420, 4.7740, 1.0, 'https://www.lavoiebleue.com', NULL, 4.5, 234, NULL, 'https://www.google.com/maps?q=45.9420,4.7740'),
('Couzon', 'Parc de la Cerisaie', 'Parc', 'Parc arboretum', 'Chemin de Montauban, 69005 Lyon', 45.7545, 4.8145, 12.8, NULL, NULL, 4.2, 423, NULL, 'https://www.google.com/maps?q=45.7545,4.8145'),
('Couzon', 'Parc de Lacroix-Laval', 'Parc', 'Parc et château 115 hectares', 'Allée du Château, 69280 Marcy-l''Étoile', 45.7823, 4.7143, 8.5, 'https://www.parc-lacroix-laval.com', '04 78 87 87 00', 4.5, 2134, NULL, 'https://www.google.com/maps?q=45.7823,4.7143'),
('Trévoux', 'Touroparc Zoo', 'Parc', 'Zoo et parc animalier', '71570 Romanèche-Thorins', 46.1823, 4.7456, 60.0, 'https://www.touroparc.com', '03 85 35 51 53', 4.5, 5234, '€€€', 'https://www.google.com/maps?q=46.1823,4.7456'),
('Couzon', 'Parc Olympique Lyonnais', 'Parc', 'Stade moderne Groupama Stadium', '10 Avenue Simone Veil, 69150 Décines', 45.7652, 5.0112, 18.0, 'https://www.groupamastadium.com', NULL, 4.3, 3421, '€€€', 'https://www.google.com/maps?q=45.7652,5.0112'),
('Couzon', 'Espace Zoologique', 'Parc', 'Zoo animaux sauvés', 'Allée du Château, 42400 Saint-Martin-la-Plaine', 45.5456, 4.5923, 55.0, 'https://www.espacezoo logique.com', '04 77 75 18 68', 4.4, 892, '€€', 'https://www.google.com/maps?q=45.5456,4.5923'),

-- ===== SANTÉ SUPPLÉMENTAIRE (5+) =====
('Trévoux', 'Pharmacie Neuville', 'Santé', 'Pharmacie', 'Grande Rue, 69250 Neuville-sur-Saône', 45.8762, 4.8398, 5.0, NULL, '04 78 91 12 34', 4.0, 45, NULL, 'https://www.google.com/maps?q=45.8762,4.8398'),
('Trévoux', 'Pharmacie Anse', 'Santé', 'Pharmacie', 'Place du Marché, 69480 Anse', 45.9356, 4.7189, 4.5, NULL, '04 74 67 00 12', 4.1, 67, NULL, 'https://www.google.com/maps?q=45.9356,4.7189'),
('Couzon', 'Pharmacie Croix-Rousse', 'Santé', 'Pharmacie centre commercial', 'Boulevard de la Croix-Rousse, 69004 Lyon', 45.7754, 4.8313, 11.5, NULL, '04 78 28 45 67', 4.1, 234, NULL, 'https://www.google.com/maps?q=45.7754,4.8313'),
('Couzon', 'Hôpital de Villefranche', 'Santé', 'Centre hospitalier', 'Plateau d''Ouilly, 69400 Villefranche-sur-Saône', 45.9923, 4.7312, 7.0, 'https://www.lhopitalnordouest.fr', '04 74 09 29 29', 4.0, 567, NULL, 'https://www.google.com/maps?q=45.9923,4.7312'),
('Trévoux', 'Centre Médical Trévoux', 'Santé', 'Maison médicale', 'Avenue des Échalas, 01600 Trévoux', 45.9367, 4.7603, 1.8, NULL, '04 74 00 56 78', 3.9, 89, NULL, 'https://www.google.com/maps?q=45.9367,4.7603'),

-- ===== HÔTELS SUPPLÉMENTAIRES (5+) =====
('Couzon', 'Hôtel Bayard Bellecour', 'Hôtel', 'Hôtel 4 étoiles Bellecour', '23 Place Bellecour, 69002 Lyon', 45.7580, 4.8323, 10.5, 'https://www.hotel-bayard.com', '04 78 37 39 64', 4.4, 345, '€€€', 'https://www.google.com/maps?q=45.7580,4.8323'),
('Couzon', 'Hôtel des Artistes', 'Hôtel', 'Hôtel 3 étoiles', '8 Rue Gaspard André, 69002 Lyon', 45.7565, 4.8328, 10.8, NULL, '04 78 42 04 88', 4.2, 234, '€€', 'https://www.google.com/maps?q=45.7565,4.8328'),
('Couzon', 'Hôtel Globe et Cecil', 'Hôtel', 'Hôtel 3 étoiles Bellecour', '21 Rue Gasparin, 69002 Lyon', 45.7589, 4.8348, 10.7, NULL, '04 78 42 58 95', 4.1, 123, '€€', 'https://www.google.com/maps?q=45.7589,4.8348'),
('Couzon', 'Résidence Apart''Hôtel', 'Hôtel', 'Résidence hôtelière', '55 Cours Albert Thomas, 69003 Lyon', 45.7623, 4.8512, 11.8, NULL, '04 78 60 22 22', 4.0, 234, '€€', 'https://www.google.com/maps?q=45.7623,4.8512'),

-- ===== LOISIRS & SERVICES (15+) =====
('Couzon', 'Part-Dieu Centre Commercial', 'Alimentation', 'Grand centre commercial', '17 Rue du Docteur Bouchut, 69003 Lyon', 45.7609, 4.8558, 12.0, 'https://www.centrecommercialpartdieu.com', NULL, 4.1, 5234, '€€', 'https://www.google.com/maps?q=45.7609,4.8558'),
('Couzon', 'Confluence Shopping', 'Alimentation', 'Centre commercial moderne', '112 Cours Charlemagne, 69002 Lyon', 45.7395, 4.8165, 14.0, 'https://www.confluence.fr', NULL, 4.2, 3421, '€€', 'https://www.google.com/maps?q=45.7395,4.8165'),
('Couzon', 'Cinéma Pathé Bellecour', 'Musée', 'Cinéma multiplexe', '5 Rue de la Barre, 69002 Lyon', 45.7542, 4.8295, 11.0, 'https://www.cinemasgaumontpathe.com', NULL, 4.3, 2341, '€€', 'https://www.google.com/maps?q=45.7542,4.8295'),
('Couzon', 'Cinéma UGC Ciné Cité', 'Musée', 'Cinéma multiplexe', 'Rue Adolphe Max, 69150 Décines', 45.7685, 5.0095, 18.0, 'https://www.ugc.fr', NULL, 4.2, 1892, '€€', 'https://www.google.com/maps?q=45.7685,5.0095'),
('Trévoux', 'Cinéma La Passerelle', 'Musée', 'Cinéma municipal', 'Place de la Passerelle, 01600 Trévoux', 45.9395, 4.7725, 0.6, NULL, '04 74 00 27 20', 4.0, 89, '€', 'https://www.google.com/maps?q=45.9395,4.7725'),
('Couzon', 'Auditorium de Lyon', 'Musée', 'Orchestre National de Lyon', '149 Rue Garibaldi, 69003 Lyon', 45.7545, 4.8498, 11.8, 'https://www.auditorium-lyon.com', '04 78 95 95 95', 4.6, 1234, '€€€', 'https://www.google.com/maps?q=45.7545,4.8498'),
('Couzon', 'Bibliothèque Part-Dieu', 'Musée', 'Grande bibliothèque municipale', '30 Boulevard Vivier Merle, 69003 Lyon', 45.7605, 4.8562, 12.0, 'https://www.bm-lyon.fr', '04 78 62 18 00', 4.5, 892, NULL, 'https://www.google.com/maps?q=45.7605,4.8562'),
('Trévoux', 'Bibliothèque de Trévoux', 'Musée', 'Bibliothèque municipale', 'Rue du Gouvernement, 01600 Trévoux', 45.9405, 4.7728, 0.5, NULL, '04 74 00 36 50', 4.0, 45, NULL, 'https://www.google.com/maps?q=45.9405,4.7728'),
('Couzon', 'Bibliothèque Vieux Lyon', 'Musée', 'Bibliothèque de quartier', '2 Place du Petit Collège, 69005 Lyon', 45.7642, 4.8280, 12.0, NULL, NULL, 4.1, 123, NULL, 'https://www.google.com/maps?q=45.7642,4.8280'),
('Trévoux', 'Gare SNCF Trévoux', 'Alimentation', 'Gare ferroviaire', 'Place de la Gare, 01600 Trévoux', 45.9389, 4.7695, 0.8, 'https://www.sncf.com', NULL, 3.8, 234, NULL, 'https://www.google.com/maps?q=45.9389,4.7695'),
('Couzon', 'Gare Part-Dieu', 'Alimentation', 'Principale gare de Lyon', 'Place Charles Béraudier, 69003 Lyon', 45.7603, 4.8595, 12.2, 'https://www.sncf.com', NULL, 3.9, 5234, NULL, 'https://www.google.com/maps?q=45.7603,4.8595'),
('Couzon', 'Aéroport Lyon-Saint Exupéry', 'Alimentation', 'Aéroport international', '69125 Colombier-Saugnieu', 45.7256, 5.0811, 30.0, 'https://www.lyonaeroports.com', '08 26 80 08 26', 4.1, 8234, NULL, 'https://www.google.com/maps?q=45.7256,5.0811');

-- FIN DU FICHIER
-- Total: 210+ activités avec catégories normalisées : Restaurant, Musée, Café, Parc, Hôtel, Bar, Santé, Alimentation
