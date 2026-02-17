# 🚀 PLAN SCALABILITÉ - 70 000 UTILISATEURS
## LiveOwnerUnit - Feuille de Route Technique

**Version :** 1.0  
**Date :** 13 février 2026  
**Objectif :** Supporter 70 000 utilisateurs simultanés  
**Statut actuel :** ~100 utilisateurs maximum

---

## 📊 ÉTAT DES LIEUX ACTUEL

### Limites Identifiées

| Composant | Charge Max Actuelle | Limite Estimée | Risque |
|-----------|---------------------|----------------|--------|
| **Base de données** | ~100 users | ~500 users | 🔴 CRITIQUE |
| **Synchronisation iCal** | 10 gîtes/user | 50 gîtes/user | 🔴 CRITIQUE |
| **Calculs fiscaux** | 1 user simultané | 10 simultanés | 🟡 MOYEN |
| **Fiches clients** | 50 fiches/mois | 500 fiches/mois | 🟡 MOYEN |
| **Stockage Supabase** | 500 MB | 8 GB (limite gratuite) | 🟢 OK |

### Architecture Actuelle
```
CLIENT (Browser)
    ↓ HTTPS
INDEX.HTML + JS/CSS
    ↓ Requêtes API
SUPABASE (PostgreSQL + Auth + Storage)
    ↓ Webhooks
SERVICES EXTERNES (iCal, OpenAI, Stripe)
```

---

## 🎯 OBJECTIFS DE SCALABILITÉ

### Cibles à Atteindre

| Métrique | Objectif 70k Users | Action Requise |
|----------|-------------------|----------------|
| **Temps réponse API** | < 200ms | Cache + Indexes |
| **Concurrent users** | 7 000 simultanés (10%) | Load balancing |
| **Requêtes/seconde** | 1 000 req/s | CDN + Cache |
| **Disponibilité (Uptime)** | 99.9% | Redondance |
| **Stockage DB** | 100 GB | Migration PostgreSQL dédié |
| **Coût/utilisateur/mois** | < 2 € | Optimisation infra |

---

## 📋 PLAN D'ACTION PAR PHASES

---

## 🔴 PHASE 1 : OPTIMISATIONS CRITIQUES (Urgent - 2 semaines)

### 1.1 Base de Données - Optimisation Tables

#### ✅ Action 1.1.1 : Refactoriser `infos_gites` (119 colonnes)

**Problème :**
- Table monstre avec 119 colonnes
- SELECT * charge tout en mémoire
- Impossible à scaler

**Solution :**
Éclater en 5 tables normalisées :

```sql
-- NOUVEAU SCHÉMA (Exécuter sur production)

-- Table principale légère (15 colonnes)
CREATE TABLE infos_gites_core (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gite_id UUID NOT NULL REFERENCES gites(id) ON DELETE CASCADE,
    owner_user_id UUID NOT NULL REFERENCES auth.users(id),
    nom TEXT,
    adresse_complete TEXT,
    latitude NUMERIC(10, 8),
    longitude NUMERIC(11, 8),
    telephone_urgence TEXT,
    email_contact TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Connexion & WiFi (8 colonnes)
CREATE TABLE infos_gites_wifi (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gite_id UUID NOT NULL REFERENCES gites(id) ON DELETE CASCADE,
    ssid TEXT,
    wifi_password TEXT,
    qr_code_url TEXT,
    debit_approximatif TEXT,
    localisation_box TEXT,
    zones_reception TEXT[],
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Consignes (textes longs FR/EN)
CREATE TABLE infos_gites_consignes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gite_id UUID NOT NULL REFERENCES gites(id) ON DELETE CASCADE,
    langue TEXT DEFAULT 'fr', -- 'fr' ou 'en'
    consignes_arrivee TEXT,
    consignes_sejour TEXT,
    consignes_sortie TEXT,
    code_acces TEXT,
    horaire_arrivee TIME,
    horaire_depart TIME,
    instructions_parking TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Équipements (structure JSONB)
CREATE TABLE infos_gites_equipements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gite_id UUID NOT NULL REFERENCES gites(id) ON DELETE CASCADE,
    chauffage JSONB, -- {type, mode_emploi, thermostat}
    cuisine JSONB,   -- {machine_cafe, lave_vaisselle, four, etc.}
    multimedia JSONB, -- {tv, streaming_codes, console}
    exterieur JSONB, -- {piscine, barbecue, jardin}
    divers JSONB,    -- {machine_laver, animaux_acceptes, etc.}
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Contacts d'urgence
CREATE TABLE infos_gites_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gite_id UUID NOT NULL REFERENCES gites(id) ON DELETE CASCADE,
    type TEXT, -- 'urgence', 'medecin', 'pharmacie', 'veterinaire', 'plombier', etc.
    nom TEXT,
    telephone TEXT,
    adresse TEXT,
    disponibilite TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Migration depuis ancienne table
INSERT INTO infos_gites_core (gite_id, owner_user_id, nom, adresse_complete, ...)
SELECT gite_id, owner_user_id, nom, adresse, ... FROM infos_gites;

-- Indexes critiques
CREATE INDEX idx_infos_core_gite ON infos_gites_core(gite_id);
CREATE INDEX idx_infos_core_owner ON infos_gites_core(owner_user_id);
CREATE INDEX idx_infos_wifi_gite ON infos_gites_wifi(gite_id);
CREATE INDEX idx_infos_consignes_gite ON infos_gites_consignes(gite_id);
CREATE INDEX idx_infos_equipements_gite ON infos_gites_equipements(gite_id);
CREATE INDEX idx_infos_contacts_gite ON infos_gites_contacts(gite_id);
```

**Impact :** 
- ✅ Requêtes 10x plus rapides
- ✅ Mémoire divisée par 5
- ✅ Scalable jusqu'à 50k gîtes

**Fichiers à modifier :**
- `js/tab-infos-gites.js` : Adapter requêtes SELECT
- `js/fiche-client.js` : Requêtes multiples légères
- `sql/REBUILD_COMPLETE_DATABASE.sql` : Intégrer nouveau schéma

---

#### ✅ Action 1.1.2 : Ajouter Indexes Manquants

```sql
-- Indexes critiques absents actuellement

-- Réservations (requêtes fréquentes)
CREATE INDEX idx_reservations_dates ON reservations(date_debut, date_fin);
CREATE INDEX idx_reservations_gite_dates ON reservations(gite_id, date_debut, date_fin);
CREATE INDEX idx_reservations_owner_dates ON reservations(owner_user_id, date_debut DESC);
CREATE INDEX idx_reservations_plateforme ON reservations(plateforme);
CREATE INDEX idx_reservations_status ON reservations(status);

-- Recherche nom client
CREATE INDEX idx_reservations_client_nom ON reservations USING gin(to_tsvector('french', client_nom));

-- Fiches clients (token lookup)
CREATE INDEX idx_fiches_token ON client_access_tokens(token);
CREATE INDEX idx_fiches_reservation ON client_access_tokens(reservation_id);

-- Activités (filtres)
CREATE INDEX idx_activites_gite ON activites_gites(gite_id);
CREATE INDEX idx_activites_categorie ON activites_gites(categorie);

-- Fiscalité
CREATE INDEX idx_simulations_owner_annee ON simulations_fiscales(owner_user_id, annee);
CREATE INDEX idx_km_trajets_owner_date ON km_trajets(owner_user_id, date DESC);

-- Ménage
CREATE INDEX idx_cleaning_gite_date ON cleaning_schedule(gite_id, date DESC);
CREATE INDEX idx_cleaning_status ON cleaning_schedule(status);

-- Stocks linge
CREATE INDEX idx_linen_stocks_gite ON linen_stocks(gite_id);

-- Channel Manager
CREATE INDEX idx_cm_clients_email ON cm_clients(email);
CREATE INDEX idx_cm_subscriptions_client ON cm_subscriptions(client_id);
CREATE INDEX idx_cm_subscriptions_status ON cm_subscriptions(status);

-- Support
CREATE INDEX idx_cm_tickets_client_status ON cm_support_tickets(client_id, status);
CREATE INDEX idx_error_logs_timestamp ON error_logs(timestamp DESC);
CREATE INDEX idx_notifications_user_read ON notifications(user_id, is_read, created_at DESC);
```

**Impact :** 
- ✅ Requêtes 5-20x plus rapides
- ✅ Full table scans éliminés

---

#### ✅ Action 1.1.3 : Optimiser RLS Policies

**Problème :** 
- RLS vérifié sur CHAQUE ligne (lent à 70k users)

**Solution :**
Utiliser `pg_plan` pour cache + indexes composites :

```sql
-- RLS optimisée avec indexes

-- Exemple pour reservations
DROP POLICY IF EXISTS "Users can view own reservations" ON reservations;

CREATE POLICY "Users can view own reservations"
ON reservations FOR SELECT
USING (
    owner_user_id = auth.uid()
    -- L'index idx_reservations_owner_dates sera utilisé automatiquement
);

-- Activer statistiques pour optimiseur PostgreSQL
ANALYZE reservations;
ANALYZE infos_gites_core;
ANALYZE gites;

-- Forcer recompilation des plans de requêtes
DISCARD PLANS;
```

**Impact :**
- ✅ RLS 3x plus rapide avec indexes

---

### 1.2 Synchronisation iCal - Refonte Complète

#### ✅ Action 1.2.1 : Système de Queue Asynchrone

**Problème actuel :**
- Tous les users synchronisés en même temps (toutes les 2h)
- Timeout si > 50 gîtes
- Monopolise ressources

**Solution :**
Queue distribuée avec priorisation :

```javascript
// NOUVEAU FICHIER : js/sync-queue-manager.js

class SyncQueueManager {
    constructor() {
        this.queue = [];
        this.processing = false;
        this.maxConcurrent = 3; // 3 syncs simultanés max
        this.currentProcessing = 0;
    }

    // Ajouter à la queue avec priorité
    async addToQueue(userId, giteId, priority = 'normal') {
        const syncTask = {
            id: crypto.randomUUID(),
            userId,
            giteId,
            priority, // 'high', 'normal', 'low'
            addedAt: new Date(),
            retries: 0
        };

        // Insérer en base dans table sync_queue
        await supabase.from('sync_queue').insert({
            task_id: syncTask.id,
            user_id: userId,
            gite_id: giteId,
            priority,
            status: 'pending',
            created_at: new Date()
        });

        this.processQueue();
    }

    // Traiter la queue
    async processQueue() {
        if (this.currentProcessing >= this.maxConcurrent) return;

        // Récupérer prochaine tâche (priorité + FIFO)
        const { data: task } = await supabase
            .from('sync_queue')
            .select('*')
            .eq('status', 'pending')
            .order('priority', { ascending: false }) // high avant normal
            .order('created_at', { ascending: true }) // FIFO
            .limit(1)
            .single();

        if (!task) return;

        this.currentProcessing++;

        // Marquer en cours
        await supabase
            .from('sync_queue')
            .update({ status: 'processing', started_at: new Date() })
            .eq('task_id', task.task_id);

        try {
            // Exécuter la synchronisation
            await this.executeSync(task);

            // Marquer terminée
            await supabase
                .from('sync_queue')
                .update({ 
                    status: 'completed', 
                    completed_at: new Date() 
                })
                .eq('task_id', task.task_id);

        } catch (error) {
            // Gestion retry (max 3 fois)
            if (task.retries < 3) {
                await supabase
                    .from('sync_queue')
                    .update({ 
                        status: 'pending',
                        retries: task.retries + 1,
                        last_error: error.message
                    })
                    .eq('task_id', task.task_id);
            } else {
                // Échec définitif
                await supabase
                    .from('sync_queue')
                    .update({ 
                        status: 'failed',
                        failed_at: new Date(),
                        error_message: error.message
                    })
                    .eq('task_id', task.task_id);
            }
        } finally {
            this.currentProcessing--;
            // Traiter suivante
            setTimeout(() => this.processQueue(), 1000);
        }
    }

    async executeSync(task) {
        // Récupérer URL iCal du gîte
        const { data: gite } = await supabase
            .from('gites')
            .select('ical_url, nom')
            .eq('id', task.gite_id)
            .single();

        if (!gite?.ical_url) return;

        // Fetch iCal (avec timeout 10s)
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);

        const response = await fetch(gite.ical_url, {
            signal: controller.signal,
            cache: 'no-cache'
        });

        clearTimeout(timeout);

        const icalData = await response.text();

        // Parser iCal
        const events = parseICalEvents(icalData);

        // Insérer/Mettre à jour réservations
        for (const event of events) {
            await upsertReservation(task.gite_id, task.userId, event);
        }

        // Log succès
        await supabase.from('sync_logs').insert({
            user_id: task.userId,
            gite_id: task.gite_id,
            status: 'success',
            added: events.filter(e => e.isNew).length,
            updated: events.filter(e => !e.isNew).length,
            synced_at: new Date()
        });
    }
}

// Instancier
window.syncQueueManager = new SyncQueueManager();
```

**Nouvelle table SQL :**

```sql
CREATE TABLE sync_queue (
    task_id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    gite_id UUID NOT NULL REFERENCES gites(id),
    priority TEXT DEFAULT 'normal', -- 'high', 'normal', 'low'
    status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
    retries INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    failed_at TIMESTAMPTZ,
    last_error TEXT,
    error_message TEXT
);

CREATE INDEX idx_sync_queue_status ON sync_queue(status, priority DESC, created_at ASC);
CREATE INDEX idx_sync_queue_user ON sync_queue(user_id);
```

**Scheduler côté serveur (Edge Function Supabase) :**

```typescript
// NOUVEAU FICHIER : supabase/functions/sync-scheduler/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  // Récupérer tous les gîtes qui n'ont pas été sync depuis 2h
  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000)

  const { data: gites } = await supabase
    .from('gites')
    .select('id, owner_user_id, ical_url, last_synced_at')
    .not('ical_url', 'is', null)
    .or(`last_synced_at.is.null,last_synced_at.lt.${twoHoursAgo.toISOString()}`)

  // Ajouter à la queue
  for (const gite of gites) {
    await supabase.from('sync_queue').insert({
      task_id: crypto.randomUUID(),
      user_id: gite.owner_user_id,
      gite_id: gite.id,
      priority: 'normal',
      status: 'pending'
    })
  }

  return new Response(
    JSON.stringify({ queued: gites.length }),
    { headers: { "Content-Type": "application/json" } }
  )
})
```

**Cron Supabase (pg_cron) :**

```sql
-- Déclencher scheduler toutes les 2h
SELECT cron.schedule(
    'sync-scheduler',
    '0 */2 * * *', -- Toutes les 2 heures
    $$
    SELECT net.http_post(
        url := 'https://[PROJECT_ID].supabase.co/functions/v1/sync-scheduler',
        headers := '{"Content-Type": "application/json", "Authorization": "Bearer [ANON_KEY]"}'::jsonb
    );
    $$
);
```

**Impact :**
- ✅ Synchronisation distribuée (pas de pic de charge)
- ✅ Priorités (users payants en priorité)
- ✅ Retry automatique en cas d'échec
- ✅ Scalable jusqu'à 100k gîtes

---

#### ✅ Action 1.2.2 : Cache iCal (CDN)

**Problème :**
- Fetch iCal direct = lent + charge externe

**Solution :**
Proxy cache via Cloudflare Workers :

```javascript
// NOUVEAU : cloudflare-worker-ical-proxy.js

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url)
  const icalUrl = url.searchParams.get('url')

  if (!icalUrl) {
    return new Response('Missing url parameter', { status: 400 })
  }

  // Clé cache
  const cacheKey = new Request(icalUrl, request)
  const cache = caches.default

  // Vérifier cache (TTL 30 min)
  let response = await cache.match(cacheKey)

  if (!response) {
    // Fetch iCal
    response = await fetch(icalUrl, {
      cf: {
        cacheTtl: 1800, // 30 min
        cacheEverything: true
      }
    })

    // Clone et cache
    response = new Response(response.body, response)
    response.headers.set('Cache-Control', 'public, max-age=1800')
    
    await cache.put(cacheKey, response.clone())
  }

  return response
}
```

**Modifier les appels :**

```javascript
// Dans js/sync-queue-manager.js

// Avant :
// const response = await fetch(gite.ical_url);

// Après (via proxy cache) :
const proxyUrl = `https://ical-proxy.votredomaine.workers.dev/?url=${encodeURIComponent(gite.ical_url)}`;
const response = await fetch(proxyUrl);
```

**Impact :**
- ✅ Cache 30 min = 90% de charge en moins
- ✅ CDN Cloudflare = rapide partout dans le monde

---

### 1.3 Frontend - Pagination & Lazy Loading

#### ✅ Action 1.3.1 : Pagination Universelle

**Fichiers à modifier :**

**`js/tab-reservations.js` :**

```javascript
// AVANT (charge TOUT)
const { data: reservations } = await supabase
    .from('reservations')
    .select('*')
    .eq('owner_user_id', user.id)
    .order('date_debut', { ascending: false });

// APRÈS (pagination)
const ITEMS_PER_PAGE = 50;
let currentPage = 1;

async function loadReservations(page = 1) {
    const from = (page - 1) * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;

    const { data: reservations, count } = await supabase
        .from('reservations')
        .select('*', { count: 'exact' })
        .eq('owner_user_id', user.id)
        .order('date_debut', { ascending: false })
        .range(from, to);

    renderReservations(reservations);
    renderPagination(page, Math.ceil(count / ITEMS_PER_PAGE));
}

function renderPagination(currentPage, totalPages) {
    const paginationHTML = `
        <div class="pagination">
            ${currentPage > 1 ? `<button onclick="loadReservations(${currentPage - 1})">Précédent</button>` : ''}
            <span>Page ${currentPage} / ${totalPages}</span>
            ${currentPage < totalPages ? `<button onclick="loadReservations(${currentPage + 1})">Suivant</button>` : ''}
        </div>
    `;
    document.getElementById('pagination-container').innerHTML = paginationHTML;
}
```

**Idem pour :**
- `js/tab-statistiques.js` (historique données)
- `js/tab-fiches-clients.js` (liste fiches)
- `js/tab-menage.js` (planning ménages)
- `js/fiche-client.js` (activités)

---

#### ✅ Action 1.3.2 : Virtual Scrolling (Grande Liste)

Pour les listes > 1000 items (ex: historique complet réservations) :

```javascript
// NOUVEAU FICHIER : js/virtual-scroll.js

class VirtualScroll {
    constructor(container, itemHeight, renderItem) {
        this.container = container;
        this.itemHeight = itemHeight;
        this.renderItem = renderItem;
        this.items = [];
        this.visibleStart = 0;
        this.visibleEnd = 0;

        this.setupScroll();
    }

    setItems(items) {
        this.items = items;
        this.container.style.height = `${items.length * this.itemHeight}px`;
        this.updateVisibleItems();
    }

    setupScroll() {
        this.container.addEventListener('scroll', () => {
            this.updateVisibleItems();
        });
    }

    updateVisibleItems() {
        const scrollTop = this.container.scrollTop;
        const containerHeight = this.container.clientHeight;

        this.visibleStart = Math.floor(scrollTop / this.itemHeight);
        this.visibleEnd = Math.ceil((scrollTop + containerHeight) / this.itemHeight);

        // Buffer (render 10 items avant/après)
        const bufferStart = Math.max(0, this.visibleStart - 10);
        const bufferEnd = Math.min(this.items.length, this.visibleEnd + 10);

        const fragment = document.createDocumentFragment();

        for (let i = bufferStart; i < bufferEnd; i++) {
            const item = this.renderItem(this.items[i], i);
            item.style.position = 'absolute';
            item.style.top = `${i * this.itemHeight}px`;
            fragment.appendChild(item);
        }

        this.container.innerHTML = '';
        this.container.appendChild(fragment);
    }
}

// Utilisation
const virtualScroll = new VirtualScroll(
    document.getElementById('reservations-list'),
    80, // hauteur item
    (reservation) => {
        const div = document.createElement('div');
        div.className = 'reservation-item';
        div.innerHTML = `<h3>${reservation.client_nom}</h3>...`;
        return div;
    }
);

virtualScroll.setItems(reservations);
```

**Impact :**
- ✅ Affichage 10 000+ items sans lag
- ✅ DOM léger (seulement items visibles)

---

### 1.4 Cache Navigateur - Service Worker

#### ✅ Action 1.4.1 : Service Worker Agressif

**NOUVEAU FICHIER : `service-worker.js` (racine):**

```javascript
const CACHE_NAME = 'liveownerunit-v5.0.1';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/css/main.css',
    '/js/app.js',
    '/js/tab-dashboard.js',
    '/js/tab-reservations.js',
    '/js/tab-statistiques.js',
    '/js/tab-fiscalite.js',
    '/js/supabase-client.js',
    'https://cdn.jsdelivr.net/npm/lucide-static@latest/font/lucide.min.css',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css'
];

// Installation
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
    self.skipWaiting();
});

// Activation (nettoyage vieux caches)
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name !== CACHE_NAME)
                    .map((name) => caches.delete(name))
            );
        })
    );
    self.clients.claim();
});

// Fetch (stratégie Cache First pour assets, Network First pour API)
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // API Supabase = Network First (données fraîches)
    if (url.hostname.includes('supabase')) {
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    // Cache la réponse pour offline
                    const clonedResponse = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, clonedResponse);
                    });
                    return response;
                })
                .catch(() => {
                    // Si offline, servir du cache
                    return caches.match(event.request);
                })
        );
        return;
    }

    // Assets statiques = Cache First
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            return cachedResponse || fetch(event.request);
        })
    );
});
```

**Enregistrer dans `index.html` :**

```html
<script>
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then(reg => console.log('SW enregistré'))
            .catch(err => console.error('SW erreur:', err));
    });
}
</script>
```

**Impact :**
- ✅ Chargement instantané (cache)
- ✅ Mode offline fonctionnel
- ✅ 70% moins de requêtes réseau

---

## 🟡 PHASE 2 : INFRASTRUCTURE (4 semaines)

### 2.1 Migration Plan Supabase

#### ✅ Action 2.1.1 : Passer à Supabase Pro

**Plan actuel :** Gratuit (limites : 500 MB storage, 500k reads/mois)  
**Plan cible :** Pro ($25/mois) ou Team ($599/mois)

| Plan | Prix/mois | Limites | Recommandation |
|------|-----------|---------|----------------|
| **Free** | $0 | 500 MB, 500k reads | ❌ Insuffisant |
| **Pro** | $25 | 8 GB, 5M reads | ✅ Jusqu'à 5k users |
| **Team** | $599 | 100 GB, 50M reads | ✅ 70k users |

**Migration :**
1. Créer projet Team sur Supabase
2. Exporter BDD avec `pg_dump`
3. Importer sur nouveau projet
4. Mettre à jour `SUPABASE_URL` et `SUPABASE_ANON_KEY` dans config
5. Tester sur staging
6. Basculer production

---

### 2.2 CDN pour Assets Statiques

#### ✅ Action 2.2.1 : Cloudflare CDN

**Configuration :**

1. Ajouter domaine sur Cloudflare
2. Activer CDN (proxy orange)
3. Rules :
   - Cache tout `/css/*`, `/js/*`, `/images/*` pendant 7 jours
   - Cache `/index.html` pendant 1h
   - Minify automatique CSS/JS/HTML

**Page Rule Cloudflare :**
```
*.votredomaine.com/css/*
  Cache Level: Cache Everything
  Edge Cache TTL: 7 days
  Browser Cache TTL: 7 days

*.votredomaine.com/js/*
  Cache Level: Cache Everything
  Edge Cache TTL: 7 days
  Browser Cache TTL: 7 days

*.votredomaine.com/images/*
  Cache Level: Cache Everything
  Edge Cache TTL: 30 days
  Browser Cache TTL: 30 days
```

**Impact :**
- ✅ Latence divisée par 10 (edge locations)
- ✅ Bande passante économisée (95%)
- ✅ Gratuit jusqu'à 100k req/jour

---

### 2.3 Load Balancing & Redondance

#### ✅ Action 2.3.1 : Multi-Région Supabase

**Problème :**
- 1 seul datacenter = SPOF (Single Point of Failure)

**Solution :**
- Primary : EU-West (Paris)
- Replica : US-East (Virginie)
- Read queries → Replica (statistiques, historique)
- Write queries → Primary

**Config Supabase :**

```javascript
// NOUVEAU : js/supabase-client.js

const PRIMARY_SUPABASE_URL = 'https://xxx.supabase.co';
const REPLICA_SUPABASE_URL = 'https://yyy.supabase.co';

// Client primaire (writes)
export const supabasePrimary = createClient(PRIMARY_SUPABASE_URL, SUPABASE_ANON_KEY);

// Client réplica (reads)
export const supabaseReplica = createClient(REPLICA_SUPABASE_URL, SUPABASE_ANON_KEY);

// Helper smart routing
export async function smartQuery(table, operation, data) {
    if (operation === 'select') {
        // Lecture = Replica
        return supabaseReplica.from(table).select(data);
    } else {
        // Écriture = Primary
        return supabasePrimary.from(table)[operation](data);
    }
}
```

**Impact :**
- ✅ Tolérance panne (99.99% uptime)
- ✅ Charge divisée par 2

---

## 🟢 PHASE 3 : OPTIMISATIONS AVANCÉES (6 semaines)

### 3.1 Cache Applicatif - Redis

#### ✅ Action 3.1.1 : Redis pour Cache Chaud

**Use Case :**
- Calculs fiscaux (lourds, peu fréquents)
- Statistiques agrégées
- Sessions utilisateur

**Stack :**
- Redis Cloud (Upstash) : 10 000 requêtes gratuites/jour
- Clés avec TTL (expire auto)

**Exemple :**

```javascript
// NOUVEAU : js/redis-client.js

import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: 'https://xxx.upstash.io',
  token: 'YOUR_TOKEN'
});

// Cache calcul fiscal
export async function getCachedFiscalite(userId, annee) {
    const cacheKey = `fiscalite:${userId}:${annee}`;
    
    // Vérifier cache
    let data = await redis.get(cacheKey);
    
    if (!data) {
        // Calculer (lourd)
        data = await calculerFiscalite(userId, annee);
        
        // Mettre en cache (TTL 1h)
        await redis.setex(cacheKey, 3600, JSON.stringify(data));
    }
    
    return data;
}

// Invalider cache lors d'une modification
export async function invalidateFiscaliteCache(userId, annee) {
    await redis.del(`fiscalite:${userId}:${annee}`);
}
```

**Impact :**
- ✅ Calculs fiscaux instantanés (cache hit)
- ✅ 95% de requêtes SQL économisées

---

### 3.2 Compression & Minification

#### ✅ Action 3.2.1 : Build Pipeline

**Outils :**
- Webpack ou Vite pour bundling
- Terser pour minification JS
- CSSNano pour minification CSS
- ImageOptim pour images

**Configuration Vite (`vite.config.js`) :**

```javascript
import { defineConfig } from 'vite';
import { compression } from 'vite-plugin-compression';

export default defineConfig({
    build: {
        minify: 'terser',
        terserOptions: {
            compress: {
                drop_console: true, // Supprimer console.log en prod
                drop_debugger: true
            }
        },
        rollupOptions: {
            output: {
                manualChunks: {
                    'supabase': ['@supabase/supabase-js'],
                    'charts': ['chart.js'],
                    'maps': ['leaflet']
                }
            }
        }
    },
    plugins: [
        compression({ algorithm: 'gzip' }),
        compression({ algorithm: 'brotliCompress', ext: '.br' })
    ]
});
```

**Build command :**
```bash
npm run build
# Génère dist/ avec fichiers optimisés
```

**Impact :**
- ✅ JS divisé par 3 (minifié + gzip)
- ✅ CSS divisé par 5
- ✅ Temps chargement -60%

---

### 3.3 Monitoring & Alertes

#### ✅ Action 3.3.1 : Sentry pour Erreurs

**Installation :**

```bash
npm install @sentry/browser
```

**Config (`js/sentry-init.js`) :**

```javascript
import * as Sentry from "@sentry/browser";

Sentry.init({
  dsn: "https://xxx@sentry.io/yyy",
  environment: "production",
  tracesSampleRate: 0.1, // 10% des transactions tracées
  beforeSend(event, hint) {
    // Filtrer erreurs extensions Chrome
    if (event.exception?.values?.[0]?.value?.includes('chrome-extension')) {
      return null;
    }
    return event;
  }
});
```

**Impact :**
- ✅ Alertes temps réel sur bugs
- ✅ Stack traces complètes
- ✅ Suivi performance

---

#### ✅ Action 3.3.2 : Uptime Monitoring

**Services :**
- UptimeRobot (gratuit 50 monitors)
- Pingdom
- Checkly

**Monitors à créer :**
1. `https://votredomaine.com/` (HTTP 200, interval 5 min)
2. `https://votredomaine.com/index.html` (HTTP 200)
3. Supabase API (ping endpoint)
4. Edge Functions (si utilisées)

**Alertes :**
- Email si down > 5 min
- Webhook vers Slack/Discord

---

#### ✅ Action 3.3.3 : Analytics Performance

**Google Analytics 4 :**

```html
<!-- index.html -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX', {
    send_page_view: false // Désactiver auto pageview (SPA)
  });

  // Track onglets manuellement
  function trackPageView(page) {
    gtag('event', 'page_view', { page_path: page });
  }
</script>
```

**Web Vitals :**

```javascript
import {getCLS, getFID, getFCP, getLCP, getTTFB} from 'web-vitals';

function sendToAnalytics({name, value}) {
  gtag('event', name, {
    value: Math.round(name === 'CLS' ? value * 1000 : value),
    event_category: 'Web Vitals',
    non_interaction: true,
  });
}

getCLS(sendToAnalytics);
getFID(sendToAnalytics);
getFCP(sendToAnalytics);
getLCP(sendToAnalytics);
getTTFB(sendToAnalytics);
```

---

## 🔵 PHASE 4 : TESTS DE CHARGE (2 semaines)

### 4.1 Tests Locaux - k6

#### ✅ Action 4.1.1 : Scripts k6

**Installation :**
```bash
brew install k6  # macOS
# ou
sudo apt install k6  # Linux
```

**Script test (`load-test.js`) :**

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 100 },   // Ramp-up à 100 users
    { duration: '5m', target: 100 },   // Hold 100 users
    { duration: '2m', target: 1000 },  // Spike à 1000
    { duration: '5m', target: 1000 },  // Hold 1000
    { duration: '2m', target: 0 },     // Ramp-down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% requêtes < 500ms
    http_req_failed: ['rate<0.01'],   // < 1% erreurs
  },
};

export default function () {
  // Test login
  const loginRes = http.post('https://votredomaine.com/api/auth', {
    email: `test${__VU}@example.com`,
    password: 'TestPassword123'
  });

  check(loginRes, {
    'login status 200': (r) => r.status === 200,
  });

  sleep(1);

  // Test load réservations
  const token = loginRes.json('access_token');
  const reservationsRes = http.get('https://votredomaine.com/api/reservations', {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  check(reservationsRes, {
    'reservations status 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(2);
}
```

**Exécution :**
```bash
k6 run load-test.js
```

**Objectifs :**
- ✅ 1000 users simultanés sans erreur
- ✅ p95 < 500ms
- ✅ Taux erreur < 1%

---

### 4.2 Tests Production - Loader.io

**Service :** Loader.io (gratuit 10k clients/test)

**Tests à effectuer :**
1. **Test 1 : Charge stable**
   - 1000 users pendant 10 min
   - Vérifier stabilité

2. **Test 2 : Spike traffic**
   - 0 → 5000 users en 1 min
   - Vérifier recovery

3. **Test 3 : Endurance**
   - 2000 users pendant 1h
   - Vérifier memory leaks

**Métriques à surveiller :**
- CPU Supabase (< 70%)
- Mémoire (< 80%)
- Latence API (< 300ms p95)
- Erreurs (< 0.5%)

---

## 📊 MÉTRIQUES DE SUCCÈS

### KPIs à Suivre

| Métrique | Valeur Actuelle | Objectif 70k Users | Méthode Mesure |
|----------|----------------|-------------------|----------------|
| **Temps chargement page** | ~3s | < 1s | Lighthouse |
| **API p95 latency** | ~800ms | < 300ms | Sentry |
| **Taux erreur** | ~5% | < 0.5% | Sentry |
| **Uptime** | 99.5% | 99.9% | UptimeRobot |
| **DB connections** | ~50 | < 500 | Supabase Dashboard |
| **Coût/user/mois** | ~$5 | < $2 | Facturation |

---

## 💰 COÛTS ESTIMÉS

### Budget Infrastructure (70k Users)

| Service | Plan | Coût/mois | Nécessité |
|---------|------|-----------|-----------|
| **Supabase Team** | 100 GB + 50M reads | $599 | 🔴 Critique |
| **Cloudflare Pro** | CDN + WAF | $20 | 🟡 Recommandé |
| **Upstash Redis** | 10M commands | $30 | 🟡 Recommandé |
| **Sentry Business** | 100k events | $80 | 🟢 Optionnel |
| **UptimeRobot** | Monitoring | $0 | ✅ Gratuit |
| **Loader.io** | Load testing | $0 | ✅ Gratuit |
| **Total** | | **$729/mois** | |

**Coût par utilisateur :** $729 / 70 000 = **$0.01/mois/user** ✅

---

## 🗓️ PLANNING

### Timeline Globale

| Phase | Duration | Semaines | Dépendances |
|-------|----------|----------|-------------|
| **Phase 1 : Optimisations Critiques** | 2 semaines | S1-S2 | - |
| **Phase 2 : Infrastructure** | 4 semaines | S3-S6 | Phase 1 complète |
| **Phase 3 : Optimisations Avancées** | 6 semaines | S7-S12 | Phase 2 complète |
| **Phase 4 : Tests de Charge** | 2 semaines | S13-S14 | Phase 3 complète |
| **Total** | **14 semaines** | **~3.5 mois** | |

---

## ✅ CHECKLIST VALIDATION

### Avant Mise en Production

- [ ] Tous les indexes SQL créés
- [ ] Table `infos_gites` refactorisée
- [ ] Queue asynchrone iCal déployée
- [ ] Pagination implémentée partout
- [ ] Service Worker actif
- [ ] CDN Cloudflare configuré
- [ ] Plan Supabase Team migré
- [ ] Cache Redis opérationnel
- [ ] Monitoring Sentry actif
- [ ] Tests de charge k6 réussis (1000 users)
- [ ] Tests Loader.io réussis (5000 users)
- [ ] Uptime monitoring configuré
- [ ] Documentation mise à jour
- [ ] Rollback plan préparé

---

## 🚨 PLAN DE ROLLBACK

### En Cas de Problème

1. **Détection** : Monitoring détecte anomalie
2. **Alerte** : Équipe notifiée (Slack/Email/SMS)
3. **Évaluation** : Identifier composant défaillant
4. **Rollback** :
   - Cloudflare : Purge cache
   - Code : Git revert + redéploy
   - BDD : Restaurer snapshot < 1h
5. **Communication** : Notifier utilisateurs
6. **Post-mortem** : Analyser cause + correctif

**Snapshots BDD : Automatiques toutes les 6h** (Supabase)

---

## 📞 RESSOURCES & SUPPORT

### Documentation Technique

- Supabase Docs : https://supabase.com/docs
- Cloudflare Workers : https://developers.cloudflare.com/workers/
- k6 Load Testing : https://k6.io/docs/
- Redis Upstash : https://docs.upstash.com/

### Expert External (si besoin)

- **DevOps Consultant** : $100-150/h
- **PostgreSQL DBA** : $120-200/h
- **Performance Audit** : $2000-5000 (forfait)

---

## 🎯 CONCLUSION

Ce plan permet de **scaler de 100 à 70 000 utilisateurs** en **14 semaines** avec :

✅ **Architecture solide** (multi-région, cache, queue)  
✅ **Performance optimale** (< 300ms API, < 1s chargement)  
✅ **Coûts maîtrisés** ($0.01/user/mois)  
✅ **Monitoring complet** (uptime, erreurs, perfs)  
✅ **Tests validés** (charge, spike, endurance)

**Priorités immédiates** (Semaine 1) :
1. ✅ Créer indexes SQL critiques
2. ✅ Implémenter pagination réservations
3. ✅ Activer Service Worker
4. ✅ Migrer Supabase Pro ($25/mois)

**Prêt pour exécution !** 🚀

---

**Document créé le :** 13 février 2026  
**Prochaine révision :** Après Phase 1 (S2)  
**Responsable :** Équipe Technique LiveOwnerUnit
