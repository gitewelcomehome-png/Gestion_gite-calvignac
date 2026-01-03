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
var cleaningScheduleAvant = null;  // Ménage AVANT l'arrivée (jour d'arrivée)
var cleaningScheduleApres = null;   // Ménage APRÈS le départ (jour de départ)

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
    // Charger le ménage du jour d'ARRIVÉE (avant la résa)
    const { data: menageAvant } = await supabase
        .from('cleaning_schedule')
        .select('*')
        .eq('gite', reservationData.gite.toLowerCase())
        .eq('scheduled_date', reservationData.date_debut)
        .single();
    
    cleaningScheduleAvant = menageAvant;
    
    // Charger le ménage du jour de DÉPART (après la résa)
    const { data: menageApres } = await supabase
        .from('cleaning_schedule')
        .select('*')
        .eq('gite', reservationData.gite.toLowerCase())
        .eq('scheduled_date', reservationData.date_fin)
        .single();
    
    cleaningScheduleApres = menageApres;
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
    const adresse = currentLanguage === 'fr' ? giteInfo.adresse : giteInfo.adresse_en;
    document.getElementById('giteAddress').textContent = adresse || giteInfo.adresse;
    
    const gpsLat = giteInfo.gps_lat || giteInfo.latitude;
    const gpsLon = giteInfo.gps_lon || giteInfo.longitude;
    document.getElementById('mapsLink').href = giteInfo.google_maps_link || 
        `https://www.google.com/maps?q=${gpsLat},${gpsLon}`;
    
    // Horaire d'arrivée
    const heureArrivee = currentLanguage === 'fr' ? giteInfo.heure_arrivee : giteInfo.heure_arrivee_en;
    document.getElementById('heureArrivee').textContent = formatTime(heureArrivee || giteInfo.heure_arrivee_standard || '17:00');
    
    // Explication de l'horaire d'arrivée selon le ménage
    let explicationArrivee = '';
    if (cleaningScheduleAvant && cleaningScheduleAvant.time_of_day === 'afternoon') {
        explicationArrivee = currentLanguage === 'fr' 
            ? '🧹 Ménage prévu l\'après-midi de votre arrivée' 
            : '🧹 Cleaning scheduled on your arrival afternoon';
    } else if (cleaningScheduleAvant && cleaningScheduleAvant.time_of_day === 'morning') {
        explicationArrivee = currentLanguage === 'fr' 
            ? '✨ Ménage effectué le matin, logement prêt dès 13h' 
            : '✨ Morning cleaning, accommodation ready from 1pm';
    } else {
        explicationArrivee = currentLanguage === 'fr' 
            ? '✨ Pas de ménage prévu ce jour, arrivée flexible' 
            : '✨ No cleaning scheduled, flexible arrival';
    }
    
    // Ajouter l'explication sous l'heure d'arrivée
    const heureArriveeContainer = document.getElementById('heureArrivee').parentElement;
    const existingExplication = heureArriveeContainer.querySelector('.explication-horaire');
    if (existingExplication) {
        existingExplication.remove();
    }
    const explicationElement = document.createElement('p');
    explicationElement.className = 'explication-horaire';
    explicationElement.style.cssText = 'font-size: 0.9rem; color: var(--gray-600); margin-top: 0.5rem; text-align: center; font-style: italic;';
    explicationElement.textContent = explicationArrivee;
    heureArriveeContainer.appendChild(explicationElement);
    
    // Règle arrivée anticipée selon le ménage du jour d'arrivée
    const heureMin = !cleaningScheduleAvant || cleaningScheduleAvant.time_of_day !== 'afternoon' 
        ? giteInfo.heure_arrivee_anticipee_min 
        : giteInfo.heure_arrivee_avec_menage;
    
    const regleKey = !cleaningScheduleAvant || cleaningScheduleAvant.time_of_day !== 'afternoon'
        ? 'arrivee_possible_13h'
        : 'arrivee_possible_17h';
    
    document.getElementById('regleArrivee').textContent = t(regleKey);
    document.getElementById('heureArriveeDemandee').min = formatTime(heureMin);
    
    // Afficher le bloc arrivée anticipée si configuré
    const arriveeTardive = currentLanguage === 'fr' ? giteInfo.arrivee_tardive : giteInfo.arrivee_tardive_en;
    if (arriveeTardive) {
        document.getElementById('arriveeAnticipaBlock').style.display = 'block';
    }
    
    // Code d'entrée
    document.getElementById('codeEntree').textContent = giteInfo.code_acces || giteInfo.code_entree || '****';
    
    // Instructions d'accès
    const instructions = currentLanguage === 'fr' 
        ? (giteInfo.instructions_cles || giteInfo.instructions_acces_fr)
        : (giteInfo.instructions_cles_en || giteInfo.instructions_acces_en);
    
    if (instructions) {
        document.getElementById('instructionsAcces').textContent = instructions;
    } else {
        document.getElementById('accordionInstructions').style.display = 'none';
    }
    
    // WiFi
    const wifiSSID = currentLanguage === 'fr' ? giteInfo.wifi_ssid : (giteInfo.wifi_ssid_en || giteInfo.wifi_ssid);
    const wifiPassword = currentLanguage === 'fr' ? giteInfo.wifi_password : (giteInfo.wifi_password_en || giteInfo.wifi_password);
    
    document.getElementById('wifiSSID').value = wifiSSID || '';
    document.getElementById('wifiPassword').value = wifiPassword || '';
    
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
        parkingHTML += `<p style="margin-bottom: 0.5rem;"><strong>Disponibilité :</strong> ${parkingInfo.dispo}</p>`;
    }
    if (parkingInfo.places) {
        parkingHTML += `<p style="margin-bottom: 0.5rem;"><strong>Places :</strong> ${parkingInfo.places}</p>`;
    }
    if (parkingInfo.details) {
        parkingHTML += `<p style="white-space: pre-line; color: var(--gray-700); line-height: 1.5;">${parkingInfo.details}</p>`;
    }
    
    const parkingSection = document.getElementById('parkingSection');
    if (parkingHTML) {
        document.getElementById('parkingInfo').innerHTML = parkingHTML;
        parkingSection.style.display = 'block';
    } else {
        parkingSection.style.display = 'none';
    }
    
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
        chauffageHTML += `<p style="margin-bottom: 0.5rem;"><strong>Type de chauffage :</strong> ${chauffageInfo.type}</p>`;
    }
    if (chauffageInfo.clim) {
        chauffageHTML += `<p style="margin-bottom: 0.5rem;"><strong>Climatisation :</strong> ${chauffageInfo.clim}</p>`;
    }
    if (chauffageInfo.instructions) {
        chauffageHTML += `<div style="background: var(--gray-100); padding: 0.75rem; border-radius: 0.5rem; margin-top: 0.75rem;">
            <strong style="display: block; margin-bottom: 0.5rem;">📝 Instructions :</strong>
            <p style="white-space: pre-line; color: var(--gray-700); line-height: 1.5;">${chauffageInfo.instructions}</p>
        </div>`;
    }
    
    const chauffageSection = document.getElementById('chauffageSection');
    if (chauffageHTML) {
        document.getElementById('chauffageInfo').innerHTML = chauffageHTML;
        chauffageSection.style.display = 'block';
    } else {
        chauffageSection.style.display = 'none';
    }
    
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
        cuisineHTML += `<p style="margin-bottom: 0.75rem; white-space: pre-line; line-height: 1.5;">${cuisineInfo.equipements}</p>`;
    }
    if (cuisineInfo.four) {
        cuisineHTML += `<div style="background: var(--gray-100); padding: 0.75rem; border-radius: 0.5rem; margin-bottom: 0.5rem;">
            <strong>🔥 Four :</strong> ${cuisineInfo.four}
        </div>`;
    }
    if (cuisineInfo.plaques) {
        cuisineHTML += `<div style="background: var(--gray-100); padding: 0.75rem; border-radius: 0.5rem; margin-bottom: 0.5rem;">
            <strong>🍳 Plaques :</strong> ${cuisineInfo.plaques}
        </div>`;
    }
    if (cuisineInfo.laveVaisselle) {
        cuisineHTML += `<div style="background: var(--gray-100); padding: 0.75rem; border-radius: 0.5rem; margin-bottom: 0.5rem;">
            <strong>🍽️ Lave-vaisselle :</strong> ${cuisineInfo.laveVaisselle}
        </div>`;
    }
    if (cuisineInfo.laveLinge) {
        cuisineHTML += `<div style="background: var(--gray-100); padding: 0.75rem; border-radius: 0.5rem;">
            <strong>👕 Lave-linge :</strong> ${cuisineInfo.laveLinge}
        </div>`;
    }
    
    const cuisineSection = document.getElementById('cuisineSection');
    if (cuisineHTML) {
        document.getElementById('cuisineInfo').innerHTML = cuisineHTML;
        cuisineSection.style.display = 'block';
    } else {
        cuisineSection.style.display = 'none';
    }
    
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
        dechetsHTML += `<p style="margin-bottom: 0.75rem; white-space: pre-line; line-height: 1.5;">${dechetsInfo.tri}</p>`;
    }
    if (dechetsInfo.collecte) {
        dechetsHTML += `<p style="margin-bottom: 0.5rem;"><strong>📅 Jours de collecte :</strong> ${dechetsInfo.collecte}</p>`;
    }
    if (dechetsInfo.decheterie) {
        dechetsHTML += `<div style="background: var(--gray-100); padding: 0.75rem; border-radius: 0.5rem; line-height: 1.5;">
            <strong>🏭 Déchèterie :</strong> ${dechetsInfo.decheterie}
        </div>`;
    }
    
    const dechetsSection = document.getElementById('dechetsSection');
    if (dechetsHTML) {
        document.getElementById('dechetsInfo').innerHTML = dechetsHTML;
        dechetsSection.style.display = 'block';
    } else {
        dechetsSection.style.display = 'none';
    }
    
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
        ? (giteInfo.tabac || giteInfo.animaux || giteInfo.nb_max_personnes || giteInfo.caution ? 
            `${giteInfo.tabac ? '🚭 Tabac : ' + giteInfo.tabac + '\n\n' : ''}${giteInfo.animaux ? '🐕 Animaux : ' + giteInfo.animaux + '\n\n' : ''}${giteInfo.nb_max_personnes ? '👥 Nombre maximum de personnes : ' + giteInfo.nb_max_personnes + '\n\n' : ''}${giteInfo.caution ? '💰 Caution : ' + giteInfo.caution : ''}` 
            : giteInfo.reglement_interieur_fr)
        : (giteInfo.tabac_en || giteInfo.animaux_en || giteInfo.nb_max_personnes_en || giteInfo.caution_en ? 
            `${giteInfo.tabac_en ? '🚭 Smoking : ' + giteInfo.tabac_en + '\n\n' : ''}${giteInfo.animaux_en ? '🐕 Pets : ' + giteInfo.animaux_en + '\n\n' : ''}${giteInfo.nb_max_personnes_en ? '👥 Maximum occupancy : ' + giteInfo.nb_max_personnes_en + '\n\n' : ''}${giteInfo.caution_en ? '💰 Deposit : ' + giteInfo.caution_en : ''}` 
            : giteInfo.reglement_interieur_en);
    
    if (reglement) {
        document.getElementById('reglementInterieur').textContent = reglement;
    }
    
    // Contacts d'urgence (téléphone et email du gîte)
    const tel = currentLanguage === 'fr' ? giteInfo.telephone : giteInfo.telephone_en;
    const email = currentLanguage === 'fr' ? giteInfo.email : giteInfo.email_en;
    const consignesUrgence = currentLanguage === 'fr' ? giteInfo.consignes_urgence : giteInfo.consignes_urgence_en;
    
    let contactsHTML = '';
    if (tel) {
        contactsHTML += `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; border: 1px solid var(--gray-200); border-radius: 0.5rem; margin-bottom: 0.5rem;">
                <div>
                    <div style="font-weight: 600;">📞 Propriétaire</div>
                    <div style="color: var(--gray-600); font-size: 0.9rem;">${tel}</div>
                </div>
                <a href="tel:${tel}" class="btn btn-primary" style="padding: 0.5rem 1rem;">
                    Appeler
                </a>
            </div>`;
    }
    if (email) {
        contactsHTML += `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; border: 1px solid var(--gray-200); border-radius: 0.5rem; margin-bottom: 0.5rem;">
                <div>
                    <div style="font-weight: 600;">📧 Email</div>
                    <div style="color: var(--gray-600); font-size: 0.9rem;">${email}</div>
                </div>
                <a href="mailto:${email}" class="btn btn-outline" style="padding: 0.5rem 1rem;">
                    Envoyer
                </a>
            </div>`;
    }
    if (consignesUrgence) {
        contactsHTML += `
            <div style="background: var(--gray-50); padding: 0.75rem; border-radius: 0.5rem; border-left: 3px solid var(--danger); margin-top: 1rem;">
                <strong style="color: var(--danger);">⚠️ En cas d'urgence :</strong>
                <p style="margin-top: 0.5rem; white-space: pre-line; line-height: 1.5; color: var(--gray-700);">${consignesUrgence}</p>
            </div>`;
    }
    
    if (contactsHTML) {
        document.getElementById('contactsUrgenceContainer').innerHTML = contactsHTML;
    }
}

function initOngletSortie() {
    // Horaire de départ
    const heureDepart = currentLanguage === 'fr' ? giteInfo.heure_depart : giteInfo.heure_depart_en;
    document.getElementById('heureDepart').textContent = formatTime(heureDepart || giteInfo.heure_depart_standard || '10:00');
    
    // Règle départ tardif selon le ménage du jour de départ
    const isDimanche = new Date(reservationData.date_fin).getDay() === 0;
    
    // Si PAS de ménage l'après-midi du départ, on peut partir plus tard
    const pasDeMenuageApresMidi = !cleaningScheduleApres || cleaningScheduleApres.time_of_day !== 'afternoon';
    
    // Explication de l'horaire de départ selon le ménage
    let explicationDepart = '';
    if (cleaningScheduleApres && cleaningScheduleApres.time_of_day === 'afternoon') {
        explicationDepart = currentLanguage === 'fr' 
            ? '🧹 Ménage prévu l\'après-midi après votre départ' 
            : '🧹 Cleaning scheduled in the afternoon after your departure';
    } else if (cleaningScheduleApres && cleaningScheduleApres.time_of_day === 'morning') {
        explicationDepart = currentLanguage === 'fr' 
            ? '🧹 Ménage prévu le matin de votre départ' 
            : '🧹 Cleaning scheduled in the morning of your departure';
    } else if (isDimanche) {
        explicationDepart = currentLanguage === 'fr' 
            ? '🎉 Pas de ménage le dimanche après-midi, départ flexible jusqu\'à 17h' 
            : '🎉 No Sunday afternoon cleaning, flexible departure until 5pm';
    } else {
        explicationDepart = currentLanguage === 'fr' 
            ? '✨ Pas de ménage prévu l\'après-midi, départ flexible jusqu\'à 12h' 
            : '✨ No afternoon cleaning scheduled, flexible departure until 12pm';
    }
    
    // Ajouter l'explication sous l'heure de départ
    const heureDepartContainer = document.getElementById('heureDepart').parentElement;
    const existingExplication = heureDepartContainer.querySelector('.explication-horaire');
    if (existingExplication) {
        existingExplication.remove();
    }
    const explicationElement = document.createElement('p');
    explicationElement.className = 'explication-horaire';
    explicationElement.style.cssText = 'font-size: 0.9rem; color: var(--gray-600); margin-top: 0.5rem; text-align: center; font-style: italic;';
    explicationElement.textContent = explicationDepart;
    heureDepartContainer.appendChild(explicationElement);
    
    let regleKey;
    let heureMax;
    
    if (isDimanche && pasDeMenuageApresMidi) {
        // Dimanche SANS ménage l'après-midi : départ jusqu'à 17h possible
        regleKey = 'depart_possible_17h_dimanche';
        heureMax = giteInfo.heure_depart_dimanche_max || '17:00';
    } else if (!isDimanche && pasDeMenuageApresMidi) {
        // Semaine SANS ménage l'après-midi : départ jusqu'à 12h possible
        regleKey = 'depart_possible_12h';
        heureMax = giteInfo.heure_depart_semaine_max || '12:00';
    } else {
        // AVEC ménage l'après-midi : départ standard 10h
        regleKey = 'depart_possible_12h';
        heureMax = giteInfo.heure_depart_standard || '10:00';
    }
    
    document.getElementById('regleDepart').textContent = t(regleKey);
    document.getElementById('heureDepartDemandee').max = formatTime(heureMax);
    
    // Afficher le bloc départ tardif si configuré
    const departTardif = currentLanguage === 'fr' ? giteInfo.depart_tardif : giteInfo.depart_tardif_en;
    if (departTardif) {
        document.getElementById('departTardifBlock').style.display = 'block';
    }
    
    // Instructions de sortie
    const instructions = currentLanguage === 'fr'
        ? (giteInfo.checklist_depart || giteInfo.instructions_sortie_fr || '')
        : (giteInfo.checklist_depart_en || giteInfo.instructions_sortie_en || '');
    
    const restitutionCles = currentLanguage === 'fr' ? giteInfo.restitution_cles : giteInfo.restitution_cles_en;
    
    let instructionsHTML = '';
    if (instructions) {
        instructionsHTML += `<p style="white-space: pre-line; line-height: 1.6; margin-bottom: 1rem;">${instructions}</p>`;
    }
    if (restitutionCles) {
        instructionsHTML += `<div style="background: var(--gray-100); padding: 0.75rem; border-radius: 0.5rem; border-left: 3px solid var(--primary);">
            <strong>🔑 Restitution des clés :</strong>
            <p style="margin-top: 0.5rem; white-space: pre-line; line-height: 1.5;">${restitutionCles}</p>
        </div>`;
    }
    
    if (instructionsHTML) {
        document.getElementById('instructionsSortie').innerHTML = instructionsHTML;
    } else {
        document.getElementById('instructionsSortie').textContent = '';
    }
    
    // Checklist de sortie
    loadChecklist('sortie', 'checklistSortieContainer', 'progressSortie', 'progressSortieText');
}

function initOngletActivites() {
    // Charger la carte et les activités
    loadActivitesMap();
}

// Variables globales pour la carte
let activitesMap = null;
let activitesMarkers = [];
let giteMarker = null;
let currentFilter = 'tous';

const categoryColors = {
    'Restaurant': '#FF8C00',
    'Musée': '#9B59B6',
    'Château': '#9B59B6',
    'Parc': '#27AE60',
    'Café/Bar': '#3498DB',
    'Hôtel': '#3498DB',
    'Attraction': '#E74C3C'
};

const categoryIcons = {
    'Restaurant': '🍽️',
    'Musée': '🏛️',
    'Château': '🏰',
    'Parc': '🌳',
    'Café/Bar': '☕',
    'Hôtel': '🏨',
    'Attraction': '🎪'
};

async function loadActivitesMap() {
    const mapContainer = document.getElementById('mapActivites');
    
    // Récupérer les activités depuis Supabase
    const { data: activites, error } = await supabase
        .from('activites_gites')
        .select('*')
        .eq('gite', reservationData.gite.toLowerCase())
        .order('distance', { ascending: true });
    
    if (error) {
        console.error('Erreur chargement activités:', error);
        return;
    }
    
    // Coordonnées du gîte
    const giteCoords = giteInfo.gps_lat && giteInfo.gps_lon 
        ? [parseFloat(giteInfo.gps_lat), parseFloat(giteInfo.gps_lon)]
        : (reservationData.gite === 'Trévoux' ? [45.9423, 4.7681] : [45.8456, 4.8234]);
    
    // Initialiser la carte
    if (!activitesMap) {
        activitesMap = L.map('mapActivites').setView(giteCoords, 12);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 18
        }).addTo(activitesMap);
        
        // Marqueur du gîte
        const giteIcon = L.divIcon({
            html: '<div style="background: #FF5A5F; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3); font-size: 16px;">🏡</div>',
            className: '',
            iconSize: [30, 30],
            iconAnchor: [15, 15]
        });
        
        giteMarker = L.marker(giteCoords, { icon: giteIcon })
            .bindPopup(`<strong>🏡 Gîte ${reservationData.gite}</strong><br>Votre point de départ`)
            .addTo(activitesMap);
    }
    
    // Créer les filtres
    createActivitesFilters(activites);
    
    // Afficher les activités
    displayActivites(activites);
}

function createActivitesFilters(activites) {
    const categories = [...new Set(activites.map(a => a.categorie || a.type))].filter(Boolean);
    
    const filtresContainer = document.getElementById('filtresActivites');
    filtresContainer.innerHTML = `
        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 1rem;">
            <button class="btn-filtre ${currentFilter === 'tous' ? 'active' : ''}" onclick="filtrerActivites('tous')" style="padding: 0.5rem 1rem; border: 2px solid var(--gray-300); border-radius: 0.5rem; background: ${currentFilter === 'tous' ? 'var(--primary)' : 'white'}; color: ${currentFilter === 'tous' ? 'white' : 'var(--gray-700)'}; cursor: pointer; font-weight: 600; transition: all 0.2s;">
                📋 Tous (${activites.length})
            </button>
            ${categories.map(cat => `
                <button class="btn-filtre ${currentFilter === cat ? 'active' : ''}" onclick="filtrerActivites('${cat}')" style="padding: 0.5rem 1rem; border: 2px solid ${categoryColors[cat] || '#999'}; border-radius: 0.5rem; background: ${currentFilter === cat ? (categoryColors[cat] || '#999') : 'white'}; color: ${currentFilter === cat ? 'white' : 'var(--gray-700)'}; cursor: pointer; font-weight: 600; transition: all 0.2s;">
                    ${categoryIcons[cat] || '📍'} ${cat} (${activites.filter(a => (a.categorie || a.type) === cat).length})
                </button>
            `).join('')}
        </div>
    `;
}

function displayActivites(activites) {
    // Effacer les anciens marqueurs
    activitesMarkers.forEach(marker => activitesMap.removeLayer(marker));
    activitesMarkers = [];
    
    // Filtrer les activités
    const filteredActivites = currentFilter === 'tous' 
        ? activites 
        : activites.filter(a => (a.categorie || a.type) === currentFilter);
    
    // Afficher les marqueurs
    filteredActivites.forEach(activite => {
        if (!activite.latitude || !activite.longitude) return;
        
        const category = activite.categorie || activite.type;
        const color = categoryColors[category] || '#999';
        const icon = categoryIcons[category] || '📍';
        
        const markerIcon = L.divIcon({
            html: `<div style="background: ${color}; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3); font-size: 14px;">${icon}</div>`,
            className: '',
            iconSize: [28, 28],
            iconAnchor: [14, 14]
        });
        
        const marker = L.marker([parseFloat(activite.latitude), parseFloat(activite.longitude)], { icon: markerIcon })
            .bindPopup(createActivitePopup(activite))
            .addTo(activitesMap);
        
        activitesMarkers.push(marker);
    });
    
    // Afficher la liste
    displayActivitesList(filteredActivites);
}

function createActivitePopup(activite) {
    const category = activite.categorie || activite.type;
    const color = categoryColors[category] || '#999';
    const icon = categoryIcons[category] || '📍';
    
    return `
        <div style="min-width: 200px;">
            <h3 style="margin: 0 0 0.5rem 0; color: ${color}; font-size: 1.1rem;">
                ${icon} ${activite.nom || activite.name}
            </h3>
            ${activite.adresse ? `<p style="margin: 0.25rem 0; font-size: 0.85rem; color: #666;">📍 ${activite.adresse}</p>` : ''}
            ${activite.distance ? `<p style="margin: 0.25rem 0; font-size: 0.85rem; color: #666;">📏 ${activite.distance} km</p>` : ''}
            ${activite.telephone ? `<p style="margin: 0.5rem 0 0 0;"><a href="tel:${activite.telephone}" style="color: ${color}; text-decoration: none; font-weight: 600;">📞 Appeler</a></p>` : ''}
            ${activite.site_web ? `<p style="margin: 0.25rem 0;"><a href="${activite.site_web}" target="_blank" style="color: ${color}; text-decoration: none; font-weight: 600;">🌐 Site web</a></p>` : ''}
        </div>
    `;
}

function displayActivitesList(activites) {
    const listeContainer = document.getElementById('listeActivites');
    
    if (activites.length === 0) {
        listeContainer.innerHTML = '<p style="text-align: center; color: var(--gray-500); padding: 2rem;">Aucune activité trouvée</p>';
        return;
    }
    
    listeContainer.innerHTML = activites.map(activite => {
        const category = activite.categorie || activite.type;
        const color = categoryColors[category] || '#999';
        const icon = categoryIcons[category] || '📍';
        
        return `
            <div style="border: 1px solid var(--gray-200); border-radius: 0.5rem; padding: 0.75rem; margin-bottom: 0.75rem; cursor: pointer; transition: all 0.2s;" onclick="zoomToActivite(${activite.latitude}, ${activite.longitude})" onmouseover="this.style.borderColor='${color}'; this.style.boxShadow='0 2px 8px rgba(0,0,0,0.1)'" onmouseout="this.style.borderColor='var(--gray-200)'; this.style.boxShadow='none'">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.5rem;">
                    <h3 style="margin: 0; color: ${color}; font-size: 1rem;">
                        ${icon} ${activite.nom || activite.name}
                    </h3>
                    ${activite.distance ? `<span style="background: ${color}; color: white; padding: 0.25rem 0.5rem; border-radius: 1rem; font-size: 0.75rem; font-weight: 600;">${activite.distance} km</span>` : ''}
                </div>
                ${activite.adresse ? `<p style="margin: 0.25rem 0; font-size: 0.85rem; color: #666;">📍 ${activite.adresse}</p>` : ''}
                ${activite.description ? `<p style="margin: 0.5rem 0; font-size: 0.9rem; color: var(--gray-700); line-height: 1.4;">${activite.description}</p>` : ''}
                <div style="display: flex; gap: 0.5rem; margin-top: 0.5rem; flex-wrap: wrap;">
                    ${activite.telephone ? `<a href="tel:${activite.telephone}" class="btn btn-outline" style="padding: 0.4rem 0.75rem; font-size: 0.85rem; text-decoration: none;" onclick="event.stopPropagation()">📞 Appeler</a>` : ''}
                    ${activite.site_web ? `<a href="${activite.site_web}" target="_blank" class="btn btn-outline" style="padding: 0.4rem 0.75rem; font-size: 0.85rem; text-decoration: none;" onclick="event.stopPropagation()">🌐 Site web</a>` : ''}
                </div>
            </div>
        `;
    }).join('');
}

window.filtrerActivites = async function(categorie) {
    currentFilter = categorie;
    
    // Recharger les activités
    const { data: activites } = await supabase
        .from('activites_gites')
        .select('*')
        .eq('gite', reservationData.gite.toLowerCase())
        .order('distance', { ascending: true });
    
    createActivitesFilters(activites || []);
    displayActivites(activites || []);
};

window.zoomToActivite = function(lat, lng) {
    if (activitesMap && lat && lng) {
        activitesMap.setView([parseFloat(lat), parseFloat(lng)], 15);
    }
};

async function loadChecklist(type, containerId, progressId, progressTextId) {
    // Charger les items de la checklist
    const { data: items } = await supabase
        .from('checklists')
        .select('*')
        .eq('gite', reservationData.gite.toLowerCase())
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
