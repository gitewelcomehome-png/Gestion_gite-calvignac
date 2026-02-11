// ================================================================
// PROXY CORS VERCEL SERVERLESS
// ================================================================
// Permet de fetch des URLs iCal en contournant les restrictions CORS
// Les proxies publics gratuits sont souvent bloqués (403)
// Cette fonction serverless fait le fetch côté serveur (pas de CORS)
// ================================================================

export default async function handler(req, res) {
    // Autoriser uniquement GET
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Récupérer l'URL depuis le query parameter
    const { url } = req.query;

    if (!url) {
        return res.status(400).json({ error: 'Missing url parameter' });
    }

    // Validation basique de l'URL
    try {
        const parsedUrl = new URL(url);
        
        // Autoriser uniquement http et https
        if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
            return res.status(400).json({ error: 'Invalid URL protocol' });
        }

        // Whitelist des domaines autorisés (sécurité)
        const allowedDomains = [
            'airbnb.fr',
            'airbnb.com',
            'airbnb.co.uk',
            'abritel.fr',
            'booking.com',
            'homeaway.com',
            'homeaway.fr',
            'vrbo.com',
            'itea.fr',
            'reservation.itea.fr',
            'icalendar.fr',
            'beds24.com',
            'smoobu.com',
            'lodgify.com',
            // Ajouter d'autres plateformes au besoin
        ];

        const isAllowed = allowedDomains.some(domain => 
            parsedUrl.hostname.endsWith(domain) || parsedUrl.hostname === domain
        );

        if (!isAllowed) {
            return res.status(403).json({ 
                error: 'Domain not whitelisted',
                hint: 'Only iCal URLs from known platforms are allowed'
            });
        }

    } catch (err) {
        return res.status(400).json({ error: 'Invalid URL format' });
    }

    // Fetch l'URL avec timeout
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000); // 15s timeout

        const response = await fetch(url, {
            signal: controller.signal,
            headers: {
                'User-Agent': 'LiveOwnerUnit/1.0',
                'Accept': 'text/calendar, text/plain, */*'
            }
        });

        clearTimeout(timeout);

        if (!response.ok) {
            return res.status(response.status).json({ 
                error: `Upstream returned ${response.status}`,
                url: url
            });
        }

        const text = await response.text();

        // Vérifier que c'est bien un iCal
        if (!text.includes('BEGIN:VCALENDAR')) {
            return res.status(400).json({ 
                error: 'Response is not a valid iCal file',
                preview: text.substring(0, 200)
            });
        }

        // Retourner le contenu avec les bons headers
        res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate'); // Cache 5 min
        
        return res.status(200).send(text);

    } catch (err) {
        console.error('Proxy error:', err);
        
        if (err.name === 'AbortError') {
            return res.status(504).json({ error: 'Request timeout' });
        }

        return res.status(500).json({ 
            error: 'Proxy fetch failed',
            message: err.message
        });
    }
}
