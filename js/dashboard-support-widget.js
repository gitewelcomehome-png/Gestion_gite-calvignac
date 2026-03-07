// ================================================================
// 🎫 WIDGET SUPPORT DASHBOARD
// ================================================================
// Affiche les tickets support en attente sur le dashboard admin
// ================================================================

async function loadSupportTickets() {
    
    try {
        if (!window.supabaseClient) {
            return;
        }
        
        // Récupérer tous les tickets
        // La colonne priorité peut s'appeler 'priority' ou 'priorite' selon le projet
        const { data: tickets, error } = await window.supabaseClient
            .from('cm_support_tickets')
            .select('id, status, priority, priorite')
            .order('created_at', { ascending: false });
        
        if (error) {
            console.error('Erreur chargement tickets support:', error);
            throw error;
        }
        
        if (!tickets) return;
        
        // Normaliser : aligner status/statut et priority/priorite selon la colonne disponible
        tickets.forEach(t => {
            if (t.status !== undefined && t.statut === undefined) t.statut = t.status;
            if (t.priority !== undefined && t.priorite === undefined) t.priorite = t.priority;
        });
        const ticketsActifs = tickets.filter(t => t.statut !== 'résolu' && t.statut !== 'resolu' && t.statut !== 'fermé' && t.statut !== 'ferme');
        
        // Calculer les stats
        const stats = {
            // Statuts
            ouvert: ticketsActifs.filter(t => t.statut === 'ouvert').length,
            enCours: ticketsActifs.filter(t => t.statut === 'en_cours').length,
            enAttente: ticketsActifs.filter(t => t.statut === 'en_attente').length,
            // Priorités (seulement tickets actifs)
            critique: ticketsActifs.filter(t => t.priorite === 'critique').length,
            haute: ticketsActifs.filter(t => t.priorite === 'haute').length,
            normale: ticketsActifs.filter(t => t.priorite === 'normale').length,
            basse: ticketsActifs.filter(t => t.priorite === 'basse').length,
            // Nouveaux (pour le badge)
            nouveaux: ticketsActifs.filter(t => t.statut === 'ouvert').length
        };
        
        // Mettre à jour les KPI
        const updateKPI = (id, value) => {
            const el = document.getElementById(id);
            if (el) el.textContent = value;
        };
        
        // Statuts
        updateKPI('kpiTicketsOuvert', stats.ouvert);
        updateKPI('kpiTicketsEnCours', stats.enCours);
        updateKPI('kpiTicketsEnAttente', stats.enAttente);
        // Priorités
        updateKPI('kpiTicketsCritique', stats.critique);
        updateKPI('kpiTicketsHaute', stats.haute);
        updateKPI('kpiTicketsNormale', stats.normale);
        updateKPI('kpiTicketsBasse', stats.basse);
        
        // Badge notification sur l'onglet Support
        const badge = document.getElementById('badge-support-nouveaux');
        if (badge) {
            if (stats.nouveaux > 0) {
                badge.textContent = stats.nouveaux;
                badge.style.display = 'flex';
            } else {
                badge.style.display = 'none';
            }
        }
        
    } catch (error) {
        console.error('Erreur widget support:', error);
    }
}

window.loadSupportTickets = loadSupportTickets;
