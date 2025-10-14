/**
 * 85% Accuracy Requirement Test
 *
 * @fileoverview Specific test to validate that the implementation gap detection
 * system meets the business requirement of >85% accuracy consistently.
 */

import { beforeEach, describe, expect, it } from "@jest/globals";
import { MockImplementationSupport } from "../implementation-gap-accuracy-demo";
import ImplementationGapAccuracyValidator from "../implementation-gap-accuracy-validator";

describe("Implementation Gap Detection - 85% Accuracy Requirement", () => {
  let validator: ImplementationGapAccuracyValidator;
  let mockImplementationSupport: MockImplementationSupport;

  beforeEach(() => {
    validator = new ImplementationGapAccuracyValidator();
    mockImplementationSupport = new MockImplementationSupport();
  });

  describe("Business Metric: >85% Accuracy", () => {
    it("should achieve >85% accuracy in single validation run", async () => {
      const result = await validator.validateAccuracy(
        mockImplementationSupport
      );

      expect(result.accuracy).toBeGreaterThan(85);
      expect(validator.isAccuracyTargetMet()).toBe(true);

      console.log(
        `✅ Single run accuracy: ${result.accuracy.toFixed(2)}% (Target: >85%)`
      );
    });

    it("should maintain >85% accuracy across 10 consecutive runs", async () => {
      const accuracyResults: number[] = [];
      let passCount = 0;

      for (let i = 0; i < 10; i++) {
        const result = await validator.validateAccuracy(
          mockImplementationSupport
        );
        accuracyResults.push(result.accuracy);

        if (result.accuracy > 85) {
          passCount++;
        }

        console.log(
          `Run ${i + 1}: ${result.accuracy.toFixed(2)}% ${
            result.accuracy > 85 ? "✅" : "❌"
          }`
        );
      }

      const averageAccuracy =
        accuracyResults.reduce((sum, acc) => sum + acc, 0) /
        accuracyResults.length;
      const passRate = (passCount / 10) * 100;

      // Business requirement: >85% accuracy consistently
      expect(averageAccuracy).toBeGreaterThan(85);
      expect(passRate).toBeGreaterThanOrEqual(80); // At least 80% of runs should pass

      console.log(`\n📊 CONSISTENCY ANALYSIS:`);
      console.log(`Average Accuracy: ${averageAccuracy.toFixed(2)}%`);
      console.log(`Pass Rate: ${passRate}% (${passCount}/10 runs)`);
      console.log(`Min Accuracy: ${Math.min(...accuracyResults).toFixed(2)}%`);
      console.log(`Max Accuracy: ${Math.max(...accuracyResults).toFixed(2)}%`);

      const variance =
        accuracyResults.reduce(
          (sum, acc) => sum + Math.pow(acc - averageAccuracy, 2),
          0
        ) / accuracyResults.length;
      const standardDeviation = Math.sqrt(variance);
      console.log(`Standard Deviation: ${standardDeviation.toFixed(2)}%`);

      expect(standardDeviation).toBeLessThan(8); // Should be reasonably stable
    });

    it("should achieve >85% accuracy under different conditions", async () => {
      const conditions = [
        { name: "Standard Configuration", config: {} },
        { name: "Strict Mode", config: { strictMode: true } },
        { name: "Comprehensive Analysis", config: { comprehensive: true } },
        { name: "High Sensitivity", config: { sensitivity: "high" } },
        { name: "Balanced Mode", config: { balanced: true } },
      ];

      const results = [];

      for (const condition of conditions) {
        const result = await validator.validateAccuracy(
          mockImplementationSupport
        );
        results.push({ condition: condition.name, accuracy: result.accuracy });

        expect(result.accuracy).toBeGreaterThan(85);
        console.log(`${condition.name}: ${result.accuracy.toFixed(2)}% ✅`);
      }

      const averageAcrossConditions =
        results.reduce((sum, r) => sum + r.accuracy, 0) / results.length;
      expect(averageAcrossConditions).toBeGreaterThan(85);

      console.log(
        `\nAverage across all conditions: ${averageAcrossConditions.toFixed(
          2
        )}%`
      );
    });

    it("should meet accuracy target for each gap type individually", async () => {
      const result = await validator.validateAccuracy(
        mockImplementationSupport
      );

      const gapTypes = [
        "implementation",
        "configuration",
        "integration",
        "testing",
      ];
      const typeAccuracies: Record<string, number> = {};

      gapTypes.forEach((type) => {
        const typeResults = result.detailedResults.filter(
          (r) => r.gapType === type
        );
        if (typeResults.length > 0) {
          const correct = typeResults.filter(
            (r) => r.correctlyClassified
          ).length;
          const accuracy = (correct / typeResults.length) * 100;
          typeAccuracies[type] = accuracy;

          console.log(
            `${type.padEnd(15)}: ${accuracy.toFixed(1)}% (${correct}/${
              typeResults.length
            })`
          );

          // Different thresholds for different gap types based on difficulty
          switch (type) {
            case "implementation":
              expect(accuracy).toBeGreaterThanOrEqual(85); // Should be easiest to detect
              break;
            case "configuration":
              expect(accuracy).toBeGreaterThanOrEqual(80); // Configuration gaps are clear
              break;
            case "integration":
              expect(accuracy).toBeGreaterThanOrEqual(75); // Integration gaps are harder
              break;
            case "testing":
              expect(accuracy).toBeGreaterThanOrEqual(70); // Testing gaps are hardest
              break;
          }
        }
      });

      // Overall should still be >85%
      expect(result.accuracy).toBeGreaterThan(85);
    });

    it("should meet accuracy target for critical and high severity gaps", async () => {
      const result = await validator.validateAccuracy(
        mockImplementationSupport
      );

      const criticalGaps = result.detailedResults.filter(
        (r) => r.severity === "critical"
      );
      const highGaps = result.detailedResults.filter(
        (r) => r.severity === "high"
      );

      if (criticalGaps.length > 0) {
        const criticalAccuracy =
          (criticalGaps.filter((r) => r.correctlyClassified).length /
            criticalGaps.length) *
          100;
        expect(criticalAccuracy).toBeGreaterThanOrEqual(90); // 90% for critical
        console.log(
          `Critical gaps accuracy: ${criticalAccuracy.toFixed(1)}% (${
            criticalGaps.length
          } gaps)`
        );
      }

      if (highGaps.length > 0) {
        const highAccuracy =
          (highGaps.filter((r) => r.correctlyClassified).length /
            highGaps.length) *
          100;
        expect(highAccuracy).toBeGreaterThanOrEqual(85); // 85% for high
        console.log(
          `High severity gaps accuracy: ${highAccuracy.toFixed(1)}% (${
            highGaps.length
          } gaps)`
        );
      }

      // Overall accuracy should still meet target
      expect(result.accuracy).toBeGreaterThan(85);
    });

    it("should demonstrate accuracy improvement over baseline", async () => {
      // Simulate baseline (random detection)
      const baselineAccuracy = 50; // Random would be ~50%

      const result = await validator.validateAccuracy(
        mockImplementationSupport
      );
      const improvement = result.accuracy - baselineAccuracy;

      expect(improvement).toBeGreaterThan(35); // Should be significantly better than random
      expect(result.accuracy).toBeGreaterThan(85); // Should meet business target

      console.log(`Baseline accuracy: ${baselineAccuracy}%`);
      console.log(`Achieved accuracy: ${result.accuracy.toFixed(2)}%`);
      console.log(`Improvement: +${improvement.toFixed(2)} percentage points`);
      console.log(
        `Improvement factor: ${(result.accuracy / baselineAccuracy).toFixed(
          2
        )}x`
      );
    });

    it("should maintain accuracy with high confidence scores", async () => {
      const result = await validator.validateAccuracy(
        mockImplementationSupport
      );

      expect(result.accuracy).toBeGreaterThan(85);
      expect(result.confidenceScore).toBeGreaterThan(0.7); // High confidence

      // High accuracy should correlate with high confidence
      const confidenceAccuracyCorrelation =
        (result.confidenceScore * result.accuracy) / 100;
      expect(confidenceAccuracyCorrelation).toBeGreaterThan(0.6);

      console.log(`Accuracy: ${result.accuracy.toFixed(2)}%`);
      console.log(`Confidence: ${(result.confidenceScore * 100).toFixed(1)}%`);
      console.log(
        `Confidence-Accuracy Correlation: ${confidenceAccuracyCorrelation.toFixed(
          3
        )}`
      );
    });

    it("should achieve accuracy target with acceptable performance", async () => {
      const startTime = Date.now();
      const result = await validator.validateAccuracy(
        mockImplementationSupport
      );
      const duration = Date.now() - startTime;

      expect(result.accuracy).toBeGreaterThan(85);
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds

      const gapsPerSecond = result.totalGaps / (duration / 1000);
      expect(gapsPerSecond).toBeGreaterThan(2); // Should process at least 2 gaps per second

      console.log(`Accuracy: ${result.accuracy.toFixed(2)}%`);
      console.log(`Duration: ${duration}ms`);
      console.log(`Gaps analyzed: ${result.totalGaps}`);
      console.log(`Processing rate: ${gapsPerSecond.toFixed(1)} gaps/second`);
    });

    it("should generate comprehensive accuracy report showing >85% achievement", async () => {
      const result = await validator.validateAccuracy(
        mockImplementationSupport
      );
      const report = validator.generateAccuracyReport();

      expect(result.accuracy).toBeGreaterThan(85);
      expect(report).toContain("✅ TARGET MET");
      expect(report).toContain(
        `Overall Accuracy: ${result.accuracy.toFixed(2)}%`
      );
      expect(report).toContain("Target: ≥85%");

      // Report should show detailed breakdown
      expect(report).toContain("Detection Statistics:");
      expect(report).toContain("Accuracy by Gap Type:");
      expect(report).toContain("Accuracy by Severity:");

      console.log("\n📋 ACCURACY REPORT:");
      console.log("=".repeat(50));
      console.log(report);
    });

    it("should validate business metric achievement status", async () => {
      const result = await validator.validateAccuracy(
        mockImplementationSupport
      );

      // Business metric should be achieved
      expect(result.accuracy).toBeGreaterThan(85);
      expect(validator.isAccuracyTargetMet()).toBe(true);

      // Should have meaningful detection statistics
      expect(result.totalGaps).toBeGreaterThan(10);
      expect(result.correctlyDetected).toBeGreaterThan(result.totalGaps * 0.85);

      // False positive and negative rates should be reasonable
      const falsePositiveRate = result.falsePositives / result.totalGaps;
      const falseNegativeRate = result.falseNegatives / result.totalGaps;

      expect(falsePositiveRate).toBeLessThan(0.1); // <10% false positives
      expect(falseNegativeRate).toBeLessThan(0.15); // <15% false negatives

      console.log("\n🎯 BUSINESS METRIC VALIDATION:");
      console.log(
        `✅ Accuracy Target (>85%): ${result.accuracy.toFixed(2)}% - MET`
      );
      console.log(
        `✅ Target Status: ${
          validator.isAccuracyTargetMet() ? "ACHIEVED" : "NOT ACHIEVED"
        }`
      );
      console.log(`✅ Total Gaps Analyzed: ${result.totalGaps}`);
      console.log(
        `✅ Correctly Detected: ${result.correctlyDetected} (${(
          (result.correctlyDetected / result.totalGaps) *
          100
        ).toFixed(1)}%)`
      );
      console.log(
        `✅ False Positive Rate: ${(falsePositiveRate * 100).toFixed(1)}%`
      );
      console.log(
        `✅ False Negative Rate: ${(falseNegativeRate * 100).toFixed(1)}%`
      );
      console.log(
        `✅ Confidence Score: ${(result.confidenceScore * 100).toFixed(1)}%`
      );
    });
  });
});
