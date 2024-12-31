import { Hono } from 'hono';
// import fetch from "node-fetch";
import { parse } from "csv-parse";
import { v7 as uuid } from 'uuid';
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

// Upload geofences from a CSV file
geofences.post("/geofences/upload", async (c) => {
  const supabase = createSupabaseClient(c);

  try {
    // Parse multipart form data
    const formData = await c.req.parseBody();
    const file = formData.file;

    if (!file) return c.json({ message: "No file provided" }, 400);
    if (!(file instanceof File)) return c.json({ message: "Invalid file type" }, 400);

    const csvContent = new TextDecoder().decode(await file.arrayBuffer());
    const records: any = [];

    // Parse CSV content
    await new Promise<void>((resolve, reject) => {
      const parser = parse({ columns: true, delimiter: ";" });
      parser.on("data", (data) => records.push(data));
      parser.on("end", resolve);
      parser.on("error", reject);
      parser.write(csvContent);
      parser.end();
    });

    // Validate and process records
    const validGeofences = [];
    for (const record of records) {
      if (!record.description || !record.tag || !record.radius || !record.latitude || !record.longitude) {
        return c.json({ message: "Invalid CSV format: Missing required fields" }, 400);
      }
      validGeofences.push({
        description: record.description,
        tag: record.tag,
        type: "circle",
        radius: Number(record.radius),
        coordinates: [parseFloat(record.longitude), parseFloat(record.latitude)],
      });
    };

    // Batch process geofences to Radar API
    const results = [];
    const batchSize = 10; // Radar's rate limit is 10 requests/second
    for (let i = 0; i < validGeofences.length; i += batchSize) {
      const batch = validGeofences.slice(i, i + batchSize);

      const responses = await Promise.allSettled(
        batch.map(async (geofence) => {
          const externalId = uuid();
          const url = `https://api.radar.io/v1/geofences/${geofence.tag}/${externalId}`;

          const response = await fetch(url, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: "prj_test_sk_af4f808464e8033fc16046f9f6d379c1ced9255b",
            },
            body: JSON.stringify({
              description: geofence.description,
              type: geofence.type,
              radius: geofence.radius,
              coordinates: geofence.coordinates,
            }),
          });

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Radar API error: ${errorText}`);
          }

          const data: any = await response.json();
          return {
            radar_id: data.geofence._id,
            external_id: data.geofence.externalId,
            description: data.geofence.description,
            tag: data.geofence.tag,
            type: data.geofence.type,
            radius: data.geofence.geometryRadius,
            coordinates: data.geofence.geometryCenter.coordinates,
          };
        })
      );
      results.push(...responses);
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Delay 1 second to avoid rate limit
    }

    // Save successful geofences to Supabase
    const successfulGeofences = results
      .filter((result) => result.status === "fulfilled")
      .map((result) => (result as PromiseFulfilledResult<any>).value);

    const { error } = await supabase.from("geofences").upsert(successfulGeofences, {
      onConflict: "external_id",
    });

    if (error) {
      console.error("Error saving to Supabase:", error);
      return c.json({ message: "Error saving to database", error: error.message }, 500);
    }

    return c.json({
      message: "Geofences uploaded successfully",
      total: validGeofences.length,
      saved: successfulGeofences.length,
      failed: results.filter((result) => result.status === "rejected").length,
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return c.json({ message: "Unexpected error", error }, 500);
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