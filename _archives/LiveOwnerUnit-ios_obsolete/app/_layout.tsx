import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { AuthProvider, useAuth } from '@/providers/auth-provider';

export const unstable_settings = {
  initialRouteName: 'index',
};

function NavigationWrapper() {
  const { session, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';

    console.log('🔍 Navigation check:', { 
      session: !!session, 
      inAuthGroup, 
      segments,
      email: session?.user?.email 
    });

    if (!session && !inAuthGroup) {
      console.log('❌ Pas de session, redirection login');
      router.replace('/(auth)/login');
    } else if (session && inAuthGroup) {
      console.log('✅ Session active, redirection dashboard');
      router.replace('/');
    }
  }, [session, loading, segments]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)/login" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <NavigationWrapper />
      <StatusBar style="auto" />
    </AuthProvider>
  );
}
