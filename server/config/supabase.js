const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

const supabaseUrl = process.env.SUPABASE_URL;
// Use service_role key on backend for admin access (bypasses Row Level Security)
// Falls back to anon key if service_role not set
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('⚠️  Supabase environment variables missing. Auth features will not work. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to server/.env');
}

const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseKey || 'placeholder',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      flowType: 'implicit',
    },
    global: {
      fetch: fetch
    }
  }
);

module.exports = supabase;

