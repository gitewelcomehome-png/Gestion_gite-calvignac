// ================================================================
// 💰 FINANCE & BUSINESS INTELLIGENCE
// ================================================================
// Analytics avancés, métriques SaaS, cohort analysis, prédictions IA
// ================================================================

// console.log('🚀 Script admin-finance.js chargé');

// ================================================================
// ÉTAT GLOBAL
// ================================================================

let revenusChartInstance = null;
let repartitionChartInstance = null;
let currentPeriod = 90;
let currentUser = null;
const ADMIN_FALLBACK_EMAILS = ['stephanecalvignac@hotmail.fr'];

function normalizeEmail(email) {
    return String(email || '').trim().toLowerCase();
}

async function isCurrentUserAdmin(user) {
    const configuredAdminEmails = Array.isArray(window.APP_CONFIG?.ADMIN_EMAILS)
        ? window.APP_CONFIG.ADMIN_EMAILS
        : [];
    const adminEmails = new Set(
        [...ADMIN_FALLBACK_EMAILS, ...configuredAdminEmails]
            .map(normalizeEmail)
            .filter(Boolean)
    );

    if (adminEmails.has(normalizeEmail(user?.email))) {
        return true;
    }

    try {
        const { data: rolesData, error: rolesError } = await window.supabaseClient
            .from('user_roles')
            .select('role, is_active')
            .eq('user_id', user.id)
            .eq('is_active', true)
            .in('role', ['admin', 'super_admin'])
            .limit(1);

        return !rolesError && Array.isArray(rolesData) && rolesData.length > 0;
    } catch (rolesCheckError) {
        console.warn('⚠️ Vérification rôle admin indisponible:', rolesCheckError?.message || rolesCheckError);
        return false;
    }
}

async function checkAuth() {
    try {
        if (!window.supabaseClient) {
            window.location.href = '../index.html';
            return false;
        }

        const { data: { session }, error } = await window.supabaseClient.auth.getSession();
        if (error || !session?.user) {
            window.location.href = '../index.html';
            return false;
        }

        currentUser = session.user;
        const isAdmin = await isCurrentUserAdmin(currentUser);
        if (!isAdmin) {
            alert('Accès refusé : Réservé aux administrateurs');
            window.location.href = '../index.html';
            return false;
        }

        const userEmailEl = document.getElementById('userEmail');
        if (userEmailEl) {
            userEmailEl.textContent = currentUser.email || '';
        }

        return true;
    } catch (authError) {
        console.error('❌ Erreur authentification finance:', authError);
        window.location.href = '../index.html';
        return false;
    }
}

// ================================================================
// INITIALISATION
// ================================================================

document.addEventListener('DOMContentLoaded', async () => {
    // console.log('📊 Initialisation Finance & BI');
    const isAllowed = await checkAuth();
    if (!isAllowed) {
        return;
    }
    
    // Créer icônes immédiatement
    lucide.createIcons();
    
    await loadAllData();
    setupEventListeners();
});

function setupEventListeners() {
    document.getElementById('periodSelector').addEventListener('change', async (e) => {
        currentPeriod = e.target.value === 'all' ? 9999 : parseInt(e.target.value);
        await loadAllData();
    });

    document.addEventListener('click', (event) => {
        const navButton = event.target.closest('[data-nav-url]');
        if (navButton) {
            const targetUrl = navButton.getAttribute('data-nav-url');
            if (targetUrl) {
                window.location.href = targetUrl;
            }
            return;
        }

        const actionButton = event.target.closest('[data-action]');
        if (!actionButton) {
            return;
        }

        const action = actionButton.getAttribute('data-action');
        if (action === 'export-transactions') {
            exportTransactions();
        }
    });
}

// ================================================================
// CHARGEMENT DONNÉES
// ================================================================

async function loadAllData() {
    try {
        await Promise.all([
            loadKPIsFinanciers(),
            loadMetriquesSaaS(),
            loadGraphiques(),
            loadCohortAnalysis(),
            loadTransactions(),
            loadPredictions()
        ]);
        
        // console.log('✅ Toutes les données Finance chargées');
    } catch (error) {
        console.error('❌ Erreur chargement données finance:', error);
    }
}

// ================================================================
// KPIs FINANCIERS
// ================================================================

async function loadKPIsFinanciers() {
    try {
        const dateDebut = getDateDebut(currentPeriod);
        
        // Récupérer factures
        const { data: factures, error } = await window.supabaseClient
            .from('cm_invoices')
            .select('montant_ttc, statut, date_emission')
            .gte('date_emission', dateDebut)
            .eq('statut', 'payée');
        
        if (error) throw error;
        
        // Calculer revenus
        const revenuTotal = factures?.reduce((sum, f) => sum + parseFloat(f.montant_ttc || 0), 0) || 0;
        
        // MRR actuel (abonnements actifs)
        const { data: clients, error: errorClients } = await window.supabaseClient
            .from('cm_clients')
            .select('montant_mensuel')
            .eq('statut', 'actif');
        
        if (errorClients) throw errorClients;
        
        const mrr = clients?.reduce((sum, c) => sum + parseFloat(c.montant_mensuel || 0), 0) || 0;
        
        // Calculer croissance (revenus vs période précédente)
        const dateDebutPrecedent = getDateDebut(currentPeriod * 2);
        const { data: facturesPrecedentes } = await window.supabaseClient
            .from('cm_invoices')
            .select('montant_ttc')
            .gte('date_emission', dateDebutPrecedent)
            .lt('date_emission', dateDebut)
            .eq('statut', 'payée');
        
        const revenuPrecedent = facturesPrecedentes?.reduce((sum, f) => sum + parseFloat(f.montant_ttc || 0), 0) || 0;
        const croissance = revenuPrecedent > 0 ? ((revenuTotal - revenuPrecedent) / revenuPrecedent * 100) : 0;
        
        // Marge brute (estimation : 80% pour du SaaS)
        const marge = 80;
        
        // Afficher
        document.getElementById('kpiRevenuTotal').textContent = formatCurrency(revenuTotal);
        document.getElementById('kpiMRR').textContent = formatCurrency(mrr);
        document.getElementById('kpiMarge').textContent = marge.toFixed(1) + '%';
        document.getElementById('kpiCroissance').textContent = (croissance >= 0 ? '+' : '') + croissance.toFixed(1) + '%';
        
        // Changement revenus
        const changePct = croissance;
        updateChangeIndicator('kpiRevenuChange', changePct);
        updateChangeIndicator('kpiMRRChange', changePct * 0.5); // Estimation
        
        // console.log('✅ KPIs financiers chargés:', { revenuTotal, mrr, croissance, marge });
        
    } catch (error) {
        console.error('❌ Erreur KPIs financiers:', error);
    }
}

// ================================================================
// MÉTRIQUES SAAS AVANCÉES
// ================================================================

async function loadMetriquesSaaS() {
    try {
        // LTV (Lifetime Value)
        const { data: clients, error: errorClients } = await window.supabaseClient
            .from('cm_clients')
            .select('montant_mensuel, date_inscription');
        
        if (errorClients) throw errorClients;
        
        // Durée de vie moyenne (en mois)
        const now = new Date();
        const dureesVie = clients?.map(c => {
            const inscrit = new Date(c.date_inscription);
            const mois = (now - inscrit) / (1000 * 60 * 60 * 24 * 30);
            return Math.max(mois, 1);
        }) || [];
        
        const dureeVieMoyenne = dureesVie.reduce((sum, d) => sum + d, 0) / Math.max(dureesVie.length, 1);
        const revenuMoyenMensuel = clients?.reduce((sum, c) => sum + parseFloat(c.montant_mensuel || 0), 0) / Math.max(clients?.length, 1) || 0;
        const ltv = revenuMoyenMensuel * dureeVieMoyenne;
        
        // CAC (Coût Acquisition Client) - Estimation
        const cac = 150; // À calculer selon les dépenses marketing réelles
        
        // Payback Period
        const paybackPeriod = revenuMoyenMensuel > 0 ? cac / revenuMoyenMensuel : 0;
        
        // Taux de churn
        const { data: clientsResilie, error: errorResilie } = await window.supabaseClient
            .from('cm_clients')
            .select('id')
            .eq('statut', 'resilié');
        
        if (errorResilie) throw errorResilie;
        
        const tauxChurn = clients?.length > 0 ? (clientsResilie?.length || 0) / clients.length * 100 : 0;
        
        // Afficher
        document.getElementById('kpiLTV').textContent = formatCurrency(ltv);
        document.getElementById('kpiCAC').textContent = formatCurrency(cac);
        document.getElementById('kpiPayback').textContent = paybackPeriod.toFixed(1) + ' mois';
        document.getElementById('kpiChurnRate').textContent = tauxChurn.toFixed(1) + '%';
        
        // console.log('✅ Métriques SaaS chargées:', { ltv, cac, paybackPeriod, tauxChurn });
        
    } catch (error) {
        console.error('❌ Erreur métriques SaaS:', error);
    }
}

// ================================================================
// GRAPHIQUES
// ================================================================

async function loadGraphiques() {
    try {
        const dateDebut = getDateDebut(currentPeriod);
        
        // Graphique évolution revenus
        const { data: factures, error } = await window.supabaseClient
            .from('cm_invoices')
            .select('montant_ttc, date_emission')
            .gte('date_emission', dateDebut)
            .eq('statut', 'payée')
            .order('date_emission', { ascending: true });
        
        if (error) throw error;
        
        // Grouper par mois
        const revenusParMois = {};
        factures?.forEach(f => {
            const mois = new Date(f.date_emission).toLocaleDateString('fr-FR', { year: 'numeric', month: 'short' });
            revenusParMois[mois] = (revenusParMois[mois] || 0) + parseFloat(f.montant_ttc || 0);
        });
        
        const labels = Object.keys(revenusParMois);
        const data = Object.values(revenusParMois);
        
        // Créer graphique revenus
        if (revenusChartInstance) revenusChartInstance.destroy();
        
        const ctxRevenus = document.getElementById('revenusChart').getContext('2d');
        revenusChartInstance = new Chart(ctxRevenus, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Revenus (€)',
                    data: data,
                    backgroundColor: 'rgba(16, 185, 129, 0.8)',
                    borderColor: 'rgba(16, 185, 129, 1)',
                    borderWidth: 2,
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: (context) => formatCurrency(context.parsed.y)
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: (value) => formatCurrency(value)
                        }
                    }
                }
            }
        });
        
        // Graphique répartition par abonnement
        const { data: clients, error: errorClients } = await window.supabaseClient
            .from('cm_clients')
            .select('type_abonnement, billing_cycle')
            .eq('statut', 'actif');
        
        if (errorClients) throw errorClients;
        
        const repartition = {
            solo_annuel: 0, solo_mensuel: 0,
            duo_annuel: 0, duo_mensuel: 0,
            quattro_annuel: 0, quattro_mensuel: 0
        };
        clients?.forEach(c => {
            const plan = c.type_abonnement || 'solo';
            const cycle = c.billing_cycle || 'mensuel';
            const key = `${plan}_${cycle}`;
            if (key in repartition) repartition[key] = (repartition[key] || 0) + 1;
        });
        
        if (repartitionChartInstance) repartitionChartInstance.destroy();
        
        const ctxRepartition = document.getElementById('repartitionChart').getContext('2d');
        repartitionChartInstance = new Chart(ctxRepartition, {
            type: 'doughnut',
            data: {
                labels: [
                    'Solo Annuel', 'Solo Mensuel',
                    'Duo Annuel', 'Duo Mensuel',
                    'Quattro Annuel', 'Quattro Mensuel'
                ],
                datasets: [{
                    data: [
                        repartition.solo_annuel, repartition.solo_mensuel,
                        repartition.duo_annuel, repartition.duo_mensuel,
                        repartition.quattro_annuel, repartition.quattro_mensuel
                    ],
                    backgroundColor: [
                        'rgba(59, 130, 246, 0.8)',
                        'rgba(147, 197, 253, 0.8)',
                        'rgba(16, 185, 129, 0.8)',
                        'rgba(110, 231, 183, 0.8)',
                        'rgba(245, 158, 11, 0.8)',
                        'rgba(253, 211, 77, 0.8)'
                    ],
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
        
        // console.log('✅ Graphiques créés');
        
    } catch (error) {
        console.error('❌ Erreur graphiques:', error);
    }
}

// ================================================================
// COHORT ANALYSIS
// ================================================================

async function loadCohortAnalysis() {
    try {
        const { data: clients, error } = await window.supabaseClient
            .from('cm_clients')
            .select('id, date_inscription, statut, date_fin_abonnement')
            .order('date_inscription', { ascending: false });
        
        if (error) throw error;
        
        // Grouper par cohorte (mois d'inscription)
        const cohorts = {};
        clients?.forEach(c => {
            const moisCohorte = new Date(c.date_inscription).toLocaleDateString('fr-FR', { year: 'numeric', month: 'short' });
            if (!cohorts[moisCohorte]) {
                cohorts[moisCohorte] = [];
            }
            cohorts[moisCohorte].push(c);
        });
        
        const tbody = document.getElementById('tbodyCohorts');
        
        if (Object.keys(cohorts).length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 20px;">Pas encore de données de cohorte</td></tr>';
            return;
        }
        
        // Générer lignes tableau (limiter aux 6 dernières cohortes)
        const dernièresCohortes = Object.keys(cohorts).slice(0, 6);
        
        tbody.innerHTML = dernièresCohortes.map(cohorte => {
            const clientsCohorte = cohorts[cohorte];
            const total = clientsCohorte.length;
            
            // Calculer rétention
            const now = new Date();
            const dateCohorte = new Date(clientsCohorte[0].date_inscription);
            
            const calcRetention = (mois) => {
                const dateLimite = new Date(dateCohorte);
                dateLimite.setMonth(dateLimite.getMonth() + mois);
                
                if (dateLimite > now) return '-';
                
                const actifs = clientsCohorte.filter(c => {
                    if (c.statut === 'actif') return true;
                    if (c.date_fin_abonnement) {
                        return new Date(c.date_fin_abonnement) >= dateLimite;
                    }
                    return false;
                }).length;
                
                return Math.round(actifs / total * 100) + '%';
            };
            
            return `
                <tr>
                    <td><strong>${cohorte}</strong></td>
                    <td>${total}</td>
                    <td style="background: rgba(16, 185, 129, 0.2);">100%</td>
                    <td>${calcRetention(1)}</td>
                    <td>${calcRetention(2)}</td>
                    <td>${calcRetention(3)}</td>
                    <td>${calcRetention(6)}</td>
                    <td>${calcRetention(12)}</td>
                </tr>
            `;
        }).join('');
        
        // console.log('✅ Cohort analysis chargée');
        
    } catch (error) {
        console.error('❌ Erreur cohort analysis:', error);
    }
}

// ================================================================
// TRANSACTIONS
// ================================================================

async function loadTransactions() {
    try {
        const { data: factures, error } = await window.supabaseClient
            .from('cm_invoices')
            .select(`
                *,
                cm_clients!inner(nom_contact, prenom_contact),
                cm_subscriptions(type_abonnement)
            `)
            .order('date_emission', { ascending: false })
            .limit(50);
        
        if (error) throw error;
        
        const tbody = document.getElementById('tbodyTransactions');
        
        if (!factures || factures.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px;">Aucune transaction</td></tr>';
            return;
        }
        
        tbody.innerHTML = factures.map(f => {
            const statutHTML = f.statut === 'payée' 
                ? '<span class="badge badge-success">Payée</span>'
                : f.statut === 'en_attente'
                    ? '<span class="badge badge-warning">En attente</span>'
                    : '<span class="badge badge-danger">En retard</span>';
            
            return `
                <tr>
                    <td>${new Date(f.date_emission).toLocaleDateString('fr-FR')}</td>
                    <td>${f.cm_clients.prenom_contact} ${f.cm_clients.nom_contact}</td>
                    <td>Facture</td>
                    <td><span class="badge badge-info">${f.cm_subscriptions?.type_abonnement || 'N/A'}</span></td>
                    <td><strong>${formatCurrency(f.montant_ttc)}</strong></td>
                    <td>${statutHTML}</td>
                </tr>
            `;
        }).join('');
        
        lucide.createIcons();
        // console.log('✅ Transactions chargées');
        
    } catch (error) {
        console.error('❌ Erreur transactions:', error);
    }
}

// ================================================================
// PRÉDICTIONS IA
// ================================================================

async function loadPredictions() {
    try {
        // Récupérer historique revenus 90 derniers jours
        const { data: factures, error } = await window.supabaseClient
            .from('cm_invoices')
            .select('montant_ttc, date_emission')
            .gte('date_emission', getDateDebut(90))
            .eq('statut', 'payée');
        
        if (error) throw error;
        
        const revenuMoyen90j = factures?.reduce((sum, f) => sum + parseFloat(f.montant_ttc || 0), 0) / 3 || 0;
        
        // Prédiction revenus (tendance linéaire simple)
        const predRevenu = revenuMoyen90j * 1.1; // +10% optimiste
        const confRevenu = 75;
        
        // Prédiction nouveaux clients (basé sur historique)
        const { data: clients, error: errorClients } = await window.supabaseClient
            .from('cm_clients')
            .select('date_inscription')
            .gte('date_inscription', getDateDebut(90));
        
        if (errorClients) throw errorClients;
        
        const nouveauxClients90j = clients?.length || 0;
        const predClients = Math.round(nouveauxClients90j / 3);
        const confClients = 70;
        
        // Prédiction churn (basé sur tendance)
        const { data: clientsActifs } = await window.supabaseClient
            .from('cm_clients')
            .select('id')
            .eq('statut', 'actif');
        
        const predChurn = Math.round((clientsActifs?.length || 0) * 0.05); // 5% estimation
        const confChurn = 65;
        
        // Afficher
        document.getElementById('predRevenu').textContent = formatCurrency(predRevenu);
        document.getElementById('predRevenuConf').textContent = confRevenu + '%';
        
        document.getElementById('predClients').textContent = predClients;
        document.getElementById('predClientsConf').textContent = confClients + '%';
        
        document.getElementById('predChurn').textContent = predChurn;
        document.getElementById('predChurnConf').textContent = confChurn + '%';
        
        // console.log('✅ Prédictions IA calculées');
        
    } catch (error) {
        console.error('❌ Erreur prédictions:', error);
    }
}

// ================================================================
// EXPORT
// ================================================================

async function exportTransactions() {
    try {
        const { data: factures, error } = await window.supabaseClient
            .from('cm_invoices')
            .select(`
                *,
                cm_clients!inner(nom_contact, prenom_contact, email_principal)
            `)
            .order('date_emission', { ascending: false });
        
        if (error) throw error;
        
        // Créer CSV
        let csv = 'Date,Client,Email,Montant HT,TVA,Montant TTC,Statut\n';
        factures?.forEach(f => {
            csv += `${f.date_emission},"${f.cm_clients.prenom_contact} ${f.cm_clients.nom_contact}",${f.cm_clients.email_principal},${f.montant_ht},${f.tva},${f.montant_ttc},${f.statut}\n`;
        });
        
        // Télécharger
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `transactions_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        
        showToast('Export CSV réussi', 'success');
        
    } catch (error) {
        console.error('❌ Erreur export:', error);
        showToast('Erreur export', 'error');
    }
}

// ================================================================
// UTILITAIRES
// ================================================================

function getDateDebut(jours) {
    const date = new Date();
    date.setDate(date.getDate() - jours);
    return date.toISOString().split('T')[0];
}

function formatCurrency(value) {
    return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR'
    }).format(value);
}

function updateChangeIndicator(id, pct) {
    const el = document.getElementById(id);
    if (!el) return;
    
    const isPositive = pct >= 0;
    el.className = 'kpi-change ' + (isPositive ? 'positive' : 'negative');
    el.innerHTML = `
        <i data-lucide="${isPositive ? 'arrow-up' : 'arrow-down'}"></i>
        <span>${isPositive ? '+' : ''}${pct.toFixed(1)}%</span>
    `;
    lucide.createIcons();
}

// showToast — défini dans js/utils.js (chargé avant ce fichier)

// Export fonction globale
window.exportTransactions = exportTransactions;
