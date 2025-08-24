-- Task 1: Notes table schema repair (UUID PK, content, user_id, RLS)

create extension if not exists pgcrypto;

create or replace function public.trigger_set_timestamp()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- fehlende Spalten
alter table public.notes
  add column if not exists content    text,
  add column if not exists user_id    uuid,
  add column if not exists updated_at timestamptz not null default now();

-- FK user_id -> auth.users (idempotent)
do $$
begin
  if not exists (
    select 1 from information_schema.table_constraints
    where table_schema='public' and table_name='notes'
      and constraint_name='notes_user_id_fkey'
  ) then
    alter table public.notes
      add constraint notes_user_id_fkey
      foreign key (user_id) references auth.users(id) on delete set null;
  end if;
end $$;

-- Titel-Constraint defensiv (NOT VALID) + coalesce/btrim
do $$
begin
  if not exists (
    select 1 from information_schema.table_constraints
    where table_schema='public' and table_name='notes'
      and constraint_name='notes_title_chk'
  ) then
    alter table public.notes
      add constraint notes_title_chk
      check (coalesce(length(btrim(title)),0) > 0)
      not valid;
  end if;
end $$;

-- bigint -> uuid Migration nur falls nötig
do $$
declare is_bigint boolean;
begin
  select exists(
    select 1 from information_schema.columns
    where table_schema='public' and table_name='notes'
      and column_name='id' and data_type='bigint'
  ) into is_bigint;

  if is_bigint then
    -- Abbruch, falls externe FKs auf notes.id existieren
    if exists (
      select 1
      from pg_constraint c
      join pg_class t on t.oid = c.confrelid
      join pg_namespace n on n.oid = t.relnamespace
      where c.contype='f' and n.nspname='public' and t.relname='notes'
    ) then
      raise exception 'notes.id (bigint) wird extern referenziert. FKs zuerst migrieren.';
    end if;

    alter table public.notes add column if not exists id_new uuid default gen_random_uuid();
    update public.notes set id_new = gen_random_uuid() where id_new is null;

    -- alten PK entfernen (Name dynamisch ermitteln)
    do $inner$
    declare pk_name text;
    begin
      select conname into pk_name
      from pg_constraint
      where conrelid = 'public.notes'::regclass and contype='p';
      if pk_name is not null then
        execute format('alter table public.notes drop constraint %I', pk_name);
      end if;
    end
    $inner$;

    alter table public.notes drop column id cascade;
    alter table public.notes rename column id_new to id;
    alter table public.notes alter column id set not null;
    alter table public.notes add constraint notes_pkey primary key (id);
  end if;
end $$;

-- RLS + Policies (idempotent)
alter table public.notes enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='notes' and policyname='own_notes_select') then
    create policy own_notes_select on public.notes for select
      using (auth.uid() is not null and auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='notes' and policyname='own_notes_insert') then
    create policy own_notes_insert on public.notes for insert
      with check (auth.uid() is not null and auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='notes' and policyname='own_notes_update') then
    create policy own_notes_update on public.notes for update
      using (auth.uid() is not null and auth.uid() = user_id)
      with check (auth.uid() is not null and auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='notes' and policyname='own_notes_delete') then
    create policy own_notes_delete on public.notes for delete
      using (auth.uid() is not null and auth.uid() = user_id);
  end if;
end $$;

-- Trigger + Index
drop trigger if exists set_timestamp_on_notes on public.notes;
create trigger set_timestamp_on_notes
before update on public.notes
for each row execute function public.trigger_set_timestamp();

create index if not exists idx_notes_user_created_desc
  on public.notes(user_id, created_at desc);

comment on table public.notes is 'User notes with UUID PK, RLS per user, updated_at trigger.';