-- Füge die fehlende updated_at Spalte hinzu
ALTER TABLE visibility_check_actions
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Optional: INSERT-Policy für Admins (zukunftsrelevant)
CREATE POLICY "Admins can insert visibility actions"
  ON visibility_check_actions
  FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

-- Verbessere die Migration-Funktion mit E-Mail-Normalisierung und LIMIT
CREATE OR REPLACE FUNCTION migrate_leads_to_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Migriere Leads mit normalisierter E-Mail-Adresse (neueste zuerst)
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
      LIMIT 10  -- Maximal 10 Leads pro E-Mail migrieren
    );
    
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Optional: Platform-Spalte für zukünftige Multi-Platform-Checks
ALTER TABLE visibility_check_actions
ADD COLUMN IF NOT EXISTS platform TEXT NOT NULL DEFAULT 'google' 
CHECK (platform IN ('google', 'facebook', 'instagram', 'tiktok', 'general'));

-- Index für Platform-Filtering
CREATE INDEX IF NOT EXISTS idx_visibility_actions_platform ON visibility_check_actions(platform);