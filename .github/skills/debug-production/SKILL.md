---
name: debug-production
description: 'Diagnostic et résolution de bugs en production pour Gestion Gîte Calvignac. Utiliser pour : investiguer une erreur remontée par un client, analyser les logs d'erreurs, comprendre un bug intermittent, diagnostiquer une panne API ou Supabase, débloquer un ticket support. Méthodologie structurée : identifier → isoler → reproduire → corriger sans risque.'
argument-hint: 'Décris le symptôme observé (ex: le calendrier ne charge plus, une erreur 500 sur API send-email, un client ne peut plus se connecter)'
---

# Debug Production — Gestion Gîte Calvignac

> En production. Toute action corrective doit être **réversible** ou **sans risque de data loss**.

---

## Workflow de Diagnostic

### Étape 1 — Recueillir les Informations

Avant de toucher au code :
- **Symptôme exact** : message d'erreur, comportement observé, URL concernée
- **Périmètre** : tous les utilisateurs ou un seul ? Tous les gîtes ou un seul ?
- **Quand** : depuis quand ? Après quel déploiement ?
- **Reproductible** : systématique ou intermittent ?

### Étape 2 — Chercher dans les Logs

**Logs Vercel (API serverless) :**
Dashboard Vercel → Functions → sélectionner la fonction → voir les logs en temps réel ou historique.

**Logs front-end (client) :**
Les erreurs JS sont capturées par `js/error-logger.js` et `js/error-tracker.js`. Vérifier :
- La table `error_logs` dans Supabase si elle existe
- La console navigateur du client affecté (demander une capture d'écran)

**Tickets auto-générés :**
`js/auto-ticket-system.js` et `js/auto-ticket-diagnostic.js` créent des tickets automatiques sur certaines erreurs. Consulter la table `support_tickets` dans Supabase.

### Étape 3 — Isoler la Cause

Arbre de décision rapide :

```
Erreur visible côté client (console JS) ?
├── Oui → Bug front-end ou réponse API inattendue
│   ├── Erreur réseau (404/500) → Voir Étape 4a : Debug API
│   └── Erreur JS → Voir Étape 4b : Debug Front
└── Non → Comportement silencieux
    ├── Données manquantes → Voir Étape 4c : Debug Supabase
    └── Feature qui ne répond pas → Vérifier les event listeners et l'init JS
```

### Étape 4a — Debug API Vercel

```bash
# Tester une route API localement
vercel dev
curl -X POST http://localhost:3000/api/send-email \
  -H "Content-Type: application/json" \
  -d '{"to":"test@test.com","subject":"Test"}'
```

Points de vérification :
- [ ] Les variables d'environnement sont bien définies dans Vercel
- [ ] La fonction ne dépasse pas le timeout (10s par défaut)
- [ ] Les headers CORS sont corrects pour les appels cross-origin
- [ ] Le body de la requête est bien parsé (`req.body` en JSON)

### Étape 4b — Debug Front JS

Points de vérification dans l'ordre :
1. Le script est-il bien chargé ? (`<script src="js/xxx.js">` présent dans le HTML)
2. `window.supabaseClient` est-il initialisé avant l'appel ? (race condition fréquente)
3. L'élément DOM ciblé existe-t-il au moment de l'exécution ?
4. Y a-t-il des erreurs dans les `catch` qui avalent silencieusement l'erreur ?

Pattern race condition Supabase fréquent :
```js
// ✅ Attendre l'initialisation avant d'utiliser supabaseClient
const waitForSupabase = setInterval(() => {
  if (window.supabaseClient) {
    clearInterval(waitForSupabase);
    init();
  }
}, 100);
setTimeout(() => clearInterval(waitForSupabase), 5000);
```

### Étape 4c — Debug Supabase

Requêtes de diagnostic directement dans l'éditeur SQL Supabase :

```sql
-- Vérifier les dernières erreurs RLS (accès refusés)
-- (activer pg_audit si disponible)

-- Vérifier les données d'un utilisateur spécifique
SELECT * FROM gites WHERE user_id = '[UUID_UTILISATEUR]' ORDER BY created_at DESC;

-- Vérifier les réservations en conflit
SELECT gite_id, date_debut, date_fin, COUNT(*)
FROM reservations
GROUP BY gite_id, date_debut, date_fin
HAVING COUNT(*) > 1;

-- Vérifier les tokens de fiche client
SELECT * FROM cleaner_tokens WHERE expires_at < NOW();
```

### Étape 5 — Corriger Sans Risque

Règles avant d'appliquer un correctif :
- **Ne jamais modifier directement les données en prod** sans backup ou sans être sûr de l'effet
- Pour les corrections SQL : tester d'abord avec un `SELECT` avant un `UPDATE`/`DELETE`
- Pour les corrections JS : tester en local (`vercel dev`) avant de déployer
- Si le fix est risqué : antéposer un `UPDATE ... WHERE id = '[ID_SPECIFIQUE]'` sur un seul enregistrement pour valider

### Étape 6 — Documenter dans ERREURS_CRITIQUES.md

Si le bug était non trivial ou risque de se reproduire :
→ Ajouter une entrée dans `docs/ERREURS_CRITIQUES.md` avec :
- Symptôme
- Cause racine
- Solution appliquée
- Comment éviter à l'avenir

---

## Erreurs Fréquentes et Solutions Rapides

| Symptôme | Cause probable | Action |
|----------|----------------|--------|
| `window.supabaseClient is undefined` | Race condition à l'init | Attendre avec `setInterval` ou event `supabase:ready` |
| API Vercel 500 | Variable d'env manquante | Vérifier dashboard Vercel → Settings → Env |
| Données non visibles malgré insertion | Politique RLS trop restrictive | Tester en SQL avec `SET role = 'authenticated'` |
| iCal import bloqué | CORS sur URL externe | Passer par `/api/cors-proxy` en interne |
| Email non envoyé | Token Zoho expiré | Rafraîchir via `/api/zoho-refresh` |
| Fiche client inaccessible | Token cleaner expiré ou invalide | Vérifier table `cleaner_tokens` |
