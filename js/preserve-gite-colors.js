/**
 * Applique les liserés de couleur de gîte aux éléments internes
 * Version: 3.0 - Liseré complet + boutons
 */

(function() {
    'use strict';
    
    /**
     * Applique le border-left aux colonnes, boutons et cartes dans les colonnes de gîte
     */
    function applyGiteBorders() {
        // Trouver toutes les colonnes de gîte (qui ont data-gite-color)
        const giteColumns = document.querySelectorAll('[data-gite-color]');
        
        giteColumns.forEach(column => {
            const giteColor = column.getAttribute('data-gite-color');
            
            if (!giteColor) return;
            
            // Appliquer le liseré à la COLONNE entière SEULEMENT
            column.style.borderLeft = `4px solid ${giteColor}`;
            column.style.borderRadius = '12px';
            
            // Appliquer aux BOUTONS dans cette colonne
            const buttons = column.querySelectorAll('button');
            buttons.forEach(btn => {
                // Vérifier si le bouton a déjà un border inline (éditer, valider, supprimer)
                const hasInlineBorder = btn.style.border && btn.style.border.includes('1px solid');
                
                if (!hasInlineBorder) {
                    // Si pas de border, ajouter le liseré
                    btn.style.borderLeft = `3px solid ${giteColor}`;
                } else {
                    // Si déjà un border, remplacer la couleur
                    const currentBorder = btn.style.border;
                    btn.style.border = currentBorder.replace(/#[0-9A-Fa-f]{6}/, giteColor);
                }
            });
            
            // Appliquer aux cartes de réservation
            const reservationCards = column.querySelectorAll('.week-reservation');
            reservationCards.forEach(card => {
                card.style.borderLeft = `4px solid ${giteColor}`;
            });
        });
    }
    
    // Exécuter au chargement
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', applyGiteBorders);
    } else {
        applyGiteBorders();
    }
    
    // Observer les changements du DOM (pour le contenu dynamique)
    const observer = new MutationObserver((mutations) => {
        let shouldReprocess = false;
        
        mutations.forEach(mutation => {
            if (mutation.addedNodes.length > 0) {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === 1 && (
                        node.hasAttribute('data-gite-color') || 
                        node.querySelector('[data-gite-color]') ||
                        node.classList?.contains('week-reservation')
                    )) {
                        shouldReprocess = true;
                    }
                });
            }
        });
        
        if (shouldReprocess) {
            setTimeout(applyGiteBorders, 50);
        }
    });
    
    // Observer le body pour les changements
    if (document.body) {
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    } else {
        document.addEventListener('DOMContentLoaded', () => {
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        });
    }
    
})();
