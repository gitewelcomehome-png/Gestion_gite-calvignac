/**
 * 📊 MODULE STATISTIQUES & GRAPHIQUES v2.1
 * Gestion des statistiques avancées avec design Dashboard
 * 
 * Changelog v2.1:
 * - Réorganisation complète avec style Dashboard
 * - Bordures noires 3px et ombres 4x4px
 * - Section CA & Réservations regroupée
 * - Couleurs par gîte cohérentes
 */

// ==========================================
// 🏗️ GÉNÉRATION DYNAMIQUE DU HTML
// ==========================================

async function genererHTMLStatsGites() {
    const gites = await window.gitesManager.getVisibleGites();
    
    // Générer les cartes de taux d'occupation
    const tauxContainer = document.getElementById('taux-occupation-container');
    if (tauxContainer) {
        const colors = [
            '#667eea', '#f5576c', '#27AE60', '#3498DB', '#E67E22', '#9B59B6'
        ];
        
        let html = '';
        gites.forEach((gite, index) => {
            const color = colors[index % colors.length];
            const slugCapitalized = gite.slug.charAt(0).toUpperCase() + gite.slug.slice(1);
            
            html += `
                <div class="stat-item stat-item-default" style="border-color: ${color};">
                    <div class="stat-item-label-small">
                        📊 ${gite.name}
                    </div>
                    <div id="taux${slugCapitalized}" class="stat-item-value-colored" style="color: ${color};">-%</div>
                    <div class="stat-item-sublabel-small">Taux occupation</div>
                </div>
            `;
        });
        
        window.SecurityUtils.setInnerHTML(tauxContainer, html);
    }
    
    // Générer les stats par gîte dans la section CA
    const statsContainer = document.getElementById('stats-gites-container');
    if (statsContainer) {
        let html = '';
        gites.forEach((gite, index) => {
            const colors = [
                '#667eea', '#f5576c', '#27AE60', '#3498DB', '#E67E22', '#9B59B6'
            ];
            const color = colors[index % colors.length];
            
            html += `
                <div class="stats-ca-card" style="border-color: ${color};">
                    <div class="stat-item-label-small">${gite.name}</div>
                    <div class="stat-item-value-colored" style="color: ${color};" id="stat${gite.slug}">0</div>
                    <div class="stat-item-sublabel">réservations</div>
                    <div class="stat-item-value-small stat-item-value-3eme" id="statCA${gite.slug}">0 €</div>
                </div>
            `;
        });
        
        window.SecurityUtils.setInnerHTML(statsContainer, html);
    }
}

// ==========================================
// 📊 COMPTEURS PAR PLATEFORME
// ==========================================

function updatePlatformCounters(reservations) {
    // Compter par plateforme (colonne: platform)
    let countAirbnb = 0;
    let countAbritel = 0;
    let countGites = 0;
    
    reservations.forEach(r => {
        const platform = (r.platform || '').toLowerCase().trim();
        
        if (platform.includes('airbnb')) {
            countAirbnb++;
        } else if (platform.includes('abritel') || platform.includes('homeaway') || platform.includes('homelidays')) {
            countAbritel++;
        } else if (platform.includes('gîtes') || platform.includes('gites') || platform.includes('france') || platform === 'autre' || platform === 'other' || platform === 'direct' || platform === '') {
            // "Gîtes de France" : toutes les réservations directes et autres
            countGites++;
        }
    });
    
    // Mettre à jour les compteurs
    const el1 = document.getElementById('countAirbnb');
    const el2 = document.getElementById('countAbritel');
    const el3 = document.getElementById('countGites');
    
    if (el1) el1.textContent = countAirbnb;
    if (el2) el2.textContent = countAbritel;
    if (el3) el3.textContent = countGites;
}

// ==========================================
// 📈 STATISTIQUES AVANCÉES
// ==========================================

async function updateAdvancedStats(reservations) {
    // Utiliser directement les réservations passées (déjà filtrées si nécessaire)
    
    // Taux d'occupation (dynamique pour N gîtes)
    const gites = await window.gitesManager.getVisibleGites();
    const joursAnnee = 365;
    
    gites.forEach(gite => {
        const reservationsGite = reservations.filter(r => r.gite_id === gite.id);
        
        const joursOccupes = reservationsGite.reduce((sum, r) => {
            if (!r.check_in || !r.check_out) return sum;
            const debut = new Date(r.check_in);
            const fin = new Date(r.check_out);
            return sum + Math.round((fin - debut) / (1000 * 60 * 60 * 24));
        }, 0);
        
        const taux = ((joursOccupes / joursAnnee) * 100).toFixed(1);
        // Capitaliser la première lettre du slug pour correspondre à l'HTML (tauxTrevoux, tauxCouzon)
        const slugCapitalized = gite.slug.charAt(0).toUpperCase() + gite.slug.slice(1);
        const el = document.getElementById(`taux${slugCapitalized}`);
        if (el) el.textContent = taux + '%';
    });
    
    // Prix moyen par nuit
    let totalMontant = 0;
    let totalNuits = 0;
    
    reservations.forEach(r => {
        if (!r.check_in || !r.check_out || !r.total_price) return;
        const debut = new Date(r.check_in);
        const fin = new Date(r.check_out);
        const nuits = Math.round((fin - debut) / (1000 * 60 * 60 * 24));
        totalMontant += parseFloat(r.total_price) || 0;
        totalNuits += nuits;
    });
    
    const prixMoyen = totalNuits > 0 ? (totalMontant / totalNuits).toFixed(0) : 0;
    const elPrixMoyen = document.getElementById('prixMoyen');
    if (elPrixMoyen) elPrixMoyen.textContent = prixMoyen + ' €';
    
    // Durée moyenne
    const dureeMoyenne = reservations.length > 0 ? (totalNuits / reservations.length).toFixed(1) : 0;
    const elDuree = document.getElementById('dureeMoyenne');
    if (elDuree) elDuree.textContent = dureeMoyenne + ' nuits';
    
    // Meilleur mois
    const moisCA = Array(12).fill(0);
    const nomsMois = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    
    const selectedYear = parseInt(document.getElementById('yearFilterStats')?.value || new Date().getFullYear());
    let historicalData = [];
    let histTotal = null;
    try {
        historicalData = await getAllHistoricalData();
        histTotal = historicalData.find(d => d.year === selectedYear && d.gite === 'Total');
    } catch (e) {
        // Table non disponible, on continue sans
    }
    
    if (histTotal) {
        const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
        months.forEach((m, idx) => {
            moisCA[idx] = histTotal.months[m] || 0;
        });
    } else {
        // Filtrer les réservations par l'année sélectionnée
        reservations.filter(r => {
            if (!r.check_in) return false;
            return new Date(r.check_in).getFullYear() === selectedYear;
        }).forEach(r => {
            const date = new Date(r.check_in);
            const monthIndex = date.getMonth();
            moisCA[monthIndex] += parseFloat(r.total_price) || 0;
        });
    }
    
    let meilleurMoisIndex = 0;
    let meilleurCA = 0;
    
    moisCA.forEach((ca, idx) => {
        if (ca > meilleurCA) {
            meilleurCA = ca;
            meilleurMoisIndex = idx;
        }
    });
    
    const meilleurMois = meilleurCA > 0 ? nomsMois[meilleurMoisIndex] : '-';
    
    const elMois = document.getElementById('meilleurMois');
    const elMoisCA = document.getElementById('meilleurMoisCA');
    if (elMois) elMois.textContent = meilleurMois;
    if (elMoisCA) elMoisCA.textContent = meilleurCA > 0 ? meilleurCA.toFixed(0) + ' €' : '-';
}

// ==========================================
// 📅 FILTRE PAR ANNÉE POUR LES STATS
// ==========================================

async function populateYearFilter() {
    // Générer le HTML dynamique pour les gîtes
    await genererHTMLStatsGites();
    
    const reservations = await getAllReservations();
    const years = new Set();
    
    reservations.forEach(r => {
        if (r.check_in) {
            const year = new Date(r.check_in).getFullYear();
            years.add(year);
        }
    });
    
    const sortedYears = Array.from(years).sort((a, b) => b - a);
    const currentYear = new Date().getFullYear();
    
    const select = document.getElementById('yearFilterStats');
    if (!select) return;
    window.SecurityUtils.setInnerHTML(select, '');
    
    sortedYears.forEach(year => {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        if (year === currentYear) {
            option.selected = true;
        }
        select.appendChild(option);
    });
    
    if (document.getElementById('historicalYear')) {
        document.getElementById('historicalYear').value = currentYear;
    }
    
    // Déclencher le calcul des stats pour l'année courante
    await filterStatsByYear();
}

async function filterStatsByYear() {
    const selectedYear = parseInt(document.getElementById('yearFilterStats').value);
    const reservations = await getAllReservations();
    
    const filteredReservations = reservations.filter(r => {
        const year = parseLocalDate(r.dateDebut).getFullYear();
        return year === selectedYear;
    });
    
    updatePlatformCounters(filteredReservations);
    updateAdvancedStats(filteredReservations);
    
    // Calcul dynamique pour N gîtes
    const gites = await window.gitesManager.getVisibleGites();
    let caTotal = 0;
    let totalReservations = 0;
    
    gites.forEach(gite => {
        const reservationsGite = filteredReservations.filter(r => {
            // Support de tous les formats possibles
            const match = r.gite_id === gite.id || r.giteId === gite.id || r.gite === gite.name;
            return match;
        });
        
        const caGite = reservationsGite.reduce((sum, r) => {
            const montant = parseFloat(r.montant || r.total_price || 0);
            return sum + montant;
        }, 0);
        caTotal += caGite;
        totalReservations += reservationsGite.length;
        
        const elGite = document.getElementById(`stat${gite.slug}`);
        if (elGite) {
            elGite.textContent = reservationsGite.length;
        }
        
        const elCA = document.getElementById(`statCA${gite.slug}`);
        if (elCA) {
            elCA.textContent = caGite.toFixed(0) + ' €';
        }
    });
    
    const elTotal = document.getElementById('statTotal');
    const elCA = document.getElementById('statCA');
    
    if (elTotal) elTotal.textContent = totalReservations;
    if (elCA) elCA.textContent = caTotal.toFixed(0) + ' €';
    
    await updateAllCharts(filteredReservations);
}

// ==========================================
// 📊 GRAPHIQUES CHART.JS
// ==========================================

async function updateAllCharts(filteredReservations = null) {
    const reservations = filteredReservations || await getAllReservations();
    let historicalData = [];
    try {
        historicalData = await getAllHistoricalData();
    } catch (e) {
        // Table non disponible, on continue sans
    }
    
    let reservationsForStats = reservations;
    if (!filteredReservations) {
        const selectedYear = parseInt(document.getElementById('yearFilterStats')?.value || new Date().getFullYear());
        reservationsForStats = reservations.filter(r => {
            if (!r.check_in) return false;
            const year = new Date(r.check_in).getFullYear();
            return year === selectedYear;
        });
    }
    
    updatePlatformCounters(reservationsForStats);
    updateAdvancedStats(reservationsForStats);
    
    const checkboxes = document.querySelectorAll('#yearComparisonCheckboxes input[type="checkbox"]:checked');
    const selectedYears = Array.from(checkboxes).map(cb => parseInt(cb.value)).sort();
    
    
    if (selectedYears.length === 0) {
        if (window.caChartInstance) window.caChartInstance.destroy();
        return;
    }
    
    const colors = [
        { border: '#667eea', bg: 'rgba(102, 126, 234, 0.1)' },
        { border: '#f093fb', bg: 'rgba(240, 147, 251, 0.1)' },
        { border: '#27AE60', bg: 'rgba(39, 174, 96, 0.1)' },
        { border: '#FF5A5F', bg: 'rgba(255, 90, 95, 0.1)' },
        { border: '#3498DB', bg: 'rgba(52, 152, 219, 0.1)' },
        { border: '#F39C12', bg: 'rgba(243, 156, 18, 0.1)' }
    ];
    
    // Récupérer les gîtes pour le mapping
    const gites = await window.gitesManager.getVisibleGites();
    const gitesById = {};
    gites.forEach(g => {
        gitesById[g.id] = g.slug;
    });
    
    const dataByYear = {};
    
    selectedYears.forEach(year => {
        dataByYear[year] = {
            total: Array(12).fill(0)
        };
        
        // Initialiser un array par gîte
        gites.forEach(g => {
            dataByYear[year][g.slug] = Array(12).fill(0);
        });
        
        const histTotal = historicalData.find(d => d.year === year && d.gite === 'Total');
        
        if (histTotal) {
            const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
            months.forEach((m, idx) => {
                const value = histTotal.months[m] || 0;
                dataByYear[year].total[idx] = value;
            });
        } else {
            reservations.filter(r => {
                if (!r.check_in) return false;
                return new Date(r.check_in).getFullYear() === year;
            }).forEach(r => {
                const month = new Date(r.check_in).getMonth();
                const giteSlug = gitesById[r.gite_id];
                if (giteSlug && dataByYear[year][giteSlug]) {
                    dataByYear[year][giteSlug][month] += parseFloat(r.total_price) || 0;
                    dataByYear[year].total[month] += parseFloat(r.total_price) || 0;
                }
            });
        }
    });
    
    const monthLabels = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
    
    const datasets = [];
    selectedYears.forEach((year, idx) => {
        const color = colors[idx % colors.length];
        const total = dataByYear[year].total.reduce((sum, val) => sum + val, 0);
        datasets.push({
            label: `${year} - Total`,
            data: dataByYear[year].total,
            borderColor: color.border,
            backgroundColor: color.bg,
            tension: 0.4,
            fill: true,
            borderWidth: 2
        });
    });
    
    // Graphique CA mensuel
    const ctx1 = document.getElementById('caChart')?.getContext('2d');
    if (ctx1) {
        if (window.caChartInstance) window.caChartInstance.destroy();
        
        window.caChartInstance = new Chart(ctx1, {
            type: 'line',
            data: {
                labels: monthLabels,
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: true, position: 'top' },
                    title: { 
                        display: true, 
                        text: 'Comparaison CA mensuel (€)', 
                        font: { size: 16, weight: 'bold' } 
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.dataset.label + ': ' + context.parsed.y.toFixed(2) + ' €';
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { callback: value => value + ' €' }
                    }
                }
            }
        });
    }
    
    // Graphique répartition par gîte (dynamique)
    const selectedYear = parseInt(document.getElementById('yearFilterStats')?.value || new Date().getFullYear());
    const currentReservations = reservationsForStats;
    
    const labels = gites.map(g => g.name);
    const data = gites.map(g => {
        return currentReservations.filter(r => r.gite_id === g.id).length;
    });
    const giteColors = gites.map(g => g.color);
    
    const ctx2 = document.getElementById('gitesChart')?.getContext('2d');
    if (ctx2) {
        if (window.gitesChartInstance) window.gitesChartInstance.destroy();
        
        window.gitesChartInstance = new Chart(ctx2, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: giteColors,
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: true, position: 'bottom' },
                    title: { 
                        display: true, 
                        text: `Répartition par gîte (${selectedYear})`, 
                        font: { size: 16, weight: 'bold' } 
                    }
                }
            }
        });
    }
    
    // Graphique plateformes
    const ctx3 = document.getElementById('platformsChart')?.getContext('2d');
    if (ctx3) {
        if (window.platformsChartInstance) window.platformsChartInstance.destroy();
        
        const platforms = {};
        currentReservations.forEach(r => {
            platforms[r.site] = (platforms[r.site] || 0) + 1;
        });
        
        window.platformsChartInstance = new Chart(ctx3, {
            type: 'bar',
            data: {
                labels: Object.keys(platforms),
                datasets: [{
                    label: 'Réservations',
                    data: Object.values(platforms),
                    backgroundColor: ['#3498DB', '#FF5A5F', '#27AE60', '#E8A87C'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    title: { 
                        display: true, 
                        text: `Répartition par plateforme (${selectedYear})`, 
                        font: { size: 16, weight: 'bold' } 
                    }
                },
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });
    }
    
    // Graphique Bénéfices Mensuels (ligne - logique dashboard: CA mensuel - charges moyennes)
    const ctx4 = document.getElementById('beneficesChart')?.getContext('2d');
    if (ctx4) {
        if (window.beneficesChartInstance) window.beneficesChartInstance.destroy();
        
        // Récupérer la simulation fiscale pour obtenir le total des charges annuelles SANS AMORTISSEMENT
        let simFiscale = null;
        let totalChargesAnnee = 0;
        
        try {
            const { data } = await window.supabaseClient
                .from('simulations_fiscales')
                .select('*')
                .eq('annee', selectedYear)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();
            simFiscale = data;
            
            if (simFiscale && typeof window.calculerChargesParGiteSansAmortissement === 'function') {
                // Utiliser la nouvelle fonction globale pour calculer les charges SANS AMORTISSEMENT
                const charges = await window.calculerChargesParGiteSansAmortissement(simFiscale);
                totalChargesAnnee = charges.total; // Total annuel sans amortissements
            }
        } catch (error) {
            console.error('Erreur récupération charges:', error);
        }
        
        // Charges moyennes mensuelles
        const chargesMoyennesMensuelles = totalChargesAnnee / 12;
        
        // Calculer les bénéfices mensuels : CA du mois - charges moyennes
        const beneficesParMois = [];
        
        for (let mois = 0; mois < 12; mois++) {
            // CA du mois
            const reservationsDuMois = currentReservations.filter(r => {
                const dateDebut = parseLocalDate(r.dateDebut);
                return dateDebut.getMonth() === mois;
            });
            const caMois = reservationsDuMois.reduce((sum, r) => sum + (parseFloat(r.montant) || 0), 0);
            
            // Bénéfice = CA du mois - charges moyennes mensuelles (SANS AMORTISSEMENT)
            beneficesParMois.push(caMois - chargesMoyennesMensuelles);
        }
        
        window.beneficesChartInstance = new Chart(ctx4, {
            type: 'line',
            data: {
                labels: monthLabels,
                datasets: [{
                    label: 'Bénéfice mensuel',
                    data: beneficesParMois,
                    borderColor: '#3498DB',
                    backgroundColor: 'rgba(52, 152, 219, 0.1)',
                    tension: 0.4,
                    fill: true,
                    borderWidth: 3,
                    pointRadius: 5,
                    pointHoverRadius: 7,
                    pointBackgroundColor: '#3498DB',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: true, position: 'top' },
                    title: { 
                        display: true, 
                        text: `Évolution des Bénéfices Mensuels (${selectedYear}) - CA mensuel - Charges moyennes hors amortissement (${chargesMoyennesMensuelles.toFixed(0)}€/mois)`, 
                        font: { size: 16, weight: 'bold' } 
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const value = context.parsed.y;
                                return 'Bénéfice: ' + value.toFixed(0) + ' €';
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        ticks: { 
                            callback: value => value.toFixed(0) + ' €' 
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
    }
}

// Exporter les fonctions dans le scope global
// ==========================================
// 📅 GESTION FORMULAIRE DONNÉES HISTORIQUES
// ==========================================

function toggleHistoricalDataForm() {
    const form = document.getElementById('historicalDataForm');
    if (form) {
        form.style.display = form.style.display === 'none' ? 'block' : 'none';
    }
}

window.updatePlatformCounters = updatePlatformCounters;
window.updateAdvancedStats = updateAdvancedStats;
window.populateYearFilter = populateYearFilter;
window.filterStatsByYear = filterStatsByYear;
window.updateAllCharts = updateAllCharts;
window.toggleHistoricalDataForm = toggleHistoricalDataForm;
