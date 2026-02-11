import { useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { supabase } from '@/services/supabase';
import type { ShoppingListItem } from '@/types/models';

type ShoppingItemCardProps = {
  item: ShoppingListItem;
  onUpdate: () => void;
};

export function ShoppingItemCard({ item, onUpdate }: ShoppingItemCardProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  const toggleCheck = async () => {
    if (isUpdating) return;
    
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('shopping_list_items')
        .update({ is_checked: !item.is_checked })
        .eq('id', item.id);

      if (error) {
        console.error('❌ Erreur mise à jour item:', error);
      } else {
        onUpdate();
      }
    } catch (err) {
      console.error('❌ Erreur:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <TouchableOpacity onPress={toggleCheck} disabled={isUpdating}>
      <ThemedView style={styles.card}>
        <View style={styles.content}>
          <View style={[styles.checkbox, item.is_checked && styles.checkboxChecked]}>
            {item.is_checked && <ThemedText style={styles.checkmark}>✓</ThemedText>}
          </View>
          <ThemedText 
            style={[
              styles.itemName,
              item.is_checked && styles.itemNameChecked
            ]}
          >
            {item.item_name}
          </ThemedText>
        </View>
        {item.notes && (
          <ThemedText style={styles.notes}>{item.notes}</ThemedText>
        )}
      </ThemedView>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#7c3aed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#7c3aed',
  },
  checkmark: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  itemName: {
    flex: 1,
    fontSize: 15,
  },
  itemNameChecked: {
    textDecorationLine: 'line-through',
    opacity: 0.5,
  },
  notes: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 6,
    marginLeft: 36,
  },
});
