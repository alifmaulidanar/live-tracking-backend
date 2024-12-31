import { Hono } from 'hono';
import { createSupabaseClient } from '../services/supabase';

const location = new Hono();

location.post('/save-location', async (c) => {
  const supabase = createSupabaseClient(c);
  const { location_uuid, user_id, latitude, longitude, timestamp } = await c.req.json();

  try {
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('user_id', user_id)
      .single();

    if (userError || !userData) {
      return c.json({ message: 'User not found', error: userError?.message }, 404);
    }

    const { error } = await supabase
      .from('locations')
      .upsert([
        {
          location_uuid,
          user_id,
          latitude,
          longitude,
        }
      ], { onConflict: 'location_uuid' });

    if (error) {
      return c.json({ message: 'Error saving location', error: error.message }, 500);
    }

    return c.json({ message: 'Location saved successfully' });
  } catch (error) {
    console.error('Unexpected error:', error);
    return c.json({ message: 'Unexpected error', error }, 500);
  }
});

// location.post('/save-location', async (c) => {
//   const supabase = createSupabaseClient(c);
//   const { user_id, username, latitude, longitude } = await c.req.json();
//   const { error } = await supabase
//     .from('locations')
//     .upsert({ user_id, username, latitude, longitude });

//   if (error) {
//     return c.json({ message: 'Error updating location', error: error.message }, 500);
//   }

//   return c.json({ message: 'Location saved successfully' });
// });

location.get('/latest-locations', async (c) => {
  const supabase = createSupabaseClient(c);
  const { data, error } = await supabase.rpc('get_latest_user_locations');

  if (error) {
    return c.json({ message: 'Error fetching locations', error: error.message }, 500);
  }

  return c.json(data);
});

export default location;
