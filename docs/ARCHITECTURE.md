# 🏗️ Architecture - Gestion Gîte Calvignac

**Version :** 2.13.47  
**Dernière MAJ :** 3 mars 2026  
**Environnement :** Production (Supabase + Vercel)

---

## ⚡ Quick Start

```bash
# 1. Rebuild SQL complet (socle canonique)
psql "$DATABASE_URL" -f sql/rebuild/01_REBUILD_SITE_ORDER.sql

# 2. Valider la checklist post-rebuild
# sql/rebuild/02_POST_REBUILD_CHECKLIST.md

# 3. Accéder aux interfaces
# Admin: pages/admin-prestations.html
# Owner: app.html → Menu ⚙️ → "Prestations & CA"
# Client: pages/fiche-client.html?id=[UUID]&token=[TOKEN]
```

**⏱️ Setup complet :** ~10 minutes

### 🔐 RLS token pages (07 mars 2026)

Script d'alignement des politiques tokenisées des pages client/menage :

```bash
psql "$DATABASE_URL" -f sql/securite/RLS_ALIGN_FICHE_CLIENT_FEMME_MENAGE_2026-03-07.sql
```

---

## 📋 Vue d'Ensemble

Application SaaS de gestion de gîtes avec :
- 🏠 Multi-gîtes par propriétaire
- 📅 Calendrier réservations + iCal sync
- 💰 Suivi CA (réservations + prestations supplémentaires)
- 👥 Interface Admin (Channel Manager)
- 📊 Interface Owner (stats, prestations)
- 🛒 Interface Client (fiche gîte, commande prestations)
- 🤝 Module Communauté (annuaire partagé artisans/experts + notation)

---

## 🗄️ Base de Données (Supabase PostgreSQL)

### Tables Principales

#### **community_artisans** ✨ **NOUVEAU v2.14.0**
```sql
id                UUID PRIMARY KEY DEFAULT uuid_generate_v4()
owner_user_id     UUID → auth.users(id) ON DELETE CASCADE         -- Créateur
creator_gite_id   UUID → gites(id) ON DELETE SET NULL             -- Gîte créateur
nom               VARCHAR(200) NOT NULL
metier            VARCHAR(200) NOT NULL
telephone         VARCHAR(50)
ville             VARCHAR(120)
latitude          DOUBLE PRECISION NOT NULL
longitude         DOUBLE PRECISION NOT NULL
description       TEXT
created_at        TIMESTAMPTZ DEFAULT NOW()
updated_at        TIMESTAMPTZ DEFAULT NOW()

-- Indexes
CREATE INDEX idx_community_artisans_created_at ON community_artisans(created_at DESC);
CREATE INDEX idx_community_artisans_owner ON community_artisans(owner_user_id);
CREATE INDEX idx_community_artisans_creator_gite ON community_artisans(creator_gite_id);
CREATE INDEX idx_community_artisans_geo ON community_artisans(latitude, longitude);

-- RLS
-- SELECT: tous les authenticated (annuaire partagé)
-- INSERT/UPDATE/DELETE: créateur uniquement (owner_user_id = auth.uid())
```

#### **community_artisan_notes** ✨ **NOUVEAU v2.14.0**
```sql
id                BIGSERIAL PRIMARY KEY
artisan_id        UUID → community_artisans(id) ON DELETE CASCADE
owner_user_id     UUID → auth.users(id) ON DELETE CASCADE
note              SMALLINT NOT NULL CHECK (note BETWEEN 1 AND 5)
commentaire       TEXT
created_at        TIMESTAMPTZ DEFAULT NOW()
updated_at        TIMESTAMPTZ DEFAULT NOW()

-- Contraintes
UNIQUE (artisan_id, owner_user_id)       -- Un seul vote par gîte/propriétaire

-- RLS
-- SELECT: tous les authenticated
-- INSERT/UPDATE/DELETE: auteur de la note uniquement (owner_user_id = auth.uid())
```

#### **system_config** ✨ **NOUVEAU v2.13.0**
```sql
id                BIGSERIAL PRIMARY KEY
cle               VARCHAR(100) UNIQUE NOT NULL
valeur            TEXT NOT NULL
description       TEXT
created_at        TIMESTAMPTZ DEFAULT NOW()
updated_at        TIMESTAMPTZ DEFAULT NOW()

-- Clés utilisées :
-- 'commission_prestations_percent' : Taux commission (défaut: 5)
```

**Configuration Commission :**
- Modifiable depuis : `pages/admin-prestations.html` → Bouton "⚙️ Configuration"
- Valeur par défaut : 5%
- Plage autorisée : 0-100%
- Appliqué automatiquement aux nouvelles commandes

#### **gites**
```sql
id                UUID PRIMARY KEY DEFAULT gen_random_uuid()
owner_user_id     UUID → auth.users(id) ON DELETE CASCADE  -- ⚠️ owner_user_id PAS owner_id
name              TEXT NOT NULL
slug              TEXT NOT NULL
description       TEXT
address           TEXT
city              TEXT
postal_code       TEXT
country           TEXT DEFAULT 'France'
department        TEXT
region            TEXT
capacity          INTEGER
bedrooms          INTEGER
beds              INTEGER
bathrooms         INTEGER
surface_m2        NUMERIC(7,2)
categorie_hebergement TEXT DEFAULT 'gite'  -- ✨ 'gite' | 'chambre_hotes' (impacte régime fiscal)
type_hebergement  TEXT
label_classement  TEXT
environment       TEXT
situation         TEXT
cuisine_niveau    TEXT
animaux_acceptes  BOOLEAN DEFAULT false
access_pmr        BOOLEAN DEFAULT false
parking           BOOLEAN DEFAULT false
platform_airbnb   BOOLEAN DEFAULT false
platform_booking  BOOLEAN DEFAULT false
platform_abritel  BOOLEAN DEFAULT false
platform_gdf      BOOLEAN DEFAULT false
platform_direct   BOOLEAN DEFAULT false
price_per_night   NUMERIC(10,2)
amenities         JSONB DEFAULT '[]'           -- ["wifi", "piscine", ...]
ical_sources      JSONB DEFAULT '{}'           -- format objet unifié
ical_urls         JSONB DEFAULT '[]'           -- alias tableau de ical_sources
settings          JSONB DEFAULT '{}'
tarifs_calendrier JSONB DEFAULT '{}'
regles_tarifaires JSONB DEFAULT '{}'
regles_tarifs     JSONB                        -- règles tarifaires custom
icon              TEXT DEFAULT 'home'
color             TEXT DEFAULT '#667eea'
display_order     INTEGER DEFAULT 0
taxe_sejour_tarif NUMERIC(6,2) DEFAULT 0
taxe_sejour_plateformes JSONB DEFAULT '[]'
is_active         BOOLEAN DEFAULT true
created_at        TIMESTAMPTZ DEFAULT now()
updated_at        TIMESTAMPTZ DEFAULT now()

UNIQUE(owner_user_id, slug)

-- Indexes
CREATE INDEX idx_gites_owner ON gites(owner_user_id);
CREATE INDEX idx_gites_active ON gites(owner_user_id, is_active);
```

#### **reservations**
```sql
id                UUID PRIMARY KEY DEFAULT uuid_generate_v4()
gite_id           UUID → gites(id) ON DELETE CASCADE
owner_id          UUID → auth.users(id)
client_name       VARCHAR(200)                  -- ⚠️ Plus de nom_client/prenom_client séparés
client_email      VARCHAR(200)
client_phone      VARCHAR(50)
check_in          DATE NOT NULL
check_out         DATE NOT NULL
nb_guests         INTEGER
nb_nights         INTEGER                       -- Calculé automatiquement
montant_total     DECIMAL(10,2)
statut            VARCHAR(50)                   -- confirmee|en_attente|annulee|terminee
source            VARCHAR(100)                  -- booking|airbnb|direct|...
notes             TEXT
ical_uid          VARCHAR(500)                  -- UID unique depuis iCal (si sync)
cancelled         BOOLEAN DEFAULT false
date_annulation   TIMESTAMP
created_at        TIMESTAMP DEFAULT NOW()
updated_at        TIMESTAMP DEFAULT NOW()

-- Contraintes
CHECK (check_out > check_in)
CHECK (montant_total >= 0)

-- Indexes
CREATE INDEX idx_reservations_gite ON reservations(gite_id);
CREATE INDEX idx_reservations_owner ON reservations(owner_id);
CREATE INDEX idx_reservations_dates ON reservations(check_in, check_out);
CREATE INDEX idx_reservations_ical ON reservations(ical_uid);

-- ⚠️ Règle Métier : UN SEUL BOOKING PAR JOUR ET PAR GÎTE
-- Vérifié par check-overlapping-reservations.js au moment des imports iCal
```

#### **todos**
```sql
id                UUID PRIMARY KEY DEFAULT gen_random_uuid()
owner_user_id     UUID → auth.users(id) ON DELETE CASCADE
gite_id           UUID → gites(id) ON DELETE CASCADE
title             TEXT NOT NULL
description       TEXT
category          TEXT DEFAULT 'general'
status            TEXT DEFAULT 'todo'           -- todo|in_progress|done
completed         BOOLEAN DEFAULT false
completed_at      TIMESTAMPTZ DEFAULT NULL
archived_at       TIMESTAMPTZ
created_at        TIMESTAMPTZ DEFAULT NOW()
updated_at        TIMESTAMPTZ DEFAULT NOW()

-- Indexes
CREATE INDEX idx_todos_owner ON todos(owner_user_id);
CREATE INDEX idx_todos_gite ON todos(gite_id);
CREATE INDEX idx_todos_status ON todos(status, completed);
```

#### **fiscalite_amortissements**
```sql
id                    UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id               UUID → auth.users(id) ON DELETE CASCADE
annee                 INTEGER NOT NULL
type                  TEXT NOT NULL              -- 'travaux' | 'frais' | 'produits'
description           TEXT
gite                  TEXT
montant               NUMERIC(12,2) DEFAULT 0
amortissement_origine JSONB                      -- {annee_origine, duree, montant_total}
created_at            TIMESTAMPTZ DEFAULT NOW()
updated_at            TIMESTAMPTZ DEFAULT NOW()

-- RLS : user_id = auth.uid()
CREATE INDEX idx_fiscalite_amortissements_user_annee ON fiscalite_amortissements(user_id, annee);
```

#### **fiscalite_amortissements**
```sql
id                    UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id               UUID → auth.users(id) ON DELETE CASCADE
annee                 INTEGER NOT NULL              -- Année fiscale concernée
type                  TEXT NOT NULL                 -- 'travaux' | 'frais'
description           TEXT
gite                  TEXT                          -- Slug du gîte concerné
montant               NUMERIC(12,2) DEFAULT 0       -- Montant annuel amorti
amortissement_origine JSONB                         -- {annee_origine, duree, montant_total}
created_at            TIMESTAMPTZ DEFAULT NOW()
updated_at            TIMESTAMPTZ DEFAULT NOW()

-- RLS : user_id = auth.uid()
CREATE INDEX idx_fiscalite_amort_user_annee ON fiscalite_amortissements(user_id, annee);
```

#### **fiscal_history**
```sql
id                UUID PRIMARY KEY DEFAULT gen_random_uuid()
owner_user_id     UUID → auth.users(id) ON DELETE CASCADE
year              INTEGER NOT NULL
gite              TEXT NOT NULL DEFAULT 'multi'   -- identifiant gîte ou 'multi'
revenus           NUMERIC(12,2) DEFAULT 0
charges           NUMERIC(12,2) DEFAULT 0
resultat          NUMERIC(12,2) DEFAULT 0
regime            TEXT                            -- 'reel' | 'micro'
donnees_detaillees JSONB                          -- toutes les données du simulateur
created_at        TIMESTAMPTZ DEFAULT NOW()
updated_at        TIMESTAMPTZ DEFAULT NOW()

UNIQUE (owner_user_id, year, gite)               -- contrainte pour upsert onConflict

-- RLS : propriétaire unique
CREATE INDEX idx_fiscal_history_owner_year ON fiscal_history(owner_user_id, year);
```

#### **ical_subscriptions**
```sql
id                BIGSERIAL PRIMARY KEY
gite_id           UUID → gites(id) ON DELETE CASCADE
owner_id          UUID → auth.users(id)
url               TEXT NOT NULL
platform          VARCHAR(100)                  -- booking|airbnb|vrbo|...
is_active         BOOLEAN DEFAULT true
last_sync         TIMESTAMP
sync_frequency    INTEGER DEFAULT 3600          -- En secondes (1h par défaut)
error_count       INTEGER DEFAULT 0
last_error        TEXT
created_at        TIMESTAMP DEFAULT NOW()

-- Indexes
CREATE INDEX idx_ical_gite ON ical_subscriptions(gite_id);
CREATE INDEX idx_ical_owner ON ical_subscriptions(owner_id);
```

#### **prestations_catalogue**
```sql
id                BIGSERIAL PRIMARY KEY
gite_id           UUID → gites(id) ON DELETE CASCADE       -- ⚠️ UUID, pas INTEGER
nom               VARCHAR(200)                             -- FR
nom_en            VARCHAR(200)                             -- EN
description       TEXT                                     -- FR
description_en    TEXT                                     -- EN
prix              DECIMAL(10,2) NOT NULL
categorie         VARCHAR(50)                              -- repas|activite|menage|location|autre
icone             VARCHAR(10)                              -- Emoji 🥐🧹🚴
is_active         BOOLEAN DEFAULT true
created_at        TIMESTAMP DEFAULT NOW()
updated_at        TIMESTAMP DEFAULT NOW()

-- Indexes
CREATE INDEX idx_prestations_gite ON prestations_catalogue(gite_id);
CREATE INDEX idx_prestations_categorie ON prestations_catalogue(categorie);
CREATE INDEX idx_prestations_active ON prestations_catalogue(is_active);
```

#### **commandes_prestations**
```sql
id                    BIGSERIAL PRIMARY KEY
reservation_id        UUID → reservations(id) ON DELETE CASCADE    -- ⚠️ UUID
gite_id               UUID → gites(id) ON DELETE CASCADE           -- ⚠️ UUID
numero_commande       VARCHAR(50) UNIQUE NOT NULL                  -- CMD-20260215-00001
montant_prestations   DECIMAL(10,2) NOT NULL                       -- Montant brut
montant_commission    DECIMAL(10,2) NOT NULL                       -- 5% pour platform
montant_net_owner     DECIMAL(10,2) NOT NULL                       -- 95% pour owner
statut                VARCHAR(50) DEFAULT 'en_attente'             -- en_attente|confirmee|delivered|annulee
methode_paiement      VARCHAR(50)                                  -- carte|especes|virement
date_commande         TIMESTAMP DEFAULT NOW()
date_paiement         TIMESTAMP
date_confirmation     TIMESTAMP
date_livraison        TIMESTAMP
notes                 TEXT
created_at            TIMESTAMP DEFAULT NOW()
updated_at            TIMESTAMP DEFAULT NOW()

-- Contraintes
CHECK (montant_prestations >= 0)
CHECK (montant_commission = montant_prestations * 0.05)           -- Exactement 5%
CHECK (montant_net_owner = montant_prestations - montant_commission)

-- Indexes
CREATE INDEX idx_commandes_reservation ON commandes_prestations(reservation_id);
CREATE INDEX idx_commandes_gite ON commandes_prestations(gite_id);
CREATE INDEX idx_commandes_numero ON commandes_prestations(numero_commande);
CREATE INDEX idx_commandes_statut ON commandes_prestations(statut);
CREATE INDEX idx_commandes_date ON commandes_prestations(date_commande);
```

#### **lignes_commande_prestations**
```sql
id                BIGSERIAL PRIMARY KEY
commande_id       BIGINT → commandes_prestations(id) ON DELETE CASCADE
prestation_id     BIGINT → prestations_catalogue(id) ON DELETE SET NULL  -- Garder historique même si prestation supprimée
nom_prestation    VARCHAR(200) NOT NULL                                  -- Snapshot nom au moment commande
prix_unitaire     DECIMAL(10,2) NOT NULL
quantite          INTEGER NOT NULL
prix_total        DECIMAL(10,2) NOT NULL
created_at        TIMESTAMP DEFAULT NOW()

-- Contraintes
CHECK (quantite > 0)
CHECK (prix_total = prix_unitaire * quantite)

-- Indexes
CREATE INDEX idx_lignes_commande ON lignes_commande_prestations(commande_id);
CREATE INDEX idx_lignes_prestation ON lignes_commande_prestations(prestation_id);
```

#### **infos_gites** ✨ *Colonnes ajoutées 10 mars 2026*
> Table de guide d'accueil pour les voyageurs. `gite_id` rendu nullable (REBUILD), colonne `gite TEXT UNIQUE` ajoutée pour compatibilité old-schema. ~100 colonnes ajoutées via ALTER TABLE.

```sql
id                      UUID PRIMARY KEY DEFAULT gen_random_uuid()
owner_user_id           UUID → auth.users(id)
gite_id                 UUID NULLABLE → gites(id)  -- ⚠️ NOT NULL supprimé lors migration REBUILD
gite                    TEXT UNIQUE                 -- Nom court du gîte (couzon, 3ème, trévoux…)

-- Localisation
gps_lat                 NUMERIC(10,8)
gps_lon                 NUMERIC(11,8)

-- WiFi (+ variantes _en anglais)
wifi_ssid               TEXT
wifi_password           TEXT
wifi_debit              TEXT
wifi_localisation       TEXT
wifi_zones              TEXT
wifi_ssid_en            TEXT
wifi_password_en        TEXT
wifi_debit_en           TEXT
wifi_localisation_en    TEXT
wifi_zones_en           TEXT

-- Arrivée / Accès (+ variantes _en)
heure_arrivee           TEXT
arrivee_tardive         TEXT
parking_dispo           TEXT
parking_places          TEXT
parking_details         TEXT
type_acces              TEXT
code_acces              TEXT
instructions_cles       TEXT
etage                   TEXT
ascenseur               TEXT
itineraire_logement     TEXT
premiere_visite         TEXT
-- …_en variants pour chaque colonne arrivée

-- Logement / Équipements (+ variantes _en)
type_chauffage          TEXT
climatisation           TEXT
instructions_chauffage  TEXT
equipements_cuisine     TEXT
instructions_four       TEXT
instructions_plaques    TEXT
instructions_lave_vaisselle TEXT
instructions_lave_linge TEXT
seche_linge             TEXT
fer_repasser            TEXT
linge_fourni            TEXT
configuration_chambres  TEXT
-- …_en variants

-- Déchets (+ variantes _en)
instructions_tri        TEXT
jours_collecte          TEXT
decheterie              TEXT

-- Sécurité (+ variantes _en)
detecteur_fumee         TEXT
extincteur              TEXT
coupure_eau             TEXT
disjoncteur             TEXT
consignes_urgence       TEXT

-- Départ (+ variantes _en)
heure_depart            TEXT
depart_tardif           TEXT
checklist_depart        TEXT
restitution_cles        TEXT

-- Règlement intérieur (+ variantes _en)
tabac                   TEXT
animaux                 TEXT
nb_max_personnes        INTEGER
caution                 TEXT

-- Médias / Thème
photos                  JSONB DEFAULT '[]'       -- URLs photos du gîte
fiche_client_theme      TEXT                    -- Thème couleur fiche voyageur

date_modification       TIMESTAMPTZ

-- Contraintes
UNIQUE(gite)

-- RLS
-- SELECT/INSERT/UPDATE/DELETE : owner_user_id = auth.uid()
```

#### **subscriptions_plans** ✨ *Nouveau 10 mars 2026*
> Remplace la vue `cm_pricing_plans` (old). Table des plans d'abonnement SaaS avec niveaux hiérarchiques.

```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
code            TEXT UNIQUE                 -- 'solo' | 'duo' | 'quattro'
display_name    TEXT                        -- Nom affiché dans l'UI
level           INTEGER                     -- 1=solo, 2=duo, 3=quattro (utilisé dans les conditions JS)
price_monthly   NUMERIC(10,2)               -- 15€ / 22€ / 33€
price_yearly    NUMERIC(10,2)
nb_gites_max    INTEGER                     -- 1 / 2 / 4
features        JSONB                       -- Liste des fonctionnalités incluses
is_active       BOOLEAN DEFAULT true
created_at      TIMESTAMPTZ DEFAULT NOW()

-- Plans insérés
-- solo    : level=1, 15€/mois, 1 gîte max
-- duo     : level=2, 22€/mois, 2 gîtes max
-- quattro : level=3, 33€/mois, 4 gîtes max

-- RLS : lecture publique pour les utilisateurs authentifiés
```

#### **user_subscriptions** ⚠️ *FK modifiée 10 mars 2026*
> Table existante — la contrainte FK `plan_id` a été modifiée :

```sql
-- AVANT  : plan_id UUID → cm_pricing_plans(id)   ← ancienne vue/table
-- APRÈS  : plan_id UUID → subscriptions_plans(id) ← nouvelle table

-- Commande SQL exécutée :
ALTER TABLE public.user_subscriptions
    DROP CONSTRAINT IF EXISTS user_subscriptions_plan_id_fkey;
ALTER TABLE public.user_subscriptions
    ADD CONSTRAINT user_subscriptions_plan_id_fkey
    FOREIGN KEY (plan_id) REFERENCES public.subscriptions_plans(id);
```

### 📊 Vues Matérialisées

#### **v_ca_prestations_mensuel**
```sql
CREATE VIEW v_ca_prestations_mensuel AS
SELECT 
    g.id AS gite_id,
    g.name AS gite_nom,                             -- ⚠️ g.name, pas g.nom
    DATE_TRUNC('month', c.date_commande) AS mois,
    COUNT(c.id) AS nb_commandes,
    SUM(c.montant_prestations) AS ca_brut,
    SUM(c.montant_commission) AS commissions,
    SUM(c.montant_net_owner) AS ca_net
FROM commandes_prestations c
JOIN gites g ON c.gite_id = g.id
WHERE c.statut IN ('confirmee', 'delivered')        -- Exclure annulées/en attente
GROUP BY g.id, g.name, DATE_TRUNC('month', c.date_commande)
ORDER BY mois DESC, gite_nom;
```

#### **v_ca_prestations_annuel**
```sql
CREATE VIEW v_ca_prestations_annuel AS
SELECT 
    g.id AS gite_id,
    g.name AS gite_nom,
    EXTRACT(YEAR FROM c.date_commande) AS annee,
    COUNT(c.id) AS nb_commandes,
    SUM(c.montant_prestations) AS ca_brut,
    SUM(c.montant_commission) AS commissions,
    SUM(c.montant_net_owner) AS ca_net
FROM commandes_prestations c
JOIN gites g ON c.gite_id = g.id
WHERE c.statut IN ('confirmee', 'delivered')
GROUP BY g.id, g.name, EXTRACT(YEAR FROM c.date_commande)
ORDER BY annee DESC, gite_nom;
```

### 🔒 Row Level Security (RLS)

```sql
-- Activer RLS sur toutes les tables
ALTER TABLE gites ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ical_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE prestations_catalogue ENABLE ROW LEVEL SECURITY;
ALTER TABLE commandes_prestations ENABLE ROW LEVEL SECURITY;
ALTER TABLE lignes_commande_prestations ENABLE ROW LEVEL SECURITY;

-- Policies Owners
CREATE POLICY "Owners can view their own gites"
    ON gites FOR SELECT
    USING (auth.uid() = owner_id);

CREATE POLICY "Owners can manage their own gites"
    ON gites FOR ALL
    USING (auth.uid() = owner_id);

-- Policies Clients (via token sécurisé)
CREATE POLICY "Clients can view their reservation details"
    ON reservations FOR SELECT
    USING (
        id = current_setting('app.reservation_id', true)::uuid
        AND current_setting('app.reservation_token', true) = 'VALID_TOKEN'
    );

-- Policies Prestations (clients voient uniquement prestations actives de leur gîte)
CREATE POLICY "Clients can view active prestations"
    ON prestations_catalogue FOR SELECT
    USING (is_active = true);
```

---

### 🪣 Storage Supabase

#### **gite-photos** ✨ *Bucket créé 10 mars 2026*
> Bucket public Supabase Storage pour les photos du guide d'accueil des gîtes.

| Paramètre | Valeur |
|-----------|--------|
| Type | Public |
| Taille max | 10 MB par fichier |
| Formats autorisés | JPEG, PNG, WebP, GIF |
| Path pattern | `{gite_name}/{category}/{filename}` |

```sql
-- Policies appliquées
CREATE POLICY "Authenticated users can upload"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'gite-photos' AND auth.role() = 'authenticated');

CREATE POLICY "Public read access"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'gite-photos');

CREATE POLICY "Users can delete their own photos"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'gite-photos' AND auth.role() = 'authenticated');
```

---

## 🏢 Structure Frontend

### Pages Admin (Channel Manager SaaS)

#### **pages/admin-channel-manager.html**
- Vue globale clients SaaS (propriétaires de gîtes)
- Gestion abonnements, facturation
- Support technique admin

#### **pages/admin-prestations.html** ✨ **NOUVEAU**
- Gestion catalogue prestations supplémentaires
- CRUD complet (Create, Read, Update, Delete)
- Historique commandes prestations
- Stats CA prestations globales

#### **pages/admin-support.html**
- Interface support ADMIN
- Tickets, monitoring système

#### **pages/admin-security-audit.html** ✨ **NOUVEAU v2.14.0**
- Rapport consolidé d'audit sécurité applicatif
- Note RGPD et plan de remédiation priorisé
- Dossier des artefacts existants à fournir (conformité / audit externe)

### Pages Owner (Propriétaires Gîtes)

#### **pages/desktop-owner.html**
- Dashboard principal : CA réservations, taux occupation
- Calendrier multi-gîtes
- Liste réservations

#### **pages/desktop-owner-prestations.html** ✨ **NOUVEAU**
- Stats CA prestations supplémentaires
- Toggle commission 5% (net vs brut)
- Tableau mensuel/annuel CA prestations
- Graphique Chart.js

#### **pages/gites-manage.html**
- Gestion des gîtes (CRUD)
- Configuration iCal sync

### Pages Client (Locataires)

#### **pages/fiche-client.html** ✨ **MIS À JOUR v2.11.0**
- Fiche descriptive du gîte loué
- Informations pratiques (accès, équipements)
- Onglet **"Services & Prestations"** ✨ **NOUVEAU**
  - Catalogue prestations
  - Panier d'achat
  - Commande en ligne

---

## 🛒 Système E-Commerce Prestations (Phase 1 & 2 ✅)

### Architecture Modulaire

#### **Module : `/js/fiche-client-prestations.js`** (430 lignes)

```javascript
// 1. Chargement Catalogue
async function loadPrestationsForGite(giteId)
// Requête Supabase : prestations_catalogue WHERE gite_id = ? AND is_active = true

// 2. Affichage
function renderPrestations(prestations)
// Génère grille HTML avec Lucide icons

// 3. Panier
let panier = {}; // { prestationId: { ...data, quantite: 2 } }

function ajouterAuPanier(prestationId)
function retirerDuPanier(prestationId)
function updatePanierBadge()
function savePanier() // localStorage

// 4. Modal Panier
function openPanierModal()
function closePanierModal()
function renderPanierItems()
function calculerTotaux() // { sousTotal, commission, total }

// 5. Commande
async function passerCommande()
// 1. Créer commande dans commandes_prestations
// 2. Insérer lignes dans lignes_commande_prestations
// 3. Vider panier
// 4. Notifier client (toast)

function generateNumeroCommande() // CMD-YYYYMMDD-XXXXX
```

### Flux de Commande

```
1. Client browse catalogue (filtres catégories)
   ↓
2. Ajoute items au panier (+ / - quantités)
   ↓
3. Panier sauvegardé localStorage (persistence)
   ↓
4. Clic "Ouvrir Panier" → Modal s'affiche
   ↓
5. Révise quantités, vérifie totaux
   ↓
6. Clic "Passer Commande"
   ↓
7. INSERT INTO commandes_prestations (avec calcul auto commission 5%)
   ↓
8. INSERT INTO lignes_commande_prestations (N lignes)
   ↓
9. Notification succès + vidage panier
   ↓
10. Owner reçoit notification (TODO Phase 4)
```

### Calcul Commission (Automatique)

```javascript
// Exemple : Panier = 100.00 € (2x Petit-déj 12€ + 1x Vélo 76€)
const montantBrut = 100.00;
const commission = montantBrut * 0.05;  // 5.00 €
const netOwner = montantBrut - commission; // 95.00 €

// INSERT INTO commandes_prestations
{
  montant_prestations: 100.00,  // Brut
  montant_commission: 5.00,     // 5%
  montant_net_owner: 95.00      // Net pour owner
}
```

---

## 🔧 Fonctions PostgreSQL

### **generer_numero_commande()**
```sql
CREATE OR REPLACE FUNCTION generer_numero_commande()
RETURNS TEXT AS $$
DECLARE
    v_date TEXT;
    v_sequence INTEGER;
    v_numero TEXT;
BEGIN
    v_date := TO_CHAR(NOW(), 'YYYYMMDD');
    
    -- Trouver le dernier numéro du jour
    SELECT COALESCE(MAX(
        CAST(SUBSTRING(numero_commande FROM 'CMD-[0-9]{8}-([0-9]{5})' ) AS INTEGER)
    ), 0) + 1
    INTO v_sequence
    FROM commandes_prestations
    WHERE numero_commande LIKE 'CMD-' || v_date || '%';
    
    v_numero := 'CMD-' || v_date || '-' || LPAD(v_sequence::TEXT, 5, '0');
    
    RETURN v_numero;
END;
$$ LANGUAGE plpgsql;

-- Exemple : CMD-20260215-00001
```

---

## 📱 Mobile Responsive

### Breakpoints CSS

```css
/* Mobile First */
@media (max-width: 768px) {
    .prestations-grid { grid-template-columns: 1fr; }
    .btn-floating-panier { bottom: 80px; } /* Au-dessus bottom nav */
}

/* Tablet */
@media (min-width: 769px) and (max-width: 1024px) {
    .prestations-grid { grid-template-columns: repeat(2, 1fr); }
}

/* Desktop */
@media (min-width: 1025px) {
    .prestations-grid { grid-template-columns: repeat(3, 1fr); }
}
```

### Bottom Navigation (Mobile)

```html
<nav class="bottom-nav">
    <div class="nav-item" data-tab="infos">Infos</div>
    <div class="nav-item" data-tab="activites">Activités</div>
    <div class="nav-item" data-tab="prestations">Services</div>  <!-- ✨ NOUVEAU -->
    <div class="nav-item" data-tab="contact">Contact</div>
</nav>
```

---

## 🔐 Sécurité

### Durcissements applicatifs (février 2026)

- Liens externes `target="_blank"` durcis automatiquement avec `rel="noopener noreferrer"` via `js/shared-config.js`
- Réponses d'erreurs API assainies (pas de détails techniques bruts renvoyés au client) sur:
    - `api/openai.js`
    - `api/send-email.js`
    - `api/cors-proxy.js`
- `pages/admin-prompt-editor.html` durcie:
    - suppression de la configuration Supabase hardcodée
    - vérification d'accès admin (session + allowlist + rôle `user_roles`)
    - échappement HTML des contenus dynamiques de règles éthiques
- Contrôle d'accès admin harmonisé (session + allowlist + rôle `user_roles`) sur:
        - `js/admin-support.js`
        - `js/admin-monitoring.js`
        - `js/admin-content.js`
    - `js/admin-content-ai-strategy.js`
    - `js/admin-content-analytics.js`
    - `js/admin-clients.js`
    - `pages/admin-emails.html` (script inline)
    - `js/admin-promotions.js`
    - `js/admin-finance.js`
    - `pages/admin-communications.html` (script inline)
    - `js/admin-parrainage.js`
    - `js/admin-prestations.js`
    - `js/admin-prestations-stats.js`
    - `pages/admin-ticket-workflow.html` (script inline)
    - `pages/admin-error-details.html` (script inline)
    avec arrêt du chargement de la page si l'accès n'est pas validé

- Centralisation Supabase front:
    - suppression des identifiants Supabase hardcodés dans `js/admin-prestations.js`
    - utilisation de `js/shared-config.js` sur `pages/admin-prestations.html`, `pages/admin-prestations-stats.html`, `pages/admin-content-analytics.html`, `pages/admin-error-details.html`

### Authentification

- **Admin** : Supabase Auth (email + password)
- **Admin Dashboard** : vérification combinée email allowlist + rôle actif (`admin`/`super_admin`) si table `user_roles` disponible
- **Owner** : Supabase Auth + RLS (owner_id)
- **Client** : Token sécurisé dans URL (pas d'auth Supabase pour éviter friction)
  ```
  /pages/fiche-client.html?id=[UUID-RESERVATION]&token=[TOKEN]
  ```

### Validation Commandes

```javascript
// Côté client (JS)
if (panier.length === 0) {
    throw new Error('Panier vide');
}

// Côté serveur (RLS Supabase)
-- Vérifier que reservation_id appartient bien au token fourni
-- Vérifier que gite_id correspond à la réservation
-- Vérifier que prestations existent et sont actives
```

---

## 📊 Performances & Optimisations

### Indexes Critiques

```sql
-- Recherches fréquentes
CREATE INDEX idx_reservations_dates ON reservations(check_in, check_out);
CREATE INDEX idx_prestations_active ON prestations_catalogue(is_active);
CREATE INDEX idx_commandes_date ON commandes_prestations(date_commande);

-- Jointures fréquentes
CREATE INDEX idx_commandes_reservation ON commandes_prestations(reservation_id);
CREATE INDEX idx_lignes_commande ON lignes_commande_prestations(commande_id);
```

### Caching

- **localStorage** :
  - Panier prestations : `prestations_panier_[GITE_ID]`
  - Toggle commission : `prestations_inclure_commission`
  
- **Query Caching** (Supabase) :
  - Prestations actives : Cache 5 min
  - Stats CA : Cache 1h

---

## 🚀 Déploiement

### Stack Technique

| Composant | Technologie | Hébergement |
|-----------|-------------|-------------|
| **Frontend** | HTML5 + CSS3 + Vanilla JS | Vercel |
| **Backend** | Supabase (PostgreSQL + Auth + RLS) | Supabase Cloud |
| **CDN Assets** | Images, icons | Vercel Edge |
| **Monitoring** | Supabase Dashboard + Vercel Analytics | Cloud |

### Variables d'Environnement

```bash
# .env.production
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_APP_VERSION=2.12.0
VITE_ENABLE_DEBUG_LOGS=false
OPENAI_API_KEY=sk-...
SUPPORT_AI_ENABLED=true
SUPPORT_AI_ALLOWED_ORIGINS=https://liveownerunit.fr,https://www.liveownerunit.fr
OPENAI_ALLOWED_ORIGINS=https://liveownerunit.fr,https://www.liveownerunit.fr
SEND_EMAIL_ALLOWED_ORIGINS=https://liveownerunit.fr,https://www.liveownerunit.fr
CORS_PROXY_ALLOWED_ORIGINS=https://liveownerunit.fr,https://www.liveownerunit.fr
OPENAI_ENFORCE_ALLOWED_ORIGINS=false
SEND_EMAIL_ENFORCE_ALLOWED_ORIGINS=false
CORS_PROXY_ENFORCE_ALLOWED_ORIGINS=false
SUPPORT_AI_RATE_LIMIT_MAX=25
SUPPORT_AI_RATE_LIMIT_WINDOW_MS=600000
SUPPORT_AI_IP_HASH_SALT=change-me
SUPPORT_AI_ALERT_ERROR_RATE_1H_PCT=8
SUPPORT_AI_ALERT_COST_24H_EUR=12
SUPPORT_AI_ALERT_LATENCY_1H_MS=5000
SUPPORT_AI_ALERT_CONSECUTIVE_ERRORS_1H=5
SUPPORT_AI_AUTO_TICKET_ENABLED=true
SUPPORT_AI_EUR_PER_USD=0.92
SUPPORT_AI_PRICE_INPUT_USD_PER_1M_GPT_4O_MINI=0.15
SUPPORT_AI_PRICE_OUTPUT_USD_PER_1M_GPT_4O_MINI=0.6
SUPPORT_AI_PRICE_INPUT_USD_PER_1M_GPT_4_1_MINI=0.4
SUPPORT_AI_PRICE_OUTPUT_USD_PER_1M_GPT_4_1_MINI=1.6
SUPABASE_SERVICE_ROLE_KEY=...

# Paramètre PostgreSQL (RLS logs support IA)
# ALTER DATABASE postgres SET app.support_ai_admin_emails = 'admin1@domaine.tld,admin2@domaine.tld';
```

### API Serverless IA

- `/api/openai` : Proxy IA pour génération de contenu éditorial (modules contenu)
- `/api/support-ai` : Proxy IA dédié support client/admin (analyse ticket, JSON strict)
- `/api/ai-health?section=support&autoTicket=1` : KPI/alertes monitoring + auto-création de tickets incidents critiques côté client
- ✅ Clé OpenAI stockée uniquement côté serveur (`OPENAI_API_KEY`)
- ⛔ Interdiction d'exposer une clé IA dans les scripts frontend

### Table Monitoring IA

```sql
cm_support_ai_usage_logs
    id UUID PK
    endpoint TEXT
    request_source TEXT
    origin TEXT
    client_ip_hash TEXT
    requester_user_id UUID
    requester_client_id UUID
    requester_ticket_id UUID
    model TEXT
    prompt_chars INTEGER
    prompt_tokens INTEGER
    completion_tokens INTEGER
    total_tokens INTEGER
    estimated_cost_eur NUMERIC(12,6)
    latency_ms INTEGER
    status_code INTEGER
    success BOOLEAN
    error_code TEXT
    error_signature TEXT
    auto_ticket_id UUID
    auto_ticket_status TEXT
    auto_ticket_note TEXT
    auto_ticket_processed_at TIMESTAMPTZ
    created_at TIMESTAMPTZ
```

- Migration: `/sql/migrations/CREATE_SUPPORT_AI_USAGE_LOGS.sql`
- Écriture: `api/support-ai.js`
- Lecture agrégée + alertes: `api/ai-health.js` (section support)

### Commandes Déploiement

```bash
# 1. Build (si nécessaire)
npm run build

# 2. Deploy Vercel
vercel --prod

# 3. Migrations BDD
psql "$DATABASE_URL" -f sql/rebuild/01_REBUILD_SITE_ORDER.sql

# 4. Tests post-déploiement
npm run test:production
```

---

## 🐛 Bugs Connus & Solutions

### 1. **Réservations Chevauchantes (iCal Sync)**

**Problème :** Import iCal peut créer réservations overlapping sur même gîte

**Solution :**
```javascript
// scripts/check-overlapping-reservations.js
// Vérifie avant INSERT :
// - Même gîte
// - Dates qui se chevauchent
// - Garde la réservation la PLUS COURTE en durée
```

### 2. **Type Mismatch (INTEGER vs UUID)**

**Problème :** Erreur foreign key constraint si gite_id ou reservation_id en INTEGER

**Solution :** ✅ **CORRIGÉ** dans `create_prestations_simple.sql`
```sql
-- AVANT
gite_id INTEGER

-- APRÈS
gite_id UUID
```

### 3. **Column Not Found (nom vs name)**

**Problème :** Table gites utilise `name`, pas `nom`

**Solution :** ✅ **CORRIGÉ** dans tous les JS
```javascript
// AVANT
.select('id, nom')

// APRÈS
.select('id, name')
```

---

## 📝 Conventions de Code

### Nommage

- **Tables** : snake_case (`prestations_catalogue`, `commandes_prestations`)
- **Colonnes** : snake_case (`montant_net_owner`, `date_commande`)
- **JS Variables** : camelCase (`montantBrut`, `numeroCommande`)
- **JS Functions** : camelCase (`calculerTotaux`, `loadPrestations`)
- **CSS Classes** : kebab-case (`.prestation-card`, `.modal-panier`)

### Commentaires

```javascript
// ✅ BON : Expliquer POURQUOI, pas QUOI
// Garder réservation la plus courte pour éviter pertes CA
if (existingDuration < newDuration) return existing;

// ❌ MAUVAIS : Répéter le code
// Comparer les durées
if (existingDuration < newDuration) return existing;
```

### Logs Console

```javascript
// ✅ Production : Nettoyer tous console.log() inutiles
// ✅ Garder uniquement erreurs critiques
console.error('[PRESTATIONS] Erreur chargement catalogue:', error);

// ❌ Retirer en prod
console.log('Debug: panier =', panier);
```

---

## 📚 Documentation Technique

### Fichiers Documentation

| Fichier | Description |
|---------|-------------|
| `/docs/ARCHITECTURE.md` | **Ce fichier** - Vue d'ensemble système |
| `/docs/PRESTATIONS_V1_RESUME.md` | Résumé technique prestations |
| `/docs/PRESTATIONS_DEPLOY_PROD.md` | Guide déploiement production |
| `/docs/GUIDE_TEST_PRESTATIONS.md` | Guide test complet (650 lignes) |
| `/docs/PHASE_3_PLAN.md` | Spécifications Phase 3 (Toggle CA Global) |
| `/docs/ERREURS_CRITIQUES.md` | Historique bugs critiques + solutions |

### Fichiers SQL Production

| Fichier | Usage |
|---------|-------|
| `/sql/rebuild/01_REBUILD_SITE_ORDER.sql` | ✅ **PRODUCTION** - Point d’entrée unique rebuild |
| `/sql/rebuild/00_README_REBUILD_SITE.md` | Guide d’exécution rebuild |
| `/sql/rebuild/02_POST_REBUILD_CHECKLIST.md` | Contrôles post-rebuild |
| `/sql/checks/check-cancelled-status.sql` | Vérifier réservations annulées |

---

## 🎯 Phases Développement

### ✅ Phase 0 - MVP Réservations (Terminée)
- Gestion gîtes
- Calendrier réservations
- Sync iCal (Booking, Airbnb)
- Dashboard owner

### ✅ Phase 1 - Prestations BDD + Admin (Terminée 14 fév 2026)
- Tables BDD (prestations_catalogue, commandes, lignes)
- Interface admin catalogue
- Stats owner prestations
- Toggle commission 5%

### ✅ Phase 2 - Interface Client E-Commerce (Terminée 15 fév 2026)
- Onglet "Services & Prestations" fiche-client
- Catalogue avec filtres catégories
- Panier d'achat (localStorage)
- Modal panier avec calculs
- Commande en ligne (INSERT BDD)
- Responsive mobile

### ⏳ Phase 3 - Intégration CA Global (À venir, 1-2 jours)
- Table `user_preferences` (BDD)
- Migration toggle localStorage → BDD
- Dashboard CA Total (Réservations + Prestations)
- Synchronisation temps réel multi-onglets

### 📅 Phase 4 - Notifications & Paiements (Futur)
- Emails auto confirmation commande
- Notifications push owner (nouvelle commande)
- Intégration Stripe (paiement en ligne)
- Factures PDF auto-générées

---

## 📞 Support & Maintenance

### Logs Monitoring

```sql
-- Erreurs RLS (Supabase Dashboard)
SELECT * FROM postgres_logs 
WHERE message LIKE '%RLS%' 
ORDER BY timestamp DESC LIMIT 50;

-- Commandes échouées
SELECT * FROM commandes_prestations 
WHERE statut = 'annulee' 
AND date_commande > NOW() - INTERVAL '7 days';

-- Prestations jamais commandées (analyse marketing)
SELECT p.* FROM prestations_catalogue p
LEFT JOIN lignes_commande_prestations l ON p.id = l.prestation_id
WHERE l.id IS NULL AND p.is_active = true;
```

### Backup BDD

```bash
# Backup quotidien automatique (Supabase)
# Rétention : 7 jours (gratuit) / 30 jours (Pro)

# Backup manuel
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Restauration
psql $DATABASE_URL < backup_20260215.sql
```

---

## 🔄 Changelog

### v2.13.48 - 10 mars 2026 🗄️
- ✅ Restauration données `infos_gites` depuis export_snapshot.json (3 gîtes : couzon, 3ème, trévoux)
  - ~100 colonnes ajoutées via ALTER TABLE (WiFi, accès, logement, déchets, sécurité, départ, règlement)
  - Colonne `gite TEXT UNIQUE` ajoutée, `gite_id` rendu nullable (compat. REBUILD)
  - Colonne `photos JSONB DEFAULT '[]'` ajoutée
  - Fichier SQL : `sql/IMPORT_INFOS_GITES_2026-03-10.sql`
- ✅ Création bucket Storage `gite-photos` (public, 10MB, JPEG/PNG/WebP/GIF)
- ✅ Nouveau système d'abonnements : table `subscriptions_plans` (solo/duo/quattro)
  - Remplace l'ancienne vue `cm_pricing_plans`
  - FK de `user_subscriptions.plan_id` mise à jour → `subscriptions_plans(id)`
  - Fichier SQL : `sql/ACTIVER_ABONNEMENT_QUATTRO.sql`
- ✅ Fix PGRST116 dans `pages/options.html` : `.single()` → `.maybeSingle()` (2 occurrences)

### v2.13.47 - 3 mars 2026 🔀
- ✅ Ajout d'un switch centralisé de mode distribution pour préparer l'intégration Google Vacation Rentals avec bascule simple:
    - nouveaux modes globaux: `gites_de_france` / `hors_gites_de_france`
    - implémentation dans `js/shared-config.js`:
        - `window.getDistributionAccessMode(context?)`
        - `window.setDistributionAccessMode(mode, options?)`
        - `window.getChannelCapabilities(channel, context?)`
        - `window.hasChannelCapability(channel, capability?, context?)`
    - mapping de capacités par canal selon le mode (lecture/écriture/gestion annonce)
- ✅ Intégration du switch dans la configuration des plateformes iCal (`js/ical-config-modern.js`):
    - ajout de la plateforme `google-vacation-rentals`
    - affichage conditionnel des plateformes selon le mode actif
    - message explicite en mode `gites_de_france` quand Google Vacation Rentals est indisponible

### v2.13.46 - 3 mars 2026 🧹
- ✅ Notifications automatiques de replanification ménage (conflits réservation) :
    - nouvelles préférences owner dans `user_notification_preferences` :
        - `notify_menage_modifications`
        - `menage_company_email`
    - migration: `sql/migrations/ADD_NOTIFICATION_MENAGE_COMPANY_FIELDS_2026-03-03.sql`
    - ajout options UI dans `pages/options.html` (toggle + email société ménage)
    - ajout Edge Function `supabase/functions/notify-cleaning-planning-change/index.ts`
    - branchement dans `js/supabase-operations.js` après `autoResolveCleaningConflictForReservation`
    - email envoyé à la société de ménage avec:
        - dates annulées
        - nouvelles dates proposées
        - niveau avertissement si ménage déjà validé impacté

### v2.13.43 - 27 février 2026 🗄️
- ✅ Ajout BDD des champs Intelligence Tarifaire LOU dans `public.gites` via migration:
    - `sql/migrations/ADD_GITES_TARIFICATION_FIELDS_2026-02-27.sql`
    - nouvelles colonnes: `beds`, `bathrooms`, `surface_m2`, `type_hebergement`, `label_classement`, `department`, `region`, `environment`, `situation`, `cuisine_niveau`, `animaux_acceptes`, `access_pmr`, `parking`, `platform_airbnb`, `platform_booking`, `platform_abritel`, `platform_gdf`, `platform_direct`
    - backfill depuis `settings.pricing_profile`, `settings.accessibility`, `settings.platforms_active`
    - ajout des index `idx_gites_region`, `idx_gites_type_hebergement`, `idx_gites_label_classement`
    - intégration au rebuild global via `sql/rebuild/01_REBUILD_SITE_ORDER.sql`

### v2.13.42 - 27 février 2026 💰
- ✅ Renforcement du formulaire propriétaire de création/édition de gîte pour alimenter l'intelligence tarifaire LOU :
    - ajout des champs localisation détaillée (`city`, `postal_code`, `department`, `region`, `country`)
    - ajout des champs capacité/profil (`bedrooms`, `beds`, `bathrooms`, `surface_m2`, `type_hebergement`, `label_classement`)
    - ajout des champs business (`price_per_night`, `description`, plateformes actives)
    - ajout des équipements structurés (wifi, piscine, jacuzzi, sauna, clim, cheminée, jardin, terrasse, barbecue, animaux)
    - persistance vers colonnes existantes de `gites` + `amenities` JSONB + `settings.pricing_profile/accessibility/platforms_active`
    - harmonisation du mapping create/update entre `js/gites-crud.js` et `js/gites-manager.js` (compatibilité `icon/address/ical_sources`)

### v2.13.41 - 24 février 2026 🧹
- ✅ Audit qualité/obsolescence JS (sans impact UX) :
    - archivage de scripts orphelins non référencés par les HTML actifs vers `_archives/by_category/js/js_cleanup_20260224_orphans_phase2/` :
        - `calou-icons.js`
        - `mobile.js`
        - `sync-ical.js`
    - confirmation de la version active iCal maintenue sur `js/sync-ical-v2.js` (chargée par `app.html`)
    - réduction du bruit console en production:
        - suppression de logs de debug dans `js/kanban.js`
        - suppression de logs de debug dans `js/infos-gites.js`
    - validation post-lot: `No errors found` côté diagnostics éditeur

### v2.13.39 - 24 février 2026 📚
- ✅ Clôture RGPD avancée (documentaire, sans impact runtime) :
    - publication de `cgu-cgv.html` en version interne provisoire
    - création du registre DSAR opérationnel `docs/rapports/RGPD_REGISTRE_DSAR_OPERATIONNEL_2026-02-24.md`
    - création du registre sous-traitants DPA/SCC `docs/rapports/RGPD_REGISTRE_SOUS_TRAITANTS_DPA_SCC_2026-02-24.md`
    - création du document de pilotage final `docs/rapports/RESTE_A_FAIRE_RGPD_2026-02-24.md`
    - alignement des statuts dans `docs/rapports/RGPD_DOSSIER_CONFORMITE_CENTRAL.md`, `docs/rapports/REGISTRE_PREUVES_AUDIT_EXTERNE_2026-02-22.md`, `docs/rapports/CHECKLIST_EXECUTION_NON_PROD_15J_2026-02-22.md`
    - ajout de l'URL publique `cgu-cgv.html` dans `sitemap.xml`

### v2.13.38 - 24 février 2026 📘
- ✅ Exécution RGPD P0 documentaire (sans impact runtime) :
    - publication de `privacy.html` (politique de confidentialité) en version interne provisoire
    - publication de `legal.html` (mentions légales) en version interne provisoire
    - ajout des URLs juridiques publiques dans `sitemap.xml`
    - mise à jour des statuts/preuves dans :
        - `docs/rapports/RGPD_DOSSIER_CONFORMITE_CENTRAL.md`
        - `docs/rapports/REGISTRE_PREUVES_AUDIT_EXTERNE_2026-02-22.md`
        - `docs/rapports/CHECKLIST_EXECUTION_NON_PROD_15J_2026-02-22.md`

### v2.13.37 - 23 février 2026 🚑
- ✅ Correctif critique `42P17` (récursion infinie RLS sur `user_roles`) :
    - suppression du pattern de policy auto-référente dans `_archives/by_category/sql/sql_cleanup_20260224_clean_rebuild/sql/features/create_user_roles.sql` (historique source)
    - ajout d'un fix prod exécutable immédiatement: `sql/securite/FIX_USER_ROLES_RLS_RECURSION_2026-02-23.sql`
    - modèle de policies stabilisé: lecture de ses propres rôles pour `authenticated`, gestion complète réservée à `service_role`
- ✅ Garde runtime anti-spam dans `js/client-communications.js` :
    - en cas de `42P17`, désactivation temporaire du widget communications jusqu'au rechargement
    - arrêt des requêtes répétées et masquage propre du widget en mode dégradé
- ✅ Correctif de compatibilité clics (`onclick`) dans `js/security-utils.js` :
    - restauration ciblée des handlers inline pour le HTML injecté via `setInnerHTML` (vues legacy sur allowlist explicite)
    - durcissement complémentaire: compatibilité inline désactivée par défaut, bloquée sur surfaces `admin-*`, activation possible uniquement par opt-in explicite (`config.allowInlineHandlers === true`)
    - maintien du blocage des vecteurs critiques (`<script>`, `onerror`, `onload`)
    - traçabilité sécurité/incident synchronisée avec `docs/architecture/ERREURS_CRITIQUES.md`

### v2.13.36 - 23 février 2026 🔧
- ✅ Clôture finale du lot hardening XSS admin (suppression des handlers inline restants sur le périmètre actif):
    - migration des modules complémentaires `admin-content`, `admin-clients`, `admin-emails`, `admin-parrainage`, `admin-promotions`, `admin-ticket-workflow`
    - nettoyage des reliquats sur `admin-content-analytics`, `admin-error-details`, `admin-prestations-stats`, `admin-prompt-editor`, `admin-dashboard` et `admin-error-monitor`
    - conversion systématique vers `data-action`/`data-nav-url` + délégation d'événements centralisée
    - validation finale: scan global actif `admin-*.html/js` = `0` handlers inline (hors `_versions`, `_archives`, `_backups`, `.git`)
    - scores consolidés confirmés: sécurité technique `98/100`, sécurité consolidée `99/100`, RGPD `86/100`
    - supports alignés: `docs/rapports/AUDIT_SECURITE_RGPD_2026-02-21.md`, `docs/architecture/ERREURS_CRITIQUES.md`

### v2.13.35 - 23 février 2026 🔧
- ✅ Réduction complémentaire de la surface XSS sur les modules admin channel manager et support:
    - suppression des handlers inline statiques (`onclick`) dans `pages/admin-channel-manager.html` et `pages/admin-support.html` (navigation/actions)
    - suppression des handlers inline dynamiques résiduels dans `js/admin-support.js` (tickets/suggestions/KB), migration vers `data-action` + délégation d'événements
    - validation post-correction: `No errors found` sur les 3 fichiers actifs du lot + scan inline handlers propre (hors `_versions`)
    - maintien strict de l'UX et des routes existantes
    - recalcul officiel aligné: sécurité technique `98/100`, sécurité consolidée `99/100`, RGPD `86/100`
    - supports mis à jour: `docs/rapports/AUDIT_SECURITE_RGPD_2026-02-21.md`, `pages/admin-security-audit.html`

### v2.13.34 - 23 février 2026 🔧
- ✅ Réduction complémentaire de la surface XSS sur le module admin monitoring (rendu dynamique JS):
    - suppression des handlers inline dynamiques (`onclick`/`onchange`) générés dans `js/admin-monitoring.js` (actions erreurs, tickets, logs, modal auto-fix, validation tests)
    - migration vers attributs `data-action` + délégation centralisée (`setupMonitoringDynamicDelegation()`)
    - sécurisation de `updateTicketStatus` sans dépendance implicite à `event` global
    - maintien strict de l'UX et des actions opérationnelles existantes
    - recalcul officiel aligné: sécurité technique `97/100`, sécurité consolidée `99/100`, RGPD `86/100`
    - supports mis à jour: `docs/rapports/AUDIT_SECURITE_RGPD_2026-02-21.md`, `pages/admin-security-audit.html`

### v2.13.33 - 23 février 2026 🔧
- ✅ Réduction complémentaire de la surface XSS sur le module admin monitoring:
    - suppression des handlers inline statiques `onclick` dans `pages/admin-monitoring.html` (navigation sidebar, actions principales, fermeture modal)
    - migration vers `data-nav-url` / `data-action` + délégation d'événements en script de page
    - maintien strict de l'UX et des routes de navigation existantes
    - recalcul officiel aligné: sécurité technique `96/100`, sécurité consolidée `98/100`, RGPD `86/100`
    - supports mis à jour: `docs/rapports/AUDIT_SECURITE_RGPD_2026-02-21.md`, `pages/admin-security-audit.html`

### v2.13.32 - 23 février 2026 🔧
- ✅ Réduction complémentaire de la surface XSS sur le module admin communications:
    - suppression des handlers inline `onclick` dans `pages/admin-communications.html` (header, sidebar, modes IA, suppression d'item)
    - migration vers `data-nav-url` / `data-action` + délégation d'événements dans le script de page
    - maintien strict de l'UX et des routes de navigation existantes
    - recalcul officiel aligné: sécurité technique `95/100`, sécurité consolidée `97/100`, RGPD `86/100`
    - supports mis à jour: `docs/rapports/AUDIT_SECURITE_RGPD_2026-02-21.md`, `pages/admin-security-audit.html`

### v2.13.31 - 23 février 2026 🔧
- ✅ Réduction complémentaire de la surface XSS sur le module admin finance:
    - suppression des handlers inline `onclick` dans `pages/admin-finance.html` (navigation sidebar + action export)
    - migration vers attributs `data-nav-url` / `data-action` et listeners JS dans `js/admin-finance.js`
    - maintien strict de l'UX et des routes de navigation existantes
    - recalcul officiel aligné: sécurité technique `94/100`, sécurité consolidée `96/100`, RGPD `86/100`
    - supports mis à jour: `docs/rapports/AUDIT_SECURITE_RGPD_2026-02-21.md`, `pages/admin-security-audit.html`

### v2.13.30 - 23 février 2026 🔧
- ✅ Réduction ciblée de la surface XSS sur le module admin prestations:
    - suppression des handlers inline `onclick/onchange/onsubmit` dans `pages/admin-prestations.html`
    - remplacement par délégation d'événements dans `js/admin-prestations.js` (actions + tabs + formulaires)
    - maintien strict de l'UX fonctionnelle existante (aucune fonctionnalité ajoutée)
    - recalcul officiel aligné: sécurité technique `93/100`, sécurité consolidée `95/100`, RGPD `86/100`
    - supports mis à jour: `docs/rapports/AUDIT_SECURITE_RGPD_2026-02-21.md`, `pages/admin-security-audit.html`

### v2.13.29 - 23 février 2026 🛡️
- ✅ Durcissement runtime complémentaire orienté score sécurité:
    - enforcement CORS activé par défaut sur endpoints sensibles: `api/openai.js`, `api/send-email.js`, `api/cors-proxy.js`, `api/content-ai.js`
    - remplacement du CORS wildcard sur `api/content-ai.js` par allowlist + contrôle d'origine
    - suppression de l'exécution automatique des scripts injectés dans `js/security-utils.js` (mode `trusted`)
    - recalcul officiel aligné: sécurité technique `92/100`, sécurité consolidée `94/100`, RGPD `86/100`
    - supports mis à jour: `docs/rapports/AUDIT_SECURITE_RGPD_2026-02-21.md`, `pages/admin-security-audit.html`

### v2.13.28 - 23 février 2026 📊
- ✅ Recalcul final+ des scores d'audit sécurité/RGPD après validation du durcissement complémentaire RLS sur le lot tables restantes:
    - score sécurité technique mis à jour à `91/100`
    - score sécurité consolidée mis à jour à `93/100`
    - score RGPD mis à jour à `85/100`
    - criticité résiduelle maintenue à `1 majeur` (0 bloquant)
    - alignement des supports officiels: `docs/rapports/AUDIT_SECURITE_RGPD_2026-02-21.md` et `pages/admin-security-audit.html`

### v2.13.27 - 23 février 2026 🧱
- ✅ Renforcement du lot RLS tables restantes par activation `FORCE ROW LEVEL SECURITY` sur le périmètre durci:
    - tables concernées: `_cleanup_dropped_tables_20260223`, `cleaning_rules`, `cm_content_generated`, `cm_error_logs`, `cm_support_ticket_history`, `commandes_prestations`, `lignes_commande_prestations`, `prestations_catalogue`, `problemes_signales`, `system_config`
    - ajout d'un post-check dédié: "tables du lot encore sans FORCE RLS" (cible = 0 ligne)
    - script mis à jour: `sql/securite/RLS_HARDENING_TABLES_RESTANTES_2026-02-23.sql`

### v2.13.26 - 23 février 2026 🔐
- ✅ Durcissement du helper RLS admin `gc_is_admin` dans le lot tables restantes:
    - suppression du fallback email hardcodé
    - validation sur rôles actifs (`is_active=true`) avec `admin/super_admin`
    - restriction des privilèges d'exécution à `authenticated` (retrait `anon/public`)
    - ajout d'un post-check SQL dédié (hardcoding + droits d'exécution)
    - script mis à jour: `sql/securite/RLS_HARDENING_TABLES_RESTANTES_2026-02-23.sql`

### v2.13.25 - 23 février 2026 📊
- ✅ Recalcul final des scores d'audit sécurité/RGPD après clôture des lots SQL de hardening:
    - score sécurité consolidée mis à jour à `92/100`
    - score RGPD mis à jour à `84/100`
    - criticité résiduelle ramenée à `1 majeur` (0 bloquant)
    - alignement des supports officiels: `docs/rapports/AUDIT_SECURITE_RGPD_2026-02-21.md` et `pages/admin-security-audit.html`

### v2.13.24 - 23 février 2026 🔐
- ✅ Ajout d'un lot de hardening RLS pour les tables restantes non protégées, en mode dynamique et conservateur (compatibilité schémas hétérogènes):
    - script: `sql/securite/RLS_HARDENING_TABLES_RESTANTES_2026-02-23.sql`
    - couvre: `cleaning_rules`, `cm_content_generated`, `cm_error_logs`, `cm_support_ticket_history`, `commandes_prestations`, `lignes_commande_prestations`, `prestations_catalogue`, `problemes_signales`, `system_config`, `_cleanup_dropped_tables_20260223`
    - inclut post-check de régression RLS

### v2.13.23 - 23 février 2026 🧹
- ✅ Ajout d'un script de nettoyage BDD "extra propre" (suppression ciblée des tables legacy/backup confirmées) avec journalisation des drops et post-check sécurité:
    - script: `_archives/by_category/sql/sql_cleanup_20260224_clean_rebuild/sql/securite/CLEANUP_BDD_EXTRA_PROPRE_2026-02-23.sql` (historique archivé)
    - exclut explicitement les tables encore utilisées par le runtime (métier/admin)

### v2.13.22 - 23 février 2026 👁️
- ✅ Intégration côté page d'audit admin d'un bloc "Suivi hebdo opérationnel" masqué par défaut (affichage à la demande) pointant vers le script SQL read-only:
    - page: `pages/admin-security-audit.html`
    - script référencé: `sql/securite/SUIVI_HEBDO_SECURITE_ADMIN_2026-02-23.sql`

### v2.13.21 - 23 février 2026 📋
- ✅ Intégration d'un script de suivi hebdomadaire sécurité admin (read-only) pour pilotage opérationnel en SQL Editor:
    - KPI synthèse sécurité/perf (`dead tuples >20%`, index non contraints non utilisés, policies permissives anon/public)
    - focus hotspots `n_dead_tup >= 1000` pour éviter les faux positifs sur petites tables
    - contrôles détaillés de régression RLS et index inutilisés
    - script ajouté: `sql/securite/SUIVI_HEBDO_SECURITE_ADMIN_2026-02-23.sql`

### v2.13.20 - 23 février 2026 📈
- ✅ Recalcul audit sécurité/RGPD post-remédiations SQL prod:
    - score sécurité consolidée mis à jour à `85/100`
    - score RGPD mis à jour à `78/100`
    - policies permissives `anon/public` en `USING(true)` / `WITH CHECK(true)` réduites à `0`
    - mise à jour des supports d'audit: `docs/rapports/AUDIT_SECURITE_RGPD_2026-02-21.md` et `pages/admin-security-audit.html`

### v2.13.19 - 23 février 2026 🧪
- ✅ Préparation du chantier "nettoyage + optimisation tables" en mode non destructif:
    - ajout d'un script d'audit SQL read-only couvrant volumétrie, dead tuples, index inutiles/dupliqués, FK non indexées, état RLS et cohérence métier réservations (`_archives/by_category/sql/sql_cleanup_20260224_clean_rebuild/sql/rapports/AUDIT_NETTOYAGE_OPTIMISATION_TABLES_2026-02-23.sql`, historique)
    - ajout d'un guide d'exécution/interprétation pour pilotage par lots contrôlés (`sql/rapports/README_AUDIT_NETTOYAGE_OPTIMISATION_2026-02-23.md`)

### v2.13.18 - 23 février 2026 🧯
- ✅ Préparation du lot 3 RLS fiche-client (scripts SQL prêts à exécution contrôlée) :
    - backup des policies ciblées avant migration (`sql/securite/fiche_client_rls_lot3_pre_backup_20260223.sql`)
    - post-check de validation après migration (`sql/securite/fiche_client_rls_lot3_postcheck_20260223.sql`)
    - rollback complet basé sur backup (`sql/securite/fiche_client_rls_lot3_rollback_20260223.sql`)
    - script principal à appliquer inchangé (`sql/security_hardening_rls_fiche_client_token.sql`)

### v2.13.17 - 23 février 2026 🛡️
- ✅ Lot 2 hardening sécurité HTTP/CSP (non cassant) :
    - CSP enrichie avec directives défensives `object-src 'none'`, `base-uri 'self'`, `frame-ancestors 'self'`, `form-action 'self'` (`vercel.json`)
    - retrait du header legacy `X-XSS-Protection` (obsolète navigateurs modernes)
    - ajout de headers modernes `Cross-Origin-Opener-Policy: same-origin-allow-popups`, `X-Permitted-Cross-Domain-Policies: none`, `X-DNS-Prefetch-Control: off` (`vercel.json`)
    - objectif: réduction surface injection/clickjacking sans impacter les flux OAuth/embeds existants

### v2.13.16 - 23 février 2026 🔒
- ✅ Hardening sécurité/RGPD en production (sans modification d'`index.html`) :
    - Tokens OAuth Zoho migrés en stockage session navigateur + migration auto depuis legacy localStorage (`js/zoho-mail-config.js`)
    - Sanitizer par défaut durci (suppression event handlers inline + balises actives interdites) (`js/security-utils.js`)
    - Client Supabase fiche-client enrichi du header `x-client-token` pour activer des policies RLS strictes (`js/fiche-client-app.js`)
    - Script SQL de durcissement RLS fiche-client token-scope ajouté (`sql/security_hardening_rls_fiche_client_token.sql`)

### v2.13.15 - 22 février 2026 🛠️
- ✅ Stabilisation runtime front sans modification métier:
    - garde DOM ajoutée pour les KPI performance dashboard (`js/dashboard.js`)
    - correction client Supabase sur parrainage admin + lecture `maybeSingle` (`js/admin-clients.js`)
    - log iCal BDD rendu lisible (message/code) (`js/sync-ical-v2.js`)
    - robustesse tokens ménage via `maybeSingle` (`js/menage.js`, `js/femme-menage.js`)
    - upsert stock draps aligné sur conflit `owner_user_id,gite_id,item_key` (`js/draps.js`)
    - mode dégradé silencieux pour `cm_error_logs` non autorisé et API IA absente (`js/admin-dashboard.js`, `js/admin-monitoring.js`)
- ✅ Ajout d'une page de recette dédiée: `pages/test-fixes.html`

### v2.13.14 - 22 février 2026 🗂️
- ✅ Ajout des livrables opérationnels non-prod pour exécution et preuve audit :
    - `docs/rapports/CHECKLIST_EXECUTION_NON_PROD_15J_2026-02-22.md`
    - `docs/rapports/REGISTRE_PREUVES_AUDIT_EXTERNE_2026-02-22.md`
- ✅ Alignement du dossier central RGPD et du rapport d'audit avec ces nouvelles références

### v2.13.13 - 22 février 2026 📌
- ✅ Consolidation documentaire non-prod finalisée (aucun changement runtime)
- ✅ Ajout du plan d'action séquencé : `docs/rapports/PLAN_ACTION_NON_PROD_SECURITE_RGPD_2026-02-22.md`
- ✅ Alignement des références et trajectoires de note dans :
    - `docs/rapports/RGPD_DOSSIER_CONFORMITE_CENTRAL.md`
    - `docs/rapports/AUDIT_SECURITE_RGPD_2026-02-21.md`

### v2.13.12 - 22 février 2026 🧾
- ✅ Renforcement documentaire RGPD sans altération runtime :
    - `docs/rapports/RGPD_MATRICE_CONSERVATION_MODELE.md`
    - `docs/rapports/RGPD_REGISTRE_DSAR_MODELE.md`
- ✅ Liaison des annexes dans le dossier conformité et l’audit admin

### v2.13.45 - 1 mars 2026 🧭
- ✅ Démarrage du plan d'amélioration interne (hors dépendances externes) : `docs/rapports/performance/PLAN_AMELIORATION_INTERNE_2026-03-01.md`
- ✅ Ajout du script SQL read-only de suivi perf interne : `sql/performance/SUIVI_HEBDO_PERF_INTERNE_2026-03-01.sql`
- ✅ Instrumentation légère du flux iCal (durées + lenteurs) : `js/sync-ical-v2.js` (`window.__louInternalPerfMetrics`)

### v2.13.46 - 1 mars 2026 🛠️
- ✅ KPI perf interne consolidé (5 tables >20% dead tuples, 3 index non utilisés, 0 requêtes >30s)
- ✅ Script de diagnostic détaillé dead tuples/index candidats : `sql/performance/DIAGNOSTIC_PERF_INTERNE_DETAILS_2026-03-01.sql`
- ✅ Script de remédiation safe-first (ANALYZE + VACUUM ciblé) : `sql/performance/REMEDIATION_PERF_INTERNE_2026-03-01.sql`

### v2.13.44 - 1 mars 2026 🚀
- ✅ Protocole de montée en charge checkpointé/reprise (`scripts/load-test-curl.sh`) avec avancement `%` persistant dans manifest
- ✅ Campagne charge finalisée à 100% (12/12 phases) et artefacts générés dans `docs/rapports/performance/`
- ✅ Rapport détaillé de performance : `docs/rapports/performance/AUDIT_MONTEE_CHARGE_2026-03-01.md`
- ✅ Nouvelle page admin dédiée : `pages/admin-performance-audit.html`
- ✅ Accès dashboard ajouté : bouton `Audit performance` dans `js/admin-dashboard.js`

### v2.13.47 - 1 mars 2026 📈
- ✅ Campagne comparative reprise et finalisée: `2026-03-01T20-30-33Z` (12/12 phases)
- ✅ Mise à jour du rapport comparatif avant/après: `docs/rapports/performance/AUDIT_MONTEE_CHARGE_2026-03-01.md`
- ✅ Mise à jour de la page admin performance: `pages/admin-performance-audit.html`
- ✅ Correctif de fiabilité du protocole: déduplication des phases dans `scripts/load-test-curl.sh` (progression bornée à 100%)
- ✅ Alignement périmètre interne: scénario `admin_security_page` rendu optionnel (`INCLUDE_ADMIN_SCENARIO=1` pour l'activer), exclu par défaut du protocole

### v2.13.48 - 1 mars 2026 🎯
- ✅ Exécution d'un run API-only hors admin: `2026-03-01T21-API-ONLY-2Z` (8/8 phases)
- ✅ Artefacts générés: manifest + raw + summary dans `docs/rapports/performance/`
- ✅ Verdict API-only: latence conforme, mais `errorRate` non conforme sur `/api/ai-health` (1.60%)

### v2.13.49 - 1 mars 2026 ✅
- ✅ Run API-only bis de confirmation: `2026-03-01T22-API-ONLY-3Z` (8/8 phases)
- ✅ Verdict API-only de référence: **PASS** (`worstP95=207ms`, `worstErrorRate=0.25%`)
- ✅ Rapport et page admin performance alignés sur ce run comme référence officielle Go/No-Go hors admin

### v2.13.50 - 1 mars 2026 🗓️
- ✅ Ajout d'un bouton `Lancer check hebdo` dans `pages/admin-performance-audit.html`
- ✅ Ajout d'une section intégrée `Check Hebdo Performance` (3 étapes + seuils Go/No-Go)
- ✅ Création du runbook dédié: `docs/rapports/performance/RUNBOOK_CHECK_HEBDO_PERF_INTERNE.md`

### v2.13.51 - 1 mars 2026 📋
- ✅ Ajout d'un bouton `Copier commande API-only` dans `pages/admin-performance-audit.html`
- ✅ Copie presse-papiers en 1 clic de la commande hebdo standard (fallback inclus)

### v2.13.52 - 1 mars 2026 🧭
- ✅ Refactor UX de `pages/admin-performance-audit.html` : section unique `Surveillance évolution`
- ✅ Remplacement des boutons rapides par des onglets (Vue globale, Point bloquant, Check hebdo)
- ✅ Ajout d'un onglet dédié `Scalabilité`

### v2.13.53 - 1 mars 2026 🧩
- ✅ Remplacement des boutons header du dashboard admin par un bloc à onglets `Surveillance évolution`
- ✅ Onglets ajoutés dans `js/admin-dashboard.js` : Améliorations, Export fiscal, Audit sécurité, Audit performance, Scalabilité
- ✅ Navigation/CTA intégrées par onglet avec conservation de l'export fiscal lisible

### v2.13.54 - 1 mars 2026 🧱
- ✅ Remplacement du bloc header par un bouton unique `Surveillance et évolution` dans `js/admin-dashboard.js`
- ✅ Nouvelle page dédiée `pages/admin-surveillance-evolution.html` avec onglets latéraux : Améliorations / Export fiscale / Audit sécurité / Audit performance / Scalabilité
- ✅ Déclenchement de l'export fiscal via lien `admin-channel-manager.html#fiscal-export`

### v2.13.55 - 1 mars 2026 🧭
- ✅ Suppression du bouton header `Surveillance et évolution` (pas de bouton supplémentaire)
- ✅ Ajout de l'accès `Surveillance et évolution` directement dans la navigation latérale de `pages/admin-channel-manager.html`
- ✅ Conservation de la page dédiée à onglets latéraux `pages/admin-surveillance-evolution.html`

### v2.13.56 - 1 mars 2026 🪟
- ✅ Suppression des boutons CTA dans `pages/admin-surveillance-evolution.html`
- ✅ Affichage direct du contenu cible par onglet via panneaux embarqués (iframe)
- ✅ Support du hash `#tab-scalability` dans `pages/admin-performance-audit.html` pour ouverture directe de l'onglet Scalabilité

### v2.13.57 - 1 mars 2026 🧰
- ✅ `pages/admin-surveillance-evolution.html` ajustée au format pleine largeur (taille page normale)
- ✅ Onglet renommé `Fiscalité` et correction de la source vers `pages/admin-finance.html` (plus de retour dashboard admin)

### v2.13.58 - 1 mars 2026 🔁
- ✅ Correction fonctionnelle onglet `Fiscalité` dans `pages/admin-surveillance-evolution.html`
- ✅ Retour à l'usage d'origine: lancement automatique de l'export fiscal lisible (sans bouton)
- ✅ Suppression de l'ouverture Finance dans cet onglet

### v2.13.59 - 1 mars 2026 📄
- ✅ Création de `pages/admin-fiscal-readable-report.html` (page du rapport fiscal lisible)
- ✅ Onglet `Fiscalité` de `pages/admin-surveillance-evolution.html` branché sur cette page
- ✅ Export conservé comme option dans la page du rapport fiscal

### v2.13.60 - 1 mars 2026 📈
- ✅ Enrichissement de l'onglet `Scalabilité` dans `pages/admin-performance-audit.html`
- ✅ Ajout d'une roadmap de montée en charge par paliers clients (0→50, 50→200, 200→500, 500→1k, 1k→3k, 3k+)
- ✅ Ajout d'une checklist de validation minimale à chaque palier

### v2.13.61 - 1 mars 2026 🚀
- ✅ Recalibrage de la roadmap `Scalabilité` pour une cible long terme **jusqu'à 70 000 utilisateurs**
- ✅ Nouveaux paliers utilisateurs: 0→500, 500→2k, 2k→10k, 10k→25k, 25k→50k, 50k→70k

### v2.13.62 - 1 mars 2026 🧱
- ✅ Séparation nette des pages `Audit performance` et `Scalabilité`
- ✅ Création de `pages/admin-scalabilite-roadmap.html` (titre et contenu dédiés)
- ✅ Onglet `Scalabilité` de `pages/admin-surveillance-evolution.html` branché vers la nouvelle page dédiée

### v2.13.63 - 1 mars 2026 🧭
- ✅ Ajout d'un accès direct `Scalabilité` dans la navigation latérale de `pages/admin-channel-manager.html`

### v2.13.64 - 1 mars 2026 🚢
- ✅ Montée de version applicative: `package.json` `6.3.0` → `6.4.0`
- ✅ Préparation release complète pour push Git + déploiement Vercel prod

### v2.13.11 - 21 février 2026 🧮
- ✅ Recalcul des notes audit sécurité/RGPD et refonte du document d'audit : `pages/admin-security-audit.html`
- ✅ Ajout d'un rapport d'audit daté : `docs/rapports/AUDIT_SECURITE_RGPD_2026-02-21.md`
- ✅ Mise à jour du dossier conformité RGPD avec l'inventaire fonctionnel consolidé : `docs/rapports/RGPD_DOSSIER_CONFORMITE_CENTRAL.md`

### v2.13.10 - 21 février 2026 📚
- ✅ Création d'un dossier central de conformité RGPD : `docs/rapports/RGPD_DOSSIER_CONFORMITE_CENTRAL.md`
- ✅ Liaison explicite depuis la page d'audit admin : `pages/admin-security-audit.html`
- ✅ Consolidation de l'inventaire des preuves techniques (docs, API, SQL, contrôles admin)

### v2.13.9 - 20 février 2026 🚨
- ✅ Conflit ménage au milieu d'une nouvelle réservation : suppression automatique de l'ancienne date de ménage
- ✅ Création automatique de 2 nouveaux ménages proposés : avant la nouvelle réservation + après la nouvelle réservation
- ✅ Warning explicatif ajouté côté owner (`js/menage.js`, `js/dashboard.js`) et côté société ménage (`pages/validation.html`)
- ✅ Automatisation branchée sur créations/mises à jour réservation (`js/supabase-operations.js`, `js/sync-ical-v2.js`)

### v2.13.8 - 20 février 2026 🧹
- ✅ Dashboard owner : alerte proactive ajoutée pour les conflits de planning ménage (date ménage > prochaine arrivée)
- ✅ Détection ajoutée dans `js/dashboard.js` et redirection vers l'onglet Ménage

### v2.13.7 - 18 février 2026 🚨
- ✅ Auto-ticketing incident critique IA branché au monitoring (`/api/ai-health?section=support&autoTicket=1`)
- ✅ Corrélation client/ticket ajoutée aux logs IA (`requester_user_id`, `requester_client_id`, `requester_ticket_id`, `error_signature`)
- ✅ Création proactive d'un ticket client avec pré-analyse en cas d'erreur critique détectée
- ✅ Workflow support admin "Corrigé + notifier + clôturer" pour envoyer un message de résolution puis clore le ticket

### v2.13.6 - 18 février 2026 🧠
- ✅ Copilote support N1 renforcé pour incidents (réponses opérationnelles non vagues)
- ✅ Enregistrement progressif des réponses type depuis `pages/admin-support.html` (bouton "Enregistrer réponse type")
- ✅ Réutilisation prioritaire des réponses type dans les suggestions copilote (BDD `cm_support_solutions` + fallback local)
- ✅ Tickets support clôturés masqués de la liste active, avec historique conservé et réouverture possible côté client (`js/admin-support.js`, `js/client-support.js`)

### v2.13.5 - 18 février 2026 📊
- ✅ Monitoring complet IA support sur dashboard admin (`pages/admin-channel-manager.html`, `js/admin-dashboard.js`)
- ✅ Journalisation serveur des appels IA (tokens, coût estimé, latence, status) dans `cm_support_ai_usage_logs`
- ✅ Endpoint métriques/alertes intégré à `api/ai-health.js` (section support: taux d'erreur, latence, coût, incidents)
- ✅ Alertes IA injectées dans le bloc Alertes du dashboard pour prévention proactive

### v2.13.4 - 18 février 2026 🛡️
- ✅ Durcissement endpoint `api/support-ai.js` pour test prod sécurisé
- ✅ Contrôle d'origin (allowlist), feature flag (`SUPPORT_AI_ENABLED`) et rate limiting
- ✅ Validation stricte des inputs (taille prompt/system prompt, modèle autorisé, tokens/temperature clampés)

### v2.13.3 - 18 février 2026 🤝
- ✅ Support Admin: copilote IA niveau 1 dans `pages/admin-support.html` / `js/admin-support.js`
- ✅ Sorties copilote: suggestions de réponse, classement d'urgence, prochain pas opérationnel
- ✅ Appel IA 100% serveur via `/api/support-ai` (aucune clé côté frontend)

### v2.13.2 - 18 février 2026 🔐
- ✅ Sécurisation IA support : suppression clé OpenAI côté frontend (`js/support-ai.js`)
- ✅ Ajout endpoint serveur dédié support (`api/support-ai.js`)
- ✅ Flux support IA basculé en appel proxy interne (`/api/support-ai`)

### v2.13.1 - 17 février 2026 🧩
- ✅ Kanban : Drag & Drop des cartes entre colonnes (`todo` ↔ `in_progress` ↔ `done`)
- ✅ Kanban : Reclassement manuel des cartes dans une même colonne (ordre sauvegardé côté navigateur)

### v2.13.0 - 15 février 2026 🎉
- ✅ **Commission configurable** : Table system_config + interface admin
- ✅ **Lien menu owner** : Bouton "Prestations & CA" dans app.html
- ✅ Nettoyage documentation (fusion dans ARCHITECTURE.md)

### v2.12.0 - 15 février 2026 ✨
- ✅ **Phase 2 Complète** : Interface client prestations e-commerce
- ✅ Ajout onglet "Services & Prestations" fiche-client
- ✅ Panier d'achat avec localStorage
- ✅ Commande en ligne opérationnelle
- ✅ Calcul auto commission 5%
- ✅ Responsive mobile 100%

### v2.11.0 - 14 février 2026
- ✅ **Phase 1 Complète** : BDD prestations + Admin + Owner Stats
- ✅ Correction types UUID (gite_id, reservation_id)
- ✅ Correction colonnes (name vs nom, client_name)
- ✅ Interface admin gestion catalogue
- ✅ Stats owner avec toggle commission

### v2.10.0 - Janvier 2026
- Sync iCal multi-plateformes
- Gestion réservations chevauchantes
- Dashboard owner amélioré

### v2.15.0 - 10 mars 2026 (Session fixes schéma)

#### Colonnes ajoutées (ALTER TABLE)

| Table | Colonnes ajoutées | Raison |
|-------|-------------------|--------|
| `cm_clients` | `user_id`, `email_principal`, `nom_contact`, `prenom_contact`, `type_abonnement`, `statut`, `date_inscription`, `montant_mensuel`, `nb_gites_actuels`, `nom_entreprise`, `entreprise` | options.html + admin-dashboard.js |
| `cm_clients.email` | `NOT NULL` → nullable | JS n'envoie que `email_principal` |
| `cm_subscriptions` | `date_debut` (alias de `current_period_start`) | admin-clients.js |
| `cm_support_tickets` | `sujet`, `categorie`, `priorite`, `statut`, `csat_score` | options.html + admin-dashboard.js |
| `cm_support_tickets.title` | `NOT NULL` → nullable | JS n'envoie que `sujet` |
| `cm_promo_usage` | `montant_reduction`, `ca_genere`, `statut`, `promo_id` | admin-promotions.js |
| `cm_revenue_tracking` | `mrr`, `mois` | admin-dashboard.js |
| `cm_activity_logs` | `type_activite` | admin-dashboard.js |
| `cm_promotions` | `nom`, `actif`, `date_fin` | admin-dashboard.js |
| `user_settings` | `subscription_type` | options.html parrainage |
| `user_roles` | `is_active` | admin auth check |
| `cleaning_schedule` | `gite TEXT` (sync depuis `gites.name`) | fiche-client-app.js |
| `problemes_signales` | `gite`, `client_name`, `sujet`, `statut`, `telephone` + `gite_id` nullable | fiche-client-app.js |
| `retours_menage` | `reported_by UUID` + `description` nullable | femme-menage.js |
| `referrals` | `registered_at` | admin-clients.js |

#### Tables créées

| Table | Raison |
|-------|--------|
| `prestations_catalogue` | fiche-client-prestations.js |
| `referrals` | parrainage options.html |

#### Vues créées

| Vue | Alias de | Raison |
|-----|----------|--------|
| `cm_error_logs` | `error_logs` | admin-error-monitor.js |

#### RLS ajoutées
- `cm_clients` : SELECT/INSERT/UPDATE par `auth.uid() = user_id`
- `cm_support_tickets` : SELECT/INSERT via sous-requête `cm_clients.user_id`
- `referrals` : SELECT par `auth.uid() = referrer_id`

#### Scripts SQL disponibles
- `sql/FIX_FICHE_CLIENT_SCHEMA.sql` — cleaning_schedule, problemes_signales, prestations_catalogue
- `sql/FIX_RETOURS_MENAGE_SCHEMA.sql` — retours_menage
- `sql/FIX_CM_CLIENTS_SCHEMA.sql` — cm_clients, user_settings, referrals, cm_support_tickets, cm_promo_usage, user_roles
- `sql/FIX_ADMIN_DASHBOARD_SCHEMA.sql` — cm_error_logs (vue), cm_revenue_tracking, cm_activity_logs, cm_promotions, cm_subscriptions, csat_score

---

---

## v2.16.0 — 10 mars 2026 (session après-midi)

### Colonnes ajoutées

| Table | Colonne | Type | Alias de |
|-------|---------|------|----------|
| `cm_clients` | `telephone` | TEXT | — |
| `cm_clients` | `date_fin_abonnement` | TIMESTAMPTZ | `trial_ends_at` |
| `cm_support_comments` | `is_ai_generated` | BOOLEAN | — |
| `cm_support_comments` | `user_id` | UUID | — |
| `cm_support_comments` | `author_email` | TEXT nullable | était NOT NULL |
| `cm_support_solutions` | `efficacite_score` | NUMERIC(3,2) | `score_pertinence` |
| `cm_support_solutions` | `nb_utilisations` | INTEGER | `reussite_count` |
| `cm_promotions` | `type_promotion` | TEXT | `type` |
| `cm_promotions` | `valeur` | NUMERIC(10,2) | `value` |
| `cm_promotions` | `cible` | TEXT | — |
| `cm_promotions` | `date_debut` | TIMESTAMPTZ | `valid_from` |
| `cm_promotions` | `max_utilisations` | INTEGER | `max_uses` |
| `cm_promotions` | `nb_utilisations` | INTEGER | `uses_count` |
| `cm_invoices` | `montant_ttc` | NUMERIC(10,2) | `total` |
| `cm_invoices` | `statut` | TEXT | `status` |
| `cm_invoices` | `date_emission` | DATE | `issued_date` |
| `cm_subscriptions` | `type_abonnement` | TEXT | `billing_cycle` |

### Tables créées

| Table | Raison |
|-------|--------|
| `referral_campaigns` | admin-parrainage.js — gestion campagnes |
| `user_campaign_participations` | admin-parrainage.js — stats participants |
| `cm_content_generated` | admin-content.js — contenu IA sauvegardé |

### Bugs JS corrigés
- `admin-content-ai-strategy.js` : doublon `const ADMIN_FALLBACK_EMAILS` supprimé (conflit avec `admin-content.js`)

### Scripts SQL disponibles
- `sql/FIX_FICHE_CLIENT_SCHEMA.sql`
- `sql/FIX_RETOURS_MENAGE_SCHEMA.sql`
- `sql/FIX_CM_CLIENTS_SCHEMA.sql`
- `sql/FIX_ADMIN_DASHBOARD_SCHEMA.sql` ← principal, 16 fixes cumulés

---

## v2.17.0 — 17 mars 2026 (suppression localStorage + fiche client RPCs)

### Migration localStorage → BDD

| Clé supprimée | Nouvelle persistance | Fichiers modifiés |
|---|---|---|
| `fiscalite_options_perso` | `user_settings.fiscalite_options_perso` (BOOLEAN) | `fiscalite-v2.js`, `dashboard.js` |
| `checklistFilter` | `window._checklistFilter` (navigation inter-onglets) | `dashboard.js`, `checklists.js` |
| `panier_prestations` | Mémoire seule (variable module) | `fiche-client-prestations.js` |

### Colonne ajoutée

| Table | Colonne | Type | Défaut |
|---|---|---|---|
| `user_settings` | `fiscalite_options_perso` | BOOLEAN | false |

### RPCs SECURITY DEFINER — Fiche client (contournement Kong)

| Fonction | Rôle |
|---|---|
| `get_reservation_by_client_token(text)` | Réservation via token |
| `get_client_token_data(text)` | Données brutes du token |
| `get_gite_info_by_client_token(text)` | Infos gîte via token (JOIN réservation) |
| `upsert_demande_horaire_by_token(text,text,text,text)` | Insert/update demande horaire |
| `upsert_checklist_progress_by_token(text,uuid,boolean)` | Progression checklist |
| `insert_retour_client_by_token(text,text,text,text,text)` | Retour/feedback client |

### Policies anon READ créées

| Policy | Table |
|---|---|
| `anon_read_infos_gites` | `infos_gites` |
| `anon_read_activites_gites` | `activites_gites` |
| `anon_read_faq` | `faq` |
| `anon_read_cleaning_schedule_client` | `cleaning_schedule` |
| `anon_read_checklist_templates` | `checklist_templates` |
| `anon_read_checklist_progress` | `checklist_progress` |
| `anon_read_demandes_horaires_client` | `demandes_horaires` |

### Scripts SQL disponibles
- `sql/FIX_FICHE_CLIENT_RPC_TOKEN_2026-03-17.sql` — RPCs + policies anon (exécuté en prod)
- `sql/MIGRATION_REMOVE_LOCALSTORAGE_2026-03-17.sql` — ADD COLUMN fiscalite_options_perso

### Note technique
Contexte Kong : La passerelle Supabase Kong ne transmet pas les headers custom (`x-client-token`) jusqu'à PostgREST. Toutes les opérations fiche client passent désormais par des RPCs SECURITY DEFINER avec le token en paramètre direct.

---

## v2.18.0 — 17 mars 2026 (emails confirmation commande prestations)

### Nouvelle Edge Function
| Fonction | Déclencheur | Rôle |
|---|---|---|
| `confirm-commande-prestations` | Appel direct JS après INSERT | Envoie 2 emails via Resend : confirmation client + notification owner |

### Comportement
- **Email client** : envoyé à `reservations.client_email` si présent — récapitulatif lignes + total
- **Email owner** : envoyé après vérification `user_notification_preferences` (`notify_commandes`) — récapitulatif + montant net
- **Fire & forget** : les emails n'bloquent pas la confirmation UI
- L'`alert()` remplacé par un `showToast()` propre

### Fichiers modifiés
- `supabase/functions/confirm-commande-prestations/index.ts` ← NOUVEAU
- `js/fiche-client-prestations.js` — appel Edge Function après commande réussie

### À déployer
```bash
supabase functions deploy confirm-commande-prestations
```

### Note technique
`user_notification_preferences` est une **vue** sur `notification_preferences` — tout `ALTER TABLE` doit cibler `notification_preferences` directement, puis recréer la vue.

---

**Document maintenu par :** GitHub Copilot  
**Contact Support :** admin@gite-calvignac.fr  
**Dernière révision :** 17 mars 2026, 20:00
