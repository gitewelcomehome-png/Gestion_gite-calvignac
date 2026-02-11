/**
 * 🧹 NETTOYAGE DES STYLES INLINE
 * Retire les styles inline qui bloquent le système de thèmes
 */

(function() {
    'use strict';
    
    function cleanInlineStyles() {
        // console.log('🧹 Nettoyage des styles inline...');
        
        // Liste des propriétés à nettoyer
        const propertiesToClean = [
            'background',
            'background-color',
            'color',
            'border',
            'border-color'
        ];
        
        // Récupérer TOUS les éléments avec attribut style
        const elementsWithStyle = document.querySelectorAll('[style]');
        let cleanedCount = 0;
        
        elementsWithStyle.forEach(element => {
            // Ne pas toucher aux boutons de contrôle des thèmes
            if (element.classList.contains('ctrl-btn')) {
                return;
            }
            
            const style = element.getAttribute('style');
            if (!style) return;
            
            // Parser le style inline
            let newStyle = style;
            
            // Retirer les backgrounds blancs
            newStyle = newStyle.replace(/background:\s*(white|#fff|#ffffff|rgb\(255,\s*255,\s*255\))/gi, '');
            newStyle = newStyle.replace(/background-color:\s*(white|#fff|#ffffff|rgb\(255,\s*255,\s*255\))/gi, '');
            
            // Retirer les couleurs de texte noires/grises
            newStyle = newStyle.replace(/color:\s*(black|#000|#2D3436|#2c3e50|#666|rgb\(0,\s*0,\s*0\))/gi, '');
            
            // Retirer les bordures basiques
            newStyle = newStyle.replace(/border:\s*[12]px\s*solid\s*(#ccc|#ddd|#2D3436)/gi, '');
            
            // Nettoyer les ; ; multiples
            newStyle = newStyle.replace(/;\s*;/g, ';');
            newStyle = newStyle.trim();
            
            if (newStyle !== style) {
                if (newStyle === '' || newStyle === ';') {
                    element.removeAttribute('style');
                } else {
                    element.setAttribute('style', newStyle);
                }
                cleanedCount++;
            }
        });
        
        // console.log(`✅ ${cleanedCount} éléments nettoyés`);
    }
    
    // Exécuter au chargement
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', cleanInlineStyles);
    } else {
        cleanInlineStyles();
    }
    
    // Re-exécuter après chaque changement de thème
    window.addEventListener('theme-changed', cleanInlineStyles);
    
    // Export pour usage manuel si besoin
    window.cleanThemeStyles = cleanInlineStyles;
})();
