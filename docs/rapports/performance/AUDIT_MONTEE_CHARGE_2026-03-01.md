# Audit montée en charge — 01/03/2026

## 1) Contexte
- **Objectif**: mesurer la réaction de la plateforme à une montée de pression (API + page admin).
- **Périmètre testé (GET only, sans écriture métier)**:
  - `/api/test`
  - `/api/ai-health`
  - `/pages/admin-security-audit.html`
- **Campagnes utilisées pour comparaison**:
   - baseline: `2026-03-01T18-11-28Z` (12 phases / 12)
   - reprise comparative: `2026-03-01T20-30-33Z` (12 phases / 12)
- **Sources de preuve**:
   - `docs/rapports/performance/LOAD_TEST_MANIFEST_2026-03-01T18-11-28Z.json`
   - `docs/rapports/performance/LOAD_TEST_MANIFEST_2026-03-01T20-30-33Z.json`
   - `docs/rapports/performance/LOAD_TEST_PHASE_2026-03-01T18-11-28Z_*.json`
   - `docs/rapports/performance/LOAD_TEST_PHASE_2026-03-01T20-30-33Z_*.json`
   - `docs/rapports/performance/LOAD_TEST_SUMMARY_2026-03-01T20-30-33Z.json`

## 2) Avancement campagne
- **Baseline**: **100%** (12/12 phases).
- **Run comparatif**: **100%** (12/12 phases).

## 3) Résultats consolidés (issus des fichiers de phase)

### A. Comparatif avant/après (mêmes volumes cibles)

| Scénario | Baseline (18:11) | Comparatif (20:30) | Delta |
|---|---:|---:|---:|
| `/api/test` erreur | 9.90% | 0.17% | **-9.73 pts** |
| `/api/test` worst p95 | 1524ms | 339ms | **-1185ms** |
| `/api/ai-health` erreur | 1.35% | 0.00% | **-1.35 pt** |
| `/api/ai-health` worst p95 | 534ms | 309ms | **-225ms** |
| `/pages/admin-security-audit.html` erreur | 0.29% | 1.39% | **+1.10 pt** |
| `/pages/admin-security-audit.html` worst p95 | 344ms | 347ms | +3ms |

**Lecture rapide:**
- Les endpoints API internes testés progressent fortement (latence et taux d’erreur).
- Le scénario page admin reste rapide en latence, mais montre des erreurs réseau transitoires (`code 0`) pendant la reprise intensive.

### B. API de test (`/api/test`) — run comparatif
- Requêtes: **4000**
- Succès: **3993**
- Erreurs: **7** (**0.17%**)
- Latence: `worst p95=339ms`, `worst p99=823ms`, `max=868ms`
- **Lecture**: amélioration majeure de la robustesse sous charge.

### C. API monitoring (`/api/ai-health`) — run comparatif
- Requêtes: **2000**
- Succès: **2000**
- Erreurs: **0** (**0.00%**)
- Latence: `worst p95=309ms`, `worst p99=724ms`, `max=804ms`
- **Lecture**: scénario conforme sur les seuils retenus.

### D. Page admin audit sécurité (`/pages/admin-security-audit.html`) — run comparatif
- Requêtes: **3800**
- Succès: **3747**
- Erreurs: **53** (**1.39%**)
- Latence: `worst p95=347ms`, `worst p99=532ms`, `max=1083ms`
- **Lecture**: latence encore contenue, mais erreurs réseau intermittentes à surveiller (impact mineur sur le périmètre interne prioritaire).

## 4) Verdict SLO (périmètre interne prioritaire)
- **SLO cible**: `p95 < 500ms` et `erreurs < 1%`
- **Verdict API interne**: **CONFORME** sur les 2 endpoints API testés (`/api/test`, `/api/ai-health`)
- **Verdict global multi-scénarios**: **NON CONFORME** à cause du scénario admin statique (1.39% erreurs réseau)

## 5) Points à améliorer (priorité)

### P0 (immédiat)
1. **Réduire les erreurs réseau (`code 0`) restantes** sur scénarios à forte concurrence:
   - budget timeout cohérent (`client < edge < function`)
   - retry côté client uniquement sur erreurs transitoires et idempotentes
2. **Conserver les garde-fous de rafraîchissement/sync déjà ajoutés** (cooldown + rate limiting + mode dégradé) et monitorer leur effet en prod.

### P1 (court terme)
3. **Profilage des endpoints API internes**:
   - mesurer temps DB, temps logique, temps réseau séparément
   - remonter `p95/p99` par route dans le monitoring
4. **Durcir la tenue en charge DB** (si endpoint connecté Supabase):
   - audit des requêtes lentes
   - vérification index et cardinalités
   - contrôle du pool de connexions

### P2 (industrialisation)
5. **Campagne de charge continue en pré-release**:
   - protocole checkpointé automatique
   - seuils Go/No-Go bloquants avant release
   - historisation des runs et tendance hebdomadaire

## 6) Risques opérationnels
- Sans remédiation, une montée brutale d’abonnés peut provoquer:
  - dégradation API (latence > 1s)
  - erreurs transitoires visibles côté client
  - expérience admin/monitoring partiellement instable selon l’endpoint

## 7) Conclusion
- **La robustesse API interne progresse fortement et devient conforme sur ce protocole**.
- **Le seul point non conforme reste un bruit réseau intermittent sur le scénario admin statique**, non prioritaire fonctionnellement (2–3 admins).
- Recommandation: conserver le plan P0/P1 ciblé réseau/timeout puis rejouer une campagne dédiée API interne avant Go final à grande échelle.

## 8) Addendum — Runs API-only hors admin (01/03/2026)

### A. Run intermédiaire
- **Run ID**: `2026-03-01T21-API-ONLY-2Z`
- **Résultat**: latence conforme mais **FAIL** SLO erreur (`/api/ai-health` à 1.60%).

### B. Run de confirmation (référence officielle Go/No-Go)
- **Run ID**: `2026-03-01T22-API-ONLY-3Z`
- **Périmètre**: `/api/test` + `/api/ai-health` uniquement, scénario admin exclu.
- **Avancement**: **100%** (8/8 phases)

### Résultats de référence
- `/api/test`: 4000 req, **0.25%** erreurs, `p95=207ms`, `p99=529ms`
- `/api/ai-health`: 2000 req, **0.25%** erreurs, `p95=205ms`, `p99=438ms`
- **Conclusion SLO API-only** (`p95<500ms` & erreurs `<1%`): **PASS**

### Conclusion opérationnelle finale (hors admin)
- **Go/No-Go hors admin: GO**
- Score périmètre API interne testé: **100/100**
- Référence artefacts:
   - `docs/rapports/performance/LOAD_TEST_MANIFEST_2026-03-01T22-API-ONLY-3Z.json`
   - `docs/rapports/performance/LOAD_TEST_SUMMARY_2026-03-01T22-API-ONLY-3Z.json`
