-- GMB Categories Taxonomy – Bootstrap (idempotent)
begin;

create extension if not exists pg_trgm;
create extension if not exists unaccent;
create extension if not exists pgcrypto;

-- Generic updated_at trigger
create or replace function public.set_updated_at()
returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Sync parent_id <-> parent_category_id (optional convenience)
create or replace function public.sync_gmb_parent_refs()
returns trigger
language plpgsql as $$
declare
  p_id bigint;
begin
  -- if parent_category_id is set but parent_id is null: try to resolve
  if new.parent_category_id is not null and (new.parent_id is null or new.parent_id = 0) then
    select public_id into p_id from public.gmb_categories where category_id = new.parent_category_id;
    if found then new.parent_id = p_id; end if;
  end if;
  
  -- if parent_id set but parent_category_id null: backfill code
  if new.parent_id is not null and new.parent_category_id is null then
    select category_id into new.parent_category_id from public.gmb_categories where public_id = new.parent_id;
  end if;
  
  return new;
end
$$;

-- Master table
create table if not exists public.gmb_categories (
  public_id         bigserial primary key,
  
  -- Top-level labels (keine FK-Pflicht, reine Anzeige/Clustering)
  haupt_kategorie   text,                      -- de
  main_category     text,                      -- en
  
  -- Canonical code & names
  category_id       text not null unique,      -- z.B. 'gcid_restaurant' oder eigener Code
  name_de           text not null,
  name_en           text not null,
  
  -- Taxonomy flags
  is_popular        boolean not null default false,
  is_primary        boolean not null default false,
  sort_order        integer not null default 0,
  
  -- Hierarchy (optional dual ref: numeric id + code)
  parent_id         bigint references public.gmb_categories(public_id) on delete set null,
  parent_category_id text,
  
  -- Path & meta
  category_path     text,
  country_availability text[] default null,    -- z.B. {'DE','AT','CH'}
  synonyms          text[] default null,
  keywords          text[] default null,
  
  -- Descriptions
  description_de    text,
  description_en    text,
  
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  
  -- Generated search vectors (simple analyzer; unaccent via function below)
  search_de tsvector generated always as (
    to_tsvector('simple',
      coalesce(name_de,'') || ' ' ||
      coalesce(array_to_string(synonyms,' '),'') || ' ' ||
      coalesce(array_to_string(keywords,' '),'') || ' ' ||
      coalesce(description_de,'') || ' ' ||
      coalesce(haupt_kategorie,'')
    )
  ) stored,
  search_en tsvector generated always as (
    to_tsvector('simple',
      coalesce(name_en,'') || ' ' ||
      coalesce(array_to_string(synonyms,' '),'') || ' ' ||
      coalesce(array_to_string(keywords,' '),'') || ' ' ||
      coalesce(description_en,'') || ' ' ||
      coalesce(main_category,'')
    )
  ) stored
);

-- Triggers
drop trigger if exists trg_gmb_categories_updated on public.gmb_categories;
create trigger trg_gmb_categories_updated
  before update on public.gmb_categories
  for each row execute procedure public.set_updated_at();

drop trigger if exists trg_gmb_categories_sync_parent on public.gmb_categories;
create trigger trg_gmb_categories_sync_parent
  before insert or update on public.gmb_categories
  for each row execute procedure public.sync_gmb_parent_refs();

-- Indexes
create index if not exists idx_gmb_categories_code on public.gmb_categories (category_id);
create index if not exists idx_gmb_categories_parent on public.gmb_categories (parent_id);
create index if not exists idx_gmb_categories_sort on public.gmb_categories (sort_order);
create index if not exists idx_gmb_categories_name_de on public.gmb_categories using gin (name_de gin_trgm_ops);
create index if not exists idx_gmb_categories_name_en on public.gmb_categories using gin (name_en gin_trgm_ops);
create index if not exists idx_gmb_categories_synonyms on public.gmb_categories using gin (synonyms);
create index if not exists idx_gmb_categories_keywords on public.gmb_categories using gin (keywords);
create index if not exists idx_gmb_categories_search_de on public.gmb_categories using gin (search_de);
create index if not exists idx_gmb_categories_search_en on public.gmb_categories using gin (search_en);

-- RLS: Public read-only, admin/service write
alter table public.gmb_categories enable row level security;

-- Everyone can read (anon + authenticated)
drop policy if exists "gmb_categories public read" on public.gmb_categories;
create policy "gmb_categories public read" on public.gmb_categories
  for select to anon, authenticated using (true);

-- Admin/service can write
drop policy if exists "gmb_categories admin write" on public.gmb_categories;
create policy "gmb_categories admin write" on public.gmb_categories
  for all to authenticated using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','super_admin'))
  ) with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','super_admin'))
  );

-- Cross-tags: map any category to additional main-category anchors with confidence
create table if not exists public.category_cross_tags (
  id bigserial primary key,
  category_id text not null references public.gmb_categories(category_id) on delete cascade,
  target_main_category_id text not null references public.gmb_categories(category_id) on delete cascade,
  confidence_score numeric not null default 1.0 check (confidence_score >= 0 and confidence_score <= 1),
  notes text,
  created_at timestamptz not null default now()
);
create unique index if not exists uq_cross_tag on public.category_cross_tags (category_id, target_main_category_id);

alter table public.category_cross_tags enable row level security;

-- Public can read (for VC Public dashboard explanations)
drop policy if exists "cross_tags public read" on public.category_cross_tags;
create policy "cross_tags public read" on public.category_cross_tags
  for select to anon, authenticated using (true);

-- Admin/service write
drop policy if exists "cross_tags admin write" on public.category_cross_tags;
create policy "cross_tags admin write" on public.category_cross_tags
  for all to authenticated using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','super_admin'))
  ) with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','super_admin'))
  );

-- Seed example (idempotent)
insert into public.gmb_categories (
  public_id, haupt_kategorie, main_category,
  category_id, name_de, name_en,
  is_popular, sort_order, parent_category_id,
  is_primary, parent_id, category_path,
  synonyms, country_availability,
  description_de, description_en,
  keywords, created_at, updated_at
) values (
  100,
  'Land- und Forstwirtschaft, natürliche Ressourcen',
  'Agriculture & Natural Resources',
  'agri_cultural',
  'Landwirtschaft', 'Agriculture',
  true, 10, null,
  true, null, 'Agriculture & Natural Resources',
  null, array['DE','AT','CH'],
  'Die Kategorie Landwirtschaft umfasst den Anbau von Nutzpflanzen und die Viehzucht zur Lebensmittelproduktion. Sie schließt moderne und traditionelle Methoden ein und bildet die Grundlage der Nahrungsmittelversorgung. Zielgruppe sind Produzenten, Großhändler und Konsumenten.',
  'The agricultural category covers crop cultivation and livestock farming for food production. It includes both modern and traditional methods and forms the basis of food supply. Target groups are producers, wholesalers, and consumers.',
  array['agriculture','farming','landwirtschaft'],
  timestamptz '2025-07-25 11:10:05+02',
  timestamptz '2025-07-25 11:10:05+02'
) on conflict (category_id) do update set
  haupt_kategorie = excluded.haupt_kategorie,
  main_category = excluded.main_category,
  name_de = excluded.name_de,
  name_en = excluded.name_en,
  is_popular = excluded.is_popular,
  sort_order = excluded.sort_order,
  is_primary = excluded.is_primary,
  category_path = excluded.category_path,
  country_availability = excluded.country_availability,
  description_de = excluded.description_de,
  description_en = excluded.description_en,
  keywords = excluded.keywords;

commit;