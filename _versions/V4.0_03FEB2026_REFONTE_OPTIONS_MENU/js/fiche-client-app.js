/**
 * APPLICATION FICHE CLIENT INTERACTIVE
 * Gestion de la fiche personnalisée par réservation pour les clients
 */

// ==================== CONFIGURATION ====================
// Protection contre double chargement
if (!window.ficheClientAppLoaded) {
    window.ficheClientAppLoaded = true;

    const SUPABASE_URL = window.APP_CONFIG?.SUPABASE_URL || window.SUPABASE_URL || 'https://fgqimtpjjhdqeyyaptoj.supabase.co';
    const SUPABASE_KEY = window.APP_CONFIG?.SUPABASE_KEY || window.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZncWltdHBqamhkcWV5eWFwdG9qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgxNTU0MjQsImV4cCI6MjA4MzczMTQyNH0.fOuYg0COYts7XXWxgB7AM01Fg6P86f8oz8XVpGdIaNM';

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
                // // console.log('🆕 New SW found!');
                
                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'activated') {
                        // // console.log('🟢 New SW activated! Reloading...');
                        window.location.reload();
                    }
                });
            });
        }).catch(error => {
            // console.log('❌ SW registration failed:', error)
        });
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

// 🌍 TRADUCTION AUTOMATIQUE FR → EN
async function translateText(text) {
    if (!text || text.trim() === '') return '';
    
    try {
        // API MyMemory (gratuite, 10 000 requêtes/jour)
        const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=fr|en`;
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.responseStatus === 200 && data.responseData) {
            return data.responseData.translatedText;
        }
        return text; // Fallback si erreur
    } catch (error) {
        console.error('❌ Erreur traduction:', error);
        return text;
    }
}

// Traduire automatiquement TOUS les champs vides _en depuis FR
async function autoTranslateGiteInfoIfNeeded() {
    if (!giteInfo) return;
    
    // Liste des champs à traduire (FR → EN)
    const fieldsToTranslate = [
        'adresse', 'telephone', 'email',
        'wifi_ssid', 'wifi_password', 'wifi_debit', 'wifi_localisation', 'wifi_zones',
        'heure_arrivee', 'arrivee_tardive', 'parking_dispo', 'parking_places', 'parking_details',
        'type_acces', 'code_acces', 'instructions_cles', 'etage', 'ascenseur', 
        'itineraire_logement', 'premiere_visite',
        'type_chauffage', 'climatisation', 'instructions_chauffage',
        'equipements_cuisine', 'instructions_four', 'instructions_plaques',
        'instructions_lave_vaisselle', 'instructions_lave_linge',
        'seche_linge', 'fer_repasser', 'linge_fourni', 'configuration_chambres',
        'instructions_tri', 'jours_collecte', 'decheterie',
        'detecteur_fumee', 'extincteur', 'coupure_eau', 'disjoncteur', 'consignes_urgence',
        'heure_depart', 'depart_tardif', 'checklist_depart', 'restitution_cles',
        'tabac', 'animaux', 'nb_max_personnes', 'caution'
    ];
    
    let translated = false;
    const updates = {};
    
    for (const field of fieldsToTranslate) {
        const valueFR = giteInfo[field];
        const valueEN = giteInfo[field + '_en'];
        
        // Si FR rempli mais EN vide → Traduire
        if (valueFR && valueFR.trim() !== '' && (!valueEN || valueEN.trim() === '')) {
            console.log(`🌍 Traduction ${field}: "${valueFR.substring(0, 50)}..."`);
            
            // Traduire avec délai pour éviter rate limit (100ms entre chaque)
            await new Promise(resolve => setTimeout(resolve, 100));
            const translated_text = await translateText(valueFR);
            
            giteInfo[field + '_en'] = translated_text;
            updates[field + '_en'] = translated_text;
            translated = true;
        }
    }
    
    // Sauvegarder les traductions dans la base
    if (translated && Object.keys(updates).length > 0) {
        console.log(`💾 Sauvegarde de ${Object.keys(updates).length} traductions automatiques...`);
        
        try {
            const { error } = await supabase
                .from('infos_gites')
                .update(updates)
                .eq('gite', normalizeGiteName(reservationData.gite));
            
            if (error) {
                console.error('❌ Erreur sauvegarde traductions:', error);
            } else {
                console.log('✅ Traductions sauvegardées en base de données');
            }
        } catch (err) {
            console.error('❌ Erreur update base:', err);
        }
    }
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
        tab_activites: 'Activités et commerces',
        tab_probleme: 'Demandes',
        tab_evaluation: 'Évaluation',
        tab_faq: 'FAQ',
        adresse_title: 'Adresse du gîte',
        ouvrir_maps: 'Ouvrir dans Google Maps',
        horaire_arrivee: 'Horaire d\'arrivée',
        demander_arrivee: 'Demander une arrivée plus tôt',
        heure_souhaitee: 'Heure souhaitée',
        motif_optionnel: 'Motif (optionnel)',
        envoyer: 'Envoyer',
        annuler: 'Annuler',
        code_entree: 'Code d\'entrée',
        instructions_acces: 'Instructions d\'accès',
        reseau: 'Réseau',
        mot_de_passe: 'Mot de passe',
        checklist_entree: 'Checklist d\'arrivée',
        progression: 'Progression',
        equipements: 'Équipements disponibles',
        reglement: 'Règlement intérieur',
        contacts_urgence: 'Contacts d\'urgence',
        vos_retours: 'Demandes / Retours / Améliorations',
        description_retours: 'N\'hésitez pas à nous faire part de vos besoins ou suggestions',
        type: 'Type',
        sujet: 'Sujet',
        description: 'Description',
        urgence: 'Niveau d\'urgence',
        urgence_basse: 'Basse',
        urgence_normale: 'Normale',
        urgence_haute: 'Haute',
        horaire_depart: 'Horaire de départ',
        demander_depart: 'Demander un départ plus tard',
        instructions_sortie: 'Instructions de départ',
        checklist_sortie: 'Checklist de départ',
        activites_title: 'Activités à découvrir',
        arrivee_possible_13h: 'Arrivée dès 13h possible. 13h-17h: validation manuelle. Après 17h: automatique.',
        arrivee_possible_17h: 'Arrivée à partir de 17h (ménage prévu l\'après-midi). Validation automatique.',
        depart_possible_12h: 'Départ jusqu\'à 12h possible en semaine (sur validation)',
        depart_possible_17h_dimanche: 'Départ jusqu\'à 17h possible le dimanche si pas de ménage l\'après-midi',
        demande_envoyee: 'Votre demande a été envoyée avec succès !',
        erreur: 'Une erreur s\'est produite. Veuillez réessayer.',
        retour_envoye: 'Votre message a été envoyé. Merci !',
        copie_success: 'Copié dans le presse-papier !',
        demande: 'Demande',
        retour: 'Retour',
        amelioration: 'Amélioration',
        probleme: 'Problème',
        wifi_internet: 'WiFi & Internet',
        parking_title: 'Parking',
        chauffage_clim: 'Chauffage & Climatisation',
        cuisine_electromenager: 'Cuisine & Électroménager',
        tri_dechets: 'Tri des déchets',
        securite_urgence: 'Sécurité & Urgence',
        partager: 'Partager',
        bienvenue: 'Bienvenue',
        votre_sejour: 'Votre séjour',
        chargement: 'Chargement de votre guide...',
        installer_app: 'Installer l\'application',
        acces_rapide: 'Accédez rapidement à votre guide, même hors ligne',
        installer: 'Installer',
        plus_tard: 'Plus tard',
        countdown_label: 'Votre séjour commence dans',
        countdown_checkout: 'Fin de votre séjour dans',
        jours: 'jours',
        heures: 'h',
        minutes: 'min',
        quick_code: 'Code d\'accès',
        quick_wifi: 'WiFi',
        quick_activites: 'Activités',
        quick_contact: 'Contact',
        timeline_avant: 'Avant votre arrivée',
        timeline_pendant: 'Pendant votre séjour',
        timeline_apres: 'Après votre départ',
        humidity: 'Humidité',
        wind: 'Vent',
        feels_like: 'Ressenti',
        updated: 'Mis à jour',
        weather_unavailable: 'Météo non disponible',
        disponibilite: 'Disponibilité',
        places: 'Places',
        type_chauffage: 'Type de chauffage',
        climatisation: 'Climatisation',
        instructions: 'Instructions',
        jours_collecte: 'Jours de collecte',
        decheterie: 'Déchèterie',
        important: 'Important',
        horaire_info: 'Les horaires d\'arrivée plus tôt dépendent du ménage avant vous. Si nous pouvons, nous vous permettons l\'arrivée plus tôt.',
        copier: 'Copier',
        voir_carte: 'Voir sur la carte',
        voir_itineraire: 'Voir l\'itinéraire',
        distance: 'Distance',
        questions_frequentes: 'Questions fréquentes',
        description_faq: 'Trouvez rapidement des réponses à vos questions',
        rechercher_faq: 'Rechercher une question...',
        eval_titre: 'Votre avis compte énormément !',
        eval_description: 'Comprenez l\'impact de votre notation sur notre activité',
        eval_comment_notation: 'Comment fonctionne la notation ?',
        eval_5sur5_titre: '5/5 = Séjour conforme à vos attentes',
        eval_5sur5_texte: 'C\'est la norme attendue, pas l\'excellence. Tout s\'est bien passé ? C\'est un 5/5 !',
        eval_4sur5_titre: '4/5 ou moins = Impact majeur sur notre visibilité',
        eval_4sur5_texte: 'Les plateformes pénalisent sévèrement toute note < 5/5. Une moyenne < 4,8 peut nous déréférencer.',
        eval_probleme_titre: 'Un problème rencontré ?',
        eval_probleme_texte: 'Contactez-nous AVANT de noter via l\'onglet "Demandes". Nous sommes réactifs et trouverons une solution ensemble !',
        eval_objectif: 'Notre objectif : Vous offrir un séjour mémorable ! Si nous y sommes parvenus, votre 5/5 + commentaire détaillé nous aidera à continuer d\'accueillir d\'autres voyageurs comme vous. Merci de votre soutien !',
        btn_envoyer: 'Envoyer',
        btn_voir_carte: 'Voir sur carte',
        btn_voir_google_maps: 'Voir sur Google Maps',
        btn_ouvrir_google_maps: 'Ouvrir dans Google Maps',
        btn_retour_gite: 'Retour gîte seul'
    },
    en: {
        tab_entree: 'Check-in',
        tab_pendant: 'During stay',
        tab_sortie: 'Check-out',
        tab_activites: 'Activities & Shops',
        tab_probleme: 'Requests',
        tab_evaluation: 'Review',
        tab_faq: 'FAQ',
        adresse_title: 'Address',
        ouvrir_maps: 'Open in Google Maps',
        horaire_arrivee: 'Check-in time',
        demander_arrivee: 'Request early check-in',
        heure_souhaitee: 'Desired time',
        motif_optionnel: 'Reason (optional)',
        envoyer: 'Send',
        annuler: 'Cancel',
        code_entree: 'Entry code',
        instructions_acces: 'Access instructions',
        reseau: 'Network',
        mot_de_passe: 'Password',
        checklist_entree: 'Check-in checklist',
        progression: 'Progress',
        equipements: 'Available amenities',
        reglement: 'House rules',
        contacts_urgence: 'Emergency contacts',
        vos_retours: 'Requests / Feedback / Suggestions',
        description_retours: 'Feel free to share your needs or suggestions',
        type: 'Type',
        sujet: 'Subject',
        description: 'Description',
        urgence: 'Urgency level',
        urgence_basse: 'Low',
        urgence_normale: 'Normal',
        urgence_haute: 'High',
        horaire_depart: 'Check-out time',
        demander_depart: 'Request late check-out',
        instructions_sortie: 'Check-out instructions',
        checklist_sortie: 'Check-out checklist',
        activites_title: 'Activities to discover',
        arrivee_possible_13h: 'Check-in available from 1pm (no afternoon cleaning)',
        arrivee_possible_17h: 'Check-in available from 5pm (cleaning in progress)',
        depart_possible_12h: 'Check-out until 12pm possible on weekdays (subject to approval)',
        depart_possible_17h_dimanche: 'Check-out until 5pm possible on Sundays if no afternoon cleaning',
        demande_envoyee: 'Your request has been sent successfully!',
        erreur: 'An error occurred. Please try again.',
        retour_envoye: 'Your message has been sent. Thank you!',
        copie_success: 'Copied to clipboard!',
        demande: 'Request',
        retour: 'Feedback',
        amelioration: 'Suggestion',
        probleme: 'Issue',
        wifi_internet: 'WiFi & Internet',
        parking_title: 'Parking',
        chauffage_clim: 'Heating & Air Conditioning',
        cuisine_electromenager: 'Kitchen & Appliances',
        tri_dechets: 'Waste Sorting',
        securite_urgence: 'Safety & Emergency',
        partager: 'Share',
        bienvenue: 'Welcome',
        votre_sejour: 'Your stay',
        chargement: 'Loading your guide...',
        installer_app: 'Install the app',
        acces_rapide: 'Quick access to your guide, even offline',
        installer: 'Install',
        plus_tard: 'Later',
        countdown_label: 'Your stay starts in',
        countdown_checkout: 'Your stay ends in',
        jours: 'days',
        heures: 'h',
        minutes: 'min',
        quick_code: 'Access code',
        quick_wifi: 'WiFi',
        quick_activites: 'Activities',
        quick_contact: 'Contact',
        timeline_avant: 'Before your arrival',
        timeline_pendant: 'During your stay',
        timeline_apres: 'After departure',
        humidity: 'Humidity',
        wind: 'Wind',
        feels_like: 'Feels like',
        updated: 'Updated',
        weather_unavailable: 'Weather unavailable',
        disponibilite: 'Availability',
        places: 'Spaces',
        type_chauffage: 'Heating type',
        climatisation: 'Air conditioning',
        instructions: 'Instructions',
        jours_collecte: 'Collection days',
        decheterie: 'Waste center',
        important: 'Important',
        horaire_info: 'Early check-in depends on cleaning before you. If possible, we allow earlier arrival.',
        copier: 'Copy',
        voir_carte: 'View on map',
        voir_itineraire: 'View directions',
        distance: 'Distance',
        questions_frequentes: 'Frequently Asked Questions',
        description_faq: 'Find answers to your questions quickly',
        rechercher_faq: 'Search for a question...',
        eval_titre: 'Your opinion matters greatly!',
        eval_description: 'Understand the impact of your rating on our business',
        eval_comment_notation: 'How does rating work?',
        eval_5sur5_titre: '5/5 = Stay met your expectations',
        eval_5sur5_texte: 'This is the expected standard, not excellence. Everything went well? That\'s a 5/5!',
        eval_4sur5_titre: '4/5 or less = Major impact on our visibility',
        eval_4sur5_texte: 'Platforms severely penalize any rating < 5/5. An average < 4.8 can delist us.',
        eval_probleme_titre: 'Encountered a problem?',
        eval_probleme_texte: 'Contact us BEFORE rating via the "Requests" tab. We are responsive and will find a solution together!',
        eval_objectif: 'Our goal: To offer you a memorable stay! If we succeeded, your 5/5 + detailed comment will help us continue welcoming other travelers like you. Thank you for your support!',
        btn_envoyer: 'Send',
        btn_voir_carte: 'View on map',
        btn_voir_google_maps: 'View on Google Maps',
        btn_ouvrir_google_maps: 'Open in Google Maps',
        btn_retour_gite: 'Back to cottage only'
    }
};

function t(key) {
    return translations[currentLanguage][key] || key;
}

function updateTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        const translation = t(key);
        
        // Cas spéciaux : ne pas écraser le contenu dynamique
        if (key === 'bienvenue' && reservationData?.client_name) {
            el.textContent = `${translation} ${reservationData.client_name} !`;
        } else if (key === 'votre_sejour' && reservationData?.gite) {
            el.textContent = reservationData.gite;
        } else if (el.tagName === 'BUTTON' || el.tagName === 'SPAN') {
            // Pour les boutons et spans, seulement mettre à jour si pas de contenu mixte
            if (!el.querySelector('span')) {
                el.textContent = translation;
            }
        } else {
            el.textContent = translation;
        }
    });
    
    // Update select options
    document.querySelectorAll('[data-i18n-option]').forEach(el => {
        const key = el.getAttribute('data-i18n-option');
        el.textContent = t(key);
    });
    
    // Update placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        el.placeholder = t(key);
    });
    
    // 🌍 RECHARGER tous les onglets pour appliquer la langue dynamique
    initOngletEntree();
    initOngletPendant();
    initOngletSortie();
    
    // Recharger les checklists avec la bonne langue
    if (typeof loadClientChecklists === 'function') {
        loadClientChecklists();
    }
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
        // // console.warn('⚠️ Mode DEBUG: Token expiré mais affiché quand même');
    }
    
    // Mettre à jour le token (colonnes existantes)
    await supabase
        .from('client_access_tokens')
        .update({
            updated_at: new Date().toISOString(),
            is_active: true
        })
        .eq('id', tokenData.id);
    
    reservationData = tokenData.reservation;
    
    // Logs désactivés (table fiche_generation_logs optionnelle)
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
    
    // 🌍 TRADUCTION AUTOMATIQUE : Si champs EN vides, traduire depuis FR
    await autoTranslateGiteInfoIfNeeded();
    
    // ✅ Table demandes_horaires restaurée - 28/01/2026
    // Récupération des horaires validées pour affichage
    const { data: horairesValidees, error: horairesError } = await supabase
        .from('demandes_horaires')
        .select('type, heure_demandee, statut')
        .eq('reservation_id', reservationData.id)
        .eq('statut', 'validee')
        .in('type', ['arrivee', 'depart']);
    
    // Ignorer silencieusement si la table n'existe pas (pas encore migrée)
    if (horairesError) {
        console.warn('⚠️ Impossible de charger horaires validées:', horairesError.message);
    }
    
    // Stocker les horaires validées dans giteInfo pour affichage
    if (horairesValidees && horairesValidees.length > 0) {
        horairesValidees.forEach(h => {
            if (h.type === 'arrivee') {
                giteInfo.heure_arrivee_validee = h.heure_demandee;
                console.log('✅ Heure arrivée validée chargée:', h.heure_demandee);
            }
            if (h.type === 'depart') {
                giteInfo.heure_depart_validee = h.heure_demandee;
                console.log('✅ Heure départ validée chargée:', h.heure_demandee);
            }
        });
    }
}

async function loadCleaningSchedule() {
    // Charger le ménage du jour d'ARRIVÉE (avant la résa)
    const { data: menageAvant } = await supabase
        .from('cleaning_schedule')
        .select('*')
        .eq('gite', normalizeGiteName(reservationData.gite))
        .eq('scheduled_date', reservationData.check_in)
        .maybeSingle();
    
    cleaningScheduleAvant = menageAvant;
    
    // Charger le ménage du jour de DÉPART (après la résa)
    const { data: menageApres } = await supabase
        .from('cleaning_schedule')
        .select('*')
        .eq('gite', normalizeGiteName(reservationData.gite))
        .eq('scheduled_date', reservationData.check_out)
        .maybeSingle();
    
    cleaningScheduleApres = menageApres;
}

function initializeUI() {
    // Nom du client dans l'en-tête
    const clientNameEl = document.getElementById('clientName');
    if (clientNameEl && reservationData.client_name) {
        const welcomeText = t('bienvenue');
        clientNameEl.textContent = `${welcomeText} ${reservationData.client_name} !`;
    }
    
    // Titre du gîte
    document.getElementById('giteName').textContent = `${reservationData.gite}`;
    
    // ✨ NOUVEAU : Initialiser Hero Section
    initHeroSection();
    
    // Onglet Entrée
    initOngletEntree();
    
    // Onglet Pendant
    initOngletPendant();
    
    // Onglet Sortie
    initOngletSortie();
    
    // Onglet Activités - NE PAS CHARGER ICI (onglet caché)
    // initOngletActivites(); // Sera chargé au premier clic sur l'onglet
    
    // Onglet FAQ - Chargé au clic uniquement
    // initOngletFaq(); // Sera chargé au premier clic sur l'onglet
    
    // ✅ Nouveaux onglets: Problème et Évaluation
    initProblemeTab();
    initEvaluationTab();
    
    // ✨ Hero Section + Timeline
    initHeroSection();
    initTimelineSection();
    
    // 🎨 Sélecteur de thème
    initThemeSwitcher();
    
    // Appliquer les traductions
    updateTranslations();
}

// ✨ NOUVEAU : Initialisation du Hero Section
function initHeroSection() {
    const heroSection = document.getElementById('heroSection');
    if (!heroSection || !reservationData || !giteInfo) {
        if (heroSection) heroSection.style.display = 'none';
        return;
    }
    
    // Parser les dates avec gestion d'erreur robuste
    try {
        // Extraire les heures même si il y a du texte (ex: "À partir de 18h00" -> "18:00")
        const extractTime = (timeStr) => {
            const match = (timeStr || '').match(/(\d{1,2})[h:](\d{2})/);
            if (match) {
                return `${match[1].padStart(2, '0')}:${match[2]}`;
            }
            return null;
        };
        
        const heureArrivee = extractTime(giteInfo.heure_arrivee) || '17:00';
        const heureDepart = extractTime(giteInfo.heure_depart) || '11:00';
        
        const checkInStr = reservationData.check_in + 'T' + heureArrivee + ':00';
        const checkOutStr = reservationData.check_out + 'T' + heureDepart + ':00';
        
        const checkIn = new Date(checkInStr);
        const checkOut = new Date(checkOutStr);
        const now = new Date();
        
        // Vérifier validité des dates
        if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
            console.warn('⚠️ Dates invalides pour countdown:', checkInStr, checkOutStr);
            heroSection.style.display = 'none';
            return;
        }
        
        // Afficher le Hero seulement si le séjour n'est pas terminé
        if (now > checkOut) {
            heroSection.style.display = 'none';
            return;
        }
        
        // Afficher le Hero
        heroSection.style.display = 'block';
        
        // Calculer et afficher le countdown
        updateCountdown(checkIn, checkOut);
        
        // Mettre à jour le countdown toutes les minutes
        setInterval(() => updateCountdown(checkIn, checkOut), 60000);
        
        // Initialiser les Quick Actions
        initQuickActions();
    } catch (error) {
        console.error('❌ Erreur initialisation Hero Section:', error);
        heroSection.style.display = 'none';
    }
}

function updateCountdown(checkIn, checkOut) {
    try {
        const now = new Date();
        const targetDate = now < checkIn ? checkIn : checkOut;
        const isCheckOut = now >= checkIn;
        
        const diff = targetDate - now;
        
        if (diff <= 0 || isNaN(diff)) {
            document.getElementById('heroSection').style.display = 'none';
            return;
        }
        
        // Calculer les jours, heures, minutes
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        
        // Mettre à jour l'affichage avec protection
        const daysEl = document.getElementById('daysCount');
        const hoursEl = document.getElementById('hoursCount');
        const minutesEl = document.getElementById('minutesCount');
        
        if (daysEl) daysEl.textContent = days.toString().padStart(2, '0');
        if (hoursEl) hoursEl.textContent = hours.toString().padStart(2, '0');
        if (minutesEl) minutesEl.textContent = minutes.toString().padStart(2, '0');
        
        // Changer le label selon le statut
        const countdownLabel = document.querySelector('.countdown-label');
        const heroSection = document.getElementById('heroSection');
        
        if (countdownLabel && heroSection) {
            if (isCheckOut) {
                countdownLabel.textContent = currentLanguage === 'fr' 
                    ? 'Fin de votre séjour dans' 
                    : 'Your stay ends in';
                heroSection.classList.add('during-stay');
            } else {
                countdownLabel.textContent = currentLanguage === 'fr' 
                    ? 'Votre séjour commence dans' 
                    : 'Your stay starts in';
                heroSection.classList.remove('during-stay');
            }
        }
    } catch (error) {
        console.error('❌ Erreur updateCountdown:', error);
    }
}

function initQuickActions() {
    const quickActionBtns = document.querySelectorAll('.quick-action-btn');
    
    quickActionBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const action = btn.getAttribute('data-action');
            
            switch(action) {
                case 'code':
                    // Scroll vers le code d'entrée
                    document.getElementById('codeEntree').scrollIntoView({ behavior: 'smooth', block: 'center' });
                    // Effet de highlight
                    const codeDisplay = document.querySelector('.code-display');
                    codeDisplay.style.animation = 'none';
                    setTimeout(() => {
                        codeDisplay.style.animation = 'pulse 0.5s ease-in-out 2';
                    }, 10);
                    break;
                    
                case 'wifi':
                    // Scroll vers la section WiFi
                    document.getElementById('wifiSSID').scrollIntoView({ behavior: 'smooth', block: 'center' });
                    break;
                    
                case 'activites':
                    // Changer d'onglet vers Activités
                    const activitesTab = document.querySelector('[data-tab="activites"]');
                    if (activitesTab) activitesTab.click();
                    break;
                    
                case 'contact':
                    // Scroll vers les contacts d'urgence dans l'onglet Pendant
                    const pendantTab = document.querySelector('[data-tab="pendant"]');
                    if (pendantTab) {
                        pendantTab.click();
                        setTimeout(() => {
                            const contactSection = document.getElementById('contactsUrgenceContainer');
                            if (contactSection) {
                                contactSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            }
                        }, 300);
                    }
                    break;
            }
        });
    });
}

// ✨ NOUVEAU : Initialisation Timeline Séjour
async function initTimelineSection() {
    const timelineSection = document.getElementById('timelineSection');
    if (!timelineSection || !reservationData || !giteInfo) {
        if (timelineSection) timelineSection.style.display = 'none';
        return;
    }
    
    const now = new Date();
    const checkIn = new Date(reservationData.check_in);
    const checkOut = new Date(reservationData.check_out);
    
    // Masquer si séjour terminé
    if (now > checkOut.setDate(checkOut.getDate() + 7)) {
        timelineSection.style.display = 'none';
        return;
    }
    
    timelineSection.style.display = 'block';
    
    // Déterminer la phase active
    const timelineAvant = document.getElementById('timelineAvant');
    const timelinePendant = document.getElementById('timelinePendant');
    const timelineApres = document.getElementById('timelineApres');
    
    if (now < checkIn) {
        // Avant arrivée
        timelineAvant.classList.add('active');
        timelinePendant.classList.remove('active');
        timelineApres.classList.remove('active');
    } else if (now >= checkIn && now <= checkOut) {
        // Pendant séjour
        timelineAvant.classList.remove('active');
        timelinePendant.classList.add('active');
        timelineApres.classList.remove('active');
        
        // Charger météo
        await loadWeatherData();
    } else {
        // Après départ (dans les 7 jours)
        timelineAvant.classList.remove('active');
        timelinePendant.classList.remove('active');
        timelineApres.classList.add('active');
    }
    
    // Afficher les dates
    const formatDate = (date) => {
        return date.toLocaleDateString(currentLanguage === 'fr' ? 'fr-FR' : 'en-GB', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };
    
    document.getElementById('timelineAvantDate').textContent = formatDate(new Date(reservationData.check_in));
    document.getElementById('timelinePendantDate').textContent = 
        `${formatDate(new Date(reservationData.check_in))} - ${formatDate(new Date(reservationData.check_out))}`;
    document.getElementById('timelineApresDate').textContent = formatDate(new Date(reservationData.check_out));
    
    // Générer suggestions IA
    generateTimelineSuggestions();
}

// ✨ Chargement météo WeatherAPI.com (gratuit 1M appels/mois, usage commercial autorisé)
async function loadWeatherData() {
    const weatherWidget = document.getElementById('weatherWidget');
    if (!weatherWidget || !giteInfo.gps_lat || !giteInfo.gps_lon) return;
    
    try {
        const lat = giteInfo.gps_lat;
        const lon = giteInfo.gps_lon;
        const lang = currentLanguage === 'fr' ? 'fr' : 'en';
        
        // WeatherAPI.com : 5M appels/mois (trial Pro Plus → Free plan auto après 16/02/2026)
        const apiKey = '7efc12e29575437a864135709260202';
        
        const response = await fetch(
            `https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${lat},${lon}&lang=${lang}&aqi=no`
        );
        
        if (!response.ok) throw new Error('Météo indisponible');
        
        const data = await response.json();
        const current = data.current;
        
        const weatherHTML = `
            <div class="weather-header">
                <div>
                    <div class="weather-temp">${Math.round(current.temp_c)}°C</div>
                    <div class="weather-description">${current.condition.text}</div>
                </div>
                <div class="weather-icon">${getWeatherEmoji(current.condition.code, current.is_day)}</div>
            </div>
            <div class="weather-details">
                <div class="weather-detail-item">
                    <div class="weather-detail-label" data-i18n="humidity">Humidité</div>
                    <div class="weather-detail-value">${current.humidity}%</div>
                </div>
                <div class="weather-detail-item">
                    <div class="weather-detail-label" data-i18n="wind">Vent</div>
                    <div class="weather-detail-value">${Math.round(current.wind_kph)} km/h</div>
                </div>
                <div class="weather-detail-item">
                    <div class="weather-detail-label" data-i18n="updated">Mis à jour</div>
                    <div class="weather-detail-value">${new Date(current.last_updated).toLocaleTimeString(currentLanguage === 'fr' ? 'fr-FR' : 'en-GB', {hour: '2-digit', minute: '2-digit'})}</div>
                </div>
            </div>
        `;
        
        weatherWidget.innerHTML = weatherHTML;
    } catch (error) {
        console.warn('⚠️ Erreur chargement météo:', error);
        weatherWidget.innerHTML = `
            <div style="text-align: center; color: rgba(255,255,255,0.8); padding: 1rem;">
                <i data-lucide="cloud-off"></i>
                <p style="margin: 0.5rem 0 0 0; font-size: 0.9rem;" data-i18n="weather_unavailable">Météo non disponible</p>
            </div>
        `;
        lucide.createIcons();
    }
}

// Helper : Emoji météo WeatherAPI.com (codes conditions)
function getWeatherEmoji(code, isDay) {
    // Codes WeatherAPI.com : https://www.weatherapi.com/docs/weather_conditions.json
    const weatherMap = {
        1000: isDay ? '☀️' : '🌙', // Clear
        1003: '⛅', // Partly cloudy
        1006: '☁️', // Cloudy
        1009: '☁️', // Overcast
        1030: '🌫️', // Mist
        1063: '🌦️', // Patchy rain possible
        1066: '🌨️', // Patchy snow possible
        1069: '🌨️', // Patchy sleet possible
        1072: '🌧️', // Patchy freezing drizzle
        1087: '⛈️', // Thundery outbreaks
        1114: '🌨️', // Blowing snow
        1117: '🌨️', // Blizzard
        1135: '🌫️', // Fog
        1147: '🌫️', // Freezing fog
        1150: '🌦️', // Patchy light drizzle
        1153: '🌧️', // Light drizzle
        1168: '🌧️', // Freezing drizzle
        1171: '🌧️', // Heavy freezing drizzle
        1180: '🌦️', // Patchy light rain
        1183: '🌧️', // Light rain
        1186: '🌧️', // Moderate rain at times
        1189: '🌧️', // Moderate rain
        1192: '⛈️', // Heavy rain at times
        1195: '⛈️', // Heavy rain
        1198: '🌧️', // Light freezing rain
        1201: '🌧️', // Moderate or heavy freezing rain
        1204: '🌨️', // Light sleet
        1207: '🌨️', // Moderate or heavy sleet
        1210: '🌨️', // Patchy light snow
        1213: '❄️', // Light snow
        1216: '❄️', // Patchy moderate snow
        1219: '❄️', // Moderate snow
        1222: '❄️', // Patchy heavy snow
        1225: '❄️', // Heavy snow
        1237: '🧊', // Ice pellets
        1240: '🌦️', // Light rain shower
        1243: '⛈️', // Moderate or heavy rain shower
        1246: '⛈️', // Torrential rain shower
        1249: '🌨️', // Light sleet showers
        1252: '🌨️', // Moderate or heavy sleet showers
        1255: '🌨️', // Light snow showers
        1258: '❄️', // Moderate or heavy snow showers
        1261: '🧊', // Light showers of ice pellets
        1264: '🧊', // Moderate or heavy showers of ice pellets
        1273: '⛈️', // Patchy light rain with thunder
        1276: '⛈️', // Moderate or heavy rain with thunder
        1279: '⛈️', // Patchy light snow with thunder
        1282: '⛈️'  // Moderate or heavy snow with thunder
    };
    
    return weatherMap[code] || '🌤️';
}

// ✨ Suggestions IA par phase
function generateTimelineSuggestions() {
    const suggestions = {
        fr: {
            avant: [
                { icon: 'check-circle', text: 'Vérifiez votre email pour toutes les infos d\'accès' },
                { icon: 'map-pin', text: 'Planifiez votre itinéraire (GPS disponible dans l\'onglet Entrée)' },
                { icon: 'shopping-cart', text: 'Faites vos courses à l\'avance si vous arrivez tard' },
                { icon: 'phone', text: 'Enregistrez le numéro du propriétaire' }
            ],
            pendant: [
                { icon: 'map', text: 'Découvrez les activités locales dans l\'onglet Activités' },
                { icon: 'wifi', text: 'Code WiFi disponible dans l\'onglet Entrée' },
                { icon: 'message-circle', text: 'Besoin d\'aide ? Onglet Demandes pour nous contacter' },
                { icon: 'star', text: 'Un problème ? Parlez-nous AVANT de laisser un avis' }
            ],
            apres: [
                { icon: 'heart', text: 'Merci pour votre séjour ! On espère vous revoir' },
                { icon: 'star', text: 'Laissez-nous un avis dans l\'onglet Évaluation' },
                { icon: 'share-2', text: 'Recommandez-nous à vos proches' },
                { icon: 'calendar', text: 'Réservez à nouveau pour bénéficier d\'avantages' }
            ]
        },
        en: {
            avant: [
                { icon: 'check-circle', text: 'Check your email for all access information' },
                { icon: 'map-pin', text: 'Plan your route (GPS available in Check-in tab)' },
                { icon: 'shopping-cart', text: 'Buy groceries in advance if arriving late' },
                { icon: 'phone', text: 'Save the owner\'s contact number' }
            ],
            pendant: [
                { icon: 'map', text: 'Discover local activities in the Activities tab' },
                { icon: 'wifi', text: 'WiFi code available in Check-in tab' },
                { icon: 'message-circle', text: 'Need help? Use the Requests tab to contact us' },
                { icon: 'star', text: 'Any issues? Talk to us BEFORE leaving a review' }
            ],
            apres: [
                { icon: 'heart', text: 'Thanks for your stay! Hope to see you again' },
                { icon: 'star', text: 'Leave us a review in the Evaluation tab' },
                { icon: 'share-2', text: 'Recommend us to your friends' },
                { icon: 'calendar', text: 'Book again to enjoy special benefits' }
            ]
        }
    };
    
    const lang = currentLanguage;
    
    // Avant arrivée
    const avantHTML = suggestions[lang].avant.map(s => `
        <div class="timeline-suggestion-item">
            <i data-lucide="${s.icon}"></i>
            <span>${s.text}</span>
        </div>
    `).join('');
    
    // Pendant séjour
    const pendantHTML = suggestions[lang].pendant.map(s => `
        <div class="timeline-suggestion-item">
            <i data-lucide="${s.icon}"></i>
            <span>${s.text}</span>
        </div>
    `).join('');
    
    // Après départ
    const apresHTML = suggestions[lang].apres.map(s => `
        <div class="timeline-suggestion-item">
            <i data-lucide="${s.icon}"></i>
            <span>${s.text}</span>
        </div>
    `).join('');
    
    document.getElementById('timelineAvantSuggestions').innerHTML = avantHTML;
    document.getElementById('timelinePendantSuggestions').innerHTML = pendantHTML;
    document.getElementById('timelineApresSuggestions').innerHTML = apresHTML;
    
    lucide.createIcons();
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
    // // console.log('🕒 Heure arrivée brute:', heureArrivee, 'Standard:', giteInfo.heure_arrivee_standard, 'Validée:', giteInfo.heure_arrivee_validee, 'Lang:', currentLanguage);
    
    // ✅ PRIORITÉ: Heure validée > Heure configurée > Heure standard
    const heureArriveeEffective = giteInfo.heure_arrivee_validee || heureArrivee || giteInfo.heure_arrivee_standard || '17:00';
    const heureArriveeFormatted = formatTime(heureArriveeEffective);
    // // console.log('🕒 Heure arrivée formatée:', heureArriveeFormatted);
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
        // // console.warn('⚠️ heureArriveeDemandee select not found');
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
            ? 'Horaire d\'arrivée validé par le gestionnaire' 
            : 'Arrival time validated by manager';
    }
    // Sinon, messages selon le ménage
    else if (cleaningScheduleAvant && cleaningScheduleAvant.time_of_day === 'afternoon') {
        explicationArrivee = currentLanguage === 'fr' 
            ? 'Ménage prévu l\'après-midi de votre arrivée' 
            : 'Cleaning scheduled on your arrival afternoon';
    } else if (cleaningScheduleAvant && cleaningScheduleAvant.time_of_day === 'morning') {
        explicationArrivee = currentLanguage === 'fr' 
            ? 'Ménage effectué le matin, logement prêt dès 13h' 
            : 'Morning cleaning, accommodation ready from 1pm';
    } else {
        explicationArrivee = currentLanguage === 'fr' 
            ? 'Pas de ménage prévu ce jour, arrivée flexible' 
            : 'No cleaning scheduled, flexible arrival';
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
                ${currentLanguage === 'fr' ? 'Scannez pour vous connecter' : 'Scan to connect'}
            </p>
            <img src="${qrCodeUrl}" alt="QR Code WiFi" style="max-width: 200px; display: block; margin: 0 auto; background: var(--card); padding: 10px; border-radius: 8px;" onerror="this.parentElement.style.display='none'">
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
            <strong style="display: block; margin-bottom: 0.5rem;"><i data-lucide="file-text" style="width: 16px; height: 16px; vertical-align: middle; margin-right: 0.5rem;"></i>Instructions :</strong>
            <p style="white-space: pre-line; color: var(--gray-700); line-height: 1.5;">${chauffageInfo.instructions}</p>
        </div>`;
    }
    
    const chauffageSection = document.getElementById('chauffageSection');
    if (chauffageHTML) {
        document.getElementById('chauffageInfo').innerHTML = chauffageHTML;
        chauffageSection.style.display = 'block';
        if (typeof lucide !== 'undefined') lucide.createIcons();
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
            <strong>Four :</strong> ${cuisineInfo.four}
        </div>`;
    }
    if (cuisineInfo.plaques) {
        cuisineHTML += `<div style="background: var(--gray-100); padding: 0.75rem; border-radius: 0.5rem; margin-bottom: 0.5rem;">
            <strong>Plaques :</strong> ${cuisineInfo.plaques}
        </div>`;
    }
    if (cuisineInfo.laveVaisselle) {
        cuisineHTML += `<div style="background: var(--gray-100); padding: 0.75rem; border-radius: 0.5rem; margin-bottom: 0.5rem;">
            <strong>Lave-vaisselle :</strong> ${cuisineInfo.laveVaisselle}
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
        if (typeof lucide !== 'undefined') lucide.createIcons();
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
            `${giteInfo.tabac ? 'Tabac : ' + giteInfo.tabac + '\n\n' : ''}${giteInfo.animaux ? 'Animaux : ' + giteInfo.animaux + '\n\n' : ''}${giteInfo.nb_max_personnes ? 'Nombre maximum de personnes : ' + giteInfo.nb_max_personnes + '\n\n' : ''}${giteInfo.caution ? 'Caution : ' + giteInfo.caution : ''}` 
            : giteInfo.reglement_interieur_fr)
        : (giteInfo.tabac_en || giteInfo.animaux_en || giteInfo.nb_max_personnes_en || giteInfo.caution_en ? 
            `${giteInfo.tabac_en ? 'Smoking : ' + giteInfo.tabac_en + '\n\n' : ''}${giteInfo.animaux_en ? 'Pets : ' + giteInfo.animaux_en + '\n\n' : ''}${giteInfo.nb_max_personnes_en ? 'Maximum occupancy : ' + giteInfo.nb_max_personnes_en + '\n\n' : ''}${giteInfo.caution_en ? 'Deposit : ' + giteInfo.caution_en : ''}` 
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
                    <div style="font-weight: 600;"><i data-lucide="phone" style="width: 16px; height: 16px; vertical-align: middle; margin-right: 0.5rem;"></i>Propriétaire</div>
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
                <strong style="color: var(--danger);"><i data-lucide="alert-triangle" style="width: 16px; height: 16px; vertical-align: middle; margin-right: 0.5rem;"></i>En cas d'urgence :</strong>
                <p style="margin-top: 0.5rem; white-space: pre-line; line-height: 1.5; color: var(--gray-700);">${consignesUrgence}</p>
            </div>`;
    }
    
    if (contactsHTML) {
        document.getElementById('contactsUrgenceContainer').innerHTML = contactsHTML;
        if (typeof lucide !== 'undefined') lucide.createIcons();
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
    const isDimanche = new Date(reservationData.check_out).getDay() === 0;
    
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
            ? 'Horaire de départ validé par le gestionnaire' 
            : 'Departure time validated by manager';
    }
    // Sinon, messages selon le ménage
    else if (cleaningScheduleApres && cleaningScheduleApres.time_of_day === 'afternoon') {
        explicationDepart = currentLanguage === 'fr' 
            ? 'Ménage prévu l\'après-midi après votre départ' 
            : 'Cleaning scheduled in the afternoon after your departure';
    } else if (cleaningScheduleApres && cleaningScheduleApres.time_of_day === 'morning') {
        explicationDepart = currentLanguage === 'fr' 
            ? 'Ménage prévu le matin de votre départ' 
            : 'Cleaning scheduled in the morning of your departure';
    } else if (isDimanche) {
        explicationDepart = currentLanguage === 'fr' 
            ? 'Pas de ménage le dimanche après-midi, départ flexible jusqu\'à 17h' 
            : 'No Sunday afternoon cleaning, flexible departure until 5pm';
    } else {
        explicationDepart = currentLanguage === 'fr' 
            ? 'Pas de ménage prévu l\'après-midi, départ flexible jusqu\'à 12h' 
            : 'No afternoon cleaning scheduled, flexible departure until 12pm';
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
            <strong><i data-lucide="key" style="width: 16px; height: 16px; vertical-align: middle; margin-right: 0.5rem;"></i>Restitution des clés :</strong>
            <p style="margin-top: 0.5rem; white-space: pre-line; line-height: 1.5;">${restitutionCles}</p>
        </div>`;
    }
    
    if (instructionsHTML) {
        document.getElementById('instructionsSortie').innerHTML = instructionsHTML;
        if (typeof lucide !== 'undefined') lucide.createIcons();
    } else {
        document.getElementById('instructionsSortie').textContent = '';
    }
    
    // Checklists chargées via loadClientChecklists()
}

// ==================== ACTIVITÉS ====================

function initOngletActivites() {
    if (!reservationData || !giteInfo) {
        document.getElementById('listeActivites').innerHTML = '<p style="padding: 2rem; text-align: center; color: var(--gray-600);">⏳ Chargement...</p>';
        return;
    }
    
    loadActivitesForClient();
}

function initOngletFaq() {
    if (!reservationData) {
        document.getElementById('faqListe').innerHTML = '<p style="padding: 2rem; text-align: center; color: var(--gray-600);">⏳ Chargement...</p>';
        return;
    }
    loadFaqData();
}

async function loadActivitesForClient() {
    try {
        if (!reservationData || !reservationData.gite_id) {
            document.getElementById('listeActivites').innerHTML = '<p style="padding: 2rem; text-align: center; color: var(--gray-600);">⏳ Chargement...</p>';
            return;
        }
        
        // Utiliser gite_id au lieu du nom du gîte
        const { data: activites, error } = await supabase
            .from('activites_gites')
            .select('*')
            .eq('gite_id', reservationData.gite_id)
            .eq('is_active', true)
            .order('distance_km');
        
        if (error) {
            console.error('Erreur chargement activités:', error);
            document.getElementById('listeActivites').innerHTML = '<p style="padding: 2rem; text-align: center; color: var(--danger);">⚠️ Erreur lors du chargement des activités</p>';
            return;
        }
        
        const giteLat = parseFloat(giteInfo?.gps_lat || giteInfo?.latitude);
        const giteLon = parseFloat(giteInfo?.gps_lon || giteInfo?.longitude);
        
        if (!giteLat || !giteLon || isNaN(giteLat) || isNaN(giteLon)) {
            document.getElementById('mapActivites').innerHTML = '<p style="padding: 2rem; text-align: center; color: var(--gray-600);">⚠️ Coordonnées du gîte non disponibles</p>';
            document.getElementById('listeActivites').innerHTML = '<p style="padding: 2rem; text-align: center; color: var(--gray-600);">⚠️ Coordonnées du gîte non disponibles</p>';
            return;
        }
        
        if (!activites || activites.length === 0) {
            document.getElementById('mapActivites').innerHTML = '<p style="padding: 2rem; text-align: center; color: var(--gray-600);">ℹ️ Aucune activité configurée pour ce gîte</p>';
            document.getElementById('listeActivites').innerHTML = '<p style="padding: 2rem; text-align: center; color: var(--gray-600);">ℹ️ Aucune activité configurée pour ce gîte</p>';
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
                <strong style="color: #ef4444;"><i data-lucide="home" style="width: 16px; height: 16px; vertical-align: middle; margin-right: 0.5rem;"></i>Votre gîte</strong><br>
                <a href="https://www.google.com/maps/search/?api=1&query=${giteLat},${giteLon}" 
                   target="_blank" 
                   style="color: var(--primary); font-size: 0.875rem;">
                    <i data-lucide="map-pin" style="width: 14px; height: 14px; vertical-align: middle; margin-right: 0.25rem;"></i>Voir sur Google Maps
                </a>
            </div>
        `;
        
        // Initialiser les icônes Lucide dans la carte
        if (typeof lucide !== 'undefined') lucide.createIcons();
        
        // Liste interactive des activités
        displayActivitesListInteractive(activites, giteLat, giteLon);
    } catch (error) {
        console.error('❌ Erreur critique dans loadActivitesForClient:', error);
        document.getElementById('listeActivites').innerHTML = '<p style="padding: 2rem; text-align: center; color: var(--danger);">⚠️ Erreur lors du chargement des activités</p>';
    }
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
                                <i data-lucide="ruler" style="width: 14px; height: 14px;"></i> ${activite.distance_km.toFixed(1)} km
                            </span>
                        ` : ''}
                        ${activite.phone ? `
                            <span style="display: flex; align-items: center; gap: 0.25rem;">
                                <i data-lucide="phone" style="width: 14px; height: 14px;"></i> ${activite.phone}
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
                            <i data-lucide="map-pin" style="width: 14px; height: 14px;"></i> ${activite.adresse}
                        </p>
                    ` : ''}
                    <div style="display: flex; gap: 0.75rem; flex-wrap: wrap;">
                        ${hasCoords ? `
                            <a href="https://www.google.com/maps/dir/?api=1&destination=${activite.latitude},${activite.longitude}" 
                               target="_blank" class="btn btn-primary"
                               onclick="trackActiviteConsultation(${activite.id}, 'click_maps')"
                               style="text-decoration: none; display: flex; align-items: center; gap: 0.5rem;">
                                <i data-lucide="map" style="width: 16px; height: 16px;"></i> Itinéraire
                            </a>
                        ` : ''}
                        ${activite.website ? `
                            <a href="${activite.website}" target="_blank" class="btn btn-outline"
                               onclick="trackActiviteConsultation(${activite.id}, 'click_website')"
                               style="text-decoration: none; display: flex; align-items: center; gap: 0.5rem;">
                                <i data-lucide="globe" style="width: 16px; height: 16px;"></i> Site web
                            </a>
                        ` : ''}
                        ${activite.phone ? `
                            <a href="tel:${activite.phone}" class="btn btn-outline"
                               onclick="trackActiviteConsultation(${activite.id}, 'click_phone')"
                               style="text-decoration: none; display: flex; align-items: center; gap: 0.5rem;">
                                <i data-lucide="phone" style="width: 16px; height: 16px;"></i> Appeler
                            </a>
                        ` : ''}
                    </div>
                </div>
            </div>
        </div>
    `}).join('');
    
    // Initialiser les icônes Lucide après injection du HTML
    if (typeof lucide !== 'undefined') lucide.createIcons();
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
            // Rafraîchir les checklists avec la nouvelle langue
            reloadClientChecklists();
            // Rafraîchir la FAQ si elle est chargée
            if (cachedFaqs.length > 0) {
                reloadFaqData();
            }
        });
    });
    
    // Navigation tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.dataset.tab;
            switchTab(tabId);
        });
    });
    
    // ✨ NOUVEAU : Bottom navigation (mobile)
    document.querySelectorAll('.bottom-nav-item').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
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
    document.querySelectorAll('.bottom-nav-item').forEach(btn => btn.classList.remove('active')); // ✨ NOUVEAU
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
        content.style.display = 'none';
    });
    
    // Activer l'onglet sélectionné (desktop)
    const button = document.querySelector(`.tab-btn[data-tab="${tabId}"]`);
    const content = document.getElementById(`tab-${tabId}`);
    
    if (button) {
        button.classList.add('active');
    }
    
    // ✨ NOUVEAU : Activer l'onglet sélectionné (mobile)
    const mobileButton = document.querySelector(`.bottom-nav-item[data-tab="${tabId}"]`);
    if (mobileButton) {
        mobileButton.classList.add('active');
    }
    
    if (content) {
        content.classList.add('active');
        content.style.display = 'block';
        // Scroll manuel pour éviter que le contenu soit caché sous le header
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }
    
    // Charger les activités
    if (tabId === 'activites') {
        initOngletActivites();
    }
    
    // Charger la FAQ
    if (tabId === 'faq') {
        initOngletFaq();
    }
}

async function submitDemandeHoraire(type) {
    // ✅ Feature réactivée - Table demandes_horaires restaurée - 28/01/2026
    
    const heureDemandee = type === 'arrivee_anticipee' 
        ? document.getElementById('heureArriveeDemandee').value
        : document.getElementById('heureDepartDemandee').value;
    
    const motif = type === 'arrivee_anticipee'
        ? document.getElementById('motifArrivee')?.value || ''
        : document.getElementById('motifDepart')?.value || '';
    
    // Convertir pour correspondre à la structure BDD existante
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
                // // console.warn('⚠️ La table demandes_horaires n\'existe pas encore. Exécutez sql/migrate_demandes_horaires.sql dans Supabase.');
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
                    motif: motif || null,
                    updated_at: new Date().toISOString()
                })
                .eq('id', existingDemandes[0].id);
            
            if (error) throw error;
            // // console.log('✅ Demande mise à jour:', data);
            showToast('✅ Demande mise à jour avec succès !');
        } 
        // 3. Sinon, créer une nouvelle demande
        else {
            // Récupérer l'owner_user_id depuis la session
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                showToast('❌ Erreur d\'authentification');
                return;
            }
            
            const { data, error } = await supabase
                .from('demandes_horaires')
                .insert({
                    owner_user_id: user.id,
                    reservation_id: reservationData.id,
                    type: typeDb,
                    heure_demandee: heureDemandee,
                    motif: motif || null,
                    statut: 'en_attente'
                });
            
            if (error) throw error;
            // // console.log('✅ Demande créée:', data);
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
        
        // ✅ Table demandes_horaires restaurée le 28/01/2026
        // Gérer uniquement les vraies erreurs techniques
        if (error?.code === '42P01' || error?.code === 'PGRST204') {
            console.error('❌ Table demandes_horaires manquante - Contacter admin');
            showToast('❌ Erreur technique. Contactez le gestionnaire.', 'error');
        } else {
            showToast('❌ Erreur lors de l\'envoi de votre demande.', 'error');
        }
    }
}

function calculateAutoApproval(type, heureDemandee) {
    const [hours, minutes] = heureDemandee.split(':').map(Number);
    const requestedMinutes = hours * 60 + minutes;
    
    // // console.log('🔍 Calculate auto-approval:', {type, heureDemandee, requestedMinutes, cleaningSchedule});
    
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
        
        const isDimanche = new Date(reservationData.check_out).getDay() === 0;
        
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
    if (!container || !reservationData?.gite_id) return;
    
    // Charger depuis la table activites_gites avec categorie 'Événement'
    const { data: evenements, error } = await supabase
        .from('activites_gites')
        .select('*')
        .eq('gite_id', reservationData.gite_id)
        .eq('categorie', 'Événement')
        .eq('is_active', true)
        .order('nom'); // Tri par nom car date_debut n'existe pas
    
    if (error) {
        // Si table inexistante ou colonne manquante, masquer silencieusement
        if (error?.code === '42P01' || error?.message?.includes('does not exist') || error?.code === 'PGRST204' || error?.code === '42703') {
            container.style.display = 'none';
            return;
        }
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

// Partage de page avec options multiples
async function sharePageLink() {
    const url = window.location.href;
    const titre = `Fiche Client - ${reservationData.gite}`;
    const message = `Toutes les infos pour votre séjour : ${url}`;
    
    // Créer un menu de choix
    const shareOptions = document.createElement('div');
    shareOptions.style.cssText = `
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        background: var(--card);
        border-radius: 20px 20px 0 0;
        box-shadow: 0 -4px 20px rgba(0,0,0,0.15);
        padding: 20px;
        z-index: 10000;
        animation: slideUp 0.3s ease-out;
    `;
    
    shareOptions.innerHTML = `
        <style>
            @keyframes slideUp {
                from { transform: translateY(100%); }
                to { transform: translateY(0); }
            }
            .share-option {
                display: flex;
                align-items: center;
                gap: 15px;
                padding: 15px;
                margin: 10px 0;
                border-radius: 12px;
                cursor: pointer;
                transition: background 0.2s;
                font-size: 16px;
            }
            .share-option:hover {
                background: #f0f0f0;
            }
            .share-icon {
                width: 40px;
                height: 40px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                font-size: 24px;
            }
            .share-close {
                position: absolute;
                top: 15px;
                right: 15px;
                font-size: 28px;
                cursor: pointer;
                color: var(--text-secondary);
            }
        </style>
        <span class="share-close" onclick="this.parentElement.remove()">×</span>
        <h3 style="margin: 0 0 15px 0; font-size: 18px; color: var(--text);">Partager la fiche</h3>
        
        <div class="share-option" data-method="whatsapp">
            <div class="share-icon" style="background: #25D366; color: white;">📱</div>
            <div>
                <div style="font-weight: 600;">WhatsApp</div>
                <div style="font-size: 14px; color: var(--text-secondary);">Envoyer via WhatsApp</div>
            </div>
        </div>
        
        <div class="share-option" data-method="email">
            <div class="share-icon" style="background: #3498db; color: white;">✉️</div>
            <div>
                <div style="font-weight: 600;">Email</div>
                <div style="font-size: 14px; color: var(--text-secondary);">Envoyer par email</div>
            </div>
        </div>
        
        <div class="share-option" data-method="copy">
            <div class="share-icon" style="background: #95a5a6; color: white;">🔗</div>
            <div>
                <div style="font-weight: 600;">Copier le lien</div>
                <div style="font-size: 14px; color: var(--text-secondary);">Copier dans le presse-papier</div>
            </div>
        </div>
        
        <div class="share-option" data-method="native" style="display: none;">
            <div class="share-icon" style="background: #8e44ad; color: white;">📤</div>
            <div>
                <div style="font-weight: 600;">Autres options</div>
                <div style="font-size: 14px; color: var(--text-secondary);">Partager avec d'autres apps</div>
            </div>
        </div>
    `;
    
    // Afficher l'option native si disponible
    if (navigator.share) {
        shareOptions.querySelector('[data-method="native"]').style.display = 'flex';
    }
    
    document.body.appendChild(shareOptions);
    
    // Gérer les clics sur les options
    shareOptions.addEventListener('click', async (e) => {
        const option = e.target.closest('.share-option');
        if (!option) return;
        
        const method = option.getAttribute('data-method');
        shareOptions.remove();
        
        switch(method) {
            case 'whatsapp':
                // Ouvrir WhatsApp
                const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
                window.open(whatsappUrl, '_blank');
                showToast('✓ Ouverture de WhatsApp...', 'success');
                break;
                
            case 'email':
                // Ouvrir client email
                const emailSubject = encodeURIComponent(titre);
                const emailBody = encodeURIComponent(`Bonjour,\n\nVoici votre fiche client avec toutes les informations pour votre séjour :\n\n${url}\n\nBon séjour !`);
                window.location.href = `mailto:?subject=${emailSubject}&body=${emailBody}`;
                showToast('✓ Ouverture du client email...', 'success');
                break;
                
            case 'copy':
                // Copier dans le presse-papier
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
                break;
                
            case 'native':
                // Utiliser Web Share API
                try {
                    await navigator.share({
                        title: titre,
                        text: 'Toutes les infos pour votre séjour',
                        url: url
                    });
                    showToast('✓ Lien partagé', 'success');
                } catch (error) {
                    // Utilisateur a annulé
                }
                break;
        }
    });
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
let cachedFaqs = []; // Cache pour rafraîchissement lors changement langue

async function loadFaqData() {
    if (!reservationData || !reservationData.gite_id) {
        document.getElementById('faqListe').innerHTML = '<p style="padding: 2rem; text-align: center; color: var(--gray-600);">⏳ Données de réservation non disponibles</p>';
        return;
    }
    
    // FAQ peut être liée par gite_id ou avec une valeur NULL pour "tous les gîtes"
    const { data: faqs, error } = await supabase
        .from('faq')
        .select('*')
        .or(`gite_id.eq.${reservationData.gite_id},gite_id.is.null`)
        .order('ordre', { ascending: true });
    
    if (error) {
        console.error('Erreur chargement FAQs:', error);
        document.getElementById('faqListe').innerHTML = '<p style="padding: 2rem; text-align: center; color: var(--gray-600);">⚠️ Erreur de chargement</p>';
        return;
    }
    
    allFaqs = faqs || [];
    cachedFaqs = faqs || []; // Stocker en cache
    
    if (allFaqs.length === 0) {
        document.getElementById('faqListe').innerHTML = '<p style="padding: 2rem; text-align: center; color: var(--gray-600);">📋 Aucune FAQ disponible</p>';
        return;
    }
    
    // Créer les boutons de catégories
    renderFaqCategories();
    
    // Afficher toutes les FAQs
    displayFaqs(allFaqs);
    
    // Écouter la recherche
    const searchInput = document.getElementById('faqSearch');
    if (searchInput) {
        // Supprimer ancien listener si existant
        searchInput.removeEventListener('input', handleFaqSearch);
        searchInput.addEventListener('input', handleFaqSearch);
    }
}

function handleFaqSearch(e) {
    const searchTerm = e.target.value.toLowerCase();
    if (searchTerm) {
        const filtered = allFaqs.filter(faq => {
            const question = currentLanguage === 'fr' ? faq.question : (faq.question_en || faq.question);
            const answer = currentLanguage === 'fr' ? (faq.answer || faq.reponse) : (faq.answer_en || faq.answer || faq.reponse);
            return question.toLowerCase().includes(searchTerm) ||
                   answer.toLowerCase().includes(searchTerm);
        });
        displayFaqs(filtered);
    } else {
        filterByCategory(currentFaqCategory);
    }
}

// Fonction pour rafraîchir l'affichage sans recharger depuis la base
function reloadFaqData() {
    if (cachedFaqs.length > 0) {
        allFaqs = cachedFaqs;
        renderFaqCategories();
        filterByCategory(currentFaqCategory);
    }
}

function renderFaqCategories() {
    const categories = [
        { key: 'tous', label: '<i data-lucide="home"></i> Tout', labelEn: '<i data-lucide="home"></i> All' },
        { key: 'arrivee', label: '<i data-lucide="key"></i> Arrivée', labelEn: '<i data-lucide="key"></i> Arrival' },
        { key: 'depart', label: '<i data-lucide="log-out"></i> Départ', labelEn: '<i data-lucide="log-out"></i> Departure' },
        { key: 'equipements', label: '<i data-lucide="home"></i> Équipements', labelEn: '<i data-lucide="home"></i> Equipment' },
        { key: 'localisation', label: '<i data-lucide="map-pin"></i> Localisation', labelEn: '<i data-lucide="map-pin"></i> Location' },
        { key: 'tarifs', label: '<i data-lucide="dollar-sign"></i> Tarifs', labelEn: '<i data-lucide="dollar-sign"></i> Pricing' },
        { key: 'reglement', label: '<i data-lucide="clipboard"></i> Règlement', labelEn: '<i data-lucide="clipboard"></i> Rules' },
        { key: 'autre', label: '<i data-lucide="help-circle"></i> Autre', labelEn: '<i data-lucide="help-circle"></i> Other' }
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
    
    // Initialiser les icônes Lucide
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
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
        const noResultText = currentLanguage === 'fr' 
            ? '🔍 Aucun résultat trouvé'
            : '🔍 No results found';
        container.innerHTML = `<p style="padding: 2rem; text-align: center; color: var(--gray-600);">${noResultText}</p>`;
        return;
    }
    
    container.innerHTML = faqs.map((faq, index) => {
        // Traduction à la volée selon langue active
        const question = currentLanguage === 'fr' 
            ? faq.question 
            : (faq.question_en || faq.question);
        const answer = currentLanguage === 'fr' 
            ? (faq.answer || faq.reponse) 
            : (faq.answer_en || faq.answer || faq.reponse);
        
        return `
            <div class="faq-item" id="faq-${index}">
                <div class="faq-question" onclick="toggleFaq(${index})">
                    <span>${question}</span>
                    <span class="faq-toggle">▼</span>
                </div>
                <div class="faq-reponse">
                    ${answer}
                </div>
            </div>
        `;
    }).join('');
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
window.filterByCategory = filterByCategory;
window.submitRetourDemande = submitRetourDemande;
window.submitEvaluation = submitEvaluation;

// =============================================
// GESTION DES CHECKLISTS CLIENT
// =============================================

// Variables globales pour stocker les templates et progression (cache)
let cachedTemplatesEntree = [];
let cachedTemplatesSortie = [];
let cachedProgressMap = {};

async function loadClientChecklists() {
    if (!reservationData || !giteInfo) {
        return;
    }
    
    // Vérifier si gite_id existe dans reservationData
    if (!reservationData.gite_id) {
        console.error('❌ gite_id manquant dans reservationData');
        return;
    }
    
    try {
        
        // Charger les templates du gîte (par gite_id, pas par nom)
        const { data: templatesEntree, error: errorEntree } = await supabase
            .from('checklist_templates')
            .select('*')
            .eq('gite_id', reservationData.gite_id)
            .eq('type', 'entree')
            .eq('actif', true)
            .order('ordre', { ascending: true });
        
        const { data: templatesSortie, error: errorSortie } = await supabase
            .from('checklist_templates')
            .select('*')
            .eq('gite_id', reservationData.gite_id)
            .eq('type', 'sortie')
            .eq('actif', true)
            .order('ordre', { ascending: true });
        
        if (errorEntree || errorSortie) {
            const error = errorEntree || errorSortie;
            // Si table inexistante, ignorer silencieusement
            if (error?.code === '42P01' || error?.message?.includes('does not exist') || error?.code === 'PGRST204') {
                console.warn('⚠️ Table checklist_templates non disponible (fonctionnalité désactivée)');
                return;
            }
            console.error('❌ Erreur chargement templates:', error);
            return;
        }
        
        // Charger la progression
        const { data: progress, error: progressError } = await supabase
            .from('checklist_progress')
            .select('*')
            .eq('reservation_id', reservationData.id);
        
        if (progressError && progressError.code !== 'PGRST116') {
            console.error('❌ Erreur chargement progression:', progressError);
            // Continuer même avec erreur pour afficher les templates
        }
        
        // Map pour accès rapide
        const progressMap = {};
        if (progress) {
            progress.forEach(p => {
                progressMap[p.template_id] = p.completed;
            });
        }
        
        // Stocker en cache pour rafraîchissement lors du changement de langue
        cachedTemplatesEntree = templatesEntree || [];
        cachedTemplatesSortie = templatesSortie || [];
        cachedProgressMap = progressMap;
        
        // Afficher checklist entrée
        renderClientChecklist('entree', cachedTemplatesEntree, cachedProgressMap);
        
        // Afficher checklist sortie
        renderClientChecklist('sortie', cachedTemplatesSortie, cachedProgressMap);
    } catch (error) {
        console.error('❌ Erreur loadClientChecklists:', error);
    }
}

// Fonction pour rafraîchir l'affichage sans recharger depuis la base
function reloadClientChecklists() {
    if (cachedTemplatesEntree.length > 0 || cachedTemplatesSortie.length > 0) {
        renderClientChecklist('entree', cachedTemplatesEntree, cachedProgressMap);
        renderClientChecklist('sortie', cachedTemplatesSortie, cachedProgressMap);
    }
}

function renderClientChecklist(type, templates, progressMap) {
    const containerId = type === 'entree' ? 'checklistEntreeContainer' : 'checklistSortieContainer';
    const progressBarId = type === 'entree' ? 'progressEntree' : 'progressSortie';
    const progressTextId = type === 'entree' ? 'progressEntreeText' : 'progressSortieText';
    
    const container = document.getElementById(containerId);
    if (!container) {
        return;
    }
    
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
    
    // Générer HTML avec support multilingue
    let html = '';
    templates.forEach(template => {
        const isCompleted = progressMap[template.id] === true;
        
        // Traduction à la volée selon langue active
        const texte = currentLanguage === 'fr' 
            ? template.texte 
            : (template.texte_en || template.texte);
        const description = currentLanguage === 'fr' 
            ? template.description 
            : (template.description_en || template.description);
        
        html += `
            <div class="checkbox-item" style="margin-bottom: 0.75rem; padding: 1rem; background: ${isCompleted ? 'var(--gray-100)' : 'white'}; border: 2px solid ${isCompleted ? 'var(--success)' : 'var(--gray-200)'}; border-radius: 0.5rem; transition: all 0.3s;">
                <label style="display: flex; align-items: start; gap: 0.75rem; cursor: pointer;">
                    <input type="checkbox" ${isCompleted ? 'checked' : ''} 
                           onchange="toggleClientChecklistItem('${template.id}', '${type}')"
                           style="margin-top: 0.25rem; width: 1.25rem; height: 1.25rem; cursor: pointer;">
                    <div style="flex: 1;">
                        <div style="font-weight: ${isCompleted ? '600' : '400'}; color: ${isCompleted ? 'var(--gray-700)' : 'var(--gray-900)'}; margin-bottom: 0.25rem;">
                            ${texte}
                        </div>
                        ${description ? `<div style="font-size: 0.875rem; color: var(--gray-600);">${description}</div>` : ''}
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
                owner_user_id: reservationData.owner_user_id,
                reservation_id: reservationData.id,
                template_id: templateId,
                completed: newCompleted,
                completed_at: newCompleted ? new Date().toISOString() : null
            }, {
                onConflict: 'reservation_id,template_id'
            });
        
        if (upsertError) {
            throw upsertError;
        }
        
        // Recharger pour mettre à jour l'affichage
        await loadClientChecklists();
    } catch (error) {
        console.error('❌ Erreur toggle checklist:', error);
        alert('Erreur lors de la sauvegarde. Veuillez réessayer.');
    }
}

// ============================================================================
// GESTION DEMANDES / RETOURS / AMÉLIORATIONS
// ============================================================================

async function submitRetourDemande(event) {
    event.preventDefault();
    
    // ✅ Feature réactivée - Table problemes_signales restaurée - 28/01/2026
    
    try {
        const type = document.getElementById('typeRetourDemande').value;
        const urgenceInput = document.querySelector('input[name="urgenceDemande"]:checked');
        
        const formData = {
            reservation_id: reservationData.id, // ✅ FIX: Utiliser reservationData.id au lieu de giteInfo.reservationId
            gite: reservationData.gite,
            type: type,
            sujet: document.getElementById('sujetRetourDemande').value,
            description: document.getElementById('descriptionRetourDemande').value,
            urgence: urgenceInput ? urgenceInput.value : 'normale',
            telephone: reservationData.telephone || null, // ✅ FIX: Utiliser reservationData.telephone
            statut: 'nouveau',
            created_at: new Date().toISOString()
        };
        
        // Si c'est un problème, utiliser la table problemes_signales
        if (type === 'probleme') {
            const { data, error } = await window.ficheClientSupabase
                .from('problemes_signales')
                .insert([{
                    reservation_id: formData.reservation_id,
                    gite: formData.gite,
                    type: 'probleme',
                    sujet: formData.sujet,
                    urgence: formData.urgence === 'haute' ? 'haute' : (formData.urgence === 'basse' ? 'faible' : 'moyenne'),
                    description: formData.description,
                    telephone: formData.telephone,
                    statut: 'nouveau',
                    created_at: formData.created_at
                }])
                .select();
            
            if (error) throw error;
        } else {
            // Pour demande, retour, amelioration : aussi dans problemes_signales
            const { data, error } = await window.ficheClientSupabase
                .from('problemes_signales')
                .insert([{
                    reservation_id: formData.reservation_id,
                    gite: formData.gite,
                    type: type, // demande, retour, amelioration
                    sujet: formData.sujet,
                    urgence: formData.urgence === 'haute' ? 'haute' : (formData.urgence === 'basse' ? 'faible' : 'moyenne'),
                    description: formData.description,
                    telephone: formData.telephone,
                    statut: 'nouveau',
                    created_at: formData.created_at
                }])
                .select();
            
            if (error) throw error;
        }
        
        // Masquer le formulaire et afficher la confirmation
        document.getElementById('formRetoursDemande').style.display = 'none';
        document.getElementById('confirmationRetourDemande').style.display = 'block';
        
        // Envoyer une notification (TODO: webhook admin)
        // console.log('🔔 Notification à envoyer: ...');
        
    } catch (error) {
        console.error('❌ Erreur envoi demande:', error);
        alert('Erreur lors de l\'envoi. Veuillez réessayer.');
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
            // // console.log(`⭐ ${fieldName}: ${rating}/5`);
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
        // // console.log('📝 Envoi évaluation séjour...');
        
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
            reservation_id: reservationData.id,
            gite: reservationData.gite,
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
        
        const { data, error } = await window.ficheClientSupabase
            .from('evaluations_sejour')
            .insert([formData])
            .select();
        
        if (error) throw error;
        
        // // console.log('✅ Évaluation enregistrée:', data);
        
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
    const form = document.getElementById('formRetoursDemande');
    
    if (form) {
        form.removeEventListener('submit', submitRetourDemande);
        form.addEventListener('submit', submitRetourDemande);
    }
    
    // Gérer l'affichage du groupe urgence selon le type sélectionné
    const typeSelect = document.getElementById('typeRetourDemande');
    const urgenceGroup = document.getElementById('urgenceGroupDemande');
    
    if (typeSelect && urgenceGroup) {
        typeSelect.addEventListener('change', (e) => {
            urgenceGroup.style.display = e.target.value === 'probleme' ? 'block' : 'none';
        });
    }
    
    // Bouton pour créer une nouvelle demande après confirmation
    const btnNouvelleDemande = document.getElementById('btnNouvelleDemande');
    if (btnNouvelleDemande) {
        btnNouvelleDemande.addEventListener('click', () => {
            // Réinitialiser le formulaire
            document.getElementById('formRetoursDemande').reset();
            // Masquer la confirmation
            document.getElementById('confirmationRetourDemande').style.display = 'none';
            // Afficher le formulaire
            document.getElementById('formRetoursDemande').style.display = 'flex';
            // Masquer l'urgence par défaut
            urgenceGroup.style.display = 'none';
        });
    }
}

function initEvaluationTab() {
    initStarRating();
    
    const form = document.getElementById('formEvaluationSejour');
    
    if (form) {
        form.removeEventListener('submit', submitEvaluation);
        form.addEventListener('submit', submitEvaluation);
    }
}

// 🎨 Gestion des thèmes (Cyan entreprise / Gîtes de France)
function initThemeSwitcher() {
    const themeButtons = document.querySelectorAll('.theme-btn');
    const header = document.getElementById('mainHeader');
    const root = document.documentElement;
    const logoLiveOwner = document.getElementById('logoLiveOwner');
    const logoGites = document.getElementById('logoGitesDeFrance');
    const brandName = document.getElementById('headerBrandName');
    
    // Charger le thème depuis localStorage
    const savedTheme = localStorage.getItem('ficheClientTheme') || 'cyan';
    
    // Appliquer le thème sauvegardé au chargement
    applyTheme(savedTheme);
    
    // Fonction pour appliquer un thème
    function applyTheme(theme) {
        // Mise à jour des boutons
        themeButtons.forEach(b => {
            b.classList.remove('active');
            b.style.background = 'transparent';
            b.style.color = 'rgba(255,255,255,0.85)';
        });
        
        const activeBtn = document.querySelector(`.theme-btn[data-theme="${theme}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active');
            activeBtn.style.background = 'rgba(255,255,255,0.3)';
            activeBtn.style.color = 'white';
        }
        
        // Appliquer le thème
        if (theme === 'cyan') {
            // Thème entreprise (Cyan moderne)
            root.style.setProperty('--primary', '#06b6d4');
            root.style.setProperty('--primary-dark', '#0891b2');
            header.style.background = 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)';
            
            // Afficher logo LiveOwnerUnit
            if (logoLiveOwner) logoLiveOwner.style.display = 'block';
            if (logoGites) logoGites.style.display = 'none';
            if (brandName) brandName.textContent = 'LiveOwnerUnit';
        } else {
            // Thème Gîtes de France (Vert/Beige nature)
            root.style.setProperty('--primary', '#68a84f');
            root.style.setProperty('--primary-dark', '#527f3c');
            header.style.background = 'linear-gradient(135deg, #68a84f 0%, #8fbd73 100%)';
            
            // Afficher logo Gîtes de France
            if (logoLiveOwner) logoLiveOwner.style.display = 'none';
            if (logoGites) logoGites.style.display = 'block';
            if (brandName) brandName.textContent = 'Gîtes de France';
        }
        
        // Sauvegarder le choix
        localStorage.setItem('ficheClientTheme', theme);
    }
    
    // Écouter les changements de thème
    themeButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const theme = this.getAttribute('data-theme');
            applyTheme(theme);
        });
    });
    
    // Écouter les messages de la page Options (si ouverte dans une autre fenêtre)
    window.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'themeChange') {
            applyTheme(event.data.theme);
        }
    });
}

window.toggleFaq = toggleFaq;
