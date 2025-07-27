-- Test lead für End-to-End Test
INSERT INTO visibility_check_leads (
  id, business_name, main_category, location, email, status, double_optin_confirmed, created_at, updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000ABC',
  '🚀 Lovable Test Restaurant',
  'Essen & Trinken',
  'Berlin, Deutschland',
  'lovable-test@example.com',
  'pending',
  true,
  now(),
  now()
) ON CONFLICT (id) DO UPDATE SET 
  status = 'pending',
  updated_at = now();

-- Erstelle visibility_trends Tabelle falls sie nicht existiert
CREATE TABLE IF NOT EXISTS visibility_trends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL,
  trend_metrics jsonb DEFAULT '{}',
  trends_date date DEFAULT CURRENT_DATE,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE visibility_trends ENABLE ROW LEVEL SECURITY;

-- RLS Policy für visibility_trends
CREATE POLICY "System can manage visibility trends" ON visibility_trends
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Users can view trends for their leads" ON visibility_trends
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM visibility_check_leads l
      WHERE l.id = visibility_trends.lead_id 
      AND (l.user_id = auth.uid() OR l.email = (auth.jwt() ->> 'email'))
    )
  );