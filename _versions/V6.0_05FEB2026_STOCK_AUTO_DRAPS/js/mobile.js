// ==========================================
// FONCTIONS UTILITAIRES PARTAGÉES
// ==========================================

// ==========================================
// GESTION DES TOASTS/NOTIFICATIONS
// ==========================================

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    if (!toast) {
        console.warn('Toast element not found');
        return;
    }
    toast.style.background = type === 'error' ? 'var(--danger)' : 'var(--success)';
    document.getElementById('toastMessage').textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 4000);
}

// ==========================================
// GESTION DES DATES (TIMEZONE FRANÇAIS)
// ==========================================

// Convertir une Date JavaScript en format YYYY-MM-DD
function dateToLocalString(date) {
    if (!date) return null;
    if (!(date instanceof Date)) {
        date = new Date(date);
    }
    if (isNaN(date.getTime())) return null;
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return year + '-' + month + '-' + day;
}

// Parser une date au format YYYY-MM-DD en heure locale
function parseLocalDate(dateStr) {
    if (!dateStr) return new Date(); // Retourner la date actuelle si undefined/null
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
}

// Calculer le nombre de nuits
function calculateNights(debut, fin) {
    const d1 = parseLocalDate(debut);
    const d2 = parseLocalDate(fin);
    return Math.ceil((d2 - d1) / (1000 * 60 * 60 * 24));
}

// Formater une date en français
function formatDate(dateStr) {
    const date = parseLocalDate(dateStr);
    return date.toLocaleDateString('fr-FR');
}

// Format court de date
function formatDateShort(date) {
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
}

// Obtenir le mois et l'année
function getMonthYear(dateStr) {
    const date = parseLocalDate(dateStr);
    return date.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long' });
}

// ==========================================
// HELPER POUR LES NOMS DE GÎTES
// ⚠️ DEPRECATED: Ces fonctions ne sont plus utilisées
// Utiliser: r.gite_id === gite.id ou r.gite === gite.name
// ==========================================

function isCouzon(giteName) {
    console.warn('⚠️ isCouzon() deprecated - Use r.gite === gite.name or r.gite_id === gite.id');
    if (!giteName) return false;
    const normalized = giteName.toLowerCase().trim();
    // Ne plus hardcoder - Utiliser window.gitesManager pour vérifier
    if (window.gitesManager) {
        const gite = window.gitesManager.gites.find(g => g.name.toLowerCase().trim() === normalized);
        return gite !== undefined;
    }
    return false;
}

function isTrevoux(giteName) {
    console.warn('⚠️ isTrevoux() deprecated - Use r.gite === gite.name or r.gite_id === gite.id');
    if (!giteName) return false;
    const normalized = giteName.toLowerCase().trim();
    // Ne plus hardcoder - Utiliser window.gitesManager pour vérifier
    if (window.gitesManager) {
        const gite = window.gitesManager.gites.find(g => g.name.toLowerCase().trim() === normalized);
        return gite !== undefined;
    }
    return false;
}

// ==========================================
// GESTION DU CACHE
// ==========================================

function invalidateCache(type) {
    if (type === 'reservations') {
        window.CACHE.reservations = null;
        window.CACHE.reservationsTimestamp = 0;
    } else if (type === 'charges') {
        window.CACHE.charges = null;
        window.CACHE.chargesTimestamp = 0;
    } else if (type === 'historical') {
        window.CACHE.historicalData = null;
        window.CACHE.historicalTimestamp = 0;
    } else if (type === 'all') {
        window.CACHE.reservations = null;
        window.CACHE.reservationsTimestamp = 0;
        window.CACHE.charges = null;
        window.CACHE.chargesTimestamp = 0;
        window.CACHE.historicalData = null;
        window.CACHE.historicalTimestamp = 0;
    }
}

// ==========================================
// HELPER BADGES PLATEFORMES
// ==========================================

function getPlatformBadgeClass(site) {
    if (site && site.toLowerCase().includes('airbnb')) return 'badge-airbnb';
    if (site && site.toLowerCase().includes('abritel')) return 'badge-abritel';
    if (site && (site.toLowerCase().includes('gîtes') || site.toLowerCase().includes('gites'))) return 'badge-gites';
    return 'badge-autre';
}

function getPlatformLogo(platform) {
    const logos = {
        'Airbnb': '🏠',
        'Abritel': '🏡', 
        'Gîtes de France': '🇫🇷',
        'Autre': '📝'
    };
    return logos[platform] || '📝';
}

// ==========================================
// GESTION SEMAINES ISO
// ==========================================

function getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return weekNo;
}

function getWeekDates(year, weekNum) {
    const simple = new Date(year, 0, 1 + (weekNum - 1) * 7);
    const dow = simple.getDay();
    const ISOweekStart = simple;
    if (dow <= 4) ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
    else ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
    
    const start = new Date(ISOweekStart);
    const end = new Date(ISOweekStart);
    end.setDate(end.getDate() + 6);
    
    return { start, end };
}

// ==========================================
// GESTION DES ONGLETS
// ==========================================

function switchTab(tabName) {
    // Vérifier si on quitte l'onglet infos-pratiques avec des changements non sauvegardés
    const currentTab = document.querySelector('.tab-content.active');
    if (currentTab && currentTab.id === 'tab-infos-pratiques' && tabName !== 'infos-pratiques') {
        if (typeof window.isDirty !== 'undefined' && window.isDirty && typeof window.currentGiteInfos !== 'undefined') {
            const confirmer = confirm(`⚠️ Vous avez des modifications non sauvegardées.\n\nVoulez-vous les sauvegarder avant de changer d'onglet ?`);
            if (confirmer && typeof window.sauvegarderInfosGiteComplet === 'function') {
                window.sauvegarderInfosGiteComplet();
            }
            // Réinitialiser le flag
            window.isDirty = false;
        }
    }
    
    // Masquer tous les onglets
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Désactiver tous les boutons
    document.querySelectorAll('.nav-tab').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Activer l'onglet sélectionné
    const targetTab = document.getElementById(`tab-${tabName}`);
    if (targetTab) {
        targetTab.classList.add('active');
    }
    
    // Activer le bouton correspondant
    const targetBtn = document.querySelector(`[data-tab="${tabName}"]`);
    if (targetBtn) {
        targetBtn.classList.add('active');
    }
    
    // Initialiser les fonctions spécifiques par onglet
    if (tabName === 'dashboard' && typeof window.refreshDashboard === 'function') {
        window.refreshDashboard();
    } else if (tabName === 'reservations' && typeof window.loadReservationsTab === 'function') {
        window.loadReservationsTab();
    } else if (tabName === 'statistiques' && typeof window.loadStatistiquesTab === 'function') {
        window.loadStatistiquesTab();
    } else if (tabName === 'charges' && typeof window.initFiscalite === 'function') {
        window.initFiscalite();
    } else if (tabName === 'menage' && typeof window.loadCleaningSchedule === 'function') {
        window.loadCleaningSchedule();
    } else if (tabName === 'infos-gites' && typeof window.initInfosGites === 'function') {
        window.initInfosGites();
    } else if (tabName === 'decouvrir' && typeof window.initDecouvrirTab === 'function') {
        window.initDecouvrirTab();
    } else if (tabName === 'faq' && typeof window.loadFAQTab === 'function') {
        window.loadFAQTab();
    } else if (tabName === 'fiches-clients' && typeof window.initFichesClients === 'function') {
        window.initFichesClients();
    } else if (tabName === 'archives' && typeof window.loadArchivesTab === 'function') {
        window.loadArchivesTab();
    }
}

// ==========================================
// MENU ACTIONS RAPIDES
// ==========================================

function handleQuickAction(action) {
    if (action === 'archives') {
        switchTab('archives');
    } else if (action === 'ical') {
        switchTab('gestion');
    }
}

// ==========================================
// GESTION DES SLIDES COLLAPSIBLES
// ==========================================

function toggleSlide(slideId) {
    const slideContent = document.getElementById(slideId);
    const slideIcon = document.getElementById(slideId + '-icon');
    
    if (!slideContent) return;
    
    if (slideContent.style.display === 'none' || slideContent.style.display === '') {
        slideContent.style.display = 'block';
        if (slideIcon) slideIcon.style.transform = 'rotate(180deg)';
    } else {
        slideContent.style.display = 'none';
        if (slideIcon) slideIcon.style.transform = 'rotate(0deg)';
    }
}

// ==========================================
// MENU MOBILE
// ==========================================

function initMobileMenu() {
    const toggleBtn = document.getElementById('mobile-menu-toggle');
    const closeBtn = document.getElementById('mobile-menu-close');
    const menu = document.getElementById('mobile-nav-menu');
    const overlay = document.getElementById('mobile-nav-overlay');
    const navList = document.querySelector('.mobile-nav-list');
    
    if (!toggleBtn || !menu || !overlay || !navList) return;
    
    // Sur mobile UNIQUEMENT, transformer le bouton user menu en déconnexion
    const userMenuBtn = document.getElementById('userMenuButton');
    if (userMenuBtn && window.innerWidth <= 768) {
        userMenuBtn.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            handleLogout();
        };
    }
    
    // Générer les items du menu depuis les onglets existants
    const tabs = document.querySelectorAll('.nav-tabs-wrapper .tab-neo');
    navList.innerHTML = ''; // Clear existing items
    
    tabs.forEach(tab => {
        const item = document.createElement('div');
        item.className = 'mobile-nav-item';
        item.dataset.tab = tab.dataset.tab;
        
        // Copier le contenu (icône + texte)
        const icon = tab.querySelector('.tab-icon');
        const text = tab.textContent.trim();
        
        if (icon) {
            item.innerHTML = icon.outerHTML + ' ' + text;
        } else {
            item.textContent = text;
        }
        
        // Marquer l'onglet actif
        if (tab.classList.contains('active')) {
            item.classList.add('active');
        }
        
        item.addEventListener('click', () => {
            switchTab(tab.dataset.tab);
            closeMobileMenu();
            
            // Mettre à jour l'état actif
            document.querySelectorAll('.mobile-nav-item').forEach(i => i.classList.remove('active'));
            item.classList.add('active');
        });
        
        navList.appendChild(item);
    });
    
    // Ouvrir menu
    toggleBtn.addEventListener('click', () => {
        menu.classList.add('open');
        overlay.classList.add('open');
        toggleBtn.classList.add('open');
    });
    
    // Fermer menu
    function closeMobileMenu() {
        menu.classList.remove('open');
        overlay.classList.remove('open');
        toggleBtn.classList.remove('open');
    }
    
    closeBtn?.addEventListener('click', closeMobileMenu);
    overlay?.addEventListener('click', closeMobileMenu);
    
    // Initialiser les sections collapsables sur mobile
    initMobileSections();
}

// ==========================================
// SECTIONS COLLAPSABLES MOBILE
// ==========================================

function initMobileSections() {
    // Afficher les headers collapse uniquement sur mobile
    if (window.innerWidth <= 768) {
        document.querySelectorAll('.mobile-collapse-header').forEach(header => {
            header.style.display = 'flex';
        });
        
        // TOUTES les sections fermées par défaut
        document.querySelectorAll('.mobile-collapse-content').forEach((content) => {
            content.classList.add('hidden');
            const icon = document.getElementById('icon-' + content.id.replace('content-', ''));
            if (icon) icon.classList.add('collapsed');
        });
    }
}

function toggleMobileSection(sectionId) {
    const content = document.getElementById('content-' + sectionId);
    const icon = document.getElementById('icon-' + sectionId);
    
    if (!content) return;
    
    content.classList.toggle('hidden');
    icon?.classList.toggle('collapsed');
}

// Réinitialiser sur changement de taille
window.addEventListener('resize', () => {
    if (window.innerWidth > 768) {
        // Desktop : afficher tout
        document.querySelectorAll('.mobile-collapse-header').forEach(header => {
            header.style.display = 'none';
        });
        document.querySelectorAll('.mobile-collapse-content').forEach(content => {
            content.classList.remove('hidden');
        });
    } else {
        initMobileSections();
    }
});

// Initialiser le menu mobile et les sections collapsables au chargement
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initMobileMenu();
        initMobileSections();
        // Forcer à nouveau après un délai pour être sûr
        setTimeout(() => {
            initMobileSections();
        }, 500);
    });
} else {
    initMobileMenu();
    initMobileSections();
    setTimeout(() => {
        initMobileSections();
    }, 500);
}

// Export vers window pour accessibilité globale
window.switchTab = switchTab;
window.showToast = showToast;
window.dateToLocalString = dateToLocalString;
window.toggleMobileSection = toggleMobileSection;
window.initMobileSections = initMobileSections;
window.parseLocalDate = parseLocalDate;
window.calculateNights = calculateNights;
window.formatDate = formatDate;
window.formatDateShort = formatDateShort;
window.getMonthYear = getMonthYear;
window.isCouzon = isCouzon;
window.isTrevoux = isTrevoux;
window.invalidateCache = invalidateCache;
window.getPlatformBadgeClass = getPlatformBadgeClass;
window.getPlatformLogo = getPlatformLogo;
window.getWeekNumber = getWeekNumber;
window.getWeekDates = getWeekDates;
window.handleQuickAction = handleQuickAction;
window.toggleSlide = toggleSlide;
