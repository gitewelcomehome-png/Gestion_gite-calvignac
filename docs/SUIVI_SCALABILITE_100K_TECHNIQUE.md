# 📊 GUIDE SCALABILITÉ TECHNIQUE 0-100K USERS
## LiveOwnerUnit - Architecture & Optimisations

**Version :** 2.0  
**Date :** 14 février 2026  
**Architecture :** Supabase PostgreSQL (AUCUNE REFONTE)  
**Cible MAX :** 100 000 utilisateurs

---

## 🎯 PRINCIPE

**Votre architecture actuelle tient jusqu'à 100k users SANS REFONTE du code.**

PostgreSQL (Supabase) gère des millions de rows. Exemples :
- Instagram au début : PostgreSQL avec millions d'users
- Discourse (forums) : PostgreSQL, 100k+ users actifs
- GitLab : PostgreSQL, millions de repos/users

**Ce qu'il faut faire :** Optimiser progressivement + payer l'infra plus cher.

---

## 📋 TABLEAU RÉCAPITUL ATIF

| Palier | Users | Infra | Coût/mois | Actions | Temps |
|--------|-------|-------|-----------|---------|-------|
| **0** | 0-50 | Supabase Free | 0 € | Aucune | 0h |
| **1** | 50-500 | Supabase Free | 0 € | Indexes SQL | 30min |
| **2** | 500-2k | Supabase Pro | 25 € | Pagination + Requêtes | 3h |
| **3** | 2k-10k | Supabase Team | 699 € | Redis cache + CDN | 8h |
| **4** | 10k-30k | Supabase Team | 699 € | Database tuning + Queue | 10h |
| **5** | 30k-100k | Enterprise | ~5k € | Read replicas + Monitoring | 8h |

**Total développement : ~30h étalées sur croissance**  
**Total coûts 3 ans (si 100k users atteints) : ~200k€** 

---

## 🟢 PALIER 0 : 0-50 USERS

### Infrastructure
- Supabase Free : 500 MB, 500k API req/mois
- Vercel Free

### Actions
**AUCUNE.** L'infra actuelle suffit.

### Métriques à surveiller
- Storage Supabase < 100 MB
- API requests < 100k/mois

---

## 🟡 PALIER 1 : 50-500 USERS

### Seuil d'action
- Storage > 100 MB **OU**
- Temps de chargement > 3s **OU**
- Pagination manuelle lourde

### ✅ TODO #1 : Indexes SQL critiques (30 min)

**Pourquoi :** Accélère les requêtes de 100x-1000x.

```sql
-- Indexes pour requêtes fréquentes
CREATE INDEX idx_reservations_user_dates 
  ON reservations(user_id, date_debut, date_fin);

CREATE INDEX idx_reservations_gite_dates 
  ON reservations(gite_id, date_debut, date_fin);

CREATE INDEX idx_activites_gite 
  ON activites(gite_id);

CREATE INDEX idx_menages_gite_date 
  ON menages(gite_id, date_menage);

-- Index pour recherche texte (nom client)
CREATE INDEX idx_reservations_client_nom 
  ON reservations USING gin(to_tsvector('french', nom_client));
```

**Résultat attendu :** Chargement réservations passe de 2-3s à < 200ms.

---

## 🟠 PALIER 2 : 500-2000 USERS

### Seuil d'action
- Supabase Free limits atteintes **OU**
- > 500k API req/mois **OU**
- Temps réponse > 2s

### ✅ TODO #2 : Migration Supabase Pro (20 min)

**Coût :** 25 €/mois  
**Limites :** 8 GB storage, 2 GB bandwidth, 2B req/mois

Dans Supabase Dashboard :
1. Settings > Billing
2. Upgrade to Pro
3. Ajouter carte bancaire

### ✅ TODO #3 : Pagination côté serveur (2h)

**Dans `js/tab-reservations.js` :**

```javascript
const ITEMS_PER_PAGE = 50;
let currentPage = 1;

async function loadReservations(page = 1) {
  const from = (page - 1) * ITEMS_PER_PAGE;
  const to = from + ITEMS_PER_PAGE - 1;
  
  const { data, count, error } = await supabase
    .from('reservations')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .order('date_debut', { ascending: false })
    .range(from, to);
  
  if (error) throw error;
  
  renderReservations(data);
  renderPagination(page, Math.ceil(count / ITEMS_PER_PAGE));
}

function renderPagination(current, total) {
  const pagination = document.getElementById('pagination');
  pagination.innerHTML = `
    <button ${current === 1 ? 'disabled' : ''} 
      onclick="loadReservations(${current - 1})">Précédent</button>
    <span>Page ${current} / ${total}</span>
    <button ${current === total ? 'disabled' : ''} 
      onclick="loadReservations(${current + 1})">Suivant</button>
  `;
}
```

**Appliquer à :**
- tab-reservations.js
- tab-statistiques.js  
- tab-fiches-clients.js
- tab-menage.js

### ✅ TODO #4 : Optimiser requêtes N+1 (1h)

**Problème fréquent :** Charger réservations puis faire 1 requête par gîte.

**Avant (lent) :**
```javascript
// Charge toutes les réservations
const reservations = await supabase.from('reservations').select('*');

// Pour CHAQUE réservation, charge le gîte (N+1 queries)
for (const resa of reservations) {
  const gite = await supabase
    .from('gites')
    .select('*')
    .eq('id', resa.gite_id)
    .single();
  resa.giteNom = gite.nom;
}
```

**Après (rapide) :**
```javascript
// 1 seule requête avec JOIN
const { data } = await supabase
  .from('reservations')
  .select(`
    *,
    gites (
      id,
      nom,
      adresse
    )
  `)
  .eq('user_id', userId);

// data[0].gites.nom directement disponible
```

**Appliquer partout où il y a des relations.**

---

## 🔴 PALIER 3 : 2000-10 000 USERS

### Seuil d'action
- > 1M API req/mois **OU**
- Storage > 5 GB **OU**
- Temps réponse > 1s sur pages liste

### ✅ TODO #5 : Migration Supabase Team (20 min)

**Coût :** 699 €/mois  
**Limites :** 100 GB storage, 250 GB bandwidth, database replicas

### ✅ TODO #6 : Redis cache Upstash (3h)

**Pourquoi :** Éviter de recalculer les mêmes données (stats, taux occupation, etc.).

**1. Créer compte Upstash Redis (gratuit jusqu'à 10k req/jour)**

https://upstash.com → Create Database (Régions Europe)

**2. Installer client :**

```html
<!-- Dans index.html -->
<script src="https://cdn.jsdelivr.net/npm/@upstash/redis@latest/dist/index.js"></script>
```

**3. Config dans `config.js` :**

```javascript
const redis = new Upstash.Redis({
  url: 'UPSTASH_REDIS_REST_URL',
  token: 'UPSTASH_REDIS_REST_TOKEN'
});
```

**4. Cacher statistiques (exemple `tab-statistiques.js`) :**

```javascript
async function loadStatistiques() {
  const cacheKey = `stats:${userId}:${new Date().toISOString().slice(0, 7)}`; // stats:USER:2026-02
  
  // Essayer cache d'abord
  let stats = await redis.get(cacheKey);
  
  if (!stats) {
    // Pas en cache, calculer
    stats = await calculateStatistiques();
    
    // Mettre en cache 1h
    await redis.setex(cacheKey, 3600, JSON.stringify(stats));
  } else {
    stats = JSON.parse(stats);
  }
  
  renderStatistiques(stats);
}

async function calculateStatistiques() {
  // Requêtes lourdes Supabase...
  const reservations = await supabase.from('reservations').select('*');
  const ca = reservations.reduce((sum, r) => sum + r.prix, 0);
  const tauxOccupation = calculerTO(reservations);
  
  return { ca, tauxOccupation, nbReservations: reservations.length };
}
```

**Invalider cache quand données changent :**

```javascript
async function ajouterReservation(data) {
  await supabase.from('reservations').insert(data);
  
  // Supprimer cache stats pour forcer recalcul
  await redis.del(`stats:${userId}:${new Date().toISOString().slice(0, 7)}`);
}
```

### ✅ TODO #7 : CDN Cloudflare (1h)

**Pourquoi :** Charger assets (images, CSS, JS) depuis serveurs proches users.

**1. Créer compte Cloudflare (gratuit)**

**2. Ajouter domaine :**
- DNS > Add site
- Suivre instructions changement nameservers

**3. Activer cache :**
- Page Rules > Create Rule
- `votredomaine.com/images/*` → Cache Level: Cache Everything, TTL: 1 month
- `votredomaine.com/css/*` → Cache Everything, TTL: 1 day
- `votredomaine.com/js/*` → Cache Everything, TTL: 1 day

**4. Versioning assets pour invalider cache :**

```html
<!-- Avant -->
<link rel="stylesheet" href="css/main.css">

<!-- Après (changer version à chaque modif) -->
<link rel="stylesheet" href="css/main.css?v=2.1.0">
```

### ✅ TODO #8 : Monitoring Sentry (2h)

**Pourquoi :** Détecter erreurs JavaScript avant que users signalent.

**1. Compte Sentry (gratuit 5k events/mois)**

**2. Init dans `index.html` :**

```html
<script src="https://js.sentry-cdn.com/VOTRE_DSN.min.js"></script>
<script>
Sentry.init({
  dsn: "https://xxx@xxx.ingest.sentry.io/xxx",
  environment: "production",
  tracesSampleRate: 0.1, // 10% des requêtes
});
</script>
```

**3. Logger erreurs critiques :**

```javascript
try {
  await supabase.from('reservations').insert(data);
} catch (error) {
  Sentry.captureException(error, {
    tags: { section: 'reservations', action: 'create' },
    user: { id: userId }
  });
  alert('Erreur lors de l\'ajout. L\'équipe technique est notifiée.');
}
```

### ✅ TODO #9 : Compression images (1h)

**Toutes les images > 500 KB :**

```bash
# Installer ImageMagick
apt-get install imagemagick  # Ubuntu/Debian

# Compresser images
find images/ -name "*.jpg" -exec mogrify -quality 85 -resize 1920x1080\> {} \;
find images/ -name "*.png" -exec mogrify -quality 85 -resize 1920x1080\> {} \;
```

**Ou utiliser service en ligne :** TinyPNG, Squoosh.app

### ✅ TODO #10 : Lazy loading images (30min)

```html
<!-- Avant -->
<img src="images/gite1.jpg" alt="Gîte 1">

<!-- Après -->
<img src="images/gite1.jpg" alt="Gîte 1" loading="lazy">
```

---

## 🟣 PALIER 4 : 10 000-30 000 USERS

### Seuil d'action
- > 10M API req/mois **OU**
- Sync iCal prend > 30s **OU**
- Database CPU > 70% (visible dans Supabase Dashboard)

### ✅ TODO #11 : Queue Redis pour syncs iCal (4h)

**Pourquoi :** Éviter que sync iCal bloque interface.

**Installer BullMQ :**

```bash
npm install bullmq
```

**Créer `js/syncQueue.js` :**

```javascript
import { Queue, Worker } from 'bullmq';

const connection = {
  host: 'UPSTASH_REDIS_HOST',
  port: 6379,
  password: 'UPSTASH_REDIS_PASSWORD'
};

// Queue pour jobs
export const syncQueue = new Queue('ical-sync', { connection });

// Worker qui traite jobs en arrière-plan
const worker = new Worker('ical-sync', async (job) => {
  const { userId, giteId, icalUrl } = job.data;
  
  console.log(`[Worker] Sync iCal gîte ${giteId}...`);
  
  // Fetch iCal
  const response = await fetch(icalUrl);
  const icalData = await response.text();
  
  // Parser + insérer réservations
  const reservations = parseIcal(icalData);
  await insertReservations(userId, giteId, reservations);
  
  console.log(`[Worker] Sync OK : ${reservations.length} réservations`);
}, { connection });
```

**Utiliser dans sync :**

```javascript
// AVANT (bloquant)
async function syncAllGites() {
  for (const gite of gites) {
    await syncIcalBlocking(gite.ical_url); // Attend 5-10s par gîte
  }
  alert('Sync terminée !');
}

// APRÈS (non-bloquant)
async function syncAllGites() {
  for (const gite of gites) {
    // Ajouter job à la queue (retour immédiat)
    await syncQueue.add('sync', {
      userId,
      giteId: gite.id,
      icalUrl: gite.ical_url
    }, {
      attempts: 3, // Retry 3x si échec
      backoff: { type: 'exponential', delay: 2000 }
    });
  }
  alert('Sync lancée en arrière-plan. Rafraîchir dans 1 min.');
}
```

### ✅ TODO #12 : Connection pooling Supabase (1h)

**Quand :** Database connections > 80 (visible Dashboard).

Dans Supabase Dashboard :
- Settings > Database
- Connection Pooling : **Activer**
- Mode : **Transaction**
- Pool size : **15** (par défaut OK)

**Utiliser pooler dans code :**

```javascript
// AVANT (connexion directe)
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// APRÈS (via pooler pour meilleures perfs)
const POOLER_URL = SUPABASE_URL.replace('.supabase.co', '.pooler.supabase.co');
const supabase = createClient(POOLER_URL, SUPABASE_ANON_KEY);
```

### ✅ TODO #13 : Database partitioning (3h)

**Si :** Table `reservations` > 1M rows.

**Partitionner par année :**

```sql
-- Transformer table en partitioned table
ALTER TABLE reservations RENAME TO reservations_old;

CREATE TABLE reservations (
  LIKE reservations_old INCLUDING ALL
) PARTITION BY RANGE (date_debut);

-- Créer partitions par année
CREATE TABLE reservations_2024 PARTITION OF reservations
  FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');
  
CREATE TABLE reservations_2025 PARTITION OF reservations
  FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');
  
CREATE TABLE reservations_2026 PARTITION OF reservations
  FOR VALUES FROM ('2026-01-01') TO ('2027-01-01');

-- Copier données
INSERT INTO reservations SELECT * FROM reservations_old;

-- Supprimer ancienne table
DROP TABLE reservations_old;
```

**Résultat :** Requêtes sur 2026 n'accèdent QUE à partition 2026 → 3-5x plus rapide.

### ✅ TODO #14 : Vacuum & Analyze automatique (30min)

**PostgreSQL garde anciennes rows = BDD gonfle.**

Activer autovacuum dans Supabase SQL Editor :

```sql
-- Vérifier config actuelle
SHOW autovacuum;

-- Si OFF, activer
ALTER SYSTEM SET autovacuum = on;
SELECT pg_reload_conf();

-- Forcer VACUUM manuel si BDD > 10 GB
VACUUM ANALYZE reservations;
VACUUM ANALYZE users;
VACUUM ANALYZE gites;
```

---

## 🔵 PALIER 5 : 30 000-100 000 USERS

### Seuil d'action
- Database CPU > 80% constant **OU**
- Temps réponse > 2s même avec cache **OU**
- Supabase recommande Enterprise

### ✅ TODO #15 : Migration Supabase Enterprise (30min)

**Coût :** ~3-5k €/mois (négociable avec Supabase)  
**Avantages :**
- Database replicas (lecture/écriture séparées)
- Support prioritaire
- Custom limits

Contact : enterprise@supabase.io

### ✅ TODO #16 : Read replicas (4h setup Supabase)

**Principe :** Séparer lecture/écriture.

- **Écriture (INSERT/UPDATE/DELETE)** → Database principale
- **Lecture (SELECT)** → Replicas (copies en lecture seule)

**Config automatique par Supabase Enterprise.**

**Dans code, utiliser replica pour lectures :**

```javascript
// Connexion principale (écriture)
const supabaseWrite = createClient(SUPABASE_URL, SUPABASE_KEY);

// Connexion replica (lecture)
const REPLICA_URL = 'FOURNI_PAR_SUPABASE_ENTERPRISE';
const supabaseRead = createClient(REPLICA_URL, SUPABASE_KEY);

// LIRE depuis replica
const { data: reservations } = await supabaseRead
  .from('reservations')
  .select('*');

// ÉCRIRE sur principale
await supabaseWrite
  .from('reservations')
  .insert(newReservation);
```

### ✅ TODO #17 : Monitoring Datadog (2h)

**Pourquoi :** Surveiller métriques temps réel.

**1. Compte Datadog (14j trial puis ~150€/mois)**

**2. Intégrer :**

```html
<script>
(function(h,o,u,n,d) {
   h=h[d]=h[d]||{q:[],onReady:function(c){h.q.push(c)}} 
   d=o.createElement(u);d.async=1;d.src=n
   n=o.getElementsByTagName(u)[0];n.parentNode.insertBefore(d,n)
})(window,document,'script','https://www.datadoghq-browser-agent.com/datadog-rum.js','DD_RUM')
DD_RUM.onReady(function() {
  DD_RUM.init({
    clientToken: 'VOTRE_TOKEN',
    applicationId: 'VOTRE_APP_ID',
    site: 'datadoghq.eu',
    service: 'liveownerunit',
    env: 'production',
    sessionSampleRate: 100,
    sessionReplaySampleRate: 20,
    trackUserInteractions: true,
    trackResources: true,
    trackLongTasks: true
  });
})
</script>
```

**3. Alertes :**

- Temps réponse API > 3s → Email
- Taux erreur > 1% → Email + SMS
- CPU Database > 90% → Alerte critique

### ✅ TODO #18 : Load testing k6 (2h)

**Tester AVANT d'avoir 100k users.**

**Installer k6 :**

```bash
brew install k6  # macOS
# ou
sudo apt-get install k6  # Ubuntu
```

**Créer test `load-test.js` :**

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 100 },    // Montée 100 users
    { duration: '5m', target: 1000 },   // Montée 1000 users
    { duration: '10m', target: 10000 }, // Peak 10k users
    { duration: '3m', target: 0 },      // Descente
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% requêtes < 2s
    http_req_failed: ['rate<0.01'],     // < 1% erreurs
  },
};

export default function () {
  // Simuler chargement page réservations
  const res = http.get('https://votredomaine.com/api/reservations', {
    headers: { 
      'Authorization': `Bearer ${__ENV.SUPABASE_TOKEN}` 
    }
  });
  
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 2s': (r) => r.timings.duration < 2000,
  });
  
  sleep(1);
}
```

**Lancer :**

```bash
k6 run load-test.js
```

**Résultats attendus avec architecture optimisée :**
- ✅ 10k users simultanés OK
- ✅ Temps réponse p95 < 2s
- ✅ Taux d'erreur < 0.1%

---

## 🎯 RÉSUMÉ CHECKLIST COMPLÈTE

| Palier | Users | Temps | Actions |
|--------|-------|-------|---------|
| **0** | 0-50 | 0h | Rien (infra Free OK) |
| **1** | 50-500 | 30min | Indexes SQL |
| **2** | 500-2k | 3h | Supabase Pro + Pagination + Optimisations |
| **3** | 2-10k | 8h | Team + Redis + CDN + Monitoring |
| **4** | 10-30k | 10h | Queue + Pooling + Partitioning |
| **5** | 30-100k | 8h | Enterprise + Replicas + Datadog |

**Total : ~30h étalées sur croissance**

---

## 💡 RECOMMANDATIONS FINALES

### Si 100k users atteints

**Vous POUVEZ rester sur cette architecture.** Mais à ce stade :

1. **Embaucher 1-2 DevOps** pour surveiller 24/7
2. **Audit sécurité** annuel (pentest)
3. **Backup multi-région** (disaster recovery)
4. **SLA 99.9%** avec alerting avancé

### Évolutions optionnelles (NON obligatoires)

Si vraiment besoin après 100k users :

- **Multi-région Supabase** (edge functions)
- **GraphQL** au lieu de REST (moins de requêtes)
- **Microservices** UNIQUEMENT pour services métiers lourds (ex: génération PDF fiches clients)

**Mais PostgreSQL monolithique tient facilement 100k-500k users.**

### Coûts récapitulatifs

| Users | Infra/mois | Monitoring/mois | Total/mois | Total/an |
|-------|------------|-----------------|------------|----------|
| 0-500 | 0 € | 0 € | 0 € | 0 € |
| 500-2k | 25 € | 0 € | 25 € | 300 € |
| 2k-10k | 699 € | 150 € | 850 € | 10k € |
| 10k-30k | 699 € | 200 € | 900 € | 11k € |
| 30k-100k | 5000 € | 300 € | 5300 € | 64k € |

**Total sur 3 ans si croissance jusqu'à 100k users : ~150-200k€**

Comparé au CA potentiel (100k users × 30€/mois = 3M€/mois), c'est **négligeable**.

---

## 🚀 PROCHAINES ÉTAPES IMMÉDIATES

**Pour l'instant (0 users) :**

1. ☐ Finir features site
2. ☐ Lancer acquisition premiers clients
3. ☐ **NE PAS optimiser prématurément**

**À 50 users :**

1. ☐ Créer indexes SQL (TODO #1)
2. ☐ Setup monitoring basique

**À 500 users :**

1. ☐ Migrer Supabase Pro
2. ☐ Implémenter pagination

**Le reste vient naturellement avec la croissance** 🚀

---

**FIN DU GUIDE TECHNIQUE**
