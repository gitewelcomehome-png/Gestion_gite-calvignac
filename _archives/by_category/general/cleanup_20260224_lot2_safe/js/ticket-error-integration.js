/**
 * 🎫 SYSTÈME D'INTÉGRATION ERREURS → TICKETS SUPPORT
 * ===================================================
 * Intégration automatique des erreurs d'un client dans les tickets support
 * 
 * Fonctionnalités :
 * 1. Récupérer erreurs d'un client (déduplication + multi-users)
 * 2. Formater pour insertion dans conversation
 * 3. Insérer automatiquement dans ticket
 * 4. Générer message formaté pour email
 */

class TicketErrorIntegration {
    constructor() {
        this.supabase = window.supabaseClient;
    }

    /**
     * Récupérer les erreurs d'un client via RPC PostgreSQL
     * @param {string} userId - UUID du client
     * @param {number} daysBack - Nombre de jours à analyser (défaut: 7)
     * @returns {Promise<Array>} Liste des erreurs avec stats
     */
    async getUserErrors(userId, daysBack = 7) {
        try {
            const { data, error } = await this.supabase
                .rpc('get_user_errors', {
                    p_user_id: userId,
                    p_days_back: daysBack
                });

            if (error) throw error;

            return data || [];
        } catch (err) {
            console.error('❌ Erreur récupération erreurs utilisateur:', err);
            return [];
        }
    }

    /**
     * Formater les erreurs pour texte de conversation ticket
     * @param {string} userId - UUID du client
     * @param {number} daysBack - Nombre de jours
     * @returns {Promise<string>} Message formaté prêt pour insertion
     */
    async formatErrorsForTicket(userId, daysBack = 7) {
        try {
            const { data, error } = await this.supabase
                .rpc('format_user_errors_for_ticket', {
                    p_user_id: userId,
                    p_days_back: daysBack
                });

            if (error) throw error;

            return data || '✅ Aucune erreur active détectée pour ce client.';
        } catch (err) {
            console.error('❌ Erreur formatage erreurs:', err);
            return '❌ Erreur lors de la récupération des erreurs.';
        }
    }

    /**
     * Générer un message HTML pour conversation ticket
     * @param {string} userId - UUID du client
     * @param {number} daysBack - Nombre de jours
     * @returns {Promise<string>} HTML formaté
     */
    async formatErrorsHtml(userId, daysBack = 7) {
        const errors = await this.getUserErrors(userId, daysBack);

        if (errors.length === 0) {
            return `
                <div class="ticket-error-section success">
                    <p>✅ Aucune erreur active détectée pour ce client.</p>
                </div>
            `;
        }

        const critical = errors.filter(e => e.error_type === 'critical').length;
        const warning = errors.filter(e => e.error_type === 'warning').length;

        let html = `
            <div class="ticket-error-section warning">
                <h4>⚠️ Erreurs détectées automatiquement</h4>
                <p><strong>${errors.length} erreur(s) active(s)</strong> dans les ${daysBack} derniers jours</p>
                <div class="error-stats">
                    <span class="badge badge-critical">🔴 ${critical} Critiques</span>
                    <span class="badge badge-warning">⚠️ ${warning} Warnings</span>
                </div>
                <div class="error-list">
        `;

        errors.forEach((error, idx) => {
            html += `
                <div class="error-item ${error.error_type}">
                    <div class="error-header">
                        <span class="badge badge-${error.error_type}">${error.error_type.toUpperCase()}</span>
                        <span class="error-occurrences">🔄 ${error.occurrence_count}x</span>
                        <span class="error-users">👥 ${error.affected_users_count} client(s)</span>
                    </div>
                    <div class="error-message">${this.escapeHtml(error.message)}</div>
                    <div class="error-meta">
                        <small>📁 ${error.source}</small>
                        <small>🕐 ${this.formatDate(error.last_occurrence)}</small>
                    </div>
                </div>
            `;
        });

        html += `
                </div>
            </div>
        `;

        return html;
    }

    /**
     * Insérer automatiquement les erreurs dans un ticket lors de sa création
     * Exemple d'utilisation avec votre système de tickets
     * @param {string} ticketId - ID du ticket
     * @param {string} userId - UUID du client
     * @param {number} daysBack - Nombre de jours
     */
    async attachErrorsToTicket(ticketId, userId, daysBack = 7) {
        try {
            const errors = await this.getUserErrors(userId, daysBack);

            if (errors.length === 0) {
                // Pas d'erreurs, ne rien ajouter
                return;
            }

            // Formater le message
            const errorText = await this.formatErrorsForTicket(userId, daysBack);

            // Construire le message de conversation
            const ticketMessage = {
                ticket_id: ticketId,
                sender: 'system',
                message: errorText,
                message_type: 'error_report',
                created_at: new Date().toISOString()
            };

            // Insérer dans la table des messages du ticket
            // ⚠️ ADAPTER selon votre structure de BDD
            const { error } = await this.supabase
                .from('ticket_messages') // ← Nom de votre table
                .insert(ticketMessage);

            if (error) throw error;

            return true;
        } catch (err) {
            console.error('❌ Erreur attachment erreurs au ticket:', err);
            return false;
        }
    }

    /**
     * Créer un ticket avec injection automatique des erreurs
     * @param {Object} ticketData - Données du ticket
     * @returns {Promise<Object>} Ticket créé avec erreurs
     */
    async createTicketWithErrors(ticketData) {
        const { user_id, subject, message, priority, category } = ticketData;

        try {
            // 1. Créer le ticket
            // ⚠️ ADAPTER selon votre structure
            const { data: ticket, error: ticketError } = await this.supabase
                .from('support_tickets') // ← Nom de votre table
                .insert({
                    user_id: user_id,
                    subject: subject,
                    message: message,
                    priority: priority || 'normal',
                    category: category || 'general',
                    status: 'open',
                    created_at: new Date().toISOString()
                })
                .select()
                .single();

            if (ticketError) throw ticketError;

            // 2. Récupérer les erreurs du client
            const errors = await this.getUserErrors(user_id, 7);

            // 3. Ajuster la priorité si erreurs critiques
            if (errors.some(e => e.error_type === 'critical')) {
                await this.supabase
                    .from('support_tickets')
                    .update({ 
                        priority: 'high',
                        tags: ['erreurs-critiques']
                    })
                    .eq('id', ticket.id);
            }

            // 4. Attacher les erreurs au ticket
            if (errors.length > 0) {
                await this.attachErrorsToTicket(ticket.id, user_id, 7);
            }

            return ticket;

        } catch (err) {
            console.error('❌ Erreur création ticket:', err);
            throw err;
        }
    }

    /**
     * Widget à afficher dans formulaire de création de ticket
     * @param {string} userId - UUID du client
     * @param {string} containerId - ID du container HTML
     */
    async renderErrorWidget(userId, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const errors = await this.getUserErrors(userId, 7);

        if (errors.length === 0) {
            container.innerHTML = `
                <div class="widget widget-no-errors">
                    <p>✅ Aucune erreur détectée pour ce client</p>
                </div>
            `;
            return;
        }

        const critical = errors.filter(e => e.error_type === 'critical').length;
        const warning = errors.filter(e => e.error_type === 'warning').length;

        container.innerHTML = `
            <div class="widget widget-errors">
                <div class="widget-header">
                    <h4>⚠️ Erreurs détectées</h4>
                </div>
                <div class="widget-body">
                    <div class="widget-stats">
                        <div class="stat">
                            <span class="stat-value">${errors.length}</span>
                            <span class="stat-label">Total</span>
                        </div>
                        <div class="stat stat-critical">
                            <span class="stat-value">${critical}</span>
                            <span class="stat-label">Critiques</span>
                        </div>
                        <div class="stat stat-warning">
                            <span class="stat-value">${warning}</span>
                            <span class="stat-label">Warnings</span>
                        </div>
                    </div>
                    <div class="widget-actions">
                        <button 
                            class="btn btn-sm btn-primary" 
                            onclick="window.ticketErrorIntegration.showErrorModal('${userId}')"
                        >
                            📋 Voir les détails
                        </button>
                        <button 
                            class="btn btn-sm btn-success" 
                            onclick="window.ticketErrorIntegration.copyErrorReport('${userId}')"
                        >
                            📄 Copier le rapport
                        </button>
                    </div>
                    <p class="widget-notice">
                        💡 Ces erreurs seront automatiquement ajoutées au ticket
                    </p>
                </div>
            </div>
        `;
    }

    /**
     * Modal d'affichage des erreurs
     */
    async showErrorModal(userId) {
        const errors = await this.getUserErrors(userId, 7);
        const html = await this.formatErrorsHtml(userId, 7);

        const modal = document.createElement('div');
        modal.className = 'modal modal-errors';
        modal.innerHTML = `
            <div class="modal-overlay" onclick="this.parentElement.remove()"></div>
            <div class="modal-content">
                <div class="modal-header">
                    <h2>🔍 Erreurs du client</h2>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">×</button>
                </div>
                <div class="modal-body">
                    ${html}
                </div>
                <div class="modal-footer">
                    <button class="btn" onclick="this.closest('.modal').remove()">Fermer</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    }

    /**
     * Copier le rapport dans le presse-papier
     */
    async copyErrorReport(userId) {
        const report = await this.formatErrorsForTicket(userId, 7);

        try {
            await navigator.clipboard.writeText(report);
            alert('✅ Rapport copié dans le presse-papier !');
        } catch (err) {
            console.error('❌ Erreur copie:', err);
            alert('❌ Erreur lors de la copie');
        }
    }

    /**
     * Utilitaires
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleString('fr-FR');
    }
}

// Export global
window.TicketErrorIntegration = TicketErrorIntegration;
window.ticketErrorIntegration = new TicketErrorIntegration();
