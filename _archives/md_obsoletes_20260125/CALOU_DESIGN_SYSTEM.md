# 🐺 CALOU Design System

## Vue d'ensemble

**CALOU** (Calvignac Alpha Lodging Operations Unified) est le système de design moderne pour la gestion des gîtes Calvignac. Il combine un style épuré, des composants inspirés de **shadcn/ui**, et une identité visuelle forte avec le logo "Loup Alpha".

---

## 🎨 Identité Visuelle

### Philosophie Design

- **Minimaliste & Puissant** : Design épuré avec une hiérarchie visuelle forte
- **Alpha Attitude** : Symbole du loup représentant la meute (vos gîtes) et la synchronisation
- **Professionnel** : Interface de qualité production pour une gestion rigoureuse

### Logo Loup Alpha

```html
<svg class="wolf-logo" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.5">
    <path d="M12 2L18 10L22 8L19 14L12 22L5 14L2 8L6 10L12 2Z"/>
    <path d="M10 12h4" opacity="0.3"/>
</svg>
```

**Caractéristiques** :
- Géométrique Low-Poly (traits épurés)
- Oreilles en arrière (attitude agressive/déterminée)
- Museau pointu vers le haut
- Animation au hover (stroke-dasharray)

---

## 🎨 Palette de Couleurs

### Mode Sombre (Par défaut)

```css
:root {
    --bg: #050505;           /* Fond presque noir */
    --card: rgba(255, 255, 255, 0.02);  /* Cartes translucides */
    --text: #f8fafc;         /* Texte blanc cassé */
    --border: rgba(255, 255, 255, 0.06); /* Bordures subtiles */
    --accent: #6366f1;       /* Indigo primaire */
}
```

### Mode Clair

```css
.light-theme {
    --bg: #f8fafc;           /* Gris très clair */
    --card: #ffffff;         /* Blanc pur */
    --text: #0f172a;         /* Texte sombre */
    --border: #e2e8f0;       /* Bordures claires */
    --accent: #4f46e5;       /* Indigo ajusté */
}
```

### Couleurs Sémantiques

- **Succès** : `#10b981` (Emerald-500)
- **Attention** : `#f59e0b` (Amber-500)
- **Erreur** : `#ef4444` (Rose-500)
- **Info** : `#6366f1` (Indigo-500)

---

## 📐 Typographie

### Famille de Police

**Plus Jakarta Sans** (Google Fonts)

```css
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;800&display=swap');

body { 
    font-family: 'Plus Jakarta Sans', sans-serif; 
}
```

### Hiérarchie Typographique

| Élément | Taille | Poids | Classe |
|---------|--------|-------|--------|
| Titre principal | `3xl` (30px) | 800 | `font-extrabold tracking-tighter uppercase` |
| KPI chiffres | `5xl` (48px) | 800 | `font-extrabold tracking-tighter` |
| Labels KPI | `10px` | 700 | `font-bold uppercase tracking-widest opacity-40` |
| Sections | `xs` (12px) | 700 | `font-bold uppercase tracking-[0.3em] opacity-30` |
| Corps de texte | `sm` (14px) | 600 | `font-semibold` |

---

## 🧩 Composants

### Glass Card

Carte translucide avec effet de flou (glassmorphism) :

```css
.glass-card {
    background: var(--card);
    backdrop-filter: blur(16px);
    border: 1px solid var(--border);
    border-radius: 28px;
}
```

**Usage** :
```html
<div class="glass-card p-8">
    <!-- Contenu -->
</div>
```

### Carte KPI

Affiche une métrique avec label, valeur et indicateur :

```html
<div class="glass-card p-8">
    <p class="text-[10px] font-bold opacity-40 uppercase tracking-widest mb-6">CA 2026</p>
    <h3 class="text-5xl font-extrabold tracking-tighter text-emerald-500 mb-4">12 450 €</h3>
    <p class="text-[10px] font-bold">+15% vs mois dernier</p>
</div>
```

**Variantes** :
- Bordure supérieure de couleur : `border-t-2 border-emerald-500`
- Fond teinté : `bg-indigo-600/[0.03]`

### Carte Mission/Réservation

```html
<div class="glass-card p-6 flex items-center justify-between hover:border-indigo-500/50 transition cursor-pointer">
    <div class="flex items-center gap-6">
        <div class="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-xl">🐺</div>
        <div>
            <p class="font-bold text-lg">DUPONT <span class="text-xs font-normal opacity-40 ml-2">Trévoux</span></p>
            <p class="text-xs text-indigo-400 font-semibold">Sortie prévue : 28/01 • Préparer ménage</p>
        </div>
    </div>
    <button class="bg-white text-black px-6 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest">Détails</button>
</div>
```

### Bouton Primaire

```html
<button class="bg-white text-black px-6 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest">
    Action
</button>
```

### Bouton Secondaire

```html
<button class="p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all">
    Contenu
</button>
```

### Alerte

```html
<div class="glass-card p-6 border-l-4 border-amber-500">
    <p class="text-sm font-bold text-amber-500">⚠️ Alertes</p>
    <div class="mt-4 p-3 bg-white/5 rounded-xl flex items-center gap-3">
        <div class="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
        <p class="text-xs font-semibold">Message d'alerte</p>
    </div>
</div>
```

---

## 🎯 Icônes

### Style

**Lucide / Phosphor Icons** :
- Traits fins (`stroke-width: 2`)
- Angles légèrement arrondis
- Minimaliste et précis

### Sprite SVG

Fichier : `assets/icons-modern/sprite-lucide.svg`

**Utilisation** :

```html
<!-- Injection du sprite -->
<div id="icons-sprite"></div>
<script>
  fetch('assets/icons-modern/sprite-lucide.svg')
    .then(r=>r.text())
    .then(svg=>{ document.getElementById('icons-sprite').innerHTML = svg; });
</script>

<!-- Utilisation d'une icône -->
<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <use href="#icon-calendar" />
</svg>
```

### Icônes Disponibles

- `#icon-home` : Accueil
- `#icon-calendar` : Calendrier
- `#icon-broom` : Ménage
- `#icon-linen` : Linge
- `#icon-dashboard` : Tableau de bord
- `#icon-alert` : Alerte
- `#icon-settings` : Paramètres
- `#icon-user` : Utilisateur
- `#icon-wifi` : WiFi
- `#icon-key` : Clé
- `#icon-parking` : Parking
- `#icon-bed` : Lit
- `#icon-map` : Carte
- `#icon-euro` : Euro
- `#icon-doc` : Document
- `#icon-share` : Partager
- `#icon-sync` : Synchronisation
- `#icon-check` : Validation
- `#icon-clock` : Horloge
- `#logo-wolf-alpha` : Logo loup

---

## 📐 Layout & Grilles

### Structure Principale

```html
<nav class="max-w-7xl mx-auto flex justify-between items-center mb-16">
    <!-- Header -->
</nav>

<main class="max-w-7xl mx-auto">
    <!-- KPI en grille 3 colonnes -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <!-- Cartes KPI -->
    </div>

    <!-- Section principale 2/3 + sidebar 1/3 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div class="lg:col-span-2">
            <!-- Contenu principal -->
        </div>
        <div>
            <!-- Sidebar -->
        </div>
    </div>
</main>
```

### Responsive

- **Mobile** : 1 colonne, padding réduit (`p-4`)
- **Tablette** : Activation grille 2-3 colonnes (`md:grid-cols-3`)
- **Desktop** : Layout complet avec sidebar (`lg:col-span-2`)

---

## 🎭 Animations

### Logo Hover

```css
.wolf-logo:hover path {
    stroke-dasharray: 100;
    animation: dash 2s linear infinite;
}
@keyframes dash { 
    from { stroke-dashoffset: 200; } 
    to { stroke-dashoffset: 0; } 
}
```

### Pulse Dot

```html
<div class="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></div>
```

### Hover Card

```css
.glass-card:hover {
    border-color: rgba(99, 102, 241, 0.5);
    transition: all 0.3s ease;
}
```

---

## 📦 Fichiers du Système

| Fichier | Rôle |
|---------|------|
| `calou-design.html` | Page de démo complète CALOU |
| `assets/icons-modern/sprite-lucide.svg` | Sprite d'icônes style Lucide |
| `CALOU_DESIGN_SYSTEM.md` | Ce fichier de documentation |

---

## 🚀 Intégration

### Étapes

1. **Injecter le sprite d'icônes** dans le `<body>` :
   ```html
   <div id="icons-sprite"></div>
   <script>
     fetch('assets/icons-modern/sprite-lucide.svg')
       .then(r=>r.text())
       .then(svg=>{ document.getElementById('icons-sprite').innerHTML = svg; });
   </script>
   ```

2. **Importer Plus Jakarta Sans** :
   ```css
   @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;800&display=swap');
   ```

3. **Définir les variables CSS** (voir section Palette).

4. **Utiliser Tailwind CDN** pour les utilitaires :
   ```html
   <script src="https://cdn.tailwindcss.com"></script>
   ```

5. **Appliquer les composants** selon les patterns ci-dessus.

---

## ✅ Checklist Qualité

- ✅ Police Plus Jakarta Sans chargée
- ✅ Sprite SVG injecté sans erreur
- ✅ Thème sombre/clair fonctionnel
- ✅ Responsive mobile validé
- ✅ Animations fluides (60 FPS)
- ✅ Zéro erreur console
- ✅ Contrastes WCAG AA respectés

---

## 📚 Références

- **shadcn/ui** : https://ui.shadcn.com
- **Lucide Icons** : https://lucide.dev
- **Phosphor Icons** : https://phosphoricons.com
- **Tailwind CSS** : https://tailwindcss.com
- **Plus Jakarta Sans** : https://fonts.google.com/specimen/Plus+Jakarta+Sans

---

**Version** : 1.0.0  
**Date** : 23 janvier 2026  
**Auteur** : GitHub Copilot + gitewelcomehome-png
