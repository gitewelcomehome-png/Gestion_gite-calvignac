// ================================================================
// WEBHOOK — Supabase → Cowork auto-trigger
// ================================================================
// Déclenché par Supabase sur INSERT dans public.error_logs
// (Database Webhook configuré dans Supabase Dashboard)
//
// Ce que fait l'endpoint :
//  1. Valide la signature HMAC-SHA256 (sécurité)
//  2. Filtre : seulement les nouvelles erreurs critiques
//  3. Génère tmp/cowork-pending-tests.json adapté à l'erreur
//  4. Pousse le fichier sur la branche preprod via GitHub API
//  5. Envoie un email de notification à l'admin
//
// Variables d'env requises (à ajouter dans Vercel Dashboard) :
//  SUPABASE_WEBHOOK_SECRET   — secret défini dans Supabase > Webhooks
//  GITHUB_TOKEN              — Personal Access Token (scope: repo)
//  GITHUB_REPO               — ex: gitewelcomehome-png/Gestion_gite-calvignac
//  ADMIN_ALERT_EMAIL         — email destinataire des alertes
//  SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASS — déjà définis
// ================================================================

const crypto = require('crypto');
const nodemailer = require('nodemailer');

// ----------------------------------------------------------------
// Validation signature HMAC-SHA256 (Supabase signe avec le secret)
// ----------------------------------------------------------------
function verifySupabaseSignature(rawBody, signature, secret) {
    if (!secret || !signature) return false;
    const expected = crypto
        .createHmac('sha256', secret)
        .update(rawBody)
        .digest('hex');
    // Comparaison en temps constant pour éviter timing attacks
    try {
        return crypto.timingSafeEqual(
            Buffer.from(signature.replace('sha256=', ''), 'hex'),
            Buffer.from(expected, 'hex')
        );
    } catch {
        return false;
    }
}

// ----------------------------------------------------------------
// Construire le fichier de tests Cowork ciblé sur l'erreur
// ----------------------------------------------------------------
function buildCoworkTests(error) {
    const now = new Date().toISOString();
    const source = error.source || 'unknown';
    const errorType = error.error_type || 'critical';
    const message = (error.error_message || '').substring(0, 120);

    return {
        meta: {
            generated_at: now,
            correction_summary: `Auto-trigger: nouvelle erreur ${errorType} détectée sur ${source}`,
            trigger: 'supabase-webhook',
            error_id: error.id,
            error_message: message,
            files_modified: [],
            copilot_version: 'Copilot Claude Sonnet 4.6 (auto-webhook)'
        },
        auth: {
            url: 'https://liveownerunit.fr/pages/login.html',
            email_env: 'TEST_EMAIL',
            password_env: 'TEST_PASSWORD',
            wait_for: '#app-container'
        },
        scenarios: [
            {
                id: 'auto-001',
                name: `Vérifier la page source de l'erreur : ${source}`,
                page: source.startsWith('http') ? source : '/app.html',
                priority: 'critical',
                steps: [
                    {
                        action: 'navigate',
                        url: source.startsWith('http') ? source : 'https://liveownerunit.fr/app.html'
                    },
                    { action: 'wait_ms', ms: 4000 },
                    {
                        action: 'assert_no_console_error',
                        description: `Vérifier que l'erreur "${message}" n'est plus présente`
                    },
                    { action: 'screenshot', name: `auto-error-check-${error.id}` }
                ],
                expected_result: `La page source (${source}) charge sans l'erreur signalée`
            },
            {
                id: 'auto-002',
                name: 'Smoke — app.html non cassée',
                page: '/app.html',
                priority: 'smoke',
                steps: [
                    { action: 'navigate', url: 'https://liveownerunit.fr/app.html' },
                    { action: 'wait', selector: '#app-container', timeout: 8000 },
                    { action: 'assert_no_console_error', description: 'Aucune erreur console sur app.html' }
                ],
                expected_result: 'app.html accessible sans erreur console'
            },
            {
                id: 'auto-003',
                name: 'Smoke — admin-monitoring affiche bien l\'erreur',
                page: '/pages/admin-monitoring.html',
                priority: 'smoke',
                steps: [
                    { action: 'navigate', url: 'https://liveownerunit.fr/pages/admin-monitoring.html' },
                    { action: 'wait_ms', ms: 3000 },
                    {
                        action: 'assert_visible',
                        selector: '[class*="error"], [id*="error"], [class*="monitoring"]',
                        description: 'La section erreurs doit contenir au moins un élément'
                    },
                    { action: 'screenshot', name: 'auto-monitoring-check' }
                ],
                expected_result: 'Le dashboard monitoring affiche l\'erreur détectée'
            }
        ]
    };
}

// ----------------------------------------------------------------
// Pousser cowork-pending-tests.json sur GitHub (branche preprod)
// ----------------------------------------------------------------
async function pushCoworkTestsToGithub(testsContent) {
    const token = process.env.GITHUB_TOKEN;
    const repo = process.env.GITHUB_REPO;
    if (!token || !repo) {
        console.warn('[supabase-error webhook] GITHUB_TOKEN ou GITHUB_REPO manquant — skip push GitHub');
        return false;
    }

    const filePath = 'tmp/cowork-pending-tests.json';
    const apiBase = `https://api.github.com/repos/${repo}/contents/${filePath}`;
    const headers = {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github+json',
        'Content-Type': 'application/json',
        'X-GitHub-Api-Version': '2022-11-28'
    };

    // Récupérer le SHA actuel du fichier si il existe (requis pour update)
    let sha;
    try {
        const getRes = await fetch(`${apiBase}?ref=preprod`, { headers });
        if (getRes.ok) {
            const existing = await getRes.json();
            sha = existing.sha;
        }
    } catch {
        // Fichier absent — première création, pas de SHA requis
    }

    const body = {
        message: `chore(cowork): auto-trigger tests suite erreur critique [${new Date().toISOString()}]`,
        content: Buffer.from(JSON.stringify(testsContent, null, 2)).toString('base64'),
        branch: 'preprod',
        ...(sha ? { sha } : {})
    };

    const putRes = await fetch(apiBase, {
        method: 'PUT',
        headers,
        body: JSON.stringify(body)
    });

    return putRes.ok;
}

// ----------------------------------------------------------------
// Email d'alerte admin
// ----------------------------------------------------------------
async function sendAlertEmail(error) {
    const adminEmail = process.env.ADMIN_ALERT_EMAIL;
    if (!adminEmail || !process.env.SMTP_USER) return;

    const transporter = nodemailer.createTransporter({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: false,
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    });

    const source = error.source || 'unknown';
    const message = (error.error_message || '').substring(0, 200);

    await transporter.sendMail({
        from: process.env.SMTP_USER,
        to: adminEmail,
        subject: `🚨 [LiveOwnerUnit] Nouvelle erreur critique détectée — ${source}`,
        html: `
            <h2>Nouvelle erreur critique détectée</h2>
            <table style="border-collapse:collapse;width:100%">
                <tr><td style="padding:6px;font-weight:bold">Source</td><td style="padding:6px">${source}</td></tr>
                <tr><td style="padding:6px;font-weight:bold">Message</td><td style="padding:6px">${message}</td></tr>
                <tr><td style="padding:6px;font-weight:bold">URL</td><td style="padding:6px">${error.url || 'N/A'}</td></tr>
                <tr><td style="padding:6px;font-weight:bold">Utilisateur</td><td style="padding:6px">${error.user_email || error.user_id || 'Anonyme'}</td></tr>
                <tr><td style="padding:6px;font-weight:bold">Occurrence</td><td style="padding:6px">${error.occurrence_count || 1}</td></tr>
                <tr><td style="padding:6px;font-weight:bold">Timestamp</td><td style="padding:6px">${error.timestamp || new Date().toISOString()}</td></tr>
            </table>
            <p style="margin-top:16px">
                <a href="https://liveownerunit.fr/pages/admin-monitoring.html" style="background:#dc3545;color:white;padding:8px 16px;text-decoration:none;border-radius:4px">
                    Voir le dashboard monitoring
                </a>
            </p>
            <p style="color:#666;font-size:12px;margin-top:16px">
                Cowork a été automatiquement déclenché pour tester la page source.
            </p>
        `
    }).catch(err => {
        // Ne pas faire planter le webhook si l'email échoue
        console.error('[supabase-error webhook] Erreur email:', err.message);
    });
}

// ----------------------------------------------------------------
// Handler principal
// ----------------------------------------------------------------
module.exports = async function handler(req, res) {
    // Supabase envoie uniquement des POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Lire le body brut pour valider la signature
    const rawBody = JSON.stringify(req.body);
    const signature = req.headers['x-supabase-signature'] || req.headers['x-webhook-signature'] || '';
    const secret = process.env.SUPABASE_WEBHOOK_SECRET;

    // Valider la signature si le secret est configuré
    if (secret && !verifySupabaseSignature(rawBody, signature, secret)) {
        return res.status(401).json({ error: 'Invalid signature' });
    }

    const payload = req.body;

    // Supabase envoie { type: 'INSERT', table: 'error_logs', record: {...} }
    const record = payload?.record;
    if (!record) {
        return res.status(200).json({ skipped: 'no record in payload' });
    }

    // Filtrer : seulement les nouvelles erreurs critiques (occurrence_count = 1)
    const isCritical = record.error_type === 'critical';
    const isNew = (record.occurrence_count || 1) === 1;

    if (!isCritical || !isNew) {
        return res.status(200).json({ skipped: `not a new critical error (type=${record.error_type}, count=${record.occurrence_count})` });
    }

    // Générer et pousser les tests Cowork
    const tests = buildCoworkTests(record);
    const pushed = await pushCoworkTestsToGithub(tests).catch(err => {
        console.error('[supabase-error webhook] Erreur push GitHub:', err.message);
        return false;
    });

    // Envoyer l'email d'alerte
    await sendAlertEmail(record);

    return res.status(200).json({
        ok: true,
        error_id: record.id,
        cowork_tests_pushed: pushed,
        alert_email: Boolean(process.env.ADMIN_ALERT_EMAIL)
    });
};
