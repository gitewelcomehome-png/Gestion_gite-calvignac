# 📁 Structure du Projet - Gestion Gîtes Calvignac

## 🏗️ Architecture

```
Gestion_gite-calvignac/
├── 📄 index.html                 # Page principale (SPA)
├── 📦 package.json               # Dépendances npm
├── ⚙️ vercel.json                # Configuration déploiement Vercel
│
├── 📂 js/                        # Modules JavaScript
│   ├── archives.js               # Gestion archives réservations
│   ├── charges.js                # Gestion charges/dépenses
│   ├── decouvrir.js              # Activités et POIs (carte Leaflet)
│   ├── fiche-client.js           # Informations clients
│   ├── infos-gites.js            # Données des gîtes
│   ├── menage.js                 # Planning ménage
│   ├── reservations.js           # Gestion réservations
│   ├── shared-config.js          # Configuration partagée (Supabase)
│   ├── shared-utils.js           # Utilitaires communs
│   ├── statistiques.js           # Graphiques et stats
│   ├── supabase-operations.js    # Opérations BDD
│   └── sync-ical.js              # Synchronisation iCal
│
├── 📂 tabs/                      # Fragments HTML (onglets)
│   ├── tab-archives.html         # Onglet archives
│   ├── tab-charges.html          # Onglet charges
│   ├── tab-decouvrir.html        # Onglet activités/carte
│   ├── tab-gestion.html          # Onglet gestion
│   ├── tab-infos-gites.html      # Onglet infos gîtes
│   ├── tab-menage.html           # Onglet planning ménage
│   ├── tab-reservations.html     # Onglet réservations
│   └── tab-statistiques.html     # Onglet statistiques
│
├── 📂 sql/                       # Scripts SQL Supabase
│   ├── create_activites_table.sql       # Table activités/POIs
│   ├── create_cleaning_tables.sql       # Tables planning ménage
│   ├── create_clients_table.sql         # Table clients
│   ├── create_commits_log_table.sql     # Table logs commits
│   ├── create_infos_gites_table.sql     # Table infos gîtes
│   └── add_distance_column.sql          # Ajout colonne distance
│
├── 📂 images/                    # Assets SVG
│   ├── location-pin.svg          # Marqueur par défaut
│   ├── marker-*.svg              # Marqueurs catégories
│   └── web-redirect.svg          # Icône lien externe
│
└── 📂 _archives/                 # Archives projets (nettoyage historique)
    ├── backups/                  # Sauvegardes anciennes
    ├── docs_obsoletes/           # Documentation obsolète
    ├── documentation_obsolete/   # Anciens rapports
    ├── fichiers_test/            # Tests développement
    ├── js_obsoletes/             # Anciens scripts JS
    ├── scripts_obsoletes/        # Scripts nettoyage obsolètes
    └── tabs_obsoletes/           # Anciens onglets HTML
```

## 🎯 Fonctionnalités Principales

### 1. **Réservations** (`reservations.js` + `tab-reservations.html`)
- Gestion complète des réservations (CRUD)
- Synchronisation automatique calendriers iCal
- Calcul automatique des prix
- Export Excel

### 2. **Activités & POIs** (`decouvrir.js` + `tab-decouvrir.html`)
- Carte interactive Leaflet
- Ajout activités avec géocodage automatique
- Événements de la semaine (générés dynamiquement)
- Filtres par catégorie et distance
- Double insertion automatique (Trévoux + Couzon)

### 3. **Planning Ménage** (`menage.js` + `tab-menage.html`)
- Planning automatique basé sur réservations
- Validation/modification dates par prestataire
- Notifications et alertes

### 4. **Statistiques** (`statistiques.js` + `tab-statistiques.html`)
- Chiffre d'affaires par mois/année
- Répartition par plateforme (Airbnb, Booking, etc.)
- Taux d'occupation
- Graphiques Chart.js

### 5. **Charges** (`charges.js` + `tab-charges.html`)
- Suivi dépenses par gîte
- Catégorisation (électricité, eau, entretien, etc.)
- Export comptable

### 6. **Archives** (`archives.js` + `tab-archives.html`)
- Historique réservations passées
- Statistiques annuelles

## 🗄️ Base de Données Supabase

### Tables Principales
- **reservations** - Réservations avec dates, clients, montants
- **activites_gites** - Activités et POIs (restaurants, musées, etc.)
- **clients** - Informations clients
- **cleaning_schedule** - Planning ménage
- **charges** - Charges et dépenses
- **infos_gites** - Données des gîtes (équipements, règlement, etc.)
- **commits_log** - Journal des modifications (audit)

## 🚀 Déploiement

- **Plateforme** : Vercel
- **Branche** : `main`
- **Auto-deploy** : Push sur `main` → Déploiement automatique
- **URL** : `https://gestion-gite-calvignac.vercel.app`

## 📦 Dépendances

```json
{
  "xlsx": "^0.18.5",           // Export Excel
  "chart.js": "^4.4.0",        // Graphiques statistiques
  "leaflet": "^1.9.4",         // Cartes interactives
  "@supabase/supabase-js": "^2.x"  // Base de données
}
```

## 🔧 Configuration

### Supabase (`js/shared-config.js`)
```javascript
const SUPABASE_URL = 'https://ivqiisnudabxemcxxyru.supabase.co'
const SUPABASE_KEY = '...'
```

### Calendriers iCal (`js/shared-config.js`)
```javascript
DEFAULT_ICAL_CONFIGS = {
  trevoux: { airbnb: '...', booking: '...' },
  couzon: { airbnb: '...', booking: '...' }
}
```

## 📝 Notes de Développement

- **Architecture** : SPA (Single Page Application) avec chargement dynamique des onglets
- **Style** : CSS inline + gradients modernes
- **Responsive** : ✅ Mobile-friendly
- **Sécurité** : RLS (Row Level Security) Supabase
- **Performance** : Lazy loading des onglets, cache JavaScript

## 🎨 Conventions

- **Commits** : Gitmoji + conventional commits
  - ✨ `feat:` - Nouvelle fonctionnalité
  - 🐛 `fix:` - Correction bug
  - 🧹 `clean:` - Nettoyage code
  - 📝 `docs:` - Documentation
  - 🎨 `style:` - Mise en forme

- **Branches** : 
  - `main` - Production (auto-deploy Vercel)

---

**Dernière mise à jour** : 29 décembre 2025
**Version** : 2.0 (Nettoyage complet)
