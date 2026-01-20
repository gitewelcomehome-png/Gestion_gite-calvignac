# Architecture du Projet - Gestion Gîte Calvignac

> **Dernière mise à jour:** 13 janvier 2026  
> **Objectif:** Référence centrale pour comprendre l'existant et éviter les régressions

---

## 📊 Vue d'Ensemble

**Type:** Application web de gestion de gîtes  
**Stack:** HTML/CSS/JavaScript + Supabase (PostgreSQL + Auth)  
**État:** **EN PRODUCTION** avec clients réels

---

## 🗄️ Base de Données (Supabase)

### Tables Principales

#### 1. **reservations**
- Colonne propriétaire: `owner_user_id` (UUID)
- Colonnes clés: `date_arrivee`, `date_depart`, `nom_client`, `statut`, `gite_id`
- Relations: FK vers `gites`, FK vers `auth.users`
- RLS activé

#### 2. **gites**
- Colonnes clés: `nom`, `owner_user_id`, `id`
- Relations: Référencé par `reservations`, `cleaning_schedule`, etc.
- RLS activé

#### 3. **draps**
- Gestion des draps et linge
- Lié aux réservations

#### 4. **cleaning_schedule**
- Planning de ménage
- FK vers `gites` et `reservations`

#### 5. **checklists**
- Tâches à effectuer
- Liées aux gites

#### 6. **simulations_fiscales**
- Calculs fiscaux LMNP
- Données financières par année

#### 7. **auth.users** (Supabase Auth)
- Gestion des utilisateurs
- Rôles stockés dans `user_roles` (JSON)

### Relations Importantes
- Toutes les tables sont liées via `owner_user_id` ou `gite_id`
- RLS (Row Level Security) activé sur toutes les tables sensibles
- Éviter les variables orphelines sans FK

---

## 📁 Structure des Fichiers

### Racine
- `index.html` - Page principale (tableau de bord)
- `login.html` - Authentification
- `onboarding.html` - Premier accès utilisateur
- `fiche-client.html` - Détails d'une réservation
- `femme-menage.html` - Interface femme de ménage

### `/js/` - Scripts JavaScript
- **`auth.js`** - Gestion centralisée de l'authentification (AuthManager)
- **`dashboard.js`** - Logique du tableau de bord
- **`reservations.js`** - Gestion des réservations
- **`calendrier-tarifs.js`** - Calendrier avec tarifs
- **`draps.js`** - Gestion du linge
- **`charges.js`** - Gestion des charges
- **`fiscalite.js`** - Calculs fiscaux
- **`error-logger.js`** - Système de logs d'erreurs

### `/tabs/` - Onglets du dashboard
- Chaque onglet correspond à une fonctionnalité
- Système de navigation par onglets dans `index.html`

### `/css/` - Styles
- `flat-outline.css` - Style général
- `header-colonne.css` - En-têtes de colonnes
- `icons.css` - Icônes personnalisées

### `/sql/` - Scripts SQL
- Scripts de migration et création de tables
- **À nettoyer régulièrement** après usage

### `/_archives/` - Fichiers obsolètes
- Tout fichier inutile doit être archivé ici

---

## 🔐 Système d'Authentification

### AuthManager (js/auth.js)
- Classe singleton pour gérer l'auth
- Méthodes principales:
  - `init()` - Initialisation
  - `checkAuthState()` - Vérification session
  - `requireAuth()` - Protéger une page
  - `logout()` - Déconnexion

### Flow d'authentification
1. User arrive sur une page
2. AuthManager vérifie la session Supabase
3. Si non authentifié → redirect vers `login.html`
4. Si authentifié → charge les données user

### Rôles
- Stockés dans `auth.users.user_metadata.roles`
- Gestion multi-tenant avec `owner_user_id`

---

## 🎯 Fonctionnalités Principales

### 1. Gestion des Réservations
- CRUD complet
- Calendrier visuel
- Import iCal depuis plateformes (Airbnb, Booking, etc.)
- Détection de conflits de dates

### 2. Gestion du Linge
- Suivi des draps par réservation
- État: propre, sale, à laver

### 3. Planning Ménage
- Interface dédiée pour femme de ménage
- Affectation des tâches
- Checklists de nettoyage

### 4. Fiscalité
- Simulations LMNP
- Calcul amortissements
- Rapports annuels

### 5. Statistiques
- Taux d'occupation
- Revenus
- Analyses diverses

---

## ⚠️ Points d'Attention

### Sécurité
- **RLS obligatoire** sur toutes les tables sensibles
- Jamais de hardcoding de `owner_user_id`
- Toujours utiliser `session.user.id`

### Performance
- Pas de `SELECT *` inutiles
- Indexes sur colonnes fréquentes (dates, FK)
- Limiter les requêtes imbriquées

### Maintenance
- Supprimer les logs `console.log()` inutiles
- Catcher toutes les erreurs (try/catch)
- Archiver les fichiers SQL obsolètes

---

## 🔄 Processus de Modification

1. **Vérifier l'existant** dans ce fichier
2. **Consulter ERREURS_CRITIQUES.md** pour éviter les pièges connus
3. **Tester localement** avant toute mise en production
4. **Mettre à jour cette documentation** si changement d'architecture

---

## 📝 Notes Techniques

### Supabase
- URL et clés stockées en variables d'environnement (ou config)
- Client initialisé dans chaque page via `auth.js`

### Service Worker
- `sw-fiche-client.js` pour PWA (fiche client offline)
- Manifest: `manifest-fiche-client.json`

### Gestion des Erreurs
- Système centralisé dans `error-logger.js`
- Logs envoyés à Supabase (table `error_logs` ?)

---

## 🚀 Évolutions Futures

- Multi-tenant (plusieurs propriétaires)
- API REST pour intégrations externes
- Application mobile native

---

**Maintenir ce fichier à jour à chaque modification majeure !**
