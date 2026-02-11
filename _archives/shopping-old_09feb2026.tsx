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
} from 'react-native';

import { EmptyState } from '@/components/empty-state';
import { ErrorBanner } from '@/components/error-banner';
import { ShoppingItemCard } from '@/components/shopping-item-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/providers/auth-provider';
import { supabase } from '@/services/supabase';
import type { ShoppingList, ShoppingListItem } from '@/types/models';

export default function ShoppingScreen() {
  const { user } = useAuth();
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [currentList, setCurrentList] = useState<ShoppingList | null>(null);
  const [items, setItems] = useState<ShoppingListItem[]>([]);
  const [newItemName, setNewItemName] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showNewListInput, setShowNewListInput] = useState(false);
  const [newListName, setNewListName] = useState('');

  const loadLists = useCallback(async () => {
    if (!supabase || !user) return;

    setRefreshing(true);
    setErrorMessage(null);

    try {
      const { data, error } = await supabase
        .from('shopping_lists')
        .select('*')
        .eq('owner_user_id', user.id)
        .order('created_date', { ascending: false });

      if (error) {
        console.error('❌ Erreur chargement listes:', error);
        setErrorMessage('Impossible de charger les listes.');
      } else {
        setLists((data as ShoppingList[]) || []);
        
        // Sélectionner la première liste en cours si aucune n'est sélectionnée
        if (!currentList && data && data.length > 0) {
          const firstActiveList = data.find(l => l.status === 'en_cours') || data[0];
          setCurrentList(firstActiveList as ShoppingList);
        }
      }
    } catch (err) {
      console.error('❌ Erreur:', err);
      setErrorMessage('Erreur lors du chargement.');
    } finally {
      setRefreshing(false);
    }
  }, [user, currentList]);

  const loadItems = useCallback(async () => {
    if (!supabase || !currentList) return;

    try {
      const { data, error } = await supabase
        .from('shopping_list_items')
        .select('*')
        .eq('list_id', currentList.id)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('❌ Erreur chargement items:', error);
      } else {
        setItems((data as ShoppingListItem[]) || []);
      }
    } catch (err) {
      console.error('❌ Erreur:', err);
    }
  }, [currentList]);

  useEffect(() => {
    void loadLists();
  }, [loadLists]);

  useEffect(() => {
    if (currentList) {
      void loadItems();
    }
  }, [currentList, loadItems]);

  const createNewList = async () => {
    if (!newListName.trim() || !user) return;

    try {
      const { data, error } = await supabase
        .from('shopping_lists')
        .insert({
          owner_user_id: user.id,
          name: newListName.trim(),
          status: 'en_cours',
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Erreur création liste:', error);
        Alert.alert('Erreur', 'Impossible de créer la liste.');
      } else {
        setLists([data as ShoppingList, ...lists]);
        setCurrentList(data as ShoppingList);
        setNewListName('');
        setShowNewListInput(false);
      }
    } catch (err) {
      console.error('❌ Erreur:', err);
    }
  };

  const addItem = async () => {
    if (!newItemName.trim() || !currentList) return;

    try {
      const { data, error } = await supabase
        .from('shopping_list_items')
        .insert({
          list_id: currentList.id,
          item_name: newItemName.trim(),
          is_checked: false,
          added_by: 'proprietaire',
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Erreur ajout item:', error);
        Alert.alert('Erreur', 'Impossible d\'ajouter l\'article.');
      } else {
        setItems([...items, data as ShoppingListItem]);
        setNewItemName('');
      }
    } catch (err) {
      console.error('❌ Erreur:', err);
    }
  };

  const validateList = async () => {
    if (!currentList) return;

    Alert.alert(
      'Valider les courses',
      'Êtes-vous sûr d\'avoir terminé cette liste de courses ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Valider',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('shopping_lists')
                .update({
                  status: 'validé',
                  validated_at: new Date().toISOString(),
                })
                .eq('id', currentList.id);

              if (error) {
                console.error('❌ Erreur validation:', error);
                Alert.alert('Erreur', 'Impossible de valider la liste.');
              } else {
                await loadLists();
                setCurrentList(null);
                setItems([]);
                Alert.alert('Succès', 'Liste validée !');
              }
            } catch (err) {
              console.error('❌ Erreur:', err);
            }
          },
        },
      ]
    );
  };

  const handleItemUpdate = () => {
    void loadItems();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ThemedText style={styles.backText}>← Retour</ThemedText>
        </TouchableOpacity>
        <ThemedText type="title" style={styles.title}>
          Listes d'achats
        </ThemedText>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadLists} />}>
        {errorMessage ? <ErrorBanner message={errorMessage} /> : null}

        {/* Sélection de la liste */}
        <ThemedView style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText type="subtitle">Liste active</ThemedText>
            <TouchableOpacity
              onPress={() => setShowNewListInput(!showNewListInput)}
              style={styles.newListButton}>
              <ThemedText style={styles.newListButtonText}>+ Nouvelle</ThemedText>
            </TouchableOpacity>
          </View>

          {showNewListInput && (
            <View style={styles.newListInputContainer}>
              <TextInput
                style={styles.newListInput}
                placeholder="Nom de la nouvelle liste"
                placeholderTextColor="#999"
                value={newListName}
                onChangeText={setNewListName}
                onSubmitEditing={createNewList}
                returnKeyType="done"
                autoFocus
              />
              <View style={styles.newListButtons}>
                <TouchableOpacity 
                  onPress={() => {
                    setShowNewListInput(false);
                    setNewListName('');
                  }} 
                  style={styles.cancelButton}>
                  <ThemedText style={styles.cancelButtonText}>Annuler</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity onPress={createNewList} style={styles.createButton}>
                  <ThemedText style={styles.createButtonText}>Créer</ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {currentList ? (
            <View style={styles.currentListCard}>
              <View style={styles.currentListHeader}>
                <ThemedText type="defaultSemiBold" style={styles.currentListName}>
                  {currentList.name}
                </ThemedText>
                <ThemedText style={styles.currentListDate}>
                  {formatDate(currentList.created_date)}
                </ThemedText>
              </View>
              {lists.length > 1 && (
                <TouchableOpacity
                  onPress={() => {
                    const nextList = lists.find(
                      l => l.id !== currentList.id && l.status === 'en_cours'
                    );
                    if (nextList) setCurrentList(nextList);
                  }}
                  style={styles.changeListButton}>
                  <ThemedText style={styles.changeListText}>Changer</ThemedText>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <EmptyState message="Aucune liste active. Créez-en une nouvelle !" />
          )}
        </ThemedView>

        {/* Items de la liste */}
        {currentList && (
          <ThemedView style={styles.section}>
            <ThemedText type="subtitle">
              Articles ({items.filter(i => !i.is_checked).length} restants)
            </ThemedText>

            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                placeholder="Ajouter un article..."
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
              <EmptyState message="Aucun article dans cette liste" />
            ) : (
              <View style={styles.itemsList}>
                {items.map(item => (
                  <ShoppingItemCard key={item.id} item={item} onUpdate={handleItemUpdate} />
                ))}
              </View>
            )}

            {items.length > 0 && (
              <TouchableOpacity onPress={validateList} style={styles.validateButton}>
                <ThemedText style={styles.validateButtonText}>
                  ✓ Valider les courses
                </ThemedText>
              </TouchableOpacity>
            )}
          </ThemedView>
        )}

        {/* Listes archivées */}
        {lists.filter(l => l.status === 'validé').length > 0 && (
          <ThemedView style={styles.section}>
            <ThemedText type="subtitle">Listes validées</ThemedText>
            <View style={styles.archivedList}>
              {lists
                .filter(l => l.status === 'validé')
                .slice(0, 5)
                .map(list => (
                  <View key={list.id} style={styles.archivedItem}>
                    <ThemedText style={styles.archivedName}>{list.name}</ThemedText>
                    <ThemedText style={styles.archivedDate}>
                      {formatDate(list.validated_at || list.created_date)}
                    </ThemedText>
                  </View>
                ))}
            </View>
          </ThemedView>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  backButton: {
    marginBottom: 10,
  },
  backText: {
    fontSize: 16,
    color: '#7c3aed',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  scrollContent: {
    padding: 20,
    gap: 20,
  },
  section: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  newListButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#7c3aed',
    borderRadius: 8,
  },
  newListButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  currentListCard: {
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  currentListHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  currentListName: {
    fontSize: 16,
  },
  currentListDate: {
    fontSize: 12,
    opacity: 0.6,
  },
  changeListButton: {
    marginTop: 10,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 6,
  },
  changeListText: {
    fontSize: 12,
    fontWeight: '600',
  },
  newListInputContainer: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#7c3aed',
    gap: 12,
  },
  newListInput: {
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.15)',
    borderRadius: 10,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  newListButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    padding: 12,
    backgroundColor: '#e0e0e0',
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  createButton: {
    flex: 1,
    padding: 12,
    backgroundColor: '#7c3aed',
    borderRadius: 10,
    alignItems: 'center',
  },
  createButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 10,
  },
  input: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 10,
    fontSize: 15,
    backgroundColor: '#fff',
  },
  addButton: {
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#7c3aed',
    borderRadius: 10,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  itemsList: {
    gap: 10,
  },
  validateButton: {
    marginTop: 10,
    padding: 16,
    backgroundColor: '#10b981',
    borderRadius: 12,
    alignItems: 'center',
  },
  validateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  archivedList: {
    gap: 8,
  },
  archivedItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  archivedName: {
    fontSize: 14,
    opacity: 0.7,
  },
  archivedDate: {
    fontSize: 12,
    opacity: 0.5,
  },
});
