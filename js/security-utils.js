/**
 * 🛡️ MODULE SÉCURITÉ - Protection XSS & Validation
 * Protection contre les injections XSS et validation des données utilisateur
 */

// Importer DOMPurify
import DOMPurify from '../node_modules/dompurify/dist/purify.es.mjs';

// ==========================================
// 🧹 SANITIZATION HTML (Protection XSS)
// ==========================================

/**
 * Nettoie du HTML pour enlever tout code malveillant
 * @param {string} dirty - HTML potentiellement dangereux
 * @param {object} config - Configuration DOMPurify optionnelle
 * @returns {string} HTML nettoyé et sécurisé
 */
export function sanitizeHTML(dirty, config = {}) {
    if (!dirty) return '';
    
    const defaultConfig = {
        ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 'span', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'small'],
        ALLOWED_ATTR: ['href', 'title', 'target', 'style', 'class'],
        ALLOW_DATA_ATTR: false
    };
    
    return DOMPurify.sanitize(dirty, { ...defaultConfig, ...config });
}

/**
 * Remplace innerHTML de manière sécurisée
 * @param {HTMLElement} element - Élément DOM
 * @param {string} html - HTML à insérer
 * @param {object} config - Configuration DOMPurify optionnelle
 */
export function setInnerHTML(element, html, config = {}) {
    if (!element) {
        console.error('setInnerHTML: élément null');
        return;
    }
    element.innerHTML = sanitizeHTML(html, config);
}

/**
 * Nettoie du texte brut (enlève toutes les balises HTML)
 * @param {string} text - Texte potentiellement avec HTML
 * @returns {string} Texte pur sans HTML
 */
export function sanitizeText(text) {
    if (!text) return '';
    return DOMPurify.sanitize(text, { ALLOWED_TAGS: [] });
}

// ==========================================
// ✅ VALIDATION DES DONNÉES
// ==========================================

/**
 * Valide une adresse email
 * @param {string} email - Email à valider
 * @returns {boolean} true si valide
 */
export function validateEmail(email) {
    if (!email) return false;
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

/**
 * Valide un numéro de téléphone français
 * @param {string} phone - Téléphone à valider
 * @returns {boolean} true si valide
 */
export function validatePhone(phone) {
    if (!phone) return false;
    // Accepte : 0612345678, 06 12 34 56 78, 06.12.34.56.78, +33612345678
    const regex = /^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/;
    return regex.test(phone);
}

/**
 * Valide un montant (nombre positif avec max 2 décimales)
 * @param {string|number} amount - Montant à valider
 * @returns {boolean} true si valide
 */
export function validateAmount(amount) {
    if (amount === null || amount === undefined || amount === '') return false;
    const num = parseFloat(amount);
    if (isNaN(num) || num < 0) return false;
    // Vérifier max 2 décimales
    return /^\d+(\.\d{1,2})?$/.test(amount.toString());
}

/**
 * Valide un nom (lettres, espaces, tirets, apostrophes)
 * @param {string} name - Nom à valider
 * @returns {boolean} true si valide
 */
export function validateName(name) {
    if (!name || name.trim().length < 2) return false;
    // Accepte lettres accentuées, espaces, tirets, apostrophes
    const regex = /^[a-zA-ZÀ-ÿ\s'-]{2,50}$/;
    return regex.test(name);
}

/**
 * Valide une date au format YYYY-MM-DD
 * @param {string} date - Date à valider
 * @returns {boolean} true si valide
 */
export function validateDate(date) {
    if (!date) return false;
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(date)) return false;
    
    const d = new Date(date);
    return d instanceof Date && !isNaN(d);
}

/**
 * Valide un nombre entier positif
 * @param {string|number} num - Nombre à valider
 * @returns {boolean} true si valide
 */
export function validateInteger(num) {
    if (num === null || num === undefined || num === '') return false;
    const n = parseInt(num);
    return !isNaN(n) && n >= 0 && n.toString() === num.toString();
}

// ==========================================
// 🎨 HELPERS POUR FORMULAIRES
// ==========================================

/**
 * Ajoute une classe d'erreur à un input invalide
 * @param {HTMLElement} input - Input à marquer
 * @param {string} message - Message d'erreur
 */
export function markInputError(input, message = '') {
    if (!input) return;
    input.classList.add('input-error');
    input.setAttribute('aria-invalid', 'true');
    
    if (message) {
        let errorDiv = input.nextElementSibling;
        if (!errorDiv || !errorDiv.classList.contains('error-message')) {
            errorDiv = document.createElement('div');
            errorDiv.className = 'error-message';
            input.parentNode.insertBefore(errorDiv, input.nextSibling);
        }
        errorDiv.textContent = message;
    }
}

/**
 * Enlève la classe d'erreur d'un input
 * @param {HTMLElement} input - Input à nettoyer
 */
export function clearInputError(input) {
    if (!input) return;
    input.classList.remove('input-error');
    input.removeAttribute('aria-invalid');
    
    const errorDiv = input.nextElementSibling;
    if (errorDiv && errorDiv.classList.contains('error-message')) {
        errorDiv.remove();
    }
}

/**
 * Valide un formulaire complet
 * @param {HTMLFormElement} form - Formulaire à valider
 * @param {object} validators - Map de {fieldName: validatorFunction}
 * @returns {boolean} true si le formulaire est valide
 */
export function validateForm(form, validators) {
    if (!form) return false;
    
    let isValid = true;
    
    for (const [fieldName, validator] of Object.entries(validators)) {
        const input = form.elements[fieldName];
        if (!input) continue;
        
        clearInputError(input);
        
        const result = validator(input.value);
        if (!result.valid) {
            markInputError(input, result.message);
            isValid = false;
        }
    }
    
    return isValid;
}

// ==========================================
// 🔒 EXPORT GLOBAL POUR COMPATIBILITÉ
// ==========================================

// Rendre disponible globalement pour les scripts existants
if (typeof window !== 'undefined') {
    window.SecurityUtils = {
        sanitizeHTML,
        setInnerHTML,
        sanitizeText,
        validateEmail,
        validatePhone,
        validateAmount,
        validateName,
        validateDate,
        validateInteger,
        markInputError,
        clearInputError,
        validateForm
    };
    
    console.log('🛡️ SecurityUtils chargé et disponible globalement');
}
