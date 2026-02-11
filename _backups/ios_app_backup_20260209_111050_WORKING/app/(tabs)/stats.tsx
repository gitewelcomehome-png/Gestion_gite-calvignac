import { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { EmptyState } from '@/components/empty-state';
import { ErrorBanner } from '@/components/error-banner';
import { KpiCard } from '@/components/kpi-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/providers/auth-provider';
import { supabase } from '@/services/supabase';
import { startOfDay, toIsoString } from '@/utils/dates';

export default function StatsScreen() {
  const { user } = useAuth();
  const [reservationCount, setReservationCount] = useState(0);
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
    const last30 = startOfDay(new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000));

    const { count, error } = await supabase
      .from('reservations')
      .select('id', { head: true, count: 'exact' })
      .eq('owner_user_id', user.id)
      .gte('check_in', toIsoString(last30));

    if (error) {
      setErrorMessage('Unable to load stats.');
    }

    setReservationCount(count ?? 0);
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
        <ThemedText type="title">Stats</ThemedText>
        <ThemedText style={styles.subtitle}>Last 30 days</ThemedText>
      </View>

      {errorMessage ? <ErrorBanner message={errorMessage} /> : null}

      <View style={styles.kpiRow}>
        <KpiCard label="Reservations" value={`${reservationCount}`} accentColor="#0a7ea4" />
        <KpiCard label="Revenue" value="--" accentColor="#16a34a" />
      </View>

      <ThemedView style={styles.section}>
        <EmptyState message="Detailed stats coming soon" />
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
  kpiRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  section: {
    gap: 12,
  },
});
