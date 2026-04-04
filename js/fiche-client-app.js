/**
 * APPLICATION FICHE CLIENT INTERACTIVE
 * Gestion de la fiche personnalisée par réservation pour les clients
 * 
 * @version 2.10.1 - 24 février 2026
 * - Correction robustesse init Supabase (createClient indisponible selon contexte de chargement)
 *   • Fallback window.supabase?.createClient || window.createClient
 *   • Réutilisation window.supabaseClient si déjà initialisé
 *   • Initialisation tokenisée déplacée dans le bloc try de DOMContentLoaded
 *
 * @version 2.10.0 - 15 février 2026
 * - Ajout export PDF de la fiche client
 *   • Bibliothèque html2pdf.js
 *   • Bouton dans le header
 *   • Génération automatique du nom de fichier
 *   • Tous les onglets inclus dans le PDF
 *   • Optimisation pour impression
 * 
 * @version 2.9.1 - 15 février 2026
 * - Suppression de l'élément giteName inutile
 * - Correction affichage nom client (visible maintenant)
 * - Simplification du header (uniquement "Bienvenue [Nom Client] !")
 * 
 * @version 2.9.0 - 15 février 2026
 * - Ajout de TOUS les champs manquants de l'onglet Infos Gîtes :
 *   • Détails WiFi supplémentaires (débit, localisation, zones)
 *   • Accès au bâtiment (étage, ascenseur, itinéraire, première visite)
 *   • Équipements linge (sèche-linge, fer à repasser, linge fourni)
 *   • Configuration des chambres
 *   • Équipements de sécurité (détecteur fumée, extincteur, coupure eau, disjoncteur)
 *   • Flexibilité arrivée tardive et départ tardif
 * - Couverture complète : 100% des champs admin affichés côté client
 */

// ==================== CONFIGURATION ====================
// Protection contre double chargement
if (!window.ficheClientAppLoaded) {
    window.ficheClientAppLoaded = true;

    const SUPABASE_URL = window.APP_CONFIG?.SUPABASE_URL || window.SUPABASE_URL || 'https://ofdbsymbwdtthnjoxhcd.supabase.co';

    const createFicheClientSupabase = (clientToken = null) => {
        const createClient = window.supabase?.createClient || window.createClient;

        if (typeof createClient !== 'function') {
            if (window.supabaseClient && typeof window.supabaseClient.from === 'function') {
                return window.supabaseClient;
            }
            throw new Error('Supabase non initialisé: createClient indisponible');
        }

        // Lire la clé dynamiquement (peut avoir été injectée après fetch /api/public-config)
        const key = window.APP_CONFIG?.SUPABASE_KEY || window.SUPABASE_KEY || '';
        const headers = clientToken ? { 'x-client-token': clientToken } : {};
        // storageKey dédié pour éviter l'avertissement "Multiple GoTrueClient instances"
        const storageKey = clientToken ? `sb-fiche-${clientToken.slice(0, 8)}` : 'sb-fiche-client';
        return createClient(SUPABASE_URL, key, {
            global: { headers },
            auth: { storageKey }
        });
    };

    window.createFicheClientSupabase = createFicheClientSupabase;

    // Initialiser Supabase (une seule fois)
    if (!window.ficheClientSupabase) {
        window.ficheClientSupabase = createFicheClientSupabase();
        // Alias pour compatibilité avec d'autres modules
        window.supabaseClient = window.ficheClientSupabase;
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

// ==================== FONCTIONS UTILITAIRES TRAJET ====================
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
    // Appliquer un facteur de détour routier (les routes ne sont pas des lignes droites)
    // En zone urbaine/rurale, les routes font environ 1.6 à 2x la distance à vol d'oiseau
    const routeFactor = 1.7;
    const realDistance = distanceKm * routeFactor;
    
    // Vitesses moyennes RÉALISTES (avec circulation, virages, arrêts, feux...)
    const speedWalk = 4.5; // km/h (vitesse réelle avec pauses)
    const speedBike = 12; // km/h (avec relief, virages, prudence)
    const speedCar = 22; // km/h (circulation urbaine, limitations 30-50, arrêts)
    
    // Temps de base (stationnement, démarrage, préparation)
    const baseTimeCar = 2; // minutes
    const baseTimeBike = 1;
    
    const timeWalk = Math.ceil((realDistance / speedWalk) * 60);
    const timeBike = Math.ceil((realDistance / speedBike) * 60) + baseTimeBike;
    const timeCar = Math.ceil((realDistance / speedCar) * 60) + baseTimeCar;
    
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
            // console.log(`🌍 Traduction ${field}: "${valueFR.substring(0, 50)}..."`);
            
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
        // console.log(`💾 Sauvegarde de ${Object.keys(updates).length} traductions automatiques...`);
        
        try {
            const { error } = await supabase
                .from('infos_gites')
                .update(updates)
                .eq('gite', normalizeGiteName(reservationData.gite));
            
            if (error) {
                console.error('❌ Erreur sauvegarde traductions:', error);
            } else {
                // console.log('✅ Traductions sauvegardées en base de données');
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
        tab_prestations: 'Prestations',
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
        galerie_photos: 'Galerie photos',
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
        export_pdf: 'PDF',
        generation_pdf: 'Génération du PDF...',
        bienvenue: 'Bienvenue',
        votre_sejour: 'Votre séjour',
        chargement: 'Chargement de votre guide...',
        installer_app: 'Installer l\'application',
        acces_rapide: 'Accédez rapidement à votre guide, même hors ligne',
        installer: 'Installer',
        plus_tard: 'Plus tard',
        panier_titre: 'Votre panier',
        panier_sous_total: 'Sous-total',
        panier_commission: 'Commission',
        panier_total: 'Total',
        panier_commander: 'Passer la commande',
        prestations_tous: 'Tous',
        prestations_repas: 'Repas',
        prestations_activite: 'Activités',
        prestations_menage: 'Ménage',
        prestations_location: 'Location',
        prestations_vide: 'Aucune prestation disponible pour le moment',
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
        forecast_today: "Aujourd'hui",
        forecast_tomorrow: 'Demain',
        forecast_rain: 'Pluie',
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
        btn_retour_gite: 'Retour gîte seul',
        // Labels dynamiques
        wifi_debit_label: 'Débit approximatif',
        wifi_localisation_label: 'Localisation box/routeur',
        wifi_zones_label: 'Zones de meilleure réception',
        etage_label: 'Étage du logement',
        ascenseur_label: 'Ascenseur disponible',
        itineraire_label: 'Itinéraire parking → porte',
        premiere_visite_label: 'À savoir pour votre première visite',
        four_label: 'Four',
        plaques_label: 'Plaques',
        lave_vaisselle_label: 'Lave-vaisselle',
        lave_linge_label: 'Lave-linge',
        seche_linge_label: 'Sèche-linge',
        fer_repasser_label: 'Fer et planche à repasser',
        linge_fourni_label: 'Linge fourni',
        config_chambres_label: 'Configuration des chambres',
        detecteur_fumee_label: 'Détecteur de fumée',
        extincteur_label: 'Extincteur',
        coupure_eau_label: 'Coupure d\'eau',
        disjoncteur_label: 'Disjoncteur général',
        proprietaire_label: 'Propriétaire',
        appeler: 'Appeler',
        email_label: 'Email',
        urgence_contact: 'En cas d\'urgence',
        restitution_cles_label: 'Restitution des clés',
        erreur_chargement_activites: 'Erreur lors du chargement des activités',
        coordonnees_indisponibles: 'Coordonnées du gîte non disponibles',
        aucune_activite: 'Aucune activité configurée pour ce gîte',
        votre_gite: 'Votre gîte',
        site_web: 'Site web',
        aucune_description: 'Aucune description disponible',
        non_specifie: 'Non spécifié',
        horaires_a_verifier: 'Se renseigner',
        erreur_chargement: 'Erreur de chargement',
        aucun_commerce: 'Aucun commerce ajouté pour le moment',
        donnees_indisponibles: 'Données de réservation non disponibles',
        aucune_faq: 'Aucune FAQ disponible',
        acces_logement: 'Accès au logement',
        linge_chambres: 'Linge & Chambres',
        securite_equipements: 'Sécurité & Équipements',
        evenements_semaine: 'Événements de la semaine',
        evenements_description: 'Activités et événements prévus pendant votre séjour',
        prestations_title: 'Prestations',
        prestations_description: 'Découvrez nos services supplémentaires pour agrémenter votre séjour',
        photo_entree: 'Entrée',
        photo_boite_cles: 'Boîte à clés'
    },
    en: {
        tab_entree: 'Check-in',
        tab_pendant: 'During stay',
        tab_sortie: 'Check-out',
        tab_prestations: 'Services',
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
        galerie_photos: 'Photo Gallery',
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
        export_pdf: 'PDF',
        generation_pdf: 'Generating PDF...',
        bienvenue: 'Welcome',
        votre_sejour: 'Your stay',
        chargement: 'Loading your guide...',
        installer_app: 'Install the app',
        acces_rapide: 'Quick access to your guide, even offline',
        installer: 'Install',
        plus_tard: 'Later',
        panier_titre: 'Your cart',
        panier_sous_total: 'Subtotal',
        panier_commission: 'Commission',
        panier_total: 'Total',
        panier_commander: 'Place order',
        prestations_tous: 'All',
        prestations_repas: 'Meals',
        prestations_activite: 'Activities',
        prestations_menage: 'Cleaning',
        prestations_location: 'Rental',
        prestations_vide: 'No services available at the moment',
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
        forecast_today: 'Today',
        forecast_tomorrow: 'Tomorrow',
        forecast_rain: 'Rain',
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
        btn_retour_gite: 'Back to cottage only',
        // Dynamic labels
        wifi_debit_label: 'Approximate speed',
        wifi_localisation_label: 'Router/box location',
        wifi_zones_label: 'Best reception areas',
        etage_label: 'Property floor',
        ascenseur_label: 'Elevator available',
        itineraire_label: 'Parking → entrance route',
        premiere_visite_label: 'Good to know for your first visit',
        four_label: 'Oven',
        plaques_label: 'Hob',
        lave_vaisselle_label: 'Dishwasher',
        lave_linge_label: 'Washing machine',
        seche_linge_label: 'Tumble dryer',
        fer_repasser_label: 'Iron and ironing board',
        linge_fourni_label: 'Linen provided',
        config_chambres_label: 'Room configuration',
        detecteur_fumee_label: 'Smoke detector',
        extincteur_label: 'Fire extinguisher',
        coupure_eau_label: 'Water shut-off',
        disjoncteur_label: 'Main circuit breaker',
        proprietaire_label: 'Owner',
        appeler: 'Call',
        email_label: 'Email',
        urgence_contact: 'In case of emergency',
        restitution_cles_label: 'Key return',
        erreur_chargement_activites: 'Error loading activities',
        coordonnees_indisponibles: 'Property coordinates unavailable',
        aucune_activite: 'No activities configured for this property',
        votre_gite: 'Your accommodation',
        site_web: 'Website',
        aucune_description: 'No description available',
        non_specifie: 'Not specified',
        horaires_a_verifier: 'Please inquire',
        erreur_chargement: 'Loading error',
        aucun_commerce: 'No shops added yet',
        donnees_indisponibles: 'Reservation data unavailable',
        aucune_faq: 'No FAQ available',
        acces_logement: 'Building access',
        linge_chambres: 'Linen & Bedrooms',
        securite_equipements: 'Safety & Equipment',
        evenements_semaine: 'Events this week',
        evenements_description: 'Activities and events planned during your stay',
        prestations_title: 'Services',
        prestations_description: 'Discover additional services to enhance your stay',
        photo_entree: 'Entrance',
        photo_boite_cles: 'Key box'
    }
};

function t(key) {
    return translations[currentLanguage][key] || key;
}

function getReservationClientName() {
    if (!reservationData) return '';

    const rawName = reservationData.client_name
        || reservationData.nom_client
        || reservationData.nom
        || reservationData.guest_name
        || reservationData.guest
        || '';

    return typeof rawName === 'string' ? rawName.trim() : '';
}

function updateTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        const translation = t(key);
        const clientName = getReservationClientName();
        
        // Cas spéciaux : ne pas écraser le contenu dynamique
        if (key === 'bienvenue' && clientName) {
            el.textContent = `${translation} ${clientName} !`;
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
    
    // Mettre à jour les titres des photos (créées une seule fois, non rechargées)
    const photoTitleMap = {
        'entree': t('photo_entree'),
        'boite_cles': t('photo_boite_cles'),
        'parking': t('parking_title')
    };
    document.querySelectorAll('[data-i18n-photo]').forEach(el => {
        const type = el.getAttribute('data-i18n-photo');
        if (photoTitleMap[type]) {
            // Préserver l'icône <i> et mettre à jour uniquement le texte
            const icon = el.querySelector('i');
            el.innerHTML = '';
            if (icon) el.appendChild(icon);
            el.appendChild(document.createTextNode(' ' + photoTitleMap[type]));
        }
    });
    
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
        if (typeof window.createFicheClientSupabase === 'function') {
            window.ficheClientSupabase = window.createFicheClientSupabase(token);
            window.supabaseClient = window.ficheClientSupabase;
            supabase = window.ficheClientSupabase;
        }

        await loadReservationData();
        
        await loadGiteInfo();
        
        await loadCleaningSchedule();
        
        await loadClientChecklists();
        
        initializeUI();
        
        initializeEventListeners();
        
        hideLoading();
    } catch (error) {
        console.error('❌ Erreur lors du chargement:', error);
        const detail = error?.message || error?.details || error?.hint || JSON.stringify(error);
        showError(`Impossible de charger les données. Erreur : ${detail}`);
    }
});

async function loadReservationData() {
    // Utilise un RPC SECURITY DEFINER pour éviter la dépendance aux headers
    // (le header x-client-token n'est pas transmis par Kong vers PostgREST)
    const { data, error } = await supabase
        .rpc('get_reservation_by_client_token', { p_token: token });

    if (error) {
        const reason = error.message || error.details || error.hint || 'erreur inconnue';
        throw new Error(`Accès refusé (${reason})`);
    }

    // rpc() avec RETURNS SETOF retourne un tableau
    const reservation = Array.isArray(data) ? data[0] : data;

    if (!reservation) {
        throw new Error('Token invalide, expiré ou réservation introuvable');
    }

    reservationData = reservation;
}

async function loadGiteInfo() {
    // Utilise RPC SECURITY DEFINER pour éviter le blocage RLS sur infos_gites
    const { data: rpcData, error: rpcError } = await supabase
        .rpc('get_gite_info_by_client_token', { p_token: token });

    let data = Array.isArray(rpcData) ? rpcData[0] : rpcData;
    let error = rpcError;

    // Fallback direct si la fonction RPC n'existe pas encore
    if (rpcError && rpcError.code === 'PGRST202') {
        const r1 = await supabase.from('infos_gites').select('*')
            .eq('gite', normalizeGiteName(reservationData.gite)).maybeSingle();
        data = r1.data;
        error = r1.error;
        if (!data && !error) {
            const r2 = await supabase.from('infos_gites').select('*')
                .eq('gite', reservationData.gite.toLowerCase()).maybeSingle();
            data = r2.data; error = r2.error;
        }
        if (!data && !error) {
            const r3 = await supabase.from('infos_gites').select('*')
                .eq('gite', reservationData.gite).maybeSingle();
            data = r3.data; error = r3.error;
        }
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
                // console.log('✅ Heure arrivée validée chargée:', h.heure_demandee);
            }
            if (h.type === 'depart') {
                giteInfo.heure_depart_validee = h.heure_demandee;
                // console.log('✅ Heure départ validée chargée:', h.heure_demandee);
            }
        });
    }
    
    // 📦 Charger les prestations supplémentaires
    if (typeof loadPrestationsForGite === 'function' && reservationData.gite_id) {
        await loadPrestationsForGite(reservationData.gite_id);
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
    const clientName = getReservationClientName();
    if (clientNameEl && clientName) {
        const welcomeText = t('bienvenue');
        clientNameEl.textContent = `${welcomeText} ${clientName} !`;
    }
    
    // 📸 Afficher les photos du gîte
    displayGitePhotos();
    
    // ✨ NOUVEAU : Initialiser Hero Section
    initHeroSection();
    
    // Onglet Entrée
    initOngletEntree();
    
    // Onglet Pendant
    initOngletPendant();
    loadWeatherData(); // widget météo dans l'onglet Pendant (appel async non-bloquant)
    
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
    
    // � Initialiser lightbox photos
    initPhotoLightbox();
    
    // �🎨 Sélecteur de thème
    initThemeSwitcher();
    
    // Appliquer les traductions
    updateTranslations();
}

// �️ Gestion Lightbox Photos
let lightboxPhotos = [];
let currentPhotoIndex = 0;

function openPhotoLightbox(photos, startIndex = 0) {
    // Accepte une seule photo (string) ou un tableau
    lightboxPhotos = Array.isArray(photos) ? photos : [photos];
    currentPhotoIndex = startIndex;
    
    const lightbox = document.getElementById('photoLightbox');
    const lightboxImage = document.getElementById('lightboxImage');
    const prevBtn = document.getElementById('prevPhoto');
    const nextBtn = document.getElementById('nextPhoto');
    const counter = document.getElementById('photoCounter');
    
    // Afficher la modale
    lightbox.style.display = 'flex';
    
    // Afficher la photo actuelle
    updateLightboxPhoto();
    
    // Afficher les flèches uniquement si plusieurs photos
    console.log('🖼️ Lightbox ouverte avec', lightboxPhotos.length, 'photo(s)');
    if (lightboxPhotos.length > 1) {
        prevBtn.style.display = 'flex';
        nextBtn.style.display = 'flex';
        counter.style.display = 'block';
        console.log('✅ Flèches affichées (galerie de', lightboxPhotos.length, 'photos)');
    } else {
        prevBtn.style.display = 'none';
        nextBtn.style.display = 'none';
        counter.style.display = 'none';
        console.log('ℹ️ Photo unique, pas de navigation');
    }
}

function updateLightboxPhoto() {
    const lightboxImage = document.getElementById('lightboxImage');
    const counter = document.getElementById('photoCounter');
    
    lightboxImage.src = lightboxPhotos[currentPhotoIndex];
    
    if (lightboxPhotos.length > 1) {
        counter.textContent = `${currentPhotoIndex + 1} / ${lightboxPhotos.length}`;
    }
}

function closeLightbox() {
    const lightbox = document.getElementById('photoLightbox');
    lightbox.style.display = 'none';
    lightboxPhotos = [];
    currentPhotoIndex = 0;
}

function nextPhotoLightbox() {
    currentPhotoIndex = (currentPhotoIndex + 1) % lightboxPhotos.length;
    updateLightboxPhoto();
}

function prevPhotoLightbox() {
    currentPhotoIndex = (currentPhotoIndex - 1 + lightboxPhotos.length) % lightboxPhotos.length;
    updateLightboxPhoto();
}

// 🎬 Initialiser les écouteurs de la lightbox
function initPhotoLightbox() {
    document.getElementById('closeLightbox').addEventListener('click', closeLightbox);
    document.getElementById('nextPhoto').addEventListener('click', nextPhotoLightbox);
    document.getElementById('prevPhoto').addEventListener('click', prevPhotoLightbox);
    
    // Fermer avec Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowRight') nextPhotoLightbox();
        if (e.key === 'ArrowLeft') prevPhotoLightbox();
    });
    
    // Fermer en cliquant sur le fond noir
    document.getElementById('photoLightbox').addEventListener('click', (e) => {
        if (e.target.id === 'photoLightbox') closeLightbox();
    });
}

// �📸 Affichage des photos du gîte
function displayGitePhotos() {
    if (!giteInfo || !giteInfo.photos) {
        console.log('ℹ️ Aucune photo disponible pour ce gîte');
        return;
    }
    
    const photos = giteInfo.photos;
    
    // 1. PHOTO DE COUVERTURE dans le header
    const couvertureUrl = photos.couverture?.url || photos.couverture;
    if (couvertureUrl && typeof couvertureUrl === 'string') {
        const headerEl = document.getElementById('mainHeader');
        if (headerEl) {
            // Récupérer le style existant et remplacer uniquement le background
            const currentStyle = headerEl.getAttribute('style') || '';
            const newStyle = currentStyle.replace(/background[^;]*;?/gi, '') + 
                `background: url('${couvertureUrl}') center/cover;`;
            headerEl.setAttribute('style', newStyle);
        }
    }
    
    // 2. PHOTO GALERIE - Afficher la première image si disponible
    if (photos.galerie && Array.isArray(photos.galerie) && photos.galerie.length > 0) {
        displayGalleryPhotos(photos.galerie);
    }
    
    // 3. PHOTO BOITE À CLÉS - Dans la section parking/accès
    if (photos.boite_cles && Array.isArray(photos.boite_cles) && photos.boite_cles.length > 0) {
        displayPhotoInSection('boite_cles', photos.boite_cles[0], t('photo_boite_cles'));
    }
    
    // 4. PHOTO PARKING
    if (photos.parking && Array.isArray(photos.parking) && photos.parking.length > 0) {
        displayPhotoInSection('parking', photos.parking[0], 'Parking');
    }
    
    // 5. PHOTO ENTRÉE
    if (photos.entree && Array.isArray(photos.entree) && photos.entree.length > 0) {
        displayPhotoInSection('entree', photos.entree[0], t('photo_entree'));
    }
}

function displayGalleryPhotos(galleryPhotos) {
    if (!galleryPhotos || galleryPhotos.length === 0) return;
    
    // Filtrer les URLs valides (extraire .url si c'est un objet)
    const validPhotos = galleryPhotos
        .map(photo => photo?.url || photo)
        .filter(url => typeof url === 'string' && url.trim() !== '');
    if (validPhotos.length === 0) return;
    
    const entreeTab = document.getElementById('tab-entree');
    if (!entreeTab) return;
    
    // Vérifier si la galerie existe déjà
    let galerieSection = document.getElementById('galerieGiteSection');
    if (!galerieSection) {
        galerieSection = document.createElement('div');
        galerieSection.id = 'galerieGiteSection';
        galerieSection.className = 'card';
        galerieSection.innerHTML = `
            <div class="card-header">
                <h2 class="card-title"><i data-lucide="images"></i> <span data-i18n="galerie_photos">Galerie photos</span></h2>
            </div>
            <div id="galeriePhotosContainer" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px; padding: 1rem;">
            </div>
        `;
        // Insérer après le premier élément (généralement les infos d'accès)
        entreeTab.insertBefore(galerieSection, entreeTab.children[1] || entreeTab.firstChild);
    }
    
    const container = document.getElementById('galeriePhotosContainer');
    if (container) {
        container.innerHTML = validPhotos.map((url, index) => `
            <div class="photo-gallery-item" data-photo-index="${index}" style="position: relative; padding-bottom: 75%; overflow: hidden; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); cursor: pointer;">
                <img src="${url}" alt="Photo du gîte" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
            </div>
        `).join('');
        
        // Stocker les photos dans une variable globale pour la galerie
        window.currentGalleryPhotos = validPhotos;
        
        // Ajouter les écouteurs de clic
        container.querySelectorAll('.photo-gallery-item').forEach(item => {
            item.addEventListener('click', function() {
                const index = parseInt(this.getAttribute('data-photo-index'));
                openPhotoLightbox(window.currentGalleryPhotos, index);
            });
        });
        
        // Réinitialiser les icônes Lucide
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }
}

function displayPhotoInSection(sectionType, photo, sectionTitle) {
    // Extraire l'URL si c'est un objet
    const photoUrl = photo?.url || photo;
    
    // Vérifier que l'URL est valide
    if (!photoUrl || typeof photoUrl !== 'string' || photoUrl.trim() === '') return;
    
    // Mapping des IDs de sections selon le type
    const sectionMap = {
        'boite_cles': 'accordionInstructions', // Après les instructions d'accès
        'parking': 'parkingSection', // Dans la section parking
        'entree': 'accordionInstructions' // Après les instructions d'accès
    };
    
    const sectionId = sectionMap[sectionType];
    if (!sectionId) return;
    
    const section = document.getElementById(sectionId);
    if (!section) return;
    
    // Vérifier si la photo existe déjà
    const photoId = `photo_${sectionType}`;
    let photoContainer = document.getElementById(photoId);
    
    if (!photoContainer) {
        photoContainer = document.createElement('div');
        photoContainer.id = photoId;
        photoContainer.style.cssText = 'margin-top: 1rem; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);';
        photoContainer.innerHTML = `
            <p data-i18n-photo="${sectionType}" style="font-weight: 600; margin-bottom: 0.5rem; color: var(--gray-700); display: flex; align-items: center; gap: 0.5rem;"><i data-lucide="camera" style="width: 16px; height: 16px;"></i> ${sectionTitle}</p>
            <img class="single-photo" data-photo-url="${photoUrl}" src="${photoUrl}" alt="${sectionTitle}" style="width: 100%; max-height: 300px; object-fit: cover; border-radius: 8px; cursor: pointer;">
        `;
        
        // Ajouter écouteur de clic pour la lightbox
        const imgElement = photoContainer.querySelector('.single-photo');
        if (imgElement) {
            imgElement.addEventListener('click', function() {
                const url = this.getAttribute('data-photo-url');
                openPhotoLightbox([url], 0);
            });
        }
        
        // Insertion selon le type de section
        if (sectionType === 'parking') {
            // Dans parkingSection, ajouter après le contenu
            const parkingInfo = document.getElementById('parkingInfo');
            if (parkingInfo) {
                parkingInfo.insertAdjacentElement('afterend', photoContainer);
            } else {
                section.appendChild(photoContainer);
            }
        } else {
            // Pour boite_cles et entree, ajouter après accordionInstructions
            section.insertAdjacentElement('afterend', photoContainer);
        }
        
        // Réinitialiser les icônes Lucide
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }
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
    } else {
        // Après départ (dans les 7 jours)
        timelineAvant.classList.remove('active');
        timelinePendant.classList.remove('active');
        timelineApres.classList.add('active');
    }

    // Météo affichée dans toutes les phases
    await loadWeatherData();
    
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
    const lat = giteInfo.latitude || giteInfo.gps_lat;
    const lon = giteInfo.longitude || giteInfo.gps_lon;
    if (!weatherWidget || !lat || !lon) return;
    
    try {
        const lang = currentLanguage === 'fr' ? 'fr' : 'en';
        const apiKey = '7efc12e29575437a864135709260202';
        
        const response = await fetch(
            `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${lat},${lon}&days=3&lang=${lang}&aqi=no`
        );
        
        if (!response.ok) throw new Error('Météo indisponible');
        
        const data = await response.json();
        const current = data.current;
        const forecastDays = data.forecast.forecastday;
        
        // Labels des 3 jours
        const locale = currentLanguage === 'fr' ? 'fr-FR' : 'en-GB';
        const dayLabels = forecastDays.map((fd, i) => {
            if (i === 0) return t('forecast_today');
            if (i === 1) return t('forecast_tomorrow');
            return new Date(fd.date + 'T12:00:00').toLocaleDateString(locale, { weekday: 'long' });
        });
        
        // Cartes prévisions 3 jours
        const forecastHTML = forecastDays.map((fd, i) => `
            <div class="weather-forecast-card">
                <div class="weather-forecast-day">${dayLabels[i]}</div>
                <div class="weather-forecast-emoji">${getWeatherEmoji(fd.day.condition.code, 1)}</div>
                <div class="weather-forecast-temps">
                    <span class="weather-forecast-max">${Math.round(fd.day.maxtemp_c)}°</span>
                    <span class="weather-forecast-min">${Math.round(fd.day.mintemp_c)}°</span>
                </div>
                <div class="weather-forecast-rain">💧 ${fd.day.daily_chance_of_rain}%</div>
            </div>
        `).join('');
        
        weatherWidget.innerHTML = `
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
                    <div class="weather-detail-value">${new Date(current.last_updated).toLocaleTimeString(locale, {hour: '2-digit', minute: '2-digit'})}</div>
                </div>
            </div>
            <div class="weather-forecast">
                ${forecastHTML}
            </div>
        `;
        updateTranslations();
    } catch (error) {
        console.warn('[Météo] Erreur chargement:', error.message);
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
    const arriveeFlexible = currentLanguage === 'fr' ? giteInfo.arrivee_tardive : giteInfo.arrivee_tardive_en;
    const heureArrivee = currentLanguage === 'fr' ? giteInfo.heure_arrivee : giteInfo.heure_arrivee_en;
    // // console.log('🕒 Heure arrivée brute:', heureArrivee, 'Standard:', giteInfo.heure_arrivee_standard, 'Validée:', giteInfo.heure_arrivee_validee, 'Lang:', currentLanguage);
    
    // ✅ PRIORITÉ: Heure validée > Heure configurée > Heure standard
    const heureArriveeEffective = giteInfo.heure_arrivee_validee || heureArrivee || giteInfo.heure_arrivee_standard || '17:00';
    const heureArriveeFormatted = formatTime(heureArriveeEffective);
    // // console.log('🕒 Heure arrivée formatée:', heureArriveeFormatted);
    let heureArriveeText = heureArriveeFormatted;
    if (arriveeFlexible) {
        heureArriveeText += ` <span style="background: var(--primary); color: white; padding: 0.25rem 0.5rem; border-radius: 0.25rem; font-size: 0.875rem; margin-left: 0.5rem; font-weight: 600;">✓ Flexible</span>`;
    }
    document.getElementById('heureArrivee').innerHTML = heureArriveeText;
    
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
    
    // Code d'entrée (prioritaire)
    const codeEntreeElement = document.getElementById('codeEntree');
    const codeAccesPrioritaire = String(giteInfo.code_acces || giteInfo.code_entree || '').trim();
    if (codeEntreeElement) {
        codeEntreeElement.textContent = codeAccesPrioritaire || (currentLanguage === 'fr' ? 'À confirmer avec le gestionnaire' : 'To be confirmed with manager');
        codeEntreeElement.style.fontWeight = '800';
        codeEntreeElement.style.fontSize = '1.35rem';
        codeEntreeElement.style.letterSpacing = '0.03em';
        codeEntreeElement.style.color = codeAccesPrioritaire ? 'white' : 'rgba(255,255,255,0.6)';
    }
    
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
    
    // DÉTAILS WiFi SUPPLÉMENTAIRES (débit, localisation, zones)
    const wifiDebit = currentLanguage === 'fr' ? giteInfo.wifi_debit : giteInfo.wifi_debit_en;
    const wifiLocalisation = currentLanguage === 'fr' ? giteInfo.wifi_localisation : giteInfo.wifi_localisation_en;
    const wifiZones = currentLanguage === 'fr' ? giteInfo.wifi_zones : giteInfo.wifi_zones_en;
    
    let wifiDetailsHTML = '';
    if (wifiDebit) {
        wifiDetailsHTML += `<p style="margin-bottom: 0.5rem;"><strong>📡 ${t('wifi_debit_label')} :</strong> ${wifiDebit}</p>`;
    }
    if (wifiLocalisation) {
        wifiDetailsHTML += `<p style="margin-bottom: 0.5rem;"><strong>📍 ${t('wifi_localisation_label')} :</strong> ${wifiLocalisation}</p>`;
    }
    if (wifiZones) {
        wifiDetailsHTML += `<p style="white-space: pre-line; line-height: 1.5;"><strong>📶 ${t('wifi_zones_label')} :</strong><br>${wifiZones}</p>`;
    }
    
    const wifiDetailsSection = document.getElementById('wifiDetailsSection');
    if (wifiDetailsHTML) {
        document.getElementById('wifiDetailsContent').innerHTML = wifiDetailsHTML;
        wifiDetailsSection.style.display = 'block';
    } else {
        wifiDetailsSection.style.display = 'none';
    }
    
    // ACCÈS AU BÂTIMENT (étage, ascenseur, itinéraire, première visite)
    const etage = currentLanguage === 'fr' ? giteInfo.etage : giteInfo.etage_en;
    const ascenseur = currentLanguage === 'fr' ? giteInfo.ascenseur : giteInfo.ascenseur_en;
    const itineraire = currentLanguage === 'fr' ? giteInfo.itineraire_logement : giteInfo.itineraire_logement_en;
    const premiereVisite = currentLanguage === 'fr' ? giteInfo.premiere_visite : giteInfo.premiere_visite_en;
    
    let accesHTML = '';
    if (etage) {
        accesHTML += `<p style="margin-bottom: 0.5rem;"><strong>🏢 ${t('etage_label')} :</strong> ${etage}</p>`;
    }
    if (ascenseur) {
        accesHTML += `<p style="margin-bottom: 0.5rem;"><strong>🛗 ${t('ascenseur_label')} :</strong> ${ascenseur}</p>`;
    }
    if (itineraire) {
        accesHTML += `<div style="background: var(--gray-100); padding: 0.75rem; border-radius: 0.5rem; margin-bottom: 0.5rem;">
            <strong>🚶 ${t('itineraire_label')} :</strong><br>
            <p style="white-space: pre-line; line-height: 1.5; margin-top: 0.5rem;">${itineraire}</p>
        </div>`;
    }
    if (premiereVisite) {
        accesHTML += `<div style="background: var(--primary-light, #e8f5e9); padding: 0.75rem; border-radius: 0.5rem; border-left: 4px solid var(--primary, #68a84f);">
            <strong>💡 ${t('premiere_visite_label')} :</strong><br>
            <p style="white-space: pre-line; line-height: 1.5; margin-top: 0.5rem;">${premiereVisite}</p>
        </div>`;
    }
    
    const accesSection = document.getElementById('accesLogementSection');
    if (accesHTML) {
        document.getElementById('accesLogementInfo').innerHTML = accesHTML;
        accesSection.style.display = 'block';
    } else {
        accesSection.style.display = 'none';
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
        parkingHTML += `<p style="margin-bottom: 0.5rem;"><strong>${t('disponibilite')} :</strong> ${parkingInfo.dispo}</p>`;
    }
    if (parkingInfo.places) {
        parkingHTML += `<p style="margin-bottom: 0.5rem;"><strong>${t('places')} :</strong> ${parkingInfo.places}</p>`;
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
        chauffageHTML += `<p style="margin-bottom: 0.5rem;"><strong>${t('type_chauffage')} :</strong> ${chauffageInfo.type}</p>`;
    }
    if (chauffageInfo.clim) {
        chauffageHTML += `<p style="margin-bottom: 0.5rem;"><strong>${t('climatisation')} :</strong> ${chauffageInfo.clim}</p>`;
    }
    if (chauffageInfo.instructions) {
        chauffageHTML += `<div style="background: var(--gray-100); padding: 0.75rem; border-radius: 0.5rem; margin-top: 0.75rem;">
            <strong style="display: block; margin-bottom: 0.5rem;"><i data-lucide="file-text" style="width: 16px; height: 16px; vertical-align: middle; margin-right: 0.5rem;"></i>${t('instructions')} :</strong>
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
            <strong>${t('four_label')} :</strong> ${cuisineInfo.four}
        </div>`;
    }
    if (cuisineInfo.plaques) {
        cuisineHTML += `<div style="background: var(--gray-100); padding: 0.75rem; border-radius: 0.5rem; margin-bottom: 0.5rem;">
            <strong>${t('plaques_label')} :</strong> ${cuisineInfo.plaques}
        </div>`;
    }
    if (cuisineInfo.laveVaisselle) {
        cuisineHTML += `<div style="background: var(--gray-100); padding: 0.75rem; border-radius: 0.5rem; margin-bottom: 0.5rem;">
            <strong>${t('lave_vaisselle_label')} :</strong> ${cuisineInfo.laveVaisselle}
        </div>`;
    }
    if (cuisineInfo.laveLinge) {
        cuisineHTML += `<div style="background: var(--gray-100); padding: 0.75rem; border-radius: 0.5rem;">
            <strong>👕 ${t('lave_linge_label')} :</strong> ${cuisineInfo.laveLinge}
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
        dechetsHTML += `<p style="margin-bottom: 0.5rem;"><strong>📅 ${t('jours_collecte')} :</strong> ${dechetsInfo.collecte}</p>`;
    }
    if (dechetsInfo.decheterie) {
        dechetsHTML += `<div style="background: var(--gray-100); padding: 0.75rem; border-radius: 0.5rem; line-height: 1.5;">
            <strong>🏭 ${t('decheterie')} :</strong> ${dechetsInfo.decheterie}
        </div>`;
    }
    
    const dechetsSection = document.getElementById('dechetsSection');
    if (dechetsHTML) {
        document.getElementById('dechetsInfo').innerHTML = dechetsHTML;
        dechetsSection.style.display = 'block';
    } else {
        dechetsSection.style.display = 'none';
    }
    
    // ÉQUIPEMENTS LINGE & CHAMBRES
    const secheLinge = currentLanguage === 'fr' ? giteInfo.seche_linge : giteInfo.seche_linge_en;
    const ferRepasser = currentLanguage === 'fr' ? giteInfo.fer_repasser : giteInfo.fer_repasser_en;
    const lingeFourni = currentLanguage === 'fr' ? giteInfo.linge_fourni : giteInfo.linge_fourni_en;
    const configChambres = currentLanguage === 'fr' ? giteInfo.configuration_chambres : giteInfo.configuration_chambres_en;
    
    let lingeHTML = '';
    if (secheLinge) {
        lingeHTML += `<p style="margin-bottom: 0.5rem;"><strong>🌀 ${t('seche_linge_label')} :</strong> ${secheLinge}</p>`;
    }
    if (ferRepasser) {
        lingeHTML += `<p style="margin-bottom: 0.5rem;"><strong>👔 ${t('fer_repasser_label')} :</strong> ${ferRepasser}</p>`;
    }
    if (lingeFourni) {
        lingeHTML += `<div style="background: var(--gray-100); padding: 0.75rem; border-radius: 0.5rem; margin-bottom: 0.5rem;">
            <strong>🛏️ ${t('linge_fourni_label')} :</strong><br>
            <p style="white-space: pre-line; line-height: 1.5; margin-top: 0.5rem;">${lingeFourni}</p>
        </div>`;
    }
    if (configChambres) {
        lingeHTML += `<div style="background: var(--primary-light, #e8f5e9); padding: 0.75rem; border-radius: 0.5rem;">
            <strong>🛌 ${t('config_chambres_label')} :</strong><br>
            <p style="white-space: pre-line; line-height: 1.5; margin-top: 0.5rem;">${configChambres}</p>
        </div>`;
    }
    
    const lingeSection = document.getElementById('lingeChambresSection');
    if (lingeHTML) {
        document.getElementById('lingeChambresInfo').innerHTML = lingeHTML;
        lingeSection.style.display = 'block';
    } else {
        lingeSection.style.display = 'none';
    }
    
    // SÉCURITÉ & ÉQUIPEMENTS OBLIGATOIRES
    const detecteurFumee = currentLanguage === 'fr' ? giteInfo.detecteur_fumee : giteInfo.detecteur_fumee_en;
    const extincteur = currentLanguage === 'fr' ? giteInfo.extincteur : giteInfo.extincteur_en;
    const coupureEau = currentLanguage === 'fr' ? giteInfo.coupure_eau : giteInfo.coupure_eau_en;
    const disjoncteur = currentLanguage === 'fr' ? giteInfo.disjoncteur : giteInfo.disjoncteur_en;
    
    let securiteHTML = '';
    if (detecteurFumee) {
        securiteHTML += `<p style="margin-bottom: 0.5rem;"><strong>🔔 ${t('detecteur_fumee_label')} :</strong> ${detecteurFumee}</p>`;
    }
    if (extincteur) {
        securiteHTML += `<p style="margin-bottom: 0.5rem;"><strong>🧯 ${t('extincteur_label')} :</strong> ${extincteur}</p>`;
    }
    if (coupureEau) {
        securiteHTML += `<p style="margin-bottom: 0.5rem;"><strong>💧 ${t('coupure_eau_label')} :</strong> ${coupureEau}</p>`;
    }
    if (disjoncteur) {
        securiteHTML += `<p><strong>⚡ ${t('disjoncteur_label')} :</strong> ${disjoncteur}</p>`;
    }
    
    const securiteSection = document.getElementById('securiteSection');
    if (securiteHTML) {
        document.getElementById('securiteInfo').innerHTML = securiteHTML;
        securiteSection.style.display = 'block';
    } else {
        securiteSection.style.display = 'none';
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
                    <div style="font-weight: 600;"><i data-lucide="phone" style="width: 16px; height: 16px; vertical-align: middle; margin-right: 0.5rem;"></i>${t('proprietaire_label')}</div>
                    <div style="color: var(--gray-600); font-size: 0.9rem;">${tel}</div>
                </div>
                <a href="tel:${tel}" class="btn btn-primary" style="padding: 0.5rem 1rem;">
                    ${t('appeler')}
                </a>
            </div>`;
    }
    if (email) {
        contactsHTML += `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; border: 1px solid var(--gray-200); border-radius: 0.5rem; margin-bottom: 0.5rem;">
                <div>
                    <div style="font-weight: 600;">📧 ${t('email_label')}</div>
                    <div style="color: var(--gray-600); font-size: 0.9rem;">${email}</div>
                </div>
                <a href="mailto:${email}" class="btn btn-outline" style="padding: 0.5rem 1rem;">
                    ${t('envoyer')}
                </a>
            </div>`;
    }
    if (consignesUrgence) {
        contactsHTML += `
            <div style="background: var(--gray-50); padding: 0.75rem; border-radius: 0.5rem; border-left: 3px solid var(--danger); margin-top: 1rem;">
                <strong style="color: var(--danger);"><i data-lucide="alert-triangle" style="width: 16px; height: 16px; vertical-align: middle; margin-right: 0.5rem;"></i>${t('urgence_contact')} :</strong>
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
    const departFlexible = currentLanguage === 'fr' ? giteInfo.depart_tardif : giteInfo.depart_tardif_en;
    const heureDepart = currentLanguage === 'fr' ? giteInfo.heure_depart : giteInfo.heure_depart_en;
    
    // ✅ PRIORITÉ: Heure validée > Heure configurée > Heure standard
    const heureDepartEffective = giteInfo.heure_depart_validee || heureDepart || giteInfo.heure_depart_standard || '10:00';
    const heureDepartFormatted = formatTime(heureDepartEffective);
    const heureDepartElement = document.getElementById('heureDepart');
    if (heureDepartElement) {
        let heureDepartText = heureDepartFormatted;
        if (departFlexible) {
            heureDepartText += ` <span style="background: var(--primary); color: white; padding: 0.25rem 0.5rem; border-radius: 0.25rem; font-size: 0.875rem; margin-left: 0.5rem; font-weight: 600;">✓ Flexible</span>`;
        }
        heureDepartElement.innerHTML = heureDepartText;
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
            <strong><i data-lucide="key" style="width: 16px; height: 16px; vertical-align: middle; margin-right: 0.5rem;"></i>${t('restitution_cles_label')} :</strong>
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
        document.getElementById('listeActivites').innerHTML = `<p style="padding: 2rem; text-align: center; color: var(--gray-600);">⏳ ${t('chargement')}</p>`;
        return;
    }
    
    loadActivitesForClient();
}

function initOngletFaq() {
    if (!reservationData) {
        document.getElementById('faqListe').innerHTML = `<p style="padding: 2rem; text-align: center; color: var(--gray-600);">⏳ ${t('chargement')}</p>`;
        return;
    }
    loadFaqData();
}

async function loadActivitesForClient() {
    try {
        if (!reservationData || !reservationData.gite_id) {
            document.getElementById('listeActivites').innerHTML = `<p style="padding: 2rem; text-align: center; color: var(--gray-600);">⏳ ${t('chargement')}</p>`;
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
            document.getElementById('listeActivites').innerHTML = `<p style="padding: 2rem; text-align: center; color: var(--danger);">⚠️ ${t('erreur_chargement_activites')}</p>`;
            return;
        }
        
        const giteLat = parseFloat(giteInfo?.gps_lat || giteInfo?.latitude);
        const giteLon = parseFloat(giteInfo?.gps_lon || giteInfo?.longitude);
        
        if (!giteLat || !giteLon || isNaN(giteLat) || isNaN(giteLon)) {
            document.getElementById('mapActivites').innerHTML = `<p style="padding: 2rem; text-align: center; color: var(--gray-600);">⚠️ ${t('coordonnees_indisponibles')}</p>`;
            document.getElementById('listeActivites').innerHTML = `<p style="padding: 2rem; text-align: center; color: var(--gray-600);">⚠️ ${t('coordonnees_indisponibles')}</p>`;
            return;
        }
        
        if (!activites || activites.length === 0) {
            document.getElementById('mapActivites').innerHTML = `<p style="padding: 2rem; text-align: center; color: var(--gray-600);">ℹ️ ${t('aucune_activite')}</p>`;
            document.getElementById('listeActivites').innerHTML = `<p style="padding: 2rem; text-align: center; color: var(--gray-600);">ℹ️ ${t('aucune_activite')}</p>`;
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
                <strong style="color: #ef4444;"><i data-lucide="home" style="width: 16px; height: 16px; vertical-align: middle; margin-right: 0.5rem;"></i>${t('votre_gite')}</strong><br>
                <a href="https://www.google.com/maps/search/?api=1&query=${giteLat},${giteLon}" 
                   target="_blank" 
                   style="color: var(--primary); font-size: 0.875rem;">
                    <i data-lucide="map-pin" style="width: 14px; height: 14px; vertical-align: middle; margin-right: 0.25rem;"></i>${t('btn_voir_google_maps')}
                </a>
            </div>
        `;
        
        // Initialiser les icônes Lucide dans la carte
        if (typeof lucide !== 'undefined') lucide.createIcons();
        
        // Liste interactive des activités
        displayActivitesListInteractive(activites, giteLat, giteLon);
    } catch (error) {
        console.error('❌ Erreur critique dans loadActivitesForClient:', error);
        document.getElementById('listeActivites').innerHTML = `<p style="padding: 2rem; text-align: center; color: var(--danger);">⚠️ ${t('erreur_chargement_activites')}</p>`;
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
                                <i data-lucide="map" style="width: 16px; height: 16px;"></i> ${t('voir_itineraire')}
                            </a>
                        ` : ''}
                        ${activite.website ? `
                            <a href="${activite.website}" target="_blank" class="btn btn-outline"
                               onclick="trackActiviteConsultation(${activite.id}, 'click_website')"
                               style="text-decoration: none; display: flex; align-items: center; gap: 0.5rem;">
                                <i data-lucide="globe" style="width: 16px; height: 16px;"></i> ${t('site_web')}
                            </a>
                        ` : ''}
                        ${activite.phone ? `
                            <a href="tel:${activite.phone}" class="btn btn-outline"
                               onclick="trackActiviteConsultation(${activite.id}, 'click_phone')"
                               style="text-decoration: none; display: flex; align-items: center; gap: 0.5rem;">
                                <i data-lucide="phone" style="width: 16px; height: 16px;"></i> ${t('appeler')}
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
    
    // Bouton export PDF
    document.getElementById('btnExportPDF')?.addEventListener('click', generatePDF);
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
        // Utilise RPC SECURITY DEFINER (les policies RLS basées sur headers ne fonctionnent pas)
        const { data: resultId, error } = await supabase
            .rpc('upsert_demande_horaire_by_token', {
                p_token:  token,
                p_type:   typeDb,
                p_heure:  heureDemandee,
                p_motif:  motif || null
            });

        if (error) {
            // PGRST202 = RPC introuvable ; 42804 / 400 = type mismatch (p_heure text → time) → fallback insert direct
            if (error.code === 'PGRST202' || error.status === 400 || error.code === '400' || error.code === '42804') {
                const ownerUserId = reservationData.owner_user_id;
                if (!ownerUserId) { showToast('❌ Erreur : données de réservation manquantes'); return; }
                const { error: insertError } = await supabase.from('demandes_horaires').insert({
                    owner_user_id: ownerUserId,
                    reservation_id: reservationData.id,
                    type: typeDb,
                    heure_demandee: heureDemandee,
                    motif: motif || null,
                    statut: 'en_attente'
                });
                if (insertError) throw insertError;
            } else {
                throw error;
            }
        }

        showToast(t('demande_envoyee') || '✅ Demande envoyée avec succès !');
        
        // Cacher le formulaire
        if (type === 'arrivee_anticipee') {
            document.getElementById('formArriveeAnticipee').style.display = 'none';
        } else {
            document.getElementById('formDepartTardif').style.display = 'none';
        }
    } catch (error) {
        console.error('❌ Erreur inattendue:', error);
        if (error?.code === '42P01' || error?.code === 'PGRST204') {
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
            .rpc('insert_retour_client_by_token', {
                p_token:       token,
                p_type:        type,
                p_sujet:       sujet,
                p_description: description,
                p_urgence:     urgence
            });
        
        if (error) {
            // Fallback direct si RPC pas encore créée
            if (error.code === 'PGRST202') {
                const { error: insertError } = await supabase.from('retours_clients').insert({
                    reservation_id: reservationData.id, type, sujet, description, urgence
                });
                if (insertError) throw insertError;
            } else {
                throw error;
            }
        }
        
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

// showToast — défini dans js/utils.js (chargé avant ce fichier)

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
        container.innerHTML = `<p style="padding: 1rem; text-align: center; color: var(--gray-600);">⚠️ ${t('erreur_chargement')}</p>`;
        return;
    }
    
    if (!commerces || commerces.length === 0) {
        container.innerHTML = `<p style="padding: 1rem; text-align: center; color: var(--gray-600);">📋 ${t('aucun_commerce')}</p>`;
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
    document.getElementById('modalActiviteDescription').textContent = activite.description || t('aucune_description');
    document.getElementById('modalActiviteAdresse').textContent = activite.adresse || t('non_specifie');
    document.getElementById('modalActiviteHoraires').textContent = activite.horaires || t('horaires_a_verifier');
    document.getElementById('modalActiviteContact').textContent = activite.telephone || t('non_specifie');
    
    const webLink = document.getElementById('modalActiviteWeb');
    if (activite.site_web) {
        webLink.href = activite.site_web;
        webLink.textContent = activite.site_web;
        webLink.parentElement.style.display = 'block';
    } else {
        webLink.parentElement.style.display = 'none';
    }
    
    // Calculer et afficher les temps de trajet
    const travelTimesDiv = document.getElementById('modalActiviteTravelTimes');
    
    if (activite.latitude && activite.longitude && reservationData && reservationData.gite_latitude && reservationData.gite_longitude) {
        try {
            // Vérifier que les fonctions existent
            if (typeof calculateDistance !== 'function' || typeof estimateTravel !== 'function' || typeof formatTravelTime !== 'function') {
                console.warn('⚠️ Fonctions de calcul de trajet non disponibles');
                travelTimesDiv.style.display = 'none';
            } else {
                // Calculer la distance
                const distance = calculateDistance(
                    parseFloat(reservationData.gite_latitude),
                    parseFloat(reservationData.gite_longitude),
                    parseFloat(activite.latitude),
                    parseFloat(activite.longitude)
                );
                
                console.log('📍 Distance calculée:', distance.toFixed(2), 'km');
                
                // Estimer les temps de trajet
                const times = estimateTravel(distance);
                
                console.log('⏱️ Temps:', times);
                
                // Afficher les temps
                document.getElementById('travelTimeCar').textContent = formatTravelTime(times.car);
                document.getElementById('travelTimeBike').textContent = formatTravelTime(times.bike);
                document.getElementById('travelTimeWalk').textContent = formatTravelTime(times.walk);
                
                travelTimesDiv.style.display = 'block';
            }
        } catch (error) {
            console.error('❌ Erreur calcul temps de trajet:', error);
            travelTimesDiv.style.display = 'none';
        }
    } else {
        console.warn('⚠️ Coordonnées manquantes pour calcul trajet');
        travelTimesDiv.style.display = 'none';
    }
    
    document.getElementById('modalActiviteItineraire').onclick = () => {
        openItineraire(activite.latitude, activite.longitude);
    };
    
    modal.classList.add('active');
    
    // Réinitialiser les icônes Lucide
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

// Ouvrir itinéraire Google Maps
function openItineraire(lat, lng) {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    window.open(url, '_blank');
}

// Partage de page avec options multiples
// ==================== EXPORT PDF ====================

async function generatePDF() {
    try {
        // Afficher un loader
        const btnPDF = document.getElementById('btnExportPDF');
        const originalHTML = btnPDF.innerHTML;
        btnPDF.innerHTML = `<i data-lucide="loader-2" style="animation: spin 1s linear infinite;"></i> ${t('generation_pdf')}`;
        btnPDF.disabled = true;
        
        // Créer un clone de la page pour le PDF
        const element = document.body.cloneNode(true);
        
        // Nettoyer les éléments inutiles pour le PDF
        const toRemove = element.querySelectorAll(
            '.bottom-nav, .language-switch, #btnShare, #btnExportPDF, .tab-navigation, script, .modal'
        );
        toRemove.forEach(el => el.remove());
        
        // Forcer tous les onglets à être visibles dans le PDF
        element.querySelectorAll('.tab-content').forEach(tab => {
            tab.style.display = 'block';
            tab.classList.add('active');
        });
        
        // Améliorer le style pour le PDF
        const style = document.createElement('style');
        style.textContent = `
            @media print {
                body { background: white; }
                .card { page-break-inside: avoid; margin-bottom: 20px; }
                header { background: linear-gradient(135deg, #68a84f 0%, #8fbd73 100%) !important; }
            }
        `;
        element.appendChild(style);
        
        // Configuration PDF
        const clientName = getReservationClientName() || 'Client';
        const opt = {
            margin: [10, 10, 10, 10],
            filename: `Fiche-Client-${reservationData.gite}-${clientName}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { 
                scale: 2,
                useCORS: true,
                letterRendering: true,
                scrollY: 0,
                scrollX: 0
            },
            jsPDF: { 
                unit: 'mm', 
                format: 'a4', 
                orientation: 'portrait',
                compress: true
            },
            pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
        };
        
        // Générer le PDF
        await html2pdf().set(opt).from(element).save();
        
        // Restaurer le bouton
        btnPDF.innerHTML = originalHTML;
        btnPDF.disabled = false;
        lucide.createIcons();
        
    } catch (error) {
        console.error('❌ Erreur génération PDF:', error);
        alert(currentLanguage === 'fr' 
            ? 'Erreur lors de la génération du PDF. Veuillez réessayer.' 
            : 'Error generating PDF. Please try again.'
        );
        
        // Restaurer le bouton en cas d'erreur
        const btnPDF = document.getElementById('btnExportPDF');
        btnPDF.innerHTML = `<i data-lucide="file-down"></i> ${t('export_pdf')}`;
        btnPDF.disabled = false;
        lucide.createIcons();
    }
}

// ==================== PARTAGE ====================

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
        document.getElementById('faqListe').innerHTML = `<p style="padding: 2rem; text-align: center; color: var(--gray-600);">⏳ ${t('donnees_indisponibles')}</p>`;
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
        document.getElementById('faqListe').innerHTML = `<p style="padding: 2rem; text-align: center; color: var(--gray-600);">⚠️ ${t('erreur_chargement')}</p>`;
        return;
    }
    
    allFaqs = faqs || [];
    cachedFaqs = faqs || []; // Stocker en cache
    
    if (allFaqs.length === 0) {
        document.getElementById('faqListe').innerHTML = `<p style="padding: 2rem; text-align: center; color: var(--gray-600);">📋 ${t('aucune_faq')}</p>`;
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
        // Récupérer l'état actuel depuis le cache
        const existing = cachedProgressMap[templateId];
        const newCompleted = existing !== undefined ? !existing : true;
        
        // Utilise RPC SECURITY DEFINER (les policies RLS headers ne fonctionnent pas)
        const { error: rpcError } = await supabase
            .rpc('upsert_checklist_progress_by_token', {
                p_token:       token,
                p_template_id: templateId,
                p_completed:   newCompleted
            });
        
        if (rpcError) {
            if (rpcError.code === 'PGRST202') {
                // Fallback direct si RPC pas encore créée
                const { error: upsertError } = await supabase
                    .from('checklist_progress')
                    .upsert({
                        owner_user_id: reservationData.owner_user_id,
                        reservation_id: reservationData.id,
                        template_id: templateId,
                        completed: newCompleted,
                        completed_at: newCompleted ? new Date().toISOString() : null
                    }, { onConflict: 'reservation_id,template_id' });
                if (upsertError) throw upsertError;
            } else {
                throw rpcError;
            }
        }
        
        // Mettre à jour le cache
        cachedProgressMap[templateId] = newCompleted;
        
        // Re-render sans recharger depuis la DB
        renderClientChecklist('entree', cachedTemplatesEntree, cachedProgressMap);
        renderClientChecklist('sortie', cachedTemplatesSortie, cachedProgressMap);
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

    // Validation inline des champs requis
    if (window.Utils && Utils.clearFieldErrors) {
        Utils.clearFieldErrors(document.getElementById('formRetoursDemande'));
    }
    const sujetEl = document.getElementById('sujetRetourDemande');
    const descEl  = document.getElementById('descriptionRetourDemande');
    let formValid = true;
    if (sujetEl && !sujetEl.value.trim()) {
        if (window.Utils) Utils.showFieldError(sujetEl, 'Ce champ est requis');
        formValid = false;
    }
    if (descEl && !descEl.value.trim()) {
        if (window.Utils) Utils.showFieldError(descEl, 'Ce champ est requis');
        formValid = false;
    }
    if (!formValid) {
        showToast('Veuillez remplir tous les champs requis', 'error');
        return;
    }
    
    try {
        const type = document.getElementById('typeRetourDemande').value;
        const urgenceInput = document.querySelector('input[name="urgenceDemande"]:checked');
        
        const formData = {
            reservation_id: reservationData.id, // ✅ FIX: Utiliser reservationData.id au lieu de giteInfo.reservationId
            gite: reservationData.gite,
            type: type,
            sujet: sujetEl.value,
            description: descEl.value,
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
                    owner_user_id: reservationData.owner_user_id || null,
                    client_name: reservationData.client_name || null,
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
                    owner_user_id: reservationData.owner_user_id || null,
                    client_name: reservationData.client_name || null,
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
    
    // Thème depuis la DB (giteInfo) — priorité sur localStorage qui serait vide chez le client
    const savedTheme = (giteInfo && giteInfo.fiche_client_theme) || localStorage.getItem('ficheClientTheme') || 'cyan';
    
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
        
        // Récupérer le hero section
        const heroSection = document.getElementById('heroSection');
        
        // Éléments à styliser selon le thème
        const codeDisplay = document.querySelector('.code-display');
        const codeEntree = document.getElementById('codeEntree');
        const clientNameEl = document.getElementById('clientName');
        const btnShare = document.getElementById('btnShare');
        
        // Appliquer le thème
        if (theme === 'cyan') {
            // Thème entreprise (Cyan moderne)
            root.style.setProperty('--primary', '#06b6d4');
            root.style.setProperty('--primary-dark', '#0891b2');
            header.style.background = 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)';
            
            // Hero section en bleu cyan
            if (heroSection) {
                heroSection.style.background = 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)';
                heroSection.style.boxShadow = '0 10px 40px rgba(6, 182, 212, 0.3)';
            }
            
            // Textes en blanc pour mode cyan
            if (codeDisplay) {
                codeDisplay.style.background = 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)';
                codeDisplay.style.boxShadow = '0 4px 12px rgba(6, 182, 212, 0.2)';
            }
            if (codeEntree) codeEntree.style.color = 'white';
            if (clientNameEl) {
                clientNameEl.style.color = 'white';
                clientNameEl.style.background = 'transparent';
                clientNameEl.style.border = 'none';
                clientNameEl.style.padding = '0';
            }
            if (btnShare) {
                btnShare.style.background = 'rgba(255,255,255,0.2)';
                btnShare.style.borderColor = 'rgba(255,255,255,0.3)';
                btnShare.style.color = 'white';
            }
            
            // Afficher logo LiveOwnerUnit
            if (logoLiveOwner) logoLiveOwner.style.display = 'block';
            if (logoGites) logoGites.style.display = 'none';
            if (brandName) brandName.textContent = 'LiveOwnerUnit';
        } else {
            // Thème Gîtes de France (Vert/Beige nature)
            root.style.setProperty('--primary', '#68a84f');
            root.style.setProperty('--primary-dark', '#527f3c');
            header.style.background = 'linear-gradient(135deg, #68a84f 0%, #8fbd73 100%)';
            
            // Hero section en vert Gîtes de France
            if (heroSection) {
                heroSection.style.background = 'linear-gradient(135deg, #68a84f 0%, #8fbd73 100%)';
                heroSection.style.boxShadow = '0 10px 40px rgba(104, 168, 79, 0.3)';
            }
            
            // Textes en vert Gîtes de France
            if (codeDisplay) {
                codeDisplay.style.background = 'linear-gradient(135deg, #68a84f 0%, #8fbd73 100%)';
                codeDisplay.style.boxShadow = '0 4px 12px rgba(104, 168, 79, 0.2)';
            }
            if (codeEntree) codeEntree.style.color = 'white';
            if (clientNameEl) {
                clientNameEl.style.color = 'white';
                clientNameEl.style.background = 'linear-gradient(135deg, #527f3c 0%, #68a84f 100%)';
                clientNameEl.style.border = '2px solid #8fbd73';
                clientNameEl.style.padding = '0.5rem 1rem';
                clientNameEl.style.borderRadius = '0.75rem';
                clientNameEl.style.display = 'inline-block';
            }
            if (btnShare) {
                btnShare.style.background = 'rgba(104, 168, 79, 0.2)';
                btnShare.style.borderColor = '#68a84f';
                btnShare.style.color = '#68a84f';
            }
            
            // Afficher logo Gîtes de France
            if (logoLiveOwner) logoLiveOwner.style.display = 'none';
            if (logoGites) logoGites.style.display = 'block';
            if (brandName) brandName.textContent = 'Gîtes de France';
        }
        
        // Sauvegarder le choix
        localStorage.setItem('ficheClientTheme', theme);
        
        // 📸 Réappliquer la photo de couverture après changement de thème
        if (typeof displayGitePhotos === 'function') {
            displayGitePhotos();
        }
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
