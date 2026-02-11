// ==========================================
// 📦 MODULE GESTION DES ARCHIVES
// ==========================================
// Affichage des réservations passées

async function updateArchivesDisplay() {
    // console.log('🔄 updateArchivesDisplay() - Début');
    
    try {
        const reservations = await getAllReservations();
        // console.log('📦 Réservations chargées:', reservations.length);
        
        const section = document.getElementById('archivesSection');
        if (!section) {
            console.error('❌ Section archivesSection introuvable');
            return;
        }
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const archives = reservations.filter(r => parseLocalDate(r.dateFin) < today);
        archives.sort((a, b) => parseLocalDate(b.dateFin) - parseLocalDate(a.dateFin));
        
        // console.log('📁 Archives trouvées:', archives.length);
        
        if (archives.length === 0) {
            section.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 40px;">Aucune archive</p>';
            return;
        }
        
        let html = '<div class="gite-section">';
        
        archives.forEach((r, index) => {
            // console.log(`📄 Archive ${index + 1}:`, r.nom, r.id);
            const badgeClass = getPlatformBadgeClass(r.site);
            html += `
                <div class="reservation-item ${r.gite.toLowerCase()}">
                    <div class="reservation-header">
                        <span class="reservation-name">${r.nom} - ${r.gite}</span>
                        <span class="badge-platform ${badgeClass}">
                            ${r.site}
                        </span>
                    </div>
                    <div style="margin-top: 8px; font-size: 0.9rem; color: var(--text-secondary);">
                        📅 ${formatDate(r.dateDebut)} → ${formatDate(r.dateFin)} (${r.nuits} nuits)
                    </div>
                    <div style="margin-top: 8px; font-size: 0.9rem; display: flex; justify-content: space-between; align-items: center;">
                        <span>💰 ${r.montant ? r.montant.toFixed(2) : '0.00'} € | Statut: ${r.paiement}</span>
                        <button onclick="openEditModal('${r.id}')" style="background: #e3f2fd; border: none; border-radius: 6px; padding: 6px 12px; cursor: pointer; font-size: 0.9rem;" title="Modifier">✏️ Modifier</button>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        
        // console.log('✅ HTML généré, longueur:', html.length);
        // console.log('🔍 Vérification présence "Modifier" dans HTML:', html.includes('Modifier'));
        
        // ⚠️ IMPORTANT : Utiliser innerHTML direct au lieu de SecurityUtils.setInnerHTML
        // SecurityUtils supprime les attributs onclick, ce qui empêche les boutons de fonctionner
        section.innerHTML = html;
        
        // console.log('✅ HTML injecté dans le DOM');
        
        // Vérifier que les boutons sont bien dans le DOM
        const buttons = section.querySelectorAll('button');
        // console.log('🔘 Nombre de boutons trouvés dans le DOM:', buttons.length);
        
    } catch (error) {
        console.error('❌ Erreur dans updateArchivesDisplay:', error);
    }
}

// ==========================================
// ✅ AFFICHAGE DES TODOS ARCHIVÉS
// ==========================================

async function updateArchivedTodos() {
    const { data: todos } = await supabase
        .from('todos')
        .select('id, title, description, category, completed, archived_at, gite_id, created_at, owner_user_id')
        .not('archived_at', 'is', null)
        .order('archived_at', { ascending: false });
    
    const section = document.getElementById('archivedTodosSection');
    
    if (!todos || todos.length === 0) {
        window.SecurityUtils.setInnerHTML(section, '<p style="text-align: center; color: var(--text-secondary); padding: 40px;">Aucune tâche archivée</p>');
        return;
    }
    
    // Grouper par catégorie
    const byCategory = {
        'reservations': { label: '📋 Actions Réservations', color: '#667eea', items: [] },
        'travaux': { label: '🔧 Travaux & Maintenance', color: '#F39C12', items: [] },
        'achats': { label: '🛒 Achats & Courses', color: '#27AE60', items: [] }
    };
    
    todos.forEach(todo => {
        if (byCategory[todo.category]) {
            byCategory[todo.category].items.push(todo);
        }
    });
    
    let html = '';
    
    Object.entries(byCategory).forEach(([category, group]) => {
        if (group.items.length === 0) return;
        
        html += `
            <div style="margin-bottom: 30px;">
                <h4 style="color: ${group.color}; margin-bottom: 15px; display: flex; align-items: center; gap: 8px;">
                    ${group.label}
                    <span style="background: ${group.color}; color: white; padding: 2px 10px; border-radius: 12px; font-size: 0.8rem;">${group.items.length}</span>
                </h4>
        `;
        
        group.items.forEach(todo => {
            const archivedDate = new Date(todo.archived_at);
            html += `
                <div style="border-left: 4px solid ${group.color}; padding: 15px; margin-bottom: 10px; background: #f8f9fa; border-radius: 8px; opacity: 0.8;">
                    <div style="display: flex; justify-content: between; align-items: start; gap: 15px;">
                        <div style="flex: 1;">
                            <div style="font-weight: 600; text-decoration: line-through; color: var(--text-secondary);">${todo.title}</div>
                            ${todo.description ? `<div style="font-size: 0.85rem; color: #888; margin-top: 4px;">${todo.description}</div>` : ''}
                            ${todo.gite_id ? `<span class="gite-badge" data-gite="${todo.gite_id}" style="background: var(--gite-color, #667eea); color: white; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; display: inline-block; margin-top: 6px;">${todo.gite_id}</span>` : ''}
                            <div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 8px;">
                                ✅ Terminé le ${formatDate(archivedDate)}
                            </div>
                        </div>
                        <button onclick="restoreTodo(${todo.id})" 
                                style="background: #3498DB; border: none; color: white; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 0.85rem; white-space: nowrap;"
                                title="Restaurer">
                            ↶ Restaurer
                        </button>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
    });
    
    window.SecurityUtils.setInnerHTML(section, html);
}

async function restoreTodo(id) {
    const { error } = await supabase
        .from('todos')
        .update({ completed: false, archived_at: null })
        .eq('id', id);
    
    if (error) {
        console.error('Erreur restauration todo:', error);
        alert('Erreur lors de la restauration');
        return;
    }
    
    await updateArchivedTodos();
}

async function clearArchivedTodos() {
    if (!confirm('Supprimer définitivement toutes les tâches archivées ?\n\nCette action est irréversible.')) {
        return;
    }
    
    const { error } = await supabase
        .from('todos')
        .delete()
        .not('archived_at', 'is', null);
    
    if (error) {
        console.error('Erreur suppression todos archivés:', error);
        alert('Erreur lors de la suppression');
        return;
    }
    
    await updateArchivedTodos();
}

function getPlatformBadgeClass(platform) {
    const normalized = platform.toLowerCase();
    if (normalized.includes('airbnb')) return 'airbnb';
    if (normalized.includes('abritel')) return 'abritel';
    if (normalized.includes('gîtes') || normalized.includes('gites')) return 'gites';
    return 'autre';
}

// ==========================================
// 🌐 EXPORTS GLOBAUX
// ==========================================

window.updateArchivesDisplay = updateArchivesDisplay;
window.getPlatformBadgeClass = getPlatformBadgeClass;
