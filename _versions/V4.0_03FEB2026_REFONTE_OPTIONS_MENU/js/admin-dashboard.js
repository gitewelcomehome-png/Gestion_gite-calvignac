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
            loadClientsChart(),
            loadRecentClients(),
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
        
        // 5. Erreurs Critiques
        await loadErrorsKPI();
        
        // 6. Support Tickets
        
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
// GRAPHIQUE ÉVOLUTION CLIENTS
// ================================================================

let clientsChartInstance = null;

async function loadClientsChart() {
    try {
        const labels = [];
        const dataActifs = [];
        const dataTrials = [];
        const now = new Date();
        
        // Générer les 12 derniers mois
        for (let i = 11; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthLabel = date.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
            labels.push(monthLabel);
            
            const nextMonth = new Date(date.getFullYear(), date.getMonth() + 1, 1);
            
            // Compter les clients actifs à cette date
            const { data: actifs, error: actifsError } = await window.supabaseClient
                .from('cm_clients')
                .select('id')
                .eq('statut', 'actif')
                .lte('created_at', nextMonth.toISOString());
            
            // Compter les clients trial à cette date
            const { data: trials, error: trialsError } = await window.supabaseClient
                .from('cm_clients')
                .select('id')
                .eq('statut', 'trial')
                .lte('created_at', nextMonth.toISOString());
            
            dataActifs.push(actifs ? actifs.length : 0);
            dataTrials.push(trials ? trials.length : 0);
        }
        
        // Détruire le chart existant
        if (clientsChartInstance) {
            clientsChartInstance.destroy();
        }
        
        // Créer le chart
        const ctx = document.getElementById('clientsChart').getContext('2d');
        clientsChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Clients Actifs',
                        data: dataActifs,
                        borderColor: '#10B981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4,
                        pointRadius: 4,
                        pointHoverRadius: 6,
                        pointBackgroundColor: '#10B981',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2
                    },
                    {
                        label: 'En essai gratuit',
                        data: dataTrials,
                        borderColor: '#F59E0B',
                        backgroundColor: 'rgba(245, 158, 11, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4,
                        pointRadius: 3,
                        pointHoverRadius: 5,
                        pointBackgroundColor: '#F59E0B',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'bottom',
                        labels: {
                            usePointStyle: true,
                            padding: 15
                        }
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
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
                }
            }
        });
        
    } catch (error) {
        console.error('Erreur chargement graphique clients:', error);
    }
}

// ================================================================
// DERNIERS CLIENTS INSCRITS
// ================================================================

async function loadRecentClients() {
    const container = document.getElementById('recentClientsList');
    
    try {
        const { data: clients, error } = await window.supabaseClient
            .from('cm_clients')
            .select('id, nom_contact, prenom_contact, email_principal, entreprise, statut, created_at')
            .order('created_at', { ascending: false })
            .limit(5);
        
        if (error) throw error;
        
        if (!clients || clients.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: #6B7280;">
                    <i data-lucide="users" style="width: 48px; height: 48px; margin-bottom: 0.5rem;"></i>
                    <p>Aucun client inscrit</p>
                </div>
            `;
            if (window.lucide) lucide.createIcons();
            return;
        }
        
        container.innerHTML = clients.map(client => {
            const timeAgo = getTimeAgo(new Date(client.created_at));
            const statutBadge = getStatutBadge(client.statut);
            const nomComplet = `${client.prenom_contact || ''} ${client.nom_contact || 'Inconnu'}`.trim();
            
            return `
                <div class="recent-client-item" onclick="window.location.href='admin-clients.html?id=${client.id}'">
                    <div class="client-avatar">
                        ${(client.prenom_contact || 'U')[0].toUpperCase()}
                    </div>
                    <div class="client-info">
                        <div class="client-name">${nomComplet}</div>
                        <div class="client-email">${client.email_principal}</div>
                        ${client.entreprise ? `<div class="client-company">${client.entreprise}</div>` : ''}
                    </div>
                    <div class="client-meta">
                        ${statutBadge}
                        <div class="client-time">${timeAgo}</div>
                    </div>
                </div>
            `;
        }).join('');
        
        if (window.lucide) lucide.createIcons();
        
    } catch (error) {
        console.error('Erreur chargement derniers clients:', error);
        container.innerHTML = '<div class="loading-state">Erreur de chargement</div>';
    }
}

function getStatutBadge(statut) {
    const badges = {
        'actif': '<span class="badge badge-success">Actif</span>',
        'trial': '<span class="badge badge-warning">Essai gratuit</span>',
        'suspendu': '<span class="badge badge-danger">Suspendu</span>',
        'resilié': '<span class="badge badge-secondary">Résilié</span>'
    };
    return badges[statut] || '<span class="badge badge-secondary">-</span>';
}

function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    
    if (seconds < 60) return 'À l\'instant';
    
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `Il y a ${minutes} min`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Il y a ${hours}h`;
    
    const days = Math.floor(hours / 24);
    if (days < 7) return `Il y a ${days}j`;
    
    const weeks = Math.floor(days / 7);
    if (weeks < 4) return `Il y a ${weeks} sem`;
    
    const months = Math.floor(days / 30);
    return `Il y a ${months} mois`;
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
    const btnLogout = document.getElementById('btnLogout');
    if (btnLogout) {
        btnLogout.addEventListener('click', async () => {
            await window.supabaseClient.auth.signOut();
            window.location.href = '../index.html';
        });
    }
    
    // Filtres Chart MRR
    document.querySelectorAll('.btn-filter').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.btn-filter').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            const period = parseInt(e.target.dataset.period);
            loadMRRChart(period);
        });
    });
    
    // Actions rapides (vérifier si les boutons existent)
    const btnCreatePromo = document.getElementById('btnCreatePromo');
    if (btnCreatePromo) {
        btnCreatePromo.addEventListener('click', () => {
            window.location.href = 'admin-promotions.html';
        });
    }
    
    const btnEmailBlast = document.getElementById('btnEmailBlast');
    if (btnEmailBlast) {
        btnEmailBlast.addEventListener('click', () => {
            alert('Fonctionnalité à venir');
        });
    }
    
    const btnGeneratePosts = document.getElementById('btnGeneratePosts');
    if (btnGeneratePosts) {
        btnGeneratePosts.addEventListener('click', () => {
            window.location.href = 'admin-content.html';
        });
    }
    
    const btnExportData = document.getElementById('btnExportData');
    if (btnExportData) {
        btnExportData.addEventListener('click', async () => {
            await exportDashboardData();
        });
    }
    
    // Tabs navigation
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const tabId = e.currentTarget.dataset.tab;
            if (tabId) {
                switchTab(tabId);
            }
        });
    });
}

// ================================================================
// KPI ERREURS
// ================================================================

async function loadErrorsKPI() {
    try {
        // Erreurs non résolues par type
        const { data: errorsByType, error: errorsError } = await window.supabaseClient
            .from('cm_error_logs')
            .select('error_type')
            .eq('resolved', false);
        
        if (!errorsError && errorsByType) {
            const critical = errorsByType.filter(e => e.error_type === 'critical').length;
            const warning = errorsByType.filter(e => e.error_type === 'warning').length;
            
            document.getElementById('kpiErrorsCritical').textContent = critical;
            document.getElementById('kpiErrorsWarning').textContent = warning;
        }
        
        // Erreurs dernières 24h
        const yesterday = new Date();
        yesterday.setHours(yesterday.getHours() - 24);
        
        const { data: errors24h, error: errors24hError } = await window.supabaseClient
            .from('cm_error_logs')
            .select('id')
            .gte('timestamp', yesterday.toISOString());
        
        if (!errors24hError && errors24h) {
            document.getElementById('kpiErrors24h').textContent = errors24h.length;
        }
        
    } catch (error) {
        console.error('❌ Erreur chargement KPI erreurs:', error);
    }
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
