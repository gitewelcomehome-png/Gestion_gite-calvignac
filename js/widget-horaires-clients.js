// ================================================================
// MODULE WIDGET HORAIRES CLIENTS
// ================================================================
// Affiche les horaires d'arrivée/départ confirmés par les clients
// dans le dashboard

import { supabase } from './supabase-operations.js';

/**
 * Affiche les horaires clients dans le dashboard
 */
export async function afficherHorairesClients() {
    const container = document.getElementById('widget-horaires-clients');
    if (!container) return;
    
    // Récupérer les réservations de la semaine en cours
    const dateDebut = getDebutSemaine();
    const dateFin = getFinSemaine();
    
    const { data: reservations, error } = await supabase
        .from('reservations')
        .select(`
            *,
            clients_preferences (
                heure_arrivee,
                heure_depart,
                commentaires,
                date_soumission
            )
        `)
        .gte('date_debut', dateDebut)
        .lte('date_debut', dateFin)
        .order('date_debut', { ascending: true });
    
    if (error) {
        console.error('Erreur chargement horaires:', error);
        return;
    }
    
    // Filtrer celles qui ont des préférences
    const avecPreferences = reservations.filter(r => 
        r.clients_preferences && r.clients_preferences.length > 0
    );
    
    if (avecPreferences.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 30px; color: #999;">
                <div style="font-size: 3rem; margin-bottom: 15px;">📭</div>
                <p>Aucun client n'a encore confirmé ses horaires cette semaine</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 15px;">
            ${avecPreferences.map(reservation => {
                const pref = reservation.clients_preferences[0];
                return `
                    <div style="
                        background: white;
                        border-radius: 12px;
                        padding: 20px;
                        border-left: 4px solid ${reservation.gite === 'Trévoux' ? '#667eea' : '#f093fb'};
                        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                    ">
                        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 15px;">
                            <div>
                                <div style="font-size: 1.2rem; font-weight: 700; color: #333; margin-bottom: 5px;">
                                    ${reservation.gite === 'Trévoux' ? '🏡' : '⛰️'} ${reservation.gite} - ${reservation.nom}
                                </div>
                                <div style="color: #666; font-size: 0.95rem;">
                                    ${formatDateCourt(reservation.date_debut)} → ${formatDateCourt(reservation.date_fin)}
                                </div>
                            </div>
                            <div style="background: #e8f5e9; color: #27AE60; padding: 5px 12px; border-radius: 20px; font-size: 0.85rem; font-weight: 600;">
                                ✅ Confirmé
                            </div>
                        </div>
                        
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                            <div style="background: #f0f9ff; padding: 12px; border-radius: 8px;">
                                <div style="color: #666; font-size: 0.85rem; margin-bottom: 5px;">🔑 Arrivée</div>
                                <div style="font-size: 1.3rem; font-weight: 700; color: #2196f3;">
                                    ${formatHeure(pref.heure_arrivee)}
                                </div>
                            </div>
                            <div style="background: #fff3e0; padding: 12px; border-radius: 8px;">
                                <div style="color: #666; font-size: 0.85rem; margin-bottom: 5px;">🚪 Départ</div>
                                <div style="font-size: 1.3rem; font-weight: 700; color: #ff9800;">
                                    ${formatHeure(pref.heure_depart)}
                                </div>
                            </div>
                        </div>
                        
                        ${pref.commentaires ? `
                        <div style="background: #f8f9fa; padding: 12px; border-radius: 8px; border-left: 3px solid #667eea;">
                            <div style="color: #666; font-size: 0.85rem; margin-bottom: 5px;">💬 Commentaire</div>
                            <div style="color: #333; font-style: italic;">"${pref.commentaires}"</div>
                        </div>` : ''}
                        
                        <div style="margin-top: 10px; font-size: 0.8rem; color: #999;">
                            Reçu le ${formatDateHeure(pref.date_soumission)}
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
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

// Export
export { afficherHorairesClients };
