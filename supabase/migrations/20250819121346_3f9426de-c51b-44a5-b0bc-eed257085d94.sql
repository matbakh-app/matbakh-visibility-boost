-- ===========================
-- Matbakh.app baseline tables
-- user_consent_tracking + notes
-- idempotent, RLS-ready, with indexes
-- ===========================

-- 0) Required extensions & helper trigger
create extension if not exists pgcrypto;

create or replace function public.trigger_set_timestamp()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- ---------------------------------------------------
-- 1) user_consent_tracking
-- ---------------------------------------------------
create table if not exists public.user_consent_tracking (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid null,      -- may be null for pre-auth events; write via Edge
  partner_id     uuid null,      -- business entity (nullable to avoid FK issues initially)
  consent_type   text not null,  -- e.g. cookie_banner | marketing | terms | privacy
  consent_given  boolean not null default false,
  ip_address     inet,
  user_agent     text,
  consent_method text not null,  -- e.g. ui | api | import | system
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),

  -- soft constraints to keep data tidy
  constraint user_consent_type_chk
    check (length(trim(consent_type)) > 0),
  constraint user_consent_method_chk
    check (consent_method in ('ui','api','import','system'))
);

-- Add FK to auth.users if missing
do $$
begin
  if not exists (
    select 1
    from information_schema.constraint_column_usage c
    where c.table_schema='public'
      and c.table_name='user_consent_tracking'
      and c.constraint_name='user_consent_user_fk'
  ) then
    alter table public.user_consent_tracking
      add constraint user_consent_user_fk
      foreign key (user_id) references auth.users(id)
      on delete set null;
  end if;
end $$;

-- Add FK to business_partners if that table exists
do $$
begin
  if exists (select 1 from pg_class t join pg_namespace n on n.oid=t.relnamespace
             where n.nspname='public' and t.relname='business_partners')
     and not exists (
       select 1
       from information_schema.constraint_column_usage c
       where c.table_schema='public'
         and c.table_name='user_consent_tracking'
         and c.constraint_name='user_consent_partner_fk'
     )
  then
    alter table public.user_consent_tracking
      add constraint user_consent_partner_fk
      foreign key (partner_id) references public.business_partners(id)
      on delete set null;
  end if;
end $$;

-- RLS
alter table public.user_consent_tracking enable row level security;

-- Policies (idempotent)
do $$
begin
  -- Users may read their own consents
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='user_consent_tracking'
      and policyname='own_consent_select'
  ) then
    create policy own_consent_select
      on public.user_consent_tracking
      for select
      using (auth.uid() is not null and auth.uid() = user_id);
  end if;

  -- Users may insert for themselves (post-auth flows)
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='user_consent_tracking'
      and policyname='own_consent_insert'
  ) then
    create policy own_consent_insert
      on public.user_consent_tracking
      for insert
      with check (auth.uid() is not null and auth.uid() = user_id);
  end if;

  -- NOTE: Pre-auth consent should be written via Edge Function (service_role),
  -- which bypasses RLS. Kein public/anon INSERT hier, um Missbrauch zu vermeiden.
end $$;

-- Trigger for updated_at
drop trigger if exists set_timestamp_on_consent on public.user_consent_tracking;
create trigger set_timestamp_on_consent
before update on public.user_consent_tracking
for each row execute function public.trigger_set_timestamp();

-- Indexes
create index if not exists idx_user_consent_user on public.user_consent_tracking(user_id);
create index if not exists idx_user_consent_partner on public.user_consent_tracking(partner_id);
create index if not exists idx_user_consent_type on public.user_consent_tracking(consent_type);
create index if not exists idx_user_consent_created_at on public.user_consent_tracking(created_at);

comment on table public.user_consent_tracking is
  'Tracks user consents (cookie banner, marketing, terms). Pre-auth writes via Edge (service_role).';


-- ---------------------------------------------------
-- 2) notes
-- ---------------------------------------------------
create table if not exists public.notes (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  content     text,
  user_id     uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  constraint notes_title_chk check (length(trim(title)) > 0)
);

alter table public.notes enable row level security;

do $$
begin
  -- Read own notes
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='notes'
      and policyname='own_notes_select'
  ) then
    create policy own_notes_select
      on public.notes
      for select using (auth.uid() is not null and auth.uid() = user_id);
  end if;

  -- Insert own notes
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='notes'
      and policyname='own_notes_insert'
  ) then
    create policy own_notes_insert
      on public.notes
      for insert with check (auth.uid() is not null and auth.uid() = user_id);
  end if;

  -- Update own notes
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='notes'
      and policyname='own_notes_update'
  ) then
    create policy own_notes_update
      on public.notes
      for update using (auth.uid() is not null and auth.uid() = user_id)
                 with check (auth.uid() is not null and auth.uid() = user_id);
  end if;

  -- Delete own notes
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='notes'
      and policyname='own_notes_delete'
  ) then
    create policy own_notes_delete
      on public.notes
      for delete using (auth.uid() is not null and auth.uid() = user_id);
  end if;
end $$;

drop trigger if exists set_timestamp_on_notes on public.notes;
create trigger set_timestamp_on_notes
before update on public.notes
for each row execute function public.trigger_set_timestamp();

-- Indexes
create index if not exists idx_notes_user on public.notes(user_id);
create index if not exists idx_notes_created_at on public.notes(created_at);

comment on table public.notes is
  'Simple user notes. Access is restricted to the owning user via RLS.';