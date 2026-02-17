# 📱 RÉFÉRENCE TECHNIQUE - APPLICATION MOBILE LIVEOWNERUNIT

> **Document de référence pour développement application iOS/macOS**  
> **Date de création :** 7 février 2026  
> **Version :** 1.0  
> **Projet :** LiveOwnerUnit - Gestion de Gîtes et Locations Saisonnières

---

## 🎯 VUE D'ENSEMBLE DU PROJET

### Description
**LiveOwnerUnit** est une plateforme SaaS complète de gestion de locations saisonnières (gîtes/meublés de tourisme) permettant :
- Synchronisation automatique des réservations multi-plateformes (iCal)
- Gestion fiscale LMNP/LMP avec simulations
- Création de fiches clients interactives bilingues (FR/EN)
- Suivi des tâches de ménage et maintenance
- Analyse statistique des performances
- Système de parrainage avec récompenses

### État Actuel
- **Statut** : EN PRODUCTION avec clients réels
- **Type** : Application web SaaS multi-tenant
- **Technologie** : HTML/CSS/JavaScript vanilla
- **Backend** : Supabase (PostgreSQL + Auth + Storage)
- **Hébergement** : Vercel
- **URL de production** : En cours de déploiement

### Objectif de ce Document
Fournir toutes les informations techniques nécessaires pour développer une **application mobile native iOS/macOS** en Swift/SwiftUI qui communique avec le backend Supabase existant.

---

## 🏗️ ARCHITECTURE TECHNIQUE

### Stack Technique Backend

#### Supabase (PostgreSQL)
- **URL** : `https://fgqimtpjjhdqeyyaptoj.supabase.co`
- **Anon Key** : `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZncWltdHBqamhkcWV5eWFwdG9qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgxNTU0MjQsImV4cCI6MjA4MzczMTQyNH0.fOuYg0COYts7XXWxgB7AM01Fg6P86f8oz8XVpGdIaNM`
- **Version** : PostgreSQL 15
- **Extensions actives** : uuid-ossp

#### Services Supabase Utilisés
1. **Supabase Auth** : Authentification utilisateurs (email/password)
2. **Supabase Database** : PostgreSQL avec RLS (Row Level Security)
3. **Supabase Storage** : Stockage fichiers (photos, documents)
4. **Supabase Realtime** : Mises à jour temps réel (optionnel)

### Modèle Multi-Tenant
- Isolation des données par `owner_user_id` (UUID)
- RLS activé sur toutes les tables sensibles
- Chaque utilisateur ne voit que ses propres données
- Structure : `organizations → gites → reservations`

---

## 🗄️ SCHÉMA COMPLET DE BASE DE DONNÉES

### 🔑 Conventions de Nommage
- **Tables** : snake_case (ex: `linen_stocks`)
- **Colonnes** : snake_case (ex: `owner_user_id`)
- **Clés primaires** : UUID avec `gen_random_uuid()`
- **Timestamps** : `TIMESTAMPTZ` (timezone UTC)
- **Contraintes FK** : `ON DELETE CASCADE` pour nettoyage automatique

---

### 📋 GROUPE 1 : CORE APPLICATION

#### 1. **gites** (Gîtes / Propriétés)

**Objectif** : Stocker les informations des propriétés gérées par l'utilisateur.

```sql
CREATE TABLE gites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL CHECK (length(name) >= 2),
    slug TEXT NOT NULL CHECK (slug ~ '^[a-z0-9_-]+$'),
    description TEXT,
    address TEXT,
    icon TEXT DEFAULT 'home',
    color TEXT DEFAULT '#667eea',
    capacity INTEGER CHECK (capacity >= 0),
    bedrooms INTEGER CHECK (bedrooms >= 0),
    bathrooms INTEGER CHECK (bathrooms >= 0),
    latitude NUMERIC(10,8),
    longitude NUMERIC(11,8),
    distance_km NUMERIC(6,2) DEFAULT 0, -- Distance depuis domicile (km)
    ical_sources JSONB DEFAULT '{}'::jsonb,
    settings JSONB DEFAULT '{}'::jsonb,
    tarifs_calendrier JSONB DEFAULT '{}'::jsonb,
    regles_tarifaires JSONB DEFAULT '{}'::jsonb,
    regles_tarifs JSONB,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (owner_user_id, slug)
);
```

**Colonnes Clés** :
- `ical_sources` : Sources iCal Airbnb/Booking (format : `{"airbnb": "url", "booking": "url"}`)
- `tarifs_calendrier` : Tarifs par date (format : `{"2026-07-15": 120, "2026-08-01": 150}`)
- `display_order` : Ordre d'affichage dans l'app

**Indexes** :
- `idx_gites_owner` sur `owner_user_id`
- `idx_gites_active` sur `(owner_user_id, is_active)`
- `idx_gites_slug` sur `(owner_user_id, slug)`

---

#### 2. **reservations** (Réservations)

**Objectif** : Stocker toutes les réservations (manuelles + synchronisées iCal).

```sql
CREATE TABLE reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    gite_id UUID NOT NULL REFERENCES gites(id) ON DELETE CASCADE,
    check_in DATE NOT NULL,
    check_out DATE NOT NULL,
    client_name TEXT NOT NULL CHECK (length(client_name) >= 2),
    client_email TEXT,
    client_phone TEXT,
    client_address TEXT,
    guest_count INTEGER,
    nb_personnes INTEGER, -- Alias
    platform TEXT,
    plateforme TEXT, -- Alias
    platform_booking_id TEXT,
    status TEXT DEFAULT 'confirmed',
    total_price NUMERIC(10,2),
    montant NUMERIC(10,2), -- Alias
    currency TEXT DEFAULT 'EUR',
    paid_amount NUMERIC(10,2) DEFAULT 0,
    acompte NUMERIC(10,2) DEFAULT 0, -- Alias
    restant NUMERIC(10,2) DEFAULT 0, -- Calculé automatiquement
    paiement TEXT,
    notes TEXT,
    source TEXT DEFAULT 'manual', -- 'manual' ou 'ical'
    provenance TEXT, -- Alias
    synced_from TEXT, -- Nom de la plateforme iCal
    ical_uid TEXT, -- UID unique de l'événement iCal
    manual_override BOOLEAN DEFAULT false,
    last_seen_in_ical TIMESTAMPTZ,
    message_envoye BOOLEAN DEFAULT false,
    check_in_time TIME,
    check_out_time TIME,
    telephone TEXT, -- Alias
    gite TEXT, -- Nom du gîte (calculé automatiquement)
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CHECK (check_out > check_in)
);
```

**Règles Métier Importantes** :
1. **Une seule réservation par gîte à la fois** : Aucune réservation ne peut démarrer le même jour
2. **Résolution des conflits iCal** : En cas de chevauchement → garder la plus courte en durée
3. **Calcul automatique du restant** : `restant = montant - acompte` (trigger DB)
4. **Synchronisation des alias** : `platform ↔ plateforme`, `montant ↔ total_price`, etc.

**Statuts possibles** :
- `confirmed` : Réservation confirmée
- `pending` : En attente de confirmation
- `cancelled` : Annulée
- `completed` : Terminée

**Indexes** :
- `idx_reservations_owner` sur `owner_user_id`
- `idx_reservations_gite` sur `gite_id`
- `idx_reservations_dates` sur `(check_in, check_out)`
- `idx_reservations_ical_uid` sur `ical_uid`

---

### 📋 GROUPE 2 : FICHES CLIENTS & INFOS DÉTAILLÉES

#### 3. **infos_gites** (Informations Détaillées des Gîtes)

**Objectif** : Stocker TOUTES les informations nécessaires pour générer les fiches clients bilingues (FR/EN).

**Structure** : 119 colonnes organisées en 8 sections. Chaque champ texte a sa version `_en` pour l'anglais.

**Sections** :
1. **Base** : `adresse`, `telephone_urgence`, `email_contact`, `latitude_gite`, `longitude_gite`
2. **WiFi** : `wifi_ssid`, `wifi_password`, `wifi_debit`, `wifi_localisation`, `wifi_zones` (+ versions `_en`)
3. **Arrivée** : `heure_arrivee`, `code_acces`, `parking`, `instructions_acces`, `instructions_cles` (+ `_en`)
4. **Logement** : `chauffage`, `cuisine`, `electromenager`, `chambres`, `equipements` (+ `_en`)
5. **Déchets** : `instructions_tri`, `jours_collecte`, `dechetterie` (+ `_en`)
6. **Sécurité** : `detecteurs`, `extincteur`, `coupures_urgence`, `numeros_urgence` (+ `_en`)
7. **Départ** : `heure_depart`, `checklist_depart`, `restitution_cles` (+ `_en`)
8. **Règlement** : `tabac`, `animaux_acceptes`, `nb_personnes_max`, `caution` (+ `_en`)

**Colonnes Rétrocompatibilité** :
- `code_porte`, `code_portail`, `parking_info`, `acces_description`, `consignes_speciales`

**Relations** :
- FK vers `gites(id)` via `gite_id` (UNIQUE)
- FK vers `auth.users` via `owner_user_id`

---

#### 4. **checklist_templates** (Templates de Checklist Bilingues)

**Objectif** : Stocker les checklists d'entrée/sortie par gîte (affichées sur les fiches clients).

```sql
CREATE TABLE checklist_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    gite_id UUID REFERENCES gites(id) ON DELETE CASCADE, -- NULL = tous les gîtes
    type TEXT NOT NULL CHECK (type IN ('entree', 'sortie')),
    ordre INTEGER DEFAULT 1,
    texte TEXT NOT NULL,
    texte_en TEXT, -- Traduction automatique via API MyMemory
    description TEXT,
    description_en TEXT, -- Traduction automatique
    actif BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Traduction Automatique** :
- Les versions `_en` sont générées automatiquement lors de la sauvegarde
- API utilisée : MyMemory Translation API (gratuite, 10 000 req/jour)
- Fallback : Si traduction manquante → affiche version FR

---

#### 5. **checklist_progress** (Progression Checklist par Réservation)

**Objectif** : Suivre la complétion des checklist pour chaque réservation.

```sql
CREATE TABLE checklist_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reservation_id UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
    template_id UUID NOT NULL REFERENCES checklist_templates(id) ON DELETE CASCADE,
    completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMPTZ,
    completed_by UUID REFERENCES auth.users(id),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (reservation_id, template_id)
);
```

---

#### 6. **faq** (Questions Fréquentes Bilingues)

**Objectif** : FAQ affichées sur les fiches clients (bilingue FR/EN).

```sql
CREATE TABLE faq (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    gite_id UUID REFERENCES gites(id) ON DELETE CASCADE, -- NULL = toutes propriétés
    question TEXT NOT NULL,
    question_en TEXT, -- Traduction automatique
    answer TEXT,
    answer_en TEXT, -- Traduction automatique
    category TEXT, -- 'arrivee', 'sejour', 'depart', 'urgence'
    priority INTEGER DEFAULT 0,
    is_visible BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
```

---

#### 7. **activites_gites** (Activités & POIs Touristiques)

**Objectif** : Base de données des activités et sites touristiques autour des gîtes.

```sql
CREATE TABLE activites_gites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    gite_id UUID NOT NULL REFERENCES gites(id) ON DELETE CASCADE,
    nom TEXT NOT NULL,
    categorie TEXT NOT NULL, -- 'Restaurant', 'Café/Bar', 'Musée', 'Château', 'Parc', 'Hôtel', 'Attraction'
    description TEXT,
    adresse TEXT, -- Adresse complète pour géocodage
    latitude NUMERIC(10,8), -- Géocodage automatique via Nominatim
    longitude NUMERIC(11,8),
    distance_km NUMERIC(6,2), -- Calculée depuis le gîte
    url TEXT,
    telephone TEXT,
    note NUMERIC(2,1), -- Note Google (0-5)
    nb_avis INTEGER, -- Nombre d'avis Google
    photos JSONB, -- URLs des photos
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Géocodage Automatique** :
- API : OpenStreetMap Nominatim (gratuite)
- Workflow : Adresse → GPS (lat/long) → Calcul distance depuis gîte

---

#### 8. **client_access_tokens** (Tokens d'Accès Fiches Clients)

**Objectif** : Générer des liens sécurisés pour que les clients accèdent à leurs fiches sans compte.

```sql
CREATE TABLE client_access_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reservation_id UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Format Token** : `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx` (UUID v4)
**Durée de validité** : Jusqu'à 7 jours après le départ (configurable)

---

### 📋 GROUPE 3 : GESTION MÉNAGE & PLANNING

#### 9. **cleaning_schedule** (Planning de Ménage)

**Objectif** : Planifier les interventions de ménage entre les réservations.

```sql
CREATE TABLE cleaning_schedule (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    gite_id UUID NOT NULL REFERENCES gites(id) ON DELETE CASCADE,
    reservation_id UUID REFERENCES reservations(id) ON DELETE SET NULL,
    scheduled_date DATE NOT NULL,
    scheduled_time TIME,
    status TEXT DEFAULT 'pending', -- 'pending', 'pending_validation', 'validated', 'refused', 'completed'
    assigned_to UUID REFERENCES auth.users(id),
    completed_at TIMESTAMPTZ,
    notes TEXT,
    photos JSONB, -- URLs des photos du ménage effectué
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Statuts** :
- `pending` : À faire
- `pending_validation` : Proposition de modification par femme de ménage
- `validated` : Validé par propriétaire
- `refused` : Refusé
- `completed` : Terminé

---

#### 10. **cleaning_rules** (Règles de Planification Ménage)

**Objectif** : Règles configurables pour planification automatique des ménages.

```sql
CREATE TABLE cleaning_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    rule_code TEXT NOT NULL UNIQUE, -- 'no_sunday', 'no_saturday', 'no_wednesday', etc.
    rule_name TEXT NOT NULL,
    description TEXT,
    is_enabled BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 0,
    config JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
```

**9 Règles par Défaut** :
1. `enchainement` : Ménage entre deux réservations
2. `jours_feries` : Éviter les jours fériés
3. `no_sunday` : Pas le dimanche
4. `no_saturday` : Pas le samedi
5. `no_wednesday` : Pas le mercredi
6. `no_thursday` : Pas le jeudi
7. `heure_defaut` : Heure par défaut (14h)
8. `delai_minimum` : Délai minimum entre départ et arrivée
9. `priorite_enchainements` : Priorité aux enchaînements serrés

---

#### 11. **retours_menage** (Retours Femme de Ménage)

**Objectif** : Commentaires et signalements après intervention.

```sql
CREATE TABLE retours_menage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    cleaning_id UUID NOT NULL REFERENCES cleaning_schedule(id) ON DELETE CASCADE,
    gite_id UUID NOT NULL REFERENCES gites(id) ON DELETE CASCADE,
    commentaires TEXT,
    problemes_signales TEXT,
    temps_passe INTEGER, -- En minutes
    photos JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);
```

---

### 📋 GROUPE 4 : GESTION DU LINGE

#### 12. **linen_stocks** (Stocks de Linge par Gîte)

**Objectif** : Suivi des stocks de draps, serviettes, etc. par gîte (version fixe).

```sql
CREATE TABLE linen_stocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    gite_id UUID NOT NULL REFERENCES gites(id) ON DELETE CASCADE,
    draps_plats_grands INTEGER DEFAULT 0,
    draps_plats_petits INTEGER DEFAULT 0,
    housses_couettes_grandes INTEGER DEFAULT 0,
    housses_couettes_petites INTEGER DEFAULT 0,
    taies_oreillers INTEGER DEFAULT 0,
    serviettes INTEGER DEFAULT 0,
    tapis_bain INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (gite_id)
);
```

---

#### 13. **linen_stock_items** (Stocks Dynamiques)

**Objectif** : Version dynamique et personnalisable des stocks de linge.

```sql
CREATE TABLE linen_stock_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    gite_id UUID NOT NULL REFERENCES gites(id) ON DELETE CASCADE,
    item_key TEXT NOT NULL, -- 'draps_1p', 'draps_2p', 'serviettes', etc.
    quantity INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (gite_id, item_key)
);
```

---

#### 14. **linen_stock_transactions** (Historique Mouvements Linge)

**Objectif** : Traçabilité des mouvements de stock (ajouts, retraits, lavages).

```sql
CREATE TABLE linen_stock_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    gite_id UUID NOT NULL REFERENCES gites(id) ON DELETE CASCADE,
    item_key TEXT NOT NULL,
    quantity_change INTEGER NOT NULL, -- Positif = ajout, Négatif = retrait
    type TEXT NOT NULL, -- 'add', 'remove', 'wash', 'reservation'
    reservation_id UUID REFERENCES reservations(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);
```

---

### 📋 GROUPE 5 : FISCALITÉ & FINANCES

#### 15. **simulations_fiscales** (Simulations Fiscales LMNP/LMP)

**Objectif** : Stocker les calculs fiscaux annuels par utilisateur.

```sql
CREATE TABLE simulations_fiscales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    annee INTEGER NOT NULL,
    chiffre_affaires NUMERIC(10,2) DEFAULT 0,
    regime TEXT NOT NULL, -- 'LMNP_REEL', 'MICRO_30', 'MICRO_50', 'LMP_REEL'
    total_charges NUMERIC(10,2) DEFAULT 0,
    resultat_fiscal NUMERIC(10,2) DEFAULT 0,
    urssaf NUMERIC(10,2) DEFAULT 0,
    impot_revenu NUMERIC(10,2) DEFAULT 0,
    total_a_payer NUMERIC(10,2) DEFAULT 0,
    donnees_detaillees JSONB DEFAULT '{}'::jsonb, -- Travaux, frais, produits
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (owner_user_id, annee)
);
```

**Règle Métier IMPORTANTE** :
- **Minimum URSSAF : 1 200 €/an** (cotisations minimales légales)
- Appliqué automatiquement même si CA faible

---

#### 16. **fiscal_history** (Historique Données Fiscales)

**Objectif** : Archiver les données fiscales par année.

```sql
CREATE TABLE fiscal_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    annee INTEGER NOT NULL,
    mois INTEGER CHECK (mois BETWEEN 1 AND 12),
    chiffre_affaires NUMERIC(10,2) DEFAULT 0,
    charges NUMERIC(10,2) DEFAULT 0,
    benefice NUMERIC(10,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (owner_user_id, annee, mois)
);
```

---

#### 17. **km_trajets** (Trajets Kilométriques Professionnels)

**Objectif** : Historique des trajets pour déduction fiscale.

```sql
CREATE TABLE km_trajets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    gite_id UUID REFERENCES gites(id) ON DELETE CASCADE,
    reservation_id UUID REFERENCES reservations(id) ON DELETE SET NULL,
    date_trajet DATE NOT NULL,
    motif TEXT NOT NULL, -- 'Ménage entrée', 'Ménage sortie', 'Courses', 'Maintenance'
    type_trajet TEXT, -- 'menage', 'courses', 'maintenance', 'autre'
    lieu_arrivee TEXT,
    distance_aller NUMERIC(6,2) NOT NULL,
    aller_retour BOOLEAN DEFAULT true,
    distance_totale NUMERIC(6,2), -- Calculée automatiquement
    auto_genere BOOLEAN DEFAULT false, -- Généré automatiquement depuis réservation
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Automatisation** :
- Les trajets sont créés/mis à jour/supprimés automatiquement lors des opérations sur réservations
- Basé sur la configuration utilisateur (`km_config_auto`)

---

#### 18. **km_config_auto** (Configuration Automatisation Trajets)

**Objectif** : Paramètres d'automatisation des trajets par utilisateur.

```sql
CREATE TABLE km_config_auto (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    auto_menage_entree BOOLEAN DEFAULT true,
    auto_menage_sortie BOOLEAN DEFAULT true,
    auto_courses BOOLEAN DEFAULT false,
    auto_maintenance BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
```

---

#### 19. **km_lieux_favoris** (Lieux Favoris pour Trajets)

**Objectif** : Stocker les lieux fréquents (magasins, fournisseurs) avec leurs distances.

```sql
CREATE TABLE km_lieux_favoris (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    nom TEXT NOT NULL,
    type_lieu TEXT, -- 'magasin', 'fournisseur', 'reparateur', 'autre'
    adresse TEXT,
    distance_km NUMERIC(6,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
```

---

### 📋 GROUPE 6 : SYSTÈME DE PARRAINAGE

#### 20. **referrals** (Parrainages)

**Objectif** : Suivi des parrainages et récompenses.

```sql
CREATE TABLE referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    referred_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    referral_code TEXT NOT NULL UNIQUE,
    status TEXT DEFAULT 'pending', -- 'pending', 'active', 'cancelled'
    reward_type TEXT DEFAULT 'discount', -- 'discount' ou 'points'
    points_earned INTEGER DEFAULT 0,
    discount_percentage NUMERIC(5,2) DEFAULT 0,
    first_payment_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Modèle de Récompenses** :
- **Standard** : -5% par filleul actif (max -100%, 20 filleuls)
- **Gîtes de France** : 100 points par filleul (max 2000 points, 20 filleuls)

---

#### 21. **referral_invitations** (Invitations de Parrainage)

**Objectif** : Tracer les invitations envoyées.

```sql
CREATE TABLE referral_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    sent_at TIMESTAMPTZ DEFAULT now(),
    opened_at TIMESTAMPTZ,
    clicked_at TIMESTAMPTZ,
    status TEXT DEFAULT 'sent' -- 'sent', 'opened', 'clicked', 'registered'
);
```

---

#### 22. **referral_campaigns** (Campagnes de Parrainage)

**Objectif** : Gérer des campagnes temporaires avec récompenses spéciales.

```sql
CREATE TABLE referral_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    multiplier NUMERIC(3,2) DEFAULT 1.0, -- Multiplicateur des points/réductions
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
```

---

### 📋 GROUPE 7 : SUPPORT & MONITORING

#### 23. **cm_support_tickets** (Tickets Support)

**Objectif** : Système de tickets pour le support client.

```sql
CREATE TABLE cm_support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- 'bug', 'feature_request', 'question', 'feedback'
    priority TEXT DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
    status TEXT DEFAULT 'open', -- 'open', 'in_progress', 'waiting_user', 'resolved', 'closed'
    subject TEXT NOT NULL,
    description TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    error_id UUID REFERENCES cm_error_logs(id),
    error_signature TEXT,
    source TEXT DEFAULT 'manual', -- 'manual', 'auto_error', 'auto_diagnostic'
    resolution TEXT,
    closed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
```

---

#### 24. **cm_support_ticket_history** (Historique Tickets)

**Objectif** : Tracer toutes les actions sur les tickets.

```sql
CREATE TABLE cm_support_ticket_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES cm_support_tickets(id) ON DELETE CASCADE,
    action TEXT NOT NULL, -- 'created', 'updated', 'commented', 'status_changed', 'closed'
    old_value TEXT,
    new_value TEXT,
    comment TEXT,
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now()
);
```

---

#### 25. **cm_error_logs** (Logs d'Erreurs Console)

**Objectif** : Capturer et monitorer les erreurs JavaScript côté client.

```sql
CREATE TABLE cm_error_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    session_id TEXT,
    error_type TEXT NOT NULL, -- 'javascript', 'network', 'database', 'auth'
    severity TEXT DEFAULT 'error', -- 'warning', 'error', 'critical'
    message TEXT NOT NULL,
    stack_trace TEXT,
    file_path TEXT,
    line_number INTEGER,
    column_number INTEGER,
    user_agent TEXT,
    url TEXT,
    context JSONB DEFAULT '{}'::jsonb,
    resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);
```

---

#### 26. **cm_error_corrections** (Corrections Appliquées)

**Objectif** : Historique des corrections de bugs appliquées.

```sql
CREATE TABLE cm_error_corrections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    error_id UUID REFERENCES cm_error_logs(id) ON DELETE SET NULL,
    file_path TEXT NOT NULL,
    old_code TEXT NOT NULL,
    new_code TEXT NOT NULL,
    description TEXT,
    applied_at TIMESTAMPTZ DEFAULT now()
);
```

---

### 📋 GROUPE 8 : CONTENU IA & ANALYTICS

#### 27. **cm_ai_prompt_versions** (Versioning Prompts IA)

**Objectif** : Historique et performances des prompts utilisés pour la génération de contenu IA.

```sql
CREATE TABLE cm_ai_prompt_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prompt_name TEXT NOT NULL,
    version TEXT NOT NULL,
    prompt_text TEXT NOT NULL,
    variables JSONB DEFAULT '{}'::jsonb,
    performance_score NUMERIC(5,2),
    usage_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (prompt_name, version)
);
```

---

#### 28. **cm_ai_content_feedback** (Feedback Contenu IA)

**Objectif** : Feedback utilisateur sur le contenu généré par IA.

```sql
CREATE TABLE cm_ai_content_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    prompt_version_id UUID REFERENCES cm_ai_prompt_versions(id),
    content_type TEXT NOT NULL, -- 'email', 'description', 'faq', 'annonce'
    rating INTEGER CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    was_used BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);
```

---

### 📋 GROUPE 9 : TABLES UTILITAIRES

#### 29. **checklists** (Tâches À Faire - Ancienne Table)

**Objectif** : Tâches génériques (à remplacer progressivement par checklist_templates).

```sql
CREATE TABLE checklists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    gite_id UUID REFERENCES gites(id) ON DELETE CASCADE,
    task TEXT NOT NULL,
    completed BOOLEAN DEFAULT false,
    priority INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);
```

---

#### 30. **demandes_horaires** (Demandes d'Horaires Clients)

**Objectif** : Propositions d'horaires d'arrivée/départ par les clients.

```sql
CREATE TABLE demandes_horaires (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reservation_id UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('arrivee', 'depart')),
    horaire_demande TIME NOT NULL,
    statut TEXT DEFAULT 'en_attente', -- 'en_attente', 'accepte', 'refuse'
    commentaire TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);
```

---

#### 31. **evaluations_sejour** (Évaluations Post-Séjour)

**Objectif** : Feedback des clients après leur séjour.

```sql
CREATE TABLE evaluations_sejour (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reservation_id UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
    note_globale INTEGER CHECK (note_globale BETWEEN 1 AND 5),
    note_proprete INTEGER CHECK (note_proprete BETWEEN 1 AND 5),
    note_confort INTEGER CHECK (note_confort BETWEEN 1 AND 5),
    note_communication INTEGER CHECK (note_communication BETWEEN 1 AND 5),
    commentaire TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);
```

---

#### 32. **problemes_signales** (Problèmes Signalés Clients)

**Objectif** : Liste des problèmes rencontrés pendant le séjour.

```sql
CREATE TABLE problemes_signales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reservation_id UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
    gite_id UUID NOT NULL REFERENCES gites(id) ON DELETE CASCADE,
    type_probleme TEXT NOT NULL, -- 'plomberie', 'electricite', 'chauffage', 'equipement', 'autre'
    description TEXT NOT NULL,
    urgence TEXT DEFAULT 'normale', -- 'basse', 'normale', 'haute', 'critique'
    statut TEXT DEFAULT 'signale', -- 'signale', 'en_cours', 'resolu'
    created_at TIMESTAMPTZ DEFAULT now(),
    resolved_at TIMESTAMPTZ
);
```

---

#### 33. **suivi_soldes_bancaires** (Suivi Soldes Bancaires)

**Objectif** : Historique des soldes bancaires pour comptabilité.

```sql
CREATE TABLE suivi_soldes_bancaires (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date_releve DATE NOT NULL,
    solde NUMERIC(10,2) NOT NULL,
    compte TEXT, -- 'principal', 'pro', 'epargne'
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## 🔐 AUTHENTIFICATION & SÉCURITÉ

### Supabase Auth

**Méthodes disponibles** :
- Email/Password (actuelle)
- OAuth2 (Google, Facebook, Apple) - à activer
- Magic Links (connexion par email)

**Flow d'authentification** :
```swift
// Exemple Swift
let supabase = SupabaseClient(
    supabaseURL: URL(string: "https://fgqimtpjjhdqeyyaptoj.supabase.co")!,
    supabaseKey: "YOUR_ANON_KEY"
)

// Connexion
let session = try await supabase.auth.signIn(
    email: "user@example.com",
    password: "password"
)

// Récupération utilisateur connecté
let user = try await supabase.auth.user()
let userId = user.id // UUID à utiliser pour owner_user_id
```

### Row Level Security (RLS)

**Politique RLS sur toutes les tables** :
```sql
-- Exemple pour table gites
CREATE POLICY "Users can only view their own data"
ON gites FOR SELECT
USING (auth.uid() = owner_user_id);

CREATE POLICY "Users can only insert their own data"
ON gites FOR INSERT
WITH CHECK (auth.uid() = owner_user_id);

CREATE POLICY "Users can only update their own data"
ON gites FOR UPDATE
USING (auth.uid() = owner_user_id);

CREATE POLICY "Users can only delete their own data"
ON gites FOR DELETE
USING (auth.uid() = owner_user_id);
```

**Important** : TOUJOURS utiliser `auth.uid()` pour filtrer les données, jamais hardcoder l'utilisateur.

---

## 🌐 APIS & SERVICES EXTERNES

### 1. **Supabase API**
- **URL** : `https://fgqimtpjjhdqeyyaptoj.supabase.co`
- **Documentation** : https://supabase.com/docs
- **SDK Swift** : `supabase-swift` (officiel)

### 2. **MyMemory Translation API**
- **URL** : `https://api.mymemory.translated.net`
- **Usage** : Traduction automatique FR ↔ EN
- **Gratuit** : 10 000 requêtes/jour
- **Format** :
  ```
  GET /get?q=Bonjour&langpair=fr|en
  Response: {"responseData":{"translatedText":"Hello"}}
  ```

### 3. **OpenStreetMap Nominatim**
- **URL** : `https://nominatim.openstreetmap.org`
- **Usage** : Géocodage adresses → GPS
- **Gratuit** : Avec rate limiting (1 req/sec)
- **Format** :
  ```
  GET /search?q=10+Rue+de+Paris&format=json
  Response: [{"lat": "48.8566", "lon": "2.3522"}]
  ```

### 4. **iCal Sync (Airbnb, Booking, etc.)**
- **Protocol** : iCalendar (RFC 5545)
- **Format** : `.ics` (texte)
- **Parsing** : Library `ical.js` (JavaScript) ou `iCal4j` (Java)
- **Fréquence sync** : Toutes les heures (recommandé)

---

## 📊 RÈGLES MÉTIER ESSENTIELLES

### Réservations
1. **Une seule réservation par gîte à la fois** : Aucun chevauchement autorisé
2. **Résolution conflits iCal** : En cas de chevauchement → garder la plus courte
3. **Synchronisation bidirectionnelle** : 
   - Import iCal → Création/Mise à jour réservations
   - Réservations manuelles → Ajout dans iCal (optionnel)

### Ménage
1. **Calcul automatique** : Date/heure du ménage selon règles métier
2. **9 règles configurables** : Dimanche, samedi, enchainements, jours fériés, etc.
3. **Validation propriétaire** : Propositions de modifications par femme de ménage

### Fiscalité
1. **Minimum URSSAF : 1 200 €/an** (cotisations minimales obligatoires)
2. **4 régimes fiscaux** : LMNP Réel, Micro-BIC 30%, Micro-BIC 50%, LMP Réel
3. **Calcul automatique du meilleur régime** : Badge "MEILLEUR" affiché
4. **Barème kilométrique** : Taux différenciés par puissance fiscale et tranches de distance

### Draps / Linge
1. **Stock minimum requis** : Alertes si stock insuffisant pour prochaines réservations
2. **Calcul automatique des besoins** : Estimation jusqu'à date cible
3. **Historique des mouvements** : Traçabilité complète (ajout, retrait, lavage)

### Parrainage
1. **20 filleuls maximum** : Limite pour éviter abus
2. **Filleul actif = 1er paiement effectué** : Pas juste inscription
3. **Deux modèles de récompenses** : Réduction tarifaire OU points échangeables

---

## 🚀 FONCTIONNALITÉS PRINCIPALES

### 1. Dashboard (Tableau de Bord)
- **Vue d'ensemble** : Date, semaine, tickets, fiches clients à envoyer
- **Sections TODO** : Réservations, Travaux, Achats, Ménages
- **Réservations de la semaine** : Pagination 5 par page
- **Widgets** : Promotions, Support, Erreurs

### 2. Gestion Réservations
- **CRUD complet** : Ajout, modification, suppression
- **Planning visuel** : Calendrier avec toutes réservations
- **Sync iCal** : Import automatique Airbnb/Booking/Abritel
- **Détection conflits** : Alerte si chevauchement

### 3. Statistiques
- **CA total annuel** : Par gîte et global
- **Taux d'occupation** : Pourcentage jours occupés
- **Répartition plateformes** : Airbnb, Booking, Gîtes de France
- **Graphiques** : Évolution mensuelle, comparaison années

### 4. Gestion Draps / Linge
- **Configuration besoins** : Par gîte et type de linge
- **Stocks en réserve** : Compteurs temps réel (+/-)
- **Analyse besoins futurs** : Simulation jusqu'à date cible
- **Réservations couvertes** : Calcul automatique

### 5. Planning Ménage
- **Vue par semaine** : Toutes interventions avec code couleur
- **Statuts multiples** : À faire, En cours, Validé, Terminé
- **Interface société de ménage** : Validation avec photos
- **Propositions en attente** : Accepter/Refuser modifications

### 6. Fiscalité LMNP/LMP
- **Comparateur 4 régimes** : Affichage simultané avec calculs temps réel
- **Bascule automatique** : LMNP ↔ LMP selon critères
- **Gestion charges** : Annuelles, mensuelles, par gîte
- **Travaux/Réparations** : Liste détaillée déductible
- **Frais kilométriques** : Barème fiscal automatique

### 7. Découvrir (Activités Touristiques)
- **Par gîte** : Sélection dans dropdown
- **8 catégories** : Restaurant, Café, Musée, Château, Parc, Hôtel, Attraction, Shopping
- **Ajout activité** : Nom, adresse, description, note Google
- **Géocodage auto** : GPS + distance calculés depuis adresse
- **Carte interactive** : Leaflet.js avec marqueurs colorés
- **Filtres** : Par catégorie, recherche textuelle

### 8. Calendrier & Tarifs
- **Vue calendrier** : Mensuel interactif
- **Tarifs par nuitée** : Personnalisables par date
- **Tarifs saisonniers** : Basse/Moyenne/Haute/Événements
- **Réductions durée** : Automatiques selon nombre de nuits
- **Export** : PDF/iCal

### 9. Infos Gîtes (Fiches Clients)
- **119 champs bilingues** : FR + EN automatique
- **WiFi** : SSID, mot de passe, QR Code généré
- **Consignes arrivée** : Horaires, codes, instructions
- **Consignes séjour** : Chauffage, cuisine, TV, équipements
- **Consignes départ** : Heure, checklist, restitution clés
- **Règlement intérieur** : Tabac, animaux, caution

### 10. Système de Parrainage
- **Code unique** : UUID v4 par utilisateur
- **QR Code** : Scan = inscription automatique
- **Suivi filleuls** : Liste avec statuts et récompenses
- **Deux modèles** : Réduction tarifaire (-5%/filleul) OU Points (100 pts/filleul)
- **Campagnes temporaires** : Multiplicateur de récompenses

---

## 🛠️ VARIABLES & CONSTANTES IMPORTANTES

### Configuration Supabase
```javascript
const SUPABASE_URL = "https://fgqimtpjjhdqeyyaptoj.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZncWltdHBqamhkcWV5eWFwdG9qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgxNTU0MjQsImV4cCI6MjA4MzczMTQyNH0.fOuYg0COYts7XXWxgB7AM01Fg6P86f8oz8XVpGdIaNM";
```

### Taux Fiscaux 2025 (fichier `taux-fiscaux-config.js`)
```javascript
const TAUX_FISCAUX_2025 = {
    URSSAF: {
        indemnites_journalieres: { taux: 0.0085 },
        retraite_base: { taux: 0.1775 },
        retraite_complementaire: { taux: 0.07 },
        invalidite_deces: { taux: 0.013 },
        csg_crds: { taux: 0.097 },
        formation_pro: { taux: 0.0025 },
        allocations_familiales: {
            taux_0: 0,
            taux_plein: 0.031,
            seuil: 46368 // PASS 2025
        }
    },
    IMPOT_REVENU: [
        { max: 11294, taux: 0 },
        { max: 28797, taux: 0.11 },
        { max: 82341, taux: 0.30 },
        { max: 177106, taux: 0.41 },
        { max: Infinity, taux: 0.45 }
    ],
    BAREME_KM: {
        "3cv": [
            { max: 5000, taux: 0.529 },
            { max: 20000, taux: 0.316 },
            { max: Infinity, taux: 0.37 }
        ],
        "4cv": [...]
        // ... autres puissances
    }
};
```

### Statuts & Énumérations
```javascript
// Statuts réservations
const RESERVATION_STATUS = ['confirmed', 'pending', 'cancelled', 'completed'];

// Statuts ménage
const CLEANING_STATUS = ['pending', 'pending_validation', 'validated', 'refused', 'completed'];

// Types de ménage
const CLEANING_TYPES = ['Ménage entrée', 'Ménage sortie', 'Entretien', 'Deep cleaning'];

// Catégories activités
const ACTIVITY_CATEGORIES = ['Restaurant', 'Café/Bar', 'Musée', 'Château', 'Parc', 'Hôtel', 'Attraction'];

// Régimes fiscaux
const FISCAL_REGIMES = ['LMNP_REEL', 'MICRO_30', 'MICRO_50', 'LMP_REEL'];

// Types de tickets support
const TICKET_TYPES = ['bug', 'feature_request', 'question', 'feedback'];

// Priorités tickets
const TICKET_PRIORITIES = ['low', 'medium', 'high', 'urgent'];
```

### Formats de Données JSONB

#### **gites.ical_sources**
```json
{
    "airbnb": "https://www.airbnb.fr/calendar/ical/...",
    "booking": "https://admin.booking.com/hotel/hoteladmin/ical/....",
    "abritel": "https://www.abritel.fr/icalendar/..."
}
```

#### **gites.settings**
```json
{
    "auto_reply": true,
    "default_check_in": "15:00",
    "default_check_out": "11:00",
    "cleaning_enabled": true,
    "cleaning_duration_minutes": 120
}
```

#### **gites.tarifs_calendrier**
```json
{
    "2026-07-15": 120,
    "2026-07-16": 120,
    "2026-08-01": 150,
    "2026-12-25": 200
}
```

#### **simulations_fiscales.donnees_detaillees**
```json
{
    "travaux": [
        {"intitule": "Réparation plomberie", "montant": 500, "date": "2025-03-15"},
        {"intitule": "Peinture chambre", "montant": 800, "date": "2025-05-20"}
    ],
    "frais": {
        "comptable": 600,
        "gestion_plateforme": 1200,
        "assurance": 450
    },
    "produits_accueil": {
        "gel_douche": 120,
        "dosettes_cafe": 180,
        "papier_toilette": 90
    }
}
```

---

## 📱 RECOMMANDATIONS POUR L'APPLICATION MOBILE

### Architecture Recommandée (iOS)
- **Framework** : SwiftUI (interface) + Combine (réactivité)
- **Navigation** : TabView (bottom tabs) + NavigationStack
- **State Management** : @StateObject + @EnvironmentObject
- **Network** : `supabase-swift` (SDK officiel)
- **Persistance locale** : SwiftData ou CoreData
- **Cache** : NSCache pour images et données fréquentes

### Fonctionnalités Prioritaires v1.0
1. ✅ **Authentification** : Login/Logout
2. ✅ **Dashboard** : Vue d'ensemble + TODO
3. ✅ **Réservations** : Liste + Détails + Ajout manuel
4. ✅ **Calendrier** : Vue visuelle des réservations
5. ✅ **Ménage** : Planning de la semaine
6. ✅ **Notifications** : Push pour nouvelles réservations/ménages

### Fonctionnalités Phase 2
- Synchronisation iCal en background
- Gestion draps/linge
- Statistiques avancées
- Mode hors-ligne avec synchronisation

### Fonctionnalités Phase 3
- Fiscalité LMNP/LMP
- Système de parrainage
- Support client intégré
- Widget iOS (Dashboard)

### Synchronisation & Performance
- **Sync initiale** : Télécharger toutes les données au login
- **Sync incrémentale** : Polling toutes les 5 minutes (réservations actives)
- **Sync temps réel** : Supabase Realtime pour changements instantanés
- **Cache local** : 7 jours de données en local minimum
- **Mode hors-ligne** : Lecture seule + queue d'actions à sync

### Sécurité Mobile
- **Keychain** : Stocker tokens d'authentification
- **Biométrie** : Face ID / Touch ID pour login rapide
- **SSL Pinning** : Vérifier certificat Supabase
- **Timeout session** : 30 jours par défaut
- **Logs chiffrés** : Ne JAMAIS logger les tokens ou données sensibles

---

## 🧪 TESTS & VALIDATION

### Compte de Test
- **Email** : stephanecalvignac@hotmail.fr
- **Organisation** : Mon Gîte
- **Données de test** : 3 gîtes + ~50 réservations

### Environnements
- **Production** : `https://fgqimtpjjhdqeyyaptoj.supabase.co`
- **Staging** : À créer si besoin (dupliquer le projet Supabase)

### Tests à Effectuer
1. **Auth** : Login, logout, refresh token
2. **CRUD Réservations** : Create, Read, Update, Delete
3. **Sync iCal** : Import, détection conflits, mise à jour
4. **RLS** : Vérifier isolation des données entre utilisateurs
5. **Offline** : Fonctionnement sans connexion + sync après reconnexion

---

## 📚 DOCUMENTATION COMPLÉMENTAIRE

### Fichiers de Référence dans le Projet
- `docs/architecture/ARCHITECTURE.md` : Architecture technique complète
- `GUIDE_COMPLET_FONCTIONNALITES.md` : Liste exhaustive des fonctionnalités
- `ERREURS_CRITIQUES.md` : Historique des bugs critiques et solutions
- `DOCUMENTATION_SYSTEME_PARRAINAGE.md` : Système de parrainage détaillé
- `sql/SCHEMA_COMPLET_PRODUCTION_23JAN2026.sql` : Schéma SQL complet

### Ressources Externes
- **Supabase Docs** : https://supabase.com/docs
- **Supabase Swift SDK** : https://github.com/supabase-community/supabase-swift
- **iCal Format** : https://icalendar.org/
- **MyMemory API** : https://mymemory.translated.net/doc/spec.php

---

## ⚠️ POINTS D'ATTENTION CRITIQUES

### 🚫 INTERDICTIONS ABSOLUES
1. ❌ **Hardcoder `owner_user_id`** : TOUJOURS utiliser `auth.uid()`
2. ❌ **Désactiver RLS** : Sécurité compromise
3. ❌ **SELECT * sans filtre** : Performance dégradée
4. ❌ **Stocker tokens en clair** : Utiliser Keychain
5. ❌ **Logger données sensibles** : Jamais dans les logs

### ✅ BONNES PRATIQUES
1. ✅ **Catcher toutes les erreurs** : try/catch systématique
2. ✅ **Valider les entrées** : Côté client ET serveur (RLS)
3. ✅ **Indexes DB** : Sur toutes les FK et colonnes fréquentes
4. ✅ **Pagination** : Limiter à 50 résultats par requête
5. ✅ **Cache intelligent** : Ne pas recharger données inchangées

### 🔥 BUGS CONNUS À ÉVITER
Consulter `ERREURS_CRITIQUES.md` pour la liste complète, notamment :
- Minimum URSSAF 1 200 € (ne pas oublier)
- Synchronisation alias colonnes (montant ↔ total_price)
- Calcul automatique du restant (trigger DB)
- Format téléphone validé (regex)

---

## 📧 CONTACT & SUPPORT

- **Propriétaire du projet** : Stéphane Calvignac
- **Email** : stephanecalvignac@hotmail.fr
- **Repository** : gitewelcomehome-png/Gestion_gite-calvignac

---

**FIN DU DOCUMENT DE RÉFÉRENCE TECHNIQUE**

Ce document contient toutes les informations nécessaires pour développer une application mobile iOS/macOS connectée au backend Supabase de LiveOwnerUnit. Pour toute question ou clarification, consulter les fichiers de documentation complémentaire listés ci-dessus.

**Dernière mise à jour** : 7 février 2026  
**Version** : 1.0
