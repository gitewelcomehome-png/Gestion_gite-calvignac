// js/utils.js — Fonctions utilitaires transversales
// Inclus dans toutes les pages. Source unique de vérité pour les comportements
// répétitifs identifiés dans la base de code.
//
// ⚠️  NE PAS DUPLIQUER ces fonctions dans les autres modules JS.
//      Si une copie locale existe encore, elle sera supprimée progressivement.
//
// API : window.Utils.<fonction>
// Alias globaux maintenus pour la rétrocompatibilité : escapeHtml, debounce,
// throttle, formatCurrency, copyToClipboard, safeJSONParse, isNullOrEmpty,
// truncateText.

(function (global) {
    'use strict';

    // ================================================
    // 1. SÉCURITÉ — Échappement HTML
    // ================================================

    /**
     * Échappe les caractères HTML spéciaux d'une chaîne.
     * Utilise un élément DOM temporaire : résultat identique dans tous les navigateurs.
     * Contre-partie légère de sanitizeHTML (security-utils.js) pour du texte pur.
     *
     * @param {*} text — Valeur à échapper
     * @returns {string}
     */
    function escapeHtml(text) {
        if (text === null || text === undefined) return '';
        const div = document.createElement('div');
        div.textContent = String(text);
        return div.innerHTML;
    }

    // ================================================
    // 2. PERFORMANCE — Debounce & Throttle
    // ================================================

    /**
     * Retarde l'exécution de `fn` jusqu'à ce qu'aucun nouvel appel ne soit
     * effectué pendant `delay` ms. Idéal pour les champs de recherche / saisie.
     *
     * @param {Function} fn
     * @param {number} delay — Délai en millisecondes
     * @returns {Function}
     */
    function debounce(fn, delay) {
        let timer;
        return function debounced(...args) {
            clearTimeout(timer);
            timer = setTimeout(() => fn.apply(this, args), delay);
        };
    }

    /**
     * Limite l'exécution de `fn` à une fois par `delay` ms.
     * Idéal pour les événements scroll / resize.
     *
     * @param {Function} fn
     * @param {number} delay — Délai en millisecondes
     * @returns {Function}
     */
    function throttle(fn, delay) {
        let lastCall = 0;
        let timer;
        return function throttled(...args) {
            const now = Date.now();
            const remaining = delay - (now - lastCall);
            if (remaining <= 0) {
                clearTimeout(timer);
                lastCall = now;
                fn.apply(this, args);
            } else {
                clearTimeout(timer);
                timer = setTimeout(() => {
                    lastCall = Date.now();
                    fn.apply(this, args);
                }, remaining);
            }
        };
    }

    // ================================================
    // 3. FORMATAGE — Monétaire
    // ================================================

    /**
     * Formate un nombre en euros selon les conventions françaises.
     * Unifie formatCurrency (admin-finance.js, fiscalite-v2.js) et
     * formatEuros (admin-dashboard.js).
     *
     * @param {number|string} value
     * @returns {string}  Ex : "1 234,56 €"
     */
    function formatCurrency(value) {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'EUR',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(Number(value) || 0);
    }

    // ================================================
    // 4. PRESSE-PAPIER
    // ================================================

    /**
     * Copie `text` dans le presse-papier.
     * Retourne une Promise<boolean> (true = succès).
     *
     * @param {string} text
     * @returns {Promise<boolean>}
     */
    async function copyToClipboard(text) {
        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(text);
                return true;
            }
            // Fallback pour les contextes sans API Clipboard (non-HTTPS)
            const textarea = document.createElement('textarea');
            textarea.value = String(text);
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            const ok = document.execCommand('copy');
            document.body.removeChild(textarea);
            return ok;
        } catch (err) {
            console.error('[Utils] copyToClipboard échoué :', err.message);
            return false;
        }
    }

    // ================================================
    // 5. JSON / STOCKAGE
    // ================================================

    /**
     * Parse du JSON sans lever d'exception.
     *
     * @param {string} str
     * @param {*} fallback — Valeur retournée en cas d'erreur
     * @returns {*}
     */
    function safeJSONParse(str, fallback = null) {
        try {
            return JSON.parse(str);
        } catch (_) {
            return fallback;
        }
    }

    // ================================================
    // 6. DIVERS — Vérifications & Texte
    // ================================================

    /**
     * Retourne true si la valeur est null, undefined, une chaîne vide ou
     * une chaîne composée uniquement d'espaces.
     *
     * @param {*} value
     * @returns {boolean}
     */
    function isNullOrEmpty(value) {
        return value === null || value === undefined || String(value).trim() === '';
    }

    /**
     * Tronque `text` à `max` caractères et ajoute `suffix` si nécessaire.
     *
     * @param {string} text
     * @param {number} max
     * @param {string} [suffix='…']
     * @returns {string}
     */
    function truncateText(text, max, suffix) {
        if (!text) return '';
        const str = String(text);
        if (str.length <= max) return str;
        const end = typeof suffix === 'string' ? suffix : '…';
        return str.slice(0, max) + end;
    }

    // ================================================
    // 7. NOTIFICATIONS — Toast
    // ================================================

    /**
     * Affiche un toast de notification flottant (coin supérieur droit).
     * Utilisé par les pages autonomes (admin, support, femme-menage, etc.)
     * qui n'ont pas accès à shared-utils.js.
     *
     * Dans app.html, shared-utils.js redéfinit showToast pour le mode inline-onglet.
     * Ce fallback ne s'applique que si aucune version plus spécifique n'est déjà définie.
     *
     * @param {string} message
     * @param {'success'|'error'|'info'|'warning'} [type='success']
     * @param {number} [duration=3500]
     */
    function showToast(message, type, duration) {
        const kind = type || 'success';
        const delay = duration || 3500;
        const bg = kind === 'error' ? '#ef4444'
                 : kind === 'warning' ? '#f59e0b'
                 : kind === 'info' ? '#3b82f6'
                 : '#10b981';

        const toast = document.createElement('div');
        toast.textContent = message;
        toast.style.cssText = [
            'position:fixed',
            'top:20px',
            'right:20px',
            'padding:12px 20px',
            'border-radius:8px',
            'box-shadow:0 4px 12px rgba(0,0,0,0.2)',
            'z-index:100000',
            'color:#fff',
            'font-weight:600',
            'font-size:14px',
            'max-width:360px',
            'word-break:break-word',
            'transition:opacity 0.3s ease',
            'background:' + bg
        ].join(';');

        document.body.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, delay);
    }

    // ================================================
    // EXPORT
    // ================================================

    const Utils = {
        escapeHtml,
        debounce,
        throttle,
        formatCurrency,
        copyToClipboard,
        safeJSONParse,
        isNullOrEmpty,
        truncateText,
        showToast
    };

    // Namespace principal
    global.Utils = Utils;

    // Alias globaux pour la rétrocompatibilité avec l'existant.
    // Conditionnels : on ne remplace pas une définition locale plus spécifique.
    if (typeof global.escapeHtml === 'undefined') {
        global.escapeHtml = escapeHtml;
    }
    if (typeof global.debounce === 'undefined') {
        global.debounce = debounce;
    }
    if (typeof global.showToast === 'undefined') {
        global.showToast = showToast;
    }

}(window));
