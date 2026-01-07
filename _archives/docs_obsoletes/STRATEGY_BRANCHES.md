# 🌳 Stratégie de Branches - Gestion Gîtes

## 📋 Vue d'ensemble

Le projet utilise une stratégie de branches pour sécuriser les développements et permettre des retours arrière si nécessaire.

## 🌿 Branches Principales

### `main` - Production active
- **Rôle** : Branche principale, code actuellement en production
- **Règle** : Ne merger QUE du code testé et validé
- **Protection** : ⚠️ Pas de commit direct, uniquement via PR

### `production/v5-stable` - Sauvegarde v5 🔒
- **Rôle** : **BACKUP de la version actuelle (v5) avant modifications sécurité**
- **Date snapshot** : 5 janvier 2026 (commit `8c516bc`)
- **État** : Fonctionnel mais vulnérabilités critiques (Score 3/10)
- **Usage** : Point de restauration si problèmes majeurs
- **Règle** : ❌ NE JAMAIS MODIFIER - Lecture seule

**Restaurer cette version** :
```bash
git checkout production/v5-stable
# Ou créer une nouvelle branche depuis ce point
git checkout -b hotfix/restore-v5 production/v5-stable
```

## 🔧 Branches de Développement

### `security/phase1-rls-auth` - Phase 1 Sécurité (ACTIVE)
- **Rôle** : Implémentation RLS + Authentification
- **Objectif** : Score 5/10
- **Durée estimée** : 2-3 semaines
- **Tâches** :
  - ✅ Activer RLS sur toutes les tables
  - ✅ Créer système d'authentification
  - ✅ Implémenter politiques RLS par rôle

**Workflow** :
```bash
# Travailler sur cette branche
git checkout security/phase1-rls-auth

# Commits réguliers
git add .
git commit -m "feat: ..."
git push

# À la fin de la phase, créer une PR vers main
```

### Branches futures (à créer)

#### `security/phase2-secrets`
- Protection des secrets (variables d'env)
- Régénération des clés API
- Score cible : 6.5/10

#### `security/phase3-xss-validation`
- Correction XSS
- Validation côté serveur
- Score cible : 8/10

#### `security/phase4-rgpd`
- Conformité RGPD
- CGU/Mentions légales
- Score cible : 9/10

## 🔄 Workflow Git

### Développement quotidien

```bash
# 1. S'assurer d'être sur la bonne branche
git checkout security/phase1-rls-auth

# 2. Récupérer les dernières modifications
git pull origin security/phase1-rls-auth

# 3. Faire vos modifications...

# 4. Committer
git add .
git commit -m "feat(auth): Ajout login page"
git push
```

### Créer une PR (Pull Request)

```bash
# Quand la phase est terminée et testée
# Aller sur GitHub → Pull Requests → New PR
# Base: main ← Compare: security/phase1-rls-auth
# Créer la PR avec description détaillée
```

### Restaurer la version stable

```bash
# Si problèmes critiques, revenir à v5 stable
git checkout production/v5-stable

# Créer une branche pour corriger
git checkout -b hotfix/emergency-fix

# Après correction
git checkout main
git merge hotfix/emergency-fix
```

## 🚨 Situations d'Urgence

### Besoin de revenir à la v5 stable immédiatement

```bash
# Option 1: Créer une branche depuis v5
git checkout -b restore-v5-temp production/v5-stable
git push -u origin restore-v5-temp
# Déployer restore-v5-temp sur Vercel temporairement

# Option 2: Reset main vers v5 (DESTRUCTIF)
git checkout main
git reset --hard production/v5-stable
git push --force origin main  # ⚠️ ATTENTION: Perte des commits récents
```

### Fusionner main dans votre branche de dev

```bash
# Si main a été mise à jour pendant votre développement
git checkout security/phase1-rls-auth
git merge main
# Résoudre les conflits si nécessaire
git push
```

## 📊 État actuel des branches

| Branche | État | Score Sécurité | Commits depuis v5 |
|---------|------|----------------|-------------------|
| `main` | ✅ Stable | 3/10 | 0 (= v5) |
| `production/v5-stable` | 🔒 Backup | 3/10 | - (snapshot) |
| `security/phase1-rls-auth` | 🚧 En cours | 3/10 → 5/10 | 0 |

## 🎯 Conventions de nommage

### Commits
```
feat(auth): Ajout système de login
fix(rls): Correction politique reservations
docs(security): Mise à jour audit
refactor(config): Nettoyage shared-config
test(auth): Tests authentification
chore(deps): Mise à jour dépendances
```

### Branches
```
security/phase1-rls-auth       # Développement sécurité
feature/nouvelle-fonctionnalite # Nouvelle feature
hotfix/correction-urgente       # Correction urgente
production/v5-stable            # Snapshot production
```

## 📌 Checklist avant merge vers main

- [ ] Tous les tests passent
- [ ] Code review effectué
- [ ] Documentation mise à jour
- [ ] Pas de clés API hardcodées
- [ ] RLS activé sur nouvelles tables
- [ ] Tests de sécurité effectués
- [ ] Vérification locale fonctionnelle
- [ ] Commit message descriptif

## 🔐 Protection des branches

### `main` (recommandé)
Via GitHub Settings → Branches → Add rule:
- ✅ Require pull request before merging
- ✅ Require approvals (1 minimum)
- ✅ Require status checks to pass

### `production/v5-stable`
- ✅ Lecture seule (ne pas modifier)
- ❌ Aucun commit direct autorisé

## 📖 Ressources

- [Git Branching Strategy](https://git-scm.com/book/en/v2/Git-Branching-Branching-Workflows)
- [GitHub Flow](https://guides.github.com/introduction/flow/)
- [Semantic Commit Messages](https://gist.github.com/joshbuchea/6f47e86d2510bce28f8e7f42ae84c716)

---

**Créé le** : 5 janvier 2026  
**Branche active** : `security/phase1-rls-auth`  
**Snapshot backup** : `production/v5-stable` (commit `8c516bc`)
