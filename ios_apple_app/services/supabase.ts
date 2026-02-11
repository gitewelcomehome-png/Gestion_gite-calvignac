import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { Env, hasSupabaseConfig } from '@/constants/config';

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
