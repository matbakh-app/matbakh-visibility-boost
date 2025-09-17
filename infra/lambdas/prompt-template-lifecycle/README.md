# Prompt Template Lifecycle Management System

A comprehensive system for managing AI prompt templates with version control, approval workflows, performance tracking, A/B testing, and rollback capabilities.

## Features

### 🔄 Version Control System
- **Template Management**: Create, update, and organize prompt templates
- **Version Tracking**: Semantic versioning with automated increment
- **Environment Support**: Development, staging, and production environments
- **Template Categories**: Organize templates by type (analysis, generation, classification, etc.)

### ✅ Approval Workflows
- **Multi-Stage Approval**: Configurable approval stages based on environment
- **Role-Based Access**: Different approvers for technical, QA, security, and business reviews
- **Auto-Approval**: Automatic approval for development environment
- **Comment System**: Rich commenting and feedback system
- **Workflow History**: Complete audit trail of all approval activities

### 📊 Performance Tracking
- **Execution Monitoring**: Track all template executions with detailed metrics
- **Performance Analytics**: Response time, success rate, token usage, and cost tracking
- **Error Analysis**: Detailed error patterns and troubleshooting insights
- **Geographic Distribution**: Usage patterns across different regions
- **Trend Analysis**: Historical performance data and forecasting

### 🧪 A/B Testing
- **Variant Management**: Create and manage multiple template variants
- **Traffic Splitting**: Configurable traffic distribution across variants
- **Statistical Analysis**: Confidence levels and statistical significance
- **Success Metrics**: Custom metrics for conversion rate, performance, and cost
- **Real-time Results**: Live monitoring of test performance

### 🔄 Rollback Management
- **Manual Rollback**: Controlled rollback to previous versions
- **Emergency Rollback**: Rapid rollback for critical issues
- **Automatic Rollback**: Condition-based automatic rollback triggers
- **Validation**: Pre-rollback validation and impact assessment
- **Rollback History**: Complete history of all rollback operations

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   API Gateway   │────│  Lambda Function │────│   DynamoDB      │
│                 │    │                  │    │                 │
│ - REST API      │    │ - Version Mgmt   │    │ - Templates     │
│ - Authentication│    │ - Approval Flow  │    │ - Versions      │
│ - Rate Limiting │    │ - Performance    │    │ - Executions    │
└─────────────────┘    │ - A/B Testing    │    │ - A/B Tests     │
                       │ - Rollback Mgmt  │    └─────────────────┘
                       └──────────────────┘
```

## Installation

### Prerequisites
- AWS CLI configured with appropriate permissions
- Node.js 20.x or later
- npm or yarn package manager

### Deployment

1. **Clone and setup**:
```bash
cd infra/lambdas/prompt-template-lifecycle
npm install
```

2. **Run tests**:
```bash
npm test
```

3. **Deploy to AWS**:
```bash
./deploy.sh
```

4. **Optional: Create API Gateway**:
```bash
CREATE_API_GATEWAY=true ./deploy.sh
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `TEMPLATES_TABLE` | DynamoDB table for templates | `prompt-templates` |
| `VERSIONS_TABLE` | DynamoDB table for versions | `template-versions` |
| `EXECUTIONS_TABLE` | DynamoDB table for executions | `template-executions` |
| `AB_TESTS_TABLE` | DynamoDB table for A/B tests | `ab-tests` |
| `AWS_REGION` | AWS region | `eu-central-1` |

## API Reference

### Templates

#### Create Template
```http
POST /templates
Content-Type: application/json

{
  "name": "Customer Support Response",
  "description": "Template for generating customer support responses",
  "content": "Please respond to the customer inquiry: {{inquiry}}",
  "variables": [
    {
      "name": "inquiry",
      "type": "string",
      "required": true,
      "description": "Customer inquiry text"
    }
  ],
  "provider": "claude",
  "category": "generation",
  "tags": ["support", "customer-service"],
  "metadata": {
    "author": "support-team",
    "version": "1.0.0",
    "changelog": "Initial version",
    "estimatedTokens": 100,
    "complexity": "low",
    "usageContext": ["customer-support"]
  }
}
```

#### Get Template
```http
GET /templates/{templateId}
```

### Versions

#### Create Version
```http
POST /versions/create
Content-Type: application/json

{
  "templateId": "template-123",
  "data": {
    "content": "Updated template content: {{inquiry}}",
    "variables": [...],
    "metadata": {
      "author": "developer",
      "changelog": "Improved response quality",
      "estimatedTokens": 120,
      "complexity": "medium"
    },
    "environment": "development"
  }
}
```

#### Deploy Version
```http
PUT /versions/{versionId}/deploy
Content-Type: application/json

{
  "environment": "production"
}
```

### Approval Workflows

#### Submit for Approval
```http
POST /approval/submit
Content-Type: application/json

{
  "versionId": "version-123",
  "userId": "developer-1"
}
```

#### Approve Stage
```http
POST /approval/approve
Content-Type: application/json

{
  "versionId": "version-123",
  "userId": "tech-lead",
  "data": {
    "stageIndex": 0,
    "comment": "Technical review passed"
  }
}
```

#### Get Pending Approvals
```http
GET /approval/pending?approverId=tech-lead
```

### Performance Tracking

#### Record Execution
```http
POST /executions
Content-Type: application/json

{
  "templateVersionId": "version-123",
  "userId": "user-456",
  "input": {"inquiry": "How do I reset my password?"},
  "output": "To reset your password, please...",
  "provider": "claude",
  "tokenUsage": {
    "inputTokens": 15,
    "outputTokens": 45,
    "totalTokens": 60,
    "cost": 0.002
  },
  "responseTime": 1200,
  "status": "success",
  "environment": "production",
  "metadata": {
    "userAgent": "Mozilla/5.0...",
    "region": "eu-central-1",
    "requestId": "req-789"
  }
}
```

#### Get Performance Metrics
```http
GET /performance/metrics?versionId=version-123
```

#### Get Template Analytics
```http
GET /performance/analytics?templateId=template-123&startDate=2025-01-01T00:00:00Z&endDate=2025-01-31T23:59:59Z
```

### A/B Testing

#### Create A/B Test
```http
POST /abtests/create
Content-Type: application/json

{
  "name": "Response Quality Test",
  "description": "Testing improved response generation",
  "variants": [
    {
      "id": "control",
      "name": "Original",
      "templateVersionId": "version-1",
      "trafficPercentage": 50,
      "description": "Current production template"
    },
    {
      "id": "variant-a",
      "name": "Improved",
      "templateVersionId": "version-2",
      "trafficPercentage": 50,
      "description": "Enhanced template with better context"
    }
  ],
  "trafficSplit": {
    "control": 50,
    "variant-a": 50
  },
  "startDate": "2025-01-10T00:00:00Z",
  "successMetrics": [
    {
      "name": "user_satisfaction",
      "type": "user_satisfaction",
      "target": 4.5,
      "weight": 0.7,
      "description": "Average user satisfaction score"
    },
    {
      "name": "response_time",
      "type": "response_time",
      "target": 1000,
      "weight": 0.3,
      "description": "Average response time in milliseconds"
    }
  ],
  "hypothesis": "Enhanced context will improve user satisfaction by 15%"
}
```

#### Start A/B Test
```http
POST /abtests/start
Content-Type: application/json

{
  "testId": "test-123"
}
```

#### Get A/B Test Results
```http
GET /abtests/{testId}/results
```

### Rollback Management

#### Initiate Rollback
```http
POST /rollback/initiate
Content-Type: application/json

{
  "currentVersionId": "version-current",
  "targetVersionId": "version-previous",
  "reason": "Performance degradation detected",
  "userId": "admin-user",
  "rollbackType": "manual"
}
```

#### Emergency Rollback
```http
POST /rollback/emergency
Content-Type: application/json

{
  "templateId": "template-123",
  "environment": "production",
  "reason": "Critical security vulnerability",
  "userId": "security-team"
}
```

#### Validate Rollback Target
```http
GET /rollback/validate?currentVersionId=version-current&targetVersionId=version-target
```

## Usage Examples

### Basic Template Lifecycle

```javascript
// 1. Create template
const template = await createTemplate({
  name: "Product Description Generator",
  content: "Generate a product description for: {{product_name}}",
  // ... other properties
});

// 2. Create new version
const version = await createVersion(template.id, {
  content: "Create an engaging product description for: {{product_name}}",
  environment: "development"
});

// 3. Submit for approval
await submitForApproval(version.id, "developer-1");

// 4. Approve stages
await approveStage(version.id, 0, "tech-lead", "Looks good");
await approveStage(version.id, 1, "qa-lead", "Testing passed");

// 5. Deploy to production
await deployVersion(version.id, "production");
```

### A/B Testing Workflow

```javascript
// 1. Create A/B test
const abTest = await createABTest({
  name: "Response Quality Improvement",
  variants: [
    { id: "control", templateVersionId: "v1" },
    { id: "improved", templateVersionId: "v2" }
  ],
  trafficSplit: { control: 50, improved: 50 }
});

// 2. Start test
await startABTest(abTest.id);

// 3. Monitor results
const results = await getABTestResults(abTest.id);
console.log(`Conversion rates: Control ${results.variantResults[0].conversionRate}%, Improved ${results.variantResults[1].conversionRate}%`);

// 4. Stop test when significant
if (results.statisticalSignificance) {
  await stopABTest(abTest.id);
}
```

### Performance Monitoring

```javascript
// Record execution
await recordExecution({
  templateVersionId: "version-123",
  userId: "user-456",
  input: { product_name: "Wireless Headphones" },
  output: "Premium wireless headphones with noise cancellation...",
  responseTime: 1200,
  status: "success"
});

// Get analytics
const analytics = await getTemplateAnalytics(
  "template-123",
  "2025-01-01T00:00:00Z",
  "2025-01-31T23:59:59Z"
);

console.log(`Total executions: ${analytics.totalExecutions}`);
console.log(`Success rate: ${analytics.averagePerformance.successRate}%`);
```

## Best Practices

### Template Design
- **Clear Variables**: Use descriptive variable names and provide validation rules
- **Modular Content**: Break complex templates into smaller, reusable components
- **Version Documentation**: Always include meaningful changelog entries
- **Token Estimation**: Provide accurate token estimates for cost planning

### Approval Workflows
- **Environment-Specific**: Use different approval requirements for different environments
- **Clear Comments**: Provide detailed feedback during approval process
- **Timely Reviews**: Set up notifications for pending approvals
- **Documentation**: Link to relevant documentation and test results

### Performance Optimization
- **Regular Monitoring**: Set up automated alerts for performance degradation
- **A/B Testing**: Continuously test improvements with statistical rigor
- **Cost Tracking**: Monitor token usage and costs across all templates
- **Error Analysis**: Regularly review error patterns and implement fixes

### Rollback Preparedness
- **Validation**: Always validate rollback targets before execution
- **Documentation**: Document rollback reasons and lessons learned
- **Automation**: Set up automatic rollback triggers for critical metrics
- **Testing**: Regularly test rollback procedures in non-production environments

## Monitoring and Alerting

### Key Metrics to Monitor
- Template execution success rate
- Average response time
- Token usage and costs
- Error rates by type
- A/B test performance
- Approval workflow bottlenecks

### Recommended Alerts
- Success rate drops below 95%
- Response time exceeds 5 seconds
- Daily costs exceed budget thresholds
- Error rate increases by 50%
- Pending approvals older than 24 hours

## Security Considerations

### Access Control
- Use IAM roles with least privilege principle
- Implement API Gateway authentication
- Audit all administrative actions
- Regular access reviews

### Data Protection
- Encrypt sensitive template content
- Implement data retention policies
- Secure API endpoints with rate limiting
- Regular security assessments

## Troubleshooting

### Common Issues

#### High Error Rates
1. Check template syntax and variables
2. Review input validation rules
3. Analyze error patterns by type
4. Consider rollback to stable version

#### Performance Degradation
1. Monitor token usage trends
2. Check for template complexity increases
3. Review A/B test impacts
4. Optimize template content

#### Approval Bottlenecks
1. Review approval stage configuration
2. Check approver availability
3. Consider auto-approval for low-risk changes
4. Implement escalation procedures

### Support

For technical support and feature requests:
1. Check the troubleshooting guide
2. Review system logs and metrics
3. Contact the development team
4. Submit issues through the project repository

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add comprehensive tests
4. Update documentation
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.