# Alert Testing Framework - Quick Reference Guide

**Version**: 1.0.0  
**Last Updated**: 2025-01-14  
**Status**: ✅ Production Ready

## 🚀 Quick Start

```typescript
import { AlertTestingFramework, TestScenarioType, AlertSeverity } from '@/lib/ai-orchestrator/alerting/alert-testing-framework';

const framework = new AlertTestingFramework({
  environment: 'staging',
  region: 'eu-central-1',
  scenarios: [],
  cloudWatchConfig: { enabled: true },
  snsConfig: { enabled: true },
  pagerDutyConfig: { enabled: true, integrationKey: process.env.PAGERDUTY_KEY }
});

const scenarios = [{
  type: TestScenarioType.HIGH_FAILURE_RATE,
  name: 'Test High Failure Rate',
  description: 'Verify alarm triggers on high failure rate',
  severity: AlertSeverity.CRITICAL,
  expectedOutcome: 'Alarm should trigger'
}];

const report = await framework.runTestSuite(scenarios);
console.log(`Success Rate: ${report.summary.successRate}%`);
```

## 📋 Test Scenario Types

- `HIGH_FAILURE_RATE` - Test failure rate alarms (CRITICAL)
- `HIGH_LATENCY` - Test latency alarms (WARNING)
- `COST_THRESHOLD` - Test cost alarms (WARNING)
- `LOW_OPERATION_COUNT` - Test operation count alarms (INFO)
- `INCIDENT_LIFECYCLE` - Test PagerDuty lifecycle (CRITICAL)
- `ESCALATION_POLICY` - Test PagerDuty escalation (CRITICAL)
- `MULTI_CHANNEL` - Test multi-channel delivery (WARNING)

## 🔧 Configuration

```typescript
const config: TestSuiteConfig = {
  environment: 'production',
  region: 'eu-central-1',
  scenarios: [],
  cloudWatchConfig: { enabled: true, namespace: 'MatbakhApp/HybridRouting/SupportMode' },
  snsConfig: { enabled: true, topicArn: 'arn:aws:sns:...' },
  pagerDutyConfig: { enabled: true, integrationKey: 'your-key' }
};
```

## 📊 Test Report

```typescript
interface TestReport {
  suiteId: string;
  environment: string;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  summary: {
    successRate: number;
    averageDuration: number;
    criticalFailures: number;
    warnings: number;
  };
}
```

## 🎯 Common Use Cases

### Test All Alarms
```typescript
const scenarios = [
  { type: TestScenarioType.HIGH_FAILURE_RATE, ... },
  { type: TestScenarioType.HIGH_LATENCY, ... },
  { type: TestScenarioType.COST_THRESHOLD, ... }
];
```

### Test PagerDuty
```typescript
const scenarios = [
  { type: TestScenarioType.INCIDENT_LIFECYCLE, ... },
  { type: TestScenarioType.ESCALATION_POLICY, ... }
];
```

## 🔍 Result Analysis

```typescript
const report = await framework.runTestSuite(scenarios);

if (report.summary.successRate === 100) {
  console.log('✅ All tests passed!');
} else {
  console.log(`⚠️ ${report.failedTests} tests failed`);
  report.results.filter(r => !r.success).forEach(r => {
    console.error(`- ${r.scenarioName}: ${r.errors?.join(', ')}`);
  });
}
```

## 📚 Resources

- Implementation: `src/lib/ai-orchestrator/alerting/alert-testing-framework.ts`
- Tests: `src/lib/ai-orchestrator/__tests__/alert-testing-framework.test.ts`
- Documentation: `docs/bedrock-activation-task-6.2.3-phase-4-completion.md`

**Status**: ✅ Production Ready
