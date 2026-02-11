// ================================================================
// 🎫 TICKET WORKFLOW - Système de suivi complet
// ================================================================

class TicketWorkflow {
    constructor(ticketId) {
        this.ticketId = ticketId;
        this.ticket = null;
        this.history = [];
    }

    /**
     * Charger toutes les données du ticket
     */
    async load() {
        await Promise.all([
            this.loadTicket(),
            this.loadHistory(),
            this.loadError(),
            this.loadCorrections()
        ]);
    }

    /**
     * Charger les détails du ticket
     */
    async loadTicket() {
        const { data, error } = await window.supabaseClient
            .from('cm_support_tickets')
            .select('*')
            .eq('id', this.ticketId)
            .single();
        
        if (error) throw error;
        
        this.ticket = data;
        return data;
    }

    /**
     * Charger l'historique du ticket
     */
    async loadHistory() {
        const { data, error } = await window.supabaseClient
            .from('cm_support_ticket_history')
            .select('*')
            .eq('ticket_id', this.ticketId)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        this.history = data || [];
        return this.history;
    }

    /**
     * Charger l'erreur liée
     */
    async loadError() {
        if (!this.ticket?.error_id) return null;
        
        const { data, error } = await window.supabaseClient
            .from('cm_error_logs')
            .select('*')
            .eq('id', this.ticket.error_id)
            .single();
        
        if (error) console.warn('Erreur non trouvée:', error);
        
        this.error = data;
        return data;
    }

    /**
     * Charger les corrections apportées
     */
    async loadCorrections() {
        if (!this.ticket?.error_id) return [];
        
        const { data, error } = await window.supabaseClient
            .from('cm_error_corrections')
            .select('*')
            .eq('error_id', this.ticket.error_id)
            .order('applied_at', { ascending: false });
        
        if (error) console.warn('Corrections non trouvées:', error);
        
        this.corrections = data || [];
        return this.corrections;
    }

    /**
     * Changer le statut du ticket
     */
    async changeStatus(newStatus, note = null) {
        const { error } = await window.supabaseClient
            .from('cm_support_tickets')
            .update({
                statut: newStatus,
                ...(newStatus === 'ferme' || newStatus === 'resolu' ? {
                    closed_at: new Date().toISOString()
                } : {})
            })
            .eq('id', this.ticketId);
        
        if (error) throw error;
        
        // Ajouter à l'historique
        await this.addHistory('status_changed', 
            `Statut changé vers: ${this.getStatusLabel(newStatus)}${note ? '\n' + note : ''}`
        );
        
        return true;
    }

    /**
     * Assigner le ticket
     */
    async assign(assignedTo, note = null) {
        const { error } = await window.supabaseClient
            .from('cm_support_tickets')
            .update({
                metadata: {
                    ...this.ticket.metadata,
                    assigned_to: assignedTo,
                    assigned_at: new Date().toISOString()
                }
            })
            .eq('id', this.ticketId);
        
        if (error) throw error;
        
        await this.addHistory('assigned', 
            `Ticket assigné à: ${assignedTo}${note ? '\n' + note : ''}`
        );
        
        return true;
    }

    /**
     * Ajouter un commentaire
     */
    async addComment(comment, author = 'admin') {
        await this.addHistory('comment', comment, author);
        return true;
    }

    /**
     * Ajouter une entrée à l'historique
     */
    async addHistory(action, description, createdBy = 'admin') {
        const { data, error } = await window.supabaseClient
            .from('cm_support_ticket_history')
            .insert({
                ticket_id: this.ticketId,
                action,
                description,
                created_by: createdBy
            })
            .select()
            .single();
        
        if (error) throw error;
        
        this.history.unshift(data);
        return data;
    }

    /**
     * Générer HTML de la timeline
     */
    renderTimeline() {
        if (!this.history || this.history.length === 0) {
            return `<p style="text-align: center; color: #64748b; padding: 20px;">Aucun historique</p>`;
        }
        
        return this.history.map(entry => {
            const icon = this.getActionIcon(entry.action);
            const color = this.getActionColor(entry.action);
            
            return `
                <div class="timeline-entry" style="display: flex; gap: 15px; padding: 15px 0; border-bottom: 1px solid #e2e8f0;">
                    <div style="flex-shrink: 0;">
                        <div style="width: 40px; height: 40px; background: ${color}; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white;">
                            <i data-lucide="${icon}" style="width: 20px; height: 20px;"></i>
                        </div>
                    </div>
                    <div style="flex: 1;">
                        <div style="font-weight: 600; color: #1e293b; margin-bottom: 4px;">
                            ${this.getActionLabel(entry.action)}
                        </div>
                        <div style="color: #475569; font-size: 14px; margin-bottom: 8px; white-space: pre-wrap;">
                            ${entry.description}
                        </div>
                        <div style="font-size: 12px; color: #64748b;">
                            ${new Date(entry.created_at).toLocaleString('fr-FR')} • Par ${entry.created_by}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    /**
     * Générer HTML du résumé du ticket
     */
    renderSummary() {
        if (!this.ticket) return '';
        
        return `
            <div class="ticket-summary" style="background: white; border-radius: 12px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 20px;">
                    <div>
                        <h2 style="margin: 0 0 8px 0; color: #1e293b;">
                            Ticket #${this.ticket.id}
                        </h2>
                        <p style="margin: 0; color: #64748b; font-size: 14px;">
                            Créé le ${new Date(this.ticket.created_at).toLocaleString('fr-FR')}
                        </p>
                    </div>
                    <span class="status-badge" style="background: ${this.getStatusColor(this.ticket.statut)}; color: white; padding: 6px 12px; border-radius: 6px; font-size: 13px; font-weight: 600;">
                        ${this.getStatusLabel(this.ticket.statut)}
                    </span>
                </div>
                
                <div style="margin-bottom: 20px;">
                    <h3 style="margin: 0 0 8px 0; color: #1e293b; font-size: 18px;">
                        ${this.ticket.sujet}
                    </h3>
                    <div style="color: #475569; line-height: 1.6; white-space: pre-wrap;">
                        ${this.ticket.description}
                    </div>
                </div>
                
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; padding-top: 15px; border-top: 1px solid #e2e8f0;">
                    <div>
                        <div style="color: #64748b; font-size: 12px; margin-bottom: 4px;">Client</div>
                        <div style="color: #1e293b; font-weight: 600;">${this.ticket.client_email || 'N/A'}</div>
                    </div>
                    <div>
                        <div style="color: #64748b; font-size: 12px; margin-bottom: 4px;">Priorité</div>
                        <div style="color: #1e293b; font-weight: 600;">${this.getPriorityLabel(this.ticket.priorite)}</div>
                    </div>
                    <div>
                        <div style="color: #64748b; font-size: 12px; margin-bottom: 4px;">Catégorie</div>
                        <div style="color: #1e293b; font-weight: 600;">${this.ticket.categorie || 'N/A'}</div>
                    </div>
                    <div>
                        <div style="color: #64748b; font-size: 12px; margin-bottom: 4px;">Source</div>
                        <div style="color: #1e293b; font-weight: 600;">${this.ticket.source === 'auto_detection' ? '🤖 Auto' : '👤 Manuel'}</div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Générer HTML de la section erreur
     */
    renderErrorSection() {
        if (!this.error) return '';
        
        return `
            <div class="error-section" style="background: white; border-radius: 12px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); margin-top: 20px;">
                <h3 style="margin: 0 0 15px 0; color: #1e293b; display: flex; align-items: center; gap: 10px;">
                    <i data-lucide="alert-circle" style="width: 20px; height: 20px; color: #ef4444;"></i>
                    Erreur associée
                </h3>
                
                <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 15px;">
                    <div style="font-weight: 600; color: #991b1b; margin-bottom: 8px;">
                        ${this.error.source}${this.error.metadata?.lineno ? `:${this.error.metadata.lineno}` : ''}
                    </div>
                    <div style="color: #7f1d1d; margin-bottom: 12px;">
                        ${this.error.message}
                    </div>
                    <div style="font-size: 12px; color: #991b1b;">
                        Dernière occurrence: ${new Date(this.error.timestamp).toLocaleString('fr-FR')}
                    </div>
                </div>
                
                ${this.corrections?.length > 0 ? `
                <div style="margin-top: 15px;">
                    <h4 style="margin: 0 0 10px 0; color: #1e293b; font-size: 14px;">
                        Corrections apportées (${this.corrections.length})
                    </h4>
                    ${this.corrections.map(corr => `
                        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 12px; margin-bottom: 10px;">
                            <div style="font-weight: 600; color: #166534; margin-bottom: 4px;">
                                ${corr.file_path}
                            </div>
                            <div style="color: #15803d; font-size: 13px; margin-bottom: 8px;">
                                ${corr.description}
                            </div>
                            <div style="font-size: 11px; color: #166534;">
                                Par ${corr.applied_by} • ${new Date(corr.applied_at).toLocaleString('fr-FR')}
                            </div>
                        </div>
                    `).join('')}
                </div>
                ` : ''}
            </div>
        `;
    }

    // Helpers
    getStatusColor(status) {
        const colors = {
            'ouvert': '#ef4444',
            'en_cours': '#f59e0b',
            'en_attente_client': '#06b6d4',
            'resolu': '#10b981',
            'ferme': '#64748b'
        };
        return colors[status] || '#64748b';
    }

    getStatusLabel(status) {
        const labels = {
            'ouvert': 'Ouvert',
            'en_cours': 'En cours',
            'en_attente_client': 'En attente client',
            'resolu': 'Résolu',
            'ferme': 'Fermé'
        };
        return labels[status] || status;
    }

    getPriorityLabel(priority) {
        const labels = {
            'haute': '🔴 Haute',
            'moyenne': '🟡 Moyenne',
            'basse': '🟢 Basse'
        };
        return labels[priority] || priority;
    }

    getActionIcon(action) {
        const icons = {
            'created': 'plus-circle',
            'status_changed': 'trending-up',
            'assigned': 'user-check',
            'comment': 'message-circle',
            'email_sent': 'mail',
            'auto_closed': 'check-circle'
        };
        return icons[action] || 'activity';
    }

    getActionColor(action) {
        const colors = {
            'created': '#06b6d4',
            'status_changed': '#f59e0b',
            'assigned': '#8b5cf6',
            'comment': '#3b82f6',
            'email_sent': '#10b981',
            'auto_closed': '#64748b'
        };
        return colors[action] || '#64748b';
    }

    getActionLabel(action) {
        const labels = {
            'created': 'Ticket créé',
            'status_changed': 'Statut modifié',
            'assigned': 'Assigné',
            'comment': 'Commentaire',
            'email_sent': 'Email envoyé',
            'auto_closed': 'Clôture automatique'
        };
        return labels[action] || action;
    }
}

// Export
window.TicketWorkflow = TicketWorkflow;
