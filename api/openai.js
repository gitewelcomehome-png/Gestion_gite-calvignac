// ==========================================
// 🤖 API PROXY OPENAI - VERCEL SERVERLESS
// ==========================================
// Cette fonction serverless fait le pont entre le frontend et OpenAI
// L'API key est stockée côté serveur (sécurisé)
// Les utilisateurs n'ont pas besoin de configurer quoi que ce soit

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
        process.env.OPENAI_ALLOWED_ORIGINS
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
    return String(process.env.OPENAI_ENFORCE_ALLOWED_ORIGINS || 'true').trim().toLowerCase() === 'true';
}

function setCorsHeaders(req, res, allowedOrigin) {
    const requestOrigin = getOriginFromRequest(req);
    const originToSet = requestOrigin && allowedOrigin && requestOrigin === allowedOrigin
        ? requestOrigin
        : allowedOrigin || 'null';

    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', originToSet);
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS, GET');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Vary', 'Origin');
}

function extractContentFromResponsesPayload(payload) {
    if (!payload || typeof payload !== 'object') return null;

    if (typeof payload.output_text === 'string' && payload.output_text.trim()) {
        return payload.output_text;
    }

    if (!Array.isArray(payload.output)) return null;

    for (const item of payload.output) {
        if (!item || !Array.isArray(item.content)) continue;
        for (const part of item.content) {
            if (part?.type === 'output_text' && typeof part.text === 'string' && part.text.trim()) {
                return part.text;
            }
            if (part?.type === 'text' && typeof part.text === 'string' && part.text.trim()) {
                return part.text;
            }
        }
    }

    return null;
}

async function callOpenAIChatCompletions({ apiKey, model, prompt, maxTokens, systemPrompt }) {
    const fallbackSystemPrompt = 'Tu es un rédacteur expert en tourisme et hospitalité. MISSION : Transformer des notes brutes en textes NARRATIFS et ENGAGEANTS. RÈGLES STRICTES : 1) RÉDIGE de vraies phrases complètes et fluides, PAS de simples énumérations 2) CRÉE des paragraphes narratifs, comme un guide touristique professionnel 3) GARDE tous les détails factuels (codes, horaires, noms, adresses) mais INTÈGRE-les naturellement dans des phrases 4) AJOUTE du contexte pratique et des transitions 5) Utilise un ton chaleureux, accueillant et conversationnel 6) TRANSFORME les listes en descriptions narratives 7) NE JAMAIS inventer d\'infos factuelles. Exemple : Au lieu de "WiFi : Livebox-D758, mot de passe : 123", écris "Pour vous connecter au WiFi, recherchez le réseau Livebox-D758 et utilisez le mot de passe 123. La connexion est optimale dans le salon." Si on te demande un JSON, réponds UNIQUEMENT en JSON valide.';
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model,
            messages: [
                {
                    role: 'system',
                    content: (typeof systemPrompt === 'string' && systemPrompt.trim()) ? systemPrompt.trim() : fallbackSystemPrompt
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

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
            ok: false,
            status: response.status,
            error: errorData.error?.message || 'Erreur lors de l\'appel à OpenAI'
        };
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;

    if (!content) {
        return {
            ok: false,
            status: 500,
            error: 'Aucun contenu généré'
        };
    }

    return {
        ok: true,
        content,
        usage: data.usage,
        source: 'chat-completions',
        webSearchUsed: false
    };
}

async function callOpenAIResponsesWebSearch({ apiKey, model, prompt, maxTokens, systemPrompt }) {
    const fallbackSystemPrompt = 'Tu es un analyste tourisme/revenue management. Quand demandé, utilise la recherche web pour privilégier des informations publiques récentes et factuelles. Si on te demande un JSON, réponds UNIQUEMENT en JSON valide.';
    const response = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model,
            input: [
                {
                    role: 'system',
                    content: [
                        {
                            type: 'input_text',
                            text: (typeof systemPrompt === 'string' && systemPrompt.trim()) ? systemPrompt.trim() : fallbackSystemPrompt
                        }
                    ]
                },
                {
                    role: 'user',
                    content: [
                        {
                            type: 'input_text',
                            text: prompt
                        }
                    ]
                }
            ],
            tools: [{ type: 'web_search_preview' }],
            tool_choice: 'auto',
            max_output_tokens: maxTokens
        })
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
            ok: false,
            status: response.status,
            error: errorData.error?.message || 'Erreur web search OpenAI'
        };
    }

    const data = await response.json();
    const content = extractContentFromResponsesPayload(data);

    if (!content) {
        return {
            ok: false,
            status: 500,
            error: 'Aucun contenu généré via web search'
        };
    }

    return {
        ok: true,
        content,
        usage: data.usage,
        source: 'responses-web-search',
        webSearchUsed: true
    };
}

export default async function handler(req, res) {
    const allowedOrigins = getAllowedOrigins();
    const requestOrigin = getOriginFromRequest(req);
    const isAllowed = requestOrigin ? allowedOrigins.has(requestOrigin) : false;
    const enforceOrigin = shouldEnforceOrigin();

    setCorsHeaders(req, res, (isAllowed || !enforceOrigin) ? requestOrigin : null);
    res.setHeader('X-Origin-Validation', isAllowed ? 'allowed' : 'not-listed');
    res.setHeader('X-Origin-Enforcement', enforceOrigin ? 'enforce' : 'monitor');

    // Handle preflight
    if (req.method === 'OPTIONS') {
        if (enforceOrigin && !isAllowed) {
            return res.status(403).json({ error: 'Origin non autorisée', code: 'ORIGIN_NOT_ALLOWED' });
        }
        res.status(204).end();
        return;
    }

    if (enforceOrigin && !isAllowed) {
        return res.status(403).json({ error: 'Origin non autorisée', code: 'ORIGIN_NOT_ALLOWED' });
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
        const {
            prompt,
            maxTokens = 500,
            model = 'gpt-4o-mini',
            webSearch = false,
            webSearchModel,
            systemPrompt
        } = req.body;

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

        let result = null;

        if (webSearch) {
            const webModel = webSearchModel || process.env.OPENAI_WEB_SEARCH_MODEL || 'gpt-4.1-mini';
            const webResult = await callOpenAIResponsesWebSearch({
                apiKey,
                model: webModel,
                prompt,
                maxTokens,
                systemPrompt
            });

            if (webResult.ok) {
                result = webResult;
            } else {
                console.warn('⚠️ Web search indisponible, fallback chat-completions:', webResult.error || webResult.status);
            }
        }

        if (!result) {
            const classicResult = await callOpenAIChatCompletions({
                apiKey,
                model,
                prompt,
                maxTokens,
                systemPrompt
            });

            if (!classicResult.ok) {
                return res.status(classicResult.status || 500).json({
                    error: classicResult.error || 'Erreur lors de l\'appel à OpenAI',
                    code: 'OPENAI_UPSTREAM_ERROR'
                });
            }

            result = classicResult;
        }

        return res.status(200).json({
            content: result.content,
            usage: result.usage,
            source: result.source,
            webSearchUsed: Boolean(result.webSearchUsed)
        });

    } catch (error) {
        console.error('❌ Erreur serveur:', error);
        return res.status(500).json({ 
            error: 'Erreur interne du serveur',
            code: 'OPENAI_SERVER_ERROR'
        });
    }
}
