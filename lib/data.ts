import { createSupabaseServerClient } from '@/lib/supabase/server';
import { demoAreas, demoHouseholds, demoProfiles, demoVisits } from '@/lib/demo-data';
import { Area, Household, Profile, Visit } from '@/lib/supabase/types';

function hasSupabaseEnv() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export async function getCurrentProfile(): Promise<Profile | null> {
  if (!hasSupabaseEnv()) {
    return demoProfiles[3];
  }

  const supabase = createSupabaseServerClient();
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user.id;
  if (!userId) return null;

  const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
  return data ?? null;
}

export async function getAreas(): Promise<Area[]> {
  if (!hasSupabaseEnv()) return demoAreas;
  const supabase = createSupabaseServerClient();
  const { data } = await supabase.from('areas').select('*').order('name');
  return data ?? [];
}

export async function getHouseholds(): Promise<Household[]> {
  if (!hasSupabaseEnv()) {
    return demoHouseholds.map((household) => ({
      ...household,
      area: demoAreas.find((area) => area.id === household.area_id),
      chw: demoProfiles.find((profile) => profile.id === household.assigned_chw_id),
    }));
  }

  const supabase = createSupabaseServerClient();
  const { data } = await supabase.from('households').select('*, area:areas(*), chw:profiles!households_assigned_chw_id_fkey(*)');
  return (data as Household[]) ?? [];
}

export async function getVisits(): Promise<Visit[]> {
  if (!hasSupabaseEnv()) {
    return demoVisits.map((visit) => ({
      ...visit,
      household: demoHouseholds.find((household) => household.id === visit.household_id),
      chw: demoProfiles.find((profile) => profile.id === visit.chw_id),
    }));
  }

  const supabase = createSupabaseServerClient();
  const { data } = await supabase.from('visits').select('*, household:households(*), chw:profiles(*)').order('visit_date', { ascending: false });
  return (data as Visit[]) ?? [];
}

export async function getDashboardData() {
  const [areas, households, visits, profiles] = await Promise.all([
    getAreas(),
    getHouseholds(),
    getVisits(),
    hasSupabaseEnv() ? createSupabaseServerClient().from('profiles').select('*').then((result) => (result.data as Profile[]) ?? []) : Promise.resolve(demoProfiles),
  ]);

  return { areas, households, visits, profiles };
}
