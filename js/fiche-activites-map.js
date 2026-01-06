/**
 * MODULE CARTE ACTIVITÉS AVEC LEAFLET
 * Gestion interactive de la carte avec sélection, distance et temps de trajet
 */

let mapActivitesInstance = null;
let currentMarkers = [];
let giteMarker = null;

// Calculer la distance entre deux points GPS (formule de Haversine)
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Rayon de la Terre en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance en km
}

// Estimer les temps de trajet
function estimateTravel(distanceKm) {
    // Vitesses moyennes
    const speedWalk = 5; // km/h
    const speedBike = 15; // km/h
    const speedCar = 50; // km/h (moyenne avec arrêts, circulation)
    
    const timeWalk = Math.ceil((distanceKm / speedWalk) * 60); // minutes
    const timeBike = Math.ceil((distanceKm / speedBike) * 60);
    const timeCar = Math.ceil((distanceKm / speedCar) * 60);
    
    return {
        walk: timeWalk,
        bike: timeBike,
        car: timeCar
    };
}

// Formater le temps de trajet
function formatTravelTime(minutes) {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h${mins}` : `${hours}h`;
}

// Créer la carte Leaflet (dans un conteneur VISIBLE)
function initMapActivites(giteLat, giteLon, activites) {
    const mapContainer = document.getElementById('mapActivites');
    
    // Vérifier que le conteneur est visible
    if (mapContainer.offsetWidth === 0 || mapContainer.offsetHeight === 0) {
        console.warn('⚠️ Conteneur carte invisible, attente...');
        setTimeout(() => initMapActivites(giteLat, giteLon, activites), 100);
        return;
    }
    
    // Détruire l'ancienne carte si elle existe
    if (mapActivitesInstance) {
        mapActivitesInstance.remove();
        mapActivitesInstance = null;
    }
    
    // S'assurer que le conteneur est vide
    window.SecurityUtils.setInnerHTML(mapContainer, '');
    
    // Créer la carte avec zoom plus proche (16 au lieu de 12)
    mapActivitesInstance = L.map(mapContainer).setView([giteLat, giteLon], 16);
    
    // Ajouter les tuiles OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
        maxZoom: 19
    }).addTo(mapActivitesInstance);
    
    // Forcer le redimensionnement après création
    setTimeout(() => {
        if (mapActivitesInstance) {
            mapActivitesInstance.invalidateSize();
        }
    }, 100);
    
    // Marqueur du gîte (rouge)
    giteMarker = L.marker([giteLat, giteLon], {
        icon: L.icon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34]
        })
    }).addTo(mapActivitesInstance);
    
    giteMarker.bindPopup('<b>🏡 Votre gîte</b>');
    
    // Marqueurs des activités (bleus, cachés au départ)
    currentMarkers = [];
    activites.forEach((activite, index) => {
        if (activite.latitude && activite.longitude) {
            const marker = L.marker([activite.latitude, activite.longitude], {
                icon: L.icon({
                    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
                    iconSize: [25, 41],
                    iconAnchor: [12, 41],
                    popupAnchor: [1, -34]
                }),
                opacity: 0 // Caché au départ
            }).addTo(mapActivitesInstance);
            
            const distance = calculateDistance(giteLat, giteLon, activite.latitude, activite.longitude);
            
            marker.bindPopup(`
                <b>${activite.nom}</b><br>
                📏 ${distance.toFixed(1)} km
            `);
            
            currentMarkers.push({ marker, activite, distance });
        }
    });
    
    return mapActivitesInstance;
}

// Afficher/masquer un marqueur d'activité
function toggleActivityMarker(activiteId, show) {
    const markerData = currentMarkers.find(m => m.activite.id === activiteId);
    if (markerData) {
        markerData.marker.setOpacity(show ? 1 : 0);
        if (show) {
            // Centrer sur le marqueur avec un petit délai pour l'animation
            setTimeout(() => {
                mapActivitesInstance.setView(
                    [markerData.activite.latitude, markerData.activite.longitude],
                    15,
                    { animate: true }
                );
                markerData.marker.openPopup();
            }, 100);
        }
    }
}

// Variables globales pour les coordonnées
let currentGiteLat = null;
let currentGiteLon = null;

// Afficher la liste des activités avec sélecteurs (SANS marqueurs carte)
function displayActivitesListInteractive(activites, giteLat, giteLon) {
    // Sauvegarder les coordonnées du gîte
    currentGiteLat = giteLat;
    currentGiteLon = giteLon;
    
    const listeContainer = document.getElementById('listeActivites');
    
    if (!activites || activites.length === 0) {
        window.SecurityUtils.setInnerHTML(listeContainer, `
            <div class="card" style="text-align: center; padding: 2rem; color: var(--gray-600);">
                ℹ️ Aucune activité configurée pour ce gîte
            </div>
        `);
        return;
    }
    
    // Trier par distance
    const activitesWithDistance = activites
        .filter(a => a.latitude && a.longitude)
        .map(a => ({
            ...a,
            distance: calculateDistance(giteLat, giteLon, a.latitude, a.longitude)
        }))
        .sort((a, b) => a.distance - b.distance);
    
    let html = '';
    
    activitesWithDistance.forEach(activite => {
        const emoji = getActivityEmoji(activite.categorie);
        const travel = estimateTravel(activite.distance);
        
        html += `
            <div class="activite-card" data-activite-id="${activite.id}">
                <div class="activite-header">
                    <div class="activite-icon">${emoji}</div>
                    <div class="activite-info">
                        <h4>${activite.nom}</h4>
                        <span class="activite-categorie">${activite.categorie || 'Autre'}</span>
                        <div class="activite-distance">📏 ${activite.distance.toFixed(1)} km</div>
                    </div>
                    <button class="btn-show-map" onclick="showActivityOnMap(${activite.latitude}, ${activite.longitude}, '${activite.nom.replace(/'/g, "\\'")}', ${activite.id})">
                        📍 Voir sur carte
                    </button>
                </div>
                <div class="activite-travel" id="travel-${activite.id}" style="display: none;">
                    <div class="travel-time">
                        <span>🚶 ${formatTravelTime(travel.walk)}</span>
                        <span>🚴 ${formatTravelTime(travel.bike)}</span>
                        <span>🚗 ${formatTravelTime(travel.car)}</span>
                    </div>
                </div>
                ${activite.description ? `<p class="activite-description">${activite.description}</p>` : ''}
                ${activite.adresse ? `<p class="activite-adresse">📍 ${activite.adresse}</p>` : ''}
                <a href="https://www.google.com/maps/dir/?api=1&origin=${giteLat},${giteLon}&destination=${activite.latitude},${activite.longitude}" 
                   target="_blank" 
                   class="btn-itineraire"
                   style="display: inline-block; margin-top: 0.5rem; padding: 0.5rem 1rem; background: #10b981; color: white; text-decoration: none; border-radius: 0.5rem; font-size: 0.875rem;">
                    🗺️ Itinéraire Google Maps
                </a>
            </div>
        `;
    });
    
    window.SecurityUtils.setInnerHTML(listeContainer, html);
}

// Afficher une activité sur la carte
window.showActivityOnMap = function(actLat, actLon, actName, actId) {
    const mapContainer = document.getElementById('mapActivites');
    
    // Utiliser Google Maps Directions qui montre les 2 points (départ et arrivée)
    window.SecurityUtils.setInnerHTML(mapContainer, `
        <iframe 
            width="100%" 
            height="400" 
            frameborder="0" 
            scrolling="no" 
            marginheight="0" 
            marginwidth="0" 
            src="https://www.google.com/maps/embed/v1/directions?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&origin=${currentGiteLat},${currentGiteLon}&destination=${actLat},${actLon}&mode=driving" 
            style="border: 1px solid #10b981; border-radius: 8px; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);">
        </iframe>
        <div style="text-align: center; margin-top: 0.5rem;">
            <strong style="color: #ef4444;">🏡 Gîte</strong> ➜ <strong style="color: #10b981;">📍 ${actName}</strong><br>
            <a href="https://www.google.com/maps/dir/${currentGiteLat},${currentGiteLon}/${actLat},${actLon}" 
               target="_blank" 
               style="color: var(--primary); font-size: 0.875rem; margin-right: 1rem;">
                🗺️ Ouvrir dans Google Maps
            </a>
            <button onclick="resetMapToGite()" style="padding: 0.25rem 0.75rem; background: var(--gray-200); border: none; border-radius: 0.5rem; cursor: pointer; font-size: 0.875rem;">
                🏡 Retour gîte seul
            </button>
        </div>
    `;
    
    // Afficher les temps de trajet
    toggleTravelInfo(actId);
    
    // Marquer la card comme sélectionnée
    document.querySelectorAll('.activite-card').forEach(card => card.classList.remove('selected'));
    const card = document.querySelector(`[data-activite-id="${actId}"]`);
    if (card) {
        card.classList.add('selected');
        card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
};

// Revenir à la vue du gîte
window.resetMapToGite = function() {
    const mapContainer = document.getElementById('mapActivites');
    
    window.SecurityUtils.setInnerHTML(mapContainer, `
        <iframe 
            width="100%" 
            height="400" 
            frameborder="0" 
            scrolling="no" 
            marginheight="0" 
            marginwidth="0" 
            src="https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${currentGiteLat},${currentGiteLon}&zoom=16" 
            style="border: 1px solid #ccc; border-radius: 8px;">
        </iframe>
        <div style="text-align: center; margin-top: 0.5rem;">
            <strong style="color: #ef4444;">🏡 Votre gîte</strong><br>
            <a href="https://www.google.com/maps/search/?api=1&query=${currentGiteLat},${currentGiteLon}" 
               target="_blank" 
               style="color: var(--primary); font-size: 0.875rem;">
                📍 Voir sur Google Maps
            </a>
        </div>
    `;
    
    // Désélectionner toutes les cards
    document.querySelectorAll('.activite-card').forEach(card => card.classList.remove('selected'));
};

// Afficher/masquer les temps de trajet
window.toggleTravelInfo = function(activiteId) {
    const travelDiv = document.getElementById(`travel-${activiteId}`);
    if (travelDiv) {
        travelDiv.style.display = travelDiv.style.display === 'none' ? 'block' : 'none';
    }
};

// Obtenir l'emoji selon la catégorie
function getActivityEmoji(categorie) {
    const emojiMap = {
        'Restaurant': '🍽️',
        'Musée': '🏛️',
        'Parc': '🌳',
        'Monument': '🏰',
        'Plage': '🏖️',
        'Randonnée': '🥾',
        'Shopping': '🛍️',
        'Culture': '🎭',
        'Sport': '⚽',
        'Nature': '🌿',
        'Loisirs': '🎪'
    };
    return emojiMap[categorie] || '📍';
}
