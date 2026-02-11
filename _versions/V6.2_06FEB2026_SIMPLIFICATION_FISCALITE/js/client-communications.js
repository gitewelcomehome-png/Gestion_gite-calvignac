// ================================================================
// 📢 COMMUNICATIONS CLIENTS
// ================================================================
// Affiche les messages/informations envoyés par les admins
// Avec sauvegarde locale et gestion de l'affichage
// ================================================================

// Gestion localStorage pour sauvegardes et masquages
const STORAGE_KEY = 'client_communications_state';

function getCommState() {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : { saved: [], hidden: [] };
}

function saveCommState(state) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function isCommSaved(id) {
    const state = getCommState();
    return state.saved.includes(id);
}

function isCommHidden(id) {
    const state = getCommState();
    return state.hidden.includes(id);
}

function toggleCommSaved(id) {
    const state = getCommState();
    if (state.saved.includes(id)) {
        state.saved = state.saved.filter(sid => sid !== id);
    } else {
        state.saved.push(id);
    }
    saveCommState(state);
}

function hideComm(id) {
    const state = getCommState();
    if (!state.hidden.includes(id)) {
        state.hidden.push(id);
    }
    saveCommState(state);
}

async function loadClientCommunications() {
    try {
        if (!window.supabaseClient) {
            console.error('❌ window.supabaseClient non disponible');
            return;
        }
        
        // Récupérer les communications actives
        const { data: communications, error } = await window.supabaseClient
            .from('admin_communications')
            .select('*')
            .or('date_fin.is.null,date_fin.gt.' + new Date().toISOString())
            .order('created_at', { ascending: false });
        
        if (error) {
            console.error('❌ Erreur chargement communications:', error);
            return;
        }
        
        if (!communications || communications.length === 0) {
            const container = document.getElementById('clientCommunicationsWidget');
            if (container) container.style.display = 'none';
            return;
        }
        
        // Filtrer les communications masquées
        const state = getCommState();
        const visibleComms = communications.filter(c => !state.hidden.includes(c.id));
        
        if (visibleComms.length === 0) {
            const container = document.getElementById('clientCommunicationsWidget');
            if (container) container.style.display = 'none';
            return;
        }
        
        // Stocker pour la modal
        window.clientCommunications = visibleComms;
        
        displayClientCommunications(visibleComms);
        
    } catch (error) {
        console.error('❌ Erreur:', error);
    }
}

function displayClientCommunications(communications) {
    const container = document.getElementById('clientCommunicationsWidget');
    if (!container) return;
    
    container.style.display = 'block';
    
    const html = communications.map(comm => {
        const saved = isCommSaved(comm.id);
        
        const typeColors = {
            info: { 
                light: { bg: '#e0f2fe', border: '#0ea5e9', icon: 'info', text: '#0c4a6e' },
                dark: { bg: '#0c4a6e', border: '#38bdf8', icon: 'info', text: '#e0f2fe' }
            },
            warning: { 
                light: { bg: '#fef3c7', border: '#f59e0b', icon: 'alert-triangle', text: '#78350f' },
                dark: { bg: '#78350f', border: '#fbbf24', icon: 'alert-triangle', text: '#fef3c7' }
            },
            success: { 
                light: { bg: '#d1fae5', border: '#10b981', icon: 'check-circle', text: '#064e3b' },
                dark: { bg: '#064e3b', border: '#34d399', icon: 'check-circle', text: '#d1fae5' }
            },
            urgent: { 
                light: { bg: '#fee2e2', border: '#ef4444', icon: 'alert-octagon', text: '#7f1d1d' },
                dark: { bg: '#7f1d1d', border: '#f87171', icon: 'alert-octagon', text: '#fee2e2' }
            }
        };
        
        const style = typeColors[comm.type] || typeColors.info;
        
        return `
            <div class="comm-item" data-theme-light data-theme-dark
                 onclick="window.openCommModal('${comm.id}')"
                 style="
                     cursor: pointer;
                     transition: all 0.3s ease;
                     border-radius: 12px;
                     overflow: hidden;
                     position: relative;">
                <div class="comm-item-content" style="
                    padding: 16px 20px;
                    display: flex;
                    align-items: center;
                    gap: 16px;">
                    
                    ${saved ? `<div class="comm-saved-badge" style="position: absolute; top: 8px; right: 8px; background: #10b981; color: white; padding: 4px 8px; border-radius: 6px; font-size: 11px; font-weight: 700;">
                        <i data-lucide="bookmark" style="width: 12px; height: 12px;"></i> SAUVEGARDÉ
                    </div>` : ''}
                    
                    <div class="comm-icon">
                        <i data-lucide="${style.light.icon}"></i>
                    </div>
                    
                    <div style="flex: 1; min-width: 0;">
                        <div class="comm-title">${comm.titre}</div>
                        ${comm.date_fin ? `<div class="comm-date">Expire le ${new Date(comm.date_fin).toLocaleDateString()}</div>` : ''}
                    </div>
                    
                    <i data-lucide="chevron-right" class="comm-arrow"></i>
                </div>
            </div>
        `;
    }).join('');
    
    container.innerHTML = `
        <div class="card card--spacious communications-widget" data-theme-light data-theme-dark style="margin-bottom: 20px;">
            <header class="section-header" style="margin-bottom: 16px; display: flex; align-items: center; justify-content: space-between;">
                <h3 class="section-title" style="display: flex; align-items: center; gap: 10px; margin: 0;">
                    <i data-lucide="megaphone"></i>
                    Informations importantes
                </h3>
                <span class="badge" style="background: var(--upstay-cyan); color: white; padding: 5px 12px; border-radius: 12px; font-size: 12px; font-weight: 700;">
                    ${communications.length}
                </span>
            </header>
            <div style="display: flex; flex-direction: column; gap: 12px;">
                ${html}
            </div>
        </div>
    `;
    
    // Appliquer les styles CSS dynamiques
    applyCommunicationsStyles();
    
    // Réinitialiser les icônes Lucide
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

function applyCommunicationsStyles() {
    const styleId = 'comm-dynamic-styles';
    let styleEl = document.getElementById(styleId);
    
    if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = styleId;
        document.head.appendChild(styleEl);
    }
    
    styleEl.textContent = `
        /* Mode JOUR (Thème Light par défaut) */
        html.theme-light .communications-widget .comm-item,
        .communications-widget .comm-item {
            background: #ffffff !important;
            border: 2px solid #e2e8f0 !important;
        }
        html.theme-light .communications-widget .comm-item:hover,
        .communications-widget .comm-item:hover {
            transform: translateX(4px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.1) !important;
            border-color: var(--upstay-cyan) !important;
        }
        html.theme-light .communications-widget .comm-icon,
        .communications-widget .comm-icon {
            width: 44px;
            height: 44px;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            background: #f8fafc !important;
            color: #000000 !important;
        }
        html.theme-light .communications-widget .comm-icon svg,
        html.theme-light .communications-widget .comm-icon i,
        .communications-widget .comm-icon svg,
        .communications-widget .comm-icon i {
            width: 22px;
            height: 22px;
            color: #000000 !important;
            stroke: #000000 !important;
        }
        html.theme-light .communications-widget .comm-title,
        .communications-widget .comm-title {
            font-weight: 600;
            font-size: 15px;
            margin-bottom: 4px;
            color: #000000 !important;
        }
        html.theme-light .communications-widget .comm-date,
        .communications-widget .comm-date {
            font-size: 12px;
            opacity: 0.7;
            color: #000000 !important;
        }
        html.theme-light .communications-widget .comm-arrow,
        .communications-widget .comm-arrow {
            width: 20px;
            height: 20px;
            opacity: 0.5;
            flex-shrink: 0;
            color: #000000 !important;
            stroke: #000000 !important;
        }
        
        /* Mode NUIT (Thème Dark) */
        html.theme-dark .communications-widget .comm-item {
            background: #0f172a !important;
            border: 2px solid #334155 !important;
        }
        html.theme-dark .communications-widget .comm-item:hover {
            transform: translateX(4px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.5) !important;
            border-color: #38bdf8 !important;
        }
        html.theme-dark .communications-widget .comm-icon {
            background: #1e293b !important;
            color: #ffffff !important;
        }
        html.theme-dark .communications-widget .comm-icon svg,
        html.theme-dark .communications-widget .comm-icon i {
            color: #ffffff !important;
            stroke: #ffffff !important;
        }
        html.theme-dark .communications-widget .comm-title {
            color: #ffffff !important;
        }
        html.theme-dark .communications-widget .comm-date {
            color: #ffffff !important;
        }
        html.theme-dark .communications-widget .comm-arrow {
            color: #ffffff !important;
            stroke: #ffffff !important;
        }
    `;
}

// Stocker les communications pour la modal
window.clientCommunications = [];

function openCommModal(id) {
    const comm = window.clientCommunications.find(c => c.id === id);
    if (!comm) {
        window.supabaseClient
            .from('admin_communications')
            .select('*')
            .eq('id', id)
            .single()
            .then(({ data, error }) => {
                if (!error && data) {
                    showCommModal(data);
                }
            });
        return;
    }
    
    showCommModal(comm);
}

function showCommModal(comm) {
    const saved = isCommSaved(comm.id);
    
    const typeColors = {
        info: { bg: '#0ea5e9', icon: 'info' },
        warning: { bg: '#f59e0b', icon: 'alert-triangle' },
        success: { bg: '#10b981', icon: 'check-circle' },
        urgent: { bg: '#ef4444', icon: 'alert-octagon' }
    };
    
    const style = typeColors[comm.type] || typeColors.info;
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay comm-modal';
    modal.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 10000; animation: fadeIn 0.2s ease;';
    
    modal.innerHTML = `
        <div class="modal-content comm-modal-content" style="
            border-radius: 20px; 
            padding: 0; 
            max-width: 700px; 
            width: 90%; 
            max-height: 85vh; 
            overflow: hidden;
            box-shadow: 0 25px 50px -12px rgba(0,0,0,0.4);
            animation: slideUp 0.3s ease;">
            
            <!-- Header -->
            <div class="comm-modal-header" style="
                background: linear-gradient(135deg, ${style.bg}, ${style.bg}dd);
                padding: 24px 28px;
                display: flex;
                align-items: flex-start;
                gap: 16px;">
                
                <div class="comm-modal-icon-wrapper" style="
                    width: 56px; 
                    height: 56px; 
                    border-radius: 14px; 
                    background: rgba(255,255,255,0.2); 
                    backdrop-filter: blur(10px);
                    display: flex; 
                    align-items: center; 
                    justify-content: center; 
                    flex-shrink: 0;">
                    <i data-lucide="${style.icon}" class="comm-modal-icon"></i>
                </div>
                
                <div class="comm-modal-header-text" style="flex: 1;">
                    <h2 class="comm-modal-title">${comm.titre}</h2>
                    <div class="comm-modal-meta">
                        📅 Publié le ${new Date(comm.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                        ${comm.date_fin ? ` • ⏱️ Expire le ${new Date(comm.date_fin).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}` : ''}
                    </div>
                </div>
                
                <button onclick="this.closest('.modal-overlay').remove()" class="comm-modal-close" style="
                    border: none; 
                    width: 40px; 
                    height: 40px; 
                    border-radius: 10px; 
                    cursor: pointer; 
                    display: flex; 
                    align-items: center; 
                    justify-content: center;
                    transition: all 0.2s;">
                    <i data-lucide="x" style="width: 22px; height: 22px;"></i>
                </button>
            </div>
            
            <!-- Content -->
            <div class="comm-modal-body" style="
                padding: 28px;
                max-height: calc(85vh - 200px);
                overflow-y: auto;">
                <div class="comm-modal-text">
                    ${comm.message}
                </div>
            </div>
            
            <!-- Footer Actions -->
            <div class="comm-modal-footer" style="
                padding: 20px 28px;
                display: flex;
                gap: 12px;
                justify-content: flex-end;">
                
                <button onclick="window.toggleCommSavedFromModal('${comm.id}')" 
                        id="saveBtnModal-${comm.id}"
                        style="
                    background: ${saved ? '#10b981' : '#e2e8f0'}; 
                    color: ${saved ? 'white' : '#64748b'};
                    border: none;
                    padding: 12px 24px;
                    border-radius: 10px;
                    font-weight: 600;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    transition: all 0.2s;">
                    <i data-lucide="${saved ? 'bookmark-check' : 'bookmark'}" style="width: 18px; height: 18px;"></i>
                    ${saved ? 'Sauvegardé' : 'Sauvegarder'}
                </button>
                
                <button onclick="window.hideCommFromModal('${comm.id}')" style="
                    background: #ef4444; 
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 10px;
                    font-weight: 600;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    transition: all 0.2s;">
                    <i data-lucide="eye-off" style="width: 18px; height: 18px;"></i>
                    Masquer
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Ajouter les animations CSS
    addModalAnimations();
    
    // Réinitialiser les icônes Lucide
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
    
    // Fermer en cliquant sur le fond
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.animation = 'fadeOut 0.2s ease';
            setTimeout(() => modal.remove(), 200);
        }
    });
}

function addModalAnimations() {
    const styleId = 'comm-modal-animations';
    if (document.getElementById(styleId)) return;
    
    const styleEl = document.createElement('style');
    styleEl.id = styleId;
    styleEl.textContent = `
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        @keyframes fadeOut {
            from { opacity: 1; }
            to { opacity: 0; }
        }
        @keyframes slideUp {
            from { transform: translateY(20px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
        
        /* Bouton fermeture modal */
        html.theme-light .comm-modal-close,
        .comm-modal-close {
            background: rgba(0,0,0,0.05) !important;
            backdrop-filter: blur(10px);
        }
        html.theme-light .comm-modal-close:hover,
        .comm-modal-close:hover {
            background: rgba(0,0,0,0.1) !important;
            transform: scale(1.05);
        }
        html.theme-light .comm-modal-close svg,
        html.theme-light .comm-modal-close i,
        .comm-modal-close svg,
        .comm-modal-close i {
            color: #000000 !important;
            stroke: #000000 !important;
        }
        
        html.theme-dark .comm-modal-close {
            background: rgba(255,255,255,0.15) !important;
        }
        html.theme-dark .comm-modal-close:hover {
            background: rgba(255,255,255,0.25) !important;
        }
        html.theme-dark .comm-modal-close svg,
        html.theme-dark .comm-modal-close i {
            color: #ffffff !important;
            stroke: #ffffff !important;
        }
        
        /* Badge sauvegardé */
        .comm-saved-badge {
            background: #10b981 !important;
            color: white !important;
        }
        
        /* Modal Content - Mode Jour */
        html.theme-light .comm-modal-content,
        .comm-modal-content {
            background: white !important;
        }
        html.theme-light .comm-modal-body,
        .comm-modal-body {
            background: white !important;
        }
        html.theme-light .comm-modal-text,
        .comm-modal-text {
            line-height: 1.8;
            white-space: pre-wrap;
            font-size: 15px;
            color: #1e293b !important;
        }
        html.theme-light .comm-modal-footer,
        .comm-modal-footer {
            background: #f8fafc !important;
            border-top: 1px solid #e2e8f0 !important;
        }
        
        /* Header modal (toujours blanc sur gradient) */
        .comm-modal-header-text {
            color: white !important;
        }
        .comm-modal-title {
            margin: 0 0 8px 0;
            font-size: 24px;
            font-weight: 700;
            line-height: 1.2;
            color: white !important;
        }
        .comm-modal-meta {
            font-size: 14px;
            opacity: 0.9;
            color: white !important;
        }
        .comm-modal-icon {
            width: 28px;
            height: 28px;
            color: white !important;
            stroke: white !important;
        }
        
        /* Modal Content - Mode Nuit */
        html.theme-dark .comm-modal-content {
            background: #1e293b !important;
        }
        html.theme-dark .comm-modal-body {
            background: #1e293b !important;
        }
        html.theme-dark .comm-modal-text {
            line-height: 1.8;
            white-space: pre-wrap;
            font-size: 15px;
            color: #f1f5f9 !important;
        }
        html.theme-dark .comm-modal-footer {
            background: #0f172a !important;
            border-top: 1px solid #334155 !important;
        }
        
        /* Header modal reste blanc sur gradient en mode nuit aussi */
        html.theme-dark .comm-modal-header-text {
            color: white !important;
        }
        html.theme-dark .comm-modal-title {
            color: white !important;
        }
        html.theme-dark .comm-modal-meta {
            color: white !important;
        }
        html.theme-dark .comm-modal-icon {
            color: white !important;
            stroke: white !important;
        }
        
        .comm-modal-body::-webkit-scrollbar {
            width: 8px;
        }
        .comm-modal-body::-webkit-scrollbar-track {
            background: #f1f5f9;
            border-radius: 4px;
        }
        .comm-modal-body::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 4px;
        }
        .comm-modal-body::-webkit-scrollbar-thumb:hover {
            background: #94a3b8;
        }
        
        @media (prefers-color-scheme: dark) {
            .comm-modal-body::-webkit-scrollbar-track {
                background: #0f172a;
            }
            .comm-modal-body::-webkit-scrollbar-thumb {
                background: #475569;
            }
            .comm-modal-body::-webkit-scrollbar-thumb:hover {
                background: #64748b;
            }
        }
        
        .comm-modal-footer button:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
    `;
    document.head.appendChild(styleEl);
}

function toggleCommSavedFromModal(id) {
    toggleCommSaved(id);
    const saved = isCommSaved(id);
    const btn = document.getElementById(`saveBtnModal-${id}`);
    if (btn) {
        btn.style.background = saved ? '#10b981' : '#e2e8f0';
        btn.style.color = saved ? 'white' : '#64748b';
        btn.innerHTML = `
            <i data-lucide="${saved ? 'bookmark-check' : 'bookmark'}" style="width: 18px; height: 18px;"></i>
            ${saved ? 'Sauvegardé' : 'Sauvegarder'}
        `;
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }
    // Recharger le widget
    loadClientCommunications();
}

function hideCommFromModal(id) {
    if (confirm('Masquer cette communication ?\n\nElle ne sera plus visible dans votre dashboard (mais reste disponible côté administrateur).')) {
        hideComm(id);
        document.querySelector('.modal-overlay')?.remove();
        loadClientCommunications();
    }
}

// Charger au démarrage
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(loadClientCommunications, 1000);
    });
} else {
    setTimeout(loadClientCommunications, 1000);
}

// Exporter les fonctions
window.loadClientCommunications = loadClientCommunications;
window.openCommModal = openCommModal;
window.toggleCommSavedFromModal = toggleCommSavedFromModal;
window.hideCommFromModal = hideCommFromModal;
window.toggleCommSaved = toggleCommSaved;
