// ==========================================
// 💰 MODULE GESTION DES CHARGES
// ==========================================
// Gestion des charges, calculs financiers et données historiques

// ==========================================
// 📊 AFFICHAGE DES CHARGES
// ==========================================

async function updateChargesDisplay() {
    const reservations = await getAllReservations();
    const charges = await getAllCharges();
    
    // Calcul recettes
    const totalRecettes = reservations.reduce((sum, r) => sum + r.montant, 0);
    
    // Calcul charges
    let totalCharges = 0;
    charges.forEach(c => {
        if (c.type === 'mensuelle') {
            totalCharges += c.montant * 12;
        } else if (c.type === 'annuelle') {
            totalCharges += c.montant;
        } else {
            totalCharges += c.montant;
        }
    });
    
    // Calcul URSSAF (22% des recettes)
    const provisionUrssaf = totalRecettes * 0.22;
    
    // Résultat net
    const resultatNet = totalRecettes - totalCharges - provisionUrssaf;
    
    document.getElementById('totalRecettes').textContent = totalRecettes.toFixed(0) + ' €';
    document.getElementById('totalCharges').textContent = totalCharges.toFixed(0) + ' €';
    document.getElementById('provisionUrssaf').textContent = provisionUrssaf.toFixed(0) + ' €';
    document.getElementById('resultatNet').textContent = resultatNet.toFixed(0) + ' €';
    
    // Liste des charges
    const chargesList = document.getElementById('chargesList');
    if (charges.length === 0) {
        window.SecurityUtils.setInnerHTML(chargesList, '<p class="text-muted" style="text-align: center; padding: 20px;">Aucune charge enregistrée</p>');
        return;
    }
    
    let html = '';
    charges.forEach(c => {
        html += `
            <div class="charge-item">
                <div class="charge-info">
                    <div class="charge-name">${c.nom} - ${c.gite}</div>
                    <div class="text-secondary" style="font-size: 0.9rem; margin-top: 5px;">
                        ${c.type ? (c.type.charAt(0).toUpperCase() + c.type.slice(1)) : 'Autre'} ${c.date ? '| ' + formatDate(c.date) : ''}
                        ${c.notes ? '<br>' + c.notes : ''}
                    </div>
                </div>
                <div style="display: flex; align-items: center; gap: 15px;">
                    <div class="charge-amount">${c.montant ? c.montant.toFixed(2) : '0.00'} €</div>
                    <button class="btn btn-danger btn-small" onclick="deleteChargeById(${c.id})"><svg style="width:16px;height:16px;stroke:currentColor;" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg></button>
                </div>
            </div>
        `;
    });
    
    window.SecurityUtils.setInnerHTML(chargesList, html);
}

async function deleteChargeById(id) {
    if (confirm('Supprimer cette charge ?')) {
        await deleteCharge(id);
        await updateChargesDisplay();
        await updateStats(); // Mettre à jour le graphique CA vs Charges
        showToast('✓ Charge supprimée');
    }
}

// Gestionnaire formulaire charges - sera appelé après chargement de l'onglet
window.initChargeForm = function() {
    const chargeForm = document.getElementById('chargeForm');
    if (!chargeForm || chargeForm._initialized) return;
    
    // Validation temps réel
    if (window.ValidationUtils) {
        window.ValidationUtils.attachRealtimeValidation('chargeNom', 'text', { required: true });
        window.ValidationUtils.attachRealtimeValidation('chargeMontant', 'amount', { required: true });
    }
    
    chargeForm._initialized = true;
    chargeForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Validation avec ValidationUtils
        if (window.ValidationUtils) {
            const rules = {
                chargeNom: { type: 'text', required: true },
                chargeMontant: { type: 'amount', required: true }
            };
            
            const validation = window.ValidationUtils.validateForm(this, rules);
            if (!validation.valid) {
                console.warn('❌ Formulaire charge invalide:', validation.errors);
                return;
            }
        }
        
        const charge = {
            gite: document.getElementById('chargeGite').value,
            nom: document.getElementById('chargeNom').value,
            montant: parseFloat(document.getElementById('chargeMontant').value),
            type: document.getElementById('chargeType').value,
            date: document.getElementById('chargeDate').value || new Date().toISOString().split('T')[0],
            notes: document.getElementById('chargeNotes').value,
            timestamp: new Date().toISOString()
        };
        
        await addCharge(charge);
        this.reset();
        await updateChargesDisplay();
        await updateStats(); // Mettre à jour le graphique CA vs Charges
        showToast('✓ Charge ajoutée');
    });
};

// ==========================================
// 📊 GESTION DONNÉES HISTORIQUES
// ==========================================

function toggleHistoricalDataForm() {
    const form = document.getElementById('historicalDataForm');
    if (form.style.display === 'none') {
        form.style.display = 'block';
        displayHistoricalYearsList();
    } else {
        form.style.display = 'none';
    }
}

async function saveHistoricalData() {
    const year = parseInt(document.getElementById('historicalYear').value);
    const gite = document.getElementById('historicalGite').value;
    const currentYear = new Date().getFullYear();
    
    if (!year || year < 2000 || year >= currentYear) {
        showToast(`⚠️ Saisissez une année précédente (max: ${currentYear - 1})`, 'error');
        return;
    }
    
    const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    const data = {
        year: year,
        gite: gite,
        months: {}
    };
    
    months.forEach(m => {
        const value = parseFloat(document.getElementById(`hist_${m}`).value) || 0;
        data.months[m] = value;
    });
    
    try {
        // Supprimer l'ancien si existe
        const existing = await getHistoricalData(year, gite);
        if (existing) {
            await deleteHistoricalDataById(existing.id);
        }
        
        // Ajouter le nouveau avec Promise
        await new Promise((resolve, reject) => {
            const transaction = db.transaction(['historicalData'], 'readwrite');
            const request = transaction.objectStore('historicalData').add(data);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject('Erreur ajout');
        });
        
        showToast(`✓ Données ${year} - ${gite} sauvegardées`);
        displayHistoricalYearsList();
        clearHistoricalForm();
        updateStats(); // Rafraîchir les graphiques
    } catch (error) {
        showToast('❌ Erreur sauvegarde', 'error');
        console.error(error);
    }
}

// ==========================================
// 🔥 FONCTIONS HISTORICAL DATA - SUPABASE
// ==========================================

async function getHistoricalData(year, gite) {
    try {
        const { data, error } = await window.supabaseClient
            .from('fiscal_history')
            .select('*')
            .eq('year', year)
            .eq('gite', gite)
            .single();
        
        if (error && error.code !== 'PGRST116') throw error;
        return data;
    } catch (error) {
        console.error('Erreur getHistoricalData:', error);
        return null;
    }
}

async function getAllHistoricalData() {
    try {
        const { data, error } = await window.supabaseClient
            .from('fiscal_history')
            .select('*')
            .order('year', { ascending: false });
        
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Erreur getAllHistoricalData:', error);
        return [];
    }
}

async function deleteHistoricalDataById(id) {
    try {
        const { error } = await window.supabaseClient
            .from('fiscal_history')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
    } catch (error) {
        console.error('Erreur deleteHistoricalDataById:', error);
        throw error;
    }
}

async function saveHistoricalDataTotal() {
    const year = parseInt(document.getElementById('historicalYear').value);
    
    if (!year || year < 2000 || year > 2030) {
        showToast('⚠️ Année invalide (entre 2000 et 2030)', 'error');
        return;
    }
    
    const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    
    const monthsData = {};
    months.forEach(m => {
        const value = parseFloat(document.getElementById(`hist_total_${m}`).value) || 0;
        monthsData[m] = value;
    });
    
    try {
        const existing = await getHistoricalData(year, 'Total');
        
        if (existing) {
            const { error } = await window.supabaseClient
                .from('fiscal_history')
                .update({ months: monthsData })
                .eq('id', existing.id);
            
            if (error) throw error;
        } else {
            const { error } = await window.supabaseClient
                .from('fiscal_history')
                .insert({ year: year, gite: 'Total', months: monthsData });
            
            if (error) throw error;
        }
        
        showToast(`✓ Données ${year} sauvegardées`);
        displayHistoricalYearsList();
        clearHistoricalFormTotal();
        updateStats();
    } catch (error) {
        console.error('Erreur saveHistoricalDataTotal:', error);
        showToast('❌ Erreur sauvegarde: ' + error.message, 'error');
    }
}

async function loadHistoricalDataTotal() {
    const year = parseInt(document.getElementById('historicalYear').value);
    
    if (!year) {
        showToast('⚠️ Sélectionnez une année', 'error');
        return;
    }
    
    const dataTotal = await getHistoricalData(year, 'Total');
    
    if (!dataTotal) {
        showToast(`ℹ️ Aucune donnée pour ${year}`, 'error');
        return;
    }
    
    const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    months.forEach(m => {
        document.getElementById(`hist_total_${m}`).value = dataTotal.months[m] || 0;
    });
    
    showToast(`✓ Données ${year} chargées`);
}

async function deleteHistoricalDataTotal() {
    const year = parseInt(document.getElementById('historicalYear').value);
    
    if (!year) {
        showToast('⚠️ Sélectionnez une année', 'error');
        return;
    }
    
    if (!confirm(`Supprimer toutes les données ${year} ?`)) {
        return;
    }
    
    const dataTotal = await getHistoricalData(year, 'Total');
    
    if (dataTotal) {
        await deleteHistoricalDataById(dataTotal.id);
    }
    
    showToast(`✓ Données ${year} supprimées`);
    clearHistoricalFormTotal();
    displayHistoricalYearsList();
    updateStats();
}

function clearHistoricalFormTotal() {
    document.getElementById('historicalYear').value = '';
    const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    months.forEach(m => {
        document.getElementById(`hist_total_${m}`).value = '';
    });
}

// Fonctions anciennes - désactivées
async function loadHistoricalData() {
    showToast('⚠️ Utilisez le formulaire Total', 'error');
}

async function deleteHistoricalData() {
    showToast('⚠️ Utilisez le formulaire Total', 'error');
}

function clearHistoricalForm() {
    clearHistoricalFormTotal();
}

async function displayHistoricalYearsList() {
    let data = [];
    try {
        data = await getAllHistoricalData();
    } catch (e) {
        // Table non disponible
    }
    const container = document.getElementById('historicalYearsList');
    
    if (data.length === 0) {
        window.SecurityUtils.setInnerHTML(container, '<p class="text-muted" style="font-style: italic;">Aucune donnée historique enregistrée</p>');
        return;
    }
    
    // Grouper par année
    const byYear = {};
    data.forEach(d => {
        if (!byYear[d.year]) byYear[d.year] = {};
        byYear[d.year][d.gite] = d;
    });
    
    let html = '<div style="display: flex; flex-wrap: wrap; gap: 15px;">';
    Object.keys(byYear).sort().reverse().forEach(year => {
        html += `
            <div class="historic-year-card">
                <div class="historic-year-title">📅 ${year}</div>
        `;
        
        if (byYear[year]['Total']) {
            const total = Object.values(byYear[year]['Total'].months).reduce((a, b) => a + b, 0);
            html += `
                <div style="margin-bottom: 5px;">
                    <span style="font-weight: 600;">Total:</span> ${total.toFixed(2)} €
                </div>
            `;
        }
        
        html += '</div>';
    });
    html += '</div>';
    
    window.SecurityUtils.setInnerHTML(container, html);
}

async function updateStats() {
    const reservations = await getAllReservations();
    let historicalData = [];
    try {
        historicalData = await getAllHistoricalData();
    } catch (e) {
        // Table non disponible
    }
    
    // Filtrer par l'année sélectionnée
    const selectedYear = parseInt(document.getElementById('yearFilterStats')?.value || new Date().getFullYear());
    
    // Vérifier si des données historiques "Total" existent pour cette année
    const histTotal = historicalData.find(d => d.year === selectedYear && d.gite === 'Total');
    
    let caTotal = 0;
    let totalReservations = 0;
    
    if (histTotal) {
        // Utiliser UNIQUEMENT les données historiques (pas les réservations)
        const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
        months.forEach(m => {
            caTotal += histTotal.months[m] || 0;
        });
        // Pour les données historiques, on ne peut pas compter les réservations individuelles
        totalReservations = '-';
        const statTotalEl = document.getElementById('statTotal');
        const statTrevouxEl = document.getElementById('statTrevoux');
        const statCouzonEl = document.getElementById('statCouzon');
        if (statTotalEl) statTotalEl.textContent = totalReservations;
        if (statTrevouxEl) statTrevouxEl.textContent = '-';
        if (statCouzonEl) statCouzonEl.textContent = '-';
    } else {
        // Utiliser les réservations automatiques (dynamique pour N gîtes)
        const filteredReservations = reservations.filter(r => {
            const year = parseLocalDate(r.dateDebut).getFullYear();
            return year === selectedYear;
        });
        
        const gites = await window.gitesManager.getVisibleGites();
        caTotal = 0;
        totalReservations = 0;
        
        gites.forEach(gite => {
            const reservationsGite = filteredReservations.filter(r => r.gite_id === gite.id || r.gite === gite.name);
            const caGite = reservationsGite.reduce((sum, r) => sum + r.montant, 0);
            caTotal += caGite;
            totalReservations += reservationsGite.length;
            
            const statEl = document.getElementById(`stat${gite.slug}`);
            if (statEl) statEl.textContent = reservationsGite.length;
        });
        
        const statTotalEl = document.getElementById('statTotal');
        if (statTotalEl) statTotalEl.textContent = totalReservations;
        
        // Mettre à jour les compteurs par plateforme et statistiques avancées
        updatePlatformCounters(filteredReservations);
        updateAdvancedStats(filteredReservations);
    }
    
    const statCAEl = document.getElementById('statCA');
    if (statCAEl) statCAEl.textContent = caTotal.toFixed(0) + ' €';
    
    // Générer les checkboxes de comparaison d'années
    generateYearComparisonCheckboxes(reservations, historicalData);
    
    // Mettre à jour les graphiques avec les données filtrées
    const filteredReservations = reservations.filter(r => {
        const year = parseLocalDate(r.dateDebut).getFullYear();
        return year === selectedYear;
    });
    updateAllCharts(filteredReservations);
}

function generateYearComparisonCheckboxes(reservations, historicalData) {
    const container = document.getElementById('yearComparisonCheckboxes');
    if (!container) return; // Conteneur pas encore chargé
    const allYears = new Set();
    const yearsWithReservations = new Set();
    const yearsWithTotal = new Set();
    
    // Années des réservations
    reservations.forEach(r => {
        const year = parseLocalDate(r.dateDebut).getFullYear();
        allYears.add(year);
        yearsWithReservations.add(year);
    });
    
    // Années historiques
    historicalData.forEach(d => {
        allYears.add(d.year);
        if (d.gite === 'Total') {
            yearsWithTotal.add(d.year);
        }
    });
    
    const sortedYears = Array.from(allYears).sort((a, b) => b - a);
    const currentYear = new Date().getFullYear();
    
    let html = '';
    sortedYears.forEach(year => {
        const isCurrentYear = year === currentYear;
        // Badge "Auto" UNIQUEMENT pour l'année en cours ET qui a des réservations ET pas de Total manuel
        const isAuto = isCurrentYear && yearsWithReservations.has(year) && !yearsWithTotal.has(year);
        // Ne cocher automatiquement QUE l'année en cours
        const checked = isCurrentYear ? 'checked' : '';
        const badge = isAuto ? '<span class="badge-auto">Auto ⚡</span>' : '';
        const autoClass = isAuto ? ' auto' : '';
        
        html += `
            <label class="year-selector-label${autoClass}">
                <input type="checkbox" value="${year}" ${checked} onchange="updateAllCharts()">
                <span>${year}${badge}</span>
            </label>
        `;
    });
    
    window.SecurityUtils.setInnerHTML(container, html);
}

// ==========================================
// 🌐 EXPORTS GLOBAUX
// ==========================================

window.updateChargesDisplay = updateChargesDisplay;
window.deleteChargeById = deleteChargeById;
window.toggleHistoricalDataForm = toggleHistoricalDataForm;
window.saveHistoricalData = saveHistoricalData;
window.getHistoricalData = getHistoricalData;
window.getAllHistoricalData = getAllHistoricalData;
window.deleteHistoricalDataById = deleteHistoricalDataById;
window.saveHistoricalDataTotal = saveHistoricalDataTotal;
window.loadHistoricalDataTotal = loadHistoricalDataTotal;
window.deleteHistoricalDataTotal = deleteHistoricalDataTotal;
window.clearHistoricalFormTotal = clearHistoricalFormTotal;
window.loadHistoricalData = loadHistoricalData;
window.deleteHistoricalData = deleteHistoricalData;
window.clearHistoricalForm = clearHistoricalForm;
window.displayHistoricalYearsList = displayHistoricalYearsList;
window.updateStats = updateStats;
window.generateYearComparisonCheckboxes = generateYearComparisonCheckboxes;
