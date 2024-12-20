import { Hono } from 'hono';
import { createSupabaseClient } from '../services/supabase';

const geofences = new Hono();

geofences.post('/addgeofence', async (c) => {
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

    return c.json({ message: 'Geofence saved successfully' });
  } catch (error) {
    console.error('Unexpected error:', error);
    return c.json({ message: 'Unexpected error', error }, 500);
  }
});

export default geofences