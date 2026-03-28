// ================================================================
// 🔍 ERROR TRACKER - Surveillance Erreurs Critiques
// ================================================================
// Capture TOUTES les erreurs (JS, console.error, fetch, Supabase)
// DOIT être chargé EN PREMIER avant tout filtre
// ================================================================

(function() {
    'use strict';

    // Configuration
    const CONFIG = {
        enableTracking: true,
        logToConsole: false, // Ne pas logger dans console pour éviter boucle
        sendToServer: true,
        sampleRate: 1.0 // 100% des erreurs
    };

    // 🚨 PROTECTION ANTI-BOUCLE INFINIE
    let isLoggingError = false;

    // Liste des erreurs à ignorer (extensions navigateur + erreurs du tracker + erreurs temporaires)
    const IGNORED_PATTERNS = [
        'chrome-extension://',
        'moz-extension://',
        'safari-extension://',
        'webpage_content_reporter',
        'Erreur envoi log vers BDD', // Ne pas re-logger les erreurs du tracker
        'Erreur critique logging',  // Ne pas re-logger les erreurs du tracker
        'error-tracker.js',          // Ne pas re-logger les erreurs du fichier lui-même
        // Erreurs réseau temporaires (à ignorer complètement)
        'Failed to fetch',
        'NetworkError',
        'Network request failed',
        'timeout',
        'ECONNABORTED',
        'ECONNREFUSED',
        'ETIMEDOUT',
        'Problème réseau temporaire',
        // Erreurs de navigateur/cache (à ignorer)
        'SyntaxError',
        'Unexpected token',
        'Unexpected identifier',
        'Unexpected end of input',
        'Unexpected string',
        'Script error',
        'Loading chunk',
        'ChunkLoadError',
        // Erreurs de tables Supabase non encore déployées (à ignorer)
        'referral_notifications',
        'PGRST205', // Table n'existe pas (schema cache)
        'PGRST116', // Table n'existe pas
        'in the schema cache', // Message d'erreur Supabase
        // Erreurs colonnes manquantes (migrations SQL non exécutées)
        'validation_status',  // Colonne validation_status manquante
        'monitoring_start',   // Colonne monitoring_start manquante
        'resolution_method',  // Colonne resolution_method manquante
        'does not exist',     // Message générique colonne manquante
        'column', // Erreurs liées aux colonnes en général
        // Erreurs du monitoring lui-même (éviter boucle infinie)
        'cm_error_corrections', // Table monitoring corrections
        'cm_clients',           // Table clients (problème permissions)
        'admin-monitoring',     // Page monitoring elle-même
        'loadTestCorrections',  // Fonction monitoring corrections
        // Erreurs envoi emails (ne pas polluer console)
        'Erreur envoi email',
        'sendEmail',
        'sendImmediateEmail',
        'api.resend.com',
        // Ne PAS ignorer les autres erreurs
    ];

    // Fonction pour vérifier si on doit ignorer l'erreur
    function shouldIgnoreError(message, source) {
        const msgStr = String(message || '');
        const srcStr = String(source || '');
        
        return IGNORED_PATTERNS.some(pattern => 
            msgStr.includes(pattern) || srcStr.includes(pattern)
        );
    }

    // Fonction d'envoi vers Supabase avec DÉDUPLICATION
    // retries : compteur interne pour éviter une boucle infinie si supabaseClient ne s'initialise jamais
    async function logError(errorData, retries) {
        if (!CONFIG.sendToServer) return;
        var _retries = retries || 0;
        var MAX_RETRIES = 5;
        
        // 🚨 PROTECTION ANTI-BOUCLE INFINIE
        if (isLoggingError) {
            return; // Ne pas logger si on est déjà en train de logger
        }
        
        // Attendre que Supabase soit prêt (backoff exponentiel, max 5 tentatives)
        if (!window.supabaseClient) {
            if (_retries >= MAX_RETRIES) return; // Abandon silencieux après 5 essais
            setTimeout(function() { logError(errorData, _retries + 1); }, 1000 * (_retries + 1));
            return;
        }

        isLoggingError = true; // Marquer qu'on est en train de logger

        try {
            // Appeler la fonction PostgreSQL de déduplication
            const { data, error } = await window.supabaseClient
                .rpc('upsert_error_log', {
                    p_error_type: errorData.type,
                    p_source: errorData.source || 'unknown',
                    p_message: errorData.message,
                    p_stack_trace: errorData.stack || '',
                    p_user_id: errorData.userId,
                    p_user_email: errorData.userEmail,
                    p_user_agent: navigator.userAgent,
                    p_url: window.location.href,
                    p_metadata: errorData.metadata || {}
                });

            if (error) {
                // Erreur lors de l'envoi - logger UNIQUEMENT dans console native (pas de re-capture)
                if (console.__originalError) {
                    console.__originalError('❌ [ERROR-TRACKER] Impossible de sauvegarder en BDD:', error.message);
                }
            } else {
                // Succès : data contient l'UUID de l'erreur (nouvelle ou existante)
                if (CONFIG.logToConsole && console.__originalLog) {
                    console.__originalLog('✅ Erreur loggée/mise à jour:', data);
                }
            }
        } catch (err) {
            // Erreur critique - logger UNIQUEMENT dans console native
            if (console.__originalError) {
                console.__originalError('❌ [ERROR-TRACKER] Erreur critique:', err.message);
            }
        } finally {
            isLoggingError = false; // Toujours libérer le flag
        }
    }

    // ================================================================
    // 1. CAPTURE DES ERREURS JS NON GÉRÉES
    // ================================================================
    // S'enregistrer EN PREMIER avec useCapture=true
    window.addEventListener('error', (event) => {
        if (!CONFIG.enableTracking) return;
        if (Math.random() > CONFIG.sampleRate) return;

        const message = event.message || '';
        const source = event.filename || '';
        
        // Ignorer erreurs sans message ou avec message vide
        if (!message || message.trim() === '' || message === 'Erreur inconnue') {
            return;
        }
        
        // Ignorer erreurs provenant d'extensions ou sources externes
        if (source && (
            source.startsWith('chrome-extension://') ||
            source.startsWith('moz-extension://') ||
            source.startsWith('safari-extension://') ||
            source.includes('extension')
        )) {
            return;
        }

        // Ignorer Extensions navigateur et autres patterns
        if (shouldIgnoreError(message, source)) {
            return;
        }

        // Extraire infos détaillées
        const errorInfo = extractErrorInfo(event);
        
        const errorData = {
            type: 'critical',
            source: source || 'unknown',
            message: message || 'Erreur inconnue',
            stack: event.error?.stack || '',
            userId: window.currentUser?.id || null,
            userEmail: window.currentUser?.email || null,
            metadata: {
                lineno: event.lineno,
                colno: event.colno,
                errorType: event.error?.name || 'Error',
                fixSuggestion: errorInfo.suggestion,
                elementMissing: errorInfo.element,
                functionName: errorInfo.function,
                canAutoFix: errorInfo.canAutoFix
            }
        };

        // Logger dans console native (pas la version overridée)
        const originalError = console.__originalError || console.error;
        originalError('🔴 [TRACKER] ERREUR CRITIQUE:', errorData);

        logError(errorData);
    }, true); // useCapture = true pour capturer AVANT les filtres

    // ================================================================
    // 2. CAPTURE DES PROMISES REJETÉES
    // ================================================================
    window.addEventListener('unhandledrejection', (event) => {
        if (!CONFIG.enableTracking) return;
        if (Math.random() > CONFIG.sampleRate) return;

        const message = event.reason?.message || String(event.reason) || 'Promise rejetée';
        
        if (shouldIgnoreError(message, '')) {
            return;
        }

        const errorData = {
            type: 'warning',
            source: 'unhandled-promise',
            message: message,
            stack: event.reason?.stack || '',
            userId: window.currentUser?.id || null,
            userEmail: window.currentUser?.email || null,
            metadata: {
                reason: String(event.reason)
            }
        };

        const originalWarn = console.__originalWarn || console.warn;
        originalWarn('⚠️ [TRACKER] PROMISE REJETÉE:', errorData);

        logError(errorData);
    }, true);

    // ================================================================
    // 3. CAPTURE DES CONSOLE.ERROR (OVERRIDE)
    // ================================================================
    // Sauvegarder console.error original
    console.__originalError = console.error;
    console.__originalWarn = console.warn;

    console.error = function(...args) {
        const message = args.join(' ');
        
        // Ne pas tracker ni afficher si erreur ignorée
        if (!shouldIgnoreError(message, '')) {
            // Envoyer au tracker
            const errorData = {
                type: 'critical',
                source: 'console.error',
                message: message,
                stack: new Error().stack,
                userId: window.currentUser?.id || null,
                userEmail: window.currentUser?.email || null,
                metadata: {
                    args: args.map(a => String(a)).slice(0, 5)
                }
            };

            logError(errorData);
            
            // Appeler console.error original uniquement si pas ignoré
            console.__originalError.apply(console, args);
        }
    };

    console.warn = function(...args) {
        const message = args.join(' ');
        
        // Tracker les warnings importants
        if (message.includes('❌') || message.includes('⚠️') || message.includes('Erreur')) {
            if (!shouldIgnoreError(message, '')) {
                const errorData = {
                    type: 'warning',
                    source: 'console.warn',
                    message: message,
                    stack: '',
                    userId: window.currentUser?.id || null,
                    userEmail: window.currentUser?.email || null,
                    metadata: {}
                };

                logError(errorData);
            }
        }

        // Appeler console.warn original
        console.__originalWarn.apply(console, args);
    };

    // ================================================================
    // 4. CAPTURE DES FETCH ERRORS (OVERRIDE)
    // ================================================================
    const originalFetch = window.fetch;
    window.fetch = async function(...args) {
        try {
            const response = await originalFetch.apply(this, args);
            
            // Logger les erreurs HTTP (400, 500, etc.)
            if (!response.ok && response.status >= 400) {
                const url = typeof args[0] === 'string' ? args[0] : args[0]?.url || 'unknown';
                
                // Ignorer les erreurs liées aux colonnes manquantes (migrations SQL non exécutées)
                if (shouldIgnoreError(url, '') || 
                    url.includes('validation_status') || 
                    url.includes('monitoring_start') ||
                    url.includes('resolution_method')) {
                    return response;
                }
                
                // Ignorer les 404 sur tables Supabase non encore déployées
                if (url.includes('referral_notifications')) {
                    return response;
                }
                
                // Ignorer les erreurs sur les proxies CORS (normales en dev/fallback)
                if (url.includes('cors-proxy') || 
                    url.includes('allorigins.win') || 
                    url.includes('corsproxy.io') || 
                    url.includes('codetabs.com')) {
                    return response;
                }

                // Ignorer les erreurs de l'endpoint send-email (non bloquant)
                if (url.includes('/api/send-email') || url.includes('send-email')) {
                    return response;
                }
                
                // Ne logger que les erreurs importantes (pas 404 sur assets)
                if (response.status >= 500 || (response.status >= 400 && !url.includes('.css') && !url.includes('.js'))) {
                    const errorData = {
                        type: response.status >= 500 ? 'critical' : 'warning',
                        source: 'fetch',
                        message: `HTTP ${response.status} - ${url}`,
                        stack: '',
                        userId: window.currentUser?.id || null,
                        userEmail: window.currentUser?.email || null,
                        metadata: {
                            status: response.status,
                            statusText: response.statusText,
                            url: url
                        }
                    };

                    logError(errorData);
                }
            }
            
            return response;
        } catch (error) {
            // Erreur réseau ou autre
            const url = typeof args[0] === 'string' ? args[0] : args[0]?.url || 'unknown';
            
            // Ne PAS logger les erreurs réseau temporaires
            if (!shouldIgnoreError(error.message, '')) {
                const errorData = {
                    type: 'critical',
                    source: 'fetch-exception',
                    message: `Fetch failed: ${error.message} - ${url}`,
                    stack: error.stack || '',
                    userId: window.currentUser?.id || null,
                    userEmail: window.currentUser?.email || null,
                    metadata: {
                        url: url,
                        errorMessage: error.message
                    }
                };

                logError(errorData);
            }
            
            throw error; // Re-throw pour ne pas casser le code
        }
    };

    // ================================================================
    // FONCTIONS UTILITAIRES
    // ================================================================
    
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

    // ================================================================
    // API PUBLIQUE - LOGGING MANUEL
    // ================================================================
    
    window.logCriticalError = function(message, metadata = {}) {
        const errorData = {
            type: 'critical',
            source: 'manual',
            message: message,
            stack: new Error().stack,
            userId: window.currentUser?.id || null,
            userEmail: window.currentUser?.email || null,
            metadata: metadata
        };

        logError(errorData);
    };

    window.logWarning = function(message, metadata = {}) {
        const errorData = {
            type: 'warning',
            source: 'manual',
            message: message,
            stack: '',
            userId: window.currentUser?.id || null,
            userEmail: window.currentUser?.email || null,
            metadata: metadata
        };

        logError(errorData);
    };

    // Export pour debugging
    window.errorTracker = {
        logError: logError,
        config: CONFIG
    };

    const originalLog = console.log;
    // Error Tracker initialisé
})();
