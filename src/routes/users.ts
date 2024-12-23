import { Hono } from 'hono';
import { adminSupabaseClient, createSupabaseClient } from '../services/supabase';

const user = new Hono();

// Add user by Admin route
user.post('/adduser', async (c) => {
  const supabase = createSupabaseClient(c);
  const { email, password, username, phone } = await c.req.json();
  const created_at = new Date();
  const updated_at = new Date();

  try {
    const { data, error } = await supabase.auth.signUp({ email, password });
    const user_id = data?.user?.id;

    if (error) {
      return c.json({ message: 'Error signing up', error: error.message }, 400);
    }

    // Create user in users table
    const { error: upsertError } = await supabase
      .from('users')
      .insert({ user_id: data?.user?.id, email, username, phone, role: "user", created_at: new Date(), updated_at: new Date() });

    if (upsertError) {
      return c.json({ message: 'Error inserting user data', error: upsertError.message }, 400);
    }

    // Add user role
    const { error: roleError } = await supabase
      .from('roles')
      .upsert({ user_id: data?.user?.id, role: "user" });

    if (roleError) {
      console.error('Error inserting user role:', roleError);
      return c.json({ message: 'Error inserting user role', error: roleError.message }, 400);
    }

    return c.json({ message: 'User added successfully', user_id, email, username, phone, created_at, updated_at });
    // return c.json({ user_id, email, username, phone, created_at, updated_at });
  } catch (error) {
    console.error('Unexpected error:', error);
    return c.json({ message: 'Unexpected error', error: error }, 500);
  }
});

// Fetch all users from the database
user.get('/users', async (c) => {
  const supabase = createSupabaseClient(c);

  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')

    if (error) {
      return c.json({ message: 'Error fetching users', error: error.message }, 400);
    }

    return c.json(data);
  } catch (error) {
    return c.json({ message: 'Unexpected error', error: error }, 500);
  }
});

// Update user by Admin route
user.put('/updateuser', async (c) => {
  const supabase = createSupabaseClient(c);
  const adminSupabase = adminSupabaseClient(c);
  const { user_id, email, username, phone } = await c.req.json();
  const updated_at = new Date();

  try {
    // Update user in the auth.users table (supabase authentication)
    const { error: authError } = await adminSupabase.auth.admin.updateUserById(
      user_id,
      { email }
    )

    if (authError) {
      return c.json({ message: 'Error updating auth user', error: authError.message }, 400);
    }

    // Update user in the users table (application-specific data)
    const { error } = await supabase
      .from('users')
      .update({ email, username, phone, updated_at })
      .eq('user_id', user_id);

    if (error) {
      return c.json({ message: 'Error updating user data', error: error.message }, 400);
    }

    return c.json({ message: 'User updated successfully', user_id, email, username, phone });
  } catch (error) {
    console.error('Unexpected error:', error);
    return c.json({ message: 'Unexpected error', error: error }, 500);
  }
});

// Delete user by Admin route
user.delete('/deleteuser', async (c) => {
  const supabase = createSupabaseClient(c);
  const adminSupabase = adminSupabaseClient(c);
  const { user_id } = await c.req.json();

  try {
    // Delete user from the users table (application-specific data)
    const { data: deletedData, error: dbError } = await supabase
      .from('users')
      .delete()
      .eq('user_id', user_id);

    if (dbError) {
      return c.json({ message: 'Error deleting user data from the database', error: dbError.message }, 400);
    }

    // Delete the user from the auth.users table (supabase authentication)
    const { data: deletedAuthData, error: authError } = await adminSupabase.auth.admin.deleteUser(
      user_id
    )

    if (authError) {
      return c.json({ message: 'Error deleting user from auth', error: authError.message }, 400);
    }

    return c.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Unexpected error:', error);
    return c.json({ message: 'Unexpected error', error: error }, 500);
  }
});

export default user;
