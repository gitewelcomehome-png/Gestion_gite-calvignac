import { createClient } from '@supabase/supabase-js';

const DEFAULT_ALERT_ERROR_RATE_1H_PCT = 8;
const DEFAULT_ALERT_COST_24H_EUR = 12;
const DEFAULT_ALERT_LATENCY_1H_MS = 5000;
const DEFAULT_ALERT_CONSECUTIVE_ERRORS_1H = 5;
const AUTO_TICKET_ACTIVE_STATUSES = ['ouvert', 'en_cours', 'en_attente', 'en_attente_client'];

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

function getCurrentRequestOrigin(req) {
    const host = String(req.headers['x-forwarded-host'] || req.headers.host || '').trim();
    if (!host) {
        return null;
    }

    const protocol = String(req.headers['x-forwarded-proto'] || 'https').split(',')[0].trim() || 'https';
    return `${protocol}://${host}`;
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

function isSupportAiEnabled() {
    return String(process.env.SUPPORT_AI_ENABLED ?? 'true').trim().toLowerCase() === 'true';
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

function isCriticalUsageIncident(row) {
    const statusCode = clampNumber(row?.status_code, 0, 999, 0);
    const errorCode = String(row?.error_code || '').trim().toUpperCase();

    if (statusCode >= 500) return true;
    if (errorCode === 'OPENAI_NOT_CONFIGURED') return true;
    if (errorCode === 'OPENAI_UPSTREAM_ERROR') return true;
    if (errorCode === 'SUPPORT_AI_SERVER_ERROR') return true;
    if (errorCode === 'EMPTY_AI_RESPONSE') return true;
    return false;
}

function buildIncidentSignature(row) {
    const client = String(row?.requester_client_id || 'unknown').trim();
    const source = String(row?.request_source || 'unknown').trim().toLowerCase();
    const code = String(row?.error_code || 'unknown').trim().toUpperCase();
    const status = clampNumber(row?.status_code, 0, 999, 0);
    const model = String(row?.model || 'unknown').trim().toLowerCase();
    return `client:${client}|${source}|${code}|${status}|${model}`.slice(0, 220);
}

function buildClientPreAnalysis(row) {
    const statusCode = clampNumber(row?.status_code, 0, 999, 0);
    const errorCode = String(row?.error_code || '').trim().toUpperCase();
    const requestSource = String(row?.request_source || 'support').trim();

    if (errorCode === 'OPENAI_NOT_CONFIGURED') {
        return `Le service d'assistance IA était momentanément indisponible. Vous avez probablement vu un message d'indisponibilité lors de votre demande (${requestSource}).`;
    }

    if (errorCode === 'RATE_LIMIT_EXCEEDED') {
        return `Le service a temporairement limité certaines requêtes pour éviter une saturation. Vous avez pu voir un message de temporisation.`;
    }

    if (statusCode >= 500) {
        return `Une erreur technique temporaire est survenue pendant le traitement de votre demande (${requestSource}). Vous avez probablement vu un message d'erreur ou une réponse absente.`;
    }

    return `Une anomalie technique a été détectée sur votre demande (${requestSource}). Nous avons engagé une vérification proactive.`;
}

async function insertSupportComment(supabaseAdmin, payload) {
    const withRole = {
        ...payload,
        author_role: 'admin'
    };

    const { error } = await supabaseAdmin
        .from('cm_support_comments')
        .insert(withRole);

    if (!error) return;

    const message = String(error.message || '').toLowerCase();
    if (!message.includes('author_role')) {
        throw error;
    }

    const fallbackPayload = {
        ticket_id: payload.ticket_id,
        user_id: payload.user_id,
        is_internal: payload.is_internal,
        content: payload.content,
        is_ai_generated: payload.is_ai_generated
    };

    const { error: fallbackError } = await supabaseAdmin
        .from('cm_support_comments')
        .insert(fallbackPayload);

    if (fallbackError) {
        throw fallbackError;
    }
}

async function processCriticalSupportIncidents({ supabaseAdmin, alerts }) {
    try {
        const hasCriticalAlert = Array.isArray(alerts) && alerts.some((alert) => alert?.level === 'critical');
        if (!hasCriticalAlert) {
            return { enabled: true, processed: 0, created: 0, linked: 0, skipped: 0, reason: 'no-critical-alert' };
        }

        const since = new Date(Date.now() - (2 * 60 * 60 * 1000)).toISOString();
        const { data: rows, error } = await supabaseAdmin
            .from('cm_support_ai_usage_logs')
            .select('id, created_at, request_source, model, status_code, error_code, requester_user_id, requester_client_id, auto_ticket_processed_at')
            .eq('endpoint', 'support-ai')
            .eq('success', false)
            .is('auto_ticket_processed_at', null)
            .not('requester_client_id', 'is', null)
            .gte('created_at', since)
            .order('created_at', { ascending: true })
            .limit(60);

        if (error) {
            return { enabled: true, processed: 0, created: 0, linked: 0, skipped: 0, reason: 'query-error' };
        }

        let processed = 0;
        let created = 0;
        let linked = 0;
        let skipped = 0;

        for (const row of rows || []) {
            const signature = buildIncidentSignature(row);
            const processedAt = new Date().toISOString();

            if (!isCriticalUsageIncident(row)) {
                skipped += 1;
                await supabaseAdmin
                    .from('cm_support_ai_usage_logs')
                    .update({
                        error_signature: signature,
                        auto_ticket_status: 'ignored',
                        auto_ticket_note: 'Incident non critique',
                        auto_ticket_processed_at: processedAt
                    })
                    .eq('id', row.id);
                continue;
            }

            const clientId = String(row.requester_client_id || '').trim();
            if (!clientId) {
                skipped += 1;
                continue;
            }

            const { data: existingTicket } = await supabaseAdmin
                .from('cm_support_tickets')
                .select('id')
                .eq('client_id', clientId)
                .in('statut', AUTO_TICKET_ACTIVE_STATUSES)
                .ilike('description', `%Signature incident: ${signature}%`)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (existingTicket?.id) {
                linked += 1;
                processed += 1;
                await supabaseAdmin
                    .from('cm_support_ai_usage_logs')
                    .update({
                        error_signature: signature,
                        auto_ticket_id: existingTicket.id,
                        auto_ticket_status: 'linked',
                        auto_ticket_note: 'Incident relié à un ticket existant',
                        auto_ticket_processed_at: processedAt
                    })
                    .eq('id', row.id);
                continue;
            }

            const preAnalysis = buildClientPreAnalysis(row);
            const createdAtText = row?.created_at ? new Date(row.created_at).toLocaleString('fr-FR') : 'inconnue';
            const subject = `Incident détecté automatiquement sur votre support IA`;
            const description = [
                'Bonjour,',
                '',
                'Nous avons détecté automatiquement une anomalie sur votre utilisation du support IA et nous avons ouvert ce ticket proactivement.',
                '',
                `Pré-analyse: ${preAnalysis}`,
                '',
                `Détails techniques: code=${row?.error_code || 'N/A'} | statut HTTP=${row?.status_code || 'N/A'} | modèle=${row?.model || 'N/A'} | source=${row?.request_source || 'N/A'}`,
                `Détection: ${createdAtText}`,
                `Signature incident: ${signature}`,
                '',
                'Nous revenons vers vous dès que la correction est validée.'
            ].join('\n');

            const { data: createdTicket, error: createTicketError } = await supabaseAdmin
                .from('cm_support_tickets')
                .insert({
                    client_id: clientId,
                    sujet: subject,
                    description,
                    statut: 'ouvert',
                    priorite: 'haute',
                    categorie: 'technique',
                    sentiment: 'neutre'
                })
                .select('id')
                .single();

            if (createTicketError || !createdTicket?.id) {
                skipped += 1;
                await supabaseAdmin
                    .from('cm_support_ai_usage_logs')
                    .update({
                        error_signature: signature,
                        auto_ticket_status: 'ignored',
                        auto_ticket_note: 'Échec création ticket auto',
                        auto_ticket_processed_at: processedAt
                    })
                    .eq('id', row.id);
                continue;
            }

            created += 1;
            processed += 1;
            await supabaseAdmin
                .from('cm_support_ai_usage_logs')
                .update({
                    error_signature: signature,
                    auto_ticket_id: createdTicket.id,
                    auto_ticket_status: 'created',
                    auto_ticket_note: 'Ticket auto créé',
                    auto_ticket_processed_at: processedAt
                })
                .eq('id', row.id);
        }

        return { enabled: true, processed, created, linked, skipped, reason: 'ok' };
    } catch {
        return { enabled: true, processed: 0, created: 0, linked: 0, skipped: 0, reason: 'runtime-error' };
    }
}

export default async function handler(req, res) {
    const allowedOrigins = getAllowedOrigins();
    const currentRequestOrigin = getCurrentRequestOrigin(req);
    if (currentRequestOrigin) {
        allowedOrigins.add(currentRequestOrigin);
    }
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
            const supportAiReady = isSupportAiEnabled() && Boolean(process.env.OPENAI_API_KEY);
            const { alerts, thresholds } = buildSupportAlerts(metrics, supportAiReady);
            const autoTicketRequested = String(req.query?.autoTicket || req.query?.auto_ticket || '').trim() === '1';
            const autoTicketEnabled = String(process.env.SUPPORT_AI_AUTO_TICKET_ENABLED ?? 'true').trim().toLowerCase() === 'true';
            let autoTicket = { enabled: autoTicketEnabled, processed: 0, created: 0, linked: 0, skipped: 0, reason: 'not-requested' };

            if (autoTicketEnabled && autoTicketRequested) {
                autoTicket = await processCriticalSupportIncidents({
                    supabaseAdmin,
                    alerts
                });
            }

            return res.status(200).json({
                ok: true,
                supportAiReady,
                metrics,
                thresholds,
                alerts,
                autoTicket,
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
