import { Hono } from 'hono';
import { adminSupabaseClient, createSupabaseClient } from '../services/supabase';

const admin = new Hono();

// Add admin by Admin route
admin.post('/fc092d77b6c7/addadmin', async (c) => {
  const supabase = createSupabaseClient(c);
  const { email, password, username, phone } = await c.req.json();
  const created_at = new Date();
  const updated_at = new Date();

  try {
    const { data, error } = await supabase.auth.signUp({ email, password });
    const admin_id = data?.user?.id;

    if (error) {
      return c.json({ message: 'Error signing up', error: error.message }, 400);
    }

    // Create admin in admins table
    const { error: upsertError } = await supabase
      .from('admins')
      .insert({ admin_id: data?.user?.id, email, username, phone, role: "admin", created_at: new Date(), updated_at: new Date() });

    if (upsertError) {
      return c.json({ message: 'Error inserting admin data', error: upsertError.message }, 400);
    }

    // Add admin role
    const { error: roleError } = await supabase
      .from('roles')
      .upsert({ admin_id: data?.user?.id, role: "admin" });

    if (roleError) {
      console.error('Error inserting admin role:', roleError);
      return c.json({ message: 'Error inserting admin role', error: roleError.message }, 400);
    }

    return c.json({ message: 'Admin added successfully', admin_id, email, username, phone, created_at, updated_at });
    // return c.json({ admin_id, email, username, phone, created_at, updated_at });
  } catch (error) {
    console.error('Unexpected error:', error);
    return c.json({ message: 'Unexpected error', error: error }, 500);
  }
});

// Fetch all admins from the database
admin.get('/fc092d77b6c7/admins', async (c) => {
  const supabase = createSupabaseClient(c);

  try {
    const { data, error } = await supabase
      .from('admins')
      .select('*')

    if (error) {
      return c.json({ message: 'Error fetching admins', error: error.message }, 400);
    }

    return c.json(data);
  } catch (error) {
    return c.json({ message: 'Unexpected error', error: error }, 500);
  }
});

// Update admin by Admin route
admin.put('/fc092d77b6c7/updateadmin', async (c) => {
  const supabase = createSupabaseClient(c);
  const adminSupabase = adminSupabaseClient(c);
  const { admin_id, email, username, phone } = await c.req.json();
  const updated_at = new Date();

  try {
    // Update admin in the auth.users table (supabase authentication)
    const { error: authError } = await adminSupabase.auth.admin.updateUserById(
      admin_id,
      { email }
    )

    if (authError) {
      return c.json({ message: 'Error updating auth user', error: authError.message }, 400);
    }

    // Update admin in the admins table (application-specific data)
    const { error } = await supabase
      .from('admins')
      .update({ email, username, phone, updated_at })
      .eq('admin_id', admin_id);

    if (error) {
      return c.json({ message: 'Error updating admin data', error: error.message }, 400);
    }

    return c.json({ message: 'Admin updated successfully', admin_id, email, username, phone });
  } catch (error) {
    console.error('Unexpected error:', error);
    return c.json({ message: 'Unexpected error', error: error }, 500);
  }
});

// Delete admin by Admin route
admin.delete('/fc092d77b6c7/deleteadmin', async (c) => {
  const supabase = createSupabaseClient(c);
  const adminSupabase = adminSupabaseClient(c);
  const { admin_id } = await c.req.json();

  try {
    // Delete admin from the admins table (application-specific data)
    const { error: dbError } = await supabase
      .from('admins')
      .delete()
      .eq('admin_id', admin_id);

    if (dbError) {
      return c.json({ message: 'Error deleting admin data from the database', error: dbError.message }, 400);
    }

    // Delete the admin from the auth.users table (supabase authentication)
    const { error: authError } = await adminSupabase.auth.admin.deleteUser(
      admin_id
    )

    if (authError) {
      return c.json({ message: 'Error deleting admin from auth', error: authError.message }, 400);
    }

    return c.json({ message: 'Admin deleted successfully' });
  } catch (error) {
    console.error('Unexpected error:', error);
    return c.json({ message: 'Unexpected error', error: error }, 500);
  }
});

export default admin;