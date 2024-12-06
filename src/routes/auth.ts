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

    console.log("Successfull logged in");
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

  console.log("Successfull logged out");
  return c.json({ message: 'Logged out successfully' });
});

export default auth;
