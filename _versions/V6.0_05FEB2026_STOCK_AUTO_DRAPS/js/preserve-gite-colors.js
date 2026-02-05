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
        
        // Vérifier le mode actif
        const isSidebarMode = document.documentElement.classList.contains('style-sidebar');
        
        giteColumns.forEach(column => {
            const giteColor = column.getAttribute('data-gite-color');
            
            if (!giteColor) return;
            
            // NE PAS appliquer les styles inline en mode Sidebar (CSS gère tout)
            if (!isSidebarMode) {
                // Appliquer le liseré à la COLONNE entière SEULEMENT en mode Apple
                column.style.borderLeft = `4px solid ${giteColor}`;
                column.style.borderRadius = '12px';
            } else {
                // En mode Sidebar, supprimer les styles inline pour laisser le CSS gérer
                column.style.borderLeft = '';
                column.style.borderRadius = '';
            }
            
            // Appliquer aux BOUTONS dans cette colonne
            const buttons = column.querySelectorAll('button');
            buttons.forEach(btn => {
                // Vérifier si le bouton a déjà un border inline (éditer, valider, supprimer)
                const hasInlineBorder = btn.style.border && btn.style.border.includes('1px solid');
                
                if (!hasInlineBorder && !isSidebarMode) {
                    // Si pas de border et pas en mode Sidebar, ajouter le liseré
                    btn.style.borderLeft = `3px solid ${giteColor}`;
                } else if (isSidebarMode) {
                    // En mode Sidebar, supprimer le borderLeft inline
                    btn.style.borderLeft = '';
                } else {
                    // Si déjà un border, remplacer la couleur
                    const currentBorder = btn.style.border;
                    btn.style.border = currentBorder.replace(/#[0-9A-Fa-f]{6}/, giteColor);
                }
            });
            
            // Appliquer aux cartes de réservation (sauf en mode Sidebar)
            if (!isSidebarMode) {
                const reservationCards = column.querySelectorAll('.week-reservation');
                reservationCards.forEach(card => {
                    card.style.borderLeft = `4px solid ${giteColor}`;
                });
            }
        });
    }
    
    // Exécuter au chargement
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', applyGiteBorders);
    } else {
        applyGiteBorders();
    }
    
    // Réappliquer quand le style change (Sidebar <-> Apple)
    const styleObserver = new MutationObserver((mutations) => {
        mutations.forEach(mutation => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                // Vérifier si le changement concerne style-sidebar ou style-apple
                const classList = document.documentElement.classList;
                if (classList.contains('style-sidebar') || classList.contains('style-apple')) {
                    applyGiteBorders();
                }
            }
        });
    });
    
    styleObserver.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['class']
    });
    
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
