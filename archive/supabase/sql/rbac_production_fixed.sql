-- =========================================================
-- Matbakh RBAC/RLS Bootstrap (idempotent, safe to re-run)
-- FIXED VERSION - Korrigiert alle Syntax-Fehler
-- =========================================================

-- 0) FEATURE FLAGS (kompatibel zu "key/value" & "flag_name")
create table if not exists public.feature_flags (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now()
);

-- Kompatibilitäts-Spalte (einige Stellen nutzen "flag_name")
alter table public.feature_flags
  add column if not exists flag_name text generated always as (key) stored;

create unique index if not exists feature_flags_flag_name_key
  on public.feature_flags(flag_name);

-- 1) PROFILES (öffentliche Rollen-Tabelle)
--    Falls noch nicht vorhanden, mit PK=id (UUID) anlegen.
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  role       text not null default 'owner',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Falls Projekthistorie stattdessen "user_id" nutzt, ist die Tabelle bereits vorhanden
-- und dieser CREATE greift nicht. Später wird dynamisch (id vs. user_id) aufgelöst.

-- Notwendige Spalte sicherstellen
alter table public.profiles
  add column if not exists role text;

update public.profiles 
set role = coalesce(role, 'owner') 
where role is null;

alter table public.profiles
  alter column role set default 'owner';

alter table public.profiles
  alter column role set not null;

-- 2) PRIVATE PROFILES (personenbezogene Daten getrennt)
create table if not exists public.private_profiles (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  email      text,
  full_name  text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3) RLS aktivieren
alter table public.profiles          enable row level security;
alter table public.private_profiles  enable row level security;

-- 4) Policies & Trigger dynamisch je nach PK-Spalte (id vs. user_id)
do $$
declare
  pkcol text;
begin
  -- Primärschlüsselspalte der Tabelle public.profiles ermitteln
  select case
    when exists (
      select 1 from information_schema.columns
      where table_schema='public' and table_name='profiles' and column_name='user_id'
    ) then 'user_id'
    when exists (
      select 1 from information_schema.columns
      where table_schema='public' and table_name='profiles' and column_name='id'
    ) then 'id'
    else null
  end into pkcol;

  if pkcol is null then
    raise exception 'public.profiles hat weder "user_id" noch "id".';
  end if;

  -- Bestehende Policies defensiv entfernen (alte & neue Namen)
  -- PROFILES
  execute 'drop policy if exists profiles_sel on public.profiles';
  execute 'drop policy if exists profiles_upd on public.profiles';
  execute 'drop policy if exists profiles_select_self_or_admin on public.profiles';
  execute 'drop policy if exists profiles_update_self_or_admin on public.profiles';

  -- PRIVATE_PROFILES
  execute 'drop policy if exists private_profiles_sel on public.private_profiles';
  execute 'drop policy if exists private_profiles_upd on public.private_profiles';
  execute 'drop policy if exists private_profiles_select_self_or_admin on public.private_profiles';
  execute 'drop policy if exists private_profiles_update_self_or_admin on public.private_profiles';

  -- PROFILES: SELECT / UPDATE (Self oder Admin/SuperAdmin)
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

  -- PRIVATE_PROFILES: SELECT / UPDATE (Self oder Admin/SuperAdmin)
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

  -- Trigger-Funktion: legt Profile + private_profiles beim Signup an / pflegt sie
  execute format('
    create or replace function public.handle_new_user()
    returns trigger
    security definer
    set search_path = public
    language plpgsql
    as $body$
    begin
      -- Profile upsert (Rolle standardmäßig ''owner'')
      insert into public.profiles (%I, role)
      values (new.id, ''owner'')
      on conflict (%I) do nothing;

      -- Private Profile upsert (E-Mail / Name)
      insert into public.private_profiles (user_id, email, full_name)
      values (
        new.id, 
        new.email, 
        coalesce(new.raw_user_meta_data->>''name'','''')
      )
      on conflict (user_id) do update
      set 
        email     = excluded.email,
        full_name = coalesce(
          nullif(excluded.full_name,''''), 
          public.private_profiles.full_name
        );
      
      return new;
    end;
    $body$;
  ', pkcol, pkcol);

  -- Trigger neu setzen
  execute 'drop trigger if exists on_auth_user_created on auth.users';
  execute 'create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user()';

  -- Super-Admins zuweisen (idempotent)
  execute format('
    insert into public.profiles (%I, role)
    select id, ''super_admin''
    from auth.users
    where email in (''info@matbakh.app'',''mail@matbakh.app'',''matbakhapp2025@gmail.com'')
    on conflict (%I) do update set role = excluded.role;
  ', pkcol, pkcol);

  -- private_profiles für diese Nutzer sicherstellen/aktualisieren
  execute '
    insert into public.private_profiles (user_id, email, full_name)
    select 
      id, 
      email, 
      coalesce(raw_user_meta_data->>''name'','''')
    from auth.users
    where email in (''info@matbakh.app'',''mail@matbakh.app'',''matbakhapp2025@gmail.com'')
    on conflict (user_id) do update
    set 
      email     = excluded.email,
      full_name = coalesce(
        nullif(excluded.full_name,''''), 
        public.private_profiles.full_name
      );
  ';

end
$$;

-- 5) Feature Flags setzen
insert into public.feature_flags(key, value) values
  ('onboarding_guard_live', 'false'::jsonb),
  ('ui_invisible_default', 'true'::jsonb),
  ('vc_doi_live', 'true'::jsonb),
  ('vc_posting_live', 'false'::jsonb)
on conflict (key) do update set 
  value = excluded.value, 
  updated_at = now();

-- 6) Verification Query
select 
  'Super Admin Users:' as info,
  u.email, 
  p.role
from auth.users u 
join public.profiles p on p.id = u.id
where u.email in ('info@matbakh.app','mail@matbakh.app','matbakhapp2025@gmail.com');

select 
  'Feature Flags:' as info,
  key, 
  value
from public.feature_flags 
order by key;