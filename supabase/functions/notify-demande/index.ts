// ================================================================
// EDGE FUNCTION : Notification email nouvelle demande d'horaire
// Supabase Edge Function — Deno runtime
// ================================================================
// Déclenchée par Database Webhook sur INSERT dans demandes_horaires
// Envoie un email à l'owner si preferences activées
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

    // Vérifier le secret webhook (protection contre appels non autorisés)
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
        // payload.record = la nouvelle ligne insérée dans demandes_horaires
        const demande = payload.record;

        if (!demande?.owner_user_id) {
            return new Response(JSON.stringify({ error: 'owner_user_id manquant' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Client Supabase avec service_role pour contourner RLS
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        // Récupérer les préférences de l'owner
        const { data: prefs, error: prefsError } = await supabase
            .from('user_notification_preferences')
            .select('email_enabled, email_address, notify_demandes')
            .eq('user_id', demande.owner_user_id)
            .maybeSingle();

        if (prefsError) throw prefsError;

        // Vérifier si l'email est activé pour les demandes
        if (!prefs?.email_enabled || !prefs?.notify_demandes || !prefs?.email_address) {
            return new Response(JSON.stringify({ skipped: true, reason: 'notifications désactivées' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Formater les infos de la demande
        const typeLabel = demande.type === 'arrivee' ? 'Arrivée anticipée' : 'Départ tardif';
        const dateSejour = demande.date_sejour
            ? new Date(demande.date_sejour).toLocaleDateString('fr-FR')
            : 'Non précisée';
        const heure = demande.heure_demandee || 'Non précisée';
        const motif = demande.motif || 'Aucun motif précisé';

        // Envoyer via Resend
        const resendKey = Deno.env.get('RESEND_API_KEY');
        const fromEmail = Deno.env.get('RESEND_FROM_EMAIL') || 'notifications@liveownerunit.fr';
        const fromName = Deno.env.get('RESEND_FROM_NAME') || 'Gîte Welcome Home';

        if (!resendKey) throw new Error('RESEND_API_KEY manquante');

        const html = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
    <div style="background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%); padding: 30px; text-align: center;">
      <h1 style="margin: 0; color: white; font-size: 24px;">📩 Nouvelle demande d'horaire</h1>
    </div>
    <div style="padding: 30px;">
      <p>Bonjour,</p>
      <p>Un voyageur vient d'envoyer une demande d'horaire pour votre gîte.</p>
      <div style="background: #f0f9ff; border-left: 4px solid #06b6d4; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0 0 8px 0;"><strong>Type :</strong> ${typeLabel}</p>
        <p style="margin: 0 0 8px 0;"><strong>Date :</strong> ${dateSejour}</p>
        <p style="margin: 0 0 8px 0;"><strong>Heure demandée :</strong> ${heure}</p>
        <p style="margin: 0;"><strong>Motif :</strong> ${motif}</p>
      </div>
      <p style="text-align: center; margin-top: 24px;">
        <a href="https://liveownerunit.fr/app" style="background: #06b6d4; color: white; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600;">
          Voir la demande
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
                to: [prefs.email_address],
                subject: `📩 Nouvelle demande d'horaire — ${typeLabel}`,
                html
            })
        });

        const resendData = await resendRes.json();
        if (!resendRes.ok) throw new Error(`Resend error: ${JSON.stringify(resendData)}`);

        return new Response(JSON.stringify({ success: true, id: resendData.id }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('notify-demande error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
