/**
 * MODULE DÉCOUVRIR - Gestion des Activités
 * Version modernisée utilisant la table activites_gites
 */

// ==================== VARIABLES GLOBALES ====================
let googleMap = null;
let allMarkers = [];
let activitesCache = [];
let categorieActive = null;

// Icônes et couleurs par catégorie
const CATEGORIES_CONFIG = {
    'Restaurant': { icon: '<svg style="width:16px;height:16px;stroke:currentColor;display:inline;vertical-align:middle;margin-right:4px;" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/></svg>', color: '#FF8C00' },
    'Café/Bar': { icon: '<svg style="width:16px;height:16px;stroke:currentColor;display:inline;vertical-align:middle;margin-right:4px;" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 8h1a4 4 0 1 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/><line x1="6" x2="6" y1="2" y2="4"/><line x1="10" x2="10" y1="2" y2="4"/><line x1="14" x2="14" y1="2" y2="4"/></svg>', color: '#3498DB' },
    'Musée': { icon: '<svg style="width:16px;height:16px;stroke:currentColor;display:inline;vertical-align:middle;margin-right:4px;" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 14.2 0L21 21"/><path d="M12 2v7"/><path d="M12 13a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"/></svg>', color: '#9B59B6' },
    'Château': { icon: '<svg style="width:16px;height:16px;stroke:currentColor;display:inline;vertical-align:middle;margin-right:4px;" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18"/><path d="M4 10h16"/><path d="M6 10V4"/><path d="M10 10V4"/><path d="M14 10V4"/><path d="M18 10V4"/><path d="M4 21V10"/><path d="M20 21V10"/><path d="M8 14h8"/><path d="M8 18h8"/></svg>', color: '#9B59B6' },
    'Parc': { icon: '<svg style="width:16px;height:16px;stroke:currentColor;display:inline;vertical-align:middle;margin-right:4px;" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 13v8"/><path d="M12 3v3"/><path d="M18 6a5 5 0 0 0-5-5 5 5 0 0 0-5 5c0 5 5 5 5 5s5 0 5-5Z"/><path d="M17 14a5 5 0 0 0-5-5 5 5 0 0 0-5 5c0 5 5 5 5 5s5 0 5-5Z"/></svg>', color: '#27AE60' },
    'Hôtel': { icon: '<svg style="width:16px;height:16px;stroke:currentColor;display:inline;vertical-align:middle;margin-right:4px;" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2"/><path d="M3 11h18M3 15h18"/><path d="M3 19a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2"/><circle cx="7" cy="11" r=".5"/><circle cx="7" cy="15" r=".5"/></svg>', color: '#3498DB' },
    'Attraction': { icon: '<svg style="width:16px;height:16px;stroke:currentColor;display:inline;vertical-align:middle;margin-right:4px;" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>', color: '#E74C3C' }
};

// ==================== INITIALISATION ====================
async function initModuleDecouvrir() {
    try {
        await chargerGites();
        genererFiltresCategories();
        attacherEvenements();
    } catch (error) {
        console.error('❌ Erreur init module découvrir:', error);
    }
}

// ==================== CHARGER LES GÎTES ====================
async function chargerGites() {
    try {
        const select = document.getElementById('selectGiteDecouvrir');
        if (!select) {
            console.error('❌ Élément selectGiteDecouvrir introuvable');
            return;
        }

        if (window.gitesManager) {
            const gites = await window.gitesManager.getVisibleGites();
            
            if (gites && gites.length > 0) {
                select.innerHTML = '<option value="">Tous les gîtes</option>';
                gites.forEach(gite => {
                    const option = document.createElement('option');
                    option.value = gite.id;
                    option.textContent = gite.name || gite.nom;
                    select.appendChild(option);
                });
                
                // Charger les activités du premier gîte par défaut
                select.value = gites[0].id;
                await chargerActivitesGite(gites[0].id);
            } else {
                select.innerHTML = '<option value="">Aucun gîte disponible</option>';
            }
        } else {
            console.error('❌ gitesManager non disponible');
        }
    } catch (error) {
        console.error('❌ Erreur chargement gîtes:', error);
    }
}

// ==================== CHARGER LES ACTIVITÉS D'UN GÎTE ====================
async function chargerActivitesGite(giteId) {
    try {
        document.getElementById('nbActivites').textContent = '⏳';
        
        const query = window.supabaseClient
            .from('activites_gites')
            .select('*')
            .eq('owner_user_id', (await window.supabaseClient.auth.getUser()).data.user.id)
            .eq('is_active', true);
        
        // Filtrer par gîte si spécifié
        if (giteId) {
            query.eq('gite_id', giteId);
        }
        
        const { data, error } = await query;
        
        if (error) {
            console.error('Erreur chargement activités:', error);
            return;
        }
        
        activitesCache = data || [];
        
        // Mettre à jour le compteur
        document.getElementById('nbActivites').textContent = activitesCache.length;
        
        // Afficher les activités
        afficherActivites(activitesCache);
        
        // Mettre à jour la carte si visible
        if (document.getElementById('mapActivitesContainer').style.display !== 'none') {
            afficherActivitesSurCarte(activitesCache);
        }
        
    } catch (error) {
        console.error('Erreur:', error);
    }
}

// ==================== GÉNÉRER LES FILTRES CATÉGORIES ====================
function genererFiltresCategories() {
    const container = document.getElementById('filtresCategories');
    if (!container) return;
    
    let html = `
        <button class="btn-filtre active" data-categorie="" style="background: #6366f1; color: white; padding: 10px 16px; border: 2px solid #2D3436; box-shadow: 2px 2px 0 #2D3436; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 0.9rem; transition: all 0.2s;">
            <svg style="width:16px;height:16px;stroke:currentColor;display:inline;vertical-align:middle;margin-right:4px;" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11H3v2h6m-6 4h6m6 3H9v-2h6m0-4H9V9h6m0-4H9V3h6m5 18v-7h-2v7m-2-18h2v7h-2"/></svg> Tous
        </button>
    `;
    
    Object.entries(CATEGORIES_CONFIG).forEach(([cat, config]) => {
        html += `
            <button class="btn-filtre" data-categorie="${cat}" style="background: ${config.color}; color: white; padding: 10px 16px; border: 2px solid #2D3436; box-shadow: 2px 2px 0 #2D3436; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 0.9rem; transition: all 0.2s;">
                ${config.icon} ${cat}
            </button>
        `;
    });
    
    if (window.SecurityUtils) {
        window.SecurityUtils.setInnerHTML(container, html);
    } else {
        container.innerHTML = html;
    }
    
    // Attacher les événements
    container.querySelectorAll('.btn-filtre').forEach(btn => {
        btn.addEventListener('click', function() {
            // Retirer la classe active de tous les boutons
            container.querySelectorAll('.btn-filtre').forEach(b => b.classList.remove('active'));
            // Ajouter la classe active au bouton cliqué
            this.classList.add('active');
            
            const categorie = this.dataset.categorie;
            filtrerParCategorie(categorie);
        });
    });
}

// ==================== FILTRER PAR CATÉGORIE ====================
function filtrerParCategorie(categorie) {
    categorieActive = categorie;
    
    let activitesFiltrees = activitesCache;
    if (categorie) {
        activitesFiltrees = activitesCache.filter(a => a.categorie === categorie);
    }
    
    afficherActivites(activitesFiltrees);
    
    // Mettre à jour la carte si elle est visible
    const container = document.getElementById('mapActivitesContainer');
    if (container && container.style.display !== 'none' && googleMap) {
        afficherActivitesSurCarte(activitesFiltrees);
    }
}

// ==================== AFFICHER LES ACTIVITÉS (GRILLE DE CARTES) ====================
function afficherActivites(activites) {
    const grille = document.getElementById('grilleActivites');
    const messageVide = document.getElementById('messageVide');
    
    if (!grille) return;
    
    if (!activites || activites.length === 0) {
        grille.style.display = 'none';
        if (messageVide) messageVide.style.display = 'block';
        return;
    }
    
    grille.style.display = 'grid';
    if (messageVide) messageVide.style.display = 'none';
    
    let html = '';
    activites.forEach(act => {
        const config = CATEGORIES_CONFIG[act.categorie] || { icon: '<svg style="width:16px;height:16px;stroke:currentColor;display:inline;vertical-align:middle;margin-right:4px;" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>', color: '#95a5a6' };
        
        html += `
            <div class="card-activite card-neo-bordered">
                
                <!-- Header de la carte -->
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 15px;">
                    <div style="flex: 1;">
                        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
                            <span style="font-size: 1.8rem;">${config.icon}</span>
                            <h3 style="margin: 0; font-size: 1.2rem; color: var(--text);">${escapeHtml(act.nom)}</h3>
                        </div>
                        <span style="display: inline-block; background: ${config.color}; color: white; padding: 4px 12px; border-radius: 20px; font-size: 0.85rem; font-weight: 600;">
                            ${act.categorie}
                        </span>
                    </div>
                    <button class="btn-reservation btn-reservation-edit btn-editer-activite" data-activite-id="${act.id}" title="Modifier">
                        <svg style="width:16px;height:16px;stroke:currentColor;" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                </div>
                
                <!-- Description -->
                ${act.description ? `
                <p style="color: var(--text-secondary); line-height: 1.6; margin-bottom: 15px; font-size: 0.95rem;">
                    ${escapeHtml(act.description)}
                </p>
                ` : ''}
                
                <!-- Informations -->
                <div style="display: flex; flex-wrap: wrap; gap: 12px; font-size: 0.9rem; color: #555; margin-bottom: 15px;">
                    ${act.distance_km ? `
                    <div style="display: flex; align-items: center; gap: 5px;">
                        <svg style="width:16px;height:16px;stroke:currentColor;" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                        <span>${act.distance_km} km</span>
                    </div>
                    ` : ''}
                    ${act.telephone ? `
                    <div style="display: flex; align-items: center; gap: 5px;">
                        <svg style="width:16px;height:16px;stroke:currentColor;" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                        <a href="tel:${act.telephone}" style="color: #555; text-decoration: none;">${escapeHtml(act.telephone)}</a>
                    </div>
                    ` : ''}
                    ${act.note ? `
                    <div style="display: flex; align-items: center; gap: 5px;">
                        <svg style="width:16px;height:16px;stroke:currentColor;fill:currentColor;" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                        <span><strong>${act.note}</strong>/5</span>
                    </div>
                    ` : ''}
                    ${act.nb_avis ? `
                    <div style="display: flex; align-items: center; gap: 5px;">
                        <svg style="width:16px;height:16px;stroke:currentColor;" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                        <span>${act.nb_avis} avis</span>
                    </div>
                    ` : ''}
                </div>
                
                <!-- Boutons d'action -->
                <div style="display: grid; grid-template-columns: ${act.url ? '1fr 1fr' : '1fr'}; gap: 10px; margin-top: 15px; padding-top: 15px; border-top: 2px solid #e0e0e0;">
                    ${act.url ? `
                    <a href="${escapeHtml(act.url)}" target="_blank" rel="noopener noreferrer" style="text-decoration: none;">
                        <button style="width: 100%; background: #3498db; color: white; border: none; padding: 10px; border-radius: 8px; font-weight: 600; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center; gap: 8px;" 
                                onmouseover="this.style.background='#2980b9'" 
                                onmouseout="this.style.background='#3498db'">
                            <svg style="width:18px;height:18px;stroke:currentColor;" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg> Site web
                        </button>
                    </a>
                    ` : ''}
                    <button class="btn-supprimer-activite" data-activite-id="${act.id}" data-activite-nom="${escapeHtml(act.nom)}" 
                            style="width: 100%; background: #e74c3c; color: white; border: none; padding: 10px; border-radius: 8px; font-weight: 600; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center; gap: 8px;" 
                            onmouseover="this.style.background='#c0392b'" 
                            onmouseout="this.style.background='#e74c3c'">
                        <svg style="width:18px;height:18px;stroke:currentColor;" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg> Supprimer
                    </button>
                </div>
            </div>
        `;
    });
    
    if (window.SecurityUtils) {
        window.SecurityUtils.setInnerHTML(grille, html);
    } else {
        grille.innerHTML = html;
    }
    
    // Attacher les événements sur les boutons éditer/supprimer
    document.querySelectorAll('.btn-editer-activite').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            ouvrirModalActivite(this.dataset.activiteId);
        });
    });
    
    document.querySelectorAll('.btn-supprimer-activite').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            if (window.supprimerActivite) {
                window.supprimerActivite(this.dataset.activiteId, this.dataset.activiteNom);
            }
        });
    });
}

// ==================== ATTACHER LES ÉVÉNEMENTS ====================
function attacherEvenements() {
    // Changement de gîte
    const selectGite = document.getElementById('selectGiteDecouvrir');
    if (selectGite) {
        selectGite.addEventListener('change', function() {
            chargerActivitesGite(this.value || null);
        });
    }
    
    // Bouton ajouter activité
    const btnAjouter = document.getElementById('btnAjouterActivite');
    if (btnAjouter) {
        btnAjouter.addEventListener('click', ouvrirModalActivite);
    }
    
    // Toggle carte
    const btnToggle = document.getElementById('btnToggleCarte');
    if (btnToggle) {
        btnToggle.addEventListener('click', toggleCarte);
    }
    
    // Fermeture modal
    const btnFermer = document.getElementById('btnFermerModal');
    const btnAnnuler = document.getElementById('btnAnnulerModal');
    const overlay = document.getElementById('modalActiviteOverlay');
    
    if (btnFermer) btnFermer.addEventListener('click', fermerModalActivite);
    if (btnAnnuler) btnAnnuler.addEventListener('click', fermerModalActivite);
    if (overlay) overlay.addEventListener('click', fermerModalActivite);
    
    // Formulaire
    const form = document.getElementById('formActivite');
    if (form) {
        form.addEventListener('submit', sauvegarderActivite);
    }
    
    // Génération PDF
    const btnPDF = document.getElementById('btnGenererPDF');
    if (btnPDF) {
        btnPDF.addEventListener('click', genererGuidePDF);
    }
    
    // Bouton Calculer GPS
    const btnCalculerGPS = document.getElementById('btnCalculerGPS');
    if (btnCalculerGPS) {
        btnCalculerGPS.addEventListener('click', calculerGPSActivite);
    }
}

// ==================== MODAL: OUVRIR ====================
function ouvrirModalActivite(activiteId = null) {
    const overlay = document.getElementById('modalActiviteOverlay');
    const dialog = document.getElementById('modalActiviteDialog');
    const titre = document.getElementById('modalTitre');
    const form = document.getElementById('formActivite');
    
    if (!overlay || !dialog) return;
    
    // Réinitialiser le formulaire
    if (form) form.reset();
    
    if (activiteId) {
        // Mode édition
        titre.textContent = '✏️ Modifier l\'activité';
        const activite = activitesCache.find(a => a.id === activiteId);
        if (activite) {
            document.getElementById('activite_id').value = activite.id;
            document.getElementById('activite_nom').value = activite.nom || '';
            document.getElementById('activite_categorie').value = activite.categorie || '';
            document.getElementById('activite_description').value = activite.description || '';
            document.getElementById('activite_adresse').value = activite.adresse || '';
            document.getElementById('activite_distance_km').value = activite.distance_km || '';
            document.getElementById('activite_url').value = activite.url || '';
            document.getElementById('activite_telephone').value = activite.telephone || '';
            document.getElementById('activite_latitude').value = activite.latitude || '';
            document.getElementById('activite_longitude').value = activite.longitude || '';
            document.getElementById('activite_note').value = activite.note || '';
            document.getElementById('activite_nb_avis').value = activite.nb_avis || '';
        }
    } else {
        // Mode ajout
        titre.textContent = '➕ Nouvelle Activité';
        document.getElementById('activite_id').value = '';
        
        // Récupérer le gîte sélectionné
        const selectGite = document.getElementById('selectGiteDecouvrir');
        if (selectGite && selectGite.value) {
            document.getElementById('activite_gite_id').value = selectGite.value;
        }
    }
    
    overlay.style.display = 'block';
    dialog.style.display = 'block';
}

// ==================== MODAL: FERMER ====================
function fermerModalActivite() {
    const overlay = document.getElementById('modalActiviteOverlay');
    const dialog = document.getElementById('modalActiviteDialog');
    
    if (overlay) overlay.style.display = 'none';
    if (dialog) dialog.style.display = 'none';
}

// ==================== CALCULER GPS DEPUIS ADRESSE ====================
async function calculerGPSActivite() {
    const adresseField = document.getElementById('activite_adresse');
    const latField = document.getElementById('activite_latitude');
    const lonField = document.getElementById('activite_longitude');
    const distanceField = document.getElementById('activite_distance_km');
    
    const adresse = adresseField?.value?.trim();
    
    if (!adresse) {
        showToast('⚠️ Veuillez saisir une adresse', 'warning');
        return;
    }
    
    showToast('🔍 Recherche des coordonnées GPS...', 'info');
    
    try {
        // Attendre 1.1s pour respecter les limites de Nominatim
        await new Promise(resolve => setTimeout(resolve, 1100));
        
        const encodedAddress = encodeURIComponent(adresse + ', France');
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1&addressdetails=1`;
        
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'GiteManager/1.0'
            }
        });
        
        if (!response.ok) {
            showToast('❌ Erreur lors de la recherche GPS', 'error');
            return;
        }
        
        const data = await response.json();
        
        if (data && data.length > 0) {
            const lat = parseFloat(data[0].lat).toFixed(8);
            const lon = parseFloat(data[0].lon).toFixed(8);
            
            latField.value = lat;
            lonField.value = lon;
            
            // Calculer la distance depuis le gîte sélectionné
            const selectGite = document.getElementById('selectGiteDecouvrir');
            if (selectGite && selectGite.value && window.gitesManager) {
                const gite = await window.gitesManager.getById(selectGite.value);
                if (gite) {
                    const coords = await window.gitesManager.getCoordinates(gite.id);
                    if (coords && coords.lat && coords.lng) {
                        const distance = calculerDistance(coords.lat, coords.lng, lat, lon);
                        distanceField.value = distance.toFixed(1);
                    }
                }
            }
            
            showToast(`✅ GPS trouvé: ${data[0].display_name.substring(0, 80)}...`, 'success');
        } else {
            showToast('⚠️ Adresse non trouvée. Vérifiez le format (ex: "46160 Calvignac")', 'warning');
        }
    } catch (error) {
        console.error('❌ Erreur géocodage:', error);
        showToast('❌ Erreur lors du calcul GPS', 'error');
    }
}

// ==================== CALCULER DISTANCE (HAVERSINE) ====================
function calculerDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Rayon de la Terre en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    return distance;
}

// ==================== SAUVEGARDER ACTIVITÉ ====================
async function sauvegarderActivite(e) {
    if (e) e.preventDefault();
    
    try {
        const activiteId = document.getElementById('activite_id').value;
        const giteId = document.getElementById('activite_gite_id').value || document.getElementById('selectGiteDecouvrir').value;
        
        if (!giteId) {
            showToast('❌ Veuillez sélectionner un gîte', 'error');
            return;
        }
        
        const user = (await window.supabaseClient.auth.getUser()).data.user;
        if (!user) {
            showToast('❌ Utilisateur non authentifié', 'error');
            return;
        }
        
        const data = {
            owner_user_id: user.id,
            gite_id: giteId,
            nom: document.getElementById('activite_nom').value,
            categorie: document.getElementById('activite_categorie').value,
            description: document.getElementById('activite_description').value || null,
            adresse: document.getElementById('activite_adresse').value || null,
            distance_km: document.getElementById('activite_distance_km').value || null,
            url: document.getElementById('activite_url').value || null,
            telephone: document.getElementById('activite_telephone').value || null,
            latitude: document.getElementById('activite_latitude').value || null,
            longitude: document.getElementById('activite_longitude').value || null,
            note: document.getElementById('activite_note').value || null,
            nb_avis: document.getElementById('activite_nb_avis').value || null,
            is_active: true
        };
        
        let result;
        if (activiteId) {
            // UPDATE
            result = await window.supabaseClient
                .from('activites_gites')
                .update(data)
                .eq('id', activiteId);
        } else {
            // INSERT
            result = await window.supabaseClient
                .from('activites_gites')
                .insert(data);
        }
        
        if (result.error) {
            console.error('Erreur sauvegarde:', result.error);
            showToast('❌ Erreur lors de la sauvegarde', 'error');
            return;
        }
        
        showToast(`✅ Activité ${activiteId ? 'modifiée' : 'ajoutée'} avec succès`, 'success');
        fermerModalActivite();
        
        // Recharger les activités
        const selectGite = document.getElementById('selectGiteDecouvrir');
        await chargerActivitesGite(selectGite ? selectGite.value : null);
        
    } catch (error) {
        console.error('Erreur:', error);
        showToast('❌ Erreur lors de la sauvegarde', 'error');
    }
}

// ==================== ÉDITER ACTIVITÉ ====================
window.editerActivite = function(activiteId) {
    ouvrirModalActivite(activiteId);
};

// ==================== SUPPRIMER ACTIVITÉ ====================
window.supprimerActivite = async function(activiteId, nom) {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer "${nom}" ?`)) {
        return;
    }
    
    try {
        const { error } = await window.supabaseClient
            .from('activites_gites')
            .delete()
            .eq('id', activiteId);
        
        if (error) {
            console.error('Erreur suppression:', error);
            showToast('❌ Erreur lors de la suppression', 'error');
            return;
        }
        
        showToast('✅ Activité supprimée', 'success');
        
        // Recharger les activités
        const selectGite = document.getElementById('selectGiteDecouvrir');
        await chargerActivitesGite(selectGite ? selectGite.value : null);
        
    } catch (error) {
        console.error('Erreur:', error);
        showToast('❌ Erreur lors de la suppression', 'error');
    }
};

// ==================== TOGGLE CARTE ====================
function toggleCarte() {
    const container = document.getElementById('mapActivitesContainer');
    const btn = document.getElementById('btnToggleCarte');
    
    if (!container || !btn) return;
    
    if (container.style.display === 'none') {
        container.style.display = 'block';
        btn.textContent = '🗺️ Masquer la carte';
        
        // Initialiser ou mettre à jour la carte
        setTimeout(() => {
            initLeafletMap();
            afficherActivitesSurCarte(categorieActive ? activitesCache.filter(a => a.categorie === categorieActive) : activitesCache);
        }, 100);
    } else {
        container.style.display = 'none';
        btn.textContent = '🗺️ Afficher la carte';
    }
}

// ==================== INITIALISER LEAFLET MAP ====================
function initLeafletMap() {
    const container = document.getElementById('mapActivitesContainer');
    if (!container) return;
    
    // Si la carte existe déjà, la supprimer pour recréer
    if (googleMap) {
        googleMap.remove();
        googleMap = null;
    }
    
    // Centre par défaut (France)
    const centerLat = 44.5;
    const centerLng = 1.5;
    
    // Créer la carte Leaflet
    googleMap = L.map('mapActivitesContainer').setView([centerLat, centerLng], 10);
    
    // Ajouter les tuiles OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18
    }).addTo(googleMap);
    
    allMarkers = [];
}

// ==================== AFFICHER ACTIVITÉS SUR CARTE ====================
async function afficherActivitesSurCarte(activites) {
    if (!googleMap) {
        initLeafletMap();
    }
    
    // Supprimer les anciens marqueurs
    allMarkers.forEach(marker => marker.remove());
    allMarkers = [];
    
    // Récupérer le gîte sélectionné
    const selectGite = document.getElementById('selectGiteDecouvrir');
    let giteCoords = null;
    
    if (selectGite && selectGite.value && window.gitesManager) {
        const gite = await window.gitesManager.getById(selectGite.value);
        
        if (gite) {
            giteCoords = await window.gitesManager.getCoordinates(gite.id);
            
            // Ajouter le marqueur du gîte (maison)
            if (giteCoords && giteCoords.lat && giteCoords.lng) {
                // Marqueur rouge pour le gîte
                const homeIcon = new L.Icon({
                    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
                    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
                    iconSize: [25, 41],
                    iconAnchor: [12, 41],
                    popupAnchor: [1, -34],
                    shadowSize: [41, 41]
                });
                
                const homeMarker = L.marker([giteCoords.lat, giteCoords.lng], { icon: homeIcon })
                    .bindPopup(`<b>🏠 ${gite.name || gite.nom}</b><br>Votre gîte`)
                    .addTo(googleMap);
                
                allMarkers.push(homeMarker);
            }
        }
    }
    
    // Ajouter les marqueurs des activités
    const bounds = [];
    
    activites.forEach(act => {
        if (act.latitude && act.longitude) {
            const config = CATEGORIES_CONFIG[act.categorie] || { icon: '<svg style="width:16px;height:16px;stroke:currentColor;display:inline;vertical-align:middle;margin-right:4px;" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>', color: '#95a5a6' };
            
            // Choisir la couleur du marqueur selon la catégorie
            const colorMap = {
                'Restaurant': 'orange',
                'Café/Bar': 'blue',
                'Musée': 'violet',
                'Château': 'violet',
                'Parc': 'green',
                'Hôtel': 'blue',
                'Attraction': 'red'
            };
            const markerColor = colorMap[act.categorie] || 'grey';
            
            const actIcon = new L.Icon({
                iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${markerColor}.png`,
                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
                shadowSize: [41, 41]
            });
            
            const marker = L.marker([parseFloat(act.latitude), parseFloat(act.longitude)], { icon: actIcon })
                .bindPopup(`
                    <div style="min-width: 200px;">
                        <b>${config.icon} ${escapeHtml(act.nom)}</b><br>
                        <span style="color: ${config.color}; font-weight: 600;">${act.categorie}</span><br>
                        ${act.distance_km ? `<svg style="width:14px;height:14px;stroke:currentColor;display:inline;vertical-align:middle;" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg> ${act.distance_km} km<br>` : ''}
                        ${act.note ? `<svg style="width:14px;height:14px;stroke:currentColor;fill:currentColor;display:inline;vertical-align:middle;" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> ${act.note}/5<br>` : ''}
                        ${act.telephone ? `<svg style="width:14px;height:14px;stroke:currentColor;display:inline;vertical-align:middle;" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg> ${escapeHtml(act.telephone)}<br>` : ''}
                        ${act.url ? `<a href="${escapeHtml(act.url)}" target="_blank"><svg style="width:14px;height:14px;stroke:currentColor;display:inline;vertical-align:middle;" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg> Site web</a>` : ''}
                    </div>
                `)
                .addTo(googleMap);
            
            allMarkers.push(marker);
            bounds.push([parseFloat(act.latitude), parseFloat(act.longitude)]);
        }
    });
    
    // Ajouter les coordonnées du gîte aux bounds
    if (giteCoords && giteCoords.lat && giteCoords.lng) {
        bounds.push([giteCoords.lat, giteCoords.lng]);
    }
    
    // Ajuster la vue pour inclure tous les marqueurs
    if (bounds.length > 0) {
        googleMap.fitBounds(bounds, { padding: [50, 50] });
    }
}

// ==================== GÉNÉRER PDF ====================
function genererGuidePDF() {
    showToast('📄 Génération du PDF en cours...', 'info');
    // TODO: Implémenter la génération PDF
    // console.log('Génération PDF pour', activitesCache.length, 'activités');
}

// ==================== HELPERS ====================
function escapeHtml(text) {
    if (!text) return '';
    if (window.SecurityUtils) {
        return window.SecurityUtils.sanitizeText(text);
    }
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function escapeForOnclick(text) {
    if (!text) return '';
    return text.replace(/'/g, '&#39;')
                .replace(/"/g, '&quot;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;');
}

function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    if (toast) {
        toast.textContent = message;
        toast.className = `toast ${type}`;
        toast.style.display = 'block';
        setTimeout(() => {
            toast.style.display = 'none';
        }, 3000);
    } else {
        // console.log(`[${type.toUpperCase()}] ${message}`);
    }
}

// ==================== AUTO-INIT ====================
// NE PAS FAIRE D'AUTO-INIT car le HTML est chargé dynamiquement
// L'initialisation est déclenchée par index.html lors du switch d'onglet

// Export pour utilisation globale
window.initModuleDecouvrir = initModuleDecouvrir;
window.chargerActivitesGite = chargerActivitesGite;
window.ouvrirModalActivite = ouvrirModalActivite;
window.fermerModalActivite = fermerModalActivite;
