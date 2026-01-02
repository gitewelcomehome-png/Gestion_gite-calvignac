/**
 * 📧 MODULE MESSAGERIE
 * Gestion des connexions aux messageries et synchronisation des emails
 */

// ==========================================
// CONFIGURATION DES PROVIDERS
// ==========================================

const EMAIL_PROVIDERS = {
    gmail: {
        name: 'Gmail',
        authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
        clientId: '', // À configurer
        scopes: ['https://www.googleapis.com/auth/gmail.readonly', 'https://www.googleapis.com/auth/gmail.send']
    },
    outlook: {
        name: 'Outlook',
        authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
        clientId: '', // À configurer
        scopes: ['https://outlook.office.com/Mail.Read', 'https://outlook.office.com/Mail.Send']
    }
};

// État de connexion (stocké dans localStorage)
let connectedAccounts = JSON.parse(localStorage.getItem('connectedAccounts') || '{}');

// ==========================================
// CONNEXION GMAIL
// ==========================================

async function connectGmail() {
    showToast('⚠️ Configuration OAuth nécessaire', 'error');
    
    // Modal d'information
    const modal = `
        <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); z-index: 10000; display: flex; align-items: center; justify-content: center;" onclick="this.remove()">
            <div style="background: white; padding: 30px; border-radius: 12px; max-width: 600px; box-shadow: 0 10px 40px rgba(0,0,0,0.3);" onclick="event.stopPropagation()">
                <h3 style="margin-top: 0; color: #EA4335;">🔐 Configuration OAuth Gmail</h3>
                <p style="line-height: 1.6;">Pour connecter Gmail, vous devez :</p>
                <ol style="line-height: 1.8;">
                    <li>Créer un projet sur <a href="https://console.cloud.google.com" target="_blank">Google Cloud Console</a></li>
                    <li>Activer l'API Gmail</li>
                    <li>Créer des identifiants OAuth 2.0</li>
                    <li>Configurer les URI de redirection autorisées</li>
                    <li>Ajouter le Client ID dans le code</li>
                </ol>
                <div style="background: #f5f5f5; padding: 15px; border-radius: 6px; margin: 15px 0;">
                    <strong>Alternative :</strong> Utilisez une configuration IMAP personnalisée ci-dessous
                </div>
                <button onclick="this.closest('div[style*=fixed]').remove()" style="background: #EA4335; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: 600;">
                    Compris
                </button>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modal);
}

// ==========================================
// CONNEXION OUTLOOK
// ==========================================

async function connectOutlook() {
    showToast('⚠️ Configuration OAuth nécessaire', 'error');
    
    const modal = `
        <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); z-index: 10000; display: flex; align-items: center; justify-content: center;" onclick="this.remove()">
            <div style="background: white; padding: 30px; border-radius: 12px; max-width: 600px; box-shadow: 0 10px 40px rgba(0,0,0,0.3);" onclick="event.stopPropagation()">
                <h3 style="margin-top: 0; color: #0078D4;">🔐 Configuration OAuth Outlook</h3>
                <p style="line-height: 1.6;">Pour connecter Outlook, vous devez :</p>
                <ol style="line-height: 1.8;">
                    <li>Créer une application sur <a href="https://portal.azure.com" target="_blank">Azure Portal</a></li>
                    <li>Configurer les permissions Microsoft Graph</li>
                    <li>Ajouter les URI de redirection</li>
                    <li>Obtenir le Client ID et Secret</li>
                    <li>Configurer dans le code</li>
                </ol>
                <div style="background: #f5f5f5; padding: 15px; border-radius: 6px; margin: 15px 0;">
                    <strong>Alternative :</strong> Utilisez une configuration IMAP personnalisée ci-dessous
                </div>
                <button onclick="this.closest('div[style*=fixed]').remove()" style="background: #0078D4; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: 600;">
                    Compris
                </button>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modal);
}

// ==========================================
// CONFIGURATION IMAP PERSONNALISÉE
// ==========================================

function configureIMAP() {
    const modal = `
        <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); z-index: 10000; display: flex; align-items: center; justify-content: center;" onclick="closeIMAPModal(event)">
            <div style="background: white; padding: 30px; border-radius: 12px; max-width: 600px; box-shadow: 0 10px 40px rgba(0,0,0,0.3); max-height: 80vh; overflow-y: auto;" onclick="event.stopPropagation()">
                <h3 style="margin-top: 0; color: #2c3e50;">⚙️ Configuration IMAP</h3>
                <form id="imapForm" onsubmit="saveIMAPConfig(event)" style="display: flex; flex-direction: column; gap: 15px;">
                    <div>
                        <label style="font-weight: 600; display: block; margin-bottom: 5px;">Serveur IMAP</label>
                        <input type="text" id="imap_host" placeholder="imap.example.com" required style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;">
                        <small style="color: #7f8c8d;">Ex: imap.gmail.com, outlook.office365.com</small>
                    </div>
                    <div>
                        <label style="font-weight: 600; display: block; margin-bottom: 5px;">Port</label>
                        <input type="number" id="imap_port" value="993" required style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;">
                        <small style="color: #7f8c8d;">Port SSL standard: 993</small>
                    </div>
                    <div>
                        <label style="font-weight: 600; display: block; margin-bottom: 5px;">Email</label>
                        <input type="email" id="imap_email" placeholder="votre@email.com" required style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;">
                    </div>
                    <div>
                        <label style="font-weight: 600; display: block; margin-bottom: 5px;">Mot de passe</label>
                        <input type="password" id="imap_password" placeholder="Mot de passe ou mot de passe d'application" required style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;">
                        <small style="color: #e74c3c;">⚠️ Gmail/Outlook nécessitent un mot de passe d'application</small>
                    </div>
                    <div style="background: #fff3cd; padding: 15px; border-radius: 6px; border-left: 4px solid #ffc107;">
                        <strong>⚠️ Sécurité</strong>
                        <p style="margin: 5px 0 0 0; font-size: 0.9rem;">Les identifiants seront stockés localement dans votre navigateur. Cette méthode nécessite un backend sécurisé pour une utilisation en production.</p>
                    </div>
                    <div style="display: flex; gap: 10px; justify-content: flex-end;">
                        <button type="button" onclick="closeIMAPModal()" style="background: #95a5a6; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: 600;">
                            Annuler
                        </button>
                        <button type="submit" style="background: #27AE60; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: 600;">
                            Sauvegarder
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modal);
}

function closeIMAPModal(event) {
    if (event && event.target !== event.currentTarget) return;
    const modal = document.querySelector('div[style*="position: fixed"]');
    if (modal) modal.remove();
}

function saveIMAPConfig(event) {
    event.preventDefault();
    
    const config = {
        host: document.getElementById('imap_host').value,
        port: document.getElementById('imap_port').value,
        email: document.getElementById('imap_email').value,
        password: document.getElementById('imap_password').value,
        connected: true,
        connectedAt: new Date().toISOString()
    };
    
    // Sauvegarder dans localStorage (en production, utiliser un backend sécurisé)
    localStorage.setItem('imap_config', JSON.stringify(config));
    connectedAccounts.imap = config;
    localStorage.setItem('connectedAccounts', JSON.stringify(connectedAccounts));
    
    // Mettre à jour l'interface
    updateConnectionStatus();
    
    closeIMAPModal();
    showToast('✅ Configuration IMAP sauvegardée', 'success');
    
    // Afficher la section emails
    document.getElementById('emailsSection').style.display = 'block';
}

// ==========================================
// MISE À JOUR DES STATUS DE CONNEXION
// ==========================================

function updateConnectionStatus() {
    // Gmail
    const gmailStatus = document.getElementById('gmail-status');
    if (connectedAccounts.gmail) {
        gmailStatus.style.background = '#d4edda';
        gmailStatus.style.color = '#155724';
        gmailStatus.innerHTML = '✅ Connecté : ' + connectedAccounts.gmail.email;
    }
    
    // Outlook
    const outlookStatus = document.getElementById('outlook-status');
    if (connectedAccounts.outlook) {
        outlookStatus.style.background = '#d4edda';
        outlookStatus.style.color = '#155724';
        outlookStatus.innerHTML = '✅ Connecté : ' + connectedAccounts.outlook.email;
    }
    
    // IMAP
    const imapStatus = document.getElementById('imap-status');
    if (connectedAccounts.imap) {
        imapStatus.style.background = '#d4edda';
        imapStatus.style.color = '#155724';
        imapStatus.innerHTML = '✅ Configuré : ' + connectedAccounts.imap.email;
        document.getElementById('emailsSection').style.display = 'block';
    }
}

// ==========================================
// CHARGEMENT DES EMAILS
// ==========================================

async function loadEmails() {
    showToast('🔄 Chargement des emails...', 'success');
    
    // Vérifier s'il y a des comptes connectés
    if (!connectedAccounts.imap && !connectedAccounts.gmail && !connectedAccounts.outlook) {
        showToast('⚠️ Aucun compte connecté', 'error');
        return;
    }
    
    // Simuler un chargement (en production, appeler une API backend)
    setTimeout(() => {
        const emailsContainer = document.getElementById('emailsContainer');
        emailsContainer.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #7f8c8d;">
                <div style="font-size: 3rem; margin-bottom: 10px;">📭</div>
                <p style="margin: 0;">Fonctionnalité en développement</p>
                <small>La synchronisation des emails nécessite un backend Node.js</small>
            </div>
        `;
        showToast('ℹ️ Backend requis pour la synchronisation', 'error');
    }, 500);
}

// ==========================================
// INITIALISATION
// ==========================================

function initMessagerieTab() {
    updateConnectionStatus();
}

// Export vers window pour accessibilité globale
window.connectGmail = connectGmail;
window.connectOutlook = connectOutlook;
window.configureIMAP = configureIMAP;
window.loadEmails = loadEmails;
window.closeIMAPModal = closeIMAPModal;
window.saveIMAPConfig = saveIMAPConfig;
window.initMessagerieTab = initMessagerieTab;
