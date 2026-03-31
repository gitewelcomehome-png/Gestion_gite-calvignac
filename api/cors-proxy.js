// ================================================================
// PROXY CORS VERCEL SERVERLESS
// ================================================================
// Permet de fetch des URLs iCal en contournant les restrictions CORS
// Les proxies publics gratuits sont souvent bloqués (403)
// Cette fonction serverless fait le fetch côté serveur (pas de CORS)
// ================================================================

function getOriginFromRequest(req) {
    const origin = req.headers.origin || req.headers.referer || '';
    if (!origin) return null;

    try {
        return new URL(origin).origin;
    } catch {
        return null;
    }
}

function getAllowedOrigins() {
    const raw = String(
        process.env.CORS_PROXY_ALLOWED_ORIGINS
        || process.env.CORS_ALLOWED_ORIGINS
        || process.env.SUPPORT_AI_ALLOWED_ORIGINS
        || ''
    ).trim();

    if (!raw) {
        return new Set([
            'https://liveownerunit.fr',
            'https://www.liveownerunit.fr',
            'http://localhost:3000',
            'http://127.0.0.1:3000',
            'http://localhost:5500',
            'http://127.0.0.1:5500'
        ]);
    }

    return new Set(
        raw
            .split(',')
            .map((value) => value.trim())
            .filter(Boolean)
    );
}

function shouldEnforceOrigin() {
    return String(process.env.CORS_PROXY_ENFORCE_ALLOWED_ORIGINS || 'true').trim().toLowerCase() === 'true';
}

function setCorsHeaders(req, res, allowedOrigin) {
    const requestOrigin = getOriginFromRequest(req);
    const originToSet = requestOrigin && allowedOrigin && requestOrigin === allowedOrigin
        ? requestOrigin
        : allowedOrigin || 'null';

    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', originToSet);
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Vary', 'Origin');
}

export default async function handler(req, res) {
    const allowedOrigins = getAllowedOrigins();
    const requestOrigin = getOriginFromRequest(req);
    // Les requêtes same-origin GET n'envoient pas toujours l'en-tête Origin.
    // Dans ce cas, on autorise la requête (monitoring gardé via headers de réponse).
    const isAllowed = !requestOrigin || allowedOrigins.has(requestOrigin);
    const enforceOrigin = shouldEnforceOrigin();

    setCorsHeaders(req, res, (isAllowed || !enforceOrigin) ? requestOrigin : null);
    res.setHeader('X-Origin-Validation', isAllowed ? 'allowed' : 'not-listed');
    res.setHeader('X-Origin-Enforcement', enforceOrigin ? 'enforce' : 'monitor');

    if (req.method === 'OPTIONS') {
        if (enforceOrigin && !isAllowed) {
            return res.status(403).json({ error: 'Origin non autorisée', code: 'ORIGIN_NOT_ALLOWED' });
        }
        return res.status(204).end();
    }

    if (enforceOrigin && !isAllowed) {
        return res.status(403).json({ error: 'Origin non autorisée', code: 'ORIGIN_NOT_ALLOWED' });
    }

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
            'homelidays.com',
            'www.homelidays.com',
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
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
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
        res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate'); // Cache 5 min
        
        return res.status(200).send(text);

    } catch (err) {
        console.error('Proxy error:', err);
        
        if (err.name === 'AbortError') {
            return res.status(504).json({ error: 'Request timeout' });
        }

        return res.status(500).json({ 
            error: 'Proxy fetch failed'
        });
    }
}
