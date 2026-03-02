// ================================================================
// EDGE FUNCTION : Notification email nouveau retour/demande client
// Supabase Edge Function — Deno runtime
// ================================================================
// Déclenchée par Database Webhook sur INSERT dans problemes_signales
// Envoie un email à l'owner si les notifications sont activées
// ================================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    const webhookSecret = Deno.env.get('WEBHOOK_SECRET');
    if (webhookSecret) {
        const authHeader = req.headers.get('x-webhook-secret');
        if (authHeader !== webhookSecret) {
            return new Response(JSON.stringify({ error: 'Non autorisé' }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }
    }

    try {
        const payload = await req.json();
        const retour = payload.record;

        if (!retour?.owner_user_id) {
            return new Response(JSON.stringify({ error: 'owner_user_id manquant' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        // Récupérer les préférences de l'owner
        const { data: prefs, error: prefsError } = await supabase
            .from('user_notification_preferences')
            .select('email_enabled, email_address, notify_demandes')
            .eq('user_id', retour.owner_user_id)
            .maybeSingle();

        if (prefsError) throw prefsError;

        // Si notifications explicitement désactivées → skip
        if (prefs && (prefs.email_enabled === false || prefs.notify_demandes === false)) {
            return new Response(JSON.stringify({ skipped: true, reason: 'notifications désactivées' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Résoudre l'email
        let emailDest = prefs?.email_address || null;
        if (!emailDest) {
            const { data: userData } = await supabase.auth.admin.getUserById(retour.owner_user_id);
            emailDest = userData?.user?.email || null;
        }

        if (!emailDest) {
            return new Response(JSON.stringify({ skipped: true, reason: 'aucun email disponible' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Infos du retour
        const typeLabels: Record<string, string> = {
            demande:      '💬 Demande',
            retour:       '📝 Retour',
            amelioration: '💡 Amélioration',
            probleme:     '🚨 Problème',
        };
        const typeLabel = typeLabels[retour.type] || retour.type || 'Message';
        const sujet = retour.sujet || 'Sans sujet';
        const description = retour.description || 'Aucune description';
        const giteName = retour.gite || 'Gîte inconnu';
        const clientName = retour._client_name || 'Client inconnu';
        const urgence = retour.urgence || '';
        const urgenceLabel = urgence === 'haute' ? '🔴 Haute' : urgence === 'faible' ? '🟢 Basse' : urgence === 'moyenne' ? '🟡 Normale' : '';

        const resendKey = Deno.env.get('RESEND_API_KEY');
        const fromEmail = Deno.env.get('RESEND_FROM_EMAIL') || 'notifications@liveownerunit.fr';
        const fromName = Deno.env.get('RESEND_FROM_NAME') || 'LiveOwnerUnit';

        if (!resendKey) throw new Error('RESEND_API_KEY manquante');

        const html = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
    <div style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); padding: 30px; text-align: center;">
      <h1 style="margin: 0; color: white; font-size: 24px;">${typeLabel} d'un voyageur</h1>
    </div>
    <div style="padding: 30px;">
      <p>Bonjour,</p>
      <p>Un voyageur vient de vous envoyer un message depuis sa fiche.</p>
      <div style="background: #f5f3ff; border-left: 4px solid #8b5cf6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0 0 8px 0;"><strong>Voyageur :</strong> ${clientName}</p>
        <p style="margin: 0 0 8px 0;"><strong>Gîte :</strong> ${giteName}</p>
        <p style="margin: 0 0 8px 0;"><strong>Type :</strong> ${typeLabel}</p>
        <p style="margin: 0 0 8px 0;"><strong>Sujet :</strong> ${sujet}</p>
        ${urgenceLabel ? `<p style="margin: 0 0 8px 0;"><strong>Urgence :</strong> ${urgenceLabel}</p>` : ''}
        <p style="margin: 0;"><strong>Message :</strong></p>
        <p style="margin: 8px 0 0 0; white-space: pre-wrap; background: white; padding: 12px; border-radius: 6px; border: 1px solid #e0d9ff;">${description}</p>
      </div>
      <p style="text-align: center; margin-top: 24px;">
        <a href="https://liveownerunit.fr/app" style="background: #8b5cf6; color: white; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600;">
          Voir dans l'app
        </a>
      </p>
    </div>
    <div style="text-align: center; padding: 20px; color: #64748b; font-size: 0.85rem; border-top: 1px solid #e2e8f0;">
      <p>Email automatique — LiveOwnerUnit</p>
    </div>
  </div>
</body>
</html>`;

        const resendRes = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${resendKey}`
            },
            body: JSON.stringify({
                from: `${fromName} <${fromEmail}>`,
                to: [emailDest],
                subject: `${typeLabel} — ${sujet} (${giteName})`,
                html
            })
        });

        const resendData = await resendRes.json();
        if (!resendRes.ok) throw new Error(`Resend error: ${JSON.stringify(resendData)}`);

        return new Response(JSON.stringify({ success: true, id: resendData.id }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('notify-retour-client error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
