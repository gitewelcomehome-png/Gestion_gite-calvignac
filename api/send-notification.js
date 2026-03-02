// ================================================================
// API : ENVOI DE NOTIFICATIONS EMAIL (Resend)
// ================================================================
// Endpoint sécurisé pour les notifications clients
// La clé Resend reste côté serveur, jamais exposée au navigateur
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
        process.env.SEND_EMAIL_ALLOWED_ORIGINS
        || process.env.CORS_ALLOWED_ORIGINS
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

    return new Set(raw.split(',').map((v) => v.trim()).filter(Boolean));
}

function setCorsHeaders(req, res, allowedOrigin) {
    const requestOrigin = getOriginFromRequest(req);
    const originToSet = requestOrigin && allowedOrigin && requestOrigin === allowedOrigin
        ? requestOrigin
        : allowedOrigin || 'null';

    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', originToSet);
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Vary', 'Origin');
}

export default async function handler(req, res) {
    const allowedOrigins = getAllowedOrigins();
    const requestOrigin = getOriginFromRequest(req);
    const isAllowed = requestOrigin ? allowedOrigins.has(requestOrigin) : false;

    setCorsHeaders(req, res, isAllowed ? requestOrigin : null);

    if (req.method === 'OPTIONS') {
        return res.status(204).end();
    }

    if (!isAllowed) {
        return res.status(403).json({ error: 'Origin non autorisée' });
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
        console.error('RESEND_API_KEY manquante dans les variables d\'environnement Vercel');
        return res.status(500).json({ error: 'Configuration email manquante' });
    }

    try {
        const { to, subject, html } = req.body;

        if (!to || !subject || !html) {
            return res.status(400).json({ error: 'Champs requis manquants: to, subject, html' });
        }

        // Validation email basique
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
            return res.status(400).json({ error: 'Adresse email invalide' });
        }

        const fromEmail = process.env.RESEND_FROM_EMAIL || 'notifications@liveownerunit.fr';
        const fromName = process.env.RESEND_FROM_NAME || 'Gîte Welcome Home';

        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                from: `${fromName} <${fromEmail}>`,
                to: [to],
                subject: subject,
                html: html
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('Resend API error:', data);
            return res.status(502).json({ error: 'Erreur lors de l\'envoi de l\'email' });
        }

        return res.status(200).json({ success: true, id: data.id });

    } catch (error) {
        console.error('send-notification error:', error);
        return res.status(500).json({ error: 'Erreur interne' });
    }
}
