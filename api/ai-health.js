import { createClient } from '@supabase/supabase-js';

const DEFAULT_ALERT_ERROR_RATE_1H_PCT = 8;
const DEFAULT_ALERT_COST_24H_EUR = 12;
const DEFAULT_ALERT_LATENCY_1H_MS = 5000;
const DEFAULT_ALERT_CONSECUTIVE_ERRORS_1H = 5;

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
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Vary', 'Origin');
}

function clampNumber(value, min, max, fallback) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return fallback;
    return Math.min(max, Math.max(min, parsed));
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

function summarizeSupportMetrics(rows) {
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);

    const metrics = {
        requests24h: rows.length,
        errors24h: 0,
        success24h: 0,
        tokens24h: 0,
        cost24hEur: 0,
        requests1h: 0,
        errors1h: 0,
        avgLatency1hMs: 0,
        errorRate1hPct: 0,
        consecutiveErrors1h: 0,
        lastErrorAt: null,
        lastSuccessAt: null
    };

    let latencyAccumulator = 0;
    let latencyCount = 0;

    const rowsSorted = [...rows].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

    for (const row of rowsSorted) {
        const createdAtMs = new Date(row.created_at).getTime();
        const is1h = Number.isFinite(createdAtMs) && createdAtMs >= oneHourAgo;
        const success = row.success === true;

        if (success) {
            metrics.success24h += 1;
            metrics.consecutiveErrors1h = 0;
            if (!metrics.lastSuccessAt) {
                metrics.lastSuccessAt = row.created_at;
            }
        } else {
            metrics.errors24h += 1;
            if (!metrics.lastErrorAt) {
                metrics.lastErrorAt = row.created_at;
            }
            if (is1h) {
                metrics.consecutiveErrors1h += 1;
            }
        }

        metrics.tokens24h += clampNumber(row.total_tokens, 0, 5_000_000, 0);
        metrics.cost24hEur += clampNumber(row.estimated_cost_eur, 0, 1_000_000, 0);

        if (is1h) {
            metrics.requests1h += 1;
            if (!success) {
                metrics.errors1h += 1;
            }
            const latency = clampNumber(row.latency_ms, 0, 120_000, 0);
            if (latency > 0) {
                latencyAccumulator += latency;
                latencyCount += 1;
            }
        }
    }

    metrics.cost24hEur = Number(metrics.cost24hEur.toFixed(4));
    metrics.avgLatency1hMs = latencyCount > 0 ? Math.round(latencyAccumulator / latencyCount) : 0;
    metrics.errorRate1hPct = metrics.requests1h > 0
        ? Number(((metrics.errors1h / metrics.requests1h) * 100).toFixed(2))
        : 0;

    return metrics;
}

function buildSupportAlerts(metrics, supportAiReady) {
    const alerts = [];
    const errorRateThreshold = clampNumber(process.env.SUPPORT_AI_ALERT_ERROR_RATE_1H_PCT, 0, 100, DEFAULT_ALERT_ERROR_RATE_1H_PCT);
    const costThreshold = clampNumber(process.env.SUPPORT_AI_ALERT_COST_24H_EUR, 0, 100000, DEFAULT_ALERT_COST_24H_EUR);
    const latencyThreshold = clampNumber(process.env.SUPPORT_AI_ALERT_LATENCY_1H_MS, 100, 120000, DEFAULT_ALERT_LATENCY_1H_MS);
    const consecutiveErrorsThreshold = clampNumber(process.env.SUPPORT_AI_ALERT_CONSECUTIVE_ERRORS_1H, 1, 100, DEFAULT_ALERT_CONSECUTIVE_ERRORS_1H);

    if (!supportAiReady) {
        alerts.push({
            level: 'critical',
            title: 'Support IA indisponible',
            message: 'Endpoint support actif mais configuration OpenAI manquante ou désactivée.'
        });
    }

    if (metrics.errorRate1hPct >= errorRateThreshold && metrics.requests1h >= 5) {
        alerts.push({
            level: 'critical',
            title: 'Taux d\'erreur IA élevé',
            message: `${metrics.errorRate1hPct}% sur la dernière heure (seuil ${errorRateThreshold}%).`
        });
    }

    if (metrics.avgLatency1hMs >= latencyThreshold && metrics.requests1h >= 3) {
        alerts.push({
            level: 'warning',
            title: 'Latence IA élevée',
            message: `Latence moyenne ${metrics.avgLatency1hMs} ms sur 1h (seuil ${latencyThreshold} ms).`
        });
    }

    if (metrics.cost24hEur >= costThreshold) {
        alerts.push({
            level: 'warning',
            title: 'Coût IA 24h élevé',
            message: `${metrics.cost24hEur.toFixed(2)} € estimés (seuil ${costThreshold.toFixed(2)} €).`
        });
    }

    if (metrics.consecutiveErrors1h >= consecutiveErrorsThreshold) {
        alerts.push({
            level: 'critical',
            title: 'Erreurs IA consécutives',
            message: `${metrics.consecutiveErrors1h} erreurs d\'affilée observées sur 1h.`
        });
    }

    return {
        alerts,
        thresholds: {
            errorRate1hPct: errorRateThreshold,
            cost24hEur: costThreshold,
            latency1hMs: latencyThreshold,
            consecutiveErrors1h: consecutiveErrorsThreshold
        }
    };
}

export default async function handler(req, res) {
    const allowedOrigins = getAllowedOrigins();
    const requestOrigin = getOriginFromRequest(req);
    const isAllowed = requestOrigin ? allowedOrigins.has(requestOrigin) : false;

    setCorsHeaders(req, res, isAllowed ? requestOrigin : null);

    if (req.method === 'OPTIONS') {
        if (requestOrigin && !isAllowed) {
            return res.status(403).json({ error: 'Origin non autorisée', code: 'ORIGIN_NOT_ALLOWED' });
        }
        return res.status(204).end();
    }

    if (requestOrigin && !isAllowed) {
        return res.status(403).json({ error: 'Origin non autorisée', code: 'ORIGIN_NOT_ALLOWED' });
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const wantsSupportMetrics = String(req.query?.section || req.query?.supportMetrics || '').toLowerCase() === 'support' || String(req.query?.supportMetrics) === '1';

        if (wantsSupportMetrics) {
            const supabaseAdmin = createSupabaseAdminClient();
            if (!supabaseAdmin) {
                return res.status(503).json({
                    error: 'Supabase non configuré pour les métriques IA',
                    code: 'SUPABASE_NOT_CONFIGURED'
                });
            }

            const since24h = new Date(Date.now() - (24 * 60 * 60 * 1000)).toISOString();

            const { data: rows, error } = await supabaseAdmin
                .from('cm_support_ai_usage_logs')
                .select('created_at, success, total_tokens, estimated_cost_eur, latency_ms')
                .eq('endpoint', 'support-ai')
                .gte('created_at', since24h)
                .order('created_at', { ascending: false })
                .limit(3000);

            if (error) {
                return res.status(500).json({
                    error: 'Impossible de charger les métriques IA',
                    code: 'SUPPORT_AI_METRICS_QUERY_ERROR'
                });
            }

            const metrics = summarizeSupportMetrics(Array.isArray(rows) ? rows : []);
            const supportAiReady = String(process.env.SUPPORT_AI_ENABLED || 'true').toLowerCase() === 'true' && Boolean(process.env.OPENAI_API_KEY);
            const { alerts, thresholds } = buildSupportAlerts(metrics, supportAiReady);

            return res.status(200).json({
                ok: true,
                supportAiReady,
                metrics,
                thresholds,
                alerts,
                updatedAt: new Date().toISOString()
            });
        }

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
