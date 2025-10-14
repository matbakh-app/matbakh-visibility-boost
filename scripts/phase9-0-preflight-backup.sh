#!/bin/bash

# Phase 9.0 - Pre-Flight Backup & Freeze
# Run 30-45 minutes before cutover

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="./backups/phase9_${TIMESTAMP}"

echo -e "${BLUE}🔒 Phase 9.0 - Pre-Flight Backup & Freeze${NC}"
echo "=============================================="
echo "Timestamp: $(date)"
echo "Backup directory: $BACKUP_DIR"
echo ""

# Create backup directory
mkdir -p "$BACKUP_DIR"

# 1. Change Freeze Activation
echo -e "${YELLOW}1. Activating Change Freeze...${NC}"
cat > "$BACKUP_DIR/change_freeze_notice.md" << EOF
# Change Freeze Active - Phase 9 Production Deployment

**Start Time**: $(date)
**Duration**: Estimated 2-4 hours
**Scope**: S3 File Storage Migration & Cognito Auth Cutover

## Frozen Components
- Frontend deployments
- Lambda function updates
- Database schema changes
- Feature flag modifications (except planned cutover flags)

## Emergency Contact
- Primary: Production deployment team
- Escalation: CTO approval required for any changes

## Status
- [ ] Pre-flight checks complete
- [ ] Infrastructure deployed
- [ ] Feature flags flipped
- [ ] Frontend deployed
- [ ] Smoke tests passed
- [ ] Monitoring active
- [ ] Change freeze lifted

EOF

echo -e "${GREEN}✅ Change freeze notice created${NC}"

# 2. RDS Snapshot
echo -e "\n${YELLOW}2. Creating RDS Snapshot...${NC}"
if command -v aws &> /dev/null && [ ! -z "$RDS_INSTANCE_ID" ]; then
  SNAPSHOT_ID="matbakh-phase9-cutover-${TIMESTAMP}"
  
  echo "Creating snapshot: $SNAPSHOT_ID"
  aws rds create-db-snapshot \
    --db-instance-identifier "$RDS_INSTANCE_ID" \
    --db-snapshot-identifier "$SNAPSHOT_ID" \
    --region eu-central-1
  
  echo "Snapshot ID: $SNAPSHOT_ID" > "$BACKUP_DIR/rds_snapshot_id.txt"
  echo -e "${GREEN}✅ RDS Snapshot initiated: $SNAPSHOT_ID${NC}"
else
  echo -e "${YELLOW}⚠️  RDS_INSTANCE_ID not set or AWS CLI not available${NC}"
  echo "Manual snapshot required before cutover"
fi

# 3. Export Current Feature Flags
echo -e "\n${YELLOW}3. Exporting Current Feature Flags...${NC}"
if [ ! -z "$DATABASE_URL" ] && command -v psql &> /dev/null; then
  echo "Exporting feature flags..."
  
  psql "$DATABASE_URL" -c "
    COPY (
      SELECT key, value, created_at, updated_at 
      FROM feature_flags 
      ORDER BY key
    ) TO STDOUT WITH CSV HEADER
  " > "$BACKUP_DIR/feature_flags_backup.csv"
  
  # Also create SQL restore script
  psql "$DATABASE_URL" -c "
    SELECT 
      'INSERT INTO feature_flags (key, value) VALUES (' ||
      quote_literal(key) || ', ' || quote_literal(value) || 
      ') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;'
    FROM feature_flags 
    ORDER BY key
  " -t > "$BACKUP_DIR/feature_flags_restore.sql"
  
  echo -e "${GREEN}✅ Feature flags exported${NC}"
  echo "Backup files:"
  echo "  - CSV: $BACKUP_DIR/feature_flags_backup.csv"
  echo "  - SQL: $BACKUP_DIR/feature_flags_restore.sql"
else
  echo -e "${YELLOW}⚠️  DATABASE_URL not set - manual feature flag backup required${NC}"
fi

# 4. Frontend Build Artifact Archive
echo -e "\n${YELLOW}4. Archiving Current Frontend Build...${NC}"
if [ -d "dist" ]; then
  tar -czf "$BACKUP_DIR/frontend_build_backup.tar.gz" dist/
  echo -e "${GREEN}✅ Frontend build archived${NC}"
else
  echo -e "${YELLOW}⚠️  No dist/ directory found - run npm run build first${NC}"
fi

# 5. Environment Variables Backup
echo -e "\n${YELLOW}5. Backing up Environment Configuration...${NC}"
cat > "$BACKUP_DIR/env_backup.txt" << EOF
# Current Environment Configuration (Phase 9 Pre-Flight)
# Date: $(date)

## Frontend Environment Variables
VITE_PUBLIC_API_BASE=${VITE_PUBLIC_API_BASE:-"not set"}
VITE_CLOUDFRONT_URL=${VITE_CLOUDFRONT_URL:-"not set"}
VITE_USE_S3_UPLOADS=${VITE_USE_S3_UPLOADS:-"not set"}

## Auth Configuration
ENABLE_COGNITO=${ENABLE_COGNITO:-"not set"}
DUAL_AUTH_MODE=${DUAL_AUTH_MODE:-"not set"}

## Database
DATABASE_URL=${DATABASE_URL:0:20}... (truncated for security)

## AWS Configuration
AWS_REGION=${AWS_REGION:-"not set"}
RDS_INSTANCE_ID=${RDS_INSTANCE_ID:-"not set"}

EOF

echo -e "${GREEN}✅ Environment configuration backed up${NC}"

# 6. Pre-Flight Validation Checklist
echo -e "\n${YELLOW}6. Pre-Flight Validation Checklist...${NC}"
cat > "$BACKUP_DIR/preflight_checklist.md" << EOF
# Phase 9 Pre-Flight Checklist

## Infrastructure Readiness
- [ ] S3 buckets deployed and accessible
- [ ] Lambda functions deployed (presigned-url, upload-processor)
- [ ] CloudFront distribution active
- [ ] API Gateway endpoints responding
- [ ] RDS instance healthy and accessible

## Environment Configuration
- [ ] VITE_PUBLIC_API_BASE=https://api.matbakh.app
- [ ] VITE_CLOUDFRONT_URL=https://dtkzvn1fvvkgu.cloudfront.net
- [ ] VITE_USE_S3_UPLOADS=true
- [ ] ENABLE_COGNITO=true
- [ ] DUAL_AUTH_MODE=false (for cutover)

## Security & Access
- [ ] Lambda IAM roles have S3 permissions
- [ ] API Gateway WAF rules active
- [ ] CloudFront OAI configured
- [ ] Direct S3 access blocked (403)

## Monitoring & Alerts
- [ ] CloudWatch alarms configured
- [ ] Dashboard ready for monitoring
- [ ] Synthetic canary tests prepared
- [ ] Log aggregation working

## Rollback Preparation
- [ ] RDS snapshot created
- [ ] Feature flags backed up
- [ ] Frontend build archived
- [ ] Rollback procedures documented

## Team Readiness
- [ ] Deployment team on standby
- [ ] Escalation contacts available
- [ ] Communication channels open
- [ ] Go/No-Go decision made

EOF

echo -e "${GREEN}✅ Pre-flight checklist created${NC}"

# Summary
echo -e "\n${BLUE}📊 Pre-Flight Backup Summary${NC}"
echo "=============================================="
echo "Backup Location: $BACKUP_DIR"
echo ""
echo "Files Created:"
echo "  - change_freeze_notice.md"
echo "  - rds_snapshot_id.txt (if RDS available)"
echo "  - feature_flags_backup.csv"
echo "  - feature_flags_restore.sql"
echo "  - frontend_build_backup.tar.gz"
echo "  - env_backup.txt"
echo "  - preflight_checklist.md"
echo ""
echo "Next Steps:"
echo "1. Review preflight checklist"
echo "2. Confirm all items are green"
echo "3. Get go/no-go decision"
echo "4. Proceed with Phase 9.1 (Infrastructure Deploy)"
echo ""

if [ -f "$BACKUP_DIR/rds_snapshot_id.txt" ]; then
  SNAPSHOT_ID=$(cat "$BACKUP_DIR/rds_snapshot_id.txt")
  echo -e "${GREEN}🎯 RDS Snapshot: $SNAPSHOT_ID${NC}"
fi

echo -e "${GREEN}🔒 Phase 9.0 Pre-Flight Complete!${NC}"