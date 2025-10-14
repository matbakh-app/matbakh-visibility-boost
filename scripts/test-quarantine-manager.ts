#!/usr/bin/env tsx
/**
 * Test Quarantine Manager
 *
 * Manages flaky tests through automatic quarantine and restoration
 */
import { promises as fs } from "fs";
import path from "path";

interface QuarantinedTest {
  id: string;
  testPath: string;
  testName: string;
  reason: string;
  quarantinedAt: string;
  quarantinedBy: string;
  failureCount: number;
  lastFailure: string;
  ticketUrl?: string;
  restoreAfter?: string;
  metadata: {
    flakinessPercentage: number;
    totalRuns: number;
    failures: number;
    environment: string[];
  };
}

interface QuarantineRegistry {
  tests: Record<string, QuarantinedTest>;
  statistics: {
    totalQuarantined: number;
    totalRestored: number;
    averageQuarantineTime: number;
  };
  version: string;
  lastUpdated: string;
}

class TestQuarantineManager {
  private registryPath: string;
  private registry: QuarantineRegistry;

  constructor() {
    this.registryPath = path.join(
      process.cwd(),
      ".kiro",
      "testing",
      "quarantine-registry.json"
    );
    this.registry = {
      tests: {},
      statistics: {
        totalQuarantined: 0,
        totalRestored: 0,
        averageQuarantineTime: 0,
      },
      version: "1.0.0",
      lastUpdated: new Date().toISOString(),
    };
  }

  async initialize(): Promise<void> {
    await fs.mkdir(path.dirname(this.registryPath), { recursive: true });
    try {
      const registryData = await fs.readFile(this.registryPath, "utf-8");
      this.registry = JSON.parse(registryData);
    } catch (error) {
      // Registry doesn't exist, create new one
      await this.saveRegistry();
    }
  }

  async quarantineTest(
    testPath: string,
    testName: string,
    reason: string,
    options: {
      failureCount?: number;
      flakinessPercentage?: number;
      ticketUrl?: string;
      restoreAfter?: string;
      environment?: string[];
    } = {}
  ): Promise<void> {
    const testId = this.generateTestId(testPath, testName);

    console.log(`🚨 Quarantining test: ${testName}`);
    console.log(`   Path: ${testPath}`);
    console.log(`   Reason: ${reason}`);

    const quarantinedTest: QuarantinedTest = {
      id: testId,
      testPath,
      testName,
      reason,
      quarantinedAt: new Date().toISOString(),
      quarantinedBy: process.env.USER || "system",
      failureCount: options.failureCount || 1,
      lastFailure: new Date().toISOString(),
      ticketUrl: options.ticketUrl,
      restoreAfter: options.restoreAfter,
      metadata: {
        flakinessPercentage: options.flakinessPercentage || 0,
        totalRuns: 0,
        failures: options.failureCount || 1,
        environment: options.environment || ["unknown"],
      },
    };

    this.registry.tests[testId] = quarantinedTest;
    this.registry.statistics.totalQuarantined++;
    this.registry.lastUpdated = new Date().toISOString();

    await this.saveRegistry();
    await this.updateJestConfiguration();
    await this.createQuarantineTicket(quarantinedTest);

    console.log(`✅ Test quarantined successfully (ID: ${testId})`);
  }

  async restoreTest(testId: string, reason: string): Promise<void> {
    const test = this.registry.tests[testId];
    if (!test) {
      throw new Error(`Test not found in quarantine: ${testId}`);
    }

    console.log(`🔄 Restoring test: ${test.testName}`);
    console.log(`   Reason: ${reason}`);

    // Calculate quarantine duration
    const quarantineStart = new Date(test.quarantinedAt);
    const quarantineEnd = new Date();
    const quarantineDuration =
      quarantineEnd.getTime() - quarantineStart.getTime();

    // Update statistics
    this.registry.statistics.totalRestored++;
    const totalDuration =
      this.registry.statistics.averageQuarantineTime *
        (this.registry.statistics.totalRestored - 1) +
      quarantineDuration;
    this.registry.statistics.averageQuarantineTime =
      totalDuration / this.registry.statistics.totalRestored;

    // Remove from quarantine
    delete this.registry.tests[testId];
    this.registry.lastUpdated = new Date().toISOString();

    await this.saveRegistry();
    await this.updateJestConfiguration();

    console.log(`✅ Test restored successfully`);
    console.log(
      `   Quarantine duration: ${Math.round(
        quarantineDuration / (1000 * 60 * 60 * 24)
      )} days`
    );
  }

  async listQuarantinedTests(): Promise<void> {
    console.log("🚨 Quarantined Tests:");
    console.log("====================");

    const tests = Object.values(this.registry.tests);
    if (tests.length === 0) {
      console.log("No tests currently in quarantine ✅");
      return;
    }

    tests.forEach((test) => {
      const quarantinedDays = Math.round(
        (Date.now() - new Date(test.quarantinedAt).getTime()) /
          (1000 * 60 * 60 * 24)
      );

      console.log(`\n🚨 ${test.testName} (${test.id})`);
      console.log(`   Path: ${test.testPath}`);
      console.log(`   Reason: ${test.reason}`);
      console.log(
        `   Quarantined: ${quarantinedDays} days ago by ${test.quarantinedBy}`
      );
      console.log(
        `   Failures: ${test.failureCount} (${test.metadata.flakinessPercentage}% flaky)`
      );
      console.log(`   Environment: ${test.metadata.environment.join(", ")}`);

      if (test.ticketUrl) {
        console.log(`   Ticket: ${test.ticketUrl}`);
      }

      if (test.restoreAfter) {
        const restoreDate = new Date(test.restoreAfter);
        const daysUntilRestore = Math.round(
          (restoreDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );
        console.log(
          `   Restore after: ${restoreDate.toLocaleDateString()} (${daysUntilRestore} days)`
        );
      }
    });

    console.log(`\n📊 Statistics:`);
    console.log(
      `   Total quarantined: ${this.registry.statistics.totalQuarantined}`
    );
    console.log(`   Total restored: ${this.registry.statistics.totalRestored}`);
    console.log(
      `   Average quarantine time: ${Math.round(
        this.registry.statistics.averageQuarantineTime / (1000 * 60 * 60 * 24)
      )} days`
    );
  }

  async generateQuarantineReport(): Promise<void> {
    const reportPath = path.join(
      process.cwd(),
      "logs",
      "testing",
      "quarantine-report.md"
    );
    await fs.mkdir(path.dirname(reportPath), { recursive: true });

    const tests = Object.values(this.registry.tests);
    const report = this.generateMarkdownReport(tests);

    await fs.writeFile(reportPath, report);
    console.log(`📊 Quarantine report generated: ${reportPath}`);
  }

  async checkAutoQuarantine(): Promise<void> {
    console.log("🔍 Checking for tests that should be auto-quarantined...");

    // This would analyze test results and automatically quarantine flaky tests
    // For now, this is a placeholder for the logic

    const testResults = await this.analyzeRecentTestResults();

    for (const result of testResults) {
      if (this.shouldAutoQuarantine(result)) {
        await this.quarantineTest(
          result.testPath,
          result.testName,
          `Auto-quarantined: ${result.flakinessPercentage}% flaky over ${result.totalRuns} runs`,
          {
            failureCount: result.failures,
            flakinessPercentage: result.flakinessPercentage,
            environment: result.environments,
          }
        );
      }
    }
  }

  private async analyzeRecentTestResults(): Promise<any[]> {
    // Placeholder: In real implementation, this would analyze Jest test results
    // from the last 24-48 hours to identify flaky tests
    return [];
  }

  private shouldAutoQuarantine(result: any): boolean {
    // Auto-quarantine criteria:
    // - More than 10% flakiness over at least 10 runs
    // - 3 or more failures in the last 24 hours
    // - Consistent failures across different environments

    return (
      result.flakinessPercentage > 10 &&
      result.totalRuns >= 10 &&
      result.failures >= 3
    );
  }

  private async updateJestConfiguration(): Promise<void> {
    // Update Jest configuration to skip quarantined tests
    const quarantinedTests = Object.values(this.registry.tests);

    if (quarantinedTests.length === 0) {
      console.log("No quarantined tests - Jest configuration unchanged");
      return;
    }

    // Create a Jest setup file that skips quarantined tests
    const skipTestsPath = path.join(
      process.cwd(),
      "test",
      "config",
      "skip-quarantined-tests.js"
    );
    await fs.mkdir(path.dirname(skipTestsPath), { recursive: true });

    const skipTestsContent = `
// Auto-generated file - do not edit manually
// Skips quarantined tests during Jest execution

const quarantinedTests = ${JSON.stringify(
      quarantinedTests.map((t) => ({
        testPath: t.testPath,
        testName: t.testName,
        reason: t.reason,
      })),
      null,
      2
    )};

beforeEach(() => {
  const currentTestPath = expect.getState().testPath;
  const currentTestName = expect.getState().currentTestName;
  
  const quarantined = quarantinedTests.find(t => 
    currentTestPath?.includes(t.testPath) && 
    currentTestName?.includes(t.testName)
  );
  
  if (quarantined) {
    console.warn(\`⚠️ Skipping quarantined test: \${currentTestName}\`);
    console.warn(\`   Reason: \${quarantined.reason}\`);
    test.skip();
  }
});
`;

    await fs.writeFile(skipTestsPath, skipTestsContent);
    console.log(
      `📝 Updated Jest configuration to skip ${quarantinedTests.length} quarantined tests`
    );
  }

  private async createQuarantineTicket(test: QuarantinedTest): Promise<void> {
    // Placeholder for ticket creation (GitHub Issues, Jira, etc.)
    const ticketContent = `
# Quarantined Test: ${test.testName}

**Test Path:** ${test.testPath}
**Quarantined:** ${test.quarantinedAt}
**Reason:** ${test.reason}

## Failure Details
- Failure Count: ${test.failureCount}
- Flakiness: ${test.metadata.flakinessPercentage}%
- Environment: ${test.metadata.environment.join(", ")}

## Next Steps
1. Investigate root cause of flakiness
2. Fix underlying issue or improve test stability
3. Restore test using: \`npm run test:quarantine:remove ${test.id}\`

## Auto-generated by Test Quarantine Manager
`;

    const ticketsDir = path.join(process.cwd(), "logs", "testing", "tickets");
    await fs.mkdir(ticketsDir, { recursive: true });

    const ticketPath = path.join(ticketsDir, `${test.id}.md`);
    await fs.writeFile(ticketPath, ticketContent);

    console.log(`🎫 Quarantine ticket created: ${ticketPath}`);
  }

  private generateMarkdownReport(tests: QuarantinedTest[]): string {
    const now = new Date().toISOString();

    return `# Test Quarantine Report

Generated: ${now}

## Summary

- **Total Quarantined Tests:** ${tests.length}
- **Total Ever Quarantined:** ${this.registry.statistics.totalQuarantined}
- **Total Restored:** ${this.registry.statistics.totalRestored}
- **Average Quarantine Time:** ${Math.round(
      this.registry.statistics.averageQuarantineTime / (1000 * 60 * 60 * 24)
    )} days

## Currently Quarantined Tests

${tests.length === 0 ? "No tests currently in quarantine ✅" : ""}

${tests
  .map(
    (test) => `
### ${test.testName}

- **Path:** ${test.testPath}
- **ID:** ${test.id}
- **Reason:** ${test.reason}
- **Quarantined:** ${test.quarantinedAt} by ${test.quarantinedBy}
- **Failures:** ${test.failureCount} (${
      test.metadata.flakinessPercentage
    }% flaky)
- **Environment:** ${test.metadata.environment.join(", ")}
${test.ticketUrl ? `- **Ticket:** ${test.ticketUrl}` : ""}
${test.restoreAfter ? `- **Restore After:** ${test.restoreAfter}` : ""}
`
  )
  .join("\n")}

## Recommendations

${
  tests.length > 5
    ? "⚠️ High number of quarantined tests - consider reviewing test infrastructure"
    : ""
}
${
  tests.length === 0
    ? "✅ No quarantined tests - excellent test stability!"
    : ""
}

---
*Generated by Test Quarantine Manager*
`;
  }

  private generateTestId(testPath: string, testName: string): string {
    const hash = Buffer.from(`${testPath}:${testName}`)
      .toString("base64")
      .slice(0, 8);
    return `quarantine-${hash}-${Date.now()}`;
  }

  private async saveRegistry(): Promise<void> {
    await fs.writeFile(
      this.registryPath,
      JSON.stringify(this.registry, null, 2)
    );
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command) {
    console.log(`
Test Quarantine Manager
Usage: tsx test-quarantine-manager.ts <command> [options]

Commands:
  add <testPath> <testName> <reason>     Quarantine a test
  remove <testId> <reason>               Restore a quarantined test
  list                                   List all quarantined tests
  report                                 Generate quarantine report
  check                                  Check for auto-quarantine candidates

Examples:
  tsx test-quarantine-manager.ts add "src/components/auth" "should login successfully" "Flaky in CI"
  tsx test-quarantine-manager.ts remove quarantine-abc123 "Fixed underlying issue"
  tsx test-quarantine-manager.ts list
    `);
    process.exit(0);
  }

  const manager = new TestQuarantineManager();
  await manager.initialize();

  try {
    switch (command) {
      case "add": {
        const testPath = args[1];
        const testName = args[2];
        const reason = args[3];

        if (!testPath || !testName || !reason) {
          throw new Error("Test path, test name, and reason are required");
        }

        await manager.quarantineTest(testPath, testName, reason);
        break;
      }
      case "remove": {
        const testId = args[1];
        const reason = args[2];

        if (!testId || !reason) {
          throw new Error("Test ID and reason are required");
        }

        await manager.restoreTest(testId, reason);
        break;
      }
      case "list":
        await manager.listQuarantinedTests();
        break;
      case "report":
        await manager.generateQuarantineReport();
        break;
      case "check":
        await manager.checkAutoQuarantine();
        break;
      default:
        throw new Error(`Unknown command: ${command}`);
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { QuarantineRegistry, QuarantinedTest, TestQuarantineManager };
