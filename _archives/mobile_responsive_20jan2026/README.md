# Sauvegarde Responsive Mobile - 20 Janvier 2026

## Contexte
Tentative d'adaptation mobile du site avec CSS responsive.
Problème : difficultés à isoler les modifications mobile sans impacter le desktop.
Décision : rollback complet et approche séparée si nécessaire.

## Fichiers sauvegardés
- `responsive-mobile.css` - CSS responsive avec @media queries
- `tab-dashboard.html` - Dashboard avec attributs data-mobile et sections collapsables
- `shared-utils.js` - Fonctions initMobileMenu() et gestion du menu hamburger

## Modifications effectuées
1. **CSS Mobile** (responsive-mobile.css v7.1)
   - Header centré avec hamburger menu
   - Dashboard 2 colonnes sur mobile
   - Sections collapsables (Vision Actions)
   - Textes abrégés via data-mobile + ::before
   - Onglet Réservations : 1 colonne, masquer vides, masquer boutons edit
   - Marges réduites à 0

2. **HTML Dashboard** (tab-dashboard.html)
   - Attributs `data-mobile` sur titres et labels
   - Classes `.indicator-box`, `.box-title`, `.indicator-label`
   - Sections avec `.mobile-collapse-section`, `.mobile-collapse-header`, `.mobile-collapse-content`

3. **JavaScript** (shared-utils.js)
   - `initMobileMenu()` - Génère menu hamburger depuis onglets
   - `initMobileSections()` - Gère sections collapsables
   - `toggleMobileSection(id)` - Toggle visibilité sections
   - Transformation bouton user menu en déconnexion sur mobile

4. **HTML Principal** (index.html)
   - Menu hamburger (bouton + nav + overlay)
   - Liens CSS responsive-mobile.css

## Problèmes rencontrés
- CSS @media s'appliquait parfois au desktop (cache browser, sélecteurs trop larges)
- Difficile de maintenir 2 versions (desktop/mobile) dans le même code
- Risque élevé de casser le desktop à chaque modification mobile

## Recommandations futures
Si reprise du mobile :
1. Approche Progressive Web App (PWA) avec détection user-agent
2. Ou sous-domaine séparé m.site.com avec code dédié
3. Ou framework responsive type Bootstrap/Tailwind avec composants isolés
