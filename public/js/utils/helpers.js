// Gestion Gîtes - Utility Helper Functions

/**
 * Display a toast notification
 * @param {string} message - Message to display
 * @param {string} type - Type of toast ('success' or 'error')
 */
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.style.background = type === 'error' ? 'var(--danger)' : 'var(--success)';
    document.getElementById('toastMessage').textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 4000);
}

/**
 * Format date string
 * @param {string} dateStr - Date string in YYYY-MM-DD format
 * @returns {string} Formatted date in French locale
 */
function formatDate(dateStr) {
    const date = parseLocalDate(dateStr);
    return date.toLocaleDateString('fr-FR');
}

/**
 * Get month and year from date string
 * @param {string} dateStr - Date string in YYYY-MM-DD format
 * @returns {string} Month and year in French locale
 */
function getMonthYear(dateStr) {
    const date = parseLocalDate(dateStr);
    return date.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long' });
}

/**
 * Check if gite name is Couzon
 * @param {string} giteName - Name of the gite
 * @returns {boolean}
 */
function isCouzon(giteName) {
    if (!giteName) return false;
    const normalized = giteName.toLowerCase().trim();
    return normalized === 'couzon' || normalized === 'couzon-au-mont-d\'or' || normalized.startsWith('couzon');
}

/**
 * Check if gite name is Trévoux
 * @param {string} giteName - Name of the gite
 * @returns {boolean}
 */
function isTrevoux(giteName) {
    if (!giteName) return false;
    const normalized = giteName.toLowerCase().trim();
    return normalized === 'trévoux' || normalized === 'trevoux';
}

/**
 * Get platform badge CSS class
 * @param {string} site - Platform name
 * @returns {string} CSS class for the badge
 */
function getPlatformBadgeClass(site) {
    if (site.toLowerCase().includes('airbnb')) return 'badge-airbnb';
    if (site.toLowerCase().includes('abritel')) return 'badge-abritel';
    return 'badge-gites';
}

/**
 * Create a date in Paris timezone
 * @param {...any} args - Date constructor arguments
 * @returns {Date}
 */
function createParisDate(...args) {
    const date = new Date(...args);
    return date;
}
