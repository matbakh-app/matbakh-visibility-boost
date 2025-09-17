-- VC Result Tokens Table for Dashboard Access
-- This table stores tokens that allow access to VC results without authentication

CREATE TABLE IF NOT EXISTS public.vc_result_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text UNIQUE NOT NULL,
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_vc_result_tokens_token ON public.vc_result_tokens(token);
CREATE INDEX IF NOT EXISTS idx_vc_result_tokens_lead_id ON public.vc_result_tokens(lead_id);
CREATE INDEX IF NOT EXISTS idx_vc_result_tokens_expires_at ON public.vc_result_tokens(expires_at);

-- Enable RLS
ALTER TABLE public.vc_result_tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Allow public access for valid tokens (needed for unauthenticated VC result access)
DROP POLICY IF EXISTS "vc_result_tokens_public_select" ON public.vc_result_tokens;
CREATE POLICY "vc_result_tokens_public_select" ON public.vc_result_tokens
FOR SELECT TO anon, authenticated
USING (expires_at > now() AND used_at IS NULL);

-- Allow service role to insert/update tokens
DROP POLICY IF EXISTS "vc_result_tokens_service_all" ON public.vc_result_tokens;
CREATE POLICY "vc_result_tokens_service_all" ON public.vc_result_tokens
FOR ALL TO service_role
USING (true)
WITH CHECK (true);

-- Function to cleanup expired tokens (run periodically)
CREATE OR REPLACE FUNCTION cleanup_expired_vc_result_tokens()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.vc_result_tokens 
  WHERE expires_at < now() - interval '7 days';
END;
$$;

-- Grant necessary permissions
GRANT SELECT ON public.vc_result_tokens TO anon, authenticated;
GRANT ALL ON public.vc_result_tokens TO service_role;