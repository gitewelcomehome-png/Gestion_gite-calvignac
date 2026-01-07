/**
 * 📊 ERROR LOGGER - Logging Centralisé Production
 * ================================================
 * Date: 7 janvier 2026
 * Objectif: Remplacer console.error par un système de logging centralisé
 * Service: Compatible Sentry, LogRocket, ou custom endpoint
 */

class ErrorLogger {
    constructor(config = {}) {
        this.config = {
            environment: config.environment || 'production',
            serviceName: config.serviceName || 'gestion-gite-calvignac',
            enabled: config.enabled !== false,
            // Service externe (Sentry, LogRocket, etc.)
            serviceUrl: config.serviceUrl || null,
            serviceKey: config.serviceKey || null,
            // Filtres
            logToConsole: config.logToConsole || false,
            maxQueueSize: config.maxQueueSize || 100,
            flushInterval: config.flushInterval || 5000 // 5 secondes
        };
        
        this.queue = [];
        this.userId = null;
        this.sessionId = this.generateSessionId();
        
        // Démarrer flush automatique
        if (this.config.enabled) {
            this.startAutoFlush();
        }
    }
    
    /**
     * Générer un ID de session unique
     */
    generateSessionId() {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    
    /**
     * Définir l'utilisateur actuel
     */
    setUser(userId, userEmail = null) {
        this.userId = userId;
        this.userEmail = userEmail;
    }
    
    /**
     * Logger une erreur
     */
    error(message, error = null, context = {}) {
        this.log('error', message, error, context);
    }
    
    /**
     * Logger un warning
     */
    warn(message, context = {}) {
        this.log('warn', message, null, context);
    }
    
    /**
     * Logger une info
     */
    info(message, context = {}) {
        this.log('info', message, null, context);
    }
    
    /**
     * Méthode principale de logging
     */
    log(level, message, error = null, context = {}) {
        if (!this.config.enabled) {
            return;
        }
        
        const logEntry = {
            level,
            message,
            error: error ? this.sanitizeError(error) : null,
            context: this.sanitizeContext(context),
            userId: this.userId,
            userEmail: this.userEmail,
            sessionId: this.sessionId,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href,
            environment: this.config.environment
        };
        
        // Log console en développement
        if (this.config.logToConsole || this.config.environment !== 'production') {
            this.logToConsoleFormatted(logEntry);
        }
        
        // Ajouter à la queue
        this.queue.push(logEntry);
        
        // Flush si queue pleine
        if (this.queue.length >= this.config.maxQueueSize) {
            this.flush();
        }
    }
    
    /**
     * Sanitiser l'objet Error
     */
    sanitizeError(error) {
        if (!error) return null;
        
        return {
            message: error.message || String(error),
            name: error.name,
            stack: error.stack ? error.stack.substring(0, 1000) : null, // Limiter la stack
            code: error.code,
            // Nettoyer les données sensibles
            ...(error.details && typeof error.details === 'object' 
                ? { details: this.sanitizeContext(error.details) } 
                : {})
        };
    }
    
    /**
     * Sanitiser le contexte (enlever données sensibles)
     */
    sanitizeContext(context) {
        if (!context || typeof context !== 'object') {
            return context;
        }
        
        const sensitiveKeys = [
            'password', 'token', 'apiKey', 'secret', 
            'creditCard', 'ssn', 'authorization'
        ];
        
        const sanitized = {};
        for (const [key, value] of Object.entries(context)) {
            const keyLower = key.toLowerCase();
            const isSensitive = sensitiveKeys.some(sk => keyLower.includes(sk));
            
            if (isSensitive) {
                sanitized[key] = '[REDACTED]';
            } else if (value && typeof value === 'object') {
                sanitized[key] = this.sanitizeContext(value);
            } else {
                sanitized[key] = value;
            }
        }
        
        return sanitized;
    }
    
    /**
     * Logger dans la console de manière formatée
     */
    logToConsoleFormatted(logEntry) {
        const style = {
            error: 'color: #E74C3C; font-weight: bold;',
            warn: 'color: #F39C12; font-weight: bold;',
            info: 'color: #3498DB; font-weight: bold;'
        };
        
        console.log(
            `%c[${logEntry.level.toUpperCase()}] ${logEntry.message}`,
            style[logEntry.level] || '',
            {
                error: logEntry.error,
                context: logEntry.context,
                timestamp: logEntry.timestamp
            }
        );
    }
    
    /**
     * Envoyer les logs au service externe
     */
    async flush() {
        if (this.queue.length === 0) {
            return;
        }
        
        const logsToSend = [...this.queue];
        this.queue = [];
        
        // Si pas de service configuré, juste vider la queue
        if (!this.config.serviceUrl) {
            return;
        }
        
        try {
            await fetch(this.config.serviceUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(this.config.serviceKey 
                        ? { 'Authorization': `Bearer ${this.config.serviceKey}` }
                        : {})
                },
                body: JSON.stringify({
                    service: this.config.serviceName,
                    logs: logsToSend
                })
            });
        } catch (error) {
            // Si échec, remettre dans la queue
            this.queue.unshift(...logsToSend);
            
            // Log l'erreur en console uniquement
            if (this.config.logToConsole) {
                console.error('❌ Échec envoi logs:', error);
            }
        }
    }
    
    /**
     * Démarrer le flush automatique
     */
    startAutoFlush() {
        setInterval(() => {
            this.flush();
        }, this.config.flushInterval);
        
        // Flush avant fermeture page
        window.addEventListener('beforeunload', () => {
            this.flush();
        });
    }
    
    /**
     * Capturer les erreurs globales non gérées
     */
    captureGlobalErrors() {
        window.addEventListener('error', (event) => {
            this.error('Erreur globale non gérée', event.error, {
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno
            });
        });
        
        window.addEventListener('unhandledrejection', (event) => {
            this.error('Promise rejetée non gérée', event.reason, {
                promise: event.promise
            });
        });
    }
}

// ================================================================
// INTÉGRATION SENTRY (Optionnel)
// ================================================================

/**
 * Configuration Sentry pour logging avancé
 * Installation: npm install @sentry/browser
 */
class SentryLogger extends ErrorLogger {
    constructor(config) {
        super(config);
        
        // Vérifier si Sentry est disponible
        if (window.Sentry) {
            this.initSentry(config.sentryDsn);
        }
    }
    
    initSentry(dsn) {
        window.Sentry.init({
            dsn: dsn,
            environment: this.config.environment,
            release: this.config.version || '1.0.0',
            
            // Filtrer données sensibles
            beforeSend(event, hint) {
                // Nettoyer cookies et headers
                if (event.request) {
                    delete event.request.cookies;
                    if (event.request.headers) {
                        delete event.request.headers['Authorization'];
                        delete event.request.headers['Cookie'];
                    }
                }
                
                return event;
            },
            
            // Traces de performance (optionnel)
            tracesSampleRate: 0.1, // 10% des requêtes
            
            // Ignorer certaines erreurs
            ignoreErrors: [
                'ResizeObserver loop limit exceeded',
                'Non-Error promise rejection captured'
            ]
        });
    }
    
    log(level, message, error, context) {
        // Logger dans Sentry si disponible
        if (window.Sentry) {
            if (level === 'error' && error) {
                window.Sentry.captureException(error, {
                    tags: { custom: true },
                    contexts: { custom: this.sanitizeContext(context) },
                    level: 'error'
                });
            } else {
                window.Sentry.captureMessage(message, {
                    level: level,
                    contexts: { custom: this.sanitizeContext(context) }
                });
            }
        }
        
        // Logger aussi avec ErrorLogger standard
        super.log(level, message, error, context);
    }
}

// ================================================================
// EXPORT
// ================================================================

// Créer instance globale
if (!window.logger) {
    // Configuration par défaut
    const loggerConfig = {
        environment: window.location.hostname === 'localhost' ? 'development' : 'production',
        serviceName: 'gestion-gite-calvignac',
        enabled: true,
        logToConsole: window.location.hostname === 'localhost',
        // À configurer avec vos credentials Sentry
        // serviceUrl: 'https://o123456.ingest.sentry.io/api/789/store/',
        // serviceKey: 'your-sentry-dsn'
    };
    
    // Utiliser SentryLogger si Sentry chargé, sinon ErrorLogger
    window.logger = window.Sentry 
        ? new SentryLogger(loggerConfig)
        : new ErrorLogger(loggerConfig);
    
    // Capturer erreurs globales
    window.logger.captureGlobalErrors();
}

// Exporter pour utilisation dans modules
window.ErrorLogger = ErrorLogger;
window.SentryLogger = SentryLogger;

// ================================================================
// EXEMPLES D'UTILISATION
// ================================================================

/*
// 1. Logger une erreur simple
try {
    await saveData();
} catch (error) {
    window.logger.error('Erreur sauvegarde données', error, {
        userId: user.id,
        action: 'save_reservation'
    });
    // Afficher message générique à l'utilisateur
    showError('Une erreur est survenue. Veuillez réessayer.');
}

// 2. Logger un warning
window.logger.warn('Limite de requêtes approchée', {
    remaining: 5,
    userId: user.id
});

// 3. Logger une info
window.logger.info('Utilisateur connecté', {
    userId: user.id,
    email: user.email
});

// 4. Définir l'utilisateur actuel
window.logger.setUser(user.id, user.email);

// 5. Logger avec contexte riche
window.logger.error('Échec synchronisation iCal', error, {
    gite: 'Gîte A',
    url: icalUrl,
    lastSync: lastSyncDate,
    attempt: 3
});

// 6. Forcer l'envoi immédiat
await window.logger.flush();
*/
