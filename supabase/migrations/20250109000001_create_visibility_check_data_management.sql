-- ================================================================
-- Visibility Check Data Management - End-to-End Flow
-- GDPR-Compliant Data Management System
-- ================================================================

BEGIN;

-- ================================================================
-- 1. E-Mail-Erhebung & Double Opt-In System
-- ================================================================

CREATE TABLE IF NOT EXISTS public.visibility_check_leads (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email text NOT NULL,
    confirm_token_hash text NOT NULL UNIQUE,
    confirm_expires_at timestamptz NOT NULL,
    confirmed boolean DEFAULT false,
    confirmed_at timestamptz,
    analysis_status text NOT NULL DEFAULT 'pending_opt_in' 
        CHECK (analysis_status IN (
            'pending_opt_in', 
            'confirmed', 
            'data_collection', 
            'ai_analysis', 
            'completed', 
            'failed'
        )),
    language text DEFAULT 'de' CHECK (language IN ('de', 'en')),
    ip_address inet,
    user_agent text,
    referrer_url text,
    utm_source text,
    utm_medium text,
    utm_campaign text,
    retention_policy text DEFAULT 'standard' CHECK (retention_policy IN ('standard', 'long')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz,
    
    -- Indexes for performance
    CONSTRAINT unique_active_email UNIQUE (email) WHERE deleted_at IS NULL
);

-- Index for token lookups
CREATE INDEX IF NOT EXISTS idx_visibility_check_leads_token 
    ON public.visibility_check_leads (confirm_token_hash) 
    WHERE confirmed = false AND confirm_expires_at > now();

-- Index for cleanup operations
CREATE INDEX IF NOT EXISTS idx_visibility_check_leads_cleanup 
    ON public.visibility_check_leads (created_at, retention_policy) 
    WHERE deleted_at IS NULL;

-- ================================================================
-- 2. Business Context Data Storage
-- ================================================================

CREATE TABLE IF NOT EXISTS public.visibility_check_context_data (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id uuid NOT NULL REFERENCES public.visibility_check_leads(id) ON DELETE CASCADE,
    
    -- Business Information
    business_name text,
    business_description text,
    
    -- Location Data (separated for flexibility)
    street_address text,
    city text,
    state_province text,
    postal_code text,
    country text DEFAULT 'DE',
    latitude decimal(10,8),
    longitude decimal(11,8),
    
    -- Category Information
    main_category text,
    sub_categories text[], -- Array of category IDs
    
    -- Online Presence URLs
    website_url text,
    instagram_url text,
    facebook_url text,
    gmb_url text,
    tripadvisor_url text,
    yelp_url text,
    
    -- Benchmark Competitors (up to 5)
    benchmark_urls text[],
    
    -- AI Analysis Context
    persona_type text CHECK (persona_type IN (
        'Solo-Sarah', 'Bewahrer-Ben', 'Wachstums-Walter', 'Ketten-Katrin',
        'Der-Skeptiker', 'Der-Zeitknappe', 'Der-Profi', 'Der-Überforderte'
    )),
    user_goal text,
    priority_areas text[], -- Areas of focus for analysis
    
    -- Data Quality Tracking
    data_completeness_score integer CHECK (data_completeness_score >= 0 AND data_completeness_score <= 100),
    missing_fields text[],
    
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Index for lead lookups
CREATE INDEX IF NOT EXISTS idx_visibility_check_context_lead 
    ON public.visibility_check_context_data (lead_id);

-- ================================================================
-- 3. AI Action Logs - Comprehensive Audit Trail
-- ================================================================

CREATE TABLE IF NOT EXISTS public.ai_action_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id uuid REFERENCES public.visibility_check_leads(id) ON DELETE SET NULL,
    
    -- Request Information
    request_type text NOT NULL CHECK (request_type IN (
        'visibility_check', 'persona_detection', 'content_generation', 
        'framework_analysis', 'data_completion', 'benchmark_analysis'
    )),
    request_id text, -- For correlation across multiple calls
    
    -- AI Provider Information
    provider text NOT NULL CHECK (provider IN ('claude-3.5-sonnet', 'gemini-pro', 'gpt-4')),
    model_version text,
    
    -- Prompt and Response
    prompt_template_id text,
    prompt_hash text, -- SHA-256 of the actual prompt for audit
    prompt_variables jsonb, -- Variables used in template
    
    -- Response Data
    raw_response text, -- Full AI response
    structured_response jsonb, -- Parsed/structured data
    
    -- Performance Metrics
    token_usage_input integer,
    token_usage_output integer,
    response_time_ms integer,
    cost_estimate_cents integer,
    
    -- Quality Metrics
    confidence_score decimal(3,2), -- 0.00 to 1.00
    quality_score decimal(3,2), -- 0.00 to 1.00
    
    -- Error Handling
    error_occurred boolean DEFAULT false,
    error_type text,
    error_message text,
    retry_count integer DEFAULT 0,
    
    -- GDPR Compliance
    contains_pii boolean DEFAULT false,
    pii_redacted boolean DEFAULT false,
    redaction_log jsonb,
    
    -- Audit Trail
    user_id uuid, -- If user is logged in
    session_id text,
    ip_address inet,
    user_agent text,
    
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for performance and audit queries
CREATE INDEX IF NOT EXISTS idx_ai_action_logs_lead 
    ON public.ai_action_logs (lead_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_action_logs_request 
    ON public.ai_action_logs (request_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_action_logs_cost 
    ON public.ai_action_logs (created_at, cost_estimate_cents) 
    WHERE cost_estimate_cents IS NOT NULL;

-- ================================================================
-- 4. Analysis Results Storage
-- ================================================================

CREATE TABLE IF NOT EXISTS public.visibility_check_results (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id uuid NOT NULL REFERENCES public.visibility_check_leads(id) ON DELETE CASCADE,
    
    -- Overall Scoring
    summary_score integer CHECK (summary_score >= 0 AND summary_score <= 100),
    platform_scores jsonb, -- {"google": 85, "social": 70, "website": 60}
    
    -- SWOT Analysis
    strengths text[],
    weaknesses text[],
    opportunities text[],
    threats text[],
    
    -- Strategic Framework Results
    porters_five_forces jsonb,
    balanced_scorecard jsonb,
    hofstede_dimensions jsonb,
    nutzwertanalyse jsonb,
    
    -- Content Analysis
    content_suggestions text[],
    content_gaps text[],
    seasonal_opportunities text[],
    
    -- Competitive Analysis
    benchmark_results jsonb,
    competitive_position text,
    market_opportunities text[],
    
    -- Actionable Recommendations
    quick_wins jsonb[], -- [{"action": "...", "impact": "high", "effort": "low", "timeline": "1 week"}]
    strategic_initiatives jsonb[],
    priority_actions jsonb[],
    
    -- Performance Metrics
    profile_health_score integer CHECK (profile_health_score >= 0 AND profile_health_score <= 100),
    visibility_trend text CHECK (visibility_trend IN ('improving', 'stable', 'declining')),
    
    -- Complete AI Analysis (for debugging/audit)
    analysis_json jsonb, -- Full Claude response
    analysis_metadata jsonb, -- Processing metadata
    
    -- Quality Assurance
    analysis_confidence decimal(3,2),
    data_quality_score integer,
    completeness_percentage integer,
    
    -- Versioning
    version integer DEFAULT 1,
    previous_version_id uuid REFERENCES public.visibility_check_results(id),
    
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Index for lead lookups and versioning
CREATE INDEX IF NOT EXISTS idx_visibility_check_results_lead 
    ON public.visibility_check_results (lead_id, version DESC);

-- ================================================================
-- 5. User Consent Tracking (GDPR Compliance)
-- ================================================================

CREATE TABLE IF NOT EXISTS public.user_consent_tracking (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id uuid REFERENCES public.visibility_check_leads(id) ON DELETE CASCADE,
    email text NOT NULL,
    
    -- Consent Details
    consent_type text NOT NULL CHECK (consent_type IN (
        'email_collection', 'data_analysis', 'marketing_communication', 
        'data_retention', 'third_party_sharing'
    )),
    consent_given boolean NOT NULL,
    consent_method text NOT NULL CHECK (consent_method IN (
        'double_opt_in', 'checkbox', 'button_click', 'form_submission'
    )),
    
    -- Legal Basis
    legal_basis text CHECK (legal_basis IN (
        'consent', 'legitimate_interest', 'contract', 'legal_obligation'
    )),
    
    -- Consent Context
    consent_text text, -- The actual consent text shown to user
    privacy_policy_version text,
    terms_version text,
    
    -- Technical Details
    ip_address inet,
    user_agent text,
    timestamp_utc timestamptz NOT NULL DEFAULT now(),
    
    -- Withdrawal Tracking
    withdrawn boolean DEFAULT false,
    withdrawn_at timestamptz,
    withdrawal_method text,
    
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for consent lookups and GDPR queries
CREATE INDEX IF NOT EXISTS idx_user_consent_tracking_lead 
    ON public.user_consent_tracking (lead_id, consent_type);

CREATE INDEX IF NOT EXISTS idx_user_consent_tracking_email 
    ON public.user_consent_tracking (email, consent_type, consent_given);

-- ================================================================
-- 6. Admin Follow-up Management
-- ================================================================

CREATE TABLE IF NOT EXISTS public.visibility_check_followups (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id uuid NOT NULL REFERENCES public.visibility_check_leads(id) ON DELETE CASCADE,
    
    -- Follow-up Status
    status text NOT NULL DEFAULT 'new' CHECK (status IN (
        'new', 'contacted', 'interested', 'qualified', 'converted', 
        'not_interested', 'unresponsive', 'invalid'
    )),
    
    -- Contact Information
    contact_method text CHECK (contact_method IN ('email', 'phone', 'whatsapp', 'linkedin')),
    contact_attempts integer DEFAULT 0,
    last_contact_at timestamptz,
    next_contact_at timestamptz,
    
    -- Lead Qualification
    lead_score integer CHECK (lead_score >= 0 AND lead_score <= 100),
    qualification_notes text,
    business_size text CHECK (business_size IN ('solo', 'small', 'medium', 'large', 'chain')),
    budget_range text,
    decision_timeline text,
    
    -- Conversion Tracking
    converted_to_customer boolean DEFAULT false,
    conversion_date timestamptz,
    conversion_value_cents integer,
    service_package text,
    
    -- Admin Notes
    admin_notes text,
    internal_tags text[],
    assigned_to uuid, -- Reference to admin user
    
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Index for admin dashboard queries
CREATE INDEX IF NOT EXISTS idx_visibility_check_followups_status 
    ON public.visibility_check_followups (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_visibility_check_followups_contact 
    ON public.visibility_check_followups (next_contact_at) 
    WHERE status IN ('new', 'contacted', 'interested');

-- ================================================================
-- 7. Automated Cleanup Functions
-- ================================================================

-- Function to automatically delete expired leads (GDPR compliance)
CREATE OR REPLACE FUNCTION cleanup_expired_visibility_check_data()
RETURNS void AS $$
BEGIN
    -- Delete leads older than 180 days (standard retention)
    UPDATE public.visibility_check_leads 
    SET deleted_at = now(),
        email = 'deleted_' || id::text || '@privacy.local'
    WHERE retention_policy = 'standard' 
        AND created_at < now() - interval '180 days'
        AND deleted_at IS NULL;
    
    -- Delete unconfirmed leads older than 30 days
    UPDATE public.visibility_check_leads 
    SET deleted_at = now(),
        email = 'deleted_' || id::text || '@privacy.local'
    WHERE confirmed = false 
        AND created_at < now() - interval '30 days'
        AND deleted_at IS NULL;
    
    -- Clean up expired confirmation tokens
    UPDATE public.visibility_check_leads 
    SET confirm_token_hash = 'expired_' || extract(epoch from now())::text
    WHERE confirmed = false 
        AND confirm_expires_at < now()
        AND confirm_token_hash NOT LIKE 'expired_%';
        
    RAISE NOTICE 'Cleanup completed at %', now();
END;
$$ LANGUAGE plpgsql;

-- Function to anonymize user data (GDPR right to be forgotten)
CREATE OR REPLACE FUNCTION anonymize_visibility_check_lead(lead_email text)
RETURNS boolean AS $$
DECLARE
    lead_record record;
    anonymized_id text;
BEGIN
    -- Find the lead
    SELECT * INTO lead_record 
    FROM public.visibility_check_leads 
    WHERE email = lead_email AND deleted_at IS NULL;
    
    IF NOT FOUND THEN
        RETURN false;
    END IF;
    
    -- Generate anonymized identifier
    anonymized_id := 'anon_' || encode(digest(lead_record.id::text, 'sha256'), 'hex')[:16];
    
    -- Anonymize lead data
    UPDATE public.visibility_check_leads 
    SET 
        email = anonymized_id || '@anonymized.local',
        ip_address = NULL,
        user_agent = 'anonymized',
        referrer_url = NULL,
        utm_source = NULL,
        utm_medium = NULL,
        utm_campaign = NULL,
        deleted_at = now()
    WHERE id = lead_record.id;
    
    -- Anonymize context data
    UPDATE public.visibility_check_context_data 
    SET 
        business_name = 'Anonymized Business',
        business_description = NULL,
        street_address = NULL,
        website_url = NULL,
        instagram_url = NULL,
        facebook_url = NULL
    WHERE lead_id = lead_record.id;
    
    -- Mark AI logs as anonymized
    UPDATE public.ai_action_logs 
    SET 
        ip_address = NULL,
        user_agent = 'anonymized',
        prompt_variables = jsonb_build_object('anonymized', true)
    WHERE lead_id = lead_record.id;
    
    -- Update consent tracking
    UPDATE public.user_consent_tracking 
    SET 
        email = anonymized_id || '@anonymized.local',
        ip_address = NULL,
        user_agent = 'anonymized'
    WHERE lead_id = lead_record.id;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- 8. Row Level Security (RLS) Policies
-- ================================================================

-- Enable RLS on all tables
ALTER TABLE public.visibility_check_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visibility_check_context_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_action_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visibility_check_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_consent_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visibility_check_followups ENABLE ROW LEVEL SECURITY;

-- Super admin can see everything
CREATE POLICY "super_admin_full_access_leads" ON public.visibility_check_leads
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'super_admin'
        )
    );

CREATE POLICY "super_admin_full_access_context" ON public.visibility_check_context_data
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'super_admin'
        )
    );

CREATE POLICY "super_admin_full_access_logs" ON public.ai_action_logs
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'super_admin'
        )
    );

CREATE POLICY "super_admin_full_access_results" ON public.visibility_check_results
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'super_admin'
        )
    );

CREATE POLICY "super_admin_full_access_consent" ON public.user_consent_tracking
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'super_admin'
        )
    );

CREATE POLICY "super_admin_full_access_followups" ON public.visibility_check_followups
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'super_admin'
        )
    );

-- Public access for anonymous VC operations (limited)
CREATE POLICY "public_vc_lead_creation" ON public.visibility_check_leads
    FOR INSERT TO anon
    WITH CHECK (true);

CREATE POLICY "public_vc_lead_token_lookup" ON public.visibility_check_leads
    FOR SELECT TO anon
    USING (confirm_token_hash IS NOT NULL AND confirm_expires_at > now());

-- ================================================================
-- 9. Automated Triggers
-- ================================================================

-- Update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to relevant tables
CREATE TRIGGER update_visibility_check_leads_updated_at
    BEFORE UPDATE ON public.visibility_check_leads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_visibility_check_context_data_updated_at
    BEFORE UPDATE ON public.visibility_check_context_data
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_visibility_check_results_updated_at
    BEFORE UPDATE ON public.visibility_check_results
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_visibility_check_followups_updated_at
    BEFORE UPDATE ON public.visibility_check_followups
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ================================================================
-- 10. Initial Data and Configuration
-- ================================================================

-- Insert default feature flags if they don't exist
INSERT INTO public.feature_flags (key, value, description) VALUES
    ('vc_data_management_live', 'true', 'Enable new VC data management system'),
    ('vc_gdpr_compliance_strict', 'true', 'Enforce strict GDPR compliance'),
    ('vc_auto_cleanup_enabled', 'true', 'Enable automatic data cleanup'),
    ('vc_admin_dashboard_live', 'true', 'Enable admin dashboard for VC management')
ON CONFLICT (key) DO NOTHING;

COMMIT;

-- ================================================================
-- Success Message
-- ================================================================
DO $$
BEGIN
    RAISE NOTICE '✅ Visibility Check Data Management System deployed successfully!';
    RAISE NOTICE '📊 Tables created: 6 core tables + triggers + RLS policies';
    RAISE NOTICE '🔒 GDPR compliance: Automated cleanup + anonymization functions';
    RAISE NOTICE '👥 Admin access: Super admin full access via RLS';
    RAISE NOTICE '🚀 Ready for: Email collection → AI analysis → Results → Follow-up';
END $$;