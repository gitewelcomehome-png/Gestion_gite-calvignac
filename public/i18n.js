// Traductions de l'interface Infos Pratiques
const translations = {
    fr: {
        // Titres de sections
        'section_base': 'Informations de Base',
        'section_wifi': 'WiFi & Connectivité',
        'section_arrivee': 'Arrivée & Accès',
        'section_logement': 'Logement & Équipements',
        'section_dechets': 'Déchets & Tri',
        'section_securite': 'Sécurité & Urgences',
        'section_depart': 'Départ & Check-out',
        'section_reglement': 'Règlement Intérieur',
        
        // Boutons
        'btn_switch_fr': 'Afficher en français',
        'btn_switch_en': 'Translate to English',
        'btn_auto_translate': 'Auto-traduction',
        'btn_delete_all': 'Effacer toutes les informations de ce gîte',
        'btn_save': 'Sauvegarder',
        
        // Labels Section 1: Base
        'label_adresse': 'Adresse complète',
        'label_telephone': 'Téléphone urgence',
        'label_gps_lat': 'Coordonnées GPS - Latitude',
        'label_gps_lon': 'Coordonnées GPS - Longitude',
        'label_email': 'Email contact',
        
        // Placeholders Section 1
        'placeholder_adresse': '12 rue de la République, 01600 Trévoux',
        'placeholder_telephone': '06 12 34 56 78',
        'placeholder_gps_lat': '45.9423',
        'placeholder_gps_lon': '4.7681',
        'placeholder_email': 'contact@gite-trevoux.fr',
        
        // Help texts Section 1
        'help_adresse': 'Adresse exacte avec code postal pour GPS',
        'help_telephone': 'Joignable 24h/24 pendant le séjour',
        'help_gps_lat': 'Format décimal, ex: 45.9423',
        'help_gps_lon': 'Format décimal, ex: 4.7681',
        
        // Labels Section 2: WiFi
        'label_wifi_ssid': 'Nom du réseau WiFi (SSID)',
        'label_wifi_password': 'Mot de passe WiFi',
        'label_wifi_debit': 'Débit Internet',
        'label_wifi_localisation': 'Localisation box WiFi',
        'label_wifi_zones': 'Zones de couverture',
        
        // Notifications
        'notif_saved': 'Informations sauvegardées pour',
        'notif_translating': 'Traduction en cours...',
        'notif_translated': 'Traduction terminée!',
        'notif_mode_fr': 'Mode français activé',
        'notif_mode_en': 'English mode activated',
        'notif_deleted': 'Toutes les données ont été effacées'
    },
    en: {
        // Section titles
        'section_base': 'Basic Information',
        'section_wifi': 'WiFi & Connectivity',
        'section_arrivee': 'Arrival & Access',
        'section_logement': 'Accommodation & Equipment',
        'section_dechets': 'Waste & Recycling',
        'section_securite': 'Safety & Emergencies',
        'section_depart': 'Departure & Check-out',
        'section_reglement': 'House Rules',
        
        // Buttons
        'btn_switch_fr': 'Display in French',
        'btn_switch_en': 'Show in English',
        'btn_auto_translate': 'Auto-translate',
        'btn_delete_all': 'Delete all information for this gite',
        'btn_save': 'Save',
        
        // Labels Section 1: Base
        'label_adresse': 'Full Address',
        'label_telephone': 'Emergency Phone',
        'label_gps_lat': 'GPS Coordinates - Latitude',
        'label_gps_lon': 'GPS Coordinates - Longitude',
        'label_email': 'Contact Email',
        
        // Placeholders Section 1
        'placeholder_adresse': '12 Republic Street, 01600 Trévoux',
        'placeholder_telephone': '+33 6 12 34 56 78',
        'placeholder_gps_lat': '45.9423',
        'placeholder_gps_lon': '4.7681',
        'placeholder_email': 'contact@gite-trevoux.fr',
        
        // Help texts Section 1
        'help_adresse': 'Exact address with postal code for GPS',
        'help_telephone': 'Available 24/7 during stay',
        'help_gps_lat': 'Decimal format, e.g.: 45.9423',
        'help_gps_lon': 'Decimal format, e.g.: 4.7681',
        
        // Labels Section 2: WiFi
        'label_wifi_ssid': 'WiFi Network Name (SSID)',
        'label_wifi_password': 'WiFi Password',
        'label_wifi_debit': 'Internet Speed',
        'label_wifi_localisation': 'WiFi Router Location',
        'label_wifi_zones': 'Coverage Areas',
        
        // Notifications
        'notif_saved': 'Information saved for',
        'notif_translating': 'Translation in progress...',
        'notif_translated': 'Translation completed!',
        'notif_mode_fr': 'French mode activated',
        'notif_mode_en': 'English mode activated',
        'notif_deleted': 'All data has been erased'
    }
};

// Fonction pour traduire l'interface
function translateUI(lang) {
    if (!translations[lang]) {
        console.error('Langue non supportée:', lang);
        return;
    }
    
    const t = translations[lang];
    
    // Traduire tous les éléments avec data-i18n
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        if (t[key]) {
            // Pour les labels, input, textarea
            if (element.tagName === 'LABEL') {
                element.textContent = t[key];
            }
            // Pour les placeholders
            else if (element.hasAttribute('placeholder')) {
                element.setAttribute('placeholder', t[key]);
            }
            // Pour les titres et textes
            else {
                element.textContent = t[key];
            }
        }
    });
    
    // Sauvegarder la langue dans localStorage
    localStorage.setItem('ui_language', lang);
}

// Initialiser la langue au chargement
window.translateUI = translateUI;
document.addEventListener('DOMContentLoaded', function() {
    const savedLang = localStorage.getItem('ui_language') || 'fr';
    translateUI(savedLang);
});
