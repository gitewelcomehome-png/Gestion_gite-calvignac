# 🛡️ PHASE 3 : Protection XSS - Plan d'action

## 📊 Analyse initiale

**Vulnérabilités détectées** :
- ✅ **100+ usages de `innerHTML`** (injection HTML possible)
- ✅ **2 usages de `document.write`** (dangereux)
- ✅ **0 `insertAdjacentHTML`** (bon)

## 🎯 Objectif

**Score cible** : 6.5/10 → 8/10

**Moyens** :
1. Installer **DOMPurify** (bibliothèque de sanitization)
2. Créer **js/security-utils.js** avec fonctions sécurisées
3. Remplacer tous les `innerHTML` dangereux
4. Ajouter validation d'inputs

## 📝 Stratégie de migration

### Étape 1 : Installation DOMPurify ✅
```bash
npm install dompurify
```

### Étape 2 : Créer security-utils.js
Fonctions :
- `setInnerHTML(element, html)` - innerHTML sécurisé
- `sanitize(html)` - Nettoyer HTML
- `validateEmail(email)` - Valider email
- `validatePhone(phone)` - Valider téléphone
- `validateAmount(amount)` - Valider montant

### Étape 3 : Migration par priorité

#### 🔴 CRITIQUE (données utilisateur)
- [ ] js/fiches-clients.js (noms, commentaires)
- [ ] js/checklists.js (notes)
- [ ] js/charges.js (descriptions)
- [ ] js/decouvrir.js (activités)

#### 🟡 IMPORTANT (données mixtes)
- [ ] index.html (notifications, tooltips)
- [ ] js/sync-ical.js (messages sync)
- [ ] js/fiscalite-v2.js (données financières)

#### 🟢 FAIBLE (contenu statique)
- [ ] js/draps.js
- [ ] js/statistiques.js
- [ ] js/widget-horaires-clients.js

### Étape 4 : Validation inputs
- [ ] Formulaire réservations
- [ ] Formulaire charges
- [ ] Formulaire fiches clients
- [ ] Formulaire activités

## 🚀 Execution

**Session 1** (1h30) :
1. Installer DOMPurify
2. Créer security-utils.js
3. Migrer fichiers CRITIQUES

**Session 2** (1h) :
4. Migrer fichiers IMPORTANTS
5. Tests

**Session 3** (30min) :
6. Validation inputs
7. Documentation
8. Merge

## 📦 Fichiers à créer/modifier

**Nouveaux** :
- js/security-utils.js
- documentation/SECURITE_XSS.md

**Modifiés** :
- index.html (charger DOMPurify + security-utils)
- ~15 fichiers JS

## ✅ Critères de réussite

- [ ] DOMPurify installé et fonctionnel
- [ ] Tous les innerHTML de données utilisateur sécurisés
- [ ] Validation sur tous les formulaires
- [ ] Tests XSS passés
- [ ] Documentation complète
- [ ] Score 8/10 atteint
