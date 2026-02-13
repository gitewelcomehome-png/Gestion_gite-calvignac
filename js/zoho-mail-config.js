// Configuration Zoho Mail API
const ZOHO_CONFIG = {
    clientId: '1000.VNA95CXS18E0IC5F9U12K2DAXTNZ6P',
    clientSecret: 'd7d84ca438fdba28be76ff9ced58385b9fcdf0ae97',
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

// Échanger le code contre un token
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
        
        console.log('Échange de code avec:', authDomain);
        
        const response = await fetch(`${authDomain}/oauth/v2/token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                code: code,
                client_id: ZOHO_CONFIG.clientId,
                client_secret: ZOHO_CONFIG.clientSecret,
                redirect_uri: ZOHO_CONFIG.redirectUri,
                grant_type: 'authorization_code'
            })
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Erreur HTTP:', response.status, errorText);
            return false;
        }
        
        const data = await response.json();
        
        console.log('Réponse Zoho:', data);
        
        if (data.access_token) {
            ZohoAuth.setAccessToken(data.access_token);
            ZohoAuth.setRefreshToken(data.refresh_token);
            ZohoAuth.setTokenExpiry(Date.now() + (data.expires_in * 1000));
            // Sauvegarder le domaine pour les futurs appels
            localStorage.setItem('zoho_auth_domain', authDomain);
            return true;
        }
        
        console.error('Erreur dans la réponse:', data);
        return false;
    } catch (error) {
        console.error('Erreur échange code:', error);
        return false;
    }
}

// Rafraîchir le token
async function refreshAccessToken() {
    const refreshToken = ZohoAuth.getRefreshToken();
    if (!refreshToken) return false;
    
    // Utiliser le domaine sauvegardé ou par défaut
    const authDomain = localStorage.getItem('zoho_auth_domain') || ZOHO_CONFIG.authDomain;
    
    try {
        const response = await fetch(`${authDomain}/oauth/v2/token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                refresh_token: refreshToken,
                client_id: ZOHO_CONFIG.clientId,
                client_secret: ZOHO_CONFIG.clientSecret,
                grant_type: 'refresh_token'
            })
        });
        
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
        
        const response = await fetch(`${ZOHO_CONFIG.apiDomain}/api${endpoint}`, {
            ...options,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                ...options.headers
            }
        });
        
        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }
        
        return response.json();
    },
    
    // Récupérer les comptes email
    async getAccounts() {
        return this.request('/accounts');
    },
    
    // Récupérer les messages
    async getMessages(accountId, folderId = 'INBOX', limit = 50) {
        return this.request(`/accounts/${accountId}/folders/${folderId}/messages?limit=${limit}`);
    },
    
    // Récupérer un message spécifique
    async getMessage(accountId, messageId) {
        return this.request(`/accounts/${accountId}/messages/${messageId}`);
    },
    
    // Envoyer un email
    async sendMessage(accountId, messageData) {
        return this.request(`/accounts/${accountId}/messages`, {
            method: 'POST',
            body: JSON.stringify(messageData)
        });
    },
    
    // Récupérer les dossiers
    async getFolders(accountId) {
        return this.request(`/accounts/${accountId}/folders`);
    }
};

window.ZOHO_CONFIG = ZOHO_CONFIG;
window.ZohoAuth = ZohoAuth;
window.ZohoMailAPI = ZohoMailAPI;
window.initiateZohoAuth = initiateZohoAuth;
window.exchangeCodeForToken = exchangeCodeForToken;
