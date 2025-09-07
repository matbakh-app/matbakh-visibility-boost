# Bedrock AI Core - Logging & Security System

## 🎯 Overview

The Bedrock AI Core Logging & Security System provides comprehensive logging, PII detection, audit trails, and GDPR compliance for all AI operations. This system ensures that every AI interaction is properly logged, monitored, and compliant with data protection regulations.

## 🏗️ Architecture

### Core Components

1. **Integrated Logging Manager** (`integrated-logging-manager.ts`)
   - Central orchestrator for all logging operations
   - Unified interface for logging AI operations
   - Configuration management and compliance assessment

2. **Logging System** (`logging-system.ts`)
   - CloudWatch structured logging
   - DynamoDB operation tracking
   - Multi-destination logging coordination

3. **PII Detection System** (`pii-detection-system.ts`)
   - Automatic detection of personally identifiable information
   - Content redaction and anonymization
   - Risk assessment and compliance validation

4. **Audit Trail System** (`audit-trail-system.ts`)
   - Comprehensive audit logging for compliance
   - Event tracking and compliance reporting
   - GDPR Article 30 compliance (Records of processing activities)

5. **Log Retention System** (`log-retention-system.ts`)
   - Automated log cleanup and archiving
   - Configurable retention policies
   - Cost optimization through lifecycle management

6. **PostgreSQL Archive System** (`postgresql-archive-system.ts`)
   - Long-term GDPR-compliant archiving
   - Data subject request handling (Articles 15-22)
   - Encrypted storage and anonymization

## 🔧 Configuration

### Environment Variables

```bash
# DynamoDB Tables
BEDROCK_LOGS_TABLE=matbakh-bedrock-agent-logs-production
AUDIT_TRAIL_TABLE=matbakh-bedrock-audit-trail-production

# CloudWatch Logging
BEDROCK_LOG_GROUP=/aws/lambda/bedrock-agent

# S3 Archive Buckets
AI_LOGS_ARCHIVE_BUCKET=matbakh-bedrock-ai-logs-archive-production
AUDIT_ARCHIVE_BUCKET=matbakh-bedrock-audit-archive-production

# Security & Encryption
ANONYMIZATION_SALT=your-secure-salt-here
ARCHIVE_ENCRYPTION_KEY=your-encryption-key-here

# PostgreSQL (for GDPR archiving)
RDS_HOST=your-rds-endpoint
RDS_PORT=5432
RDS_DATABASE=matbakh_production
RDS_USERNAME=bedrock_logger
RDS_PASSWORD=secure-password
```

### Logging Configuration

```typescript
const config = {
  enable_cloudwatch: true,
  enable_dynamodb: true,
  enable_postgresql_archive: true,
  enable_pii_detection: true,
  enable_audit_trail: true,
  pii_detection_threshold: 0.5,
  auto_anonymize: true,
  retention_policy: 'ai_operation_logs',
  compliance_mode: 'strict' // 'strict' | 'standard' | 'minimal'
};
```

## 🚀 Usage

### Basic AI Operation Logging

```typescript
import { integratedLoggingManager } from './integrated-logging-manager';

const result = await integratedLoggingManager.logAIOperation({
  operation_type: 'visibility_check',
  provider: 'claude-3.5-sonnet',
  prompt: 'Analyze this restaurant business',
  response: 'Here is the analysis...',
  token_usage: {
    input_tokens: 100,
    output_tokens: 200,
    total_cost_usd: 0.05
  },
  execution_time_ms: 1500,
  status: 'success',
  context: {
    user_id: 'user-123',
    request_source: 'web'
  }
});

console.log('Logging result:', result);
```

### PII Detection

```typescript
import { piiDetectionSystem } from './pii-detection-system';

const content = 'Contact me at john@example.com or call +49 30 123456';
const detection = piiDetectionSystem.detectPII(content);

console.log('PII detected:', detection.detected);
console.log('Redacted content:', detection.redacted_content);
console.log('Risk score:', piiDetectionSystem.getPIIRiskScore(content));
```

### Data Subject Requests (GDPR)

```typescript
// Handle access request (Article 15)
const accessResponse = await integratedLoggingManager.handleDataSubjectRequest({
  request_type: 'access',
  data_subject_id: 'user-123',
  requester_ip: '192.168.1.1'
});

// Handle erasure request (Article 17)
const erasureResponse = await integratedLoggingManager.handleDataSubjectRequest({
  request_type: 'erasure',
  data_subject_id: 'user-123',
  additional_info: { reason: 'User requested account deletion' }
});
```

### Compliance Reporting

```typescript
const report = await integratedLoggingManager.generateComplianceReport(
  '2024-01-01T00:00:00Z',
  '2024-01-31T23:59:59Z'
);

console.log('Total events:', report.summary.total_events);
console.log('GDPR relevant:', report.summary.gdpr_relevant_events);
console.log('Violations:', report.summary.compliance_violations);
```

## 🛡️ Security Features

### PII Detection Patterns

The system detects the following PII types:

- **Email addresses**: `john@example.com`
- **German phone numbers**: `+49 30 123456`, `0171 9876543`
- **International phone numbers**: `+1 555 123 4567`
- **German addresses**: `Musterstraße 123, 12345 Berlin`
- **Names with titles**: `Herr Schmidt`, `Frau Müller`
- **IBAN numbers**: `DE89 3704 0044 0532 0130 00`
- **Credit card numbers**: `4111 1111 1111 1111`
- **IP addresses**: `192.168.1.1`

### Security Guards

- **Prompt-level security**: Embedded security constraints in every AI prompt
- **Content validation**: Pre-processing safety checks
- **Rate limiting**: Prevents abuse and controls costs
- **Access control**: User-based permissions and rollout controls

### Encryption

- **Data at rest**: S3 server-side encryption (AES-256)
- **Archive encryption**: Custom encryption for sensitive archives
- **Hash-based anonymization**: Irreversible anonymization for analytics

## 📊 Monitoring & Alerting

### CloudWatch Metrics

- AI operation success/failure rates
- PII detection frequency
- Token usage and costs
- Execution times and performance

### CloudWatch Alarms

- High error rates in logging system
- DynamoDB throttling on logging tables
- Unusual PII detection patterns
- Cost threshold breaches

### Dashboard

Access the CloudWatch dashboard: **BedrockAICore-Logging**

Key metrics displayed:
- DynamoDB capacity usage
- Recent errors and warnings
- PII detection trends
- Compliance status

## 🗄️ Data Storage

### DynamoDB Tables

#### bedrock_agent_logs
- **Purpose**: Real-time AI operation tracking
- **TTL**: Configurable (default: 365 days)
- **Indexes**: operation_type, timestamp
- **Capacity**: Auto-scaling enabled

#### bedrock_audit_trail
- **Purpose**: Comprehensive audit logging
- **TTL**: 7 years (GDPR compliance)
- **Indexes**: event_type, actor_id, timestamp
- **Capacity**: Auto-scaling enabled

### S3 Archive Buckets

#### AI Logs Archive
- **Lifecycle**: Standard → IA (30d) → Glacier (90d) → Deep Archive (365d)
- **Encryption**: AES-256
- **Versioning**: Enabled
- **Access**: Restricted to logging system

#### Audit Archive
- **Lifecycle**: Standard → IA (90d) → Glacier (365d)
- **Encryption**: AES-256
- **Retention**: 7 years minimum
- **Access**: Audit and compliance only

### PostgreSQL Archive

#### ai_action_logs
```sql
CREATE TABLE ai_action_logs (
  archive_id UUID PRIMARY KEY,
  original_id VARCHAR(255) NOT NULL,
  record_type VARCHAR(50) NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  encrypted_data TEXT NOT NULL,
  anonymization_level VARCHAR(20),
  retention_until TIMESTAMPTZ NOT NULL,
  compliance_metadata JSONB,
  access_log JSONB
);
```

## 🔄 Retention Policies

### AI Operation Logs
- **Retention**: 365 days
- **Archive**: Yes (S3)
- **Anonymization**: After 90 days
- **Cleanup**: Automatic via TTL

### Audit Trail Logs
- **Retention**: 7 years (GDPR requirement)
- **Archive**: Yes (S3 + PostgreSQL)
- **Anonymization**: No (legal requirement)
- **Cleanup**: Manual review required

### User Interaction Logs
- **Retention**: 90 days
- **Archive**: No
- **Anonymization**: Immediate
- **Cleanup**: Automatic

### System Performance Logs
- **Retention**: 180 days
- **Archive**: Yes (S3)
- **Anonymization**: After 30 days
- **Cleanup**: Automatic

## 🧪 Testing

### Unit Tests

```bash
npm test
```

### Integration Tests

```bash
npm run test:integration
```

### Test Coverage

- **Logging System**: 95%+
- **PII Detection**: 98%+
- **Audit Trail**: 92%+
- **Integration**: 90%+

### Test Scenarios

1. **AI Operation Logging**
   - Successful operations
   - Failed operations
   - Timeout scenarios
   - Rate limiting

2. **PII Detection**
   - Various PII types
   - Mixed content
   - Edge cases
   - Performance testing

3. **GDPR Compliance**
   - Data subject access requests
   - Erasure requests
   - Consent tracking
   - Compliance reporting

## 🚀 Deployment

### Prerequisites

- AWS CLI configured
- Node.js 18+ and npm
- TypeScript compiler
- Appropriate IAM permissions

### Deployment Steps

1. **Deploy Infrastructure**
   ```bash
   ./infra/aws/deploy-logging-infrastructure.sh
   ```

2. **Deploy Lambda Function**
   ```bash
   ./infra/lambdas/bedrock-agent/deploy-logging-system.sh
   ```

3. **Verify Deployment**
   ```bash
   aws lambda invoke --function-name bedrock-agent --payload '{"httpMethod":"GET","path":"/health"}' response.json
   ```

### Environment-Specific Deployment

```bash
# Production
ENVIRONMENT=production ./deploy-logging-system.sh

# Staging
ENVIRONMENT=staging ./deploy-logging-system.sh

# Development
ENVIRONMENT=development ./deploy-logging-system.sh
```

## 🔧 Troubleshooting

### Common Issues

#### 1. DynamoDB Throttling
**Symptoms**: High latency, throttling errors
**Solution**: Increase provisioned capacity or enable auto-scaling

#### 2. PII Detection False Positives
**Symptoms**: Normal content flagged as PII
**Solution**: Adjust detection threshold or add custom patterns

#### 3. CloudWatch Log Ingestion Errors
**Symptoms**: Missing log entries
**Solution**: Check IAM permissions and log group configuration

#### 4. S3 Archive Failures
**Symptoms**: Archive operations failing
**Solution**: Verify bucket permissions and encryption settings

### Debug Mode

Enable debug logging:

```typescript
integratedLoggingManager.updateConfiguration({
  debug_mode: true,
  log_level: 'DEBUG'
});
```

### Health Checks

```bash
# Lambda function health
aws lambda invoke --function-name bedrock-agent --payload '{"httpMethod":"GET","path":"/health"}' response.json

# DynamoDB table health
aws dynamodb describe-table --table-name matbakh-bedrock-agent-logs-production

# S3 bucket access
aws s3 ls s3://matbakh-bedrock-ai-logs-archive-production
```

## 📚 API Reference

### IntegratedLoggingManager

#### logAIOperation(params)
Logs AI operations with full compliance checking.

#### validateContentSafety(content)
Validates content for PII and safety concerns.

#### trackUserConsent(params)
Tracks user consent for GDPR compliance.

#### handleDataSubjectRequest(params)
Handles GDPR data subject requests.

#### generateComplianceReport(startDate, endDate)
Generates compliance reports for audit purposes.

### PIIDetectionSystem

#### detectPII(content)
Detects PII in content and returns detailed analysis.

#### getPIIRiskScore(content)
Returns risk score (0-1) for content.

#### validateContentSafety(content)
Validates content safety with recommendations.

### AuditTrailSystem

#### logEvent(event)
Logs audit events for compliance tracking.

#### queryEvents(filters)
Queries audit events with filtering options.

#### generateComplianceReport(startDate, endDate)
Generates detailed compliance reports.

## 🎯 Best Practices

### 1. Logging Strategy
- Log all AI operations without exception
- Include sufficient context for debugging
- Use structured logging for better searchability
- Implement proper error handling

### 2. PII Handling
- Always validate content before AI processing
- Use redacted content for logging
- Implement proper anonymization for analytics
- Regular review of PII detection patterns

### 3. Compliance Management
- Regular compliance report generation
- Prompt handling of data subject requests
- Proper consent tracking and management
- Regular audit of retention policies

### 4. Performance Optimization
- Use appropriate DynamoDB capacity settings
- Implement proper caching strategies
- Monitor and optimize token usage
- Regular cleanup of expired data

### 5. Security Measures
- Regular rotation of encryption keys
- Proper IAM role configuration
- Network security for database connections
- Regular security audits

## 📞 Support

For issues or questions regarding the logging system:

1. Check the troubleshooting section
2. Review CloudWatch logs for errors
3. Verify configuration settings
4. Contact the development team

## 📄 License

This logging system is part of the Matbakh AI Core and is subject to the project's license terms.