// Vercel Serverless Function - Refresh Token Zoho
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
    
    const { refreshToken, authDomain } = req.body;
    
    if (!refreshToken) {
        return res.status(400).json({ error: 'Missing refresh token' });
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
                refresh_token: refreshToken,
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
                grant_type: 'refresh_token'
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            console.error('Zoho refresh error:', data);
            return res.status(response.status).json({
                error: data.error || 'Token refresh failed',
                details: data
            });
        }
        
        // Renvoyer le nouveau token
        return res.status(200).json({
            access_token: data.access_token,
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
