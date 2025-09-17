-- =========================================================
-- MATBAKH.APP COMPLETE DATABASE SCHEMA - UPDATED
-- Vollständige Datenbankstruktur für Restaurant Business Management Platform
-- Last Updated: September 2, 2025 - Task 12.1 Schema Consolidation
-- Status: 🔄 In Progress - Schema conflicts being resolved
-- =========================================================

-- IMPORTANT: This schema reflects the TARGET state after Task 12.1 completion
-- Current production may have schema conflicts that are being resolved
-- See docs/database/migrations/current-state.md for current status

-- Enable required extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm";
create extension if not exists "postgis" schema extensions;

-- =========================================================
-- 1. CORE USER & AUTHENTICATION SYSTEM
-- =========================================================

-- User profiles with role-based access
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  role text not null default 'owner' check (role in ('owner', 'partner', 'admin', 'super_admin')),
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Private user data (GDPR compliant separation)
create table if not exists public.private_profiles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  first_name text,
  last_name text,
  phone text,
  address jsonb, -- {street, city, postal_code, country}
  preferences jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =========================================================
-- 2. RESTAURANT/BUSINESS MANAGEMENT
-- =========================================================

-- Restaurant/Business profiles
create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  slug text unique, -- URL-friendly identifier
  description text,
  category text, -- Restaurant, Café, Bar, etc.
  subcategory text, -- Italian, Asian, etc.
  
  -- Location data
  address jsonb not null, -- {street, city, postal_code, country, coordinates}
  place_id text, -- Google Places ID
  timezone text default 'Europe/Berlin',
  
  -- Contact information
  phone text,
  email text,
  website text,
  
  -- Business hours
  opening_hours jsonb, -- {monday: {open: "09:00", close: "22:00", closed: false}, ...}
  
  -- Branding
  logo_url text,
  cover_image_url text,
  brand_colors jsonb, -- {primary: "#hex", secondary: "#hex", accent: "#hex"}
  
  -- Social media
  social_links jsonb, -- {instagram: "url", facebook: "url", tiktok: "url", ...}
  
  -- Business status
  status text not null default 'active' check (status in ('active', 'inactive', 'suspended')),
  verified boolean default false,
  
  -- Metadata
  settings jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Google My Business categories (for VC analysis)
create table if not exists public.gmb_categories (
  id uuid primary key default gen_random_uuid(),
  category_id text unique not null,
  display_name text not null,
  parent_category_id text,
  is_primary boolean default false,
  created_at timestamptz not null default now()
);

-- =========================================================
-- 3. VISIBILITY CHECK (VC) SYSTEM
-- =========================================================

-- VC Leads (email-based entry point)
create table if not exists public.vc_leads (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  business_name text,
  partner_id text, -- Partner referral tracking
  campaign_id text,
  
  -- Status tracking
  status text not null default 'pending' check (status in ('pending', 'doi_sent', 'verified', 'identified', 'analyzed', 'completed')),
  
  -- UTM tracking
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  ref text,
  
  -- Timestamps
  created_at timestamptz not null default now(),
  verified_at timestamptz,
  identified_at timestamptz,
  analyzed_at timestamptz,
  completed_at timestamptz
);

-- DOI (Double Opt-In) tokens for email verification
create table if not exists public.doi_tokens (
  token text primary key,
  lead_id uuid not null references public.vc_leads(id) on delete cascade,
  expires_at timestamptz not null,
  verified_at timestamptz,
  created_at timestamptz not null default now()
);

-- User consents (GDPR compliance)
create table if not exists public.consents (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.vc_leads(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  consent_type text not null check (consent_type in ('analytics', 'marketing', 'processing', 'cookies')),
  granted boolean not null,
  ip_address inet,
  user_agent text,
  metadata jsonb default '{}'::jsonb,
  timestamp timestamptz not null default now()
);

-- Business identification candidates
create table if not exists public.business_candidates (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.vc_leads(id) on delete cascade,
  place_id text not null,
  name text not null,
  address text not null,
  phone text,
  website text,
  category text,
  confidence numeric(3,2) not null check (confidence >= 0 and confidence <= 1),
  source text not null check (source in ('google_places', 'meta_graph', 'tripadvisor', 'yelp')),
  raw_data jsonb not null,
  created_at timestamptz not null default now()
);

-- Selected business for analysis
create table if not exists public.business_selections (
  lead_id uuid primary key references public.vc_leads(id) on delete cascade,
  place_id text not null,
  selected_candidate jsonb not null,
  user_confirmed boolean default false,
  selected_at timestamptz not null default now()
);

-- VC Analysis results
create table if not exists public.vc_results (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.vc_leads(id) on delete cascade,
  place_id text not null,
  
  -- Overall scores
  total_score numeric(5,2) not null check (total_score >= 0 and total_score <= 100),
  google_score numeric(5,2) check (google_score >= 0 and google_score <= 100),
  social_score numeric(5,2) check (social_score >= 0 and social_score <= 100),
  website_score numeric(5,2) check (website_score >= 0 and website_score <= 100),
  
  -- Detailed analysis
  analysis_data jsonb not null, -- Complete AI analysis results
  recommendations jsonb, -- Action recommendations
  benchmarks jsonb, -- Competitor comparison data
  
  -- Metadata
  analysis_version text not null default '1.0',
  confidence_level numeric(3,2) check (confidence_level >= 0 and confidence_level <= 1),
  created_at timestamptz not null default now(),
  expires_at timestamptz -- For result access control
);

-- VC Result access tokens (for sharing results)
create table if not exists public.vc_result_tokens (
  token text primary key,
  result_id uuid not null references public.vc_results(id) on delete cascade,
  expires_at timestamptz not null,
  accessed_at timestamptz,
  access_count integer default 0,
  created_at timestamptz not null default now()
);

-- =========================================================
-- 4. PARTNER & CREDIT SYSTEM
-- =========================================================

-- Business partners (agencies, consultants, etc.)
create table if not exists public.business_partners (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  company_name text not null,
  partner_code text unique not null, -- e.g., "AUGUSTINER", "SPATEN"
  
  -- Partner details
  contact_person text,
  email text not null,
  phone text,
  website text,
  
  -- Partner status
  status text not null default 'active' check (status in ('active', 'inactive', 'suspended')),
  tier text not null default 'standard' check (tier in ('standard', 'premium', 'enterprise')),
  
  -- Credit system
  credits_balance integer not null default 0,
  credits_used integer not null default 0,
  
  -- Commission settings
  commission_rate numeric(5,2) default 0.00, -- Percentage
  
  -- Metadata
  settings jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Partner credit transactions
create table if not exists public.partner_credit_transactions (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.business_partners(id) on delete cascade,
  transaction_type text not null check (transaction_type in ('credit', 'debit', 'refund')),
  amount integer not null,
  description text not null,
  reference_id uuid, -- Reference to VC lead or other entity
  reference_type text, -- 'vc_lead', 'manual', etc.
  
  -- Transaction metadata
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  created_by uuid references public.profiles(id)
);

-- =========================================================
-- 5. CONTENT & SOCIAL MEDIA MANAGEMENT
-- =========================================================

-- Content queue for social media posting
create table if not exists public.content_queue (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references public.businesses(id) on delete cascade,
  lead_id uuid references public.vc_leads(id) on delete cascade,
  
  -- Content details
  title text not null,
  content text not null,
  content_type text not null check (content_type in ('post', 'story', 'reel', 'photo', 'video')),
  
  -- Media attachments
  media_urls text[], -- Array of image/video URLs
  
  -- Targeting
  platforms text[] not null, -- ['instagram', 'facebook', 'google_my_business']
  
  -- Scheduling
  status text not null default 'draft' check (status in ('draft', 'pending', 'approved', 'scheduled', 'posted', 'failed')),
  scheduled_for timestamptz,
  posted_at timestamptz,
  
  -- Approval workflow
  created_by uuid references public.profiles(id),
  approved_by uuid references public.profiles(id),
  approved_at timestamptz,
  
  -- Metadata
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =========================================================
-- 6. FEATURE FLAGS & CONFIGURATION
-- =========================================================

-- Feature flags for A/B testing and rollouts
create table if not exists public.feature_flags (
  key text primary key,
  value jsonb not null,
  description text,
  enabled boolean default true,
  rollout_percentage integer default 100 check (rollout_percentage >= 0 and rollout_percentage <= 100),
  target_audience text[], -- ['admin', 'partner', 'owner']
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id)
);

-- System configuration
create table if not exists public.system_config (
  key text primary key,
  value jsonb not null,
  category text not null default 'general',
  description text,
  is_public boolean default false, -- Can be accessed by frontend
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id)
);

-- =========================================================
-- 7. ANALYTICS & TRACKING
-- =========================================================

-- Event tracking for analytics
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id),
  session_id text,
  event_name text not null,
  event_data jsonb default '{}'::jsonb,
  
  -- Context
  page_url text,
  referrer text,
  user_agent text,
  ip_address inet,
  
  -- Timestamps
  timestamp timestamptz not null default now()
);

-- =========================================================
-- 8. INDEXES FOR PERFORMANCE
-- =========================================================

-- Profiles indexes
create index if not exists idx_profiles_email on public.profiles(email);
create index if not exists idx_profiles_role on public.profiles(role);

-- Businesses indexes
create index if not exists idx_businesses_owner_id on public.businesses(owner_id);
create index if not exists idx_businesses_slug on public.businesses(slug);
create index if not exists idx_businesses_status on public.businesses(status);

-- VC Leads indexes
create index if not exists idx_vc_leads_email on public.vc_leads(email);
create index if not exists idx_vc_leads_status on public.vc_leads(status);
create index if not exists idx_vc_leads_partner_id on public.vc_leads(partner_id);
create index if not exists idx_vc_leads_created_at on public.vc_leads(created_at);

-- DOI tokens indexes
create index if not exists idx_doi_tokens_expires_at on public.doi_tokens(expires_at);
create index if not exists idx_doi_tokens_lead_id on public.doi_tokens(lead_id);

-- Business candidates indexes
create index if not exists idx_business_candidates_lead_id on public.business_candidates(lead_id);
create index if not exists idx_business_candidates_place_id on public.business_candidates(place_id);

-- VC Results indexes
create index if not exists idx_vc_results_lead_id on public.vc_results(lead_id);
create index if not exists idx_vc_results_place_id on public.vc_results(place_id);
create index if not exists idx_vc_results_created_at on public.vc_results(created_at);

-- Partner indexes
create index if not exists idx_business_partners_user_id on public.business_partners(user_id);
create index if not exists idx_business_partners_partner_code on public.business_partners(partner_code);
create index if not exists idx_business_partners_status on public.business_partners(status);

-- Content queue indexes
create index if not exists idx_content_queue_business_id on public.content_queue(business_id);
create index if not exists idx_content_queue_status on public.content_queue(status);
create index if not exists idx_content_queue_scheduled_for on public.content_queue(scheduled_for);

-- Events indexes
create index if not exists idx_events_user_id on public.events(user_id);
create index if not exists idx_events_event_name on public.events(event_name);
create index if not exists idx_events_timestamp on public.events(timestamp);

-- =========================================================
-- 9. ROW LEVEL SECURITY (RLS)
-- =========================================================

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.private_profiles enable row level security;
alter table public.businesses enable row level security;
alter table public.vc_leads enable row level security;
alter table public.vc_results enable row level security;
alter table public.business_partners enable row level security;
alter table public.partner_credit_transactions enable row level security;
alter table public.content_queue enable row level security;
alter table public.events enable row level security;

-- Profiles policies
create policy "Users can view own profile or admins can view all" on public.profiles
  for select using (
    id = auth.uid() 
    or exists (
      select 1 from public.profiles p 
      where p.id = auth.uid() and p.role in ('admin', 'super_admin')
    )
  );

create policy "Users can update own profile or admins can update all" on public.profiles
  for update using (
    id = auth.uid() 
    or exists (
      select 1 from public.profiles p 
      where p.id = auth.uid() and p.role in ('admin', 'super_admin')
    )
  );

-- Private profiles policies
create policy "Users can view own private profile or admins can view all" on public.private_profiles
  for select using (
    user_id = auth.uid() 
    or exists (
      select 1 from public.profiles p 
      where p.id = auth.uid() and p.role in ('admin', 'super_admin')
    )
  );

-- Businesses policies
create policy "Business owners and admins can view businesses" on public.businesses
  for select using (
    owner_id = auth.uid() 
    or exists (
      select 1 from public.profiles p 
      where p.id = auth.uid() and p.role in ('admin', 'super_admin')
    )
  );

-- VC Leads policies (public read for result access)
create policy "Anyone can view VC leads for result access" on public.vc_leads
  for select using (true);

-- VC Results policies (public read with token)
create policy "Anyone can view VC results" on public.vc_results
  for select using (true);

-- Partner policies
create policy "Partners can view own data, admins can view all" on public.business_partners
  for select using (
    user_id = auth.uid() 
    or exists (
      select 1 from public.profiles p 
      where p.id = auth.uid() and p.role in ('admin', 'super_admin')
    )
  );

-- =========================================================
-- 10. FUNCTIONS & TRIGGERS
-- =========================================================

-- Function to handle new user registration
create or replace function public.handle_new_user()
returns trigger
security definer
set search_path = public
language plpgsql
as $$
begin
  -- Create profile
  insert into public.profiles (id, email, display_name)
  values (
    new.id, 
    new.email, 
    coalesce(new.raw_user_meta_data->>'name', new.email)
  );
  
  -- Create private profile
  insert into public.private_profiles (user_id, first_name, last_name)
  values (
    new.id,
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name'
  );
  
  return new;
end;
$$;

-- Trigger for new user registration
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Function to generate DOI token
create or replace function public.generate_doi_token(p_lead_id uuid)
returns text
language plpgsql
security definer
as $$
declare
  token text;
begin
  token := encode(gen_random_bytes(32), 'base64url');
  
  insert into public.doi_tokens (token, lead_id, expires_at)
  values (token, p_lead_id, now() + interval '24 hours');
  
  return token;
end;
$$;

-- Function to generate VC result token
create or replace function public.generate_vc_result_token(p_result_id uuid)
returns text
language plpgsql
security definer
as $$
declare
  token text;
begin
  token := encode(gen_random_bytes(32), 'base64url');
  
  insert into public.vc_result_tokens (token, result_id, expires_at)
  values (token, p_result_id, now() + interval '30 days');
  
  return token;
end;
$$;

-- Function to update partner credits
create or replace function public.update_partner_credits(
  p_partner_id uuid,
  p_amount integer,
  p_transaction_type text,
  p_description text,
  p_reference_id uuid default null,
  p_reference_type text default null
)
returns uuid
language plpgsql
security definer
as $$
declare
  transaction_id uuid;
  new_balance integer;
begin
  -- Calculate new balance
  if p_transaction_type = 'credit' then
    new_balance := (select credits_balance from public.business_partners where id = p_partner_id) + p_amount;
  else
    new_balance := (select credits_balance from public.business_partners where id = p_partner_id) - p_amount;
  end if;
  
  -- Prevent negative balance
  if new_balance < 0 then
    raise exception 'Insufficient credits. Current balance would be negative.';
  end if;
  
  -- Create transaction record
  transaction_id := gen_random_uuid();
  insert into public.partner_credit_transactions (
    id, partner_id, transaction_type, amount, description, reference_id, reference_type, created_by
  ) values (
    transaction_id, p_partner_id, p_transaction_type, p_amount, p_description, p_reference_id, p_reference_type, auth.uid()
  );
  
  -- Update partner balance
  update public.business_partners 
  set 
    credits_balance = new_balance,
    credits_used = case when p_transaction_type = 'debit' then credits_used + p_amount else credits_used end,
    updated_at = now()
  where id = p_partner_id;
  
  return transaction_id;
end;
$$;

-- =========================================================
-- 11. INITIAL DATA & CONFIGURATION
-- =========================================================

-- Insert default GMB categories
insert into public.gmb_categories (category_id, display_name, is_primary) values
  ('restaurant', 'Restaurant', true),
  ('cafe', 'Café', true),
  ('bar', 'Bar', true),
  ('fast_food', 'Fast Food', true),
  ('bakery', 'Bäckerei', true),
  ('pizza', 'Pizzeria', false),
  ('italian', 'Italienisches Restaurant', false),
  ('asian', 'Asiatisches Restaurant', false),
  ('german', 'Deutsches Restaurant', false),
  ('mediterranean', 'Mediterranes Restaurant', false)
on conflict (category_id) do nothing;

-- Insert default feature flags
insert into public.feature_flags (key, value, description) values
  ('onboarding_guard_live', 'false', 'Enable onboarding gate for new users'),
  ('ui_invisible_default', 'true', 'Default to invisible UI mode'),
  ('vc_doi_live', 'true', 'Enable DOI email sending for VC'),
  ('vc_bedrock_live', 'false', 'Enable AWS Bedrock AI analysis'),
  ('vc_bedrock_rollout_percent', '10', 'Percentage of users to get Bedrock analysis'),
  ('vc_posting_live', 'false', 'Enable social media posting features'),
  ('partner_credits_live', 'true', 'Enable partner credit system')
on conflict (key) do update set 
  value = excluded.value,
  description = excluded.description,
  updated_at = now();

-- Insert system configuration
insert into public.system_config (key, value, category, description, is_public) values
  ('app_name', '"matbakh.app"', 'branding', 'Application name', true),
  ('app_version', '"1.0.0"', 'system', 'Current application version', true),
  ('support_email', '"support@matbakh.app"', 'contact', 'Support email address', true),
  ('max_file_size_mb', '10', 'uploads', 'Maximum file upload size in MB', false),
  ('vc_analysis_timeout_minutes', '30', 'vc', 'Timeout for VC analysis in minutes', false)
on conflict (key) do update set 
  value = excluded.value,
  description = excluded.description,
  updated_at = now();

-- Create super admin users
insert into public.profiles (id, email, role, display_name)
select 
  id, 
  email, 
  'super_admin',
  'Super Admin'
from auth.users 
where email in ('info@matbakh.app', 'mail@matbakh.app', 'matbakhapp2025@gmail.com')
on conflict (id) do update set 
  role = excluded.role,
  display_name = excluded.display_name,
  updated_at = now();

-- Insert sample partner data
insert into public.business_partners (user_id, company_name, partner_code, email, credits_balance) 
select 
  p.id,
  case 
    when p.email = 'info@matbakh.app' then 'Augustiner Bräu'
    when p.email = 'mail@matbakh.app' then 'Spaten Bräu'
    else 'Löwenbräu'
  end,
  case 
    when p.email = 'info@matbakh.app' then 'AUGUSTINER'
    when p.email = 'mail@matbakh.app' then 'SPATEN'
    else 'LOEWENBRAEU'
  end,
  p.email,
  case 
    when p.email = 'info@matbakh.app' then 100
    when p.email = 'mail@matbakh.app' then 50
    else 200
  end
from public.profiles p
where p.role = 'super_admin'
on conflict (partner_code) do update set
  credits_balance = excluded.credits_balance,
  updated_at = now();

-- =========================================================
-- 12. VERIFICATION QUERIES
-- =========================================================

-- Show created tables
select 
  schemaname,
  tablename,
  tableowner
from pg_tables 
where schemaname = 'public' 
  and tablename not like 'pg_%'
order by tablename;

-- Show super admin users
select 
  u.email,
  p.role,
  p.display_name,
  bp.partner_code,
  bp.credits_balance
from auth.users u
join public.profiles p on p.id = u.id
left join public.business_partners bp on bp.user_id = u.id
where p.role in ('admin', 'super_admin')
order by u.email;

-- Show feature flags
select key, value, description, enabled
from public.feature_flags
order by key;