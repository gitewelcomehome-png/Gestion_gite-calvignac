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
    
    // Service Worker désactivé temporairement (404 sur Vercel)
    // TODO: Résoudre le problème de déploiement du fichier sw-fiche-client.js
    if (false && 'serviceWorker' in navigator) {
        // Force la mise à jour du SW à chaque chargement
        navigator.serviceWorker.register('/sw-fiche-client.js', {
            updateViaCache: 'none' // Ne JAMAIS mettre le SW en cache
        }).then(registration => {
            
            // Forcer la vérification de mise à jour
            registration.update().then(() => {
            });
            
            // Recharger si un nouveau SW est en attente
            registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                console.log('🆕 New SW found!');
                
                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'activated') {
                        console.log('🟢 New SW activated! Reloading...');
                        window.location.reload();
                    }
                });
            });
        }).catch(error => console.log('❌ SW registration failed:', error));
    }
}

// Référence Supabase (utiliser var pour éviter redéclaration)
var supabase = window.ficheClientSupabase;

// ==================== HELPER FUNCTIONS ====================
// Fonction pour normaliser le nom du gîte (juste minuscules, GARDER les accents)
function normalizeGiteName(name) {
    if (!name) return '';
    return name.toLowerCase(); // Juste minuscules, on garde les accents !
}

// ==================== VARIABLES GLOBALES ====================
var currentLanguage = 'fr';
var reservationData = null;
var giteInfo = null;
var token = null;
var cleaningScheduleAvant = null;  // Ménage AVANT l'arrivée (jour d'arrivée)
var cleaningScheduleApres = null;   // Ménage APRÈS le départ (jour de départ)
var mapActivites = null;  // Carte Leaflet (pour éviter réinitialisation)

// ==================== TRADUCTIONS ====================
const translations = {
    fr: {
        tab_entree: 'Entrée',
        tab_pendant: 'Pendant',
        tab_sortie: 'Sortie',
        tab_activites: 'Activités',
        tab_faq: 'FAQ',
        tab_faq: 'FAQ',
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
        arrivee_possible_13h: 'Arrivée dès 13h possible. ⚠️ 13h-17h: validation manuelle. ✅ Après 17h: automatique.',
        arrivee_possible_17h: 'Arrivée à partir de 17h (ménage prévu l\'après-midi). ✅ Validation automatique.',
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
        tab_faq: 'FAQ',
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
        
        await loadClientChecklists();
        
        initializeUI();
        
        initializeEventListeners();
        
        hideLoading();
    } catch (error) {
        console.error('❌ Erreur lors du chargement:', error);
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
    // Essayer avec le nom normalisé
    let { data, error } = await supabase
        .from('infos_gites')
        .select('*')
        .eq('gite', normalizeGiteName(reservationData.gite))
        .maybeSingle();
    
    // Si pas de résultat, essayer avec le nom original en minuscules
    if (!data && !error) {
        const result = await supabase
            .from('infos_gites')
            .select('*')
            .eq('gite', reservationData.gite.toLowerCase())
            .maybeSingle();
        data = result.data;
        error = result.error;
    }
    
    // Si toujours pas de résultat, essayer avec le nom original
    if (!data && !error) {
        const result = await supabase
            .from('infos_gites')
            .select('*')
            .eq('gite', reservationData.gite)
            .maybeSingle();
        data = result.data;
        error = result.error;
    }
    
    if (error) throw error;
    
    if (!data) {
        throw new Error(`Aucune information trouvée pour le gîte "${reservationData.gite}". Veuillez configurer les infos pratiques dans le back-office.`);
    }
    
    giteInfo = data;
    
    // ✅ NOUVEAU: Charger les horaires validés pour cette réservation
    const { data: horairesValidees } = await supabase
        .from('demandes_horaires')
        .select('type, heure_validee, statut')
        .eq('reservation_id', reservationData.id)
        .eq('statut', 'validee')
        .in('type', ['arrivee', 'depart']);
    
    // Stocker les horaires validées dans giteInfo pour utilisation ultérieure
    if (horairesValidees && horairesValidees.length > 0) {
        horairesValidees.forEach(h => {
            if (h.type === 'arrivee') {
                giteInfo.heure_arrivee_validee = h.heure_validee;
            }
            if (h.type === 'depart') {
                giteInfo.heure_depart_validee = h.heure_validee;
            }
        });
        console.log('✅ Horaires validées trouvées:', giteInfo.heure_arrivee_validee, giteInfo.heure_depart_validee);
    }
}

async function loadCleaningSchedule() {
    // Charger le ménage du jour d'ARRIVÉE (avant la résa)
    const { data: menageAvant } = await supabase
        .from('cleaning_schedule')
        .select('*')
        .eq('gite', normalizeGiteName(reservationData.gite))
        .eq('scheduled_date', reservationData.date_debut)
        .maybeSingle();
    
    cleaningScheduleAvant = menageAvant;
    
    // Charger le ménage du jour de DÉPART (après la résa)
    const { data: menageApres } = await supabase
        .from('cleaning_schedule')
        .select('*')
        .eq('gite', normalizeGiteName(reservationData.gite))
        .eq('scheduled_date', reservationData.date_fin)
        .maybeSingle();
    
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
    
    // Onglet Activités - NE PAS CHARGER ICI (onglet caché)
    // initOngletActivites(); // Sera chargé au premier clic sur l'onglet
    
    // Onglet FAQ
    initOngletFaq();
    
    // ✅ Nouveaux onglets: Problème et Évaluation
    initProblemeTab();
    initEvaluationTab();
    
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
    console.log('🕒 Heure arrivée brute:', heureArrivee, 'Standard:', giteInfo.heure_arrivee_standard, 'Validée:', giteInfo.heure_arrivee_validee, 'Lang:', currentLanguage);
    
    // ✅ PRIORITÉ: Heure validée > Heure configurée > Heure standard
    const heureArriveeEffective = giteInfo.heure_arrivee_validee || heureArrivee || giteInfo.heure_arrivee_standard || '17:00';
    const heureArriveeFormatted = formatTime(heureArriveeEffective);
    console.log('🕒 Heure arrivée formatée:', heureArriveeFormatted);
    document.getElementById('heureArrivee').textContent = heureArriveeFormatted;
    
    // Générer les options de sélection horaire (toutes les 30 min)
    const selectArrivee = document.getElementById('heureArriveeDemandee');
    if (selectArrivee && selectArrivee.tagName === 'INPUT') {
        // Créer un select à la place de l'input
        const newSelect = document.createElement('select');
        newSelect.id = 'heureArriveeDemandee';
        newSelect.className = selectArrivee.className;
        newSelect.style.cssText = selectArrivee.style.cssText;
        selectArrivee.parentNode.replaceChild(newSelect, selectArrivee);
    }
    
    const selectElement = document.getElementById('heureArriveeDemandee');
    if (!selectElement) {
        console.warn('⚠️ heureArriveeDemandee select not found');
        return;
    }
    selectElement.innerHTML = '';
    
    // Déterminer l'heure minimum selon le ménage
    const heureMinArrivee = !cleaningScheduleAvant || cleaningScheduleAvant.time_of_day !== 'afternoon' ? 13 : 17;
    
    
    // Générer options de l'heure min à 23h par pas de 30 min
    let optionsCount = 0;
    for (let h = heureMinArrivee; h <= 23; h++) {
        for (let m = 0; m < 60; m += 30) {
            const timeValue = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
            const option = document.createElement('option');
            option.value = timeValue;
            option.textContent = formatTime(timeValue);
            selectElement.appendChild(option);
            optionsCount++;
        }
    }
    
    
    // Explication de l'horaire d'arrivée selon le ménage
    let explicationArrivee = '';
    
    // ✅ SI HORAIRE VALIDÉE → Message de confirmation
    if (giteInfo.heure_arrivee_validee) {
        explicationArrivee = currentLanguage === 'fr' 
            ? '✅ Horaire d\'arrivée validé par le gestionnaire' 
            : '✅ Arrival time validated by manager';
    }
    // Sinon, messages selon le ménage
    else if (cleaningScheduleAvant && cleaningScheduleAvant.time_of_day === 'afternoon') {
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
    // Note: Les selects n'ont pas d'attribut min, donc on ne l'applique pas
    
    // Toujours afficher le bloc arrivée anticipée (validation automatique selon les règles)
    document.getElementById('arriveeAnticipaBlock').style.display = 'block';
    
    // Code d'entrée
    document.getElementById('codeEntree').textContent = giteInfo.code_acces || giteInfo.code_entree || '****';
    
    // Instructions d'accès (affichage direct, pas d'accordion)
    const instructions = currentLanguage === 'fr' 
        ? (giteInfo.instructions_cles || giteInfo.instructions_acces_fr)
        : (giteInfo.instructions_cles_en || giteInfo.instructions_acces_en);
    
    const instructionsSection = document.getElementById('accordionInstructions');
    if (instructions) {
        // Afficher directement sans accordion
        instructionsSection.style.display = 'block';
        instructionsSection.style.cursor = 'default';
        const contentDiv = document.getElementById('accordionContent');
        contentDiv.classList.add('open');
        contentDiv.style.maxHeight = 'none';
        document.getElementById('instructionsAcces').textContent = instructions;
    } else {
        instructionsSection.style.display = 'none';
    }
    
    // WiFi
    const wifiSSID = currentLanguage === 'fr' ? giteInfo.wifi_ssid : (giteInfo.wifi_ssid_en || giteInfo.wifi_ssid);
    const wifiPassword = currentLanguage === 'fr' ? giteInfo.wifi_password : (giteInfo.wifi_password_en || giteInfo.wifi_password);
    
    document.getElementById('wifiSSID').value = wifiSSID || '';
    document.getElementById('wifiPassword').value = wifiPassword || '';
    
    // QR Code WiFi - Génération dynamique via API
    const qrContainer = document.getElementById('qrCodeContainer');
    if (qrContainer && wifiSSID && wifiPassword) {
        // Format WiFi QR code selon spécification
        const wifiString = `WIFI:T:WPA;S:${wifiSSID};P:${wifiPassword};;`;
        const encodedText = encodeURIComponent(wifiString);
        const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodedText}`;
        
        qrContainer.innerHTML = `
            <p style="font-size: 0.875rem; color: var(--gray-600); margin-bottom: 0.5rem; text-align: center;">
                ${currentLanguage === 'fr' ? '📱 Scannez pour vous connecter' : '📱 Scan to connect'}
            </p>
            <img src="${qrCodeUrl}" alt="QR Code WiFi" style="max-width: 200px; display: block; margin: 0 auto; background: white; padding: 10px; border-radius: 8px;" onerror="this.parentElement.style.display='none'">
        `;
        qrContainer.style.display = 'block';
    } else if (qrContainer) {
        qrContainer.style.display = 'none';
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
    
    // Checklists chargées via loadClientChecklists() appelée au démarrage
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
    
    // Charger les événements de la semaine et commerces proximité
    loadEvenementsSemaine();
    loadCommerces();
}

function initOngletSortie() {
    // Horaire de départ
    const heureDepart = currentLanguage === 'fr' ? giteInfo.heure_depart : giteInfo.heure_depart_en;
    
    // ✅ PRIORITÉ: Heure validée > Heure configurée > Heure standard
    const heureDepartEffective = giteInfo.heure_depart_validee || heureDepart || giteInfo.heure_depart_standard || '10:00';
    const heureDepartFormatted = formatTime(heureDepartEffective);
    const heureDepartElement = document.getElementById('heureDepart');
    if (heureDepartElement) {
        heureDepartElement.textContent = heureDepartFormatted;
    }
    
    // Générer les options de sélection horaire départ (toutes les 30 min)
    const selectDepart = document.getElementById('heureDepartDemandee');
    if (selectDepart && selectDepart.tagName === 'INPUT') {
        const newSelect = document.createElement('select');
        newSelect.id = 'heureDepartDemandee';
        newSelect.className = selectDepart.className;
        newSelect.style.cssText = selectDepart.style.cssText;
        selectDepart.parentNode.replaceChild(newSelect, selectDepart);
    }
    
    // Règle départ tardif selon le ménage du jour de départ
    const isDimanche = new Date(reservationData.date_fin).getDay() === 0;
    
    // Si PAS de ménage l'après-midi du départ, on peut partir plus tard
    const pasDeMenuageApresMidi = !cleaningScheduleApres || cleaningScheduleApres.time_of_day !== 'afternoon';
    
    // Déterminer l'heure max selon les règles
    let heureMaxDepart;
    if (isDimanche && pasDeMenuageApresMidi) {
        heureMaxDepart = 17; // Dimanche sans ménage : jusqu'à 17h
    } else if (!isDimanche && pasDeMenuageApresMidi) {
        heureMaxDepart = 12; // Semaine sans ménage après-midi : jusqu'à 12h
    } else {
        heureMaxDepart = 12; // Avec ménage après-midi : jusqu'à 12h
    }
    
    const selectDepartElement = document.getElementById('heureDepartDemandee');
    if (selectDepartElement) {
        selectDepartElement.innerHTML = '';
        
        // Générer options de 10h jusqu'à l'heure max (incluse)
        for (let h = 10; h <= heureMaxDepart; h++) {
            for (let m = 0; m < 60; m += 30) {
                const timeValue = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
                const timeMinutes = h * 60 + m;
                const maxMinutes = heureMaxDepart * 60;
                
                // Ne pas dépasser l'heure max
                if (timeMinutes > maxMinutes) break;
                
                const option = document.createElement('option');
                option.value = timeValue;
                option.textContent = formatTime(timeValue);
                selectDepartElement.appendChild(option);
            }
        }
        
    }
    
    // Explication de l'horaire de départ selon le ménage
    let explicationDepart = '';
    
    // ✅ SI HORAIRE VALIDÉE → Message de confirmation
    if (giteInfo.heure_depart_validee) {
        explicationDepart = currentLanguage === 'fr' 
            ? '✅ Horaire de départ validé par le gestionnaire' 
            : '✅ Departure time validated by manager';
    }
    // Sinon, messages selon le ménage
    else if (cleaningScheduleApres && cleaningScheduleApres.time_of_day === 'afternoon') {
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
    
    // Déterminer le message de règle selon le contexte
    let regleKey;
    if (isDimanche && pasDeMenuageApresMidi) {
        regleKey = 'depart_possible_17h_dimanche';
    } else {
        regleKey = 'depart_possible_12h';
    }
    
    document.getElementById('regleDepart').textContent = t(regleKey);
    
    // Toujours afficher le bloc départ tardif (validation automatique selon les règles)
    document.getElementById('departTardifBlock').style.display = 'block';
    
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
    
    // Checklists chargées via loadClientChecklists()
}

// ==================== ACTIVITÉS ====================

function initOngletActivites() {
    // Réutiliser la logique de decouvrir.js pour afficher la carte et les activités
    loadActivitesForClient();
}

function initOngletFaq() {
    loadFaqData();
}

async function loadActivitesForClient() {
    const giteNormalized = normalizeGiteName(reservationData.gite);
    
    const variantes = [
        giteNormalized,
        giteNormalized.toLowerCase(),
        reservationData.gite,
        reservationData.gite.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    ];
    
    const { data: activites, error } = await supabase
        .from('activites_gites')
        .select('*')
        .or(variantes.map((v, i) => `gite.eq.${v}`).join(','))
        .order('distance');
    
    if (error) {
        console.error('Erreur chargement activités:', error);
        return;
    }
    
    const giteLat = parseFloat(giteInfo?.gps_lat || giteInfo?.latitude);
    const giteLon = parseFloat(giteInfo?.gps_lon || giteInfo?.longitude);
    
    if (!giteLat || !giteLon || isNaN(giteLat) || isNaN(giteLon)) {
        document.getElementById('mapActivites').innerHTML = '<p style="padding: 2rem; text-align: center; color: var(--gray-600);">⚠️ Coordonnées du gîte non disponibles</p>';
        return;
    }
    
    if (!activites || activites.length === 0) {
        document.getElementById('mapActivites').innerHTML = '<p style="padding: 2rem; text-align: center; color: var(--gray-600);">ℹ️ Aucune activité configurée pour ce gîte</p>';
        return;
    }
    
    // Google Maps iframe avec marqueur gîte visible
    const mapElement = document.getElementById('mapActivites');
    
    mapElement.innerHTML = `
        <iframe 
            width="100%" 
            height="400" 
            frameborder="0" 
            scrolling="no" 
            marginheight="0" 
            marginwidth="0" 
            src="https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${giteLat},${giteLon}&zoom=16" 
            style="border: 1px solid #ccc; border-radius: 8px;">
        </iframe>
        <div style="text-align: center; margin-top: 0.5rem;">
            <strong style="color: #ef4444;">🏡 Votre gîte</strong><br>
            <a href="https://www.google.com/maps/search/?api=1&query=${giteLat},${giteLon}" 
               target="_blank" 
               style="color: var(--primary); font-size: 0.875rem;">
                📍 Voir sur Google Maps
            </a>
        </div>
    `;
    
    // Liste interactive des activités
    displayActivitesListInteractive(activites, giteLat, giteLon);
}

function displayActivitesList(activites) {
    const listeContainer = document.getElementById('listeActivites');
    
    if (!activites || activites.length === 0) {
        listeContainer.innerHTML = `
            <div class="card" style="text-align: center; padding: 2rem;">
                <p style="color: var(--gray-600); font-size: 1.125rem;">
                    ${currentLanguage === 'fr' 
                        ? 'ℹ️ Aucune activité n\'a encore été ajoutée pour ce gîte.<br><small>Rendez-vous dans l\'onglet "À découvrir" du back-office pour ajouter des activités.</small>'
                        : 'ℹ️ No activities have been added for this accommodation yet.<br><small>Go to the "Discover" tab in the back-office to add activities.</small>'
                    }
                </p>
            </div>
        `;
        return;
    }
    
    // Fonction pour obtenir une belle icône emoji selon le type
    const getIconForType = (type) => {
        const typeNormalized = (type || '').toLowerCase();
        const icons = {
            'restaurant': '🍽️',
            'resto': '🍽️',
            'musée': '🏛️',
            'museum': '🏛️',
            'parc': '🌳',
            'park': '🌳',
            'jardin': '🌺',
            'garden': '🌺',
            'plage': '🏖️',
            'beach': '🏖️',
            'château': '🏰',
            'castle': '🏰',
            'église': '⛪',
            'church': '⛪',
            'commerce': '🛍️',
            'shop': '🛍️',
            'bar': '🍺',
            'pub': '🍻',
            'café': '☕',
            'coffee': '☕',
            'randonnée': '🥾',
            'hiking': '🥾',
            'vélo': '🚴',
            'bike': '🚴',
            'piscine': '🏊',
            'pool': '🏊',
            'spectacle': '🎭',
            'show': '🎭',
            'théâtre': '🎭',
            'theater': '🎭',
            'cinéma': '🎬',
            'cinema': '🎬',
            'vin': '🍷',
            'wine': '🍷',
            'cave': '🍾',
            'marché': '🛍️',
            'market': '🛍️',
            'sport': '⚽',
            'spa': '💆',
            'montagne': '⛰️',
            'mountain': '⛰️',
            'lac': '🏞️',
            'lake': '🏞️',
            'rivière': '🌊',
            'river': '🌊',
            'ski': '⛷️',
            'golf': '⛳',
            'tennis': '🎾',
            'équitation': '🐴',
            'horse': '🐴'
        };
        
        for (const [key, icon] of Object.entries(icons)) {
            if (typeNormalized.includes(key)) return icon;
        }
        return '📍'; // Icône par défaut
    };
    
    // Couleurs de gradient par type
    const getGradientForType = (type) => {
        const typeNormalized = (type || '').toLowerCase();
        const gradients = {
            'restaurant': 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            'musée': 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            'museum': 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            'parc': 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
            'park': 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
            'plage': 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
            'château': 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
            'bar': 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
            'café': 'linear-gradient(135deg, #ff9a56 0%, #ff6a88 100%)'
        };
        
        for (const [key, gradient] of Object.entries(gradients)) {
            if (typeNormalized.includes(key)) return gradient;
        }
        return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'; // Défaut
    };
    
    listeContainer.innerHTML = activites.map(activite => {
        const icon = getIconForType(activite.type || activite.categorie);
        const gradient = getGradientForType(activite.type || activite.categorie);
        const hasCoords = activite.latitude && activite.longitude;
        
        return `
        <div class="card activite-card" style="margin-bottom: 1.5rem; border-left: 4px solid var(--primary-color);">
            <div style="display: flex; gap: 1.5rem; align-items: start;">
                <div class="activite-icon" style="background: ${gradient}; font-size: 2.5rem;">
                    ${icon}
                </div>
                <div style="flex: 1;">
                    <h3 style="font-size: 1.5rem; font-weight: 700; margin-bottom: 0.75rem; color: var(--primary-color);">
                        ${activite.nom}
                    </h3>
                    <div style="display: flex; gap: 1rem; color: var(--gray-600); font-size: 0.875rem; margin-bottom: 1rem; flex-wrap: wrap; align-items: center;">
                        ${activite.type || activite.categorie ? `
                            <span style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 0.375rem 1rem; border-radius: 2rem; font-weight: 600; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.5px;">
                                ${activite.type || activite.categorie}
                            </span>
                        ` : ''}
                        ${activite.distance_km ? `
                            <span style="display: flex; align-items: center; gap: 0.25rem;">
                                📏 ${activite.distance_km.toFixed(1)} km
                            </span>
                        ` : ''}
                        ${activite.phone ? `
                            <span style="display: flex; align-items: center; gap: 0.25rem;">
                                📞 ${activite.phone}
                            </span>
                        ` : ''}
                    </div>
                    ${activite.description ? `
                        <p style="margin-bottom: 1.25rem; color: var(--gray-700); line-height: 1.6;">
                            ${activite.description.substring(0, 180)}${activite.description.length > 180 ? '...' : ''}
                        </p>
                    ` : ''}
                    ${activite.adresse ? `
                        <p style="font-size: 0.875rem; color: var(--gray-600); margin-bottom: 1.25rem; display: flex; align-items: center; gap: 0.5rem;">
                            📍 ${activite.adresse}
                        </p>
                    ` : ''}
                    <div style="display: flex; gap: 0.75rem; flex-wrap: wrap;">
                        ${hasCoords ? `
                            <a href="https://www.google.com/maps/dir/?api=1&destination=${activite.latitude},${activite.longitude}" 
                               target="_blank" class="btn btn-primary"
                               onclick="trackActiviteConsultation(${activite.id}, 'click_maps')"
                               style="text-decoration: none; display: flex; align-items: center; gap: 0.5rem;">
                                🗺️ Itinéraire
                            </a>
                        ` : ''}
                        ${activite.website ? `
                            <a href="${activite.website}" target="_blank" class="btn btn-outline"
                               onclick="trackActiviteConsultation(${activite.id}, 'click_website')"
                               style="text-decoration: none; display: flex; align-items: center; gap: 0.5rem;">
                                🌐 Site web
                            </a>
                        ` : ''}
                        ${activite.phone ? `
                            <a href="tel:${activite.phone}" class="btn btn-outline"
                               onclick="trackActiviteConsultation(${activite.id}, 'click_phone')"
                               style="text-decoration: none; display: flex; align-items: center; gap: 0.5rem;">
                                📞 Appeler
                            </a>
                        ` : ''}
                    </div>
                </div>
            </div>
        </div>
    `}).join('');
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
    
    // Accordion (désactivé, affichage direct maintenant)
    // document.getElementById('accordionInstructions').addEventListener('click', () => {
    //     const content = document.getElementById('accordionContent');
    //     content.classList.toggle('open');
    // });
    
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
    
    // Initialiser modal activité
    initModalActivite();
    
    // Mettre à jour les badges au chargement
    setTimeout(updateTabBadges, 500);
    
    // Bouton partage
    document.getElementById('btnShare')?.addEventListener('click', sharePageLink);
}

function switchTab(tabId) {
    // Désactiver tous les onglets
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    // Activer l'onglet sélectionné
    document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');
    document.getElementById(`tab-${tabId}`).classList.add('active');
    
    // Charger les activités
    if (tabId === 'activites') {
        initOngletActivites();
    }
}

async function submitDemandeHoraire(type) {
    const heureDemandee = type === 'arrivee_anticipee' 
        ? document.getElementById('heureArriveeDemandee').value
        : document.getElementById('heureDepartDemandee').value;
    
    const motif = type === 'arrivee_anticipee'
        ? document.getElementById('motifArrivee')?.value || ''
        : document.getElementById('motifDepart')?.value || '';
    
    const typeDb = type === 'arrivee_anticipee' ? 'arrivee' : 'depart';
    
    try {
        // 1. Vérifier si une demande en_attente existe déjà pour cette réservation et ce type
        const { data: existingDemandes, error: checkError } = await supabase
            .from('demandes_horaires')
            .select('id')
            .eq('reservation_id', reservationData.id)
            .eq('type', typeDb)
            .eq('statut', 'en_attente')
            .limit(1);
        
        if (checkError) {
            console.error('❌ Erreur vérification:', checkError);
            
            if (checkError.message && checkError.message.includes('relation') && checkError.message.includes('does not exist')) {
                showToast('⚠️ Fonctionnalité non encore activée. Contactez le gestionnaire.');
                console.warn('⚠️ La table demandes_horaires n\'existe pas encore. Exécutez sql/migrate_demandes_horaires.sql dans Supabase.');
            } else {
                showToast(t('erreur') || '❌ Erreur lors de la vérification');
            }
            return;
        }
        
        let result;
        
        // 2. Si une demande existe déjà, la mettre à jour (écraser)
        if (existingDemandes && existingDemandes.length > 0) {
            const { data, error } = await supabase
                .from('demandes_horaires')
                .update({
                    heure_demandee: heureDemandee,
                    client_nom: reservationData.nom || '',
                    client_prenom: reservationData.prenom || '',
                    gite: reservationData.gite || '',
                    date_debut: reservationData.dateDebut,
                    date_fin: reservationData.dateFin,
                    created_at: new Date().toISOString() // Mettre à jour la date
                })
                .eq('id', existingDemandes[0].id);
            
            if (error) throw error;
            console.log('✅ Demande mise à jour:', data);
            showToast('✅ Demande mise à jour avec succès !');
        } 
        // 3. Sinon, créer une nouvelle demande
        else {
            const { data, error } = await supabase
                .from('demandes_horaires')
                .insert({
                    reservation_id: reservationData.id,
                    client_nom: reservationData.nom || '',
                    client_prenom: reservationData.prenom || '',
                    gite: reservationData.gite || '',
                    type: typeDb,
                    heure_demandee: heureDemandee,
                    date_debut: reservationData.dateDebut,
                    date_fin: reservationData.dateFin,
                    statut: 'en_attente'
                });
            
            if (error) throw error;
            console.log('✅ Demande créée:', data);
            showToast(t('demande_envoyee') || '✅ Demande envoyée avec succès !');
        }
        
        // Cacher le formulaire
        if (type === 'arrivee_anticipee') {
            document.getElementById('formArriveeAnticipee').style.display = 'none';
        } else {
            document.getElementById('formDepartTardif').style.display = 'none';
        }
    } catch (error) {
        console.error('❌ Erreur inattendue:', error);
        showToast('❌ Erreur technique');
    }
}

function calculateAutoApproval(type, heureDemandee) {
    const [hours, minutes] = heureDemandee.split(':').map(Number);
    const requestedMinutes = hours * 60 + minutes;
    
    console.log('🔍 Calculate auto-approval:', {type, heureDemandee, requestedMinutes, cleaningSchedule});
    
    if (type === 'arrivee_anticipee') {
        // Règles pour l'arrivée anticipée
        
        // Si ménage l'après-midi du jour d'arrivée
        if (cleaningSchedule && cleaningSchedule.time_of_day === 'afternoon') {
            // Arrivée minimum 17h (automatique si >= 17h)
            const autoApprove = requestedMinutes >= 17 * 60;
            return autoApprove;
        } else {
            // Pas de ménage ou ménage le matin
            // Arrivée minimum 13h (automatique si >= 17h, manuelle entre 13h-17h)
            const autoApprove = requestedMinutes >= 17 * 60;
            return autoApprove;
        }
    } else { // depart_tardif
        // Règles pour le départ tardif
        
        const isDimanche = new Date(reservationData.date_fin).getDay() === 0;
        
        // Si ménage l'après-midi du jour de départ (ou dimanche sans ménage)
        if (isDimanche && (!cleaningSchedule || cleaningSchedule.time_of_day !== 'afternoon')) {
            // Départ jusqu'à 17h possible
            const autoApprove = requestedMinutes <= 17 * 60;
            return autoApprove;
        }
        
        // Avec ménage l'après-midi : départ standard 10h (automatique si <= 12h)
        const autoApprove = requestedMinutes <= 12 * 60;
        return autoApprove;
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
        
        // Message de validation selon le type
        let message = '✓ Demande envoyée avec succès';
        if (currentLanguage === 'en') {
            message = '✓ Request sent successfully';
        }
        
        showToast(message, 'success');
        
        // Afficher message complémentaire
        const complementDiv = document.createElement('div');
        complementDiv.style.cssText = 'background: var(--gray-100); padding: 1rem; border-radius: 0.5rem; margin-top: 1rem; border-left: 3px solid var(--primary);';
        
        if (type === 'probleme') {
            complementDiv.innerHTML = currentLanguage === 'fr'
                ? '<strong>⚠️ Problème urgent ?</strong><br>La réponse par message n\'est pas instantanée.<br>Pour un problème à régler immédiatement :<br>📞 Téléphonez-nous ou 💬 Envoyez un WhatsApp'
                : '<strong>⚠️ Urgent problem?</strong><br>Response by message is not instant.<br>For immediate assistance:<br>📞 Call us or 💬 Send a WhatsApp';
        } else if (type === 'amelioration' || type === 'retour') {
            complementDiv.innerHTML = currentLanguage === 'fr'
                ? '<strong>🙏 Merci de votre retour !</strong><br>Nous ferons le maximum pour prendre en compte votre message et répondre au mieux aux besoins de nos clients.'
                : '<strong>🙏 Thank you for your feedback!</strong><br>We will do our best to take your message into account and meet our clients\' needs.';
        } else {
            complementDiv.innerHTML = currentLanguage === 'fr'
                ? '<strong>📨 Nous avons bien reçu votre message</strong><br>Nous vous répondrons dans les plus brefs délais.'
                : '<strong>📨 We received your message</strong><br>We will respond as soon as possible.';
        }
        
        const form = document.getElementById('formRetours');
        const existingMsg = form.querySelector('.message-confirmation');
        if (existingMsg) existingMsg.remove();
        
        complementDiv.className = 'message-confirmation';
        form.appendChild(complementDiv);
        
        // Masquer après 8 secondes
        setTimeout(() => complementDiv.remove(), 8000);
        
        // Réinitialiser le formulaire
        form.reset();
        document.getElementById('urgenceGroup').style.display = 'none';
    } catch (error) {
        console.error(error);
        showToast(t('erreur'));
    }
}

// ==================== UTILITAIRES ====================
function formatTime(timeString) {
    if (!timeString || timeString === 'undefined' || timeString === 'null') return '';
    
    // Remplacer le point par deux-points si nécessaire (18.00 -> 18:00)
    const normalized = timeString.replace('.', ':');
    const time = normalized.substring(0, 5);
    if (!time || !time.includes(':')) return timeString; // Retour sécurisé
    
    if (currentLanguage === 'en') {
        // Format 12h pour anglais (6:00 PM)
        const parts = time.split(':');
        if (parts.length !== 2) return time;
        
        const hours = parseInt(parts[0]);
        const minutes = parts[1];
        
        if (isNaN(hours)) return time;
        
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const hour12 = hours === 0 ? 12 : (hours > 12 ? hours - 12 : hours);
        return `${hour12}:${minutes} ${ampm}`;
    } else {
        // Format 24h pour français (18:00)
        return time;
    }
}

function copyToClipboard(inputId) {
    const input = document.getElementById(inputId);
    input.select();
    document.execCommand('copy');
    showToast(t('copie_success'), 'success');
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
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
    const loadingScreen = document.getElementById('loadingScreen');
    if (loadingScreen) {
        loadingScreen.style.display = 'none';
        loadingScreen.style.opacity = '0';
        loadingScreen.style.visibility = 'hidden';
    } else {
        console.error('❌ Element loadingScreen non trouvé!');
    }
}

// Commerces proximité
async function loadEvenementsSemaine() {
    const container = document.getElementById('evenementsSemaineContainer');
    if (!container) return;
    
    // Charger depuis la table activites_gites avec categorie 'Événement'
    const { data: evenements, error } = await supabase
        .from('activites_gites')
        .select('*')
        .eq('gite', normalizeGiteName(reservationData.gite))
        .eq('categorie', 'Événement')
        .order('nom'); // Tri par nom car date_debut n'existe pas
    
    if (error) {
        console.error('Erreur chargement événements:', error);
        return;
    }
    
    if (!evenements || evenements.length === 0) {
        container.style.display = 'none';
        return;
    }
    
    container.style.display = 'block';
    const listeContainer = container.querySelector('.evenements-liste');
    
    listeContainer.innerHTML = evenements.map(evt => {
        // Note: date_debut n'existe pas dans activites_gites
        // Les événements sont affichés par ordre alphabétique
        
        return `
            <div class="card" style="margin-bottom: 1rem; cursor: pointer;" onclick="openActiviteModal(${JSON.stringify(evt).replace(/"/g, '&quot;')})">
                <div style="display: flex; align-items: start; gap: 1rem;">
                    <div style="font-size: 2rem;">📅</div>
                    <div style="flex: 1;">
                        <h3 style="font-size: 1.125rem; font-weight: 700; margin-bottom: 0.25rem;">
                            ${evt.nom}
                        </h3>
                        <p style="color: var(--gray-600); font-size: 0.9rem;">
                            ${(evt.description || '').substring(0, 100)}${(evt.description || '').length > 100 ? '...' : ''}
                        </p>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

async function loadCommerces() {
    const container = document.getElementById('commercesContainer');
    if (!container) return;
    
    // Charger depuis la table activites_gites avec categorie 'Commerce'
    const { data: commerces, error } = await supabase
        .from('activites_gites')
        .select('*')
        .eq('gite', normalizeGiteName(reservationData.gite))
        .eq('categorie', 'Commerce')
        .order('distance');
    
    if (error) {
        console.error('Erreur chargement commerces:', error);
        container.innerHTML = '<p style="padding: 1rem; text-align: center; color: var(--gray-600);">⚠️ Erreur de chargement</p>';
        return;
    }
    
    if (!commerces || commerces.length === 0) {
        container.innerHTML = '<p style="padding: 1rem; text-align: center; color: var(--gray-600);">📋 Aucun commerce ajouté pour le moment</p>';
        return;
    }
    
    // Icones par type de commerce
    const iconMap = {
        'boulangerie': '🥖',
        'supermarché': '🛒',
        'restaurant': '🍽️',
        'café': '☕',
        'pharmacie': '💊',
        'banque': '🏦',
        'poste': '📮'
    };
    
    container.innerHTML = commerces.map(commerce => {
        const sousCategorie = (commerce.sous_categorie || '').toLowerCase();
        const icon = iconMap[sousCategorie] || '🏪';
        
        return `
            <div class="commerce-item">
                <div class="commerce-info">
                    <div class="commerce-name">${icon} ${commerce.nom}</div>
                    <div class="commerce-details">
                        ${commerce.sous_categorie || 'Commerce'}
                        ${commerce.distance ? ` • ${commerce.distance.toFixed(1)} km` : ''}
                        ${commerce.horaires ? `<br><small>${commerce.horaires}</small>` : ''}
                    </div>
                </div>
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    ${commerce.distance ? `<span class="commerce-distance">${commerce.distance.toFixed(1)} km</span>` : ''}
                    ${commerce.latitude && commerce.longitude ? `
                        <button class="btn btn-primary" onclick="openItineraire(${commerce.latitude}, ${commerce.longitude})" 
                                style="padding: 0.5rem 1rem; font-size: 0.875rem;">
                            🗺️
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
}

// Modal Activité Détail
function initModalActivite() {
    const modal = document.getElementById('modalActivite');
    const closeBtn = document.getElementById('closeModalActivite');
    
    closeBtn.addEventListener('click', () => {
        modal.classList.remove('active');
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });
}

function openActiviteModal(activite) {
    const modal = document.getElementById('modalActivite');
    
    document.getElementById('modalActiviteImage').src = activite.image || 'images/default-activity.jpg';
    document.getElementById('modalActiviteTitre').textContent = activite.nom;
    document.getElementById('modalActiviteDescription').textContent = activite.description || 'Aucune description disponible';
    document.getElementById('modalActiviteAdresse').textContent = activite.adresse || 'Non spécifié';
    document.getElementById('modalActiviteHoraires').textContent = activite.horaires || 'Se renseigner';
    document.getElementById('modalActiviteContact').textContent = activite.telephone || 'Non spécifié';
    
    const webLink = document.getElementById('modalActiviteWeb');
    if (activite.site_web) {
        webLink.href = activite.site_web;
        webLink.textContent = activite.site_web;
        webLink.parentElement.style.display = 'block';
    } else {
        webLink.parentElement.style.display = 'none';
    }
    
    document.getElementById('modalActiviteItineraire').onclick = () => {
        openItineraire(activite.latitude, activite.longitude);
    };
    
    modal.classList.add('active');
}

// Ouvrir itinéraire Google Maps
function openItineraire(lat, lng) {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    window.open(url, '_blank');
}

// Partage de page
async function sharePageLink() {
    const url = window.location.href;
    
    // Si le navigateur supporte Web Share API (mobile)
    if (navigator.share) {
        try {
            await navigator.share({
                title: `Fiche Client - ${reservationData.gite}`,
                text: 'Toutes les infos pour votre séjour',
                url: url
            });
            showToast('✓ Lien partagé', 'success');
        } catch (error) {
            // Utilisateur a annulé le partage
        }
    } else {
        // Copier dans le presse-papier (desktop)
        try {
            await navigator.clipboard.writeText(url);
            showToast('✓ Lien copié dans le presse-papier', 'success');
        } catch (error) {
            // Fallback manuel
            const input = document.createElement('input');
            input.value = url;
            document.body.appendChild(input);
            input.select();
            document.execCommand('copy');
            document.body.removeChild(input);
            showToast('✓ Lien copié', 'success');
        }
    }
}

// Badges notification sur tabs
function updateTabBadges() {
    // Badge Entrée: checklist items non cochés
    const checklistEntree = document.querySelectorAll('#checklistEntreeContainer input[type="checkbox"]:not(:checked)');
    updateBadge('tab-entree', checklistEntree.length);
    
    // Badge Sortie: checklist items non cochés
    const checklistSortie = document.querySelectorAll('#checklistSortieContainer input[type="checkbox"]:not(:checked)');
    updateBadge('tab-sortie', checklistSortie.length);
}

function updateBadge(tabId, count) {
    const tab = document.querySelector(`[data-tab="${tabId}"]`);
    if (!tab) return;
    
    let badge = tab.querySelector('.tab-badge');
    
    if (count > 0) {
        if (!badge) {
            badge = document.createElement('span');
            badge.className = 'tab-badge';
            tab.appendChild(badge);
        }
        badge.textContent = count;
    } else {
        if (badge) badge.remove();
    }
}

// ==================== FAQ ====================
let allFaqs = [];
let currentFaqCategory = 'tous';

async function loadFaqData() {
    const { data: faqs, error } = await supabase
        .from('faq')
        .select('*')
        .eq('visible', true)
        .in('gite', ['tous', normalizeGiteName(reservationData.gite)])
        .order('ordre');
    
    if (error) {
        console.error('Erreur chargement FAQs:', error);
        document.getElementById('faqListe').innerHTML = '<p style="padding: 2rem; text-align: center; color: var(--gray-600);">⚠️ Erreur de chargement</p>';
        return;
    }
    
    allFaqs = faqs || [];
    
    if (allFaqs.length === 0) {
        document.getElementById('faqListe').innerHTML = '<p style="padding: 2rem; text-align: center; color: var(--gray-600);">📋 Aucune FAQ disponible</p>';
        return;
    }
    
    // Créer les boutons de catégories
    renderFaqCategories();
    
    // Afficher toutes les FAQs
    displayFaqs(allFaqs);
    
    // Écouter la recherche
    document.getElementById('faqSearch').addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        if (searchTerm) {
            const filtered = allFaqs.filter(faq => 
                faq.question.toLowerCase().includes(searchTerm) ||
                faq.reponse.toLowerCase().includes(searchTerm)
            );
            displayFaqs(filtered);
        } else {
            filterByCategory(currentFaqCategory);
        }
    });
}

function renderFaqCategories() {
    const categories = [
        { key: 'tous', label: '🏠 Tout', labelEn: '🏠 All' },
        { key: 'arrivee', label: '🔑 Arrivée', labelEn: '🔑 Arrival' },
        { key: 'depart', label: '👋 Départ', labelEn: '👋 Departure' },
        { key: 'equipements', label: '🛋️ Équipements', labelEn: '🛋️ Equipment' },
        { key: 'localisation', label: '📍 Localisation', labelEn: '📍 Location' },
        { key: 'tarifs', label: '💰 Tarifs', labelEn: '💰 Pricing' },
        { key: 'reglement', label: '📋 Règlement', labelEn: '📋 Rules' },
        { key: 'autre', label: '❔ Autre', labelEn: '❔ Other' }
    ];
    
    const container = document.getElementById('faqCategories');
    container.innerHTML = categories.map(cat => {
        const label = currentLanguage === 'fr' ? cat.label : cat.labelEn;
        return `
            <button class="faq-category-btn ${cat.key === 'tous' ? 'active' : ''}" 
                    onclick="filterByCategory('${cat.key}')">
                ${label}
            </button>
        `;
    }).join('');
}

function filterByCategory(category) {
    currentFaqCategory = category;
    
    // Mettre à jour les boutons actifs
    document.querySelectorAll('.faq-category-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Filtrer les FAQs
    const filtered = category === 'tous' 
        ? allFaqs 
        : allFaqs.filter(faq => faq.categorie === category);
    
    displayFaqs(filtered);
}

function displayFaqs(faqs) {
    const container = document.getElementById('faqListe');
    
    if (faqs.length === 0) {
        container.innerHTML = '<p style="padding: 2rem; text-align: center; color: var(--gray-600);">🔍 Aucun résultat trouvé</p>';
        return;
    }
    
    container.innerHTML = faqs.map((faq, index) => `
        <div class="faq-item" id="faq-${index}">
            <div class="faq-question" onclick="toggleFaq(${index})">
                <span>${faq.question}</span>
                <span class="faq-toggle">▼</span>
            </div>
            <div class="faq-reponse">
                ${faq.reponse}
            </div>
        </div>
    `).join('');
}

function toggleFaq(index) {
    const faqItem = document.getElementById(`faq-${index}`);
    faqItem.classList.toggle('open');
}

// ==================== PWA INSTALL ====================
let deferredPrompt;
const pwaInstallBanner = document.getElementById('pwaInstallBanner');
const pwaInstallBtn = document.getElementById('pwaInstallBtn');
const pwaDismissBtn = document.getElementById('pwaDismissBtn');

// Écouter l'événement beforeinstallprompt
window.addEventListener('beforeinstallprompt', (e) => {
    // Empêcher le prompt natif par défaut
    e.preventDefault();
    // Stocker l'événement pour l'utiliser plus tard
    deferredPrompt = e;
    
    // Vérifier si l'utilisateur n'a pas déjà refusé
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    const installed = localStorage.getItem('pwa-installed');
    
    if (!dismissed && !installed) {
        // Afficher notre banner custom après 3 secondes
        setTimeout(() => {
            pwaInstallBanner.classList.add('show');
        }, 3000);
    }
});

// Installer l'app
pwaInstallBtn?.addEventListener('click', async () => {
    if (!deferredPrompt) return;
    
    // Afficher le prompt natif
    deferredPrompt.prompt();
    
    // Attendre que l'utilisateur réponde
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
        localStorage.setItem('pwa-installed', 'true');
        showToast('✓ Application installée avec succès', 'success');
    }
    
    // Réinitialiser le prompt
    deferredPrompt = null;
    pwaInstallBanner.classList.remove('show');
});

// Refuser le banner
pwaDismissBtn?.addEventListener('click', () => {
    pwaInstallBanner.classList.remove('show');
    localStorage.setItem('pwa-install-dismissed', 'true');
    
    // Réafficher dans 7 jours
    setTimeout(() => {
        localStorage.removeItem('pwa-install-dismissed');
    }, 7 * 24 * 60 * 60 * 1000);
});

// Détecter si l'app est déjà installée (mode standalone)
if (window.matchMedia('(display-mode: standalone)').matches) {
    localStorage.setItem('pwa-installed', 'true');
}

// Rendre les fonctions globales pour onclick
window.toggleClientChecklistItem = toggleClientChecklistItem;
window.copyToClipboard = copyToClipboard;
window.openActiviteModal = openActiviteModal;
window.openItineraire = openItineraire;
window.trackActiviteConsultation = trackActiviteConsultation;
window.initEtatDesLieux = initEtatDesLieux;
window.initEvaluation = initEvaluation;
window.filterByCategory = filterByCategory;
window.submitProbleme = submitProbleme;
window.submitEvaluation = submitEvaluation;

// =============================================
// GESTION DES CHECKLISTS CLIENT
// =============================================

async function loadClientChecklists() {
    console.log('📋 Chargement checklists client...');
    
    if (!reservationData || !giteInfo) {
        console.log('⚠️ Données manquantes pour checklists');
        return;
    }
    
    try {
        // Normaliser le nom du gîte (première lettre en majuscule)
        const giteNormalized = giteInfo.gite.charAt(0).toUpperCase() + giteInfo.gite.slice(1).toLowerCase();
        console.log(`🏠 Gîte recherché: "${giteNormalized}" (original: "${giteInfo.gite}")`);
        
        // Charger les templates du gîte
        const { data: templatesEntree, error: errorEntree } = await supabase
            .from('checklist_templates')
            .select('*')
            .eq('gite', giteNormalized)
            .eq('type', 'entree')
            .eq('actif', true)
            .order('ordre', { ascending: true });
        
        const { data: templatesSortie, error: errorSortie } = await supabase
            .from('checklist_templates')
            .select('*')
            .eq('gite', giteNormalized)
            .eq('type', 'sortie')
            .eq('actif', true)
            .order('ordre', { ascending: true });
        
        if (errorEntree || errorSortie) {
            console.error('❌ Erreur chargement templates:', errorEntree || errorSortie);
            return;
        }
        
        // Charger la progression
        const { data: progress, error: progressError } = await supabase
            .from('checklist_progress')
            .select('*')
            .eq('reservation_id', reservationData.id);
        
        if (progressError) {
            console.error('❌ Erreur chargement progression:', progressError);
            return;
        }
        
        // Map pour accès rapide
        const progressMap = {};
        if (progress) {
            progress.forEach(p => {
                progressMap[p.template_id] = p.completed;
            });
        }
        
        // Afficher checklist entrée
        renderClientChecklist('entree', templatesEntree || [], progressMap);
        
        // Afficher checklist sortie
        renderClientChecklist('sortie', templatesSortie || [], progressMap);
        
        console.log('✅ Checklists chargées:', {
            gite: giteInfo.gite,
            entree: templatesEntree?.length || 0,
            sortie: templatesSortie?.length || 0,
            completed: Object.keys(progressMap).length,
            templatesEntree: templatesEntree,
            templatesSortie: templatesSortie
        });
    } catch (error) {
        console.error('❌ Erreur loadClientChecklists:', error);
    }
}

function renderClientChecklist(type, templates, progressMap) {
    console.log(`🎨 Render checklist ${type}:`, { 
        templatesCount: templates?.length,
        templates: templates, 
        progressMap: progressMap 
    });
    
    const containerId = type === 'entree' ? 'checklistEntreeContainer' : 'checklistSortieContainer';
    const progressBarId = type === 'entree' ? 'progressEntree' : 'progressSortie';
    const progressTextId = type === 'entree' ? 'progressEntreeText' : 'progressSortieText';
    
    console.log(`🔍 Recherche container: ${containerId}`);
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`❌ Container ${containerId} introuvable`);
        return;
    }
    
    console.log(`✅ Container trouvé:`, container);
    
    if (!templates || templates.length === 0) {
        container.innerHTML = '<p style="color: var(--gray-600); font-style: italic; text-align: center;">Aucun item configuré</p>';
        return;
    }
    
    // Calculer progression
    const completed = templates.filter(t => progressMap[t.id] === true).length;
    const total = templates.length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    // Mettre à jour barre de progression
    const progressBar = document.getElementById(progressBarId);
    const progressText = document.getElementById(progressTextId);
    if (progressBar) progressBar.style.width = percent + '%';
    if (progressText) progressText.textContent = `${completed}/${total} (${percent}%)`;
    
    // Générer HTML
    let html = '';
    templates.forEach(template => {
        const isCompleted = progressMap[template.id] === true;
        html += `
            <div class="checkbox-item" style="margin-bottom: 0.75rem; padding: 1rem; background: ${isCompleted ? 'var(--gray-100)' : 'white'}; border: 2px solid ${isCompleted ? 'var(--success)' : 'var(--gray-200)'}; border-radius: 0.5rem; transition: all 0.3s;">
                <label style="display: flex; align-items: start; gap: 0.75rem; cursor: pointer;">
                    <input type="checkbox" ${isCompleted ? 'checked' : ''} 
                           onchange="toggleClientChecklistItem(${template.id}, '${type}')"
                           style="margin-top: 0.25rem; width: 1.25rem; height: 1.25rem; cursor: pointer;">
                    <div style="flex: 1;">
                        <div style="font-weight: ${isCompleted ? '600' : '400'}; color: ${isCompleted ? 'var(--gray-700)' : 'var(--gray-900)'}; margin-bottom: 0.25rem;">
                            ${template.texte}
                        </div>
                        ${template.description ? `<div style="font-size: 0.875rem; color: var(--gray-600);">${template.description}</div>` : ''}
                    </div>
                    ${isCompleted ? '<span style="font-size: 1.5rem;">✅</span>' : ''}
                </label>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

async function toggleClientChecklistItem(templateId, type) {
    if (!reservationData) {
        console.error('❌ Pas de réservation');
        return;
    }
    
    try {
        // Récupérer l'état actuel
        const { data: existing, error: fetchError } = await supabase
            .from('checklist_progress')
            .select('*')
            .eq('reservation_id', reservationData.id)
            .eq('template_id', templateId)
            .single();
        
        if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = pas trouvé (OK)
            throw fetchError;
        }
        
        const newCompleted = existing ? !existing.completed : true;
        
        // Upsert
        const { error: upsertError } = await supabase
            .from('checklist_progress')
            .upsert({
                reservation_id: reservationData.id,
                template_id: templateId,
                completed: newCompleted,
                completed_at: newCompleted ? new Date().toISOString() : null
            }, {
                onConflict: 'reservation_id,template_id'
            });
        
        if (upsertError) throw upsertError;
        
        console.log(`✅ Checklist ${templateId} ${newCompleted ? 'cochée' : 'décochée'}`);
        
        // Recharger pour mettre à jour l'affichage
        await loadClientChecklists();
    } catch (error) {
        console.error('❌ Erreur toggle checklist:', error);
        alert('Erreur lors de la sauvegarde. Veuillez réessayer.');
    }
}

// ============================================================================
// GESTION SIGNALEMENT PROBLÈME
// ============================================================================

async function submitProbleme(event) {
    event.preventDefault();
    
    try {
        console.log('📤 Envoi signalement problème...');
        
        const formData = {
            reservation_id: giteInfo.reservationId,
            type: document.getElementById('typeProbleme').value,
            urgence: document.getElementById('urgenceProbleme').value,
            description: document.getElementById('descriptionProbleme').value,
            telephone: document.getElementById('telProbleme').value,
            gite: giteInfo.gite,
            statut: 'nouveau',
            created_at: new Date().toISOString()
        };
        
        const { data, error } = await supabaseClient
            .from('problemes_signales')
            .insert([formData])
            .select();
        
        if (error) throw error;
        
        console.log('✅ Problème signalé:', data);
        
        // Masquer le formulaire et afficher la confirmation
        document.getElementById('formProbleme').style.display = 'none';
        document.getElementById('confirmationProbleme').style.display = 'block';
        
        // Envoyer une notification (TODO: webhook admin)
        // Pour l'instant, juste un log
        console.log('🔔 Notification à envoyer:', {
            urgence: formData.urgence,
            type: formData.type,
            gite: formData.gite
        });
        
    } catch (error) {
        console.error('❌ Erreur signalement problème:', error);
        alert('Erreur lors de l\'envoi du signalement. Veuillez réessayer.');
    }
}

// ============================================================================
// GESTION ÉVALUATION SÉJOUR
// ============================================================================

function initStarRating() {
    const stars = document.querySelectorAll('.star-rating');
    const ratings = {}; // Stocke les notes par champ
    
    stars.forEach(star => {
        const field = star.getAttribute('data-field');
        
        // Survol
        star.addEventListener('mouseenter', function() {
            const rating = parseInt(this.getAttribute('data-rating'));
            const fieldName = this.getAttribute('data-field');
            highlightStarsForField(fieldName, rating);
        });
        
        // Clic
        star.addEventListener('click', function() {
            const rating = parseInt(this.getAttribute('data-rating'));
            const fieldName = this.getAttribute('data-field');
            ratings[fieldName] = rating;
            document.getElementById(fieldName).value = rating;
            highlightStarsForField(fieldName, rating, true);
            console.log(`⭐ ${fieldName}: ${rating}/5`);
        });
        
        // Réinitialiser au départ de la souris
        star.addEventListener('mouseleave', function() {
            const fieldName = this.getAttribute('data-field');
            const savedRating = ratings[fieldName] || 0;
            highlightStarsForField(fieldName, savedRating, true);
        });
    });
    
    function highlightStarsForField(fieldName, rating, permanent = false) {
        const fieldStars = document.querySelectorAll(`.star-rating[data-field="${fieldName}"]`);
        fieldStars.forEach(star => {
            const starRating = parseInt(star.getAttribute('data-rating'));
            if (starRating <= rating) {
                star.textContent = '★';
                star.style.color = permanent ? '#fbbf24' : '#fcd34d';
                star.style.cursor = 'pointer';
            } else {
                star.textContent = '☆';
                star.style.color = '#d1d5db';
                star.style.cursor = 'pointer';
            }
        });
    }
}

async function submitEvaluation(event) {
    event.preventDefault();
    
    try {
        console.log('📝 Envoi évaluation séjour...');
        
        const noteGlobale = document.getElementById('noteGlobale').value;
        const noteProprete = document.getElementById('noteProprete').value;
        const noteConfort = document.getElementById('noteConfort').value;
        const noteEmplacement = document.getElementById('noteEmplacement').value;
        const noteEquipements = document.getElementById('noteEquipements').value;
        const noteRapportQP = document.getElementById('noteRapportQP').value;
        
        if (!noteGlobale || !noteProprete || !noteConfort || !noteEmplacement || !noteEquipements || !noteRapportQP) {
            alert('Veuillez noter tous les critères en cliquant sur les étoiles.');
            return;
        }
        
        const formData = {
            reservation_id: giteInfo.reservationId,
            gite: giteInfo.gite,
            note_globale: parseInt(noteGlobale),
            note_proprete: parseInt(noteProprete),
            note_confort: parseInt(noteConfort),
            note_emplacement: parseInt(noteEmplacement),
            note_equipements: parseInt(noteEquipements),
            note_rapport_qp: parseInt(noteRapportQP),
            commentaire: document.getElementById('commentaireEvaluationSejour').value,
            points_positifs: document.getElementById('pointsPositifsSejour').value,
            points_ameliorer: document.getElementById('pointsAmeliorerSejour').value,
            recommandation: document.getElementById('recommandationSejour').value,
            recommandation: document.getElementById('recommandation').value,
            created_at: new Date().toISOString()
        };
        
        const { data, error } = await supabaseClient
            .from('evaluations_sejour')
            .insert([formData])
            .select();
        
        if (error) throw error;
        
        console.log('✅ Évaluation enregistrée:', data);
        
        // Masquer le formulaire et afficher la confirmation
        document.getElementById('formEvaluationSejour').style.display = 'none';
        document.getElementById('confirmationEvaluation').style.display = 'block';
        
    } catch (error) {
        console.error('❌ Erreur évaluation:', error);
        alert('Erreur lors de l\'envoi de l\'évaluation. Veuillez réessayer.');
    }
}

// ============================================================================
// INITIALISATION DES NOUVEAUX ONGLETS
// ============================================================================

function initProblemeTab() {
    const form = document.getElementById('formProbleme');
    if (form) {
        form.removeEventListener('submit', submitProbleme); // Éviter les doublons
        form.addEventListener('submit', submitProbleme);
    }
}

function initEvaluationTab() {
    initStarRating();
    
    const form = document.getElementById('formEvaluationSejour');
    if (form) {
        form.removeEventListener('submit', submitEvaluation); // Éviter les doublons
        form.addEventListener('submit', submitEvaluation);
    }
}
window.toggleFaq = toggleFaq;
