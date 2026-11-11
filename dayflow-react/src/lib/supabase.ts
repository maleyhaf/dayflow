import { createClient, SupabaseClient } from '@supabase/supabase-js';

// These are public (front-end safe) values. Set them in .env.local (and in Vercel).
const url = process.env.REACT_APP_SUPABASE_URL;
const key = process.env.REACT_APP_SUPABASE_ANON_KEY;

export const supabaseConfigured = Boolean(url && key);

// null when env vars are missing, so the login page can show a setup hint instead of crashing
export const supabase: SupabaseClient | null = supabaseConfigured
  ? createClient(url as string, key as string, {
      auth: {
        persistSession: true,      // keep the user signed in across visits
        autoRefreshToken: true,    // silently renew the session
        detectSessionInUrl: true,  // pick up the session after the Google redirect
      },
    })
  : null;

export function getClient(): SupabaseClient {
  if (!supabase) throw new Error('Supabase is not configured');
  return supabase;
}
