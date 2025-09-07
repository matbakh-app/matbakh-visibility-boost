# Bedrock AI Core Deployment Guide

## Overview

This guide covers the deployment of the Bedrock AI Core system, which provides secure, controlled AI capabilities for matbakh.app using AWS Bedrock with Claude 3.5 Sonnet.

## Architecture Components

### 1. IAM Roles and Policies
- **BedrockAgentExecutionRole**: Lambda execution role with minimal required permissions
- **BedrockAgentPolicy**: Custom policy for Bedrock access, CloudWatch logging, Secrets Manager, and DynamoDB
- Least-privilege access patterns for all AI operations

### 2. Lambda Functions
- **bedrock-agent**: Main AI processing function with Claude 3.5 Sonnet integration
- **web-proxy**: Controlled web access proxy for external API calls
- Both functions include comprehensive error handling and retry logic

### 3. Security System
- **Prompt Security Guards**: Embedded security rules in every AI prompt
- **Access Control**: Domain whitelist and request validation
- **Audit Trail**: Complete logging of all AI operations

### 4. Supporting Infrastructure
- **Secrets Manager**: Secure storage of prompt templates and API keys
- **DynamoDB**: AI operation logging and audit trail
- **CloudWatch**: Monitoring and alerting

## Deployment Steps

### Step 1: Deploy IAM Infrastructure
```bash
cd infra/aws
./deploy-bedrock-iam.sh
```

This creates:
- IAM role with minimal required permissions
- Secrets Manager secrets for prompt templates
- CloudWatch log groups

### Step 2: Deploy Lambda Functions
```bash
cd infra/lambdas/bedrock-agent
npm install
./deploy.sh

cd ../web-proxy
npm install
./deploy.sh
```

This creates:
- Bedrock agent Lambda function
- Web proxy Lambda function
- DynamoDB table for logging

### Step 3: Configure API Gateway (Manual)
Create API Gateway routes:
- `POST /ai/invoke` → bedrock-agent Lambda
- `GET /ai/health` → bedrock-agent Lambda
- `POST /proxy` → web-proxy Lambda

### Step 4: Test Deployment
```bash
# Test Bedrock agent health
aws lambda invoke \
  --function-name bedrock-agent \
  --payload '{"httpMethod": "GET", "path": "/health"}' \
  response.json

# Test web proxy
aws lambda invoke \
  --function-name web-proxy \
  --payload '{"httpMethod": "POST", "body": "{\"url\": \"https://www.google.com\"}"}' \
  response.json
```

## Security Features

### Prompt-Level Security
- **Embedded Guards**: Security rules that cannot be removed from prompts
- **Access Restrictions**: Explicit allow/deny rules for each operation
- **Audit Trail**: Complete logging of all AI interactions

### Network Security
- **Domain Whitelist**: Only approved domains can be accessed
- **Lambda Proxy**: No direct external access from AI agents
- **Rate Limiting**: Protection against abuse

### Data Protection
- **No Personal Data**: AI agents cannot access or store personal information
- **GDPR Compliance**: Automatic data redaction and retention policies
- **Encryption**: All data encrypted at rest and in transit

## Configuration

### Environment Variables
```bash
# Bedrock Agent
VC_BEDROCK_LIVE=false              # Enable/disable AI features
VC_BEDROCK_ROLLOUT_PERCENT=0       # Gradual rollout percentage
AWS_REGION=us-east-1               # AWS region
ALLOWED_ORIGINS=https://matbakh.app # CORS origins

# Web Proxy
ALLOWED_ORIGINS=https://matbakh.app # CORS origins
```

### Feature Flags
- `vc_bedrock_live`: Master switch for AI features
- `vc_bedrock_rollout_percent`: Gradual rollout control
- Emergency disable capability via rollback script

### Prompt Templates (Secrets Manager)
```json
{
  "vc_analysis_template": "Security-guarded template for visibility analysis",
  "content_generation_template": "Security-guarded template for content creation",
  "persona_detection_template": "Security-guarded template for persona detection"
}
```

## Monitoring and Alerting

### CloudWatch Metrics
- Request count and latency
- Error rates and types
- Token usage and costs
- Security violations

### DynamoDB Logging
- Complete audit trail of AI operations
- Token usage tracking
- Error analysis
- GDPR-compliant data retention

### Health Checks
- Automated health monitoring
- Bedrock connectivity tests
- Performance benchmarks

## Emergency Procedures

### Disable AI System
```bash
./disable-bedrock-agent.sh
```
This immediately:
- Disables all Lambda functions
- Sets feature flags to false
- Activates fallback responses
- Notifies administrators

### Re-enable AI System
```bash
./enable-bedrock-agent.sh
```
This safely:
- Re-enables Lambda functions
- Tests system health
- Gradually restores service
- Monitors for issues

## Cost Management

### Token Usage Tracking
- Real-time cost calculation
- Usage analytics and optimization
- Automatic cost alerts
- Budget controls

### Optimization Strategies
- Response caching (24-hour TTL)
- Request queuing for efficiency
- Intelligent prompt optimization
- Provider cost comparison

## Troubleshooting

### Common Issues
1. **IAM Permission Errors**: Check role policies and trust relationships
2. **Bedrock Access Denied**: Verify model permissions and region
3. **Timeout Errors**: Adjust Lambda timeout and retry logic
4. **Rate Limiting**: Check AWS service quotas and request patterns

### Debug Commands
```bash
# Check Lambda function status
aws lambda get-function --function-name bedrock-agent

# View CloudWatch logs
aws logs describe-log-groups --log-group-name-prefix /aws/lambda/bedrock

# Test Bedrock access
aws bedrock-runtime invoke-model \
  --model-id anthropic.claude-3-5-sonnet-20240620-v1:0 \
  --body '{"anthropic_version": "bedrock-2023-05-31", "max_tokens": 10, "messages": [{"role": "user", "content": "Hello"}]}' \
  response.json
```

## Security Compliance

### GDPR Requirements
- ✅ Data minimization (no personal data in AI prompts)
- ✅ Purpose limitation (AI only for specified business purposes)
- ✅ Storage limitation (automatic data deletion)
- ✅ Audit trail (complete logging of all operations)
- ✅ Right to erasure (data deletion capabilities)

### Security Best Practices
- ✅ Least privilege access (minimal IAM permissions)
- ✅ Defense in depth (multiple security layers)
- ✅ Audit logging (complete operation tracking)
- ✅ Encryption (data at rest and in transit)
- ✅ Network isolation (VPC and security groups)

## Future Enhancements

### Planned Features
- Google Gemini integration via Opal
- Multi-provider AI orchestration
- Advanced persona detection
- Real-time content optimization
- Automated A/B testing

### Scalability Considerations
- Auto-scaling Lambda functions
- DynamoDB on-demand scaling
- Multi-region deployment
- CDN integration for responses

## Support and Maintenance

### Regular Tasks
- Monitor cost and usage trends
- Update prompt templates
- Review security logs
- Performance optimization
- Model version updates

### Escalation Procedures
1. Check system health dashboard
2. Review CloudWatch logs and metrics
3. Test individual components
4. Contact AWS support if needed
5. Execute emergency rollback if critical

## Conclusion

The Bedrock AI Core provides a secure, scalable foundation for AI-powered features in matbakh.app. The system is designed with security-first principles, comprehensive monitoring, and emergency procedures to ensure reliable operation.

For questions or issues, refer to the troubleshooting section or contact the development team.