import * as Crypto from 'expo-crypto';
import { router } from 'expo-router';
import { Alert, Linking, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { supabase } from '@/services/supabase';
import type { Reservation } from '@/types/models';
import { formatDateRange } from '@/utils/dates';

type ReservationCardProps = {
  reservation: Reservation;
};

async function generateSecureToken(): Promise<string> {
  const randomBytes = await Crypto.getRandomBytesAsync(32);
  return Array.from(randomBytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function ReservationCard({ reservation }: ReservationCardProps) {
  console.log('🎫 [CARD] Rendu carte réservation:', {
    id: reservation.id,
    gite: reservation.gite,
    client: reservation.client_name,
    phone: reservation.client_phone,
    has_phone: !!reservation.client_phone
  });

  const handleCall = () => {
    const phone = reservation.client_phone;
    console.log('📞 [CARD] Tentative appel:', { phone, has_phone: !!phone });
    if (!phone) {
      Alert.alert('Erreur', 'Aucun numéro de téléphone disponible');
      return;
    }

    const phoneNumber = phone.replace(/[^0-9+]/g, '');
    const url = `tel:${phoneNumber}`;

    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(url);
        }
        Alert.alert('Erreur', 'Impossible d\'appeler depuis cet appareil');
      })
      .catch(() => {
        Alert.alert('Erreur', 'Impossible d\'appeler');
      });
  };

  const handleWhatsApp = async () => {
    const phone = reservation.client_phone;
    console.log('💬 [WHATSAPP] Début handleWhatsApp:', { 
      phone, 
      has_phone: !!phone, 
      reservation_id: reservation.id 
    });
    
    if (!phone) {
      Alert.alert('Erreur', 'Aucun numéro de téléphone disponible');
      return;
    }

    try {
      // 1. Chercher ou générer token
      console.log('💬 [WHATSAPP] Recherche token existant...');
      const { data: existingTokens, error: tokenError } = await supabase
        .from('client_access_tokens')
        .select('token, expires_at, is_active')
        .eq('reservation_id', reservation.id)
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1);

      if (tokenError) {
        console.error('❌ [WHATSAPP] Erreur recherche token:', tokenError);
      }

      let token: string;

      if (existingTokens && existingTokens.length > 0) {
        token = existingTokens[0].token;
        console.log('✅ [WHATSAPP] Token existant trouvé');
      } else {
        // Générer nouveau token
        console.log('💬 [WHATSAPP] Génération nouveau token...');
        token = await generateSecureToken();
        console.log('✅ [WHATSAPP] Token généré');
        
        const expiresAt = new Date(reservation.check_out || new Date());
        expiresAt.setDate(expiresAt.getDate() + 7);

        const {
          data: { user },
        } = await supabase.auth.getUser();
        const ownerUserId = user?.id || reservation.owner_user_id;

        if (ownerUserId) {
          console.log('💬 [WHATSAPP] Insertion token en base...');
          const { error: insertError } = await supabase.from('client_access_tokens').insert({
            token,
            reservation_id: reservation.id,
            expires_at: expiresAt.toISOString(),
            owner_user_id: ownerUserId,
            is_active: true,
          });
          
          if (insertError) {
            console.error('❌ [WHATSAPP] Erreur insertion token:', insertError);
          } else {
            console.log('✅ [WHATSAPP] Token inséré en base');
          }
        }
      }

      // 2. Construire URL et message
      const ficheUrl = `https://gestion-gite-calvignac.vercel.app/pages/fiche-client.html?token=${token}`;
      const message = 
        `Bonjour ${reservation.client_name},\n\n` +
        `Voici le guide de votre séjour à ${reservation.gite} :\n\n` +
        `${ficheUrl}\n\n` +
        `Vous y trouverez toutes les informations pratiques.\n\n` +
        `À bientôt !`;

      console.log('💬 [WHATSAPP] URL fiche:', ficheUrl.substring(0, 80) + '...');

      // 3. Ouvrir WhatsApp directement avec le numéro
      // Nettoyer le numéro et le formater pour WhatsApp (international sans +)
      let phoneNumber = phone.replace(/[^0-9+]/g, '');
      
      // Si le numéro commence par 0, remplacer par 33 (France)
      if (phoneNumber.startsWith('0')) {
        phoneNumber = '33' + phoneNumber.substring(1);
      }
      // Enlever le + s'il existe
      phoneNumber = phoneNumber.replace('+', '');
      
      console.log('💬 [WHATSAPP] Numéro formaté:', phoneNumber);
      
      // Utiliser wa.me qui ouvre directement la conversation
      const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
      
      console.log('💬 [WHATSAPP] Ouverture WhatsApp avec wa.me...');
      await Linking.openURL(whatsappUrl);
      console.log('✅ [WHATSAPP] WhatsApp ouvert avec succès');
    } catch (error) {
      console.error('❌ [WHATSAPP] Erreur complète:', error);
      Alert.alert('Erreur', `Impossible d'envoyer le message WhatsApp: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  };

  const handleDetails = () => {
    router.push(`/reservation/${reservation.id}`);
  };

  return (
    <ThemedView style={styles.card}>
      <View style={styles.header}>
        <ThemedText type="defaultSemiBold">{reservation.gite ?? 'Gite'}</ThemedText>
        <ThemedText style={styles.platform}>{reservation.platform ?? 'Direct'}</ThemedText>
      </View>
      <ThemedText style={styles.dates}>
        {formatDateRange(reservation.check_in, reservation.check_out)}
      </ThemedText>
      <ThemedText style={styles.client}>{reservation.client_name ?? 'Client'}</ThemedText>

      <View style={styles.actions}>
        <Pressable style={styles.actionButton} onPress={handleCall}>
          <ThemedText style={styles.actionText}>📞</ThemedText>
        </Pressable>
        <Pressable style={styles.actionButton} onPress={handleWhatsApp}>
          <ThemedText style={styles.actionText}>💬</ThemedText>
        </Pressable>
        <Pressable style={styles.actionButton} onPress={handleDetails}>
          <ThemedText style={styles.actionText}>ℹ️</ThemedText>
        </Pressable>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  status: {
    opacity: 0.6,
  },
  platform: {
    opacity: 0.7,
    fontSize: 11,
    fontWeight: '600',
    color: '#0a7ea4',
  },
  dates: {
    marginBottom: 4,
  },
  client: {
    opacity: 0.7,
    marginBottom: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#06b6d4',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '600',
  },
});
