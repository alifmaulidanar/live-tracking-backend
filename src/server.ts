import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { createClient } from '@supabase/supabase-js';

const app = new Hono<{ Bindings: CloudflareBindings }>()

app.use(cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// Base route
app.get('/', (c) => {
  return c.text('Hello Hono!')
})

// Route for login
app.post('/login', async (c) => {
  console.log("tanpa dev vars");
  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_ANON_KEY);
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

// Route for logout
app.post('/logout', async (c) => {
  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_ANON_KEY);
  const { error } = await supabase.auth.signOut();

  if (error) {
    return c.json({ message: 'Error logging out', error: error.message }, 400);
  }
  return c.json({ message: 'Logged out successfully' });
});

// Route for saving location to the database
app.post('/save-location', async (c) => {
  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_ANON_KEY);
  const { user_id, username, latitude, longitude } = await c.req.json();
  const { error } = await supabase
    .from('locations')
    .upsert({ user_id, username, latitude, longitude });

  if (error) {
    return c.json({ message: 'Error updating location', error: error.message }, 500);
  }
  return c.json({ message: 'Location saved successfully' });
});

// Route for getting the latest location for each user
app.get('/latest-locations', async (c) => {
  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_ANON_KEY);
  const { data, error } = await supabase.rpc('get_latest_user_locations');

  if (error) {
    return c.json({ message: 'Error fetching locations', error: error.message }, 500);
  }
  return c.json(data);
});

export default app