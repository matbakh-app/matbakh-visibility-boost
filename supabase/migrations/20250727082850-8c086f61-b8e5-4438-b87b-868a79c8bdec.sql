-- Fix Security Issues from the linter

-- Fix the trigger function by setting search path properly
CREATE OR REPLACE FUNCTION trigger_pdf_generation()
RETURNS trigger 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only trigger PDF generation when status changes to 'completed'
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    -- Insert job into a queue or call PDF generation function
    INSERT INTO google_job_queue (job_type, partner_id, payload, status)
    VALUES (
      'generate_visibility_report',
      NULL,
      jsonb_build_object('lead_id', NEW.id, 'email', NEW.email),
      'pending'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Fix the health monitoring view by making it a regular view instead of security definer
DROP VIEW IF EXISTS visibility_health_monitor;
CREATE VIEW visibility_health_monitor AS
SELECT 
  DATE(created_at) as check_date,
  COUNT(*) as total_leads,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_leads,
  COUNT(CASE WHEN status = 'analyzing' THEN 1 END) as analyzing_leads,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_leads,
  COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_leads,
  COUNT(CASE WHEN report_url IS NOT NULL THEN 1 END) as reports_generated,
  COUNT(CASE WHEN status = 'completed' AND report_url IS NULL THEN 1 END) as missing_reports,
  COUNT(CASE WHEN created_at < NOW() - INTERVAL '30 minutes' AND status = 'pending' THEN 1 END) as stale_pending
FROM visibility_check_leads
WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY check_date DESC;