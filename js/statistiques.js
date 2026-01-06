/**
 * 📊 MODULE STATISTIQUES & GRAPHIQUES
 * Gestion des statistiques avancées et graphiques Chart.js
 */

// ==========================================
// 📊 COMPTEURS PAR PLATEFORME
// ==========================================

function updatePlatformCounters(reservations) {
    // Compter par plateforme
    let countAirbnb = 0;
    let countAbritel = 0;
    let countGites = 0;
    
    reservations.forEach(r => {
        const site = (r.site || '').toLowerCase();
        if (site.includes('airbnb')) {
            countAirbnb++;
        } else if (site.includes('abritel') || site.includes('homeaway')) {
            countAbritel++;
        } else if (site.includes('gîtes') || site.includes('gites')) {
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
    
    // Taux d'occupation
    const trevoux = reservations.filter(r => isTrevoux(r.gite));
    const couzon = reservations.filter(r => isCouzon(r.gite));
    
    const joursOccupesTrevoux = trevoux.reduce((sum, r) => {
        const debut = parseLocalDate(r.dateDebut);
        const fin = parseLocalDate(r.dateFin);
        return sum + Math.round((fin - debut) / (1000 * 60 * 60 * 24));
    }, 0);
    
    const joursOccupesCouzon = couzon.reduce((sum, r) => {
        const debut = parseLocalDate(r.dateDebut);
        const fin = parseLocalDate(r.dateFin);
        return sum + Math.round((fin - debut) / (1000 * 60 * 60 * 24));
    }, 0);
    
    const joursAnnee = 365;
    const tauxTrevoux = ((joursOccupesTrevoux / joursAnnee) * 100).toFixed(1);
    const tauxCouzon = ((joursOccupesCouzon / joursAnnee) * 100).toFixed(1);
    
    const elTrevoux = document.getElementById('tauxTrevoux');
    const elCouzon = document.getElementById('tauxCouzon');
    if (elTrevoux) elTrevoux.textContent = tauxTrevoux + '%';
    if (elCouzon) elCouzon.textContent = tauxCouzon + '%';
    
    // Prix moyen par nuit
    let totalMontant = 0;
    let totalNuits = 0;
    
    reservations.forEach(r => {
        const debut = parseLocalDate(r.dateDebut);
        const fin = parseLocalDate(r.dateFin);
        const nuits = Math.round((fin - debut) / (1000 * 60 * 60 * 24));
        totalMontant += r.montant;
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
    const historicalData = await getAllHistoricalData();
    const histTotal = historicalData.find(d => d.year === selectedYear && d.gite === 'Total');
    
    if (histTotal) {
        const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
        months.forEach((m, idx) => {
            moisCA[idx] = histTotal.months[m] || 0;
        });
    } else {
        // Filtrer les réservations par l'année sélectionnée
        reservations.filter(r => parseLocalDate(r.dateDebut).getFullYear() === selectedYear).forEach(r => {
            const date = parseLocalDate(r.dateDebut);
            const monthIndex = date.getMonth();
            moisCA[monthIndex] += r.montant;
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
    const reservations = await getAllReservations();
    const years = new Set();
    
    reservations.forEach(r => {
        const year = parseLocalDate(r.dateDebut).getFullYear();
        years.add(year);
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
    
    const trevoux = filteredReservations.filter(r => isTrevoux(r.gite));
    const couzon = filteredReservations.filter(r => isCouzon(r.gite));
    
    const caTrevoux = trevoux.reduce((sum, r) => sum + r.montant, 0);
    const caCouzon = couzon.reduce((sum, r) => sum + r.montant, 0);
    const caTotal = caTrevoux + caCouzon;
    
    const totalReservations = trevoux.length + couzon.length;
    
    const elTotal = document.getElementById('statTotal');
    const elTrevoux = document.getElementById('statTrevoux');
    const elCouzon = document.getElementById('statCouzon');
    const elCA = document.getElementById('statCA');
    
    if (elTotal) elTotal.textContent = totalReservations;
    if (elTrevoux) elTrevoux.textContent = trevoux.length;
    if (elCouzon) elCouzon.textContent = couzon.length;
    if (elCA) elCA.textContent = caTotal.toFixed(0) + ' €';
    
    await updateAllCharts(filteredReservations);
}

// ==========================================
// 📊 GRAPHIQUES CHART.JS
// ==========================================

async function updateAllCharts(filteredReservations = null) {
    const reservations = filteredReservations || await getAllReservations();
    const historicalData = await getAllHistoricalData();
    
    let reservationsForStats = reservations;
    if (!filteredReservations) {
        const selectedYear = parseInt(document.getElementById('yearFilterStats')?.value || new Date().getFullYear());
        reservationsForStats = reservations.filter(r => {
            const year = parseLocalDate(r.dateDebut).getFullYear();
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
    
    const dataByYear = {};
    
    selectedYears.forEach(year => {
        dataByYear[year] = {
            trevoux: Array(12).fill(0),
            couzon: Array(12).fill(0),
            total: Array(12).fill(0)
        };
        
        const histTotal = historicalData.find(d => d.year === year && d.gite === 'Total');
        
        if (histTotal) {
            const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
            months.forEach((m, idx) => {
                const value = histTotal.months[m] || 0;
                dataByYear[year].total[idx] = value;
            });
        } else {
            reservations.filter(r => parseLocalDate(r.dateDebut).getFullYear() === year).forEach(r => {
                const month = parseLocalDate(r.dateDebut).getMonth();
                const giteNormalized = r.gite.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
                if (dataByYear[year][giteNormalized]) {
                    dataByYear[year][giteNormalized][month] += r.montant;
                    dataByYear[year].total[month] += r.montant;
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
    
    // Graphique répartition par gîte
    const selectedYear = parseInt(document.getElementById('yearFilterStats')?.value || new Date().getFullYear());
    const currentReservations = reservationsForStats;
    const trevoux = currentReservations.filter(r => isTrevoux(r.gite));
    const couzon = currentReservations.filter(r => isCouzon(r.gite));
    
    const ctx2 = document.getElementById('gitesChart')?.getContext('2d');
    if (ctx2) {
        if (window.gitesChartInstance) window.gitesChartInstance.destroy();
        
        window.gitesChartInstance = new Chart(ctx2, {
            type: 'doughnut',
            data: {
                labels: ['Trévoux', 'Couzon'],
                datasets: [{
                    data: [trevoux.length, couzon.length],
                    backgroundColor: ['#667eea', '#f093fb'],
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
        
        // Récupérer la simulation fiscale pour obtenir le total des charges annuelles
        const { data: simFiscale } = await supabase
            .from('simulations_fiscales')
            .select('*')
            .eq('annee', selectedYear)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();
        
        let totalChargesAnnee = 0;
        
        if (simFiscale) {
            // Calculer le total selon la même formule que fiscalité-v2.js
            const getAnnual = (val, type) => (val || 0) * (type === 'mensuel' ? 12 : 1);
            
            // Couzon (sans amortissement)
            const chargesCouzon = 
                getAnnual(simFiscale.internet_couzon, simFiscale.internet_couzon_type) +
                getAnnual(simFiscale.eau_couzon, simFiscale.eau_couzon_type) +
                getAnnual(simFiscale.electricite_couzon, simFiscale.electricite_couzon_type) +
                getAnnual(simFiscale.assurance_hab_couzon, simFiscale.assurance_hab_couzon_type) +
                getAnnual(simFiscale.assurance_emprunt_couzon, simFiscale.assurance_emprunt_couzon_type) +
                getAnnual(simFiscale.interets_emprunt_couzon, simFiscale.interets_emprunt_couzon_type) +
                getAnnual(simFiscale.menage_couzon, simFiscale.menage_couzon_type) +
                getAnnual(simFiscale.linge_couzon, simFiscale.linge_couzon_type) +
                getAnnual(simFiscale.logiciel_couzon, simFiscale.logiciel_couzon_type) +
                getAnnual(simFiscale.copropriete_couzon, simFiscale.copropriete_couzon_type) +
                (simFiscale.taxe_fonciere_couzon || 0) +
                (simFiscale.cfe_couzon || 0) +
                (simFiscale.commissions_couzon || 0);
            
            // Trévoux (sans amortissement)
            const chargesTrevoux = 
                getAnnual(simFiscale.internet_trevoux, simFiscale.internet_trevoux_type) +
                getAnnual(simFiscale.eau_trevoux, simFiscale.eau_trevoux_type) +
                getAnnual(simFiscale.electricite_trevoux, simFiscale.electricite_trevoux_type) +
                getAnnual(simFiscale.assurance_hab_trevoux, simFiscale.assurance_hab_trevoux_type) +
                getAnnual(simFiscale.assurance_emprunt_trevoux, simFiscale.assurance_emprunt_trevoux_type) +
                getAnnual(simFiscale.interets_emprunt_trevoux, simFiscale.interets_emprunt_trevoux_type) +
                getAnnual(simFiscale.menage_trevoux, simFiscale.menage_trevoux_type) +
                getAnnual(simFiscale.linge_trevoux, simFiscale.linge_trevoux_type) +
                getAnnual(simFiscale.logiciel_trevoux, simFiscale.logiciel_trevoux_type) +
                getAnnual(simFiscale.copropriete_trevoux, simFiscale.copropriete_trevoux_type) +
                (simFiscale.taxe_fonciere_trevoux || 0) +
                (simFiscale.cfe_trevoux || 0) +
                (simFiscale.commissions_trevoux || 0);
            
            // Frais professionnels
            const fraisPro = 
                (simFiscale.comptable || 0) +
                (simFiscale.frais_bancaires || 0) +
                getAnnual(simFiscale.telephone, simFiscale.telephone_type) +
                (simFiscale.materiel_info || 0) +
                (simFiscale.rc_pro || 0) +
                (simFiscale.formation || 0) +
                getAnnual(simFiscale.fournitures, simFiscale.fournitures_type);
            
            // Listes
            const travaux = (simFiscale.travaux_liste || []).reduce((sum, item) => sum + item.montant, 0);
            const fraisDivers = (simFiscale.frais_divers_liste || []).reduce((sum, item) => sum + item.montant, 0);
            const produitsAccueil = (simFiscale.produits_accueil_liste || []).reduce((sum, item) => sum + item.montant, 0);
            
            // Crédit Trévoux
            const creditTrevoux = (simFiscale.credits_liste || [])
                .filter(c => c.nom && c.nom.toLowerCase().includes('trévoux'))
                .reduce((sum, c) => sum + (c.mensualite * 12), 0);
            
            totalChargesAnnee = chargesCouzon + chargesTrevoux + fraisPro + travaux + fraisDivers + produitsAccueil + creditTrevoux;
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
            
            // Bénéfice = CA du mois - charges moyennes mensuelles
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
                        text: `Évolution des Bénéfices Mensuels (${selectedYear}) - CA mensuel - Charges moyennes (${chargesMoyennesMensuelles.toFixed(0)}€/mois)`, 
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
window.updatePlatformCounters = updatePlatformCounters;
window.updateAdvancedStats = updateAdvancedStats;
window.populateYearFilter = populateYearFilter;
window.filterStatsByYear = filterStatsByYear;
window.updateAllCharts = updateAllCharts;
