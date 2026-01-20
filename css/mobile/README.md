# 📱 CSS Mobile

Ce dossier contient **UNIQUEMENT** les styles CSS pour la version mobile.

## 📋 Structure

- `main.css` → CSS principal mobile (layout, composants généraux)
- `dashboard.css` → Styles spécifiques au dashboard mobile (si nécessaire)
- `reservations.css` → Styles spécifiques aux réservations mobile (si nécessaire)
- etc.

## ⚡ Chargement

Le CSS mobile est chargé dynamiquement par `index.html` uniquement si mobile détecté :
```javascript
if (isMobile) {
    mobileCss.href = 'css/mobile/main.css?v=1.0';
}
```

## ✅ Règles

1. **Isolation totale** : Ces styles ne doivent JAMAIS affecter le desktop
2. **!important autorisé** : Vu la séparation, OK d'utiliser pour forcer les styles
3. **Performance** : Animations réduites, transitions courtes
4. **Tactile** : Zones cliquables minimum 44x44px

## 🎯 Optimisations Obligatoires

### Font-size minimum
```css
input, textarea, select {
    font-size: 16px !important; /* Évite zoom auto iOS */
}
```

### Touch-action
```css
* {
    touch-action: manipulation; /* Empêche zoom double-tap */
}
```

### Safe areas iPhone
```css
@supports (padding: max(0px)) {
    body {
        padding-left: max(10px, env(safe-area-inset-left));
        padding-right: max(10px, env(safe-area-inset-right));
    }
}
```

### Smooth scrolling
```css
* {
    -webkit-overflow-scrolling: touch;
}
```

## 🚫 Ne PAS faire

- ❌ Utiliser des @media queries (déjà dans version mobile uniquement)
- ❌ Cibler des éléments desktop
- ❌ Animations lourdes (performance mobile)
- ❌ Fixed positioning excessif (problèmes keyboards mobiles)
