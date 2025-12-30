/**
 * 📊 MODULE DASHBOARD - Tableau de bord principal
 * Vue d'ensemble hebdomadaire : réservations, ménages, todos
 */

// ==========================================
// �️ UTILITAIRES DATE
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
    
    // Numéro de semaine
    const onejan = new Date(today.getFullYear(), 0, 1);
    const weekNumber = Math.ceil((((today - onejan) / 86400000) + onejan.getDay() + 1) / 7);
    
    const dateEl = document.getElementById('dashboard-date');
    const weekNumEl = document.getElementById('dashboard-week-number');
    const weekInfoEl = document.getElementById('dashboard-week-info');
    
    if (dateEl) dateEl.textContent = formatDateFromObj(today);
    if (weekNumEl) weekNumEl.textContent = `Semaine ${weekNumber}`;
    if (weekInfoEl) weekInfoEl.textContent = `Du ${formatDateFromObj(weekStart)} au ${formatDateFromObj(weekEnd)}`;
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
// 📊 RÉSUMÉ FINANCIER & STATS
// ==========================================

async function updateDashboardStats() {
    const reservations = await getAllReservations();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay() + 1);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    
    // Réservations de la semaine (qui arrivent ou partent cette semaine)
    const weekReservations = reservations.filter(r => {
        const arrival = parseLocalDate(r.dateDebut);
        const departure = parseLocalDate(r.dateFin);
        return (arrival >= weekStart && arrival <= weekEnd) || 
               (departure >= weekStart && departure <= weekEnd) ||
               (arrival <= weekStart && departure >= weekEnd);
    });
    
    // CA de la semaine (arrivées)
    const weekArrivals = reservations.filter(r => {
        const arrival = parseLocalDate(r.dateDebut);
        return arrival >= weekStart && arrival <= weekEnd;
    });
    const caWeek = weekArrivals.reduce((sum, r) => sum + r.montant, 0);
    
    // Taux d'occupation (jours occupés / jours disponibles pour 2 gîtes)
    let occupiedDays = 0;
    weekReservations.forEach(r => {
        const arrival = parseLocalDate(r.dateDebut);
        const departure = parseLocalDate(r.dateFin);
        const start = arrival < weekStart ? weekStart : arrival;
        const end = departure > weekEnd ? weekEnd : departure;
        occupiedDays += Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    });
    const totalDays = 7 * 2; // 7 jours, 2 gîtes
    const occupationRate = ((occupiedDays / totalDays) * 100).toFixed(0);
    
    // Ménages à faire
    const { data: cleanings } = await supabase
        .from('cleaning_schedule')
        .select('*')
        .gte('scheduled_date', weekStart.toISOString().split('T')[0])
        .lte('scheduled_date', weekEnd.toISOString().split('T')[0]);
    
    const cleaningsCount = cleanings ? cleanings.length : 0;
    
    // Actions en attente (todos non complétés et non archivés)
    const { data: todos } = await supabase
        .from('todos')
        .select('*')
        .eq('completed', false)
        .is('archived_at', null);
    
    const pendingCount = todos ? todos.length : 0;
    
    // Mettre à jour l'affichage
    document.getElementById('dashboard-ca-week').textContent = caWeek.toFixed(0) + ' €';
    document.getElementById('dashboard-occupation').textContent = occupationRate + '%';
    document.getElementById('dashboard-cleanings').textContent = cleaningsCount;
    document.getElementById('dashboard-pending').textContent = pendingCount;
}

// ==========================================
// 📅 RÉSERVATIONS DE LA SEMAINE
// ==========================================

async function updateDashboardReservations() {
    const reservations = await getAllReservations();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay() + 1);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    
    // Réservations de la semaine
    const weekReservations = reservations.filter(r => {
        const arrival = parseLocalDate(r.dateDebut);
        const departure = parseLocalDate(r.dateFin);
        return (arrival >= weekStart && arrival <= weekEnd) || 
               (departure >= weekStart && departure <= weekEnd);
    }).sort((a, b) => parseLocalDate(a.dateDebut) - parseLocalDate(b.dateDebut));
    
    const container = document.getElementById('dashboard-reservations');
    
    if (weekReservations.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #999; padding: 40px;">Aucune réservation cette semaine</p>';
        return;
    }
    
    let html = '';
    weekReservations.forEach(r => {
        const arrival = parseLocalDate(r.dateDebut);
        const departure = parseLocalDate(r.dateFin);
        const isArrival = arrival >= weekStart && arrival <= weekEnd;
        const isDeparture = departure >= weekStart && departure <= weekEnd;
        
        const badge = isArrival ? '📥 Arrivée' : '📤 Départ';
        const badgeColor = isArrival ? '#27AE60' : '#3498DB';
        const giteColor = r.gite === 'Trévoux' ? '#667eea' : '#f093fb';
        
        const paiementIcon = r.paiement === 'Soldé' ? '✅' : r.paiement === 'Acompte reçu' ? '⏳' : '❌';
        const paiementColor = r.paiement === 'Soldé' ? '#27AE60' : r.paiement === 'Acompte reçu' ? '#F39C12' : '#E74C3C';
        
        // Calculer jours avant arrivée
        const daysUntilArrival = Math.ceil((arrival - today) / (1000 * 60 * 60 * 24));
        const shouldSendReminder = daysUntilArrival === 3;
        
        html += `
            <div style="border-left: 4px solid ${giteColor}; padding: 15px; margin-bottom: 10px; background: ${shouldSendReminder ? '#FFF9E6' : '#f8f9fa'}; border-radius: 8px; position: relative;">
                ${shouldSendReminder ? '<div style="position: absolute; top: 10px; right: 10px; background: #F39C12; color: white; padding: 4px 10px; border-radius: 6px; font-size: 0.75rem; font-weight: 600;">⏰ J-3 : Envoyer fiche</div>' : ''}
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
                    <div style="flex: 1;">
                        <strong style="font-size: 1.1rem; color: ${giteColor};">${r.nom}</strong>
                        <div style="color: #666; font-size: 0.9rem; margin-top: 4px;">
                            <span style="background: ${badgeColor}; color: white; padding: 2px 8px; border-radius: 4px; font-size: 0.8rem; margin-right: 8px;">${badge}</span>
                            ${formatDateFromObj(arrival)} → ${formatDateFromObj(departure)} (${r.nuits} nuits)
                        </div>
                        <div style="display: flex; gap: 15px; font-size: 0.9rem; color: #666; margin-top: 6px;">
                            <span>🏠 ${r.gite}</span>
                            <span>💰 ${r.montant.toFixed(0)} €</span>
                            <span>👥 ${r.nb_personnes || '-'} pers.</span>
                            ${daysUntilArrival >= 0 ? `<span style="color: ${daysUntilArrival <= 3 ? '#F39C12' : '#999'};">📅 J${daysUntilArrival > 0 ? '-' + daysUntilArrival : ''}</span>` : ''}
                        </div>
                    </div>
                    <span style="font-size: 1.5rem; margin-left: 10px;" title="${r.paiement}">${paiementIcon}</span>
                </div>
                ${isArrival ? `
                <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #e0e0e0; display: flex; gap: 8px;">
                    <button onclick="openFicheClient(${r.id})" 
                            style="flex: 1; background: #667eea; color: white; border: none; padding: 8px 12px; border-radius: 6px; cursor: pointer; font-size: 0.85rem; font-weight: 500; display: flex; align-items: center; justify-content: center; gap: 6px;">
                        📄 Fiche Client
                    </button>
                    <button onclick="openEditReservation(${r.id})" 
                            style="background: #3498DB; color: white; border: none; padding: 8px 12px; border-radius: 6px; cursor: pointer; font-size: 0.85rem;">
                        ✏️
                    </button>
                </div>
                ` : ''}
            </div>
        `;
    });
    
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
// ✅ TODO LISTES
// ==========================================

async function updateTodoLists() {
    await updateTodoList('reservations');
    await updateTodoList('travaux');
    await updateTodoList('achats');
}

async function updateTodoList(category) {
    const { data: todos } = await supabase
        .from('todos')
        .select('*')
        .eq('category', category)
        .is('archived_at', null) // Seulement les tâches non archivées
        .order('created_at', { ascending: true });
    
    const container = document.getElementById(`todo-${category}`);
    
    if (!todos || todos.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #999; padding: 20px; font-size: 0.9rem;">Aucune tâche</p>';
        return;
    }
    
    let html = '';
    todos.forEach(todo => {
        const checked = todo.completed ? 'checked' : '';
        const textStyle = todo.completed ? 'text-decoration: line-through; opacity: 0.6;' : '';
        const recurrentBadge = todo.is_recurrent ? '<span style="background: #9B59B6; color: white; padding: 2px 6px; border-radius: 4px; font-size: 0.7rem; margin-left: 6px;">🔁 Récurrent</span>' : '';
        const frequencyLabel = todo.is_recurrent && todo.frequency ? 
            (todo.frequency === 'weekly' ? 'Hebdo' : todo.frequency === 'biweekly' ? 'Bi-hebdo' : 'Mensuel') : '';
        
        html += `
            <div style="display: flex; gap: 10px; padding: 10px 0; border-bottom: 1px solid #eee; align-items: start;">
                <input type="checkbox" ${checked} onchange="toggleTodo(${todo.id}, this.checked)" 
                       style="width: 18px; height: 18px; cursor: pointer; margin-top: 2px;">
                <div style="flex: 1; ${textStyle}">
                    <div style="font-weight: 500;">
                        ${todo.title}
                        ${recurrentBadge}
                    </div>
                    ${todo.description ? `<div style="font-size: 0.85rem; color: #666; margin-top: 4px;">${todo.description}</div>` : ''}
                    <div style="display: flex; gap: 8px; margin-top: 4px; flex-wrap: wrap;">
                        ${todo.gite ? `<span style="background: ${todo.gite === 'Trévoux' ? '#667eea' : '#f093fb'}; color: white; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem;">${todo.gite}</span>` : ''}
                        ${todo.is_recurrent && frequencyLabel ? `<span style="background: #E8DAEF; color: #7D3C98; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem;">${frequencyLabel}</span>` : ''}
                    </div>
                </div>
                <button onclick="deleteTodo(${todo.id})" 
                        style="background: none; border: none; color: #E74C3C; cursor: pointer; font-size: 1.2rem; padding: 0;"
                        title="Supprimer">×</button>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

async function addTodoItem(category) {
    const title = prompt('Titre de la tâche :');
    if (!title) return;
    
    const description = prompt('Description (optionnel) :');
    
    let gite = null;
    if (category === 'travaux') {
        const choice = prompt('Gîte concerné ?\n1 = Trévoux\n2 = Couzon\n(vide pour les deux)');
        if (choice === '1') gite = 'Trévoux';
        if (choice === '2') gite = 'Couzon';
    }
    
    // Demander si la tâche est récurrente
    const isRecurrentChoice = confirm('Cette tâche doit-elle se répéter automatiquement ?');
    let frequency = null;
    let frequencyDetail = null;
    let nextOccurrence = null;
    
    if (isRecurrentChoice) {
        const freqChoice = prompt('Fréquence :\n1 = Chaque semaine\n2 = Toutes les 2 semaines\n3 = Chaque mois');
        if (freqChoice === '1') {
            frequency = 'weekly';
            const day = prompt('Quel jour de la semaine ?\n1=Lundi, 2=Mardi, 3=Mercredi, 4=Jeudi, 5=Vendredi, 6=Samedi, 7=Dimanche');
            if (day) {
                frequencyDetail = { day_of_week: parseInt(day) };
                nextOccurrence = calculateNextOccurrence('weekly', frequencyDetail);
            }
        } else if (freqChoice === '2') {
            frequency = 'biweekly';
            nextOccurrence = calculateNextOccurrence('biweekly', null);
        } else if (freqChoice === '3') {
            frequency = 'monthly';
            const day = prompt('Quel jour du mois ? (1-31)');
            if (day) {
                frequencyDetail = { day_of_month: parseInt(day) };
                nextOccurrence = calculateNextOccurrence('monthly', frequencyDetail);
            }
        }
    }
    
    const { error } = await supabase
        .from('todos')
        .insert({
            category: category,
            title: title,
            description: description || null,
            gite: gite,
            completed: false,
            is_recurrent: isRecurrentChoice,
            frequency: frequency,
            frequency_detail: frequencyDetail,
            next_occurrence: nextOccurrence
        });
    
    if (error) {
        console.error('Erreur création todo:', error);
        alert('Erreur lors de la création de la tâche');
        return;
    }
    
    await updateTodoList(category);
    await updateDashboardStats(); // Mettre à jour le compteur
}

function calculateNextOccurrence(frequency, frequencyDetail) {
    const now = new Date();
    const next = new Date(now);
    
    switch (frequency) {
        case 'weekly':
            const targetDay = frequencyDetail?.day_of_week || 1;
            const currentDay = next.getDay() || 7; // Dimanche = 0 -> 7
            const daysUntilTarget = (targetDay - currentDay + 7) % 7 || 7;
            next.setDate(next.getDate() + daysUntilTarget);
            break;
        case 'biweekly':
            next.setDate(next.getDate() + 14);
            break;
        case 'monthly':
            const dayOfMonth = frequencyDetail?.day_of_month || 1;
            next.setMonth(next.getMonth() + 1);
            next.setDate(dayOfMonth);
            break;
    }
    
    return next.toISOString();
}

async function toggleTodo(id, completed) {
    // Récupérer la tâche pour vérifier si elle est récurrente
    const { data: todo, error: fetchError } = await supabase
        .from('todos')
        .select('*')
        .eq('id', id)
        .single();
    
    if (fetchError || !todo) {
        console.error('Erreur récupération todo:', fetchError);
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
            console.error('Erreur création nouvelle occurrence:', insertError);
        }
        
        // Archiver l'ancienne
        await supabase
            .from('todos')
            .update({ 
                completed: true, 
                archived_at: new Date().toISOString(),
                last_generated: new Date().toISOString()
            })
            .eq('id', id);
    } else {
        // Si coché (non récurrente), archiver la tâche
        // Si décoché, restaurer
        const updateData = completed ? 
            { completed: true, archived_at: new Date().toISOString() } : 
            { completed: false, archived_at: null };
        
        await supabase
            .from('todos')
            .update(updateData)
            .eq('id', id);
    }
    
    const { error } = await supabase
        .from('todos')
        .update(updateData)
        .eq('id', id);
    
    if (error) {
        console.error('Erreur mise à jour todo:', error);
        return;
    }
    
    // Recharger la liste correspondante
    const todo = await supabase.from('todos').select('category').eq('id', id).single();
    if (todo.data) {
        await updateTodoList(todo.data.category);
    }
    await updateDashboardStats(); // Mettre à jour le compteur
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

// Helper pour ouvrir l'édition d'une réservation
function openEditReservation(id) {
    window.openEditModal(id);
}

// Helper pour ouvrir la fiche client
function openFicheClient(id) {
    window.openClientSheet(id);
}

// ==========================================
// 🔄 RAFRAÎCHISSEMENT COMPLET
// ==========================================

async function refreshDashboard() {
    updateDashboardHeader();
    await updateDashboardAlerts();
    await updateDashboardStats();
    await updateDashboardReservations();
    await updateDashboardMenages();
    await updateTodoLists();
}
