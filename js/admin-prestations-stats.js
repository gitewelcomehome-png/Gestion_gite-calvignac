// ==========================================
// ADMIN PRESTATIONS - STATS GLOBALES
// Version: 1.0
// ==========================================

let tauxCommission = 5; // Par défaut 5%

// ==========================================
// INITIALISATION
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    loadConfig();
    loadStatsGlobales();
    loadCommandesHistory();
    loadStatsParClient();
});

// ==========================================
// CHARGEMENT CONFIGURATION
// ==========================================
async function loadConfig() {
    try {
        const { data, error } = await supabaseClient
            .from('system_config')
            .select('valeur')
            .eq('cle', 'commission_prestations_percent')
            .single();
        
        if (error) {
            console.warn('Config % commission non trouvée, utilisation de 5% par défaut');
            tauxCommission = 5;
        } else {
            tauxCommission = parseFloat(data.valeur) || 5;
        }
        
        // Mettre à jour l'affichage
        document.getElementById('stat-taux-commission').textContent = tauxCommission + '%';
        
    } catch (e) {
        console.error('Erreur chargement config:', e);
        tauxCommission = 5;
    }
}

// ==========================================
// STATS GLOBALES
// ==========================================
async function loadStatsGlobales() {
    try {
        // Charger toutes les commandes validées
        const { data: commandes, error } = await supabaseClient
            .from('commandes_prestations')
            .select('montant_prestations, montant_commission')
            .eq('statut', 'paid');
        
        if (error) throw error;
        
        // Calculer les totaux
        const caBrut = commandes.reduce((sum, cmd) => sum + (cmd.montant_prestations || 0), 0);
        const commissionsTotal = commandes.reduce((sum, cmd) => sum + (cmd.montant_commission || 0), 0);
        const nbCommandes = commandes.length;
        
        // Mettre à jour l'affichage
        document.getElementById('stat-ca-brut').textContent = formatEuro(caBrut);
        document.getElementById('stat-commissions').textContent = formatEuro(commissionsTotal);
        document.getElementById('stat-nb-commandes').textContent = nbCommandes;
        
    } catch (error) {
        console.error('Erreur chargement stats globales:', error);
        showError('Erreur lors du chargement des statistiques globales');
    }
}

// ==========================================
// HISTORIQUE DES COMMANDES
// ==========================================
async function loadCommandesHistory() {
    try {
        const { data: commandes, error } = await supabaseClient
            .from('commandes_prestations')
            .select(`
                *,
                client:reservations!inner(nom_client, prenom_client),
                gite:gites!inner(name)
            `)
            .order('created_at', { ascending: false })
            .limit(50);
        
        if (error) throw error;
        
        const tbody = document.getElementById('commandesTableBody');
        
        if (!commandes || commandes.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="empty-state">
                        <i data-lucide="inbox" style="width: 48px; height: 48px;"></i>
                        <p>Aucune commande pour le moment</p>
                    </td>
                </tr>
            `;
            lucide.createIcons();
            return;
        }
        
        tbody.innerHTML = commandes.map(cmd => {
            const clientNom = cmd.client ? `${cmd.client.prenom_client || ''} ${cmd.client.nom_client || ''}`.trim() : 'N/A';
            const giteNom = cmd.gite?.name || 'N/A';
            const date = new Date(cmd.created_at).toLocaleDateString('fr-FR');
            
            return `
                <tr>
                    <td><strong>${cmd.numero_commande}</strong></td>
                    <td>${clientNom}</td>
                    <td>${giteNom}</td>
                    <td>${date}</td>
                    <td><strong>${formatEuro(cmd.montant_prestations)}</strong></td>
                    <td style="color: #3b82f6;">${formatEuro(cmd.montant_commission)}</td>
                    <td style="color: #10b981;">${formatEuro(cmd.montant_net_owner)}</td>
                    <td>${getBadgeStatut(cmd.statut)}</td>
                </tr>
            `;
        }).join('');
        
        lucide.createIcons();
        
    } catch (error) {
        console.error('Erreur chargement historique:', error);
        const tbody = document.getElementById('commandesTableBody');
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; color: #dc2626; padding: 20px;">
                    ⚠️ Erreur lors du chargement des commandes
                </td>
            </tr>
        `;
    }
}

// ==========================================
// STATS PAR CLIENT
// ==========================================
async function loadStatsParClient() {
    try {
        // Charger toutes les commandes avec info client
        const { data: commandes, error } = await supabaseClient
            .from('commandes_prestations')
            .select(`
                *,
                client:reservations!inner(nom_client, prenom_client, user_id),
                lignes:lignes_commande_prestations(quantite)
            `)
            .eq('statut', 'paid');
        
        if (error) throw error;
        
        // Grouper par user_id
        const statsParUser = {};
        
        commandes.forEach(cmd => {
            const userId = cmd.client?.user_id || 'inconnu';
            const clientNom = cmd.client ? `${cmd.client.prenom_client || ''} ${cmd.client.nom_client || ''}`.trim() : 'Inconnu';
            
            if (!statsParUser[userId]) {
                statsParUser[userId] = {
                    nom: clientNom,
                    caBrut: 0,
                    commission: 0,
                    nbCommandes: 0,
                    nbPrestations: 0
                };
            }
            
            statsParUser[userId].caBrut += cmd.montant_prestations || 0;
            statsParUser[userId].commission += cmd.montant_commission || 0;
            statsParUser[userId].nbCommandes += 1;
            statsParUser[userId].nbPrestations += cmd.lignes?.length || 0;
        });
        
        // Convertir en tableau
        const statsArray = Object.entries(statsParUser).map(([userId, stats]) => ({
            userId,
            ...stats
        }));
        
        // Trier par CA décroissant
        statsArray.sort((a, b) => b.caBrut - a.caBrut);
        
        const tbody = document.getElementById('statsClientsTableBody');
        
        if (statsArray.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="empty-state">
                        <i data-lucide="users" style="width: 48px; height: 48px;"></i>
                        <p>Aucune donnée client disponible</p>
                    </td>
                </tr>
            `;
            lucide.createIcons();
            return;
        }
        
        tbody.innerHTML = statsArray.map(stat => `
            <tr>
                <td><strong>${stat.nom}</strong></td>
                <td>${stat.nbPrestations}</td>
                <td><strong>${formatEuro(stat.caBrut)}</strong></td>
                <td style="color: #3b82f6;">${formatEuro(stat.commission)}</td>
                <td><span class="badge badge-success">${stat.nbCommandes}</span></td>
            </tr>
        `).join('');
        
        lucide.createIcons();
        
    } catch (error) {
        console.error('Erreur chargement stats par client:', error);
        const tbody = document.getElementById('statsClientsTableBody');
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; color: #dc2626; padding: 20px;">
                    ⚠️ Erreur lors du chargement des statistiques par client
                </td>
            </tr>
        `;
    }
}

// ==========================================
// MODAL CONFIGURATION
// ==========================================
function openConfigModal() {
    document.getElementById('commissionPercent').value = tauxCommission;
    document.getElementById('modalConfig').classList.add('active');
    
    setTimeout(() => {
        lucide.createIcons();
    }, 100);
}

function closeConfigModal() {
    document.getElementById('modalConfig').classList.remove('active');
}

async function saveConfig(e) {
    e.preventDefault();
    
    const newPercent = parseFloat(document.getElementById('commissionPercent').value);
    
    if (isNaN(newPercent) || newPercent < 0 || newPercent > 100) {
        alert('Veuillez entrer un pourcentage valide entre 0 et 100.');
        return;
    }
    
    try {
        // Mettre à jour en BDD
        const { error } = await supabaseClient
            .from('system_config')
            .upsert({
                cle: 'commission_prestations_percent',
                valeur: newPercent.toString(),
                description: 'Pourcentage de commission sur les prestations supplémentaires'
            }, {
                onConflict: 'cle'
            });
        
        if (error) throw error;
        
        // Mettre à jour localement
        tauxCommission = newPercent;
        document.getElementById('stat-taux-commission').textContent = tauxCommission + '%';
        
        alert(`✅ Configuration sauvegardée !\n\nNouveau taux de commission : ${tauxCommission}%`);
        closeConfigModal();
        
        // Recharger les stats
        loadStatsGlobales();
        
    } catch (error) {
        console.error('Erreur sauvegarde config:', error);
        alert('❌ Erreur lors de la sauvegarde : ' + error.message);
    }
}

// ==========================================
// HELPERS
// ==========================================
function formatEuro(montant) {
    return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR'
    }).format(montant);
}

function getBadgeStatut(statut) {
    const badges = {
        'paid': '<span class="badge badge-success">Payé</span>',
        'pending': '<span class="badge badge-warning">En attente</span>',
        'cancelled': '<span class="badge badge-danger">Annulé</span>'
    };
    return badges[statut] || '<span class="badge">' + statut + '</span>';
}

function showError(message) {
    const alert = document.createElement('div');
    alert.className = 'alert alert-danger';
    alert.textContent = message;
    document.querySelector('.container').prepend(alert);
    
    setTimeout(() => alert.remove(), 5000);
}

// Export fonctions globales
window.openConfigModal = openConfigModal;
window.closeConfigModal = closeConfigModal;
window.saveConfig = saveConfig;
