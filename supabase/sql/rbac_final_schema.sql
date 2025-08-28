-- ===================================================================
-- FINAL RBAC SCHEMA - Production Ready
-- Erweiterte Rollenhierarchie mit korrekter Struktur
-- ===================================================================

-- === ROLE TYPE ===============================================================
do $$
begin
  if not exists (select 1 from pg_type where typname = 'role_type') then
    create type role_type as enum ('owner','partner','admin','super_admin','viewer');
  end if;
end
$$;

-- === PROFILES (öffentl.) =====================================================
create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  role role_type not null default 'owner',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- === PRIVATE PROFILES (personenbezogen, getrennt) ============================
create table if not exists public.private_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  first_name text,
  last_name  text,
  phone      text,
  address    jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- updated_at trigger (beide Tabellen)
create or replace function public.tg_touch_updated_at() returns trigger as $$
begin
  new.updated_at := now(); 
  return new;
end; 
$$ language plpgsql;

do $$ 
begin
  if not exists (select 1 from pg_trigger where tgname='profiles_touch_updated_at') then
    create trigger profiles_touch_updated_at
      before update on public.profiles
      for each row execute procedure public.tg_touch_updated_at();
  end if;
  
  if not exists (select 1 from pg_trigger where tgname='private_profiles_touch_updated_at') then
    create trigger private_profiles_touch_updated_at
      before update on public.private_profiles
      for each row execute procedure public.tg_touch_updated_at();
  end if;
end 
$$;

-- === RLS =====================================================================
alter table public.profiles          enable row level security;
alter table public.private_profiles  enable row level security;

-- Cleanup existing policies first
drop policy if exists "profiles self read" on public.profiles;
drop policy if exists "profiles admin read" on public.profiles;
drop policy if exists "profiles self update" on public.profiles;
drop policy if exists "private self read" on public.private_profiles;
drop policy if exists "private self update" on public.private_profiles;
drop policy if exists "private admin read" on public.private_profiles;

-- lesen: selbst oder (admin/super_admin)
do $$ 
begin
  if not exists (select 1 from pg_policies where policyname='profiles_read') then
    create policy profiles_read on public.profiles for select
      using (auth.uid() = user_id
        or exists(select 1 from public.profiles p 
                  where p.user_id = auth.uid() 
                  and p.role in ('admin','super_admin')));
  end if;
  
  if not exists (select 1 from pg_policies where policyname='private_profiles_read') then
    create policy private_profiles_read on public.private_profiles for select
      using (auth.uid() = user_id
        or exists(select 1 from public.profiles p 
                  where p.user_id = auth.uid() 
                  and p.role = 'super_admin'));
  end if;
end 
$$;

-- schreiben: nur selbst (Super-Admin darf administrativ ändern)
do $$ 
begin
  if not exists (select 1 from pg_policies where policyname='profiles_write_self') then
    create policy profiles_write_self on public.profiles for insert 
      with check (auth.uid() = user_id);
    create policy profiles_update_self on public.profiles for update 
      using (auth.uid() = user_id);
  end if;
  
  if not exists (select 1 from pg_policies where policyname='private_profiles_write_self') then
    create policy private_profiles_write_self on public.private_profiles for insert 
      with check (auth.uid() = user_id);
    create policy private_profiles_update_self on public.private_profiles for update 
      using (auth.uid() = user_id);
  end if;
  
  -- Super-Admin volle Rechte
  if not exists (select 1 from pg_policies where policyname='profiles_write_superadmin') then
    create policy profiles_write_superadmin on public.profiles for all
      using (exists(select 1 from public.profiles p 
                    where p.user_id = auth.uid() 
                    and p.role='super_admin'))
      with check (exists(select 1 from public.profiles p 
                         where p.user_id = auth.uid() 
                         and p.role='super_admin'));
  end if;
  
  if not exists (select 1 from pg_policies where policyname='private_profiles_write_superadmin') then
    create policy private_profiles_write_superadmin on public.private_profiles for all
      using (exists(select 1 from public.profiles p 
                    where p.user_id = auth.uid() 
                    and p.role='super_admin'))
      with check (exists(select 1 from public.profiles p 
                         where p.user_id = auth.uid() 
                         and p.role='super_admin'));
  end if;
end 
$$;

-- === Profile für alle vorhandenen auth.users anlegen ========================
insert into public.profiles (user_id, display_name)
select u.id, coalesce(u.raw_user_meta_data->>'full_name', u.email)
from auth.users u
left join public.profiles p on p.user_id = u.id
where p.user_id is null
on conflict (user_id) do nothing;

insert into public.private_profiles (user_id, first_name, last_name)
select u.id,
  split_part(coalesce(u.raw_user_meta_data->>'full_name',''), ' ', 1),
  nullif(split_part(coalesce(u.raw_user_meta_data->>'full_name',''), ' ', 2), '')
from auth.users u
left join public.private_profiles pp on pp.user_id = u.id
where pp.user_id is null
on conflict (user_id) do nothing;

-- === Gründer als SUPER_ADMIN setzen =========================================
update public.profiles
set role = 'super_admin'
where user_id in (
  select id from auth.users
  where email in ('info@matbakh.app','mail@matbakh.app','matbakhapp2025@gmail.com')
);

-- === Feature Flags (fix für 42P01 & Werte) ==================================
create table if not exists public.feature_flags (
  key text primary key,
  value jsonb not null default 'true'::jsonb,
  updated_at timestamptz not null default now()
);

insert into public.feature_flags(key,value) values
  ('onboarding_guard_live','false'::jsonb),
  ('ui_invisible_default','true'::jsonb),
  ('vc_doi_live','true'::jsonb),
  ('vc_posting_live','false'::jsonb)
on conflict (key) do update set 
  value=excluded.value, 
  updated_at=now();

-- === Auto-Profile Creation Trigger ==========================================
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (user_id, display_name) 
  values (
    NEW.id, 
    coalesce(NEW.raw_user_meta_data->>'full_name', NEW.email)
  )
  on conflict (user_id) do nothing;
  
  insert into public.private_profiles (user_id, first_name, last_name) 
  values (
    NEW.id,
    split_part(coalesce(NEW.raw_user_meta_data->>'full_name',''), ' ', 1),
    nullif(split_part(coalesce(NEW.raw_user_meta_data->>'full_name',''), ' ', 2), '')
  )
  on conflict (user_id) do nothing;
  
  return NEW;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- === Sichtprüfung ===========================================================
select u.email, p.role
from auth.users u 
join public.profiles p on p.user_id=u.id
where u.email in ('info@matbakh.app','mail@matbakh.app','matbakhapp2025@gmail.com');

select * from public.feature_flags order by key;