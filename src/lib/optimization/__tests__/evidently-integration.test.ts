/**
 * Tests for CloudWatch Evidently Integration
 */

import {
  BatchEvaluateFeatureCommand,
  CreateExperimentCommand,
  CreateFeatureCommand,
  CreateProjectCommand,
  EvaluateFeatureCommand,
  PutProjectEventsCommand,
  StartExperimentCommand,
  StopExperimentCommand,
} from "@aws-sdk/client-evidently";
import {
  EvidentlyOptimizationService,
  OPTIMIZATION_EXPERIMENTS,
  OPTIMIZATION_FEATURES,
} from "../evidently-integration";

// Mock AWS SDK
const mockSend = jest.fn();
jest.mock("@aws-sdk/client-evidently", () => ({
  CloudWatchEvidentlyClient: jest.fn().mockImplementation(() => ({
    send: mockSend,
  })),
  CreateProjectCommand: jest.fn(),
  CreateFeatureCommand: jest.fn(),
  CreateExperimentCommand: jest.fn(),
  EvaluateFeatureCommand: jest.fn(),
  PutProjectEventsCommand: jest.fn(),
  BatchEvaluateFeatureCommand: jest.fn(),
  StartExperimentCommand: jest.fn(),
  StopExperimentCommand: jest.fn(),
  ListFeaturesCommand: jest.fn(),
  ListExperimentsCommand: jest.fn(),
}));

describe("EvidentlyOptimizationService", () => {
  let service: EvidentlyOptimizationService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new EvidentlyOptimizationService("test-project", "us-east-1");
  });

  describe("Project Initialization", () => {
    it("should initialize project successfully", async () => {
      mockSend.mockResolvedValueOnce({});

      await service.initializeProject();

      expect(mockSend).toHaveBeenCalledWith(expect.any(CreateProjectCommand));
    });

    it("should handle existing project gracefully", async () => {
      const error = new Error("Resource already exists");
      error.name = "ResourceAlreadyExistsException";
      mockSend.mockRejectedValueOnce(error);

      await expect(service.initializeProject()).resolves.not.toThrow();
    });

    it("should throw on other initialization errors", async () => {
      const error = new Error("Access denied");
      mockSend.mockRejectedValueOnce(error);

      await expect(service.initializeProject()).rejects.toThrow(
        "Access denied"
      );
    });
  });

  describe("Feature Flag Management", () => {
    it("should create optimization feature successfully", async () => {
      mockSend.mockResolvedValueOnce({});

      const feature = OPTIMIZATION_FEATURES.BUNDLE_OPTIMIZATION;
      await service.createOptimizationFeature(feature);

      expect(mockSend).toHaveBeenCalledWith(expect.any(CreateFeatureCommand));

      expect(mockSend).toHaveBeenCalledWith(expect.any(CreateFeatureCommand));
    });

    it("should evaluate feature flag with user context", async () => {
      mockSend.mockResolvedValueOnce({
        variation: "advanced",
        value: { stringValue: "advanced" },
      });

      const userContext = {
        userId: "user123",
        sessionId: "session456",
        userAgent: "Mozilla/5.0...",
        customAttributes: { page: "home" },
      };

      const result = await service.evaluateFeature(
        "bundle-optimization",
        userContext,
        false
      );

      expect(mockSend).toHaveBeenCalledWith(expect.any(EvaluateFeatureCommand));
      expect(result).toBe("advanced");
    });

    it("should return default value on evaluation error", async () => {
      mockSend.mockRejectedValueOnce(new Error("Network error"));

      const userContext = { userId: "user123" };
      const result = await service.evaluateFeature(
        "bundle-optimization",
        userContext,
        "default"
      );

      expect(result).toBe("default");
    });

    it("should evaluate multiple features at once", async () => {
      mockSend.mockResolvedValueOnce({
        results: [
          { variation: "advanced", value: { stringValue: "advanced" } },
          { variation: "redis", value: { stringValue: "redis" } },
        ],
      });

      const userContext = { userId: "user123" };
      const features = ["bundle-optimization", "caching-strategy"];

      const results = await service.evaluateMultipleFeatures(
        features,
        userContext
      );

      expect(mockSend).toHaveBeenCalledWith(
        expect.any(BatchEvaluateFeatureCommand)
      );
      expect(results).toEqual({
        "bundle-optimization": "advanced",
        "caching-strategy": "redis",
      });
    });
  });

  describe("Experiment Management", () => {
    it("should create optimization experiment successfully", async () => {
      mockSend.mockResolvedValueOnce({});

      const experiment = OPTIMIZATION_EXPERIMENTS.BUNDLE_SIZE_OPTIMIZATION;
      await service.createOptimizationExperiment(experiment);

      expect(mockSend).toHaveBeenCalledWith(
        expect.any(CreateExperimentCommand)
      );

      expect(mockSend).toHaveBeenCalledWith(
        expect.any(CreateExperimentCommand)
      );
    });

    it("should start experiment successfully", async () => {
      mockSend.mockResolvedValueOnce({});

      await service.startExperiment("bundle-size-optimization");

      expect(mockSend).toHaveBeenCalledWith(expect.any(StartExperimentCommand));
    });

    it("should stop experiment with reason", async () => {
      mockSend.mockResolvedValueOnce({});

      await service.stopExperiment(
        "bundle-size-optimization",
        "Completed successfully"
      );

      expect(mockSend).toHaveBeenCalledWith(expect.any(StopExperimentCommand));

      expect(mockSend).toHaveBeenCalledWith(expect.any(StopExperimentCommand));
    });
  });

  describe("Metrics Recording", () => {
    it("should record custom metric successfully", async () => {
      mockSend.mockResolvedValueOnce({});

      const userContext = { userId: "user123", sessionId: "session456" };
      await service.recordMetric(
        "loadTime",
        1.5,
        userContext,
        "bundle-optimization"
      );

      expect(mockSend).toHaveBeenCalledWith(
        expect.any(PutProjectEventsCommand)
      );

      expect(mockSend).toHaveBeenCalledWith(
        expect.any(PutProjectEventsCommand)
      );
    });

    it("should record performance metrics batch", async () => {
      mockSend.mockResolvedValue({});

      const userContext = { userId: "user123" };
      const metrics = {
        loadTime: 1.2,
        renderTime: 0.8,
        bundleSize: 450,
        cacheHitRate: 92.5,
      };

      await service.recordPerformanceMetrics(
        metrics,
        userContext,
        "performance-test"
      );

      expect(mockSend).toHaveBeenCalledTimes(4); // One call per metric
    });

    it("should handle metric recording errors gracefully", async () => {
      mockSend.mockRejectedValueOnce(new Error("Network error"));

      const userContext = { userId: "user123" };

      // Should not throw
      await expect(
        service.recordMetric("loadTime", 1.5, userContext)
      ).resolves.not.toThrow();
    });
  });

  describe("Value Serialization", () => {
    it("should serialize boolean values correctly", () => {
      const service = new EvidentlyOptimizationService();
      const serialized = (service as any).serializeValue(true);
      expect(serialized).toEqual({ boolValue: true });
    });

    it("should serialize integer values correctly", () => {
      const service = new EvidentlyOptimizationService();
      const serialized = (service as any).serializeValue(42);
      expect(serialized).toEqual({ longValue: 42 });
    });

    it("should serialize float values correctly", () => {
      const service = new EvidentlyOptimizationService();
      const serialized = (service as any).serializeValue(3.14);
      expect(serialized).toEqual({ doubleValue: 3.14 });
    });

    it("should serialize string values correctly", () => {
      const service = new EvidentlyOptimizationService();
      const serialized = (service as any).serializeValue("test");
      expect(serialized).toEqual({ stringValue: "test" });
    });
  });

  describe("Value Deserialization", () => {
    it("should deserialize boolean values correctly", () => {
      const service = new EvidentlyOptimizationService();
      const deserialized = (service as any).deserializeValue("enabled", {
        boolValue: true,
      });
      expect(deserialized).toBe(true);
    });

    it("should deserialize integer values correctly", () => {
      const service = new EvidentlyOptimizationService();
      const deserialized = (service as any).deserializeValue("count", {
        longValue: 42,
      });
      expect(deserialized).toBe(42);
    });

    it("should deserialize float values correctly", () => {
      const service = new EvidentlyOptimizationService();
      const deserialized = (service as any).deserializeValue("rate", {
        doubleValue: 3.14,
      });
      expect(deserialized).toBe(3.14);
    });

    it("should deserialize string values correctly", () => {
      const service = new EvidentlyOptimizationService();
      const deserialized = (service as any).deserializeValue("mode", {
        stringValue: "advanced",
      });
      expect(deserialized).toBe("advanced");
    });

    it("should return null for empty values", () => {
      const service = new EvidentlyOptimizationService();
      const deserialized = (service as any).deserializeValue("empty", {});
      expect(deserialized).toBeNull();
    });
  });

  describe("Health Check", () => {
    it("should return healthy status when all services work", async () => {
      mockSend
        .mockResolvedValueOnce({
          features: [{ name: "feature1" }, { name: "feature2" }],
        }) // listFeatures
        .mockResolvedValueOnce({ experiments: [{ name: "exp1" }] }); // listActiveExperiments

      const health = await service.healthCheck();

      expect(health).toEqual({
        connected: true,
        projectExists: true,
        featuresCount: 2,
        experimentsCount: 1,
      });
    });

    it("should return unhealthy status on service errors", async () => {
      mockSend.mockRejectedValue(new Error("Service unavailable"));

      const health = await service.healthCheck();

      expect(health).toEqual({
        connected: false,
        projectExists: false,
        featuresCount: 0,
        experimentsCount: 0,
      });
    });
  });

  describe("Predefined Configurations", () => {
    it("should have valid bundle optimization feature configuration", () => {
      const feature = OPTIMIZATION_FEATURES.BUNDLE_OPTIMIZATION;

      expect(feature.name).toBe("bundle-optimization");
      expect(feature.variations).toHaveLength(3);
      expect(feature.defaultVariation).toBe("disabled");
      expect(feature.variations.map((v) => v.name)).toContain("disabled");
      expect(feature.variations.map((v) => v.name)).toContain("basic");
      expect(feature.variations.map((v) => v.name)).toContain("advanced");
    });

    it("should have valid caching strategy feature configuration", () => {
      const feature = OPTIMIZATION_FEATURES.CACHING_STRATEGY;

      expect(feature.name).toBe("caching-strategy");
      expect(feature.variations).toHaveLength(4);
      expect(feature.defaultVariation).toBe("memory");
      expect(feature.variations.map((v) => v.name)).toContain("none");
      expect(feature.variations.map((v) => v.name)).toContain("memory");
      expect(feature.variations.map((v) => v.name)).toContain("redis");
      expect(feature.variations.map((v) => v.name)).toContain("hybrid");
    });

    it("should have valid bundle size optimization experiment", () => {
      const experiment = OPTIMIZATION_EXPERIMENTS.BUNDLE_SIZE_OPTIMIZATION;

      expect(experiment.name).toBe("bundle-size-optimization");
      expect(experiment.treatments).toHaveLength(2);
      expect(experiment.metricGoals).toHaveLength(2);
      expect(experiment.trafficAllocation).toBe(20);
      expect(experiment.duration).toBe(14);

      const treatmentWeights = experiment.treatments.reduce(
        (sum, t) => sum + t.weight,
        0
      );
      expect(treatmentWeights).toBe(100);
    });

    it("should have valid caching performance experiment", () => {
      const experiment = OPTIMIZATION_EXPERIMENTS.CACHING_PERFORMANCE;

      expect(experiment.name).toBe("caching-performance-test");
      expect(experiment.treatments).toHaveLength(3);
      expect(experiment.metricGoals).toHaveLength(2);
      expect(experiment.trafficAllocation).toBe(30);
      expect(experiment.duration).toBe(21);

      const treatmentWeights = experiment.treatments.reduce(
        (sum, t) => sum + t.weight,
        0
      );
      expect(treatmentWeights).toBe(100);
    });
  });
});
