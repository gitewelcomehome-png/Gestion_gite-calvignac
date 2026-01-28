/**
 * 🏠 PROPERTY ICONS - Bibliothèque d'icônes SVG pour types de propriétés
 */

window.PropertyIcons = {
    /**
     * Obtenir l'icône SVG pour un type de propriété
     */
    get(type) {
        const icons = {
            'house-simple': `<svg width="40" height="40" viewBox="0 0 48 48" fill="none" stroke="white" stroke-width="2.5">
                <rect x="8" y="20" width="32" height="20" rx="2"/>
                <path d="M8 24 L24 12 L40 24"/>
                <circle cx="24" cy="30" r="2" fill="white"/>
            </svg>`,
            
            'apartment': `<svg width="40" height="40" viewBox="0 0 48 48" fill="none" stroke="white" stroke-width="2.5">
                <rect x="10" y="8" width="28" height="34" rx="2"/>
                <rect x="16" y="14" width="6" height="6"/>
                <rect x="26" y="14" width="6" height="6"/>
                <rect x="16" y="24" width="6" height="6"/>
                <rect x="26" y="24" width="6" height="6"/>
                <rect x="20" y="34" width="8" height="8"/>
            </svg>`,
            
            'studio': `<svg width="40" height="40" viewBox="0 0 48 48" fill="none" stroke="white" stroke-width="2.5">
                <rect x="12" y="16" width="24" height="20" rx="2"/>
                <path d="M12 22 L24 12 L36 22"/>
                <rect x="20" y="28" width="8" height="8"/>
            </svg>`,
            
            'chalet': `<svg width="40" height="40" viewBox="0 0 48 48" fill="none" stroke="white" stroke-width="2.5">
                <path d="M8 28 L24 12 L40 28"/>
                <rect x="10" y="26" width="28" height="16"/>
                <rect x="20" y="32" width="8" height="10"/>
                <path d="M6 28 L24 8 L42 28" stroke-width="2"/>
            </svg>`,
            
            'castle': `<svg width="40" height="40" viewBox="0 0 48 48" fill="none" stroke="white" stroke-width="2.5">
                <rect x="8" y="20" width="32" height="20"/>
                <rect x="8" y="16" width="6" height="4"/>
                <rect x="21" y="16" width="6" height="4"/>
                <rect x="34" y="16" width="6" height="4"/>
                <rect x="20" y="30" width="8" height="10"/>
            </svg>`,
            
            'camper': `<svg width="40" height="40" viewBox="0 0 48 48" fill="none" stroke="white" stroke-width="2.5">
                <rect x="8" y="16" width="32" height="14" rx="2"/>
                <circle cx="16" cy="32" r="3"/>
                <circle cx="32" cy="32" r="3"/>
                <rect x="12" y="20" width="10" height="6"/>
                <rect x="26" y="20" width="10" height="6"/>
            </svg>`,
            
            'church': `<svg width="40" height="40" viewBox="0 0 48 48" fill="none" stroke="white" stroke-width="2.5">
                <path d="M24 8 L24 16"/>
                <path d="M20 12 L28 12"/>
                <path d="M12 24 L24 16 L36 24"/>
                <rect x="14" y="24" width="20" height="16"/>
                <rect x="20" y="32" width="8" height="8"/>
            </svg>`,
            
            'tent': `<svg width="40" height="40" viewBox="0 0 48 48" fill="none" stroke="white" stroke-width="2.5">
                <path d="M8 38 L24 12 L40 38 L8 38"/>
                <path d="M24 12 L24 38"/>
            </svg>`
        };
        
        return icons[type] || icons['house-simple'];
    }
};

// PropertyIcons chargé
