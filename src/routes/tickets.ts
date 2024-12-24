import { Hono } from 'hono';
import { v7 as uuidv7 } from 'uuid';
import { adminSupabaseClient, createSupabaseClient } from '../services/supabase';

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

// Get a ticket by user_id
ticket.get('/ticket/:user_id', async (c) => {
  const supabase = createSupabaseClient(c);
  const user_id = c.req.param('user_id');

  try {
    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .eq('user_id', user_id);

    if (error) {
      return c.json({ message: 'Error fetching ticket', error: error.message }, 400);
    }

    return c.json(data);
  } catch (error) {
    return c.json({ message: 'Unexpected error', error: error }, 500);
  }
});

// Get a ticket by ticket_id
ticket.get('/ticket/:ticket_id', async (c) => {
  const supabase = createSupabaseClient(c);
  const ticket_id = c.req.param('ticket_id');

  try {
    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .eq('ticket_id', ticket_id);

    if (error) {
      return c.json({ message: 'Error fetching ticket', error: error.message }, 400);
    }

    return c.json(data);
  } catch (error) {
    return c.json({ message: 'Unexpected error', error: error }, 500);
  }
});

// Create a ticket
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

// Update a ticket
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