// ================================================================
// GESTION DES GÎTES - CRUD
// ================================================================

/**
 * Obtenir l'icône SVG moderne d'un type de propriété
 * Style Apple/Sidebar - Outline simple
 */
window.getPropertyIcon = function(emojiType) {
    const icons = {
        'house-simple': `<svg viewBox="0 0 64 64" style="width:48px;height:48px" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 28 L32 12 L52 28 L52 52 L12 52 Z"/>
            <rect x="26" y="38" width="12" height="14"/>
            <rect x="18" y="32" width="8" height="8"/>
            <rect x="38" y="32" width="8" height="8"/>
        </svg>`,
        'apartment': `<svg viewBox="0 0 64 64" style="width:48px;height:48px" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <rect x="18" y="8" width="28" height="48" rx="2"/>
            <rect x="26" y="42" width="12" height="14"/>
            <line x1="24" y1="16" x2="28" y2="16"/><line x1="36" y1="16" x2="40" y2="16"/>
            <line x1="24" y1="22" x2="28" y2="22"/><line x1="36" y1="22" x2="40" y2="22"/>
            <line x1="24" y1="28" x2="28" y2="28"/><line x1="36" y1="28" x2="40" y2="28"/>
            <line x1="24" y1="34" x2="28" y2="34"/><line x1="36" y1="34" x2="40" y2="34"/>
        </svg>`,
        'studio': `<svg viewBox="0 0 64 64" style="width:48px;height:48px" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <rect x="14" y="20" width="36" height="32"/>
            <path d="M14 28 L50 28"/>
            <circle cx="32" cy="38" r="6"/>
            <rect x="22" y="46" width="8" height="6"/>
            <rect x="34" y="46" width="8" height="6"/>
        </svg>`,
        'chalet': `<svg viewBox="0 0 64 64" style="width:48px;height:48px" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M8 28 L32 8 L56 28 L56 54 L8 54 Z"/>
            <path d="M18 28 L32 16 L46 28"/>
            <rect x="28" y="40" width="8" height="14"/>
            <circle cx="22" cy="35" r="2"/>
            <circle cx="42" cy="35" r="2"/>
        </svg>`,
        'castle': `<svg viewBox="0 0 64 64" style="width:48px;height:48px" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M8 24 L8 54 L20 54 L20 28 L44 28 L44 54 L56 54 L56 24"/>
            <rect x="14" y="10" width="4" height="14"/><rect x="46" y="10" width="4" height="14"/>
            <path d="M20 28 L20 54 L44 54 L44 28"/>
            <path d="M28 54 L28 42 A4 4 0 0 1 36 42 L36 54"/>
        </svg>`,
        'camper': `<svg viewBox="0 0 64 64" style="width:48px;height:48px" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <rect x="12" y="24" width="40" height="20" rx="2"/>
            <circle cx="20" cy="50" r="4"/>
            <circle cx="44" cy="50" r="4"/>
            <line x1="20" y1="46" x2="20" y2="44"/>
            <line x1="44" y1="46" x2="44" y2="44"/>
            <rect x="38" y="28" width="8" height="8"/>
            <rect x="18" y="30" width="12" height="6"/>
        </svg>`,
        'church': `<svg viewBox="0 0 64 64" style="width:48px;height:48px" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M10 28 L32 12 L54 28 L54 54 L10 54 Z"/>
            <rect x="26" y="38" width="12" height="16"/>
            <line x1="32" y1="38" x2="32" y2="54"/>
            <circle cx="32" cy="24" r="3"/>
            <line x1="32" y1="12" x2="32" y2="21"/>
        </svg>`,
        'house': `<svg viewBox="0 0 64 64" style="width:48px;height:48px" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M10 30 L32 10 L54 30 L54 54 L10 54 Z"/>
            <rect x="26" y="38" width="12" height="16"/>
            <rect x="18" y="32" width="8" height="8"/>
            <rect x="38" y="32" width="8" height="8"/>
        </svg>`
    };
    return icons[emojiType] || icons['house'];
};

window.showGitesManager = async function() {
    console.log('🏠 showGitesManager() appelée');
    
    // Fermer la modal existante si elle existe
    const existingModal = document.querySelector('.gites-manager-modal');
    if (existingModal) {
        existingModal.closest('.modal-overlay').remove();
    }
    
    // Charger les gîtes depuis le gestionnaire
    const gites = await window.gitesManager.getAll();
    console.log('📋 LISTE GÎTES MODERNE V2.0 - Gîtes chargés:', gites.length);
    
    // Créer la modal MODERNE
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content-modern" style="max-width: 1200px;">
            <div class="modal-header-modern">
                <h2>
                    <i data-lucide="home"></i>
                    Gérer mes gîtes
                </h2>
                <button class="btn-close-modern" onclick="this.closest('.modal-overlay').remove()">
                    <i data-lucide="x"></i>
                </button>
            </div>
            <div class="modal-body-modern">
                <div class="gites-list-header-modern">
                    <button class="btn-add-modern" onclick="window.showAddGiteForm()">
                        <i data-lucide="plus"></i>
                        Ajouter un gîte
                    </button>
                </div>
                <div class="gites-grid-modern">
                    ${gites.map((gite, index) => `
                        <div class="gite-card-modern" data-gite-id="${gite.id}">
                            <div class="gite-order-number-modern">${index + 1}</div>
                            <div class="gite-card-header-modern" style="background: ${gite.color || '#667eea'}">
                                <div class="gite-icon-modern">${window.getPropertyIcon(gite.icon || 'house')}</div>
                                <h3>${gite.name}</h3>
                            </div>
                            <div class="gite-card-body-modern">
                                <div class="gite-info-modern">
                                    <strong>📍</strong>
                                    <span>${gite.address || 'Non renseigné'}</span>
                                </div>
                                <div class="gite-info-modern">
                                    <strong>👥</strong>
                                    <span>${gite.capacity || '-'} personnes</span>
                                </div>
                                <div class="gite-info-modern">
                                    <strong>🔗</strong>
                                    <span>${(() => {
                                        const sources = gite.ical_sources;
                                        if (!sources) return '0 URL iCal';
                                        const count = Array.isArray(sources) ? sources.length : Object.keys(sources).length;
                                        return count === 0 ? '0 URL iCal' : count === 1 ? '1 URL iCal' : count + ' URLs iCal';
                                    })()}</span>
                                </div>
                            </div>
                            <div class="gite-card-actions-modern">
                                <button class="btn-icon-modern primary" onclick="window.showIcalConfig('${gite.id}')" title="Configurer URLs iCal">
                                    <i data-lucide="calendar"></i>
                                </button>
                                <button class="btn-icon-modern" onclick="window.editGite('${gite.id}')" title="Modifier">
                                    <i data-lucide="pencil"></i>
                                </button>
                                <button class="btn-icon-modern" onclick="window.moveGiteOrder('${gite.id}', 'up')" title="Monter" ${index === 0 ? 'disabled' : ''}>
                                    <i data-lucide="chevron-up"></i>
                                </button>
                                <button class="btn-icon-modern" onclick="window.moveGiteOrder('${gite.id}', 'down')" title="Descendre" ${index === gites.length - 1 ? 'disabled' : ''}>
                                    <i data-lucide="chevron-down"></i>
                                </button>
                                <button class="btn-icon-modern delete" onclick="window.deleteGite('${gite.id}')" title="Supprimer">
                                    <i data-lucide="trash-2"></i>
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Initialiser les icônes Lucide
    if (window.lucide) {
        window.lucide.createIcons();
    }
};

/**
 * Afficher le formulaire d'ajout/édition de gîte
 */
window.showAddGiteForm = function(giteToEdit = null) {
    const isEdit = !!giteToEdit;
    console.log('🎨 FORMULAIRE MODERNE V2.0 - showAddGiteForm() appelée');
    console.log(isEdit ? '✏️ Édition gîte:' : '➕ Ajout nouveau gîte', giteToEdit);
    
    // Générer les champs iCal
    let icalFieldsHtml = "";
    if (isEdit && Array.isArray(giteToEdit.ical_sources) && giteToEdit.ical_sources.length > 0) {
        icalFieldsHtml = giteToEdit.ical_sources.map(ical => `
            <div class="ical-url-row">
                <select class="form-select-modern ical-platform" onchange="window.updatePlatformIcon(this)">
                    <option value="">Plateforme</option>
                    <option value="airbnb" ${ical.platform==='airbnb'?'selected':''}>Airbnb</option>
                    <option value="booking" ${ical.platform==='booking'?'selected':''}>Booking.com</option>
                    <option value="vrbo" ${ical.platform==='vrbo'?'selected':''}>Vrbo</option>
                    <option value="abritel" ${ical.platform==='abritel'?'selected':''}>Abritel</option>
                    <option value="homeaway" ${ical.platform==='homeaway'?'selected':''}>HomeAway</option>
                    <option value="tripadvisor" ${ical.platform==='tripadvisor'?'selected':''}>TripAdvisor</option>
                    <option value="gites-de-france" ${ical.platform==='gites-de-france'?'selected':''}>Gîtes de France</option>
                </select>
                <input type="url" class="form-input-modern ical-url-input" placeholder="https://..." value="${ical.url || ''}">
                <button type="button" class="btn-icon-modern btn-remove-ical" title="Supprimer">
                    <i data-lucide="trash-2"></i>
                </button>
            </div>
        `).join('');
    } else {
        icalFieldsHtml = `
            <div class="ical-url-row">
                <select class="form-select-modern ical-platform" onchange="window.updatePlatformIcon(this)">
                    <option value="">Plateforme</option>
                    <option value="airbnb">Airbnb</option>
                    <option value="booking">Booking.com</option>
                    <option value="vrbo">Vrbo</option>
                    <option value="abritel">Abritel</option>
                    <option value="homeaway">HomeAway</option>
                    <option value="tripadvisor">TripAdvisor</option>
                    <option value="gites-de-france">Gîtes de France</option>
                </select>
                <input type="url" class="form-input-modern ical-url-input" placeholder="https://...">
                <button type="button" class="btn-icon-modern btn-remove-ical" title="Supprimer">
                    <i data-lucide="trash-2"></i>
                </button>
            </div>
        `;
    }
    
    // Icon/type de propriété
    const iconValue = isEdit ? (giteToEdit.icon || 'house') : 'house';
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content-modern">
            <div class="modal-header-modern">
                <h2>
                    <i data-lucide="${isEdit ? 'pencil' : 'plus-circle'}"></i>
                    ${isEdit ? 'Modifier le gîte' : 'Nouveau gîte'}
                </h2>
                <button class="btn-close-modern" onclick="this.closest('.modal-overlay').remove()">
                    <i data-lucide="x"></i>
                </button>
            </div>
        
            <form class="modal-body-modern" onsubmit="handleSaveGite(event, ${isEdit ? `'${giteToEdit.id}'` : 'null'}); return false;">
                <!-- Informations générales -->
                <div class="form-section-modern">
                    <div class="form-section-title">
                        <i data-lucide="info"></i>
                        Informations générales
                    </div>
                    
                    <div class="form-group-modern">
                        <label class="form-label-modern">Nom du gîte *</label>
                        <input type="text" name="name" class="form-input-modern" required placeholder="Ex: Gîte des Vignes" value="${isEdit ? (giteToEdit.name || '') : ''}">
                    </div>
                    
                    <div class="form-grid-2">
                        <div class="form-group-modern">
                            <label class="form-label-modern">Capacité</label>
                            <input type="number" name="capacity" class="form-input-modern" min="1" max="20" placeholder="Personnes" value="${isEdit && giteToEdit.capacity ? giteToEdit.capacity : ''}">
                        </div>
                        
                        <div class="form-group-modern">
                            <label class="form-label-modern">Localisation</label>
                            <input type="text" name="location" class="form-input-modern" placeholder="Ex: Trévoux, Ain" value="${isEdit ? (giteToEdit.address || '') : ''}">
                        </div>
                    </div>
                    
                    <div class="form-group-modern">
                        <label class="form-label-modern">Couleur d'affichage</label>
                        <input type="color" name="color" class="form-input-modern" value="${isEdit ? (giteToEdit.color || '#667eea') : '#667eea'}">
                    </div>
                </div>
                
                <!-- Type de propriété -->
                <div class="form-section-modern">
                    <div class="form-section-title">
                        <i data-lucide="home"></i>
                        Type de propriété
                    </div>
                    
                    <div class="icon-type-grid">
                        <button type="button" class="icon-type-btn${iconValue==='house-simple'?' active':''}" data-icon="house-simple" title="Maison simple">
                            <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M12 28 L32 12 L52 28 L52 52 L12 52 Z"/>
                                <rect x="26" y="38" width="12" height="14"/>
                                <rect x="18" y="32" width="8" height="8"/>
                                <rect x="38" y="32" width="8" height="8"/>
                            </svg>
                            <span>Maison</span>
                        </button>
                        <button type="button" class="icon-type-btn${iconValue==='apartment'?' active':''}" data-icon="apartment" title="Appartement">
                            <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                <rect x="18" y="8" width="28" height="48" rx="2"/>
                                <rect x="26" y="42" width="12" height="14"/>
                                <line x1="24" y1="16" x2="28" y2="16"/><line x1="36" y1="16" x2="40" y2="16"/>
                                <line x1="24" y1="22" x2="28" y2="22"/><line x1="36" y1="22" x2="40" y2="22"/>
                                <line x1="24" y1="28" x2="28" y2="28"/><line x1="36" y1="28" x2="40" y2="28"/>
                                <line x1="24" y1="34" x2="28" y2="34"/><line x1="36" y1="34" x2="40" y2="34"/>
                            </svg>
                            <span>Appartement</span>
                        </button>
                        <button type="button" class="icon-type-btn${iconValue==='studio'?' active':''}" data-icon="studio" title="Studio">
                            <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                <rect x="14" y="20" width="36" height="32"/>
                                <path d="M14 28 L50 28"/>
                                <circle cx="32" cy="38" r="6"/>
                                <rect x="22" y="46" width="8" height="6"/>
                                <rect x="34" y="46" width="8" height="6"/>
                            </svg>
                            <span>Studio</span>
                        </button>
                        <button type="button" class="icon-type-btn${iconValue==='chalet'?' active':''}" data-icon="chalet" title="Chalet">
                            <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M8 28 L32 8 L56 28 L56 54 L8 54 Z"/>
                                <path d="M18 28 L32 16 L46 28"/>
                                <rect x="28" y="40" width="8" height="14"/>
                                <circle cx="22" cy="35" r="2"/>
                                <circle cx="42" cy="35" r="2"/>
                            </svg>
                            <span>Chalet</span>
                        </button>
                        <button type="button" class="icon-type-btn${iconValue==='castle'?' active':''}" data-icon="castle" title="Château">
                            <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M8 24 L8 54 L20 54 L20 28 L44 28 L44 54 L56 54 L56 24"/>
                                <rect x="14" y="10" width="4" height="14"/><rect x="46" y="10" width="4" height="14"/>
                                <path d="M20 28 L20 54 L44 54 L44 28"/>
                                <path d="M28 54 L28 42 A4 4 0 0 1 36 42 L36 54"/>
                            </svg>
                            <span>Château</span>
                        </button>
                        <button type="button" class="icon-type-btn${iconValue==='camper'?' active':''}" data-icon="camper" title="Camping-car">
                            <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                <rect x="12" y="24" width="40" height="20" rx="2"/>
                                <circle cx="20" cy="50" r="4"/>
                                <circle cx="44" cy="50" r="4"/>
                                <line x1="20" y1="46" x2="20" y2="44"/>
                                <line x1="44" y1="46" x2="44" y2="44"/>
                                <rect x="38" y="28" width="8" height="8"/>
                                <rect x="18" y="30" width="12" height="6"/>
                            </svg>
                            <span>Camping-car</span>
                        </button>
                        <button type="button" class="icon-type-btn${iconValue==='church'?' active':''}" data-icon="church" title="Lieu atypique">
                            <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M10 28 L32 12 L54 28 L54 54 L10 54 Z"/>
                                <rect x="26" y="38" width="12" height="16"/>
                                <line x1="32" y1="38" x2="32" y2="54"/>
                                <circle cx="32" cy="24" r="3"/>
                                <line x1="32" y1="12" x2="32" y2="21"/>
                            </svg>
                            <span>Atypique</span>
                        </button>
                        <button type="button" class="icon-type-btn${iconValue==='house'?' active':''}" data-icon="house" title="Tente">
                            <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M10 30 L32 10 L54 30 L54 54 L10 54 Z"/>
                                <rect x="26" y="38" width="12" height="16"/>
                                <rect x="18" y="32" width="8" height="8"/>
                                <rect x="38" y="32" width="8" height="8"/>
                            </svg>
                            <span>Tente</span>
                        </button>
                    </div>
                    <input type="hidden" name="icon" id="icon-value" value="${iconValue}">
                </div>
                
                <!-- Synchronisation iCal -->
                <div class="form-section-modern">
                    <div class="form-section-title">
                        <i data-lucide="calendar"></i>
                        Synchronisation iCal
                    </div>
                    
                    <div class="ical-urls-container" id="ical-urls-container">
                        ${icalFieldsHtml}
                    </div>
                    
                    <button type="button" class="btn-add-url-modern" onclick="window.addIcalUrlField()">
                        <i data-lucide="plus"></i>
                        Ajouter une plateforme
                    </button>
                </div>
            </form>
            
            <div class="form-actions-modern">
                <button type="button" class="btn-modern btn-modern-cancel" onclick="this.closest('.modal-overlay').remove()">
                    <i data-lucide="x"></i>
                    Annuler
                </button>
                <button type="submit" form="gite-form-modern" class="btn-modern btn-modern-save" onclick="this.closest('form').dispatchEvent(new Event('submit'))">
                    <i data-lucide="check"></i>
                    ${isEdit ? 'Enregistrer' : 'Créer'}
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Initialiser Lucide icons
    if (window.lucide) {
        lucide.createIcons();
    }
    
    // Initialiser l'icône par défaut pour le premier champ
    setTimeout(() => {
        // Gérer la sélection du type de propriété
        const propertyButtons = document.querySelectorAll('.icon-type-btn');
        const iconInput = document.getElementById('icon-value');
        
        propertyButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                propertyButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                iconInput.value = btn.dataset.icon;
            });
        });
        
        // Gérer les boutons supprimer iCal
        const removeButtons = document.querySelectorAll('.btn-remove-ical');
        removeButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                this.closest('.ical-url-row').remove();
            });
        });
        
        // Fix submit button
        const submitBtn = modal.querySelector('.btn-modern-save');
        const form = modal.querySelector('form');
        if (submitBtn && form) {
            form.id = 'gite-form-modern';
            submitBtn.onclick = (e) => {
                e.preventDefault();
                form.dispatchEvent(new Event('submit'));
            };
        }
    }, 100);
};

/**
 * Ajouter un champ URL iCal dynamiquement
 */
window.addIcalUrlField = function() {
    const container = document.getElementById('ical-urls-container');
    const newField = document.createElement('div');
    newField.className = 'ical-url-row';
    newField.innerHTML = `
        <select class="form-select-modern ical-platform" onchange="window.updatePlatformIcon(this)">
            <option value="">Plateforme</option>
            <option value="airbnb">Airbnb</option>
            <option value="booking">Booking.com</option>
            <option value="vrbo">Vrbo</option>
            <option value="abritel">Abritel</option>
            <option value="homeaway">HomeAway</option>
            <option value="tripadvisor">TripAdvisor</option>
            <option value="gites-de-france">Gîtes de France</option>
        </select>
        <input type="url" class="form-input-modern ical-url-input" placeholder="https://...">
        <button type="button" class="btn-icon-modern btn-remove-ical" title="Supprimer">
            <i data-lucide="trash-2"></i>
        </button>
    `;
    container.appendChild(newField);
    
    // Réinitialiser Lucide icons
    if (window.lucide) {
        lucide.createIcons();
    }
    
    // Ajouter l'event listener pour le bouton supprimer
    const removeBtn = newField.querySelector('.btn-remove-ical');
    if (removeBtn) {
        removeBtn.addEventListener('click', function() {
            newField.remove();
        });
    }
}

/**
 * Mettre à jour l'icône affichée selon la plateforme sélectionnée
 * (Version moderne - fonction simplifiée)
 */
window.updatePlatformIcon = function(selectElement) {
    // Dans le design moderne, nous n'avons plus d'icônes de plateforme séparées
    // Cette fonction est conservée uniquement pour la compatibilité
    return;
}

window.handleSaveGite = async function(event, giteId = null) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const isEdit = !!giteId;
    
    // Collecter toutes les URLs iCal
    const icalUrls = [];
    const icalItems = document.querySelectorAll('.ical-url-row');
    icalItems.forEach(item => {
        const platform = item.querySelector('.ical-platform').value;
        const url = item.querySelector('.ical-url-input').value.trim();
        if (url) {
            icalUrls.push({ platform, url });
        }
    });
    
    const giteData = {
        name: formData.get('name'),
        capacity: parseInt(formData.get('capacity')) || null,
        address: formData.get('location') || null,
        color: formData.get('color'),
        icon: formData.get('icon'),
        ical_sources: icalUrls.length > 0 ? icalUrls : []
    };
    
    console.log('📤 Données gîte à sauvegarder:', giteData);
    
    try {
        let result;
        if (isEdit) {
            result = await window.gitesManager.update(giteId, giteData);
            console.log('✅ Gîte modifié:', result);
            showToast(`Gîte "${giteData.name}" modifié avec succès !`, 'success');
        } else {
            result = await window.gitesManager.create(giteData);
            console.log('✅ Gîte créé:', result);
            showToast(`Gîte "${giteData.name}" créé avec succès !`, 'success');
        }
        
        form.closest('.modal-overlay').remove();
        
        // Recharger la liste
        const managerModal = document.querySelector('.gites-manager-modal');
        if (managerModal) {
            managerModal.closest('.modal-overlay').remove();
        }
        window.showGitesManager();
    } catch (error) {
        console.error(`Erreur ${isEdit ? 'modification' : 'création'} gîte:`, error);
        showToast('Erreur : ' + error.message, 'error');
    }
}

window.editGite = async function(giteId) {
    try {
        const gite = await window.gitesManager.getById(giteId);
        if (!gite) {
            showToast('Gîte introuvable', 'error');
            return;
        }
        
        // Ouvrir le formulaire en mode édition
        const managerModal = document.querySelector('.gites-manager-modal');
        if (managerModal) {
            managerModal.closest('.modal-overlay').remove();
        }
        
        // Créer le formulaire d'édition (réutiliser showAddGiteForm mais avec les données)
        window.showAddGiteForm(gite);
    } catch (error) {
        console.error('Erreur édition gîte:', error);
        showToast('❌ Erreur : ' + error.message, 'error');
    }
}

window.deleteGite = async function(giteId) {
    if (!confirm('Voulez-vous vraiment supprimer ce gîte ?')) return;
    
    try {
        await window.gitesManager.delete(giteId);
        
        // Recharger la liste
        const managerModal = document.querySelector('.gites-manager-modal');
        if (managerModal) {
            managerModal.closest('.modal-overlay').remove();
        }
        window.showGitesManager();
        
        showToast('Gîte supprimé', 'success');
    } catch (error) {
        console.error('Erreur suppression gîte:', error);
        showToast('❌ Erreur : ' + error.message, 'error');
    }
}

// Styles
const gitesStyles = document.createElement('style');
gitesStyles.textContent = `
    /* ============================================
       MODAL GÎTES - STYLE NEO-BRUTALISM / FLAT OUTLINE
       ============================================ */
    
    /* 1. OVERLAY DU MODAL */
    .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(45, 52, 54, 0.85);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
    }
    
    /* 2. CONTENEUR PRINCIPAL DU MODAL */
    .modal-content {
        background: var(--white, #ffffff) !important;
        border: 3px solid var(--stroke, #2D3436) !important;
        border-radius: 16px !important;
        padding: 0 !important;
        max-width: 800px;
        width: 90%;
        max-height: 90vh;
        overflow: hidden;
        box-shadow: var(--shadow-hard, 4px 4px 0px #2D3436) !important;
    }
    
    /* 3. EN-TÊTE DU MODAL */
    .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 24px 30px !important;
        background: #e1f0ff !important;
        border-bottom: 3px solid var(--stroke, #2D3436) !important;
        margin: 0 !important;
    }
    
    .modal-header h2 {
        display: flex;
        align-items: center;
        gap: 12px;
        margin: 0 !important;
        font-size: 1.5rem !important;
        font-weight: 900 !important;
        text-transform: uppercase;
        letter-spacing: 1px;
        color: var(--stroke, #2D3436) !important;
    }
    
    /* 4. BOUTON FERMER (X) - CARRÉ ROUGE */
    .btn-close {
        background: var(--c-red, #ff7675) !important;
        border: 2px solid var(--stroke, #2D3436) !important;
        border-radius: 8px !important;
        font-size: 1.4rem;
        font-weight: 900;
        cursor: pointer;
        color: white !important;
        transition: all 0.1s ease;
        padding: 0 !important;
        width: 40px !important;
        height: 40px !important;
        display: flex !important;
        align-items: center;
        justify-content: center;
        box-shadow: 2px 2px 0 var(--stroke, #2D3436) !important;
    }
    
    .btn-close:hover {
        transform: translate(1px, 1px) !important;
        box-shadow: 1px 1px 0 var(--stroke, #2D3436) !important;
    }
    
    .btn-close:active {
        transform: translate(2px, 2px) !important;
        box-shadow: 0 0 0 var(--stroke, #2D3436) !important;
    }
    
    /* 5. CORPS DU MODAL */
    .modal-body {
        padding: 30px !important;
        max-height: calc(90vh - 100px);
        overflow-y: auto;
    }
    
    /* 6. BOUTON "AJOUTER UN GÎTE" */
    .gites-list-header {
        margin-bottom: 25px;
    }
    
    .gites-list-header .btn-neo {
        width: 100% !important;
        padding: 14px 24px !important;
        font-size: 1rem !important;
        font-weight: 900 !important;
        text-transform: uppercase;
        letter-spacing: 1px;
        background: var(--c-blue, #74b9ff) !important;
        color: white !important;
        border: 3px solid var(--stroke, #2D3436) !important;
        border-radius: 12px !important;
        box-shadow: var(--shadow-hard, 4px 4px 0px #2D3436) !important;
        cursor: pointer;
        transition: all 0.1s ease;
        display: flex !important;
        align-items: center;
        justify-content: center;
        gap: 10px;
    }
    
    .gites-list-header .btn-neo:hover {
        transform: translate(-2px, -2px) !important;
        box-shadow: 6px 6px 0 var(--stroke, #2D3436) !important;
    }
    
    .gites-list-header .btn-neo:active {
        transform: translate(2px, 2px) !important;
        box-shadow: 1px 1px 0 var(--stroke, #2D3436) !important;
    }
    
    /* 7. GRILLE DES CARTES GÎTES */
    .gites-grid {
        display: flex;
        flex-direction: column;
        gap: 20px;
    }
    
    /* 8. CARTE GÎTE INDIVIDUELLE */
    .gite-card {
        display: flex !important;
        flex-direction: column !important;
        background: var(--white, #ffffff) !important;
        border: 3px solid var(--stroke, #2D3436) !important;
        border-radius: 12px !important;
        box-shadow: var(--shadow-hard, 4px 4px 0px #2D3436) !important;
        transition: all 0.15s ease;
        overflow: hidden !important;
        position: relative;
    }
    
    .gite-card:hover {
        transform: translate(-2px, -2px) !important;
        box-shadow: 6px 6px 0 var(--stroke, #2D3436) !important;
    }
    
    /* 9. NUMÉRO D'ORDRE (BADGE) */
    .gite-order-number {
        position: absolute !important;
        top: 14px !important;
        left: 14px !important;
        background: var(--c-yellow, #ffeaa7) !important;
        border: 2px solid var(--stroke, #2D3436) !important;
        border-radius: 50% !important;
        width: 38px !important;
        height: 38px !important;
        display: flex !important;
        align-items: center;
        justify-content: center;
        font-size: 1.1rem !important;
        font-weight: 900 !important;
        color: var(--stroke, #2D3436) !important;
        z-index: 2 !important;
        box-shadow: 2px 2px 0 rgba(45, 52, 54, 0.2) !important;
    }
    
    /* 10. EN-TÊTE DE LA CARTE (PARTIE COLORÉE) */
    .gite-card-header {
        padding: 20px 20px 20px 60px !important;
        display: flex !important;
        align-items: center;
        gap: 15px !important;
        min-height: 85px !important;
        border-bottom: 3px solid var(--stroke, #2D3436) !important;
        /* Les couleurs de fond sont appliquées via style inline */
    }
    
    .gite-icon {
        flex-shrink: 0;
    }
    
    .gite-icon svg {
        width: 42px !important;
        height: 42px !important;
        filter: drop-shadow(1px 1px 2px rgba(0, 0, 0, 0.15));
    }
    
    .gite-card-header h3 {
        margin: 0 !important;
        font-size: 1.25rem !important;
        font-weight: 900 !important;
        text-transform: uppercase !important;
        letter-spacing: 0.5px;
        color: var(--stroke, #2D3436) !important;
    }
    
    /* 11. CORPS DE LA CARTE (INFOS) */
    .gite-card-body {
        padding: 18px 22px !important;
        background: var(--white, #ffffff) !important;
        flex: 1;
    }
    
    .gite-info {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 5px 0;
        font-size: 0.95rem;
        font-weight: 600;
        color: var(--stroke, #2D3436) !important;
    }
    
    .gite-info strong {
        font-size: 1.15rem;
    }
    
    /* 12. ZONE DES BOUTONS D'ACTION */
    .gite-card-actions {
        display: flex !important;
        gap: 10px !important;
        padding: 15px 20px !important;
        background: var(--white, #ffffff) !important;
        border-top: 3px solid var(--stroke, #2D3436) !important;
    }
    
    /* 13. BOUTONS D'ACTION CARRÉS NEO-BRUTALISM */
    .gite-card-actions .btn-neo {
        width: 40px !important;
        height: 40px !important;
        padding: 0 !important;
        border: 2px solid var(--stroke, #2D3436) !important;
        border-radius: 8px !important;
        background: var(--white, #ffffff) !important;
        color: var(--stroke, #2D3436) !important;
        box-shadow: 2px 2px 0 var(--stroke, #2D3436) !important;
        cursor: pointer;
        transition: all 0.1s ease;
        display: flex !important;
        align-items: center;
        justify-content: center;
        margin: 0 !important;
    }
    
    /* Bouton Modifier (Crayon) - Bleu au survol */
    .gite-card-actions .btn-neo:not(.delete):hover {
        background: var(--c-blue, #74b9ff) !important;
        color: white !important;
    }
    
    /* Bouton Supprimer (Poubelle) - Rouge */
    .gite-card-actions .btn-neo.delete {
        background: var(--c-red, #ff7675) !important;
        color: white !important;
    }
    
    .gite-card-actions .btn-neo.delete:hover {
        background: #d63031 !important;
    }
    
    /* Effet d'enfoncement au clic */
    .gite-card-actions .btn-neo:hover {
        transform: translate(-1px, -1px) !important;
        box-shadow: 3px 3px 0 var(--stroke, #2D3436) !important;
    }
    
    .gite-card-actions .btn-neo:active {
        transform: translate(2px, 2px) !important;
        box-shadow: 0 0 0 var(--stroke, #2D3436) !important;
    }
    
    /* Boutons désactivés */
    .gite-card-actions .btn-neo:disabled {
        opacity: 0.4 !important;
        cursor: not-allowed !important;
        transform: none !important;
        box-shadow: 2px 2px 0 var(--stroke, #2D3436) !important;
    }
    
    /* ============================================
       FORMULAIRE CRÉATION/ÉDITION DE GÎTE
       ============================================ */
    
    /* 14. GRILLE DU FORMULAIRE */
    .form-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 20px;
        margin-bottom: 25px;
    }
    
    .form-group.full-width {
        grid-column: 1 / -1;
    }
    
    /* 15. LABELS DES CHAMPS */
    .form-group label {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 10px;
        font-weight: 900 !important;
        text-transform: uppercase;
        font-size: 0.8rem;
        letter-spacing: 0.5px;
        color: var(--stroke) !important;
    }
    
    .icon-label {
        color: var(--c-blue, #74b9ff) !important;
    }
    
    /* 16. INPUTS ET SELECTS */
    .form-group input,
    .form-group select {
        width: 100%;
        padding: 12px 16px;
        border: 3px solid var(--stroke) !important;
        border-radius: 10px !important;
        font-size: 1rem;
        font-weight: 600;
        background: var(--bg-white, #ffffff) !important;
        color: var(--stroke) !important;
        transition: all 0.1s ease;
        box-shadow: 2px 2px 0 var(--stroke) !important;
    }
    
    .form-group input:focus,
    .form-group select:focus {
        outline: none;
        transform: translate(-1px, -1px);
        box-shadow: 4px 4px 0 var(--stroke) !important;
    }
    
    .form-group small {
        display: block;
        margin-top: 6px;
        color: #636e72;
        font-size: 0.85rem;
        font-weight: 500;
    }
    
    /* 17. CONTENEUR iCAL URLs */
    #ical-urls-container {
        display: flex;
        flex-direction: column;
        gap: 12px;
        margin-bottom: 15px;
    }
    
    .ical-url-item {
        display: grid;
        grid-template-columns: 45px 180px 1fr auto;
        gap: 10px;
        align-items: center;
    }
    
    /* 18. ICÔNE PLATEFORME (PREVIEW) */
    .platform-icon-preview {
        width: 45px;
        height: 45px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--bg-white, #ffffff) !important;
        border: 3px solid var(--stroke) !important;
        border-radius: 10px !important;
        box-shadow: 2px 2px 0 var(--stroke) !important;
        transition: all 0.1s ease;
    }
    
    .platform-icon-preview:hover {
        transform: translate(-1px, -1px);
        box-shadow: 3px 3px 0 var(--stroke) !important;
    }
    
    .platform-icon-preview:empty::before {
        content: '🌐';
        font-size: 24px;
    }
    
    /* 19. SELECTS ET INPUTS iCAL */
    .ical-platform,
    .ical-url-input {
        padding: 10px 14px;
        border: 3px solid var(--stroke) !important;
        border-radius: 10px !important;
        font-size: 0.9rem;
        font-weight: 600;
        background: var(--bg-white, #ffffff) !important;
        box-shadow: 2px 2px 0 var(--stroke) !important;
        transition: all 0.1s ease;
    }
    
    .ical-platform:focus,
    .ical-url-input:focus {
        outline: none;
        transform: translate(-1px, -1px);
        box-shadow: 3px 3px 0 var(--stroke) !important;
    }
    
    /* 20. GRILLE DES TYPES DE PROPRIÉTÉ */
    .property-type-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 12px;
        margin-top: 12px;
    }
    
    .property-type-btn {
        background: var(--bg-white, #ffffff) !important;
        border: 3px solid var(--stroke) !important;
        border-radius: 12px !important;
        padding: 12px 8px;
        cursor: pointer;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6px;
        transition: all 0.1s ease;
        position: relative;
        box-shadow: 2px 2px 0 var(--stroke) !important;
    }
    
    .property-type-btn:hover {
        transform: translate(-2px, -2px);
        box-shadow: 4px 4px 0 var(--stroke) !important;
    }
    
    .property-type-btn.active {
        background: var(--c-yellow, #ffeaa7) !important;
        border-width: 3px !important;
        transform: translate(-2px, -2px);
        box-shadow: 4px 4px 0 var(--stroke) !important;
    }
    
    .property-type-btn.active::after {
        content: '✓';
        position: absolute;
        top: 6px;
        right: 6px;
        background: var(--c-green, #55efc4) !important;
        color: var(--stroke) !important;
        width: 24px;
        height: 24px;
        border: 2px solid var(--stroke) !important;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        font-weight: 900;
    }
    
    .property-type-btn svg {
        width: 48px;
        height: 48px;
    }
    
    .property-type-btn span {
        font-size: 0.75rem;
        font-weight: 900;
        text-transform: uppercase;
        color: var(--stroke) !important;
    }
    
    /* 21. ZONE DES BOUTONS DU FORMULAIRE */
    .form-actions {
        display: flex;
        justify-content: flex-end;
        gap: 12px;
        padding-top: 20px;
        border-top: 3px solid var(--stroke) !important;
        margin-top: 15px;
    }
    
    .form-actions .btn-neo {
        padding: 12px 24px !important;
        font-weight: 900 !important;
        text-transform: uppercase;
        letter-spacing: 1px;
        border: 3px solid var(--stroke) !important;
        border-radius: 10px !important;
        box-shadow: var(--shadow-hard) !important;
        cursor: pointer;
        transition: all 0.1s ease;
        font-size: 0.95rem;
    }
    
    .form-actions .btn-neo:not(.save) {
        background: var(--bg-white, #ffffff) !important;
        color: var(--stroke) !important;
    }
    
    .form-actions .btn-neo.save {
        background: var(--c-green, #55efc4) !important;
        color: var(--stroke) !important;
    }
    
    .form-actions .btn-neo:hover {
        transform: translate(-2px, -2px);
        box-shadow: 6px 6px 0 var(--stroke) !important;
    }
    
    .form-actions .btn-neo:active {
        transform: translate(2px, 2px);
        box-shadow: 1px 1px 0 var(--stroke) !important;
    }
    
    /* ============================================
       RESPONSIVE
       ============================================ */
    
    @media (max-width: 768px) {
        .property-type-grid {
            grid-template-columns: repeat(3, 1fr);
        }
        
        .ical-url-item {
            grid-template-columns: 40px 140px 1fr auto;
        }
        
        .form-grid {
            grid-template-columns: 1fr;
        }
        
        .modal-content {
            width: 95%;
        }
    }
    
    @media (max-width: 480px) {
        .property-type-grid {
            grid-template-columns: repeat(2, 1fr);
        }
        
        .property-type-btn svg {
            width: 40px;
            height: 40px;
        }
        
        .gite-card-actions {
            flex-wrap: wrap;
        }
    }
`;
document.head.appendChild(gitesStyles);
// CSS Neo-Brutalism chargé

// ================================================================
// GESTION DE L'ORDRE D'AFFICHAGE
// ================================================================

window.moveGiteOrder = async function(giteId, direction) {
    try {
        console.log(`🔄 Déplacement du gîte ${giteId} vers ${direction}`);
        
        // Trouver la carte du gîte dans le DOM
        const currentCard = document.querySelector(`.gite-card-modern[data-gite-id="${giteId}"]`);
        if (!currentCard) {
            console.error('Carte du gîte non trouvée');
            return;
        }
        
        // Trouver la carte à échanger
        const targetCard = direction === 'up' ? currentCard.previousElementSibling : currentCard.nextElementSibling;
        if (!targetCard || !targetCard.classList.contains('gite-card-modern')) {
            if (typeof showToast === 'function') {
                showToast('Impossible de déplacer le gîte', 'warning');
            }
            return;
        }
        
        // Déplacer dans le gestionnaire (maintenant async)
        const success = await window.gitesManager.moveGite(giteId, direction);
        if (!success) return;
        
        // Échanger visuellement les cartes dans le DOM
        if (direction === 'up') {
            currentCard.parentNode.insertBefore(currentCard, targetCard);
        } else {
            currentCard.parentNode.insertBefore(targetCard, currentCard);
        }
        
        // Mettre à jour les numéros d'ordre
        const allCards = document.querySelectorAll('.gite-card-modern');
        allCards.forEach((card, index) => {
            const orderNumber = card.querySelector('.gite-order-number-modern');
            if (orderNumber) {
                orderNumber.textContent = index + 1;
            }
            
            // Mettre à jour l'état des boutons
            const upBtn = card.querySelector('button[onclick*="up"]');
            const downBtn = card.querySelector('button[onclick*="down"]');
            
            if (upBtn) {
                if (index === 0) {
                    upBtn.disabled = true;
                    upBtn.classList.add('disabled');
                } else {
                    upBtn.disabled = false;
                    upBtn.classList.remove('disabled');
                }
            }
            
            if (downBtn) {
                if (index === allCards.length - 1) {
                    downBtn.disabled = true;
                    downBtn.classList.add('disabled');
                } else {
                    downBtn.disabled = false;
                    downBtn.classList.remove('disabled');
                }
            }
        });
        
        // Animation de feedback
        currentCard.style.transition = 'transform 0.2s';
        currentCard.style.transform = 'scale(1.05)';
        setTimeout(() => {
            currentCard.style.transform = 'scale(1)';
        }, 200);
        
    } catch (error) {
        console.error('Erreur lors du réordonnancement:', error);
        if (typeof showToast === 'function') {
            showToast('❌ Erreur', 'error');
        }
    }
};

// ================================================================
// CONFIGURATION URLS iCAL - INTERFACE PROPRE
// ================================================================

/**
 * Afficher la modale de configuration des URLs iCal pour un gîte
 */
window.showIcalConfig = async function(giteId) {
    try {
        const gite = await window.gitesManager.getById(giteId);
        if (!gite) {
            throw new Error('Gîte introuvable');
        }

        // Récupérer les URLs actuelles (format unifié objet)
        let icalSources = gite.ical_sources || {};
        
        // Si c'est un tableau (ancien format), convertir en objet
        if (Array.isArray(icalSources)) {
            const converted = {};
            icalSources.forEach(source => {
                if (source.platform && source.url) {
                    converted[source.platform] = source.url;
                }
            });
            icalSources = converted;
        }

        // Créer la modale
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.style.zIndex = '10001';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 600px;">
                <div class="modal-header">
                    <h2>
                        <svg class="icon-inline" width="28" height="28" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.5">
                            <rect x="8" y="12" width="32" height="28" rx="2"/>
                            <path d="M8 20 L40 20"/>
                            <circle cx="16" cy="28" r="2" fill="currentColor"/>
                            <circle cx="24" cy="28" r="2" fill="currentColor"/>
                            <circle cx="32" cy="28" r="2" fill="currentColor"/>
                        </svg>
                        URLs iCal - ${gite.name}
                    </h2>
                    <button class="btn-close" onclick="this.closest('.modal-overlay').remove()">✕</button>
                </div>
                <div class="modal-body" style="padding: 24px;">
                    <p class="help-text" style="margin-bottom: 20px; color: #636e72;">
                        📌 <strong>Comment obtenir vos URLs iCal ?</strong><br>
                        • <strong>Airbnb</strong>: Calendrier → Disponibilité → Exporter le calendrier<br>
                        • <strong>Abritel</strong>: Calendrier → Synchroniser les calendriers → URL iCal<br>
                        • <strong>Gîtes de France</strong>: Espace pro → Calendrier → Flux iCal
                    </p>

                    <div class="form-group" style="margin-bottom: 16px;">
                        <label style="display: block; margin-bottom: 8px; font-weight: 600;">
                            <svg width="20" height="20" viewBox="0 0 48 48" fill="none" stroke="#FF5A5F" stroke-width="2.5" style="vertical-align: middle; margin-right: 6px;">
                                <circle cx="24" cy="24" r="18"/>
                                <path d="M16 20 C16 16 18 14 24 14 C30 14 32 16 32 20 C32 24 28 26 24 28 L24 32"/>
                            </svg>
                            Airbnb
                        </label>
                        <input 
                            type="url" 
                            id="ical-airbnb" 
                            class="input-neo" 
                            placeholder="https://www.airbnb.fr/calendar/ical/..."
                            value="${icalSources.airbnb || ''}"
                            style="width: 100%; padding: 10px; font-size: 14px;"
                        >
                    </div>

                    <div class="form-group" style="margin-bottom: 16px;">
                        <label style="display: block; margin-bottom: 8px; font-weight: 600;">
                            <svg width="20" height="20" viewBox="0 0 48 48" fill="none" stroke="#003580" stroke-width="2.5" style="vertical-align: middle; margin-right: 6px;">
                                <rect x="12" y="14" width="24" height="20" rx="2"/>
                                <path d="M12 22 L36 22"/>
                            </svg>
                            Abritel
                        </label>
                        <input 
                            type="url" 
                            id="ical-abritel" 
                            class="input-neo" 
                            placeholder="http://www.abritel.fr/icalendar/..."
                            value="${icalSources.abritel || ''}"
                            style="width: 100%; padding: 10px; font-size: 14px;"
                        >
                    </div>

                    <div class="form-group" style="margin-bottom: 16px;">
                        <label style="display: block; margin-bottom: 8px; font-weight: 600;">
                            <svg width="20" height="20" viewBox="0 0 48 48" fill="none" stroke="#2ecc71" stroke-width="2.5" style="vertical-align: middle; margin-right: 6px;">
                                <path d="M8 14 L24 8 L40 14 L24 20 L8 14"/>
                                <path d="M8 24 L24 30 L40 24"/>
                                <path d="M8 34 L24 40 L40 34"/>
                            </svg>
                            Gîtes de France
                        </label>
                        <input 
                            type="url" 
                            id="ical-gites-de-france" 
                            class="input-neo" 
                            placeholder="https://reservation.itea.fr/iCal_..."
                            value="${icalSources['gites-de-france'] || icalSources['gites_de_france'] || ''}"
                            style="width: 100%; padding: 10px; font-size: 14px;"
                        >
                    </div>

                    <div class="form-group" style="margin-bottom: 24px;">
                        <label style="display: block; margin-bottom: 8px; font-weight: 600;">
                            <svg width="20" height="20" viewBox="0 0 48 48" fill="none" stroke="#9b59b6" stroke-width="2.5" style="vertical-align: middle; margin-right: 6px;">
                                <circle cx="24" cy="24" r="18"/>
                                <circle cx="24" cy="24" r="10"/>
                                <circle cx="24" cy="24" r="3" fill="currentColor"/>
                            </svg>
                            Autre plateforme
                        </label>
                        <input 
                            type="url" 
                            id="ical-autre" 
                            class="input-neo" 
                            placeholder="https://..."
                            value="${icalSources.autre || icalSources.other || ''}"
                            style="width: 100%; padding: 10px; font-size: 14px;"
                        >
                    </div>

                    <div class="alert alert-info" style="background: #e3f2fd; border-left: 4px solid #2196f3; padding: 12px; margin-bottom: 20px;">
                        <strong>💡 Astuce :</strong> Laissez vides les URLs des plateformes que vous n'utilisez pas.
                    </div>

                    <div style="display: flex; gap: 12px; justify-content: flex-end;">
                        <button class="btn-neo secondary" onclick="this.closest('.modal-overlay').remove()">
                            Annuler
                        </button>
                        <button class="btn-neo" onclick="window.saveIcalConfig('${giteId}')">
                            <svg width="18" height="18" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.5" style="vertical-align: middle; margin-right: 6px;">
                                <path d="M8 24 L18 34 L40 12"/>
                            </svg>
                            Sauvegarder
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

    } catch (error) {
        console.error('Erreur showIcalConfig:', error);
        if (typeof showToast === 'function') {
            showToast('❌ Erreur lors du chargement', 'error');
        }
    }
};

/**
 * Sauvegarder la configuration iCal
 */
window.saveIcalConfig = async function(giteId) {
    try {
        // Récupérer les valeurs des champs
        const airbnb = document.getElementById('ical-airbnb').value.trim();
        const abritel = document.getElementById('ical-abritel').value.trim();
        const gitesDeFrance = document.getElementById('ical-gites-de-france').value.trim();
        const autre = document.getElementById('ical-autre').value.trim();

        // Construire l'objet ical_sources (format unifié)
        const icalSources = {};
        if (airbnb) icalSources.airbnb = airbnb;
        if (abritel) icalSources.abritel = abritel;
        if (gitesDeFrance) icalSources['gites-de-france'] = gitesDeFrance;
        if (autre) icalSources.autre = autre;

        // Sauvegarder en BDD
        const { data: userData } = await window.supabaseClient.auth.getUser();
        const { error } = await window.supabaseClient
            .from('gites')
            .update({ ical_sources: icalSources })
            .eq('id', giteId)
            .eq('owner_user_id', userData.user.id);

        if (error) throw error;

        // Invalider le cache
        window.invalidateCache('gites');

        // Fermer la modale
        document.querySelector('.modal-overlay').remove();

        // Message de succès
        if (typeof showToast === 'function') {
            showToast('✅ URLs iCal sauvegardées !', 'success');
        }

        // Rafraîchir la liste des gîtes
        if (typeof window.showGitesManager === 'function') {
            await window.showGitesManager();
        }

    } catch (error) {
        console.error('Erreur saveIcalConfig:', error);
        if (typeof showToast === 'function') {
            showToast('❌ Erreur lors de la sauvegarde', 'error');
        }
    }
};

// ================================================================
// VÉRIFICATION AU CHARGEMENT - DÉSACTIVÉ
// ================================================================

// AUTO-LOAD DÉSACTIVÉ - Les gîtes se chargent uniquement quand l'utilisateur
// clique sur "Gîtes" ou ouvre un modal qui en a besoin
// Cela améliore les performances et évite les chargements inutiles au démarrage
