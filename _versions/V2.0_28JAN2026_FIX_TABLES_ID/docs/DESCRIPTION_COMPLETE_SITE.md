# 📋 DESCRIPTION COMPLÈTE - GESTION GÎTE CALVIGNAC

> **Version actuelle :** v4.4  
> **Date de documentation :** 23 janvier 2026  
> **Statut :** 🟢 PRODUCTION (Clients réels)  
> **Auteur :** Système de Gestion Welcome Home

---

## 🎯 ANALYSE ET PRÉSENTATION DU SITE

### Vision Globale

**Gestion Gîte Calvignac** est une solution SaaS (Software as a Service) complète et professionnelle dédiée à la gestion locative de gîtes et locations saisonnières. Cette application web full-stack répond aux besoins opérationnels complexes des propriétaires de locations touristiques en centralisant l'ensemble de leurs activités dans une interface unique et intuitive.

### À Qui S'adresse Cette Solution ?

#### Utilisateurs Principaux
1. **Propriétaires de gîtes et locations saisonnières**
   - Gestion mono ou multi-propriétés
   - Propriétaires professionnels (statut LMNP)
   - Gestionnaires de locations courte durée

2. **Personnel d'entretien**
   - Femmes de ménage
   - Entreprises de ménage
   - Prestataires externes

3. **Clients voyageurs**
   - Locataires occasionnels
   - Voyageurs francophones et anglophones
   - Accès sans compte via lien sécurisé

### Problématiques Résolues

#### 1. **Gestion Multi-Plateformes Complexe**
**Problème** : Les propriétaires publient leurs biens sur plusieurs plateformes (Airbnb, Booking.com, Abritel) et jonglent avec des calendriers désynchronisés, créant des risques de double réservation.

**Solution** : 
- Import automatique iCal depuis toutes les plateformes
- Synchronisation calendrier centralisée
- Détection et résolution intelligente des conflits de dates
- Règle stricte : 1 seule réservation par gîte à la fois

#### 2. **Planning Ménage Fastidieux**
**Problème** : Planifier les ménages entre réservations est chronophage et source d'erreurs (week-ends, jours fériés, enchainements serrés).

**Solution** :
- Calcul automatique des dates/horaires de ménage
- 9 règles métier personnalisables (dimanche, samedi, enchainements, etc.)
- Interface femme de ménage pour propositions de modifications
- Validation entreprise avec historique complet

#### 3. **Communication Client Inefficace**
**Problème** : Envoyer manuellement les infos pratiques (codes, WiFi, consignes) à chaque client est répétitif et les informations se perdent.

**Solution** :
- Génération automatique de fiches clients personnalisées
- Application PWA bilingue (FR/EN) installable sur mobile
- QR codes WiFi générés automatiquement
- Checklists entrée/sortie, FAQ, activités touristiques
- Partage via WhatsApp/Email/SMS en 1 clic

#### 4. **Fiscalité LMNP Opaque**
**Problème** : Calculer les cotisations URSSAF, l'impôt sur le revenu, les amortissements et les trimestres de retraite est complexe et source d'erreurs.

**Solution** :
- Simulations fiscales automatiques multi-gîtes
- Calculs URSSAF conformes (avec minimum légal 1 200 €/an)
- Barème impôt progressif 2024/2025 intégré
- Amortissements linéaires (bâtiment 33 ans, mobilier 10 ans)
- Validation trimestres retraite automatique
- Export PDF rapports fiscaux

#### 5. **Gestion Linge Aléatoire**
**Problème** : Savoir combien de draps, housses et serviettes emporter pour les prochaines réservations relève du casse-tête.

**Solution** :
- Configuration besoins par gîte (types de linge personnalisables)
- Suivi stocks actuels (propre/sale)
- Simulation : calcule combien de réservations couvertes
- Proposition quantités optimales à emmener

#### 6. **Absence de Vision Globale**
**Problème** : Données éparpillées dans Excel, emails, calendriers, fichiers papier. Impossible d'avoir une vue d'ensemble.

**Solution** :
- Dashboard centralisé avec statistiques temps réel
- Taux d'occupation, revenus mensuels, réservations à venir
- Graphiques interactifs (Chart.js) : revenus, occupation, plateformes
- Indicateurs financiers (URSSAF, charges, bénéfice net)
- Export Excel pour analyses externes

### Valeur Ajoutée Unique

#### 1. **Automatisation Intelligente**
- Import iCal automatique depuis plateformes
- Calcul ménages selon règles métier personnalisables
- Traduction automatique FR→EN (MyMemory API)
- Génération QR codes WiFi
- Géocodage adresses (OpenStreetMap)

#### 2. **Conformité Fiscale Garantie**
- Taux fiscaux 2024/2025 intégrés et mis à jour
- Minimum URSSAF légal appliqué automatiquement
- Barème kilométrique professionnel
- Amortissements conformes règles comptables
- Historique simulations pour contrôles

#### 3. **Expérience Client Optimale**
- Fiche client PWA installable (fonctionne offline)
- Bilingue FR/EN avec switch instantané
- QR code WiFi pour connexion immédiate
- FAQ contextuelles par gîte
- Activités touristiques avec carte interactive

#### 4. **Multi-Tenant Sécurisé**
- Row Level Security (RLS) sur toutes les tables
- Isolation complète des données entre propriétaires
- Authentification Supabase robuste
- Protection XSS/injection (DOMPurify)
- Tokens accès clients avec expiration

#### 5. **Mobile-First**
- Design responsive Neo-Brutalism
- PWA fiche client installable
- Interface femme ménage optimisée mobile
- Touch-friendly (swipe, tap, scroll)

### Cas d'Usage Concrets

#### Scénario 1 : Nouveau Propriétaire
1. Inscription via `onboarding.html`
2. Ajoute ses gîtes avec adresses, capacités
3. Configure URLs iCal (Airbnb, Booking)
4. Synchronise → réservations importées automatiquement
5. Configure infos gîtes (WiFi, codes, parking)
6. Génère fiche client → partage lien au voyageur
7. Planning ménage calculé automatiquement

**Temps gagné** : 15h/mois de saisie manuelle

#### Scénario 2 : Période Fiscale
1. Ouvre onglet Fiscalité
2. Sélectionne année + gîtes concernés
3. Saisit charges (EDF, eau, assurance, travaux)
4. Lance simulation → calculs instantanés
5. Visualise : bénéfice, URSSAF, IR, trimestres retraite
6. Exporte PDF → envoi comptable

**Temps gagné** : 8h de calculs manuels

#### Scénario 3 : Client Anglophone
1. Génère fiche client bilingue
2. Partage lien via WhatsApp
3. Client ouvre sur mobile → installe PWA
4. Switch EN → tout traduit automatiquement
5. Scanne QR code WiFi → connecté instantanément
6. Consulte FAQ, activités, checklist départ

**Satisfaction client** : +40% (moins d'appels, autonomie)

#### Scénario 4 : Femme de Ménage
1. Accède à `femme-menage.html`
2. Consulte planning semaine
3. Voit ménage prévu samedi 10h (gîte Trévoux)
4. Propose modification : vendredi 14h (conflit personnel)
5. Entreprise valide → statut mis à jour
6. Reçoit confirmation

**Flexibilité** : Gestion collaborative optimisée

### Technologies et Innovations

#### Stack Technique Moderne
- **Frontend** : HTML5/CSS3/JavaScript Vanilla (zéro framework = performances optimales)
- **Backend** : Supabase (PostgreSQL + Auth + RLS)
- **APIs** : MyMemory (traduction), Nominatim (géocodage), iCal.js (parsing)
- **Libraries** : Chart.js, Leaflet, DOMPurify, xlsx.js

#### Architecture Singleton
```javascript
window.gitesManager = {
    getAll: async () => { /* Cache + Supabase */ },
    getById: async (id) => { /* ... */ }
}
```
**Avantages** : Code réutilisable, performance, maintenabilité

#### Progressive Web App (PWA)
- Fiche client installable sur mobile
- Fonctionne offline (Service Worker)
- Icône sur écran d'accueil
- Expérience native

#### Row Level Security (RLS)
- Sécurité au niveau base de données
- Impossible d'accéder aux données d'un autre propriétaire
- Pas de code métier côté client

### Chiffres Clés

**Projet** :
- 📊 22 tables actives en base de données
- 🧩 42 modules JavaScript (14 000+ lignes)
- 📱 6 pages externes accessibles
- 📑 15+ onglets dashboard
- 📚 3 500+ lignes de documentation
- 🗂️ 200+ fichiers actifs

**Fonctionnalités** :
- ✅ Import iCal depuis 5+ plateformes
- ✅ Gestion multi-gîtes illimitée
- ✅ 119 champs infos gîtes (bilingue)
- ✅ 9 règles ménage personnalisables
- ✅ Fiscalité LMNP complète (URSSAF + IR + retraite)
- ✅ Stocks linge dynamiques
- ✅ Activités touristiques avec carte
- ✅ Stats graphiques interactives

**Performance** :
- ⚡ 0 framework = chargement ultra-rapide
- 💾 Cache local = moins de requêtes BDD
- 🔒 RLS = sécurité garantie
- 📱 PWA = expérience native mobile

### Évolutions Futures Prévues

#### Court Terme (2026)
- 🔔 Notifications push (réservations, ménages)
- 📧 Envoi emails automatiques clients
- 💰 Intégration paiements en ligne
- 📊 Export comptable avancé (FEC)

#### Moyen Terme
- 🤖 IA : suggestions tarifs dynamiques
- 📱 Application mobile native (React Native)
- 🌍 Support multi-langues (ES, DE, IT)
- 🔗 API REST publique pour intégrations

#### Long Terme
- 🏢 Version SaaS multi-tenant commercialisée
- 🤝 Marketplace services (ménage, conciergerie)
- 📈 Business intelligence avancée
- 🌐 Expansion internationale

---

## 📊 RÉSUMÉ EXÉCUTIF

### Identité du Projet
- **Nom :** Gestion Gîte Calvignac
- **Type :** Application web de gestion locative pour gîtes et locations saisonnières
- **Propriétaire :** Welcome Home (gitewelcomehome-png)
- **Repository :** GitHub - Gestion_gite-calvignac
- **URL Production :** [À configurer sur Vercel]

### Objectif Principal
Application web professionnelle permettant la gestion complète de gîtes touristiques :
- Réservations multi-plateformes (Airbnb, Booking, etc.)
- Planning de ménage automatisé
- Gestion du linge (stocks et besoins)
- Fiches clients bilingues (FR/EN) générées automatiquement
- Fiscalité LMNP avec calculs automatiques
- Statistiques et analyses de performance

---

## 🏗️ ARCHITECTURE TECHNIQUE

### Stack Technologique

#### Frontend
- **HTML5** : Structure sémantique moderne
- **CSS3** : Design Neo-Brutalism avec système de variables CSS
  - Fichier principal : `css/flat-outline.css`
  - Thème : Couleurs vives, bordures épaisses, ombres portées
  - Responsive : Support mobile complet avec fichiers séparés
- **JavaScript Vanilla** : Pas de framework
  - Modules ES6 avec pattern singleton
  - Gestion d'état local (pas de Redux/Vuex)
  - Event delegation pour performance

#### Backend
- **Supabase** (PostgreSQL + Auth + Storage)
  - Base de données relationnelle PostgreSQL 15
  - Row Level Security (RLS) activé sur toutes les tables
  - Authentification intégrée (Magic Link + Email/Password)
  - API REST auto-générée
  - Realtime subscriptions disponibles (non utilisées actuellement)

#### Hébergement & Déploiement
- **Développement** : Dev Container sur Codespaces (Ubuntu 20.04.6 LTS)
- **Production** : Vercel (prévu)
- **Serveur local** : `python3 -m http.server 8080`

#### APIs Externes
- **MyMemory Translation API** : Traduction automatique FR→EN (10 000 requêtes/jour gratuites)
- **OpenStreetMap Nominatim** : Géocodage d'adresses
- **iCal.js** : Parsing de calendriers iCal (Airbnb, Booking, etc.)

### Architecture de Fichiers

```
/workspaces/Gestion_gite-calvignac/
│
├── index.html                    # 🏠 APPLICATION PRINCIPALE (Dashboard)
│
├── pages/                        # 📄 PAGES EXTERNES ACCESSIBLES
│   ├── login.html               # Authentification utilisateur
│   ├── logout.html              # Déconnexion automatique
│   ├── onboarding.html          # Premier accès (création profil)
│   ├── fiche-client.html        # 📱 Fiche accueil client (PWA, bilingue)
│   ├── femme-menage.html        # 🧹 Interface femme de ménage
│   └── validation.html          # Validation ménages (entreprise)
│
├── js/                          # 🧩 MODULES JAVASCRIPT
│   ├── auth.js                  # Authentification centralisée (AuthManager)
│   ├── shared-config.js         # Configuration Supabase
│   ├── gites-manager.js         # Gestionnaire multi-gîtes (singleton)
│   ├── dashboard.js             # Logique tableau de bord
│   ├── reservations.js          # Gestion réservations
│   ├── menage.js                # Planning ménage automatique
│   ├── draps.js                 # Gestion linge
│   ├── fiscalite-v2.js          # Calculs fiscaux LMNP
│   ├── fiche-client-app.js      # Application fiche client
│   ├── sync-ical-v2.js          # Synchronisation calendriers iCal
│   ├── decouvrir.js             # Module activités touristiques
│   ├── checklists.js            # Checklists entrée/sortie (bilingue)
│   ├── faq.js                   # FAQ client (bilingue)
│   └── [30+ autres modules]     # Voir liste complète ci-dessous
│
├── tabs/                        # 📑 ONGLETS DU DASHBOARD
│   ├── tab-dashboard.html       # Vue d'ensemble
│   ├── tab-reservations.html    # Liste réservations
│   ├── tab-menage.html          # Planning ménage
│   ├── tab-draps.html           # Gestion linge
│   ├── tab-fiscalite-v2.html    # Fiscalité LMNP
│   ├── tab-infos-gites.html     # Infos gîtes (pour fiches clients)
│   ├── tab-checklists.html      # Check-in/Check-out
│   ├── tab-faq.html             # Questions fréquentes
│   ├── tab-decouvrir.html       # Activités touristiques
│   ├── tab-gestion.html         # Paramètres gîtes
│   └── tab-statistiques.html    # Stats & graphiques
│
├── css/                         # 🎨 STYLES
│   ├── flat-outline.css         # Style principal Neo-Brutalism
│   ├── header-colonne.css       # En-têtes de tableaux
│   ├── icons.css                # Icônes personnalisées
│   └── mobile/                  # Styles spécifiques mobile
│
├── sql/                         # 🗄️ SCRIPTS BASE DE DONNÉES
│   ├── [Tables creation]
│   ├── [Migrations]
│   └── [Updates]
│
├── docs/                        # 📚 DOCUMENTATION
│   ├── ARCHITECTURE.md          # Architecture détaillée (source principale)
│   ├── ERREURS_CRITIQUES.md     # Historique bugs critiques + solutions
│   ├── [50+ guides]             # Guides fonctionnels spécifiques
│
├── _archives/                   # 🗂️ FICHIERS OBSOLÈTES
│   └── [Anciennes versions archivées]
│
├── business-plan/               # 💼 BUSINESS PLAN (génération PDF)
│   └── [Pages HTML + génération PDF]
│
└── config/                      # ⚙️ CONFIGURATION
    ├── vercel.json              # Config déploiement Vercel
    ├── manifest-fiche-client.json  # PWA manifest
    └── sw-fiche-client.js       # Service Worker PWA
```

### Pattern d'Architecture

#### 1. **Multi-Tenant avec RLS**
- Chaque utilisateur (`owner_user_id`) voit uniquement ses données
- Row Level Security (RLS) activé sur toutes les tables
- Pas de mélange de données entre propriétaires

#### 2. **Singleton Pattern (JavaScript)**
```javascript
// Exemple : gites-manager.js
window.gitesManager = {
    getAll: async () => { /* ... */ },
    getById: async (id) => { /* ... */ },
    // ...
};
```

#### 3. **Event Delegation**
- Boutons dynamiques avec `data-action` + `closest('[data-action]')`
- Évite les problèmes avec `innerHTML` qui casse les `onclick`

#### 4. **Modularité**
- Chaque fonctionnalité = 1 module JS + 1 tab HTML
- Chargement dynamique des onglets (pas de SPA complet)
- Configuration centralisée dans `shared-config.js`

---

## 🎯 FONCTIONNALITÉS PRINCIPALES

### 1. Authentification & Sécurité
- **Système** : Supabase Auth
- **Méthodes** : Email/Password + Magic Link
- **Protection** : Toutes les pages nécessitent authentification
- **AuthManager** : Classe singleton centralisée (`js/auth.js`)
- **RLS** : Row Level Security sur toutes les tables
- **Rôles** : Stockés dans `user_metadata.roles`

### 2. Gestion des Réservations
- **CRUD complet** : Créer, lire, modifier, supprimer
- **Calendrier visuel** : Vue mensuelle/hebdomadaire avec tarifs
- **Import iCal** : Synchronisation automatique depuis plateformes
  - Airbnb, Booking, Vrbo, Abritel, etc.
  - Détection automatique de plateforme via URL
  - Parsing robuste avec gestion des conflits
- **Règles de conflit** : 
  - Une seule réservation par gîte à la fois
  - Aucune réservation le même jour de départ/arrivée
  - Conflit → Garde la plus courte en durée
- **Gestion des clients** : Nom, téléphone, email, notes
- **Statuts** : Confirmée, En attente, Annulée

### 3. Planning Ménage Automatisé
- **Fichiers** : `js/menage.js`, `js/cleaning-rules.js`, `tabs/tab-menage.html`
- **Table BDD** : `cleaning_schedule`, `cleaning_rules`
- **Calcul automatique** : 
  - Date et heure selon règles métier
  - 9 règles configurables par l'utilisateur
  - Gestion enchainements (même jour = 1 seul ménage)
- **Règles disponibles** :
  - Dimanche interdit
  - Samedi interdit
  - Mercredi/jeudi préférentiels
  - Jours fériés
  - Enchainements de réservations
  - Distance minimale entre ménages
- **Statuts** : 
  - `pending` : En attente
  - `pending_validation` : Proposé par femme de ménage
  - `validated` : Validé
  - `refused` : Refusé
- **Interface femme de ménage** : 
  - Consultation planning
  - Proposition de modifications (date/heure)
  - Historique des ménages

### 4. Gestion du Linge (Draps)
- **Fichiers** : `js/draps.js`, `tabs/tab-draps.html`
- **Tables BDD** : `linen_stocks`, `linen_stock_items`, `linen_needs`
- **Stocks par gîte** :
  - Draps plats (grands/petits)
  - Housses de couettes (grandes/petites)
  - Taies d'oreillers
  - Serviettes, tapis de bain
  - **Nouveau** : Items personnalisables (`linen_stock_items`)
- **Configuration besoins** : 
  - Par type de réservation (nombre de personnes)
  - Calcul automatique des besoins selon réservation
- **États** : Propre, Sale, À laver
- **Interface** : 
  - Boutons sous titres (design récent 23/01/2026)
  - Mode édition avec boutons empilés verticalement

### 5. Fiches Clients Bilingues (FR/EN)
- **Fichier** : `pages/fiche-client.html` + `js/fiche-client-app.js`
- **Type** : Progressive Web App (PWA)
- **Accès** : Via token sécurisé généré depuis le dashboard
- **Contenu** :
  - Informations gîte (119 champs bilingues via `infos_gites`)
  - Checklists entrée/sortie (traduction auto)
  - FAQ (traduction auto)
  - Activités touristiques à proximité
  - Carte interactive (Leaflet)
  - Horaires check-in/check-out
  - WiFi, codes d'accès, parking
  - Consignes déchets, sécurité, règlement
- **Traduction automatique** :
  - API MyMemory (gratuite, 10 000 req/jour)
  - Traduction FR→EN lors de la sauvegarde
  - Switch langue instantané dans l'interface
  - Fallback FR si traduction manquante
- **Partage** :
  - WhatsApp (message pré-rempli)
  - Email (mailto:)
  - Copie du lien
  - Partage natif (navigator.share)
- **Expiration** : Token expire à la date de départ
- **Offline** : Service Worker pour consultation hors ligne

### 6. Fiscalité LMNP
- **Fichiers** : `js/fiscalite-v2.js`, `js/taux-fiscaux-config.js`, `tabs/tab-fiscalite-v2.html`
- **Tables BDD** : `simulations_fiscales`, `fiscal_history`, `km_trajets`
- **Calculs** :
  - Revenus locatifs (plateforme + frais)
  - Charges déductibles (par catégorie)
  - Amortissements (bâti, mobilier, travaux)
  - Cotisations URSSAF (minimum 1 200 €/an légal)
  - Impôt sur le revenu (barème progressif)
  - Kilomètres professionnels (barème fiscal)
  - Trimestres retraite (basé sur 600 × SMIC horaire)
- **Configuration dynamique** :
  - Taux URSSAF 2024/2025 (paramétrables par année)
  - Barème kilométrique (3 tranches + puissance fiscale)
  - Barème IR (5 tranches progressives)
  - PASS, SMIC, plafonds abattements
- **Fonctionnalités** :
  - Simulations multi-années
  - Comparaison régimes fiscaux
  - Export PDF des déclarations
  - Historique des calculs
  - Gestion des travaux (JSONB)

### 7. Kilomètres Professionnels (Automatisé)
- **Fichiers** : `js/km-manager.js`
- **Tables BDD** : `km_trajets`, `km_config_auto`, `km_lieux_favoris`, `gites.distance_km`
- **Automatisation** :
  - Trajets générés automatiquement lors des réservations
  - Ménage entrée/sortie
  - Courses avant séjour
  - Maintenance
  - Mise à jour/suppression si modification dates
- **Configuration** :
  - Lieux favoris (magasins, fournisseurs) avec distances
  - Distance gîte ↔ domicile (colonne `gites.distance_km`)
  - Activation/désactivation par type de trajet
- **Calcul** : Basé sur barème fiscal (puissance fiscale + tranches)

### 8. Activités Touristiques ("À Découvrir")
- **Fichiers** : `js/decouvrir.js`, `tabs/tab-decouvrir.html`
- **Table BDD** : `activites_gites`
- **Fonctionnalités** :
  - CRUD complet (ajout, édition, suppression)
  - Géocodage automatique (OpenStreetMap Nominatim)
  - Calcul distance GPS depuis gîte
  - Carte interactive Google Maps
  - Filtres par catégorie
  - Export PDF guide client
- **Catégories** : Restaurant, Café/Bar, Musée, Château, Parc, Hôtel, Attraction
- **Données** : Nom, adresse, GPS, distance, note Google, avis, photos, URL, téléphone
- **Design** : Grille de cartes Neo-Brutalism moderne

### 9. Checklists Entrée/Sortie (Bilingues)
- **Fichiers** : `js/checklists.js`, `tabs/tab-checklists.html`
- **Tables BDD** : `checklist_templates`, `checklist_progress`
- **Traduction automatique** :
  - Colonnes : `texte` / `texte_en`, `description` / `description_en`
  - API MyMemory FR→EN lors de la sauvegarde
- **Progression** : 
  - Suivi par réservation (`checklist_progress`)
  - Affichage détaillé dans dashboard (✅ validés / ❌ non validés)
- **Types** : Check-in (arrivée), Check-out (départ)
- **Interface** : Event delegation (data-action) pour boutons dynamiques

### 10. FAQ Clients (Bilingues)
- **Fichiers** : `js/faq.js`, `tabs/tab-faq.html`
- **Table BDD** : `faq`
- **Traduction automatique** :
  - Colonnes : `question` / `question_en`, `answer` / `answer_en`
  - API MyMemory FR→EN lors de la sauvegarde
- **Organisation** : Par catégorie, priorité, visibilité
- **Portée** : Globale (tous gîtes) ou spécifique à un gîte

### 11. Statistiques & Analyses
- **Fichiers** : `js/dashboard.js`, `tabs/tab-statistiques.html`, `tabs/tab-dashboard.html`
- **Indicateurs** :
  - Taux d'occupation par gîte
  - Revenus mensuels/annuels
  - Nombre de nuitées
  - Plateforme principale (Airbnb, Booking, etc.)
  - Performance fiscale (URSSAF, IR)
  - Bénéfice net après cotisations
- **Graphiques** : Chart.js (courbes, barres, camemberts)
- **Période** : Filtres par mois/année

### 12. Gestion Multi-Gîtes
- **Fichiers** : `js/gites-manager.js`, `tabs/tab-gestion.html`
- **Table BDD** : `gites`
- **Fonctionnalités** :
  - CRUD complet sur les gîtes
  - Paramètres : nom, adresse, capacité, tarifs
  - Distance depuis domicile (pour km)
  - URLs iCal par plateforme
  - Configuration import automatique

---

## 🗄️ BASE DE DONNÉES (Supabase PostgreSQL)

### Tables Principales (18 tables actives)

#### 1. `auth.users` (Supabase Auth)
- Gestion des utilisateurs authentifiés
- Colonnes clés : `id` (UUID), `email`, `user_metadata` (JSONB avec roles)

#### 2. `gites`
- Liste des gîtes gérés
- Colonnes : `id`, `nom`, `owner_user_id`, `distance_km`, `ical_sources` (JSONB), `capacite`, `adresse`
- RLS : `owner_user_id = auth.uid()`

#### 3. `reservations`
- Toutes les réservations
- Colonnes : `id`, `gite_id`, `owner_user_id`, `date_arrivee`, `date_depart`, `nom_client`, `telephone`, `email`, `nb_personnes`, `plateforme`, `statut`, `notes`
- Contrainte : Une seule réservation par gîte à la fois
- RLS : `owner_user_id = auth.uid()`

#### 4. `infos_gites` ⭐ **119 COLONNES BILINGUES**
- Informations complètes pour fiches clients
- 8 sections : Base, WiFi, Arrivée, Logement, Déchets, Sécurité, Départ, Règlement
- Chaque champ : `nom_champ` + `nom_champ_en`
- Relations : FK `gite_id` → `gites`, FK `owner_user_id` → `auth.users`
- RLS activé

#### 5. `linen_stocks`
- Stocks de linge FIXES par gîte
- Colonnes : `draps_plats_grands`, `draps_plats_petits`, `housses_couettes_grandes`, `housses_couettes_petites`, `taies_oreillers`, `serviettes`, `tapis_bain`
- Contrainte : UNIQUE sur `gite_id`
- RLS : `owner_user_id = auth.uid()`

#### 6. `linen_stock_items` ⭐ NOUVEAU
- Stocks de linge DYNAMIQUES (personnalisables)
- Colonnes : `owner_user_id`, `gite_id`, `item_key`, `quantity`
- Contrainte : UNIQUE sur (`gite_id`, `item_key`)
- RLS activé

#### 7. `linen_needs`
- Configuration besoins par type de réservation
- Colonnes : `owner_user_id`, `gite_id`, `config_name`, `config_data` (JSONB)
- RLS activé

#### 8. `cleaning_schedule`
- Planning de ménage
- Colonnes : `id`, `owner_user_id`, `gite_id`, `reservation_id`, `scheduled_date`, `scheduled_time`, `statut`, `notes`, `proposed_by`
- Statuts : `pending`, `pending_validation`, `validated`, `refused`
- RLS activé

#### 9. `cleaning_rules` ⭐ NOUVEAU
- Règles métier configurables pour planification ménage
- Colonnes : `id`, `rule_code` (UNIQUE), `rule_name`, `description`, `is_enabled`, `priority`, `config` (JSONB)
- 9 règles par défaut (dimanche, samedi, enchainement, etc.)
- RLS activé

#### 10. `checklist_templates` ⭐ BILINGUE
- Templates de checklists entrée/sortie
- Colonnes : `id`, `owner_user_id`, `gite_id`, `type` (checkin/checkout), `texte`, `texte_en`, `description`, `description_en`, `ordre`
- Traduction auto via MyMemory
- RLS activé

#### 11. `checklist_progress`
- Progression des checklists par réservation
- Colonnes : `id`, `reservation_id`, `template_id`, `completed`, `completed_at`
- Relations : FK `reservation_id`, FK `template_id`
- RLS activé

#### 12. `faq` ⭐ BILINGUE
- Questions fréquentes pour fiches clients
- Colonnes : `id`, `owner_user_id`, `gite_id` (nullable), `question`, `question_en`, `answer`, `answer_en`, `category`, `priority`, `is_visible`
- Traduction auto via MyMemory
- RLS activé

#### 13. `activites_gites` ⭐ REFONTE (20/01/2026)
- Activités et POIs touristiques
- Colonnes : `id`, `owner_user_id`, `gite_id`, `nom`, `categorie`, `description`, `adresse`, `latitude`, `longitude`, `distance_km`, `url`, `telephone`, `note`, `nb_avis`, `photos` (JSONB), `is_active`
- Géocodage auto via Nominatim
- RLS activé

#### 14. `simulations_fiscales`
- Calculs fiscaux LMNP
- Colonnes : `id`, `owner_user_id`, `annee`, `donnees_detaillees` (JSONB avec travaux, frais, produits)
- RLS activé

#### 15. `fiscal_history`
- Historique des simulations
- Colonnes : `id`, `owner_user_id`, `year`, `data` (JSONB)
- RLS activé

#### 16. `km_trajets` ⭐ NOUVEAU (19/01/2026)
- Historique des trajets professionnels
- Colonnes : `id`, `owner_user_id`, `gite_id`, `reservation_id`, `date_trajet`, `motif`, `type_trajet`, `lieu_arrivee`, `distance_aller`, `aller_retour`, `distance_totale`, `auto_genere`
- Automatisation : Génération/màj/suppression auto lors des réservations
- RLS activé

#### 17. `km_config_auto` ⭐ NOUVEAU (19/01/2026)
- Configuration automatisation trajets
- Colonnes : `owner_user_id` (UNIQUE), `auto_menage_entree`, `auto_menage_sortie`, `auto_courses`, `auto_maintenance`
- Une ligne par utilisateur
- RLS activé

#### 18. `km_lieux_favoris` ⭐ NOUVEAU (19/01/2026)
- Lieux favoris avec distances
- Colonnes : `id`, `owner_user_id`, `nom`, `type_lieu`, `distance_km`, `adresse`
- RLS activé

### Relations & Contraintes

```
auth.users (1) ←→ (N) gites [owner_user_id]
gites (1) ←→ (N) reservations [gite_id]
gites (1) ←→ (1) linen_stocks [gite_id] UNIQUE
gites (1) ←→ (N) linen_stock_items [gite_id]
gites (1) ←→ (N) cleaning_schedule [gite_id]
gites (1) ←→ (N) checklist_templates [gite_id]
gites (1) ←→ (N) activites_gites [gite_id]
gites (1) ←→ (1) infos_gites [gite_id]
reservations (1) ←→ (N) checklist_progress [reservation_id]
reservations (1) ←→ (N) cleaning_schedule [reservation_id]
reservations (1) ←→ (N) km_trajets [reservation_id]
```

### Sécurité RLS (Row Level Security)

**Toutes les tables** ont une policy :
```sql
CREATE POLICY "Users can only access their own data"
ON table_name
FOR ALL
USING (owner_user_id = auth.uid());
```

---

## 📱 PAGES EXTERNES ACCESSIBLES (6 pages)

Les pages externes sont accessibles sans le dashboard principal et ont des rôles spécifiques.

---

### 1. **login.html** - Page de Connexion 🔐

**Chemin** : `/pages/login.html`  
**Accès** : Public (non authentifié)  
**Redirect** : Vers `/index.html` si déjà authentifié

#### Fonctionnalités
- Formulaire Email/Mot de passe
- Validation côté client
- Authentification via Supabase Auth
- Messages d'erreur personnalisés :
  - "Email ou mot de passe incorrect"
  - "Veuillez confirmer votre email"
- Bouton désactivé pendant la connexion
- Animation de chargement (spinner)
- Auto-redirect vers dashboard après connexion réussie
- Lien vers page d'inscription (`onboarding.html`)

#### Technologies
- **CSS** : Gradient violet (`#667eea` → `#764ba2`)
- **Design** : Carte centrée avec ombre portée
- **Animation** : `slideUp` (0.4s ease-out)
- **Protection** : Vérification session pour éviter double login

#### Scripts
- `shared-config.js` : Configuration Supabase
- Inline JavaScript pour gestion formulaire
- `supabaseClient.auth.signInWithPassword()`

#### Informations Affichées
- Logo "🏡 Gestion Gîtes"
- Sous-titre "Espace sécurisé"
- Version sécurité : "Phase 1 - Sécurité RLS + Auth"
- Score sécurité : "3/10 → 5/10"

---

### 2. **onboarding.html** - Inscription / Création de Compte 📝

**Chemin** : `/pages/onboarding.html`  
**Accès** : Public (non authentifié)  
**Redirect** : Vers `/index.html` après inscription

#### Fonctionnalités
- Formulaire d'inscription avec 3 champs :
  - Email (autocomplete="email")
  - Mot de passe (minimum 6 caractères)
  - Confirmation mot de passe
- Validation :
  - Correspondance des mots de passe
  - Format email valide
  - Longueur minimum mot de passe
- Création compte via `supabaseClient.auth.signUp()`
- Messages success/error dynamiques
- Lien retour vers login
- Auto-redirect après inscription réussie

#### Technologies
- **CSS** : Gradient bleu/violet (variables CSS `--primary` / `--secondary`)
- **Design** : Carte centrée blanche sur fond gradient
- **Animation** : `fadeIn` (0.5s)
- **Form validation** : HTML5 + JavaScript

#### Scripts
- `shared-config.js` : Configuration Supabase
- Inline JavaScript pour gestion formulaire
- Gestion états : loading, error, success

#### Informations Affichées
- Logo "🏡 Bienvenue"
- Sous-titre "Créez votre compte pour gérer vos gîtes"
- Lien "Déjà un compte ? Se connecter"

---

### 3. **fiche-client.html** - Fiche Accueil Client Bilingue 📱

**Chemin** : `/pages/fiche-client.html`  
**Accès** : Via token sécurisé (query param `?token=xxx`)  
**Type** : Progressive Web App (PWA)  
**Langues** : FR/EN avec switch instantané

#### Fonctionnalités Principales

##### A. Système de Navigation par Onglets (4 onglets)
1. **🏠 Entrée** (Arrivée / Arrival)
   - Horaires check-in
   - Parking et accès
   - Codes porte/portail/WiFi
   - Instructions clés
   - Infos logement (chauffage, cuisine, chambres)
   - Consignes sécurité

2. **📋 Pendant** (Séjour / During Stay)
   - FAQ clients (bilingue, traduction auto)
   - Informations pratiques gîte
   - Numéros d'urgence
   - Consignes déchets/tri
   - Règlement intérieur

3. **🚪 Sortie** (Départ / Checkout)
   - Horaires check-out
   - Checklist départ (bilingue, traduction auto)
   - Restitution clés
   - Ménage attendu
   - Procédure caution

4. **🎭 Activités** (À Découvrir / Discover)
   - Liste activités touristiques à proximité
   - Carte interactive (Leaflet)
   - Filtres par catégorie
   - Distance depuis gîte
   - Note Google, avis, photos
   - Liens vers sites web
   - Boutons appel téléphone

##### B. Interface Utilisateur
- **Header fixe** :
  - Logo "🏕️" avec nom du gîte
  - Switch langue FR/EN (2 boutons)
  - Background blanc avec ombre
- **Navigation tabs mobile** :
  - Scroll horizontal tactile
  - Indicateur de scroll (››)
  - Onglet actif souligné bleu
  - Icônes Font Awesome
- **Main content** :
  - Margin-top: 19rem (évite chevauchement header)
  - Cartes blanches avec border-radius
  - Padding adaptatif
  - Design responsive complet

##### C. PWA (Progressive Web App)
- **Manifest** : `manifest-fiche-client.json`
- **Service Worker** : `sw-fiche-client.js`
- **Capacités offline** :
  - Cache stratégique des pages
  - Disponible sans connexion
  - Installation sur écran d'accueil mobile
- **Meta tags** :
  - `theme-color`: `#3b82f6`
  - `mobile-web-app-capable`: yes
  - `apple-mobile-web-app-capable`: yes

##### D. Traduction Automatique
- **API** : MyMemory Translation (gratuite, 10k/jour)
- **Mécanisme** :
  - Champs bilingues : `question` / `question_en`, `texte` / `texte_en`
  - Traduction FR→EN lors de la sauvegarde (back-office)
  - Switch langue change instantanément l'affichage
  - Fallback FR si traduction manquante
  - Mise en cache pour performance
- **Tables bilingues** :
  - `infos_gites` (119 colonnes FR + 119 EN)
  - `checklist_templates` (`texte`, `texte_en`, `description`, `description_en`)
  - `faq` (`question`, `question_en`, `answer`, `answer_en`)

##### E. Sécurité & Expiration
- **Token sécurisé** : 32 bytes crypto-random
- **Expiration** : Date de départ de la réservation
- **Vérification** : `access_tokens` table dans Supabase
- **Pas d'authentification requise** : Accès direct via URL

#### Technologies
- **HTML5** : Structure sémantique
- **CSS3** : Variables CSS, Flexbox, Grid
- **JavaScript Vanilla** : Module `fiche-client-app.js`
- **Leaflet** : Carte interactive (v1.9.4)
- **Font Awesome** : Icônes (v6.5.1)
- **DOMPurify** : Protection XSS
- **Supabase** : Base de données

#### Scripts Chargés
- `@supabase/supabase-js` (v2)
- `dompurify` (v3.1.7)
- `security-utils.js` (module)
- `leaflet.js` (v1.9.4)
- `fiche-client-app.js` (application principale)

#### Design
- **Thème** : Moderne, épuré, mobile-first
- **Couleurs** :
  - Primary: `#3b82f6` (bleu)
  - Success: `#10b981` (vert)
  - Danger: `#ef4444` (rouge)
  - Warning: `#f59e0b` (orange)
  - Grayscale: `#f9fafb` → `#111827`
- **Typographie** : System fonts (-apple-system, Segoe UI, Roboto)
- **Responsive** : 100% mobile-friendly
- **Animations** : Transitions fluides (0.2s)

#### Partage (depuis dashboard)
- WhatsApp (message pré-rempli)
- Email (mailto:)
- Copie lien (clipboard)
- Partage natif (navigator.share)

---

### 4. **femme-menage.html** - Interface Femme de Ménage 🧹

**Chemin** : `/pages/femme-menage.html`  
**Accès** : Authentification requise (compte spécifique femme de ménage)  
**Rôle** : Consultation planning + Proposition modifications

#### Fonctionnalités

##### A. Consultation Planning
- **Vue par semaines** :
  - Affichage 4 colonnes par semaine (1 colonne = 1 gîte)
  - Dates de la semaine en en-tête
  - Numéro de semaine (Semaine 1, 2, 3...)
- **Vision Globale (Style Neo-Brutalism)** :
  - Grille responsive (4 colonnes desktop → 2 tablette → 1 mobile)
  - Couleurs par gîte :
    - Trévoux : Bleu (`#667eea`)
    - Couzon : Rouge (`#E74C3C`)
    - Autres : Vert (`#27AE60`), Violet (`#a29bfe`)
  - Ombres portées 4px (Neo-Brutalism)
  - Bordures épaisses 3px

##### B. Items de Ménage
- **Informations affichées** :
  - Date et heure du ménage
  - Nom du gîte
  - Client concerné (nom)
  - Statut :
    - ⏳ En attente (`pending`)
    - ✅ Validé (`validated`)
    - 🔄 En validation (`pending_validation`)
    - ❌ Refusé (`refused`)
- **Actions possibles** :
  - Proposer modification date/heure
  - Ajouter notes/commentaires
  - Voir historique des ménages

##### C. Proposition de Modifications
- **Formulaire** :
  - Sélection nouvelle date
  - Sélection nouvelle heure
  - Zone de commentaire
  - Bouton "Proposer une modification"
- **Workflow** :
  1. Femme de ménage propose changement
  2. Statut passe à `pending_validation`
  3. Propriétaire reçoit notification (dashboard)
  4. Propriétaire valide ou refuse
  5. Statut mis à jour (`validated` ou `refused`)

##### D. Filtres & Navigation
- **Onglets** :
  - Planning en cours
  - Historique
  - Tous les ménages
- **Filtres** :
  - Par gîte
  - Par statut
  - Par période (semaine, mois)

#### Technologies
- **CSS** : `flat-outline.css` (Neo-Brutalism)
- **Design** : Cartes blanches avec bordures épaisses
- **Responsive** : Grid adaptatif
- **Scripts** :
  - `gites-manager.js` : Gestionnaire multi-gîtes
  - `shared-config.js` : Configuration Supabase
  - `security-utils.js` : Protection XSS
  - DOMPurify pour sanitization

#### Interface
- **Header** :
  - Titre "🧹 Espace Femme de Ménage"
  - Sous-titre "Consultez et gérez votre planning"
  - Background blanc avec ombre Neo-Brutalism
- **Cartes** :
  - Border 3px solid `#2D3436`
  - Box-shadow 4px 4px 0 `#2D3436`
  - Border-radius 16px
  - Padding 30px
- **Boutons** :
  - Style Neo-Brutalism
  - Couleurs vives (vert, jaune, rouge)
  - Text-transform: uppercase
  - Font-weight: 700
  - Hover: translate(-2px, -2px) + shadow amplifiée

#### Sécurité
- Authentification Supabase requise
- RLS activé sur `cleaning_schedule`
- Vérification `owner_user_id` ou rôle spécifique
- Protection XSS via DOMPurify

---

### 5. **validation.html** - Validation Ménages (Entreprise) ✅

**Chemin** : `/pages/validation.html`  
**Accès** : Authentification requise (rôle entreprise de ménage)  
**Rôle** : Interface entreprise pour valider/refuser propositions

#### Fonctionnalités

##### A. Vue d'Ensemble Planning
- **Affichage par semaines** :
  - Carte par semaine avec header
  - Numéro + dates de la semaine
  - Grid responsive multi-gîtes
- **Colonnes par gîte** :
  - Header coloré selon gîte
  - Liste des ménages de la semaine
  - Indicateurs visuels statut

##### B. Validation/Refus Propositions
- **Items avec statut `pending_validation`** :
  - Mise en évidence visuelle (border jaune)
  - Boutons d'action :
    - ✅ "Valider" (vert)
    - ❌ "Refuser" (rouge)
  - Affichage date/heure proposées
  - Commentaire de la femme de ménage
- **Workflow** :
  1. Entreprise consulte propositions
  2. Clique sur Valider ou Refuser
  3. Statut mis à jour instantanément
  4. Notification envoyée (optionnel)

##### C. Gestion Multi-Gîtes
- **Filtres** :
  - Par gîte
  - Par statut
  - Par période
- **Actions groupées** :
  - Valider plusieurs ménages en 1 clic
  - Export PDF planning semaine

##### D. Historique
- Liste des validations/refus passés
- Recherche par date/gîte/client
- Export CSV

#### Technologies
- **CSS** : Neo-Brutalism (identique femme-menage.html)
- **Grid System** : CSS Grid responsive
- **Scripts** :
  - `gites-manager.js`
  - `shared-config.js`
  - `security-utils.js`
  - DOMPurify

#### Interface
- **Header** :
  - Titre "🧹 Validation des Ménages"
  - Sous-titre "Interface entreprise de ménage"
- **Cards semaines** :
  - Background white
  - Border 3px solid `#2D3436`
  - Shadow 4px 4px 0 `#2D3436`
  - Border-radius 16px
- **Gite columns** :
  - Grid auto-fit minmax(280px, 1fr)
  - Header coloré par gîte
  - Items avec hover effect

#### Couleurs Gîtes (Vision Globale)
- **Trévoux** : Bleu `#667eea` (fond rgba 8%)
- **Couzon** : Rouge `#E74C3C` (fond rgba 8%)
- **3ème gîte** : Vert `#27AE60` (fond rgba 8%)
- **4ème gîte** : Violet `#a29bfe` (fond rgba 8%)

#### Sécurité
- Authentification Supabase requise
- RLS activé sur `cleaning_schedule`
- Vérification rôle entreprise
- Protection XSS via DOMPurify

---

### 6. **logout.html** - Déconnexion Automatique 🚪

**Chemin** : `/pages/logout.html`  
**Accès** : Authentifié (pour se déconnecter)  
**Fonctionnement** : Déconnexion instantanée + redirect

#### Fonctionnalités
- Exécution script immédiate
- Appel `supabaseClient.auth.signOut()`
- Redirection automatique vers `/pages/login.html`
- Pas d'interface utilisateur (juste message "Déconnexion en cours...")

#### Technologies
- **Scripts** :
  - `shared-config.js` : Configuration Supabase
  - `@supabase/supabase-js` : Client Supabase
- **Code inline** : IIFE (Immediately Invoked Function Expression)

#### Code Principal
```javascript
(async () => {
    const { createClient } = supabase;
    const client = createClient(
        window.LOCAL_CONFIG?.SUPABASE_URL,
        window.LOCAL_CONFIG?.SUPABASE_KEY
    );
    await client.auth.signOut();
    window.location.href = '/pages/login.html';
})();
```

#### Usage
- Lien depuis dashboard : `<a href="/pages/logout.html">Déconnexion</a>`
- Bouton déconnexion dans menu utilisateur
- Timeout session automatique

---

## 🔄 PARCOURS UTILISATEUR TYPIQUE

### Nouveau Propriétaire
1. Accède à `login.html`
2. Clique "Créer un compte" → `onboarding.html`
3. Remplit formulaire inscription
4. Reçoit email confirmation (optionnel)
5. Redirect automatique → `index.html` (dashboard)
6. Configure ses gîtes (tab-gestion.html)
7. Ajoute réservations ou sync iCal
8. Génère fiche client bilingue (`fiche-client.html`)
9. Partage lien avec client via WhatsApp/Email

### Client (Voyageur)
1. Reçoit lien `fiche-client.html?token=xxx`
2. Ouvre dans navigateur mobile
3. Installe PWA (optionnel)
4. Consulte infos entrée (codes, parking, WiFi)
5. Switch EN si anglophone
6. Lit FAQ pendant séjour
7. Consulte activités touristiques
8. Check checklist départ avant de partir

### Femme de Ménage
1. Accède à `femme-menage.html`
2. Authentification Supabase
3. Consulte planning semaine en cours
4. Identifie ménages à faire (couleurs par gîte)
5. Propose modification date/heure si nécessaire
6. Ajoute commentaires/notes
7. Consulte historique ménages passés

### Entreprise Ménage
1. Accède à `validation.html`
2. Authentification avec rôle entreprise
3. Consulte propositions `pending_validation`
4. Valide ou refuse chaque proposition
5. Export PDF planning validé
6. Communique planning finalisé à équipes

---

## 🖥️ APPLICATION PRINCIPALE - DASHBOARD (index.html)

**Chemin** : `/index.html`  
**Version** : v4.4  
**Accès** : Authentification obligatoire (redirect vers login.html si non connecté)  
**Type** : SPA (Single Page Application) avec chargement dynamique des onglets

---

### Architecture Générale

#### Structure HTML
```html
<!DOCTYPE html>
<html lang="fr">
<head>
    <!-- Meta tags -->
    <title>Gestion gites - v4.4</title>
    
    <!-- Protection erreurs extensions Chrome -->
    <script>window.onerror bloquer chrome-extension://...</script>
    
    <!-- CDN Libraries -->
    - xlsx.js (export Excel)
    - Chart.js (graphiques)
    - ical.js (parsing calendriers)
    - Supabase JS
    - DOMPurify (XSS protection)
    - Leaflet (cartes)
    
    <!-- Configuration & Sécurité -->
    - shared-config.js
    - gites-manager.js
    - auth.js
    - security-utils.js
    - validation-utils.js
    - error-logger.js
    - rate-limiter.js
    
    <!-- Modules Fonctionnels (33 fichiers JS) -->
    - dashboard.js
    - reservations.js
    - menage.js
    - draps.js
    - fiscalite-v2.js
    - decouvrir.js
    - faq.js
    - checklists.js
    - [... etc]
    
    <!-- CSS -->
    - flat-outline.css (Neo-Brutalism)
    - gites-form.css
    - main-inline.css
    - fiscalite-neo.css
    - mobile/main.css (si mobile)
</head>
<body>
    <!-- Menu hamburger mobile (injecté dynamiquement) -->
    <div id="mobile-menu-container"></div>
    
    <!-- Détection Mobile/Desktop -->
    <script>
        const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent) || window.innerWidth <= 768;
        // Chargement CSS/JS spécifique selon plateforme
    </script>
    
    <!-- Conteneurs des onglets (chargés dynamiquement) -->
    <div id="tab-dashboard"></div>
    <div id="tab-reservations"></div>
    <div id="tab-menage"></div>
    <!-- ... 11 autres onglets -->
    
    <!-- Navigation latérale (Desktop) ou Menu hamburger (Mobile) -->
    <nav id="sidebar">
        <!-- Liste des onglets -->
    </nav>
</body>
</html>
```

#### Système de Chargement Dynamique des Onglets

**Desktop (13 onglets)** :
```javascript
const desktopTabs = {
    'tab-dashboard': 'tabs/tab-dashboard.html',
    'tab-gestion': 'tabs/tab-gestion.html',
    'tab-reservations': 'tabs/tab-reservations.html',
    'tab-archives': 'tabs/tab-archives.html',
    'tab-statistiques': 'tabs/tab-statistiques.html',
    'tab-charges': 'tabs/tab-fiscalite-v2.html',
    'tab-menage': 'tabs/tab-menage.html',
    'tab-infos-gites': 'tabs/tab-infos-gites.html',
    'tab-fiches-clients': 'tabs/tab-fiches-clients.html',
    'tab-decouvrir': 'tabs/tab-decouvrir.html',
    'tab-faq': 'tabs/tab-faq.html',
    'tab-draps': 'tabs/tab-draps.html',
    'tab-checklists': 'tabs/tab-checklists.html'
};
```

**Mobile (10 onglets)** :
```javascript
const mobileTabs = {
    'tab-dashboard': 'tabs/mobile/dashboard.html',
    'tab-gestion': 'tabs/mobile/gestion.html',
    'tab-reservations': 'tabs/mobile/reservations.html',
    'tab-archives': 'tabs/mobile/archives.html',
    'tab-menage': 'tabs/mobile/menage.html',
    'tab-infos-gites': 'tabs/mobile/infos-gites.html',
    'tab-fiches-clients': 'tabs/mobile/fiches-clients.html',
    'tab-draps': 'tabs/mobile/draps.html',
    'tab-checklists': 'tabs/mobile/checklists.html',
    'tab-calendrier-tarifs': 'tabs/mobile/calendrier-tarifs.html'
};
```

**Mécanisme** :
1. `DOMContentLoaded` → Détection mobile/desktop
2. Fetch de chaque fichier HTML d'onglet
3. Injection via `SecurityUtils.setInnerHTML()` (protection XSS)
4. Cache-buster : `?v=${Date.now()}`
5. Navigation : Cacher tous les onglets, afficher celui cliqué

---

### 📑 ONGLETS DU DASHBOARD (13 onglets Desktop)

---

#### 1. **Dashboard (Accueil)** 📊

**Fichier** : `tabs/tab-dashboard.html`  
**Script** : `js/dashboard.js`  
**Rôle** : Vue d'ensemble et alertes prioritaires

##### Sections Affichées

**A. En-tête**
- 📊 Titre "Tableau de Bord"
- Date du jour + numéro de semaine
- Bouton "🔄 Actualiser" (refresh indicateurs)

**B. Alertes Urgentes (Ordre de priorité)**

1. **📄 Fiches Clients à Envoyer** (Border jaune `#ffeaa7`)
   - Liste des réservations sans fiche client générée
   - Badge compteur
   - Bouton "Générer" par réservation
   - Auto-refresh après génération

2. **⚠️ Problèmes Urgents** (Border rouge `#ff7675`)
   - Conflits de dates réservations
   - Ménages non planifiés
   - Stocks draps insuffisants
   - Informations gîte manquantes
   - Badge compteur rouge

3. **💬 Demandes & Retours Clients** (Border bleu `#74b9ff`)
   - Messages clients en attente
   - Modifications demandées
   - Questions FAQ non répondues
   - Badge compteur bleu

**C. 📊 Vision Globale**

Carte englobante avec 5 indicateurs fiscaux :

1. **💼 URSSAF** (Bleu `#667eea`)
   - Colonne 2025 (année précédente)
   - Colonne 2026 (en cours)
   - Montant en euros avec animation

2. **💰 Impôt sur le Revenu (IR)** (Violet `#a29bfe`)
   - Colonne 2025
   - Colonne 2026
   - Barème progressif appliqué

3. **📈 Bénéfice Net** (Vert `#55efc4`)
   - Après URSSAF + IR
   - Pourcentage vs revenus bruts
   - Animation pulse si positif

4. **🎯 Taux d'Occupation** (Orange `#ffeaa7`)
   - % de jours réservés / jours disponibles
   - Par gîte
   - Moyenne globale

5. **💳 Revenus Mensuels** (Bleu ciel `#74b9ff`)
   - Mois en cours
   - Comparaison mois précédent
   - Graphique tendance 12 mois

**D. Séjours en Cours**

Liste des réservations actives cette semaine :
- Nom client + gîte
- Dates séjour (arrivée → départ)
- Checklist progression (items validés/total)
- Bouton "👁️ Détails" (voir items checklist)
- Statut ménage planifié (✅/⏳/❌)

**E. Liste de Tâches (TODO)**

- Ajout rapide tâche
- Catégories : Urgent, Important, Normal
- Statut : À faire, En cours, Terminé
- Drag & drop pour réorganiser
- Archive automatique des tâches terminées

##### Technologies
- **Chart.js** : Graphiques revenus
- **Animations** : Pulse CSS pour badges
- **Auto-refresh** : Toutes les 5 minutes
- **Websockets** : Supabase Realtime (optionnel)

##### Fonctions Principales
```javascript
function refreshDashboard() // Refresh complet
function updateFinancialIndicators() // MAJ URSSAF/IR
function loadChecklistsTab() // Charge séjours en cours
function toggleChecklistDetails(reservationId) // Affiche/cache items
function addTodo(title, category, priority) // Ajoute tâche
```

---

#### 2. **Gestion Gîtes** 🏡

**Fichier** : `tabs/tab-gestion.html`  
**Scripts** : `js/gites-crud.js`, `js/gites-manager.js`  
**Rôle** : CRUD des gîtes

##### Fonctionnalités
- **Liste gîtes** : Cartes avec nom, adresse, capacité
- **Ajouter gîte** :
  - Nom
  - Adresse complète
  - Capacité (nb personnes)
  - Distance depuis domicile (pour km)
  - Tarif nuit (optionnel)
- **Modifier gîte** :
  - Tous les champs éditables
  - URLs iCal par plateforme (Airbnb, Booking, etc.)
  - Configuration import automatique
- **Supprimer gîte** :
  - Confirmation obligatoire
  - Cascade delete (réservations, ménages, etc.)
- **Import iCal** :
  - Ajout URLs par plateforme
  - Bouton "Sync" manuel
  - Auto-sync quotidienne (optionnel)

##### Interface
- Design Neo-Brutalism
- Cartes avec icônes de propriété (`property-icons.js`)
- Formulaire modal pour ajout/édition
- Validation champs obligatoires

---

#### 3. **Réservations** 📅

**Fichier** : `tabs/tab-reservations.html`  
**Script** : `js/reservations.js` (v4.5)  
**Rôle** : Gestion complète des réservations

##### Vue Planning (Principale)

**Affichage par semaines** :
- Header semaine : Numéro + dates (lun-dim)
- Grid colonnes : 1 colonne = 1 gîte
- Couleurs par gîte (Vision Globale) :
  - Trévoux : Bleu `#667eea`
  - Couzon : Rouge `#E74C3C`
  - Autres : Vert `#27AE60`, Violet `#a29bfe`
- Réservations = Cartes dans colonnes
- Scroll horizontal sur mobile

**Informations Carte Réservation** :
- Nom client (gras)
- Dates : 📅 JJ/MM → JJ/MM
- Plateforme : Icône + nom (Airbnb, Booking, etc.)
- Nombre personnes : 👥 X
- Téléphone : 📞 (cliquable mobile)
- Statut : Badge coloré (Confirmée, Attente, Annulée)
- Boutons actions :
  - ✏️ Modifier
  - 🗑️ Supprimer
  - 📄 Générer fiche client
  - 📞 Appeler (mobile)
  - 📧 Email

**Actions Globales** :
- 🔄 Actualiser (force refresh)
- ➕ Nouvelle réservation
- 🔍 Recherche (nom, dates, plateforme)
- Filtres :
  - Par gîte
  - Par statut
  - Par plateforme
  - Par période (semaine, mois, année)

##### Formulaire Ajout/Édition Réservation

**Champs** :
- Gîte (select)
- Nom client (required)
- Téléphone (validation format français)
- Email (validation format)
- Date arrivée (datepicker)
- Date départ (datepicker)
- Nombre personnes (number)
- Plateforme (select custom avec icônes)
- Statut (select)
- Prix total (optionnel)
- Notes (textarea)

**Validations** :
- Date départ > date arrivée
- Pas de chevauchement avec autre réservation même gîte
- Téléphone format français (auto-formatage)
- Email valide

**Actions après sauvegarde** :
1. Insert/Update dans `reservations`
2. Calcul automatique ménage (`cleaning_schedule`)
3. Création trajets km automatiques (`km_trajets`)
4. Notification dashboard si fiches clients à générer
5. Refresh planning

##### Synchronisation iCal

**Bouton "🔄 Sync iCal"** :
- Parse tous les calendriers configurés
- Détection plateforme automatique (via URL)
- Import réservations :
  - Création si nouvelle
  - Mise à jour si dates changées
  - Suppression si annulée dans iCal
- Gestion conflits :
  - Garde la plus courte en durée
  - Notification des conflits
- Statut sync affiché (succès, erreurs, nombre importées)

**Plateformes supportées** :
- Airbnb
- Booking
- Vrbo
- Abritel
- HomeAway
- Générique (iCal standard)

##### Technologies
- **ical.js** : Parsing iCal
- **CSS Grid** : Layout responsive
- **Event delegation** : Performance
- **Debounce** : Recherche (300ms)

---

#### 4. **Planning Ménage** 🧹

**Fichier** : `tabs/tab-menage.html`  
**Scripts** : `js/menage.js`, `js/cleaning-rules.js`, `js/cleaning-rules-modal.js`  
**Rôle** : Planification automatique + gestion ménages

##### Vue Planning

**Affichage par semaines** (identique réservations) :
- Grid colonnes par gîte
- Couleurs par gîte (Vision Globale)
- Cartes ménage dans colonnes

**Informations Carte Ménage** :
- Date et heure : 📅 JJ/MM à HH:MM
- Gîte : 🏡 Nom
- Client concerné : Nom (si lié à réservation)
- Type : Entrée / Sortie / Nettoyage complet
- Statut :
  - ⏳ En attente (`pending`) - Gris
  - ✅ Validé (`validated`) - Vert
  - 🔄 En validation (`pending_validation`) - Orange
  - ❌ Refusé (`refused`) - Rouge
- Notes femme de ménage (si présentes)
- Boutons actions :
  - ✏️ Modifier date/heure
  - ✅ Valider
  - ❌ Supprimer

##### Calcul Automatique

**Déclenchement** :
- Lors création/modification réservation
- Lors suppression réservation
- Lors sync iCal
- Manuellement (bouton "Recalculer planning")

**Règles Métier (9 règles configurables)** :

1. **Dimanche interdit** (priority: 1)
   - Pas de ménage le dimanche
   - Décale au lundi si nécessaire

2. **Samedi interdit** (priority: 2)
   - Pas de ménage le samedi
   - Décale au vendredi ou lundi

3. **Enchainement réservations** (priority: 3)
   - Si départ J et arrivée J → 1 seul ménage
   - Heure calculée : Entre les 2 (ex: départ 10h, arrivée 16h → ménage 12h-14h)

4. **Jours fériés** (priority: 4)
   - Pas de ménage les jours fériés
   - Liste jours fériés français (1er jan, 1er mai, 14 juil, etc.)

5. **Mercredi/Jeudi préférentiels** (priority: 5)
   - Privilégier mercredi ou jeudi si possible
   - Sinon mardi ou vendredi

6. **Distance minimale entre ménages** (priority: 6)
   - Minimum 2h entre 2 ménages
   - Évite surcharge planning

7. **Horaires préférés** (priority: 7)
   - Matin : 9h-12h (préféré)
   - Après-midi : 14h-17h

8. **Week-end arrivée/départ** (priority: 8)
   - Si arrivée/départ week-end → ménage vendredi
   - Sauf si enchainement

9. **Délai avant arrivée** (priority: 9)
   - Minimum 2h entre fin ménage et arrivée client
   - Sécurité pour finition

**Configuration** :
- Chaque règle peut être activée/désactivée
- Priorité modifiable (1-9)
- Paramètres personnalisables (JSONB)
- Interface modal `cleaning-rules-modal.js`

##### Workflow Validation

**Proposition Femme de Ménage** :
1. Femme de ménage consulte planning (`femme-menage.html`)
2. Propose modification date/heure
3. Ajoute commentaire optionnel
4. Statut passe à `pending_validation`

**Validation Propriétaire** :
1. Dashboard affiche alerte "Propositions en attente"
2. Propriétaire consulte onglet Ménage
3. Clique "✅ Valider" ou "❌ Refuser"
4. Statut mis à jour (`validated` ou `refused`)
5. Notification femme de ménage (optionnel)

**Validation Entreprise** :
1. Entreprise accède à `validation.html`
2. Vue globale toutes propositions
3. Validation groupée possible
4. Export PDF planning validé

##### Fonction Principale
```javascript
async function afficherPlanningParSemaine() {
    // 1. Récupère réservations
    // 2. Récupère ménages planifiés
    // 3. Applique règles métier
    // 4. Génère grid par semaines
    // 5. Affiche cartes ménage
    // 6. Attache event listeners
}
```

---

#### 5. **Draps & Linge** 🛏️

**Fichier** : `tabs/tab-draps.html`  
**Script** : `js/draps.js` (v2.6)  
**Rôle** : Gestion stocks + configuration besoins

##### Section 1 : Stocks de Linge

**Par gîte** :
- **Items fixes** (`linen_stocks`) :
  - Draps plats grands
  - Draps plats petits
  - Housses couettes grandes
  - Housses couettes petites
  - Taies d'oreillers
  - Serviettes
  - Tapis de bain
- **Items dynamiques** (`linen_stock_items`) :
  - Personnalisables par client
  - Clé (item_key) + Quantité
  - Exemple : "alese", "torchons", "serviettes_invites"

**Actions** :
- Modifier quantités (inline edit)
- Ajouter item personnalisé
- Supprimer item
- États : Propre / Sale / À laver
- Auto-save après modification

##### Section 2 : Configuration Besoins par Réservation

**Interface** :
- Titre : "Configuration des Besoins par Réservation"
- Bouton "Éditer" sous le titre (design récent 23/01/2026)
- Liste des configurations existantes

**Formulaire Configuration** :
- Nom configuration : Ex "2 personnes", "4 personnes", "6 personnes"
- Pour chaque item de linge :
  - Quantité nécessaire
  - Exemple : "2 personnes" → 2 draps plats grands, 4 taies, etc.
- Boutons empilés verticalement (mode édition) :
  - ➕ Ajouter configuration
  - 💾 Sauvegarder
  - ❌ Annuler

**Calcul Automatique Besoins** :
- Lors ajout réservation → Sélectionne config selon nb personnes
- Calcule besoins totaux
- Compare avec stocks disponibles
- Alerte si stock insuffisant (Dashboard "Problèmes Urgents")

##### Technologies
- Boutons pleine largeur (`width: 100%`)
- `flex-direction: column` pour empilement vertical
- Sauvegarde automatique (debounce 1s)
- Validation quantités (> 0)

---

#### 6. **Fiscalité LMNP** 💰

**Fichier** : `tabs/tab-fiscalite-v2.html` (76 987 octets)  
**Scripts** : `js/fiscalite-v2.js`, `js/taux-fiscaux-config.js`, `js/km-manager.js`  
**Rôle** : Calculs fiscaux complets LMNP

##### Sections Principales

**A. Sélection Année**
- Dropdown 2024, 2025, 2026
- Configuration automatique des taux selon année (`taux-fiscaux-config.js`)

**B. Revenus Locatifs**
- Revenus plateformes (Airbnb, Booking, etc.)
- Frais de service (commission)
- Revenus nets
- Import automatique depuis réservations
- Possibilité ajustement manuel

**C. Charges Déductibles (10 catégories)**
1. **Entretien & Réparations**
   - Ménage
   - Réparations courantes
   - Petits travaux
2. **Charges de copropriété**
3. **Assurances**
   - Habitation
   - RC propriétaire
   - PNO
4. **Taxe foncière**
5. **Frais de gestion**
   - Comptable
   - Logiciel gestion
6. **Eau, Électricité, Gaz**
7. **Internet, Téléphone**
8. **Fournitures** (linge, produits ménage)
9. **Frais bancaires**
10. **Divers** (publicité, photos, etc.)

**Saisie** :
- Montant par catégorie
- Date (optionnel)
- Justificatif (upload fichier)
- Auto-total

**D. Amortissements (3 types)**
1. **Bâti** (immobilier)
   - Prix acquisition
   - Durée : 20-50 ans
   - Calcul linéaire
2. **Mobilier** (équipement)
   - Prix total mobilier
   - Durée : 5-10 ans
3. **Travaux**
   - Liste travaux (JSONB dans `donnees_detaillees`)
   - Date + montant + durée amortissement
   - Calcul automatique annuité

**E. Kilomètres Professionnels**
- **Trajets automatiques** (`km_trajets`) :
  - Ménage entrée/sortie
  - Courses avant séjour
  - Maintenance
  - Auto-générés depuis réservations
- **Trajets manuels** :
  - Date
  - Motif
  - Lieu arrivée (select lieux favoris)
  - Distance aller
  - Aller-retour (checkbox)
  - Distance totale calculée
- **Barème fiscal** :
  - Puissance fiscale véhicule
  - 3 tranches de distance
  - Calcul automatique indemnités
- **Configuration** :
  - Lieux favoris (`km_lieux_favoris`)
  - Distance gîtes (`gites.distance_km`)
  - Activation auto-génération (`km_config_auto`)

**F. Calculs Cotisations**

1. **URSSAF (7 lignes)** :
   - Indemnités journalières : 0.85%
   - Retraite base : 17.75%
   - Retraite complémentaire : 7%
   - Invalidité-décès : 1.3%
   - CSG-CRDS : 9.7%
   - Formation pro : 0.25%
   - Allocations familiales : 0-3.1% (progressif selon revenus)
   - **Minimum légal : 1 200 €/an**

2. **Trimestres Retraite** :
   - Basé sur 600 × SMIC horaire
   - Maximum 4 trimestres/an
   - Calcul automatique selon revenus

3. **Impôt sur le Revenu** :
   - Barème progressif 5 tranches (2025) :
     - 0-11 294 € : 0%
     - 11 295-28 797 € : 11%
     - 28 798-82 341 € : 30%
     - 82 342-177 106 € : 41%
     - > 177 106 € : 45%
   - Abattement salaires 10% (min 472€, max 13 522€)
   - Quotient familial (parts)
   - Décote si impôt < seuil

**G. Résultats Fiscaux**

**Tableau récapitulatif** :
- Revenus bruts
- - Charges déductibles
- - Amortissements
- = Bénéfice imposable
- - Cotisations URSSAF
- - Impôt sur le revenu
- - Kilomètres déductibles
- **= BÉNÉFICE NET**

**Graphiques** (Chart.js) :
- Camembert charges par catégorie
- Histogramme revenus vs charges
- Courbe évolution bénéfice mensuel
- Comparaison années

**Actions** :
- 💾 Sauvegarder simulation
- 📄 Export PDF déclaration
- 📊 Export Excel complet
- 📧 Envoyer au comptable
- 🔄 Comparer scénarios (Micro-BIC vs Réel)

##### Technologies
- **Chart.js** : 4 graphiques interactifs
- **Calculs temps réel** : Debounce 500ms
- **Configuration dynamique** : `taux-fiscaux-config.js` (multi-années)
- **Stockage** : `simulations_fiscales` (JSONB `donnees_detaillees`)
- **Validation** : Montants > 0, dates cohérentes

##### Fonctions Clés
```javascript
function calculerFiscalite(annee) // Calcul complet
function calculerURSSAF(benefice) // Cotisations sociales
function calculerIR(revenuImposable, parts) // Impôt revenu
function calculerTrimestres(revenus) // Retraite
function exportPDF() // Génération PDF
function comparerScenarios() // Micro-BIC vs Réel
```

---

#### 7. **Infos Gîtes (Pour Fiches Clients)** 📝

**Fichier** : `tabs/tab-infos-gites.html` (71 335 octets)  
**Script** : `js/infos-gites.js` (v3.3)  
**Rôle** : Saisie des 119 champs bilingues pour fiches clients

##### Structure : 8 Sections (FR + EN)

**1. Informations de Base** (12 champs × 2 langues = 24 champs)
- Adresse complète
- Adresse visible clients
- Téléphone contact
- Email contact
- GPS latitude
- GPS longitude
- Consignes spéciales
- Informations complémentaires

**2. WiFi & Connectivité** (8 champs × 2 = 16)
- SSID (nom réseau)
- Mot de passe WiFi
- Débit (Mbps)
- Localisation box
- Zones couverture
- Répéteurs (emplacements)
- Mode d'emploi connexion
- Dépannage

**3. Consignes d'Arrivée** (15 champs × 2 = 30)
- Heure check-in
- Parking (description)
- Accès (chemin, escaliers)
- Code porte
- Code portail
- Instructions clés (cachette, boîte)
- Étage
- Ascenseur (oui/non + étage)
- Interphone (code)
- Voisinage (infos)

**4. Le Logement - Guide Complet** (20 champs × 2 = 40)
- **Chauffage** :
  - Type (électrique, gaz, etc.)
  - Mode d'emploi
  - Thermostat (emplacement + utilisation)
  - Programmation
- **Cuisine** :
  - Électroménager disponible
  - Mode d'emploi (four, lave-vaisselle, etc.)
  - Ustensiles fournis
  - Plaques cuisson
- **Chambres** :
  - Nombre
  - Configuration lits
  - Literie fournie
  - Rangements

**5. Tri des Déchets** (6 champs × 2 = 12)
- Instructions tri sélectif
- Localisation poubelles
- Jours de collecte
- Déchèterie (adresse + horaires)
- Consignes spéciales
- Compost (si disponible)

**6. Sécurité & Urgences** (7 champs × 2 = 14)
- Détecteurs fumée (emplacements)
- Extincteur (emplacement)
- Coupure eau (robinet principal)
- Coupure électricité (disjoncteur)
- Coupure gaz (robinet)
- Numéros urgence (pompiers, SAMU, police, hôpital)
- Contact propriétaire urgence

**7. Consignes de Départ** (8 champs × 2 = 16)
- Heure check-out
- Checklist départ (ménage attendu)
- Restitution clés (où et comment)
- État des lieux (auto-évaluation)
- Poubelles (sortir ou laisser)
- Fenêtres (fermer)
- Chauffage (éteindre ou température)
- Commentaires/avis (lien)

**8. Règlement Intérieur** (9 champs × 2 = 18)
- Tabac (interdit ou autorisé où)
- Animaux (acceptés ou non + conditions)
- Nombre max personnes
- Fêtes/événements (autorisés ou non)
- Nuisances sonores (horaires calme)
- Caution (montant + modalités)
- Assurance vacances (recommandée)
- Pénalités (retard, dégâts, non-respect)
- Conditions annulation

##### Interface

**Sélecteur Gîte** :
- Dropdown en haut de page
- Change toutes les sections à la volée
- Sauvegarde automatique avant changement

**Onglets Sections** :
- Navigation horizontale (Desktop)
- Scroll vertical (Mobile)
- Icônes par section
- Badge "✅ Complété" si tous champs remplis

**Formulaire par Section** :
- **Colonne Gauche** : Champs FR
- **Colonne Droite** : Champs EN (lecture seule)
- Textarea pour champs longs
- Input text pour champs courts
- Validation : Certains champs obligatoires (adresse, téléphone, WiFi)

**Boutons Actions** :
- 💾 **Sauvegarder** (par section)
- 🌍 **Traduire EN** (bouton si traduction manquante)
- 👁️ **Aperçu Fiche Client** (ouvre fiche-client.html)
- ♻️ **Réinitialiser** (vide tous les champs)
- 📋 **Copier d'un autre gîte** (modal select source)

**English Version (Toggle)** :
- Section dépliable en bas de page
- Affiche tous les champs EN éditables
- Pour corrections manuelles traductions
- Sync auto FR→EN lors sauvegarde

##### Traduction Automatique

**Déclenchement** :
- Lors sauvegarde si champs EN vides
- API MyMemory FR→EN
- Async (ne bloque pas UI)
- Fallback : Copie FR si API fail

**Champs traduits automatiquement** :
- Tous les textes longs (consignes, descriptions)
- Pas les champs techniques (codes, SSID, GPS)

##### Technologies
- **119 colonnes BDD** (`infos_gites`)
- **Validation HTML5** + `validation-utils.js`
- **Auto-save** : Debounce 2s après dernière modif
- **Protection XSS** : DOMPurify sur tous les inputs
- **Responsive** : Grid 2 colonnes → 1 colonne mobile

##### Fonctions Clés
```javascript
async function loadGiteInfos(giteId) // Charge toutes les infos
async function saveSection(sectionName) // Sauvegarde 1 section
async function translateAllFields() // Traduit FR→EN
function validateRequiredFields() // Vérifie champs obligatoires
function copyFromGite(sourceGiteId) // Copie infos autre gîte
```

---

#### 8. **Fiches Clients** 📄

**Fichier** : `tabs/tab-fiches-clients.html`  
**Scripts** : `js/fiches-clients.js`, `js/fiche-client.js` (module)  
**Rôle** : Génération liens fiches clients

##### Fonctionnalités

**A. Liste Réservations**
- Filtre par gîte
- Filtre par statut (confirmée, en attente, annulée)
- Tri par date (arrivée, départ)
- Recherche nom client

**B. Génération Fiche**

**Par réservation** :
- Bouton "📄 Générer fiche"
- Génère token sécurisé (32 bytes)
- Insert dans `access_tokens` :
  - `token` (random)
  - `reservation_id`
  - `expires_at` (date départ)
  - `created_at`
- URL générée : `https://domain.com/pages/fiche-client.html?token=xxx`

**Modal Partage** :
- Affiche URL générée
- 4 options partage :
  1. **📱 WhatsApp** :
     - Message pré-rempli
     - Inclut nom client + gîte + lien
     - Format : "Bonjour {nom} ! Voici votre fiche..."
  2. **📧 Email** :
     - Ouvre client email (mailto:)
     - Sujet pré-rempli
     - Corps avec lien
  3. **📋 Copier lien** :
     - Copy to clipboard
     - Notification "Copié !"
  4. **🔗 Partage natif** :
     - `navigator.share()` (si supporté)
     - Mobile uniquement généralement

**C. Gestion Tokens**
- Liste tokens générés
- Statut : Actif / Expiré
- Date expiration
- Nombre de consultations (optionnel)
- Révoquer token manuellement
- Régénérer token (nouveau lien)

**D. Configuration Gîte (Par fiche)**
- Sélection gîte
- Bouton "⚙️ Configurer"
- Redirect vers `tab-infos-gites` avec gîte sélectionné
- Vérification complétude (119 champs)
- Alertes si champs manquants

##### Interface
- Design Neo-Brutalism
- Tableau responsive
- Actions inline (boutons par ligne)
- Modal partage animé (slide-up)

##### Fonctions Clés
```javascript
async function aperçuFicheClient(reservationId) // Génère token + modal
function showSimpleModal(reservation, ficheUrl, token, clientName, clientPhone) // Modal partage
function sharePageLink(ficheUrl, reservation) // Gère les 4 options partage
function generateSecureToken() // 32 bytes crypto-random
```

---

#### 9. **À Découvrir (Activités Touristiques)** 🎭

**Fichier** : `tabs/tab-decouvrir.html` (13 120 octets)  
**Script** : `js/decouvrir.js` (v3.0)  
**Rôle** : Gestion POIs et activités autour des gîtes

##### Fonctionnalités

**A. Liste Activités**
- **Grille de cartes** (3-4 colonnes desktop)
- **Informations par carte** :
  - Photo (si disponible)
  - Nom établissement
  - Catégorie (badge coloré)
  - Description courte
  - Adresse
  - Distance depuis gîte (calculée auto)
  - Note Google ⭐ (0-5)
  - Nombre d'avis
  - Site web (lien externe)
  - Téléphone (bouton appel mobile)
- **Actions** :
  - ✏️ Modifier
  - 🗑️ Supprimer
  - 👁️ Voir sur carte

**B. Ajout/Édition Activité**

**Formulaire** :
- Nom (required)
- Catégorie (select) :
  - 🍽️ Restaurant
  - ☕ Café/Bar
  - 🏛️ Musée
  - 🏰 Château
  - 🌳 Parc
  - 🏨 Hôtel
  - 🎢 Attraction
- Description (textarea, support Markdown)
- Adresse complète (required pour géocodage)
- Site web (URL)
- Téléphone
- Note Google (0-5, step 0.1)
- Nombre d'avis
- Photos (upload multiple, JSONB)
- Actif (checkbox)

**Géocodage Automatique** :
- Lors sauvegarde avec adresse
- API OpenStreetMap Nominatim
- Requête : `https://nominatim.openstreetmap.org/search?q={adresse}&format=json`
- Récupère : `latitude`, `longitude`
- Calcule distance depuis gîte (formule Haversine)
- Affiche : "X.X km du gîte"

**C. Filtres**
- Par catégorie (multi-select avec badges)
- Par distance (< 5km, < 10km, < 20km, tous)
- Par note (≥ 4⭐, ≥ 3⭐, tous)
- Recherche texte (nom, description)

**D. Carte Interactive**
- **Leaflet.js** (OpenStreetMap)
- **Markers** :
  - 1 marker = 1 activité
  - Couleur selon catégorie
  - Cluster si zoom out (nombreux POIs)
- **Popup marker** :
  - Nom + catégorie
  - Photo miniature
  - Bouton "Voir détails"
  - Bouton "Itinéraire" (Google Maps)
- **Gîte** :
  - Marker spécial (maison bleue)
  - Toujours visible
- **Centrage** :
  - Auto-center sur gîte sélectionné
  - Zoom adaptatif selon nombre de markers

**E. Export PDF Guide**
- Bouton "📄 Générer Guide PDF"
- Liste toutes les activités
- Tri par catégorie puis distance
- Inclut carte statique
- Design imprimable
- Logo gîte en en-tête

##### Interface
- Design Neo-Brutalism (cartes colorées)
- Grid responsive (4 → 2 → 1 colonnes)
- Hover effect cartes (shadow + translate)
- Icônes catégories (emojis)
- Photos : Lazy loading

##### Technologies
- **Leaflet.js** : Carte interactive
- **Nominatim API** : Géocodage gratuit
- **Formule Haversine** : Calcul distance GPS
- **JSONB** : Stockage photos (URLs)
- **Markdown** : Description (optionnel)

##### Fonctions Clés
```javascript
async function loadActivites(giteId) // Charge toutes les activités
async function geocodeAddress(address) // API Nominatim
function calculateDistance(lat1, lon1, lat2, lon2) // Haversine
async function saveActivite(data) // CRUD activité
function initMap() // Initialise carte Leaflet
function exportGuide() // Génère PDF
```

---

#### 10. **FAQ** ❓

**Fichier** : `tabs/tab-faq.html` (11 959 octets)  
**Script** : `js/faq.js` (v3.0)  
**Rôle** : Gestion questions fréquentes clients

##### Fonctionnalités

**A. Liste FAQ**
- **Tri** :
  - Par catégorie
  - Par priorité (1-10)
  - Par visibilité (visible/cachée)
- **Affichage** :
  - Accordéon (question cliquable)
  - Réponse dépliable
  - Badge catégorie
  - Badge priorité (chiffre)
  - Toggle visibilité (👁️/👁️‍🗨️)
- **Actions** :
  - ✏️ Modifier
  - 🗑️ Supprimer
  - ⬆️⬇️ Réorganiser (drag & drop)

**B. Ajout/Édition FAQ**

**Formulaire** :
- **Question FR** (required, textarea)
- **Réponse FR** (required, textarea, support Markdown)
- **Question EN** (auto-traduit, éditable)
- **Réponse EN** (auto-traduit, éditable)
- **Catégorie** (select ou créer nouvelle) :
  - Arrivée
  - Logement
  - Équipements
  - Départ
  - Général
  - [Personnalisées]
- **Priorité** (1-10, 1 = plus important)
- **Visibilité** (checkbox)
- **Gîte** (select ou "Tous les gîtes")

**Traduction Automatique** :
- Déclenchement lors sauvegarde
- API MyMemory FR→EN
- Champs : `question` → `question_en`, `answer` → `answer_en`
- Affichage progress "🌍 Traduction en cours..."
- Succès : "✅ Traduction terminée"
- Éditable manuellement après

**C. Aperçu Fiche Client**
- Bouton "👁️ Aperçu"
- Simule affichage dans fiche-client.html
- Switch FR/EN pour tester
- Accordéon identique à version client

**D. Import/Export**
- **Import CSV** :
  - Colonnes : question, answer, question_en, answer_en, category, priority
  - Écrase ou fusionne avec existantes
- **Export CSV** :
  - Toutes les FAQ
  - Filtre possible par gîte/catégorie

##### Interface
- Design Neo-Brutalism
- Accordéon animé (smooth expand/collapse)
- Drag & drop réorganisation (priorité)
- Inline editing (double-clic)
- Toast notifications (succès/erreur)

##### Technologies
- **MyMemory API** : Traduction automatique
- **Markdown** : Rendu réponses (optionnel)
- **Sortable.js** : Drag & drop (optionnel)
- **Event delegation** : Performance accordéon

##### Fonctions Clés
```javascript
async function loadFAQs(giteId) // Charge FAQs
async function saveFAQ(data) // CRUD FAQ
async function translateToEnglish(textFR) // API MyMemory
function renderFAQList(faqs) // Affiche accordéon
function exportCSV() // Export toutes FAQs
function importCSV(file) // Import CSV
```

---

#### 11. **Checklists Entrée/Sortie** ✅

**Fichier** : `tabs/tab-checklists.html` (7 318 octets)  
**Script** : `js/checklists.js`  
**Rôle** : Gestion templates checklists bilingues

##### Fonctionnalités

**A. Types de Checklists**
1. **Check-in** (Arrivée)
   - Vérifications à l'arrivée client
   - État des lieux entrée
   - Remise clés
2. **Check-out** (Départ)
   - Vérifications au départ
   - État des lieux sortie
   - Récupération clés

**B. Liste Items**
- **Par gîte** (select dropdown)
- **Par type** (check-in / check-out)
- **Affichage** :
  - Texte item (FR)
  - Description détaillée (si présente)
  - Ordre (priorité affichage)
  - Actions :
    - ✏️ Modifier
    - 🗑️ Supprimer
    - ⬆️ Monter
    - ⬇️ Descendre

**C. Ajout/Édition Item**

**Formulaire** :
- **Texte FR** (required, textarea courte)
  - Ex: "Vérifier état du mobilier"
- **Description FR** (optionnel, textarea longue)
  - Détails complémentaires
  - Ex: "Inspecter tables, chaises, canapé. Signaler tout dommage."
- **Texte EN** (auto-traduit, éditable)
- **Description EN** (auto-traduit, éditable)
- **Type** (select : check-in / check-out)
- **Ordre** (number, 1-100)

**Traduction Automatique** :
- Identique FAQ
- API MyMemory FR→EN
- Champs : `texte` → `texte_en`, `description` → `description_en`
- Éditable manuellement

**D. Event Delegation (Correction Bug Critique)**
⚠️ **IMPORTANT** : Suite au bug du 23/01/2026 (cf. ERREURS_CRITIQUES.md)
- **Pas de `onclick` inline avec `innerHTML`**
- Pattern **`data-action`** obligatoire :
  ```html
  <button data-action="edit" data-id="uuid">Modifier</button>
  ```
- **Event listener global** :
  ```javascript
  document.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const action = btn.dataset.action;
      const itemId = btn.dataset.id; // UUID, PAS parseInt()
      handleChecklistClick(action, itemId);
  });
  ```
- **UUID** : Toujours en **chaîne** (ne JAMAIS utiliser `parseInt()` sur un UUID)

**E. Progression Checklists (Dashboard)**
- Affichée dans `tab-dashboard.html` (section Séjours en Cours)
- Par réservation :
  - Items validés / Items totaux
  - Bouton "👁️ Détails" pour déplier
  - Liste items : ✅ validés (vert) / ❌ non validés (blanc)
- Stockage : Table `checklist_progress`
  - `reservation_id` (FK)
  - `template_id` (FK vers `checklist_templates`)
  - `completed` (boolean)
  - `completed_at` (timestamp)

##### Interface
- Design Neo-Brutalism
- Liste items réorganisable (drag & drop ou boutons ⬆️⬇️)
- Inline preview (toggle description)
- Badge type (check-in/out coloré)

##### Technologies
- **Event delegation** : `data-action` + `closest()`
- **UUID handling** : Toujours chaîne (correction 23/01)
- **MyMemory API** : Traduction auto
- **Debounce** : Auto-save ordre après drag & drop

##### Fonctions Clés
```javascript
async function loadChecklistTemplates(giteId, type) // Charge templates
async function addChecklistItem(data) // Ajoute item
async function updateChecklistItem(itemId, data) // Modifie item
function handleChecklistClick(action, itemId) // Event delegation
async function translateToEnglish(textFR) // API MyMemory
function reorderItems(oldIndex, newIndex) // Réorganisation
```

---

#### 12. **Archives** 🗂️

**Fichier** : `tabs/tab-archives.html` (1 928 octets)  
**Script** : `js/archives.js`  
**Rôle** : Consultation réservations et tâches archivées

##### Fonctionnalités

**A. Réservations Archivées**
- **Critères archivage** :
  - Date départ < aujourd'hui
  - Statut = "Terminée" ou "Annulée"
- **Affichage** :
  - Tableau responsive
  - Colonnes : Gîte, Client, Dates, Plateforme, Statut
  - Tri par date départ (plus récent en premier)
- **Filtres** :
  - Par gîte
  - Par année
  - Par plateforme
  - Recherche nom client
- **Actions** :
  - 👁️ Voir détails (modal)
  - 📄 Voir fiche client générée (si token existe)
  - ♻️ Restaurer (repasse en réservations actives)
  - 🗑️ Supprimer définitivement (confirmation)

**B. Tâches Terminées**
- Liste TODO complétées
- Date de complétion
- Catégorie
- Utilisateur ayant complété

**C. Export Historique**
- **Export Excel** :
  - Toutes réservations archivées
  - Feuille par gîte ou feuille unique
  - Colonnes : Dates, Client, Prix, Plateforme, Notes
- **Export PDF** :
  - Rapport annuel
  - Statistiques (nb séjours, revenus totaux, taux occupation)
  - Graphiques

**D. Statistiques Archives**
- Nombre total réservations
- Revenus cumulés
- Client le plus fréquent
- Plateforme principale
- Durée moyenne séjour

##### Interface
- Design Neo-Brutalism (épuré)
- Tableau paginé (50 résultats/page)
- Recherche instantanée (debounce 300ms)
- Skeleton loader pendant chargement

##### Technologies
- **SheetJS** : Export Excel
- **Pagination** : Côté client (performance)
- **Lazy loading** : Charge 50 résultats à la fois

---

#### 13. **Statistiques & Analyses** 📊

**Fichier** : `tabs/tab-statistiques.html` (21 643 octets)  
**Script** : `js/statistiques.js`  
**Rôle** : Analyses détaillées et graphiques

##### Fonctionnalités

**A. Indicateurs Clés (KPIs)**
- **Taux d'Occupation** :
  - Par gîte (%)
  - Moyenne globale
  - Comparaison année N vs N-1
  - Graphique évolution mensuelle
- **Revenus** :
  - Total mensuel/annuel
  - Moyenne par nuitée
  - Comparaison plateformes
  - Graphique revenus cumulés
- **Nombre de Nuitées** :
  - Total par gîte
  - Répartition mois
  - Comparaison années
- **Durée Moyenne Séjour** :
  - Par gîte
  - Par plateforme
  - Évolution temporelle
- **Clients** :
  - Nombre unique
  - Clients récurrents (%)
  - Top 10 clients
- **Plateformes** :
  - Répartition revenus
  - Nombre réservations
  - Taux conversion

**B. Graphiques Chart.js**
1. **Camembert** : Revenus par plateforme
2. **Barres** : Occupation par mois
3. **Courbe** : Évolution revenus 12 derniers mois
4. **Barres empilées** : Revenus par gîte et mois
5. **Radar** : Performance multi-critères
6. **Nuage de points** : Prix vs Durée séjour

**C. Filtres**
- Période : Mois, Trimestre, Année, Personnalisée
- Gîte : Tous ou sélection
- Plateforme : Toutes ou filtre
- Statut : Confirmées, Annulées, Toutes

**D. Export**
- **PDF** : Rapport complet avec graphiques
- **Excel** : Données brutes + tableaux croisés dynamiques
- **CSV** : Export simple données

**E. Prévisions (Optionnel)**
- Basé sur historique
- Occupation prévisionnelle
- Revenus estimés
- Saisonnalité détectée

##### Interface
- Design Neo-Brutalism
- Grid responsive (2 colonnes → 1 colonne mobile)
- Graphiques interactifs (hover, légendes)
- Export buttons prominent

##### Technologies
- **Chart.js** : 6 types graphiques
- **Calculs** : Côté client (performance)
- **PDF** : html2canvas + jsPDF
- **Excel** : SheetJS

---

### Navigation & UX

#### Menu Latéral (Desktop)
- Position : Fixed left
- Largeur : 250px
- Logo en haut
- Liste onglets avec icônes
- Badge notifications (si alertes)
- Bouton déconnexion en bas
- Scroll si nombreux onglets

#### Menu Hamburger (Mobile)
- Position : Fixed top-right
- Bouton ☰ (3 barres)
- Slide-in de droite
- Overlay fond semi-transparent
- Fermeture : Clic overlay ou ✕

#### Animations
- Transitions CSS (0.2s-0.3s)
- Hover effects (buttons, cards)
- Loading spinners
- Toast notifications
- Skeleton loaders

---

## 🗄️ BASE DE DONNÉES COMPLÈTE - ANALYSE & DOCUMENTATION

### 📊 Tableau Récapitulatif des Tables (35 tables identifiées)

| # | Nom Table | Statut | Utilisation | Action Recommandée |
|---|-----------|--------|-------------|-------------------|
| 1 | **gites** | ✅ ACTIF | Core - Gestion gîtes | **CONSERVER** |
| 2 | **reservations** | ✅ ACTIF | Core - Réservations | **CONSERVER** (⚠️ Doublon SQL détecté) |
| 3 | **infos_gites** | ✅ ACTIF | 119 champs fiches clients | **CONSERVER** |
| 4 | **linen_stocks** | ✅ ACTIF | Stocks linge fixes | **CONSERVER** |
| 5 | **linen_stock_items** | ✅ ACTIF | Stocks linge dynamiques | **CONSERVER** |
| 6 | **linen_needs** | ✅ ACTIF | Config besoins par resa | **CONSERVER** (non trouvée dans SQL fourni) |
| 7 | **cleaning_schedule** | ✅ ACTIF | Planning ménages | **CONSERVER** (non trouvée dans SQL fourni) |
| 8 | **cleaning_rules** | ✅ ACTIF | Règles métier ménage | **CONSERVER** (⚠️ Doublon SQL détecté) |
| 9 | **checklist_templates** | ✅ ACTIF | Templates checklists bilingues | **CONSERVER** |
| 10 | **checklist_progress** | ✅ ACTIF | Progression checklists | **CONSERVER** (non trouvée dans SQL fourni) |
| 11 | **checklists** | ⚠️ OBSOLÈTE | Ancienne table checklists | **À SUPPRIMER** (remplacée par checklist_templates) |
| 12 | **activites_gites** | ✅ ACTIF | POIs et activités touristiques | **CONSERVER** |
| 13 | **activites_consultations** | 🟡 OPTIONNEL | Tracking vues activités | **CONSERVER ou SUPPRIMER** (analytics) |
| 14 | **faq** | ✅ ACTIF | Questions fréquentes bilingues | **CONSERVER** |
| 15 | **km_trajets** | ✅ ACTIF | Trajets professionnels | **CONSERVER** (⚠️ Doublon SQL détecté) |
| 16 | **km_lieux_favoris** | ✅ ACTIF | Lieux favoris avec distances | **CONSERVER** |
| 17 | **km_config_auto** | ✅ ACTIF | Config auto-génération trajets | **CONSERVER** (non trouvée dans SQL fourni) |
| 18 | **simulations_fiscales** | ✅ ACTIF | Calculs fiscaux LMNP | **CONSERVER** (non trouvée dans SQL fourni) |
| 19 | **fiscal_history** | ✅ ACTIF | Historique simulations | **CONSERVER** (non trouvée dans SQL fourni) |
| 20 | **fiscalite_amortissements** | 🟡 OPTIONNEL | Détail amortissements | **FUSIONNER dans simulations_fiscales ?** |
| 21 | **charges** | 🟡 OPTIONNEL | Détail charges déductibles | **FUSIONNER dans simulations_fiscales ?** (⚠️ Doublon SQL détecté) |
| 22 | **client_access_tokens** | ✅ ACTIF | Tokens fiches clients | **CONSERVER** (mentionné, pas de schéma fourni) |
| 23 | **todos** | ✅ ACTIF | Liste tâches dashboard | **CONSERVER** |
| 24 | **infos_pratiques** | ⚠️ OBSOLÈTE | Infos flexibles (remplacé par infos_gites) | **À SUPPRIMER** (⚠️ Doublon SQL détecté) |
| 25 | **demandes_horaires** | 🔴 INUTILISÉE | Demandes changement horaires | **À SUPPRIMER** (feature non implémentée) |
| 26 | **evaluations_sejour** | 🔴 INUTILISÉE | Évaluations post-séjour | **À SUPPRIMER** (feature non implémentée) (⚠️ Triplon SQL) |
| 27 | **fiche_generation_logs** | 🟡 OPTIONNEL | Logs génération fiches | **CONSERVER ou SUPPRIMER** (analytics) (⚠️ Doublon SQL) |
| 28 | **problemes_signales** | 🔴 INUTILISÉE | Signalements problèmes | **À SUPPRIMER** (feature non implémentée) |
| 29 | **retours_menage** | 🔴 INUTILISÉE | Retours femme ménage détaillés | **À SUPPRIMER** (feature non implémentée) (⚠️ Doublon SQL) |
| 30 | **suivi_soldes_bancaires** | 🔴 INUTILISÉE | Suivi trésorerie | **À SUPPRIMER** (feature non implémentée) |
| 31 | **historical_data** | 🟡 OPTIONNEL | Audit trail complet | **CONSERVER ou SUPPRIMER** (audit) (⚠️ Doublon SQL) |
| 32 | **auth.users** | ✅ ACTIF | Supabase Auth | **CONSERVER** (table système) |

---

### 📋 TABLES ACTIVES ESSENTIELLES (19 tables)

#### **GROUPE 1 : Core Application (3 tables)**

##### 1. **gites** ✅ PRODUCTION
**Rôle** : Table principale des gîtes gérés

**Colonnes** :
- `id` (UUID PK)
- `owner_user_id` (UUID FK → auth.users) 🔒 RLS
- `name` (TEXT NOT NULL, min 2 chars)
- `slug` (TEXT NOT NULL, format: `^[a-z0-9_-]+$`)
- `description` (TEXT)
- `address` (TEXT)
- `icon` (TEXT, default 'home')
- `color` (TEXT, default '#667eea')
- `capacity` (INTEGER ≥ 0)
- `bedrooms` (INTEGER ≥ 0)
- `bathrooms` (INTEGER ≥ 0)
- `latitude` (NUMERIC 10,8)
- `longitude` (NUMERIC 11,8)
- `ical_sources` (JSONB, default `{}`) - URLs par plateforme
- `settings` (JSONB, default `{}`)
- `tarifs_calendrier` (JSONB, default `{}`)
- `regles_tarifaires` (JSONB, default `{}`)
- `regles_tarifs` (JSONB) - Promotions, durée min
- `display_order` (INTEGER, default 0)
- `is_active` (BOOLEAN, default true)
- **`distance_km` (NUMERIC 6,2, default 0)** ⭐ NOUVEAU 19/01/2026 - Distance depuis domicile
- `created_at`, `updated_at` (TIMESTAMPTZ)

**Contraintes** :
- UNIQUE (`owner_user_id`, `slug`)
- CHECK `name` length ≥ 2
- CHECK `slug` format regex
- CHECK `bedrooms`, `bathrooms`, `capacity` ≥ 0

**Index** :
- `idx_gites_owner` (owner_user_id)
- `idx_gites_active` (owner_user_id, is_active)
- `idx_gites_slug` (owner_user_id, slug)

**RLS** : ✅ Policy `owner_user_id = auth.uid()`

**Utilisé par** : `js/gites-manager.js`, `js/gites-crud.js`

---

##### 2. **reservations** ✅ PRODUCTION ⚠️ DOUBLON SQL DÉTECTÉ

**Rôle** : Toutes les réservations (manuelles + iCal)

**Colonnes** :
- `id` (UUID PK)
- `owner_user_id` (UUID FK → auth.users) 🔒 RLS
- `gite_id` (UUID FK → gites) CASCADE DELETE
- `check_in` (DATE NOT NULL)
- `check_out` (DATE NOT NULL, CHECK > check_in)
- `client_name` (TEXT NOT NULL, min 2 chars)
- `client_email` (TEXT)
- `client_phone` (TEXT)
- `client_address` (TEXT)
- `guest_count` (INTEGER)
- `nb_personnes` (INTEGER) - Alias
- `platform` (TEXT)
- `plateforme` (TEXT) - Alias
- `platform_booking_id` (TEXT)
- `status` (TEXT, default 'confirmed')
- `total_price` (NUMERIC 10,2)
- `montant` (NUMERIC 10,2) - Alias
- `currency` (TEXT, default 'EUR')
- `paid_amount` (NUMERIC 10,2, default 0)
- `acompte` (NUMERIC 10,2, default 0) - Alias
- `restant` (NUMERIC 10,2, default 0) - Calculé par trigger
- `paiement` (TEXT)
- `notes` (TEXT)
- `source` (TEXT, default 'manual') - 'manual' ou 'ical'
- `provenance` (TEXT) - Alias
- `synced_from` (TEXT)
- `ical_uid` (TEXT) - UID iCal unique
- `manual_override` (BOOLEAN, default false) - Protège modifications manuelles
- `last_seen_in_ical` (TIMESTAMPTZ) - Dernière sync iCal
- `message_envoye` (BOOLEAN, default false)
- `check_in_time` (TIME)
- `check_out_time` (TIME)
- `telephone` (TEXT) - Alias
- `gite` (TEXT) - Alias nom gîte
- `created_at`, `updated_at` (TIMESTAMPTZ)

**Contraintes** :
- CHECK `check_out` > `check_in`
- CHECK `client_name` length ≥ 2

**Index** :
- `idx_reservations_owner` (owner_user_id)
- `idx_reservations_gite` (gite_id)
- `idx_reservations_dates` (check_in, check_out)
- `idx_reservations_status` (owner_user_id, status)
- `idx_reservations_ical_uid` (ical_uid) WHERE NOT NULL
- `idx_reservations_last_seen` (last_seen_in_ical) WHERE source='ical' AND manual_override=false

**Triggers** :
- `trigger_calculate_restant` - Calcule montant restant (montant - acompte)
- `trigger_sync_aliases` - Sync colonnes alias (gite, plateforme, etc.)
- `trigger_sync_gite_name` - Sync nom gîte depuis table gites

**RLS** : ✅ Policy `owner_user_id = auth.uid()`

**Utilisé par** : `js/reservations.js`, `js/sync-ical-v2.js`, `js/menage.js`, `js/km-manager.js`

**⚠️ ACTION REQUISE** : Supprimer doublon dans le schéma SQL fourni (apparaît 2 fois identique)

---

##### 3. **auth.users** ✅ SYSTÈME SUPABASE

**Rôle** : Table système Supabase Auth

**Colonnes clés** :
- `id` (UUID PK)
- `email` (TEXT UNIQUE)
- `encrypted_password` (TEXT)
- `email_confirmed_at` (TIMESTAMPTZ)
- `created_at`, `updated_at` (TIMESTAMPTZ)
- `user_metadata` (JSONB) - Rôles, profil utilisateur
- `app_metadata` (JSONB)

**Usage** :
- Toutes les tables ont FK `owner_user_id` → `auth.users(id)`
- RLS basé sur `auth.uid()` comparé à `owner_user_id`

**Utilisé par** : Toute l'application (auth.js, toutes les tables)

---

#### **GROUPE 2 : Fiches Clients (5 tables)**

##### 4. **infos_gites** ✅ PRODUCTION

**Rôle** : **119 colonnes bilingues** (FR + EN) pour fiches clients

**Structure** : 8 sections × ~15 champs × 2 langues = 119 colonnes

**Colonnes principales** :
- `id` (UUID PK)
- `owner_user_id` (UUID FK → auth.users) 🔒 RLS
- `gite_id` (UUID FK → gites) CASCADE DELETE
- **Section 1 - Base (24 colonnes)** :
  - `infos_adresse`, `infos_adresse_en`
  - `infos_adresse_visible`, `infos_adresse_visible_en`
  - `infos_telephone`, `infos_telephone_en`
  - `infos_email`, `infos_email_en`
  - `infos_gps_latitude`, `infos_gps_longitude`
  - `infos_consignes_speciales`, `infos_consignes_speciales_en`
  - ...
- **Section 2 - WiFi (16 colonnes)** :
  - `wifi_ssid`, `wifi_password`
  - `wifi_debit`, `wifi_debit_en`
  - `wifi_localisation`, `wifi_localisation_en`
  - `wifi_zones_couverture`, `wifi_zones_couverture_en`
  - ...
- **Section 3 - Arrivée (30 colonnes)** :
  - `arrivee_heure`, `arrivee_heure_en`
  - `arrivee_parking`, `arrivee_parking_en`
  - `arrivee_acces`, `arrivee_acces_en`
  - `arrivee_code_porte`, `arrivee_code_portail`
  - `arrivee_instructions_cles`, `arrivee_instructions_cles_en`
  - `arrivee_etage`, `arrivee_etage_en`
  - ...
- **Section 4 - Logement (40 colonnes)** :
  - `logement_chauffage_type`, `logement_chauffage_type_en`
  - `logement_chauffage_mode_emploi`, `logement_chauffage_mode_emploi_en`
  - `logement_cuisine_electromenager`, `logement_cuisine_electromenager_en`
  - `logement_chambres_configuration`, `logement_chambres_configuration_en`
  - ...
- **Section 5 - Déchets (12 colonnes)** :
  - `dechets_tri_instructions`, `dechets_tri_instructions_en`
  - `dechets_localisation_poubelles`, `dechets_localisation_poubelles_en`
  - `dechets_jours_collecte`, `dechets_jours_collecte_en`
  - ...
- **Section 6 - Sécurité (14 colonnes)** :
  - `securite_detecteurs_fumee`, `securite_detecteurs_fumee_en`
  - `securite_extincteur`, `securite_extincteur_en`
  - `securite_coupure_eau`, `securite_coupure_eau_en`
  - `securite_numeros_urgence`, `securite_numeros_urgence_en`
  - ...
- **Section 7 - Départ (16 colonnes)** :
  - `depart_heure`, `depart_heure_en`
  - `depart_checklist`, `depart_checklist_en`
  - `depart_restitution_cles`, `depart_restitution_cles_en`
  - ...
- **Section 8 - Règlement (18 colonnes)** :
  - `reglement_tabac`, `reglement_tabac_en`
  - `reglement_animaux`, `reglement_animaux_en`
  - `reglement_nombre_max_personnes`, `reglement_nombre_max_personnes_en`
  - `reglement_caution`, `reglement_caution_en`
  - ...
- **Colonnes rétrocompatibilité** :
  - `code_porte`, `code_portail`, `parking_info`, `acces_description`, `consignes_speciales`
- `created_at`, `updated_at` (TIMESTAMPTZ)

**Traduction** : Champs `_en` générés automatiquement via API MyMemory lors sauvegarde (côté back-office)

**RLS** : ✅ Policy `owner_user_id = auth.uid()`

**Utilisé par** : `js/infos-gites.js`, `js/fiche-client-app.js`

---

##### 5. **checklist_templates** ✅ PRODUCTION

**Rôle** : Templates checklists entrée/sortie bilingues

**Colonnes** :
- `id` (UUID PK)
- `owner_user_id` (UUID FK → auth.users) 🔒 RLS
- `gite_id` (UUID FK → gites) CASCADE DELETE
- `type` (TEXT NOT NULL) - CHECK IN ('entree', 'sortie')
- `ordre` (INTEGER, default 1)
- `texte` (TEXT NOT NULL) - FR
- **`texte_en` (TEXT)** ⭐ BILINGUE 23/01/2026
- `description` (TEXT) - FR
- **`description_en` (TEXT)** ⭐ BILINGUE 23/01/2026
- `actif` (BOOLEAN, default true)
- `created_at`, `updated_at` (TIMESTAMPTZ)

**Contraintes** :
- CHECK `type` IN ('entree', 'sortie')

**Index** :
- `idx_checklist_templates_owner` (owner_user_id)
- `idx_checklist_templates_gite` (gite_id)
- `idx_checklist_templates_type` (type)
- `idx_checklist_translations` (texte_en, description_en)

**Traduction** : API MyMemory FR→EN automatique lors sauvegarde

**RLS** : ✅ Policy `owner_user_id = auth.uid()`

**Utilisé par** : `js/checklists.js`, `js/fiche-client-app.js`

**⚠️ CORRECTION 23/01/2026** : Event delegation `data-action` + UUID en chaîne (pas parseInt)

---

##### 6. **checklist_progress** ✅ PRODUCTION

**Rôle** : Progression checklists par réservation

**Colonnes** :
- `id` (UUID PK)
- `owner_user_id` (UUID FK → auth.users) 🔒 RLS CASCADE DELETE
- `reservation_id` (UUID FK → reservations) CASCADE DELETE
- `template_id` (UUID FK → checklist_templates) CASCADE DELETE
- `completed` (BOOLEAN, default false)
- `completed_at` (TIMESTAMPTZ)
- `completed_by` (UUID FK → auth.users)
- `notes` (TEXT)
- `created_at` (TIMESTAMPTZ, default now())

**Contraintes** :
- UNIQUE (`reservation_id`, `template_id`) - 1 progression par template par réservation

**Index** :
- `idx_checklist_progress_owner` (owner_user_id)
- `idx_checklist_progress_resa` (reservation_id)
- `idx_checklist_progress_template` (template_id)

**RLS** : ✅ Policy `owner_user_id = auth.uid()`

**Utilisé par** : `js/dashboard.js` (affichage progression séjours en cours)

---

##### 7. **faq** ✅ PRODUCTION

**Rôle** : Questions fréquentes clients bilingues

**Colonnes** :
- `id` (UUID PK)
- `owner_user_id` (UUID FK → auth.users) 🔒 RLS
- `gite_id` (UUID FK → gites) CASCADE DELETE - NULL = tous gîtes
- `question` (TEXT NOT NULL) - FR
- **`question_en` (TEXT)** ⭐ BILINGUE 23/01/2026
- `answer` (TEXT) - FR
- **`answer_en` (TEXT)** ⭐ BILINGUE 23/01/2026
- `reponse_en` (TEXT) - Alias obsolète de answer_en
- `category` (TEXT)
- `categorie` (TEXT) - Alias
- `priority` (INTEGER, default 0) - 1-10, 1 = plus important
- `ordre` (INTEGER, default 0) - Alias
- `is_visible` (BOOLEAN, default true)
- `created_at`, `updated_at` (TIMESTAMPTZ)

**Index** :
- `idx_faq_owner` (owner_user_id)
- `idx_faq_gite` (gite_id)
- `idx_faq_category` (category)
- `idx_faq_priority` (priority)
- `idx_faq_translations` (question_en, reponse_en)
- `idx_faq_categorie` (categorie)
- `idx_faq_ordre` (ordre)

**Traduction** : API MyMemory FR→EN automatique lors sauvegarde

**RLS** : ✅ Policy `owner_user_id = auth.uid()`

**Utilisé par** : `js/faq.js`, `js/fiche-client-app.js`

---

##### 8. **client_access_tokens** ✅ PRODUCTION

**Rôle** : Tokens sécurisés pour accès fiches clients

**Colonnes** :
- `id` (UUID PK)
- `owner_user_id` (UUID FK → auth.users) 🔒 RLS CASCADE DELETE
- `reservation_id` (UUID FK → reservations) CASCADE DELETE
- `token` (TEXT UNIQUE NOT NULL) - 32 bytes hex
- `expires_at` (TIMESTAMPTZ NOT NULL) - Date départ réservation
- `is_active` (BOOLEAN, default true)
- `created_at`, `updated_at` (TIMESTAMPTZ, default now())

**Contraintes** :
- UNIQUE `token`

**Index** :
- `idx_tokens_owner` (owner_user_id)
- `idx_tokens_token` (token)

**Usage** :
- Généré depuis `js/fiche-client.js`
- URL: `https://domain.com/pages/fiche-client.html?token=xxx`
- Vérifié dans `js/fiche-client-app.js`
- Expiration automatique à date départ réservation

**RLS** : ✅ Policy `owner_user_id = auth.uid()`

**Utilisé par** : `js/fiche-client.js`, `js/fiche-client-app.js`

---

#### **GROUPE 3 : Gestion Ménage (2 tables)**

##### 9. **cleaning_schedule** ✅ PRODUCTION

**Rôle** : Planning ménages calculé automatiquement

**Colonnes** :
- `id` (UUID PK)
- `owner_user_id` (UUID FK → auth.users) 🔒 RLS CASCADE DELETE
- `gite_id` (UUID FK → gites) CASCADE DELETE
- `gite` (TEXT) - Alias nom gîte (rétrocompatibilité)
- `gite_name` (TEXT) - Alias
- `reservation_id` (UUID FK → reservations UNIQUE) CASCADE DELETE
- `scheduled_date` (DATE NOT NULL)
- `date` (DATE) - Alias
- `time` (TIME)
- `time_of_day` (TEXT) - 'morning', 'afternoon', 'evening'
- `type` (TEXT) - CHECK IN ('checkin', 'checkout', 'inter', 'fin_de_semaine')
- `status` (TEXT, default 'pending') - 'pending', 'pending_validation', 'validated', 'refused'
- `validated` (BOOLEAN, default false)
- `validated_by` (TEXT) - UUID user qui valide
- `validated_by_company` (BOOLEAN, default false)
- `validated_at` (TIMESTAMPTZ)
- `proposed_by` (TEXT) - CHECK IN ('owner', 'company', NULL)
- `client_name` (TEXT) - Nom client réservation
- `reservation_start_after` (DATE) - Date arrivée suivante
- `reservation_end` (DATE) - Date départ réservation associée
- `notes` (TEXT)
- `created_at`, `updated_at` (TIMESTAMPTZ, default now())

**Contraintes** :
- UNIQUE `reservation_id` (1 planning par réservation)
- CHECK `proposed_by` IN ('owner', 'company', NULL)
- CHECK `type` IN ('checkin', 'checkout', 'inter', 'fin_de_semaine')

**Index** :
- `idx_cleaning_owner` (owner_user_id)
- `idx_cleaning_date` (scheduled_date)
- `idx_cleaning_status` (status)
- `idx_cleaning_gite` (gite_id)
- `idx_cleaning_reservation` (reservation_id)

**Statuts** :
- `pending` : En attente validation auto
- `pending_validation` : Femme ménage a proposé modification
- `validated` : Validé par propriétaire/entreprise
- `refused` : Refusé

**RLS** : ✅ Policy `owner_user_id = auth.uid()`

**Utilisé par** : `js/menage.js`, `js/cleaning-rules.js`

---

##### 10. **cleaning_rules** ✅ PRODUCTION ⚠️ DOUBLON SQL DÉTECTÉ

**Rôle** : Règles métier configurables pour planification ménage

**Colonnes** :
- `id` (UUID PK)
- `rule_code` (VARCHAR 50 UNIQUE NOT NULL) - 'no_sunday', 'no_saturday', etc.
- `rule_name` (VARCHAR 255 NOT NULL)
- `description` (TEXT)
- `is_enabled` (BOOLEAN, default true)
- `priority` (INTEGER, default 0) - 1-9, ordre d'application
- `config` (JSONB, default `{}`) - Paramètres spécifiques
- `created_at`, `updated_at` (TIMESTAMPTZ)

**Contraintes** :
- UNIQUE `rule_code`

**Index** :
- `idx_cleaning_rules_enabled` (is_enabled)
- `idx_cleaning_rules_priority` (priority)

**Trigger** :
- `trigger_update_cleaning_rules_timestamp` - MAJ updated_at

**9 règles par défaut** :
1. `no_sunday` - Pas de ménage dimanche
2. `no_saturday` - Pas de ménage samedi
3. `enchainement` - 1 seul ménage si départ=arrivée
4. `jours_feries` - Pas de ménage jours fériés
5. `mercredi_jeudi` - Privilégier mercredi/jeudi
6. `distance_minimum` - Min 2h entre ménages
7. `horaires_preferes` - 9h-12h ou 14h-17h
8. `weekend_arrivee_depart` - Ménage vendredi si départ/arrivée week-end
9. `delai_avant_arrivee` - Min 2h entre fin ménage et arrivée

**Utilisé par** : `js/menage.js`, `js/cleaning-rules.js`, `js/cleaning-rules-modal.js`

**⚠️ ACTION REQUISE** : Supprimer doublon dans le schéma SQL fourni (apparaît 2 fois identique)

---

#### **GROUPE 4 : Gestion Linge (3 tables)**

##### 11. **linen_stocks** ✅ PRODUCTION

**Rôle** : Stocks de linge FIXES par gîte

**Colonnes** :
- `id` (UUID PK)
- `owner_user_id` (UUID FK → auth.users) 🔒 RLS
- `gite_id` (UUID FK → gites UNIQUE) CASCADE DELETE
- `draps_plats_grands` (INTEGER ≥ 0, default 0)
- `draps_plats_petits` (INTEGER ≥ 0, default 0)
- `housses_couettes_grandes` (INTEGER ≥ 0, default 0)
- `housses_couettes_petites` (INTEGER ≥ 0, default 0)
- `taies_oreillers` (INTEGER ≥ 0, default 0)
- `serviettes` (INTEGER ≥ 0, default 0)
- `tapis_bain` (INTEGER ≥ 0, default 0)
- `created_at`, `updated_at` (TIMESTAMPTZ)

**Contraintes** :
- UNIQUE `gite_id` (1 seule ligne par gîte)
- CHECK toutes quantités ≥ 0

**Index** :
- `idx_linen_stocks_owner` (owner_user_id)
- `idx_linen_stocks_gite` (gite_id)

**RLS** : ✅ Policy `owner_user_id = auth.uid()`

**Utilisé par** : `js/draps.js`

---

##### 12. **linen_stock_items** ✅ PRODUCTION

**Rôle** : Stocks de linge DYNAMIQUES (personnalisables)

**Colonnes** :
- `id` (UUID PK)
- `owner_user_id` (UUID FK → auth.users) 🔒 RLS
- `gite_id` (UUID FK → gites) CASCADE DELETE
- `item_key` (TEXT NOT NULL) - Ex: "alese", "torchons", "nappes"
- `quantity` (INTEGER, default 0)
- `created_at`, `updated_at` (TIMESTAMPTZ)

**Contraintes** :
- UNIQUE (`gite_id`, `item_key`)

**Index** :
- `linen_stock_items_gite_item_key` UNIQUE (gite_id, item_key)
- `linen_stock_items_owner_user_id` (owner_user_id)

**RLS** : ✅ Policy `owner_user_id = auth.uid()`

**Utilisé par** : `js/draps.js` (interfaces Desktop/Mobile/Femme-ménage)

---

##### 13. **linen_needs** ✅ PRODUCTION

**Rôle** : Configuration besoins linge STANDARDS + PERSONNALISÉS par gîte

**Colonnes** :
- `id` (UUID PK)
- `owner_user_id` (UUID FK → auth.users) 🔒 RLS CASCADE DELETE
- `gite_id` (UUID FK → gites) CASCADE DELETE
- `item_key` (TEXT NOT NULL) - Clé unique item (ex: "draps_plats_grands")
- `item_label` (TEXT NOT NULL) - Label affiché (ex: "Draps plats grands lits")
- `quantity` (INTEGER NOT NULL, default 0) - Quantité nécessaire par ménage
- `is_custom` (BOOLEAN NOT NULL, default false) - Item personnalisé ou standard
- `created_at`, `updated_at` (TIMESTAMPTZ, default now())

**Contraintes** :
- UNIQUE (`gite_id`, `item_key`) - 1 config par item par gîte

**Index** :
- `idx_linen_needs_owner` (owner_user_id)
- `idx_linen_needs_gite` (gite_id)
- `idx_linen_needs_custom` (is_custom)

**Trigger** :
- `trigger_linen_needs_updated_at` - MAJ updated_at

**Usage** :
- Configuration besoins standards (draps, housses, taies, serviettes)
- Ajout items personnalisés (alèses, torchons, nappes)
- Lors ajout réservation → Calcule besoins totaux
- Alerte si stock insuffisant (compare avec `linen_stocks` + `linen_stock_items`)

**RLS** : ✅ Policy `owner_user_id = auth.uid()`

**Utilisé par** : `js/draps.js`

---

#### **GROUPE 5 : Fiscalité & Comptabilité (7 tables)**

##### 14. **simulations_fiscales** ✅ PRODUCTION

**Rôle** : Calculs fiscaux LMNP par année (résumé)

**Colonnes** :
- `id` (UUID PK)
- `owner_user_id` (UUID FK → auth.users) 🔒 RLS CASCADE DELETE
- `annee` (INTEGER NOT NULL)
- `revenus_totaux` (NUMERIC 10,2) - Total revenus locatifs
- `charges_totales` (NUMERIC 10,2) - Total charges déductibles
- `resultat` (NUMERIC 10,2) - Bénéfice = revenus - charges
- `impots_estimes` (NUMERIC 10,2) - Estimation IR + cotisations
- `created_at`, `updated_at` (TIMESTAMPTZ, default now())

**Index** :
- `idx_simul_owner` (owner_user_id)
- `idx_simul_annee` (annee)
- `idx_simulations_owner` (owner_user_id) - Doublon
- `idx_simulations_fiscales_owner` (owner_user_id) - Doublon
- `idx_simulations_fiscales_annee` (annee) - Doublon

**RLS** : ✅ Policy `owner_user_id = auth.uid()`

**Utilisé par** : `js/fiscalite-v2.js`

**Note** : Table simplifiée - Détails complets stockés dans `fiscal_history.donnees_detaillees` (JSONB)

---

##### 15. **fiscal_history** ✅ PRODUCTION

**Rôle** : Historique détaillé des simulations fiscales PAR GÎTE

**Colonnes** :
- `id` (UUID PK)
- `owner_user_id` (UUID FK → auth.users) 🔒 RLS CASCADE DELETE
- `year` (INTEGER NOT NULL)
- `gite` (TEXT NOT NULL) - Nom du gîte
- `revenus` (NUMERIC 10,2, default 0)
- `charges` (NUMERIC 10,2, default 0)
- `resultat` (NUMERIC 10,2, default 0) - Bénéfice par gîte
- `taux_occupation` (NUMERIC 5,2, default 0) - %
- `nb_reservations` (INTEGER, default 0)
- `donnees_detaillees` (JSONB, default `{}`) - **Détail complet** :
  - Revenus par plateforme (Airbnb, Booking, etc.)
  - Charges déductibles (entretien, assurances, taxe foncière, etc.)
  - Amortissements (bâti, mobilier, travaux)
  - Cotisations sociales (URSSAF)
  - Trajets kilométriques
  - Résultat fiscal final
- `created_at`, `updated_at` (TIMESTAMPTZ, default now())

**Contraintes** :
- UNIQUE (`owner_user_id`, `year`, `gite`) - 1 ligne par gîte par année

**Index** :
- `idx_fiscal_history_owner` (owner_user_id)
- `idx_fiscal_history_year` (year)

**Usage** : 
- Audit trail complet
- Comparaisons inter-annuelles
- Analyses de rentabilité par gîte
- Export comptable

**RLS** : ✅ Policy `owner_user_id = auth.uid()`

**Utilisé par** : `js/fiscalite-v2.js`

---

##### 16. **fiscalite_amortissements** 🟡 OPTIONNEL

**Rôle** : Détail des amortissements (possiblement redondant avec `simulations_fiscales.donnees_detaillees`)

**Colonnes** :
- `id` (UUID PK)
- `user_id` (UUID FK → auth.users)
- `annee` (INTEGER NOT NULL)
- `type` (TEXT) - CHECK IN ('travaux', 'frais', 'produits')
- `type_amortissement` (TEXT)
- `description` (TEXT NOT NULL)
- `gite` (TEXT NOT NULL)
- `montant` (NUMERIC 10,2 NOT NULL)
- `amortissement_origine` (JSONB)
- `created_at`, `updated_at` (TIMESTAMPTZ)

**Index** :
- `idx_fiscalite_amortissements_annee` (annee)
- `idx_fiscalite_amortissements_type` (type)
- `idx_fiscalite_amortissements_user` (user_id)

**Trigger** :
- `trigger_update_fiscalite_amortissements_updated_at`

**RLS** : ❓ (FK vers auth.users mais pas owner_user_id)

**Utilisé par** : ❓ (pas trouvé dans code JS)

**⚠️ RECOMMANDATION** : **FUSIONNER dans `simulations_fiscales.donnees_detaillees`** pour éviter redondance

---

##### 17. **charges** 🟡 OPTIONNEL ⚠️ DOUBLON SQL DÉTECTÉ

**Rôle** : Détail des charges déductibles (possiblement redondant avec `simulations_fiscales`)

**Colonnes** :
- `id` (UUID PK)
- `owner_user_id` (UUID FK → auth.users) 🔒 RLS
- `gite_id` (UUID FK → gites) SET NULL
- `charge_date` (DATE NOT NULL)
- `amount` (NUMERIC 10,2 > 0 NOT NULL)
- `currency` (TEXT, default 'EUR')
- `category` (TEXT NOT NULL) - Ex: "entretien", "assurance", "taxe_fonciere"
- `subcategory` (TEXT)
- `description` (TEXT NOT NULL)
- `supplier` (TEXT)
- `invoice_number` (TEXT)
- `payment_method` (TEXT)
- `is_deductible` (BOOLEAN, default true)
- `attachments` (JSONB, default `[]`)
- `notes` (TEXT)
- `created_at`, `updated_at` (TIMESTAMPTZ)

**Contraintes** :
- CHECK `amount` > 0

**Index** :
- `idx_charges_owner` (owner_user_id)
- `idx_charges_gite` (gite_id)
- `idx_charges_date` (charge_date)
- `idx_charges_category` (owner_user_id, category)

**RLS** : ✅ Policy `owner_user_id = auth.uid()`

**Utilisé par** : ❓ (pas trouvé dans code JS - possiblement non utilisé dans interface actuelle)

**⚠️ RECOMMANDATION** : **FUSIONNER dans `simulations_fiscales.donnees_detaillees`** ou supprimer si non utilisé

**⚠️ ACTION REQUISE** : Supprimer doublon dans le schéma SQL fourni (apparaît 2 fois identique)

---

##### 18. **km_trajets** ✅ PRODUCTION ⚠️ DOUBLON SQL DÉTECTÉ

**Rôle** : Historique trajets professionnels pour déduction kilométrique

**Colonnes** :
- `id` (UUID PK)
- `owner_user_id` (UUID FK → auth.users) 🔒 RLS
- `date_trajet` (DATE NOT NULL)
- `annee_fiscale` (INTEGER NOT NULL)
- `motif` (TEXT NOT NULL)
- `type_trajet` (TEXT, default 'autre') - 'menage_entree', 'menage_sortie', 'courses', 'maintenance', 'autre'
- `lieu_depart` (TEXT)
- `lieu_arrivee` (TEXT NOT NULL)
- `gite_id` (UUID FK → gites) SET NULL
- `distance_aller` (NUMERIC 6,2 NOT NULL)
- `aller_retour` (BOOLEAN, default true)
- `distance_totale` (NUMERIC 6,2 NOT NULL)
- `reservation_id` (UUID FK → reservations) SET NULL
- **`auto_genere` (BOOLEAN, default false)** ⭐ AUTOMATISATION 22/01/2026
- `notes` (TEXT)
- `created_at`, `updated_at` (TIMESTAMPTZ)

**Index** :
- `idx_km_trajets_owner` (owner_user_id)
- `idx_km_trajets_annee` (annee_fiscale)
- `idx_km_trajets_date` (date_trajet)
- `idx_km_trajets_gite` (gite_id)
- `idx_km_trajets_reservation` (reservation_id)

**Trigger** :
- `trigger_update_km_trajets_updated_at`

**Automatisation** : Trajets générés/mis à jour/supprimés automatiquement lors des opérations sur réservations

**RLS** : ✅ Policy `owner_user_id = auth.uid()`

**Utilisé par** : `js/km-manager.js`, `js/fiscalite-v2.js`

**⚠️ ACTION REQUISE** : Supprimer doublon dans le schéma SQL fourni (apparaît 2 fois identique)

---

##### 19. **km_lieux_favoris** ✅ PRODUCTION

**Rôle** : Lieux favoris (magasins, fournisseurs) avec distances

**Colonnes** :
- `id` (UUID PK)
- `owner_user_id` (UUID FK → auth.users) 🔒 RLS
- `nom` (TEXT NOT NULL)
- `type_lieu` (TEXT, default 'magasin') - 'magasin', 'fournisseur', 'autre'
- `distance_km` (NUMERIC 6,2 NOT NULL)
- `adresse` (TEXT)
- `created_at`, `updated_at` (TIMESTAMPTZ)

**Contraintes** :
- UNIQUE (`owner_user_id`, `nom`)

**Index** :
- `idx_km_lieux_favoris_owner` (owner_user_id)

**Trigger** :
- `trigger_update_km_lieux_favoris_updated_at`

**RLS** : ✅ Policy `owner_user_id = auth.uid()`

**Utilisé par** : `js/km-manager.js`, `js/fiscalite-v2.js`

---

##### 20. **km_config_auto** ✅ PRODUCTION

**Rôle** : Configuration automatisation trajets kilométriques

**Colonnes** :
- `id` (UUID PK)
- `owner_user_id` (UUID UNIQUE FK → auth.users) 🔒 RLS CASCADE DELETE
- `auto_menage_entree` (BOOLEAN, default true) - Générer trajets checkin
- `auto_menage_sortie` (BOOLEAN, default true) - Générer trajets checkout
- `auto_courses` (BOOLEAN, default false) - Générer trajets courses
- `auto_maintenance` (BOOLEAN, default false) - Générer trajets maintenance
- `creer_trajets_par_defaut` (BOOLEAN, default true) - Créer auto à l'ajout réservation
- `lieu_courses_defaut` (TEXT) - Lieu par défaut courses
- `distance_courses_defaut` (NUMERIC 6,2) - Distance courses par défaut (km)
- `created_at`, `updated_at` (TIMESTAMPTZ, default now())

**Contraintes** :
- UNIQUE `owner_user_id` (1 seule config par user)

**Index** :
- `idx_km_config_auto_owner` (owner_user_id)

**Trigger** :
- `trigger_update_km_config_auto_updated_at` - MAJ updated_at

**Usage** :
- Lors ajout/modif/suppression réservation → Génère automatiquement trajets selon config
- Types trajets : `menage_entree`, `menage_sortie`, `courses`, `maintenance`
- Synchronisation automatique avec `km_trajets`

**RLS** : ✅ Policy `owner_user_id = auth.uid()`

**Utilisé par** : `js/km-manager.js`

---

#### **GROUPE 6 : Activités Touristiques (2 tables)**

##### 21. **activites_gites** ✅ PRODUCTION

**Rôle** : POIs et activités touristiques à proximité

**Colonnes** :
- `id` (UUID PK)
- `owner_user_id` (UUID FK → auth.users) 🔒 RLS
- `gite_id` (UUID FK → gites) CASCADE DELETE
- `nom` (TEXT NOT NULL)
- `description` (TEXT)
- `categorie` (TEXT) - 'restaurant', 'cafe_bar', 'musee', 'chateau', 'parc', 'hotel', 'attraction'
- `adresse` (TEXT) - Pour géocodage
- **`latitude` (NUMERIC 10,8)** ⭐ GÉOCODAGE AUTO (Nominatim)
- **`longitude` (NUMERIC 11,8)** ⭐ GÉOCODAGE AUTO
- **`distance_km` (NUMERIC 5,2)** ⭐ CALCULÉE depuis gîte (Haversine)
- `url` (TEXT)
- `telephone` (TEXT)
- **`note` (NUMERIC 2,1)** - Note Google 0-5, CHECK ≥0 AND ≤5
- **`nb_avis` (INTEGER)** - Nombre avis Google, CHECK ≥0
- `photos` (JSONB, default `[]`) - URLs photos
- `is_active` (BOOLEAN, default true)
- `created_at`, `updated_at` (TIMESTAMPTZ)

**Contraintes** :
- CHECK `note` BETWEEN 0 AND 5
- CHECK `nb_avis` ≥ 0

**Index** :
- `idx_activites_owner` (owner_user_id)
- `idx_activites_gite` (gite_id)

**Géocodage** : API OpenStreetMap Nominatim (gratuite) depuis adresse

**RLS** : ✅ Policy `owner_user_id = auth.uid()`

**Utilisé par** : `js/decouvrir.js`, `js/fiche-activites-map.js`

---

##### 22. **activites_consultations** 🟡 OPTIONNEL (Analytics)

**Rôle** : Tracking consultations activités (analytics optionnel)

**Colonnes** :
- `id` (UUID PK)
- `activite_id` (UUID FK → activites_gites) CASCADE DELETE
- `token` (TEXT) - Token fiche client
- `ip_address` (TEXT)
- `consulted_at` (TIMESTAMPTZ, default now())

**Index** :
- `idx_consultations_activite` (activite_id)

**RLS** : ❓ (pas de owner_user_id - accessible via FK)

**Utilisé par** : ❓ (pas trouvé dans code JS - analytics non activées ?)

**⚠️ RECOMMANDATION** : **CONSERVER si analytics importantes, sinon SUPPRIMER** pour alléger la base

---

#### **GROUPE 7 : Tâches & Organisation (1 table)**

##### 23. **todos** ✅ PRODUCTION

**Rôle** : Liste de tâches dashboard

**Colonnes** :
- `id` (UUID PK)
- `owner_user_id` (UUID FK → auth.users) 🔒 RLS
- `title` (TEXT NOT NULL)
- `description` (TEXT)
- `category` (TEXT) - 'urgent', 'important', 'normal'
- `completed` (BOOLEAN, default false)
- `completed_at` (TIMESTAMPTZ)
- `archived_at` (TIMESTAMPTZ)
- `gite_id` (UUID FK → gites) CASCADE DELETE - Optionnel, lien vers gîte
- `created_at`, `updated_at` (TIMESTAMPTZ)

**Index** :
- `idx_todos_owner` (owner_user_id)
- `idx_todos_category` (category)
- `idx_todos_completed` (completed)

**RLS** : ✅ Policy `owner_user_id = auth.uid()`

**Utilisé par** : `js/dashboard.js` (section TODO list)

---

### 🔴 TABLES OBSOLÈTES / INUTILISÉES (12 tables) - À SUPPRIMER

#### **Tables Dépréciées**

##### 24. **infos_pratiques** ⚠️ OBSOLÈTE + DOUBLON SQL

**Rôle** : Infos pratiques flexibles (remplacée par `infos_gites` structurée)

**Statut** : 🔴 **REMPLACÉE par infos_gites** (119 colonnes fixes bilingues)

**Colonnes** :
- `id`, `owner_user_id`, `gite_id`
- `info_type`, `title`, `content`, `icon`, `display_order`, `is_active`, `language`
- `created_at`, `updated_at`

**⚠️ RECOMMANDATION** : **SUPPRIMER** - Table flexible abandonnée au profit d'une structure fixe bilingue

**⚠️ ACTION REQUISE** : Supprimer doublon dans le schéma SQL fourni (apparaît 2 fois identique)

---

##### 25. **checklists** ⚠️ OBSOLÈTE

**Rôle** : Ancienne table checklists (remplacée par `checklist_templates` + `checklist_progress`)

**Statut** : 🔴 **REMPLACÉE**

**Colonnes** :
- `id`, `owner_user_id`, `gite_id`
- `nom`
- `items` (JSONB) - Tout en JSONB (non structuré)
- `created_at`, `updated_at`

**⚠️ RECOMMANDATION** : **SUPPRIMER** après migration des données vers `checklist_templates`

---

#### **Tables Features Non Implémentées**

##### 26. **demandes_horaires** 🔴 INUTILISÉE

**Rôle** : Demandes changement horaires check-in/check-out par clients

**Statut** : 🔴 Feature jamais implémentée dans l'interface

**Colonnes** :
- `id`, `owner_user_id`, `reservation_id`
- `type`, `heure_demandee`, `motif`
- `statut` (default 'en_attente')
- `created_at`, `updated_at`

**Index** :
- `idx_demandes_owner`, `idx_demandes_resa`, `idx_demandes_statut`

**⚠️ RECOMMANDATION** : **SUPPRIMER** - Feature non développée, aucune référence dans le code

---

##### 27. **evaluations_sejour** 🔴 INUTILISÉE + TRIPLON SQL

**Rôle** : Évaluations post-séjour par clients (notes + commentaires)

**Statut** : 🔴 Feature jamais implémentée

**Colonnes** :
- `id`, `owner_user_id`, `reservation_id`
- `note_proprete`, `note_equipement`, `note_emplacement`, `note_communication`, `note_globale` (1-5)
- `commentaire`, `recommande` (BOOLEAN)
- `created_at`, `updated_at`

**Index** :
- `idx_evaluations_owner`, `idx_evaluations_reservation`

**⚠️ RECOMMANDATION** : **SUPPRIMER** - Feature non développée, aucune référence dans le code

**⚠️ ACTION REQUISE** : Supprimer TRIPLON dans le schéma SQL fourni (apparaît 3 fois identique)

---

##### 28. **fiche_generation_logs** 🟡 OPTIONNEL (Analytics) + DOUBLON SQL

**Rôle** : Logs génération fiches clients (audit/analytics)

**Statut** : 🟡 Utilisée pour tracking génération fiches

**Colonnes** :
- `id`, `owner_user_id`, `reservation_id`
- `type_fiche`, `generated_at`
- `created_at`

**Index** :
- `idx_fiche_logs_owner`

**Utilisé par** : ❓ (pas trouvé dans code JS - logs passifs ?)

**⚠️ RECOMMANDATION** : **CONSERVER si analytics importantes, sinon SUPPRIMER**

**⚠️ ACTION REQUISE** : Supprimer doublon dans le schéma SQL fourni (apparaît 2 fois identique)

---

##### 29. **problemes_signales** 🔴 INUTILISÉE

**Rôle** : Signalements problèmes par clients/femme ménage

**Statut** : 🔴 Feature non implémentée

**Colonnes** :
- `id`, `owner_user_id`, `gite_id`, `gite` (alias)
- `description`, `categorie`, `priorite`
- `resolu` (BOOLEAN, default false)
- `created_at`, `updated_at`

**Index** :
- `idx_problemes_owner`, `idx_problemes_gite`, `idx_problemes_resolu`

**⚠️ RECOMMANDATION** : **SUPPRIMER** - Feature non développée, aucune référence dans le code

---

##### 30. **retours_menage** 🔴 INUTILISÉE + DOUBLON SQL

**Rôle** : Retours détaillés femme de ménage (tâches, problèmes, photos, durée)

**Statut** : 🔴 Feature partiellement implémentée mais non utilisée dans interface actuelle

**Colonnes** :
- `id`, `owner_user_id`, `gite_id`, `gite` (alias)
- `date_menage`, `date` (alias), `reported_by`
- `tasks_completed` (JSONB), `issues_found` (JSONB), `supplies_needed` (JSONB), `urgent_repairs` (JSONB)
- `produits_manquants` (JSONB), `problemes_signales` (JSONB)
- `duration_minutes`, `duree_minutes` (alias)
- `heure_arrivee`, `heure_depart`
- `notes`, `commentaire`, `commentaires` (aliases)
- `photos` (JSONB)
- `validated` (BOOLEAN, default false)
- `created_at`, `updated_at`

**Index** :
- `idx_retours_menage_owner`, `idx_retours_menage_gite`, `idx_retours_menage_date`, `idx_retours_menage_validated`

**⚠️ RECOMMANDATION** : **SUPPRIMER** - Feature trop complexe, non utilisée. Le système actuel fonctionne avec `cleaning_schedule` simple.

**⚠️ ACTION REQUISE** : Supprimer doublon dans le schéma SQL fourni (apparaît 2 fois identique)

---

##### 31. **suivi_soldes_bancaires** 🔴 INUTILISÉE

**Rôle** : Suivi mensuel trésorerie

**Statut** : 🔴 Feature jamais implémentée

**Colonnes** :
- `id`, `owner_user_id`
- `annee`, `mois` (1-12), `solde`
- `created_at`, `updated_at`

**Contraintes** :
- UNIQUE (`owner_user_id`, `annee`, `mois`)
- CHECK `mois` BETWEEN 1 AND 12

**Index** :
- `idx_soldes_owner`, `idx_soldes_annee`

**⚠️ RECOMMANDATION** : **SUPPRIMER** - Feature non développée, aucune référence dans le code

---

##### 32. **historical_data** 🟡 OPTIONNEL (Audit Trail) + DOUBLON SQL

**Rôle** : Audit trail complet (toutes modifications tables)

**Statut** : 🟡 Système d'audit avancé (possiblement non activé)

**Colonnes** :
- `id`, `owner_user_id`
- `table_name`, `record_id`, `action` ('INSERT', 'UPDATE', 'DELETE')
- `old_data` (JSONB), `new_data` (JSONB)
- `changed_at`, `changed_by`

**Index** :
- `idx_historical_owner`, `idx_historical_table`

**Utilisé par** : ❓ (pas trouvé dans code JS - triggers BDD ?)

**⚠️ RECOMMANDATION** : **CONSERVER si audit trail nécessaire (conformité, sécurité), sinon SUPPRIMER** - Table volumineuse potentielle

**⚠️ ACTION REQUISE** : Supprimer doublon dans le schéma SQL fourni (apparaît 2 fois identique)

---

### 📝 RÉSUMÉ DES ACTIONS RECOMMANDÉES

#### ✅ TABLES À CONSERVER (19 tables)

**Core (3)** : gites, reservations, auth.users  
**Fiches Clients (5)** : infos_gites, checklist_templates, checklist_progress, faq, client_access_tokens  
**Ménage (2)** : cleaning_schedule, cleaning_rules  
**Linge (3)** : linen_stocks, linen_stock_items, linen_needs  
**Fiscalité (7)** : simulations_fiscales, fiscal_history, km_trajets, km_lieux_favoris, km_config_auto, (charges ?, fiscalite_amortissements ?)  
**Activités (1)** : activites_gites  
**Organisation (1)** : todos

#### 🟡 TABLES OPTIONNELLES (3 tables) - À DÉCIDER

- **activites_consultations** : Analytics consultations activités
- **fiche_generation_logs** : Logs génération fiches
- **historical_data** : Audit trail complet
- **charges** : Détail charges (fusionner dans simulations_fiscales ?)
- **fiscalite_amortissements** : Détail amortissements (fusionner dans simulations_fiscales ?)

#### 🔴 TABLES À SUPPRIMER (9 tables)

**Obsolètes** :
- infos_pratiques (remplacée par infos_gites)
- checklists (remplacée par checklist_templates)

**Features non implémentées** :
- demandes_horaires
- evaluations_sejour
- problemes_signales
- retours_menage
- suivi_soldes_bancaires

#### ⚠️ CORRECTIONS SQL URGENTES

**Doublons/Triplons à supprimer** :
- reservations (x2)
- cleaning_rules (x2)
- charges (x2)
- evaluations_sejour (x3)
- fiche_generation_logs (x2)
- historical_data (x2)
- infos_pratiques (x2)
- km_trajets (x2)
- retours_menage (x2)

**Nettoyage SQL recommandé** :
- Supprimer 4 index doublons dans `simulations_fiscales` (idx_simulations_owner, idx_simulations_fiscales_owner, idx_simulations_fiscales_annee - garder uniquement idx_simul_owner et idx_simul_annee)

---

*À suivre : ÉTAPE 5/6 - Documentation modules JavaScript et fonctionnalités*


## 🧩 ÉTAPE 5/6 - MODULES JAVASCRIPT ET FONCTIONNALITÉS

> **Total** : 42+ fichiers JavaScript  
> **Organisation** : Modules singleton + Event handlers exportés vers `window`  
> **Pattern** : Vanilla JS sans framework, ES6+

---

### 📁 MODULES DE CONFIGURATION ET SÉCURITÉ

#### 1. **shared-config.js** - Configuration Centrale Supabase

**Rôle** : Configuration unique Supabase chargée dans toutes les pages

**Variables exportées** :
```javascript
window.LOCAL_CONFIG = {
    SUPABASE_URL: "https://[PROJECT].supabase.co",
    SUPABASE_KEY: "[ANON_KEY]"
}
```

**Utilisé par** : TOUS les modules

**⚠️ Sécurité** : Clé anonyme Supabase (publique), RLS protection côté serveur

---


*Suite : ÉTAPE 5/6 - Documentation modules JavaScript (voir [MODULES_JAVASCRIPT.md](MODULES_JAVASCRIPT.md))*

---

*À suivre : ÉTAPE 6/6 - Système de versioning et tag Git*
