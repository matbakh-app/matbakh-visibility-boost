-- Erweitere die bestehende visibility_check_leads Tabelle um die neuen Felder
ALTER TABLE visibility_check_leads 
ADD COLUMN IF NOT EXISTS full_report_url TEXT,
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS migrated_to_profile BOOLEAN DEFAULT FALSE;

-- Erstelle die visibility_check_actions Tabelle mit allen Spalten
CREATE TABLE IF NOT EXISTS visibility_check_actions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES visibility_check_leads(id) ON DELETE CASCADE,
  todo_type TEXT NOT NULL,
  todo_text TEXT NOT NULL,
  todo_why TEXT NOT NULL,
  is_critical BOOLEAN NOT NULL DEFAULT FALSE,
  is_done BOOLEAN NOT NULL DEFAULT FALSE,
  platform TEXT NOT NULL DEFAULT 'google' 
    CHECK (platform IN ('google', 'facebook', 'instagram', 'tiktok', 'general')),
  detected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- RLS Policies für visibility_check_actions
ALTER TABLE visibility_check_actions ENABLE ROW LEVEL SECURITY;

-- Admins können alle Actions verwalten
CREATE POLICY "Admins can manage all visibility actions" 
  ON visibility_check_actions 
  FOR ALL 
  USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ));

-- Admins können Actions erstellen
CREATE POLICY "Admins can insert visibility actions"
  ON visibility_check_actions
  FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

-- Users können Actions für ihre eigenen Leads sehen (nach Migration)
CREATE POLICY "Users can view their own lead actions" 
  ON visibility_check_actions 
  FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM visibility_check_leads vcl
    WHERE vcl.id = visibility_check_actions.lead_id 
    AND vcl.user_id = auth.uid()
  ));

-- Users können ihre Actions als erledigt markieren
CREATE POLICY "Users can update their own lead actions" 
  ON visibility_check_actions 
  FOR UPDATE 
  USING (EXISTS (
    SELECT 1 FROM visibility_check_leads vcl
    WHERE vcl.id = visibility_check_actions.lead_id 
    AND vcl.user_id = auth.uid()
  ));

-- System kann Actions erstellen
CREATE POLICY "System can insert visibility actions" 
  ON visibility_check_actions 
  FOR INSERT 
  WITH CHECK (auth.role() = 'service_role');

-- Erweitere die RLS Policy für visibility_check_leads um User-Zugriff nach Migration
CREATE POLICY "Users can view their migrated leads" 
  ON visibility_check_leads 
  FOR SELECT 
  USING (user_id = auth.uid());

-- Indexe für bessere Performance
CREATE INDEX IF NOT EXISTS idx_visibility_actions_lead_id ON visibility_check_actions(lead_id);
CREATE INDEX IF NOT EXISTS idx_visibility_actions_is_critical ON visibility_check_actions(is_critical);
CREATE INDEX IF NOT EXISTS idx_visibility_actions_platform ON visibility_check_actions(platform);
CREATE INDEX IF NOT EXISTS idx_visibility_leads_user_id ON visibility_check_leads(user_id);
CREATE INDEX IF NOT EXISTS idx_visibility_leads_migrated ON visibility_check_leads(migrated_to_profile);

-- Trigger für updated_at auf visibility_check_actions
CREATE OR REPLACE FUNCTION update_visibility_actions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_visibility_actions_updated_at
    BEFORE UPDATE ON visibility_check_actions
    FOR EACH ROW EXECUTE FUNCTION update_visibility_actions_updated_at();

-- Verbesserte Migration-Funktion mit E-Mail-Normalisierung
CREATE OR REPLACE FUNCTION migrate_leads_to_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Migriere Leads mit normalisierter E-Mail-Adresse (neueste zuerst, max 10)
  UPDATE visibility_check_leads 
  SET user_id = NEW.id, 
      migrated_to_profile = TRUE
  WHERE LOWER(TRIM(email)) = LOWER(TRIM(NEW.email))
    AND user_id IS NULL 
    AND migrated_to_profile = FALSE
    AND id IN (
      SELECT id FROM visibility_check_leads 
      WHERE LOWER(TRIM(email)) = LOWER(TRIM(NEW.email))
        AND user_id IS NULL 
        AND migrated_to_profile = FALSE
      ORDER BY created_at DESC 
      LIMIT 10
    );
    
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger für automatische Lead-Migration bei User-Registrierung
DROP TRIGGER IF EXISTS on_auth_user_migrate_leads ON auth.users;
CREATE TRIGGER on_auth_user_migrate_leads
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION migrate_leads_to_user();