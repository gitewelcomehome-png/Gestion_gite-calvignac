// ==========================================
// DESKTOP OWNER - STATS PRESTATIONS
// Version: 1.0
// ==========================================

const { createClient } = supabase;

// Configuration Supabase
const SUPABASE_URL = 'https://bndhywxqzwiwblhhqbzz.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJuZGh5d3hxendpd2JsaGhxYnp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU4OTEwMzAsImV4cCI6MjA1MTQ2NzAzMH0.hB4oWGnmZNxN7T5CKuxcr8Qa9WgFzwZnxhZIHqL-Jxg';
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);

// État global
let currentGiteId = null;
let dataMensuelle = [];
let dataAnnuelle = [];
let periodeActive = 'mois';

// ==========================================
// INITIALISATION
// ==========================================
document.addEventListener('DOMContentLoaded', async () => {
    await loadGites();
    loadToggleState();
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
        select.innerHTML = '<option value="">-- Tous les gîtes --</option>';
        
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
            await loadStatsPrestations();
        }
    } catch (error) {
        console.error('Erreur chargement gîtes:', error);
    }
}

// ==========================================
// CHARGEMENT STATISTIQUES
// ==========================================
async function loadStatsPrestations() {
    const giteId = document.getElementById('giteSelect').value;
    currentGiteId = giteId;
    
    if (!giteId) {
        resetStats();
        return;
    }
    
    try {
        await Promise.all([
            loadStatsAnnuelles(giteId),
            loadStatsMensuelles(giteId),
            loadStatsParAnnee(giteId)
        ]);
        
        renderCurrentView();
        
    } catch (error) {
        console.error('Erreur chargement stats:', error);
    }
}

async function loadStatsAnnuelles(giteId) {
    const year = new Date().getFullYear();
    
    const { data, error } = await supabaseClient
        .from('commandes_prestations')
        .select('montant_prestations, montant_commission, montant_net_owner')
        .eq('gite_id', giteId)
        .neq('statut', 'cancelled')
        .gte('date_commande', `${year}-01-01`)
        .lte('date_commande', `${year}-12-31`);
    
    if (error) throw error;
    
    const ca_brut = data.reduce((sum, c) => sum + parseFloat(c.montant_prestations || 0), 0);
    const ca_net = data.reduce((sum, c) => sum + parseFloat(c.montant_net_owner || 0), 0);
    const commissions = data.reduce((sum, c) => sum + parseFloat(c.montant_commission || 0), 0);
    
    document.getElementById('stat-ca-annuel').textContent = formatEuro(ca_net);
    document.getElementById('stat-ca-brut').textContent = formatEuro(ca_brut);
    document.getElementById('stat-commissions').textContent = formatEuro(commissions);
    document.getElementById('stat-nb-commandes').textContent = data.length;
}

async function loadStatsMensuelles(giteId) {
    const year = new Date().getFullYear();
    
    const { data, error } = await supabaseClient
        .from('commandes_prestations')
        .select('*')
        .eq('gite_id', giteId)
        .neq('statut', 'cancelled')
        .gte('date_commande', `${year}-01-01`)
        .lte('date_commande', `${year}-12-31`)
        .order('date_commande', { ascending: false });
    
    if (error) throw error;
    
    // Grouper par mois
    const grouped = {};
    data.forEach(c => {
        const mois = new Date(c.date_commande).toLocaleString('fr-FR', { year: 'numeric', month: 'long' });
        if (!grouped[mois]) {
            grouped[mois] = {
                mois,
                nb: 0,
                brut: 0,
                commission: 0,
                net: 0
            };
        }
        grouped[mois].nb++;
        grouped[mois].brut += parseFloat(c.montant_prestations || 0);
        grouped[mois].commission += parseFloat(c.montant_commission || 0);
        grouped[mois].net += parseFloat(c.montant_net_owner || 0);
    });
    
    dataMensuelle = Object.values(grouped);
}

async function loadStatsParAnnee(giteId) {
    const { data, error } = await supabaseClient
        .from('commandes_prestations')
        .select('*')
        .eq('gite_id', giteId)
        .neq('statut', 'cancelled')
        .order('date_commande', { ascending: false });
    
    if (error) throw error;
    
    // Grouper par année
    const grouped = {};
    data.forEach(c => {
        const annee = new Date(c.date_commande).getFullYear();
        if (!grouped[annee]) {
            grouped[annee] = {
                annee,
                nb: 0,
                brut: 0,
                commission: 0,
                net: 0
            };
        }
        grouped[annee].nb++;
        grouped[annee].brut += parseFloat(c.montant_prestations || 0);
        grouped[annee].commission += parseFloat(c.montant_commission || 0);
        grouped[annee].net += parseFloat(c.montant_net_owner || 0);
    });
    
    dataAnnuelle = Object.values(grouped).sort((a, b) => b.annee - a.annee);
}

function resetStats() {
    document.getElementById('stat-ca-annuel').textContent = '0 €';
    document.getElementById('stat-ca-brut').textContent = '0 €';
    document.getElementById('stat-commissions').textContent = '0 €';
    document.getElementById('stat-nb-commandes').textContent = '0';
    dataMensuelle = [];
    dataAnnuelle = [];
    renderCurrentView();
}

// ==========================================
// AFFICHAGE
// ==========================================
function switchPeriode(periode) {
    periodeActive = periode;
    
    // Update boutons
    document.querySelectorAll('.periode-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Update cartes
    document.getElementById('card-mois').style.display = periode === 'mois' ? 'block' : 'none';
    document.getElementById('card-annee').style.display = periode === 'annee' ? 'block' : 'none';
    
    renderCurrentView();
}

function renderCurrentView() {
    if (periodeActive === 'mois') {
        renderTableMois();
    } else {
        renderTableAnnee();
    }
}

function renderTableMois() {
    const tbody = document.getElementById('tableMoisBody');
    
    if (dataMensuelle.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="empty-state">
                    <div class="empty-icon">📦</div>
                    <p>Aucune donnée pour cette année</p>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = dataMensuelle.map(d => {
        const panierMoyen = d.nb > 0 ? d.brut / d.nb : 0;
        return `
            <tr>
                <td><strong>${d.mois}</strong></td>
                <td>${d.nb}</td>
                <td>${formatEuro(d.brut)}</td>
                <td>${formatEuro(d.commission)}</td>
                <td><strong>${formatEuro(d.net)}</strong></td>
                <td>${formatEuro(panierMoyen)}</td>
            </tr>
        `;
    }).join('');
}

function renderTableAnnee() {
    const tbody = document.getElementById('tableAnneeBody');
    
    if (dataAnnuelle.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="empty-state">
                    <div class="empty-icon">📦</div>
                    <p>Aucune donnée disponible</p>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = dataAnnuelle.map(d => {
        const panierMoyen = d.nb > 0 ? d.brut / d.nb : 0;
        return `
            <tr>
                <td><strong>${d.annee}</strong></td>
                <td>${d.nb}</td>
                <td>${formatEuro(d.brut)}</td>
                <td>${formatEuro(d.commission)}</td>
                <td><strong>${formatEuro(d.net)}</strong></td>
                <td>${formatEuro(panierMoyen)}</td>
            </tr>
        `;
    }).join('');
}

// ==========================================
// TOGGLE INCLUSION CA GLOBAL
// ==========================================
function saveToggleState() {
    const isChecked = document.getElementById('toggleIncludeGlobal').checked;
    const giteId = currentGiteId;
    
    if (!giteId) return;
    
    // Sauvegarder dans localStorage temporairement
    // TODO: Sauvegarder en BDD dans table user_preferences
    localStorage.setItem(`toggle_prestations_global_${giteId}`, isChecked);
    
    updateToggleInfo(isChecked);
    
    // TODO: Mettre à jour le calcul du CA global sur les autres pages
    console.log('Toggle sauvegardé:', isChecked ? 'Activé' : 'Désactivé');
}

function loadToggleState() {
    const giteId = currentGiteId;
    if (!giteId) return;
    
    const saved = localStorage.getItem(`toggle_prestations_global_${giteId}`);
    const isChecked = saved === 'true';
    
    document.getElementById('toggleIncludeGlobal').checked = isChecked;
    updateToggleInfo(isChecked);
}

function updateToggleInfo(isChecked) {
    const info = document.getElementById('toggleInfo');
    if (isChecked) {
        info.textContent = '✅ Inclus dans le CA global';
        info.style.color = '#2d6b3d';
        info.style.fontWeight = '600';
    } else {
        info.textContent = '❌ Séparé du CA global';
        info.style.color = '#718096';
        info.style.fontWeight = '400';
    }
}

// ==========================================
// UTILITAIRES
// ==========================================
function formatEuro(value) {
    return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 2
    }).format(value);
}

// Recharger toggle state quand on change de gîte
document.getElementById('giteSelect')?.addEventListener('change', () => {
    loadToggleState();
});
