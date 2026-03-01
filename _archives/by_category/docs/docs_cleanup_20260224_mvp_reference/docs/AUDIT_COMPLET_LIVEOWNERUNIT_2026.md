# 🏗️ AUDIT COMPLET - LIVEOWNERUNIT
## Plateforme SaaS de Gestion de Locations Saisonnières

**Date de l'audit :** 13 février 2026  
**Version analysée :** v5.0 Production  
**Auditeur :** Analyse technique complète  
**Statut :** ✅ EN PRODUCTION avec clients réels

---

## 📋 TABLE DES MATIÈRES

1. [Vue d'Ensemble Architecture](#1-vue-densemble-architecture)
2. [Structure Base de Données Complète](#2-structure-base-de-données-complète)
3. [Applications & Interfaces](#3-applications--interfaces)
4. [APIs Backend](#4-apis-backend)
5. [Application iOS Native](#5-application-ios-native)
6. [Modules JavaScript](#6-modules-javascript)
7. [Flux de Données](#7-flux-de-données)
8. [Sécurité & Authentification](#8-sécurité--authentification)
9. [Performance & Optimisations](#9-performance--optimisations)
10. [Scalabilité & Limites](#10-scalabilité--limites)
11. [Recommandations Stratégiques](#11-recommandations-stratégiques)

---

## 1. VUE D'ENSEMBLE ARCHITECTURE

### 1.1 Stack Technique

```yaml
Frontend:
  - HTML5/CSS3/JavaScript (Vanilla)
  - Framework: Aucun (Lightweight, 0 dépendance frontend)
  - UI Libraries: 
    - Lucide Icons (CDN)
    - Font Awesome (CDN)
    - Chart.js (graphiques)
    - FullCalendar (calendrier)
    - Leaflet.js (cartographie)
  - Thèmes: Dark/Light Mode

Backend:
  - Type: Serverless (Vercel Functions)
  - Runtime: Node.js 20.x
  - APIs: RESTful
  - Functions: 6 endpoints principaux

Database:
  - Provider: Supabase (PostgreSQL 15)
  - Tables: 52 tables production
  - RLS: Activé sur 100% des tables
  - Triggers: 15 triggers automatisés
  - Functions: 8 fonctions SQL

Authentication:
  - Provider: Supabase Auth
  - Methods: Email/Password, OAuth (Google, Facebook)
  - Security: JWT tokens, RLS, Rate limiting

Storage:
  - Vercel Edge Network (CDN)
  - Supabase Storage (fichiers utilisateurs)
  - Local Storage (préférences, cache)

Mobile:
  - Framework: Expo / React Native
  - Language: TypeScript
  - Target: iOS (App Store ready)
  - Features: Offline-first, Push notifications

Hosting:
  - Frontend: Vercel Edge Network
  - Domain: liveownerunit.fr
  - SSL: Automatique (Let's Encrypt)
  - CDN: Global (Multi-région)
```

### 1.2 Architecture Générale

```
┌─────────────────────────────────────────────────────────────────┐
│                    UTILISATEURS FINAUX                           │
└──────────────┬─────────────────────────┬────────────────────────┘
               │                         │
         ┌─────▼──────┐           ┌─────▼──────┐
         │  Desktop   │           │    iOS     │
         │   (PWA)    │           │ Native App │
         └─────┬──────┘           └─────┬──────┘
               │                         │
               └──────────┬──────────────┘
                          │
              ┌───────────▼────────────┐
              │   Vercel Edge Network  │
              │   (CDN + Serverless)   │
              └───────────┬────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
   ┌────▼────┐      ┌────▼────┐      ┌────▼────┐
   │ OpenAI  │      │Supabase │      │  Zoho   │
   │   API   │      │PostgreSQL│      │  Mail   │
   └─────────┘      └────┬────┘      └─────────┘
                         │
                    ┌────▼────┐
                    │  Auth   │
                    │ Storage │
                    │Realtime │
                    └─────────┘
```

### 1.3 Composants Principaux

| Composant | Type | Rôle | Statut |
|-----------|------|------|--------|
| **index.html** | SPA Desktop | App principale propriétaire | ✅ Production |
| **app.html** | Landing Page | Site commercial | ✅ Production |
| **fiche-client.html** | PWA Client | Interface locataire final | ✅ Production |
| **femme-menage.html** | Interface tierce | Gestion ménages externe | ✅ Production |
| **admin-*.html** | Back-office Admin | Gestion clients SaaS (Channel Manager) | 🚧 Beta |
| **iOS App** | Mobile Native | App propriétaire mobile | ✅ Production |

---

## 2. STRUCTURE BASE DE DONNÉES COMPLÈTE

### 2.1 Tables Core Application (10 tables)

#### **Groupe 1 : Gîtes & Réservations**

##### `gites` (Table Maître)
```sql
Colonnes Principales:
├── id (UUID, PK)
├── owner_user_id (UUID, FK → auth.users)
├── name (TEXT, NOT NULL)
├── slug (TEXT, UNIQUE per owner)
├── description, address (TEXT)
├── icon (TEXT, default 'home')
├── color (TEXT, default '#667eea')
├── capacity, bedrooms, bathrooms (INTEGER)
├── latitude, longitude (NUMERIC)
├── distance_km (NUMERIC) -- Distance domicile
├── ical_sources (JSONB) -- Format: {"airbnb": "url", "booking": "url", ...}
├── settings (JSONB)
├── tarifs_calendrier (JSONB)
├── regles_tarifaires (JSONB)
├── display_order (INTEGER, default 0)
├── is_active (BOOLEAN, default true)
├── created_at, updated_at (TIMESTAMPTZ)

Index:
├── idx_gites_owner (owner_user_id)
├── idx_gites_active (owner_user_id, is_active)
└── idx_gites_slug (owner_user_id, slug)

Relations:
└── Auth: auth.users (CASCADE DELETE)
```

##### `reservations` (CŒUR MÉTIER)
```sql
Colonnes Principales:
├── id (UUID, PK)
├── owner_user_id (UUID, FK → auth.users)
├── gite_id (UUID, FK → gites)
├── check_in, check_out (DATE, NOT NULL)
├── client_name (TEXT, NOT NULL, min 2)
├── client_email, client_phone, client_address (TEXT)
├── guest_count / nb_personnes (INTEGER, alias)
├── platform / plateforme (TEXT, alias)
├── platform_booking_id (TEXT)
├── status (TEXT, default 'confirmed')
├── total_price / montant (NUMERIC, alias)
├── currency (TEXT, default 'EUR')
├── paid_amount / acompte (NUMERIC, alias)
├── restant (NUMERIC, calculé par trigger)
├── paiement (TEXT)
├── notes (TEXT)
├── source (TEXT, default 'manual') -- 'manual', 'ical'
├── provenance (TEXT, alias de client_address)
├── synced_from (TEXT) -- Plateforme d'origine
├── ical_uid (TEXT) -- Identifiant unique iCal
├── manual_override (BOOLEAN, default false)
├── last_seen_in_ical (TIMESTAMPTZ)
├── message_envoye (BOOLEAN, default false)
├── check_in_time, check_out_time (TIME)
├── telephone (TEXT, alias client_phone)
├── gite (TEXT, alias nom gîte, sync par trigger)
├── created_at, updated_at (TIMESTAMPTZ)

Index:
├── idx_reservations_owner (owner_user_id)
├── idx_reservations_gite (gite_id)
├── idx_reservations_dates (check_in, check_out)
├── idx_reservations_status (owner_user_id, status)
├── idx_reservations_ical_uid (ical_uid) WHERE ical_uid IS NOT NULL
└── idx_reservations_last_seen (last_seen_in_ical) WHERE source = 'ical'

Triggers:
├── trigger_calculate_restant_reservations (BEFORE INSERT/UPDATE)
│   └── Calcule: restant = montant - acompte
├── trigger_sync_gite_name_reservations (BEFORE INSERT/UPDATE)
│   └── Sync colonne 'gite' depuis gites.name
└── trigger_sync_aliases_reservations (BEFORE INSERT/UPDATE)
    └── Sync tous les alias (plateforme, nb_personnes, telephone, etc.)

Contraintes:
├── check_out > check_in
└── length(client_name) >= 2

Relations:
├── Auth: auth.users (CASCADE DELETE)
└── Gîte: gites (CASCADE DELETE)
```

#### **Groupe 2 : Fiches Clients (5 tables)**

##### `infos_gites` (119 colonnes bilingues FR/EN)
```sql
Structure:
├── Métadonnées: id, owner_user_id, gite_id
│
├── SECTION 1 - Base (8 colonnes × 2 langues = 16)
│   ├── adresse / adresse_en
│   ├── telephone / telephone_en
│   ├── email / email_en
│   └── latitude, longitude
│
├── SECTION 2 - WiFi (6 colonnes × 2 langues = 12)
│   ├── wifi_ssid, wifi_password
│   ├── wifi_debit / wifi_debit_en
│   ├── wifi_localisation / wifi_localisation_en
│   └── wifi_zones / wifi_zones_en
│
├── SECTION 3 - Arrivée (12 colonnes × 2 langues = 24)
│   ├── arrivee_heure, arrivee_heure_fin
│   ├── arrivee_parking / arrivee_parking_en
│   ├── arrivee_acces / arrivee_acces_en
│   ├── arrivee_codes (JSON)
│   ├── arrivee_instructions_cles / _en
│   └── arrivee_etage / arrivee_etage_en
│
├── SECTION 4 - Logement (20 colonnes × 2 langues = 40)
│   ├── chauffage_type, chauffage_utilisation / _en
│   ├── cuisine_equipements / _en
│   ├── electromenager_details / _en
│   ├── chambre_literie / _en
│   └── tv_internet_instructions / _en
│
├── SECTION 5 - Déchets (4 colonnes × 2 langues = 8)
│   ├── dechets_tri / dechets_tri_en
│   ├── dechets_collecte / _en
│   └── dechets_decheterie / _en
│
├── SECTION 6 - Sécurité (6 colonnes × 2 langues = 12)
│   ├── securite_detecteurs / _en
│   ├── securite_extincteur / _en
│   └── securite_coupures / _en
│
├── SECTION 7 - Départ (5 colonnes × 2 langues = 10)
│   ├── depart_heure
│   ├── depart_checklist / _en
│   └── depart_restitution_cles / _en
│
└── SECTION 8 - Règlement (7 colonnes × 2 langues = 14)
    ├── reglement_tabac / _en
    ├── reglement_animaux / _en
    ├── reglement_nb_personnes
    └── reglement_caution

Index:
├── idx_infos_gites_owner (owner_user_id)
└── idx_infos_gites_gite (gite_id)

Relations:
├── Auth: auth.users (CASCADE DELETE)
└── Gîte: gites (CASCADE DELETE)
```

##### `checklist_templates` (Bilingue FR/EN)
```sql
Colonnes:
├── id (UUID, PK)
├── owner_user_id (UUID, FK)
├── gite_id (UUID, FK, nullable)
├── type (TEXT, CHECK IN ('entree', 'sortie'))
├── ordre (INTEGER, default 1)
├── texte (TEXT, NOT NULL)
├── texte_en (TEXT) -- Traduction auto MyMemory API
├── description (TEXT)
├── description_en (TEXT)
├── actif (BOOLEAN, default true)
└── created_at, updated_at

Index:
├── idx_checklist_templates_owner
├── idx_checklist_templates_gite
├── idx_checklist_templates_type
└── idx_checklist_translations (texte_en, description_en)

Relations:
├── Auth: auth.users (CASCADE DELETE)
└── Gîte: gites (CASCADE DELETE, nullable = tous gîtes)
```

##### `checklist_progress`
```sql
Colonnes:
├── id (UUID, PK)
├── owner_user_id (UUID, FK)
├── reservation_id (UUID, FK)
├── template_id (UUID, FK)
├── completed (BOOLEAN, default false)
├── completed_at (TIMESTAMPTZ)
├── completed_by (UUID, FK → auth.users nullable)
├── notes (TEXT)
└── created_at

Contraintes:
└── UNIQUE (reservation_id, template_id)

Index:
├── idx_checklist_progress_owner
├── idx_checklist_progress_resa
└── idx_checklist_progress_template

Relations:
├── Auth: auth.users
├── Réservation: reservations (CASCADE DELETE)
└── Template: checklist_templates (CASCADE DELETE)
```

##### `faq` (Bilingue FR/EN)
```sql
Colonnes:
├── id (UUID, PK)
├── owner_user_id (UUID, FK)
├── gite_id (UUID, FK, nullable)
├── question (TEXT, NOT NULL)
├── question_en (TEXT) -- Traduction auto
├── answer (TEXT)
├── answer_en (TEXT) -- Traduction auto
├── reponse_en (TEXT) -- Alias obsolète
├── category / categorie (TEXT, alias)
├── priority / ordre (INTEGER, alias)
├── is_visible (BOOLEAN, default true)
└── created_at, updated_at

Index:
├── idx_faq_owner
├── idx_faq_gite
├── idx_faq_category
├── idx_faq_priority
├── idx_faq_translations (question_en, reponse_en)
├── idx_faq_categorie
└── idx_faq_ordre

Relations:
├── Auth: auth.users (CASCADE DELETE)
└── Gîte: gites (CASCADE DELETE, nullable = tous gîtes)
```

##### `client_access_tokens`
```sql
Colonnes:
├── id (UUID, PK)
├── owner_user_id (UUID, FK)
├── reservation_id (UUID, FK)
├── token (TEXT, UNIQUE, NOT NULL)
├── expires_at (TIMESTAMPTZ, NOT NULL)
├── is_active (BOOLEAN, default true)
└── created_at, updated_at

Index:
├── idx_tokens_owner (owner_user_id)
└── idx_tokens_token (token) -- Recherche rapide

Relations:
├── Auth: auth.users (CASCADE DELETE)
└── Réservation: reservations (CASCADE DELETE)

Logique:
└── Token généré pour fiche-client.html?token=XXXXX
    └── Validité: Jusqu'à 7 jours après check_out
```

##### `activites_gites` (POI & Activités)
```sql
Colonnes:
├── id (UUID, PK)
├── owner_user_id (UUID, FK)
├── gite_id (UUID, FK)
├── nom (TEXT, NOT NULL)
├── categorie (TEXT) -- 'restaurant', 'cafe', 'musee', 'chateau', ...
├── description (TEXT)
├── adresse (TEXT) -- Adresse complète pour géocodage
├── latitude, longitude (NUMERIC) -- Auto via Nominatim
├── distance_km (NUMERIC) -- Calculée auto depuis gîte
├── url (TEXT)
├── telephone (TEXT)
├── note (NUMERIC(2,1)) -- Note Google 0-5
├── nb_avis (INTEGER)
├── photos (JSONB) -- Array URLs
├── is_active (BOOLEAN, default true)
└── created_at, updated_at

Index:
├── idx_activites_owner
├── idx_activites_gite
└── idx_activites_categorie

Géocodage Automatique:
└── API: OpenStreetMap Nominatim (gratuite)
    └── Limite: 1 req/sec
    └── Input: adresse → Output: lat/lng + distance calculée

Relations:
├── Auth: auth.users (CASCADE DELETE)
└── Gîte: gites (CASCADE DELETE)
```

#### **Groupe 3 : Gestion Ménage (4 tables)**

##### `cleaning_schedule`
```sql
Colonnes:
├── id (UUID, PK)
├── owner_user_id (UUID, FK)
├── gite_id (UUID, FK)
├── reservation_id (UUID, FK, nullable)
├── date (DATE, NOT NULL)
├── type (TEXT) -- 'entree', 'sortie', 'intermediaire'
├── status (TEXT) -- 'a_faire', 'en_cours', 'termine', 'valide'
├── assignee_email (TEXT) -- Email femme de ménage
├── notes (TEXT)
├── photos (JSONB) -- Photos du ménage réalisé
├── validated_by (UUID, FK)
├── validated_at (TIMESTAMPTZ)
└── created_at, updated_at

Index:
├── idx_cleaning_schedule_owner
├── idx_cleaning_schedule_gite
├── idx_cleaning_schedule_date
└── idx_cleaning_schedule_resa

Relations:
├── Auth: auth.users
├── Gîte: gites
└── Réservation: reservations (nullable)
```

##### `cleaning_rules` (9 règles configurables)
```sql
Colonnes:
├── id (UUID, PK)
├── rule_code (TEXT, UNIQUE) -- 'enchainement', 'jours_feries', ...
├── rule_name (TEXT)
├── description (TEXT)
├── is_enabled (BOOLEAN, default true)
├── priority (INTEGER)
├── config (JSONB) -- Configuration spécifique par règle
└── created_at, updated_at

Règles Disponibles:
├── 1. enchainement (Gestion check-out → check-in même jour)
├── 2. jours_feries (Pas de ménages jours fériés)
├── 3. week-ends (Surcoût week-ends)
├── 4. prevenance (Délai mini avant intervention)
├── 5. plages_horaires (Créneaux autorisés)
├── 6. meteo (Tenir compte météo)
├── 7. distance (Optimiser trajets)
├── 8. capacite (Nb ménages max/jour)
└── 9. priorite_gites (Ordre de traitement)

Index:
└── idx_cleaning_rules_code (rule_code)
```

##### `retours_menage` (Retours femme de ménage)
```sql
Colonnes:
├── id (UUID, PK)
├── owner_user_id (UUID, FK)
├── cleaning_schedule_id (UUID, FK)
├── gite_id (UUID, FK)
├── type (TEXT) -- 'probleme', 'suggestion', 'question'
├── description (TEXT, NOT NULL)
├── photos (JSONB)
├── urgence (TEXT) -- 'faible', 'moyen', 'urgent'
├── status (TEXT) -- 'non_traite', 'en_cours', 'resolu'
├── reponse (TEXT)
├── traite_par (UUID, FK)
├── traite_at (TIMESTAMPTZ)
└── created_at

Index:
├── idx_retours_menage_owner
├── idx_retours_menage_cleaning
└── idx_retours_menage_gite

Relations:
├── Auth: auth.users
├── Cleaning: cleaning_schedule
└── Gîte: gites
```

##### `problemes_signales` (Signalements clients)
```sql
Colonnes:
├── id (UUID, PK)
├── owner_user_id (UUID, FK)
├── reservation_id (UUID, FK)
├── gite_id (UUID, FK)
├── type (TEXT) -- 'panne', 'casse', 'proprete', 'manque', 'autre'
├── description (TEXT, NOT NULL)
├── photos (JSONB)
├── urgence (TEXT)
├── status (TEXT)
├── reponse (TEXT)
├── traite_par (UUID)
├── traite_at (TIMESTAMPTZ)
└── created_at

Index:
├── idx_problemes_owner
├── idx_problemes_resa
└── idx_problemes_gite

Relations:
├── Auth: auth.users
├── Réservation: reservations
└── Gîte: gites
```

#### **Groupe 4 : Fiscalité (4 tables)**

##### `simulations_fiscales`
```sql
Colonnes:
├── id (UUID, PK)
├── owner_user_id (UUID, FK)
├── annee (INTEGER, NOT NULL)
├── chiffre_affaires (NUMERIC)
├── charges_totales (NUMERIC)
├── regime (TEXT) -- 'lmnp_reel', 'micro_bic_30', 'micro_bic_50', 'lmp_reel'
├── tmi (NUMERIC) -- Tranche Marginale Imposition
├── rfr (NUMERIC) -- Revenu Fiscal de Référence
├── versement_liberatoire (BOOLEAN)
├── meuble_classe (BOOLEAN) -- Si classé ⭐
├── resultat_fiscal (NUMERIC)
├── ir_du (NUMERIC) -- Impôt sur le Revenu
├── urssaf_du (NUMERIC) -- Charges sociales
├── total_a_payer (NUMERIC)
├── donnees_detaillees (JSONB) -- Détail charges, travaux, etc.
└── created_at, updated_at

Contraintes:
└── UNIQUE (owner_user_id, annee)

Index:
├── idx_sim_fiscales_owner
└── idx_sim_fiscales_annee
```

##### `km_trajets` (Frais kilométriques)
```sql
Colonnes:
├── id (UUID, PK)
├── owner_user_id (UUID, FK)
├── gite_id (UUID, FK)
├── reservation_id (UUID, FK, nullable)
├── date_trajet (DATE, NOT NULL)
├── motif (TEXT) -- 'menage_entree', 'menage_sortie', 'courses', 'maintenance'
├── type_trajet (TEXT)
├── lieu_arrivee (TEXT)
├── distance_aller (NUMERIC)
├── aller_retour (BOOLEAN, default true)
├── distance_totale (NUMERIC) -- Calculée (×2 si A/R)
├── auto_genere (BOOLEAN, default false) -- Créé par automation
└── created_at

Automation:
└── Créés automatiquement lors d'ajout/modif réservation
    └── Basé sur table km_config_auto

Index:
├── idx_km_trajets_owner
├── idx_km_trajets_gite
└── idx_km_trajets_date

Relations:
├── Auth: auth.users
├── Gîte: gites
└── Réservation: reservations (nullable)
```

##### `km_config_auto`
```sql
Colonnes:
├── id (UUID, PK)
├── owner_user_id (UUID, FK, UNIQUE)
├── auto_menage_entree (BOOLEAN, default false)
├── auto_menage_sortie (BOOLEAN, default false)
├── auto_courses (BOOLEAN, default false)
├── auto_maintenance (BOOLEAN, default false)
└── created_at, updated_at

Index:
└── idx_km_config_owner

Relations:
└── Auth: auth.users
```

##### `km_lieux_favoris`
```sql
Colonnes:
├── id (UUID, PK)
├── owner_user_id (UUID, FK)
├── nom (TEXT, NOT NULL)
├── type_lieu (TEXT) -- 'supermarche', 'bricolage', 'laverie', etc.
├── distance_km (NUMERIC, NOT NULL)
├── adresse (TEXT)
└── created_at

Index:
└── idx_km_favoris_owner

Relations:
└── Auth: auth.users
```

#### **Groupe 5 : Stocks Linge (3 tables)**

##### `linen_stocks` (Stock global)
```sql
Colonnes:
├── id (UUID, PK)
├── owner_user_id (UUID, FK)
├── gite_id (UUID, FK, UNIQUE)
├── draps_plats_grands (INTEGER, default 0)
├── draps_plats_petits (INTEGER, default 0)
├── housses_couettes_grandes (INTEGER, default 0)
├── housses_couettes_petites (INTEGER, default 0)
├── taies_oreillers (INTEGER, default 0)
├── serviettes (INTEGER, default 0)
├── tapis_bain (INTEGER, default 0)
└── updated_at

Index:
├── idx_linen_stocks_owner
└── idx_linen_stocks_gite (UNIQUE)

Relations:
├── Auth: auth.users
└── Gîte: gites (UNIQUE = 1 ligne par gîte)
```

##### `linen_stock_items` (Dynamique, personnalisable)
```sql
Colonnes:
├── id (UUID, PK)
├── owner_user_id (UUID, FK)
├── gite_id (UUID, FK)
├── item_key (TEXT) -- Clé unique du type de linge
├── quantity (INTEGER, default 0)
└── created_at, updated_at

Contraintes:
└── UNIQUE (gite_id, item_key)

Index:
├── idx_linen_items_owner
├── idx_linen_items_gite
└── idx_linen_items_key

Utilisation:
└── Permet ajout de types de linge personnalisés par client

Relations:
├── Auth: auth.users
└── Gîte: gites
```

##### `linen_stock_transactions` (Historique mouvements)
```sql
Colonnes:
├── id (UUID, PK)
├── owner_user_id (UUID, FK)
├── gite_id (UUID, FK)
├── reservation_id (UUID, FK, nullable)
├── type (TEXT) -- 'entree', 'sortie', 'ajustement'
├── item_type (TEXT) -- Type de linge concerné
├── quantity_change (INTEGER) -- Positif ou négatif
├── quantity_after (INTEGER) -- Stock après opération
├── reason (TEXT)
└── created_at

Index:
├── idx_linen_transactions_owner
├── idx_linen_transactions_gite
└── idx_linen_transactions_date

Relations:
├── Auth: auth.users
├── Gîte: gites
└── Réservation: reservations (nullable)
```

### 2.2 Tables Channel Manager / SaaS Admin (15 tables)

##### `cm_clients` (Clients SaaS)
```sql
Colonnes:
├── id (UUID, PK)
├── email (TEXT, UNIQUE, NOT NULL)
├── name (TEXT)
├── company_name (TEXT)
├── phone (TEXT)
├── address (TEXT) -- Ajouté récemment
├── referral_code (TEXT, UNIQUE)
├── referred_by (UUID, FK → cm_clients, nullable)
├── status (TEXT) -- 'trial', 'active', 'suspended', 'cancelled'
├── trial_ends_at (TIMESTAMPTZ)
├── onboarding_completed (BOOLEAN, default false)
├── onboarding_step (INTEGER, default 0)
├── preferences (JSONB)
├── metadata (JSONB)
└── created_at, updated_at

Index:
├── idx_cm_clients_email
├── idx_cm_clients_referral_code
└── idx_cm_clients_status

Relations:
└── Self-referencing: cm_clients (referred_by)
```

##### `cm_subscriptions` (Abonnements)
```sql
Colonnes:
├── id (UUID, PK)
├── client_id (UUID, FK → cm_clients)
├── plan_id (UUID, FK → cm_pricing_plans)
├── status (TEXT) -- 'active', 'cancelled', 'paused'
├── current_period_start (TIMESTAMPTZ)
├── current_period_end (TIMESTAMPTZ)
├── cancel_at_period_end (BOOLEAN, default false)
├── cancelled_at (TIMESTAMPTZ)
├── trial_end (TIMESTAMPTZ)
├── stripe_subscription_id (TEXT)
├── amount (NUMERIC)
├── currency (TEXT, default 'EUR')
├── billing_cycle (TEXT) -- 'monthly', 'yearly'
└── created_at, updated_at

Index:
├── idx_cm_subscriptions_client
├── idx_cm_subscriptions_plan
└── idx_cm_subscriptions_status

Relations:
├── Client: cm_clients
└── Plan: cm_pricing_plans
```

##### `cm_invoices` (Factures)
```sql
Colonnes:
├── id (UUID, PK)
├── client_id (UUID, FK)
├── subscription_id (UUID, FK)
├── invoice_number (TEXT, UNIQUE)
├── amount (NUMERIC, NOT NULL)
├── tax (NUMERIC, default 0)
├── total (NUMERIC, NOT NULL)
├── currency (TEXT, default 'EUR')
├── status (TEXT) -- 'draft', 'sent', 'paid', 'overdue', 'cancelled'
├── issued_date (DATE)
├── due_date (DATE)
├── paid_date (DATE)
├── payment_method (TEXT)
├── stripe_invoice_id (TEXT)
├── pdf_url (TEXT)
└── created_at, updated_at

Index:
├── idx_cm_invoices_client
├── idx_cm_invoices_subscription
├── idx_cm_invoices_number
└── idx_cm_invoices_status

Relations:
├── Client: cm_clients
└── Subscription: cm_subscriptions
```

##### `cm_pricing_plans` (Plans tarifaires)
```sql
Colonnes:
├── id (UUID, PK)
├── name (TEXT, NOT NULL) -- 'Starter', 'Pro', 'Enterprise'
├── slug (TEXT, UNIQUE)
├── description (TEXT)
├── price_monthly (NUMERIC)
├── price_yearly (NUMERIC)
├── features (JSONB) -- Array de features
├── limits (JSONB) -- {gites: 5, reservations: 100, ...}
├── is_active (BOOLEAN, default true)
├── sort_order (INTEGER)
└── created_at, updated_at

Index:
├── idx_cm_pricing_plans_slug
└── idx_cm_pricing_plans_active
```

##### `cm_promotions` (Codes promo)
```sql
Colonnes:
├── id (UUID, PK)
├── code (TEXT, UNIQUE, NOT NULL)
├── name (TEXT)
├── description (TEXT)
├── type (TEXT) -- 'percentage', 'fixed_amount', 'trial_extension'
├── value (NUMERIC) -- Ex: 20 pour 20% ou 50 pour 50€
├── max_uses (INTEGER)
├── uses_count (INTEGER, default 0)
├── valid_from (TIMESTAMPTZ)
├── valid_until (TIMESTAMPTZ)
├── applicable_plans (JSONB) -- Array de plan_ids
├── is_active (BOOLEAN, default true)
└── created_at, updated_at

Index:
├── idx_cm_promotions_code
└── idx_cm_promotions_active

Triggers:
└── update_promotional_discount() -- Calcule réduction temps réel
```

##### `cm_promo_usage` (Utilisation codes promo)
```sql
Colonnes:
├── id (UUID, PK)
├── promotion_id (UUID, FK → cm_promotions)
├── client_id (UUID, FK → cm_clients)
├── subscription_id (UUID, FK)
├── discount_amount (NUMERIC)
├── applied_at (TIMESTAMPTZ, default now())
└── created_at

Index:
├── idx_cm_promo_usage_promo
├── idx_cm_promo_usage_client
└── idx_cm_promo_usage_subscription

Relations:
├── Promotion: cm_promotions
├── Client: cm_clients
└── Subscription: cm_subscriptions
```

##### `cm_support_tickets` (Tickets support)
```sql
Colonnes:
├── id (UUID, PK)
├── client_id (UUID, FK)
├── title (TEXT, NOT NULL)
├── description (TEXT)
├── category (TEXT) -- 'bug', 'feature_request', 'question', 'billing'
├── priority (TEXT) -- 'low', 'medium', 'high', 'critical'
├── status (TEXT) -- 'open', 'in_progress', 'waiting_customer', 'resolved', 'closed'
├── assigned_to (TEXT) -- Email admin
├── resolution_notes (TEXT)
├── resolved_at (TIMESTAMPTZ)
├── closed_at (TIMESTAMPTZ)
├── first_response_at (TIMESTAMPTZ)
├── tags (JSONB)
└── created_at, updated_at

Index:
├── idx_cm_support_tickets_client
├── idx_cm_support_tickets_status
├── idx_cm_support_tickets_priority
└── idx_cm_support_tickets_category

Relations:
└── Client: cm_clients
```

##### `cm_support_comments` (Commentaires tickets)
```sql
Colonnes:
├── id (UUID, PK)
├── ticket_id (UUID, FK → cm_support_tickets)
├── author_email (TEXT, NOT NULL)
├── author_role (TEXT) -- 'client', 'admin'
├── content (TEXT, NOT NULL)
├── is_internal (BOOLEAN, default false) -- Note interne admin
├── attachments (JSONB)
└── created_at

Index:
├── idx_cm_support_comments_ticket
└── idx_cm_support_comments_author

Relations:
└── Ticket: cm_support_tickets (CASCADE DELETE)
```

##### `cm_activity_logs` (Logs activité)
```sql
Colonnes:
├── id (UUID, PK)
├── client_id (UUID, FK, nullable)
├── action (TEXT, NOT NULL) -- 'login', 'create_gite', 'sync_ical', ...
├── resource_type (TEXT) -- 'gite', 'reservation', 'user', ...
├── resource_id (UUID)
├── metadata (JSONB) -- Détails action
├── ip_address (TEXT)
├── user_agent (TEXT)
└── created_at

Index:
├── idx_cm_activity_logs_client
├── idx_cm_activity_logs_action
└── idx_cm_activity_logs_date

Relations:
└── Client: cm_clients (nullable)
```

##### `cm_referrals` (Programme parrainage)
```sql
Colonnes:
├── id (UUID, PK)
├── referrer_id (UUID, FK → cm_clients)
├── referred_id (UUID, FK → cm_clients)
├── referral_code (TEXT)
├── status (TEXT) -- 'pending', 'completed', 'rewarded'
├── reward_amount (NUMERIC)
├── reward_type (TEXT) -- 'discount', 'credit', 'months_free'
├── reward_applied (BOOLEAN, default false)
├── completed_at (TIMESTAMPTZ)
└── created_at

Index:
├── idx_cm_referrals_referrer
├── idx_cm_referrals_referred
└── idx_cm_referrals_code

Relations:
├── Referrer: cm_clients
└── Referred: cm_clients
```

##### `cm_revenue_tracking` (Tracking CA)
```sql
Colonnes:
├── id (UUID, PK)
├── date (DATE, NOT NULL)
├── source (TEXT) -- 'subscription', 'addon', 'referral_bonus'
├── amount (NUMERIC, NOT NULL)
├── currency (TEXT, default 'EUR')
├── client_id (UUID, FK, nullable)
├── subscription_id (UUID, FK, nullable)
├── description (TEXT)
└── created_at

Index:
├── idx_cm_revenue_date
├── idx_cm_revenue_source
└── idx_cm_revenue_client

Relations:
├── Client: cm_clients (nullable)
└── Subscription: cm_subscriptions (nullable)
```

##### `cm_ai_content_queue` (Queue génération contenu IA)
```sql
Colonnes:
├── id (UUID, PK)
├── client_id (UUID, FK)
├── content_type (TEXT) -- 'description_gite', 'email_campaign', 'social_post'
├── status (TEXT) -- 'pending', 'processing', 'completed', 'failed'
├── priority (INTEGER, default 0)
├── input_data (JSONB)
├── output_content (TEXT)
├── model_used (TEXT) -- 'gpt-4', 'claude-3-opus', ...
├── tokens_used (INTEGER)
├── cost (NUMERIC)
├── error_message (TEXT)
├── processed_at (TIMESTAMPTZ)
└── created_at

Index:
├── idx_cm_ai_queue_client
├── idx_cm_ai_queue_status
└── idx_cm_ai_queue_priority

Relations:
└── Client: cm_clients
```

##### `cm_support_solutions` (Base connaissance IA)
```sql
Colonnes:
├── id (UUID, PK)
├── categorie (TEXT, NOT NULL)
├── titre (TEXT, NOT NULL)
├── description (TEXT)
├── solution (TEXT, NOT NULL)
├── mots_cles (TEXT[])
├── erreur_texte (TEXT)
├── erreur_stack (TEXT)
├── contexte (TEXT)
├── plan_detaille (JSONB)
├── reussite_count (INTEGER, default 0)
├── echec_count (INTEGER, default 0)
├── score_pertinence (NUMERIC)
├── valide_par (TEXT)
├── is_active (BOOLEAN, default true)
└── created_at, updated_at

Index:
├── idx_cm_support_solutions_categorie
├── idx_cm_support_solutions_mots_cles (GIN)
└── idx_cm_support_solutions_score

Relations:
└── Aucune (Standalone KB)
```

##### `cm_support_diagnostics` (Diagnostics auto)
```sql
Colonnes:
├── id (UUID, PK)
├── ticket_id (UUID, FK → cm_support_tickets, nullable)
├── client_id (UUID, FK)
├── symptomes (TEXT, NOT NULL)
├── contexte (JSONB)
├── solution_proposee_id (UUID, FK → cm_support_solutions)
├── status (TEXT) -- 'propose', 'accepte', 'refuse', 'en_test'
├── feedback (TEXT)
└── created_at

Index:
├── idx_cm_diagnostics_ticket
├── idx_cm_diagnostics_client
└── idx_cm_diagnostics_solution

Relations:
├── Ticket: cm_support_tickets (nullable)
├── Client: cm_clients
└── Solution: cm_support_solutions
```

##### `cm_website_pages` (Pages site commercial)
```sql
Colonnes:
├── id (UUID, PK)
├── slug (TEXT, UNIQUE, NOT NULL)
├── title (TEXT, NOT NULL)
├── description (TEXT)
├── content (TEXT)
├── seo_title (TEXT)
├── seo_description (TEXT)
├── seo_keywords (TEXT)
├── og_image (TEXT)
├── status (TEXT) -- 'draft', 'published', 'archived'
├── published_at (TIMESTAMPTZ)
└── created_at, updated_at

Index:
├── idx_cm_website_pages_slug
└── idx_cm_website_pages_status

Relations:
└── Aucune (Content Management)
```

### 2.3 Tables Support & Monitoring (5 tables)

##### `error_logs` (Logs erreurs frontend)
```sql
Colonnes:
├── id (UUID, PK)
├── user_id (UUID, FK, nullable)
├── error_message (TEXT, NOT NULL)
├── error_stack (TEXT)
├── error_type (TEXT)
├── url (TEXT)
├── user_agent (TEXT)
├── browser (TEXT)
├── os (TEXT)
├── timestamp (TIMESTAMPTZ, default now())
├── severity (TEXT) -- 'low', 'medium', 'high', 'critical'
├── resolved (BOOLEAN, default false)
├── resolved_at (TIMESTAMPTZ)
└── metadata (JSONB)

Index:
├── idx_error_logs_user
├── idx_error_logs_timestamp
├── idx_error_logs_type
└── idx_error_logs_severity

Relations:
└── Auth: auth.users (nullable)
```

##### `error_corrections` (Solutions erreurs connues)
```sql
Colonnes:
├── id (UUID, PK)
├── error_pattern (TEXT, NOT NULL)
├── solution (TEXT, NOT NULL)
├── guide_url (TEXT)
├── priority (INTEGER)
├── is_active (BOOLEAN, default true)
├── occurrences_count (INTEGER, default 0)
└── created_at, updated_at

Index:
├── idx_error_corrections_pattern
└── idx_error_corrections_active

Utilisation:
└── Matching automatique avec error_logs.error_message
```

##### `notifications`
```sql
Colonnes:
├── id (UUID, PK)
├── user_id (UUID, FK)
├── type (TEXT) -- 'info', 'warning', 'success', 'error'
├── title (TEXT, NOT NULL)
├── message (TEXT, NOT NULL)
├── action_url (TEXT)
├── action_label (TEXT)
├── is_read (BOOLEAN, default false)
├── read_at (TIMESTAMPTZ)
├── metadata (JSONB)
└── created_at

Index:
├── idx_notifications_user
├── idx_notifications_is_read
└── idx_notifications_created

Relations:
└── Auth: auth.users (CASCADE DELETE)
```

##### `notification_preferences`
```sql
Colonnes:
├── id (UUID, PK)
├── user_id (UUID, FK, UNIQUE)
├── email_enabled (BOOLEAN, default true)
├── push_enabled (BOOLEAN, default true)
├── sms_enabled (BOOLEAN, default false)
├── notification_types (JSONB) -- {new_reservation: true, ...}
└── updated_at

Index:
└── idx_notif_prefs_user (UNIQUE)

Relations:
└── Auth: auth.users
```

##### `auto_ticket_diagnostics` (Tickets auto-créés)
```sql
Colonnes:
├── id (UUID, PK)
├── user_id (UUID, FK)
├── error_log_id (UUID, FK → error_logs)
├── ticket_id (UUID, FK → cm_support_tickets, nullable)
├── severity (TEXT)
├── auto_created (BOOLEAN, default true)
├── diagnostic_data (JSONB)
├── recommended_solution (TEXT)
└── created_at

Index:
├── idx_auto_ticket_user
├── idx_auto_ticket_error_log
└── idx_auto_ticket_ticket

Relations:
├── Auth: auth.users
├── Error: error_logs
└── Ticket: cm_support_tickets (nullable)
```

### 2.4 Tables Diverses (5 tables)

##### `shopping_lists` (Listes de courses)
```sql
Colonnes:
├── id (UUID, PK)
├── owner_user_id (UUID, FK)
├── gite_id (UUID, FK, nullable)
├── name (TEXT, NOT NULL)
├── is_template (BOOLEAN, default false)
├── created_at, updated_at

Index:
├── idx_shopping_lists_owner
└── idx_shopping_lists_gite

Relations:
├── Auth: auth.users
└── Gîte: gites (nullable)
```

##### `shopping_list_items`
```sql
Colonnes:
├── id (UUID, PK)
├── list_id (UUID, FK → shopping_lists)
├── name (TEXT, NOT NULL)
├── quantity (INTEGER, default 1)
├── unit (TEXT) -- 'pièce', 'kg', 'litre', ...
├── category (TEXT) -- 'alimentation', 'hygiene', 'menage', ...
├── is_checked (BOOLEAN, default false)
├── price (NUMERIC)
├── notes (TEXT)
└── created_at

Index:
├── idx_shopping_items_list
├── idx_shopping_items_category
└── idx_shopping_items_checked

Relations:
└── Liste: shopping_lists (CASCADE DELETE)
```

##### `user_roles` (Rôles multi-utilisateurs)
```sql
Colonnes:
├── id (UUID, PK)
├── user_id (UUID, FK, UNIQUE)
├── role (TEXT, NOT NULL) -- 'admin', 'femme_menage', 'client'
├── permissions (JSONB)
└── created_at, updated_at

Index:
├── idx_user_roles_user (UNIQUE)
└── idx_user_roles_role

Relations:
└── Auth: auth.users

Utilisation:
└── RLS policies basées sur ce rôle
```

##### `historique_donnees` (Historique CA années précédentes)
```sql
Colonnes:
├── id (UUID, PK)
├── owner_user_id (UUID, FK)
├── annee (INTEGER, NOT NULL)
├── donnees_mensuelles (JSONB) -- {janvier: {ca: 5000, ...}, ...}
├── ca_total (NUMERIC)
├── nb_reservations (INTEGER)
└── created_at, updated_at

Contraintes:
└── UNIQUE (owner_user_id, annee)

Index:
├── idx_historique_owner
└── idx_historique_annee

Relations:
└── Auth: auth.users
```

##### `sync_logs` (Historique synchronisations iCal)
```sql
Colonnes:
├── id (UUID, PK)
├── owner_user_id (UUID, FK)
├── gite_id (UUID, FK)
├── platform (TEXT) -- 'airbnb', 'booking', 'abritel', ...
├── status (TEXT) -- 'success', 'error', 'partial'
├── added (INTEGER, default 0)
├── updated (INTEGER, default 0)
├── cancelled (INTEGER, default 0)
├── skipped (INTEGER, default 0)
├── errors (INTEGER, default 0)
├── error_message (TEXT)
├── duration_ms (INTEGER)
└── synced_at (TIMESTAMPTZ, default now())

Index:
├── idx_sync_logs_owner
├── idx_sync_logs_gite
└── idx_sync_logs_date

Relations:
├── Auth: auth.users
└── Gîte: gites
```

### 2.5 Récapitulatif Tables Production

| # | Table | Groupe | Lignes Estimées | Critique |
|---|-------|--------|-----------------|----------|
| 1 | `gites` | Core | ~5-20 / user | ⭐⭐⭐ |
| 2 | `reservations` | Core | ~200-1000 / user | ⭐⭐⭐ |
| 3 | `infos_gites` | Fiches | ~5-20 / user | ⭐⭐⭐ |
| 4 | `checklist_templates` | Fiches | ~20-50 / user | ⭐⭐ |
| 5 | `checklist_progress` | Fiches | ~50-500 / user | ⭐⭐ |
| 6 | `faq` | Fiches | ~10-30 / user | ⭐ |
| 7 | `client_access_tokens` | Fiches | ~50-200 / user | ⭐⭐ |
| 8 | `activites_gites` | Fiches | ~20-100 / user | ⭐⭐ |
| 9 | `cleaning_schedule` | Ménage | ~100-500 / user | ⭐⭐⭐ |
| 10 | `cleaning_rules` | Ménage | 9 globales | ⭐ |
| 11 | `retours_menage` | Ménage | ~10-50 / user | ⭐ |
| 12 | `problemes_signales` | Ménage | ~5-30 / user | ⭐ |
| 13 | `simulations_fiscales` | Fiscalité | ~5-10 / user | ⭐⭐ |
| 14 | `km_trajets` | Fiscalité | ~200-1000 / user | ⭐⭐ |
| 15 | `km_config_auto` | Fiscalité | 1 / user | ⭐ |
| 16 | `km_lieux_favoris` | Fiscalité | ~5-20 / user | ⭐ |
| 17 | `linen_stocks` | Stocks | ~5-20 / user | ⭐⭐ |
| 18 | `linen_stock_items` | Stocks | ~20-100 / user | ⭐ |
| 19 | `linen_stock_transactions` | Stocks | ~100-500 / user | ⭐ |
| 20 | `cm_clients` | SaaS Admin | 1 / user | ⭐⭐⭐ |
| 21 | `cm_subscriptions` | SaaS Admin | 1 / user | ⭐⭐⭐ |
| 22 | `cm_invoices` | SaaS Admin | ~12-120 / user | ⭐⭐ |
| 23 | `cm_pricing_plans` | SaaS Admin | ~5 globales | ⭐⭐ |
| 24 | `cm_promotions` | SaaS Admin | ~10-50 globales | ⭐ |
| 25 | `cm_promo_usage` | SaaS Admin | ~1000 / an | ⭐ |
| 26 | `cm_support_tickets` | SaaS Admin | ~5-50 / user | ⭐⭐ |
| 27 | `cm_support_comments` | SaaS Admin | ~10-200 / user | ⭐ |
| 28 | `cm_activity_logs` | SaaS Admin | ~1000-10000 / user | ⭐ |
| 29 | `cm_referrals` | SaaS Admin | ~0-10 / user | ⭐ |
| 30 | `cm_revenue_tracking` | SaaS Admin | ~365 / an | ⭐⭐ |
| 31 | `cm_ai_content_queue` | SaaS Admin | ~50-500 / user | ⭐ |
| 32 | `cm_support_solutions` | SaaS Admin | ~100 globales | ⭐⭐ |
| 33 | `cm_support_diagnostics` | SaaS Admin | ~50-500 / user | ⭐ |
| 34 | `cm_website_pages` | SaaS Admin | ~20 globales | ⭐ |
| 35 | `error_logs` | Monitoring | ~100-1000 / user | ⭐⭐ |
| 36 | `error_corrections` | Monitoring | ~50 globales | ⭐ |
| 37 | `notifications` | Monitoring | ~100-500 / user | ⭐ |
| 38 | `notification_preferences` | Monitoring | 1 / user | ⭐ |
| 39 | `auto_ticket_diagnostics` | Monitoring | ~10-100 / user | ⭐ |
| 40 | `shopping_lists` | Divers | ~5-20 / user | ⭐ |
| 41 | `shopping_list_items` | Divers | ~50-200 / user | ⭐ |
| 42 | `user_roles` | Divers | 1 / user | ⭐⭐ |
| 43 | `historique_donnees` | Divers | ~5-10 / user | ⭐ |
| 44 | `sync_logs` | Divers | ~500-5000 / user | ⭐ |

**TOTAL : 44 Tables Production Actives**

### 2.6 Indexes & Performance

#### Indexes Critiques (Performance)
```sql
-- Recherche réservations par dates (le plus fréquent)
CREATE INDEX idx_reservations_dates ON reservations(check_in, check_out);
CREATE INDEX idx_reservations_gite_dates ON reservations(gite_id, check_in, check_out);

-- Sync iCal (détection annulations)
CREATE INDEX idx_reservations_last_seen ON reservations(last_seen_in_ical) 
    WHERE source = 'ical' AND manual_override = false;

-- Token fiche client (lookup ultra-rapide)
CREATE INDEX idx_tokens_token ON client_access_tokens(token);

-- Activités par gîte
CREATE INDEX idx_activites_gite_categorie ON activites_gites(gite_id, categorie);

-- Stats mensuelles
CREATE INDEX idx_reservations_month ON reservations(
    EXTRACT(YEAR FROM check_in), 
    EXTRACT(MONTH FROM check_in)
);

-- Full-text search (FAQ)
CREATE INDEX idx_faq_fts ON faq USING GIN(
    to_tsvector('french', question || ' ' || COALESCE(answer, ''))
);
```

#### Indexes Composites Suggérés
```sql
-- Dashboard propriétaire (requête la plus fréquente)
CREATE INDEX idx_dashboard_overview ON reservations(
    owner_user_id, 
    check_in DESC
) WHERE status != 'cancelled';

-- Ménages du jour
CREATE INDEX idx_cleaning_today ON cleaning_schedule(
    owner_user_id, 
    date, 
    status
) WHERE status != 'termine';

-- Notifications non lues
CREATE INDEX idx_notifications_unread ON notifications(
    user_id, 
    created_at DESC
) WHERE is_read = false;
```

### 2.7 Triggers & Automations SQL

| Trigger | Table | Action | But |
|---------|-------|--------|-----|
| `trigger_calculate_restant_reservations` | reservations | BEFORE INSERT/UPDATE | Calcule `restant = montant - acompte` |
| `trigger_sync_gite_name_reservations` | reservations | BEFORE INSERT/UPDATE | Sync colonne `gite` depuis `gites.name` |
| `trigger_sync_aliases_reservations` | reservations | BEFORE INSERT/UPDATE | Sync tous les alias (plateforme, nb_personnes, etc.) |
| `trigger_update_uses_count...` | cm_promo_usage | AFTER INSERT | Incrémente `cm_promotions.uses_count` |
| `update_promotional_discount()` | cm_promotions | MANUAL | Calcule réduction en temps réel |
| `update_campaign_stats()` | parrainage_participations | AFTER INSERT/UPDATE | Met à jour stats campagne parrainage |
| `auto_create_support_ticket()` | error_logs | AFTER INSERT | Crée ticket auto si erreur critique |
| `track_activity_log()` | Multiple | AFTER ... | Log activité utilisateur |

### 2.8 Functions SQL Personnalisées

```sql
1. trigger_calculate_restant() → TRIGGER FUNCTION
2. trigger_sync_gite_name() → TRIGGER FUNCTION
3. trigger_sync_aliases() → TRIGGER FUNCTION
4. update_promotional_discount() → Manual calculation
5. verify_rls_enabled() → Admin diagnostic
6. transfer_ownership(old_user_id, new_user_id) → Migration propriété
7. calculate_taux_occupation(gite_id, annee) → Stats
8. estimate_lmnp_tax(ca, charges) → Simulateur fiscal
```

---

## 3. APPLICATIONS & INTERFACES

### 3.1 Application Desktop Principale (index.html)

**Type :** SPA (Single Page Application)  
**Framework :** Vanilla JavaScript (0 dépendance)  
**Taille :** ~2050 lignes HTML + ~15 000 lignes JS (total modules)  
**Statut :** ✅ Production

#### Structure Générale
```html
<!DOCTYPE html>
<html>
<head>
    <!-- SEO complet -->
    <!-- Open Graph Meta Tags -->
    <!-- Fonts: DM Sans, Archivo Black, JetBrains Mono -->
    <!-- CSS Inline (Critical Path) -->
</head>
<body>
    <!-- Navigation Fixe (Dark/Light + Sidebar/Topbar) -->
    
    <!-- Conteneur Principal -->
    <div id="main-content">
        <!-- Dashboard chargé ici -->
    </div>
    
    <!-- Scripts Externes (CDN) -->
    <script src="https://cdn.jsdelivr.net/npm/supabase-js@2"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4"></script>
    <script src="https://cdn.jsdelivr.net/npm/fullcalendar@6"></script>
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/dompurify@3"></script>
    
    <!-- Modules Locaux (Lazy Loaded) -->
    <script src="/js/shared-config.js"></script>
    <script src="/js/auth.js"></script>
    <script src="/js/gites-manager.js"></script>
    <script src="/js/theme-colors.js"></script>
    <!-- ... 50+ modules -->
</body>
</html>
```

#### Onglets Disponibles (13 tabs)

| # | Onglet | Fichier | Module JS | Fonctionnalités Principales |
|---|--------|---------|-----------|------------------------------|
| 1 | **Dashboard** | tabs/tab-dashboard.html | dashboard.js | Vued'ensemble, TODO, Réservations semaine |
| 2 | **Réservations** | tabs/tab-reservations.html | reservations.js | Calendrier, Sync iCal, CRUD réservations |
| 3 | **Statistiques** | tabs/tab-statistiques.html | statistiques.js | CA, TO%, Graphiques, Comparaison années |
| 4 | **Draps** | tabs/tab-draps.html | draps.js | Stock linge, Prévisions, Simulation besoins |
| 5 | **Ménage** | tabs/tab-menage.html | menage.js | Planning ménages, Règles, Validation |
| 6 | **Fiscalité** | tabs/tab-fiscalite-v2.html | fiscalite-v2.js | LMNP/LMP, Charges, Simulations 4 régimes |
| 7 | **Découvrir** | tabs/tab-decouvrir.html | decouvrir.js | Activités, POI, Carte interactive |
| 8 | **Calendrier & Tarifs** | tabs/tab-calendrier-tarifs.html | calendrier-tarifs.js | Tarifs saisonniers, Disponibilités |
| 9 | **Infos Gîtes** | tabs/tab-infos-gites.html | infos-gites.js | 119 champs bilingues, QR Code WiFi |
| 10 | **Fiches Clients** | tabs/tab-fiches-clients.html | fiches-clients.js | Génération, Envoi, Demandes, Retours |
| 11 | **Checklists** | tabs/tab-checklists.html | checklists.js | Gestion checklists entrée/sortie |
| 12 | **FAQ** | tabs/tab-faq.html | faq.js | Questions fréquentes bilingues |
| 13 | **Parrainage** | tabs/tab-parrainage.html | parrainage.js | Programme fidélité, Codes promos |

#### Système de Navigation

```javascript
// tabs/tab-*.html chargés dynamiquement
function loadTab(tabId) {
    const tabUrl = `/tabs/tab-${tabId}.html`;
    fetch(tabUrl)
        .then(html => document.getElementById('main-content').innerHTML = html)
        .then(() => initTabModule(tabId));
}

// Modules JS initialisés après chargement HTML
const moduleMap = {
    'dashboard': () => window.Dashboard.init(),
    'reservations': () => window.Reservations.init(),
    // ...
};
```

### 3.2 Fiche Client Interactive (PWA)

**Fichier :** pages/fiche-client.html  
**Type :** Progressive Web App (PWA)  
**Taille :** ~3500 lignes HTML + JS  
**Statut :** ✅ Production

#### Caractéristiques PWA
```json
{
  "name": "LiveOwnerUnit - Fiche Locataire",
  "short_name": "Fiche Client",
  "start_url": "/pages/fiche-client.html",
  "display": "standalone",
  "theme_color": "#00FFD1",
  "background_color": "#FFFFFF",
  "icons": [
    // 192x192, 512x512
  ]
}
```

#### Structure
```html
<body>
    <!-- Header Personnalisé -->
    <header>
        <div class="logo-area">
            <!-- Logo dynamique (Entreprise / Gîte de France) -->
        </div>
        <div class="info-sejour">
            <!-- Nom gîte + Dates séjour -->
        </div>
        <div class="controls">
            <!-- Switch Thème + Switch Langue FR/EN -->
        </div>
    </header>
    
    <!-- Hero Section (Avant Arrivée) -->
    <section id="hero-countdown">
        <!-- Compte à rebours J/H/M -->
        <!-- 4 Actions Rapides (Code, WiFi, Activités, Contact) -->
    </section>
    
    <!-- Timeline du Séjour -->
    <div id="timeline">
        <div class="phase" data-phase="avant">...</div>
        <div class="phase active" data-phase="pendant">...</div>
        <div class="phase" data-phase="apres">...</div>
    </div>
    
    <!-- Tabs Navigation -->
    <nav class="tabs-nav">
        <button data-tab="entree">🏠 Entrée</button>
        <button data-tab="pendant">🌟 Pendant</button>
        <button data-tab="sortie">🚪 Sortie</button>
        <button data-tab="activites">🗺️ Activités</button>
        <button data-tab="demandes">💬 Demandes</button>
        <button data-tab="evaluation">⭐ Évaluation</button>
        <button data-tab="faq">❓ FAQ</button>
    </nav>
    
    <!-- Tabs Content -->
    <div id="tabs-content">
        <!-- 7 onglets détaillés -->
    </div>
    
    <!-- Service Worker -->
    <script>
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw-fiche-client.js');
        }
    </script>
</body>
```

#### Onglets Fiche Client

| # | Onglet | Contenu | Interactions Client |
|---|--------|---------|---------------------|
| 1 | **Entrée** | Adresse, Horaire, Code, Parking, Accessibilité | Demande arrivée anticipée |
| 2 | **Pendant** | WiFi (QR Code), Chauffage, Cuisine, TV, Linge, Piscine, Poubelles, Animaux, Contacts urgence | Copie WiFi password |
| 3 | **Sortie** | Heure départ, Checklist départ (10 items cochables), Photos sortie optionnelles | Validation checklist |
| 4 | **Activités** | Carte interactive Leaflet, Liste POI avec filtres, Distance/Temps trajet, Itinéraire Google Maps | Ajout favoris |
| 5 | **Demandes** | Signaler problème (photos + urgence), Suggestion, Question, Retour d'expérience | Envoi formulaires |
| 6 | **Évaluation** | 5 critères notation (étoiles), Commentaire, Points forts/améliorer, Photos séjour | Soumission avis |
| 7 | **FAQ** | Accordéons par catégorie, Recherche, Bilingue FR/EN auto | Poser nouvelle question |

#### Analytics Fiche Client

```javascript
// Tracking consultations (stocké en DB)
{
    token: "XXXXX",
    opened_count: 5,
    time_spent: {
        entree: 120, // secondes
        pendant: 300,
        activites: 450,
        // ...
    },
    elements_viewed: {
        wifi_qr_code: true,
        activite_restaurant_1: true,
        // ...
    },
   checklist_progress: 8/10, // 80%
    problemes_signales: 0,
    evaluation_soumise: false
}
```

### 3.3 Interface Femme de Ménage

**Fichier :** pages/femme-menage.html  
**Type :** Interface tierce simplifiée  
**Taille :** ~1800 lignes  
**Statut :** ✅ Production

#### Fonctionnalités
- ✅ Connexion par email (sans mot de passe)
- ✅ Liste ménages assignés (filtre par date)
- ✅ Détails gîte + Instructions zone par zone
- ✅ Checklist validation (Cuisine, Chambres, SdB, etc.)
- ✅ Upload photos (avant/après)
- ✅ Signalement problèmes
- ✅ Validation finale
- ✅ Historique interventions

#### Vue Liste Ménages

```html
<div class="menage-card">
    <div class="menage-header">
        <h3>🏠 Gîte Couzon</h3>
        <span class="date">📅 15/02/2026</span>
        <span class="type">🚪 Sortie</span>
    </div>
    <div class="menage-info">
        <p>📍 Adresse du gîte</p>
        <p>⏱️ Durée estimée : 2h</p>
        <p>👥 Client : Famille Dupont (4 pers.)</p>
    </div>
    <div class="menage-actions">
        <button onclick="startCleaning(id)">▶️ Commencer</button>
    </div>
</div>
```

### 3.4 Pages Administration SaaS (13 pages)

**Préfixe :** pages/admin-*  
**Rôle :** Back-office Channel Manager  
**Statut :** 🚧 Beta (développement avancé)

#### Liste Pages Admin

| # | Page | Fichier | Module JS | Fonction |
|---|------|---------|-----------|----------|
| 1 | **Clients** | admin-clients.html | admin-clients.js | Gestion clients SaaS, Abonnements |
| 2 | **Channel Manager** | admin-channel-manager.html | - | Interface multi-plateforme (future) |
| 3 | **Finance** | admin-finance.html | admin-finance.js | Revenue tracking, Factures, Stats CA |
| 4 | **Support** | admin-support.html | admin-support.js | Tickets, IA diagnostics, KB solutions |
| 5 | **Monitoring** | admin-monitoring.html | admin-monitoring.js | Logs erreurs, Performance, Uptime |
| 6 | **Content** | admin-content.html | admin-content.js | Gestion contenu site commercial |
| 7 | **Content Analytics** | admin-content-analytics.html | admin-content-analytics.js | Stats SEO, CTR, Conversions |
| 8 | **Promotions** | admin-promotions.html | admin-promotions.js | Codes promo, Campagnes marketing |
| 9 | **Parrainage** | admin-parrainage.html | admin-parrainage.js | Programme fidélité, Rewards |
| 10 | **Communications** | admin-communications.html | - | Emails automatiques, Templates |
| 11 | **Emails** | admin-emails.html | - | Gestion campagnes email |
| 12 | **Ticket Workflow** | admin-ticket-workflow.html | ticket-workflow.js | Workflow automatisation support |
| 13 | **Error Details** | admin-error-details.html | admin-error-monitor.js | Détails erreurs frontend clients |

#### Interface Admin Support (Exemple)

```html
<div class="admin-support-dashboard">
    <!-- Stats KPI -->
    <div class="kpi-grid">
        <div class="kpi-card">
            <h3>Tickets Ouverts</h3>
            <span class="kpi-value">12</span>
            <span class="kpi-trend">-3 vs hier</span>
        </div>
        <!-- ... autres KPI -->
    </div>
    
    <!-- Liste Tickets -->
    <table class="tickets-table">
        <thead>
            <tr>
                <th>ID</th>
                <th>Client</th>
                <th>Titre</th>
                <th>Priorité</th>
                <th>Status</th>
                <th>Créé</th>
                <th>Actions</th>
            </tr>
        </thead>
        <tbody id="tickets-list">
            <!-- Généré dynamiquement -->
        </tbody>
    </table>
    
    <!-- Sidebar: Diagnostic IA -->
    <aside class="ai-diagnostic">
        <h4>🤖 Diagnostic Automatique</h4>
        <div id="ai-suggestions">
            <!-- Solutions proposées par IA -->
        </div>
    </aside>
</div>
```

### 3.5 Pages Annexes (8 pages)

| Page | Fichier | Fonction |
|------|---------|----------|
| **Login** | login.html | Connexion utilisateur |
| **Logout** | logout.html | Déconnexion + Clear session |
| **Options** | options.html | Paramètres compte, Gestion gîtes, Notifications |
| **Onboarding** | onboarding.html | Tutoriel 1ère connexion |
| **Onboarding Demo** | onboarding-demo.html | Démo interactive |
| **Reset Password** | reset-password.html | Réinitialisation mot de passe |
| **Client Support** | client-support.html | Interface support propriétaire |
| **Validation** | validation.html | Validation ménages propriétaire |
| **Analyse Annonce** | analyse-annonce.html | IA analyse annonces Airbnb/Booking |
| **Site Commercial** | app.html | Landing page LiveOwnerUnit |

### 3.6 Version Mobile Responsive

**Dossier :** tabs/mobile/  
**Type :** HTML spécifique mobile (< 768px)  
**Statut :** ✅ Production

#### Pages Mobile Dédiées

```
tabs/mobile/
├── dashboard.html
├── reservations.html
├── draps.html
├── menage.html
├── fiches-clients.html
├── infos-gites.html
├── checklists.html
├── gestion.html
├── archives.html
└── calendrier-tarifs.html
```

#### Différences Mobile vs Desktop

| Feature | Desktop | Mobile |
|---------|---------|--------|
| **Navigation** | Sidebar fixe | Bottom Nav + Hamburger |
| **Tableau** | Colonnes complètes | Cards swipables |
| **Formulaires** | Multi-colonnes | Single column |
| **Modals** | Overlay centered | Full screen |
| **Calendrier** | Vue mensuelle | Vue semaine/jour |
| **Graphiques** | Taille normale | Scroll horizontal |

---

## 4. APIs BACKEND

### 4.1 Serverless Functions (Vercel)

**Localisation :** /api/  
**Runtime :** Node.js 20.x  
**Timeout :** 10s (fonction), 60s (avec streaming)  
**Région :** us-east-1 (config Vercel)

#### Liste Endpoints

| Endpoint | Méthode | Fonction | Utilisation |
|----------|---------|---------|-------------|
| **/api/content-ai** | POST | Génération contenu IA | OpenAI GPT-4, Claude, DALL-E |
| **/api/openai** | POST | Requêtes OpenAI directes | Anciennes routes (legacy) |
| **/api/send-email** | POST | Envoi emails | Zoho Mail API |
| **/api/social-publish** | POST | Publication réseaux sociaux | Facebook, LinkedIn, Twitter |
| **/api/cors-proxy** | GET | Proxy CORS iCal | Contournement restrictions CORS |
| **/api/zoho-oauth** | GET | OAuth Zoho Mail | Obtention access token |
| **/api/zoho-refresh** | POST | Refresh token Zoho | Renouvellement automatique |
| **/api/zoho-proxy** | POST | Proxy Zoho Mail | Envoi emails via Zoho |
| **/api/webhooks/abritel** | POST | Webhook Abritel | Synchronisations temps réel |
| **/api/test** | GET | Test endpoint | Health check |

### 4.2 API Content-AI (Détails)

**Fichier :** api/content-ai.js  
**Taille :** ~1758 lignes  
**Providers :** OpenAI (GPT-4, DALL-E 3), Anthropic (Claude 3 Opus/Sonnet)

#### Actions Disponibles

```javascript
const actions = {
    // Gestion Prompts
    'get-prompt': () => readPromptFromFile(),
    'save-prompt': (prompt, version) => savePromptVersion(),
    
    // Génération Contenu
    'generate-daily-propositions': () => generateDailyContentAI(),
    'generate-blog-post': (subject, tone, length) => generateBlogPost(),
    'generate-email-campaign': (type, audience) => generateEmailCampaign(),
    'generate-social-post': (platform, message) => generateSocialPost(),
    'generate-description-gite': (giteData) => generateGiteDescription(),
    'improve-text': (text, instructions) => improveTextAI(),
    'translate-text': (text, targetLang) => translateText(),
    
    // Images DALL-E 3
    'generate-image': (prompt, style) => generateImageDALLE(),
    
    // Analyse & SEO
    'analyze-listing': (url) => analyzeListingSEO(),
    'generate-meta-tags': (content) => generateMetaTags(),
    
    // Support IA
    'diagnose-error': (errorMessage, context) => diagnoseError(),
    'suggest-solution': (problem) => suggestSolution()
};
```

#### Exemple Requête

```javascript
// Client-side
const response = await fetch('/api/content-ai', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
        action: 'generate-description-gite',
        model: 'claude-3-opus',
        tone: 'professionnel-chaleureux',
        data: {
            nom: 'Gîte Couzon',
            capacity: 6,
            bedrooms: 3,
            features: ['piscine', 'spa', 'wifi']
        }
    })
});

const result = await response.json();
// result.content = "Description générée..."
// result.tokens_used = 1234
// result.cost = 0.05 (€)
```

#### Rate Limiting & Quotas

```javascript
const rateLimits = {
    'gpt-4': {
        requests_per_minute: 60,
        tokens_per_minute: 150000,
        tokens_per_day: 10000000
    },
    'claude-3-opus': {
        requests_per_minute: 50,
        tokens_per_minute: 100000,
        tokens_per_day: 1000000
    },
    'dall-e-3': {
        requests_per_minute: 7,
        images_per_day: 500
    }
};
```

### 4.3 API Email (Zoho Mail)

**Fichier :** api/send-email.js  
**Provider :** Zoho Mail API  
**Authentification :** OAuth 2.0 (refresh token automatique)

#### Configuration

```javascript
const ZOHO_CONFIG = {
    client_id: process.env.ZOHO_CLIENT_ID,
    client_secret: process.env.ZOHO_CLIENT_SECRET,
    refresh_token: process.env.ZOHO_REFRESH_TOKEN,
    from_email: 'noreply@liveownerunit.fr',
    from_name: 'LiveOwnerUnit'
};
```

#### Templates Emails Disponibles

| Template | Déclencheur | Variables |
|----------|-------------|-----------|
| `welcome` | Inscription | {name, trial_end_date} |
| `trial_ending` | J-3 fin trial | {name, days_left} |
| `payment_success` | Paiement OK | {amount, invoice_url} |
| `payment_failed` | Paiement KO | {retry_url} |
| `new_reservation` | Réservation | {client_name, gite, dates} |
| `booking_reminder` | J-3 arrivée | {client_name, checkin_instructions} |
| `fiche_client_ready` | Fiche générée | {client_name, fiche_url} |
| `menage_completed` | Ménage terminé | {gite, photos_url} |
| `support_ticket_created` | Ticket créé | {ticket_id, problem_description} |
| `support_ticket_resolved` | Ticket résolu | {ticket_id, solution} |

### 4.4 API Social Publish

**Fichier :** api/social-publish.js  
**Plateformes :** Facebook, LinkedIn, Twitter (X)  
**Statut :** 🚧 Beta

#### Flux Publication

```javascript
async function publishToSocial(platform, content, media) {
    // 1. Génération contenu via IA (si auto)
    if (content.auto_generate) {
        content.text = await generateSocialPost(platform, content.topic);
    }
    
    // 2. Upload média si présent
    let mediaIds = [];
    if (media) {
        mediaIds = await uploadMedia(platform, media);
    }
    
    // 3. Publication
    const postResult = await platformAPI[platform].publish({
        text: content.text,
        media_ids: mediaIds,
        scheduled_at: content.scheduled_at || null
    });
    
    // 4. Tracking
    await trackPublication(postResult.post_id, platform);
    
    return postResult;
}
```

### 4.5 API CORS Proxy (iCal)

**Fichier :** api/cors-proxy.js  
**Fonction :** Contourner restrictions CORS pour URLs iCal

#### Problème Résolu

```
Airbnb, Booking → Serveur Client (Browser)
             ❌ CORS Error (cross-origin blocked)

Solution:
Client → Vercel Serverless (/api/cors-proxy?url=...) → Airbnb/Booking
         ✅ CORS OK (server-to-server)
```

#### Usage

```javascript
// Au lieu de:
const icalData = await fetch('https://airbnb.com/calendar/ical/...'); // ❌ CORS Error

// On fait:
const icalData = await fetch(`/api/cors-proxy?url=${encodeURIComponent(icalUrl)}`); // ✅ OK
```

#### Sécurité

```javascript
// Whitelist domaines autorisés
const ALLOWED_DOMAINS = [
    'airbnb.com',
    'airbnb.fr',
    'booking.com',
    'abritel.fr',
    'homeaway.com',
    'vrbo.com',
    'reservation.itea.fr' // Gîtes de France
];

function isSafeUrl(url) {
    const domain = new URL(url).hostname;
    return ALLOWED_DOMAINS.some(allowed => domain.includes(allowed));
}
```

### 4.6 Webhooks

**Localisation :** api/webhooks/  
**Format :** [plateforme].js  
**Sécurité :** Signature HMAC validation

#### Webhook Abritel (Exemple)

```javascript
// api/webhooks/abritel.js
export default async function handler(req, res) {
    // 1. Vérifier signature
    const signature = req.headers['x-abritel-signature'];
    const isValid = verifySignature(req.body, signature);
    if (!isValid) return res.status(401).json({error: 'Invalid signature'});
    
    // 2. Parser événement
    const event = req.body;
    const eventType = event.type; // 'booking.created', 'booking.cancelled', etc.
    
    // 3. Traiter selon type
    switch(eventType) {
        case 'booking.created':
            await handleNewBooking(event.data);
            break;
        case 'booking.cancelled':
            await handleCancellation(event.data);
            break;
        case 'booking.modified':
            await handleModification(event.data);
            break;
    }
    
    // 4. Répondre 200 (obligatoire sinon retry)
    return res.status(200).json({received: true});
}
```

---

## 5. APPLICATION iOS NATIVE

### 5.1 Informations Générales

**Framework :** Expo / React Native  
**Language :** TypeScript  
**Version Expo :** SDK 51  
**Target :** iOS 15+  
**Statut :** ✅ Production (App Store ready)  
**Taille :** ~50 fichiers TypeScript/TSX

### 5.2 Structure App

```
ios_apple_app/
├── app/
│   ├── (auth)/
│   │   └── login.tsx                # Écran connexion
│   ├── (tabs)/
│   │   ├── _layout.tsx              # Tab navigator
│   │   ├── index.tsx                # Dashboard (Home)
│   │   ├── reservations.tsx         # Liste réservations
│   │   ├── calendar.tsx             # Calendrier visuel
│   │   ├── cleaning.tsx             # Planning ménages
│   │   ├── linen.tsx                # Stocks draps
│   │   └── settings.tsx             # Paramètres
│   ├── reservation/
│   │   └── [id].tsx                 # Détail réservation (dynamic route)
│   ├── shopping.tsx                 # Liste courses
│   └── _layout.tsx                  # Root layout
├── components/
│   ├── reservation-card.tsx         # Card réservation
│   ├── cleaning-card.tsx            # Card ménage
│   ├── kpi-card.tsx                 # Carte KPI (CA, TO%, etc.)
│   ├── error-banner.tsx             # Bannière erreur
│   ├── empty-state.tsx              # État vide (no data)
│   └── ui/                          # Composants UI communs
├── services/
│   └── supabase.ts                  # Client Supabase + Auth
├── providers/
│   └── auth-provider.tsx            # Context Auth (React Context)
├── constants/
│   ├── config.ts                    # Configuration app
│   └── theme.ts                     # Thème couleurs
├── types/
│   └── models.ts                    # Types TypeScript (Gite, Reservation, etc.)
├── utils/
│   └── dates.ts                     # Helpers dates
├── app.json                         # Config Expo
├── eas.json                         # Build config (EAS)
├── package.json                     # Dépendances
└── tsconfig.json                    # TypeScript config
```

### 5.3 Écrans Principaux

#### Dashboard (Home)

```tsx
// app/(tabs)/index.tsx
export default function DashboardScreen() {
    const [kpis, setKpis] = useState({
        ca_mois: 0,
        ca_annee: 0,
        nb_reservations: 0,
        taux_occupation: 0
    });
    
    return (
        <ScrollView>
            {/* KPI Cards */}
            <View style={styles.kpiGrid}>
                <KPICard title="CA Mois" value={formatCurrency(kpis.ca_mois)} />
                <KPICard title="CA Année" value={formatCurrency(kpis.ca_annee)} />
                <KPICard title="Réservations" value={kpis.nb_reservations} />
                <KPICard title="Taux Occupation" value={`${kpis.taux_occupation}%`} />
            </View>
            
            {/* Réservations Semaine */}
            <Text style={styles.sectionTitle}>📅 Cette Semaine</Text>
            <FlatList
                data={reservationsWeek}
                renderItem={({item}) => <ReservationCard reservation={item} />}
            />
            
            {/* Ménages du Jour */}
            <Text style={styles.sectionTitle}>🧹 Ménages Aujourd'hui</Text>
            <FlatList
                data={cleaningsToday}
                renderItem={({item}) => <CleaningCard cleaning={item} />}
            />
        </ScrollView>
    );
}
```

#### Réservations

```tsx
// app/(tabs)/reservations.tsx
export default function ReservationsScreen() {
    const [reservations, setReservations] = useState([]);
    const [filter, setFilter] = useState('all'); // 'all', 'upcoming', 'past'
    
    return (
        <View style={styles.container}>
            {/* Filtres */}
            <SegmentedControl
                values={['Toutes', 'À venir', 'Passées']}
                selectedIndex={filterIndex}
                onChange={handleFilterChange}
            />
            
            {/* Liste */}
            <FlatList
                data={filteredReservations}
                renderItem={({item}) => (
                    <TouchableOpacity onPress={() => router.push(`/reservation/${item.id}`)}>
                        <ReservationCard reservation={item} />
                    </TouchableOpacity>
                )}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            />
            
            {/* FAB Ajouter */}
            <FAB icon="plus" onPress={() => showAddReservationModal()} />
        </View>
    );
}
```

#### Calendrier

```tsx
// app/(tabs)/calendar.tsx
import { Calendar } from 'react-native-calendars';

export default function CalendarScreen() {
    const [markedDates, setMarkedDates] = useState({});
    
    // Transformer réservations en markedDates
    useEffect(() => {
        const marked = {};
        reservations.forEach(resa => {
            const days = eachDayOfInterval({
                start: new Date(resa.check_in),
                end: new Date(resa.check_out)
            });
            days.forEach(day => {
                const dateKey = format(day, 'yyyy-MM-dd');
                marked[dateKey] = {
                    color: resa.gite.color,
                    textColor: '#FFFFFF',
                    startingDay: dateKey === resa.check_in,
                    endingDay: dateKey === resa.check_out
                };
            });
        });
        setMarkedDates(marked);
    }, [reservations]);
    
    return (
        <Calendar
            markedDates={markedDates}
            markingType="period"
            onDayPress={handleDayPress}
        />
    );
}
```

### 5.4 Services & Auth

#### Supabase Client

```typescript
// services/supabase.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Env } from '@/constants/config';

export const supabase: SupabaseClient | null = hasSupabaseConfig
    ? createClient(Env.supabaseUrl, Env.supabaseAnonKey, {
        auth: {
            storage: AsyncStorage,
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: false
        }
    })
    : null;

// Helpers
export async function getCurrentUser() {
    const { data, error } = await supabase.auth.getUser();
    return data?.user || null;
}

export async function signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({email, password});
    if (error) throw error;
    return data;
}

export async function signOut() {
    await supabase.auth.signOut();
}
```

#### Auth Provider (React Context)

```tsx
// providers/auth-provider.tsx
export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        // Check session initiale
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
            setLoading(false);
        });
        
        // Écouter changements auth
        const { data: listener } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                setUser(session?.user ?? null);
            }
        );
        
        return () => listener.subscription.unsubscribe();
    }, []);
    
    return (
        <AuthContext.Provider value={{ user, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
```

### 5.5 Types TypeScript

```typescript
// types/models.ts
export interface Gite {
    id: string;
    owner_user_id: string;
    name: string;
    slug: string;
    description?: string;
    address?: string;
    icon?: string;
    color: string;
    capacity?: number;
    bedrooms?: number;
    bathrooms?: number;
    latitude?: number;
    longitude?: number;
    ical_sources?: {[platform: string]: string};
    is_active: boolean;
    display_order: number;
    created_at: string;
    updated_at: string;
}

export interface Reservation {
    id: string;
    owner_user_id: string;
    gite_id: string;
    gite?: Gite; // Relation
    check_in: string; // ISO date
    check_out: string;
    client_name: string;
    client_email?: string;
    client_phone?: string;
    guest_count?: number;
    platform?: 'airbnb' | 'booking' | 'abritel' | 'direct';
    status: 'confirmed' | 'cancelled' | 'pending';
    total_price?: number;
    paid_amount?: number;
    restant?: number;
    notes?: string;
    source: 'manual' | 'ical';
    manual_override: boolean;
    created_at: string;
}

export interface CleaningSchedule {
    id: string;
    owner_user_id: string;
    gite_id: string;
    gite?: Gite;
    reservation_id?: string;
    date: string;
    type: 'entree' | 'sortie' | 'intermediaire';
    status: 'a_faire' | 'en_cours' | 'termine' | 'valide';
    assignee_email?: string;
    notes?: string;
    photos?: string[];
    validated_at?: string;
    created_at: string;
}

export interface LinenStock {
    id: string;
    owner_user_id: string;
    gite_id: string;
    draps_plats_grands: number;
    draps_plats_petits: number;
    housses_couettes_grandes: number;
    housses_couettes_petites: number;
    taies_oreillers: number;
    serviettes: number;
    tapis_bain: number;
    updated_at: string;
}
```

### 5.6 Fonctionnalités iOS Natives

#### Push Notifications

```typescript
// Expo Notifications
import * as Notifications from 'expo-notifications';

// Configuration
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true
    })
});

// Demander permissions
async function registerForPushNotifications() {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
        alert('Failed to get push token!');
        return;
    }
    
    const token = (await Notifications.getExpoPushTokenAsync()).data;
    // Envoyer token à backend
    await saveTokenToBackend(token);
}

// Écouter notifications
useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener(notification => {
        console.log('Notification received:', notification);
    });
    
    return () => subscription.remove();
}, []);
```

#### Haptic Feedback

```typescript
import * as Haptics from 'expo-haptics';

// Feedback tactile
function handleButtonPress() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // ... action
}
```

#### Share Sheet

```typescript
import { Share } from 'react-native';

async function shareReservation(reservation: Reservation) {
    try {
        await Share.share({
            message: `Réservation ${reservation.client_name} - ${reservation.gite.name}\n${reservation.check_in} → ${reservation.check_out}`,
            url: `https://app.liveownerunit.fr/reservation/${reservation.id}`
        });
    } catch (error) {
        console.error(error);
    }
}
```

### 5.7 Build & Deploy (EAS)

```json
// eas.json
{
    "cli": {
        "version": ">= 5.9.0"
    },
    "build": {
        "development": {
            "developmentClient": true,
            "distribution": "internal",
            "ios": {
                "simulator": true
            }
        },
        "preview": {
            "distribution": "internal",
            "ios": {
                "simulator": false,
                "bundleIdentifier": "com.liveownerunit.app"
            }
        },
        "production": {
            "ios": {
                "bundleIdentifier": "com.liveownerunit.app",
                "buildNumber": "1.0.0"
            }
        }
    },
    "submit": {
        "production": {
            "ios": {
                "appleId": "stephanecalvignac@hotmail.fr",
                "ascAppId": "XXXXXXXXXX",
                "appleTeamId": "XXXXXXXXXX"
            }
        }
    }
}
```

#### Commandes Build

```bash
# Build développement
eas build --profile development --platform ios

# Build production
eas build --profile production --platform ios

# Submit App Store
eas submit --platform ios

# Update OTA (sans rebuild)
eas update --branch production --message "Bug fixes"
```

---

**(Document limité à 12000 lignes - Suite dans le prochain fichier)**

Je continue la création du document avec les sections 6 à 11...
