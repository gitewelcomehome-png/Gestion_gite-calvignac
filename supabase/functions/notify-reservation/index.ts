// ================================================================
// EDGE FUNCTION : Notification email nouvelle réservation
// Supabase Edge Function — Deno runtime
// ================================================================
// Déclenchée par Database Webhook sur INSERT dans reservations
// Envoie un email à l'owner du gîte si preferences activées
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
        // payload.record = la nouvelle ligne insérée dans reservations
        const reservation = payload.record;

        if (!reservation?.gite_id) {
            return new Response(JSON.stringify({ error: 'gite_id manquant' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Client Supabase avec service_role pour contourner RLS
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        // Récupérer l'owner du gîte
        const { data: gite, error: giteError } = await supabase
            .from('gites')
            .select('user_id, name')
            .eq('id', reservation.gite_id)
            .maybeSingle();

        if (giteError) throw giteError;
        if (!gite?.user_id) {
            return new Response(JSON.stringify({ skipped: true, reason: 'gîte introuvable' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Récupérer les préférences de l'owner
        const { data: prefs, error: prefsError } = await supabase
            .from('user_notification_preferences')
            .select('email_enabled, email_address, notify_reservations')
            .eq('user_id', gite.user_id)
            .maybeSingle();

        if (prefsError) throw prefsError;

        // Si préférences explicitement désactivées → skip
        if (prefs && (prefs.email_enabled === false || prefs.notify_reservations === false)) {
            return new Response(JSON.stringify({ skipped: true, reason: 'notifications désactivées' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Résoudre l'email : soit depuis les prefs, soit depuis auth.users (fallback)
        let emailDest = prefs?.email_address || null;
        if (!emailDest) {
            const { data: userData } = await supabase.auth.admin.getUserById(gite.user_id);
            emailDest = userData?.user?.email || null;
        }

        if (!emailDest) {
            return new Response(JSON.stringify({ skipped: true, reason: 'aucun email disponible' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Formater les infos de la réservation
        const giteName = gite.name || 'Votre gîte';
        const clientName = reservation.client_name || reservation.nom_client || 'Voyageur';
        const checkIn = reservation.check_in
            ? new Date(reservation.check_in).toLocaleDateString('fr-FR')
            : 'Non précisée';
        const checkOut = reservation.check_out
            ? new Date(reservation.check_out).toLocaleDateString('fr-FR')
            : 'Non précisée';
        const source = reservation.source || reservation.platform || '';

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
    <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center;">
      <h1 style="margin: 0; color: white; font-size: 24px;">📅 Nouvelle réservation !</h1>
    </div>
    <div style="padding: 30px;">
      <p>Bonjour,</p>
      <p>Une nouvelle réservation a été reçue pour <strong>${giteName}</strong>.</p>
      <div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0 0 8px 0;"><strong>Voyageur :</strong> ${clientName}</p>
        <p style="margin: 0 0 8px 0;"><strong>Arrivée :</strong> ${checkIn}</p>
        <p style="margin: 0 0 8px 0;"><strong>Départ :</strong> ${checkOut}</p>
        ${source ? `<p style="margin: 0;"><strong>Source :</strong> ${source}</p>` : ''}
      </div>
      <p style="text-align: center; margin-top: 24px;">
        <a href="https://liveownerunit.fr/app" style="background: #10b981; color: white; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600;">
          Voir la réservation
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
                subject: `📅 Nouvelle réservation — ${giteName} (${checkIn} → ${checkOut})`,
                html
            })
        });

        const resendData = await resendRes.json();
        if (!resendRes.ok) throw new Error(`Resend error: ${JSON.stringify(resendData)}`);

        return new Response(JSON.stringify({ success: true, id: resendData.id }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('notify-reservation error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
