-- Create user_consent_tracking table for DSGVO compliance
-- This table tracks all user consents for various purposes (upload, newsletter, etc.)

CREATE TABLE IF NOT EXISTS public.user_consent_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    ip_address TEXT,
    user_agent TEXT,
    consent_type TEXT NOT NULL CHECK (consent_type IN ('upload', 'vc', 'newsletter', 'analytics', 'marketing')),
    consent_given BOOLEAN NOT NULL DEFAULT true,
    meta JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_user_consent_tracking_user_id_type 
    ON public.user_consent_tracking(user_id, consent_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_consent_tracking_ip_type 
    ON public.user_consent_tracking(ip_address, consent_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_consent_tracking_type_created 
    ON public.user_consent_tracking(consent_type, created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.user_consent_tracking ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Allow anyone to insert consent (for anonymous users too)
CREATE POLICY "Allow consent insertion" ON public.user_consent_tracking
    FOR INSERT TO public
    WITH CHECK (true);

-- Allow users to read their own consent records
CREATE POLICY "Users can read own consent" ON public.user_consent_tracking
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

-- Allow admins to read all consent records
CREATE POLICY "Admins can read all consent" ON public.user_consent_tracking
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'super_admin')
        )
    );

-- Allow users to update their own consent (for consent withdrawal)
CREATE POLICY "Users can update own consent" ON public.user_consent_tracking
    FOR UPDATE TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_user_consent_tracking_updated_at
    BEFORE UPDATE ON public.user_consent_tracking
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Insert some example consent records for testing
-- (These will be replaced by real user consents)
INSERT INTO public.user_consent_tracking (
    user_id, 
    consent_type, 
    ip_address, 
    user_agent, 
    meta
) VALUES 
(
    (SELECT id FROM auth.users WHERE email = 'info@matbakh.app' LIMIT 1),
    'upload',
    '127.0.0.1',
    'Test User Agent',
    '{"source": "initial_setup", "version": "1.0"}'
) ON CONFLICT DO NOTHING;

-- Add comment for documentation
COMMENT ON TABLE public.user_consent_tracking IS 'DSGVO compliance table tracking user consents for various purposes';
COMMENT ON COLUMN public.user_consent_tracking.consent_type IS 'Type of consent: upload, vc, newsletter, analytics, marketing';
COMMENT ON COLUMN public.user_consent_tracking.consent_given IS 'Whether consent was given (true) or withdrawn (false)';
COMMENT ON COLUMN public.user_consent_tracking.meta IS 'Additional metadata like source, version, etc.';