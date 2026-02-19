/**
 * 🚨 ADMIN ERROR MONITOR - Surveillance Erreurs Critiques
 * ========================================================
 * Surveillance en temps réel des erreurs pour l'admin Channel Manager
 * - Notifications instantanées des erreurs critiques
 * - Tableau de bord des erreurs
 * - Historique et statistiques
 * - Système d'alertes configurable
 */

class AdminErrorMonitor {
    constructor() {
        this.errors = [];
        this.stats = {
            total: 0,
            critical: 0,
            warning: 0,
            today: 0
        };
        this.realtimeSubscription = null;
        this.alertThresholds = {
            critical: 1,      // Alerte immédiate
            errorBurst: 5,    // 5 erreurs en 5 minutes
            burstWindow: 300000 // 5 minutes
        };
        this.notificationSound = null;
    }

    /**
     * Initialisation du monitoring
     */
    async init() {
        await this.loadRecentErrors();
        await this.loadStats();
        this.setupRealtimeListener();
        this.setupStorageSync();
        this.renderDashboard();
        this.checkBurstErrors();
    }

    async refreshFromDatabase() {
        await Promise.all([
            this.loadRecentErrors(),
            this.loadStats()
        ]);
        this.updateDashboard();
        this.checkBurstErrors();
    }

    /**
     * Charger les erreurs récentes (dernières 24h)
     */
    async loadRecentErrors() {
        try {
            const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
            
            const { data, error } = await window.supabaseClient
                .from('cm_error_logs')
                .select('*')
                .eq('resolved', false)
                .gte('timestamp', yesterday)
                .order('timestamp', { ascending: false })
                .limit(100);

            if (error) throw error;

            this.errors = data || [];
        } catch (err) {
            console.error('❌ Erreur chargement logs:', err);
        }
    }

    /**
     * Charger les statistiques
     */
    async loadStats() {
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const todayISO = today.toISOString();

            // Total et par type
            const { data: all, error: errorAll } = await window.supabaseClient
                .from('cm_error_logs')
                .select('error_type')
                .eq('resolved', false);

            if (errorAll) throw errorAll;

            this.stats.total = all.length;
            this.stats.critical = all.filter(e => e.error_type === 'critical').length;
            this.stats.warning = all.filter(e => e.error_type === 'warning').length;

            // Aujourd'hui
            const { count: todayCount, error: errorToday } = await window.supabaseClient
                .from('cm_error_logs')
                .select('*', { count: 'exact', head: true })
                .eq('resolved', false)
                .gte('timestamp', todayISO);

            if (!errorToday) {
                this.stats.today = todayCount || 0;
            }

        } catch (err) {
            console.error('❌ Erreur chargement stats:', err);
        }
    }

    /**
     * Écoute en temps réel des nouvelles erreurs
     */
    setupRealtimeListener() {
        if (!window.supabaseClient) return;

        this.realtimeSubscription = window.supabaseClient
            .channel('error-logs-admin')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'cm_error_logs'
            }, (payload) => {
                if (payload?.eventType === 'INSERT' && payload?.new?.error_type === 'critical') {
                    this.showCriticalAlert(payload.new);
                }
                this.refreshFromDatabase();
            })
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    // OK
                }
            });
    }

    setupStorageSync() {
        window.addEventListener('storage', (event) => {
            if (event.key !== 'cm_monitoring_errors_changed_at') return;
            this.refreshFromDatabase();
        });
    }

    /**
     * Traiter une nouvelle erreur en temps réel
     */
    handleNewError(error) {
        this.errors.unshift(error);
        this.stats.total++;
        this.stats.today++;
        
        if (error.error_type === 'critical') {
            this.stats.critical++;
            this.showCriticalAlert(error);
        } else if (error.error_type === 'warning') {
            this.stats.warning++;
        }

        this.updateDashboard();
        this.checkBurstErrors();
    }

    /**
     * Afficher une alerte critique
     */
    showCriticalAlert(error) {
        // Notification système si disponible
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('🚨 Erreur Critique Détectée', {
                body: error.message.substring(0, 100),
                icon: '/images/favicon.png',
                badge: '/images/favicon.png',
                tag: 'critical-error',
                requireInteraction: true
            });
        }

        // Son d'alerte (optionnel)
        this.playAlertSound();

        // Toast notification dans l'interface
        this.showToast({
            type: 'error',
            title: '🚨 ERREUR CRITIQUE',
            message: error.message,
            persistent: true,
            actions: [
                {
                    label: 'Voir détails',
                    callback: () => this.showErrorDetails(error)
                },
                {
                    label: 'Ignorer',
                    callback: () => {}
                }
            ]
        });
    }

    /**
     * Vérifier les rafales d'erreurs
     */
    checkBurstErrors() {
        const fiveMinutesAgo = Date.now() - this.alertThresholds.burstWindow;
        const recentErrors = this.errors.filter(e => 
            new Date(e.timestamp).getTime() > fiveMinutesAgo
        );

        if (recentErrors.length >= this.alertThresholds.errorBurst) {
            this.showBurstAlert(recentErrors.length);
        }
    }

    /**
     * Alerte rafale d'erreurs
     */
    showBurstAlert(count) {
        this.showToast({
            type: 'warning',
            title: '⚠️ RAFALE D\'ERREURS DÉTECTÉE',
            message: `${count} erreurs détectées en 5 minutes`,
            persistent: true
        });
    }

    /**
     * Jouer un son d'alerte
     */
    playAlertSound() {
        try {
            if (!this.notificationSound) {
                // Créer un beep simple avec Web Audio API
                const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                oscillator.frequency.value = 800;
                oscillator.type = 'sine';
                
                gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
                
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.5);
            }
        } catch (err) {
            // Ignorer si audio non disponible
        }
    }

    /**
     * Afficher un toast
     */
    showToast({ type, title, message, persistent = false, actions = [] }) {
        const toast = document.createElement('div');
        toast.className = `error-toast error-toast--${type}`;
        toast.innerHTML = `
            <div class="error-toast__header">
                <strong>${title}</strong>
                <button class="error-toast__close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
            <div class="error-toast__message">${message}</div>
            ${actions.length > 0 ? `
                <div class="error-toast__actions">
                    ${actions.map((action, idx) => `
                        <button class="btn btn-sm" data-action-idx="${idx}">${action.label}</button>
                    `).join('')}
                </div>
            ` : ''}
        `;

        // Ajouter les handlers aux boutons d'action
        actions.forEach((action, idx) => {
            const btn = toast.querySelector(`[data-action-idx="${idx}"]`);
            if (btn) {
                btn.addEventListener('click', () => {
                    action.callback();
                    toast.remove();
                });
            }
        });

        let toastContainer = document.getElementById('error-toast-container');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'error-toast-container';
            toastContainer.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                max-width: 400px;
            `;
            document.body.appendChild(toastContainer);
        }

        toastContainer.appendChild(toast);

        // Auto-dismiss si non persistant
        if (!persistent) {
            setTimeout(() => toast.remove(), 5000);
        }
    }

    /**
     * Render le dashboard de surveillance
     */
    renderDashboard() {
        let container = document.getElementById('error-monitor-dashboard');
        
        if (!container) {
            container = document.createElement('div');
            container.id = 'error-monitor-dashboard';
            container.className = 'error-monitor-dashboard';
            
            // Trouver un emplacement approprié (header ou début du contenu)
            const header = document.querySelector('.admin-header') || document.querySelector('header');
            if (header) {
                header.after(container);
            } else {
                document.body.insertBefore(container, document.body.firstChild);
            }
        }

        container.innerHTML = `
            <div class="error-monitor">
                <div class="error-monitor__header">
                    <h3>🚨 Surveillance Erreurs</h3>
                    <button class="btn btn-sm" onclick="window.errorMonitor.toggleExpanded()">
                        <span id="error-monitor-toggle">▼</span>
                    </button>
                </div>
                
                <div class="error-monitor__stats">
                    <div class="stat-card stat-card--critical">
                        <div class="stat-value">${this.stats.critical}</div>
                        <div class="stat-label">Critiques</div>
                    </div>
                    <div class="stat-card stat-card--warning">
                        <div class="stat-value">${this.stats.warning}</div>
                        <div class="stat-label">Warnings</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${this.stats.today}</div>
                        <div class="stat-label">Aujourd'hui</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${this.stats.total}</div>
                        <div class="stat-label">Total</div>
                    </div>
                </div>

                <div class="error-monitor__content" id="error-monitor-content" style="display: none;">
                    <div class="error-monitor__filters">
                        <select id="error-type-filter" onchange="window.errorMonitor.filterErrors()">
                            <option value="all">Tous les types</option>
                            <option value="critical">Critiques uniquement</option>
                            <option value="warning">Warnings uniquement</option>
                        </select>
                        <input 
                            type="text" 
                            id="error-user-filter" 
                            placeholder="Filtrer par UUID ou email client..." 
                            onkeyup="window.errorMonitor.filterErrors()"
                            style="padding: 5px 10px; border: 1px solid #ddd; border-radius: 4px; margin-left: 10px; width: 250px;"
                        />
                        <button class="btn btn-sm btn-danger" onclick="window.errorMonitor.clearResolved()">
                            🗑️ Effacer résolues
                        </button>
                    </div>

                    <div class="error-monitor__list" id="error-list">
                        ${this.renderErrorList()}
                    </div>
                </div>
            </div>
        `;

        this.addStyles();
    }

    /**
     * Render la liste des erreurs
     */
    renderErrorList() {
        if (this.errors.length === 0) {
            return '<div class="error-empty">✅ Aucune erreur récente</div>';
        }

        return this.errors.slice(0, 20).map(error => {
            const affectedCount = error.affected_users ? (Array.isArray(error.affected_users) ? error.affected_users.length : 0) : 0;
            const occurrences = error.occurrence_count || 1;
            const lastOccurrence = error.last_occurrence || error.timestamp;
            
            return `
            <div class="error-item error-item--${error.error_type}" data-error-id="${error.id}">
                <div class="error-item__header">
                    <span class="error-badge error-badge--${error.error_type}">
                        ${error.error_type === 'critical' ? '🔴' : '⚠️'} ${error.error_type.toUpperCase()}
                    </span>
                    <span class="error-time">${this.formatTime(lastOccurrence)}</span>
                    ${occurrences > 1 ? `<span class="error-badge error-badge--count" title="Occurrences">🔄 ${occurrences}x</span>` : ''}
                </div>
                <div class="error-item__message">${this.escapeHtml(error.message)}</div>
                <div class="error-item__meta">
                    <span>📁 ${this.getFileName(error.source)}</span>
                    ${error.user_email ? `<span>👤 ${error.user_email}</span>` : ''}
                    ${affectedCount > 0 ? `<span title="${affectedCount} client(s) affecté(s)">👥 ${affectedCount}</span>` : ''}
                    ${error.user_id && affectedCount === 0 ? `<span title="UUID Client">🆔 ${error.user_id.substring(0, 8)}...</span>` : ''}
                </div>
                <div class="error-item__actions">
                    <button class="btn-link" onclick="window.errorMonitor.showErrorDetails('${error.id}')">
                        Détails
                    </button>
                    <button class="btn-link btn-danger" onclick="if(confirm('Supprimer cette erreur de la BDD ?')) window.errorMonitor.markAsResolved('${error.id}')">
                        ✓ Corriger
                    </button>
                    ${error.user_id ? `
                        <button class="btn-link" onclick="navigator.clipboard.writeText('${error.user_id}');alert('UUID copié !')" title="Copier UUID">
                            📋 UUID
                        </button>
                    ` : ''}
                </div>
            </div>
        `}).join('');
    }

    /**
     * Mettre à jour le dashboard
     */
    updateDashboard() {
        const listElement = document.getElementById('error-list');
        if (listElement) {
            listElement.innerHTML = this.renderErrorList();
        }

        // Mettre à jour les stats
        document.querySelectorAll('.error-monitor__stats .stat-value').forEach((el, idx) => {
            const values = [this.stats.critical, this.stats.warning, this.stats.today, this.stats.total];
            el.textContent = values[idx];
        });
    }

    /**
     * Toggle expanded state
     */
    toggleExpanded() {
        const content = document.getElementById('error-monitor-content');
        const toggle = document.getElementById('error-monitor-toggle');
        
        if (content.style.display === 'none') {
            content.style.display = 'block';
            toggle.textContent = '▲';
        } else {
            content.style.display = 'none';
            toggle.textContent = '▼';
        }
    }

    /**
     * Afficher les détails d'une erreur
     */
    async showErrorDetails(errorId) {
        const error = this.errors.find(e => e.id === errorId);
        if (!error) return;

        const modal = document.createElement('div');
        modal.className = 'modal modal-error-details';
        modal.innerHTML = `
            <div class="modal-overlay" onclick="this.parentElement.remove()"></div>
            <div class="modal-content">
                <div class="modal-header">
                    <h2>🔍 Détails de l'erreur</h2>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">×</button>
                </div>
                <div class="modal-body">
                    <div class="error-detail-section">
                        <strong>Type:</strong>
                        <span class="error-badge error-badge--${error.error_type}">${error.error_type}</span>
                    </div>
                    <div class="error-detail-section">
                        <strong>Message:</strong>
                        <p>${this.escapeHtml(error.message)}</p>
                    </div>
                    <div class="error-detail-section">
                        <strong>Source:</strong>
                        <code>${error.source || 'N/A'}</code>
                    </div>
                    <div class="error-detail-section">
                        <strong>URL:</strong>
                        <code>${error.url || 'N/A'}</code>
                    </div>
                    ${error.user_email ? `
                        <div class="error-detail-section">
                            <strong>Utilisateur:</strong>
                            <span>${error.user_email}</span>
                        </div>
                    ` : ''}
                    ${error.user_id ? `
                        <div class="error-detail-section">
                            <strong>UUID Client:</strong>
                            <code>${error.user_id}</code>
                            <button class="btn btn-sm" onclick="navigator.clipboard.writeText('${error.user_id}');alert('UUID copié !')" style="margin-left: 10px;">
                                📋 Copier
                            </button>
                        </div>
                    ` : ''}
                    ${error.stack_trace ? `
                        <div class="error-detail-section">
                            <strong>Stack Trace:</strong>
                            <pre>${this.escapeHtml(error.stack_trace)}</pre>
                        </div>
                    ` : ''}
                    ${error.metadata ? `
                        <div class="error-detail-section">
                            <strong>Métadonnées:</strong>
                            <pre>${JSON.stringify(error.metadata, null, 2)}</pre>
                        </div>
                    ` : ''}
                    <div class="error-detail-section">
                        <strong>Date:</strong>
                        <span>${new Date(error.timestamp).toLocaleString('fr-FR')}</span>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-danger" onclick="window.errorMonitor.markAsResolved('${errorId}'); this.closest('.modal').remove();">
                        ✓ Marquer comme résolu
                    </button>
                    <button class="btn" onclick="this.closest('.modal').remove()">Fermer</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    /**
     * Marquer une erreur comme résolue (SUPPRESSION de la BDD)
     */
    async markAsResolved(errorId) {
        try {
            // SUPPRIMER l'erreur au lieu de la marquer resolved
            const { error } = await window.supabaseClient
                .from('cm_error_logs')
                .delete()
                .eq('id', errorId);

            if (error) throw error;

            await this.refreshFromDatabase();

            try {
                localStorage.setItem('cm_monitoring_errors_changed_at', String(Date.now()));
            } catch (storageError) {
                // ignore
            }

            this.showToast({
                type: 'success',
                title: '✓ Erreur corrigée et supprimée',
                message: 'L\'erreur a été retirée de la base de données.'
            });
        } catch (err) {
            console.error('❌ Erreur lors de la suppression:', err);
        }
    }

    /**
     * Effacer toutes les erreurs résolues
     */
    async clearResolved() {
        if (!confirm('Effacer toutes les erreurs marquées comme résolues ?')) return;

        try {
            const { error } = await window.supabaseClient
                .from('cm_error_logs')
                .delete()
                .eq('resolved', true);

            if (error) throw error;

            await this.refreshFromDatabase();

            this.showToast({
                type: 'success',
                title: '✓ Erreurs effacées',
                message: 'Les erreurs résolues ont été supprimées.'
            });
        } catch (err) {
            console.error('❌ Erreur lors de la suppression:', err);
        }
    }

    /**
     * Filtrer les erreurs
     */
    filterErrors() {
        const typeFilter = document.getElementById('error-type-filter')?.value || 'all';
        const userFilter = document.getElementById('error-user-filter')?.value.toLowerCase().trim() || '';
        const listElement = document.getElementById('error-list');
        if (!listElement) return;

        const items = listElement.querySelectorAll('.error-item');
        items.forEach(item => {
            const errorId = item.getAttribute('data-error-id');
            const error = this.errors.find(e => e.id === errorId);
            if (!error) return;

            // Filtre par type
            const typeMatch = typeFilter === 'all' || item.classList.contains(`error-item--${typeFilter}`);
            
            // Filtre par user (UUID ou email)
            let userMatch = true;
            if (userFilter) {
                const userId = error.user_id?.toLowerCase() || '';
                const userEmail = error.user_email?.toLowerCase() || '';
                userMatch = userId.includes(userFilter) || userEmail.includes(userFilter);
            }

            // Afficher si les deux filtres matchent
            if (typeMatch && userMatch) {
                item.style.display = 'block';
            } else {
                item.style.display = 'none';
            }
        });
    }

    /**
     * Demander la permission pour les notifications
     */
    async requestNotificationPermission() {
        if ('Notification' in window && Notification.permission === 'default') {
            await Notification.requestPermission();
        }
    }

    /**
     * Utilitaires
     */
    formatTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        
        if (diffMins < 1) return 'À l\'instant';
        if (diffMins < 60) return `Il y a ${diffMins} min`;
        if (diffMins < 1440) return `Il y a ${Math.floor(diffMins / 60)} h`;
        return date.toLocaleDateString('fr-FR');
    }

    getFileName(path) {
        if (!path) return 'unknown';
        return path.split('/').pop() || path;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Ajouter les styles
     */
    addStyles() {
        if (document.getElementById('error-monitor-styles')) return;

        const style = document.createElement('style');
        style.id = 'error-monitor-styles';
        style.textContent = `
            .error-monitor-dashboard {
                margin: 20px;
                margin-left: 270px; /* 250px sidebar + 20px marge */
                background: var(--card-bg, #fff);
                border-radius: 8px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                overflow: hidden;
                position: relative;
                z-index: 1;
            }

            .error-monitor__header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 15px 20px;
                background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%);
                color: white;
            }

            .error-monitor__header h3 {
                margin: 0;
                font-size: 18px;
            }

            .error-monitor__stats {
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 15px;
                padding: 20px;
                background: var(--bg-light, #f8f9fa);
            }

            .stat-card {
                background: white;
                padding: 15px;
                border-radius: 6px;
                text-align: center;
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            }

            .stat-card--critical {
                border-left: 4px solid #dc3545;
            }

            .stat-card--warning {
                border-left: 4px solid #ffc107;
            }

            .stat-value {
                font-size: 28px;
                font-weight: bold;
                color: var(--text-primary, #333);
            }

            .stat-label {
                font-size: 12px;
                color: var(--text-secondary, #666);
                margin-top: 5px;
            }

            .error-monitor__content {
                padding: 20px;
            }

            .error-monitor__filters {
                display: flex;
                gap: 10px;
                margin-bottom: 15px;
            }

            .error-monitor__list {
                max-height: 500px;
                overflow-y: auto;
            }

            .error-item {
                background: white;
                border-left: 4px solid #6c757d;
                padding: 15px;
                margin-bottom: 10px;
                border-radius: 4px;
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            }

            .error-item--critical {
                border-left-color: #dc3545;
            }

            .error-item--warning {
                border-left-color: #ffc107;
            }

            .error-item__header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 10px;
            }

            .error-badge {
                display: inline-block;
                padding: 3px 8px;
                border-radius: 3px;
                font-size: 11px;
                font-weight: bold;
                text-transform: uppercase;
            }

            .error-badge--critical {
                background: #dc3545;
                color: white;
            }

            .error-badge--warning {
                background: #ffc107;
                color: #000;
            }

            .error-badge--count {
                background: #6c757d;
                color: white;
                font-size: 11px;
                padding: 2px 6px;
                margin-left: 5px;
            }

            .error-time {
                font-size: 12px;
                color: #666;
            }

            .error-item__message {
                font-size: 14px;
                margin-bottom: 10px;
                color: var(--text-primary, #333);
            }

            .error-item__meta {
                display: flex;
                gap: 15px;
                font-size: 12px;
                color: #666;
                margin-bottom: 10px;
            }

            .error-item__actions {
                display: flex;
                gap: 10px;
            }

            .btn-link {
                background: none;
                border: none;
                color: #007bff;
                cursor: pointer;
                font-size: 13px;
                text-decoration: underline;
            }

            .btn-link:hover {
                color: #0056b3;
            }

            .error-empty {
                text-align: center;
                padding: 40px;
                color: #666;
                font-size: 16px;
            }

            .error-toast {
                background: white;
                border-radius: 6px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                margin-bottom: 10px;
                padding: 15px;
                border-left: 4px solid #6c757d;
                animation: slideIn 0.3s ease;
            }

            @keyframes slideIn {
                from {
                    transform: translateX(400px);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }

            .error-toast--error {
                border-left-color: #dc3545;
            }

            .error-toast--warning {
                border-left-color: #ffc107;
            }

            .error-toast--success {
                border-left-color: #28a745;
            }

            .error-toast__header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 8px;
            }

            .error-toast__close {
                background: none;
                border: none;
                font-size: 24px;
                cursor: pointer;
                color: #666;
                padding: 0;
                width: 24px;
                height: 24px;
                line-height: 1;
            }

            .error-toast__message {
                font-size: 14px;
                color: #333;
                margin-bottom: 10px;
            }

            .error-toast__actions {
                display: flex;
                gap: 8px;
            }

            .modal-error-details .modal-content {
                max-width: 800px;
            }

            .error-detail-section {
                margin-bottom: 15px;
                padding-bottom: 15px;
                border-bottom: 1px solid #eee;
            }

            .error-detail-section:last-child {
                border-bottom: none;
            }

            .error-detail-section strong {
                display: block;
                margin-bottom: 5px;
                color: var(--text-primary, #333);
            }

            .error-detail-section pre {
                background: #f8f9fa;
                padding: 10px;
                border-radius: 4px;
                overflow-x: auto;
                font-size: 12px;
            }

            .error-detail-section code {
                background: #f8f9fa;
                padding: 2px 6px;
                border-radius: 3px;
                font-size: 13px;
            }
        `;
        
        document.head.appendChild(style);
    }

    /**
     * Récupérer les erreurs d'un client spécifique (pour tickets support)
     * @param {string} userId - UUID du client
     * @param {number} limitDays - Nombre de jours à regarder en arrière (défaut: 7)
     * @returns {Promise<Array>} Liste des erreurs du client
     */
    async getClientErrors(userId, limitDays = 7) {
        try {
            const sinceDate = new Date(Date.now() - limitDays * 24 * 60 * 60 * 1000).toISOString();
            
            const { data, error } = await window.supabaseClient
                .from('cm_error_logs')
                .select('*')
                .eq('user_id', userId)
                .gte('timestamp', sinceDate)
                .order('timestamp', { ascending: false });

            if (error) throw error;

            return data || [];
        } catch (err) {
            console.error('❌ Erreur récupération erreurs client:', err);
            return [];
        }
    }

    /**
     * Formatter les erreurs pour email/ticket support
     * @param {Array} errors - Liste des erreurs
     * @returns {string} Rapport formaté
     */
    formatErrorsReport(errors) {
        if (errors.length === 0) {
            return '✅ Aucune erreur détectée pour ce client.';
        }

        let report = `📊 RAPPORT D'ERREURS CLIENT\n`;
        report += `${'='.repeat(50)}\n\n`;
        report += `Période: ${new Date(errors[errors.length - 1].timestamp).toLocaleDateString('fr-FR')} - ${new Date(errors[0].timestamp).toLocaleDateString('fr-FR')}\n`;
        report += `Nombre d'erreurs: ${errors.length}\n\n`;

        // Stats par type
        const critical = errors.filter(e => e.error_type === 'critical').length;
        const warning = errors.filter(e => e.error_type === 'warning').length;
        report += `🔴 Critiques: ${critical}\n`;
        report += `⚠️ Warnings: ${warning}\n\n`;

        report += `${'='.repeat(50)}\n\n`;

        // Liste des erreurs
        errors.slice(0, 10).forEach((error, idx) => {
            report += `${idx + 1}. [${error.error_type.toUpperCase()}] ${new Date(error.timestamp).toLocaleString('fr-FR')}\n`;
            report += `   Message: ${error.message}\n`;
            report += `   Source: ${error.source}\n`;
            if (error.url) {
                report += `   URL: ${error.url}\n`;
            }
            report += `\n`;
        });

        if (errors.length > 10) {
            report += `\n... et ${errors.length - 10} autres erreurs\n`;
        }

        return report;
    }

    /**
     * Cleanup
     */
    destroy() {
        if (this.realtimeSubscription) {
            this.realtimeSubscription.unsubscribe();
        }
    }
}

// Export global
window.AdminErrorMonitor = AdminErrorMonitor;

// Auto-init si on est sur une page admin
if (window.location.pathname.includes('admin')) {
    document.addEventListener('DOMContentLoaded', async () => {
        // Attendre que Supabase soit prêt
        const waitForSupabase = setInterval(() => {
            if (window.supabaseClient) {
                clearInterval(waitForSupabase);
                window.errorMonitor = new AdminErrorMonitor();
                window.errorMonitor.init();
                window.errorMonitor.requestNotificationPermission();
            }
        }, 100);

        // Timeout après 10 secondes
        setTimeout(() => clearInterval(waitForSupabase), 10000);
    });
}
