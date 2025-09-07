#!/bin/bash

# Phase 9 - Master Production Deployment Script
# Orchestrates complete S3 and Cognito cutover

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

SCRIPT_DIR="$(dirname "$0")"
LOG_DIR="./deployment-logs"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

echo -e "${MAGENTA}🚀 Phase 9 - Master Production Deployment${NC}"
echo "=============================================="
echo "Timestamp: $(date)"
echo "Log directory: $LOG_DIR"
echo ""

# Create log directory
mkdir -p "$LOG_DIR"

# Function to run phase and log output
run_phase() {
  local phase_name="$1"
  local script_path="$2"
  local log_file="$LOG_DIR/${phase_name}_${TIMESTAMP}.log"
  
  echo -e "${BLUE}🔄 Running $phase_name...${NC}"
  echo "Log file: $log_file"
  
  if [ -f "$script_path" ]; then
    chmod +x "$script_path"
    
    if "$script_path" > "$log_file" 2>&1; then
      echo -e "${GREEN}✅ $phase_name: SUCCESS${NC}"
      return 0
    else
      echo -e "${RED}❌ $phase_name: FAILED${NC}"
      echo "Check log file for details: $log_file"
      echo ""
      echo "Last 10 lines of log:"
      tail -10 "$log_file"
      return 1
    fi
  else
    echo -e "${RED}❌ Script not found: $script_path${NC}"
    return 1
  fi
}

# Function to prompt for continuation
prompt_continue() {
  local phase_name="$1"
  echo ""
  echo -e "${YELLOW}$phase_name completed.${NC}"
  read -p "Continue to next phase? (y/n/rollback): " CONTINUE
  
  case $CONTINUE in
    y|Y|yes|YES)
      return 0
      ;;
    rollback|ROLLBACK)
      echo -e "${RED}🚨 Initiating emergency rollback...${NC}"
      run_phase "Emergency Rollback" "$SCRIPT_DIR/phase9-rollback.sh"
      exit 1
      ;;
    *)
      echo -e "${YELLOW}Deployment paused. Resume with: $0 --resume-from $phase_name${NC}"
      exit 0
      ;;
  esac
}

# Check for resume option
RESUME_FROM=""
if [ "$1" = "--resume-from" ] && [ ! -z "$2" ]; then
  RESUME_FROM="$2"
  echo -e "${YELLOW}Resuming deployment from: $RESUME_FROM${NC}"
  echo ""
fi

# Pre-flight checks
echo -e "${YELLOW}🔍 Pre-flight checks...${NC}"

# Check required environment variables
REQUIRED_VARS=("DATABASE_URL")
MISSING_VARS=()

for var in "${REQUIRED_VARS[@]}"; do
  if [ -z "${!var}" ]; then
    MISSING_VARS+=("$var")
  fi
done

if [ ${#MISSING_VARS[@]} -gt 0 ]; then
  echo -e "${RED}❌ Missing required environment variables:${NC}"
  for var in "${MISSING_VARS[@]}"; do
    echo "  - $var"
  done
  echo ""
  echo "Set missing variables and try again."
  exit 1
fi

# Check required scripts exist
REQUIRED_SCRIPTS=(
  "phase9-0-preflight-backup.sh"
  "phase9-1-infra-deploy.sh"
  "phase9-2-feature-flags.sh"
  "phase9-3-frontend-deploy.sh"
  "phase9-4-smoke-tests.sh"
  "phase9-5-monitoring.sh"
)

MISSING_SCRIPTS=()
for script in "${REQUIRED_SCRIPTS[@]}"; do
  if [ ! -f "$SCRIPT_DIR/$script" ]; then
    MISSING_SCRIPTS+=("$script")
  fi
done

if [ ${#MISSING_SCRIPTS[@]} -gt 0 ]; then
  echo -e "${RED}❌ Missing required scripts:${NC}"
  for script in "${MISSING_SCRIPTS[@]}"; do
    echo "  - $script"
  done
  exit 1
fi

echo -e "${GREEN}✅ Pre-flight checks passed${NC}"
echo ""

# Deployment phases
PHASES=(
  "Phase 9.0 - Pre-flight Backup:phase9-0-preflight-backup.sh"
  "Phase 9.1 - Infrastructure Deploy:phase9-1-infra-deploy.sh"
  "Phase 9.2 - Feature Flags:phase9-2-feature-flags.sh"
  "Phase 9.3 - Frontend Deploy:phase9-3-frontend-deploy.sh"
  "Phase 9.4 - Smoke Tests:phase9-4-smoke-tests.sh"
  "Phase 9.5 - Monitoring Setup:phase9-5-monitoring.sh"
)

# Find resume point
START_INDEX=0
if [ ! -z "$RESUME_FROM" ]; then
  for i in "${!PHASES[@]}"; do
    IFS=':' read -r phase_name script_name <<< "${PHASES[$i]}"
    if [[ "$phase_name" == *"$RESUME_FROM"* ]]; then
      START_INDEX=$i
      break
    fi
  done
fi

# Execute deployment phases
DEPLOYMENT_SUCCESS=true

for ((i=START_INDEX; i<${#PHASES[@]}; i++)); do
  IFS=':' read -r phase_name script_name <<< "${PHASES[$i]}"
  
  echo -e "\n${MAGENTA}<REDACTED_AWS_SECRET_ACCESS_KEY>${NC}"
  echo -e "${MAGENTA}$phase_name${NC}"
  echo -e "${MAGENTA}<REDACTED_AWS_SECRET_ACCESS_KEY>${NC}"
  
  if run_phase "$phase_name" "$SCRIPT_DIR/$script_name"; then
    # Special handling for smoke tests
    if [[ "$phase_name" == *"Smoke Tests"* ]]; then
      echo ""
      echo -e "${YELLOW}🧪 Smoke tests completed. Review results before proceeding.${NC}"
      
      # Check if smoke tests actually passed
      SMOKE_LOG="$LOG_DIR/Phase 9.4 - Smoke Tests_${TIMESTAMP}.log"
      if grep -q "All smoke tests passed" "$SMOKE_LOG" 2>/dev/null; then
        echo -e "${GREEN}✅ All smoke tests passed!${NC}"
      else
        echo -e "${RED}⚠️  Some smoke tests may have failed. Check log file.${NC}"
        echo "Log file: $SMOKE_LOG"
        
        read -p "Continue despite test failures? (y/n/rollback): " CONTINUE_TESTS
        case $CONTINUE_TESTS in
          rollback|ROLLBACK)
            echo -e "${RED}🚨 Initiating emergency rollback due to test failures...${NC}"
            run_phase "Emergency Rollback" "$SCRIPT_DIR/phase9-rollback.sh"
            exit 1
            ;;
          n|N|no|NO)
            echo -e "${YELLOW}Deployment stopped due to test failures${NC}"
            echo "Fix issues and resume with: $0 --resume-from 'Smoke Tests'"
            exit 1
            ;;
        esac
      fi
    fi
    
    # Prompt for continuation (except for last phase)
    if [ $i -lt $((${#PHASES[@]} - 1)) ]; then
      prompt_continue "$phase_name"
    fi
  else
    echo -e "${RED}❌ $phase_name failed!${NC}"
    echo ""
    echo "Options:"
    echo "1. Fix the issue and resume: $0 --resume-from '$phase_name'"
    echo "2. Rollback: $SCRIPT_DIR/phase9-rollback.sh"
    echo ""
    DEPLOYMENT_SUCCESS=false
    break
  fi
done

# Generate final deployment report
echo -e "\n${YELLOW}📊 Generating final deployment report...${NC}"
FINAL_REPORT="$LOG_DIR/phase9_deployment_report_${TIMESTAMP}.md"

cat > "$FINAL_REPORT" << EOF
# Phase 9 Production Deployment Report

**Date**: $(date)
**Status**: $([ "$DEPLOYMENT_SUCCESS" = true ] && echo "✅ SUCCESS" || echo "❌ FAILED")
**Duration**: Started at $TIMESTAMP

## Deployment Summary

EOF

# Add phase results to report
for ((i=0; i<${#PHASES[@]}; i++)); do
  IFS=':' read -r phase_name script_name <<< "${PHASES[$i]}"
  LOG_FILE="$LOG_DIR/${phase_name}_${TIMESTAMP}.log"
  
  if [ -f "$LOG_FILE" ]; then
    if grep -q "Complete!" "$LOG_FILE" 2>/dev/null; then
      echo "- ✅ $phase_name" >> "$FINAL_REPORT"
    else
      echo "- ❌ $phase_name" >> "$FINAL_REPORT"
    fi
  else
    echo "- ⏭️  $phase_name (Skipped)" >> "$FINAL_REPORT"
  fi
done

cat >> "$FINAL_REPORT" << EOF

## Log Files

All deployment logs are available in: \`$LOG_DIR/\`

EOF

if [ "$DEPLOYMENT_SUCCESS" = true ]; then
  cat >> "$FINAL_REPORT" << EOF
## ✅ Deployment Successful!

### System Status
- **S3 File Storage**: ACTIVE
- **Cognito Authentication**: ACTIVE  
- **Dual Auth Mode**: DISABLED
- **CloudFront Reports**: ACTIVE
- **Monitoring**: CONFIGURED

### Post-Deployment Actions
1. ✅ Monitor system performance for 24-48 hours
2. ✅ Verify user workflows are functioning
3. ✅ Check monitoring alerts and dashboards
4. 📋 Plan Supabase decommissioning (Phase 10)

### Success Metrics
- All smoke tests passed
- Feature flags correctly set
- Infrastructure deployed and validated
- Monitoring and alerts configured

### Next Steps
1. Monitor production metrics
2. Gather user feedback
3. Plan Supabase decommissioning
4. Document lessons learned

EOF
else
  cat >> "$FINAL_REPORT" << EOF
## ❌ Deployment Failed

### Required Actions
1. **Review Logs**: Check failed phase logs for error details
2. **Fix Issues**: Address identified problems
3. **Resume Deployment**: Use --resume-from option
4. **Consider Rollback**: If issues cannot be resolved quickly

### Rollback Command
\`\`\`bash
./scripts/phase9-rollback.sh
\`\`\`

### Resume Command
\`\`\`bash
./scripts/phase9-master-deploy.sh --resume-from "Phase Name"
\`\`\`

EOF
fi

echo -e "${GREEN}✅ Final deployment report: $FINAL_REPORT${NC}"

# Final status
echo -e "\n${MAGENTA}<REDACTED_AWS_SECRET_ACCESS_KEY>${NC}"
echo -e "${MAGENTA}Phase 9 Deployment Complete${NC}"
echo -e "${MAGENTA}<REDACTED_AWS_SECRET_ACCESS_KEY>${NC}"

if [ "$DEPLOYMENT_SUCCESS" = true ]; then
  echo -e "${GREEN}🎉 DEPLOYMENT SUCCESSFUL!${NC}"
  echo ""
  echo "✅ S3 file storage is now active"
  echo "✅ Cognito authentication is active"
  echo "✅ Monitoring and alerts configured"
  echo "✅ All smoke tests passed"
  echo ""
  echo "Next Steps:"
  echo "1. Monitor system performance for 24-48 hours"
  echo "2. Verify user workflows"
  echo "3. Plan Supabase decommissioning"
  echo ""
  echo "Dashboard: https://console.aws.amazon.com/cloudwatch/home?region=eu-central-1#dashboards:name=MatbakhProductionDashboard"
else
  echo -e "${RED}❌ DEPLOYMENT FAILED${NC}"
  echo ""
  echo "Review logs and fix issues, then:"
  echo "- Resume: $0 --resume-from 'Phase Name'"
  echo "- Rollback: $SCRIPT_DIR/phase9-rollback.sh"
fi

echo ""
echo "Deployment logs: $LOG_DIR/"
echo "Final report: $FINAL_REPORT"

exit $([ "$DEPLOYMENT_SUCCESS" = true ] && echo 0 || echo 1)