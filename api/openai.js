// ==========================================
// 🤖 API PROXY OPENAI - VERCEL SERVERLESS
// ==========================================
// Cette fonction serverless fait le pont entre le frontend et OpenAI
// L'API key est stockée côté serveur (sécurisé)
// Les utilisateurs n'ont pas besoin de configurer quoi que ce soit

export default async function handler(req, res) {
    // CORS headers pour autoriser les appels depuis votre domaine
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*'); // À restreindre en production
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    const apiKey = process.env.OPENAI_API_KEY;

    // Endpoint de santé pour le frontend (évite les 500 côté UI)
    if (req.method === 'GET') {
        return res.status(200).json({
            ok: true,
            available: Boolean(apiKey),
            code: apiKey ? 'OPENAI_READY' : 'OPENAI_NOT_CONFIGURED'
        });
    }

    // Accepter uniquement POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { prompt, maxTokens = 500, model = 'gpt-4o-mini' } = req.body;

        // Validation
        if (!prompt || typeof prompt !== 'string') {
            return res.status(400).json({ error: 'Prompt requis' });
        }

        if (!apiKey) {
            return res.status(503).json({
                error: 'API OpenAI non configurée. Veuillez ajouter OPENAI_API_KEY dans les variables d\'environnement Vercel.',
                code: 'OPENAI_NOT_CONFIGURED'
            });
        }

        // Appel à OpenAI
        const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: model,
                messages: [
                    {
                        role: 'system',
                        content: 'Tu es un rédacteur expert en tourisme et hospitalité. MISSION : Transformer des notes brutes en textes NARRATIFS et ENGAGEANTS. RÈGLES STRICTES : 1) RÉDIGE de vraies phrases complètes et fluides, PAS de simples énumérations 2) CRÉE des paragraphes narratifs, comme un guide touristique professionnel 3) GARDE tous les détails factuels (codes, horaires, noms, adresses) mais INTÈGRE-les naturellement dans des phrases 4) AJOUTE du contexte pratique et des transitions 5) Utilise un ton chaleureux, accueillant et conversationnel 6) TRANSFORME les listes en descriptions narratives 7) NE JAMAIS inventer d\'infos factuelles. Exemple : Au lieu de "WiFi : Livebox-D758, mot de passe : 123", écris "Pour vous connecter au WiFi, recherchez le réseau Livebox-D758 et utilisez le mot de passe 123. La connexion est optimale dans le salon." Si on te demande un JSON, réponds UNIQUEMENT en JSON valide.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: maxTokens,
                temperature: 0.8
            })
        });

        if (!openaiResponse.ok) {
            const errorData = await openaiResponse.json().catch(() => ({}));
            console.error('❌ Erreur OpenAI:', errorData);
            return res.status(openaiResponse.status).json({
                error: errorData.error?.message || 'Erreur lors de l\'appel à OpenAI',
                code: 'OPENAI_UPSTREAM_ERROR'
            });
        }

        const data = await openaiResponse.json();
        const content = data.choices?.[0]?.message?.content;

        if (!content) {
            return res.status(500).json({ error: 'Aucun contenu généré' });
        }

        // Retourner le résultat
        return res.status(200).json({ 
            content,
            usage: data.usage // Pour tracking des coûts si nécessaire
        });

    } catch (error) {
        console.error('❌ Erreur serveur:', error);
        return res.status(500).json({ 
            error: 'Erreur interne du serveur',
            code: 'OPENAI_SERVER_ERROR',
            details: error.message 
        });
    }
}
