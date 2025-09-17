-- 0) Helper-Funktion, falls noch nicht vorhanden
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

-- 1) Spalte updated_at nachrüsten
ALTER TABLE public.ga4_daily
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- 2) Trigger für ga4_daily
CREATE TRIGGER update_ga4_daily_updated_at
  BEFORE UPDATE ON public.ga4_daily
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3) WITH CHECK für Partner-Update
DROP POLICY IF EXISTS "Partners can update own ai recommendations" ON public.ai_recommendations;
CREATE POLICY "Partners can update own ai recommendations"
  ON public.ai_recommendations
  FOR UPDATE
  USING (partner_id IN (SELECT id FROM business_partners WHERE user_id = auth.uid()))
  WITH CHECK (partner_id IN (SELECT id FROM business_partners WHERE user_id = auth.uid()));

-- 4) System-Insert für ga4_daily
CREATE POLICY "System can insert ga4 data"
  ON public.ga4_daily
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- 5) Index ga4_daily (Partner + Date)
CREATE INDEX IF NOT EXISTS idx_ga4_daily_partner_date
  ON public.ga4_daily(partner_id, date DESC);