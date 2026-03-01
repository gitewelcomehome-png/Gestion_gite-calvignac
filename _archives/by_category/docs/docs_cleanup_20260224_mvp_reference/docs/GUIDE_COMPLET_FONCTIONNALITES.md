# 📘 GUIDE COMPLET DES FONCTIONNALITÉS
## LiveOwnerUnit - Plateforme de Gestion de Gîtes

**Version :** 5.0  
**Dernière mise à jour :** 05 février 2026  
**Site en production** avec clients réels

---

## 🎯 PRÉSENTATION GÉNÉRALE

**LiveOwnerUnit** est une plateforme SaaS complète de gestion de locations saisonnières (gîtes/meublés de tourisme) permettant :
- La synchronisation automatique des réservations multi-plateformes (iCal)
- La gestion fiscale LMNP/LMP avec simulations
- La création de fiches clients interactives
- Le suivi des tâches de ménage et maintenance
- L'analyse statistique complète des performances

---

## 📱 INTERFACE UTILISATEUR (INDEX.HTML)

### 🎨 SYSTÈME DE THÈMES
- **2 thèmes disponibles** : Dark / Light
- **2 styles de navigation** : Sidebar / Top bar
- **Sauvegarde automatique** des préférences
- **Chargement instantané** du thème (avant le CSS)
- **Icônes modernes** : Lucide Icons + Font Awesome

### 🔐 AUTHENTIFICATION & SÉCURITÉ
- **Connexion sécurisée** via Supabase
- **Protection XSS** avec DOMPurify
- **Validation email** obligatoire
- **Row Level Security (RLS)** sur toutes les tables
- **Rate limiting** sur les opérations sensibles
- **Masquage automatique** des erreurs extensions Chrome

---

## 🗂️ ONGLETS PRINCIPAUX

### 1️⃣ DASHBOARD (Tableau de Bord)

#### 📊 Vue d'ensemble
- **Date et semaine en cours** affichées en permanence
- **Bouton actualisation** pour rafraîchir les données
- **Tickets support en attente** avec compteur
- **Fiches clients à envoyer** avec alertes
- **Problèmes urgents** signalés
- **Demandes & retours clients** centralisés

#### ✅ Sections TODO organisées
1. **Actions Réservations**
   - Liste de tâches pour les réservations (arrivées, départs, confirmations)
   - Ajout/suppression/validation de tâches
   - Tri par gîte

2. **Travaux & Maintenance**
   - Suivi des réparations à effectuer
   - Planning des interventions
   - État d'avancement

3. **Achats & Courses**
   - Liste de courses pour les gîtes
   - Stock à renouveler
   - Produits d'accueil à racheter

4. **Ménages à valider**
   - Ménages effectués en attente de validation
   - Statut par gîte
   - Commentaires femme de ménage

#### 📅 Réservations de la semaine
- **Affichage pleine largeur** en haut du dashboard
- **Pagination automatique** (5 réservations par page)
- **Détails complets** : Nom, Gîte, Dates, Plateforme, Statut
- **Actions rapides** : Voir détails, Modifier, Générer fiche client

#### 📱 Version Mobile optimisée
- Layout adaptatif
- Modal TODO dédié
- Gestes tactiles

---

### 2️⃣ RÉSERVATIONS

#### 📆 Planning Visuel
- **Vue calendrier** avec toutes les réservations
- **Couleurs par gîte** personnalisables
- **Affichage multi-gîtes** simultané
- **Navigation par mois/semaine**
- **Actualisation manuelle** et automatique

#### 🔄 Synchronisation iCal
- **Import automatique** depuis Airbnb, Booking, Abritel, Gîtes de France
- **Détection des conflits** de dates
- **Règle de priorité** : la réservation la plus courte est conservée
- **Une seule réservation par gîte** à la fois (pas de chevauchement)
- **Historique de synchronisation**

#### ✏️ Gestion des Réservations
- **Ajout manuel** de réservations
- **Modification** en ligne
- **Suppression** avec confirmation
- **Champs** :
  - Nom du client
  - Téléphone (format validé)
  - Email
  - Gîte
  - Dates (début, fin)
  - Nombre de personnes
  - Plateforme (Airbnb, Booking, etc.)
  - Prix total
  - Commission plateforme
  - Provenance
  - Notes internes

#### 🔍 Recherche & Filtres
- Recherche par nom client
- Filtre par gîte
- Filtre par plateforme
- Filtre par période

---

### 3️⃣ STATISTIQUES

#### 📈 Indicateurs Clés
- **Chiffre d'affaires total** de l'année
- **Nombre de réservations** par plateforme :
  - Airbnb (icône maison rouge)
  - Abritel (icône maison bleue)
  - Gîtes de France (icône épi vert)
- **Comparaison avec l'année précédente**

#### 🎯 Taux d'Occupation
- **Par gîte** (calcul automatique)
- **Pourcentage** de jours occupés
- **Visualisation graphique** avec jauge colorée
- **Indication des meilleurs/pires gîtes**

#### 💰 Statistiques Avancées
- **Prix moyen par nuitée**
- **Durée moyenne de séjour**
- **Meilleur mois** (CA le plus élevé)
- **Graphiques comparatifs** mensuels
- **Export possible** des données

#### 📊 Données Historiques
- **Formulaire de saisie** pour années précédentes
- **Stockage par année** avec mois détaillés
- **Comparaison multi-années**
- **Graphiques d'évolution**
- **Import/Export** des données

#### 🔄 Filtres
- **Sélection d'année** (dropdown)
- **Vue mensuelle/annuelle**
- **Par gîte ou global**

---

### 4️⃣ DRAPS (Gestion du Linge)

#### 📦 Configuration des Besoins
- **Par gîte** : nombre de draps nécessaires par réservation
- **Types de linge** :
  - Draps 1 personne
  - Draps 2 personnes
  - Housse couette
  - Taie d'oreiller
  - Serviettes

#### 🏪 Stocks en Réserve
- **Compteurs en temps réel** par type de linge
- **Modification facile** (+/- avec boutons)
- **Sauvegarde automatique** en base
- **Alertes stock faible**

#### 📊 Analyse & Prévisions
1. **Réservations couvertes**
   - Nombre de réservations assurables avec stock actuel
   - Calcul automatique par gîte

2. **À emmener dans les gîtes**
   - Liste pour les prochaines réservations
   - Quantités exactes par type de linge

3. **Simulation des besoins futurs**
   - Sélection de date limite
   - Calcul des besoins jusqu'à cette date
   - Suggestion d'achats

---

### 5️⃣ MÉNAGE (Planning Nettoyage)

#### 🧹 Planning des Ménages
- **Vue par semaine** avec toutes les interventions
- **Code couleur** par gîte
- **Statuts** :
  - À faire
  - En cours
  - Validé (propriétaire)
  - Terminé

#### ⚙️ Règles de Ménage
- **Temps estimé par gîte**
- **Instructions spécifiques** par zone
- **Checklists détaillées** :
  - Cuisine
  - Chambres
  - Salles de bain
  - Salon
  - Extérieur
- **Produits nécessaires**

#### 👥 Interface Société de Ménage
- **Page dédiée** (`pages/femme-menage.html`)
- **Vue simplifiée** des ménages à faire
- **Validation** avec photos (optionnel)
- **Commentaires** sur l'état du gîte
- **Signalement** de problèmes

#### ✅ Page Validation Propriétaire
- **Liste des ménages terminés**
- **Photos** du ménage effectué
- **Validation** ou demande de retouches
- **Historique** des interventions

#### 🎯 Propositions en Attente
- Affichage des **demandes spéciales** du client
- **Accepter/Refuser** les propositions
- **Surcoût** éventuel à appliquer

---

### 6️⃣ FISCALITÉ (LMNP/LMP)

#### 🏛️ Statut Fiscal
- **LMNP** (Loueur Meublé Non Professionnel)
- **LMP** (Loueur Meublé Professionnel)
- **Bascule automatique** selon critères réels :
  - CA > 23 000 € (LMNP → LMP)
  - Revenus > 50% du foyer fiscal
  - Inscription à la Chambre de Commerce (LMP)

#### 💡 Comparateur 4 Options
Affichage simultané des **4 régimes fiscaux** avec calcul en temps réel :

1. **LMNP Réel**
   - Charges déductibles complètes
   - URSSAF + IR calculés
   - Badge "MEILLEUR" si optimal

2. **Micro-BIC 30%** (non classé)
   - Abattement forfaitaire 30%
   - URSSAF + IR calculés
   - Option versement libératoire

3. **Micro-BIC 50%** (classé ⭐)
   - Meublé de tourisme classé
   - Abattement 50%
   - URSSAF + IR calculés
   - Option versement libératoire

4. **LMP Réel**
   - SSI (Sécurité Sociale Indépendants)
   - IR sur BIC
   - Déductions spécifiques

#### 📊 Chiffre d'Affaires
- **Calcul automatique** depuis les réservations
- **Affichage mensuel/annuel**
- **Ventilation par gîte**
- **Mode Test CA** pour simulations

#### 🔧 Versement Libératoire
- **Checkbox activable** pour Micro-BIC
- **Vérification éligibilité** automatique selon RFR
- **Taux ajustés** :
  - 1% si classé
  - 1,7% si non classé

#### 💰 Gestion des Charges par Gîte

##### Charges Annuelles
- **Taxe foncière**
- **Assurance habitation**
- **Assurance PNO** (Propriétaire Non Occupant)
- **Frais de copropriété**
- **Électricité**
- **Eau**
- **Internet/Box WiFi**
- **Abonnements divers**

##### Toggle Mensuel/Annuel
- Saisie au **mois** → conversion automatique en annuel (×12)
- Saisie à l'**année** → affichage direct
- **Sauvegarde en base** du mode choisi

##### Charges d'Emprunt
- **Intérêts d'emprunt** déductibles
- **Capital** non déductible (info affichée)
- **Assurance emprunteur**

##### Chargés Déductibles Spécifiques
- **Frais de syndic**
- **Travaux** (avec liste détaillée)
- **Frais bancaires**
- **Honoraires comptable**
- **Frais de gestion plateforme** (Airbnb, Booking...)
- **Frais kilométriques** (barème fiscal automatique)

#### 🏠 Charges Résidence Principale (Bureau)
- **Surface bureau** (m²)
- **Surface totale logement** (m²)
- **Calcul ratio automatique** (ex: 15m²/100m² = 15%)
- **Application du prorata** sur :
  - Intérêts emprunt résidence
  - Taxe foncière résidence
  - Électricité
  - Chauffage
  - Internet

#### 🛠️ Frais d'Exploitation

##### Travaux/Réparations
- Liste détaillée avec :
  - Intitulé
  - Montant
  - Date
  - Gîte concerné
  - Catégorie (plomberie, électricité, etc.)
- **Ajout/Suppression** en ligne

##### Frais Divers
- Petites fournitures
- Réparations mineures
- Consommables

##### Produits d'Accueil
- Gel douche
- Savon
- Papier toilette
- Dosettes café
- etc.

#### 📈 Résultats Fiscaux Calculés
- **Résultat fiscal** (CA - Charges)
- **Déficit reportable** si négatif
- **Économie d'impôts** estimée
- **Charges sociales** (URSSAF/SSI)
- **Impôt sur le revenu** selon TMI
- **TOTAL à payer** par régime
- **Meilleure option** affichée avec badge vert

#### 💾 Sauvegarde Automatique
- **Enregistrement automatique** toutes les 30 secondes
- **Par année fiscale**
- **Données liées au propriétaire** (user_id)

#### 📋 Gestion Multi-Années
- **Créer nouvelle année** (bouton)
- **Sélecteur d'année** pour consulter historique
- **Comparaison inter-années**

---

### 7️⃣ DÉCOUVRIR (Activités & Lieux)

#### 🗺️ Gestion des Activités
- **Par gîte** (sélection dans dropdown)
- **Catégories** :
  - Restaurant
  - Café/Bar
  - Musée
  - Château
  - Parc
  - Hôtel
  - Attraction touristique

#### ➕ Ajout d'Activité
- **Nom**
- **Catégorie**
- **Description**
- **Adresse complète**
- **Calcul automatique GPS** depuis l'adresse
- **Distance au gîte** (calculée automatiquement)
- **Site web**
- **Téléphone**
- **Note Google** (0-5 étoiles)
- **Nombre d'avis**

#### 🎨 Affichage des Activités
- **Grille de cartes** responsive
- **Icône par catégorie**
- **Badge note Google** avec étoiles
- **Distance affichée** (en km)
- **Lien vers Google Maps** pour itinéraire
- **Modification/Suppression** en un clic

#### 🗓️ Filtres
- **Par catégorie** (boutons filtres colorés)
- **Compteur d'activités** en temps réel
- **Recherche textuelle**

#### 🗺️ Carte Interactive
- **Affichage/Masquage** de la carte (toggle)
- **Leaflet.js** pour cartographie
- **Marqueurs colorés** par catégorie
- **Popup** avec infos au clic
- **Centrage automatique** sur le gîte
- **Itinéraire Google Maps** direct

---

### 8️⃣ CALENDRIER & TARIFS

#### 📅 Vue Calendrier
- **Calendrier mensuel** interactif
- **Tarifs par nuitée** affichables
- **Disponibilités** en temps réel
- **Synchronisation** avec réservations

#### 💶 Gestion des Tarifs
- **Tarifs de base** par gîte
- **Tarifs saisonniers** :
  - Basse saison
  - Moyenne saison
  - Haute saison
  - Jours fériés
  - Événements spéciaux
- **Durée de séjour** :
  - Weekend (2-3 nuits)
  - Semaine (7 nuits)
  - Quinzaine
  - Mois
- **Réductions automatiques** selon durée

#### 🎨 Personnalisation
- **Couleurs du calendrier** par gîte
- **Légendes personnalisables**
- **Export PDF/iCal**

---

### 9️⃣ INFOS GÎTES

#### 🏡 Informations de Base
- **Adresse complète**
- **Téléphone urgence** 24/7
- **Email contact**
- **Coordonnées GPS** (calculées automatiquement)

#### 📶 WiFi & Connectivité
- **SSID** (nom réseau)
- **Mot de passe WiFi**
- **QR Code WiFi** généré automatiquement
  - Téléchargement PNG
  - Impression directe
  - Scan = connexion automatique
- **Débit approximatif**
- **Localisation de la box**
- **Zones de bonne réception**

#### 🔑 Consignes d'Arrivée
- **Horaires d'arrivée** (dropdown)
- **Code d'accès** (digicode, boîte à clés)
- **Emplacement des clés**
- **Instructions parking**
- **Accès handicapé** (si applicable)
- **Instructions détaillées FR + EN**

#### 🏠 Consignes Pendant le Séjour
- **Chauffage** (mode d'emploi)
- **Climatisation** (si applicable)
- **Cheminée/Poêle**
- **Équipements cuisine** :
  - Machine à café (type, dosettes)
  - Lave-vaisselle
  - Four/Micro-ondes
  - Plaques cuisson
- **Machine à laver** (mode d'emploi)
- **TV/Internet** :
  - Télécommandes
  - Codes d'accès services streaming
  - Box TV
- **Équipements extérieurs** :
  - Barbecue
  - Piscine (règles, horaires)
  - Spa/Jacuzzi
  - Terrasse/Jardin
- **Poubelles & Tri sélectif**
- **Animaux** (acceptés ou non, supplément)

#### 🚪 Consignes de Sortie
- **Heure de départ** (checkout time)
- **Checklist départ** :
  - Éteindre chauffage/clim
  - Fermer volets
  - Déposer linge sale
  - Vider poubelles
  - Fermer portes/fenêtres
  - Rendre clés
- **État des lieux** (photos optionnelles)

#### 🆘 Numéros Utiles
- **Urgences** (SAMU, Pompiers, Police)
- **Médecin** local
- **Pharmacie** de garde
- **Vétérinaire** (si animaux acceptés)
- **Plombier/Électricien** d'urgence

#### 🌍 Langue FR/EN
- **Basculement** français/anglais
- **Stockage** séparé des textes
- **Traduction complète** de l'interface

#### ✨ Assistant IA
- **Amélioration automatique** des textes
- **Génération de descriptions**
- **Optimisation SEO** des contenus
- **Traduction assistée**
- **Configuration API OpenAI**

#### 💾 Sauvegarde
- **Bouton Enregistrer** global
- **Validation** des champs obligatoires
- **Confirmation visuelle** de sauvegarde
- **Stockage par gîte** en base

---

### 🔟 FICHES CLIENTS

#### 📋 Vue Générale
- **Statistiques rapides** :
  - Nombre de fiches générées
  - Ouvertures totales
  - Demandes horaires
  - Retours clients

#### 🔍 Filtres
- **Par gîte**
- **Par statut** :
  - Fiche générée
  - Non générée
  - Expirée (> 7 jours après checkout)
- **Par date**
- **Recherche par nom client**
- **Bouton Actualiser**

#### 📑 Liste des Réservations
Pour chaque réservation :
- **Nom client**
- **Gîte**
- **Dates de séjour**
- **Plateforme** (icône)
- **Statut fiche** :
  - ✅ Générée
  - ⏳ Non générée
  - ❌ Expirée
- **Actions** :
  - 📄 Générer fiche
  - 👁️ Voir la fiche
  - 📲 Envoyer WhatsApp
  - 📧 Envoyer Email
  - 🔗 Copier lien

#### 📲 Génération de Fiche
1. **Clic sur "Générer fiche"**
2. **Création du lien unique** (`token` aléatoire)
3. **Durée de validité** : 7 jours après checkout
4. **URL générée** : `pages/fiche-client.html?token=XXXXX`
5. **Stockage en BDD** (table `fiches_clients`)
6. **Partage** :
   - WhatsApp (message pré-rempli)
   - Email (template personnalisable)
   - Copie du lien direct

#### 🕐 Demandes Horaires d'Arrivée
- **Liste des demandes** d'arrivée anticipée
- **Statut** : En attente / Acceptée / Refusée
- **Détails** :
  - Client
  - Gîte
  - Heure souhaitée
  - Heure normale
  - Motif (optionnel)
- **Actions** :
  - ✅ Accepter
  - ❌ Refuser
  - 💬 Commentaire

#### 💬 Retours Clients
- **Tous les retours** clients depuis fiches
- **Types** :
  - Problème durant séjour
  - Suggestion
  - Question
  - Autre
- **Statut** : Non traité / En cours / Résolu
- **Détails** :
  - Client
  - Gîte
  - Date
  - Message
  - Photos (si jointes)
- **Réponse** possible depuis l'interface

#### ⚙️ Configuration Gîtes
- **Édition rapide** des infos essentielles :
  - Code d'entrée
  - Adresse
  - WiFi (SSID, mot de passe)
  - Horaires arrivée/départ
- **Sans passer par l'onglet "Infos Gîtes"**

#### ✅ Checklists Entrée/Sortie
Configuration des **checklists personnalisées** :
- **Checklist Entrée** (ex: Vérifier frigo rempli, Chauffage allumé, etc.)
- **Checklist Sortie** (ex: Vider poubelles, Éteindre lumières, etc.)
- **Par gîte** (paramétrage indépendant)
- **Ajout/Suppression** d'items
- **Ordre personnalisable**
- **Affichage dans la fiche client**

---

### 1️⃣1️⃣ CHECKLISTS (Assistant Séjour)

#### 📝 Gestion Centralisée
- **Toutes les checklists** en un seul endroit
- **Par gîte** et **par période** :
  - Avant l'arrivée
  - Jour d'arrivée
  - Pendant le séjour
  - Jour de départ
  - Après le départ

#### ✅ Fonctionnalités
- **Ajout** de nouvelles tâches
- **Modification** en ligne
- **Suppression** avec confirmation
- **Cochage/Décochage** (suivi de réalisation)
- **Assignation** à une personne (optionnel)
- **Date/Heure de réalisation** (si besoin)

#### 🔄 Synchronisation
- **Lien avec réservations** actives
- **Génération automatique** pour chaque nouveau séjour
- **Historique** des checklists complétées

---

### 1️⃣2️⃣ FAQ (Questions Fréquentes)

#### ❓ Catégories
- **Arrivée/Départ**
- **Équipements**
- **Services**
- **Alentours**
- **Problèmes techniques**

#### 🔧 Gestion
- **Ajout** de nouvelles FAQ
- **Édition** en ligne
- **Suppression**
- **Ordre** personnalisable (drag & drop)
- **Recherche** textuelle
- **Accordéon** pour affichage compact

#### 🌍 Multilingue
- **Version FR**
- **Version EN**
- **Gestion séparée** des contenus

---

## 📄 FICHE CLIENT INTERACTIVE (pages/fiche-client.html)

### 🎨 Design & Expérience
- **PWA Ready** (Progressive Web App)
- **Responsive complet** mobile/tablette/desktop
- **Design moderne** coloré et engageant
- **Animations fluides**
- **Thèmes** :
  - 🏢 **Entreprise** (cyan professionnel)
  - 🌾 **Gîte de France** (ambiance champêtre)

### 🏠 Header Personnalisé
- **Logo dynamique** selon thème
- **Nom du gîte**
- **Dates du séjour**
- **Switch thème** (Entreprise/Gîte)
- **Switch langue** (FR/EN)
- **Bouton Partager**

### 🎯 Hero Section (Avant Arrivée)
- **Compte à rebours** jusqu'à l'arrivée :
  - Jours
  - Heures
  - Minutes
- **4 Actions Rapides** (grille 2x2) :
  - 🔑 Code d'accès
  - 📶 WiFi
  - 🗺️ Activités
  - 📞 Contact

### 📊 Timeline du Séjour
- **3 phases** :
  1. **Avant votre arrivée**
     - Suggestions de préparation
     - Courses à faire
     - Contact propriétaire
  
  2. **Pendant votre séjour** (phase active)
     - Widget météo en temps réel
     - Activités suggérées
     - Restaurants recommandés
  
  3. **Après votre départ**
     - Demande d'avis
     - Formulaire satisfaction
     - Programme fidélité

---

### 📑 ONGLETS DE LA FICHE CLIENT

#### 1️⃣ ENTRÉE

##### 📍 Adresse du Gîte
- **Adresse complète** affichée
- **Bouton "Ouvrir dans Google Maps"** direct
- Coordonnées GPS intégrées

##### 🕐 Horaire d'Arrivée
- **Heure confirmée** en grand format
- **Demande d'arrivée anticipée** :
  - Formulaire intégré
  - Sélection heure souhaitée
  - Motif optionnel
  - Message d'avertissement (sous réserve ménage)
  - Envoi au propriétaire
  - Réponse push notification

##### 🔑 Code d'Accès
- **Code affiché** (digicode, boîte à clés)
- **Instructions détaillées** avec photos
- **Icônes explicatives**
- **Copie en un clic**

##### 🚗 Parking
- **Instructions stationnement**
- **Carte interactive** si parking spécifique
- **Photos** du parking

##### ♿ Accessibilité
- **Info handicap** si applicable
- **Équipements spéciaux** listés

#### 2️⃣ PENDANT

##### 📶 WiFi
- **SSID affiché**
- **Mot de passe** copiable
- **QR Code** scannable pour connexion instantanée
- **Instructions** si problème de connexion

##### 🔥 Chauffage/Climatisation
- **Mode d'emploi détaillé**
- **Thermostats** (photos + explications)
- **Consignes éco-responsables**

##### 🍽️ Équipements Cuisine
- **Machine à café** (type, utilisation)
- **Lave-vaisselle**
- **Four/Micro-ondes**
- **Plaques**
- **Ustensiles spéciaux**

##### 📺 TV & Divertissements
- **Télécommandes** (mode d'emploi)
- **Chaînes disponibles**
- **Services streaming** (Netflix, etc.) avec codes
- **Console de jeux** (si applicable)

##### 🧺 Machine à Laver
- **Mode d'emploi**
- **Produits fournis**
- **Séchage** (sèche-linge ou étendoir)

##### 💧 Piscine/Spa (si applicable)
- **Horaires d'accès**
- **Règles de sécurité**
- **Chauffage** (activation)
- **Produits interdits**

##### 🔥 Cheminée/Poêle
- **Instructions allumage**
- **Bois fourni** ou à acheter
- **Consignes sécurité**

##### 🗑️ Poubelles & Tri
- **Emplacement** des bacs
- **Jours de ramassage**
- **Consignes tri sélectif** (couleurs des bacs)

##### 🐕 Animaux
- **Acceptés ou non**
- **Supplément** éventuel
- **Règles** (laisse, accès piscine, etc.)

##### 🆘 Contacts Urgence
- **Propriétaire** (téléphone cliquable)
- **SAMU / Pompiers**
- **Médecin** local
- **Pharmacie** de garde
- **Plombier/Électricien** d'urgence

#### 3️⃣ SORTIE

##### 🕐 Heure de Départ
- **Checkout time** en grand format
- **Tolérance** éventuelle (si indiquée)

##### ✅ Checklist de Départ
Liste cochable :
- [ ] Éteindre chauffage/climatisation
- [ ] Fermer fenêtres
- [ ] Fermer volets
- [ ] Déposer linge sale (emplacement indiqué)
- [ ] Vider réfrigérateur (si séjour long)
- [ ] Vider poubelles
- [ ] Éteindre lumières
- [ ] Fermer portes à clé
- [ ] Reposer clés (à l'emplacement prévu)
- [ ] Vérifier objets oubliés

**Progression affichée** : X/Y tâches complétées

##### 📸 Photos de Sortie (Optionnel)
- Upload possible de **photos de l'état des lieux**
- **Textarea** pour commentaires
- Envoi au propriétaire

#### 4️⃣ ACTIVITÉS & COMMERCES

##### 🗺️ Carte Interactive
- **Leaflet.js** intégré
- **Marqueurs colorés** :
  - 🍴 Restaurant (rouge)
  - ☕ Café (marron)
  - 🏛️ Musée (violet)
  - 🏰 Château (bleu)
  - 🌳 Parc (vert)
  - 🏨 Hôtel (orange)
  - 🎡 Attraction (rose)
- **Popup** au clic :
  - Nom
  - Catégorie
  - Distance
  - Note Google
  - Téléphone (cliquable)
  - Bouton "Itinéraire"

##### 📋 Liste des Activités
Pour chaque activité :
- **📷 Photo** (si ajoutée)
- **Nom**
- **Catégorie** (badge coloré)
- **⭐ Note** Google (avec nombre d'avis)
- **📏 Distance** du gîte (en km)
- **⏱️ Temps de trajet** :
  - 🚗 Voiture
  - 🚴 Vélo
  - 🚶 À pied
- **📝 Description**
- **📍 Adresse** (lien Google Maps)
- **🌐 Site web** (lien externe)
- **📞 Téléphone** (cliquable)
- **🧭 Bouton "Itinéraire"** direct

##### 🔍 Filtres par Catégorie
- Boutons filtres réactifs
- Compteur d'activités filtrées
- Animation de transition

##### ⭐ Favoris
- **Sélection des activités favorites** (cœur)
- **Sauvegarde** pour consultation rapide

#### 5️⃣ DEMANDES & RETOURS

##### 🆘 Signaler un Problème
- **Types prédéfinis** :
  - Panne (électricité, eau, chauffage...)
  - Équipement cassé
  - Problème propreté
  - Manque de produits
  - Autre
- **Description détaillée** (textarea)
- **Photos** (upload jusqu'à 3 photos)
- **Niveau d'urgence** :
  - 🔴 Urgent
  - 🟡 Moyen
  - 🟢 Faible
- **Envoi** au propriétaire avec notification push

##### 💡 Faire une Suggestion
- **Textarea** libre
- **Catégories** :
  - Équipements
  - Décoration
  - Activités
  - Services
  - Autre

##### ❓ Poser une Question
- **Textarea**
- **Envoi direct** au propriétaire
- **Réponse par email** ou dans l'interface

##### 📝 Retour d'Expérience
- **Formulaire complet** :
  - Note globale (étoiles)
  - Propreté
  - Confort
  - Emplacement
  - Communication
  - Équipements
- **Commentaire libre**
- **Photos du séjour** (optionnel)
- **Recommanderiez-vous ?** (Oui/Non)

#### 6️⃣ ÉVALUATION

##### ⭐ Notation Détaillée
- **5 critères** avec étoiles :
  - Propreté
  - Confort
  - Emplacement
  - Communication
  - Rapport qualité/prix
- **Commentaire général** (textarea)
- **Points forts** (puces)
- **Points à améliorer** (puces)

##### 📸 Photos du Séjour
- Upload jusqu'à **5 photos**
- **Miniatures** avec prévisualisation
- **Compression automatique** avant envoi

##### 📊 Statistiques Anonymes
- **Taux de satisfaction** global du gîte (si partagé)
- **Nombre d'évaluations** déjà données

#### 7️⃣ FAQ

##### 📚 Questions Fréquentes
- **Accordéons** par catégorie :
  - Arrivée/Départ
  - Équipements
  - Règlement intérieur
  - Alentours
  - Problèmes courants
- **Recherche** dans les FAQ
- **Multilingue** (FR/EN auto selon langue choisie)

##### 💬 Poser une Nouvelle Question
- Si réponse introuvable dans FAQ
- **Formulaire direct** vers propriétaire

---

### 📊 Analytics Fiche Client

#### 📈 Suivi des Consultations
- **Ouvertures** (nombre de fois que le client a ouvert la fiche)
- **Temps passé** par onglet
- **Éléments consultés** :
  - Activités vues
  - FAQ lues
  - Checklist complétée (%)
- **Stockage en base** pour statistiques propriétaire

#### 📲 Notifications Push
- **Réponse aux demandes** (arrivée anticipée, problème signalé)
- **Messages du propriétaire**
- **Rappels** (départ dans 24h, checklist sortie)

---

## 🎛️ OPTIONS & PARAMÈTRES

### ⚙️ Gestion des Gîtes (Modal)
- **Ajout** de nouveaux gîtes
- **Modification** :
  - Nom
  - Adresse
  - Couleur dans calendrier
  - Photo
  - Description
- **Suppression** (avec confirmation)
- **Ordre d'affichage**

### 👤 Profil Utilisateur
- **Informations personnelles** :
  - Nom
  - Email
  - Téléphone
  - Adresse
- **Notifications** (activation/désactivation)
- **Langue préférée**
- **Fuseau horaire**

### 🔔 Notifications
- **Nouvelle réservation**
- **Modification réservation**
- **Annulation**
- **Demande client** (arrivée, signalement)
- **Ménage terminé**
- **Statistiques hebdomadaires**

### 🔐 Sécurité
- **Changement de mot de passe**
- **Double authentification** (2FA) optionnelle
- **Historique des connexions**
- **Sessions actives** (déconnexion à distance)

### 🎨 Personnalisation
- **Logo entreprise** (upload)
- **Couleurs du thème** par gîte
- **Signature email**
- **Templates messages** (WhatsApp, Email)

---

## 🔄 SYNCHRONISATION & AUTOMATION

### 📡 Synchronisation iCal
- **Fréquence** : Toutes les 2 heures (configurable)
- **Plateformes supportées** :
  - Airbnb (import/export)
  - Booking.com (import)
  - Abritel/HomeAway (import)
  - Gîtes de France (import)
  - Autres (iCal générique)
- **Détection conflits** automatique
- **Logs détaillés** de synchronisation

### 🤖 Automatisations
- **Génération fiche client** automatique 3 jours avant arrivée
- **Envoi WhatsApp** automatique (si activé)
- **Email de bienvenue** J-1
- **Email de remerciement** après départ
- **Demande d'avis** J+2 après départ
- **Calcul automatique** du CA pour fiscalité
- **Alertes stock draps** faible
- **Rappels ménages** à J-1

---

## 📱 VERSION MOBILE

### 📲 Responsive Design
- **Adaptation automatique** tous écrans
- **Menu hamburger** pour navigation
- **Swipe** entre onglets
- **Bottom navigation** sur mobile
- **Touch optimisé** (boutons plus grands)

### 📴 Mode Hors Ligne (PWA)
- **Installation** sur écran d'accueil
- **Cache intelligent** des données essentielles
- **Synchronisation** dès retour connexion

---

## 🗄️ ARCHITECTURE TECHNIQUE

### 🛢️ Base de Données (Supabase PostgreSQL)

#### Tables Principales
- **`users`** : Utilisateurs propriétaires
- **`gites`** : Gîtes configurés
- **`reservations`** : Toutes les réservations
- **`fiches_clients`** : Fiches générées
- **`activites`** : Lieux et activités
- **`charges_fiscales`** : Charges par année
- **`historique_donnees`** : CA historiques
- **`menages`** : Planning ménage
- **`draps`** : Stocks linge
- **`demandes_clients`** : Demandes horaires, problèmes, retours
- **`checklists`** : Items de checklists
- **`faq`** : Questions/réponses
- **`notifications`** : Notifications utilisateur
- **`sync_logs`** : Historique synchronisations

#### RLS (Row Level Security)
- **Toutes les tables protégées** par RLS
- **Politique** : `user_id = auth.uid()`
- **Isolation totale** des données entre clients

#### Triggers & Functions
- **Calcul automatique** du CA lors d'ajout de réservation
- **Création auto** des fiches clients 3J avant arrivée
- **Envoi notifications** via webhooks Supabase

### 🔐 Sécurité
- **XSS Protection** avec DOMPurify (sanitization HTML)
- **CSRF** : Tokens Supabase
- **Rate Limiting** : 100 requêtes/minute
- **Validation côté serveur** de toutes les données
- **Logs** des actions critiques

### 🚀 Performance
- **Lazy Loading** des onglets JavaScript
- **Cache CSS** avec versioning (`?v=2.4.1`)
- **Compression images** automatique
- **CDN** pour librairies externes (Lucide, Font Awesome)
- **Debounce** sur recherches et calculs

---

## 📊 RAPPORTS & EXPORTS

### 📈 Rapports Disponibles
- **Rapport mensuel** : CA, nb réservations, TO%
- **Rapport annuel** : Comparaison années, graphiques
- **Rapport fiscal** : Tableau récapitulatif charges/revenus
- **Rapport ménages** : Interventions, coûts
- **Rapport clients** : Satisfactions, retours

### 💾 Formats d'Export
- **PDF** (visualisation propre, imprimable)
- **Excel/CSV** (analyse de données)
- **JSON** (backup technique)

---

## 🔔 SUPPORT & ASSISTANCE

### 🎫 Système de Tickets
- **Création ticket** depuis dashboard
- **Catégories** :
  - Bug technique
  - Demande amélioration
  - Question fonctionnalité
  - Aide utilisation
- **Priorités** :
  - Critique
  - Haute
  - Normale
  - Basse
- **Suivi** avec statut (Ouvert, En cours, Résolu)
- **Réponses** par email + dans interface
- **Pièces jointes** (captures d'écran)

### 📚 Documentation
- **Guide utilisateur** complet (ce document)
- **Vidéos tutoriels** (liens intégrés)
- **FAQ technique**
- **Changelog** des mises à jour

---

## 🔮 ÉVOLUTIONS FUTURES (Roadmap)

### 🚧 En Développement
- [ ] Multi-propriétaires (gestion famille/associés)
- [ ] Application mobile native (iOS/Android)
- [ ] Signature électronique contrats
- [ ] Paiements en ligne intégrés
- [ ] Caution en ligne (Swikly)
- [ ] État des lieux numérique avec photos
- [ ] Assistant IA pour réponses clients
- [ ] Traduction automatique des messages
- [ ] Gestion des charges copropriété
- [ ] Module de facturation complet

### 💡 Idées à Venir
- [ ] Marketplace produits d'accueil
- [ ] Comparateur assurances
- [ ] Partenariats activités locales
- [ ] Programme fidélité clients
- [ ] Chatbot intelligent
- [ ] Intégration domotique (Netatmo, etc.)

---

## 📞 CONTACTS & RESSOURCES

### 🛠️ Support Technique
- **Email** : support@liveownerunit.com
- **Tickets** : Via interface (Dashboard > Icône casque)
- **Réponse** : < 24h jours ouvrés

### 📖 Documentation
- **Docs en ligne** : docs.liveownerunit.com
- **Vidéos** : youtube.com/liveownerunit
- **Blog** : blog.liveownerunit.com

### 🌐 Réseaux Sociaux
- LinkedIn : /liveownerunit
- Facebook : /liveownerunit
- Instagram : @liveownerunit

---

## 🎓 GLOSSAIRE

- **LMNP** : Loueur Meublé Non Professionnel
- **LMP** : Loueur Meublé Professionnel
- **Micro-BIC** : Régime fiscal simplifié (abattement forfaitaire)
- **Réel** : Régime fiscal avec déduction des charges réelles
- **TO (Taux d'Occupation)** : Pourcentage de jours occupés sur période
- **CA (Chiffre d'Affaires)** : Total des revenus locatifs
- **TMI (Tranche Marginale d'Imposition)** : Taux d'impôt sur le revenu
- **RFR (Revenu Fiscal de Référence)** : Base fiscale du foyer
- **PWA (Progressive Web App)** : Application web installable
- **RLS (Row Level Security)** : Sécurité au niveau ligne en BDD
- **iCal** : Format standard de calendrier (synchronisation)

---

## ✅ CHECKLIST DE PRISE EN MAIN

### 🏁 Démarrage Rapide (30 min)

1. **Configuration initiale** ✅
   - [ ] Créer compte
   - [ ] Valider email
   - [ ] Ajouter premier gîte
   - [ ] Personnaliser couleurs

2. **Import des données** ✅
   - [ ] Ajouter liens iCal (Airbnb, Booking...)
   - [ ] Lancer première synchronisation
   - [ ] Vérifier réservations importées

3. **Paramètres du gîte** ✅
   - [ ] Remplir onglet "Infos Gîtes"
   - [ ] Générer QR Code WiFi
   - [ ] Configurer consignes arrivée/départ

4. **Fiscalité** ✅
   - [ ] Choisir statut (LMNP/LMP)
   - [ ] Entrer charges de l'année
   - [ ] Voir comparatif options fiscales

5. **Première fiche client** ✅
   - [ ] Générer fiche pour prochaine réservation
   - [ ] Personnaliser activités alentours
   - [ ] Envoyer au client (WhatsApp/Email)

6. **Gestion ménage** ✅
   - [ ] Configurer règles ménage
   - [ ] Partager lien espace ménage
   - [ ] Tester validation

---

## 🎉 CONCLUSION

**LiveOwnerUnit** est une solution complète et professionnelle pour gérer vos locations saisonnières. Toutes les fonctionnalités sont pensées pour vous faire gagner du temps, optimiser votre fiscalité et offrir une expérience client exceptionnelle.

**📊 En Production** : Site utilisé quotidiennement par des propriétaires réels
**🔒 Fiable & Sécurisé** : Données protégées, sauvegardes automatiques
**📈 Évolutif** : Nouvelles fonctionnalités ajoutées régulièrement

🚀 **Bon usage de LiveOwnerUnit !**

---

**Document créé le :** 05 février 2026  
**Version :** 1.0  
**Auteur :** Équipe LiveOwnerUnit  
**Dernière révision :** En cours...

---

