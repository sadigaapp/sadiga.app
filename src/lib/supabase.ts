import { createClient } from '@supabase/supabase-js';

// Membaca URL dan Key dari Environment Variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL atau Anon Key belum terpasang di file .env');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
