/**
 * APPLICATION FICHE CLIENT INTERACTIVE
 * Gestion de la fiche personnalisée par réservation pour les clients
 */

// ==================== CONFIGURATION ====================
// Protection contre double chargement
if (!window.ficheClientAppLoaded) {
    window.ficheClientAppLoaded = true;

    const SUPABASE_URL = 'https://ivqiisnudabxemcxxyru.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2cWlpc251ZGFieGVtY3h4eXJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzOTk0NjMsImV4cCI6MjA4MDk3NTQ2M30.9FwJPgR8bbaP7bAemuaVbAN019EO5ql7uciQO9FeHK4';

    // Initialiser Supabase (une seule fois)
    if (!window.ficheClientSupabase) {
        const { createClient } = window.supabase;
        window.ficheClientSupabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    }
}

// Référence Supabase (utiliser var pour éviter redéclaration)
var supabase = window.ficheClientSupabase;

// ==================== VARIABLES GLOBALES ====================
var currentLanguage = 'fr';
var reservationData = null;
var giteInfo = null;
var token = null;
var cleaningSchedule = null;

// ==================== TRADUCTIONS ====================
const translations = {
    fr: {
        tab_entree: 'Entrée',
        tab_pendant: 'Pendant',
        tab_sortie: 'Sortie',
        tab_activites: 'Activités',
        adresse_title: '📍 Adresse du gîte',
        ouvrir_maps: 'Ouvrir dans Google Maps',
        horaire_arrivee: '⏰ Horaire d\'arrivée',
        demander_arrivee: 'Demander une arrivée plus tôt',
        heure_souhaitee: 'Heure souhaitée',
        motif_optionnel: 'Motif (optionnel)',
        envoyer: 'Envoyer',
        annuler: 'Annuler',
        code_entree: '🔑 Code d\'entrée',
        instructions_acces: 'Instructions d\'accès',
        reseau: 'Réseau',
        mot_de_passe: 'Mot de passe',
        checklist_entree: '✅ Checklist d\'arrivée',
        progression: 'Progression',
        equipements: '🏡 Équipements disponibles',
        reglement: '📋 Règlement intérieur',
        contacts_urgence: '📞 Contacts d\'urgence',
        vos_retours: '💬 Demandes / Retours / Améliorations',
        description_retours: 'N\'hésitez pas à nous faire part de vos besoins ou suggestions',
        type: 'Type',
        sujet: 'Sujet',
        description: 'Description',
        urgence: 'Niveau d\'urgence',
        urgence_basse: 'Basse',
        urgence_normale: 'Normale',
        urgence_haute: 'Haute',
        horaire_depart: '⏰ Horaire de départ',
        demander_depart: 'Demander un départ plus tard',
        instructions_sortie: '📝 Instructions de départ',
        checklist_sortie: '✅ Checklist de départ',
        activites_title: '🗺️ Activités à découvrir',
        arrivee_possible_13h: 'Arrivée possible dès 13h (pas de ménage l\'après-midi)',
        arrivee_possible_17h: 'Arrivée possible à partir de 17h (ménage en cours l\'après-midi)',
        depart_possible_12h: 'Départ jusqu\'à 12h possible en semaine (sur validation)',
        depart_possible_17h_dimanche: 'Départ jusqu\'à 17h possible le dimanche si pas de ménage l\'après-midi',
        demande_envoyee: 'Votre demande a été envoyée avec succès !',
        erreur: 'Une erreur s\'est produite. Veuillez réessayer.',
        retour_envoye: 'Votre message a été envoyé. Merci !',
        copie_success: 'Copié dans le presse-papier !',
        demande: '🙋 Demande',
        retour: '💬 Retour',
        amelioration: '💡 Amélioration',
        probleme: '⚠️ Problème'
    },
    en: {
        tab_entree: 'Check-in',
        tab_pendant: 'During stay',
        tab_sortie: 'Check-out',
        tab_activites: 'Activities',
        adresse_title: '📍 Address',
        ouvrir_maps: 'Open in Google Maps',
        horaire_arrivee: '⏰ Check-in time',
        demander_arrivee: 'Request early check-in',
        heure_souhaitee: 'Desired time',
        motif_optionnel: 'Reason (optional)',
        envoyer: 'Send',
        annuler: 'Cancel',
        code_entree: '🔑 Entry code',
        instructions_acces: 'Access instructions',
        reseau: 'Network',
        mot_de_passe: 'Password',
        checklist_entree: '✅ Check-in checklist',
        progression: 'Progress',
        equipements: '🏡 Available amenities',
        reglement: '📋 House rules',
        contacts_urgence: '📞 Emergency contacts',
        vos_retours: '💬 Requests / Feedback / Suggestions',
        description_retours: 'Feel free to share your needs or suggestions',
        type: 'Type',
        sujet: 'Subject',
        description: 'Description',
        urgence: 'Urgency level',
        urgence_basse: 'Low',
        urgence_normale: 'Normal',
        urgence_haute: 'High',
        horaire_depart: '⏰ Check-out time',
        demander_depart: 'Request late check-out',
        instructions_sortie: '📝 Check-out instructions',
        checklist_sortie: '✅ Check-out checklist',
        activites_title: '🗺️ Activities to discover',
        arrivee_possible_13h: 'Check-in available from 1pm (no afternoon cleaning)',
        arrivee_possible_17h: 'Check-in available from 5pm (cleaning in progress)',
        depart_possible_12h: 'Check-out until 12pm possible on weekdays (subject to approval)',
        depart_possible_17h_dimanche: 'Check-out until 5pm possible on Sundays if no afternoon cleaning',
        demande_envoyee: 'Your request has been sent successfully!',
        erreur: 'An error occurred. Please try again.',
        retour_envoye: 'Your message has been sent. Thank you!',
        copie_success: 'Copied to clipboard!',
        demande: '🙋 Request',
        retour: '💬 Feedback',
        amelioration: '💡 Suggestion',
        probleme: '⚠️ Issue'
    }
};

function t(key) {
    return translations[currentLanguage][key] || key;
}

function updateTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        el.textContent = t(key);
    });
    
    // Update select options
    document.querySelectorAll('[data-i18n-option]').forEach(el => {
        const key = el.getAttribute('data-i18n-option');
        el.textContent = t(key);
    });
}

// ==================== INITIALISATION ====================
document.addEventListener('DOMContentLoaded', async () => {
    // Forcer la langue française au démarrage
    currentLanguage = 'fr';
    
    // S'assurer que le bouton FR est actif
    document.querySelectorAll('.language-btn').forEach(btn => {
        if (btn.dataset.lang === 'fr') {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    // Récupérer le token depuis l'URL
    const urlParams = new URLSearchParams(window.location.search);
    token = urlParams.get('token');
    
    if (!token) {
        showError('Token manquant. Veuillez utiliser le lien fourni par email.');
        return;
    }
    
    try {
        await loadReservationData();
        await loadGiteInfo();
        await loadCleaningSchedule();
        initializeUI();
        initializeEventListeners();
        hideLoading();
    } catch (error) {
        console.error('Erreur lors du chargement:', error);
        showError('Impossible de charger les données. Veuillez réessayer plus tard.');
    }
});

async function loadReservationData() {
    // Valider le token et charger la réservation
    const { data: tokenData, error: tokenError } = await supabase
        .from('client_access_tokens')
        .select('*, reservation:reservations(*)')
        .eq('token', token)
        .single();
    
    if (tokenError || !tokenData) {
        throw new Error('Token invalide ou expiré');
    }
    
    // Vérifier l'expiration (désactivé en mode test si ?debug=1)
    const urlParams = new URLSearchParams(window.location.search);
    const debugMode = urlParams.get('debug') === '1';
    const isExpired = new Date(tokenData.expires_at) < new Date();
    
    if (isExpired && !debugMode) {
        console.error('🔴 Token expiré:', {
            expires_at: tokenData.expires_at,
            now: new Date().toISOString(),
            tip: 'Ajoutez ?debug=1 à l\'URL pour tester avec un vieux token'
        });
        throw new Error('Ce lien a expiré');
    }
    
    if (isExpired && debugMode) {
        console.warn('⚠️ Mode DEBUG: Token expiré mais affiché quand même');
    }
    
    // Mettre à jour les stats d'accès
    await supabase
        .from('client_access_tokens')
        .update({
            last_accessed_at: new Date().toISOString(),
            access_count: tokenData.access_count + 1
        })
        .eq('id', tokenData.id);
    
    reservationData = tokenData.reservation;
    
    // Enregistrer l'ouverture dans les logs
    await supabase
        .from('fiche_generation_logs')
        .update({
            opened_count: supabase.rpc('increment'),
            last_opened_at: new Date().toISOString()
        })
        .eq('reservation_id', reservationData.id)
        .eq('type_generation', 'html');
}

async function loadGiteInfo() {
    const { data, error } = await supabase
        .from('infos_gites')
        .select('*')
        .eq('gite', reservationData.gite.toLowerCase())
        .single();
    
    if (error) throw error;
    giteInfo = data;
}

async function loadCleaningSchedule() {
    const { data } = await supabase
        .from('cleaning_schedule')
        .select('*')
        .eq('gite', reservationData.gite)
        .eq('scheduled_date', reservationData.date_debut)
        .single();
    
    cleaningSchedule = data;
}

function initializeUI() {
    // Titre du gîte
    document.getElementById('giteName').textContent = `🏡 ${reservationData.gite}`;
    
    // Onglet Entrée
    initOngletEntree();
    
    // Onglet Pendant
    initOngletPendant();
    
    // Onglet Sortie
    initOngletSortie();
    
    // Onglet Activités
    initOngletActivites();
    
    // Appliquer les traductions
    updateTranslations();
}

function initOngletEntree() {
    // Adresse
    document.getElementById('giteAddress').textContent = giteInfo.adresse_complete;
    document.getElementById('mapsLink').href = giteInfo.google_maps_link || 
        `https://www.google.com/maps?q=${giteInfo.latitude},${giteInfo.longitude}`;
    
    // Horaire d'arrivée
    document.getElementById('heureArrivee').textContent = formatTime(giteInfo.heure_arrivee_standard);
    
    // Règle arrivée anticipée
    const heureMin = !cleaningSchedule || cleaningSchedule.time_of_day !== 'afternoon' 
        ? giteInfo.heure_arrivee_anticipee_min 
        : giteInfo.heure_arrivee_avec_menage;
    
    const regleKey = !cleaningSchedule || cleaningSchedule.time_of_day !== 'afternoon'
        ? 'arrivee_possible_13h'
        : 'arrivee_possible_17h';
    
    document.getElementById('regleArrivee').textContent = t(regleKey);
    document.getElementById('heureArriveeDemandee').min = formatTime(heureMin);
    document.getElementById('arriveeAnticipaBlock').style.display = 'block';
    
    // Code d'entrée
    document.getElementById('codeEntree').textContent = giteInfo.code_entree;
    
    // Instructions
    const instructions = currentLanguage === 'fr' 
        ? giteInfo.instructions_acces_fr 
        : giteInfo.instructions_acces_en;
    document.getElementById('instructionsAcces').textContent = instructions;
    
    // WiFi
    document.getElementById('wifiSSID').value = giteInfo.wifi_ssid;
    document.getElementById('wifiPassword').value = giteInfo.wifi_password;
    
    // QR Code WiFi
    if (giteInfo.wifi_qr_code_url) {
        document.getElementById('qrCodeContainer').innerHTML = `
            <p style="font-size: 0.875rem; color: var(--gray-600); margin-bottom: 0.5rem;">
                ${t('scanner_qr_code') || 'Scannez pour vous connecter'}
            </p>
            <img src="${giteInfo.wifi_qr_code_url}" alt="QR Code WiFi">
        `;
    }
    
    // PARKING
    const parkingInfo = currentLanguage === 'fr' 
        ? {
            dispo: giteInfo.parking_dispo,
            places: giteInfo.parking_places,
            details: giteInfo.parking_details
        }
        : {
            dispo: giteInfo.parking_dispo_en,
            places: giteInfo.parking_places_en,
            details: giteInfo.parking_details_en
        };
    
    let parkingHTML = '';
    if (parkingInfo.dispo) {
        parkingHTML += `<p style="margin-bottom: 0.75rem;"><strong>Disponibilité :</strong> ${parkingInfo.dispo}</p>`;
    }
    if (parkingInfo.places) {
        parkingHTML += `<p style="margin-bottom: 0.75rem;"><strong>Places :</strong> ${parkingInfo.places}</p>`;
    }
    if (parkingInfo.details) {
        parkingHTML += `<p style="white-space: pre-line; color: var(--gray-700);">${parkingInfo.details}</p>`;
    }
    if (!parkingHTML) {
        parkingHTML = '<p style="color: var(--gray-500); font-style: italic;">Aucune information disponible</p>';
    }
    document.getElementById('parkingInfo').innerHTML = parkingHTML;
    
    // Checklist d'entrée
    loadChecklist('entree', 'checklistEntreeContainer', 'progressEntree', 'progressEntreeText');
}

function initOngletPendant() {
    // CHAUFFAGE & CLIMATISATION
    const chauffageInfo = currentLanguage === 'fr'
        ? {
            type: giteInfo.type_chauffage,
            clim: giteInfo.climatisation,
            instructions: giteInfo.instructions_chauffage
        }
        : {
            type: giteInfo.type_chauffage_en,
            clim: giteInfo.climatisation_en,
            instructions: giteInfo.instructions_chauffage_en
        };
    
    let chauffageHTML = '';
    if (chauffageInfo.type) {
        chauffageHTML += `<p style="margin-bottom: 0.75rem;"><strong>Type de chauffage :</strong> ${chauffageInfo.type}</p>`;
    }
    if (chauffageInfo.clim) {
        chauffageHTML += `<p style="margin-bottom: 0.75rem;"><strong>Climatisation :</strong> ${chauffageInfo.clim}</p>`;
    }
    if (chauffageInfo.instructions) {
        chauffageHTML += `<div style="background: var(--gray-100); padding: 1rem; border-radius: 0.5rem; margin-top: 1rem;">
            <strong style="display: block; margin-bottom: 0.5rem;">📝 Instructions :</strong>
            <p style="white-space: pre-line; color: var(--gray-700);">${chauffageInfo.instructions}</p>
        </div>`;
    }
    if (!chauffageHTML) {
        chauffageHTML = '<p style="color: var(--gray-500); font-style: italic;">Aucune information disponible</p>';
    }
    document.getElementById('chauffageInfo').innerHTML = chauffageHTML;
    
    // CUISINE
    const cuisineInfo = currentLanguage === 'fr'
        ? {
            equipements: giteInfo.equipements_cuisine,
            four: giteInfo.instructions_four,
            plaques: giteInfo.instructions_plaques,
            laveVaisselle: giteInfo.instructions_lave_vaisselle,
            laveLinge: giteInfo.instructions_lave_linge
        }
        : {
            equipements: giteInfo.equipements_cuisine_en,
            four: giteInfo.instructions_four_en,
            plaques: giteInfo.instructions_plaques_en,
            laveVaisselle: giteInfo.instructions_lave_vaisselle_en,
            laveLinge: giteInfo.instructions_lave_linge_en
        };
    
    let cuisineHTML = '';
    if (cuisineInfo.equipements) {
        cuisineHTML += `<p style="margin-bottom: 1rem; white-space: pre-line;">${cuisineInfo.equipements}</p>`;
    }
    if (cuisineInfo.four) {
        cuisineHTML += `<div style="background: var(--gray-100); padding: 1rem; border-radius: 0.5rem; margin-bottom: 0.75rem;">
            <strong>🔥 Four :</strong><br>${cuisineInfo.four}
        </div>`;
    }
    if (cuisineInfo.plaques) {
        cuisineHTML += `<div style="background: var(--gray-100); padding: 1rem; border-radius: 0.5rem; margin-bottom: 0.75rem;">
            <strong>🍳 Plaques :</strong><br>${cuisineInfo.plaques}
        </div>`;
    }
    if (cuisineInfo.laveVaisselle) {
        cuisineHTML += `<div style="background: var(--gray-100); padding: 1rem; border-radius: 0.5rem; margin-bottom: 0.75rem;">
            <strong>🍽️ Lave-vaisselle :</strong><br>${cuisineInfo.laveVaisselle}
        </div>`;
    }
    if (cuisineInfo.laveLinge) {
        cuisineHTML += `<div style="background: var(--gray-100); padding: 1rem; border-radius: 0.5rem;">
            <strong>👕 Lave-linge :</strong><br>${cuisineInfo.laveLinge}
        </div>`;
    }
    if (!cuisineHTML) {
        cuisineHTML = '<p style="color: var(--gray-500); font-style: italic;">Aucune information disponible</p>';
    }
    document.getElementById('cuisineInfo').innerHTML = cuisineHTML;
    
    // TRI DES DÉCHETS
    const dechetsInfo = currentLanguage === 'fr'
        ? {
            tri: giteInfo.instructions_tri,
            collecte: giteInfo.jours_collecte,
            decheterie: giteInfo.decheterie
        }
        : {
            tri: giteInfo.instructions_tri_en,
            collecte: giteInfo.jours_collecte_en,
            decheterie: giteInfo.decheterie_en
        };
    
    let dechetsHTML = '';
    if (dechetsInfo.tri) {
        dechetsHTML += `<p style="margin-bottom: 1rem; white-space: pre-line;">${dechetsInfo.tri}</p>`;
    }
    if (dechetsInfo.collecte) {
        dechetsHTML += `<p style="margin-bottom: 0.75rem;"><strong>📅 Jours de collecte :</strong> ${dechetsInfo.collecte}</p>`;
    }
    if (dechetsInfo.decheterie) {
        dechetsHTML += `<div style="background: var(--gray-100); padding: 1rem; border-radius: 0.5rem;">
            <strong>🏭 Déchèterie :</strong><br>${dechetsInfo.decheterie}
        </div>`;
    }
    if (!dechetsHTML) {
        dechetsHTML = '<p style="color: var(--gray-500); font-style: italic;">Aucune information disponible</p>';
    }
    document.getElementById('dechetsInfo').innerHTML = dechetsHTML;
    
    // Équipements
    if (giteInfo.equipements && giteInfo.equipements.length > 0) {
        const container = document.getElementById('equipementsContainer');
        container.innerHTML = giteInfo.equipements.map(eq => {
            const nom = currentLanguage === 'fr' ? eq.nom_fr : eq.nom_en;
            return `
                <div style="display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem; border-bottom: 1px solid var(--gray-200);">
                    <span style="font-size: 1.5rem;">${eq.icone || '✓'}</span>
                    <span>${nom}</span>
                </div>
            `;
        }).join('');
    }
    
    // Règlement intérieur
    const reglement = currentLanguage === 'fr' 
        ? giteInfo.reglement_interieur_fr 
        : giteInfo.reglement_interieur_en;
    document.getElementById('reglementInterieur').textContent = reglement || '';
    
    // Contacts d'urgence
    if (giteInfo.contacts_urgence && giteInfo.contacts_urgence.length > 0) {
        const container = document.getElementById('contactsUrgenceContainer');
        container.innerHTML = giteInfo.contacts_urgence.map(contact => `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 1rem; border: 1px solid var(--gray-200); border-radius: 0.5rem; margin-bottom: 0.5rem;">
                <div>
                    <div style="font-weight: 600;">${contact.nom}</div>
                    <div style="color: var(--gray-600);">${contact.type || ''}</div>
                </div>
                <a href="tel:${contact.telephone}" class="btn btn-primary">
                    📞 Appeler
                </a>
            </div>
        `).join('');
    }
}

function initOngletSortie() {
    // Horaire de départ
    document.getElementById('heureDepart').textContent = formatTime(giteInfo.heure_depart_standard);
    
    // Règle départ tardif
    const isDimanche = new Date(reservationData.date_fin).getDay() === 0;
    const regleKey = isDimanche ? 'depart_possible_17h_dimanche' : 'depart_possible_12h';
    document.getElementById('regleDepart').textContent = t(regleKey);
    
    const heureMax = isDimanche && (!cleaningSchedule || cleaningSchedule.time_of_day !== 'afternoon')
        ? giteInfo.heure_depart_dimanche_max
        : giteInfo.heure_depart_semaine_max;
    
    document.getElementById('heureDepartDemandee').max = formatTime(heureMax);
    document.getElementById('departTardifBlock').style.display = 'block';
    
    // Instructions de sortie
    const instructions = currentLanguage === 'fr'
        ? (giteInfo.instructions_sortie_fr || '')
        : (giteInfo.instructions_sortie_en || '');
    document.getElementById('instructionsSortie').textContent = instructions;
    
    // Checklist de sortie
    loadChecklist('sortie', 'checklistSortieContainer', 'progressSortie', 'progressSortieText');
}

function initOngletActivites() {
    // Charger la carte et les activités (réutiliser le code existant)
    loadActivitesMap();
}

async function loadChecklist(type, containerId, progressId, progressTextId) {
    // Charger les items de la checklist
    const { data: items } = await supabase
        .from('checklists')
        .select('*')
        .eq('gite', reservationData.gite)
        .eq('type', type)
        .eq('actif', true)
        .order('ordre');
    
    // Charger les validations existantes
    const { data: validations } = await supabase
        .from('checklist_validations')
        .select('*')
        .eq('reservation_id', reservationData.id);
    
    const validationsMap = {};
    validations?.forEach(v => {
        validationsMap[v.checklist_id] = v.validated;
    });
    
    const container = document.getElementById(containerId);
    container.innerHTML = items.map(item => {
        const isChecked = validationsMap[item.id] || false;
        const itemText = currentLanguage === 'fr' ? item.item_fr : item.item_en;
        
        return `
            <div class="checkbox-group ${isChecked ? 'checked' : ''}" data-checklist-id="${item.id}">
                <input type="checkbox" class="checkbox" ${isChecked ? 'checked' : ''} 
                       onchange="toggleChecklistItem(${item.id}, this.checked, '${type}')">
                <label class="checkbox-label">
                    ${itemText}
                    ${item.obligatoire ? '<span style="color: var(--danger);">*</span>' : ''}
                </label>
            </div>
        `;
    }).join('');
    
    updateChecklistProgress(items.length, validations?.filter(v => v.validated).length || 0, progressId, progressTextId);
}

async function toggleChecklistItem(checklistId, validated, type) {
    const parentDiv = document.querySelector(`[data-checklist-id="${checklistId}"]`);
    if (validated) {
        parentDiv.classList.add('checked');
    } else {
        parentDiv.classList.remove('checked');
    }
    
    // Sauvegarder dans la base
    await supabase
        .from('checklist_validations')
        .upsert({
            reservation_id: reservationData.id,
            checklist_id: checklistId,
            validated: validated,
            validated_at: validated ? new Date().toISOString() : null
        });
    
    // Mettre à jour la progression
    const container = type === 'entree' ? 'checklistEntreeContainer' : 'checklistSortieContainer';
    const progressId = type === 'entree' ? 'progressEntree' : 'progressSortie';
    const progressTextId = type === 'entree' ? 'progressEntreeText' : 'progressSortieText';
    
    const checkboxes = document.querySelectorAll(`#${container} .checkbox`);
    const total = checkboxes.length;
    const checked = Array.from(checkboxes).filter(cb => cb.checked).length;
    
    updateChecklistProgress(total, checked, progressId, progressTextId);
}

function updateChecklistProgress(total, checked, progressId, progressTextId) {
    const percentage = total > 0 ? Math.round((checked / total) * 100) : 0;
    document.getElementById(progressId).style.width = `${percentage}%`;
    document.getElementById(progressTextId).textContent = `${percentage}%`;
}

function initOngletActivites() {
    // Réutiliser la logique de decouvrir.js pour afficher la carte et les activités
    loadActivitesForClient();
}

async function loadActivitesForClient() {
    const { data: activites } = await supabase
        .from('activites_gites')
        .select('*')
        .eq('gite', reservationData.gite)
        .order('distance');
    
    // Initialiser la carte Leaflet
    const mapElement = document.getElementById('mapActivites');
    const map = L.map(mapElement).setView([giteInfo.latitude, giteInfo.longitude], 12);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);
    
    // Marqueur du gîte
    const giteMarker = L.marker([giteInfo.latitude, giteInfo.longitude], {
        icon: L.icon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41]
        })
    }).addTo(map);
    giteMarker.bindPopup(`<b>${reservationData.gite}</b><br>Votre gîte`);
    
    // Marqueurs des activités
    activites.forEach(activite => {
        if (activite.latitude && activite.longitude) {
            const marker = L.marker([activite.latitude, activite.longitude]).addTo(map);
            marker.bindPopup(`
                <b>${activite.nom}</b><br>
                ${activite.categorie || ''}<br>
                ${activite.distance ? `${activite.distance.toFixed(1)} km` : ''}
            `);
            
            marker.on('click', () => {
                trackActiviteConsultation(activite.id, 'view');
            });
        }
    });
    
    // Liste des activités
    const listeContainer = document.getElementById('listeActivites');
    listeContainer.innerHTML = activites.map(activite => `
        <div class="card" style="margin-bottom: 1rem;">
            <h3 style="font-size: 1.125rem; font-weight: 700; margin-bottom: 0.5rem;">
                ${activite.nom}
            </h3>
            <div style="color: var(--gray-600); font-size: 0.875rem; margin-bottom: 0.75rem;">
                ${activite.categorie || ''} • ${activite.distance ? `${activite.distance.toFixed(1)} km` : ''}
            </div>
            <p style="margin-bottom: 1rem;">${activite.description || ''}</p>
            <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                ${activite.latitude && activite.longitude ? `
                    <a href="https://www.google.com/maps?q=${activite.latitude},${activite.longitude}" 
                       target="_blank" class="btn btn-outline"
                       onclick="trackActiviteConsultation(${activite.id}, 'click_maps')">
                        📍 Itinéraire
                    </a>
                ` : ''}
                ${activite.website ? `
                    <a href="${activite.website}" target="_blank" class="btn btn-outline"
                       onclick="trackActiviteConsultation(${activite.id}, 'click_website')">
                        🌐 Site web
                    </a>
                ` : ''}
                ${activite.telephone ? `
                    <a href="tel:${activite.telephone}" class="btn btn-outline"
                       onclick="trackActiviteConsultation(${activite.id}, 'click_phone')">
                        📞 Appeler
                    </a>
                ` : ''}
            </div>
        </div>
    `).join('');
}

async function trackActiviteConsultation(activiteId, action) {
    await supabase
        .from('activites_consultations')
        .insert({
            activite_id: activiteId,
            reservation_id: reservationData.id,
            action: action
        });
}

// ==================== EVENT LISTENERS ====================
function initializeEventListeners() {
    // Changement de langue
    document.querySelectorAll('.language-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            currentLanguage = btn.dataset.lang;
            document.querySelectorAll('.language-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            updateTranslations();
            // Recharger le contenu dans la nouvelle langue
            initializeUI();
        });
    });
    
    // Navigation tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.dataset.tab;
            switchTab(tabId);
        });
    });
    
    // Accordion
    document.getElementById('accordionInstructions').addEventListener('click', () => {
        const content = document.getElementById('accordionContent');
        content.classList.toggle('open');
    });
    
    // Formulaires demandes horaires
    document.getElementById('btnDemandeArrivee')?.addEventListener('click', () => {
        document.getElementById('formArriveeAnticipee').style.display = 'block';
    });
    
    document.getElementById('btnAnnulerArrivee')?.addEventListener('click', () => {
        document.getElementById('formArriveeAnticipee').style.display = 'none';
    });
    
    document.getElementById('formArriveeAnticipee')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        await submitDemandeHoraire('arrivee_anticipee');
    });
    
    document.getElementById('btnDemandeDeparttardif')?.addEventListener('click', () => {
        document.getElementById('formDepartTardif').style.display = 'block';
    });
    
    document.getElementById('btnAnnulerDepart')?.addEventListener('click', () => {
        document.getElementById('formDepartTardif').style.display = 'none';
    });
    
    document.getElementById('formDepartTardif')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        await submitDemandeHoraire('depart_tardif');
    });
    
    // Formulaire retours
    document.getElementById('typeRetour')?.addEventListener('change', (e) => {
        const urgenceGroup = document.getElementById('urgenceGroup');
        urgenceGroup.style.display = e.target.value === 'probleme' ? 'block' : 'none';
    });
    
    document.getElementById('formRetours')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        await submitRetourClient();
    });
}

function switchTab(tabId) {
    // Désactiver tous les onglets
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    // Activer l'onglet sélectionné
    document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');
    document.getElementById(`tab-${tabId}`).classList.add('active');
}

async function submitDemandeHoraire(type) {
    const heureDemandee = type === 'arrivee_anticipee' 
        ? document.getElementById('heureArriveeDemandee').value
        : document.getElementById('heureDepartDemandee').value;
    
    const motif = type === 'arrivee_anticipee'
        ? document.getElementById('motifArrivee').value
        : document.getElementById('motifDepart').value;
    
    try {
        const { error } = await supabase
            .from('demandes_horaires')
            .insert({
                reservation_id: reservationData.id,
                type: type,
                heure_demandee: heureDemandee,
                motif: motif,
                automatiquement_approuvable: calculateAutoApproval(type, heureDemandee)
            });
        
        if (error) throw error;
        
        showToast(t('demande_envoyee'));
        
        // Cacher le formulaire
        if (type === 'arrivee_anticipee') {
            document.getElementById('formArriveeAnticipee').style.display = 'none';
        } else {
            document.getElementById('formDepartTardif').style.display = 'none';
        }
    } catch (error) {
        console.error(error);
        showToast(t('erreur'));
    }
}

function calculateAutoApproval(type, heureDemandee) {
    const [hours, minutes] = heureDemandee.split(':').map(Number);
    const requestedMinutes = hours * 60 + minutes;
    
    if (type === 'arrivee_anticipee') {
        if (!cleaningSchedule || cleaningSchedule.time_of_day !== 'afternoon') {
            return requestedMinutes >= 13 * 60;
        } else {
            return requestedMinutes >= 17 * 60;
        }
    } else { // depart_tardif
        const isDimanche = new Date(reservationData.date_fin).getDay() === 0;
        if (isDimanche && (!cleaningSchedule || cleaningSchedule.time_of_day !== 'afternoon')) {
            return requestedMinutes <= 17 * 60;
        }
        return requestedMinutes <= 12 * 60;
    }
}

async function submitRetourClient() {
    const type = document.getElementById('typeRetour').value;
    const sujet = document.getElementById('sujetRetour').value;
    const description = document.getElementById('descriptionRetour').value;
    const urgence = type === 'probleme' 
        ? document.querySelector('input[name="urgence"]:checked').value 
        : 'normale';
    
    try {
        const { error } = await supabase
            .from('retours_clients')
            .insert({
                reservation_id: reservationData.id,
                type: type,
                sujet: sujet,
                description: description,
                urgence: urgence
            });
        
        if (error) throw error;
        
        showToast(t('retour_envoye'));
        
        // Réinitialiser le formulaire
        document.getElementById('formRetours').reset();
    } catch (error) {
        console.error(error);
        showToast(t('erreur'));
    }
}

// ==================== UTILITAIRES ====================
function formatTime(timeString) {
    if (!timeString) return '';
    return timeString.substring(0, 5);
}

function copyToClipboard(inputId) {
    const input = document.getElementById(inputId);
    input.select();
    document.execCommand('copy');
    showToast(t('copie_success'));
}

function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

function showError(message) {
    document.getElementById('loadingScreen').innerHTML = `
        <div style="text-align: center; padding: 2rem;">
            <div style="font-size: 3rem; margin-bottom: 1rem;">⚠️</div>
            <p style="font-size: 1.25rem; color: var(--danger);">${message}</p>
        </div>
    `;
}

function hideLoading() {
    document.getElementById('loadingScreen').style.display = 'none';
}

// Rendre les fonctions globales pour onclick
window.toggleChecklistItem = toggleChecklistItem;
window.copyToClipboard = copyToClipboard;
window.trackActiviteConsultation = trackActiviteConsultation;
