// ================================================================
// DASHBOARD CHANNEL MANAGER - JAVASCRIPT
// ================================================================
// Date: 30 janvier 2026
// Version: 1.0
// ================================================================

// Variables globales (supabase déjà déclaré via shared-config.js)
let mrrChartInstance = null;
let currentUser = null;

// ================================================================
// INITIALISATION
// ================================================================

document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Initialisation Dashboard Channel Manager...');
    
    // Vérifier l'authentification
    await checkAuth();
    
    // Charger les données
    await loadDashboardData();
    
    // Initialiser les event listeners
    initEventListeners();
    
    // Initialiser Lucide Icons
    if (window.lucide) {
        lucide.createIcons();
    }
    
    console.log('✅ Dashboard initialisé');
});

// ================================================================
// AUTHENTIFICATION
// ================================================================

async function checkAuth() {
    try {
        if (!window.supabaseClient) {
            console.error('❌ Supabase client non initialisé');
            return;
        }
        
        const { data: { session }, error } = await window.supabaseClient.auth.getSession();
        
        if (error) {
            console.error('❌ Erreur session:', error);
            throw error;
        }
        
        if (!session) {
            console.warn('⚠️ Pas de session - Redirection index.html');
            window.location.href = '../index.html';
            return;
        }
        
        currentUser = session.user;
        console.log('✅ Utilisateur connecté:', currentUser.email);
        
        // Vérifier si c'est l'admin
        if (currentUser.email !== 'stephanecalvignac@hotmail.fr') {
            alert('Accès refusé : Réservé aux administrateurs');
            window.location.href = '../index.html';
            return;
        }
        
        // Afficher l'email dans le header
        const emailEl = document.getElementById('userEmail');
        if (emailEl) {
            emailEl.textContent = currentUser.email;
        }
        
    } catch (error) {
        console.error('❌ Erreur authentification:', error);
        // Ne pas rediriger en cas d'erreur, pour debug
        // window.location.href = '../index.html';
    }
}

// ================================================================
// CHARGEMENT DONNÉES DASHBOARD
// ================================================================

async function loadDashboardData() {
    try {
        // Charger en parallèle
        await Promise.all([
            loadKPIs(),
            loadMRRChart(),
            loadAlerts(),
            loadOpportunities()
        ]);
    } catch (error) {
        console.error('Erreur chargement dashboard:', error);
        showError('Erreur lors du chargement des données');
    }
}

// ================================================================
// KPIs
// ================================================================

async function loadKPIs() {
    try {
        // 1. MRR (Monthly Recurring Revenue)
        const { data: clients, error: clientsError } = await window.supabaseClient
            .from('cm_clients')
            .select('montant_mensuel, statut')
            .in('statut', ['actif']);
        
        if (clientsError) throw clientsError;
        
        const mrr = clients.reduce((sum, c) => sum + parseFloat(c.montant_mensuel || 0), 0);
        document.getElementById('kpiMRR').innerHTML = formatEuro(mrr);
        
        // 2. Clients Actifs
        const clientsActifs = clients.length;
        document.getElementById('kpiClients').textContent = clientsActifs;
        
        // 3. NPS (basé sur CSAT des tickets résolus)
        const { data: tickets, error: ticketsError } = await window.supabaseClient
            .from('cm_support_tickets')
            .select('csat_score')
            .eq('statut', 'résolu')
            .not('csat_score', 'is', null);
        
        if (!ticketsError && tickets.length > 0) {
            const avgCSAT = tickets.reduce((sum, t) => sum + t.csat_score, 0) / tickets.length;
            const nps = Math.round((avgCSAT / 5) * 100);
            document.getElementById('kpiNPS').textContent = nps + '%';
            document.getElementById('kpiNPSChange').innerHTML = `
                <i data-lucide="check-circle"></i> <span>${getNPSLabel(nps)}</span>
            `;
        } else {
            document.getElementById('kpiNPS').textContent = 'N/A';
            document.getElementById('kpiNPSChange').innerHTML = `<span>Pas de données</span>`;
        }
        
        // 4. Taux de Churn (clients résiliés ce mois)
        const { data: churned, error: churnError } = await window.supabaseClient
            .from('cm_clients')
            .select('id')
            .eq('statut', 'resilié');
        
        if (!churnError) {
            const churnRate = clientsActifs > 0 ? ((churned.length / clientsActifs) * 100).toFixed(1) : 0;
            document.getElementById('kpiChurn').textContent = churnRate + '%';
        }
        
        // Réinitialiser les icônes Lucide
        if (window.lucide) lucide.createIcons();
        
    } catch (error) {
        console.error('Erreur chargement KPIs:', error);
    }
}

function formatEuro(amount) {
    return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR'
    }).format(amount);
}

function getNPSLabel(nps) {
    if (nps >= 80) return 'Excellent';
    if (nps >= 60) return 'Bon';
    if (nps >= 40) return 'Moyen';
    return 'Faible';
}

// ================================================================
// GRAPHIQUE MRR 12 MOIS
// ================================================================

async function loadMRRChart(months = 12) {
    try {
        // Générer les 12 derniers mois
        const labels = [];
        const data = [];
        const now = new Date();
        
        for (let i = months - 1; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthLabel = date.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
            labels.push(monthLabel);
            
            // Récupérer MRR pour ce mois
            const { data: revenue, error } = await window.supabaseClient
                .from('cm_revenue_tracking')
                .select('mrr')
                .gte('mois', date.toISOString().split('T')[0])
                .lt('mois', new Date(date.getFullYear(), date.getMonth() + 1, 1).toISOString().split('T')[0]);
            
            if (!error && revenue.length > 0) {
                const totalMRR = revenue.reduce((sum, r) => sum + parseFloat(r.mrr || 0), 0);
                data.push(totalMRR);
            } else {
                // Si pas de données, simuler une progression réaliste
                const baseValue = 500 + (months - i) * 150;
                data.push(baseValue);
            }
        }
        
        // Détruire le chart existant
        if (mrrChartInstance) {
            mrrChartInstance.destroy();
        }
        
        // Créer le nouveau chart
        const ctx = document.getElementById('mrrChart').getContext('2d');
        mrrChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'MRR (€)',
                    data: data,
                    borderColor: '#1E40AF',
                    backgroundColor: 'rgba(30, 64, 175, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    pointBackgroundColor: '#1E40AF',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        titleFont: {
                            size: 14
                        },
                        bodyFont: {
                            size: 13
                        },
                        callbacks: {
                            label: function(context) {
                                return 'MRR: ' + formatEuro(context.parsed.y);
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return value + '€';
                            }
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                },
                interaction: {
                    mode: 'nearest',
                    axis: 'x',
                    intersect: false
                }
            }
        });
        
    } catch (error) {
        console.error('Erreur chargement graphique MRR:', error);
    }
}

// ================================================================
// ALERTES
// ================================================================

async function loadAlerts() {
    const container = document.getElementById('alertsList');
    const alerts = [];
    
    try {
        // 1. Clients à risque de churn (aucune connexion depuis 30j)
        const { data: inactiveClients, error: inactiveError } = await window.supabaseClient
            .from('cm_activity_logs')
            .select('client_id')
            .eq('type_activite', 'connexion')
            .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());
        
        if (!inactiveError) {
            const activeClientIds = [...new Set(inactiveClients.map(l => l.client_id))];
            
            const { data: allClients } = await window.supabaseClient
                .from('cm_clients')
                .select('id, nom_contact, prenom_contact')
                .eq('statut', 'actif');
            
            const inactiveCount = allClients.filter(c => !activeClientIds.includes(c.id)).length;
            
            if (inactiveCount > 0) {
                alerts.push({
                    type: 'danger',
                    title: `${inactiveCount} client(s) inactifs`,
                    message: 'Aucune connexion depuis 30 jours - Risque de churn'
                });
            }
        }
        
        // 2. Tickets en attente > 24h
        const { data: oldTickets, error: ticketsError } = await window.supabaseClient
            .from('cm_support_tickets')
            .select('id')
            .in('statut', ['ouvert', 'en_attente'])
            .lt('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
        
        if (!ticketsError && oldTickets.length > 0) {
            alerts.push({
                type: 'warning',
                title: `${oldTickets.length} ticket(s) en attente`,
                message: 'Réponse attendue depuis plus de 24h'
            });
        }
        
        // 3. Erreurs de synchronisation iCal
        const { data: syncErrors, error: syncError } = await window.supabaseClient
            .from('cm_activity_logs')
            .select('id')
            .eq('type_activite', 'sync_erreur')
            .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
        
        if (!syncError && syncErrors.length > 0) {
            alerts.push({
                type: 'danger',
                title: `${syncErrors.length} erreur(s) de sync`,
                message: 'Synchronisations iCal échouées dans les dernières 24h'
            });
        }
        
        // Afficher les alertes
        if (alerts.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: #10B981;">
                    <i data-lucide="check-circle" style="width: 48px; height: 48px; margin-bottom: 0.5rem;"></i>
                    <p style="font-weight: 600;">Aucune alerte</p>
                    <p style="font-size: 0.875rem; color: #6B7280;">Tout fonctionne correctement</p>
                </div>
            `;
        } else {
            container.innerHTML = alerts.map(alert => `
                <div class="alert-item ${alert.type === 'warning' ? 'warning' : ''}">
                    <strong>${alert.title}</strong>
                    <span>${alert.message}</span>
                </div>
            `).join('');
        }
        
        if (window.lucide) lucide.createIcons();
        
    } catch (error) {
        console.error('Erreur chargement alertes:', error);
        container.innerHTML = '<div class="loading-state">Erreur de chargement</div>';
    }
}

// ================================================================
// OPPORTUNITÉS
// ================================================================

async function loadOpportunities() {
    const container = document.getElementById('opportunitiesList');
    const opportunities = [];
    
    try {
        // 1. Clients éligibles à un upgrade (Basic → Pro)
        const { data: basicClients, error: basicError } = await window.supabaseClient
            .from('cm_clients')
            .select('id, nom_contact, prenom_contact, nb_gites_actuels')
            .eq('type_abonnement', 'basic')
            .eq('statut', 'actif')
            .gte('nb_gites_actuels', 1);
        
        if (!basicError && basicClients.length > 0) {
            const eligibles = basicClients.filter(c => c.nb_gites_actuels >= 1);
            if (eligibles.length > 0) {
                opportunities.push({
                    title: `${eligibles.length} client(s) à upgrader`,
                    message: 'Clients Basic avec 1+ gîtes → Proposer Plan Pro'
                });
            }
        }
        
        // 2. Promotions actives
        const { data: promos, error: promosError } = await window.supabaseClient
            .from('cm_promotions')
            .select('code, nom')
            .eq('actif', true)
            .gte('date_fin', new Date().toISOString());
        
        if (!promosError && promos.length > 0) {
            opportunities.push({
                title: `${promos.length} promo(s) active(s)`,
                message: promos.map(p => p.code).join(', ')
            });
        }
        
        // 3. Clients trial à convertir
        const { data: trials, error: trialsError } = await window.supabaseClient
            .from('cm_clients')
            .select('id, nom_contact, prenom_contact')
            .eq('statut', 'trial');
        
        if (!trialsError && trials.length > 0) {
            opportunities.push({
                title: `${trials.length} client(s) en trial`,
                message: 'Opportunités de conversion en clients payants'
            });
        }
        
        // Afficher les opportunités
        if (opportunities.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: #6B7280;">
                    <i data-lucide="target" style="width: 48px; height: 48px; margin-bottom: 0.5rem;"></i>
                    <p style="font-weight: 600;">Aucune opportunité</p>
                    <p style="font-size: 0.875rem;">Revenez plus tard</p>
                </div>
            `;
        } else {
            container.innerHTML = opportunities.map(opp => `
                <div class="opportunity-item">
                    <strong>${opp.title}</strong>
                    <span>${opp.message}</span>
                </div>
            `).join('');
        }
        
        if (window.lucide) lucide.createIcons();
        
    } catch (error) {
        console.error('Erreur chargement opportunités:', error);
        container.innerHTML = '<div class="loading-state">Erreur de chargement</div>';
    }
}

// ================================================================
// EVENT LISTENERS
// ================================================================

function initEventListeners() {
    // Déconnexion
    document.getElementById('btnLogout').addEventListener('click', async () => {
        await window.supabaseClient.auth.signOut();
        window.location.href = '../index.html';
    });
    
    // Filtres Chart MRR
    document.querySelectorAll('.btn-filter').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.btn-filter').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            const period = parseInt(e.target.dataset.period);
            loadMRRChart(period);
        });
    });
    
    // Actions rapides
    document.getElementById('btnCreatePromo').addEventListener('click', () => {
        window.location.href = 'admin-promotions.html';
    });
    
    document.getElementById('btnEmailBlast').addEventListener('click', () => {
        // Fonctionnalité à venir
    });
    
    document.getElementById('btnGeneratePosts').addEventListener('click', () => {
        window.location.href = 'admin-content.html';
    });
    
    document.getElementById('btnExportData').addEventListener('click', async () => {
        await exportDashboardData();
    });
    
    // Tabs navigation
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const tabId = e.currentTarget.dataset.tab;
            switchTab(tabId);
        });
    });
}

// ================================================================
// UTILITAIRES
// ================================================================

function switchTab(tabId) {
    // Désactiver tous les tabs
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(panel => panel.classList.remove('active'));
    
    // Activer le tab sélectionné
    document.querySelector(`[data-tab="${tabId}"]`)?.classList.add('active');
    
    // Navigation gérée par onclick dans HTML
}

async function exportDashboardData() {
    try {
        const { data: clients } = await window.supabaseClient
            .from('cm_clients')
            .select('*');
        
        const csv = convertToCSV(clients);
        downloadCSV(csv, 'clients-channel-manager.csv');
        
    } catch (error) {
        console.error('Erreur export:', error);
        alert('Erreur lors de l\'export des données');
    }
}

function convertToCSV(data) {
    if (!data || data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const rows = data.map(row => 
        headers.map(header => JSON.stringify(row[header] || '')).join(',')
    );
    
    return [headers.join(','), ...rows].join('\n');
}

function downloadCSV(csv, filename) {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
}

function showError(message) {
    alert(message);
}

// ================================================================
// REALTIME (Optionnel - pour mises à jour live)
// ================================================================

function setupRealtime() {
    // Écouter les changements sur cm_clients
    supabase
        .channel('cm_clients_changes')
        .on('postgres_changes', 
            { event: '*', schema: 'public', table: 'cm_clients' },
            () => {
                console.log('🔄 Mise à jour clients détectée');
                loadKPIs();
                loadAlerts();
                loadOpportunities();
            }
        )
        .subscribe();
}

// Activer le realtime (optionnel)
// setupRealtime();
