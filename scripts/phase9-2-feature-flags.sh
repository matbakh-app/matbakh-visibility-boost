#!/bin/bash

# Phase 9.2 - Feature Flags & Environment Configuration
# Flip feature flags for S3 and Cognito cutover

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚩 Phase 9.2 - Feature Flags & Environment Configuration${NC}"
echo "========================================================"
echo "Timestamp: $(date)"
echo ""

# Check database connection
if [ -z "$DATABASE_URL" ]; then
  echo -e "${RED}❌ DATABASE_URL not set${NC}"
  echo "Please set DATABASE_URL environment variable"
  exit 1
fi

if ! command -v psql &> /dev/null; then
  echo -e "${RED}❌ psql not found${NC}"
  echo "Please install PostgreSQL client"
  exit 1
fi

# Test database connection
echo -e "${YELLOW}🔍 Testing database connection...${NC}"
if psql "$DATABASE_URL" -c "SELECT 1;" >/dev/null 2>&1; then
  echo -e "${GREEN}✅ Database connection successful${NC}"
else
  echo -e "${RED}❌ Database connection failed${NC}"
  exit 1
fi

# 1. Backup Current Feature Flags
echo -e "\n${YELLOW}1. Backing up current feature flags...${NC}"
BACKUP_FILE="./feature_flags_backup_$(date +%Y%m%d_%H%M%S).sql"

psql "$DATABASE_URL" -c "
  SELECT 
    'INSERT INTO feature_flags (key, value) VALUES (' ||
    quote_literal(key) || ', ' || quote_literal(value) || 
    ') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;'
  FROM feature_flags 
  WHERE key IN ('useS3Uploads', 'showCloudFrontReportUrls', 'ENABLE_COGNITO', 'DUAL_AUTH_MODE')
  ORDER BY key
" -t > "$BACKUP_FILE"

echo -e "${GREEN}✅ Feature flags backed up to: $BACKUP_FILE${NC}"

# 2. Display Current Feature Flag Status
echo -e "\n${YELLOW}2. Current feature flag status...${NC}"
psql "$DATABASE_URL" -c "
  SELECT 
    key,
    value,
    updated_at
  FROM feature_flags 
  WHERE key IN ('useS3Uploads', 'showCloudFrontReportUrls', 'ENABLE_COGNITO', 'DUAL_AUTH_MODE')
  ORDER BY key;
"

# 3. S3 Storage Cutover
echo -e "\n${YELLOW}3. Activating S3 Storage...${NC}"

# Enable S3 uploads
psql "$DATABASE_URL" -c "
  INSERT INTO feature_flags (key, value) 
  VALUES ('useS3Uploads', 'true') 
  ON CONFLICT (key) DO UPDATE SET 
    value = 'true',
    updated_at = NOW();
"

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ S3 uploads enabled${NC}"
else
  echo -e "${RED}❌ Failed to enable S3 uploads${NC}"
  exit 1
fi

# Enable CloudFront report URLs
psql "$DATABASE_URL" -c "
  INSERT INTO feature_flags (key, value) 
  VALUES ('showCloudFrontReportUrls', 'true') 
  ON CONFLICT (key) DO UPDATE SET 
    value = 'true',
    updated_at = NOW();
"

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ CloudFront report URLs enabled${NC}"
else
  echo -e "${RED}❌ Failed to enable CloudFront report URLs${NC}"
  exit 1
fi

# 4. Cognito Auth Cutover
echo -e "\n${YELLOW}4. Activating Cognito Authentication...${NC}"

# Enable Cognito
psql "$DATABASE_URL" -c "
  INSERT INTO feature_flags (key, value) 
  VALUES ('ENABLE_COGNITO', 'true') 
  ON CONFLICT (key) DO UPDATE SET 
    value = 'true',
    updated_at = NOW();
"

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ Cognito authentication enabled${NC}"
else
  echo -e "${RED}❌ Failed to enable Cognito authentication${NC}"
  exit 1
fi

# Disable dual auth mode (critical for cutover)
psql "$DATABASE_URL" -c "
  INSERT INTO feature_flags (key, value) 
  VALUES ('DUAL_AUTH_MODE', 'false') 
  ON CONFLICT (key) DO UPDATE SET 
    value = 'false',
    updated_at = NOW();
"

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ Dual auth mode disabled${NC}"
else
  echo -e "${RED}❌ Failed to disable dual auth mode${NC}"
  exit 1
fi

# 5. Verify Feature Flag Changes
echo -e "\n${YELLOW}5. Verifying feature flag changes...${NC}"
echo "New feature flag status:"

psql "$DATABASE_URL" -c "
  SELECT 
    key,
    value,
    updated_at
  FROM feature_flags 
  WHERE key IN ('useS3Uploads', 'showCloudFrontReportUrls', 'ENABLE_COGNITO', 'DUAL_AUTH_MODE')
  ORDER BY key;
"

# 6. Validate Expected Values
echo -e "\n${YELLOW}6. Validating expected values...${NC}"

# Check each flag
FLAGS_TO_CHECK=(
  "useS3Uploads:true"
  "showCloudFrontReportUrls:true"
  "ENABLE_COGNITO:true"
  "DUAL_AUTH_MODE:false"
)

ALL_VALID=true

for flag_check in "${FLAGS_TO_CHECK[@]}"; do
  IFS=':' read -r flag_key expected_value <<< "$flag_check"
  
  actual_value=$(psql "$DATABASE_URL" -t -c "
    SELECT value FROM feature_flags WHERE key = '$flag_key';
  " | xargs)
  
  if [ "$actual_value" = "$expected_value" ]; then
    echo -e "${GREEN}✅ $flag_key = $actual_value${NC}"
  else
    echo -e "${RED}❌ $flag_key = $actual_value (expected: $expected_value)${NC}"
    ALL_VALID=false
  fi
done

if [ "$ALL_VALID" = false ]; then
  echo -e "${RED}❌ Feature flag validation failed${NC}"
  echo "Rollback command available in: $BACKUP_FILE"
  exit 1
fi

# 7. Environment Variables Check
echo -e "\n${YELLOW}7. Environment variables check...${NC}"

# Check if environment variables are set correctly
ENV_VARS=(
  "VITE_PUBLIC_API_BASE:https://api.matbakh.app"
  "VITE_CLOUDFRONT_URL:https://dtkzvn1fvvkgu.cloudfront.net"
  "VITE_USE_S3_UPLOADS:true"
  "ENABLE_COGNITO:true"
  "DUAL_AUTH_MODE:false"
)

echo "Current environment variables:"
for env_check in "${ENV_VARS[@]}"; do
  IFS=':' read -r env_key expected_value <<< "$env_check"
  actual_value="${!env_key}"
  
  if [ "$actual_value" = "$expected_value" ]; then
    echo -e "${GREEN}✅ $env_key = $actual_value${NC}"
  else
    echo -e "${YELLOW}⚠️  $env_key = ${actual_value:-"not set"} (expected: $expected_value)${NC}"
    echo "   Note: Set this for frontend build"
  fi
done

# 8. Generate Cutover Status Report
echo -e "\n${YELLOW}8. Generating cutover status report...${NC}"
REPORT_FILE="./cutover_status_$(date +%Y%m%d_%H%M%S).md"

cat > "$REPORT_FILE" << EOF
# Phase 9.2 Feature Flags Cutover Status

**Date**: $(date)
**Status**: COMPLETED

## Feature Flags Updated

### S3 Storage Migration
- ✅ useS3Uploads = true
- ✅ showCloudFrontReportUrls = true

### Cognito Authentication Cutover  
- ✅ ENABLE_COGNITO = true
- ✅ DUAL_AUTH_MODE = false

## Environment Variables Required for Frontend

\`\`\`bash
export VITE_PUBLIC_API_BASE="https://api.matbakh.app"
export VITE_CLOUDFRONT_URL="https://dtkzvn1fvvkgu.cloudfront.net"
export VITE_USE_S3_UPLOADS="true"
export ENABLE_COGNITO="true"
export DUAL_AUTH_MODE="false"
\`\`\`

## Rollback Information

Rollback SQL available in: $BACKUP_FILE

To rollback feature flags:
\`\`\`bash
psql "\$DATABASE_URL" -f $BACKUP_FILE
\`\`\`

## Next Steps

1. Build frontend with new environment variables
2. Deploy frontend to production
3. Run smoke tests to validate cutover
4. Monitor system performance

## Critical Notes

- **DUAL_AUTH_MODE=false**: This disables Supabase auth fallback
- **All users must use Cognito authentication after this point**
- **S3 uploads are now the primary file storage method**

EOF

echo -e "${GREEN}✅ Cutover status report: $REPORT_FILE${NC}"

# Summary
echo -e "\n${BLUE}📊 Feature Flags Cutover Summary${NC}"
echo "========================================================"
echo "✅ S3 storage activated (useS3Uploads=true)"
echo "✅ CloudFront reports enabled (showCloudFrontReportUrls=true)"
echo "✅ Cognito authentication activated (ENABLE_COGNITO=true)"
echo "✅ Dual auth mode disabled (DUAL_AUTH_MODE=false)"
echo ""
echo "⚠️  CRITICAL: Supabase auth fallback is now disabled"
echo "⚠️  All users must authenticate via Cognito"
echo ""
echo "Rollback available: $BACKUP_FILE"
echo ""
echo "Next Steps:"
echo "1. Build frontend with environment variables"
echo "2. Deploy frontend: ./scripts/phase9-3-frontend-deploy.sh"
echo "3. Run smoke tests: ./scripts/phase9-4-smoke-tests.sh"
echo ""

echo -e "${GREEN}🚩 Phase 9.2 Feature Flags Cutover Complete!${NC}"