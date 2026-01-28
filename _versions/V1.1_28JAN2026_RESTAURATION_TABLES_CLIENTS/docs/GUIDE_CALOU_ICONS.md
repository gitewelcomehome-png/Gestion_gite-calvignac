# 🎨 CALOU Icons - Guide d'Utilisation

## 📦 Vue d'ensemble

Système d'icônes complet pour CALOU basé sur le style **Lucide/Phosphor** : traits fins, angles arrondis, minimaliste.

---

## 🚀 Installation

### Méthode 1 : Auto-injection (Recommandé)

Charger le script dans votre page :

```html
<script src="js/calou-icons.js"></script>
```

Le sprite sera automatiquement injecté et mis en cache (24h).

### Méthode 2 : Injection manuelle

```javascript
await window.CALOUIcons.inject();
```

---

## 🎯 Utilisation

### Méthode 1 : Placeholder HTML (Plus simple)

```html
<!-- Icône simple -->
<i data-calou-icon="home"></i>

<!-- Avec taille -->
<i data-calou-icon="calendar" data-size="lg"></i>

<!-- Avec couleur -->
<i data-calou-icon="alert" data-size="xl" data-color="error"></i>
```

Les placeholders sont automatiquement remplacés par des SVG.

### Méthode 2 : SVG Direct

```html
<svg class="calou-icon calou-icon-lg calou-icon-primary" viewBox="0 0 24 24">
    <use href="#icon-home" />
</svg>
```

### Méthode 3 : JavaScript

```javascript
const iconHtml = window.CALOUIcons.create('calendar', {
    size: 'lg',
    color: 'primary',
    className: 'custom-class'
});
document.getElementById('container').innerHTML = iconHtml;
```

---

## 📐 Tailles Disponibles

| Classe | Taille | Usage |
|--------|--------|-------|
| `.calou-icon-xs` | 12px | Badges, tags |
| `.calou-icon-sm` | 16px | Texte inline, boutons compacts |
| `.calou-icon-md` | 20px | Par défaut, usage général |
| `.calou-icon-lg` | 24px | Titres, headers |
| `.calou-icon-xl` | 32px | Hero sections |
| `.calou-icon-2xl` | 48px | Landing, logos |

---

## 🎨 Couleurs Disponibles

| Classe | Variable CSS | Usage |
|--------|--------------|-------|
| `.calou-icon-primary` | `--calou-accent` | Actions principales |
| `.calou-icon-success` | `--calou-success` | Validations, succès |
| `.calou-icon-warning` | `--calou-warning` | Alertes, attention |
| `.calou-icon-error` | `--calou-error` | Erreurs, danger |
| `.calou-icon-muted` | `currentColor` (50%) | Éléments secondaires |

---

## 🎭 Styles Spéciaux

```html
<!-- Icône pleine -->
<i data-calou-icon="home" class="calou-icon-filled"></i>

<!-- Avec ombre -->
<i data-calou-icon="user" class="calou-icon-shadow"></i>

<!-- Animation rotation -->
<i data-calou-icon="sync" class="calou-icon-spin"></i>

<!-- Animation pulse -->
<i data-calou-icon="alert" class="calou-icon-pulse"></i>
```

---

## 📚 Icônes Disponibles

### Navigation & UI
- `home` - Accueil
- `dashboard` - Tableau de bord
- `settings` - Paramètres
- `user` - Utilisateur
- `menu` - Menu hamburger

### Gestion
- `calendar` - Calendrier
- `clock` - Horloge, temps
- `euro` - Monnaie, paiements
- `doc` - Documents
- `share` - Partager

### Gîtes & Hébergement
- `bed` - Lit, couchage
- `key` - Clés, accès
- `wifi` - WiFi
- `parking` - Parking
- `map` - Carte, localisation

### Tâches & Ménage
- `broom` - Ménage
- `linen` - Draps, linge
- `check` - Validation
- `alert` - Alerte, attention

### Actions
- `sync` - Synchronisation
- `plus` - Ajouter
- `edit` - Éditer
- `trash` - Supprimer
- `search` - Rechercher

### Logo
- `logo-wolf-alpha` - Logo loup CALOU

**Liste complète** :
```javascript
window.CALOUIcons.list(); // Retourne tous les noms d'icônes
```

---

## 💡 Exemples d'Utilisation

### Dans un Bouton

```html
<button class="calou-btn-primary">
    <i data-calou-icon="calendar" data-size="sm"></i>
    Voir le calendrier
</button>
```

### Dans un Titre de Section

```html
<h2 class="calou-section-title">
    <i data-calou-icon="dashboard" data-size="md" data-color="primary"></i>
    Tableau de Bord
</h2>
```

### Dans une Carte KPI

```html
<div class="calou-card calou-kpi">
    <div class="calou-flex calou-items-center calou-gap-2 calou-mb-4">
        <i data-calou-icon="euro" data-size="lg" data-color="success"></i>
        <p class="calou-kpi-label">Chiffre d'Affaires</p>
    </div>
    <h3 class="calou-kpi-value">12 450 €</h3>
</div>
```

### Dans une Alerte

```html
<div class="calou-card calou-alert calou-alert-warning">
    <i data-calou-icon="alert" data-size="lg" data-color="warning"></i>
    <div>
        <p class="calou-alert-title">Attention requise</p>
        <p>Stock de draps faible</p>
    </div>
</div>
```

### Icône Interactive

```html
<i data-calou-icon="settings" 
   data-size="lg" 
   class="calou-icon-interactive"
   onclick="openSettings()"></i>
```

---

## ⚙️ API JavaScript

### Injection du Sprite

```javascript
await window.CALOUIcons.inject();
```

### Créer une Icône

```javascript
const icon = window.CALOUIcons.create('home', {
    size: 'lg',           // xs, sm, md, lg, xl, 2xl
    color: 'primary',     // primary, success, warning, error, muted
    className: 'my-class',
    style: 'margin-right: 8px;'
});
```

### Remplacer les Placeholders

```javascript
window.CALOUIcons.replace();
```

### Lister les Icônes

```javascript
const icons = window.CALOUIcons.list();
console.log(icons); // ['home', 'calendar', 'user', ...]
```

### Vider le Cache

```javascript
window.CALOUIcons.clearCache();
```

---

## 🧹 Cache & Performance

### Stratégie de Cache

- **Durée** : 24 heures dans localStorage
- **Invalidation** : Automatique après expiration
- **Avantage** : Zéro requête réseau après le premier chargement

### Forcer le Rechargement

```javascript
window.CALOUIcons.clearCache();
location.reload();
```

---

## 🎨 Personnalisation

### Modifier les Couleurs

Éditer les variables CSS dans `calou-core.css` :

```css
:root.calou-theme {
    --calou-accent: #6366f1;    /* Primaire */
    --calou-success: #10b981;   /* Succès */
    --calou-warning: #f59e0b;   /* Attention */
    --calou-error: #ef4444;     /* Erreur */
}
```

### Ajouter des Animations Personnalisées

```css
.my-custom-animation {
    animation: my-animation 1s ease-in-out infinite;
}

@keyframes my-animation {
    0% { transform: scale(1); }
    50% { transform: scale(1.2); }
    100% { transform: scale(1); }
}
```

---

## 🐛 Dépannage

### Les icônes ne s'affichent pas

1. Vérifier que le script est chargé :
   ```javascript
   console.log(window.CALOUIcons);
   ```

2. Vérifier que le sprite est injecté :
   ```javascript
   console.log(document.getElementById('calou-icons-sprite'));
   ```

3. Vérifier la console pour les erreurs de fetch

### Les icônes sont trop grandes/petites

Utiliser les classes de taille appropriées ou CSS personnalisé :

```css
.my-icon {
    width: 18px;
    height: 18px;
}
```

### Les couleurs ne s'appliquent pas

S'assurer que le thème CALOU est actif :

```javascript
document.documentElement.classList.add('calou-theme');
```

---

## 📊 Compatibilité

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ Support localStorage requis
- ✅ Support SVG `<use>` requis

---

## 🔗 Ressources

- **Sprite SVG** : [assets/icons-modern/sprite-lucide.svg](../../assets/icons-modern/sprite-lucide.svg)
- **CSS** : [css/calou/calou-icons.css](../../css/calou/calou-icons.css)
- **JavaScript** : [js/calou-icons.js](../../js/calou-icons.js)
- **Preview** : Ouvrir l'onglet **🐺 Test CALOU** dans l'app

---

**Version** : 1.0.0  
**Date** : 23 janvier 2026  
**Style** : Lucide/Phosphor  
**Auteur** : GitHub Copilot + gitewelcomehome-png
