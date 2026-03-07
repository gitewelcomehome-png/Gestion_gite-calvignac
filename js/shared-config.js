// ==========================================
// CONFIGURATION GLOBALE ET CONSTANTES
// ==========================================

// Utiliser LOCAL_CONFIG en priorité (pour dev), sinon valeurs par défaut
if (typeof window.APP_CONFIG === 'undefined') {
    window.APP_CONFIG = {
        TIMEZONE: 'Europe/Paris',
        SUPABASE_URL: window.LOCAL_CONFIG?.SUPABASE_URL || 'https://ofdbsymbwdtthnjoxhcd.supabase.co',
        SUPABASE_KEY: window.LOCAL_CONFIG?.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mZGJzeW1id2R0dGhuam94aGNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4MTc2NzYsImV4cCI6MjA4ODM5MzY3Nn0.sMAOMz2lhWi0Dk1kY-po1PPmJ0ExE-14hc0hvW_eKzk'
    };
    // Configuration chargée silencieusement
}

// Configuration fuseau horaire
const TIMEZONE = window.APP_CONFIG.TIMEZONE;

// Configuration Supabase
const SUPABASE_URL = window.APP_CONFIG.SUPABASE_URL;
const SUPABASE_KEY = window.APP_CONFIG.SUPABASE_KEY;

// Configuration mode distribution (switch fonctionnel)
const DISTRIBUTION_ACCESS_MODES = Object.freeze({
    GITES_DE_FRANCE: 'gites_de_france',
    HORS_GITES_DE_FRANCE: 'hors_gites_de_france'
});

const DISTRIBUTION_MODE_STORAGE_KEY = 'distribution_access_mode';

const CHANNEL_CAPABILITIES_BY_MODE = Object.freeze({
    [DISTRIBUTION_ACCESS_MODES.GITES_DE_FRANCE]: {
        'google-vacation-rentals': {
            canRead: false,
            canWrite: false,
            canManageListing: false,
            reason: 'Mode Gîtes de France : accès Google Vacation Rentals désactivé'
        },
        airbnb: { canRead: true, canWrite: false, canManageListing: false },
        abritel: { canRead: true, canWrite: false, canManageListing: false },
        'gites-de-france': { canRead: true, canWrite: false, canManageListing: false }
    },
    [DISTRIBUTION_ACCESS_MODES.HORS_GITES_DE_FRANCE]: {
        'google-vacation-rentals': {
            canRead: true,
            canWrite: true,
            canManageListing: true,
            reason: null
        },
        airbnb: { canRead: true, canWrite: false, canManageListing: false },
        abritel: { canRead: true, canWrite: false, canManageListing: false },
        'gites-de-france': { canRead: true, canWrite: false, canManageListing: false }
    }
});

function normalizeDistributionAccessMode(mode) {
    if (mode === DISTRIBUTION_ACCESS_MODES.GITES_DE_FRANCE) return mode;
    if (mode === DISTRIBUTION_ACCESS_MODES.HORS_GITES_DE_FRANCE) return mode;
    return DISTRIBUTION_ACCESS_MODES.HORS_GITES_DE_FRANCE;
}

function readPersistedDistributionMode() {
    try {
        return localStorage.getItem(DISTRIBUTION_MODE_STORAGE_KEY);
    } catch (_) {
        return null;
    }
}

function getDistributionAccessMode(context = {}) {
    const contextMode =
        context?.distributionAccessMode ||
        context?.distribution_mode ||
        context?.distributionMode ||
        context?.gite?.distribution_access_mode ||
        context?.gite?.distribution_mode ||
        null;

    const configMode = window.APP_CONFIG?.DISTRIBUTION_ACCESS_MODE || null;
    const persistedMode = readPersistedDistributionMode();

    return normalizeDistributionAccessMode(contextMode || configMode || persistedMode);
}

function setDistributionAccessMode(mode, options = {}) {
    const normalizedMode = normalizeDistributionAccessMode(mode);
    const shouldPersist = options.persist !== false;

    window.APP_CONFIG.DISTRIBUTION_ACCESS_MODE = normalizedMode;

    if (shouldPersist) {
        try {
            localStorage.setItem(DISTRIBUTION_MODE_STORAGE_KEY, normalizedMode);
        } catch (_) {
            // no-op
        }
    }

    return normalizedMode;
}

function normalizeChannelName(channel) {
    const normalized = String(channel || '').trim().toLowerCase();
    if (normalized === 'google-vr' || normalized === 'google_vr' || normalized === 'google-vacation-rental') {
        return 'google-vacation-rentals';
    }
    return normalized;
}

function getChannelCapabilities(channel, context = {}) {
    const mode = getDistributionAccessMode(context);
    const channelKey = normalizeChannelName(channel);
    const modeCapabilities = CHANNEL_CAPABILITIES_BY_MODE[mode] || {};
    const capabilities = modeCapabilities[channelKey];

    if (!capabilities) {
        return { canRead: true, canWrite: true, canManageListing: true, reason: null };
    }

    return capabilities;
}

function hasChannelCapability(channel, capability = 'canWrite', context = {}) {
    const capabilities = getChannelCapabilities(channel, context);
    return capabilities?.[capability] === true;
}

// Config OK (logs désactivés)

// Initialiser Supabase (une seule fois)
// Note: window.supabase est la bibliothèque chargée depuis le CDN
if (typeof window.supabaseClient === 'undefined') {
    const { createClient } = window.supabase;
    if (!SUPABASE_URL || !SUPABASE_KEY) {
        console.error('[shared-config] SUPABASE_URL/SUPABASE_KEY manquants');
    } else {
        window.supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);
        // Client Supabase initialisé
    }
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
// ⚠️ DEPRECATED: Utiliser window.gitesManager.gites pour obtenir les coordonnées dynamiquement
// Les coordonnées sont désormais chargées depuis la table 'gites' (gps_lat, gps_lon)
const GITES_COORDS = {};

// Fonction pour récupérer dynamiquement les coordonnées depuis gitesManager
window.getGitesCoordinates = function() {
    const coords = {};
    if (window.gitesManager && window.gitesManager.gites) {
        window.gitesManager.gites.forEach(gite => {
            if (gite.gps_lat && gite.gps_lon) {
                coords[gite.name] = {
                    lat: parseFloat(gite.gps_lat),
                    lng: parseFloat(gite.gps_lon)
                };
            }
        });
    }
    return coords;
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
window.DISTRIBUTION_ACCESS_MODES = DISTRIBUTION_ACCESS_MODES;
window.getDistributionAccessMode = getDistributionAccessMode;
window.setDistributionAccessMode = setDistributionAccessMode;
window.getChannelCapabilities = getChannelCapabilities;
window.hasChannelCapability = hasChannelCapability;
window.createParisDate = createParisDate;
window.initDB = initDB;

function hardenExternalLinks() {
    const applySecurityRel = (anchor) => {
        if (!anchor || anchor.tagName !== 'A') return;
        const target = (anchor.getAttribute('target') || '').toLowerCase();
        if (target !== '_blank') return;

        const existingRel = new Set(
            String(anchor.getAttribute('rel') || '')
                .split(/\s+/)
                .map((value) => value.trim())
                .filter(Boolean)
        );

        existingRel.add('noopener');
        existingRel.add('noreferrer');
        anchor.setAttribute('rel', Array.from(existingRel).join(' '));
    };

    document.querySelectorAll('a[target="_blank"]').forEach(applySecurityRel);

    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (!(node instanceof Element)) return;

                if (node.matches && node.matches('a[target="_blank"]')) {
                    applySecurityRel(node);
                }

                if (node.querySelectorAll) {
                    node.querySelectorAll('a[target="_blank"]').forEach(applySecurityRel);
                }
            });
        });
    });

    observer.observe(document.documentElement, {
        childList: true,
        subtree: true
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', hardenExternalLinks, { once: true });
} else {
    hardenExternalLinks();
}
