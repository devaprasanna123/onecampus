import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabaseConfigError = (() => {
  if (!supabaseUrl) return 'Missing VITE_SUPABASE_URL';
  if (!supabaseAnonKey) return 'Missing VITE_SUPABASE_ANON_KEY';
  // Basic sanity check; do not treat as auth failure.
  if (!supabaseUrl.startsWith('https://')) return `VITE_SUPABASE_URL must start with https:// (got: ${supabaseUrl})`;
  return null;
})();

export function logSupabaseEnv() {
  console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
  console.log('Supabase Anon Key present:', Boolean(import.meta.env.VITE_SUPABASE_ANON_KEY));
}

// If credentials are missing, DO NOT create mock mode.
let supabaseClient: ReturnType<typeof createClient> | null = null;
if (!supabaseConfigError) {
  supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
  console.log('✅ Supabase Connected');
} else {
  console.error('❌ Supabase configuration error:', supabaseConfigError);
}

export const supabase = supabaseClient as any;

let healthChecked = false;
export async function ensureSupabaseHealthy() {
  if (healthChecked) return;

  logSupabaseEnv();

  if (supabaseConfigError) {
    const msg = `Supabase config error: ${supabaseConfigError}`;
    console.error(msg);
    throw new Error(msg);
  }

  if (!supabaseClient) {
    const msg = 'Supabase client not initialized.';
    console.error(msg);
    throw new Error(msg);
  }

  console.log('Supabase Connected');

  const { data, error } = await supabaseClient.from('users').select('id').limit(1);
  if (error) {
    console.error('Supabase health check failed:', error);
    throw error;
  }
  if (!data) {
    throw new Error('Supabase health check failed: no data returned');
  }

  healthChecked = true;
}

