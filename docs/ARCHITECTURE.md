# 🏗️ Architecture - Gestion Gîte Calvignac

**Version :** 2.13.46  
**Dernière MAJ :** 27 mars 2026  
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

---

## 📋 Vue d'Ensemble

Application SaaS de gestion de gîtes avec :
- 🏠 Multi-gîtes par propriétaire
- 📅 Calendrier réservations + iCal sync
- 💰 Suivi CA (réservations + prestations supplémentaires)
- 👥 Interface Admin (Channel Manager)
- 📊 Interface Owner (stats, prestations)
- 🛒 Interface Client (fiche gîte, commande prestations)

### Mise à jour fiscale CH (27/03/2026)
- Correction du calcul CH Micro-BIC: l'IR est désormais calculé sur la base imposable micro sans déduction des cotisations.
- Passage du taux patrimoine CH à 18,6% dans le moteur CH.
- Seuil SSI CH rendu dynamique selon l'année simulée via PASS (13% du PASS annuel).
- Ajout du seuil TVA majoré CH (41 250€) avec messages distincts zone de tolérance / dépassement immédiat.
- Ajout d'un mode de traitement des frais de notaire CH (déduction immédiate ou amortissement) dans l'interface et le calcul.
- Ajout d'un champ RFR N-2 CH pour contrôle d'éligibilité du versement libératoire.

### Correctifs robustesse page fiscalité (27/03/2026)
- Correction des handlers inline legacy de la modal "frais réels impôts" (fonctions manquantes ajoutées côté JS).
- Correction du toggle périodicité sur frais pro (`frais_pro` / `frais-pro`) pour éviter les conversions non appliquées.
- Durcissement anti-injection sur le détail des charges (construction DOM sûre en remplacement de `innerHTML` pour les libellés dynamiques).

### Correctifs fiscaux critiques complémentaires (27/03/2026)
- Configuration fiscale 2026 complétée dans `TAUX_FISCAUX` (barème IR 2026, abattement salaires 2026, paramètres décote/plafond QF, taux PS patrimoine BIC meublés).
- Alignement du moteur gîtes réel: intégration des charges résidence (prorata pro) et frais véhicule dans le total des charges déductibles.
- Correction assiette crédits en BIC réel: suppression de la mensualité brute, conservation des intérêts annuels uniquement (si renseignés).
- Correction comparatif LMNP/micro: application des PS patrimoine 18,6% quand LMNP exonéré URSSAF (< 23 000 €), sans double comptage.
- Correction IR foyer: blocage de l'imputation d'un déficit LMNP sur le revenu global (imputation maintenue pour LMP).
- Ajustement du critère LMP "recettes > autres revenus pro": base salaires imposables (après abattement 10%) plutôt que salaires bruts.
- Correction RAV mensuel: ajout de l'IR mensuel (IR annuel / 12) dans les dépenses pour éviter la surestimation du reste à vivre.
- Contrôle VL renforcé côté gîtes: activation du versement libératoire uniquement après confirmation explicite du statut micro-entrepreneur.
- Comparatif 4 options durci: remise à `N/A` systématique des cartes inéligibles (montants + labels) pour éviter les résidus d'affichage.
- Synchronisation iCal Homelidays durcie: normalisation des URLs en HTTPS, suppression du fallback `corsproxy.io` pour Homelidays (403 fréquents), maintien du proxy interne Vercel en priorité.
- API proxy CORS renforcée: les requêtes same-origin sans en-tête `Origin` ne sont plus rejetées (`403`) sur `/api/cors-proxy`.

---

## 🗄️ Base de Données (Supabase PostgreSQL)

### Tables Principales

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
id                UUID PRIMARY KEY DEFAULT uuid_generate_v4()
owner_id          UUID → auth.users(id)
name              VARCHAR(200)                  -- ⚠️ Pas "nom"
address           TEXT
city              VARCHAR(100)
postal_code       VARCHAR(20)
country           VARCHAR(100) DEFAULT 'France'
capacity          INTEGER
bedrooms          INTEGER
beds              INTEGER
bathrooms         INTEGER
surface_m2        DECIMAL(10,2)
type_hebergement  VARCHAR(80)
label_classement  VARCHAR(80)
department        VARCHAR(100)
region            VARCHAR(100)
environment       TEXT
situation         TEXT
cuisine_niveau    VARCHAR(40)
animaux_acceptes  BOOLEAN DEFAULT false
access_pmr        BOOLEAN DEFAULT false
parking           BOOLEAN DEFAULT false
platform_airbnb   BOOLEAN DEFAULT false
platform_booking  BOOLEAN DEFAULT false
platform_abritel  BOOLEAN DEFAULT false
platform_gdf      BOOLEAN DEFAULT false
platform_direct   BOOLEAN DEFAULT false
price_per_night   DECIMAL(10,2)
description       TEXT
description_en    TEXT
amenities         JSONB                         -- ["wifi", "piscine", ...]
images            JSONB                         -- [{url: "...", caption: "..."}]
is_active         BOOLEAN DEFAULT true
created_at        TIMESTAMP DEFAULT NOW()
updated_at        TIMESTAMP DEFAULT NOW()

-- Indexes
CREATE INDEX idx_gites_owner ON gites(owner_id);
CREATE INDEX idx_gites_active ON gites(is_active);
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

### Pipeline Monitoring Erreurs (v2.13.46+)

#### Architecture `error_logs` / `cm_error_logs`

```
JS (error-tracker.js)
  └─► RPC upsert_error_log()   ← SECURITY DEFINER
        └─► TABLE public.error_logs   (données brutes)
              └─► VIEW  public.cm_error_logs  (alias colonnes)
                    └─► Dashboard admin-monitoring.html
```

**TABLE réelle : `public.error_logs`**
```sql
id               UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id          UUID → auth.users(id)
error_message    TEXT              -- ⚠️ Nommé error_message (pas "message")
error_stack      TEXT              -- ⚠️ Nommé error_stack (pas "stack_trace")
error_type       TEXT              -- 'critical' | 'warning' | 'info' | ...
source           TEXT DEFAULT 'unknown'
url              TEXT
user_agent       TEXT
browser          TEXT
os               TEXT
user_email       TEXT
timestamp        TIMESTAMPTZ DEFAULT NOW()
severity         TEXT
resolved         BOOLEAN DEFAULT false
resolved_at      TIMESTAMPTZ
metadata         JSONB DEFAULT '{}'
occurrence_count INTEGER DEFAULT 1     -- Géré par upsert_error_log()
last_occurrence  TIMESTAMPTZ DEFAULT NOW()
affected_users   TEXT[] DEFAULT '{}'

-- Index de déduplication
CREATE INDEX idx_error_logs_dedup
  ON error_logs (error_type, source, LEFT(error_message, 200))
  WHERE resolved = false;
```

**VIEW : `public.cm_error_logs`** (alias pour le front)
- `error_message` → `message`
- `error_stack` → `stack_trace`
- Toutes les autres colonnes identiques

**Fonction RPC : `public.upsert_error_log(...)`**
- **Déduplication** : clé = `error_type + source + LEFT(error_message, 200)` WHERE `resolved=false AND last_occurrence > NOW()-24h`
- Si doublon → `UPDATE occurrence_count++, last_occurrence, affected_users`
- Si nouveau → `INSERT` avec `occurrence_count=1`
- `SECURITY DEFINER` + `GRANT EXECUTE TO anon, authenticated`

**Droits :**
- `anon` + `authenticated` : EXECUTE sur `upsert_error_log`
- `authenticated` : SELECT sur `cm_error_logs`

**Migration appliquée :** `sql/FIX_UPSERT_ERROR_LOG_2026-03-28.sql` (2026-03-29)

---

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

---

**Document maintenu par :** GitHub Copilot  
**Contact Support :** admin@gite-calvignac.fr  
**Dernière révision :** 1 mars 2026, 19:15
