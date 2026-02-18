export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const providers = {
            openai: {
                label: 'OpenAI',
                configured: Boolean(process.env.OPENAI_API_KEY)
            },
            anthropic: {
                label: 'Anthropic',
                configured: Boolean(process.env.ANTHROPIC_API_KEY)
            },
            gemini: {
                label: 'Gemini',
                configured: Boolean(process.env.GEMINI_API_KEY)
            },
            stability: {
                label: 'Stability',
                configured: Boolean(process.env.STABILITY_API_KEY)
            }
        };

        const configuredCount = Object.values(providers).filter((p) => p.configured).length;

        return res.status(200).json({
            ok: true,
            configuredCount,
            totalCount: Object.keys(providers).length,
            providers,
            checkedAt: new Date().toISOString()
        });
    } catch (error) {
        return res.status(500).json({
            ok: false,
            error: 'Unable to load AI provider status',
            details: error.message
        });
    }
}
