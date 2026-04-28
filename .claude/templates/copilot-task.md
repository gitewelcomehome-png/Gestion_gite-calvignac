# Template — Instruction Copilot

> Copie dans le chat Copilot (panel droit). Remplace les [VALEURS].

---

**Fichier :** `[chemin/vers/fichier.js]` ligne ~[XX]

**Action :** [Ce qu'il faut faire en 1 phrase précise]

**Pattern à modifier :**
```javascript
// AVANT
[code actuel]

// APRÈS
[code cible]
```

**Résultat attendu :** [Comportement observable]

**Commit message :** `"[type]: [description courte]"`
> types : feat / fix / refactor / chore / style / docs

---
### Règles Copilot
- Ne modifie QUE le fichier mentionné
- Pas de reformatage de code non lié
- 1 commit = 1 modification atomique
- Push sur `preprod` uniquement
