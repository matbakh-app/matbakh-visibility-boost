-- Minimal leads and consents tables for production
create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  business_name text not null,
  partner_id text,
  campaign_id text,
  status text not null default 'pending', -- 'pending' | 'doi_sent' | 'verified' | 'completed'
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  ref text,
  created_at timestamptz default now(),
  verified_at timestamptz,
  completed_at timestamptz
);

create table if not exists consents (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads(id),
  consent_type text not null, -- 'analytics' | 'marketing' | 'processing'
  granted boolean not null,
  timestamp timestamptz default now(),
  ip_address inet,
  user_agent text,
  metadata jsonb default '{}'::jsonb
);

-- DOI tokens for email verification
create table if not exists doi_tokens_minimal (
  token text primary key,
  lead_id uuid not null references leads(id),
  expires_at timestamptz not null,
  verified_at timestamptz,
  created_at timestamptz default now()
);

-- Indexes
create index if not exists idx_leads_email on leads(email);
create index if not exists idx_leads_partner_id on leads(partner_id);
create index if not exists idx_leads_status on leads(status);
create index if not exists idx_consents_lead_id on consents(lead_id);
create index if not exists idx_doi_tokens_expires_at on doi_tokens_minimal(expires_at);

-- Function to generate DOI token
create or replace function generate_doi_token_minimal(p_lead_id uuid) returns text as $$
declare
  token text;
begin
  token := encode(gen_random_bytes(32), 'base64url');
  
  insert into doi_tokens_minimal (token, lead_id, expires_at)
  values (token, p_lead_id, now() + interval '24 hours');
  
  return token;
end;
$$ language plpgsql;