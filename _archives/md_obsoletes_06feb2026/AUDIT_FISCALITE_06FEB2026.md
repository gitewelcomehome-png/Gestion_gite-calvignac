# 🔍 AUDIT PAGE FISCALITÉ - 06 FEB 2026

## ⚠️ PROBLÈMES CRITIQUES

### 1. HARDCODE - Valeurs en dur (À CORRIGER)

#### ❌ Cotisations minimales dupliquées
**Ligne 357, 943, 1233** : `const COTISATIONS_MINIMALES_LMP = 1200;`
- Valeur répétée 3 fois dans le code
- Existe déjà dans `taux-fiscaux-config.js` mais pas utilisée partout
- **Solution** : Toujours utiliser `config.COTISATIONS_MINIMALES.montant`

#### ❌ Plafonds Micro-BIC hardcodés
**Lignes 351-356** :
```javascript
const PLAFOND_MICRO_NON_CLASSE = 15000;
const PLAFOND_MICRO_CLASSE = 77700;
const ABATTEMENT_NON_CLASSE = 0.30;
const ABATTEMENT_CLASSE = 0.50;
const TAUX_COTIS_MICRO_NON_CLASSE = 0.212;
const TAUX_COTIS_MICRO_CLASSE = 0.06;
```
- Ces valeurs existent dans `taux-fiscaux-config.js` ligne 100+
- **Solution** : Utiliser `config.MICRO_BIC.*`

#### ❌ Taux URSSAF hardcodés
**Ligne 2247** : `csgCrds: benefice * 0.097`
- Existe dans config : `config.URSSAF.csg_crds.taux`
- **Solution** : Utiliser la config

**Ligne 2260** : `if (totalCotisations < 1200)`
- Même problème : hardcode du minimum
- **Solution** : Utiliser `config.COTISATIONS_MINIMALES.montant`

#### ❌ Barème IR hardcodé (dashboard.js)
**dashboard.js lignes 1540-1555** :
```javascript
if (quotient > 177106) {
    impotParPart = (quotient - 177106) * 0.45 + 44797;
} else if (quotient > 78570) {
    impotParPart = (quotient - 78570) * 0.41 + 14372;
```
- Ces tranches existent dans `taux-fiscaux-config.js` ligne 119+
- **Solution** : Utiliser `config.BAREME_IR`

---

## 📊 ANALYSE CODE

### ✅ Points Positifs

1. **Configuration centralisée existante** : `taux-fiscaux-config.js` bien structuré
2. **Utilisation partielle** : 6 endroits utilisent `window.TAUX_FISCAUX.getConfig()`
3. **Commentaires utiles** : Bonne documentation des calculs URSSAF
4. **Pas de code mort** : Aucune fonction deprecated/unused trouvée

### ⚠️ Points à Améliorer

#### 1. Incohérence d'utilisation de la config
- Certains endroits utilisent la config
- D'autres continuent avec du hardcode
- **Impact** : Difficile de mettre à jour les taux pour 2027

#### 2. Duplication de constantes
**COTISATIONS_MINIMALES_LMP** défini 3 fois :
- Ligne 357 (fonction calculTempsReel)
- Ligne 943 (fonction recalcul LMP)  
- Ligne 1233 (fonction affichage LMP)

**Impact** : Si la valeur change (ex: 1500€ en 2027), il faut modifier 3 endroits + le config.

#### 3. Messages utilisateur avec valeurs hardcodées
**Ligne 873** : 
```javascript
noteText.textContent = 'Les cotisations sont calculées... (~1200-1500€/an...';
```
- Hardcode dans un message utilisateur
- **Solution** : Lire depuis la config pour afficher dynamiquement

---

## 🛠️ CORRECTIONS PRIORITAIRES

### Priorité 1 - URGENT (Impact production)

1. **Remplacer tous les `1200` par `config.COTISATIONS_MINIMALES.montant`**
   - fiscal ite-v2.js lignes : 357, 943, 1233, 2260
   - dashboard.js ligne : 1485

2. **Remplacer plafonds Micro-BIC**
   - Lignes 351-358 : Utiliser `config.MICRO_BIC.plafond_*`

### Priorité 2 - IMPORTANT (Maintenabilité)

3. **Remplacer taux URSSAF**
   - Ligne 2247 : `config.URSSAF.csg_crds.taux`
   - Tous les calculs de cotisations → utiliser config

4. **Remplacer barème IR (dashboard.js)**
   - Lignes 1540-1570 : Utiliser `config.BAREME_IR.tranches`

### Priorité 3 - AMÉLIORATION (Qualité)

5. **Messages dynamiques**
   - Ligne 873 : Lire montant depuis config
   - Ligne 927 : Idem

6. **Logs de debug**
   - Nettoyer les logs répétitifs `calculerChargesBien()`
   - Garder uniquement logs essentiels

---

## 📝 PLAN D'ACTION RECOMMANDÉ

### Phase 1 - Immédiat (30 min)
```javascript
// Au lieu de :
const COTISATIONS_MINIMALES_LMP = 1200;

// Utiliser :
const config = window.TAUX_FISCAUX.getConfig(annee);
const cotisationsMinimales = config.COTISATIONS_MINIMALES.montant || 1200;
```

### Phase 2 - Court terme (1h)
- Remplacer tous les plafonds et taux hardcodés
- Tester sur page Fiscalité 2026
- Vérifier calculs URSSAF

### Phase 3 - Moyen terme (2h)
- Refactoriser dashboard.js pour utiliser config IR
- Créer fonction utilitaire `calculerIR(revenu, nbParts, annee)`
- Centraliser tous les calculs fiscaux

---

## 🎯 BÉNÉFICES ATTENDUS

1. **Maintenance simplifiée** : 1 seul fichier à modifier pour les taux 2027
2. **Zéro erreur** : Plus de risque d'oublier un hardcode
3. **Traçabilité** : Taux source officielle documentée dans config
4. **Évolutivité** : Facile d'ajouter des années (2027, 2028...)

---

## 📋 CHECKLIST VALIDATION

- [ ] Tous les `1200` remplacés par config
- [ ] Tous les `0.097`, `0.22` remplacés
- [ ] Plafonds Micro-BIC depuis config
- [ ] Barème IR depuis config
- [ ] Messages utilisateur dynamiques
- [ ] Tests sur simulation 2026
- [ ] Tests avec futur année 2027
- [ ] Documentation mise à jour

---

## 🚨 NOTES IMPORTANTES

### Pourquoi c'est critique ?
1. **Production** : Site utilisé par clients réels
2. **Législation** : Taux changent chaque année (PASS, barèmes...)
3. **Erreurs coûteuses** : Mauvais calcul URSSAF/IR = problèmes fiscaux clients

### Prochaine échéance
**Janvier 2027** : Mise à jour annuelle des taux
- PASS 2027 (prévu ~47 500€)
- Barème IR 2027
- Cotisations minimales

Avec le hardcode actuel → **8 fichiers à modifier manuellement**
Avec la config → **1 seul fichier taux-fiscaux-config.js**

---

*Audit réalisé le 06 février 2026*
*Fichiers analysés : fiscalite-v2.js (6820 lignes), dashboard.js (3475 lignes), taux-fiscaux-config.js (401 lignes)*
