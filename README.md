# 🏡 Gestion Gîtes - Calvignac

Application web de gestion complète pour les gîtes de Trévoux et Couzon.

## 📋 Fonctionnalités

### ✅ Gestion des Réservations
- Calendrier interactif avec synchronisation iCal
- Import automatique depuis Airbnb, Abritel, Gîtes de France
- Suivi des clients et historique des séjours
- Blocages et indisponibilités

### ✅ Gestion Financière
- Suivi du chiffre d'affaires par gîte
- Enregistrement des charges et dépenses
- Graphiques et statistiques détaillées
- Export des données comptables

### ✅ Gestion du Ménage
- Planning automatique des ménages
- Affectation aux employés
- Suivi des heures et des tâches
- Historique complet

### ✅ Découvrir (Activités & POIs)
- **875 activités** répertoriées autour des gîtes
  - 455 activités autour de Trévoux 🏰
  - 420 activités autour de Couzon ⛰️
- Carte interactive Google Maps
- Filtres par catégorie:
  - 🍽️ Restaurants
  - 🏛️ Musées & Culture
  - ☕ Cafés & Bars
  - 🌳 Parcs & Nature
  - 🎮 Sport & Loisirs
- Calcul d'itinéraire depuis le gîte
- Recherche par distance (1-50 km)

### ✅ Archives & Statistiques
- Historique complet des réservations
- Analyse des performances par plateforme
- Graphiques de tendances
- Export des données

## 🗂️ Structure du Projet

```
Gestion_gite-calvignac/
├── index.html                 # Application principale (SPA)
├── tabs/                      # Modules de l'application
│   ├── tab-reservations.html
│   ├── tab-charges.html
│   ├── tab-menage.html
│   ├── tab-decouvrir.html     # 🆕 Module Découvrir
│   ├── tab-archives.html
│   ├── tab-statistiques.html
│   ├── tab-infos-gites.html
│   ├── tab-gestion.html
│   └── tab-sauvegarde.html
├── js/                        # Logique JavaScript
│   ├── shared-config.js       # Configuration Supabase
│   ├── shared-utils.js        # Utilitaires communs
│   ├── supabase-operations.js # Opérations DB
│   ├── decouvrir.js           # 🆕 Logique Découvrir
│   └── ...
├── sql/                       # Schémas base de données
│   ├── create_activites_table.sql
│   ├── create_reservations_table.sql
│   └── ...
├── _archives/                 # Fichiers archivés
│   ├── fichiers_test/
│   ├── scripts_obsoletes/
│   ├── documentation_obsolete/
│   ├── RAPPORT_NETTOYAGE_28DEC.md
│   └── GUIDE_CORRECTION_COORDONNEES.md
└── vercel.json               # Configuration déploiement

```

## 🚀 Déploiement

### Vercel (Production)
```bash
# Déploiement automatique via GitHub
git push origin main

# ⚠️ Si auto-deploy ne fonctionne pas:
# 1. Aller sur vercel.com/dashboard
# 2. Sélectionner le projet
# 3. Cliquer "Redeploy" manuellement
```

### Dev Container (Développement)
```bash
# Ouvrir dans VS Code avec Remote Containers
# Le serveur HTTP démarre automatiquement

# Ou manuellement:
python3 -m http.server 8000
# Puis ouvrir http://localhost:8000
```

## 🗄️ Base de Données (Supabase)

### Tables Principales
- `reservations_gites` - Réservations et calendrier
- `charges_gites` - Charges et dépenses
- `clients_gites` - Informations clients
- `cleaning_schedule` - Planning ménages
- `activites_gites` - **875 activités** autour des gîtes
- `commits_log` - Historique des modifications

### Configuration
```javascript
// js/shared-config.js
const SUPABASE_URL = 'https://ivqiisnudabxemcxxyru.supabase.co';
const SUPABASE_KEY = 'eyJhbGci...';  // Clé publique "anon"
```

## ⚠️ Problèmes Connus

### 🐛 Coordonnées Dupliquées (Priorité: CRITIQUE)
**Statut**: Identifié - Correction en attente

38 activités partagent les mêmes coordonnées GPS (45.9394, 4.7728), ce qui crée un "tas" de marqueurs empilés sur la carte.

**Impact**:
- ❌ Marqueurs illisibles sur la carte
- ❌ Navigation difficile
- ❌ Expérience utilisateur dégradée

**Solutions disponibles**:
1. Script automatique de géocodage (voir `_archives/GUIDE_CORRECTION_COORDONNEES.md`)
2. Correction manuelle via Supabase
3. Import batch depuis Excel/Sheets

**Documentation**:
- Rapport complet: `_archives/RAPPORT_NETTOYAGE_28DEC.md`
- Guide correction: `_archives/GUIDE_CORRECTION_COORDONNEES.md`

### ⚙️ Auto-deploy Vercel Instable
**Workaround**: Redéployer manuellement depuis le dashboard Vercel après chaque push.

### 🔄 Bouton "Dernier commit"
**Statut**: Non fonctionnel - Nécessite table `commits_log` dans Supabase

## 📊 Métriques

- **Lignes de code**: ~3500 (index.html) + ~1000 (decouvrir.js)
- **Activités**: 875 (455 Trévoux, 420 Couzon)
- **Tables Supabase**: 8
- **Modules**: 9 tabs
- **Fichiers archivés**: 14

## 🛠️ Technologies

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Backend**: Supabase (PostgreSQL + API REST)
- **Cartes**: Google Maps JavaScript API
- **Graphiques**: Chart.js
- **Calendrier**: FullCalendar
- **Déploiement**: Vercel
- **Version Control**: Git + GitHub

## 📝 Changelog

### v2.5.0 - 28/12/2025
- ✅ Nettoyage complet du projet (14 fichiers archivés)
- ✅ Module Découvrir: Panneau filtres à droite de la carte
- ✅ Sélecteur de catégorie (Restaurant, Culture, Sport, etc.)
- ✅ Slider distance max (1-50 km)
- ✅ Suppression bande distance au-dessus de la carte
- ✅ Titre "Événements" déplacé sous la carte
- ✅ Identification et documentation du problème de coordonnées
- ✅ 3 solutions proposées pour correction coordonnées

### v2.4.0 - 27/12/2025
- Correction mapping colonnes DB (categorie, distance, telephone)
- Ajout logs de débogage
- Suppression fonctions dupliquées (138 lignes)

### v2.3.0 - 26/12/2025
- Module Découvrir fonctionnel avec 875 activités
- Filtres par catégorie (Restaurant, Musées, Cafés, etc.)
- Carte Google Maps interactive

## 👤 Auteur

**Gîte Welcome Home**
- Email: gite.welcomehome@gmail.com
- GitHub: @gitewelcomehome-png

## 📄 License

Propriétaire - Tous droits réservés

---

**Dernière mise à jour**: 28 décembre 2025
**Version**: 2.5.0
**Statut**: ✅ Production (avec correctifs mineurs en attente)
