-- Enhanced Visibility Check Database Schema Migration
-- Adds missing fields for comprehensive analysis workflow

-- Add missing fields to visibility_check_results table
ALTER TABLE visibility_check_results 
ADD COLUMN IF NOT EXISTS overall_score INTEGER,
ADD COLUMN IF NOT EXISTS platform_analyses JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS benchmarks JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS category_insights JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS quick_wins JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS lead_potential TEXT,
ADD COLUMN IF NOT EXISTS analysis_results JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS instagram_candidates JSONB DEFAULT '[]'::jsonb;

-- Add missing fields to visibility_check_leads table
ALTER TABLE visibility_check_leads 
ADD COLUMN IF NOT EXISTS analysis_error_message TEXT,
ADD COLUMN IF NOT EXISTS report_url TEXT,
ADD COLUMN IF NOT EXISTS report_generated_at TIMESTAMP WITH TIME ZONE;

-- Create performance indexes
CREATE INDEX IF NOT EXISTS idx_visibility_results_lead_id ON visibility_check_results(lead_id);
CREATE INDEX IF NOT EXISTS idx_visibility_leads_status ON visibility_check_leads(status);
CREATE INDEX IF NOT EXISTS idx_visibility_leads_email ON visibility_check_leads(email);

-- Create visibility-reports storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES ('visibility-reports', 'visibility-reports', false, 10485760, ARRAY['application/pdf'])
ON CONFLICT (id) DO NOTHING;

-- Storage policies for visibility reports
CREATE POLICY "Users can view their own visibility reports" ON storage.objects
FOR SELECT USING (
  bucket_id = 'visibility-reports' AND (
    auth.uid()::text = (storage.foldername(name))[1] OR
    EXISTS (
      SELECT 1 FROM visibility_check_leads l 
      WHERE l.id::text = (storage.foldername(name))[1] 
      AND l.email = (auth.jwt() ->> 'email'::text)
      AND l.double_optin_confirmed = true
    )
  )
);

CREATE POLICY "System can manage visibility reports" ON storage.objects
FOR ALL USING (
  bucket_id = 'visibility-reports' AND auth.role() = 'service_role'
);

-- Status management trigger for automated workflow
CREATE OR REPLACE FUNCTION trigger_pdf_generation()
RETURNS trigger AS $$
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
$$ LANGUAGE plpgsql;

-- Create trigger on visibility_check_leads for automatic PDF generation
DROP TRIGGER IF EXISTS trigger_pdf_on_completion ON visibility_check_leads;
CREATE TRIGGER trigger_pdf_on_completion
  AFTER UPDATE ON visibility_check_leads
  FOR EACH ROW
  EXECUTE FUNCTION trigger_pdf_generation();

-- Health monitoring view for system oversight
CREATE OR REPLACE VIEW visibility_health_monitor AS
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