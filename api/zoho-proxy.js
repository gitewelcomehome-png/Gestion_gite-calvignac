// Vercel Serverless Function - Proxy pour API Zoho Mail
export default async function handler(req, res) {
    // Autoriser CORS depuis notre domaine
    res.setHeader('Access-Control-Allow-Origin', 'https://liveownerunit.fr');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    const { endpoint, method = 'GET', body, token, region = 'com' } = req.body || req.query;
    
    if (!endpoint || !token) {
        return res.status(400).json({ error: 'Missing endpoint or token' });
    }
    
    // Déterminer le domaine selon la région
    const apiDomain = region === 'eu' ? 'https://mail.zoho.eu' : 'https://mail.zoho.com';
    
    try {
        const options = {
            method: method,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        };
        
        if (body && method !== 'GET') {
            options.body = JSON.stringify(body);
        }
        
        const response = await fetch(`${apiDomain}${endpoint}`, options);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Zoho API error:', response.status, errorText);
            return res.status(response.status).json({
                error: 'Zoho API error',
                status: response.status,
                details: errorText
            });
        }
        
        const data = await response.json();
        return res.status(200).json(data);
        
    } catch (error) {
        console.error('Proxy error:', error);
        return res.status(500).json({
            error: 'Proxy error',
            message: error.message
        });
    }
}