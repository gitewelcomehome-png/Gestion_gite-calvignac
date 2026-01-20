# Architecture du Projet - Gestion Gîte Calvignac

> **Dernière mise à jour:** 20 janvier 2026  
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

#### 2.5. **infos_gites** ⭐ TABLE COMPLÈTE
- **Objectif:** Stocker toutes les informations détaillées des gîtes pour génération fiches clients
- **Colonnes:** 119 colonnes organisées en 8 sections (voir détails ci-dessous)
- **Relations:** FK vers `gites(id)` via `gite_id`, FK vers `auth.users` via `owner_user_id`
- **Bilingue:** Chaque champ a sa version `_en` pour l'anglais
- **Différence avec `infos_pratiques`:** Table structurée fixe VS table flexible dynamique
- **Documentation:** [sql/README_INFOS_GITES_VS_INFOS_PRATIQUES.md](sql/README_INFOS_GITES_VS_INFOS_PRATIQUES.md)
- **RLS activé**

**Sections de infos_gites:**
1. **Base:** adresse, téléphone, GPS, email (FR + EN)
2. **WiFi:** SSID, password, débit, localisation, zones (FR + EN)
3. **Arrivée:** heure, parking, accès, codes, instructions clés, étage (FR + EN)
4. **Logement:** chauffage, cuisine, électroménager, chambres (FR + EN)
5. **Déchets:** instructions tri, collecte, déchèterie (FR + EN)
6. **Sécurité:** détecteurs, extincteur, coupures, urgences (FR + EN)
7. **Départ:** heure, checklist, restitution clés (FR + EN)
8. **Règlement:** tabac, animaux, nombre personnes, caution (FR + EN)

**Colonnes rétrocompatibilité:** `code_porte`, `code_portail`, `parking_info`, `acces_description`, `consignes_speciales`

#### 3. **linen_stocks**
- Gestion des stocks de draps et linge par gîte
- Colonnes : `draps_plats_grands`, `draps_plats_petits`, `housses_couettes_grandes`, `housses_couettes_petites`, `taies_oreillers`, `serviettes`, `tapis_bain`
- Colonne propriétaire: `owner_user_id` (UUID)
- Relations: FK vers `gites` (contrainte UNIQUE sur `gite_id`)
- RLS activé

#### 4. **cleaning_schedule**
- Planning de ménage
- FK vers `gites` et `reservations`
- RLS activé

#### 4.5. **cleaning_rules** ⭐ NOUVEAU
- Règles configurables pour la planification des ménages
- Colonnes : `id`, `rule_code` (UNIQUE), `rule_name`, `description`, `is_enabled`, `priority`, `config` (JSONB)
- Permet à l'utilisateur de personnaliser les règles de planification automatique
- 9 règles par défaut (enchainement, jours fériés, week-ends, etc.)
- Voir [GUIDE_REGLES_MENAGE.md](docs/GUIDE_REGLES_MENAGE.md)

#### 5. **checklists**
- Tâches à effectuer
- Liées aux gites

#### 6. **simulations_fiscales** / **fiscal_history**
- Calculs fiscaux LMNP
- Données financières par année
- Colonne `donnees_detaillees` (JSONB) : Stocke travaux, frais, produits

#### 7. **km_trajets** ⭐ NOUVEAU (19/01/2026)
- Historique des trajets professionnels pour déduction kilométrique
- Colonnes : `date_trajet`, `motif`, `type_trajet`, `lieu_arrivee`, `gite_id`, `distance_aller`, `aller_retour`, `distance_totale`, `auto_genere`, `reservation_id`
- Relations : FK vers `gites`, FK vers `reservations`
- RLS activé
- Voir [GUIDE_KILOMETRES.md](docs/GUIDE_KILOMETRES.md)

#### 8. **km_config_auto** ⭐ NOUVEAU (19/01/2026)
- Configuration de l'automatisation des trajets
- Une ligne par utilisateur (UNIQUE sur `owner_user_id`)
- Colonnes : `auto_menage_entree`, `auto_menage_sortie`, `auto_courses`, `auto_maintenance`
- RLS activé

#### 9. **km_lieux_favoris** ⭐ NOUVEAU (19/01/2026)
- Lieux favoris (magasins, fournisseurs) avec distances
- Colonnes : `nom`, `type_lieu`, `distance_km`, `adresse`
- RLS activé

#### 10. **gites** (modification 19/01/2026)
- **Nouvelle colonne :** `distance_km` (DECIMAL) - Distance depuis domicile en km
- Utilisée pour calcul automatique des trajets

#### 11. **auth.users** (Supabase Auth)
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
- **`fiscalite-v2.js`** - Calculs fiscaux LMNP multi-gîtes
- **`taux-fiscaux-config.js`** ⭐ NOUVEAU - Configuration dynamique des taux fiscaux (URSSAF, IR, barème km)
- **`km-manager.js`** ⭐ NOUVEAU - Module gestion kilomètres professionnels
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
- **⚠️ IMPORTANT:** Minimum URSSAF de 1 200 € par an appliqué automatiquement (cotisations minimales légales)
  - Implémenté dans `calculerTempsReel()` et `calculerFiscalite()` (fiscalite-v2.js)
  - Appliqué également dans `updateFinancialIndicators()` (dashboard.js)
  - Message informatif affiché à l'utilisateur quand le minimum est appliqué

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

## � Système Fiscal (NOUVEAU - 19 janvier 2026)

### Configuration Dynamique des Taux

**Fichier:** `js/taux-fiscaux-config.js`

Système paramétrable pour gérer les taux fiscaux annuels:

**Fonctionnalités:**
- ✅ Multi-années (2024, 2025, +futures)
- ✅ Adaptatif automatique (détecte l'année en cours)
- ✅ Centralisation des taux (URSSAF, IR, barème km, PASS, etc.)
- ✅ Mise à jour facile sans modifier le code métier

**Taux gérés:**
- **URSSAF:** Indemnités (0.85%), Retraite base (17.75%), Retraite compl (7%), Invalidité (1.3%), CSG-CRDS (9.7%), Formation pro (0.25%), Allocations familiales (progressif 0-3.1%)
- **Trimestres retraite:** Calcul basé sur 600 × SMIC horaire
- **Barème kilométrique:** Taux par puissance fiscale et tranches de distance
- **Impôt sur le revenu:** Barème progressif 2024/2025
- **PASS:** Plafond annuel Sécurité Sociale (46 368 € en 2024/2025)
- **Abattement salaires:** 10% avec plafonds (472€ min / 13 522€ max)

**Usage:**
```javascript
const annee = new Date().getFullYear();
const config = window.TAUX_FISCAUX.getConfig(annee);
const urssaf = config.URSSAF;
const indemnites = benefice * urssaf.indemnites_journalieres.taux;
```

**Maintenance annuelle:**
1. Copier section année précédente dans `taux-fiscaux-config.js`
2. Mettre à jour les nouveaux taux (janvier/février)
3. Le code s'adapte automatiquement

**Voir:** [CORRECTIONS_AUDIT_FISCAL_19JAN2026.md](docs/CORRECTIONS_AUDIT_FISCAL_19JAN2026.md)

---

## �🔄 Processus de Modification

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
