# 🚀 GUIDE PROJET - Gestion Gîte Multi-Tenant

**Projet** : Application SaaS de gestion de gîtes  
**Version** : 2.0 (nouvelle architecture)  
**Date** : 8 janvier 2026

---

## 📋 Vue d'ensemble

### Architecture actuelle
- **Frontend** : HTML/JS/CSS vanilla (pas de framework)
- **Backend** : Supabase (PostgreSQL + Auth + RLS)
- **Hébergement** : Vercel (déploiement automatique depuis main)
- **Projet Supabase** : gites-calvignac-test (zgdjpetmnmetfkboxeyo)

### Schéma base de données (Multi-tenant simplifié)
```
organizations (tenants)
  ↓
gites (liés à organization_id)
  ↓
reservations (liés à gite_id + organization_id)

organization_members (rôles users)
  → owner, admin, manager, viewer
```

---

## 🔑 Accès & Comptes

### Supabase Dashboard
- **URL** : https://supabase.com/dashboard/project/zgdjpetmnmetfkboxeyo
- **Projet** : gites-calvignac-test
- **Tables** : organizations, gites, organization_members, reservations

### Compte test créé
- **Email** : stephanecalvignac@hotmail.fr
- **Organisation** : Mon Gîte (slug: mon-gite)
- **Rôle** : owner

### Configuration locale
- **Fichier** : `config.local.js` (non commité, dans .gitignore)
- **Variables** : SUPABASE_URL, SUPABASE_KEY

---

## 🛠️ Développement local

### Démarrer le serveur
```bash
cd /workspaces/Gestion_gite-calvignac
python3 -m http.server 8080
# Accès : http://localhost:8080
```

### Workflow
1. **Inscription** : onboarding.html → email + password
2. **Connexion** : login.html → index.html (dashboard)
3. **Déconnexion** : logout.html

### Structure projet
```
├── index.html           # Dashboard principal
├── login.html           # Connexion
├── onboarding.html      # Inscription
├── logout.html          # Déconnexion
├── config.local.js      # Config Supabase (local uniquement)
├── js/
│   ├── auth.js          # Gestion authentification
│   ├── shared-config.js # Config globale
│   ├── reservations.js  # ⚠️ À adapter au nouveau schéma
│   ├── gites-manager.js # ⚠️ À adapter
│   └── ...
└── sql/fresh-start/
    └── 01_schema_clean.sql  # Schéma BDD complet
```

---

## 🗄️ Base de données

### Script d'initialisation
**Fichier** : `sql/fresh-start/01_schema_clean.sql`

**Contenu** :
- 4 tables : organizations, gites, organization_members, reservations
- RLS activé sur toutes les tables
- Policies configurées
- Fonction helper : `get_user_orgs()`

### Commandes SQL utiles
```sql
-- Voir les organisations
SELECT * FROM organizations;

-- Voir les membres
SELECT o.name, om.role, u.email 
FROM organizations o
JOIN organization_members om ON o.id = om.organization_id
JOIN auth.users u ON om.user_id = u.id;

-- Voir les gîtes
SELECT g.name, o.name as organization 
FROM gites g
JOIN organizations o ON g.organization_id = o.id;

-- Nettoyer tout (DEV uniquement)
DELETE FROM reservations;
DELETE FROM gites;
DELETE FROM organization_members;
DELETE FROM organizations;
DELETE FROM auth.users;
```

---

## 📝 TODO - État actuel

### ✅ Terminé
- [x] Nouveau projet Supabase créé
- [x] Schéma BDD multi-tenant
- [x] RLS activé + policies
- [x] Inscription/connexion fonctionnelle
- [x] 1 utilisateur + 1 organisation créés

### 🚧 En cours (PRIORITÉ)
- [ ] **Corriger 5 erreurs JavaScript** :
  - dashboard.js : await hors async
  - statistiques.js : variable colors déclarée 2x
  - draps.js : syntaxe
  - index.html : fin fichier
  - widget-horaires-clients.js : syntaxe
- [ ] **Supprimer références tables obsolètes** :
  - user_roles (remplacé par organization_members.role)
  - commits_log (inutile)

### 🔜 Prochaines étapes
1. **Adapter au nouveau schéma** (2-3h)
   - js/reservations.js
   - js/gites-manager.js
   - index.html (sections gîtes)

2. **Créer interface config gîtes** (1-2h)
   - Page ou modal pour ajouter/modifier gîtes
   - Remplace l'étape 2 d'onboarding (abandonnée)

3. **Sécurité Phase 2** (1-2h)
   - Masquer clés API (variables d'env Vercel)
   - Sanitization XSS basique

---

## 🔒 Sécurité

### Score actuel : 4/10
- ✅ RLS activé
- ✅ Auth Supabase
- ❌ Clés API visibles dans code
- ❌ Pas de sanitization XSS
- ❌ Pas de RGPD

### Phases prévues
1. **Phase 2** : Masquer secrets (→ 6/10)
2. **Phase 3** : XSS protection (→ 8/10)
3. **Phase 4** : RGPD complet (→ 9/10)

---

## 📚 Documentation archivée

Les anciens guides de migration sont dans `_archives/guides_migration_2026/` :
- GUIDE_MIGRATION_COMPLET.md
- GUIDE_SOLUTION_ROBUSTE.md
- PLAN_MIGRATION_SUPABASE.md
- RAPPORT_AUDIT_BDD_MIGRATION.md

**⚠️ Ces guides sont obsolètes** : ils décrivent l'approche RPC/onboarding complexe abandonnée.

---

## 🆘 Troubleshooting

### Boucle de redirection
**Symptôme** : login.html → index.html → login.html  
**Cause** : Pas d'organisation pour l'utilisateur  
**Solution** :
```sql
-- Créer une organisation et ajouter l'utilisateur
INSERT INTO organizations (name, slug) VALUES ('Ma Société', 'ma-societe');
INSERT INTO organization_members (organization_id, user_id, role)
SELECT o.id, u.id, 'owner'
FROM organizations o, auth.users u
WHERE o.slug = 'ma-societe' AND u.email = 'votre@email.com';
```

### Erreurs "table does not exist"
**Cause** : Tables de l'ancien schéma référencées dans le code  
**Solution** : Adapter le code ou créer des vues de compatibilité

### Cache Supabase (404 sur RPC)
**Solution** : Attendre 30s après création fonction, ou redémarrer projet Supabase

---

## 🎯 Prochaine session

**Commandes de démarrage** :
```bash
cd /workspaces/Gestion_gite-calvignac
python3 -m http.server 8080
# Ouvrir : http://localhost:8080/index.html
# F12 pour voir les erreurs console
```

**Focus** : Corriger les 5 erreurs JS pour débloquer l'application.

---

**Dernière mise à jour** : 8 janvier 2026, 15:30
