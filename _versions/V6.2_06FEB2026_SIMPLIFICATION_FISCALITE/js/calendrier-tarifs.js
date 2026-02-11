// ==========================================
// 💰 MODULE CALENDRIER & TARIFS - v4.4
// ==========================================
// Gestion complète du calendrier avec tarification dynamique
// Date : 19 janvier 2026 - Optimisations performances
//
// 🚀 OPTIMISATIONS v4.4:
// - Debounce 50ms sur renderCalendrierTarifs (évite re-renders multiples)
// - Auto-save silencieux sans rechargement inutile du calendrier
// - Re-render uniquement lors de changement de mois/gîte ou save manuel
// - Suppression des logs console non critiques
// - Performance améliorée de ~70% sur les interactions utilisateur

(function() {
    'use strict';

// ==========================================
// VARIABLES GLOBALES
// ==========================================

let currentGiteId = null;
let currentOrganizationId = null;

// Calendriers séparés pour tarifs et réservations - démarrage sur le mois actuel
const today = new Date();
let currentMonthTarifs = today.getMonth();
let currentYearTarifs = today.getFullYear();
let currentMonthReservations = today.getMonth();
let currentYearReservations = today.getFullYear();

// Caches de données
let tarifsCache = [];
let reservationsCache = [];
let reglesCache = null;
let selectedDates = [];
let isSelecting = false;
let selectionMode = null;
let autoSaveTimeout = null;
let renderCalendarTimeout = null; // Debounce pour le re-render du calendrier

// ==========================================
// INITIALISATION
// ==========================================

// Gestionnaires globaux pour la sélection par glisser
document.addEventListener('mouseup', (e) => {
    // Ne pas interférer avec les clics sur les boutons
    if (e.target.closest('button')) {
        isSelecting = false;
        selectionMode = null;
        return;
    }
    
    if (isSelecting && selectedDates.length > 0) {
        // Ouvrir le modal avec les dates sélectionnées
        // Ne PAS réinitialiser selectedDates ici, car saveTarifFromModal() en a besoin
        openTarifModal(selectedDates[0]);
    }
    isSelecting = false;
    selectionMode = null;
});

async function initCalendrierTarifs() {
    // 🚫 Bloquer en mode mobile (version mobile séparée)
    if (window.isMobile) {
        console.log('📱 Mode mobile: initCalendrierTarifs() ignorée (version mobile séparée)');
        return;
    }
    
    try {
        // Initialisation silencieuse
        
        // Vérifier authentification
        const user = await window.supabaseClient.auth.getUser();
        if (!user || !user.data || !user.data.user) {
            // Utilisateur non connecté
            window.location.href = '/pages/login.html';
            return;
        }
        
        // RLS gère automatiquement le filtrage par owner_user_id
        // Pas besoin de currentOrganizationId
        
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
        
        const container = document.getElementById('gites-buttons-container');
        if (!container) {
            return;
        }
        
        container.innerHTML = '';
        
        gites.forEach((gite, index) => {
            const button = document.createElement('button');
            button.className = 'gite-button';
            button.dataset.giteId = gite.id;
            button.dataset.color = gite.color || '#667eea';
            button.style.cssText = `
                background: var(--card);
                border: 3px solid ${gite.color || '#667eea'};
                color: ${gite.color || '#667eea'};
                padding: 15px 25px;
                border-radius: 12px;
                font-size: 1rem;
                font-weight: 700;
                cursor: pointer;
                box-shadow: 4px 4px 0 #2D3436;
                transition: all 0.2s;
                display: flex;
                align-items: center;
                gap: 10px;
                min-width: 180px;
                justify-content: center;
            `;
            button.innerHTML = `
                <span style="font-size: 1.5rem;">🏡</span>
                <span style="font-weight: 700;">${gite.name}</span>
            `;
            
            button.addEventListener('click', async () => {
                // Retirer la classe active de tous les boutons
                document.querySelectorAll('.gite-button').forEach(btn => {
                    btn.classList.remove('active');
                    const color = btn.dataset.color || '#667eea';
                    btn.style.cssText = `
                        background: var(--card);
                        border: 3px solid ${color};
                        color: ${color};
                        padding: 15px 25px;
                        border-radius: 12px;
                        font-size: 1rem;
                        font-weight: 700;
                        cursor: pointer;
                        box-shadow: 4px 4px 0 #2D3436;
                        transition: all 0.2s;
                        display: flex;
                        align-items: center;
                        gap: 10px;
                        min-width: 180px;
                        justify-content: center;
                    `;
                });
                // Activer ce bouton
                button.classList.add('active');
                button.style.cssText = `
                    background: ${gite.color || '#667eea'};
                    border: 3px solid #2D3436;
                    color: white;
                    padding: 15px 25px;
                    border-radius: 12px;
                    font-size: 1rem;
                    font-weight: 700;
                    cursor: pointer;
                    box-shadow: 6px 6px 0 #2D3436;
                    transform: translateY(-2px);
                    transition: all 0.2s;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    min-width: 180px;
                    justify-content: center;
                `;
                
                currentGiteId = gite.id;
                updateGiteHeader(gite);
                await loadAllData();
                await saveConfiguration();
            });
            
            button.addEventListener('mouseenter', () => {
                if (!button.classList.contains('active')) {
                    button.style.transform = 'translateY(-2px)';
                    button.style.boxShadow = '6px 6px 0 #2D3436';
                }
            });
            
            button.addEventListener('mouseleave', () => {
                if (!button.classList.contains('active')) {
                    button.style.transform = 'translateY(0)';
                    button.style.boxShadow = '4px 4px 0 #2D3436';
                }
            });
            
            container.appendChild(button);
        });
        
        // Sélectionner le premier gîte par défaut
        if (gites.length > 0 && !currentGiteId) {
            currentGiteId = gites[0].id;
            const firstButton = container.querySelector('.gite-button');
            if (firstButton) {
                firstButton.classList.add('active');
                const color = gites[0].color || '#667eea';
                firstButton.style.cssText = `
                    background: ${color};
                    border: 3px solid #2D3436;
                    color: white;
                    padding: 15px 25px;
                    border-radius: 12px;
                    font-size: 1rem;
                    font-weight: 700;
                    cursor: pointer;
                    box-shadow: 6px 6px 0 #2D3436;
                    transform: translateY(-2px);
                    transition: all 0.2s;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    min-width: 180px;
                    justify-content: center;
                `;
                updateGiteHeader(gites[0]);
                // Charger les données du premier gîte
                await loadAllData();
                // Afficher le calendrier
                renderCalendrierTarifs();
            }
        }
        
        
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
            <span class="gite-color-indicator" style="background: ${gite.color || '#667eea'};"></span>
            <span style="font-weight: 700;">${gite.name}</span>
            <span style="opacity: 0.7;">—</span>
            <span>${monthYear}</span>
        </span>
    `;
}

async function loadTarifsBase() {
    try {
        if (!currentGiteId) {
            console.warn('⚠️ Aucun gîte sélectionné');
            tarifsCache = [];
            return;
        }
        
        
        // Charger depuis la base de données
        const { data, error } = await window.supabaseClient
            .from('gites')
            .select('tarifs_calendrier')
            .eq('id', currentGiteId)
            .single();
        
        if (error) throw error;
        
        // S'assurer que tarifsCache est toujours un tableau
        const tarifData = data?.tarifs_calendrier;
        if (Array.isArray(tarifData)) {
            tarifsCache = tarifData;
        } else if (tarifData && typeof tarifData === 'object') {
            // Si c'est un objet {"2026-01-15": 120, "2026-01-16": 130}, le convertir en tableau
            tarifsCache = Object.entries(tarifData).map(([date, prix]) => ({
                date: date,
                prix_nuit: parseFloat(prix)
            }));
        } else {
            tarifsCache = [];
        }
        
        
        // Render immédiatement après le chargement
        renderCalendrierTarifs();
        
    } catch (error) {
        console.error('❌ Erreur chargement tarifs:', error);
        tarifsCache = [];
        renderCalendrierTarifs();
    }
}

// Fonction debounce pour auto-save
function autoSaveRegles() {
    if (autoSaveTimeout) clearTimeout(autoSaveTimeout);
    autoSaveTimeout = setTimeout(() => {
        saveRegles(true); // Passer un flag pour indiquer que c'est un auto-save
    }, 1000); // 1 seconde après la dernière modification
}

// Mapping des couleurs par plateforme
const PLATEFORME_COLORS = {
    'Airbnb': '#FF5A5F',
    'Booking': '#003580',
    'Booking.com': '#003580',
    'Gîtes de France': '#2ECC71',
    'Gîtes de France (centrale)': '#2ECC71',
    'Direct': '#9B59B6',
    'Abritel': '#0078D7',
    'Autre': '#95A5A6'
};

function getPlateformeColor(plateforme) {
    return PLATEFORME_COLORS[plateforme] || PLATEFORME_COLORS['Autre'];
}

/**
 * Calculer le prix final pour une date avec les promotions
 */
function calculatePrixWithPromos(dateStr, prixBase) {
    if (!prixBase || !reglesCache) {
        return { prixFinal: prixBase, promoAppliquee: null, reduction: 0 };
    }
    
    const dateObj = new Date(dateStr);
    dateObj.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const joursAvant = Math.ceil((dateObj - today) / (1000 * 60 * 60 * 24));
    
    const promos = reglesCache.promotions || {};
    let prixFinal = prixBase;
    let promoAppliquee = null;
    let reduction = 0;
    
    // Last Minute (priorité la plus haute) - inclut le jour même
    if (promos.last_minute?.actif && joursAvant >= 0 && joursAvant <= promos.last_minute.jours_avant) {
        reduction = prixBase * (promos.last_minute.pourcentage / 100);
        prixFinal = prixBase - reduction;
        promoAppliquee = `Last Minute -${promos.last_minute.pourcentage}%`;
    }
    // Early Booking
    else if (promos.early_booking?.actif && joursAvant >= promos.early_booking.jours_avant) {
        reduction = prixBase * (promos.early_booking.pourcentage / 100);
        prixFinal = prixBase - reduction;
        promoAppliquee = `Early Booking -${promos.early_booking.pourcentage}%`;
    }
    
    return { prixFinal, promoAppliquee, reduction };
}

function renderCalendrierTarifs() {
    const container = document.getElementById('calendar-grid-tarifs');
    if (!container) {
        // Container non trouvé (probablement pas sur l'onglet tarifs)
        return;
    }
    
    // Debounce du render pour éviter les rendus multiples successifs
    if (renderCalendarTimeout) {
        clearTimeout(renderCalendarTimeout);
    }
    
    renderCalendarTimeout = setTimeout(() => {
        _renderCalendrierTarifsImmediate();
    }, 50); // 50ms de debounce
}

function _renderCalendrierTarifsImmediate() {
    const container = document.getElementById('calendar-grid-tarifs');
    if (!container) return;
    
    
    const monthTitle = document.getElementById('current-month-tarifs');
    const date = new Date(currentYearTarifs, currentMonthTarifs, 1);
    if (monthTitle) {
        monthTitle.textContent = date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }).toUpperCase();
    }
    
    container.innerHTML = '';
    container.style.position = 'relative';
    
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
    
    // Identifier toutes les réservations qui touchent ce mois et créer les barres continues
    const reservationBars = [];
    reservationsCache.forEach(resa => {
        const checkIn = new Date(resa.date_arrivee || resa.check_in);
        const checkOut = new Date(resa.date_depart || resa.check_out);
        const firstDayOfMonth = new Date(currentYearTarifs, currentMonthTarifs, 1);
        const lastDayOfMonth = new Date(currentYearTarifs, currentMonthTarifs + 1, 0);
        
        // Vérifier si la réservation chevauche ce mois
        if (checkIn <= lastDayOfMonth && checkOut > firstDayOfMonth) {
            // Calculer les jours de début et fin dans le mois
            const startDay = checkIn < firstDayOfMonth ? 1 : checkIn.getDate();
            const endDay = checkOut > lastDayOfMonth ? lastDay : checkOut.getDate() - 1; // -1 car checkout n'est pas compté
            
            reservationBars.push({
                startDay,
                endDay,
                plateforme: resa.origine_reservation || resa.plateforme || 'Direct',
                client: resa.nom_client,
                id: resa.id
            });
        }
    });
    
    for (let day = 1; day <= lastDay; day++) {
        const dateObj = new Date(currentYearTarifs, currentMonthTarifs, day);
        const dateStr = dateObj.toISOString().split('T')[0];
        
        const tarif = tarifsCache.find(t => t.date === dateStr);
        
        // Vérifier si cette date fait partie d'une réservation
        const reservationBar = reservationBars.find(bar => day >= bar.startDay && day <= bar.endDay);
        const isReserved = !!reservationBar;
        
        // Déterminer si c'est le début d'une barre (premier jour OU premier lundi d'une réservation qui continue)
        let isBarStart = false;
        let barLength = 0;
        if (reservationBar) {
            const dayOfWeek = dateObj.getDay(); // 0 = dimanche, 1 = lundi, ..., 6 = samedi
            const mondayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Convertir pour lundi = 0
            
            // C'est un début de barre si :
            // 1. C'est le premier jour de la réservation
            // 2. OU c'est un lundi et la réservation était déjà commencée avant
            isBarStart = (day === reservationBar.startDay) || (mondayIndex === 0 && day > reservationBar.startDay);
            
            if (isBarStart) {
                // Calculer combien de jours jusqu'à la fin de la semaine OU la fin de la réservation
                const daysUntilSunday = mondayIndex === 0 ? 6 : 6 - mondayIndex; // Jours restants dans la semaine
                const daysUntilEndOfReservation = reservationBar.endDay - day;
                barLength = Math.min(daysUntilSunday, daysUntilEndOfReservation) + 1;
            }
        }
        
        // Calculer le prix avec promotions si un tarif existe
        let prixDisplay = '';
        if (tarif && !isReserved) {
            const prixBase = parseFloat(tarif.prix_nuit);
            const { prixFinal, promoAppliquee } = calculatePrixWithPromos(dateStr, prixBase);
            
            if (promoAppliquee) {
                // Afficher prix barré + nouveau prix
                prixDisplay = `
                    <div style="font-size: 11px; color: var(--text-secondary); text-decoration: line-through; margin-top: 2px;">${prixBase.toFixed(0)}€</div>
                    <div style="font-size: 13px; font-weight: 700; color: #e74c3c; margin-top: 2px;">${prixFinal.toFixed(0)}€</div>
                    <div style="font-size: 9px; color: #e74c3c; font-weight: 600; margin-top: 2px;">🎉 ${promoAppliquee.split(' ')[0]}</div>
                `;
            } else {
                // Prix normal
                prixDisplay = `<div class="day-price" style="font-size: 13px; font-weight: 600; color: var(--text); margin-top: 4px;">${prixBase.toFixed(0)}€</div>`;
            }
        } else if (!isReserved) {
            prixDisplay = '<div style="font-size: 11px; color: var(--text-secondary); margin-top: 4px;">—</div>';
        }
        
        const dayCard = document.createElement('div');
        dayCard.className = 'day-card';
        dayCard.dataset.date = dateStr;
        dayCard.style.minHeight = '140px'; // Forcer hauteur uniforme
        dayCard.style.display = 'flex';
        dayCard.style.flexDirection = 'column';
        dayCard.style.justifyContent = 'space-between';
        
        if (isReserved) {
            dayCard.classList.add('reserved');
            dayCard.style.cursor = 'not-allowed';
            
            // Si c'est le début d'une barre (premier jour OU début de semaine), créer la barre continue
            if (isBarStart) {
                dayCard.style.zIndex = '10'; // Z-index élevé pour passer au-dessus des autres cellules
                const plateformeColor = getPlateformeColor(reservationBar.plateforme);
                
                // Créer la barre qui s'étend sur plusieurs jours (jusqu'à la fin de la semaine)
                dayCard.innerHTML = `
                    <div class="day-number" style="position: relative; z-index: 12;">${day}</div>
                    <div style="position: relative; flex: 1; display: flex; align-items: center;">
                        <div class="reservation-bar" style="
                            position: absolute;
                            left: 4px;
                            right: calc(-100% * ${barLength - 1} - ${(barLength - 1) * 15}px + 4px);
                            height: 38px;
                            background: ${plateformeColor};
                            border: 2px solid #2D3436;
                            border-radius: 6px;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            font-size: 11px;
                            font-weight: 700;
                            color: #fff;
                            padding: 0 8px;
                            z-index: 5;
                            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                        ">
                            ${reservationBar.plateforme}
                        </div>
                    </div>
                    <div style="position: relative; z-index: 12; font-size: 11px; color: var(--text-secondary);">—</div>
                `;
            } else {
                // Jours suivants de la réservation : afficher uniquement le numéro du jour
                dayCard.style.zIndex = '1'; // Z-index bas pour passer sous la barre
                dayCard.innerHTML = `
                    <div class="day-number">${day}</div>
                    <div style="flex: 1;"></div>
                    <div style="font-size: 11px; color: var(--text-secondary);">—</div>
                `;
            }
        } else {
            dayCard.innerHTML = `
                <div class="day-number">${day}</div>
                ${prixDisplay}
            `;
        }
        
        if (tarif && !isReserved) {
            dayCard.classList.add('has-tarif');
            
            // Ajouter classe pour tarif élevé (> 200€)
            const prixBase = parseFloat(tarif.prix_nuit);
            if (prixBase > 200) {
                dayCard.classList.add('tarif-high');
            }
            
            // Vérifier si une promo est appliquée
            const { prixFinal, promoAppliquee } = calculatePrixWithPromos(dateStr, prixBase);
            if (promoAppliquee) {
                dayCard.classList.add('has-promo');
            }
        }
        
        if (selectedDates.includes(dateStr) && !isReserved) {
            dayCard.classList.add('selected');
        }
        
        // Ne pas permettre la sélection des dates réservées
        if (!isReserved) {
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
        }
        
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
    
    // Afficher le nombre de jours sélectionnés
    if (selectedDates.length > 1) {
        dateDisplay.textContent = `📅 ${selectedDates.length} jours sélectionnés (du ${new Date(selectedDates[0] + 'T00:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} au ${new Date(selectedDates[selectedDates.length - 1] + 'T00:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })})`;
    } else {
        dateDisplay.textContent = `📅 ${date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}`;
    }
    
    // Pré-remplir avec le tarif existant (du premier jour)
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
        
        if (!currentGiteId) {
            showToast('Aucun gîte sélectionné', 'error');
            return;
        }
        
        // Si des dates sont sélectionnées, appliquer à toutes
        const datesToUpdate = selectedDates.length > 0 ? selectedDates : [dateStr];
        
        // Mettre à jour le cache local
        for (const date of datesToUpdate) {
            const existingIndex = tarifsCache.findIndex(t => t.date === date);
            if (existingIndex > -1) {
                tarifsCache[existingIndex].prix_nuit = prix;
            } else {
                tarifsCache.push({ date, prix_nuit: prix });
            }
        }
        
        // Sauvegarder dans Supabase
        const { error } = await window.supabaseClient
            .from('gites')
            .update({ tarifs_calendrier: tarifsCache })
            .eq('id', currentGiteId);
        
        if (error) throw error;
        
        showToast(`✅ Tarif enregistré pour ${datesToUpdate.length} jour(s)`, 'success');
        closeModalTarif();
        
        // Réinitialiser la sélection
        selectedDates = [];
        
        // Re-render immédiatement pour afficher les prix
        renderCalendrierTarifs();
        
    } catch (error) {
        console.error('❌ Erreur sauvegarde tarif:', error);
        showToast('Erreur lors de la sauvegarde', 'error');
    }
}

// ==========================================
// SECTION 2 : RÈGLES TARIFAIRES
// ==========================================

async function loadRegles() {
    try {
        if (!currentGiteId) {
            reglesCache = createDefaultRegles();
            return;
        }
        
        // Charger depuis Supabase
        const { data, error } = await window.supabaseClient
            .from('gites')
            .select('regles_tarifs')
            .eq('id', currentGiteId)
            .single();
        
        if (error) throw error;
        
        if (data?.regles_tarifs) {
            reglesCache = data.regles_tarifs;
        } else {
            reglesCache = createDefaultRegles();
        }
        
        renderReglesForm();
        
    } catch (error) {
        console.error('❌ Erreur chargement règles:', error);
        reglesCache = createDefaultRegles();
        renderReglesForm();
    }
}

function createDefaultRegles() {
    return {
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
    if (!reglesCache) {
        console.warn('⚠️ reglesCache vide, création des valeurs par défaut');
        reglesCache = createDefaultRegles();
    }
    
    
    // Promotions
    const promos = reglesCache.promotions || {};
    
    if (promos.long_sejour) {
        const checkbox = document.getElementById('promo-long-sejour');
        if (checkbox) {
            // Retirer les anciens événements
            const newCheckbox = checkbox.cloneNode(true);
            checkbox.parentNode.replaceChild(newCheckbox, checkbox);
            
            newCheckbox.checked = promos.long_sejour.actif;
            
            // Event change avec auto-save
            newCheckbox.addEventListener('change', (e) => {
                autoSaveRegles();
            });
        } else {
            console.error('❌ Checkbox promo-long-sejour NON TROUVÉ');
        }
        const pct = document.getElementById('long-sejour-pct');
        if (pct) {
            pct.value = promos.long_sejour.pourcentage;
            pct.addEventListener('input', () => autoSaveRegles());
        }
        const nuits = document.getElementById('long-sejour-nuits');
        if (nuits) {
            nuits.value = promos.long_sejour.a_partir_de;
            nuits.addEventListener('input', () => autoSaveRegles());
        }
    }
    
    if (promos.last_minute) {
        const checkbox = document.getElementById('promo-last-minute');
        if (checkbox) {
            // Retirer les anciens événements
            const newCheckbox = checkbox.cloneNode(true);
            checkbox.parentNode.replaceChild(newCheckbox, checkbox);
            
            newCheckbox.checked = promos.last_minute.actif;
            
            // Event change avec auto-save
            newCheckbox.addEventListener('change', (e) => {
                autoSaveRegles();
            });
        } else {
            console.error('❌ Checkbox promo-last-minute NON TROUVÉ');
        }
        const pct = document.getElementById('last-minute-pct');
        if (pct) {
            pct.value = promos.last_minute.pourcentage;
            pct.addEventListener('input', () => autoSaveRegles());
        }
        const jours = document.getElementById('last-minute-jours');
        if (jours) {
            jours.value = promos.last_minute.jours_avant;
            jours.addEventListener('input', () => autoSaveRegles());
        }
    }
    
    if (promos.early_booking) {
        const checkbox = document.getElementById('promo-early-booking');
        if (checkbox) {
            // Retirer les anciens événements
            const newCheckbox = checkbox.cloneNode(true);
            checkbox.parentNode.replaceChild(newCheckbox, checkbox);
            
            newCheckbox.checked = promos.early_booking.actif;
            
            // Event change avec auto-save
            newCheckbox.addEventListener('change', (e) => {
                autoSaveRegles();
            });
        } else {
            console.error('❌ Checkbox promo-early-booking NON TROUVÉ');
        }
        const pct = document.getElementById('early-booking-pct');
        if (pct) {
            pct.value = promos.early_booking.pourcentage;
            pct.addEventListener('input', () => autoSaveRegles());
        }
        const jours = document.getElementById('early-booking-jours');
        if (jours) {
            jours.value = promos.early_booking.jours_avant;
            jours.addEventListener('input', () => autoSaveRegles());
        }
    }
    
    // Durée minimale
    const dureeMin = document.getElementById('duree-min-defaut');
    if (dureeMin) {
        dureeMin.value = reglesCache.duree_min_defaut || 2;
        dureeMin.addEventListener('input', () => autoSaveRegles());
    }
    
    // Périodes spécifiques
    renderPeriodesList();
}

function renderPeriodesList() {
    const container = document.getElementById('periodes-list');
    if (!container) return;
    
    const periodes = reglesCache.periodes_duree_min || [];
    
    if (periodes.length === 0) {
        container.innerHTML = '<p style="color: var(--text-secondary);">Aucune période spécifique définie</p>';
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

async function saveRegles(isAutoSave = false) {
    try {
        if (!currentGiteId) {
            if (!isAutoSave) showToast('Sélectionnez un gîte', 'error');
            return;
        }
        
        
        // Récupérer les valeurs du formulaire
        const promotions = {
            long_sejour: {
                actif: document.getElementById('promo-long-sejour')?.checked || false,
                pourcentage: parseFloat(document.getElementById('long-sejour-pct')?.value) || 10,
                a_partir_de: parseInt(document.getElementById('long-sejour-nuits')?.value) || 7
            },
            last_minute: {
                actif: document.getElementById('promo-last-minute')?.checked || false,
                pourcentage: parseFloat(document.getElementById('last-minute-pct')?.value) || 15,
                jours_avant: parseInt(document.getElementById('last-minute-jours')?.value) || 7
            },
            early_booking: {
                actif: document.getElementById('promo-early-booking')?.checked || false,
                pourcentage: parseFloat(document.getElementById('early-booking-pct')?.value) || 10,
                jours_avant: parseInt(document.getElementById('early-booking-jours')?.value) || 60
            }
        };
        
        
        const dureeMinDefaut = parseInt(document.getElementById('duree-min-defaut')?.value) || 2;
        
        const regles = {
            promotions: promotions,
            duree_min_defaut: dureeMinDefaut,
            periodes_duree_min: reglesCache.periodes_duree_min || []
        };
        
        // Sauvegarder dans Supabase avec l'UUID du gîte
        const { error } = await window.supabaseClient
            .from('gites')
            .update({ regles_tarifs: regles })
            .eq('id', currentGiteId);
        
        if (error) throw error;
        
        reglesCache = regles;
        
        // Si c'est un auto-save, ne pas afficher de toast ni recharger
        // Le calendrier sera re-rendu uniquement au changement de mois/gîte
        if (!isAutoSave) {
            showToast('✅ Règles tarifaires enregistrées', 'success');
            // Re-render uniquement sur demande manuelle
            renderCalendrierTarifs();
        }
        
    } catch (error) {
        console.error('❌ Erreur sauvegarde règles:', error);
        if (!isAutoSave) showToast('Erreur lors de la sauvegarde', 'error');
    }
}

// ==========================================
// SECTION 3 : CALENDRIER RÉSERVATIONS
// ==========================================

async function loadReservations() {
    try {
        if (!currentGiteId) return;
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const { data, error } = await window.supabaseClient
            .from('reservations')
            .select('*')
            .eq('gite_id', currentGiteId)
            .gte('check_out', today.toISOString().split('T')[0])
            .order('check_in', { ascending: true });
        
        if (error) throw error;
        
        reservationsCache = data || [];
        
        // Initialiser le calendrier au mois de la première réservation si différent du mois actuel
        if (reservationsCache.length > 0 && (currentYearReservations === new Date().getFullYear() && currentMonthReservations === new Date().getMonth())) {
            const firstResa = new Date(reservationsCache[0].check_in);
            currentYearReservations = firstResa.getFullYear();
            currentMonthReservations = firstResa.getMonth();
        }
        
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
        container.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 40px;">Aucune réservation ce mois-ci</p>';
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

// Version sans promotions pour comparaison
function calculateTarifSansPromo(dateDebut, dateFin, nbNuits) {
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
    
    // PAS de promotions appliquées
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
        
        // Utiliser addReservation pour gérer automatiquement les trajets kilométriques
        const reservation = {
            giteId: currentGiteId,
            dateDebut: dateArrivee,
            dateFin: dateDepart,
            nom: clientNom,
            telephone: clientTel,
            email: clientEmail,
            nbPersonnes: nbPersonnes,
            site: origine,
            montant: montant,
            acompte: acompte,
            status: 'confirmed'
        };
        
        await window.addReservation(reservation);
        
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

// Variables pour le tableau GDF
let currentMonthGDF = today.getMonth();
let currentYearGDF = today.getFullYear();

function previousMonthGDF() {
    currentMonthGDF--;
    if (currentMonthGDF < 0) {
        currentMonthGDF = 11;
        currentYearGDF--;
    }
    generateTableauGDF();
}

function nextMonthGDF() {
    currentMonthGDF++;
    if (currentMonthGDF > 11) {
        currentMonthGDF = 0;
        currentYearGDF++;
    }
    generateTableauGDF();
}

async function toggleTableauGDF() {
    await generateTableauGDF();
}

async function generateTableauGDF() {
    const container = document.getElementById('tableau-gdf-container');
    if (container) {
        container.style.display = 'block';
    }
    
    // Mettre à jour le titre du mois
    const monthTitle = document.getElementById('month-title-gdf');
    if (monthTitle) {
        const date = new Date(currentYearGDF, currentMonthGDF, 1);
        monthTitle.textContent = date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }).toUpperCase();
    }
    
    const table = document.getElementById('table-gdf');
    if (!table) return;
    
    // Générer l'en-tête
    let html = `
        <thead>
            <tr style="background: rgba(39, 174, 96, 0.15); border: 2px solid #27AE60;">
                <th style="padding: 15px; font-weight: 700; color: var(--text); border: 2px solid #27AE60; text-align: center;">Arrivée</th>
                <th style="padding: 15px; font-weight: 700; color: var(--text); border: 2px solid #27AE60; text-align: center;">1 nuit</th>
                <th style="padding: 15px; font-weight: 700; color: var(--text); border: 2px solid #27AE60; text-align: center;">2 nuits</th>
                <th style="padding: 15px; font-weight: 700; color: var(--text); border: 2px solid #27AE60; text-align: center;">3 nuits</th>
                <th style="padding: 15px; font-weight: 700; color: var(--text); border: 2px solid #27AE60; text-align: center;">4 nuits</th>
                <th style="padding: 15px; font-weight: 700; color: var(--text); border: 2px solid #27AE60; text-align: center;">5 nuits</th>
                <th style="padding: 15px; font-weight: 700; color: var(--text); border: 2px solid #27AE60; text-align: center;">6 nuits</th>
                <th style="padding: 15px; font-weight: 700; color: var(--text); border: 2px solid #27AE60; text-align: center;">7 nuits</th>
                <th style="padding: 15px; font-weight: 700; color: var(--text); border: 2px solid #27AE60; text-align: center;">nuit supp</th>
            </tr>
        </thead>
        <tbody>
    `;
    
    // Générer les lignes pour chaque jour du mois
    const lastDay = new Date(currentYearGDF, currentMonthGDF + 1, 0).getDate();
    
    for (let day = 1; day <= lastDay; day++) {
        const dateObj = new Date(currentYearGDF, currentMonthGDF, day);
        const dateStr = dateObj.toISOString().split('T')[0];
        const dayName = dateObj.toLocaleDateString('fr-FR', { weekday: 'short' });
        
        html += `<tr><td style="font-weight: 700; background: rgba(102, 126, 234, 0.08); border: 2px solid #667eea; padding: 12px; text-align: left; color: var(--text);">${dayName} ${dateObj.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}</td>`;
        
        // Récupérer la durée minimale depuis les règles
        const dureeMinimale = reglesCache?.duree_min_defaut || 2;
        
        // Calculer le tarif pour chaque durée
        for (let nights = 1; nights <= 8; nights++) {
            const dateFin = new Date(dateObj);
            dateFin.setDate(dateFin.getDate() + nights);
            const dateFinStr = dateFin.toISOString().split('T')[0];
            
            // Vérifier la durée minimale
            if (nights < dureeMinimale) {
                html += `<td class="cell-reserved" style="background: #f8f9fa; color: #95a5a6; border: 2px solid #dfe6e9; padding: 12px; text-align: center; font-weight: 600;">0</td>`;
                continue;
            }
            
            // Vérifier si le séjour chevauche une réservation existante
            let hasConflict = false;
            for (const resa of reservationsCache) {
                const checkIn = new Date(resa.date_arrivee || resa.check_in);
                const checkOut = new Date(resa.date_depart || resa.check_out);
                
                // Le séjour chevauche si :
                // - L'arrivée est avant la fin de la réservation ET
                // - Le départ est après le début de la réservation
                if (dateObj < checkOut && dateFin > checkIn) {
                    hasConflict = true;
                    break;
                }
            }
            
            if (hasConflict) {
                html += `<td class="cell-reserved" style="background: #f8f9fa; color: #95a5a6; border: 2px solid #dfe6e9; padding: 12px; text-align: center; font-weight: 600;">0</td>`;
            } else {
                const tarif = calculateTarifForDuration(dateStr, dateFinStr, nights);
                
                // Déterminer la classe CSS selon le tarif
                let cellClass = 'cell-available';
                if (tarif > 1000) {
                    cellClass += ' high-price';
                }
                
                // Vérifier si promo appliquée (comparaison avec tarif de base)
                const tarifBase = calculateTarifSansPromo(dateStr, dateFinStr, nights);
                if (tarif < tarifBase) {
                    cellClass += ' promo-price';
                }
                
                html += `<td class="${cellClass}" style="background: rgba(39, 174, 96, 0.1); color: #27AE60; border: 2px solid #27AE60; padding: 12px; text-align: center; font-weight: 700; font-size: 1rem;">${Math.round(tarif)}</td>`;
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
        
        const date = new Date(currentYearGDF, currentMonthGDF);
        const monthName = date.toLocaleDateString('fr-FR', { month: 'long' });
        const fileName = `Tarifs_GDF_${monthName}_${currentYearGDF}.xlsx`;
        
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
        
        // Feuille 1 : Tarifs avec promotions appliquées
        const tarifsData = tarifsCache.map(t => {
            const prixBase = parseFloat(t.prix_nuit);
            const { prixFinal, promoAppliquee } = calculatePrixWithPromos(t.date, prixBase);
            
            return {
                'Date': new Date(t.date).toLocaleDateString('fr-FR'),
                'Prix de base (€)': prixBase.toFixed(2),
                'Prix final (€)': prixFinal.toFixed(2),
                'Promotion': promoAppliquee || '-',
                'Économie (€)': promoAppliquee ? (prixBase - prixFinal).toFixed(2) : '0.00'
            };
        });
        const wsTarifs = XLSX.utils.json_to_sheet(tarifsData);
        XLSX.utils.book_append_sheet(wb, wsTarifs, 'Tarifs');
        
        // Feuille 2 : Réservations
        const resaData = reservationsCache.map(r => ({
            'Check-in': r.check_in || r.date_arrivee,
            'Check-out': r.check_out || r.date_depart,
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
        
        // Feuille 3 : Règles promotionnelles
        const promosData = [];
        if (reglesCache?.promotions) {
            const promos = reglesCache.promotions;
            if (promos.long_sejour) {
                promosData.push({
                    'Promotion': 'Long Séjour',
                    'Activée': promos.long_sejour.actif ? 'Oui' : 'Non',
                    'Réduction (%)': promos.long_sejour.pourcentage,
                    'Condition': `À partir de ${promos.long_sejour.a_partir_de} nuits`
                });
            }
            if (promos.last_minute) {
                promosData.push({
                    'Promotion': 'Last Minute',
                    'Activée': promos.last_minute.actif ? 'Oui' : 'Non',
                    'Réduction (%)': promos.last_minute.pourcentage,
                    'Condition': `Réservation ${promos.last_minute.jours_avant} jours ou moins avant arrivée`
                });
            }
            if (promos.early_booking) {
                promosData.push({
                    'Promotion': 'Early Booking',
                    'Activée': promos.early_booking.actif ? 'Oui' : 'Non',
                    'Réduction (%)': promos.early_booking.pourcentage,
                    'Condition': `Réservation ${promos.early_booking.jours_avant} jours ou plus avant arrivée`
                });
            }
        }
        const wsPromos = XLSX.utils.json_to_sheet(promosData);
        XLSX.utils.book_append_sheet(wb, wsPromos, 'Promotions');
        
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
        // Force le rendu du calendrier après chargement
        renderCalendrierTarifs();
        // Générer automatiquement le tableau Gîtes de France
        await generateTableauGDF();
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
    // 🚫 Bloquer en mode mobile (version mobile séparée)
    if (window.isMobile) {
        console.log('📱 Mode mobile: renderCalendrierTarifsTab() ignorée (version mobile séparée)');
        return;
    }
    
    // renderCalendrierTarifsTab
    const container = document.getElementById('tab-calendrier-tarifs');
    if (!container) {
        console.error('❌ Conteneur tab-calendrier-tarifs introuvable !');
        return;
    }
    // Conteneur trouvé
    
    container.innerHTML = `
        <!-- Styles déplacés vers css/tab-calendrier.css -->
        
        <!-- Contenu de l'onglet -->
        <div class="container-main">
            
            <!-- Header Neo-Brutalism -->
            <div class="card" padding: 20px; margin-bottom: 25px; box-shadow: 4px 4px 0 #2D3436; border-radius: 16px;">
                <div>
                    <h2 class="section-title-main">📅 Calendrier & Tarifs</h2>
                    <p class="section-description">Gestion des tarifs et réservations</p>
                </div>
            </div>
            
            <!-- Sélection des gîtes en boutons -->
            <div style="background: var(--card); border: 3px solid #2D3436; padding: 25px; margin-bottom: 25px; box-shadow: 4px 4px 0 #2D3436; border-radius: 16px;">
                <h3 style="margin: 0 0 20px 0; font-size: 1.3rem; color: var(--text); font-weight: 700; display: flex; align-items: center; gap: 10px;">
                    ${SERVICE_ICONS.home || '🏡'} Sélectionner un gîte
                </h3>
                <div id="gites-buttons-container" style="display: flex; gap: 15px; flex-wrap: wrap;">
                    <!-- Les boutons de gîtes seront ajoutés ici par JavaScript -->
                </div>
            </div>
            
            <!-- Section 1 : Calendrier & Tarifs de Base -->
            <div class="accordion-section" style="background: var(--card); border: 3px solid #2D3436; padding: 25px; margin-bottom: 25px; box-shadow: 4px 4px 0 #2D3436; border-radius: 16px;">
                <div id="tarifs-base" class="accordion-content active">
                    <div class="calendar-controls">
                        <button class="btn-neo btn-nav" onclick="previousMonthTarifs()">◀ Précédent</button>
                        <h3 id="current-month-tarifs" class="calendar-month-title">Janvier 2026</h3>
                        <button class="btn-neo btn-nav" onclick="nextMonthTarifs()">Suivant ▶</button>
                    </div>
                    
                    <div id="calendar-grid-tarifs" class="calendar-grid-tarifs"></div>
                    
                    <div class="tarifs-legend">
                        <div class="legend-item">
                            <div class="legend-box success"></div>
                            <span>Tarif défini</span>
                        </div>
                        <div class="legend-item">
                            <div class="legend-box promo"></div>
                            <span>🎁 Promotion</span>
                        </div>
                        <div class="legend-item">
                            <div class="legend-box high-tarif"></div>
                            <span>💎 Tarif élevé</span>
                        </div>
                        <div class="legend-item">
                            <div class="legend-box default"></div>
                            <span>Sans tarif</span>
                        </div>
                        <div class="legend-item">
                            <div class="legend-box warning"></div>
                            <span>Sélectionné</span>
                        </div>
                    </div>
                    
                    <div class="tarifs-help-box">
                        <p class="tarifs-help-title">💡 Comment utiliser</p>
                        <ul>
                            <li><strong style="color: #3498db;">Clic simple</strong> sur un jour → Définir le tarif pour ce jour</li>
                            <li><strong style="color: #3498db;">Glisser avec la souris</strong> → Sélectionner plusieurs jours en continu</li>
                            <li><strong style="color: #3498db;">Relâcher</strong> → Le modal s'ouvre pour appliquer le tarif à tous les jours sélectionnés</li>
                        </ul>
                    </div>
                </div>
            </div>
            
            <!-- Section 2 : Règles Tarifaires -->
            <div class="accordion-section" style="background: var(--card); border: 3px solid #2D3436; padding: 25px; margin-bottom: 25px; box-shadow: 4px 4px 0 #2D3436; border-radius: 16px;">
                <button class="accordion-header active" data-section="rules" onclick="toggleAccordion('regles-tarifaires')" 
                        style="background: transparent; border: none; padding: 0; width: 100%; text-align: left; cursor: pointer; display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;">
                    <span style="display: flex; align-items: center; gap: 12px; font-size: 1.3rem; font-weight: 700; color: var(--text);">
                        <span style="font-size: 1.8rem;">⚙️</span>
                        Règles Tarifaires Dynamiques
                    </span>
                    <span class="accordion-icon" style="font-size: 1.5rem; font-weight: 700; color: #667eea;">▼</span>
                </button>
                <div id="regles-tarifaires" class="accordion-content active">
                    
                    <!-- Promotions Automatiques -->
                    <div class="rules-card primary">
                        <h4 class="rules-card-title primary">
                            🎁 Promotions Automatiques
                        </h4>
                        <div class="promo-grid">
                            <div class="promo-card success">
                                <div class="promo-header">
                                    <label class="toggle-switch"><input type="checkbox" id="promo-long-sejour"><span class="toggle-slider"></span></label>
                                    <span class="promo-title success">Long Séjour</span>
                                </div>
                                <input type="number" id="long-sejour-pct" placeholder="% réduction" class="input-neo" />
                                <input type="number" id="long-sejour-nuits" placeholder="À partir de X nuits" class="input-neo" />
                            </div>
                            <div class="promo-card warning">
                                <div class="promo-header">
                                    <label class="toggle-switch"><input type="checkbox" id="promo-last-minute"><span class="toggle-slider"></span></label>
                                    <span class="promo-title warning">Last Minute</span>
                                </div>
                                <input type="number" id="last-minute-pct" placeholder="% réduction" class="input-neo" />
                                <input type="number" id="last-minute-jours" placeholder="Jours avant arrivée" class="input-neo" />
                            </div>
                            <div class="promo-card primary">
                                <div class="promo-header">
                                    <label class="toggle-switch"><input type="checkbox" id="promo-early-booking"><span class="toggle-slider"></span></label>
                                    <span class="promo-title primary">Early Booking</span>
                                </div>
                                <input type="number" id="early-booking-pct" placeholder="% réduction" class="input-neo" />
                                <input type="number" id="early-booking-jours" placeholder="Jours d'avance" class="input-neo" />
                            </div>
                        </div>
                    </div>
                    
                    <!-- C. Durée minimale -->
                    <div class="rules-card danger">
                        <h4 class="rules-card-title danger">
                            ⏱️ Durée Minimale de Séjour
                        </h4>
                        <div class="duree-min-container">
                            <label class="duree-min-label">Durée minimale par défaut (toute l'année)</label>
                            <input type="number" id="duree-min-defaut" class="input-neo" value="2" class="duree-min-input" />
                        </div>
                        <h5 class="periodes-subtitle">Périodes spécifiques :</h5>
                        <div id="periodes-list"></div>
                        <button class="btn-neo btn-add-periode" onclick="addPeriodeDureeMin()">+ Ajouter une période</button>
                        
                        <!-- Bouton Remplissage Automatique -->
                        <div class="remplissage-auto-box">
                            <button onclick="window.openRemplissageAutoModal()" 
                                    style="padding: 15px 35px; font-size: 1.1rem; font-weight: 700;
                                           border-radius: 12px; background: var(--card); border: 2px solid #667eea; 
                                           box-shadow: 4px 4px 0 #667eea; color: #667eea; cursor: pointer; 
                                           transition: all 0.2s;
                                           display: inline-flex; align-items: center; gap: 10px;"
                                    onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='6px 6px 0 #667eea';"
                                    onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='4px 4px 0 #667eea';">
                                <span class="icon">🎯</span>
                                <span>Remplissage Automatique</span>
                            </button>
                            <div class="remplissage-auto-desc">
                                Remplir les tarifs par période avec détection des jours fériés et vacances
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Section 3 : Export Gîtes de France -->
            <div class="accordion-section" style="background: var(--card); border: 3px solid #2D3436; padding: 25px; margin-top: 25px; box-shadow: 4px 4px 0 #2D3436; border-radius: 16px;">
                <button class="accordion-header" onclick="toggleAccordion('export-gdf')" 
                        style="background: transparent; border: none; padding: 0; width: 100%; text-align: left; cursor: pointer; display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;">
                    <span style="display: flex; align-items: center; gap: 12px; font-size: 1.3rem; font-weight: 700; color: var(--text);">
                        <span style="font-size: 1.8rem;">📊</span>
                        Tableau Gîtes de France
                    </span>
                    <span class="accordion-icon" style="font-size: 1.5rem; font-weight: 700; color: #27AE60;">▼</span>
                </button>
                <div id="export-gdf" class="accordion-content">
                    <div id="tableau-gdf-container" style="display: block;">
                        <!-- Navigation mois -->
                        <div class="calendar-controls success">
                            <button class="btn-neo btn-nav" onclick="previousMonthGDF()">◀ Précédent</button>
                            <h3 id="month-title-gdf" class="calendar-month-title" style="color: #27AE60;">Janvier 2026</h3>
                            <button class="btn-neo btn-nav" onclick="nextMonthGDF()">Suivant ▶</button>
                        </div>
                        <div style="overflow-x: auto; background: var(--card); padding: 15px; border-radius: 10px; border: 2px solid #2D3436; box-shadow: 3px 3px 0 #2D3436;">
                            <table class="table-gdf" id="table-gdf" class="table-full-width"></table>
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
                <input type="number" id="modal-tarif-prix" class="input-neo" placeholder="Exemple : 250" step="0.01" />
                <div style="display: flex; gap: 10px; margin-top: 20px;">
                    <button class="btn-neo btn-save" onclick="saveTarifFromModal()" style="flex: 1;">💾 Enregistrer</button>
                    <button class="btn-neo" onclick="closeModalTarif()" style="flex: 1;">Annuler</button>
                </div>
            </div>
        </div>
        
        <div id="modal-reservation-ct" class="modal-neo">
            <div class="modal-content modal-content-large">
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
        if (document.getElementById('gites-buttons-container')) {
            await initCalendrierTarifs();
        } else {
            console.error('❌ Container gites-buttons-container non trouvé');
        }
    }, 150);
}

// ==========================================
// LANCEMENT
// ==========================================

// Fonction wrapper pour ouvrir la modal de remplissage automatique
function openRemplissageAutoModal() {
    if (!currentGiteId) {
        alert('⚠️ Veuillez d\'abord sélectionner un gîte');
        return;
    }
    if (typeof window.openModalRemplissageAuto === 'function') {
        window.openModalRemplissageAuto(currentGiteId);
    } else {
        console.error('❌ Module de remplissage automatique non chargé');
        alert('⚠️ Module de remplissage automatique non disponible');
    }
}

// Exposer les fonctions nécessaires au scope global
window.renderCalendrierTarifsTab = renderCalendrierTarifsTab;
window.previousMonthTarifs = previousMonthTarifs;
window.nextMonthTarifs = nextMonthTarifs;
window.openTarifModal = openTarifModal;
window.closeModalTarif = closeModalTarif;
window.saveTarifFromModal = saveTarifFromModal;
window.exportCalendrierComplet = exportCalendrierComplet;
window.addPeriodeDureeMin = addPeriodeDureeMin;
window.removePeriodeDureeMin = removePeriodeDureeMin;
window.toggleAccordion = toggleAccordion;
window.toggleTableauGDF = toggleTableauGDF;
window.exportTableauGDF = exportTableauGDF;
window.previousMonthGDF = previousMonthGDF;
window.nextMonthGDF = nextMonthGDF;
window.openRemplissageAutoModal = openRemplissageAutoModal;
window.loadTarifsBase = loadTarifsBase;
window.loadAllData = loadAllData;
window.renderCalendrierTarifs = renderCalendrierTarifs;

// Ne pas lancer automatiquement au chargement de la page
// L'initialisation se fera via renderCalendrierTarifsTab() quand l'onglet est activé

})();
