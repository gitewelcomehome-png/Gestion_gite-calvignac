/**
 * CALOU Icons Helper
 * Système d'injection et d'utilisation des icônes SVG
 */

(function() {
    'use strict';

    // Configuration
    const ICONS_CONFIG = {
        spritePath: 'assets/icons-modern/sprite-lucide.svg',
        cacheKey: 'calou-icons-sprite',
        cacheExpiry: 24 * 60 * 60 * 1000, // 24 heures
    };

    /**
     * Injecte le sprite d'icônes dans le DOM
     */
    async function injectIconsSprite() {
        // Vérifier si déjà injecté
        if (document.getElementById('calou-icons-sprite')) {
            return;
        }

        try {
            // Tenter de récupérer depuis le cache
            const cached = localStorage.getItem(ICONS_CONFIG.cacheKey);
            const cacheTimestamp = localStorage.getItem(ICONS_CONFIG.cacheKey + '-timestamp');
            
            let svgContent;
            
            if (cached && cacheTimestamp && (Date.now() - parseInt(cacheTimestamp)) < ICONS_CONFIG.cacheExpiry) {
                svgContent = cached;
                // console.log('🎨 [CALOU Icons] Chargé depuis le cache');
            } else {
                // Fetch depuis le serveur
                const response = await fetch(ICONS_CONFIG.spritePath);
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }
                svgContent = await response.text();
                
                // Mettre en cache
                localStorage.setItem(ICONS_CONFIG.cacheKey, svgContent);
                localStorage.setItem(ICONS_CONFIG.cacheKey + '-timestamp', Date.now().toString());
                // console.log('🎨 [CALOU Icons] Chargé et mis en cache');
            }

            // Injecter dans le DOM
            const container = document.createElement('div');
            container.id = 'calou-icons-sprite';
            container.style.display = 'none';
            container.innerHTML = svgContent;
            document.body.insertBefore(container, document.body.firstChild);

        } catch (error) {
            console.error('❌ [CALOU Icons] Erreur de chargement:', error);
        }
    }

    /**
     * Crée une icône SVG
     * @param {string} iconName - Nom de l'icône (ex: 'calendar', 'home')
     * @param {Object} options - Options de style
     * @returns {string} HTML de l'icône
     */
    function createIcon(iconName, options = {}) {
        const {
            size = 'md',
            color = '',
            className = '',
            style = '',
        } = options;

        const classes = [
            'calou-icon',
            `calou-icon-${size}`,
            color ? `calou-icon-${color}` : '',
            className
        ].filter(Boolean).join(' ');

        return `<svg class="${classes}" viewBox="0 0 24 24" style="${style}">
            <use href="#icon-${iconName}" />
        </svg>`;
    }

    /**
     * Remplace les placeholders d'icônes dans le DOM
     * Format: <i data-calou-icon="home" data-size="lg" data-color="primary"></i>
     */
    function replaceIconPlaceholders() {
        const placeholders = document.querySelectorAll('[data-calou-icon]');
        
        placeholders.forEach(placeholder => {
            const iconName = placeholder.dataset.calouIcon;
            const size = placeholder.dataset.size || 'md';
            const color = placeholder.dataset.color || '';
            const className = placeholder.className;
            
            const iconHtml = createIcon(iconName, { size, color, className });
            placeholder.outerHTML = iconHtml;
        });

        if (placeholders.length > 0) {
            // console.log(`🎨 [CALOU Icons] ${placeholders.length} icônes remplacées`);
        }
    }

    /**
     * Liste toutes les icônes disponibles
     * @returns {Array} Liste des noms d'icônes
     */
    function getAvailableIcons() {
        const sprite = document.getElementById('calou-icons-sprite');
        if (!sprite) return [];

        const symbols = sprite.querySelectorAll('symbol');
        return Array.from(symbols).map(symbol => symbol.id.replace('icon-', ''));
    }

    /**
     * Initialisation automatique
     */
    async function init() {
        await injectIconsSprite();
        replaceIconPlaceholders();
        
        // Observer les changements DOM pour remplacer les nouveaux placeholders
        const observer = new MutationObserver((mutations) => {
            let hasNewPlaceholders = false;
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === 1 && (
                        node.hasAttribute?.('data-calou-icon') ||
                        node.querySelector?.('[data-calou-icon]')
                    )) {
                        hasNewPlaceholders = true;
                    }
                });
            });
            if (hasNewPlaceholders) {
                replaceIconPlaceholders();
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    // Exposer l'API globale
    window.CALOUIcons = {
        inject: injectIconsSprite,
        create: createIcon,
        replace: replaceIconPlaceholders,
        list: getAvailableIcons,
        clearCache: () => {
            localStorage.removeItem(ICONS_CONFIG.cacheKey);
            localStorage.removeItem(ICONS_CONFIG.cacheKey + '-timestamp');
            // console.log('🗑️ [CALOU Icons] Cache vidé');
        }
    };

    // Auto-init si DOM prêt
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
