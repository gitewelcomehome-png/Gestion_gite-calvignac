/**
 * 🛡️ RATE LIMITER - Protection Anti-Spam
 * ========================================
 * Date: 7 janvier 2026
 * Objectif: Limiter le nombre de requêtes par utilisateur
 * Protection: Formulaires, API calls, actions sensibles
 */

class RateLimiter {
    constructor(options = {}) {
        this.options = {
            maxAttempts: options.maxAttempts || 5,        // Nombre max de tentatives
            windowMs: options.windowMs || 60000,          // Fenêtre temporelle (1 min par défaut)
            blockDurationMs: options.blockDurationMs || 300000, // Durée de blocage (5 min)
            storageKey: options.storageKey || 'rate_limiter',
            persistInStorage: options.persistInStorage !== false
        };
        
        // Map des tentatives : key -> [timestamps]
        this.attempts = new Map();
        this.blockedUntil = new Map();
        
        // Charger depuis localStorage si persistance activée
        if (this.options.persistInStorage) {
            this.loadFromStorage();
        }
        
        // Nettoyer périodiquement
        this.startCleanupInterval();
    }
    
    /**
     * Vérifier si une action peut être effectuée
     */
    canAttempt(key) {
        const now = Date.now();
        
        // Vérifier si bloqué
        const blockedUntil = this.blockedUntil.get(key);
        if (blockedUntil && now < blockedUntil) {
            const remainingSeconds = Math.ceil((blockedUntil - now) / 1000);
            return {
                allowed: false,
                reason: 'blocked',
                retryAfter: remainingSeconds,
                message: `Trop de tentatives. Réessayez dans ${remainingSeconds} secondes.`
            };
        }
        
        // Nettoyer les anciennes tentatives
        const userAttempts = this.attempts.get(key) || [];
        const recentAttempts = userAttempts.filter(
            time => now - time < this.options.windowMs
        );
        
        // Vérifier limite atteinte
        if (recentAttempts.length >= this.options.maxAttempts) {
            // Bloquer l'utilisateur
            const blockUntil = now + this.options.blockDurationMs;
            this.blockedUntil.set(key, blockUntil);
            this.saveToStorage();
            
            const blockSeconds = Math.ceil(this.options.blockDurationMs / 1000);
            return {
                allowed: false,
                reason: 'limit_exceeded',
                retryAfter: blockSeconds,
                message: `Limite de ${this.options.maxAttempts} tentatives atteinte. Veuillez patienter ${blockSeconds} secondes.`
            };
        }
        
        // Enregistrer la tentative
        recentAttempts.push(now);
        this.attempts.set(key, recentAttempts);
        this.saveToStorage();
        
        return {
            allowed: true,
            remaining: this.options.maxAttempts - recentAttempts.length
        };
    }
    
    /**
     * Enregistrer une tentative (alias de canAttempt pour compatibilité)
     */
    attempt(key) {
        const result = this.canAttempt(key);
        return result.allowed;
    }
    
    /**
     * Réinitialiser le compteur pour une clé
     */
    reset(key) {
        this.attempts.delete(key);
        this.blockedUntil.delete(key);
        this.saveToStorage();
    }
    
    /**
     * Réinitialiser tous les compteurs
     */
    resetAll() {
        this.attempts.clear();
        this.blockedUntil.clear();
        this.saveToStorage();
    }
    
    /**
     * Obtenir le statut pour une clé
     */
    getStatus(key) {
        const now = Date.now();
        const blockedUntil = this.blockedUntil.get(key);
        
        if (blockedUntil && now < blockedUntil) {
            return {
                blocked: true,
                retryAfter: Math.ceil((blockedUntil - now) / 1000)
            };
        }
        
        const userAttempts = this.attempts.get(key) || [];
        const recentAttempts = userAttempts.filter(
            time => now - time < this.options.windowMs
        );
        
        return {
            blocked: false,
            attempts: recentAttempts.length,
            remaining: this.options.maxAttempts - recentAttempts.length
        };
    }
    
    /**
     * Sauvegarder dans localStorage
     */
    saveToStorage() {
        if (!this.options.persistInStorage) return;
        
        try {
            const data = {
                attempts: Array.from(this.attempts.entries()),
                blockedUntil: Array.from(this.blockedUntil.entries())
            };
            localStorage.setItem(this.options.storageKey, JSON.stringify(data));
        } catch (error) {
            console.error('Erreur sauvegarde rate limiter:', error);
        }
    }
    
    /**
     * Charger depuis localStorage
     */
    loadFromStorage() {
        try {
            const data = localStorage.getItem(this.options.storageKey);
            if (data) {
                const parsed = JSON.parse(data);
                this.attempts = new Map(parsed.attempts || []);
                this.blockedUntil = new Map(parsed.blockedUntil || []);
            }
        } catch (error) {
            console.error('Erreur chargement rate limiter:', error);
        }
    }
    
    /**
     * Nettoyer les anciennes entrées périodiquement
     */
    startCleanupInterval() {
        setInterval(() => {
            this.cleanup();
        }, 60000); // Toutes les minutes
    }
    
    /**
     * Nettoyer les anciennes tentatives
     */
    cleanup() {
        const now = Date.now();
        
        // Nettoyer attempts
        for (const [key, attempts] of this.attempts.entries()) {
            const recentAttempts = attempts.filter(
                time => now - time < this.options.windowMs
            );
            
            if (recentAttempts.length === 0) {
                this.attempts.delete(key);
            } else {
                this.attempts.set(key, recentAttempts);
            }
        }
        
        // Nettoyer blockedUntil
        for (const [key, until] of this.blockedUntil.entries()) {
            if (now >= until) {
                this.blockedUntil.delete(key);
            }
        }
        
        this.saveToStorage();
    }
}

// ================================================================
// RATE LIMITERS PRÉCONFIGURÉS
// ================================================================

// Rate limiter pour connexion (5 tentatives / 5 min)
window.loginLimiter = new RateLimiter({
    maxAttempts: 5,
    windowMs: 300000,      // 5 minutes
    blockDurationMs: 900000, // 15 minutes de blocage
    storageKey: 'rate_limiter_login'
});

// Rate limiter pour formulaires (10 soumissions / 1 min)
window.formLimiter = new RateLimiter({
    maxAttempts: 10,
    windowMs: 60000,       // 1 minute
    blockDurationMs: 180000, // 3 minutes de blocage
    storageKey: 'rate_limiter_forms'
});

// Rate limiter pour API calls (20 appels / 1 min)
window.apiLimiter = new RateLimiter({
    maxAttempts: 20,
    windowMs: 60000,       // 1 minute
    blockDurationMs: 60000, // 1 minute de blocage
    storageKey: 'rate_limiter_api'
});

// Rate limiter pour actions sensibles (3 tentatives / 10 min)
window.sensitiveActionLimiter = new RateLimiter({
    maxAttempts: 3,
    windowMs: 600000,      // 10 minutes
    blockDurationMs: 1800000, // 30 minutes de blocage
    storageKey: 'rate_limiter_sensitive'
});

// Exporter la classe pour instanciation custom
window.RateLimiter = RateLimiter;

// ================================================================
// HELPER FUNCTIONS
// ================================================================

/**
 * Wrapper pour protéger une fonction avec rate limiting
 */
function withRateLimit(limiter, key, fn) {
    return async function(...args) {
        const check = limiter.canAttempt(key);
        
        if (!check.allowed) {
            // Afficher message d'erreur
            if (window.showError) {
                window.showError(check.message);
            } else {
                alert(check.message);
            }
            
            // Logger si logger disponible
            if (window.logger) {
                window.logger.warn('Rate limit atteint', {
                    key,
                    reason: check.reason,
                    retryAfter: check.retryAfter
                });
            }
            
            return null;
        }
        
        // Exécuter la fonction
        return await fn.apply(this, args);
    };
}

window.withRateLimit = withRateLimit;

// ================================================================
// EXEMPLES D'UTILISATION
// ================================================================

/*
// ===== EXEMPLE 1: Login =====
async function handleLogin(email, password) {
    const check = window.loginLimiter.canAttempt(email);
    
    if (!check.allowed) {
        alert(check.message);
        return;
    }
    
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });
        
        if (error) throw error;
        
        // Succès: réinitialiser le compteur
        window.loginLimiter.reset(email);
        
        // Rediriger
        window.location.href = '/index.html';
    } catch (error) {
        showError('Email ou mot de passe incorrect');
    }
}

// ===== EXEMPLE 2: Formulaire =====
document.getElementById('myForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formId = 'contact-form';
    const check = window.formLimiter.canAttempt(formId);
    
    if (!check.allowed) {
        showError(check.message);
        return;
    }
    
    // Soumettre le formulaire
    try {
        await submitForm();
        showSuccess('Formulaire envoyé avec succès');
    } catch (error) {
        showError('Erreur lors de l\'envoi');
    }
});

// ===== EXEMPLE 3: API Call avec wrapper =====
const saveData = withRateLimit(
    window.apiLimiter,
    'save-reservation',
    async function(data) {
        const { error } = await supabase
            .from('reservations')
            .insert(data);
        
        if (error) throw error;
        return true;
    }
);

// Utilisation
await saveData({ nom: 'Dupont', ... });

// ===== EXEMPLE 4: Action sensible (suppression) =====
async function deleteReservation(id) {
    const userId = await getCurrentUserId();
    const key = `delete-${userId}`;
    
    const check = window.sensitiveActionLimiter.canAttempt(key);
    
    if (!check.allowed) {
        alert(check.message);
        return;
    }
    
    // Demander confirmation
    if (!confirm('Êtes-vous sûr ?')) {
        // Ne pas compter comme tentative si annulé
        window.sensitiveActionLimiter.reset(key);
        return;
    }
    
    // Supprimer
    await supabase.from('reservations').delete().eq('id', id);
}

// ===== EXEMPLE 5: Vérifier statut =====
const status = window.loginLimiter.getStatus('user@example.com');
// console.log(`Tentatives: ${status.attempts}, Restantes: ${status.remaining}`);

if (status.blocked) {
    // console.log(`Bloqué pendant ${status.retryAfter} secondes`);
}

// ===== EXEMPLE 6: Réinitialiser manuellement =====
// Après succès
window.loginLimiter.reset('user@example.com');

// Tout réinitialiser (admin uniquement)
window.loginLimiter.resetAll();
*/

// ================================================================
// INTÉGRATION AVEC FORMULAIRES EXISTANTS
// ================================================================

/**
 * Ajouter rate limiting automatique à tous les formulaires
 */
function initFormRateLimiting() {
    document.querySelectorAll('form[data-rate-limit]').forEach(form => {
        const formId = form.id || form.dataset.rateLimit;
        const originalHandler = form.onsubmit;
        
        form.onsubmit = function(e) {
            const check = window.formLimiter.canAttempt(formId);
            
            if (!check.allowed) {
                e.preventDefault();
                if (window.showError) {
                    window.showError(check.message);
                } else {
                    alert(check.message);
                }
                return false;
            }
            
            // Exécuter handler original si existe
            if (originalHandler) {
                return originalHandler.call(this, e);
            }
        };
    });
}

// Initialiser au chargement
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFormRateLimiting);
} else {
    initFormRateLimiting();
}
