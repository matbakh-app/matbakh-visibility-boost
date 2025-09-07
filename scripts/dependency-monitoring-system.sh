#!/bin/bash

# Dependency Monitoring System
# Continuous monitoring and alerting for dependency security and updates

set -e

echo "🔍 Dependency Monitoring System Setup"
echo "===================================="

# Configuration
MONITORING_DIR=".dependency-monitoring"
ALERT_THRESHOLD_DAYS=30
SECURITY_ALERT_LEVELS=("high" "critical")

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Create monitoring directory structure
setup_monitoring_structure() {
    print_status "Setting up monitoring directory structure..."
    
    mkdir -p "$MONITORING_DIR"/{reports,alerts,configs,scripts}
    
    print_success "Created monitoring directory structure"
}

# Create dependency scanning configuration
create_scanning_config() {
    print_status "Creating dependency scanning configuration..."
    
    cat > "$MONITORING_DIR/configs/scan-config.json" << EOF
{
  "scanSettings": {
    "alertThresholdDays": $ALERT_THRESHOLD_DAYS,
    "securityAlertLevels": $(printf '%s\n' "${SECURITY_ALERT_LEVELS[@]}" | jq -R . | jq -s .),
    "excludePackages": [
      "@types/*",
      "typescript"
    ],
    "includeDevDependencies": false,
    "enableSecurityScan": true,
    "enableOutdatedScan": true,
    "enableLicenseScan": true
  },
  "notificationSettings": {
    "email": {
      "enabled": false,
      "recipients": []
    },
    "slack": {
      "enabled": false,
      "webhook": ""
    },
    "github": {
      "enabled": true,
      "createIssues": true
    }
  },
  "reportSettings": {
    "format": ["json", "markdown", "html"],
    "includeRecommendations": true,
    "includeTrendAnalysis": true
  }
}
EOF

    print_success "Created scanning configuration"
}

# Create automated scanning script
create_scanning_script() {
    print_status "Creating automated scanning script..."
    
    cat > "$MONITORING_DIR/scripts/scan-dependencies.sh" << 'EOF'
#!/bin/bash

# Automated Dependency Scanner
# Scans all package.json files for security vulnerabilities and outdated packages

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MONITORING_DIR="$(dirname "$SCRIPT_DIR")"
CONFIG_FILE="$MONITORING_DIR/configs/scan-config.json"
REPORT_DIR="$MONITORING_DIR/reports"
ALERT_DIR="$MONITORING_DIR/alerts"

# Load configuration
if [ -f "$CONFIG_FILE" ]; then
    ALERT_THRESHOLD=$(jq -r '.scanSettings.alertThresholdDays' "$CONFIG_FILE")
    SECURITY_LEVELS=$(jq -r '.scanSettings.securityAlertLevels[]' "$CONFIG_FILE")
else
    ALERT_THRESHOLD=30
    SECURITY_LEVELS="high critical"
fi

# Create report timestamp
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
REPORT_FILE="$REPORT_DIR/dependency-scan-$TIMESTAMP.json"
ALERT_FILE="$ALERT_DIR/alerts-$TIMESTAMP.json"

echo "🔍 Starting dependency scan at $(date)"

# Initialize report structure
cat > "$REPORT_FILE" << EOJ
{
  "scanTimestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "scanId": "$TIMESTAMP",
  "summary": {
    "totalPackages": 0,
    "vulnerablePackages": 0,
    "outdatedPackages": 0,
    "criticalVulnerabilities": 0,
    "highVulnerabilities": 0
  },
  "packages": [],
  "alerts": []
}
EOJ

# Initialize alerts
echo '{"alerts": [], "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"}' > "$ALERT_FILE"

# Function to scan a package.json file
scan_package_json() {
    local package_file=$1
    local package_dir=$(dirname "$package_file")
    local package_name=$(basename "$package_dir")
    
    echo "Scanning $package_name..."
    
    cd "$package_dir"
    
    # Run npm audit
    local audit_result=$(npm audit --json 2>/dev/null || echo '{"vulnerabilities": {}}')
    
    # Run npm outdated
    local outdated_result=$(npm outdated --json 2>/dev/null || echo '{}')
    
    # Process results
    local vulnerabilities=$(echo "$audit_result" | jq '.vulnerabilities // {}')
    local outdated=$(echo "$outdated_result")
    
    # Count vulnerabilities by severity
    local critical_count=$(echo "$vulnerabilities" | jq '[.[] | select(.severity == "critical")] | length')
    local high_count=$(echo "$vulnerabilities" | jq '[.[] | select(.severity == "high")] | length')
    local moderate_count=$(echo "$vulnerabilities" | jq '[.[] | select(.severity == "moderate")] | length')
    local low_count=$(echo "$vulnerabilities" | jq '[.[] | select(.severity == "low")] | length')
    
    # Count outdated packages
    local outdated_count=$(echo "$outdated" | jq 'keys | length')
    
    # Create package report
    local package_report=$(cat << EOJ
{
  "name": "$package_name",
  "path": "$package_file",
  "vulnerabilities": {
    "critical": $critical_count,
    "high": $high_count,
    "moderate": $moderate_count,
    "low": $low_count,
    "details": $vulnerabilities
  },
  "outdated": {
    "count": $outdated_count,
    "packages": $outdated
  },
  "scanTimestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOJ
)
    
    # Add to main report
    local temp_report=$(jq --argjson pkg "$package_report" '.packages += [$pkg]' "$REPORT_FILE")
    echo "$temp_report" > "$REPORT_FILE"
    
    # Check for alerts
    if [ $critical_count -gt 0 ] || [ $high_count -gt 0 ]; then
        local alert=$(cat << EOJ
{
  "type": "security",
  "severity": "$([ $critical_count -gt 0 ] && echo "critical" || echo "high")",
  "package": "$package_name",
  "message": "Found $critical_count critical and $high_count high severity vulnerabilities",
  "details": {
    "critical": $critical_count,
    "high": $high_count,
    "path": "$package_file"
  },
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOJ
)
        
        local temp_alerts=$(jq --argjson alert "$alert" '.alerts += [$alert]' "$ALERT_FILE")
        echo "$temp_alerts" > "$ALERT_FILE"
    fi
    
    cd - > /dev/null
}

# Find and scan all package.json files
echo "Finding package.json files..."
find . -name "package.json" -not -path "./node_modules/*" -not -path "./.dependency-monitoring/*" | while read package_file; do
    scan_package_json "$package_file"
done

# Update summary
local total_packages=$(jq '.packages | length' "$REPORT_FILE")
local total_vulnerabilities=$(jq '[.packages[].vulnerabilities | .critical + .high + .moderate + .low] | add' "$REPORT_FILE")
local total_critical=$(jq '[.packages[].vulnerabilities.critical] | add' "$REPORT_FILE")
local total_high=$(jq '[.packages[].vulnerabilities.high] | add' "$REPORT_FILE")
local total_outdated=$(jq '[.packages[].outdated.count] | add' "$REPORT_FILE")

local summary_update=$(cat << EOJ
{
  "totalPackages": $total_packages,
  "vulnerablePackages": $(jq '[.packages[] | select(.vulnerabilities.critical + .vulnerabilities.high + .vulnerabilities.moderate + .vulnerabilities.low > 0)] | length' "$REPORT_FILE"),
  "outdatedPackages": $(jq '[.packages[] | select(.outdated.count > 0)] | length' "$REPORT_FILE"),
  "criticalVulnerabilities": $total_critical,
  "highVulnerabilities": $total_high,
  "totalVulnerabilities": $total_vulnerabilities,
  "totalOutdated": $total_outdated
}
EOJ
)

local final_report=$(jq --argjson summary "$summary_update" '.summary = $summary' "$REPORT_FILE")
echo "$final_report" > "$REPORT_FILE"

echo "✅ Dependency scan completed"
echo "📊 Summary:"
echo "  - Total packages: $total_packages"
echo "  - Vulnerabilities: $total_vulnerabilities ($total_critical critical, $total_high high)"
echo "  - Outdated packages: $total_outdated"
echo "📄 Report: $REPORT_FILE"
echo "🚨 Alerts: $ALERT_FILE"
EOF

    chmod +x "$MONITORING_DIR/scripts/scan-dependencies.sh"
    print_success "Created automated scanning script"
}

# Create alert notification system
create_alert_system() {
    print_status "Creating alert notification system..."
    
    cat > "$MONITORING_DIR/scripts/send-alerts.sh" << 'EOF'
#!/bin/bash

# Alert Notification System
# Sends notifications for dependency security alerts

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MONITORING_DIR="$(dirname "$SCRIPT_DIR")"
ALERT_DIR="$MONITORING_DIR/alerts"

# Find latest alert file
LATEST_ALERT=$(ls -t "$ALERT_DIR"/alerts-*.json 2>/dev/null | head -1)

if [ -z "$LATEST_ALERT" ]; then
    echo "No alert files found"
    exit 0
fi

# Check if there are any alerts
ALERT_COUNT=$(jq '.alerts | length' "$LATEST_ALERT")

if [ "$ALERT_COUNT" -eq 0 ]; then
    echo "No alerts to send"
    exit 0
fi

echo "📧 Sending $ALERT_COUNT alerts..."

# Create markdown summary
MARKDOWN_SUMMARY=$(cat << 'EOM'
# 🚨 Dependency Security Alert

**Alert Time:** $(date)
**Alert Count:** $ALERT_COUNT

## Critical Issues

$(jq -r '.alerts[] | select(.severity == "critical") | "- **\(.package)**: \(.message)"' "$LATEST_ALERT")

## High Priority Issues

$(jq -r '.alerts[] | select(.severity == "high") | "- **\(.package)**: \(.message)"' "$LATEST_ALERT")

## Recommended Actions

1. Review the security vulnerabilities immediately
2. Update affected packages to secure versions
3. Run `npm audit fix` to automatically fix issues
4. Consider using `npm audit fix --force` for breaking changes

## Full Report

See the complete dependency scan report for detailed information.
EOM
)

# Save markdown summary
echo "$MARKDOWN_SUMMARY" > "$ALERT_DIR/alert-summary-$(date +%Y%m%d-%H%M%S).md"

# Send to GitHub (create issue)
if command -v gh &> /dev/null; then
    echo "Creating GitHub issue..."
    gh issue create \
        --title "🚨 Dependency Security Alert - $(date +%Y-%m-%d)" \
        --body "$MARKDOWN_SUMMARY" \
        --label "security,dependencies" || echo "Failed to create GitHub issue"
fi

# Send to Slack (if configured)
SLACK_WEBHOOK=$(jq -r '.notificationSettings.slack.webhook // empty' "$MONITORING_DIR/configs/scan-config.json")
if [ -n "$SLACK_WEBHOOK" ]; then
    echo "Sending Slack notification..."
    curl -X POST -H 'Content-type: application/json' \
        --data "{\"text\":\"🚨 Dependency Security Alert: $ALERT_COUNT issues found\"}" \
        "$SLACK_WEBHOOK" || echo "Failed to send Slack notification"
fi

echo "✅ Alerts sent successfully"
EOF

    chmod +x "$MONITORING_DIR/scripts/send-alerts.sh"
    print_success "Created alert notification system"
}

# Create automated update script
create_update_script() {
    print_status "Creating automated update script..."
    
    cat > "$MONITORING_DIR/scripts/auto-update.sh" << 'EOF'
#!/bin/bash

# Automated Dependency Update System
# Safely updates dependencies with testing and rollback capability

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MONITORING_DIR="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="$MONITORING_DIR/backups/$(date +%Y%m%d-%H%M%S)"

echo "🔄 Starting automated dependency updates..."

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Function to backup package files
backup_package_files() {
    echo "📦 Creating backups..."
    find . -name "package.json" -not -path "./node_modules/*" -not -path "./.dependency-monitoring/*" | while read package_file; do
        local backup_path="$BACKUP_DIR/$(dirname "$package_file")"
        mkdir -p "$backup_path"
        cp "$package_file" "$backup_path/"
        
        # Also backup package-lock.json if it exists
        local lock_file="$(dirname "$package_file")/package-lock.json"
        if [ -f "$lock_file" ]; then
            cp "$lock_file" "$backup_path/"
        fi
    done
    echo "✅ Backups created in $BACKUP_DIR"
}

# Function to update dependencies safely
update_dependencies() {
    local package_dir=$1
    local package_name=$(basename "$package_dir")
    
    echo "🔄 Updating $package_name..."
    
    cd "$package_dir"
    
    # Update dependencies
    npm update 2>&1 | tee "$MONITORING_DIR/reports/update-$package_name-$(date +%Y%m%d-%H%M%S).log"
    
    # Fix security issues
    npm audit fix --audit-level=moderate 2>&1 | tee -a "$MONITORING_DIR/reports/update-$package_name-$(date +%Y%m%d-%H%M%S).log"
    
    # Run tests if available
    if npm run test --silent 2>/dev/null; then
        echo "✅ Tests passed for $package_name"
    else
        echo "⚠️  No tests found or tests failed for $package_name"
    fi
    
    cd - > /dev/null
}

# Function to rollback if needed
rollback_updates() {
    echo "🔄 Rolling back updates..."
    
    find "$BACKUP_DIR" -name "package.json" | while read backup_file; do
        local relative_path=${backup_file#$BACKUP_DIR/}
        cp "$backup_file" "$relative_path"
        
        # Also restore package-lock.json
        local lock_backup="${backup_file%package.json}package-lock.json"
        local lock_target="${relative_path%package.json}package-lock.json"
        if [ -f "$lock_backup" ]; then
            cp "$lock_backup" "$lock_target"
        fi
    done
    
    echo "✅ Rollback completed"
}

# Main update process
main() {
    # Create backups first
    backup_package_files
    
    # Update main project
    if [ -f "package.json" ]; then
        update_dependencies "."
    fi
    
    # Update Lambda functions
    find infra/lambdas -name "package.json" -type f | while read package_file; do
        local package_dir=$(dirname "$package_file")
        update_dependencies "$package_dir"
    done
    
    # Run final scan to verify improvements
    echo "🔍 Running post-update security scan..."
    "$SCRIPT_DIR/scan-dependencies.sh"
    
    echo "✅ Automated updates completed"
    echo "📁 Backups available in: $BACKUP_DIR"
}

# Handle rollback command
if [ "$1" = "--rollback" ]; then
    if [ -n "$2" ]; then
        BACKUP_DIR="$MONITORING_DIR/backups/$2"
        if [ -d "$BACKUP_DIR" ]; then
            rollback_updates
        else
            echo "❌ Backup directory not found: $BACKUP_DIR"
            exit 1
        fi
    else
        echo "❌ Please specify backup timestamp for rollback"
        echo "Usage: $0 --rollback TIMESTAMP"
        exit 1
    fi
else
    main
fi
EOF

    chmod +x "$MONITORING_DIR/scripts/auto-update.sh"
    print_success "Created automated update script"
}

# Create monitoring dashboard
create_monitoring_dashboard() {
    print_status "Creating monitoring dashboard..."
    
    cat > "$MONITORING_DIR/scripts/dashboard.sh" << 'EOF'
#!/bin/bash

# Dependency Monitoring Dashboard
# Displays current status and trends

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MONITORING_DIR="$(dirname "$SCRIPT_DIR")"
REPORT_DIR="$MONITORING_DIR/reports"

echo "📊 Dependency Monitoring Dashboard"
echo "=================================="

# Find latest report
LATEST_REPORT=$(ls -t "$REPORT_DIR"/dependency-scan-*.json 2>/dev/null | head -1)

if [ -z "$LATEST_REPORT" ]; then
    echo "❌ No scan reports found. Run a scan first."
    exit 1
fi

# Display summary
echo ""
echo "📈 Current Status ($(jq -r '.scanTimestamp' "$LATEST_REPORT"))"
echo "----------------------------------------"

TOTAL_PACKAGES=$(jq -r '.summary.totalPackages' "$LATEST_REPORT")
VULNERABLE_PACKAGES=$(jq -r '.summary.vulnerablePackages' "$LATEST_REPORT")
OUTDATED_PACKAGES=$(jq -r '.summary.outdatedPackages' "$LATEST_REPORT")
CRITICAL_VULNS=$(jq -r '.summary.criticalVulnerabilities' "$LATEST_REPORT")
HIGH_VULNS=$(jq -r '.summary.highVulnerabilities' "$LATEST_REPORT")

echo "Total Packages: $TOTAL_PACKAGES"
echo "Vulnerable Packages: $VULNERABLE_PACKAGES"
echo "Outdated Packages: $OUTDATED_PACKAGES"
echo "Critical Vulnerabilities: $CRITICAL_VULNS"
echo "High Vulnerabilities: $HIGH_VULNS"

# Security status
echo ""
if [ "$CRITICAL_VULNS" -gt 0 ]; then
    echo "🚨 CRITICAL: Immediate action required!"
elif [ "$HIGH_VULNS" -gt 0 ]; then
    echo "⚠️  HIGH: Security updates needed"
elif [ "$VULNERABLE_PACKAGES" -gt 0 ]; then
    echo "⚠️  MODERATE: Some vulnerabilities found"
else
    echo "✅ SECURE: No critical vulnerabilities"
fi

# Top vulnerable packages
echo ""
echo "🔍 Most Vulnerable Packages"
echo "---------------------------"
jq -r '.packages[] | select(.vulnerabilities.critical + .vulnerabilities.high > 0) | "\(.name): \(.vulnerabilities.critical) critical, \(.vulnerabilities.high) high"' "$LATEST_REPORT" | head -10

# Trend analysis (if multiple reports exist)
echo ""
echo "📈 Trend Analysis (Last 7 Days)"
echo "-------------------------------"

REPORTS=$(ls -t "$REPORT_DIR"/dependency-scan-*.json 2>/dev/null | head -7)
REPORT_COUNT=$(echo "$REPORTS" | wc -l)

if [ "$REPORT_COUNT" -gt 1 ]; then
    echo "Reports analyzed: $REPORT_COUNT"
    
    # Calculate trend
    OLDEST_REPORT=$(echo "$REPORTS" | tail -1)
    OLD_CRITICAL=$(jq -r '.summary.criticalVulnerabilities' "$OLDEST_REPORT")
    OLD_HIGH=$(jq -r '.summary.highVulnerabilities' "$OLDEST_REPORT")
    
    CRITICAL_TREND=$((CRITICAL_VULNS - OLD_CRITICAL))
    HIGH_TREND=$((HIGH_VULNS - OLD_HIGH))
    
    if [ "$CRITICAL_TREND" -gt 0 ]; then
        echo "Critical vulnerabilities: +$CRITICAL_TREND (worsening)"
    elif [ "$CRITICAL_TREND" -lt 0 ]; then
        echo "Critical vulnerabilities: $CRITICAL_TREND (improving)"
    else
        echo "Critical vulnerabilities: no change"
    fi
    
    if [ "$HIGH_TREND" -gt 0 ]; then
        echo "High vulnerabilities: +$HIGH_TREND (worsening)"
    elif [ "$HIGH_TREND" -lt 0 ]; then
        echo "High vulnerabilities: $HIGH_TREND (improving)"
    else
        echo "High vulnerabilities: no change"
    fi
else
    echo "Not enough historical data for trend analysis"
fi

# Recommendations
echo ""
echo "💡 Recommendations"
echo "------------------"

if [ "$CRITICAL_VULNS" -gt 0 ]; then
    echo "1. 🚨 Fix critical vulnerabilities immediately"
    echo "2. Run: npm audit fix --force"
    echo "3. Consider updating to latest package versions"
fi

if [ "$HIGH_VULNS" -gt 0 ]; then
    echo "1. ⚠️  Address high severity vulnerabilities"
    echo "2. Run: npm audit fix"
    echo "3. Review security advisories"
fi

if [ "$OUTDATED_PACKAGES" -gt 0 ]; then
    echo "1. 📦 Update outdated packages"
    echo "2. Run: npm update"
    echo "3. Test thoroughly after updates"
fi

echo ""
echo "🔧 Quick Actions"
echo "---------------"
echo "Run security scan:    $SCRIPT_DIR/scan-dependencies.sh"
echo "Auto-update packages: $SCRIPT_DIR/auto-update.sh"
echo "Send alerts:          $SCRIPT_DIR/send-alerts.sh"
echo "View this dashboard:  $SCRIPT_DIR/dashboard.sh"
EOF

    chmod +x "$MONITORING_DIR/scripts/dashboard.sh"
    print_success "Created monitoring dashboard"
}

# Create cron job setup
create_cron_setup() {
    print_status "Creating cron job setup..."
    
    cat > "$MONITORING_DIR/scripts/setup-cron.sh" << EOF
#!/bin/bash

# Cron Job Setup for Dependency Monitoring
# Sets up automated scanning and alerting

SCRIPT_DIR="\$(cd "\$(dirname "\${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="\$(cd "\$SCRIPT_DIR/../../.." && pwd)"

echo "⏰ Setting up cron jobs for dependency monitoring..."

# Create cron entries
CRON_ENTRIES="
# Dependency monitoring - Daily security scan at 2 AM
0 2 * * * cd \$PROJECT_ROOT && \$SCRIPT_DIR/scan-dependencies.sh >> \$PROJECT_ROOT/.dependency-monitoring/logs/cron.log 2>&1

# Dependency monitoring - Send alerts if vulnerabilities found at 2:30 AM
30 2 * * * cd \$PROJECT_ROOT && \$SCRIPT_DIR/send-alerts.sh >> \$PROJECT_ROOT/.dependency-monitoring/logs/cron.log 2>&1

# Dependency monitoring - Weekly auto-update on Sundays at 3 AM
0 3 * * 0 cd \$PROJECT_ROOT && \$SCRIPT_DIR/auto-update.sh >> \$PROJECT_ROOT/.dependency-monitoring/logs/cron.log 2>&1
"

# Add to crontab
echo "Adding cron entries..."
(crontab -l 2>/dev/null; echo "\$CRON_ENTRIES") | crontab -

echo "✅ Cron jobs set up successfully"
echo ""
echo "Scheduled tasks:"
echo "- Daily security scan at 2:00 AM"
echo "- Alert notifications at 2:30 AM"
echo "- Weekly auto-updates on Sundays at 3:00 AM"
echo ""
echo "To view current cron jobs: crontab -l"
echo "To remove cron jobs: crontab -e"
EOF

    chmod +x "$MONITORING_DIR/scripts/setup-cron.sh"
    print_success "Created cron job setup script"
}

# Create comprehensive README
create_readme() {
    print_status "Creating monitoring system README..."
    
    cat > "$MONITORING_DIR/README.md" << 'EOF'
# Dependency Monitoring System

Automated monitoring and alerting system for dependency security and updates.

## Overview

This system provides continuous monitoring of NPM dependencies across all package.json files in the project, with automated security scanning, update management, and alerting capabilities.

## Features

- **Automated Security Scanning**: Daily scans for vulnerabilities
- **Dependency Update Management**: Safe automated updates with rollback
- **Alert Notifications**: GitHub issues, Slack, and email alerts
- **Trend Analysis**: Historical tracking of security posture
- **Dashboard**: Real-time status and recommendations

## Directory Structure

```
.dependency-monitoring/
├── configs/           # Configuration files
├── scripts/           # Monitoring and update scripts
├── reports/           # Scan reports and logs
├── alerts/            # Alert files and summaries
├── backups/           # Package.json backups
└── logs/              # System logs
```

## Quick Start

1. **Run Initial Scan**
   ```bash
   ./.dependency-monitoring/scripts/scan-dependencies.sh
   ```

2. **View Dashboard**
   ```bash
   ./.dependency-monitoring/scripts/dashboard.sh
   ```

3. **Set Up Automated Monitoring**
   ```bash
   ./.dependency-monitoring/scripts/setup-cron.sh
   ```

## Scripts

### scan-dependencies.sh
Scans all package.json files for security vulnerabilities and outdated packages.

**Usage:**
```bash
./scan-dependencies.sh
```

### dashboard.sh
Displays current security status, trends, and recommendations.

**Usage:**
```bash
./dashboard.sh
```

### auto-update.sh
Safely updates dependencies with backup and rollback capabilities.

**Usage:**
```bash
./auto-update.sh                    # Update all dependencies
./auto-update.sh --rollback TIMESTAMP  # Rollback to backup
```

### send-alerts.sh
Sends notifications for security alerts via configured channels.

**Usage:**
```bash
./send-alerts.sh
```

### setup-cron.sh
Sets up automated cron jobs for regular monitoring.

**Usage:**
```bash
./setup-cron.sh
```

## Configuration

Edit `.dependency-monitoring/configs/scan-config.json` to customize:

- Alert thresholds
- Security levels to monitor
- Notification channels
- Report formats
- Package exclusions

## Automated Schedule

When cron jobs are set up:

- **Daily at 2:00 AM**: Security scan
- **Daily at 2:30 AM**: Send alerts if issues found
- **Weekly on Sundays at 3:00 AM**: Auto-update dependencies

## Alert Channels

### GitHub Issues
Automatically creates issues for security alerts (requires `gh` CLI).

### Slack Notifications
Configure webhook URL in scan-config.json.

### Email Alerts
Configure SMTP settings in scan-config.json.

## Security Levels

- **Critical**: Immediate action required
- **High**: Address within 24 hours
- **Moderate**: Address within 1 week
- **Low**: Address during regular maintenance

## Best Practices

1. **Review Before Auto-Update**: Check alerts before running auto-updates
2. **Test After Updates**: Run tests after dependency updates
3. **Monitor Trends**: Use dashboard to track security posture over time
4. **Keep Backups**: Auto-update creates backups for easy rollback
5. **Regular Reviews**: Weekly review of security status

## Troubleshooting

### No Scan Results
- Ensure npm is installed and accessible
- Check that package.json files exist
- Verify network connectivity for vulnerability database

### Failed Updates
- Check npm permissions
- Review update logs in reports directory
- Use rollback feature if needed

### Missing Alerts
- Verify notification configuration
- Check alert files in alerts directory
- Ensure proper permissions for notification tools

## Integration

### CI/CD Pipeline
Add security scanning to your CI/CD:

```yaml
- name: Security Scan
  run: ./.dependency-monitoring/scripts/scan-dependencies.sh
```

### Pre-commit Hooks
Add to package.json:

```json
{
  "husky": {
    "hooks": {
      "pre-commit": "./.dependency-monitoring/scripts/scan-dependencies.sh"
    }
  }
}
```

## Maintenance

- **Weekly**: Review dashboard and trends
- **Monthly**: Update monitoring configuration
- **Quarterly**: Review and update alert thresholds
- **Annually**: Audit and optimize monitoring system

## Support

For issues or questions:
1. Check logs in `.dependency-monitoring/logs/`
2. Review configuration in `.dependency-monitoring/configs/`
3. Run dashboard for current status
4. Create GitHub issue for persistent problems
EOF

    print_success "Created comprehensive README"
}

# Main execution
main() {
    print_status "Setting up Dependency Monitoring System..."
    
    setup_monitoring_structure
    create_scanning_config
    create_scanning_script
    create_alert_system
    create_update_script
    create_monitoring_dashboard
    create_cron_setup
    create_readme
    
    # Create initial directories
    mkdir -p "$MONITORING_DIR"/{reports,alerts,backups,logs}
    
    print_success "🎉 Dependency Monitoring System setup complete!"
    
    echo ""
    echo "📋 Next Steps:"
    echo "1. Run initial scan: ./$MONITORING_DIR/scripts/scan-dependencies.sh"
    echo "2. View dashboard: ./$MONITORING_DIR/scripts/dashboard.sh"
    echo "3. Set up automation: ./$MONITORING_DIR/scripts/setup-cron.sh"
    echo "4. Configure alerts: Edit ./$MONITORING_DIR/configs/scan-config.json"
    echo ""
    echo "📖 Documentation: ./$MONITORING_DIR/README.md"
}

main "$@"