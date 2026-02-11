import { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { CleaningCard } from '@/components/cleaning-card';
import { EmptyState } from '@/components/empty-state';
import { ErrorBanner } from '@/components/error-banner';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/providers/auth-provider';
import { supabase } from '@/services/supabase';
import type { CleaningSchedule } from '@/types/models';
import { endOfDay, startOfDay, toIsoString } from '@/utils/dates';

export default function CleaningScreen() {
  const { user } = useAuth();
  const [cleanings, setCleanings] = useState<CleaningSchedule[]>([]);
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

    const { data, error } = await supabase
      .from('cleaning_schedule')
      .select('id,gite_id,gite,scheduled_date,scheduled_time,status')
      .eq('owner_user_id', user.id)
      .gte('scheduled_date', toIsoString(start))
      .lte('scheduled_date', toIsoString(end))
      .order('scheduled_date', { ascending: true });

    if (error) {
      setErrorMessage('Unable to load cleaning schedule.');
    }

    setCleanings((data as CleaningSchedule[]) ?? []);
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
        <ThemedText type="title">Cleaning</ThemedText>
        <ThemedText style={styles.subtitle}>Today schedule</ThemedText>
      </View>

      {errorMessage ? <ErrorBanner message={errorMessage} /> : null}

      <ThemedView style={styles.section}>
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
