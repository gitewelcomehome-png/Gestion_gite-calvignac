// ================================================================
// 🤖 WIDGET IA PROPOSITIONS QUOTIDIENNES
// ================================================================
// À intégrer dans le dashboard principal
// ================================================================

window.initAIPropositionsWidget = function() {
    console.log('🤖 Initialisation Widget Propositions IA');

    // Créer le HTML du widget
    const widgetHTML = `
        <div class="ai-propositions-widget" style="
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 12px;
            padding: 25px;
            color: white;
            margin-bottom: 20px;
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
        ">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h3 style="margin: 0; display: flex; align-items: center; gap: 10px; font-size: 20px;">
                    <i data-lucide="sparkles"></i>
                    Propositions IA du Jour
                </h3>
                <button onclick="window.refreshAIPropositions()" style="
                    background: rgba(255,255,255,0.2);
                    border: none;
                    padding: 8px 15px;
                    border-radius: 6px;
                    color: white;
                    cursor: pointer;
                    font-weight: 600;
                    transition: all 0.3s;
                " onmouseover="this.style.background='rgba(255,255,255,0.3)'" onmouseout="this.style.background='rgba(255,255,255,0.2)'">
                    <i data-lucide="refresh-cw" style="width: 16px; height: 16px;"></i>
                </button>
            </div>

            <div id="aiPropositionsContainer" style="
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                gap: 15px;
            ">
                <div style="text-align: center; padding: 40px; grid-column: 1/-1;">
                    <div class="spinner" style="
                        border: 3px solid rgba(255,255,255,0.3);
                        border-top-color: white;
                        border-radius: 50%;
                        width: 40px;
                        height: 40px;
                        margin: 0 auto 15px;
                        animation: spin 1s linear infinite;
                    "></div>
                    <p style="color: rgba(255,255,255,0.8);">Claude analyse votre stratégie...</p>
                </div>
            </div>

            <style>
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
                
                .proposition-card {
                    background: rgba(255,255,255,0.15);
                    backdrop-filter: blur(10px);
                    border-radius: 10px;
                    padding: 20px;
                    transition: all 0.3s;
                    cursor: pointer;
                    border: 1px solid rgba(255,255,255,0.2);
                }
                
                .proposition-card:hover {
                    background: rgba(255,255,255,0.25);
                    transform: translateY(-2px);
                    box-shadow: 0 8px 16px rgba(0,0,0,0.2);
                }
                
                .proposition-type {
                    display: inline-block;
                    padding: 4px 10px;
                    border-radius: 20px;
                    font-size: 11px;
                    font-weight: 600;
                    text-transform: uppercase;
                    margin-bottom: 10px;
                }
                
                .type-post { background: rgba(59, 130, 246, 0.3); }
                .type-promotion { background: rgba(34, 197, 94, 0.3); }
                .type-email { background: rgba(249, 115, 22, 0.3); }
                .type-video { background: rgba(236, 72, 153, 0.3); }
            </style>
        </div>
    `;

    return widgetHTML;
};

// ================================================================
// GÉNÉRATION DES PROPOSITIONS QUOTIDIENNES
// ================================================================
window.refreshAIPropositions = async function() {
    const container = document.getElementById('aiPropositionsContainer');
    if (!container) return;

    // Loading state
    container.innerHTML = `
        <div style="text-align: center; padding: 40px; grid-column: 1/-1;">
            <div class="spinner" style="
                border: 3px solid rgba(255,255,255,0.3);
                border-top-color: white;
                border-radius: 50%;
                width: 40px;
                height: 40px;
                margin: 0 auto 15px;
                animation: spin 1s linear infinite;
            "></div>
            <p style="color: rgba(255,255,255,0.8);">Génération des propositions...</p>
        </div>
    `;

    try {
        // Appeler l'API pour générer les propositions
        const response = await fetch('/api/content-ai', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'generate-daily-propositions'
            })
        });

        const data = await response.json();
        
        console.log('📥 Réponse API:', data);
        
        if (data.success && data.propositions) {
            displayPropositions(data.propositions);
        } else {
            console.error('❌ Erreur API:', data);
            throw new Error(data.error || 'Erreur génération');
        }
    } catch (error) {
        console.error('❌ Erreur propositions IA:', error);
        container.innerHTML = `
            <div style="text-align: center; padding: 40px; grid-column: 1/-1; color: rgba(255,255,255,0.9);">
                <p>⚠️ ${error.message || 'Erreur lors de la génération'}</p>
                <button onclick="window.refreshAIPropositions()" style="
                    background: rgba(255,255,255,0.2);
                    border: none;
                    padding: 10px 20px;
                    border-radius: 6px;
                    color: white;
                    cursor: pointer;
                    margin-top: 10px;
                ">Réessayer</button>
            </div>
        `;
    }
};

// ================================================================
// AFFICHAGE DES PROPOSITIONS
// ================================================================
function displayPropositions(propositions) {
    const container = document.getElementById('aiPropositionsContainer');
    
    if (!propositions || propositions.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px; grid-column: 1/-1; color: rgba(255,255,255,0.9);">
                <p>✨ Aucune proposition aujourd'hui</p>
                <p style="font-size: 14px; opacity: 0.8;">Claude génère des propositions selon votre stratégie</p>
            </div>
        `;
        return;
    }

    const iconsMap = {
        'post': 'message-square',
        'promotion': 'percent',
        'email': 'mail',
        'video': 'video',
        'blog': 'file-text'
    };

    container.innerHTML = propositions.map(prop => `
        <div class="proposition-card" onclick="acceptProposition('${prop.id}', '${prop.type}')">
            <span class="proposition-type type-${prop.type}">
                ${prop.type}
            </span>
            
            <h4 style="margin: 10px 0 8px; font-size: 16px; line-height: 1.4;">
                ${prop.titre}
            </h4>
            
            <p style="font-size: 13px; opacity: 0.9; margin-bottom: 12px; line-height: 1.5;">
                ${prop.apercu}
            </p>
            
            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 12px; opacity: 0.8;">
                <span>📊 ${prop.potentiel || 'Moyen'}</span>
                <span>⏱️ ${prop.timing || 'Aujourd\'hui'}</span>
            </div>
            
            <div style="margin-top: 15px; display: flex; gap: 8px;">
                <button onclick="event.stopPropagation(); acceptProposition('${prop.id}', '${prop.type}')" style="
                    flex: 1;
                    background: rgba(34, 197, 94, 0.3);
                    border: 1px solid rgba(255,255,255,0.3);
                    padding: 8px;
                    border-radius: 6px;
                    color: white;
                    cursor: pointer;
                    font-weight: 600;
                    font-size: 12px;
                ">✓ Accepter</button>
                
                <button onclick="event.stopPropagation(); rejectProposition('${prop.id}')" style="
                    background: rgba(239, 68, 68, 0.3);
                    border: 1px solid rgba(255,255,255,0.3);
                    padding: 8px 12px;
                    border-radius: 6px;
                    color: white;
                    cursor: pointer;
                    font-size: 12px;
                ">✕</button>
            </div>
        </div>
    `).join('');

    // Re-init Lucide icons
    if (window.lucide) {
        window.lucide.createIcons();
    }
}

// ================================================================
// ACTIONS SUR PROPOSITIONS
// ================================================================
window.acceptProposition = async function(propositionId, type) {
    console.log('✓ Acceptation proposition:', propositionId);
    
    // TODO: Implémenter création contenu depuis proposition
    showToast(`Proposition acceptée ! Création ${type} en cours...`, 'success');
    
    // Rediriger vers onglet génération ou queue
    if (type === 'post' || type === 'email') {
        // Ouvrir modal génération pré-remplie
        window.location.href = 'admin-content.html?generate=' + propositionId;
    }
};

window.rejectProposition = async function(propositionId) {
    console.log('✕ Rejet proposition:', propositionId);
    
    // Enregistrer feedback négatif
    showToast('Proposition rejetée. Claude apprendra.', 'success');
    
    // TODO: Sauvegarder dans cm_ai_content_feedback
    window.refreshAIPropositions();
};

// ================================================================
// TOAST HELPER
// ================================================================
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: white;
        padding: 15px 25px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        border-left: 4px solid ${type === 'success' ? '#22c55e' : '#ef4444'};
        animation: slideIn 0.3s;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => toast.remove(), 3000);
}

// ================================================================
// AUTO-INIT AU CHARGEMENT
// ================================================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('🤖 Widget IA Propositions chargé');
    
    // Auto-refresh toutes les heures
    setInterval(() => {
        console.log('🔄 Auto-refresh propositions IA');
        window.refreshAIPropositions();
    }, 3600000); // 1h
});
