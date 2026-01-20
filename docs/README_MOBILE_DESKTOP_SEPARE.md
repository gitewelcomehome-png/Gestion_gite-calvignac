# 📱 Système Mobile/Desktop Séparé

## 🎯 Principe

Le site détecte automatiquement si l'utilisateur est sur mobile ou desktop **dès le chargement** et charge les fichiers appropriés :

- **Desktop** : Fichiers HTML et CSS standards
- **Mobile** : Fichiers HTML et CSS complètement séparés

## ⚡ Détection Automatique

Dans `index.html` (ligne ~113) :
```javascript
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;
```

Cette détection s'effectue **AVANT** le chargement de tout contenu.

## 📂 Structure des Fichiers

### Desktop
- `tabs/tab-dashboard.html` - Dashboard desktop (2 colonnes, tous détails)
- `tabs/tab-reservations.html` - Réservations desktop
- `tabs/tab-menage.html` - Ménage desktop
- CSS standard du site

### Mobile
- `tabs/mobile/dashboard.html` - Dashboard mobile (1 colonne, compact)
- `tabs/mobile/reservations.html` - Réservations mobile (à créer)
- `tabs/mobile/menage.html` - Ménage mobile (à créer)
- `css/mobile/main.css` - CSS optimisé mobile uniquement

## 🔄 Chargement Conditionnel

```javascript
const tabFiles = {
    'tab-dashboard': isMobile ? 'tabs/mobile/dashboard.html' : 'tabs/tab-dashboard.html',
    // ... autres tabs
};
```

## ✅ Avantages

1. ✅ **Isolation totale** - Aucun contact entre mobile et desktop
2. ✅ **Performance** - Chaque version chargée uniquement ce dont elle a besoin
3. ✅ **Maintenance** - Modifications sur une version n'affectent jamais l'autre
4. ✅ **Flexibilité** - Possibilité d'avoir des structures HTML complètement différentes
5. ✅ **Sécurité** - Pas de risque de casser la production en modifiant le mobile

## 📱 Spécificités Mobile

### HTML Mobile (`tab-dashboard-mobile.html`)
- Layout 1 colonne uniquement
- Cartes compactes avec padding réduit
- Boutons adaptés au tactile (44px minimum)
- Textes plus gros pour lisibilité
- Grille 2 colonnes pour les indicateurs
- Sections collapsables retirées (tout visible)

### CSS Mobile (`css/mobile.css`)
- Font-size : 16px minimum (évite zoom iOS)
- Touch-action: manipulation
- -webkit-overflow-scrolling: touch
- Safe areas pour iPhone (notch)
- Modals 95% largeur
- Animations réduites (performance)
- Nav sticky en haut
- Graphiques masqués

## 🚀 Ajouter un Nouvel Onglet Mobile

1. Créer `tabs/mobile/NOMONGLET.html` (sans préfixe `tab-`)
2. Créer la version mobile compacte
3. (Optionnel) Créer `css/mobile/NOMONGLET.css` si styles spécifiques
4. Ajouter dans `index.html` :
```javascript
'tab-NOMONGLET': isMobile ? 'tabs/mobile/NOMONGLET.html' : 'tabs/tab-NOMONGLET.html',
```

## 🧪 Test

### Tester en Desktop
- Ouvrir normalement le site
- Console doit afficher : `💻 Mode DESKTOP détecté`

### Tester en Mobile
Option 1 - DevTools Chrome :
1. F12 → Toggle device toolbar
2. Choisir un mobile (iPhone, Samsung, etc.)
3. Recharger la page (Cmd+R / Ctrl+R)
4. Console doit afficher : `📱 Mode MOBILE détecté - CSS mobile chargé`

Option 2 - Vrai device :
1. Ouvrir sur smartphone
2. Vérifier que la mise en page est en 1 colonne

## 📊 Différences Visuelles

### Desktop
- 2 colonnes : Réservations/Ménages à gauche, Tâches à droite
- Vision Globale complète avec tous les détails
- Graphiques visibles
- Espace entre les éléments
- Tous les indicateurs fiscaux (2025 et 2026)

### Mobile
- 1 colonne : tout empilé verticalement
- Vision Globale compacte en grille 2x2
- Graphiques masqués
- Padding réduit (10px au lieu de 20px)
- Seulement indicateurs 2026 (pas 2025)

## 🔧 Maintenance

### Modifier UNIQUEMENT le Desktop
→ Éditer `tabs/tab-dashboard.html`
→ Le mobile n'est PAS affecté

### Modifier UNmobile/dashboard.html` et `css/mobile/main
→ Éditer `tabs/tab-dashboard-mobile.html` et `css/mobile.css`
→ Le desktop n'est PAS affecté

### Modifier les DEUX
→ Faire 2 modifications séparées dans chaque fichier

## 📝 Notes Importantes

- **Aucun @media query** : Les versions sont complètement séparées
- **Détection côté client** : Se fait dans le navigateur au chargement
- **Cache busting** : `?v=20260120-mobile` permet de forcer le rechargement
- **JavaScript commun** : Les fichiers JS restent partagés (dashboard.js, etc.)
- **IDs identiques** : Les éléments ont les mêmes IDs pour que le JS fonctionne

## 🎨 Personnalisation Mobile

Pour adapter d'autres éléments sur mobile, ajouter dans `css/mobile/main.css` :
```css
/* Exemple : masquer un élément sur mobile */
#mon-element-desktop-only {
    display: none !important;
}
```

## 🐛 Dépannage

### Le site ne détecte pas le mobile
→ Vider le cache (Ctrl+Shift+R ou Cmd+Shift+R)
→ Vérifier la console : message de détection doit s'afficher

### Le CSS mobile ne s'applique pas
→ Vérifier que `css/mobile/main.css` existe
→ Vérifier la console pour erreurs 404
→ Forcer le rechargement du CSS (changer le `?v=1.0`)

### Le dashboard mobile ne charge pas
→ Vérifier que `tabs/mobile/dashboard.html` existe
→ Vérifier la console pour erreurs de fetch
→ Vérifier le cacheBuster dans index.html

## 📦 Fichiers Archive

Ancienne tentative responsive (échec) archivée dans :
`_archives/mobile_responsive_20jan2026/`

Ne PAS utiliser ces fichiers. Conserver pour référence historique uniquement.
