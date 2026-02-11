import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  Modal,
  FlatList,
} from 'react-native';

import { ErrorBanner } from '@/components/error-banner';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/providers/auth-provider';
import { supabase } from '@/services/supabase';
import type { ShoppingList, ShoppingListItem, KmLieuFavori } from '@/types/models';

export default function ShoppingScreen() {
  const { user } = useAuth();
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [currentListId, setCurrentListId] = useState<string>('');
  const [items, setItems] = useState<ShoppingListItem[]>([]);
  const [newItemName, setNewItemName] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Modals
  const [showListModal, setShowListModal] = useState(false);
  const [showLieuModal, setShowLieuModal] = useState(false);
  
  // Lieux favoris
  const [lieux, setLieux] = useState<KmLieuFavori[]>([]);
  const [selectedLieuId, setSelectedLieuId] = useState<string>('');

  const currentList = lists.find(l => l.id === currentListId);



  const loadLists = useCallback(async () => {
    if (!supabase || !user) return;
    setRefreshing(true);
    setErrorMessage(null);

    try {
      const { data, error } = await supabase
        .from('shopping_lists')
        .select('*')
        .eq('owner_user_id', user.id)
        .eq('status', 'en_cours')
        .order('created_date', { ascending: false });

      if (error) {
        if (error.code === '42P01') {
          setErrorMessage('Tables non créées. Exécutez le script SQL dans Supabase.');
        } else {
          console.error('Erreur chargement listes:', error);
          setErrorMessage('Impossible de charger les listes.');
        }
      } else {
        setLists((data as ShoppingList[]) || []);
      }
    } catch (err) {
      console.error('Erreur chargement listes:', err);
      setErrorMessage('Erreur lors du chargement.');
    } finally {
      setRefreshing(false);
    }
  }, [user]);

  const loadLieux = useCallback(async () => {
    if (!supabase || !user) return;
    try {
      const { data, error } = await supabase
        .from('km_lieux_favoris')
        .select('*')
        .eq('owner_user_id', user.id)
        .order('nom', { ascending: true });

      if (error && error.code !== '42P01') {
        console.error('Erreur chargement lieux:', error);
      } else {
        setLieux((data as KmLieuFavori[]) || []);
      }
    } catch (err) {
      console.error('Erreur lieux:', err);
    }
  }, [user]);

  const loadItems = useCallback(async () => {
    if (!supabase || !currentListId) return;

    try {
      const { data, error } = await supabase
        .from('shopping_list_items')
        .select('*')
        .eq('list_id', currentListId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Erreur chargement items:', error);
      } else {
        setItems((data as ShoppingListItem[]) || []);
      }
    } catch (err) {
      console.error('Erreur items:', err);
    }
  }, [currentListId]);

  useEffect(() => {
    if (user) {
      void loadLists();
      void loadLieux();
    }
  }, [user]);

  useEffect(() => {
    if (currentListId) {
      void loadItems();
    } else {
      setItems([]);
    }
  }, [currentListId]);

  const addItem = async () => {
    if (!newItemName.trim() || !currentListId) return;

    try {
      const { data, error } = await supabase
        .from('shopping_list_items')
        .insert({
          list_id: currentListId,
          item_name: newItemName.trim(),
          is_checked: false,
          added_by: 'proprietaire',
        })
        .select()
        .single();

      if (error) {
        console.error('Erreur ajout item:', error);
        Alert.alert('Erreur', 'Impossible d\'ajouter l\'article.');
      } else {
        setItems([...items, data as ShoppingListItem]);
        setNewItemName('');
      }
    } catch (err) {
      console.error('❌ Erreur:', err);
    }
  };

  const toggleItem = async (itemId: string) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    try {
      const { error } = await supabase
        .from('shopping_list_items')
        .update({ is_checked: !item.is_checked })
        .eq('id', itemId);

      if (error) {
        console.error('Erreur toggle:', error);
      } else {
        setItems(items.map(i => i.id === itemId ? { ...i, is_checked: !i.is_checked } : i));
      }
    } catch (err) {
      console.error('❌ Erreur:', err);
    }
  };

  const validateList = async () => {
    if (!currentListId || !user) return;

    const currentList = lists.find(l => l.id === currentListId);
    if (!currentList) return;

    const selectedLieu = lieux.find(l => l.id === selectedLieuId);
    
    if (!selectedLieu) {
      Alert.alert('⚠️ Lieu de courses', 'Veuillez sélectionner le lieu où vous allez faire les courses.');
      return;
    }

    Alert.alert(
      'Valider les courses',
      `Confirmer les courses terminées ?\n\n📍 ${selectedLieu.nom}\n🚗 ${selectedLieu.distance_km * 2} km (aller-retour)`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Valider',
          onPress: async () => {
            try {
              // 1. Archiver la liste
              const { error: listError } = await supabase
                .from('shopping_lists')
                .update({
                  status: 'validé',
                  validated_at: new Date().toISOString(),
                })
                .eq('id', currentList.id);

              if (listError) throw listError;

              // 2. Ajouter le trajet kilométrique
              const today = new Date();
              const trajet = {
                owner_user_id: user.id,
                annee_fiscale: today.getFullYear(),
                date_trajet: today.toISOString().split('T')[0],
                type_trajet: 'courses',
                motif: `Courses - ${currentList.name}`,
                lieu_depart: 'Domicile',
                lieu_arrivee: selectedLieu.nom,
                gite_id: null,
                distance_aller: selectedLieu.distance_km,
                aller_retour: true,
                distance_totale: selectedLieu.distance_km * 2,
                reservation_id: null,
                auto_genere: false,
                notes: `Liste: ${currentList.name}`,
              };

              const { error: trajetError } = await supabase
                .from('km_trajets')
                .insert(trajet);

              if (trajetError && trajetError.code !== '42P01') {
                console.error('Erreur insertion km:', trajetError);
              }

              // 3. Rafraîchir et notifier
              await loadLists();
              setCurrentListId('');
              setItems([]);
              setSelectedLieuId('');
              
              Alert.alert(
                '✅ Courses validées !',
                `Liste archivée\n${selectedLieu.distance_km * 2} km ajoutés aux kilomètres professionnels`
              );
            } catch (err) {
              console.error('Erreur validation:', err);
              Alert.alert('Erreur', 'Impossible de valider la liste.');
            }
          },
        },
      ]
    );
  };

  const uncheckedCount = items.filter(i => !i.is_checked).length;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ThemedText style={styles.backText}>← Retour</ThemedText>
        </TouchableOpacity>
        <ThemedText type="title" style={styles.title}>
          🛒 Courses
        </ThemedText>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadLists} />}>
        {errorMessage ? <ErrorBanner message={errorMessage} /> : null}

        {lists.length === 0 ? (
          <ThemedView style={styles.emptyState}>
            <ThemedText style={styles.emptyText}>
              Aucune liste de courses active.
            </ThemedText>
            <ThemedText style={styles.emptyTextSub}>
              Créez-en une sur le dashboard web.
            </ThemedText>
          </ThemedView>
        ) : (
          <>
            {/* Sélecteur de liste - Style bouton */}
            <ThemedView style={styles.card}>
              <ThemedText style={styles.label}>📋 Liste de courses ({lists.length} disponible(s))</ThemedText>
              <TouchableOpacity 
                style={styles.selectButton}
                onPress={() => setShowListModal(true)}>
                <ThemedText style={styles.selectButtonText}>
                  {currentListId 
                    ? lists.find(l => l.id === currentListId)?.name || 'Choisir une liste'
                    : '-- Choisir une liste --'}
                </ThemedText>
                <ThemedText style={styles.selectButtonIcon}>▼</ThemedText>
              </TouchableOpacity>
            </ThemedView>

            {/* Sélecteur de lieu - Style bouton */}
            <ThemedView style={styles.card}>
              <ThemedText style={styles.label}>📍 Lieu de courses ({lieux.length} disponible(s))</ThemedText>
              <TouchableOpacity 
                style={styles.selectButton}
                onPress={() => setShowLieuModal(true)}>
                <ThemedText style={styles.selectButtonText}>
                  {selectedLieuId 
                    ? lieux.find(l => l.id === selectedLieuId)?.nom || 'Sélectionner un magasin'
                    : '-- Sélectionner un magasin --'}
                </ThemedText>
                <ThemedText style={styles.selectButtonIcon}>▼</ThemedText>
              </TouchableOpacity>
              {selectedLieuId && (
                <View style={styles.kmInfo}>
                  <ThemedText style={styles.kmText}>
                    🚗 Trajet: {lieux.find(l => l.id === selectedLieuId)?.distance_km! * 2} km (aller-retour)
                  </ThemedText>
                </View>
              )}
            </ThemedView>

            {/* Liste des articles */}
            {currentListId && (
              <ThemedView style={styles.card}>
                <View style={styles.cardHeader}>
                  <ThemedText style={styles.label}>
                    Articles ({uncheckedCount} restants)
                  </ThemedText>
                </View>

                <View style={styles.inputRow}>
                  <TextInput
                    style={styles.input}
                    placeholder="Nouvel article..."
                    placeholderTextColor="#999"
                    value={newItemName}
                    onChangeText={setNewItemName}
                    onSubmitEditing={addItem}
                    returnKeyType="done"
                  />
                  <TouchableOpacity onPress={addItem} style={styles.addButton}>
                    <ThemedText style={styles.addButtonText}>+</ThemedText>
                  </TouchableOpacity>
                </View>

                {items.length === 0 ? (
                  <ThemedText style={styles.emptyItems}>
                    Aucun article
                  </ThemedText>
                ) : (
                  <View style={styles.itemsList}>
                    {items.map(item => (
                      <TouchableOpacity
                        key={item.id}
                        style={[
                          styles.item,
                          item.is_checked && styles.itemChecked
                        ]}
                        onPress={() => toggleItem(item.id)}>
                        <View style={[
                          styles.checkbox,
                          item.is_checked && styles.checkboxChecked
                        ]}>
                          {item.is_checked && (
                            <ThemedText style={styles.checkmark}>✓</ThemedText>
                          )}
                        </View>
                        <ThemedText style={[
                          styles.itemText,
                          item.is_checked && styles.itemTextChecked
                        ]}>
                          {item.item_name}
                        </ThemedText>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {items.length > 0 && (
                  <TouchableOpacity
                    onPress={validateList}
                    style={styles.validateButton}>
                    <ThemedText style={styles.validateButtonText}>
                      ✓ Valider les courses
                    </ThemedText>
                  </TouchableOpacity>
                )}
              </ThemedView>
            )}
          </>
        )}
      </ScrollView>

      {/* Modal de sélection de liste */}
      <Modal
        visible={showListModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowListModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>📋 Choisir une liste</ThemedText>
              <TouchableOpacity onPress={() => setShowListModal(false)}>
                <ThemedText style={styles.modalClose}>✕</ThemedText>
              </TouchableOpacity>
            </View>
            <FlatList
              data={lists}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.modalItem,
                    currentListId === item.id && styles.modalItemSelected
                  ]}
                  onPress={() => {
                    setCurrentListId(item.id);
                    setShowListModal(false);
                  }}>
                  <ThemedText style={[
                    styles.modalItemText,
                    currentListId === item.id && styles.modalItemTextSelected
                  ]}>
                    {item.name}
                  </ThemedText>
                  <ThemedText style={styles.modalItemDate}>
                    {new Date(item.created_date).toLocaleDateString('fr-FR')}
                  </ThemedText>
                  {currentListId === item.id && (
                    <ThemedText style={styles.modalItemCheck}>✓</ThemedText>
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Modal de sélection de lieu */}
      <Modal
        visible={showLieuModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowLieuModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>📍 Choisir un magasin</ThemedText>
              <TouchableOpacity onPress={() => setShowLieuModal(false)}>
                <ThemedText style={styles.modalClose}>✕</ThemedText>
              </TouchableOpacity>
            </View>
            <FlatList
              data={lieux}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.modalItem,
                    selectedLieuId === item.id && styles.modalItemSelected
                  ]}
                  onPress={() => {
                    setSelectedLieuId(item.id);
                    setShowLieuModal(false);
                  }}>
                  <ThemedText style={[
                    styles.modalItemText,
                    selectedLieuId === item.id && styles.modalItemTextSelected
                  ]}>
                    {item.nom}
                  </ThemedText>
                  <ThemedText style={styles.modalItemDistance}>
                    {item.distance_km} km (↔ {item.distance_km * 2} km)
                  </ThemedText>
                  {selectedLieuId === item.id && (
                    <ThemedText style={styles.modalItemCheck}>✓</ThemedText>
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#00C2CB',
  },
  backButton: {
    marginBottom: 12,
  },
  backText: {
    color: 'white',
    fontSize: 16,
  },
  title: {
    color: 'white',
    fontSize: 28,
    fontWeight: 'bold',
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  card: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  selectButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#00C2CB',
    borderRadius: 12,
    minHeight: 56,
  },
  selectButtonText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  selectButtonIcon: {
    fontSize: 16,
    color: '#00C2CB',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  kmInfo: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#e8f5e9',
    borderRadius: 8,
  },
  kmText: {
    fontSize: 14,
    color: '#2e7d32',
    fontWeight: '600',
  },
  cardHeader: {
    marginBottom: 12,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  input: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    fontSize: 15,
    backgroundColor: '#f9f9f9',
  },
  addButton: {
    width: 50,
    height: 50,
    backgroundColor: '#00C2CB',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  itemsList: {
    gap: 10,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  itemChecked: {
    backgroundColor: '#f5f5f5',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#00C2CB',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#00C2CB',
  },
  checkmark: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  itemText: {
    flex: 1,
    fontSize: 15,
    color: '#333',
  },
  itemTextChecked: {
    color: '#999',
    textDecorationLine: 'line-through',
  },
  emptyItems: {
    textAlign: 'center',
    padding: 20,
    color: '#999',
  },
  validateButton: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#10b981',
    borderRadius: 10,
    alignItems: 'center',
  },
  validateButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyTextSub: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#00C2CB',
  },
  modalClose: {
    fontSize: 28,
    color: '#999',
    paddingHorizontal: 10,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalItemSelected: {
    backgroundColor: '#e6f7f8',
  },
  modalItemText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  modalItemTextSelected: {
    color: '#00C2CB',
    fontWeight: 'bold',
  },
  modalItemDate: {
    fontSize: 13,
    color: '#999',
    marginLeft: 8,
  },
  modalItemDistance: {
    fontSize: 13,
    color: '#666',
    marginLeft: 8,
  },
  modalItemCheck: {
    fontSize: 20,
    color: '#00C2CB',
    fontWeight: 'bold',
    marginLeft: 12,
  },
});
