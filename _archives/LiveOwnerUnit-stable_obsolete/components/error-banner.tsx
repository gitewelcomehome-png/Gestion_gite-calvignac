import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export function ErrorBanner({ message }: { message: string }) {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="defaultSemiBold" style={styles.text}>
        {message}
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#fdecea',
    borderWidth: 1,
    borderColor: '#f5c2c7',
  },
  text: {
    color: '#8a1c1c',
  },
});
