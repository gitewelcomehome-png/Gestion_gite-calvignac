// ================================================================
// EDGE FUNCTION : Emails confirmation commande prestations
// Supabase Edge Function — Deno runtime
// ================================================================
// Appelée par fiche-client-prestations.js après INSERT réussi
// Envoie 2 emails :
//   1) Au client : confirmation de sa commande
//   2) À l'owner : notification nouvelle commande reçue
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

    try {
        const payload = await req.json();
        const { commande, lignes, reservation, gite_name } = payload;

        if (!commande?.id || !reservation?.owner_user_id) {
            return new Response(JSON.stringify({ error: 'Données manquantes (commande ou reservation)' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const resendKey = Deno.env.get('RESEND_API_KEY');
        if (!resendKey) throw new Error('RESEND_API_KEY manquante');

        const fromEmail = Deno.env.get('RESEND_FROM_EMAIL') || 'notifications@liveownerunit.fr';
        const fromName  = Deno.env.get('RESEND_FROM_NAME')  || 'LiveOwnerUnit';

        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        // --- Données formatées ---
        const clientEmail  = reservation.client_email || null;
        const clientName   = reservation.client_name || reservation.nom_client || reservation.guest_name || 'Client';
        const giteName     = gite_name || reservation.gite || 'Gîte';
        const numero       = commande.numero_commande || commande.id;
        const montantBrut  = parseFloat(commande.montant_prestations || 0).toFixed(2);
        const commission   = parseFloat(commande.montant_commission   || 0).toFixed(2);
        const montantTotal = (parseFloat(montantBrut) + parseFloat(commission)).toFixed(2);

        // Lignes de commande pour email
        const lignesHTML = (lignes || []).map((l: any) => `
            <tr>
                <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0;">${l.nom_prestation}</td>
                <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; text-align: center;">${l.quantite}</td>
                <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; text-align: right;">${parseFloat(l.prix_total).toFixed(2)} €</td>
            </tr>
        `).join('');

        const emails: Promise<any>[] = [];

        // ================================================================
        // EMAIL 1 : Confirmation au client
        // ================================================================
        if (clientEmail) {
            const htmlClient = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
    <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center;">
      <h1 style="margin: 0; color: white; font-size: 24px;">✅ Commande confirmée</h1>
      <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.85); font-size: 14px;">Commande n° ${numero}</p>
    </div>
    <div style="padding: 30px;">
      <p>Bonjour ${clientName},</p>
      <p>Votre commande pour votre séjour au <strong>${giteName}</strong> a bien été reçue.</p>

      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <thead>
          <tr style="background: #f8fafc;">
            <th style="padding: 10px 12px; text-align: left; border-bottom: 2px solid #e2e8f0; font-size: 13px; color: #475569;">Prestation</th>
            <th style="padding: 10px 12px; text-align: center; border-bottom: 2px solid #e2e8f0; font-size: 13px; color: #475569;">Qté</th>
            <th style="padding: 10px 12px; text-align: right; border-bottom: 2px solid #e2e8f0; font-size: 13px; color: #475569;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${lignesHTML}
        </tbody>
        <tfoot>
          <tr style="background: #f0fdf4;">
            <td colspan="2" style="padding: 12px; font-weight: 700; color: #059669;">Total</td>
            <td style="padding: 12px; font-weight: 700; color: #059669; text-align: right;">${montantTotal} €</td>
          </tr>
        </tfoot>
      </table>

      <p style="color: #64748b; font-size: 14px;">Le propriétaire du gîte a été notifié et prendra contact avec vous si nécessaire.</p>
    </div>
    <div style="text-align: center; padding: 20px; color: #64748b; font-size: 0.85rem; border-top: 1px solid #e2e8f0;">
      <p>Email automatique — LiveOwnerUnit</p>
    </div>
  </div>
</body>
</html>`;

            emails.push(
                fetch('https://api.resend.com/emails', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${resendKey}`
                    },
                    body: JSON.stringify({
                        from: `${fromName} <${fromEmail}>`,
                        to: [clientEmail],
                        subject: `✅ Commande confirmée — ${giteName} (${numero})`,
                        html: htmlClient
                    })
                })
            );
        }

        // ================================================================
        // EMAIL 2 : Notification à l'owner
        // ================================================================
        let ownerEmail: string | null = null;

        // Récupérer email owner depuis ses préférences ou auth.users
        const { data: prefs } = await supabase
            .from('user_notification_preferences')
            .select('email_enabled, email_address, notify_commandes')
            .eq('user_id', reservation.owner_user_id)
            .maybeSingle();

        if (prefs && (prefs.email_enabled === false || prefs.notify_commandes === false)) {
            // Owner a désactivé les notifications commandes → skip
        } else {
            ownerEmail = prefs?.email_address || null;
            if (!ownerEmail) {
                const { data: userData } = await supabase.auth.admin.getUserById(reservation.owner_user_id);
                ownerEmail = userData?.user?.email || null;
            }
        }

        if (ownerEmail) {
            const htmlOwner = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
    <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 30px; text-align: center;">
      <h1 style="margin: 0; color: white; font-size: 24px;">🛒 Nouvelle commande</h1>
      <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.85); font-size: 14px;">Commande n° ${numero}</p>
    </div>
    <div style="padding: 30px;">
      <p>Bonjour,</p>
      <p><strong>${clientName}</strong> vient de passer une commande pour son séjour au <strong>${giteName}</strong>.</p>

      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <thead>
          <tr style="background: #f8fafc;">
            <th style="padding: 10px 12px; text-align: left; border-bottom: 2px solid #e2e8f0; font-size: 13px; color: #475569;">Prestation</th>
            <th style="padding: 10px 12px; text-align: center; border-bottom: 2px solid #e2e8f0; font-size: 13px; color: #475569;">Qté</th>
            <th style="padding: 10px 12px; text-align: right; border-bottom: 2px solid #e2e8f0; font-size: 13px; color: #475569;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${lignesHTML}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="2" style="padding: 10px 12px; border-top: 1px solid #e2e8f0; color: #64748b;">Montant brut</td>
            <td style="padding: 10px 12px; border-top: 1px solid #e2e8f0; text-align: right;">${montantBrut} €</td>
          </tr>
          <tr>
            <td colspan="2" style="padding: 10px 12px; color: #64748b;">Commission (5%)</td>
            <td style="padding: 10px 12px; text-align: right; color: #ef4444;">- ${commission} €</td>
          </tr>
          <tr style="background: #eff6ff;">
            <td colspan="2" style="padding: 12px; font-weight: 700; color: #2563eb;">Votre net</td>
            <td style="padding: 12px; font-weight: 700; color: #2563eb; text-align: right;">${parseFloat(commande.montant_net_owner || 0).toFixed(2)} €</td>
          </tr>
        </tfoot>
      </table>

      <p style="text-align: center; margin-top: 24px;">
        <a href="https://liveownerunit.fr/app" style="background: #3b82f6; color: white; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600;">
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

            emails.push(
                fetch('https://api.resend.com/emails', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${resendKey}`
                    },
                    body: JSON.stringify({
                        from: `${fromName} <${fromEmail}>`,
                        to: [ownerEmail],
                        subject: `🛒 Nouvelle commande — ${clientName} (${giteName})`,
                        html: htmlOwner
                    })
                })
            );
        }

        // Envoyer les deux emails en parallèle
        const results = await Promise.allSettled(emails);
        const errors = results
            .filter(r => r.status === 'rejected')
            .map(r => (r as PromiseRejectedResult).reason?.message);

        if (errors.length > 0) {
            console.error('Erreurs envoi email:', errors);
        }

        return new Response(JSON.stringify({
            success: true,
            sent_client: !!clientEmail,
            sent_owner: !!ownerEmail,
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('confirm-commande-prestations error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
