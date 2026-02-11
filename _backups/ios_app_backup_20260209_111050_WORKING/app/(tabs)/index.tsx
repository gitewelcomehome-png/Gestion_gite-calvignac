import { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { CleaningCard } from '@/components/cleaning-card';
import { EmptyState } from '@/components/empty-state';
import { ErrorBanner } from '@/components/error-banner';
import { KpiCard } from '@/components/kpi-card';
import { ReservationCard } from '@/components/reservation-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/providers/auth-provider';
import { supabase } from '@/services/supabase';
import type { CleaningSchedule, Reservation } from '@/types/models';
import { endOfDay, startOfDay, toIsoString } from '@/utils/dates';

export default function DashboardScreen() {
  const { user } = useAuth();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [cleanings, setCleanings] = useState<CleaningSchedule[]>([]);
  const [reservationCount, setReservationCount] = useState(0);
  const [cleaningCount, setCleaningCount] = useState(0);
  const [giteCount, setGiteCount] = useState(0);
  const [overdueCount, setOverdueCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!supabase || !user) {
      setRefreshing(false);
      return;
    }

    setRefreshing(true);
    setErrorMessage(null);

    const today = new Date();
    const start = startOfDay(today);
    const end = endOfDay(today);

    const [
      reservationsCountResult,
      reservationsResult,
      cleaningsCountResult,
      cleaningsResult,
      gitesCountResult,
      overdueCountResult,
    ] = await Promise.all([
      supabase
        .from('reservations')
        .select('id', { head: true, count: 'exact' })
        .eq('owner_user_id', user.id)
        .gte('check_in', toIsoString(start)),
      supabase
        .from('reservations')
        .select('id,gite_id,gite,check_in,check_out,client_name,status')
        .eq('owner_user_id', user.id)
        .gte('check_in', toIsoString(start))
        .order('check_in', { ascending: true })
        .limit(3),
      supabase
        .from('cleaning_schedule')
        .select('id', { head: true, count: 'exact' })
        .eq('owner_user_id', user.id)
        .gte('scheduled_date', toIsoString(start))
        .lte('scheduled_date', toIsoString(end)),
      supabase
        .from('cleaning_schedule')
        .select('id,gite_id,gite,scheduled_date,scheduled_time,status')
        .eq('owner_user_id', user.id)
        .gte('scheduled_date', toIsoString(start))
        .lte('scheduled_date', toIsoString(end))
        .order('scheduled_date', { ascending: true })
        .limit(3),
      supabase
        .from('gites')
        .select('id', { head: true, count: 'exact' })
        .eq('owner_user_id', user.id)
        .eq('is_active', true),
      supabase
        .from('cleaning_schedule')
        .select('id', { head: true, count: 'exact' })
        .eq('owner_user_id', user.id)
        .eq('status', 'planned')
        .lt('scheduled_date', toIsoString(start)),
    ]);

    const errors = [
      reservationsCountResult.error,
      reservationsResult.error,
      cleaningsCountResult.error,
      cleaningsResult.error,
      gitesCountResult.error,
      overdueCountResult.error,
    ].filter(Boolean);

    if (errors.length > 0) {
      setErrorMessage('Unable to load dashboard data.');
    }

    setReservationCount(reservationsCountResult.count ?? 0);
    setCleaningCount(cleaningsCountResult.count ?? 0);
    setGiteCount(gitesCountResult.count ?? 0);
    setOverdueCount(overdueCountResult.count ?? 0);
    setReservations((reservationsResult.data as Reservation[]) ?? []);
    setCleanings((cleaningsResult.data as CleaningSchedule[]) ?? []);
    setRefreshing(false);
  }, [user]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const kpis = useMemo(
    () => [
      { label: 'Reservations', value: `${reservationCount}`, accent: '#0a7ea4' },
      { label: 'Cleanings', value: `${cleaningCount}`, accent: '#7c3aed' },
      { label: 'Active gites', value: `${giteCount}`, accent: '#16a34a' },
      { label: 'Occupancy', value: '--', accent: '#f97316' },
    ],
    [cleaningCount, giteCount, reservationCount]
  );

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadData} />}>
      <View style={styles.header}>
        <ThemedText type="title">Dashboard</ThemedText>
        <ThemedText style={styles.subtitle}>Overview for today</ThemedText>
      </View>

      {errorMessage ? <ErrorBanner message={errorMessage} /> : null}

      <View style={styles.kpiGrid}>
        {kpis.map((kpi) => (
          <KpiCard key={kpi.label} label={kpi.label} value={kpi.value} accentColor={kpi.accent} />
        ))}
      </View>

      <ThemedView style={styles.section}>
        <View style={styles.sectionHeader}>
          <ThemedText type="subtitle">Upcoming reservations</ThemedText>
        </View>
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

      <ThemedView style={styles.section}>
        <View style={styles.sectionHeader}>
          <ThemedText type="subtitle">Today cleanings</ThemedText>
        </View>
        {cleanings.length === 0 ? (
          <EmptyState message="No cleanings scheduled" />
        ) : (
          <View style={styles.cardList}>
            {cleanings.map((cleaning) => (
              <CleaningCard key={cleaning.id} cleaning={cleaning} />
            ))}
          </View>
        )}
      </ThemedView>

      <ThemedView style={styles.section}>
        <View style={styles.sectionHeader}>
          <ThemedText type="subtitle">Alerts</ThemedText>
        </View>
        {overdueCount > 0 ? (
          <ThemedText>{`${overdueCount} cleanings overdue`}</ThemedText>
        ) : (
          <EmptyState message="No alerts" />
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
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  section: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardList: {
    gap: 10,
  },
});
