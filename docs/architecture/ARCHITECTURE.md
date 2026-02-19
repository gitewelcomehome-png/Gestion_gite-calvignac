# Architecture du Projet - Gestion Gîte Calvignac

> **Dernière mise à jour:** 23 janvier 2026  
> **Objectif:** Référence centrale pour comprendre l'existant et éviter les régressions

---

## � Documents Essentiels

- **[ARCHITECTURE.md](ARCHITECTURE.md)** - Ce fichier (architecture technique)
- **[DESCRIPTION_COMPLETE_SITE.md](DESCRIPTION_COMPLETE_SITE.md)** - Documentation master complète
- **[ERREURS_CRITIQUES.md](ERREURS_CRITIQUES.md)** - Historique bugs critiques et solutions
- **[PROPOSITION_REFONTE_BDD_20260219.md](PROPOSITION_REFONTE_BDD_20260219.md)** - Proposition de refonte BDD (analyse sans migration)
- **[NETTOYAGE_COMPLET_23JAN2026.md](NETTOYAGE_COMPLET_23JAN2026.md)** - Rapport nettoyage complet
- **[README.md](README.md)** - Guide de démarrage

---

## �📊 Vue d'Ensemble

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
- **Traduction FR→EN (18/02/2026) :** auto-remplissage des champs `_en` manquants lors de la sauvegarde admin (`js/infos-gites.js`) + fallback de traduction au chargement fiche client (`js/fiche-client-app.js`)
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

#### 3.1. **linen_stock_items** ⭐ NOUVEAU
- Stocks de linge **dynamiques** par type (personnalisable par client)
- Colonnes : `owner_user_id`, `gite_id`, `item_key`, `quantity`, `created_at`, `updated_at`
- Unicité: `(gite_id, item_key)`
- Utilisé par les interfaces Desktop/Mobile/Femme‑ménage
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

#### 5. **checklist_templates** ⭐ MULTILINGUE (23/01/2026)
- Templates de checklist pour entrées/sorties par gîte
- **Colonnes multilingues :** 
  - `texte` / `texte_en` : Texte principal de l'item
  - `description` / `description_en` : Description détaillée optionnelle
- **Traduction automatique :** Les versions anglaises (`_en`) sont générées automatiquement lors de la création/modification via l'API MyMemory
- **UX gestion (18/02/2026) :**
  - Édition fiable d'un item existant (mise à jour sans création de doublon)
  - Duplication des items d'un gîte vers un autre gîte (par type entrée/sortie)
  - Notifications non bloquantes (suppression des confirmations navigateur côté checklist)
  - Alignement du module historique de configuration (`js/fiches-clients.js`, table `checklists`) avec édition inline et duplication sans modales bloquantes
  - Boutons de rétro-traduction FR→EN pour l'existant (FAQ, `checklist_templates`, `checklists`) depuis l'interface
- Relations : FK vers `gites`, FK vers `auth.users`
- Utilisé pour génération des fiches clients bilingues
- Fichiers impliqués : 
  - `js/checklists.js` : Gestion back-office avec traduction auto
  - `js/fiche-client-app.js` : Affichage client avec switch FR/EN
  - `sql/ADD_CHECKLIST_TRANSLATIONS.sql` : Script d'ajout des colonnes
- RLS activé

#### 5.1. **checklist_progress**
- Progression des checklists par réservation
- Relations : FK vers `reservations`, FK vers `checklist_templates`
- RLS activé

#### 5.2. **checklists** (ancienne table)
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
- **⚠️ Automatisation (22/01/2026) :** Les trajets sont automatiquement créés/mis à jour/supprimés lors des opérations sur les réservations (ajout, modification dates, suppression, sync iCal)
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

#### 11. **activites_gites** ⭐ REFONTE (20/01/2026)
- Base de données des activités, POIs et sites touristiques autour des gîtes
- **Colonnes principales :** 
  - `nom`, `categorie`, `description` (texte)
  - `adresse` (TEXT) - Adresse complète pour géocodage
  - `distance_km` (DECIMAL) - Calculée automatiquement depuis GPS
  - `latitude`, `longitude` (DECIMAL) - Coordonnées GPS (géocodage automatique via Nominatim)
  - `url`, `telephone` (texte)
  - `note` (NUMERIC 2,1) - Note Google (0-5)
  - `nb_avis` (INTEGER) - Nombre d'avis Google
  - `photos` (JSONB), `is_active` (BOOLEAN)
- **Relations :** FK vers `gites` via `gite_id`, FK vers `auth.users` via `owner_user_id`
- **Catégories supportées :** Restaurant, Café/Bar, Musée, Château, Parc, Hôtel, Attraction
- **RLS activé**
- **Géocodage :** Automatique via OpenStreetMap Nominatim (calcul GPS + distance depuis gîte)
- **Interface :** [tabs/tab-decouvrir.html](tabs/tab-decouvrir.html) - Design moderne en grille de cartes Neo-Brutalism
- **Module JS :** [js/decouvrir.js](js/decouvrir.js) - Gestion complète CRUD + filtres + carte interactive + géocodage auto
- **Fonctionnalités :** Ajout/édition/suppression activités, filtres par catégorie, export PDF guide client
- **SQL Structure :** [sql/update_activites_gites_structure.sql](sql/update_activites_gites_structure.sql)

#### 12. **faq** ⭐ MULTILINGUE (23/01/2026)
- FAQ (Questions fréquentes) pour les fiches clients
- **Colonnes multilingues :** 
  - `question` / `question_en` : Question posée
  - `answer` / `answer_en` : Réponse détaillée
- **Traduction automatique :** Les versions anglaises (`_en`) sont générées automatiquement lors de la création/modification via l'API MyMemory
- Colonnes : `category`, `priority`, `is_visible`, `gite_id` (NULL = tous les gîtes)
- Relations : FK vers `gites` (optionnel), FK vers `auth.users`
- Migration automatique `reponse` → `answer` pour rétrocompatibilité
- Fichiers impliqués : 
  - `js/faq.js` : Gestion back-office avec traduction auto
  - `js/fiche-client-app.js` : Affichage client avec switch FR/EN
  - `sql/ADD_FAQ_TRANSLATIONS.sql` : Script d'ajout des colonnes
- RLS activé

#### 13. **auth.users** (Supabase Auth)
- Gestion des utilisateurs
- Rôles stockés dans `user_roles` (JSON)

### 🌍 Support Multilingue FR/EN (23/01/2026)

**Système de traduction à la volée** dans les fiches clients :
- **Tables bilingues :** `infos_gites`, `checklist_templates`, `faq`
- **Colonnes :** Chaque champ texte a sa version `_en`
- **Traduction automatique :** API MyMemory traduit automatiquement FR→EN lors de la sauvegarde (FAQ, Checklists)
- **Affichage dynamique :** Switch langue FR/EN instantané via `currentLanguage` (js/fiche-client-app.js)
- **Fallback automatique :** Si traduction manquante → Affiche FR
- **Performance :** Mise en cache pour changement instantané
- **API utilisée :** MyMemory Translation API (gratuite, 10 000 requêtes/jour)
- **Documentation complète :** [docs/README_TRADUCTION_MULTILINGUE.md](docs/README_TRADUCTION_MULTILINGUE.md)

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
- **`decouvrir.js`** ⭐ REFONTE (20/01/2026) - Module "À Découvrir" : gestion activités/POIs avec table `activites_gites`, interface moderne en grille de cartes, filtres dynamiques par catégorie, CRUD complet, support carte Google Maps
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

### `/LiveOwnerUnit/` - Application mobile (Expo)
- Application mobile Expo Router pour iOS/Android
- Point d'entree: `app/_layout.tsx` avec AuthProvider + redirections
- Onglets: `app/(tabs)/index.tsx`, `calendar.tsx`, `cleaning.tsx`, `stats.tsx`, `settings.tsx`
- Auth Supabase via variables `EXPO_PUBLIC_SUPABASE_URL` et `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- Donnees chargees depuis `reservations`, `cleaning_schedule`, `gites` (RLS)

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
- Alerte manque configurable côté client dans l'onglet draps (jour d'alerte + nombre de jours avant rupture estimée)
- Persistance des paramètres d'alerte en BDD via `user_settings` (`draps_alert_weekday`, `draps_alert_days_before`), pas de stockage local

### 3. Planning Ménage ⭐ SYSTÈME COMPLET
- **Fichiers:** `js/menage.js`, `js/cleaning-rules.js`, `js/cleaning-rules-modal.js`
- **Table BDD:** `cleaning_schedule` (planning), `cleaning_rules` (règles métier)
- **Interface site principal:** Visualisation planning par semaines, validation des propositions, modification dates/horaires
- **Interface femme de ménage:** `pages/femme-menage.html` - Consultation planning, proposition de modifications
- **Règles métier configurables:** Dimanche, samedi, enchainements, jours fériés, mercredi/jeudi
- **Statuts:** pending, pending_validation, validated, refused
- **Calcul automatique:** Date et heure du ménage selon règles métier et enchainements de réservations
- **⚠️ IMPORTANT:** Toutes les fonctions onclick doivent être exportées dans `window` (cf. CORRECTION_MENAGE_21JAN2026.md)
- **Fonction principale:** `window.afficherPlanningParSemaine()` - Génère et affiche le planning complet

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
