-- LIVE Readiness Setup Script
-- Idempotent setup for all required tables and feature flags

-- Step 1: Ensure all required tables exist
\i feature_flags.sql
\i mail_system.sql
\i commerce_partner_credits.sql

-- Step 2: Create business_partners table if it doesn't exist
create table if not exists business_partners (
  id text primary key,
  name text not null,
  email text,
  status text not null default 'pending', -- 'pending' | 'active' | 'suspended'
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Step 3: Update any null status values to 'pending'
update business_partners 
set status = 'pending' 
where status is null;

-- Step 4: Ensure partners table exists for credits system
create table if not exists partners (
  id text primary key,
  name text not null,
  created_at timestamptz default now()
);

-- Step 5: Ensure partner_origins table exists
create table if not exists partner_origins (
  partner_id text not null references partners(id),
  origin text not null,
  created_at timestamptz default now(),
  primary key (partner_id, origin)
);

-- Step 6: Set all required feature flags
insert into feature_flags (flag_name, enabled, value, description) values
  ('vc_doi_live', true, 'null', 'Enable live DOI email sending via SES'),
  ('vc_ident_live', true, 'null', 'Enable live business identification'),
  ('vc_bedrock_live', true, 'null', 'Enable Bedrock AI analysis'),
  ('vc_bedrock_rollout_percent', true, '10', 'Percentage of traffic for Bedrock canary testing'),
  ('ui_invisible_default', true, 'null', 'Default to invisible UI on mobile'),
  ('partner_credits_live', true, 'null', 'Enable partner credit consumption'),
  ('og_share_live', true, 'null', 'Enable OG share functionality'),
  ('vc_posting_live', false, 'null', 'Enable posting queue system (disabled for now)')
on conflict (flag_name) do update set
  enabled = excluded.enabled,
  value = excluded.value,
  updated_at = now();

-- Step 7: Run dev seeds
\i dev_seed.sql

-- Step 8: Create view for VC runs if not exists
create or replace view v_vc_runs as
select 
  vl.id,
  vl.email,
  vl.tracking_id,
  vl.partner_id,
  vl.status,
  vl.created_at,
  vr.overall_score,
  vr.analysis_status,
  vr.result_data
from visibility_check_leads vl
left join visibility_check_results vr on vl.tracking_id = vr.tracking_id
order by vl.created_at desc;

-- Step 9: Ensure visibility_check_leads table exists
create table if not exists visibility_check_leads (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  tracking_id text unique not null,
  partner_id text,
  status text not null default 'pending',
  created_at timestamptz default now()
);

-- Step 10: Ensure visibility_check_results table exists
create table if not exists visibility_check_results (
  id uuid primary key default gen_random_uuid(),
  tracking_id text unique not null,
  overall_score integer,
  analysis_status text not null default 'pending',
  result_data jsonb,
  created_at timestamptz default now()
);