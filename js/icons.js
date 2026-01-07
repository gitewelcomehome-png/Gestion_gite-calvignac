// ================================================================
// BIBLIOTHÈQUE D'ICÔNES SVG MODERNES
// ================================================================
// Icônes vectorielles pour l'application de gestion de gîtes
// Palette: Moderne & Flat
// ================================================================

const ICONS_CONFIG = {
    strokeColor: '#2D3436',
    fillBlue: '#74b9ff',
    fillDarkBlue: '#0984e3',
    fillRed: '#ff7675',
    fillYellow: '#ffeaa7',
    fillGold: '#fdcb6e',
    fillGreen: '#55efc4',
    fillWhite: '#ffffff'
};

// ================================================================
// ICÔNES TYPES D'HÉBERGEMENT
// ================================================================

const GITE_ICONS = {
    'maison': `
        <svg viewBox="0 0 64 64" class="gite-icon">
            <rect x="14" y="28" width="36" height="28" class="fill-white"/>
            <path d="M8 28 L32 8 L56 28" class="fill-red"/>
            <rect x="42" y="10" width="6" height="10" class="fill-red"/>
            <rect x="26" y="40" width="12" height="16" class="fill-dark-blue"/>
            <rect x="18" y="34" width="6" height="6" class="fill-blue"/>
        </svg>
    `,
    
    'appartement': `
        <svg viewBox="0 0 64 64" class="gite-icon">
            <rect x="18" y="8" width="28" height="48" rx="2" class="fill-blue"/>
            <rect x="26" y="42" width="12" height="14" class="fill-dark-blue"/>
            <rect x="22" y="16" width="8" height="8" class="fill-white"/>
            <rect x="34" y="16" width="8" height="8" class="fill-white"/>
            <rect x="22" y="28" width="8" height="8" class="fill-white"/>
            <rect x="34" y="28" width="8" height="8" class="fill-white"/>
        </svg>
    `,
    
    'villa': `
        <svg viewBox="0 0 64 64" class="gite-icon">
            <rect x="8" y="20" width="32" height="36" class="fill-white"/>
            <rect x="32" y="12" width="24" height="24" class="fill-yellow"/>
            <rect x="14" y="32" width="20" height="16" class="fill-blue" fill-opacity="0.5"/>
            <line x1="44" y1="36" x2="44" y2="56" />
        </svg>
    `,
    
    'chalet': `
        <svg viewBox="0 0 64 64" class="gite-icon">
            <path d="M32 6 L6 56 H58 Z" class="fill-gold"/>
            <path d="M32 6 L10 48" stroke="#ff7675" stroke-width="4"/>
            <path d="M32 6 L54 48" stroke="#ff7675" stroke-width="4"/>
            <circle cx="32" cy="26" r="6" class="fill-white"/>
            <path d="M26 56 v-14 h12 v14" class="fill-dark-blue"/>
        </svg>
    `,
    
    'manoir': `
        <svg viewBox="0 0 64 64" class="gite-icon">
            <rect x="8" y="22" width="12" height="34" class="fill-white"/>
            <rect x="44" y="22" width="12" height="34" class="fill-white"/>
            <rect x="20" y="28" width="24" height="28" class="fill-white"/>
            <path d="M8 22 L14 10 L20 22" class="fill-dark-blue"/>
            <path d="M44 22 L50 10 L56 22" class="fill-dark-blue"/>
            <rect x="20" y="22" width="24" height="6" class="fill-dark-blue"/>
            <path d="M28 56 v-10 a4 4 0 0 1 8 0 v10" class="fill-gold"/>
        </svg>
    `,
    
    'tiny-house': `
        <svg viewBox="0 0 64 64" class="gite-icon">
            <circle cx="20" cy="52" r="5" class="fill-dark-blue"/>
            <circle cx="44" cy="52" r="5" class="fill-dark-blue"/>
            <rect x="10" y="24" width="44" height="24" class="fill-yellow"/>
            <path d="M8 24 L6 16 L58 16 L56 24 Z" class="fill-red"/>
            <rect x="38" y="30" width="10" height="18" class="fill-white"/>
            <rect x="16" y="32" width="12" height="10" class="fill-blue"/>
        </svg>
    `,
    
    'grange': `
        <svg viewBox="0 0 64 64" class="gite-icon">
            <rect x="6" y="24" width="52" height="32" class="fill-red"/>
            <path d="M4 24 L32 10 L60 24" class="fill-dark-blue"/>
            <rect x="24" y="32" width="16" height="24" class="fill-yellow"/>
            <line x1="32" y1="32" x2="32" y2="56"/> 
            <circle cx="32" cy="20" r="4" class="fill-white"/>
        </svg>
    `,
    
    'dome': `
        <svg viewBox="0 0 64 64" class="gite-icon">
            <rect x="10" y="48" width="44" height="8" rx="2" class="fill-gold"/>
            <path d="M14 50 A 20 20 0 0 1 50 50" stroke-width="3" class="fill-blue" fill-opacity="0.4"/>
            <line x1="32" y1="18" x2="32" y2="50" stroke-width="2"/>
        </svg>
    `
};

// ================================================================
// ICÔNES SERVICES & GESTION
// ================================================================

const SERVICE_ICONS = {
    'dashboard': `
        <svg viewBox="0 0 64 64" class="service-icon">
            <rect x="4" y="8" width="56" height="48" rx="4" class="fill-white"/>
            <rect x="12" y="30" width="10" height="20" class="fill-dark-blue"/>
            <rect x="27" y="38" width="10" height="12" class="fill-red"/>
            <rect x="42" y="20" width="10" height="30" class="fill-green"/>
        </svg>
    `,
    
    'reservations': `
        <svg viewBox="0 0 64 64" class="service-icon">
            <rect x="8" y="10" width="48" height="46" rx="4" class="fill-white"/>
            <path d="M8 10h48v12H8z" class="fill-dark-blue" style="stroke:none"/>
            <path d="M8 22h48" />
            <line x1="18" y1="6" x2="18" y2="14"/>
            <line x1="46" y1="6" x2="46" y2="14"/>
            <polyline points="22 40 30 48 44 32" stroke="#55efc4" stroke-width="4"/>
        </svg>
    `,
    
    'statistiques': `
        <svg viewBox="0 0 64 64" class="service-icon">
            <rect x="6" y="8" width="52" height="48" rx="2" class="fill-white"/>
            <line x1="6" y1="20" x2="58" y2="20" stroke-opacity="0.2"/>
            <line x1="6" y1="32" x2="58" y2="32" stroke-opacity="0.2"/>
            <rect x="14" y="38" width="8" height="12" class="fill-yellow"/>
            <rect x="28" y="30" width="8" height="20" class="fill-red"/>
            <rect x="42" y="20" width="8" height="30" class="fill-green"/>
        </svg>
    `,
    
    'fiscalite': `
        <svg viewBox="0 0 64 64" class="service-icon">
            <ellipse cx="20" cy="48" rx="12" ry="5" class="fill-gold"/>
            <path d="M8 48v-6c0 3 5 5 12 5s12-2 12-5v6c0 3-5 5-12 5s-12-2-12-5z" class="fill-gold"/>
            <path d="M8 42v-6c0 3 5 5 12 5s12-2 12-5v6c0 3-5 5-12 5s-12-2-12-5z" class="fill-gold"/>
            <circle cx="44" cy="40" r="14" class="fill-yellow"/>
            <text x="44" y="46" font-size="20" text-anchor="middle" fill="#2D3436" stroke="none" font-weight="bold">$</text>
            <polyline points="44 26 44 10 52 18" />
            <polyline points="44 10 36 18" />
        </svg>
    `,
    
    'menage': `
        <svg viewBox="0 0 64 64" class="service-icon">
            <path d="M40 8 L24 40" stroke-width="3"/>
            <path d="M14 56l10-20 14 6-10 20z" class="fill-blue"/> 
            <path d="M14 56q5 6 14 0" fill="none"/>
            <circle cx="50" cy="18" r="4" class="fill-white"/>
            <circle cx="44" cy="28" r="3" class="fill-white"/>
            <circle cx="54" cy="30" r="5" class="fill-white"/>
        </svg>
    `,
    
    'checklists': `
        <svg viewBox="0 0 64 64" class="service-icon">
            <rect x="12" y="10" width="34" height="46" rx="3" class="fill-white"/>
            <rect x="22" y="6" width="14" height="8" rx="2" class="fill-white"/> 
            <line x1="20" y1="24" x2="38" y2="24"/>
            <line x1="20" y1="34" x2="38" y2="34"/>
            <line x1="20" y1="44" x2="38" y2="44"/>
            <path d="M54 20l-6 30-4 4-2-6 30-30z" class="fill-yellow"/>
            <path d="M46 54l4-4"/>
        </svg>
    `,
    
    'linge': `
        <svg viewBox="0 0 64 64" class="service-icon">
            <path d="M12 46h40c2 4-2 8-6 8H18c-4 0-8-4-6-8z" class="fill-white"/>
            <path d="M12 36h40c2 4-2 8-6 8H18c-4 0-8-4-6-8z" class="fill-blue"/>
            <path d="M12 26h40c2 4-2 8-6 8H18c-4 0-8-4-6-8z" class="fill-white"/>
            <path d="M12 16h40c2 4-2 8-6 8H18c-4 0-8-4-6-8z" class="fill-blue"/>
        </svg>
    `,
    
    'acces': `
        <svg viewBox="0 0 64 64" class="service-icon">
            <path d="M40 10a12 12 0 1 1-12 12 12 12 0 0 1 12-12z" class="fill-yellow"/>
            <circle cx="40" cy="22" r="3" fill="white" stroke="none"/>
            <path d="M30 30L12 48l4 4 4-4 4 4 4-4 6-6" fill="none" stroke-width="5" stroke="#ffeaa7"/>
            <path d="M30 30L12 48l4 4 4-4 4 4 4-4 6-6" fill="none"/>
        </svg>
    `
};

// ================================================================
// ICÔNES INFOS VOYAGEURS
// ================================================================

const INFO_ICONS = {
    'infos': `
        <svg viewBox="0 0 64 64" class="info-icon">
            <path d="M42 12h-8l-4 16h-10l-4 4 14 2 2 14 4-4 2-14 14-2 4-4h-10z" class="fill-red"/>
            <line x1="32" y1="44" x2="22" y2="56" stroke-width="2"/>
        </svg>
    `,
    
    'guide': `
        <svg viewBox="0 0 64 64" class="info-icon">
            <path d="M32 48V16c0-6-6-8-12-8-8 0-14 4-14 12v32c0-6 8-8 14-8 6 0 12 4 12 4z" class="fill-white"/>
            <path d="M32 48V16c0-6 6-8 12-8 8 0 14 4 14 12v32c0-6-8-8-14-8-6 0-12 4-12 4z" class="fill-blue"/>
        </svg>
    `,
    
    'faq': `
        <svg viewBox="0 0 64 64" class="info-icon">
            <path d="M22 22c0-8 6-12 12-12s12 4 12 12c0 8-10 10-10 18v2" stroke="#ff7675" stroke-width="6" fill="none"/>
            <circle cx="36" cy="54" r="3" fill="#ff7675" stroke="none"/>
        </svg>
    `,
    
    'horaires': `
        <svg viewBox="0 0 64 64" class="info-icon">
            <circle cx="32" cy="36" r="18" class="fill-white"/>
            <path d="M32 36l4-8" />
            <path d="M32 36l6 4" />
            <path d="M18 16l4 4" stroke-width="4" stroke="#ff7675"/>
            <path d="M46 16l-4 4" stroke-width="4" stroke="#ff7675"/>
            <path d="M14 12a4 4 0 0 1 6 2" class="fill-red"/>
            <path d="M50 12a4 4 0 0 0-6 2" class="fill-red"/>
        </svg>
    `,
    
    'parking': `
        <svg viewBox="0 0 64 64" class="info-icon">
            <path d="M6 36h52v8a4 4 0 0 1-4 4H10a4 4 0 0 1-4-4v-8z" class="fill-dark-blue"/>
            <path d="M10 36l6-16h32l6 16" class="fill-blue"/>
            <circle cx="16" cy="48" r="5" class="fill-white"/>
            <circle cx="48" cy="48" r="5" class="fill-white"/>
            <line x1="32" y1="20" x2="32" y2="36"/>
        </svg>
    `,
    
    'acces-logement': `
        <svg viewBox="0 0 64 64" class="info-icon">
            <rect x="8" y="24" width="16" height="24" rx="2" class="fill-yellow"/>
            <line x1="16" y1="24" x2="16" y2="16"/>
            <path d="M12 16h8" />
            <circle cx="12" cy="50" r="2"/>
            <circle cx="20" cy="50" r="2"/>
            <circle cx="44" cy="14" r="5" class="fill-white"/>
            <path d="M44 20v14l-6 16" />
            <path d="M44 34l8 16" />
            <path d="M44 24l-8 6" />
            <path d="M44 24l8 6" />
        </svg>
    `
};

// ================================================================
// FONCTIONS HELPER
// ================================================================

/**
 * Obtenir un SVG d'icône par son nom
 * @param {string} category - Catégorie: 'gite', 'service', 'info'
 * @param {string} name - Nom de l'icône
 * @returns {string} SVG string
 */
function getIcon(category, name) {
    const icons = {
        'gite': GITE_ICONS,
        'service': SERVICE_ICONS,
        'info': INFO_ICONS
    };
    
    return icons[category]?.[name] || '';
}

/**
 * Obtenir tous les noms d'icônes d'une catégorie
 * @param {string} category - Catégorie: 'gite', 'service', 'info'
 * @returns {Array<string>} Liste des noms d'icônes
 */
function getIconNames(category) {
    const icons = {
        'gite': GITE_ICONS,
        'service': SERVICE_ICONS,
        'info': INFO_ICONS
    };
    
    return Object.keys(icons[category] || {});
}

/**
 * Créer un élément DOM avec une icône
 * @param {string} category - Catégorie
 * @param {string} name - Nom de l'icône
 * @param {string} className - Classe CSS additionnelle
 * @returns {HTMLElement} Element div contenant le SVG
 */
function createIconElement(category, name, className = '') {
    const div = document.createElement('div');
    div.className = `icon-container ${className}`.trim();
    div.innerHTML = getIcon(category, name);
    div.dataset.iconCategory = category;
    div.dataset.iconName = name;
    return div;
}

// ================================================================
// EXPORT
// ================================================================

if (typeof window !== 'undefined') {
    window.GITE_ICONS = GITE_ICONS;
    window.SERVICE_ICONS = SERVICE_ICONS;
    window.INFO_ICONS = INFO_ICONS;
    window.getIcon = getIcon;
    window.getIconNames = getIconNames;
    window.createIconElement = createIconElement;
}
