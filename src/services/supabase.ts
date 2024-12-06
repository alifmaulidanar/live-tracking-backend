import { createClient } from '@supabase/supabase-js';

export const createSupabaseClient = (c: any) => {
  const supabaseUrl = c.env.SUPABASE_URL;
  const supabaseAnonKey = c.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase URL or Anon Key is missing from environment variables');
  }

  return createClient(supabaseUrl, supabaseAnonKey);
};

export const adminSupabaseClient = (c: any) => {
  const supabaseUrl = c.env.SUPABASE_URL;
  const service_role_key = c.env.SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error('Supabase URL is missing from environment variables');
  }
  if (!service_role_key) {
    throw new Error('Role Key is missing from environment variables');
  }

  return createClient(supabaseUrl, service_role_key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}