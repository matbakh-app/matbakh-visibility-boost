-- Feature Flags System for Production Safety
create table if not exists feature_flags (
  flag_name text primary key,
  enabled boolean not null default false,
  value jsonb default 'null'::jsonb,
  description text,
  updated_by text,
  updated_at timestamptz default now()
);

-- Insert production flags
insert into feature_flags (flag_name, enabled, value, description) values
  ('vc_doi_live', true, 'null', 'Enable live DOI email sending via SES'),
  ('vc_ident_live', true, 'null', 'Enable live business identification'),
  ('vc_bedrock_live', true, 'null', 'Enable Bedrock AI analysis'),
  ('vc_bedrock_rollout_percent', true, '10', 'Percentage of traffic for Bedrock canary testing'),
  ('vc_posting_hooks', false, 'null', 'Enable social media posting (after acceptance)'),
  ('ui_invisible_default', true, 'null', 'Default to invisible UI on mobile'),
  ('partner_credits_live', true, 'null', 'Enable partner credit consumption'),
  ('og_share_live', true, 'null', 'Enable OG share functionality'),
  ('vc_posting_live', false, 'null', 'Enable posting queue system'),
  ('onboarding_guard_live', false, 'null', 'Enable onboarding redirect guard (disabled by default)'),
  ('onboarding_v2_live', true, 'null', 'Enable Onboarding V2 system'),
  ('channel_linking_live', true, 'null', 'Enable social channel linking in onboarding')
on conflict (flag_name) do update set
  enabled = excluded.enabled,
  value = excluded.value,
  updated_at = now();

-- Function to check feature flags
create or replace function is_feature_enabled(p_flag_name text) returns boolean as $$
declare
  flag_enabled boolean;
begin
  select enabled into flag_enabled
  from feature_flags
  where flag_name = p_flag_name;
  
  return coalesce(flag_enabled, false);
end;
$$ language plpgsql;

-- Function to get feature flag value
create or replace function get_feature_value(p_flag_name text) returns jsonb as $$
declare
  flag_value jsonb;
begin
  select value into flag_value
  from feature_flags
  where flag_name = p_flag_name and enabled = true;
  
  return coalesce(flag_value, 'null'::jsonb);
end;
$$ language plpgsql;