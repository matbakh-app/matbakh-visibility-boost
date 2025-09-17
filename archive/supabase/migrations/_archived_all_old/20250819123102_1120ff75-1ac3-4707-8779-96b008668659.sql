-- ===========================
-- STEP 1: Tables + FKs + RLS
-- ===========================

create extension if not exists pgcrypto;

create or replace function public.trigger_set_timestamp()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- user_consent_tracking
create table if not exists public.user_consent_tracking (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid null,
  partner_id     uuid null,
  consent_type   text not null,
  consent_given  boolean not null default false,
  ip_address     inet,
  user_agent     text,
  consent_method text not null default 'ui', -- ui|api|import|system
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint user_consent_type_chk   check (length(trim(consent_type)) > 0),
  constraint user_consent_method_chk check (consent_method in ('ui','api','import','system'))
);

-- FKs (idempotent)
do $$
begin
  if not exists (
    select 1 from information_schema.table_constraints
    where table_schema='public' and table_name='user_consent_tracking'
      and constraint_name='user_consent_user_fk'
  ) then
    alter table public.user_consent_tracking
      add constraint user_consent_user_fk
      foreign key (user_id) references auth.users(id) on delete set null;
  end if;

  if exists (
    select 1 from pg_class t join pg_namespace n on n.oid=t.relnamespace
    where n.nspname='public' and t.relname='business_partners'
  ) and not exists (
    select 1 from information_schema.table_constraints
    where table_schema='public' and table_name='user_consent_tracking'
      and constraint_name='user_consent_partner_fk'
  ) then
    alter table public.user_consent_tracking
      add constraint user_consent_partner_fk
      foreign key (partner_id) references public.business_partners(id) on delete set null;
  end if;
end $$;

-- notes
create table if not exists public.notes (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  content     text,
  user_id     uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint notes_title_chk check (length(trim(title)) > 0)
);

-- RLS einschalten (Policies kommen in Step 2)
alter table public.user_consent_tracking enable row level security;
alter table public.notes                enable row level security;