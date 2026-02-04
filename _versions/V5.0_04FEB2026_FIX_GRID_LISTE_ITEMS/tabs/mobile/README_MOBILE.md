# Pages Mobile - Gestion Gîtes

## 📱 Pages Créées

### ✅ Pages Fonctionnelles
- **dashboard.html** - Tableau de bord avec indicateurs financiers et actions
- **reservations.html** - Planning des réservations simplifié
- **menage.html** - Planning ménage avec validation
- **draps.html** - Gestion stock draps et mouvements
- **checklists.html** - Listes de contrôle par gîte
- **gestion.html** - Gestion des gîtes (CRUD)
- **fiches-clients.html** - Base clients simplifiée
- **archives.html** - Archives réservations passées
- **infos-gites.html** - Calendrier et tarifs

### ❌ Pages Exclues du Menu Mobile
- Statistiques
- Fiscalité LMNP
- Infos Pratiques (FAQ)
- À Découvrir

## 🎨 Caractéristiques

### Design
- Style Neo-Brutalism adapté mobile
- Sections collapsables pour économiser l'espace
- Boutons tactiles (min 44px)
- Grilles adaptatives (1-2 colonnes max)
- Safe areas pour iPhone

### Fonctionnalités
- Menu hamburger avec déconnexion
- Actualisation par page
- Filtres collapsables
- Actions simplifiées
- Recherche intégrée

## 🔧 JavaScript Partagé

Les pages mobiles utilisent les mêmes fonctions JavaScript que les versions desktop :
- `refreshDashboard()`
- `forceRefreshReservations()`
- `filterMenages()`
- `openAddClientModal()`
- etc.

## 📐 Structure

Chaque page mobile contient :
1. Header avec titre et bouton actualiser
2. Filtres collapsables si nécessaire  
3. Zone de contenu principale
4. Styles inline spécifiques mobile

## 🚀 Utilisation

Les pages se chargent automatiquement selon la détection mobile dans `index.html` :
```javascript
const isMobile = /Android|webOS|iPhone|iPad/.test(navigator.userAgent) || window.innerWidth <= 768;
'tab-dashboard': isMobile ? 'tabs/mobile/dashboard.html' : 'tabs/tab-dashboard.html'
```

## 📝 Notes

- Toutes les données restent synchronisées avec le backend
- Les modals desktop fonctionnent aussi sur mobile
- Les formulaires utilisent `font-size: 16px` pour éviter le zoom auto iOS
