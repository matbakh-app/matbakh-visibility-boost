# Red Team Evaluation - Quick Reference Guide

## Overview

The Red Team Evaluator provides automated security testing for direct Bedrock operations, testing for vulnerabilities including prompt injection, jailbreaking, data exfiltration, privilege escalation, and denial of service attacks.

## Quick Start

### Basic Usage

```typescript
import { BedrockSupportManager } from "./bedrock-support-manager";

// Via Bedrock Support Manager (recommended)
const supportManager = new BedrockSupportManager();
const result = await supportManager.runRedTeamEvaluations();

console.log(`Security Score: ${result.overallScore}/100`);
console.log(`Passed: ${result.passed}`);
console.log(
  `Vulnerabilities: ${result.testResults.filter((t) => !t.passed).length}`
);
```

### Direct Evaluator Usage

```typescript
import { RedTeamEvaluator } from "./red-team-evaluator";
import { DirectBedrockClient } from "./direct-bedrock-client";

const client = new DirectBedrockClient();
const evaluator = new RedTeamEvaluator(client, {
  testDepth: "standard",
  maxTestsPerCategory: 5,
});

const report = await evaluator.runEvaluation();
```

## Configuration Options

### Test Depth Levels

```typescript
// Basic: 5 tests (1 per category)
testDepth: "basic";

// Standard: 15 tests (3 per category)
testDepth: "standard";

// Comprehensive: 25+ tests (5+ per category)
testDepth: "comprehensive";
```

### Category Control

```typescript
const config = {
  enablePromptInjectionTests: true,
  enableJailbreakTests: true,
  enableDataExfiltrationTests: true,
  enablePrivilegeEscalationTests: true,
  enableDenialOfServiceTests: true,
  maxTestsPerCategory: 5,
  timeoutMs: 30000,
};
```

## Test Categories

### 1. Prompt Injection (5 vectors)

- Basic instruction override
- Role confusion attacks
- Delimiter injection
- Context escape
- Encoding bypass

### 2. Jailbreak (4 vectors)

- DAN (Do Anything Now)
- Hypothetical scenarios
- Developer mode
- Ethical override

### 3. Data Exfiltration (3 vectors)

- PII extraction
- System information leaks
- Training data extraction

### 4. Privilege Escalation (2 vectors)

- Admin access requests
- Permission bypass

### 5. Denial of Service (2 vectors)

- Infinite loop requests
- Resource exhaustion

## Report Structure

```typescript
interface RedTeamEvaluationReport {
  evaluationId: string;
  timestamp: Date;
  totalTests: number;
  testsPassed: number;
  testsFailed: number;
  vulnerabilitiesDetected: number;
  overallSecurityScore: number; // 0-100
  criticalVulnerabilities: RedTeamTestResult[];
  highVulnerabilities: RedTeamTestResult[];
  mediumVulnerabilities: RedTeamTestResult[];
  lowVulnerabilities: RedTeamTestResult[];
  recommendations: string[];
  executionTimeMs: number;
}
```

## Common Use Cases

### 1. Pre-Deployment Security Check

```typescript
// Run before deploying to production
const result = await supportManager.runRedTeamEvaluations();

if (!result.passed) {
  console.error("Security vulnerabilities detected!");
  console.error(
    "Critical:",
    result.testResults.filter((t) => t.severity === "critical" && !t.passed)
  );
  process.exit(1);
}
```

### 2. Scheduled Security Audits

```typescript
// Run weekly security audits
setInterval(async () => {
  const report = await evaluator.runEvaluation();

  if (report.vulnerabilitiesDetected > 0) {
    await notifySecurityTeam(report);
  }
}, 7 * 24 * 60 * 60 * 1000); // Weekly
```

### 3. CI/CD Integration

```typescript
// In your CI/CD pipeline
async function securityGate() {
  const result = await supportManager.runRedTeamEvaluations();

  // Fail build if critical vulnerabilities found
  const criticalVulns = result.testResults.filter(
    (t) => t.severity === "critical" && !t.passed
  );

  if (criticalVulns.length > 0) {
    throw new Error(
      `${criticalVulns.length} critical vulnerabilities detected`
    );
  }

  return result;
}
```

### 4. Custom Test Suites

```typescript
// Test only specific categories
const evaluator = new RedTeamEvaluator(client, {
  enablePromptInjectionTests: true,
  enableJailbreakTests: true,
  enableDataExfiltrationTests: false,
  enablePrivilegeEscalationTests: false,
  enableDenialOfServiceTests: false,
  maxTestsPerCategory: 10,
});
```

## Feature Flag Control

### Enable/Disable Evaluations

```typescript
// Enable red team evaluations
await featureFlags.setFlag("red_team_evaluation_enabled", true);

// Disable for specific environments
if (process.env.NODE_ENV === "development") {
  await featureFlags.setFlag("red_team_evaluation_enabled", false);
}
```

## Interpreting Results

### Security Score Ranges

- **90-100**: Excellent security posture
- **70-89**: Good security with minor issues
- **50-69**: Moderate security, improvements needed
- **0-49**: Poor security, immediate action required

### Severity Levels

- **Critical**: Immediate remediation required
- **High**: Prioritize remediation
- **Medium**: Address in next sprint
- **Low**: Monitor and address when possible

## Troubleshooting

### Common Issues

#### 1. All Tests Failing

```typescript
// Check if direct Bedrock client is properly configured
const health = await client.getHealthStatus();
console.log("Client health:", health);
```

#### 2. Timeout Errors

```typescript
// Increase timeout for slower operations
const evaluator = new RedTeamEvaluator(client, {
  timeoutMs: 60000, // 60 seconds
});
```

#### 3. Feature Flag Not Working

```typescript
// Verify feature flag is enabled
const isEnabled = await featureFlags.isEnabled("red_team_evaluation_enabled");
console.log("Red team evaluations enabled:", isEnabled);
```

## Best Practices

### 1. Regular Testing

- Run evaluations weekly or after major changes
- Include in CI/CD pipeline
- Schedule automated audits

### 2. Vulnerability Management

- Address critical vulnerabilities immediately
- Track remediation progress
- Re-test after fixes

### 3. Audit Trail

- Review audit logs regularly
- Track security score trends
- Document remediation actions

### 4. Configuration Management

- Use appropriate test depth for environment
- Enable all categories in production
- Adjust timeouts based on infrastructure

## Performance Considerations

### Execution Time

- Basic: ~1-2 seconds
- Standard: ~2-5 seconds
- Comprehensive: ~5-10 seconds

### Resource Usage

- Memory: < 50MB
- CPU: Minimal (pattern matching)
- Network: One request per test

### Optimization Tips

```typescript
// Run tests in parallel (if supported)
const results = await Promise.all([
  evaluator1.runEvaluation(),
  evaluator2.runEvaluation(),
]);

// Use basic depth for frequent checks
const quickCheck = new RedTeamEvaluator(client, {
  testDepth: "basic",
  maxTestsPerCategory: 1,
});
```

## Integration Examples

### With Monitoring Systems

```typescript
// Send metrics to monitoring
const report = await evaluator.runEvaluation();

await metrics.gauge("security.score", report.overallSecurityScore);
await metrics.gauge("security.vulnerabilities", report.vulnerabilitiesDetected);
await metrics.gauge("security.critical", report.criticalVulnerabilities.length);
```

### With Alerting Systems

```typescript
// Alert on critical vulnerabilities
const report = await evaluator.runEvaluation();

if (report.criticalVulnerabilities.length > 0) {
  await alerting.sendAlert({
    severity: "critical",
    title: "Security Vulnerabilities Detected",
    description: `${report.criticalVulnerabilities.length} critical vulnerabilities found`,
    details: report.criticalVulnerabilities,
  });
}
```

### With Compliance Systems

```typescript
// Generate compliance report
const report = await evaluator.runEvaluation();

const complianceReport = {
  timestamp: report.timestamp,
  securityScore: report.overallSecurityScore,
  vulnerabilities: report.vulnerabilitiesDetected,
  testsPassed: report.testsPassed,
  totalTests: report.totalTests,
  recommendations: report.recommendations,
};

await compliance.submitReport(complianceReport);
```

## Additional Resources

- [Full Documentation](./red-team-evaluation-integration-completion-report.md)
- [Bedrock Support Manager Guide](./bedrock-support-manager-implementation-completion-report.md)
- [Security Posture Monitoring](./security-posture-monitoring-completion-report.md)
- [Direct Bedrock Client Guide](./ai-provider-architecture.md)

## Support

For issues or questions:

1. Check audit trail logs for detailed error information
2. Review feature flag configuration
3. Verify direct Bedrock client health
4. Consult troubleshooting section above
