// ==========================================
// FONCTIONS UTILITAIRES PARTAGÉES
// ==========================================

// ==========================================
// GESTION DES TOASTS/NOTIFICATIONS
// ==========================================

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    if (!toast) {
        console.warn('Toast element not found');
        return;
    }
    toast.style.background = type === 'error' ? 'var(--danger)' : 'var(--success)';
    document.getElementById('toastMessage').textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 4000);
}

// ==========================================
// GESTION DES DATES (TIMEZONE FRANÇAIS)
// ==========================================

// Convertir une Date JavaScript en format YYYY-MM-DD
function dateToLocalString(date) {
    if (!date) return null;
    if (!(date instanceof Date)) {
        date = new Date(date);
    }
    if (isNaN(date.getTime())) return null;
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return year + '-' + month + '-' + day;
}

// Parser une date au format YYYY-MM-DD en heure locale
function parseLocalDate(dateStr) {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
}

// Calculer le nombre de nuits
function calculateNights(debut, fin) {
    const d1 = parseLocalDate(debut);
    const d2 = parseLocalDate(fin);
    return Math.ceil((d2 - d1) / (1000 * 60 * 60 * 24));
}

// Formater une date en français
function formatDate(dateStr) {
    const date = parseLocalDate(dateStr);
    return date.toLocaleDateString('fr-FR');
}

// Format court de date
function formatDateShort(date) {
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
}

// Obtenir le mois et l'année
function getMonthYear(dateStr) {
    const date = parseLocalDate(dateStr);
    return date.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long' });
}

// ==========================================
// HELPER POUR LES NOMS DE GÎTES
// ==========================================

function isCouzon(giteName) {
    if (!giteName) return false;
    const normalized = giteName.toLowerCase().trim();
    return normalized === 'couzon' || normalized === 'couzon-au-mont-d\'or' || normalized.startsWith('couzon');
}

function isTrevoux(giteName) {
    if (!giteName) return false;
    const normalized = giteName.toLowerCase().trim();
    return normalized === 'trévoux' || normalized === 'trevoux';
}

// ==========================================
// GESTION DU CACHE
// ==========================================

function invalidateCache(type) {
    if (type === 'reservations') {
        window.CACHE.reservations = null;
        window.CACHE.reservationsTimestamp = 0;
    } else if (type === 'charges') {
        window.CACHE.charges = null;
        window.CACHE.chargesTimestamp = 0;
    } else if (type === 'historical') {
        window.CACHE.historicalData = null;
        window.CACHE.historicalTimestamp = 0;
    } else if (type === 'all') {
        window.CACHE.reservations = null;
        window.CACHE.reservationsTimestamp = 0;
        window.CACHE.charges = null;
        window.CACHE.chargesTimestamp = 0;
        window.CACHE.historicalData = null;
        window.CACHE.historicalTimestamp = 0;
    }
}

// ==========================================
// HELPER BADGES PLATEFORMES
// ==========================================

function getPlatformBadgeClass(site) {
    if (site && site.toLowerCase().includes('airbnb')) return 'badge-airbnb';
    if (site && site.toLowerCase().includes('abritel')) return 'badge-abritel';
    if (site && (site.toLowerCase().includes('gîtes') || site.toLowerCase().includes('gites'))) return 'badge-gites';
    return 'badge-autre';
}

function getPlatformLogo(platform) {
    const logos = {
        'Airbnb': '🏠',
        'Abritel': '🏡', 
        'Gîtes de France': '🇫🇷',
        'Autre': '📝'
    };
    return logos[platform] || '📝';
}

// ==========================================
// GESTION SEMAINES ISO
// ==========================================

function getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return weekNo;
}

function getWeekDates(year, weekNum) {
    const simple = new Date(year, 0, 1 + (weekNum - 1) * 7);
    const dow = simple.getDay();
    const ISOweekStart = simple;
    if (dow <= 4) ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
    else ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
    
    const start = new Date(ISOweekStart);
    const end = new Date(ISOweekStart);
    end.setDate(end.getDate() + 6);
    
    return { start, end };
}

// ==========================================
// MENU ACTIONS RAPIDES
// ==========================================

function handleQuickAction(action) {
    switch(action) {
        case 'import':
            document.getElementById('importFileQuick').click();
            break;
        case 'backup':
            window.switchTab('sauvegarde');
            break;
        case 'archives':
            window.switchTab('archives');
            break;
        case 'ical':
            window.switchTab('gestion');
            break;
    }
}

// Export vers window pour accessibilité globale
window.showToast = showToast;
window.dateToLocalString = dateToLocalString;
window.parseLocalDate = parseLocalDate;
window.calculateNights = calculateNights;
window.formatDate = formatDate;
window.formatDateShort = formatDateShort;
window.getMonthYear = getMonthYear;
window.isCouzon = isCouzon;
window.isTrevoux = isTrevoux;
window.invalidateCache = invalidateCache;
window.getPlatformBadgeClass = getPlatformBadgeClass;
window.getPlatformLogo = getPlatformLogo;
window.getWeekNumber = getWeekNumber;
window.getWeekDates = getWeekDates;
window.handleQuickAction = handleQuickAction;
