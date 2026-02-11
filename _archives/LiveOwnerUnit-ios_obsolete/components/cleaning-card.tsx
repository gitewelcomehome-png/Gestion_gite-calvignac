import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import type { CleaningSchedule } from '@/types/models';
import { formatDate } from '@/utils/dates';

type CleaningCardProps = {
  cleaning: CleaningSchedule;
};

export function CleaningCard({ cleaning }: CleaningCardProps) {
  const time = cleaning.scheduled_time ? ` at ${cleaning.scheduled_time}` : '';

  return (
    <ThemedView style={styles.card}>
      <View style={styles.header}>
        <ThemedText type="defaultSemiBold">
          {cleaning.gite ?? 'Gite'}
        </ThemedText>
        <ThemedText style={styles.status}>{cleaning.status ?? 'status'}</ThemedText>
      </View>
      <ThemedText>
        {formatDate(cleaning.scheduled_date)}{time}
      </ThemedText>
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
});
