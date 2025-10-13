/**
 * Basic tests for Drift Monitor to verify core functionality
 */

import { DriftMonitor } from "../drift-monitor";

describe("DriftMonitor Basic Tests", () => {
  describe("static utility methods", () => {
    describe("calculatePromptDriftScore", () => {
      it("should calculate drift score based on distribution changes", () => {
        const current = {
          mean: 0.8,
          std: 0.2,
          p50: 0.79,
          p95: 0.98,
          p99: 0.99,
        };

        const baseline = {
          mean: 0.75,
          std: 0.15,
          p50: 0.74,
          p95: 0.95,
          p99: 0.98,
        };

        const driftScore = DriftMonitor.calculatePromptDriftScore(
          current,
          baseline
        );
        expect(driftScore).toBeGreaterThan(0);
        expect(driftScore).toBeLessThan(1);
      });

      it("should return 0 for identical distributions", () => {
        const distribution = {
          mean: 0.75,
          std: 0.15,
          p50: 0.74,
          p95: 0.95,
          p99: 0.98,
        };

        const driftScore = DriftMonitor.calculatePromptDriftScore(
          distribution,
          distribution
        );
        expect(driftScore).toBe(0);
      });
    });

    describe("calculateRegressionScore", () => {
      it("should calculate regression for metrics where higher is better", () => {
        const score = DriftMonitor.calculateRegressionScore(0.8, 0.9, true);
        expect(score).toBeCloseTo(0.111, 3); // (0.9 - 0.8) / 0.9
      });

      it("should calculate regression for metrics where lower is better", () => {
        const score = DriftMonitor.calculateRegressionScore(0.2, 0.1, false);
        expect(score).toBeCloseTo(1.0, 3); // (0.2 - 0.1) / 0.1
      });

      it("should return 0 for zero baseline", () => {
        const score = DriftMonitor.calculateRegressionScore(0.5, 0, true);
        expect(score).toBe(0);
      });

      it("should return 0 for improvements", () => {
        const score = DriftMonitor.calculateRegressionScore(0.95, 0.9, true);
        expect(score).toBe(0); // No regression, it's an improvement
      });
    });
  });

  describe("constructor", () => {
    it("should initialize with default thresholds", () => {
      const monitor = new DriftMonitor();
      expect(monitor).toBeInstanceOf(DriftMonitor);
    });

    it("should accept custom thresholds", () => {
      const customThresholds = {
        dataDrift: {
          warning: 0.2,
          critical: 0.4,
        },
      };

      const monitor = new DriftMonitor(undefined, undefined, customThresholds);
      expect(monitor).toBeInstanceOf(DriftMonitor);
    });
  });
});
