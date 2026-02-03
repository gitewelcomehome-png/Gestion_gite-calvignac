# 📋 GUIDE D'INTÉGRATION COMPLET - GESTION GÎTE CALVIGNAC

> **Date de création** : 28 janvier 2026  
> **Version** : 2.0  
> **Statut** : Site EN PRODUCTION avec clients réels

---

## 🏗️ ARCHITECTURE GLOBALE

### Stack Technique
- **Frontend** : HTML5, CSS3, JavaScript ES6+ (Vanilla JS)
- **Backend** : Supabase (PostgreSQL)
- **Hébergement** : Vercel
- **Cartographie** : Leaflet.js
- **Génération PDF** : jsPDF
- **Authentification** : Supabase Auth

### Structure des Dossiers
```
/
├── index.html                    # Point d'entrée principal
├── .github/
│   └── copilot-instructions.md  # Instructions IA
├── api/
│   └── webhooks/                # Webhooks API
├── assets/
│   └── icons-modern/            # Icônes SVG
├── css/
│   ├── main.css                 # CSS global consolidé (5277 lignes)
│   ├── tab-calendrier.css       # Styles calendrier
│   ├── tab-calendrier-tarifs.css
│   ├── tab-fiscalite.css        # Styles fiscalité
│   ├── tab-infos-gites.css      # Styles infos gîtes
│   ├── tab-menage.css           # Styles ménage
│   ├── tab-reservations.css     # Styles réservations
│   └── tab-statistiques.css     # Styles statistiques
├── js/
│   ├── main.js                  # Scripts principaux
│   ├── calendrier.js            # Gestion calendrier
│   ├── fiscalite.js             # Gestion fiscalité
│   ├── infos-gites.js           # Gestion infos pratiques
│   ├── menage.js                # Gestion ménage
│   ├── reservations.js          # Gestion réservations
│   └── statistiques.js          # Gestion stats
├── tabs/
│   ├── tab-calendrier.html
│   ├── tab-fiscalite.html
│   ├── tab-infos-gites.html
│   ├── tab-menage.html
│   ├── tab-reservations.html
│   └── tab-statistiques.html
├── sql/                         # Scripts base de données
├── _archives/                   # Fichiers obsolètes archivés
├── _backups/                    # Sauvegardes versionnées
└── _versions/                   # Versions du code

```

---

## 🎨 SYSTÈME DE THÈMES ET MODES

### 1. Thèmes (Jour/Nuit)
**Classes HTML** :
- `theme-dark` : Mode nuit (par défaut)
- `theme-light` : Mode jour

**Variables CSS** :
```css
/* Mode Nuit (défaut) */
--bg-primary: #050506
--bg-secondary: #111113
--text-primary: #ffffff
--text-secondary: #94a3b8
--border-color: rgba(255, 255, 255, 0.1)

/* Mode Jour */
--bg-primary: #f5f5f7
--bg-secondary: #ffffff
--text-primary: #1d1d1f
--text-secondary: #64748b
--border-color: rgba(0, 0, 0, 0.1)
```

### 2. Styles Visuels
**Classes HTML** :
- `style-sidebar` : Neo-brutalism avec bordure gauche épaisse
- `style-apple` : Design épuré minimaliste
- `style-gloss` : Effet brillant moderne

**Règles CSS** :
```css
/* Sidebar */
html.style-sidebar .element {
    border-left: 5px solid var(--color);
    box-shadow: 6px 6px 0 #2D3436;
}

/* Apple */
html.style-apple .element {
    border: 1px solid rgba(0,0,0,0.1);
    border-left: 3px solid var(--color);
    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

/* Gloss */
html.style-gloss .element {
    border: 2px solid var(--color);
    box-shadow: 0 4px 12px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.8);
}
```

---

## 🎯 CONVENTIONS DE NOMMAGE

### Classes CSS
- **Globales** : `.card`, `.btn`, `.form-control`
- **Spécifiques page** : Préfixer avec le nom du tab
  - `#gite-content-wrapper` (infos-gites)
  - `.infos-card` (au lieu de .card pour éviter conflits)
  - `.fiscal-bloc` (fiscalité)
  - `.menage-planning` (ménage)

### IDs JavaScript
- **Pattern** : `{tab}_{fonction}`
- Exemples :
  - `infos_adresse` (input adresse dans infos-gites)
  - `fiscal_montantCharges` (input charges dans fiscalité)
  - `resa_clientNom` (input nom dans réservations)

### Fichiers
- **CSS** : `tab-{nom}.css`
- **JS** : `{nom}.js`
- **HTML** : `tab-{nom}.html`

---

## 📱 SYSTÈME DE NAVIGATION

### Structure des Tabs
```html
<div class="tab-buttons">
    <button class="tab-button active" data-tab="decouvrir">🏡 Découvrir</button>
    <button class="tab-button" data-tab="reservations">📅 Réservations</button>
    <button class="tab-button" data-tab="calendrier">📆 Calendrier</button>
    <button class="tab-button" data-tab="menage">🧹 Ménage</button>
    <button class="tab-button" data-tab="infos-gites">📋 Infos Gîtes</button>
    <button class="tab-button" data-tab="fiscalite">💰 Fiscalité</button>
    <button class="tab-button" data-tab="statistiques">📊 Statistiques</button>
</div>

<div id="tab-content">
    <!-- Contenu chargé dynamiquement -->
</div>
```

### Chargement Dynamique
```javascript
async function loadTab(tabName) {
    const response = await fetch(`tabs/tab-${tabName}.html`);
    const html = await response.text();
    document.getElementById('tab-content').innerHTML = html;
    
    // Charger le JS spécifique
    if (window[`init${capitalize(tabName)}`]) {
        window[`init${capitalize(tabName)}`]();
    }
}
```

---

## 🗄️ BASE DE DONNÉES SUPABASE

### Tables Principales

#### `gites`
```sql
id (uuid, PK)
name (text) -- Nom du gîte
color (text) -- Couleur hex (#667eea)
created_at (timestamp)
```

#### `reservations`
```sql
id (uuid, PK)
gite_id (uuid, FK -> gites.id)
date_debut (date)
date_fin (date)
client_nom (text)
client_email (text)
client_telephone (text)
statut (text) -- 'confirmée', 'annulée', 'terminée'
montant_total (numeric)
```

#### `infos_gites`
```sql
gite_name (text, PK)
langue (text, PK) -- 'fr' ou 'en'
infos_adresse (text)
infos_telephone (text)
infos_email (text)
infos_gpsLat (text)
infos_gpsLon (text)
infos_wifiSSID (text)
infos_wifiPassword (text)
-- ... plus de 50 champs
```

#### `fiscalite`
```sql
gite_name (text, PK)
annee (integer, PK)
type_imposition (text)
montant_charges (numeric)
-- ... autres champs fiscaux
```

#### `menage`
```sql
id (uuid, PK)
gite_id (uuid, FK)
reservation_id (uuid, FK)
date_menage (date)
statut (text) -- 'en_attente', 'termine', 'valide'
```

### Règles Métier
1. **Un gîte = Une réservation à la fois**
2. **Pas de chevauchement de dates**
3. **Auto-save sur blur** pour tous les formulaires
4. **Validation temps réel** des inputs

---

## 🎨 SYSTÈME DE COULEURS PAR GÎTE

### Variables CSS Dynamiques
```javascript
// Définir la couleur du gîte sélectionné
document.documentElement.style.setProperty('--gite-color', '#667eea');
document.documentElement.style.setProperty('--gite-bg', 'rgba(102, 126, 234, 0.1)');
```

### Utilisation dans CSS
```css
#gite-content-wrapper {
    border: 3px solid var(--gite-color, #667eea);
}

.infos-card {
    border-left: 4px solid var(--gite-color);
}
```

### Palette de Couleurs Gîtes
```javascript
const colors = [
    '#667eea', // Violet
    '#f093fb', // Rose
    '#4facfe', // Bleu clair
    '#43e97b', // Vert
    '#fa709a', // Rose foncé
    '#feca57', // Jaune
    '#48dbfb', // Cyan
    '#ff6b6b'  // Rouge
];
```

---

## 📋 CLASSES CSS SPÉCIFIQUES

### Tab Infos Gîtes

#### Structure principale
```css
#infos-gites-header {}           /* Header de page */
#giteSelector {}                 /* Select gîtes */
#gite-content-wrapper {}         /* Wrapper principal coloré */
#gite-indicator {}               /* Indicateur gîte sélectionné */
```

#### Cards
```css
.infos-card {}                   /* Card standard */
.infos-card-header {}            /* Header de card */
.infos-card-icon {}              /* Icône header */
.infos-card-title {}             /* Titre header */
```

#### Sous-sections
```css
.infos-subsection {}             /* Sous-section neutre */
.infos-subsection-orange {}      /* Chauffage (orange) */
.infos-subsection-green {}       /* Écologie (vert) */
.infos-subsection-blue {}        /* Eau/Info (bleu) */
.infos-subsection-purple {}      /* Spécial (violet) */
```

### Tab Fiscalité
```css
.fiscal-bloc {}                  /* Bloc collapsible */
.fiscal-bloc-title {}            /* Titre du bloc */
.fiscal-grid {}                  /* Grille formulaire */
```

### Tab Ménage
```css
.menage-planning {}              /* Planning hebdomadaire */
.menage-card {}                  /* Card tâche */
```

---

## 🔧 FONCTIONS JAVASCRIPT CRITIQUES

### Gestion Gîtes
```javascript
window.generateGitesButtons()     // Génère liste gîtes
window.selectGiteFromDropdown()   // Change gîte sélectionné
```

### Auto-Save
```javascript
function attachChangeListeners() {
    document.querySelectorAll('input, select, textarea').forEach(field => {
        field.addEventListener('blur', async () => {
            if (window.isDirty) {
                await sauvegarderDonneesInfos();
            }
        });
    });
}
```

### Validation
```javascript
if (window.ValidationUtils) {
    const result = window.ValidationUtils.validateValue(value, 'email');
    if (!result.valid) {
        showNotification(result.error, 'error');
    }
}
```

---

## 📦 DÉPENDANCES EXTERNES

### CDN / Librairies
```html
<!-- Supabase -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

<!-- Leaflet (cartes) -->
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
```

---

## 🔒 RÈGLES DE SÉCURITÉ

### Production
- ✅ Site EN LIGNE avec clients réels
- ❌ Pas de hardcoding de valeurs
- ❌ Pas d'actions dangereuses
- ✅ Toujours valider les inputs
- ✅ Catcher toutes les erreurs
- ✅ Logs minimum en production

### Modifications
1. Tester en local
2. Vérifier compatibilité thèmes
3. Vérifier compatibilité modes
4. Pas d'erreurs console
5. Auto-save fonctionnel
6. Aucun impact sur autres pages

---

## 🎯 CHECKLIST INTÉGRATION NOUVELLE FONCTIONNALITÉ

### CSS
- [ ] Utiliser classes préfixées (éviter conflits)
- [ ] Supporter `theme-dark` et `theme-light`
- [ ] Supporter `style-sidebar`, `style-apple`, `style-gloss`
- [ ] Utiliser `var(--gite-color)` si besoin couleur gîte
- [ ] Ajouter `!important` si override nécessaire
- [ ] Tester mode nuit ET jour
- [ ] Tester tous les styles visuels

### HTML
- [ ] IDs uniques avec pattern `{tab}_{fonction}`
- [ ] Classes spécifiques au tab
- [ ] Pas de styles inline (sauf exceptions)
- [ ] Structure cohérente avec reste du site

### JavaScript
- [ ] Exposer fonctions avec `window.{fonction}`
- [ ] Implémenter auto-save sur blur
- [ ] Valider inputs avec `ValidationUtils`
- [ ] Catcher toutes les erreurs
- [ ] Nettoyer logs de debug
- [ ] Tester changement de gîte

### Base de données
- [ ] Vérifier tables existantes
- [ ] Utiliser relations FK
- [ ] Documenter dans ARCHITECTURE.md
- [ ] Tester requêtes Supabase

---

## 📝 EXEMPLE D'INTÉGRATION

### Nouvelle Card avec Thèmes

#### HTML
```html
<div id="ma-nouvelle-section">
    <div class="ma-card">
        <div class="ma-card-header">
            <span class="ma-card-icon">🎨</span>
            <h2 class="ma-card-title">Mon Titre</h2>
        </div>
        <div class="ma-card-content">
            <input type="text" id="mon_champ" class="form-control">
        </div>
    </div>
</div>
```

#### CSS
```css
/* Section principale */
#ma-nouvelle-section {
    background: var(--bg-secondary) !important;
    border: 3px solid var(--border-color) !important;
    padding: 20px !important;
}

html.theme-light #ma-nouvelle-section {
    background: white !important;
}

/* Card */
.ma-card {
    background: #1a1a1d !important;
    border: 3px solid rgba(255, 255, 255, 0.15) !important;
    padding: 25px !important;
}

html.theme-light .ma-card {
    background: white !important;
    border: 3px solid #2D3436 !important;
}

/* Mode Sidebar */
html.style-sidebar .ma-card {
    border-left: 5px solid var(--gite-color, #667eea) !important;
}

/* Mode Apple */
html.style-apple .ma-card {
    border: 1px solid rgba(255,255,255,0.2) !important;
    border-left: 2px solid var(--gite-color, #667eea) !important;
}

html.style-apple.theme-light .ma-card {
    border: 1px solid rgba(0,0,0,0.1) !important;
}
```

#### JavaScript
```javascript
window.initMaNouvelleFonction = async function() {
    // Auto-save
    document.getElementById('mon_champ').addEventListener('blur', async () => {
        await sauvegarderMesDonnees();
    });
    
    // Charger données initiales
    await chargerMesDonnees();
};
```

---

## 🚀 DÉPLOIEMENT

### Workflow
1. Développer en local
2. Tester tous les modes (nuit/jour, sidebar/apple/gloss)
3. Vérifier console (zéro erreur)
4. Commit + push sur `main`
5. Vercel déploie automatiquement

### Versions CSS/JS
Incrementer version dans `index.html` :
```html
<link rel="stylesheet" href="css/tab-infos-gites.css?v=1.7" />
```

---

## 📞 CONTACTS & RESSOURCES

### Documentation
- `ARCHITECTURE.md` : Architecture technique
- `ERREURS_CRITIQUES.md` : Bugs connus et solutions
- `.github/copilot-instructions.md` : Règles IA

### Base de Données
- Supabase Dashboard : [lien confidentiel]
- Tables documentées dans `sql/`

---

**FIN DU GUIDE D'INTÉGRATION**

> Ce document doit être consulté avant toute modification du site.  
> Toute intégration doit respecter ces conventions pour garantir la cohérence.
