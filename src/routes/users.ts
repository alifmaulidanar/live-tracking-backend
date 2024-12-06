import { Hono } from 'hono';
import { createSupabaseClient } from '../services/supabase';

const user = new Hono();

// Add user by Admin route
user.post('/adduser', async (c) => {
  const supabase = createSupabaseClient(c);
  const { email, password, username, phone } = await c.req.json();
  const created_at = new Date();
  const updated_at = new Date();

  try {
    const { data, error } = await supabase.auth.signUp({ email, password });
    const user_id = data?.user?.id;

    if (error) {
      return c.json({ message: 'Error signing up', error: error.message }, 400);
    }

    // Create user in users table
    const { error: upsertError } = await supabase
      .from('users')
      .insert({ user_id: data?.user?.id, email, username, phone, created_at: new Date(), updated_at: new Date() });

    if (upsertError) {
      return c.json({ message: 'Error inserting user data', error: upsertError.message }, 400);
    }

    console.log("Successfull signed up");
    console.log({ user_id, email, username, phone, created_at, updated_at });
    return c.json({ user_id, email, username, phone, created_at, updated_at });
  } catch (error) {
    return c.json({ message: 'Unexpected error', error: error }, 500);
  }
});

export default user;
