// ==========================================
// 🎨 GESTION GLOBALE DES COULEURS THÈME
// ==========================================

/**
 * Récupère les couleurs du thème actif depuis les variables CSS
 * @returns {Object} Objet contenant toutes les couleurs du thème
 */
function getThemeColors() {
    const root = document.documentElement;
    const computed = getComputedStyle(root);
    
    // Lire les valeurs depuis les variables CSS
    const bgPrimary = computed.getPropertyValue('--bg-primary').trim();
    const bgSecondary = computed.getPropertyValue('--bg-secondary').trim();
    const textPrimary = computed.getPropertyValue('--text-primary').trim();
    const borderColor = computed.getPropertyValue('--border-color').trim();
    
    return {
        bgPrimary: bgPrimary || '#050506',
        bgSecondary: bgSecondary || '#111113',
        textPrimary: textPrimary || '#ffffff',
        borderColor: borderColor || 'rgba(255,255,255,0.1)'
    };
}

// Initialiser APRÈS que le DOM soit prêt
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.THEME_COLORS = getThemeColors();
    });
} else {
    window.THEME_COLORS = getThemeColors();
}

// Recharger les couleurs quand le thème change
window.addEventListener('theme-changed', () => {
    window.THEME_COLORS = getThemeColors();
});

