import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, TextInput, Alert } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/providers/auth-provider';
import { supabase } from '@/services/supabase';

type Gite = {
  id: string;
  name: string;
  color: string;
  ordre_affichage: number | null;
};

type LinenNeed = {
  id: string;
  gite_id: string;
  owner_user_id: string;
  item_key: string;
  item_label: string;
  quantity: number;
  is_custom: boolean;
};

type LinenStockItem = {
  id: string;
  gite_id: string;
  owner_user_id: string;
  item_key: string;
  quantity: number;
};

export default function LinenScreen() {
  const { user } = useAuth();
  const [gites, setGites] = useState<Gite[]>([]);
  const [currentGiteIndex, setCurrentGiteIndex] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [linenNeeds, setLinenNeeds] = useState<Record<string, LinenNeed[]>>({});
  const [linenStocks, setLinenStocks] = useState<Record<string, Record<string, number>>>({});
  const [editMode, setEditMode] = useState(false);

  const GITES_PER_PAGE = 1;

  // Charger les gîtes
  const loadGites = useCallback(async () => {
    if (!supabase || !user) return;

    const { data, error } = await supabase
      .from('gites')
      .select('id, name, color, ordre_affichage')
      .eq('owner_user_id', user.id)
      .eq('is_active', true)
      .order('ordre_affichage', { ascending: true, nullsFirst: false })
      .order('name', { ascending: true });

    if (error) {
      console.error('Erreur chargement gîtes:', error);
      return;
    }

    setGites((data as Gite[]) || []);
  }, [supabase, user]);

  // Charger les besoins en draps
  const loadLinenNeeds = useCallback(async () => {
    if (!supabase || !user) return;

    const { data, error } = await supabase
      .from('linen_needs')
      .select('*')
      .eq('owner_user_id', user.id)
      .order('item_key', { ascending: true });

    if (error) {
      console.error('Erreur chargement besoins draps:', error);
      return;
    }

    // Grouper par gite_id
    const needsByGite: Record<string, LinenNeed[]> = {};
    (data || []).forEach((need: LinenNeed) => {
      if (!needsByGite[need.gite_id]) {
        needsByGite[need.gite_id] = [];
      }
      needsByGite[need.gite_id].push(need);
    });

    setLinenNeeds(needsByGite);
  }, [supabase, user]);

  // Charger les stocks actuels
  const loadLinenStocks = useCallback(async () => {
    if (!supabase || !user) return;

    const { data, error} = await supabase
      .from('linen_stock_items')
      .select('*')
      .eq('owner_user_id', user.id);

    if (error) {
      console.error('Erreur chargement stocks draps:', error);
      return;
    }

    // Organiser par gite_id puis item_key
    const stocksByGite: Record<string, Record<string, number>> = {};
    (data || []).forEach((stock: LinenStockItem) => {
      if (!stocksByGite[stock.gite_id]) {
        stocksByGite[stock.gite_id] = {};
      }
      stocksByGite[stock.gite_id][stock.item_key] = stock.quantity || 0;
    });

    setLinenStocks(stocksByGite);
  }, [supabase, user]);

  // Charger toutes les données
  const loadData = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadGites(), loadLinenNeeds(), loadLinenStocks()]);
    setRefreshing(false);
  }, [loadGites, loadLinenNeeds, loadLinenStocks]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Mettre à jour le stock d'un item
  const updateStock = async (giteId: string, itemKey: string, newQuantity: number) => {
    if (!supabase || !user || newQuantity < 0) return;

    try {
      // Vérifier si un stock existe déjà
      const { data: existing } = await supabase
        .from('linen_stock_items')
        .select('id')
        .eq('gite_id', giteId)
        .eq('owner_user_id', user.id)
        .eq('item_key', itemKey)
        .single();

      if (existing) {
        // Update
        const { error } = await supabase
          .from('linen_stock_items')
          .update({
            quantity: newQuantity,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        // Insert
        const { error } = await supabase
          .from('linen_stock_items')
          .insert({
            gite_id: giteId,
            owner_user_id: user.id,
            item_key: itemKey,
            quantity: newQuantity,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (error) throw error;
      }

      // Mettre à jour l'état local
      setLinenStocks((prev) => ({
        ...prev,
        [giteId]: {
          ...prev[giteId],
          [itemKey]: newQuantity
        }
      }));

    } catch (error: any) {
      console.error('Erreur maj stock:', error);
      Alert.alert('Erreur', 'Impossible de mettre à jour le stock');
    }
  };

  // Sauvegarder tous les changements
  const handleSaveAll = async () => {
    setEditMode(false);
    Alert.alert('✓ Sauvegardé', 'Stocks mis à jour avec succès');
  };

  const currentGite = gites[currentGiteIndex];
  const needs = currentGite ? linenNeeds[currentGite.id] || [] : [];
  const stocks = currentGite ? linenStocks[currentGite.id] || {} : {};

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadData} />}>
      
      <View style={styles.header}>
        <ThemedText type="title">🛏️ Draps</ThemedText>
      </View>

      {gites.length === 0 ? (
        <View style={styles.emptyState}>
          <ThemedText style={styles.emptyText}>Aucun gîte actif</ThemedText>
        </View>
      ) : (
        <>
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

          {/* Carte du gîte */}
          {currentGite && (
            <View style={styles.giteCard}>
              {/* Header */}
              <View style={[styles.giteHeader, { backgroundColor: currentGite.color || '#667eea' }]}>
                <ThemedText style={styles.giteHeaderTitle}>{currentGite.name}</ThemedText>
                <ThemedText style={styles.giteHeaderSubtitle}>
                  {needs.length} types de draps
                </ThemedText>
              </View>

              {/* Liste des draps */}
              <ScrollView style={styles.linenBodyScroll} contentContainerStyle={styles.linenBody}>
                {needs.length === 0 ? (
                  <View style={styles.emptyState}>
                    <ThemedText style={styles.emptyText}>Aucun type de drap configuré</ThemedText>
                    <ThemedText style={styles.emptySubtext}>Configurez les types depuis le web</ThemedText>
                  </View>
                ) : (
                  <>
                    {needs.map((need) => {
                      const currentStock = stocks[need.item_key] || 0;
                      const isLow = currentStock < need.quantity;
                      
                      return (
                        <View key={need.id} style={[styles.linenCard, isLow && styles.linenCardLow]}>
                          <View style={styles.linenCardHeader}>
                            <View style={styles.linenInfo}>
                              <ThemedText style={styles.linenLabel}>{need.item_label}</ThemedText>
                              <ThemedText style={styles.linenNeed}>
                                Besoin: {need.quantity} {need.quantity > 1 ? 'pièces' : 'pièce'}
                              </ThemedText>
                            </View>
                            {isLow && (
                              <View style={styles.warningBadge}>
                                <ThemedText style={styles.warningBadgeText}>⚠️ Stock faible</ThemedText>
                              </View>
                            )}
                          </View>

                          {/* Input stock */}
                          <View style={styles.stockInputContainer}>
                            <ThemedText style={styles.stockLabel}>Stock disponible:</ThemedText>
                            <View style={styles.stockInputWrapper}>
                              <TouchableOpacity
                                style={styles.stockButton}
                                onPress={() => updateStock(currentGite.id, need.item_key, Math.max(0, currentStock - 1))}>
                                <ThemedText style={styles.stockButtonText}>−</ThemedText>
                              </TouchableOpacity>
                              
                              <TextInput
                                style={styles.stockInput}
                                value={currentStock.toString()}
                                onChangeText={(text) => {
                                  const num = parseInt(text) || 0;
                                  if (num >= 0) {
                                    updateStock(currentGite.id, need.item_key, num);
                                  }
                                }}
                                keyboardType="number-pad"
                              />
                              
                              <TouchableOpacity
                                style={styles.stockButton}
                                onPress={() => updateStock(currentGite.id, need.item_key, currentStock + 1)}>
                                <ThemedText style={styles.stockButtonText}>+</ThemedText>
                              </TouchableOpacity>
                            </View>
                          </View>

                          {/* Indicateur statut */}
                          <View style={styles.statusIndicator}>
                            <View style={[styles.statusBar, { width: `${Math.min((currentStock / need.quantity) * 100, 100)}%`, backgroundColor: isLow ? '#f5576c' : '#27AE60' }]} />
                          </View>
                        </View>
                      );
                    })}
                  </>
                )}
              </ScrollView>
            </View>
          )}
        </>
      )}
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
    marginBottom: 8,
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
  giteCard: {
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
  linenBodyScroll: {
    maxHeight: 500,
  },
  linenBody: {
    padding: 12,
    gap: 12,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#8E8E93',
    fontStyle: 'italic',
  },
  emptySubtext: {
    fontSize: 12,
    color: '#636366',
    fontStyle: 'italic',
  },
  linenCard: {
    backgroundColor: '#2C2C2E',
    borderRadius: 10,
    padding: 14,
    gap: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#27AE60',
  },
  linenCardLow: {
    borderLeftColor: '#f5576c',
    backgroundColor: '#2C2122',
  },
  linenCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  linenInfo: {
    flex: 1,
    gap: 4,
  },
  linenLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  linenNeed: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '500',
  },
  warningBadge: {
    backgroundColor: '#f5576c',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  warningBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  stockInputContainer: {
    gap: 8,
  },
  stockLabel: {
    fontSize: 13,
    color: '#8E8E93',
    fontWeight: '600',
  },
  stockInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stockButton: {
    width: 44,
    height: 44,
    backgroundColor: '#3A3A3C',
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stockButtonText: {
    fontSize: 24,
    color: '#00D4FF',
    fontWeight: 'bold',
  },
  stockInput: {
    flex: 1,
    height: 44,
    backgroundColor: '#3A3A3C',
    borderRadius: 10,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statusIndicator: {
    height: 6,
    backgroundColor: '#3A3A3C',
    borderRadius: 3,
    overflow: 'hidden',
  },
  statusBar: {
    height: '100%',
    borderRadius: 3,
  },
});
