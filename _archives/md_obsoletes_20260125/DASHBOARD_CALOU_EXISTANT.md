# 🐺 DASHBOARD CALOU - CODE EXISTANT COMPLET

> **Pour modification externe** : Donnez ce fichier à une autre IA, récupérez les modifications, et renvoyez-moi le fichier modifié pour application.

---

## 📋 TABLE DES MATIÈRES

1. [CSS Complet (579 lignes)](#1-css-complet)
2. [Structure HTML Dashboard](#2-structure-html-dashboard)
3. [JavaScript - Génération Cartes Réservations](#3-javascript-génération-réservations)
4. [JavaScript - Génération Cartes Ménages](#4-javascript-génération-ménages)
5. [JavaScript - Génération Alertes](#5-javascript-génération-alertes)
6. [Exemples HTML Réels](#6-exemples-html-réels)

---

## 1. CSS COMPLET

**Fichier** : `css/calou.css` (579 lignes)

```css
/* =========================================
   🐺 CALOU ALPHA SYSTEM - V2.0
   =========================================
   Design system glassmorphism premium
   Mode Jour/Nuit avec transitions fluides
   ========================================= */

@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap');

/* =========================================
   VARIABLES - MODE JOUR
   ========================================= */
:root.calou-theme {
    /* Couleurs principales */
    --calou-bg: #f8fafc;
    --calou-card: rgba(255, 255, 255, 0.7);
    --calou-text: #0f172a;
    --calou-border: rgba(15, 23, 42, 0.08);
    --calou-accent: #4f46e5;
    --calou-accent-hover: #4338ca;
    --calou-glow: rgba(79, 70, 229, 0.1);
    
    /* Couleurs sémantiques */
    --calou-success: #10b981;
    --calou-success-bg: rgba(16, 185, 129, 0.1);
    --calou-warning: #f59e0b;
    --calou-warning-bg: rgba(245, 158, 11, 0.1);
    --calou-error: #ef4444;
    --calou-error-bg: rgba(239, 68, 68, 0.1);
    --calou-info: #6366f1;
    --calou-info-bg: rgba(99, 102, 241, 0.1);
    
    /* Espacements */
    --calou-spacing-xs: 4px;
    --calou-spacing-sm: 8px;
    --calou-spacing-md: 16px;
    --calou-spacing-lg: 24px;
    --calou-spacing-xl: 32px;
    --calou-spacing-2xl: 48px;
    
    /* Ombres */
    --calou-shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.04);
    --calou-shadow-md: 0 10px 30px rgba(0, 0, 0, 0.02);
    --calou-shadow-lg: 0 20px 40px rgba(0, 0, 0, 0.05);
    --calou-shadow-xl: 0 30px 60px rgba(0, 0, 0, 0.08);
    
    /* Border radius */
    --calou-radius-sm: 14px;
    --calou-radius-md: 20px;
    --calou-radius-lg: 32px;
    
    /* Font */
    --calou-font: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

/* =========================================
   VARIABLES - MODE NUIT
   ========================================= */
:root.calou-theme.dark-mode {
    --calou-bg: #050505;
    --calou-card: rgba(255, 255, 255, 0.03);
    --calou-text: #f8fafc;
    --calou-border: rgba(255, 255, 255, 0.06);
    --calou-accent: #6366f1;
    --calou-accent-hover: #818cf8;
    --calou-glow: rgba(99, 102, 241, 0.15);
    
    --calou-success-bg: rgba(16, 185, 129, 0.08);
    --calou-warning-bg: rgba(245, 158, 11, 0.08);
    --calou-error-bg: rgba(239, 68, 68, 0.08);
    --calou-info-bg: rgba(99, 102, 241, 0.08);
    
    --calou-shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.5);
    --calou-shadow-md: 0 10px 30px rgba(0, 0, 0, 0.6);
    --calou-shadow-lg: 0 20px 40px rgba(0, 0, 0, 0.7);
    --calou-shadow-xl: 0 30px 60px rgba(0, 0, 0, 0.8);
}

/* =========================================
   STYLES DE BASE
   ========================================= */
:root.calou-theme body {
    font-family: var(--calou-font) !important;
    background: var(--calou-bg) !important;
    color: var(--calou-text) !important;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
}

/* =========================================
   ANIMATIONS
   ========================================= */
@keyframes pulse-alpha {
    0%, 100% { 
        opacity: 1; 
        transform: scale(1); 
    }
    50% { 
        opacity: 0.7; 
        transform: scale(1.02); 
    }
}

@keyframes fade-in {
    from { 
        opacity: 0; 
        transform: translateY(10px); 
    }
    to { 
        opacity: 1; 
        transform: translateY(0); 
    }
}

@keyframes slide-in {
    from { 
        opacity: 0; 
        transform: translateX(-20px); 
    }
    to { 
        opacity: 1; 
        transform: translateX(0); 
    }
}

/* =========================================
   CARTES - EFFET GLASSMORPHISM PREMIUM
   ========================================= */
.calou-card {
    background: var(--calou-card);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid var(--calou-border);
    border-radius: var(--calou-radius-lg);
    box-shadow: var(--calou-shadow-md);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
}

.calou-card:hover {
    transform: translateY(-4px);
    border-color: var(--calou-accent);
    box-shadow: var(--calou-shadow-lg);
}

.calou-card:active {
    transform: translateY(-2px);
}

/* Carte avec bordure gauche colorée */
.calou-card-bordered {
    border-left-width: 8px;
    border-left-style: solid;
    padding: 1.5rem;
}

.calou-card-bordered.border-indigo {
    border-left-color: #4f46e5;
}

.calou-card-bordered.border-amber {
    border-left-color: #f59e0b;
}

.calou-card-bordered.border-green {
    border-left-color: #10b981;
}

.calou-card-bordered.border-rose {
    border-left-color: #f43f5e;
}

/* =========================================
   ALERTES
   ========================================= */
.calou-alert {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem 1.25rem;
    margin-bottom: 1rem;
    cursor: pointer;
    transition: all 0.2s ease;
    border-radius: var(--calou-radius-md);
}

.calou-alert:hover {
    transform: translateX(4px);
}

.calou-alert-warning {
    border: 1px solid var(--calou-warning);
    background: var(--calou-warning-bg);
}

.calou-alert-error {
    border: 1px solid var(--calou-error);
    background: var(--calou-error-bg);
}

.calou-alert-info {
    border: 1px solid var(--calou-info);
    background: var(--calou-info-bg);
}

.calou-alert-success {
    border: 1px solid var(--calou-success);
    background: var(--calou-success-bg);
}

/* =========================================
   BOUTONS
   ========================================= */
.calou-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    font-size: 0.625rem;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    border: none;
    border-radius: var(--calou-radius-sm);
    cursor: pointer;
    transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
}

.calou-btn:active {
    transform: scale(0.98);
}

.calou-btn-primary {
    background: white;
    color: black;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.calou-btn-primary:hover {
    transform: scale(1.05);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
}

.calou-btn-secondary {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.05);
    color: var(--calou-text);
}

.calou-btn-secondary:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.1);
}

.calou-btn-accent {
    background: var(--calou-accent);
    color: white;
    box-shadow: 0 8px 15px var(--calou-glow);
}

.calou-btn-accent:hover {
    background: var(--calou-accent-hover);
    transform: translateY(-2px);
    box-shadow: 0 12px 20px var(--calou-glow);
}

/* Bouton icône */
.calou-btn-icon {
    width: 3rem;
    height: 3rem;
    padding: 0;
    border-radius: var(--calou-radius-md);
}

/* =========================================
   NAVIGATION PILLS
   ========================================= */
.nav-pill {
    padding: 0.5rem 1.25rem;
    font-size: 0.625rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    border-radius: var(--calou-radius-sm);
    cursor: pointer;
    transition: all 0.3s ease;
    opacity: 0.4;
}

.nav-pill:hover {
    opacity: 1;
}

.nav-pill.active {
    background: var(--calou-accent);
    color: white !important;
    opacity: 1;
    box-shadow: 0 8px 15px var(--calou-glow);
}

/* =========================================
   BADGES
   ========================================= */
.calou-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.375rem 0.75rem;
    font-size: 0.75rem;
    font-weight: 700;
    border-radius: var(--calou-radius-sm);
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.calou-badge-primary {
    background: var(--calou-info-bg);
    color: var(--calou-info);
    border: 1px solid var(--calou-info);
}

.calou-badge-warning {
    background: var(--calou-warning-bg);
    color: var(--calou-warning);
    border: 1px solid var(--calou-warning);
}

.calou-badge-success {
    background: var(--calou-success-bg);
    color: var(--calou-success);
    border: 1px solid var(--calou-success);
}

.calou-badge-error {
    background: var(--calou-error-bg);
    color: var(--calou-error);
    border: 1px solid var(--calou-error);
}

.pulse-badge {
    animation: pulse-alpha 2s infinite;
}

/* =========================================
   ICÔNES CIRCULAIRES
   ========================================= */
.calou-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--calou-radius-md);
    flex-shrink: 0;
    font-size: 2rem;
}

.calou-icon-sm {
    width: 2.5rem;
    height: 2.5rem;
    font-size: 1.25rem;
}

.calou-icon-md {
    width: 4rem;
    height: 4rem;
    font-size: 2rem;
}

.calou-icon-lg {
    width: 5rem;
    height: 5rem;
    font-size: 2.5rem;
}

.calou-icon-indigo {
    background: rgba(79, 70, 229, 0.1);
    color: #4f46e5;
}

.calou-icon-amber {
    background: rgba(245, 158, 11, 0.1);
    color: #f59e0b;
}

.calou-icon-green {
    background: rgba(16, 185, 129, 0.1);
    color: #10b981;
}

.calou-icon-rose {
    background: rgba(244, 63, 94, 0.1);
    color: #f43f5e;
}

/* =========================================
   TITRES & TYPOGRAPHIE
   ========================================= */
.calou-title {
    font-size: 1.25rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: -0.025em;
    line-height: 1.2;
}

.calou-subtitle {
    font-size: 0.875rem;
    font-weight: 600;
    opacity: 0.6;
}

.calou-label {
    font-size: 0.625rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.3em;
    opacity: 0.3;
}

.calou-text-accent {
    color: var(--calou-accent);
}

/* =========================================
   LAYOUT UTILITAIRES
   ========================================= */
.calou-flex {
    display: flex;
}

.calou-flex-col {
    display: flex;
    flex-direction: column;
}

.calou-items-center {
    align-items: center;
}

.calou-justify-between {
    justify-content: space-between;
}

.calou-justify-center {
    justify-content: center;
}

.calou-gap-1 {
    gap: 0.25rem;
}

.calou-gap-2 {
    gap: 0.5rem;
}

.calou-gap-3 {
    gap: 0.75rem;
}

.calou-gap-4 {
    gap: 1rem;
}

.calou-gap-6 {
    gap: 1.5rem;
}

/* Marges */
.calou-mb-1 { margin-bottom: 0.25rem; }
.calou-mb-2 { margin-bottom: 0.5rem; }
.calou-mb-3 { margin-bottom: 0.75rem; }
.calou-mb-4 { margin-bottom: 1rem; }
.calou-mb-6 { margin-bottom: 1.5rem; }
.calou-mb-8 { margin-bottom: 2rem; }

.calou-mt-1 { margin-top: 0.25rem; }
.calou-mt-2 { margin-top: 0.5rem; }
.calou-mt-3 { margin-top: 0.75rem; }
.calou-mt-4 { margin-top: 1rem; }
.calou-mt-6 { margin-top: 1.5rem; }

/* Padding */
.calou-p-4 { padding: 1rem; }
.calou-p-6 { padding: 1.5rem; }
.calou-p-8 { padding: 2rem; }

/* =========================================
   SCROLLBAR PERSONNALISÉE
   ========================================= */
:root.calou-theme ::-webkit-scrollbar {
    width: 6px;
    height: 6px;
}

:root.calou-theme ::-webkit-scrollbar-track {
    background: transparent;
}

:root.calou-theme ::-webkit-scrollbar-thumb {
    background: var(--calou-border);
    border-radius: 10px;
}

:root.calou-theme ::-webkit-scrollbar-thumb:hover {
    background: var(--calou-accent);
}

/* =========================================
   GRILLES STATISTIQUES
   ========================================= */
.calou-stat-card {
    padding: 2rem;
    border-radius: var(--calou-radius-lg);
}

.calou-stat-label {
    font-size: 0.625rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    opacity: 0.4;
}

.calou-stat-value {
    font-size: 3rem;
    font-weight: 800;
    letter-spacing: -0.05em;
    line-height: 1;
    margin-top: 1rem;
}

.calou-stat-unit {
    font-size: 1.25rem;
    opacity: 0.3;
}

/* =========================================
   RESPONSIVE
   ========================================= */
@media (max-width: 768px) {
    .calou-card {
        border-radius: var(--calou-radius-md);
    }
    
    .calou-title {
        font-size: 1rem;
    }
    
    .calou-stat-value {
        font-size: 2rem;
    }
}

/* =========================================
   OVERRIDES POUR L'EXISTANT
   ========================================= */
:root.calou-theme .reservation-card,
:root.calou-theme .cleaning-card,
:root.calou-theme .stat-card {
    background: var(--calou-card) !important;
    backdrop-filter: blur(20px) !important;
    border: 1px solid var(--calou-border) !important;
    border-radius: var(--calou-radius-lg) !important;
}

:root.calou-theme button {
    font-family: var(--calou-font) !important;
}

:root.calou-theme h1,
:root.calou-theme h2,
:root.calou-theme h3,
:root.calou-theme h4 {
    font-family: var(--calou-font) !important;
}
```

---

## 2. STRUCTURE HTML DASHBOARD

```html
<div id="tab-dashboard" class="tab-content active">
    <!-- Alertes -->
    <div id="dashboard-alerts"></div>
    
    <!-- Titre section réservations -->
    <h2 class="calou-label" style="margin-bottom: 1rem; padding-left: 4px;">
        Réservations de la semaine
    </h2>
    
    <!-- Container réservations -->
    <div id="dashboard-reservations"></div>
    
    <!-- Titre section ménages -->
    <h2 class="calou-label" style="margin-top: 2rem; margin-bottom: 1rem; padding-left: 4px;">
        Ménages prévus
    </h2>
    
    <!-- Container ménages -->
    <div id="dashboard-menages"></div>
</div>
```

---

## 3. JAVASCRIPT - GÉNÉRATION RÉSERVATIONS

**Code actuel** dans `js/dashboard.js` (lignes 289-555) :

```javascript
// 🐺 DÉTECTION CALOU
function isCalouActive() {
    return document.documentElement.classList.contains('calou-theme');
}

async function updateDashboardReservations() {
    const reservations = await getAllReservations();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Horaires
    const horairesMap = {};
    reservations.forEach(r => {
        horairesMap[r.id] = {
            arrivee: r.check_in_time || '17:00',
            depart: r.check_out_time || '10:00'
        };
    });
    
    // Filtrage 7 prochains jours
    const in7Days = new Date(today);
    in7Days.setDate(today.getDate() + 6);
    
    const uniqueById = {};
    reservations.forEach(r => {
        if (!uniqueById[r.id]) uniqueById[r.id] = r;
    });
    const uniqueReservations = Object.values(uniqueById);
    
    const filtered = uniqueReservations.filter(r => {
        const dateDebut = parseLocalDate(r.dateDebut);
        const dateFin = parseLocalDate(r.dateFin);
        dateDebut.setHours(0, 0, 0, 0);
        dateFin.setHours(0, 0, 0, 0);
        
        if (dateFin <= today) return false;
        
        const nuits = Math.ceil((dateFin - dateDebut) / (1000 * 60 * 60 * 24));
        if (nuits <= 1) return false;
        
        if (dateDebut >= today && dateDebut <= in7Days) return true;
        if (dateFin >= today && dateFin <= in7Days && dateDebut < today) return true;
        
        return false;
    }).sort((a, b) => parseLocalDate(a.dateDebut) - parseLocalDate(b.dateDebut));
    
    const container = document.getElementById('dashboard-reservations');
    if (!container) return;
    
    if (filtered.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #999; padding: 40px;">Aucune réservation dans les 7 prochains jours</p>';
        return;
    }
    
    let html = '';
    for (const r of filtered) {
        const dateDebut = parseLocalDate(r.dateDebut);
        const dateFin = parseLocalDate(r.dateFin);
        dateDebut.setHours(0, 0, 0, 0);
        dateFin.setHours(0, 0, 0, 0);
        
        const isArrivalToday = dateDebut.getTime() === today.getTime();
        const isDepartureToday = dateFin.getTime() === today.getTime();
        
        const horaireArrivee = horairesMap[r.id]?.arrivee || '17:00';
        const horaireDepart = horairesMap[r.id]?.depart || '10:00';
        
        let checklistProgress = { entree: { total: 0, completed: 0, percent: 0 }, sortie: { total: 0, completed: 0, percent: 0 } };
        
        let badge = '';
        let badgeColor = '';
        if (isArrivalToday) {
            badge = '📥 Arrivée AUJOURD\'HUI';
            badgeColor = '#27AE60';
        } else if (isDepartureToday) {
            badge = '📤 Départ AUJOURD\'HUI';
            badgeColor = '#E74C3C';
        } else if (dateDebut > today) {
            badge = '📥 Arrivée prochaine';
            badgeColor = '#3498DB';
        } else {
            badge = '🏠 Séjour en cours';
            badgeColor = '#9B59B6';
        }
        
        const gite = await window.gitesManager.getByName(r.gite) || await window.gitesManager.getById(r.gite_id);
        const giteColor = gite ? gite.color : '#667eea';
        const paiementIcon = r.paiement === 'Soldé' ? '✅' : r.paiement === 'Acompte reçu' ? '⏳' : '❌';
        
        const daysUntilArrival = Math.ceil((dateDebut - today) / (1000 * 60 * 60 * 24));
        const shouldSendReminder = daysUntilArrival === 3;
        const showFicheButton = dateFin > today;
        
        let checklistHtml = '';
        // Checklist progress HTML generation...
        
        // 💻 VERSION DESKTOP
        const isMobile = window.innerWidth <= 768;
        
        if (!isMobile) {
            console.log('🎨 Mode CALOU actif:', isCalouActive(), 'pour', r.nom);
            if (isCalouActive()) {
                // 🐺 VERSION CALOU - Style glassmorphism moderne
                const statusEmoji = badge.includes('en cours') ? '🏠' : badge.includes('prochaine') ? '📅' : badge.includes('Terminé') ? '✅' : '📆';
                const borderColor = badge.includes('en cours') ? '#4f46e5' : 
                                   badge.includes('prochaine') ? '#f59e0b' : 
                                   badge.includes('Terminé') ? '#10b981' : '#64748b';
                const iconBg = badge.includes('en cours') ? 'rgba(79, 70, 229, 0.1)' : 
                              badge.includes('prochaine') ? 'rgba(245, 158, 11, 0.1)' : 
                              badge.includes('Terminé') ? 'rgba(16, 185, 129, 0.1)' : 'rgba(100, 116, 139, 0.1)';
                const statusTextColor = badge.includes('en cours') ? '#a5b4fc' : 
                                       badge.includes('prochaine') ? '#fbbf24' : 
                                       badge.includes('Terminé') ? '#34d399' : '#94a3b8';
                
                html += `
                    <div class="calou-card" style="padding: 1.5rem; margin-bottom: 1rem; border-left: 8px solid ${borderColor}; position: relative;">
                        ${shouldSendReminder ? '<div style="position: absolute; top: 1rem; right: 1rem; background: rgba(251, 191, 36, 0.15); border: 1px solid rgba(251, 191, 36, 0.3); color: #fbbf24; padding: 0.375rem 0.75rem; border-radius: 14px; font-size: 0.75rem; font-weight: 700; animation: pulse-alpha 2s infinite;">⚡ J-3</div>' : ''}
                        
                        <div style="display: flex; align-items: center; gap: 1.5rem; margin-bottom: 1rem;">
                            <div style="width: 4rem; height: 4rem; background: ${iconBg}; border-radius: 20px; display: flex; align-items: center; justify-content: center; font-size: 2rem; flex-shrink: 0;">
                                ${statusEmoji}
                            </div>
                            
                            <div style="flex: 1; min-width: 0;">
                                <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem; flex-wrap: wrap;">
                                    <h3 style="font-size: 1.25rem; font-weight: 800; text-transform: uppercase; letter-spacing: -0.025em; margin: 0; line-height: 1.2;">${r.nom}</h3>
                                    <span style="font-size: 1.25rem; opacity: 0.5;" title="${r.paiement}">${paiementIcon}</span>
                                </div>
                                
                                <p style="font-size: 0.875rem; font-weight: 600; color: ${statusTextColor}; margin: 0 0 0.5rem 0;">
                                    ${badge} • ${formatDateFromObj(dateDebut)} → ${formatDateFromObj(dateFin)}
                                </p>
                                
                                <div style="display: flex; gap: 1rem; font-size: 0.8rem; opacity: 0.6; flex-wrap: wrap;">
                                    <span>🏠 ${r.gite}</span>
                                    <span>👥 ${r.nbPersonnes || '-'}</span>
                                    <span>🕐 ${horaireArrivee} → ${horaireDepart}</span>
                                    <span style="font-weight: 600;">${r.nuits}n</span>
                                    ${daysUntilArrival >= 0 ? `<span style="font-weight: 700; ${daysUntilArrival <= 3 ? 'color: #fbbf24;' : ''}">J${daysUntilArrival > 0 ? '-' + daysUntilArrival : ''}</span>` : ''}
                                </div>
                                
                                ${checklistHtml}
                            </div>
                        </div>
                        
                        <div style="display: flex; gap: 0.5rem;">
                            ${showFicheButton ? `
                            <button onclick="aperçuFicheClient('${r.id}')" class="calou-btn-primary" style="flex: 1; background: white; color: black; padding: 0.75rem 1.5rem; font-size: 0.625rem; font-weight: 900; text-transform: uppercase; border-radius: 16px; border: none; cursor: pointer; transition: transform 0.1s; box-shadow: 0 2px 8px rgba(0,0,0,0.08);" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                                📄 Fiche Client
                            </button>
                            ` : ''}
                            <button onclick="openEditReservation('${r.id}')" class="calou-btn-secondary" style="padding: 0.75rem 1rem; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 16px; cursor: pointer; transition: background 0.2s; font-size: 1.2rem;" onmouseover="this.style.background='rgba(255, 255, 255, 0.1)'" onmouseout="this.style.background='rgba(255, 255, 255, 0.05)'">
                                ✏️
                            </button>
                        </div>
                    </div>
                `;
            } else {
                // ⚡ VERSION NEO-BRUTALISM (code original)
                html += `<!-- Version Neo-Brutalism non affichée ici -->`;
            }
        }
    }
    
    container.innerHTML = html;
}
```

---

## 4. JAVASCRIPT - GÉNÉRATION MÉNAGES

**Code actuel** dans `js/dashboard.js` (lignes 556-645) :

```javascript
async function updateDashboardMenages() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay() + 1);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    
    const { data: cleanings } = await window.supabaseClient
        .from('cleaning_schedule')
        .select('*')
        .gte('scheduled_date', weekStart.toISOString().split('T')[0])
        .lte('scheduled_date', weekEnd.toISOString().split('T')[0])
        .order('scheduled_date', { ascending: true });
    
    const container = document.getElementById('dashboard-menages');
    if (!container) return;
    
    if (!cleanings || cleanings.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #999; padding: 40px;">Aucun ménage prévu cette semaine</p>';
        return;
    }
    
    let html = '';
    for (const c of cleanings) {
        const statusIcons = {
            'validated': '✅',
            'pending_validation': '⏳',
            'refused': '❌',
            'pending': '✗'
        };
        const statusColors = {
            'validated': '#27AE60',
            'pending_validation': '#F39C12',
            'refused': '#E74C3C',
            'pending': '#E74C3C'
        };
        
        const statusLabels = {
            'validated': 'Validé',
            'pending_validation': 'En attente',
            'refused': 'Refusé',
            'pending': 'Non planifié'
        };
        
        const icon = statusIcons[c.status] || '❓';
        const color = statusColors[c.status] || '#999';
        const statusLabel = statusLabels[c.status] || 'Inconnu';
        const timeIcon = c.time_of_day === 'morning' ? '🌅' : '🌆';
        const gite = await window.gitesManager?.getByName(c.gite) || await window.gitesManager?.getById(c.gite_id);
        const giteColor = gite ? gite.color : '#667eea';
        const giteName = gite ? (gite.name || gite.nom || c.gite) : c.gite;
        
        if (isCalouActive()) {
            // 🐺 VERSION CALOU - Style moderne
            const statusColor = c.status === 'validated' ? '#10b981' : 
                              c.status === 'pending_validation' ? '#f59e0b' : '#ef4444';
            const statusBg = c.status === 'validated' ? 'rgba(16, 185, 129, 0.1)' : 
                           c.status === 'pending_validation' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(239, 68, 68, 0.1)';
            
            html += `
                <div class="calou-card" style="border-left: 4px solid ${giteColor}; padding: 1rem; margin-bottom: 0.75rem; display: flex; align-items: center; gap: 1rem;">
                    <div style="width: 3rem; height: 3rem; background: ${statusBg}; border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; flex-shrink: 0;">
                        ${timeIcon}
                    </div>
                    
                    <div style="flex: 1; min-width: 0;">
                        <div style="font-weight: 700; font-size: 0.95rem; margin-bottom: 0.25rem;">${giteName || 'Gîte inconnu'}</div>
                        <div style="font-size: 0.8rem; opacity: 0.6;">
                            📅 ${formatDateFromObj(new Date(c.scheduled_date))}
                        </div>
                    </div>
                    
                    <div style="display: flex; align-items: center; gap: 0.5rem; flex-shrink: 0;">
                        <span style="padding: 0.375rem 0.75rem; background: ${statusColor}; color: white; border-radius: 14px; font-weight: 700; font-size: 0.7rem; text-transform: uppercase; white-space: nowrap;">
                            ${statusLabel}
                        </span>
                        <span style="font-size: 1.25rem;" title="${statusLabel}">${icon}</span>
                    </div>
                </div>
            `;
        } else {
            // ⚡ VERSION NEO-BRUTALISM
            html += `<!-- Version Neo-Brutalism non affichée ici -->`;
        }
    }

    container.innerHTML = html;
}
```

---

## 5. JAVASCRIPT - GÉNÉRATION ALERTES

**Code actuel** dans `js/dashboard.js` (lignes 99-155) :

```javascript
async function updateDashboardAlerts() {
    const alerts = [];
    
    const reservations = await getAllReservations();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Vérifier fiches clients J-3
    const sendReminderReservations = reservations.filter(r => {
        const arrival = parseLocalDate(r.dateDebut);
        const daysUntilArrival = Math.ceil((arrival - today) / (1000 * 60 * 60 * 24));
        return daysUntilArrival === 3;
    });
    
    if (sendReminderReservations.length > 0) {
        alerts.push({
            type: 'info',
            icon: '📄',
            message: `${sendReminderReservations.length} fiche(s) client à envoyer (J-3)`,
            action: () => switchTab('dashboard')
        });
    }
    
    // Vérifier ménages refusés
    const { data: cleanings } = await window.supabaseClient
        .from('cleaning_schedule')
        .select('*')
        .eq('status', 'refused');
    
    if (cleanings && cleanings.length > 0) {
        alerts.push({
            type: 'danger',
            icon: '🧹',
            message: `${cleanings.length} ménage(s) refusé(s) nécessitent votre attention`,
            action: () => switchTab('menage')
        });
    }
    
    const container = document.getElementById('dashboard-alerts');
    if (!container) return;
    if (alerts.length === 0) {
        container.innerHTML = '';
        return;
    }
    
    let html = '';
    alerts.forEach((alert, index) => {
        const alertId = `dashboard-alert-${index}`;
        
        if (isCalouActive()) {
            // 🐺 VERSION CALOU
            const alertClass = alert.type === 'danger' ? 'calou-alert-error' : 
                              alert.type === 'warning' ? 'calou-alert-warning' : 
                              'calou-alert-info';
            html += `
                <div id="${alertId}" class="calou-card ${alertClass}" style="padding: 1rem 1.5rem; margin-bottom: 1rem; display: flex; align-items: center; gap: 1rem; cursor: pointer; transition: all 0.2s ease; border-radius: 20px;" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">
                    <span style="font-size: 1.5rem; flex-shrink: 0;">${alert.icon}</span>
                    <span style="flex: 1; font-weight: 600; font-size: 0.9rem;">${alert.message}</span>
                    <span style="font-size: 1.1rem; opacity: 0.6; flex-shrink: 0;">→</span>
                </div>
            `;
        } else {
            // ⚡ VERSION NEO-BRUTALISM
            html += `<!-- Version Neo-Brutalism non affichée ici -->`;
        }
        
        setTimeout(() => {
            const element = document.getElementById(alertId);
            if (element) {
                element.onclick = alert.action;
            }
        }, 0);
    });
    container.innerHTML = html;
}
```

---

## 6. EXEMPLES HTML RÉELS

### Carte Réservation (rendu final)

```html
<div class="calou-card" style="padding: 1.5rem; margin-bottom: 1rem; border-left: 8px solid #4f46e5; position: relative;">
    <!-- Badge J-3 optionnel -->
    <div style="position: absolute; top: 1rem; right: 1rem; background: rgba(251, 191, 36, 0.15); border: 1px solid rgba(251, 191, 36, 0.3); color: #fbbf24; padding: 0.375rem 0.75rem; border-radius: 14px; font-size: 0.75rem; font-weight: 700; animation: pulse-alpha 2s infinite;">
        ⚡ J-3
    </div>
    
    <!-- Ligne principale -->
    <div style="display: flex; align-items: center; gap: 1.5rem; margin-bottom: 1rem;">
        <!-- Icône -->
        <div style="width: 4rem; height: 4rem; background: rgba(79, 70, 229, 0.1); border-radius: 20px; display: flex; align-items: center; justify-content: center; font-size: 2rem; flex-shrink: 0;">
            🏠
        </div>
        
        <!-- Infos -->
        <div style="flex: 1; min-width: 0;">
            <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem; flex-wrap: wrap;">
                <h3 style="font-size: 1.25rem; font-weight: 800; text-transform: uppercase; letter-spacing: -0.025em; margin: 0; line-height: 1.2;">DUPOND</h3>
                <span style="font-size: 1.25rem; opacity: 0.5;" title="Soldé">✅</span>
            </div>
            
            <p style="font-size: 0.875rem; font-weight: 600; color: #a5b4fc; margin: 0 0 0.5rem 0;">
                🏠 Séjour en cours • 22/01 → 25/01
            </p>
            
            <div style="display: flex; gap: 1rem; font-size: 0.8rem; opacity: 0.6; flex-wrap: wrap;">
                <span>🏠 Trévoux</span>
                <span>👥 2</span>
                <span>🕐 17:00 → 10:00</span>
                <span style="font-weight: 600;">3n</span>
                <span style="font-weight: 700; color: #fbbf24;">J-1</span>
            </div>
        </div>
    </div>
    
    <!-- Boutons -->
    <div style="display: flex; gap: 0.5rem;">
        <button onclick="aperçuFicheClient('123')" class="calou-btn-primary" style="flex: 1; background: white; color: black; padding: 0.75rem 1.5rem; font-size: 0.625rem; font-weight: 900; text-transform: uppercase; border-radius: 16px; border: none; cursor: pointer; transition: transform 0.1s; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
            📄 Fiche Client
        </button>
        <button onclick="openEditReservation('123')" class="calou-btn-secondary" style="padding: 0.75rem 1rem; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 16px; cursor: pointer; transition: background 0.2s; font-size: 1.2rem;">
            ✏️
        </button>
    </div>
</div>
```

### Carte Ménage (rendu final)

```html
<div class="calou-card" style="border-left: 4px solid #667eea; padding: 1rem; margin-bottom: 0.75rem; display: flex; align-items: center; gap: 1rem;">
    <div style="width: 3rem; height: 3rem; background: rgba(16, 185, 129, 0.1); border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; flex-shrink: 0;">
        🌅
    </div>
    
    <div style="flex: 1; min-width: 0;">
        <div style="font-weight: 700; font-size: 0.95rem; margin-bottom: 0.25rem;">Trévoux</div>
        <div style="font-size: 0.8rem; opacity: 0.6;">
            📅 Lun 20 jan
        </div>
    </div>
    
    <div style="display: flex; align-items: center; gap: 0.5rem; flex-shrink: 0;">
        <span style="padding: 0.375rem 0.75rem; background: #10b981; color: white; border-radius: 14px; font-weight: 700; font-size: 0.7rem; text-transform: uppercase; white-space: nowrap;">
            Validé
        </span>
        <span style="font-size: 1.25rem;" title="Validé">✅</span>
    </div>
</div>
```

### Alerte (rendu final)

```html
<div id="dashboard-alert-0" class="calou-card calou-alert-info" style="padding: 1rem 1.5rem; margin-bottom: 1rem; display: flex; align-items: center; gap: 1rem; cursor: pointer; transition: all 0.2s ease; border-radius: 20px;">
    <span style="font-size: 1.5rem; flex-shrink: 0;">📄</span>
    <span style="flex: 1; font-weight: 600; font-size: 0.9rem;">1 fiche(s) client à envoyer (J-3)</span>
    <span style="font-size: 1.1rem; opacity: 0.6; flex-shrink: 0;">→</span>
</div>
```

---

## 📝 NOTES IMPORTANTES

### Variables CSS utilisées

- `--calou-bg` : Fond de page
- `--calou-card` : Fond des cartes (glassmorphism)
- `--calou-text` : Couleur texte
- `--calou-border` : Bordures
- `--calou-accent` : Couleur principale (#4f46e5)
- `--calou-radius-lg` : 32px (border-radius des cartes)
- `--calou-radius-md` : 20px
- `--calou-radius-sm` : 14px

### Couleurs statuts

- Indigo (#4f46e5) : Séjour en cours
- Amber (#f59e0b) : Arrivée prochaine
- Green (#10b981) : Validé/Terminé
- Red (#ef4444) : Refusé/Erreur

### Dimensions standards

- Icônes réservations : 4rem × 4rem
- Icônes ménages : 3rem × 3rem
- Border-left importante : 8px
- Border-left normale : 4px
- Gap standard : 1rem à 1.5rem
- Padding cartes : 1.5rem (réservations), 1rem (ménages)

### Animations

- `pulse-alpha` : Badge J-3 (2s infinite)
- `hover` : translateY(-2px) ou translateY(-4px)
- Transitions : 0.2s à 0.3s ease

---

## 🔄 WORKFLOW MODIFICATION

1. **Donnez ce fichier** à une autre IA
2. **Demandez-lui de modifier** le CSS et/ou les structures HTML
3. **Récupérez le fichier modifié**
4. **Renvoyez-moi** ce fichier avec la mention "Applique les modifications"
5. **Je mettrai à jour** css/calou.css et js/dashboard.js automatiquement

---

**Date** : 23 janvier 2026  
**Version** : CALOU ALPHA V2.0  
**Status** : Production actuelle
