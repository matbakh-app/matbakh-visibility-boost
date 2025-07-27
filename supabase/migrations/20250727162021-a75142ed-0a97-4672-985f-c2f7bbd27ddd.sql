-- 1. Create redeem_codes table
CREATE TABLE public.redeem_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  partner_id UUID NOT NULL REFERENCES public.business_partners(id) ON DELETE CASCADE,
  description TEXT,
  campaign_tag TEXT,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  max_uses INTEGER NOT NULL DEFAULT 1,
  uses INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- 2. Add hasSubscription column to visibility_check_leads if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'visibility_check_leads' 
      AND column_name = 'hassubscription'
  ) THEN
    ALTER TABLE public.visibility_check_leads 
      ADD COLUMN hasSubscription BOOLEAN NOT NULL DEFAULT false;
  END IF;
END $$;

-- 3. Enable RLS on redeem_codes
ALTER TABLE public.redeem_codes ENABLE ROW LEVEL SECURITY;

-- 4. Create indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_redeem_codes_partner_id ON public.redeem_codes USING btree (partner_id);
CREATE INDEX IF NOT EXISTS idx_redeem_codes_code ON public.redeem_codes (code);
CREATE INDEX IF NOT EXISTS idx_redeem_codes_expires_at ON public.redeem_codes (expires_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_redeem_codes_campaign_tag ON public.redeem_codes USING btree (campaign_tag);

-- 5. RLS Policies
CREATE POLICY "Partners can view their own redeem codes" 
  ON public.redeem_codes FOR SELECT 
  USING (partner_id IN (
    SELECT id FROM public.business_partners WHERE user_id = auth.uid()
  ));

CREATE POLICY "Partners can create their own redeem codes" 
  ON public.redeem_codes FOR INSERT 
  WITH CHECK (partner_id IN (
    SELECT id FROM public.business_partners WHERE user_id = auth.uid()
  ));

CREATE POLICY "Partners can update their own redeem codes" 
  ON public.redeem_codes FOR UPDATE 
  USING (partner_id IN (
    SELECT id FROM public.business_partners WHERE user_id = auth.uid()
  ));

CREATE POLICY "System can manage all redeem codes" 
  ON public.redeem_codes FOR ALL 
  USING (auth.role() = 'service_role');

-- 6. Create update trigger for updated_at
CREATE TRIGGER update_redeem_codes_updated_at
  BEFORE UPDATE ON public.redeem_codes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 7. Create get_redeem_codes function
CREATE OR REPLACE FUNCTION public.get_redeem_codes(p_partner_id UUID)
RETURNS TABLE(
  id UUID,
  code TEXT,
  partner_id UUID,
  description TEXT,
  campaign_tag TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  max_uses INTEGER,
  uses INTEGER,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  created_by UUID,
  is_active BOOLEAN,
  days_remaining INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT
    rc.id,
    rc.code,
    rc.partner_id,
    rc.description,
    rc.campaign_tag,
    rc.expires_at,
    rc.max_uses,
    rc.uses,
    rc.created_at,
    rc.updated_at,
    rc.created_by,
    rc.is_active,
    GREATEST(0, CEIL(EXTRACT(EPOCH FROM (rc.expires_at - now())) / 86400))::INTEGER as days_remaining
  FROM public.redeem_codes rc
  WHERE rc.partner_id = p_partner_id
  ORDER BY rc.created_at DESC;
END;
$$;

-- 8. Create campaign_report function  
CREATE OR REPLACE FUNCTION public.campaign_report(pid UUID)
RETURNS TABLE(
  campaign_tag TEXT,
  codes_generated BIGINT,
  codes_used BIGINT,
  total_uses BIGINT,
  remaining_codes BIGINT,
  avg_uses_per_code NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(rc.campaign_tag, 'Ohne Kampagne') as campaign_tag,
    COUNT(*)::BIGINT as codes_generated,
    COUNT(*) FILTER (WHERE rc.uses > 0)::BIGINT as codes_used,
    SUM(rc.uses)::BIGINT as total_uses,
    COUNT(*) FILTER (WHERE rc.uses < rc.max_uses AND rc.expires_at > now() AND rc.is_active)::BIGINT as remaining_codes,
    ROUND(AVG(rc.uses), 2) as avg_uses_per_code
  FROM public.redeem_codes rc
  WHERE rc.partner_id = pid
  GROUP BY rc.campaign_tag
  ORDER BY total_uses DESC;
END;
$$;