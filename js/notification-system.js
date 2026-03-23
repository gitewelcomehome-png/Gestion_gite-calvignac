/**
 * ============================================================================
 * NOTIFICATION SYSTEM - Système de notifications en temps réel
 * ============================================================================
 * 
 * Fonctionnalités :
 * - Détection des nouvelles demandes d'horaires
 * - Détection des nouvelles réservations
 * - Détection des nouvelles tâches de ménage
 * - Badge de compteur dans le header
 * - Panel de notifications
 * - Marquer comme lu
 * 
 * Date : 28 Janvier 2026
 * ============================================================================
 */

class NotificationSystem {
    constructor() {
        this.notifications = [];
        this.lastCheck = {
            demandes: null,
            reservations: null,
            taches: null
        };
        this.checkInterval = null;
        this.CHECK_FREQUENCY = 30000; // Vérifier toutes les 30 secondes
        this.userPreferences = null; // Préférences email de l'utilisateur
        this.notificationButtonBound = false;
        this.panelEventsBound = false;
    }

    buildDefaultPreferences(email = '') {
        return {
            email_enabled: true,
            email_address: email || '',
            notify_demandes: true,
            notify_reservations: true,
            notify_taches: true,
            email_frequency: 'immediate'
        };
    }

    /**
     * Démarrer le système de notifications
     */
    async start() {
        try {
            // Charger les notifications existantes depuis localStorage (scopé par user)
            await this.loadNotifications();
            
            // Charger les préférences utilisateur
            await this.loadUserPreferences();
            
            // Charger les dernières vérifications depuis localStorage
            this.loadLastCheck();
            
            // Vérification initiale
            await this.checkAll();
            
            // Vérifications périodiques
            this.checkInterval = setInterval(() => {
                this.checkAll();
            }, this.CHECK_FREQUENCY);
            
            // Créer le badge de notification dans le header
            this.createNotificationBadge();
            this.bindNotificationButtons();
            
        } catch (error) {
            console.error('⚠️ Erreur démarrage NotificationSystem (table notifications absente?):', error);
            // Forcer le compteur à 0 et masquer le badge
            this.updatePageTitle(0);
            const badge = document.getElementById('notificationBadge');
            if (badge) {
                badge.style.display = 'none';
                badge.textContent = '0';
            }
        }
    }

    bindNotificationButtons() {
        const buttons = [
            document.getElementById('notificationBtn'),
            document.getElementById('notificationButton')
        ].filter(Boolean);

        buttons.forEach(btn => {
            if (btn.dataset.notifBound === '1') return;

            btn.addEventListener('click', (event) => {
                event.preventDefault();
                this.toggleNotificationPanel();
            });

            btn.dataset.notifBound = '1';
        });
    }

    /**
     * Arrêter le système
     */
    stop() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
            // console.log('🔕 Notification System arrêté');
        }
    }

    /**
     * Charger les dernières vérifications
     */
    loadLastCheck() {
        const stored = localStorage.getItem('notif_lastCheck');
        if (stored) {
            try {
                this.lastCheck = JSON.parse(stored);
            } catch (e) {
                console.error('Erreur chargement lastCheck:', e);
            }
        }
    }
    
    /**
     * Charger les préférences de notification de l'utilisateur
     */
    async loadUserPreferences() {
        try {
            const { data: { user } } = await window.supabaseClient.auth.getUser();
            if (!user) {
                this.userPreferences = this.buildDefaultPreferences('');
                return;
            }

            const { data, error } = await window.supabaseClient
                .from('user_notification_preferences')
                .select('*')
                .eq('user_id', user.id)
                .maybeSingle();

            if (error) {
                throw error;
            }

            // Si pas de préférences, créer les valeurs par défaut
            if (!data) {
                const defaultPrefs = {
                    user_id: user.id,
                    email_enabled: true,
                    email_address: user.email,
                    notify_demandes: true,
                    notify_reservations: true,
                    notify_taches: true,
                    email_frequency: 'immediate'
                };

                const { data: newPrefs, error: insertError } = await window.supabaseClient
                    .from('user_notification_preferences')
                    .insert(defaultPrefs)
                    .select()
                    .single();

                if (insertError) throw insertError;
                this.userPreferences = newPrefs;
            } else {
                this.userPreferences = data;
            }

        } catch (error) {
            console.error('❌ Erreur chargement préférences:', error);
            try {
                const { data: { user } } = await window.supabaseClient.auth.getUser();
                this.userPreferences = this.buildDefaultPreferences(user?.email || '');
            } catch (_) {
                this.userPreferences = this.buildDefaultPreferences('');
            }
        }
    }

    /**
     * Sauvegarder les dernières vérifications
     */
    saveLastCheck() {
        localStorage.setItem('notif_lastCheck', JSON.stringify(this.lastCheck));
    }

    /**
     * Vérifier toutes les sources de notifications
     */
    async checkAll() {
        try {
            await Promise.all([
                this.checkNewDemandes(),
                this.checkNewReservations()
                // Note: checkNewTaches() désactivé - table supprimée le 23 Jan 2026
            ]);
            
            this.updateBadge();
        } catch (error) {
            console.error('❌ Erreur vérification notifications:', error);
        }
    }

    /**
     * Vérifier les nouvelles demandes d'horaires
     */
    async checkNewDemandes() {
        try {
            const { data, error } = await window.supabaseClient
                .from('demandes_horaires')
                .select('*')
                .eq('statut', 'en_attente')
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (!data || data.length === 0) return;

            // Si c'est la première vérification, juste enregistrer
            if (!this.lastCheck.demandes) {
                this.lastCheck.demandes = new Date().toISOString();
                this.saveLastCheck();
                return;
            }

            // Chercher les nouvelles demandes
            const lastCheckDate = new Date(this.lastCheck.demandes);
            const newDemandes = data.filter(d => new Date(d.created_at) > lastCheckDate);

            if (newDemandes.length > 0) {
                newDemandes.forEach(demande => {
                    this.addNotification({
                        type: 'demande',
                        title: '📩 Nouvelle demande d\'horaire',
                        message: `Demande ${demande.type_horaire} pour le ${new Date(demande.date_sejour).toLocaleDateString('fr-FR')}`,
                        data: demande,
                        timestamp: new Date(demande.created_at)
                    });
                });

                this.lastCheck.demandes = new Date().toISOString();
                this.saveLastCheck();
            }
        } catch (error) {
            // Table taches_menage supprimée le 23 Jan 2026
            // Erreur attendue et catchée silencieusement (production)
        }
    }

    /**
     * Vérifier les nouvelles réservations
     */
    async checkNewReservations() {
        try {
            const { data, error } = await window.supabaseClient
                .from('reservations')
                .select('*, gites(name)')
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) throw error;

            if (!data || data.length === 0) return;

            // Si c'est la première vérification
            if (!this.lastCheck.reservations) {
                this.lastCheck.reservations = new Date().toISOString();
                this.saveLastCheck();
                return;
            }

            // Chercher les nouvelles réservations
            const lastCheckDate = new Date(this.lastCheck.reservations);
            const newReservations = data.filter(r => new Date(r.created_at) > lastCheckDate);

            if (newReservations.length > 0) {
                newReservations.forEach(resa => {
                    this.addNotification({
                        type: 'reservation',
                        title: '📅 Nouvelle réservation',
                        message: `${resa.gites?.name || 'Gîte'} - ${resa.nom_client} du ${new Date(resa.check_in).toLocaleDateString('fr-FR')} au ${new Date(resa.check_out).toLocaleDateString('fr-FR')}`,
                        data: resa,
                        timestamp: new Date(resa.created_at)
                    });
                });

                this.lastCheck.reservations = new Date().toISOString();
                this.saveLastCheck();
            }
        } catch (error) {
            // Les erreurs réseau temporaires sont filtrées en amont par error-tracker
            if (error.code && error.code !== '42703') {
                console.error('Erreur checkNewReservations:', error);
            }
        }
    }

    /**
     * Vérifier les nouvelles tâches de ménage
     */
    async checkNewTaches() {
        try {
            const { data, error } = await window.supabaseClient
                .from('taches_menage')
                .select('*, gites(nom)')
                .eq('statut', 'en_attente')
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (!data || data.length === 0) return;

            // Si c'est la première vérification
            if (!this.lastCheck.taches) {
                this.lastCheck.taches = new Date().toISOString();
                this.saveLastCheck();
                return;
            }

            // Chercher les nouvelles tâches
            const lastCheckDate = new Date(this.lastCheck.taches);
            const newTaches = data.filter(t => new Date(t.created_at) > lastCheckDate);

            if (newTaches.length > 0) {
                newTaches.forEach(tache => {
                    this.addNotification({
                        type: 'tache',
                        title: '🧹 Nouvelle tâche de ménage',
                        message: `${tache.gites?.nom || 'Gîte'} - Ménage le ${new Date(tache.date_menage).toLocaleDateString('fr-FR')}`,
                        data: tache,
                        timestamp: new Date(tache.created_at)
                    });
                });

                this.lastCheck.taches = new Date().toISOString();
                this.saveLastCheck();
            }
        } catch (error) {
            // Table supprimée le 23 Jan 2026 - erreur attendue et catchée
            // Ne pas polluer la console avec cette erreur connue
        }
    }

    /**
     * Ajouter une notification
     */
    addNotification(notif) {
        // Vérifier si pas déjà présente
        const exists = this.notifications.some(n => 
            n.type === notif.type && 
            n.data?.id === notif.data?.id
        );

        if (!exists) {
            notif.id = `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
            notif.read = false;
            this.notifications.unshift(notif);
            
            // Limiter à 50 notifications max
            if (this.notifications.length > 50) {
                this.notifications = this.notifications.slice(0, 50);
            }
            
            // Sauvegarder
            this.saveNotifications();
            
            // Afficher toast
            if (window.showToast) {
                window.showToast(notif.title, 'info');
            }
            
            // console.log('🔔 Nouvelle notification:', notif.title);
            
            // Envoyer email si activé
            this.sendEmailNotification(notif);
        }
    }
    
    /**
     * Envoyer une notification par email
     */
    async sendEmailNotification(notif) {
        // Vérifier si les emails sont activés
        if (!this.userPreferences || !this.userPreferences.email_enabled) {
            return;
        }

        // Vérifier si ce type de notification est activé
        const typeMap = {
            'demande': 'notify_demandes',
            'reservation': 'notify_reservations',
            'tache': 'notify_taches'
        };

        const prefKey = typeMap[notif.type];
        if (!prefKey || !this.userPreferences[prefKey]) {
            return;
        }

        // Si fréquence = immediate, envoyer maintenant
        if (this.userPreferences.email_frequency === 'immediate') {
            await this.sendImmediateEmail(notif);
        }
        // Sinon, ajouter à la file d'attente pour envoi groupé
        // (à implémenter plus tard si nécessaire)
    }
    
    /**
     * Envoyer un email immédiat via Resend
     */
    async sendImmediateEmail(notif) {
        try {
            const emailAddress = this.userPreferences.email_address;
            if (!emailAddress) return;

            const subject = notif.title;
            const html = this.generateEmailHTML(notif);

            if (window.sendEmail) {
                const result = await window.sendEmail({
                    to: emailAddress,
                    subject: subject,
                    html: html
                });

                if (!result.success) {
                    // Erreur email catchée silencieusement (ne pas polluer console)
                }
            }
        } catch (error) {
            // Erreur email catchée silencieusement
        }
    }
    
    /**
     * Générer le HTML de l'email de notification
     */
    generateEmailHTML(notif) {
        const icons = {
            'demande': '📩',
            'reservation': '📅',
            'tache': '🧹'
        };

        const icon = icons[notif.type] || '🔔';

        return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: white; border-radius: 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                    
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #00acc1 0%, #0097a7 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                            <h1 style="margin: 0; color: white; font-size: 24px;">
                                ${icon} ${notif.title}
                            </h1>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 30px;">
                            <p style="color: #555; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                                ${notif.message}
                            </p>
                            
                            <p style="color: #999; font-size: 14px; margin: 20px 0 0 0;">
                                <strong>Date :</strong> ${new Date(notif.timestamp).toLocaleString('fr-FR')}
                            </p>
                            
                            <div style="text-align: center; margin-top: 30px;">
                                <a href="https://liveownerunit.vercel.app" style="display: inline-block; background: linear-gradient(135deg, #00acc1 0%, #0097a7 100%); color: white; text-decoration: none; padding: 14px 35px; border-radius: 50px; font-size: 16px; font-weight: 600;">
                                    Voir sur la plateforme
                                </a>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e0e0e0;">
                            <p style="margin: 0; color: #95a5a6; font-size: 12px;">
                                Liveownerunit - Gestion Synchronisée<br>
                                <a href="https://liveownerunit.vercel.app" style="color: #00acc1; text-decoration: none;">Gérer mes préférences de notification</a>
                            </p>
                        </td>
                    </tr>
                    
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
        `;
    }

    /**
     * Marquer une notification comme lue
     */
    markAsRead(notifId) {
        const notif = this.notifications.find(n => String(n.id) === String(notifId));
        if (notif) {
            notif.read = true;
            this.saveNotifications();
            this.updateBadge();
            if (document.getElementById('notificationPanel')?.style.display === 'block') {
                this.renderNotifications();
            }
        }
    }

    /**
     * Marquer toutes comme lues
     */
    markAllAsRead() {
        this.notifications.forEach(n => n.read = true);
        this.saveNotifications();
        this.updateBadge();
        this.renderNotifications();
    }

    /**
     * Supprimer une notification
     */
    deleteNotification(notifId) {
        this.notifications = this.notifications.filter(n => String(n.id) !== String(notifId));
        this.saveNotifications();
        this.updateBadge();
        this.renderNotifications();
    }

    /**
     * Compter les non lues
     */
    getUnreadCount() {
        const unread = this.notifications.filter(n => !n.read);
        return unread.length;
    }

    /**
     * Sauvegarder les notifications
     */
    async _getStorageKey() {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            return user ? `notifications_${user.id}` : 'notifications_guest';
        } catch (e) {
            return 'notifications_guest';
        }
    }

    saveNotifications() {
        const key = this._storageKey || 'notifications_guest';
        localStorage.setItem(key, JSON.stringify(this.notifications));
    }

    /**
     * Charger les notifications
     */
    async loadNotifications() {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            this._storageKey = user ? `notifications_${user.id}` : 'notifications_guest';
        } catch (e) {
            this._storageKey = 'notifications_guest';
        }
        const stored = localStorage.getItem(this._storageKey);
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                if (Array.isArray(parsed)) {
                    this.notifications = parsed.map((notif, index) => ({
                        ...notif,
                        id: notif?.id ? String(notif.id) : `legacy_${index}_${Date.now()}`,
                        read: !!notif?.read
                    }));
                } else {
                    this.notifications = [];
                }
            } catch (e) {
                console.error('Erreur chargement notifications:', e);
                this.notifications = [];
            }
        }
    }

    /**
     * Créer le badge de notification dans le header
     */
    createNotificationBadge() {
        // Trouver le conteneur des contrôles (theme-controls)
        const themeControls = document.querySelector('.theme-controls');
        if (!themeControls) {
            console.error('❌ Theme controls non trouvé pour ajouter le badge de notification');
            return;
        }

        // Si bouton statique déjà présent dans le DOM, l'utiliser
        if (document.getElementById('notificationBtn')) {
            this.createNotificationPanel();
            return;
        }

        // Vérifier si le badge dynamique existe déjà
        if (document.getElementById('notificationButton')) {
            this.createNotificationPanel();
            return;
        }

        // Créer le bouton de notification
        const notifBtn = document.createElement('button');
        notifBtn.id = 'notificationButton';
        notifBtn.className = 'ctrl-btn notification-btn';
        notifBtn.title = 'Notifications';
        notifBtn.innerHTML = `
            <i data-lucide="bell" style="width: 16px; height: 16px;"></i>
            <span id="notificationBadge" class="notification-badge" style="display: none;">0</span>
        `;
        notifBtn.onclick = () => this.toggleNotificationPanel();

        // Ajouter avant le dernier séparateur (celui avant le bouton admin)
        const adminBtn = themeControls.querySelector('.ctrl-btn-admin');
        if (adminBtn && adminBtn.previousElementSibling) {
            // Insérer avant le séparateur qui précède le bouton admin
            themeControls.insertBefore(notifBtn, adminBtn.previousElementSibling);
        } else {
            // Fallback : ajouter à la fin
            themeControls.appendChild(notifBtn);
        }

        // Initialiser les icônes Lucide
        if (window.lucide) {
            window.lucide.createIcons();
        }

        // Créer le panel de notifications
        this.createNotificationPanel();
    }
    
    /**
     * Ouvrir la configuration des notifications
     */
    async openNotificationSettings() {
        const modal = document.getElementById('notificationSettingsModal');
        const container = document.getElementById('notificationSettingsContent');

        if (modal) {
            modal.style.display = 'flex';

            if (container) {
                container.innerHTML = '<p style="text-align: center; padding: 40px; color: #999;">Chargement...</p>';
            }

            if (!this.userPreferences) {
                await this.loadUserPreferences();
            }

            this.renderNotificationSettings();
        }
    }

    /**
     * Mettre à jour le badge
     */
    updateBadge() {
        const badge = document.getElementById('notificationBadge');
        const mainBtn = document.getElementById('notificationBtn');
        const dynamicBtn = document.getElementById('notificationButton');
        if (!badge) return;

        const count = this.getUnreadCount();
        if (count > 0) {
            badge.textContent = count > 99 ? '99+' : count;
            badge.style.display = 'flex';
            if (mainBtn) {
                mainBtn.classList.add('has-notifications');
                mainBtn.style.display = 'flex';
            }
            if (dynamicBtn) {
                dynamicBtn.classList.add('has-notifications');
                dynamicBtn.style.display = 'flex';
            }
        } else {
            badge.style.display = 'none';
            if (mainBtn) {
                mainBtn.classList.remove('has-notifications');
            }
            if (dynamicBtn) {
                dynamicBtn.classList.remove('has-notifications');
            }
        }
        
        // Mettre à jour le titre de l'onglet
        this.updatePageTitle(count);
    }
    
    /**
     * Mettre à jour le titre de la page avec le compteur
     */
    updatePageTitle(count) {
        const baseTitle = 'Gestion Gîtes';
        
        if (count > 0) {
            document.title = `(${count}) ${baseTitle}`;
        } else {
            document.title = baseTitle;
        }
    }

    /**
     * Créer le panel de notifications
     */
    createNotificationPanel() {
        const existingPanel = document.getElementById('notificationPanel');
        if (existingPanel) {
            existingPanel.innerHTML = `
                <div class="notification-panel-header">
                    <h3>🔔 Notifications</h3>
                    <div style="display: flex; gap: 10px;">
                        <button onclick="window.notificationSystem.openNotificationSettings()" class="btn-settings" title="Configurer">
                            <i data-lucide="settings" style="width: 16px; height: 16px;"></i>
                        </button>
                        <button onclick="window.notificationSystem.markAllAsRead()" class="btn-mark-all-read">
                            Tout marquer comme lu
                        </button>
                        <button onclick="window.notificationSystem.closeNotificationPanel()" class="btn-settings" title="Fermer">
                            ✕
                        </button>
                    </div>
                </div>
                <div id="notificationList" class="notification-list">
                    <p style="text-align: center; color: #999; padding: 20px;">Aucune notification</p>
                </div>
            `;

            this.bindPanelEvents();

            if (window.lucide) {
                window.lucide.createIcons();
            }

            return;
        }

        const panel = document.createElement('div');
        panel.id = 'notificationPanel';
        panel.className = 'notification-panel';
        panel.style.display = 'none';
        panel.innerHTML = `
            <div class="notification-panel-header">
                <h3>🔔 Notifications</h3>
                <div style="display: flex; gap: 10px;">
                    <button onclick="window.notificationSystem.openNotificationSettings()" class="btn-settings" title="Configurer">
                        <i data-lucide="settings" style="width: 16px; height: 16px;"></i>
                    </button>
                    <button onclick="window.notificationSystem.markAllAsRead()" class="btn-mark-all-read">
                        Tout marquer comme lu
                    </button>
                    <button onclick="window.notificationSystem.closeNotificationPanel()" class="btn-settings" title="Fermer">
                        ✕
                    </button>
                </div>
            </div>
            <div id="notificationList" class="notification-list">
                <p style="text-align: center; color: #999; padding: 20px;">Aucune notification</p>
            </div>
        `;

        document.body.appendChild(panel);
        this.bindPanelEvents();
        
        // Réinitialiser les icônes Lucide
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }
    
    /**
     * Afficher les paramètres de notification
     */
    renderNotificationSettings() {
        const container = document.getElementById('notificationSettingsContent');
        if (!container) return;

        if (!this.userPreferences) {
            this.userPreferences = this.buildDefaultPreferences('');
        }

        container.innerHTML = `
            <div style="padding: 30px;">
                <!-- Activation globale -->
                <div class="setting-group">
                    <div class="setting-header">
                        <h3 style="margin: 0; color: #2c3e50; font-size: 18px;">📧 Notifications par email</h3>
                        <label class="toggle-switch">
                            <input type="checkbox" id="emailEnabled" ${this.userPreferences.email_enabled ? 'checked' : ''} onchange="window.notificationSystem.savePreference('email_enabled', this.checked)">
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                    <p style="color: #666; font-size: 14px; margin: 10px 0 0 0;">Recevoir des emails pour les nouvelles notifications</p>
                </div>

                <!-- Adresse email -->
                <div class="setting-group">
                    <label style="display: block; color: #555; font-size: 14px; margin-bottom: 8px; font-weight: 600;">
                        Adresse email de destination
                    </label>
                    <div style="display: flex; gap: 8px;">
                        <input type="email" id="emailAddress" value="${this.userPreferences.email_address || ''}" placeholder="votre@email.com" style="flex: 1; padding: 12px; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 14px;">
                        <button onclick="window.notificationSystem.savePreference('email_address', document.getElementById('emailAddress').value)" style="padding: 12px 18px; background: #06b6d4; color: white; border: none; border-radius: 8px; font-size: 14px; cursor: pointer; font-weight: 600; white-space: nowrap;">💾 Sauvegarder</button>
                    </div>
                    <p style="color: #999; font-size: 12px; margin: 5px 0 0 0;">Par défaut : email de votre compte</p>
                </div>

                <!-- Types de notifications -->
                <div class="setting-group">
                    <h4 style="margin: 0 0 15px 0; color: #2c3e50; font-size: 16px;">Types de notifications</h4>
                    
                    <div class="setting-item">
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <span style="font-size: 24px;">📩</span>
                            <div style="flex: 1;">
                                <strong style="display: block; color: #2c3e50;">Demandes d'horaires</strong>
                                <small style="color: #666;">Nouvelles demandes d'arrivée/départ</small>
                            </div>
                            <label class="toggle-switch">
                                <input type="checkbox" id="notifyDemandes" ${this.userPreferences.notify_demandes ? 'checked' : ''} onchange="window.notificationSystem.savePreference('notify_demandes', this.checked)">
                                <span class="toggle-slider"></span>
                            </label>
                        </div>
                    </div>

                    <div class="setting-item">
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <span style="font-size: 24px;">📅</span>
                            <div style="flex: 1;">
                                <strong style="display: block; color: #2c3e50;">Réservations</strong>
                                <small style="color: #666;">Nouvelles réservations de gîtes</small>
                            </div>
                            <label class="toggle-switch">
                                <input type="checkbox" id="notifyReservations" ${this.userPreferences.notify_reservations ? 'checked' : ''} onchange="window.notificationSystem.savePreference('notify_reservations', this.checked)">
                                <span class="toggle-slider"></span>
                            </label>
                        </div>
                    </div>

                    <div class="setting-item">
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <span style="font-size: 24px;">🧹</span>
                            <div style="flex: 1;">
                                <strong style="display: block; color: #2c3e50;">Tâches de ménage</strong>
                                <small style="color: #666;">Nouvelles tâches en attente</small>
                            </div>
                            <label class="toggle-switch">
                                <input type="checkbox" id="notifyTaches" ${this.userPreferences.notify_taches ? 'checked' : ''} onchange="window.notificationSystem.savePreference('notify_taches', this.checked)">
                                <span class="toggle-slider"></span>
                            </label>
                        </div>
                    </div>
                </div>

                <!-- Fréquence d'envoi -->
                <div class="setting-group">
                    <label style="display: block; color: #555; font-size: 14px; margin-bottom: 8px; font-weight: 600;">
                        Fréquence d'envoi
                    </label>
                    <select id="emailFrequency" style="width: 100%; padding: 12px; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 14px;" onchange="window.notificationSystem.savePreference('email_frequency', this.value)">
                        <option value="immediate" ${this.userPreferences.email_frequency === 'immediate' ? 'selected' : ''}>Immédiat (dès réception)</option>
                        <option value="hourly" ${this.userPreferences.email_frequency === 'hourly' ? 'selected' : ''}>Toutes les heures (groupé)</option>
                        <option value="daily" ${this.userPreferences.email_frequency === 'daily' ? 'selected' : ''}>Quotidien (résumé)</option>
                    </select>
                </div>

                <div style="background: #f0f9ff; border-left: 4px solid #00acc1; padding: 15px; border-radius: 6px; margin-top: 20px;">
                    <p style="margin: 0; color: #00697a; font-size: 13px; line-height: 1.6;">
                        💡 Les paramètres sont sauvegardés automatiquement
                    </p>
                </div>
            </div>
        `;
    }
    
    /**
     * Sauvegarder une préférence
     */
    async savePreference(key, value) {
        try {
            if (!this.userPreferences) return;

            const { data: { user } } = await window.supabaseClient.auth.getUser();
            if (!user) return;

            // Mettre à jour localement d'abord
            this.userPreferences[key] = value;

            // Upsert : crée la ligne si elle n'existe pas, sinon met à jour
            const upsertData = {
                user_id: user.id,
                email_enabled: this.userPreferences.email_enabled ?? true,
                email_address: this.userPreferences.email_address ?? user.email ?? '',
                notify_demandes: this.userPreferences.notify_demandes ?? true,
                notify_reservations: this.userPreferences.notify_reservations ?? true,
                notify_taches: this.userPreferences.notify_taches ?? true,
                email_frequency: this.userPreferences.email_frequency ?? 'immediate'
            };

            const { error } = await window.supabaseClient
                .from('user_notification_preferences')
                .upsert(upsertData, { onConflict: 'user_id' });

            if (error) throw error;

            if (window.showToast) {
                window.showToast('✅ Préférence sauvegardée', 'success');
            }
        } catch (error) {
            console.error('❌ Erreur sauvegarde préférence:', error);
            if (window.showToast) {
                window.showToast('Erreur de sauvegarde', 'error');
            }
        }
    }

    /**
     * Toggle le panel de notifications
     */
    toggleNotificationPanel() {
        const panel = document.getElementById('notificationPanel');
        if (!panel) return;

        const isVisible = panel.style.display === 'block';
        
        if (isVisible) {
            // FERMETURE : ne pas valider automatiquement les notifications
            panel.style.display = 'none';
        } else {
            // OUVERTURE : Afficher le panel
            this.renderNotifications();
            panel.style.display = 'block';
        }
    }

    closeNotificationPanel() {
        const panel = document.getElementById('notificationPanel');
        if (panel) {
            panel.style.display = 'none';
        }
    }

    bindPanelEvents() {
        if (this.panelEventsBound) return;

        document.addEventListener('click', (event) => {
            const panel = document.getElementById('notificationPanel');
            if (!panel || panel.style.display !== 'block') return;

            const isInsidePanel = panel.contains(event.target);
            const notifBtn = document.getElementById('notificationBtn');
            const notifBtnDyn = document.getElementById('notificationButton');
            const isNotifButton = notifBtn?.contains(event.target) || notifBtnDyn?.contains(event.target);

            if (!isInsidePanel && !isNotifButton) {
                this.closeNotificationPanel();
            }
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                this.closeNotificationPanel();
            }
        });

        this.panelEventsBound = true;
    }

    /**
     * Rendre les notifications
     */
    renderNotifications() {
        const list = document.getElementById('notificationList');
        if (!list) return;

        if (this.notifications.length === 0) {
            list.innerHTML = '<p style="text-align: center; color: #999; padding: 20px;">Aucune notification</p>';
            return;
        }

        list.innerHTML = this.notifications.map(n => `
            <div class="notification-item ${n.read ? 'read' : 'unread'}" onclick="window.notificationSystem.handleNotificationClick('${String(n.id).replace(/'/g, "\\'")}')">
                <div class="notification-content">
                    <strong>${n.title}</strong>
                    <p>${n.message}</p>
                    <small>${this.formatDate(n.timestamp)}</small>
                </div>
                <button onclick="event.stopPropagation(); window.notificationSystem.deleteNotification('${String(n.id).replace(/'/g, "\\'")}')" class="btn-delete-notif">
                    ×
                </button>
            </div>
        `).join('');
    }

    handleNotificationClick(notifId) {
        const notif = this.notifications.find(n => String(n.id) === String(notifId));
        if (!notif) return;

        if (!notif.read) {
            notif.read = true;
            this.saveNotifications();
            this.updateBadge();
            this.renderNotifications();
        }

        if (notif.type === 'reservation' && notif.data?.id) {
            this.openReservationEditFromNotification(notif.data.id);
            return;
        }

        if (notif.type === 'menage_conflict') {
            if (typeof window.switchTab === 'function') {
                window.switchTab('menage');
            }
        }
    }

    openReservationEditFromNotification(reservationId) {
        try {
            if (typeof window.switchTab === 'function') {
                window.switchTab('reservations');
            }

            const startedAt = Date.now();
            const maxWaitMs = 6000;
            const interval = setInterval(() => {
                if (typeof window.openEditModal === 'function') {
                    clearInterval(interval);
                    window.openEditModal(reservationId);
                    return;
                }

                if (Date.now() - startedAt > maxWaitMs) {
                    clearInterval(interval);
                }
            }, 200);
        } catch (error) {
            console.error('❌ Impossible d\'ouvrir la réservation depuis la notification:', error);
        }
    }

    /**
     * Formater la date
     */
    formatDate(date) {
        const d = new Date(date);
        const now = new Date();
        const diff = now - d;
        
        if (diff < 60000) return 'À l\'instant';
        if (diff < 3600000) return `Il y a ${Math.floor(diff / 60000)} min`;
        if (diff < 86400000) return `Il y a ${Math.floor(diff / 3600000)}h`;
        
        return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    }
}

// ================================================================
// INITIALISATION GLOBALE
// ================================================================

// Créer l'instance globale
window.notificationSystem = new NotificationSystem();

// Démarrer après l'authentification
document.addEventListener('DOMContentLoaded', () => {
    // Attendre que l'auth soit prête
    setTimeout(() => {
        if (window.authManager && window.authManager.currentUser) {
            window.notificationSystem.loadNotifications();
            window.notificationSystem.start();
        }
    }, 2000);
});

// Notification System prêt
