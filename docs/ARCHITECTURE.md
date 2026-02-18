# 🏗️ Architecture - Gestion Gîte Calvignac

**Version :** 2.13.5  
**Dernière MAJ :** 18 février 2026  
**Environnement :** Production (Supabase + Vercel)

---

## ⚡ Quick Start

```bash
# 1. Créer les tables BDD
psql $DATABASE_URL < sql/create_prestations_simple.sql

# 2. Insérer données test (éditer UUIDs lignes 20-21)
psql $DATABASE_URL < sql/insert_test_data_prestations.sql

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

### Authentification

- **Admin** : Supabase Auth (email + password)
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
SUPPORT_AI_RATE_LIMIT_MAX=25
SUPPORT_AI_RATE_LIMIT_WINDOW_MS=600000
SUPPORT_AI_IP_HASH_SALT=change-me
SUPPORT_AI_ALERT_ERROR_RATE_1H_PCT=8
SUPPORT_AI_ALERT_COST_24H_EUR=12
SUPPORT_AI_ALERT_LATENCY_1H_MS=5000
SUPPORT_AI_ALERT_CONSECUTIVE_ERRORS_1H=5
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
- `/api/ai-health?section=support` : KPI/alertes monitoring support IA pour dashboard admin
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
psql $DATABASE_URL < sql/create_prestations_simple.sql

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
| `/sql/create_prestations_simple.sql` | ✅ **PRODUCTION** - Schema complet prestations |
| `/sql/insert_test_data_prestations.sql` | 🧪 **TEST** - Données test avec UUIDs |
| `/sql/check-cancelled-status.sql` | Vérifier réservations annulées |

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

### v2.13.6 - 18 février 2026 🧠
- ✅ Copilote support N1 renforcé pour incidents (réponses opérationnelles non vagues)
- ✅ Enregistrement progressif des réponses type depuis `pages/admin-support.html` (bouton "Enregistrer réponse type")
- ✅ Réutilisation prioritaire des réponses type dans les suggestions copilote (BDD `cm_support_solutions` + fallback local)
- ✅ Tickets support clôturés masqués de la liste active et purge automatique après 7 jours (`js/admin-support.js`)

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
**Dernière révision :** 15 février 2026, 23:50
