// @ts-nocheck
// ================================================================
// EDGE FUNCTION : Notification email modification planning ménage auto
// Appelée côté application après résolution auto des conflits ménage
// ================================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function formatDateFr(dateStr?: string | null): string {
    if (!dateStr) return 'Date non disponible';
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return String(dateStr);
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
        const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
        if (!supabaseUrl || !anonKey || !serviceRoleKey) {
            throw new Error('Configuration Supabase incomplète');
        }

        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return new Response(JSON.stringify({ error: 'Non autorisé' }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const supabaseAuth = createClient(supabaseUrl, anonKey, {
            global: { headers: { Authorization: authHeader } }
        });

        const { data: authData, error: authError } = await supabaseAuth.auth.getUser();
        if (authError || !authData?.user?.id) {
            return new Response(JSON.stringify({ error: 'Utilisateur non authentifié' }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const currentUserId = authData.user.id;

        const payload = await req.json();
        const ownerUserId = payload?.owner_user_id || currentUserId;
        const giteId = payload?.gite_id || null;
        const beforeDate = payload?.before_date || null;
        const afterDate = payload?.after_date || null;
        const conflicts = Array.isArray(payload?.conflicts) ? payload.conflicts : [];

        if (ownerUserId !== currentUserId) {
            return new Response(JSON.stringify({ error: 'owner_user_id invalide' }), {
                status: 403,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const supabase = createClient(supabaseUrl, serviceRoleKey);

        const { data: prefs, error: prefsError } = await supabase
            .from('user_notification_preferences')
            .select('email_enabled, notify_menage_modifications, menage_company_email')
            .eq('user_id', ownerUserId)
            .maybeSingle();

        if (prefsError) throw prefsError;

        if (prefs && (prefs.email_enabled === false || prefs.notify_menage_modifications === false)) {
            return new Response(JSON.stringify({ skipped: true, reason: 'notifications désactivées' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const companyEmail = prefs?.menage_company_email || null;
        if (!companyEmail) {
            return new Response(JSON.stringify({ skipped: true, reason: 'email société ménage absent' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        let giteName = 'Votre gîte';
        if (giteId) {
            const { data: gite } = await supabase
                .from('gites')
                .select('name')
                .eq('id', giteId)
                .maybeSingle();
            giteName = gite?.name || giteName;
        }

        const validatedImpact = conflicts.some((c: Record<string, unknown>) => c?.was_validated === true);
        const cancelledDates = conflicts
            .map((c: Record<string, unknown>) => c?.old_date as string | undefined)
            .filter(Boolean);

        const cancelledDatesHtml = cancelledDates.length
            ? cancelledDates.map((d: string) => `<li>${formatDateFr(d)}</li>`).join('')
            : '<li>Aucune date détectée</li>';

        const severityTitle = validatedImpact
            ? '⚠️ AVERTISSEMENT : modification d\'un ménage déjà validé'
            : 'ℹ️ Mise à jour automatique du planning ménage';

        const subject = validatedImpact
            ? `⚠️ Planning ménage modifié (validation impactée) — ${giteName}`
            : `ℹ️ Planning ménage modifié automatiquement — ${giteName}`;

        const html = `
<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 20px;">
  <div style="max-width: 620px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
    <div style="background: ${validatedImpact ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'linear-gradient(135deg, #0ea5e9, #0284c7)'}; padding: 28px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 1.35rem;">${severityTitle}</h1>
      <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0;">${giteName}</p>
    </div>
    <div style="padding: 24px 28px;">
      <p>Bonjour,</p>
      <p>Le planning ménage a été ajusté automatiquement suite à une nouvelle réservation.</p>

      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 16px; margin: 18px 0;">
        <p style="margin: 0 0 8px 0;"><strong>Nouvelles dates planifiées :</strong></p>
        <ul style="margin: 0; padding-left: 18px;">
          <li>Avant nouvelle réservation : ${formatDateFr(beforeDate)}</li>
          <li>Après nouvelle réservation : ${formatDateFr(afterDate)}</li>
        </ul>
      </div>

      <div style="background: #fff7ed; border: 1px solid #fdba74; border-radius: 8px; padding: 14px 16px; margin: 18px 0;">
        <p style="margin: 0 0 8px 0;"><strong>Dates annulées (conflit) :</strong></p>
        <ul style="margin: 0; padding-left: 18px;">${cancelledDatesHtml}</ul>
      </div>

      ${validatedImpact ? '<p style="color:#991b1b; font-weight:700;">Attention : au moins un ménage déjà validé a été impacté par cette replanification.</p>' : ''}

      <p style="margin-top: 20px;">Merci de confirmer les nouveaux créneaux si nécessaire.</p>
    </div>
    <div style="background: #f9fafb; padding: 14px; text-align: center; border-top: 1px solid #e5e7eb; color: #94a3b8; font-size: 0.82rem;">
      Email automatique — LiveOwnerUnit
    </div>
  </div>
</body></html>`;

        const resendKey = Deno.env.get('RESEND_API_KEY');
        const fromEmail = Deno.env.get('RESEND_FROM_EMAIL') || 'notifications@liveownerunit.fr';
        const fromName = Deno.env.get('RESEND_FROM_NAME') || 'LiveOwnerUnit';
        if (!resendKey) throw new Error('RESEND_API_KEY manquante');

        const resendRes = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${resendKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                from: `${fromName} <${fromEmail}>`,
                to: [companyEmail],
                subject,
                html,
            }),
        });

        const resendData = await resendRes.json();
        if (!resendRes.ok) throw new Error(JSON.stringify(resendData));

        return new Response(JSON.stringify({ success: true, id: resendData.id }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('notify-cleaning-planning-change error:', error);
        return new Response(JSON.stringify({ error: (error as Error).message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
