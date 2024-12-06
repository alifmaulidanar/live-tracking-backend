import { createClient } from '@supabase/supabase-js';

export const createSupabaseClient = (c: any) => {
  const supabaseUrl = c.env.SUPABASE_URL;
  const supabaseAnonKey = c.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase URL or Anon Key is missing from environment variables');
  }

  return createClient(supabaseUrl, supabaseAnonKey);
};
