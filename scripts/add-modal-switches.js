/**
 * Script d'injection automatique des switches Apple/Sidebar dans toutes les modals
 * 27 janvier 2026 - VERSION DEBUG + OBSERVER
 */

let modalsTraitees = new Set(); // Pour éviter de traiter 2 fois la même modal

function injecterSwitchesModals() {
    console.log('%c🔧 === INJECTION DES SWITCHES MODAL ===', 'background: #00C2CB; color: white; padding: 4px 8px; font-weight: bold');
    
    // Sélectionner TOUTES les modals du DOM
    const modals = document.querySelectorAll('.modal');
    console.log(`\n📊 ${modals.length} modal(s) trouvée(s) dans le DOM\n`);
    
    let switchesAjoutes = 0;
    let stylesNettoyes = 0;
    let switchesExistants = 0;
    let modalsIgnorees = 0;
    let modalsDejaTraitees = 0;
    
    modals.forEach((modal, index) => {
        const modalId = modal.id || `modal-sans-id-${index}`;
        
        // Vérifier si déjà traitée
        if (modalsTraitees.has(modal)) {
            modalsDejaTraitees++;
            return;
        }
        
        console.log(`\n🔍 === MODAL ${index + 1}/${modals.length} : ${modalId} ===`);
        
        // Vérifier que la modal a un .modal-content
        const modalContent = modal.querySelector('.modal-content');
        if (!modalContent) {
            console.warn(`  ❌ Aucun .modal-content trouvé → IGNORÉE`);
            modalsIgnorees++;
            modalsTraitees.add(modal);
            return;
        }
        console.log(`  ✓ .modal-content trouvé`);
        
        // 🧹 VÉRIFIER ET NETTOYER LES STYLES INLINE
        const inlineStyle = modalContent.getAttribute('style');
        if (inlineStyle) {
            console.log(`  🔍 Style inline détecté: "${inlineStyle.substring(0, 80)}..."`);
            
            // Garder uniquement max-width et max-height
            const maxWidthMatch = inlineStyle.match(/max-width:\s*(\d+px)/);
            const maxHeightMatch = inlineStyle.match(/max-height:\s*([^;]+)/);
            
            let newStyle = '';
            if (maxWidthMatch) {
                newStyle += `max-width: ${maxWidthMatch[1]}; `;
                console.log(`    → Conservé: max-width: ${maxWidthMatch[1]}`);
            }
            if (maxHeightMatch) {
                newStyle += `max-height: ${maxHeightMatch[1]}; `;
                console.log(`    → Conservé: max-height: ${maxHeightMatch[1]}`);
            }
            
            if (newStyle) {
                modalContent.setAttribute('style', newStyle.trim());
                console.log(`  🧹 Styles nettoyés, conservé: "${newStyle.trim()}"`);
            } else {
                modalContent.removeAttribute('style');
                console.log(`  🧹 Tous styles inline supprimés`);
            }
            
            stylesNettoyes++;
        } else {
            console.log(`  ✓ Aucun style inline`);
        }
        
        // 🧹 NETTOYER TOUS LES STYLES INLINE DES ENFANTS (sauf max-width/height)
        const elementsWithStyle = modalContent.querySelectorAll('[style]');
        let enfantsNettoyes = 0;
        elementsWithStyle.forEach(el => {
            if (el === modalContent) return; // Déjà traité
            
            const style = el.getAttribute('style');
            // Garder seulement max-width, max-height, display
            const maxW = style.match(/max-width:\s*([^;]+)/);
            const maxH = style.match(/max-height:\s*([^;]+)/);
            const disp = style.match(/display:\s*([^;]+)/);
            
            let keepStyle = '';
            if (maxW) keepStyle += `max-width: ${maxW[1]}; `;
            if (maxH) keepStyle += `max-height: ${maxH[1]}; `;
            if (disp) keepStyle += `display: ${disp[1]}; `;
            
            if (keepStyle) {
                el.setAttribute('style', keepStyle.trim());
            } else {
                el.removeAttribute('style');
            }
            enfantsNettoyes++;
        });
        
        if (enfantsNettoyes > 0) {
            console.log(`  🧹 ${enfantsNettoyes} enfant(s) avec styles inline nettoyés`);
        }
        
        // Vérifier si le switch existe déjà
        const existingSwitch = modalContent.querySelector('.modal-style-switch');
        if (existingSwitch) {
            console.log(`  ✓ Switch déjà présent → SKIP`);
            switchesExistants++;
            modalsTraitees.add(modal);
            return;
        }
        
        // Créer le switch
        console.log(`  🔨 Création du switch...`);
        const switchDiv = document.createElement('div');
        switchDiv.className = 'modal-style-switch';
        
        // 🔬 DEBUG APPROFONDI pour modal-config-vehicule
        if (modalId === 'modal-config-vehicule') {
            setTimeout(() => {
                console.log(`\n🔬 ========== DEBUG modal-config-vehicule ==========`);
                console.log(`📌 Classes <html>:`, document.documentElement.className);
                console.log(`📌 Thème:`, document.documentElement.classList.contains('theme-light') ? 'JOUR ☀️' : 'NUIT 🌙');
                console.log(`📌 Style:`, document.documentElement.classList.contains('style-apple') ? 'APPLE 🍎' : 'SIDEBAR 💻');
                
                const computed = window.getComputedStyle(modalContent);
                console.log(`\n🎨 COMPUTED STYLES .modal-content:`);
                console.log(`  background:`, computed.background);
                console.log(`  backgroundColor:`, computed.backgroundColor);
                console.log(`  backgroundImage:`, computed.backgroundImage);
                console.log(`  borderRadius:`, computed.borderRadius);
                console.log(`  border:`, computed.border);
                
                const h3 = modalContent.querySelector('h3');
                if (h3) {
                    const h3Comp = window.getComputedStyle(h3);
                    console.log(`\n📝 COMPUTED STYLES <h3>:`);
                    console.log(`  color:`, h3Comp.color);
                    console.log(`  style inline:`, h3.getAttribute('style') || '❌ AUCUN');
                }
                
                const infoBox = modalContent.querySelector('.info-box');
                if (infoBox) {
                    const boxComp = window.getComputedStyle(infoBox);
                    console.log(`\n📦 COMPUTED STYLES .info-box:`);
                    console.log(`  background:`, boxComp.background);
                    console.log(`  backgroundColor:`, boxComp.backgroundColor);
                    console.log(`  style inline:`, infoBox.getAttribute('style') || '❌ AUCUN');
                }
                
                console.log(`\n🔍 Vérification sélecteur CSS:`);
                const htmlApple = document.querySelector('html.theme-light.style-apple');
                console.log(`  html.theme-light.style-apple existe?`, htmlApple ? '✅ OUI' : '❌ NON');
                if (htmlApple) {
                    console.log(`  → La règle CSS DEVRAIT s'appliquer`);
                } else {
                    console.log(`  → Problème: classes HTML incorrectes!`);
                }
                console.log(`==================================================\n`);
            }, 200);
        }
        switchDiv.innerHTML = `
            <button type="button" onclick="window.setStyle('sidebar')" id="modal-btn-sidebar-${modalId}">SIDEBAR</button>
            <button type="button" onclick="window.setStyle('apple')" id="modal-btn-apple-${modalId}">APPLE</button>
        `;
        
        // Insérer le switch au début du modal-content
        modalContent.insertBefore(switchDiv, modalContent.firstChild);
        
        switchesAjoutes++;
        modalsTraitees.add(modal);
        console.log(`  ✅ Switch injecté avec succès!`);
    });
    
    if (switchesAjoutes > 0 || stylesNettoyes > 0) {
        console.log('\n%c=== 📊 RÉSUMÉ ===', 'background: #27ae60; color: white; padding: 4px 8px; font-weight: bold');
        console.log(`✅ ${switchesAjoutes} switch(es) ajouté(s)`);
        console.log(`✓  ${switchesExistants} switch(es) déjà présent(s)`);
        console.log(`🧹 ${stylesNettoyes} modal(s) avec styles nettoyés`);
        console.log(`⏭️  ${modalsDejaTraitees} modal(s) déjà traitée(s) précédemment`);
        if (modalsIgnorees > 0) console.log(`⚠️  ${modalsIgnorees} modal(s) ignorée(s)`);
        console.log(`📊 ${modals.length} modal(s) totale(s)`);
        console.log('=================================\n');
    }
    
    // Mettre à jour l'apparence des boutons
    setTimeout(() => {
        const currentStyle = document.documentElement.className.includes('style-apple') ? 'apple' : 'sidebar';
        updateAllModalSwitches(currentStyle);
    }, 100);
}

// OBSERVER pour détecter les nouvelles modals chargées dynamiquement
const observer = new MutationObserver((mutations) => {
    let nouvellesModals = false;
    mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
            if (node.nodeType === 1) { // Element
                // Vérifier si c'est une modal ou si ça contient des modals
                if (node.classList && node.classList.contains('modal')) {
                    nouvellesModals = true;
                } else if (node.querySelectorAll) {
                    const modalsInNode = node.querySelectorAll('.modal');
                    if (modalsInNode.length > 0) {
                        nouvellesModals = true;
                    }
                }
            }
        });
    });
    
    if (nouvellesModals) {
        console.log('🔄 Nouvelles modals détectées, injection...');
        injecterSwitchesModals();
    }
});

// Démarrer l'observation au chargement
document.addEventListener('DOMContentLoaded', function() {
    // Injection initiale
    injecterSwitchesModals();
    
    // Observer les changements dans le body
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    
    console.log('👀 Observer activé pour détecter les nouvelles modals');
});

// Fonction pour mettre à jour TOUS les switches de modals
function updateAllModalSwitches(style) {
    const allSwitches = document.querySelectorAll('.modal-style-switch');
    
    allSwitches.forEach(switchContainer => {
        const sidebarBtn = switchContainer.querySelector('[id*="sidebar"]');
        const appleBtn = switchContainer.querySelector('[id*="apple"]');
        
        if (!sidebarBtn || !appleBtn) return;
        
        if (style === 'apple') {
            appleBtn.style.background = 'rgba(0, 194, 203, 0.2)';
            appleBtn.style.color = '#00C2CB';
            appleBtn.style.fontWeight = '800';
            sidebarBtn.style.background = 'transparent';
            sidebarBtn.style.color = '#555';
            sidebarBtn.style.fontWeight = '700';
        } else {
            sidebarBtn.style.background = 'rgba(0, 194, 203, 0.25)';
            sidebarBtn.style.color = 'var(--upstay-cyan)';
            sidebarBtn.style.fontWeight = '800';
            appleBtn.style.background = 'transparent';
            appleBtn.style.color = 'rgba(255, 255, 255, 0.6)';
            appleBtn.style.fontWeight = '700';
        }
    });
}

// Wrapper de setStyle pour mettre à jour tous les switches
if (window.setStyle) {
    console.log('✅ window.setStyle existe, création du wrapper...');
    const originalSetStyle = window.setStyle;
    window.setStyle = function(style) {
        console.log(`🎨 [WRAPPER] Changement de style global: ${style.toUpperCase()}`);
        console.log(`📌 Avant changement - Classes HTML:`, document.documentElement.className);
        originalSetStyle.call(this, style);
        console.log(`📌 Après changement - Classes HTML:`, document.documentElement.className);
        updateAllModalSwitches(style);
        console.log(`✅ updateAllModalSwitches('${style}') appelé`);
    };
    console.log('✅ Wrapper setStyle installé avec succès');
} else {
    console.error('❌ window.setStyle n\'existe pas encore!');
}
