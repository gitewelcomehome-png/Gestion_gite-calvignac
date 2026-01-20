# 📚 Documentation - Système Fiscal Adaptatif

**Date mise en place:** 19 janvier 2026

---

## 🎯 Objectif

Ce système permet de **gérer automatiquement** les taux fiscaux (URSSAF, IR, barème kilométrique) sans modifier le code métier chaque année.

---

## 📋 Documents Disponibles

### 1. **RECAP_SYSTEME_TAUX_ADAPTATIFS.md** ⭐ COMMENCER ICI
→ Vue d'ensemble complète du système  
→ Résumé des 6 corrections appliquées  
→ Impact financier quantifié  
→ Tests recommandés  

**Qui:** Développeurs, chefs de projet, comptables  
**Quand:** Première lecture, vue d'ensemble

---

### 2. **CORRECTIONS_AUDIT_FISCAL_19JAN2026.md** 🔧 DÉTAILS TECHNIQUES
→ Comparaison avant/après (code)  
→ Explication technique de chaque correction  
→ Sources légales référencées  
→ Impact ligne par ligne  

**Qui:** Développeurs  
**Quand:** Comprendre les modifications du code

---

### 3. **GUIDE_MAJ_TAUX_ANNUELLE.md** 📅 PROCÉDURE MAINTENANCE
→ Calendrier de mise à jour (janvier → mars)  
→ Procédure pas-à-pas avec exemples  
→ Checklist de validation  
→ Sources officielles (URLs)  

**Qui:** Développeurs, gestionnaires  
**Quand:** Mise à jour annuelle (janvier/février)

---

### 4. **AUDIT_FISCAL_COMPTABLE.md** 🔍 RAPPORT D'AUDIT INITIAL
→ 10 erreurs critiques identifiées  
→ Analyse de conformité  
→ Priorités de correction  
→ Points de vigilance  

**Qui:** Développeurs, auditeurs, comptables  
**Quand:** Comprendre l'origine des corrections

---

## 🗂️ Fichiers du Système

### Configuration
- **`/js/taux-fiscaux-config.js`** - Configuration centralisée des taux (2024, 2025, +futures)

### Code Métier
- **`/js/fiscalite-v2.js`** - Utilise la configuration pour les calculs
- **`/tabs/tab-fiscalite-v2.html`** - Interface utilisateur

### Architecture
- **`/ARCHITECTURE.md`** - Section "Système Fiscal" ajoutée

---

## 🚀 Démarrage Rapide

### Comprendre le Système (10 min)
1. Lire **RECAP_SYSTEME_TAUX_ADAPTATIFS.md** (vue d'ensemble)
2. Consulter **CORRECTIONS_AUDIT_FISCAL_19JAN2026.md** (détails techniques)

### Mettre à Jour les Taux (5-10 min/an)
1. Suivre **GUIDE_MAJ_TAUX_ANNUELLE.md** (procédure)
2. Ouvrir `/js/taux-fiscaux-config.js`
3. Copier section année N → année N+1
4. Mettre à jour les valeurs selon sources officielles
5. Sauvegarder → Code s'adapte automatiquement

---

## 🎓 Sources Légales Officielles

### URSSAF Indépendants
- **URL:** https://www.secu-independants.fr
- **Mise à jour:** Janvier (définitif mars)
- **Taux 2024/2025:** Vérifiés ✅

### Barème Kilométrique BIC
- **URL:** https://bofip.impots.gouv.fr
- **Recherche:** "Barème kilométrique BIC"
- **Mise à jour:** Mi-février

### PASS (Plafond Sécurité Sociale)
- **URL:** https://www.urssaf.fr
- **Mise à jour:** Début janvier
- **2024/2025:** 46 368 € (stable)

### SMIC Horaire
- **URL:** https://www.service-public.fr/particuliers/vosdroits/F2300
- **Mise à jour:** 1er janvier
- **2024:** 11.65 € | **2025:** 11.88 € (estimé)

### Barème Impôt sur le Revenu
- **URL:** https://www.impots.gouv.fr
- **Source:** Loi de finances
- **2024/2025:** Inchangé ✅

---

## ✅ Corrections Appliquées (Résumé)

1. **URSSAF taux détaillés** - 22% → 36.85% (calcul correct avec 7 composantes)
2. **Suppression minimum 1200€** - Ne s'applique pas au régime LMP au réel
3. **Trimestres retraite** - Seuils corrigés (600 × SMIC horaire)
4. **Barème kilométrique** - Système adaptatif (2024/2025/+)
5. **Abattement salaires** - Plafonds légaux (472€ min / 13522€ max)
6. **Barème IR** - Code adaptatif (facilite mises à jour)

**Impact:** +~1 650 € sur 50k€ bénéfice (calculs conformes vs anciens calculs faux).

---

## 🧪 Tests Recommandés

### Test 1: Bénéfice négatif → URSSAF = 0 €
### Test 2: Bénéfice 10k€ → URSSAF ~3 600 € (36%), 1 trimestre
### Test 3: Bénéfice 30k€ → URSSAF ~11 000 € (36.5%), 4 trimestres
### Test 4: Barème km 2025 → Gain ~7% vs 2024
### Test 5: Abattement salaire 150k€ → Plafond 13 522 €

**Statut:** Tous les tests ✅

---

## 📊 Architecture du Système

```
┌─────────────────────────────────────┐
│  taux-fiscaux-config.js             │
│  ├─ TAUX_ANNEES { 2024, 2025, ... } │
│  ├─ getConfig(annee)                │
│  ├─ calculerURSSAF()                │
│  ├─ calculerTrimestres()            │
│  └─ calculerIR()                    │
└─────────────────────────────────────┘
           ↓ utilisé par
┌─────────────────────────────────────┐
│  fiscalite-v2.js                    │
│  ├─ calculerTempsReel()             │
│  ├─ calculerFiscalite()             │
│  ├─ calculerIR()                    │
│  └─ calculerBaremeKilometrique()    │
└─────────────────────────────────────┘
           ↓ affiche dans
┌─────────────────────────────────────┐
│  tab-fiscalite-v2.html              │
│  Interface utilisateur               │
└─────────────────────────────────────┘
```

**Principe:** 
- Configuration **séparée** de la logique métier
- Mise à jour **centralisée** dans un seul fichier
- Code **adaptatif** selon l'année en cours

---

## ⚠️ Points d'Attention

### Maintenance Annuelle Obligatoire
- **Janvier:** PASS + SMIC + taux URSSAF provisoires
- **Février:** Barème kilométrique BOFiP
- **Mars:** Taux URSSAF définitifs

### Validation Expert-Comptable
- ⚠️ Toujours faire valider les calculs
- Les taux peuvent varier selon situation spécifique
- Ce système utilise les taux généraux TNS/LMP

### Console JavaScript
- Vérifier aucune erreur après mise à jour
- Tester avec exemples réels
- Valider tous les calculs

---

## 📞 Support

### Questions Techniques
→ Consulter **CORRECTIONS_AUDIT_FISCAL_19JAN2026.md**  
→ Consulter **ARCHITECTURE.md** section "Système Fiscal"

### Mise à Jour Annuelle
→ Suivre **GUIDE_MAJ_TAUX_ANNUELLE.md**

### Validation Légale
→ Expert-comptable obligatoire

---

## 📅 Calendrier Maintenance 2026

- [ ] **Janvier 2026** - Dupliquer config 2025 → 2026
- [ ] **Janvier 2026** - Mettre à jour PASS + SMIC
- [ ] **Février 2026** - Mettre à jour barème kilométrique (BOFiP)
- [ ] **Mars 2026** - Vérifier taux URSSAF définitifs
- [ ] **Validation** - Expert-comptable

**Temps estimé:** 5-10 minutes par an.

---

## ✅ Statut Actuel

🎉 **SYSTÈME OPÉRATIONNEL**

- ✅ Code conforme sources légales 2024/2025
- ✅ Tests validés
- ✅ Documentation complète
- ✅ Zéro erreur console
- ✅ Prêt pour production

**Dernière mise à jour:** 19 janvier 2026  
**Version:** 1.0  
**Prochaine révision:** Février 2025 (barème km)
