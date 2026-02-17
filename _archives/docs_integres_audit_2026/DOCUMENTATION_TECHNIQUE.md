# 📋 Documentation Technique - Gestion Gîte Calvignac

Documentation technique consolidée du projet.

---

## 🏗️ Architecture

**Documentation complète** : [../ARCHITECTURE.md](../ARCHITECTURE.md)

### Stack Technique
- **Frontend** : HTML5, CSS3, JavaScript (Vanilla)
- **Backend** : Supabase (PostgreSQL + Auth + RLS)
- **Hosting** : Vercel
- **Style** : CSS custom + responsive mobile

### Structure Base de Données
**22 tables actives** - Détails complets dans [../DESCRIPTION_COMPLETE_SITE.md](../DESCRIPTION_COMPLETE_SITE.md)

**Tables principales** :
- `reservations` - Réservations clients
- `gites` - Informations gîtes
- `infos_gites` - 119 colonnes bilingues (infos pratiques, traductions auto)
- `fiscalite` - Comptabilité et fiscalité
- `charges` - Charges par gîte
- `cleaning_schedule` - Planning ménages
- `stocks_draps` - Gestion linge

**Référence structure** : STRUCTURE_TABLES_FISCALITE.md (tables comptables)

---

## 🔒 Sécurité

### RLS (Row Level Security)
Toutes les tables utilisent RLS pour isolation multi-tenant :
- Filtrage automatique par `owner_user_id`
- Policies SELECT/INSERT/UPDATE/DELETE
- Vérifications auth Supabase

### Authentication
- Supabase Auth (email/password)
- Sessions persistantes
- Tokens JWT

**Audit** : `scripts/audit-securite.sh`

---

## 💾 Données

### Schéma Production
**Fichier one-shot** : [../sql/SCHEMA_COMPLET_PROD_2026.sql](../sql/SCHEMA_COMPLET_PROD_2026.sql)

Contient :
- Création 22 tables actives
- Index optimisés
- Policies RLS
- Fonctions PostgreSQL

### Nettoyage BDD
**Détails** : [NETTOYAGE_BDD_23JAN2026.md](NETTOYAGE_BDD_23JAN2026.md)
- 7 tables obsolètes supprimées
- Script : [../sql/CLEANUP_TABLES_OBSOLETES_23JAN2026.sql](../sql/CLEANUP_TABLES_OBSOLETES_23JAN2026.sql)

---

## 🚀 Fonctionnalités Implémentées

### Frais Kilométriques
**Documentation** : IMPLEMENTATION_KILOMETRES.md

- Saisie trajets par gîte
- Calcul automatique barème
- Récapitulatif annuel
- Export Excel

**Tables** :
- `km_trajets` - Trajets enregistrés
- `km_baremes` - Barèmes officiels

### Traduction Automatique
**Statut** : ✅ Activé

- 6 langues (FR, EN, DE, ES, IT, NL)
- Traduction auto infos gîtes (119 colonnes)
- API DeepL/Google Translate
- Cache traductions

**Colonnes** : `*_en`, `*_de`, `*_es`, `*_it`, `*_nl` dans `infos_gites`

### Amortissements Automatiques
- Calcul linéaire automatique
- Prorata temporis
- Par exercice fiscal
- Export comptable

**Table** : `fiscalite` (colonne `amortissements`)

### Planning Ménage Automatique
- Génération auto selon règles
- Calcul durée nettoyage
- Notifications
- Historique

**Tables** : `cleaning_schedule`, `cleaning_rules`

---

## 📱 Responsive Mobile

### Breakpoints
- Desktop : > 1024px
- Tablet : 768px - 1024px
- Mobile : < 768px

### Adaptations
- Menu hamburger
- Colonnes tableaux réduites
- Formulaires tactiles
- Boutons agrandis

**CSS** : `css/mobile/`

---

## 🔧 Outils Développement

### Scripts Actifs
```
scripts/
├── audit-securite.sh         → Audit sécurité complet
└── generate-test-token.js    → Génération tokens test
```

### SQL Maintenance
```
sql/
├── create_optimized_indexes.sql        → Index performance
├── SCHEMA_COMPLET_PROD_2026.sql        → Schéma complet
├── CLEANUP_TABLES_OBSOLETES_23JAN2026.sql → Nettoyage
└── verify_prod_structure.sql           → Vérification
```

---

## 📚 Références

### Documentation Projet
- [ARCHITECTURE.md](../ARCHITECTURE.md) - Architecture technique
- [DESCRIPTION_COMPLETE_SITE.md](../DESCRIPTION_COMPLETE_SITE.md) - Documentation master
- [ERREURS_CRITIQUES.md](../ERREURS_CRITIQUES.md) - Bugs historiques
- [README.md](../README.md) - Guide démarrage

### Documentation Opérationnelle
- [GUIDE_OPERATIONNEL.md](GUIDE_OPERATIONNEL.md) - Procédures
- [STATUS_PROJET.md](STATUS_PROJET.md) - Statut projet
- [PLAN_COMMERCIALISATION.md](PLAN_COMMERCIALISATION.md) - Plan commercial

### Archives
- [../_archives/README_ARCHIVES.md](../_archives/README_ARCHIVES.md) - Index archives
- [NETTOYAGE_BDD_23JAN2026.md](NETTOYAGE_BDD_23JAN2026.md) - Rapport nettoyage

---

## ⚠️ Notes Important

### En Production
- ✅ Site actif avec clients réels
- ❌ Aucune action dangereuse
- ✅ Tests obligatoires avant déploiement
- ❌ Pas de hardcoding valeurs

### Modifications BDD
1. Toujours backup avant
2. Tester en dev d'abord
3. Vérifier RLS
4. Documenter changements

---

*Version 4.4 - Janvier 2026*
