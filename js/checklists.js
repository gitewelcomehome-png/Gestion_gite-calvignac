/* ================================================
   CHECKLISTS.JS - Gestion des Check-lists
   ================================================ */

let currentGiteFilter = 'Trevoux';
let currentTypeFilter = 'entree';

// =============================================
// INITIALISATION
// =============================================

async function initChecklistsTab() {
    console.log('📋 Initialisation onglet Check-lists');
    
    // Listeners pour les filtres
    const giteSelect = document.getElementById('checklist-gite-select');
    const typeSelect = document.getElementById('checklist-type-select');
    
    if (giteSelect) {
        giteSelect.addEventListener('change', (e) => {
            currentGiteFilter = e.target.value;
            loadChecklistItems();
        });
    }
    
    if (typeSelect) {
        typeSelect.addEventListener('change', (e) => {
            currentTypeFilter = e.target.value;
            loadChecklistItems();
        });
    }
    
    // Chargement initial
    await loadChecklistItems();
    await loadReservationsProgress();
}

// =============================================
// CHARGEMENT DES ITEMS DE CHECKLIST
// =============================================

async function loadChecklistItems() {
    const container = document.getElementById('checklist-items-list');
    if (!container) return;
    
    try {
        container.innerHTML = '<p style="color: var(--gray-600); font-style: italic;">Chargement...</p>';
        
        const { data, error } = await supabaseClient
            .from('checklist_templates')
            .select('*')
            .eq('gite', currentGiteFilter)
            .eq('type', currentTypeFilter)
            .eq('actif', true)
            .order('ordre', { ascending: true });
        
        if (error) throw error;
        
        if (!data || data.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 20px; color: var(--gray-600);">
                    <p style="font-size: 3rem; margin-bottom: 10px;">📋</p>
                    <p>Aucun item pour <strong>${currentGiteFilter}</strong> - <strong>${currentTypeFilter === 'entree' ? 'Entrée' : 'Sortie'}</strong></p>
                </div>
            `;
            return;
        }
        
        // Affichage des items
        let html = '';
        data.forEach((item, index) => {
            html += `
                <div class="checklist-item" data-id="${item.id}">
                    <div style="flex: 1;">
                        <div style="font-weight: 600; margin-bottom: 5px;">
                            ${index + 1}. ${item.texte}
                        </div>
                        ${item.description ? `<div style="font-size: 0.9rem; color: var(--gray-600);">${item.description}</div>` : ''}
                    </div>
                    <div style="display: flex; gap: 8px;">
                        <button onclick="moveChecklistItem(${item.id}, 'up')" 
                                ${index === 0 ? 'disabled' : ''}
                                style="background: var(--gray-200); border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer; font-size: 1.2rem;" 
                                title="Monter">
                            ⬆️
                        </button>
                        <button onclick="moveChecklistItem(${item.id}, 'down')" 
                                ${index === data.length - 1 ? 'disabled' : ''}
                                style="background: var(--gray-200); border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer; font-size: 1.2rem;" 
                                title="Descendre">
                            ⬇️
                        </button>
                        <button onclick="deleteChecklistItem(${item.id})" 
                                style="background: #ef4444; color: white; border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer;" 
                                title="Supprimer">
                            🗑️
                        </button>
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
        
    } catch (error) {
        console.error('❌ Erreur chargement items:', error);
        container.innerHTML = `<p style="color: #ef4444;">Erreur: ${error.message}</p>`;
    }
}

// =============================================
// AJOUT D'UN ITEM
// =============================================

async function addChecklistItem() {
    const texteInput = document.getElementById('checklist-new-text');
    const descriptionInput = document.getElementById('checklist-new-description');
    
    if (!texteInput || !descriptionInput) return;
    
    const texte = texteInput.value.trim();
    if (!texte) {
        alert('⚠️ Veuillez saisir le texte de l\'item');
        return;
    }
    
    try {
        // Récupérer l'ordre maximum actuel
        const { data: maxData, error: maxError } = await supabaseClient
            .from('checklist_templates')
            .select('ordre')
            .eq('gite', currentGiteFilter)
            .eq('type', currentTypeFilter)
            .order('ordre', { ascending: false })
            .limit(1);
        
        if (maxError) throw maxError;
        
        const nextOrdre = (maxData && maxData.length > 0) ? maxData[0].ordre + 1 : 1;
        
        // Insertion
        const { error } = await supabaseClient
            .from('checklist_templates')
            .insert({
                gite: currentGiteFilter,
                type: currentTypeFilter,
                ordre: nextOrdre,
                texte: texte,
                description: descriptionInput.value.trim() || null,
                actif: true
            });
        
        if (error) throw error;
        
        // Rafraîchir la liste
        await loadChecklistItems();
        
        // Vider le formulaire
        texteInput.value = '';
        descriptionInput.value = '';
        
        showNotification('✅ Item ajouté avec succès', 'success');
        
    } catch (error) {
        console.error('❌ Erreur ajout item:', error);
        alert(`Erreur lors de l'ajout: ${error.message}`);
    }
}

// =============================================
// SUPPRESSION D'UN ITEM
// =============================================

async function deleteChecklistItem(itemId) {
    if (!confirm('❌ Supprimer cet item ?')) return;
    
    try {
        const { error } = await supabaseClient
            .from('checklist_templates')
            .update({ actif: false })
            .eq('id', itemId);
        
        if (error) throw error;
        
        await loadChecklistItems();
        showNotification('✅ Item supprimé', 'success');
        
    } catch (error) {
        console.error('❌ Erreur suppression:', error);
        alert(`Erreur: ${error.message}`);
    }
}

// =============================================
// DÉPLACEMENT D'UN ITEM
// =============================================

async function moveChecklistItem(itemId, direction) {
    try {
        // Récupérer tous les items
        const { data: items, error: fetchError } = await supabaseClient
            .from('checklist_templates')
            .select('*')
            .eq('gite', currentGiteFilter)
            .eq('type', currentTypeFilter)
            .eq('actif', true)
            .order('ordre', { ascending: true });
        
        if (fetchError) throw fetchError;
        
        // Trouver l'index de l'item à déplacer
        const currentIndex = items.findIndex(item => item.id === itemId);
        if (currentIndex === -1) return;
        
        const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
        
        // Vérifier les limites
        if (targetIndex < 0 || targetIndex >= items.length) return;
        
        // Échanger les ordres
        const updates = [
            { id: items[currentIndex].id, ordre: items[targetIndex].ordre },
            { id: items[targetIndex].id, ordre: items[currentIndex].ordre }
        ];
        
        for (const update of updates) {
            const { error } = await supabaseClient
                .from('checklist_templates')
                .update({ ordre: update.ordre })
                .eq('id', update.id);
            
            if (error) throw error;
        }
        
        await loadChecklistItems();
        
    } catch (error) {
        console.error('❌ Erreur déplacement:', error);
        alert(`Erreur: ${error.message}`);
    }
}

// =============================================
// EFFACER LE FORMULAIRE
// =============================================

function clearChecklistForm() {
    const texteInput = document.getElementById('checklist-new-text');
    const descriptionInput = document.getElementById('checklist-new-description');
    
    if (texteInput) texteInput.value = '';
    if (descriptionInput) descriptionInput.value = '';
}

// =============================================
// CHARGEMENT DES RÉSERVATIONS AVEC PROGRESSION
// =============================================

async function loadReservationsProgress() {
    const container = document.getElementById('checklist-reservations-container');
    if (!container) return;
    
    try {
        container.innerHTML = '<p style="color: var(--gray-600); font-style: italic;">Chargement des réservations...</p>';
        
        // Récupérer les réservations en cours
        const aujourdhui = new Date().toISOString().split('T')[0];
        
        const { data: reservations, error: resaError } = await supabaseClient
            .from('reservations')
            .select('*')
            .gte('date_fin', aujourdhui)
            .order('date_debut', { ascending: true })
            .limit(20);
        
        if (resaError) throw resaError;
        
        if (!reservations || reservations.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 20px; color: var(--gray-600);">
                    <p style="font-size: 3rem; margin-bottom: 10px;">📅</p>
                    <p>Aucune réservation en cours</p>
                </div>
            `;
            return;
        }
        
        // Pour chaque réservation, calculer la progression
        let html = '';
        
        for (const resa of reservations) {
            const progress = await getReservationChecklistProgress(resa.id, resa.gite);
            
            html += `
                <div class="card" style="margin-bottom: 15px; padding: 15px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                        <div>
                            <strong style="font-size: 1.1rem;">${resa.nom} ${resa.prenom}</strong>
                            <span style="color: var(--gray-600); margin-left: 10px;">${resa.gite}</span>
                        </div>
                        <div style="color: var(--gray-600); font-size: 0.9rem;">
                            ${formatDate(resa.date_debut)} → ${formatDate(resa.date_fin)}
                        </div>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                        <!-- Entrée -->
                        <div>
                            <div style="display: flex; align-items: center; margin-bottom: 5px;">
                                <span class="checklist-status-badge" style="background: ${getProgressColor(progress.entree.percent)};"></span>
                                <strong>🚪 Entrée</strong>
                                <span style="margin-left: auto; font-weight: 600;">${progress.entree.completed}/${progress.entree.total}</span>
                            </div>
                            <div class="checklist-progress-bar">
                                <div class="checklist-progress-fill" style="width: ${progress.entree.percent}%; background: ${getProgressColor(progress.entree.percent)};"></div>
                            </div>
                        </div>
                        
                        <!-- Sortie -->
                        <div>
                            <div style="display: flex; align-items: center; margin-bottom: 5px;">
                                <span class="checklist-status-badge" style="background: ${getProgressColor(progress.sortie.percent)};"></span>
                                <strong>🧳 Sortie</strong>
                                <span style="margin-left: auto; font-weight: 600;">${progress.sortie.completed}/${progress.sortie.total}</span>
                            </div>
                            <div class="checklist-progress-bar">
                                <div class="checklist-progress-fill" style="width: ${progress.sortie.percent}%; background: ${getProgressColor(progress.sortie.percent)};"></div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }
        
        container.innerHTML = html;
        
    } catch (error) {
        console.error('❌ Erreur chargement réservations:', error);
        container.innerHTML = `<p style="color: #ef4444;">Erreur: ${error.message}</p>`;
    }
}

// =============================================
// CALCUL DE LA PROGRESSION D'UNE RÉSERVATION
// =============================================

async function getReservationChecklistProgress(reservationId, gite) {
    try {
        // Récupérer les templates pour ce gîte
        const { data: templates, error: templatesError } = await supabaseClient
            .from('checklist_templates')
            .select('id, type')
            .eq('gite', gite)
            .eq('actif', true);
        
        if (templatesError) throw templatesError;
        
        const templatesEntree = templates.filter(t => t.type === 'entree');
        const templatesSortie = templates.filter(t => t.type === 'sortie');
        
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
        console.error('❌ Erreur calcul progression:', error);
        return {
            entree: { total: 0, completed: 0, percent: 0 },
            sortie: { total: 0, completed: 0, percent: 0 }
        };
    }
}

// =============================================
// COULEUR SELON LA PROGRESSION
// =============================================

function getProgressColor(percent) {
    if (percent === 0) return '#ef4444'; // 🔴 Rouge
    if (percent < 100) return '#f97316'; // 🟠 Orange
    return '#10b981'; // 🟢 Vert
}

// =============================================
// UTILITAIRES
// =============================================

function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function showNotification(message, type = 'info') {
    // Réutilisation du système de notification existant
    if (typeof window.showNotification === 'function') {
        window.showNotification(message, type);
    } else {
        alert(message);
    }
}

console.log('✅ checklists.js chargé');
