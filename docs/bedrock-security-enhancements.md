# Bedrock AI Security Enhancements

## Overview

This document outlines the "Low Effort, High Impact" security and reliability enhancements implemented for the Bedrock AI Core system. These improvements significantly strengthen the production readiness without major architectural changes.

## ✅ Implemented Enhancements

### 1. Security & Compliance

#### IAM Model-Gating & Region Restrictions
- **Enhanced IAM policies** with explicit model ID conditions
- **Region restrictions** to EU-Central-1 and US-East-1 only
- **Resource-specific ARNs** instead of wildcards
- **Condition-based access control** for all AWS services

**Files:**
- `infra/aws/bedrock-iam-policies.json` - Enhanced with region and model restrictions
- `infra/aws/bedrock-breakglass-policy.json` - Emergency access role with time limits

#### Break-Glass Role (JIT Access)
- **Emergency access role** with extended permissions
- **Time-limited access** via STS conditions (30 minutes)
- **Separate policy** for incident response scenarios
- **Audit trail** for all break-glass usage

#### SSRF & Metadata Hardening
- **Enhanced web proxy** with comprehensive SSRF protection
- **Blocked endpoints**: 169.254.169.254, RFC1918 networks, localhost
- **Protocol restrictions**: HTTPS only, no file://, gopher://, ftp://
- **Request size limits**: 1MB maximum body size
- **Header sanitization** and allowlist

**Files:**
- `infra/lambdas/web-proxy/src/index.ts` - Enhanced with SSRF protection

#### KMS Key Management
- **Dedicated CMK** for Bedrock secrets encryption
- **Restrictive key policy** with service-specific access
- **Automatic key rotation** enabled
- **Secrets Manager integration** with KMS encryption

**Files:**
- `infra/aws/deploy-kms-key.sh` - KMS key deployment script

#### Enhanced PII Redaction
- **Deterministic hashing** with SHA-256 + salt
- **Format-preserving redaction** for audit correlation
- **Comprehensive PII patterns** (German tax ID, IBAN, etc.)
- **GDPR-compliant retention** policies
- **Reversible redaction** for authorized access

**Files:**
- `infra/lambdas/bedrock-agent/src/pii-redactor.ts` - Advanced PII handling
- Integration in `bedrock-client.ts` with audit reporting

### 2. Reliability & Observability

#### Circuit Breaker Pattern
- **Automatic failure detection** with configurable thresholds
- **Graceful degradation** with context-aware fallbacks
- **Half-open recovery** testing with limited calls
- **Per-service state management** for fine-grained control
- **Fallback responses** tailored to each request type

**Files:**
- `infra/lambdas/bedrock-agent/src/circuit-breaker.ts` - Circuit breaker implementation
- Integration in `bedrock-client.ts` with fallback handling

#### Comprehensive Monitoring
- **CloudWatch alarms** for error rate, duration, throttling, cost
- **Custom metrics** for AI operations and circuit breaker state
- **CloudWatch dashboard** with real-time monitoring
- **AWS Budget** with cost alerts and forecasting
- **X-Ray tracing** for distributed request tracking

**Files:**
- `infra/aws/deploy-monitoring.sh` - Complete monitoring setup

#### Log Management
- **Fixed retention policies** (30/90/365 days by log type)
- **Structured logging** with correlation IDs
- **Cost-optimized retention** based on data importance
- **Audit trail preservation** for compliance

### 3. Cost & Quota Management

#### Budget Controls
- **AWS Budget** with $100/month limit
- **Cost alerts** at 80% actual and 100% forecasted
- **Per-tenant rate limiting** in web proxy
- **Token usage tracking** with cost estimation
- **Resource tagging** for cost attribution

#### Cost Optimization
- **Response caching** with configurable TTL
- **Request deduplication** via cache keys
- **Circuit breaker** prevents expensive failed calls
- **Token usage optimization** in prompts

### 4. Data Governance

#### EU Data Residency
- **Region restrictions** in IAM policies
- **EU-Central-1 primary** with US-East-1 fallback
- **Data locality** enforcement for all services
- **GDPR compliance** indicators in responses

#### Audit Schema
- **Fixed log schema** with required fields
- **Prompt template hashing** for tamper detection
- **User ID hashing** for privacy-preserving analytics
- **Redaction mapping** for compliance investigations

**Schema:**
```json
{
  "trace_id": "string",
  "user_id_hash": "string", 
  "tenant_id": "string",
  "route": "string",
  "model_id": "string",
  "temperature": "number",
  "input_tokens": "number",
  "output_tokens": "number",
  "cost_estimate": "number",
  "redaction_state": "boolean",
  "prompt_template_hash": "string",
  "timestamp": "string"
}
```

### 5. DevEx & Testing

#### Red Team Evaluations
- **Automated security testing** in CI pipeline
- **Prompt injection resistance** tests
- **Data exfiltration prevention** validation
- **PII handling verification** 
- **SSRF protection testing**
- **Politeness and context adherence** checks

**Files:**
- `infra/lambdas/bedrock-agent/tests/red-team-evals.test.ts` - Comprehensive security tests
- `scripts/run-red-team-evals.sh` - CI integration script

#### Prompt Template Versioning
- **SHA-256 hashing** of all prompt templates
- **Tamper detection** via hash comparison
- **Version tracking** in audit logs
- **Template integrity** validation

## 🔧 Deployment Instructions

### 1. Deploy Enhanced Security
```bash
# Deploy KMS key for secrets
./infra/aws/deploy-kms-key.sh

# Deploy enhanced IAM policies
./infra/aws/deploy-bedrock-iam.sh

# Deploy Lambda functions with security enhancements
cd infra/lambdas/bedrock-agent && ./deploy.sh
cd ../web-proxy && ./deploy.sh
```

### 2. Set Up Monitoring
```bash
# Deploy comprehensive monitoring
./infra/aws/deploy-monitoring.sh

# Verify dashboard and alarms
aws cloudwatch describe-alarms --region eu-central-1
```

### 3. Run Security Validation
```bash
# Run red team evaluations
./scripts/run-red-team-evals.sh

# Check results
cat /tmp/red-team-results.json
```

## 📊 Monitoring & Alerting

### Key Metrics
- **Security Score**: Red team evaluation percentage
- **Circuit Breaker State**: Open/closed status per service
- **PII Detection Rate**: Percentage of requests with PII
- **Cost per Request**: Token usage and estimated cost
- **Error Rate**: Failed requests per service
- **Response Time**: P95 latency per request type

### Alert Thresholds
- **Error Rate**: >2% over 5 minutes
- **Response Time**: >5s P95 over 15 minutes  
- **Cost**: >$50/hour estimated
- **Circuit Breaker**: Any service in OPEN state
- **Security Score**: <80% in red team evaluations

### Dashboard Sections
1. **Service Health**: Invocations, errors, duration
2. **AI Metrics**: Token usage, cost, model performance
3. **Security**: PII detection, circuit breaker status
4. **Recent Errors**: Log analysis and error patterns

## 🚨 Emergency Procedures

### Security Incident Response
1. **Immediate**: Run `./infra/aws/disable-bedrock-agent.sh`
2. **Investigate**: Check CloudWatch logs and metrics
3. **Analyze**: Review red team evaluation results
4. **Fix**: Apply security patches or configuration changes
5. **Validate**: Run `./scripts/run-red-team-evals.sh`
6. **Re-enable**: Run `./infra/aws/enable-bedrock-agent.sh`

### Performance Issues
1. **Check**: Circuit breaker metrics in dashboard
2. **Scale**: Increase Lambda memory/timeout if needed
3. **Cache**: Verify response caching is working
4. **Fallback**: Ensure graceful degradation is active

## 🔮 Future Enhancements (Backlog)

### Advanced Security
- **Multi-provider AI orchestration** with Opal integration
- **Advanced prompt injection detection** with ML models
- **Real-time threat intelligence** integration
- **Behavioral anomaly detection** for users

### Scalability
- **Auto-scaling Lambda** based on demand
- **Multi-region deployment** with failover
- **CDN integration** for response caching
- **Database partitioning** for large datasets

### Compliance
- **SOC 2 Type II** preparation
- **ISO 27001** alignment
- **GDPR Article 25** privacy by design
- **Automated compliance reporting**

## 📈 Success Metrics

### Security KPIs
- **Red Team Score**: >90% consistently
- **Zero** successful prompt injections
- **Zero** PII leakage incidents
- **100%** SSRF attack prevention

### Reliability KPIs  
- **99.9%** uptime SLA
- **<5s** P95 response time
- **<2%** error rate
- **<30s** circuit breaker recovery time

### Cost KPIs
- **<$100/month** total AI costs
- **<$0.10** average cost per request
- **>80%** cache hit rate
- **<5%** failed request cost waste

## 🎯 Conclusion

These enhancements transform the Bedrock AI Core from a functional prototype into a production-ready, enterprise-grade system. The security-first approach, comprehensive monitoring, and automated testing provide confidence for scaling to thousands of users while maintaining strict compliance and cost control.

The implementation follows the "defense in depth" principle with multiple security layers, graceful degradation patterns, and comprehensive audit trails. All changes are backward compatible and can be deployed incrementally without service disruption.