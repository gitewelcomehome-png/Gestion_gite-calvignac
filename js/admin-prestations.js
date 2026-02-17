// ==========================================
// ADMIN PRESTATIONS SUPPLÉMENTAIRES
// Version: 1.0
// ==========================================

const { createClient } = supabase;

// Configuration Supabase
const SUPABASE_URL = 'https://bndhywxqzwiwblhhqbzz.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJuZGh5d3hxendpd2JsaGhxYnp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU4OTEwMzAsImV4cCI6MjA1MTQ2NzAzMH0.hB4oWGnmZNxN7T5CKuxcr8Qa9WgFzwZnxhZIHqL-Jxg';
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);

// État global
let currentGiteId = null;
let prestations = [];
let commandes = [];

// ==========================================
// INITIALISATION
// ==========================================
document.addEventListener('DOMContentLoaded', async () => {
    await loadGites();
});

// ==========================================
// GESTION GÎTES
// ==========================================
async function loadGites() {
    try {
        const { data, error } = await supabaseClient
            .from('gites')
            .select('id, name')
            .order('name');
        
        if (error) throw error;
        
        const select = document.getElementById('giteSelect');
        select.innerHTML = '<option value="">-- Sélectionner un gîte --</option>';
        
        data.forEach(gite => {
            const option = document.createElement('option');
            option.value = gite.id;
            option.textContent = gite.name;
            select.appendChild(option);
        });
        
        // Sélectionner le premier automatiquement
        if (data.length > 0) {
            select.value = data[0].id;
            currentGiteId = data[0].id;
            await loadPrestations();
            await loadStats();
        }
    } catch (error) {
        console.error('Erreur chargement gîtes:', error);
        alert('Erreur lors du chargement des gîtes');
    }
}

async function loadPrestations() {
    const giteId = document.getElementById('giteSelect').value;
    
    if (!giteId) {
        document.getElementById('prestationsGrid').innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📦</div>
                <p>Sélectionnez un gîte pour voir les prestations</p>
            </div>
        `;
        return;
    }
    
    currentGiteId = giteId;
    
    try {
        const { data, error } = await supabaseClient
            .from('prestations_catalogue')
            .select('*')
            .eq('gite_id', giteId)
            .order('ordre');
        
        if (error) throw error;
        
        prestations = data;
        renderPrestations();
        
    } catch (error) {
        console.error('Erreur chargement prestations:', error);
        alert('Erreur lors du chargement des prestations');
    }
}

function renderPrestations() {
    const grid = document.getElementById('prestationsGrid');
    
    if (prestations.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📦</div>
                <p>Aucune prestation créée pour ce gîte</p>
                <button class="btn btn-primary" onclick="openModal('add')">Créer une prestation</button>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = prestations.map(p => `
        <div class="prestation-card">
            <div class="prestation-header">
                <div class="icone">${p.icone || '📦'}</div>
                <div class="prestation-info">
                    <h3 class="prestation-nom">${p.nom}</h3>
                    <div class="prestation-prix">${p.prix.toFixed(2)} €</div>
                </div>
            </div>
            
            ${p.description ? `<p class="prestation-description">${p.description}</p>` : ''}
            
            <div class="prestation-meta">
                <span class="badge ${p.is_active ? 'badge-success' : 'badge-danger'}">
                    ${p.is_active ? '✅ Active' : '❌ Inactive'}
                </span>
                <span class="badge badge-info">${getCategorieLabel(p.categorie)}</span>
            </div>
            
            <div class="prestation-actions">
                <button class="btn btn-warning btn-sm" onclick="editPrestation(${p.id})">
                    ✏️ Modifier
                </button>
                <button class="btn btn-danger btn-sm" onclick="deletePrestation(${p.id})">
                    🗑️ Supprimer
                </button>
            </div>
        </div>
    `).join('');
}

function getCategorieLabel(categorie) {
    const labels = {
        'repas': '🍽️ Repas',
        'activite': '🎯 Activité',
        'menage': '🧹 Ménage',
        'location': '🚴 Location',
        'autre': '📦 Autre'
    };
    return labels[categorie] || categorie;
}

// ==========================================
// MODAL GESTION
// ==========================================
function openModal(mode, prestationId = null) {
    const modal = document.getElementById('modalPrestation');
    const title = document.getElementById('modalTitle');
    const form = document.getElementById('prestationForm');
    
    form.reset();
    document.getElementById('prestationId').value = '';
    
    if (mode === 'add') {
        title.textContent = 'Nouvelle Prestation';
        document.getElementById('is_active').value = 'true';
    } else if (mode === 'edit' && prestationId) {
        title.textContent = 'Modifier Prestation';
        const prestation = prestations.find(p => p.id === prestationId);
        if (prestation) {
            document.getElementById('prestationId').value = prestation.id;
            document.getElementById('nom').value = prestation.nom || '';
            document.getElementById('nom_en').value = prestation.nom_en || '';
            document.getElementById('description').value = prestation.description || '';
            document.getElementById('description_en').value = prestation.description_en || '';
            document.getElementById('prix').value = prestation.prix || '';
            document.getElementById('categorie').value = prestation.categorie || 'autre';
            document.getElementById('icone').value = prestation.icone || '';
            document.getElementById('is_active').value = prestation.is_active ? 'true' : 'false';
        }
    }
    
    modal.classList.add('active');
}

function closeModal() {
    document.getElementById('modalPrestation').classList.remove('active');
}

async function savePrestation(event) {
    event.preventDefault();
    
    if (!currentGiteId) {
        alert('Veuillez sélectionner un gîte');
        return;
    }
    
    const prestationId = document.getElementById('prestationId').value;
    
    const data = {
        gite_id: parseInt(currentGiteId),
        nom: document.getElementById('nom').value,
        nom_en: document.getElementById('nom_en').value || null,
        description: document.getElementById('description').value || null,
        description_en: document.getElementById('description_en').value || null,
        prix: parseFloat(document.getElementById('prix').value),
        categorie: document.getElementById('categorie').value,
        icone: document.getElementById('icone').value || '📦',
        is_active: document.getElementById('is_active').value === 'true'
    };
    
    try {
        let result;
        
        if (prestationId) {
            // Update
            result = await supabaseClient
                .from('prestations_catalogue')
                .update(data)
                .eq('id', prestationId);
        } else {
            // Insert
            result = await supabaseClient
                .from('prestations_catalogue')
                .insert([data]);
        }
        
        if (result.error) throw result.error;
        
        closeModal();
        await loadPrestations();
        
        alert(prestationId ? 'Prestation modifiée avec succès !' : 'Prestation créée avec succès !');
        
    } catch (error) {
        console.error('Erreur sauvegarde prestation:', error);
        alert('Erreur lors de la sauvegarde : ' + error.message);
    }
}

function editPrestation(id) {
    openModal('edit', id);
}

async function deletePrestation(id) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette prestation ?')) {
        return;
    }
    
    try {
        const { error } = await supabaseClient
            .from('prestations_catalogue')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        
        await loadPrestations();
        alert('Prestation supprimée avec succès !');
        
    } catch (error) {
        console.error('Erreur suppression prestation:', error);
        alert('Erreur lors de la suppression : ' + error.message);
    }
}

// ==========================================
// GESTION ONGLETS
// ==========================================
function switchTab(tabName) {
    // Désactiver tous les onglets
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    
    // Activer l'onglet sélectionné
    document.querySelector(`.tab:nth-child(${getTabIndex(tabName)})`).classList.add('active');
    document.getElementById(`tab-${tabName}`).classList.add('active');
    
    // Charger les données selon l'onglet
    if (tabName === 'commandes') {
        loadCommandes();
    } else if (tabName === 'stats') {
        loadStats();
    }
}

function getTabIndex(tabName) {
    const tabs = { 'catalogue': 1, 'commandes': 2, 'stats': 3 };
    return tabs[tabName] || 1;
}

// ==========================================
// GESTION COMMANDES
// ==========================================
async function loadCommandes() {
    if (!currentGiteId) return;
    
    try {
        const { data, error } = await supabaseClient
            .from('commandes_prestations')
            .select(`
                *,
                reservation:reservations(
                    client_name
                )
            `)
            .eq('gite_id', currentGiteId)
            .order('date_commande', { ascending: false });
        
        if (error) throw error;
        
        commandes = data;
        renderCommandes();
        
    } catch (error) {
        console.error('Erreur chargement commandes:', error);
    }
}

function renderCommandes() {
    const tbody = document.getElementById('commandesTableBody');
    
    if (commandes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty-state">Aucune commande</td></tr>';
        return;
    }
    
    tbody.innerHTML = commandes.map(c => `
        <tr>
            <td><strong>${c.numero_commande}</strong></td>
            <td>${new Date(c.date_commande).toLocaleDateString('fr-FR')}</td>
            <td>${c.reservation?.client_name || 'N/A'}</td>
            <td><strong>${c.montant_prestations.toFixed(2)} €</strong></td>
            <td><span class="badge ${getStatutBadge(c.statut)}">${getStatutLabel(c.statut)}</span></td>
            <td>
                <button class="btn btn-sm btn-secondary" onclick="viewCommande(${c.id})">Voir détails</button>
            </td>
        </tr>
    `).join('');
}

function getStatutLabel(statut) {
    const labels = {
        'paid': '💳 Payée',
        'confirmed': '✅ Confirmée',
        'delivered': '📦 Livrée',
        'cancelled': '❌ Annulée'
    };
    return labels[statut] || statut;
}

function getStatutBadge(statut) {
    const badges = {
        'paid': 'badge-info',
        'confirmed': 'badge-success',
        'delivered': 'badge-success',
        'cancelled': 'badge-danger'
    };
    return badges[statut] || 'badge-info';
}

function viewCommande(id) {
    alert('Détails commande #' + id + ' - À implémenter');
}

// ==========================================
// STATISTIQUES
// ==========================================
async function loadStats() {
    if (!currentGiteId) return;
    
    try {
        const year = new Date().getFullYear();
        
        const { data, error } = await supabaseClient
            .from('commandes_prestations')
            .select('montant_prestations, montant_commission, montant_net_owner')
            .eq('gite_id', currentGiteId)
            .neq('statut', 'cancelled')
            .gte('date_commande', `${year}-01-01`)
            .lte('date_commande', `${year}-12-31`);
        
        if (error) throw error;
        
        const ca_brut = data.reduce((sum, c) => sum + parseFloat(c.montant_prestations), 0);
        const ca_net = data.reduce((sum, c) => sum + parseFloat(c.montant_net_owner), 0);
        const commissions = data.reduce((sum, c) => sum + parseFloat(c.montant_commission), 0);
        
        document.getElementById('stat-ca-brut').textContent = ca_brut.toFixed(2) + ' €';
        document.getElementById('stat-ca-net').textContent = ca_net.toFixed(2) + ' €';
        document.getElementById('stat-commissions').textContent = commissions.toFixed(2) + ' €';
        document.getElementById('stat-nb-commandes').textContent = data.length;
        
    } catch (error) {
        console.error('Erreur chargement stats:', error);
    }
}

// Fermer modal au clic extérieur
document.getElementById('modalPrestation')?.addEventListener('click', (e) => {
    if (e.target.id === 'modalPrestation') {
        closeModal();
    }
});

document.getElementById('configModal')?.addEventListener('click', (e) => {
    if (e.target.id === 'configModal') {
        closeConfigModal();
    }
});

// ==========================================
// GESTION CONFIGURATION COMMISSION
// ==========================================
async function openConfigModal() {
    try {
        // Charger la valeur actuelle
        const { data, error } = await supabaseClient
            .from('system_config')
            .select('valeur')
            .eq('cle', 'commission_prestations_percent')
            .single();
        
        if (error) throw error;
        
        document.getElementById('commission_percent').value = data?.valeur || 5;
        document.getElementById('configModal').classList.add('active');
    } catch (error) {
        console.error('Erreur chargement config:', error);
        alert('❌ Erreur chargement configuration');
    }
}

function closeConfigModal() {
    document.getElementById('configModal').classList.remove('active');
}

async function saveConfig(e) {
    e.preventDefault();
    
    const percent = parseFloat(document.getElementById('commission_percent').value);
    
    if (percent < 0 || percent > 100) {
        alert('❌ Le pourcentage doit être entre 0 et 100');
        return;
    }
    
    try {
        const { error } = await supabaseClient
            .from('system_config')
            .upsert({
                cle: 'commission_prestations_percent',
                valeur: percent.toString(),
                description: 'Pourcentage de commission sur les prestations (sans le symbole %)',
                updated_at: new Date().toISOString()
            });
        
        if (error) throw error;
        
        alert('✅ Configuration enregistrée ! Nouveau taux : ' + percent + '%');
        closeConfigModal();
        
        // Recharger les stats pour refléter le nouveau %
        if (currentGiteId) {
            await loadStats();
        }
    } catch (error) {
        console.error('Erreur sauvegarde config:', error);
        alert('❌ Erreur sauvegarde configuration: ' + error.message);
    }
}
