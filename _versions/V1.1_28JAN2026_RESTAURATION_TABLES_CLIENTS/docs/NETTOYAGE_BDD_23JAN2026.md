# 🧹 Nettoyage Base de Données & Fichiers - 23 Janvier 2026

## 📊 Résumé

**47 fichiers archivés** | **Base de données nettoyée** | **Structure optimisée**

---

## 🗄️ Base de Données

### Tables Supprimées (7)
1. **infos_pratiques** - Remplacée par infos_gites (119 colonnes bilingues)
2. **checklists** - Remplacée par checklist_templates + checklist_progress
3. **demandes_horaires** - Feature non implémentée
4. **evaluations_sejour** - Feature non implémentée
5. **problemes_signales** - Feature non implémentée
6. **retours_menage** - Feature trop complexe, non utilisée
7. **suivi_soldes_bancaires** - Feature non implémentée

→ **Script** : [sql/CLEANUP_TABLES_OBSOLETES_23JAN2026.sql](../sql/CLEANUP_TABLES_OBSOLETES_23JAN2026.sql)  
→ **Archive** : [_archives/TABLES_SUPPRIMEES_23JAN2026.md](../_archives/TABLES_SUPPRIMEES_23JAN2026.md)

### Tables Actives (22)
Voir [DESCRIPTION_COMPLETE_SITE.md](../DESCRIPTION_COMPLETE_SITE.md) - Section 4

---

## 📦 Fichiers Archivés

### SQL (22 fichiers)
```
_archives/sql_ancien/
├── migrations_multilingue/      (5 fichiers)
├── migrations_infos_gites/      (4 fichiers)
├── migrations_diverses/         (4 fichiers)
└── migrations_utilitaires/      (8 fichiers + schéma ancien)
```

### Documentation (18+ fichiers)
```
_archives/docs_obsoletes/
├── audits_anciens/              (4 audits intégrés)
├── guides_migration/            (6 guides appliqués)
└── readme_anciens/              (6 README consolidés)
```

### Scripts (7 fichiers)
```
_archives/scripts_obsoletes/
├── Migrations exécutées         (5 scripts)
└── Tests terminés               (2 scripts)
```

---

## 📁 Structure Propre

### Racine (6 fichiers)
- ARCHITECTURE.md
- DESCRIPTION_COMPLETE_SITE.md
- ERREURS_CRITIQUES.md
- README.md
- NETTOYAGE_COMPLET_23JAN2026.md
- RESUME_NETTOYAGE_23JAN2026.md

### /sql/ (4 fichiers)
- create_optimized_indexes.sql
- SCHEMA_COMPLET_PROD_2026.sql
- CLEANUP_TABLES_OBSOLETES_23JAN2026.sql
- verify_prod_structure.sql

### /scripts/ (2 fichiers)
- audit-securite.sh
- generate-test-token.js

---

## ⚠️ Important

### ❌ Ne JAMAIS
- Ré-exécuter les migrations archivées
- Utiliser les scripts obsolètes
- Restaurer les tables obsolètes sans analyse

### ✅ Toujours
- Consulter DESCRIPTION_COMPLETE_SITE.md
- Vérifier ERREURS_CRITIQUES.md
- Utiliser uniquement les fichiers /sql/ actifs

---

**Référence** : [_archives/README_ARCHIVES.md](../_archives/README_ARCHIVES.md)
