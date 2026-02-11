import { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View, TouchableOpacity } from 'react-native';

import { ThemedText } from '@/components/themed-text';
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

type CleaningWithReservation = CleaningSchedule & {
  reservation?: {
    check_in: string;
    check_out: string;
    client_name: string;
  };
};

export default function CleaningScreen() {
  const { user } = useAuth();
  const [gites, setGites] = useState<Gite[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [currentGiteIndex, setCurrentGiteIndex] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [cleaningsByGite, setCleaningsByGite] = useState<Record<string, CleaningWithReservation[]>>({});

  const GITES_PER_PAGE = 1;

  // Charger les gîtes
  const loadGites = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('gites')
      .select('id, name, is_active, color, ordre_affichage')
      .eq('owner_user_id', user.id)
      .eq('is_active', true)
      .order('ordre_affichage', { ascending: true, nullsFirst: false })
      .order('name', { ascending: true });

    if (error) {
      console.error('Erreur chargement gîtes:', error);
      return;
    }

    setGites((data as Gite[]) || []);
  }, [user]);

  // Charger les ménages du mois pour tous les gîtes
  const loadCleanings = useCallback(async () => {
    if (!user || gites.length === 0) return;

    setRefreshing(true);

    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);

    const { data, error } = await supabase
      .from('cleaning_schedule')
      .select(`
        id, 
        gite_id, 
        scheduled_date, 
        status,
        reservation_id
      `)
      .eq('owner_user_id', user.id)
      .gte('scheduled_date', formatYYYYMMDD(start))
      .lte('scheduled_date', formatYYYYMMDD(end))
      .order('scheduled_date', { ascending: true });

    if (error) {
      console.error('Erreur chargement ménages:', error);
      setRefreshing(false);
      return;
    }

    // Récupérer les réservations liées
    const reservationIds = data
      ?.map((c: any) => c.reservation_id)
      .filter((id: any) => id != null) || [];

    let reservationsMap: Record<string, any> = {};
    if (reservationIds.length > 0) {
      const { data: reservations } = await supabase
        .from('reservations')
        .select('id, check_in, check_out, client_name')
        .in('id', reservationIds);

      if (reservations) {
        reservations.forEach((res: any) => {
          reservationsMap[res.id] = res;
        });
      }
    }

    // Grouper par gîte
    const grouped: Record<string, CleaningWithReservation[]> = {};
    gites.forEach(gite => {
      grouped[gite.id] = [];
    });

    if (data) {
      data.forEach((cleaning: any) => {
        if (cleaning.gite_id && grouped[cleaning.gite_id]) {
          grouped[cleaning.gite_id].push({
            ...cleaning,
            reservation: cleaning.reservation_id ? reservationsMap[cleaning.reservation_id] : undefined
          });
        }
      });
    }

    setCleaningsByGite(grouped);
    setRefreshing(false);
  }, [user, gites, currentMonth]);

  useEffect(() => {
    void loadGites();
  }, [loadGites]);

  useEffect(() => {
    if (gites.length > 0) {
      void loadCleanings();
    }
  }, [loadCleanings, gites, currentMonth]);

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'validated':
        return '#30D158';
      case 'pending':
        return '#FF9F0A';
      case 'refused':
        return '#FF453A';
      default:
        return '#8E8E93';
    }
  };

  const getStatusLabel = (status: string | null) => {
    switch (status) {
      case 'validated':
        return 'Validé';
      case 'pending':
        return 'En attente';
      case 'refused':
        return 'Refusé';
      default:
        return 'Non défini';
    }
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadCleanings} />}>
      
      <View style={styles.header}>
        <ThemedText type="title">Ménage</ThemedText>
        
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
      </View>

      {/* Navigation pagination gîtes */}
      <View style={styles.paginationNav}>
        <TouchableOpacity
          style={[styles.paginationButton, currentGiteIndex === 0 && styles.paginationButtonDisabled]}
          onPress={() => setCurrentGiteIndex(Math.max(0, currentGiteIndex - GITES_PER_PAGE))}
          disabled={currentGiteIndex === 0}>
          <ThemedText style={[styles.paginationButtonText, currentGiteIndex === 0 && styles.paginationButtonTextDisabled]}>
            ‹ Précédent
          </ThemedText>
        </TouchableOpacity>

        <ThemedText style={styles.paginationInfo}>
          Gîte {currentGiteIndex + 1} sur {gites.length}
        </ThemedText>

        <TouchableOpacity
          style={[styles.paginationButton, currentGiteIndex + GITES_PER_PAGE >= gites.length && styles.paginationButtonDisabled]}
          onPress={() => setCurrentGiteIndex(Math.min(gites.length - GITES_PER_PAGE, currentGiteIndex + GITES_PER_PAGE))}
          disabled={currentGiteIndex + GITES_PER_PAGE >= gites.length}>
          <ThemedText style={[styles.paginationButtonText, currentGiteIndex + GITES_PER_PAGE >= gites.length && styles.paginationButtonTextDisabled]}>
            Suivant ›
          </ThemedText>
        </TouchableOpacity>
      </View>

      {/* Colonnes par gîte (2 max) */}
      <View style={styles.gitesContainer}>
        {gites.slice(currentGiteIndex, currentGiteIndex + GITES_PER_PAGE).map((gite) => {
          const cleanings = cleaningsByGite[gite.id] || [];
          const giteColor = gite.color || '#667eea';

          return (
            <View key={gite.id} style={styles.giteColumn}>
              {/* Header gîte */}
              <View style={[styles.giteHeader, { backgroundColor: giteColor }]}>
                <ThemedText style={styles.giteHeaderTitle}>{gite.name}</ThemedText>
                <ThemedText style={styles.giteHeaderSubtitle}>
                  {cleanings.length} ménage{cleanings.length !== 1 ? 's' : ''}
                </ThemedText>
              </View>

              {/* Liste des ménages avec scroll vertical */}
              <ScrollView 
                style={styles.giteBodyScroll}
                contentContainerStyle={styles.giteBody}
                showsVerticalScrollIndicator={true}>
                {cleanings.length === 0 ? (
                  <View style={styles.emptyState}>
                    <ThemedText style={styles.emptyText}>Aucun ménage prévu</ThemedText>
                  </View>
                ) : (
                  cleanings.map((cleaning) => (
                    <View 
                      key={cleaning.id} 
                      style={[
                        styles.cleaningCard,
                        { borderLeftColor: getStatusColor(cleaning.status) }
                      ]}>
                      {/* Date du ménage */}
                      <View style={styles.cleaningCardHeader}>
                        <ThemedText style={styles.cleaningDate}>
                          📅 {cleaning.scheduled_date ? formatFullDate(new Date(cleaning.scheduled_date)) : 'Date inconnue'}
                        </ThemedText>
                        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(cleaning.status) }]}>
                          <ThemedText style={styles.statusBadgeText}>
                            {getStatusLabel(cleaning.status)}
                          </ThemedText>
                        </View>
                      </View>

                      {/* Infos réservation */}
                      {cleaning.reservation && (
                        <View style={styles.reservationInfo}>
                          {cleaning.reservation.check_out && (
                            <ThemedText style={styles.reservationText}>
                              🏠 Départ: {formatFullDate(new Date(cleaning.reservation.check_out))}
                            </ThemedText>
                          )}
                          {cleaning.reservation.check_in && (
                            <ThemedText style={styles.reservationText}>
                              👤 Arrivée: {formatFullDate(new Date(cleaning.reservation.check_in))}
                            </ThemedText>
                          )}
                          {cleaning.reservation.client_name && (
                            <ThemedText style={styles.reservationText}>
                              👥 {cleaning.reservation.client_name}
                            </ThemedText>
                          )}
                        </View>
                      )}
                    </View>
                  ))
                )}
              </ScrollView>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingTop: 60,
    gap: 16,
  },
  header: {
    gap: 12,
    marginBottom: 8,
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
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
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'capitalize',
  },
  paginationNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  paginationButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#2C2C2E',
    borderRadius: 10,
    minWidth: 100,
    alignItems: 'center',
  },
  paginationButtonDisabled: {
    backgroundColor: '#1C1C1E',
    opacity: 0.3,
  },
  paginationButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#00D4FF',
  },
  paginationButtonTextDisabled: {
    color: '#8E8E93',
  },
  paginationInfo: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
  },
  gitesContainer: {
    width: '100%',
  },
  giteColumn: {
    width: '100%',
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    overflow: 'hidden',
  },
  giteHeader: {
    padding: 16,
    alignItems: 'center',
  },
  giteHeaderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  giteHeaderSubtitle: {
    fontSize: 13,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  giteBodyScroll: {
    maxHeight: 500,
  },
  giteBody: {
    padding: 12,
    gap: 12,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: '#8E8E93',
    fontStyle: 'italic',
  },
  cleaningCard: {
    backgroundColor: '#2C2C2E',
    borderRadius: 10,
    padding: 12,
    borderLeftWidth: 4,
    gap: 8,
  },
  cleaningCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  cleaningDate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  reservationInfo: {
    gap: 6,
    marginTop: 4,
  },
  reservationText: {
    fontSize: 12,
    color: '#8E8E93',
  },
});
