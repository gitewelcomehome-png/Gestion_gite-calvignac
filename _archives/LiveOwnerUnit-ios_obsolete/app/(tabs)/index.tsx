import { useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { supabase } from '@/services/supabase';

interface Stats {
  reservations: number;
  cleanings: number;
  gites: number;
  occupancy: string;
}

interface Reservation {
  id: string;
  gite_name: string;
  client_name: string;
  check_in: string;
  check_out: string;
}

interface Cleaning {
  id: string;
  gite_name: string;
  scheduled_time: string;
  status: string;
}

export default function DashboardScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<Stats>({ reservations: 0, cleanings: 0, gites: 0, occupancy: '--' });
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [cleanings, setCleanings] = useState<Cleaning[]>([]);

  const loadData = async () => {
    if (!supabase) return;

    try {
      const today = new Date().toISOString().split('T')[0];

      // Stats
      const [resCount, cleanCount, giteCount] = await Promise.all([
        supabase.from('reservations').select('id', { count: 'exact', head: true }),
        supabase.from('cleaning_schedule').select('id', { count: 'exact', head: true }).gte('scheduled_date', today),
        supabase.from('gites').select('id', { count: 'exact', head: true }).eq('is_active', true),
      ]);

      setStats({
        reservations: resCount.count || 0,
        cleanings: cleanCount.count || 0,
        gites: giteCount.count || 0,
        occupancy: '--',
      });

      // Prochaines réservations
      const { data: resData } = await supabase
        .from('reservations')
        .select('id, gite_name, client_name, check_in, check_out')
        .gte('check_in', today)
        .order('check_in', { ascending: true })
        .limit(3);

      setReservations(resData || []);

      // Nettoyages du jour
      const { data: cleanData } = await supabase
        .from('cleaning_schedule')
        .select('id, gite_name, scheduled_time, status')
        .eq('scheduled_date', today)
        .limit(3);

      setCleanings(cleanData || []);
    } catch (error) {
      console.error('Erreur chargement:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" />
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.header}>
          <ThemedText type="title">Tableau de bord</ThemedText>
          <ThemedText style={styles.subtitle}>Vue d'ensemble de vos gîtes</ThemedText>
        </View>

        <View style={styles.kpiGrid}>
          <View style={[styles.kpiCard, { backgroundColor: '#E6F4FE' }]}>
            <ThemedText style={[styles.kpiValue, { color: '#0a7ea4' }]}>{stats.reservations}</ThemedText>
            <ThemedText style={styles.kpiLabel}>Réservations</ThemedText>
          </View>

          <View style={[styles.kpiCard, { backgroundColor: '#F3E8FF' }]}>
            <ThemedText style={[styles.kpiValue, { color: '#7c3aed' }]}>{stats.cleanings}</ThemedText>
            <ThemedText style={styles.kpiLabel}>Nettoyages</ThemedText>
          </View>

          <View style={[styles.kpiCard, { backgroundColor: '#DCFCE7' }]}>
            <ThemedText style={[styles.kpiValue, { color: '#16a34a' }]}>{stats.gites}</ThemedText>
            <ThemedText style={styles.kpiLabel}>Gîtes actifs</ThemedText>
          </View>

          <View style={[styles.kpiCard, { backgroundColor: '#FEF3C7' }]}>
            <ThemedText style={[styles.kpiValue, { color: '#d97706' }]}>{stats.occupancy}</ThemedText>
            <ThemedText style={styles.kpiLabel}>Taux occup.</ThemedText>
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>🏠 Prochaines arrivées</ThemedText>
          {reservations.length === 0 ? (
            <View style={styles.card}>
              <ThemedText style={styles.emptyText}>Aucune réservation à venir</ThemedText>
            </View>
          ) : (
            reservations.map((res) => (
              <View key={res.id} style={styles.card}>
                <View style={styles.cardRow}>
                  <ThemedText style={styles.cardLabel}>{res.gite_name || 'Gîte'}</ThemedText>
                  <ThemedText style={styles.cardDate}>
                    {new Date(res.check_in).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                  </ThemedText>
                </View>
                <ThemedText style={styles.cardGuest}>{res.client_name || 'Client'}</ThemedText>
              </View>
            ))
          )}
        </View>

        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>✨ Nettoyages aujourd'hui</ThemedText>
          {cleanings.length === 0 ? (
            <View style={styles.card}>
              <ThemedText style={styles.emptyText}>Aucun nettoyage prévu</ThemedText>
            </View>
          ) : (
            cleanings.map((clean) => (
              <View key={clean.id} style={styles.card}>
                <View style={styles.cardRow}>
                  <ThemedText style={styles.cardLabel}>{clean.gite_name || 'Gîte'}</ThemedText>
                  <ThemedText style={[styles.badge, styles.badgePending]}>
                    {clean.status === 'completed' ? 'Fait' : 'À faire'}
                  </ThemedText>
                </View>
                <ThemedText style={styles.cardGuest}>
                  {clean.scheduled_time ? `Prévu à ${clean.scheduled_time}` : 'Heure non définie'}
                </ThemedText>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 20,
    paddingTop: 60,
    gap: 24,
  },
  header: {
    gap: 6,
  },
  subtitle: {
    opacity: 0.7,
    fontSize: 14,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  kpiCard: {
    flex: 1,
    minWidth: '45%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    gap: 4,
  },
  kpiValue: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  kpiLabel: {
    fontSize: 12,
    opacity: 0.8,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
  },
  card: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  cardDate: {
    fontSize: 14,
    opacity: 0.7,
  },
  cardGuest: {
    fontSize: 14,
    opacity: 0.7,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: '600',
  },
  badgePending: {
    backgroundColor: '#FEF3C7',
    color: '#d97706',
  },
  emptyText: {
    fontSize: 14,
    opacity: 0.6,
    textAlign: 'center',
  },
});
