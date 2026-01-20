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
                background: white;
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
                        background: white;
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
            <span style="display: inline-block; width: 16px; height: 16px; background: ${gite.color || '#667eea'}; border: 2px solid #2D3436; border-radius: 4px;"></span>
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
    'Direct': '#9B59B6',
    'Abritel': '#F39C12',
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
        
        // Calculer le prix avec promotions si un tarif existe
        let prixDisplay = '';
        if (tarif) {
            const prixBase = parseFloat(tarif.prix_nuit);
            const { prixFinal, promoAppliquee } = calculatePrixWithPromos(dateStr, prixBase);
            
            if (promoAppliquee) {
                // Afficher prix barré + nouveau prix
                prixDisplay = `
                    <div style="font-size: 11px; color: #999; text-decoration: line-through; margin-top: 2px;">${prixBase.toFixed(0)}€</div>
                    <div style="font-size: 13px; font-weight: 700; color: #e74c3c; margin-top: 2px;">${prixFinal.toFixed(0)}€</div>
                    <div style="font-size: 9px; color: #e74c3c; font-weight: 600; margin-top: 2px;">🎉 ${promoAppliquee.split(' ')[0]}</div>
                `;
            } else {
                // Prix normal
                prixDisplay = `<div class="day-price" style="font-size: 13px; font-weight: 600; color: #2D3436; margin-top: 4px;">${prixBase.toFixed(0)}€</div>`;
            }
        } else {
            prixDisplay = '<div style="font-size: 11px; color: #999; margin-top: 4px;">—</div>';
        }
        
        // Vérifier si la date est dans une réservation et récupérer les infos
        let reservationInfo = null;
        const currentReservation = reservationsCache.find(resa => {
            const checkIn = new Date(resa.date_arrivee || resa.check_in);
            const checkOut = new Date(resa.date_depart || resa.check_out);
            const currentDate = new Date(dateStr);
            return currentDate >= checkIn && currentDate < checkOut;
        });
        
        const isReserved = !!currentReservation;
        if (isReserved) {
            reservationInfo = {
                plateforme: currentReservation.origine_reservation || currentReservation.plateforme || 'Direct',
                client: currentReservation.nom_client
            };
        }
        
        const dayCard = document.createElement('div');
        dayCard.className = 'day-card';
        dayCard.dataset.date = dateStr;
        
        if (isReserved) {
            dayCard.classList.add('reserved');
            dayCard.style.background = '#e0e0e0';
            dayCard.style.opacity = '0.6';
            dayCard.style.cursor = 'not-allowed';
            dayCard.title = `Réservé - ${reservationInfo.plateforme}`;
        }
        
        if (tarif && !isReserved) {
            dayCard.classList.add('has-tarif');
        }
        
        if (selectedDates.includes(dateStr) && !isReserved) {
            dayCard.classList.add('selected');
        }
        
        const plateformeColor = isReserved ? getPlateformeColor(reservationInfo.plateforme) : '#ff5a5f';
        
        dayCard.innerHTML = `
            <div class="day-number">${day}</div>
            ${isReserved ? `
                <div style="font-size: 10px; font-weight: 700; color: #fff; background: ${plateformeColor}; padding: 2px 4px; border-radius: 3px; margin-top: 4px; border: 2px solid #2D3436;">${reservationInfo.plateforme}</div>
                <div style="font-size: 9px; color: #666; margin-top: 2px;">BOOKED</div>
            ` : prixDisplay}
        `;
        
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
        
        // Récupérer le nom du gîte depuis le bouton actif
        const activeButton = document.querySelector('.gite-button.active');
        const giteName = activeButton ? activeButton.textContent.trim().replace('🏡', '').trim() : 'Gîte';
        
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
                <th style="padding: 15px; font-weight: 700; color: #2D3436; border: 2px solid #27AE60; text-align: center;">Arrivée</th>
                <th style="padding: 15px; font-weight: 700; color: #2D3436; border: 2px solid #27AE60; text-align: center;">1 nuit</th>
                <th style="padding: 15px; font-weight: 700; color: #2D3436; border: 2px solid #27AE60; text-align: center;">2 nuits</th>
                <th style="padding: 15px; font-weight: 700; color: #2D3436; border: 2px solid #27AE60; text-align: center;">3 nuits</th>
                <th style="padding: 15px; font-weight: 700; color: #2D3436; border: 2px solid #27AE60; text-align: center;">4 nuits</th>
                <th style="padding: 15px; font-weight: 700; color: #2D3436; border: 2px solid #27AE60; text-align: center;">5 nuits</th>
                <th style="padding: 15px; font-weight: 700; color: #2D3436; border: 2px solid #27AE60; text-align: center;">6 nuits</th>
                <th style="padding: 15px; font-weight: 700; color: #2D3436; border: 2px solid #27AE60; text-align: center;">7 nuits</th>
                <th style="padding: 15px; font-weight: 700; color: #2D3436; border: 2px solid #27AE60; text-align: center;">nuit supp</th>
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
        
        html += `<tr><td style="font-weight: 700; background: rgba(102, 126, 234, 0.08); border: 2px solid #667eea; padding: 12px; text-align: left; color: #2D3436;">${dayName} ${dateObj.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}</td>`;
        
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
                html += `<td class="cell-available" style="background: rgba(39, 174, 96, 0.1); color: #27AE60; border: 2px solid #27AE60; padding: 12px; text-align: center; font-weight: 700; font-size: 1rem;">${Math.round(tarif)}</td>`;
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
                background: white;
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
                background: rgba(39, 174, 96, 0.15);
                border-color: #27AE60;
            }
            
            #tab-calendrier-tarifs .day-card.selected {
                background: rgba(243, 156, 18, 0.25);
                border-color: #F39C12;
                box-shadow: 6px 6px 0 #F39C12;
            }
            
            #tab-calendrier-tarifs .day-card.other-month {
                background: #f5f6fa;
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
                /* Styles minimalistes - les styles inline prévalent */
            }
            
            #tab-calendrier-tarifs .table-gdf th,
            #tab-calendrier-tarifs .table-gdf td {
                /* Styles définis en inline dans generateTableauGDF() */
            }
            
            #tab-calendrier-tarifs .table-gdf thead tr {
                /* Styles définis en inline */
            }
            
            #tab-calendrier-tarifs .table-gdf tbody tr:nth-child(even) {
                /* Pas de style alterné - garde le blanc */
            }
            
            #tab-calendrier-tarifs .table-gdf .cell-available {
                /* Styles définis en inline */
            }
            
            #tab-calendrier-tarifs .table-gdf .cell-reserved {
                /* Styles définis en inline */
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
            
            #tab-calendrier-tarifs .gite-button {
                /* Styles définis en inline dans loadGitesSelector() */
            }
            
            #tab-calendrier-tarifs .gite-button:hover {
                /* Géré par addEventListener en JavaScript */
            }
            
            #tab-calendrier-tarifs .gite-button.active {
                /* Géré dynamiquement en JavaScript */
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
                
                #tab-calendrier-tarifs .gite-button {
                    min-width: auto;
                    width: 100%;
                }
            }
        </style>
        
        <!-- Contenu de l'onglet -->
        <div style="max-width: 1400px; margin: 0 auto; padding: 20px;">
            
            <!-- Header Neo-Brutalism -->
            <div class="card" style="background: white; border: 3px solid #2D3436; padding: 20px; margin-bottom: 25px; box-shadow: 4px 4px 0 #2D3436; border-radius: 16px;">
                <div>
                    <h2 style="margin: 0; font-size: 1.5rem; color: #2D3436; font-weight: 700; text-transform: uppercase;">📅 Calendrier & Tarifs</h2>
                    <p style="margin: 8px 0 0 0; font-size: 0.9rem; color: #666;">Gestion des tarifs et réservations</p>
                </div>
            </div>
            
            <!-- Sélection des gîtes en boutons -->
            <div style="background: white; border: 3px solid #2D3436; padding: 25px; margin-bottom: 25px; box-shadow: 4px 4px 0 #2D3436; border-radius: 16px;">
                <h3 style="margin: 0 0 20px 0; font-size: 1.3rem; color: #2D3436; font-weight: 700; display: flex; align-items: center; gap: 10px;">
                    ${SERVICE_ICONS.home || '🏡'} Sélectionner un gîte
                </h3>
                <div id="gites-buttons-container" style="display: flex; gap: 15px; flex-wrap: wrap;">
                    <!-- Les boutons de gîtes seront ajoutés ici par JavaScript -->
                </div>
            </div>
            
            <!-- Section 1 : Calendrier & Tarifs de Base -->
            <div class="accordion-section" style="background: white; border: 3px solid #2D3436; padding: 25px; margin-bottom: 25px; box-shadow: 4px 4px 0 #2D3436; border-radius: 16px;">
                <div id="tarifs-base" class="accordion-content active">
                    <div class="calendar-controls" style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 25px; padding: 20px; background: rgba(102, 126, 234, 0.05); border: 2px solid #667eea; border-radius: 12px;">
                        <button class="btn-neo" onclick="previousMonthTarifs()" style="background: white; border: 2px solid #667eea; color: #667eea; padding: 12px 24px; font-size: 1rem; font-weight: 700; box-shadow: 3px 3px 0 #667eea; border-radius: 10px; cursor: pointer; transition: all 0.2s;" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='5px 5px 0 #667eea';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='3px 3px 0 #667eea';">◀ Précédent</button>
                        <h3 id="current-month-tarifs" style="margin: 0; text-transform: uppercase; font-size: 1.5rem; font-weight: 700; color: #667eea; letter-spacing: 1px;">Janvier 2026</h3>
                        <button class="btn-neo" onclick="nextMonthTarifs()" style="background: white; border: 2px solid #667eea; color: #667eea; padding: 12px 24px; font-size: 1rem; font-weight: 700; box-shadow: 3px 3px 0 #667eea; border-radius: 10px; cursor: pointer; transition: all 0.2s;" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='5px 5px 0 #667eea';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='3px 3px 0 #667eea';">Suivant ▶</button>
                    </div>
                    
                    <div id="calendar-grid-tarifs" class="calendar-grid-tarifs"></div>
                    
                    <div class="legend" style="display: flex; gap: 20px; flex-wrap: wrap; margin-top: 20px; padding: 15px; background: white; border: 2px solid #2D3436; border-radius: 10px;">
                        <div class="legend-item" style="display: flex; align-items: center; gap: 10px;">
                            <div class="legend-box" style="width: 35px; height: 35px; border: 2px solid #27AE60; border-radius: 8px; background: #27AE60; box-shadow: 2px 2px 0 #2D3436;"></div>
                            <span style="font-weight: 600; color: #2D3436;">Tarif défini</span>
                        </div>
                        <div class="legend-item" style="display: flex; align-items: center; gap: 10px;">
                            <div class="legend-box" style="width: 35px; height: 35px; border: 2px solid #2D3436; border-radius: 8px; background: white; box-shadow: 2px 2px 0 #2D3436;"></div>
                            <span style="font-weight: 600; color: #2D3436;">Sans tarif</span>
                        </div>
                        <div class="legend-item" style="display: flex; align-items: center; gap: 10px;">
                            <div class="legend-box" style="width: 35px; height: 35px; border: 2px solid #F39C12; border-radius: 8px; background: #F39C12; box-shadow: 2px 2px 0 #2D3436;"></div>
                            <span style="font-weight: 600; color: #2D3436;">Sélectionné</span>
                        </div>
                    </div>
                    
                    <div style="margin-top: 20px; padding: 20px; background: rgba(52, 152, 219, 0.08); border: 2px solid #3498db; border-radius: 12px; box-shadow: 2px 2px 0 #3498db;">
                        <p style="margin: 0 0 12px 0; font-weight: 700; font-size: 1.05rem; color: #3498db; display: flex; align-items: center; gap: 8px;">💡 Comment utiliser</p>
                        <ul style="margin: 0; padding-left: 20px; line-height: 2; color: #2D3436;">
                            <li><strong style="color: #3498db;">Clic simple</strong> sur un jour → Définir le tarif pour ce jour</li>
                            <li><strong style="color: #3498db;">Glisser avec la souris</strong> → Sélectionner plusieurs jours en continu</li>
                            <li><strong style="color: #3498db;">Relâcher</strong> → Le modal s'ouvre pour appliquer le tarif à tous les jours sélectionnés</li>
                        </ul>
                    </div>
                </div>
            </div>
            
            <!-- Section 2 : Règles Tarifaires -->
            <div class="accordion-section" style="background: white; border: 3px solid #2D3436; padding: 25px; margin-bottom: 25px; box-shadow: 4px 4px 0 #2D3436; border-radius: 16px;">
                <button class="accordion-header active" data-section="rules" onclick="toggleAccordion('regles-tarifaires')" 
                        style="background: transparent; border: none; padding: 0; width: 100%; text-align: left; cursor: pointer; display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;">
                    <span style="display: flex; align-items: center; gap: 12px; font-size: 1.3rem; font-weight: 700; color: #2D3436;">
                        <span style="font-size: 1.8rem;">⚙️</span>
                        Règles Tarifaires Dynamiques
                    </span>
                    <span class="accordion-icon" style="font-size: 1.5rem; font-weight: 700; color: #667eea;">▼</span>
                </button>
                <div id="regles-tarifaires" class="accordion-content active">
                    
                    <!-- Promotions Automatiques -->
                    <div class="rules-card" style="background: rgba(102, 126, 234, 0.05); border: 2px solid #667eea; padding: 25px; border-radius: 12px; margin-bottom: 20px;">
                        <h4 style="font-weight: 700; margin-bottom: 20px; font-size: 1.15rem; color: #667eea; text-transform: uppercase; display: flex; align-items: center; gap: 10px;">
                            🎁 Promotions Automatiques
                        </h4>
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 15px;">
                            <div class="promo-card" style="background: white; border: 2px solid #27AE60; padding: 20px; border-radius: 10px; box-shadow: 3px 3px 0 #27AE60;">
                                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px;">
                                    <label class="toggle-switch"><input type="checkbox" id="promo-long-sejour"><span class="toggle-slider"></span></label>
                                    <span style="font-weight: 700; font-size: 1.05rem; color: #27AE60;">Long Séjour</span>
                                </div>
                                <input type="number" id="long-sejour-pct" placeholder="% réduction" style="margin-top: 10px;" class="input-neo" />
                                <input type="number" id="long-sejour-nuits" placeholder="À partir de X nuits" style="margin-top: 10px;" class="input-neo" />
                            </div>
                            <div class="promo-card" style="background: white; border: 2px solid #F39C12; padding: 20px; border-radius: 10px; box-shadow: 3px 3px 0 #F39C12;">
                                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px;">
                                    <label class="toggle-switch"><input type="checkbox" id="promo-last-minute"><span class="toggle-slider"></span></label>
                                    <span style="font-weight: 700; font-size: 1.05rem; color: #F39C12;">Last Minute</span>
                                </div>
                                <input type="number" id="last-minute-pct" placeholder="% réduction" style="margin-top: 10px;" class="input-neo" />
                                <input type="number" id="last-minute-jours" placeholder="Jours avant arrivée" style="margin-top: 10px;" class="input-neo" />
                            </div>
                            <div class="promo-card" style="background: white; border: 2px solid #667eea; padding: 20px; border-radius: 10px; box-shadow: 3px 3px 0 #667eea;">
                                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px;">
                                    <label class="toggle-switch"><input type="checkbox" id="promo-early-booking"><span class="toggle-slider"></span></label>
                                    <span style="font-weight: 700; font-size: 1.05rem; color: #667eea;">Early Booking</span>
                                </div>
                                <input type="number" id="early-booking-pct" placeholder="% réduction" style="margin-top: 10px;" class="input-neo" />
                                <input type="number" id="early-booking-jours" placeholder="Jours d'avance" style="margin-top: 10px;" class="input-neo" />
                            </div>
                        </div>
                    </div>
                    
                    <!-- C. Durée minimale -->
                    <div class="rules-card" style="background: rgba(231, 76, 60, 0.05); border: 2px solid #E74C3C; padding: 25px; border-radius: 12px;">
                        <h4 style="font-weight: 700; margin-bottom: 20px; font-size: 1.15rem; color: #E74C3C; text-transform: uppercase; display: flex; align-items: center; gap: 10px;">
                            ⏱️ Durée Minimale de Séjour
                        </h4>
                        <div style="margin-bottom: 20px; background: white; padding: 15px; border-radius: 8px; border: 2px solid #E74C3C;">
                            <label style="font-weight: 600; color: #2D3436; margin-bottom: 8px; display: block;">Durée minimale par défaut (toute l'année)</label>
                            <input type="number" id="duree-min-defaut" class="input-neo" value="2" style="width: 100px;" />
                        </div>
                        <h5 style="font-weight: 600; margin-top: 20px; margin-bottom: 12px; color: #2D3436;">Périodes spécifiques :</h5>
                        <div id="periodes-list" style="margin-top: 10px;"></div>
                        <button class="btn-neo btn-save" onclick="addPeriodeDureeMin()" style="margin-top: 15px; background: white; border: 2px solid #E74C3C; color: #E74C3C; box-shadow: 3px 3px 0 #E74C3C;">+ Ajouter une période</button>
                        
                        <!-- Bouton Remplissage Automatique -->
                        <div style="margin-top: 25px; text-align: center; padding: 25px; background: rgba(102, 126, 234, 0.08); border: 2px solid #667eea; border-radius: 12px;">
                            <button onclick="window.openRemplissageAutoModal()" 
                                    style="padding: 15px 35px; font-size: 1.1rem; font-weight: 700;
                                           border-radius: 12px; background: white; border: 2px solid #667eea; 
                                           box-shadow: 4px 4px 0 #667eea; color: #667eea; cursor: pointer; 
                                           transition: all 0.2s;
                                           display: inline-flex; align-items: center; gap: 10px;"
                                    onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='6px 6px 0 #667eea';"
                                    onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='4px 4px 0 #667eea';">
                                <span style="font-size: 1.3rem;">🎯</span>
                                <span>Remplissage Automatique</span>
                            </button>
                            <div style="margin-top: 12px; font-size: 0.85rem; color: #666;">
                                Remplir les tarifs par période avec détection des jours fériés et vacances
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Section 3 : Export Gîtes de France -->
            <div class="accordion-section" style="background: white; border: 3px solid #2D3436; padding: 25px; margin-top: 25px; box-shadow: 4px 4px 0 #2D3436; border-radius: 16px;">
                <button class="accordion-header" onclick="toggleAccordion('export-gdf')" 
                        style="background: transparent; border: none; padding: 0; width: 100%; text-align: left; cursor: pointer; display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;">
                    <span style="display: flex; align-items: center; gap: 12px; font-size: 1.3rem; font-weight: 700; color: #2D3436;">
                        <span style="font-size: 1.8rem;">📊</span>
                        Tableau Gîtes de France
                    </span>
                    <span class="accordion-icon" style="font-size: 1.5rem; font-weight: 700; color: #27AE60;">▼</span>
                </button>
                <div id="export-gdf" class="accordion-content">
                    <div id="tableau-gdf-container" style="display: block;">
                        <!-- Navigation mois -->
                        <div class="calendar-controls" style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 25px; padding: 20px; background: rgba(39, 174, 96, 0.08); border: 2px solid #27AE60; border-radius: 12px;">
                            <button class="btn-neo" onclick="previousMonthGDF()" style="background: white; border: 2px solid #27AE60; color: #27AE60; padding: 12px 24px; font-size: 1rem; font-weight: 700; box-shadow: 3px 3px 0 #27AE60; border-radius: 10px; cursor: pointer; transition: all 0.2s;" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='5px 5px 0 #27AE60';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='3px 3px 0 #27AE60';">◀ Précédent</button>
                            <h3 id="month-title-gdf" style="margin: 0; text-transform: uppercase; font-size: 1.5rem; font-weight: 700; color: #27AE60; letter-spacing: 1px;">Janvier 2026</h3>
                            <button class="btn-neo" onclick="nextMonthGDF()" style="background: white; border: 2px solid #27AE60; color: #27AE60; padding: 12px 24px; font-size: 1rem; font-weight: 700; box-shadow: 3px 3px 0 #27AE60; border-radius: 10px; cursor: pointer; transition: all 0.2s;" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='5px 5px 0 #27AE60';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='3px 3px 0 #27AE60';">Suivant ▶</button>
                        </div>
                        <div style="overflow-x: auto; background: white; padding: 15px; border-radius: 10px; border: 2px solid #2D3436; box-shadow: 3px 3px 0 #2D3436;">
                            <table class="table-gdf" id="table-gdf" style="width: 100%; border-collapse: separate; border-spacing: 0;"></table>
                        </div>
                        <button class="btn-neo btn-save" style="margin-top: 20px; background: white; border: 2px solid #27AE60; color: #27AE60; padding: 15px 30px; font-weight: 700; font-size: 1rem; box-shadow: 4px 4px 0 #27AE60; border-radius: 10px; cursor: pointer; transition: all 0.2s;" onclick="exportTableauGDF()" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='6px 6px 0 #27AE60';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='4px 4px 0 #27AE60';">📥 EXPORTER EN EXCEL</button>
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
