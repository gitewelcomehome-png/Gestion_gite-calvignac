# 🔍 AUDIT FISCAL & COMPTABLE - PAGE FISCALITÉ
**Date:** 19 janvier 2026  
**Périmètre:** Module fiscalité LMP (js/fiscalite-v2.js + tab-fiscalite-v2.html)  
**Statut:** ⚠️ ERREURS CRITIQUES DÉTECTÉES

---

## 🚨 ERREURS CRITIQUES

### 1. ❌ COTISATIONS URSSAF - CALCUL ERRONÉ

**Problème:** Le calcul utilise des taux simplifiés incorrects pour 2024/2025.

**Code actuel (FAUX):**
```javascript
cotisationsSociales = benefice * 0.22; // 22%
csgCrds = benefice * 0.097;           // 9.7%
formationPro = ca * 0.0025;           // 0.25%
```

**Réalité légale 2024 (LMP/TNS):**
- **Maladie-Maternité:** 0% (exonération si < 46 368 €/an - 110% PASS)
- **Indemnités journalières:** 0.85% du revenu
- **Retraite de base:** 17.75% du revenu (plafonné)
- **Retraite complémentaire:** 7% du revenu
- **Invalidité-Décès:** 1.30% du revenu
- **CSG-CRDS:** 9.70% du revenu
- **Allocations familiales:** 0 à 3.10% selon revenu (progressif 110%-140% PASS)
- **Formation professionnelle:** 0.25% du CA

**Taux total réel:** Environ **36.75%** du bénéfice (et non 22% + 9.7% = 31.7%)

**Impact financier:**
- Sous-estimation de ~5% des cotisations
- Sur un bénéfice de 50 000 € → **erreur de 2 500 €**

---

### 2. ❌ MINIMUM URSSAF - LOGIQUE INCORRECTE

**Problème:** Le minimum de 1200€ ne s'applique PAS à tous les TNS.

**Code actuel (FAUX):**
```javascript
if (urssaf < 1200) {
    urssaf = 1200;
}
// Même si bénéfice négatif ou nul, minimum de 1200€ à payer
```

**Réalité légale:**
- **URSSAF minimum 1200€** = vrai pour **micro-entrepreneurs** uniquement
- **LMP au réel:** cotisations = 0€ si bénéfice ≤ 0€
- **Cotisations minimales LMP:** basées sur un revenu forfaitaire (environ 600 SMIC horaire pour retraite)

**Impact:**
- Obligation de payer 1200€ même en cas de perte = **FAUX et pénalisant**
- Si bénéfice = -10 000€ → cotisations devraient être 0€, pas 1200€

---

### 3. ⚠️ CALCUL TRIMESTRES RETRAITE - SEUIL INCORRECT

**Code actuel:**
```javascript
const smic2024 = 11873.10;
if (benefice >= smic2024 * 6) trimestres = 4;
```

**Réalité 2024:**
- 1 trimestre = **600 × SMIC horaire** = 600 × 11.65 € = **6 990 €**
- 4 trimestres = **6 990 × 4** = **27 960 €** (non 71 238 €)

**Code attendu:**
```javascript
const smicHoraire2024 = 11.65;
const seuil1Trimestre = 600 * smicHoraire2024; // 6990 €
if (benefice >= seuil1Trimestre * 4) trimestres = 4;
else if (benefice >= seuil1Trimestre * 3) trimestres = 3;
else if (benefice >= seuil1Trimestre * 2) trimestres = 2;
else if (benefice >= seuil1Trimestre) trimestres = 1;
```

**Impact:**
- Seuils complètement faux
- Sous-estimation dramatique des trimestres validés

---

### 4. ❌ BARÈME KILOMÉTRIQUE - ANNÉE 2024 OBSOLÈTE

**Code actuel:** Barème 2024
```javascript
5: [
    { max: 5000, formule: (d) => d * 0.636 },
    { max: 20000, formule: (d) => d * 0.357 + 1395 },
    { max: Infinity, formule: (d) => d * 0.427 }
]
```

**Barème officiel 2025 (5 CV):**
```
Jusqu'à 5 000 km:   d × 0.679
De 5 001 à 20 000:  (d × 0.380) + 1 495
Au-delà de 20 000:  d × 0.455
```

**Impact:**
- Sous-déduction fiscale sur les frais de véhicule
- Perte d'environ **7% de déduction** (ex: 10 000 km = 160 € de perte)

---

### 5. ⚠️ IMPÔT SUR LE REVENU - BARÈME 2024 PÉRIMÉ

**Code actuel:** Utilise barème 2024

**Barème 2025 (à appliquer):**
- Jusqu'à **11 294 €:** 0%
- De 11 295 € à **28 797 €:** 11%
- De 28 798 € à **82 341 €:** 30%
- De 82 342 € à **177 106 €:** 41%
- Au-delà de 177 106 €: 45%

**Statut:** ✅ Barème correct (inchangé 2024→2025)

---

### 6. ❌ ABATTEMENT SALAIRES - PLAFONNEMENT MANQUANT

**Code actuel:**
```javascript
const salaireMadame = salaireMadameBrut * 0.90; // 10% d'abattement
const salaireMonsieur = salaireMonsieurBrut * 0.90;
```

**Réalité légale:**
- Abattement 10% **plafonné à 13 522 €** par personne
- Abattement minimum de **472 €** par personne

**Code attendu:**
```javascript
function appliquerAbattementSalaire(salaireBrut) {
    const abattement = Math.max(472, Math.min(salaireBrut * 0.10, 13522));
    return salaireBrut - abattement;
}
```

**Impact:**
- Sur-déduction pour les hauts salaires
- Sous-déduction pour les très bas salaires

---

### 7. ⚠️ ALLOCATIONS FAMILIALES - CALCUL SIMPLIFIÉ

**Code actuel:**
```javascript
const pass2024 = 46368;
if (benefice > pass2024 * 1.1) {
    const baseAlloc = Math.min(benefice - (pass2024 * 1.1), pass2024 * 0.3);
    const tauxAlloc = (baseAlloc / (pass2024 * 0.3)) * 0.031;
    allocations = benefice * tauxAlloc;
}
```

**Problème:**
- Formule approximative (correcte en principe)
- PASS 2025 = **46 368 €** (identique 2024) ✅
- Mais calcul progressif pourrait être plus précis

**Statut:** ⚠️ Acceptable mais améliorable

---

### 8. ❌ CFE - PAS PRIS EN COMPTE SÉPARÉMENT

**Observation:** La CFE (Cotisation Foncière des Entreprises) est mélangée dans les charges annuelles par gîte.

**Problème:**
- CFE = impôt déductible du résultat fiscal
- Devrait être identifiée séparément pour déclaration 2031
- Base minimum CFE LMP = environ **224 à 7 000 €** selon CA

**Impact:**
- Pas de calcul estimatif de la CFE
- Risque d'oubli dans la déclaration réelle

---

### 9. ⚠️ AMORTISSEMENT - RÈGLES INCOMPLÈTES

**Code actuel:** Seuil 600€ HT / 720€ TTC

**Règles supplémentaires manquantes:**
- **Mobilier/équipement <  500 €:** déductible immédiatement (tolérance administration)
- **Biens d'occasion:** durée réduite possible
- **Composants immobiliers:** distinction gros œuvre / second œuvre / équipements
- **Amortissement linéaire** obligatoire pour LMNP (non dégressif)

---

### 10. ⚠️ PRORATA TEMPORIS - NON GÉRÉ

**Observation:** Aucune gestion du prorata temporis pour l'année de début/fin d'activité.

**Exemple:**
- Début activité le 1er juillet 2025
- Charges annuelles = 10 000 €
- À déduire en 2025 = **5 000 €** (6 mois sur 12)

**Code manquant:** Calcul pro-rata selon date début activité

---

## 📊 SYNTHÈSE DES IMPACTS

| Erreur | Impact Financier | Gravité | Urgence |
|--------|------------------|---------|---------|
| Taux URSSAF incorrects | Sous-estimation ~5% | 🔴 CRITIQUE | IMMÉDIATE |
| Minimum URSSAF faux | Surcharge jusqu'à 1200€ | 🔴 CRITIQUE | IMMÉDIATE |
| Trimestres retraite | Calcul complètement faux | 🔴 CRITIQUE | HAUTE |
| Barème km 2025 | Perte ~7% déduction | 🟠 IMPORTANT | HAUTE |
| Abattement salaire plafonné | Erreur IR ≥100€ | 🟠 IMPORTANT | MOYENNE |
| CFE non identifiée | Risque déclaratif | 🟡 MODÉRÉ | MOYENNE |
| Amortissement incomplet | Déduction sub-optimale | 🟡 MODÉRÉ | BASSE |
| Prorata temporis | Erreur année N | 🟡 MODÉRÉ | BASSE |

---

## ✅ POINTS CONFORMES

1. **Barème IR 2025:** ✅ Correct (inchangé vs 2024)
2. **PASS 2025:** ✅ Correct (46 368 €)
3. **Calcul ratio résidence:** ✅ Correct
4. **Déductibilité charges:** ✅ Liste complète et conforme
5. **Gestion multi-gîtes:** ✅ Architecture propre
6. **Sauvegarde en base:** ✅ Historique conservé

---

## 🔧 ACTIONS CORRECTIVES REQUISES

### Priorité 1 (URGENT - Correction immédiate)

1. **Corriger les taux URSSAF:**
   - Détailler toutes les cotisations séparément
   - Appliquer les vrais taux 2024/2025
   - Total attendu: ~36-38% du bénéfice

2. **Supprimer le minimum URSSAF de 1200€:**
   - Ne s'applique PAS au LMP au réel
   - Cotisations = 0€ si bénéfice ≤ 0€

3. **Corriger calcul trimestres retraite:**
   - 1 trimestre = 6 990 € (600 × 11.65 €)
   - 4 trimestres = 27 960 €

### Priorité 2 (IMPORTANT - Sous 7 jours)

4. **Mettre à jour barème kilométrique 2025:**
   - Nouveaux coefficients officiels
   - Gain ~7% de déduction

5. **Ajouter plafonnement abattement salaires:**
   - Min 472 € / Max 13 522 € par personne

### Priorité 3 (AMÉLIORATION - Sous 30 jours)

6. **Identifier CFE séparément:**
   - Champ dédié par gîte
   - Estimation automatique selon CA

7. **Gérer prorata temporis:**
   - Date début activité
   - Calcul charges proportionnelles

8. **Améliorer règles amortissement:**
   - Seuil 500€ toléré
   - Durées biens d'occasion

---

## 📋 CHECKLIST VALIDATION COMPTABLE

- [ ] Taux cotisations sociales 2025 vérifiés avec expert-comptable
- [ ] Minimum URSSAF confirmé NON applicable au LMP réel
- [ ] Barème kilométrique 2025 mis à jour (source officielle)
- [ ] Plafonds abattement salaire intégrés
- [ ] CFE identifiée et estimée
- [ ] Prorata temporis géré pour année N
- [ ] Tests avec expert-comptable sur cas réels
- [ ] Documentation utilisateur mise à jour

---

## 📚 SOURCES LÉGALES

1. **URSSAF Indépendants 2025:** https://www.secu-independants.fr
2. **Barème kilométrique 2025:** BOFiP-Impôts (publié février 2025)
3. **Barème IR 2025:** Article 197 CGI
4. **Trimestres retraite:** SMIC 11.65€ × 600 = 6 990€/trimestre
5. **Abattement salaires:** Article 83 CGI (plafonds 2025)

---

## ⚠️ DISCLAIMER

Cette page calcule des **estimations fiscales** et non des déclarations officielles. 
**Un expert-comptable doit TOUJOURS valider** les chiffres avant déclaration réelle.

Les erreurs détectées peuvent entraîner:
- ❌ Sous-estimation de cotisations → redressement URSSAF
- ❌ Erreurs déclaratives → pénalités fiscales
- ❌ Perte de droits à la retraite (trimestres)

**RECOMMANDATION:** Corriger EN URGENCE les erreurs de Priorité 1.
