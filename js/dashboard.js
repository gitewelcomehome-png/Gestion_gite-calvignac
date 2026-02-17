// ╔══════════════════════════════════════════════════════════════════════════╗
// ║  ⚠️ ⚠️ ⚠️  FICHIER DESKTOP - NE PAS MODIFIER  ⚠️ ⚠️ ⚠️                      ║
// ║                                                                          ║
// ║  Ce fichier est EN PRODUCTION et doit rester STABLE                     ║
// ║  Pour le mobile, utiliser tabs/mobile/dashboard.html avec JS inline     ║
// ║  NE TOUCHER À CE FICHIER QUE SUR DEMANDE EXPLICITE                      ║
// ╚══════════════════════════════════════════════════════════════════════════╝

// Dashboard.js v4.0 - 25 Jan 2026

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
    
    // console.log(`🔄 Filtre admin changé: ${mode}`);
    
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
    
    // console.log(`🔄 Filtre admin changé: ${mode}`);
    
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
// 📋 NAVIGATION VERS DÉTAIL CHECK-LIST
// ==========================================

/**
 * Ouvre le détail d'une check-list spécifique
 * @param {number} reservationId - ID de la réservation
 * @param {number} giteId - ID du gîte
 * @param {string} type - Type de check-list ('entree' ou 'sortie')
 */
window.openChecklistDetail = function(reservationId, giteId, type) {
    // Sauvegarder les infos dans localStorage pour filtrage
    localStorage.setItem('checklistFilter', JSON.stringify({
        reservationId: reservationId,
        giteId: giteId,
        type: type,
        timestamp: Date.now()
    }));
    
    // Rediriger vers l'onglet checklists
    if (typeof switchTab === 'function') {
        switchTab('checklists');
    } else {
        console.error('❌ Fonction switchTab non disponible');
    }
};

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

function showDashboardReminderNotification(message) {
    if (typeof showNotification === 'function') {
        showNotification(message, 'warning');
        return;
    }

    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: linear-gradient(135deg, #f39c12 0%, #e67e22 100%);
        color: white;
        padding: 12px 20px;
        border-radius: 12px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        font-weight: 600;
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
        max-width: 420px;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 3500);
}

async function ensureReservationReminderTodo(sendReminderReservations) {
    if (!sendReminderReservations || sendReminderReservations.length === 0) return;

    const now = new Date();
    const dateLabel = now.toLocaleDateString('fr-FR');
    const title = `📄 Envoyer fiches clients J-3 (${dateLabel})`;

    const { data: existingTodo, error: checkError } = await window.supabaseClient
        .from('todos')
        .select('id')
        .eq('category', 'reservations')
        .eq('title', title)
        .eq('completed', false)
        .maybeSingle();

    if (checkError) {
        console.error('❌ Erreur vérification tâche J-3:', checkError);
        return;
    }

    if (existingTodo?.id) return;

    const reservationsPreview = sendReminderReservations
        .slice(0, 5)
        .map(r => r.client_name || 'Client')
        .join(', ');

    const description = reservationsPreview
        ? `${sendReminderReservations.length} fiche(s) à envoyer aujourd'hui. Clients: ${reservationsPreview}${sendReminderReservations.length > 5 ? ', ...' : ''}`
        : `${sendReminderReservations.length} fiche(s) à envoyer aujourd'hui.`;

    const { data: authData } = await window.supabaseClient.auth.getUser();
    const ownerUserId = authData?.user?.id || null;

    const { error: insertError } = await window.supabaseClient
        .from('todos')
        .insert({
            owner_user_id: ownerUserId,
            category: 'reservations',
            title,
            description,
            completed: false,
            status: 'in_progress',
            created_at: new Date().toISOString()
        });

    if (insertError) {
        console.error('❌ Erreur création tâche J-3:', insertError);
    }
}

async function updateDashboardAlerts() {
    const alerts = [];
    
    // Récupérer les gîtes visibles selon l'abonnement
    const gitesVisibles = await window.gitesManager.getVisibleGites();
    const gitesVisiblesIds = gitesVisibles.map(g => g.id);
    
    // Récupérer les réservations des gîtes visibles uniquement
    const allReservations = await getAllReservations();
    const reservations = allReservations.filter(r => gitesVisiblesIds.includes(r.gite_id));
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Vérifier les fiches clients à envoyer (J-3)
    const sendReminderReservations = reservations.filter(r => {
        const arrival = parseLocalDate(r.dateDebut);
        const daysUntilArrival = Math.ceil((arrival - today) / (1000 * 60 * 60 * 24));
        return daysUntilArrival === 3;
    });
    
    if (sendReminderReservations.length > 0) {
        const notificationKey = `${today.toISOString().split('T')[0]}-${sendReminderReservations.length}`;
        if (window.__dashboardLastJ3NotificationKey !== notificationKey) {
            showDashboardReminderNotification(`📄 ${sendReminderReservations.length} fiche(s) client à envoyer (J-3)`);
            window.__dashboardLastJ3NotificationKey = notificationKey;
        }

        await ensureReservationReminderTodo(sendReminderReservations);
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

    // Vérifier les propositions de changement de date ménage (société)
    const { data: propositionsMenage } = await window.supabaseClient
        .from('cleaning_schedule')
        .select('id')
        .eq('status', 'pending_validation')
        .eq('proposed_by', 'company');

    if (propositionsMenage && propositionsMenage.length > 0) {
        alerts.push({
            type: 'warning',
            icon: '🧹',
            message: `${propositionsMenage.length} proposition(s) de changement ménage en attente`,
            action: () => switchTab('dashboard')
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
        .select('id, title, description, category, completed, archived_at, gite_id, created_at, owner_user_id')
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

// Récupérer le nombre de commandes prestations par réservation
async function getCommandesPrestationsCount() {
    try {
        const { data, error } = await window.supabaseClient
            .from('commandes_prestations')
            .select('reservation_id, id')
            .neq('statut', 'cancelled');
        
        if (error) throw error;
        
        // Créer un objet avec le compteur par reservation_id
        const countMap = {};
        (data || []).forEach(cmd => {
            countMap[cmd.reservation_id] = (countMap[cmd.reservation_id] || 0) + 1;
        });
        
        return countMap;
    } catch (err) {
        console.error('❌ Erreur récupération commandes prestations:', err);
        return {};
    }
}

async function updateDashboardReservations() {
    // Récupérer les gîtes visibles selon l'abonnement
    const gitesVisibles = await window.gitesManager.getVisibleGites();
    const gitesVisiblesIds = gitesVisibles.map(g => g.id);
    
    // Récupérer les réservations des gîtes visibles uniquement
    const allReservations = await getAllReservations();
    const reservations = allReservations.filter(r => gitesVisiblesIds.includes(r.gite_id));
    
    // Récupérer les compteurs de commandes prestations
    const commandesCountMap = await getCommandesPrestationsCount();
    
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
        window.SecurityUtils.setInnerHTML(container, '<p style="text-align: center; color: var(--text-secondary); padding: 40px;">Aucune réservation dans les 7 prochains jours</p>');
        // Masquer la pagination
        const paginationDiv = document.getElementById('dashboard-reservations-pagination');
        if (paginationDiv) paginationDiv.style.display = 'none';
        return;
    }
    
    // ========================================
    // PAGINATION : 3 réservations par page max
    // ========================================
    const ITEMS_PER_PAGE = 3;
    const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
    
    // Initialiser la page actuelle si elle n'existe pas
    if (!window.dashboardReservationsCurrentPage) {
        window.dashboardReservationsCurrentPage = 1;
    }
    
    // S'assurer que la page actuelle est valide
    if (window.dashboardReservationsCurrentPage > totalPages) {
        window.dashboardReservationsCurrentPage = totalPages;
    }
    if (window.dashboardReservationsCurrentPage < 1) {
        window.dashboardReservationsCurrentPage = 1;
    }
    
    // Calculer les indices de début et fin pour la page actuelle
    const startIndex = (window.dashboardReservationsCurrentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const currentPageReservations = filtered.slice(startIndex, endIndex);
    
    let html = '';
    for (const r of currentPageReservations) {
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
            badge = '<svg style="width:16px;height:16px;display:inline-block;vertical-align:middle;margin-right:4px;stroke:currentColor;" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 17V3"/><path d="m6 11 6 6 6-6"/><path d="M19 21H5"/></svg>Arrivée AUJOURD\'HUI';
            badgeColor = '#27AE60';
        } else if (isDepartureToday) {
            badge = '<svg style="width:16px;height:16px;display:inline-block;vertical-align:middle;margin-right:4px;stroke:currentColor;" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v14"/><path d="m18 13-6 6-6-6"/><path d="M5 21h14"/></svg>Départ AUJOURD\'HUI';
            badgeColor = '#E74C3C';
        } else if (dateDebut > today) {
            badge = '<svg style="width:16px;height:16px;display:inline-block;vertical-align:middle;margin-right:4px;stroke:currentColor;" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 17V3"/><path d="m6 11 6 6 6-6"/><path d="M19 21H5"/></svg>Arrivée prochaine';
            badgeColor = '#3498DB';
        } else {
            badge = '<svg style="width:16px;height:16px;display:inline-block;vertical-align:middle;margin-right:4px;stroke:currentColor;" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>Séjour en cours';
            badgeColor = '#9B59B6';
        }
        
        const gite = await window.gitesManager.getByName(r.gite) || await window.gitesManager.getById(r.gite_id);
        const giteColor = gite ? gite.color : '#667eea';
        const paiementIcon = r.paiement === 'Soldé' ? '<svg style="width:18px;height:18px;" viewBox="0 0 24 24" fill="none" stroke="#27AE60" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>' : r.paiement === 'Acompte reçu' ? '<svg style="width:18px;height:18px;" viewBox="0 0 24 24" fill="none" stroke="#F39C12" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>' : '<svg style="width:18px;height:18px;" viewBox="0 0 24 24" fill="none" stroke="#E74C3C" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>';
        
        // Récupérer la plateforme et sa couleur
        const getPlatformInfo = (platform) => {
            if (!platform) return { name: 'Direct', color: '#95a5a6' };
            
            const normalized = platform.toLowerCase().trim();
            
            if (normalized.includes('airbnb')) {
                return { name: 'Airbnb', color: '#FF5A5F' };
            } else if (normalized.includes('booking')) {
                return { name: 'Booking', color: '#003580' };
            } else if (normalized.includes('vrbo')) {
                return { name: 'Vrbo', color: '#0984e3' };
            } else if (normalized.includes('abritel') || normalized.includes('homeaway') || normalized.includes('homelidays')) {
                return { name: 'Abritel', color: '#74b9ff' };
            } else if (normalized.includes('tripadvisor')) {
                return { name: 'TripAdvisor', color: '#00AA6C' };
            } else if (normalized.includes('gîtes') || normalized.includes('gites') || normalized.includes('france')) {
                return { name: 'Gîtes de France', color: '#27AE60' };
            } else {
                return { name: platform.toUpperCase(), color: '#95a5a6' };
            }
        };
        
        const platformInfo = getPlatformInfo(r.site);
        
        // Vérifier si des commandes prestations existent
        const commandesCount = commandesCountMap[r.id] || 0;
        const hasPrestations = commandesCount > 0;
        
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
                    <span onclick="openChecklistDetail(${r.id}, ${r.gite_id}, 'entree')" style="display: flex; align-items: center; gap: 4px; cursor: pointer; transition: opacity 0.2s;" onmouseover="this.style.opacity='0.7'" onmouseout="this.style.opacity='1'" title="Cliquez pour voir le détail">
                        <span style="width: 10px; height: 10px; border-radius: 50%; background: ${colorEntree};"></span>
                        <svg style="width:16px;height:16px;flex-shrink:0;stroke:currentColor;" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg> Entrée: ${checklistProgress.entree.completed}/${checklistProgress.entree.total}
                    </span>
                `;
            }
            
            if (checklistProgress.sortie.total > 0) {
                const colorSortie = getProgressColorDashboard(checklistProgress.sortie.percent);
                checklistHtml += `
                    <span onclick="openChecklistDetail(${r.id}, ${r.gite_id}, 'sortie')" style="display: flex; align-items: center; gap: 4px; cursor: pointer; transition: opacity 0.2s;" onmouseover="this.style.opacity='0.7'" onmouseout="this.style.opacity='1'" title="Cliquez pour voir le détail">
                        <span style="width: 10px; height: 10px; border-radius: 50%; background: ${colorSortie};"></span>
                        <svg style="width:16px;height:16px;flex-shrink:0;stroke:currentColor;" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg> Sortie: ${checklistProgress.sortie.completed}/${checklistProgress.sortie.total}
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
                <div style="background: #ffffff; border: 2px solid ${giteColor}; padding: 8px; border-radius: 10px; box-shadow: 2px 2px 0 #2D3436; margin-bottom: 8px;">
                    <div style="display: flex; align-items: center; justify-content: space-between; gap: 6px; margin-bottom: 4px;">
                        <div style="font-size: 0.75rem; font-weight: 700; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 1;">${r.nom}</div>
                        ${hasPrestations ? `<button data-reservation-id="${r.id}" class="btn-voir-commande-prestations" style="background: #27AE60; color: white; border: 2px solid #2D3436; padding: 3px 8px; border-radius: 6px; cursor: pointer; font-size: 0.65rem; font-weight: 700; box-shadow: 1px 1px 0 #2D3436; white-space: nowrap;">🛒 ${commandesCount}</button>` : ''}
                    </div>
                    <div style="font-size: 0.7rem; color: #27AE60; margin-bottom: 3px; font-weight: 600;"><i data-lucide="arrow-down-to-line" style="width:12px;height:12px;display:inline-block;vertical-align:middle;"></i> ${formatDateFromObj(dateDebut).split(' ').slice(0,2).join(' ')} ${horaireArrivee}</div>
                    <div style="font-size: 0.7rem; color: #E74C3C; margin-bottom: 6px; font-weight: 600;">📤 ${formatDateFromObj(dateFin).split(' ').slice(0,2).join(' ')} ${horaireDepart}</div>
                    ${showFicheButton ? `<div style="display: flex; align-items: center; gap: 6px; justify-content: space-between;"><button onclick="aperçuFicheClient('${r.id}')" style="flex: 1; background: #74b9ff; color: white; border: 2px solid #2D3436; padding: 6px; border-radius: 8px; cursor: pointer; font-size: 0.7rem; font-weight: 600; box-shadow: 2px 2px 0 #2D3436;">📄 Fiche</button><div style="display: inline-block; padding: 3px 8px; background: ${platformInfo.color}; color: white; border-radius: 4px; font-size: 0.65rem; font-weight: 700; white-space: nowrap;">${platformInfo.name}</div></div>` : `<div style="display: inline-block; padding: 3px 8px; background: ${platformInfo.color}; color: white; border-radius: 4px; font-size: 0.65rem; font-weight: 700;">${platformInfo.name}</div>`}
                </div>
            `;
        } else {
            // ========================================
            // 💻 FORMAT DESKTOP - DÉTAILS COMPLETS
            // ========================================
            html += `
                <div class="dashboard-reservation-card" style="border-color: ${giteColor};">
                    <div class="dashboard-reservation-content">
                        <div class="dashboard-reservation-info">
                            <strong class="dashboard-reservation-name" style="font-size: 0.95rem;">${r.nom}</strong>
                            ${shouldSendReminder ? '<div style="position: absolute; top: 15px; right: 68px; background: #ffeaa7; color: var(--text); padding: 5px 10px; border: 2px solid var(--stroke); box-shadow: 2px 2px 0 var(--stroke); border-radius: 8px; font-size: 0.7rem; font-weight: 700;"><svg viewBox="0 0 24 24" style="width:12px;height:12px;display:inline-block;vertical-align:middle;margin-right:2px;" stroke="currentColor" fill="none" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> J-3 : Fiche</div>' : ''}
                            <div class="dashboard-reservation-badge-wrapper">
                                <span class="dashboard-reservation-badge" style="background: ${badgeColor};">${badge}</span>
                            </div>
                            <div class="dashboard-reservation-dates">
                                <svg style="width:16px;height:16px;flex-shrink:0;stroke:currentColor;" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
                                <span style="min-width: 120px;">${formatDateFromObj(dateDebut)}</span>
                                <strong style="color: #27AE60; display: flex; align-items: center; gap: 2px;"><svg style="width:16px;height:16px;flex-shrink:0;stroke:currentColor;" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> ${horaireArrivee}</strong>
                            </div>
                            <div class="dashboard-reservation-dates">
                                <svg style="width:16px;height:16px;flex-shrink:0;opacity:0;pointer-events:none;stroke:currentColor;" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
                                <span style="min-width: 120px;">${formatDateFromObj(dateFin)}</span>
                                <strong class="dashboard-reservation-time dashboard-reservation-time-departure"><svg style="width:16px;height:16px;flex-shrink:0;stroke:currentColor;" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> ${horaireDepart}</strong>
                                <span class="dashboard-reservation-nights">${r.nuits}n</span>
                            </div>
                            <div class="dashboard-reservation-meta">
                                <span style="display: flex; align-items: center; gap: 3px;"><svg style="width:16px;height:16px;display:inline-block;vertical-align:middle;stroke:currentColor;" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> <strong>${r.gite}</strong></span>
                                <span style="display: flex; align-items: center; gap: 3px;"><svg style="width:16px;height:16px;display:inline-block;vertical-align:middle;stroke:currentColor;" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> <strong>${r.nbPersonnes || '-'}</strong></span>
                                ${daysUntilArrival >= 0 ? `<span style="color: ${daysUntilArrival <= 3 ? '#F39C12' : '#999'}; font-weight: 600; display: flex; align-items: center; gap: 3px;"><svg style="width:16px;height:16px;display:inline-block;vertical-align:middle;stroke:currentColor;" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg> J${daysUntilArrival > 0 ? '-' + daysUntilArrival : ''}</span>` : ''}
                            </div>
                            ${checklistHtml}
                        </div>
                        <span class="dashboard-reservation-payment" title="${r.paiement}">${paiementIcon}</span>
                    </div>
                    <div class="dashboard-reservation-actions" style="display: flex; align-items: center; gap: 6px;">
                        ${hasPrestations ? `
                        <button data-reservation-id="${r.id}" class="btn-voir-commande-prestations dashboard-reservation-btn" style="background: #27AE60; color: white; border: 2px solid var(--stroke); font-weight: 700; padding: 8px 12px; border-radius: 10px; cursor: pointer; display: flex; align-items: center; gap: 6px; font-size: 0.75rem; box-shadow: 2px 2px 0 var(--stroke); transition: transform 0.1s;">
                            <svg style="width:18px;height:18px;stroke:currentColor;" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
                            <span>${commandesCount}</span>
                        </button>
                        ` : ''}
                        ${showFicheButton ? `
                        <button onclick="aperçuFicheClient('${r.id}')" class="dashboard-reservation-btn dashboard-reservation-btn-primary">
                            <svg style="width:20px;height:20px;stroke:currentColor;" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                            <span>Fiche</span>
                        </button>
                        ` : ''}
                        <button onclick="openEditReservation('${r.id}')" class="dashboard-reservation-btn dashboard-reservation-btn-secondary">
                            <svg style="width:20px;height:20px;stroke:currentColor;" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                        <div style="display: inline-block; padding: 3px 8px; background: ${platformInfo.color}; color: white; border-radius: 4px; font-size: 0.7rem; font-weight: 700; white-space: nowrap; margin-left: auto;">${platformInfo.name}</div>
                    </div>
                </div>
            `;
        }
    }
    
    window.SecurityUtils.setInnerHTML(container, html);
    
    // ========================================
    // GESTION DE LA PAGINATION
    // ========================================
    const paginationDiv = document.getElementById('dashboard-reservations-pagination');
    const btnPrev = document.getElementById('btn-prev-reservations');
    const btnNext = document.getElementById('btn-next-reservations');
    const paginationInfo = document.getElementById('pagination-info-reservations');
    
    if (filtered.length > ITEMS_PER_PAGE) {
        // Afficher la pagination
        if (paginationDiv) paginationDiv.style.display = 'flex';
        
        // Mettre à jour les boutons
        if (btnPrev) btnPrev.disabled = (window.dashboardReservationsCurrentPage === 1);
        if (btnNext) btnNext.disabled = (window.dashboardReservationsCurrentPage === totalPages);
        
        // Mettre à jour l'indicateur de page
        if (paginationInfo) paginationInfo.textContent = `Page ${window.dashboardReservationsCurrentPage}/${totalPages}`;
    } else {
        // Masquer la pagination si 2 réservations ou moins
        if (paginationDiv) paginationDiv.style.display = 'none';
    }
    
    // Ré-initialiser les icônes Lucide après mise à jour du DOM
    if (typeof lucide !== 'undefined') {
        setTimeout(() => lucide.createIcons(), 50);
    }
    
    // ✅ Event delegation pour les boutons de commandes prestations
    const reservationsContainer = document.getElementById('dashboard-reservations');
    if (reservationsContainer) {
        // Supprimer l'ancien listener s'il existe
        if (window.commandesPrestationsBtnClickHandler) {
            reservationsContainer.removeEventListener('click', window.commandesPrestationsBtnClickHandler);
        }
        
        // Ajouter le nouveau listener
        window.commandesPrestationsBtnClickHandler = async (e) => {
            const btn = e.target.closest('.btn-voir-commande-prestations');
            if (btn) {
                const reservationId = btn.getAttribute('data-reservation-id');
                await voirCommandePrestations(reservationId);
            }
        };
        reservationsContainer.addEventListener('click', window.commandesPrestationsBtnClickHandler);
    }
}

// ==========================================
// 🛒 MODAL DÉTAILS COMMANDES PRESTATIONS
// ==========================================

async function voirCommandePrestations(reservationId) {
    try {
        // Récupérer les commandes avec les lignes de commande
        const { data: commandes, error } = await window.supabaseClient
            .from('commandes_prestations')
            .select(`
                *,
                lignes_commande_prestations(*)
            `)
            .eq('reservation_id', reservationId)
            .neq('statut', 'cancelled')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        if (!commandes || commandes.length === 0) {
            showNotification('Aucune commande trouvée', 'error');
            return;
        }
        
        // Récupérer les infos de la réservation
        const { data: reservation, error: resError } = await window.supabaseClient
            .from('reservations')
            .select('client_name, gite')
            .eq('id', reservationId)
            .single();
        
        if (resError) console.warn('⚠️ Erreur récupération réservation:', resError);
        
        // Construire le HTML du modal
        let commandesHtml = '';
        
        commandes.forEach(commande => {
            const dateCommande = new Date(commande.created_at).toLocaleDateString('fr-FR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            const statutBadge = commande.statut === 'paid' 
                ? '<span style="background: #27AE60; color: white; padding: 3px 8px; border-radius: 6px; font-size: 0.7rem; font-weight: 700;">Payé</span>'
                : '<span style="background: #F39C12; color: white; padding: 3px 8px; border-radius: 6px; font-size: 0.7rem; font-weight: 700;">En attente</span>';
            
            let lignesHtml = '';
            (commande.lignes_commande_prestations || []).forEach(ligne => {
                lignesHtml += `
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #eee;">
                        <div>
                            <div style="font-weight: 600; color: var(--text);">${ligne.nom_prestation}</div>
                            <div style="font-size: 0.8rem; color: var(--text-secondary);">Quantité: ${ligne.quantite} × ${parseFloat(ligne.prix_unitaire).toFixed(2)}€</div>
                        </div>
                        <div style="font-weight: 700; color: var(--text); font-size: 1.1rem;">${parseFloat(ligne.prix_total).toFixed(2)}€</div>
                    </div>
                `;
            });
            
            commandesHtml += `
                <div style="background: #f8f9fa; border: 2px solid var(--stroke); border-radius: 10px; padding: 15px; margin-bottom: 15px; box-shadow: 2px 2px 0 var(--stroke);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                        <div>
                            <div style="font-weight: 700; color: var(--text); font-size: 1rem;">Commande #${commande.numero_commande || commande.id.slice(0, 8)}</div>
                            <div style="font-size: 0.75rem; color: var(--text-secondary);">${dateCommande}</div>
                        </div>
                        ${statutBadge}
                    </div>
                    
                    <div style="margin-bottom: 12px;">
                        ${lignesHtml}
                    </div>
                    
                    <div style="border-top: 2px solid var(--stroke); padding-top: 10px; margin-top: 10px;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                            <span style="color: var(--text-secondary);">Sous-total prestations</span>
                            <span style="font-weight: 600;">${parseFloat(commande.montant_prestations).toFixed(2)}€</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                            <span style="color: var(--text-secondary);">Commission (5%)</span>
                            <span style="font-weight: 600;">${parseFloat(commande.montant_commission).toFixed(2)}€</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; padding-top: 8px; border-top: 1px solid var(--stroke);">
                            <span style="font-weight: 700; font-size: 1.1rem;">Vous recevez</span>
                            <span style="font-weight: 700; font-size: 1.1rem; color: #27AE60;">${parseFloat(commande.montant_net_owner).toFixed(2)}€</span>
                        </div>
                    </div>
                </div>
            `;
        });
        
        // Créer et afficher le modal
        const modal = document.createElement('div');
        modal.id = 'modal-commande-prestations';
        modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 99999; display: flex; align-items: center; justify-content: center; padding: 20px;';
        
        modal.innerHTML = `
            <div style="background: white; border-radius: 15px; max-width: 600px; width: 100%; max-height: 90vh; overflow-y: auto; border: 2px solid var(--stroke); box-shadow: 4px 4px 0 var(--stroke);">
                <div style="position: sticky; top: 0; background: white; border-bottom: 2px solid var(--stroke); padding: 20px; display: flex; justify-content: space-between; align-items: center; border-radius: 15px 15px 0 0; z-index: 1;">
                    <div>
                        <h3 style="margin: 0; color: var(--text); font-size: 1.3rem;">🛒 Commandes Prestations</h3>
                        ${reservation ? `<div style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 5px;">${reservation.client_name} - ${reservation.gite}</div>` : ''}
                    </div>
                    <button id="btn-close-modal-commande" style="background: #E74C3C; color: white; border: 2px solid var(--stroke); width: 40px; height: 40px; border-radius: 10px; cursor: pointer; font-size: 1.5rem; display: flex; align-items: center; justify-content: center; box-shadow: 2px 2px 0 var(--stroke); transition: transform 0.1s;">×</button>
                </div>
                <div style="padding: 20px;">
                    ${commandesHtml}
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Event listeners avec pattern delegation
        document.getElementById('btn-close-modal-commande').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
        
    } catch (err) {
        console.error('❌ Erreur affichage commandes prestations:', err);
        showNotification('Erreur lors de l\'affichage des commandes', 'error');
    }
}

// ========================================
// FONCTION DE CHANGEMENT DE PAGE
// ========================================
function changeDashboardReservationsPage(direction) {
    if (direction === 'next') {
        window.dashboardReservationsCurrentPage = (window.dashboardReservationsCurrentPage || 1) + 1;
    } else if (direction === 'prev') {
        window.dashboardReservationsCurrentPage = Math.max(1, (window.dashboardReservationsCurrentPage || 1) - 1);
    }
    
    // Recharger les réservations avec la nouvelle page
    updateDashboardReservations();
}

// ==========================================
// 🛒 COMMANDES PRESTATIONS PAR PÉRIODE
// ==========================================

/**
 * Récupérer les commandes prestations pour une période donnée avec les gîtes respectant l'ordre
 */
async function getCommandesPrestationsPeriod(startDate, endDate) {
    try {
        // Récupérer les gîtes visibles dans l'ordre défini
        const gitesVisibles = await window.gitesManager.getVisibleGites();
        
        // Récupérer toutes les commandes de la période (non annulées)
        const { data: commandes, error } = await window.supabaseClient
            .from('commandes_prestations')
            .select(`
                *,
                lignes_commande_prestations(*),
                reservations!inner(gite, gite_id)
            `)
            .gte('created_at', startDate.toISOString())
            .lte('created_at', endDate.toISOString())
            .neq('statut', 'cancelled');
        
        if (error) throw error;
        
        // Organiser par gîte en respectant l'ordre de gitesVisibles
        const dataByGite = {};
        
        gitesVisibles.forEach(gite => {
            dataByGite[gite.id] = {
                gite: gite,
                commandes: [],
                nombreTotal: 0,
                prestations: [],
                caTotal: 0
            };
        });
        
        // Remplir avec les commandes
        (commandes || []).forEach(commande => {
            const giteId = commande.gite_id;
            
            if (dataByGite[giteId]) {
                dataByGite[giteId].commandes.push(commande);
                dataByGite[giteId].nombreTotal += 1;
                dataByGite[giteId].caTotal += parseFloat(commande.montant_prestations || 0);
                
                // Ajouter les prestations (lignes de commande)
                (commande.lignes_commande_prestations || []).forEach(ligne => {
                    const existing = dataByGite[giteId].prestations.find(p => p.nom === ligne.nom_prestation);
                    if (existing) {
                        existing.quantite += ligne.quantite;
                        existing.total += parseFloat(ligne.prix_total || 0);
                    } else {
                        dataByGite[giteId].prestations.push({
                            nom: ligne.nom_prestation,
                            quantite: ligne.quantite,
                            total: parseFloat(ligne.prix_total || 0)
                        });
                    }
                });
            }
        });
        
        // Retourner dans l'ordre des gîtes
        return gitesVisibles.map(gite => dataByGite[gite.id]).filter(data => data.nombreTotal > 0);
        
    } catch (err) {
        console.error('❌ Erreur récupération commandes prestations:', err);
        return [];
    }
}

/**
 * Afficher le tableau des commandes prestations
 */
async function displayCommandesPrestations(containerId, startDate, endDate, title) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const data = await getCommandesPrestationsPeriod(startDate, endDate);
    
    if (data.length === 0) {
        window.SecurityUtils.setInnerHTML(container, '<p style="text-align: center; color: var(--text-secondary); padding: 20px;">Aucune commande pour cette période</p>');
        return;
    }
    
    // Calculer les totaux
    let totalCommandes = 0;
    let totalCA = 0;
    
    data.forEach(d => {
        totalCommandes += d.nombreTotal;
        totalCA += d.caTotal;
    });
    
    // Construire le tableau
    let html = `
        <div style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
                <thead>
                    <tr style="background: var(--bg-secondary); border-bottom: 2px solid var(--stroke);">
                        <th style="padding: 12px; text-align: left; font-weight: 700; color: var(--text);">Gîte</th>
                        <th style="padding: 12px; text-align: center; font-weight: 700; color: var(--text);">Commandes</th>
                        <th style="padding: 12px; text-align: left; font-weight: 700; color: var(--text);">Prestations</th>
                        <th style="padding: 12px; text-align: right; font-weight: 700; color: var(--text);">CA Total</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    data.forEach(d => {
        const prestationsText = d.prestations
            .map(p => `${p.nom} (×${p.quantite})`)
            .join(', ');
        
        html += `
            <tr style="border-bottom: 1px solid var(--stroke);">
                <td style="padding: 12px;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <div style="width: 10px; height: 10px; border-radius: 50%; background: ${d.gite.color};"></div>
                        <strong>${d.gite.name}</strong>
                    </div>
                </td>
                <td style="padding: 12px; text-align: center;">
                    <span style="background: #3b82f6; color: white; padding: 4px 10px; border-radius: 6px; font-weight: 700; font-size: 0.85rem;">${d.nombreTotal}</span>
                </td>
                <td style="padding: 12px; font-size: 0.85rem; color: var(--text-secondary);">
                    ${prestationsText}
                </td>
                <td style="padding: 12px; text-align: right; font-weight: 700; color: #27AE60; font-size: 1rem;">
                    ${d.caTotal.toFixed(2)}€
                </td>
            </tr>
        `;
    });
    
    // Ligne totale
    html += `
                </tbody>
                <tfoot>
                    <tr style="background: var(--bg-secondary); border-top: 2px solid var(--stroke); font-weight: 700;">
                        <td style="padding: 12px;">TOTAL</td>
                        <td style="padding: 12px; text-align: center; font-size: 1.1rem; color: #3b82f6;">${totalCommandes}</td>
                        <td style="padding: 12px;"></td>
                        <td style="padding: 12px; text-align: right; font-size: 1.1rem; color: #27AE60;">${totalCA.toFixed(2)}€</td>
                    </tr>
                </tfoot>
            </table>
        </div>
    `;
    
    window.SecurityUtils.setInnerHTML(container, html);
}

/**
 * Mettre à jour la section prestations du dashboard (uniquement semaine)
 */
async function updateDashboardPrestations() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Semaine en cours (lundi à dimanche)
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1)); // Lundi
    weekStart.setHours(0, 0, 0, 0);
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6); // Dimanche
    weekEnd.setHours(23, 59, 59, 999);
    
    // Afficher uniquement la semaine
    await displayCommandesPrestations('dashboard-prestations-semaine', weekStart, weekEnd, 'Cette Semaine');
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
    
    // Filtrer uniquement les ménages à partir d'aujourd'hui (pas les dates passées)
    const { data: cleanings } = await window.supabaseClient
        .from('cleaning_schedule')
        .select('*')
        .gte('scheduled_date', today.toISOString().split('T')[0])
        .lte('scheduled_date', weekEnd.toISOString().split('T')[0])
        .order('scheduled_date', { ascending: true });
    
    const container = document.getElementById('dashboard-menages');
    if (!container) return;
    
    if (!cleanings || cleanings.length === 0) {
        window.SecurityUtils.setInnerHTML(container, '<p style="text-align: center; color: var(--text-secondary); padding: 40px;">Aucun ménage prévu cette semaine</p>');
        return;
    }
    
    let html = '';
    for (const c of cleanings) {
        const statusIcons = {
            'validated': '<i data-lucide="check-circle" style="width:14px;height:14px;display:inline-block;vertical-align:middle;"></i>',
            'pending_validation': '<i data-lucide="clock" style="width:14px;height:14px;display:inline-block;vertical-align:middle;"></i>',
            'refused': '<i data-lucide="x-circle" style="width:14px;height:14px;display:inline-block;vertical-align:middle;"></i>',
            'pending': '<i data-lucide="x" style="width:14px;height:14px;display:inline-block;vertical-align:middle;"></i>'
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
        const giteSlug = (giteName || '').toLowerCase().replace(/[^a-z]/g, '');
        const giteClass = giteSlug ? `dashboard-menage-item-${giteSlug}` : '';
        
        html += `
            <div class="dashboard-menage-item ${giteClass}">
                <div class="dashboard-menage-info">
                    <strong class="dashboard-menage-gite dashboard-menage-gite-${giteSlug}">${giteName || 'Gîte inconnu'}</strong>
                    <div class="dashboard-menage-date">
                        📅 ${formatDateFromObj(new Date(c.scheduled_date))} ${timeIcon}
                    </div>
                </div>
                <div class="dashboard-menage-status">
                    <span class="dashboard-menage-status-label ${statusLabel === 'Validé' ? 'dashboard-menage-status-validated' : 'dashboard-menage-status-pending'}" style="color: ${color}; background: ${color}22;">${statusLabel}</span>
                    <span class="${statusLabel === 'Validé' ? 'dashboard-menage-icon-validated' : 'dashboard-menage-icon-pending'}" title="${statusLabel}">${icon}</span>
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
            .select('id, title, description, category, completed, archived_at, gite_id, created_at, owner_user_id, status')
            .eq('completed', false)
            .eq('category', category)
            .eq('status', 'in_progress')  // ✅ Afficher uniquement les tâches EN COURS
            .order('created_at', { ascending: true });
        
        if (error) {
            console.error('Erreur chargement todos:', error);
            return;
        }
        
        const container = document.getElementById(`todo-${category}`);
        if (!container) return;
        
        if (!todos || todos.length === 0) {
            window.SecurityUtils.setInnerHTML(container, '<p style="text-align: center; color: var(--text-secondary); padding: 20px; font-size: 0.9rem;">Aucune tâche</p>');
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
                <div class="dashboard-todo-item">
                    <input type="checkbox" class="dashboard-todo-checkbox" onchange="toggleTodo('${todo.id}', this.checked)">
                    <div class="dashboard-todo-content" style="cursor: pointer;" onclick="viewTodoDetails('${todo.id}')">
                        <div class="dashboard-todo-title">
                            ${todo.title}
                        </div>
                    </div>
                    <button onclick="editTodo('${todo.id}')" class="dashboard-todo-btn dashboard-todo-btn-edit" title="Modifier"><svg style="width:18px;height:18px;stroke:currentColor;" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
                    <button onclick="deleteTodo('${todo.id}')" class="dashboard-todo-btn dashboard-todo-btn-delete" title="Supprimer"><svg style="width:18px;height:18px;stroke:currentColor;" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
                </div>`;
        });
        
        // ⚠️ IMPORTANT : Utiliser innerHTML direct pour préserver les onclick
        container.innerHTML = html;
    } catch (err) {
        console.error('Erreur dans updateTodoList:', err);
    }
}

async function addTodoItem(category, initialStatus = 'in_progress') {
    // console.log('🎯 addTodoItem appelé pour:', category);
    
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
        <div style="background: var(--bg-secondary); border-radius: 16px; padding: 25px; max-width: 500px; width: 100%; box-shadow: var(--shadow); max-height: 90vh; overflow-y: auto;">
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 20px;">
                <span style="font-size: 1.5rem;">📝</span>
                <h2 style="margin: 0; font-size: 1.2rem; color: var(--text-primary);">Nouvelle Tâche</h2>
            </div>
            
            <form id="addTodoFormDynamic">
                <input type="hidden" id="todoCategoryDynamic" value="${category}">
                <input type="hidden" id="todoInitialStatusDynamic" value="${initialStatus}">
                
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 8px; font-weight: 600; color: var(--text-primary);">
                        Titre <span style="color: #E74C3C;">*</span>
                    </label>
                    <input type="text" id="todoTitleDynamic" required 
                           placeholder="Ex: Réparer robinet"
                           style="width: 100%; padding: 10px; border: 2px solid var(--border-color); border-radius: 8px; font-size: 1rem; background: var(--bg-primary); color: var(--text-primary);">
                </div>
                
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 8px; font-weight: 600; color: var(--text-primary);">Description</label>
                    <textarea id="todoDescriptionDynamic" rows="3" 
                              placeholder="Détails supplémentaires..."
                              style="width: 100%; padding: 10px; border: 2px solid var(--border-color); border-radius: 8px; font-size: 1rem; resize: vertical; background: var(--bg-primary); color: var(--text-primary);"></textarea>
                </div>
                
                ${showGiteSelector ? `
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 8px; font-weight: 600; color: var(--text-primary);">Gîte concerné</label>
                    <select id="todoGiteDynamic" style="width: 100%; padding: 10px; border: 2px solid var(--border-color); border-radius: 8px; font-size: 1rem; background: var(--bg-primary); color: var(--text-primary);">
                        <option value="">Non spécifié</option>
                        <option value="Trevoux">Trevoux</option>
                        <option value="Couzon">Couzon</option>
                    </select>
                </div>
                ` : ''}
                
                <div style="margin-bottom: 15px;">
                    <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; color: var(--text-primary);">
                        <input type="checkbox" id="todoRecurrentDynamic" style="width: 18px; height: 18px; cursor: pointer;">
                        <span style="font-weight: 600;">🔁 Tâche récurrente</span>
                    </label>
                </div>
                
                <div id="recurrentOptionsDynamic" style="display: none; margin-left: 26px; margin-bottom: 15px;">
                    <div style="margin-bottom: 10px;">
                        <label style="display: block; margin-bottom: 8px; font-weight: 600; color: var(--text-primary);">Fréquence</label>
                        <select id="todoFrequencyDynamic" style="width: 100%; padding: 10px; border: 2px solid var(--border-color); border-radius: 8px; font-size: 1rem; background: var(--bg-primary); color: var(--text-primary);">
                            <option value="weekly">Hebdomadaire</option>
                            <option value="biweekly">Bimensuelle (2 semaines)</option>
                            <option value="monthly">Mensuelle</option>
                        </select>
                    </div>
                    
                    <div id="weeklyOptionsDynamic" style="margin-bottom: 10px;">
                        <label style="display: block; margin-bottom: 8px; font-weight: 600; color: var(--text-primary);">Jour de la semaine</label>
                        <select id="todoWeekdayDynamic" style="width: 100%; padding: 10px; border: 2px solid var(--border-color); border-radius: 8px; font-size: 1rem; background: var(--bg-primary); color: var(--text-primary);">
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
                        <label style="display: block; margin-bottom: 8px; font-weight: 600; color: var(--text-primary);">Jour du mois</label>
                        <input type="number" id="todoDayOfMonthDynamic" min="1" max="31" value="1" 
                               style="width: 100%; padding: 10px; border: 2px solid var(--border-color); border-radius: 8px; font-size: 1rem; background: var(--bg-primary); color: var(--text-primary);">
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
    // console.log('✅ Modal TODO créé et ajouté au body');
    
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
        // console.log('🚪 Annulation');
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
        
        const initialStatus = document.getElementById('todoInitialStatusDynamic').value || 'in_progress';
        
        const todoData = {
            owner_user_id: user?.id,
            category: category,
            title: title,
            description: description || null,
            completed: false,
            status: initialStatus, // 'in_progress' depuis Dashboard, 'todo' depuis Kanban
            created_at: new Date().toISOString()
        };
        
        // Gîte pour travaux
        if (showGiteSelector) {
            const giteSelect = document.getElementById('todoGiteDynamic');
            if (giteSelect && giteSelect.value) {
                todoData.gite_id = giteSelect.value;
            }
        }
        
        // Récurrence - DÉSACTIVÉ : colonnes non présentes dans la table todos
        // if (isRecurrent) {
        //     const frequency = document.getElementById('todoFrequencyDynamic').value;
        //     todoData.recurrent = true;
        //     todoData.frequency = frequency;
        //     
        //     if (frequency === 'monthly') {
        //         todoData.frequency_detail = document.getElementById('todoDayOfMonthDynamic').value;
        //     } else {
        //         todoData.frequency_detail = document.getElementById('todoWeekdayDynamic').value;
        //     }
        //     
        //     todoData.next_occurrence = calculateNextOccurrence(frequency, todoData.frequency_detail);
        // }
        
        // console.log('💾 Création TODO:', todoData);
        
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
        
        // console.log('✅ TODO créé:', data);
        modal.remove();
        
        // Rafraîchir la liste
        await updateTodoList(category);
        
        // Rafraîchir aussi le Kanban si disponible
        if (typeof window.refreshKanban === 'function') {
            await window.refreshKanban();
        }
    });
}

function closeAddTodoModal() {
    const modal = document.getElementById('addTodoModal');
    // console.log('🚪 Fermeture modal');
    modal.style.cssText = 'display: none !important;';
    modal.classList.remove('show');
    document.getElementById('addTodoForm').reset();
}

// Gestion du formulaire d'ajout de tâche
let todoModalInitialized = false;

// Initialisation du modal de tâches (event listeners, etc.)
function initAddTodoModal() {
    if (todoModalInitialized) return;
    
    const modal = document.getElementById('addTodoModal');
    if (!modal) {
        console.warn('⚠️ Modal addTodoModal introuvable lors de l\'initialisation');
        return;
    }
    
    // Initialiser les event listeners si nécessaire
    const form = document.getElementById('addTodoForm');
    if (form && !form.hasAttribute('data-initialized')) {
        form.setAttribute('data-initialized', 'true');
        // Les event listeners sont déjà dans le HTML
    }
    
    todoModalInitialized = true;
    // console.log('✅ Modal addTodoModal initialisé');
}

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

// Fonction pour afficher les détails d'un todo dans une modal
async function viewTodoDetails(todoId) {
    const { data: todo, error } = await window.supabaseClient
        .from('todos')
        .select('*, gites(name)')
        .eq('id', todoId)
        .single();
    
    if (error || !todo) {
        console.error('Erreur chargement todo:', error);
        return;
    }
    
    const giteName = todo.gites?.name || '';
    const priorityLabel = todo.priority === 'urgent' ? '🔴 Urgent' : todo.priority === 'high' ? '🟠 Prioritaire' : todo.priority === 'normal' ? '🟢 Normal' : '';
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.cssText = 'display: flex; position: fixed; z-index: 1000; left: 0; top: 0; width: 100%; height: 100%; overflow: auto; background-color: rgba(0,0,0,0.4);';
    
    modal.innerHTML = `
        <div class="modal-content" style="background: #ffffff !important; margin: 5% auto; padding: 0; border-radius: 10px; max-width: 650px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden;">
            <div class="modal-header" style="display: flex; justify-content: space-between; align-items: center; padding: 25px 40px; background: #f8f9fa; border-bottom: 1px solid #e0e0e0;">
                <h2 style="margin: 0; font-size: 1.4rem;">📋 ${todo.title}</h2>
                <button onclick="this.closest('.modal').remove()" style="background: none; border: none; font-size: 1.8rem; cursor: pointer; color: #999; padding: 5px 10px; margin: -5px -10px -5px 20px;">&times;</button>
            </div>
            <div style="padding: 35px 40px;">
                ${todo.description ? `<div style="margin-bottom: 25px; line-height: 1.6;"><strong style="font-size: 1.05rem; display: block; margin-bottom: 10px;">Description :</strong><span style="display: block; color: #555;">${todo.description}</span></div>` : ''}
                ${giteName ? `<div style="margin-bottom: 20px; font-size: 1.05rem;"><strong>🏠 Gîte :</strong> <span style="margin-left: 8px;">${giteName}</span></div>` : ''}
                ${priorityLabel ? `<div style="margin-bottom: 20px; font-size: 1.05rem;"><strong>Priorité :</strong> <span style="margin-left: 8px;">${priorityLabel}</span></div>` : ''}
            </div>
            <div style="padding: 25px 40px 35px; border-top: 1px solid #e0e0e0; display: flex; gap: 15px; background: #fafafa;">
                <button onclick="editTodo('${todo.id}'); this.closest('.modal').remove();" style="flex: 1; padding: 14px 25px; background: #667eea; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 500; font-size: 1rem;">✏️ Modifier</button>
                <button onclick="this.closest('.modal').remove()" style="flex: 1; padding: 14px 25px; background: #e0e0e0; color: #333; border: none; border-radius: 6px; cursor: pointer; font-size: 1rem;">Fermer</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    modal.onclick = (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    };
}

window.viewTodoDetails = viewTodoDetails;

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
    
    // Rafraîchir aussi le Kanban si disponible
    if (typeof window.refreshKanban === 'function') {
        await window.refreshKanban();
    }
    
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
    
    // Rafraîchir aussi le Kanban si disponible
    if (typeof window.refreshKanban === 'function') {
        await window.refreshKanban();
    }
    
    await updateDashboardStats();
}

async function editTodo(id) {
    // Récupérer la tâche
    const { data: todo, error } = await window.supabaseClient
        .from('todos')
        .select('id, title, description, category, completed, archived_at, gite_id, created_at, owner_user_id')
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
    if (giteSelect) giteSelect.value = todo.gite_id || '';
    
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
            gite_id: document.getElementById('todoGite').value || null
        };
        
        // Si c'est une tâche récurrente, mettre à jour les options - DÉSACTIVÉ : colonnes non présentes
        // if (isRecurrentCheckbox?.checked) {
        //     updateData.is_recurrent = true;
        //     updateData.frequency = document.getElementById('todoFrequency').value;
        //     const dayOfWeek = document.getElementById('todoWeekday').value;
        //     updateData.frequency_detail = { day_of_week: parseInt(dayOfWeek) };
        //     
        //     // Recalculer next_occurrence si le jour a changé
        //     if (todo.frequency_detail?.day_of_week !== parseInt(dayOfWeek) || 
        //         todo.frequency !== updateData.frequency) {
        //         updateData.next_occurrence = calculateNextOccurrence(
        //             updateData.frequency, 
        //             updateData.frequency_detail
        //         );
        //     }
        // }
        
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
        
        // Rafraîchir aussi le Kanban si disponible
        if (typeof window.refreshKanban === 'function') {
            await window.refreshKanban();
        }
        
        await updateDashboardStats();
    };
    
    modal.style.display = 'flex';
}

// Helper pour ouvrir l'édition d'une réservation
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
    
    // Récupérer les gîtes visibles selon l'abonnement
    const gitesVisibles = await window.gitesManager.getVisibleGites();
    const gitesVisiblesIds = gitesVisibles.map(g => g.id);
    
    // 1. Calculer le bénéfice RÉEL de l'année en cours
    const allReservations = await getAllReservations();
    const reservations = allReservations.filter(r => gitesVisiblesIds.includes(r.gite_id));
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
        const { data, error } = await window.supabaseClient
            .from('fiscal_history')
            .select('*')
            .eq('year', anneeActuelle)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
        
        if (error) {
            console.error('❌ Erreur requête simulation:', error);
        }
        
        simFiscale = data;
        
        // Diagnostic : lister toutes les simulations disponibles
        if (!simFiscale) {
            const { data: allSims } = await window.supabaseClient
                .from('fiscal_history')
                .select('id, year, created_at')
                .order('created_at', { ascending: false })
                .limit(5);
            if (allSims && allSims.length > 0) {
                // console.log('📋 Simulations disponibles dans la BDD:', allSims);
            }
        }
    } catch (error) {
        console.error('❌ Exception récupération simulation:', error);
    }
    
    let totalChargesAnnee = 0;
    
    if (simFiscale && typeof window.calculerChargesParGiteSansAmortissement === 'function') {
        // ✅ UTILISER LA NOUVELLE FONCTION GLOBALE (calcul dynamique multi-gîtes)
        try {
            // Récupérer les gîtes
            const gites = await window.gitesManager.getVisibleGites();
            const charges = await window.calculerChargesParGiteSansAmortissement(simFiscale, gites);
            totalChargesAnnee = charges.total;
        } catch (error) {
            console.error('❌ Erreur calcul charges:', error);
        }
    } else if (!simFiscale) {
        // Pas de simulation fiscale pour l'année en cours - utiliser 0
        totalChargesAnnee = 0;
    } else {
        // Fonction manquante - charger fiscalite-v2.js d'abord
        console.error('❌ La fonction calculerChargesParGiteSansAmortissement n\'est pas disponible');
        totalChargesAnnee = 0;
    }
    
    // console.log('💰 CA Année:', caAnnee.toFixed(2), '€');
    // console.log('💰 Charges Année:', totalChargesAnnee.toFixed(2), '€');
    
    // Bénéfice = CA - Total Charges (depuis fiscalité)
    const beneficeAnnee = caAnnee - totalChargesAnnee;
    
    // console.log('💰 BÉNÉFICE Année (CA - Charges):', beneficeAnnee.toFixed(2), '€');
    
    // 2. Calculer l'URSSAF pour l'année en cours (somme des cotisations sociales)
    const config = window.TAUX_FISCAUX.getConfig(anneeActuelle);
    
    const tauxCotisationsSociales = config.URSSAF.indemnites_journalieres.taux + 
                                     config.URSSAF.retraite_base.taux + 
                                     config.URSSAF.retraite_complementaire.taux + 
                                     config.URSSAF.invalidite_deces.taux;
    
    const cotisationsSociales = beneficeAnnee * tauxCotisationsSociales;
    const csgCrds = beneficeAnnee * config.URSSAF.csg_crds.taux;
    const formationPro = caAnnee * config.URSSAF.formation_pro.taux;
    
    // Allocations familiales (progressif entre 110% et 140% du PASS)
    let allocations = 0;
    const pass2024 = config.PASS;
    const af = config.URSSAF.allocations_familiales;
    if (beneficeAnnee > af.seuil_debut) {
        const baseAlloc = Math.min(beneficeAnnee - af.seuil_debut, af.seuil_fin - af.seuil_debut);
        const tauxAlloc = (baseAlloc / (af.seuil_fin - af.seuil_debut)) * af.taux_max;
        allocations = beneficeAnnee * tauxAlloc;
    }
    
    let urssafTotal = cotisationsSociales + csgCrds + formationPro + allocations;
    
    // ⚠️ Appliquer le minimum URSSAF (cotisations minimales légales)
    if (urssafTotal < config.COTISATIONS_MINIMALES.montant) {
        urssafTotal = config.COTISATIONS_MINIMALES.montant;
    }
    
    
    // 3. Calculer l'IR de l'ANNÉE PRÉCÉDENTE (depuis la base)
    let simulationPrecedente = null;
    try {
        const { data } = await window.supabaseClient
            .from('fiscal_history')
            .select('*')
            .eq('year', anneePrecedente)
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
        // Lire depuis donnees_detaillees JSONB
        const details = simulationPrecedente.donnees_detaillees || {};
        impotRevenuPrecedent = parseFloat(details.impot_revenu || 0);
        urssafPrecedent = parseFloat(details.cotisations_urssaf || 0);
    }
    
    // 4. Calculer l'IR de l'ANNÉE EN COURS (temps réel)
    const { data: simulationCourante } = await window.supabaseClient
        .from('fiscal_history')
        .select('*')
        .eq('year', anneeActuelle)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
    
    let impotRevenuCourant = 0;
    
    if (simulationCourante) {
        const details = simulationCourante.donnees_detaillees || {};
        const salaireMadame = parseFloat(details.salaire_madame || 0);
        const salaireMonsieur = parseFloat(details.salaire_monsieur || 0);
        const nbEnfants = parseInt(details.nombre_enfants || 0);
        
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
    
    // Afficher bénéfice APRÈS URSSAF uniquement (l'IR concerne les salaires, pas l'activité gîtes)
    const beneficeFinal = beneficeAnnee - urssafTotal;
    if (beneficeEl) beneficeEl.textContent = formatCurrency(beneficeFinal);
    
    // console.log('💰 URSSAF Total:', urssafTotal.toFixed(2), '€');
    // console.log('💰 BÉNÉFICE FINAL (après URSSAF):', beneficeFinal.toFixed(2), '€');
    
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
    
    // 7. Afficher les graphiques (avec bénéfice final après URSSAF uniquement)
    const benefices = await calculerBeneficesMensuels(totalChargesAnnee, urssafTotal / 12);
    await afficherGraphiqueBenefices(benefices);
    await afficherGraphiqueTresorerieDashboard();
}

// ==========================================
// ==========================================

// ==========================================
// 💰 CALCUL DES CHARGES (Wrapper pour compatibilité)
// ==========================================

/**
 * Fonction utilitaire : calculer charges totales SANS amortissement
 * @deprecated Utiliser window.calculerChargesParGiteSansAmortissement() à la place
 */
async function calculerChargesSansAmortissement(simFiscale) {
    if (typeof window.calculerChargesParGiteSansAmortissement === 'function') {
        const charges = await window.calculerChargesParGiteSansAmortissement(simFiscale);
        return charges.total;
    }
    
    // Fallback si la fonction globale n'est pas disponible
    console.warn('⚠️ Fonction calculerChargesParGiteSansAmortissement non disponible, utilisation fallback');
    return 0;
}

async function calculerBeneficesMensuels(totalChargesAnnee = 0, urssafMensuel = 0) {
    try {
        // Récupérer les gîtes visibles selon l'abonnement
        const gitesVisibles = await window.gitesManager.getVisibleGites();
        const gitesVisiblesIds = gitesVisibles.map(g => g.id);
        
        // Récupérer toutes les réservations et filtrer par gîtes visibles
        const allReservations = await getAllReservations();
        const reservations = allReservations.filter(r => gitesVisiblesIds.includes(r.gite_id));
        
        const anneeActuelle = new Date().getFullYear();
        const benefices = [];
        
        // Récupérer la simulation fiscale pour calculer les charges SANS AMORTISSEMENT
        let simFiscale = null;
        let chargesMensuellesSansAmort = 0;
        let chargesParGite = {};
        
        try {
            // console.log('🔍 [Mensuel] Recherche simulation pour année:', anneeActuelle);
            const { data, error } = await window.supabaseClient
                .from('fiscal_history')
                .select('*')
                .eq('year', anneeActuelle)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();
            
            if (error) {
                console.error('❌ [Mensuel] Erreur requête:', error);
            }
            
            simFiscale = data;
            
            if (simFiscale && typeof window.calculerChargesParGiteSansAmortissement === 'function') {
                // Récupérer les gîtes
                const gites = await window.gitesManager.getVisibleGites();
                // Utiliser la nouvelle fonction globale pour calculer les charges par gîte
                const charges = await window.calculerChargesParGiteSansAmortissement(simFiscale, gites);
                chargesParGite = charges.parGite; // charges par gite_id
                chargesMensuellesSansAmort = charges.total / 12; // total annuel / 12
            } else {
                // Fallback : utiliser totalChargesAnnee passé en paramètre
                chargesMensuellesSansAmort = totalChargesAnnee / 12;
            }
        } catch (error) {
            console.error('❌ Erreur récupération charges:', error);
            chargesMensuellesSansAmort = totalChargesAnnee / 12;
        }
        
        // Pour chaque mois
        for (let mois = 0; mois < 12; mois++) {
            const nomMois = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'][mois];
            
            // 1. Calculer le CA du mois (toutes les réservations de tous les gîtes)
            const reservationsDuMois = reservations.filter(r => {
                const dateDebut = parseLocalDate(r.dateDebut);
                return dateDebut.getFullYear() === anneeActuelle && dateDebut.getMonth() === mois;
            });
            
            const caMois = reservationsDuMois.reduce((sum, r) => sum + (parseFloat(r.montant) || 0), 0);
            
            // 2. Calcul du bénéfice : CA - Charges mensuelles - URSSAF mensuel
            const beneficeMois = caMois - chargesMensuellesSansAmort - urssafMensuel;
            
            benefices.push({
                mois: mois + 1,
                nom: nomMois,
                total: beneficeMois,
                details: {
                    ca: caMois,
                    charges: chargesMensuellesSansAmort,
                    urssaf: urssafMensuel
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
// 📊 KPI PERFORMANCE (6 indicateurs)
// ==========================================

async function updateKPIPerformance() {
    const anneeActuelle = new Date().getFullYear();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    try {
        // Récupérer les gîtes visibles selon l'abonnement
        const gitesVisibles = await window.gitesManager.getVisibleGites();
        const gitesVisiblesIds = gitesVisibles.map(g => g.id);
        
        // Récupérer les réservations 2026 des gîtes visibles uniquement
        const { data: allReservations } = await window.supabaseClient
            .from('reservations')
            .select('*')
            .gte('check_in', `${anneeActuelle}-01-01`)
            .lte('check_out', `${anneeActuelle}-12-31`);
        
        // Filtrer par gîtes visibles
        const reservations = (allReservations || []).filter(r => gitesVisiblesIds.includes(r.gite_id));
        
        if (!reservations || reservations.length === 0) {
            document.getElementById('dashboard-taux-occupation').textContent = '-';
            document.getElementById('dashboard-revenu-nuit').textContent = '-';
            document.getElementById('dashboard-duree-sejour').textContent = '-';
            document.getElementById('dashboard-charges-totales').textContent = '-';
            document.getElementById('dashboard-marge-nette').textContent = '-';
            document.getElementById('dashboard-reste-percevoir').textContent = '-';
            return;
        }
        
        let totalNuitsReservees = 0;
        let totalDureeSejour = 0;
        let totalCA = 0;
        let resteAPercevoir = 0;
        
        reservations.forEach(resa => {
            const checkIn = new Date(resa.check_in);
            const checkOut = new Date(resa.check_out);
            const nuits = Math.round((checkOut - checkIn) / (1000 * 60 * 60 * 24));
            totalNuitsReservees += nuits;
            totalDureeSejour += nuits;
            
            const montant = parseFloat(resa.total_price || resa.montant || 0);
            totalCA += montant;
            
            if (checkIn > today) {
                resteAPercevoir += parseFloat(resa.restant || 0);
            }
        });
        
        const nbReservations = reservations.length;
        const tauxOccupation = ((totalNuitsReservees / 365) * 100).toFixed(1);
        const revenuMoyenNuit = totalNuitsReservees > 0 ? (totalCA / totalNuitsReservees) : 0;
        const dureeMoyenneSejour = nbReservations > 0 ? (totalDureeSejour / nbReservations).toFixed(1) : 0;
        
        const { data: simFiscale } = await window.supabaseClient
            .from('simulations_fiscales')
            .select('*')
            .eq('annee', anneeActuelle)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
        
        let chargesTotales = 0;
        
        if (simFiscale) {
            chargesTotales = 
                (simFiscale.ecs_couzon || 0) + (simFiscale.compteur_eau_couzon || 0) + (simFiscale.assurance_gites_couzon || 0) +
                (simFiscale.taxe_fonciere_couzon || 0) + (simFiscale.taxe_habitation_couzon || 0) + (simFiscale.electricite_couzon || 0) +
                (simFiscale.internet_couzon || 0) + (simFiscale.eau_piscine_couzon || 0) + (simFiscale.linge_maison_couzon || 0) +
                (simFiscale.produits_entretien_couzon || 0) + (simFiscale.produits_piscine_couzon || 0) + (simFiscale.petits_travaux_couzon || 0) +
                (simFiscale.commissions_couzon || 0) + (simFiscale.ecs_trevoux || 0) + (simFiscale.compteur_eau_trevoux || 0) +
                (simFiscale.assurance_gites_trevoux || 0) + (simFiscale.taxe_fonciere_trevoux || 0) + (simFiscale.taxe_habitation_trevoux || 0) +
                (simFiscale.electricite_trevoux || 0) + (simFiscale.internet_trevoux || 0) + (simFiscale.linge_maison_trevoux || 0) +
                (simFiscale.produits_entretien_trevoux || 0) + (simFiscale.petits_travaux_trevoux || 0) + (simFiscale.commissions_trevoux || 0) +
                (simFiscale.comptable || 0) + (simFiscale.frais_bancaires || 0) + (simFiscale.materiel_info || 0) +
                (simFiscale.rc_pro || 0) + (simFiscale.formation || 0) +
                ((simFiscale.telephone || 0) * (simFiscale.telephone_type === 'mensuel' ? 12 : 1)) +
                ((simFiscale.fournitures || 0) * (simFiscale.fournitures_type === 'mensuel' ? 12 : 1)) +
                (simFiscale.travaux_liste || []).reduce((sum, item) => sum + item.montant, 0) +
                (simFiscale.frais_divers_liste || []).reduce((sum, item) => sum + item.montant, 0) +
                (simFiscale.produits_accueil_liste || []).reduce((sum, item) => sum + item.montant, 0) +
                (simFiscale.credits_liste || []).reduce((sum, c) => sum + (c.mensualite * 12), 0);
        }
        
        const benefice = totalCA - chargesTotales;
        const margeNette = totalCA > 0 ? ((benefice / totalCA) * 100).toFixed(1) : 0;
        
        document.getElementById('dashboard-taux-occupation').textContent = tauxOccupation + '%';
        document.getElementById('dashboard-revenu-nuit').textContent = formatCurrency(revenuMoyenNuit);
        document.getElementById('dashboard-duree-sejour').textContent = dureeMoyenneSejour + ' j';
        document.getElementById('dashboard-charges-totales').textContent = formatCurrency(chargesTotales);
        document.getElementById('dashboard-marge-nette').textContent = margeNette + '%';
        document.getElementById('dashboard-reste-percevoir').textContent = formatCurrency(resteAPercevoir);
        
    } catch (error) {
        console.error('❌ Erreur KPI Performance:', error);
    }
}

// ==========================================
// ==========================================

let chartTresorerieDashboard = null;

async function afficherGraphiqueTresorerieDashboard() {
    const canvas = document.getElementById('graphique-tresorerie-dashboard');
    if (!canvas) return;
    
    const anneeActuelle = new Date().getFullYear();
    
    // ============================================================
    // ✅ TABLE RESTAURÉE - 03 FEV 2026
    // Table suivi_soldes_bancaires renommée depuis backup
    // ============================================================
    const { data: soldes } = await window.supabaseClient
        .from('suivi_soldes_bancaires')
        .select('*')
        .eq('annee', anneeActuelle)
        .order('mois', { ascending: true });
    
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
// � GRAPHIQUE RÉSERVATIONS MENSUELLES
// ==========================================

let chartReservationsMensuelles = null;

async function afficherGraphiqueReservationsMensuelles() {
    const canvas = document.getElementById('graphique-reservations-mensuelles');
    if (!canvas) return;
    
    const anneeActuelle = new Date().getFullYear();
    
    const { data: reservations } = await window.supabaseClient
        .from('reservations')
        .select('check_in')
        .gte('check_in', `${anneeActuelle}-01-01`)
        .lte('check_in', `${anneeActuelle}-12-31`);
    
    const ctx = canvas.getContext('2d');
    
    if (chartReservationsMensuelles) {
        chartReservationsMensuelles.destroy();
    }
    
    const moisNoms = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
    const compteMois = Array(12).fill(0);
    
    if (reservations) {
        reservations.forEach(r => {
            const checkIn = new Date(r.check_in);
            const mois = checkIn.getMonth();
            compteMois[mois]++;
        });
    }
    
    chartReservationsMensuelles = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: moisNoms,
            datasets: [{
                label: 'Réservations',
                data: compteMois,
                backgroundColor: '#3498db',
                borderColor: '#2980b9',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

// ==========================================
// 📊 GRAPHIQUE COMPARAISON CA ANNÉES
// ==========================================

let chartCAComparaison = null;

async function afficherGraphiqueCAComparaison() {
    const canvas = document.getElementById('graphique-ca-comparaison');
    if (!canvas) return;
    
    const anneeActuelle = new Date().getFullYear();
    const anneePrecedente = anneeActuelle - 1;
    const selectedYears = [anneePrecedente, anneeActuelle];
    
    // ⚠️ Utiliser la même fonction que statistiques.js
    let historicalData = [];
    try {
        historicalData = await getAllHistoricalData();
    } catch (error) {
        console.error('❌ Erreur getAllHistoricalData:', error);
    }
    
    // ⚠️ Utiliser la même fonction que statistiques.js
    const reservations = await getAllReservations();
    
    // Récupérer les gîtes
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
                dataByYear[year].total[month] += parseFloat(r.total_price || r.montant || 0);
            });
        }
    });
    
    const ctx = canvas.getContext('2d');
    
    if (chartCAComparaison) {
        chartCAComparaison.destroy();
    }
    
    const moisNoms = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
    
    chartCAComparaison = new Chart(ctx, {
        type: 'line',
        data: {
            labels: moisNoms,
            datasets: [
                {
                    label: `${anneePrecedente}`,
                    data: dataByYear[anneePrecedente].total,
                    borderColor: '#95a5a6',
                    backgroundColor: 'rgba(149, 165, 166, 0.1)',
                    borderWidth: 2,
                    tension: 0.4,
                    fill: true
                },
                {
                    label: `${anneeActuelle}`,
                    data: dataByYear[anneeActuelle].total,
                    borderColor: '#00C2CB',
                    backgroundColor: 'rgba(0, 194, 203, 0.1)',
                    borderWidth: 3,
                    tension: 0.4,
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ' + formatCurrency(context.parsed.y);
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
// �🔄 RAFRAÎCHISSEMENT COMPLET
// ==========================================

async function refreshDashboard() {
    updateDashboardHeader();
    await updateDashboardAlerts();
    await updateDemandesClients();
    await updatePropositionsMenage();
    await updateProblemesClients();
    await updateDashboardStats();
    await updateDashboardReservations();
    await updateDashboardPrestations(); // 🛒 Commandes prestations
    await updateDashboardMenages();
    await updateTodoLists();
    await updateFinancialIndicators();
    await updateKPIPerformance();
    await afficherGraphiqueTresorerieDashboard();
    await afficherGraphiqueReservationsMensuelles();
    await afficherGraphiqueCAComparaison();
    // initializeTodoModal(); // Supprimé - modal créé dynamiquement
    initializeReponseWhatsappModal();
    
    // Charger les communications client
    if (typeof loadClientCommunications === 'function') {
        await loadClientCommunications();
    }
    
    // Afficher la dernière synchronisation iCal
    if (typeof updateLastSyncDisplay === 'function') {
        updateLastSyncDisplay();
    }
    
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
// ==========================================
// WIDGET : PROPOSITIONS CHANGEMENT DATE MÉNAGE
// ==========================================

async function updatePropositionsMenage() {
    try {
        // Charger uniquement les propositions de la société de ménage
        const { data: propositions, error } = await supabaseClient
            .from('cleaning_schedule')
            .select(`
                *,
                reservations (
                    id,
                    client_name,
                    gite_id,
                    check_in,
                    check_out
                )
            `)
            .eq('status', 'pending_validation')
            .eq('proposed_by', 'company')
            .order('scheduled_date', { ascending: true });
        
        if (error) {
            console.error('❌ Erreur chargement propositions ménage:', error);
            throw error;
        }
        
        const container = document.getElementById('liste-propositions-menage');
        const badge = document.getElementById('badge-propositions-menage-count');
        const card = document.getElementById('dashboard-propositions-menage');
        
        if (!container || !badge || !card) return;
        
        if (!propositions || propositions.length === 0) {
            window.SecurityUtils.setInnerHTML(container, '<p style="color: #95a5a6; font-style: italic; margin: 0;">Aucune proposition de changement en attente</p>');
            badge.textContent = '0';
            card.style.display = 'none';
            return;
        }
        
        badge.textContent = propositions.length;
        card.style.display = 'block';
        
        // Charger les gîtes pour avoir les noms
        let gites = [];
        if (window.gitesManager) {
            gites = await window.gitesManager.getVisibleGites();
        }
        
        let html = '';
        propositions.forEach(p => {
            if (!p.id) {
                console.warn('⚠️ Proposition sans ID ignorée:', p);
                return;
            }
            
            // Vérifier que scheduled_date existe
            if (!p.scheduled_date) {
                console.error('❌ Proposition sans date programmée:', p);
                return;
            }
            
            const resa = p.reservations;
            const clientNom = resa?.client_name || 'Client';
            
            // Date d'origine = lendemain de la fin de réservation (reservation_end + 1 jour)
            let dateOrigine = 'N/A';
            if (p.reservation_end) {
                const dateOrigineObj = new Date(p.reservation_end);
                dateOrigineObj.setDate(dateOrigineObj.getDate() + 1);
                dateOrigine = formatDateFromObj(dateOrigineObj);
            }
            
            // Date proposée = scheduled_date
            const dateProposee = formatDateFromObj(new Date(p.scheduled_date));
            
            // Récupérer le gîte
            let giteNom = 'Gîte';
            let giteColor = '#667eea';
            if (resa?.gite_id) {
                const gite = gites.find(g => g.id === resa.gite_id);
                if (gite) {
                    giteNom = gite.name;
                    giteColor = gite.color || '#667eea';
                }
            }
            
            html += `
                <div style="background: var(--card); border-left: 4px solid ${giteColor}; border-radius: 8px; padding: 12px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <div style="flex: 1;">
                        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 6px;">
                            <span style="background: #f39c12; color: white; padding: 3px 10px; border-radius: 4px; font-size: 0.8rem; font-weight: 600;">🧹 Changement date</span>
                            <strong style="font-size: 1rem;">${giteNom}</strong>
                            ${clientNom ? `<span style="color: var(--text-secondary); font-size: 0.85rem;">• ${clientNom}</span>` : ''}
                        </div>
                        <div style="color: var(--text-secondary); font-size: 0.9rem;">
                            📅 Initialement : <strong>${dateOrigine}</strong> → Proposé : <strong style="color: #f39c12;">${dateProposee}</strong>
                        </div>
                    </div>
                    <div style="display: flex; gap: 8px;">
                        <button data-action="valider-proposition-menage" 
                                data-proposition-id="${p.id}" 
                                data-date-proposee="${p.scheduled_date}"
                                style="background: #27AE60; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 0.85rem; font-weight: 500; transition: all 0.2s;"
                                onmouseover="this.style.opacity='0.8'"
                                onmouseout="this.style.opacity='1'">
                            ✓ Accepter
                        </button>
                        <button data-action="refuser-proposition-menage" 
                                data-proposition-id="${p.id}"
                                style="background: #E74C3C; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 0.85rem; font-weight: 500; transition: all 0.2s;"
                                onmouseover="this.style.opacity='0.8'"
                                onmouseout="this.style.opacity='1'">
                            ✗ Refuser
                        </button>
                    </div>
                </div>
            `;
        });
        
        window.SecurityUtils.setInnerHTML(container, html);
        
        // Event delegation
        attachPropositionsMenageEventListeners();
    } catch (err) {
        console.error('❌ [DEBUG] Erreur dans updatePropositionsMenage:', err);
        
        const container = document.getElementById('liste-propositions-menage');
        const card = document.getElementById('dashboard-propositions-menage');
        const badge = document.getElementById('badge-propositions-menage-count');
        
        if (container && card && badge) {
            card.style.display = 'block';
            badge.textContent = '!';
            window.SecurityUtils.setInnerHTML(container, `
                <p style="color: #e74c3c; font-style: italic; margin: 0;">
                    ⚠️ Erreur de chargement: ${err.message}
                </p>
            `);
        }
    }
}

// Event delegation pour les propositions de changement de date ménage
function attachPropositionsMenageEventListeners() {
    const container = document.getElementById('liste-propositions-menage');
    if (!container) return;
    
    container.removeEventListener('click', handlePropositionsMenageClick);
    container.addEventListener('click', handlePropositionsMenageClick);
}

async function handlePropositionsMenageClick(e) {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    
    const action = btn.dataset.action;
    const propositionId = btn.dataset.propositionId;
    
    if (action === 'valider-proposition-menage') {
        await accepterPropositionMenage(propositionId, btn.dataset.dateProposee);
    } else if (action === 'refuser-proposition-menage') {
        await refuserPropositionMenage(propositionId);
    }
}

async function accepterPropositionMenage(propositionId, dateProposee) {
    if (!confirm('Accepter cette nouvelle date de ménage ?')) return;
    
    // Si pas de date proposée passée en paramètre, la récupérer depuis la BDD
    if (!dateProposee || dateProposee === 'undefined') {
        const { data, error } = await supabaseClient
            .from('cleaning_schedule')
            .select('scheduled_date')
            .eq('id', propositionId)
            .single();
        
        if (error || !data?.scheduled_date) {
            console.error('❌ Impossible de récupérer la date proposée:', error);
            alert('❌ Erreur : date proposée manquante');
            return;
        }
        
        dateProposee = data.scheduled_date;
    }
    
    try {
        // Mettre à jour le cleaning_schedule
        // La date est déjà dans scheduled_date, il suffit de valider
        const { error } = await supabaseClient
            .from('cleaning_schedule')
            .update({
                status: 'confirmed',
                validated_by_company: true,
                validated_at: new Date().toISOString()
            })
            .eq('id', propositionId);
        
        if (error) throw error;
        
        alert('✅ Date de ménage acceptée et mise à jour');
        await updatePropositionsMenage();
        
        // Recharger le calendrier de ménage si ouvert
        if (window.afficherCalendrierMenage) {
            await window.afficherCalendrierMenage();
        }
    } catch (error) {
        console.error('Erreur validation proposition:', error);
        alert('❌ Erreur lors de la validation');
    }
}

async function refuserPropositionMenage(propositionId) {
    if (!confirm('Refuser cette proposition ? Le ménage sera programmé selon les règles automatiques.')) return;
    
    try {
        // Récupérer la date d'origine (reservation_end + 1 jour)
        const { data, error: fetchError } = await supabaseClient
            .from('cleaning_schedule')
            .select('reservation_end')
            .eq('id', propositionId)
            .single();
        
        if (fetchError || !data?.reservation_end) {
            console.error('❌ Impossible de récupérer la date de fin de réservation:', fetchError);
            alert('❌ Erreur lors du refus');
            return;
        }
        
        // Calculer la date originale (lendemain de la fin de réservation)
        const dateOrigine = new Date(data.reservation_end);
        dateOrigine.setDate(dateOrigine.getDate() + 1);
        const dateOriginaleFormatee = dateOrigine.toISOString().split('T')[0];
        
        // Remettre la date d'origine et status à 'pending'
        const { error } = await supabaseClient
            .from('cleaning_schedule')
            .update({
                scheduled_date: dateOriginaleFormatee,
                status: 'pending',
                proposed_by: null
            })
            .eq('id', propositionId);
        
        if (error) throw error;
        
        alert('✅ Proposition refusée - date d\'origine conservée');
        await updatePropositionsMenage();
    } catch (error) {
        console.error('Erreur refus proposition:', error);
        alert('❌ Erreur lors du refus');
    }
}

// ==========================================
// ❌ FEATURE SUPPRIMÉE - 23 JAN 2026
// ⏰ DEMANDES D'HORAIRES CLIENTS
// Table demandes_horaires supprimée de la BDD
// ==========================================

async function updateDemandesClients() {
    // ✅ Table demandes_horaires restaurée - 28/01/2026
    
    try {
        // Requête simplifiée sans JOIN (Supabase cache pas à jour)
        const { data: demandes, error } = await supabaseClient
            .from('demandes_horaires')
            .select('*')
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
            card.style.display = 'none';
            return;
        }
        
        // Récupérer les réservations associées
        const reservationIds = [...new Set(demandes.map(d => d.reservation_id).filter(Boolean))];
        let reservationsMap = {};
        
        if (reservationIds.length > 0) {
            const { data: reservations } = await supabaseClient
                .from('reservations')
                .select('id, client_name, gite, check_in, check_out')
                .in('id', reservationIds);
            
            if (reservations) {
                reservations.forEach(r => {
                    reservationsMap[r.id] = r;
                });
            }
        }
        
        badge.textContent = demandes.length;
        card.style.display = 'block';
        
        let html = '';
        demandes.forEach(d => {
            // Sécurité : ignorer les demandes sans ID valide
            if (!d.id) {
                console.warn('⚠️ Demande sans ID ignorée:', d);
                return;
            }
            
            const typeLabel = d.type === 'arrivee' ? '📥 Arrivée' : '📤 Départ';
            const typeColor = d.type === 'arrivee' ? '#27AE60' : '#E74C3C';
            
            const resa = reservationsMap[d.reservation_id];
            const clientNom = resa?.client_name || 'Client';
            const gite = resa?.gite || '';
            const dateDebut = resa?.check_in;
            const dateFin = resa?.check_out;
            
            html += `
                <div style="background: var(--card); border: 1px solid #e0e0e0; border-radius: 8px; padding: 12px; display: flex; justify-content: space-between; align-items: center;">
                    <div style="flex: 1;">
                        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 6px;">
                            <span style="background: ${typeColor}; color: white; padding: 3px 10px; border-radius: 4px; font-size: 0.8rem; font-weight: 600;">${typeLabel}</span>
                            <strong style="font-size: 1rem;">${clientNom}</strong>
                            ${gite ? `<span style="color: var(--text-secondary); font-size: 0.85rem;">• ${gite}</span>` : ''}
                        </div>
                        <div style="color: var(--text-secondary); font-size: 0.9rem;">
                            📅 ${dateDebut ? formatDateFromObj(new Date(dateDebut)) : 'N/A'} → ${dateFin ? formatDateFromObj(new Date(dateFin)) : 'N/A'}
                            • ⏰ Demande: <strong>${d.heure_demandee}</strong>
                        </div>
                    </div>
                    <div style="display: flex; gap: 8px;">
                        <button data-action="valider-demande" 
                                data-demande-id="${d.id}" 
                                data-heure="${d.heure_demandee}"
                                style="background: #27AE60; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 0.85rem; font-weight: 500;">
                            ✓ Valider
                        </button>
                        <button data-action="refuser-demande" 
                                data-demande-id="${d.id}"
                                style="background: #E74C3C; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 0.85rem; font-weight: 500;">
                            ✗ Refuser
                        </button>
                    </div>
                </div>
            `;
        });
        
        window.SecurityUtils.setInnerHTML(container, html);
        
        // ✅ Event delegation : attacher les listeners APRÈS génération HTML
        attachDemandesEventListeners();
    } catch (err) {
        console.error('Erreur chargement demandes:', err);
    }
}

// ✅ Event delegation pour les demandes clients
function attachDemandesEventListeners() {
    const container = document.getElementById('liste-demandes-clients');
    if (!container) return;
    
    // Retirer ancien listener si existant
    container.removeEventListener('click', handleDemandesClick);
    container.addEventListener('click', handleDemandesClick);
}

function handleDemandesClick(e) {
    const button = e.target.closest('[data-action]');
    if (!button) return;
    
    const action = button.dataset.action;
    const demandeId = button.dataset.demandeId;
    
    if (action === 'valider-demande') {
        const heure = button.dataset.heure;
        validerDemandeHoraire(demandeId, heure);
    } else if (action === 'refuser-demande') {
        refuserDemandeHoraire(demandeId);
    }
}

async function validerDemandeHoraire(demandeId, heureValidee) {
    // ✅ Table demandes_horaires restaurée - 28/01/2026
    try {
        // 1. Récupérer la demande complète pour connaître le type et la réservation
        const { data: demande, error: fetchError} = await supabaseClient
            .from('demandes_horaires')
            .select('*')
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
    // ✅ Table demandes_horaires restaurée - 28/01/2026
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
    // ✅ Table problemes_signales restaurée et migrée - 28/01/2026
    
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
                    .select('id, telephone, client_name')
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
                            if (!pb.client_nom) pb.client_nom = res.client_name || '';
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
            attachProblemesEventListeners(); // Event delegation pour les boutons
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
            attachProblemesEventListeners(); // Event delegation pour les boutons
        }
        
    } catch (err) {
        console.error('❌ Erreur update problèmes clients:', err);
    }
}

function attachProblemesEventListeners() {
    const containers = [
        document.getElementById('liste-problemes-urgents'),
        document.getElementById('liste-demandes-retours')
    ];
    
    containers.forEach(container => {
        if (!container) return;
        container.removeEventListener('click', handleProblemesClick);
        container.addEventListener('click', handleProblemesClick);
        container.removeEventListener('submit', handleProblemesSubmit);
        container.addEventListener('submit', handleProblemesSubmit);
    });
}

function handleProblemesClick(e) {
    const button = e.target.closest('[data-action]');
    if (!button) return;
    
    const action = button.dataset.action;
    const problemeId = button.dataset.problemeId;
    
    if (action === 'toggle-reponse-whatsapp') {
        toggleReponseWhatsApp(problemeId);
    } else if (action === 'traiter-probleme') {
        traiterProbleme(problemeId);
    } else if (action === 'supprimer-probleme') {
        supprimerProbleme(problemeId);
    } else if (action === 'annuler-reponse') {
        toggleReponseWhatsApp(problemeId);
    }
}

function handleProblemesSubmit(e) {
    const form = e.target.closest('form[data-form="whatsapp-reponse"]');
    if (!form) return;
    
    e.preventDefault();
    const problemeId = form.dataset.problemeId;
    const telephone = form.dataset.telephone;
    const sujet = form.dataset.sujet;
    const gite = form.dataset.gite;
    
    envoyerReponseWhatsApp(e, problemeId, telephone, sujet, gite);
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
        <div style="background: var(--card); padding: 15px; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); margin-bottom: 12px;">
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
                        <button data-action="toggle-reponse-whatsapp" data-probleme-id="${pb.id}"
                                style="background: linear-gradient(135deg, #25D366 0%, #128C7E 100%); color: white; border: none; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 0.85rem; transition: transform 0.2s; box-shadow: 0 2px 6px rgba(37, 211, 102, 0.3);"
                                onmouseover="this.style.transform='scale(1.05)'"
                                onmouseout="this.style.transform='scale(1)'">
                            💬 Répondre
                        </button>
                    ` : `
                        <button disabled 
                                style="background: #ccc; color: var(--text-secondary); border: none; padding: 8px 16px; border-radius: 8px; cursor: not-allowed; font-weight: 600; font-size: 0.85rem;"
                                title="Aucun numéro de téléphone">
                            📞 Pas de tél
                        </button>
                    `}
                    <button data-action="traiter-probleme" data-probleme-id="${pb.id}"
                            style="background: linear-gradient(135deg, #27ae60 0%, #229954 100%); color: white; border: none; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 0.85rem; transition: transform 0.2s; box-shadow: 0 2px 6px rgba(39, 174, 96, 0.3);"
                            onmouseover="this.style.transform='scale(1.05)'"
                            onmouseout="this.style.transform='scale(1)'">
                        ✓ Traité
                    </button>
                    <button data-action="supprimer-probleme" data-probleme-id="${pb.id}"
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
                    <form data-form="whatsapp-reponse" data-probleme-id="${pb.id}" data-telephone="${pb.telephone}" data-sujet="${(pb.sujet || '').replace(/"/g, '&quot;')}" data-gite="${pb.gite || ''}">
                        <label style="font-weight: 600; color: #2c3e50; margin-bottom: 8px; display: block;">Votre message</label>
                        <textarea id="message-${pb.id}" rows="4" style="width: 100%; padding: 12px; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 0.95rem; resize: vertical; font-family: inherit; margin-bottom: 10px;" placeholder="Écrivez votre réponse..." required>Bonjour,\n\nNous avons bien reçu votre message concernant : "${(pb.sujet || '').replace(/"/g, '&quot;')}"\n\nGîte : ${pb.gite || ''}\n\n[Votre réponse ici]</textarea>
                        <div style="display: flex; gap: 10px;">
                            <button type="submit" style="flex: 1; background: linear-gradient(135deg, #25D366 0%, #128C7E 100%); color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 1rem; display: flex; align-items: center; justify-content: center; gap: 8px;">
                                <span style="font-size: 1.2rem;">💬</span> Envoyer via WhatsApp
                            </button>
                            <button type="button" data-action="annuler-reponse" data-probleme-id="${pb.id}" style="background: #95a5a6; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-weight: 600;">
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
    // ✅ Table problemes_signales restaurée - 28/01/2026
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
    // ✅ Table problemes_signales restaurée - 28/01/2026
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
window.changeDashboardReservationsPage = changeDashboardReservationsPage;
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
                    <div style="color: var(--text-secondary);">📅 ${dateFormatee}</div>
                </div>

                <div style="margin-bottom: 20px;">
                    <h3 style="color: #333; margin-bottom: 10px;">Commentaires</h3>
                    <div style="padding: 15px; background: #fff; border-left: 4px solid #667eea; border-radius: 8px;">
                        <div style="white-space: pre-wrap; color: var(--text-secondary); font-size: 0.95rem;">${retour.commentaires || 'Aucun commentaire'}</div>
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
            <div onclick="event.stopPropagation()" style="background: var(--card); border-radius: 20px; max-width: 600px; width: 90%; max-height: 90vh; overflow-y: auto;">
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
        container.innerHTML = '<p style="color: var(--text-secondary); font-style: italic;">⏳ Chargement des réservations...</p>';
        
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
            container.innerHTML = '<p style="color: var(--text-secondary); font-style: italic;">Aucune réservation en cours actuellement</p>';
            return;
        }
        
        let html = '';
        for (const r of activeReservations) {
            const gite = await window.gitesManager.getById(r.gite_id);
            if (!gite) {
                // Gîte non trouvé - probablement supprimé ou données incohérentes - ignorer silencieusement
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
                <div style="background: var(--card); border: 3px solid ${gite.color}; padding: 15px; border-radius: 12px; box-shadow: 4px 4px 0 #2D3436; margin-bottom: 15px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                        <div style="flex: 1;">
                            <strong style="font-size: 1.1rem; color: var(--text);">${r.client_name}</strong>
                            <div class="text-muted-small">
                                🏠 ${gite.name} • 📅 ${new Date(r.check_in).toLocaleDateString('fr-FR')} → ${new Date(r.check_out).toLocaleDateString('fr-FR')}
                            </div>
                        </div>
                        <div style="display: flex; gap: 8px;">
                            <button onclick="toggleChecklistDetails('${r.id}')" class="btn-neo" style="background: #fdcb6e; color: var(--text); border: 2px solid #2D3436; box-shadow: 2px 2px 0 #2D3436; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-size: 0.85rem; font-weight: 600;">
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
                                <strong style="font-size: 0.9rem; color: var(--text);">🏠 Entrée</strong>
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
                                <strong style="font-size: 0.9rem; color: var(--text);">🧳 Sortie</strong>
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
                                <h4 style="margin: 0 0 10px 0; font-size: 0.95rem; color: var(--text);">🏠 Checklist Entrée</h4>
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
                                }).join('') : '<p style="color: var(--text-secondary); font-style: italic; font-size: 0.85rem;">Aucun item</p>'}
                            </div>
                            
                            <!-- Items Sortie -->
                            <div>
                                <h4 style="margin: 0 0 10px 0; font-size: 0.95rem; color: var(--text);">🧳 Checklist Sortie</h4>
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
                                }).join('') : '<p style="color: var(--text-secondary); font-style: italic; font-size: 0.85rem;">Aucun item</p>'}
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

// ═══════════════════════════════════════════════════════════════════════// GESTION DES LISTES DE COURSES
// ═══════════════════════════════════════════════════════════════════════

// Fonction pour échapper le HTML et prévenir les XSS
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

let currentShoppingList = null;
let shoppingListItems = [];
let allShoppingLists = [];

async function openShoppingListManager() {
    // Récupérer l'utilisateur connecté
    const { data: { user } } = await window.supabaseClient.auth.getUser();
    
    if (!user || !user.id) {
        console.error('❌ Utilisateur non connecté');
        alert('Vous devez être connecté pour accéder aux listes de courses');
        return;
    }
    
    // Supprimer ancien modal s'il existe
    document.querySelectorAll('.modal-shopping-list').forEach(m => m.remove());
    
    // Charger les listes existantes (en_cours uniquement)
    const { data: lists, error } = await window.supabase
        .from('shopping_lists')
        .select('*')
        .eq('owner_user_id', user.id)
        .eq('status', 'en_cours')
        .order('created_date', { ascending: false });
    
    if (error) {
        console.error('Erreur chargement listes:', error);
        alert('Impossible de charger les listes de courses');
        return;
    }
    
    allShoppingLists = lists || [];
    currentShoppingList = null;
    
    // Créer le modal
    const modal = document.createElement('div');
    modal.className = 'modal-shopping-list';
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
    
    modal.innerHTML = `
        <div style="background: white; border-radius: 16px; max-width: 700px; width: 100%; max-height: 85vh; display: flex; flex-direction: column; box-shadow: 0 20px 60px rgba(0,0,0,0.3);">
            <div style="padding: 24px; border-bottom: 1px solid #e0e0e0;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <h2 style="margin: 0; font-size: 24px; color: #333;">📋 Gestion des Listes</h2>
                    <button onclick="closeShoppingListManager()" style="background: none; border: none; font-size: 28px; cursor: pointer; color: #999; line-height: 1;">×</button>
                </div>
            </div>
            
            <div style="flex: 1; overflow-y: auto; display: flex;">
                <!-- Colonne des listes -->
                <div id="lists-sidebar" style="width: 280px; border-right: 1px solid #e0e0e0; padding: 20px; background: #f8f9fa;">
                    <button onclick="showNewListForm()" style="width: 100%; padding: 12px; background: #7c3aed; color: white; border: none; border-radius: 10px; cursor: pointer; font-weight: 600; font-size: 14px; margin-bottom: 16px;">
                        + Nouvelle liste
                    </button>
                    <div id="new-list-form" style="display: none; margin-bottom: 16px; padding: 12px; background: white; border-radius: 8px; border: 2px solid #7c3aed;">
                        <input type="text" id="new-list-name" placeholder="Nom de la liste" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; margin-bottom: 8px; font-size: 14px;">
                        <div style="display: flex; gap: 8px;">
                            <button onclick="cancelNewList()" style="flex: 1; padding: 8px; background: #e0e0e0; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 13px;">Annuler</button>
                            <button onclick="createNewList()" style="flex: 1; padding: 8px; background: #7c3aed; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 13px;">Créer</button>
                        </div>
                    </div>
                    <div id="shopping-lists-container">
                        <div style="text-align: center; color: #999; padding: 20px; font-size: 13px;">Chargement...</div>
                    </div>
                </div>
                
                <!-- Colonne des articles -->
                <div style="flex: 1; display: flex; flex-direction: column;">
                    <div id="list-editor-container" style="flex: 1; display: flex; flex-direction: column;">
                        <div style="flex: 1; display: flex; align-items: center; justify-content: center; padding: 40px; color: #999;">
                            <div style="text-align: center;">
                                <p style="font-size: 18px; margin-bottom: 8px;">Sélectionnez une liste</p>
                                <p style="font-size: 14px;">ou créez-en une nouvelle</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    renderShoppingLists();
}

async function loadShoppingItems() {
    if (!currentShoppingList) return;
    
    const { data, error } = await window.supabase
        .from('shopping_list_items')
        .select('*')
        .eq('list_id', currentShoppingList.id)
        .order('created_at', { ascending: true });
    
    if (error) {
        console.error('Erreur chargement items:', error);
        return;
    }
    
    shoppingListItems = data || [];
    renderShoppingItems();
}

function renderShoppingLists() {
    const container = document.getElementById('shopping-lists-container');
    if (!container) return;
    
    if (allShoppingLists.length === 0) {
        container.innerHTML = '<div style="text-align: center; color: #999; padding: 20px; font-size: 13px;">Aucune liste</div>';
        return;
    }
    
    const listsHtml = allShoppingLists.map(list => `
        <div onclick="selectShoppingList('${list.id}')" style="padding: 12px; background: ${currentShoppingList?.id === list.id ? '#ede9fe' : 'white'}; border: 2px solid ${currentShoppingList?.id === list.id ? '#7c3aed' : '#e0e0e0'}; border-radius: 8px; margin-bottom: 8px; cursor: pointer; transition: all 0.2s;">
            <div style="font-weight: 600; color: #333; font-size: 14px; margin-bottom: 4px;">${escapeHtml(list.name)}</div>
            <div style="font-size: 12px; color: #999;">${new Date(list.created_date).toLocaleDateString('fr-FR')}</div>
        </div>
    `).join('');
    
    container.innerHTML = listsHtml;
}

function renderShoppingItems() {
    const editorContainer = document.getElementById('list-editor-container');
    if (!editorContainer || !currentShoppingList) return;
    
    const itemsCount = shoppingListItems.length;
    
    const itemsHtml = shoppingListItems.length === 0 
        ? '<div style="text-align: center; color: #999; padding: 40px;">Aucun article dans cette liste</div>'
        : shoppingListItems.map(item => `
            <div style="padding: 14px; background: white; border: 1px solid rgba(0,0,0,0.08); border-radius: 10px; margin-bottom: 10px; display: flex; align-items: center; gap: 12px;">
                <span style="flex: 1; font-size: 15px; color: #333;">
                    ${escapeHtml(item.item_name)}
                </span>
                <button onclick="deleteShoppingItem('${item.id}')" style="padding: 6px 10px; background: #ef4444; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 600;">🗑️</button>
            </div>
        `).join('');
    
    editorContainer.innerHTML = `
        <div style="padding: 20px; border-bottom: 1px solid #e0e0e0; background: #fafafa;">
            <div style="font-weight: 600; color: #7c3aed; font-size: 16px; margin-bottom: 4px;">${escapeHtml(currentShoppingList.name)}</div>
            <div style="font-size: 13px; color: #999;">${itemsCount} article${itemsCount > 1 ? 's' : ''}</div>
        </div>
        <div style="padding: 20px; border-bottom: 1px solid #e0e0e0;">
            <div style="display: flex; gap: 10px;">
                <input 
                    type="text" 
                    id="shopping-input" 
                    placeholder="Ajouter un article..." 
                    style="flex: 1; padding: 12px; border: 1px solid #ddd; border-radius: 10px; font-size: 15px;"
                    onkeypress="if(event.key === 'Enter') addShoppingItem()">
                <button onclick="addShoppingItem()" style="padding: 12px 24px; background: #7c3aed; color: white; border: none; border-radius: 10px; cursor: pointer; font-weight: 600; font-size: 16px;">+</button>
            </div>
        </div>
        <div id="shopping-items-container" style="flex: 1; overflow-y: auto; padding: 20px;">
            ${itemsHtml}
        </div>
        <div style="padding: 20px; border-top: 1px solid #e0e0e0;">
            <button onclick="validateShoppingList()" style="width: 100%; padding: 14px; background: #10b981; color: white; border: none; border-radius: 10px; cursor: pointer; font-weight: bold; font-size: 16px;">
                ✓ Valider liste
            </button>
        </div>
    `;
    
    // Focus sur l'input après le rendu
    setTimeout(() => document.getElementById('shopping-input')?.focus(), 100);
}

async function selectShoppingList(listId) {
    const list = allShoppingLists.find(l => l.id === listId);
    if (!list) return;
    
    currentShoppingList = list;
    renderShoppingLists();
    await loadShoppingItems();
}

async function deleteShoppingItem(itemId) {
    if (!confirm('Supprimer cet article ?')) return;
    
    const { error } = await window.supabase
        .from('shopping_list_items')
        .delete()
        .eq('id', itemId);
    
    if (error) {
        console.error('Erreur suppression item:', error);
        alert('Impossible de supprimer l\'article');
        return;
    }
    
    shoppingListItems = shoppingListItems.filter(i => i.id !== itemId);
    renderShoppingItems();
}

async function addShoppingItem() {
    const input = document.getElementById('shopping-input');
    const itemName = input?.value.trim();
    
    if (!itemName || !currentShoppingList) return;
    
    const { data, error } = await window.supabase
        .from('shopping_list_items')
        .insert({
            list_id: currentShoppingList.id,
            item_name: itemName,
            is_checked: false,
            added_by: 'proprietaire'
        })
        .select()
        .single();
    
    if (error) {
        console.error('Erreur ajout item:', error);
        alert('Impossible d\'ajouter l\'article');
        return;
    }
    
    shoppingListItems.push(data);
    renderShoppingItems();
    input.value = '';
    input.focus();
}

function showNewListForm() {
    const form = document.getElementById('new-list-form');
    if (form) {
        form.style.display = 'block';
        document.getElementById('new-list-name')?.focus();
    }
}

function cancelNewList() {
    const form = document.getElementById('new-list-form');
    if (form) {
        form.style.display = 'none';
        document.getElementById('new-list-name').value = '';
    }
}

async function createNewList() {
    const input = document.getElementById('new-list-name');
    const name = input?.value.trim();
    
    if (!name) {
        alert('Veuillez saisir un nom pour la liste');
        return;
    }
    
    // Récupérer l'utilisateur connecté
    const { data: { user } } = await window.supabaseClient.auth.getUser();
    
    if (!user || !user.id) {
        console.error('❌ Utilisateur non connecté');
        alert('Vous devez être connecté pour créer une liste');
        return;
    }
    
    const { data, error } = await window.supabase
        .from('shopping_lists')
        .insert({
            owner_user_id: user.id,
            name: name,
            status: 'en_cours'
        })
        .select()
        .single();
    
    if (error) {
        console.error('Erreur création liste:', error);
        alert('Impossible de créer la liste');
        return;
    }
    
    allShoppingLists.unshift(data);
    currentShoppingList = data;
    shoppingListItems = [];
    
    // Mettre à jour l'affichage
    cancelNewList();
    renderShoppingLists();
    renderShoppingItems();
}

async function validateShoppingList() {
    if (!currentShoppingList) return;
    
    if (shoppingListItems.length === 0) {
        alert('⚠️ La liste est vide.\n\nAjoutez des articles avant de valider.');
        return;
    }
    
    alert('✅ Liste validée !\n\n"' + currentShoppingList.name + '" est prête.\nVous la retrouverez sur votre mobile pour faire les courses.\n\nVous pouvez continuer à la modifier ici si besoin.');
}

function closeShoppingListManager() {
    document.querySelectorAll('.modal-shopping-list').forEach(m => m.remove());
}

// Exposer les fonctions globalement
window.openShoppingListManager = openShoppingListManager;
window.closeShoppingListManager = closeShoppingListManager;
window.addShoppingItem = addShoppingItem;
window.selectShoppingList = selectShoppingList;
window.deleteShoppingItem = deleteShoppingItem;
window.validateShoppingList = validateShoppingList;
window.showNewListForm = showNewListForm;
window.cancelNewList = cancelNewList;
window.createNewList = createNewList;

// ═══════════════════════════════════════════════════════════════════════