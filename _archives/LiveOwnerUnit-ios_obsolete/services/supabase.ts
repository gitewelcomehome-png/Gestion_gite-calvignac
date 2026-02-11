import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { Env, hasSupabaseConfig } from '@/constants/config';

console.log('🔌 Initialisation Supabase...');
console.log('  - hasSupabaseConfig:', hasSupabaseConfig);

export const supabase: SupabaseClient | null = hasSupabaseConfig
  ? createClient(Env.supabaseUrl, Env.supabaseAnonKey, {
      auth: {
        storage: AsyncStorage,
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    })
  : null;

if (supabase) {
  console.log('✅ Supabase client créé avec succès');
} else {
  console.error('❌ Supabase client est NULL - Configuration manquante');
}
