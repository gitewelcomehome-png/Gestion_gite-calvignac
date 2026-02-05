# ✅ CORRECTION COMPLÈTE URSSAF & SEUIL 23 000€

**Date** : 04 Février 2026  
**Fichiers modifiés** : 
- [js/fiscalite-v2.js](js/fiscalite-v2.js)
- [tabs/tab-fiscalite-v2.html](tabs/tab-fiscalite-v2.html)

**Statut** : ✅ Corrigé et conforme à la réglementation 2026

---

## 🔍 Problèmes Corrigés

### 1. Terminologie incorrecte ❌
- **"Cotis:"** → Remplacé par **"URSSAF:"** (plus clair)
- **"SSI:"** → Remplacé par **"URSSAF:"** (même institution)

### 2. Seuil 23 000€ non appliqué dans Micro-BIC ❌
Les options Micro-BIC (30% et 50%) calculaient **toujours** les cotisations URSSAF, même en dessous de 23 000€.

### 3. Messages non cohérents avec les calculs ❌
Le message affichait "Exonération" mais le calcul facturait quand même.

---

## 📋 RÈGLES APPLIQUÉES (2026)

### 🎯 Seuil Principal : 23 000€ de recettes annuelles

| CA Annuel | Statut | Cotisations URSSAF | Détail |
|-----------|--------|-------------------|--------|
| **< 23 000€** | LMNP | **0€** ✅ | Exonération totale |
| **≥ 23 000€** | LMNP | **Calculées** | 35-45% du bénéfice (Réel) ou % du CA (Micro) |
| Tout CA | LMP | **Min. 1 200€** | Cotisations SSI minimales |

### 📊 Détail par Type de Location

#### 1. Location meublée longue durée (bail classique)
- ❌ **< 23 000€/an** : Pas de cotisations URSSAF (seulement prélèvements sociaux 17,2%)
- ✅ **≥ 23 000€/an** : Affiliation URSSAF obligatoire

#### 2. Location meublée de tourisme NON classée (Airbnb, etc.)
- ❌ **< 23 000€/an** : Pas de cotisations URSSAF
- ✅ **≥ 23 000€/an** : Affiliation URSSAF obligatoire
- 📌 **Plafond Micro-BIC** : 15 000€ (depuis 2025)

#### 3. Location meublée de tourisme CLASSÉE (avec étoiles ⭐)
- ❌ **< 23 000€/an** : Pas de cotisations URSSAF
- ✅ **≥ 23 000€/an** : Affiliation URSSAF obligatoire
- 📌 **Plafond Micro-BIC** : 77 700€

#### 4. Chambres d'hôtes
- ❌ **< 6 123€/an** (13% du PASS 2025) : Pas de cotisations URSSAF
- ✅ **≥ 6 123€/an** : Affiliation URSSAF obligatoire

---

## ✅ Corrections Appliquées

### A. HTML - Interface ([tabs/tab-fiscalite-v2.html](tabs/tab-fiscalite-v2.html))

#### Option LMNP Réel
```html
<!-- AVANT -->
<span>URSSAF:</span> <!-- ✅ Déjà correct -->

<!-- Pas de changement nécessaire -->
```

#### Option Micro-BIC 30% (Non Classé)
```html
<!-- AVANT -->
<span>Cotis:</span>

<!-- APRÈS -->
<span>URSSAF:</span>
```

#### Option Micro-BIC 50% (Classé)
```html
<!-- AVANT -->
<span>Cotis:</span>

<!-- APRÈS -->
<span>URSSAF:</span>
```

#### Option LMP Réel
```html
<!-- AVANT -->
<span>SSI:</span>

<!-- APRÈS -->
<span>URSSAF:</span>
```

### B. JavaScript - Calculs ([js/fiscalite-v2.js](js/fiscalite-v2.js))

#### 1. LMNP Réel - Ligne ~1090
```javascript
// AVANT (Bug)
if (statutFiscal === 'lmp' && urssaf < COTISATIONS_MINIMALES_LMP) {
    urssaf = COTISATIONS_MINIMALES_LMP;
}
// En LMNP : PAS de cotisations minimales (cotisations = 0 si bénéfice = 0)

// APRÈS (Correct)
const SEUIL_EXONERATION_LMNP = 23000;

if (statutFiscal === 'lmnp' && ca < SEUIL_EXONERATION_LMNP) {
    // ✅ LMNP : Exonération totale des cotisations sociales si CA < 23 000€
    urssaf = 0;
} else if (statutFiscal === 'lmp' && urssaf < COTISATIONS_MINIMALES_LMP) {
    // ⚠️ LMP : Cotisations minimales même si bénéfice = 0
    urssaf = COTISATIONS_MINIMALES_LMP;
}
```

#### 2. Micro-BIC 30% (Non Classé) - Ligne ~470
```javascript
// AVANT (Bug)
const cotisMicro30 = ca * TAUX_COTIS_MICRO_NON_CLASSE; // 21,2%

// APRÈS (Correct)
const SEUIL_URSSAF = 23000;
// ✅ URSSAF = 0 si CA < 23 000€
const cotisMicro30 = ca >= SEUIL_URSSAF ? ca * TAUX_COTIS_MICRO_NON_CLASSE : 0;

// Message affiché
const messageUrssaf = ca < SEUIL_URSSAF 
    ? '✅ Pas de cotisations URSSAF' 
    : '(URSSAF: 21,2% du CA)';
```

#### 3. Micro-BIC 50% (Classé) - Ligne ~515
```javascript
// AVANT (Bug)
const cotisMicro50 = ca * TAUX_COTIS_MICRO_CLASSE; // 6%

// APRÈS (Correct)
// ✅ URSSAF = 0 si CA < 23 000€
const cotisMicro50 = ca >= SEUIL_URSSAF ? ca * TAUX_COTIS_MICRO_CLASSE : 0;

// Message affiché
const messageUrssafClasse = ca < SEUIL_URSSAF 
    ? '✅ Pas de cotisations URSSAF' 
    : '(URSSAF: 6% du CA ⭐)';
```

---

## 🎯 Exemples de Calcul

### Scénario 1 : CA = 15 000€, Meublé Classé, LMNP

#### Option 1 : LMNP Réel
- **URSSAF** : **0€** ✅ (CA < 23 000€)
- **IR** : ~450€ (selon revenus globaux)
- **TOTAL** : **450€**

#### Option 3 : Micro-BIC 50%
- CA : 15 000€
- Abattement 50% : 7 500€
- Bénéfice imposable : 7 500€
- **URSSAF** : **0€** ✅ (CA < 23 000€)
- **IR** : ~631€
- **TOTAL** : **631€**

✅ **LMNP Réel est le meilleur** (économie 181€)

---

### Scénario 2 : CA = 30 000€, Meublé Classé, LMNP

#### Option 1 : LMNP Réel
- Bénéfice net : ex. 10 000€
- **URSSAF** : **3 700€** (37% du bénéfice)
- **IR** : ~1 200€
- **TOTAL** : **4 900€**

#### Option 3 : Micro-BIC 50%
- CA : 30 000€
- Abattement 50% : 15 000€
- Bénéfice imposable : 15 000€
- **URSSAF** : **1 800€** (6% de 30 000€)
- **IR** : ~1 500€
- **TOTAL** : **3 300€**

✅ **Micro-BIC 50% est le meilleur** (économie 1 600€)

---

### Scénario 3 : CA = 15 000€, Meublé Non Classé, LMNP

#### Option 2 : Micro-BIC 30%
- CA : 15 000€
- Abattement 30% : 4 500€
- Bénéfice imposable : 10 500€
- **URSSAF** : **0€** ✅ (CA < 23 000€)
- **IR** : ~1 050€
- **TOTAL** : **1 050€**

✅ **Micro-BIC 30% disponible** (CA ≤ 15 000€ pour non classé)

---

## 💰 Taux de Cotisations Appliqués

### Micro-BIC (si CA ≥ 23 000€)

| Type | Abattement | Taux URSSAF | Plafond CA |
|------|-----------|-------------|------------|
| **Non classé** | 30% | **21,2%** | 15 000€ |
| **Classé ⭐** | 50% | **6%** | 77 700€ |

### Réel (si CA ≥ 23 000€)

| Statut | Base de calcul | Taux URSSAF | Minimum |
|--------|---------------|-------------|---------|
| **LMNP** | Bénéfice net | **~37%** | 0€ |
| **LMP** | Bénéfice net | **~37%** | **1 200€/an** |

---

## ⚠️ Prochaine Étape : Option Versement Libératoire

L'utilisateur demande également d'ajouter l'option du **versement libératoire** :

### 🎯 Taux du Versement Libératoire
- **1%** pour meublés de tourisme CLASSÉS + chambres d'hôtes
- **1,7%** pour tous les autres meublés (longue durée, non classés)

### ✅ Conditions d'Éligibilité 2026
1. **RFR 2024** (avis d'impôt 2025) < **29 315€** par part fiscale
   - 1 part : 29 315€
   - 2 parts : 58 630€
   - 3 parts : 87 945€

2. **CA dans les plafonds micro**
   - 77 700€ pour classé
   - 15 000€ pour non classé

### 📋 À Implémenter
- [ ] Ajouter un champ "RFR 2024" dans le formulaire
- [ ] Calculer l'éligibilité au versement libératoire
- [ ] Afficher une option supplémentaire "Micro-BIC + VL" si éligible
- [ ] Calcul : VL = CA × taux (1% ou 1,7%) au lieu de l'IR classique

---

## ✅ Tests de Validation

### Cas à tester

1. **CA = 10 000€, LMNP, Classé**
   - ✅ LMNP Réel : URSSAF = 0€
   - ✅ Micro-BIC 50% : URSSAF = 0€
   - ✅ Message "Pas de cotisations URSSAF"

2. **CA = 20 000€, LMNP, Non Classé**
   - ✅ LMNP Réel : URSSAF = 0€
   - ❌ Micro-BIC 30% : Indisponible (CA > 15 000€)
   - ✅ Message "Pas de cotisations URSSAF" (LMNP Réel)

3. **CA = 25 000€, LMNP, Classé**
   - ✅ LMNP Réel : URSSAF calculée (≠ 0)
   - ✅ Micro-BIC 50% : URSSAF = 6% × 25 000 = 1 500€
   - ✅ Message "URSSAF: 6% du CA"

4. **CA = 30 000€, LMP, Classé**
   - ✅ LMP Réel : URSSAF = max(calculée, 1 200€)
   - ❌ LMNP Réel : Indisponible (LMP obligatoire)

---

## 📚 Références Légales

### Articles de Loi
- **Article 151 septies du CGI** : Exonération < 23 000€
- **Article 50-0 du CGI** : Régime micro-BIC
- **Article 293 B du CGI** : Franchise en base de TVA

### Sources Officielles
- **URSSAF** : [Cotisations location meublée](https://www.urssaf.fr/portail/home/employeur/calculer-les-cotisations/les-elements-a-prendre-en-compte/lassiette-des-cotisations/les-revenus-locatifs.html)
- **Impots.gouv.fr** : Régime fiscal LMNP/LMP
- **Bofip** : BOI-BIC-CHAMP-40-20

---

## 🚀 Déploiement

### Checklist
- [x] Code HTML corrigé
- [x] Code JavaScript corrigé
- [x] Aucune erreur de syntaxe
- [x] Logique conforme à la réglementation
- [ ] Tests manuels effectués
- [ ] Déployé en production

### Commandes
```bash
# Vérifier les modifications
git status
git diff

# Déployer en production
vercel --prod
```

---

## 📝 Historique

| Date | Action | Détail |
|------|--------|--------|
| 04/02/2026 | Correction terminologie | "Cotis" et "SSI" → "URSSAF" |
| 04/02/2026 | Correction seuil 23k€ | LMNP Réel : URSSAF = 0 si CA < 23k€ |
| 04/02/2026 | Correction Micro-BIC | Intégration seuil 23k€ dans calculs |
| 04/02/2026 | Documentation complète | Règles 2026 + Exemples |

---

## ✅ Validation Finale

- [x] Terminologie uniformisée ("URSSAF")
- [x] Seuil 23 000€ appliqué dans LMNP Réel
- [x] Seuil 23 000€ appliqué dans Micro-BIC 30%
- [x] Seuil 23 000€ appliqué dans Micro-BIC 50%
- [x] Messages cohérents avec les calculs
- [x] Aucune erreur JavaScript
- [ ] Tests manuels validés
- [ ] Option versement libératoire (à venir)
