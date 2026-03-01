# 📂 STRUCTURE DU PROJET

> **Version** : v4.4  
> **Date** : 23 janvier 2026  
> **Statut** : 🟢 PRODUCTION

---

## 📁 Racine du Projet

```
/workspaces/Gestion_gite-calvignac/
│
├── 📄 README.md                           # Guide principal du projet
├── 📄 ARCHITECTURE.md                     # Architecture technique détaillée
├── 📄 DESCRIPTION_COMPLETE_SITE.md        # Documentation master complète
├── 📄 MODULES_JAVASCRIPT.md               # Documentation 42 modules JS
├── 📄 ERREURS_CRITIQUES.md                # Historique bugs critiques + solutions
├── 📄 index.html                          # Application principale (dashboard)
│
├── 📁 _archives/                          # Fichiers obsolètes archivés
│   ├── backups/
│   ├── docs_obsoletes/
│   ├── js_obsoletes/
│   ├── sql_obsoletes/
│   └── ... (60+ fichiers archivés)
│
├── 📁 business-plan/                      # Business plan (génération PDF)
│   ├── index.html
│   ├── analyse-concurrence.html
│   ├── business-model.html
│   └── ...
│
├── 📁 config/                             # Configuration déploiement
│   ├── vercel.json                       # Config Vercel
│   ├── manifest-fiche-client.json        # PWA manifest
│   └── sw-fiche-client.js                # Service Worker PWA
│
├── 📁 css/                                # Styles CSS
│   ├── flat-outline.css                  # Style principal Neo-Brutalism
│   ├── header-colonne.css
│   ├── icons.css
│   └── mobile/                           # Styles mobiles
│
├── 📁 docs/                               # Documentation détaillée
│   ├── README.md
│   ├── CONSOLIDATION_FINALE_23JAN2026.md
│   ├── DOCUMENTATION_TECHNIQUE.md
│   ├── GUIDE_OPERATIONNEL.md
│   ├── NETTOYAGE_BDD_23JAN2026.md
│   ├── PLAN_COMMERCIALISATION.md
│   └── STATUS_PROJET.md
│
├── 📁 images/                             # Assets images
│
├── 📁 js/                                 # Modules JavaScript (42 fichiers)
│   ├── 🔧 Configuration & Sécurité
│   │   ├── shared-config.js
│   │   ├── auth.js
│   │   ├── security-utils.js
│   │   ├── validation-utils.js
│   │   ├── error-logger.js
│   │   └── rate-limiter.js
│   │
│   ├── 🏢 Modules Métier
│   │   ├── gites-manager.js              # Singleton gestion gîtes
│   │   ├── dashboard.js                  # Logique dashboard (2627 lignes)
│   │   ├── reservations.js               # CRUD réservations
│   │   ├── sync-ical-v2.js               # Import iCal
│   │   ├── menage.js                     # Planning ménage auto
│   │   ├── cleaning-rules.js             # Règles ménage
│   │   ├── draps.js                      # Gestion linge
│   │   ├── fiscalite-v2.js               # Fiscalité LMNP (5364 lignes)
│   │   ├── taux-fiscaux-config.js        # Config taux fiscaux
│   │   ├── km-manager.js                 # Kilomètres professionnels
│   │   ├── charges.js                    # Charges déductibles
│   │   ├── calendrier-tarifs.js          # Calendrier tarifs (2308 lignes)
│   │   └── remplissage-auto-tarifs.js
│   │
│   ├── 📱 Fiches Clients
│   │   ├── infos-gites.js                # Infos gîtes (2267 lignes)
│   │   ├── checklists.js                 # Checklists bilingues
│   │   ├── faq.js                        # FAQ bilingues
│   │   ├── decouvrir.js                  # Activités touristiques
│   │   ├── fiche-client-app.js           # PWA client (2799 lignes)
│   │   └── fiches-clients.js             # Gestion tokens
│   │
│   ├── 🧹 Femme de Ménage
│   │   └── femme-menage.js
│   │
│   └── 🛠️ Utilitaires
│       ├── statistiques.js
│       ├── archives.js
│       ├── gites-crud.js
│       ├── shared-utils.js
│       ├── icons.js
│       ├── mobile.js
│       └── ... (13 autres utilitaires)
│
├── 📁 pages/                              # Pages externes accessibles
│   ├── login.html                        # Authentification
│   ├── logout.html                       # Déconnexion
│   ├── onboarding.html                   # Premier accès
│   ├── fiche-client.html                 # 📱 Fiche client PWA bilingue
│   ├── femme-menage.html                 # 🧹 Interface femme ménage
│   └── validation.html                   # Validation ménages entreprise
│
├── 📁 scripts/                            # Scripts utilitaires
│
├── 📁 sql/                                # Scripts SQL et BDD
│   ├── README.md
│   ├── core/REBUILD_COMPLETE_DATABASE.sql
│   ├── core/REBUILD_COMPLETE_DATABASE_PART2.sql
│   ├── GUIDE_NETTOYAGE_BDD.md
│   ├── EXPLICATIONS_UNRESTRICTED.md
│   │
│   ├── 📁 securite/                      # Suppression tables BDD
│   │   ├── README_SECURITE_BDD.md
│   │   ├── FIX_USER_ROLES_RLS_RECURSION_2026-02-23.sql
│   │   ├── RLS_HARDENING_TABLES_RESTANTES_2026-02-23.sql
│   │   ├── fiche_client_rls_lot3_postcheck_20260223.sql
│   │   └── SUIVI_HEBDO_SECURITE_ADMIN_2026-02-23.sql
│   │
│   ├── 📁 rapports/                      # Rapports maintenance
│   │   ├── README.md
│   │   ├── NETTOYAGE_FINAL_RAPPORT_23JAN2026.md
│   │   └── PATCH_APPLIQUE_23JAN2026.md
│   │
│   ├── 📁 fixes/                         # Correctifs SQL
│   │   ├── README.md
│   │   └── fix_postgrest_infos_gites.sql
│   │
│   └── 📁 patches/                       # Patches code JS
│       ├── README.md
│       ├── NETTOYAGE_CODE_JS_PATCHES.sql
│       └── PATCH_NETTOYAGE_CODE_JS_23JAN2026.md
│
└── 📁 tabs/                               # Onglets dashboard
    ├── tab-dashboard.html                # Vue d'ensemble
    ├── tab-reservations.html             # Réservations
    ├── tab-menage.html                   # Planning ménage
    ├── tab-draps.html                    # Gestion linge
    ├── tab-fiscalite-v2.html             # Fiscalité LMNP
    ├── tab-infos-gites.html              # Infos gîtes
    ├── tab-checklists.html               # Check-in/out
    ├── tab-faq.html                      # FAQ
    ├── tab-decouvrir.html                # Activités
    ├── tab-gestion.html                  # Paramètres gîtes
    ├── tab-statistiques.html             # Stats & graphiques
    └── mobile/                           # Versions mobiles
```

---

## 📊 Statistiques

**Fichiers** :
- 📄 Documentation racine : 6 fichiers (README, ARCHITECTURE, etc.)
- 🧩 Modules JavaScript : 42 fichiers
- 📑 Onglets dashboard : 15+ fichiers HTML
- 📱 Pages externes : 6 pages
- 🗄️ Scripts SQL : 18 fichiers organisés en 4 dossiers
- 📚 Documentation `/docs/` : 7 guides
- 🗂️ Archives : 60+ fichiers obsolètes

**Total estimé** : ~200 fichiers actifs

---

## 🔍 Fichiers Clés à Connaître

### Documentation Master
1. **README.md** - Démarrage rapide
2. **ARCHITECTURE.md** - Architecture technique complète
3. **DESCRIPTION_COMPLETE_SITE.md** - Documentation exhaustive (3500+ lignes)
4. **MODULES_JAVASCRIPT.md** - 42 modules JS documentés
5. **ERREURS_CRITIQUES.md** - Bugs connus et solutions

### Configuration
- `config/vercel.json` - Déploiement Vercel
- `config/manifest-fiche-client.json` - PWA config
- `.env.example` - Variables d'environnement

### Scripts SQL Essentiels
- `_archives/sql_cleanup_20260224_clean_rebuild/sql/core/SCHEMA_COMPLET_PRODUCTION_23JAN2026.sql` - Schéma complet BDD (historique)
- `sql/securite/` - Backups et suppression tables
- `sql/fixes/` - Correctifs RLS et permissions

### Modules JS Critiques
- `js/auth.js` - Authentification (AuthManager)
- `js/gites-manager.js` - Singleton gestion gîtes
- `js/dashboard.js` - Logique dashboard (2627 lignes)
- `js/fiscalite-v2.js` - Fiscalité LMNP (5364 lignes)
- `js/infos-gites.js` - Infos gîtes bilingues (2267 lignes)
- `js/fiche-client-app.js` - PWA client (2799 lignes)

---

## 🎯 Conventions de Rangement

### ✅ À la Racine
- Fichiers essentiels : README, ARCHITECTURE, DESCRIPTION
- index.html (page principale)
- Fichiers de configuration (.gitignore, .env.example)

### 📁 Dossiers Organisés
- **_archives/** : Tout fichier obsolète ou backup
- **docs/** : Documentation détaillée et guides
- **sql/** : Scripts SQL organisés par type (securite, fixes, patches, rapports)
- **js/** : Modules JavaScript (42 fichiers)
- **pages/** : Pages HTML accessibles publiquement
- **tabs/** : Onglets du dashboard
- **css/** : Styles
- **config/** : Configuration déploiement

### ⚠️ À Archiver Systématiquement
- Fichiers `.backup`
- Scripts SQL après exécution
- Anciennes versions de fichiers
- Tests et fichiers temporaires

---

## 📦 Git & Versioning

**Repository** : gitewelcomehome-png/Gestion_gite-calvignac  
**Branche** : main  
**Version** : v4.4  
**Dernier nettoyage** : 23 janvier 2026

---

**✅ Projet parfaitement organisé et documenté !**
