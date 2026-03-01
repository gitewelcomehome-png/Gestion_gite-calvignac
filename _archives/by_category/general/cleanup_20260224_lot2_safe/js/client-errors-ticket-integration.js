/**
 * 🎫 INTÉGRATION ERREURS CLIENT DANS SYSTÈME TICKETS SUPPORT
 * ============================================================
 * Exemple d'utilisation des fonctionnalités de filtrage par UUID
 * pour récupérer les erreurs d'un client lors de la création d'un ticket
 */

/**
 * EXEMPLE 1: Récupérer les erreurs d'un client
 * ============================================================
 */
async function getClientErrorsForTicket(clientUuid) {
    if (!window.errorMonitor) {
        console.warn('⚠️ Error Monitor non initialisé');
        return [];
    }

    // Récupérer les erreurs des 7 derniers jours
    const errors = await window.errorMonitor.getClientErrors(clientUuid, 7);
    
    console.log(`📊 ${errors.length} erreur(s) trouvée(s) pour le client ${clientUuid}`);
    
    return errors;
}

/**
 * EXEMPLE 2: Afficher les erreurs dans un formulaire de ticket
 * ============================================================
 */
async function attachClientErrorsToTicket(clientUuid, ticketFormId) {
    const errors = await window.errorMonitor.getClientErrors(clientUuid, 7);
    
    if (errors.length === 0) {
        return;
    }

    // Créer une section "Erreurs détectées" dans le formulaire
    const ticketForm = document.getElementById(ticketFormId);
    if (!ticketForm) return;

    const errorSection = document.createElement('div');
    errorSection.className = 'ticket-error-section';
    errorSection.innerHTML = `
        <div class="alert alert-warning">
            <h4>⚠️ Erreurs détectées pour ce client</h4>
            <p>${errors.length} erreur(s) dans les 7 derniers jours</p>
            <button type="button" onclick="showClientErrorsModal('${clientUuid}')">
                Voir les détails
            </button>
        </div>
    `;

    ticketForm.prepend(errorSection);
}

/**
 * EXEMPLE 3: Générer un rapport d'erreurs pour email
 * ============================================================
 */
async function generateErrorReportForEmail(clientUuid, clientEmail) {
    const errors = await window.errorMonitor.getClientErrors(clientUuid, 7);
    
    // Formater en texte
    const report = window.errorMonitor.formatErrorsReport(errors);
    
    // Préparer l'email
    const emailSubject = `Support Gîtes - Rapport d'erreurs pour ${clientEmail}`;
    const emailBody = `
Bonjour,

Voici le rapport des erreurs détectées pour le client ${clientEmail} (UUID: ${clientUuid}):

${report}

Cordialement,
Équipe Support
    `;

    return {
        subject: emailSubject,
        body: emailBody,
        report: report
    };
}

/**
 * EXEMPLE 4: Modal d'affichage des erreurs client
 * ============================================================
 */
async function showClientErrorsModal(clientUuid) {
    const errors = await window.errorMonitor.getClientErrors(clientUuid, 7);
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-overlay" onclick="this.parentElement.remove()"></div>
        <div class="modal-content">
            <div class="modal-header">
                <h2>🔍 Erreurs du client</h2>
                <button class="modal-close" onclick="this.closest('.modal').remove()">×</button>
            </div>
            <div class="modal-body">
                <p><strong>UUID:</strong> <code>${clientUuid}</code></p>
                <p><strong>Période:</strong> 7 derniers jours</p>
                <p><strong>Nombre d'erreurs:</strong> ${errors.length}</p>
                
                ${errors.length === 0 ? '<p>✅ Aucune erreur détectée</p>' : `
                    <div class="error-list">
                        ${errors.slice(0, 10).map(e => `
                            <div class="error-item">
                                <div class="error-header">
                                    <span class="badge badge-${e.error_type}">${e.error_type}</span>
                                    <span>${new Date(e.timestamp).toLocaleString('fr-FR')}</span>
                                </div>
                                <div class="error-message">${e.message}</div>
                                <div class="error-source">${e.source}</div>
                            </div>
                        `).join('')}
                    </div>
                    ${errors.length > 10 ? `<p>... et ${errors.length - 10} autres erreurs</p>` : ''}
                `}
            </div>
            <div class="modal-footer">
                <button class="btn btn-primary" onclick="copyErrorReport('${clientUuid}')">
                    📋 Copier le rapport
                </button>
                <button class="btn" onclick="this.closest('.modal').remove()">Fermer</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

/**
 * EXEMPLE 5: Copier le rapport dans le presse-papier
 * ============================================================
 */
async function copyErrorReport(clientUuid) {
    const errors = await window.errorMonitor.getClientErrors(clientUuid, 7);
    const report = window.errorMonitor.formatErrorsReport(errors);
    
    try {
        await navigator.clipboard.writeText(report);
        alert('✅ Rapport copié dans le presse-papier !');
    } catch (err) {
        console.error('❌ Erreur copie presse-papier:', err);
    }
}

/**
 * EXEMPLE 6: Intégration dans création ticket support
 * ============================================================
 */
async function createTicketWithErrors(ticketData) {
    const { clientUuid, subject, message, priority } = ticketData;
    
    // Récupérer les erreurs du client
    const errors = await window.errorMonitor.getClientErrors(clientUuid, 7);
    
    // Ajouter les erreurs au contexte du ticket
    const ticketWithContext = {
        ...ticketData,
        hasErrors: errors.length > 0,
        errorCount: errors.length,
        criticalErrorCount: errors.filter(e => e.error_type === 'critical').length,
        lastErrorDate: errors[0]?.timestamp || null,
        errorReport: errors.length > 0 ? window.errorMonitor.formatErrorsReport(errors) : null
    };
    
    // Ajuster la priorité automatiquement si erreurs critiques
    if (errors.filter(e => e.error_type === 'critical').length > 0) {
        ticketWithContext.priority = 'high';
        ticketWithContext.tags = [...(ticketWithContext.tags || []), 'erreurs-critiques'];
    }
    
    console.log('🎫 Ticket créé avec contexte erreurs:', ticketWithContext);
    
    // Envoyer le ticket à votre système
    // await saveTicket(ticketWithContext);
    
    return ticketWithContext;
}

/**
 * EXEMPLE 7: Filtrage des tickets par erreurs
 * ============================================================
 */
async function filterTicketsByClientWithErrors() {
    // Récupérer tous les clients avec erreurs récentes
    const { data: errorsGrouped, error } = await window.supabaseClient
        .from('cm_error_logs')
        .select('user_id, user_email')
        .gte('timestamp', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .not('user_id', 'is', null);
    
    if (error) {
        console.error('❌ Erreur récupération clients avec erreurs:', error);
        return [];
    }
    
    // Dédupliquer par user_id
    const uniqueClients = [...new Map(errorsGrouped.map(item => [item.user_id, item])).values()];
    
    console.log(`👥 ${uniqueClients.length} client(s) avec erreurs récentes`);
    
    return uniqueClients;
}

/**
 * EXEMPLE 8: Widget "Erreurs client" dans interface support
 * ============================================================
 */
async function renderClientErrorWidget(clientUuid, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const errors = await window.errorMonitor.getClientErrors(clientUuid, 7);
    const critical = errors.filter(e => e.error_type === 'critical').length;
    const warning = errors.filter(e => e.error_type === 'warning').length;
    
    container.innerHTML = `
        <div class="widget widget-client-errors">
            <div class="widget-header">
                <h3>⚠️ Erreurs client (7j)</h3>
            </div>
            <div class="widget-body">
                ${errors.length === 0 ? `
                    <div class="widget-empty">
                        ✅ Aucune erreur détectée
                    </div>
                ` : `
                    <div class="widget-stats">
                        <div class="stat">
                            <span class="stat-label">Total</span>
                            <span class="stat-value">${errors.length}</span>
                        </div>
                        <div class="stat stat-critical">
                            <span class="stat-label">Critiques</span>
                            <span class="stat-value">${critical}</span>
                        </div>
                        <div class="stat stat-warning">
                            <span class="stat-label">Warnings</span>
                            <span class="stat-value">${warning}</span>
                        </div>
                    </div>
                    <button 
                        class="btn btn-sm btn-block" 
                        onclick="showClientErrorsModal('${clientUuid}')"
                    >
                        Voir les détails
                    </button>
                `}
            </div>
        </div>
    `;
}

// Export pour utilisation globale
window.ClientErrorsIntegration = {
    getClientErrors: getClientErrorsForTicket,
    attachToTicket: attachClientErrorsToTicket,
    generateReport: generateErrorReportForEmail,
    showModal: showClientErrorsModal,
    copyReport: copyErrorReport,
    createTicket: createTicketWithErrors,
    filterClients: filterTicketsByClientWithErrors,
    renderWidget: renderClientErrorWidget
};

console.log('✅ Intégration Erreurs Client - Tickets Support chargée');
