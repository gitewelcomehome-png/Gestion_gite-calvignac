/* ================================================
   JAVASCRIPT MOBILE - Fonctions spécifiques mobile
   ================================================ */

// Menu hamburger mobile
function initMobileMenu() {
    const mobileMenuBtn = document.getElementById('mobile-menu-toggle');
    const mobileMenu = document.getElementById('mobile-nav-menu');
    const mobileOverlay = document.getElementById('mobile-nav-overlay');
    const mobileMenuClose = document.getElementById('mobile-menu-close');
    const mobileNavList = document.querySelector('.mobile-nav-list');
    
    if (!mobileMenuBtn || !mobileMenu) return;
    
    // Générer les liens du menu depuis les onglets
    const tabs = document.querySelectorAll('nav button[onclick^="showTab"]');
    let menuHTML = '';
    
    tabs.forEach(tab => {
        const tabId = tab.getAttribute('onclick').match(/showTab\('([^']+)'\)/)[1];
        const icon = tab.textContent.trim().split(' ')[0]; // Récupère l'emoji
        const text = tab.textContent.trim().substring(2); // Récupère le texte
        
        menuHTML += `
            <button onclick="showTab('${tabId}'); closeMobileMenu();" style="
                width: 100%;
                padding: 15px 20px;
                text-align: left;
                border: none;
                background: white;
                border-bottom: 1px solid #eee;
                cursor: pointer;
                font-size: 1rem;
                transition: all 0.2s;
                display: flex;
                align-items: center;
                gap: 10px;
            " onmouseover="this.style.background='#f8f9fa'" onmouseout="this.style.background='white'">
                <span style="font-size: 1.2rem;">${icon}</span>
                <span>${text}</span>
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
    
    mobileMenuClose.addEventListener('click', closeMobileMenuFunc);
    mobileOverlay.addEventListener('click', closeMobileMenuFunc);
    
    // Fonction globale pour fermer
    window.closeMobileMenu = closeMobileMenuFunc;
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
                window.handleLogout();
            }
        };
    }
}

// Initialiser au chargement
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        // Délai pour s'assurer que le DOM est complètement chargé
        setTimeout(() => {
            initMobileMenu();
            initMobileUserMenu();
        }, 100);
    });
}

// Réinitialiser au changement de taille d'écran
window.addEventListener('resize', () => {
    if (window.innerWidth <= 768) {
        initMobileUserMenu();
    }
});
