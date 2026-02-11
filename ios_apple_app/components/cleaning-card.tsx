import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import type { CleaningSchedule } from '@/types/models';

type CleaningCardProps = {
  cleaning: CleaningSchedule;
};

function getDayName(dateString: string | null): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  return days[date.getDay()];
}

function getDateFormatted(dateString: string | null): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  return `${day}/${month}`;
}

function getPeriod(dateString: string | null): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  const hour = date.getHours();
  // Par défaut, considérer matin si avant 14h, après-midi sinon
  return hour < 14 ? 'Matin' : 'Après-midi';
}

export function CleaningCard({ cleaning }: CleaningCardProps) {
  const dayName = getDayName(cleaning.scheduled_date);
  const dateFormatted = getDateFormatted(cleaning.scheduled_date);
  const period = getPeriod(cleaning.scheduled_date);
  
  // Priorité : gites.name > gite > "Gîte inconnu"
  const giteName = cleaning.gites?.name || cleaning.gite || 'Gîte inconnu';

  return (
    <ThemedView style={styles.card}>
      <View style={styles.header}>
        <ThemedText type="defaultSemiBold">
          {giteName}
        </ThemedText>
        <ThemedText style={styles.period}>{period}</ThemedText>
      </View>
      <ThemedText style={styles.date}>
        {dayName} {dateFormatted}
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
    marginBottom: 8,
  },
  period: {
    opacity: 0.8,
    fontSize: 12,
    fontWeight: '600',
    color: '#7c3aed',
  },
  date: {
    fontSize: 13,
    opacity: 0.7,
  },
});
