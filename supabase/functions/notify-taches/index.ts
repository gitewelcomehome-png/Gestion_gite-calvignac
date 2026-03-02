// ================================================================
// EDGE FUNCTION : Notification email nouvelle tâche de ménage
// Déclenchée par trigger sur INSERT dans cleaning_schedule
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
        const tache = payload.record;

        if (!tache?.owner_user_id) {
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
            .select('email_enabled, email_address, notify_taches')
            .eq('user_id', tache.owner_user_id)
            .maybeSingle();

        if (prefsError) throw prefsError;

        if (prefs && (prefs.email_enabled === false || prefs.notify_taches === false)) {
            return new Response(JSON.stringify({ skipped: true, reason: 'notifications désactivées' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        let emailDest = prefs?.email_address || null;
        if (!emailDest) {
            const { data: userData } = await supabase.auth.admin.getUserById(tache.owner_user_id);
            emailDest = userData?.user?.email || null;
        }

        if (!emailDest) {
            return new Response(JSON.stringify({ skipped: true, reason: 'aucun email disponible' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Formatage des infos
        const giteName = tache.gite || tache.gite_name || 'Votre gîte';
        const clientName = tache.client_name || 'Non renseigné';
        const dateStr = tache.scheduled_date
            ? new Date(tache.scheduled_date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
            : 'Non précisée';
        const momentLabel = tache.time_of_day === 'morning' ? '🌅 Matin'
            : tache.time_of_day === 'afternoon' ? '☀️ Après-midi'
            : tache.time_of_day === 'evening' ? '🌙 Soir'
            : tache.time_of_day || 'Non précisé';
        const proposePar = tache.proposed_by === 'company' ? 'Société de ménage' : 'Propriétaire';

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
    <div style="background: linear-gradient(135deg, #0ea5e9, #0284c7); padding: 30px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 1.6rem;">🧹 Nouvelle tâche de ménage</h1>
      <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0;">${giteName}</p>
    </div>
    <div style="padding: 30px;">
      <p style="color: #374151; font-size: 1rem;">Une nouvelle tâche de ménage a été planifiée.</p>
      <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 12px 8px; color: #6b7280; font-size: 0.9rem; width: 40%;">🏡 Gîte</td>
          <td style="padding: 12px 8px; color: #111827; font-weight: 600;">${giteName}</td>
        </tr>
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 12px 8px; color: #6b7280; font-size: 0.9rem;">👤 Voyageur</td>
          <td style="padding: 12px 8px; color: #111827; font-weight: 600;">${clientName}</td>
        </tr>
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 12px 8px; color: #6b7280; font-size: 0.9rem;">📅 Date prévue</td>
          <td style="padding: 12px 8px; color: #111827; font-weight: 600;">${dateStr}</td>
        </tr>
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 12px 8px; color: #6b7280; font-size: 0.9rem;">⏰ Moment</td>
          <td style="padding: 12px 8px; color: #111827; font-weight: 600;">${momentLabel}</td>
        </tr>
        <tr>
          <td style="padding: 12px 8px; color: #6b7280; font-size: 0.9rem;">📋 Proposé par</td>
          <td style="padding: 12px 8px; color: #111827; font-weight: 600;">${proposePar}</td>
        </tr>
      </table>
      ${tache.notes ? `<div style="margin-top: 20px; background: #f0f9ff; border-left: 4px solid #0ea5e9; padding: 14px 16px; border-radius: 4px;"><p style="margin: 0; color: #0369a1; font-size: 0.9rem;"><strong>Notes :</strong> ${tache.notes}</p></div>` : ''}
    </div>
    <div style="background: #f9fafb; padding: 16px; text-align: center; border-top: 1px solid #e5e7eb;">
      <p style="margin: 0; color: #9ca3af; font-size: 0.8rem;">LiveOwnerUnit — Gestion de gîte simplifiée</p>
    </div>
  </div>
</body>
</html>`;

        const resendRes = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${resendKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                from: `${fromName} <${fromEmail}>`,
                to: [emailDest],
                subject: `🧹 Nouvelle tâche de ménage — ${giteName} (${dateStr})`,
                html,
            }),
        });

        const resendData = await resendRes.json();
        if (!resendRes.ok) throw new Error(JSON.stringify(resendData));

        return new Response(JSON.stringify({ success: true, id: resendData.id }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (err) {
        return new Response(JSON.stringify({ error: (err as Error).message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
