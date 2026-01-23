# Corrections Problèmes Planning Ménage - 21 Janvier 2026

## 🐛 Problèmes Identifiés

### 1. Boutons onclick ne fonctionnent pas
- **Symptômes**: Les boutons "Règles de Ménage", "Voir les Règles", "Page Validation", etc. ne répondent pas aux clics
- **Cause**: Les fonctions n'étaient pas exportées dans le scope global (`window`)
- **Fichier**: `index.html`

### 2. Mauvais appel de fonction dans switchTab
- **Symptômes**: Le planning ménage ne se charge pas lors du changement d'onglet
- **Cause**: `shared-utils.js` appelait `afficherPlanningMenageNew()` au lieu de `afficherPlanningParSemaine()`
- **Fichier**: `js/shared-utils.js`

## ✅ Solutions Appliquées

### 1. Export des fonctions dans index.html
```javascript
// Ajout des exports pour les fonctions onclick
window.showRulesModal = showRulesModal;
window.closeRulesModal = closeRulesModal;
window.ouvrirPageValidation = ouvrirPageValidation;
window.ouvrirPageFemmeMenage = ouvrirPageFemmeMenage;
```

### 2. Correction du switchTab dans shared-utils.js
```javascript
// AVANT:
} else if (tabName === 'menage') {
    if (typeof afficherPlanningMenageNew === 'function') {
        setTimeout(() => {
            afficherPlanningMenageNew();
        }, 200);
    }
}

// APRÈS:
} else if (tabName === 'menage') {
    if (typeof window.afficherPlanningParSemaine === 'function') {
        setTimeout(() => {
            window.afficherPlanningParSemaine();
        }, 200);
    }
}
```

## 🔍 Vérifications Effectuées

### Fichiers JavaScript Chargés
- ✅ `js/menage.js` - Fonctions principales du planning
- ✅ `js/cleaning-rules.js` - Gestion des règles
- ✅ `js/cleaning-rules-modal.js` - Modal des règles
- ✅ `js/shared-utils.js` - Gestion des onglets

### Fonctions Exportées Correctement
Toutes ces fonctions sont maintenant disponibles dans `window`:
- ✅ `showCleaningRulesModal`
- ✅ `showRulesModal`
- ✅ `closeRulesModal`
- ✅ `ouvrirPageValidation`
- ✅ `ouvrirPageFemmeMenage`
- ✅ `afficherPlanningParSemaine`
- ✅ `modifierDateMenage`
- ✅ `acceptCompanyProposal`
- ✅ `refuseCompanyProposal`
- ✅ `loadCleaningRules`
- ✅ `getActiveCleaningRules`

## 🧪 Test Créé

Fichier de test: `test-menage-functions.html`
- Teste la disponibilité de toutes les fonctions
- Teste les boutons onclick
- Teste la génération du planning
- Test de modification de date

## 📝 Notes Importantes

### Icônes de Validation
Les icônes sont bien présentes dans le code HTML généré:
- Badge ✓ pour les ménages validés
- Badge ⏳ pour les ménages en attente
- Fond vert pour les validés
- Fond jaune pour les propositions

### Bouton Sauvegarder
Le bouton 💾 appelle correctement `modifierDateMenage(reservationId)` qui:
1. Récupère la date et l'heure sélectionnées
2. Fait un UPDATE dans `cleaning_schedule`
3. Rafraîchit le planning
4. Affiche un toast de confirmation

## 🔧 Prochaines Étapes

1. Vider le cache du navigateur (Ctrl + Shift + R ou Cmd + Shift + R)
2. Recharger la page
3. Tester les boutons dans l'onglet Planning Ménage
4. Vérifier les icônes de validation
5. Tester le bouton sauvegarder

## ⚠️ Points d'Attention

- **Cache navigateur**: Le problème pouvait venir d'anciens JS en cache
- **Ordre de chargement**: Les scripts doivent être chargés dans le bon ordre (déjà correct)
- **Scope global**: Toutes les fonctions utilisées dans onclick DOIVENT être dans window
- **Console**: Vérifier qu'il n'y a plus d'erreurs de type "function is not defined"

## 📚 Fichiers Modifiés

1. `/workspaces/Gestion_gite-calvignac/index.html`
   - Ajout exports window.showRulesModal, etc.
   
2. `/workspaces/Gestion_gite-calvignac/js/shared-utils.js`
   - Correction appel afficherPlanningParSemaine au lieu de afficherPlanningMenageNew

3. `/workspaces/Gestion_gite-calvignac/test-menage-functions.html`
   - Nouveau fichier de test
