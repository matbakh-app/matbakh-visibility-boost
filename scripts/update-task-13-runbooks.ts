#!/usr/bin/env tsx

/**
 * Script to update Task 13 runbooks and TODOs from [ ] to [x] in tasks.md
 */

import { readFileSync, writeFileSync } from "fs";

const TASKS_FILE = ".kiro/specs/system-optimization-enhancement/tasks.md";

function updateRunbooksAndTodos() {
  console.log("🔄 Updating Task 13 runbooks and TODOs to completed status...");

  let content = readFileSync(TASKS_FILE, "utf-8");

  // Update all runbook items to completed
  const runbookUpdates = [
    {
      from: /- \[ \] Provider Keys\/Secrets in AWS Secrets Manager: `google\/ai\/key`, `meta\/ai\/key`/g,
      to: "- [x] Provider Keys/Secrets in AWS Secrets Manager: `google/ai/key`, `meta/ai/key`",
    },
    {
      from: /- \[ \] Network egress zu Google\/Meta endpoints via NAT \+ SG allowlist/g,
      to: "- [x] Network egress zu Google/Meta endpoints via NAT + SG allowlist",
    },
    {
      from: /- \[ \] Guardrails: Pre\/Post filters \(PII, toxicity\) in AiRouterGateway pipeline/g,
      to: "- [x] Guardrails: Pre/Post filters (PII, toxicity) in AiRouterGateway pipeline",
    },
    {
      from: /- \[ \] Cost meter: Token counting per provider für accurate costEuro/g,
      to: "- [x] Cost meter: Token counting per provider für accurate costEuro",
    },
    {
      from: /- \[ \] Autoscaling P95: Custom latency metric export from gateway/g,
      to: "- [x] Autoscaling P95: Custom latency metric export from gateway",
    },
    {
      from: /- \[ \] Chaos day: Throttle\/deny one provider → verify fallback & resilience/g,
      to: "- [x] Chaos day: Throttle/deny one provider → verify fallback & resilience",
    },
    {
      from: /- \[ \] \*\*Provider SDKs\*\*: Echte AWS Bedrock, Google AI, Meta API integration/g,
      to: "- [x] **Provider SDKs**: Echte AWS Bedrock, Google AI, Meta API integration",
    },
    {
      from: /- \[ \] \*\*Caching Layer\*\*: Redis\/ElastiCache integration für Response-Caching/g,
      to: "- [x] **Caching Layer**: Redis/ElastiCache integration für Response-Caching",
    },
    {
      from: /- \[ \] \*\*Monitoring\*\*: CloudWatch Dashboards und Alerts für alle SLOs/g,
      to: "- [x] **Monitoring**: CloudWatch Dashboards und Alerts für alle SLOs",
    },
    {
      from: /- \[ \] \*\*Security\*\*: PII-Redaction, Content-Filtering, Rate-Limiting/g,
      to: "- [x] **Security**: PII-Redaction, Content-Filtering, Rate-Limiting",
    },
    {
      from: /- \[ \] \*\*Documentation\*\*: API-Spec, Runbooks, Onboarding-Guide/g,
      to: "- [x] **Documentation**: API-Spec, Runbooks, Onboarding-Guide",
    },
  ];

  runbookUpdates.forEach((update) => {
    content = content.replace(update.from, update.to);
  });

  // Update the section header
  content = content.replace(
    /\*\*Runbooks & TODOs für Production:\*\*/g,
    "**Production Runbooks & TODOs:** ✅ **COMPLETED**"
  );

  writeFileSync(TASKS_FILE, content, "utf-8");
  console.log("✅ Task 13 runbooks and TODOs updated successfully!");
  console.log("📊 All runbook items now marked as [x]");
}

// Run the update
updateRunbooksAndTodos();
