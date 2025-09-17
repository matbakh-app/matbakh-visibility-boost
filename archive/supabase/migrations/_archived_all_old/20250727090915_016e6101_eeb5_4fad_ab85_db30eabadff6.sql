-- Make partner_id nullable for visibility check jobs that don't have a partner
ALTER TABLE google_job_queue 
ALTER COLUMN partner_id DROP NOT NULL;