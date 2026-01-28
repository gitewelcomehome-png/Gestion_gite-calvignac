# 🎨 Quick Reference - Classes BEM Modulaires

## Switch Thème (1 ligne)
```html
<body class="theme-apple-modern">  <!-- ou theme-material -->
```

## Layouts

### Headers
```html
<header class="page-header">
    <div class="page-header__content">
        <h1 class="page-title">Titre</h1>
        <p class="page-subtitle">Sous-titre</p>
    </div>
    <div class="page-header__actions">
        <button class="btn btn--refresh">Bouton</button>
    </div>
</header>
```

### Sections
```html
<section class="section section--spaced">
    <h2 class="section-title mb-lg">Titre Section</h2>
    <!-- Contenu -->
</section>
```

### Alertes
```html
<section class="section-alert section-alert--danger">  <!-- ou warning, info, success -->
    <header class="section-header">
        <h3 class="section-title">Titre</h3>
        <span class="badge badge--danger badge--count">3</span>
    </header>
</section>
```

## Grilles

### Grid 2/3/4 colonnes
```html
<div class="grid grid--2 gap-lg">  <!-- grid--3, grid--4 -->
    <div>Colonne 1</div>
    <div>Colonne 2</div>
</div>
```

### Grid responsive
```html
<div class="grid grid--auto gap-md">  <!-- Auto-fit 250px min -->
    <div>Item 1</div>
    <div>Item 2</div>
</div>
```

### Flexbox
```html
<div class="flex flex--between flex--center gap-md">
    <div>Gauche</div>
    <div>Droite</div>
</div>
```

## Cartes & Indicateurs

### Carte simple
```html
<div class="card card--spacious">  <!-- ou card--compact -->
    <h3 class="section-title">Titre</h3>
    <p>Contenu</p>
</div>
```

### Indicateur chiffré
```html
<div class="indicator indicator--success">  <!-- ou primary, warning, danger, info -->
    <div class="indicator__label">Label</div>
    <div class="indicator__value">1 250 €</div>
    <div class="indicator__sublabel">Sous-label</div>
</div>
```

## Badges & Boutons

### Badges
```html
<span class="badge badge--primary">Badge</span>
<span class="badge badge--success badge--count">5</span>
```

### Boutons
```html
<button class="btn btn--refresh">Actualiser</button>
<button class="btn btn--icon btn--primary">+</button>
<button class="btn btn--icon btn--success">✓</button>
```

## Espacements

### Margin & Padding
```html
<div class="mb-lg mt-md p-lg">  <!-- xs, sm, md, lg, xl -->
```

### Gap
```html
<div class="flex gap-lg">  <!-- xs, sm, md, lg, xl -->
```

## Widgets

### Date
```html
<div class="widget-date">
    <div class="widget-date__current">26 janvier 2026</div>
    <div class="widget-date__week">Semaine 4</div>
</div>
```

## Thèmes

| Classe | Style | Bordures | Ombres |
|--------|-------|----------|--------|
| (aucune) | Rétro | 3px | Offset |
| `.theme-apple-modern` | Apple | 1px | Douces |
| `.theme-material` | Material | 0 | Élévations |

## Test
```bash
# Ouvrir dans le navigateur
test-themes.html
```
