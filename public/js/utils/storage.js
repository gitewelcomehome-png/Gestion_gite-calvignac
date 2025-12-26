// Gestion Gîtes - Storage Utilities (localStorage, sessionStorage, Supabase)

// Supabase Configuration
// Note: In production, these should be environment variables
// For now, keeping them here for compatibility with existing index.html
const SUPABASE_URL = 'https://ivqiisnudabxemcxxyru.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2cWlpc251ZGFieGVtY3h4eXJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzOTk0NjMsImV4cCI6MjA4MDk3NTQ2M30.9FwJPgR8bbaP7bAemuaVbAN019EO5ql7uciQO9FeHK4';

// Initialize Supabase client (singleton pattern)
var supabase;
if (typeof window.supabaseClient === 'undefined') {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    window.supabaseClient = supabase;
} else {
    supabase = window.supabaseClient;
}

// Data cache for performance
if (!window.dataCache) {
    window.dataCache = {
        reservations: null,
        charges: null,
        lastUpdate: {}
    };
}

// Default iCal URLs configuration
const DEFAULT_ICAL_CONFIGS = {
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

/**
 * Get iCal URLs configuration from localStorage or defaults
 * @returns {Object} iCal configuration object
 */
function getIcalConfigs() {
    const stored = localStorage.getItem('icalUrls');
    if (stored) {
        return JSON.parse(stored);
    }
    return DEFAULT_ICAL_CONFIGS;
}

/**
 * Load iCal URLs into form fields
 */
function chargerUrlsIcal() {
    const configs = getIcalConfigs();
    document.getElementById('icalAirbnbCouzon').value = configs.couzon.airbnb;
    document.getElementById('icalAbritelCouzon').value = configs.couzon.abritel;
    document.getElementById('icalGitesCouzon').value = configs.couzon.gitesDeFrance;
    document.getElementById('icalAirbnbTrevoux').value = configs.trevoux.airbnb;
    document.getElementById('icalAbritelTrevoux').value = configs.trevoux.abritel;
    document.getElementById('icalGitesTrevoux').value = configs.trevoux.gitesDeFrance;
}

/**
 * Save iCal URLs from form fields to localStorage
 */
function sauvegarderUrlsIcal() {
    const configs = {
        couzon: {
            airbnb: document.getElementById('icalAirbnbCouzon').value.trim(),
            abritel: document.getElementById('icalAbritelCouzon').value.trim(),
            gitesDeFrance: document.getElementById('icalGitesCouzon').value.trim()
        },
        trevoux: {
            airbnb: document.getElementById('icalAirbnbTrevoux').value.trim(),
            abritel: document.getElementById('icalAbritelTrevoux').value.trim(),
            gitesDeFrance: document.getElementById('icalGitesTrevoux').value.trim()
        }
    };
    localStorage.setItem('icalUrls', JSON.stringify(configs));
    // Note: showToast is in helpers.js and will be available when scripts are loaded
    if (typeof showToast === 'function') {
        showToast('✓ URLs iCal sauvegardées');
    }
}

// Global variable for iCal configs
let ICAL_CONFIGS = getIcalConfigs();

/**
 * Invalidate cache for a specific type
 * @param {string} type - Type of cache to invalidate
 */
function invalidateCache(type) {
    if (window.dataCache) {
        window.dataCache[type] = null;
    }
}

/**
 * Initialize database (now just checks Supabase is ready)
 * @returns {Promise}
 */
function initDB() {
    console.log('✓ Supabase prêt - IndexedDB non nécessaire');
    return Promise.resolve();
}

/**
 * Add a reservation to Supabase
 * @param {Object} reservation - Reservation object
 * @returns {Promise}
 */
async function addReservation(reservation) {
    try {
        const { data, error } = await supabase
            .from('reservations')
            .insert([reservation])
            .select();
        
        if (error) throw error;
        
        invalidateCache('reservations');
        return data[0];
    } catch (error) {
        console.error('Error adding reservation:', error);
        throw error;
    }
}

/**
 * Get all reservations from Supabase
 * @param {boolean} forceRefresh - Force refresh from database
 * @returns {Promise<Array>}
 */
async function getAllReservations(forceRefresh = false) {
    if (!forceRefresh && window.dataCache.reservations) {
        return window.dataCache.reservations;
    }
    
    try {
        const { data, error } = await supabase
            .from('reservations')
            .select('*')
            .order('date_debut', { ascending: true });
        
        if (error) throw error;
        
        window.dataCache.reservations = data || [];
        window.dataCache.lastUpdate.reservations = Date.now();
        return data || [];
    } catch (error) {
        console.error('Error getting reservations:', error);
        return [];
    }
}

/**
 * Update a reservation in Supabase
 * @param {number} id - Reservation ID
 * @param {Object} updates - Updates to apply
 * @returns {Promise}
 */
async function updateReservation(id, updates) {
    try {
        const { data, error } = await supabase
            .from('reservations')
            .update(updates)
            .eq('id', id)
            .select();
        
        if (error) throw error;
        
        invalidateCache('reservations');
        return data[0];
    } catch (error) {
        console.error('Error updating reservation:', error);
        throw error;
    }
}

/**
 * Delete a reservation from Supabase
 * @param {number} id - Reservation ID
 * @returns {Promise}
 */
async function deleteReservation(id) {
    try {
        const { error } = await supabase
            .from('reservations')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        
        invalidateCache('reservations');
    } catch (error) {
        console.error('Error deleting reservation:', error);
        throw error;
    }
}

/**
 * Add a charge to Supabase
 * @param {Object} charge - Charge object
 * @returns {Promise}
 */
async function addCharge(charge) {
    try {
        const { data, error } = await supabase
            .from('charges')
            .insert([charge])
            .select();
        
        if (error) throw error;
        
        invalidateCache('charges');
        return data[0];
    } catch (error) {
        console.error('Error adding charge:', error);
        throw error;
    }
}

/**
 * Get all charges from Supabase
 * @param {boolean} forceRefresh - Force refresh from database
 * @returns {Promise<Array>}
 */
async function getAllCharges(forceRefresh = false) {
    if (!forceRefresh && window.dataCache.charges) {
        return window.dataCache.charges;
    }
    
    try {
        const { data, error } = await supabase
            .from('charges')
            .select('*')
            .order('date', { ascending: false });
        
        if (error) throw error;
        
        window.dataCache.charges = data || [];
        window.dataCache.lastUpdate.charges = Date.now();
        return data || [];
    } catch (error) {
        console.error('Error getting charges:', error);
        return [];
    }
}

/**
 * Delete a charge from Supabase
 * @param {number} id - Charge ID
 * @returns {Promise}
 */
async function deleteCharge(id) {
    try {
        const { error } = await supabase
            .from('charges')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        
        invalidateCache('charges');
    } catch (error) {
        console.error('Error deleting charge:', error);
        throw error;
    }
}

/**
 * Export all data as JSON
 * @returns {Promise<Object>}
 */
async function exportAllData() {
    const reservations = await getAllReservations(true);
    const charges = await getAllCharges(true);
    
    return {
        reservations,
        charges,
        icalConfigs: getIcalConfigs(),
        exportDate: new Date().toISOString()
    };
}

/**
 * Import data from JSON
 * @param {Object} data - Data to import
 * @returns {Promise}
 */
async function importAllData(data) {
    try {
        // Import reservations
        if (data.reservations && data.reservations.length > 0) {
            for (const reservation of data.reservations) {
                delete reservation.id; // Let Supabase generate new IDs
                await addReservation(reservation);
            }
        }
        
        // Import charges
        if (data.charges && data.charges.length > 0) {
            for (const charge of data.charges) {
                delete charge.id; // Let Supabase generate new IDs
                await addCharge(charge);
            }
        }
        
        // Import iCal configs
        if (data.icalConfigs) {
            localStorage.setItem('icalUrls', JSON.stringify(data.icalConfigs));
            ICAL_CONFIGS = data.icalConfigs;
        }
        
        invalidateCache('reservations');
        invalidateCache('charges');
        
        return true;
    } catch (error) {
        console.error('Error importing data:', error);
        throw error;
    }
}
