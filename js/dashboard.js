/**
 * Vue d'ensemble hebdomadaire : réservations, ménages, todos
 * Version: 2.2.0 - Gestion problèmes clients
 */

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
    const { data: cleanings } = await supabase
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
    
    // Afficher les alertes
    const container = document.getElementById('dashboard-alerts');
    if (alerts.length === 0) {
        container.innerHTML = '';
        return;
    }
    
    let html = '';
    alerts.forEach(alert => {
        const bgColor = alert.type === 'danger' ? '#E74C3C' : alert.type === 'warning' ? '#F39C12' : '#3498DB';
        html += `
            <div style="background: ${bgColor}; color: white; padding: 15px 20px; border-radius: 10px; margin-bottom: 10px; display: flex; align-items: center; gap: 15px; cursor: pointer;" 
                 onclick="(${alert.action.toString()})()">
                <span style="font-size: 1.5rem;">${alert.icon}</span>
                <span style="flex: 1; font-weight: 500;">${alert.message}</span>
                <span style="font-size: 1.2rem;">→</span>
            </div>
        `;
    });
    container.innerHTML = html;
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
    const { data: cleanings } = await supabase
        .from('cleaning_schedule')
        .select('*')
        .gte('scheduled_date', weekStart.toISOString().split('T')[0])
        .lte('scheduled_date', weekEnd.toISOString().split('T')[0]);
    
    const cleaningsCount = cleanings ? cleanings.length : 0;
    
    // Compteurs todos par catégorie (non archivés, non complétés)
    const { data: todos } = await supabase
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
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Charger les horaires validées
    const { data: horairesValidees } = await supabaseClient
        .from('demandes_horaires')
        .select('*')
        .eq('statut', 'validee');
    
    // Créer un map pour accès rapide
    const horairesMap = {};
    if (horairesValidees) {
        horairesValidees.forEach(h => {
            if (!horairesMap[h.reservation_id]) horairesMap[h.reservation_id] = {};
            horairesMap[h.reservation_id][h.type] = h.heure_validee;
        });
    }
    
    // Les 7 prochains jours (aujourd'hui + 6 jours)
    const in7Days = new Date(today);
    in7Days.setDate(today.getDate() + 6);
    
    // Filtrer les réservations
    const filtered = reservations.filter(r => {
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
    
    if (filtered.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #999; padding: 40px;">Aucune réservation dans les 7 prochains jours</p>';
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
        
        // Charger la progression checklist
        const checklistProgress = await getReservationChecklistProgressDashboard(r.id, r.gite);
        
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
        
        const giteColor = r.gite === 'Trévoux' ? '#667eea' : '#f093fb';
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
        
        html += `
            <div style="border-left: 4px solid ${giteColor}; padding: 15px; margin-bottom: 10px; background: ${shouldSendReminder ? '#FFF9E6' : '#f8f9fa'}; border-radius: 8px; position: relative;">
                ${shouldSendReminder ? '<div style="position: absolute; top: 10px; right: 10px; background: #F39C12; color: white; padding: 4px 10px; border-radius: 6px; font-size: 0.75rem; font-weight: 600;">⏰ J-3 : Envoyer fiche</div>' : ''}
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
                    <div style="flex: 1;">
                        <strong style="font-size: 1.1rem; color: ${giteColor};">${r.nom}</strong>
                        <div style="color: #666; font-size: 0.9rem; margin-top: 4px;">
                            <span style="background: ${badgeColor}; color: white; padding: 2px 8px; border-radius: 4px; font-size: 0.8rem; margin-right: 8px;">${badge}</span>
                            ${formatDateFromObj(dateDebut)} <strong style="color: #27AE60;">⏰ ${horaireArrivee}</strong> → ${formatDateFromObj(dateFin)} <strong style="color: #E74C3C;">⏰ ${horaireDepart}</strong> (${r.nuits} nuits)
                        </div>
                        <div style="display: flex; gap: 15px; font-size: 0.9rem; color: #666; margin-top: 6px;">
                            <span>🏠 ${r.gite}</span>
                            <span>👥 ${r.nbPersonnes || '-'} pers.</span>
                            ${daysUntilArrival >= 0 ? `<span style="color: ${daysUntilArrival <= 3 ? '#F39C12' : '#999'};">📅 J${daysUntilArrival > 0 ? '-' + daysUntilArrival : ''}</span>` : ''}
                        </div>
                        ${checklistHtml}
                    </div>
                    <span style="font-size: 1.5rem; margin-left: 10px;" title="${r.paiement}">${paiementIcon}</span>
                </div>
                <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #e0e0e0; display: flex; gap: 8px;">
                    ${showFicheButton ? `
                    <button onclick="aperçuFicheClient(${r.id})" 
                            style="flex: 1; background: #667eea; color: white; border: none; padding: 8px 12px; border-radius: 6px; cursor: pointer; font-size: 0.85rem; font-weight: 500; display: flex; align-items: center; justify-content: center; gap: 6px;">
                        📄 Fiche Client
                    </button>
                    ` : ''}
                    <button onclick="openEditReservation(${r.id})" 
                            style="background: #3498DB; color: white; border: none; padding: 8px 12px; border-radius: 6px; cursor: pointer; font-size: 0.85rem;">
                        ✏️
                    </button>
                </div>
            </div>
        `;
    }
    
    container.innerHTML = html;
}

// ==========================================
// 🧹 MÉNAGES DE LA SEMAINE
// ==========================================

async function updateDashboardMenages() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay() + 1);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    
    const { data: cleanings } = await supabase
        .from('cleaning_schedule')
        .select('*, reservations(*)')
        .gte('scheduled_date', weekStart.toISOString().split('T')[0])
        .lte('scheduled_date', weekEnd.toISOString().split('T')[0])
        .order('scheduled_date', { ascending: true });
    
    const container = document.getElementById('dashboard-menages');
    
    if (!cleanings || cleanings.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #999; padding: 40px;">Aucun ménage prévu cette semaine</p>';
        return;
    }
    
    let html = '';
    cleanings.forEach(c => {
        const statusIcons = {
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
        
        const icon = statusIcons[c.status] || '❓';
        const color = statusColors[c.status] || '#999';
        const timeIcon = c.time_of_day === 'morning' ? '🌅' : '🌆';
        const giteColor = c.gite === 'Trévoux' ? '#667eea' : '#f093fb';
        
        html += `
            <div style="border-left: 4px solid ${giteColor}; padding: 12px; margin-bottom: 8px; background: #f8f9fa; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <strong style="color: ${giteColor};">${c.gite}</strong>
                    <div style="font-size: 0.85rem; color: #666; margin-top: 4px;">
                        📅 ${formatDateFromObj(new Date(c.scheduled_date))} ${timeIcon}
                    </div>
                </div>
                <span style="font-size: 1.5rem; color: ${color};" title="${c.status}">${icon}</span>
            </div>
        `;
    });
    
    container.innerHTML = html;
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
    
    const { data: todos } = await supabase
        .from('todos')
        .select('*')
        .eq('category', category)
        .eq('completed', false) // Seulement les tâches non complétées
        .is('archived_at', null) // Seulement les tâches non archivées
        .order('created_at', { ascending: true });
    
    // Filtrer les tâches dont la date d'occurrence est passée ou inexistante
    const now = new Date();
    const visibleTodos = todos?.filter(todo => {
        if (!todo.is_recurrent || !todo.next_occurrence) {
            return true; // Tâche normale ou récurrente sans date = visible
        }
        // Tâche récurrente : visible seulement si la date est passée
        const nextOcc = new Date(todo.next_occurrence);
        return nextOcc <= now;
    }) || [];
    
    if (visibleTodos.length > 0) {
    }
    
    const container = document.getElementById(`todo-${category}`);
    
    if (!visibleTodos || visibleTodos.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #999; padding: 20px; font-size: 0.9rem;">Aucune tâche</p>';
        return;
    }
    
    let html = '';
    visibleTodos.forEach(todo => {
        const recurrentBadge = todo.is_recurrent ? '<span style="background: #9B59B6; color: white; padding: 3px 8px; border-radius: 6px; font-size: 0.75rem; margin-left: 8px; display: inline-flex; align-items: center; gap: 4px;">🔁 Récurrent</span>' : '';
        const frequencyLabel = todo.is_recurrent && todo.frequency ? 
            (todo.frequency === 'weekly' ? 'Hebdo' : todo.frequency === 'biweekly' ? 'Bi-hebdo' : 'Mensuel') : '';
        
        html += `
            <div style="display: flex; gap: 12px; padding: 14px; margin-bottom: 8px; background: white; border-radius: 8px; border: 1px solid #e9ecef; align-items: start; transition: all 0.2s;">
                <input type="checkbox" onchange="toggleTodo(${todo.id}, this.checked)" 
                       style="width: 20px; height: 20px; cursor: pointer; margin-top: 3px; flex-shrink: 0;">
                <div style="flex: 1;">
                    <div style="font-weight: 500; font-size: 0.95rem; margin-bottom: 6px; line-height: 1.4;">
                        ${todo.title}
                        ${recurrentBadge}
                    </div>
                    ${todo.description ? `<div style="font-size: 0.85rem; color: #6c757d; margin-bottom: 8px; line-height: 1.5;">${todo.description}</div>` : ''}
                    <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                        ${todo.gite ? `<span style="background: ${todo.gite === 'Trévoux' ? '#667eea' : '#f093fb'}; color: white; padding: 3px 10px; border-radius: 6px; font-size: 0.75rem; font-weight: 500;">${todo.gite}</span>` : ''}
                        ${todo.is_recurrent && frequencyLabel ? `<span style="background: #E8DAEF; color: #7D3C98; padding: 3px 10px; border-radius: 6px; font-size: 0.75rem; font-weight: 500;">${frequencyLabel}</span>` : ''}
                    </div>
                </div>
                <button onclick="editTodo(${todo.id})" 
                        style="background: #e3f2fd; border: 1px solid #90caf9; color: #1976d2; cursor: pointer; font-size: 1rem; padding: 4px 10px; border-radius: 6px; flex-shrink: 0; transition: all 0.2s; line-height: 1;"
                        onmouseover="this.style.background='#1976d2'; this.style.color='white';"
                        onmouseout="this.style.background='#e3f2fd'; this.style.color='#1976d2';"
                        title="Modifier">✏️</button>
                <button onclick="deleteTodo(${todo.id})" 
                        style="background: #fee; border: 1px solid #fcc; color: #E74C3C; cursor: pointer; font-size: 1.3rem; padding: 4px 10px; border-radius: 6px; flex-shrink: 0; transition: all 0.2s; line-height: 1;"
                        onmouseover="this.style.background='#E74C3C'; this.style.color='white';"
                        onmouseout="this.style.background='#fee'; this.style.color='#E74C3C';"
                        title="Supprimer">×</button>
            </div>`;
    });
    
    container.innerHTML = html;
}

async function addTodoItem(category) {
    // Afficher le modal
    const modal = document.getElementById('addTodoModal');
    const form = document.getElementById('addTodoForm');
    const categoryInput = document.getElementById('todoCategory');
    const giteGroup = document.getElementById('giteSelectGroup');
    
    // Configurer le modal selon la catégorie
    categoryInput.value = category;
    
    // Afficher le sélecteur de gîte uniquement pour "travaux"
    if (category === 'travaux') {
        giteGroup.style.display = 'block';
    } else {
        giteGroup.style.display = 'none';
    }
    
    // Réinitialiser le formulaire
    form.reset();
    document.getElementById('recurrentOptions').style.display = 'none';
    
    modal.style.display = 'block';
}

function closeAddTodoModal() {
    document.getElementById('addTodoModal').style.display = 'none';
    document.getElementById('addTodoForm').reset();
}

// Gestion du formulaire d'ajout de tâche
let todoModalInitialized = false;

function initializeTodoModal() {
    // Ne pas réinitialiser si déjà fait
    if (todoModalInitialized) return;
    
    const recurrentCheckbox = document.getElementById('todoRecurrent');
    const recurrentOptions = document.getElementById('recurrentOptions');
    const frequencySelect = document.getElementById('todoFrequency');
    const weeklyOptions = document.getElementById('weeklyOptions');
    const monthlyOptions = document.getElementById('monthlyOptions');
    
    // Vérifier que les éléments existent
    if (!recurrentCheckbox || !frequencySelect) return;
    
    // Afficher/masquer les options récurrentes
    recurrentCheckbox.addEventListener('change', function() {
        recurrentOptions.style.display = this.checked ? 'block' : 'none';
    });
    
    // Afficher/masquer les options selon la fréquence
    frequencySelect.addEventListener('change', function() {
        if (this.value === 'monthly') {
            weeklyOptions.style.display = 'none';
            monthlyOptions.style.display = 'block';
        } else {
            weeklyOptions.style.display = 'block';
            monthlyOptions.style.display = 'none';
        }
    });
    
    // Soumission du formulaire
    const addTodoForm = document.getElementById('addTodoForm');
    if (addTodoForm) {
        addTodoForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const category = document.getElementById('todoCategory').value;
            const title = document.getElementById('todoTitle').value;
            const description = document.getElementById('todoDescription').value;
            const gite = document.getElementById('todoGite').value || null;
            const isRecurrent = document.getElementById('todoRecurrent').checked;
            
            let frequency = null;
            let frequencyDetail = null;
            let nextOccurrence = null;
            
            if (isRecurrent) {
                frequency = document.getElementById('todoFrequency').value;
                
                if (frequency === 'weekly' || frequency === 'biweekly') {
                    const dayOfWeek = parseInt(document.getElementById('todoWeekday').value);
                    frequencyDetail = { day_of_week: dayOfWeek };
                } else if (frequency === 'monthly') {
                    const dayOfMonth = parseInt(document.getElementById('todoDayOfMonth').value);
                    frequencyDetail = { day_of_month: dayOfMonth };
                }
                
                nextOccurrence = calculateNextOccurrence(frequency, frequencyDetail);
            }
            
            const { error } = await supabase
                .from('todos')
                .insert({
                    category: category,
                    title: title,
                    description: description || null,
                    gite: gite,
                    completed: false,
                    is_recurrent: isRecurrent,
                    frequency: frequency,
                    frequency_detail: frequencyDetail,
                    next_occurrence: nextOccurrence
                });
            
            if (error) {
                console.error('Erreur création todo:', error);
                alert('Erreur lors de la création de la tâche');
                return;
            }
            
            // Fermer le modal et rafraîchir
            closeAddTodoModal();
            await updateTodoList(category);
            await updateDashboardStats();
        });
    }
    
    // Marquer comme initialisé
    todoModalInitialized = true;
}

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
    try {
        // Récupérer la tâche pour vérifier si elle est récurrente
        const { data: todo, error: fetchError } = await supabase
            .from('todos')
            .select('*')
            .eq('id', id)
            .single();
        
        
        if (fetchError || !todo) {
            console.error('❌ Erreur récupération todo:', fetchError);
            showToast('Erreur lors de la récupération de la tâche', 'error');
            // Recharger pour restaurer l'état correct
            await updateTodoList(todo?.category || 'menage');
            return;
        }
        
        
        // Si cochée et récurrente, créer une nouvelle occurrence et archiver l'actuelle
        if (completed && todo.is_recurrent) {
            // Calculer la prochaine occurrence
            const nextOccurrence = calculateNextOccurrence(todo.frequency, todo.frequency_detail);
            
            // Créer la nouvelle occurrence
            const { error: insertError } = await supabase
                .from('todos')
                .insert({
                    category: todo.category,
                    title: todo.title,
                    description: todo.description,
                    gite: todo.gite,
                    completed: false,
                    is_recurrent: true,
                    frequency: todo.frequency,
                    frequency_detail: todo.frequency_detail,
                    next_occurrence: nextOccurrence,
                    archived_at: null
                });
            
            
            if (insertError) {
                console.error('❌ Erreur création nouvelle occurrence:', insertError);
                showToast('Erreur lors de la création de la prochaine occurrence', 'error');
                await updateTodoList(todo.category);
                return;
            }
            
            // Archiver l'ancienne
            const { error: archiveError } = await supabase
                .from('todos')
                .update({ 
                    completed: true, 
                    archived_at: new Date().toISOString(),
                    last_generated: new Date().toISOString()
                })
                .eq('id', id);
            
            
            if (archiveError) {
                console.error('❌ Erreur mise à jour todo:', archiveError);
                showToast('Erreur lors de l\'archivage', 'error');
                await updateTodoList(todo.category);
                return;
            }
            
            showToast('✓ Tâche terminée, prochaine occurrence créée', 'success');
        } else {
            // Si coché (non récurrente), archiver la tâche
            // Si décoché, restaurer
            const updateData = completed ? 
                { completed: true, archived_at: new Date().toISOString() } : 
                { completed: false, archived_at: null };
            
            
            const { error } = await supabase
                .from('todos')
                .update(updateData)
                .eq('id', id);
            
            
            if (error) {
                console.error('❌ Erreur mise à jour todo:', error);
                showToast('Erreur lors de la mise à jour', 'error');
                await updateTodoList(todo.category);
                return;
            }
            
            showToast(completed ? '✓ Tâche terminée' : '↺ Tâche réactivée', 'success');
        }
        
        // Recharger la liste correspondante
        await updateTodoList(todo.category);
        
        await updateDashboardStats(); // Mettre à jour le compteur
    } catch (error) {
        console.error('❌ Erreur dans toggleTodo:', error);
        console.error('❌ Stack:', error.stack);
        showToast('Erreur inattendue', 'error');
    }
}

async function deleteTodo(id) {
    if (!confirm('Supprimer cette tâche ?')) return;
    
    const { error } = await supabase
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
    const { data: todo, error } = await supabase
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
        
        const { error: updateError } = await supabase
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
    
    // 1. Calculer le bénéfice RÉEL de l'année en cours
    const reservations = await getAllReservations();
    const charges = await getAllCharges();
    
    // Filtrer par année actuelle
    const reservationsAnnee = reservations.filter(r => {
        const dateDebut = parseLocalDate(r.dateDebut);
        return dateDebut.getFullYear() === anneeActuelle;
    });
    
    const chargesAnnee = charges.filter(c => {
        if (!c.date) return false;
        const dateCharge = new Date(c.date);
        return dateCharge.getFullYear() === anneeActuelle;
    });
    
    // Calculer CA
    const caAnnee = reservationsAnnee.reduce((sum, r) => sum + (parseFloat(r.montant) || 0), 0);
    
    // Récupérer le Total Charges depuis la simulation fiscale de l'année en cours
    const { data: simFiscale } = await supabase
        .from('simulations_fiscales')
        .select('*')
        .eq('annee', anneeActuelle)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
    
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
        
        // Trévoux (sans amortissement)
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
        
        // Crédit Trévoux
        const creditTrevoux = (simFiscale.credits_liste || [])
            .filter(c => c.nom && c.nom.toLowerCase().includes('trévoux'))
            .reduce((sum, c) => sum + (c.mensualite * 12), 0);
        
        totalChargesAnnee = chargesCouzon + chargesTrevoux + fraisPro + travaux + fraisDivers + produitsAccueil + creditTrevoux;
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
    const { data: simulationPrecedente, error: errorPrecedente } = await supabase
        .from('simulations_fiscales')
        .select('*')
        .eq('annee', anneePrecedente)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
    
    let impotRevenuPrecedent = 0;
    let urssafPrecedent = 0;
    
    if (simulationPrecedente) {
        if (simulationPrecedente.impot_revenu) {
            impotRevenuPrecedent = parseFloat(simulationPrecedente.impot_revenu);
        } else {
            console.warn(`⚠️ Champ impot_revenu null ou undefined pour ${anneePrecedente}`);
        }
        
        if (simulationPrecedente.cotisations_urssaf) {
            urssafPrecedent = parseFloat(simulationPrecedente.cotisations_urssaf);
        } else {
            console.warn(`⚠️ Champ cotisations_urssaf null ou undefined pour ${anneePrecedente}`);
        }
    } else {
        console.warn(`⚠️ Aucune simulation trouvée pour ${anneePrecedente}`);
    }
    
    // 4. Calculer l'IR de l'ANNÉE EN COURS (temps réel)
    const { data: simulationCourante } = await supabase
        .from('simulations_fiscales')
        .select('*')
        .eq('annee', anneeActuelle)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
    
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
        console.warn(`⚠️ Pas de simulation pour ${anneeActuelle}, calcul simplifié`);
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
    
    // Afficher IR des 2 années  
    if (ir2025El) {
        ir2025El.textContent = simulationPrecedente ? formatCurrency(impotRevenuPrecedent) : '-';
    }
    if (ir2026El) {
        ir2026El.textContent = formatCurrency(impotRevenuCourant);
    }
    
    // Afficher bénéfice
    if (beneficeEl) beneficeEl.textContent = formatCurrency(beneficeAnnee);
    
    // 6. Trésorerie actuelle (dernier mois enregistré)
    const moisActuel = new Date().getMonth() + 1;
    
    const { data: soldeMois } = await supabase
        .from('suivi_soldes_bancaires')
        .select('solde')
        .eq('annee', anneeActuelle)
        .eq('mois', moisActuel)
        .single();
    
    const tresorerieEl = document.getElementById('dashboard-tresorerie');
    if (tresorerieEl) {
        tresorerieEl.textContent = soldeMois ? formatCurrency(soldeMois.solde) : '-';
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
            
            // 1. Calculer le CA du mois (toutes les réservations Trévoux + Couzon)
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
    
    // Récupérer les soldes de l'année en cours
    const { data: soldes } = await supabase
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
// 🔄 RAFRAÎCHISSEMENT COMPLET
// ==========================================

async function refreshDashboard() {
    updateDashboardHeader();
    await updateDashboardAlerts();
    await updateDemandesClients();
    await updateProblemesClients(); // Nouvelle fonction pour problèmes/retours
    await updateDashboardStats();
    await updateDashboardReservations();
    await updateDashboardMenages();
    await updateTodoLists();
    await updateFinancialIndicators();
    // Initialiser le modal si pas déjà fait
    initializeTodoModal();
    initializeReponseWhatsappModal();
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
// ⏰ DEMANDES D'HORAIRES CLIENTS
// ==========================================

async function updateDemandesClients() {
    try {
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
        
        if (!demandes || demandes.length === 0) {
            container.innerHTML = '<p style="color: #95a5a6; font-style: italic; margin: 0;">Aucune demande en attente</p>';
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
            const clientNom = d.client_nom || 'Client';
            const clientPrenom = d.client_prenom || '';
            const gite = d.gite || '';
            
            html += `
                <div style="background: white; border: 1px solid #e0e0e0; border-radius: 8px; padding: 12px; display: flex; justify-content: space-between; align-items: center;">
                    <div style="flex: 1;">
                        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 6px;">
                            <span style="background: ${typeColor}; color: white; padding: 3px 10px; border-radius: 4px; font-size: 0.8rem; font-weight: 600;">${typeLabel}</span>
                            <strong style="font-size: 1rem;">${clientNom} ${clientPrenom}</strong>
                            ${gite ? `<span style="color: #666; font-size: 0.85rem;">• ${gite}</span>` : ''}
                        </div>
                        <div style="color: #666; font-size: 0.9rem;">
                            📅 ${formatDateFromObj(new Date(d.date_debut))} → ${formatDateFromObj(new Date(d.date_fin))}
                            • ⏰ Demande: <strong>${d.heure_demandee}</strong>
                        </div>
                    </div>
                    <div style="display: flex; gap: 8px;">
                        <button onclick="validerDemandeHoraire(${d.id}, '${d.heure_demandee}')" 
                                style="background: #27AE60; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 0.85rem; font-weight: 500;">
                            ✓ Valider
                        </button>
                        <button onclick="refuserDemandeHoraire(${d.id})" 
                                style="background: #E74C3C; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 0.85rem; font-weight: 500;">
                            ✗ Refuser
                        </button>
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
    } catch (err) {
        console.error('Erreur chargement demandes:', err);
    }
}

async function validerDemandeHoraire(demandeId, heureValidee) {
    const username = sessionStorage.getItem('username') || 'Admin';
    
    try {
        const { error } = await supabaseClient
            .from('demandes_horaires')
            .update({
                statut: 'validee',
                heure_validee: heureValidee,
                validated_at: new Date().toISOString(),
                validated_by: username
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
    const raison = prompt('Raison du refus (optionnel):');
    const username = sessionStorage.getItem('username') || 'Admin';
    
    try {
        const { error } = await supabaseClient
            .from('demandes_horaires')
            .update({
                statut: 'refusee',
                raison_refus: raison || 'Non disponible',
                validated_at: new Date().toISOString(),
                validated_by: username
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
        console.log('🔍 DEBUG problèmes enrichis:');
        problemes?.forEach(p => {
            console.log(`  ➤ ID: ${p.id} | Sujet: "${p.sujet}" | Téléphone: ${p.telephone || '❌ NULL'} | Client: ${p.client_nom || '❌ NULL'} | Resa ID: ${p.reservation_id || '❌ NULL'}`);
        });
        
        // Séparer les problèmes urgents des autres
        const problemesUrgents = problemes.filter(pb => pb.type === 'probleme');
        const autresDemandes = problemes.filter(pb => pb.type !== 'probleme');
        
        // === CARD ROUGE : PROBLÈMES URGENTS ===
        const containerUrgents = document.getElementById('liste-problemes-urgents');
        const badgeUrgents = document.getElementById('badge-problemes-urgents-count');
        const cardUrgents = document.getElementById('dashboard-problemes-urgents');
        
        if (!problemesUrgents || problemesUrgents.length === 0) {
            containerUrgents.innerHTML = '<p style="color: #95a5a6; font-style: italic; margin: 0;">Aucun problème urgent</p>';
            badgeUrgents.textContent = '0';
            cardUrgents.style.display = 'none';
        } else {
            cardUrgents.style.display = 'block';
            badgeUrgents.textContent = problemesUrgents.length;
            let htmlUrgents = '';
            problemesUrgents.forEach(pb => {
                htmlUrgents += renderProblemeCard(pb, true);
            });
            containerUrgents.innerHTML = htmlUrgents;
        }
        
        // === CARD BLEUE : DEMANDES & RETOURS ===
        const containerDemandes = document.getElementById('liste-demandes-retours');
        const badgeDemandes = document.getElementById('badge-demandes-retours-count');
        const cardDemandes = document.getElementById('dashboard-demandes-retours');
        
        if (!autresDemandes || autresDemandes.length === 0) {
            containerDemandes.innerHTML = '<p style="color: #95a5a6; font-style: italic; margin: 0;">Aucune demande en attente</p>';
            badgeDemandes.textContent = '0';
            cardDemandes.style.display = 'none';
        } else {
            cardDemandes.style.display = 'block';
            badgeDemandes.textContent = autresDemandes.length;
            let htmlDemandes = '';
            autresDemandes.forEach(pb => {
                htmlDemandes += renderProblemeCard(pb, false);
            });
            containerDemandes.innerHTML = htmlDemandes;
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
        // Récupérer les templates pour ce gîte
        const { data: templates, error: templatesError } = await supabaseClient
            .from('checklist_templates')
            .select('id, type')
            .eq('gite', gite)
            .eq('actif', true);
        
        if (templatesError) throw templatesError;
        
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
        console.error('❌ Erreur calcul progression checklist:', error);
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
