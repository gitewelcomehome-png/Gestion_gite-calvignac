/* ================================================
   JAVASCRIPT MOBILE - Fonctions spécifiques mobile
   ================================================ */

// Menu hamburger mobile
function initMobileMenu() {
    // Utiliser les éléments déjà présents dans app.html
    // (le bouton hamburger est dans .theme-controls, la nav est .icalou-modern-nav)
    const mobileMenuBtn = document.getElementById('mobile-menu-toggle');
    const mobileNav = document.querySelector('.icalou-modern-nav');
    const mobileOverlay = document.getElementById('mobile-nav-overlay');

    if (!mobileNav) {
        console.warn('⚠️ .icalou-modern-nav non trouvée');
        return;
    }

    // Définir window.closeMobileMenu (utilisé par les switchTab)
    const closeMobileMenuFunc = () => {
        mobileNav.classList.remove('active');
        if (mobileOverlay) mobileOverlay.classList.remove('active');
        if (mobileMenuBtn) mobileMenuBtn.classList.remove('active');
        document.body.style.overflow = '';
    };
    window.closeMobileMenu = closeMobileMenuFunc;

    // Fermer automatiquement le menu au clic sur un onglet
    mobileNav.querySelectorAll('.nav-tab[data-tab]').forEach(tab => {
        tab.addEventListener('click', () => {
            setTimeout(closeMobileMenuFunc, 150);
        });
    });

    if (!window.showTab) {
        window.showTab = window.switchTab;
    }
}

// Sections collapsables mobile
function initMobileSections() {
    // Synchroniser les icônes avec l'état des sections
    const contents = document.querySelectorAll('.mobile-collapse-content');
    contents.forEach(content => {
        const sectionId = content.id.replace('content-', '');
        const icon = document.getElementById('icon-' + sectionId);
        
        if (content.classList.contains('hidden')) {
            // Section pliée -> flèche bas
            if (icon) icon.textContent = '▼';
        } else {
            // Section ouverte -> flèche haut
            if (icon) icon.textContent = '▲';
        }
    });
}

// Toggle section mobile
function toggleMobileSection(sectionId) {
    const content = document.getElementById('content-' + sectionId);
    const icon = document.getElementById('icon-' + sectionId);
    
    // console.log('🔄 Toggle section:', sectionId, 'Element:', content);
    
    if (!content) {
        console.warn('⚠️ Section non trouvée:', sectionId);
        return;
    }
    
    const isHidden = content.classList.contains('hidden');
    // console.log('État actuel:', isHidden ? 'plié' : 'ouvert');
    
    if (isHidden) {
        // Déplier
        content.classList.remove('hidden');
        if (icon) icon.textContent = '▲'; // Flèche vers le haut
        // console.log('✅ Section dépliée');
    } else {
        // Plier
        content.classList.add('hidden');
        if (icon) icon.textContent = '▼'; // Flèche vers le bas
        // console.log('✅ Section pliée');
    }
}

// Rendre toggleMobileSection globale
window.toggleMobileSection = toggleMobileSection;

// Fonction pour afficher les détails d'une réservation (mobile)
function showReservationDetails(reservationId) {
    // console.log('📋 Affichage détails réservation:', reservationId);
    // Rediriger vers l'onglet réservations avec la réservation sélectionnée
    if (typeof window.switchTab === 'function') {
        window.switchTab('reservations');
        // Ouvrir le modal d'édition après un court délai
        setTimeout(() => {
            if (typeof window.openEditReservation === 'function') {
                window.openEditReservation(reservationId);
            }
        }, 300);
    }
}

// Rendre globale
window.showReservationDetails = showReservationDetails;

// Masquer éléments non désirés en mobile
function hideMobileUnwantedElements() {
    // Masquer tous les boutons "Modifier" (✏️)
    const editButtons = document.querySelectorAll('button[onclick*="editTodo"], button[title="Modifier"]');
    editButtons.forEach(btn => {
        if (btn.textContent.includes('✏️')) {
            btn.style.display = 'none';
        }
    });
    
    // Masquer les badges "Arrivée prochaine"
    const allSpans = document.querySelectorAll('span');
    allSpans.forEach(span => {
        if (span.textContent.includes('Arrivée prochaine')) {
            span.style.display = 'none';
        }
    });
    
    // Masquer les badges avec fond #3498DB (couleur Arrivée prochaine)
    const allBadges = document.querySelectorAll('[style*="background"]');
    allBadges.forEach(badge => {
        const bgStyle = badge.getAttribute('style');
        if (bgStyle && bgStyle.includes('#3498DB') && badge.textContent.includes('Arrivée prochaine')) {
            badge.style.display = 'none';
        }
    });
}

// Appeler la fonction après chaque chargement de contenu
window.hideMobileUnwantedElements = hideMobileUnwantedElements;

// Observer les changements dans le DOM pour masquer dynamiquement
function observeDOMChanges() {
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.addedNodes.length) {
                hideMobileUnwantedElements();
            }
        });
    });
    
    // Observer le conteneur principal
    const container = document.querySelector('.tab-container');
    if (container) {
        observer.observe(container, {
            childList: true,
            subtree: true
        });
    }
}

// Transformer le bouton user menu en bouton déconnexion sur mobile
function initMobileUserMenu() {
    const userMenuBtn = document.querySelector('#user-menu button');
    if (!userMenuBtn) return;
    
    // Sur mobile, bouton direct de déconnexion
    if (window.innerWidth <= 768) {
        userMenuBtn.textContent = '🚪 Déconnexion';
        userMenuBtn.removeAttribute('onclick');
        userMenuBtn.onclick = (e) => {
            e.stopPropagation();
            if (confirm('Voulez-vous vraiment vous déconnecter ?')) {
                if (typeof window.handleLogout === 'function') {
                    window.handleLogout();
                } else {
                    window.location.href = 'logout.php';
                }
            }
        };
    }
}

// Initialiser immédiatement (le script est chargé après DOMContentLoaded)

// Fonction d'initialisation
function initMobile() {
    // console.log('📱 Initialisation mobile...');
    
    // Vérifier si le DOM est prêt
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initMobile);
        return;
    }
    
    // Le DOM est prêt, on initialise
    setTimeout(() => {
        // console.log('🚀 Démarrage des fonctions mobiles');
        initMobileMenu();
        initMobileSections();
        initMobileUserMenu();
        hideMobileUnwantedElements();
        observeDOMChanges();
        // console.log('✅ Mobile initialisé');
    }, 300);
}

// Initialiser le modal TODO quand le dashboard est visible
function tryInitTodoModal() {
    const modal = document.getElementById('addTodoModal');
    if (modal && typeof initializeTodoModal === 'function') {
        initializeTodoModal();
        // console.log('✅ Modal TODO initialisé pour mobile');
        return true;
    }
    return false;
}

// Observer le changement d'onglet pour initialiser le modal TODO
const originalSwitchTab = window.switchTab;
if (originalSwitchTab) {
    window.switchTab = function(tabId) {
        originalSwitchTab(tabId);
        if (tabId === 'dashboard') {
            setTimeout(() => tryInitTodoModal(), 500);
        }
    };
}

// Lancer l'initialisation
initMobile();

// Réinitialiser au changement de taille d'écran
window.addEventListener('resize', () => {
    if (window.innerWidth <= 768) {
        initMobileUserMenu();
    }
});
