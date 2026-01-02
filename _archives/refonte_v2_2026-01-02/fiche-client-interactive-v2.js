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
