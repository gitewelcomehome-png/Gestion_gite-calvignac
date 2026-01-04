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
    
    // Détruire l'ancienne carte si elle existe
    if (mapActivitesInstance) {
        mapActivitesInstance.remove();
        mapActivitesInstance = null;
    }
    
    // S'assurer que le conteneur est vide
    mapContainer.innerHTML = '';
    
    // Créer la carte avec zoom plus proche (16 au lieu de 12)
    mapActivitesInstance = L.map(mapContainer).setView([giteLat, giteLon], 16);
    
    // Ajouter les tuiles OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
        maxZoom: 19
    }).addTo(mapActivitesInstance);
    
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

// Afficher la liste des activités avec sélecteurs
function displayActivitesListInteractive(activites, giteLat, giteLon) {
    const listeContainer = document.getElementById('listeActivites');
    
    if (!activites || activites.length === 0) {
        listeContainer.innerHTML = `
            <div class="card" style="text-align: center; padding: 2rem; color: var(--gray-600);">
                ℹ️ Aucune activité configurée pour ce gîte
            </div>
        `;
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
                    <button class="btn-show-map" onclick="selectActivite(${activite.id})">
                        📍 Voir sur la carte
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
            </div>
        `;
    });
    
    listeContainer.innerHTML = html;
}

// Sélectionner une activité
window.selectActivite = function(activiteId) {
    // Masquer tous les marqueurs et infos de trajet
    currentMarkers.forEach(m => m.marker.setOpacity(0));
    document.querySelectorAll('.activite-travel').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.activite-card').forEach(card => card.classList.remove('selected'));
    
    // Afficher le marqueur sélectionné
    toggleActivityMarker(activiteId, true);
    
    // Afficher les infos de trajet
    const travelDiv = document.getElementById(`travel-${activiteId}`);
    if (travelDiv) {
        travelDiv.style.display = 'block';
    }
    
    // Marquer la card comme sélectionnée
    const card = document.querySelector(`[data-activite-id="${activiteId}"]`);
    if (card) {
        card.classList.add('selected');
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
