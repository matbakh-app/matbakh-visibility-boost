-- Onboarding Neutralization Script
-- This script sets all onboarding/profile completion flags to true
-- and activates business partners to prevent unwanted redirects
-- 
-- IMPORTANT: This script is idempotent and safe to run multiple times
-- Only run this when you want to disable onboarding redirects for existing users

begin;

-- Update partner_onboarding_steps progress to 100%
do $$ begin
  if exists (select 1 from information_schema.tables where table_schema='public' and table_name='partner_onboarding_steps') then
    update public.partner_onboarding_steps
      set progress_score = 100, updated_at = now()
      where coalesce(progress_score,0) < 100;
  end if;
end $$;

-- Update user_profile onboarding flags
do $$ begin
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='user_profile' and column_name='onboarding_complete') then
    update public.user_profile set onboarding_complete = true, updated_at = now()
    where coalesce(onboarding_complete,false) = false;
  end if;
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='user_profile' and column_name='profile_complete') then
    update public.user_profile set profile_complete = true, updated_at = now()
    where coalesce(profile_complete,false) = false;
  end if;
end $$;

-- Update profiles onboarding flags
do $$ begin
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='profiles' and column_name='onboarding_complete') then
    update public.profiles set onboarding_complete = true where coalesce(onboarding_complete,false) = false;
  end if;
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='profiles' and column_name='profile_complete') then
    update public.profiles set profile_complete = true where coalesce(profile_complete,false) = false;
  end if;
end $$;

-- Update business_partners status to active
do $$ begin
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='business_partners' and column_name='status') then
    update public.business_partners set status = 'active', updated_at = now()
    where status in ('pending','new','','created') or status is null;
  end if;
end $$;

-- Update business_partners onboarding_completed flag
do $$ begin
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='business_partners' and column_name='onboarding_completed') then
    update public.business_partners set onboarding_completed = true, updated_at = now()
    where coalesce(onboarding_completed,false) = false;
  end if;
end $$;

commit;

-- Optional verification query (uncomment to run)
/*
select 'partner_onboarding_steps' as table_name, count(*) filter (where progress_score>=100) as rows_done from public.partner_onboarding_steps where true
union all
select 'user_profile.onboarding_complete', count(*) from public.user_profile where onboarding_complete is true
union all
select 'user_profile.profile_complete', count(*) from public.user_profile where profile_complete is true
union all
select 'profiles.onboarding_complete', count(*) from public.profiles where onboarding_complete is true
union all
select 'profiles.profile_complete', count(*) from public.profiles where profile_complete is true
union all
select 'business_partners.active', count(*) from public.business_partners where status='active'
union all
select 'business_partners.onboarding_completed', count(*) from public.business_partners where onboarding_completed is true;
*/