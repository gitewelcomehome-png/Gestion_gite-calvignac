# 🐺 CALOU ALPHA SYSTEM - Package Complet V2.0

## ⚡ NOUVEAU : Design Premium avec Glassmorphism Ultra

**Changements majeurs :**
- Border-radius augmenté à 32px (style Premium)
- Backdrop-blur à 20px pour effet verre Apple
- Mode nuit avec fond noir pur (#050505)
- Transitions fluides avec cubic-bezier
- Navigation Pills avec états actifs
- Badges animés avec pulse
- Scrollbar personnalisée

---

## 1. CSS COMPLET (css/calou.css) - ALPHA V2.0

```css
/* =========================================
   🐺 CALOU ALPHA SYSTEM - V2.0
   =========================================
   Design system glassmorphism premium
   Mode Jour/Nuit avec transitions fluides
   ========================================= */

@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap');

/* ===== VARIABLES - MODE JOUR ===== */
:root.calou-theme {
    /* Couleurs */
    --calou-bg: #f8fafc;
    --calou-card: rgba(255, 255, 255, 0.7);
    --calou-text: #0f172a;
    --calou-border: rgba(15, 23, 42, 0.08);
    --calou-accent: #4f46e5;
    --calou-accent-hover: #4338ca;
    
    --calou-success: #10b981;
    --calou-warning: #f59e0b;
    --calou-error: #ef4444;
    
    /* Espacements */
    --calou-spacing-xs: 4px;
    --calou-spacing-sm: 8px;
    --calou-spacing-md: 16px;
    --calou-spacing-lg: 24px;
    --calou-spacing-xl: 32px;
    
    /* Ombres */
    --calou-shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.08);
    --calou-shadow-md: 0 4px 16px rgba(0, 0, 0, 0.12);
    --calou-shadow-lg: 0 8px 30px rgba(0, 0, 0, 0.15);
    
    /* Font */
    --calou-font: 'Plus Jakarta Sans', -apple-system, sans-serif;
}

/* ===== VARIABLES - MODE NUIT ===== */
:root.calou-theme.dark-mode {
    --calou-bg: #050505;
    --calou-card: rgba(255, 255, 255, 0.03);
    --calou-text: #f8fafc;
    --calou-border: rgba(255, 255, 255, 0.06);
    --calou-accent: #6366f1;
    --calou-accent-hover: #818cf8;
    --calou-glow: rgba(99, 102, 241, 0.15);
    
    --calou-shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.4);
    --calou-shadow-md: 0 4px 16px rgba(0, 0, 0, 0.5);
    --calou-shadow-lg: 0 8px 30px rgba(0, 0, 0, 0.6);
}

/* ===== STYLES DE BASE ===== */
:root.calou-theme body {
    font-family: var(--calou-font) !important;
    background: var(--calou-bg) !important;
    color: var(--calou-text) !important;
}

/* Import Font */
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;800&display=swap');

/* ===== ANIMATIONS ===== */
@keyframes pulse-alpha {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.7; transform: scale(1.02); }
}

/* ===== CARTES - EFFET GLASSMORPHISM PREMIUM ===== */
.calou-card {
    background: var(--calou-card);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid var(--calou-border);
    border-radius: 32px; /* Rayon plus large pour le style Premium */
    box-shadow: 0 10px 30px rgba(0,0,0,0.02);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.calou-card:hover {
    transform: translateY(-4px);
    border-color: var(--calou-accent);
    box-shadow: 0 20px 40px var(--calou-glow);
}

/* ===== NAVIGATION PILLS ===== */
.nav-pill {
    transition: all 0.3s ease;
    cursor: pointer;
    border-radius: 14px;
    padding: 0.5rem 1.25rem;
    font-size: 0.625rem;
    font-weight: 700;
    text-transform: uppercase;
    opacity: 0.4;
}

.nav-pill.active {
    background: var(--calou-accent);
    color: white !important;
    opacity: 1;
    box-shadow: 0 8px 15px var(--calou-glow);
}

/* ===== SCROLLBAR ÉPURÉE ===== */
::-webkit-scrollbar { 
    width: 6px; 
}

::-webkit-scrollbar-thumb { 
    background: var(--calou-border); 
    border-radius: 10px; 
}

/* ===== ALERTES ===== */
.calou-alert-warning {
    border-color: var(--calou-warning);
    background: rgba(255, 193, 7, 0.1);
}

.calou-alert-error {
    border-color: var(--calou-error);
    background: rgba(239, 68, 68, 0.1);
}

.calou-alert-info {
    border-color: var(--calou-accent);
    background: rgba(99, 102, 241, 0.1);
}

/* ===== BOUTONS ===== */
.calou-btn-primary {
    background: white;
    color: black;
    padding: 0.75rem 1.5rem;
    border-radius: 0.75rem;
    font-size: 0.625rem;
    font-weight: 900;
    text-transform: uppercase;
    border: none;
    cursor: pointer;
    transition: transform 0.1s;
}

.calou-btn-primary:hover {
    transform: scale(1.05);
}

.calou-btn-secondary { (ALPHA V2)

```html
<!-- CARTE RÉSERVATION CALOU ALPHA -->
<div class="calou-card" style="padding: 1.5rem; margin-bottom: 1rem; border-left: 8px solid #4f46e5; display: flex; flex-wrap: wrap; align-items: center; gap: 1.5rem;">
    <!-- Icône circulaire large -->
    <div style="width: 4rem; height: 4rem; background: rgba(79, 70, 229, 0.1); border-radius: 24px; display: flex; align-items: center; justify-content: center; font-size: 2rem; flex-shrink: 0;">
        🐺
ou-items-center { align-items: center; }
.calou-justify-between { justify-content: space-between; }
.calou-gap-1 { gap: 0.25rem; }
.calou-gap-2 { gap: 0.5rem; }
.calou-gap-3 { gap: 0.75rem; }
.calou-gap-4 { gap: 1rem; }
.calou-mb-2 { margin-bottom: 0.5rem; }
.calou-mb-4 { margin-bottom: 1rem; }
.calou-text-lg { font-size: 1.25rem; }
.calou-font-bold { font-weight: 700; }
.calou-font-extrabold { font-weight: 800; }
.calou-uppercase { text-transform: uppercase; }
```

## 2. STRUCTURE HTML - Carte Réservation

```html
<!-- CARTE RÉSERVATION CALOU -->
<div class="calou-card" style="padding: 1.5rem; margin-bottom: 1rem; border-left: 4px solid #6366f1;">
    <!-- Badge J-3 (optionnel) -->
    <div style="position: absolute; top: 1rem; right: 1rem; background: rgba(251, 191, 36, 0.15); border: 1px solid rgba(251, 191, 36, 0.3); color: #fbbf24; padding: 0.375rem 0.75rem; border-radius: 0.75rem; font-size: 0.75rem; font-weight: 700; animation: pulse 2s infinite;">
        ⚡ J-3 Fiche
    </div>
    
    <!-- Contenu principal -->
    <div style="display: flex; align-items: center; gap: 1.5rem;">
        <!-- Icône -->
        <div style="width: 4rem; height: 4rem; background: rgba(99, 102, 241, 0.1); border-radius: 1rem; display: flex; align-items: center; justify-content: center; font-size: 2rem; flex-shrink: 0;">
            🏠
        </div>
        
        <!-- Infos -->
        <div style="flex: 1;">
            <h3 style="font-size: 1.25rem; font-weight: 800; text-transform: uppercase; letter-spacing: -0.025em; margin-bottom: 0.5rem;">
                DUPOND
            </h3>
            <p style="font-size: 0.875rem; font-weight: 600; color: #a5b4fc; margin: 0;">
                Séjour en cours • 22/01 → 25/01
    <!-- Infos principales -->
    <div style="flex: 1; min-width: 200px;">
        <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem;">
            <h3 style="font-size: 1.25rem; font-weight: 800; text-transform: uppercase; letter-spacing: -0.025em;">
                DUPOND
            </h3>
            <!-- Badge J-3 animé -->
            <span style="background: rgba(251, 191, 36, 0.15); border: 1px solid rgba(251, 191, 36, 0.3); color: #fbbf24; padding: 0.25rem 0.5rem; border-radius: 12px; font-size: 9px; font-weight: 700; animation: pulse-alpha 2s infinite;">
                ⚡ J-3 FICHE
            </span>
        </div>
        <p style="font-size: 0.875rem; font-weight: 600; opacity: 0.6; margin: 0.25rem 0;">
            Trévoux • 22/01 au 25/01
        </p>
    </div>
    
    <!-- Actions -->
    <div style="display: flex; gap: 0.5rem; width: 100%;">
        <button class="calou-btn-primary" style="flex: 1; background: white; color: black; padding: 0.75rem 1.5rem; border-radius: 16px; font-size: 10px; font-weight: 900; text-transform: uppercase; cursor: pointer; transition: transform 0.1s;">
            📄 Fiche Client
        </button>
        <button class="calou-btn-secondary" style="padding: 0.75rem; border-radius: 16px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.05);">
            ✏️
        </button>
    </div>
</div>
```

**✨ Nouveautés :**
- Border-left de 8px au lieu de 4px
- Border-radius 24px pour l'icône
- Badge J-3 inline avec animation pulse-alpha
- Boutons avec border-radius 16px (plus doux)
- Layout flex-wrap pour responsive
- Couleur indigo #4f46e5 (au lieu de #6366f1) <!-- Icône -->
    <div style="width: 3rem; height: 3rem; background: rgba(16, 185, 129, 0.1); border-radius: 0.75rem; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; flex-shrink: 0;">
        🌅
    </div>
    
    <!-- Infos -->
    <div style="flex: 1;">
        <div style="font-weight: 700; color: #6366f1; margin-bottom: 0.25rem; font-size: 1rem;">
            Trévoux
        </div>
        <div style="font-size: 0.875rem; opacity: 0.7;">
            📅 20/01/2026
        </div>
    </div>
    
    <!-- Statut -->
    <div style="display: flex; align-items: center; gap: 0.75rem;">
        <span style="padding: 0.375rem 0.75rem; background: #10b981; color: white; border-radius: 0.75rem; font-weight: 700; font-size: 0.75rem; text-transform: uppercase;">
            Validé
        </span>
        <span style="font-size: 1.5rem;">✅</span>
    </div>
</div>
```

## 4. STRUCTURE HTML - Alerte

```html
<!-- ALERTE CALOU -->
<div class="calou-card calou-alert-warning" style="padding: 1rem 1.25rem; margin-bottom: 1rem; display: flex; align-items: center; gap: 1rem; cursor: pointer; transition: transform 0.2s;">
    <span style="font-size: 1.5rem;">📄</span>
    <span style="flex: 1; font-weight: 600;">1 fiche(s) client à envoyer (J-3)</span>
    <span style="font-size: 1.2rem; opacity: 0.7;">→</span>
</div>
```

## 5. JAVASCRIPT - Toggle Jour/Nuit

```javascript
// Toggle entre CALOU et Neo-Brutalism
function toggleCalouTheme() {
    const html = document.documentElement;
    const isActive = html.classList.contains('calou-theme');
    
    if (isActive) {
        html.classList.remove('calou-theme');
        document.body.classList.remove('calou-body');
        localStorage.setItem('calou-theme-enabled', 'false');
    } else {
        html.classList.add('calou-theme');
        document.body.classList.add('calou-body');
        localStorage.setItem('calou-theme-enabled', 'true');
        
        // Charger le CSS si pas présent
        if (!document.querySelector('link[href*="calou.css"]')) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'css/calou.css';
            document.head.appendChild(link);
        }
    }
    
    setTimeout(() => location.reload(), 300);
}

// Toggle Jour/Nuit (seulement si CALOU actif)
function toggleDarkMode() {
    const html = document.documentElement;
    
    if (!html.classList.contains('calou-theme')) {
        alert('Activez d\'abord le mode CALOU');
        return;
    }
    
    const isDark = html.classList.contains('dark-mode');
    html.classList.toggle('dark-mode');
    localStorage.setItem('dark-mode-enabled', (!isDark).toString());
}

// Init au chargement
document.addEventListener('DOMContentLoaded', function() {
    const calouEnabled = localStorage.getItem('calou-theme-enabled') === 'true';
    
    if (calouEnabled) {
        document.documentElement.classList.add('calou-theme');
        document.body.classList.add('calou-body');
        
        // Charger CSS
        if (!document.querySelector('link[href*="calou.css"]')) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'css/calou.css';
            document.head.appendChild(link);
        }
        
        // Restaurer mode nuit
        const darkEnabled = localStorage.getItem('dark-mode-enabled') === 'true';
        if (darkEnabled) {
            document.documentElement.classList.add('dark-mode');
        }
    }
});
```

## 6. HTML - Boutons Toggle

```html
<!-- Dans le menu utilisateur -->
<button onclick="toggleCalouTheme()" style="display: flex; align-items: center; gap: 8px;">
    <span>🐺</span>
    <span id="calouToggleLabel">Activer CALOU</span>
</button>

<button onclick="toggleDarkMode()" style="display: flex; align-items: center; gap: 8px;">
    <span id="darkModeIcon">☀️</span>
    <span id="darkModeToggleLabel">Mode Nuit 🌙</span>
</button>
```

## 7. GÉNÉRATION DYNAMIQUE - Dashboard JavaScript

```javascript
// Fonction helper pour détecter CALOU
function isCalouActive() {
    return document.documentElement.classList.contains('calou-theme');
}

// Générer les cartes de réservation
function renderReservation(reservation) {
    if (isCalouActive()) {
        // VERSION CALOU
        return `
            <div class="calou-card" style="padding: 1.5rem; margin-bottom: 1rem; border-left: 4px solid ${reservation.giteColor};">
                <div style="display: flex; align-items: center; gap: 1.5rem;">
                    <div style="width: 4rem; height: 4rem; background: rgba(99, 102, 241, 0.1); border-radius: 1rem; display: flex; align-items: center; justify-content: center; font-size: 2rem;">
                        ${reservation.icon}
                    </div>
                    <div style="flex: 1;">
                        <h3 style="font-size: 1.25rem; font-weight: 800; text-transform: uppercase;">${reservation.nom}</h3>
                        <p style="font-size: 0.875rem; font-weight: 600; color: ${reservation.statusColor};">
                            ${reservation.status} • ${reservation.dates}
                        </p>
                        <div style="display: flex; gap: 1rem; margin-top: 0.5rem; font-size: 0.8rem; opacity: 0.6;">
                            <span>🏠 ${reservation.gite}</span>
                            <span>👥 ${reservation.nbPersonnes}</span>
                            <span>🕐 ${reservation.horaires}</span>
                        </div>
                    </div>
                </div>
                <div style="display: flex; gap: 0.5rem; margin-top: 1rem;">
                    <button class="calou-btn-primary" style="flex: 1;">📄 Fiche Client</button>
                    <button class="calou-btn-secondary">✏️</button>
                </div>
            </div>
        `;
    } else {
        // VERSION NEO-BRUTALISM (original)
        return `<!-- votre ancien HTML -->`;
    }
}
```

## 8. COULEURS PAR STATUT

```javascript
// Mapping des couleurs selon le statut
const STATUS_COLORS = {
    'en_cours': {
        border: '#6366f1',      // Indigo
        bg: 'rgba(99, 102, 241, 0.1)',
        text: '#a5b4fc',
        icon: '🏠'
    },
    'arrivee_prochaine': {
        border: '#f59e0b',      // Amber
        bg: 'rgba(245, 158, 11, 0.1)',
        text: '#fbbf24',
        icon: '📅'
    },
    'termine': {
        border: '#10b981',      // Green
        bg: 'rgba(16, 185, 129, 0.1)',
        text: '#34d399',
        icon: '✅'
    }
};
```

## 9. CLASSES CSS IMPORTANTES

```css
/* Bordures colorées */
.border-indigo { border-left-color: #6366f1 !important; }
.border-amber { border-left-color: #f59e0b !important; }
.border-green { border-left-color: #10b981 !important; }

/* Backgrounds pour icônes */
.bg-indigo-10 { background: rgba(99, 102, 241, 0.1); }
.bg-amber-10 { background: rgba(245, 158, 11, 0.1); }
.bg-green-10 { background: rgba(16, 185, 129, 0.1); }

/* Couleurs de texte */
.text-indigo { color: #a5b4fc; }
.text-amber { color: #fbbf24; }
.text-green { color: #34d399; }
```

## 10. EXEMPLE COMPLET - Page Dashboard

```html
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard CALOU</title>
    <link rel="stylesheet" href="css/calou.css">
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
            <h1 style="font-size: 2rem; font-weight: 800; text-transform: uppercase;">Dashboard</h1>
            <div style="display: flex; gap: 1rem;">
                <button onclick="toggleCalouTheme()">🐺 CALOU</button>
                <button onclick="toggleDarkMode()">🌙</button>
            </div>
        </div>
        
        <!-- Alertes -->
        <div id="dashboard-alerts"></div>
        
        <!-- Réservations -->
        <h2 style="font-size: 0.75rem; font-weight: 800; text-transform: uppercase; opacity: 0.3; letter-spacing: 0.3em; margin-bottom: 1rem;">
            Réservations de la semaine
        </h2>
        <div id="dashboard-reservations"></div>
        
        <!-- Ménages -->
        <h2 style="font-size: 0.75rem; font-weight: 800; text-transform: uppercase; opacity: 0.3; letter-spacing: 0.3em; margin-top: 2rem; margin-bottom: 1rem;">
            Ménages prévus
        </h2>
        <div id="dashboard-menages"></div>
    </div>
    
    <script src="js/calou-tab.js"></script>
    <script src="js/dashboard.js"></script>
</body> - ALPHA V2.0

- **Glassmorphism Premium** : backdrop-filter: blur(20px) sur toutes les cartes
- **Border-radius** : 32px pour les cartes (style Apple), 14-24px pour les éléments internes
- **Font** : Plus Jakarta Sans, poids 800 pour les titres, 700 pour labels
- **Gaps** : 1rem à 1.5rem entre éléments (inchangé)
- **Mode nuit** : fond #050505 (noir pur) avec cards à 3% opacity (ultra transparent)
- **Animations** : pulse-alpha pour badges, transitions cubic-bezier(0.4, 0, 0.2, 1)
- **Transitions** : 0.3s à 0.4s avec courbe bezier fluide
- **Scrollbar** : 6px épurée avec hover accent
- **Glow effect** : box-shadow avec --calou-glow sur hover
- **Border épais** : 8px au lieu de 4px pour les cartes importantes
- **Navigation** : Pills avec états actifs et shadow pour les titres
- **Gaps** : 1rem à 1.5rem entre éléments
- **Mode nuit** : fond #0a0e1a au lieu de noir pur
- **Animations** : pulse pour les badges urgents
- **Transitions** : 0.2s à 0.3s sur hover

## STRUCTURE FICHIERS

```
css/
  └── calou.css (fichier unique)
js/
  ├── calou-tab.js (toggle themes)
  └── dashboard.js (logique dashboard)
tabs/
  └── tab-dashboard-calou.html
```
