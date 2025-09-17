-- ===========================
-- STEP 2: Policies + triggers + indexes
-- ===========================

-- Policies user_consent_tracking
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='user_consent_tracking'
      and policyname='own_consent_select'
  ) then
    create policy own_consent_select
      on public.user_consent_tracking
      for select
      using (auth.uid() is not null and auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='user_consent_tracking'
      and policyname='own_consent_insert'
  ) then
    create policy own_consent_insert
      on public.user_consent_tracking
      for insert
      with check (auth.uid() is not null and auth.uid() = user_id);
  end if;

  -- Pre-auth Writes NICHT erlauben; das läuft per Edge Function (service_role).
end $$;

-- Trigger
drop trigger if exists set_timestamp_on_consent on public.user_consent_tracking;
create trigger set_timestamp_on_consent
before update on public.user_consent_tracking
for each row execute function public.trigger_set_timestamp();

-- Indizes
create index if not exists idx_user_consent_user       on public.user_consent_tracking(user_id);
create index if not exists idx_user_consent_partner    on public.user_consent_tracking(partner_id);
create index if not exists idx_user_consent_type       on public.user_consent_tracking(consent_type);
create index if not exists idx_user_consent_created_at on public.user_consent_tracking(created_at);

comment on table public.user_consent_tracking is
  'Tracks user consents. Pre-auth writes via Edge (service_role).';


-- Policies notes
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='notes'
      and policyname='own_notes_select'
  ) then
    create policy own_notes_select
      on public.notes for select
      using (auth.uid() is not null and auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='notes'
      and policyname='own_notes_insert'
  ) then
    create policy own_notes_insert
      on public.notes for insert
      with check (auth.uid() is not null and auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='notes'
      and policyname='own_notes_update'
  ) then
    create policy own_notes_update
      on public.notes for update
      using (auth.uid() is not null and auth.uid() = user_id)
      with check (auth.uid() is not null and auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='notes'
      and policyname='own_notes_delete'
  ) then
    create policy own_notes_delete
      on public.notes for delete
      using (auth.uid() is not null and auth.uid() = user_id);
  end if;
end $$;

drop trigger if exists set_timestamp_on_notes on public.notes;
create trigger set_timestamp_on_notes
before update on public.notes
for each row execute function public.trigger_set_timestamp();

create index if not exists idx_notes_user       on public.notes(user_id);
create index if not exists idx_notes_created_at on public.notes(created_at);

comment on table public.notes is
  'Simple user notes with per-user RLS.';