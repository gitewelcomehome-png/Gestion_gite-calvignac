/**
 * 🛡️ MODULE VALIDATION
 * Validation et sanitization des entrées utilisateur
 * Phase 4 - Sécurisation des inputs
 */

(function() {
    'use strict';

// ==========================================
// 📋 RÈGLES DE VALIDATION
// ==========================================

const ValidationRules = {
    // Emails
    email: {
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        message: 'Email invalide',
        maxLength: 255
    },
    
    // Téléphones français
    phone: {
        pattern: /^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/,
        message: 'Numéro de téléphone invalide (format: 06 12 34 56 78)',
        sanitize: (value) => value.replace(/[\s.-]/g, '')
    },
    
    // Montants financiers
    amount: {
        pattern: /^\d+(\.\d{1,2})?$/,
        message: 'Montant invalide (ex: 150.50)',
        min: 0,
        max: 999999.99,
        sanitize: (value) => parseFloat(value) || 0
    },
    
    // Nombres entiers
    integer: {
        pattern: /^\d+$/,
        message: 'Nombre entier requis',
        min: 0,
        max: 999999,
        sanitize: (value) => parseInt(value) || 0
    },
    
    // Dates
    date: {
        pattern: /^\d{4}-\d{2}-\d{2}$/,
        message: 'Date invalide (format: YYYY-MM-DD)',
        validate: (value) => {
            const date = new Date(value);
            return date instanceof Date && !isNaN(date);
        }
    },
    
    // Texte général
    text: {
        maxLength: 500,
        message: 'Texte trop long (max 500 caractères)',
        sanitize: (value) => value.trim()
    },
    
    // Noms (personnes, lieux)
    name: {
        pattern: /^[a-zA-ZÀ-ÿ\s'-]{1,100}$/,
        message: 'Nom invalide (lettres, espaces, tirets uniquement)',
        maxLength: 100,
        sanitize: (value) => value.trim()
    },
    
    // Code postal français
    postalCode: {
        pattern: /^[0-9]{5}$/,
        message: 'Code postal invalide (5 chiffres)',
        sanitize: (value) => value.replace(/\s/g, '')
    },
    
    // Horaires (ex: "15h00", "À partir de 15h00", "Avant 10h00")
    hours: {
        pattern: /^[0-9h:. àÀpartideéèvnPàéèêôùûüïABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'-]+$/,
        message: 'Format horaire invalide',
        maxLength: 100,
        sanitize: (value) => value.trim()
    },
    
    // URLs
    url: {
        pattern: /^https?:\/\/.+/,
        message: 'URL invalide',
        maxLength: 2000
    }
};

// ==========================================
// 🔍 FONCTIONS DE VALIDATION
// ==========================================

/**
 * Valider une valeur selon une règle
 * @param {string} value - Valeur à valider
 * @param {string} ruleType - Type de règle (email, phone, amount, etc.)
 * @param {Object} options - Options supplémentaires (required, custom, etc.)
 * @returns {Object} - { valid: boolean, message: string, sanitized: any }
 */
function validateValue(value, ruleType, options = {}) {
    // Champ optionnel vide
    if (!options.required && (!value || value.toString().trim() === '')) {
        return { valid: true, message: '', sanitized: '' };
    }
    
    // Champ requis vide
    if (options.required && (!value || value.toString().trim() === '')) {
        return { valid: false, message: 'Ce champ est requis', sanitized: value };
    }
    
    const rule = ValidationRules[ruleType];
    if (!rule) {
        console.warn(`Règle de validation "${ruleType}" inconnue`);
        return { valid: true, message: '', sanitized: value };
    }
    
    let sanitized = value;
    
    // Sanitization
    if (rule.sanitize) {
        sanitized = rule.sanitize(value);
    }
    
    // Validation pattern
    if (rule.pattern && !rule.pattern.test(sanitized)) {
        return { valid: false, message: rule.message, sanitized };
    }
    
    // Validation custom
    if (rule.validate && !rule.validate(sanitized)) {
        return { valid: false, message: rule.message, sanitized };
    }
    
    // Validation longueur max
    if (rule.maxLength && sanitized.length > rule.maxLength) {
        return { 
            valid: false, 
            message: `Maximum ${rule.maxLength} caractères`, 
            sanitized 
        };
    }
    
    // Validation min/max (nombres)
    if (typeof rule.min !== 'undefined') {
        const numValue = parseFloat(sanitized);
        if (numValue < rule.min) {
            return { 
                valid: false, 
                message: `Minimum: ${rule.min}`, 
                sanitized 
            };
        }
    }
    
    if (typeof rule.max !== 'undefined') {
        const numValue = parseFloat(sanitized);
        if (numValue > rule.max) {
            return { 
                valid: false, 
                message: `Maximum: ${rule.max}`, 
                sanitized 
            };
        }
    }
    
    return { valid: true, message: '', sanitized };
}

/**
 * Valider un formulaire complet
 * @param {HTMLFormElement} form - Formulaire à valider
 * @param {Object} rules - Règles par champ { fieldId: { type: 'email', required: true } }
 * @returns {Object} - { valid: boolean, errors: {}, values: {} }
 */
function validateForm(form, rules) {
    const errors = {};
    const values = {};
    let valid = true;
    
    Object.keys(rules).forEach(fieldId => {
        const field = form.querySelector(`#${fieldId}`);
        if (!field) {
            console.warn(`Champ #${fieldId} introuvable dans le formulaire`);
            return;
        }
        
        const rule = rules[fieldId];
        const result = validateValue(field.value, rule.type, rule);
        
        if (!result.valid) {
            valid = false;
            errors[fieldId] = result.message;
            showFieldError(field, result.message);
        } else {
            clearFieldError(field);
            values[fieldId] = result.sanitized;
        }
    });
    
    return { valid, errors, values };
}

/**
 * Afficher une erreur sur un champ
 * @param {HTMLElement} field - Champ en erreur
 * @param {string} message - Message d'erreur
 */
function showFieldError(field, message) {
    // Supprimer ancienne erreur
    clearFieldError(field);
    
    // Ajouter style erreur
    field.style.borderColor = '#e74c3c';
    field.style.backgroundColor = '#fff5f5';
    
    // Créer message erreur
    const errorDiv = document.createElement('div');
    errorDiv.className = 'validation-error';
    errorDiv.textContent = message;
    errorDiv.style.color = '#e74c3c';
    errorDiv.style.fontSize = '0.85rem';
    errorDiv.style.marginTop = '5px';
    errorDiv.setAttribute('data-error-for', field.id);
    
    // Insérer après le champ
    field.parentNode.insertBefore(errorDiv, field.nextSibling);
}

/**
 * Effacer l'erreur d'un champ
 * @param {HTMLElement} field - Champ
 */
function clearFieldError(field) {
    // Retirer style erreur
    field.style.borderColor = '';
    field.style.backgroundColor = '';
    
    // Supprimer message erreur
    const existingError = field.parentNode.querySelector(`[data-error-for="${field.id}"]`);
    if (existingError) {
        existingError.remove();
    }
}

/**
 * Attacher validation en temps réel sur un champ
 * @param {string} fieldId - ID du champ
 * @param {string} ruleType - Type de règle
 * @param {Object} options - Options
 */
function attachRealtimeValidation(fieldId, ruleType, options = {}) {
    const field = document.getElementById(fieldId);
    if (!field) return;
    
    // Validation à la saisie pour bloquer caractères invalides
    if (ruleType === 'phone') {
        field.addEventListener('input', function(e) {
            // Autoriser UNIQUEMENT chiffres, +, espace, tiret
            // Pas de lettres du tout !
            this.value = this.value.replace(/[^0-9+\- ]/g, '');
            // Limiter à 14 caractères (format international: +33 6 12 34 56 78 = 14 car)
            if (this.value.length > 14) {
                this.value = this.value.substring(0, 14);
            }
        });
        field.addEventListener('keypress', function(e) {
            // Bloquer aussi au keypress pour une réaction instantanée
            const char = String.fromCharCode(e.which || e.keyCode);
            const currentLength = e.target.value.length;
            if (!/[0-9+\- ]/.test(char) || currentLength >= 14) {
                e.preventDefault();
                return false;
            }
        });
    } else if (ruleType === 'hours') {
        // Pour les horaires: autoriser chiffres, h, :, espace et lettres françaises
        const allowedChars = /[^0-9h:. àÀâÂäÄéèêëÉÈÊËïîÏÎôöÔÖùûüÙÛÜçÇa-zA-Z'-]/g;
        const allowedCharsTest = /[0-9h:. àÀâÂäÄéèêëÉÈÊËïîÏÎôöÔÖùûüÙÛÜçÇa-zA-Z'-]/;
        
        field.addEventListener('input', function(e) {
            const before = this.value;
            this.value = this.value.replace(allowedChars, '');
            if (this.value.length > 100) {
                this.value = this.value.substring(0, 100);
            }
            if (before !== this.value) {
                // console.log('🚫 Caractères invalides bloqués dans horaires');
            }
        });
        field.addEventListener('keypress', function(e) {
            const char = String.fromCharCode(e.which || e.keyCode);
            if (!allowedCharsTest.test(char)) {
                e.preventDefault();
                return false;
            }
        });
    } else if (ruleType === 'email') {
        // Pour email, pas de filtrage de saisie mais validation stricte au blur
        field.addEventListener('input', function(e) {
            // Nettoyer les espaces au début/fin
            this.value = this.value.trim();
        });
    } else if (ruleType === 'amount' || ruleType === 'integer') {
        field.addEventListener('input', function(e) {
            // Autoriser uniquement chiffres et . pour montant
            if (ruleType === 'amount') {
                this.value = this.value.replace(/[^\d.]/g, '');
                // Limiter à un seul point décimal
                const parts = this.value.split('.');
                if (parts.length > 2) {
                    this.value = parts[0] + '.' + parts.slice(1).join('');
                }
            } else {
                this.value = this.value.replace(/[^\d]/g, '');
            }
        });
        field.addEventListener('keypress', function(e) {
            const char = String.fromCharCode(e.which || e.keyCode);
            if (ruleType === 'amount') {
                if (!/[\d.]/.test(char)) {
                    e.preventDefault();
                    return false;
                }
            } else {
                if (!/\d/.test(char)) {
                    e.preventDefault();
                    return false;
                }
            }
        });
    }
    
    field.addEventListener('blur', function() {
        const result = validateValue(this.value, ruleType, options);
        if (!result.valid) {
            showFieldError(this, result.message);
        } else {
            clearFieldError(this);
            // Appliquer la valeur sanitized
            if (result.sanitized !== this.value) {
                this.value = result.sanitized;
            }
        }
    });
    
    // Effacer erreur lors de la saisie
    field.addEventListener('input', function() {
        if (this.style.borderColor === 'rgb(231, 76, 60)') {
            clearFieldError(this);
        }
    });
}

/**
 * Sanitizer HTML pour prévenir XSS dans les inputs
 * @param {string} html - HTML à sanitizer
 * @returns {string} - HTML nettoyé
 */
function sanitizeHTML(html) {
    const temp = document.createElement('div');
    temp.textContent = html;
    return temp.innerHTML;
}

/**
 * Échapper les caractères SQL dangereux
 * @param {string} value - Valeur à échapper
 * @returns {string} - Valeur échappée
 */
function escapeSQLValue(value) {
    if (typeof value !== 'string') return value;
    return value.replace(/['";\\]/g, '\\$&');
}

// ==========================================
// 🌐 EXPORT GLOBAL
// ==========================================

window.ValidationUtils = {
    validateValue,
    validateForm,
    attachRealtimeValidation,
    sanitizeHTML,
    escapeSQLValue,
    rules: ValidationRules
};

})();
