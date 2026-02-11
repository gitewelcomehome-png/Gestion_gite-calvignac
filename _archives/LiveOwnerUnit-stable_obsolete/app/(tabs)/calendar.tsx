import { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { EmptyState } from '@/components/empty-state';
import { ErrorBanner } from '@/components/error-banner';
import { ReservationCard } from '@/components/reservation-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/providers/auth-provider';
import { supabase } from '@/services/supabase';
import type { Reservation } from '@/types/models';
import { startOfDay, toIsoString } from '@/utils/dates';

export default function CalendarScreen() {
  const { user } = useAuth();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!supabase || !user) {
      setRefreshing(false);
      return;
    }

    setRefreshing(true);
    setErrorMessage(null);

    const today = startOfDay(new Date());

    const { data, error } = await supabase
      .from('reservations')
      .select('id,gite_id,gite,check_in,check_out,client_name,status')
      .eq('owner_user_id', user.id)
      .gte('check_in', toIsoString(today))
      .order('check_in', { ascending: true })
      .limit(20);

    if (error) {
      setErrorMessage('Unable to load reservations.');
    }

    setReservations((data as Reservation[]) ?? []);
    setRefreshing(false);
  }, [user]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadData} />}>
      <View style={styles.header}>
        <ThemedText type="title">Calendar</ThemedText>
        <ThemedText style={styles.subtitle}>Upcoming stays</ThemedText>
      </View>

      {errorMessage ? <ErrorBanner message={errorMessage} /> : null}

      <ThemedView style={styles.section}>
        {reservations.length === 0 ? (
          <EmptyState message="No upcoming reservations" />
        ) : (
          <View style={styles.cardList}>
            {reservations.map((reservation) => (
              <ReservationCard key={reservation.id} reservation={reservation} />
            ))}
          </View>
        )}
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    gap: 20,
  },
  header: {
    gap: 6,
  },
  subtitle: {
    opacity: 0.7,
  },
  section: {
    gap: 12,
  },
  cardList: {
    gap: 10,
  },
});
