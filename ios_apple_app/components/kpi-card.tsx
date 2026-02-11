import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

type KpiCardProps = {
  label: string;
  value: string;
  accentColor: string;
};

export function KpiCard({ label, value, accentColor }: KpiCardProps) {
  return (
    <ThemedView style={[styles.card, { borderLeftColor: accentColor }]}>
      <View style={styles.body}>
        <ThemedText type="defaultSemiBold" style={styles.value}>
          {value}
        </ThemedText>
        <ThemedText style={styles.label}>{label}</ThemedText>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    minHeight: 90,
  },
  body: {
    gap: 6,
  },
  value: {
    fontSize: 24,
  },
  label: {
    opacity: 0.7,
  },
});
