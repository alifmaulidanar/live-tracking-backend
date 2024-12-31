import { Hono } from 'hono';
import { createSupabaseClient } from '../services/supabase';

const profile = new Hono();

profile.get('/profile', async (c) => {
  const supabase = createSupabaseClient(c);
  const user_id = c.req.header('user_id');

  if (!user_id) {
    return c.json({ message: 'User ID is required' }, 400);
  }

  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, user_id, email, username, phone, status, role, created_at, updated_at')
      .eq('user_id', user_id)
      .single();

    if (error) {
      return c.json({ message: 'Error fetching user profile', error: error.message }, 500);
    }

    if (!data) {
      return c.json({ message: 'User not found' }, 404);
    }

    return c.json(data);
  } catch (error) {
    console.error('Unexpected error:', error);
    return c.json({ message: 'Unexpected error', error }, 500);
  }
});

export default profile;
