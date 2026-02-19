// ================================================================
// GESTIONNAIRE D'AUTHENTIFICATION - Phase 1 Sécurité
// Gestion centralisée de l'authentification Supabase
// ================================================================
// Date: 5 janvier 2026
// Utilisation: Inclure dans toutes les pages protégées
// ================================================================

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.userRoles = [];
        this.isRedirecting = false;
        this.authListener = null;
        this.initialSessionHandled = false;
        this.redirectCount = 0;
        this.lastRedirectTime = 0;
        this._initPromise = null; // Cache de la promesse d'initialisation
        this.appUiHiddenByAuth = false;

        // Évite le flash du dashboard avant validation de session
        this.hideProtectedAppUI();
        // N'appelle PAS init() automatiquement - attendre que la page soit prête
    }

    isProtectedAppPage() {
        const path = window.location.pathname || '';
        return path.endsWith('/app.html') || path === '/app.html' || path.endsWith('/app') || path === '/app';
    }

    hideProtectedAppUI() {
        if (!this.isProtectedAppPage()) return;

        document.documentElement.style.visibility = 'hidden';
        this.appUiHiddenByAuth = true;
    }

    showProtectedAppUI() {
        if (!this.appUiHiddenByAuth) return;

        document.documentElement.style.visibility = 'visible';
        this.appUiHiddenByAuth = false;
    }

    async init() {
        // Promise cache: si init déjà en cours, retourner la même promesse
        if (this._initPromise) {
            return this._initPromise;
        }
        
        this._initPromise = (async () => {
            try {
                await this.checkAuthState();
                this.setupAuthListener();
            } catch (error) {
                console.error('Erreur initialisation auth:', error);
                throw error;
            }
        })();
        
        return this._initPromise;
    }

    /**
     * Vérifier l'état d'authentification au chargement
     */
    async checkAuthState() {
        // Pages publiques: pas de vérification
        if (window.location.pathname.includes('login.html') || 
            window.location.pathname.includes('onboarding.html')) {
            return;
        }
        
        try {
            const { data: { session }, error } = await window.supabaseClient.auth.getSession();
            
            if (error) {
                if (window.logger) window.logger.error('Erreur vérification auth', error);
                // ⏳ Attendre 500ms avant de rediriger (la session peut être en cours d'établissement)
                await new Promise(resolve => setTimeout(resolve, 500));
                
                // Réessayer une fois
                const { data: { session: retrySession } } = await window.supabaseClient.auth.getSession();
                if (!retrySession) {
                    this.redirectToLogin();
                    return;
                }
                // Session trouvée au retry
                this.currentUser = retrySession.user;
                await this.loadUserRoles();
                this.showProtectedAppUI();
                this.updateUI();
                
                if (window.emailConfirmationGuard) {
                    await window.emailConfirmationGuard.start();
                }
                return;
            }
            
            if (session && session.user) {
                this.currentUser = session.user;
                await this.loadUserRoles();
                this.showProtectedAppUI();
                this.updateUI();
                
                // 🔒 Démarrer le Email Confirmation Guard
                if (window.emailConfirmationGuard) {
                    await window.emailConfirmationGuard.start();
                }
            } else {
                // ⏳ Pas de session: attendre 500ms avant de rediriger (cas où on vient de se connecter)
                await new Promise(resolve => setTimeout(resolve, 500));
                
                // Réessayer une fois
                const { data: { session: retrySession } } = await window.supabaseClient.auth.getSession();
                if (!retrySession) {
                    this.redirectToLogin();
                    return;
                }
                // Session trouvée au retry
                this.currentUser = retrySession.user;
                await this.loadUserRoles();
                this.showProtectedAppUI();
                this.updateUI();
                
                if (window.emailConfirmationGuard) {
                    await window.emailConfirmationGuard.start();
                }
            }
        } catch (error) {
            if (window.logger) window.logger.error('Erreur checkAuthState', error);
            this.redirectToLogin();
        }
    }

    /**
     * Vérifier si l'utilisateur a terminé l'onboarding
     * NOTE: Architecture simplifiée sans organization_members
     * Chaque user possède directement ses gîtes via owner_user_id
     */
    async checkOnboardingComplete() {
        // Toujours retourner true - pas d'onboarding requis
        // L'utilisateur peut créer ses gîtes directement
        return true;
    }

    /**
     * Charger les rôles de l'utilisateur
     * NOTE: Architecture simplifiée - tous les users sont propriétaires
     */
    async loadUserRoles() {
        // Pas de table organization_members - chaque user est owner
        this.userRoles = ['owner'];
        return ['owner'];
    }

    /**
     * Écouter les changements d'authentification
     */
    setupAuthListener() {
        // Ne pas réinstaller le listener s'il existe déjà
        if (this.authListener) {
            // Listener déjà installé
            return;
        }
        
        // Listener auth installé
        let lastEvent = null;
        let lastEventTime = 0;
        
        const { data } = window.supabaseClient.auth.onAuthStateChange((event, session) => {
            const now = Date.now();
            
            // Ignorer INITIAL_SESSION après le premier chargement
            if (event === 'INITIAL_SESSION' && this.initialSessionHandled) {
                // INITIAL_SESSION ignoré
                return;
            }
            
            if (event === 'INITIAL_SESSION') {
                this.initialSessionHandled = true;
            }
            
            // Ignorer les événements dupliqués dans les 500ms
            if (event === lastEvent && (now - lastEventTime) < 500) {
                // Événement dupliqué ignoré
                return;
            }
            lastEvent = event;
            lastEventTime = now;
            
            // Auth event traité
            
            if (event === 'SIGNED_IN' && session) {
                // SIGNED_IN : seulement traiter si on est sur login.html
                // Sur les autres pages, checkAuthState() gère déjà l'auth
                if (window.location.pathname.includes('login.html')) {
                    this.currentUser = session.user;
                    this.loadUserRoles().then(() => this.onAuthSuccess());
                }
            } else if (event === 'SIGNED_OUT') {
                this.currentUser = null;
                this.userRoles = [];
                // Ne rediriger que si on n'est pas déjà sur login.html
                if (!window.location.pathname.includes('login.html')) {
                    this.redirectToLogin();
                }
            } else if (event === 'TOKEN_REFRESHED') {
                // Token rafraîchi - juste mettre à jour la session
                if (session) {
                    this.currentUser = session.user;
                }
            }
        });
        
        // Sauvegarder pour pouvoir le cleanup plus tard si nécessaire
        this.authListener = data;
    }

    /**
     * Connexion avec email/password
     */
    async login(email, password) {
        try {
            // Vérifier rate limiting
            if (window.loginLimiter) {
                const check = window.loginLimiter.canAttempt(email);
                if (!check.allowed) {
                    return { success: false, error: check.message };
                }
            }
            
            const { data, error } = await window.supabaseClient.auth.signInWithPassword({
                email: email.trim(),
                password: password
            });
            
            if (error) {
                throw new Error(error.message);
            }
            
            this.currentUser = data.user;
            await this.loadUserRoles();
            
            // Succès: réinitialiser le rate limiter
            if (window.loginLimiter) {
                window.loginLimiter.reset(email);
            }
            
            // Définir l'utilisateur dans le logger
            if (window.logger) {
                window.logger.setUser(data.user.id, data.user.email);
            }
            
            this.onAuthSuccess();
            
            return { success: true, data };
        } catch (error) {
            if (window.logger) {
                window.logger.warn('Tentative de connexion échouée', {
                    email: email.trim(),
                    error: error.message
                });
            } else {
                console.error('Erreur login:', error);
            }
            return { success: false, error: error.message };
        }
    }

    /**
     * Déconnexion
     */
    async logout() {
        try {
            const { error } = await window.supabaseClient.auth.signOut();
            if (error) throw error;
            
            this.currentUser = null;
            this.userRoles = [];
            this.redirectToLogin();
        } catch (error) {
            if (window.logger) {
                window.logger.error('Erreur logout', error);
            } else {
                console.error('Erreur logout:', error);
            }
            // Forcer la redirection même en cas d'erreur
            this.redirectToLogin();
        }
    }

    /**
     * Vérifier si l'utilisateur a un rôle spécifique
     */
    hasRole(role) {
        return this.userRoles.includes(role);
    }

    /**
     * Vérifier si l'utilisateur a au moins un des rôles
     */
    hasAnyRole(roles) {
        return roles.some(role => this.userRoles.includes(role));
    }

    /**
     * Obtenir les informations utilisateur
     */
    getUserInfo() {
        if (!this.currentUser) return null;
        
        return {
            id: this.currentUser.id,
            email: this.currentUser.email,
            roles: this.userRoles,
            isOwner: this.hasRole('owner'),
            isCleaner: this.hasRole('cleaner'),
            isAdmin: this.hasRole('admin')
        };
    }

    /**
     * Rediriger vers la page de connexion
     */
    redirectToLogin() {
        if (this.isRedirecting) return;
        
        const now = Date.now();
        if (this.redirectCount >= 3 && (now - this.lastRedirectTime) < 5000) {
            console.error('❌ Boucle de redirection détectée');
            return;
        }
        
        if (window.location.pathname.includes('login.html')) return;
        
        this.redirectCount++;
        this.lastRedirectTime = now;
        this.isRedirecting = true;
        window.location.href = '/pages/login.html';
    }

    /**
     * Actions après authentification réussie
     */
    async onAuthSuccess() {
        const now = Date.now();
        if (this.redirectCount >= 3 && (now - this.lastRedirectTime) < 5000) {
            console.error('❌ Boucle de redirection détectée');
            return;
        }
        
        // Depuis login.html: rediriger vers dashboard
        if (window.location.pathname.includes('login.html') && !this.isRedirecting) {
            this.redirectCount++;
            this.lastRedirectTime = now;
            this.isRedirecting = true;
            
            // Vérifier si c'est la première connexion (compte créé il y a moins de 5 minutes)
            const isFirstLogin = await this.isFirstLogin();
            
            if (isFirstLogin) {
                // Rediriger vers dashboard avec flag pour ouvrir "Gérer mes Gîtes"
                window.location.href = 'app.html?firstLogin=true';
            } else {
                window.location.href = 'app.html';
            }
            return;
        }
        
        // Déjà sur page protégée: juste mettre à jour l'UI
        this.updateUI();
    }
    
    /**
     * Vérifier si c'est la première connexion de l'utilisateur
     */
    async isFirstLogin() {
        if (!this.currentUser) return false;
        
        try {
            const accountCreatedAt = new Date(this.currentUser.created_at).getTime();
            const now = Date.now();
            const fiveMinutes = 5 * 60 * 1000;
            
            // Si le compte a été créé il y a moins de 5 minutes, c'est la première connexion
            return (now - accountCreatedAt) < fiveMinutes;
        } catch (error) {
            console.error('Erreur vérification première connexion:', error);
            return false;
        }
    }

    /**
     * Mettre à jour l'interface avec les infos utilisateur
     */
    updateUI() {
        if (this.currentUser) {
            this.showProtectedAppUI();
        }

        // Afficher l'email dans le header si élément existe
        const userEmailElement = document.getElementById('user-email');
        if (userEmailElement && this.currentUser) {
            userEmailElement.textContent = this.currentUser.email;
        }
        
        // Afficher les rôles si élément existe
        const userRolesElement = document.getElementById('user-roles');
        if (userRolesElement && this.userRoles.length > 0) {
            userRolesElement.textContent = this.userRoles.join(', ');
        }
        
        // 🆕 Mettre à jour le widget utilisateur dans le header
        if (this.currentUser) {
            const userNameElement = document.getElementById('userName');
            const userRoleElement = document.getElementById('userRole');
            
            if (userNameElement) {
                // Extraire le prénom de l'email
                const emailName = this.currentUser.email.split('@')[0];
                const displayName = emailName.charAt(0).toUpperCase() + emailName.slice(1).replace(/[._-]/g, ' ');
                userNameElement.textContent = displayName;
            }
            
            if (userRoleElement) {
                let roleDisplay = '⚠️ Aucun rôle';
                if (this.userRoles && this.userRoles.length > 0) {
                    if (this.userRoles.includes('owner') || this.userRoles.includes('admin')) {
                        roleDisplay = '🔧 Admin';
                    } else if (this.userRoles.includes('cleaner')) {
                        roleDisplay = '👤 User';
                    }
                }
                userRoleElement.textContent = roleDisplay;
            }
        }
        
        // Masquer les fonctionnalités selon les rôles
        this.applyRoleBasedUI();
    }

    /**
     * Appliquer les restrictions UI selon les rôles
     */
    applyRoleBasedUI() {
        // Si cleaner, masquer les onglets financiers
        if (this.hasRole('cleaner') && !this.hasRole('owner')) {
            const financeTabs = document.querySelectorAll('[data-require-role="owner"]');
            financeTabs.forEach(tab => {
                tab.style.display = 'none';
            });
        }
        
        // Afficher un indicateur de rôle
        if (this.hasRole('owner')) {
            document.body.classList.add('role-owner');
        }
        if (this.hasRole('cleaner')) {
            document.body.classList.add('role-cleaner');
        }
        if (this.hasRole('admin')) {
            document.body.classList.add('role-admin');
        }
    }

    /**
     * Vérifier l'accès à une ressource
     */
    canAccess(requiredRole) {
        if (!this.currentUser) return false;
        if (!requiredRole) return true; // Pas de rôle requis
        
        return this.hasRole(requiredRole) || this.hasRole('admin');
    }
}

// ================================================================
// INITIALISATION GLOBALE
// ================================================================

// Créer l'instance globale dès le chargement
if (typeof window.authManager === 'undefined') {
    window.authManager = new AuthManager();
    // Initialiser UNIQUEMENT quand le DOM est prêt
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.authManager.init();
        });
    } else {
        // DOM déjà prêt
        window.authManager.init();
    }
}

// ================================================================
// HELPER FUNCTIONS
// ================================================================

/**
 * Obtenir l'utilisateur courant
 */
function getCurrentUser() {
    return window.authManager?.getUserInfo() || null;
}

/**
 * Vérifier si l'utilisateur a un rôle
 */
function hasRole(role) {
    return window.authManager?.hasRole(role) || false;
}

/**
 * Déconnexion rapide
 */
async function logout() {
    await window.authManager?.logout();
}

// Export pour utilisation
window.getCurrentUser = getCurrentUser;
window.hasRole = hasRole;
window.logout = logout;

// AuthManager chargé
