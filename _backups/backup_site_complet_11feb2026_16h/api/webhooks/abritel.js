/**
 * Webhook Abritel/Expedia - Endpoint Vercel
 * URL finale : https://votre-projet.vercel.app/api/webhooks/abritel
 */

import { createClient } from '@supabase/supabase-js';

// Configuration Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Vérifier la signature du webhook (sécurité)
 */
function verifyWebhookSignature(request, payload, secret) {
  const signature = request.headers['x-expedia-signature'];
  
  if (!signature) {
    console.warn('⚠️ Webhook sans signature');
    return false;
  }
  
  // TODO: Implémenter validation HMAC avec secret
  // const crypto = require('crypto');
  // const expectedSignature = crypto
  //   .createHmac('sha256', secret)
  //   .update(JSON.stringify(payload))
  //   .digest('hex');
  
  // return signature === expectedSignature;
  
  return true; // Pour le moment, accepter (à sécuriser après)
}

/**
 * Traiter une nouvelle réservation
 */
async function handleNewReservation(reservation) {
  // console.log('📥 Nouvelle réservation Abritel:', reservation.reservation_id);
  
  try {
    // 1. Trouver le gîte correspondant
    const { data: gite, error: giteError } = await supabase
      .from('gites')
      .select('id, name')
      .eq('abritel_property_id', reservation.property_id)
      .single();
    
    if (giteError || !gite) {
      console.error('❌ Gîte non trouvé pour property_id:', reservation.property_id);
      return { success: false, error: 'Gîte non trouvé' };
    }
    
    // 2. Vérifier si réservation existe déjà
    const { data: existing } = await supabase
      .from('reservations')
      .select('id')
      .eq('external_booking_id', reservation.reservation_id)
      .maybeSingle();
    
    if (existing) {
      // console.log('ℹ️ Réservation déjà importée');
      return { success: true, message: 'Déjà existante' };
    }
    
    // 3. Insérer la réservation
    const { data: newReservation, error: insertError } = await supabase
      .from('reservations')
      .insert({
        gite_id: gite.id,
        external_booking_id: reservation.reservation_id,
        platform: 'abritel',
        guest_name: `${reservation.guest?.first_name || ''} ${reservation.guest?.last_name || ''}`.trim(),
        guest_email: reservation.guest?.email,
        guest_phone: reservation.guest?.phone,
        check_in: reservation.check_in,
        check_out: reservation.check_out,
        nights: reservation.nights || calculateNights(reservation.check_in, reservation.check_out),
        guests: reservation.guests || 2,
        total_price: reservation.total_amount || 0,
        currency: reservation.currency || 'EUR',
        status: reservation.status || 'confirmed',
        booking_date: reservation.booking_date || new Date().toISOString()
      })
      .select()
      .single();
    
    if (insertError) {
      console.error('❌ Erreur insertion réservation:', insertError);
      throw insertError;
    }
    
    // console.log('✅ Réservation importée:', newReservation.id);
    
    // 4. TODO: Calculer ménage automatiquement
    // await calculateCleaningSchedule(newReservation);
    
    return { success: true, reservation: newReservation };
    
  } catch (error) {
    console.error('❌ Erreur handleNewReservation:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Traiter une modification de réservation
 */
async function handleReservationUpdate(reservation) {
  // console.log('🔄 Mise à jour réservation Abritel:', reservation.reservation_id);
  
  try {
    const { data, error } = await supabase
      .from('reservations')
      .update({
        check_in: reservation.check_in,
        check_out: reservation.check_out,
        nights: reservation.nights,
        guests: reservation.guests,
        total_price: reservation.total_amount,
        status: reservation.status,
        updated_at: new Date().toISOString()
      })
      .eq('external_booking_id', reservation.reservation_id)
      .select()
      .single();
    
    if (error) {
      console.error('❌ Erreur mise à jour:', error);
      return { success: false, error: error.message };
    }
    
    // console.log('✅ Réservation mise à jour:', data.id);
    return { success: true, reservation: data };
    
  } catch (error) {
    console.error('❌ Erreur handleReservationUpdate:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Traiter une annulation
 */
async function handleReservationCancellation(reservation) {
  // console.log('❌ Annulation réservation Abritel:', reservation.reservation_id);
  
  try {
    const { data, error } = await supabase
      .from('reservations')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('external_booking_id', reservation.reservation_id)
      .select()
      .single();
    
    if (error) {
      console.error('❌ Erreur annulation:', error);
      return { success: false, error: error.message };
    }
    
    // console.log('✅ Réservation annulée:', data.id);
    
    // TODO: Libérer les dates sur autres plateformes
    
    return { success: true, reservation: data };
    
  } catch (error) {
    console.error('❌ Erreur handleReservationCancellation:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Calculer nombre de nuits
 */
function calculateNights(checkIn, checkOut) {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const diff = end - start;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/**
 * Handler principal Vercel
 */
export default async function handler(req, res) {
  // Log de la requête
  // console.log('📥 Webhook reçu:', {
    method: req.method,
    headers: req.headers,
    query: req.query
  });
  
  // Accepter uniquement POST
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      message: 'Utilisez POST uniquement' 
    });
  }
  
  try {
    // Parser le payload
    const payload = req.body;
    
    if (!payload) {
      return res.status(400).json({ error: 'Payload manquant' });
    }
    
    // console.log('📦 Payload reçu:', JSON.stringify(payload, null, 2));
    
    // Vérifier la signature (sécurité)
    const webhookSecret = process.env.ABRITEL_WEBHOOK_SECRET;
    if (webhookSecret && !verifyWebhookSignature(req, payload, webhookSecret)) {
      console.error('⚠️ Signature invalide');
      return res.status(401).json({ error: 'Signature invalide' });
    }
    
    // Traiter selon le type d'événement
    let result;
    
    switch (payload.event_type) {
      case 'reservation.created':
      case 'booking.created':
        result = await handleNewReservation(payload.data || payload);
        break;
        
      case 'reservation.modified':
      case 'booking.modified':
        result = await handleReservationUpdate(payload.data || payload);
        break;
        
      case 'reservation.cancelled':
      case 'booking.cancelled':
        result = await handleReservationCancellation(payload.data || payload);
        break;
        
      case 'ping':
      case 'test':
        // console.log('🏓 Ping reçu - Webhook configuré correctement');
        return res.status(200).json({ 
          success: true, 
          message: 'Webhook actif' 
        });
        
      default:
        console.warn('⚠️ Type événement non géré:', payload.event_type);
        return res.status(200).json({ 
          success: true, 
          message: 'Événement ignoré' 
        });
    }
    
    // Réponse
    if (result.success) {
      return res.status(200).json({
        success: true,
        message: 'Traité avec succès',
        data: result
      });
    } else {
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }
    
  } catch (error) {
    console.error('❌ Erreur webhook:', error);
    
    return res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
