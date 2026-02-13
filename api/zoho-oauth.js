// Vercel Serverless Function - Échange code OAuth Zoho
export default async function handler(req, res) {
    // Autoriser CORS depuis notre domaine
    res.setHeader('Access-Control-Allow-Origin', 'https://liveownerunit.fr');
    res.setHeader('Access-Control-Allow-Methods', 'POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    
    const { code, redirectUri, authDomain } = req.body;
    
    if (!code) {
        return res.status(400).json({ error: 'Missing code' });
    }
    
    // Identifiants OAuth (sécurisés côté serveur)
    const CLIENT_ID = '1000.VNA95CXS18E0IC5F9U12K2DAXTNZ6P';
    const CLIENT_SECRET = 'd7d84ca438fdba28be76ff9ced58385b9fcdf0ae97';
    
    // Utiliser le bon domaine selon la région
    const domain = authDomain || 'https://accounts.zoho.com';
    
    try {
        const response = await fetch(`${domain}/oauth/v2/token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                code: code,
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
                redirect_uri: redirectUri,
                grant_type: 'authorization_code'
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            console.error('Zoho OAuth error:', data);
            return res.status(response.status).json({
                error: data.error || 'OAuth exchange failed',
                details: data
            });
        }
        
        // Renvoyer les tokens
        return res.status(200).json({
            access_token: data.access_token,
            refresh_token: data.refresh_token,
            expires_in: data.expires_in
        });
        
    } catch (error) {
        console.error('Server error:', error);
        return res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
}
