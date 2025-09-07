-- Feature Flags für S3 Migration aktivieren
-- Ausführen mit: psql $DATABASE_URL -f scripts/activate-s3-flags.sql

-- S3 Uploads aktivieren
INSERT INTO feature_flags (key, value, description) 
VALUES ('useS3Uploads', 'true', 'Route all uploads to S3/CDN') 
ON CONFLICT (key) DO UPDATE SET value = excluded.value;

-- CloudFront Reports aktivieren
INSERT INTO feature_flags (key, value, description) 
VALUES ('showCloudFrontReportUrls', 'true', 'Serve reports via CloudFront') 
ON CONFLICT (key) DO UPDATE SET value = excluded.value;

-- S3 File Access aktivieren
INSERT INTO feature_flags (key, value, description) 
VALUES ('useS3FileAccess', 'true', 'Use S3 presigned URLs for file access') 
ON CONFLICT (key) DO UPDATE SET value = excluded.value;

-- Legacy Storage deaktivieren
INSERT INTO feature_flags (key, value, description) 
VALUES ('disableSupabaseStorage', 'true', 'Disable Supabase Storage writes') 
ON CONFLICT (key) DO UPDATE SET value = excluded.value;

-- Status anzeigen
SELECT 
  key,
  value,
  description,
  updated_at
FROM feature_flags 
WHERE key IN ('useS3Uploads', 'showCloudFrontReportUrls', 'useS3FileAccess', 'disableSupabaseStorage')
ORDER BY key;