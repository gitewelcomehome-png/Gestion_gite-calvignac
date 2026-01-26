# MIGRATION LOT 06 - MODALES
**Date**: 26 janvier 2026  
**Version CSS**: 2.9.0

## 📋 Classes concernées

- `.modal` - Overlay fond
- `.modal-content` - Contenu de la modale
- `.modal-header` - En-tête
- `.modal-body` - Corps
- `.modal-footer` - Pied avec actions
- `.modal-close` - Bouton fermeture

## 🎨 Styles CSS

```css
/* ═══════════════════════════════════════════════════════════════════════
   MODALES - LOT 06 (26 JAN 2026)
   ═══════════════════════════════════════════════════════════════════════ */

.modal {
    display: none;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(4px);
    z-index: 9999;
    align-items: center;
    justify-content: center;
}

.modal.active {
    display: flex;
}

.modal-content {
    background: var(--bg-primary);
    border-radius: 16px;
    max-width: 600px;
    width: 90%;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    animation: modalSlideIn 0.3s ease;
}

@keyframes modalSlideIn {
    from { 
        opacity: 0; 
        transform: translateY(-30px) scale(0.95);
    }
    to { 
        opacity: 1; 
        transform: translateY(0) scale(1);
    }
}

.modal-header {
    padding: 24px;
    border-bottom: 2px solid var(--border-color);
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.modal-header h2 {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 700;
}

.modal-close {
    background: transparent;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: var(--text-secondary);
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    transition: all 0.2s;
}

.modal-close:hover {
    background: var(--btn-neutral);
    color: var(--text-primary);
}

.modal-body {
    padding: 24px;
}

.modal-footer {
    padding: 20px 24px;
    border-top: 2px solid var(--border-color);
    display: flex;
    gap: 12px;
    justify-content: flex-end;
}

/* Adaptation APPLE */
html.style-apple .modal-content {
    border-radius: 20px;
}

html.style-apple .modal-close {
    border-radius: 12px;
}

/* Adaptation SIDEBAR */
html.style-sidebar .modal-content {
    border-radius: 8px;
    border-left: 4px solid var(--upstay-cyan);
}
```

## 📝 Exemple HTML

```html
<div class="modal" id="myModal">
    <div class="modal-content">
        <div class="modal-header">
            <h2>Titre de la modale</h2>
            <button class="modal-close" onclick="closeModal()">×</button>
        </div>
        <div class="modal-body">
            <p>Contenu de la modale...</p>
        </div>
        <div class="modal-footer">
            <button class="btn-secondary" onclick="closeModal()">Annuler</button>
            <button class="btn-primary">Confirmer</button>
        </div>
    </div>
</div>
```

## ✅ Intégration

Styles ajoutés dans `css/main.css` après la section BADGES.
