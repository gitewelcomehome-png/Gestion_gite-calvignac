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

        // Récupérer l'API key depuis les variables d'environnement
        const apiKey = process.env.OPENAI_API_KEY;
        
        if (!apiKey) {
            console.error('❌ OPENAI_API_KEY non configurée dans Vercel');
            return res.status(500).json({ 
                error: 'API OpenAI non configurée. Veuillez ajouter OPENAI_API_KEY dans les variables d\'environnement Vercel.' 
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
                        content: 'Tu es un rédacteur expert en rédaction touristique et hospitalité. Ton but est d\'améliorer des textes de fiches d\'information de gîtes pour les rendre plus clairs, accueillants et professionnels. RÈGLES : 1) Garde TOUS les détails factuels (codes, horaires, noms, adresses) 2) Enrichis les descriptions avec du contexte et des détails pratiques 3) Utilise un ton chaleureux et accueillant 4) Structure les informations de façon fluide et naturelle 5) Corrige l\'orthographe et améliore la syntaxe 6) Rends les instructions plus claires et détaillées 7) NE JAMAIS inventer d\'informations factuelles (noms, codes, lieux). Si on te demande un JSON, réponds UNIQUEMENT en JSON valide sans texte supplémentaire.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: maxTokens,
                temperature: 0.7
            })
        });

        if (!openaiResponse.ok) {
            const errorData = await openaiResponse.json().catch(() => ({}));
            console.error('❌ Erreur OpenAI:', errorData);
            return res.status(openaiResponse.status).json({ 
                error: errorData.error?.message || 'Erreur lors de l\'appel à OpenAI' 
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
            details: error.message 
        });
    }
}
