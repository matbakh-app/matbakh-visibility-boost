#!/bin/bash

# Update S3 CORS Configuration
# This script updates CORS settings for all S3 buckets with exact origins (no wildcards)

set -e

BUCKETS=("matbakh-files-uploads" "matbakh-files-profile" "matbakh-files-reports")
REGION="eu-central-1"

# CORS configuration JSON - exact origins only (S3 doesn't support wildcards reliably)
cat > /tmp/cors-config.json << 'EOF'
{
  "CORSRules": [
    {
      "AllowedOrigins": [
        "https://matbakh.app",
        "https://staging.matbakh.app",
        "https://preview.matbakh.app", 
        "http://localhost:5173",
        "http://localhost:3000"
      ],
      "AllowedMethods": ["GET", "PUT", "HEAD", "OPTIONS"],
      "AllowedHeaders": ["*"],
      "MaxAgeSeconds": 3000,
      "ExposeHeaders": ["ETag"]
    }
  ]
}
EOF

echo "Updating CORS configuration for S3 buckets..."

for bucket in "${BUCKETS[@]}"; do
    echo "Updating CORS for $bucket..."
    
    if aws s3api put-bucket-cors --bucket $bucket --cors-configuration file:///tmp/cors-config.json --region $REGION; then
        echo "✅ CORS updated for $bucket"
    else
        echo "❌ Failed to update CORS for $bucket"
    fi
done

# Cleanup
rm -f /tmp/cors-config.json

echo "CORS configuration update completed"