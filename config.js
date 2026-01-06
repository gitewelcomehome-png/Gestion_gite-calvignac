// ==========================================
// CONFIGURATION SÉCURISÉE - Variables d'environnement
// ==========================================
// Ce fichier charge les variables d'environnement de manière sécurisée
// - En développement local : depuis un fichier config.local.js (non versionné)
// - En production Vercel : depuis les variables d'environnement Vercel injectées au build

// Initialiser window.APP_CONFIG IMMÉDIATEMENT
window.APP_CONFIG = window.APP_CONFIG || {};

// Configuration par défaut (non sensible)
window.APP_CONFIG.TIMEZONE = 'Europe/Paris';

// iCal URLs par défaut (public, non sensible)
window.APP_CONFIG.DEFAULT_ICAL_CONFIGS = {
    couzon: {
        airbnb: 'https://www.airbnb.fr/calendar/ical/13366259.ics?s=d2cd55cf08b32b26b639189d5d4bf93e',
        abritel: 'http://www.homelidays.com/icalendar/d31158afb72048aabba35b3188771598.ics',
        gitesDeFrance: 'https://reservation.itea.fr/iCal_753fbf35431f67e8118e8757e06d2bef.ics?aicc=f26bc80e2e964f8fabb080bbbd3557c8'
    },
    trevoux: {
        airbnb: 'https://www.airbnb.fr/calendar/ical/51883611.ics?s=e0d3a44bbcfc2e2c0bc74e4e02e84eb2',
        abritel: 'http://www.homelidays.com/icalendar/0a5b02f7a7fb436484f45dfbf83e9f0f.ics',
        gitesDeFrance: 'https://reservation.itea.fr/iCal_753fbf35431f67e8118e8757e06d2bef.ics?aicc=0b94d6a3eac9441bb01af63077ef6b9e'
    }
};

// Charger les variables sensibles
(function loadSecrets() {
    // Vérifier si config.local.js existe et est chargé
    if (typeof window.LOCAL_CONFIG !== 'undefined') {
        // Développement local
        console.log('🔧 Mode développement : Configuration locale chargée');
        window.APP_CONFIG.SUPABASE_URL = window.LOCAL_CONFIG.SUPABASE_URL;
        window.APP_CONFIG.SUPABASE_KEY = window.LOCAL_CONFIG.SUPABASE_KEY;
    } else if (typeof VERCEL_ENV !== 'undefined') {
        // Production Vercel (variables injectées au build)
        console.log('🚀 Mode production : Variables Vercel');
        window.APP_CONFIG.SUPABASE_URL = VERCEL_SUPABASE_URL;
        window.APP_CONFIG.SUPABASE_KEY = VERCEL_SUPABASE_KEY;
    } else {
        // ❌ Aucune configuration disponible
        console.error('❌ Configuration manquante : créez config.local.js en local ou configurez les variables Vercel');
        throw new Error('Configuration Supabase requise');
    }
    
    console.log('✅ Configuration chargée:', {
        hasUrl: !!window.APP_CONFIG.SUPABASE_URL,
        hasKey: !!window.APP_CONFIG.SUPABASE_KEY
    });
})();

