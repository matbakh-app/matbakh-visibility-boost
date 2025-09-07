-- Phase 8.3 – DSGVO Validation Queries

-- 1) Recent uploads sanity
select id, user_id, s3_bucket, s3_key, content_type, file_size, checksum, uploaded_at
from user_uploads
order by uploaded_at desc
limit 20;

-- 2) No legacy URL columns are being used (should return 0 rows)
select table_name, column_name
from information_schema.columns
where column_name in ('avatar_url','logo_url','report_url','full_report_url')
  and table_schema not in ('pg_catalog','information_schema');

-- 3) Ensure new S3 columns exist and are populated (spot-check)
select count(*) filter (where avatar_s3_url is not null) as avatars,
       count(*) filter (where logo_s3_url   is not null) as logos
from business_profiles;

-- 4) Array fields exist & are jsonb (should return rows)
select table_name, column_name, data_type
from information_schema.columns
where (column_name like '%_s3_urls')
  and data_type = 'jsonb';

-- 5) Access control (manual check): verify app-level policies are enforced.
--    If you have RLS: list policy names for relevant tables
select polname as policy_name, schemaname || '.' || tablename as table, cmd, qual, with_check
from pg_policies
where tablename in ('user_uploads','business_profiles','visibility_check_leads')
order by table, policy_name;

-- 6) Log scan for PII (example patterns) – adapt to your log table if available
-- replace 'app_logs' with your table; else run CloudWatch Insights in AWS console
-- select *
-- from app_logs
-- where message ~* '(Bearer|Authorization|access_token|@|email=)'
-- order by timestamp desc
-- limit 50;
