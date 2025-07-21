
-- Tabelle für Facebook Conversions API Konfiguration
CREATE TABLE public.fb_conversions_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_id UUID REFERENCES business_partners(id) ON DELETE CASCADE,
  pixel_id TEXT NOT NULL,
  access_token TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabelle für DSGVO Opt-In Tracking
CREATE TABLE public.user_consent_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  partner_id UUID REFERENCES business_partners(id) ON DELETE CASCADE,
  consent_type TEXT NOT NULL, -- 'facebook_conversions', 'analytics', etc.
  consent_given BOOLEAN NOT NULL,
  consent_timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
  ip_address INET,
  user_agent TEXT,
  consent_method TEXT, -- 'website_banner', 'email_confirmation', etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabelle für Event Logging
CREATE TABLE public.fb_conversion_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_id UUID REFERENCES business_partners(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_name TEXT NOT NULL,
  pixel_id TEXT NOT NULL,
  event_payload JSONB NOT NULL,
  response_status INTEGER,
  response_body JSONB,
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  success BOOLEAN DEFAULT false
);

-- RLS Policies für fb_conversions_config
ALTER TABLE public.fb_conversions_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Partners can manage their own FB config" 
  ON public.fb_conversions_config 
  FOR ALL 
  USING (partner_id IN (
    SELECT bp.id FROM business_partners bp WHERE bp.user_id = auth.uid()
  ));

CREATE POLICY "Admins can manage all FB configs" 
  ON public.fb_conversions_config 
  FOR ALL 
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));

-- RLS Policies für user_consent_tracking
ALTER TABLE public.user_consent_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own consent" 
  ON public.user_consent_tracking 
  FOR SELECT 
  USING (user_id = auth.uid());

CREATE POLICY "System can insert consent records" 
  ON public.user_consent_tracking 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Admins can view all consent records" 
  ON public.user_consent_tracking 
  FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));

-- RLS Policies für fb_conversion_logs
ALTER TABLE public.fb_conversion_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Partners can view their own FB logs" 
  ON public.fb_conversion_logs 
  FOR SELECT 
  USING (partner_id IN (
    SELECT bp.id FROM business_partners bp WHERE bp.user_id = auth.uid()
  ));

CREATE POLICY "Admins can view all FB logs" 
  ON public.fb_conversion_logs 
  FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "System can insert FB logs" 
  ON public.fb_conversion_logs 
  FOR INSERT 
  WITH CHECK (true);

-- Trigger für updated_at
CREATE TRIGGER update_fb_conversions_config_updated_at
  BEFORE UPDATE ON public.fb_conversions_config
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Indizes für Performance
CREATE INDEX idx_fb_conversions_config_partner_id ON public.fb_conversions_config(partner_id);
CREATE INDEX idx_user_consent_tracking_user_id ON public.user_consent_tracking(user_id);
CREATE INDEX idx_user_consent_tracking_partner_id ON public.user_consent_tracking(partner_id);
CREATE INDEX idx_fb_conversion_logs_partner_id ON public.fb_conversion_logs(partner_id);
CREATE INDEX idx_fb_conversion_logs_sent_at ON public.fb_conversion_logs(sent_at);
