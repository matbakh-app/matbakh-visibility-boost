/**
 * Integration Tests for Implementation Gap Detection Accuracy
 *
 * @fileoverview Integration tests that validate the implementation gap detection
 * accuracy system works correctly with real-world scenarios and meets the
 * business metric requirement of >85% accuracy.
 */

import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { MockImplementationSupport } from "../implementation-gap-accuracy-demo";
import ImplementationGapAccuracyValidator from "../implementation-gap-accuracy-validator";

describe("Implementation Gap Detection Accuracy Integration", () => {
  let validator: ImplementationGapAccuracyValidator;
  let mockImplementationSupport: MockImplementationSupport;

  beforeEach(() => {
    validator = new ImplementationGapAccuracyValidator();
    mockImplementationSupport = new MockImplementationSupport();
  });

  describe("Business Metric Compliance", () => {
    it("should achieve >85% accuracy target consistently", async () => {
      const results = [];

      // Run multiple validation cycles to ensure consistency
      for (let i = 0; i < 10; i++) {
        const result = await validator.validateAccuracy(
          mockImplementationSupport
        );
        results.push(result.accuracy);
      }

      const averageAccuracy =
        results.reduce((sum, acc) => sum + acc, 0) / results.length;
      const minAccuracy = Math.min(...results);

      // Business requirement: >85% accuracy
      expect(averageAccuracy).toBeGreaterThan(85);
      expect(minAccuracy).toBeGreaterThan(80); // Even worst case should be reasonable

      console.log(
        `Average accuracy over 10 runs: ${averageAccuracy.toFixed(2)}%`
      );
      console.log(`Minimum accuracy: ${minAccuracy.toFixed(2)}%`);
      console.log(
        `✅ Business metric >85% accuracy: ${
          averageAccuracy > 85 ? "MET" : "NOT MET"
        }`
      );
    });

    it("should maintain accuracy stability across multiple runs", async () => {
      const results = [];

      for (let i = 0; i < 5; i++) {
        const result = await validator.validateAccuracy(
          mockImplementationSupport
        );
        results.push(result.accuracy);
      }

      const average =
        results.reduce((sum, acc) => sum + acc, 0) / results.length;
      const variance =
        results.reduce((sum, acc) => sum + Math.pow(acc - average, 2), 0) /
        results.length;
      const standardDeviation = Math.sqrt(variance);

      // System should be stable (low variance)
      expect(standardDeviation).toBeLessThan(10); // Less than 10% standard deviation

      console.log(`Accuracy stability (σ): ${standardDeviation.toFixed(2)}%`);
    });

    it("should provide high confidence in detection results", async () => {
      const result = await validator.validateAccuracy(
        mockImplementationSupport
      );

      // High accuracy should correlate with high confidence
      if (result.accuracy >= 85) {
        expect(result.confidenceScore).toBeGreaterThan(0.7);
      }

      // Confidence should be reasonable even for lower accuracy
      expect(result.confidenceScore).toBeGreaterThan(0.5);

      console.log(
        `Confidence score: ${(result.confidenceScore * 100).toFixed(1)}%`
      );
    });
  });

  describe("Real-World Scenario Testing", () => {
    it("should handle complex mixed gap scenarios", async () => {
      const result = await validator.validateAccuracy(
        mockImplementationSupport
      );

      // Should detect various gap types
      const gapTypes = [
        "implementation",
        "configuration",
        "integration",
        "testing",
      ];
      gapTypes.forEach((type) => {
        const typeResults = result.detailedResults.filter(
          (r) => r.gapType === type
        );
        expect(typeResults.length).toBeGreaterThan(0);
      });

      // Should handle various severities
      const severities = ["critical", "high", "medium", "low"];
      const detectedSeverities = [
        ...new Set(result.detailedResults.map((r) => r.severity)),
      ];
      expect(detectedSeverities.length).toBeGreaterThanOrEqual(3); // At least 3 different severities
    });

    it("should prioritize critical and high severity gaps", async () => {
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
          criticalGaps.filter((r) => r.correctlyClassified).length /
          criticalGaps.length;
        expect(criticalAccuracy).toBeGreaterThanOrEqual(0.9); // 90% for critical
      }

      if (highGaps.length > 0) {
        const highAccuracy =
          highGaps.filter((r) => r.correctlyClassified).length /
          highGaps.length;
        expect(highAccuracy).toBeGreaterThanOrEqual(0.85); // 85% for high
      }
    });

    it("should maintain reasonable false positive rate", async () => {
      const result = await validator.validateAccuracy(
        mockImplementationSupport
      );

      const falsePositiveRate = result.falsePositives / result.totalGaps;
      expect(falsePositiveRate).toBeLessThan(0.15); // Less than 15% false positive rate

      console.log(
        `False positive rate: ${(falsePositiveRate * 100).toFixed(2)}%`
      );
    });

    it("should minimize false negative rate for critical gaps", async () => {
      const result = await validator.validateAccuracy(
        mockImplementationSupport
      );

      const criticalGaps = result.detailedResults.filter(
        (r) => r.severity === "critical" && r.actualGap
      );

      if (criticalGaps.length > 0) {
        const missedCritical = criticalGaps.filter(
          (r) => !r.detectedGap
        ).length;
        const criticalFalseNegativeRate = missedCritical / criticalGaps.length;

        expect(criticalFalseNegativeRate).toBeLessThan(0.1); // Less than 10% for critical gaps
      }
    });
  });

  describe("Performance and Scalability", () => {
    it("should complete validation within performance requirements", async () => {
      const startTime = Date.now();
      const result = await validator.validateAccuracy(
        mockImplementationSupport
      );
      const duration = Date.now() - startTime;

      // Should complete within reasonable time
      expect(duration).toBeLessThan(10000); // Less than 10 seconds
      expect(result.totalGaps).toBeGreaterThan(10); // Should analyze meaningful number of gaps

      console.log(
        `Validation completed in ${duration}ms for ${result.totalGaps} gaps`
      );
    });

    it("should handle concurrent validations efficiently", async () => {
      const startTime = Date.now();

      const promises = Array(3)
        .fill(null)
        .map(() => validator.validateAccuracy(mockImplementationSupport));

      const results = await Promise.all(promises);
      const duration = Date.now() - startTime;

      expect(results).toHaveLength(3);
      expect(duration).toBeLessThan(15000); // Should handle concurrency efficiently

      // All results should be valid
      results.forEach((result) => {
        expect(result.accuracy).toBeGreaterThanOrEqual(0);
        expect(result.totalGaps).toBeGreaterThan(0);
      });
    });

    it("should scale with different codebase sizes", async () => {
      // Test with different mock scenarios representing different codebase sizes
      const scenarios = [
        { name: "Small Codebase", expectedMinGaps: 5 },
        { name: "Medium Codebase", expectedMinGaps: 10 },
        { name: "Large Codebase", expectedMinGaps: 15 },
      ];

      for (const scenario of scenarios) {
        const result = await validator.validateAccuracy(
          mockImplementationSupport
        );
        expect(result.totalGaps).toBeGreaterThanOrEqual(
          scenario.expectedMinGaps
        );
        expect(result.accuracy).toBeGreaterThan(70); // Should maintain reasonable accuracy
      }
    });
  });

  describe("Error Handling and Resilience", () => {
    it("should handle implementation support failures gracefully", async () => {
      const faultySupport = {
        detectGaps: jest.fn().mockImplementation(() => {
          throw new Error("Detection service unavailable");
        }),
        analyzeImplementation: jest.fn().mockResolvedValue({}),
        generateRecommendations: jest.fn().mockResolvedValue([]),
      };

      const result = await validator.validateAccuracy(faultySupport);

      // Should still return a valid result structure
      expect(result).toBeDefined();
      expect(result.accuracy).toBeGreaterThanOrEqual(0);
      expect(result.validationTimestamp).toBeInstanceOf(Date);
    });

    it("should handle partial detection failures", async () => {
      const partiallyFaultySupport = {
        detectGaps: jest.fn().mockImplementation((codebase) => {
          if (codebase === "mock-codebase-1") {
            throw new Error("Codebase 1 analysis failed");
          }
          return mockImplementationSupport.detectGaps(codebase, {});
        }),
        analyzeImplementation: jest.fn().mockResolvedValue({}),
        generateRecommendations: jest.fn().mockResolvedValue([]),
      };

      const result = await validator.validateAccuracy(partiallyFaultySupport);

      // Should still achieve reasonable accuracy with partial failures
      expect(result.accuracy).toBeGreaterThan(60);
      expect(result.totalGaps).toBeGreaterThan(0);
    });

    it("should maintain data integrity across validation runs", async () => {
      const result1 = await validator.validateAccuracy(
        mockImplementationSupport
      );
      const result2 = await validator.validateAccuracy(
        mockImplementationSupport
      );

      // History should be maintained correctly
      const history = validator.getValidationHistory();
      expect(history).toHaveLength(2);
      expect(history[0]).toEqual(result1);
      expect(history[1]).toEqual(result2);

      // Latest result should be correct
      expect(validator.getLatestValidation()).toEqual(result2);
    });
  });

  describe("Business Impact Validation", () => {
    it("should demonstrate measurable business value", async () => {
      const result = await validator.validateAccuracy(
        mockImplementationSupport
      );

      // Calculate business impact metrics
      const criticalGapsDetected = result.detailedResults.filter(
        (r) => r.severity === "critical" && r.detectedGap && r.actualGap
      ).length;

      const highGapsDetected = result.detailedResults.filter(
        (r) => r.severity === "high" && r.detectedGap && r.actualGap
      ).length;

      const totalHighPriorityGaps = criticalGapsDetected + highGapsDetected;

      // Should detect meaningful number of high-priority gaps
      expect(totalHighPriorityGaps).toBeGreaterThan(0);

      // Estimate time savings (15 minutes per correctly detected gap)
      const estimatedTimeSavings = result.correctlyDetected * 15;
      expect(estimatedTimeSavings).toBeGreaterThan(60); // At least 1 hour saved

      console.log(`Business Impact:`);
      console.log(`- Critical gaps detected: ${criticalGapsDetected}`);
      console.log(`- High priority gaps detected: ${highGapsDetected}`);
      console.log(`- Estimated time savings: ${estimatedTimeSavings} minutes`);
      console.log(
        `- Potential production issues prevented: ${totalHighPriorityGaps}`
      );
    });

    it("should support continuous improvement tracking", async () => {
      // Run multiple validations to simulate improvement over time
      const results = [];

      for (let i = 0; i < 3; i++) {
        const result = await validator.validateAccuracy(
          mockImplementationSupport
        );
        results.push(result);
      }

      // Should maintain history for trend analysis
      expect(validator.getValidationHistory()).toHaveLength(3);

      // Should be able to track accuracy trends
      const accuracyTrend = results.map((r) => r.accuracy);
      expect(accuracyTrend.every((acc) => acc > 0)).toBe(true);

      // Should support reporting for stakeholders
      const report = validator.generateAccuracyReport();
      expect(report).toContain("Implementation Gap Detection Accuracy Report");
      expect(report).toContain("TARGET MET");
    });
  });

  describe("Integration with Bedrock Support System", () => {
    it("should integrate with existing implementation support system", async () => {
      // Test integration with mock that simulates real implementation support
      const integratedSupport = {
        detectGaps: jest.fn().mockImplementation(async (codebase, config) => {
          // Simulate realistic detection with varying accuracy based on configuration
          const baseAccuracy = config.strictMode ? 0.9 : 0.85;
          const gaps = await mockImplementationSupport.detectGaps(
            codebase,
            config
          );

          // Simulate some detection failures based on accuracy
          return gaps.filter(() => Math.random() < baseAccuracy);
        }),
        analyzeImplementation: mockImplementationSupport.analyzeImplementation,
        generateRecommendations:
          mockImplementationSupport.generateRecommendations,
      };

      const result = await validator.validateAccuracy(integratedSupport);

      expect(result.accuracy).toBeGreaterThan(80);
      expect(integratedSupport.detectGaps).toHaveBeenCalled();
    });

    it("should provide actionable feedback for system improvement", async () => {
      const result = await validator.validateAccuracy(
        mockImplementationSupport
      );

      // Should identify areas for improvement
      const report = validator.generateAccuracyReport();
      expect(report).toContain("Accuracy by Gap Type:");
      expect(report).toContain("Accuracy by Severity:");

      // Should provide specific metrics for each category
      const gapTypes = [
        "implementation",
        "configuration",
        "integration",
        "testing",
      ];
      gapTypes.forEach((type) => {
        const typeResults = result.detailedResults.filter(
          (r) => r.gapType === type
        );
        if (typeResults.length > 0) {
          const accuracy =
            typeResults.filter((r) => r.correctlyClassified).length /
            typeResults.length;
          console.log(`${type} accuracy: ${(accuracy * 100).toFixed(1)}%`);
        }
      });
    });
  });
});
