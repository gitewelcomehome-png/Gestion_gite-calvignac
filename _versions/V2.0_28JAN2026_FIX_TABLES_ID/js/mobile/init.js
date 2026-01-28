/* ================================================
   JAVASCRIPT MOBILE - Fonctions spécifiques mobile
   ================================================ */

// Menu hamburger mobile
function initMobileMenu() {
    // D'abord injecter le HTML du menu
    const container = document.getElementById('mobile-menu-container');
    if (!container) {
        console.error('❌ Container mobile-menu-container non trouvé');
        return;
    }
    
    container.innerHTML = `
        <button id="mobile-menu-toggle" class="mobile-menu-btn" aria-label="Menu">
            <span></span>
            <span></span>
            <span></span>
        </button>

        <nav id="mobile-nav-menu" class="mobile-nav-menu">
            <div class="mobile-nav-list">
                <!-- Les onglets seront générés dynamiquement -->
            </div>
            <div class="mobile-nav-footer">
                <button onclick="if(confirm('Voulez-vous vraiment vous déconnecter ?')) { window.location.href='logout.php'; }" class="mobile-logout-btn">
                    <span class="mobile-logout-icon">⏻</span>
                    <span class="mobile-logout-text">Déconnexion</span>
                </button>
            </div>
        </nav>
        <div id="mobile-nav-overlay" class="mobile-nav-overlay"></div>
    `;
    
    const mobileMenuBtn = document.getElementById('mobile-menu-toggle');
    const mobileMenu = document.getElementById('mobile-nav-menu');
    const mobileOverlay = document.getElementById('mobile-nav-overlay');
    const mobileNavList = document.querySelector('.mobile-nav-list');
    
    if (!mobileMenuBtn || !mobileMenu) {
        console.warn('⚠️ Éléments menu mobile non trouvés');
        return;
    }
    
    // Pages à exclure du menu mobile
    const excludedTabs = ['statistiques', 'charges', 'faq', 'decouvrir', 'checklists'];
    
    // Liste de fallback si les boutons desktop ne sont pas trouvés
    const fallbackMenu = [
        { id: 'dashboard', icon: '📊', text: 'Tableau de Bord' },
        { id: 'gestion', icon: '🏠', text: 'Gestion Gîtes' },
        { id: 'reservations', icon: '📅', text: 'Réservations' },
        { id: 'menage', icon: '🧹', text: 'Planning Ménage' },
        { id: 'draps', icon: '🛏️', text: 'Draps' },
        { id: 'infos-gites', icon: '💰', text: 'Calendrier & Tarifs' },
        { id: 'fiches-clients', icon: '👥', text: 'Fiches Clients' },
        { id: 'archives', icon: '📦', text: 'Archives' }
    ];
    
    // Générer les liens du menu depuis les onglets
    const tabs = document.querySelectorAll('.tab-neo[data-tab]');
    let menuHTML = '';
    
    if (tabs.length === 0) {
        // Générer depuis la liste fallback
        fallbackMenu.forEach(item => {
            menuHTML += `
                <button onclick="window.switchTab('${item.id}'); window.closeMobileMenu();" class="mobile-menu-item">
                    <span style="font-size: 1.2rem;">${item.icon}</span>
                    <span class="mobile-menu-text">${item.text}</span>
                </button>
            `;
        });
        
        if (mobileNavList) {
            mobileNavList.innerHTML = menuHTML;
        }
        return;
    }
    
    tabs.forEach(tab => {
        const tabId = tab.getAttribute('data-tab');
        if (!tabId) return;
        
        // Filtrer les onglets exclus
        if (excludedTabs.includes(tabId)) {
            return;
        }
        
        // Récupérer l'icône SVG
        const svgIcon = tab.querySelector('.tab-icon');
        const iconHTML = svgIcon ? svgIcon.outerHTML : '<span style="font-size: 1.2rem;">📄</span>';
        
        // Récupérer le texte du bouton
        let text = tab.textContent.trim();
        
        // Si le texte est vide, utiliser le tabId
        if (!text || text.length < 2) {
            text = tabId;
        }
        
        menuHTML += `
            <button onclick="window.switchTab('${tabId}'); window.closeMobileMenu();" class="mobile-menu-item">
                ${iconHTML}
                <span class="mobile-menu-text">${text}</span>
            </button>
        `;
    });
    
    if (mobileNavList) {
        mobileNavList.innerHTML = menuHTML;
    }
    
    // Ouvrir le menu
    mobileMenuBtn.addEventListener('click', () => {
        mobileMenu.classList.add('active');
        mobileOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    });
    
    // Fermer le menu
    const closeMobileMenuFunc = () => {
        mobileMenu.classList.remove('active');
        mobileOverlay.classList.remove('active');
        document.body.style.overflow = '';
    };
    
    mobileOverlay.addEventListener('click', closeMobileMenuFunc);
    
    // Fonction globale pour fermer
    window.closeMobileMenu = closeMobileMenuFunc;
    // Alias pour compatibilité avec d'anciens appels
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
    
    console.log('🔄 Toggle section:', sectionId, 'Element:', content);
    
    if (!content) {
        console.warn('⚠️ Section non trouvée:', sectionId);
        return;
    }
    
    const isHidden = content.classList.contains('hidden');
    console.log('État actuel:', isHidden ? 'plié' : 'ouvert');
    
    if (isHidden) {
        // Déplier
        content.classList.remove('hidden');
        if (icon) icon.textContent = '▲'; // Flèche vers le haut
        console.log('✅ Section dépliée');
    } else {
        // Plier
        content.classList.add('hidden');
        if (icon) icon.textContent = '▼'; // Flèche vers le bas
        console.log('✅ Section pliée');
    }
}

// Rendre toggleMobileSection globale
window.toggleMobileSection = toggleMobileSection;

// Fonction pour afficher les détails d'une réservation (mobile)
function showReservationDetails(reservationId) {
    console.log('📋 Affichage détails réservation:', reservationId);
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
    console.log('📱 Initialisation mobile...');
    
    // Vérifier si le DOM est prêt
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initMobile);
        return;
    }
    
    // Le DOM est prêt, on initialise
    setTimeout(() => {
        console.log('🚀 Démarrage des fonctions mobiles');
        initMobileMenu();
        initMobileSections();
        initMobileUserMenu();
        hideMobileUnwantedElements();
        observeDOMChanges();
        console.log('✅ Mobile initialisé');
    }, 300);
}

// Initialiser le modal TODO quand le dashboard est visible
function tryInitTodoModal() {
    const modal = document.getElementById('addTodoModal');
    if (modal && typeof initializeTodoModal === 'function') {
        initializeTodoModal();
        console.log('✅ Modal TODO initialisé pour mobile');
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
