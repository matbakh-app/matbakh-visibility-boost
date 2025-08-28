-- Mail System for Production DOI Flow
create table if not exists mail_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null, -- 'sent' | 'delivered' | 'bounced' | 'complained' | 'opened' | 'clicked'
  message_id text not null,
  recipient_email text not null,
  subject text,
  template_name text,
  tracking_id text, -- links to vc leads
  partner_id text,
  campaign_id text,
  bounce_reason text,
  complaint_reason text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

-- DOI Tokens with TTL and resend limits
create table if not exists doi_tokens (
  token text primary key,
  email text not null,
  tracking_id text not null,
  partner_id text,
  campaign_id text,
  consent_data jsonb not null, -- analytics, marketing flags
  ip_address inet,
  user_agent text,
  expires_at timestamptz not null,
  verified_at timestamptz,
  resend_count int default 0,
  max_resends int default 3,
  created_at timestamptz default now()
);

-- Consent audit trail
create table if not exists consent_audit (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  tracking_id text,
  partner_id text,
  campaign_id text,
  consent_type text not null, -- 'analytics' | 'marketing' | 'processing'
  consent_given boolean not null,
  ip_address inet not null,
  user_agent text not null,
  timestamp timestamptz default now(),
  metadata jsonb default '{}'::jsonb
);

-- Indexes for performance
create index if not exists idx_mail_events_message_id on mail_events(message_id);
create index if not exists idx_mail_events_tracking_id on mail_events(tracking_id);
create index if not exists idx_doi_tokens_email on doi_tokens(email);
create index if not exists idx_doi_tokens_expires_at on doi_tokens(expires_at);
create index if not exists idx_consent_audit_email on consent_audit(email);
create index if not exists idx_consent_audit_tracking_id on consent_audit(tracking_id);

-- Function to generate secure DOI token
create or replace function generate_doi_token(
  p_email text,
  p_tracking_id text,
  p_partner_id text default null,
  p_campaign_id text default null,
  p_consent_data jsonb default '{"analytics": true, "marketing": false}'::jsonb,
  p_ip_address inet default null,
  p_user_agent text default null,
  p_ttl_hours int default 24
) returns text as $$
declare
  token text;
  existing_token text;
begin
  -- Generate secure token
  token := encode(gen_random_bytes(32), 'base64url');
  
  -- Check for existing valid token
  select doi_tokens.token into existing_token
  from doi_tokens
  where email = p_email 
    and tracking_id = p_tracking_id
    and expires_at > now()
    and verified_at is null;
  
  if existing_token is not null then
    -- Update resend count
    update doi_tokens 
    set resend_count = resend_count + 1
    where token = existing_token;
    
    return existing_token;
  end if;
  
  -- Insert new token
  insert into doi_tokens (
    token, email, tracking_id, partner_id, campaign_id,
    consent_data, ip_address, user_agent, expires_at
  ) values (
    token, p_email, p_tracking_id, p_partner_id, p_campaign_id,
    p_consent_data, p_ip_address, p_user_agent, now() + (p_ttl_hours || ' hours')::interval
  );
  
  return token;
end;
$$ language plpgsql;

-- Function to verify DOI token
create or replace function verify_doi_token(p_token text) returns jsonb as $$
declare
  token_data record;
begin
  select * into token_data
  from doi_tokens
  where token = p_token
    and expires_at > now()
    and verified_at is null;
  
  if not found then
    return jsonb_build_object('success', false, 'error', 'invalid_or_expired_token');
  end if;
  
  -- Mark as verified
  update doi_tokens
  set verified_at = now()
  where token = p_token;
  
  -- Record consent audit
  insert into consent_audit (
    email, tracking_id, partner_id, campaign_id,
    consent_type, consent_given, ip_address, user_agent
  ) 
  select 
    token_data.email, token_data.tracking_id, token_data.partner_id, token_data.campaign_id,
    'analytics', (token_data.consent_data->>'analytics')::boolean, token_data.ip_address, token_data.user_agent
  union all
  select 
    token_data.email, token_data.tracking_id, token_data.partner_id, token_data.campaign_id,
    'marketing', (token_data.consent_data->>'marketing')::boolean, token_data.ip_address, token_data.user_agent;
  
  return jsonb_build_object(
    'success', true,
    'email', token_data.email,
    'tracking_id', token_data.tracking_id,
    'partner_id', token_data.partner_id,
    'campaign_id', token_data.campaign_id,
    'consent_data', token_data.consent_data
  );
end;
$$ language plpgsql;