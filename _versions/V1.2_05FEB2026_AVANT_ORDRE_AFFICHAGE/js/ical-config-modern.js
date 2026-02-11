// ================================================================
// CONFIGURATION ICAL MODERNE - SYSTÈME DYNAMIQUE
// ================================================================

/**
 * Liste complète des plateformes de location avec métadonnées
 */
window.ICAL_PLATFORMS = {
    'airbnb': { name: 'Airbnb', color: '#FF5A5F', icon: 'home' },
    'booking': { name: 'Booking.com', color: '#003580', icon: 'bed' },
    'abritel': { name: 'Abritel/VRBO', color: '#0051A5', icon: 'key' },
    'gites-de-france': { name: 'Gîtes de France', color: '#2ecc71', icon: 'map-pin' },
    'clevacances': { name: 'Clévacances', color: '#E97E00', icon: 'star' },
    'interhome': { name: 'Interhome', color: '#E20A16', icon: 'building' },
    'belvilla': { name: 'Belvilla', color: '#00A8E1', icon: 'umbrella' },
    'expedia': { name: 'Expedia', color: '#FBCC04', icon: 'plane' },
    'tripadvisor': { name: 'TripAdvisor', color: '#00AF87', icon: 'award' },
    'amivac': { name: 'Amivac', color: '#FF6B35', icon: 'heart' },
    'hometogo': { name: 'HomeToGo', color: '#FF6F61', icon: 'search' },
    'wimdu': { name: 'Wimdu', color: '#00C8AA', icon: 'wifi' },
    'bedycasa': { name: 'BedyCasa', color: '#8B4789', icon: 'bed' },
    'accueil-paysan': { name: 'Accueil Paysan', color: '#6BAA3D', icon: 'tree' },
    'fleurs-de-soleil': { name: 'Fleurs de Soleil', color: '#FFD700', icon: 'sun' },
    'vacances-bleues': { name: 'Vacances Bleues', color: '#0077BE', icon: 'waves' },
    'iha': { name: 'IHA Interchalet', color: '#D32F2F', icon: 'mountain' },
    'bienvenue-ferme': { name: 'Bienvenue à la Ferme', color: '#8BC34A', icon: 'tractor' },
    'custom': { name: 'Personnalisé', color: '#9b59b6', icon: 'edit' }
};

/**
 * Afficher la modal de configuration iCal moderne (REMPLACE l'ancienne)
 */
window.showIcalConfig = async function(giteId) {
    try {
        const gite = await window.gitesManager.getById(giteId);
        if (!gite) {
            throw new Error('Gîte introuvable');
        }

        console.log('🔧 Configuration iCal moderne pour:', gite.name);

        // Récupérer les URLs actuelles (supportant ancien et nouveau format)
        let icalSources = gite.ical_sources || [];
        
        // Si c'est un objet (ancien format), convertir en tableau
        if (!Array.isArray(icalSources)) {
            icalSources = Object.entries(icalSources).map(([platform, url]) => ({
                platform,
                customName: '',
                url
            }));
        }

        // S'assurer qu'il y a au moins une ligne vide
        if (icalSources.length === 0) {
            icalSources.push({ platform: 'airbnb', url: '', customName: '' });
        }

        // Créer la modale moderne
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.style.zIndex = '10001';
        modal.innerHTML = `
            <div class="modal-content-modern" style="max-width: 900px;">
                <div class="modal-header-modern">
                    <h2>
                        <i data-lucide="calendar"></i>
                        URLs iCal - ${gite.name}
                    </h2>
                    <button class="btn-close-modern" onclick="this.closest('.modal-overlay').remove()">
                        <i data-lucide="x"></i>
                    </button>
                </div>
                <div class="modal-body-modern">
                    <div class="alert alert-info" style="background: #e3f2fd; border-left: 4px solid #2196f3; padding: 14px; margin-bottom: 24px; border-radius: 8px; font-size: 0.9rem;">
                        <strong>📌 Comment obtenir vos URLs iCal ?</strong><br>
                        Rendez-vous sur votre plateforme → Calendrier → Exporter/Synchroniser → Copier le lien iCal
                    </div>

                    <div id="ical-sources-container" style="display: flex; flex-direction: column; gap: 12px;">
                        ${icalSources.map((source, index) => window.generateIcalRow(source, index)).join('')}
                    </div>

                    <button class="btn-add-modern" onclick="window.addIcalRow()" style="margin-top: 16px;">
                        <i data-lucide="plus"></i>
                        Ajouter une URL
                    </button>

                    <div class="form-actions-modern" style="margin-top: 32px;">
                        <button class="btn-modern-cancel" onclick="this.closest('.modal-overlay').remove()">
                            Annuler
                        </button>
                        <button class="btn-modern" onclick="window.saveIcalConfigModern('${giteId}')">
                            <i data-lucide="check"></i>
                            Sauvegarder
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Initialiser Lucide
        if (window.lucide) {
            window.lucide.createIcons();
        }

    } catch (error) {
        console.error('Erreur showIcalConfig:', error);
        if (typeof showToast === 'function') {
            showToast('❌ Erreur lors du chargement', 'error');
        }
    }
};

/**
 * Générer une ligne iCal moderne
 */
window.generateIcalRow = function(source = {}, index = 0) {
    const platform = source.platform || 'airbnb';
    const customName = source.customName || '';
    const url = source.url || '';
    const isCustom = platform === 'custom';

    const platformsOptions = Object.entries(window.ICAL_PLATFORMS)
        .map(([key, data]) => `<option value="${key}" ${key === platform ? 'selected' : ''}>${data.name}</option>`)
        .join('');

    return `
        <div class="ical-row-modern" data-index="${index}">
            <div style="display: flex; gap: 10px; align-items: center;">
                <select class="form-select-modern platform-select" onchange="window.handlePlatformChange(this)" style="min-width: 180px;">
                    ${platformsOptions}
                </select>
                <input 
                    type="text" 
                    class="form-input-modern custom-name-input" 
                    placeholder="Nom personnalisé"
                    value="${customName}"
                    style="min-width: 150px; ${isCustom ? '' : 'display: none;'}"
                >
                <input 
                    type="url" 
                    class="form-input-modern url-input" 
                    placeholder="https://..."
                    value="${url}"
                    style="flex: 1; min-width: 200px;"
                >
                <button class="btn-icon-modern delete" onclick="window.removeIcalRow(${index})" title="Supprimer">
                    <i data-lucide="trash-2"></i>
                </button>
            </div>
        </div>
    `;
};

/**
 * Ajouter une nouvelle ligne iCal
 */
window.addIcalRow = function() {
    const container = document.getElementById('ical-sources-container');
    const existingRows = container.querySelectorAll('.ical-row-modern');
    const newIndex = existingRows.length;
    
    const newRow = document.createElement('div');
    newRow.innerHTML = window.generateIcalRow({ platform: 'airbnb', url: '', customName: '' }, newIndex);
    container.appendChild(newRow.firstElementChild);
    
    // Réinitialiser Lucide pour les nouvelles icônes
    if (window.lucide) {
        window.lucide.createIcons();
    }

    // Animation d'entrée
    const addedRow = container.lastElementChild;
    addedRow.style.opacity = '0';
    addedRow.style.transform = 'translateY(-10px)';
    setTimeout(() => {
        addedRow.style.transition = 'all 0.3s';
        addedRow.style.opacity = '1';
        addedRow.style.transform = 'translateY(0)';
    }, 10);
};

/**
 * Supprimer une ligne iCal
 */
window.removeIcalRow = function(index) {
    const container = document.getElementById('ical-sources-container');
    const rows = container.querySelectorAll('.ical-row-modern');
    
    // Empêcher de supprimer si c'est la dernière ligne
    if (rows.length === 1) {
        if (typeof showToast === 'function') {
            showToast('⚠️ Au moins une ligne doit rester', 'warning');
        }
        return;
    }

    const row = document.querySelector(`.ical-row-modern[data-index="${index}"]`);
    if (row) {
        row.style.transition = 'opacity 0.2s, transform 0.2s';
        row.style.opacity = '0';
        row.style.transform = 'translateX(-20px)';
        setTimeout(() => row.remove(), 200);
    }
};

/**
 * Gérer le changement de plateforme
 */
window.handlePlatformChange = function(selectElement) {
    const row = selectElement.closest('.ical-row-modern');
    const customNameInput = row.querySelector('.custom-name-input');
    const isCustom = selectElement.value === 'custom';
    
    if (isCustom) {
        customNameInput.style.display = '';
        customNameInput.focus();
    } else {
        customNameInput.style.display = 'none';
        customNameInput.value = '';
    }
};

/**
 * Sauvegarder la config iCal moderne (NOUVELLE VERSION)
 */
window.saveIcalConfigModern = async function(giteId) {
    try {
        const rows = document.querySelectorAll('.ical-row-modern');
        const icalSources = [];

        rows.forEach(row => {
            const platform = row.querySelector('.platform-select').value;
            const customName = row.querySelector('.custom-name-input').value.trim();
            const url = row.querySelector('.url-input').value.trim();

            if (url) {  // Ne sauvegarder que si l'URL est renseignée
                icalSources.push({
                    platform,
                    customName: platform === 'custom' && customName ? customName : '',
                    url
                });
            }
        });

        console.log('💾 Sauvegarde iCal:', icalSources);

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
            showToast(`✅ ${icalSources.length} URL(s) iCal sauvegardée(s) !`, 'success');
        }

        // Rafraîchir la liste des gîtes si ouverte
        if (document.querySelector('.gites-grid-modern')) {
            await window.showGitesManager();
        }

    } catch (error) {
        console.error('Erreur saveIcalConfigModern:', error);
        if (typeof showToast === 'function') {
            showToast('❌ Erreur lors de la sauvegarde', 'error');
        }
    }
};
