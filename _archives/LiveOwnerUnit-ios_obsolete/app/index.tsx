import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/providers/auth-provider';

export default function IndexScreen() {
  const { user, signOut } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({ reservations: 0, cleanings: 0, gites: 0 });
  const [reservations, setReservations] = useState([]);
  const [cleanings, setCleanings] = useState([]);

  const loadData = async () => {
    console.log('🔄 loadData appelé');
    console.log('🔍 Supabase client:', supabase ? 'OK' : 'NULL');
    console.log('👤 Utilisateur:', user?.id, user?.email);
    
    if (!supabase || !user) {
      console.error('❌ Pas de client Supabase ou utilisateur');
      setLoading(false);
      return;
    }

    try {
      const today = new Date().toISOString().split('T')[0];
      console.log('📅 Date du jour:', today);
      
      console.log('📊 Chargement des compteurs avec owner_user_id...');
      const [resCount, giteCount] = await Promise.all([
        supabase
          .from('reservations')
          .select('id', { count: 'exact', head: true })
          .eq('owner_user_id', user.id),
        supabase
          .from('gites')
          .select('id', { count: 'exact', head: true })
          .eq('owner_user_id', user.id)
          .eq('is_active', true),
      ]);
      
      console.log('📈 Résultats compteurs:', {
        reservations: resCount,
        gites: giteCount
      });
      
      if (resCount.error) console.error('❌ Erreur reservations count:', resCount.error);
      if (giteCount.error) console.error('❌ Erreur gites count:', giteCount.error);
      
      setStats({ 
        reservations: resCount.count || 0, 
        cleanings: 0, 
        gites: giteCount.count || 0 
      });
      console.log('✅ Stats mises à jour:', { reservations: resCount.count, gites: giteCount.count });

      console.log('🏠 Chargement des réservations avec owner_user_id...');
      const { data: resData, error: resError } = await supabase
        .from('reservations')
        .select('id, gite, client_name, check_in, check_out')
        .eq('owner_user_id', user.id)
        .gte('check_in', today)
        .order('check_in', { ascending: true })
        .limit(3);
      
      if (resError) {
        console.error('❌ Erreur chargement réservations:', resError);
      } else {
        console.log('✅ Réservations chargées:', resData?.length || 0, 'résultats');
        console.log('📋 Détails:', JSON.stringify(resData, null, 2));
      }
      
      setReservations(resData || []);
    } catch (error) {
      console.error('💥 Exception dans loadData:', error);
      alert('Erreur: ' + (error as Error).message);
    } finally {
      console.log('🏁 Fin loadData');
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { 
    if (user) {
      console.log('✅ Utilisateur connecté:', user.email);
      loadData();
    }
  }, [user]);

  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Voulez-vous vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnexion',
          style: 'destructive',
          onPress: () => signOut(),
        },
      ]
    );
  };

  if (loading) {
    return <View style={styles.container}><ActivityIndicator size="large" /></View>;
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} />}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Tableau de bord</Text>
            <Text style={styles.subtitle}>Vue d'ensemble de vos gîtes</Text>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Text style={styles.logoutText}>Déconnexion</Text>
          </TouchableOpacity>
        </View>
        {user?.email && (
          <Text style={styles.userEmail}>👤 {user.email}</Text>
        )}

        <View style={styles.kpiGrid}>
          <View style={[styles.kpiCard, { backgroundColor: '#E6F4FE' }]}>
            <Text style={[styles.kpiValue, { color: '#0a7ea4' }]}>{stats.reservations}</Text>
            <Text style={styles.kpiLabel}>Réservations</Text>
          </View>
          <View style={[styles.kpiCard, { backgroundColor: '#F3E8FF' }]}>
            <Text style={[styles.kpiValue, { color: '#7c3aed' }]}>{stats.cleanings}</Text>
            <Text style={styles.kpiLabel}>Nettoyages</Text>
          </View>
          <View style={[styles.kpiCard, { backgroundColor: '#DCFCE7' }]}>
            <Text style={[styles.kpiValue, { color: '#16a34a' }]}>{stats.gites}</Text>
            <Text style={styles.kpiLabel}>Gîtes actifs</Text>
          </View>
          <View style={[styles.kpiCard, { backgroundColor: '#FEF3C7' }]}>
            <Text style={[styles.kpiValue, { color: '#d97706' }]}>--</Text>
            <Text style={styles.kpiLabel}>Taux occup.</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🏠 Prochaines arrivées</Text>
          {reservations.length === 0 ? (
            <View style={styles.card}><Text style={styles.emptyText}>Aucune réservation à venir</Text></View>
          ) : (
            reservations.map((res) => (
              <View key={res.id} style={styles.card}>
                <View style={styles.cardRow}>
                  <Text style={styles.cardLabel}>{res.gite || 'Gîte'}</Text>
                  <Text style={styles.cardDate}>{new Date(res.check_in).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</Text>
                </View>
                <Text style={styles.cardGuest}>{res.client_name || 'Client'}</Text>
              </View>
            ))
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Statistiques</Text>
          <View style={styles.card}>
            <Text style={styles.cardGuest}>Taux d'occupation : Calcul en cours...</Text>
            <Text style={styles.cardGuest}>Revenus estimés : À venir</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#0a7ea4',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  logoutButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  logoutText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  userEmail: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: '#e6f4fe',
    color: '#0a7ea4',
    fontSize: 12,
    fontWeight: '600',
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingHorizontal: 20,
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
    color: '#11181C',
  },
  section: {
    paddingHorizontal: 20,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#11181C',
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
    color: '#11181C',
  },
  cardDate: {
    fontSize: 14,
    opacity: 0.7,
    color: '#687076',
  },
  cardGuest: {
    fontSize: 14,
    opacity: 0.7,
    color: '#687076',
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
    color: '#687076',
  },
});
