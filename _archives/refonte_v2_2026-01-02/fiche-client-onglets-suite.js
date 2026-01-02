// ================================================================
// GÉNÉRATEURS ONGLETS - PARTIE 3 (SUITE)
// ================================================================

/**
 * ONGLET 4: DÉPART
 */
function genererOngletDepart(reservation, infosGite) {
    const dateFin = new Date(reservation.dateFin);
    const estDimanche = dateFin.getDay() === 0;
    
    return `
    <div id="tab-depart" class="tab-pane">
        <!-- Horaire de départ -->
        <div class="section">
            <div class="section-title">⏰ Horaire de départ / Check-out Time</div>
            
            <div class="alert alert-warning">
                <div style="flex: 1; text-align: center;">
                    <strong style="font-size: 1.2rem;">Départ avant 10h00 / Check-out before 10:00 AM</strong>
                </div>
            </div>
            
            ${estDimanche ? `
            <div class="alert alert-success">
                <div style="flex: 1;">
                    🎉 <strong>Dimanche / Sunday:</strong> Départ possible jusqu'à 17h!<br>
                    Check-out possible until 5:00 PM!
                </div>
            </div>` : ''}
            
            <div class="alert alert-info">
                Pour un départ anticipé, merci de nous prévenir.<br>
                For early check-out, please notify us in advance.
            </div>
        </div>
        
        <!-- Checklist départ -->
        <div class="section">
            <div class="section-title">✅ Checklist de départ / Check-out Checklist</div>
            
            <div class="checklist">
                <label class="checklist-item">
                    <input type="checkbox">
                    <span>✅ Vaisselle lavée et rangée / Dishes washed and put away</span>
                </label>
                <label class="checklist-item">
                    <input type="checkbox">
                    <span>🗑️ Poubelles sorties / Trash taken out</span>
                </label>
                <label class="checklist-item">
                    <input type="checkbox">
                    <span>🪟 Volets ouverts / Shutters opened</span>
                </label>
                <label class="checklist-item">
                    <input type="checkbox">
                    <span>🔥 Chauffage/Clim éteint / Heating/AC turned off</span>
                </label>
                <label class="checklist-item">
                    <input type="checkbox">
                    <span>🪟 Fenêtres fermées / Windows closed</span>
                </label>
                <label class="checklist-item">
                    <input type="checkbox">
                    <span>💡 Lumières éteintes / Lights turned off</span>
                </label>
                <label class="checklist-item">
                    <input type="checkbox">
                    <span>🧳 Vérifier objets oubliés / Check for forgotten items</span>
                </label>
                <label class="checklist-item">
                    <input type="checkbox">
                    <span>🧺 Linge retiré des machines / Laundry removed from machines</span>
                </label>
            </div>
        </div>
        
        <!-- Restitution clés -->
        <div class="section">
            <div class="section-title">🔑 Restitution des clés / Key Return</div>
            
            <div class="card">
                <div class="card-content" style="font-size: 1.1rem;">
                    1️⃣ Laisser les clés sur la table de la cuisine<br>
                    <em style="font-size: 0.9rem;">Leave the keys on the kitchen table</em><br><br>
                    
                    2️⃣ Fermer la porte en partant<br>
                    <em style="font-size: 0.9rem;">Close the door when leaving</em><br><br>
                    
                    3️⃣ La porte se verrouille automatiquement<br>
                    <em style="font-size: 0.9rem;">Door locks automatically</em>
                </div>
            </div>
            
            ${infosGite.instructions_depart ? `
            <div class="card mt-20">
                <div class="card-title">📋 Instructions détaillées / Detailed Instructions</div>
                <div class="card-content" style="white-space: pre-wrap;">${infosGite.instructions_depart}</div>
            </div>` : ''}
        </div>
        
        <!-- Ménage -->
        <div class="section">
            <div class="section-title">🧹 Ménage / Cleaning</div>
            
            <div class="alert alert-success">
                <div style="flex: 1;">
                    ✅ <strong>Le ménage de fin de séjour est inclus dans le tarif.</strong><br>
                    End-of-stay cleaning is included in the price.<br><br>
                    
                    Nous vous demandons simplement de laisser le gîte en bon état.<br>
                    We simply ask that you leave the cottage in good condition.
                </div>
            </div>
            
            <div class="card">
                <div class="card-title">Ce que nous attendons / What we expect</div>
                <div class="card-content">
                    ✅ Vaisselle lavée / Dishes washed<br>
                    ✅ Poubelles sorties / Trash out<br>
                    ✅ Gîte rangé / Cottage tidy<br>
                    ✅ Pas de dégâts / No damage
                </div>
            </div>
            
            <div class="card">
                <div class="card-title">Ce que nous ne demandons PAS / What we do NOT require</div>
                <div class="card-content">
                    ❌ Nettoyer les sols / Clean floors<br>
                    ❌ Nettoyer la salle de bain / Clean bathroom<br>
                    ❌ Changer les draps / Change sheets<br>
                    ❌ Passer l'aspirateur / Vacuum
                </div>
            </div>
        </div>
        
        <!-- Caution -->
        <div class="section">
            <div class="section-title">💰 Caution / Deposit</div>
            
            <div class="alert alert-info">
                <div style="flex: 1;">
                    <strong>Montant / Amount: 300€</strong><br><br>
                    
                    La caution sera restituée sous 7 jours après vérification de l'état des lieux.<br>
                    Deposit will be returned within 7 days after inspection.<br><br>
                    
                    Mode de restitution: virement bancaire ou chèque non encaissé.<br>
                    Return method: bank transfer or uncashed check.
                </div>
            </div>
        </div>
        
        <!-- Itinéraire retour -->
        <div class="section">
            <div class="section-title">🚗 Itinéraire retour / Return Route</div>
            
            ${infosGite.gpsLat && infosGite.gpsLon ? `
            <div class="text-center">
                <a href="https://www.google.com/maps/dir/${infosGite.gpsLat},${infosGite.gpsLon}" 
                   target="_blank" 
                   class="btn btn-primary btn-lg">
                    🗺️ Ouvrir l'itinéraire / Open Route
                </a>
            </div>` : ''}
            
            <div class="card mt-20">
                <div class="card-title">🚗 Vers l'autoroute / To Highway</div>
                <div class="card-content">
                    Suivre direction A6 - Environ 15 minutes<br>
                    Follow signs to A6 - Approximately 15 minutes
                </div>
            </div>
            
            <div class="card">
                <div class="card-title">🚂 Vers la gare / To Train Station</div>
                <div class="card-content">
                    Gare de Villefranche-sur-Saône - 20 minutes<br>
                    Villefranche-sur-Saône Station - 20 minutes
                </div>
            </div>
        </div>
        
        <!-- Merci -->
        <div class="section text-center" style="background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%); color: white;">
            <h2 style="font-size: 2rem; margin-bottom: 15px;">🌟 Merci pour votre séjour !</h2>
            <p style="font-size: 1.2rem; opacity: 0.95;">
                Thank you for your stay!<br>
                Nous espérons vous revoir bientôt 💙<br>
                We hope to see you again soon!
            </p>
        </div>
    </div>
    `;
}

/**
 * ONGLET 5: À DÉCOUVRIR
 */
function genererOngletDecouvrir(activites, gite) {
    // Grouper par type
    const parType = {};
    activites.forEach(act => {
        const type = act.type || 'Autre';
        if (!parType[type]) {
            parType[type] = [];
        }
        parType[type].push(act);
    });
    
    const types = Object.keys(parType);
    
    return `
    <div id="tab-decouvrir" class="tab-pane">
        <div class="section">
            <div class="section-title">🎯 À Découvrir / Things to Discover</div>
            
            ${activites.length === 0 ? `
            <div class="alert alert-info">
                Aucune activité enregistrée pour le moment.<br>
                No activities recorded yet.<br><br>
                Consultez les offices de tourisme locaux pour plus d'informations.<br>
                Check local tourist offices for more information.
            </div>` : `
            
            <!-- Filtres catégories -->
            <div class="section-subtitle">Filtrer par catégorie / Filter by Category</div>
            <div style="display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 25px;">
                <button class="btn btn-primary" onclick="filtrerActivites('all')" id="filter-all">
                    📍 Toutes / All
                </button>
                ${types.map(type => `
                <button class="btn" style="background: #e0e0e0; color: #333;" 
                        onclick="filtrerActivites('${type}')" 
                        id="filter-${type.replace(/\s+/g, '-')}">
                    ${type}
                </button>`).join('')}
            </div>
            
            <!-- Liste activités -->
            <div class="activites-grid" id="activites-container">
                ${Object.entries(parType).map(([type, items]) => `
                    ${items.map(act => `
                    <div class="activite-card" data-type="${type}">
                        <div class="activite-header">
                            <div class="activite-name">${act.nom}</div>
                            ${act.distance ? `<div class="activite-badge">${act.distance} km</div>` : ''}
                        </div>
                        ${act.type ? `<div style="color: var(--color-info); font-size: 0.9rem; margin-bottom: 8px;">${act.type}</div>` : ''}
                        ${act.adresse ? `<div style="color: #666; margin-bottom: 5px;">📍 ${act.adresse}</div>` : ''}
                        ${act.phone ? `<div style="color: #666; margin-bottom: 5px;">📞 <a href="tel:${act.phone}">${act.phone}</a></div>` : ''}
                        ${act.opening_hours ? `<div style="color: #666; margin-bottom: 5px;">🕐 ${act.opening_hours}</div>` : ''}
                        <div class="activite-links">
                            ${act.website ? `<a href="${act.website}" target="_blank">🌐 Site web / Website</a>` : ''}
                            ${act.latitude && act.longitude ? `<a href="https://www.google.com/maps?q=${act.latitude},${act.longitude}" target="_blank">🗺️ Carte / Map</a>` : ''}
                        </div>
                    </div>
                    `).join('')}
                `).join('')}
            </div>
            `}
        </div>
        
        <!-- Nos coups de coeur -->
        <div class="section">
            <div class="section-title">⭐ Nos coups de cœur / Our Favorites</div>
            
            <div class="card">
                <div class="card-title">🍽️ Restaurant</div>
                <div class="card-content">
                    À compléter selon votre région<br>
                    To be completed based on your area
                </div>
            </div>
            
            <div class="card">
                <div class="card-title">🏞️ Balade</div>
                <div class="card-content">
                    À compléter selon votre région<br>
                    To be completed based on your area
                </div>
            </div>
            
            <div class="card">
                <div class="card-title">🎭 Visite</div>
                <div class="card-content">
                    À compléter selon votre région<br>
                    To be completed based on your area
                </div>
            </div>
        </div>
    </div>
    `;
}

/**
 * ONGLET 6: MES HORAIRES
 */
function genererOngletHoraires(reservation, prochainMenage) {
    const bloqueAvant17h = prochainMenage && prochainMenage.time_of_day === 'afternoon';
    const dateFin = new Date(reservation.dateFin);
    const estDimanche = dateFin.getDay() === 0;
    
    return `
    <div id="tab-horaires" class="tab-pane">
        <div class="section">
            <div class="section-title">⏰ Confirmez vos horaires / Confirm Your Schedule</div>
            
            <div class="alert alert-info">
                📝 Merci de renseigner vos horaires d'arrivée et de départ pour que nous puissions mieux vous accueillir.<br>
                Please provide your arrival and departure times so we can better welcome you.
            </div>
            
            ${bloqueAvant17h ? `
            <div class="alert alert-warning">
                ⚠️ <strong>Arrivée possible à partir de 17h minimum</strong> (ménage programmé l'après-midi).<br>
                Arrival possible from 5:00 PM minimum (cleaning scheduled in the afternoon).
            </div>` : ''}
            
            <form id="form-horaires" onsubmit="return soumettreHoraires(event)">
                <input type="hidden" id="reservation_id" value="${reservation.id}">
                
                <!-- Heure d'arrivée -->
                <div class="slider-container">
                    <div class="slider-label">
                        <strong>🔑 Heure d'arrivée / Arrival Time</strong>
                        <span class="slider-value" id="arrivee-display">18:00</span>
                    </div>
                    <input type="range" 
                           id="heure_arrivee" 
                           class="slider" 
                           min="${bloqueAvant17h ? 17 : 16}" 
                           max="22" 
                           step="0.5" 
                           value="18"
                           oninput="updateSliderDisplay('arrivee', this.value)">
                    <div style="display: flex; justify-content: space-between; margin-top: 5px; font-size: 0.85rem; color: #666;">
                        <span>${bloqueAvant17h ? '17:00' : '16:00'}</span>
                        <span>22:00</span>
                    </div>
                </div>
                
                <!-- Heure de départ -->
                <div class="slider-container">
                    <div class="slider-label">
                        <strong>🚪 Heure de départ / Departure Time</strong>
                        <span class="slider-value" id="depart-display">10:00</span>
                    </div>
                    <input type="range" 
                           id="heure_depart" 
                           class="slider" 
                           min="8" 
                           max="${estDimanche ? 17 : 12}" 
                           step="0.5" 
                           value="10"
                           oninput="updateSliderDisplay('depart', this.value)">
                    <div style="display: flex; justify-content: space-between; margin-top: 5px; font-size: 0.85rem; color: #666;">
                        <span>08:00</span>
                        <span>${estDimanche ? '17:00 (Dimanche)' : '12:00'}</span>
                    </div>
                    ${estDimanche ? `
                    <div class="alert alert-success" style="margin-top: 15px;">
                        ✅ <strong>Dimanche:</strong> Départ possible jusqu'à 17h!<br>
                        Sunday: Check-out possible until 5:00 PM!
                    </div>` : ''}
                </div>
                
                <!-- Commentaires -->
                <div class="form-group">
                    <label class="form-label">💬 Commentaires (optionnel) / Comments (optional)</label>
                    <textarea id="commentaires" 
                              placeholder="Arrivée tardive, besoins spécifiques, questions...
Late arrival, special needs, questions..."></textarea>
                </div>
                
                <!-- Bouton submit -->
                <button type="submit" class="btn btn-success btn-lg" id="btn-submit-horaires">
                    ✅ Valider mes horaires / Confirm My Schedule
                </button>
                
                <!-- Message confirmation -->
                <div id="message-confirmation-horaires" class="hidden">
                    <div class="alert alert-success" style="margin-top: 20px;">
                        ✅ <strong>Merci ! Vos horaires ont été enregistrés.</strong><br>
                        Thank you! Your schedule has been recorded.<br><br>
                        Nous vous attendons avec impatience ! 🎉<br>
                        We look forward to welcoming you!
                    </div>
                </div>
            </form>
        </div>
    </div>
    `;
}

/**
 * ONGLET 7: FEEDBACK
 */
function genererOngletFeedback(reservation) {
    return `
    <div id="tab-feedback" class="tab-pane">
        <div class="section">
            <div class="section-title">💬 Votre avis compte / Your Opinion Matters</div>
            
            <div class="alert alert-info">
                Aidez-nous à nous améliorer en partageant votre expérience !<br>
                Help us improve by sharing your experience!
            </div>
            
            <form id="form-feedback" onsubmit="return soumettreFeedback(event)">
                <input type="hidden" id="feedback_reservation_id" value="${reservation.id}">
                
                <!-- Expérience globale -->
                <div class="form-group">
                    <label class="form-label">😊 Comment s'est passé votre séjour ? / How was your stay?</label>
                    <div class="emoji-rating" id="emoji-rating">
                        <span class="emoji" data-value="1" onclick="selectEmoji(1)">😢</span>
                        <span class="emoji" data-value="2" onclick="selectEmoji(2)">😐</span>
                        <span class="emoji" data-value="3" onclick="selectEmoji(3)">🙂</span>
                        <span class="emoji" data-value="4" onclick="selectEmoji(4)">😊</span>
                        <span class="emoji" data-value="5" onclick="selectEmoji(5)">🤩</span>
                    </div>
                    <input type="hidden" id="note_globale" required>
                </div>
                
                <!-- Notes par critère -->
                <div class="section-subtitle">Notes détaillées / Detailed Ratings</div>
                
                ${['proprete', 'confort', 'equipements', 'localisation', 'communication'].map(critere => {
                    const labels = {
                        proprete: '🧹 Propreté / Cleanliness',
                        confort: '🛋️ Confort / Comfort',
                        equipements: '🏠 Équipements / Equipment',
                        localisation: '📍 Localisation / Location',
                        communication: '📞 Communication'
                    };
                    
                    return `
                    <div class="rating-container">
                        <label class="rating-label">${labels[critere]}</label>
                        <div class="stars" id="stars-${critere}">
                            ${[1,2,3,4,5].map(i => `<span class="star" data-value="${i}" onclick="selectStar('${critere}', ${i})">⭐</span>`).join('')}
                        </div>
                        <input type="hidden" id="note_${critere}">
                    </div>
                    `;
                }).join('')}
                
                <!-- Points positifs -->
                <div class="form-group">
                    <label class="form-label">✅ Qu'avez-vous particulièrement apprécié ? / What did you particularly appreciate?</label>
                    <textarea id="points_positifs" 
                              placeholder="Décrivez ce qui vous a plu...
Describe what you enjoyed..."></textarea>
                </div>
                
                <!-- Problèmes rencontrés -->
                <div class="form-group">
                    <label class="form-label">⚠️ Y a-t-il eu des problèmes ? / Were there any issues?</label>
                    <textarea id="problemes_rencontres" 
                              placeholder="Décrivez les problèmes éventuels...
Describe any issues..."></textarea>
                    
                    <div class="checkbox-group" style="margin-top: 15px;">
                        <label class="checkbox-label">
                            <input type="checkbox" name="cat_probleme" value="proprete">
                            🧹 Problème de propreté / Cleanliness issue
                        </label>
                        <label class="checkbox-label">
                            <input type="checkbox" name="cat_probleme" value="equipement">
                            🔧 Équipement cassé/manquant / Broken/missing equipment
                        </label>
                        <label class="checkbox-label">
                            <input type="checkbox" name="cat_probleme" value="bruit">
                            🔇 Nuisance sonore / Noise
                        </label>
                        <label class="checkbox-label">
                            <input type="checkbox" name="cat_probleme" value="chauffage">
                            🔥 Problème chauffage/clim / Heating/AC issue
                        </label>
                        <label class="checkbox-label">
                            <input type="checkbox" name="cat_probleme" value="wifi">
                            📶 Problème WiFi / WiFi issue
                        </label>
                        <label class="checkbox-label">
                            <input type="checkbox" name="cat_probleme" value="autre">
                            ℹ️ Autre / Other
                        </label>
                    </div>
                </div>
                
                <!-- Suggestions -->
                <div class="form-group">
                    <label class="form-label">💡 Comment pourrions-nous nous améliorer ? / How could we improve?</label>
                    <textarea id="suggestions" 
                              placeholder="Vos suggestions sont les bienvenues...
Your suggestions are welcome..."></textarea>
                </div>
                
                <!-- Recommandation -->
                <div class="form-group">
                    <label class="form-label">🎁 Recommanderiez-vous ce gîte à vos amis ? / Would you recommend this cottage to friends?</label>
                    <div style="display: flex; gap: 15px; justify-content: center; margin-top: 15px;">
                        <label class="btn" style="flex: 1; cursor: pointer;" onclick="selectRecommandation('oui')">
                            <input type="radio" name="recommandation" value="oui" id="reco-oui" style="display: none;">
                            <span id="label-reco-oui">✅ Oui / Yes</span>
                        </label>
                        <label class="btn" style="flex: 1; cursor: pointer;" onclick="selectRecommandation('peut-etre')">
                            <input type="radio" name="recommandation" value="peut-etre" id="reco-peut-etre" style="display: none;">
                            <span id="label-reco-peut-etre">🤔 Peut-être / Maybe</span>
                        </label>
                        <label class="btn" style="flex: 1; cursor: pointer;" onclick="selectRecommandation('non')">
                            <input type="radio" name="recommandation" value="non" id="reco-non" style="display: none;">
                            <span id="label-reco-non">❌ Non / No</span>
                        </label>
                    </div>
                </div>
                
                <!-- Bouton submit -->
                <button type="submit" class="btn btn-primary btn-lg" id="btn-submit-feedback">
                    📤 Envoyer mon feedback / Send My Feedback
                </button>
                
                <!-- Message confirmation -->
                <div id="message-confirmation-feedback" class="hidden">
                    <div class="alert alert-success" style="margin-top: 20px;">
                        ✅ <strong>Merci pour votre retour !</strong><br>
                        Thank you for your feedback!<br><br>
                        Votre avis est précieux pour nous améliorer. 💙<br>
                        Your feedback is valuable to help us improve.
                    </div>
                </div>
            </form>
        </div>
    </div>
    `;
}

// Helpers
function calculerNuits(dateDebut, dateFin) {
    const d1 = new Date(dateDebut);
    const d2 = new Date(dateFin);
    return Math.ceil((d2 - d1) / (1000 * 60 * 60 * 24));
}

function formatDateLong(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function genererFAQHTML(faqItems) {
    if (!faqItems || faqItems.length === 0) {
        return '<p>Aucune question fréquente disponible.</p>';
    }
    
    return faqItems.map(item => `
        <div class="faq-item">
            <div class="faq-question">❔ ${item.question}</div>
            <div class="faq-answer">${item.reponse}</div>
        </div>
    `).join('');
}
