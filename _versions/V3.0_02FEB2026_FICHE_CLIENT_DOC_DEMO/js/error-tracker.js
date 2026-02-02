// ================================================================
// 🔍 ERROR TRACKER - Surveillance Erreurs Critiques
// ================================================================
// Capture automatique des erreurs JS et envoi à Supabase
// ================================================================

(function() {
    'use strict';

    // Configuration
    const CONFIG = {
        enableTracking: true,
        logToConsole: true,
        sendToServer: true,
        sampleRate: 1.0 // 100% des erreurs
    };

    // Fonction d'envoi vers Supabase
    async function logError(errorData) {
        if (!CONFIG.sendToServer || !window.supabaseClient) return;

        try {
            const { error } = await window.supabaseClient
                .from('cm_error_logs')
                .insert({
                    error_type: errorData.type,
                    source: errorData.source,
                    message: errorData.message,
                    stack_trace: errorData.stack,
                    user_email: errorData.userEmail,
                    user_agent: navigator.userAgent,
                    url: window.location.href,
                    metadata: errorData.metadata || {}
                });

            if (error && CONFIG.logToConsole) {
                console.error('❌ Erreur envoi log:', error);
            }
        } catch (err) {
            if (CONFIG.logToConsole) {
                console.error('❌ Erreur critique logging:', err);
            }
        }
    }

    // Capture des erreurs non gérées
    window.addEventListener('error', (event) => {
        if (!CONFIG.enableTracking) return;
        if (Math.random() > CONFIG.sampleRate) return;

        // Extraire infos détaillées pour correction auto
        const errorInfo = extractErrorInfo(event);
        
        const errorData = {
            type: 'critical',
            source: event.filename || 'unknown',
            message: event.message || 'Erreur inconnue',
            stack: event.error?.stack || '',
            userEmail: window.currentUser?.email || null,
            metadata: {
                lineno: event.lineno,
                colno: event.colno,
                errorType: event.error?.name || 'Error',
                // Infos pour correction automatique
                fixSuggestion: errorInfo.suggestion,
                elementMissing: errorInfo.element,
                functionName: errorInfo.function,
                canAutoFix: errorInfo.canAutoFix
            }
        };

        if (CONFIG.logToConsole) {
            console.error('🔴 ERREUR CRITIQUE:', errorData);
            if (errorInfo.suggestion) {
                console.info('💡 SUGGESTION:', errorInfo.suggestion);
            }
        }

        logError(errorData);
    });

    // Fonction d'extraction d'infos pour correction auto
    function extractErrorInfo(event) {
        const message = event.message || '';
        const stack = event.error?.stack || '';
        
        let info = {
            suggestion: null,
            element: null,
            function: null,
            canAutoFix: false
        };
        
        // Détecter "Cannot read properties of null"
        if (message.includes("Cannot read properties of null")) {
            const propertyMatch = message.match(/reading '(\w+)'/);
            const property = propertyMatch ? propertyMatch[1] : 'unknown';
            
            // Extraire le nom de la fonction depuis le stack
            const functionMatch = stack.match(/at (\w+)/);
            const functionName = functionMatch ? functionMatch[1] : 'unknown';
            
            info.element = property === 'addEventListener' ? 'DOM element' : property;
            info.function = functionName;
            info.suggestion = `Élément DOM introuvable. Ajouter vérification: if (element) { element.${property}(...) }`;
            info.canAutoFix = property === 'addEventListener';
        }
        
        // Détecter "is not defined"
        if (message.includes("is not defined")) {
            const varMatch = message.match(/(\w+) is not defined/);
            const varName = varMatch ? varMatch[1] : 'unknown';
            
            info.element = varName;
            info.suggestion = `Variable "${varName}" non définie. Vérifier l'import ou la déclaration.`;
            info.canAutoFix = false;
        }
        
        // Détecter "is not a function"
        if (message.includes("is not a function")) {
            const funcMatch = message.match(/(\w+) is not a function/);
            const funcName = funcMatch ? funcMatch[1] : 'unknown';
            
            info.element = funcName;
            info.suggestion = `"${funcName}" n'est pas une fonction. Vérifier le type de la variable.`;
            info.canAutoFix = false;
        }
        
        return info;
    }

    // Capture des promesses rejetées
    window.addEventListener('unhandledrejection', (event) => {
        if (!CONFIG.enableTracking) return;
        if (Math.random() > CONFIG.sampleRate) return;

        const errorData = {
            type: 'warning',
            source: 'unhandled-promise',
            message: event.reason?.message || event.reason || 'Promise rejetée',
            stack: event.reason?.stack || '',
            userEmail: window.currentUser?.email || null,
            metadata: {
                reason: String(event.reason)
            }
        };

        if (CONFIG.logToConsole) {
            console.warn('⚠️ PROMISE REJETÉE:', errorData);
        }

        logError(errorData);
    });

    // Fonction manuelle de logging
    window.logCriticalError = function(message, metadata = {}) {
        const errorData = {
            type: 'critical',
            source: 'manual',
            message: message,
            stack: new Error().stack,
            userEmail: window.currentUser?.email || null,
            metadata: metadata
        };

        if (CONFIG.logToConsole) {
            console.error('🔴 ERREUR MANUELLE:', errorData);
        }

        logError(errorData);
    };

    // Fonction de warning
    window.logWarning = function(message, metadata = {}) {
        const errorData = {
            type: 'warning',
            source: 'manual',
            message: message,
            stack: '',
            userEmail: window.currentUser?.email || null,
            metadata: metadata
        };

        if (CONFIG.logToConsole) {
            console.warn('⚠️ WARNING:', errorData);
        }

        logError(errorData);
    };

    console.log('✅ Error Tracker initialisé');
})();
