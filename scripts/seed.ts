import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRole) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
}

const supabase = createClient(url, serviceRole);

async function seed() {
  console.log('Seeding Pahad demo data...');

  const users = [
    { email: 'chw1@demo.com', password: 'demo1234', full_name: 'Sunita Rai', role: 'chw' },
    { email: 'chw2@demo.com', password: 'demo1234', full_name: 'Bikram Tamang', role: 'chw' },
    { email: 'chw3@demo.com', password: 'demo1234', full_name: 'Maya Gurung', role: 'chw' },
    { email: 'supervisor@demo.com', password: 'demo1234', full_name: 'Dr. Rajesh Shrestha', role: 'supervisor' },
  ] as const;

  const userIds: Record<string, string> = {};
  const allUsers = await supabase.auth.admin.listUsers();

  for (const user of users) {
    const existing = allUsers.data.users.find((entry) => entry.email === user.email);
    if (existing) {
      userIds[user.email] = existing.id;
      continue;
    }
    const created = await supabase.auth.admin.createUser({ email: user.email, password: user.password, email_confirm: true });
    if (created.error) throw created.error;
    userIds[user.email] = created.data.user.id;
  }

  const { data: areas, error: areasError } = await supabase.from('areas').upsert([
    { name: 'Ward 3, Sindhupalchok', name_ne: '??? ?, ?????????????', district: 'Sindhupalchok', ward_number: 3, center_lat: 27.9547, center_lng: 85.6895 },
    { name: 'Ward 5, Sindhupalchok', name_ne: '??? ?, ?????????????', district: 'Sindhupalchok', ward_number: 5, center_lat: 27.8883, center_lng: 85.7117 },
    { name: 'Ward 7, Kavrepalanchok', name_ne: '??? ?, ??????????????', district: 'Kavrepalanchok', ward_number: 7, center_lat: 27.6588, center_lng: 85.5384 }
  ], { onConflict: 'name' }).select();
  if (areasError || !areas) throw areasError;

  await supabase.from('profiles').upsert([
    { id: userIds['chw1@demo.com'], email: 'chw1@demo.com', full_name: 'Sunita Rai', role: 'chw', area_id: areas[0].id },
    { id: userIds['chw2@demo.com'], email: 'chw2@demo.com', full_name: 'Bikram Tamang', role: 'chw', area_id: areas[1].id },
    { id: userIds['chw3@demo.com'], email: 'chw3@demo.com', full_name: 'Maya Gurung', role: 'chw', area_id: areas[2].id },
    { id: userIds['supervisor@demo.com'], email: 'supervisor@demo.com', full_name: 'Dr. Rajesh Shrestha', role: 'supervisor', area_id: null },
  ], { onConflict: 'id' });

  console.log('Seed complete. Demo accounts:');
  console.log('chw1@demo.com / demo1234');
  console.log('supervisor@demo.com / demo1234');
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
