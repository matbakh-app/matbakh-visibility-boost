-- Business Identification System
create table if not exists business_candidates (
  id uuid primary key default gen_random_uuid(),
  tracking_id text not null,
  place_id text not null,
  name text not null,
  address text not null,
  phone text,
  website text,
  category text,
  confidence numeric(3,2) not null, -- 0.00 to 1.00
  source text not null, -- 'google_places' | 'meta_graph' | 'tripadvisor' | 'yelp'
  raw_data jsonb not null,
  created_at timestamptz default now()
);

-- Evidence store for all data sources
create table if not exists business_evidence (
  id uuid primary key default gen_random_uuid(),
  tracking_id text not null,
  place_id text not null,
  source text not null, -- 'google_places' | 'meta_graph' | 'tripadvisor' | 'yelp' | 'website'
  source_url text not null,
  data_type text not null, -- 'profile' | 'reviews' | 'photos' | 'posts' | 'hours' | 'menu'
  content jsonb not null,
  content_hash text not null, -- for deduplication
  confidence numeric(3,2),
  collected_at timestamptz default now(),
  metadata jsonb default '{}'::jsonb
);

-- Selected business for analysis
create table if not exists business_selections (
  tracking_id text primary key,
  place_id text not null,
  selected_candidate jsonb not null,
  user_confirmed boolean default false,
  selected_at timestamptz default now()
);

-- Indexes
create index if not exists idx_business_candidates_tracking_id on business_candidates(tracking_id);
create index if not exists idx_business_candidates_place_id on business_candidates(place_id);
create index if not exists idx_business_evidence_tracking_id on business_evidence(tracking_id);
create index if not exists idx_business_evidence_place_id on business_evidence(place_id);
create index if not exists idx_business_evidence_content_hash on business_evidence(content_hash);

-- Function to store business candidates with fuzzy matching
create or replace function store_business_candidates(
  p_tracking_id text,
  p_search_query text,
  p_candidates jsonb
) returns void as $$
declare
  candidate jsonb;
begin
  -- Clear existing candidates for this tracking_id
  delete from business_candidates where tracking_id = p_tracking_id;
  
  -- Insert new candidates
  for candidate in select * from jsonb_array_elements(p_candidates)
  loop
    insert into business_candidates (
      tracking_id, place_id, name, address, phone, website, category, confidence, source, raw_data
    ) values (
      p_tracking_id,
      candidate->>'place_id',
      candidate->>'name',
      candidate->>'address',
      candidate->>'phone',
      candidate->>'website',
      candidate->>'category',
      (candidate->>'confidence')::numeric,
      candidate->>'source',
      candidate
    );
  end loop;
end;
$$ language plpgsql;

-- Function to calculate fuzzy match confidence
create or replace function calculate_fuzzy_confidence(
  p_search_name text,
  p_candidate_name text,
  p_search_address text,
  p_candidate_address text
) returns numeric as $$
declare
  name_similarity numeric;
  address_similarity numeric;
  final_confidence numeric;
begin
  -- Simple similarity calculation (in production, use more sophisticated algorithms)
  name_similarity := similarity(lower(p_search_name), lower(p_candidate_name));
  address_similarity := similarity(lower(p_search_address), lower(p_candidate_address));
  
  -- Weighted average (name is more important)
  final_confidence := (name_similarity * 0.7) + (address_similarity * 0.3);
  
  return least(1.0, greatest(0.0, final_confidence));
end;
$$ language plpgsql;

-- Function to store evidence from multiple sources
create or replace function store_business_evidence(
  p_tracking_id text,
  p_place_id text,
  p_source text,
  p_source_url text,
  p_data_type text,
  p_content jsonb,
  p_confidence numeric default null
) returns uuid as $$
declare
  content_hash text;
  evidence_id uuid;
  existing_id uuid;
begin
  -- Generate content hash for deduplication
  content_hash := md5(p_content::text);
  
  -- Check for existing evidence
  select id into existing_id
  from business_evidence
  where tracking_id = p_tracking_id
    and place_id = p_place_id
    and source = p_source
    and content_hash = content_hash;
  
  if existing_id is not null then
    return existing_id;
  end if;
  
  -- Insert new evidence
  evidence_id := gen_random_uuid();
  
  insert into business_evidence (
    id, tracking_id, place_id, source, source_url, data_type, content, content_hash, confidence
  ) values (
    evidence_id, p_tracking_id, p_place_id, p_source, p_source_url, p_data_type, p_content, content_hash, p_confidence
  );
  
  return evidence_id;
end;
$$ language plpgsql;

-- Enable pg_trgm extension for fuzzy matching
create extension if not exists pg_trgm;