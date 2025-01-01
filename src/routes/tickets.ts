import { Hono } from 'hono';
import multer from "multer";
import { parse } from "csv-parse";
import { v7 as uuid } from 'uuid';
import { createSupabaseClient } from '../services/supabase';

const ticket = new Hono();
const storage = multer.memoryStorage();
const upload = multer({ storage });

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
  const ticket_id = uuid();

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

// Upload tickets from a CSV file
ticket.post('/tickets/upload', async (c) => {
  const supabase = createSupabaseClient(c);

  try {
    // Parse multipart form data
    const formData = await c.req.parseBody();
    const file = formData.file;

    if (!file) return c.json({ message: 'No file provided' }, 400);
    if (!(file instanceof File)) return c.json({ message: 'Invalid file type' }, 400);

    const csvContent = new TextDecoder().decode(await file.arrayBuffer());
    let records: any[] = [];

    // Parse CSV content using csv-parser
    await new Promise<void>((resolve, reject) => {
      const stream = parse({ columns: true, delimiter: ';' }); // Specify semicolon as separator
      stream.on("data", (data) => records.push(data));
      stream.on("end", resolve);
      stream.on("error", reject);
      stream.write(csvContent);
      stream.end();
    });

    // Validate and prepare tickets
    const tickets = [];
    for (const record of records) {
      if (!record.user_id || !record.geofence_id) return c.json({ message: 'Invalid CSV format: Missing required fields' }, 400);

      tickets.push({
        ticket_id: uuid(),
        user_id: record.user_id,
        geofence_id: record.geofence_id,
        description: record.description || null,
      });
    }

    // Insert tickets into Supabase database
    const { error } = await supabase
      .from('tickets')
      .insert(tickets);

    if (error) return c.json({ message: 'Error uploading tickets', error: error.message }, 500);
    return c.json({ message: 'Tickets uploaded successfully', count: tickets.length });
  } catch (error) {
    return c.json({ message: 'Unexpected error', error }, 500);
  }
});

// Update a ticket
ticket.put('/ticket', async (c) => {
  const supabase = createSupabaseClient(c);
  const { ticket_id, user_id, geofence_id, description, status } = await c.req.json();

  try {
    const { data, error } = await supabase
      .from('tickets')
      .update({ user_id, geofence_id, description, status })
      .eq('ticket_id', ticket_id)

    if (error) {
      return c.json({ message: 'Error updating ticket', error: error.message }, 500);
    }

    return c.json({ message: 'Ticket updated successfully' });
  } catch (error) {
    return c.json({ message: 'Unexpected error', error: error }, 500);
  }
});

// Update a ticket status
ticket.put('/ticket/status', async (c) => {
  const supabase = createSupabaseClient(c);
  const { ticket_id, trip_id, status } = await c.req.json();

  try {
    const { data, error } = await supabase
      .from('tickets')
      .update({ trip_id, status })
      .eq('ticket_id', ticket_id)

    if (error) {
      return c.json({ message: 'Error updating ticket status', error: error.message }, 500);
    }

    return c.json({ message: 'Ticket status updated successfully' });
  } catch (error) {
    return c.json({ message: 'Unexpected error', error: error }, 500);
  }
});

ticket.post('/ticket/photos/upload', async (c) => {
  await new Promise<void>((resolve, reject) => {
    upload.array('photos', 4)(c.req as any, c.res as any, (err) => {
      if (err) return reject(err);
      resolve();
    });
  });
  console.log("Request Headers:", c.req.headers);
  console.log('Files uploaded:', (c.req as any).files);
  const supabase = createSupabaseClient(c);
  const files = (c.req as any).files as Express.Multer.File[];

  if (!files || files.length === 0) {
    return c.json({ message: 'No files uploaded' }, 400);
  }

  console.log({ files });
  console.log({ ets });

  try {
    const results = [];

    for (const file of files) {
      const uniqueName = `${uuid()}-${file.originalname}`;

      const { data, error } = await supabase.storage
        .from('photos')
        .upload(`user-photos/${uniqueName}`, file.buffer, {
          contentType: file.mimetype,
          upsert: false,
        });

      if (error) {
        throw new Error(error.message);
      }

      results.push({
        name: uniqueName,
        path: data?.path,
        url: `${process.env.SUPABASE_STORAGE_URL}/photos/${data?.path}`,
      });
    }

    return c.json({ message: 'Photos uploaded successfully', results });
  } catch (error) {
    console.error('Photo upload error:', error);
    return c.json({ message: 'Photo upload failed', error }, 500);
  }
});

export default ticket;