export const Env = {
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
};

console.log('🔍 Config chargée:');
console.log('  - SUPABASE_URL:', Env.supabaseUrl ? '✅ Défini (' + Env.supabaseUrl.substring(0, 30) + '...)' : '❌ Manquant');
console.log('  - SUPABASE_ANON_KEY:', Env.supabaseAnonKey ? '✅ Défini (' + Env.supabaseAnonKey.substring(0, 20) + '...)' : '❌ Manquant');

export const hasSupabaseConfig =
  Env.supabaseUrl.length > 0 && Env.supabaseAnonKey.length > 0;

console.log('🔧 hasSupabaseConfig:', hasSupabaseConfig ? '✅ OK' : '❌ KO');
