// ================================================================
// MODULE WIDGET HORAIRES CLIENTS
// ================================================================
// Affiche les horaires d'arrivée/départ confirmés par les clients
// dans le dashboard

const supabase = window.supabase;

/**
 * Affiche les horaires clients dans le dashboard
 */
export async function afficherHorairesClients() {
    const container = document.getElementById('widget-horaires-clients');
    if (!container) return;
    
    // Récupérer d'abord les demandes horaires approuvées
    const { data: demandes, error: errorDemandes } = await window.supabaseClient
        .from('demandes_horaires')
        .select('*')
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .limit(10);
    
    if (errorDemandes) {
        console.error('Erreur chargement demandes:', errorDemandes);
        window.SecurityUtils.setInnerHTML(container, `
            <div style="text-align: center; padding: 30px; color: #999;">
                <div style="font-size: 3rem; margin-bottom: 15px;">📭</div>
                <p>Erreur chargement des horaires</p>
            </div>
        `);
        return;
    }
    
    // Récupérer les réservations associées
    const reservationIds = demandes.map(d => d.reservation_id).filter(Boolean);
    const { data: reservations, error: errorReservations } = await window.supabaseClient
        .from('reservations')
        .select('*')
        .in('id', reservationIds);
    
    if (errorReservations) {
        console.error('Erreur chargement réservations:', errorReservations);
    }
    
    // Créer une map des réservations pour accès rapide
    const reservationsMap = {};
    (reservations || []).forEach(r => {
        reservationsMap[r.id] = r;
    });
    
    // Filtrer les demandes qui ont une réservation valide
    const demandesValides = demandes.filter(d => reservationsMap[d.reservation_id]);
    
    if (demandesValides.length === 0) {
        window.SecurityUtils.setInnerHTML(container, `
            <div style="text-align: center; padding: 30px; color: #999;">
                <div style="font-size: 3rem; margin-bottom: 15px;">📭</div>
                <p>Aucune demande horaire validée récente</p>
            </div>
        `);
        return;
    }
    
    const items = await Promise.all(demandesValides.map(async demande => {
                const reservation = reservationsMap[demande.reservation_id];
                if (!reservation) return '';
                const gite = await window.gitesManager?.getByName(reservation.gite) || await window.gitesManager?.getById(reservation.gite_id);
                const giteColor = gite ? gite.color : '#667eea';
                const giteIcon = gite ? gite.icon : '🏡';
                const giteName = gite ? gite.name : reservation.gite || reservation.gite_id;
                
                const typeLabel = demande.type === 'arrivee_anticipee' ? '🕐 Arrivée' : '🕐 Départ';
                return `
                    <div style="
                        background: white;
                        border-radius: 12px;
                        padding: 20px;
                        border-left: 4px solid ${giteColor};
                        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                    ">
                        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 15px;">
                            <div>
                                <div style="font-size: 1.2rem; font-weight: 700; color: #333; margin-bottom: 5px;">
                                    ${giteIcon} ${giteName} - ${reservation.client_name || reservation.nom}
                                </div>
                                <div style="color: #666; font-size: 0.95rem;">
                                    ${formatDateCourt(reservation.check_in || reservation.date_debut)} → ${formatDateCourt(reservation.check_out || reservation.date_fin)}
                                </div>
                            </div>
                            <div style="background: #e8f5e9; color: #27AE60; padding: 5px 12px; border-radius: 20px; font-size: 0.85rem; font-weight: 600;">
                                ✅ Approuvé
                            </div>
                        </div>
                        
                        <div style="display: grid; grid-template-columns: 1fr; gap: 15px; margin-bottom: 15px;">
                            <div style="background: #f0f9ff; padding: 12px; border-radius: 8px;">
                                <div style="color: #666; font-size: 0.85rem; margin-bottom: 5px;">${typeLabel}</div>
                                <div style="font-size: 1.3rem; font-weight: 700; color: #2196f3;">
                                    ${demande.heure_demandee}
                                </div>
                            </div>
                        </div>
                        
                        ${demande.motif ? `
                        <div style="background: #f8f9fa; padding: 12px; border-radius: 8px; border-left: 3px solid #667eea;">
                            <div style="color: #666; font-size: 0.85rem; margin-bottom: 5px;">💬 Motif</div>
                            <div style="color: #333; font-style: italic;">"${demande.motif}"</div>
                        </div>` : ''}
                        
                        <div style="margin-top: 10px; font-size: 0.8rem; color: #999;">
                            Demandé le ${formatDateHeure(demande.created_at)}
                        </div>
                    </div>
                `;
    }));
    
    window.SecurityUtils.setInnerHTML(container, `
        <div style="display: flex; flex-direction: column; gap: 15px;">
            ${items.filter(Boolean).join('')}
        </div>
    `);
}

/**
 * Retourne le début de la semaine courante
 */
function getDebutSemaine() {
    const aujourdhui = new Date();
    const jour = aujourdhui.getDay();
    const diff = aujourdhui.getDate() - jour + (jour === 0 ? -6 : 1);
    const lundi = new Date(aujourdhui.setDate(diff));
    lundi.setHours(0, 0, 0, 0);
    return lundi.toISOString().split('T')[0];
}

/**
 * Retourne la fin de la semaine courante
 */
function getFinSemaine() {
    const debut = new Date(getDebutSemaine());
    const dimanche = new Date(debut);
    dimanche.setDate(debut.getDate() + 6);
    return dimanche.toISOString().split('T')[0];
}

/**
 * Formate une date en court (ex: "Lun 6 jan")
 */
function formatDateCourt(dateStr) {
    const date = new Date(dateStr);
    const jours = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    const mois = ['jan', 'fév', 'mar', 'avr', 'mai', 'juin', 'juil', 'août', 'sep', 'oct', 'nov', 'déc'];
    
    return `${jours[date.getDay()]} ${date.getDate()} ${mois[date.getMonth()]}`;
}

/**
 * Formate une heure (ex: "18:00" → "18h00")
 */
function formatHeure(heureStr) {
    if (!heureStr) return '-';
    return heureStr.substring(0, 5).replace(':', 'h');
}

/**
 * Formate date + heure
 */
function formatDateHeure(dateTimeStr) {
    const date = new Date(dateTimeStr);
    return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
    });
}
