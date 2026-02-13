// Configuration Zoho Mail API
const ZOHO_CONFIG = {
    clientId: '1000.VNA95CXS18E0IC5F9U12K2DAXTNZ6P',
    // CLIENT_SECRET supprimé - géré côté serveur pour la sécurité
    // Redirection URI basée sur le domaine actuel
    get redirectUri() {
        const hostname = window.location.hostname;
        // Production
        if (hostname === 'liveownerunit.fr' || hostname === 'www.liveownerunit.fr') {
            return 'https://liveownerunit.fr/pages/admin-emails.html';
        }
        // Développement local
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return `http://${hostname}:${window.location.port || 8080}/pages/admin-emails.html`;
        }
        // Codespace GitHub
        if (hostname.includes('github.dev')) {
            return `https://${hostname}/pages/admin-emails.html`;
        }
        // Fallback production
        return 'https://liveownerunit.fr/pages/admin-emails.html';
    },
    scopes: [
        'ZohoMail.messages.READ',
        'ZohoMail.messages.CREATE',
        'ZohoMail.messages.UPDATE',
        'ZohoMail.messages.DELETE',
        'ZohoMail.folders.READ',
        'ZohoMail.accounts.READ',
        'ZohoMail.partner.organization.READ'
    ].join(','),
    // Domaines API détectés automatiquement
    get apiDomain() {
        const saved = localStorage.getItem('zoho_auth_domain');
        if (saved && saved.includes('.eu')) {
            return 'https://mail.zoho.eu';
        }
        return 'https://mail.zoho.com';
    },
    authDomain: 'https://accounts.zoho.com' // Par défaut, détecté lors de l'OAuth
};

// Stockage sécurisé du token (à améliorer avec encryption)
const ZohoAuth = {
    getAccessToken() {
        return localStorage.getItem('zoho_access_token');
    },
    
    setAccessToken(token) {
        localStorage.setItem('zoho_access_token', token);
    },
    
    getRefreshToken() {
        return localStorage.getItem('zoho_refresh_token');
    },
    
    setRefreshToken(token) {
        localStorage.setItem('zoho_refresh_token', token);
    },
    
    getTokenExpiry() {
        return localStorage.getItem('zoho_token_expiry');
    },
    
    setTokenExpiry(expiry) {
        localStorage.setItem('zoho_token_expiry', expiry);
    },
    
    isTokenValid() {
        const expiry = this.getTokenExpiry();
        if (!expiry) return false;
        return Date.now() < parseInt(expiry);
    },
    
    clearTokens() {
        localStorage.removeItem('zoho_access_token');
        localStorage.removeItem('zoho_refresh_token');
        localStorage.removeItem('zoho_token_expiry');
    }
};

// Authentification OAuth
async function initiateZohoAuth() {
    const authUrl = `${ZOHO_CONFIG.authDomain}/oauth/v2/auth?` + new URLSearchParams({
        scope: ZOHO_CONFIG.scopes,
        client_id: ZOHO_CONFIG.clientId,
        response_type: 'code',
        redirect_uri: ZOHO_CONFIG.redirectUri,
        access_type: 'offline',
        prompt: 'consent'
    });
    
    window.location.href = authUrl;
}

// Échanger le code contre un token (via serveur pour sécurité)
async function exchangeCodeForToken(code) {
    try {
        // Détecter le domaine Zoho depuis les paramètres de l'URL
        const urlParams = new URLSearchParams(window.location.search);
        const accountsServer = urlParams.get('accounts-server');
        const location = urlParams.get('location') || 'com';
        
        // Utiliser le bon domaine selon la région
        let authDomain = ZOHO_CONFIG.authDomain;
        if (accountsServer) {
            authDomain = decodeURIComponent(accountsServer);
        } else if (location === 'eu') {
            authDomain = 'https://accounts.zoho.eu';
        }
        
        console.log('Échange de code via API serverless avec:', authDomain);
        
        // Appeler notre API serverless (sécurisé)
        const response = await fetch('/api/zoho-oauth', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                code: code,
                redirectUri: ZOHO_CONFIG.redirectUri,
                authDomain: authDomain
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            console.error('Erreur API:', response.status, errorData);
            return false;
        }
        
        const data = await response.json();
        
        console.log('Token reçu avec succès');
        
        if (data.access_token) {
            ZohoAuth.setAccessToken(data.access_token);
            ZohoAuth.setRefreshToken(data.refresh_token);
            ZohoAuth.setTokenExpiry(Date.now() + (data.expires_in * 1000));
            // Sauvegarder le domaine pour les futurs appels
            localStorage.setItem('zoho_auth_domain', authDomain);
            return true;
        }
        
        console.error('Pas de token dans la réponse:', data);
        return false;
    } catch (error) {
        console.error('Erreur échange code:', error);
        return false;
    }
}

// Rafraîchir le token (via serveur pour sécurité)
async function refreshAccessToken() {
    const refreshToken = ZohoAuth.getRefreshToken();
    if (!refreshToken) return false;
    
    // Utiliser le domaine sauvegardé ou par défaut
    const authDomain = localStorage.getItem('zoho_auth_domain') || ZOHO_CONFIG.authDomain;
    
    try {
        // Appeler notre API serverless (sécurisé)
        const response = await fetch('/api/zoho-refresh', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                refreshToken: refreshToken,
                authDomain: authDomain
            })
        });
        
        if (!response.ok) {
            console.error('Erreur refresh:', response.status);
            return false;
        }
        
        const data = await response.json();
        
        if (data.access_token) {
            ZohoAuth.setAccessToken(data.access_token);
            ZohoAuth.setTokenExpiry(Date.now() + (data.expires_in * 1000));
            return true;
        }
        
        return false;
    } catch (error) {
        console.error('Erreur refresh token:', error);
        return false;
    }
}

// API Zoho Mail
const ZohoMailAPI = {
    async request(endpoint, options = {}) {
        let token = ZohoAuth.getAccessToken();
        
        // Vérifier et rafraîchir le token si nécessaire
        if (!ZohoAuth.isTokenValid()) {
            const refreshed = await refreshAccessToken();
            if (!refreshed) {
                throw new Error('Token expired, reconnection required');
            }
            token = ZohoAuth.getAccessToken();
        }
        
        // Déterminer la région
        const authDomain = localStorage.getItem('zoho_auth_domain') || ZOHO_CONFIG.authDomain;
        const region = authDomain.includes('.eu') ? 'eu' : 'com';
        
        const proxyUrl = window.location.origin + '/api/zoho-proxy';
        
        const payload = {
            endpoint: endpoint,
            method: options.method || 'GET',
            body: options.body ? JSON.parse(options.body) : undefined,
            token: token,
            region: region
        };
        
        // Utiliser le proxy serverless pour éviter les problèmes CORS
        const response = await fetch(proxyUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Zoho API Error:', response.status, errorText);
            throw new Error(`API Error: ${response.status} - ${errorText}`);
        }
        
        return await response.json();
    },
    
    // Récupérer les comptes email
    async getAccounts() {
        return this.request('/api/accounts');
    },
    
    // Récupérer les messages - ENDPOINT CORRECT TROUVÉ: /messages/view
    async getMessages(accountId, folderId, limit = 50) {
        return this.request(`/api/accounts/${accountId}/messages/view?folderId=${folderId}&limit=${limit}`);
    },
    
    // Récupérer un message spécifique
    async getMessage(accountId, messageId) {
        // Test de plusieurs endpoints possibles
        const endpoints = [
            `/api/accounts/${accountId}/messages/view?messageId=${messageId}`,
            `/api/accounts/${accountId}/messages/${messageId}/content`,
            `/api/accounts/${accountId}/messages/view/${messageId}`,
            `/api/accounts/${accountId}/messages?messageId=${messageId}`,
        ];
        
        for (const endpoint of endpoints) {
            try {
                console.log(`Test getMessage: ${endpoint}`);
                const response = await this.request(endpoint);
                console.log(`✅ getMessage SUCCESS: ${endpoint}`);
                return response;
            } catch (error) {
                console.log(`❌ getMessage FAILED: ${endpoint} - ${error.message}`);
            }
        }
        
        throw new Error('Aucun endpoint getMessage ne fonctionne');
    },
    
    // Envoyer un email
    async sendMessage(accountId, messageData) {
        // Essai avec différents formats possibles
        const formats = [
            {
                fromAddress: messageData.fromAddress || 'contact@liveownerunit.fr',
                toAddress: messageData.toAddress,
                subject: messageData.subject,
                content: messageData.content,
                mailFormat: 'plaintext'
            },
            {
                from: messageData.fromAddress || 'contact@liveownerunit.fr',
                to: messageData.toAddress,
                subject: messageData.subject,
                content: messageData.content
            },
            {
                fromAddress: messageData.fromAddress || 'contact@liveownerunit.fr',
                toAddress: messageData.toAddress,
                ccAddress: '',
                bccAddress: '',
                subject: messageData.subject,
                content: messageData.content,
                mailFormat: 'plaintext',
                askReceipt: 'no'
            }
        ];
        
        for (let i = 0; i < formats.length; i++) {
            try {
                console.log(`Test sendMessage format ${i + 1}:`, formats[i]);
                const response = await this.request(`/api/accounts/${accountId}/messages`, {
                    method: 'POST',
                    body: JSON.stringify(formats[i])
                });
                console.log(`✅ sendMessage SUCCESS avec format ${i + 1}`);
                return response;
            } catch (error) {
                console.log(`❌ sendMessage FAILED format ${i + 1}: ${error.message}`);
                if (i === formats.length - 1) throw error;
            }
        }
    },
    
    // Supprimer un email (déplacer vers corbeille)
    async deleteMessage(accountId, messageId) {
        // Essayer plusieurs méthodes de suppression Zoho
        const methods = [
            // Méthode 1 : Action trash
            {
                endpoint: `/api/accounts/${accountId}/messages/${messageId}/actions/trash`,
                options: { method: 'PUT' }
            },
            // Méthode 2 : Mise à jour avec isTrash
            {
                endpoint: `/api/accounts/${accountId}/messages/${messageId}`,
                options: { 
                    method: 'PUT',
                    body: JSON.stringify({ status: 'trash' })
                }
            },
            // Méthode 3 : PATCH
            {
                endpoint: `/api/accounts/${accountId}/messages/${messageId}`,
                options: { 
                    method: 'PATCH',
                    body: JSON.stringify({ status: 'trash' })
                }
            }
        ];
        
        for (let i = 0; i < methods.length; i++) {
            try {
                console.log(`🗑️ Test suppression méthode ${i + 1}:`, methods[i].endpoint);
                const response = await this.request(methods[i].endpoint, methods[i].options);
                console.log(`✅ Suppression SUCCESS avec méthode ${i + 1}`);
                return response;
            } catch (error) {
                console.log(`❌ Suppression FAILED méthode ${i + 1}: ${error.message}`);
                if (i === methods.length - 1) throw error;
            }
        }
    },
    
    // Récupérer les dossiers
    async getFolders(accountId) {
        return this.request(`/api/accounts/${accountId}/folders`);
    }
};

window.ZOHO_CONFIG = ZOHO_CONFIG;
window.ZohoAuth = ZohoAuth;
window.ZohoMailAPI = ZohoMailAPI;
window.initiateZohoAuth = initiateZohoAuth;
window.exchangeCodeForToken = exchangeCodeForToken;
