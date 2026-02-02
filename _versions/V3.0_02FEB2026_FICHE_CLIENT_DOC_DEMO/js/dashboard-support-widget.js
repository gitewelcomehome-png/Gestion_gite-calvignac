// ================================================================
// 🎫 WIDGET SUPPORT DASHBOARD
// ================================================================
// Affiche les tickets support en attente sur le dashboard admin
// ================================================================

console.log('🚀 DEBUG: Fichier dashboard-support-widget.js chargé');

async function loadSupportTickets() {
    console.log('🔍 DEBUG: Chargement stats tickets support...');
    
    try {
        if (!window.supabaseClient) {
            console.error('❌ DEBUG: window.supabaseClient non disponible');
            return;
        }
        
        // Récupérer tous les tickets
        const { data: tickets, error } = await window.supabaseClient
            .from('cm_support_tickets')
            .select('id, statut, priorite')
            .order('created_at', { ascending: false });
        
        if (error) {
            console.error('❌ DEBUG: Erreur Supabase:', error);
            throw error;
        }
        
        console.log('📊 DEBUG: Tickets reçus:', tickets ? tickets.length : 0);
        
        if (!tickets) return;
        
        // Filtrer les tickets non résolus pour les KPI
        const ticketsActifs = tickets.filter(t => t.statut !== 'résolu');
        
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
        
        console.log('✅ DEBUG: Stats tickets affichées', stats);
        
    } catch (error) {
        console.error('❌ DEBUG: Erreur:', error);
    }
}

window.loadSupportTickets = loadSupportTickets;
console.log('✅ DEBUG: Widget Support Dashboard prêt');
