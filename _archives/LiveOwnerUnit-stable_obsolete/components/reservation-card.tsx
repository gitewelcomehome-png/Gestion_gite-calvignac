import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import type { Reservation } from '@/types/models';
import { formatDateRange } from '@/utils/dates';

type ReservationCardProps = {
  reservation: Reservation;
};

export function ReservationCard({ reservation }: ReservationCardProps) {
  return (
    <ThemedView style={styles.card}>
      <View style={styles.header}>
        <ThemedText type="defaultSemiBold">
          {reservation.gite ?? 'Gite'}
        </ThemedText>
        <ThemedText style={styles.status}>{reservation.status ?? 'status'}</ThemedText>
      </View>
      <ThemedText style={styles.dates}>
        {formatDateRange(reservation.check_in, reservation.check_out)}
      </ThemedText>
      <ThemedText style={styles.client}>{reservation.client_name ?? 'Client'}</ThemedText>
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
  dates: {
    marginBottom: 4,
  },
  client: {
    opacity: 0.7,
  },
});
