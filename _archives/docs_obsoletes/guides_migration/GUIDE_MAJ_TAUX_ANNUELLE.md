# 📅 GUIDE DE MISE À JOUR ANNUELLE - Taux Fiscaux

**Objectif:** Mettre à jour les taux fiscaux chaque année en **5 minutes** sans toucher au code métier.

---

## 🗓️ Calendrier de Mise à Jour

### Janvier
- [ ] **PASS** (Plafond Annuel Sécurité Sociale) - Publication début janvier
- [ ] **SMIC horaire** - Révision annuelle au 1er janvier
- [ ] **Barème IR** - Loi de finances (généralement stable)

### Février
- [ ] **Barème kilométrique** - Publication BOFiP (mi-février)

### Mars
- [ ] **Taux URSSAF définitifs** - Confirmation des taux TNS/Indépendants

---

## 🔧 Procédure de Mise à Jour

### Étape 1: Ouvrir le fichier de configuration

📂 **Fichier:** `/js/taux-fiscaux-config.js`

### Étape 2: Dupliquer la dernière année

Copier la section de l'année N et la renommer en N+1:

```javascript
const TAUX_FISCAUX = {
    TAUX_ANNEES: {
        2024: { ... }, // Année précédente
        2025: { ... }, // Année actuelle
        
        // ⬇️ AJOUTER ICI
        2026: {
            // Copier-coller le contenu de 2025
            // puis modifier les valeurs ci-dessous
        }
    }
}
```

### Étape 3: Mettre à jour les valeurs

#### A. PASS (Plafond Annuel Sécurité Sociale)

**Source:** https://www.secu-independants.fr ou https://www.urssaf.fr

```javascript
2026: {
    PASS: 47520, // ⬅️ METTRE À JOUR (exemple: 46368 → 47520)
```

**❗ Important:** Le PASS est utilisé pour:
- Retraite de base (plafonnement)
- Allocations familiales (seuils 110% et 140%)

#### B. Taux URSSAF

**Source:** https://www.secu-independants.fr/cotisations

```javascript
URSSAF: {
    indemnites_journalieres: {
        taux: 0.0085, // ⬅️ Vérifier si changement (rare)
        base: 'revenu',
        description: "Indemnités journalières"
    },
    retraite_base: {
        taux: 0.1775, // ⬅️ Vérifier si changement
        plafond: 47520, // ⬅️ MÊME VALEUR QUE PASS
        base: 'revenu',
        description: "Retraite de base"
    },
    retraite_complementaire: {
        taux: 0.07, // ⬅️ Vérifier (généralement stable)
        base: 'revenu',
        description: "Retraite complémentaire"
    },
    invalidite_deces: {
        taux: 0.013, // ⬅️ Vérifier (1.3% - stable)
        base: 'revenu',
        description: "Invalidité-Décès"
    },
    csg_crds: {
        taux: 0.097, // ⬅️ Vérifier (9.7% - stable)
        base: 'revenu',
        description: "CSG-CRDS"
    },
    allocations_familiales: {
        seuil_debut: 47520 * 1.1,    // ⬅️ 110% du PASS
        seuil_fin: 47520 * 1.4,       // ⬅️ 140% du PASS
        taux_max: 0.031,              // ⬅️ 3.1% (stable)
        description: "Allocations familiales (progressif 0% à 3.1%)"
    },
    formation_pro: {
        taux: 0.0025, // ⬅️ 0.25% (stable)
        base: 'ca',
        description: "Formation professionnelle"
    }
}
```

**📊 Synthèse URSSAF (vérifier total ~36-37%):**
- Indemnités: 0.85%
- Retraite base: 17.75%
- Retraite compl: 7%
- Invalidité: 1.3%
- CSG-CRDS: 9.7%
- Formation: 0.25%
- **Total: ~36.85%** (hors allocations familiales progressives)

#### C. SMIC horaire et Trimestres Retraite

**Source:** https://www.service-public.fr/particuliers/vosdroits/F2300

```javascript
RETRAITE: {
    smic_horaire: 12.10, // ⬅️ METTRE À JOUR (ex: 11.88 → 12.10)
    heures_par_trimestre: 600, // ⬅️ NE JAMAIS CHANGER (fixe légal)
    
    // ⬇️ RECALCULER AUTOMATIQUEMENT (smic_horaire × 600 × N)
    trimestre_1: 12.10 * 600,      // = 7 260 €
    trimestre_2: 12.10 * 600 * 2,  // = 14 520 €
    trimestre_3: 12.10 * 600 * 3,  // = 21 780 €
    trimestre_4: 12.10 * 600 * 4   // = 29 040 €
}
```

**💡 Calcul rapide:**
- 1 trimestre = SMIC horaire × 600
- Exemple: 12.10 € × 600 = 7 260 €

#### D. Barème Kilométrique

**Source:** BOFiP - Barème BIC (publié mi-février)  
**URL:** https://bofip.impots.gouv.fr → "Barème kilométrique BIC"

```javascript
BAREME_KM: {
    3: [ // ⬅️ 3 CV
        { max: 5000, formule: (d) => d * 0.545 },      // ⬅️ METTRE À JOUR
        { max: 20000, formule: (d) => d * 0.326 + 1095 }, // ⬅️ METTRE À JOUR
        { max: Infinity, formule: (d) => d * 0.381 }    // ⬅️ METTRE À JOUR
    ],
    4: [ // ⬅️ 4 CV
        { max: 5000, formule: (d) => d * 0.624 },
        { max: 20000, formule: (d) => d * 0.351 + 1365 },
        { max: Infinity, formule: (d) => d * 0.419 }
    ],
    5: [ // ⬅️ 5 CV (le plus courant)
        { max: 5000, formule: (d) => d * 0.655 },
        { max: 20000, formule: (d) => d * 0.368 + 1435 },
        { max: Infinity, formule: (d) => d * 0.440 }
    ],
    6: [ // ⬅️ 6 CV
        { max: 5000, formule: (d) => d * 0.685 },
        { max: 20000, formule: (d) => d * 0.385 + 1500 },
        { max: Infinity, formule: (d) => d * 0.460 }
    ],
    7: [ // ⬅️ 7 CV
        { max: 5000, formule: (d) => d * 0.718 },
        { max: 20000, formule: (d) => d * 0.406 + 1560 },
        { max: Infinity, formule: (d) => d * 0.484 }
    ]
}
```

**🚗 Structure du barème:**
- **0 à 5 000 km:** `distance × taux1`
- **5 001 à 20 000 km:** `distance × taux2 + constante`
- **Au-delà de 20 000 km:** `distance × taux3`

**💡 Comment copier depuis BOFiP:**

Tableau BOFiP (exemple):
```
| Puissance | 0-5000 km | 5001-20000 km        | > 20000 km |
|-----------|-----------|----------------------|------------|
| 5 CV      | d × 0.655 | (d × 0.368) + 1435  | d × 0.440  |
```

Traduire en code:
```javascript
5: [
    { max: 5000, formule: (d) => d * 0.655 },
    { max: 20000, formule: (d) => d * 0.368 + 1435 },
    { max: Infinity, formule: (d) => d * 0.440 }
]
```

#### E. Barème Impôt sur le Revenu

**Source:** Loi de finances + impots.gouv.fr

```javascript
BAREME_IR: [
    { max: 11294, taux: 0 },       // ⬅️ Vérifier seuil tranche 0%
    { max: 28797, taux: 0.11 },    // ⬅️ Vérifier seuil tranche 11%
    { max: 82341, taux: 0.30 },    // ⬅️ Vérifier seuil tranche 30%
    { max: 177106, taux: 0.41 },   // ⬅️ Vérifier seuil tranche 41%
    { max: Infinity, taux: 0.45 }  // ⬅️ Tranche max 45%
]
```

**📊 Barème 2024/2025 (inchangé):**
- 0% jusqu'à 11 294 €
- 11% de 11 295 € à 28 797 €
- 30% de 28 798 € à 82 341 €
- 41% de 82 342 € à 177 106 €
- 45% au-delà de 177 106 €

**❗ Important:** Le barème change rarement. Vérifier dans la loi de finances de l'année.

#### F. Abattement Salaires

**Source:** BOFiP - BIC/BNC abattements

```javascript
ABATTEMENT_SALAIRE: {
    taux: 0.10,      // ⬅️ 10% (stable)
    minimum: 472,    // ⬅️ Vérifier minimum
    maximum: 13522   // ⬅️ Vérifier maximum
}
```

**Généralement stable, mais vérifier annuellement.**

---

## ✅ Checklist de Vérification

Avant de sauvegarder:

- [ ] **PASS mis à jour** (utilisé dans URSSAF.retraite_base.plafond et allocations)
- [ ] **SMIC horaire mis à jour** (utilisé pour calcul trimestres)
- [ ] **Trimestres recalculés** (SMIC × 600 × 1/2/3/4)
- [ ] **Taux URSSAF vérifiés** (total ~36-37%)
- [ ] **Barème kilométrique 2026** copié depuis BOFiP
- [ ] **Barème IR 2026** vérifié (si changement)
- [ ] **Abattement salaires** vérifié (min/max)

---

## 🧪 Test Après Mise à Jour

### 1. Tester le calcul URSSAF

Ouvrir l'onglet **Fiscalité** dans l'application:

**Test 1: Bénéfice 30 000 €**
- Cotisations attendues: ~11 000 € (36-37%)
- Trimestres: 4

**Test 2: Bénéfice 10 000 €**
- Cotisations attendues: ~3 600 € (36%)
- Trimestres: 1

**Test 3: Bénéfice négatif -5 000 €**
- Cotisations: 0 €
- Trimestres: 0

### 2. Tester le barème kilométrique

**Test: 5 CV, 10 000 km**
- Formule 2025: `10000 × 0.368 + 1435 = 5 115 €`
- Formule 2026: `10000 × 0.XXX + XXXX = ?` ← vérifier

### 3. Vérifier console JavaScript

Ouvrir DevTools (F12) → Console → Aucune erreur

---

## 📚 Sources Officielles

### 1. URSSAF Indépendants
- **URL:** https://www.secu-independants.fr
- **Section:** Cotisations TNS / Travailleurs Indépendants
- **Publication:** Janvier (taux définitifs mars)

### 2. Barème Kilométrique
- **URL:** https://bofip.impots.gouv.fr
- **Recherche:** "Barème kilométrique BIC"
- **Publication:** Mi-février

### 3. PASS (Plafond Sécurité Sociale)
- **URL:** https://www.urssaf.fr ou https://www.securite-sociale.fr
- **Publication:** Début janvier

### 4. SMIC
- **URL:** https://www.service-public.fr/particuliers/vosdroits/F2300
- **Publication:** 1er janvier

### 5. Barème IR
- **URL:** https://www.impots.gouv.fr
- **Source:** Loi de finances de l'année
- **Publication:** Décembre N-1 pour année N

---

## 🚨 Points d'Attention

### Erreurs Fréquentes

❌ **Oublier de mettre à jour le PASS dans:**
- `PASS: ...`
- `URSSAF.retraite_base.plafond: ...`
- `URSSAF.allocations_familiales.seuil_debut: PASS × 1.1`
- `URSSAF.allocations_familiales.seuil_fin: PASS × 1.4`

❌ **Mal calculer les trimestres:**
- Formule: `SMIC horaire × 600` (pas SMIC annuel!)

❌ **Copier le mauvais barème kilométrique:**
- Utiliser le barème **BIC** (pas barème salarié!)

### Validation Expert-Comptable

**⚠️ Important:** Après mise à jour, faire valider par expert-comptable que:
- Les taux URSSAF correspondent bien au régime LMP au réel
- Le calcul des trimestres est correct
- Le barème kilométrique est le bon (BIC)

---

## 💾 Sauvegarde

Après modification:

1. **Sauvegarder** le fichier `taux-fiscaux-config.js`
2. **Commit Git:**
   ```bash
   git add js/taux-fiscaux-config.js
   git commit -m "MAJ taux fiscaux 2026"
   git push
   ```
3. **Tester en production** après déploiement
4. **Archiver** l'ancienne version si besoin

---

## ✅ C'est Terminé !

Le code s'adapte **automatiquement** à l'année en cours:

```javascript
const annee = new Date().getFullYear(); // 2026
const config = window.TAUX_FISCAUX.getConfig(annee); // Charge config 2026
```

**Aucune modification du code métier nécessaire.** 🎉

---

**Questions?** Consulter [CORRECTIONS_AUDIT_FISCAL_19JAN2026.md](CORRECTIONS_AUDIT_FISCAL_19JAN2026.md)
