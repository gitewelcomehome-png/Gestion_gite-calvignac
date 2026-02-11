// ================================================================
// 🧪 AUTO-VALIDATOR - Validation automatique des corrections
// ================================================================
// Système de validation en 2 phases :
// 1. Tests immédiats (unitaires)
// 2. Monitoring progressif (24-48h)
// ================================================================

class AutoValidator {
    constructor() {
        this.pendingValidations = new Map();
        this.monitoringInterval = null;
        this.config = {
            immediateTestTimeout: 5000,      // 5 secondes pour tests immédiats
            monitoringDuration: 24 * 60 * 60 * 1000, // 24h de monitoring
            recheckInterval: 60 * 60 * 1000, // Vérifier toutes les heures
            autoResolveThreshold: 24 * 60 * 60 * 1000 // Auto-résoudre après 24h sans erreur
        };
    }

    /**
     * Initialiser le système de validation
     */
    async init() {
        // Reprendre les validations en cours
        await this.resumePendingValidations();
        
        // Démarrer le monitoring continu
        this.startContinuousMonitoring();
        
        // Auto-Validator prêt
    }

    /**
     * MODE 1 : Validation Immédiate
     * Execute des tests unitaires juste après correction
     */
    async validateImmediately(errorId, testConfig) {
        console.log(`🧪 Test immédiat pour erreur #${errorId}...`);
        
        try {
            const result = await this.executeTest(testConfig);
            
            if (result.success) {
                // ✅ Test passé - Marquer comme "test_passed"
                await this.markTestPassed(errorId);
                
                // Lancer le monitoring progressif
                await this.startProgressiveMonitoring(errorId);
                
                return {
                    success: true,
                    message: 'Test immédiat réussi, monitoring lancé',
                    details: result
                };
            } else {
                // ❌ Test échoué - Ne pas résoudre
                await this.markTestFailed(errorId, result.error);
                
                return {
                    success: false,
                    message: 'Test immédiat échoué',
                    error: result.error
                };
            }
        } catch (err) {
            console.error('❌ Erreur validation immédiate:', err);
            return {
                success: false,
                message: 'Erreur lors du test',
                error: err.message
            };
        }
    }

    /**
     * Exécuter un test
     */
    async executeTest(testConfig) {
        return new Promise((resolve) => {
            const timeout = setTimeout(() => {
                resolve({
                    success: false,
                    error: 'Timeout dépassé'
                });
            }, this.config.immediateTestTimeout);

            try {
                // Créer une fonction de test depuis la config
                const testFunction = new Function('return ' + testConfig.testCode)();
                
                // Exécuter le test
                const result = testFunction();
                
                clearTimeout(timeout);
                
                if (result instanceof Promise) {
                    result
                        .then(() => resolve({ success: true }))
                        .catch((err) => resolve({ success: false, error: err.message }));
                } else {
                    resolve({ success: true });
                }
            } catch (err) {
                clearTimeout(timeout);
                resolve({
                    success: false,
                    error: err.message
                });
            }
        });
    }

    /**
     * MODE 2 : Validation Progressive (Monitoring)
     * Observe si l'erreur réapparaît pendant 24h
     */
    async startProgressiveMonitoring(errorId) {
        const monitoringStart = Date.now();
        
        // Récupérer les détails de l'erreur pour la signature
        const { data: error } = await window.supabaseClient
            .from('cm_error_logs')
            .select('*')
            .eq('id', errorId)
            .single();
        
        if (!error) return;
        
        const signature = this.generateErrorSignature(error);
        
        // Enregistrer dans le tracking
        this.pendingValidations.set(errorId, {
            errorId,
            signature,
            startTime: monitoringStart,
            lastCheck: monitoringStart,
            reoccurrences: 0,
            status: 'monitoring'
        });
        
        // Sauvegarder en BDD
        await window.supabaseClient
            .from('cm_error_logs')
            .update({
                validation_status: 'monitoring',
                monitoring_start: new Date(monitoringStart).toISOString(),
                metadata: {
                    ...error.metadata,
                    validation: {
                        test_immediate_passed: true,
                        monitoring_duration: this.config.monitoringDuration,
                        started_at: new Date().toISOString()
                    }
                }
            })
            .eq('id', errorId);
        
        console.log(`📊 Monitoring progressif lancé pour erreur #${errorId} (24h)`);
    }

    /**
     * Monitoring continu en arrière-plan
     */
    startContinuousMonitoring() {
        // Vérifier toutes les heures
        this.monitoringInterval = setInterval(async () => {
            await this.checkAllMonitorings();
        }, this.config.recheckInterval);
        
        // Vérifier aussi au démarrage
        this.checkAllMonitorings();
    }

    /**
     * Vérifier tous les monitorings en cours
     */
    async checkAllMonitorings() {
        const now = Date.now();
        
        for (const [errorId, monitoring] of this.pendingValidations.entries()) {
            const elapsed = now - monitoring.startTime;
            
            // Vérifier si l'erreur a réapparu
            const hasReoccurred = await this.checkReoccurrence(monitoring.signature, monitoring.lastCheck);
            
            if (hasReoccurred) {
                // ❌ Erreur réapparue - Échec de validation
                await this.handleValidationFailed(errorId);
                this.pendingValidations.delete(errorId);
            } else if (elapsed >= this.config.autoResolveThreshold) {
                // ✅ 24h passées sans erreur - AUTO-RÉSOUDRE
                await this.handleValidationSuccess(errorId);
                this.pendingValidations.delete(errorId);
            } else {
                // ⏳ Continuer le monitoring
                monitoring.lastCheck = now;
                console.log(`⏳ Monitoring erreur #${errorId}: ${Math.round(elapsed/1000/60/60)}h / 24h`);
            }
        }
    }

    /**
     * Vérifier si une erreur a réapparu
     */
    async checkReoccurrence(signature, since) {
        try {
            const { data: recentErrors, error } = await window.supabaseClient
                .from('cm_error_logs')
                .select('*')
                .gte('timestamp', new Date(since).toISOString())
                .eq('resolved', false)
                .limit(100);
            
            if (error) throw error;
            
            // Vérifier si une erreur correspond à la signature
            const hasMatch = recentErrors?.some(err => {
                const errSignature = this.generateErrorSignature(err);
                return errSignature === signature;
            });
            
            return hasMatch;
        } catch (err) {
            console.error('❌ Erreur check reoccurrence:', err);
            return false;
        }
    }

    /**
     * Générer une signature unique pour une erreur
     */
    generateErrorSignature(error) {
        return `${error.source}|${error.message}|${error.metadata?.lineno || 'N/A'}`;
    }

    /**
     * Marquer test immédiat réussi
     */
    async markTestPassed(errorId) {
        await window.supabaseClient
            .from('cm_error_logs')
            .update({
                validation_status: 'test_passed',
                metadata: {
                    validation: {
                        test_immediate_passed: true,
                        tested_at: new Date().toISOString()
                    }
                }
            })
            .eq('id', errorId);
    }

    /**
     * Marquer test immédiat échoué
     */
    async markTestFailed(errorId, errorDetails) {
        await window.supabaseClient
            .from('cm_error_logs')
            .update({
                validation_status: 'test_failed',
                metadata: {
                    validation: {
                        test_immediate_passed: false,
                        tested_at: new Date().toISOString(),
                        test_error: errorDetails
                    }
                }
            })
            .eq('id', errorId);
    }

    /**
     * Validation réussie - AUTO-RÉSOUDRE
     */
    async handleValidationSuccess(errorId) {
        try {
            const { error } = await window.supabaseClient
                .from('cm_error_logs')
                .update({
                    resolved: true,
                    resolved_at: new Date().toISOString(),
                    validation_status: 'auto_resolved',
                    resolution_method: 'auto_validation'
                })
                .eq('id', errorId);
            
            if (error) throw error;
            
            console.log(`✅ Erreur #${errorId} AUTO-RÉSOLUE (validation 24h réussie)`);
            
            // Notification
            this.showNotification({
                type: 'success',
                title: '✅ Erreur auto-résolue',
                message: `L'erreur #${errorId} n'est pas réapparue en 24h. Marquée comme résolue.`
            });
            
            return true;
        } catch (err) {
            console.error('❌ Erreur marking resolved:', err);
            return false;
        }
    }

    /**
     * Validation échouée - Erreur réapparue
     */
    async handleValidationFailed(errorId) {
        await window.supabaseClient
            .from('cm_error_logs')
            .update({
                validation_status: 'validation_failed',
                metadata: {
                    validation: {
                        failed_at: new Date().toISOString(),
                        reason: 'Error reoccurred during monitoring period'
                    }
                }
            })
            .eq('id', errorId);
        
        console.warn(`⚠️ Erreur #${errorId} - Validation échouée (réapparition détectée)`);
        
        this.showNotification({
            type: 'warning',
            title: '⚠️ Validation échouée',
            message: `L'erreur #${errorId} est réapparue. Correction à revoir.`
        });
    }

    /**
     * Reprendre les validations en cours (après rechargement page)
     * Feature désactivée - colonne validation_status non présente
     */
    async resumePendingValidations() {
        // Feature désactivée - pas de persistance des validations
        return;
    }

    /**
     * Afficher une notification
     */
    showNotification({ type, title, message }) {
        // Utiliser le système de notification existant si disponible
        if (window.NotificationSystem) {
            window.NotificationSystem.show(type, title, message);
        } else {
            console.log(`[${type.toUpperCase()}] ${title}: ${message}`);
        }
    }

    /**
     * Nettoyer (appelé lors de la fermeture)
     */
    destroy() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
        }
    }
}

// ================================================================
// EXPORT ET INITIALISATION GLOBALE
// ================================================================

window.AutoValidator = AutoValidator;

// Auto-initialisation si Supabase disponible
if (window.supabaseClient) {
    window.autoValidatorInstance = new AutoValidator();
    window.autoValidatorInstance.init();
}
