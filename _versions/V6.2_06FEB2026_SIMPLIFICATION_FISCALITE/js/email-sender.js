/**
 * ============================================================================
 * EMAIL SENDER - Envoi d'emails via Resend
 * ============================================================================
 * 
 * Fonctionnalités :
 * - Envoi d'emails de confirmation de compte / validation de sécurité
 * - Notifications de bienvenue
 * - Templates d'emails personnalisés
 * 
 * Date : 28 Janvier 2026
 * ============================================================================
 */

const RESEND_CONFIG = {
    apiKey: window.ENV?.RESEND_API_KEY || null, // À configurer dans Vercel Environment Variables
    fromEmail: 'notifications@liveownerunit.fr',
    fromName: 'Gîte Welcome Home'
};

/**
 * Envoyer un email via Resend API
 */
async function sendEmail({ to, subject, html, fromName }) {
    try {
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${RESEND_CONFIG.apiKey}`
            },
            body: JSON.stringify({
                from: `${fromName || RESEND_CONFIG.fromName} <${RESEND_CONFIG.fromEmail}>`,
                to: [to],
                subject: subject,
                html: html
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Erreur envoi email');
        }

        console.log('✅ Email envoyé avec succès:', data);
        return { success: true, data };

    } catch (error) {
        console.error('❌ Erreur envoi email:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Template : Email de confirmation de compte
 */
function getAccountConfirmationEmailHTML(userName, confirmationLink) {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Confirmez votre compte</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: white; border-radius: 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); overflow: hidden;">
                    
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center;">
                            <h1 style="margin: 0; color: white; font-size: 32px;">
                                🎉 Bienvenue !
                            </h1>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <h2 style="color: #2c3e50; margin-top: 0;">Bonjour ${userName},</h2>
                            
                            <p style="color: #555; font-size: 16px; line-height: 1.6;">
                                Merci de vous être inscrit sur <strong>Gîte Welcome Home</strong> ! 🏠
                            </p>
                            
                            <p style="color: #555; font-size: 16px; line-height: 1.6;">
                                Pour finaliser votre inscription et accéder à toutes les fonctionnalités, veuillez confirmer votre adresse email en cliquant sur le bouton ci-dessous :
                            </p>
                            
                            <!-- CTA Button -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                                <tr>
                                    <td align="center">
                                        <a href="${confirmationLink}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 16px 40px; border-radius: 50px; font-size: 18px; font-weight: 600; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
                                            ✅ Confirmer mon compte
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Info Box -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0; border-radius: 8px; overflow: hidden; border: 2px solid #ffc107; background: #fff9e6;">
                                <tr>
                                    <td style="padding: 20px;">
                                        <p style="margin: 0; color: #856404; font-size: 14px; line-height: 1.6;">
                                            ⚠️ <strong>Important :</strong> Vous disposez d'<strong>1 heure</strong> après votre inscription pour confirmer votre email. Passé ce délai, vous serez automatiquement déconnecté pour des raisons de sécurité.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="color: #999; font-size: 14px; line-height: 1.6; margin-top: 30px;">
                                Si le bouton ne fonctionne pas, copiez-collez ce lien dans votre navigateur :<br>
                                <a href="${confirmationLink}" style="color: #667eea; word-break: break-all;">${confirmationLink}</a>
                            </p>
                            
                            <p style="color: #555; font-size: 16px; line-height: 1.6; margin-top: 30px;">
                                À très bientôt,<br>
                                <strong style="color: #667eea;">L'équipe Gîte Welcome Home</strong>
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e0e0e0;">
                            <p style="margin: 0; color: #95a5a6; font-size: 12px;">
                                © ${new Date().getFullYear()} Gîte Welcome Home - Tous droits réservés
                            </p>
                            <p style="margin: 10px 0 0 0; color: #95a5a6; font-size: 12px;">
                                Vous recevez cet email car vous vous êtes inscrit sur notre plateforme.
                            </p>
                        </td>
                    </tr>
                    
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `;
}

/**
 * Template : Email de validation d'horaire d'arrivée (conservé pour usage futur)
 */
function getHoraireValidationEmailHTML(clientName, heureValidee, type, gite, checkIn, checkOut) {
    const typeLabel = type === 'arrivee' ? "d'arrivée" : "de départ";
    const emoji = type === 'arrivee' ? '🏠' : '👋';
    
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Horaire Validé</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: white; border-radius: 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); overflow: hidden;">
                    
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
                            <h1 style="margin: 0; color: white; font-size: 28px;">
                                ${emoji} Demande Validée !
                            </h1>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <h2 style="color: #2c3e50; margin-top: 0;">Bonjour ${clientName},</h2>
                            
                            <p style="color: #555; font-size: 16px; line-height: 1.6;">
                                Nous avons le plaisir de vous informer que votre demande d'horaire ${typeLabel} a été <strong>acceptée</strong> ! 🎉
                            </p>
                            
                            <!-- Info Box -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0; border-radius: 8px; overflow: hidden; border: 2px solid #667eea;">
                                <tr>
                                    <td style="background: #f0f4ff; padding: 20px;">
                                        <p style="margin: 0 0 10px 0; color: #2c3e50; font-size: 14px; font-weight: 600; text-transform: uppercase;">
                                            Votre réservation
                                        </p>
                                        <p style="margin: 0 0 8px 0; color: #555;">
                                            <strong>Gîte :</strong> ${gite}
                                        </p>
                                        <p style="margin: 0 0 8px 0; color: #555;">
                                            <strong>Arrivée :</strong> ${checkIn}
                                        </p>
                                        <p style="margin: 0 0 8px 0; color: #555;">
                                            <strong>Départ :</strong> ${checkOut}
                                        </p>
                                        <hr style="border: none; border-top: 1px solid #ddd; margin: 15px 0;">
                                        <p style="margin: 0; font-size: 20px; color: #667eea; font-weight: 700;">
                                            ⏰ Heure ${typeLabel} validée : <span style="color: #27ae60;">${heureValidee}</span>
                                        </p>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="color: #555; font-size: 16px; line-height: 1.6;">
                                Nous vous attendons avec plaisir ! Si vous avez d'autres questions, n'hésitez pas à nous contacter.
                            </p>
                            
                            <p style="color: #555; font-size: 16px; line-height: 1.6; margin-top: 30px;">
                                Cordialement,<br>
                                <strong style="color: #667eea;">L'équipe Gîte Welcome Home</strong>
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e0e0e0;">
                            <p style="margin: 0; color: #95a5a6; font-size: 12px;">
                                © ${new Date().getFullYear()} Gîte Welcome Home - Tous droits réservés
                            </p>
                        </td>
                    </tr>
                    
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `;
}

/**
 * Envoyer un email de confirmation de compte
 */
async function sendAccountConfirmationEmail(userEmail, userName, confirmationLink) {
    const subject = '🎉 Bienvenue ! Confirmez votre compte';
    const html = getAccountConfirmationEmailHTML(userName, confirmationLink);
    
    return await sendEmail({
        to: userEmail,
        subject: subject,
        html: html,
        fromName: RESEND_CONFIG.fromName
    });
}

/**
 * Envoyer un email de validation d'horaire (conservé pour usage futur)
 */
async function sendHoraireValidationEmail(clientEmail, clientName, heureValidee, type, gite, checkIn, checkOut) {
    const typeLabel = type === 'arrivee' ? "d'arrivée" : "de départ";
    const subject = `✅ Votre demande d'horaire ${typeLabel} est validée`;
    
    const html = getHoraireValidationEmailHTML(clientName, heureValidee, type, gite, checkIn, checkOut);
    
    return await sendEmail({
        to: clientEmail,
        subject: subject,
        html: html,
        fromName: RESEND_CONFIG.fromName
    });
}

/**
 * Template : Email de refus d'horaire
 */
async function sendHoraireRefusEmail(clientEmail, clientName, type, raison, gite) {
    const typeLabel = type === 'arrivee' ? "d'arrivée" : "de départ";
    const subject = `❌ Votre demande d'horaire ${typeLabel}`;
    
    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: white; border-radius: 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                    <tr>
                        <td style="padding: 40px 30px;">
                            <h2 style="color: #2c3e50;">Bonjour ${clientName},</h2>
                            <p style="color: #555; font-size: 16px; line-height: 1.6;">
                                Nous sommes désolés de vous informer que nous ne pouvons pas accéder à votre demande d'horaire ${typeLabel} pour le gîte <strong>${gite}</strong>.
                            </p>
                            ${raison ? `<p style="color: #555; font-size: 16px; line-height: 1.6;"><strong>Raison :</strong> ${raison}</p>` : ''}
                            <p style="color: #555; font-size: 16px; line-height: 1.6;">
                                N'hésitez pas à nous contacter si vous avez des questions.
                            </p>
                            <p style="color: #555; font-size: 16px; line-height: 1.6; margin-top: 30px;">
                                Cordialement,<br>
                                <strong>L'équipe Gîte Welcome Home</strong>
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `;
    
    return await sendEmail({
        to: clientEmail,
        subject: subject,
        html: html
    });
}

// Export des fonctions
window.sendEmail = sendEmail;
window.sendAccountConfirmationEmail = sendAccountConfirmationEmail;
window.sendHoraireValidationEmail = sendHoraireValidationEmail;
window.sendHoraireRefusEmail = sendHoraireRefusEmail;

// Email Sender prêt
