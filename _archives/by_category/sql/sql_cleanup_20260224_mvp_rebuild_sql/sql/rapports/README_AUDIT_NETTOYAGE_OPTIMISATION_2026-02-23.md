# Audit Nettoyage & Optimisation Tables (Read-Only)

## Objectif

Fournir un état précis de la base avant toute action de nettoyage/optimisation, sans modification de données.

Script principal:
- `sql/rapports/AUDIT_NETTOYAGE_OPTIMISATION_TABLES_2026-02-23.sql`

## Exécution

1. Ouvrir Supabase SQL Editor
2. Exécuter le script complet
3. Exporter les résultats des blocs 2, 3, 5, 7, 8, 9, 10

## Interprétation rapide

- Bloc 2 (dead tuples):
  - `dead_tuple_pct > 20` = candidat maintenance (vacuum/analyze à planifier)

- Bloc 3 (index non utilisés):
  - `idx_scan = 0` sur index non contrainte = candidat suppression (après validation usage)

- Bloc 5 (FK sans index):
  - chaque ligne fournit un SQL suggéré `CREATE INDEX CONCURRENTLY ...`

- Bloc 7 (RLS permissive):
  - toute ligne retournée = à traiter prioritairement côté sécurité

- Bloc 8/9 (règles réservation):
  - toute ligne retournée = incohérence métier à corriger avant optimisation profonde

- Bloc 10 (KPI):
  - donne la charge du chantier en 3 compteurs

## Sécurité / Production

- Script strictement read-only
- Aucune transaction d'écriture
- Aucune suppression / création / altération

## Étape suivante recommandée

Construire un lot SQL "actions contrôlées" séparé en 3 sous-lots:
1. Index manquants FK (création concurrente)
2. Nettoyage index inutiles validés
3. Maintenance ciblée (vacuum/analyze planifié)
