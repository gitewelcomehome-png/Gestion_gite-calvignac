/**
 * MODULE DÉCOUVRIR - Gestion des Activités, POIs et Google Maps
 * Gère l'affichage et la gestion des activités, points d'intérêt et cartes Google Maps
 */

// ==================== VARIABLES GLOBALES ====================
let googleMap = null;
let allMarkers = [];
let googleGiteMarker = null;
let infoWindow = null;
let directionsService = null;
let directionsRenderer = null;

// Initialisation des activités par gîte (important pour les filtres)
if (!window.activitesParGite) {
    window.activitesParGite = { 'Trévoux': [], 'Couzon': [] };
}

// Coordonnées des gîtes
const gitesCoordinates = {
    'Trévoux': { lat: 45.9423, lng: 4.7681 },
    'Couzon': { lat: 45.8456, lng: 4.8234 }
};

// Couleurs par catégorie
const categoryColors = {
    'gite': '#FF5A5F',
    'restaurant': '#FF8C00',
    'Restaurant': '#FF8C00',
    'culture': '#9B59B6',
    'Musée': '#9B59B6',
    'Château': '#9B59B6',
    'nature': '#27AE60',
    'Parc': '#27AE60',
    'shopping': '#3498DB',
    'Café/Bar': '#3498DB',
    'Hôtel': '#3498DB',
    'Attraction': '#3498DB'
};

// Icônes emoji par catégorie
const categoryIcons = {
    'gite': '🏡',
    'restaurant': '🍽️',
    'Restaurant': '🍽️',
    'culture': '🏛️',
    'Musée': '🏛️',
    'Château': '🏰',
    'nature': '🌳',
    'Parc': '🌳',
    'shopping': '🛍️',
    'Café/Bar': '☕',
    'Hôtel': '🏨',
    'Attraction': '🎪'
};

// Mapping des catégories Supabase vers les catégories du filtre
const categoryMapping = {
    'Restaurant': 'restaurant',
    'Musée': 'culture',
    'Château': 'culture',
    'Parc': 'nature',
    'Café/Bar': 'shopping',
    'Hôtel': 'shopping',
    'Attraction': 'nature'
};

// ==================== HELPER: HTML ESCAPING ====================
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Helper pour échapper les attributs onclick
function escapeForOnclick(text) {
    if (!text) return '';
    return text.replace(/'/g, '&#39;')
                .replace(/"/g, '&quot;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/\\/g, '\\\\');
}

// ==================== INITIALISATION GOOGLE MAPS ====================
function initGoogleMap() {
    const giteInput = document.getElementById('decouvrir_gite');
    const giteActuel = giteInput ? giteInput.value : 'Trévoux';
    const centerCoords = gitesCoordinates[giteActuel] || gitesCoordinates['Trévoux'];
    
    // Créer la carte
    googleMap = new google.maps.Map(document.getElementById('googleMap'), {
        center: centerCoords,
        zoom: 13,
        mapTypeControl: true,
        mapTypeControlOptions: {
            style: google.maps.MapTypeControlStyle.DROPDOWN_MENU,
            position: google.maps.ControlPosition.TOP_RIGHT
        },
        streetViewControl: true,
        fullscreenControl: true,
        zoomControl: true,
        styles: [
            {
                featureType: "poi",
                elementType: "labels",
                stylers: [{ visibility: "on" }]
            }
        ]
    });
    
    // Initialiser les services
    infoWindow = new google.maps.InfoWindow();
    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer({
        map: googleMap,
        suppressMarkers: false,
        polylineOptions: {
            strokeColor: '#667eea',
            strokeWeight: 5
        }
    });
    
    // Ajouter le marqueur du gîte
    ajouterMarqueurGite(giteActuel);
    
    // Charger et afficher les POIs
    chargerPOIsFromSupabase(giteActuel);
}

// ==================== AJOUTER LE MARQUEUR DU GÎTE ====================
function ajouterMarqueurGite(nomGite) {
    const coords = gitesCoordinates[nomGite];
    if (!coords) return;
    
    // Supprimer l'ancien marqueur du gîte s'il existe
    if (googleGiteMarker) {
        googleGiteMarker.setMap(null);
    }
    
    googleGiteMarker = new google.maps.Marker({
        position: coords,
        map: googleMap,
        title: `🏡 Gîte ${nomGite}`,
        icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 14,
            fillColor: categoryColors.gite,
            fillOpacity: 1,
            strokeColor: '#fff',
            strokeWeight: 3
        },
        zIndex: 1000,
        animation: google.maps.Animation.DROP
    });
    
    googleGiteMarker.addListener('click', () => {
        infoWindow.setContent(`
            <div style="padding: 15px; max-width: 280px;">
                <h3 style="margin: 0 0 10px 0; color: ${categoryColors.gite}; font-size: 1.2rem;">
                    🏡 Gîte ${nomGite}
                </h3>
                <p style="margin: 5px 0; color: #666;"><strong>📍 Votre point de départ</strong></p>
                <p style="margin: 10px 0 0 0; font-size: 0.9rem; color: #999;">
                    Cliquez sur un point d'intérêt pour calculer l'itinéraire
                </p>
            </div>
        `);
        infoWindow.open(googleMap, googleGiteMarker);
    });
}

// ==================== CHARGER LES POIs DEPUIS SUPABASE ====================
async function chargerPOIsFromSupabase(giteActuel) {
    // Effacer tous les anciens marqueurs POI
    allMarkers.forEach(marker => marker.setMap(null));
    allMarkers = [];
    
    try {
        // Récupérer les données depuis Supabase
        const { data, error } = await window.supabaseClient
            .from('activites_gites')
            .select('*')
            .eq('gite', giteActuel)
            .order('type', { ascending: true });
        
        if (error) throw error;
        
        const pois = data || [];
        
        // Ajouter chaque POI sur la carte
        pois.forEach(poi => {
            ajouterMarqueurPOI(poi, giteActuel);
        });
        
        // Afficher la liste
        afficherListePOIs(pois);
    } catch (error) {
        console.error('Erreur chargement POIs:', error);
        afficherListePOIs([]);
    }
}

// ==================== AJOUTER UN MARQUEUR POI ====================
function ajouterMarqueurPOI(poi, giteActuel) {
    if (!poi.lat || !poi.lng) return;
    
    const category = poi.type || poi.categorie || 'Attraction';
    const filterCategory = categoryMapping[category] || 'shopping';
    
    const marker = new google.maps.Marker({
        position: { 
            lat: parseFloat(poi.lat), 
            lng: parseFloat(poi.lng) 
        },
        map: googleMap,
        title: poi.name,
        icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 11,
            fillColor: categoryColors[category] || '#999',
            fillOpacity: 0.95,
            strokeColor: '#fff',
            strokeWeight: 2
        },
        animation: google.maps.Animation.DROP
    });
    
    // Stocker les données du POI dans le marqueur
    marker.poiData = poi;
    marker.poiCategory = filterCategory;
    
    // Événement click sur le marqueur
    marker.addListener('click', () => {
        const iconEmoji = categoryIcons[category] || '📍';
        const color = categoryColors[category] || '#999';
        
        // Échapper toutes les données utilisateur
        const safeName = escapeHtml(poi.name);
        const safeDescription = escapeHtml(poi.description);
        const safePhone = escapeHtml(poi.phone);
        const safeWebsite = escapeHtml(poi.website);
        const safeNameForOnclick = escapeForOnclick(poi.name);
        
        const contentHTML = `
            <div style="padding: 15px; max-width: 320px;">
                <h3 style="margin: 0 0 10px 0; color: ${color}; font-size: 1.1rem;">
                    ${iconEmoji} ${safeName}
                </h3>
                ${poi.description ? `<p style="margin: 8px 0; color: #666; line-height: 1.5;">${safeDescription}</p>` : ''}
                <div style="margin: 10px 0; display: flex; flex-direction: column; gap: 5px;">
                    ${poi.distance_km ? `<div style="color: #555;"><strong>📍 Distance:</strong> ${poi.distance_km} km</div>` : ''}
                    ${poi.phone ? `<div style="color: #555;"><strong>📞:</strong> ${safePhone}</div>` : ''}
                    ${poi.website ? `<div><a href="${safeWebsite}" target="_blank" rel="noopener noreferrer" style="color: #3498db; text-decoration: none;">🌐 Site web</a></div>` : ''}
                    ${poi.rating ? `<div style="color: #555;"><strong>⭐ Note:</strong> ${poi.rating}/5</div>` : ''}
                </div>
                <button 
                    onclick="calculerItineraire(${poi.lat}, ${poi.lng}, '${safeNameForOnclick}')" 
                    style="margin-top: 12px; padding: 10px 20px; background: #27ae60; color: white; border: none; border-radius: 8px; cursor: pointer; width: 100%; font-weight: 600; font-size: 0.95rem;">
                    🚗 Itinéraire depuis le gîte
                </button>
            </div>
        `;
        
        infoWindow.setContent(contentHTML);
        infoWindow.open(googleMap, marker);
    });
    
    allMarkers.push(marker);
}

// ==================== CALCULER ITINÉRAIRE ====================
function calculerItineraire(destLat, destLng, nomDestination) {
    const giteInput = document.getElementById('decouvrir_gite');
    const giteActuel = giteInput ? giteInput.value : 'Trévoux';
    const origin = gitesCoordinates[giteActuel];
    const destination = { lat: parseFloat(destLat), lng: parseFloat(destLng) };
    
    directionsService.route({
        origin: origin,
        destination: destination,
        travelMode: google.maps.TravelMode.DRIVING
    }, (result, status) => {
        if (status === 'OK') {
            directionsRenderer.setDirections(result);
            
            const route = result.routes[0].legs[0];
            const message = `🚗 Itinéraire calculé vers ${nomDestination}\n\n` +
                          `📍 Distance: ${route.distance.text}\n` +
                          `⏱️ Durée estimée: ${route.duration.text}`;
            
            showToast(message, 'success');
        } else {
            showToast('❌ Impossible de calculer l\'itinéraire: ' + status, 'error');
        }
    });
}

// ==================== CENTRER SUR LE GÎTE ====================
function centrerCarteGite() {
    const giteInput = document.getElementById('decouvrir_gite');
    const giteActuel = giteInput ? giteInput.value : 'Trévoux';
    const coords = gitesCoordinates[giteActuel];
    
    if (coords && googleMap) {
        googleMap.panTo(coords);
        googleMap.setZoom(13);
        
        // Effacer l'itinéraire s'il y en a un
        if (directionsRenderer) {
            directionsRenderer.setDirections({routes: []});
        }
        
        showToast('📍 Carte recentrée sur le gîte', 'info');
    }
}

// ==================== FILTRER PAR CATÉGORIE ====================
function filterMapByCategory() {
    const filter = document.getElementById('mapCategoryFilter').value;
    
    allMarkers.forEach(marker => {
        if (filter === 'all') {
            marker.setVisible(true);
        } else {
            marker.setVisible(marker.poiCategory === filter);
        }
    });
    
    const categoryName = filter === 'all' ? 'toutes les catégories' : filter;
    showToast(`🔍 Filtrage: ${categoryName}`, 'info');
}

// ==================== AFFICHER LA LISTE DES POIs ====================
function afficherListePOIs(pois) {
    const container = document.getElementById('poiListContainer');
    if (!container) return;
    
    if (pois.length === 0) {
        container.innerHTML = `
            <p style="text-align: center; color: #999; padding: 40px; font-size: 1.1rem;">
                📭 Aucun point d'intérêt enregistré pour ce gîte
            </p>
        `;
        return;
    }
    
    const html = pois.map(poi => {
        const category = poi.type || poi.categorie || 'Attraction';
        const iconEmoji = categoryIcons[category] || '📍';
        const color = categoryColors[category] || '#999';
        
        // Échapper toutes les données utilisateur
        const safeName = escapeHtml(poi.name);
        const safeDescription = escapeHtml(poi.description);
        const safePhone = escapeHtml(poi.phone);
        const safeWebsite = escapeHtml(poi.website);
        const safeNameForOnclick = escapeForOnclick(poi.name);
        
        return `
            <div style="background: #f8f9fa; padding: 20px; border-radius: 12px; margin-bottom: 15px; border-left: 5px solid ${color}; transition: all 0.3s;" 
                 onmouseover="this.style.background='#e9ecef'; this.style.transform='translateX(5px)';" 
                 onmouseout="this.style.background='#f8f9fa'; this.style.transform='translateX(0)';">
                <div style="display: flex; justify-content: space-between; align-items: start; gap: 15px; flex-wrap: wrap;">
                    <div style="flex: 1; min-width: 250px;">
                        <h4 style="margin: 0 0 10px 0; color: ${color}; font-size: 1.1rem;">
                            ${iconEmoji} ${safeName}
                        </h4>
                        ${poi.description ? `<p style="margin: 5px 0; color: #666; line-height: 1.6;">${safeDescription}</p>` : ''}
                        <div style="display: flex; gap: 15px; margin-top: 12px; flex-wrap: wrap; font-size: 0.9rem; color: #555;">
                            ${poi.distance_km ? `<span><strong>📍</strong> ${poi.distance_km} km</span>` : ''}
                            ${poi.phone ? `<span><strong>📞</strong> ${safePhone}</span>` : ''}
                            ${poi.website ? `<a href="${safeWebsite}" target="_blank" rel="noopener noreferrer" style="color: #3498db; text-decoration: none;"><strong>🌐</strong> Site web</a>` : ''}
                            ${poi.rating ? `<span><strong>⭐</strong> ${poi.rating}/5</span>` : ''}
                        </div>
                    </div>
                    <div style="display: flex; gap: 10px; flex-direction: column;">
                        <button onclick="zoomOnPOI(${poi.lat}, ${poi.lng}, '${safeNameForOnclick}')" 
                            style="padding: 10px 20px; background: #667eea; color: white; border: none; border-radius: 8px; cursor: pointer; white-space: nowrap; font-weight: 600;">
                            🔍 Voir sur la carte
                        </button>
                        <button onclick="calculerItineraire(${poi.lat}, ${poi.lng}, '${safeNameForOnclick}')" 
                            style="padding: 10px 20px; background: #27ae60; color: white; border: none; border-radius: 8px; cursor: pointer; white-space: nowrap; font-weight: 600;">
                            🚗 Itinéraire
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    container.innerHTML = html;
}

// ==================== ZOOMER SUR UN POI ====================
function zoomOnPOI(lat, lng, name) {
    const position = { lat: parseFloat(lat), lng: parseFloat(lng) };
    googleMap.panTo(position);
    googleMap.setZoom(16);
    
    // Trouver le marqueur correspondant et déclencher son click
    const marker = allMarkers.find(m => 
        m.getPosition().lat() === position.lat && 
        m.getPosition().lng() === position.lng
    );
    
    if (marker) {
        google.maps.event.trigger(marker, 'click');
    }
    
    showToast(`🔍 Zoom sur ${name}`, 'info');
}

// ==================== MODAL ITINÉRAIRE ====================
function afficherItineraireModal() {
    showToast('💡 Cliquez sur un point d\'intérêt sur la carte pour calculer l\'itinéraire !', 'info');
}

// ==================== CHARGER LES ACTIVITÉS ====================
async function chargerActivites() {
    try {
        // Mettre à jour le compteur
        const counter = document.getElementById('activitesCounter');
        if (counter) counter.innerHTML = '⏳ Chargement...';

        const { data, error } = await window.supabaseClient
            .from('activites_gites')
            .select('*')
            .order('categorie', { ascending: true });
        
        if (error) throw error;
        
        if (data) {
            window.activitesParGite = { 'Trévoux': [], 'Couzon': [] };
            data.forEach(act => {
                if (window.activitesParGite[act.gite]) {
                    window.activitesParGite[act.gite].push(act);
                }
            });
            console.log('Activités chargées:', window.activitesParGite);
            
            // Mettre à jour le compteur
            const totalTrevoux = window.activitesParGite['Trévoux'].length;
            const totalCouzon = window.activitesParGite['Couzon'].length;
            const total = totalTrevoux + totalCouzon;
            if (counter) {
                counter.innerHTML = `✅ ${total} activités (🏰 ${totalTrevoux} • ⛰️ ${totalCouzon})`;
            }
        }
        
        // Afficher automatiquement les activités du gîte sélectionné
        const giteSelectionne = document.getElementById('decouvrir_gite')?.value;
        if (giteSelectionne) {
            console.log('Affichage automatique pour:', giteSelectionne);
            afficherActivites(giteSelectionne);
        } else {
            console.log('Aucun gîte sélectionné, affichage de tous');
            afficherToutesLesActivites();
        }
    } catch (error) {
        console.error('Erreur chargement activités:', error);
        const counter = document.getElementById('activitesCounter');
        if (counter) counter.innerHTML = '❌ Erreur';
        showNotification('❌ Erreur lors du chargement des activités', 'error');
    }
}

// ==================== CHARGER TOUT SUR LA CARTE ====================
async function chargerToutSurCarte() {
    const gite = document.getElementById('decouvrir_gite').value;
    if (!gite) return;
    
    showNotification('🗺️ Chargement de la carte...', 'info');
    
    // 1. Charger UNIQUEMENT les événements
    await rechercherEvenements();
    
    // 2. Charger les activités Supabase SÉPARÉMENT pour la carte
    try {
        const { data, error } = await window.supabaseClient
            .from('activites_gites')
            .select('*')
            .eq('gite', gite);
        
        console.log('📊 Activités chargées:', data ? data.length : 0);
        
        if (!error && data && data.length > 0) {
            // Créer tableau séparé pour les activités (pas mélangé avec événements)
            window.allActivites = data.map(act => ({
                titre: act.nom,
                nom: act.nom,
                date: null,
                lieu: act.adresse,
                adresse: act.adresse,
                description: act.description,
                lien: act.website,
                icone: '📍',
                distance: act.distance || 0,
                lat: parseFloat(act.latitude),
                lng: parseFloat(act.longitude),
                note: act.note,
                categorie: act.categorie,
                isActivite: true  // Marqueur pour différencier des événements
            })).filter(a => a.lat && a.lng);  // Garder seulement ceux avec coordonnées
            
            console.log('✅ Activités chargées pour carte:', window.allActivites.length);
        }
    } catch (error) {
        console.error('Erreur chargement activités:', error);
    }
    
    // 3. Afficher activités dans la section dédiée
    afficherActivites(gite);
    
    // Réinitialiser le filtre de distance à 50km pour tout voir
    document.getElementById('distanceFilter').value = 50;
    updateDistanceLabel();
    
    // Afficher TOUT sur la carte (événements + activités)
    const toutSurCarte = [...window.allEvenements, ...(window.allActivites || [])];
    afficherCarteEvenements(toutSurCarte);
    filtrerEvenements();
    
    showNotification(`✓ Carte et activités chargées`, 'success');
}

// ==================== OBTENIR COULEUR CATÉGORIE ====================
function getCategoryColor(categorie) {
    const colors = {
        'Restaurant': { badge: '#10b981', light: '#d1fae5' },
        'Musée': { badge: '#3b82f6', light: '#dbeafe' },
        'Café': { badge: '#f59e0b', light: '#fef3c7' },
        'Parc': { badge: '#8b5cf6', light: '#ede9fe' },
        'Hôtel': { badge: '#ec4899', light: '#fce7f3' }
    };
    return colors[categorie] || { badge: '#667eea', light: '#e0e7ff' };
}

// ==================== AFFICHER TOUTES LES ACTIVITÉS (TOUS GÎTES) ====================
function afficherToutesLesActivites() {
    const container = document.getElementById('activitesParCategorie');
    if (!container) return;
    
    const toutesActivites = [
        ...(window.activitesParGite['Trévoux'] || []),
        ...(window.activitesParGite['Couzon'] || [])
    ];
    
    if (toutesActivites.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #999; padding: 40px;">Aucune activité enregistrée. Cliquez sur un gîte pour commencer.</p>';
        return;
    }
    
    let html = `<h3 style="color: white; font-size: 1.6rem; margin-bottom: 24px; text-align: center; padding: 24px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);">✨ Toutes les activités <span style="display: inline-block; background: rgba(255,255,255,0.2); padding: 4px 12px; border-radius: 20px; font-size: 0.9rem; margin-left: 8px;">${toutesActivites.length}</span></h3>`;
    
    // Grouper par gîte
    ['Trévoux', 'Couzon'].forEach(gite => {
        const activitesGite = window.activitesParGite[gite] || [];
        if (activitesGite.length === 0) return;
        
        html += `
            <div style="margin-bottom: 40px; border: 3px solid #667eea; border-radius: 16px; padding: 20px; background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);">
                <h4 style="color: white; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 16px; border-radius: 10px; font-size: 1.4rem; margin-bottom: 20px; text-align: center;">
                    ${gite === 'Trévoux' ? '🏰' : '⛰️'} ${gite} <span style="background: rgba(255,255,255,0.2); padding: 4px 12px; border-radius: 20px; font-size: 0.9rem; margin-left: 8px;">${activitesGite.length}</span>
                </h4>
        `;
        
        // Grouper par catégorie pour ce gîte
        const parCategorie = {};
        activitesGite.forEach(act => {
            if (!parCategorie[act.categorie]) {
                parCategorie[act.categorie] = [];
            }
            parCategorie[act.categorie].push(act);
        });
        
        Object.keys(parCategorie).sort().forEach(cat => {
            html += `
                <div style="margin-bottom: 20px;">
                    <h5 style="color: #667eea; margin-bottom: 12px; font-size: 1.1rem; padding: 10px 12px; background: white; border-radius: 8px; border-left: 4px solid #667eea;">
                        ${cat} (${parCategorie[cat].length})
                    </h5>
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px;">
            `;
            
            parCategorie[cat].forEach(act => {
                const colors = getCategoryColor(act.categorie);
                const noteStars = act.note ? '⭐'.repeat(Math.round(act.note)) + ` ${act.note}/5` : '';
                const distanceText = act.distance ? `${act.distance} km` : '';
                
                html += `
                    <div data-activite-id="${act.id}" style="background: white; border: none; padding: 16px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); transition: all 0.3s ease;" onmouseover="this.style.transform='translateY(-6px)'; this.style.boxShadow='0 10px 28px rgba(0,0,0,0.15)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.1)'">
                        <div style="display: inline-block; background: ${colors.badge}; color: white; padding: 6px 14px; border-radius: 20px; font-size: 0.8rem; font-weight: 600; margin-bottom: 12px;">${act.categorie}</div>
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
                            <div style="flex: 1;">
                                <h6 style="margin: 0; font-size: 1.1rem; font-weight: 700; color: #1f2937;">${act.nom}${distanceText ? ` <span style="font-size: 0.9rem; font-weight: 500; color: #6b7280;">• ${distanceText}</span>` : ''}</h6>
                            </div>
                        </div>
                        ${act.adresse ? `<p style="margin: 8px 0; font-size: 0.9rem; color: #4b5563;"><span style="font-size: 1rem;">📍</span> ${act.adresse}</p>` : ''}
                        ${act.description ? `<p style="margin: 10px 0; font-size: 0.9rem; color: #6b7280; font-style: italic;">${act.description}</p>` : ''}
                        ${noteStars ? `<p style="margin: 8px 0; font-size: 0.95rem;">${noteStars}</p>` : ''}
                    </div>
                `;
            });
            
            html += '</div></div>';
        });
        
        html += '</div>';
    });
    
    container.innerHTML = html;
}

// ==================== AFFICHER LES ACTIVITÉS ====================
function afficherActivites(gite) {
    const container = document.getElementById('activitesParCategorie');
    
    // Vérifier que le container existe
    if (!container) {
        console.error('❌ Element #activitesParCategorie introuvable !');
        return;
    }
    
    const activites = window.activitesParGite[gite] || [];
    console.log(`📊 Affichage de ${activites.length} activités pour ${gite}`);
    
    if (activites.length === 0) {
        container.innerHTML = '<div style="text-align: center; padding: 60px 20px; background: linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(239, 68, 68, 0.05) 100%); border-radius: 16px; border: 2px dashed #ef4444;"><div style="font-size: 3rem; margin-bottom: 20px;">⚠️</div><p style="color: #ef4444; font-size: 1.2rem; font-weight: 600;">Aucune activité enregistrée pour ce gîte</p></div>';
        return;
    }
    
    // Grouper par catégorie
    const parCategorie = {};
    activites.forEach(act => {
        if (!parCategorie[act.categorie]) {
            parCategorie[act.categorie] = [];
        }
        parCategorie[act.categorie].push(act);
    });
    
    console.log(`📂 ${Object.keys(parCategorie).length} catégories trouvées:`, Object.keys(parCategorie));
    
    let html = `<h3 style="color: white; font-size: 1.6rem; margin-bottom: 24px; text-align: center; padding: 24px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);">✨ Toutes les activités à ${gite} <span style="display: inline-block; background: rgba(255,255,255,0.2); padding: 4px 12px; border-radius: 20px; font-size: 0.9rem; margin-left: 8px;">${activites.length}</span></h3>`;
    
    Object.keys(parCategorie).sort().forEach(cat => {
        html += `
            <div style="margin-bottom: 30px;">
                <h4 style="color: white; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); margin-bottom: 15px; font-size: 1.1rem; padding: 12px 16px; border-radius: 8px;">
                    ${cat} (${parCategorie[cat].length})
                </h4>
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px;">
        `;
        
        parCategorie[cat].forEach(act => {
            const colors = getCategoryColor(act.categorie);
            const noteStars = act.note ? '⭐'.repeat(Math.round(act.note)) + ` ${act.note}/5` : '';
            const avisText = act.avis ? `(${act.avis} avis)` : '';
            const telText = act.telephone ? `📞 ${act.telephone}` : '';
            const distanceText = act.distance ? `${act.distance} km` : '';
            const prixText = act.prix ? `${act.prix}` : '';
            const typeRestoText = act.type_restaurant ? `${act.type_restaurant}` : '';
            
            html += `
                <div data-activite-id="${act.id}" style="background: white; border: none; padding: 16px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); transition: all 0.3s ease; position: relative;" onmouseover="this.style.transform='translateY(-6px)'; this.style.boxShadow='0 10px 28px rgba(0,0,0,0.15)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.1)'">
                    <!-- Badge catégorie -->
                    <div style="display: inline-block; background: ${colors.badge}; color: white; padding: 6px 14px; border-radius: 20px; font-size: 0.8rem; font-weight: 600; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px;">
                        ${cat}
                    </div>
                    
                    <!-- Titre et boutons -->
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
                        <div style="flex: 1;">
                            <h5 style="margin: 0; font-size: 1.15rem; font-weight: 700; color: #1f2937; word-wrap: break-word; font-family: 'Work Sans', sans-serif;">${act.nom}${distanceText ? ` <span style="font-size: 0.95rem; font-weight: 500; color: #6b7280;">• ${distanceText}</span>` : ''}</h5>
                        </div>
                        <div style="display: flex; gap: 4px; margin-left: 12px;">
                            <button type="button" onclick="event.preventDefault(); event.stopPropagation(); modifierActivite(${act.id});" title="Modifier" style="background: transparent; border: none; cursor: pointer; font-size: 1.3rem; transition: transform 0.2s, opacity 0.2s; opacity: 0.7; padding: 4px;" onmouseover="this.style.transform='scale(1.2)'; this.style.opacity='1'" onmouseout="this.style.transform='scale(1)'; this.style.opacity='0.7'">✏️</button>
                            <button type="button" onclick="event.preventDefault(); event.stopPropagation(); supprimerActivite(${act.id});" title="Supprimer" style="background: transparent; border: none; cursor: pointer; font-size: 1.3rem; transition: transform 0.2s, opacity 0.2s; opacity: 0.7; padding: 4px;" onmouseover="this.style.transform='scale(1.2)'; this.style.opacity='1'" onmouseout="this.style.transform='scale(1)'; this.style.opacity='0.7'">🗑️</button>
                        </div>
                    </div>
                    
                    <!-- Adresse -->
                    ${act.adresse ? `<p style="margin: 8px 0; font-size: 0.9rem; color: #4b5563; display: flex; align-items: center; gap: 6px;"><span style="font-size: 1rem;">📍</span> ${act.adresse}</p>` : ''}
                    
                    <!-- Description -->
                    ${act.description ? `<p style="margin: 10px 0; font-size: 0.9rem; color: #6b7280; font-style: italic; line-height: 1.5;">${act.description}</p>` : ''}
                    
                    <!-- Prix et Type Restaurant -->
                    <div style="display: flex; gap: 20px; margin: 12px 0; font-size: 0.9rem; color: #6b7280;">
                        ${prixText ? `<div><span style="font-weight: 600;">💵 ${prixText}</span></div>` : ''}
                        ${typeRestoText ? `<div><span style="font-weight: 600;">🍽️ ${typeRestoText}</span></div>` : ''}
                    </div>
                    
                    <!-- Note et avis -->
                    ${noteStars ? `<p style="margin: 10px 0; font-size: 0.9rem; color: #f59e0b; font-weight: 600;">${noteStars} ${avisText}</p>` : ''}
                    
                    <!-- Téléphone -->
                    ${telText ? `<p style="margin: 8px 0; font-size: 0.85rem; color: #6b7280;">${telText}</p>` : ''}
                    
                    <!-- Liens d'action -->
                    <div style="display: flex; gap: 8px; margin-top: 14px; flex-wrap: wrap;">
                        ${act.google_maps_link ? `
                            <a href="${act.google_maps_link}" target="_blank" title="Google Maps" style="background: white; color: #ef4444; border: 2px solid #ef4444; border-radius: 8px; padding: 12px 18px; text-decoration: none; font-size: 0.85rem; font-weight: 600; transition: all 0.3s ease; display: inline-flex; align-items: center; gap: 6px; box-shadow: 0 2px 8px rgba(239, 68, 68, 0.2);" onmouseover="this.style.background='#fef2f2'; this.style.borderColor='#dc2626'; this.style.color='#dc2626'; this.style.boxShadow='0 6px 16px rgba(239, 68, 68, 0.3)'; this.style.transform='translateY(-2px)'" onmouseout="this.style.background='white'; this.style.borderColor='#ef4444'; this.style.color='#ef4444'; this.style.boxShadow='0 2px 8px rgba(239, 68, 68, 0.2)'; this.style.transform='translateY(0)'">
                                <img src="./images/location-pin.svg" alt="Localisation" style="width: 24px; height: 24px; object-fit: contain;"> Itinéraire
                            </a>
                        ` : ''}
                        ${act.website ? `
                            <a href="${act.website}" target="_blank" title="Site web" style="background: white; color: #3b82f6; border: 2px solid #3b82f6; border-radius: 8px; padding: 12px 18px; text-decoration: none; font-size: 0.85rem; font-weight: 600; transition: all 0.3s ease; display: inline-flex; align-items: center; gap: 6px; box-shadow: 0 2px 8px rgba(59, 130, 246, 0.2);" onmouseover="this.style.background='#f0f9ff'; this.style.borderColor='#1e40af'; this.style.color='#1e40af'; this.style.boxShadow='0 6px 16px rgba(59, 130, 246, 0.3)'; this.style.transform='translateY(-2px)'" onmouseout="this.style.background='white'; this.style.borderColor='#3b82f6'; this.style.color='#3b82f6'; this.style.boxShadow='0 2px 8px rgba(59, 130, 246, 0.2)'; this.style.transform='translateY(0)'">
                                <img src="./images/web-redirect.svg" alt="Web" style="width: 24px; height: 24px; object-fit: contain;"> Site
                            </a>
                        ` : ''}
                    </div>
                </div>
            `;
        });
        
        html += `</div></div>`;
    });
    
    console.log('✍️ Injection HTML dans le DOM...');
    container.innerHTML = html;
    console.log('✅ Affichage terminé !');
}

// ==================== SUPPRIMER UNE ACTIVITÉ ====================
async function supprimerActivite(id) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette activité ?')) {
        return;
    }
    
    try {
        const { error } = await window.supabaseClient
            .from('activites_gites')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        
        showNotification('✓ Activité supprimée', 'success');
        await chargerActivites();
        
    } catch (error) {
        console.error('Erreur suppression activité:', error);
        showNotification('❌ Erreur : ' + error.message, 'error');
    }
}

// ==================== FILTRER ACTIVITÉS PAR CATÉGORIE ====================
async function filtrerActivitesParCategorie(motCle) {
    const giteInput = document.getElementById('decouvrir_gite');
    const gite = giteInput?.value;
    const container = document.getElementById('activitesParCategorie');
    
    // Vérifier si les activités sont chargées, sinon les charger
    if (!window.activitesParGite || 
        (window.activitesParGite['Trévoux'].length === 0 && window.activitesParGite['Couzon'].length === 0)) {
        showNotification('⏳ Chargement des activités...', 'info');
        await chargerActivites();
    }
    
    let activites = [];
    let titre = '';
    
    // Si un gîte est sélectionné, filtrer uniquement celui-ci
    if (gite) {
        activites = window.activitesParGite[gite] || [];
        titre = `${motCle} à ${gite}`;
    } else {
        // Sinon, chercher dans les deux gîtes
        activites = [
            ...(window.activitesParGite['Trévoux'] || []),
            ...(window.activitesParGite['Couzon'] || [])
        ];
        titre = `${motCle} - Tous les gîtes`;
    }
    
    // Filtrer par mot-clé dans la catégorie
    const filtrees = activites.filter(act => 
        act.categorie.toLowerCase().includes(motCle.toLowerCase())
    );
    
    if (filtrees.length === 0) {
        const lieu = gite || 'les gîtes';
        container.innerHTML = `<p style="text-align: center; color: #999; padding: 40px;">Aucune activité "${motCle}" trouvée pour ${lieu}. 
        <br><br><button onclick="chargerActivites()" class="btn" style="background: #667eea; color: white; padding: 12px 24px; border: none; border-radius: 8px; cursor: pointer;">
        🔄 Recharger les activités
        </button></p>`;
        return;
    }
    
    // 🗺️ Mettre à jour le filtre et la carte
    window.filtreCategorieActive = motCle;
    afficherActivitesFiltrées(filtrees, titre);
    
    // 📍 Afficher uniquement les activités filtrées sur la carte
    afficherCarteEvenements();
}

// ==================== AFFICHER TOUTES LES ACTIVITÉS ====================
async function afficherToutesActivites() {
    const giteInput = document.getElementById('decouvrir_gite');
    const gite = giteInput?.value;
    
    // Vérifier si les activités sont chargées, sinon les charger
    if (!window.activitesParGite || 
        (window.activitesParGite['Trévoux'].length === 0 && window.activitesParGite['Couzon'].length === 0)) {
        showNotification('⏳ Chargement des activités...', 'info');
        await chargerActivites();
        return; // chargerActivites() appelera déjà afficherToutesLesActivites()
    }
    
    let activites = [];
    let titre = '';
    
    // Si un gîte est sélectionné, afficher uniquement celui-ci
    if (gite) {
        activites = window.activitesParGite[gite] || [];
        titre = `Toutes les activités à ${gite}`;
    } else {
        // Sinon, afficher les deux gîtes
        activites = [
            ...(window.activitesParGite['Trévoux'] || []),
            ...(window.activitesParGite['Couzon'] || [])
        ];
        titre = 'Toutes les activités - Tous les gîtes';
    }
    
    // 🗺️ Réinitialiser le filtre et afficher toutes les activités
    window.filtreCategorieActive = null;
    afficherActivitesFiltrées(activites, titre);
    
    // 📍 Afficher tous les marqueurs sur la carte
    afficherCarteEvenements();
}

// ==================== AFFICHER ACTIVITÉS FILTRÉES ====================
function afficherActivitesFiltrées(activites, titre) {
    const container = document.getElementById('activitesParCategorie');
    
    // Grouper par catégorie
    const parCategorie = {};
    activites.forEach(act => {
        if (!parCategorie[act.categorie]) {
            parCategorie[act.categorie] = [];
        }
        parCategorie[act.categorie].push(act);
    });
    
    let html = `<h3 style="color: #2C5F7D; font-size: 1.5rem; margin-bottom: 20px; text-align: center; padding: 20px; background: #f0f4f8; border-radius: 12px;">🎯 ${titre} (${activites.length})</h3>`;
    
    Object.keys(parCategorie).sort().forEach(cat => {
        html += `
            <div style="margin-bottom: 30px;">
                <h4 style="color: white; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); margin-bottom: 15px; font-size: 1.1rem; padding: 12px 16px; border-radius: 8px;">
                    ${cat} (${parCategorie[cat].length})
                </h4>
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px;">
        `;
        
        parCategorie[cat].forEach(act => {
            const colors = getCategoryColor(act.categorie);
            const noteStars = act.note ? '⭐'.repeat(Math.round(act.note)) + ` ${act.note}/5` : '';
            const avisText = act.avis ? `(${act.avis} avis)` : '';
            const telText = act.telephone ? `📞 ${act.telephone}` : '';
            const distanceText = act.distance ? `${act.distance} km` : '';
            const prixText = act.prix ? `${act.prix}` : '';
            const typeRestoText = act.type_restaurant ? `${act.type_restaurant}` : '';
            
            html += `
                <div data-activite-id="${act.id}" style="background: white; border: none; padding: 16px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); transition: all 0.3s ease; position: relative;" onmouseover="this.style.transform='translateY(-6px)'; this.style.boxShadow='0 10px 28px rgba(0,0,0,0.15)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.1)'">
                    <!-- Badge catégorie -->
                    <div style="display: inline-block; background: ${colors.badge}; color: white; padding: 6px 14px; border-radius: 20px; font-size: 0.8rem; font-weight: 600; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px;">
                        ${act.categorie}
                    </div>
                    
                    <!-- Titre et boutons -->
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
                        <div style="flex: 1;">
                            <h5 style="margin: 0; font-size: 1.15rem; font-weight: 700; color: #1f2937; word-wrap: break-word; font-family: 'Work Sans', sans-serif;">${act.nom}${distanceText ? ` <span style="font-size: 0.95rem; font-weight: 500; color: #6b7280;">• ${distanceText}</span>` : ''}</h5>
                        </div>
                        <div style="display: flex; gap: 4px; margin-left: 12px;">
                            <button type="button" onclick="event.preventDefault(); event.stopPropagation(); modifierActivite(${act.id});" title="Modifier" style="background: transparent; border: none; cursor: pointer; font-size: 1.3rem; transition: transform 0.2s, opacity 0.2s; opacity: 0.7; padding: 4px;" onmouseover="this.style.transform='scale(1.2)'; this.style.opacity='1'" onmouseout="this.style.transform='scale(1)'; this.style.opacity='0.7'">✏️</button>
                            <button type="button" onclick="event.preventDefault(); event.stopPropagation(); supprimerActivite(${act.id});" title="Supprimer" style="background: transparent; border: none; cursor: pointer; font-size: 1.3rem; transition: transform 0.2s, opacity 0.2s; opacity: 0.7; padding: 4px;" onmouseover="this.style.transform='scale(1.2)'; this.style.opacity='1'" onmouseout="this.style.transform='scale(1)'; this.style.opacity='0.7'">🗑️</button>
                        </div>
                    </div>
                    
                    <!-- Adresse -->
                    ${act.adresse ? `<p style="margin: 8px 0; font-size: 0.9rem; color: #4b5563; display: flex; align-items: center; gap: 6px;"><span style="font-size: 1rem;">📍</span> ${act.adresse}</p>` : ''}
                    
                    <!-- Description -->
                    ${act.description ? `<p style="margin: 10px 0; font-size: 0.9rem; color: #6b7280; font-style: italic; line-height: 1.5;">${act.description}</p>` : ''}
                    
                    <!-- Prix et Type Restaurant -->
                    <div style="display: flex; gap: 20px; margin: 12px 0; font-size: 0.9rem; color: #6b7280;">
                        ${prixText ? `<div><span style="font-weight: 600;">💵 ${prixText}</span></div>` : ''}
                        ${typeRestoText ? `<div><span style="font-weight: 600;">🍽️ ${typeRestoText}</span></div>` : ''}
                    </div>
                    
                    <!-- Note et avis -->
                    ${noteStars ? `<p style="margin: 10px 0; font-size: 0.9rem; color: #f59e0b; font-weight: 600;">${noteStars} ${avisText}</p>` : ''}
                    
                    <!-- Téléphone -->
                    ${telText ? `<p style="margin: 8px 0; font-size: 0.85rem; color: #6b7280;">${telText}</p>` : ''}
                    
                    <!-- Liens d'action -->
                    <div style="display: flex; gap: 8px; margin-top: 14px; flex-wrap: wrap;">
                        ${act.google_maps_link ? `
                            <a href="${act.google_maps_link}" target="_blank" title="Google Maps" style="background: white; color: #ef4444; border: 2px solid #ef4444; border-radius: 8px; padding: 12px 18px; text-decoration: none; font-size: 0.85rem; font-weight: 600; transition: all 0.3s ease; display: inline-flex; align-items: center; gap: 6px; box-shadow: 0 2px 8px rgba(239, 68, 68, 0.2);" onmouseover="this.style.background='#fef2f2'; this.style.borderColor='#dc2626'; this.style.color='#dc2626'; this.style.boxShadow='0 6px 16px rgba(239, 68, 68, 0.3)'; this.style.transform='translateY(-2px)'" onmouseout="this.style.background='white'; this.style.borderColor='#ef4444'; this.style.color='#ef4444'; this.style.boxShadow='0 2px 8px rgba(239, 68, 68, 0.2)'; this.style.transform='translateY(0)'">
                                <img src="./images/location-pin.svg" alt="Localisation" style="width: 24px; height: 24px; object-fit: contain;"> Itinéraire
                            </a>
                        ` : ''}
                        ${act.website ? `
                            <a href="${act.website}" target="_blank" title="Site web" style="background: white; color: #3b82f6; border: 2px solid #3b82f6; border-radius: 8px; padding: 12px 18px; text-decoration: none; font-size: 0.85rem; font-weight: 600; transition: all 0.3s ease; display: inline-flex; align-items: center; gap: 6px; box-shadow: 0 2px 8px rgba(59, 130, 246, 0.2);" onmouseover="this.style.background='#f0f9ff'; this.style.borderColor='#1e40af'; this.style.color='#1e40af'; this.style.boxShadow='0 6px 16px rgba(59, 130, 246, 0.3)'; this.style.transform='translateY(-2px)'" onmouseout="this.style.background='white'; this.style.borderColor='#3b82f6'; this.style.color='#3b82f6'; this.style.boxShadow='0 2px 8px rgba(59, 130, 246, 0.2)'; this.style.transform='translateY(0)'">
                                <img src="./images/web-redirect.svg" alt="Web" style="width: 24px; height: 24px; object-fit: contain;"> Site
                            </a>
                        ` : ''}
                    </div>
                </div>
            `;
        });
        
        html += `</div></div>`;
    });
    
    container.innerHTML = html;
}

// ==================== MODIFIER UNE ACTIVITÉ ====================
async function modifierActivite(id) {
    try {
        // Récupérer l'élément de l'activité
        const element = document.querySelector(`[data-activite-id="${id}"]`);
        let positionY = window.innerHeight / 2; // Par défaut au centre
        
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // Attendre un peu que le scroll soit fait
            await new Promise(resolve => setTimeout(resolve, 300));
            
            // Récupérer la position de l'élément
            const rect = element.getBoundingClientRect();
            positionY = rect.top + window.scrollY + rect.height / 2;
        }
        
        // Récupérer l'activité à modifier
        const { data, error } = await window.supabaseClient
            .from('activites_gites')
            .select('*')
            .eq('id', id)
            .single();
        
        if (error) throw error;
        
        // Pré-remplir le formulaire
        document.getElementById('activite_nom').value = data.nom || '';
        document.getElementById('activite_categorie').value = data.categorie || '';
        document.getElementById('activite_description').value = data.description || '';
        document.getElementById('activite_adresse').value = data.adresse || '';
        document.getElementById('activite_distance').value = data.distance || '';
        document.getElementById('activite_note').value = data.note || '';
        document.getElementById('activite_avis').value = data.avis || '';
        document.getElementById('activite_prix').value = data.prix || '';
        document.getElementById('activite_telephone').value = data.telephone || '';
        document.getElementById('activite_website').value = data.website || '';
        
        // Afficher/cacher le champ type de restaurant selon la catégorie
        afficherTypeRestoSiRestaurant();
        
        // Stocker l'ID en cours de modification
        window.activiteEnCoursDeModification = id;
        
        // Ouvrir la modale en mode modification avec position
        ouvrirModalActivite(true, positionY);
        
        showNotification('✏️ Mode modification activé', 'info');
        
    } catch (error) {
        console.error('Erreur modification activité:', error);
        showNotification('❌ Erreur : ' + error.message, 'error');
    }
}

// ==================== EXPORTS WINDOW ====================
window.initGoogleMap = initGoogleMap;
window.ajouterMarqueurGite = ajouterMarqueurGite;
window.chargerPOIsFromSupabase = chargerPOIsFromSupabase;
window.ajouterMarqueurPOI = ajouterMarqueurPOI;
window.calculerItineraire = calculerItineraire;
window.centrerCarteGite = centrerCarteGite;
window.filterMapByCategory = filterMapByCategory;
window.afficherListePOIs = afficherListePOIs;
window.zoomOnPOI = zoomOnPOI;
window.afficherItineraireModal = afficherItineraireModal;
window.chargerActivites = chargerActivites;
window.chargerToutSurCarte = chargerToutSurCarte;
window.getCategoryColor = getCategoryColor;
window.afficherActivites = afficherActivites;
window.afficherToutesLesActivites = afficherToutesLesActivites;
window.supprimerActivite = supprimerActivite;
window.filtrerActivitesParCategorie = filtrerActivitesParCategorie;
window.afficherToutesActivites = afficherToutesActivites;
window.afficherActivitesFiltrées = afficherActivitesFiltrées;
window.modifierActivite = modifierActivite;
window.escapeHtml = escapeHtml;
window.escapeForOnclick = escapeForOnclick;

// Variables globales exportées
window.googleMap = googleMap;
window.allMarkers = allMarkers;
window.googleGiteMarker = googleGiteMarker;
window.infoWindow = infoWindow;
window.directionsService = directionsService;
window.directionsRenderer = directionsRenderer;
window.gitesCoordinates = gitesCoordinates;
window.categoryColors = categoryColors;
window.categoryIcons = categoryIcons;
window.categoryMapping = categoryMapping;
