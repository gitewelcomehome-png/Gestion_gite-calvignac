// ================================================================
// 🎫 AUTO-TICKET SYSTEM - Gestion automatique des tickets support
// ================================================================
// Workflow complet :
// 1. Erreur détectée → Ticket créé automatiquement
// 2. Email envoyé au client
// 3. Monitoring 24h
// 4. Si résolu → Clôture auto + notification
// ================================================================

class AutoTicketSystem {
    constructor() {
        this.activeTickets = new Map();
        this.config = {
            autoCreateTicketThreshold: 1, // Créer ticket DÈS la première erreur
            monitoringDuration: 24 * 60 * 60 * 1000, // 24h
            emailTemplate: 'error-detected',
            ticketPriority: 'high'
        };
    }

    /**
     * Initialisation
     */
    async init() {
        // Écouter les nouvelles erreurs
        this.setupErrorListener();
        
        // Reprendre les tickets en cours
        await this.resumeActiveTickets();
        
        // Système prêt (silencieux)
    }

    /**
     * Écouter les nouvelles erreurs en temps réel
     */
    setupErrorListener() {
        // S'abonner aux changements dans cm_error_logs
        window.supabaseClient
            .channel('error_logs_changes')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'cm_error_logs'
            }, payload => {
                this.handleNewError(payload.new);
            })
            .subscribe();
    }

    /**
     * Gérer une nouvelle erreur
     */
    async handleNewError(error) {
        console.log('🚨 Nouvelle erreur détectée:', error.message);
        
        // Vérifier si cette erreur justifie un ticket
        const shouldCreateTicket = await this.shouldCreateTicket(error);
        
        if (shouldCreateTicket) {
            await this.createAutoTicket(error);
        }
    }

    /**
     * Déterminer si un ticket doit être créé
     */
    async shouldCreateTicket(error) {
        // Vérifier simplement si un ticket existe déjà pour cette erreur
        const signature = this.generateErrorSignature(error);
        const hasExisting = await this.hasExistingTicket(signature, error.id);
        
        // Créer ticket DÈS la première erreur si pas de ticket existant
        return !hasExisting;
    }

    /**
     * Vérifier si un ticket existe déjà pour cette erreur
     */
    async hasExistingTicket(errorSignature, errorId = null) {
        const { data, error } = await window.supabaseClient
            .from('cm_support_tickets')
            .select('*')
            .eq('error_signature', errorSignature)
            .not('statut', 'in', '(resolu,ferme)')
            .limit(1);
        
        if (error) {
            console.error('Erreur vérification ticket existant:', error);
            return false;
        }
        
        return (data && data.length > 0);
    }

    /**
     * CRÉER TICKET AUTOMATIQUEMENT
     */
    async createAutoTicket(error) {
        console.log('🎫 Création auto ticket pour:', error.message);
        
        try {
            const errorSignature = this.generateErrorSignature(error);
            
            // Récupérer TOUS les clients potentiellement affectés
            const affectedClients = await this.getAffectedClients(error);
            const primaryClient = affectedClients[0] || {};
            
            // Créer le ticket dans cm_support_tickets (avec le premier client comme principal)
            const ticketData = {
                client_id: primaryClient.client_id || null,
                client_email: primaryClient.email || error.metadata?.userEmail || 'admin@votre-site.com',
                sujet: `[AUTO] Erreur détectée - ${error.source}`,
                description: this.generateTicketMessage(error),
                priorite: this.config.ticketPriority === 'high' ? 'haute' : 'moyenne',
                statut: 'ouvert',
                categorie: 'bug',
                error_signature: errorSignature,
                error_id: error.id,
                source: 'auto_detection',
                metadata: {
                    auto_created: true,
                    error_details: {
                        file: error.source,
                        line: error.metadata?.lineno,
                        message: error.message,
                        occurrences: 1,
                        first_detected: error.timestamp
                    },
                    monitoring: {
                        start: new Date().toISOString(),
                        duration: this.config.monitoringDuration,
                        auto_close_enabled: true
                    }
                }
            };
            
            const { data: ticket, error: ticketError } = await window.supabaseClient
                .from('cm_support_tickets')
                .insert(ticketData)
                .select()
                .single();
            
            if (ticketError) throw ticketError;
            
            console.log('✅ Ticket créé:', ticket.id);
            
            // Envoyer email à TOUS les clients affectés
            await this.notifyAllAffectedClients(ticket, error, affectedClients);
            
            // Créer notification admin
            await this.createAdminNotification(ticket, error);
            
            // Démarrer le monitoring
            this.startTicketMonitoring(ticket.id, errorSignature);
            
            // Enregistrer dans tracking
            this.activeTickets.set(ticket.id, {
                ticketId: ticket.id,
                errorSignature,
                errorId: error.id,
                startTime: Date.now(),
                status: 'monitoring'
            });
            
            return ticket;
            
        } catch (err) {
            console.error('❌ Erreur création ticket:', err);
            return null;
        }
    }

    /**
     * Générer le message du ticket
     */
    generateTicketMessage(error) {
        return `
🚨 **Erreur Détectée Automatiquement**

Une erreur a été détectée sur votre site et nécessite votre attention.

**Détails de l'erreur :**
- **Fichier** : ${error.source || 'Non identifié'}
- **Message** : ${error.message}
- **Première détection** : ${new Date(error.timestamp).toLocaleString('fr-FR')}
${error.metadata?.lineno ? `- **Ligne** : ${error.metadata.lineno}` : ''}

**Action requise :**
Notre équipe technique a analysé cette erreur et va appliquer une correction.

📧 **Vous recevrez un email dans quelques minutes** avec :
- La description de l'erreur
- Les corrections apportées
- Les instructions de test

**Monitoring actif**
🔍 Cette erreur sera surveillée pendant 24h après correction.
✅ Si aucune réapparition détectée → Clos automatiquement

---

*Ticket créé automatiquement par le système de monitoring*
        `.trim();
    }

    /**
     * Envoyer notification email au client
     */
    async sendClientNotification(ticket, error) {
        console.log('📧 Envoi email client...');
        
        const emailData = {
            to: ticket.client_email,
            subject: `[Ticket #${ticket.id}] Erreur détectée sur votre site`,
            template: 'error-notification',
            data: {
                ticketId: ticket.id,
                errorMessage: error.message,
                errorFile: error.source,
                errorLine: error.metadata?.lineno,
                timestamp: new Date(error.timestamp).toLocaleString('fr-FR'),
                monitoringDuration: '24 heures',
                supportUrl: `${window.location.origin}/pages/client-support.html?ticket=${ticket.id}`
            }
        };
        
        try {
            // Appeler votre API d'envoi d'email
            const response = await fetch('/api/send-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(emailData)
            });
            
            if (!response.ok) throw new Error('Email send failed');
            
            console.log('✅ Email envoyé au client');
            
            // Enregistrer dans historique du ticket
            await this.addTicketHistory(ticket.id, 'email_sent', 'Email de notification envoyé au client');
            
        } catch (err) {
            console.error('❌ Erreur envoi email:', err);
            // Continuer même si email échoue
        }
    }

    /**
     * Créer notification pour l'admin
     */
    async createAdminNotification(ticket, error) {
        // Créer notification dans l'interface admin
        const notification = {
            type: 'auto_ticket',
            title: `Nouveau ticket auto-créé #${ticket.id}`,
            message: `Erreur détectée: ${error.message}`,
            link: `/pages/admin-support.html?ticket=${ticket.id}`,
            priority: 'high',
            read: false,
            metadata: {
                ticketId: ticket.id,
                errorId: error.id,
                errorFile: error.source
            }
        };
        
        // Sauvegarder dans une table notifications_admin si elle existe
        // Sinon utiliser le système de notifications existant
        if (window.NotificationSystem) {
            window.NotificationSystem.show('info', notification.title, notification.message);
        }
        
        console.log('🔔 Notification admin créée');
    }

    /**
     * Démarrer le monitoring d'un ticket
     */
    startTicketMonitoring(ticketId, errorSignature) {
        console.log(`📊 Monitoring lancé pour ticket #${ticketId}`);
        
        // Vérifier toutes les heures
        const checkInterval = setInterval(async () => {
            await this.checkTicketStatus(ticketId, errorSignature);
        }, 60 * 60 * 1000); // Toutes les heures
        
        // Sauvegarder l'interval pour pouvoir le clear
        this.activeTickets.get(ticketId).checkInterval = checkInterval;
    }

    /**
     * Vérifier le statut d'un ticket
     */
    async checkTicketStatus(ticketId, errorSignature) {
        const tracking = this.activeTickets.get(ticketId);
        if (!tracking) return;
        
        const elapsed = Date.now() - tracking.startTime;
        
        // Vérifier si l'erreur a réapparu
        const hasReoccurred = await this.checkErrorReoccurrence(errorSignature, tracking.startTime);
        
        if (hasReoccurred) {
            // Erreur réapparue - Mettre à jour le ticket
            await this.updateTicketStatus(ticketId, 'error_persists');
            console.log(`⚠️ Ticket #${ticketId} - Erreur réapparue`);
        } else if (elapsed >= this.config.monitoringDuration) {
            // 24h passées sans erreur - CLÔTURER
            await this.autoCloseTicket(ticketId);
            
            // Nettoyer le monitoring
            clearInterval(tracking.checkInterval);
            this.activeTickets.delete(ticketId);
        } else {
            console.log(`⏳ Ticket #${ticketId}: ${Math.round(elapsed/1000/60/60)}h / 24h`);
        }
    }

    /**
     * Vérifier si l'erreur a réapparu
     */
    async checkErrorReoccurrence(errorSignature, since) {
        const { data: recentErrors } = await window.supabaseClient
            .from('cm_error_logs')
            .select('*')
            .gte('timestamp', new Date(since).toISOString())
            .eq('resolved', false);
        
        return recentErrors?.some(err => 
            this.generateErrorSignature(err) === errorSignature
        ) || false;
    }

    /**
     * CLÔTURER AUTOMATIQUEMENT UN TICKET
     */
    async autoCloseTicket(ticketId) {
        console.log(`✅ Clôture automatique ticket #${ticketId}`);
        
        try {
            // Mettre à jour le ticket
            const { data: ticket, error } = await window.supabaseClient
                .from('cm_support_tickets')
                .update({
                    statut: 'ferme',
                    resolution: 'auto_closed',
                    closed_at: new Date().toISOString(),
                    metadata: {
                        auto_closed: true,
                        reason: 'No error reoccurrence detected in 24h monitoring period',
                        closed_by: 'system'
                    }
                })
                .eq('id', ticketId)
                .select()
                .single();
            
            if (error) throw error;
            
            // Marquer l'erreur comme résolue
            if (ticket.error_id) {
                await window.supabaseClient
                    .from('cm_error_logs')
                    .update({
                        resolved: true,
                        resolved_at: new Date().toISOString(),
                        resolution_method: 'auto_ticket_closed'
                    })
                    .eq('id', ticket.error_id);
            }
            
            // Envoyer email de clôture au client
            await this.sendClosureEmail(ticket);
            
            // Ajouter historique
            await this.addTicketHistory(ticketId, 'auto_closed', 'Ticket clôturé automatiquement après 24h sans réapparition de l\'erreur');
            
            console.log(`✅ Ticket #${ticketId} clôturé automatiquement`);
            
            return true;
        } catch (err) {
            console.error('❌ Erreur clôture ticket:', err);
            return false;
        }
    }

    /**
     * Envoyer email de clôture
     */
    async sendClosureEmail(ticket) {
        const emailData = {
            to: ticket.client_email,
            subject: `[Ticket #${ticket.id}] Incident résolu ✅`,
            template: 'ticket-closed',
            data: {
                ticketId: ticket.id,
                resolution: 'L\'erreur n\'est pas réapparue en 24h. Le problème est résolu.',
                monitoringDuration: '24 heures',
                closedAt: new Date().toLocaleString('fr-FR')
            }
        };
        
        try {
            await fetch('/api/send-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(emailData)
            });
            
            console.log('✅ Email de clôture envoyé');
        } catch (err) {
            console.error('❌ Erreur envoi email clôture:', err);
        }
    }

    /**
     * Mettre à jour le statut d'un ticket
     */
    async updateTicketStatus(ticketId, status) {
        // Mapper status anglais -> statut français
        const statutMap = {
            'open': 'ouvert',
            'in_progress': 'en_cours',
            'pending': 'en_attente_client',
            'resolved': 'resolu',
            'closed': 'ferme'
        };
        
        const statut = statutMap[status] || status;
        
        await window.supabaseClient
            .from('cm_support_tickets')
            .update({ statut })
            .eq('id', ticketId);
        
        await this.addTicketHistory(ticketId, 'status_changed', `Statut changé: ${statut}`);
    }

    /**
     * Ajouter entrée dans l'historique du ticket
     */
    async addTicketHistory(ticketId, action, description) {
        await window.supabaseClient
            .from('cm_support_ticket_history')
            .insert({
                ticket_id: ticketId,
                action,
                description,
                created_by: 'system',
                created_at: new Date().toISOString()
            });
    }

    /**
     * Récupérer infos client
     */
    /**
     * Récupérer tous les clients affectés par une erreur
     */
    async getAffectedClients(error) {
        const affectedClients = [];
        
        // 1. Si email spécifique dans metadata → ce client uniquement
        if (error.metadata?.userEmail) {
            const { data: client } = await window.supabaseClient
                .from('cm_clients')
                .select('*')
                .eq('email', error.metadata.userEmail)
                .single();
            
            if (client) {
                affectedClients.push(client);
                return affectedClients;
            }
        }
        
        // 2. Si erreur globale (sans userEmail) → tous les clients actifs
        const { data: allClients } = await window.supabaseClient
            .from('cm_clients')
            .select('*')
            .eq('actif', true);
        
        return allClients || [];
    }
    
    /**
     * Notifier tous les clients affectés
     */
    async notifyAllAffectedClients(ticket, error, clients) {
        console.log(`📧 Envoi notifications à ${clients.length} client(s)...`);
        
        for (const client of clients) {
            try {
                await this.sendClientNotification(
                    { ...ticket, client_email: client.email },
                    error
                );
                console.log(`✅ Email envoyé à ${client.email}`);
            } catch (err) {
                console.error(`❌ Erreur envoi email à ${client.email}:`, err);
            }
        }
        
        // Enregistrer les clients liés dans metadata
        await window.supabaseClient
            .from('cm_support_tickets')
            .update({
                metadata: {
                    ...ticket.metadata,
                    affected_clients: clients.map(c => ({
                        id: c.id,
                        email: c.email,
                        notified_at: new Date().toISOString()
                    }))
                }
            })
            .eq('id', ticket.id);
    }
    
    /**
     * Récupérer infos d'un client (méthode legacy, gardée pour compatibilité)
     */
    async getClientInfo(error) {
        const clients = await this.getAffectedClients(error);
        return clients[0] || null;
    }

    /**
     * Générer signature d'erreur
     */
    generateErrorSignature(error) {
        return `${error.source}|${error.message}|${error.metadata?.lineno || 'N/A'}`;
    }

    /**
     * Reprendre les tickets actifs
     */
    async resumeActiveTickets() {
        try {
            // Requête adaptative sans filtrer sur 'status' si la colonne n'existe pas
            const { data: activeTickets, error } = await window.supabaseClient
                .from('cm_support_tickets')
                .select('*')
                .eq('source', 'auto_detection');
            
            if (error) {
                console.warn('⚠️ Impossible de reprendre les tickets actifs:', error.message);
                return;
            }
            
            // Filtrer côté client pour tickets ouverts
            const openTickets = activeTickets?.filter(t => 
                t.statut && ['ouvert', 'en_cours', 'en_attente_client'].includes(t.statut)
            ) || [];
            
            openTickets.forEach(ticket => {
            if (ticket.metadata?.monitoring?.auto_close_enabled) {
                const startTime = new Date(ticket.metadata.monitoring.start).getTime();
                
                this.activeTickets.set(ticket.id, {
                    ticketId: ticket.id,
                    errorSignature: ticket.error_signature,
                    errorId: ticket.error_id,
                    startTime,
                    status: 'monitoring'
                });
                
                this.startTicketMonitoring(ticket.id, ticket.error_signature);
            }
        });
        
        if (activeTickets?.length > 0) {
            console.log(`📊 ${activeTickets.length} ticket(s) actif(s) repris`);
        }
        } catch (err) {
            console.error('❌ Erreur reprise tickets actifs:', err);
        }
    }

    /**
     * VUE ADMIN : Récupérer corrections pour une erreur
     */
    async getErrorCorrections(errorId) {
        // Rechercher dans l'historique des corrections
        const { data: corrections } = await window.supabaseClient
            .from('cm_error_corrections')
            .select('*')
            .eq('error_id', errorId)
            .order('created_at', { ascending: false });
        
        return corrections || [];
    }

    /**
     * Enregistrer une correction
     */
    async logCorrection(errorId, correctionDetails) {
        await window.supabaseClient
            .from('cm_error_corrections')
            .insert({
                error_id: errorId,
                file_path: correctionDetails.filePath,
                old_code: correctionDetails.oldCode,
                new_code: correctionDetails.newCode,
                description: correctionDetails.description,
                applied_by: 'copilot',
                applied_at: new Date().toISOString()
            });
    }
}

// Export global
window.AutoTicketSystem = AutoTicketSystem;

// Auto-init avec retry si Supabase pas encore disponible
function initAutoTicketSystem() {
    if (window.supabaseClient) {
        if (!window.autoTicketSystemInstance) {
            window.autoTicketSystemInstance = new AutoTicketSystem();
            window.autoTicketSystemInstance.init();
        }
    } else {
        // Réessayer dans 500ms
        setTimeout(initAutoTicketSystem, 500);
    }
}

// Démarrer l'initialisation
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAutoTicketSystem);
} else {
    initAutoTicketSystem();
}
