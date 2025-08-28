-- =========================================================
-- BULLETPROOF RBAC Setup - Arbeitet nur mit existierenden Spalten
-- =========================================================

-- 0) Feature Flags
create table if not exists public.feature_flags (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.feature_flags
  add column if not exists flag_name text generated always as (key) stored;

create unique index if not exists feature_flags_flag_name_key
  on public.feature_flags(flag_name);

-- 1) Profiles - Nur mit existierenden Spalten arbeiten
do $$
declare
  pkcol text;
  has_name_col boolean;
  has_email_col boolean;
  name_nullable boolean;
  existing_columns text[];
begin
  -- Ermittle Primärschlüssel
  select case
    when exists (select 1 from information_schema.columns where table_schema='public' and table_name='profiles' and column_name='user_id') then 'user_id'
    when exists (select 1 from information_schema.columns where table_schema='public' and table_name='profiles' and column_name='id') then 'id'
    else null
  end into pkcol;

  -- Prüfe existierende Spalten
  select exists(select 1 from information_schema.columns where table_schema='public' and table_name='profiles' and column_name='name') into has_name_col;
  select exists(select 1 from information_schema.columns where table_schema='public' and table_name='profiles' and column_name='email') into has_email_col;
  
  if has_name_col then
    select is_nullable = 'YES' from information_schema.columns 
    where table_schema='public' and table_name='profiles' and column_name='name'
    into name_nullable;
  end if;

  -- Sammle alle Spalten für Debug
  select array_agg(column_name order by ordinal_position) 
  from information_schema.columns 
  where table_schema='public' and table_name='profiles'
  into existing_columns;

  raise notice 'PROFILES TABLE ANALYSIS:';
  raise notice '- Primary Key: %', coalesce(pkcol, 'NONE');
  raise notice '- Has name column: % (nullable: %)', has_name_col, name_nullable;
  raise notice '- Has email column: %', has_email_col;
  raise notice '- All columns: %', existing_columns;

  -- Fallback: Erstelle Tabelle falls sie nicht existiert
  if pkcol is null then
    raise notice 'Creating profiles table from scratch';
    execute 'create table if not exists public.profiles (
      id uuid primary key references auth.users(id) on delete cascade,
      role text not null default ''owner'',
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )';
    pkcol := 'id';
  end if;

  -- Role-Spalte sicherstellen
  if not exists(select 1 from information_schema.columns where table_schema='public' and table_name='profiles' and column_name='role') then
    execute 'alter table public.profiles add column role text not null default ''owner''';
  else
    execute 'update public.profiles set role = coalesce(role, ''owner'') where role is null';
    execute 'alter table public.profiles alter column role set default ''owner''';
    execute 'alter table public.profiles alter column role set not null';
  end if;

  -- NULL-Werte in name-Spalte beheben (falls vorhanden und NOT NULL)
  if has_name_col and not name_nullable then
    if has_email_col then
      execute 'update public.profiles set name = coalesce(name, email, ''User'') where name is null';
    else
      -- Hole email aus auth.users
      execute format('
        update public.profiles 
        set name = coalesce(name, u.email, ''User'')
        from auth.users u 
        where profiles.%I = u.id and profiles.name is null
      ', pkcol);
    end if;
  end if;

end $$;

-- 2) Private Profiles
create table if not exists public.private_profiles (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  email      text,
  full_name  text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3) RLS
alter table public.profiles          enable row level security;
alter table public.private_profiles  enable row level security;

-- 4) Policies - Robust und einfach
do $$
declare
  pkcol text;
begin
  -- PK ermitteln
  select case
    when exists (select 1 from information_schema.columns where table_schema='public' and table_name='profiles' and column_name='user_id') then 'user_id'
    when exists (select 1 from information_schema.columns where table_schema='public' and table_name='profiles' and column_name='id') then 'id'
  end into pkcol;

  -- Alte Policies löschen
  execute 'drop policy if exists profiles_select_self_or_admin on public.profiles';
  execute 'drop policy if exists profiles_update_self_or_admin on public.profiles';
  execute 'drop policy if exists private_profiles_select_self_or_admin on public.private_profiles';
  execute 'drop policy if exists private_profiles_update_self_or_admin on public.private_profiles';

  -- Neue Policies
  execute format('
    create policy profiles_select_self_or_admin on public.profiles
    for select using (
      %I = auth.uid()
      or exists (
        select 1 from public.profiles p
        where p.%I = auth.uid() and p.role in (''admin'',''super_admin'')
      )
    )', pkcol, pkcol);

  execute format('
    create policy profiles_update_self_or_admin on public.profiles
    for update using (
      %I = auth.uid()
      or exists (
        select 1 from public.profiles p
        where p.%I = auth.uid() and p.role in (''admin'',''super_admin'')
      )
    )', pkcol, pkcol);

  execute format('
    create policy private_profiles_select_self_or_admin on public.private_profiles
    for select using (
      user_id = auth.uid()
      or exists (
        select 1 from public.profiles p
        where p.%I = auth.uid() and p.role in (''admin'',''super_admin'')
      )
    )', pkcol);

  execute format('
    create policy private_profiles_update_self_or_admin on public.private_profiles
    for update using (
      user_id = auth.uid()
      or exists (
        select 1 from public.profiles p
        where p.%I = auth.uid() and p.role in (''admin'',''super_admin'')
      )
    )', pkcol);

end $$;

-- 5) Trigger - Angepasst an Tabellenstruktur
do $$
declare
  pkcol text;
  has_name_col boolean;
  name_nullable boolean;
begin
  select case
    when exists (select 1 from information_schema.columns where table_schema='public' and table_name='profiles' and column_name='user_id') then 'user_id'
    when exists (select 1 from information_schema.columns where table_schema='public' and table_name='profiles' and column_name='id') then 'id'
  end into pkcol;

  select exists(select 1 from information_schema.columns where table_schema='public' and table_name='profiles' and column_name='name') into has_name_col;
  
  if has_name_col then
    select is_nullable = 'YES' from information_schema.columns 
    where table_schema='public' and table_name='profiles' and column_name='name'
    into name_nullable;
  end if;

  -- Trigger-Funktion basierend auf Tabellenstruktur
  if has_name_col and not name_nullable then
    execute format('
      create or replace function public.handle_new_user()
      returns trigger
      security definer
      language plpgsql
      as $body$
      begin
        insert into public.profiles (%I, role, name)
        values (new.id, ''owner'', coalesce(new.email, ''User''))
        on conflict (%I) do nothing;

        insert into public.private_profiles (user_id, email, full_name)
        values (new.id, new.email, coalesce(new.raw_user_meta_data->>''name'',''''))
        on conflict (user_id) do update
        set email = excluded.email, full_name = coalesce(excluded.full_name, private_profiles.full_name);
        
        return new;
      end;
      $body$;
    ', pkcol, pkcol);
  else
    execute format('
      create or replace function public.handle_new_user()
      returns trigger
      security definer
      language plpgsql
      as $body$
      begin
        insert into public.profiles (%I, role)
        values (new.id, ''owner'')
        on conflict (%I) do nothing;

        insert into public.private_profiles (user_id, email, full_name)
        values (new.id, new.email, coalesce(new.raw_user_meta_data->>''name'',''''))
        on conflict (user_id) do update
        set email = excluded.email, full_name = coalesce(excluded.full_name, private_profiles.full_name);
        
        return new;
      end;
      $body$;
    ', pkcol, pkcol);
  end if;

  execute 'drop trigger if exists on_auth_user_created on auth.users';
  execute 'create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user()';

end $$;

-- 6) Super-Admin Zuweisung - Bulletproof
do $$
declare
  pkcol text;
  has_name_col boolean;
  name_nullable boolean;
  admin_count int;
begin
  select case
    when exists (select 1 from information_schema.columns where table_schema='public' and table_name='profiles' and column_name='user_id') then 'user_id'
    when exists (select 1 from information_schema.columns where table_schema='public' and table_name='profiles' and column_name='id') then 'id'
  end into pkcol;

  select exists(select 1 from information_schema.columns where table_schema='public' and table_name='profiles' and column_name='name') into has_name_col;
  
  if has_name_col then
    select is_nullable = 'YES' from information_schema.columns 
    where table_schema='public' and table_name='profiles' and column_name='name'
    into name_nullable;
  end if;

  -- Super-Admin zuweisen
  if has_name_col and not name_nullable then
    execute format('
      insert into public.profiles (%I, role, name)
      select u.id, ''super_admin'', coalesce(u.email, ''Super Admin'')
      from auth.users u
      where u.email in (''info@matbakh.app'',''mail@matbakh.app'',''matbakhapp2025@gmail.com'')
      on conflict (%I) do update set 
        role = ''super_admin'',
        name = coalesce(excluded.name, profiles.name, ''Super Admin'')
    ', pkcol, pkcol);
  else
    execute format('
      insert into public.profiles (%I, role)
      select u.id, ''super_admin''
      from auth.users u
      where u.email in (''info@matbakh.app'',''mail@matbakh.app'',''matbakhapp2025@gmail.com'')
      on conflict (%I) do update set role = ''super_admin''
    ', pkcol, pkcol);
  end if;

  -- Private profiles für Super-Admins
  execute '
    insert into public.private_profiles (user_id, email, full_name)
    select u.id, u.email, coalesce(u.raw_user_meta_data->>''name'', u.email, ''Super Admin'')
    from auth.users u
    where u.email in (''info@matbakh.app'',''mail@matbakh.app'',''matbakhapp2025@gmail.com'')
    on conflict (user_id) do update
    set email = excluded.email, full_name = coalesce(excluded.full_name, private_profiles.full_name, ''Super Admin'')
  ';

  -- Zähle Super-Admins
  execute format('select count(*) from public.profiles where role = ''super_admin''') into admin_count;
  raise notice 'Super-Admins created/updated: %', admin_count;

end $$;

-- 7) Feature Flags
insert into public.feature_flags(key, value) values
  ('onboarding_guard_live', 'false'::jsonb),
  ('ui_invisible_default', 'true'::jsonb),
  ('vc_doi_live', 'true'::jsonb),
  ('vc_posting_live', 'false'::jsonb)
on conflict (key) do update set value = excluded.value, updated_at = now();

-- 8) Verification
select 
  'SUCCESS: Super-Admins' as status,
  u.email, 
  p.role
from auth.users u 
join public.profiles p on p.id = u.id
where p.role = 'super_admin';

select 
  'SUCCESS: Feature Flags' as status,
  key, 
  value
from public.feature_flags 
order by key;