# Cleanup 2 - Implementation Plan

**Date:** 2025-01-15  
**Priority:** P1 – Code Quality & Maintenance  
**Status:** 🟡 ACTIVE  
**Predecessor:** supabase-vercel-cleanup (✅ COMPLETED)

---

## 📋 **IMPLEMENTATION OVERVIEW**

Convert the Cleanup 2 design into a series of coding tasks that implement deep legacy cleanup with automated detection, safe rollback, and compliance certification. Prioritize incremental progress with validation gates and early testing.

---

## 🎯 **TASK LIST**

### **Phase 0: Preparation & Validation**

- [x] 0. Verify system readiness and create baseline
  - Verify branch is clean (`git status`)
  - Run baseline tests (`npm test -- --suite=core`)
  - Create initial backup tag `pre-cleanup-r2`
  - Confirm environment ready before starting
  - _Requirements: 6.5, 9.1_

### **Phase 1: Foundation & Detection Infrastructure**

- [x] 1. Set up cleanup infrastructure and scanning tools

  - Create `scripts/cleanup-2/` directory structure
  - Implement `LegacyReferenceScanner` with multi-service detection
  - Add support for Twilio, Resend, Lovable pattern detection
  - Export JSON reports for Bedrock integration
  - _Requirements: 1.1, 2.1, 2.2_

- [x] 1.1 Implement automated detection engine

  - Create `legacy-scanner.ts` with configurable patterns
  - Implement risk assessment and categorization
  - Generate machine-readable `reports/detection.json`
  - Add confidence scoring for each detection
  - _Requirements: 2.1, 2.2_

- [x] 1.2 Create rollback infrastructure

  - Implement `RollbackManager` with Git tagging strategy
  - Create phase-based rollback points (`cleanup-r2-phaseX-<timestamp>`)
  - Add S3 artifact backup capability
  - Implement automated rollback triggers
  - _Requirements: 6.5, 9.1_

- [ ]\* 1.3 Set up monitoring and reporting integration
  - Configure CloudWatch Logs streaming for cleanup events
  - Integrate with Meta Monitor Dashboard
  - Create audit trail logging system
  - _Requirements: 10.1, 10.2_

### **Phase 2: CI/CD Guards & Prevention System**

- [x] 2. Implement legacy prevention guardrails

  - Create ESLint rules for legacy import blocking
  - Set up Husky pre-commit hooks with legacy scanning
  - Implement GitHub Actions `legacy-guard.yml` workflow
  - Add package install validation hooks
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 2.1 Configure ESLint legacy rules

  - Add `no-restricted-imports` configuration for legacy services
  - Create custom ESLint rule for external service detection
  - Integrate with existing ESLint configuration
  - Test rule effectiveness with sample violations
  - _Requirements: 3.1_

- [x] 2.2 Set up pre-commit validation

  - Configure Husky hooks for legacy pattern scanning
  - Implement fast scan for commit-time validation
  - Add bypass mechanism for emergency commits
  - Create developer documentation for hook usage
  - _Requirements: 3.2_

- [x]\* 2.3 Create GitHub Actions workflow
  - Implement `legacy-guard.yml` for PR validation
  - Add automated legacy reference detection
  - Configure merge blocking on legacy pattern matches
  - Set up notification system for violations
  - _Requirements: 3.3_

### **Phase 3: Safe Cleanup Engine Implementation**

- [x] 3. Build core cleanup orchestration system

  - Implement `SafeCleanupEngine` with phase-based processing
  - Create validation suite integration
  - Add build verification via `ci-test-runner.cjs`
  - Implement incremental cleanup with checkpoints
  - _Requirements: 1.1, 6.1, 6.2, 6.3_

- [x] 3.1 Implement cleanup orchestrator

  - Create phase-based cleanup execution
  - Add validation gates between phases
  - Implement automatic rollback on failures
  - Create cleanup progress tracking
  - _Requirements: 1.1, 6.1_

- [x] 3.2 Build validation and testing integration

  - Integrate with Jest test suite execution
  - Add coverage validation (≥85% requirement)
  - Implement build success verification
  - Create performance regression detection
  - _Requirements: 6.1, 6.2, 6.3, 8.1_

- [x]\* 3.3 Create bundle optimization system
  - Implement `BundleOptimizer` with Vite analyzer integration
  - Add esbuild analysis capabilities
  - Generate `bundle-report.json` for dashboard integration
  - Target 5-10% bundle size reduction
  - _Requirements: 8.1_

### **Phase 4: Infrastructure & Security Cleanup**

- [ ] 4. Implement infrastructure compliance validation

  - Create DNS record audit and cleanup system
  - Implement credential revocation and rotation
  - Add AWS-only origin validation
  - Create security compliance documentation
  - _Requirements: 4.1, 4.2, 4.3, 7.1, 7.2_

- [x] 4.1 DNS and infrastructure audit

  - Scan Route53 records for legacy domains
  - Validate CloudFront origins are AWS-only
  - Check HTTP headers for legacy signatures
  - Generate infrastructure compliance report
  - _Requirements: 4.1, 4.2_

- [x] 4.2 Credential and secret management

  - Audit and revoke legacy API keys
  - Migrate remaining secrets to AWS Secrets Manager
  - Document credential rotation in `secrets-rotation-proof.md`
  - Implement secret scanning validation
  - _Requirements: 4.4, 7.1, 7.2, 7.3_

- [ ]\* 4.3 Security compliance validation
  - Run Trivy and Snyk scans for legacy warnings
  - Validate IAM policies for least privilege
  - Check VPC endpoint policies for outbound restrictions
  - Generate security compliance certificate
  - _Requirements: 7.4, 7.5_

### **Phase 5: Code & Configuration Cleanup Execution**

- [ ] 5. Execute systematic legacy reference removal

  - Process remaining ~630 legacy references
  - Clean up deprecated hooks and components
  - Remove architecture scanner artifacts
  - Optimize import statements and dependencies
  - _Requirements: 1.1, 1.2, 1.3_

- [ ] 5.1 Remove Supabase references

  - Scan and remove remaining Supabase imports
  - Clean up Supabase configuration files
  - Remove Supabase-related test artifacts
  - Validate no Supabase endpoints remain
  - _Requirements: 1.1_

- [ ] 5.2 Clean up external service references

  - Remove Twilio, Resend, Lovable references
  - Clean up deprecated third-party integrations
  - Update configuration files to AWS-only services
  - Validate external service removal
  - _Requirements: 1.1_

- [ ] 5.3 Architecture scanner cleanup

  - Archive or remove architecture scanner tools
  - Clean up scanner-generated reports and artifacts
  - Remove unused scanner dependencies
  - Document scanner removal decisions
  - _Requirements: 1.3_

- [ ]\* 5.4 Package and dependency optimization
  - Remove legacy packages from `package.json`
  - Clean up unused dependencies
  - Optimize import statements for tree shaking
  - Validate dependency security with updated scans
  - _Requirements: 1.2_

### **Phase 6: Compliance & Certification**

- [ ] 6. Generate compliance documentation and certification

  - Create comprehensive audit trail documentation
  - Generate "Certificate of Clean" PDF
  - Implement GDPR compliance appendix
  - Set up continuous monitoring system
  - _Requirements: 5.1, 5.2, 5.3, 10.1, 10.2_

- [ ] 6.1 Audit trail and documentation generation

  - Generate `legacy-audit-report.json` with complete findings
  - Create `cleanup-r2-playbook.md` with execution steps
  - Document rollback procedures in `rollback.md`
  - Create deployment policy documentation
  - _Requirements: 5.1, 5.2_

- [ ] 6.2 Certificate and compliance generation

  - Implement `audit-writer.ts` for PDF certificate generation
  - Create GDPR compliance documentation
  - Generate signed verification reports (Kiro + Bedrock)
  - Set up 12-month audit log retention in S3
  - _Requirements: 5.3, 5.4_

- [ ]\* 6.3 Continuous monitoring setup

  - Implement nightly legacy audit CI job
  - Set up drift detection and alerting
  - Create monthly compliance summary generation
  - Configure Meta Monitor dashboard integration
  - _Requirements: 10.1, 10.2, 10.3_

- [ ]\* 6.4 Monitoring hook deployment
  - Deploy `aws logs put-subscription-filter` for real-time cleanup logs
  - Connect Meta Monitor alerts to Slack or email
  - Set up CloudWatch dashboard for cleanup metrics
  - Configure automated alert thresholds
  - _Requirements: 10.1, 10.2_

### **Phase 7: Final Validation & Performance Testing**

- [ ] 7. Comprehensive system validation and performance verification

  - Execute complete test suite validation
  - Perform performance regression testing
  - Validate bundle optimization results
  - Conduct final security and compliance audit
  - _Requirements: 6.1, 6.2, 6.3, 8.1, 8.2, 8.3_

- [ ] 7.1 Performance and bundle validation

  - Measure and validate 5-10% bundle size reduction
  - Confirm P95 latency ≤ 1.5s requirement
  - Validate build time remains within baseline
  - Test page load performance meets targets
  - _Requirements: 8.1, 8.2_

- [ ] 7.2 Security and compliance final audit

  - Run comprehensive security scans (0 legacy warnings)
  - Validate IAM and access control compliance
  - Confirm credential rotation completion
  - Generate final compliance certificate
  - _Requirements: 7.4, 7.5_

- [ ]\* 7.3 System integration testing
  - Execute smoke tests for core functionality
  - Validate Cognito-only authentication flow
  - Test RDS-only database connections
  - Confirm AWS SES email functionality
  - _Requirements: 6.3, 6.4, 6.5_

---

## 🎯 **SUCCESS CRITERIA**

- **Legacy References**: Reduced from ~630 to <50 total
- **Bundle Size**: 5-10% reduction achieved and validated
- **Test Coverage**: Maintained at ≥85% across all test suites
- **Performance**: P95 latency ≤1.5s, no performance regression
- **Security**: 0 legacy warnings in security scans
- **Compliance**: Complete audit trail and Certificate of Clean generated

---

## 📋 **TASK EXECUTION NOTES**

- Tasks marked with `*` are optional but recommended for comprehensive cleanup
- Each phase includes validation gates that must pass before proceeding
- Rollback capability is maintained throughout all phases
- All changes are logged and auditable for compliance requirements
- Integration with Kiro and Bedrock systems is maintained throughout

---

## 📋 **FINAL HANDOFF DELIVERABLES**

Upon completion of all phases, the following deliverables will be provided:

- `reports/cleanup-summary.json` - Complete cleanup execution summary
- `certificate-of-clean.pdf` - Official compliance certificate
- `rollback-points.txt` - List of all created rollback points
- `legacy-guard-metrics.csv` - CI/CD guard effectiveness metrics

---
