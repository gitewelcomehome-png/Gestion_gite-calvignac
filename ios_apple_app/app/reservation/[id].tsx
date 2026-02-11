import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  Linking,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  View,
  TouchableOpacity,
} from 'react-native';

import { ErrorBanner } from '@/components/error-banner';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/providers/auth-provider';
import { supabase } from '@/services/supabase';

function generateSecureToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

type ReservationDetail = {
  id: string;
  gite_id: string | null;
  gite_name: string | null;
  check_in: string | null;
  check_out: string | null;
  client_name: string | null;
  client_email: string | null;
  client_phone: string | null;
  client_address: string | null;
  guest_count: number | null;
  platform: string | null;
  platform_booking_id: string | null;
  status: string | null;
  total_price: number | null;
  paid_amount: number | null;
  currency: string | null;
  notes: string | null;
  created_at: string | null;
};

export default function ReservationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [reservation, setReservation] = useState<ReservationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadReservationDetails = async () => {
    if (!supabase || !user || !id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from('reservations')
      .select(
        `
        id,
        gite_id,
        gite,
        check_in,
        check_out,
        client_name,
        client_email,
        client_phone,
        client_address,
        guest_count,
        platform,
        platform_booking_id,
        status,
        total_price,
        paid_amount,
        currency,
        notes,
        created_at
        `
      )
      .eq('id', id)
      .eq('owner_user_id', user.id)
      .single();

    if (fetchError || !data) {
      setError(fetchError?.message || 'Reservation not found');
      setLoading(false);
      return;
    }

    setReservation({
      id: data.id,
      gite_id: data.gite_id,
      gite_name: data.gite ?? null,
      check_in: data.check_in,
      check_out: data.check_out,
      client_name: data.client_name,
      client_email: data.client_email,
      client_phone: data.client_phone,
      client_address: data.client_address,
      guest_count: data.guest_count,
      platform: data.platform,
      platform_booking_id: data.platform_booking_id,
      status: data.status,
      total_price: data.total_price,
      paid_amount: data.paid_amount,
      currency: data.currency,
      notes: data.notes,
      created_at: data.created_at,
    });
    setLoading(false);
  };

  useEffect(() => {
    void loadReservationDetails();
  }, [id, user]);

  const handlePhoneCall = () => {
    if (!reservation?.client_phone) {
      Alert.alert('No phone number', 'No phone number available for this client');
      return;
    }

    const phoneNumber = reservation.client_phone.replace(/[^0-9+]/g, '');
    const url = Platform.OS === 'ios' ? `telprompt:${phoneNumber}` : `tel:${phoneNumber}`;

    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(url);
        }
        Alert.alert('Error', 'Phone calls are not supported on this device');
      })
      .catch(() => {
        Alert.alert('Error', 'Unable to make phone call');
      });
  };

  const handleSendClientSheet = async () => {
    if (!reservation) return;

    try {
      // 1. Chercher token existant
      const { data: existingTokens } = await supabase
        .from('client_access_tokens')
        .select('token, expires_at, is_active')
        .eq('reservation_id', reservation.id)
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1);

      let token: string;

      if (existingTokens && existingTokens.length > 0) {
        token = existingTokens[0].token;
      } else {
        // Générer nouveau token
        token = generateSecureToken();
        const expiresAt = new Date(reservation.check_out || new Date());
        expiresAt.setDate(expiresAt.getDate() + 7);

        const ownerUserId = user?.id;
        if (!ownerUserId) {
          Alert.alert('Erreur', 'Impossible de générer le token');
          return;
        }

        const { error } = await supabase.from('client_access_tokens').insert({
          token,
          reservation_id: reservation.id,
          expires_at: expiresAt.toISOString(),
          owner_user_id: ownerUserId,
          is_active: true,
        });

        if (error) {
          console.warn('⚠️ Erreur sauvegarde token:', error);
        }
      }

      // 2. Construire URL et message
      const ficheUrl = `https://gestion-gite-calvignac.vercel.app/pages/fiche-client.html?token=${token}`;
      const message =
        `Bonjour ${reservation.client_name},\n\n` +
        `Voici votre guide pour votre séjour :\n${ficheUrl}\n\n` +
        `Vous y trouverez toutes les informations nécessaires (codes, horaires, activités...).\n\n` +
        `À très bientôt !`;

      // 3. Ouvrir WhatsApp si numéro disponible
      if (reservation.client_phone) {
        const phoneNumber = reservation.client_phone.replace(/[^0-9+]/g, '');
        const whatsappUrl = `whatsapp://send?phone=${phoneNumber}&text=${encodeURIComponent(message)}`;

        const canOpen = await Linking.canOpenURL(whatsappUrl);
        if (canOpen) {
          await Linking.openURL(whatsappUrl);
        } else {
          // Fallback sur Share si WhatsApp non disponible
          await Share.share({ message, title: `Guide séjour - ${reservation.client_name}` });
        }
      } else {
        // Pas de numéro, utiliser Share natif
        await Share.share({ message, title: `Guide séjour - ${reservation.client_name}` });
      }
    } catch (error) {
      console.error('Erreur génération fiche:', error);
      Alert.alert('Erreur', 'Impossible de générer la fiche client');
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ThemedText>Loading...</ThemedText>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <ErrorBanner message={error} />
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ThemedText>Go back</ThemedText>
        </Pressable>
      </View>
    );
  }

  if (!reservation) {
    return (
      <View style={styles.centered}>
        <ThemedText>Reservation not found</ThemedText>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ThemedText>Go back</ThemedText>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={loadReservationDetails} />}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backButtonTop}>
        <ThemedText style={styles.backButtonText}>← Retour</ThemedText>
      </TouchableOpacity>

      <View style={styles.header}>
        <ThemedText type="title">{reservation.gite_name || 'Gîte'}</ThemedText>
        <View style={styles.statusBadge}>
          <ThemedText style={styles.statusText}>{reservation.status || 'N/A'}</ThemedText>
        </View>
      </View>

      <ThemedView style={styles.section}>
        <ThemedText type="subtitle">Période</ThemedText>
        <View style={styles.dateContainer}>
          <View style={styles.dateBox}>
            <ThemedText style={styles.dateLabel}>Arrivée</ThemedText>
            <ThemedText type="defaultSemiBold">{formatDate(reservation.check_in)}</ThemedText>
          </View>
          <View style={styles.dateBox}>
            <ThemedText style={styles.dateLabel}>Départ</ThemedText>
            <ThemedText type="defaultSemiBold">{formatDate(reservation.check_out)}</ThemedText>
          </View>
        </View>
      </ThemedView>

      <ThemedView style={styles.section}>
        <ThemedText type="subtitle">Client</ThemedText>
        <View style={styles.infoRow}>
          <ThemedText style={styles.label}>Nom</ThemedText>
          <ThemedText type="defaultSemiBold">{reservation.client_name || 'N/A'}</ThemedText>
        </View>
        {reservation.client_email ? (
          <View style={styles.infoRow}>
            <ThemedText style={styles.label}>Email</ThemedText>
            <ThemedText>{reservation.client_email}</ThemedText>
          </View>
        ) : null}
        {reservation.client_phone ? (
          <View style={styles.infoRow}>
            <ThemedText style={styles.label}>Téléphone</ThemedText>
            <ThemedText style={[styles.phoneNumber, styles.phoneActive]}>
              {reservation.client_phone}
            </ThemedText>
          </View>
        ) : null}
        {reservation.client_address ? (
          <View style={styles.infoRow}>
            <ThemedText style={styles.label}>Adresse</ThemedText>
            <ThemedText>{reservation.client_address}</ThemedText>
          </View>
        ) : null}
        {reservation.guest_count ? (
          <View style={styles.infoRow}>
            <ThemedText style={styles.label}>Voyageurs</ThemedText>
            <ThemedText type="defaultSemiBold">{reservation.guest_count}</ThemedText>
          </View>
        ) : null}
      </ThemedView>

      <ThemedView style={styles.section}>
        <ThemedText type="subtitle">Réservation</ThemedText>
        {reservation.platform ? (
          <View style={styles.infoRow}>
            <ThemedText style={styles.label}>Plateforme</ThemedText>
            <ThemedText>{reservation.platform}</ThemedText>
          </View>
        ) : null}
        {reservation.platform_booking_id ? (
          <View style={styles.infoRow}>
            <ThemedText style={styles.label}>ID Booking</ThemedText>
            <ThemedText>{reservation.platform_booking_id}</ThemedText>
          </View>
        ) : null}
        {reservation.total_price ? (
          <>
            <View style={styles.infoRow}>
              <ThemedText style={styles.label}>Prix total</ThemedText>
              <ThemedText type="defaultSemiBold">
                {reservation.total_price} {reservation.currency || 'EUR'}
              </ThemedText>
            </View>
            {reservation.paid_amount ? (
              <View style={styles.infoRow}>
                <ThemedText style={styles.label}>Payé</ThemedText>
                <ThemedText>
                  {reservation.paid_amount} {reservation.currency || 'EUR'}
                </ThemedText>
              </View>
            ) : null}
            {reservation.paid_amount && reservation.total_price > reservation.paid_amount ? (
              <View style={styles.infoRow}>
                <ThemedText style={styles.label}>Restant</ThemedText>
                <ThemedText style={styles.remaining}>
                  {reservation.total_price - reservation.paid_amount} {reservation.currency || 'EUR'}
                </ThemedText>
              </View>
            ) : null}
          </>
        ) : null}
      </ThemedView>

      {reservation.notes ? (
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle">Notes</ThemedText>
          <ThemedText style={styles.notes}>{reservation.notes}</ThemedText>
        </ThemedView>
      ) : null}

      <View style={styles.actions}>
        <Pressable
          style={[styles.button, styles.buttonPrimary]}
          onPress={handlePhoneCall}
          disabled={!reservation.client_phone}>
          <ThemedText style={styles.buttonText}>📞 Appeler le client</ThemedText>
        </Pressable>

        <Pressable style={[styles.button, styles.buttonSecondary]} onPress={handleSendClientSheet}>
          <ThemedText style={styles.buttonText}>📄 Envoyer la fiche client</ThemedText>
        </Pressable>
      </View>

      <View style={styles.footer}>
        <ThemedText style={styles.footerText}>
          Créé le {formatDateTime(reservation.created_at)}
        </ThemedText>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    gap: 16,
  },
  backButton: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#0a7ea4',
    borderRadius: 8,
  },
  backButtonTop: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 40,
    marginBottom: 16,
    alignSelf: 'flex-start',
    minHeight: 44,
    minWidth: 100,
  },
  backButtonText: {
    fontSize: 16,
    color: '#0a7ea4',
    fontWeight: '600',
  },
  header: {
    marginBottom: 20,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: '#0a7ea4',
    borderRadius: 12,
    marginTop: 8,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    gap: 12,
  },
  dateContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  dateBox: {
    flex: 1,
    padding: 12,
    backgroundColor: 'rgba(10, 126, 164, 0.1)',
    borderRadius: 8,
    gap: 4,
  },
  dateLabel: {
    fontSize: 12,
    opacity: 0.7,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  label: {
    opacity: 0.7,
    flex: 1,
  },
  phoneNumber: {
    flex: 1,
    textAlign: 'right',
  },
  phoneActive: {
    color: '#0a7ea4',
    textDecorationLine: 'underline',
  },
  phoneInactive: {
    opacity: 0.5,
  },
  remaining: {
    color: '#f97316',
  },
  notes: {
    opacity: 0.8,
    lineHeight: 20,
  },
  actions: {
    gap: 12,
    marginVertical: 20,
  },
  button: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonPrimary: {
    backgroundColor: '#0a7ea4',
  },
  buttonSecondary: {
    backgroundColor: '#7c3aed',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  footer: {
    padding: 16,
    alignItems: 'center',
    marginBottom: 40,
  },
  footerText: {
    fontSize: 12,
    opacity: 0.5,
  },
});
