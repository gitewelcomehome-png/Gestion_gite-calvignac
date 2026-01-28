/**
 * Modal de gestion des règles de ménage
 */
function showCleaningRulesModal() {
    const modal = document.createElement('div');
    modal.id = 'cleaning-rules-modal';
    modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 20px; overflow-y: auto;';
    
    modal.innerHTML = `
        <div style="background: var(--card); border: 3px solid #2D3436; border-radius: 16px; box-shadow: 8px 8px 0 #2D3436; max-width: 900px; width: 100%; max-height: 85vh; overflow-y: auto; margin: auto;">
            <div style="position: sticky; top: 0; background: linear-gradient(135deg, #a29bfe 0%, #6c5ce7 100%); padding: 25px; border-bottom: 3px solid #2D3436; border-radius: 13px 13px 0 0; z-index: 10;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <h2 style="margin: 0 0 5px 0; font-size: 1.8rem; color: white; font-weight: 700;">🎯 Règles de Ménage</h2>
                        <p style="margin: 0; font-size: 0.95rem; color: rgba(255,255,255,0.9);">Configurez les règles de planification automatique</p>
                    </div>
                    <button onclick="closeCleaningRulesModal()" style="background: #ff7675; color: white; border: 2px solid #2D3436; border-radius: 50%; width: 45px; height: 45px; cursor: pointer; font-size: 1.3rem; box-shadow: 3px 3px 0 #2D3436; font-weight: 700;">✕</button>
                </div>
            </div>
            
            <div style="padding: 30px;">
                <div style="background: #e3f2fd; border: 2px solid #2196f3; border-radius: 12px; padding: 15px; margin-bottom: 25px;">
                    <p style="margin: 0; font-size: 0.9rem; color: #1565c0; line-height: 1.6;">
                        <strong>💡 Info:</strong> Les règles sont appliquées par ordre de priorité (1 = plus prioritaire). 
                        Désactivez une règle si vous ne souhaitez pas qu'elle soit appliquée.
                    </p>
                </div>
                
                <div id="cleaning-rules-list">
                    <div style="text-align: center; padding: 40px;">
                        <div style="font-size: 2rem; margin-bottom: 10px;">⏳</div>
                        <p style="color: #636e72;">Chargement des règles...</p>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Charger les règles après que le modal soit ajouté au DOM
    if (typeof loadCleaningRules === 'function') {
        setTimeout(() => loadCleaningRules(), 100);
    } else {
        console.error('❌ loadCleaningRules non disponible');
        const listDiv = document.getElementById('cleaning-rules-list');
        if (listDiv) {
            listDiv.innerHTML = '<div style="text-align: center; padding: 40px; color: red;"><p>Erreur: Module de règles non chargé</p></div>';
        }
    }
}

function closeCleaningRulesModal() {
    const modal = document.getElementById('cleaning-rules-modal');
    if (modal) {
        modal.remove();
    }
    
    // Rafraîchir le planning des ménages si la fonction existe
    if (typeof afficherPlanningParSemaine === 'function') {
        console.log('🔄 Rafraîchissement du planning ménage après modification des règles...');
        afficherPlanningParSemaine();
    }
}

window.showCleaningRulesModal = showCleaningRulesModal;
window.closeCleaningRulesModal = closeCleaningRulesModal;
