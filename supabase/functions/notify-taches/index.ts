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
        const record = payload.record;
        const tableName = payload.table; // 'cleaning_schedule' ou 'todos'

        if (!record?.owner_user_id) {
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
            .eq('user_id', record.owner_user_id)
            .maybeSingle();

        if (prefsError) throw prefsError;

        if (prefs && (prefs.email_enabled === false || prefs.notify_taches === false)) {
            return new Response(JSON.stringify({ skipped: true, reason: 'notifications désactivées' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        let emailDest = prefs?.email_address || null;
        if (!emailDest) {
            const { data: userData } = await supabase.auth.admin.getUserById(record.owner_user_id);
            emailDest = userData?.user?.email || null;
        }

        if (!emailDest) {
            return new Response(JSON.stringify({ skipped: true, reason: 'aucun email disponible' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const resendKey = Deno.env.get('RESEND_API_KEY');
        const fromEmail = Deno.env.get('RESEND_FROM_EMAIL') || 'notifications@liveownerunit.fr';
        const fromName = Deno.env.get('RESEND_FROM_NAME') || 'LiveOwnerUnit';
        if (!resendKey) throw new Error('RESEND_API_KEY manquante');

        let subject = '';
        let html = '';

        if (tableName === 'todos') {
            // --- Tâche achat ou travaux ---
            const categoryLabel = record.category === 'achats' ? '🛒 Achat / Courses'
                : record.category === 'travaux' ? '🔧 Travaux / Maintenance'
                : record.category || 'Tâche';

            // Résoudre le nom du gîte depuis gite_id
            let giteName = 'Non précisé';
            if (record.gite_id) {
                const { data: gite } = await supabase
                    .from('gites')
                    .select('name')
                    .eq('id', record.gite_id)
                    .maybeSingle();
                giteName = gite?.name || giteName;
            }

            subject = `${record.category === 'travaux' ? '🔧' : '🛒'} Nouvelle tâche — ${record.title}`;
            html = `
<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
    <div style="background: linear-gradient(135deg, #f59e0b, #d97706); padding: 30px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 1.6rem;">${record.category === 'travaux' ? '🔧 Nouvelle tâche travaux' : '🛒 Nouvelle tâche achat'}</h1>
      <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0;">Signalée par la femme de ménage</p>
    </div>
    <div style="padding: 30px;">
      <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 12px 8px; color: #6b7280; font-size: 0.9rem; width: 35%;">📋 Catégorie</td>
          <td style="padding: 12px 8px; color: #111827; font-weight: 600;">${categoryLabel}</td>
        </tr>
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 12px 8px; color: #6b7280; font-size: 0.9rem;">🏡 Gîte</td>
          <td style="padding: 12px 8px; color: #111827; font-weight: 600;">${giteName}</td>
        </tr>
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 12px 8px; color: #6b7280; font-size: 0.9rem;">📌 Titre</td>
          <td style="padding: 12px 8px; color: #111827; font-weight: 600;">${record.title || 'Sans titre'}</td>
        </tr>
        ${record.description ? `<tr><td style="padding: 12px 8px; color: #6b7280; font-size: 0.9rem;">📝 Description</td><td style="padding: 12px 8px; color: #111827;">${record.description}</td></tr>` : ''}
      </table>
    </div>
    <div style="background: #f9fafb; padding: 16px; text-align: center; border-top: 1px solid #e5e7eb;">
      <p style="margin: 0; color: #9ca3af; font-size: 0.8rem;">LiveOwnerUnit — Gestion de gîte simplifiée</p>
    </div>
  </div>
</body></html>`;

        } else {
            // --- Planning ménage (cleaning_schedule) ---
            const giteName = record.gite || record.gite_name || 'Votre gîte';
            const clientName = record.client_name || 'Non renseigné';
            const dateStr = record.scheduled_date
                ? new Date(record.scheduled_date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
                : 'Non précisée';
            const momentLabel = record.time_of_day === 'morning' ? '🌅 Matin'
                : record.time_of_day === 'afternoon' ? '☀️ Après-midi'
                : record.time_of_day === 'evening' ? '🌙 Soir'
                : record.time_of_day || 'Non précisé';
            const proposePar = record.proposed_by === 'company' ? 'Société de ménage' : 'Propriétaire';

            subject = `🧹 Nouvelle tâche de ménage — ${giteName} (${dateStr})`;
            html = `
<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
    <div style="background: linear-gradient(135deg, #0ea5e9, #0284c7); padding: 30px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 1.6rem;">🧹 Nouvelle tâche de ménage</h1>
      <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0;">${giteName}</p>
    </div>
    <div style="padding: 30px;">
      <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
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
      ${record.notes ? `<div style="margin-top: 20px; background: #f0f9ff; border-left: 4px solid #0ea5e9; padding: 14px 16px; border-radius: 4px;"><p style="margin: 0; color: #0369a1; font-size: 0.9rem;"><strong>Notes :</strong> ${record.notes}</p></div>` : ''}
    </div>
    <div style="background: #f9fafb; padding: 16px; text-align: center; border-top: 1px solid #e5e7eb;">
      <p style="margin: 0; color: #9ca3af; font-size: 0.8rem;">LiveOwnerUnit — Gestion de gîte simplifiée</p>
    </div>
  </div>
</body></html>`;
        }

        const resendRes = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${resendKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                from: `${fromName} <${fromEmail}>`,
                to: [emailDest],
                subject,
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
