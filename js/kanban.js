/**
 * ================================================================
 * KANBAN MANAGER - Gestion visuelle des tâches
 * ================================================================
 * Synchronisé avec le Dashboard
 * Catégories: reservations, achats, travaux
 * Statuts: todo, in_progress, done
 * ================================================================
 */

// État global du Kanban
const KanbanState = {
    currentFilter: 'all',
    todos: [],
    gites: {},
    draggedTaskId: null,
    draggedSourceStatus: null,
    cardOrderByStatus: {
        todo: [],
        in_progress: [],
        done: []
    }
};

const KANBAN_ORDER_STORAGE_KEY = 'kanban_cards_order_v1';

/**
 * Initialiser le Kanban au chargement de l'onglet
 */
async function initKanban() {
    console.log('🎯 Initialisation du Kanban');
    loadCardOrderFromStorage();
    await loadKanbanData();
    renderKanban();
}

/**
 * Charger toutes les données nécessaires
 */
async function loadKanbanData() {
    try {
        // Charger les tâches
        const { data: todos, error } = await window.supabaseClient
            .from('todos')
            .select('*')
            .order('created_at', { ascending: true });
        
        if (error) throw error;
        
        KanbanState.todos = todos || [];
        
        // Charger les gîtes pour afficher les noms
        const giteIds = [...new Set(todos.filter(t => t.gite_id).map(t => t.gite_id))];
        
        if (giteIds.length > 0) {
            const { data: gites } = await window.supabaseClient
                .from('gites')
                .select('id, name')
                .in('id', giteIds);
            
            if (gites) {
                KanbanState.gites = Object.fromEntries(gites.map(g => [g.id, g.name]));
            }
        }
        
        console.log(`✅ ${KanbanState.todos.length} tâches chargées`);
    } catch (error) {
        console.error('❌ Erreur chargement Kanban:', error);
    }
}

/**
 * Rafraîchir le Kanban
 */
async function refreshKanban() {
    console.log('🔄 Rafraîchissement du Kanban');
    await loadKanbanData();
    renderKanban();
}

/**
 * Filtrer les tâches par catégorie
 */
function filterKanban(category) {
    KanbanState.currentFilter = category;
    
    // Mettre à jour les boutons de filtre
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.category === category) {
            btn.classList.add('active');
        }
    });
    
    renderKanban();
}

/**
 * Filtrer les todos selon le filtre actif
 */
function getFilteredTodos() {
    if (KanbanState.currentFilter === 'all') {
        return KanbanState.todos;
    }
    return KanbanState.todos.filter(t => t.category === KanbanState.currentFilter);
}

/**
 * Rendre le Kanban complet
 */
function renderKanban() {
    const filteredTodos = getFilteredTodos();

    const todoItems = filteredTodos.filter(t => !t.completed && (t.status === 'todo' || !t.status));
    const inProgressItems = filteredTodos.filter(t => !t.completed && t.status === 'in_progress');
    const doneItems = filteredTodos.filter(t => t.completed || t.status === 'done');
    
    // Grouper par statut
    const todosByStatus = {
        todo: sortTodosByStoredOrder('todo', todoItems),
        in_progress: sortTodosByStoredOrder('in_progress', inProgressItems),
        done: sortTodosByStoredOrder('done', doneItems)
    };
    
    // Rendre chaque colonne
    renderColumn('todo', todosByStatus.todo);
    renderColumn('in_progress', todosByStatus.in_progress);
    renderColumn('done', todosByStatus.done);
    
    // Mettre à jour les compteurs
    updateColumnCounts(todosByStatus);

    // Initialiser le drag & drop
    setupKanbanDragAndDrop();
    
    // Recharger les icônes Lucide
    if (window.lucide) {
        window.lucide.createIcons();
    }
}

/**
 * Rendre une colonne spécifique
 */
function renderColumn(status, todos) {
    const column = document.getElementById(`column-${status}`);
    if (!column) return;
    
    if (todos.length === 0) {
        column.innerHTML = '<div class="kanban-empty">Aucune tâche</div>';
        return;
    }
    
    let html = '';
    
    todos.forEach(todo => {
        const giteName = todo.gite_id ? (KanbanState.gites[todo.gite_id] || '') : '';
        const categoryIcons = {
            reservations: 'calendar',
            achats: 'shopping-cart',
            travaux: 'wrench'
        };
        const categoryLabels = {
            reservations: 'Réservation',
            achats: 'Achats',
            travaux: 'Travaux'
        };
        
        html += `
            <div class="kanban-card" data-id="${todo.id}" data-status="${status}" data-category="${todo.category}" draggable="true">
                <p class="card-title-line"><strong class="label-bold-underline">Titre :</strong> ${window.SecurityUtils ? window.SecurityUtils.sanitizeText(todo.title) : todo.title}</p>
                ${todo.description ? `<p><strong class="label-bold-underline">Descriptif :</strong> ${window.SecurityUtils ? window.SecurityUtils.sanitizeText(todo.description) : todo.description}</p>` : ''}
                <p><strong class="label-bold-underline">Récurrent :</strong> ${todo.is_recurrent ? 'Oui' : 'Non'}</p>
                ${getActionButtons(todo, status)}
            </div>
        `;
    });
    
    column.innerHTML = html;
}

/**
 * Initialiser les listeners Drag & Drop
 */
function setupKanbanDragAndDrop() {
    const cards = document.querySelectorAll('.kanban-card[draggable="true"]');
    const columns = document.querySelectorAll('.kanban-column-content');

    cards.forEach(card => {
        card.addEventListener('dragstart', onCardDragStart);
        card.addEventListener('dragend', onCardDragEnd);
    });

    columns.forEach(column => {
        column.addEventListener('dragover', onColumnDragOver);
        column.addEventListener('dragleave', onColumnDragLeave);
        column.addEventListener('drop', onColumnDrop);
    });
}

function onCardDragStart(event) {
    const card = event.currentTarget;
    const taskId = card.dataset.id;
    const sourceStatus = card.dataset.status;

    if (!taskId) return;

    KanbanState.draggedTaskId = taskId;
    KanbanState.draggedSourceStatus = sourceStatus || null;
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', JSON.stringify({ taskId, sourceStatus }));

    card.classList.add('is-dragging');
}

function onCardDragEnd(event) {
    event.currentTarget.classList.remove('is-dragging');
    document.querySelectorAll('.kanban-column-content').forEach(col => col.classList.remove('is-drop-target'));
    KanbanState.draggedTaskId = null;
    KanbanState.draggedSourceStatus = null;
}

function onColumnDragOver(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    const column = event.currentTarget;
    column.classList.add('is-drop-target');

    const draggingCard = document.querySelector('.kanban-card.is-dragging');
    if (!draggingCard) return;

    const afterElement = getDragAfterElement(column, event.clientY);
    if (!afterElement) {
        column.appendChild(draggingCard);
    } else {
        column.insertBefore(draggingCard, afterElement);
    }
}

function onColumnDragLeave(event) {
    const column = event.currentTarget;
    if (!column.contains(event.relatedTarget)) {
        column.classList.remove('is-drop-target');
    }
}

async function onColumnDrop(event) {
    event.preventDefault();

    const column = event.currentTarget;
    column.classList.remove('is-drop-target');

    let payload = null;
    try {
        payload = JSON.parse(event.dataTransfer.getData('text/plain'));
    } catch (error) {
        console.warn('⚠️ Payload drag&drop invalide');
    }

    const taskId = payload?.taskId || KanbanState.draggedTaskId;
    const sourceStatus = payload?.sourceStatus || KanbanState.draggedSourceStatus;
    const targetStatus = column.closest('.kanban-column')?.dataset?.status;

    if (!taskId || !targetStatus) return;
    if (sourceStatus === targetStatus) {
        persistOrderForColumn(targetStatus);
        return;
    }

    persistOrderForColumn(sourceStatus);
    persistOrderForColumn(targetStatus);
    await updateTaskStatus(taskId, targetStatus);
}

function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.kanban-card:not(.is-dragging)')];

    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;

        if (offset < 0 && offset > closest.offset) {
            return { offset, element: child };
        }

        return closest;
    }, { offset: Number.NEGATIVE_INFINITY, element: null }).element;
}

function loadCardOrderFromStorage() {
    try {
        const rawValue = localStorage.getItem(KANBAN_ORDER_STORAGE_KEY);
        if (!rawValue) return;

        const parsed = JSON.parse(rawValue);
        KanbanState.cardOrderByStatus = {
            todo: Array.isArray(parsed?.todo) ? parsed.todo : [],
            in_progress: Array.isArray(parsed?.in_progress) ? parsed.in_progress : [],
            done: Array.isArray(parsed?.done) ? parsed.done : []
        };
    } catch (error) {
        console.warn('⚠️ Impossible de charger l\'ordre Kanban sauvegardé', error);
    }
}

function saveCardOrderToStorage() {
    try {
        localStorage.setItem(KANBAN_ORDER_STORAGE_KEY, JSON.stringify(KanbanState.cardOrderByStatus));
    } catch (error) {
        console.warn('⚠️ Impossible de sauvegarder l\'ordre Kanban', error);
    }
}

function persistOrderForColumn(status) {
    if (!status) return;
    const column = document.getElementById(`column-${status}`);
    if (!column) return;

    const orderedIds = [...column.querySelectorAll('.kanban-card[data-id]')].map(card => card.dataset.id).filter(Boolean);
    KanbanState.cardOrderByStatus[status] = orderedIds;
    saveCardOrderToStorage();
}

function sortTodosByStoredOrder(status, todos) {
    const order = KanbanState.cardOrderByStatus[status] || [];
    const orderMap = new Map(order.map((id, index) => [id, index]));

    return [...todos].sort((a, b) => {
        const indexA = orderMap.has(a.id) ? orderMap.get(a.id) : Number.MAX_SAFE_INTEGER;
        const indexB = orderMap.has(b.id) ? orderMap.get(b.id) : Number.MAX_SAFE_INTEGER;

        if (indexA !== indexB) {
            return indexA - indexB;
        }

        return new Date(a.created_at || 0) - new Date(b.created_at || 0);
    });
}

/**
 * Obtenir les boutons d'action selon le statut
 */
function getActionButtons(todo, status) {
    let buttons = '';
    const buttonThemeByCategory = {
        reservations: { background: '#6f95d8', border: '#5c80c2', text: '#ffffff' },
        achats: { background: '#e0b646', border: '#cda238', text: '#1a1a1a' },
        travaux: { background: '#dc6a6a', border: '#c45858', text: '#ffffff' }
    };
    const defaultTheme = { background: '#7f8c8d', border: '#6c7a7b', text: '#ffffff' };
    const currentTheme = buttonThemeByCategory[todo.category] || defaultTheme;
    const inlineButtonStyle = `style="background:${currentTheme.background};border:1px solid ${currentTheme.border};color:${currentTheme.text};"`;
    
    switch (status) {
        case 'todo':
            buttons = `
                <button class="kanban-card-btn btn-start" ${inlineButtonStyle} onclick="window.updateTaskStatus('${todo.id}', 'in_progress')">
                    <i data-lucide="play"></i> Démarrer
                </button>
            `;
            break;
            
        case 'in_progress':
            buttons = `
                <button class="kanban-card-btn btn-complete" ${inlineButtonStyle} onclick="window.updateTaskStatus('${todo.id}', 'done')">
                    <i data-lucide="check"></i> Terminer
                </button>
                <button class="kanban-card-btn btn-back" ${inlineButtonStyle} onclick="window.updateTaskStatus('${todo.id}', 'todo')">
                    <i data-lucide="arrow-left"></i>
                </button>
            `;
            break;
            
        case 'done':
            buttons = `
                <button class="kanban-card-btn btn-back" ${inlineButtonStyle} onclick="window.updateTaskStatus('${todo.id}', 'in_progress')">
                    <i data-lucide="rotate-ccw"></i> Réactiver
                </button>
                <button class="kanban-card-btn btn-delete" ${inlineButtonStyle} onclick="window.deleteTask('${todo.id}')">
                    <i data-lucide="trash-2"></i> Supprimer
                </button>
            `;
            break;
    }
    
    return buttons;
}

/**
 * Mettre à jour les compteurs de colonnes
 */
function updateColumnCounts(todosByStatus) {
    Object.keys(todosByStatus).forEach(status => {
        const countEl = document.getElementById(`count-${status}`);
        if (countEl) {
            countEl.textContent = todosByStatus[status].length;
        }
    });
}

/**
 * Mettre à jour le statut d'une tâche
 * ⚡ SYNCHRONISATION Dashboard ↔ Kanban
 */
async function updateTaskStatus(taskId, newStatus) {
    try {
        console.log(`🔄 Mise à jour tâche ${taskId} vers ${newStatus}`);
        
        const updateData = {
            status: newStatus,
            updated_at: new Date().toISOString()
        };
        
        // Si on passe en "done", marquer comme completed
        if (newStatus === 'done') {
            updateData.completed = true;
            updateData.completed_at = new Date().toISOString();
        } else {
            updateData.completed = false;
            updateData.completed_at = null;
        }
        
        const { error } = await window.supabaseClient
            .from('todos')
            .update(updateData)
            .eq('id', taskId);
        
        if (error) throw error;
        
        console.log('✅ Statut mis à jour');
        
        // Rafraîchir le Kanban
        await refreshKanban();
        
        // 🔥 SYNCHRONISATION: Rafraîchir aussi le Dashboard si visible
        if (typeof updateTodoLists === 'function') {
            await updateTodoLists();
        }
        
    } catch (error) {
        console.error('❌ Erreur mise à jour statut:', error);
        alert('Erreur lors de la mise à jour de la tâche');
    }
}

/**
 * Marquer une tâche comme terminée (appelé depuis le Dashboard)
 * ⚡ FONCTION EXPORTÉE pour synchronisation
 */
window.toggleTodo = async function(todoId, isCompleted) {
    try {
        const newStatus = isCompleted ? 'done' : 'in_progress';
        
        const updateData = {
            completed: isCompleted,
            status: newStatus,
            updated_at: new Date().toISOString()
        };
        
        if (isCompleted) {
            updateData.completed_at = new Date().toISOString();
        } else {
            updateData.completed_at = null;
        }
        
        const { error } = await window.supabaseClient
            .from('todos')
            .update(updateData)
            .eq('id', todoId);
        
        if (error) throw error;
        
        // Rafraîchir le Dashboard
        if (typeof updateTodoLists === 'function') {
            await updateTodoLists();
        }
        
        // Rafraîchir le Kanban si l'onglet est actif
        const kanbanTab = document.querySelector('[data-tab="kanban"]');
        if (kanbanTab && kanbanTab.classList.contains('active')) {
            await refreshKanban();
        }
        
    } catch (error) {
        console.error('❌ Erreur toggle todo:', error);
    }
};

/**
 * Supprimer une tâche définitivement
 */
async function deleteTask(taskId) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette tâche définitivement ?')) {
        return;
    }
    
    try {
        console.log(`🗑️ Suppression tâche ${taskId}`);
        
        const { error } = await window.supabaseClient
            .from('todos')
            .delete()
            .eq('id', taskId);
        
        if (error) throw error;
        
        console.log('✅ Tâche supprimée');
        
        // Rafraîchir le Kanban
        await refreshKanban();
        
        // Rafraîchir le Dashboard
        if (typeof updateTodoLists === 'function') {
            await updateTodoLists();
        }
        
    } catch (error) {
        console.error('❌ Erreur suppression tâche:', error);
        alert('Erreur lors de la suppression de la tâche');
    }
}

/**
 * Éditer une tâche (ouvre le modal du dashboard)
 */
window.editTodo = async function(todoId) {
    // Réutiliser la fonction du dashboard si elle existe
    if (typeof viewTodoDetails === 'function') {
        await viewTodoDetails(todoId);
    }
};

/**
 * Supprimer une tâche (appelé depuis le dashboard)
 */
window.deleteTodo = async function(todoId) {
    await deleteTask(todoId);
};

/**
 * Formater une date au format DD/MM/YYYY
 */
function formatDateDMY(date) {
    if (!date) return '';
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
}

/**
 * Exporter les fonctions globales
 */
window.initKanban = initKanban;
window.refreshKanban = refreshKanban;
window.filterKanban = filterKanban;
window.updateTaskStatus = updateTaskStatus;
window.deleteTask = deleteTask;

/**
 * Afficher/masquer le menu de création rapide
 */
function showAddTaskMenu() {
    const menu = document.getElementById('quickAddMenu');
    if (!menu) return;
    
    if (menu.style.display === 'none' || menu.style.display === '') {
        menu.style.display = 'block';
        // Recharger les icônes Lucide
        if (window.lucide) {
            window.lucide.createIcons();
        }
    } else {
        menu.style.display = 'none';
    }
}

/**
 * Créer une nouvelle tâche depuis le Kanban
 * Réutilise la fonction du Dashboard
 */
async function addKanbanTask(category) {
    // Vérifier si la fonction du Dashboard existe
    if (typeof window.addTodoItem === 'function') {
        // Appeler la fonction du Dashboard avec status='todo' pour Kanban
        await window.addTodoItem(category, 'todo');
        
        // Masquer le menu
        const menu = document.getElementById('quickAddMenu');
        if (menu) {
            menu.style.display = 'none';
        }
        
        // Rafraîchir le Kanban après création
        // (le rafraîchissement se fera automatiquement quand le modal sera fermé)
    } else {
        console.error('❌ Fonction addTodoItem non disponible');
        alert('Impossible de créer une tâche. Veuillez réessayer depuis le Dashboard.');
    }
}

window.showAddTaskMenu = showAddTaskMenu;
window.addKanbanTask = addKanbanTask;

console.log('✅ Module Kanban chargé');
