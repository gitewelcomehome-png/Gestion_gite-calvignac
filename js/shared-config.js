// ==========================================
// CONFIGURATION GLOBALE ET CONSTANTES
// ==========================================

// Configuration fuseau horaire
const TIMEZONE = window.APP_CONFIG?.TIMEZONE || 'Europe/Paris';

// Configuration Supabase - Chargée depuis config.js
const SUPABASE_URL = window.APP_CONFIG?.SUPABASE_URL;
const SUPABASE_KEY = window.APP_CONFIG?.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Configuration Supabase non chargée');
    console.error('APP_CONFIG:', window.APP_CONFIG);
} else {
    console.log('✅ Configuration Supabase chargée');
}

// Initialiser Supabase (une seule fois)
// Note: window.supabase est la bibliothèque chargée depuis le CDN
if (typeof window.supabaseClient === 'undefined') {
    const { createClient } = window.supabase;
    window.supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);
    console.log('✅ Client Supabase initialisé');
}

// Variables globales pour les charts
window.caChartInstance = null;
window.gitesChartInstance = null;
window.platformsChartInstance = null;
window.profitChartInstance = null;

// Configuration iCal par défaut (depuis window.APP_CONFIG)
const DEFAULT_ICAL_CONFIGS = window.APP_CONFIG?.DEFAULT_ICAL_CONFIGS || {
    couzon: {
        airbnb: 'https://www.airbnb.fr/calendar/ical/13366259.ics?s=d2cd55cf08b32b26b639189d5d4bf93e',
        abritel: 'http://www.homelidays.com/icalendar/d31158afb72048aabba35b3188771598.ics',
        gitesDeFrance: 'https://reservation.itea.fr/iCal_753fbf35431f67e8118e8757e06d2bef.ics?aicc=f26bc80e2e964f8fabb080bbbd3557c8'
    },
    trevoux: {
        airbnb: 'https://www.airbnb.fr/calendar/ical/37315488.ics?s=082e23b5f091ef093d1767499f409dda',
        abritel: 'http://www.abritel.fr/icalendar/0e7482c3c4cf4d08a5811bb27dc86e17.ics?nonTentative',
        gitesDeFrance: 'https://reservation.itea.fr/iCal_a56598e138f4257a14f7e5c5041afdf7.ics?aicc=e9a8169fa0094d7a1f24f1b47f79c65'
    }
};

// Coordonnées GPS des gîtes
const GITES_COORDS = {
    'Trévoux': { lat: 45.93638229370117, lng: 4.791853904724121 },
    'Couzon': { lat: 45.84257125854492, lng: 4.831059455871582 }
};

// Système de cache intelligent
const CACHE = {
    reservations: null,
    reservationsTimestamp: 0,
    charges: null,
    chargesTimestamp: 0,
    historicalData: null,
    historicalTimestamp: 0,
    TTL: 30000 // 30 secondes (réduit pour voir les nouvelles réservations plus vite)
};

// Fonction helper pour créer des dates en heure locale Paris
function createParisDate(...args) {
    const date = new Date(...args);
    return date;
}

// Initialisation (remplace initDB)
function initDB() {
    return Promise.resolve();
}

// Export vers window pour accessibilité globale
window.TIMEZONE = TIMEZONE;
window.SUPABASE_URL = SUPABASE_URL;
window.SUPABASE_KEY = SUPABASE_KEY;
window.DEFAULT_ICAL_CONFIGS = DEFAULT_ICAL_CONFIGS;
window.GITES_COORDS = GITES_COORDS;
window.CACHE = CACHE;
window.createParisDate = createParisDate;
window.initDB = initDB;
