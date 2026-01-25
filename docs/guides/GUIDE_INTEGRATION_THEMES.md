# 🎨 Guide d'intégration du système de thèmes iCalou

## 📋 Vue d'ensemble

Ce document contient toutes les instructions pour intégrer le système de thèmes avec les icônes Lucide dans n'importe quelle page de l'application.

---

## 1️⃣ Fichiers nécessaires

### CSS : `/css/themes-icalou.css`
```css
/* ===================================
   🎨 SYSTÈME DE THÈMES ICALOU
   Fichier de thèmes global pour l'application
   =================================== */

/* 🌈 VARIABLES DE BASE */
:root {
    /* Couleurs principales */
    --primary: #667eea;
    --primary-dark: #5568d3;
    --secondary: #764ba2;
    --accent: #f093fb;
    
    /* Couleurs fonctionnelles */
    --success: #10b981;
    --warning: #fbbf24;
    --error: #ef4444;
    --info: #3b82f6;
    
    /* Texte */
    --text-primary: #1e293b;
    --text-secondary: #64748b;
    --text-muted: #94a3b8;
    
    /* Bordures et ombres */
    --border: #e2e8f0;
    --shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    --shadow-lg: 0 10px 25px rgba(0, 0, 0, 0.15);
    
    /* Transitions */
    --transition: all 0.2s ease;
}

/* ☀️ MODE JOUR (par défaut) */
:root[data-theme="light"] {
    --bg-primary: #ffffff;
    --bg-secondary: #f8fafc;
    --bg-tertiary: #f1f5f9;
    --bg-hover: rgba(102, 126, 234, 0.05);
    
    --text-primary: #1e293b;
    --text-secondary: #64748b;
    --text-muted: #94a3b8;
    
    --border: #e2e8f0;
    --border-hover: #cbd5e1;
    
    --shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    --shadow-lg: 0 10px 25px rgba(0, 0, 0, 0.15);
}

/* 🌙 MODE NUIT */
:root[data-theme="dark"] {
    --bg-primary: #1e293b;
    --bg-secondary: #0f172a;
    --bg-tertiary: #334155;
    --bg-hover: rgba(102, 126, 234, 0.15);
    
    --text-primary: #f1f5f9;
    --text-secondary: #cbd5e1;
    --text-muted: #94a3b8;
    
    --border: #334155;
    --border-hover: #475569;
    
    --shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
    --shadow-lg: 0 10px 25px rgba(0, 0, 0, 0.7);
    
    --primary: #818cf8;
    --success: #34d399;
    --warning: #fcd34d;
    --error: #f87171;
}

/* 🎨 STYLE: MODERN (par défaut) */
:root[data-style="modern"] {
    --btn-radius: 12px;
    --card-radius: 16px;
    --input-radius: 10px;
    
    --btn-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
    --card-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

:root[data-style="modern"] .btn,
:root[data-style="modern"] button,
:root[data-style="modern"] .btn-neo,
:root[data-style="modern"] .card button {
    border-radius: 12px !important;
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2) !important;
}

:root[data-style="modern"] .card {
    border-radius: 16px !important;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08) !important;
}

/* 🎨 STYLE: NEO-BRUTAL */
:root[data-style="neo-brutal"] {
    --btn-radius: 8px !important;
    --card-radius: 12px !important;
    --input-radius: 8px !important;
    
    --border: #2D3436 !important;
    --btn-shadow: 3px 3px 0 #2D3436 !important;
    --card-shadow: 4px 4px 0 #2D3436 !important;
}

:root[data-style="neo-brutal"] .btn,
:root[data-style="neo-brutal"] button,
:root[data-style="neo-brutal"] .btn-neo,
:root[data-style="neo-brutal"] .card button {
    border: 2px solid #2D3436 !important;
    transform: translate(0, 0);
    transition: all 0.15s !important;
    border-radius: 8px !important;
    box-shadow: 3px 3px 0 #2D3436 !important;
}

:root[data-style="neo-brutal"] .btn:hover,
:root[data-style="neo-brutal"] button:hover,
:root[data-style="neo-brutal"] .btn-neo:hover,
:root[data-style="neo-brutal"] .card button:hover {
    transform: translate(-2px, -2px) !important;
    box-shadow: 5px 5px 0 #2D3436 !important;
}

:root[data-style="neo-brutal"] .btn:active,
:root[data-style="neo-brutal"] button:active,
:root[data-style="neo-brutal"] .btn-neo:active,
:root[data-style="neo-brutal"] .card button:active {
    transform: translate(1px, 1px) !important;
    box-shadow: 2px 2px 0 #2D3436 !important;
}

:root[data-style="neo-brutal"] .card {
    border: 2px solid #2D3436 !important;
    border-radius: 12px !important;
    box-shadow: 4px 4px 0 #2D3436 !important;
}

/* 🎨 STYLE: MINIMAL */
:root[data-style="minimal"] {
    --btn-radius: 6px !important;
    --card-radius: 8px !important;
    --input-radius: 6px !important;
    
    --btn-shadow: none !important;
    --card-shadow: 0 1px 3px rgba(0, 0, 0, 0.1) !important;
    --border: #e5e7eb !important;
}

:root[data-style="minimal"] .btn,
:root[data-style="minimal"] button,
:root[data-style="minimal"] .btn-neo,
:root[data-style="minimal"] .card button {
    border: 1px solid var(--border) !important;
    box-shadow: none !important;
    border-radius: 6px !important;
}

:root[data-style="minimal"] .card {
    border-radius: 8px !important;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1) !important;
}

/* 🎨 STYLE: GLASS */
:root[data-style="glass"] {
    --btn-radius: 16px !important;
    --card-radius: 20px !important;
    --input-radius: 12px !important;
    
    --btn-shadow: 0 8px 32px rgba(102, 126, 234, 0.2) !important;
    --card-shadow: 0 8px 32px rgba(0, 0, 0, 0.1) !important;
}

:root[data-style="glass"] .card,
:root[data-style="glass"] .btn,
:root[data-style="glass"] button,
:root[data-style="glass"] .btn-neo,
:root[data-style="glass"] .card button {
    backdrop-filter: blur(10px) !important;
    -webkit-backdrop-filter: blur(10px) !important;
    background: rgba(255, 255, 255, 0.7) !important;
    border: 1px solid rgba(255, 255, 255, 0.2) !important;
    border-radius: 16px !important;
    box-shadow: 0 8px 32px rgba(102, 126, 234, 0.2) !important;
}

:root[data-style="glass"] .card {
    border-radius: 20px !important;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1) !important;
}

:root[data-style="glass"][data-theme="dark"] .card,
:root[data-style="glass"][data-theme="dark"] .btn,
:root[data-style="glass"][data-theme="dark"] button,
:root[data-style="glass"][data-theme="dark"] .btn-neo,
:root[data-style="glass"][data-theme="dark"] .card button {
    background: rgba(30, 41, 59, 0.7) !important;
    border: 1px solid rgba(255, 255, 255, 0.1) !important;
}

/* 🎨 BOUTONS */
.btn-theme {
    padding: 12px 24px;
    border-radius: var(--btn-radius);
    border: 1px solid var(--border);
    background: var(--bg-primary);
    color: var(--text-primary);
    font-weight: 600;
    cursor: pointer;
    transition: var(--transition);
    box-shadow: var(--btn-shadow);
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-size: 0.95rem;
}

.btn-theme:hover {
    background: var(--bg-hover);
    border-color: var(--border-hover);
    transform: translateY(-2px);
}

.btn-theme-primary {
    background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
    color: white;
    border: none;
}

.btn-theme-primary:hover {
    background: linear-gradient(135deg, var(--primary-dark) 0%, var(--secondary) 100%);
    box-shadow: var(--btn-shadow);
}

.btn-theme-success {
    background: var(--success);
    color: white;
    border: none;
}

.btn-theme-warning {
    background: var(--warning);
    color: var(--text-primary);
    border: none;
}

.btn-theme-error {
    background: var(--error);
    color: white;
    border: none;
}

/* 🎨 CARTES */
.card-theme {
    background: var(--bg-primary);
    border: 1px solid var(--border);
    border-radius: var(--card-radius);
    padding: 20px;
    box-shadow: var(--card-shadow);
    transition: var(--transition);
}

.card-theme:hover {
    box-shadow: var(--shadow-lg);
}

/* 🎨 INPUTS */
.input-theme {
    padding: 12px 16px;
    border-radius: var(--input-radius);
    border: 1px solid var(--border);
    background: var(--bg-primary);
    color: var(--text-primary);
    font-size: 0.95rem;
    transition: var(--transition);
    width: 100%;
}

.input-theme:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

/* 🎨 ICÔNES LUCIDE */
.icon-theme {
    width: 20px;
    height: 20px;
    stroke: currentColor;
    stroke-width: 2;
}

.icon-theme-lg {
    width: 24px;
    height: 24px;
}

.icon-theme-xl {
    width: 32px;
    height: 32px;
}

/* 🎛️ SÉLECTEUR DE THÈME */
.theme-switcher {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 9999;
    display: flex;
    gap: 10px;
    background: var(--bg-primary);
    padding: 10px;
    border-radius: var(--card-radius);
    box-shadow: var(--shadow-lg);
    border: 1px solid var(--border);
}

.theme-switcher button {
    padding: 8px 12px;
    border-radius: var(--btn-radius);
    border: 1px solid var(--border);
    background: var(--bg-secondary);
    color: var(--text-primary);
    cursor: pointer;
    transition: var(--transition);
    font-size: 0.9rem;
}

.theme-switcher button:hover {
    background: var(--bg-hover);
    border-color: var(--primary);
}

.theme-switcher button.active {
    background: var(--primary);
    color: white;
    border-color: var(--primary);
}

/* 🎨 ANIMATIONS */
@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.fade-in {
    animation: fadeIn 0.3s ease;
}

/* 📱 RESPONSIVE */
@media (max-width: 768px) {
    .theme-switcher {
        top: auto;
        bottom: 20px;
        right: 10px;
        flex-direction: column;
        padding: 8px;
    }
    
    .theme-switcher button {
        font-size: 0.8rem;
        padding: 6px 10px;
    }
}

/* 🎨 COMPATIBILITÉ AVEC L'EXISTANT */
body {
    background: var(--bg-secondary);
    color: var(--text-primary);
    transition: background-color 0.3s ease, color 0.3s ease;
}

.card {
    background: var(--bg-primary);
    border-color: var(--border);
    box-shadow: var(--card-shadow);
}

.btn, button:not(.theme-switcher button) {
    border-radius: var(--btn-radius);
}

input, select, textarea {
    background: var(--bg-primary);
    color: var(--text-primary);
    border-color: var(--border);
}

/* 🌙 Mode nuit - ajustements spécifiques */
:root[data-theme="dark"] img {
    opacity: 0.9;
}

:root[data-theme="dark"] .card {
    background: var(--bg-primary);
}
```

### JavaScript : `/js/theme-manager.js`
```javascript
/**
 * ===================================
 * 🎨 GESTIONNAIRE DE THÈMES ICALOU
 * Gestion centralisée des thèmes et styles
 * ===================================
 */

class ThemeManager {
    constructor() {
        this.THEME_KEY = 'icalou-theme';
        this.STYLE_KEY = 'icalou-style';
        
        // Thèmes disponibles
        this.themes = {
            light: '☀️ Jour',
            dark: '🌙 Nuit'
        };
        
        // Styles disponibles
        this.styles = {
            modern: '✨ Modern',
            'neo-brutal': '⚡ Neo-Brutal',
            minimal: '🎯 Minimal',
            glass: '🔮 Glass'
        };
        
        this.init();
    }
    
    /**
     * Initialisation du gestionnaire
     */
    init() {
        // Charger les préférences sauvegardées
        const savedTheme = this.getSavedTheme();
        const savedStyle = this.getSavedStyle();
        
        // Appliquer les préférences
        this.setTheme(savedTheme);
        this.setStyle(savedStyle);
        
        // Créer le sélecteur de thème si demandé
        if (window.ICALOU_SHOW_THEME_SWITCHER !== false) {
            this.createThemeSwitcher();
        }
        
        console.log('🎨 ThemeManager initialisé:', {
            theme: savedTheme,
            style: savedStyle
        });
    }
    
    /**
     * Récupérer le thème sauvegardé
     */
    getSavedTheme() {
        return localStorage.getItem(this.THEME_KEY) || 'light';
    }
    
    /**
     * Récupérer le style sauvegardé
     */
    getSavedStyle() {
        return localStorage.getItem(this.STYLE_KEY) || 'modern';
    }
    
    /**
     * Définir le thème
     */
    setTheme(theme) {
        if (!this.themes[theme]) {
            console.warn('Thème invalide:', theme);
            return;
        }
        
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem(this.THEME_KEY, theme);
        
        // Mettre à jour le sélecteur si présent
        this.updateSwitcherButtons();
        
        console.log('🎨 Thème changé:', theme);
    }
    
    /**
     * Définir le style
     */
    setStyle(style) {
        if (!this.styles[style]) {
            console.warn('Style invalide:', style);
            return;
        }
        
        document.documentElement.setAttribute('data-style', style);
        localStorage.setItem(this.STYLE_KEY, style);
        
        // Mettre à jour le sélecteur si présent
        this.updateSwitcherButtons();
        
        // Réinitialiser les icônes Lucide pour appliquer les nouveaux styles
        if (window.lucide) {
            setTimeout(() => lucide.createIcons(), 100);
        }
        
        console.log('🎨 Style changé:', style);
    }
    
    /**
     * Basculer entre jour et nuit
     */
    toggleTheme() {
        const currentTheme = this.getSavedTheme();
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme);
    }
    
    /**
     * Créer le sélecteur de thème flottant
     */
    createThemeSwitcher() {
        // Vérifier si déjà créé
        if (document.getElementById('icalou-theme-switcher')) {
            return;
        }
        
        const switcher = document.createElement('div');
        switcher.id = 'icalou-theme-switcher';
        switcher.className = 'theme-switcher';
        switcher.innerHTML = `
            <div style="display: flex; gap: 8px; align-items: center;">
                <!-- Thème Jour/Nuit -->
                <button class="theme-btn" data-theme="light" title="Mode Jour">☀️</button>
                <button class="theme-btn" data-theme="dark" title="Mode Nuit">🌙</button>
                
                <div style="width: 1px; height: 30px; background: var(--border); margin: 0 4px;"></div>
                
                <!-- Styles -->
                <button class="style-btn" data-style="modern" title="Modern">✨</button>
                <button class="style-btn" data-style="neo-brutal" title="Neo-Brutal">⚡</button>
                <button class="style-btn" data-style="minimal" title="Minimal">🎯</button>
                <button class="style-btn" data-style="glass" title="Glass">🔮</button>
            </div>
        `;
        
        document.body.appendChild(switcher);
        
        // Ajouter les événements
        switcher.querySelectorAll('.theme-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const theme = btn.dataset.theme;
                this.setTheme(theme);
            });
        });
        
        switcher.querySelectorAll('.style-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const style = btn.dataset.style;
                this.setStyle(style);
            });
        });
        
        // Mettre à jour l'état initial
        this.updateSwitcherButtons();
    }
    
    /**
     * Mettre à jour les boutons actifs du sélecteur
     */
    updateSwitcherButtons() {
        const switcher = document.getElementById('icalou-theme-switcher');
        if (!switcher) return;
        
        const currentTheme = this.getSavedTheme();
        const currentStyle = this.getSavedStyle();
        
        // Mettre à jour les thèmes
        switcher.querySelectorAll('.theme-btn').forEach(btn => {
            if (btn.dataset.theme === currentTheme) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        
        // Mettre à jour les styles
        switcher.querySelectorAll('.style-btn').forEach(btn => {
            if (btn.dataset.style === currentStyle) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }
    
    /**
     * Obtenir les informations du thème actuel
     */
    getCurrentTheme() {
        return {
            theme: this.getSavedTheme(),
            style: this.getSavedStyle(),
            themeName: this.themes[this.getSavedTheme()],
            styleName: this.styles[this.getSavedStyle()]
        };
    }
}

// Initialisation automatique au chargement
let themeManager;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        themeManager = new ThemeManager();
        window.themeManager = themeManager;
    });
} else {
    themeManager = new ThemeManager();
    window.themeManager = themeManager;
}

// Export global
window.ThemeManager = ThemeManager;
```

---

## 2️⃣ Intégration dans une page HTML

### Dans le `<head>` :
```html
<!-- 🎨 Lucide Icons -->
<script src="https://unpkg.com/lucide@latest"></script>
```

### APRÈS les autres CSS (important pour la priorité) :
```html
<!-- 🎨 Système de thèmes (doit être EN DERNIER) -->
<link rel="stylesheet" href="css/themes-icalou.css?v=1.1" />
```

### Avant la fermeture du `</body>` :
```html
<!-- 🎨 Gestionnaire de thèmes -->
<script src="js/theme-manager.js"></script>

<!-- 🎨 Initialiser les icônes Lucide -->
<script>
if (window.lucide) {
    lucide.createIcons();
    console.log('✨ Icônes Lucide initialisées');
}
</script>
```

---

## 3️⃣ Remplacement des emojis par des icônes Lucide

### Bibliothèque d'icônes disponibles :

#### Actions (8 icônes)
- `plus` → Ajouter / Créer
- `pencil` → Modifier / Éditer
- `trash-2` → Supprimer
- `save` → Enregistrer
- `check` → Valider
- `x` → Annuler
- `x-circle` → Fermer
- `corner-up-left` → Retour

#### Navigation (12 icônes)
- `clipboard-list` → Fiche Client
- `calendar` → Calendrier
- `home` → Réservations
- `wallet` → Fiscalité
- `sparkles` → Ménage
- `bed` → Draps
- `compass` → Découvrir
- `settings` → Gestion
- `bar-chart-3` → Statistiques / Tableau de bord
- `building` → Gîtes
- `building-2` → Résidences
- `warehouse` → Propriétés

#### Fichiers (10 icônes)
- `download` → Télécharger
- `upload` → Exporter
- `printer` → Imprimer
- `file-text` → Document / PDF
- `sheet` → Excel / Tableur
- `sticky-note` → Note / Texte
- `paperclip` → Pièce jointe
- `folder-open` → Dossier
- `file` → Fichier
- `archive` → Archive / Stocks

#### Statuts (10 icônes)
- `check-circle` → Succès
- `x-circle` → Erreur
- `alert-triangle` → Attention / Warning
- `info` → Information
- `bell` → Notification
- `clock` → En attente
- `circle-dot` → Actif / En ligne
- `circle` → Inactif / Hors ligne
- `loader` → En cours
- `minus-circle` → Occupé

#### Gestion (11 icônes)
- `refresh-cw` → Actualiser
- `settings` → Paramètres
- `search` → Rechercher
- `link` → Synchroniser / Lien
- `user` → Utilisateur
- `users` → Groupe / Équipe
- `lock` → Verrouiller
- `unlock` → Déverrouiller
- `log-out` → Déconnexion
- `key` → Mot de passe / Clé
- `shield` → Sécurité

#### Finances (10 icônes)
- `banknote` → Argent / Paiement
- `credit-card` → Carte bancaire
- `wallet` → Espèces
- `landmark` → Banque / Virement
- `receipt` → Facture / Reçu
- `trending-up` → Revenus / Gains
- `trending-down` → Dépenses / Pertes
- `calculator` → Comptabilité
- `arrow-right-left` → Transfert d'argent
- `coins` → Prix / Tarif

#### Communication (8 icônes)
- `mail` → Email
- `smartphone` → SMS / Mobile
- `phone` → Téléphone / Appel
- `message-circle` → Message / Chat
- `bell` → Notification
- `megaphone` → Annonce
- `message-square` → Commentaire
- `mail-open` → Courrier

#### Dates & Temps (7 icônes)
- `calendar` → Calendrier
- `calendar-days` → Date
- `clock` → Heure
- `alarm-clock` → Alarme / Rappel
- `timer` → Chronomètre
- `hourglass` → Compte à rebours
- `calendar-range` → Planning / Agenda

### Exemples de remplacement :

#### AVANT (emoji) :
```html
<h2>📊 Tableau de Bord</h2>
<button onclick="save()">💾 Enregistrer</button>
```

#### APRÈS (Lucide) :
```html
<h2 style="display: flex; align-items: center; gap: 10px;">
    <i data-lucide="bar-chart-3" class="icon-theme-lg"></i> 
    Tableau de Bord
</h2>

<button onclick="save()" style="display: flex; align-items: center; gap: 6px;">
    <i data-lucide="save" class="icon-theme"></i> 
    Enregistrer
</button>
```

### Tailles d'icônes disponibles :
- `icon-theme` → 20px (par défaut)
- `icon-theme-lg` → 24px (titres)
- `icon-theme-xl` → 32px (grandes icônes)

---

## 4️⃣ Ordre de chargement CSS (CRITIQUE)

**IMPORTANT** : Le fichier `themes-icalou.css` doit être chargé **EN DERNIER** pour ne pas être écrasé.

```html
<!-- 1. CSS de base -->
<link rel="stylesheet" href="css/main-inline.css" />

<!-- 2. CSS de l'ancien système -->
<link rel="stylesheet" href="css/icalou-modern.css" />

<!-- 3. CSS des thèmes (EN DERNIER!) -->
<link rel="stylesheet" href="css/themes-icalou.css?v=1.1" />
```

---

## 5️⃣ Classes CSS utiles

### Boutons :
- `.btn-theme` → Bouton standard
- `.btn-theme-primary` → Bouton principal (gradient violet)
- `.btn-theme-success` → Bouton vert (succès)
- `.btn-theme-warning` → Bouton jaune (attention)
- `.btn-theme-error` → Bouton rouge (erreur)

### Cartes :
- `.card-theme` → Carte avec thème

### Inputs :
- `.input-theme` → Input avec thème

---

## 6️⃣ Fonctionnalités du ThemeManager

Le gestionnaire est automatiquement initialisé et crée un sélecteur flottant en haut à droite.

### API disponible :
```javascript
// Changer le thème
window.themeManager.setTheme('light'); // ou 'dark'

// Changer le style
window.themeManager.setStyle('modern'); // 'neo-brutal', 'minimal', 'glass'

// Obtenir les infos du thème actuel
const currentTheme = window.themeManager.getCurrentTheme();
// { theme: 'light', style: 'modern', themeName: '☀️ Jour', styleName: '✨ Modern' }

// Basculer jour/nuit
window.themeManager.toggleTheme();
```

---

## 7️⃣ Désactiver le sélecteur flottant

Si vous voulez désactiver le sélecteur de thème sur une page :

```html
<script>
// AVANT de charger theme-manager.js
window.ICALOU_SHOW_THEME_SWITCHER = false;
</script>
<script src="js/theme-manager.js"></script>
```

---

## 8️⃣ Variables CSS personnalisables

Vous pouvez surcharger les variables dans votre CSS :

```css
:root {
    /* Changer la couleur principale */
    --primary: #667eea; /* Votre couleur */
    
    /* Changer les ombres */
    --shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    
    /* Changer les bordures */
    --border: #e2e8f0;
}
```

---

## 9️⃣ Checklist d'intégration

- [ ] Créer `/css/themes-icalou.css` avec le contenu fourni
- [ ] Créer `/js/theme-manager.js` avec le contenu fourni
- [ ] Ajouter Lucide Icons CDN dans le `<head>`
- [ ] Ajouter le lien vers themes-icalou.css **EN DERNIER** après les autres CSS
- [ ] Ajouter le script theme-manager.js avant `</body>`
- [ ] Ajouter `lucide.createIcons()` après theme-manager.js
- [ ] Remplacer tous les emojis par des icônes Lucide avec `<i data-lucide="nom-icone"></i>`
- [ ] Ajouter `display: flex; align-items: center; gap: Xpx;` sur les conteneurs d'icônes
- [ ] Tester les 4 styles : Modern, Neo-Brutal, Minimal, Glass
- [ ] Tester les modes jour/nuit

---

## 🎨 Résultat attendu

Après intégration :
- ✅ Sélecteur de thème flottant en haut à droite
- ✅ 4 styles visuels disponibles (Modern, Neo-Brutal, Minimal, Glass)
- ✅ Mode jour/nuit fonctionnel
- ✅ Icônes Lucide professionnelles partout
- ✅ Préférences sauvegardées dans localStorage
- ✅ Transitions fluides entre les styles

---

**📚 Documentation complète :** [https://lucide.dev/icons/](https://lucide.dev/icons/)
