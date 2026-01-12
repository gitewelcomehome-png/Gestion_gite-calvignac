// ==========================================
// CONFIGURATION GLOBALE ET CONSTANTES
// ==========================================

// Utiliser LOCAL_CONFIG en priorité (pour dev), sinon valeurs par défaut
if (typeof window.APP_CONFIG === 'undefined') {
    window.APP_CONFIG = {
        TIMEZONE: 'Europe/Paris',
        SUPABASE_URL: window.LOCAL_CONFIG?.SUPABASE_URL || 'https://fgqimtpjjhdqeyyaptoj.supabase.co',
        SUPABASE_KEY: window.LOCAL_CONFIG?.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZncWltdHBqamhkcWV5eWFwdG9qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgxNTU0MjQsImV4cCI6MjA4MzczMTQyNH0.fOuYg0COYts7XXWxgB7AM01Fg6P86f8oz8XVpGdIaNM'
    };
    // Configuration chargée silencieusement
}

// Configuration fuseau horaire
const TIMEZONE = window.APP_CONFIG.TIMEZONE;

// Configuration Supabase
const SUPABASE_URL = window.APP_CONFIG.SUPABASE_URL;
const SUPABASE_KEY = window.APP_CONFIG.SUPABASE_KEY;

// Config OK (logs désactivés)

// Initialiser Supabase (une seule fois)
// Note: window.supabase est la bibliothèque chargée depuis le CDN
if (typeof window.supabaseClient === 'undefined') {
    const { createClient } = window.supabase;
    window.supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);
    // Client Supabase initialisé
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
// ⚠️ DEPRECATED: Utiliser window.gitesManager.getCoordinates() à la place
const GITES_COORDS = {};

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
