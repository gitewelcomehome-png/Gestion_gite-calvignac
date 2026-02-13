import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

import { CleaningCard } from '@/components/cleaning-card';
import { EmptyState } from '@/components/empty-state';
import { ErrorBanner } from '@/components/error-banner';
import { ReservationCard } from '@/components/reservation-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/providers/auth-provider';
import { supabase } from '@/services/supabase';
import type { CleaningSchedule, Reservation } from '@/types/models';
import { endOfDay, startOfDay, startOfWeek, toIsoString } from '@/utils/dates';

export default function DashboardScreen() {
  const { user } = useAuth();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [cleanings, setCleanings] = useState<CleaningSchedule[]>([]);
  const [weeklyRevenue, setWeeklyRevenue] = useState(0);
  const [weeklyReservationsCount, setWeeklyReservationsCount] = useState(0);
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
    const todayStart = startOfDay(today);
    // Début de la semaine en cours (lundi)
    const weekStart = startOfWeek(today);
    // Fin de semaine = aujourd'hui + 7 jours
    const endWeek = new Date(today);
    endWeek.setDate(endWeek.getDate() + 7);
    const end = endOfDay(endWeek);

    const [
      reservationsResult,
      cleaningsResult,
      weeklyStatsResult,
    ] = await Promise.all([
      // Les 3 réservations en cours ou à venir (check_out >= aujourd'hui)
      supabase
        .from('reservations')
        .select('id,gite_id,gite,check_in,check_out,client_name,client_phone,client_email,status,platform,total_price,guest_count,owner_user_id')
        .eq('owner_user_id', user.id)
        .gte('check_out', toIsoString(todayStart))
        .order('check_in', { ascending: true })
        .limit(3),
      // Ménages de la semaine
      supabase
        .from('cleaning_schedule')
        .select('id,gite_id,gite,scheduled_date,status,gites(name)')
        .eq('owner_user_id', user.id)
        .gte('scheduled_date', toIsoString(todayStart))
        .lte('scheduled_date', toIsoString(end))
        .order('scheduled_date', { ascending: true }),
      // Stats de la semaine (CA + nombre depuis le début de la semaine)
      supabase
        .from('reservations')
        .select('total_price')
        .eq('owner_user_id', user.id)
        .gte('check_in', toIsoString(weekStart))
        .lte('check_in', toIsoString(end)),
    ]);

    const errors = [
      reservationsResult.error,
      cleaningsResult.error,
      weeklyStatsResult.error,
    ].filter(Boolean);

    if (errors.length > 0) {
      console.error('❌ [DASHBOARD] Erreurs détaillées:', errors);
      setErrorMessage('Impossible de charger les données du dashboard.');
    }

    // Calculer le CA de la semaine
    const weeklyData = weeklyStatsResult.data as { total_price: number }[] | null;
    if (weeklyData) {
      const revenue = weeklyData.reduce((sum, item) => sum + (item.total_price || 0), 0);
      setWeeklyRevenue(revenue);
      setWeeklyReservationsCount(weeklyData.length);
    } else {
      setWeeklyRevenue(0);
      setWeeklyReservationsCount(0);
    }

    setReservations((reservationsResult.data as Reservation[]) ?? []);
    setCleanings((cleaningsResult.data as CleaningSchedule[]) ?? []);
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
        <ThemedText type="title" style={styles.companyName}>LiveOwnerUnit</ThemedText>
        <ThemedText style={styles.subtitle}>Gestion de vos locations</ThemedText>
      </View>

      {errorMessage ? <ErrorBanner message={errorMessage} /> : null}

      {/* KPI de la semaine */}
      <View style={styles.kpiContainer}>
        <View style={styles.kpiCard}>
          <ThemedText style={styles.kpiLabel}>CA Semaine</ThemedText>
          <ThemedText style={styles.kpiValue}>{weeklyRevenue.toFixed(0)} €</ThemedText>
        </View>
        <View style={styles.kpiCard}>
          <ThemedText style={styles.kpiLabel}>Réservations</ThemedText>
          <ThemedText style={styles.kpiValue}>{weeklyReservationsCount}</ThemedText>
        </View>
      </View>

      {/* Bouton Liste d'achats */}
      <TouchableOpacity
        onPress={() => router.push('/shopping')}
        style={styles.shoppingButton}>
        <ThemedText style={styles.shoppingButtonText}>📋 Liste d'achats</ThemedText>
      </TouchableOpacity>

      <ThemedView style={styles.section}>
        <View style={styles.sectionHeader}>
          <ThemedText type="subtitle">Prochaines réservations</ThemedText>
          <ThemedText style={styles.weekLabel}>(3 prochaines)</ThemedText>
        </View>
        {reservations.length === 0 ? (
          <EmptyState message="Aucune réservation cette semaine" />
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
          <ThemedText type="subtitle">Ménages de la semaine</ThemedText>
        </View>
        {cleanings.length === 0 ? (
          <EmptyState message="Aucun ménage prévu cette semaine" />
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
    paddingTop: 60,
    gap: 20,
  },
  header: {
    gap: 6,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  companyName: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  subtitle: {
    opacity: 0.7,
    fontSize: 14,
  },
  kpiContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: '#00C2CB',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  kpiLabel: {
    fontSize: 12,
    color: '#fff',
    marginBottom: 4,
    textTransform: 'uppercase',
    fontWeight: '600',
    opacity: 0.9,
  },
  kpiValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  shoppingButton: {
    padding: 16,
    backgroundColor: '#00C2CB',
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  shoppingButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  section: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  weekLabel: {
    fontSize: 12,
    opacity: 0.5,
  },
  cardList: {
    gap: 10,
  },
});
