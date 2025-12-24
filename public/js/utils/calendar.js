// Gestion Gîtes - Calendar & Date Utilities

/**
 * Convert a Date object to local string format (YYYY-MM-DD)
 * @param {Date|string} date - Date to convert
 * @returns {string|null} Date string in YYYY-MM-DD format
 */
function dateToLocalString(date) {
    if (!date) return null;
    if (!(date instanceof Date)) {
        date = new Date(date);
    }
    if (isNaN(date.getTime())) return null;
    
    // Extract year, month, day in LOCAL TIME (not UTC)
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return year + '-' + month + '-' + day;
}

/**
 * Parse a date string in local time
 * @param {string} dateStr - Date string in YYYY-MM-DD format
 * @returns {Date} Date object
 */
function parseLocalDate(dateStr) {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day); // month - 1 because JS months start at 0
}

/**
 * Calculate number of nights between two dates
 * @param {string} debut - Start date in YYYY-MM-DD format
 * @param {string} fin - End date in YYYY-MM-DD format
 * @returns {number} Number of nights
 */
function calculateNights(debut, fin) {
    const d1 = parseLocalDate(debut);
    const d2 = parseLocalDate(fin);
    return Math.ceil((d2 - d1) / (1000 * 60 * 60 * 24));
}

/**
 * Get ISO week number for a date
 * @param {Date} date - Date object
 * @returns {number} ISO week number
 */
function getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

/**
 * Get start and end date of a week
 * @param {number} weekNum - Week number
 * @param {number} year - Year
 * @returns {Object} Object with start and end dates
 */
function getWeekDates(weekNum, year) {
    const simple = new Date(year, 0, 1 + (weekNum - 1) * 7);
    const dow = simple.getDay();
    const ISOweekStart = simple;
    if (dow <= 4)
        ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
    else
        ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
    
    const end = new Date(ISOweekStart);
    end.setDate(ISOweekStart.getDate() + 6);
    
    return {
        start: ISOweekStart,
        end: end
    };
}

/**
 * Check if two date ranges overlap
 * @param {string} start1 - Start date 1 (YYYY-MM-DD)
 * @param {string} end1 - End date 1 (YYYY-MM-DD)
 * @param {string} start2 - Start date 2 (YYYY-MM-DD)
 * @param {string} end2 - End date 2 (YYYY-MM-DD)
 * @returns {boolean} True if dates overlap
 */
function datesOverlap(start1, end1, start2, end2) {
    const s1 = parseLocalDate(start1);
    const e1 = parseLocalDate(end1);
    const s2 = parseLocalDate(start2);
    const e2 = parseLocalDate(end2);
    
    return s1 < e2 && s2 < e1;
}

/**
 * Get Monday of the current week
 * @param {Date} date - Date object
 * @returns {Date} Monday of the week
 */
function getMonday(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
}

/**
 * Get all dates between two dates
 * @param {string} startStr - Start date (YYYY-MM-DD)
 * @param {string} endStr - End date (YYYY-MM-DD)
 * @returns {Array<string>} Array of date strings
 */
function getDatesBetween(startStr, endStr) {
    const dates = [];
    const start = parseLocalDate(startStr);
    const end = parseLocalDate(endStr);
    
    let current = new Date(start);
    while (current < end) {
        dates.push(dateToLocalString(current));
        current.setDate(current.getDate() + 1);
    }
    
    return dates;
}
