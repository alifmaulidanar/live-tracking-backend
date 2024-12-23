import { Hono } from 'hono';
import { adminSupabaseClient, createSupabaseClient } from '../../services/supabase';

const emergency = new Hono();

emergency.post('/0193f3d9/add/to/561f/roles', async (c) => {
  const supabase = createSupabaseClient(c);
  const { admin_id = null, user_id = null, role } = await c.req.json();

  try {
    const { error } = await supabase
      .from('roles')
      .upsert({ admin_id, user_id, role });

    if (error) {
      console.error(error);
      return c.json({ message: 'Error saving role', error: error.message }, 500);
    }

    return c.json({ message: 'Role saved successfully', admin_id, user_id, role });
  } catch (error) {
    console.error('Unexpected error:', error);
    return c.json({ message: 'Unexpected error', error }, 500);
  }
});

emergency.post('/0193f40e/add/to/9c0d/geofences', async (c) => {
  const supabase = createSupabaseClient(c);
  const { radar_id, external_id, description, tag, type, radius, coordinates } = await c.req.json();

  try {
    const { error } = await supabase
      .from('geofences')
      .upsert([
        {
          radar_id,
          external_id,
          description,
          tag,
          type,
          radius,
          coordinates
        }
      ], { onConflict: 'external_id' });

    if (error) {
      console.error(error);
      return c.json({ message: 'Error saving geofence', error: error.message }, 500);
    }

    return c.json({ message: 'Geofence saved successfully', radar_id, external_id, description, tag, type, radius, coordinates });
  } catch (error) {
    console.error('Unexpected error:', error);
    return c.json({ message: 'Unexpected error', error }, 500);
  }
});

export default emergency;