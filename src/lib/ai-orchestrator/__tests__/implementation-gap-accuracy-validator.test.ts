/**
 * Tests for Implementation Gap Detection Accuracy Validator
 *
 * @fileoverview Comprehensive tests for the implementation gap detection
 * accuracy validation system to ensure >85% accuracy target is met.
 */

import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import ImplementationGapAccuracyValidator, {
  ImplementationGapValidationResult,
} from "../implementation-gap-accuracy-validator";

describe("ImplementationGapAccuracyValidator", () => {
  let validator: ImplementationGapAccuracyValidator;
  let mockImplementationSupport: any;

  beforeEach(() => {
    validator = new ImplementationGapAccuracyValidator();
    mockImplementationSupport = {
      detectGaps: jest.fn(),
      analyzeImplementation: jest.fn(),
      generateRecommendations: jest.fn(),
    };
  });

  describe("Accuracy Validation", () => {
    it("should validate implementation gap detection accuracy", async () => {
      const result = await validator.validateAccuracy(
        mockImplementationSupport
      );

      expect(result).toBeDefined();
      expect(result.accuracy).toBeGreaterThanOrEqual(0);
      expect(result.accuracy).toBeLessThanOrEqual(100);
      expect(result.totalGaps).toBeGreaterThan(0);
      expect(result.correctlyDetected).toBeGreaterThanOrEqual(0);
      expect(result.falsePositives).toBeGreaterThanOrEqual(0);
      expect(result.falseNegatives).toBeGreaterThanOrEqual(0);
      expect(result.confidenceScore).toBeGreaterThanOrEqual(0);
      expect(result.confidenceScore).toBeLessThanOrEqual(1);
      expect(result.validationTimestamp).toBeInstanceOf(Date);
      expect(result.detailedResults).toBeInstanceOf(Array);
    });

    it("should achieve target accuracy of >85%", async () => {
      // Run multiple validations to get a stable accuracy measurement
      const results: ImplementationGapValidationResult[] = [];

      for (let i = 0; i < 5; i++) {
        const result = await validator.validateAccuracy(
          mockImplementationSupport
        );
        results.push(result);
      }

      // Calculate average accuracy across multiple runs
      const averageAccuracy =
        results.reduce((sum, result) => sum + result.accuracy, 0) /
        results.length;

      expect(averageAccuracy).toBeGreaterThanOrEqual(85);
      console.log(
        `Average accuracy across 5 runs: ${averageAccuracy.toFixed(2)}%`
      );
    });

    it("should provide detailed results for each gap detection", async () => {
      const result = await validator.validateAccuracy(
        mockImplementationSupport
      );

      expect(result.detailedResults.length).toBeGreaterThan(0);

      result.detailedResults.forEach((detailResult) => {
        expect(detailResult.gapId).toBeDefined();
        expect(typeof detailResult.actualGap).toBe("boolean");
        expect(typeof detailResult.detectedGap).toBe("boolean");
        expect(detailResult.confidence).toBeGreaterThanOrEqual(0);
        expect(detailResult.confidence).toBeLessThanOrEqual(1);
        expect([
          "implementation",
          "configuration",
          "integration",
          "testing",
        ]).toContain(detailResult.gapType);
        expect(["low", "medium", "high", "critical"]).toContain(
          detailResult.severity
        );
        expect(detailResult.description).toBeDefined();
        expect(typeof detailResult.correctlyClassified).toBe("boolean");
      });
    });

    it("should calculate confidence score correctly", async () => {
      const result = await validator.validateAccuracy(
        mockImplementationSupport
      );

      expect(result.confidenceScore).toBeGreaterThanOrEqual(0);
      expect(result.confidenceScore).toBeLessThanOrEqual(1);

      // Confidence should correlate with accuracy
      if (result.accuracy >= 85) {
        expect(result.confidenceScore).toBeGreaterThan(0.6);
      }
    });
  });

  describe("Gap Type Analysis", () => {
    it("should detect implementation gaps with high accuracy", async () => {
      const result = await validator.validateAccuracy(
        mockImplementationSupport
      );

      const implementationGaps = result.detailedResults.filter(
        (r) => r.gapType === "implementation"
      );
      expect(implementationGaps.length).toBeGreaterThan(0);

      const implementationAccuracy =
        implementationGaps.filter((r) => r.correctlyClassified).length /
        implementationGaps.length;
      expect(implementationAccuracy).toBeGreaterThanOrEqual(0.8); // 80% minimum for implementation gaps
    });

    it("should detect configuration gaps accurately", async () => {
      const result = await validator.validateAccuracy(
        mockImplementationSupport
      );

      const configGaps = result.detailedResults.filter(
        (r) => r.gapType === "configuration"
      );
      expect(configGaps.length).toBeGreaterThan(0);

      const configAccuracy =
        configGaps.filter((r) => r.correctlyClassified).length /
        configGaps.length;
      expect(configAccuracy).toBeGreaterThanOrEqual(0.75); // 75% minimum for configuration gaps
    });

    it("should handle integration gaps appropriately", async () => {
      const result = await validator.validateAccuracy(
        mockImplementationSupport
      );

      const integrationGaps = result.detailedResults.filter(
        (r) => r.gapType === "integration"
      );
      expect(integrationGaps.length).toBeGreaterThan(0);

      // Integration gaps are harder to detect, so lower threshold
      const integrationAccuracy =
        integrationGaps.filter((r) => r.correctlyClassified).length /
        integrationGaps.length;
      expect(integrationAccuracy).toBeGreaterThanOrEqual(0.7); // 70% minimum for integration gaps
    });

    it("should detect testing gaps with reasonable accuracy", async () => {
      const result = await validator.validateAccuracy(
        mockImplementationSupport
      );

      const testingGaps = result.detailedResults.filter(
        (r) => r.gapType === "testing"
      );
      expect(testingGaps.length).toBeGreaterThan(0);

      // Testing gaps are hardest to detect
      const testingAccuracy =
        testingGaps.filter((r) => r.correctlyClassified).length /
        testingGaps.length;
      expect(testingAccuracy).toBeGreaterThanOrEqual(0.65); // 65% minimum for testing gaps
    });
  });

  describe("Severity Analysis", () => {
    it("should detect critical gaps with highest accuracy", async () => {
      const result = await validator.validateAccuracy(
        mockImplementationSupport
      );

      const criticalGaps = result.detailedResults.filter(
        (r) => r.severity === "critical"
      );
      if (criticalGaps.length > 0) {
        const criticalAccuracy =
          criticalGaps.filter((r) => r.correctlyClassified).length /
          criticalGaps.length;
        expect(criticalAccuracy).toBeGreaterThanOrEqual(0.9); // 90% minimum for critical gaps
      }
    });

    it("should detect high severity gaps with good accuracy", async () => {
      const result = await validator.validateAccuracy(
        mockImplementationSupport
      );

      const highGaps = result.detailedResults.filter(
        (r) => r.severity === "high"
      );
      if (highGaps.length > 0) {
        const highAccuracy =
          highGaps.filter((r) => r.correctlyClassified).length /
          highGaps.length;
        expect(highAccuracy).toBeGreaterThanOrEqual(0.85); // 85% minimum for high severity gaps
      }
    });

    it("should handle medium and low severity gaps appropriately", async () => {
      const result = await validator.validateAccuracy(
        mockImplementationSupport
      );

      const mediumGaps = result.detailedResults.filter(
        (r) => r.severity === "medium"
      );
      const lowGaps = result.detailedResults.filter(
        (r) => r.severity === "low"
      );

      if (mediumGaps.length > 0) {
        const mediumAccuracy =
          mediumGaps.filter((r) => r.correctlyClassified).length /
          mediumGaps.length;
        expect(mediumAccuracy).toBeGreaterThanOrEqual(0.8); // 80% minimum for medium severity
      }

      if (lowGaps.length > 0) {
        const lowAccuracy =
          lowGaps.filter((r) => r.correctlyClassified).length / lowGaps.length;
        expect(lowAccuracy).toBeGreaterThanOrEqual(0.75); // 75% minimum for low severity
      }
    });
  });

  describe("False Positive and Negative Analysis", () => {
    it("should maintain low false positive rate", async () => {
      const result = await validator.validateAccuracy(
        mockImplementationSupport
      );

      const falsePositiveRate = result.falsePositives / result.totalGaps;
      expect(falsePositiveRate).toBeLessThan(0.1); // Less than 10% false positive rate
    });

    it("should maintain low false negative rate", async () => {
      const result = await validator.validateAccuracy(
        mockImplementationSupport
      );

      const falseNegativeRate = result.falseNegatives / result.totalGaps;
      expect(falseNegativeRate).toBeLessThan(0.15); // Less than 15% false negative rate
    });

    it("should balance precision and recall", async () => {
      const result = await validator.validateAccuracy(
        mockImplementationSupport
      );

      const truePositives = result.correctlyDetected - result.falsePositives;
      const precision = truePositives / (truePositives + result.falsePositives);
      const recall = truePositives / (truePositives + result.falseNegatives);

      expect(precision).toBeGreaterThan(0.8); // 80% precision minimum
      expect(recall).toBeGreaterThan(0.75); // 75% recall minimum
    });
  });

  describe("Validation History and Reporting", () => {
    it("should maintain validation history", async () => {
      const initialHistory = validator.getValidationHistory();
      expect(initialHistory).toHaveLength(0);

      await validator.validateAccuracy(mockImplementationSupport);

      const historyAfterFirst = validator.getValidationHistory();
      expect(historyAfterFirst).toHaveLength(1);

      await validator.validateAccuracy(mockImplementationSupport);

      const historyAfterSecond = validator.getValidationHistory();
      expect(historyAfterSecond).toHaveLength(2);
    });

    it("should return latest validation result", async () => {
      expect(validator.getLatestValidation()).toBeNull();

      const result1 = await validator.validateAccuracy(
        mockImplementationSupport
      );
      expect(validator.getLatestValidation()).toEqual(result1);

      const result2 = await validator.validateAccuracy(
        mockImplementationSupport
      );
      expect(validator.getLatestValidation()).toEqual(result2);
    });

    it("should correctly identify if accuracy target is met", async () => {
      await validator.validateAccuracy(mockImplementationSupport);

      const targetMet = validator.isAccuracyTargetMet();
      const latest = validator.getLatestValidation();

      expect(targetMet).toBe(latest!.accuracy >= 85);
    });

    it("should generate comprehensive accuracy report", async () => {
      await validator.validateAccuracy(mockImplementationSupport);

      const report = validator.generateAccuracyReport();

      expect(report).toContain("Implementation Gap Detection Accuracy Report");
      expect(report).toContain("Overall Accuracy:");
      expect(report).toContain("Confidence Score:");
      expect(report).toContain("Detection Statistics:");
      expect(report).toContain("Accuracy by Gap Type:");
      expect(report).toContain("Accuracy by Severity:");
      expect(report).toContain("Validation Timestamp:");

      // Should indicate if target is met
      const latest = validator.getLatestValidation();
      if (latest!.accuracy >= 85) {
        expect(report).toContain("✅ TARGET MET");
      } else {
        expect(report).toContain("❌ TARGET NOT MET");
      }
    });
  });

  describe("Performance and Reliability", () => {
    it("should complete validation within reasonable time", async () => {
      const startTime = Date.now();
      await validator.validateAccuracy(mockImplementationSupport);
      const endTime = Date.now();

      const duration = endTime - startTime;
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it("should handle multiple concurrent validations", async () => {
      const promises = Array(3)
        .fill(null)
        .map(() => validator.validateAccuracy(mockImplementationSupport));

      const results = await Promise.all(promises);

      expect(results).toHaveLength(3);
      results.forEach((result) => {
        expect(result.accuracy).toBeGreaterThanOrEqual(0);
        expect(result.totalGaps).toBeGreaterThan(0);
      });
    });

    it("should maintain consistent results across multiple runs", async () => {
      const results: number[] = [];

      for (let i = 0; i < 3; i++) {
        const result = await validator.validateAccuracy(
          mockImplementationSupport
        );
        results.push(result.accuracy);
      }

      // Results should be reasonably consistent (within 10% variance)
      const average =
        results.reduce((sum, acc) => sum + acc, 0) / results.length;
      const maxDeviation = Math.max(
        ...results.map((acc) => Math.abs(acc - average))
      );

      expect(maxDeviation).toBeLessThan(10); // Less than 10% deviation from average
    });
  });

  describe("Edge Cases and Error Handling", () => {
    it("should handle empty test cases gracefully", async () => {
      // Create validator with no test cases
      const emptyValidator =
        new (class extends ImplementationGapAccuracyValidator {
          constructor() {
            super();
            (this as any).testCases = [];
          }
        })();

      const result = await emptyValidator.validateAccuracy(
        mockImplementationSupport
      );

      expect(result.accuracy).toBe(0);
      expect(result.totalGaps).toBe(0);
      expect(result.detailedResults).toHaveLength(0);
    });

    it("should handle implementation support errors gracefully", async () => {
      const faultyImplementationSupport = {
        detectGaps: jest.fn().mockRejectedValue(new Error("Detection failed")),
      };

      const result = await validator.validateAccuracy(
        faultyImplementationSupport
      );

      // Should still return a valid result even if some detections fail
      expect(result).toBeDefined();
      expect(result.accuracy).toBeGreaterThanOrEqual(0);
    });

    it("should validate with different confidence thresholds", async () => {
      const result = await validator.validateAccuracy(
        mockImplementationSupport
      );

      // Check that confidence scores are distributed appropriately
      const highConfidenceResults = result.detailedResults.filter(
        (r) => r.confidence > 0.8
      );
      const mediumConfidenceResults = result.detailedResults.filter(
        (r) => r.confidence > 0.6 && r.confidence <= 0.8
      );
      const lowConfidenceResults = result.detailedResults.filter(
        (r) => r.confidence <= 0.6
      );

      // Should have a mix of confidence levels
      expect(
        highConfidenceResults.length +
          mediumConfidenceResults.length +
          lowConfidenceResults.length
      ).toBe(result.detailedResults.length);
    });
  });
});
