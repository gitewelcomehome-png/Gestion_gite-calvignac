import { useCallback, useEffect, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
  TouchableOpacity,
  Modal,
  FlatList,
  TextInput,
  Alert,
  Platform,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/providers/auth-provider';
import { supabase } from '@/services/supabase';
import type { Reservation, Gite } from '@/types/models';

// Couleurs plateformes
const PLATFORM_COLORS: Record<string, string> = {
  Airbnb: '#FF385C',
  'Booking.com': '#003580',
  'Booking': '#003580',
  Abritel: '#0066FF',
  'Gîte de France': '#34C759',
  'Gîte de France (centrale)': '#34C759',
  'Gîtes de France': '#34C759',
  'Gîtes de France (centrale)': '#34C759',
  'Gites de France': '#34C759',
  'Gites de France (centrale)': '#34C759',
  Autre: '#8E8E93',
};

type CalendarDay = {
  date: Date;
  dateStr: string;
  dayOfMonth: number;
  isToday: boolean;
  isCurrentMonth: boolean;
  price?: number;
  isPromo?: boolean;
  originalPrice?: number;
  promoType?: string;
};

type ReservationBand = {
  reservation: Reservation;
  startDay: number;
  endDay: number;
  weekIndex: number;
  color: string;
};

const DAYS_OF_WEEK = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

// Helpers
const startOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1);
const endOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0);
const addMonths = (date: Date, months: number) => {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
};
const format = (date: Date, fmt: string) => {
  if (fmt === 'yyyy-MM-dd') {
    return date.toISOString().split('T')[0];
  }
  if (fmt === 'MMMM yyyy') {
    const months = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
  }
  return date.toLocaleDateString();
};
const parseISO = (dateStr: string) => new Date(dateStr);
const isSameDay = (d1: Date, d2: Date) => 
  d1.getDate() === d2.getDate() && 
  d1.getMonth() === d2.getMonth() && 
  d1.getFullYear() === d2.getFullYear();

export default function CalendarScreen() {
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [gites, setGites] = useState<Gite[]>([]);
  const [selectedGite, setSelectedGite] = useState<Gite | null>(null);
  const [showGiteModal, setShowGiteModal] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [showPromoDebug, setShowPromoDebug] = useState(true); // Debug promotions
  const [priceInput, setPriceInput] = useState('');

  // Charger les gîtes
  const loadGites = useCallback(async () => {
    if (!supabase || !user) return;

    const { data, error } = await supabase
      .from('gites')
      .select('id, name, is_active, tarifs_calendrier, regles_tarifs, ordre_affichage')
      .eq('owner_user_id', user.id)
      .eq('is_active', true)
      .order('ordre_affichage', { ascending: true, nullsFirst: false })
      .order('name', { ascending: true });

    if (error) {
      console.error('Erreur chargement gîtes:', error);
      return;
    }

    console.log('📊 [GITES] Gîtes chargés:', data?.length);
    setGites((data as Gite[]) || []);
    if (data && data.length > 0 && !selectedGite) {
      setSelectedGite(data[0] as Gite);
    }
  }, [user, selectedGite]);

  // Charger les réservations
  const loadReservations = useCallback(async () => {
    if (!supabase || !user || !selectedGite) return;

    const startDate = startOfMonth(addMonths(currentMonth, -1));
    const endDate = endOfMonth(addMonths(currentMonth, 1));

    const { data, error } = await supabase
      .from('reservations')
      .select('*')
      .eq('owner_user_id', user.id)
      .eq('gite_id', selectedGite.id)
      .gte('check_in', format(startDate, 'yyyy-MM-dd'))
      .lte('check_in', format(endDate, 'yyyy-MM-dd'))
      .order('check_in');

    if (error) {
      console.error('Erreur chargement réservations:', error);
      return;
    }

    // Convertir Direct en Gîte de France
    const updated = (data as Reservation[]).map((r) => ({
      ...r,
      platform: r.platform === 'Direct' ? 'Gîte de France' : r.platform,
    }));

    setReservations(updated);
  }, [user, selectedGite, currentMonth]);

  // Générer le calendrier
  const generateCalendar = useCallback(() => {
    if (!selectedGite) return;
    
    // Conversion du format array vers object si nécessaire
    let tarifsObject: Record<string, number | { prix: number; promo?: boolean; prixOriginal?: number; promoType?: string }> = {};
    
    if (Array.isArray(selectedGite.tarifs_calendrier)) {
      selectedGite.tarifs_calendrier.forEach((item: any) => {
        if (item.date && item.prix_nuit !== undefined) {
          tarifsObject[item.date] = item.prix_nuit;
        }
      });
    } else if (selectedGite.tarifs_calendrier && typeof selectedGite.tarifs_calendrier === 'object') {
      tarifsObject = selectedGite.tarifs_calendrier;
    }
    
    // Fonction pour appliquer les promotions automatiques
    const applyAutoPromos = (dateStr: string, prixBase: number) => {
      const promos = selectedGite.regles_tarifs?.promotions;
      if (!promos) {
        return { prix: prixBase, promo: false, prixOriginal: undefined, promoType: undefined };
      }
      
      const dateObj = new Date(dateStr + 'T12:00:00');
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      dateObj.setHours(0, 0, 0, 0);
      const joursAvant = Math.ceil((dateObj.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      // Last Minute (priorité haute)
      if (promos.last_minute?.actif && joursAvant >= 0 && joursAvant <= promos.last_minute.jours_avant) {
        const reduction = prixBase * (promos.last_minute.pourcentage / 100);
        return {
          prix: prixBase - reduction,
          promo: true,
          prixOriginal: prixBase,
          promoType: `Last -${promos.last_minute.pourcentage}%`
        };
      }
      
      // Early Booking
      if (promos.early_booking?.actif && joursAvant >= promos.early_booking.jours_avant) {
        const reduction = prixBase * (promos.early_booking.pourcentage / 100);
        return {
          prix: prixBase - reduction,
          promo: true,
          prixOriginal: prixBase,
          promoType: `Early -${promos.early_booking.pourcentage}%`
        };
      }
      
      return { prix: prixBase, promo: false, prixOriginal: undefined, promoType: undefined };
    };

    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const today = new Date();
    const days: CalendarDay[] = [];

    // Jours avant le mois (pour aligner)
    const startWeekday = start.getDay();
    const daysToAdd = startWeekday === 0 ? 6 : startWeekday - 1;

    for (let i = daysToAdd; i > 0; i--) {
      const date = new Date(start);
      date.setDate(date.getDate() - i);
      days.push({
        date,
        dateStr: format(date, 'yyyy-MM-dd'),
        dayOfMonth: date.getDate(),
        isToday: false,
        isCurrentMonth: false,
      });
    }

    // Jours du mois
    const daysInMonth = end.getDate();
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      const dateStr = format(date, 'yyyy-MM-dd');
      const tarifData = tarifsObject[dateStr];
      
      let price: number | undefined;
      let isPromo = false;
      let originalPrice: number | undefined;
      let promoType: string | undefined;
      
      // Traitement selon le format
      if (typeof tarifData === 'number') {
        // Prix simple : appliquer les promos automatiques
        const promoResult = applyAutoPromos(dateStr, tarifData);
        price = promoResult.prix;
        isPromo = promoResult.promo;
        originalPrice = promoResult.prixOriginal;
        promoType = promoResult.promoType;
      } else if (tarifData && typeof tarifData === 'object') {
        // Promo manuelle déjà définie
        price = tarifData.prix;
        isPromo = tarifData.promo || false;
        originalPrice = tarifData.prixOriginal;
        promoType = (tarifData as any).promoType;
      } else if (selectedGite.regles_tarifs?.prix_base) {
        // Pas de tarif : utiliser prix_base avec promos
        const promoResult = applyAutoPromos(dateStr, selectedGite.regles_tarifs.prix_base);
        price = promoResult.prix;
        isPromo = promoResult.promo;
        originalPrice = promoResult.prixOriginal;
        promoType = promoResult.promoType;
      }

      days.push({
        date,
        dateStr,
        dayOfMonth: day,
        isToday: isSameDay(date, today),
        isCurrentMonth: true,
        price,
        isPromo,
        originalPrice,
        promoType,
      } as CalendarDay);
    }

    // Jours après le mois
    const endWeekday = end.getDay();
    const daysAfter = endWeekday === 0 ? 0 : 7 - endWeekday;
    for (let i = 1; i <= daysAfter; i++) {
      const date = new Date(end);
      date.setDate(date.getDate() + i);
      days.push({
        date,
        dateStr: format(date, 'yyyy-MM-dd'),
        dayOfMonth: date.getDate(),
        isToday: false,
        isCurrentMonth: false,
      });
    }

    setCalendarDays(days);
  }, [selectedGite, currentMonth]);

  useEffect(() => {
    void loadGites();
  }, [loadGites]);

  useEffect(() => {
    if (selectedGite) {
      void loadReservations();
    }
  }, [selectedGite, currentMonth, loadReservations]);

  useEffect(() => {
    generateCalendar();
  }, [generateCalendar]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadGites();
    await loadReservations();
    setRefreshing(false);
  };

  const handleDayPress = (day: CalendarDay) => {
    if (!day.isCurrentMonth) return;

    // Check si réservé
    const reserved = reservations.some((r) => {
      if (!r.check_in || !r.check_out) return false;
      const checkIn = parseISO(r.check_in);
      const checkOut = parseISO(r.check_out);
      return day.date >= checkIn && day.date < checkOut;
    });

    if (reserved) {
      const res = reservations.find((r) => {
        if (!r.check_in || !r.check_out) return false;
        const checkIn = parseISO(r.check_in);
        const checkOut = parseISO(r.check_out);
        return day.date >= checkIn && day.date < checkOut;
      });
      if (res) {
        Alert.alert(
          res.platform || 'Réservation',
          `${res.client_name}\n${res.check_in} → ${res.check_out}\n${res.total_price}€`
        );
      }
      return;
    }

    // Toggle sélection
    const idx = selectedDays.indexOf(day.dateStr);
    if (idx >= 0) {
      setSelectedDays(selectedDays.filter((d) => d !== day.dateStr));
    } else {
      setSelectedDays([...selectedDays, day.dateStr]);
    }
  };

  const saveSelectedPrices = async () => {
    if (!supabase || !selectedGite || selectedDays.length === 0 || !priceInput) return;

    const price = parseFloat(priceInput);
    if (isNaN(price) || price < 0) {
      Alert.alert('Erreur', 'Prix invalide');
      return;
    }

    // 🔧 Conversion en object si nécessaire
    let currentPrices: Record<string, number | { prix: number; promo?: boolean; prixOriginal?: number }> = {};
    
    if (Array.isArray(selectedGite.tarifs_calendrier)) {
      selectedGite.tarifs_calendrier.forEach((item) => {
        if (item.date && item.prix_nuit !== undefined) {
          currentPrices[item.date] = item.prix_nuit;
        }
      });
    } else if (selectedGite.tarifs_calendrier && typeof selectedGite.tarifs_calendrier === 'object') {
      currentPrices = { ...selectedGite.tarifs_calendrier };
    }

    selectedDays.forEach((d) => {
      currentPrices[d] = price;
    });

    const { error } = await supabase
      .from('gites')
      .update({ tarifs_calendrier: currentPrices, updated_at: new Date().toISOString() })
      .eq('id', selectedGite.id);

    if (error) {
      Alert.alert('Erreur', 'Impossible de sauvegarder');
      return;
    }

    setSelectedGite({ ...selectedGite, tarifs_calendrier: currentPrices });
    setShowPriceModal(false);
    setPriceInput('');
    setSelectedDays([]);
    Alert.alert('✓', `Prix de ${price}€ appliqué à ${selectedDays.length} jour(s)`);
  };

  const calculateSimulation = () => {
    if (!selectedGite || selectedDays.length === 0) {
      Alert.alert('Info', 'Sélectionnez des jours');
      return;
    }

    // 🔧 Conversion en object si nécessaire
    let tarifsObject: Record<string, number | { prix: number; promo?: boolean; prixOriginal?: number }> = {};
    
    if (Array.isArray(selectedGite.tarifs_calendrier)) {
      selectedGite.tarifs_calendrier.forEach((item) => {
        if (item.date && item.prix_nuit !== undefined) {
          tarifsObject[item.date] = item.prix_nuit;
        }
      });
    } else if (selectedGite.tarifs_calendrier && typeof selectedGite.tarifs_calendrier === 'object') {
      tarifsObject = selectedGite.tarifs_calendrier;
    }

    const sorted = selectedDays.map((d) => parseISO(d)).sort((a, b) => a.getTime() - b.getTime());
    let total = 0;
    sorted.forEach((date) => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const tarifData = tarifsObject[dateStr];
      
      let price = 0;
      if (typeof tarifData === 'number') {
        price = tarifData;
      } else if (tarifData && typeof tarifData === 'object') {
        price = tarifData.prix;
      } else {
        price = selectedGite.regles_tarifs?.prix_base || 0;
      }
      
      total += price;
    });

    const avg = total / sorted.length;
    Alert.alert(
      '💰 Simulation',
      `${sorted.length} nuits\nTotal : ${total.toFixed(2)} €\nMoyenne : ${avg.toFixed(2)} €/nuit`
    );
  };

  // Organiser le calendrier en semaines
  const weeks: CalendarDay[][] = [];
  for (let i = 0; i < calendarDays.length; i += 7) {
    weeks.push(calendarDays.slice(i, i + 7));
  }

  // Calculer les bandes de réservation pour chaque semaine
  const getReservationBands = (weekIndex: number): ReservationBand[] => {
    const week = weeks[weekIndex];
    if (!week) return [];

    const bands: ReservationBand[] = [];

    reservations.forEach((res) => {
      if (!res.check_in || !res.check_out) return;

      const checkIn = parseISO(res.check_in);
      const checkOut = parseISO(res.check_out);

      // Trouver les jours de cette semaine qui sont dans la réservation
      let startDay = -1;
      let endDay = -1;

      week.forEach((day, idx) => {
        if (day.date >= checkIn && day.date < checkOut) {
          if (startDay === -1) startDay = idx;
          endDay = idx;
        }
      });

      if (startDay >= 0) {
        bands.push({
          reservation: res,
          startDay,
          endDay,
          weekIndex,
          color: PLATFORM_COLORS[res.platform || 'Autre'] || '#8E8E93',
        });
      }
    });

    return bands;
  };

  const renderWeek = (week: CalendarDay[], weekIndex: number) => {
    const bands = getReservationBands(weekIndex);

    return (
      <View key={weekIndex} style={styles.weekContainer}>
        {/* Jours de la semaine */}
        <View style={styles.weekRow}>
          {week.map((day) => {
            const isReserved = reservations.some((r) => {
              if (!r.check_in || !r.check_out) return false;
              const checkIn = parseISO(r.check_in);
              const checkOut = parseISO(r.check_out);
              return day.date >= checkIn && day.date < checkOut;
            });
            const isSelected = selectedDays.includes(day.dateStr);

            return (
              <TouchableOpacity
                key={day.dateStr}
                style={[
                  styles.dayCell,
                  day.isToday && styles.dayCellToday,
                  isSelected && styles.dayCellSelected,
                  isReserved && styles.dayCellReserved,
                ]}
                onPress={() => handleDayPress(day)}
                disabled={!day.isCurrentMonth}>
                <ThemedText
                  style={[
                    styles.dayNumber,
                    !day.isCurrentMonth && styles.dayNumberFaded,
                    isReserved && styles.dayNumberHidden,
                  ]}>
                  {day.dayOfMonth}
                </ThemedText>
                {day.isCurrentMonth && day.price && !isReserved && (
                  <View style={styles.priceContainer}>
                    <ThemedText 
                      style={[
                        styles.dayPrice,
                        day.isPromo && styles.dayPricePromo
                      ]}>
                      {Math.round(day.price)}€
                    </ThemedText>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Bandes de réservation */}
        {bands.map((band, idx) => {
          const width = ((band.endDay - band.startDay + 1) / 7) * 100;
          const left = (band.startDay / 7) * 100;

          return (
            <View
              key={idx}
              style={[
                styles.reservationBand,
                {
                  backgroundColor: band.color,
                  width: `${width}%`,
                  left: `${left}%`,
                },
              ]}>
              <ThemedText style={styles.bandText} numberOfLines={1}>
                {band.reservation.platform || 'Réservation'}
              </ThemedText>
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}>
        {/* Header */}
        <View style={styles.header}>
          <ThemedText type="title">Calendrier</ThemedText>
          <ThemedText style={styles.subtitle}>Tarifs et réservations</ThemedText>
        </View>

        {/* Sélection gîte */}
        <TouchableOpacity style={styles.giteButton} onPress={() => setShowGiteModal(true)}>
          <ThemedText style={styles.giteButtonText}>
            {selectedGite?.name || 'Sélectionner un gîte'}
          </ThemedText>
          <ThemedText style={styles.giteButtonArrow}>›</ThemedText>
        </TouchableOpacity>

        {selectedGite && (
          <>
            {/* Navigation mois */}
            <View style={styles.monthNav}>
              <TouchableOpacity
                style={styles.navButton}
                onPress={() => setCurrentMonth(addMonths(currentMonth, -1))}>
                <ThemedText style={styles.navButtonText}>‹</ThemedText>
              </TouchableOpacity>
              <ThemedText style={styles.monthTitle}>{format(currentMonth, 'MMMM yyyy')}</ThemedText>
              <TouchableOpacity
                style={styles.navButton}
                onPress={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                <ThemedText style={styles.navButtonText}>›</ThemedText>
              </TouchableOpacity>
            </View>

            {/* En-têtes jours */}
            <View style={styles.weekDaysHeader}>
              {DAYS_OF_WEEK.map((day, idx) => (
                <View key={idx} style={styles.weekDayCell}>
                  <ThemedText style={styles.weekDayText}>{day}</ThemedText>
                </View>
              ))}
            </View>

            {/* Calendrier */}
            <View style={styles.calendar}>
              {weeks.map((week, idx) => renderWeek(week, idx))}
            </View>

            {/* Message si pas de tarifs */}
            {selectedGite && (!selectedGite.tarifs_calendrier || Object.keys(selectedGite.tarifs_calendrier).length === 0) && (
              <View style={styles.noDataBanner}>
                <ThemedText style={styles.noDataText}>
                  ⚠️ Aucun tarif chargé pour ce gîte
                </ThemedText>
                <ThemedText style={styles.noDataSubtext}>
                  Importez vos tarifs depuis la page web de gestion
                </ThemedText>
              </View>
            )}

            {/* Actions multi-sélection */}
            {selectedDays.length > 0 && (
              <View style={styles.toolbar}>
                <ThemedText style={styles.toolbarText}>
                  {selectedDays.length} jour(s)
                </ThemedText>
                <View style={styles.toolbarButtons}>
                  <TouchableOpacity
                    style={[styles.toolbarButton, styles.toolbarButtonClear]}
                    onPress={() => setSelectedDays([])}>
                    <ThemedText style={styles.toolbarButtonText}>Annuler</ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.toolbarButton, styles.toolbarButtonAction]}
                    onPress={calculateSimulation}>
                    <ThemedText style={styles.toolbarButtonText}>💰</ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.toolbarButton, styles.toolbarButtonAction]}
                    onPress={() => setShowPriceModal(true)}>
                    <ThemedText style={styles.toolbarButtonText}>Prix</ThemedText>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Modal Gîte */}
      <Modal visible={showGiteModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ThemedText style={styles.modalTitle}>Sélectionner un gîte</ThemedText>
            <FlatList
              data={gites}
              keyExtractor={(i) => i.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.modalItem, selectedGite?.id === item.id && styles.modalItemSelected]}
                  onPress={() => {
                    setSelectedGite(item);
                    setShowGiteModal(false);
                    setSelectedDays([]);
                  }}>
                  <ThemedText style={[styles.modalItemText, selectedGite?.id === item.id && styles.modalItemTextSelected]}>
                    {item.name}
                  </ThemedText>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity style={styles.modalClose} onPress={() => setShowGiteModal(false)}>
              <ThemedText style={styles.modalCloseText}>Fermer</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal Prix */}
      <Modal visible={showPriceModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ThemedText style={styles.modalTitle}>Modifier le tarif</ThemedText>
            <TextInput
              style={styles.input}
              value={priceInput}
              onChangeText={setPriceInput}
              keyboardType="numeric"
              placeholder="Prix (€)"
              placeholderTextColor="#8E8E93"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => {
                  setShowPriceModal(false);
                  setPriceInput('');
                }}>
                <ThemedText style={styles.modalButtonText}>Annuler</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSave]}
                onPress={saveSelectedPrices}>
                <ThemedText style={[styles.modalButtonText, styles.modalButtonTextSave]}>
                  Enregistrer
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingTop: 60,
    gap: 16,
  },
  header: {
    gap: 4,
  },
  subtitle: {
    opacity: 0.6,
    fontSize: 14,
  },
  giteButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  giteButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  giteButtonArrow: {
    color: '#FFF',
    fontSize: 20,
  },
  monthNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  navButton: {
    padding: 8,
  },
  navButtonText: {
    fontSize: 28,
    color: '#007AFF',
  },
  monthTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  weekDaysHeader: {
    flexDirection: 'row',
    paddingBottom: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: '#C6C6C8',
  },
  weekDayCell: {
    flex: 1,
    alignItems: 'center',
  },
  weekDayText: {
    fontSize: 11,
    fontWeight: '600',
    opacity: 0.5,
    textTransform: 'uppercase',
  },
  calendar: {
    gap: 8,
    backgroundColor: '#1C1C1E',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2C2C2E',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  weekContainer: {
    position: 'relative',
    minHeight: 50,
    marginBottom: 4,
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  dayCell: {
    flex: 1,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#2C2C2E',
    marginHorizontal: 2,
  },
  dayCellToday: {
    backgroundColor: 'rgba(0, 122, 255, 0.2)',
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  dayCellSelected: {
    backgroundColor: 'rgba(52, 199, 89, 0.3)',
    borderWidth: 2,
    borderColor: '#34C759',
  },
  dayCellReserved: {
    opacity: 0,
  },
  dayNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  dayNumberFaded: {
    opacity: 0.3,
  },
  dayNumberHidden: {
    opacity: 0,
  },
  priceContainer: {
    alignItems: 'center',
    marginTop: 2,
    padding: 2,
  },
  dayPrice: {
    fontSize: 11,
    fontWeight: '700',
    color: '#00D4FF',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  dayPricePromo: {
    color: '#FF453A',
    fontSize: 12,
    fontWeight: '800',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  reservationBand: {
    position: 'absolute',
    top: 0,
    height: 48,
    borderRadius: 10,
    justifyContent: 'center',
    paddingHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 5,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  bandText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  toolbar: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toolbarText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  toolbarButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  toolbarButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  toolbarButtonClear: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  toolbarButtonAction: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  toolbarButtonText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
  },
  noDataBanner: {
    backgroundColor: '#2C2C2E',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FF9500',
    alignItems: 'center',
    gap: 4,
  },
  noDataText: {
    color: '#FF9500',
    fontSize: 14,
    fontWeight: '700',
  },
  noDataSubtext: {
    color: '#8E8E93',
    fontSize: 12,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 20,
    width: '85%',
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalItem: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#C6C6C8',
    backgroundColor: '#FFFFFF',
  },
  modalItemSelected: {
    backgroundColor: '#007AFF',
  },
  modalItemText: {
    fontSize: 16,
    color: '#000000',
  },
  modalItemTextSelected: {
    color: '#FFF',
    fontWeight: '600',
  },
  modalClose: {
    marginTop: 16,
    paddingVertical: 12,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    alignItems: 'center',
  },
  modalCloseText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#C6C6C8',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
    color: '#000',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: '#E5E5EA',
  },
  modalButtonSave: {
    backgroundColor: '#007AFF',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  modalButtonTextSave: {
    color: '#FFF',
  },
  promoDebugBanner: {
    backgroundColor: '#2C2C2E',
    margin: 10,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FF453A',
    overflow: 'hidden',
  },
  promoDebugHeader: {
    backgroundColor: '#FF453A',
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  promoDebugTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF',
  },
  promoDebugClose: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
  },
  promoDebugContent: {
    padding: 12,
  },
  promoDebugText: {
    fontSize: 12,
    color: '#8E8E93',
    marginVertical: 4,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  promoDebugActive: {
    color: '#34C759',
    fontWeight: '700',
  },
  promoDebugWarning: {
    fontSize: 12,
    color: '#FFD60A',
    marginVertical: 4,
    fontStyle: 'italic',
  },
});
