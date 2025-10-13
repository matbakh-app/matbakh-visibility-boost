# Enhanced Rollback System - Quick Reference Guide

## 🚀 Quick Start Commands

### Interactive Mode (Recommended)
```bash
./scripts/comprehensive-rollback.sh
```

### Direct Commands
```bash
# System validation
./scripts/comprehensive-rollback.sh validate

# Browse archive
./scripts/comprehensive-rollback.sh browse

# Emergency recovery
./scripts/comprehensive-rollback.sh rapid-recovery

# Component restoration
./scripts/comprehensive-rollback.sh restore src/components/auth/LoginForm.tsx --dry-run
```

## 📦 Archive Management

### Browse & Search
```bash
# Interactive archive browser
npx tsx scripts/archive-management-system.ts browse

# Search components
npx tsx scripts/archive-management-system.ts search --origin=supabase --risk=high

# Generate statistics
npx tsx scripts/archive-management-system.ts stats

# Export report
npx tsx scripts/archive-management-system.ts export --format=html
```

### Cleanup Operations
```bash
# Dry run cleanup (90+ days)
npx tsx scripts/archive-management-system.ts cleanup --dry-run

# Force cleanup
npx tsx scripts/archive-management-system.ts cleanup --force
```

## 🔄 Component Restoration

### On-Hold Components
```bash
# List all on-hold components
npx tsx scripts/restore-onhold-component.ts list

# Filter by risk level
npx tsx scripts/restore-onhold-component.ts list --risk=critical

# Search by pattern
npx tsx scripts/restore-onhold-component.ts list --pattern=Auth

# Generate restoration report
npx tsx scripts/restore-onhold-component.ts report
```

### Restore Operations
```bash
# Dry run restoration
npx tsx scripts/restore-onhold-component.ts restore src/components/auth/LoginForm.tsx --dry-run

# Restore with dependency validation
npx tsx scripts/restore-onhold-component.ts restore src/components/auth/LoginForm.tsx --validate-deps

# Restore with dependencies
npx tsx scripts/restore-onhold-component.ts restore src/components/auth/LoginForm.tsx --restore-deps

# Restore top priority components
npx tsx scripts/restore-onhold-component.ts restore-priority 5 --dry-run
```

## 🧪 System Validation

### Health Checks
```bash
# Quick validation
npx tsx scripts/system-state-validator.ts validate --skip-optional

# Full validation
npx tsx scripts/system-state-validator.ts validate

# Specific check
npx tsx scripts/system-state-validator.ts check typescript-compilation

# Generate health report
npx tsx scripts/system-state-validator.ts report
```

### Continuous Monitoring
```bash
# Start monitoring (5-minute intervals)
npx tsx scripts/system-state-validator.ts monitor 300000

# Start monitoring (1-minute intervals)
npx tsx scripts/system-state-validator.ts monitor 60000
```

## 🔧 Enhanced Rollback Operations

### Checkpoint Management
```bash
# Create checkpoint
npx tsx scripts/enhanced-rollback-system.ts checkpoint phase-3

# List checkpoints
ls src/archive/rollback-checkpoints/

# Rapid recovery from latest checkpoint
npx tsx scripts/enhanced-rollback-system.ts rapid-recovery

# Recovery from specific checkpoint
npx tsx scripts/enhanced-rollback-system.ts rapid-recovery checkpoint-phase-3-1234567890
```

### Emergency Procedures
```bash
# Emergency stop
npx tsx scripts/enhanced-rollback-system.ts emergency-stop "Critical system failure"

# System validation
npx tsx scripts/enhanced-rollback-system.ts validate

# Health monitoring
npx tsx scripts/enhanced-rollback-system.ts health-monitor 30000
```

## 📊 Common Use Cases

### Daily Maintenance
```bash
# Morning health check
npx tsx scripts/system-state-validator.ts validate --skip-optional

# Archive statistics
npx tsx scripts/archive-management-system.ts stats

# Quick system validation
./scripts/comprehensive-rollback.sh validate
```

### Weekly Maintenance
```bash
# Comprehensive health report
npx tsx scripts/system-state-validator.ts report

# Archive cleanup check
npx tsx scripts/archive-management-system.ts cleanup --dry-run

# On-hold component review
npx tsx scripts/restore-onhold-component.ts report
```

### Emergency Response
```bash
# Immediate system recovery
./scripts/comprehensive-rollback.sh rapid-recovery

# Emergency stop and preserve state
npx tsx scripts/enhanced-rollback-system.ts emergency-stop "Production issue"

# Validate system after recovery
./scripts/comprehensive-rollback.sh validate
```

## 🎯 Filter Options

### Archive Search Filters
```bash
--origin=<origin>          # lovable, supabase, kiro, unknown
--risk=<level>             # low, medium, high, critical
--pattern=<regex>          # Path pattern matching
--has-backend-deps         # Components with backend dependencies
--has-routes              # Components with route usage
--format=<format>         # json, csv, html (for exports)
```

### Restoration Options
```bash
--dry-run                 # Show what would be done
--force                   # Force operation (overwrite existing)
--validate-deps           # Validate dependencies before restoration
--restore-deps            # Also restore missing dependencies
--max-depth=<N>           # Maximum dependency depth (default: 5)
```

### Validation Options
```bash
--skip-optional           # Skip optional checks (faster)
--skip-important          # Skip important checks (critical only)
--parallel                # Run checks in parallel
--timeout=<ms>            # Global timeout for all checks
```

## 🚨 Emergency Contacts & Procedures

### Critical System Failure
1. **Immediate**: `npx tsx scripts/enhanced-rollback-system.ts emergency-stop "Description"`
2. **Recovery**: `./scripts/comprehensive-rollback.sh rapid-recovery`
3. **Validation**: `./scripts/comprehensive-rollback.sh validate`
4. **Report**: Document incident and resolution steps

### Component Restoration Emergency
1. **Identify**: `npx tsx scripts/restore-onhold-component.ts list --pattern=<component>`
2. **Validate**: `npx tsx scripts/restore-onhold-component.ts restore <path> --dry-run`
3. **Restore**: `npx tsx scripts/restore-onhold-component.ts restore <path> --validate-deps`
4. **Verify**: `npx tsx scripts/system-state-validator.ts validate`

### Archive Corruption
1. **Assess**: `npx tsx scripts/archive-management-system.ts stats`
2. **Verify**: Check archive integrity in `src/archive/consolidated-legacy-archive-2025-09-18/`
3. **Recover**: Use backup checkpoints from `src/archive/rollback-checkpoints/`
4. **Rebuild**: Re-run archival process if necessary

## 📋 Status Codes & Exit Codes

### Success Codes
- `0` - Operation completed successfully
- `Exit Code: 0` - All validations passed

### Warning Codes
- Non-zero exit with warnings in output
- `⚠️` symbols in output indicate warnings

### Error Codes
- `1` - General error or validation failure
- `❌` symbols in output indicate errors

## 🔍 Troubleshooting Quick Fixes

### Common Issues
```bash
# TypeScript compilation errors
npx tsc --noEmit

# Build failures
npm run build

# Test failures
npm test -- --passWithNoTests

# Archive access issues
ls -la src/archive/consolidated-legacy-archive-2025-09-18/

# Permission issues
chmod +x scripts/comprehensive-rollback.sh
```

### Performance Issues
```bash
# Check system resources
npx tsx scripts/system-state-validator.ts check performance-check

# Monitor system health
npx tsx scripts/system-state-validator.ts monitor 60000

# Generate performance report
npx tsx scripts/system-state-validator.ts report
```

## 📞 Support Information

### Documentation
- **Complete Guide**: `docs/enhanced-rollback-system-documentation.md`
- **Bug Reports**: `docs/restore-onhold-component-bug-fix-report.md`
- **Maintenance**: `docs/architecture-maintenance-guide.md`

### Log Files
- **Rollback Logs**: `rollback-YYYYMMDD-HHMMSS.log`
- **Health Reports**: `health-report-*.json`
- **Archive Reports**: `archive-report-*.json`

### Emergency Contacts
- **System Administrator**: Check emergency notification settings
- **Development Team**: Refer to team contact information
- **Documentation**: All procedures documented in `docs/` directory

---

**Quick Reference Version**: 1.0  
**Last Updated**: September 22, 2025  
**System Status**: 🏆 **GOLD CERTIFIED KIRO PURITY**