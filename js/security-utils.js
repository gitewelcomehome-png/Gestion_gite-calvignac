/**
 * 🛡️ MODULE SÉCURITÉ - Protection XSS & Validation
 * Protection contre les injections XSS et validation des données utilisateur
 */

(function() {
    'use strict';
    
    // DOMPurify sera chargé via le CDN dans le HTML principal
    const DOMPurify = window.DOMPurify;

    const INLINE_HANDLER_COMPAT_ROUTES = new Set([
        '/',
        '/index.html',
        '/app',
        '/app.html',
        '/login',
        '/pages/client-support.html',
        '/pages/fiche-client.html',
        '/pages/femme-menage.html',
        '/pages/onboarding.html',
        '/pages/options.html',
        '/pages/validation.html'
    ]);

    function isInlineHandlerCompatibilityPath(pathname) {
        const currentPath = String(pathname || '').toLowerCase();
        if (!currentPath) return false;

        if (INLINE_HANDLER_COMPAT_ROUTES.has(currentPath)) {
            return true;
        }

        if (currentPath.startsWith('/tabs/')) {
            return true;
        }

        return false;
    }

    // ==========================================
    // 🧹 SANITIZATION HTML (Protection XSS)
    // ==========================================

    /**
     * Nettoie du HTML pour enlever tout code malveillant
     * @param {string} dirty - HTML potentiellement dangereux
     * @param {object} config - Configuration DOMPurify optionnelle
     * @returns {string} HTML nettoyé et sécurisé
     */
    function sanitizeHTML(dirty, config = {}) {
    if (!dirty) return '';
    
    const defaultConfig = {
        ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 'span', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'small', 'button', 'img', 'input', 'textarea', 'select', 'option', 'label', 'form', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'section', 'article', 'nav', 'header', 'footer', 'aside', 'main', 'figure', 'figcaption', 'canvas', 'svg', 'path', 'circle', 'rect', 'line', 'polygon', 'polyline', 'ellipse', 'g'],
        ALLOWED_ATTR: ['href', 'title', 'target', 'style', 'class', 'type', 'data-activite-id', 'data-wa-resa-id', 'data-wa-token', 'data-wa-retour-resa-id', 'data-wa-sujet', 'src', 'alt', 'id', 'name', 'value', 'placeholder', 'required', 'disabled', 'checked', 'selected', 'for', 'min', 'max', 'step', 'pattern', 'maxlength', 'minlength', 'rows', 'cols', 'readonly', 'autocomplete', 'multiple', 'size', 'viewBox', 'fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'd', 'points', 'cx', 'cy', 'r', 'x', 'y', 'width', 'height', 'x1', 'y1', 'x2', 'y2'],
        ALLOW_DATA_ATTR: true,
        FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'meta', 'base'],
        // ⚠️ Bloquer tous les event handlers inline
        FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onmouseout', 'onchange', 'oninput', 'onsubmit', 'onfocus', 'onblur']
    };
    
    return DOMPurify.sanitize(dirty, { ...defaultConfig, ...config });
}

    /**
     * Remplace innerHTML de manière sécurisée
     * @param {HTMLElement} element - Élément DOM
     * @param {string} html - HTML à insérer
     * @param {object} config - Configuration DOMPurify optionnelle
     */
    function setInnerHTML(element, html, config = {}) {
    if (!element) {
        console.error('setInnerHTML: élément null');
        return;
    }
    
    // Pour le contenu "trusted" (templates internes),
    // conserver les styles inline mais ne jamais exécuter de <script> injecté
    if (config.trusted) {
        const trustedConfig = {
            ALLOW_DATA_ATTR: true,
            KEEP_CONTENT: true,
            ADD_TAGS: ['style'],
            ADD_ATTR: ['onclick', 'onmouseover', 'onmouseout', 'onchange', 'oninput', 'onsubmit', 'onfocus', 'onblur'],
            FORBID_ATTR: ['onerror', 'onload']
        };
        
        // Extraire uniquement les styles avant sanitization
        const styleRegex = /<style\b[^>]*>([\s\S]*?)<\/style>/gi;
        const styles = [];
        let match;
        
        while ((match = styleRegex.exec(html)) !== null) {
            styles.push(match[1]);
        }
        
        // Injecter le HTML nettoyé
        element.innerHTML = DOMPurify.sanitize(html, trustedConfig);
        
        // Injecter les styles extraits
        styles.forEach((styleContent, index) => {
            if (styleContent.trim()) {
                const style = document.createElement('style');
                style.textContent = styleContent;
                element.appendChild(style);
            }
        });
        
    } else {
        const htmlString = String(html || '');
        const containsInlineHandlers = /\son[a-z]+\s*=\s*/i.test(htmlString);
        const currentPath = String(window.location?.pathname || '').toLowerCase();
        const isAdminSurface = currentPath.includes('/pages/admin-') || currentPath.includes('/pages/admin/');
        const isAllowlistedLegacySurface = isInlineHandlerCompatibilityPath(currentPath);
        const allowInlineHandlers = config.allowInlineHandlers === true || isAllowlistedLegacySurface;

        if (containsInlineHandlers && !isAdminSurface && allowInlineHandlers) {
            const compatibilityConfig = {
                ADD_ATTR: ['onclick', 'onmouseover', 'onmouseout', 'onchange', 'oninput', 'onsubmit', 'onfocus', 'onblur'],
                FORBID_ATTR: ['onerror', 'onload']
            };

            element.innerHTML = sanitizeHTML(htmlString, { ...compatibilityConfig, ...config });
        } else {
            element.innerHTML = sanitizeHTML(htmlString, config);
        }
    }
}

    /**
     * Nettoie du texte brut (enlève toutes les balises HTML)
     * @param {string} text - Texte potentiellement avec HTML
     * @returns {string} Texte pur sans HTML
     */
    function sanitizeText(text) {
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
    function validateEmail(email) {
    if (!email) return false;
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

    /**
     * Valide un numéro de téléphone français
     * @param {string} phone - Téléphone à valider
     * @returns {boolean} true si valide
     */
    function validatePhone(phone) {
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
    function validateAmount(amount) {
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
    function validateName(name) {
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
    function validateDate(date) {
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
    function validateInteger(num) {
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
    function markInputError(input, message = '') {
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
    function clearInputError(input) {
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
    function validateForm(form, validators) {
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

})();
