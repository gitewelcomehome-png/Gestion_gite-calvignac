// ╔══════════════════════════════════════════════════════════════════════════╗
// ║  ⚠️ ⚠️ ⚠️  FICHIER DESKTOP - NE PAS MODIFIER  ⚠️ ⚠️ ⚠️                      ║
// ║                                                                          ║
// ║  Ce fichier est EN PRODUCTION et doit rester STABLE                     ║
// ║  Pour le mobile, utiliser tabs/mobile/dashboard.html avec JS inline     ║
// ║  NE TOUCHER À CE FICHIER QUE SUR DEMANDE EXPLICITE                      ║
// ╚══════════════════════════════════════════════════════════════════════════╝

console.log('🎯 DASHBOARD.JS CHARGÉ - VERSION 4.0 - 25 JAN 2026 20:15');

/**
 * Vue d'ensemble hebdomadaire : réservations, ménages, todos
 * Version: 2.2.0 - Gestion problèmes clients
 */

// ==========================================
// CONFIGURATION FEATURES OPTIONNELLES
// ==========================================
let CHECKLIST_FEATURE_ENABLED = true; // Activé (table checklist_templates créée)

// ==========================================
// 👥 FILTRE ADMIN
// ==========================================
let ADMIN_FILTER_MODE = 'current'; // 'all' ou 'current'

/**
 * Gère le changement de filtre admin depuis le select
 */
function handleAdminFilterChange(mode) {
    ADMIN_FILTER_MODE = mode;
    
    console.log(`🔄 Filtre admin changé: ${mode}`);
    
    // Recharger les données
    if (typeof loadDashboard === 'function') {
        loadDashboard();
    }
    
    // Notification
    showAdminFilterMessage(mode);
}
document.addEventListener('click', function(e) {
    const container = document.querySelector('.admin-menu-container');
    const dropdown = document.getElementById('adminMenuDropdown');
    if (container && dropdown && !container.contains(e.target)) {
        dropdown.style.display = 'none';
    }
});

/**
 * Sélectionne un filtre admin
 */
function selectAdminFilter(mode) {
    ADMIN_FILTER_MODE = mode;
    
    // Mettre à jour le select si il existe
    const select = document.getElementById('adminFilterSelect');
    if (select) {
        select.value = mode;
    }
    
    console.log(`🔄 Filtre admin changé: ${mode}`);
    
    // Recharger les données
    if (typeof loadDashboard === 'function') {
        loadDashboard();
    }
    
    // Notification
    showAdminFilterMessage(mode);
}

/**
 * Affiche un message temporaire du changement de filtre
 */
function showAdminFilterMessage(mode) {
    const msg = mode === 'all' ? 
        '👥 Affichage : Tous les utilisateurs' : 
        '👤 Affichage : Mon compte uniquement';
    
    // Créer une notification temporaire
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 12px 20px;
        border-radius: 12px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        font-weight: 600;
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
    `;
    notification.textContent = msg;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 2000);
}

// ==========================================
// FONCTIONS UTILITAIRES (fallback si shared-utils ne charge pas)
// ==========================================
if (typeof window.parseLocalDate !== 'function') {
    window.parseLocalDate = function(dateStr) {
        if (!dateStr) return null;
        if (dateStr instanceof Date) return dateStr;
        const parts = dateStr.split('-');
        return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    };
}

if (typeof window.formatDateFromObj !== 'function') {
    window.formatDateFromObj = function(date) {
        if (!date) return '';
        const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
        const months = ['jan', 'fév', 'mar', 'avr', 'mai', 'juin', 'juil', 'août', 'sep', 'oct', 'nov', 'déc'];
        return `${days[date.getDay()]} ${date.getDate()} ${months[date.getMonth()]}`;
    };
}

// ==========================================
// ==========================================

function formatCurrency(amount) {
    return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

// ==========================================
// 📅 UTILITAIRES DATE
// ==========================================

function formatDateFromObj(dateObj) {
    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const year = dateObj.getFullYear();
    return `${day}/${month}/${year}`;
}

// ==========================================
// �📅 INFORMATIONS SEMAINE
// ==========================================

function updateDashboardHeader() {
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay() + 1); // Lundi
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6); // Dimanche
    
    // Utiliser le vrai calcul ISO 8601 de getWeekNumber
    const weekNumber = getWeekNumber(today);
    
    const dateEl = document.getElementById('dashboard-date');
    const weekNumEl = document.getElementById('dashboard-week-number');
    const weekInfoEl = document.getElementById('dashboard-week-info');
    const anneeEl = document.getElementById('annee-benefice');
    
    if (dateEl) dateEl.textContent = formatDateFromObj(today);
    if (weekNumEl) weekNumEl.textContent = `Semaine ${weekNumber}`;
    if (weekInfoEl) weekInfoEl.textContent = `Du ${formatDateFromObj(weekStart)} au ${formatDateFromObj(weekEnd)}`;
    if (anneeEl) anneeEl.textContent = today.getFullYear();
}

// ==========================================
// 🔔 ALERTES & NOTIFICATIONS
// ==========================================

async function updateDashboardAlerts() {
    const alerts = [];
    
    // Récupérer les réservations
    const reservations = await getAllReservations();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Vérifier les fiches clients à envoyer (J-3)
    const sendReminderReservations = reservations.filter(r => {
        const arrival = parseLocalDate(r.dateDebut);
        const daysUntilArrival = Math.ceil((arrival - today) / (1000 * 60 * 60 * 24));
        return daysUntilArrival === 3;
    });
    
    if (sendReminderReservations.length > 0) {
        alerts.push({
            type: 'info',
            icon: '📄',
            message: `${sendReminderReservations.length} fiche(s) client à envoyer (J-3)`,
            action: () => switchTab('dashboard')
        });
    }
    
    // Vérifier les ménages refusés
    const { data: cleanings } = await window.supabaseClient
        .from('cleaning_schedule')
        .select('*')
        .eq('status', 'refused');
    
    if (cleanings && cleanings.length > 0) {
        alerts.push({
            type: 'danger',
            icon: '🧹',
            message: `${cleanings.length} ménage(s) refusé(s) nécessitent votre attention`,
            action: () => switchTab('menage')
        });
    }
    
    // ============================================================
    // ❌ FEATURE SUPPRIMÉE - 23 JAN 2026
    // Table retours_menage supprimée de la BDD
    // ============================================================
    // const { data: retoursMenage } = await window.supabaseClient
    //     .from('retours_menage')
    //     .select('*, gites(name)')
    //     .eq('validated', false)
    //     .order('created_at', { ascending: false });
    // 
    // if (retoursMenage && retoursMenage.length > 0) {
    //     retoursMenage.forEach(retour => {
    //         const giteName = retour.gites?.name || 'Gîte inconnu';
    //         const dateFormatee = new Date(retour.date_menage).toLocaleDateString('fr-FR', { 
    //             day: 'numeric', 
    //             month: 'short' 
    //         });
    //         
    //         const hasComments = retour.commentaires && retour.commentaires.trim().length > 0;
    //         const icon = hasComments ? '📝' : '✅';
    //         
    //         alerts.push({
    //             type: 'info',
    //             icon: '🧹',
    //             message: `Retour ménage ${giteName} du ${dateFormatee} ${icon}`,
    //             action: () => afficherDetailsRetourMenage(retour.id),
    //             retourId: retour.id
    //         });
    //     });
    // }
    
    // Afficher les alertes
    const container = document.getElementById('dashboard-alerts');
    if (!container) return;
    if (alerts.length === 0) {
        window.SecurityUtils.setInnerHTML(container, '');
        return;
    }
    
    let html = '';
    alerts.forEach((alert, index) => {
        const bgColor = alert.type === 'danger' ? '#ff7675' : alert.type === 'warning' ? '#ffeaa7' : '#74b9ff';
        const textColor = alert.type === 'warning' ? '#2D3436' : 'white';
        const alertId = `dashboard-alert-${index}`;
        html += `
            <div id="${alertId}" style="background: ${bgColor}; color: ${textColor}; padding: 15px 20px; border-radius: 12px; border: 3px solid #2D3436; box-shadow: 4px 4px 0 #2D3436; margin-bottom: 15px; display: flex; align-items: center; gap: 15px; cursor: pointer; font-weight: 600; transition: transform 0.2s;" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">
                <span style="font-size: 1.5rem;">${alert.icon}</span>
                <span style="flex: 1;">${alert.message}</span>
                <span style="font-size: 1.2rem;">→</span>
            </div>
        `;
        // Attacher l'événement après le rendu
        setTimeout(() => {
            const element = document.getElementById(alertId);
            if (element) {
                element.onclick = alert.action;
            }
        }, 0);
    });
    window.SecurityUtils.setInnerHTML(container, html);
}

// ==========================================
// 🛠️ FONCTIONS HELPERS POUR ACTIONS
// ==========================================

function openEditReservation(id) {
    // Fonction définie dans index.html
    if (typeof window.openEditModal === 'function') {
        window.openEditModal(id);
    }
}

// ==========================================
// ==========================================

async function updateDashboardStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay() + 1);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    
    // Compteur ménages à faire cette semaine
    const { data: cleanings } = await window.supabaseClient
        .from('cleaning_schedule')
        .select('*')
        .gte('scheduled_date', weekStart.toISOString().split('T')[0])
        .lte('scheduled_date', weekEnd.toISOString().split('T')[0]);
    
    const cleaningsCount = cleanings ? cleanings.length : 0;
    
    // Compteurs todos par catégorie (non archivés, non complétés)
    const { data: todos } = await window.supabaseClient
        .from('todos')
        .select('*')
        .eq('completed', false)
        .is('archived_at', null);
    
    // Filtrer les tâches visibles (mêmes règles que l'affichage)
    const now = new Date();
    const visibleTodos = todos?.filter(todo => {
        if (!todo.is_recurrent || !todo.next_occurrence) {
            return true; // Tâche normale ou récurrente sans date = visible
        }
        // Tâche récurrente : visible seulement si la date est passée
        const nextOcc = new Date(todo.next_occurrence);
        return nextOcc <= now;
    }) || [];
    
    const reservationsTodos = visibleTodos.filter(t => t.category === 'reservations').length;
    const travauxTodos = visibleTodos.filter(t => t.category === 'travaux').length;
    const achatsTodos = visibleTodos.filter(t => t.category === 'achats').length;
    
    // Mettre à jour les compteurs dans les titres
    const cleaningsEl = document.getElementById('dashboard-cleanings');
    if (cleaningsEl) cleaningsEl.textContent = cleaningsCount;
    
    const reservationsEl = document.getElementById('todo-count-reservations');
    if (reservationsEl) reservationsEl.textContent = reservationsTodos;
    
    const travauxEl = document.getElementById('todo-count-travaux');
    if (travauxEl) travauxEl.textContent = travauxTodos;
    
    const achatsEl = document.getElementById('todo-count-achats');
    if (achatsEl) achatsEl.textContent = achatsTodos;
}

// ==========================================
// 📅 RÉSERVATIONS DE LA SEMAINE
// ==========================================

async function updateDashboardReservations() {
    const reservations = await getAllReservations();
    
    // ✅ Charger le planning ménage dashboard en parallèle
    updateDashboardMenages().catch(err => console.error('Erreur planning ménage:', err));
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Charger les horaires validées
    // Charger les horaires depuis les réservations (check_in_time et check_out_time)
    const horairesMap = {};
    reservations.forEach(r => {
        horairesMap[r.id] = {
            arrivee: r.check_in_time || '17:00',
            depart: r.check_out_time || '10:00'
        };
    });
    
    // Les 7 prochains jours (aujourd'hui + 6 jours)
    const in7Days = new Date(today);
    in7Days.setDate(today.getDate() + 6);
    
    // DÉDOUBLONNER par ID (garder la première occurrence)
    const uniqueById = {};
    reservations.forEach(r => {
        if (!uniqueById[r.id]) uniqueById[r.id] = r;
    });
    const uniqueReservations = Object.values(uniqueById);
    
    // Filtrer les réservations (7 prochains jours)
    const filtered = uniqueReservations.filter(r => {
        const dateDebut = parseLocalDate(r.dateDebut);
        const dateFin = parseLocalDate(r.dateFin);
        dateDebut.setHours(0, 0, 0, 0);
        dateFin.setHours(0, 0, 0, 0);
        
        // 1. Masquer si terminée (dateFin <= aujourd'hui)
        if (dateFin <= today) return false;
        
        // 2. Masquer si réservation d'une seule nuit
        const nuits = Math.ceil((dateFin - dateDebut) / (1000 * 60 * 60 * 24));
        if (nuits <= 1) return false;
        
        // 3. Afficher si début dans les 7 prochains jours
        if (dateDebut >= today && dateDebut <= in7Days) return true;
        
        // 4. Afficher si fin dans les 7 prochains jours (séjour en cours)
        if (dateFin >= today && dateFin <= in7Days && dateDebut < today) return true;
        
        return false;
    }).sort((a, b) => parseLocalDate(a.dateDebut) - parseLocalDate(b.dateDebut));
    
    const container = document.getElementById('dashboard-reservations');
    if (!container) return;
    
    if (filtered.length === 0) {
        window.SecurityUtils.setInnerHTML(container, '<p style="text-align: center; color: #999; padding: 40px;">Aucune réservation dans les 7 prochains jours</p>');
        return;
    }
    
    let html = '';
    for (const r of filtered) {
        const dateDebut = parseLocalDate(r.dateDebut);
        const dateFin = parseLocalDate(r.dateFin);
        dateDebut.setHours(0, 0, 0, 0);
        dateFin.setHours(0, 0, 0, 0);
        
        const isArrivalToday = dateDebut.getTime() === today.getTime();
        const isDepartureToday = dateFin.getTime() === today.getTime();
        
        // Récupérer les horaires validées
        const horaireArrivee = horairesMap[r.id]?.arrivee || '17:00';
        const horaireDepart = horairesMap[r.id]?.depart || '10:00';
        
        // Charger la progression checklist (si feature activée)
        let checklistProgress = { entree: { total: 0, completed: 0, percent: 0 }, sortie: { total: 0, completed: 0, percent: 0 } };
        if (CHECKLIST_FEATURE_ENABLED) {
            checklistProgress = await getReservationChecklistProgressDashboard(r.id, r.gite_id);
        }
        
        let badge = '';
        let badgeColor = '';
        if (isArrivalToday) {
            badge = '📥 Arrivée AUJOURD\'HUI';
            badgeColor = '#27AE60';
        } else if (isDepartureToday) {
            badge = '📤 Départ AUJOURD\'HUI';
            badgeColor = '#E74C3C';
        } else if (dateDebut > today) {
            badge = '📥 Arrivée prochaine';
            badgeColor = '#3498DB';
        } else {
            badge = '🏠 Séjour en cours';
            badgeColor = '#9B59B6';
        }
        
        const gite = await window.gitesManager.getByName(r.gite) || await window.gitesManager.getById(r.gite_id);
        const giteColor = gite ? gite.color : '#667eea';
        const paiementIcon = r.paiement === 'Soldé' ? '✅' : r.paiement === 'Acompte reçu' ? '⏳' : '❌';
        
        // Calculer jours avant arrivée
        const daysUntilArrival = Math.ceil((dateDebut - today) / (1000 * 60 * 60 * 24));
        const shouldSendReminder = daysUntilArrival === 3;
        
        // Masquer bouton fiche client si départ aujourd'hui ou passé
        const showFicheButton = dateFin > today;
        
        // Affichage checklist avec indicateur
        let checklistHtml = '';
        if (checklistProgress.entree.total > 0 || checklistProgress.sortie.total > 0) {
            checklistHtml = '<div style="display: flex; gap: 10px; font-size: 0.85rem; margin-top: 8px;">';
            
            if (checklistProgress.entree.total > 0) {
                const colorEntree = getProgressColorDashboard(checklistProgress.entree.percent);
                checklistHtml += `
                    <span style="display: flex; align-items: center; gap: 4px;">
                        <span style="width: 10px; height: 10px; border-radius: 50%; background: ${colorEntree};"></span>
                        🚪 Entrée: ${checklistProgress.entree.completed}/${checklistProgress.entree.total}
                    </span>
                `;
            }
            
            if (checklistProgress.sortie.total > 0) {
                const colorSortie = getProgressColorDashboard(checklistProgress.sortie.percent);
                checklistHtml += `
                    <span style="display: flex; align-items: center; gap: 4px;">
                        <span style="width: 10px; height: 10px; border-radius: 50%; background: ${colorSortie};"></span>
                        🧳 Sortie: ${checklistProgress.sortie.completed}/${checklistProgress.sortie.total}
                    </span>
                `;
            }
            
            checklistHtml += '</div>';
        }
        
        // 📱 DÉTECTION MOBILE/DESKTOP - Rendu conditionnel
        const isMobile = window.innerWidth <= 768 || document.documentElement.classList.contains('is-mobile');
        
        if (isMobile) {
            // ========================================
            // 📱 FORMAT MOBILE - COMPACT 3 LIGNES
            // ========================================
            html += `
                <div style="background: #ffffff; border: 2px solid ${giteColor}; padding: 10px; border-radius: 10px; box-shadow: 2px 2px 0 #2D3436; margin-bottom: 8px;">
                    <div style="font-size: 0.8rem; font-weight: 700; color: #2D3436; margin-bottom: 6px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${r.nom}</div>
                    <div style="font-size: 0.7rem; color: #27AE60; margin-bottom: 3px; font-weight: 600;">📥 ${formatDateFromObj(dateDebut).split(' ').slice(0,2).join(' ')} ${horaireArrivee}</div>
                    <div style="font-size: 0.7rem; color: #E74C3C; margin-bottom: 6px; font-weight: 600;">📤 ${formatDateFromObj(dateFin).split(' ').slice(0,2).join(' ')} ${horaireDepart}</div>
                    ${showFicheButton ? `<button onclick="aperçuFicheClient('${r.id}')" style="width: 100%; background: #74b9ff; color: white; border: 2px solid #2D3436; padding: 6px; border-radius: 8px; cursor: pointer; font-size: 0.7rem; font-weight: 600; box-shadow: 2px 2px 0 #2D3436;">📄 Fiche</button>` : ''}
                </div>
            `;
        } else {
            // ========================================
            // 💻 FORMAT DESKTOP - DÉTAILS COMPLETS
            // ========================================
            html += `
                <div style="background: white; border: 3px solid ${giteColor}; padding: 15px; border-radius: 12px; box-shadow: 4px 4px 0 #2D3436; position: relative; display: flex; flex-direction: column; overflow: hidden; z-index: 1;">
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
                        <div style="flex: 1;">
                            <strong style="font-size: 1.05rem; color: #2D3436; display: block; margin-bottom: 8px;">${r.nom}</strong>
                            ${shouldSendReminder ? '<div style="position: absolute; top: 15px; right: 68px; background: #ffeaa7; color: #2D3436; padding: 5px 10px; border: 2px solid #2D3436; box-shadow: 2px 2px 0 #2D3436; border-radius: 8px; font-size: 0.7rem; font-weight: 700;">⚡ J-3 : Fiche</div>' : ''}
                            <div style="margin-bottom: 8px;">
                                <span style="background: ${badgeColor}; color: white; padding: 3px 8px; border: 2px solid #2D3436; box-shadow: 2px 2px 0 #2D3436; border-radius: 6px; font-size: 0.7rem; font-weight: 700; display: inline-block;">${badge}</span>
                            </div>
                            <div style="color: #666; font-size: 0.8rem; margin-bottom: 4px; display: flex; align-items: center; gap: 4px;">
                                <svg viewBox="0 0 64 64" style="width:16px;height:16px;flex-shrink:0;" stroke="#2D3436" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="10" width="48" height="46" rx="4" fill="#ffffff"/><path d="M8 10h48v12H8z" fill="#0984e3" stroke="none"/><path d="M8 22h48" fill="none"/><line x1="18" y1="6" x2="18" y2="14"/><line x1="46" y1="6" x2="46" y2="14"/><polyline points="22 40 30 48 44 32" stroke="#55efc4" stroke-width="4" fill="none"/></svg>
                                <span style="min-width: 120px;">${formatDateFromObj(dateDebut)}</span>
                                <strong style="color: #27AE60; display: flex; align-items: center; gap: 2px;"><svg viewBox="0 0 64 64" style="width:14px;height:14px;flex-shrink:0;" stroke="#2D3436" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="32" cy="36" r="18" fill="#ffffff"/><path d="M32 36l4-8" fill="none"/><path d="M32 36l6 4" fill="none"/><path d="M18 16l4 4" stroke-width="4" stroke="#ff7675" fill="none"/><path d="M46 16l-4 4" stroke-width="4" stroke="#ff7675" fill="none"/><path d="M14 12a4 4 0 0 1 6 2" fill="#ff7675"/><path d="M50 12a4 4 0 0 0-6 2" fill="#ff7675"/></svg> ${horaireArrivee}</strong>
                            </div>
                            <div style="color: #666; font-size: 0.8rem; display: flex; align-items: center; gap: 4px;">
                                <svg viewBox="0 0 64 64" style="width:16px;height:16px;flex-shrink:0;opacity:0;pointer-events:none;" stroke="#2D3436" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="10" width="48" height="46" rx="4" fill="#ffffff"/></svg>
                                <span style="min-width: 120px;">${formatDateFromObj(dateFin)}</span>
                                <strong style="color: #E74C3C; display: flex; align-items: center; gap: 2px;"><svg viewBox="0 0 64 64" style="width:14px;height:14px;flex-shrink:0;" stroke="#2D3436" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="32" cy="36" r="18" fill="#ffffff"/><path d="M32 36l4-8" fill="none"/><path d="M32 36l6 4" fill="none"/><path d="M18 16l4 4" stroke-width="4" stroke="#ff7675" fill="none"/><path d="M46 16l-4 4" stroke-width="4" stroke="#ff7675" fill="none"/><path d="M14 12a4 4 0 0 1 6 2" fill="#ff7675"/><path d="M50 12a4 4 0 0 0-6 2" fill="#ff7675"/></svg> ${horaireDepart}</strong>
                                <span style="background: #f0f0f0; padding: 2px 6px; border-radius: 4px; font-weight: 600; font-size: 0.75rem;">${r.nuits}n</span>
                            </div>
                            <div style="display: flex; gap: 10px; font-size: 0.75rem; color: #666; margin-top: 6px; flex-wrap: wrap;">
                                <span style="display: flex; align-items: center; gap: 3px;"><svg viewBox="0 0 64 64" style="width:14px;height:14px;display:inline-block;vertical-align:middle;" stroke="#2D3436" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="14" y="28" width="36" height="28" fill="#ffffff"/><path d="M8 28 L32 8 L56 28" fill="#ff7675"/><rect x="42" y="10" width="6" height="10" fill="#ff7675"/><rect x="26" y="40" width="12" height="16" fill="#0984e3"/><rect x="18" y="34" width="6" height="6" fill="#74b9ff"/></svg> <strong>${r.gite}</strong></span>
                                <span>👥 <strong>${r.nbPersonnes || '-'}</strong></span>
                                ${daysUntilArrival >= 0 ? `<span style="color: ${daysUntilArrival <= 3 ? '#F39C12' : '#999'}; font-weight: 600; display: flex; align-items: center; gap: 3px;"><svg viewBox="0 0 64 64" style="width:14px;height:14px;display:inline-block;vertical-align:middle;" stroke="#2D3436" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="10" width="48" height="46" rx="4" fill="#ffffff"/><path d="M8 10h48v12H8z" fill="#0984e3" stroke="none"/><path d="M8 22h48" fill="none"/><line x1="18" y1="6" x2="18" y2="14"/><line x1="46" y1="6" x2="46" y2="14"/><polyline points="22 40 30 48 44 32" stroke="#55efc4" stroke-width="4" fill="none"/></svg> J${daysUntilArrival > 0 ? '-' + daysUntilArrival : ''}</span>` : ''}
                            </div>
                            ${checklistHtml}
                        </div>
                        <span style="font-size: 1.3rem; position: absolute; top: 15px; right: 15px;" title="${r.paiement}">${paiementIcon}</span>
                    </div>
                    <div style="margin-top: 10px; padding-top: 10px; border-top: 2px solid #e0e0e0; display: flex; gap: 6px;">
                        ${showFicheButton ? `
                        <button onclick="aperçuFicheClient('${r.id}')" class="btn-neo"
                                style="flex: 1; background: #74b9ff; color: white; border: 2px solid #2D3436; box-shadow: 2px 2px 0 #2D3436; padding: 6px 10px; border-radius: 8px; cursor: pointer; font-size: 0.75rem; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 4px; transition: transform 0.1s;" onmouseover="this.style.transform='translate(-2px, -2px)';this.style.boxShadow='4px 4px 0 #2D3436'" onmouseout="this.style.transform='translate(0, 0)';this.style.boxShadow='2px 2px 0 #2D3436'">
                            📄 Fiche
                        </button>
                        ` : ''}
                        <button onclick="openEditReservation('${r.id}')" class="btn-neo"
                                style="background: white; color: #2D3436; border: 2px solid #2D3436; box-shadow: 2px 2px 0 #2D3436; padding: 6px 10px; border-radius: 8px; cursor: pointer; font-size: 0.75rem; font-weight: 600; transition: transform 0.1s;" onmouseover="this.style.transform='translate(-2px, -2px)';this.style.boxShadow='4px 4px 0 #2D3436'" onmouseout="this.style.transform='translate(0, 0)';this.style.boxShadow='2px 2px 0 #2D3436'">
                            ✏️
                        </button>
                    </div>
                </div>
            `;
        }
    }
    
    window.SecurityUtils.setInnerHTML(container, html);
}

// ==========================================
// 🧹 MÉNAGES DE LA SEMAINE
// ==========================================

async function updateDashboardMenages() {
    // console.log('🧹 updateDashboardMenages() début');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay() + 1);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    
    const { data: cleanings } = await window.supabaseClient
        .from('cleaning_schedule')
        .select('*')
        .gte('scheduled_date', weekStart.toISOString().split('T')[0])
        .lte('scheduled_date', weekEnd.toISOString().split('T')[0])
        .order('scheduled_date', { ascending: true });
    
    const container = document.getElementById('dashboard-menages');
    if (!container) return;
    
    if (!cleanings || cleanings.length === 0) {
        window.SecurityUtils.setInnerHTML(container, '<p style="text-align: center; color: #999; padding: 40px;">Aucun ménage prévu cette semaine</p>');
        return;
    }
    
    let html = '';
    for (const c of cleanings) {
        const statusIcons = {
            'validated': '✅',
            'pending_validation': '⏳',
            'refused': '❌',
            'pending': '✗'
        };
        const statusColors = {
            'validated': '#27AE60',
            'pending_validation': '#F39C12',
            'refused': '#E74C3C',
            'pending': '#E74C3C'
        };
        
        const statusLabels = {
            'validated': 'Validé',
            'pending_validation': 'En attente',
            'refused': 'Refusé',
            'pending': 'Non planifié'
        };
        
        const icon = statusIcons[c.status] || '❓';
        const color = statusColors[c.status] || '#999';
        const statusLabel = statusLabels[c.status] || 'Inconnu';
        const timeIcon = c.time_of_day === 'morning' ? '🌅' : '🌆';
        const gite = await window.gitesManager?.getByName(c.gite) || await window.gitesManager?.getById(c.gite_id);
        const giteColor = gite ? gite.color : '#667eea';
        const giteName = gite ? (gite.name || gite.nom || c.gite) : c.gite;
        
        html += `
            <div style="border-left: 4px solid ${giteColor}; padding: 12px; margin-bottom: 8px; background: #f8f9fa; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
                <div style="flex: 1;">
                    <strong style="color: ${giteColor};">${giteName || 'Gîte inconnu'}</strong>
                    <div style="font-size: 0.85rem; color: #666; margin-top: 4px;">
                        📅 ${formatDateFromObj(new Date(c.scheduled_date))} ${timeIcon}
                    </div>
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="font-size: 0.8rem; color: ${color}; font-weight: 600; background: ${color}22; padding: 4px 10px; border-radius: 12px;">${statusLabel}</span>
                    <span style="font-size: 1.5rem; color: ${color};" title="${statusLabel}">${icon}</span>
                </div>
            </div>
        `;
    }

    window.SecurityUtils.setInnerHTML(container, html);
}

// ==========================================
// ==========================================

async function updateTodoLists() {
    await updateTodoList('reservations');
    await updateTodoList('travaux');
    await updateTodoList('achats');
    
    // Mettre à jour les compteurs après modification des todos
    await updateDashboardStats();
}

async function updateTodoList(category) {
    try {
        const { data: todos, error } = await window.supabaseClient
            .from('todos')
            .select('*')
            .eq('completed', false)
            .eq('category', category)
            .order('created_at', { ascending: true });
        
        if (error) {
            console.error('Erreur chargement todos:', error);
            return;
        }
        
        const container = document.getElementById(`todo-${category}`);
        if (!container) return;
        
        if (!todos || todos.length === 0) {
            window.SecurityUtils.setInnerHTML(container, '<p style="text-align: center; color: #999; padding: 20px; font-size: 0.9rem;">Aucune tâche</p>');
            return;
        }
        
        // Récupérer les noms des gîtes si nécessaire
        const giteIds = [...new Set(todos.filter(t => t.gite_id).map(t => t.gite_id))];
        let gitesMap = {};
        
        if (giteIds.length > 0) {
            const { data: gites } = await window.supabaseClient
                .from('gites')
                .select('id, name')
                .in('id', giteIds);
            
            if (gites) {
                gitesMap = Object.fromEntries(gites.map(g => [g.id, g.name]));
            }
        }
        
        let html = '';
        todos.forEach(todo => {
            const giteName = todo.gite_id ? (gitesMap[todo.gite_id] || '') : '';
            
            html += `
                <div style="display: flex; gap: 12px; padding: 14px; margin-bottom: 8px; background: white; border-radius: 8px; border: 1px solid #e9ecef; align-items: start; transition: all 0.2s;">
                    <input type="checkbox" onchange="toggleTodo('${todo.id}', this.checked)" 
                           style="width: 20px; height: 20px; cursor: pointer; margin-top: 3px; flex-shrink: 0;">
                    <div style="flex: 1;">
                        <div style="font-weight: 500; font-size: 0.95rem; margin-bottom: 6px; line-height: 1.4; color: #2c3e50;">
                            ${todo.title}
                        </div>
                        ${todo.description ? `<div style="font-size: 0.85rem; color: #6c757d; margin-bottom: 8px; line-height: 1.5;">${todo.description}</div>` : ''}
                        <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                            ${giteName ? `<span class="gite-badge" style="background: #667eea; color: white; padding: 3px 10px; border-radius: 6px; font-size: 0.75rem; font-weight: 500;">${giteName}</span>` : ''}
                            ${todo.priority ? `<span class="priority-badge" style="background: ${todo.priority === 'urgent' ? '#E74C3C' : todo.priority === 'high' ? '#F39C12' : '#95a5a6'}; color: white; padding: 3px 10px; border-radius: 6px; font-size: 0.75rem; font-weight: 500;">${todo.priority}</span>` : ''}
                        </div>
                    </div>
                    <button onclick="editTodo('${todo.id}')" 
                            style="background: #e3f2fd; border: 1px solid #90caf9; color: #1976d2; cursor: pointer; font-size: 1rem; padding: 4px 10px; border-radius: 6px; flex-shrink: 0; transition: all 0.2s; line-height: 1;"
                            onmouseover="this.style.background='#1976d2'; this.style.color='white';"
                            onmouseout="this.style.background='#e3f2fd'; this.style.color='#1976d2';"
                            title="Modifier">✏️</button>
                    <button onclick="deleteTodo('${todo.id}')" 
                            style="background: #fee; border: 1px solid #fcc; color: #E74C3C; cursor: pointer; font-size: 1.3rem; padding: 4px 10px; border-radius: 6px; flex-shrink: 0; transition: all 0.2s; line-height: 1;"
                            onmouseover="this.style.background='#E74C3C'; this.style.color='white';"
                            onmouseout="this.style.background='#fee'; this.style.color='#E74C3C';"
                            title="Supprimer">×</button>
                </div>`;
        });
        
        window.SecurityUtils.setInnerHTML(container, html);
    } catch (err) {
        console.error('Erreur dans updateTodoList:', err);
    }
}

async function addTodoItem(category) {
    console.log('🎯 addTodoItem appelé pour:', category);
    
    // Supprimer ancien modal s'il existe
    document.querySelectorAll('.modal-todo-dynamic').forEach(m => m.remove());
    
    // Créer le modal dynamiquement (comme fiche-client)
    const modal = document.createElement('div');
    modal.className = 'modal-todo-dynamic';
    modal.style.cssText = `
        position: fixed;
        top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0,0,0,0.75);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        padding: 20px;
    `;
    
    const showGiteSelector = category === 'travaux';
    
    window.SecurityUtils.setInnerHTML(modal, `
        <div style="background: white; border-radius: 16px; padding: 25px; max-width: 500px; width: 100%; box-shadow: 0 20px 60px rgba(0,0,0,0.3); max-height: 90vh; overflow-y: auto;">
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 20px;">
                <span style="font-size: 1.5rem;">📝</span>
                <h2 style="margin: 0; font-size: 1.2rem; color: #2c3e50;">Nouvelle Tâche</h2>
            </div>
            
            <form id="addTodoFormDynamic">
                <input type="hidden" id="todoCategoryDynamic" value="${category}">
                
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #2c3e50;">
                        Titre <span style="color: #E74C3C;">*</span>
                    </label>
                    <input type="text" id="todoTitleDynamic" required 
                           placeholder="Ex: Réparer robinet"
                           style="width: 100%; padding: 10px; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 1rem;">
                </div>
                
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #2c3e50;">Description</label>
                    <textarea id="todoDescriptionDynamic" rows="3" 
                              placeholder="Détails supplémentaires..."
                              style="width: 100%; padding: 10px; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 1rem; resize: vertical;"></textarea>
                </div>
                
                ${showGiteSelector ? `
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #2c3e50;">Gîte concerné</label>
                    <select id="todoGiteDynamic" style="width: 100%; padding: 10px; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 1rem;">
                        <option value="">Non spécifié</option>
                        <option value="Trevoux">Trevoux</option>
                        <option value="Couzon">Couzon</option>
                    </select>
                </div>
                ` : ''}
                
                <div style="margin-bottom: 15px;">
                    <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                        <input type="checkbox" id="todoRecurrentDynamic" style="width: 18px; height: 18px; cursor: pointer;">
                        <span style="font-weight: 600;">🔁 Tâche récurrente</span>
                    </label>
                </div>
                
                <div id="recurrentOptionsDynamic" style="display: none; margin-left: 26px; margin-bottom: 15px;">
                    <div style="margin-bottom: 10px;">
                        <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #2c3e50;">Fréquence</label>
                        <select id="todoFrequencyDynamic" style="width: 100%; padding: 10px; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 1rem;">
                            <option value="weekly">Hebdomadaire</option>
                            <option value="biweekly">Bimensuelle (2 semaines)</option>
                            <option value="monthly">Mensuelle</option>
                        </select>
                    </div>
                    
                    <div id="weeklyOptionsDynamic" style="margin-bottom: 10px;">
                        <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #2c3e50;">Jour de la semaine</label>
                        <select id="todoWeekdayDynamic" style="width: 100%; padding: 10px; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 1rem;">
                            <option value="1">Lundi</option>
                            <option value="2">Mardi</option>
                            <option value="3">Mercredi</option>
                            <option value="4">Jeudi</option>
                            <option value="5">Vendredi</option>
                            <option value="6">Samedi</option>
                            <option value="0">Dimanche</option>
                        </select>
                    </div>
                    
                    <div id="monthlyOptionsDynamic" style="display: none; margin-bottom: 10px;">
                        <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #2c3e50;">Jour du mois</label>
                        <input type="number" id="todoDayOfMonthDynamic" min="1" max="31" value="1" 
                               style="width: 100%; padding: 10px; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 1rem;">
                    </div>
                </div>
                
                <div style="display: flex; gap: 10px; margin-top: 20px;">
                    <button type="submit" 
                            style="flex: 1; padding: 12px; background: linear-gradient(135deg, #2ecc71 0%, #27ae60 100%); color: white; border: none; border-radius: 10px; font-size: 1rem; font-weight: 600; cursor: pointer;">
                        ✓ Créer
                    </button>
                    <button type="button" id="btn-cancel-todo" 
                            style="padding: 12px 20px; background: #95a5a6; color: white; border: none; border-radius: 10px; font-size: 1rem; font-weight: 600; cursor: pointer;">
                        Annuler
                    </button>
                </div>
            </form>
        </div>
    `);
    
    document.body.appendChild(modal);
    console.log('✅ Modal TODO créé et ajouté au body');
    
    // Gestion de la checkbox récurrente
    const recurrentCheckbox = document.getElementById('todoRecurrentDynamic');
    const recurrentOptions = document.getElementById('recurrentOptionsDynamic');
    const frequencySelect = document.getElementById('todoFrequencyDynamic');
    const weeklyOptions = document.getElementById('weeklyOptionsDynamic');
    const monthlyOptions = document.getElementById('monthlyOptionsDynamic');
    
    if (recurrentCheckbox) {
        recurrentCheckbox.addEventListener('change', function() {
            recurrentOptions.style.display = this.checked ? 'block' : 'none';
        });
    }
    
    if (frequencySelect) {
        frequencySelect.addEventListener('change', function() {
            if (this.value === 'monthly') {
                weeklyOptions.style.display = 'none';
                monthlyOptions.style.display = 'block';
            } else {
                weeklyOptions.style.display = 'block';
                monthlyOptions.style.display = 'none';
            }
        });
    }
    
    // Bouton annuler
    document.getElementById('btn-cancel-todo').onclick = () => {
        console.log('🚪 Annulation');
        modal.remove();
    };
    
    // Clic sur le fond pour fermer
    modal.onclick = (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    };
    
    // Soumission du formulaire
    document.getElementById('addTodoFormDynamic').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const title = document.getElementById('todoTitleDynamic').value.trim();
        const description = document.getElementById('todoDescriptionDynamic').value.trim();
        const isRecurrent = document.getElementById('todoRecurrentDynamic').checked;
        
        if (!title) {
            alert('Le titre est obligatoire');
            return;
        }
        
        // Récupérer l'user ID (API Supabase v2)
        const { data: { user } } = await window.supabaseClient.auth.getUser();
        
        const todoData = {
            owner_user_id: user?.id,
            category: category,
            title: title,
            description: description || null,
            completed: false,
            created_at: new Date().toISOString()
        };
        
        // Gîte pour travaux
        if (showGiteSelector) {
            const giteSelect = document.getElementById('todoGiteDynamic');
            if (giteSelect && giteSelect.value) {
                todoData.gite = giteSelect.value;
            }
        }
        
        // Récurrence
        if (isRecurrent) {
            const frequency = document.getElementById('todoFrequencyDynamic').value;
            todoData.recurrent = true;
            todoData.frequency = frequency;
            
            if (frequency === 'monthly') {
                todoData.frequency_detail = document.getElementById('todoDayOfMonthDynamic').value;
            } else {
                todoData.frequency_detail = document.getElementById('todoWeekdayDynamic').value;
            }
            
            todoData.next_occurrence = calculateNextOccurrence(frequency, todoData.frequency_detail);
        }
        
        console.log('💾 Création TODO:', todoData);
        
        // Insérer dans Supabase
        const { data, error } = await window.supabaseClient
            .from('todos')
            .insert(todoData)
            .select()
            .single();
        
        if (error) {
            console.error('❌ Erreur création TODO:', error);
            alert('Erreur lors de la création de la tâche');
            return;
        }
        
        console.log('✅ TODO créé:', data);
        modal.remove();
        
        // Rafraîchir la liste
        await updateTodoList(category);
    });
}

function closeAddTodoModal() {
    const modal = document.getElementById('addTodoModal');
    console.log('🚪 Fermeture modal');
    modal.style.cssText = 'display: none !important;';
    modal.classList.remove('show');
    document.getElementById('addTodoForm').reset();
}

// Gestion du formulaire d'ajout de tâche
let todoModalInitialized = false;

// Supprimé - le modal est maintenant créé dynamiquement dans addTodoItem()

function calculateNextOccurrence(frequency, frequencyDetail) {
    const now = new Date();
    const next = new Date(now);
    
    switch (frequency) {
        case 'weekly':
            const targetDay = frequencyDetail?.day_of_week || 1;
            const currentDay = next.getDay() || 7;
            const daysUntilTarget = (targetDay - currentDay + 7) % 7 || 7;
            next.setDate(next.getDate() + daysUntilTarget);
            break;
        case 'biweekly':
            const biweeklyTargetDay = frequencyDetail?.day_of_week || 1;
            const biweeklyCurrentDay = next.getDay() || 7;
            const biweeklyDaysUntilTarget = (biweeklyTargetDay - biweeklyCurrentDay + 7) % 7 || 7;
            next.setDate(next.getDate() + biweeklyDaysUntilTarget + 14);
            break;
        case 'monthly':
            const dayOfMonth = frequencyDetail?.day_of_month || 1;
            next.setMonth(next.getMonth() + 1);
            next.setDate(dayOfMonth);
            break;
    }
    
    // Toujours mettre à minuit pour être visible dès le début de la journée
    next.setHours(0, 0, 0, 0);
    
    return next.toISOString();
}

async function toggleTodo(id, completed) {
    if (completed) {
        // Marquer comme terminé
        const { error } = await window.supabaseClient
            .from('todos')
            .update({ 
                completed: true,
                completed_at: new Date().toISOString()
            })
            .eq('id', id);
        
        if (error) {
            console.error('❌ Erreur mise à jour todo:', error);
            showToast('Erreur lors de la mise à jour', 'error');
            return;
        }
        
        showToast('✓ Tâche terminée', 'success');
    } else {
        // Réactiver la tâche
        const { error } = await window.supabaseClient
            .from('todos')
            .update({ 
                completed: false,
                completed_at: null
            })
            .eq('id', id);
        
        if (error) {
            console.error('❌ Erreur mise à jour todo:', error);
            showToast('Erreur lors de la mise à jour', 'error');
            return;
        }
        
        showToast('↺ Tâche réactivée', 'success');
    }
    
    await updateTodoLists();
    await updateDashboardStats();
}

async function deleteTodo(id) {
    if (!confirm('Supprimer cette tâche ?')) return;
    
    const { error } = await window.supabaseClient
        .from('todos')
        .delete()
        .eq('id', id);
    
    if (error) {
        console.error('Erreur suppression todo:', error);
        return;
    }
    
    // Recharger toutes les listes
    await updateTodoLists();
    await updateDashboardStats();
}

async function editTodo(id) {
    // Récupérer la tâche
    const { data: todo, error } = await window.supabaseClient
        .from('todos')
        .select('*')
        .eq('id', id)
        .single();
    
    if (error || !todo) {
        console.error('Erreur chargement tâche:', error);
        showToast('Erreur lors du chargement', 'error');
        return;
    }
    
    // Vérifier que le modal existe et l'initialiser si nécessaire
    const modal = document.getElementById('addTodoModal');
    if (!modal) {
        console.error('❌ Modal addTodoModal introuvable');
        showToast('Erreur : interface non disponible', 'error');
        return;
    }
    
    // S'assurer que le modal est initialisé
    if (!todoModalInitialized) {
        initAddTodoModal();
    }
    
    // Ouvrir le modal en mode édition
    const modalTitle = modal.querySelector('.modal-header h2');
    if (modalTitle) {
        modalTitle.textContent = '✏️ Modifier la tâche';
    }
    
    // Remplir le formulaire
    const titleInput = document.getElementById('todoTitle');
    const descInput = document.getElementById('todoDescription');
    const giteSelect = document.getElementById('todoGite');
    
    if (titleInput) titleInput.value = todo.title || '';
    if (descInput) descInput.value = todo.description || '';
    if (giteSelect) giteSelect.value = todo.gite || '';
    
    // Gérer la récurrence
    const isRecurrentCheckbox = document.getElementById('todoRecurrent');
    const recurrentOptions = document.getElementById('recurrentOptions');
    
    if (isRecurrentCheckbox) {
        isRecurrentCheckbox.checked = todo.is_recurrent || false;
        if (recurrentOptions) {
            recurrentOptions.style.display = todo.is_recurrent ? 'block' : 'none';
        }
    }
    
    if (todo.is_recurrent) {
        const frequencySelect = document.getElementById('todoFrequency');
        const daySelect = document.getElementById('todoWeekday');
        
        if (frequencySelect) frequencySelect.value = todo.frequency || 'weekly';
        if (daySelect && todo.frequency_detail?.day_of_week) {
            daySelect.value = todo.frequency_detail.day_of_week;
        }
    }
    
    // Modifier le bouton de soumission
    const submitBtn = modal.querySelector('button[type="submit"]');
    submitBtn.textContent = '💾 Enregistrer';
    submitBtn.onclick = async (e) => {
        e.preventDefault();
        
        const title = document.getElementById('todoTitle').value.trim();
        if (!title) {
            showToast('Le titre est obligatoire', 'error');
            return;
        }
        
        const updateData = {
            title: title,
            description: document.getElementById('todoDescription').value.trim(),
            gite: document.getElementById('todoGite').value || null
        };
        
        // Si c'est une tâche récurrente, mettre à jour les options
        if (isRecurrentCheckbox?.checked) {
            updateData.is_recurrent = true;
            updateData.frequency = document.getElementById('todoFrequency').value;
            const dayOfWeek = document.getElementById('todoWeekday').value;
            updateData.frequency_detail = { day_of_week: parseInt(dayOfWeek) };
            
            // Recalculer next_occurrence si le jour a changé
            if (todo.frequency_detail?.day_of_week !== parseInt(dayOfWeek) || 
                todo.frequency !== updateData.frequency) {
                updateData.next_occurrence = calculateNextOccurrence(
                    updateData.frequency, 
                    updateData.frequency_detail
                );
            }
        }
        
        const { error: updateError } = await window.supabaseClient
            .from('todos')
            .update(updateData)
            .eq('id', id);
        
        if (updateError) {
            console.error('Erreur mise à jour:', updateError);
            showToast('Erreur lors de la mise à jour', 'error');
            return;
        }
        
        showToast('✓ Tâche modifiée', 'success');
        closeAddTodoModal();
        await updateTodoList(todo.category);
        await updateDashboardStats();
    };
    
    modal.style.display = 'flex';
}

// Helper pour ouvrir l'édition d'une réservation
function openEditReservation(id) {
    window.openEditModal(id);
}

// Helper pour ouvrir la fiche client - VERSION SIMPLE
function openFicheClient(reservationId) {
    // Appeler directement aperçuFicheClient qui marche déjà
    if (typeof window.aperçuFicheClient === 'function') {
        window.aperçuFicheClient(reservationId);
    } else {
        console.error('❌ aperçuFicheClient non disponible');
        alert('Erreur: Module fiche client non chargé');
    }
}

// ==========================================
// ==========================================

async function updateFinancialIndicators() {
    
    const anneeActuelle = new Date().getFullYear();
    const anneePrecedente = anneeActuelle - 1;
    const moisActuel = new Date().getMonth() + 1; // 1-12
    
    // 1. Calculer le bénéfice RÉEL de l'année en cours
    const reservations = await getAllReservations();
    // Note: Table 'charges' n'existe plus, remplacée par historical_data dans l'onglet Charges
    // const charges = await getAllCharges();
    
    // Filtrer par année actuelle
    const reservationsAnnee = reservations.filter(r => {
        const dateDebut = parseLocalDate(r.dateDebut);
        return dateDebut.getFullYear() === anneeActuelle;
    });
    
    // Filtrer par mois actuel
    const reservationsMois = reservations.filter(r => {
        const dateDebut = parseLocalDate(r.dateDebut);
        return dateDebut.getFullYear() === anneeActuelle && 
               dateDebut.getMonth() + 1 === moisActuel;
    });
    
    // Calculer CA année
    const caAnnee = reservationsAnnee.reduce((sum, r) => sum + (parseFloat(r.montant) || 0), 0);
    
    // Calculer CA mois
    const caMois = reservationsMois.reduce((sum, r) => sum + (parseFloat(r.montant) || 0), 0);
    
    // Mettre à jour l'affichage des CA
    const caMoisEl = document.getElementById('dashboard-ca-mois');
    const caAnneeEl = document.getElementById('dashboard-ca-annee');
    const anneeCAEl = document.getElementById('annee-ca');
    
    if (caMoisEl) caMoisEl.textContent = formatCurrency(caMois);
    if (caAnneeEl) caAnneeEl.textContent = formatCurrency(caAnnee);
    if (anneeCAEl) anneeCAEl.textContent = anneeActuelle;
    
    // Récupérer le Total Charges depuis la simulation fiscale de l'année en cours
    let simFiscale = null;
    try {
        const { data } = await window.supabaseClient
            .from('simulations_fiscales')
            .select('*')
            .eq('annee', anneeActuelle)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
        simFiscale = data;
    } catch (error) {
        // Table non créée ou erreur - continuer sans simulation
    }
    
    let totalChargesAnnee = 0;
    
    if (simFiscale) {
        // Calculer le total selon la même formule que fiscalité-v2.js
        // Couzon (sans amortissement)
        const chargesCouzon = (
            simFiscale.internet_couzon || 0) * (simFiscale.internet_couzon_type === 'mensuel' ? 12 : 1) +
            (simFiscale.eau_couzon || 0) * (simFiscale.eau_couzon_type === 'mensuel' ? 12 : 1) +
            (simFiscale.electricite_couzon || 0) * (simFiscale.electricite_couzon_type === 'mensuel' ? 12 : 1) +
            (simFiscale.assurance_hab_couzon || 0) * (simFiscale.assurance_hab_couzon_type === 'mensuel' ? 12 : 1) +
            (simFiscale.assurance_emprunt_couzon || 0) * (simFiscale.assurance_emprunt_couzon_type === 'mensuel' ? 12 : 1) +
            (simFiscale.interets_emprunt_couzon || 0) * (simFiscale.interets_emprunt_couzon_type === 'mensuel' ? 12 : 1) +
            (simFiscale.menage_couzon || 0) * (simFiscale.menage_couzon_type === 'mensuel' ? 12 : 1) +
            (simFiscale.linge_couzon || 0) * (simFiscale.linge_couzon_type === 'mensuel' ? 12 : 1) +
            (simFiscale.logiciel_couzon || 0) * (simFiscale.logiciel_couzon_type === 'mensuel' ? 12 : 1) +
            (simFiscale.copropriete_couzon || 0) * (simFiscale.copropriete_couzon_type === 'mensuel' ? 12 : 1) +
            (simFiscale.taxe_fonciere_couzon || 0) +
            (simFiscale.cfe_couzon || 0) +
            (simFiscale.commissions_couzon || 0);
        
        // Trevoux (sans amortissement)
        const chargesTrevoux = (
            simFiscale.internet_trevoux || 0) * (simFiscale.internet_trevoux_type === 'mensuel' ? 12 : 1) +
            (simFiscale.eau_trevoux || 0) * (simFiscale.eau_trevoux_type === 'mensuel' ? 12 : 1) +
            (simFiscale.electricite_trevoux || 0) * (simFiscale.electricite_trevoux_type === 'mensuel' ? 12 : 1) +
            (simFiscale.assurance_hab_trevoux || 0) * (simFiscale.assurance_hab_trevoux_type === 'mensuel' ? 12 : 1) +
            (simFiscale.assurance_emprunt_trevoux || 0) * (simFiscale.assurance_emprunt_trevoux_type === 'mensuel' ? 12 : 1) +
            (simFiscale.interets_emprunt_trevoux || 0) * (simFiscale.interets_emprunt_trevoux_type === 'mensuel' ? 12 : 1) +
            (simFiscale.menage_trevoux || 0) * (simFiscale.menage_trevoux_type === 'mensuel' ? 12 : 1) +
            (simFiscale.linge_trevoux || 0) * (simFiscale.linge_trevoux_type === 'mensuel' ? 12 : 1) +
            (simFiscale.logiciel_trevoux || 0) * (simFiscale.logiciel_trevoux_type === 'mensuel' ? 12 : 1) +
            (simFiscale.copropriete_trevoux || 0) * (simFiscale.copropriete_trevoux_type === 'mensuel' ? 12 : 1) +
            (simFiscale.taxe_fonciere_trevoux || 0) +
            (simFiscale.cfe_trevoux || 0) +
            (simFiscale.commissions_trevoux || 0);
        
        // Frais professionnels
        const fraisPro = 
            (simFiscale.comptable || 0) +
            (simFiscale.frais_bancaires || 0) +
            ((simFiscale.telephone || 0) * (simFiscale.telephone_type === 'mensuel' ? 12 : 1)) +
            (simFiscale.materiel_info || 0) +
            (simFiscale.rc_pro || 0) +
            (simFiscale.formation || 0) +
            ((simFiscale.fournitures || 0) * (simFiscale.fournitures_type === 'mensuel' ? 12 : 1));
        
        // Listes
        const travaux = (simFiscale.travaux_liste || []).reduce((sum, item) => sum + item.montant, 0);
        const fraisDivers = (simFiscale.frais_divers_liste || []).reduce((sum, item) => sum + item.montant, 0);
        const produitsAccueil = (simFiscale.produits_accueil_liste || []).reduce((sum, item) => sum + item.montant, 0);
        
        // Crédits (tous gîtes)
        const credits = (simFiscale.credits_liste || [])
            .reduce((sum, c) => sum + (c.mensualite * 12), 0);
        
        totalChargesAnnee = chargesCouzon + chargesTrevoux + fraisPro + travaux + fraisDivers + produitsAccueil + credits;
    }
    
    // Bénéfice = CA - Total Charges (depuis fiscalité)
    const beneficeAnnee = caAnnee - totalChargesAnnee;
    
    // 2. Calculer l'URSSAF pour l'année en cours (22% + 9.7% CSG-CRDS + allocations familiales progressives)
    const cotisationsSociales = beneficeAnnee * 0.22; // 22%
    const csgCrds = beneficeAnnee * 0.097; // 9.7%
    const formationPro = caAnnee * 0.0025; // 0.25% du CA
    
    // Allocations familiales (progressif entre 110% et 140% du PASS)
    let allocations = 0;
    const pass2024 = 46368;
    if (beneficeAnnee > pass2024 * 1.1) {
        const baseAlloc = Math.min(beneficeAnnee - (pass2024 * 1.1), pass2024 * 0.3);
        const tauxAlloc = (baseAlloc / (pass2024 * 0.3)) * 0.031;
        allocations = beneficeAnnee * tauxAlloc;
    }
    
    let urssafTotal = cotisationsSociales + csgCrds + formationPro + allocations;
    
    // ⚠️ Appliquer le minimum URSSAF de 1200€
    if (urssafTotal < 1200) {
        urssafTotal = 1200;
    }
    
    
    // 3. Calculer l'IR de l'ANNÉE PRÉCÉDENTE (depuis la base)
    let simulationPrecedente = null;
    try {
        const { data } = await window.supabaseClient
            .from('simulations_fiscales')
            .select('*')
            .eq('annee', anneePrecedente)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
        simulationPrecedente = data;
    } catch (error) {
        // Table non créée ou erreur - continuer sans simulation
    }
    
    let impotRevenuPrecedent = 0;
    let urssafPrecedent = 0;
    
    if (simulationPrecedente) {
        if (simulationPrecedente.impot_revenu) {
            impotRevenuPrecedent = parseFloat(simulationPrecedente.impot_revenu);
        } else {
            // console.warn(`⚠️ Champ impot_revenu null ou undefined pour ${anneePrecedente}`);
        }
        
        if (simulationPrecedente.cotisations_urssaf) {
            urssafPrecedent = parseFloat(simulationPrecedente.cotisations_urssaf);
        } else {
            // console.warn(`⚠️ Champ cotisations_urssaf null ou undefined pour ${anneePrecedente}`);
        }
    } else {
        // console.warn(`⚠️ Aucune simulation trouvée pour ${anneePrecedente}`);
    }
    
    // 4. Calculer l'IR de l'ANNÉE EN COURS (temps réel)
    const { data: simulationCourante } = await window.supabaseClient
        .from('simulations_fiscales')
        .select('*')
        .eq('annee', anneeActuelle)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
    
    let impotRevenuCourant = 0;
    
    if (simulationCourante) {
        const salaireMadame = parseFloat(simulationCourante.salaire_madame || 0);
        const salaireMonsieur = parseFloat(simulationCourante.salaire_monsieur || 0);
        const nbEnfants = parseInt(simulationCourante.nombre_enfants || 0);
        
        // Revenu imposable = bénéfice - URSSAF + salaires
        const resteApresURSSAF = beneficeAnnee - urssafTotal;
        const revenuFiscal = resteApresURSSAF + salaireMadame + salaireMonsieur;
        
        // Calcul du nombre de parts
        let nbParts = 2; // Couple par défaut
        if (nbEnfants === 1) nbParts = 2.5;
        else if (nbEnfants === 2) nbParts = 3;
        else if (nbEnfants >= 3) nbParts = 3 + (nbEnfants - 2);
        
        // Quotient familial
        const quotient = revenuFiscal / nbParts;
        
        // Barème 2024 (inchangé pour 2025/2026)
        let impotParPart = 0;
        if (quotient > 177106) {
            impotParPart = (quotient - 177106) * 0.45 + 44797;
        } else if (quotient > 78570) {
            impotParPart = (quotient - 78570) * 0.41 + 14372;
        } else if (quotient > 27478) {
            impotParPart = (quotient - 27478) * 0.30 + 5686;
        } else if (quotient > 11294) {
            impotParPart = (quotient - 11294) * 0.11 + 906;
        } else if (quotient > 11109) {
            impotParPart = (quotient - 11109) * 0.11;
        }
        
        impotRevenuCourant = Math.max(0, impotParPart * nbParts);
        
    } else {
        // console.warn(`⚠️ Pas de simulation pour ${anneeActuelle}, calcul simplifié`);
        // Calcul simplifié sans salaires
        const resteApresURSSAF = beneficeAnnee - urssafTotal;
        const quotient = resteApresURSSAF / 2; // Couple sans enfant
        
        let impotParPart = 0;
        if (quotient > 177106) {
            impotParPart = (quotient - 177106) * 0.45 + 44797;
        } else if (quotient > 78570) {
            impotParPart = (quotient - 78570) * 0.41 + 14372;
        } else if (quotient > 27478) {
            impotParPart = (quotient - 27478) * 0.30 + 5686;
        } else if (quotient > 11294) {
            impotParPart = (quotient - 11294) * 0.11 + 906;
        } else if (quotient > 11109) {
            impotParPart = (quotient - 11109) * 0.11;
        }
        
        impotRevenuCourant = Math.max(0, impotParPart * 2);
    }
    
    // 5. Mettre à jour l'affichage
    const urssaf2025El = document.getElementById('dashboard-urssaf-2025');
    const urssaf2026El = document.getElementById('dashboard-urssaf-2026');
    const ir2025El = document.getElementById('dashboard-ir-2025');
    const ir2026El = document.getElementById('dashboard-ir-2026');
    const beneficeEl = document.getElementById('dashboard-benefice-moyen');
    
    // Afficher URSSAF des 2 années
    if (urssaf2025El) {
        urssaf2025El.textContent = simulationPrecedente ? formatCurrency(urssafPrecedent) : '-';
    }
    if (urssaf2026El) {
        urssaf2026El.textContent = formatCurrency(urssafTotal);
    }
    
    // Afficher IR des 2 années (seulement si option personnelle activée)
    const optionsPersoActivees = localStorage.getItem('fiscalite_options_perso') === 'true';
    const irContainer = document.getElementById('dashboard-ir-container');
    
    if (irContainer) {
        irContainer.style.display = optionsPersoActivees ? 'block' : 'none';
    }
    
    if (optionsPersoActivees) {
        if (ir2025El) {
            ir2025El.textContent = simulationPrecedente ? formatCurrency(impotRevenuPrecedent) : '-';
        }
        if (ir2026El) {
            ir2026El.textContent = formatCurrency(impotRevenuCourant);
        }
    }
    
    // Afficher bénéfice
    if (beneficeEl) beneficeEl.textContent = formatCurrency(beneficeAnnee);
    
    // ============================================================
    // ❌ FEATURE SUPPRIMÉE - 23 JAN 2026
    // Table suivi_soldes_bancaires supprimée de la BDD
    // ============================================================
    // const { data: soldeMois } = await window.supabaseClient
    //     .from('suivi_soldes_bancaires')
    //     .select('solde')
    //     .eq('annee', anneeActuelle)
    //     .eq('mois', moisActuel)
    //     .maybeSingle();
    
    const tresorerieEl = document.getElementById('dashboard-tresorerie');
    if (tresorerieEl) {
        tresorerieEl.textContent = '-';
    }
    
    // 7. Afficher les graphiques
    const benefices = await calculerBeneficesMensuels(totalChargesAnnee);
    await afficherGraphiqueBenefices(benefices);
    await afficherGraphiqueTresorerieDashboard();
}

// ==========================================
// ==========================================

async function calculerBeneficesMensuels(totalChargesAnnee = 0) {
    try {
        // Récupérer toutes les réservations
        const reservations = await getAllReservations();
        
        const anneeActuelle = new Date().getFullYear();
        const benefices = [];
        
        
        // Pour chaque mois
        for (let mois = 0; mois < 12; mois++) {
            const nomMois = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'][mois];
            
            // 1. Calculer le CA du mois (toutes les réservations Trevoux + Couzon)
            const reservationsDuMois = reservations.filter(r => {
                const dateDebut = parseLocalDate(r.dateDebut);
                return dateDebut.getFullYear() === anneeActuelle && dateDebut.getMonth() === mois;
            });
            
            const caMois = reservationsDuMois.reduce((sum, r) => sum + (parseFloat(r.montant) || 0), 0);
            
            // 2. Calculer les charges du mois : prendre le 1/12 du total annuel depuis fiscalité
            // Pour simplifier, on divise le total annuel par 12
            // Note : ce calcul sera plus précis une fois que toutes les charges mensuelles seront trackées
            const totalCharges = totalChargesAnnee / 12;
            
            // Calcul du bénéfice : CA - Charges (1/12 du total annuel)
            const beneficeMois = caMois - totalCharges;
            
            // Log détaillé pour TOUS les mois avec activité
            if (caMois > 0 || totalCharges > 0) {
            }
            
            benefices.push({
                mois: mois + 1,
                nom: nomMois,
                total: beneficeMois,
                details: {
                    ca: caMois,
                    charges: totalCharges
                }
            });
        }
        
        
        return benefices;
        
    } catch (error) {
        console.error('Erreur calculerBeneficesMensuels:', error);
        // Retourner des valeurs par défaut
        return Array.from({ length: 12 }, (_, i) => ({
            mois: i + 1,
            nom: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'][i],
            total: 0
        }));
    }
}

// ==========================================
// 📈 GRAPHIQUE BÉNÉFICES GÎTES
// ==========================================

let chartBenefices = null;

async function afficherGraphiqueBenefices(benefices) {
    const canvas = document.getElementById('graphique-benefices-gites');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // Détruire le graphique existant
    if (chartBenefices) {
        chartBenefices.destroy();
    }
    
    chartBenefices = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: benefices.map(b => b.nom),
            datasets: [{
                label: 'Bénéfices (€)',
                data: benefices.map(b => b.total),
                backgroundColor: 'rgba(39, 174, 96, 0.8)',
                borderColor: 'rgba(39, 174, 96, 1)',
                borderWidth: 2
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
                    callbacks: {
                        label: function(context) {
                            return formatCurrency(context.parsed.y);
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return value.toLocaleString('fr-FR') + ' €';
                        }
                    }
                }
            }
        }
    });
}

// ==========================================
// ==========================================

let chartTresorerieDashboard = null;

async function afficherGraphiqueTresorerieDashboard() {
    const canvas = document.getElementById('graphique-tresorerie-dashboard');
    if (!canvas) return;
    
    const anneeActuelle = new Date().getFullYear();
    
    // ============================================================
    // ❌ FEATURE SUPPRIMÉE - 23 JAN 2026
    // Table suivi_soldes_bancaires supprimée de la BDD
    // ============================================================
    // const { data: soldes } = await window.supabaseClient
    //     .from('suivi_soldes_bancaires')
    //     .select('*')
    //     .eq('annee', anneeActuelle)
    //     .order('mois', { ascending: true });
    const soldes = null;
    
    const ctx = canvas.getContext('2d');
    
    // Détruire le graphique existant
    if (chartTresorerieDashboard) {
        chartTresorerieDashboard.destroy();
    }
    
    // Préparer les données (12 mois)
    const moisNoms = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
    const soldesData = Array(12).fill(null);
    
    if (soldes) {
        soldes.forEach(s => {
            soldesData[s.mois - 1] = parseFloat(s.solde);
        });
    }
    
    chartTresorerieDashboard = new Chart(ctx, {
        type: 'line',
        data: {
            labels: moisNoms,
            datasets: [{
                label: 'Trésorerie (€)',
                data: soldesData,
                borderColor: '#3498db',
                backgroundColor: 'rgba(52, 152, 219, 0.1)',
                borderWidth: 3,
                tension: 0.4,
                fill: true,
                spanGaps: true
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
                    callbacks: {
                        label: function(context) {
                            if (context.parsed.y === null) return 'Pas de données';
                            return formatCurrency(context.parsed.y);
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    ticks: {
                        callback: function(value) {
                            return value.toLocaleString('fr-FR') + ' €';
                        }
                    }
                }
            }
        }
    });
}

// ==========================================
// 🔄 RAFRAÎCHISSEMENT COMPLET
// ==========================================

async function refreshDashboard() {
    updateDashboardHeader();
    await updateDashboardAlerts();
    await updateDemandesClients();
    await updateProblemesClients();
    await updateDashboardStats();
    await updateDashboardReservations();
    await updateDashboardMenages();
    await updateTodoLists();
    await updateFinancialIndicators();
    await afficherGraphiqueTresorerieDashboard();
    // initializeTodoModal(); // Supprimé - modal créé dynamiquement
    initializeReponseWhatsappModal();
    
    // Attacher les boutons "+ Tâche" via data-category (SecurityUtils ne supprime pas les attributs data)
    document.querySelectorAll('[data-todo-category]').forEach(btn => {
        const category = btn.getAttribute('data-todo-category');
        btn.addEventListener('click', () => addTodoItem(category));
    });
    
    // Attacher le bouton Actualiser (SecurityUtils supprime les onclick)
    const btnActualiser = document.querySelector('#tab-dashboard button');
    if (btnActualiser && btnActualiser.textContent.includes('Actualiser')) {
        // console.log('✅ Bouton Actualiser attaché');
        btnActualiser.addEventListener('click', function(e) {
            e.preventDefault();
            updateFinancialIndicators();
        });
    }
}

function initializeReponseWhatsappModal() {
    const form = document.getElementById('formReponseWhatsapp');
    if (form && !form.dataset.initialized) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const id = document.getElementById('reponseProblemeId').value;
            const telephone = document.getElementById('reponseTelephone').value;
            const sujet = document.getElementById('reponseClientSujet').textContent.replace(/"/g, '');
            const gite = document.getElementById('reponseClientGite').textContent.replace('📍 ', '');
            repondreWhatsApp(id, telephone, sujet, gite);
        });
        form.dataset.initialized = 'true';
    }
    
    // Fermer le modal en cliquant sur l'overlay
    const modal = document.getElementById('reponseWhatsappModal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeReponseWhatsappModal();
            }
        });
    }
}

// ==========================================
// ❌ FEATURE SUPPRIMÉE - 23 JAN 2026
// ⏰ DEMANDES D'HORAIRES CLIENTS
// Table demandes_horaires supprimée de la BDD
// ==========================================

async function updateDemandesClients() {
    return; // ❌ Table demandes_horaires supprimée - 23/01/2026
    
    // Cacher la carte puisque la feature est désactivée
    const card = document.getElementById('dashboard-demandes-clients');
    const badge = document.getElementById('badge-demandes-count');
    if (card) card.style.display = 'none';
    if (badge) badge.textContent = '0';
    
    try {
        const { data: demandes, error } = await supabaseClient
            .from('demandes_horaires')
            .select(`
                *,
                reservations:reservation_id (
                    client_name,
                    gite,
                    check_in,
                    check_out
                )
            `)
            .eq('statut', 'en_attente')
            .order('created_at', { ascending: true });
        
        if (error) {
            console.error('❌ Erreur chargement demandes:', error);
            throw error;
        }
        
        const container = document.getElementById('liste-demandes-clients');
        const badge = document.getElementById('badge-demandes-count');
        const card = document.getElementById('dashboard-demandes-clients');
        
        if (!container || !badge || !card) return;
        
        if (!demandes || demandes.length === 0) {
            window.SecurityUtils.setInnerHTML(container, '<p style="color: #95a5a6; font-style: italic; margin: 0;">Aucune demande en attente</p>');
            badge.textContent = '0';
            card.style.display = 'none'; // Cacher si aucune demande
            return;
        }
        
        badge.textContent = demandes.length;
        card.style.display = 'block';
        
        let html = '';
        demandes.forEach(d => {
            const typeLabel = d.type === 'arrivee' ? '📥 Arrivée' : '📤 Départ';
            const typeColor = d.type === 'arrivee' ? '#27AE60' : '#E74C3C';
            
            // Récupérer les infos depuis la réservation liée
            const resa = d.reservations;
            const clientNom = resa?.client_name || 'Client';
            const gite = resa?.gite || '';
            const dateDebut = resa?.check_in;
            const dateFin = resa?.check_out;
            
            html += `
                <div style="background: white; border: 1px solid #e0e0e0; border-radius: 8px; padding: 12px; display: flex; justify-content: space-between; align-items: center;">
                    <div style="flex: 1;">
                        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 6px;">
                            <span style="background: ${typeColor}; color: white; padding: 3px 10px; border-radius: 4px; font-size: 0.8rem; font-weight: 600;">${typeLabel}</span>
                            <strong style="font-size: 1rem;">${clientNom}</strong>
                            ${gite ? `<span style="color: #666; font-size: 0.85rem;">• ${gite}</span>` : ''}
                        </div>
                        <div style="color: #666; font-size: 0.9rem;">
                            📅 ${dateDebut ? formatDateFromObj(new Date(dateDebut)) : 'N/A'} → ${dateFin ? formatDateFromObj(new Date(dateFin)) : 'N/A'}
                            • ⏰ Demande: <strong>${d.heure_demandee}</strong>
                        </div>
                    </div>
                    <div style="display: flex; gap: 8px;">
                        <button onclick="validerDemandeHoraire('${d.id}', '${d.heure_demandee}')" 
                                style="background: #27AE60; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 0.85rem; font-weight: 500;">
                            ✓ Valider
                        </button>
                        <button onclick="refuserDemandeHoraire('${d.id}')" 
                                style="background: #E74C3C; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 0.85rem; font-weight: 500;">
                            ✗ Refuser
                        </button>
                    </div>
                </div>
            `;
        });
        
        window.SecurityUtils.setInnerHTML(container, html);
    } catch (err) {
        console.error('Erreur chargement demandes:', err);
    }
}

async function validerDemandeHoraire(demandeId, heureValidee) {
    return; // ❌ Table demandes_horaires supprimée - 23/01/2026
    try {
        // 1. Récupérer la demande complète pour connaître le type et la réservation
        const { data: demande, error: fetchError} = await supabaseClient
            .from('demandes_horaires')
            .select('*, reservations:reservation_id(id)')
            .eq('id', demandeId)
            .single();
        
        if (fetchError) throw fetchError;
        if (!demande || !demande.reservation_id) {
            alert('❌ Demande ou réservation introuvable');
            return;
        }
        
        // 2. Mettre à jour l'heure dans la réservation
        const champHeure = demande.type === 'arrivee' ? 'check_in_time' : 'check_out_time';
        const { error: updateResaError } = await supabaseClient
            .from('reservations')
            .update({ 
                [champHeure]: heureValidee,
                updated_at: new Date().toISOString()
            })
            .eq('id', demande.reservation_id);
        
        if (updateResaError) throw updateResaError;
        
        // 3. Mettre à jour le statut de la demande
        const { error } = await supabaseClient
            .from('demandes_horaires')
            .update({
                statut: 'validee',
                updated_at: new Date().toISOString()
            })
            .eq('id', demandeId);
        
        if (error) throw error;
        
        alert('✅ Demande validée avec succès !');
        await updateDemandesClients();
        await updateDashboardReservations();
    } catch (err) {
        console.error('Erreur validation:', err);
        alert('❌ Erreur lors de la validation');
    }
}

async function refuserDemandeHoraire(demandeId) {
    return; // ❌ Table demandes_horaires supprimée - 23/01/2026
    const raison = prompt('Raison du refus (optionnel):');
    
    try {
        const { error } = await supabaseClient
            .from('demandes_horaires')
            .update({
                statut: 'refusee',
                motif: raison || 'Refusée',
                updated_at: new Date().toISOString()
            })
            .eq('id', demandeId);
        
        if (error) throw error;
        
        alert('❌ Demande refusée');
        await updateDemandesClients();
    } catch (err) {
        console.error('Erreur refus:', err);
        alert('❌ Erreur lors du refus');
    }
}

// ==========================================
// 💬 RETOURS & PROBLÈMES CLIENTS
// ==========================================

async function updateProblemesClients() {
    return; // ❌ Table problemes_signales supprimée - 23/01/2026
    
    // Cacher la carte puisque la feature est désactivée
    const card = document.getElementById('dashboard-problemes-clients');
    const badge = document.getElementById('badge-problemes-count');
    if (card) card.style.display = 'none';
    if (badge) badge.textContent = '0';
    
    try {
        const { data: problemes, error } = await supabaseClient
            .from('problemes_signales')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50);
        
        if (error) {
            console.error('❌ Erreur chargement problèmes:', error);
            throw error;
        }
        
        // Enrichir avec les données de réservation (téléphone, nom client)
        if (problemes && problemes.length > 0) {
            const reservationIds = [...new Set(problemes.map(p => p.reservation_id).filter(Boolean))];
            
            if (reservationIds.length > 0) {
                const { data: reservations, error: resError } = await supabaseClient
                    .from('reservations')
                    .select('id, telephone, nom_client')
                    .in('id', reservationIds);
                
                if (resError) {
                    console.error('❌ Erreur récupération reservations:', resError);
                }
                
                if (!resError && reservations) {
                    // Créer un map pour lookup rapide
                    const resMap = {};
                    reservations.forEach(r => {
                        resMap[r.id] = r;
                    });
                    
                    // Enrichir les problèmes avec les données de réservation
                    problemes.forEach(pb => {
                        if (pb.reservation_id && resMap[pb.reservation_id]) {
                            const res = resMap[pb.reservation_id];
                            if (!pb.telephone) pb.telephone = res.telephone;
                            if (!pb.client_nom) pb.client_nom = res.nom_client || '';
                        }
                    });
                }
            }
        }
        
        // Debug amélioré : afficher directement les valeurs
        // console.log('🔍 DEBUG problèmes enrichis:');
        problemes?.forEach(p => {
            // console.log(`  ➤ ID: ${p.id} | Sujet: "${p.sujet}" | Téléphone: ${p.telephone || '❌ NULL'} | Client: ${p.client_nom || '❌ NULL'} | Resa ID: ${p.reservation_id || '❌ NULL'}`);
        });
        
        // Séparer les problèmes urgents des autres
        const problemesUrgents = problemes.filter(pb => pb.type === 'probleme');
        const autresDemandes = problemes.filter(pb => pb.type !== 'probleme');
        
        // === CARD ROUGE : PROBLÈMES URGENTS ===
        const containerUrgents = document.getElementById('liste-problemes-urgents');
        const badgeUrgents = document.getElementById('badge-problemes-urgents-count');
        const cardUrgents = document.getElementById('dashboard-problemes-urgents');
        
        if (!containerUrgents || !badgeUrgents || !cardUrgents) return;
        
        if (!problemesUrgents || problemesUrgents.length === 0) {
            window.SecurityUtils.setInnerHTML(containerUrgents, '<p style="color: #95a5a6; font-style: italic; margin: 0;">Aucun problème urgent</p>');
            badgeUrgents.textContent = '0';
            cardUrgents.style.display = 'none';
        } else {
            cardUrgents.style.display = 'block';
            badgeUrgents.textContent = problemesUrgents.length;
            let htmlUrgents = '';
            problemesUrgents.forEach(pb => {
                htmlUrgents += renderProblemeCard(pb, true);
            });
            window.SecurityUtils.setInnerHTML(containerUrgents, htmlUrgents);
        }
        
        // === CARD BLEUE : DEMANDES & RETOURS ===
        const containerDemandes = document.getElementById('liste-demandes-retours');
        const badgeDemandes = document.getElementById('badge-demandes-retours-count');
        const cardDemandes = document.getElementById('dashboard-demandes-retours');
        
        if (!autresDemandes || autresDemandes.length === 0) {
            window.SecurityUtils.setInnerHTML(containerDemandes, '<p style="color: #95a5a6; font-style: italic; margin: 0;">Aucune demande en attente</p>');
            badgeDemandes.textContent = '0';
            cardDemandes.style.display = 'none';
        } else {
            cardDemandes.style.display = 'block';
            badgeDemandes.textContent = autresDemandes.length;
            let htmlDemandes = '';
            autresDemandes.forEach(pb => {
                htmlDemandes += renderProblemeCard(pb, false);
            });
            window.SecurityUtils.setInnerHTML(containerDemandes, htmlDemandes);
        }
        
    } catch (err) {
        console.error('❌ Erreur update problèmes clients:', err);
    }
}

function renderProblemeCard(pb, isUrgent) {
    const typeIcon = {
        'demande': '🏠',
        'retour': '💬',
        'amelioration': '💡',
        'probleme': '⚠️'
    }[pb.type] || '📝';
    
    const urgenceColor = {
        'faible': '#27ae60',
        'moyenne': '#f39c12',
        'haute': '#e74c3c'
    }[pb.urgence] || '#95a5a6';
    
    const urgenceLabel = {
        'faible': 'Faible',
        'moyenne': 'Moyenne',
        'haute': 'Haute'
    }[pb.urgence] || 'Non défini';
    
    return `
        <div style="background: white; padding: 15px; border-radius: 10px; border-left: 5px solid ${urgenceColor}; box-shadow: 0 2px 8px rgba(0,0,0,0.1); margin-bottom: 12px;">
            <!-- En-tête avec nom client -->
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px; padding-bottom: 10px; border-bottom: 2px solid #f0f0f0;">
                <span style="font-size: 1.2rem;">👤</span>
                <span style="font-weight: 700; font-size: 1.1rem; color: #2c3e50;">${pb.client_nom || 'Client inconnu'}</span>
                ${pb.gite ? `<span style="background: #667eea; color: white; padding: 3px 10px; border-radius: 12px; font-size: 0.75rem; font-weight: 600;">${pb.gite}</span>` : ''}
            </div>
            
            <!-- Contenu principal -->
            <div style="display: flex; justify-content: space-between; align-items: start;">
                <div style="flex: 1;">
                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
                        <span style="font-size: 1.3rem;">${typeIcon}</span>
                        <span style="font-weight: 700; font-size: 1.05rem; color: #2c3e50;">${pb.sujet || 'Sans titre'}</span>
                        <span style="background: ${urgenceColor}; color: white; padding: 3px 10px; border-radius: 12px; font-size: 0.75rem; font-weight: 600;">
                            ${urgenceLabel}
                        </span>
                    </div>
                    ${pb.description ? `<p style="margin: 0 0 8px 0; color: #7f8c8d; font-size: 0.9rem; line-height: 1.5;">${pb.description.substring(0, 150)}${pb.description.length > 150 ? '...' : ''}</p>` : ''}
                    <div style="display: flex; gap: 15px; font-size: 0.85rem; color: #95a5a6;">
                        <span>📅 ${new Date(pb.created_at).toLocaleDateString('fr-FR', {day: '2-digit', month: 'short', year: 'numeric'})}</span>
                    </div>
                </div>
                <div style="display: flex; gap: 8px; flex-shrink: 0;">
                    ${pb.telephone ? `
                        <button onclick="toggleReponseWhatsApp(${pb.id})" 
                                style="background: linear-gradient(135deg, #25D366 0%, #128C7E 100%); color: white; border: none; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 0.85rem; transition: transform 0.2s; box-shadow: 0 2px 6px rgba(37, 211, 102, 0.3);"
                                onmouseover="this.style.transform='scale(1.05)'"
                                onmouseout="this.style.transform='scale(1)'">
                            💬 Répondre
                        </button>
                    ` : `
                        <button disabled 
                                style="background: #ccc; color: #666; border: none; padding: 8px 16px; border-radius: 8px; cursor: not-allowed; font-weight: 600; font-size: 0.85rem;"
                                title="Aucun numéro de téléphone">
                            📞 Pas de tél
                        </button>
                    `}
                    <button onclick="traiterProbleme(${pb.id})" 
                            style="background: linear-gradient(135deg, #27ae60 0%, #229954 100%); color: white; border: none; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 0.85rem; transition: transform 0.2s; box-shadow: 0 2px 6px rgba(39, 174, 96, 0.3);"
                            onmouseover="this.style.transform='scale(1.05)'"
                            onmouseout="this.style.transform='scale(1)'">
                        ✓ Traité
                    </button>
                    <button onclick="supprimerProbleme(${pb.id})" 
                            style="background: #e74c3c; color: white; border: none; padding: 8px 12px; border-radius: 8px; cursor: pointer; font-size: 0.85rem; transition: all 0.2s;"
                            onmouseover="this.style.background='#c0392b'"
                            onmouseout="this.style.background='#e74c3c'">
                        🗑️
                    </button>
                </div>
            </div>
            
            <!-- Zone de réponse dépliable -->
            ${pb.telephone ? `
                <div id="reponse-${pb.id}" style="display: none; margin-top: 15px; padding-top: 15px; border-top: 2px solid #f0f0f0;">
                    <form onsubmit="envoyerReponseWhatsApp(event, ${pb.id}, '${pb.telephone}', '${(pb.sujet || '').replace(/'/g, "\\'")}', '${pb.gite || ''}')">
                        <label style="font-weight: 600; color: #2c3e50; margin-bottom: 8px; display: block;">Votre message</label>
                        <textarea id="message-${pb.id}" rows="4" style="width: 100%; padding: 12px; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 0.95rem; resize: vertical; font-family: inherit; margin-bottom: 10px;" placeholder="Écrivez votre réponse..." required>Bonjour,\n\nNous avons bien reçu votre message concernant : "${(pb.sujet || '').replace(/"/g, '&quot;')}"\n\nGîte : ${pb.gite || ''}\n\n[Votre réponse ici]</textarea>
                        <div style="display: flex; gap: 10px;">
                            <button type="submit" style="flex: 1; background: linear-gradient(135deg, #25D366 0%, #128C7E 100%); color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 1rem; display: flex; align-items: center; justify-content: center; gap: 8px;">
                                <span style="font-size: 1.2rem;">💬</span> Envoyer via WhatsApp
                            </button>
                            <button type="button" onclick="toggleReponseWhatsApp(${pb.id})" style="background: #95a5a6; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-weight: 600;">
                                Annuler
                            </button>
                        </div>
                    </form>
                </div>
            ` : ''}
        </div>
    `;
}

async function traiterProbleme(id) {
    return; // ❌ Table problemes_signales supprimée - 23/01/2026
    if (!confirm('Marquer ce problème comme traité ?\n\nCela le supprimera de la liste.')) return;
    
    try {
        const { error } = await supabaseClient
            .from('problemes_signales')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        
        showToast('✓ Problème marqué comme traité', 'success');
        await updateProblemesClients();
    } catch (err) {
        console.error('Erreur traitement:', err);
        alert('❌ Erreur lors du traitement');
    }
}

async function supprimerProbleme(id) {
    return; // ❌ Table problemes_signales supprimée - 23/01/2026
    if (!confirm('Supprimer ce problème définitivement ?')) return;
    
    try {
        const { error } = await supabaseClient
            .from('problemes_signales')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        
        showToast('✓ Problème supprimé', 'success');
        await updateProblemesClients();
    } catch (err) {
        console.error('Erreur suppression:', err);
        alert('❌ Erreur lors de la suppression');
    }
}

function repondreWhatsApp(id, telephone, sujet, gite) {
    // Cette fonction est maintenant appelée depuis le formulaire
    const message = document.getElementById('reponseMessage').value;
    
    if (!message.trim()) {
        alert('Veuillez écrire un message avant d\'envoyer.');
        return;
    }
    
    // Nettoyer le numéro de téléphone (enlever espaces, tirets, etc.)
    const telClean = telephone.replace(/[\s\-\(\)]/g, '');
    
    // Encoder le message pour l'URL
    const messageEncoded = encodeURIComponent(message);
    
    // Créer le lien WhatsApp
    const whatsappUrl = `https://wa.me/${telClean}?text=${messageEncoded}`;
    
    // Ouvrir dans un nouvel onglet
    window.open(whatsappUrl, '_blank');
    
    // Fermer le modal
    closeReponseWhatsappModal();
    
    // Option : marquer comme traité après envoi
    if (confirm('Marquer ce problème comme traité ?')) {
        traiterProbleme(id);
    }
}

function toggleReponseWhatsApp(problemeId) {
    const zone = document.getElementById(`reponse-${problemeId}`);
    const textarea = document.getElementById(`message-${problemeId}`);
    
    if (zone.style.display === 'none' || !zone.style.display) {
        // Ouvrir
        zone.style.display = 'block';
        
        // Auto-sélectionner le placeholder
        setTimeout(() => {
            const message = textarea.value;
            const start = message.indexOf('[Votre réponse ici]');
            if (start !== -1) {
                textarea.focus();
                textarea.setSelectionRange(start, start + '[Votre réponse ici]'.length);
            }
        }, 100);
    } else {
        // Fermer
        zone.style.display = 'none';
    }
}

function envoyerReponseWhatsApp(event, problemeId, telephone, sujet, gite) {
    event.preventDefault();
    
    const textarea = document.getElementById(`message-${problemeId}`);
    const message = textarea.value;
    
    if (!telephone || !message) {
        alert('❌ Informations manquantes');
        return;
    }
    
    // Nettoyer le numéro de téléphone pour WhatsApp
    let tel = telephone.replace(/\s/g, '').replace(/\+/g, '');
    
    // Si commence par 0, remplacer par 33
    if (tel.startsWith('0')) {
        tel = '33' + tel.substring(1);
    } else if (!tel.startsWith('33')) {
        tel = '33' + tel;
    }
    
    // Ouvrir WhatsApp
    const url = `https://wa.me/${tel}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
    
    // Fermer la zone de réponse
    toggleReponseWhatsApp(problemeId);
    
    // Option : marquer comme traité après envoi
    if (confirm('Marquer ce problème comme traité ?')) {
        traiterProbleme(problemeId);
    }
}

function ouvrirReponseWhatsApp(id, telephone, sujet, gite, description, clientNom) {
    // Afficher le modal
    const modal = document.getElementById('reponseWhatsappModal');
    modal.style.display = 'flex';
    
    // Remplir les infos
    document.getElementById('reponseProblemeId').value = id;
    document.getElementById('reponseTelephone').value = telephone;
    document.getElementById('reponseClientNom').textContent = clientNom;
    document.getElementById('reponseClientGite').textContent = `📍 ${gite}`;
    document.getElementById('reponseClientSujet').textContent = `"${sujet}"`;
    
    // Message pré-rempli
    const messagePrefill = `Bonjour,\n\nNous avons bien reçu votre message concernant : "${sujet}"\n\nGîte : ${gite}\n\n[Votre réponse ici]\n\nCordialement,\nL'équipe`;
    document.getElementById('reponseMessage').value = messagePrefill;
    
    // Focus sur le textarea
    setTimeout(() => {
        const textarea = document.getElementById('reponseMessage');
        textarea.focus();
        // Placer le curseur sur "[Votre réponse ici]"
        const pos = messagePrefill.indexOf('[Votre réponse ici]');
        if (pos !== -1) {
            textarea.setSelectionRange(pos, pos + '[Votre réponse ici]'.length);
        }
    }, 100);
}

function closeReponseWhatsappModal() {
    const modal = document.getElementById('reponseWhatsappModal');
    modal.style.display = 'none';
    document.getElementById('formReponseWhatsapp').reset();
}

// Exposer les fonctions dans le scope global pour les appels depuis HTML
window.addTodoItem = addTodoItem;
window.toggleTodo = toggleTodo;
window.deleteTodo = deleteTodo;
window.editTodo = editTodo;
window.openEditReservation = openEditReservation;
window.openFicheClient = openFicheClient;
window.refreshDashboard = refreshDashboard;
window.closeAddTodoModal = closeAddTodoModal;
window.validerDemandeHoraire = validerDemandeHoraire;
window.refuserDemandeHoraire = refuserDemandeHoraire;
window.traiterProbleme = traiterProbleme;
window.supprimerProbleme = supprimerProbleme;
window.repondreWhatsApp = repondreWhatsApp;
window.ouvrirReponseWhatsApp = ouvrirReponseWhatsApp;
window.closeReponseWhatsappModal = closeReponseWhatsappModal;
window.toggleReponseWhatsApp = toggleReponseWhatsApp;
window.envoyerReponseWhatsApp = envoyerReponseWhatsApp;

// =============================================
// FONCTIONS CHECKLIST POUR DASHBOARD
// =============================================

async function getReservationChecklistProgressDashboard(reservationId, gite) {
    try {
        // Vérifier si la table checklist_templates existe
        // Retourner des valeurs vides si la table n'existe pas (migration pas encore faite)
        const { data: templates, error: templatesError } = await supabaseClient
            .from('checklist_templates')
            .select('id, type')
            .eq('gite_id', gite)
            .eq('actif', true);
        
        // Si la table n'existe pas, retourner des valeurs vides sans erreur
        if (templatesError) {
            if (templatesError.code === 'PGRST205' || templatesError.code === '42703' || templatesError.code === '42P01') {
                // Table n'existe pas encore - désactiver définitivement la feature
                CHECKLIST_FEATURE_ENABLED = false;
                return {
                    entree: { total: 0, completed: 0, percent: 0 },
                    sortie: { total: 0, completed: 0, percent: 0 }
                };
            }
            throw templatesError;
        }
        
        const templatesEntree = templates ? templates.filter(t => t.type === 'entree') : [];
        const templatesSortie = templates ? templates.filter(t => t.type === 'sortie') : [];
        
        // Récupérer les items complétés
        const { data: progress, error: progressError } = await supabaseClient
            .from('checklist_progress')
            .select('template_id, completed')
            .eq('reservation_id', reservationId);
        
        if (progressError) throw progressError;
        
        // Calculer entrée
        const completedEntree = progress ? progress.filter(p => 
            p.completed && templatesEntree.some(t => t.id === p.template_id)
        ).length : 0;
        
        // Calculer sortie
        const completedSortie = progress ? progress.filter(p => 
            p.completed && templatesSortie.some(t => t.id === p.template_id)
        ).length : 0;
        
        return {
            entree: {
                total: templatesEntree.length,
                completed: completedEntree,
                percent: templatesEntree.length > 0 ? Math.round((completedEntree / templatesEntree.length) * 100) : 0
            },
            sortie: {
                total: templatesSortie.length,
                completed: completedSortie,
                percent: templatesSortie.length > 0 ? Math.round((completedSortie / templatesSortie.length) * 100) : 0
            }
        };
        
    } catch (error) {
        // Ne plus afficher l'erreur si c'est juste une table manquante
        if (error.code !== 'PGRST205') {
            console.error('❌ Erreur calcul progression checklist:', error);
        }
        return {
            entree: { total: 0, completed: 0, percent: 0 },
            sortie: { total: 0, completed: 0, percent: 0 }
        };
    }
}

function getProgressColorDashboard(percent) {
    if (percent === 0) return '#ef4444'; // 🔴 Rouge
    if (percent < 100) return '#f97316'; // 🟠 Orange
    return '#10b981'; // 🟢 Vert
}

// ==========================================
// 🧹 RETOURS MÉNAGE - AFFICHAGE ET VALIDATION
// ==========================================

async function afficherDetailsRetourMenage(retourId) {
    return; // ❌ Table retours_menage supprimée - 23/01/2026
    try {
        const { data: retour, error } = await window.supabaseClient
            .from('retours_menage')
            .select('*, gites(name)')
            .eq('id', retourId)
            .single();

        if (error) throw error;
        
        // Extraire le nom du gîte
        const giteName = retour.gites?.name || 'Gîte inconnu';

        const dateFormatee = new Date(retour.date_menage).toLocaleDateString('fr-FR', { 
            weekday: 'long',
            day: 'numeric', 
            month: 'long',
            year: 'numeric'
        });

        const etatLabels = {
            'propre': '✅ Propre',
            'sale': '🧹 Sale (normal)',
            'dégâts': '⚠️ Dégâts constatés',
            'autre': '❓ Autre'
        };

        const deroulementLabels = {
            'bien': '✅ Bien passé',
            'problèmes': '⚠️ Problèmes rencontrés',
            'difficultés': '❌ Difficultés importantes'
        };

        const modalContent = `
            <div style="padding: 20px;">
                <h2 style="color: #667eea; margin-bottom: 20px;">🧹 Retour Ménage</h2>
                
                <div style="background: #f8f9fa; padding: 15px; border-radius: 10px; margin-bottom: 20px;">
                    <div style="font-weight: 600; margin-bottom: 8px;">🏠 ${giteName}</div>
                    <div style="color: #666;">📅 ${dateFormatee}</div>
                </div>

                <div style="margin-bottom: 20px;">
                    <h3 style="color: #333; margin-bottom: 10px;">Commentaires</h3>
                    <div style="padding: 15px; background: #fff; border-left: 4px solid #667eea; border-radius: 8px;">
                        <div style="white-space: pre-wrap; color: #666; font-size: 0.95rem;">${retour.commentaires || 'Aucun commentaire'}</div>
                    </div>
                </div>

                <div style="display: flex; gap: 10px;">
                    <button onclick="fermerEtValiderRetourMenage('${retourId}')" class="btn" style="flex: 1; background: #ddd; color: #333; padding: 15px; border: none; border-radius: 10px; font-weight: 600; cursor: pointer;">
                        Fermer
                    </button>
                </div>
            </div>
        `;

        // Créer ou réutiliser la modal
        let modal = document.getElementById('modal-retour-menage');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'modal-retour-menage';
            modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 10000;';
            document.body.appendChild(modal);
        }

        window.SecurityUtils.setInnerHTML(modal, `
            <div onclick="event.stopPropagation()" style="background: white; border-radius: 20px; max-width: 600px; width: 90%; max-height: 90vh; overflow-y: auto;">
                ${modalContent}
            </div>
        `);
        modal.dataset.retourId = retourId; // Stocker l'ID pour le clic sur l'overlay
        modal.style.display = 'flex';

    } catch (error) {
        console.error('Erreur affichage retour:', error);
        alert('❌ Erreur lors de l\'affichage du retour');
    }
}

async function fermerEtValiderRetourMenage(retourId) {
    return; // ❌ Table retours_menage supprimée - 23/01/2026
    try {
        // Marquer le retour comme validé pour qu'il disparaisse des alertes
        const { error } = await window.supabaseClient
            .from('retours_menage')
            .update({ validated: true })
            .eq('id', retourId);

        if (error) throw error;

        // Fermer la modal
        fermerModalRetourMenage();
        
        // Recharger les alertes pour enlever ce retour
        await updateDashboardAlerts();
        
    } catch (error) {
        console.error('Erreur validation retour:', error);
        // Fermer quand même la modal
        fermerModalRetourMenage();
    }
}

function fermerModalRetourMenage() {
    const modal = document.getElementById('modal-retour-menage');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Permettre de fermer en cliquant sur le fond
document.addEventListener('DOMContentLoaded', () => {
    // Initialiser la date immédiatement
    updateDashboardHeader();
    
    const setupModalRetourClick = () => {
        const modal = document.getElementById('modal-retour-menage');
        if (modal && !modal.dataset.clickSetup) {
            modal.dataset.clickSetup = 'true';
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    // Récupérer l'ID du retour depuis le data attribute
                    const retourId = modal.dataset.retourId;
                    if (retourId) {
                        fermerEtValiderRetourMenage(retourId);
                    } else {
                        fermerModalRetourMenage();
                    }
                }
            });
        }
    };
    // Essayer périodiquement si la modal n'existe pas encore
    setInterval(setupModalRetourClick, 1000);
});

window.affichEtValiderRetourMenage = fermerEtValiderRetourMenage;
window.fermererDetailsRetourMenage = afficherDetailsRetourMenage;
window.fermerModalRetourMenage = fermerModalRetourMenage;
window.chargerGraphiqueTresorerie = afficherGraphiqueTresorerieDashboard;

// =============================================
// FONCTION ONGLET CHECK-LISTS
// =============================================

async function loadChecklistsTab() {
    const container = document.getElementById('checklist-reservations-container');
    if (!container) return;
    
    if (!CHECKLIST_FEATURE_ENABLED) {
        container.innerHTML = '<p style="color: #e74c3c; font-style: italic;">❌ Fonctionnalité check-lists désactivée (table non disponible)</p>';
        return;
    }
    
    try {
        container.innerHTML = '<p style="color: #666; font-style: italic;">⏳ Chargement des réservations...</p>';
        
        // Charger les réservations directement depuis Supabase
        const { data: reservations, error } = await supabaseClient
            .from('reservations')
            .select('*')
            .order('check_in', { ascending: true });
        
        if (error) throw error;
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Filtrer uniquement les réservations EN COURS (arrivée <= aujourd'hui <= départ)
        const activeReservations = reservations.filter(r => {
            const dateDebut = new Date(r.check_in);
            const dateFin = new Date(r.check_out);
            dateDebut.setHours(0, 0, 0, 0);
            dateFin.setHours(0, 0, 0, 0);
            
            return dateDebut <= today && dateFin >= today;
        });
        
        if (activeReservations.length === 0) {
            container.innerHTML = '<p style="color: #666; font-style: italic;">Aucune réservation en cours actuellement</p>';
            return;
        }
        
        let html = '';
        for (const r of activeReservations) {
            const gite = await window.gitesManager.getById(r.gite_id);
            if (!gite) {
                console.warn(`⚠️ Gîte non trouvé pour gite_id: ${r.gite_id}`);
                continue;
            }
            
            const checklistProgress = await getReservationChecklistProgressDashboard(r.id, r.gite_id);
            
            const totalEntree = checklistProgress.entree.total;
            const completedEntree = checklistProgress.entree.completed;
            const percentEntree = checklistProgress.entree.percent;
            
            const totalSortie = checklistProgress.sortie.total;
            const completedSortie = checklistProgress.sortie.completed;
            const percentSortie = checklistProgress.sortie.percent;
            
            const colorEntree = percentEntree === 100 ? '#27AE60' : percentEntree > 50 ? '#F39C12' : '#E74C3C';
            const colorSortie = percentSortie === 100 ? '#27AE60' : percentSortie > 50 ? '#F39C12' : '#E74C3C';
            
            // Récupérer les détails des items
            const { data: templatesEntree } = await supabaseClient
                .from('checklist_templates')
                .select('*')
                .eq('gite_id', r.gite_id)
                .eq('type', 'entree')
                .eq('actif', true)
                .order('ordre', { ascending: true });
            
            const { data: templatesSortie } = await supabaseClient
                .from('checklist_templates')
                .select('*')
                .eq('gite_id', r.gite_id)
                .eq('type', 'sortie')
                .eq('actif', true)
                .order('ordre', { ascending: true });
            
            const { data: progress } = await supabaseClient
                .from('checklist_progress')
                .select('*')
                .eq('reservation_id', r.id);
            
            const progressMap = {};
            if (progress) {
                progress.forEach(p => {
                    progressMap[p.template_id] = p.completed;
                });
            }
            
            html += `
                <div style="background: white; border: 3px solid ${gite.color}; padding: 15px; border-radius: 12px; box-shadow: 4px 4px 0 #2D3436; margin-bottom: 15px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                        <div style="flex: 1;">
                            <strong style="font-size: 1.1rem; color: #2D3436;">${r.client_name}</strong>
                            <div style="font-size: 0.85rem; color: #666; margin-top: 4px;">
                                🏠 ${gite.name} • 📅 ${new Date(r.check_in).toLocaleDateString('fr-FR')} → ${new Date(r.check_out).toLocaleDateString('fr-FR')}
                            </div>
                        </div>
                        <div style="display: flex; gap: 8px;">
                            <button onclick="toggleChecklistDetails('${r.id}')" class="btn-neo" style="background: #fdcb6e; color: #2D3436; border: 2px solid #2D3436; box-shadow: 2px 2px 0 #2D3436; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-size: 0.85rem; font-weight: 600;">
                                <span id="toggle-icon-${r.id}">👁️</span> Détails
                            </button>
                            <button onclick="aperçuFicheClient('${r.id}')" class="btn-neo" style="background: #74b9ff; color: white; border: 2px solid #2D3436; box-shadow: 2px 2px 0 #2D3436; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-size: 0.85rem; font-weight: 600;">
                                📄 Fiche
                            </button>
                        </div>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                        <!-- Entrée -->
                        <div style="background: #f8f9fa; padding: 12px; border-radius: 8px; border: 2px solid ${colorEntree};">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                                <strong style="font-size: 0.9rem; color: #2D3436;">🏠 Entrée</strong>
                                <span style="font-size: 0.85rem; font-weight: 600; color: ${colorEntree};">${completedEntree}/${totalEntree}</span>
                            </div>
                            <div style="background: #e0e0e0; height: 8px; border-radius: 4px; overflow: hidden;">
                                <div style="background: ${colorEntree}; height: 100%; width: ${percentEntree}%; transition: width 0.3s;"></div>
                            </div>
                            <div style="text-align: right; margin-top: 4px; font-size: 0.75rem; font-weight: 600; color: ${colorEntree};">${percentEntree}%</div>
                        </div>
                        
                        <!-- Sortie -->
                        <div style="background: #f8f9fa; padding: 12px; border-radius: 8px; border: 2px solid ${colorSortie};">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                                <strong style="font-size: 0.9rem; color: #2D3436;">🧳 Sortie</strong>
                                <span style="font-size: 0.85rem; font-weight: 600; color: ${colorSortie};">${completedSortie}/${totalSortie}</span>
                            </div>
                            <div style="background: #e0e0e0; height: 8px; border-radius: 4px; overflow: hidden;">
                                <div style="background: ${colorSortie}; height: 100%; width: ${percentSortie}%; transition: width 0.3s;"></div>
                            </div>
                            <div style="text-align: right; margin-top: 4px; font-size: 0.75rem; font-weight: 600; color: ${colorSortie};">${percentSortie}%</div>
                        </div>
                    </div>
                    
                    <!-- Liste détaillée (cachée par défaut) -->
                    <div id="checklist-details-${r.id}" style="display: none; margin-top: 15px; padding-top: 15px; border-top: 2px solid #e5e7eb;">
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                            <!-- Items Entrée -->
                            <div>
                                <h4 style="margin: 0 0 10px 0; font-size: 0.95rem; color: #2D3436;">🏠 Checklist Entrée</h4>
                                ${(templatesEntree && templatesEntree.length > 0) ? templatesEntree.map(t => {
                                    const isChecked = progressMap[t.id] === true;
                                    return `
                                        <div style="padding: 8px; background: ${isChecked ? '#d1fae5' : '#fff'}; border-radius: 6px; margin-bottom: 6px; border: 2px solid ${isChecked ? '#10b981' : '#e5e7eb'};">
                                            <div style="display: flex; align-items: start; gap: 8px;">
                                                <span style="font-size: 1.1rem;">${isChecked ? '✅' : '❌'}</span>
                                                <div style="flex: 1; font-size: 0.85rem;">
                                                    <div style="font-weight: ${isChecked ? '600' : '400'}; color: ${isChecked ? '#059669' : '#6b7280'};">${t.texte}</div>
                                                    ${t.description ? `<div style="font-size: 0.8rem; color: var(--gray-600); margin-top: 2px;">${t.description}</div>` : ''}
                                                </div>
                                            </div>
                                        </div>
                                    `;
                                }).join('') : '<p style="color: #666; font-style: italic; font-size: 0.85rem;">Aucun item</p>'}
                            </div>
                            
                            <!-- Items Sortie -->
                            <div>
                                <h4 style="margin: 0 0 10px 0; font-size: 0.95rem; color: #2D3436;">🧳 Checklist Sortie</h4>
                                ${(templatesSortie && templatesSortie.length > 0) ? templatesSortie.map(t => {
                                    const isChecked = progressMap[t.id] === true;
                                    return `
                                        <div style="padding: 8px; background: ${isChecked ? '#d1fae5' : '#fff'}; border-radius: 6px; margin-bottom: 6px; border: 2px solid ${isChecked ? '#10b981' : '#e5e7eb'};">
                                            <div style="display: flex; align-items: start; gap: 8px;">
                                                <span style="font-size: 1.1rem;">${isChecked ? '✅' : '❌'}</span>
                                                <div style="flex: 1; font-size: 0.85rem;">
                                                    <div style="font-weight: ${isChecked ? '600' : '400'}; color: ${isChecked ? '#059669' : '#6b7280'};">${t.texte}</div>
                                                    ${t.description ? `<div style="font-size: 0.8rem; color: var(--gray-600); margin-top: 2px;">${t.description}</div>` : ''}
                                                </div>
                                            </div>
                                        </div>
                                    `;
                                }).join('') : '<p style="color: #666; font-style: italic; font-size: 0.85rem;">Aucun item</p>'}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }
        
        container.innerHTML = html;
    } catch (error) {
        console.error('❌ Erreur chargement check-lists:', error);
        container.innerHTML = '<p style="color: #e74c3c;">❌ Erreur lors du chargement</p>';
    }
}

// Exposer la fonction globalement
window.loadChecklistsTab = loadChecklistsTab;

// Fonction pour afficher/masquer les détails de checklist
function toggleChecklistDetails(reservationId) {
    const detailsDiv = document.getElementById(`checklist-details-${reservationId}`);
    const icon = document.getElementById(`toggle-icon-${reservationId}`);
    
    if (detailsDiv.style.display === 'none') {
        detailsDiv.style.display = 'block';
        icon.textContent = '🙈';
    } else {
        detailsDiv.style.display = 'none';
        icon.textContent = '👁️';
    }
}

window.toggleChecklistDetails = toggleChecklistDetails;
window.handleAdminFilterChange = handleAdminFilterChange;
window.selectAdminFilter = selectAdminFilter;
