# 📊 SUIVI SCALABILITÉ - Tableau de Bord Progressif
## LiveOwnerUnit - Actions par Paliers d'Utilisateurs

**Version :** 1.0  
**Date création :** 13 février 2026  
**Dernière mise à jour :** 13 février 2026  

---

## 🎯 COMMENT UTILISER CE DOCUMENT

### Principe
Ce document vous dit **exactement quoi faire** selon votre nombre d'utilisateurs actifs.

### Méthode
1. **Notez votre nombre actuel d'utilisateurs** ci-dessous
2. **Consultez le palier correspondant**
3. **Cochez les TODO** au fur et à mesure
4. **Surveillez les métriques** hebdomadairement
5. **Passez au palier suivant** quand atteint

---

## 📈 NOMBRE D'UTILISATEURS ACTUEL

```
┌─────────────────────────────────────────┐
│                                         │
│  👥 UTILISATEURS ACTIFS : _____        │
│                                         │
│  📅 Dernière mise à jour : ___/___/___ │
│                                         │
└─────────────────────────────────────────┘
```

---

## 🚦 VUE D'ENSEMBLE DES PALIERS

| Palier | Utilisateurs | Statut | Infra | Coût/mois | Actions TODO |
|--------|--------------|--------|-------|-----------|--------------|
| **🟢 Palier 0** | 0-50 | ⬜ | Supabase Free | 0 € | Rien à faire |
| **🟢 Palier 1** | 50-100 | ⬜ | Supabase Free | 0 € | 3 actions |
| **🟡 Palier 2** | 100-200 | ⬜ | Supabase Free | 0 € | 5 actions |
| **🟡 Palier 3** | 200-500 | ⬜ | Supabase Pro | 25 € | 7 actions |
| **🟠 Palier 4** | 500-1000 | ⬜ | Supabase Pro + CDN | 45 € | 10 actions |
| **🔴 Palier 5** | 1000-5000 | ⬜ | Supabase Team | 699 € | 15 actions |

**Cocher ✅ quand palier complété**

---

## 🟢 PALIER 0 : 0-50 UTILISATEURS

### Statut : [ ] Non atteint | [ ] En cours | [ ] Complété

### 📊 Métriques à Surveiller

| Métrique | Valeur Cible | Vérifier |
|----------|--------------|----------|
| Temps chargement page | < 3s | Hebdo |
| Erreurs console | 0 | Quotidien |
| Storage Supabase | < 100 MB | Hebdo |
| API requests | < 100k/mois | Hebdo |

### ✅ TODO (Rien)

**Votre infrastructure actuelle suffit !**

Concentrez-vous sur :
- ✅ Acquisition clients
- ✅ Feedback utilisateurs
- ✅ Correction bugs

**Aucune optimisation technique nécessaire.**

---

## 🟢 PALIER 1 : 50-100 UTILISATEURS

### Statut : [ ] Non atteint | [ ] En cours | [ ] Complété

### 📊 Métriques Critiques

| Métrique | Seuil Alerte | Action Si Dépassé |
|----------|--------------|-------------------|
| Storage Supabase | > 200 MB | ⚠️ Préparer Palier 3 |
| API requests | > 250k/mois | ⚠️ Optimiser requêtes |
| Temps chargement | > 5s | ⚠️ TODO #1 urgent |

### ✅ TODO Liste

#### ☐ TODO #1 : Ajouter Indexes SQL (30 min) - PRIORITÉ HAUTE

**Quand :** Dès 50 utilisateurs atteints

**Pourquoi :** Accélère les recherches dans la base de données

**Comment :**
1. Ouvrir Supabase Dashboard
2. SQL Editor
3. Copier-coller le script ci-dessous
4. Cliquer RUN

```sql
-- Exécuter ce script dans Supabase SQL Editor

-- Réservations (accès fréquent)
CREATE INDEX IF NOT EXISTS idx_reservations_owner_dates 
ON reservations(owner_user_id, date_debut DESC, date_fin);

CREATE INDEX IF NOT EXISTS idx_reservations_gite_dates 
ON reservations(gite_id, date_debut, date_fin);

-- Recherche par nom
CREATE INDEX IF NOT EXISTS idx_reservations_client_nom 
ON reservations USING gin(to_tsvector('french', client_nom));

-- Fiches clients
CREATE INDEX IF NOT EXISTS idx_fiches_token 
ON client_access_tokens(token);

-- Statistiques
CREATE INDEX IF NOT EXISTS idx_reservations_plateforme 
ON reservations(plateforme);

-- Ménage
CREATE INDEX IF NOT EXISTS idx_cleaning_gite_date 
ON cleaning_schedule(gite_id, date DESC);

-- Notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_read 
ON notifications(user_id, is_read, created_at DESC);
```

**Vérification :** 
```sql
-- Vérifier que les indexes sont créés
SELECT tablename, indexname FROM pg_indexes 
WHERE schemaname = 'public' 
AND indexname LIKE 'idx_%';
```

**Impact :** Requêtes 5-10x plus rapides ✅

---

#### ☐ TODO #2 : Setup Monitoring UptimeRobot (1h)

**Quand :** Dès 50 utilisateurs

**Comment :**
1. Aller sur https://uptimerobot.com
2. Créer compte gratuit
3. "Add New Monitor"
   - Type: HTTP(S)
   - URL: `https://votredomaine.com/`
   - Interval: 5 minutes
4. Configurer alertes email
5. Tester avec "Test Now"

**Vérification :** Vous recevez un email de test ✅

---

#### ☐ TODO #3 : Documenter Procédure Backup (30 min)

**Quand :** Avant 100 utilisateurs

**Comment :**
1. Créer fichier `docs/PROCEDURE_BACKUP.md`
2. Documenter :
   - Export manuel BDD (Supabase Dashboard)
   - Fréquence : Hebdomadaire
   - Stockage backup : Google Drive/Dropbox
3. Définir responsable backup

**Vérification :** 1er backup effectué ✅

---

## 🟡 PALIER 2 : 100-200 UTILISATEURS

### Statut : [ ] Non atteint | [ ] En cours | [ ] Complété

### 📊 Métriques Critiques

| Métrique | Seuil Alerte | Action Si Dépassé |
|----------|--------------|-------------------|
| Storage Supabase | > 350 MB | 🔴 Migrer Palier 3 URGENT |
| API requests | > 400k/mois | 🔴 Migrer Palier 3 URGENT |
| Temps chargement | > 5s | ⚠️ TODO #4 urgent |
| Erreurs utilisateurs | > 5/jour | ⚠️ TODO #7 urgent |

### ✅ TODO Liste

#### ☐ TODO #4 : Pagination Onglet Réservations (2h) - PRIORITÉ HAUTE

**Quand :** Dès 100 utilisateurs OU si temps chargement > 5s

**Pourquoi :** Éviter de charger 500+ réservations d'un coup

**Fichier à modifier :** `js/tab-reservations.js`

**Code AVANT (ligne ~50) :**
```javascript
const { data: reservations } = await supabase
    .from('reservations')
    .select('*')
    .eq('owner_user_id', user.id)
    .order('date_debut', { ascending: false });
```

**Code APRÈS (remplacer par) :**
```javascript
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

    displayReservations(reservations);
    renderPagination(currentPage, Math.ceil(count / ITEMS_PER_PAGE));
}

function renderPagination(page, total) {
    const paginationHTML = `
        <div class="pagination">
            ${page > 1 ? `<button onclick="loadReservations(${page - 1})">◀ Précédent</button>` : ''}
            <span>Page ${page} / ${total}</span>
            ${page < total ? `<button onclick="loadReservations(${page + 1})">Suivant ▶</button>` : ''}
        </div>
    `;
    document.getElementById('pagination-reservations').innerHTML = paginationHTML;
}
```

**Ajouter dans HTML :**
```html
<div id="pagination-reservations"></div>
```

**Vérification :** Charger compte avec 100+ réservations → Affiche 50 max ✅

---

#### ☐ TODO #5 : Pagination Onglet Statistiques (1h)

**Quand :** Après TODO #4

**Fichier :** `js/tab-statistiques.js`

**Même principe que TODO #4**

---

#### ☐ TODO #6 : Pagination Onglet Fiches Clients (1h)

**Quand :** Après TODO #5

**Fichier :** `js/tab-fiches-clients.js`

**Même principe que TODO #4**

---

#### ☐ TODO #7 : Service Worker Cache (1h) - OPTIONNEL

**Quand :** Si temps chargement > 3s

**Créer fichier :** `service-worker.js` (racine du projet)

```javascript
const CACHE_NAME = 'liveownerunit-v5.0';
const ASSETS = [
    '/',
    '/index.html',
    '/css/main.css',
    '/js/app.js'
];

self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
    );
});

self.addEventListener('fetch', (e) => {
    const url = new URL(e.request.url);
    
    if (url.hostname.includes('supabase')) {
        e.respondWith(fetch(e.request));
        return;
    }
    
    e.respondWith(
        caches.match(e.request)
            .then(cached => cached || fetch(e.request))
    );
});
```

**Dans `index.html` (avant `</body>`) :**
```html
<script>
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js');
}
</script>
```

**Vérification :** DevTools → Application → Service Workers → Actif ✅

---

#### ☐ TODO #8 : Sync iCal Décalées (30 min) - OPTIONNEL

**Quand :** Si vous avez des pics de charge toutes les 2h

**Fichier :** `js/sync-staggered.js` (nouveau)

```javascript
function getNextSyncSlot(userId) {
    const hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const slotMinutes = hash % 120; // 0-120 minutes
    
    const now = new Date();
    const nextSync = new Date(now);
    nextSync.setHours(Math.floor((now.getHours() + 2) / 2) * 2);
    nextSync.setMinutes(slotMinutes);
    
    if (nextSync < now) {
        nextSync.setHours(nextSync.getHours() + 2);
    }
    
    return nextSync;
}

async function scheduleSyncForUser(userId) {
    const nextSync = getNextSyncSlot(userId);
    const delay = nextSync - new Date();
    
    setTimeout(async () => {
        await syncAllGites(userId);
        scheduleSyncForUser(userId);
    }, delay);
}
```

**Vérification :** Check logs Supabase → Syncs étalées sur 2h ✅

---

## 🟡 PALIER 3 : 200-500 UTILISATEURS

### Statut : [ ] Non atteint | [ ] En cours | [ ] Complété

### 🚨 ALERTE : MIGRATION INFRASTRUCTURE OBLIGATOIRE

### 📊 Métriques Critiques

| Métrique | Seuil CRITIQUE | Action |
|----------|----------------|--------|
| Storage Supabase | > 450 MB | 🔴 TODO #9 IMMÉDIAT |
| API requests | > 450k/mois | 🔴 TODO #9 IMMÉDIAT |
| Temps chargement | > 5s | 🔴 TODO #10 |

### ✅ TODO Liste

#### ☐ TODO #9 : Migrer Supabase Pro (1h) - **OBLIGATOIRE**

**Quand :** 
- Dès 200 utilisateurs OU
- Storage > 400 MB OU
- API requests > 400k/mois

**Coût :** $25/mois (25 €)

**Comment :**
1. Supabase Dashboard → Settings → Billing
2. Upgrade to Pro
3. Vérifier nouvelles limites :
   - 8 GB storage (+16x)
   - 5M API requests (+10x)
   - 50 GB bandwidth
4. Tester 24h
5. Surveiller coûts

**Vérification :** Plan "Pro" actif dans dashboard ✅

**⚠️ IMPORTANT : À faire AVANT d'atteindre les limites Free !**

---

#### ☐ TODO #10 : Analyser Requêtes Lentes (2h)

**Quand :** Après migration Pro

**Comment :**
1. Supabase Dashboard → Database → Query Performance
2. Identifier requêtes > 1s
3. Ajouter indexes manquants
4. Optimiser SELECT (éviter SELECT *)

**Vérification :** Aucune requête > 1s ✅

---

#### ☐ TODO #11 : Setup Alertes Supabase (30 min)

**Quand :** Après migration Pro

**Comment :**
1. Supabase Dashboard → Settings → Notifications
2. Activer alertes :
   - Storage > 6 GB (75%)
   - API requests > 4M (80%)
   - Database CPU > 70%
3. Email + Webhook Slack/Discord

**Vérification :** Recevoir email de test ✅

---

#### ☐ TODO #12 : Refactoriser `infos_gites` (4h) - OPTIONNEL

**Quand :** Si lenteur constatée sur onglet Infos Gîtes

**Problème :** Table avec 119 colonnes = lent

**Solution :** Éclater en 5 tables (voir détails dans PLAN_200_UTILISATEURS_REALISTE.md)

**⚠️ Migration complexe - Faire uniquement si nécessaire**

---

#### ☐ TODO #13 : Tests de Charge Manuels (1h)

**Quand :** 300 utilisateurs

**Comment :**
1. Créer 20 comptes tests
2. Ouvrir 20 onglets simultanément
3. Se connecter partout
4. Naviguer, créer réservations
5. Noter problèmes

**Vérification :** Aucune erreur, temps < 5s ✅

---

#### ☐ TODO #14 : Documentation API Interne (2h)

**Quand :** 400 utilisateurs

**Créer :** `docs/API_INTERNAL.md`

**Contenu :**
- Liste toutes fonctions Supabase utilisées
- Endpoints critiques
- Rate limits
- Procédures en cas de panne

---

#### ☐ TODO #15 : Plan de Rollback (1h)

**Quand :** 400 utilisateurs

**Créer :** `docs/ROLLBACK_PROCEDURE.md`

**Contenu :**
1. Étapes retour arrière en cas de bug
2. Restauration snapshot BDD
3. Contacts urgence
4. Communication utilisateurs

---

## 🟠 PALIER 4 : 500-1000 UTILISATEURS

### Statut : [ ] Non atteint | [ ] En cours | [ ] Complété

### 📊 Métriques Critiques

| Métrique | Seuil CRITIQUE | Action |
|----------|----------------|--------|
| Storage Supabase | > 6 GB | 🔴 TODO #16 |
| API requests | > 4M/mois | 🔴 TODO #17 |
| Temps chargement | > 3s | 🔴 TODO #18 |
| Coûts infra | > 100 €/mois | ⚠️ Revoir pricing |

### ✅ TODO Liste

#### ☐ TODO #16 : Nettoyer Base de Données (2h)

**Quand :** Storage > 5 GB

**Comment :**
1. Identifier données obsolètes (> 2 ans)
2. Archiver réservations anciennes
3. Compresser images
4. Supprimer doublons

**Vérification :** Storage -20% minimum ✅

---

#### ☐ TODO #17 : Cache Redis Basique (3h)

**Quand :** API requests > 3M/mois

**Service :** Upstash Redis (gratuit 10k req/jour)

**Use Case :**
- Calculs fiscaux
- Statistiques agrégées
- Sessions utilisateur

**Code exemple :**
```javascript
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: 'https://xxx.upstash.io',
  token: 'YOUR_TOKEN'
});

async function getCachedStats(userId) {
    const key = `stats:${userId}`;
    let data = await redis.get(key);
    
    if (!data) {
        data = await calculateStats(userId);
        await redis.setex(key, 3600, JSON.stringify(data)); // TTL 1h
    }
    
    return data;
}
```

**Vérification :** Cache hit rate > 70% ✅

---

#### ☐ TODO #18 : CDN Cloudflare (2h)

**Quand :** Temps chargement > 2s

**Coût :** Gratuit (ou Pro $20/mois)

**Comment :**
1. Créer compte Cloudflare
2. Ajouter domaine
3. Changer DNS
4. Activer :
   - Auto Minify (CSS/JS/HTML)
   - Brotli compression
   - Cache Everything
5. Page Rules :
   - `*.votredomaine.com/css/*` → Cache 7 jours
   - `*.votredomaine.com/js/*` → Cache 7 jours

**Vérification :** Temps chargement -50% ✅

---

#### ☐ TODO #19 : Monitoring Sentry (1h)

**Quand :** 700 utilisateurs

**Coût :** $26/mois (Business 100k events)

**Comment :**
```bash
npm install @sentry/browser
```

```javascript
import * as Sentry from "@sentry/browser";

Sentry.init({
  dsn: "https://xxx@sentry.io/yyy",
  environment: "production",
  tracesSampleRate: 0.1
});
```

**Vérification :** Erreurs trackées en temps réel ✅

---

#### ☐ TODO #20-25 : Optimisations Avancées

Voir détails dans `PLAN_200_UTILISATEURS_REALISTE.md` section Phase 4

---

## 🔴 PALIER 5 : 1000-5000 UTILISATEURS

### Statut : [ ] Non atteint | [ ] En cours | [ ] Complété

### 🚨 ALERTE : MIGRATION TEAM OBLIGATOIRE

### ✅ TODO Liste

#### ☐ TODO #26 : Migrer Supabase Team (2h) - **OBLIGATOIRE**

**Quand :** 1000 utilisateurs OU Storage > 7 GB

**Coût :** $599/mois

**Nouvelles limites :**
- 100 GB storage
- 50M API requests
- Priority support

---

#### ☐ TODO #27-40 : Architecture Avancée

**Contacter un expert DevOps à ce stade.**

Optimisations nécessaires :
- Load balancing multi-région
- Database sharding
- Queue système distribué
- Auto-scaling
- Monitoring avancé (Datadog/NewRelic)

**Budget recommandé :** $2000-5000/mois infrastructure

---

## 📊 TABLEAU DE SUIVI MÉTRIQUES

### À Compléter Chaque Semaine

| Date | Users | Storage (MB) | API Req/mois | Temps Chargement | Erreurs | Coûts € | Notes |
|------|-------|--------------|--------------|------------------|---------|---------|-------|
| ___/___/___ | ___ | ___ | ___ | ___ | ___ | ___ | ___ |
| ___/___/___ | ___ | ___ | ___ | ___ | ___ | ___ | ___ |
| ___/___/___ | ___ | ___ | ___ | ___ | ___ | ___ | ___ |
| ___/___/___ | ___ | ___ | ___ | ___ | ___ | ___ | ___ |
| ___/___/___ | ___ | ___ | ___ | ___ | ___ | ___ | ___ |

**Comment remplir :**
- **Users** : Supabase Dashboard → Auth → Users
- **Storage** : Supabase Dashboard → Database → Database Size
- **API Req/mois** : Supabase Dashboard → Usage
- **Temps Chargement** : Google PageSpeed Insights
- **Erreurs** : Console browser (F12) + Logs Supabase
- **Coûts** : Supabase Dashboard → Billing

---

## 🎯 CHECKLIST RÉCAPITULATIVE RAPIDE

### Phase 1 (0-100 users)
- [ ] TODO #1 : Indexes SQL (30 min)
- [ ] TODO #2 : UptimeRobot (1h)
- [ ] TODO #3 : Procédure Backup (30 min)

### Phase 2 (100-200 users)
- [ ] TODO #4 : Pagination Réservations (2h)
- [ ] TODO #5 : Pagination Statistiques (1h)
- [ ] TODO #6 : Pagination Fiches Clients (1h)
- [ ] TODO #7 : Service Worker (1h) - optionnel
- [ ] TODO #8 : Sync décalées (30 min) - optionnel

### Phase 3 (200-500 users) - **MIGRATION OBLIGATOIRE**
- [ ] TODO #9 : **Supabase Pro** (1h) - 25 €/mois
- [ ] TODO #10 : Analyser requêtes lentes (2h)
- [ ] TODO #11 : Alertes Supabase (30 min)
- [ ] TODO #12 : Refactoriser infos_gites (4h) - optionnel
- [ ] TODO #13 : Tests de charge (1h)
- [ ] TODO #14 : Documentation API (2h)
- [ ] TODO #15 : Plan Rollback (1h)

### Phase 4 (500-1000 users)
- [ ] TODO #16 : Nettoyer BDD (2h)
- [ ] TODO #17 : Cache Redis (3h)
- [ ] TODO #18 : CDN Cloudflare (2h)
- [ ] TODO #19 : Monitoring Sentry (1h)

### Phase 5 (1000+ users) - **MIGRATION TEAM**
- [ ] TODO #26 : **Supabase Team** (2h) - 599 €/mois
- [ ] TODO #27+ : Contacter expert DevOps

---

## 🚨 ALERTES AUTOMATIQUES À CONFIGURER

### Supabase
- ⚠️ Storage > 80% du plan → Email + Slack
- ⚠️ API requests > 80% du plan → Email + Slack
- 🔴 Downtime > 5 min → SMS + Email

### UptimeRobot
- 🔴 Site down > 5 min → Email
- ⚠️ Temps réponse > 10s → Email

### Erreurs
- 🔴 Plus de 10 erreurs/heure → Email urgent
- ⚠️ Nouvelle erreur inconnue → Email

---

## 📞 CONTACTS URGENCE

### Support Technique
- **Supabase Support** : support@supabase.io
- **Votre DevOps** (si embauché) : _______________
- **Expert Externe** (consultant) : _______________

### Escalade
1. Essayer résoudre avec docs (30 min)
2. Poster sur Discord Supabase (réponse < 2h)
3. Contacter support Supabase (< 24h)
4. Contacter expert externe (dernier recours)

---

## 📖 RESSOURCES UTILES

### Documentation
- **Ce document** : `docs/SUIVI_SCALABILITE.md`
- **Plan détaillé 200 users** : `docs/PLAN_200_UTILISATEURS_REALISTE.md`
- **Plan futur 70k users** : `_archives/PLAN_SCALABILITE_70K_USERS_futur.md`

### Outils Monitoring
- **Supabase Dashboard** : https://app.supabase.com
- **UptimeRobot** : https://uptimerobot.com
- **Google PageSpeed** : https://pagespeed.web.dev

### Communautés
- **Supabase Discord** : https://discord.supabase.com
- **PostgreSQL Forum** : https://postgresql.org/community

---

## 🎉 CONCLUSION

### Principe Simple

1. **Notez votre nombre d'utilisateurs** chaque semaine
2. **Consultez le palier correspondant**
3. **Cochez les TODO** un par un
4. **Surveillez les métriques** critiques
5. **Agissez AVANT** d'atteindre les limites

### Rappel Important

**Ne faites QUE les TODO du palier actuel.**  
Inutile d'anticiper 1000 utilisateurs si vous en avez 50.

**Optimisez ce qui pose problème, pas plus.**

---

**Document créé le :** 13 février 2026  
**Prochain palier :** _________  
**Prochaine révision :** Chaque semaine

---

## 📝 NOTES PERSONNELLES

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  Espace pour vos notes, observations, problèmes :      │
│                                                         │
│  ___________________________________________________    │
│  ___________________________________________________    │
│  ___________________________________________________    │
│  ___________________________________________________    │
│  ___________________________________________________    │
│  ___________________________________________________    │
│  ___________________________________________________    │
│  ___________________________________________________    │
│                                                         │
└─────────────────────────────────────────────────────────┘
```
