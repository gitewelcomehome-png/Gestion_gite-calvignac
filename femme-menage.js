/**
 * 🧹 ESPACE FEMME DE MÉNAGE
 * Interface dédiée pour la femme de ménage
 */

// Utiliser le supabase déjà configuré globalement
// (pas besoin de redéclarer)

// ================================================================
// CHARGEMENT INITIAL
// ================================================================

document.addEventListener('DOMContentLoaded', async () => {
    await chargerInterventions();
    await chargerStocksDraps();
    
    // Formulaires
    document.getElementById('form-tache-achats').addEventListener('submit', creerTacheAchats);
    document.getElementById('form-tache-travaux').addEventListener('submit', creerTacheTravaux);
    document.getElementById('form-retour-menage').addEventListener('submit', envoyerRetourMenage);
    
    // Date par défaut = aujourd'hui
    document.getElementById('retour-date').valueAsDate = new Date();
});

// ================================================================
// INTERVENTIONS PRÉVUES
// ================================================================

async function chargerInterventions() {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const troisSemaines = new Date(today);
        troisSemaines.setDate(today.getDate() + 21);
        
        // Charger les ménages des 3 prochaines semaines
        const { data: menages, error } = await window.supabaseClient
            .from('cleaning_schedule')
            .select('*')
            .gte('scheduled_date', today.toISOString().split('T')[0])
            .lte('scheduled_date', troisSemaines.toISOString().split('T')[0])
            .order('scheduled_date', { ascending: true });

        if (error) throw error;

        const container = document.getElementById('interventions-list');
        
        if (!menages || menages.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📭</div>
                    <p>Aucune intervention prévue dans les 3 prochaines semaines</p>
                </div>
            `;
            return;
        }

        let html = '';
        menages.forEach(menage => {
            const date = new Date(menage.scheduled_date);
            const dateFormatee = date.toLocaleDateString('fr-FR', { 
                weekday: 'long', 
                day: 'numeric', 
                month: 'long' 
            });
            
            // Statut de validation
            const validationBadge = menage.validated_by_company 
                ? '<span style="background: #27AE60; color: white; padding: 4px 10px; border-radius: 6px; font-size: 0.85rem; font-weight: 600;">✅ Validé</span>'
                : '<span style="background: #F39C12; color: white; padding: 4px 10px; border-radius: 6px; font-size: 0.85rem; font-weight: 600;">⏳ En attente validation</span>';
            
            html += `
                <div class="menage-item">
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
                        <div class="menage-date">${dateFormatee}</div>
                        ${validationBadge}
                    </div>
                    <div class="menage-gite">🏠 ${menage.gite}</div>
                    <div class="menage-heure">⏰ ${menage.time_of_day === 'morning' ? 'Matin (7h-12h)' : 'Après-midi (12h-17h)'}</div>
                    ${menage.notes ? `<div style="margin-top: 8px; color: #666; font-size: 0.9rem;">📝 ${menage.notes}</div>` : ''}
                </div>
            `;
        });

        container.innerHTML = html;
    } catch (error) {
        console.error('Erreur chargement interventions:', error);
        document.getElementById('interventions-list').innerHTML = `
            <div class="alert alert-warning">
                ⚠️ Erreur lors du chargement des interventions
            </div>
        `;
    }
}

// ================================================================
// ONGLETS
// ================================================================

function switchTaskTab(tab) {
    // Désactiver tous les onglets
    document.querySelectorAll('.tabs .tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    
    // Activer l'onglet sélectionné
    event.target.classList.add('active');
    document.getElementById(`tab-${tab}`).classList.add('active');
}

function switchStockTab(gite) {
    // Désactiver tous les onglets
    document.querySelectorAll('.tabs .tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    
    // Activer l'onglet sélectionné
    event.target.classList.add('active');
    document.getElementById(`stock-${gite}`).classList.add('active');
}

// Exporter les fonctions globalement
window.switchTaskTab = switchTaskTab;
window.switchStockTab = switchStockTab;

// ================================================================
// CRÉER DES TÂCHES
// ================================================================

async function creerTacheAchats(e) {
    e.preventDefault();
    
    const titre = document.getElementById('tache-achats-titre').value;
    const gite = document.getElementById('tache-achats-gite').value;
    const description = document.getElementById('tache-achats-description').value;
    
    try {
        const { error } = await window.supabaseClient
            .from('todos')
            .insert({
                category: 'achats',
                title: titre,
                description: description || `Signalé par la femme de ménage`,
                gite: gite,
                completed: false
            });

        if (error) throw error;

        alert('✅ Tâche d\'achat créée avec succès !');
        document.getElementById('form-tache-achats').reset();
    } catch (error) {
        console.error('Erreur création tâche achats:', error);
        alert('❌ Erreur lors de la création de la tâche');
    }
}

async function creerTacheTravaux(e) {
    e.preventDefault();
    
    const titre = document.getElementById('tache-travaux-titre').value;
    const gite = document.getElementById('tache-travaux-gite').value;
    const priorite = document.getElementById('tache-travaux-priorite').value;
    const description = document.getElementById('tache-travaux-description').value;
    
    const titreComplet = priorite === 'urgente' ? `🚨 URGENT: ${titre}` : titre;
    
    try {
        const { error } = await window.supabaseClient
            .from('todos')
            .insert({
                category: 'travaux',
                title: titreComplet,
                description: `${description}\n\n📍 Signalé par la femme de ménage`,
                gite: gite,
                completed: false
            });

        if (error) throw error;

        alert('✅ Tâche de travaux créée avec succès !');
        document.getElementById('form-tache-travaux').reset();
    } catch (error) {
        console.error('Erreur création tâche travaux:', error);
        alert('❌ Erreur lors de la création de la tâche');
    }
}

// ================================================================
// STOCKS DE DRAPS
// ================================================================

const ARTICLES_DRAPS = [
    { id: 'draps_plats_grands', label: 'Draps plats grands' },
    { id: 'draps_plats_petits', label: 'Draps plats petits' },
    { id: 'housses_couettes_grandes', label: 'Housses couette grandes' },
    { id: 'housses_couettes_petites', label: 'Housses couette petites' },
    { id: 'taies_oreillers', label: 'Taies d\'oreillers' },
    { id: 'serviettes', label: 'Serviettes' },
    { id: 'tapis_bain', label: 'Tapis de bain' }
];

async function chargerStocksDraps() {
    try {
        const { data: stocks, error } = await window.supabaseClient
            .from('stocks_draps')
            .select('*');

        if (error) throw error;

        const stocksTrevoux = stocks?.find(s => s.gite === 'trévoux') || {};
        const stocksCouzon = stocks?.find(s => s.gite === 'couzon') || {};

        // Afficher les grilles
        afficherGrilleStock('trevoux', stocksTrevoux);
        afficherGrilleStock('couzon', stocksCouzon);
    } catch (error) {
        console.error('Erreur chargement stocks:', error);
    }
}

function afficherGrilleStock(gite, stocks) {
    const container = document.getElementById(`stock-grid-${gite}`);
    let html = '';

    ARTICLES_DRAPS.forEach(article => {
        const valeur = stocks[article.id] || 0;
        html += `
            <div class="stock-item">
                <label for="${gite}-${article.id}">${article.label}</label>
                <input 
                    type="number" 
                    id="${gite}-${article.id}" 
                    value="${valeur}"
                    min="0"
                >
            </div>
        `;
    });

    container.innerHTML = html;
}

async function sauvegarderStocks(gite) {
    try {
        const stocks = {};
        
        ARTICLES_DRAPS.forEach(article => {
            const input = document.getElementById(`${gite}-${article.id}`);
            stocks[article.id] = parseInt(input.value) || 0;
        });

        const { error } = await window.supabaseClient
            .from('stocks_draps')
            .upsert({
                gite: gite,
                ...stocks
            }, { onConflict: 'gite' });

        if (error) throw error;

        alert(`✅ Stocks de ${gite.charAt(0).toUpperCase() + gite.slice(1)} sauvegardés !`);
    } catch (error) {
        console.error('Erreur sauvegarde stocks:', error);
        alert('❌ Erreur lors de la sauvegarde des stocks');
    }
}

window.sauvegarderStocks = sauvegarderStocks;

// ================================================================
// RETOUR APRÈS MÉNAGE
// ================================================================

async function envoyerRetourMenage(e) {
    e.preventDefault();
    
    const gite = document.getElementById('retour-gite').value;
    const date = document.getElementById('retour-date').value;
    const etatArrivee = document.getElementById('retour-etat-arrivee').value;
    const detailsEtat = document.getElementById('retour-details-etat').value;
    const deroulement = document.getElementById('retour-deroulement').value;
    const detailsDeroulement = document.getElementById('retour-details-deroulement').value;
    
    try {
        const { error } = await window.supabaseClient
            .from('retours_menage')
            .insert({
                gite: gite,
                date_menage: date,
                etat_arrivee: etatArrivee,
                details_etat: detailsEtat || null,
                deroulement: deroulement,
                details_deroulement: detailsDeroulement || null,
                validated: false
            });

        if (error) throw error;

        alert('✅ Retour envoyé avec succès ! Le propriétaire sera notifié.');
        document.getElementById('form-retour-menage').reset();
        document.getElementById('retour-date').valueAsDate = new Date();
    } catch (error) {
        console.error('Erreur envoi retour:', error);
        alert('❌ Erreur lors de l\'envoi du retour');
    }
}
