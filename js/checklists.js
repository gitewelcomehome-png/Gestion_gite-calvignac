/* ================================================
   CHECKLISTS.JS - Gestion des Check-lists
   ================================================ */

let currentGiteFilter = null; // UUID du gîte, sera initialisé dynamiquement
let currentTypeFilter = 'entree';

// =============================================
// TRADUCTION AUTOMATIQUE
// =============================================

/**
 * Traduit un texte du français vers l'anglais via l'API MyMemory
 * @param {string} text - Texte français à traduire
 * @returns {Promise<string>} - Texte traduit en anglais
 */
async function translateToEnglish(text) {
    if (!text || text.trim() === '') return '';
    
    try {
        const response = await Promise.race([
            fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=fr|en`),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Translation timeout')), 2000))
        ]);
        const data = await response.json();
        
        if (data.responseStatus === 200 && data.responseData) {
            return data.responseData.translatedText;
        }
        
        console.warn('⚠️ Traduction non disponible, texte original conservé');
        return text;
        
    } catch (error) {
        console.error('❌ Erreur traduction:', error);
        return text; // Fallback sur texte original
    }
}

// Helper : Vérifie si l'erreur est PGRST205 (table non créée)
function isTableNotFound(error) {
    return error && error.code === 'PGRST205';
}

// =============================================
// INITIALISATION
// =============================================

async function initChecklistsTab() {
    // console.log('📋 Initialisation onglet Check-lists');
    
    // Charger les gîtes visibles selon l'abonnement et remplir le select
    let gites = [];
    try {
        if (window.gitesManager) {
            const hasSubscriptionManager = !!(window.subscriptionManager && window.subscriptionManager.initialized);
            if (hasSubscriptionManager && typeof window.gitesManager.getVisibleGites === 'function') {
                gites = await window.gitesManager.getVisibleGites();
            } else if (typeof window.gitesManager.getAll === 'function') {
                gites = await window.gitesManager.getAll();
            } else if (typeof window.gitesManager.getVisibleGites === 'function') {
                gites = await window.gitesManager.getVisibleGites();
            }
        }
    } catch (error) {
        console.warn('⚠️ Impossible de charger les gîtes pour Check-lists:', error);
        gites = [];
    }
    const giteSelect = document.getElementById('checklist-gite-select');
    
    if (giteSelect && gites && gites.length > 0) {
        // Vider et remplir le select avec les gîtes dynamiques
        giteSelect.innerHTML = '';
        gites.forEach(gite => {
            const option = document.createElement('option');
            option.value = gite.id; // UUID
            option.textContent = gite.name;
            giteSelect.appendChild(option);
        });
        
        // Initialiser avec le premier gîte si pas encore défini
        const hasCurrentFilter = gites.some(gite => gite.id === currentGiteFilter);
        if (!currentGiteFilter || !hasCurrentFilter) {
            currentGiteFilter = gites[0].id;
        }
        giteSelect.value = currentGiteFilter;
        
        // Listener pour changement de gîte
        if (!giteSelect.dataset.checklistBound) {
            giteSelect.addEventListener('change', (e) => {
                currentGiteFilter = e.target.value;
                loadChecklistItems();
            });
            giteSelect.dataset.checklistBound = 'true';
        }
    }
    
    // Listener pour changement de type
    const typeSelect = document.getElementById('checklist-type-select');
    if (typeSelect && !typeSelect.dataset.checklistBound) {
        typeSelect.addEventListener('change', (e) => {
            currentTypeFilter = e.target.value;
            loadChecklistItems();
        });
        typeSelect.dataset.checklistBound = 'true';
    }

    // 🎯 Appliquer le filtre depuis le dashboard si présent
    const checklistFilterData = localStorage.getItem('checklistFilter');
    if (checklistFilterData) {
        try {
            const filter = JSON.parse(checklistFilterData);
            // Appliquer le gîte si présent
            if (filter.giteId && giteSelect) {
                currentGiteFilter = filter.giteId;
                giteSelect.value = filter.giteId;
            }
            // Appliquer le type (entree/sortie)
            if (filter.type && typeSelect) {
                currentTypeFilter = filter.type;
                typeSelect.value = filter.type;
            }
            // Nettoyer le localStorage après usage
            localStorage.removeItem('checklistFilter');
            // console.log('🎯 Filtre check-list appliqué:', filter);
        } catch (error) {
            console.error('❌ Erreur parsing filtre check-list:', error);
            localStorage.removeItem('checklistFilter');
        }
    }
    
    // Chargement initial
    await loadChecklistItems();
    // NE PAS charger loadReservationsProgress() - géré par dashboard.js / loadChecklistsTab()
    // await loadReservationsProgress();
}

// =============================================
// CHARGEMENT DES ITEMS DE CHECKLIST
// =============================================

async function loadChecklistItems() {
    const container = document.getElementById('checklist-items-list');
    if (!container) return;
    
    try {
        window.SecurityUtils.setInnerHTML(container, '<p style="color: var(--text-secondary); font-style: italic;">Chargement...</p>');
        
        const { data, error } = await supabaseClient
            .from('checklist_templates')
            .select('*')
            .eq('gite_id', currentGiteFilter)
            .eq('type', currentTypeFilter)
            .eq('actif', true)
            .order('ordre', { ascending: true });
        
        if (error) {
            // Table non créée ou colonne inexistante - ignorer silencieusement
            if (error.code === 'PGRST205' || error.code === '42703' || error.code === '42P01') {
                window.SecurityUtils.setInnerHTML(container, `
                    <div style="text-align: center; padding: 40px; color: var(--text-secondary);">
                        <p style="font-size: 3rem; margin-bottom: 10px;">📋</p>
                        <p>Fonctionnalité Check-lists non configurée</p>
                        <p style="font-size: 0.85rem; margin-top: 10px;">La table checklist_templates n'existe pas en base de données</p>
                    </div>
                `);
                return;
            }
            throw error;
        }
        
        if (!data || data.length === 0) {
            window.SecurityUtils.setInnerHTML(container, `
                <div style="text-align: center; padding: 20px; color: var(--text-secondary);">
                    <p style="font-size: 3rem; margin-bottom: 10px;">📋</p>
                    <p>Aucun item</p>
                </div>
            `);
            return;
        }
        
        // Affichage des items
        let html = '';
        data.forEach((item, index) => {
            const texteEncoded = encodeURIComponent(item.texte || '');
            const descriptionEncoded = encodeURIComponent(item.description || '');

            html += `
                <div class="checklist-item" draggable="true" data-id="${item.id}" data-texte="${texteEncoded}" data-description="${descriptionEncoded}">
                    <div class="checklist-item-drag-handle" title="Glisser pour réordonner">⋮⋮</div>
                    <div class="checklist-item-content-block">
                        <div class="checklist-item-title-row">
                            <span class="checklist-item-index">${index + 1}</span>
                            <span class="checklist-item-title-text">${item.texte}</span>
                        </div>
                        ${item.description ? `<div class="checklist-item-description-text">${item.description}</div>` : ''}
                    </div>
                    <div class="checklist-item-actions">
                        <button data-action="edit-item" data-item-id="${item.id}" class="checklist-action-btn checklist-action-edit" title="Modifier">✏️ Modifier</button>
                        <button data-action="delete-item" data-item-id="${item.id}" class="checklist-action-btn checklist-action-delete" title="Supprimer">🗑️ Supprimer</button>
                    </div>
                </div>
            `;
        });
        
        window.SecurityUtils.setInnerHTML(container, html);
        
        // ✅ Attacher les event listeners après génération du HTML
        attachChecklistEventListeners();
        
    } catch (error) {
        console.error('❌ Erreur chargement items:', error);
        window.SecurityUtils.setInnerHTML(container, `<p style="color: #ef4444;">Erreur: ${error.message}</p>`);
    }
}

// =============================================
// EVENT DELEGATION POUR BOUTONS DYNAMIQUES
// =============================================

let currentChecklistEditingId = null;

function attachChecklistEventListeners() {
    const container = document.getElementById('checklist-items-list');
    if (!container) return;

    if (!container.dataset.clickBound) {
        container.addEventListener('click', handleChecklistClick);
        container.dataset.clickBound = 'true';
    }

    if (!container.dataset.dragContainerBound) {
        container.addEventListener('dragover', handleChecklistDragOver);
        container.addEventListener('drop', handleChecklistDrop);
        container.dataset.dragContainerBound = 'true';
    }

    attachChecklistItemDragBindings(container);
}

function attachChecklistItemDragBindings(container) {
    const items = container.querySelectorAll('.checklist-item');
    items.forEach((item) => {
        if (item.dataset.dragItemBound) return;
        item.setAttribute('draggable', 'true');
        item.addEventListener('dragstart', handleChecklistDragStart);
        item.addEventListener('dragend', handleChecklistDragEnd);
        item.dataset.dragItemBound = 'true';
    });
}

function handleChecklistClick(e) {
    // Chercher le bouton même si on clique sur l'emoji
    const button = e.target.closest('[data-action]');
    if (!button) return;
    
    // Ne pas exécuter si le bouton est désactivé
    if (button.disabled) return;
    
    const action = button.getAttribute('data-action');
    const itemId = button.getAttribute('data-item-id'); // ✅ Garder comme chaîne (UUID)
    
    if (!itemId) {
        console.error('❌ ID manquant');
        return;
    }
    
    switch(action) {
        case 'move-up':
            moveChecklistItem(itemId, 'up');
            break;
        case 'move-down':
            moveChecklistItem(itemId, 'down');
            break;
        case 'edit-item':
            editChecklistItem(itemId);
            break;
        case 'delete-item':
            deleteChecklistItem(itemId);
            break;
    }
}

function handleChecklistDragStart(e) {
    const target = e.target instanceof Element ? e.target : null;
    if (!target) return;
    if (target.closest('.checklist-item-actions')) return;

    const currentTargetItem = e.currentTarget instanceof Element && e.currentTarget.classList.contains('checklist-item')
        ? e.currentTarget
        : null;
    const item = currentTargetItem || target.closest('.checklist-item');
    if (!item) return;

    item.classList.add('dragging');
    if (e.dataTransfer) {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', item.getAttribute('data-id') || '');
    }
}

function handleChecklistDragOver(e) {
    const container = document.getElementById('checklist-items-list');
    if (!container) return;

    e.preventDefault();
    const overItem = e.target.closest('.checklist-item');
    const draggingItem = container.querySelector('.checklist-item.dragging');
    if (!overItem || !draggingItem || overItem === draggingItem) return;

    const rect = overItem.getBoundingClientRect();
    const after = e.clientY > rect.top + rect.height / 2;
    if (after) {
        container.insertBefore(draggingItem, overItem.nextSibling);
    } else {
        container.insertBefore(draggingItem, overItem);
    }
}

async function handleChecklistDrop(e) {
    e.preventDefault();
    await persistChecklistOrder();
}

function handleChecklistDragEnd() {
    const container = document.getElementById('checklist-items-list');
    if (!container) return;
    container.querySelectorAll('.checklist-item.dragging').forEach((item) => item.classList.remove('dragging'));
}

async function persistChecklistOrder() {
    const container = document.getElementById('checklist-items-list');
    if (!container) return;

    const orderedItems = Array.from(container.querySelectorAll('.checklist-item'));
    if (orderedItems.length === 0) return;

    try {
        for (let index = 0; index < orderedItems.length; index += 1) {
            const itemId = orderedItems[index].getAttribute('data-id');
            if (!itemId) continue;

            const { error } = await supabaseClient
                .from('checklist_templates')
                .update({ ordre: index + 1 })
                .eq('id', itemId);

            if (error) {
                if (isTableNotFound(error) || error.code === '42703' || error.code === '42P01') return;
                throw error;
            }
        }

        await loadChecklistItems();
    } catch (error) {
        console.error('❌ Erreur mise à jour ordre:', error);
        notifyChecklist('❌ Impossible de mettre à jour l\'ordre', 'error');
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
        return false;
    }

    if (!currentGiteFilter) {
        notifyChecklist('⚠️ Aucun gîte sélectionné', 'warning');
        return false;
    }
    
    try {
        // Récupérer l'ordre maximum actuel
        const { data: maxData, error: maxError } = await supabaseClient
            .from('checklist_templates')
            .select('ordre')
            .eq('gite_id', currentGiteFilter)
            .eq('type', currentTypeFilter)
            .order('ordre', { ascending: false })
            .limit(1);
        
        if (maxError) {
            if (isTableNotFound(maxError) || maxError.code === '42703' || maxError.code === '42P01') {
                notifyChecklist('⚠️ Table checklist_templates non disponible', 'warning');
                return false;
            }
            throw maxError;
        }
        
        const nextOrdre = (maxData && maxData.length > 0) ? maxData[0].ordre + 1 : 1;
        
        // Récupérer l'ID utilisateur pour RLS
        const { data: { user } } = await window.supabaseClient.auth.getUser();
        if (!user) throw new Error('Utilisateur non authentifié');
        
        // 🌍 TRADUCTION AUTOMATIQUE EN ANGLAIS
        const description = descriptionInput.value.trim() || null;
        
        const [texteEn, descriptionEn] = await Promise.all([
            translateToEnglish(texte),
            description ? translateToEnglish(description) : Promise.resolve(null)
        ]);
        
        // Insertion
        const { error } = await supabaseClient
            .from('checklist_templates')
            .insert({
                owner_user_id: user.id,
                gite_id: currentGiteFilter,
                type: currentTypeFilter,
                ordre: nextOrdre,
                texte: texte,
                texte_en: texteEn,
                description: description,
                description_en: descriptionEn,
                actif: true
            });
        
        if (error) {
            if (isTableNotFound(error)) return false;
            throw error;
        }
        
        // Rafraîchir la liste
        await loadChecklistItems();
        
        clearChecklistForm();
        
        notifyChecklist('✅ Item ajouté avec succès', 'success');
        return true;
        
    } catch (error) {
        console.error('❌ Erreur ajout item:', error);
        alert(`Erreur lors de l'ajout: ${error.message}`);
        return false;
    }
}

// =============================================
// MODIFICATION D'UN ITEM
// =============================================

function editChecklistItem(itemId) {
    const item = document.querySelector(`.checklist-item[data-id="${itemId}"]`);
    
    if (!item) {
        console.error('❌ Item non trouvé:', itemId);
        return;
    }
    
    // Décoder les données
    const texteActuel = decodeURIComponent(item.getAttribute('data-texte') || '');
    const descriptionActuelle = decodeURIComponent(item.getAttribute('data-description') || '');
    
    // Pré-remplir les champs du formulaire
    const texteInput = document.getElementById('checklist-new-text');
    const descriptionInput = document.getElementById('checklist-new-description');
    
    if (texteInput) texteInput.value = texteActuel;
    if (descriptionInput) descriptionInput.value = descriptionActuelle;
    
    currentChecklistEditingId = itemId;
    openChecklistCreateModal('edit');

    const btnSubmit = document.getElementById('btn-checklist-submit');
    if (btnSubmit) {
        btnSubmit.textContent = '💾 Fermer et modifier';
        btnSubmit.classList.add('is-editing');
        btnSubmit.setAttribute('data-editing-id', itemId);
    } else {
        console.error('❌ Bouton submit non trouvé');
    }
    
}

async function updateChecklistItem(itemId) {
    const texteInput = document.getElementById('checklist-new-text');
    const descriptionInput = document.getElementById('checklist-new-description');
    
    if (!texteInput || !descriptionInput) return false;
    
    const texte = texteInput.value.trim();
    if (!texte) {
        alert('⚠️ Veuillez saisir le texte de l\'item');
        return false;
    }
    
    try {
        const description = descriptionInput.value.trim() || null;
        
        // 🌍 TRADUCTION AUTOMATIQUE
        // console.log('🌍 Traduction automatique en cours...');
        const [texteEn, descriptionEn] = await Promise.all([
            translateToEnglish(texte),
            description ? translateToEnglish(description) : Promise.resolve(null)
        ]);
        
        // console.log('✅ Traduction terminée:', { texteEn, descriptionEn });
        
        // Mise à jour
        const { error } = await supabaseClient
            .from('checklist_templates')
            .update({
                texte: texte,
                texte_en: texteEn,
                description: description,
                description_en: descriptionEn
            })
            .eq('id', itemId);
        
        if (error) {
            if (isTableNotFound(error)) return false;
            throw error;
        }
        
        // Rafraîchir la liste
        await loadChecklistItems();
        
        // Réinitialiser le formulaire
        clearChecklistForm();
        currentChecklistEditingId = null;
        
        // Réinitialiser le bouton
        const btnSubmit = document.getElementById('btn-checklist-submit');
        if (btnSubmit) {
            btnSubmit.textContent = '➕ Créer l\'item';
            btnSubmit.classList.remove('is-editing');
            btnSubmit.onclick = addChecklistItem;
            btnSubmit.removeAttribute('data-editing-id');
        }
        
        notifyChecklist('✅ Item modifié avec succès', 'success');
        return true;
        
    } catch (error) {
        console.error('❌ Erreur modification item:', error);
        alert(`Erreur lors de la modification: ${error.message}`);
        return false;
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
        
        if (error) {
            if (isTableNotFound(error)) return;
            throw error;
        }
        
        await loadChecklistItems();
        notifyChecklist('✅ Item supprimé', 'success');
        
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
            .eq('gite_id', currentGiteFilter)
            .eq('type', currentTypeFilter)
            .eq('actif', true)
            .order('ordre', { ascending: true });
        
        if (fetchError) {
            if (isTableNotFound(fetchError) || fetchError.code === '42703' || fetchError.code === '42P01') return;
            throw fetchError;
        }
        
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
            
            if (error) {
                if (isTableNotFound(error)) return;
                throw error;
            }
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
    
    // Réinitialiser le bouton s'il était en mode "Mise à jour"
    const btnSubmit = document.getElementById('btn-checklist-submit');
    if (btnSubmit) {
        btnSubmit.textContent = '➕ Créer l\'item';
        btnSubmit.classList.remove('is-editing');
        btnSubmit.onclick = addChecklistItem;
        btnSubmit.removeAttribute('data-editing-id');
    }

    currentChecklistEditingId = null;
}

function openChecklistCreateModal(mode = 'create') {
    const modal = document.getElementById('checklistCreateModal');
    const title = document.getElementById('checklist-modal-title');
    const btnSubmit = document.getElementById('btn-checklist-submit');
    if (!modal) return;

    if (mode === 'create') {
        clearChecklistForm();
        if (title) title.textContent = 'Créer un item';
        if (btnSubmit) {
            btnSubmit.textContent = '✅ Fermer et sauvegarder';
            btnSubmit.classList.remove('is-editing');
        }
    } else {
        if (title) title.textContent = 'Modifier un item';
    }

    modal.hidden = false;
    if (!modal.dataset.boundClose) {
        modal.addEventListener('click', (event) => {
            if (event.target === modal) {
                closeChecklistCreateModal(false);
            }
        });
        modal.dataset.boundClose = 'true';
    }
    document.getElementById('checklist-new-text')?.focus();
}

async function closeChecklistCreateModal(save = true) {
    const modal = document.getElementById('checklistCreateModal');
    if (!modal) return;

    if (save) {
        let success = false;
        if (currentChecklistEditingId) {
            success = await updateChecklistItem(currentChecklistEditingId);
        } else {
            success = await addChecklistItem();
        }

        if (!success) {
            return;
        }
    }

    modal.hidden = true;
}

// =============================================
// CHARGEMENT DES RÉSERVATIONS AVEC PROGRESSION
// =============================================

async function loadReservationsProgress() {
    const container = document.getElementById('checklist-reservations-container');
    if (!container) return;
    
    try {
        window.SecurityUtils.setInnerHTML(container, '<p class="text-muted" style="font-style: italic;">Chargement des réservations...</p>');
        
        // Récupérer SEULEMENT les réservations EN COURS (arrivées mais pas encore parties)
        const aujourdhui = new Date().toISOString().split('T')[0];
        
        const { data: reservations, error: resaError } = await supabaseClient
            .from('reservations')
            .select('*')
            .lte('check_in', aujourdhui)  // Déjà arrivés
            .gte('check_out', aujourdhui)    // Pas encore partis
            .order('check_in', { ascending: true });
        
        if (resaError) throw resaError;
        
        // Filtrer les réservations d'un seul jour (phantoms)
        const reservationsFiltered = reservations.filter(r => {
            const dateDebut = new Date(r.check_in);
            const dateFin = new Date(r.check_out);
            const nuits = Math.ceil((dateFin - dateDebut) / (1000 * 60 * 60 * 24));
            return nuits > 1; // Exclure réservations d'une nuit ou moins
        });
        
        if (!reservationsFiltered || reservationsFiltered.length === 0) {
            window.SecurityUtils.setInnerHTML(container, `
                <div class="text-muted" style="text-align: center; padding: 20px;">
                    <p style="font-size: 3rem; margin-bottom: 10px;">📅</p>
                    <p>Aucune réservation en cours actuellement</p>
                    <p class="text-secondary" style="font-size: 0.9rem; margin-top: 10px;">Les checklists s'affichent uniquement pour les séjours en cours (+ de 1 nuit)</p>
                </div>
            `);
            return;
        }
        
        // Pour chaque réservation, afficher la liste complète
        let html = '';
        
        for (const resa of reservationsFiltered) {
            // console.log(`🔍 Recherche templates pour gîte: "${resa.gite}"`);
            
            // Récupérer tous les templates et progression
            const { data: templates, error: templatesError } = await supabaseClient
                .from('checklist_templates')
                .select('*')
                .eq('gite_id', resa.gite_id)
                .eq('actif', true)
                .order('type', { ascending: true })
                .order('ordre', { ascending: true });
            
            // console.log(`📋 Templates trouvés pour ${resa.gite_id}:`, templates?.length || 0);
            
            if (templatesError) {
                if (isTableNotFound(templatesError) || templatesError.code === '42703' || templatesError.code === '42P01') continue;
                console.error('Erreur templates:', templatesError);
                continue;
            }
            
            const { data: progress, error: progressError } = await supabaseClient
                .from('checklist_progress')
                .select('*')
                .eq('reservation_id', resa.id);
            
            if (progressError) {
                console.error('Erreur progress:', progressError);
                continue;
            }
            
            // Map pour accès rapide
            const progressMap = {};
            if (progress) {
                progress.forEach(p => {
                    progressMap[p.template_id] = p.completed;
                });
            }
            
            // Séparer par type
            const templatesEntree = templates.filter(t => t.type === 'entree');
            const templatesSortie = templates.filter(t => t.type === 'sortie');
            
            // Calculer progression
            const completedEntree = templatesEntree.filter(t => progressMap[t.id] === true).length;
            const completedSortie = templatesSortie.filter(t => progressMap[t.id] === true).length;
            const percentEntree = templatesEntree.length > 0 ? Math.round((completedEntree / templatesEntree.length) * 100) : 0;
            const percentSortie = templatesSortie.length > 0 ? Math.round((completedSortie / templatesSortie.length) * 100) : 0;
            
            html += `
                <div class="checklist-reservation-item">
                    <!-- En-tête réservation -->
                    <div class="checklist-reservation-header" style="padding-bottom: 15px; border-bottom: 2px solid var(--border);">
                        <div>
                            <strong style="font-size: 1.2rem; color: var(--text);">${resa.client_name}</strong>
                            <span class="text-secondary" style="margin-left: 15px; font-size: 1.1rem;">${resa.gite_id}</span>
                        </div>
                        <div class="text-secondary" style="font-size: 0.95rem;">
                            ${formatDate(resa.check_in)} → ${formatDate(resa.check_out)}
                        </div>
                    </div>
                    
                    <!-- Résumé progression -->
                    <div class="checklist-progress-grid" style="margin-bottom: 20px;">
                        <div>
                            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                                <span class="checklist-status-badge" style="background: ${getProgressColor(percentEntree)};"></span>
                                <strong style="font-size: 1rem;">🚪 Entrée</strong>
                                <span style="margin-left: auto; font-weight: 700; font-size: 1.1rem;">${completedEntree}/${templatesEntree.length}</span>
                            </div>
                            <div class="checklist-progress-bar">
                                <div class="checklist-progress-fill" style="width: ${percentEntree}%; background: ${getProgressColor(percentEntree)};"></div>
                            </div>
                        </div>
                        
                        <div>
                            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                                <span class="checklist-status-badge" style="background: ${getProgressColor(percentSortie)};"></span>
                                <strong style="font-size: 1rem;">🧳 Sortie</strong>
                                <span style="margin-left: auto; font-weight: 700; font-size: 1.1rem;">${completedSortie}/${templatesSortie.length}</span>
                            </div>
                            <div class="checklist-progress-bar">
                                <div class="checklist-progress-fill" style="width: ${percentSortie}%; background: ${getProgressColor(percentSortie)};"></div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Liste détaillée des items -->
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                        <!-- Colonne Entrée -->
                        <div>
                            ${templatesEntree.length === 0 ? '<p class="text-muted" style="font-style: italic;">Aucun item configuré</p>' : templatesEntree.map(t => {
                                const isChecked = progressMap[t.id] === true;
                                return `
                                    <div class="checklist-item-card" style="background: ${isChecked ? '#d1fae5' : 'var(--card)'}; border-color: ${isChecked ? '#10b981' : 'var(--border)'};">
                                        <div class="checklist-item-content">
                                            <span class="checklist-item-icon">${isChecked ? '✅' : '❌'}</span>
                                            <div class="checklist-item-text">
                                                <div class="checklist-item-title" style="font-weight: ${isChecked ? '600' : '400'}; color: ${isChecked ? '#059669' : 'var(--text-secondary)'};">${t.texte}</div>
                                                ${t.description ? `<div class="checklist-item-description">${t.description}</div>` : ''}
                                            </div>
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                        
                        <!-- Colonne Sortie -->
                        <div>
                            ${templatesSortie.length === 0 ? '<p class="text-muted" style="font-style: italic;">Aucun item configuré</p>' : templatesSortie.map(t => {
                                const isChecked = progressMap[t.id] === true;
                                return `
                                    <div class="checklist-item-card" style="background: ${isChecked ? '#d1fae5' : 'var(--card)'}; border-color: ${isChecked ? '#10b981' : 'var(--border)'};">
                                        <div class="checklist-item-content">
                                            <span class="checklist-item-icon">${isChecked ? '✅' : '❌'}</span>
                                            <div class="checklist-item-text">
                                                <div class="checklist-item-title" style="font-weight: ${isChecked ? '600' : '400'}; color: ${isChecked ? '#059669' : 'var(--text-secondary)'};">${t.texte}</div>
                                                ${t.description ? `<div class="checklist-item-description">${t.description}</div>` : ''}
                                            </div>
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                </div>
            `;
        }
        
        window.SecurityUtils.setInnerHTML(container, html);
        
    } catch (error) {
        console.error('❌ Erreur chargement réservations:', error);
        window.SecurityUtils.setInnerHTML(container, `<p style="color: #ef4444;">Erreur: ${error.message}</p>`);
    }
}

async function loadChecklistsTab() {
    await loadReservationsProgress();
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
            .eq('gite_id', gite)
            .eq('actif', true);
        
        if (templatesError) {
            if (isTableNotFound(templatesError) || templatesError.code === '42703' || templatesError.code === '42P01') {
                return { entreeTotal: 0, entreeCompleted: 0, sortieTotal: 0, sortieCompleted: 0 };
            }
            throw templatesError;
        }
        
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

function notifyChecklist(message, type = 'info') {
    const globalNotifier = window.showNotification;
    if (typeof globalNotifier === 'function' && globalNotifier !== notifyChecklist) {
        globalNotifier(message, type);
        return;
    }
    alert(message);
}

// =============================================
// AFFICHAGE DÉTAIL CHECKLIST
// =============================================

async function toggleChecklistDetail(reservationId) {
    const detailContainer = document.getElementById(`checklist-detail-${reservationId}`);
    if (!detailContainer) return;
    
    // Toggle affichage
    if (detailContainer.style.display === 'none') {
        detailContainer.style.display = 'block';
        await loadChecklistDetailForReservation(reservationId);
    } else {
        detailContainer.style.display = 'none';
    }
}

async function loadChecklistDetailForReservation(reservationId) {
    const detailContainer = document.getElementById(`checklist-detail-${reservationId}`);
    if (!detailContainer) return;
    
    try {
        window.SecurityUtils.setInnerHTML(detailContainer, '<p style="text-align: center; color: var(--text-secondary);">Chargement...</p>');
        
        // Récupérer la réservation
        const { data: reservations, error: resaError } = await supabaseClient
            .from('reservations')
            .select('*')
            .eq('id', reservationId)
            .single();
        
        if (resaError) throw resaError;
        
        const gite = reservations.gite_id; // UUID du gîte
        
        // Récupérer tous les templates pour ce gîte
        const { data: templates, error: templatesError } = await supabaseClient
            .from('checklist_templates')
            .select('*')
            .eq('gite_id', gite)
            .eq('actif', true)
            .order('type', { ascending: true })
            .order('ordre', { ascending: true });
        
        if (templatesError) {
            if (isTableNotFound(templatesError) || templatesError.code === '42703' || templatesError.code === '42P01') {
                window.SecurityUtils.setInnerHTML(detailContainer, '<p style="text-align: center; color: var(--text-secondary); padding: 20px;">⚠️ Fonctionnalité non disponible</p>');
                return;
            }
            throw templatesError;
        }
        
        // Récupérer la progression
        const { data: progress, error: progressError } = await supabaseClient
            .from('checklist_progress')
            .select('*')
            .eq('reservation_id', reservationId);
        
        if (progressError) throw progressError;
        
        // Créer un map pour accès rapide
        const progressMap = {};
        if (progress) {
            progress.forEach(p => {
                progressMap[p.template_id] = p.completed;
            });
        }
        
        // Séparer par type
        const templatesEntree = templates.filter(t => t.type === 'entree');
        const templatesSortie = templates.filter(t => t.type === 'sortie');
        
        let html = '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">';
        
        // Colonne Entrée
        html += '<div><h4 style="margin-bottom: 10px; color: #27AE60;">🚪 Check-list Entrée</h4>';
        if (templatesEntree.length === 0) {
            html += '<p style="color: var(--text-secondary); font-style: italic;">Aucun item configuré</p>';
        } else {
            templatesEntree.forEach(t => {
                const isChecked = progressMap[t.id] === true;
                html += `
                    <div style="padding: 10px; background: ${isChecked ? '#d1fae5' : '#f9fafb'}; border-radius: 6px; margin-bottom: 8px; border: 1px solid ${isChecked ? '#10b981' : '#e5e7eb'};">
                        <div style="display: flex; align-items: start; gap: 10px;">
                            <span style="font-size: 1.5rem;">${isChecked ? '✅' : '⬜'}</span>
                            <div style="flex: 1;">
                                <div style="font-weight: ${isChecked ? '600' : '400'};">${t.texte}</div>
                                ${t.description ? `<div style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 4px;">${t.description}</div>` : ''}
                            </div>
                        </div>
                    </div>
                `;
            });
        }
        html += '</div>';
        
        // Colonne Sortie
        html += '<div><h4 style="margin-bottom: 10px; color: #E74C3C;">🧳 Check-list Sortie</h4>';
        if (templatesSortie.length === 0) {
            html += '<p style="color: var(--text-secondary); font-style: italic;">Aucun item configuré</p>';
        } else {
            templatesSortie.forEach(t => {
                const isChecked = progressMap[t.id] === true;
                html += `
                    <div style="padding: 10px; background: ${isChecked ? '#d1fae5' : '#f9fafb'}; border-radius: 6px; margin-bottom: 8px; border: 1px solid ${isChecked ? '#10b981' : '#e5e7eb'};">
                        <div style="display: flex; align-items: start; gap: 10px;">
                            <span style="font-size: 1.5rem;">${isChecked ? '✅' : '⬜'}</span>
                            <div style="flex: 1;">
                                <div style="font-weight: ${isChecked ? '600' : '400'};">${t.texte}</div>
                                ${t.description ? `<div style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 4px;">${t.description}</div>` : ''}
                            </div>
                        </div>
                    </div>
                `;
            });
        }
        html += '</div>';
        
        html += '</div>';
        
        window.SecurityUtils.setInnerHTML(detailContainer, html);
        
    } catch (error) {
        console.error('❌ Erreur chargement détail:', error);
        window.SecurityUtils.setInnerHTML(detailContainer, `<p style="color: #ef4444;">Erreur: ${error.message}</p>`);
    }
}

// Exposer globalement
window.toggleChecklistDetail = toggleChecklistDetail;
window.addChecklistItem = addChecklistItem;
window.clearChecklistForm = clearChecklistForm;
window.initChecklistsTab = initChecklistsTab;
window.loadChecklistsTab = loadChecklistsTab;
window.openChecklistCreateModal = openChecklistCreateModal;
window.closeChecklistCreateModal = closeChecklistCreateModal;

// console.log('✅ checklists.js chargé');
