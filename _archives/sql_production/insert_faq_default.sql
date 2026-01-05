-- ================================================================
-- INSERT FAQ PAR DÉFAUT - QUESTIONS FRÉQUENTES
-- ================================================================

-- Supprimer les anciennes FAQs si elles existent
TRUNCATE TABLE faq;

-- ============= ARRIVÉE =============
INSERT INTO faq (categorie, gite, question, reponse, visible, ordre) VALUES
('arrivee', 'tous', 'À quelle heure puis-je arriver ?', 
'L''heure d''arrivée standard est à partir de 17h00. Toutefois, si aucun ménage n''est prévu l''après-midi de votre arrivée, vous pouvez arriver dès 13h00. Vous recevrez une confirmation de l''horaire exact dans votre fiche client personnalisée.', 
true, 1),

('arrivee', 'tous', 'Puis-je arriver plus tôt ?', 
'Oui, vous pouvez faire une demande d''arrivée anticipée directement depuis votre fiche client. Les demandes avant 13h nécessitent une validation de notre part. Les arrivées entre 13h et 17h sont généralement possibles selon le planning de ménage.', 
true, 2),

('arrivee', 'tous', 'Comment récupérer les clés ?', 
'Les clés sont disponibles dans un boîtier sécurisé à l''entrée. Vous recevrez le code d''accès dans votre fiche client ainsi que des instructions détaillées pour accéder au logement.', 
true, 3),

('arrivee', 'tous', 'Y a-t-il un parking ?', 
'Oui, un parking gratuit est disponible sur place. Les détails et l''emplacement exact sont indiqués dans votre fiche client.', 
true, 4),

-- ============= DÉPART =============
('depart', 'tous', 'À quelle heure dois-je partir ?', 
'L''heure de départ standard est 10h00. Cependant, si aucun ménage n''est prévu l''après-midi de votre départ, vous pouvez rester jusqu''à 12h00 (semaine) ou 17h00 (dimanche). Consultez votre fiche client pour connaître l''horaire exact de votre séjour.', 
true, 1),

('depart', 'tous', 'Puis-je partir plus tard ?', 
'Vous pouvez faire une demande de départ tardif via votre fiche client. Les demandes sont généralement acceptées si aucun ménage n''est prévu l''après-midi de votre départ.', 
true, 2),

('depart', 'tous', 'Que dois-je faire avant de partir ?', 
'Une checklist de départ est disponible dans votre fiche client. En résumé : sortir les poubelles, vider le frigo, éteindre les appareils, fermer les fenêtres, et remettre les clés dans le boîtier.', 
true, 3),

('depart', 'tous', 'Dois-je faire le ménage ?', 
'Non, le ménage est inclus dans votre séjour. Nous vous demandons simplement de laisser le logement dans un état correct : vaisselle faite, poubelles sorties, et sans dégâts.', 
true, 4),

-- ============= ÉQUIPEMENTS =============
('equipements', 'tous', 'Le WiFi est-il inclus ?', 
'Oui, le WiFi haut débit est inclus et gratuit. Les identifiants et un QR code de connexion sont disponibles dans votre fiche client.', 
true, 1),

('equipements', 'tous', 'Y a-t-il une cuisine équipée ?', 
'Oui, la cuisine est entièrement équipée avec four, plaques de cuisson, réfrigérateur, lave-vaisselle, micro-ondes, cafetière, bouilloire, et tous les ustensiles nécessaires.', 
true, 2),

('equipements', 'tous', 'Le linge de lit et les serviettes sont-ils fournis ?', 
'Oui, le linge de lit est fourni et installé sur les lits. Les serviettes de toilette sont également fournies.', 
true, 3),

('equipements', 'tous', 'Y a-t-il le chauffage/climatisation ?', 
'Le chauffage est disponible selon la saison. Les informations spécifiques (type, instructions) sont détaillées dans votre fiche client, onglet "Pendant le séjour".', 
true, 4),

('equipements', 'tous', 'Puis-je utiliser la machine à laver ?', 
'Oui, un lave-linge est à votre disposition. Les instructions d''utilisation sont dans votre fiche client.', 
true, 5),

-- ============= LOCALISATION =============
('localisation', 'tous', 'Où se trouve le gîte exactement ?', 
'L''adresse complète et un lien Google Maps sont disponibles dans votre fiche client, onglet "Arrivée". Vous pouvez lancer la navigation GPS directement depuis la fiche.', 
true, 1),

('localisation', 'tous', 'Y a-t-il des commerces à proximité ?', 
'Oui, une liste des commerces de proximité (boulangerie, supermarché, restaurants, pharmacie) avec leurs distances et horaires est disponible dans votre fiche client, onglet "Pendant".', 
true, 2),

('localisation', 'tous', 'Que puis-je visiter dans les environs ?', 
'Un onglet "Activités" dans votre fiche client présente toutes les activités et sites touristiques à découvrir, avec une carte interactive et les itinéraires.', 
true, 3),

-- ============= TARIFS =============
('tarifs', 'tous', 'La caution est-elle obligatoire ?', 
'Les conditions de caution sont indiquées dans votre contrat de réservation et rappelées dans le règlement intérieur disponible sur votre fiche client.', 
true, 1),

('tarifs', 'tous', 'Le ménage est-il inclus dans le prix ?', 
'Oui, le ménage de fin de séjour est inclus dans le tarif. Vous n''avez qu''à laisser le logement dans un état normal.', 
true, 2),

('tarifs', 'tous', 'Y a-t-il des frais cachés ?', 
'Non, tous les frais sont détaillés lors de votre réservation. Le prix affiché inclut le ménage, le linge de lit, les charges (eau, électricité, WiFi).', 
true, 3),

-- ============= RÈGLEMENT =============
('reglement', 'tous', 'Puis-je fumer dans le logement ?', 
'Le règlement concernant le tabac est spécifié dans le règlement intérieur disponible sur votre fiche client. En général, la cigarette est interdite à l''intérieur.', 
true, 1),

('reglement', 'tous', 'Les animaux sont-ils acceptés ?', 
'Les conditions d''acceptation des animaux sont précisées dans le règlement intérieur sur votre fiche client. Consultez la section "Règlement" dans l''onglet "Pendant".', 
true, 2),

('reglement', 'tous', 'Combien de personnes maximum ?', 
'La capacité d''accueil maximale est indiquée dans votre contrat de réservation et dans le règlement intérieur. Le respect de cette limite est obligatoire.', 
true, 3),

('reglement', 'tous', 'Puis-je organiser une fête ?', 
'Les fêtes et événements bruyants sont généralement interdits pour préserver la tranquillité du voisinage. Consultez le règlement intérieur sur votre fiche client.', 
true, 4),

-- ============= AUTRE =============
('autre', 'tous', 'Comment contacter les propriétaires en urgence ?', 
'Les coordonnées d''urgence (téléphone, email, WhatsApp) sont disponibles dans votre fiche client, onglet "Pendant", section "Contacts d''urgence".', 
true, 1),

('autre', 'tous', 'Que faire en cas de problème dans le logement ?', 
'Vous pouvez signaler un problème directement depuis votre fiche client via le formulaire "État des lieux" (avec photos) ou le formulaire "Retours". Pour les urgences, utilisez les contacts téléphoniques.', 
true, 2),

('autre', 'tous', 'Comment faire un retour ou une suggestion ?', 
'Un formulaire "Demandes / Retours / Améliorations" est disponible dans votre fiche client, onglet "Pendant". Vous pouvez également laisser une évaluation à la fin de votre séjour.', 
true, 3),

('autre', 'tous', 'Ma fiche client est-elle accessible hors ligne ?', 
'Oui ! Votre fiche client est une PWA (Progressive Web App) installable sur votre téléphone. Vous pouvez l''ajouter à votre écran d''accueil et y accéder même sans connexion internet.', 
true, 4);

-- Afficher le nombre de FAQs insérées
SELECT COUNT(*) as "Nombre de FAQs créées" FROM faq;
