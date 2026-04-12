// ================================================================
// API : ENVOI D'EMAILS
// ================================================================
// Endpoint pour envoyer des emails automatiques
// Utilisé par le système de ticketing et notifications
// ================================================================

import nodemailer from 'nodemailer';

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
    return String(process.env.SEND_EMAIL_ENFORCE_ALLOWED_ORIGINS || 'true').trim().toLowerCase() === 'true';
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

// Configuration email (À ADAPTER selon votre provider)
const transporter = nodemailer.createTransporter({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // true pour 465, false pour autres ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

// Templates d'emails
const emailTemplates = {
    'error-notification': (data) => ({
        subject: data.subject,
        html: `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%); color: white; padding: 30px; border-radius: 12px 12px 0 0; }
        .content { background: white; padding: 30px; border: 1px solid #e2e8f0; }
        .error-box { background: #fee2e2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; border-radius: 8px; }
        .info-box { background: #f0fdf4; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; border-radius: 8px; }
        .btn { display: inline-block; padding: 12px 30px; background: #06b6d4; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 10px 0; }
        .footer { text-align: center; padding: 20px; color: #64748b; font-size: 0.9rem; }
        code { background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-family: monospace; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 style="margin: 0;">🚨 Alerte Erreur Détectée</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Ticket #${data.ticketId}</p>
        </div>
        
        <div class="content">
            <p>Bonjour,</p>
            
            <p>Notre système de monitoring a détecté une erreur nécessitant votre attention :</p>
            
            <div class="error-box">
                <p><strong>📝 Message d'erreur :</strong></p>
                <code>${data.errorMessage}</code>
                
                <p style="margin-top: 15px;"><strong>📂 Fichier :</strong> <code>${data.errorFile}</code></p>
                ${data.errorLine ? `<p><strong>📍 Ligne :</strong> ${data.errorLine}</p>` : ''}
                <p><strong>🕐 Détectée le :</strong> ${data.timestamp}</p>
            </div>
            
            <div class="info-box">
                <h3 style="margin-top: 0;">✅ Action en cours</h3>
                <p>Notre équipe technique analyse cette erreur et applique une correction.</p>
                <p><strong>Vous recevrez un email de suivi</strong> avec :</p>
                <ul>
                    <li>Les modifications apportées</li>
                    <li>Les instructions de test</li>
                    <li>Le résultat du monitoring</li>
                </ul>
            </div>
            
            <h3>🔍 Monitoring automatique</h3>
            <p>Cette erreur sera surveillée pendant <strong>${data.monitoringDuration}</strong>.</p>
            <p>Si aucune réapparition n'est détectée, le ticket sera clôturé automatiquement.</p>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="${data.supportUrl}" class="btn">Voir le ticket</a>
            </div>
            
            <p style="color: #64748b; font-size: 0.9rem; margin-top: 30px;">
                💡 <strong>Astuce :</strong> Aucune action n'est requise de votre part. 
                Nous vous tiendrons informé de l'avancement.
            </p>
        </div>
        
        <div class="footer">
            <p>Cet email a été envoyé automatiquement par le système de monitoring.</p>
            <p>Ticket #${data.ticketId} • ${new Date().toLocaleString('fr-FR')}</p>
        </div>
    </div>
</body>
</html>
        `
    }),
    
    'ticket-closed': (data) => ({
        subject: data.subject,
        html: `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; border-radius: 12px 12px 0 0; }
        .content { background: white; padding: 30px; border: 1px solid #e2e8f0; }
        .success-box { background: #f0fdf4; border-left: 4px solid #10b981; padding: 20px; margin: 20px 0; border-radius: 8px; text-align: center; }
        .footer { text-align: center; padding: 20px; color: #64748b; font-size: 0.9rem; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 style="margin: 0;">✅ Incident Résolu</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Ticket #${data.ticketId}</p>
        </div>
        
        <div class="content">
            <p>Bonjour,</p>
            
            <div class="success-box">
                <h2 style="color: #10b981; margin: 0 0 10px 0;">🎉 Bonne nouvelle !</h2>
                <p style="font-size: 1.1rem; margin: 0;">L'erreur n'est pas réapparue en ${data.monitoringDuration}.</p>
                <p style="margin: 10px 0 0 0;"><strong>Le problème est résolu.</strong></p>
            </div>
            
            <h3>📊 Résolution</h3>
            <p>${data.resolution}</p>
            
            <p><strong>Clôturé le :</strong> ${data.closedAt}</p>
            
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
            
            <p style="color: #64748b;">
                Si vous rencontrez à nouveau ce problème, n'hésitez pas à nous contacter.
            </p>
        </div>
        
        <div class="footer">
            <p>Ticket clôturé automatiquement par le système de monitoring.</p>
            <p>Ticket #${data.ticketId} • ${new Date().toLocaleString('fr-FR')}</p>
        </div>
    </div>
</body>
</html>
        `
    })
};

export default async function handler(req, res) {
    const allowedOrigins = getAllowedOrigins();
    const requestOrigin = getOriginFromRequest(req);
    const isAllowed = requestOrigin ? allowedOrigins.has(requestOrigin) : false;
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
    
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    
    try {
        const { to, subject, html, template, data } = req.body;

        // --- Mode notification directe via Resend (html fourni directement) ---
        if (to && subject && html) {
            const apiKey = process.env.RESEND_API_KEY;
            if (!apiKey) {
                // Clé non configurée : retourner 200 silencieux pour ne pas polluer les logs
                return res.status(200).json({ success: false, skipped: true, reason: 'RESEND_API_KEY not configured' });
            }
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
                return res.status(400).json({ error: 'Adresse email invalide' });
            }
            const fromEmail = process.env.RESEND_FROM_EMAIL || 'notifications@liveownerunit.fr';
            const fromName = process.env.RESEND_FROM_NAME || 'Gîte Welcome Home';
            const resendRes = await fetch('https://api.resend.com/emails', {
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
            let resendData = {};
            try { resendData = await resendRes.json(); } catch (_) { /* non-JSON response */ }
            if (!resendRes.ok) {
                // Clé invalide ou quota dépassé : silencieux côté client
                return res.status(200).json({ success: false, skipped: true, reason: 'Resend error', status: resendRes.status });
            }
            return res.status(200).json({ success: true, id: resendData.id });
        }

        // --- Mode template via SMTP ---
        if (!to || !template || !data) {
            return res.status(400).json({ 
                error: 'Missing required fields: to + (html+subject) or (template+data)' 
            });
        }
        
        // Récupérer le template
        const templateFunc = emailTemplates[template];
        if (!templateFunc) {
            return res.status(400).json({ 
                error: `Unknown template: ${template}` 
            });
        }
        
        // Générer l'email
        const emailContent = templateFunc(data);
        
        // Envoyer
        const info = await transporter.sendMail({
            from: process.env.SMTP_FROM || '"Support" <support@votre-site.com>',
            to: to,
            subject: emailContent.subject,
            html: emailContent.html
        });
        
        console.log('✅ Email sent:', info.messageId);
        
        return res.status(200).json({ 
            success: true, 
            messageId: info.messageId 
        });
        
    } catch (error) {
        // Retourner 200 pour ne pas créer de boucles d'erreurs côté client
        return res.status(200).json({ success: false, skipped: true, reason: error.message || 'unexpected error' });
    }
}
