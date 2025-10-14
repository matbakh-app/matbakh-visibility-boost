/**
 * React Hook for Experiment Win Rate Tracking - Simplified for testing
 *
 * Provides reactive access to experiment performance data, win rates, and cost impact
 */

import {
  CostImpactData,
  ExperimentData,
  experimentWinRateService,
  WinRateData,
} from "@/lib/monitoring/experiment-win-rate-service";
import { useCallback, useEffect, useRef, useState } from "react";

// Helper function to handle sync/async service responses
const resolveMaybe = async <T>(v: T | Promise<T>): Promise<T> =>
  v && typeof (v as any).then === "function" ? await (v as any) : (v as T);

interface ExperimentWinRateState {
  experiments: ExperimentData[];
  winRates: WinRateData[];
  costImpact: CostImpactData[];
  aggregatedMetrics: {
    totalExperiments: number;
    activeExperiments: number;
    averageWinRate: number;
    totalCostImpact: number;
    topPerformingExperiment: string | null;
    worstPerformingExperiment: string | null;
  };
  isLoading: boolean;
  lastUpdated: Date;
  error: string | null;
}

interface ExperimentWinRateActions {
  refreshExperiments: () => Promise<void>;
  getExperimentWinRate: (experimentId: string) => WinRateData | undefined;
  getExperimentCostImpact: (experimentId: string) => CostImpactData | undefined;
  startExperiment: (experimentId: string) => boolean;
  stopExperiment: (experimentId: string) => boolean;
  updateTrafficSplit: (
    experimentId: string,
    trafficSplit: Record<string, number>
  ) => boolean;
}

export interface UseExperimentWinRateReturn
  extends ExperimentWinRateState,
    ExperimentWinRateActions {}

export const useExperimentWinRate = (options?: {
  autoRefresh?: boolean;
  refreshInterval?: number;
  experimentIds?: string[];
}): UseExperimentWinRateReturn => {
  const { experimentIds } = options || {};

  const [state, setState] = useState<ExperimentWinRateState>({
    experiments: [],
    winRates: [],
    costImpact: [],
    aggregatedMetrics: {
      totalExperiments: 0,
      activeExperiments: 0,
      averageWinRate: 0,
      totalCostImpact: 0,
      topPerformingExperiment: null,
      worstPerformingExperiment: null,
    },
    isLoading: false,
    lastUpdated: new Date(),
    error: null,
  });

  const calculateAggregatedMetrics = useCallback(
    (
      experiments: ExperimentData[],
      winRates: WinRateData[],
      costImpact: CostImpactData[]
    ) => {
      const activeExperiments = experiments.filter(
        (exp) => exp.status === "running"
      );
      const totalExperiments = experiments.length;
      const activeExperimentCount = activeExperiments.length;

      const activeWinRates = winRates.filter((wr) =>
        activeExperiments.some((exp) => exp.id === wr.experimentId)
      );
      const averageWinRate =
        activeWinRates.length > 0
          ? activeWinRates.reduce((sum, wr) => sum + wr.rate, 0) /
            activeWinRates.length
          : 0;

      const activeCostImpacts = costImpact.filter((ci) =>
        activeExperiments.some((exp) => exp.id === ci.experimentId)
      );
      const totalCostImpact = activeCostImpacts.reduce(
        (sum, ci) => sum + ci.impact,
        0
      );

      const sortedWinRates = [...activeWinRates].sort(
        (a, b) => b.rate - a.rate
      );
      const topPerformingExperiment =
        sortedWinRates.length > 0
          ? experiments.find((exp) => exp.id === sortedWinRates[0].experimentId)
              ?.name || null
          : null;
      const worstPerformingExperiment =
        sortedWinRates.length > 0
          ? experiments.find(
              (exp) =>
                exp.id ===
                sortedWinRates[sortedWinRates.length - 1].experimentId
            )?.name || null
          : null;

      return {
        totalExperiments,
        activeExperiments: activeExperimentCount,
        averageWinRate,
        totalCostImpact,
        topPerformingExperiment,
        worstPerformingExperiment,
      };
    },
    []
  );

  const loadData = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      const experiments = await resolveMaybe(
        experimentIds
          ? experimentWinRateService.getExperimentsByIds(experimentIds)
          : experimentWinRateService.getAllExperiments()
      );

      const expIds = experiments.map((e) => e.id);

      const [winRates, costImpact] = await Promise.all([
        resolveMaybe(experimentWinRateService.getWinRates(expIds)),
        resolveMaybe(experimentWinRateService.getCostImpact(expIds)),
      ]);

      const aggregatedMetrics = calculateAggregatedMetrics(
        experiments,
        winRates,
        costImpact
      );

      setState((prev) => ({
        ...prev,
        experiments,
        winRates,
        costImpact,
        aggregatedMetrics,
        isLoading: false,
        lastUpdated: new Date(),
        error: null,
      }));
    } catch (error) {
      console.error("Failed to load experiment win rate data:", error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      }));
    }
  }, [experimentIds, calculateAggregatedMetrics]);

  const refreshExperiments = useCallback(async () => {
    await loadData();
  }, [loadData]);

  const getExperimentWinRate = useCallback(
    (experimentId: string): WinRateData | undefined => {
      return state.winRates.find((wr) => wr.experimentId === experimentId);
    },
    [state.winRates]
  );

  const getExperimentCostImpact = useCallback(
    (experimentId: string): CostImpactData | undefined => {
      return state.costImpact.find((ci) => ci.experimentId === experimentId);
    },
    [state.costImpact]
  );

  const startExperiment = useCallback((experimentId: string): boolean => {
    return experimentWinRateService.startExperiment(experimentId);
  }, []);

  const stopExperiment = useCallback((experimentId: string): boolean => {
    return experimentWinRateService.stopExperiment(experimentId);
  }, []);

  const updateTrafficSplit = useCallback(
    (experimentId: string, trafficSplit: Record<string, number>): boolean => {
      return experimentWinRateService.updateTrafficSplit(
        experimentId,
        trafficSplit
      );
    },
    []
  );

  // Load data on mount
  const didInit = useRef(false);
  useEffect(() => {
    if (!didInit.current) {
      didInit.current = true;
      loadData();
    }
  }, [loadData]);

  return {
    ...state,
    refreshExperiments,
    getExperimentWinRate,
    getExperimentCostImpact,
    startExperiment,
    stopExperiment,
    updateTrafficSplit,
  };
};

export const useExperiment = (experimentId: string) => {
  const {
    experiments,
    winRates,
    costImpact,
    isLoading,
    error,
    getExperimentWinRate,
    getExperimentCostImpact,
    startExperiment,
    stopExperiment,
    updateTrafficSplit,
    refreshExperiments,
  } = useExperimentWinRate({
    experimentIds: [experimentId],
    autoRefresh: false,
  });

  const experiment = experiments.find((exp) => exp.id === experimentId);
  const winRate = getExperimentWinRate(experimentId);
  const cost = getExperimentCostImpact(experimentId);

  return {
    experiment,
    winRate,
    cost,
    isLoading,
    error,
    exists: !!experiment,
    start: () => startExperiment(experimentId),
    stop: () => stopExperiment(experimentId),
    updateTrafficSplit: (trafficSplit: Record<string, number>) =>
      updateTrafficSplit(experimentId, trafficSplit),
    refresh: refreshExperiments,
  };
};

/**
 * Hook for experiment performance comparison
 */
export const useExperimentComparison = (experimentIds: string[]) => {
  const {
    experiments,
    winRates,
    costImpact,
    isLoading,
    error,
    refreshExperiments,
  } = useExperimentWinRate({ experimentIds, autoRefresh: false });

  const comparison = experimentIds.map((id) => {
    const experiment = experiments.find((exp) => exp.id === id);
    const winRate = winRates.find((wr) => wr.experimentId === id);
    const cost = costImpact.find((ci) => ci.experimentId === id);

    return {
      experimentId: id,
      experiment,
      winRate: winRate?.rate || 0,
      costImpact: cost?.impact || 0,
      participants: experiment?.participants || 0,
      status: experiment?.status || "unknown",
    };
  });

  // Sort by win rate descending
  const sortedComparison = comparison.sort((a, b) => b.winRate - a.winRate);

  return {
    comparison: sortedComparison,
    bestPerforming: sortedComparison[0],
    worstPerforming: sortedComparison[sortedComparison.length - 1],
    isLoading,
    error,
    refresh: refreshExperiments,
  };
};

// Explicit re-exports for better compatibility
export { useExperimentComparison };
export default useExperimentWinRate;
