import { Hono } from 'hono';
import { adminSupabaseClient, createSupabaseClient } from '../services/supabase';

const trip = new Hono();

// Get all trips from supabase table "trips"
trip.get('/trips', async (c) => {
  const supabase = createSupabaseClient(c);

  try {
    const { data, error } = await supabase
      .from('trips')
      .select('*')

    if (error) {
      return c.json({ message: 'Error fetching trips', error: error.message }, 400);
    }

    return c.json(data);
  } catch (error) {
    return c.json({ message: 'Unexpected error', error: error }, 500);
  }
});

// Get a trip by user_id
trip.get('/trip/:user_id', async (c) => {
  const supabase = createSupabaseClient(c);
  const user_id = c.req.param('user_id');

  try {
    const { data, error } = await supabase
      .from('trips')
      .select('*')
      .eq('user_id', user_id);

    if (error) {
      return c.json({ message: 'Error fetching trip', error: error.message }, 400);
    }

    return c.json(data);
  } catch (error) {
    return c.json({ message: 'Unexpected error', error: error }, 500);
  }
});

// Get a trip by trip_id
trip.get('/trip/:trip_id', async (c) => {
  const supabase = createSupabaseClient(c);
  const trip_id = c.req.param('trip_id');

  try {
    const { data, error } = await supabase
      .from('trips')
      .select('*')
      .eq('trip_id', trip_id);

    if (error) {
      return c.json({ message: 'Error fetching trip', error: error.message }, 400);
    }

    return c.json(data);
  } catch (error) {
    return c.json({ message: 'Unexpected error', error: error }, 500);
  }
});

export default trip;