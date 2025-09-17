-- Create vc_runs table if it doesn't exist
create table if not exists vc_runs (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null,
  place_id text not null,
  selected_candidate jsonb not null,
  result jsonb not null,
  analysis_type text not null default 'stub', -- 'stub' | 'bedrock'
  confidence numeric(3,2) default 0.8,
  created_at timestamptz default now()
);

-- Add indexes
create index if not exists idx_vc_runs_lead_id on vc_runs(lead_id);
create index if not exists idx_vc_runs_created_at on vc_runs(created_at desc);
create index if not exists idx_vc_runs_analysis_type on vc_runs(analysis_type);

-- Update business_partners status default
alter table business_partners 
alter column status set default 'pending';

-- Update existing null status values
update business_partners 
set status = 'pending' 
where status is null;