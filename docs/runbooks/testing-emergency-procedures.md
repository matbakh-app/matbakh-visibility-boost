# Testing Emergency Procedures

## Overview

This runbook provides step-by-step procedures for handling critical testing infrastructure failures that block development or deployment.

## Emergency Scenarios

### 1. Green Core Tests Failing Consistently

**Symptoms:**
- Multiple PRs blocked by Green Core failures
- Tests passing locally but failing in CI
- Intermittent failures across different environments

**Immediate Actions:**
```bash
# Execute emergency rollback
tsx scripts/emergency-rollback-procedures.ts

# Switch to emergency test mode
npm run test:emergency

# Validate basic functionality
./scripts/run-emergency-tests.sh
```

**Recovery Steps:**
1. Identify root cause of failures
2. Fix underlying issues
3. Gradually restore full test suite
4. Monitor for stability

### 2. Jest Worker Crashes

**Symptoms:**
- Tests crashing with worker errors
- Memory-related failures
- Timeout issues in CI

**Immediate Actions:**
```bash
# Use emergency Jest configuration
jest --config=jest.config.emergency.cjs --maxWorkers=1

# Clear all caches
npm run test -- --clearCache
rm -rf node_modules/.cache

# Run tests serially
npm run test:emergency
```

### 3. Quarantine System Malfunction

**Symptoms:**
- Tests incorrectly quarantined
- Quarantine system not releasing stable tests
- False positive flakiness detection

**Immediate Actions:**
```bash
# Disable quarantine temporarily
tsx scripts/test-quarantine-manager.ts disable-all

# Run without quarantine
./scripts/run-emergency-tests.sh

# Manual test validation
npm run test:green-core
```

### 4. Complete Test Infrastructure Failure

**Symptoms:**
- No tests can run
- CI/CD completely blocked
- Critical deployment needed

**Emergency Bypass Procedure:**
```bash
# Create emergency bypass
echo "#!/bin/bash" > scripts/emergency-bypass.sh
echo "echo 'EMERGENCY BYPASS ACTIVE - MANUAL VALIDATION REQUIRED'" >> scripts/emergency-bypass.sh
echo "exit 0" >> scripts/emergency-bypass.sh
chmod +x scripts/emergency-bypass.sh

# Use bypass in CI (TEMPORARY ONLY)
# Update .github/workflows to use emergency-bypass.sh
```

**⚠️ WARNING:** Emergency bypass should only be used for critical deployments and must be reverted immediately after the emergency.

## Recovery Procedures

### Post-Emergency Checklist

1. **Identify Root Cause**
   - Review error logs and failure patterns
   - Check for recent changes that may have caused issues
   - Validate environment consistency

2. **Implement Fixes**
   - Address underlying technical issues
   - Update test configurations if needed
   - Improve error handling and resilience

3. **Gradual Restoration**
   - Start with emergency tests
   - Gradually add back test categories
   - Monitor stability at each step

4. **Validation**
   - Run full test suite multiple times
   - Verify CI/CD pipeline stability
   - Confirm no regressions introduced

5. **Documentation**
   - Document the incident and resolution
   - Update emergency procedures if needed
   - Share lessons learned with team

## Emergency Contacts

- **Testing Lead:** [Contact Information]
- **DevOps Team:** [Contact Information]  
- **On-Call Engineer:** [PagerDuty/Slack]

## Prevention Measures

### Monitoring
- Set up alerts for test failure rates
- Monitor test execution times
- Track quarantine queue length

### Regular Maintenance
- Weekly review of quarantined tests
- Monthly performance optimization
- Quarterly emergency drill exercises

### Backup Strategies
- Maintain emergency test configurations
- Keep rollback scripts updated
- Document all critical procedures

---

**Remember:** Emergency procedures are for critical situations only. Always follow up with proper root cause analysis and permanent fixes.
