# Runbook — Check Hebdo Performance Interne (hors admin)

## Objectif
Valider en 5 minutes que la plateforme reste conforme sur le périmètre interne API-only (hors scénarios admin et hors services externes).

## Étapes
1. Lancer la campagne API-only:

```bash
cd /workspaces/Gestion_gite-calvignac
RUN_ID_OVERRIDE=$(date -u +%Y-%m-%dT%H-%M-%SZ) INCLUDE_ADMIN_SCENARIO=0 ./scripts/load-test-curl.sh https://liveownerunit.fr
```

2. Ouvrir le summary généré:
- `docs/rapports/performance/LOAD_TEST_SUMMARY_<RUN_ID>.json`

3. Vérifier la base:
- Exécuter `sql/performance/SUIVI_HEBDO_PERF_INTERNE_2026-03-01.sql` dans Supabase SQL Editor.

## Seuils Go / No-Go
- Worst p95 API-only `< 500ms`
- Worst error rate API-only `< 1%`
- DB KPI:
  - `tables_dead_over_20pct = 0`
  - `running_queries_over_30s = 0`

## Décision
- **GO** si tous les seuils sont conformes.
- **NO-GO** si au moins un seuil n’est pas conforme.

## Artefacts attendus
- `docs/rapports/performance/LOAD_TEST_MANIFEST_<RUN_ID>.json`
- `docs/rapports/performance/LOAD_TEST_SUMMARY_<RUN_ID>.json`
- `docs/rapports/performance/LOAD_TEST_RAW_<RUN_ID>.csv`
