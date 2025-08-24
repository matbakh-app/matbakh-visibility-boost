-- Add index optimization for better performance

-- Index for notes table performance
CREATE INDEX IF NOT EXISTS idx_notes_user_created_desc
  ON public.notes(user_id, created_at DESC);

-- Index for user_consent_tracking performance  
CREATE INDEX IF NOT EXISTS idx_user_consent_type_created_desc
  ON public.user_consent_tracking(user_id, consent_type, created_at DESC);

-- Index for visibility_check_leads token hash lookup
CREATE INDEX IF NOT EXISTS idx_visibility_leads_token_hash
  ON public.visibility_check_leads(confirm_token_hash);

-- Index for visibility_check_leads status queries
CREATE INDEX IF NOT EXISTS idx_visibility_leads_status_created
  ON public.visibility_check_leads(analysis_status, created_at DESC);

COMMENT ON INDEX idx_notes_user_created_desc IS 'Performance index for user notes with latest first ordering';
COMMENT ON INDEX idx_user_consent_type_created_desc IS 'Performance index for user consent queries';
COMMENT ON INDEX idx_visibility_leads_token_hash IS 'Fast lookup for token-based visibility check results';
COMMENT ON INDEX idx_visibility_leads_status_created IS 'Performance index for admin dashboard status queries';