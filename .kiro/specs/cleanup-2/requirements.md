# Deep Legacy De-Reference Cleanup – Runde 2 Requirements

## Introduction

This specification defines the requirements for a comprehensive cleanup of all remaining legacy references to third-party services that are no longer approved for use in the matbakh.app system. Following the successful completion of the Supabase/Vercel cleanup, this phase focuses on removing all remaining traces of legacy services including Supabase, Vercel, Twilio, Resend, Lovable, and other deprecated third-party dependencies.

## Requirements

### Requirement 1: Complete Legacy Service Removal

**User Story:** As a system administrator, I want all legacy third-party service references removed from the codebase, so that the system is fully compliant with approved AWS-native architecture.

#### Acceptance Criteria

1. WHEN scanning the codebase THEN the system SHALL return zero matches for legacy service patterns (supabase|vercel|twilio|resend|lovable)
2. WHEN checking package dependencies THEN the system SHALL contain no packages from legacy service providers
3. WHEN validating environment variables THEN the system SHALL contain no legacy service API keys or configuration
4. WHEN running CI/CD pipelines THEN the system SHALL pass all legacy-guard checks without warnings
5. WHEN checking DNS records THEN the system SHALL contain no CNAME or A records pointing to legacy service domains

### Requirement 2: Automated Detection and Remediation

**User Story:** As a developer, I want automated tools to detect and remediate legacy references, so that cleanup can be performed systematically and completely.

#### Acceptance Criteria

1. WHEN running the detection script THEN the system SHALL generate a comprehensive JSON report of all legacy references
2. WHEN executing remediation scripts THEN the system SHALL provide dry-run capabilities before applying changes
3. WHEN applying changes THEN the system SHALL maintain audit trails of all modifications
4. WHEN verification is performed THEN the system SHALL confirm zero legacy references remain
5. WHEN rollback is needed THEN the system SHALL restore previous state within 30 minutes

### Requirement 3: CI/CD Guard Implementation

**User Story:** As a development team, I want CI/CD guards to prevent reintroduction of legacy services, so that the system remains clean after cleanup.

#### Acceptance Criteria

1. WHEN code is committed THEN the system SHALL fail builds if legacy service imports are detected
2. WHEN packages are added THEN the system SHALL reject legacy service dependencies
3. WHEN environment variables are modified THEN the system SHALL prevent legacy service configuration
4. WHEN pull requests are created THEN the system SHALL block merging if legacy references are found
5. WHEN pre-commit hooks run THEN the system SHALL scan for legacy patterns and fail if found

### Requirement 4: Infrastructure and DNS Cleanup

**User Story:** As a DevOps engineer, I want all infrastructure and DNS references to legacy services removed, so that the system has no external dependencies on deprecated services.

#### Acceptance Criteria

1. WHEN checking DNS records THEN the system SHALL show only AWS CloudFront origins
2. WHEN validating HTTP headers THEN the system SHALL return only AWS service signatures
3. WHEN auditing webhooks THEN the system SHALL have no active endpoints to legacy services
4. WHEN reviewing secrets THEN the system SHALL contain no API keys for legacy services
5. WHEN testing deployment THEN the system SHALL deploy exclusively through AWS infrastructure

### Requirement 5: Documentation and Compliance

**User Story:** As a compliance officer, I want comprehensive documentation of the cleanup process, so that audit requirements are met and the process is repeatable.

#### Acceptance Criteria

1. WHEN cleanup is initiated THEN the system SHALL generate detection reports with full legacy reference inventory
2. WHEN changes are applied THEN the system SHALL maintain detailed audit logs of all modifications
3. WHEN verification is complete THEN the system SHALL produce a "Certificate of Clean" report
4. WHEN GDPR compliance is checked THEN the system SHALL document removal of personal data from legacy services
5. WHEN rollback procedures are needed THEN the system SHALL provide complete restoration instructions

### Requirement 6: Testing and Validation

**User Story:** As a QA engineer, I want comprehensive testing to ensure system functionality is maintained after legacy service removal, so that user experience is not degraded.

#### Acceptance Criteria

1. WHEN running test suites THEN the system SHALL maintain or exceed current code coverage thresholds
2. WHEN performing smoke tests THEN the system SHALL validate all critical user journeys work correctly
3. WHEN checking authentication THEN the system SHALL confirm AWS Cognito-only operation
4. WHEN validating database operations THEN the system SHALL confirm AWS RDS-only connectivity
5. WHEN testing email functionality THEN the system SHALL use only approved email service providers

### Requirement 7: Security and Access Control

**User Story:** As a security engineer, I want all legacy service credentials revoked and access controls updated, so that security posture is improved and attack surface is reduced.

#### Acceptance Criteria

1. WHEN auditing API keys THEN the system SHALL have all legacy service keys revoked and removed
2. WHEN checking access controls THEN the system SHALL use only AWS IAM-based permissions
3. WHEN validating secrets management THEN the system SHALL store all secrets in AWS Secrets Manager or SSM
4. WHEN reviewing network access THEN the system SHALL have no outbound connections to legacy service endpoints
5. WHEN performing security scans THEN the system SHALL pass all vulnerability checks without legacy service warnings

### Requirement 8: Performance and Monitoring

**User Story:** As a site reliability engineer, I want system performance maintained or improved after cleanup, so that user experience and system reliability are preserved.

#### Acceptance Criteria

1. WHEN measuring page load times THEN the system SHALL maintain or improve current performance metrics
2. WHEN checking error rates THEN the system SHALL have no increase in 5xx errors after cleanup
3. WHEN monitoring authentication THEN the system SHALL maintain current success rates
4. WHEN validating database performance THEN the system SHALL show no degradation in query response times
5. WHEN testing under load THEN the system SHALL handle current traffic levels without issues
