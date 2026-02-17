# 🎨 Guide des Thèmes Interchangeables

## Vue d'ensemble

Le système de design modulaire permet de **changer facilement de style visuel** en ajoutant simplement une classe au `body`.

## 🎯 Thèmes Disponibles

### 1. Thème Rétro (Défaut - Actuel)
```html
<body>
  <!-- Pas de classe spéciale -->
</body>
```

**Caractéristiques:**
- Bordures épaisses (3px)
- Ombres "dures" (offset style)
- Arrondis moyens (12-16px)
- Style "néo-brutaliste" Apple-like

### 2. Thème Apple Moderne
```html
<body class="theme-apple-modern">
  <!-- Contenu -->
</body>
```

**Caractéristiques:**
- Bordures fines (1px)
- Ombres douces et subtiles
- Arrondis plus prononcés (14-18px)
- Transitions fluides
- Style iOS/macOS

### 3. Thème Material Design
```html
<body class="theme-material">
  <!-- Contenu -->
</body>
```

**Caractéristiques:**
- Pas de bordures
- Élévations (shadows) prononcées
- Arrondis discrets (4-12px)
- Style Google Material

## 💻 Comment Changer de Thème

### Méthode 1 : Directement dans le HTML
```html
<!-- Dans index.html, ligne ~10 -->
<body class="theme-apple-modern">
```

### Méthode 2 : Via JavaScript (Switch dynamique)
```javascript
// Ajouter un bouton dans le header
function switchTheme(themeName) {
    // Retirer tous les thèmes
    document.body.classList.remove('theme-apple-modern', 'theme-material');
    
    // Ajouter le nouveau (si différent de défaut)
    if (themeName !== 'default') {
        document.body.classList.add('theme-' + themeName);
    }
    
    // Sauvegarder dans localStorage
    localStorage.setItem('selectedTheme', themeName);
}

// Au chargement : restaurer le thème sauvegardé
document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('selectedTheme');
    if (savedTheme && savedTheme !== 'default') {
        document.body.classList.add('theme-' + savedTheme);
    }
});
```

### Méthode 3 : Menu de sélection
```html
<!-- Ajouter dans le header -->
<div class="theme-selector">
    <select onchange="switchTheme(this.value)">
        <option value="default">🎨 Rétro</option>
        <option value="apple-modern">🍎 Apple Moderne</option>
        <option value="material">📱 Material</option>
    </select>
</div>
```

## 🛠️ Créer un Nouveau Thème

### Étape 1 : Définir les variables
```css
/* Dans css/main.css, Section P.9 */

/* Theme Custom */
body.theme-custom {
    /* Bordures */
    --border-width: 2px;
    --border-radius-sm: 6px;
    --border-radius-md: 10px;
    --border-radius-lg: 14px;
    
    /* Ombres */
    --shadow-retro-sm: 0 1px 3px rgba(0, 0, 0, 0.1);
    --shadow-retro-md: 0 3px 6px rgba(0, 0, 0, 0.15);
    --shadow-retro-lg: 0 6px 12px rgba(0, 0, 0, 0.2);
}

/* Ajuster les éléments si nécessaire */
body.theme-custom .section,
body.theme-custom .card {
    /* Styles spécifiques au thème */
    border-width: 2px;
}

body.theme-custom .section:hover,
body.theme-custom .card:hover {
    transform: translateY(-3px);
    box-shadow: var(--shadow-lg);
}
```

### Étape 2 : Ajouter au sélecteur
```html
<option value="custom">✨ Custom</option>
```

## 📊 Comparaison Visuelle

| Propriété | Rétro (Défaut) | Apple Moderne | Material |
|-----------|----------------|---------------|----------|
| Bordures | 3px épaisses | 1px fines | 0 (aucune) |
| Ombres | Offset durs | Douces subtiles | Élévations |
| Arrondis | Moyens (12-16px) | Prononcés (14-18px) | Discrets (4-12px) |
| Transitions | Moyennes | Fluides | Rapides |
| Hover | translateY(-2px) | translateY(-4px) | translateY(-2px) |

## 🎨 Variables Modifiables par Thème

Les variables suivantes peuvent être surchargées dans chaque thème :

```css
/* Espacements */
--spacing-xs, --spacing-sm, --spacing-md, --spacing-lg, --spacing-xl

/* Bordures */
--border-width, --border-width-thin
--border-radius-sm, --border-radius-md, --border-radius-lg

/* Ombres */
--shadow-retro-sm, --shadow-retro-md, --shadow-retro-lg

/* Transitions */
--transition-fast, --transition-base, --transition-slow

/* Couleurs sémantiques (optionnel) */
--color-danger, --color-warning, --color-success, --color-info, --color-primary
```

## 🔄 Mode JOUR/NUIT

Le système de thèmes est **indépendant** du mode JOUR/NUIT.

Les deux fonctionnent ensemble :
```html
<!-- Mode nuit + Thème Apple Moderne -->
<body class="theme-apple-modern">
  <!-- Variables --bg, --card, --text s'appliquent automatiquement -->
</body>

<!-- Mode jour + Thème Apple Moderne -->
<body class="theme-light theme-apple-modern">
  <!-- Variables mode jour + style Apple -->
</body>
```

## 💡 Bonnes Pratiques

### ✅ À FAIRE
- Toujours utiliser les **variables CSS** dans les classes
- Tester chaque thème en mode **JOUR et NUIT**
- Garder les **transitions fluides**
- Maintenir la **cohérence** des espacements

### ❌ À ÉVITER
- Hardcoder des valeurs dans les classes BEM
- Créer des thèmes trop différents (perte de cohérence)
- Oublier de tester le responsive
- Mélanger styles inline et classes

## 🚀 Exemple Complet

```html
<!DOCTYPE html>
<html lang="fr">
<head>
    <link rel="stylesheet" href="css/main.css">
</head>
<body class="theme-apple-modern"> <!-- Thème sélectionné -->
    
    <!-- Header avec sélecteur -->
    <header class="page-header">
        <h1 class="page-title">Mon Site</h1>
        <div class="theme-selector">
            <select id="theme-select" onchange="switchTheme(this.value)">
                <option value="default">🎨 Rétro</option>
                <option value="apple-modern" selected>🍎 Apple Moderne</option>
                <option value="material">📱 Material</option>
            </select>
        </div>
    </header>
    
    <!-- Contenu avec classes BEM -->
    <section class="section section--spaced">
        <h2 class="section-title">Ma Section</h2>
        <div class="grid grid--2 gap-lg">
            <div class="card card--spacious">
                <div class="indicator indicator--success">
                    <div class="indicator__value">1 250 €</div>
                    <div class="indicator__label">Chiffre d'affaires</div>
                </div>
            </div>
        </div>
    </section>
    
    <script>
        function switchTheme(themeName) {
            document.body.classList.remove('theme-apple-modern', 'theme-material');
            if (themeName !== 'default') {
                document.body.classList.add('theme-' + themeName);
            }
            localStorage.setItem('selectedTheme', themeName);
        }
        
        // Restaurer au chargement
        const savedTheme = localStorage.getItem('selectedTheme') || 'apple-modern';
        if (savedTheme !== 'default') {
            document.body.classList.add('theme-' + savedTheme);
        }
        document.getElementById('theme-select').value = savedTheme;
    </script>
</body>
</html>
```

## 📝 Notes

- **Sidebar préservée** : Le menu latéral reste inchangé quel que soit le thème
- **Performance** : Les thèmes utilisent uniquement des variables CSS (0 impact)
- **Compatibilité** : Fonctionne avec tous les navigateurs modernes
- **Extensible** : Ajouter un thème = ajouter une classe `body.theme-xxx`

## 🆘 Dépannage

**Le thème ne change pas ?**
- Vérifier que la classe est bien ajoutée au `body`
- Vider le cache CSS (Ctrl+Shift+R)
- Vérifier la console pour erreurs JS

**Les couleurs JOUR/NUIT ne fonctionnent plus ?**
- Les thèmes **ne touchent PAS** aux variables `--bg`, `--card`, `--text`
- Vérifier que `:root.theme-light` est bien défini

**Un élément ne suit pas le thème ?**
- Vérifier qu'il utilise bien les **variables CSS** (`var(--border-width)`)
- Remplacer les valeurs hardcodées par des variables
