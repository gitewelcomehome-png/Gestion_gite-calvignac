# Manifest archive SQL — MVP rebuild

Date: 2026-02-24
Objectif: ne garder dans `sql/` que le minimum utile au rebuild canonique.

## Éléments déplacés

- sql/EXPLICATIONS_UNRESTRICTED.md
- sql/GUIDE_NETTOYAGE_BDD.md
- sql/README_EXECUTION_ORDRE.md
- sql/create_prestations_simple.sql
- sql/insert_test_data_prestations.sql
- sql/fixes/
- sql/patches/
- sql/rapports/

## Motif

Ces éléments ne sont pas requis par `sql/rebuild/01_REBUILD_SITE_ORDER.sql`.
Ils sont conservés en archive pour traçabilité historique.
