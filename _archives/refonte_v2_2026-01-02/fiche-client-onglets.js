// ================================================================
// GÉNÉRATEURS ONGLETS - PARTIE 2
// ================================================================
// À append après fiche-client-interactive-v2.js

/**
 * ONGLET 1: ACCUEIL
 */
function genererOngletAccueil(reservation, infosGite, faqGite) {
    return `
    <div id="tab-accueil" class="tab-pane active">
        <!-- Résumé du séjour -->
        <div class="section">
            <div class="section-title">📋 Résumé de votre séjour / Your Stay Summary</div>
            <div class="info-grid">
                <div class="info-item">
                    <strong>Gîte / Cottage:</strong>
                    <span>${reservation.gite}</span>
                </div>
                <div class="info-item">
                    <strong>Hôte / Guest:</strong>
                    <span>${reservation.nom}</span>
                </div>
                <div class="info-item">
                    <strong>Arrivée / Check-in:</strong>
                    <span>${formatDateLong(reservation.dateDebut)}</span>
                </div>
                <div class="info-item">
                    <strong>Départ / Check-out:</strong>
                    <span>${formatDateLong(reservation.dateFin)}</span>
                </div>
            </div>
        </div>
        
        <!-- Accès rapide -->
        <div class="section">
            <div class="section-title">🔑 Accès Rapide / Quick Access</div>
            
            ${infosGite.code_cle ? `
            <div class="alert alert-success">
                <div style="flex: 1;">
                    <strong>Code boîte à clés / Keybox code:</strong><br>
                    <div class="code-box" style="margin-top: 10px;">${infosGite.code_cle}</div>
                </div>
            </div>` : '<div class="alert alert-info">Le code d\'accès vous sera communiqué 48h avant votre arrivée / Access code will be sent 48h before arrival</div>'}
            
            ${infosGite.wifi ? `
            <div class="alert alert-info">
                <div style="flex: 1;">
                    <strong>📶 WiFi:</strong><br>
                    <div class="code-box" style="margin-top: 10px; font-size: 1.2rem;">${infosGite.wifi}</div>
                </div>
            </div>` : ''}
            
            ${infosGite.telephone ? `
            <div class="alert alert-warning">
                <div style="flex: 1;">
                    <strong>📞 Urgence / Emergency:</strong><br>
                    <a href="tel:${infosGite.telephone}" class="btn btn-primary" style="margin-top: 10px; display: inline-flex;">
                        ${infosGite.telephone}
                    </a>
                </div>
            </div>` : ''}
        </div>
        
        <!-- Recherche FAQ -->
        <div class="section">
            <div class="section-title">❓ Posez votre question / Ask a Question</div>
            <div class="search-box">
                <input type="text" 
                       id="faq-search-input" 
                       class="search-input" 
                       placeholder="🔍 Rechercher... / Search..."
                       oninput="rechercherFAQ(this.value)">
                <span class="search-icon">🔍</span>
            </div>
            
            <div id="faq-results" class="hidden"></div>
            
            <div class="faq-toggle">
                <button class="btn btn-primary" onclick="toggleAllFAQ()">
                    <span id="faq-toggle-text">Voir toutes les FAQ / See all FAQs</span>
                </button>
            </div>
            
            <div id="faq-all-container" class="faq-container">
                ${genererFAQHTML(faqGite)}
            </div>
        </div>
        
        <!-- Contact -->
        <div class="section text-center">
            <div class="section-title">💬 Besoin d'aide ? / Need Help?</div>
            ${infosGite.telephone ? `
            <a href="tel:${infosGite.telephone}" class="btn btn-success btn-lg">
                📞 Contactez-nous / Call Us
            </a>` : ''}
            ${infosGite.email ? `
            <a href="mailto:${infosGite.email}" class="btn btn-primary" style="margin-top: 10px;">
                ✉️ ${infosGite.email}
            </a>` : ''}
        </div>
    </div>
    `;
}

/**
 * ONGLET 2: ARRIVÉE
 */
function genererOngletArrivee(reservation, infosGite) {
    return `
    <div id="tab-arrivee" class="tab-pane">
        <!-- Itinéraire -->
        <div class="section">
            <div class="section-title">📍 Itinéraire / Directions</div>
            ${infosGite.adresse ? `<div class="info-item"><strong>Adresse / Address:</strong> ${infosGite.adresse}</div>` : ''}
            ${infosGite.gpsLat && infosGite.gpsLon ? `
            <div class="mt-20">
                <a href="https://www.google.com/maps?q=${infosGite.gpsLat},${infosGite.gpsLon}" 
                   target="_blank" 
                   class="btn btn-primary btn-lg">
                    🗺️ Ouvrir dans Google Maps
                </a>
                <a href="https://waze.com/ul?ll=${infosGite.gpsLat},${infosGite.gpsLon}&navigate=yes" 
                   target="_blank" 
                   class="btn btn-primary" style="margin-top: 10px;">
                    🚗 Ouvrir dans Waze
                </a>
            </div>
            <div class="mt-20 text-center" style="color: #666;">
                <strong>GPS Coordonnées / Coordinates:</strong><br>
                ${infosGite.gpsLat}, ${infosGite.gpsLon}
            </div>` : ''}
        </div>
        
        <!-- Parking -->
        ${infosGite.parking ? `
        <div class="section">
            <div class="section-title">🅿️ Parking</div>
            <div class="card">
                <div class="card-content">${infosGite.parking}</div>
            </div>
        </div>` : ''}
        
        <!-- Récupération clés -->
        <div class="section">
            <div class="section-title">🔑 Récupération des clés / Key Collection</div>
            ${infosGite.code_cle ? `
            <div class="alert alert-success">
                <div style="flex: 1; text-align: center;">
                    <strong style="font-size: 1.2rem;">Code boîte à clés / Keybox code:</strong><br>
                    <div class="code-box" style="margin-top: 15px;">${infosGite.code_cle}</div>
                </div>
            </div>` : '<div class="alert alert-info">Le code d\'accès vous sera communiqué 48h avant votre arrivée.<br>Access code will be sent 48h before arrival.</div>'}
            
            ${infosGite.instructions_arrivee ? `
            <div class="card mt-20">
                <div class="card-title">✅ Instructions détaillées / Detailed Instructions</div>
                <div class="card-content" style="white-space: pre-wrap;">${infosGite.instructions_arrivee}</div>
            </div>` : ''}
        </div>
        
        <!-- Premier accès -->
        <div class="section">
            <div class="section-title">🏠 Premier accès au gîte / First Access</div>
            <div class="info-grid">
                <div class="card">
                    <div class="card-title">💡 Électricité</div>
                    <div class="card-content">Le disjoncteur se trouve dans l'entrée.<br>Circuit breaker is in the entrance.</div>
                </div>
                <div class="card">
                    <div class="card-title">🔥 Chauffage / Heating</div>
                    <div class="card-content">Thermostat dans le salon, réglage conseillé: 20°C.<br>Thermostat in living room, recommended: 20°C.</div>
                </div>
                <div class="card">
                    <div class="card-title">🗑️ Poubelles / Trash</div>
                    <div class="card-content">Bacs à l'extérieur, tri sélectif obligatoire.<br>Bins outside, recycling required.</div>
                </div>
                <div class="card">
                    <div class="card-title">📶 WiFi</div>
                    <div class="card-content">${infosGite.wifi ? `Code: <strong>${infosGite.wifi}</strong>` : 'Voir sur la box / See on router'}</div>
                </div>
            </div>
        </div>
        
        <!-- Horaires -->
        <div class="section">
            <div class="section-title">⏰ Horaires d'arrivée / Check-in Time</div>
            <div class="alert alert-info">
                <div style="flex: 1;">
                    <strong>Standard:</strong> À partir de 16h00 / From 4:00 PM<br>
                    <strong>Arrivée tardive / Late arrival:</strong> Possible, prévenir à l'avance / Please notify in advance
                </div>
            </div>
        </div>
        
        <!-- Checklist -->
        <div class="section">
            <div class="section-title">✅ Checklist d'arrivée / Arrival Checklist</div>
            <div class="checklist">
                <label class="checklist-item">
                    <input type="checkbox">
                    <span>Vérifier l'état des lieux / Check the premises condition</span>
                </label>
                <label class="checklist-item">
                    <input type="checkbox">
                    <span>Tester le WiFi / Test WiFi connection</span>
                </label>
                <label class="checklist-item">
                    <input type="checkbox">
                    <span>Repérer les sorties de secours / Locate emergency exits</span>
                </label>
                <label class="checklist-item">
                    <input type="checkbox">
                    <span>Localiser l'extincteur / Find fire extinguisher</span>
                </label>
                <label class="checklist-item">
                    <input type="checkbox">
                    <span>Tester le chauffage/clim / Test heating/AC</span>
                </label>
            </div>
        </div>
    </div>
    `;
}

/**
 * ONGLET 3: PENDANT LE SÉJOUR
 */
function genererOngletSejour(infosGite) {
    return `
    <div id="tab-sejour" class="tab-pane">
        <!-- Équipements -->
        <div class="section">
            <div class="section-title">🏠 Équipements du gîte / Cottage Equipment</div>
            
            <div class="section-subtitle">🍳 Cuisine / Kitchen</div>
            <div class="card">
                <div class="card-content">
                    • Four / Oven<br>
                    • Plaques de cuisson / Cooktop<br>
                    • Micro-ondes / Microwave<br>
                    • Réfrigérateur / Fridge<br>
                    • Lave-vaisselle / Dishwasher<br>
                    • Cafetière / Coffee maker<br>
                    • Vaisselle complète / Full tableware
                </div>
            </div>
            
            <div class="section-subtitle">🛋️ Salon / Living Room</div>
            <div class="card">
                <div class="card-content">
                    • TV écran plat / Flat screen TV<br>
                    • TNT / Freeview channels<br>
                    • Canapé convertible / Sofa bed<br>
                    • Chauffage / Heating
                </div>
            </div>
            
            <div class="section-subtitle">🛏️ Chambres / Bedrooms</div>
            <div class="card">
                <div class="card-content">
                    ${infosGite.chambres || '• 2 chambres doubles / 2 double bedrooms'}<br>
                    • Draps fournis / Sheets provided<br>
                    • Couettes / Duvets<br>
                    • Oreillers / Pillows<br>
                    • Placards / Wardrobes
                </div>
            </div>
            
            <div class="section-subtitle">🚿 Salle de bain / Bathroom</div>
            <div class="card">
                <div class="card-content">
                    • Douche / Shower<br>
                    • Serviettes fournies / Towels provided<br>
                    • Sèche-cheveux / Hair dryer<br>
                    • Produits de toilette / Toiletries
                </div>
            </div>
            
            <div class="section-subtitle">🌳 Extérieur / Outdoor</div>
            <div class="card">
                <div class="card-content">
                    • Jardin privatif / Private garden<br>
                    • Mobilier de jardin / Garden furniture<br>
                    • Barbecue (charbon non fourni / charcoal not provided)<br>
                    • Parking gratuit / Free parking
                </div>
            </div>
        </div>
        
        <!-- Mode d'emploi -->
        <div class="section">
            <div class="section-title">🔧 Mode d'emploi / User Guide</div>
            
            <div class="card">
                <div class="card-title">🔥 Chauffage / Heating</div>
                <div class="card-content">
                    Thermostat dans le salon. Réglage recommandé: 20°C.<br>
                    Thermostat in living room. Recommended setting: 20°C.
                </div>
            </div>
            
            <div class="card">
                <div class="card-title">🧺 Machine à laver / Washing Machine</div>
                <div class="card-content">
                    Programme coton 40°C recommandé. Lessive fournie.<br>
                    Cotton 40°C program recommended. Detergent provided.
                </div>
            </div>
            
            <div class="card">
                <div class="card-title">🍽️ Lave-vaisselle / Dishwasher</div>
                <div class="card-content">
                    Tablettes fournies. Programme éco 50°C.<br>
                    Tablets provided. Eco program 50°C.
                </div>
            </div>
            
            <div class="card">
                <div class="card-title">📺 TV</div>
                <div class="card-content">
                    Télécommande sur la table basse. TNT uniquement.<br>
                    Remote on coffee table. Freeview only.
                </div>
            </div>
        </div>
        
        <!-- Entretien quotidien -->
        <div class="section">
            <div class="section-title">🧹 Entretien quotidien / Daily Maintenance</div>
            
            <div class="card">
                <div class="card-title">🗑️ Poubelles / Trash</div>
                <div class="card-content">
                    Sortir les poubelles tous les soirs. Tri sélectif obligatoire.<br>
                    Take out trash every evening. Recycling required.<br><br>
                    <strong>Jours de collecte / Collection days:</strong><br>
                    • Ordures ménagères / General waste: Mardi & Vendredi / Tuesday & Friday<br>
                    • Recyclage / Recycling: Jeudi / Thursday
                </div>
            </div>
            
            <div class="card">
                <div class="card-title">🧼 Produits d'entretien / Cleaning Products</div>
                <div class="card-content">
                    Tous les produits sont fournis sous l'évier.<br>
                    All products provided under the sink.
                </div>
            </div>
        </div>
        
        <!-- Urgences -->
        <div class="section">
            <div class="section-title">🚨 Urgences / Emergencies</div>
            
            <div class="alert alert-danger">
                <div style="flex: 1;">
                    <strong>Numéros d'urgence / Emergency Numbers:</strong><br>
                    • Pompiers / Fire: 18<br>
                    • SAMU: 15<br>
                    • Police: 17<br>
                    • Numéro d'urgence européen / European: 112
                </div>
            </div>
            
            <div class="card">
                <div class="card-title">⚡ Coupure électricité / Power Outage</div>
                <div class="card-content">
                    Disjoncteur dans l'entrée. Si problème persiste, nous contacter.<br>
                    Circuit breaker in entrance. If issue persists, contact us.
                </div>
            </div>
            
            <div class="card">
                <div class="card-title">💧 Fuite d'eau / Water Leak</div>
                <div class="card-content">
                    Robinet d'arrêt général sous l'évier de la cuisine.<br>
                    Main water valve under kitchen sink.
                </div>
            </div>
            
            ${infosGite.telephone ? `
            <div class="text-center mt-20">
                <a href="tel:${infosGite.telephone}" class="btn btn-danger btn-lg">
                    📞 Nous contacter / Contact Us: ${infosGite.telephone}
                </a>
            </div>` : ''}
        </div>
        
        <!-- Services à proximité -->
        <div class="section">
            <div class="section-title">🛒 Services à proximité / Nearby Services</div>
            
            <div class="card">
                <div class="card-title">🥖 Boulangerie / Bakery</div>
                <div class="card-content">
                    À 2 km - Ouvert 7h-19h / 2km away - Open 7am-7pm
                </div>
            </div>
            
            <div class="card">
                <div class="card-title">🛍️ Supermarché / Supermarket</div>
                <div class="card-content">
                    À 5 km - Ouvert 8h30-20h / 5km away - Open 8:30am-8pm
                </div>
            </div>
            
            <div class="card">
                <div class="card-title">⚕️ Pharmacie / Pharmacy</div>
                <div class="card-content">
                    À 3 km - Ouvert 9h-19h / 3km away - Open 9am-7pm
                </div>
            </div>
            
            <div class="card">
                <div class="card-title">⛽ Station-service / Gas Station</div>
                <div class="card-content">
                    À 4 km - 24h/24 / 4km away - 24/7
                </div>
            </div>
        </div>
    </div>
    `;
}

// Suite dans le prochain fichier...
