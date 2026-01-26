# MIGRATION LOT 07 - CARTES
**Date**: 26 janvier 2026  
**Version CSS**: 2.9.0

## 📋 Classes concernées

- `.card` - Carte de base
- `.card-header` - En-tête de carte
- `.card-body` - Corps de carte
- `.card-footer` - Pied de carte
- `.card-title` - Titre
- `.card-text` - Texte
- `.card-hover` - Effet hover

## 🎨 Styles CSS

```css
/* ═══════════════════════════════════════════════════════════════════════
   CARTES - LOT 07 (26 JAN 2026)
   ═══════════════════════════════════════════════════════════════════════ */

.card {
    background: var(--bg-secondary);
    border: 2px solid var(--border-color);
    border-radius: 12px;
    padding: 20px;
    transition: all 0.2s;
}

.card-hover {
    cursor: pointer;
}

.card-hover:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow);
    border-color: var(--upstay-cyan);
}

.card-header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding-bottom: 16px;
    margin-bottom: 16px;
    border-bottom: 2px solid var(--border-color);
}

.card-title {
    margin: 0;
    font-size: 1.2rem;
    font-weight: 700;
    line-height: 1.4;
}

.card-body {
    padding: 0;
}

.card-text {
    color: var(--text-secondary);
    line-height: 1.6;
}

.card-footer {
    padding-top: 16px;
    margin-top: 16px;
    border-top: 2px solid var(--border-color);
    display: flex;
    gap: 12px;
    justify-content: flex-end;
}

/* Adaptation APPLE */
html.style-apple .card {
    border-radius: 16px;
    padding: 24px;
}

html.style-apple .card-hover:hover {
    transform: translateY(-4px) scale(1.01);
}

/* Adaptation SIDEBAR */
html.style-sidebar .card {
    border-radius: 8px;
    border-left-width: 4px;
}

html.style-sidebar .card-hover:hover {
    border-left-color: var(--upstay-cyan);
}
```

## 📝 Exemple HTML

```html
<div class="card card-hover">
    <div class="card-header">
        <span class="card-icon">🏠</span>
        <h3 class="card-title">Titre de la carte</h3>
    </div>
    <div class="card-body">
        <p class="card-text">
            Contenu de la carte avec du texte descriptif.
        </p>
    </div>
    <div class="card-footer">
        <button class="btn-secondary">Annuler</button>
        <button class="btn-primary">Action</button>
    </div>
</div>
```

## ✅ Intégration

Styles ajoutés dans `css/main.css` après la section MODALES.
