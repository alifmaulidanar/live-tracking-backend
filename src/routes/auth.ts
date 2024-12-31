import { Hono } from 'hono';
import { createSupabaseClient } from '../services/supabase';

const auth = new Hono();

// Route for login
auth.post('/login', async (c) => {
  const supabase = createSupabaseClient(c);
  const { email, password } = await c.req.json();

  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      return c.json({ message: 'Error logging in', error: error.message }, 400);
    }

    return c.json(data);
  } catch (error) {
    return c.json({ message: 'Unexpected error', error: error }, 500);
  }
});

// Route for admin login
auth.post('/adm/login/admin', async (c) => {
  const supabase = createSupabaseClient(c);
  const { email, password } = await c.req.json();

  try {
    const { data: adminData, error: adminError } = await supabase
      .from('admins')
      .select('email')
      .eq('email', email)
      .single();

    if (adminError || !adminData) {
      return c.json({ message: 'Admin not found', error: adminError?.message }, 404);
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      return c.json({ message: 'Error logging in', error: error.message }, 400);
    }

    return c.json(data);
  } catch (error) {
    return c.json({ message: 'Unexpected error', error: error }, 500);
  }
});

// Route for logout
auth.post('/logout', async (c) => {
  const supabase = createSupabaseClient(c);
  const { error } = await supabase.auth.signOut();

  if (error) {
    return c.json({ message: 'Error logging out', error: error.message }, 400);
  }

  return c.json({ message: 'Logged out successfully' });
});

export default auth;
