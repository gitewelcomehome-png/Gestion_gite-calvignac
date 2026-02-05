# 📄 DOCUMENTATION COMPLÈTE - FICHE CLIENT

## 🎯 Vue d'ensemble

La **Fiche Client** est une Progressive Web App (PWA) interactive destinée aux **locataires des gîtes** (clients finaux des propriétaires). Cette page leur fournit toutes les informations nécessaires pour leur séjour : codes d'accès, Wi-Fi, règles de la maison, activités locales, etc.

**🔗 URL** : `/pages/fiche-client.html?token=<secure_token>`

**👥 Public cible** : Clients/locataires des gîtes (vacanciers)

**🔒 Sécurité** : Accès par token sécurisé unique, sans authentification

---

## 📋 TABLE DES MATIÈRES

1. [Architecture Technique](#architecture-technique)
2. [Système de Tokens](#système-de-tokens)
3. [Structure de la Page](#structure-de-la-page)
4. [Base de Données](#base-de-données)
5. [Fonctionnalités par Onglet](#fonctionnalités-par-onglet)
6. [Système de Traduction](#système-de-traduction)
7. [PWA & Offline](#pwa--offline)
8. [Variables JavaScript](#variables-javascript)
9. [Fonctions Principales](#fonctions-principales)

---

## 🏗️ Architecture Technique

### **Technologies utilisées**

| Bibliothèque/Service | Version | Usage |
|---------------------|---------|-------|
| **Supabase** | v2 | Base de données PostgreSQL |
| **Leaflet** | 1.9.4 | Cartes interactives (activités) |
| **DOMPurify** | 3.1.7 | Protection XSS (Phase 3 sécurité) |
| **Lucide Icons** | Latest | Icônes SVG modernes |
| **Font Awesome** | 6.5.1 | Icônes supplémentaires |
| **Google Maps API** | - | Cartes d'activités, itinéraires |

### **Fichiers**

```
pages/fiche-client.html              → Structure HTML (1865 lignes)
js/fiche-client-app.js               → Logique principale (2808 lignes)
js/fiche-client.js                   → Génération token/modal (218 lignes)
js/fiche-activites-map.js            → Gestion carte activités
js/security-utils.js                 → Utilitaires sécurité XSS
sw-fiche-client.js                   → Service Worker PWA (désactivé)
```

### **Configuration Supabase**

```javascript
SUPABASE_URL: 'https://fgqimtpjjhdqeyyaptoj.supabase.co'
SUPABASE_KEY: 'eyJhbGci...' // Clé publique ANON
```

**Référence client globale** : `window.ficheClientSupabase`

---

## 🔐 Système de Tokens

### **Génération du token**

**Fonction** : `aperçuFicheClient(reservationId)` dans `fiche-client.js`

**Processus** :
1. Recherche d'un token existant actif et non expiré
2. Si aucun token : génération d'un nouveau token de 64 caractères hexadécimaux
3. Calcul de l'expiration : **date de départ + 7 jours**
4. Sauvegarde dans `client_access_tokens`

```javascript
// Génération cryptographique sécurisée
function generateSecureToken() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => 
        byte.toString(16).padStart(2, '0')
    ).join('');
}
```

### **Validation du token**

**Fonction** : `loadReservationData()` dans `fiche-client-app.js`

**Vérifications** :
- Token présent dans l'URL (`?token=...`)
- Token existe dans la table `client_access_tokens`
- Token est actif (`is_active = true`)
- Token non expiré (`expires_at > NOW()`)

**Si invalide** : Affichage d'un écran d'erreur

---

## 🎨 Structure de la Page

### **Header fixe**

```html
<header class="header">
    <h1 id="clientName">Bienvenue [Nom Client]</h1>
    <p id="giteName">[Nom du Gîte]</p>
    
    <!-- Sélecteur de langue -->
    <div class="language-switch">
        <button class="language-btn active" data-lang="fr">FR</button>
        <button class="language-btn" data-lang="en">EN</button>
    </div>
    
    <!-- Bouton partage -->
    <button id="btnShare">
        <i data-lucide="share-2"></i> Partager
    </button>
</header>
```

### **Navigation par onglets**

7 onglets avec navigation horizontale scrollable :

| Icône | Onglet | ID | Contenu principal |
|-------|--------|-----|------------------|
| 🏠 | **Entrée** | `tab-entree` | Adresse, codes, WiFi, horaires arrivée |
| ✨ | **Pendant** | `tab-pendant` | Équipements, règlement, contacts urgence |
| 🧳 | **Sortie** | `tab-sortie` | Horaires départ, checklists |
| 📍 | **Activités** | `tab-activites` | Carte interactive, POI, commerces |
| 💬 | **Demandes** | `tab-probleme` | Formulaire de demandes/problèmes |
| ⭐ | **Évaluation** | `tab-evaluation` | Notation du séjour |
| ❓ | **FAQ** | `tab-faq` | Questions fréquentes |

### **Layout responsive**

```css
/* Mobile-first design */
.main-content {
    max-width: 768px;
    margin: 0 auto;
    padding: 1rem;
}

/* Header fixe */
.header {
    position: fixed;
    top: 0;
    z-index: 100;
}

/* Tabs avec scroll horizontal */
.tab-navigation {
    position: sticky;
    top: [header-height];
    overflow-x: auto;
    scroll-behavior: smooth;
}
```

---

## 🗄️ Base de Données

### **Tables principales**

#### **1. `client_access_tokens`** - Tokens d'accès sécurisés

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | uuid | PK auto |
| `token` | text | Token unique (64 chars hex) |
| `reservation_id` | integer | FK → reservations.id |
| `owner_user_id` | uuid | FK → auth.users |
| `expires_at` | timestamp | Date expiration (départ + 7j) |
| `is_active` | boolean | Token actif/révoqué |
| `created_at` | timestamp | Date création |
| `updated_at` | timestamp | Dernière modification |

**Index** : `token` (UNIQUE), `reservation_id`

#### **2. `infos_gites`** - Informations des gîtes

| Colonne | Type | Multilingue | Description |
|---------|------|-------------|-------------|
| `id` | integer | - | PK auto |
| `gite` | text | - | Nom du gîte (lowercase) |
| `gite_id` | integer | - | FK → residences.id |
| `adresse` | text | ✅ | Adresse complète |
| `gps_lat` | numeric | - | Latitude GPS |
| `gps_lon` | numeric | - | Longitude GPS |
| `wifi_ssid` | text | - | Nom réseau WiFi |
| `wifi_password` | text | - | Mot de passe WiFi |
| `heure_arrivee` | text | ✅ | Heure check-in |
| `heure_depart` | text | ✅ | Heure check-out |
| `code_acces` | text | - | Code porte/boîte à clés |
| `instructions_cles` | text | ✅ | Instructions accès |
| `parking_dispo` | boolean | - | Parking disponible |
| `parking_details` | text | ✅ | Détails parking |
| `type_chauffage` | text | ✅ | Type de chauffage |
| `climatisation` | boolean | - | Climatisation oui/non |
| `instructions_chauffage` | text | ✅ | Mode d'emploi |
| `equipements_cuisine` | text | ✅ | Liste équipements |
| `instructions_tri` | text | ✅ | Tri des déchets |
| `tabac` | text | ✅ | Règle tabac |
| `animaux` | text | ✅ | Règle animaux |
| `telephone` | text | - | Tél propriétaire |
| `email` | text | - | Email propriétaire |

**Champs dupliqués avec suffixe `_en`** pour traduction anglaise (ex: `adresse_en`)

**Normalisation du nom** : Toujours en minuscules via `normalizeGiteName()`

#### **3. `activites_gites`** - Points d'intérêt et commerces

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | integer | PK auto |
| `gite_id` | integer | FK → residences.id (ou NULL = tous gîtes) |
| `nom` | text | Nom de l'activité |
| `categorie` | text | Type (restaurant, visite, commerce...) |
| `description` | text | Description complète |
| `adresse` | text | Adresse |
| `latitude` | numeric | Latitude GPS |
| `longitude` | numeric | Longitude GPS |
| `distance_km` | numeric | Distance depuis gîte (km) |
| `telephone` | text | Téléphone |
| `site_web` | text | Site web |
| `horaires` | text | Horaires d'ouverture |
| `image` | text | URL image |
| `is_active` | boolean | Actif/inactif |

#### **4. `faq`** - Questions fréquentes

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | integer | PK auto |
| `gite_id` | integer | FK (ou NULL = tous gîtes) |
| `categorie` | text | Catégorie (arrivee, wifi, parking...) |
| `question` | text | Question FR |
| `question_en` | text | Question EN |
| `reponse` | text | Réponse FR |
| `reponse_en` | text | Réponse EN |
| `ordre` | integer | Ordre d'affichage |

#### **5. `checklist_templates`** - Templates checklists

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | integer | PK auto |
| `gite_id` | integer | FK → residences.id |
| `type` | text | 'entree' ou 'sortie' |
| `texte` | text | Texte FR |
| `texte_en` | text | Texte EN |
| `ordre` | integer | Ordre d'affichage |
| `actif` | boolean | Actif/inactif |

#### **6. `checklist_progress`** - Progression checklists

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | integer | PK auto |
| `reservation_id` | integer | FK → reservations.id |
| `template_id` | integer | FK → checklist_templates.id |
| `completed` | boolean | Coché/non coché |
| `completed_at` | timestamp | Date validation |

#### **7. `demandes_clients`** - Demandes/problèmes clients

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | integer | PK auto |
| `reservation_id` | integer | FK → reservations.id |
| `gite` | text | Nom du gîte |
| `type` | text | demande/retour/amelioration/probleme |
| `sujet` | text | Titre demande |
| `description` | text | Description détaillée |
| `urgence` | text | basse/normale/haute |
| `statut` | text | en_attente/en_cours/resolu |
| `created_at` | timestamp | Date création |

#### **8. `evaluations_sejour`** - Évaluations clients

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | integer | PK auto |
| `reservation_id` | integer | FK → reservations.id |
| `gite` | text | Nom du gîte |
| `note_globale` | integer | Note /5 |
| `note_proprete` | integer | Note /5 |
| `note_confort` | integer | Note /5 |
| `note_emplacement` | integer | Note /5 |
| `note_equipements` | integer | Note /5 |
| `note_rapport_qp` | integer | Note /5 |
| `commentaire` | text | Commentaire général |
| `points_positifs` | text | Points positifs |
| `points_ameliorer` | text | Points à améliorer |
| `recommandation` | text | Recommande oui/non |
| `created_at` | timestamp | Date évaluation |

---

## 📑 Fonctionnalités par Onglet

### **1️⃣ ONGLET ENTRÉE** (`tab-entree`)

#### **Sections**

##### **A. Adresse du gîte**
```javascript
// Récupération depuis infos_gites
const adresse = currentLanguage === 'fr' 
    ? giteInfo.adresse 
    : giteInfo.adresse_en || giteInfo.adresse;

// Lien Google Maps
const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(adresse)}`;
```

##### **B. Horaire d'arrivée**

**Affichage dynamique** :
- Heure standard depuis `giteInfo.heure_arrivee`
- Règles d'arrivée anticipée basées sur `cleaningScheduleAvant`

**Demande d'arrivée anticipée** :
```javascript
// Formulaire avec sélection horaire
// Options générées de 13h à heure_arrivee-1h
// Sauvegarde dans demandes_clients
```

**Règles automatiques** :
- **13h-17h** : Validation manuelle (ménage en cours)
- **Après 17h** : Validation automatique

##### **C. Code d'entrée**

```html
<div class="code-display">
    <div class="code-value">1234</div>
</div>
```

Animation glow CSS sur le code pour attirer l'attention.

##### **D. Instructions d'accès**

```javascript
const instructions = currentLanguage === 'fr'
    ? giteInfo.instructions_cles
    : giteInfo.instructions_cles_en;
```

Affichage avec `white-space: pre-line` pour préserver sauts de ligne.

##### **E. WiFi**

```javascript
// Génération QR Code automatique
const wifiString = `WIFI:T:WPA;S:${ssid};P:${password};;`;
// Librairie QRCode.js pour génération
```

Boutons copier pour SSID et mot de passe.

##### **F. Parking**

```javascript
if (giteInfo.parking_dispo) {
    // Afficher détails parking
    // Places, type, instructions
}
```

##### **G. Checklist d'arrivée**

```javascript
await loadClientChecklists();
// Charge checklist_templates type='entree'
// Affiche progression avec barre %
// Sauvegarde états dans checklist_progress
```

**Barre de progression** :
```javascript
const completed = items.filter(i => progressMap[i.id]).length;
const percent = Math.round((completed / total) * 100);
```

---

### **2️⃣ ONGLET PENDANT** (`tab-pendant`)

#### **Sections**

##### **A. Équipements**

**Catégories** :
- 🍳 **Cuisine** : `equipements_cuisine`, instructions four/plaques/lave-vaisselle
- 🌡️ **Chauffage/Clim** : `type_chauffage`, `climatisation`, `instructions_chauffage`
- 🧺 **Linge** : `linge_fourni`, `lave_linge`, `seche_linge`, `fer_repasser`
- 🛏️ **Chambres** : `configuration_chambres`

```javascript
function initOngletPendant() {
    // Générer cards équipements selon langue
    // Afficher si champs remplis uniquement
}
```

##### **B. Règlement intérieur**

```javascript
const regles = {
    tabac: giteInfo.tabac / giteInfo.tabac_en,
    animaux: giteInfo.animaux / giteInfo.animaux_en,
    nb_max_personnes: giteInfo.nb_max_personnes,
    caution: giteInfo.caution
};
```

##### **C. Tri des déchets**

```javascript
const tri = {
    instructions: giteInfo.instructions_tri / _en,
    jours_collecte: giteInfo.jours_collecte / _en,
    decheterie: giteInfo.decheterie / _en
};
```

##### **D. Contacts d'urgence**

```javascript
const contacts = {
    telephone: giteInfo.telephone,
    email: giteInfo.email,
    urgences: {
        pompiers: '18 / 112',
        samu: '15',
        police: '17',
        gendarmerie: '17'
    },
    consignes: giteInfo.consignes_urgence / _en,
    detecteur_fumee: giteInfo.detecteur_fumee,
    extincteur: giteInfo.extincteur,
    coupure_eau: giteInfo.coupure_eau / _en,
    disjoncteur: giteInfo.disjoncteur / _en
};
```

---

### **3️⃣ ONGLET SORTIE** (`tab-sortie`)

#### **Sections**

##### **A. Horaire de départ**

```javascript
const heureDepart = giteInfo.heure_depart; // Ex: "11:00"
```

##### **B. Demande de départ tardif**

**Règles automatiques** :
```javascript
const dateDepart = new Date(reservationData.check_out);
const dayOfWeek = dateDepart.getDay();

if (cleaningScheduleApres) {
    // Ménage prévu l'après-midi → Impossible
} else if (dayOfWeek === 0) {
    // Dimanche → Jusqu'à 17h possible
} else {
    // En semaine → Jusqu'à 12h possible
}
```

##### **C. Instructions de départ**

```javascript
const instructions = giteInfo.checklist_depart / _en;
const restitutionCles = giteInfo.restitution_cles / _en;
```

##### **D. Checklist de sortie**

Identique à checklist entrée, type `sortie`.

---

### **4️⃣ ONGLET ACTIVITÉS** (`tab-activites`)

#### **A. Carte interactive Google Maps**

```javascript
const giteLat = giteInfo.gps_lat;
const giteLon = giteInfo.gps_lon;

// Iframe Google Maps avec marqueur gîte
const mapUrl = `https://www.google.com/maps/embed/v1/place?key=...&q=${lat},${lon}`;
```

#### **B. Liste des activités**

```javascript
const { data: activites } = await supabase
    .from('activites_gites')
    .select('*')
    .eq('gite_id', reservationData.gite_id)
    .eq('is_active', true)
    .order('distance_km');
```

**Cards activités** :
```html
<div class="activite-card" onclick="openActiviteModal(activite)">
    <div class="activite-icon">🎨</div>
    <div class="activite-info">
        <h4>Nom activité</h4>
        <span class="activite-categorie">Catégorie</span>
        <p class="activite-distance">2.5 km</p>
    </div>
    <button onclick="openItineraire(lat, lng)">
        🗺️ Itinéraire
    </button>
</div>
```

#### **C. Modal détail activité**

```javascript
function openActiviteModal(activite) {
    // Affiche image, description, horaires, contact
    // Bouton itinéraire Google Maps
}
```

---

### **5️⃣ ONGLET DEMANDES** (`tab-probleme`)

#### **Formulaire**

```javascript
const formData = {
    reservation_id: reservationData.id,
    gite: reservationData.gite,
    type: 'demande' | 'retour' | 'amelioration' | 'probleme',
    sujet: string,
    description: string,
    urgence: 'basse' | 'normale' | 'haute', // Si type=probleme
    statut: 'en_attente'
};

await supabase.from('demandes_clients').insert([formData]);
```

**Types** :
- **Demande** : Besoin spécifique
- **Retour** : Feedback positif/négatif
- **Amélioration** : Suggestion
- **Problème** : Dysfonctionnement (avec niveau urgence)

---

### **6️⃣ ONGLET ÉVALUATION** (`tab-evaluation`)

#### **Bloc pédagogique**

Message expliquant l'impact des notes :
- ✅ **5/5** = Norme attendue (tout s'est bien passé)
- ⚠️ **4/5 ou moins** = Impact majeur sur visibilité
- 💬 **Problème ?** → Contacter AVANT de noter

#### **Système de notation**

```javascript
const notes = {
    note_globale: 1-5,
    note_proprete: 1-5,
    note_confort: 1-5,
    note_emplacement: 1-5,
    note_equipements: 1-5,
    note_rapport_qp: 1-5
};
```

**Stars rating** :
```javascript
function initStarRating() {
    // Étoiles cliquables avec effet hover
    // Sauvegarde dans champ hidden
}
```

#### **Formulaire complet**

```javascript
const evaluation = {
    ...notes,
    commentaire: string,
    points_positifs: string,
    points_ameliorer: string,
    recommandation: 'oui' | 'non'
};

await supabase.from('evaluations_sejour').insert([evaluation]);
```

---

### **7️⃣ ONGLET FAQ** (`tab-faq`)

#### **Chargement**

```javascript
const { data: faqs } = await supabase
    .from('faq')
    .select('*')
    .or(`gite_id.eq.${giteId},gite_id.is.null`)
    .order('ordre');
```

#### **Filtres par catégorie**

```javascript
const categories = [...new Set(faqs.map(f => f.categorie))];
// Boutons de filtre dynamiques
```

#### **Recherche**

```javascript
const searchTerm = input.value.toLowerCase();
const filtered = faqs.filter(faq => {
    const question = currentLanguage === 'fr' 
        ? faq.question 
        : faq.question_en;
    const reponse = currentLanguage === 'fr' 
        ? faq.reponse 
        : faq.reponse_en;
    
    return question.includes(searchTerm) || reponse.includes(searchTerm);
});
```

#### **Accordéons**

```html
<div class="faq-item" onclick="toggleFaq(this)">
    <div class="faq-question">
        Question
        <span class="faq-toggle">▼</span>
    </div>
    <div class="faq-reponse">Réponse</div>
</div>
```

---

## 🌍 Système de Traduction

### **Variables globales**

```javascript
var currentLanguage = 'fr'; // Langue active

const translations = {
    fr: { /* ... */ },
    en: { /* ... */ }
};
```

### **Fonction de traduction**

```javascript
function t(key) {
    return translations[currentLanguage][key] || key;
}
```

### **Attributs HTML data-i18n**

```html
<span data-i18n="bienvenue">Bienvenue</span>
<input data-i18n-placeholder="rechercher_faq" placeholder="...">
<option data-i18n-option="urgence_basse">Basse</option>
```

### **Mise à jour dynamique**

```javascript
function updateTranslations() {
    // 1. Textes avec data-i18n
    document.querySelectorAll('[data-i18n]').forEach(el => {
        el.textContent = t(el.getAttribute('data-i18n'));
    });
    
    // 2. Placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        el.placeholder = t(el.getAttribute('data-i18n-placeholder'));
    });
    
    // 3. Recharger onglets avec contenu dynamique
    initOngletEntree();
    initOngletPendant();
    initOngletSortie();
    loadClientChecklists();
}
```

### **Changement de langue**

```javascript
document.querySelectorAll('.language-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        currentLanguage = this.getAttribute('data-lang');
        updateTranslations();
        
        // Mise à jour visuelle des boutons
        document.querySelectorAll('.language-btn')
            .forEach(b => b.classList.remove('active'));
        this.classList.add('active');
    });
});
```

### **Traduction automatique FR → EN**

```javascript
async function autoTranslateGiteInfoIfNeeded() {
    // Si champ FR rempli et EN vide
    // → Traduction via API MyMemory (gratuite)
    
    const apiUrl = `https://api.mymemory.translated.net/get?q=${text}&langpair=fr|en`;
    
    // Sauvegarde auto en base
    await supabase
        .from('infos_gites')
        .update({ [field + '_en']: translated })
        .eq('gite', gite);
}
```

**Limite** : 10 000 requêtes/jour

---

## 📱 PWA & Offline

### **Manifest PWA**

```html
<!-- Désactivé en dev pour éviter 404 sur Vercel -->
<!-- <link rel="manifest" href="/manifest.json"> -->

<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
```

### **Service Worker**

```javascript
// DÉSACTIVÉ temporairement (404 Vercel)
if (false && 'serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw-fiche-client.js');
}
```

**TODO** : Résoudre problème déploiement `sw-fiche-client.js` sur Vercel

### **Banner d'installation**

```html
<div id="pwaInstallBanner" class="pwa-install-banner">
    <button id="pwaInstallBtn">Installer</button>
    <button id="pwaDismissBtn">Plus tard</button>
</div>
```

```javascript
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    document.getElementById('pwaInstallBanner').classList.add('show');
});

document.getElementById('pwaInstallBtn').addEventListener('click', async () => {
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    // ...
});
```

---

## 🧩 Variables JavaScript Globales

```javascript
// Configuration
const SUPABASE_URL = '...';
const SUPABASE_KEY = '...';
var supabase = window.ficheClientSupabase;

// État application
var currentLanguage = 'fr';
var token = null;

// Données
var reservationData = null;      // Réservation active
var giteInfo = null;              // Infos du gîte
var cleaningScheduleAvant = null; // Ménage avant arrivée
var cleaningScheduleApres = null; // Ménage après départ

// Caches
var cachedTemplatesEntree = [];
var cachedTemplatesSortie = [];
var cachedProgressMap = {};
var cachedFaqs = [];
var allFaqs = [];
var currentFaqCategory = 'tous';

// Carte
var mapActivites = null; // Instance Leaflet
```

---

## ⚙️ Fonctions Principales

### **Initialisation**

```javascript
document.addEventListener('DOMContentLoaded', async () => {
    currentLanguage = 'fr'; // Force FR au démarrage
    
    // Récupérer token depuis URL
    const urlParams = new URLSearchParams(window.location.search);
    token = urlParams.get('token');
    
    if (!token) {
        // Afficher écran erreur
        return;
    }
    
    // Charger données
    await loadReservationData();
    await loadGiteInfo();
    await loadCleaningSchedule();
    await autoTranslateGiteInfoIfNeeded(); // Traduction auto FR→EN
    
    // Initialiser UI
    initializeUI();
    initTabNavigation();
    initShareButton();
    initModalActivite();
    
    // Charger checklists
    await loadClientChecklists();
    
    // Masquer loading
    document.getElementById('loadingScreen').style.display = 'none';
});
```

### **Chargement données**

#### **loadReservationData()**

```javascript
async function loadReservationData() {
    // Valider token
    const { data: tokenData } = await supabase
        .from('client_access_tokens')
        .select('*, reservations(*)')
        .eq('token', token)
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString())
        .single();
    
    if (!tokenData) {
        // Token invalide/expiré
        showErrorScreen();
        return;
    }
    
    reservationData = tokenData.reservations;
}
```

#### **loadGiteInfo()**

```javascript
async function loadGiteInfo() {
    const giteName = normalizeGiteName(reservationData.gite);
    
    const { data } = await supabase
        .from('infos_gites')
        .select('*')
        .eq('gite', giteName)
        .single();
    
    giteInfo = data;
}
```

#### **loadCleaningSchedule()**

```javascript
async function loadCleaningSchedule() {
    const giteId = reservationData.gite_id;
    const checkIn = reservationData.check_in;
    const checkOut = reservationData.check_out;
    
    // Ménage AVANT (jour arrivée)
    const { data: avant } = await supabase
        .from('cleaning_schedule')
        .select('*')
        .eq('gite_id', giteId)
        .eq('date', checkIn);
    
    cleaningScheduleAvant = avant?.[0];
    
    // Ménage APRÈS (jour départ)
    const { data: apres } = await supabase
        .from('cleaning_schedule')
        .select('*')
        .eq('gite_id', giteId)
        .eq('date', checkOut);
    
    cleaningScheduleApres = apres?.[0];
}
```

### **Navigation onglets**

```javascript
function initTabNavigation() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            
            // Masquer tous les onglets
            document.querySelectorAll('.tab-content')
                .forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-btn')
                .forEach(b => b.classList.remove('active'));
            
            // Afficher onglet sélectionné
            document.getElementById(`tab-${tabId}`).classList.add('active');
            this.classList.add('active');
            
            // Initialiser contenu si nécessaire
            if (tabId === 'activites') initOngletActivites();
            if (tabId === 'faq') initOngletFaq();
        });
    });
}
```

### **Partage**

```javascript
async function sharePageLink() {
    const url = window.location.href;
    
    // Menu bottom sheet avec options :
    // - WhatsApp
    // - Email
    // - Copier lien
    // - Native share API (si disponible)
    
    // Exemple WhatsApp
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(url)}`;
    window.open(whatsappUrl, '_blank');
}
```

### **Checklists**

```javascript
async function loadClientChecklists() {
    // Charger templates
    const { data: entree } = await supabase
        .from('checklist_templates')
        .select('*')
        .eq('gite_id', reservationData.gite_id)
        .eq('type', 'entree')
        .eq('actif', true)
        .order('ordre');
    
    // Charger progression
    const { data: progress } = await supabase
        .from('checklist_progress')
        .select('*')
        .eq('reservation_id', reservationData.id);
    
    // Map progression
    const progressMap = {};
    progress?.forEach(p => {
        progressMap[p.template_id] = p.completed;
    });
    
    // Render
    renderClientChecklist('entree', entree, progressMap);
}

function renderClientChecklist(type, templates, progressMap) {
    // Calculer %
    const completed = templates.filter(t => progressMap[t.id]).length;
    const percent = Math.round((completed / total) * 100);
    
    // Afficher items
    templates.forEach(template => {
        const texte = currentLanguage === 'fr' 
            ? template.texte 
            : template.texte_en;
        
        html += `
            <div class="checkbox-group ${progressMap[template.id] ? 'checked' : ''}">
                <input type="checkbox" 
                       ${progressMap[template.id] ? 'checked' : ''}
                       onchange="toggleChecklistItem(${template.id}, this.checked, ${reservationData.id})">
                <label>${texte}</label>
            </div>
        `;
    });
}

async function toggleChecklistItem(templateId, checked, reservationId) {
    // Upsert progression
    await supabase
        .from('checklist_progress')
        .upsert({
            reservation_id: reservationId,
            template_id: templateId,
            completed: checked,
            completed_at: checked ? new Date().toISOString() : null
        });
    
    // Recharger affichage
    await loadClientChecklists();
}
```

### **Demandes/Problèmes**

```javascript
async function submitRetourDemande(event) {
    event.preventDefault();
    
    const formData = {
        reservation_id: reservationData.id,
        gite: reservationData.gite,
        type: document.getElementById('typeRetourDemande').value,
        sujet: document.getElementById('sujetDemande').value,
        description: document.getElementById('descriptionDemande').value,
        urgence: document.getElementById('urgenceDemande')?.value || 'normale',
        statut: 'en_attente',
        created_at: new Date().toISOString()
    };
    
    const { error } = await supabase
        .from('demandes_clients')
        .insert([formData]);
    
    if (error) throw error;
    
    // Afficher confirmation
    document.getElementById('formRetoursDemande').style.display = 'none';
    document.getElementById('confirmationRetourDemande').style.display = 'block';
}
```

### **Évaluations**

```javascript
async function submitEvaluation(event) {
    event.preventDefault();
    
    const formData = {
        reservation_id: reservationData.id,
        gite: reservationData.gite,
        note_globale: parseInt(document.getElementById('noteGlobale').value),
        note_proprete: parseInt(document.getElementById('noteProprete').value),
        note_confort: parseInt(document.getElementById('noteConfort').value),
        note_emplacement: parseInt(document.getElementById('noteEmplacement').value),
        note_equipements: parseInt(document.getElementById('noteEquipements').value),
        note_rapport_qp: parseInt(document.getElementById('noteRapportQP').value),
        commentaire: document.getElementById('commentaireEvaluationSejour').value,
        points_positifs: document.getElementById('pointsPositifsSejour').value,
        points_ameliorer: document.getElementById('pointsAmeliorerSejour').value,
        recommandation: document.getElementById('recommandation').value,
        created_at: new Date().toISOString()
    };
    
    const { error } = await supabase
        .from('evaluations_sejour')
        .insert([formData]);
    
    if (error) throw error;
    
    // Afficher confirmation
    document.getElementById('formEvaluationSejour').style.display = 'none';
    document.getElementById('confirmationEvaluation').style.display = 'block';
}
```

### **Utilitaires**

```javascript
// Normaliser nom gîte
function normalizeGiteName(name) {
    return name.toLowerCase(); // Garder accents
}

// Copier dans presse-papier
async function copyToClipboard(elementId) {
    const text = document.getElementById(elementId).value;
    await navigator.clipboard.writeText(text);
    showToast('✓ Copié', 'success');
}

// Toast notification
function showToast(message, type) {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => toast.remove(), 3000);
}

// Ouvrir itinéraire Google Maps
function openItineraire(lat, lng) {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    window.open(url, '_blank');
}
```

---

## 🎨 Design System

### **Palette de couleurs**

```css
:root {
    /* Primaire */
    --primary: #3b82f6;           /* Bleu principal */
    --primary-dark: #2563eb;
    
    /* Gris */
    --gray-50: #f9fafb;
    --gray-100: #f3f4f6;
    --gray-200: #e5e7eb;
    --gray-300: #d1d5db;
    --gray-600: #4b5563;
    --gray-700: #374151;
    --gray-800: #1f2937;
    --gray-900: #111827;
    
    /* Statuts */
    --success: #10b981;           /* Vert */
    --warning: #f59e0b;           /* Orange */
    --danger: #ef4444;            /* Rouge */
    
    /* Fond */
    --card: #ffffff;
    --background: #f9fafb;
}
```

### **Composants**

#### **Cards**

```css
.card {
    background: var(--card);
    border-radius: 0.75rem;
    padding: 1.5rem;
    margin-bottom: 1rem;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}
```

#### **Boutons**

```css
.btn {
    padding: 0.75rem 1.5rem;
    border-radius: 0.5rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
}

.btn-primary {
    background: var(--primary);
    color: white;
}

.btn-outline {
    background: transparent;
    border: 2px solid var(--primary);
    color: var(--primary);
}
```

#### **Code display**

```css
.code-display {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 1.5rem;
    border-radius: 0.75rem;
    text-align: center;
}

.code-value {
    font-size: 2rem;
    font-weight: 700;
    font-family: 'Courier New', monospace;
    color: white;
    letter-spacing: 0.3rem;
    animation: codeGlow 2s ease-in-out infinite alternate;
}
```

---

## 🔒 Sécurité

### **Protection XSS**

```javascript
// Utilisation de DOMPurify pour tout contenu dynamique
window.SecurityUtils.setInnerHTML(element, html);

// OU
const cleanHTML = DOMPurify.sanitize(dirtyHTML);
element.innerHTML = cleanHTML;
```

### **Tokens**

- ✅ Génération cryptographique (`crypto.getRandomValues`)
- ✅ 64 caractères hexadécimaux (256 bits)
- ✅ Expiration automatique (départ + 7 jours)
- ✅ Révocation possible (`is_active = false`)
- ✅ Validation à chaque chargement

### **RLS Supabase**

Pas d'authentification utilisateur → Politique RLS basée sur le token :

```sql
-- Exemple politique
CREATE POLICY "Accès public lecture infos_gites"
ON infos_gites FOR SELECT
USING (true);

CREATE POLICY "Accès avec token valide"
ON client_access_tokens FOR SELECT
USING (is_active = true AND expires_at > NOW());
```

---

## 📊 Métriques & Performances

### **Taille des fichiers**

| Fichier | Lignes | Taille |
|---------|--------|--------|
| fiche-client.html | 1865 | ~85 KB |
| fiche-client-app.js | 2808 | ~120 KB |
| Total (minifié) | - | ~60 KB |

### **Temps de chargement**

- **Token validation** : ~200ms
- **Chargement données** : ~500ms
- **Render UI** : ~100ms
- **Total First Paint** : <1s

### **Optimisations**

- ✅ Cache des checklists (pas de recharge BDD)
- ✅ Cache des FAQs (rechargement langue seulement)
- ✅ Lazy loading des onglets (activités/FAQ au clic)
- ✅ Debounce recherche FAQ (300ms)
- ✅ Service Worker (offline) - DÉSACTIVÉ temporairement

---

## 🐛 Bugs Connus & Limitations

### **Bugs**

1. ❌ **Service Worker 404** : Fichier `sw-fiche-client.js` non déployé sur Vercel
   - **Impact** : Pas de fonctionnalité offline
   - **Workaround** : Désactivé pour éviter erreur console

2. ⚠️ **QR Code WiFi** : Génération côté client uniquement
   - **Limitation** : Nécessite JS actif

### **Limitations**

1. **Traduction automatique** : Limite 10 000 req/jour (API MyMemory)
2. **Cartes activités** : Nécessite connexion internet (Google Maps)
3. **Pas d'édition** : Client ne peut pas modifier les infos gîte
4. **Pas de notifications** : Pas de push pour demandes/réponses

### **TODO**

- [ ] Résoudre déploiement Service Worker
- [ ] Ajouter génération PDF de la fiche
- [ ] Notifications email propriétaire (demandes urgentes)
- [ ] Historique des demandes client
- [ ] Chat en temps réel propriétaire ↔ client

---

## 📝 Exemples d'Utilisation

### **Générer une fiche client**

```javascript
// Depuis le dashboard propriétaire (calendrier)
await aperçuFicheClient(reservationId);

// 1. Génère token sécurisé
// 2. Affiche modal avec 3 options :
//    - Ouvrir dans navigateur
//    - Envoyer par WhatsApp
//    - Copier le lien
```

### **Envoyer par WhatsApp**

```javascript
const phone = '0612345678'.replace(/^0/, '33');
const message = `Bonjour ! Voici votre fiche pour le séjour au gîte : ${ficheUrl}`;
const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
window.open(whatsappUrl, '_blank');
```

### **Ajouter une activité**

```sql
INSERT INTO activites_gites (
    gite_id, nom, categorie, description,
    latitude, longitude, distance_km, is_active
) VALUES (
    1, 'Restaurant Le Petit Pont', 'restaurant',
    'Cuisine traditionnelle avec vue sur la rivière',
    44.4534, 1.4417, 2.3, true
);
```

### **Ajouter une FAQ**

```sql
INSERT INTO faq (
    gite_id, categorie, question, question_en, reponse, reponse_en, ordre
) VALUES (
    1, 'wifi', 
    'Comment me connecter au WiFi ?',
    'How to connect to WiFi?',
    'Le nom du réseau et le mot de passe sont disponibles dans l''onglet Entrée.',
    'Network name and password are available in the Check-in tab.',
    1
);
```

---

## 🎓 Formation Propriétaires

### **Ce que les clients voient**

1. **Accès sécurisé** : Lien unique avec token
2. **Toutes les infos** : Codes, WiFi, règles, activités
3. **Multilingue** : FR/EN automatique
4. **Mobile-first** : Optimisé smartphone
5. **Checklists interactives** : Arrivée/Départ
6. **Contact direct** : Formulaire demandes
7. **Évaluation** : Notation du séjour

### **Comment ça marche**

```
[Propriétaire] → Calendrier → Clic réservation → "Fiche Client"
              ↓
         [Modal généré]
              ↓
     [3 options partage]
     - Ouvrir directement
     - WhatsApp
     - Copier lien
              ↓
        [Client reçoit lien]
              ↓
   [Accès fiche personnalisée]
```

### **Bonnes pratiques**

✅ **Remplir TOUS les champs** dans `infos_gites`
✅ **Tester le token** avant d'envoyer au client
✅ **Vérifier traduction EN** si clients étrangers
✅ **Ajouter activités locales** pour valoriser le séjour
✅ **Créer FAQs pertinentes** pour anticiper questions

---

## 📞 Support & Contact

**Développeur** : [Votre nom]
**Email** : [support@...]
**Documentation** : `/docs/FICHE_CLIENT_DOCUMENTATION.md`

---

**Version** : 2.4.9  
**Dernière mise à jour** : 29 janvier 2026  
**Statut** : ✅ Production  

---

