/**
 * 📊 MODULE DASHBOARD - Tableau de bord principal
 * Vue d'ensemble hebdomadaire : réservations, ménages, todos
 */

// ==========================================
// 📅 INFORMATIONS SEMAINE
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
    
    document.getElementById('dashboard-date').textContent = formatDate(today);
    document.getElementById('dashboard-week-number').textContent = `Semaine ${weekNumber}`;
    document.getElementById('dashboard-week-info').textContent = 
        `Du ${formatDate(weekStart)} au ${formatDate(weekEnd)}`;
}

// ==========================================
// 🔔 ALERTES & NOTIFICATIONS
// ==========================================

async function updateDashboardAlerts() {
    const alerts = [];
    
    // Vérifier les paiements en attente
    const reservations = await getAllReservations();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const unpaidReservations = reservations.filter(r => {
        const arrival = parseLocalDate(r.dateDebut);
        const daysUntilArrival = Math.ceil((arrival - today) / (1000 * 60 * 60 * 24));
        return r.paiement !== 'Soldé' && daysUntilArrival <= 7 && daysUntilArrival >= 0;
    });
    
    if (unpaidReservations.length > 0) {
        alerts.push({
            type: 'warning',
            icon: '💰',
            message: `${unpaidReservations.length} paiement(s) en attente pour arrivées cette semaine`,
            action: () => switchTab('reservations')
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
        
        html += `
            <div style="border-left: 4px solid ${giteColor}; padding: 15px; margin-bottom: 10px; background: #f8f9fa; border-radius: 8px;">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
                    <div>
                        <strong style="font-size: 1.1rem; color: ${giteColor};">${r.nom}</strong>
                        <div style="color: #666; font-size: 0.9rem; margin-top: 4px;">
                            <span style="background: ${badgeColor}; color: white; padding: 2px 8px; border-radius: 4px; font-size: 0.8rem; margin-right: 8px;">${badge}</span>
                            ${formatDate(arrival)} → ${formatDate(departure)} (${r.nuits} nuits)
                        </div>
                    </div>
                    <span style="font-size: 1.5rem;" title="${r.paiement}">${paiementIcon}</span>
                </div>
                <div style="display: flex; gap: 15px; font-size: 0.9rem; color: #666;">
                    <span>🏠 ${r.gite}</span>
                    <span>💰 ${r.montant.toFixed(0)} €</span>
                    <span>👥 ${r.nb_personnes || '-'} pers.</span>
                </div>
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
                        📅 ${formatDate(new Date(c.scheduled_date))} ${timeIcon}
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
        
        html += `
            <div style="display: flex; gap: 10px; padding: 10px 0; border-bottom: 1px solid #eee; align-items: start;">
                <input type="checkbox" ${checked} onchange="toggleTodo(${todo.id}, this.checked)" 
                       style="width: 18px; height: 18px; cursor: pointer; margin-top: 2px;">
                <div style="flex: 1; ${textStyle}">
                    <div style="font-weight: 500;">${todo.title}</div>
                    ${todo.description ? `<div style="font-size: 0.85rem; color: #666; margin-top: 4px;">${todo.description}</div>` : ''}
                    ${todo.gite ? `<span style="background: ${todo.gite === 'Trévoux' ? '#667eea' : '#f093fb'}; color: white; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; display: inline-block; margin-top: 4px;">${todo.gite}</span>` : ''}
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
    
    const { error } = await supabase
        .from('todos')
        .insert({
            category: category,
            title: title,
            description: description || null,
            gite: gite,
            completed: false
        });
    
    if (error) {
        console.error('Erreur création todo:', error);
        alert('Erreur lors de la création de la tâche');
        return;
    }
    
    await updateTodoList(category);
    await updateDashboardStats(); // Mettre à jour le compteur
}

async function toggleTodo(id, completed) {
    // Si coché, archiver la tâche au lieu de simplement marquer comme complétée
    const updateData = completed ? 
        { completed: true, archived_at: new Date().toISOString() } : 
        { completed: false, archived_at: null };
    
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
