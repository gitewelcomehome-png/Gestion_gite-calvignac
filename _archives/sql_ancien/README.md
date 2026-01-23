# 📦 ARCHIVES SQL - 23 JANVIER 2026

## 🎯 Raison de l'Archivage

Ces fichiers SQL ont été **archivés** car :
- ✅ Migrations déjà exécutées avec succès en production
- ✅ Scripts utilitaires utilisés une seule fois
- ✅ Ancien schéma remplacé par version 23/01/2026

**⚠️ NE PAS RÉ-EXÉCUTER** ces migrations (déjà appliquées)

---

## 📁 Structure

### migrations_multilingue/ (5 fichiers)
**Migrations traduction automatique FR→EN (23/01/2026)**
- `ADD_CHECKLIST_TRANSLATIONS.sql` - Ajout colonnes bilingues checklist_templates
- `add_i18n_checklist_templates.sql` - Migration données FR→EN checklists
- `add_i18n_faq.sql` - Ajout colonnes bilingues faq
- `MIGRATION_MULTILINGUE_FICHE_CLIENT.sql` - Migration complète fiches clients
- `EXEC_ACTIVATION_MULTILINGUE.sql` - Activation système bilingue

**Status** : ✅ Exécutées avec succès

---

### migrations_infos_gites/ (4 fichiers)
**Migrations table infos_gites (119 colonnes bilingues)**
- `fix_infos_gites_table.sql` - Création structure complète infos_gites
- `add_missing_columns_infos_gites.sql` - Ajout colonnes manquantes
- `ADD_MISSING_COLUMNS_INFOS_GITES.sql` - Doublon du précédent
- `EXEC_AJOUT_COLONNES_MANQUANTES.sql` - Exécution ajout colonnes

**Status** : ✅ Exécutées avec succès

---

### migrations_diverses/ (4 fichiers)
**Migrations diverses fonctionnalités**
- `add_horaires_columns.sql` - Ajout check_in_time, check_out_time
- `update_linen_stock_items.sql` - MAJ structure stocks linge dynamiques
- `reset_proposed_by_owner.sql` - Fix cleaning_schedule proposed_by
- `fix_missing_gite_id_in_reservations.sql` - Correction FK gite_id

**Status** : ✅ Exécutées avec succès

---

### migrations_utilitaires/ (8 fichiers)
**Scripts utilitaires & diagnostics (usage unique)**
- `copy_3eme_to_trevoux.sql` - Copie données entre gîtes (une fois)
- `check_checklist_templates.sql` - Vérification structure checklists
- `diagnostic_infos_gites.sql` - Diagnostic colonnes infos_gites
- `verify_infos_gites.sql` - Vérification données infos_gites
- `AUDIT_cleaning_schedule.sql` - Audit planning ménages
- `ADD_FAQ_TRANSLATIONS.sql` - Ajout traductions FAQ
- `AUDIT_COLONNES_INFOS_GITES.sql` - Audit colonnes infos_gites
- `update_activites_gites_structure.sql` - MAJ structure activités
- `README_INFOS_GITES_VS_INFOS_PRATIQUES.md` - Doc migration tables

**Status** : ✅ Exécutés (ne plus réutiliser)

---

### Racine archives/ (1 fichier)
- `SCHEMA_COMPLET_FINAL_2026.sql` - Ancien schéma complet (12/01/2026)

**Status** : ⚠️ REMPLACÉ par `SCHEMA_COMPLET_PRODUCTION_23JAN2026.sql`

---

## 📋 Fichiers SQL Actifs (dans /sql/)

**5 fichiers essentiels à conserver** :
1. ✅ `SCHEMA_COMPLET_PRODUCTION_23JAN2026.sql` - **Schéma one-shot production**
2. ✅ `CLEANUP_TABLES_OBSOLETES_23JAN2026.sql` - Suppression tables obsolètes
3. ✅ `fix_cleaning_schedule_rls.sql` - Fix RLS cleaning_schedule
4. ✅ `fix_postgrest_infos_gites.sql` - Fix RLS infos_gites
5. ✅ `README.md` - Documentation

---

## ⚠️ IMPORTANT

### Restauration d'une Migration
Si besoin de restaurer une migration archivée :
1. Copier fichier depuis `_archives/sql_ancien/`
2. Analyser le contenu (ne PAS exécuter aveuglément)
3. Vérifier si déjà appliqué en production
4. Consulter `DESCRIPTION_COMPLETE_SITE.md` section BDD

### Référence Tables Supprimées
Voir `_archives/TABLES_SUPPRIMEES_23JAN2026.md` pour structures complètes

---

**Date archivage** : 23 janvier 2026  
**Responsable** : Nettoyage complet BDD v4.4  
**Total fichiers archivés** : 22 fichiers SQL
