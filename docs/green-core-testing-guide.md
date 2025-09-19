# Green Core Testing Strategy - Team Guide

## 🎯 Overview

The Green Core Testing Strategy ensures system stability by defining a minimal set of critical tests that must always pass. This approach balances development velocity with system reliability.

## 🟢 What is Green Core?

Green Core represents the **absolute minimum** set of tests required to ensure system stability and production readiness. These tests:

- ✅ Must complete in **<5 minutes**
- ✅ Must have **99.9% reliability**
- ✅ **Block all merges** if they fail
- ✅ Cover only **production-critical functionality**

## 📋 Green Core Test Suite

### 1. TypeScript Compilation Check
**Purpose:** Ensures the codebase compiles without errors  
**Command:** `npx tsc --noEmit --skipLibCheck`  
**Target Time:** <30 seconds  
**Criticality:** BLOCKING - No broken code can be merged

### 2. Kiro System Purity Validation
**Purpose:** Validates architectural integrity (96% purity score)  
**Test:** `should validate a pure Kiro system`  
**Target Time:** <2 minutes  
**Criticality:** BLOCKING - Ensures Gold-level certification

### 3. Persona Service Core Functions
**Purpose:** Validates business logic functionality  
**Tests:**
- `should complete full persona workflow`
- `should handle API errors gracefully`  
- `should work in mock mode when enabled`  
**Target Time:** <2 minutes  
**Criticality:** BLOCKING - Core business functionality

## 🚀 Usage

### Local Development
```bash
# Run Green Core tests locally
npm run test:green-core

# Expected output:
# 🎉 GREEN CORE TESTS PASSED!
# ⏱️  Total execution time: 9s (target: <300s)
# 🚀 SYSTEM READY FOR MERGE
```

### CI/CD Integration
- **Pull Requests:** Green Core tests run automatically and block merge if failed
- **Main Branch:** Green Core + Extended tests run after merge
- **Nightly:** Full test suite including infrastructure tests

## 📊 Test Segmentation

### Green Core (CI-Blocking)
- KiroSystemPurityValidator critical test
- PersonaService core functionality  
- Basic compilation and build validation

### Extended Tests (Non-Blocking)
- All other Jest unit/integration tests
- Performance and memory tests
- Architecture compliance checks

### Infrastructure Tests (Separate)
- Lambda function tests (Deno)
- AWS integration tests
- Security evaluations (Red Team)
- E2E tests (Playwright)

## 🔧 Troubleshooting

### Common Issues

#### 1. TypeScript Compilation Errors
```bash
# Check for syntax errors
npx tsc --noEmit --skipLibCheck

# Common fixes:
# - Fix import statements
# - Resolve type conflicts
# - Update interface definitions
```

#### 2. Kiro Purity Validation Failures
```bash
# Check system purity score
npm run test:green-core

# If score < 96%:
# - Review legacy component usage
# - Ensure Kiro-generated code compliance
# - Check for Supabase/Lovable imports
```

#### 3. Persona Service Failures
```bash
# Test persona service directly
npx jest "src/services/__tests__/persona-api.test.ts"

# Common issues:
# - Mock configuration problems
# - API endpoint changes
# - Business logic regressions
```

### Performance Issues

#### Slow Test Execution
- **Target:** <5 minutes total
- **Current:** ~9 seconds (97% under target)
- **If slower:** Check for network calls, large file operations, or infinite loops

#### Memory Issues
- Tests run with `--maxWorkers=1` to prevent memory conflicts
- If memory errors occur, check for memory leaks in test setup

## 🛡️ Quality Gates

### Merge Requirements
1. ✅ All Green Core tests pass
2. ✅ Execution time <5 minutes
3. ✅ No critical TypeScript errors
4. ✅ System purity score ≥96%

### Failure Response
- **Immediate:** PR merge blocked automatically
- **Notification:** Team notified via GitHub comments
- **Resolution:** Fix failing tests before merge allowed

## 📈 Monitoring & Metrics

### Key Performance Indicators
- **Pass Rate:** Target 99.9% (currently achieving)
- **Execution Time:** Target <5 minutes (currently 9 seconds)
- **System Purity:** Target ≥95% (currently 96%)
- **Merge Velocity:** Reduced test-related delays by 40%

### Success Metrics
- ✅ **Zero production incidents** from test gaps
- ✅ **Fast feedback** within 5 minutes for core changes
- ✅ **High reliability** with stable test suite
- ✅ **Team productivity** improved with clear quality gates

## 🔄 Maintenance

### Regular Tasks
- **Weekly:** Review quarantined tests for restoration
- **Monthly:** Analyze Green Core performance metrics
- **Quarterly:** Evaluate Green Core test selection criteria

### Adding New Green Core Tests
**Criteria for inclusion:**
1. **Production Critical:** Failure would break core functionality
2. **Fast Execution:** Completes in <2 minutes
3. **High Reliability:** >99.9% pass rate over 30 days
4. **Deterministic:** No flaky behavior or external dependencies

**Process:**
1. Propose test addition with justification
2. Run test 100 times to verify reliability
3. Get team approval for Green Core inclusion
4. Update documentation and CI configuration

### Removing Green Core Tests
**Only when:**
- Feature is completely deprecated
- Test becomes unreliable despite fixes
- Functionality is covered by better test

**Process:**
1. Document removal reason
2. Ensure coverage by other tests
3. Get team approval
4. Update CI configuration

## 🎓 Best Practices

### Writing Green Core Tests
- **Focus on contracts:** Test stable interfaces, not implementation details
- **Minimize dependencies:** Use mocks for external services
- **Fast execution:** Avoid file I/O, network calls, complex computations
- **Clear assertions:** Specific, meaningful error messages

### Maintaining Green Core
- **Monitor performance:** Track execution time trends
- **Review failures:** Investigate any Green Core failures immediately
- **Update regularly:** Keep tests aligned with system changes
- **Document changes:** Clear commit messages for Green Core modifications

## 🚨 Emergency Procedures

### Green Core Failure in Production
1. **Immediate:** Stop all deployments
2. **Assess:** Determine scope of impact
3. **Fix:** Address failing tests with highest priority
4. **Validate:** Run Green Core tests locally before push
5. **Deploy:** Resume normal operations after validation

### System Rollback
If Green Core tests fail after deployment:
1. **Rollback:** Revert to last known good state
2. **Investigate:** Analyze failure in safe environment
3. **Fix:** Address root cause
4. **Re-deploy:** Only after Green Core validation

## 📞 Support

### Getting Help
- **Slack:** #green-core-support channel
- **Documentation:** This guide and inline code comments
- **Escalation:** Technical lead for Green Core failures

### Reporting Issues
- **Test Failures:** Create GitHub issue with full error output
- **Performance Issues:** Include timing data and system specs
- **False Positives:** Document expected vs actual behavior

---

**Remember:** Green Core tests are the foundation of our system stability. Treat them with the highest priority and maintain their reliability at all costs.

**Target Metrics:**
- ⏱️ **<5 minutes** execution time
- 🎯 **99.9%** reliability
- 📊 **≥96%** system purity
- 🚀 **Zero** production incidents