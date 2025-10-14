/**
 * Custom hook for benchmark comparison functionality
 * Provides easy access to industry and regional benchmark data
 */

import { useCallback, useEffect, useState } from "react";
import {
  BenchmarkComparison,
  BenchmarkComparisonService,
  IndustryBenchmarkRequest,
  ScoreBenchmark,
} from "../services/benchmark-comparison";
// MIGRATED: Supabase removed - use AWS services

interface UseBenchmarkComparisonOptions {
  businessId: string;
  industryId: string;
  regionId: string;
  scoreType: string;
  currentScore: number;
  businessMetadata?: {
    size?: string;
    type?: string;
    location_count?: number;
  };
  autoFetch?: boolean;
}

interface UseBenchmarkComparisonReturn {
  comparison: BenchmarkComparison | null;
  benchmark: ScoreBenchmark | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  updateScore: (newScore: number) => Promise<void>;
}

export const useBenchmarkComparison = (
  options: UseBenchmarkComparisonOptions
): UseBenchmarkComparisonReturn => {
  const [comparison, setComparison] = useState<BenchmarkComparison | null>(
    null
  );
  const [benchmark, setBenchmark] = useState<ScoreBenchmark | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const benchmarkService = new BenchmarkComparisonService(supabase);

  const fetchBenchmarkData = useCallback(async () => {
    if (
      !options.businessId ||
      !options.industryId ||
      !options.regionId ||
      !options.scoreType ||
      options.currentScore === undefined
    ) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch benchmark data
      const benchmarkData = await benchmarkService.getIndustryBenchmarks(
        options.industryId,
        options.regionId,
        options.scoreType
      );

      if (benchmarkData) {
        setBenchmark(benchmarkData);

        // Calculate comparison
        const request: IndustryBenchmarkRequest = {
          business_id: options.businessId,
          industry_id: options.industryId,
          region_id: options.regionId,
          score_type: options.scoreType,
          current_score: options.currentScore,
          business_metadata: options.businessMetadata,
        };

        const comparisonResult = await benchmarkService.compareToBenchmark(
          request
        );
        setComparison(comparisonResult);
      } else {
        setError("Benchmark-Daten für diese Branche/Region nicht verfügbar");
      }
    } catch (err) {
      console.error("Error fetching benchmark data:", err);
      setError("Fehler beim Laden der Benchmark-Daten");
    } finally {
      setLoading(false);
    }
  }, [
    options.businessId,
    options.industryId,
    options.regionId,
    options.scoreType,
    options.currentScore,
    options.businessMetadata,
    benchmarkService,
  ]);

  const updateScore = useCallback(
    async (newScore: number) => {
      if (!benchmark) return;

      try {
        setLoading(true);

        const request: IndustryBenchmarkRequest = {
          business_id: options.businessId,
          industry_id: options.industryId,
          region_id: options.regionId,
          score_type: options.scoreType,
          current_score: newScore,
          business_metadata: options.businessMetadata,
        };

        const comparisonResult = await benchmarkService.compareToBenchmark(
          request
        );
        setComparison(comparisonResult);
      } catch (err) {
        console.error("Error updating score comparison:", err);
        setError("Fehler beim Aktualisieren der Benchmark-Vergleiche");
      } finally {
        setLoading(false);
      }
    },
    [benchmark, options, benchmarkService]
  );

  useEffect(() => {
    if (options.autoFetch !== false) {
      fetchBenchmarkData();
    }
  }, [fetchBenchmarkData, options.autoFetch]);

  return {
    comparison,
    benchmark,
    loading,
    error,
    refetch: fetchBenchmarkData,
    updateScore,
  };
};

// Hook for multi-region benchmark comparison (for franchise operations)
interface UseMultiRegionBenchmarkOptions {
  industryId: string;
  regionIds: string[];
  scoreType: string;
  autoFetch?: boolean;
}

interface UseMultiRegionBenchmarkReturn {
  benchmarks: { [regionId: string]: ScoreBenchmark };
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useMultiRegionBenchmark = (
  options: UseMultiRegionBenchmarkOptions
): UseMultiRegionBenchmarkReturn => {
  const [benchmarks, setBenchmarks] = useState<{
    [regionId: string]: ScoreBenchmark;
  }>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const benchmarkService = new BenchmarkComparisonService(supabase);

  const fetchMultiRegionData = useCallback(async () => {
    if (
      !options.industryId ||
      !options.regionIds.length ||
      !options.scoreType
    ) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const benchmarkData = await benchmarkService.getMultiRegionBenchmarks(
        options.industryId,
        options.regionIds,
        options.scoreType
      );

      setBenchmarks(benchmarkData);
    } catch (err) {
      console.error("Error fetching multi-region benchmark data:", err);
      setError("Fehler beim Laden der Multi-Region Benchmark-Daten");
    } finally {
      setLoading(false);
    }
  }, [
    options.industryId,
    options.regionIds,
    options.scoreType,
    benchmarkService,
  ]);

  useEffect(() => {
    if (options.autoFetch !== false) {
      fetchMultiRegionData();
    }
  }, [fetchMultiRegionData, options.autoFetch]);

  return {
    benchmarks,
    loading,
    error,
    refetch: fetchMultiRegionData,
  };
};

// Utility hook for benchmark statistics
export const useBenchmarkStats = (comparison: BenchmarkComparison | null) => {
  const getPerformanceLevel = useCallback(() => {
    if (!comparison) return null;

    const { percentile_rank } = comparison;

    if (percentile_rank >= 90) return "excellent";
    if (percentile_rank >= 75) return "good";
    if (percentile_rank >= 50) return "average";
    if (percentile_rank >= 25) return "below_average";
    return "poor";
  }, [comparison]);

  const getImprovementTarget = useCallback(() => {
    if (!comparison) return null;

    const { percentile_rank, improvement_potential } = comparison;

    if (percentile_rank < 75 && improvement_potential > 0) {
      return {
        target_percentile: 75,
        points_needed: improvement_potential,
        timeframe: improvement_potential > 20 ? "6-12 Monate" : "3-6 Monate",
      };
    }

    return null;
  }, [comparison]);

  const getCompetitiveAdvantage = useCallback(() => {
    if (!comparison) return null;

    const { percentile_rank, business_score, benchmark_value } = comparison;

    return {
      above_average: percentile_rank > 50,
      score_difference: business_score - benchmark_value,
      percentile_advantage: percentile_rank - 50,
    };
  }, [comparison]);

  return {
    performanceLevel: getPerformanceLevel(),
    improvementTarget: getImprovementTarget(),
    competitiveAdvantage: getCompetitiveAdvantage(),
  };
};
