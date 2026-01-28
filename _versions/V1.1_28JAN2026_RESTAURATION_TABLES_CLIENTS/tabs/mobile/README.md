# 📱 Onglets Mobile

Ce dossier contient **UNIQUEMENT** les versions mobile des onglets.

## 📋 Structure

Les fichiers sont nommés sans préfixe `tab-` pour plus de clarté :
- `dashboard.html` → Version mobile du tableau de bord
- `reservations.html` → Version mobile des réservations
- `menage.html` → Version mobile de la gestion ménage
- etc.

## ⚡ Chargement

Ces fichiers sont chargés automatiquement par `index.html` uniquement si un device mobile est détecté :
```javascript
isMobile ? 'tabs/mobile/dashboard.html' : 'tabs/tab-dashboard.html'
```

## ✅ Règles

1. **Isolation totale** : Ces fichiers ne doivent JAMAIS affecter le desktop
2. **Naming simple** : Pas de préfixe `tab-`, juste le nom (ex: `dashboard.html`)
3. **Optimisation mobile** : HTML optimisé pour petit écran, tactile, 1 colonne
4. **IDs identiques** : Garder les mêmes IDs que le desktop pour la compatibilité JS

## 🎨 Spécificités Mobile

- Layout 1 colonne
- Padding réduit (10-15px)
- Font-size minimum 16px
- Boutons minimum 44x44px (tactile)
- Pas de hover (remplacer par active/focus)
- Éléments non essentiels masqués

## 🚫 Ne PAS faire

- ❌ Utiliser des @media queries (versions déjà séparées)
- ❌ Copier/coller du desktop sans optimiser
- ❌ Changer les IDs d'éléments (casse le JS)
- ❌ Référencer des fichiers CSS desktop
