// ================================================================
// 🤖 WIDGET IA PROPOSITIONS QUOTIDIENNES
// ================================================================
// À intégrer dans le dashboard principal
// ================================================================

window.initAIPropositionsWidget = function() {
    // console.log('🤖 Initialisation Widget Propositions IA');

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
            <p style="color: rgba(255,255,255,0.8);">Chargement posts de la semaine...</p>
        </div>
    `;

    try {
        // Charger la stratégie ACTIVE (semaine en cours)
        const { data: strategy, error } = await window.supabaseClient
            .from('cm_ai_strategies')
            .select('*')
            .eq('statut', 'actif')
            .single();

        if (error) throw error;

        if (!strategy || !strategy.strategie_complete) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; grid-column: 1/-1; color: rgba(255,255,255,0.9);">
                    <p>✨ Aucune stratégie active</p>
                    <p style="font-size: 14px; opacity: 0.8;">Générez une stratégie dans Content IA</p>
                </div>
            `;
            return;
        }

        // Parser le JSON si c'est une string
        let stratComplete = strategy.strategie_complete;
        if (typeof stratComplete === 'string') {
            stratComplete = JSON.parse(stratComplete);
        }

        const posts = stratComplete.actions_reseaux || [];
        // console.log(`📥 ${posts.length} posts trouvés pour semaine ${strategy.semaine}`);
        
        if (posts.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; grid-column: 1/-1; color: rgba(255,255,255,0.9);">
                    <p>📭 Aucune action cette semaine</p>
                    <p style="font-size: 14px; opacity: 0.8;">Les actions apparaîtront après génération du plan</p>
                </div>
            `;
            return;
        }
        
        displayPropositions(posts, strategy.semaine);
        
    } catch (error) {
        console.error('❌ Erreur chargement propositions:', error);
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
function displayPropositions(posts, semaineNum) {
    const container = document.getElementById('aiPropositionsContainer');
    
    if (!posts || posts.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px; grid-column: 1/-1; color: rgba(255,255,255,0.9);">
                <p>✨ Aucun post cette semaine</p>
                <p style="font-size: 14px; opacity: 0.8;">Générez une nouvelle stratégie</p>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <div style="grid-column: 1/-1; margin-bottom: 15px; display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 14px; opacity: 0.9;">📋 Semaine en cours - ${posts.length} action(s) à réaliser</span>
        </div>
    ` + posts.map((post, index) => `
        <div class="proposition-card" onclick="openPostDetails(${index})">
            <span class="proposition-type type-post">
                ${post.plateforme || 'Post'}
            </span>
            
            <h4 style="margin: 10px 0 8px; font-size: 16px; line-height: 1.4;">
                ${post.titre || post.sujet}
            </h4>
            
            <p style="font-size: 13px; opacity: 0.9; margin-bottom: 12px; line-height: 1.5;">
                ${(post.contenu || '').substring(0, 100)}...
            </p>
            
            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 12px; opacity: 0.8;">
                <span>📱 ${post.plateforme}</span>
                <span>${post.cta ? '🎯 CTA' : ''}</span>
            </div>
            
            <div style="margin-top: 15px; display: flex; gap: 8px;">
                <button onclick="event.stopPropagation(); copyPost(${index})" style="
                    flex: 1;
                    background: rgba(34, 197, 94, 0.3);
                    border: 1px solid rgba(255,255,255,0.3);
                    padding: 8px;
                    border-radius: 6px;
                    color: white;
                    cursor: pointer;
                    font-weight: 600;
                    font-size: 12px;
                ">📋 Copier</button>
                
                <button onclick="event.stopPropagation(); viewPostFull(${index})" style="
                    background: rgba(59, 130, 246, 0.3);
                    border: 1px solid rgba(255,255,255,0.3);
                    padding: 8px 12px;
                    border-radius: 6px;
                    color: white;
                    cursor: pointer;
                    font-size: 12px;
                ">👁️</button>
            </div>
        </div>
    `).join('');

    // Stocker pour accès global
    window.currentPosts = posts;

    // Re-init Lucide icons
    if (window.lucide) {
        window.lucide.createIcons();
    }
}

// ================================================================
// ACTIONS SUR PROPOSITIONS
// ================================================================
window.copyPost = function(index) {
    const post = window.currentPosts[index];
    if (!post) return;
    
    const textToCopy = `${post.titre || post.sujet}\n\n${post.contenu}\n\n${post.hashtags || ''}\n\n${post.cta || ''}`;
    
    navigator.clipboard.writeText(textToCopy).then(() => {
        showToast('✅ Post copié dans le presse-papier !', 'success');
    }).catch(err => {
        console.error('❌ Erreur copie:', err);
        showToast('❌ Erreur lors de la copie', 'error');
    });
};

window.viewPostFull = function(index) {
    const post = window.currentPosts[index];
    if (!post) return;
    
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0,0,0,0.8); z-index: 10000;
        display: flex; align-items: center; justify-content: center;
        padding: 20px;
    `;
    
    modal.innerHTML = `
        <div style="background: white; border-radius: 16px; padding: 2rem; max-width: 600px; width: 100%; max-height: 80vh; overflow-y: auto;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                <h3 style="margin: 0; color: #1e293b;">${post.titre || post.sujet}</h3>
                <button onclick="this.parentElement.parentElement.parentElement.remove()" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #64748b;">×</button>
            </div>
            <div style="background: #f8fafc; padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
                <span style="display: inline-block; padding: 4px 12px; background: #667eea; color: white; border-radius: 6px; font-size: 0.75rem; font-weight: 600; margin-bottom: 0.5rem;">${post.plateforme}</span>
            </div>
            <div style="white-space: pre-wrap; color: #475569; line-height: 1.6; margin-bottom: 1rem;">${post.contenu}</div>
            ${post.hashtags ? `<div style="color: #667eea; margin-bottom: 1rem;">${post.hashtags}</div>` : ''}
            ${post.cta ? `<div style="background: #eff6ff; padding: 1rem; border-radius: 8px; color: #1e40af; font-weight: 500;">${post.cta}</div>` : ''}
            <button onclick="copyPost(${index}); this.parentElement.parentElement.remove();" style="width: 100%; padding: 12px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; margin-top: 1rem;">📋 Copier et Fermer</button>
        </div>
    `;
    
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
    document.body.appendChild(modal);
};

window.openPostDetails = function(index) {
    viewPostFull(index);
};

window.acceptProposition = async function(propositionId, type) {
    // console.log('✓ Acceptation proposition:', propositionId);
    showToast(`Proposition acceptée !`, 'success');
};

window.rejectProposition = async function(propositionId) {
    // console.log('✕ Rejet proposition:', propositionId);
    showToast('Proposition rejetée', 'success');
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
    // console.log('🤖 Widget IA Propositions chargé');
    
    // Auto-refresh toutes les heures
    setInterval(() => {
        // console.log('🔄 Auto-refresh propositions IA');
        window.refreshAIPropositions();
    }, 3600000); // 1h
});
