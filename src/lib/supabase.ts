import { createClient } from '@supabase/supabase-js';

const rawUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const rawAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

const isPlaceholderUrl =
  !rawUrl ||
  rawUrl.trim() === '' ||
  rawUrl.includes('PASTE_YOUR_SUPABASE_URL_HERE') ||
  !rawUrl.startsWith('http');

const isPlaceholderKey =
  !rawAnonKey ||
  rawAnonKey.trim() === '' ||
  rawAnonKey.includes('PASTE_YOUR_PUBLISHABLE_KEY_HERE');

export const isSupabaseConfigured = !isPlaceholderUrl && !isPlaceholderKey;

const effectiveUrl = isSupabaseConfigured
  ? rawUrl!.trim()
  : 'https://placeholder-project.supabase.co';

const effectiveAnonKey = isSupabaseConfigured
  ? rawAnonKey!.trim()
  : 'placeholder-anon-key';

export const supabase = createClient(effectiveUrl, effectiveAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
