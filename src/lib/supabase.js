import { createClient } from '@supabase/supabase-js';

// Browser-side Supabase client — uses PKCE flow by default (secure)
// This is separate from the server-side client in server/config/supabase.js
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️  VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is missing from .env');
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder',
  {
    auth: {
      // PKCE is the default and most secure flow for browser clients
      // Browser automatically stores code_verifier in localStorage
      flowType: 'pkce',
      persistSession: true,
      detectSessionInUrl: true,
    }
  }
);
