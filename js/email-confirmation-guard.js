/**
 * ============================================================================
 * EMAIL CONFIRMATION GUARD - Système de restriction d'accès
 * ============================================================================
 * 
 * Fonctionnalités :
 * - Vérifie si l'email est confirmé
 * - Si pas confirmé et > 1h → déconnexion automatique
 * - Si pas confirmé et < 1h → accès restreint (uniquement gestion gîtes)
 * - Bloque tous les appels API externes (sync iCal, etc.)
 * 
 * Date : 28 Janvier 2026
 * ============================================================================
 */

class EmailConfirmationGuard {
    constructor() {
        this.CHECK_INTERVAL = 60000; // Vérifier chaque minute
        this.MAX_UNCONFIRMED_TIME = 3600000; // 1 heure en millisecondes
        this.intervalId = null;
        this.isRestricted = false;
    }

    /**
     * Démarrer la surveillance
     */
    async start() {
        // Vérification immédiate
        await this.checkEmailConfirmation();
        
        // Vérifications périodiques
        this.intervalId = setInterval(() => {
            this.checkEmailConfirmation();
        }, this.CHECK_INTERVAL);
    }

    /**
     * Arrêter la surveillance
     */
    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }

    /**
     * Vérifier le statut de confirmation email
     */
    async checkEmailConfirmation() {
        try {
            const { data: { session } } = await window.supabaseClient.auth.getSession();
            
            if (!session || !session.user) {
                return;
            }

            const user = session.user;
            const emailConfirmed = user.email_confirmed_at !== null;
            const accountCreatedAt = new Date(user.created_at).getTime();
            const now = Date.now();
            const timeSinceCreation = now - accountCreatedAt;

            // Si email confirmé → accès complet
            if (emailConfirmed) {
                if (this.isRestricted) {
                    this.removeRestrictions();
                }
                this.stop(); // Plus besoin de vérifier
                return;
            }

            // Si email non confirmé et > 1 heure → déconnexion
            if (timeSinceCreation > this.MAX_UNCONFIRMED_TIME) {
                // console.log('⏰ Délai de confirmation dépassé (1h). Déconnexion...');
                await this.forceLogout();
                return;
            }

            // Si email non confirmé et < 1 heure → accès restreint
            if (!this.isRestricted) {
                // console.log('⚠️ Email non confirmé. Activation mode restreint.');
                this.applyRestrictions();
            }

            // Afficher le temps restant
            const timeRemaining = this.MAX_UNCONFIRMED_TIME - timeSinceCreation;
            const minutesRemaining = Math.floor(timeRemaining / 60000);
            // console.log(`⏳ Temps restant pour confirmer: ${minutesRemaining} minutes`);
            
            this.showWarningBanner(minutesRemaining);

        } catch (error) {
            console.error('❌ Erreur vérification email:', error);
        }
    }

    /**
     * Appliquer les restrictions d'accès
     */
    applyRestrictions() {
        this.isRestricted = true;

        // 1. Bloquer tous les onglets sauf "gestion"
        const tabButtons = document.querySelectorAll('.nav-tab, .tab-neo');
        tabButtons.forEach(btn => {
            const tab = btn.getAttribute('data-tab');
            if (tab !== 'gestion') {
                btn.style.opacity = '0.5';
                btn.style.pointerEvents = 'none';
                btn.title = 'Confirmez votre email pour accéder à cette fonctionnalité';
            }
        });

        // 2. Masquer les onglets sauf gestion
        const tabContents = document.querySelectorAll('.tab-content');
        tabContents.forEach(content => {
            if (content.id !== 'tab-gestion') {
                content.style.display = 'none';
            }
        });

        // 3. Forcer l'affichage de l'onglet gestion
        const gestionTab = document.getElementById('tab-gestion');
        if (gestionTab) {
            gestionTab.style.display = 'block';
            gestionTab.classList.add('active');
        }

        // 4. Bloquer les appels API externes
        this.blockExternalAPICalls();

        // console.log('🔒 Restrictions appliquées : accès uniquement à la gestion des gîtes');
    }

    /**
     * Retirer les restrictions
     */
    removeRestrictions() {
        this.isRestricted = false;

        // Restaurer tous les onglets
        const tabButtons = document.querySelectorAll('.nav-tab, .tab-neo');
        tabButtons.forEach(btn => {
            btn.style.opacity = '';
            btn.style.pointerEvents = '';
            btn.title = '';
        });

        // Restaurer l'affichage
        const tabContents = document.querySelectorAll('.tab-content');
        tabContents.forEach(content => {
            content.style.display = '';
        });

        // Retirer la bannière d'avertissement
        const banner = document.getElementById('email-confirmation-banner');
        if (banner) {
            banner.remove();
        }

        // console.log('🔓 Restrictions levées : accès complet');
    }

    /**
     * Bloquer les appels API externes
     */
    blockExternalAPICalls() {
        // Intercepter les fonctions de synchronisation iCal
        if (window.syncIcal) {
            window._syncIcal_original = window.syncIcal;
            window.syncIcal = () => {
                alert('⚠️ Veuillez confirmer votre email pour synchroniser avec les plateformes externes.');
                console.warn('🚫 Synchronisation bloquée : email non confirmé');
            };
        }

        // Bloquer les webhooks/API externes
        const originalFetch = window.fetch;
        window.fetch = function(...args) {
            const url = args[0];
            
            // Autoriser uniquement Supabase
            if (typeof url === 'string' && !url.includes('supabase.co')) {
                console.warn('🚫 Appel API externe bloqué:', url);
                return Promise.reject(new Error('Confirmez votre email pour accéder aux fonctionnalités externes'));
            }
            
            return originalFetch.apply(this, args);
        };

        // console.log('🚫 Appels API externes bloqués');
    }

    /**
     * Afficher une bannière d'avertissement
     */
    showWarningBanner(minutesRemaining) {
        let banner = document.getElementById('email-confirmation-banner');
        
        if (!banner) {
            banner = document.createElement('div');
            banner.id = 'email-confirmation-banner';
            banner.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                background: linear-gradient(135deg, #fb923c 0%, #f97316 100%);
                color: white;
                padding: 16px 20px;
                text-align: center;
                font-size: 14px;
                font-weight: 600;
                z-index: 10000;
                box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                animation: slideDown 0.3s ease-out;
            `;
            document.body.prepend(banner);
        }

        banner.innerHTML = `
            ⚠️ Email non confirmé : accès limité à la création de gîtes uniquement.
            <br>
            <small>Confirmez votre email dans les ${minutesRemaining} minutes restantes ou vous serez déconnecté.</small>
            <button onclick="window.location.reload()" style="margin-left: 10px; padding: 4px 12px; background: white; color: #f97316; border: none; border-radius: 6px; font-weight: 700; cursor: pointer;">
                Rafraîchir
            </button>
        `;
    }

    /**
     * Déconnexion forcée
     */
    async forceLogout() {
        try {
            // Afficher message
            alert('⏰ Votre délai de confirmation email (1 heure) est écoulé. Veuillez vous reconnecter après avoir confirmé votre email.');

            // Déconnexion Supabase
            await window.supabaseClient.auth.signOut();
            
            // Nettoyage localStorage
            localStorage.clear();
            
            // Redirection
            window.location.href = 'pages/login.html';
        } catch (error) {
            console.error('❌ Erreur déconnexion forcée:', error);
            window.location.href = 'pages/login.html';
        }
    }
}

// Initialiser le guard
window.emailConfirmationGuard = new EmailConfirmationGuard();

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EmailConfirmationGuard;
}
