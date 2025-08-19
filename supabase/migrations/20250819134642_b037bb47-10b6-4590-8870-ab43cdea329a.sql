-- category_search_logs (clientseitige Writes)
create table if not exists public.category_search_logs (
  id uuid primary key default gen_random_uuid(),
  search_term text,
  selected_main_categories text[],
  result_category_ids text[],
  selected_category_id text,
  user_id uuid references auth.users(id) on delete set null,
  search_timestamp timestamptz not null default now()
);

create index if not exists idx_cat_search_logs_user_time on public.category_search_logs(user_id, search_timestamp desc);

alter table public.category_search_logs enable row level security;

drop policy if exists "Users can create search logs" on public.category_search_logs;
create policy "Users can create search logs" on public.category_search_logs for insert to anon, authenticated with check (true);

drop policy if exists "Users can view their own search logs" on public.category_search_logs;
create policy "Users can view their own search logs" on public.category_search_logs for select using (auth.uid() = user_id);

drop policy if exists "Admins can view all search logs" on public.category_search_logs;
create policy "Admins can view all search logs" on public.category_search_logs for select using (
  exists (
    select 1 from profiles 
    where profiles.id = auth.uid() and profiles.role = 'admin'
  )
);

-- lead_events (für useLeadTracking)
create table if not exists public.lead_events (
  id uuid primary key default gen_random_uuid(),
  email text,
  business_name text,
  event_type text not null,
  event_time timestamptz not null default now(),
  event_payload jsonb,
  user_id uuid references auth.users(id) on delete set null,
  partner_id uuid references public.business_partners(id) on delete set null,
  facebook_event_id text,
  response_status int,
  success boolean default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_lead_events_partner_time on public.lead_events(partner_id, event_time desc);

alter table public.lead_events enable row level security;

drop policy if exists "System can manage lead events" on public.lead_events;
create policy "System can manage lead events" on public.lead_events for all using (auth.role() = 'service_role');

drop policy if exists "Partners can view own lead events" on public.lead_events;  
create policy "Partners can view own lead events" on public.lead_events for select using (
  partner_id in (
    select id from business_partners where user_id = auth.uid()
  )
);