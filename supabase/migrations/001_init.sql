-- Enable UUID extension
create extension if not exists "uuid-ossp";

create table if not exists areas (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  name_ne text not null,
  district text not null default 'Sindhupalchok',
  ward_number int,
  center_lat float not null,
  center_lng float not null,
  geojson_feature_id text,
  created_at timestamptz default now()
);

create table if not exists profiles (
  id uuid primary key references auth.users on delete cascade,
  email text not null,
  full_name text not null,
  avatar_url text,
  role text not null check (role in ('chw', 'supervisor')),
  area_id uuid references areas(id),
  created_at timestamptz default now()
);

create table if not exists households (
  id uuid primary key default uuid_generate_v4(),
  code text unique not null,
  head_name text not null,
  area_id uuid not null references areas(id),
  assigned_chw_id uuid not null references profiles(id),
  latest_risk_score int default 0,
  latest_risk_level text default 'low' check (latest_risk_level in ('low', 'moderate', 'high', 'critical')),
  risk_trend text default 'stable' check (risk_trend in ('improving', 'stable', 'worsening')),
  status text default 'active' check (status in ('active', 'reviewed', 'referred')),
  created_at timestamptz default now()
);

create table if not exists visits (
  id uuid primary key default uuid_generate_v4(),
  household_id uuid not null references households(id),
  chw_id uuid not null references profiles(id),
  visit_date date not null default current_date,
  responses jsonb not null,
  total_score int not null,
  risk_level text not null check (risk_level in ('low', 'moderate', 'high', 'critical')),
  confidence int default 85 check (confidence between 0 and 100),
  explanation_en text,
  explanation_ne text,
  key_signals text[],
  notes text,
  scoring_method text default 'llm' check (scoring_method in ('llm', 'fallback')),
  created_at timestamptz default now()
);

alter table profiles enable row level security;
alter table areas enable row level security;
alter table households enable row level security;
alter table visits enable row level security;

drop policy if exists areas_read_all on areas;
create policy areas_read_all on areas for select using (true);

drop policy if exists profiles_read_own on profiles;
create policy profiles_read_own on profiles for select using (auth.uid() = id or exists (select 1 from profiles where id = auth.uid() and role = 'supervisor'));
drop policy if exists profiles_insert_own on profiles;
create policy profiles_insert_own on profiles for insert with check (auth.uid() = id);
drop policy if exists profiles_update_own on profiles;
create policy profiles_update_own on profiles for update using (auth.uid() = id);

drop policy if exists households_chw_read on households;
create policy households_chw_read on households for select using (
  assigned_chw_id = auth.uid() or exists (select 1 from profiles where id = auth.uid() and role = 'supervisor')
);
drop policy if exists households_supervisor_update on households;
create policy households_supervisor_update on households for update using (
  exists (select 1 from profiles where id = auth.uid() and role = 'supervisor')
);

drop policy if exists visits_chw_read on visits;
create policy visits_chw_read on visits for select using (
  chw_id = auth.uid() or exists (select 1 from profiles where id = auth.uid() and role = 'supervisor')
);
drop policy if exists visits_chw_insert on visits;
create policy visits_chw_insert on visits for insert with check (chw_id = auth.uid());

drop policy if exists no_delete_households on households;
create policy no_delete_households on households for delete using (false);
drop policy if exists no_delete_visits on visits;
create policy no_delete_visits on visits for delete using (false);

create or replace function update_household_risk()
returns trigger as $$
declare
  prev_score int;
  new_trend text;
begin
  select latest_risk_score into prev_score from households where id = new.household_id;

  if new.total_score > coalesce(prev_score, 0) + 10 then new_trend := 'worsening';
  elsif new.total_score < coalesce(prev_score, 0) - 10 then new_trend := 'improving';
  else new_trend := 'stable';
  end if;

  update households set
    latest_risk_score = new.total_score,
    latest_risk_level = new.risk_level,
    risk_trend = new_trend
  where id = new.household_id;

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_visit_insert on visits;
create trigger on_visit_insert after insert on visits for each row execute function update_household_risk();
