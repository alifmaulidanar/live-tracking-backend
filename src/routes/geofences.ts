import { Hono } from 'hono';
import { createSupabaseClient } from '../services/supabase';

const geofences = new Hono();

// Get all geofences
geofences.get('/geofences', async (c) => {
  const supabase = createSupabaseClient(c);

  try {
    const { data, error } = await supabase
      .from('geofences')
      .select('*')

    if (error) {
      console.error(error);
      return c.json({ message: 'Error fetching geofences', error: error.message }, 400);
    }

    return c.json(data);
  } catch (error) {
    console.error('Unexpected error:', error);
    return c.json({ message: 'Unexpected error', error }, 500);
  }
});

// Upsert a geofence (create or update)
geofences.post('/geofence', async (c) => {
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

// Delete a geofence
geofences.delete('/geofence/:radar_id', async (c) => {
  const supabase = createSupabaseClient(c);
  const radar_id = c.req.param('radar_id');

  try {
    const { error } = await supabase
      .from('geofences')
      .delete()
      .eq('radar_id', radar_id)

    if (error) {
      console.error(error);
      return c.json({ message: 'Error deleting geofence', error: error.message }, 500);
    }

    return c.json({ message: 'Geofence deleted successfully' });
  } catch (error) {
    console.error('Unexpected error:', error);
    return c.json({ message: 'Unexpected error', error }, 500);
  }
});

export default geofences