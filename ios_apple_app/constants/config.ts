export const Env = {
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
};

export const hasSupabaseConfig =
  Env.supabaseUrl.length > 0 && Env.supabaseAnonKey.length > 0;
