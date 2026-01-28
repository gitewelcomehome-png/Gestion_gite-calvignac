/**
 * Icônes SVG pour les plateformes de réservation
 * Design par l'utilisateur - 2026
 */

window.PlatformIcons = {
    /**
     * Airbnb - Coeur rouge
     */
    airbnb: `
        <svg viewBox="0 0 64 64" width="28" height="28">
            <style>
                .fill-airbnb-icon { fill: #FF5A5F; }
            </style>
            <path d="M32 60 C 16 50, 4 34, 4 22 A 16 16 0 0 1 32 18 A 16 16 0 0 1 60 22 C 60 34, 48 50, 32 60 Z" 
                  class="fill-airbnb-icon" stroke="#2D3436" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
            <circle cx="32" cy="24" r="6" fill="white" stroke="#2D3436" stroke-width="2.5"/>
        </svg>
    `,
    
    /**
     * Booking.com - Lit bleu
     */
    booking: `
        <svg viewBox="0 0 64 64" width="28" height="28">
            <style>
                .fill-booking-icon { fill: #003580; }
            </style>
            <rect x="6" y="28" width="52" height="24" rx="4" class="fill-booking-icon" 
                  stroke="#2D3436" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
            <rect x="10" y="22" width="18" height="12" rx="3" fill="white" stroke="#2D3436" stroke-width="2.5"/>
            <line x1="10" y1="52" x2="10" y2="60" stroke="#2D3436" stroke-width="4" stroke-linecap="round"/>
            <line x1="54" y1="52" x2="54" y2="60" stroke="#2D3436" stroke-width="4" stroke-linecap="round"/>
        </svg>
    `,
    
    /**
     * Vrbo / Site web - Maison avec arc bleu
     */
    vrbo: `
        <svg viewBox="0 0 64 64" width="28" height="28">
            <style>
                .fill-vrbo-icon { fill: #0984e3; }
            </style>
            <path d="M12 30 L32 12 L52 30 v26 h-40 Z" fill="white" 
                  stroke="#2D3436" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M32 12 C 42 12, 54 22, 60 36" stroke="#0984e3" stroke-width="5" fill="none" 
                  stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M12 30 L32 12 L52 30" fill="none" stroke="#2D3436" stroke-width="2.5" 
                  stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
    `,
    
    /**
     * TripAdvisor - Hibou vert
     */
    tripadvisor: `
        <svg viewBox="0 0 64 64" width="28" height="28">
            <style>
                .fill-trip-icon { fill: #00AA6C; }
                .fill-yellow-icon { fill: #ffeaa7; }
            </style>
            <circle cx="20" cy="30" r="14" class="fill-trip-icon" stroke="#2D3436" stroke-width="2.5"/>
            <circle cx="44" cy="30" r="14" class="fill-trip-icon" stroke="#2D3436" stroke-width="2.5"/>
            <circle cx="20" cy="30" r="5" fill="#2D3436" stroke="none"/>
            <circle cx="44" cy="30" r="5" fill="#2D3436" stroke="none"/>
            <path d="M32 44 L26 54 H38 Z" class="fill-yellow-icon" stroke="#2D3436" stroke-width="2.5" 
                  stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M20 16 Q 32 24 44 16" fill="none" stroke="#2D3436" stroke-width="3" 
                  stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
    `,
    
    /**
     * Gîtes de France - Maison avec toit rouge/vert et épi de blé
     */
    'gites-de-france': `
        <svg viewBox="0 0 64 64" width="28" height="28">
            <style>
                .fill-gdf-r-icon { fill: #E60000; }
                .fill-gdf-g-icon { fill: #009640; }
                .fill-gold-icon { fill: #fdcb6e; }
            </style>
            <rect x="14" y="32" width="36" height="26" fill="white" 
                  stroke="#2D3436" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M8 32 L32 10 V32 H8 Z" class="fill-gdf-r-icon" 
                  stroke="#2D3436" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M56 32 L32 10 V32 H56 Z" class="fill-gdf-g-icon" 
                  stroke="#2D3436" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M32 34 V52" stroke="#fdcb6e" stroke-width="4" stroke-linecap="round"/>
            <path d="M32 40 L24 46" stroke="#fdcb6e" stroke-width="3" stroke-linecap="round"/>
            <path d="M32 40 L40 46" stroke="#fdcb6e" stroke-width="3" stroke-linecap="round"/>
        </svg>
    `,
    
    /**
     * Abritel / HomeAway - Globe internet
     */
    abritel: `
        <svg viewBox="0 0 64 64" width="28" height="28">
            <style>
                .fill-blue-icon { fill: #74b9ff; }
            </style>
            <circle cx="32" cy="32" r="26" fill="white" 
                    stroke="#2D3436" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M4 32 H60" stroke="#2D3436" stroke-width="2" stroke-linecap="round"/>
            <ellipse cx="32" cy="32" rx="10" ry="26" fill="none" 
                     stroke="#2D3436" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M38 12 L50 24 L38 36" stroke="#74b9ff" stroke-width="4" fill="none" 
                  stroke-linecap="round" stroke-linejoin="round"/>
            <line x1="20" y1="24" x2="50" y2="24" stroke="#74b9ff" stroke-width="4" stroke-linecap="round"/>
        </svg>
    `,
    
    /**
     * Icône par défaut - Autre plateforme (globe simple)
     */
    default: `
        <svg viewBox="0 0 64 64" width="28" height="28">
            <circle cx="32" cy="32" r="26" fill="white" 
                    stroke="#2D3436" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M4 32 H60" stroke="#2D3436" stroke-width="2" stroke-linecap="round"/>
            <ellipse cx="32" cy="32" rx="10" ry="26" fill="none" 
                     stroke="#2D3436" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
    `,
    
    /**
     * HomeAway - Utilise la même icône qu'Abritel (globe)
     */
    homeaway: `
        <svg viewBox="0 0 64 64" width="28" height="28">
            <style>
                .fill-blue-icon { fill: #74b9ff; }
            </style>
            <circle cx="32" cy="32" r="26" fill="white" 
                    stroke="#2D3436" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M4 32 H60" stroke="#2D3436" stroke-width="2" stroke-linecap="round"/>
            <ellipse cx="32" cy="32" rx="10" ry="26" fill="none" 
                     stroke="#2D3436" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M38 12 L50 24 L38 36" stroke="#74b9ff" stroke-width="4" fill="none" 
                  stroke-linecap="round" stroke-linejoin="round"/>
            <line x1="20" y1="24" x2="50" y2="24" stroke="#74b9ff" stroke-width="4" stroke-linecap="round"/>
        </svg>
    `,
    
    /**
     * Récupérer l'icône d'une plateforme
     */
    get(platform) {
        return this[platform] || this.default;
    }
};
