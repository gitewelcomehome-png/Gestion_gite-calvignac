# PATCH : Nettoyage Code JavaScript - 23 Janvier 2026

## 🔴 Problème Identifié

Après suppression des 7 tables obsolètes dans la base de données, le code JavaScript fait encore référence à ces tables, générant des erreurs 404 en production :

```
❌ 404: retours_menage
❌ 404: demandes_horaires 
❌ 404: problemes_signales
❌ 404: suivi_soldes_bancaires
```

## 📋 Tables Concernées

| Table | Statut | Remplacée par |
|-------|--------|---------------|
| `retours_menage` | ❌ Supprimée | Feature jamais utilisée |
| `demandes_horaires` | ❌ Supprimée | Feature jamais implémentée |
| `problemes_signales` | ❌ Supprimée | Feature jamais implémentée |
| `suivi_soldes_bancaires` | ❌ Supprimée | Feature jamais implémentée |

## 🔍 Références Trouvées

### 1. dashboard.js (13 occurrences)
- **Ligne 133** : Chargement retours_menage (fonction `updateDashboardAlerts`)
- **Ligne 1365** : Requête suivi_soldes_bancaires (fonction `afficherStatistiques`)
- **Ligne 1514** : Graphique trésorerie suivi_soldes_bancaires
- **Ligne 1648-1779** : Module demandes horaires (4 fonctions)
- **Ligne 1804-2021** : Module problèmes signalés (3 fonctions)
- **Ligne 2261-2342** : Affichage retours ménage (2 fonctions)

### 2. widget-horaires-clients.js (1 occurrence)
- **Ligne 18** : Chargement demandes_horaires

### 3. fiches-clients.js (7 occurrences)
- **Ligne 105** : Stats demandes horaires
- **Ligne 144** : Join demandes_horaires dans requête
- **Ligne 403-578** : Module validation demandes (5 fonctions)

### 4. fiscalite-v2.js (2 occurrences)
- **Ligne 2830** : Chargement suivi_soldes_bancaires
- **Ligne 2895** : Sauvegarde suivi_soldes_bancaires

## 🎯 Plan d'Action

### Phase 1 : Commentage des Fonctions
Commenter (ne pas supprimer) toutes les fonctions liées à ces features pour garder une trace du code.

### Phase 2 : Suppression des Appels
Retirer les appels aux fonctions commentées dans le code actif.

### Phase 3 : Nettoyage UI
Supprimer les éléments HTML qui référencent ces fonctionnalités.

### Phase 4 : Vérification Console
Tester le site et confirmer zéro erreur 404.

## ✅ Validation

Après application du patch :
- [ ] Aucune erreur 404 dans la console
- [ ] Dashboard se charge sans erreur
- [ ] Page fiches clients fonctionne
- [ ] Onglet fiscalité s'affiche correctement
- [ ] Aucune référence aux tables supprimées

## 📝 Fichiers à Modifier

1. `js/dashboard.js` (13 modifications)
2. `js/widget-horaires-clients.js` (1 modification)
3. `js/fiches-clients.js` (7 modifications)
4. `js/fiscalite-v2.js` (2 modifications)

## ⚠️ Important

**NE PAS SUPPRIMER** le code, mais le **COMMENTER** avec un bloc explicatif :

```javascript
// ============================================================
// ❌ FEATURE SUPPRIMÉE - 23 JAN 2026
// Table demandes_horaires supprimée de la BDD
// Code conservé pour référence historique
// ============================================================
// async function updateDemandesClients() { ... }
```

Cela permet :
- De garder une trace du code pour référence future
- D'éviter de recréer la même feature par erreur
- De comprendre l'historique du projet
