import { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View, TouchableOpacity, Modal } from 'react-native';
import { Picker } from '@react-native-picker/picker';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/providers/auth-provider';
import { supabase } from '@/services/supabase';
import type { CleaningSchedule, Gite } from '@/types/models';
import { 
  startOfMonth, 
  endOfMonth, 
  addMonths, 
  subMonths, 
  formatYYYYMMDD,
  formatMonthYear,
  formatFullDate
} from '@/utils/dates';

type CleaningDay = {
  date: Date;
  dateStr: string;
  dayOfMonth: number;
  isToday: boolean;
  isCurrentMonth: boolean;
  cleaning?: CleaningSchedule;
};

export default function CleaningScreen() {
  const { user } = useAuth();
  const [gites, setGites] = useState<Gite[]>([]);
  const [selectedGite, setSelectedGite] = useState<Gite | null>(null);
  const [cleanings, setCleanings] = useState<CleaningSchedule[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDay, setSelectedDay] = useState<CleaningDay | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Charger les gîtes
  const loadGites = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('gites')
      .select('id, name, is_active')
      .eq('owner_user_id', user.id)
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('Erreur chargement gîtes:', error);
      return;
    }

    setGites((data as Gite[]) || []);
    if (data && data.length > 0 && !selectedGite) {
      setSelectedGite(data[0] as Gite);
    }
  }, [user, selectedGite]);

  // Charger les ménages du mois pour le gîte sélectionné
  const loadCleanings = useCallback(async () => {
    if (!user || !selectedGite) return;

    setRefreshing(true);

    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);

    const { data, error } = await supabase
      .from('cleaning_schedule')
      .select('id, gite_id, scheduled_date, status')
      .eq('owner_user_id', user.id)
      .eq('gite_id', selectedGite.id)
      .gte('scheduled_date', formatYYYYMMDD(start))
      .lte('scheduled_date', formatYYYYMMDD(end))
      .order('scheduled_date', { ascending: true });

    if (error) {
      console.error('Erreur chargement ménages:', error);
    }

    setCleanings((data as CleaningSchedule[]) || []);
    setRefreshing(false);
  }, [user, selectedGite, currentMonth]);

  useEffect(() => {
    void loadGites();
  }, [loadGites]);

  useEffect(() => {
    if (selectedGite) {
      void loadCleanings();
    }
  }, [loadCleanings, selectedGite, currentMonth]);

  // Générer le calendrier
  const generateCalendarDays = (): CleaningDay[] => {
    if (!selectedGite) return [];

    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const today = new Date();
    const days: CleaningDay[] = [];

    // Jours avant le mois (pour aligner)
    const startWeekday = start.getDay();
    const daysToAdd = startWeekday === 0 ? 6 : startWeekday - 1;

    for (let i = daysToAdd; i > 0; i--) {
      const date = new Date(start);
      date.setDate(date.getDate() - i);
      days.push({
        date,
        dateStr: formatYYYYMMDD(date),
        dayOfMonth: date.getDate(),
        isToday: false,
        isCurrentMonth: false,
      });
    }

    // Jours du mois
    const daysInMonth = end.getDate();
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      const dateStr = formatYYYYMMDD(date);
      const cleaning = cleanings.find(c => c.scheduled_date === dateStr);
      
      days.push({
        date,
        dateStr,
        dayOfMonth: day,
        isToday: formatYYYYMMDD(date) === formatYYYYMMDD(today),
        isCurrentMonth: true,
        cleaning,
      });
    }

    // Jours après le mois
    const totalCells = Math.ceil(days.length / 7) * 7;
    let nextDay = 1;
    while (days.length < totalCells) {
      const date = new Date(end);
      date.setDate(date.getDate() + nextDay);
      days.push({
        date,
        dateStr: formatYYYYMMDD(date),
        dayOfMonth: date.getDate(),
        isToday: false,
        isCurrentMonth: false,
      });
      nextDay++;
    }

    return days;
  };

  // Mettre à jour le statut d'un ménage
  const updateCleaningStatus = async (dateStr: string, newStatus: string) => {
    if (!selectedGite || !user) return;

    // Vérifier si un ménage existe déjà
    const existingCleaning = cleanings.find(c => c.scheduled_date === dateStr);

    if (existingCleaning) {
      // Mettre à jour
      const { error } = await supabase
        .from('cleaning_schedule')
        .update({ status: newStatus })
        .eq('id', existingCleaning.id);

      if (error) {
        console.error('Erreur mise à jour ménage:', error);
        return;
      }
    } else {
      // Créer
      const { error } = await supabase
        .from('cleaning_schedule')
        .insert([{
          gite_id: selectedGite.id,
          scheduled_date: dateStr,
          status: newStatus,
          owner_user_id: user.id,
        }]);

      if (error) {
        console.error('Erreur création ménage:', error);
        return;
      }
    }

    setModalVisible(false);
    await loadCleanings();
  };

  const calendarDays = generateCalendarDays();

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadCleanings} />}>
      
      <View style={styles.header}>
        <ThemedText type="title">Ménage</ThemedText>
      </View>

      {/* Sélecteur de gîte */}
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={selectedGite?.id || ''}
          onValueChange={(itemValue) => {
            const gite = gites.find(g => g.id === itemValue);
            if (gite) setSelectedGite(gite);
          }}
          style={styles.picker}>
          {gites.map((gite) => (
            <Picker.Item key={gite.id} label={gite.name || 'Sans nom'} value={gite.id} />
          ))}
        </Picker>
      </View>

      {selectedGite && (
        <>
          {/* Navigation mois */}
          <View style={styles.monthNav}>
            <TouchableOpacity
              style={styles.navButton}
              onPress={() => setCurrentMonth(subMonths(currentMonth, 1))}>
              <ThemedText style={styles.navButtonText}>‹</ThemedText>
            </TouchableOpacity>
            
            <ThemedText style={styles.monthTitle}>
              {formatMonthYear(currentMonth)}
            </ThemedText>
            
            <TouchableOpacity
              style={styles.navButton}
              onPress={() => setCurrentMonth(addMonths(currentMonth, 1))}>
              <ThemedText style={styles.navButtonText}>›</ThemedText>
            </TouchableOpacity>
          </View>

          {/* Calendrier */}
          <View style={styles.calendar}>
            {/* Jours de la semaine */}
            <View style={styles.weekHeader}>
              {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day) => (
                <View key={day} style={styles.weekDay}>
                  <ThemedText style={styles.weekDayText}>{day}</ThemedText>
                </View>
              ))}
            </View>

            {/* Grille du calendrier */}
            <View style={styles.daysGrid}>
              {calendarDays.map((day, index) => {
                const hasAnyStatus = !!day.cleaning;
                const isPending = day.cleaning?.status === 'pending';
                const isDone = day.cleaning?.status === 'done';

                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.dayCell,
                      !day.isCurrentMonth && styles.dayCellOutside,
                      day.isToday && styles.dayCellToday,
                    ]}
                    onPress={() => {
                      if (day.isCurrentMonth) {
                        setSelectedDay(day);
                        setModalVisible(true);
                      }
                    }}>
                    <ThemedText
                      style={[
                        styles.dayNumber,
                        !day.isCurrentMonth && styles.dayNumberOutside,
                        day.isToday && styles.dayNumberToday,
                      ]}>
                      {day.dayOfMonth}
                    </ThemedText>
                    {hasAnyStatus && (
                      <View style={[
                        styles.statusIndicator,
                        isDone && styles.statusDone,
                        isPending && styles.statusPending,
                      ]} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Légende */}
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.statusIndicator, styles.statusPending]} />
              <ThemedText style={styles.legendText}>À faire</ThemedText>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.statusIndicator, styles.statusDone]} />
              <ThemedText style={styles.legendText}>Terminé</ThemedText>
            </View>
          </View>
        </>
      )}

      {/* Modal de modification */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ThemedText style={styles.modalTitle}>
              Ménage du {selectedDay && formatFullDate(new Date(selectedDay.dateStr))}
            </ThemedText>
            
            <TouchableOpacity
              style={[styles.statusButton, styles.statusButtonPending]}
              onPress={() => selectedDay && updateCleaningStatus(selectedDay.dateStr, 'pending')}>
              <ThemedText style={styles.statusButtonText}>À faire</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.statusButton, styles.statusButtonDone]}
              onPress={() => selectedDay && updateCleaningStatus(selectedDay.dateStr, 'done')}>
              <ThemedText style={styles.statusButtonText}>Terminé</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.statusButton, styles.statusButtonDelete]}
              onPress={async () => {
                if (!selectedDay?.cleaning) return;
                const { error } = await supabase
                  .from('cleaning_schedule')
                  .delete()
                  .eq('id', selectedDay.cleaning.id);
                if (!error) {
                  setModalVisible(false);
                  await loadCleanings();
                }
              }}>
              <ThemedText style={styles.statusButtonText}>Supprimer</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setModalVisible(false)}>
              <ThemedText style={styles.cancelButtonText}>Annuler</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 16,
    paddingBottom: 100,
  },
  header: {
    gap: 6,
  },
  pickerContainer: {
    backgroundColor: '#2C2C2E',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#3A3A3C',
  },
  picker: {
    color: '#FFFFFF',
    height: 50,
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  navButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2C2C2E',
    borderRadius: 22,
  },
  navButtonText: {
    fontSize: 24,
    color: '#00D4FF',
    fontWeight: 'bold',
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'capitalize',
  },
  calendar: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 12,
    gap: 8,
  },
  weekHeader: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekDay: {
    flex: 1,
    alignItems: 'center',
  },
  weekDayText: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '600',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    padding: 4,
  },
  dayCellOutside: {
    opacity: 0.3,
  },
  dayCellToday: {
    backgroundColor: '#2C2C2E',
    borderRadius: 8,
  },
  dayNumber: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  dayNumberOutside: {
    color: '#8E8E93',
  },
  dayNumberToday: {
    fontWeight: 'bold',
    color: '#00D4FF',
  },
  statusIndicator: {
    position: 'absolute',
    bottom: 4,
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusPending: {
    backgroundColor: '#FF9F0A',
  },
  statusDone: {
    backgroundColor: '#30D158',
  },
  legend: {
    flexDirection: 'row',
    gap: 20,
    justifyContent: 'center',
    paddingVertical: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendText: {
    fontSize: 14,
    color: '#8E8E93',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#2C2C2E',
    borderRadius: 16,
    padding: 24,
    width: '85%',
    gap: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
    color: '#FFFFFF',
  },
  statusButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  statusButtonPending: {
    backgroundColor: '#FF9F0A',
  },
  statusButtonDone: {
    backgroundColor: '#30D158',
  },
  statusButtonDelete: {
    backgroundColor: '#FF453A',
  },
  statusButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  cancelButton: {
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#00D4FF',
  },
});
