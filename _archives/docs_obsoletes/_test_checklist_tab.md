# Test de l'onglet CHECK-LISTS

## Dans la console du navigateur, exécutez :

```javascript
// Test 1 : Vérifier si la fonction existe
console.log('loadChecklistsTab existe ?', typeof window.loadChecklistsTab);

// Test 2 : Appeler manuellement la fonction
window.loadChecklistsTab();
```

Si la fonction existe et l'appel manuel fonctionne, alors le problème est que l'onglet n'appelle pas automatiquement cette fonction.

## Solution : Appeler manuellement depuis le HTML

Il faut ajouter un appel à `loadChecklistsTab()` dans le HTML de l'onglet.
