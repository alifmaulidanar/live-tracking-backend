// import sharp from 'sharp';
import { Hono } from 'hono';
import { parse } from "csv-parse";
import { v7 as uuid } from 'uuid';
import { createSupabaseClient } from '../services/supabase';

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
ticket.get('/ticket/user/:user_id', async (c) => {
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

// Get a ticket photos by ticket_id
ticket.get('/ticket/photo/:ticket_id', async (c: any) => {
  const supabase = createSupabaseClient(c);
  const ticket_id = c.req.param('ticket_id');

  try {
    // Fetch ticket photos
    const { data: photosData, error: photosError } = await supabase
      .from('photos')
      .select('file_path')
      .eq('ticket_id', ticket_id);

    if (photosError) {
      return c.json({ message: 'Error fetching photos', error: photosError.message }, 400);
    }

    // Combine ticket data with photo URLs
    const responseData = {
      photos: photosData?.map((photo) => ({
        url: `${c.env.SUPABASE_URL}/storage/v1/object/public/ticket-photos/${photo.file_path}`,
      })),
    };

    return c.json(responseData);
  } catch (error) {
    console.error('Unexpected error:', error);
    return c.json({ message: 'Unexpected error', error }, 500);
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
      stream.on("data", (data: any) => records.push(data));
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

// Upload photos for a ticket
ticket.post('/ticket/photos/upload/:ticket_id', async (c: any) => {
  const supabase = createSupabaseClient(c);
  const body = await c.req.parseBody({ all: true });
  const files = body['photos'] || body['photos[]'];
  const ticket_id = c.req.param('ticket_id');
  const user_id = c.req.header('user_id');

  if (!files || !Array.isArray(files) || files.length === 0) {
    return c.json({ message: 'No files uploaded' }, 400);
  }

  if (!ticket_id || !user_id) {
    return c.json({ message: 'Missing ticket_id or user_id' }, 400);
  }

  try {
    const results = [];

    for (const file of files) {
      if (file instanceof File) {
        const filePath = `${user_id}/${ticket_id}/${file.name}`;

        // Compress image using sharp (optional)
        // const compressedBuffer = await sharp(await file.arrayBuffer())
        //   .resize(800) // Resize to width of 800px
        //   .jpeg({ quality: 50 }) // Compress to 50%
        //   .toBuffer();

        const { data, error } = await supabase.storage
          .from('ticket-photos')
          // .upload(`ticket-photos/${file.name}`, compressedBuffer, { // Upload compressed image
          .upload(filePath, await file.arrayBuffer(), { // Upload original image
            contentType: file.type,
            upsert: false,
          });

        if (error) {
          throw new Error(error.message);
        }

        // Insert photo record into photos table
        const { data: photoData, error: photoError } = await supabase
          .from('photos')
          .insert({
            ticket_id,
            file_path: filePath,
          })
          .select();

        if (photoError) {
          throw new Error(photoError.message);
        }

        results.push({
          name: file.name,
          path: data?.path,
          storage_url: `${c.env.SUPABASE_URL}/storage/v1/object/public/ticket-photos/${filePath}`,
          db_record: photoData,
        });
      };
    };
    return c.json({ message: 'Photos uploaded successfully', results }, 200);
  } catch (error) {
    console.error('Photo upload error:', error);
    return c.json({ message: 'Photo upload failed', error }, 500);
  }
});

export default ticket;