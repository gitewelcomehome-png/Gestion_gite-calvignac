# 📊 SUIVI SCALABILITÉ 0-100 000 UTILISATEURS
## LiveOwnerUnit - Architecture & Optimisations Techniques

**Version :** 2.0  
**Date création :** 14 février 2026  
**Cible :** 100 000 utilisateurs actifs MAX  
**Architecture :** Supabase PostgreSQL (AUCUNE REFONTE nécessaire)

---

## 🎯 PRINCIPE DE BASE

**Votre architecture actuelle (Supabase + PostgreSQL + RLS) tient jusqu'à 100 000 users SANS REFONTE.**

Ce qui change :
- ✅ Optimisations SQL progressives (~15h total)
- ✅ Ajout cache Redis (~5h)
- ✅ Monitoring (~5h)
- ✅ Payer l'infrastructure plus cher (passage Supabase Pro → Team → Enterprise)

**Total développement : ~30h max étalées sur la croissance**

---

## 📊 VUE D'ENSEMBLE TECHNIQUE

| Palier | Users | Infra Supabase | Coût/mois | Action principale | Temps |
|--------|-------|----------------|-----------|-------------------|-------|
| **0-50** | 0-50 | Free | 0 € | Aucune | 0h |
| **1** | 50-200 | Free | 0 € | Indexes SQL | 30min |
| **2** | 200-500 | Pro | 25 € | Pagination + Cache navigateur | 2h |
| **3** | 500-2k | Pro | 25 € | Optimisations requêtes | 3h |
| **4** | 2k-5k | Team | 699 € | Redis cache + CDN | 6h |
| **5** | 5k-20k | Team | 699 € | Database tuning | 8h |
| **6** | 20k-50k | Enterprise | ~3k € | Read replicas + Queue | 10h |
| **7** | 50k-100k | Enterprise | ~5k € | Connection pooling + Monitoring avancé | 5h |

**Total temps développement : ~35h étalées sur toute la croissance**
**Aucune refonte : même codebase de 0 à 100k users**

---

## ✅ CE QUI NE CHANGE PAS

- ✅ Architecture Supabase PostgreSQL (tient des millions de rows)
- ✅ RLS (Row Level Security) pour isolation données
- ✅ Frontend HTML/JS actuel
- ✅ Structure de code
- ✅ Tables SQL actuelles

**Ce qui change = juste des optimisations + puissance infra**

---

## 🟢 PALIER 0 : 0-50 UTILISATEURS

### Statut : ☐ Non atteint | ☐ En cours | ☐ Complété

### 📊 Infrastructure Actuelle
- **Hébergement** : Vercel Free (frontend statique)
- **Base de données** : Supabase Free (500 MB, 500k requests)
- **CDN** : Aucun
- **Cache** : Aucun
- **Monitoring** : Aucun

### 💰 Coûts
- **Total** : 0 €/mois
- **Limites Supabase Free** :
  - 500 MB storage
  - 500 000 API requests/mois
  - 50 connections simultanées
  - 1 GB bandwidth

### 📊 Métriques à Surveiller

| Métrique | Valeur Actuelle | Seuil Alerte | Fréquence |
|----------|----------------|--------------|-----------|
| Users actifs | ___ | > 40 | Hebdo |
| Storage (MB) | ___ | > 400 | Hebdo |
| API req/mois | ___ | > 400k | Hebdo |
| Temps chargement | ___ | > 3s | Hebdo |
| Erreurs console | ___ | > 0 | Quotidien |

### ✅ TODO Liste

**Aucune action requise.**

Concentrez-vous sur :
- ✅ Acquisition clients
- ✅ Feedback utilisateurs
- ✅ Corrections bugs
- ✅ Fonctionnalités métier

---

## 🟢 PALIER 1 : 50-100 UTILISATEURS

### Statut : ☐ Non atteint | ☐ En cours | ☐ Complété

### 📊 Métriques Critiques

| Métrique | Seuil Alerte | Action |
|----------|--------------|--------|
| Storage | > 200 MB | ⚠️ Préparer Palier 3 |
| API requests | > 250k/mois | ⚠️ Optimiser requêtes |
| Temps chargement | > 5s | 🔴 TODO #1 urgent |

### ✅ TODO Liste (20 min total)

#### ☐ TODO #1 : Créer Indexes SQL (10 min) - HAUTE PRIORITÉ

**Fichier** : Supabase SQL Editor

```sql
-- ============================================
-- INDEXES CRITIQUES PALIER 1
-- Exécuter dans Supabase Dashboard > SQL Editor
-- ============================================

-- Réservations (requêtes fréquentes)
CREATE INDEX IF NOT EXISTS idx_reservations_owner_dates 
ON reservations(owner_user_id, date_debut DESC, date_fin);

CREATE INDEX IF NOT EXISTS idx_reservations_gite_dates 
ON reservations(gite_id, date_debut, date_fin);

-- Recherche full-text noms clients
CREATE INDEX IF NOT EXISTS idx_reservations_client_nom 
ON reservations USING gin(to_tsvector('french', client_nom));

-- Fiches clients (accès par token)
CREATE INDEX IF NOT EXISTS idx_fiches_token 
ON client_access_tokens(token);

-- Statistiques par plateforme
CREATE INDEX IF NOT EXISTS idx_reservations_plateforme 
ON reservations(plateforme);

-- Planning ménage
CREATE INDEX IF NOT EXISTS idx_cleaning_gite_date 
ON cleaning_schedule(gite_id, date DESC);

-- Notifications non lues
CREATE INDEX IF NOT EXISTS idx_notifications_user_read 
ON notifications(user_id, is_read, created_at DESC);

-- Activités par gîte
CREATE INDEX IF NOT EXISTS idx_activites_gite 
ON activites(gite_id);

-- Vérifier création
SELECT schemaname, tablename, indexname 
FROM pg_indexes 
WHERE schemaname = 'public' 
AND indexname LIKE 'idx_%'
ORDER BY tablename;
```

**Vérification** : 8 indexes créés ✅  
**Impact** : Requêtes 5-10x plus rapides

---

#### ☐ TODO #2 : Setup Monitoring UptimeRobot (20 min)

**Service** : https://uptimerobot.com (gratuit 50 monitors)

**Étapes** :
1. Créer compte gratuit
2. Add New Monitor :
   - **Type** : HTTP(S)
   - **URL** : https://votredomaine.com/
   - **Interval** : 5 minutes
   - **Alert Contacts** : Email + SMS
3. Add Monitor #2 (API Health) :
   - **URL** : https://votreapi.supabase.co/rest/v1/
   - **Interval** : 10 minutes
4. Configurer alertes :
   - Down > 5 min → Email
   - Temps réponse > 10s → Email
5. Test "Fake Down Alert"

**Vérification** : Recevoir email test ✅

---

#### ☐ TODO #3 : Documenter Procédure Backup (10 min)

**Créer fichier** : `docs/PROCEDURE_BACKUP.md`

```markdown
# Procédure Backup Hebdomadaire

## Fréquence
Tous les **dimanches 23h00**

## Responsable
[Nom : _______________]

## Étapes

### 1. Export Base de Données
1. Supabase Dashboard → Database
2. Backups → Create Backup
3. Wait completion (5-10 min)
4. Download backup (format .sql)

### 2. Stockage
- Google Drive : `/Backups/LiveOwnerUnit/YYYY-MM-DD.sql`
- Dropbox : `/Backups/YYYY-MM-DD.sql`
- Serveur FTP : (si applicable)

### 3. Rétention
- **Quotidiens** : 7 jours
- **Hebdomadaires** : 1 mois
- **Mensuels** : 12 mois
- **Annuels** : Indéfini

### 4. Vérification
- Taille fichier > 0
- Date correcte
- Test restauration (1x/mois)

## Logs
| Date | Taille | Stockage | Testé | OK |
|------|--------|----------|-------|-----|
| ___  | ___    | ✅       | ☐     | ☐   |
```

**Vérification** : 1er backup effectué ✅

---

## 🟡 PALIER 2 : 100-200 UTILISATEURS

### Statut : ☐ Non atteint | ☐ En cours | ☐ Complété

### 📊 Métriques Critiques

| Métrique | Seuil CRITIQUE | Action |
|----------|----------------|--------|
| Storage | > 450 MB | 🔴 Migrer Palier 3 |
| API requests | > 450k/mois | 🔴 Migrer Palier 3 |
| Temps chargement | > 5s | 🔴 TODO #4 |

### ✅ TODO Liste (1h15 total)

#### ☐ TODO #4 : Pagination Onglet Réservations (45 min) - CRITIQUE

**Fichier** : `js/tab-reservations.js`

**Code actuel (environ ligne 50)** :
```javascript
const { data: reservations } = await supabase
    .from('reservations')
    .select('*')
    .eq('owner_user_id', user.id)
    .order('date_debut', { ascending: false });

displayReservations(reservations);
```

**Remplacer par** :
```javascript
// Configuration pagination
const ITEMS_PER_PAGE = 50;
let currentPage = 1;
let totalReservations = 0;

// Fonction chargement page
async function loadReservations(page = 1) {
    currentPage = page;
    const from = (page - 1) * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;

    // Loader
    showLoader('reservations-list');

    try {
        const { data: reservations, count, error } = await supabase
            .from('reservations')
            .select('*', { count: 'exact' })
            .eq('owner_user_id', user.id)
            .order('date_debut', { ascending: false })
            .range(from, to);

        if (error) throw error;

        totalReservations = count;
        displayReservations(reservations);
        renderPagination(page, Math.ceil(count / ITEMS_PER_PAGE));
    } catch (error) {
        console.error('Erreur chargement réservations:', error);
        showError('Impossible de charger les réservations');
    } finally {
        hideLoader('reservations-list');
    }
}

// Fonction rendu pagination
function renderPagination(currentPage, totalPages) {
    if (totalPages <= 1) {
        document.getElementById('pagination-reservations').innerHTML = '';
        return;
    }

    const maxVisible = 7;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);

    if (endPage - startPage < maxVisible - 1) {
        startPage = Math.max(1, endPage - maxVisible + 1);
    }

    let paginationHTML = '<div class="pagination">';
    
    // Bouton Première page
    if (currentPage > 1) {
        paginationHTML += `
            <button onclick="loadReservations(1)" class="pagination-btn first" title="Première page">
                <i class="lucide-chevrons-left"></i>
            </button>
        `;
    }

    // Bouton Précédent
    if (currentPage > 1) {
        paginationHTML += `
            <button onclick="loadReservations(${currentPage - 1})" class="pagination-btn prev">
                <i class="lucide-chevron-left"></i> Précédent
            </button>
        `;
    }

    // Numéros de page
    for (let i = startPage; i <= endPage; i++) {
        paginationHTML += `
            <button 
                onclick="loadReservations(${i})" 
                class="pagination-btn ${i === currentPage ? 'active' : ''}"
            >
                ${i}
            </button>
        `;
    }

    // Bouton Suivant
    if (currentPage < totalPages) {
        paginationHTML += `
            <button onclick="loadReservations(${currentPage + 1})" class="pagination-btn next">
                Suivant <i class="lucide-chevron-right"></i>
            </button>
        `;
    }

    // Bouton Dernière page
    if (currentPage < totalPages) {
        paginationHTML += `
            <button onclick="loadReservations(${totalPages})" class="pagination-btn last" title="Dernière page">
                <i class="lucide-chevrons-right"></i>
            </button>
        `;
    }

    paginationHTML += `
        <span class="pagination-info">
            ${(currentPage - 1) * ITEMS_PER_PAGE + 1}-${Math.min(currentPage * ITEMS_PER_PAGE, totalReservations)} 
            sur ${totalReservations}
        </span>
    </div>`;

    document.getElementById('pagination-reservations').innerHTML = paginationHTML;
    lucide.createIcons(); // Recharger icônes
}

// Helper loaders
function showLoader(elementId) {
    const el = document.getElementById(elementId);
    if (el) el.innerHTML = '<div class="loader">Chargement...</div>';
}

function hideLoader(elementId) {
    // Géré par displayReservations
}

// Au chargement initial
loadReservations(1);
```

**Ajouter dans `index.html` (onglet Réservations)** :
```html
<div id="reservations-list"></div>
<div id="pagination-reservations"></div>
```

**Ajouter dans `css/main.css`** :
```css
/* Pagination */
.pagination {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    margin: 20px 0;
    flex-wrap: wrap;
}

.pagination-btn {
    padding: 8px 12px;
    border: 1px solid var(--border-color);
    background: var(--bg-secondary);
    color: var(--text-primary);
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    gap: 4px;
}

.pagination-btn:hover {
    background: var(--primary-color);
    color: white;
    border-color: var(--primary-color);
}

.pagination-btn.active {
    background: var(--primary-color);
    color: white;
    border-color: var(--primary-color);
    font-weight: 600;
}

.pagination-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.pagination-info {
    font-size: 14px;
    color: var(--text-secondary);
    margin-left: 12px;
}

.loader {
    text-align: center;
    padding: 40px;
    color: var(--text-secondary);
}
```

**Vérification** : Afficher compte avec 100+ réservations → Max 50 affichées ✅

---

#### ☐ TODO #5 : Pagination Onglet Statistiques (30 min)

**Fichier** : `js/tab-statistiques.js`

Appliquer **même principe que TODO #4** sur :
- Liste des réservations dans graphiques
- Tableau des revenus mensuels (si > 50 lignes)

---

#### ☐ TODO #6 : Pagination Onglet Fiches Clients (30 min)

**Fichier** : `js/tab-fiches-clients.js`

Appliquer **même principe que TODO #4** sur :
- Liste des fiches générées
- Demandes horaires
- Retours clients

---

#### ☐ TODO #7 : Service Worker Cache (20 min) - OPTIONNEL

**Créer fichier** : `service-worker.js` (racine)

```javascript
const CACHE_NAME = 'liveownerunit-v5.1';
const ASSETS = [
    '/',
    '/index.html',
    '/css/main.css',
    '/css/themes.css',
    '/js/app.js',
    '/js/auth.js',
    '/images/logo.png'
];

// Installation
self.addEventListener('install', (event) => {
    console.log('[SW] Installation...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[SW] Cache ouvert');
                return cache.addAll(ASSETS);
            })
            .then(() => self.skipWaiting())
    );
});

// Activation
self.addEventListener('activate', (event) => {
    console.log('[SW] Activation...');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cache => {
                    if (cache !== CACHE_NAME) {
                        console.log('[SW] Suppression ancien cache:', cache);
                        return caches.delete(cache);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch Strategy
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Ignorer requêtes Supabase (toujours network)
    if (url.hostname.includes('supabase')) {
        event.respondWith(fetch(event.request));
        return;
    }

    // Ignorer requêtes Chrome extensions
    if (url.protocol === 'chrome-extension:') {
        return;
    }

    // Cache First pour assets statiques
    if (event.request.destination === 'style' || 
        event.request.destination === 'script' || 
        event.request.destination === 'image') {
        event.respondWith(
            caches.match(event.request)
                .then(cached => cached || fetch(event.request)
                    .then(response => {
                        const clone = response.clone();
                        caches.open(CACHE_NAME).then(cache => {
                            cache.put(event.request, clone);
                        });
                        return response;
                    })
                )
        );
        return;
    }

    // Network First pour HTML
    event.respondWith(
        fetch(event.request)
            .catch(() => caches.match(event.request))
    );
});
```

**Dans `index.html` (avant `</body>`)** :
```html
<script>
// Enregistrement Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then(reg => console.log('[SW] Enregistré:', reg.scope))
            .catch(err => console.error('[SW] Erreur:', err));
    });
}
</script>
```

**Vérification** : DevTools → Application → Service Workers → État "activated" ✅

---

#### ☐ TODO #8 : Sync iCal Décalées (15 min) - OPTIONNEL

**Créer fichier** : `js/sync-staggered.js`

```javascript
/**
 * Synchronisation iCal décalée par utilisateur
 * Évite les pics de charge toutes les 2h
 */

function getUserSyncSlot(userId) {
    // Hash simple du user_id
    const hash = userId.split('').reduce((acc, char) => {
        return acc + char.charCodeAt(0);
    }, 0);
    
    // Slot entre 0-120 minutes (2h)
    const slotMinutes = hash % 120;
    
    return slotMinutes;
}

function getNextSyncTime(userId) {
    const slotMinutes = getUserSyncSlot(userId);
    const now = new Date();
    
    // Prochaine heure pair (00h, 02h, 04h, etc.)
    const nextEvenHour = Math.ceil(now.getHours() / 2) * 2;
    const nextSync = new Date(now);
    nextSync.setHours(nextEvenHour);
    nextSync.setMinutes(slotMinutes);
    nextSync.setSeconds(0);
    
    // Si dans le passé, ajouter 2h
    if (nextSync < now) {
        nextSync.setHours(nextSync.getHours() + 2);
    }
    
    return nextSync;
}

async function scheduleSync(userId) {
    const nextSync = getNextSyncTime(userId);
    const delay = nextSync - new Date();
    
    console.log(`[Sync] Prochaine sync dans ${Math.round(delay / 1000 / 60)} min à ${nextSync.toLocaleTimeString()}`);
    
    setTimeout(async () => {
        console.log('[Sync] Démarrage sync iCal...');
        await syncAllGites(userId);
        scheduleSync(userId); // Re-scheduler
    }, delay);
}

// Démarrage au chargement
if (typeof currentUser !== 'undefined' && currentUser) {
    scheduleSync(currentUser.id);
}
```

**Importer dans `index.html`** :
```html
<script src="js/sync-staggered.js"></script>
```

**Vérification** : Logs console montrent slots différents pour users différents ✅

---

## 🟡 PALIER 3 : 200-500 UTILISATEURS

### Statut : ☐ Non atteint | ☐ En cours | ☐ Complété

### 🚨 ALERTE : MIGRATION INFRASTRUCTURE OBLIGATOIRE

### 💰 Coûts
- **Supabase Pro** : $25/mois (25 €)
- **Total** : 25 €/mois

**Nouvelles limites** :
- 8 GB storage (+16x)
- 5M API requests (+10x)
- 500 GB bandwidth
- 200 connections simultanées

### 📊 Métriques Critiques

| Métrique | Seuil CRITIQUE | Action |
|----------|----------------|--------|
| Storage | > 7 GB | 🔴 Palier 5 |
| API requests | > 4.5M | 🔴 Palier 5 |
| DB CPU | > 70% | 🔴 TODO #12 |

### ✅ TODO Liste (2h total)

#### ☐ TODO #9 : Migrer Supabase Pro (20 min) - **OBLIGATOIRE**

**Quand** : 
- 200 utilisateurs OU
- Storage > 450 MB OU
- API requests > 450k/mois

**Étapes** :
1. Supabase Dashboard → Settings → Billing
2. **Upgrade to Pro** ($25/mois)
3. Confirmer paiement (CB)
4. Attendre migration (5-10 min)
5. Vérifier nouvelles limites :
   ```
   Dashboard → Usage :
   - Database size: X / 8 GB
   - API requests: X / 5M
   - Bandwidth: X / 500 GB
   ```
6. **Test complet de l'application** (30 min)
   - Login
   - Charger chaque onglet
   - Créer/modifier réservation
   - Sync iCal
   - Générer fiche client
7. Surveillance 48h

**Vérification** : Badge "Pro" dans dashboard + Tests OK ✅

---

#### ☐ TODO #10 : Analyser Requêtes Lentes (45 min)

**Outils** : Supabase Query Performance

**Étapes** :
1. Dashboard → Database → Query Performance
2. Trier par "Avg Execution Time" (DESC)
3. Identifier requêtes > 1000ms
4. Pour chaque requête lente :
   - Copier le SQL
   - Analyser avec EXPLAIN ANALYZE
   - Ajouter index si manquant
   - Optimiser SELECT (éviter SELECT *)

**Exemple** :
```sql
-- Requête lente identifiée
EXPLAIN ANALYZE
SELECT * FROM reservations 
WHERE owner_user_id = 'xxx' 
AND date_debut >= '2026-01-01'
ORDER BY date_debut DESC;

-- Si "Seq Scan" affiché → Ajouter index
CREATE INDEX idx_reservations_owner_date_debut 
ON reservations(owner_user_id, date_debut DESC);

-- Re-tester
EXPLAIN ANALYZE
SELECT * FROM reservations 
WHERE owner_user_id = 'xxx' 
AND date_debut >= '2026-01-01'
ORDER BY date_debut DESC;
-- Doit afficher "Index Scan"
```

**Vérification** : Aucune requête > 500ms ✅

---

#### ☐ TODO #11 : Alertes Supabase (10 min)

**Étapes** :
1. Dashboard → Settings → Notifications
2. Activer alertes :
   - [ ] Database size > 75% (6 GB)
   - [ ] API requests > 80% (4M)
   - [ ] Database CPU > 70%
   - [ ] Active connections > 80% (160)
3. Email : votre@email.com
4. **Webhook Slack** (optionnel) :
   - Créer webhook dans Slack
   - Coller URL dans Supabase
5. Tester : Simuler seuil dépassé

**Vérification** : Recevoir email de test ✅

---

#### ☐ TODO #12 : Refactoriser `infos_gites` (1h30) - OPTIONNEL

**Problème** : Table avec 119 colonnes = performances dégradées

**Solution** : Éclater en 5 tables relationnelles

**⚠️ BACKUP OBLIGATOIRE avant cette migration !**

```sql
-- ============================================
-- REFACTORISATION infos_gites
-- ATTENTION : Migration complexe, tester sur staging
-- ============================================

-- 1. Nouvelles tables
CREATE TABLE gites_base (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_user_id UUID NOT NULL REFERENCES auth.users(id),
    nom VARCHAR(255) NOT NULL,
    adresse TEXT NOT NULL,
    ville VARCHAR(100),
    code_postal VARCHAR(10),
    pays VARCHAR(50) DEFAULT 'France',
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    capacite_personnes INT,
    nombre_chambres INT,
    photo_url TEXT,
    couleur_calendrier VARCHAR(7) DEFAULT '#3b82f6',
    actif BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE gites_wifi (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gite_id UUID NOT NULL REFERENCES gites_base(id) ON DELETE CASCADE,
    ssid VARCHAR(255),
    password VARCHAR(255),
    qr_code_url TEXT,
    debit_approximatif VARCHAR(50),
    localisation_box TEXT,
    zones_bonne_reception TEXT
);

CREATE TABLE gites_consignes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gite_id UUID NOT NULL REFERENCES gites_base(id) ON DELETE CASCADE,
    langue VARCHAR(5) DEFAULT 'fr',
    
    -- Arrivée
    heure_arrivee TIME DEFAULT '16:00',
    code_acces TEXT,
    emplacement_cles TEXT,
    instructions_parking TEXT,
    acces_handicape BOOLEAN DEFAULT false,
    instructions_arrivee_fr TEXT,
    instructions_arrivee_en TEXT,
    
    -- Pendant le séjour
    consignes_chauffage_fr TEXT,
    consignes_chauffage_en TEXT,
    consignes_cuisine_fr TEXT,
    consignes_cuisine_en TEXT,
    consignes_tv_fr TEXT,
    consignes_tv_en TEXT,
    consignes_machine_laver_fr TEXT,
    consignes_machine_laver_en TEXT,
    consignes_piscine_fr TEXT,
    consignes_piscine_en TEXT,
    consignes_poubelles_fr TEXT,
    consignes_poubelles_en TEXT,
    animaux_acceptes BOOLEAN DEFAULT false,
    animaux_supplement DECIMAL(10,2),
    
    -- Sortie
    heure_depart TIME DEFAULT '10:00',
    checklist_sortie_fr TEXT,
    checklist_sortie_en TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE gites_contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gite_id UUID NOT NULL REFERENCES gites_base(id) ON DELETE CASCADE,
    telephone_urgence VARCHAR(20),
    email_contact VARCHAR(255),
    telephone_proprietaire VARCHAR(20),
    telephone_samu VARCHAR(20) DEFAULT '15',
    telephone_pompiers VARCHAR(20) DEFAULT '18',
    telephone_police VARCHAR(20) DEFAULT '17',
    medecin_local VARCHAR(100),
    telephone_medecin VARCHAR(20),
    pharmacie_garde VARCHAR(100),
    plombier_urgence VARCHAR(100),
    telephone_plombier VARCHAR(20),
    electricien_urgence VARCHAR(100),
    telephone_electricien VARCHAR(20)
);

CREATE TABLE gites_equipements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gite_id UUID NOT NULL REFERENCES gites_base(id) ON DELETE CASCADE,
    -- Cuisine
    type_machine_cafe VARCHAR(50),
    a_lave_vaisselle BOOLEAN DEFAULT false,
    a_four BOOLEAN DEFAULT true,
    a_micro_ondes BOOLEAN DEFAULT true,
    type_plaques VARCHAR(50),
    -- TV/Internet
    a_tv BOOLEAN DEFAULT true,
    netflix BOOLEAN DEFAULT false,
    netflix_login VARCHAR(255),
    amazon_prime BOOLEAN DEFAULT false,
    disney_plus BOOLEAN DEFAULT false,
    -- Électroménager
    a_machine_laver BOOLEAN DEFAULT false,
    a_seche_linge BOOLEAN DEFAULT false,
    -- Extérieur
    a_barbecue BOOLEAN DEFAULT false,
    a_piscine BOOLEAN DEFAULT false,
    piscine_chauffee BOOLEAN DEFAULT false,
    a_spa BOOLEAN DEFAULT false,
    a_cheminee BOOLEAN DEFAULT false
);

-- 2. Indexes
CREATE INDEX idx_gites_base_owner ON gites_base(owner_user_id);
CREATE INDEX idx_gites_wifi_gite ON gites_wifi(gite_id);
CREATE INDEX idx_gites_consignes_gite ON gites_consignes(gite_id);
CREATE INDEX idx_gites_contacts_gite ON gites_contacts(gite_id);
CREATE INDEX idx_gites_equipements_gite ON gites_equipements(gite_id);

-- 3. RLS (Row Level Security)
ALTER TABLE gites_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE gites_wifi ENABLE ROW LEVEL SECURITY;
ALTER TABLE gites_consignes ENABLE ROW LEVEL SECURITY;
ALTER TABLE gites_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE gites_equipements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own gites" ON gites_base
    FOR ALL USING (owner_user_id = auth.uid());

CREATE POLICY "Users manage gites_wifi" ON gites_wifi
    FOR ALL USING (
        gite_id IN (SELECT id FROM gites_base WHERE owner_user_id = auth.uid())
    );

CREATE POLICY "Users manage gites_consignes" ON gites_consignes
    FOR ALL USING (
        gite_id IN (SELECT id FROM gites_base WHERE owner_user_id = auth.uid())
    );

CREATE POLICY "Users manage gites_contacts" ON gites_contacts
    FOR ALL USING (
        gite_id IN (SELECT id FROM gites_base WHERE owner_user_id = auth.uid())
    );

CREATE POLICY "Users manage gites_equipements" ON gites_equipements
    FOR ALL USING (
        gite_id IN (SELECT id FROM gites_base WHERE owner_user_id = auth.uid())
    );

-- 4. Migration données (À ADAPTER selon votre structure actuelle)
INSERT INTO gites_base (id, owner_user_id, nom, adresse, ville, code_postal, latitude, longitude)
SELECT id, owner_user_id, nom, adresse, ville, code_postal, latitude, longitude
FROM infos_gites;

INSERT INTO gites_wifi (gite_id, ssid, password, qr_code_url)
SELECT id, wifi_ssid, wifi_password, wifi_qr_code
FROM infos_gites;

-- ... etc pour les autres tables

-- 5. Supprimer ancienne table (APRÈS VALIDATION COMPLÈTE)
-- DROP TABLE infos_gites CASCADE;
```

**Vérification** : 
- Toutes les données migrées ✅
- Application fonctionne ✅
- Requêtes 3x plus rapides ✅

---

#### ☐ TODO #13 : Tests de Charge Manuels (20 min)

**Quand** : 300 utilisateurs atteints

**Outils** : Navigateur + 20 comptes tests

**Procédure** :
1. Créer 20 comptes tests
2. Ouvrir 20 onglets (ou 4 navigateurs × 5 onglets)
3. Se connecter simultanément
4. Chaque onglet effectue :
   - Charger dashboard
   - Naviguer vers Réservations
   - Créer 1 réservation
   - Charger Statistiques
   - Générer fiche client
5. **Surveiller** :
   - Temps réponse (< 5s ?)
   - Erreurs console
   - Erreurs Supabase
   - CPU/RAM navigateur

**Résultats attendus** :
- [ ] Aucune erreur
- [ ] Temps réponse < 5s
- [ ] Pas de crash

**Vérification** : Test load réussi ✅

---

#### ☐ TODO #14 : Documentation API Interne (30 min)

**Créer** : `docs/API_INTERNAL.md`

```markdown
# Documentation API Interne

## Supabase Endpoints

### Authentification
- **Login** : `.auth.signInWithPassword()`
- **Logout** : `.auth.signOut()`
- **Session** : `.auth.getSession()`

### Réservations
- **Liste** : `.from('reservations').select('*').eq('owner_user_id', uid)`
- **Créer** : `.from('reservations').insert([data])`
- **Modifier** : `.from('reservations').update(data).eq('id', id)`
- **Supprimer** : `.from('reservations').delete().eq('id', id)`

### Rate Limits
- **100 requêtes/minute/user** (RLS côté Supabase)
- **5M requêtes/mois** (plan Pro)

### Gestion Erreurs
Toutes les requêtes doivent catcher les erreurs :
\`\`\`javascript
const { data, error } = await supabase.from('table').select();
if (error) {
    console.error('Erreur:', error.message);
    showNotification('Une erreur est survenue', 'error');
    return null;
}
\`\`\`

## Endpoints Externes

### iCal Sync
- **Airbnb** : `https://www.airbnb.fr/calendar/ical/[ID].ics`
- **Booking** : `https://admin.booking.com/hotel/hoteladmin/ical.html`

### APIs Tierces
- **Geocoding** : OpenStreetMap Nominatim
- **Météo** : OpenWeatherMap (gratuit 1000 req/jour)
```

---

#### ☐ TODO #15 : Plan de Rollback (20 min)

**Créer** : `docs/ROLLBACK_PROCEDURE.md`

```markdown
# Procédure de Rollback

## Cas d'Usage
- Bug critique en production
- Migration base de données échouée
- Perte de données

## Étapes Rollback BDD

### 1. Restauration depuis Backup
1. Supabase Dashboard → Database → Backups
2. Sélectionner backup (date/heure)
3. Cliquer "Restore"
4. Confirmer (⚠️ écrase BDD actuelle)
5. Attendre 10-30 min selon taille

### 2. Vérification
- [ ] Compter nombre de users
- [ ] Compter réservations
- [ ] Tester login
- [ ] Tester création réservation

## Rollback Code

### 1. Git Revert
\`\`\`bash
# Identifier commit problématique
git log --oneline -10

# Revenir au commit précédent
git revert [COMMIT_HASH]
git push origin main
\`\`\`

### 2. Redéploiement
- Vercel redéploie automatiquement après push
- Vérifier déploiement réussi dans Vercel Dashboard

## Communication Utilisateurs
Template email :
\`\`\`
Objet : [LiveOwnerUnit] Maintenance urgente terminée

Bonjour,

Suite à un problème technique détecté à [HEURE], nous avons effectué une maintenance urgente.

Votre compte et vos données sont intacts.

Certaines actions effectuées entre [HEURE_DEBUT] et [HEURE_FIN] ont pu être perdues.
Si vous constatez des données manquantes, contactez le support.

Merci de votre compréhension.
L'équipe LiveOwnerUnit
\`\`\`
```

---

## 🟠 PALIER 4 : 500-1000 UTILISATEURS

### Statut : ☐ Non atteint | ☐ En cours | ☐ Complété

### 💰 Coûts
- **Supabase Pro** : 25 €
- **Cloudflare Pro** : 20 €
- **Total** : 45 €/mois

### ✅ TODO Liste (3h30 total)

#### ☐ TODO #16 : Nettoyer Base de Données (45 min)

**Script SQL** :
```sql
-- Archiver réservations > 3 ans
CREATE TABLE IF NOT EXISTS reservations_archive AS
SELECT * FROM reservations 
WHERE date_fin < NOW() - INTERVAL '3 years';

DELETE FROM reservations 
WHERE date_fin < NOW() - INTERVAL '3 years';

-- Supprimer notifications lues > 6 mois
DELETE FROM notifications 
WHERE is_read = true 
AND created_at < NOW() - INTERVAL '6 months';

-- Supprimer logs sync > 1 an
DELETE FROM sync_logs 
WHERE created_at < NOW() - INTERVAL '1 year';

-- Vacuum
VACUUM ANALYZE reservations;
VACUUM ANALYZE notifications;
VACUUM ANALYZE sync_logs;
```

---

#### ☐ TODO #17 : Cache Redis (1h)

**Service** : Upstash Redis (gratuit 10k req/jour)

**Inscription** : https://upstash.com

```javascript
// js/cache-redis.js
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: 'https://YOUR-REGION.upstash.io',
  token: 'YOUR_TOKEN'
});

const CACHE_TTL = {
    stats: 3600,        // 1h
    fiscal: 3600,       // 1h
    reservations: 300,  // 5min
    gites: 1800         // 30min
};

class CacheManager {
    async get(key) {
        try {
            const data = await redis.get(key);
            if (data) {
                console.log(`[Cache] HIT: ${key}`);
                return JSON.parse(data);
            }
            console.log(`[Cache] MISS: ${key}`);
            return null;
        } catch (error) {
            console.error('[Cache] Erreur get:', error);
            return null;
        }
    }

    async set(key, value, ttl = 3600) {
        try {
            await redis.setex(key, ttl, JSON.stringify(value));
            console.log(`[Cache] SET: ${key} (TTL: ${ttl}s)`);
        } catch (error) {
            console.error('[Cache] Erreur set:', error);
        }
    }

    async invalidate(pattern) {
        try {
            const keys = await redis.keys(pattern);
            if (keys.length > 0) {
                await redis.del(...keys);
                console.log(`[Cache] INVALIDATE: ${keys.length} clés`);
            }
        } catch (error) {
            console.error('[Cache] Erreur invalidate:', error);
        }
    }

    // Helper pour réservations
    async getReservations(userId, page = 1) {
        const key = `reservations:${userId}:page:${page}`;
        return await this.get(key);
    }

    async setReservations(userId, page, data) {
        const key = `reservations:${userId}:page:${page}`;
        await this.set(key, data, CACHE_TTL.reservations);
    }

    async invalidateReservations(userId) {
        await this.invalidate(`reservations:${userId}:*`);
    }

    // Helper pour stats
    async getStats(userId, year) {
        const key = `stats:${userId}:${year}`;
        return await this.get(key);
    }

    async setStats(userId, year, data) {
        const key = `stats:${userId}:${year}`;
        await this.set(key, data, CACHE_TTL.stats);
    }
}

const cache = new CacheManager();
export default cache;
```

**Utilisation dans `tab-reservations.js`** :
```javascript
import cache from './cache-redis.js';

async function loadReservations(page = 1) {
    // Essayer cache d'abord
    let reservations = await cache.getReservations(currentUser.id, page);
    
    if (!reservations) {
        // Cache miss → Requête Supabase
        const { data, error } = await supabase
            .from('reservations')
            .select('*')
            .eq('owner_user_id', currentUser.id)
            .range(from, to);
        
        if (!error) {
            reservations = data;
            // Stocker en cache
            await cache.setReservations(currentUser.id, page, data);
        }
    }
    
    displayReservations(reservations);
}

// Invalider cache lors de création/modif
async function createReservation(data) {
    const { error } = await supabase
        .from('reservations')
        .insert([data]);
    
    if (!error) {
        // Invalider cache
        await cache.invalidateReservations(currentUser.id);
        loadReservations(1);
    }
}
```

**Vérification** : Console montre "Cache HIT" après 2e chargement ✅

---

#### ☐ TODO #18 : CDN Cloudflare (45 min)

**Étapes** :
1. Créer compte https://cloudflare.com
2. Ajouter domaine
3. Changer serveurs DNS (chez registrar)
4. Attendre propagation (1h-24h)
5. Cloudflare Dashboard → Règles :
   - **Cache Everything** pour `/css/*`, `/js/*`, `/images/*`
   - TTL : 7 jours
6. Activer :
   - [x] Auto Minify (CSS, JS, HTML)
   - [x] Brotli
   - [x] HTTP/2
   - [x] Early Hints
7. Upgrade Pro ($20/mois) pour :
   - Polish (compression images)
   - Mirage (lazy load images)
   - Mobile Redirect

**Vérification** : PageSpeed Insights → Score +20 points ✅

---

#### ☐ TODO #19 : Monitoring Sentry (20 min)

```bash
npm install @sentry/browser
```

```javascript
// js/sentry-init.js
import * as Sentry from "@sentry/browser";

Sentry.init({
  dsn: "https://YOUR_DSN@o123456.ingest.sentry.io/7654321",
  environment: "production",
  release: "liveownerunit@5.1.0",
  
  // Performance
  tracesSampleRate: 0.1,
  
  // Error filtering
  beforeSend(event, hint) {
    // Ignorer erreurs extensions Chrome
    if (event.exception) {
      const error = hint.originalException;
      if (error && error.message) {
        if (error.message.includes('chrome-extension://')) {
          return null;
        }
      }
    }
    return event;
  },
  
  // User context
  initialScope: {
    user: {
      id: currentUser?.id,
      email: currentUser?.email
    }
  }
});

// Helper pour erreurs custom
export function captureError(error, context = {}) {
    Sentry.captureException(error, {
        contexts: { custom: context }
    });
}
```

**Vérification** : Sentry Dashboard affiche erreurs en temps réel ✅

---

#### ☐ TODO #20-25 : Optimisations Avancées

- TODO #20 : Lazy loading images (20 min)
- TODO #21 : Preload fonts (10 min)
- TODO #22 : Code splitting JavaScript (45 min)
- TODO #23 : Database connection pooling (30 min)
- TODO #24 : Compression Gzip/Brotli (10 min)
- TODO #25 : WebP images conversion (45 min)

---

## 🔴 PALIER 5 : 1000-2000 UTILISATEURS

### Statut : ☐ Non atteint | ☐ En cours | ☐ Complété

### 🚨 MIGRATION SUPABASE TEAM OBLIGATOIRE

### 💰 Coûts
- **Supabase Team** : $599/mois (599 €)
- **Cloudflare Pro** : 20 €
- **Upstash Redis Pro** : 60 €
- **Sentry Business** : 20 €
- **Total** : 699 €/mois

**Nouvelles limites Supabase Team** :
- 100 GB storage
- 50M API requests
- Priority support 24/7
- Dedicated resources

### ✅ TODO Liste (6h30 total)

#### ☐ TODO #26 : Migrer Supabase Team (45 min) - **OBLIGATOIRE**

**Quand** : 1000 users OU Storage > 7 GB

**Étapes** :
1. Contact Supabase Sales
2. Devis personnalisé
3. Migration planifiée (avec support)
4. Maintenance window (2h dimanche 2h-4h)
5. Tests complets
6. Surveillance 72h

---

#### ☐ TODO #27-40 : Architecture Entreprise

**À ce stade, embaucher un DevOps/Architect est recommandé.**

Optimisations requises :
- Database read replicas
- Load balancer multi-région
- Queue système (Redis/RabbitMQ)
- Monitoring avancé (Datadog)
- CI/CD pipelines
- Tests automatisés
- Infrastructure as Code (Terraform)

**Budget DevOps** : 5000-8000 €/mois

---

## 🔵 PALIER 6 : 2000-5000 UTILISATEURS

### Statut : ☐ Non atteint | ☐ En cours | ☐ Complété

### 💰 Coûts : ~900 €/mois
### ⏱️ Temps : ~18h (optimisations avancées)

### 📊 Revenus Attendus
- **2000 users × 30€/mois = 60 000 €/mois**
- Coûts infra (900€) = **1.5% du CA**
- **Vous pouvez embaucher** un DevOps à 6000€/mois

### ✅ TODO Liste (9h)

#### ☐ TODO #27 : Database Read Replicas (3h)
**Service** : Supabase Team (inclus dans l'offre)

Activer les réplicas en lecture pour :
- Statistiques lourdes
- Exports CSV
- Rapports fiscaux

---

#### ☐ TODO #28 : Queue Système Redis (4h)
**Pour** : Sync iCal asynchrone (traiter 5000 users en background)

```javascript
// js/queue-worker.js
import { Queue, Worker } from 'bullmq';
import Redis from 'ioredis';

const connection = new Redis({
  host: 'upstash.redis.io',
  port: 6379,
  password: 'YOUR_PASSWORD'
});

const syncQueue = new Queue('ical-sync', { connection });

// Ajouter job
async function scheduleSyncForUser(userId, giteId) {
  await syncQueue.add('sync', {
    userId,
    giteId,
    timestamp: Date.now()
  }, {
    delay: getUserSyncDelay(userId), // Décalage
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 }
  });
}

// Worker
const worker = new Worker('ical-sync', async job => {
  const { userId, giteId } = job.data;
  await syncGiteIcal(userId, giteId);
}, { connection });
```

---

#### ☐ TODO #29 : Monitoring Avancé Datadog (2h)
**Coût** : ~150€/mois (Infrastructure monitoring)

**Setup** :
```bash
# Installation agent
npm install dd-trace
```

```javascript
// js/datadog-init.js
import tracer from 'dd-trace';

tracer.init({
  service: 'liveownerunit',
  env: 'production',
  version: '5.1.0',
  runtimeMetrics: true,
  profiling: true
});

// Métriques custom
const { dogstatsd } = tracer;

// Track réservations
dogstatsd.increment('reservations.created', 1, ['gite:id123']);

// Track temps sync
const start = Date.now();
await syncIcal();
dogstatsd.histogram('sync.duration', Date.now() - start);
```

---

#### ☐ TODO #30-35 : Optimisations Diverses (9h)
- TODO #30 : Compression images WebP (2h)
- TODO #31 : Lazy loading composants (2h)
- TODO #32 : Database vacuum automatique (1h)
- TODO #33 : Logs rotation (1h)
- TODO #34 : SSL/TLS optimization (1h)
- TODO #35 : DB connection pooling (2h)

---

## 🟣 PALIER 7 : 5000-10 000 UTILISATEURS

### Statut : ☐ Non atteint | ☐ En cours | ☐ Complété

### 💰 Coûts : ~1500 €/mois
### ⏱️ Temps : ~10h (config multi-région)

### 📊 Revenus Attendus
- **5000 users × 30€ = 150 000 €/mois**
- **🎯 Embaucher OBLIGATOIRE** : 1 DevOps Senior (7-8k€/mois)

### ✅ TODO Liste (5h - Avec DevOps)

#### ☐ TODO #36 : Multi-Région Supabase (3h)
**Setup** : Database replicas EU + US

1. Supabase Dashboard → Settings → Database
2. Enable Read Replicas (2 régions : EU-West, US-East)
3. Configurer routing intelligent :
   - Utilisateurs EU → Replica EU
   - Utilisateurs US → Replica US
4. Tests latence (doit être < 100ms en local)

---

#### ☐ TODO #37 : CDN Advanced Cloudflare (2h)
**Upgrade** : Cloudflare Business ($200/mois)

Features :
- WAF (Web Application Firewall)
- Advanced DDoS protection
- Prioritized support
- 100% uptime SLA

---

#### ☐ TODO #38 : CI/CD Pipeline (3h)
**Tools** : GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run tests
        run: npm test
      
  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Vercel
        run: vercel --prod --token ${{ secrets.VERCEL_TOKEN }}
```

---

#### ☐ TODO #39 : Monitoring Uptime (1h)
**Setup** : StatusPage.io (communication pannes)

Créer page publique : status.votredomaine.com

---

#### ☐ TODO #40 : Load Testing k6 (1h)
**Tests** : Simuler 10k users simultanés

```javascript
// test-load.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 100 },   // Warm up
    { duration: '5m', target: 1000 },  // Ramp up
    { duration: '10m', target: 10000 }, // Peak
    { duration: '3m', target: 0 },     // Cool down
  ],
};

export default function () {
  const res = http.get('https://votredomaine.com/api/reservations');
  check(res, { 'status is 200': (r) => r.status === 200 });
  sleep(1);
}
```

---

## 🚨 PALIERS 8-10 : 10 000 - 70 000 UTILISATEURS

### 💰 Revenus : 300k-2M €/mois
### 👥 Équipe : 3-10 personnes

### ⚠️ AU-DELÀ DE 10 000 USERS : EMBAUCHE ÉQUIPE OBLIGATOIRE

À ce stade, vous n'êtes plus en mode "startup solo" mais **entreprise établie**.

**⚡ IMPORTANT : Les paliers 8-10 = REFONTE ARCHITECTURALE COMPLÈTE**

Ce n'est pas "quelques optimisations", c'est :
- ❌ Réécrire l'application en microservices
- ❌ Kubernetes (orchestration containers)
- ❌ Sharding de la base de données
- ❌ Load balancing multi-région
- ❌ Monitoring enterprise (Grafana/Prometheus)

**= Autant de travail que le site initial (300-400h)**

→ **Embaucher devient la SEULE option viable** (vous avez 300k€+/mois de CA)

### 🏢 Équipe Technique Recommandée

**Budget mensuel : 15-40k€/mois**

1. **CTO / Lead Dev** (10-15k€/mois)
   - Architecture système
   - Décisions techniques
   - Management équipe

2. **DevOps / SRE** (7-10k€/mois)
   - Infrastructure multi-région
   - Monitoring 24/7
   - Incidents management

3. **Backend Developer** (6-8k€/mois)
   - Optimisations BDD
   - APIs performance
   - Microservices

4. **Frontend Developer** (5-7k€/mois) - Optionnel
   - UX/UI optimization
   - Performance web
   - PWA avancé

### 📋 TODO Paliers 8-10 (À Déléguer)

**Ces tâches nécessitent une expertise DevOps senior :**

- ☐ Architecture microservices (Kubernetes)
- ☐ Load balancing multi-région (AWS ELB/CloudFront)
- ☐ Database sharding (PostgreSQL partitioning)
- ☐ Cache distribué (Redis Cluster)
- ☐ Message queue (RabbitMQ/Kafka)
- ☐ Observability (Grafana/Prometheus/Loki)
- ☐ Continuous deployment (ArgoCD)
- ☐ Auto-scaling (HPA Kubernetes)
- ☐ Disaster recovery (Multi-cloud backup)
- ☐ Security hardening (Penetration testing)
- ☐ Compliance (RGPD audit, SOC2)

### 🎯 Focus Fondateur (Vous)

À partir de 10k users, **votre rôle change** :

✅ **Product Management** : Roadmap, priorités features  
✅ **Business Development** : Partenariats, distribution  
✅ **Customer Success** : Relation grands comptes  
✅ **Fundraising** : Lever des fonds si croissance agressive  
✅ **Recrutement** : Bâtir l'équipe

❌ **Ne plus coder l'infra** : Vous n'avez plus le temps ni l'expertise niveau enterprise

### 💡 Recommandations

1. **À 2000 users** : Embaucher 1 DevOps freelance (2-3j/semaine)
2. **À 5000 users** : DevOps full-time + CTO technique
3. **À 10 000 users** : Équipe de 3-5 personnes
4. **À 25 000+ users** : Envisager levée de fonds (Série A)

### 📊 Exemples de Pricing pour financer l'équipe

**Avec 10 000 utilisateurs payants :**

| Plan | Prix/mois | Users | CA/mois | CA/an |
|------|-----------|-------|---------|-------|
| Solo | 25 € | 5000 | 125k € | 1.5M € |
| Pro | 50 € | 4000 | 200k € | 2.4M € |
| Team | 100 € | 1000 | 100k € | 1.2M € |
| **TOTAL** | - | 10000 | **425k €** | **5.1M €** |

**Coûts structure :**
- Équipe tech (4 pers) : 30k€/mois = 360k€/an
- Infra (Palier 8) : 3k€/mois = 36k€/an
- Bureaux/outils : 5k€/mois = 60k€/an
- **Total coûts** : 456k€/an

**Marge brute : 5.1M - 456k = 4.6M€/an (91% de marge)** 🚀

Vous avez largement les moyens d'embaucher !

---

## 📊 TABLEAU DE SUIVI MENSUEL

| Mois | Users | Storage (GB) | API Req (M) | Coûts € | Palier | Incidents | Notes |
|------|-------|--------------|-------------|---------|--------|-----------|-------|
| Jan26 | ___ | ___ | ___ | ___ | ___ | ___ | ___ |
| Fév26 | ___ | ___ | ___ | ___ | ___ | ___ | ___ |
| Mar26 | ___ | ___ | ___ | ___ | ___ | ___ | ___ |
| Avr26 | ___ | ___ | ___ | ___ | ___ | ___ | ___ |
| Mai26 | ___ | ___ | ___ | ___ | ___ | ___ | ___ |
| Jun26 | ___ | ___ | ___ | ___ | ___ | ___ | ___ |
| Jul26 | ___ | ___ | ___ | ___ | ___ | ___ | ___ |
| Aoû26 | ___ | ___ | ___ | ___ | ___ | ___ | ___ |
| Sep26 | ___ | ___ | ___ | ___ | ___ | ___ | ___ |
| Oct26 | ___ | ___ | ___ | ___ | ___ | ___ | ___ |
| Nov26 | ___ | ___ | ___ | ___ | ___ | ___ | ___ |
| Déc26 | ___ | ___ | ___ | ___ | ___ | ___ | ___ |

---

## 🎯 CHECKLIST RÉCAPITULATIVE

### Paliers 0-2 (Bootstrapping)
- [ ] TODO #1-3 : Indexes + Monitoring (40 min)
- [ ] TODO #4-8 : Pagination + Cache (2h30)

### Palier 3 (First Migration)
- [ ] TODO #9 : **Supabase Pro** (20 min) - 25 €/mois
- [ ] TODO #10-15 : Optimisations BDD (3h20)

### Palier 4 (Scale Up)
- [ ] TODO #16-19 : Nettoyage + Redis + CDN (2h50) - 45 €/mois
- [ ] TODO #20-25 : Performance avancée (2h40)

### Palier 5 (Scale)
- [ ] TODO #26 : **Supabase Team** (45 min) - 699 €/mois
- [ ] TODO #27-40 : Optimisations avancées (12h)

### Paliers 6-7 (Avec DevOps)
- [ ] TODO #27-35 : Database replicas, Queue, Monitoring (18h)
- [ ] TODO #36-40 : Multi-région, CI/CD, Load tests (10h)
- [ ] **Embaucher DevOps** (2000+ users = 60k€/mois CA)

### Paliers 8-10 (Équipe Tech)
- [ ] **Recruter équipe** : CTO + DevOps + Developers
- [ ] **Déléguer infrastructure** : Vous = Product/Business
- [ ] **Budget tech** : 30-40k€/mois largement financé par CA (300k+/mois)

---

## 🚨 SIGNAUX D'ALERTE CRITIQUES

### Migrer IMMÉDIATEMENT si :
- ❌ Temps réponse > 10s
- ❌ Storage > 95% du plan
- ❌ Erreurs > 50/jour
- ❌ Downtime > 30 min/mois
- ❌ DB CPU > 90% pendant > 5 min

### Contacter Expert si :
- ⚠️ Latence EU ↔ US > 500ms
- ⚠️ Coûts infra > 20% du CA
- ⚠️ > 100 000 users prévus dans 6 mois

---

## 📞 CONTACTS URGENCE

### Support Infrastructure
- **Supabase Support** : support@supabase.io (Pro/Team)
- **Cloudflare Support** : [Dashboard > Support]
- **Upstash Support** : support@upstash.com

### Experts Externes
- **DevOps Freelance** : [À définir]
- **Architect Cloud** : [À définir]
- **DBA PostgreSQL** : [À définir]

### Escalade
1. Tenter résolution (1h)
2. Vérifier docs/KB (30 min)
3. Contacter support (< 4h réponse)
4. Escalade expert externe (dernier recours)

---

## 💰 BUDGET PRÉVISIONNEL 3 ANS

### Année 1 (0-2000 users)
- **Mois 1-6** : 0 € (Free tier)
- **Mois 7-12** : 25 €/mois (Supabase Pro)
- **Total An 1** : 150 €

### Année 2 (2000-15 000 users)
- **Q1** : 45 €/mois (Pro + CDN)
- **Q2-Q4** : 699 €/mois (Team)
- **Total An 2** : 6426 €

### Année 3 (15 000-70 000 users)
- **Infra** : 3000-5000 €/mois
- **Équipe tech** (4 pers) : 30 000 €/mois
- **Outils/SaaS** : 2000 €/mois
- **Total An 3** : ~420 000 €

**Total 3 ans** : ~426 600 €

**Mais revenus attendus An 3** : 5-10M€ (10k-20k users payants)  
**→ Marge confortable pour scale et recruter** 🚀

---

## 🎓 RESSOURCES & FORMATION

### Documentation Technique
- **PostgreSQL Performance** : https://wiki.postgresql.org/wiki/Performance_Optimization
- **Supabase Scaling** : https://supabase.com/docs/guides/platform/going-into-prod
- **Redis Best Practices** : https://redis.io/docs/manual/patterns/

### Formations Recommandées
- **AWS Solutions Architect** (si multi-cloud)
- **Kubernetes Administrator** (si K8s)
- **PostgreSQL DBA** (si > 10k users)

### Livres
- "Designing Data-Intensive Applications" (Martin Kleppmann)
- "Site Reliability Engineering" (Google)
- "The Phoenix Project" (DevOps)

---

## 📝 NOTES PERSONNELLES

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  Observations, blocages, décisions :                        │
│                                                             │
│  _________________________________________________________  │
│  _________________________________________________________  │
│  _________________________________________________________  │
│  _________________________________________________________  │
│  _________________________________________________________  │
│  _________________________________________________________  │
│  _________________________________________________________  │
│  _________________________________________________________  │
│  _________________________________________________________  │
│  _________________________________________________________  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

**Document créé le :** 13 février 2026  
**Palier actuel :** _________  
**Prochaine révision :** Mensuelle  
**Responsable technique :** _________

---

## 🎉 CONCLUSION

Ce document vous accompagne de 0 à 70 000 utilisateurs sur 24-36 mois.

### Règles d'Or

1. **Ne pas anticiper** : Optimisez uniquement le palier actuel
2. **Mesurer toujours** : Décisions basées sur métriques réelles
3. **Documenter tout** : Chaque changement doit être tracé
4. **SauveEmbaucher

| Users | CA mensuel | Action |
|-------|------------|--------|
| **0-1000** | 0-30k€ | Seul (docs suffisent) |
| **1000-2000** | 30-60k€ | Freelance DevOps 2j/semaine |
| **2000-5000** | 60-150k€ | DevOps full-time (7k€) |
| **5000-10k** | 150-300k€ | CTO + DevOps (15k€) |
| **10k+** | 300k€+ | Équipe 4-10 pers (30-60k€) |

### 💡 Rappel Important

**Vous avez développé ce site complet en 2-3 mois.**

Avec cette vitesse d'exécution :
- ✅ Paliers 1-5 seul : **~15h total** jusqu'à 2000 users
- ✅ Paliers 6-7 avec aide : **~15h** jusqu'à 10k users
- ✅ **Total : 30h max**
- ✅ Au-delà : **Déléguer** (vous avez les moyens)

**Ne sous-estimez pas votre capacité, mais n'hésitez pas à embaucher quand le CA le permet !**

🚀 **Bon scaling ! Consultant ponctuel (audit)
- **Palier 6+** : Embauche DevOps/Architect

**Bon scaling ! 🚀**
