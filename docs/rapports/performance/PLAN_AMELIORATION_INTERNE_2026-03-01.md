# Plan d'amélioration interne (hors abonnements/services externes)

Date: 01/03/2026

## 1) Périmètre retenu

### Inclus (interne applicatif)
- Parcours owner/client et opérations Supabase directes:
  - `js/supabase-operations.js`
  - `js/sync-ical-v2.js`
  - `js/reservations.js`
  - `js/dashboard.js`
  - `js/checklists.js`
  - `js/fiches-clients.js`
  - `js/prestations.js`
  - `js/menage.js`
  - `js/gites-crud.js`
- Endpoints API internes utiles au fonctionnement:
  - `/api/cors-proxy` (sync iCal)
  - `/api/test` (sonde technique)

### Exclus (à traiter plus tard)
- Endpoints dépendants d'abonnements externes:
  - `/api/openai`, `/api/content-ai`, `/api/support-ai`, `/api/send-email`, `/api/social-publish`, `/api/zoho-*`

---

## 2) Routes internes critiques à optimiser en premier

### Priorité P0
1. Flux iCal + synchronisation réservations
   - Fichier: `js/sync-ical-v2.js`
   - Tables: `reservations`, `cleaning_schedule`
   - Risque: multiples requêtes par événement iCal, impact direct sur planning et conflits

2. CRUD réservations + recalculs associés
   - Fichiers: `js/supabase-operations.js`, `js/reservations.js`
   - Tables: `reservations`, `cleaning_schedule`, `charges`, `historical_data`
   - Risque: latence en chaîne sur actions cœur métier

3. Dashboard owner (chargement agrégé)
   - Fichier: `js/dashboard.js`
   - Tables: `reservations`, `cleaning_schedule`, `todos`, `commandes_prestations`, `fiscal_history`, `demandes_horaires`
   - Risque: surcharge côté lecture multi-blocs

### Priorité P1
4. Checklists et suivi d'exécution
   - Fichier: `js/checklists.js`
   - Tables: `checklist_templates`, `checklist_progress`, `reservations`

5. Fiches clients
   - Fichier: `js/fiches-clients.js`
   - Tables: `client_access_tokens`, `fiche_generation_logs`, `retours_clients`, `demandes_horaires`, `infos_gites`, `checklists`

6. Prestations & commandes
   - Fichier: `js/prestations.js`
   - Tables: `commandes_prestations`

---

## 3) SLO internes (cibles)

- API/lecture interne critique: `p95 < 500 ms`, `p99 < 1200 ms`
- Opérations écriture métier: `p95 < 800 ms`
- Taux d'erreur par route/table: `< 1%`
- Timeout fonctionnel: `< 2 s` pour lecture critique

Seuil d'alerte (warning):
- `p95 > 700 ms` sur 3 fenêtres consécutives
- `erreurs > 0.5%` sur 15 minutes

---

## 4) Démarrage concret (ordre d'exécution)

### Étape A — Baseline BDD (immédiat)
- Exécuter: `sql/performance/SUIVI_HEBDO_PERF_INTERNE_2026-03-01.sql`
- Objectif: identifier tables/index/requêtes candidates à optimisation

### Étape B — Instrumentation légère par route/table
- Ajouter métriques de temps sur:
  - lecture/écriture `reservations`
  - lecture/écriture `cleaning_schedule`
  - bloc de chargement dashboard owner
- Sortie attendue: top 10 opérations lentes par fréquence

### Étape C — Optimisations P0
- Optimiser requêtes `reservations` et `cleaning_schedule`
- Réduire les allers-retours dans `sync-ical-v2.js` (batching minimal)
- Cache court sur lectures répétitives dashboard/checklists (TTL court)

### Étape D — Validation
- Rejouer la charge sur parcours internes uniquement
- Comparer avant/après, décider GO/NO-GO

---

## 5) Critère de fin de phase 1
- Liste P0/P1 figée
- SLO validés
- Baseline BDD exécutée et archivée
- Top 10 lenteurs internes identifié avec plan d'action

---

## 6) État actuel (retour KPI 01/03)

Retour reçu:
- `tables_dead_over_20pct = 5`
- `unused_non_constraint_indexes = 3`
- `running_queries_over_30s = 0`

Mise à jour post-remédiation:
- `tables_dead_over_20pct = 0`
- `unused_non_constraint_indexes = 3`
- `running_queries_over_30s = 0`

Interprétation:
- La maintenance BDD a supprimé l'alerte dead tuples sur le périmètre volumique significatif.
- Les 3 index `gites` restent en observation (pas de suppression immédiate).
- Le focus passe sur l'optimisation applicative (moins d'appels répétitifs).

Lecture opérationnelle:
1. La base n'est pas bloquée (pas de requêtes longues en cours),
2. mais il y a une dette de maintenance VACUUM/ANALYZE sur plusieurs tables,
3. et 3 index probablement inutiles à confirmer avant suppression.

Précision importante:
- Les pourcentages dead tuples observés portent sur des tables de très petit volume (ex: dizaines de lignes),
- donc l'impact réel perf est souvent faible tant qu'il n'y a pas de croissance forte.
- Priorité immédiate: optimisations applicatives sur les requêtes répétitives (iCal/réservations) avant actions destructives sur index.

Action immédiate préparée:
- Diagnostic détaillé: `sql/performance/DIAGNOSTIC_PERF_INTERNE_DETAILS_2026-03-01.sql`
- Remédiation safe-first: `sql/performance/REMEDIATION_PERF_INTERNE_2026-03-01.sql`
- Optimisation P0 appliquée: `js/sync-ical-v2.js` et `js/reservations.js` (cache court + timeout/retry local)
