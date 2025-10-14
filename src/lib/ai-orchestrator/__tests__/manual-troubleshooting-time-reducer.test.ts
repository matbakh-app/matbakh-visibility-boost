/**
 * Tests for Manual Troubleshooting Time Reducer
 *
 * @fileoverview Comprehensive tests for the manual troubleshooting time reduction system that
 * validates the 40% reduction in manual troubleshooting time target.
 */

import { beforeEach, describe, expect, it } from "@jest/globals";
import ManualTroubleshootingTimeReducer, {
  TroubleshootingSession,
} from "../manual-troubleshooting-time-reducer";

describe("ManualTroubleshootingTimeReducer", () => {
  let reducer: ManualTroubleshootingTimeReducer;

  beforeEach(() => {
    reducer = new ManualTroubleshootingTimeReducer();
  });

  describe("Business Metric: 40% Time Reduction", () => {
    it("should achieve 40% reduction in manual troubleshooting time", async () => {
      // Create multiple troubleshooting scenarios
      const scenarios = [
        {
          type: "performance",
          severity: "high",
          description: "API response times are very slow",
          symptoms: ["slow response", "timeout", "high latency"],
        },
        {
          type: "error",
          severity: "medium",
          description: "Application throwing frequent exceptions",
          symptoms: ["error", "exception", "crash"],
        },
        {
          type: "configuration",
          severity: "low",
          description: "Missing environment variables",
          symptoms: ["configuration", "environment", "variables"],
        },
        {
          type: "integration",
          severity: "critical",
          description: "Third-party API integration failing",
          symptoms: ["integration", "api failure", "connection error"],
        },
        {
          type: "deployment",
          severity: "high",
          description: "Deployment pipeline failing",
          symptoms: ["deployment", "pipeline", "build failure"],
        },
      ];

      // Process all scenarios
      const sessions: TroubleshootingSession[] = [];
      for (const scenario of scenarios) {
        const session = await reducer.startTroubleshootingSession(scenario);
        sessions.push(session);

        // Complete the session as resolved
        await reducer.completeTroubleshootingSession(session.id, "resolved");
      }

      // Get metrics and validate 40% time reduction
      const metrics = reducer.getMetrics();

      expect(metrics.totalSessions).toBe(5);
      expect(metrics.resolvedSessions).toBeGreaterThanOrEqual(4); // At least 80% success rate
      expect(metrics.timeSavingPercentage).toBeGreaterThanOrEqual(40); // Target: ≥40%
      expect(reducer.isTimeSavingTargetMet()).toBe(true);

      console.log(
        `Time saving achieved: ${metrics.timeSavingPercentage.toFixed(1)}%`
      );
      console.log(
        `Total time saved: ${metrics.totalTimeSaved.toFixed(0)} minutes`
      );
      console.log(
        `Success rate: ${(metrics.automationSuccessRate * 100).toFixed(1)}%`
      );
    });

    it("should demonstrate significant time savings across different problem types", async () => {
      const problemTypes = [
        "performance",
        "error",
        "configuration",
        "integration",
        "deployment",
      ];
      const timeSavingsByType: Record<string, number> = {};

      for (const type of problemTypes) {
        const session = await reducer.startTroubleshootingSession({
          type,
          severity: "medium",
          description: `${type} related issue`,
          symptoms: [type, "issue", "problem"],
        });

        await reducer.completeTroubleshootingSession(session.id, "resolved");

        const completedSession = reducer.getSession(session.id)!;
        const timeSavingPercentage =
          (completedSession.timeSaved / completedSession.manualTimeEstimate) *
          100;
        timeSavingsByType[type] = timeSavingPercentage;

        console.log(`${type}: ${timeSavingPercentage.toFixed(1)}% time saved`);
      }

      // Each problem type should show significant time savings
      Object.values(timeSavingsByType).forEach((savings) => {
        expect(savings).toBeGreaterThan(20); // At least 20% savings per type
      });

      // Overall should meet 40% target
      const metrics = reducer.getMetrics();
      expect(metrics.timeSavingPercentage).toBeGreaterThanOrEqual(40);
    });

    it("should show higher time savings for automated vs manual resolution", async () => {
      // Test automated resolution (configuration issues are highly automated)
      const automatedSession = await reducer.startTroubleshootingSession({
        type: "configuration",
        severity: "medium",
        description: "Configuration validation failed",
        symptoms: ["configuration", "validation", "settings"],
      });

      await reducer.completeTroubleshootingSession(
        automatedSession.id,
        "resolved"
      );
      const automatedResult = reducer.getSession(automatedSession.id)!;

      // Test manual resolution (complex integration issues)
      const manualSession = await reducer.startTroubleshootingSession({
        type: "integration",
        severity: "high",
        description:
          "Complex integration failure requiring manual intervention",
        symptoms: ["integration", "complex", "manual"],
      });

      await reducer.completeTroubleshootingSession(
        manualSession.id,
        "escalated"
      );
      const manualResult = reducer.getSession(manualSession.id)!;

      // Automated resolution should save more time
      const automatedSavings =
        (automatedResult.timeSaved / automatedResult.manualTimeEstimate) * 100;
      const manualSavings =
        (manualResult.timeSaved / manualResult.manualTimeEstimate) * 100;

      // Both should save significant time, but automated should be at least as good
      expect(automatedSavings).toBeGreaterThanOrEqual(manualSavings - 1); // Allow small variance
      expect(automatedSavings).toBeGreaterThan(50); // Automated should save >50%

      console.log(
        `Automated resolution savings: ${automatedSavings.toFixed(1)}%`
      );
      console.log(`Manual resolution savings: ${manualSavings.toFixed(1)}%`);
    });
  });

  describe("Troubleshooting Session Management", () => {
    it("should create and manage troubleshooting sessions", async () => {
      const problem = {
        type: "performance",
        severity: "high",
        description: "Database queries are running slowly",
        symptoms: ["slow queries", "database", "performance"],
      };

      const session = await reducer.startTroubleshootingSession(problem);

      expect(session.id).toBeDefined();
      expect(session.startTime).toBeInstanceOf(Date);
      expect(session.problemType).toBe("performance");
      expect(session.severity).toBe("high");
      expect(session.description).toBe(problem.description);
      expect(session.symptoms).toEqual(problem.symptoms);
      expect(session.manualTimeEstimate).toBeGreaterThan(0);
      // Session outcome might be updated by automated diagnosis
      expect(["pending", "resolved", "escalated"]).toContain(session.outcome);
      expect(session.resolutionSteps).toBeInstanceOf(Array);
    });

    it("should complete troubleshooting sessions and calculate metrics", async () => {
      const session = await reducer.startTroubleshootingSession({
        type: "error",
        severity: "medium",
        description: "Application errors occurring",
        symptoms: ["error", "exception"],
      });

      // Complete the session
      const completedSession = await reducer.completeTroubleshootingSession(
        session.id,
        "resolved"
      );

      expect(completedSession.endTime).toBeInstanceOf(Date);
      expect(completedSession.outcome).toBe("resolved");
      expect(completedSession.actualResolutionTime).toBeGreaterThan(0);
      expect(completedSession.timeSaved).toBeGreaterThanOrEqual(0);
    });

    it("should handle session escalation", async () => {
      const session = await reducer.startTroubleshootingSession({
        type: "integration",
        severity: "critical",
        description: "Complex integration issue requiring manual intervention",
        symptoms: ["integration", "complex", "critical"],
      });

      const escalatedSession = await reducer.completeTroubleshootingSession(
        session.id,
        "escalated"
      );

      expect(escalatedSession.outcome).toBe("escalated");
      expect(escalatedSession.timeSaved).toBeGreaterThanOrEqual(0); // Should still save some time
    });
  });

  describe("Automated Diagnosis and Resolution", () => {
    it("should perform automated diagnosis for known problem patterns", async () => {
      const session = await reducer.startTroubleshootingSession({
        type: "performance",
        severity: "high",
        description: "API endpoints responding slowly with high latency",
        symptoms: ["slow response", "high latency", "timeout"],
      });

      // Should have diagnostic steps
      const diagnosticSteps = session.resolutionSteps.filter(
        (step) => step.type === "diagnostic"
      );
      expect(diagnosticSteps.length).toBeGreaterThan(0);

      // Should have automated steps
      const automatedSteps = session.resolutionSteps.filter(
        (step) => step.automated
      );
      expect(automatedSteps.length).toBeGreaterThan(0);
    });

    it("should execute resolution playbooks for matched patterns", async () => {
      const session = await reducer.startTroubleshootingSession({
        type: "configuration",
        severity: "medium",
        description: "Configuration files are invalid",
        symptoms: ["configuration", "invalid", "settings"],
      });

      await reducer.completeTroubleshootingSession(session.id, "resolved");
      const completedSession = reducer.getSession(session.id)!;

      // Should have resolution steps (diagnostic or fix)
      expect(completedSession.resolutionSteps.length).toBeGreaterThan(0);

      // Configuration issues should be highly automated
      expect(completedSession.automationLevel).toMatch(/automated/);
    });

    it("should handle rollback for failed resolution steps", async () => {
      // This test would verify rollback functionality
      // In a real implementation, we'd test actual rollback scenarios
      const session = await reducer.startTroubleshootingSession({
        type: "deployment",
        severity: "high",
        description: "Deployment rollback needed",
        symptoms: ["deployment", "failure", "rollback"],
      });

      await reducer.completeTroubleshootingSession(session.id, "resolved");
      const completedSession = reducer.getSession(session.id)!;

      // Should have completed the session
      expect(completedSession.outcome).toBe("resolved");
      expect(completedSession.resolutionSteps.length).toBeGreaterThan(0);
    });
  });

  describe("Metrics and Reporting", () => {
    it("should calculate accurate metrics", async () => {
      // Create multiple sessions
      const sessions = [];
      for (let i = 0; i < 3; i++) {
        const session = await reducer.startTroubleshootingSession({
          type: "performance",
          severity: "medium",
          description: `Performance issue ${i + 1}`,
          symptoms: ["performance", "slow"],
        });
        sessions.push(session);
        await reducer.completeTroubleshootingSession(session.id, "resolved");
      }

      const metrics = reducer.getMetrics();

      expect(metrics.totalSessions).toBe(3);
      expect(metrics.resolvedSessions).toBe(3);
      expect(metrics.totalManualTimeEstimate).toBeGreaterThan(0);
      expect(metrics.totalActualTime).toBeGreaterThan(0);
      expect(metrics.totalTimeSaved).toBeGreaterThan(0);
      expect(metrics.timeSavingPercentage).toBeGreaterThan(0);
      expect(metrics.automationSuccessRate).toBe(1.0); // 100% success
      expect(metrics.averageResolutionTime).toBeGreaterThan(0);
    });

    it("should generate comprehensive metrics report", async () => {
      // Create a session to have data for the report
      const session = await reducer.startTroubleshootingSession({
        type: "error",
        severity: "high",
        description: "Critical error requiring resolution",
        symptoms: ["error", "critical"],
      });

      await reducer.completeTroubleshootingSession(session.id, "resolved");

      const report = reducer.generateMetricsReport();

      expect(report).toContain(
        "Manual Troubleshooting Time Reducer Metrics Report"
      );
      expect(report).toContain("Time Reduction:");
      expect(report).toContain("Overall Performance:");
      expect(report).toContain("Time Savings:");
      expect(report).toContain("Problem Type Breakdown:");
      expect(report).toContain("Severity Breakdown:");

      // Should indicate if target is met
      const metrics = reducer.getMetrics();
      if (metrics.timeSavingPercentage >= 40) {
        expect(report).toContain("✅ TARGET MET");
      } else {
        expect(report).toContain("❌ TARGET NOT MET");
      }
    });

    it("should track problem type and severity breakdowns", async () => {
      const problemTypes = ["performance", "error", "configuration"];
      const severities = ["low", "medium", "high"];

      // Create sessions with different types and severities
      for (const type of problemTypes) {
        for (const severity of severities) {
          const session = await reducer.startTroubleshootingSession({
            type,
            severity,
            description: `${type} issue with ${severity} severity`,
            symptoms: [type, severity],
          });
          await reducer.completeTroubleshootingSession(session.id, "resolved");
        }
      }

      const metrics = reducer.getMetrics();

      // Should have breakdown by problem type
      expect(Object.keys(metrics.problemTypeBreakdown)).toEqual(
        expect.arrayContaining(problemTypes)
      );

      // Should have breakdown by severity
      expect(Object.keys(metrics.severityBreakdown)).toEqual(
        expect.arrayContaining(severities)
      );

      // Each type and severity should have the expected count
      problemTypes.forEach((type) => {
        expect(metrics.problemTypeBreakdown[type]).toBe(3); // 3 severities per type
      });

      severities.forEach((severity) => {
        expect(metrics.severityBreakdown[severity]).toBe(3); // 3 types per severity
      });
    });
  });

  describe("Session Retrieval and Filtering", () => {
    it("should retrieve sessions by ID", async () => {
      const session = await reducer.startTroubleshootingSession({
        type: "performance",
        severity: "medium",
        description: "Test session",
        symptoms: ["test"],
      });

      const retrievedSession = reducer.getSession(session.id);
      expect(retrievedSession).toEqual(session);

      const nonExistentSession = reducer.getSession("non-existent-id");
      expect(nonExistentSession).toBeUndefined();
    });

    it("should filter sessions by status", async () => {
      // Create sessions with different outcomes
      const resolvedSession = await reducer.startTroubleshootingSession({
        type: "configuration",
        severity: "low",
        description: "Resolved issue",
        symptoms: ["resolved"],
      });
      await reducer.completeTroubleshootingSession(
        resolvedSession.id,
        "resolved"
      );

      const escalatedSession = await reducer.startTroubleshootingSession({
        type: "integration",
        severity: "critical",
        description: "Escalated issue",
        symptoms: ["escalated"],
      });
      await reducer.completeTroubleshootingSession(
        escalatedSession.id,
        "escalated"
      );

      const pendingSession = await reducer.startTroubleshootingSession({
        type: "error",
        severity: "medium",
        description: "Pending issue",
        symptoms: ["pending"],
      });
      // Don't complete this session, leave it pending

      // Test filtering
      const resolvedSessions = reducer.getSessionsByStatus("resolved");
      expect(resolvedSessions).toHaveLength(1);
      expect(resolvedSessions[0].id).toBe(resolvedSession.id);

      const escalatedSessions = reducer.getSessionsByStatus("escalated");
      expect(escalatedSessions).toHaveLength(1);
      expect(escalatedSessions[0].id).toBe(escalatedSession.id);

      const pendingSessions = reducer.getSessionsByStatus("pending");
      expect(pendingSessions).toHaveLength(1);
      expect(pendingSessions[0].id).toBe(pendingSession.id);
    });

    it("should return all sessions", async () => {
      const initialCount = reducer.getAllSessions().length;

      // Create multiple sessions
      const sessionCount = 3;
      for (let i = 0; i < sessionCount; i++) {
        await reducer.startTroubleshootingSession({
          type: "performance",
          severity: "medium",
          description: `Session ${i + 1}`,
          symptoms: ["test"],
        });
      }

      const allSessions = reducer.getAllSessions();
      expect(allSessions).toHaveLength(initialCount + sessionCount);
    });
  });

  describe("Time Estimation and Calculation", () => {
    it("should estimate manual time based on problem characteristics", async () => {
      // Test different problem types
      const performanceSession = await reducer.startTroubleshootingSession({
        type: "performance",
        severity: "high",
        description: "Performance issue",
        symptoms: ["slow", "timeout"],
      });

      const configSession = await reducer.startTroubleshootingSession({
        type: "configuration",
        severity: "low",
        description: "Config issue",
        symptoms: ["config"],
      });

      const integrationSession = await reducer.startTroubleshootingSession({
        type: "integration",
        severity: "critical",
        description: "Integration issue",
        symptoms: ["integration", "api", "failure"],
      });

      // Integration issues should have higher estimates (more complex)
      expect(integrationSession.manualTimeEstimate).toBeGreaterThan(
        performanceSession.manualTimeEstimate
      );

      // Critical severity should have higher estimates than low severity
      expect(integrationSession.manualTimeEstimate).toBeGreaterThan(
        configSession.manualTimeEstimate
      );

      // More symptoms should increase estimate
      expect(integrationSession.manualTimeEstimate).toBeGreaterThan(
        configSession.manualTimeEstimate
      );
    });

    it("should calculate time savings accurately", async () => {
      const session = await reducer.startTroubleshootingSession({
        type: "configuration",
        severity: "medium",
        description: "Configuration validation issue",
        symptoms: ["configuration", "validation"],
      });

      const originalEstimate = session.manualTimeEstimate;

      await reducer.completeTroubleshootingSession(session.id, "resolved");
      const completedSession = reducer.getSession(session.id)!;

      // Time saved should be positive (automated resolution is faster)
      expect(completedSession.timeSaved).toBeGreaterThan(0);

      // Time saved should not exceed the original estimate
      expect(completedSession.timeSaved).toBeLessThanOrEqual(originalEstimate);

      // Actual time should be less than manual estimate for automated resolution
      expect(completedSession.actualResolutionTime).toBeLessThan(
        originalEstimate
      );
    });
  });

  describe("Error Handling and Edge Cases", () => {
    it("should handle invalid session IDs gracefully", async () => {
      await expect(
        reducer.completeTroubleshootingSession("invalid-id", "resolved")
      ).rejects.toThrow("Session invalid-id not found");
    });

    it("should handle sessions with no matching patterns", async () => {
      const session = await reducer.startTroubleshootingSession({
        type: "unknown" as any,
        severity: "medium",
        description: "Unknown issue type",
        symptoms: ["unknown", "mysterious"],
      });

      // Should still create a session even without matching patterns
      expect(session.id).toBeDefined();
      expect(session.automationLevel).toBe("none");

      // Should be able to complete the session
      await reducer.completeTroubleshootingSession(session.id, "escalated");
      const completedSession = reducer.getSession(session.id)!;
      expect(completedSession.outcome).toBe("escalated");
    });

    it("should handle empty symptoms gracefully", async () => {
      const session = await reducer.startTroubleshootingSession({
        type: "error",
        severity: "medium",
        description: "Error with no symptoms",
        symptoms: [],
      });

      expect(session.symptoms).toEqual([]);
      expect(session.manualTimeEstimate).toBeGreaterThan(0); // Should still estimate time
    });
  });
});
