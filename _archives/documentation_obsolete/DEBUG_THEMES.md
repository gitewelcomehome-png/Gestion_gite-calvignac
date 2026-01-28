# 🔧 Dépannage - Thèmes Ne Changent Pas

## ✅ Checklist de Vérification

### 1. Fichier JS chargé ?
Ouvrir la console (F12) et taper :
```javascript
typeof switchVisualTheme
```
**Attendu :** `"function"`  
**Si "undefined"** → Le fichier `js/visual-themes.js` n'est pas chargé

### 2. Classes CSS présentes ?
Dans la console :
```javascript
document.body.classList.add('theme-apple-modern');
setTimeout(() => {
    const card = document.querySelector('.card');
    const styles = window.getComputedStyle(card);
    console.log('Border:', styles.borderWidth);
    console.log('Shadow:', styles.boxShadow);
}, 100);
```
**Attendu :** Border change de 3px → 1px  
**Si pas de changement** → Le CSS n'est pas chargé ou est overridé

### 3. Cache CSS ?
**Solution :** Vider le cache
- Chrome/Edge : `Ctrl+Shift+R` (Windows) ou `Cmd+Shift+R` (Mac)
- Firefox : `Ctrl+F5`

Ou dans la console :
```javascript
location.reload(true);
```

### 4. Test Direct
Ouvrir : [test-themes-debug.html](test-themes-debug.html)

Cette page affiche en temps réel :
- ✅ Classes appliquées au body
- ✅ Valeurs CSS calculées (border, shadow, radius)
- ✅ Logs console détaillés

### 5. Test Manuel Console
```javascript
// Retirer tous les thèmes
document.body.classList.remove('theme-apple-modern', 'theme-material');

// Ajouter Apple Moderne
document.body.classList.add('theme-apple-modern');

// Vérifier
console.log('Classes:', document.body.className);

// Tester sur une carte
const card = document.querySelector('.card');
if (card) {
    const styles = window.getComputedStyle(card);
    console.log({
        borderWidth: styles.borderWidth,
        boxShadow: styles.boxShadow,
        borderRadius: styles.borderRadius
    });
}
```

## 🐛 Problèmes Courants

### Problème : "switchVisualTheme is not defined"
**Cause :** Le fichier JS n'est pas chargé  
**Solution :**
1. Vérifier que `<script src="js/visual-themes.js"></script>` est dans `index.html`
2. Vérifier que le fichier existe : `js/visual-themes.js`
3. Recharger la page avec `Ctrl+Shift+R`

### Problème : Sélecteur ne fait rien
**Cause :** Le sélecteur appelle la mauvaise fonction  
**Solution :**
```html
<!-- CORRECT -->
<select onchange="switchVisualTheme(this.value)">

<!-- INCORRECT -->
<select onchange="switchDashboardTheme(this.value)">
```

### Problème : Thème ne persiste pas au rechargement
**Cause :** localStorage non sauvegardé  
**Test :**
```javascript
localStorage.setItem('visualTheme', 'apple-modern');
console.log('Saved:', localStorage.getItem('visualTheme'));
```

### Problème : Rien ne change visuellement
**Causes possibles :**
1. CSS non chargé → Vérifier `css/main.css` ligne ~6620
2. Cache CSS ancien → `Ctrl+Shift+R`
3. Styles inline qui overrident → Supprimer les `style="..."` hardcodés

**Test :**
```javascript
// Vérifier que les variables CSS existent
const root = document.documentElement;
const styles = getComputedStyle(root);
console.log('--border-width:', styles.getPropertyValue('--border-width'));

// Changer manuellement
root.style.setProperty('--border-width', '1px');
```

### Problème : Console pleine d'erreurs
**Vérifier :**
```javascript
// Voir toutes les erreurs
window.addEventListener('error', (e) => {
    console.error('ERROR:', e.message, e.filename);
});
```

## 🚀 Test Final

**Séquence complète de test :**

1. Ouvrir `test-themes-debug.html`
2. Changer le thème dans le sélecteur
3. Observer le panneau Debug Info en haut à droite
4. Vérifier dans la console :
   ```
   🎨 Changement thème visuel: apple-modern
   ✅ Classe ajoutée: theme-apple-modern
   ✅ Thème visuel appliqué: apple-modern
   ```
5. Vérifier que les cartes changent visuellement
6. Si ça fonctionne ici mais pas dans le dashboard → problème de timing/chargement

## 📞 Commandes de Debug Utiles

```javascript
// 1. État actuel
console.log('Body classes:', document.body.className);
console.log('Saved theme:', localStorage.getItem('visualTheme'));

// 2. Forcer un thème
switchVisualTheme('apple-modern');

// 3. Vérifier les variables CSS
const root = document.documentElement;
console.log({
    borderWidth: getComputedStyle(root).getPropertyValue('--border-width'),
    borderRadius: getComputedStyle(root).getPropertyValue('--border-radius-lg'),
    shadowSm: getComputedStyle(root).getPropertyValue('--shadow-retro-sm')
});

// 4. Tester sur un élément
const card = document.querySelector('.card');
if (card) {
    console.log('Card computed styles:', {
        borderWidth: getComputedStyle(card).borderWidth,
        borderRadius: getComputedStyle(card).borderRadius,
        boxShadow: getComputedStyle(card).boxShadow
    });
}

// 5. Nettoyer localStorage
localStorage.removeItem('visualTheme');
location.reload();
```

## ✅ Tout Fonctionne ?

**Vérifications finales :**
- [ ] `test-themes-debug.html` change visuellement ✓
- [ ] Console affiche les logs de changement ✓
- [ ] Classes `theme-apple-modern` / `theme-material` ajoutées au body ✓
- [ ] Variables CSS changent (--border-width, etc.) ✓
- [ ] Cartes/sections changent visuellement ✓
- [ ] Thème persiste au rechargement ✓

**Si TOUTES les cases sont cochées** → Système opérationnel ! 🎉

**Si UNE case échoue** → Reprendre le debug à cette étape spécifique.
