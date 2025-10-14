# VC VOLLGAS - Comprehensive Production System Requirements

## Introduction

This specification defines a complete, production-ready Visibility Check (VC) system for matbakh.app that transforms from a simple email-based entry point into a sophisticated business intelligence platform. The system encompasses DOI email flows, business identification, AI-powered analysis, invisible UI, comprehensive dashboards, partner embedding, admin interfaces, credits/billing, social sharing, and full observability.

## Requirements

### Requirement 1: Production DOI & Mail Flow

**User Story:** As a restaurant owner, I want to receive professional, branded emails with proper delivery guarantees, so that I can trust the system and complete the verification process reliably.

#### Acceptance Criteria

1. WHEN the system sends DOI emails THEN it SHALL use live SES/Provider with configured sending domain, DKIM/SPF records
2. WHEN email bounces or complaints occur THEN the system SHALL capture webhooks and store events in mail_events table
3. WHEN a user requests DOI THEN the system SHALL implement proper Double-Opt-In flow: /vc/start → DOI-Mail → Token verification
4. WHEN DOI tokens are generated THEN they SHALL have configurable TTL and enforce resend limits
5. WHEN consent is captured THEN the system SHALL log audit trail with timestamp, IP, user-agent, partner_id, campaign_id

### Requirement 2: Business Identification System

**User Story:** As a restaurant owner, I want the system to automatically find and verify my business information from multiple sources, so that the analysis is accurate and I don't have to manually enter everything.

#### Acceptance Criteria

1. WHEN a user enters business details THEN the form SHALL provide name, address auto-complete, website, and optional social media fields
2. WHEN business lookup is performed THEN the system SHALL query Google Places, Meta Graph, and optionally Tripadvisor/Yelp APIs
3. WHEN multiple business matches are found THEN the system SHALL perform fuzzy matching with confidence scores and present candidate list for user selection
4. WHEN business data is collected THEN the system SHALL store evidence with source, URL, timestamp, and hash for each data point
5. WHEN no exact match is found THEN the system SHALL provide manual entry option with validation

### Requirement 3: Bedrock AI Analysis Engine

**User Story:** As a restaurant owner, I want AI-powered analysis of my digital presence that provides specific, actionable recommendations with ROI estimates, so that I can make informed decisions about my marketing investments.

#### Acceptance Criteria

1. WHEN analysis is triggered THEN the system SHALL orchestrate via Step Functions: Fetch → Normalize → Score → Recommend → ROI calculation
2. WHEN AI analysis runs THEN it SHALL use AWS Bedrock models with microcopy tonality including inclusive language rules
3. WHEN prompts are executed THEN they SHALL use few-shot examples, low temperature settings, and JSON schema validators for deterministic output
4. WHEN analysis completes THEN it SHALL store results in vc_result JSONB with score breakdown, trends, and structured actions containing why/how/impact/effort/ROI
5. WHEN analysis fails THEN the system SHALL implement proper guardrails and fallback mechanisms

### Requirement 4: Invisible UI & Inclusive Language

**User Story:** As a mobile user who wants quick answers, I want a streamlined interface that shows key insights without scrolling and uses simple, inclusive language, so that I can quickly understand and act on recommendations.

#### Acceptance Criteria

1. WHEN Invisible Mode is active THEN the system SHALL display AnswerCards and FollowUpChips with zero-scroll mobile experience
2. WHEN content is generated THEN it SHALL use inclusive, stereotype-free language with business-German to simple-German glossary
3. WHEN UI mode is selected THEN the system SHALL provide Standard/Invisible/System toggle that persists across sessions
4. WHEN mode changes occur THEN the system SHALL track analytics events for usage patterns
5. WHEN mobile users access the system THEN Invisible Mode SHALL be the default experience

### Requirement 5: Results & Owner Dashboard

**User Story:** As a restaurant owner, I want a comprehensive dashboard showing my visibility score, trends, and prioritized action items with export capabilities, so that I can track progress and share results with my team.

#### Acceptance Criteria

1. WHEN results are displayed THEN the system SHALL show overall score, platform subscores, trend analysis, and top-3 ROI-sorted actions
2. WHEN dashboard is accessed THEN it SHALL provide owner overview with KPIs, 7/30/90-day charts, and quick-wins table
3. WHEN actions are reviewed THEN users SHALL be able to preview content before approval and posting
4. WHEN data export is requested THEN the system SHALL provide PDF and CSV export options
5. WHEN evidence is shown THEN all recommendations SHALL include source attribution and links

### Requirement 6: Partner Embed & Credits System

**User Story:** As a business partner, I want to embed the VC widget on my website with proper attribution and credit tracking, so that I can offer value to my clients while managing my usage costs.

#### Acceptance Criteria

1. WHEN partner embeds widget THEN the system SHALL provide vanilla JavaScript snippet with postMessage and dynamic height adjustment
2. WHEN VC requests are made THEN the system SHALL track partner_id and campaign_id for proper attribution
3. WHEN credits are consumed THEN the system SHALL implement issue/redeem system with overage policies
4. WHEN admin manages credits THEN they SHALL be able to grant/adjust credits with full audit trail
5. WHEN partner usage is tracked THEN all leads and runs SHALL be properly attributed to originating partner

### Requirement 7: Admin & Super-Admin Interfaces

**User Story:** As an administrator, I want comprehensive management interfaces to monitor leads, manage partners, review content, and control system features, so that I can ensure smooth operations and compliance.

#### Acceptance Criteria

1. WHEN admin accesses overview THEN they SHALL see leads (DOI pending/verified/VC done), VC runs with JSONB drilldown, and partner management
2. WHEN partner management is needed THEN admin SHALL manage origins, webhooks, secrets, and credit balances with ledger view
3. WHEN super-admin access is required THEN they SHALL control feature flags, allowed origins, secrets (KMS), and impersonation with 2-step verification
4. WHEN RBAC is enforced THEN the system SHALL implement viewer/owner/partner_admin/admin/super_admin roles with complete audit trail
5. WHEN content moderation is needed THEN admin SHALL have access to content queue and approval workflows

### Requirement 8: Social Sharing & OG Integration

**User Story:** As a restaurant owner, I want to share my visibility results on social media with attractive previews that drive traffic back to my full report, so that I can showcase my improvements and attract more customers.

#### Acceptance Criteria

1. WHEN social sharing occurs THEN the system SHALL generate Edge Function OG images (1200×630) with LinkedIn/Twitter card support
2. WHEN share links are accessed THEN they SHALL redirect humans to proper result pages while serving OG data to crawlers
3. WHEN share teasers are created THEN they SHALL include score and 1 key insight (max 120 characters) with click-through to full results
4. WHEN social previews are generated THEN they SHALL be optimized for each platform's requirements
5. WHEN shared content is accessed THEN proper attribution and tracking SHALL be maintained

### Requirement 9: Observability, Security & Compliance

**User Story:** As a system administrator, I want comprehensive monitoring, security controls, and GDPR compliance features, so that the system operates reliably and meets all regulatory requirements.

#### Acceptance Criteria

1. WHEN system events occur THEN logs/metrics SHALL track Start/DOI/Ident/Run/Result without PII in logs
2. WHEN security is enforced THEN the system SHALL implement rate limits, HMAC for partner calls, CSP, and allowed origins
3. WHEN GDPR compliance is required THEN the system SHALL maintain consent records, deletion routines, and data minimization
4. WHEN monitoring is active THEN the system SHALL track performance metrics, error rates, and business KPIs
5. WHEN security incidents occur THEN proper alerting and response procedures SHALL be triggered

### Requirement 10: Feature Flags & Rollout Control

**User Story:** As a product manager, I want granular feature flag control and canary deployment capabilities, so that I can safely roll out new features and quickly rollback if issues arise.

#### Acceptance Criteria

1. WHEN feature flags are managed THEN the system SHALL support vc_bedrock_live, vc_posting_hooks, ui_invisible_default, vc_demo_auto flags
2. WHEN canary deployment runs THEN 5-10% of traffic SHALL use live Bedrock with fallback to stub on error budget breach
3. WHEN rollout is controlled THEN feature activation SHALL be gradual with monitoring and automatic rollback capabilities
4. WHEN A/B testing is conducted THEN proper statistical significance and user experience SHALL be maintained
5. WHEN feature toggles change THEN the system SHALL log changes and notify relevant stakeholders

### Requirement 11: End-to-End Testing & Launch Readiness

**User Story:** As a quality assurance engineer, I want comprehensive testing coverage and launch checklists, so that the system meets all requirements and performs reliably in production.

#### Acceptance Criteria

1. WHEN E2E testing runs THEN it SHALL cover Start → DOI → Ident-Pick → Bedrock-Run → Results/Dashboard flow in production-like environment
2. WHEN partner integration is tested THEN it SHALL verify events, attribution, and credit consumption (issue/redeem) workflows
3. WHEN inclusive design is validated THEN tone and invisible-mode mobile experience SHALL be verified
4. WHEN traceability is checked THEN REQ ↔ Design ↔ Contracts ↔ Events SHALL achieve 100% coverage
5. WHEN launch readiness is assessed THEN all acceptance criteria SHALL be verified and documented