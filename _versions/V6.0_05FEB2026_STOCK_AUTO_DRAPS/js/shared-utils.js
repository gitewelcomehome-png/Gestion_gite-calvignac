// shared-utils.js - Utilitaires partagés

// ╔══════════════════════════════════════════════════════════════════════════╗
// ║  ⚠️ ⚠️ ⚠️  FICHIER DESKTOP - NE PAS MODIFIER  ⚠️ ⚠️ ⚠️                      ║
// ║                                                                          ║
// ║  Ce fichier est EN PRODUCTION et doit rester STABLE                     ║
// ║  Pour le mobile, créer des versions dédiées dans tabs/mobile/js/        ║
// ║  NE TOUCHER À CE FICHIER QUE SUR DEMANDE EXPLICITE                      ║
// ╚══════════════════════════════════════════════════════════════════════════╝

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
    document.querySelectorAll('.nav-tab, .tab-neo').forEach(btn => {
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
    } else if (tabName === 'reservations') {
        if (typeof updateReservationsList === 'function') {
            updateReservationsList();
        }
    } else if (tabName === 'statistiques') {
        if (typeof populateYearFilter === 'function') populateYearFilter();
        if (typeof displayHistoricalYearsList === 'function') displayHistoricalYearsList();
        if (typeof updateStats === 'function') updateStats();
    } else if (tabName === 'charges') {
        setTimeout(() => {
            if (typeof initFiscalite === 'function') {
                initFiscalite();
            }
        }, 100);
    } else if (tabName === 'menage') {
        // DESKTOP uniquement - le mobile a son propre script dans tabs/mobile/menage.html
        if (!isMobile && typeof window.afficherPlanningParSemaine === 'function') {
            setTimeout(() => {
                window.afficherPlanningParSemaine();
            }, 200);
        }
        // MOBILE : Le script est déjà dans le tab chargé, rien à faire ici
    } else if (tabName === 'infos-gites') {
        if (typeof generateGitesButtons === 'function') {
            setTimeout(() => generateGitesButtons(), 100);
        }
        if (typeof chargerDonneesInfos === 'function') {
            chargerDonneesInfos();
        }
        if (typeof chargerActivitesEtSorties === 'function') {
            chargerActivitesEtSorties();
        }
        setTimeout(() => {
            if (typeof initValidationInfosPratiques === 'function') {
                initValidationInfosPratiques();
            }
        }, 200);
    } else if (tabName === 'faq' && typeof initFAQ === 'function') {
        const checkFaqReady = () => {
            if (document.getElementById('faq-list')) {
                initFAQ();
            } else {
                setTimeout(checkFaqReady, 50);
            }
        };
        checkFaqReady();
    } else if (tabName === 'draps' && typeof initDraps === 'function') {
        const checkDrapsReady = () => {
            if (document.getElementById('stock-trevoux-draps-grands')) {
                initDraps();
            } else {
                setTimeout(checkDrapsReady, 50);
            }
        };
        checkDrapsReady();
    } else if (tabName === 'fiches-clients' && typeof initFichesClients === 'function') {
        initFichesClients();
    } else if (tabName === 'checklists' && typeof initChecklistsTab === 'function') {
        initChecklistsTab();
    } else if (tabName === 'archives') {
        if (typeof updateArchivesDisplay === 'function') updateArchivesDisplay();
        if (typeof updateArchivedTodos === 'function') updateArchivedTodos();
    } else if (tabName === 'parrainage' && typeof initReferralSystem === 'function') {
        // Vérifier que le contenu HTML est bien chargé avant d'initialiser
        const checkParrainageReady = () => {
            if (document.getElementById('referral-content')) {
                initReferralSystem();
            } else {
                setTimeout(checkParrainageReady, 50);
            }
        };
        checkParrainageReady();
    } else if (tabName === 'decouvrir') {
        if (typeof window.initModuleDecouvrir === 'function') {
            window.initModuleDecouvrir();
        }
    } else if (tabName === 'calendrier-tarifs') {
        // En mode mobile, ne pas appeler la fonction desktop
        const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;
        if (isMobileDevice && document.documentElement.classList.contains('is-mobile')) {
            console.log('📱 Mode mobile: skip renderCalendrierTarifsTab (version mobile chargée depuis HTML)');
        } else if (typeof renderCalendrierTarifsTab === 'function') {
            renderCalendrierTarifsTab();
        }
    }
}

// ==========================================
// MENU ACTIONS RAPIDES
// ==========================================

/**
 * Toggle du menu utilisateur (dropdown)
 */
function toggleUserMenu() {
    const dropdown = document.getElementById('userMenuDropdown');
    const button = document.getElementById('userMenuButton');
    
    if (!dropdown) return;
    
    // Toggle avec classe .open (utilisée par main-inline.css)
    const isVisible = dropdown.classList.contains('open');
    
    if (isVisible) {
        dropdown.classList.remove('open');
        if (button) button.classList.remove('open');
        dropdown.style.display = 'none';
    } else {
        dropdown.classList.add('open');
        if (button) button.classList.add('open');
        dropdown.style.display = 'block';
    }
    
    // Fermer le menu si on clique ailleurs
    if (!isVisible) {
        setTimeout(() => {
            document.addEventListener('click', function closeMenu(e) {
                if (!e.target.closest('.user-menu-container')) {
                    dropdown.style.display = 'none';
                    document.removeEventListener('click', closeMenu);
                }
            });
        }, 100);
    }
}

function handleQuickAction(action) {
    if (action === 'archives') {
        switchTab('archives');
    } else if (action === 'ical') {
        switchTab('gestion');
    }
}

// ==========================================
// GESTION MENU UTILISATEUR DROPDOWN
// ==========================================

/**
 * Toggle le dropdown du menu utilisateur
 */
function toggleUserMenuDropdown() {
    const dropdown = document.getElementById('userMenuDropdown');
    if (!dropdown) return;
    
    const isVisible = dropdown.style.display === 'block';
    
    if (isVisible) {
        dropdown.style.display = 'none';
    } else {
        dropdown.style.display = 'block';
        
        // Fermer si clic ailleurs
        setTimeout(() => {
            document.addEventListener('click', function closeMenu(e) {
                if (!e.target.closest('.user-menu-container')) {
                    dropdown.style.display = 'none';
                    document.removeEventListener('click', closeMenu);
                }
            });
        }, 100);
    }
}

/**
 * Gère le changement dans le menu utilisateur
 */
function handleUserMenuChange(action) {
    // Fermer le dropdown
    const dropdown = document.getElementById('userMenuDropdown');
    if (dropdown) {
        dropdown.style.display = 'none';
    }
    
    if (!action) return;
    
    // Exécuter l'action
    if (action === 'logout') {
        if (typeof window.logout === 'function') {
            window.logout();
        }
    } else if (action === 'gites') {
        if (typeof window.showGiteSelectionModal === 'function') {
            window.showGiteSelectionModal();
        }
    } else if (action === 'ical') {
        if (typeof window.showIcalConfigModal === 'function') {
            window.showIcalConfigModal();
        }
    } else if (action === 'archives') {
        window.switchTab('archives');
    } else if (action === 'faq') {
        window.switchTab('faq');
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

// Export vers window pour accessibilité globale
window.switchTab = switchTab;
window.showToast = showToast;
window.dateToLocalString = dateToLocalString;
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
window.toggleUserMenuDropdown = toggleUserMenuDropdown;
window.handleUserMenuChange = handleUserMenuChange;
window.toggleSlide = toggleSlide;
