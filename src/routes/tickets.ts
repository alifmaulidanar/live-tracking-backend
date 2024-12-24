import { Hono } from 'hono';
import { adminSupabaseClient, createSupabaseClient } from '../services/supabase';
import { v7 as uuidv7 } from 'uuid';

const ticket = new Hono();

// Get all tickets from supabase table "tickets"
ticket.get('/tickets', async (c) => {
  const supabase = createSupabaseClient(c);

  try {
    const { data, error } = await supabase
      .from('tickets')
      .select('*')

    if (error) {
      return c.json({ message: 'Error fetching tickets', error: error.message }, 400);
    }

    return c.json(data);
  } catch (error) {
    return c.json({ message: 'Unexpected error', error: error }, 500);
  }
});

// Post a new ticket to supabase table "tickets" with columns: ticket_id (generated uuid from here), trip_id (param), geofence_id (param), user_id (param), status ("not_started")
ticket.post('/ticket', async (c) => {
  const supabase = createSupabaseClient(c);
  const { user_id, geofence_id, description } = await c.req.json();
  const ticket_id = uuidv7();

  try {
    const { error } = await supabase
      .from('tickets')
      .upsert([
        {
          ticket_id,
          user_id,
          geofence_id,
          description
        }
      ], { onConflict: 'ticket_id' });

    if (error) {
      return c.json({ message: 'Error saving ticket', error: error.message }, 500);
    }

    return c.json({ message: 'Ticket saved successfully' });
  } catch (error) {
    return c.json({ message: 'Unexpected error', error: error }, 500);
  }
});

// After post, we need functionallity to update the ticket
ticket.put('/ticket', async (c) => {
  const supabase = createSupabaseClient(c);
  const { ticket_id, user_id, geofence_id, description, status } = await c.req.json();

  try {
    const { error } = await supabase
      .from('tickets')
      .update({ user_id, geofence_id, description, status })
      .eq('ticket_id', ticket_id);

    if (error) {
      return c.json({ message: 'Error updating ticket', error: error.message }, 500);
    }

    return c.json({ message: 'Ticket updated successfully' });
  } catch (error) {
    return c.json({ message: 'Unexpected error', error: error }, 500);
  }
});

export default ticket;