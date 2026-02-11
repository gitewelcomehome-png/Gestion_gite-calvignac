import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { ErrorBanner } from '@/components/error-banner';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/providers/auth-provider';

export default function SettingsScreen() {
  const { user, signOut, loading, error } = useAuth();

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title">Settings</ThemedText>
        <ThemedText style={styles.subtitle}>Account and preferences</ThemedText>
      </View>

      {error ? <ErrorBanner message={error} /> : null}

      <ThemedView style={styles.card}>
        <ThemedText type="defaultSemiBold">Account</ThemedText>
        <ThemedText style={styles.label}>{user?.email ?? 'Email unavailable'}</ThemedText>
      </ThemedView>

      <TouchableOpacity style={styles.button} onPress={signOut} disabled={loading}>
        <ThemedText style={styles.buttonText} type="defaultSemiBold">
          Sign out
        </ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 60,
    gap: 20,
  },
  header: {
    gap: 6,
  },
  subtitle: {
    opacity: 0.7,
  },
  card: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    gap: 6,
  },
  label: {
    opacity: 0.7,
  },
  button: {
    backgroundColor: '#11181C',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
  },
});
