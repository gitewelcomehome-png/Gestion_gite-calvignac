// ================================================================
// FICHE CLIENT INTERACTIVE V2 - REFONTE COMPLÈTE
// ================================================================
// Structure: 7 onglets navigation, design moderne, bilingue FR/EN

const supabase = window.supabase;
import { getFAQPourGite } from './faq.js';

/**
 * GÉNÉRATION FICHE CLIENT COMPLÈTE
 */
export async function genererFicheClientComplete(reservation) {
    // Charger toutes les données
    const infosGite = loadInfosGites(reservation.gite);
    const faqGite = await getFAQPourGite(reservation.gite.toLowerCase());
    const activites = await getActivitesGite(reservation.gite);
    const prochainMenage = await getProchainMenage(reservation.gite, reservation.dateFin);
    
    const giteColor = reservation.gite === 'Trévoux' ? '#667eea' : '#f093fb';
    const giteColorDark = reservation.gite === 'Trévoux' ? '#764ba2' : '#f5576c';
    
    const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Bienvenue ${reservation.nom} - Gîte ${reservation.gite}</title>
    <style>
        ${genererStyles(giteColor, giteColorDark)}
    </style>
</head>
<body>
    ${genererHeader(reservation, infosGite, giteColor, giteColorDark)}
    ${genererNavigation()}
    
    <div class="container">
        ${genererOngletAccueil(reservation, infosGite, faqGite)}
        ${genererOngletArrivee(reservation, infosGite)}
        ${genererOngletSejour(infosGite)}
        ${genererOngletDepart(reservation, infosGite)}
        ${genererOngletDecouvrir(activites, reservation.gite)}
        ${genererOngletHoraires(reservation, prochainMenage)}
        ${genererOngletFeedback(reservation)}
    </div>
    
    ${genererScripts(reservation, infosGite)}
</body>
</html>
    `;
    
    return html;
}

/**
 * STYLES CSS COMPLETS
 */
function genererStyles(giteColor, giteColorDark) {
    return `
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        :root {
            --color-primary: ${giteColor};
            --color-primary-dark: ${giteColorDark};
            --color-success: #27AE60;
            --color-warning: #F39C12;
            --color-danger: #E74C3C;
            --color-info: #3498DB;
            --color-text: #333;
            --color-text-light: #666;
            --color-bg: #f8f9fa;
            --color-white: #ffffff;
            --shadow: 0 4px 12px rgba(0,0,0,0.1);
            --shadow-lg: 0 8px 24px rgba(0,0,0,0.15);
            --radius: 15px;
            --radius-sm: 8px;
            --transition: all 0.3s ease;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: var(--color-text);
            background: var(--color-bg);
            padding-bottom: 40px;
        }
        
        /* HEADER */
        .header {
            background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
            color: white;
            padding: 30px 20px;
            text-align: center;
            box-shadow: var(--shadow-lg);
            position: relative;
        }
        
        .header h1 {
            font-size: 2rem;
            margin-bottom: 10px;
            font-weight: 700;
        }
        
        .header-info {
            display: flex;
            flex-direction: column;
            gap: 8px;
            font-size: 1rem;
            opacity: 0.95;
            margin-top: 15px;
        }
        
        .header-info div {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
        }
        
        /* NAVIGATION ONGLETS */
        .nav-tabs {
            position: sticky;
            top: 0;
            background: white;
            box-shadow: var(--shadow);
            z-index: 1000;
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
        }
        
        .nav-tabs::-webkit-scrollbar {
            display: none;
        }
        
        .nav-tabs-list {
            display: flex;
            gap: 8px;
            padding: 12px 15px;
            min-width: min-content;
        }
        
        .nav-tab {
            flex-shrink: 0;
            padding: 12px 20px;
            background: var(--color-bg);
            border: none;
            border-radius: 25px;
            font-size: 0.9rem;
            font-weight: 500;
            color: var(--color-text);
            cursor: pointer;
            transition: var(--transition);
            white-space: nowrap;
            display: flex;
            align-items: center;
            gap: 6px;
        }
        
        .nav-tab:hover {
            background: var(--color-primary);
            color: white;
            transform: translateY(-2px);
        }
        
        .nav-tab.active {
            background: var(--color-primary);
            color: white;
            box-shadow: var(--shadow);
        }
        
        /* CONTAINER & ONGLETS */
        .container {
            max-width: 900px;
            margin: 20px auto;
            padding: 0 15px;
        }
        
        .tab-pane {
            display: none;
            animation: fadeIn 0.3s ease;
        }
        
        .tab-pane.active {
            display: block;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        /* SECTIONS */
        .section {
            background: white;
            border-radius: var(--radius);
            padding: 25px;
            margin-bottom: 20px;
            box-shadow: var(--shadow);
        }
        
        .section-title {
            font-size: 1.5rem;
            font-weight: 700;
            margin-bottom: 20px;
            color: var(--color-primary);
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .section-subtitle {
            font-size: 1.2rem;
            font-weight: 600;
            margin: 20px 0 15px 0;
            color: var(--color-text);
        }
        
        /* INFO ITEMS */
        .info-grid {
            display: grid;
            gap: 15px;
        }
        
        .info-item {
            display: flex;
            align-items: flex-start;
            gap: 10px;
            padding: 12px;
            background: var(--color-bg);
            border-radius: var(--radius-sm);
        }
        
        .info-item strong {
            min-width: 120px;
            color: var(--color-text);
        }
        
        .info-value {
            flex: 1;
            color: var(--color-text-light);
        }
        
        /* CODE BOXES */
        .code-box {
            display: inline-block;
            background: var(--color-primary);
            color: white;
            padding: 8px 20px;
            border-radius: var(--radius-sm);
            font-size: 1.5rem;
            font-weight: 700;
            letter-spacing: 3px;
            font-family: 'Courier New', monospace;
        }
        
        /* ALERTES */
        .alert {
            padding: 15px 20px;
            border-radius: var(--radius-sm);
            margin-bottom: 15px;
            display: flex;
            align-items: center;
            gap: 12px;
        }
        
        .alert-info {
            background: #e3f2fd;
            color: #1565c0;
            border-left: 4px solid var(--color-info);
        }
        
        .alert-warning {
            background: #fff3e0;
            color: #e65100;
            border-left: 4px solid var(--color-warning);
        }
        
        .alert-success {
            background: #e8f5e9;
            color: #2e7d32;
            border-left: 4px solid var(--color-success);
        }
        
        /* BUTTONS */
        .btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            padding: 14px 28px;
            border: none;
            border-radius: 25px;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: var(--transition);
            text-decoration: none;
            box-shadow: var(--shadow);
        }
        
        .btn-primary {
            background: var(--color-primary);
            color: white;
        }
        
        .btn-primary:hover {
            background: var(--color-primary-dark);
            transform: translateY(-2px);
            box-shadow: var(--shadow-lg);
        }
        
        .btn-success {
            background: var(--color-success);
            color: white;
        }
        
        .btn-lg {
            width: 100%;
            padding: 18px 28px;
            font-size: 1.1rem;
        }
        
        /* LIENS */
        a {
            color: var(--color-primary);
            text-decoration: none;
            transition: var(--transition);
        }
        
        a:hover {
            color: var(--color-primary-dark);
            text-decoration: underline;
        }
        
        /* SEARCH BAR */
        .search-box {
            position: relative;
            margin-bottom: 20px;
        }
        
        .search-input {
            width: 100%;
            padding: 15px 50px 15px 20px;
            border: 2px solid #e0e0e0;
            border-radius: 50px;
            font-size: 1rem;
            transition: var(--transition);
        }
        
        .search-input:focus {
            outline: none;
            border-color: var(--color-primary);
            box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
        }
        
        .search-icon {
            position: absolute;
            right: 20px;
            top: 50%;
            transform: translateY(-50%);
            font-size: 1.2rem;
            color: var(--color-text-light);
        }
        
        /* FAQ */
        .faq-toggle {
            text-align: center;
            margin: 20px 0;
        }
        
        .faq-container {
            max-height: 0;
            overflow: hidden;
            transition: max-height 0.3s ease;
        }
        
        .faq-container.open {
            max-height: 3000px;
        }
        
        .faq-item {
            background: var(--color-bg);
            border-radius: var(--radius-sm);
            padding: 15px;
            margin-bottom: 10px;
        }
        
        .faq-question {
            font-weight: 600;
            color: var(--color-text);
            margin-bottom: 8px;
        }
        
        .faq-answer {
            color: var(--color-text-light);
            line-height: 1.7;
        }
        
        /* CARDS */
        .card {
            background: white;
            border-radius: var(--radius-sm);
            padding: 20px;
            border-left: 4px solid var(--color-primary);
            margin-bottom: 15px;
        }
        
        .card-title {
            font-size: 1.1rem;
            font-weight: 600;
            margin-bottom: 10px;
            color: var(--color-text);
        }
        
        .card-content {
            color: var(--color-text-light);
        }
        
        /* ACTIVITÉS */
        .activites-grid {
            display: grid;
            gap: 15px;
        }
        
        .activite-card {
            background: white;
            border-radius: var(--radius-sm);
            padding: 18px;
            border-left: 4px solid var(--color-info);
            box-shadow: var(--shadow);
        }
        
        .activite-header {
            display: flex;
            justify-content: space-between;
            align-items: start;
            margin-bottom: 12px;
        }
        
        .activite-name {
            font-size: 1.1rem;
            font-weight: 600;
            color: var(--color-text);
        }
        
        .activite-badge {
            background: var(--color-info);
            color: white;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 0.85rem;
            white-space: nowrap;
        }
        
        .activite-links {
            display: flex;
            gap: 15px;
            flex-wrap: wrap;
            margin-top: 10px;
        }
        
        /* SLIDERS */
        .slider-container {
            margin: 25px 0;
        }
        
        .slider-label {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
        }
        
        .slider-label strong {
            font-size: 1.1rem;
        }
        
        .slider-value {
            font-size: 1.8rem;
            font-weight: 700;
            color: var(--color-primary);
        }
        
        .slider {
            -webkit-appearance: none;
            width: 100%;
            height: 8px;
            border-radius: 5px;
            background: #e0e0e0;
            outline: none;
            transition: var(--transition);
        }
        
        .slider::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 28px;
            height: 28px;
            border-radius: 50%;
            background: var(--color-primary);
            cursor: pointer;
            box-shadow: var(--shadow);
            transition: var(--transition);
        }
        
        .slider::-webkit-slider-thumb:hover {
            transform: scale(1.2);
            box-shadow: var(--shadow-lg);
        }
        
        .slider::-moz-range-thumb {
            width: 28px;
            height: 28px;
            border-radius: 50%;
            background: var(--color-primary);
            cursor: pointer;
            border: none;
            box-shadow: var(--shadow);
        }
        
        /* NOTES ÉTOILES */
        .rating-container {
            margin: 20px 0;
        }
        
        .rating-label {
            font-weight: 600;
            margin-bottom: 10px;
            display: block;
        }
        
        .stars {
            display: flex;
            gap: 8px;
            font-size: 2rem;
        }
        
        .star {
            cursor: pointer;
            transition: var(--transition);
            opacity: 0.3;
        }
        
        .star.active {
            opacity: 1;
        }
        
        .star:hover {
            transform: scale(1.2);
        }
        
        /* EMOJI RATING */
        .emoji-rating {
            display: flex;
            justify-content: space-around;
            margin: 25px 0;
        }
        
        .emoji {
            font-size: 3rem;
            cursor: pointer;
            opacity: 0.3;
            transition: var(--transition);
            padding: 10px;
            border-radius: 50%;
        }
        
        .emoji:hover {
            transform: scale(1.3);
            opacity: 0.7;
        }
        
        .emoji.selected {
            opacity: 1;
            background: var(--color-bg);
            box-shadow: var(--shadow);
        }
        
        /* FORMS */
        .form-group {
            margin-bottom: 20px;
        }
        
        .form-label {
            display: block;
            font-weight: 600;
            margin-bottom: 8px;
            color: var(--color-text);
        }
        
        textarea, input[type="text"] {
            width: 100%;
            padding: 12px 15px;
            border: 2px solid #e0e0e0;
            border-radius: var(--radius-sm);
            font-size: 1rem;
            font-family: inherit;
            transition: var(--transition);
        }
        
        textarea:focus, input[type="text"]:focus {
            outline: none;
            border-color: var(--color-primary);
            box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
        }
        
        textarea {
            resize: vertical;
            min-height: 100px;
        }
        
        .checkbox-group {
            display: grid;
            gap: 10px;
            margin: 15px 0;
        }
        
        .checkbox-label {
            display: flex;
            align-items: center;
            gap: 10px;
            cursor: pointer;
            padding: 10px;
            border-radius: var(--radius-sm);
            transition: var(--transition);
        }
        
        .checkbox-label:hover {
            background: var(--color-bg);
        }
        
        .checkbox-label input[type="checkbox"] {
            width: 20px;
            height: 20px;
            cursor: pointer;
        }
        
        /* CHECKLIST */
        .checklist {
            display: grid;
            gap: 10px;
            margin: 20px 0;
        }
        
        .checklist-item {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px;
            background: var(--color-bg);
            border-radius: var(--radius-sm);
        }
        
        .checklist-item input[type="checkbox"] {
            width: 24px;
            height: 24px;
            cursor: pointer;
        }
        
        /* RESPONSIVE */
        @media (min-width: 768px) {
            .header h1 {
                font-size: 2.5rem;
            }
            
            .header-info {
                flex-direction: row;
                justify-content: center;
                flex-wrap: wrap;
            }
            
            .info-grid {
                grid-template-columns: repeat(2, 1fr);
            }
            
            .activites-grid {
                grid-template-columns: repeat(2, 1fr);
            }
            
            .emoji-rating {
                justify-content: center;
                gap: 20px;
            }
        }
        
        /* UTILITY */
        .text-center { text-align: center; }
        .mt-10 { margin-top: 10px; }
        .mt-20 { margin-top: 20px; }
        .mb-10 { margin-bottom: 10px; }
        .mb-20 { margin-bottom: 20px; }
        .hidden { display: none; }
    `;
}

/**
 * GÉNÉRATION HEADER
 */
function genererHeader(reservation, infosGite, giteColor, giteColorDark) {
    const nuits = calculerNuits(reservation.dateDebut, reservation.dateFin);
    
    return `
    <div class="header">
        <h1>🏡 Bienvenue ${reservation.nom} !</h1>
        <div style="font-size: 1.3rem; margin: 10px 0;">Gîte ${reservation.gite}</div>
        <div class="header-info">
            <div>📅 ${formatDateLong(reservation.dateDebut)}</div>
            <div>→</div>
            <div>📅 ${formatDateLong(reservation.dateFin)}</div>
            <div>(${nuits} nuit${nuits > 1 ? 's' : ''})</div>
        </div>
        ${infosGite.adresse ? `
        <div class="header-info" style="margin-top: 15px;">
            <div>📍 ${infosGite.adresse}</div>
        </div>` : ''}
        ${infosGite.gpsLat && infosGite.gpsLon ? `
        <div style="margin-top: 15px;">
            <a href="https://www.google.com/maps?q=${infosGite.gpsLat},${infosGite.gpsLon}" 
               target="_blank" 
               style="color: white; text-decoration: none; font-weight: 600; background: rgba(255,255,255,0.2); padding: 10px 20px; border-radius: 25px; display: inline-block;">
                🗺️ Ouvrir dans Google Maps
            </a>
        </div>` : ''}
    </div>
    `;
}

/**
 * GÉNÉRATION NAVIGATION
 */
function genererNavigation() {
    return `
    <nav class="nav-tabs">
        <div class="nav-tabs-list">
            <button class="nav-tab active" onclick="switchTab('accueil')">
                🏠 Accueil
            </button>
            <button class="nav-tab" onclick="switchTab('arrivee')">
                🔑 Arrivée
            </button>
            <button class="nav-tab" onclick="switchTab('sejour')">
                🌍 Pendant le séjour
            </button>
            <button class="nav-tab" onclick="switchTab('depart')">
                🚪 Départ
            </button>
            <button class="nav-tab" onclick="switchTab('decouvrir')">
                🎯 À Découvrir
            </button>
            <button class="nav-tab" onclick="switchTab('horaires')">
                ⏰ Mes Horaires
            </button>
            <button class="nav-tab" onclick="switchTab('feedback')">
                💬 Feedback
            </button>
        </div>
    </nav>
    `;
}

// Suite du fichier dans la prochaine partie...
// (Continued in next message due to length)
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
// ================================================================
// SCRIPTS INTERACTIFS - PARTIE 4 (FINAL)
// ================================================================

function genererScripts(reservation, infosGite) {
    const supabaseUrl = window.SUPABASE_URL || 'https://ivqiisnudabxemcxxyru.supabase.co';
    const supabaseKey = window.SUPABASE_ANON_KEY || '';
    
    return `
    <script>
        // Configuration Supabase
        const SUPABASE_URL = '${supabaseUrl}';
        const SUPABASE_ANON_KEY = '${supabaseKey}';
        
        // ========================================
        // NAVIGATION ONGLETS
        // ========================================
        
        function switchTab(tabName) {
            // Cacher tous les onglets
            document.querySelectorAll('.tab-pane').forEach(pane => {
                pane.classList.remove('active');
            });
            
            // Retirer active de tous les boutons
            document.querySelectorAll('.nav-tab').forEach(btn => {
                btn.classList.remove('active');
            });
            
            // Afficher l'onglet sélectionné
            const selectedPane = document.getElementById('tab-' + tabName);
            if (selectedPane) {
                selectedPane.classList.add('active');
            }
            
            // Activer le bouton correspondant
            event.target.classList.add('active');
            
            // Scroll to top
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
        
        // ========================================
        // FAQ - RECHERCHE & TOGGLE
        // ========================================
        
        function rechercherFAQ(terme) {
            const resultsContainer = document.getElementById('faq-results');
            const allContainer = document.getElementById('faq-all-container');
            
            if (!terme || terme.trim() === '') {
                resultsContainer.classList.add('hidden');
                allContainer.classList.remove('open');
                return;
            }
            
            // Simuler recherche (adapter selon vos données)
            resultsContainer.classList.remove('hidden');
            resultsContainer.innerHTML = '<div class="alert alert-info">Recherche: "' + terme + '"...</div>';
        }
        
        function toggleAllFAQ() {
            const container = document.getElementById('faq-all-container');
            const btnText = document.getElementById('faq-toggle-text');
            
            if (container.classList.contains('open')) {
                container.classList.remove('open');
                btnText.textContent = 'Voir toutes les FAQ / See all FAQs';
            } else {
                container.classList.add('open');
                btnText.textContent = 'Masquer les FAQ / Hide FAQs';
            }
        }
        
        // ========================================
        // ACTIVITÉS - FILTRAGE
        // ========================================
        
        function filtrerActivites(type) {
            // Retirer active de tous les boutons
            document.querySelectorAll('[id^="filter-"]').forEach(btn => {
                btn.style.background = '#e0e0e0';
                btn.style.color = '#333';
            });
            
            // Activer le bouton cliqué
            const btn = document.getElementById('filter-' + (type === 'all' ? 'all' : type.replace(/\\s+/g, '-')));
            if (btn) {
                btn.style.background = 'var(--color-primary)';
                btn.style.color = 'white';
            }
            
            // Filtrer les cards
            const cards = document.querySelectorAll('.activite-card');
            cards.forEach(card => {
                if (type === 'all' || card.dataset.type === type) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
        }
        
        // ========================================
        // SLIDERS - HORAIRES
        // ========================================
        
        function updateSliderDisplay(type, value) {
            const displayEl = document.getElementById(type + '-display');
            const hours = Math.floor(value);
            const minutes = (value % 1) * 60;
            const timeStr = hours.toString().padStart(2, '0') + ':' + minutes.toString().padStart(2, '0');
            displayEl.textContent = timeStr;
        }
        
        async function soumettreHoraires(event) {
            event.preventDefault();
            
            const btn = document.getElementById('btn-submit-horaires');
            const form = document.getElementById('form-horaires');
            const messageDiv = document.getElementById('message-confirmation-horaires');
            
            btn.disabled = true;
            btn.textContent = '⏳ Envoi en cours... / Sending...';
            
            // Récupérer les valeurs
            const heureArrivee = document.getElementById('heure_arrivee').value;
            const heureDepart = document.getElementById('heure_depart').value;
            
            // Convertir en HH:MM
            const arriveeHours = Math.floor(heureArrivee);
            const arriveeMinutes = (heureArrivee % 1) * 60;
            const departHours = Math.floor(heureDepart);
            const departMinutes = (heureDepart % 1) * 60;
            
            const data = {
                reservation_id: parseInt(document.getElementById('reservation_id').value),
                heure_arrivee: arriveeHours.toString().padStart(2, '0') + ':' + arriveeMinutes.toString().padStart(2, '0') + ':00',
                heure_depart: departHours.toString().padStart(2, '0') + ':' + departMinutes.toString().padStart(2, '0') + ':00',
                commentaires: document.getElementById('commentaires').value || null
            };
            
            try {
                const response = await fetch(\`\${SUPABASE_URL}/rest/v1/clients_preferences\`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'apikey': SUPABASE_ANON_KEY,
                        'Authorization': \`Bearer \${SUPABASE_ANON_KEY}\`,
                        'Prefer': 'return=representation'
                    },
                    body: JSON.stringify(data)
                });
                
                if (response.ok) {
                    form.style.display = 'none';
                    messageDiv.classList.remove('hidden');
                    
                    // Enregistrer consultation
                    await fetch(\`\${SUPABASE_URL}/rest/v1/fiches_consultations\`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'apikey': SUPABASE_ANON_KEY,
                            'Authorization': \`Bearer \${SUPABASE_ANON_KEY}\`
                        },
                        body: JSON.stringify({
                            reservation_id: data.reservation_id,
                            user_agent: navigator.userAgent
                        })
                    });
                } else {
                    throw new Error('Erreur serveur');
                }
            } catch (error) {
                console.error('Erreur:', error);
                alert('Une erreur est survenue. Veuillez réessayer.\\nAn error occurred. Please try again.');
                btn.disabled = false;
                btn.textContent = '✅ Valider mes horaires / Confirm My Schedule';
            }
            
            return false;
        }
        
        // ========================================
        // FEEDBACK - NOTES & SOUMISSION
        // ========================================
        
        function selectEmoji(value) {
            document.querySelectorAll('#emoji-rating .emoji').forEach(emoji => {
                emoji.classList.remove('selected');
            });
            event.target.classList.add('selected');
            document.getElementById('note_globale').value = value;
        }
        
        function selectStar(critere, value) {
            const stars = document.querySelectorAll(\`#stars-\${critere} .star\`);
            stars.forEach((star, index) => {
                if (index < value) {
                    star.classList.add('active');
                } else {
                    star.classList.remove('active');
                }
            });
            document.getElementById(\`note_\${critere}\`).value = value;
        }
        
        function selectRecommandation(value) {
            // Reset tous
            ['oui', 'peut-etre', 'non'].forEach(v => {
                const label = document.getElementById(\`label-reco-\${v}\`).parentElement;
                label.style.background = '#e0e0e0';
                label.style.color = '#333';
            });
            
            // Activer sélectionné
            const label = document.getElementById(\`label-reco-\${value}\`).parentElement;
            label.style.background = 'var(--color-primary)';
            label.style.color = 'white';
            
            document.getElementById(\`reco-\${value}\`).checked = true;
        }
        
        async function soumettreFeedback(event) {
            event.preventDefault();
            
            const btn = document.getElementById('btn-submit-feedback');
            const form = document.getElementById('form-feedback');
            const messageDiv = document.getElementById('message-confirmation-feedback');
            
            // Vérifier note globale
            const noteGlobale = document.getElementById('note_globale').value;
            if (!noteGlobale) {
                alert('Merci de sélectionner une note globale.\\nPlease select an overall rating.');
                return false;
            }
            
            btn.disabled = true;
            btn.textContent = '⏳ Envoi en cours... / Sending...';
            
            // Récupérer catégories problèmes
            const categoriesProblemes = Array.from(document.querySelectorAll('input[name="cat_probleme"]:checked'))
                .map(cb => cb.value);
            
            const data = {
                reservation_id: parseInt(document.getElementById('feedback_reservation_id').value),
                note_globale: parseInt(noteGlobale),
                note_proprete: parseInt(document.getElementById('note_proprete').value) || null,
                note_confort: parseInt(document.getElementById('note_confort').value) || null,
                note_equipements: parseInt(document.getElementById('note_equipements').value) || null,
                note_localisation: parseInt(document.getElementById('note_localisation').value) || null,
                note_communication: parseInt(document.getElementById('note_communication').value) || null,
                points_positifs: document.getElementById('points_positifs').value || null,
                problemes_rencontres: document.getElementById('problemes_rencontres').value || null,
                suggestions: document.getElementById('suggestions').value || null,
                categories_problemes: categoriesProblemes.length > 0 ? categoriesProblemes : null,
                recommandation: document.querySelector('input[name="recommandation"]:checked')?.value || null,
                user_agent: navigator.userAgent
            };
            
            try {
                const response = await fetch(\`\${SUPABASE_URL}/rest/v1/client_feedback\`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'apikey': SUPABASE_ANON_KEY,
                        'Authorization': \`Bearer \${SUPABASE_ANON_KEY}\`,
                        'Prefer': 'return=representation'
                    },
                    body: JSON.stringify(data)
                });
                
                if (response.ok) {
                    form.style.display = 'none';
                    messageDiv.classList.remove('hidden');
                } else {
                    throw new Error('Erreur serveur');
                }
            } catch (error) {
                console.error('Erreur:', error);
                alert('Une erreur est survenue. Veuillez réessayer.\\nAn error occurred. Please try again.');
                btn.disabled = false;
                btn.textContent = '📤 Envoyer mon feedback / Send My Feedback';
            }
            
            return false;
        }
        
        // ========================================
        // INITIALISATION
        // ========================================
        
        document.addEventListener('DOMContentLoaded', function() {
            // Initialiser les sliders
            updateSliderDisplay('arrivee', document.getElementById('heure_arrivee').value);
            updateSliderDisplay('depart', document.getElementById('heure_depart').value);
            
            // Auto-focus sur recherche FAQ
            const searchInput = document.getElementById('faq-search-input');
            if (searchInput) {
                searchInput.addEventListener('focus', function() {
                    this.parentElement.style.transform = 'scale(1.02)';
                    this.parentElement.style.transition = 'all 0.3s ease';
                });
                searchInput.addEventListener('blur', function() {
                    this.parentElement.style.transform = 'scale(1)';
                });
            }
            
            console.log('✅ Fiche client initialisée');
        });
    </script>
    `;
}

// ========================================
// HELPERS ADDITIONNELS
// ========================================

async function getActivitesGite(gite) {
    try {
        const { data, error } = await window.supabase
            .from('activites_gites')
            .select('*')
            .eq('gite', gite.toLowerCase())
            .order('distance', { ascending: true });
        
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Erreur chargement activités:', error);
        return [];
    }
}

async function getProchainMenage(gite, dateApres) {
    try {
        const { data, error } = await window.supabase
            .from('cleaning_schedule')
            .select('*')
            .eq('gite', gite)
            .gte('scheduled_date', dateApres)
            .order('scheduled_date', { ascending: true })
            .limit(1)
            .single();
        
        if (error && error.code !== 'PGRST116') throw error;
        return data;
    } catch (error) {
        console.error('Erreur chargement ménage:', error);
        return null;
    }
}

function loadInfosGites(gite) {
    const allInfos = JSON.parse(localStorage.getItem('infosGites') || '{}');
    return allInfos[gite] || {};
}

// Exports
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        genererOngletAccueil,
        genererOngletArrivee,
        genererOngletSejour,
        genererOngletDepart,
        genererOngletDecouvrir,
        genererOngletHoraires,
        genererOngletFeedback,
        genererScripts,
        getActivitesGite,
        getProchainMenage,
        loadInfosGites
    };
}
