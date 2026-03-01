# LiveOwnerUnit — Inventaire exhaustif des pages et fonctionnalités (hors admin)

Date : 19/02/2026
Périmètre : toutes les pages et options accessibles par un propriétaire utilisateur standard.

---

## Structure générale

L'application se compose de :
- **app.html** — l'interface principale, avec une barre de navigation à onglets
- **pages/** — pages autonomes accessibles depuis l'interface ou par lien direct
- **tabs/** — onglets chargés dynamiquement dans l'interface principale

---

## I. INTERFACE PRINCIPALE (app.html)

La barre de navigation contient **11 onglets visibles** + des onglets accessibles via le menu.

---

### 1. Tableau de Bord (`tab-dashboard.html`)

**Accès** : premier onglet affiché par défaut à la connexion.

**Ce que ça fait** :
- Affiche la date du jour et le numéro de semaine en cours
- Bouton d'actualisation des indicateurs financiers avec horodatage de la dernière synchro
- Zones d'alertes dynamiques (masquées si vide, visibles si des éléments sont en attente) :
  - Demandes de changement d'horaire arrivée/départ (avec badge compteur)
  - Propositions de changement de date ménage (avec badge compteur)
  - Tickets support en attente (avec badge compteur)
  - Problèmes urgents (avec badge rouge)
  - Demandes et retours clients non traités (avec badge info)
  - Widget communications client
- Section **VISION ACTIONS** :
  - Réservations de la semaine (liste pleine largeur avec pagination)
  - Tâches à faire (todo list du propriétaire)
  - Planning ménage de la semaine
  - Indicateurs financiers (CA semaine, CA mois, CA année)
  - Widget de propositions IA (suggestions automatiques)

---

### 2. Réservations (`tab-reservations.html`)

**Ce que ça fait** :
- Planning visuel de toutes les réservations (par semaine, par gîte)
- Barre de recherche pour filtrer par nom de client, gîte, plateforme
- Bouton d'actualisation avec horodatage
- Indicateur de statut de synchronisation iCal
- Actions disponibles sur chaque réservation :
  - Voir les détails
  - Modifier
  - Supprimer
  - Générer la fiche client
  - Ouvrir la fiche client (lien vers la page voyageur)
  - Envoyer par WhatsApp
- Import automatique de réservations depuis les plateformes (Airbnb, Booking, Abritel, Gîtes de France) via flux iCal
- Gestion des conflits de dates (détection automatique)

---

### 3. Kanban (`tab-kanban.html`)

**Ce que ça fait** :
- Tableau visuel de gestion des tâches en 3 colonnes : **À faire / En cours / Terminé**
- Création de nouvelles tâches avec un bouton dédié
- Tâches organisées en 3 catégories filtrables :
  - Actions Réservations
  - Achats & Courses
  - Travaux & Maintenance
- Chaque tâche peut être déplacée d'une colonne à l'autre
- Compteur du nombre de tâches dans chaque colonne
- Modal de détail au clic sur une tâche

---

### 4. Statistiques (`tab-statistiques.html`)

**Ce que ça fait** :
- Filtre par année
- Statistiques de réservations par plateforme :
  - Airbnb
  - Abritel
  - Gîtes de France (fonctionnalité soumise à abonnement)
- Taux d'occupation par gîte (une carte par gîte)
- Statistiques avancées :
  - Prix moyen par nuit
  - Durée moyenne de séjour
  - Meilleur mois de l'année avec le CA associé
- Saisie manuelle des données historiques (années précédentes) pour comparaison graphique
- Bouton "Gérer données" pour accéder au formulaire de saisie d'historique

---

### 5. Prestations (`tab-prestations.html`)

**Ce que ça fait** :
- Sélection d'un gîte pour voir ses prestations
- Vue statistiques des commandes clients :
  - Commandes de la semaine en cours
  - Commandes du mois en cours
  - Commandes de l'année en cours
- Gestion du catalogue de prestations :
  - Créer / modifier / supprimer des prestations
  - Chaque prestation a un nom, un prix, une description, une disponibilité
- Les voyageurs peuvent commander des prestations depuis leur fiche de séjour
- Page alternative dédiée aux propriétaires avec plusieurs gîtes : `pages/desktop-owner-prestations.html`

---

### 6. Linge / Draps (`tab-draps.html`)

**Ce que ça fait** :
- **Configuration des besoins** : définir par gîte le nombre d'articles nécessaires par réservation (draps plats, housses, taies, serviettes, tapis de bain…)
- **Stock en réserve** : saisir le stock actuel de chaque article, avec sauvegarde
- **Réservations couvertes** : calcul automatique du nombre de réservations que le stock actuel peut couvrir
- **Ce qu'il faut emmener au gîte** : sélectionner un gîte et une date limite → l'appli calcule ce qui manque
- **Simulation des besoins futurs** : choisir une date limite → l'appli simule les besoins à venir
- **Alerte manque de draps** : configurer un déclencheur automatique pour créer une tâche "Commander draps" lorsque le stock est insuffisant
- Décrémentation automatique du stock à chaque départ de voyageur (protection anti-doublon intégrée)

---

### 7. Ménage (`tab-menage.html`)

**Ce que ça fait** :
- Planning des ménages par semaine (généré automatiquement depuis les réservations)
- Barre de recherche
- Bouton **RÈGLES** : définir les règles de calcul des ménages (ex. délai après départ, durée estimée)
- Bouton **VOIR RÈGLES** : consulter les règles configurées
- Bouton **VALIDATION SOCIÉTÉ** : ouvre la page de validation pour l'entreprise de ménage externe
- Bouton **ESPACE MÉNAGE** : ouvre la page dédiée à la femme de ménage (voir section III)
- Propositions de changement de date ménage (affichées en attente si soumises par la femme de ménage)
- Section **RETOURS DE LA FEMME DE MÉNAGE** : observations et signalements des 30 derniers jours

---

### 8. Fiscal (`tab-fiscalite-v2.html`)

**Ce que ça fait** :
- Sélection du statut fiscal : **LMNP**, **Micro-BIC**, ou **LMP**
- Option classement meublé (classé / non classé) avec incidence sur les abattements
- Saisie du chiffre d'affaires annuel (calculé automatiquement depuis les réservations)
- Tableau comparatif de toutes les options fiscales côte à côte
- Calcul en temps réel des impôts estimés
- Gestion multi-années : créer une nouvelle année fiscale, archiver les précédentes
- Sauvegarde automatique des données
- Bouton **Options** pour paramétrer les calculs
- Mode test (badge rouge visible en modal de test)
- Saisie des charges déductibles par catégorie
- Historique des calculs par année

---

### 9. À Découvrir (`tab-decouvrir.html`)

**Ce que ça fait** :
- Liste d'activités, restaurants et sites touristiques à recommander aux voyageurs autour des gîtes
- Sélection d'un gîte pour voir les lieux associés
- Filtres par catégorie (généré dynamiquement)
- Compteur du nombre d'activités enregistrées
- **Carte interactive** (Leaflet) avec localisation de tous les lieux (toggle pour afficher/masquer)
- Ajout d'une activité / lieu via une modale (nom, catégorie, description, photos, lien, adresse, coordonnées GPS)
- Modification et suppression d'une activité
- Les activités configurées ici apparaissent dans la fiche voyageur

---

### 10. Calendrier Tarifs (`tab` non listé mais accessible via `data-tab="calendrier-tarifs"`)

**Ce que ça fait** :
- Gestion des tarifs par période et par gîte
- Définir des prix selon les saisons (haute, basse, vacances scolaires…)
- Configuration des tarifs sur un calendrier mensuel

---

### 11. Infos Pratiques / Infos Gîtes (`tab-infos-gites.html`)

**Ce que ça fait** :
- Sélection du gîte à renseigner
- Formulaire complet organisé en 8 sections :
  1. **Informations de Base** : adresse (avec calcul automatique des coordonnées GPS), capacité, équipements principaux
  2. **WiFi & Connectivité** : nom réseau, mot de passe, QR code Wi-Fi généré automatiquement
  3. **Consignes d'Arrivée** : horaires (liste déroulante), instructions clé/code, texte libre d'accueil
  4. **Le Logement** : guide complet des pièces, équipements, appareils, instructions d'utilisation
  5. **Tri des Déchets** : consignes de tri par type de déchet
  6. **Sécurité & Urgences** : numéros d'urgence, consignes de sécurité, localisation extincteurs
  7. **Consignes de Départ** : liste des actions requises à la fin du séjour
  8. **Règlement Intérieur** : règles de la maison en texte libre
- Version bilingue FR/EN : bouton bascule drapeau pour éditer ou consulter la version anglaise
- **Bouton IA ✨** : amélioration automatique de tous les textes avec l'IA (fonctionnalité soumise à abonnement)
- **Photos Fiche Client** : gérer les photos associées au gîte qui s'affichent dans la fiche voyageur
- Bouton effacer toutes les infos
- Ces informations alimentent automatiquement la fiche voyageur

---

### Onglets supplémentaires (accessibles via le menu principal ☰)

---

### 12. Gestion des Gîtes (`tab-gestion.html` / modale `showGitesManager`)

**Ce que ça fait** :
- Créer, modifier, supprimer les gîtes rattachés au compte
- Paramétrer les couleurs de chaque gîte dans l'interface
- Renommer les gîtes
- Gérer le nombre maximal de gîtes autorisés par l'abonnement

---

### 13. Checklists (`tab-checklists.html`)

**Ce que ça fait** :
- Créer et gérer des checklists de séjour (arrivée, en cours, départ)
- Ajouter / modifier / supprimer des items de checklist
- Sélectionner un type de checklist (arrivée, ménage, départ…)
- Ces checklists sont utilisées dans la fiche voyageur et par la femme de ménage

---

### 14. FAQ (`tab-faq.html`)

**Ce que ça fait** :
- Créer et gérer une base de questions/réponses fréquentes pour les voyageurs
- Catégories filtrables : Arrivée, Départ, Équipements, Localisation, Tarifs, Règlement
- Barre de recherche
- Bouton **Rétro-traduire FAQ** : traduit automatiquement toutes les questions/réponses de FR vers EN (ou inversement) via l'API de traduction
- Ces FAQ s'affichent dans la fiche voyageur côté client

---

### 15. Archives (`tab-archives.html`)

**Ce que ça fait** :
- Consultation des réservations passées (terminées)
- Consultation des tâches terminées (issues du tableau Kanban)
- Bouton **Vider l'archive** pour les tâches archivées

---

### 16. Parrainage (`tab-parrainage.html`)

**Ce que ça fait** :
- Affiche la réduction actuelle sur l'abonnement grâce aux parrainages actifs
- Barre de progression vers le prochain palier de récompense (ex. "Plus que X filleuls pour la réduction maximale")
- Récapitulatif de l'abonnement avec calcul du prix final après réduction
- Lien de parrainage unique à partager
- Suivi : nombre de filleuls actifs (ceux en abonnement payant comptent)
- Les paliers de récompense : réductions progressives jusqu'à ~100% selon le nombre de filleuls payants

---

## II. PAGE OPTIONS (`pages/options.html`)

Accessible depuis le menu ☰ → Options.

La page est structurée avec une **barre latérale de navigation** et 8 panneaux :

---

### 1. Mon Profil
- Nom, prénom, nom d'entreprise
- Email principal
- Téléphone
- Adresse complète (rue, code postal, ville, pays)
- Bouton Sauvegarder

---

### 2. Mon Abonnement
- Affiche le plan actif et sa date de renouvellement
- Affichage des 3 formules disponibles avec possibilité de changer :
  - **SOLO** — 1 gîte — 15 €/mois ou 10 €/mois avec engagement
  - **DUO** — 2 gîtes — 22 €/mois ou 15 €/mois avec engagement
  - **QUATTRO** — 4 gîtes — 33 €/mois ou 23 €/mois avec engagement
- Bascule entre les périodes de facturation : mensuel / engagement / annuel
- Affichage de la réduction parrainage appliquée
- Bouton "Améliorer mon abonnement" / "Réduire mon abonnement"
- Bouton "Gérer la facturation" (paiement)
- Bouton "Résilier"

---

### 3. Outils de Gestion
- Accès direct à la **FAQ** (s'ouvre dans un panneau inline sans quitter la page)
- Accès direct aux **Checklists** (idem)

---

### 4. Thème & Style
- **Thème de l'interface** : clair ou sombre
- **Style de navigation** : barre latérale ou barre du haut
- **Thème de la fiche client** : choix de l'apparence visuelle des fiches envoyées aux voyageurs

---

### 5. Archives
- Consultation des réservations passées (toutes plateformes confondues)
- Consultation des tâches/todos archivées

---

### 6. Support
- Créer une nouvelle demande de support avec sujet, description, catégorie, urgence
- Liste de ses tickets avec statut (ouvert / en cours / résolu)
- Répondre à un message de l'équipe support dans un fil de conversation
- Rouvrir un ticket résolu
- Supprimer un ticket

---

### 7. Notifications
- Paramétrage des notifications souhaitées

---

### 8. Parrainage
- Même contenu que l'onglet parrainage de l'interface principale (lien de parrainage, résumé réductions)

---

## III. PAGES AUTONOMES ACCESSIBLES AUX UTILISATEURS NON-ADMIN

---

### `pages/fiche-client.html` — Guide de séjour voyageur

**Accès** : lien sécurisé par token unique (envoyé via WhatsApp ou par message direct)

**Destinataire** : le voyageur (client du gîte)

**Ce que ça fait** :
- En-tête fixe avec nom du gîte et choix de langue (FR/EN)
- Affiche toutes les informations configurées par le propriétaire :
  - Instructions d'arrivée avec horaires
  - Code Wi-Fi (avec QR code si activé)
  - Guide du logement pièce par pièce
  - Tri des déchets
  - Consignes de départ avec checklist à cocher
  - Règlement intérieur
  - Sécurité & urgences
  - FAQ du séjour avec recherche et filtres par catégorie
  - Activités, restaurants et lieux à découvrir avec carte interactive
  - Services/prestations supplémentaires commandables (petit-déjeuner, vélos, etc.)
- Export PDF de la fiche complète
- Disponible en français et en anglais (traduction automatique si traduction manuelle absente)
- Lien de retour d'expérience client (formulaire de retour)

---

### `pages/femme-menage.html` — Espace femme de ménage

**Accès** : lien direct (partagé par le propriétaire à son équipe ménage)

**Destinataire** : la personne en charge du ménage

**Ce que ça fait** :
- Planning des ménages à faire avec dates et gîtes
- Validation d'un ménage effectué
- Signalement d'un problème constaté (description, catégorie, urgence)
- Proposition de changement de date ménage (envoyé en attente de validation propriétaire)
- Interface simplifiée, en mode jour uniquement, sans accès aux données du propriétaire

---

### `pages/validation.html` — Validation ménages (entreprise externe)

**Accès** : lien direct (partagé à la société de ménage prestataire)

**Destinataire** : entreprise ou prestataire de nettoyage externe

**Ce que ça fait** :
- Vue des ménages programmés par semaine
- Bouton de validation par ménage (confirme que le nettoyage a été réalisé)
- Vue hebdomadaire des tâches à valider
- Interface épurée, sans connexion requise (accès par lien)

---

### `pages/onboarding.html` — Création de compte / premier paramétrage

**Accès** : automatique à la première connexion d'un nouveau compte

**Ce que ça fait** :
- Tunnel de bienvenue en plusieurs étapes (barre de progression)
- Saisie des informations de profil (nom, type d'activité, nombre de gîtes)
- Configuration initiale du/des gîte(s)
- Explication des fonctionnalités clés de l'application
- Redirection vers le tableau de bord une fois l'onboarding terminé

---

### `pages/client-support.html` — Support client

**Accès** : lien direct ou depuis le menu Options

**Ce que ça fait** :
- Interface de support dédiée au client (propriétaire)
- Suivi des tickets ouverts
- Échange de messages avec l'équipe LiveOwnerUnit

---

### `pages/login.html` — Connexion

- Formulaire de connexion (email + mot de passe)
- Lien "Mot de passe oublié"
- Lien vers la page d'inscription (index.html)

---

### `pages/reset-password.html` — Réinitialisation du mot de passe

- Formulaire de saisie du nouveau mot de passe après clic sur le lien reçu par email

---

### `pages/logout.html` — Déconnexion

- Page de déconnexion avec redirection automatique

---

## IV. RÉCAPITULATIF — Ce que fait l'application en une vue

| Domaine | Fonctionnalité |
|---|---|
| Réservations | Import iCal multi-plateformes, planning visuel, gestion complète |
| Ménage | Planning automatique, validation, espace équipe, retours signalements |
| Linge | Stock, besoins, simulation, alerte automatique, décrémentation |
| Fiscal | Calcul LMNP / Micro-BIC / LMP, comparatif, historique pluriannuel |
| Statistiques | Taux d'occupation, CA, plateformes, comparatif années |
| Tarifs | Calendrier tarifaire par période et par gîte |
| Gîtes | Infos pratiques complètes, WiFi, QR code, bilingue FR/EN, photos |
| Voyageurs | Fiche de séjour personnalisée, envoi WhatsApp, suivi ouvertures |
| Tâches | Kanban visuel (À faire / En cours / Terminé) par catégorie |
| Activités | Liste des lieux à découvrir avec carte interactive, visible dans la fiche |
| FAQ | Base de Q&A par catégorie, bilingue, intégrée à la fiche voyageur |
| Checklists | Listes de vérification par étape du séjour, copiables entre gîtes |
| Prestations | Catalogue de services, commandes clients, statistiques |
| Parrainage | Lien de parrainage, réductions progressives sur l'abonnement |
| Support | Tickets de support avec conversation, depuis l'interface ou depuis Options |
| Options | Profil, abonnement, thème, style, archives, notifications, parrainage |
| Équipe ménage | Interface dédiée sans accès propriétaire, signalements, planning |
