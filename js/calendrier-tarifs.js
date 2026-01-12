// ==========================================
// 💰 MODULE CALENDRIER & TARIFS
// ==========================================
// Gestion complète du calendrier avec tarification dynamique
// Date : 11 janvier 2026

// ==========================================
// VARIABLES GLOBALES
// ==========================================

let currentGiteId = null;
let currentOrganizationId = null;

// Calendriers séparés pour tarifs et réservations
let currentMonthTarifs = new Date().getMonth();
let currentYearTarifs = new Date().getFullYear();
let currentMonthReservations = new Date().getMonth();
let currentYearReservations = new Date().getFullYear();

// Caches de données
let tarifsCache = [];
let reservationsCache = [];
let reglesCache = null;
let selectedDates = [];

// ==========================================
// INITIALISATION
// ==========================================

// Gestionnaires globaux pour la sélection par glisser
document.addEventListener('mouseup', () => {
    if (isSelecting && selectedDates.length > 0) {
        // Ouvrir le modal avec les dates sélectionnées
        openTarifModal(selectedDates[0]);
    }
    isSelecting = false;
    selectionMode = null;
});

async function initCalendrierTarifs() {
    try {
        // Initialisation silencieuse
        
        // Vérifier authentification
        const user = await window.supabaseClient.auth.getUser();
        if (!user || !user.data || !user.data.user) {
            // Utilisateur non connecté
            window.location.href = 'login.html';
            return;
        }
        
        // Récupérer l'organization de l'utilisateur
        currentOrganizationId = await getUserOrganizationId();
        
        // Charger la liste des gîtes (avec fallback si GitesManager non disponible)
        await loadGitesSelector();
        
        // Charger la configuration sauvegardée
        await loadConfiguration();
        
        // Initialisation terminée
        
    } catch (error) {
        console.error('❌ Erreur initialisation:', error);
        showToast('Erreur lors du chargement', 'error');
    }
}

// ==========================================
// CHARGEMENT DES GÎTES
// ==========================================

async function loadGitesSelector() {
    try {
        let gites = [];
        
        // Essayer d'utiliser GitesManager d'abord
        if (window.GitesManager && window.GitesManager.loaded) {
            gites = await window.GitesManager.getAll();
        } else {
            // Fallback : requête directe si GitesManager non disponible
            // RLS filtre automatiquement par owner_user_id
            const { data, error } = await window.supabaseClient
                .from('gites')
                .select('id, name, color')
                .order('name', { ascending: true });
            
            if (error) throw error;
            gites = data;
        }
        
        if (!gites || gites.length === 0) {
            console.error('❌ Aucun gîte trouvé');
            return;
        }
        
        const selector = document.getElementById('gite-selector');
        if (!selector) {
            console.error('❌ Sélecteur de gîte introuvable');
            return;
        }
        
        selector.innerHTML = '';
        
        gites.forEach((gite, index) => {
            const option = document.createElement('option');
            option.value = gite.id;
            option.textContent = gite.name;
            option.dataset.color = gite.color || '#667eea';
            selector.appendChild(option);
        });
        
        // Sélectionner le premier gîte par défaut
        if (gites.length > 0 && !currentGiteId) {
            currentGiteId = gites[0].id;
            selector.value = currentGiteId;
            updateGiteHeader(gites[0]);
            // Charger les données du premier gîte
            await loadAllData();
        }
        
        selector.addEventListener('change', async (e) => {
            const selectedOption = selector.options[selector.selectedIndex];
            const giteData = gites.find(g => g.id === e.target.value);
            if (giteData) updateGiteHeader(giteData);
            currentGiteId = e.target.value;
            if (currentGiteId) {
                await loadAllData();
                await saveConfiguration();
            }
        });
        
    } catch (error) {
        console.error('❌ Erreur chargement gîtes:', error);
    }
}

// ==========================================
// SECTION 1 : TARIFS DE BASE
// ==========================================

function updateGiteHeader(gite) {
    const monthTitle = document.getElementById('current-month-tarifs');
    if (!monthTitle) return;
    
    const date = new Date(currentYearTarifs, currentMonthTarifs, 1);
    const monthYear = date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    
    monthTitle.innerHTML = `
        <span style="display: inline-flex; align-items: center; gap: 10px;">
            <span style="display: inline-block; width: 16px; height: 16px; background: ${gite.color || '#667eea'}; border: 2px solid #2D3436; border-radius: 4px;"></span>
            <span style="font-weight: 700;">${gite.name}</span>
            <span style="opacity: 0.7;">—</span>
            <span>${monthYear}</span>
        </span>
    `;
}

async function loadTarifsBase() {
    try {
        if (!currentGiteId) return;
        
        // Charger depuis la base de données
        const { data, error } = await window.supabaseClient
            .from('gites')
            .select('tarifs_calendrier')
            .eq('id', currentGiteId)
            .single();
        
        if (error) throw error;
        
        tarifsCache = data?.tarifs_calendrier || [];
        renderCalendrierTarifs();
        
    } catch (error) {
        console.error('❌ Erreur chargement tarifs:', error);
        tarifsCache = [];
        renderCalendrierTarifs();
    }
}

let isSelecting = false;
let selectionMode = null; // 'select' ou 'deselect'

function renderCalendrierTarifs() {
    const container = document.getElementById('calendar-grid-tarifs');
    if (!container) return;
    
    const monthTitle = document.getElementById('current-month-tarifs');
    const date = new Date(currentYearTarifs, currentMonthTarifs, 1);
    monthTitle.textContent = date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    
    container.innerHTML = '';
    
    // En-têtes des jours
    const jours = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
    jours.forEach(jour => {
        const header = document.createElement('div');
        header.className = 'day-header';
        header.textContent = jour;
        container.appendChild(header);
    });
    
    // Premier jour du mois (0 = dimanche, 1 = lundi, etc.)
    const firstDay = new Date(currentYearTarifs, currentMonthTarifs, 1);
    let dayOfWeek = firstDay.getDay();
    dayOfWeek = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Convertir dimanche=0 en dimanche=6
    
    // Jours du mois précédent
    for (let i = 0; i < dayOfWeek; i++) {
        const emptyDiv = document.createElement('div');
        emptyDiv.className = 'day-card other-month';
        container.appendChild(emptyDiv);
    }
    
    // Jours du mois
    const lastDay = new Date(currentYearTarifs, currentMonthTarifs + 1, 0).getDate();
    
    for (let day = 1; day <= lastDay; day++) {
        const dateObj = new Date(currentYearTarifs, currentMonthTarifs, day);
        const dateStr = dateObj.toISOString().split('T')[0];
        
        const tarif = tarifsCache.find(t => t.date === dateStr);
        
        const dayCard = document.createElement('div');
        dayCard.className = 'day-card';
        dayCard.dataset.date = dateStr;
        
        if (tarif) {
            dayCard.classList.add('has-tarif');
        }
        
        if (selectedDates.includes(dateStr)) {
            dayCard.classList.add('selected');
        }
        
        dayCard.innerHTML = `
            <div class="day-number">${day}</div>
            ${tarif ? `<div class="day-price" style="font-size: 13px; font-weight: 600; color: #2D3436; margin-top: 4px;">${parseFloat(tarif.prix_nuit).toFixed(0)}€</div>` : '<div style="font-size: 11px; color: #999; margin-top: 4px;">—</div>'}
        `;
        
        // Événements pour sélection par glisser-déposer
        dayCard.addEventListener('mousedown', (e) => {
            e.preventDefault();
            isSelecting = true;
            const isSelected = selectedDates.includes(dateStr);
            selectionMode = isSelected ? 'deselect' : 'select';
            toggleDateSelection(dateStr);
            dayCard.classList.toggle('selected');
        });
        
        dayCard.addEventListener('mouseenter', () => {
            if (isSelecting) {
                const isCurrentlySelected = selectedDates.includes(dateStr);
                if (selectionMode === 'select' && !isCurrentlySelected) {
                    selectedDates.push(dateStr);
                    dayCard.classList.add('selected');
                } else if (selectionMode === 'deselect' && isCurrentlySelected) {
                    const index = selectedDates.indexOf(dateStr);
                    if (index > -1) selectedDates.splice(index, 1);
                    dayCard.classList.remove('selected');
                }
            }
        });
        
        // Clic simple pour ouvrir modal si pas de sélection en cours
        dayCard.addEventListener('click', () => {
            if (!isSelecting && selectedDates.length === 0) {
                openTarifModal(dateStr);
            }
        });
        
        container.appendChild(dayCard);
    }
}

function toggleDateSelection(dateStr) {
    const index = selectedDates.indexOf(dateStr);
    if (index > -1) {
        selectedDates.splice(index, 1);
    } else {
        selectedDates.push(dateStr);
    }
}

function previousMonthTarifs() {
    currentMonthTarifs--;
    if (currentMonthTarifs < 0) {
        currentMonthTarifs = 11;
        currentYearTarifs--;
    }
    renderCalendrierTarifs();
}

function nextMonthTarifs() {
    currentMonthTarifs++;
    if (currentMonthTarifs > 11) {
        currentMonthTarifs = 0;
        currentYearTarifs++;
    }
    renderCalendrierTarifs();
}

function openTarifModal(dateStr) {
    const modal = document.getElementById('modal-tarif-ct');
    const dateDisplay = document.getElementById('modal-tarif-date');
    const prixInput = document.getElementById('modal-tarif-prix');
    
    const date = new Date(dateStr + 'T00:00:00');
    dateDisplay.textContent = `📅 ${date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}`;
    
    // Pré-remplir avec le tarif existant
    const tarif = tarifsCache.find(t => t.date === dateStr);
    prixInput.value = tarif ? tarif.prix_nuit : '';
    
    modal.dataset.date = dateStr;
    modal.classList.add('active');
}

function closeModalTarif() {
    const modal = document.getElementById('modal-tarif-ct');
    modal.classList.remove('active');
    selectedDates = [];
    renderCalendrierTarifs();
}

async function saveTarifFromModal() {
    try {
        const modal = document.getElementById('modal-tarif-ct');
        const dateStr = modal.dataset.date;
        const prix = parseFloat(document.getElementById('modal-tarif-prix').value);
        
        if (!prix || prix <= 0) {
            showToast('Prix invalide', 'error');
            return;
        }
        
        // Si des dates sont sélectionnées, appliquer à toutes
        const datesToUpdate = selectedDates.length > 0 ? selectedDates : [dateStr];
        
        // Sauvegarder dans localStorage
        const storageKey = `tarifs_${currentGiteId}`;
        const stored = localStorage.getItem(storageKey);
        const existingTarifs = stored ? JSON.parse(stored) : [];
        
        // Mettre à jour ou ajouter les tarifs
        for (const date of datesToUpdate) {
            const existingIndex = existingTarifs.findIndex(t => t.date === date);
            if (existingIndex > -1) {
                existingTarifs[existingIndex].prix_nuit = prix;
            } else {
                existingTarifs.push({ date, prix_nuit: prix });
            }
        }
        
        // Sauvegarder dans localStorage
        localStorage.setItem(storageKey, JSON.stringify(existingTarifs));
        
        // Mettre à jour le cache
        tarifsCache = existingTarifs;
        
        showToast(`✅ Tarif enregistré pour ${datesToUpdate.length} jour(s)`, 'success');
        closeModalTarif();
        
        // Re-render immédiatement pour afficher les prix
        renderCalendrierTarifs();
        
    } catch (error) {
        showToast('Erreur lors de la sauvegarde', 'error');
    }
}

// ==========================================
// SECTION 2 : RÈGLES TARIFAIRES
// ==========================================

async function loadRegles() {
    try {
        if (!currentGiteId) return createDefaultRegles();
        
        // TEMPORAIRE: localStorage
        const storageKey = `regles_${currentGiteId}`;
        const stored = localStorage.getItem(storageKey);
        
        if (stored) {
            reglesCache = JSON.parse(stored);
        } else {
            reglesCache = createDefaultRegles();
        }
        
        renderReglesForm();
        
    } catch (error) {
        reglesCache = createDefaultRegles();
        renderReglesForm();
    }
}

function createDefaultRegles() {
    return {
        grille_duree: {
            type: 'pourcentage',
            nuit_1: 100,
            nuit_2: 95,
            nuit_3: 90,
            nuit_4: 90,
            nuit_5: 85,
            nuit_6: 85,
            nuit_7: 80,
            nuit_supp: 80
        },
        promotions: {
            long_sejour: { actif: false, pourcentage: 10, a_partir_de: 7 },
            last_minute: { actif: false, pourcentage: 15, jours_avant: 7 },
            early_booking: { actif: false, pourcentage: 10, jours_avant: 60 }
        },
        duree_min_defaut: 2,
        periodes_duree_min: []
    };
}

function renderReglesForm() {
    if (!reglesCache) return;
    
    // Grille de durée
    const typeTarif = reglesCache.grille_duree?.type || 'pourcentage';
    document.getElementById('type-tarif-toggle').checked = typeTarif === 'montant';
    document.getElementById('type-tarif-label').textContent = 
        typeTarif === 'pourcentage' ? 'Pourcentage du tarif de base' : 'Montant fixe';
    
    for (let i = 1; i <= 7; i++) {
        const input = document.getElementById(`nuit-${i}`);
        if (input) input.value = reglesCache.grille_duree?.[`nuit_${i}`] || 100;
    }
    document.getElementById('nuit-supp').value = reglesCache.grille_duree?.nuit_supp || 80;
    
    // Promotions
    const promos = reglesCache.promotions || {};
    
    if (promos.long_sejour) {
        document.getElementById('promo-long-sejour').checked = promos.long_sejour.actif;
        document.getElementById('long-sejour-pct').value = promos.long_sejour.pourcentage;
        document.getElementById('long-sejour-nuits').value = promos.long_sejour.a_partir_de;
    }
    
    if (promos.last_minute) {
        document.getElementById('promo-last-minute').checked = promos.last_minute.actif;
        document.getElementById('last-minute-pct').value = promos.last_minute.pourcentage;
        document.getElementById('last-minute-jours').value = promos.last_minute.jours_avant;
    }
    
    if (promos.early_booking) {
        document.getElementById('promo-early-booking').checked = promos.early_booking.actif;
        document.getElementById('early-booking-pct').value = promos.early_booking.pourcentage;
        document.getElementById('early-booking-jours').value = promos.early_booking.jours_avant;
    }
    
    // Durée minimale
    document.getElementById('duree-min-defaut').value = reglesCache.duree_min_defaut || 2;
    
    // Périodes spécifiques
    renderPeriodesList();
}

function renderPeriodesList() {
    const container = document.getElementById('periodes-list');
    if (!container) return;
    
    const periodes = reglesCache.periodes_duree_min || [];
    
    if (periodes.length === 0) {
        container.innerHTML = '<p style="color: #999;">Aucune période spécifique définie</p>';
        return;
    }
    
    container.innerHTML = periodes.map((periode, index) => `
        <div class="rules-card" style="display: flex; gap: 10px; align-items: center; padding: 15px;">
            <div style="flex: 1;">
                <strong>Du ${new Date(periode.date_debut).toLocaleDateString('fr-FR')} 
                au ${new Date(periode.date_fin).toLocaleDateString('fr-FR')}</strong>
                - Minimum ${periode.nuits_min} nuits
            </div>
            <button class="btn-neo btn-delete" onclick="removePeriodeDureeMin(${index})">🗑️</button>
        </div>
    `).join('');
}

function toggleTarifType() {
    const toggle = document.getElementById('type-tarif-toggle');
    const label = document.getElementById('type-tarif-label');
    
    if (toggle.checked) {
        label.textContent = 'Montant fixe';
    } else {
        label.textContent = 'Pourcentage du tarif de base';
    }
}

function addPeriodeDureeMin() {
    const dateDebut = prompt('Date de début (YYYY-MM-DD) :');
    const dateFin = prompt('Date de fin (YYYY-MM-DD) :');
    const nuitsMin = prompt('Nombre de nuits minimum :');
    
    if (!dateDebut || !dateFin || !nuitsMin) return;
    
    if (!reglesCache.periodes_duree_min) {
        reglesCache.periodes_duree_min = [];
    }
    
    reglesCache.periodes_duree_min.push({
        date_debut: dateDebut,
        date_fin: dateFin,
        nuits_min: parseInt(nuitsMin)
    });
    
    renderPeriodesList();
}

function removePeriodeDureeMin(index) {
    if (confirm('Supprimer cette période ?')) {
        reglesCache.periodes_duree_min.splice(index, 1);
        renderPeriodesList();
    }
}

async function saveRegles() {
    try {
        if (!currentGiteId) {
            showToast('Sélectionnez un gîte', 'error');
            return;
        }
        
        // Récupérer les valeurs du formulaire
        const grilleDuree = {
            type: document.getElementById('type-tarif-toggle').checked ? 'montant' : 'pourcentage',
            nuit_1: parseFloat(document.getElementById('nuit-1').value) || 100,
            nuit_2: parseFloat(document.getElementById('nuit-2').value) || 95,
            nuit_3: parseFloat(document.getElementById('nuit-3').value) || 90,
            nuit_4: parseFloat(document.getElementById('nuit-4').value) || 90,
            nuit_5: parseFloat(document.getElementById('nuit-5').value) || 85,
            nuit_6: parseFloat(document.getElementById('nuit-6').value) || 85,
            nuit_7: parseFloat(document.getElementById('nuit-7').value) || 80,
            nuit_supp: parseFloat(document.getElementById('nuit-supp').value) || 80
        };
        
        const promotions = {
            long_sejour: {
                actif: document.getElementById('promo-long-sejour').checked,
                pourcentage: parseFloat(document.getElementById('long-sejour-pct').value) || 10,
                a_partir_de: parseInt(document.getElementById('long-sejour-nuits').value) || 7
            },
            last_minute: {
                actif: document.getElementById('promo-last-minute').checked,
                pourcentage: parseFloat(document.getElementById('last-minute-pct').value) || 15,
                jours_avant: parseInt(document.getElementById('last-minute-jours').value) || 7
            },
            early_booking: {
                actif: document.getElementById('promo-early-booking').checked,
                pourcentage: parseFloat(document.getElementById('early-booking-pct').value) || 10,
                jours_avant: parseInt(document.getElementById('early-booking-jours').value) || 60
            }
        };
        
        const dureeMinDefaut = parseInt(document.getElementById('duree-min-defaut').value) || 2;
        
        const regles = {
            grille_duree: grilleDuree,
            promotions: promotions,
            duree_min_defaut: dureeMinDefaut,
            periodes_duree_min: reglesCache.periodes_duree_min || []
        };
        
        // TEMPORAIRE: localStorage
        const storageKey = `regles_${currentGiteId}`;
        localStorage.setItem(storageKey, JSON.stringify(regles));
        
        reglesCache = regles;
        showToast('✅ Règles tarifaires enregistrées (localStorage temporaire)', 'success');
        
        reglesCache = regles;
        showToast('✅ Règles tarifaires enregistrées', 'success');
        
        // Recharger les réservations pour recalculer les tarifs
        await loadReservations();
        
    } catch (error) {
        console.error('❌ Erreur sauvegarde règles:', error);
        showToast('Erreur lors de la sauvegarde', 'error');
    }
}

// ==========================================
// SECTION 3 : CALENDRIER RÉSERVATIONS
// ==========================================

async function loadReservations() {
    try {
        if (!currentGiteId) return;
        
        const firstDay = new Date(currentYearReservations, currentMonthReservations, 1);
        const lastDay = new Date(currentYearReservations, currentMonthReservations + 1, 0);
        
        const { data, error } = await window.supabaseClient
            .from('reservations')
            .select('*')
            .eq('gite_id', currentGiteId)
            .gte('check_in', firstDay.toISOString().split('T')[0])
            .lte('check_out', lastDay.toISOString().split('T')[0])
            .order('check_in', { ascending: true });
        
        if (error) throw error;
        
        reservationsCache = data || [];
        // Réservations chargées
        
        renderCalendrierReservations();
        renderReservationsList();
        
    } catch (error) {
        console.error('❌ Erreur chargement réservations:', error);
        throw error;
    }
}

function renderCalendrierReservations() {
    const container = document.getElementById('calendar-grid-reservations');
    if (!container) return;
    
    const monthTitle = document.getElementById('month-title-reservations');
    const date = new Date(currentYearReservations, currentMonthReservations, 1);
    monthTitle.textContent = date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    
    container.innerHTML = '';
    
    // En-têtes
    const jours = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
    jours.forEach(jour => {
        const header = document.createElement('div');
        header.className = 'day-header';
        header.textContent = jour;
        container.appendChild(header);
    });
    
    // Calculer premier jour
    const firstDay = new Date(currentYearReservations, currentMonthReservations, 1);
    let dayOfWeek = firstDay.getDay();
    dayOfWeek = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    
    // Jours vides
    for (let i = 0; i < dayOfWeek; i++) {
        const emptyDiv = document.createElement('div');
        emptyDiv.className = 'day-card other-month';
        container.appendChild(emptyDiv);
    }
    
    // Jours du mois
    const lastDay = new Date(currentYearReservations, currentMonthReservations + 1, 0).getDate();
    
    for (let day = 1; day <= lastDay; day++) {
        const dateObj = new Date(currentYearReservations, currentMonthReservations, day);
        const dateStr = dateObj.toISOString().split('T')[0];
        
        // Trouver une réservation pour ce jour
        const reservation = reservationsCache.find(r => 
            dateStr >= r.check_in && dateStr < r.check_out
        );
        
        // Calculer le tarif estimé pour ce jour
        const tarif = tarifsCache.find(t => t.date === dateStr);
        const tarifEstime = tarif ? calculateTarifForDuration(dateStr, dateStr, 1) : null;
        
        const dayCard = document.createElement('div');
        dayCard.className = 'day-card';
        dayCard.dataset.date = dateStr;
        
        if (reservation) {
            dayCard.innerHTML = `
                <div class="day-number">${day}</div>
                <div class="reservation-overlay">
                    <div style="font-weight: 700; margin-bottom: 5px;">${reservation.client_name || 'Client'}</div>
                    <div style="font-size: 0.85rem;">👥 ${reservation.nb_personnes || '-'} pers.</div>
                    <div class="badge-platform" style="background: ${getPlatformColor(reservation.plateforme)};">
                        ${reservation.plateforme || 'Direct'}
                    </div>
                </div>
            `;
        } else {
            dayCard.innerHTML = `
                <div class="day-number">${day}</div>
                ${tarifEstime ? `<div class="day-price">${Math.round(tarifEstime)} €</div>` : ''}
            `;
        }
        
        container.appendChild(dayCard);
    }
}

function getPlatformColor(plateforme) {
    const colors = {
        'Airbnb': '#FF5A5F',
        'Booking': '#003580',
        'Gîtes de France': '#55efc4',
        'Abritel': '#FFA500',
        'Direct': '#74b9ff'
    };
    return colors[plateforme] || '#999';
}

function previousMonthReservations() {
    currentMonthReservations--;
    if (currentMonthReservations < 0) {
        currentMonthReservations = 11;
        currentYearReservations--;
    }
    loadReservations();
}

function nextMonthReservations() {
    currentMonthReservations++;
    if (currentMonthReservations > 11) {
        currentMonthReservations = 0;
        currentYearReservations++;
    }
    loadReservations();
}

function renderReservationsList() {
    const container = document.getElementById('reservations-list-container');
    if (!container) return;
    
    if (reservationsCache.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #999; padding: 40px;">Aucune réservation ce mois-ci</p>';
        return;
    }
    
    container.innerHTML = reservationsCache.map(resa => `
        <div class="reservation-card-item">
            <div style="display: flex; justify-content: space-between; align-items: start;">
                <div>
                    <h4 style="font-weight: 700; font-size: 1.2rem; margin-bottom: 10px;">${resa.client_name || 'Client'}</h4>
                    <p style="margin: 5px 0;">📅 ${formatDate(resa.check_in)} → ${formatDate(resa.check_out)} (${calculateNights(resa.check_in, resa.check_out)} nuits)</p>
                    <p style="margin: 5px 0;">👥 ${resa.nb_personnes || '-'} personnes</p>
                    <p style="margin: 5px 0;">💰 ${resa.montant || '-'} € ${resa.acompte ? `| Acompte : ${resa.acompte} €` : ''}</p>
                    ${resa.telephone ? `<p style="margin: 5px 0;">📱 ${resa.telephone}</p>` : ''}
                </div>
                <div style="display: flex; gap: 8px;">
                    <button class="btn-neo" onclick="editReservation('${resa.id}')" title="Modifier">✏️</button>
                    <button class="btn-neo btn-delete" onclick="deleteReservation('${resa.id}')" title="Supprimer">🗑️</button>
                </div>
            </div>
            <div class="badge-platform" style="display: inline-block; margin-top: 10px; background: ${getPlatformColor(resa.plateforme)}; padding: 5px 12px; border-radius: 8px; border: 2px solid var(--stroke); font-weight: 700; color: white;">
                ${resa.plateforme || 'Direct'}
            </div>
        </div>
    `).join('');
}

function filterReservationsList() {
    const origineFilter = document.getElementById('filter-origine').value;
    // TODO: Implémenter le filtrage
    renderReservationsList();
}

function formatDate(dateStr) {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function calculateNights(checkIn, checkOut) {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    return Math.ceil((end - start) / (1000 * 60 * 60 * 24));
}

// Modal réservation
function openAddReservationModal() {
    if (!currentGiteId) {
        showToast('Sélectionnez un gîte', 'error');
        return;
    }
    
    document.getElementById('modal-reservation').classList.add('active');
    
    // Réinitialiser le formulaire
    document.getElementById('resa-date-arrivee').value = '';
    document.getElementById('resa-date-depart').value = '';
    document.getElementById('resa-client-nom').value = '';
    document.getElementById('resa-client-tel').value = '';
    document.getElementById('resa-client-email').value = '';
    document.getElementById('resa-nb-personnes').value = '2';
    document.getElementById('resa-montant').value = '';
    document.getElementById('resa-acompte').value = '0';
    document.getElementById('tarif-calcule-info').textContent = '';
}

function closeModalReservation() {
    document.getElementById('modal-reservation').classList.remove('active');
}

function calculateTarifReservation() {
    const dateArrivee = document.getElementById('resa-date-arrivee').value;
    const dateDepart = document.getElementById('resa-date-depart').value;
    
    if (!dateArrivee || !dateDepart) return;
    
    const nights = calculateNights(dateArrivee, dateDepart);
    if (nights <= 0) {
        document.getElementById('tarif-calcule-info').textContent = '⚠️ Dates invalides';
        return;
    }
    
    const tarifCalcule = calculateTarifForDuration(dateArrivee, dateDepart, nights);
    document.getElementById('resa-montant').value = Math.round(tarifCalcule * 100) / 100;
    document.getElementById('tarif-calcule-info').textContent = `💡 Tarif calculé : ${Math.round(tarifCalcule)} € pour ${nights} nuit(s)`;
}

function calculateTarifForDuration(dateDebut, dateFin, nbNuits) {
    if (!reglesCache) return 0;
    
    let tarifTotal = 0;
    
    // Calculer le tarif pour chaque nuit
    for (let i = 0; i < nbNuits; i++) {
        const date = new Date(dateDebut);
        date.setDate(date.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];
        
        const tarifBase = tarifsCache.find(t => t.date === dateStr)?.prix_nuit || 0;
        
        // Appliquer la grille de durée
        let multiplicateur = 1;
        if (reglesCache?.grille_duree) {
            const key = (i + 1) <= 7 ? `nuit_${i + 1}` : 'nuit_supp';
            const value = reglesCache.grille_duree[key] || 100;
            
            if (reglesCache.grille_duree.type === 'pourcentage') {
                multiplicateur = value / 100;
            } else {
                multiplicateur = value / tarifBase;
            }
        }
        
        tarifTotal += tarifBase * multiplicateur;
    }
    
    // Appliquer les promotions
    if (reglesCache?.promotions) {
        const promos = reglesCache.promotions;
        
        // Long séjour
        if (promos.long_sejour?.actif && nbNuits >= promos.long_sejour.a_partir_de) {
            tarifTotal *= (1 - promos.long_sejour.pourcentage / 100);
        }
        
        // Last minute
        const joursAvantArrivee = Math.ceil((new Date(dateDebut) - new Date()) / (1000 * 60 * 60 * 24));
        if (promos.last_minute?.actif && joursAvantArrivee > 0 && joursAvantArrivee <= promos.last_minute.jours_avant) {
            tarifTotal *= (1 - promos.last_minute.pourcentage / 100);
        }
        
        // Early booking
        if (promos.early_booking?.actif && joursAvantArrivee >= promos.early_booking.jours_avant) {
            tarifTotal *= (1 - promos.early_booking.pourcentage / 100);
        }
    }
    
    return tarifTotal;
}

async function saveReservationFromModal() {
    try {
        const dateArrivee = document.getElementById('resa-date-arrivee').value;
        const dateDepart = document.getElementById('resa-date-depart').value;
        const clientNom = document.getElementById('resa-client-nom').value;
        const clientTel = document.getElementById('resa-client-tel').value;
        const clientEmail = document.getElementById('resa-client-email').value;
        const nbPersonnes = parseInt(document.getElementById('resa-nb-personnes').value);
        const origine = document.getElementById('resa-origine').value;
        const montant = parseFloat(document.getElementById('resa-montant').value);
        const acompte = parseFloat(document.getElementById('resa-acompte').value) || 0;
        
        if (!dateArrivee || !dateDepart || !clientNom) {
            showToast('Veuillez remplir tous les champs obligatoires', 'error');
            return;
        }
        
        // Récupérer le nom du gîte
        const giteSelector = document.getElementById('gite-selector');
        const giteName = giteSelector.options[giteSelector.selectedIndex].text;
        
        // RLS gérera automatiquement owner_user_id = auth.uid()
        const reservation = {
            gite_id: currentGiteId,
            gite: giteName,
            check_in: dateArrivee,
            check_out: dateDepart,
            client_name: clientNom,
            telephone: clientTel,
            client_email: clientEmail,
            nb_personnes: nbPersonnes,
            plateforme: origine,
            montant: montant,
            acompte: acompte,
            status: 'confirmed'
        };
        
        const { data, error } = await window.supabaseClient
            .from('reservations')
            .insert(reservation);
        
        if (error) throw error;
        
        showToast('✅ Réservation enregistrée', 'success');
        closeModalReservation();
        await loadReservations();
        
    } catch (error) {
        console.error('❌ Erreur sauvegarde réservation:', error);
        showToast('Erreur lors de la sauvegarde', 'error');
    }
}

async function editReservation(id) {
    // TODO: Implémenter l'édition
    showToast('Fonctionnalité en cours de développement', 'info');
}

async function deleteReservation(id) {
    if (!confirm('Supprimer cette réservation ?')) return;
    
    try {
        const { error } = await window.supabaseClient
            .from('reservations')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        
        showToast('✅ Réservation supprimée', 'success');
        await loadReservations();
        
    } catch (error) {
        console.error('❌ Erreur suppression réservation:', error);
        showToast('Erreur lors de la suppression', 'error');
    }
}

// ==========================================
// SECTION 4 : TABLEAU GÎTES DE FRANCE
// ==========================================

async function toggleTableauGDF() {
    const isActive = document.getElementById('toggle-tableau-gdf').checked;
    const container = document.getElementById('tableau-gdf-container');
    
    if (isActive) {
        container.style.display = 'block';
        await generateTableauGDF();
    } else {
        container.style.display = 'none';
    }
    
    await saveConfiguration();
}

async function generateTableauGDF() {
    const table = document.getElementById('table-gdf');
    if (!table) return;
    
    // Générer l'en-tête
    let html = `
        <thead>
            <tr>
                <th>Arrivée</th>
                <th>1 nuit</th>
                <th>2 nuits</th>
                <th>3 nuits</th>
                <th>4 nuits</th>
                <th>5 nuits</th>
                <th>6 nuits</th>
                <th>7 nuits</th>
                <th>nuit supp</th>
            </tr>
        </thead>
        <tbody>
    `;
    
    // Générer les lignes pour chaque jour du mois
    const lastDay = new Date(currentYearReservations, currentMonthReservations + 1, 0).getDate();
    
    for (let day = 1; day <= lastDay; day++) {
        const dateObj = new Date(currentYearReservations, currentMonthReservations, day);
        const dateStr = dateObj.toISOString().split('T')[0];
        const dayName = dateObj.toLocaleDateString('fr-FR', { weekday: 'short' });
        
        html += `<tr><td style="font-weight: 600;">${dayName} ${dateObj.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}</td>`;
        
        // Calculer le tarif pour chaque durée
        for (let nights = 1; nights <= 8; nights++) {
            const dateFin = new Date(dateObj);
            dateFin.setDate(dateFin.getDate() + nights);
            const dateFinStr = dateFin.toISOString().split('T')[0];
            
            // Vérifier si la période est disponible
            const isReserved = reservationsCache.some(r => 
                (dateStr >= r.check_in && dateStr < r.check_out) ||
                (dateFinStr > r.check_in && dateFinStr <= r.check_out)
            );
            
            if (isReserved) {
                html += `<td class="cell-reserved">-</td>`;
            } else {
                const tarif = calculateTarifForDuration(dateStr, dateFinStr, nights);
                html += `<td class="cell-available">${Math.round(tarif)}</td>`;
            }
        }
        
        html += '</tr>';
    }
    
    html += '</tbody>';
    table.innerHTML = html;
}

function exportTableauGDF() {
    try {
        const table = document.getElementById('table-gdf');
        const ws = XLSX.utils.table_to_sheet(table);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Tarifs GDF');
        
        const date = new Date(currentYearReservations, currentMonthReservations);
        const monthName = date.toLocaleDateString('fr-FR', { month: 'long' });
        const fileName = `Tarifs_GDF_${monthName}_${currentYearReservations}.xlsx`;
        
        XLSX.writeFile(wb, fileName);
        showToast('✅ Export Excel réussi', 'success');
        
    } catch (error) {
        console.error('❌ Erreur export:', error);
        showToast('Erreur lors de l\'export', 'error');
    }
}

// ==========================================
// EXPORTS GLOBAUX
// ==========================================

function exportCalendrierComplet() {
    try {
        // Créer un workbook
        const wb = XLSX.utils.book_new();
        
        // Feuille 1 : Tarifs
        const tarifsData = tarifsCache.map(t => ({
            'Date': t.date,
            'Prix/nuit (€)': t.prix_nuit,
            'Créé le': new Date(t.created_at).toLocaleDateString('fr-FR'),
            'Modifié le': new Date(t.updated_at).toLocaleDateString('fr-FR')
        }));
        const wsTarifs = XLSX.utils.json_to_sheet(tarifsData);
        XLSX.utils.book_append_sheet(wb, wsTarifs, 'Tarifs');
        
        // Feuille 2 : Réservations
        const resaData = reservationsCache.map(r => ({
            'Check-in': r.check_in,
            'Check-out': r.check_out,
            'Client': r.client_name,
            'Téléphone': r.telephone,
            'Email': r.client_email,
            'Personnes': r.nb_personnes,
            'Plateforme': r.plateforme,
            'Montant (€)': r.montant,
            'Acompte (€)': r.acompte
        }));
        const wsResa = XLSX.utils.json_to_sheet(resaData);
        XLSX.utils.book_append_sheet(wb, wsResa, 'Réservations');
        
        // Feuille 3 : Règles
        const reglesData = [{
            'Type grille': reglesCache?.grille_duree?.type || '-',
            '1 nuit': reglesCache?.grille_duree?.nuit_1 || '-',
            '2 nuits': reglesCache?.grille_duree?.nuit_2 || '-',
            '3 nuits': reglesCache?.grille_duree?.nuit_3 || '-',
            '4 nuits': reglesCache?.grille_duree?.nuit_4 || '-',
            '5 nuits': reglesCache?.grille_duree?.nuit_5 || '-',
            '6 nuits': reglesCache?.grille_duree?.nuit_6 || '-',
            '7 nuits': reglesCache?.grille_duree?.nuit_7 || '-',
            'Nuit supp': reglesCache?.grille_duree?.nuit_supp || '-'
        }];
        const wsRegles = XLSX.utils.json_to_sheet(reglesData);
        XLSX.utils.book_append_sheet(wb, wsRegles, 'Règles tarifaires');
        
        const fileName = `Calendrier_Complet_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(wb, fileName);
        
        showToast('✅ Export complet réussi', 'success');
        
    } catch (error) {
        console.error('❌ Erreur export:', error);
        showToast('Erreur lors de l\'export', 'error');
    }
}

function exportReservationsListe() {
    try {
        const resaData = reservationsCache.map(r => ({
            'Check-in': r.check_in,
            'Check-out': r.check_out,
            'Nuits': calculateNights(r.check_in, r.check_out),
            'Client': r.client_name,
            'Téléphone': r.telephone,
            'Email': r.client_email,
            'Personnes': r.nb_personnes,
            'Plateforme': r.plateforme,
            'Montant (€)': r.montant,
            'Acompte (€)': r.acompte,
            'Reste dû (€)': (r.montant || 0) - (r.acompte || 0),
            'Statut': r.status
        }));
        
        const ws = XLSX.utils.json_to_sheet(resaData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Réservations');
        
        const date = new Date(currentYearReservations, currentMonthReservations);
        const monthName = date.toLocaleDateString('fr-FR', { month: 'long' });
        const fileName = `Reservations_${monthName}_${currentYearReservations}.xlsx`;
        
        XLSX.writeFile(wb, fileName);
        showToast('✅ Export réservations réussi', 'success');
        
    } catch (error) {
        console.error('❌ Erreur export:', error);
        showToast('Erreur lors de l\'export', 'error');
    }
}

// ==========================================
// CONFIGURATION
// ==========================================

async function loadConfiguration() {
    // Configuration désactivée : utilise localStorage uniquement
    // La table configuration_calendrier génère des erreurs 404
}

async function saveConfiguration() {
    // Configuration désactivée : utilise localStorage uniquement
}

// ==========================================
// HELPERS
// ==========================================

// Architecture simplifiée : pas besoin de getUserOrganizationId()
// RLS filtre automatiquement par owner_user_id = auth.uid()

async function loadAllData() {
    try {
        await Promise.all([
            loadTarifsBase(),
            loadRegles(),
            loadReservations()
        ]);
    } catch (error) {
        console.error('❌ Erreur chargement données:', error);
    }
}

function toggleAccordion(sectionId) {
    const content = document.getElementById(sectionId);
    const header = content.previousElementSibling;
    
    content.classList.toggle('active');
    header.classList.toggle('active');
}

// ==========================================
// RENDU DE L'ONGLET DANS INDEX.HTML
// ==========================================

function renderCalendrierTarifsTab() {
    // renderCalendrierTarifsTab
    const container = document.getElementById('tab-calendrier-tarifs');
    if (!container) {
        console.error('❌ Conteneur tab-calendrier-tarifs introuvable !');
        return;
    }
    // Conteneur trouvé
    
    container.innerHTML = `
        <style>
            /* 💥 Style Neo-Brutalism - Palette Rouge unifiée */
            :root {
                --cal-header-config: #FF6B6B;
                --cal-header-rules: #EE5A6F;
                --cal-state-defined: #FFA5A5;
                --cal-state-selected: #FFD6D6;
                --cal-state-empty: #FFFFFF;
                --cal-state-disabled: #F5E6E6;
                --cal-btn-add: #C92A2A;
            }
            
            #tab-calendrier-tarifs .sticky-selector {
                position: sticky;
                top: 80px;
                z-index: 100;
                background: var(--bg-page);
                padding: 20px;
                border-bottom: 3px solid #2D3436;
                margin-bottom: 30px;
                display: flex;
                flex-wrap: wrap;
                gap: 15px;
                align-items: center;
            }
            
            #tab-calendrier-tarifs .custom-select {
                padding: 12px 20px;
                font-weight: 700;
                border: 2px solid #2D3436;
                border-radius: 12px;
                background: white;
                color: #2D3436;
                box-shadow: 4px 4px 0 #2D3436;
                cursor: pointer;
                font-size: 1rem;
                min-width: 250px;
                transition: all 0.1s;
            }
            
            #tab-calendrier-tarifs .custom-select:hover {
                transform: translate(-2px, -2px);
                box-shadow: 6px 6px 0 #2D3436;
            }
            
            #tab-calendrier-tarifs .accordion-section {
                margin-bottom: 30px;
                background: white;
                border: 2px solid #2D3436;
                border-radius: 16px;
                box-shadow: 6px 6px 0 #2D3436;
                overflow: hidden;
            }
            
            #tab-calendrier-tarifs .accordion-header {
                width: 100%;
                padding: 20px 25px;
                border: none;
                border-bottom: 2px solid #2D3436;
                display: flex;
                align-items: center;
                gap: 15px;
                font-size: 1.2rem;
                font-weight: 900;
                text-transform: uppercase;
                color: #2D3436;
                cursor: pointer;
                transition: all 0.1s;
            }
            
            #tab-calendrier-tarifs .accordion-header[data-section="config"] {
                background-color: var(--cal-header-config);
            }
            
            #tab-calendrier-tarifs .accordion-header[data-section="rules"] {
                background-color: var(--cal-header-rules);
            }
            
            #tab-calendrier-tarifs .accordion-header:hover {
                transform: translate(-2px, -2px);
            }
            
            #tab-calendrier-tarifs .accordion-icon {
                margin-left: auto;
                transition: transform 0.2s;
                font-size: 1.5rem;
                font-weight: 900;
            }
            
            #tab-calendrier-tarifs .accordion-header.active .accordion-icon {
                transform: rotate(180deg);
            }
            
            #tab-calendrier-tarifs .accordion-content {
                padding: 30px;
                display: none;
                background: #F8F9FA;
            }
            
            #tab-calendrier-tarifs .accordion-content.active {
                display: block;
            }
            
            #tab-calendrier-tarifs .calendar-controls {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 20px;
                margin-bottom: 30px;
                padding: 20px;
                background: white;
                border: 2px solid #2D3436;
                border-radius: 12px;
                box-shadow: 4px 4px 0 #2D3436;
            }
            
            #tab-calendrier-tarifs .calendar-controls button {
                padding: 12px 24px;
                background: #2D3436;
                color: white;
                border: 2px solid #2D3436;
                border-radius: 10px;
                font-weight: 900;
                font-size: 1.2rem;
                cursor: pointer;
                transition: all 0.1s;
                text-transform: uppercase;
            }
            
            #tab-calendrier-tarifs .calendar-controls button:hover {
                transform: translate(-2px, -2px);
                box-shadow: 4px 4px 0 #2D3436;
            }
            
            #tab-calendrier-tarifs .calendar-controls h3 {
                font-size: 1.4rem;
                color: #2D3436;
                font-weight: 900;
                min-width: 250px;
                text-align: center;
                text-transform: uppercase;
            }
            
            #tab-calendrier-tarifs .calendar-grid-tarifs,
            #tab-calendrier-tarifs .calendar-grid-reservations {
                display: grid;
                grid-template-columns: repeat(7, 1fr);
                gap: 15px;
                margin-top: 20px;
            }
            
            #tab-calendrier-tarifs .day-header {
                padding: 15px;
                text-align: center;
                font-weight: 900;
                text-transform: uppercase;
                font-size: 0.85rem;
                color: #2D3436;
                background: #DFE6E9;
                border: 2px solid #2D3436;
                border-radius: 10px;
                box-shadow: 3px 3px 0 #2D3436;
            }
            
            #tab-calendrier-tarifs .day-card {
                min-height: 100px;
                padding: 15px;
                background: var(--cal-state-empty);
                border: 2px solid #2D3436;
                border-radius: 12px;
                box-shadow: 4px 4px 0 #2D3436;
                cursor: pointer;
                transition: all 0.1s;
                position: relative;
                display: flex;
                flex-direction: column;
            }
            
            #tab-calendrier-tarifs .day-card:hover {
                transform: translate(-2px, -2px);
                box-shadow: 6px 6px 0 #2D3436;
            }
            
            #tab-calendrier-tarifs .day-card.has-tarif {
                background-color: var(--cal-state-defined);
            }
            
            #tab-calendrier-tarifs .day-card.selected {
                background-color: var(--cal-state-selected);
                box-shadow: 6px 6px 0 #2D3436;
            }
            
            #tab-calendrier-tarifs .day-card.other-month {
                background-color: var(--cal-state-disabled);
                opacity: 0.5;
            }
            
            #tab-calendrier-tarifs .day-number {
                font-size: 1.5rem;
                font-weight: 900;
                color: #2D3436;
                margin-bottom: 5px;
            }
            
            #tab-calendrier-tarifs .day-price {
                color: #2D3436;
                font-weight: 900;
                font-size: 0.95rem;
                margin-top: auto;
            }
            
            #tab-calendrier-tarifs .reservation-overlay {
                position: absolute;
                inset: 0;
                background: rgba(45, 52, 54, 0.9);
                border-radius: 10px;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                color: white;
                padding: 10px;
                text-align: center;
                font-weight: 900;
            }
            
            #tab-calendrier-tarifs .badge-platform {
                position: absolute;
                top: 5px;
                right: 5px;
                padding: 4px 8px;
                border: 2px solid #2D3436;
                border-radius: 6px;
                font-size: 0.65rem;
                font-weight: 900;
                background: white;
                color: #2D3436;
            }
            
            #tab-calendrier-tarifs .btn-neo.btn-save {
                background-color: var(--cal-btn-add);
                color: white;
                border: 2px solid #2D3436;
                border-radius: 12px;
                padding: 15px 30px;
                font-weight: 900;
                font-size: 1rem;
                text-transform: uppercase;
                cursor: pointer;
                box-shadow: 4px 4px 0 #2D3436;
                transition: all 0.1s;
            }
            
            #tab-calendrier-tarifs .btn-neo.btn-save:hover {
                transform: translate(-2px, -2px);
                box-shadow: 6px 6px 0 #2D3436;
            }
                color: white;
                border: 1px solid rgba(0,0,0,0.2);
            }
            
            #tab-calendrier-tarifs .rules-card {
                background: var(--white);
                border: 2px solid var(--stroke);
                border-radius: 12px;
                padding: 20px;
                box-shadow: 4px 4px 0 var(--stroke);
                margin-bottom: 20px;
            }
            
            #tab-calendrier-tarifs .input-neo {
                padding: 10px 15px;
                border: 2px solid var(--stroke);
                border-radius: 8px;
                font-weight: 600;
                width: 100%;
                box-shadow: 2px 2px 0 var(--stroke);
            }
            
            #tab-calendrier-tarifs .toggle-switch {
                position: relative;
                display: inline-block;
                width: 60px;
                height: 34px;
            }
            
            #tab-calendrier-tarifs .toggle-switch input {
                opacity: 0;
                width: 0;
                height: 0;
            }
            
            #tab-calendrier-tarifs .toggle-slider {
                position: absolute;
                cursor: pointer;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background-color: #ccc;
                transition: .4s;
                border-radius: 34px;
                border: 2px solid var(--stroke);
            }
            
            #tab-calendrier-tarifs .toggle-slider:before {
                position: absolute;
                content: "";
                height: 26px;
                width: 26px;
                left: 2px;
                bottom: 2px;
                background-color: white;
                transition: .4s;
                border-radius: 50%;
            }
            
            #tab-calendrier-tarifs input:checked + .toggle-slider {
                background-color: var(--c-green);
            }
            
            #tab-calendrier-tarifs input:checked + .toggle-slider:before {
                transform: translateX(26px);
            }
            
            #tab-calendrier-tarifs .modal-neo {
                position: fixed;
                inset: 0;
                background: rgba(0,0,0,0.7);
                display: none;
                align-items: center;
                justify-content: center;
                z-index: 10000;
            }
            
            #tab-calendrier-tarifs .modal-neo.active {
                display: flex;
            }
            
            #tab-calendrier-tarifs .modal-content {
                background: var(--white);
                border: 3px solid var(--stroke);
                border-radius: 12px;
                box-shadow: 8px 8px 0 var(--stroke);
                padding: 30px;
                max-width: 500px;
                width: 90%;
                position: relative;
                max-height: 90vh;
                overflow-y: auto;
            }
            
            #tab-calendrier-tarifs .modal-close {
                position: absolute;
                top: 10px;
                right: 10px;
                background: var(--red-accent);
                border: 2px solid var(--stroke);
                border-radius: 50%;
                width: 35px;
                height: 35px;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                font-weight: 700;
                font-size: 1.2rem;
                color: white;
            }
            
            #tab-calendrier-tarifs .table-gdf {
                width: 100%;
                border-collapse: separate;
                border-spacing: 0;
                border: 2px solid var(--stroke);
                box-shadow: 4px 4px 0 var(--stroke);
                background: var(--white);
                margin-top: 20px;
            }
            
            #tab-calendrier-tarifs .table-gdf th,
            #tab-calendrier-tarifs .table-gdf td {
                border: 2px solid var(--stroke);
                padding: 10px;
                text-align: center;
                font-weight: 600;
            }
            
            #tab-calendrier-tarifs .table-gdf thead tr {
                background: var(--c-blue);
            }
            
            #tab-calendrier-tarifs .table-gdf tbody tr:nth-child(even) {
                background: #f8f9fa;
            }
            
            #tab-calendrier-tarifs .table-gdf .cell-available {
                background: var(--c-green);
            }
            
            #tab-calendrier-tarifs .table-gdf .cell-reserved {
                background: #ddd;
                color: #999;
            }
            
            #tab-calendrier-tarifs .legend {
                margin-top: 20px;
                display: flex;
                gap: 20px;
                flex-wrap: wrap;
            }
            
            #tab-calendrier-tarifs .legend-item {
                display: flex;
                align-items: center;
                gap: 10px;
            }
            
            #tab-calendrier-tarifs .legend-box {
                width: 30px;
                height: 30px;
                border: 2px solid var(--stroke);
                border-radius: 6px;
            }
            
            #tab-calendrier-tarifs .promo-card {
                padding: 15px;
                border: 2px solid var(--stroke);
                border-radius: 10px;
                box-shadow: 3px 3px 0 var(--stroke);
            }
            
            #tab-calendrier-tarifs .promo-card input[type="number"] {
                margin-top: 10px;
                padding: 8px;
                border: 2px solid var(--stroke);
                border-radius: 6px;
                width: 100%;
            }
            
            #tab-calendrier-tarifs .reservation-card-item {
                background: var(--white);
                border: 2px solid var(--stroke);
                border-radius: 12px;
                padding: 20px;
                margin-bottom: 15px;
                box-shadow: 4px 4px 0 var(--stroke);
            }
            
            @media (max-width: 768px) {
                #tab-calendrier-tarifs .calendar-grid-tarifs,
                #tab-calendrier-tarifs .calendar-grid-reservations {
                    grid-template-columns: repeat(4, 1fr);
                }
                
                #tab-calendrier-tarifs .sticky-selector {
                    justify-content: center;
                }
                
                #tab-calendrier-tarifs .custom-select {
                    width: 100%;
                }
            }
        </style>
        
        <!-- Contenu de l'onglet -->
        <div style="max-width: 1400px; margin: 0 auto; padding: 20px;">
            <!-- Sélecteur de gîte + boutons export -->
            <div class="sticky-selector">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <span style="font-size: 1.5rem;">🏡</span>
                    <select id="gite-selector" class="custom-select">
                        <option value="">Chargement...</option>
                    </select>
                </div>
                <button class="btn-neo btn-save" onclick="exportCalendrierComplet()">
                    📊 Exporter Calendrier Complet
                </button>
                <button class="btn-neo btn-valid" onclick="exportReservationsListe()">
                    📋 Exporter Réservations
                </button>
            </div>
            
            <!-- Section 1 : Calendrier & Tarifs de Base -->
            <div class="accordion-section">
                <div id="tarifs-base" class="accordion-content active">
                    <div class="calendar-controls">
                        <button class="btn-neo" onclick="previousMonthTarifs()">◀ Précédent</button>
                        <h3 id="current-month-tarifs" style="margin: 0 20px; text-transform: uppercase;">Janvier 2026</h3>
                        <button class="btn-neo" onclick="nextMonthTarifs()">Suivant ▶</button>
                    </div>
                    
                    <div id="calendar-grid-tarifs" class="calendar-grid-tarifs"></div>
                    
                    <div class="legend">
                        <div class="legend-item">
                            <div class="legend-box" style="background: var(--c-green);"></div>
                            <span>Tarif défini</span>
                        </div>
                        <div class="legend-item">
                            <div class="legend-box" style="background: white;"></div>
                            <span>Sans tarif</span>
                        </div>
                        <div class="legend-item">
                            <div class="legend-box" style="background: var(--c-yellow);"></div>
                            <span>Sélectionné</span>
                        </div>
                    </div>
                    
                    <div style="margin-top: 20px; padding: 15px; background: #e3f2fd; border: 2px solid var(--stroke); border-radius: 10px;">
                        <p style="margin: 0 0 8px 0; font-weight: 700; font-size: 15px;">💡 Comment utiliser :</p>
                        <ul style="margin: 0; padding-left: 20px; line-height: 1.8;">
                            <li><strong>Clic simple</strong> sur un jour → Définir le tarif pour ce jour</li>
                            <li><strong>Glisser avec la souris</strong> → Sélectionner plusieurs jours en continu</li>
                            <li><strong>Relâcher</strong> → Le modal s'ouvre pour appliquer le tarif à tous les jours sélectionnés</li>
                        </ul>
                    </div>
                </div>
            </div>
            
            <!-- Section 2 : Règles Tarifaires -->
            <div class="accordion-section">
                <button class="accordion-header active" data-section="rules" onclick="toggleAccordionTarifs('regles-tarifaires')">
                    <span style="font-size: 1.5rem;">⚙️</span>
                    <span>Règles Tarifaires Dynamiques</span>
                    <span class="accordion-icon">▼</span>
                </button>
                <div id="regles-tarifaires" class="accordion-content active">
                    
                    <!-- A. Grille tarifaire selon durée -->
                    <div class="rules-card">
                        <h4 style="font-weight: 700; margin-bottom: 15px; font-size: 1.2rem;">📊 Tarification selon la durée</h4>
                        
                        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 15px;">
                            <label class="toggle-switch">
                                <input type="checkbox" id="type-tarif-toggle" onchange="toggleTarifType()">
                                <span class="toggle-slider"></span>
                            </label>
                            <span id="type-tarif-label" style="font-weight: 600;">Pourcentage du tarif de base</span>
                        </div>
                        
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px;">
                            <div><label style="font-weight: 600;">1 nuit</label><input type="number" id="nuit-1" class="input-neo" value="100" /></div>
                            <div><label style="font-weight: 600;">2 nuits</label><input type="number" id="nuit-2" class="input-neo" value="95" /></div>
                            <div><label style="font-weight: 600;">3 nuits</label><input type="number" id="nuit-3" class="input-neo" value="90" /></div>
                            <div><label style="font-weight: 600;">4 nuits</label><input type="number" id="nuit-4" class="input-neo" value="90" /></div>
                            <div><label style="font-weight: 600;">5 nuits</label><input type="number" id="nuit-5" class="input-neo" value="85" /></div>
                            <div><label style="font-weight: 600;">6 nuits</label><input type="number" id="nuit-6" class="input-neo" value="85" /></div>
                            <div><label style="font-weight: 600;">7 nuits</label><input type="number" id="nuit-7" class="input-neo" value="80" /></div>
                            <div><label style="font-weight: 600;">Nuit supp.</label><input type="number" id="nuit-supp" class="input-neo" value="80" /></div>
                        </div>
                    </div>
                    
                    <!-- B. Promotions -->
                    <div class="rules-card">
                        <h4 style="font-weight: 700; margin-bottom: 15px; font-size: 1.2rem;">🎁 Promotions Automatiques</h4>
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 15px;">
                            <div class="promo-card" style="background: var(--c-green);">
                                <div style="display: flex; align-items: center; gap: 10px;">
                                    <label class="toggle-switch"><input type="checkbox" id="promo-long-sejour"><span class="toggle-slider"></span></label>
                                    <span style="font-weight: 700;">Long Séjour</span>
                                </div>
                                <input type="number" id="long-sejour-pct" placeholder="% réduction" style="margin-top: 10px;" />
                                <input type="number" id="long-sejour-nuits" placeholder="À partir de X nuits" style="margin-top: 10px;" />
                            </div>
                            <div class="promo-card" style="background: var(--c-yellow);">
                                <div style="display: flex; align-items: center; gap: 10px;">
                                    <label class="toggle-switch"><input type="checkbox" id="promo-last-minute"><span class="toggle-slider"></span></label>
                                    <span style="font-weight: 700;">Last Minute</span>
                                </div>
                                <input type="number" id="last-minute-pct" placeholder="% réduction" style="margin-top: 10px;" />
                                <input type="number" id="last-minute-jours" placeholder="Jours avant arrivée" style="margin-top: 10px;" />
                            </div>
                            <div class="promo-card" style="background: var(--c-blue);">
                                <div style="display: flex; align-items: center; gap: 10px;">
                                    <label class="toggle-switch"><input type="checkbox" id="promo-early-booking"><span class="toggle-slider"></span></label>
                                    <span style="font-weight: 700;">Early Booking</span>
                                </div>
                                <input type="number" id="early-booking-pct" placeholder="% réduction" style="margin-top: 10px;" />
                                <input type="number" id="early-booking-jours" placeholder="Jours d'avance" style="margin-top: 10px;" />
                            </div>
                        </div>
                    </div>
                    
                    <!-- C. Durée minimale -->
                    <div class="rules-card">
                        <h4 style="font-weight: 700; margin-bottom: 15px; font-size: 1.2rem;">⏱️ Durée Minimale de Séjour</h4>
                        <div style="margin-bottom: 15px;">
                            <label style="font-weight: 600;">Durée minimale par défaut (toute l'année)</label>
                            <input type="number" id="duree-min-defaut" class="input-neo" value="2" />
                        </div>
                        <h5 style="font-weight: 600; margin-top: 20px;">Périodes spécifiques :</h5>
                        <div id="periodes-list" style="margin-top: 10px;"></div>
                        <button class="btn-neo btn-save" onclick="addPeriodeDureeMin()" style="margin-top: 10px;">+ Ajouter une période</button>
                    </div>
                    
                    <button class="btn-neo btn-save" style="font-size: 1.1rem; margin-top: 20px; width: 100%;" onclick="saveRegles()">
                        💾 SAUVEGARDER LES RÈGLES TARIFAIRES
                    </button>
                </div>
            </div>
            
            <!-- Section 3 : Calendrier Réservations -->
            <div style="margin-top: 40px;">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 30px; flex-wrap: wrap; gap: 15px;">
                    <div class="calendar-controls" style="margin: 0;">
                        <button class="btn-neo" onclick="previousMonthReservations()">◀</button>
                        <h2 id="month-title-reservations" style="margin: 0 20px; text-transform: uppercase;">Janvier 2026</h2>
                        <button class="btn-neo" onclick="nextMonthReservations()">▶</button>
                    </div>
                    <button class="btn-neo btn-save" onclick="openAddReservationModal()">➕ AJOUTER UNE RÉSERVATION</button>
                </div>
                <div id="calendar-grid-reservations" class="calendar-grid-reservations"></div>
                
                <!-- Liste des réservations -->
                <div style="margin-top: 40px;">
                    <h3 style="font-weight: 700; text-transform: uppercase; margin-bottom: 20px;">📋 Réservations du mois</h3>
                    <div style="display: flex; gap: 15px; margin-bottom: 20px; flex-wrap: wrap;">
                        <select id="filter-origine-tarifs" class="custom-select" onchange="filterReservationsList()">
                            <option value="">Toutes les origines</option>
                            <option value="Airbnb">Airbnb</option>
                            <option value="Booking">Booking.com</option>
                            <option value="Gîtes de France">Gîtes de France</option>
                            <option value="Direct">Direct</option>
                            <option value="Abritel">Abritel</option>
                        </select>
                    </div>
                    <div id="reservations-list-container-tarifs"></div>
                </div>
            </div>
            
            <!-- Section 4 : Export Gîtes de France -->
            <div class="accordion-section" style="margin-top: 40px;">
                <button class="accordion-header" onclick="toggleAccordionTarifs('export-gdf')">
                    <span style="font-size: 1.5rem;">📊</span>
                    <span>Tableau Gîtes de France</span>
                    <span class="accordion-icon">▼</span>
                </button>
                <div id="export-gdf" class="accordion-content">
                    <div style="margin-bottom: 20px;">
                        <label class="toggle-switch">
                            <input type="checkbox" id="toggle-tableau-gdf" onchange="toggleTableauGDF()">
                            <span class="toggle-slider"></span>
                        </label>
                        <span style="font-weight: 600; margin-left: 10px;">Afficher en permanence le tableau format Gîtes de France</span>
                    </div>
                    <div id="tableau-gdf-container" style="display: none;">
                        <div style="overflow-x: auto;">
                            <table class="table-gdf" id="table-gdf"></table>
                        </div>
                        <button class="btn-neo btn-save" style="margin-top: 20px;" onclick="exportTableauGDF()">📥 EXPORTER EN EXCEL</button>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Modals -->
        <div id="modal-tarif-ct" class="modal-neo">
            <div class="modal-content">
                <div class="modal-close" onclick="closeModalTarif()">×</div>
                <h3 style="font-weight: 700; margin-bottom: 20px;">💰 Définir le tarif</h3>
                <p id="modal-tarif-date" style="margin-bottom: 20px; font-weight: 600;"></p>
                <label style="font-weight: 600;">Prix de la nuit (€)</label>
                <input type="number" id="modal-tarif-prix" class="input-neo" placeholder="Exemple : 250" step="0.01" style="margin-top: 10px;" />
                <div style="display: flex; gap: 10px; margin-top: 20px;">
                    <button class="btn-neo btn-save" onclick="saveTarifFromModal()" style="flex: 1;">💾 Enregistrer</button>
                    <button class="btn-neo" onclick="closeModalTarif()" style="flex: 1;">Annuler</button>
                </div>
            </div>
        </div>
        
        <div id="modal-reservation-ct" class="modal-neo">
            <div class="modal-content" style="max-width: 600px;">
                <div class="modal-close" onclick="closeModalReservation()">×</div>
                <h3 style="font-weight: 700; margin-bottom: 20px;">➕ Ajouter une réservation</h3>
                <div style="display: grid; gap: 15px;">
                    <div><label style="font-weight: 600;">Date d'arrivée</label><input type="date" id="resa-date-arrivee" class="input-neo" onchange="calculateTarifReservation()" /></div>
                    <div><label style="font-weight: 600;">Date de départ</label><input type="date" id="resa-date-depart" class="input-neo" onchange="calculateTarifReservation()" /></div>
                    <div><label style="font-weight: 600;">Nom du client</label><input type="text" id="resa-client-nom" class="input-neo" placeholder="Nom complet" /></div>
                    <div><label style="font-weight: 600;">Téléphone</label><input type="tel" id="resa-client-tel" class="input-neo" placeholder="06 12 34 56 78" /></div>
                    <div><label style="font-weight: 600;">Email</label><input type="email" id="resa-client-email" class="input-neo" placeholder="email@exemple.fr" /></div>
                    <div><label style="font-weight: 600;">Nombre de personnes</label><input type="number" id="resa-nb-personnes" class="input-neo" value="2" /></div>
                    <div><label style="font-weight: 600;">Origine</label><select id="resa-origine" class="custom-select"><option value="Airbnb">Airbnb</option><option value="Booking">Booking.com</option><option value="Gîtes de France">Gîtes de France</option><option value="Direct">Direct</option><option value="Abritel">Abritel</option><option value="Autre">Autre</option></select></div>
                    <div><label style="font-weight: 600;">Montant total</label><input type="number" id="resa-montant" class="input-neo" step="0.01" /><p id="tarif-calcule-info" style="margin-top: 5px; font-size: 0.9rem; color: var(--c-blue);"></p></div>
                    <div><label style="font-weight: 600;">Acompte versé</label><input type="number" id="resa-acompte" class="input-neo" value="0" step="0.01" /></div>
                </div>
                <div style="display: flex; gap: 10px; margin-top: 20px;">
                    <button class="btn-neo btn-save" onclick="saveReservationFromModal()" style="flex: 1;">💾 Confirmer la réservation</button>
                    <button class="btn-neo" onclick="closeModalReservation()" style="flex: 1;">Annuler</button>
                </div>
            </div>
        </div>
    `;
    
    // Initialiser après le rendu du HTML
    setTimeout(async () => {
        // Ne charger que si les éléments existent
        if (document.getElementById('gite-selector')) {
            await initCalendrierTarifs();
        }
    }, 100);
}

// Fonction pour basculer les accordéons (nom unique pour éviter les conflits)
function toggleAccordionTarifs(sectionId) {
    const content = document.getElementById(sectionId);
    if (!content) return;
    
    const header = content.previousElementSibling;
    
    content.classList.toggle('active');
    header.classList.toggle('active');
}

// ==========================================
// LANCEMENT
// ==========================================

// Ne pas lancer automatiquement au chargement de la page
// L'initialisation se fera via renderCalendrierTarifsTab() quand l'onglet est activé
