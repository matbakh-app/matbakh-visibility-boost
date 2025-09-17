-- ============================================
-- ONBOARDING V2 - Complete Database Schema
-- ============================================

-- 1) Restaurant Profiles (Stammdaten)
create table if not exists restaurant_profiles (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text,
  slug text unique,
  street text, 
  city text, 
  zip text, 
  country text default 'DE',
  phone text, 
  email text,
  opening_hours jsonb, -- {mon:[["09:00","18:00"],...]}
  created_at timestamptz default now(), 
  updated_at timestamptz default now()
);

create index if not exists restaurant_profiles_owner_idx on restaurant_profiles(owner_id);
create index if not exists restaurant_profiles_slug_idx on restaurant_profiles(slug);

-- 2) Brand Assets
create table if not exists brand_assets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  restaurant_id uuid references restaurant_profiles(id) on delete set null,
  logo_url text,
  colors text[], -- ["#AA3D2E","#F4E6D0"]
  tone text, -- "freundlich-direkt"
  created_at timestamptz default now(), 
  updated_at timestamptz default now()
);

create index if not exists brand_assets_owner_idx on brand_assets(owner_id);

-- 3) Connected Channels
create type if not exists social_channel as enum ('gmb','instagram','facebook','tiktok','website');

create table if not exists connected_channels (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  restaurant_id uuid references restaurant_profiles(id) on delete set null,
  channel social_channel not null,
  external_id text, 
  meta jsonb, 
  connected_at timestamptz default now()
);

create unique index if not exists connected_channels_unique 
  on connected_channels(owner_id, channel);

-- 4) Menu Sources (leichtgewichtig)
create table if not exists menu_sources (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  restaurant_id uuid references restaurant_profiles(id) on delete set null,
  kind text check (kind in ('pdf','url','image','manual')),
  url text, 
  meta jsonb, 
  created_at timestamptz default now()
);

create index if not exists menu_sources_owner_idx on menu_sources(owner_id);

-- 5) Onboarding Progress
create table if not exists onboarding_progress (
  owner_id uuid primary key references auth.users(id) on delete cascade,
  current_step text default 'welcome',
  steps jsonb default '{}'::jsonb, -- {"welcome":true,"brand":{...}}
  completed boolean default false,
  started_at timestamptz default now(),
  completed_at timestamptz
);

-- 6) Enable RLS on all tables
alter table restaurant_profiles enable row level security;
alter table brand_assets enable row level security;
alter table connected_channels enable row level security;
alter table menu_sources enable row level security;
alter table onboarding_progress enable row level security;

-- 7) RLS Policies - Own rows only
create policy "own rows" on restaurant_profiles
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create policy "own rows" on brand_assets
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create policy "own rows" on connected_channels
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create policy "own rows" on menu_sources
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create policy "own row" on onboarding_progress
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

-- 8) Admin policies for monitoring
create policy "admin read all" on restaurant_profiles
  for select using (
    exists (select 1 from profiles where id = auth.uid() and role in ('admin','super_admin'))
  );

create policy "admin read all" on onboarding_progress
  for select using (
    exists (select 1 from profiles where id = auth.uid() and role in ('admin','super_admin'))
  );

-- 9) Helper functions
create or replace function get_onboarding_progress(user_id uuid default auth.uid())
returns jsonb as $$
declare
  progress_data jsonb;
begin
  select to_jsonb(op.*) into progress_data
  from onboarding_progress op
  where op.owner_id = user_id;
  
  return coalesce(progress_data, '{"completed": false, "current_step": "welcome"}'::jsonb);
end;
$$ language plpgsql security definer;

create or replace function init_onboarding_progress(user_id uuid default auth.uid())
returns jsonb as $$
declare
  progress_data jsonb;
begin
  insert into onboarding_progress (owner_id, current_step, steps, completed)
  values (user_id, 'welcome', '{}'::jsonb, false)
  on conflict (owner_id) do nothing;
  
  return get_onboarding_progress(user_id);
end;
$$ language plpgsql security definer;

-- 10) Update triggers for updated_at
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_restaurant_profiles_updated_at
  before update on restaurant_profiles
  for each row execute procedure update_updated_at_column();

create trigger update_brand_assets_updated_at
  before update on brand_assets
  for each row execute procedure update_updated_at_column();