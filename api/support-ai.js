// ==========================================
// 🤖 API PROXY SUPPORT IA - VERCEL SERVERLESS
// ==========================================

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const ALLOWED_MODELS = new Set(['gpt-4o-mini', 'gpt-4.1-mini']);
const DEFAULT_SYSTEM_PROMPT = 'Tu es un expert en support SaaS. Réponds de manière précise et utile.';
const DEFAULT_MAX_TOKENS = 600;
const MAX_TOKENS_HARD_LIMIT = 900;
const MAX_PROMPT_CHARS = 12000;
const MAX_SYSTEM_PROMPT_CHARS = 3000;
const DEFAULT_RATE_LIMIT_MAX = 25;
const DEFAULT_RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const DEFAULT_EUR_PER_USD = 0.92;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const MODEL_PRICING_USD_PER_1M = {
    'gpt-4o-mini': {
        input: 0.15,
        output: 0.6
    },
    'gpt-4.1-mini': {
        input: 0.4,
        output: 1.6
    }
};

if (!globalThis.__supportAiRateLimiter) {
    globalThis.__supportAiRateLimiter = new Map();
}

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
    const raw = String(process.env.SUPPORT_AI_ALLOWED_ORIGINS || '').trim();

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

function isOriginAllowed(req, allowedOrigins) {
    const requestOrigin = getOriginFromRequest(req);
    if (!requestOrigin) return false;
    return allowedOrigins.has(requestOrigin);
}

function getClientIp(req) {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string' && forwarded.length > 0) {
        return forwarded.split(',')[0].trim();
    }

    return req.socket?.remoteAddress || 'unknown';
}

function checkRateLimit(ip) {
    const windowMs = Number(process.env.SUPPORT_AI_RATE_LIMIT_WINDOW_MS || DEFAULT_RATE_LIMIT_WINDOW_MS);
    const maxRequests = Number(process.env.SUPPORT_AI_RATE_LIMIT_MAX || DEFAULT_RATE_LIMIT_MAX);
    const now = Date.now();

    const bucket = globalThis.__supportAiRateLimiter.get(ip);
    if (!bucket || now > bucket.resetAt) {
        globalThis.__supportAiRateLimiter.set(ip, { count: 1, resetAt: now + windowMs });
        return { allowed: true, remaining: Math.max(0, maxRequests - 1), resetAt: now + windowMs };
    }

    if (bucket.count >= maxRequests) {
        return { allowed: false, remaining: 0, resetAt: bucket.resetAt };
    }

    bucket.count += 1;
    globalThis.__supportAiRateLimiter.set(ip, bucket);
    return { allowed: true, remaining: Math.max(0, maxRequests - bucket.count), resetAt: bucket.resetAt };
}

function clampNumber(value, min, max, fallback) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return fallback;
    return Math.min(max, Math.max(min, parsed));
}

function isSupportAiEnabled() {
    return String(process.env.SUPPORT_AI_ENABLED ?? 'true').trim().toLowerCase() === 'true';
}

function sanitizeText(value, maxChars, fallback = '') {
    if (typeof value !== 'string') return fallback;
    return value.trim().slice(0, maxChars);
}

function sanitizeUuid(value) {
    const input = String(value || '').trim();
    if (!input || !UUID_REGEX.test(input)) return null;
    return input;
}

function extractClientContext(body) {
    const context = (body && typeof body === 'object' && body.clientContext && typeof body.clientContext === 'object')
        ? body.clientContext
        : {};

    return {
        requesterUserId: sanitizeUuid(context.userId),
        requesterClientId: sanitizeUuid(context.clientId),
        requesterTicketId: sanitizeUuid(context.ticketId)
    };
}

function buildErrorSignature({ requestSource, errorCode, statusCode, model, requesterClientId }) {
    const source = sanitizeText(requestSource, 60, 'unknown');
    const code = sanitizeText(errorCode, 80, 'NO_ERROR');
    const status = clampNumber(statusCode, 0, 999, 0);
    const safeModel = sanitizeText(model, 60, 'unknown');
    const scope = requesterClientId ? `client:${requesterClientId}` : 'client:unknown';
    return sanitizeText(`${scope}|${source}|${code}|${status}|${safeModel}`, 220, 'incident:unknown');
}

function withTelemetryBase(base, overrides = {}) {
    const record = {
        ...base,
        ...overrides
    };

    const requestSource = sanitizeText(record.request_source, 120, 'unknown');
    const model = sanitizeText(record.model, 120, 'gpt-4o-mini');
    const statusCode = clampNumber(record.status_code, 100, 599, 500);
    const errorCode = sanitizeText(record.error_code, 120, record.success ? null : 'UNKNOWN_ERROR');

    return {
        ...record,
        request_source: requestSource,
        model,
        status_code: statusCode,
        error_code: errorCode,
        error_signature: sanitizeText(record.error_signature, 220, '') || buildErrorSignature({
            requestSource,
            errorCode,
            statusCode,
            model,
            requesterClientId: record.requester_client_id
        })
    };
}

function createSupabaseAdminClient() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
        return null;
    }

    return createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            persistSession: false,
            autoRefreshToken: false
        }
    });
}

function hashIp(ip) {
    const safeIp = String(ip || '').trim();
    if (!safeIp) return null;

    const salt = String(process.env.SUPPORT_AI_IP_HASH_SALT || 'support-ai').trim();
    return crypto.createHash('sha256').update(`${salt}:${safeIp}`).digest('hex');
}

function getModelPricing(modelName) {
    const safeModel = String(modelName || 'gpt-4o-mini').trim();

    const defaultPricing = MODEL_PRICING_USD_PER_1M[safeModel] || MODEL_PRICING_USD_PER_1M['gpt-4o-mini'];

    const inputEnvKey = `SUPPORT_AI_PRICE_INPUT_USD_PER_1M_${safeModel.toUpperCase().replace(/[^A-Z0-9]/g, '_')}`;
    const outputEnvKey = `SUPPORT_AI_PRICE_OUTPUT_USD_PER_1M_${safeModel.toUpperCase().replace(/[^A-Z0-9]/g, '_')}`;

    const input = clampNumber(process.env[inputEnvKey], 0, 1000, defaultPricing.input);
    const output = clampNumber(process.env[outputEnvKey], 0, 1000, defaultPricing.output);

    return { input, output };
}

function estimateCostEur(usage, modelName) {
    if (!usage || typeof usage !== 'object') return 0;

    const promptTokens = clampNumber(usage.prompt_tokens, 0, 2_000_000, 0);
    const completionTokens = clampNumber(usage.completion_tokens, 0, 2_000_000, 0);
    const pricing = getModelPricing(modelName);
    const eurPerUsd = clampNumber(process.env.SUPPORT_AI_EUR_PER_USD, 0.1, 2, DEFAULT_EUR_PER_USD);

    const usdCost = ((promptTokens / 1_000_000) * pricing.input) + ((completionTokens / 1_000_000) * pricing.output);
    const eurCost = usdCost * eurPerUsd;

    return Number(eurCost.toFixed(6));
}

async function persistTelemetry(logData) {
    try {
        const supabaseAdmin = createSupabaseAdminClient();
        if (!supabaseAdmin) {
            return;
        }

        const { error } = await supabaseAdmin
            .from('cm_support_ai_usage_logs')
            .insert(logData);

        if (error) {
            console.error('❌ [SUPPORT AI] Erreur persistance télémétrie:', error.message || error);
        }
    } catch (error) {
        console.error('❌ [SUPPORT AI] Erreur persistance télémétrie:', error.message || error);
    }
}

export default async function handler(req, res) {
    const allowedOrigins = getAllowedOrigins();
    const requestOrigin = getOriginFromRequest(req);
    const isAllowed = requestOrigin ? allowedOrigins.has(requestOrigin) : false;

    setCorsHeaders(req, res, isAllowed ? requestOrigin : null);

    if (req.method === 'OPTIONS') {
        if (!isAllowed) {
            return res.status(403).json({ error: 'Origin non autorisée', code: 'ORIGIN_NOT_ALLOWED' });
        }
        return res.status(204).end();
    }

    if (!isAllowed) {
        return res.status(403).json({ error: 'Origin non autorisée', code: 'ORIGIN_NOT_ALLOWED' });
    }

    if (!isSupportAiEnabled()) {
        return res.status(503).json({ error: 'Support IA désactivé', code: 'SUPPORT_AI_DISABLED' });
    }

    const apiKey = process.env.OPENAI_API_KEY;

    if (req.method === 'GET') {
        return res.status(200).json({
            ok: true,
            available: Boolean(apiKey),
            code: apiKey ? 'SUPPORT_AI_READY' : 'SUPPORT_AI_NOT_CONFIGURED',
            guards: {
                originRestricted: true,
                rateLimited: true,
                featureFlag: true
            }
        });
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const clientIp = getClientIp(req);
    const clientIpHash = hashIp(clientIp);
    const requestSource = sanitizeText(req.body?.source, 120, 'unknown');
    const clientContext = extractClientContext(req.body);
    const telemetryBase = {
        endpoint: 'support-ai',
        request_source: requestSource,
        origin: requestOrigin || null,
        client_ip_hash: clientIpHash,
        requester_user_id: clientContext.requesterUserId,
        requester_client_id: clientContext.requesterClientId,
        requester_ticket_id: clientContext.requesterTicketId
    };

    const rate = checkRateLimit(clientIp);
    res.setHeader('X-RateLimit-Remaining', String(rate.remaining));
    res.setHeader('X-RateLimit-Reset', String(Math.floor(rate.resetAt / 1000)));

    if (!rate.allowed) {
        await persistTelemetry(withTelemetryBase(telemetryBase, {
            model: sanitizeText(req.body?.model, 120, 'gpt-4o-mini'),
            prompt_chars: clampNumber(req.body?.prompt?.length, 0, MAX_PROMPT_CHARS, 0),
            prompt_tokens: 0,
            completion_tokens: 0,
            total_tokens: 0,
            estimated_cost_eur: 0,
            latency_ms: 0,
            status_code: 429,
            success: false,
            error_code: 'RATE_LIMIT_EXCEEDED'
        }));

        return res.status(429).json({
            error: 'Trop de requêtes, réessayez plus tard',
            code: 'RATE_LIMIT_EXCEEDED'
        });
    }

    const startedAt = Date.now();

    try {
        const {
            prompt,
            systemPrompt = DEFAULT_SYSTEM_PROMPT,
            model = 'gpt-4o-mini',
            temperature = 0.3,
            maxTokens = DEFAULT_MAX_TOKENS,
            source = 'unknown'
        } = req.body || {};

        const safePrompt = sanitizeText(prompt, MAX_PROMPT_CHARS);
        const safeSystemPrompt = sanitizeText(systemPrompt, MAX_SYSTEM_PROMPT_CHARS, DEFAULT_SYSTEM_PROMPT);
        const safeModel = ALLOWED_MODELS.has(model) ? model : 'gpt-4o-mini';
        const safeTemperature = clampNumber(temperature, 0, 1, 0.3);
        const safeMaxTokens = clampNumber(maxTokens, 50, MAX_TOKENS_HARD_LIMIT, DEFAULT_MAX_TOKENS);

        if (!safePrompt) {
            await persistTelemetry(withTelemetryBase(telemetryBase, {
                request_source: sanitizeText(source, 120, 'unknown'),
                model: safeModel,
                prompt_chars: 0,
                prompt_tokens: 0,
                completion_tokens: 0,
                total_tokens: 0,
                estimated_cost_eur: 0,
                latency_ms: Date.now() - startedAt,
                status_code: 400,
                success: false,
                error_code: 'PROMPT_REQUIRED'
            }));

            return res.status(400).json({ error: 'Prompt requis', code: 'PROMPT_REQUIRED' });
        }

        if (!apiKey) {
            await persistTelemetry(withTelemetryBase(telemetryBase, {
                request_source: sanitizeText(source, 120, 'unknown'),
                model: safeModel,
                prompt_chars: safePrompt.length,
                prompt_tokens: 0,
                completion_tokens: 0,
                total_tokens: 0,
                estimated_cost_eur: 0,
                latency_ms: Date.now() - startedAt,
                status_code: 503,
                success: false,
                error_code: 'OPENAI_NOT_CONFIGURED'
            }));

            return res.status(503).json({
                error: 'API OpenAI non configurée. Veuillez ajouter OPENAI_API_KEY dans les variables d\'environnement Vercel.',
                code: 'OPENAI_NOT_CONFIGURED'
            });
        }

        const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: safeModel,
                messages: [
                    {
                        role: 'system',
                        content: safeSystemPrompt
                    },
                    {
                        role: 'user',
                        content: safePrompt
                    }
                ],
                temperature: safeTemperature,
                max_tokens: safeMaxTokens
            })
        });

        if (!openaiResponse.ok) {
            const errorData = await openaiResponse.json().catch(() => ({}));
            console.error('❌ [SUPPORT AI] Erreur OpenAI:', errorData);

            await persistTelemetry(withTelemetryBase(telemetryBase, {
                request_source: sanitizeText(source, 120, 'unknown'),
                model: safeModel,
                prompt_chars: safePrompt.length,
                prompt_tokens: 0,
                completion_tokens: 0,
                total_tokens: 0,
                estimated_cost_eur: 0,
                latency_ms: Date.now() - startedAt,
                status_code: openaiResponse.status,
                success: false,
                error_code: 'OPENAI_UPSTREAM_ERROR'
            }));

            return res.status(openaiResponse.status).json({
                error: errorData.error?.message || 'Erreur lors de l\'appel à OpenAI',
                code: 'OPENAI_UPSTREAM_ERROR'
            });
        }

        const data = await openaiResponse.json();
        const content = data?.choices?.[0]?.message?.content;

        if (!content) {
            await persistTelemetry(withTelemetryBase(telemetryBase, {
                request_source: sanitizeText(source, 120, 'unknown'),
                model: data?.model || safeModel,
                prompt_chars: safePrompt.length,
                prompt_tokens: clampNumber(data?.usage?.prompt_tokens, 0, 2_000_000, 0),
                completion_tokens: clampNumber(data?.usage?.completion_tokens, 0, 2_000_000, 0),
                total_tokens: clampNumber(data?.usage?.total_tokens, 0, 2_000_000, 0),
                estimated_cost_eur: estimateCostEur(data?.usage, data?.model || safeModel),
                latency_ms: Date.now() - startedAt,
                status_code: 500,
                success: false,
                error_code: 'EMPTY_AI_RESPONSE'
            }));

            return res.status(500).json({ error: 'Aucun contenu généré', code: 'EMPTY_AI_RESPONSE' });
        }

        await persistTelemetry(withTelemetryBase(telemetryBase, {
            request_source: sanitizeText(source, 120, 'unknown'),
            model: data?.model || safeModel,
            prompt_chars: safePrompt.length,
            prompt_tokens: clampNumber(data?.usage?.prompt_tokens, 0, 2_000_000, 0),
            completion_tokens: clampNumber(data?.usage?.completion_tokens, 0, 2_000_000, 0),
            total_tokens: clampNumber(data?.usage?.total_tokens, 0, 2_000_000, 0),
            estimated_cost_eur: estimateCostEur(data?.usage, data?.model || safeModel),
            latency_ms: Date.now() - startedAt,
            status_code: 200,
            success: true,
            error_code: null
        }));

        return res.status(200).json({
            content,
            usage: data.usage || null,
            model: data.model || safeModel
        });
    } catch (error) {
        await persistTelemetry(withTelemetryBase(telemetryBase, {
            request_source: sanitizeText(req.body?.source, 120, 'unknown'),
            model: sanitizeText(req.body?.model, 120, 'gpt-4o-mini'),
            prompt_chars: clampNumber(req.body?.prompt?.length, 0, MAX_PROMPT_CHARS, 0),
            prompt_tokens: 0,
            completion_tokens: 0,
            total_tokens: 0,
            estimated_cost_eur: 0,
            latency_ms: Date.now() - startedAt,
            status_code: 500,
            success: false,
            error_code: 'SUPPORT_AI_SERVER_ERROR'
        }));

        console.error('❌ [SUPPORT AI] Erreur serveur:', error);
        return res.status(500).json({
            error: 'Erreur interne du serveur',
            code: 'SUPPORT_AI_SERVER_ERROR'
        });
    }
}
