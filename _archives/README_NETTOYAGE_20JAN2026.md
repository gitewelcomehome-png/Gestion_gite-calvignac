# Nettoyage du 20 janvier 2026

## Objectif
Nettoyage des fichiers SQL et MD obsolètes pour maintenir un projet propre et maintenable.

## Fichiers SQL archivés

### Dossier sql_archives_13jan/ → _archives/sql_20jan2026/
- **44 fichiers SQL** d'anciennes migrations et diagnostics datés du 13 janvier

### Depuis /sql/ → _archives/sql_20jan2026/
- **Migrations de colonnes** (déjà appliquées) :
  - add_checklist_tables.sql
  - add_proposed_by_column.sql
  - add_regles_tarifs_column.sql
  - add_type_amortissement_column.sql
  - add_vehicule_electrique.sql

- **Créations de tables** (déjà effectuées) :
  - create_cleaning_rules_table.sql
  - create_fiscalite_amortissements.sql
  - create_km_management.sql
  - create_linen_needs_table.sql

- **Fixes ponctuels** (déjà appliqués) :
  - fix_cleaning_schedule_rls.sql
  - fix_draps_table.sql
  - fix_retours_menage_structure.sql
  - fix_todos_structure.sql
  - FIX_RLS_FISCAL_HISTORY.sql

- **Scripts de vérification** (utilisés) :
  - verify_draps_table.sql
  - verify_km_tables.sql
  - verify_linen_needs_table.sql
  - verify_todos_gite_id.sql
  - verif_fiscalite_2026.sql

- **Nettoyages ponctuels** (effectués) :
  - COMPTE_RESERVATIONS.sql
  - NETTOYAGE_BASE_FISCALITE.sql
  - NETTOYAGE_COMPLET_RESA.sql

- **Tests et backups** :
  - backup_stocks_draps_avant_migration.sql
  - test_debug_travaux_realtime.sql

- **Refontes** (terminées) :
  - migration_add_cleaning_rules.sql
  - refonte_tables_fiscalite.sql

## Fichiers MD archivés

### Depuis /sql/ → _archives/md_20jan2026/
- FIX_DRAPS_COMPLET.md
- FIX_DRAPS_MULTI_GITES.md
- FIX_STATISTIQUES_MULTI_GITES.md
- INDEX_MAPPING_DRAPS.md
- RAPPORT_MAPPING_DRAPS.md
- README_INSTALLATION_KM.md
- RESUME_FINAL_DRAPS.md
- SYNTHESE_MAPPING_DRAPS.md

### Depuis racine → _archives/md_20jan2026/
- PROTOCOLE_TEST_DEBUG_TRAVAUX.md
- SYNTHESE_SYSTEME_FISCAL_ADAPTATIF.md

### Depuis /docs/ → _archives/md_20jan2026/
- **Références datées** :
  - CODE_REFERENCE_STABLE_10JAN2026.md

- **Fixes ponctuels** (déjà appliqués) :
  - FIX_COLONNES_RESERVATIONS.md
  - FIX_FRAIS_REELS_INDIVIDUELS.md
  - FIX_IMPORT_ICAL_SUCCESS.md
  - FIX_RESERVATIONS_INVISIBLES.md
  - FIX_SAUVEGARDE_INFOS_PRATIQUES.md

- **Guides d'installation** (installations terminées) :
  - GUIDE_EXECUTION_PHASE1.md
  - INSTALLATION_FEMME_MENAGE.md
  - INSTALLATION_REGLES_MENAGE.md

- **Roadmaps multi-tenant** (non applicable pour ce projet mono-tenant) :
  - ROADMAP_MULTI_TENANT_INDEX.md
  - ROADMAP_MULTI_TENANT_PART1_ANALYSE_CONCURRENTIELLE.md
  - ROADMAP_MULTI_TENANT_PART2_ARCHITECTURE.md
  - ROADMAP_MULTI_TENANT_PART3_IMPLEMENTATION.md
  - ROADMAP_MULTI_TENANT_PART4_FEATURES.md
  - backups_roadmap/

- **Refontes terminées** :
  - README_NOUVEAU_PROJET.md
  - REFONTE_FISCALITE_MULTI_TENANT_15JAN.md

- **Prompts et recaps** :
  - PROMPT_CALENDRIER_TARIFS.md
  - RECAP_SYSTEME_TAUX_ADAPTATIFS.md
  - 2026-01-13/

## Fichiers conservés

### SQL (/sql/)
- **SCHEMA_COMPLET_FINAL_2026.sql** : Schéma de référence actuel
- **README.md** : Documentation du dossier SQL

### MD (racine)
- **ARCHITECTURE.md** : Documentation architecture actuelle ✅
- **AUDIT_FISCAL_COMPTABLE.md** : Audit fiscal en cours ✅
- **BUSINESS_PLAN_README.md** : Business plan ✅
- **ERREURS_CRITIQUES.md** : Historique des bugs critiques ✅
- **README.md** : Documentation principale ✅

### MD (/docs/)
- **Audits** :
  - AUDIT_SECURITE.md
  - AUDIT_SYSTEME_RESERVATIONS.md

- **Corrections récentes** :
  - CORRECTIONS_AUDIT_FISCAL_19JAN2026.md
  - FIX_CHARGES_RESIDENCE_ET_IMPOTS_19JAN2026.md

- **Guides actifs** :
  - GUIDE_AMORTISSEMENTS_AUTOMATIQUES.md
  - GUIDE_COMPLET.md
  - GUIDE_ESPACE_FEMME_MENAGE.md
  - GUIDE_GESTION_DRAPS.md
  - GUIDE_KILOMETRES.md
  - GUIDE_MAJ_TAUX_ANNUELLE.md
  - GUIDE_REFONTE_RESERVATIONS.md
  - GUIDE_REGLES_MENAGE.md
  - GUIDE_RLS_IMPLEMENTATION.md
  - GUIDE_SCHEMA_COMPLET_FINAL.md

- **Implémentations** :
  - IMPLEMENTATION_KILOMETRES.md

- **Documentation système** :
  - README.md
  - README_DEV.md
  - README_SYSTEME_FISCAL.md
  - STATUS_PROJET.md
  - STRUCTURE_TABLES_FISCALITE.md
  - PLAN_COMMERCIALISATION.md

## Statistiques

- **SQL archivés** : ~71 fichiers
- **MD archivés** : ~31 fichiers
- **SQL conservés** : 2 fichiers
- **MD conservés** : 24 fichiers (5 racine + 19 docs)

## Résultat
Projet considérablement allégé avec uniquement les fichiers utiles et actifs conservés.
Toutes les archives restent accessibles dans `_archives/sql_20jan2026/` et `_archives/md_20jan2026/`.
