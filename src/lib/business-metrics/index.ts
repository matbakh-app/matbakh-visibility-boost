/**
 * Business Metrics Library
 *
 * Comprehensive business metrics integration for conversion and revenue tracking
 */

// Core services
export {
  businessMetricsService,
  type AttributionModel,
  type BusinessImpactReport,
  type ConversionEvent,
  type ConversionFunnel,
  type CustomerSegment,
  type RevenueMetrics,
} from "./business-metrics-service";

export {
  aiBusinessIntegration,
  type AIBusinessEvent,
  type AIBusinessMetrics,
  type AIROIAnalysis,
  type PersonaBusinessProfile,
} from "./ai-business-integration";

// React integration
export { BusinessMetricsDashboard } from "@/components/business-metrics/BusinessMetricsDashboard";
export { useBusinessMetrics } from "@/hooks/useBusinessMetrics";

// Utility functions
export const formatCurrency = (
  amount: number,
  currency: "EUR" | "USD" | "GBP" = "EUR"
) => {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency,
  }).format(amount);
};

export const formatPercentage = (value: number, decimals: number = 1) => {
  return `${value >= 0 ? "+" : ""}${value.toFixed(decimals)}%`;
};

export const calculateROI = (revenue: number, cost: number) => {
  return cost > 0 ? ((revenue - cost) / cost) * 100 : 0;
};

export const calculateConversionRate = (conversions: number, total: number) => {
  return total > 0 ? conversions / total : 0;
};

export const calculateLift = (treatment: number, control: number) => {
  return control > 0 ? ((treatment - control) / control) * 100 : 0;
};

export const getMetricTrend = (value: number) => {
  if (value > 5) return { trend: "up", color: "green", severity: "high" };
  if (value > 0) return { trend: "up", color: "green", severity: "low" };
  if (value < -5) return { trend: "down", color: "red", severity: "high" };
  if (value < 0) return { trend: "down", color: "red", severity: "low" };
  return { trend: "stable", color: "gray", severity: "none" };
};

export const calculateStatisticalSignificance = (
  controlConversions: number,
  controlTotal: number,
  treatmentConversions: number,
  treatmentTotal: number,
  confidenceLevel: number = 95
) => {
  // Simplified z-test for proportions
  const p1 = controlConversions / controlTotal;
  const p2 = treatmentConversions / treatmentTotal;
  const pooledP =
    (controlConversions + treatmentConversions) /
    (controlTotal + treatmentTotal);

  const se = Math.sqrt(
    pooledP * (1 - pooledP) * (1 / controlTotal + 1 / treatmentTotal)
  );
  const zScore = Math.abs(p2 - p1) / se;

  // Critical values for common confidence levels
  const criticalValues: Record<number, number> = {
    90: 1.645,
    95: 1.96,
    99: 2.576,
  };

  const criticalValue = criticalValues[confidenceLevel] || 1.96;
  const isSignificant = zScore > criticalValue;

  // Approximate p-value (two-tailed)
  const pValue = 2 * (1 - normalCDF(Math.abs(zScore)));

  return {
    isSignificant,
    zScore,
    pValue,
    confidenceLevel,
    effect: p2 - p1,
    relativeEffect: p1 > 0 ? (p2 - p1) / p1 : 0,
  };
};

// Helper function for normal cumulative distribution function
function normalCDF(x: number): number {
  // Approximation using error function
  return 0.5 * (1 + erf(x / Math.sqrt(2)));
}

// Error function approximation
function erf(x: number): number {
  // Abramowitz and Stegun approximation
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = x >= 0 ? 1 : -1;
  x = Math.abs(x);

  const t = 1.0 / (1.0 + p * x);
  const y =
    1.0 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

  return sign * y;
}

export const generateBusinessMetricsReport = (
  revenueMetrics: RevenueMetrics,
  aiMetrics: AIBusinessMetrics[],
  roiAnalysis: AIROIAnalysis
) => {
  const topProvider = roiAnalysis.byProvider[0];
  const topPersona = roiAnalysis.byPersona[0];

  return {
    summary: {
      totalRevenue: revenueMetrics.totalRevenue,
      conversionRate: revenueMetrics.conversionRate,
      customerLTV: revenueMetrics.customerLifetimeValue,
      aiROI: roiAnalysis.overall.netROI,
      paybackPeriod: roiAnalysis.overall.paybackPeriod,
    },
    insights: [
      `Total revenue of ${formatCurrency(
        revenueMetrics.totalRevenue
      )} with ${formatPercentage(revenueMetrics.revenueGrowthRate)} growth`,
      `AI investment ROI of ${formatPercentage(
        roiAnalysis.overall.netROI
      )} with ${roiAnalysis.overall.paybackPeriod.toFixed(
        1
      )} day payback period`,
      topProvider
        ? `Best performing AI provider: ${
            topProvider.provider
          } with ${formatPercentage(topProvider.roi)} ROI`
        : "",
      topPersona
        ? `Most valuable persona: ${topPersona.persona} with ${formatCurrency(
            topPersona.revenue - topPersona.cost
          )} net revenue`
        : "",
      `Conversion rate of ${formatPercentage(
        revenueMetrics.conversionRate * 100
      )} with ${formatCurrency(
        revenueMetrics.averageOrderValue
      )} average order value`,
    ].filter(Boolean),
    recommendations: roiAnalysis.recommendations.map((rec) => ({
      type: rec.type,
      description: rec.description,
      impact: formatCurrency(rec.expectedImpact),
      confidence: formatPercentage(rec.confidence * 100),
      priority: rec.priority,
    })),
  };
};
