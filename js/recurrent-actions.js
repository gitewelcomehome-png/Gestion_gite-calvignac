// ==========================================
// 📋 GESTION DES ACTIONS RÉCURRENTES
// ==========================================

async function loadRecurrentActions() {
    const { data, error } = await supabase
        .from('recurrent_actions')
        .select('*')
        .eq('is_active', true)
        .order('next_occurrence', { ascending: true });
    
    if (error) {
        console.error('Erreur chargement actions récurrentes:', error);
        return;
    }
    
    displayRecurrentActions(data || []);
}

function displayRecurrentActions(actions) {
    const container = document.getElementById('recurrentActionsContainer');
    if (!container) return;
    
    if (actions.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #999; padding: 20px;">Aucune action récurrente configurée</p>';
        return;
    }
    
    const frequencyLabels = {
        'daily': 'Quotidien',
        'weekly': 'Hebdomadaire',
        'monthly': 'Mensuel',
        'yearly': 'Annuel'
    };
    
    const categoryIcons = {
        'menage': '🧹',
        'entretien': '🔧',
        'administratif': '📄',
        'achats': '🛒',
        'reservations': '📅'
    };
    
    let html = '';
    actions.forEach(action => {
        const icon = categoryIcons[action.category] || '📌';
        const frequencyLabel = frequencyLabels[action.frequency] || action.frequency;
        const nextDate = formatDateFromObj(new Date(action.next_occurrence));
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const nextOccurrence = new Date(action.next_occurrence);
        nextOccurrence.setHours(0, 0, 0, 0);
        const isToday = nextOccurrence.getTime() === today.getTime();
        const isPast = nextOccurrence < today;
        
        let statusBadge = '';
        if (isToday) {
            statusBadge = '<span style="background: #F39C12; color: white; padding: 4px 8px; border-radius: 4px; font-size: 0.75rem; margin-left: 8px;">Aujourd\'hui</span>';
        } else if (isPast) {
            statusBadge = '<span style="background: #E74C3C; color: white; padding: 4px 8px; border-radius: 4px; font-size: 0.75rem; margin-left: 8px;">En retard</span>';
        }
        
        html += `
            <div style="border: 1px solid #ddd; padding: 16px; margin-bottom: 12px; border-radius: 8px; background: ${isPast ? '#FFF5F5' : '#f8f9fa'};">
                <div style="display: flex; justify-content: space-between; align-items: start;">
                    <div style="flex: 1;">
                        <div style="display: flex; align-items: center; margin-bottom: 8px;">
                            <span style="font-size: 1.5rem; margin-right: 8px;">${icon}</span>
                            <strong>${action.title}</strong>
                            ${statusBadge}
                        </div>
                        ${action.description ? `<p style="color: #666; font-size: 0.9rem; margin: 4px 0;">${action.description}</p>` : ''}
                        <div style="display: flex; gap: 16px; margin-top: 8px; font-size: 0.85rem; color: #666;">
                            <span>🔁 ${frequencyLabel}</span>
                            <span>📅 Prochain: ${nextDate}</span>
                            ${action.gite ? `<span style="color: #667eea;">🏠 ${action.gite}</span>` : '<span>🏠 Tous les gîtes</span>'}
                        </div>
                    </div>
                    <div style="display: flex; gap: 8px;">
                        <button onclick="generateTodoFromRecurrent(${action.id})" 
                            class="btn" 
                            style="background: #27AE60; color: white; padding: 8px 12px; border: none; border-radius: 6px; cursor: pointer; font-size: 0.85rem;"
                            title="Générer une tâche maintenant">
                            ✅ Générer
                        </button>
                        <button onclick="editRecurrentAction(${action.id})" 
                            class="btn" 
                            style="background: #3498DB; color: white; padding: 8px 12px; border: none; border-radius: 6px; cursor: pointer; font-size: 0.85rem;">
                            ✏️
                        </button>
                        <button onclick="deleteRecurrentAction(${action.id})" 
                            class="btn" 
                            style="background: #E74C3C; color: white; padding: 8px 12px; border: none; border-radius: 6px; cursor: pointer; font-size: 0.85rem;">
                            🗑️
                        </button>
                    </div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

async function generateTodoFromRecurrent(recurrentId) {
    const { data: action, error: fetchError } = await supabase
        .from('recurrent_actions')
        .select('*')
        .eq('id', recurrentId)
        .single();
    
    if (fetchError || !action) {
        console.error('Erreur récupération action:', fetchError);
        return;
    }
    
    // Créer une todo basée sur l'action récurrente
    const { error: insertError } = await supabase
        .from('todos')
        .insert({
            category: action.category,
            title: action.title,
            description: action.description,
            gite: action.gite,
            completed: false,
            archived_at: null
        });
    
    if (insertError) {
        console.error('Erreur création todo:', insertError);
        return;
    }
    
    // Calculer la prochaine occurrence
    const nextOccurrence = calculateNextOccurrence(action.frequency, action.frequency_detail);
    
    // Mettre à jour l'action récurrente
    const { error: updateError } = await supabase
        .from('recurrent_actions')
        .update({
            last_generated: new Date().toISOString(),
            next_occurrence: nextOccurrence
        })
        .eq('id', recurrentId);
    
    if (updateError) {
        console.error('Erreur mise à jour action récurrente:', updateError);
    }
    
    alert('✅ Tâche générée avec succès !');
    loadRecurrentActions();
    
    // Rafraîchir le dashboard si on y est
    if (typeof refreshDashboard === 'function') {
        refreshDashboard();
    }
}

function calculateNextOccurrence(frequency, frequencyDetail) {
    const now = new Date();
    const next = new Date(now);
    
    switch (frequency) {
        case 'daily':
            next.setDate(next.getDate() + 1);
            break;
        case 'weekly':
            const dayOfWeek = frequencyDetail?.day_of_week || 1; // Lundi par défaut
            next.setDate(next.getDate() + 7);
            break;
        case 'monthly':
            const dayOfMonth = frequencyDetail?.day_of_month || 1;
            next.setMonth(next.getMonth() + 1);
            next.setDate(dayOfMonth);
            break;
        case 'yearly':
            next.setFullYear(next.getFullYear() + 1);
            break;
    }
    
    return next.toISOString();
}

async function addRecurrentAction() {
    const title = prompt('Titre de l\'action récurrente:');
    if (!title) return;
    
    const description = prompt('Description (optionnel):');
    
    const category = prompt('Catégorie (menage/entretien/administratif/achats/reservations):');
    if (!category) return;
    
    const gite = prompt('Gîte (Trévoux/Calvignac ou vide pour tous):') || null;
    
    const frequency = prompt('Fréquence (daily/weekly/monthly/yearly):');
    if (!frequency) return;
    
    let frequencyDetail = null;
    if (frequency === 'weekly') {
        const day = prompt('Jour de la semaine (1=Lundi, 7=Dimanche):');
        if (day) frequencyDetail = { day_of_week: parseInt(day) };
    } else if (frequency === 'monthly') {
        const day = prompt('Jour du mois (1-31):');
        if (day) frequencyDetail = { day_of_month: parseInt(day) };
    }
    
    const nextOccurrence = calculateNextOccurrence(frequency, frequencyDetail);
    
    const { error } = await supabase
        .from('recurrent_actions')
        .insert({
            title,
            description,
            category,
            gite,
            frequency,
            frequency_detail: frequencyDetail,
            next_occurrence: nextOccurrence,
            is_active: true
        });
    
    if (error) {
        console.error('Erreur création action récurrente:', error);
        alert('❌ Erreur lors de la création');
        return;
    }
    
    alert('✅ Action récurrente créée !');
    loadRecurrentActions();
}

async function editRecurrentAction(id) {
    alert('⚠️ Fonctionnalité d\'édition à venir');
    // TODO: Implémenter un formulaire d'édition
}

async function deleteRecurrentAction(id) {
    if (!confirm('Supprimer cette action récurrente ?')) return;
    
    const { error } = await supabase
        .from('recurrent_actions')
        .delete()
        .eq('id', id);
    
    if (error) {
        console.error('Erreur suppression:', error);
        return;
    }
    
    alert('✅ Action supprimée');
    loadRecurrentActions();
}

// Fonction à appeler périodiquement pour auto-générer les tâches
async function checkAndGenerateRecurrentTasks() {
    const { data: actions, error } = await supabase
        .from('recurrent_actions')
        .select('*')
        .eq('is_active', true)
        .lte('next_occurrence', new Date().toISOString());
    
    if (error || !actions || actions.length === 0) return;
    
    for (const action of actions) {
        await generateTodoFromRecurrent(action.id);
    }
}
