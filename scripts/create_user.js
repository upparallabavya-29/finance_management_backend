import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('Error: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createTestUser() {
  const email = 'testuser@example.com';
  const password = 'password123';
  const firstName = 'Test';
  const lastName = 'User';

  console.log(`Attempting to create user: ${email}...`);

  // 1. Create the user in Auth
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { first_name: firstName, last_name: lastName }
  });

  if (error) {
    if (error.message.includes('already registered')) {
        console.log('User already exists in Auth. Checking profile...');
        // If user exists, we'll try to find their ID to ensure profile exists
        const { data: users } = await supabase.auth.admin.listUsers();
        const user = users.users.find(u => u.email === email);
        if (user) await ensureProfile(user.id, email, firstName, lastName);
        return;
    }
    console.error('Error creating user:', error.message);
    return;
  }

  console.log('User created in Auth successfully!');
  await ensureProfile(data.user.id, email, firstName, lastName);
}

async function ensureProfile(id, email, firstName, lastName) {
    // 2. Ensure profile exists in public.users
    const { error: profileError } = await supabase
    .from('users')
    .upsert({
      id,
      email,
      first_name: firstName,
      last_name: lastName
    });

  if (profileError) {
    console.error('Error creating public profile:', profileError.message);
  } else {
    console.log('\nSUCCESS! You can now log in with:');
    console.log('Email: testuser@example.com');
    console.log('Password: password123');
  }
}

createTestUser();
