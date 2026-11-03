import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined) || 'https://yniphceoofuwzpelpksd.supabase.co';
// This is a Supabase publishable key (not a service-role secret). RLS limits this public dashboard to public read policies.
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) || 'sb_publishable_IiY4eMNa-IPD3u-7D5FrTg_C7jT02Kd';

export const supabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
export const supabase = supabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      global: { headers: { 'X-Client-Info': 'cryptoinvest-public-dashboard' } },
    })
  : null;
