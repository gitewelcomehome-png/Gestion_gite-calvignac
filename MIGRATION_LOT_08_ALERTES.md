# MIGRATION LOT 08 - ALERTES
**Date**: 26 janvier 2026  
**Version CSS**: 2.9.0

## 📋 Classes concernées

- `.alert` - Alerte de base
- `.alert-success` - Succès (vert)
- `.alert-warning` - Avertissement (orange)
- `.alert-danger` - Erreur (rouge)
- `.alert-info` - Information (bleu)
- `.alert-dismissible` - Avec bouton fermeture

## 🎨 Styles CSS

```css
/* ═══════════════════════════════════════════════════════════════════════
   ALERTES - LOT 08 (26 JAN 2026)
   ═══════════════════════════════════════════════════════════════════════ */

.alert {
    padding: 16px 20px;
    border-radius: 10px;
    border-left: 4px solid;
    display: flex;
    align-items: flex-start;
    gap: 12px;
    margin-bottom: 16px;
    animation: alertSlideIn 0.3s ease;
}

@keyframes alertSlideIn {
    from { 
        opacity: 0; 
        transform: translateX(-20px);
    }
    to { 
        opacity: 1; 
        transform: translateX(0);
    }
}

.alert-success {
    background: rgba(16, 185, 129, 0.1);
    border-left-color: #10b981;
    color: #10b981;
}

.alert-warning {
    background: rgba(251, 146, 60, 0.1);
    border-left-color: #fb923c;
    color: #fb923c;
}

.alert-danger {
    background: rgba(239, 68, 68, 0.1);
    border-left-color: #ef4444;
    color: #ef4444;
}

.alert-info {
    background: rgba(59, 130, 246, 0.1);
    border-left-color: #3b82f6;
    color: #3b82f6;
}

.alert-dismissible {
    padding-right: 48px;
    position: relative;
}

.alert-close {
    position: absolute;
    right: 12px;
    top: 12px;
    background: transparent;
    border: none;
    font-size: 1.2rem;
    cursor: pointer;
    opacity: 0.6;
    transition: opacity 0.2s;
}

.alert-close:hover {
    opacity: 1;
}

/* Adaptation APPLE */
html.style-apple .alert {
    border-radius: 14px;
    padding: 18px 24px;
}

/* Adaptation SIDEBAR */
html.style-sidebar .alert {
    border-radius: 6px;
    border-left-width: 6px;
}
```

## 📝 Exemples HTML

```html
<!-- Alertes simples -->
<div class="alert alert-success">
    ✅ Opération réussie !
</div>

<div class="alert alert-warning">
    ⚠️ Attention : vérifiez les informations.
</div>

<div class="alert alert-danger">
    ❌ Erreur : impossible de sauvegarder.
</div>

<div class="alert alert-info">
    ℹ️ Nouvelle fonctionnalité disponible.
</div>

<!-- Alerte avec fermeture -->
<div class="alert alert-success alert-dismissible">
    ✅ Données sauvegardées avec succès !
    <button class="alert-close" onclick="this.parentElement.remove()">×</button>
</div>
```

## ✅ Intégration

Styles ajoutés dans `css/main.css` après la section CARTES.
