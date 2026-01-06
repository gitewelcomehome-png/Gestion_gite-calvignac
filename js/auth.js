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
        this.init();
    }

    async init() {
        await this.checkAuthState();
        this.setupAuthListener();
    }

    /**
     * Vérifier l'état d'authentification au chargement
     */
    async checkAuthState() {
        try {
            const { data: { session }, error } = await window.supabaseClient.auth.getSession();
            
            if (error) {
                console.error('Erreur vérification auth:', error);
                this.redirectToLogin();
                return;
            }
            
            if (session && session.user) {
                this.currentUser = session.user;
                await this.loadUserRoles();
                this.onAuthSuccess();
            } else {
                this.redirectToLogin();
            }
        } catch (error) {
            console.error('Erreur checkAuthState:', error);
            this.redirectToLogin();
        }
    }

    /**
     * Charger les rôles de l'utilisateur depuis user_roles
     */
    async loadUserRoles() {
        try {
            const { data, error } = await window.supabaseClient
                .from('user_roles')
                .select('role')
                .eq('user_id', this.currentUser.id);
            
            if (error) {
                console.error('Erreur chargement rôles:', error);
                this.userRoles = [];
                return;
            }
            
            this.userRoles = data ? data.map(r => r.role) : [];
            console.log('✅ Rôles utilisateur:', this.userRoles);
        } catch (error) {
            console.error('Erreur loadUserRoles:', error);
            this.userRoles = [];
        }
    }

    /**
     * Écouter les changements d'authentification
     */
    setupAuthListener() {
        window.supabaseClient.auth.onAuthStateChange((event, session) => {
            console.log('Auth event:', event);
            
            if (event === 'SIGNED_IN' && session) {
                this.currentUser = session.user;
                this.loadUserRoles().then(() => this.onAuthSuccess());
            } else if (event === 'SIGNED_OUT') {
                this.currentUser = null;
                this.userRoles = [];
                this.redirectToLogin();
            } else if (event === 'TOKEN_REFRESHED') {
                console.log('Token rafraîchi');
            }
        });
    }

    /**
     * Connexion avec email/password
     */
    async login(email, password) {
        try {
            const { data, error } = await window.supabaseClient.auth.signInWithPassword({
                email: email.trim(),
                password: password
            });
            
            if (error) {
                throw new Error(error.message);
            }
            
            this.currentUser = data.user;
            await this.loadUserRoles();
            this.onAuthSuccess();
            
            return { success: true, data };
        } catch (error) {
            console.error('Erreur login:', error);
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
            console.error('Erreur logout:', error);
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
        // Ne pas rediriger si déjà sur la page de login
        if (window.location.pathname.includes('login.html')) {
            return;
        }
        
        console.log('🔐 Redirection vers login...');
        window.location.href = '/login.html';
    }

    /**
     * Actions après authentification réussie
     */
    onAuthSuccess() {
        console.log('✅ Authentifié:', this.currentUser.email);
        console.log('📋 Rôles:', this.userRoles);
        
        // Rediriger depuis login vers dashboard
        if (window.location.pathname.includes('login.html')) {
            window.location.href = '/index.html';
        }
        
        // Afficher les informations utilisateur dans l'interface
        this.updateUI();
    }

    /**
     * Mettre à jour l'interface avec les infos utilisateur
     */
    updateUI() {
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

console.log('✅ AuthManager chargé');
