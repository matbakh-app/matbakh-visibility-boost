-- ===========================
-- TASK 2: Schema patch bundle
-- Bringt alle vom Code genutzten Tabellen/Spalten in Einklang
-- ===========================

create extension if not exists pgcrypto;

-- Helper-Trigger (falls aus Task 1 noch nicht da)
create or replace function public.trigger_set_timestamp()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

------------------------------------------------------------
-- A) visibility_check_leads – Spalten, Trigger, Indexe
--   (von Hooks + Edge-Functions genutzt)
------------------------------------------------------------
-- Basis-Spalten ergänzen (idempotent)
alter table public.visibility_check_leads
  add column if not exists id uuid primary key default gen_random_uuid(),
  add column if not exists email               text not null,
  add column if not exists business_name       text,
  add column if not exists location            text,               -- vom Code genutzt
  add column if not exists location_text       text,               -- Funktions-Altkompatibilität
  add column if not exists postal_code         text,
  add column if not exists main_category       text,
  add column if not exists sub_category        text,
  add column if not exists matbakh_category    text,
  add column if not exists website             text,
  add column if not exists facebook_handle     text,
  add column if not exists instagram_handle    text,
  add column if not exists tiktok_handle       text,
  add column if not exists phone_number        text,
  add column if not exists language            text,
  add column if not exists locale              text,
  add column if not exists benchmarks          text[] default '{}',
  add column if not exists status              text default 'new',
  add column if not exists analysis_status     text default 'pending',
  add column if not exists analysis_data       jsonb,
  add column if not exists analyzed_at         timestamptz,
  add column if not exists analysis_completed_at timestamptz,
  add column if not exists report_url          text,
  add column if not exists confirm_token_hash  text,
  add column if not exists confirm_expires_at  timestamptz,
  add column if not exists created_at          timestamptz not null default now(),
  add column if not exists updated_at          timestamptz not null default now();

-- einfache Konsistenz-Checks (idempotent)
do $$
begin
  if not exists (
    select 1 from information_schema.table_constraints
    where table_schema='public' and table_name='visibility_check_leads'
      and constraint_name='vcl_email_chk'
  ) then
    alter table public.visibility_check_leads
      add constraint vcl_email_chk check (length(btrim(coalesce(email,''))) > 0);
  end if;
end $$;

-- Trigger updated_at
drop trigger if exists set_timestamp_on_vcl on public.visibility_check_leads;
create trigger set_timestamp_on_vcl
before update on public.visibility_check_leads
for each row execute function public.trigger_set_timestamp();

-- Indexe für Funktionen & Admin-Ansichten
create index if not exists idx_vcl_token_hash          on public.visibility_check_leads(confirm_token_hash);
create index if not exists idx_vcl_analysis_status     on public.visibility_check_leads(analysis_status);
create index if not exists idx_vcl_status_created_desc on public.visibility_check_leads(analysis_status, created_at desc);
create index if not exists idx_vcl_email_created_desc  on public.visibility_check_leads(email, created_at desc);

------------------------------------------------------------
-- B) business_partners – Felder, die im UI genutzt werden
------------------------------------------------------------
alter table public.business_partners
  add column if not exists user_id              uuid references auth.users(id) on delete cascade,
  add column if not exists company_name         text,
  add column if not exists contact_email        text,
  add column if not exists status               text default 'active',
  add column if not exists onboarding_completed boolean default false,
  add column if not exists services_selected    text[];

-- Optional sinnvolle Indexe
create index if not exists idx_bp_user on public.business_partners(user_id);

------------------------------------------------------------
-- C) Facebook Conversions – Admin
------------------------------------------------------------
create table if not exists public.fb_conversions_config (
  partner_id   uuid primary key references public.business_partners(id) on delete cascade,
  pixel_id     text not null,
  access_token text not null,
  is_active    boolean not null default false,
  updated_at   timestamptz not null default now()
);

create table if not exists public.fb_conversion_logs (
  id            uuid primary key default gen_random_uuid(),
  partner_id    uuid references public.business_partners(id) on delete cascade,
  event_name    text not null,
  pixel_id      text,
  success       boolean not null default false,
  sent_at       timestamptz not null default now(),
  error_message text
);
create index if not exists idx_fb_logs_partner_sent on public.fb_conversion_logs(partner_id, sent_at desc);

------------------------------------------------------------
-- D) Google OAuth Tokens – von Clients usergebunden gelesen/geschrieben
------------------------------------------------------------
create table if not exists public.google_oauth_tokens (
  user_id          uuid not null references auth.users(id) on delete cascade,
  service_type     text not null check (service_type in ('gmb','ga4','ads')),
  access_token     text not null,
  refresh_token    text,
  expires_at       timestamptz,
  gmb_account_id   text,
  ga4_property_id  text,
  ads_customer_id  text,
  updated_at       timestamptz not null default now(),
  primary key (user_id, service_type)
);

-- RLS sinnvoll aktivieren (Client greift hier direkt zu)
alter table public.google_oauth_tokens enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='google_oauth_tokens' and policyname='got_select_own'
  ) then
    create policy got_select_own
      on public.google_oauth_tokens
      for select
      using (user_id = auth.uid());
  end if;

  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='google_oauth_tokens' and policyname='got_upsert_own'
  ) then
    create policy got_upsert_own
      on public.google_oauth_tokens
      for insert
      with check (user_id = auth.uid());
  end if;

  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='google_oauth_tokens' and policyname='got_update_own'
  ) then
    create policy got_update_own
      on public.google_oauth_tokens
      for update
      using (user_id = auth.uid())
      with check (user_id = auth.uid());
  end if;
end $$;

------------------------------------------------------------
-- E) GMB Categories – Read-Only Katalog
------------------------------------------------------------
create table if not exists public.gmb_categories (
  id           uuid primary key default gen_random_uuid(),
  category_id  text not null unique,
  name_de      text not null,
  name_en      text,
  parent_id    text
);
-- RLS hier nicht zwingend erforderlich; default ist disabled.
create index if not exists idx_gmb_cat_parent on public.gmb_categories(parent_id);

------------------------------------------------------------
-- F) Service Packages & Prices – Admin (Client nutzt sie)
------------------------------------------------------------
create table if not exists public.service_packages (
  id              uuid primary key default gen_random_uuid(),
  default_name    text not null,
  code            text not null unique,
  is_recurring    boolean not null default false,
  interval_months int not null default 0
);

create table if not exists public.service_prices (
  id                 uuid primary key default gen_random_uuid(),
  package_id         uuid not null references public.service_packages(id) on delete cascade,
  normal_price_cents int  not null,
  promo_price_cents  int,
  promo_active       boolean not null default false,
  currency           text not null default 'EUR'
);
create index if not exists idx_service_prices_pkg on public.service_prices(package_id);