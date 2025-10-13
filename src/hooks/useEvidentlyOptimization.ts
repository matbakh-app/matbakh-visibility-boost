/**
 * React Hook for CloudWatch Evidently Integration
 *
 * Provides:
 * - Feature flag evaluation
 * - A/B testing participation
 * - Performance metrics recording
 * - User context management
 */

import React, {
  useState,
  useEffect,
  useCallback,
  useContext,
  useMemo,
} from "react";
import {
  EvidentlyOptimizationService,
  UserContext,
} from "../lib/optimization/evidently-integration";

interface EvidentlyConfig {
  projectName?: string;
  region?: string;
  userId?: string;
  sessionId?: string;
}

interface FeatureEvaluation {
  value: any;
  variation: string;
  loading: boolean;
  error?: Error;
}

interface ExperimentParticipation {
  experimentName: string;
  treatment: string;
  isParticipating: boolean;
}

interface PerformanceMetrics {
  loadTime?: number;
  renderTime?: number;
  interactionTime?: number;
  bundleSize?: number;
  cacheHitRate?: number;
  errorRate?: number;
}

export interface UseEvidentlyOptimizationReturn {
  // Feature flag evaluation
  evaluateFeature: (
    featureName: string,
    defaultValue?: any
  ) => FeatureEvaluation;
  evaluateMultipleFeatures: (
    features: string[]
  ) => Record<string, FeatureEvaluation>;

  // Experiment participation
  getExperimentTreatment: (experimentName: string) => string | null;
  isParticipatingInExperiment: (experimentName: string) => boolean;

  // Metrics recording
  recordMetric: (
    metricName: string,
    value: number,
    experimentName?: string
  ) => Promise<void>;
  recordPerformanceMetrics: (
    metrics: PerformanceMetrics,
    experimentName?: string
  ) => Promise<void>;

  // Optimization helpers
  getBundleOptimization: () => string | boolean;
  getCachingStrategy: () => string;
  getLazyLoadingMode: () => string | boolean;
  getDatabaseOptimization: () => string | boolean;

  // State
  isLoading: boolean;
  error?: Error;
  userContext: UserContext;

  // Health check
  healthCheck: () => Promise<boolean>;
}

// Create a context for sharing Evidently service instance
const EvidentlyContext =
  React.createContext<EvidentlyOptimizationService | null>(null);

export const EvidentlyProvider: React.FC<{
  children: React.ReactNode;
  config?: EvidentlyConfig;
}> = ({ children, config = {} }) => {
  const service = useMemo(() => {
    return new EvidentlyOptimizationService(config.projectName, config.region);
  }, [config.projectName, config.region]);

  return (
    <EvidentlyContext.Provider value={service}>
      {children}
    </EvidentlyContext.Provider>
  );
};

export const useEvidentlyOptimization = (
  config: EvidentlyConfig = {}
): UseEvidentlyOptimizationReturn => {
  const contextService = useContext(EvidentlyContext);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | undefined>();
  const [featureCache, setFeatureCache] = useState<
    Map<string, FeatureEvaluation>
  >(new Map());
  const [experimentCache, setExperimentCache] = useState<
    Map<string, ExperimentParticipation>
  >(new Map());

  // Create service instance if not provided by context
  const service = useMemo(() => {
    if (contextService) return contextService;
    return new EvidentlyOptimizationService(config.projectName, config.region);
  }, [contextService, config.projectName, config.region]);

  // Build user context
  const userContext = useMemo((): UserContext => {
    return {
      userId: config.userId || localStorage.getItem("userId") || undefined,
      sessionId:
        config.sessionId ||
        sessionStorage.getItem("sessionId") ||
        generateSessionId(),
      userAgent: navigator.userAgent,
      ipAddress: undefined, // Will be determined server-side
      customAttributes: {
        timestamp: new Date().toISOString(),
        url: window.location.href,
        referrer: document.referrer || undefined,
      },
    };
  }, [config.userId, config.sessionId]);

  // Generate session ID if not provided
  function generateSessionId(): string {
    const sessionId = `session_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    sessionStorage.setItem("sessionId", sessionId);
    return sessionId;
  }

  // Evaluate a single feature flag
  const evaluateFeature = useCallback(
    (featureName: string, defaultValue: any = null): FeatureEvaluation => {
      const cached = featureCache.get(featureName);
      if (cached && !cached.loading) {
        return cached;
      }

      // Set loading state
      const loadingState: FeatureEvaluation = {
        value: defaultValue,
        variation: "default",
        loading: true,
      };
      setFeatureCache((prev) => new Map(prev.set(featureName, loadingState)));

      // Evaluate feature asynchronously
      service
        .evaluateFeature(featureName, userContext, defaultValue)
        .then((value) => {
          const result: FeatureEvaluation = {
            value,
            variation:
              typeof value === "string"
                ? value
                : value
                ? "enabled"
                : "disabled",
            loading: false,
          };
          setFeatureCache((prev) => new Map(prev.set(featureName, result)));
        })
        .catch((err) => {
          const errorResult: FeatureEvaluation = {
            value: defaultValue,
            variation: "error",
            loading: false,
            error: err,
          };
          setFeatureCache(
            (prev) => new Map(prev.set(featureName, errorResult))
          );
          setError(err);
        });

      return loadingState;
    },
    [service, userContext, featureCache]
  );

  // Evaluate multiple features at once
  const evaluateMultipleFeatures = useCallback(
    (features: string[]): Record<string, FeatureEvaluation> => {
      const results: Record<string, FeatureEvaluation> = {};

      // Check cache first
      const uncachedFeatures: string[] = [];
      features.forEach((feature) => {
        const cached = featureCache.get(feature);
        if (cached && !cached.loading) {
          results[feature] = cached;
        } else {
          uncachedFeatures.push(feature);
          results[feature] = {
            value: null,
            variation: "default",
            loading: true,
          };
        }
      });

      // Evaluate uncached features
      if (uncachedFeatures.length > 0) {
        service
          .evaluateMultipleFeatures(uncachedFeatures, userContext)
          .then((values) => {
            uncachedFeatures.forEach((feature) => {
              const value = values[feature];
              const result: FeatureEvaluation = {
                value,
                variation:
                  typeof value === "string"
                    ? value
                    : value
                    ? "enabled"
                    : "disabled",
                loading: false,
              };
              setFeatureCache((prev) => new Map(prev.set(feature, result)));
            });
          })
          .catch((err) => {
            uncachedFeatures.forEach((feature) => {
              const errorResult: FeatureEvaluation = {
                value: null,
                variation: "error",
                loading: false,
                error: err,
              };
              setFeatureCache(
                (prev) => new Map(prev.set(feature, errorResult))
              );
            });
            setError(err);
          });
      }

      return results;
    },
    [service, userContext, featureCache]
  );

  // Get experiment treatment for a user
  const getExperimentTreatment = useCallback(
    (experimentName: string): string | null => {
      const cached = experimentCache.get(experimentName);
      if (cached) {
        return cached.treatment;
      }

      // For now, return null - would need to implement experiment evaluation
      // This would typically involve evaluating the experiment's feature flag
      return null;
    },
    [experimentCache]
  );

  // Check if user is participating in an experiment
  const isParticipatingInExperiment = useCallback(
    (experimentName: string): boolean => {
      const cached = experimentCache.get(experimentName);
      return cached?.isParticipating || false;
    },
    [experimentCache]
  );

  // Record a custom metric
  const recordMetric = useCallback(
    async (
      metricName: string,
      value: number,
      experimentName?: string
    ): Promise<void> => {
      try {
        await service.recordMetric(
          metricName,
          value,
          userContext,
          experimentName
        );
      } catch (err) {
        console.error(`Failed to record metric ${metricName}:`, err);
        setError(err as Error);
      }
    },
    [service, userContext]
  );

  // Record performance metrics
  const recordPerformanceMetrics = useCallback(
    async (
      metrics: PerformanceMetrics,
      experimentName?: string
    ): Promise<void> => {
      try {
        await service.recordPerformanceMetrics(
          metrics,
          userContext,
          experimentName
        );
      } catch (err) {
        console.error("Failed to record performance metrics:", err);
        setError(err as Error);
      }
    },
    [service, userContext]
  );

  // Optimization-specific helpers
  const getBundleOptimization = useCallback((): string | boolean => {
    const result = evaluateFeature("bundle-optimization", false);
    return result.value;
  }, [evaluateFeature]);

  const getCachingStrategy = useCallback((): string => {
    const result = evaluateFeature("caching-strategy", "memory");
    return result.value;
  }, [evaluateFeature]);

  const getLazyLoadingMode = useCallback((): string | boolean => {
    const result = evaluateFeature("lazy-loading", "routes");
    return result.value;
  }, [evaluateFeature]);

  const getDatabaseOptimization = useCallback((): string | boolean => {
    const result = evaluateFeature("database-optimization", "pooling");
    return result.value;
  }, [evaluateFeature]);

  // Health check
  const healthCheck = useCallback(async (): Promise<boolean> => {
    try {
      const health = await service.healthCheck();
      return health.connected && health.projectExists;
    } catch (err) {
      setError(err as Error);
      return false;
    }
  }, [service]);

  // Initialize service on mount
  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      if (!mounted) return;

      setIsLoading(true);
      try {
        await service.initializeProject();

        // Pre-load common optimization features
        const commonFeatures = [
          "bundle-optimization",
          "caching-strategy",
          "lazy-loading",
          "database-optimization",
        ];

        evaluateMultipleFeatures(commonFeatures);
      } catch (err) {
        if (mounted) {
          setError(err as Error);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initialize();

    return () => {
      mounted = false;
    };
  }, [service, evaluateMultipleFeatures]);

  // Record page load performance metrics
  useEffect(() => {
    const recordPageLoadMetrics = () => {
      if (window.performance && window.performance.timing) {
        const timing = window.performance.timing;
        const loadTime = timing.loadEventEnd - timing.navigationStart;
        const renderTime =
          timing.domContentLoadedEventEnd - timing.navigationStart;

        recordPerformanceMetrics({
          loadTime,
          renderTime,
        }).catch(console.error);
      }
    };

    // Record metrics after page load
    if (document.readyState === "complete") {
      recordPageLoadMetrics();
    } else {
      window.addEventListener("load", recordPageLoadMetrics);
      return () => window.removeEventListener("load", recordPageLoadMetrics);
    }
  }, [recordPerformanceMetrics]);

  return {
    evaluateFeature,
    evaluateMultipleFeatures,
    getExperimentTreatment,
    isParticipatingInExperiment,
    recordMetric,
    recordPerformanceMetrics,
    getBundleOptimization,
    getCachingStrategy,
    getLazyLoadingMode,
    getDatabaseOptimization,
    isLoading,
    error,
    userContext,
    healthCheck,
  };
};
