/**
 * Support Operations Cache Tests
 *
 * Comprehensive test suite for the support operations caching layer
 */

import { beforeEach, describe, expect, it } from "@jest/globals";
import type {
  ComplianceValidationResult,
  CostAnalysis,
  ExecutionMetadata,
  ImplementationGap,
  InfrastructureAuditResult,
  SecurityAuditResult,
} from "../bedrock-support-manager";
import {
  SUPPORT_CACHE_CONFIGS,
  SupportOperationsCache,
  createSupportOperationsCache,
  type SupportCacheConfig,
} from "../support-operations-cache";

describe("SupportOperationsCache", () => {
  let cache: SupportOperationsCache;

  beforeEach(() => {
    cache = new SupportOperationsCache();
  });

  describe("Infrastructure Audit Caching", () => {
    it("should cache and retrieve infrastructure audit results", async () => {
      const auditResult: InfrastructureAuditResult = {
        timestamp: new Date(),
        overallHealth: "healthy",
        detectedIssues: [],
        implementationGaps: [],
        recommendations: [],
        complianceStatus: {
          gdprCompliant: true,
          dataResidencyCompliant: true,
          auditTrailComplete: true,
          issues: [],
        },
      };

      // Cache the result
      await cache.setInfrastructureAudit(auditResult);

      // Retrieve from cache
      const cached = await cache.getInfrastructureAudit();

      expect(cached).toBeDefined();
      expect(cached?.overallHealth).toBe("healthy");
      expect(cached?.detectedIssues).toHaveLength(0);
    });

    it("should return null for cache miss", async () => {
      const cached = await cache.getInfrastructureAudit({ context: "test" });
      expect(cached).toBeNull();
    });

    it("should cache different contexts separately", async () => {
      const result1: InfrastructureAuditResult = {
        timestamp: new Date(),
        overallHealth: "healthy",
        detectedIssues: [],
        implementationGaps: [],
        recommendations: [],
        complianceStatus: {
          gdprCompliant: true,
          dataResidencyCompliant: true,
          auditTrailComplete: true,
          issues: [],
        },
      };

      const result2: InfrastructureAuditResult = {
        ...result1,
        overallHealth: "warning",
      };

      await cache.setInfrastructureAudit(result1, { env: "dev" });
      await cache.setInfrastructureAudit(result2, { env: "prod" });

      const cached1 = await cache.getInfrastructureAudit({ env: "dev" });
      const cached2 = await cache.getInfrastructureAudit({ env: "prod" });

      expect(cached1?.overallHealth).toBe("healthy");
      expect(cached2?.overallHealth).toBe("warning");
    });
  });

  describe("Meta-Monitoring Caching", () => {
    it("should cache and retrieve meta-monitoring data", async () => {
      const executionData: ExecutionMetadata = {
        executionId: "exec-123",
        timestamp: new Date(),
        operation: "test-operation",
        duration: 1000,
        success: true,
        performanceMetrics: {
          responseTime: 500,
          memoryUsage: 100,
          cpuUsage: 50,
          networkLatency: 10,
        },
      };

      await cache.setMetaMonitoring(executionData, "exec-123");

      const cached = await cache.getMetaMonitoring("exec-123");

      expect(cached).toBeDefined();
      expect(cached?.executionId).toBe("exec-123");
      expect(cached?.success).toBe(true);
    });

    it("should handle different execution IDs", async () => {
      const data1: ExecutionMetadata = {
        executionId: "exec-1",
        timestamp: new Date(),
        operation: "op1",
        duration: 100,
        success: true,
        performanceMetrics: {
          responseTime: 50,
          memoryUsage: 10,
          cpuUsage: 5,
          networkLatency: 1,
        },
      };

      const data2: ExecutionMetadata = {
        ...data1,
        executionId: "exec-2",
        operation: "op2",
      };

      await cache.setMetaMonitoring(data1, "exec-1");
      await cache.setMetaMonitoring(data2, "exec-2");

      const cached1 = await cache.getMetaMonitoring("exec-1");
      const cached2 = await cache.getMetaMonitoring("exec-2");

      expect(cached1?.operation).toBe("op1");
      expect(cached2?.operation).toBe("op2");
    });
  });

  describe("Implementation Gaps Caching", () => {
    it("should cache and retrieve implementation gaps", async () => {
      const gaps: ImplementationGap[] = [
        {
          id: "gap-1",
          module: "auth",
          description: "Missing OAuth implementation",
          priority: "high",
          estimatedEffort: "2 days",
          dependencies: [],
        },
      ];

      await cache.setImplementationGaps(gaps, "auth");

      const cached = await cache.getImplementationGaps("auth");

      expect(cached).toBeDefined();
      expect(cached).toHaveLength(1);
      expect(cached?.[0].module).toBe("auth");
    });

    it("should cache gaps for different modules", async () => {
      const authGaps: ImplementationGap[] = [
        {
          id: "gap-1",
          module: "auth",
          description: "Auth gap",
          priority: "high",
          estimatedEffort: "1 day",
          dependencies: [],
        },
      ];

      const paymentGaps: ImplementationGap[] = [
        {
          id: "gap-2",
          module: "payment",
          description: "Payment gap",
          priority: "medium",
          estimatedEffort: "3 days",
          dependencies: [],
        },
      ];

      await cache.setImplementationGaps(authGaps, "auth");
      await cache.setImplementationGaps(paymentGaps, "payment");

      const cachedAuth = await cache.getImplementationGaps("auth");
      const cachedPayment = await cache.getImplementationGaps("payment");

      expect(cachedAuth?.[0].module).toBe("auth");
      expect(cachedPayment?.[0].module).toBe("payment");
    });
  });

  describe("Compliance Validation Caching", () => {
    it("should cache and retrieve compliance validation results", async () => {
      const result: ComplianceValidationResult = {
        isCompliant: true,
        violations: [],
        recommendations: [],
        lastChecked: new Date(),
      };

      await cache.setComplianceValidation(result, "gdpr");

      const cached = await cache.getComplianceValidation("gdpr");

      expect(cached).toBeDefined();
      expect(cached?.isCompliant).toBe(true);
      expect(cached?.violations).toHaveLength(0);
    });

    it("should handle different compliance scopes", async () => {
      const gdprResult: ComplianceValidationResult = {
        isCompliant: true,
        violations: [],
        recommendations: [],
        lastChecked: new Date(),
      };

      const hipaaResult: ComplianceValidationResult = {
        isCompliant: false,
        violations: ["Missing encryption"],
        recommendations: ["Enable encryption"],
        lastChecked: new Date(),
      };

      await cache.setComplianceValidation(gdprResult, "gdpr");
      await cache.setComplianceValidation(hipaaResult, "hipaa");

      const cachedGdpr = await cache.getComplianceValidation("gdpr");
      const cachedHipaa = await cache.getComplianceValidation("hipaa");

      expect(cachedGdpr?.isCompliant).toBe(true);
      expect(cachedHipaa?.isCompliant).toBe(false);
    });
  });

  describe("Security Audit Caching", () => {
    it("should cache and retrieve security audit results", async () => {
      const result: SecurityAuditResult = {
        securityScore: 85,
        vulnerabilities: [],
        recommendations: [],
        lastAudit: new Date(),
      };

      await cache.setSecurityAudit(result, "api");

      const cached = await cache.getSecurityAudit("api");

      expect(cached).toBeDefined();
      expect(cached?.securityScore).toBe(85);
      expect(cached?.vulnerabilities).toHaveLength(0);
    });

    it("should cache audits for different components", async () => {
      const apiResult: SecurityAuditResult = {
        securityScore: 90,
        vulnerabilities: [],
        recommendations: [],
        lastAudit: new Date(),
      };

      const dbResult: SecurityAuditResult = {
        securityScore: 75,
        vulnerabilities: [
          {
            id: "vuln-1",
            severity: "medium",
            description: "Weak password policy",
            component: "database",
            remediation: "Strengthen password requirements",
          },
        ],
        recommendations: ["Update password policy"],
        lastAudit: new Date(),
      };

      await cache.setSecurityAudit(apiResult, "api");
      await cache.setSecurityAudit(dbResult, "database");

      const cachedApi = await cache.getSecurityAudit("api");
      const cachedDb = await cache.getSecurityAudit("database");

      expect(cachedApi?.securityScore).toBe(90);
      expect(cachedDb?.securityScore).toBe(75);
    });
  });

  describe("Cost Analysis Caching", () => {
    it("should cache and retrieve cost analysis", async () => {
      const analysis: CostAnalysis = {
        currentSpend: 100,
        projectedSpend: 150,
        budgetUtilization: 0.67,
        costBreakdown: {
          compute: 60,
          storage: 30,
          network: 10,
        },
        recommendations: ["Optimize storage usage"],
      };

      await cache.setCostAnalysis(analysis, "monthly");

      const cached = await cache.getCostAnalysis("monthly");

      expect(cached).toBeDefined();
      expect(cached?.currentSpend).toBe(100);
      expect(cached?.budgetUtilization).toBe(0.67);
    });

    it("should cache analysis for different time ranges", async () => {
      const dailyAnalysis: CostAnalysis = {
        currentSpend: 10,
        projectedSpend: 15,
        budgetUtilization: 0.5,
        costBreakdown: { compute: 6, storage: 3, network: 1 },
        recommendations: [],
      };

      const monthlyAnalysis: CostAnalysis = {
        currentSpend: 300,
        projectedSpend: 450,
        budgetUtilization: 0.75,
        costBreakdown: { compute: 180, storage: 90, network: 30 },
        recommendations: ["Review compute usage"],
      };

      await cache.setCostAnalysis(dailyAnalysis, "daily");
      await cache.setCostAnalysis(monthlyAnalysis, "monthly");

      const cachedDaily = await cache.getCostAnalysis("daily");
      const cachedMonthly = await cache.getCostAnalysis("monthly");

      expect(cachedDaily?.currentSpend).toBe(10);
      expect(cachedMonthly?.currentSpend).toBe(300);
    });
  });

  describe("Cache Statistics", () => {
    it("should track cache hits and misses", async () => {
      const result: InfrastructureAuditResult = {
        timestamp: new Date(),
        overallHealth: "healthy",
        detectedIssues: [],
        implementationGaps: [],
        recommendations: [],
        complianceStatus: {
          gdprCompliant: true,
          dataResidencyCompliant: true,
          auditTrailComplete: true,
          issues: [],
        },
      };

      // Miss
      await cache.getInfrastructureAudit();

      // Set
      await cache.setInfrastructureAudit(result);

      // Hit
      await cache.getInfrastructureAudit();

      const stats = cache.getStats();

      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(1);
      expect(stats.totalRequests).toBe(2);
      expect(stats.hitRate).toBe(0.5);
    });

    it("should track operation-specific statistics", async () => {
      const auditResult: InfrastructureAuditResult = {
        timestamp: new Date(),
        overallHealth: "healthy",
        detectedIssues: [],
        implementationGaps: [],
        recommendations: [],
        complianceStatus: {
          gdprCompliant: true,
          dataResidencyCompliant: true,
          auditTrailComplete: true,
          issues: [],
        },
      };

      await cache.setInfrastructureAudit(auditResult);
      await cache.getInfrastructureAudit(); // Hit
      await cache.getInfrastructureAudit(); // Hit

      const opStats = cache.getOperationStats("infrastructureAudit");

      expect(opStats.hits).toBe(2);
      expect(opStats.misses).toBe(0);
      expect(opStats.hitRate).toBe(1.0);
    });

    it("should update cache size correctly", async () => {
      const result: InfrastructureAuditResult = {
        timestamp: new Date(),
        overallHealth: "healthy",
        detectedIssues: [],
        implementationGaps: [],
        recommendations: [],
        complianceStatus: {
          gdprCompliant: true,
          dataResidencyCompliant: true,
          auditTrailComplete: true,
          issues: [],
        },
      };

      const initialStats = cache.getStats();
      expect(initialStats.cacheSize).toBe(0);

      await cache.setInfrastructureAudit(result);

      const updatedStats = cache.getStats();
      expect(updatedStats.cacheSize).toBe(1);
    });
  });

  describe("Cache Invalidation", () => {
    it("should invalidate specific operation type", async () => {
      const result: InfrastructureAuditResult = {
        timestamp: new Date(),
        overallHealth: "healthy",
        detectedIssues: [],
        implementationGaps: [],
        recommendations: [],
        complianceStatus: {
          gdprCompliant: true,
          dataResidencyCompliant: true,
          auditTrailComplete: true,
          issues: [],
        },
      };

      await cache.setInfrastructureAudit(result);

      let cached = await cache.getInfrastructureAudit();
      expect(cached).toBeDefined();

      await cache.invalidate("infrastructureAudit");

      cached = await cache.getInfrastructureAudit();
      expect(cached).toBeNull();
    });

    it("should invalidate all cache entries", async () => {
      const auditResult: InfrastructureAuditResult = {
        timestamp: new Date(),
        overallHealth: "healthy",
        detectedIssues: [],
        implementationGaps: [],
        recommendations: [],
        complianceStatus: {
          gdprCompliant: true,
          dataResidencyCompliant: true,
          auditTrailComplete: true,
          issues: [],
        },
      };

      const complianceResult: ComplianceValidationResult = {
        isCompliant: true,
        violations: [],
        recommendations: [],
        lastChecked: new Date(),
      };

      await cache.setInfrastructureAudit(auditResult);
      await cache.setComplianceValidation(complianceResult);

      const statsBefore = cache.getStats();
      expect(statsBefore.cacheSize).toBe(2);

      await cache.invalidateAll();

      const statsAfter = cache.getStats();
      expect(statsAfter.cacheSize).toBe(0);

      const cachedAudit = await cache.getInfrastructureAudit();
      const cachedCompliance = await cache.getComplianceValidation();

      expect(cachedAudit).toBeNull();
      expect(cachedCompliance).toBeNull();
    });

    it("should invalidate specific context", async () => {
      const result1: InfrastructureAuditResult = {
        timestamp: new Date(),
        overallHealth: "healthy",
        detectedIssues: [],
        implementationGaps: [],
        recommendations: [],
        complianceStatus: {
          gdprCompliant: true,
          dataResidencyCompliant: true,
          auditTrailComplete: true,
          issues: [],
        },
      };

      const result2: InfrastructureAuditResult = {
        ...result1,
        overallHealth: "warning",
      };

      await cache.setInfrastructureAudit(result1, { env: "dev" });
      await cache.setInfrastructureAudit(result2, { env: "prod" });

      await cache.invalidate("infrastructureAudit", { env: "dev" });

      const cachedDev = await cache.getInfrastructureAudit({ env: "dev" });
      const cachedProd = await cache.getInfrastructureAudit({ env: "prod" });

      expect(cachedDev).toBeNull();
      expect(cachedProd).toBeDefined();
    });
  });

  describe("Cache Configuration", () => {
    it("should use custom configuration", () => {
      const customConfig: Partial<SupportCacheConfig> = {
        enabled: false,
        maxCacheSize: 500,
      };

      const customCache = new SupportOperationsCache(customConfig);
      const config = customCache.getConfig();

      expect(config.enabled).toBe(false);
      expect(config.maxCacheSize).toBe(500);
    });

    it("should update configuration", () => {
      cache.updateConfig({
        maxCacheSize: 2000,
        compressionEnabled: false,
      });

      const config = cache.getConfig();

      expect(config.maxCacheSize).toBe(2000);
      expect(config.compressionEnabled).toBe(false);
    });

    it("should update TTL for specific operations", () => {
      cache.updateConfig({
        ttlSeconds: {
          infrastructureAudit: 600,
          metaMonitoring: 120,
          implementationGaps: 900,
          complianceValidation: 3600,
          securityAudit: 1800,
          costAnalysis: 600,
        },
      });

      const config = cache.getConfig();

      expect(config.ttlSeconds.infrastructureAudit).toBe(600);
      expect(config.ttlSeconds.metaMonitoring).toBe(120);
    });
  });

  describe("Health Check", () => {
    it("should report healthy status for empty cache", async () => {
      const health = await cache.healthCheck();

      expect(health.healthy).toBe(true);
      expect(health.cacheSize).toBe(0);
      expect(health.errors).toHaveLength(0);
    });

    it("should report healthy status with good performance", async () => {
      const result: InfrastructureAuditResult = {
        timestamp: new Date(),
        overallHealth: "healthy",
        detectedIssues: [],
        implementationGaps: [],
        recommendations: [],
        complianceStatus: {
          gdprCompliant: true,
          dataResidencyCompliant: true,
          auditTrailComplete: true,
          issues: [],
        },
      };

      await cache.setInfrastructureAudit(result);
      await cache.getInfrastructureAudit(); // Hit

      const health = await cache.healthCheck();

      expect(health.healthy).toBe(true);
      expect(health.cacheSize).toBe(1);
      expect(health.hitRate).toBeGreaterThan(0);
    });
  });

  describe("Cache Warm-up", () => {
    it("should warm up cache with common operations", async () => {
      const operations = [
        {
          type: "infrastructureAudit" as const,
          data: {
            timestamp: new Date(),
            overallHealth: "healthy" as const,
            detectedIssues: [],
            implementationGaps: [],
            recommendations: [],
            complianceStatus: {
              gdprCompliant: true,
              dataResidencyCompliant: true,
              auditTrailComplete: true,
              issues: [],
            },
          },
        },
        {
          type: "complianceValidation" as const,
          data: {
            isCompliant: true,
            violations: [],
            recommendations: [],
            lastChecked: new Date(),
          },
        },
      ];

      await cache.warmUp(operations);

      const stats = cache.getStats();
      expect(stats.cacheSize).toBe(2);
    });
  });

  describe("Performance Target", () => {
    it("should check if performance target is met", async () => {
      const result: InfrastructureAuditResult = {
        timestamp: new Date(),
        overallHealth: "healthy",
        detectedIssues: [],
        implementationGaps: [],
        recommendations: [],
        complianceStatus: {
          gdprCompliant: true,
          dataResidencyCompliant: true,
          auditTrailComplete: true,
          issues: [],
        },
      };

      await cache.setInfrastructureAudit(result);

      // Generate hits
      await cache.getInfrastructureAudit();
      await cache.getInfrastructureAudit();
      await cache.getInfrastructureAudit();

      const meetsTarget = cache.isPerformanceTarget(0.7);
      expect(meetsTarget).toBe(true);
    });

    it("should fail performance target with low hit rate", async () => {
      // Generate misses
      await cache.getInfrastructureAudit({ context: "miss1" });
      await cache.getInfrastructureAudit({ context: "miss2" });
      await cache.getInfrastructureAudit({ context: "miss3" });

      const meetsTarget = cache.isPerformanceTarget(0.7);
      expect(meetsTarget).toBe(false);
    });
  });

  describe("Factory Function", () => {
    it("should create cache with factory function", () => {
      const factoryCache = createSupportOperationsCache({
        maxCacheSize: 500,
      });

      const config = factoryCache.getConfig();
      expect(config.maxCacheSize).toBe(500);
    });
  });

  describe("Environment Configurations", () => {
    it("should have development configuration", () => {
      const devConfig = SUPPORT_CACHE_CONFIGS.development;

      expect(devConfig.enabled).toBe(true);
      expect(devConfig.maxCacheSize).toBe(100);
      expect(devConfig.ttlSeconds.infrastructureAudit).toBe(60);
    });

    it("should have staging configuration", () => {
      const stagingConfig = SUPPORT_CACHE_CONFIGS.staging;

      expect(stagingConfig.enabled).toBe(true);
      expect(stagingConfig.maxCacheSize).toBe(500);
      expect(stagingConfig.ttlSeconds.infrastructureAudit).toBe(180);
    });

    it("should have production configuration", () => {
      const prodConfig = SUPPORT_CACHE_CONFIGS.production;

      expect(prodConfig.enabled).toBe(true);
      expect(prodConfig.maxCacheSize).toBe(1000);
      expect(prodConfig.ttlSeconds.infrastructureAudit).toBe(300);
    });
  });

  describe("Cache Entries Debugging", () => {
    it("should get cache entries for debugging", async () => {
      const result: InfrastructureAuditResult = {
        timestamp: new Date(),
        overallHealth: "healthy",
        detectedIssues: [],
        implementationGaps: [],
        recommendations: [],
        complianceStatus: {
          gdprCompliant: true,
          dataResidencyCompliant: true,
          auditTrailComplete: true,
          issues: [],
        },
      };

      await cache.setInfrastructureAudit(result);

      const entries = cache.getCacheEntries();

      expect(entries).toHaveLength(1);
      expect(entries[0].operationType).toBe("infrastructureAudit");
      expect(entries[0].accessCount).toBe(0);
    });
  });

  describe("Disabled Cache", () => {
    it("should not cache when disabled", async () => {
      const disabledCache = new SupportOperationsCache({ enabled: false });

      const result: InfrastructureAuditResult = {
        timestamp: new Date(),
        overallHealth: "healthy",
        detectedIssues: [],
        implementationGaps: [],
        recommendations: [],
        complianceStatus: {
          gdprCompliant: true,
          dataResidencyCompliant: true,
          auditTrailComplete: true,
          issues: [],
        },
      };

      await disabledCache.setInfrastructureAudit(result);

      const cached = await disabledCache.getInfrastructureAudit();

      expect(cached).toBeNull();

      const stats = disabledCache.getStats();
      expect(stats.cacheSize).toBe(0);
    });
  });
});
