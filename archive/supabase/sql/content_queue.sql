create table if not exists content_queue (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null,
  channel text not null check (channel in ('gmb','facebook','instagram')),
  payload jsonb not null,
  status text not null default 'pending' check (status in ('pending','posted','failed')),
  content_hash text,
  created_at timestamptz default now(),
  posted_at timestamptz,
  error text
);

-- Indexes for performance
create index if not exists idx_content_queue_status on content_queue(status);
create index if not exists idx_content_queue_business_id on content_queue(business_id);
create index if not exists idx_content_queue_created_at on content_queue(created_at desc);
create index if not exists idx_content_queue_content_hash on content_queue(content_hash);

-- Function to enqueue content with deduplication
create or replace function enqueue_content(
  p_business_id uuid,
  p_channel text,
  p_payload jsonb
) returns uuid as $$
declare
  content_hash text;
  queue_id uuid;
  existing_id uuid;
begin
  -- Generate content hash for deduplication
  content_hash := md5(p_payload::text);
  
  -- Check for existing pending content
  select id into existing_id
  from content_queue
  where business_id = p_business_id
    and channel = p_channel
    and content_hash = content_hash
    and status = 'pending';
  
  if existing_id is not null then
    return existing_id;
  end if;
  
  -- Insert new content
  queue_id := gen_random_uuid();
  
  insert into content_queue (
    id, business_id, channel, payload, content_hash
  ) values (
    queue_id, p_business_id, p_channel, p_payload, content_hash
  );
  
  return queue_id;
end;
$$ language plpgsql;