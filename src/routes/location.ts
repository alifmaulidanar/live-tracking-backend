import { Hono } from 'hono';
import { createSupabaseClient } from '../services/supabase';

const location = new Hono();

location.post('/save-location', async (c) => {
  const supabase = createSupabaseClient(c);
  const { user_id, username, latitude, longitude } = await c.req.json();
  const { error } = await supabase
    .from('locations')
    .upsert({ user_id, username, latitude, longitude });

  if (error) {
    return c.json({ message: 'Error updating location', error: error.message }, 500);
  }

  console.log("Successfull saved location");
  return c.json({ message: 'Location saved successfully' });
});

location.get('/latest-locations', async (c) => {
  const supabase = createSupabaseClient(c);
  const { data, error } = await supabase.rpc('get_latest_user_locations');

  if (error) {
    return c.json({ message: 'Error fetching locations', error: error.message }, 500);
  }

  console.log("Successfull retrieved latest locations");
  return c.json(data);
});

export default location;
