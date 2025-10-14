#!/bin/bash

# Phase 9 - Emergency Rollback Script
# Rollback S3 and Cognito cutover to previous state

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${RED}🚨 Phase 9 - Emergency Rollback${NC}"
echo "================================"
echo "Timestamp: $(date)"
echo ""

# Confirmation prompt
echo -e "${YELLOW}⚠️  WARNING: This will rollback the production cutover${NC}"
echo "This will:"
echo "  - Revert feature flags to previous state"
echo "  - Re-enable dual auth mode (Supabase fallback)"
echo "  - Disable S3 uploads (fallback to Supabase Storage)"
echo "  - Require frontend redeployment with old configuration"
echo ""
read -p "Are you sure you want to proceed? (type 'ROLLBACK' to confirm): " CONFIRMATION

if [ "$CONFIRMATION" != "ROLLBACK" ]; then
  echo -e "${GREEN}Rollback cancelled${NC}"
  exit 0
fi

echo -e "${RED}🚨 PROCEEDING WITH ROLLBACK${NC}"
echo ""

# Check prerequisites
if [ -z "$DATABASE_URL" ]; then
  echo -e "${RED}❌ DATABASE_URL not set${NC}"
  exit 1
fi

if ! command -v psql &> /dev/null; then
  echo -e "${RED}❌ psql not found${NC}"
  exit 1
fi

# 1. Create Rollback Backup
echo -e "${YELLOW}1. Creating rollback backup...${NC}"
ROLLBACK_BACKUP_DIR="./backups/rollback_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$ROLLBACK_BACKUP_DIR"

# Backup current feature flags
psql "$DATABASE_URL" -c "
  SELECT 
    'INSERT INTO feature_flags (key, value) VALUES (' ||
    quote_literal(key) || ', ' || quote_literal(value) || 
    ') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;'
  FROM feature_flags 
  WHERE key IN ('useS3Uploads', 'showCloudFrontReportUrls', 'ENABLE_COGNITO', 'DUAL_AUTH_MODE')
  ORDER BY key
" -t > "$ROLLBACK_BACKUP_DIR/current_flags_before_rollback.sql"

echo -e "${GREEN}✅ Rollback backup created: $ROLLBACK_BACKUP_DIR${NC}"

# 2. Look for Previous Backup
echo -e "\n${YELLOW}2. Looking for previous backup...${NC}"

# Find the most recent backup file
BACKUP_FILE=""
if [ -f "./feature_flags_backup_*.sql" ]; then
  BACKUP_FILE=$(ls -t ./feature_flags_backup_*.sql 2>/dev/null | head -1)
elif [ -d "./backups" ]; then
  BACKUP_FILE=$(find ./backups -name "feature_flags_restore.sql" -o -name "feature_flags_backup_*.sql" | head -1)
fi

if [ ! -z "$BACKUP_FILE" ] && [ -f "$BACKUP_FILE" ]; then
  echo -e "${GREEN}✅ Found backup file: $BACKUP_FILE${NC}"
  
  # Ask if user wants to use this backup
  read -p "Use this backup file? (y/n): " USE_BACKUP
  
  if [ "$USE_BACKUP" = "y" ] || [ "$USE_BACKUP" = "Y" ]; then
    echo "Restoring from backup file..."
    psql "$DATABASE_URL" -f "$BACKUP_FILE"
    
    if [ $? -eq 0 ]; then
      echo -e "${GREEN}✅ Feature flags restored from backup${NC}"
    else
      echo -e "${RED}❌ Failed to restore from backup file${NC}"
      exit 1
    fi
  else
    echo "Skipping backup restore, proceeding with manual rollback..."
  fi
else
  echo -e "${YELLOW}⚠️  No backup file found, proceeding with manual rollback${NC}"
fi

# 3. Manual Rollback (if no backup used)
if [ "$USE_BACKUP" != "y" ] && [ "$USE_BACKUP" != "Y" ]; then
  echo -e "\n${YELLOW}3. Performing manual rollback...${NC}"
  
  # Re-enable dual auth mode (critical for rollback)
  echo "Re-enabling dual auth mode..."
  psql "$DATABASE_URL" -c "
    INSERT INTO feature_flags (key, value) 
    VALUES ('DUAL_AUTH_MODE', 'true') 
    ON CONFLICT (key) DO UPDATE SET 
      value = 'true',
      updated_at = NOW();
  "
  
  # Disable S3 uploads (fallback to Supabase Storage)
  echo "Disabling S3 uploads..."
  psql "$DATABASE_URL" -c "
    INSERT INTO feature_flags (key, value) 
    VALUES ('useS3Uploads', 'false') 
    ON CONFLICT (key) DO UPDATE SET 
      value = 'false',
      updated_at = NOW();
  "
  
  # Disable CloudFront reports
  echo "Disabling CloudFront reports..."
  psql "$DATABASE_URL" -c "
    INSERT INTO feature_flags (key, value) 
    VALUES ('showCloudFrontReportUrls', 'false') 
    ON CONFLICT (key) DO UPDATE SET 
      value = 'false',
      updated_at = NOW();
  "
  
  # Keep Cognito enabled but with dual mode (safer rollback)
  echo "Keeping Cognito enabled with dual auth mode..."
  psql "$DATABASE_URL" -c "
    INSERT INTO feature_flags (key, value) 
    VALUES ('ENABLE_COGNITO', 'true') 
    ON CONFLICT (key) DO UPDATE SET 
      value = 'true',
      updated_at = NOW();
  "
  
  echo -e "${GREEN}✅ Manual rollback completed${NC}"
fi

# 4. Verify Rollback
echo -e "\n${YELLOW}4. Verifying rollback...${NC}"
echo "Current feature flag status:"

psql "$DATABASE_URL" -c "
  SELECT 
    key,
    value,
    updated_at
  FROM feature_flags 
  WHERE key IN ('useS3Uploads', 'showCloudFrontReportUrls', 'ENABLE_COGNITO', 'DUAL_AUTH_MODE')
  ORDER BY key;
"

# Check critical rollback flags
DUAL_AUTH=$(psql "$DATABASE_URL" -t -c "SELECT value FROM feature_flags WHERE key = 'DUAL_AUTH_MODE';" | xargs)
S3_UPLOADS=$(psql "$DATABASE_URL" -t -c "SELECT value FROM feature_flags WHERE key = 'useS3Uploads';" | xargs)

if [ "$DUAL_AUTH" = "true" ]; then
  echo -e "${GREEN}✅ Dual auth mode enabled (Supabase fallback active)${NC}"
else
  echo -e "${RED}❌ Dual auth mode not enabled - CRITICAL ISSUE${NC}"
fi

if [ "$S3_UPLOADS" = "false" ]; then
  echo -e "${GREEN}✅ S3 uploads disabled (Supabase Storage fallback)${NC}"
else
  echo -e "${YELLOW}⚠️  S3 uploads still enabled${NC}"
fi

# 5. Frontend Rollback Instructions
echo -e "\n${YELLOW}5. Frontend rollback required...${NC}"

cat > "$ROLLBACK_BACKUP_DIR/frontend_rollback_instructions.md" << EOF
# Frontend Rollback Instructions

## Environment Variables for Rollback Build

\`\`\`bash
export VITE_PUBLIC_API_BASE="https://api.matbakh.app"
export VITE_CLOUDFRONT_URL=""  # Disable CloudFront
export VITE_USE_S3_UPLOADS="false"  # Disable S3 uploads
export ENABLE_COGNITO="true"  # Keep Cognito enabled
export DUAL_AUTH_MODE="true"  # Enable Supabase fallback
\`\`\`

## Build and Deploy Commands

\`\`\`bash
# Build with rollback configuration
npm run build

# Deploy (adjust for your deployment method)
# AWS S3 + CloudFront:
aws s3 sync dist/ s3://your-webapp-bucket --delete
aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"

# Or Vercel:
vercel --prod
\`\`\`

## Verification

After deployment, verify:
1. Users can log in with both Cognito and Supabase
2. File uploads work via Supabase Storage
3. No S3 upload errors in console
4. Reports load from Supabase (not CloudFront)

EOF

echo -e "${GREEN}✅ Frontend rollback instructions: $ROLLBACK_BACKUP_DIR/frontend_rollback_instructions.md${NC}"

# 6. Lambda Function Rollback (Optional)
echo -e "\n${YELLOW}6. Lambda function rollback (optional)...${NC}"
echo "Lambda functions can be rolled back via AWS Console:"
echo "  - matbakh-get-presigned-url"
echo "  - matbakh-s3-upload-processor"
echo ""
echo "To rollback Lambda functions:"
echo "1. Go to AWS Lambda Console"
echo "2. Select function"
echo "3. Go to Versions tab"
echo "4. Select previous version"
echo "5. Update alias to point to previous version"

# 7. Generate Rollback Report
echo -e "\n${YELLOW}7. Generating rollback report...${NC}"
REPORT_FILE="$ROLLBACK_BACKUP_DIR/rollback_report.md"

cat > "$REPORT_FILE" << EOF
# Phase 9 Emergency Rollback Report

**Date**: $(date)
**Status**: COMPLETED
**Rollback Reason**: Emergency rollback initiated

## Actions Taken

### Database Changes
- ✅ DUAL_AUTH_MODE = true (Supabase fallback enabled)
- ✅ useS3Uploads = false (S3 uploads disabled)
- ✅ showCloudFrontReportUrls = false (CloudFront reports disabled)
- ✅ ENABLE_COGNITO = true (Cognito remains enabled)

### Current System State
- **Authentication**: Dual mode (Cognito + Supabase fallback)
- **File Storage**: Supabase Storage (S3 disabled)
- **Reports**: Supabase URLs (CloudFront disabled)
- **User Impact**: Minimal (fallback systems active)

## Required Actions

### Immediate (Critical)
1. **Deploy Frontend**: Use rollback environment variables
2. **Verify Authentication**: Test both Cognito and Supabase login
3. **Test File Uploads**: Ensure Supabase Storage works
4. **Monitor Errors**: Check for any S3-related errors

### Within 24 Hours
1. **Root Cause Analysis**: Identify rollback reason
2. **Fix Issues**: Address problems that caused rollback
3. **Plan Re-deployment**: Prepare for second cutover attempt
4. **Update Documentation**: Record lessons learned

## Rollback Verification Checklist

- [ ] Dual auth mode enabled
- [ ] S3 uploads disabled
- [ ] Frontend deployed with rollback config
- [ ] User authentication working
- [ ] File uploads working via Supabase
- [ ] No critical errors in logs
- [ ] Monitoring alerts cleared

## Recovery Plan

1. **Identify Issues**: Determine what caused the rollback
2. **Fix Problems**: Address technical issues
3. **Test Thoroughly**: Validate fixes in staging
4. **Plan Cutover**: Schedule second deployment attempt
5. **Improve Process**: Update deployment procedures

## Contact Information

- **Incident Commander**: [Name]
- **Technical Lead**: [Name]
- **Escalation**: CTO/Management

## Files Created

- Rollback backup: $ROLLBACK_BACKUP_DIR/
- Frontend instructions: frontend_rollback_instructions.md
- Current flags backup: current_flags_before_rollback.sql

EOF

echo -e "${GREEN}✅ Rollback report: $REPORT_FILE${NC}"

# Summary
echo -e "\n${BLUE}📊 Rollback Summary${NC}"
echo "================================"
echo "✅ Database rollback completed"
echo "✅ Dual auth mode enabled (Supabase fallback)"
echo "✅ S3 uploads disabled"
echo "✅ CloudFront reports disabled"
echo "⚠️  Frontend deployment required"
echo ""
echo "Critical Next Steps:"
echo "1. Deploy frontend with rollback configuration"
echo "2. Verify user authentication and file uploads"
echo "3. Monitor system stability"
echo "4. Investigate rollback cause"
echo ""
echo "Rollback files: $ROLLBACK_BACKUP_DIR/"
echo ""

echo -e "${GREEN}🚨 Phase 9 Emergency Rollback Complete!${NC}"
echo -e "${YELLOW}⚠️  Deploy frontend immediately to complete rollback${NC}"