-- Create addon_services used by 20250630085402_update_service_packages.sql
create table if not exists public.addon_services (
  id                   uuid primary key default gen_random_uuid(),
  name                 text not null,
  slug                 text not null unique,
  description          text,
  price                numeric not null,
  original_price       numeric,
  features             text[] not null default '{}',
  period               text not null,                 -- e.g. 'one-time', 'monthly'
  category             text,
  compatible_packages  text[] not null default '{}',  -- slugs/codes of base packages
  is_active            boolean not null default true,
  sort_order           int not null default 0,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);
