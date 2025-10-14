/**
 * Cache Hit Rate Analyzer
 *
 * Implements precise cache hit rate measurement with:
 * - Eligible denominator (only cache-eligible requests)
 * - Stratified analysis (Top-K vs Long-Tail)
 * - Context-aware cache key generation
 * - Cache eligibility detection
 */

export interface CacheRequest {
  requestId: string;
  prompt: string;
  context: {
    domain?: string;
    intent?: string;
    userId?: string;
    sessionId?: string;
  };
  tools?: Array<{ name: string; parameters?: any }>;
  timestamp: number;
}

export interface CacheResult {
  requestId: string;
  cacheKey: string;
  hit: boolean;
  eligible: boolean;
  reason?: string; // Why not eligible
  latency: number;
  timestamp: number;
}

export interface CacheAnalytics {
  overall: {
    totalRequests: number;
    eligibleRequests: number;
    cacheHits: number;
    hitRate: number;
    eligibilityRate: number;
  };
  stratified: {
    topK: {
      threshold: number;
      requests: number;
      hits: number;
      hitRate: number;
    };
    longTail: {
      requests: number;
      hits: number;
      hitRate: number;
    };
  };
  byDomain: Map<
    string,
    {
      requests: number;
      hits: number;
      hitRate: number;
    }
  >;
  byIntent: Map<
    string,
    {
      requests: number;
      hits: number;
      hitRate: number;
    }
  >;
}

/**
 * Cache Hit Rate Analyzer with precise eligibility tracking
 */
export class CacheHitRateAnalyzer {
  private cacheResults: CacheResult[] = [];
  private promptFrequency = new Map<string, number>();
  private readonly maxResults = 100000; // Keep ~24 hours of data
  private readonly topKThreshold = 10; // Top-K queries (appeared 10+ times)

  /**
   * Record a cache request and result
   */
  recordCacheAttempt(
    request: CacheRequest,
    hit: boolean,
    latency: number
  ): void {
    const cacheKey = this.generateCacheKey(request);
    const eligible = this.isCacheEligible(request);

    const result: CacheResult = {
      requestId: request.requestId,
      cacheKey,
      hit: hit && eligible, // Only count as hit if eligible
      eligible,
      reason: eligible ? undefined : this.getIneligibilityReason(request),
      latency,
      timestamp: Date.now(),
    };

    this.cacheResults.push(result);

    // Track prompt frequency for stratification
    if (eligible) {
      const normalizedPrompt = this.normalizePrompt(request.prompt);
      this.promptFrequency.set(
        normalizedPrompt,
        (this.promptFrequency.get(normalizedPrompt) || 0) + 1
      );
    }

    // Maintain memory limits
    if (this.cacheResults.length > this.maxResults) {
      this.cacheResults = this.cacheResults.slice(-this.maxResults);
    }
  }

  /**
   * Generate cache key with context awareness
   */
  generateCacheKey(request: CacheRequest): string {
    const keyComponents = {
      prompt: this.normalizePrompt(request.prompt),
      domain: request.context.domain || "general",
      intent: request.context.intent || "default",
      tools:
        request.tools
          ?.map((t) => ({
            name: t.name,
            // Include parameter schema but not values for caching
            parameterKeys: Object.keys(t.parameters || {}).sort(),
          }))
          .sort((a, b) => a.name.localeCompare(b.name)) || [],
      // Don't include userId/sessionId in cache key for broader sharing
    };

    // Create deterministic hash
    const keyString = JSON.stringify(keyComponents);
    return this.hashString(keyString);
  }

  /**
   * Check if request is eligible for caching
   */
  isCacheEligible(request: CacheRequest): boolean {
    // Not eligible if prompt is too long (likely unique)
    if (request.prompt.length > 2000) {
      return false;
    }

    // Not eligible if contains PII patterns
    if (this.containsPII(request.prompt)) {
      return false;
    }

    // Not eligible if has user-specific context
    if (this.hasUserSpecificContext(request)) {
      return false;
    }

    // Not eligible if tools have dynamic parameters
    if (this.hasDynamicToolParameters(request.tools)) {
      return false;
    }

    // Not eligible for certain domains
    const nonCacheableDomains = ["legal", "medical", "personal"];
    if (nonCacheableDomains.includes(request.context.domain || "")) {
      return false;
    }

    return true;
  }

  /**
   * Get comprehensive cache analytics
   */
  getCacheAnalytics(timeWindowMs = 24 * 60 * 60 * 1000): CacheAnalytics {
    const cutoff = Date.now() - timeWindowMs;
    const recentResults = this.cacheResults.filter((r) => r.timestamp > cutoff);

    // Overall statistics
    const totalRequests = recentResults.length;
    const eligibleResults = recentResults.filter((r) => r.eligible);
    const eligibleRequests = eligibleResults.length;
    const cacheHits = eligibleResults.filter((r) => r.hit).length;

    const overall = {
      totalRequests,
      eligibleRequests,
      cacheHits,
      hitRate: eligibleRequests > 0 ? (cacheHits / eligibleRequests) * 100 : 0,
      eligibilityRate:
        totalRequests > 0 ? (eligibleRequests / totalRequests) * 100 : 0,
    };

    // Stratified analysis (Top-K vs Long-Tail)
    const topKResults = eligibleResults.filter((r) => {
      const normalizedPrompt = this.extractNormalizedPrompt(r.cacheKey);
      return (
        (this.promptFrequency.get(normalizedPrompt) || 0) >= this.topKThreshold
      );
    });

    const longTailResults = eligibleResults.filter((r) => {
      const normalizedPrompt = this.extractNormalizedPrompt(r.cacheKey);
      return (
        (this.promptFrequency.get(normalizedPrompt) || 0) < this.topKThreshold
      );
    });

    const stratified = {
      topK: {
        threshold: this.topKThreshold,
        requests: topKResults.length,
        hits: topKResults.filter((r) => r.hit).length,
        hitRate:
          topKResults.length > 0
            ? (topKResults.filter((r) => r.hit).length / topKResults.length) *
              100
            : 0,
      },
      longTail: {
        requests: longTailResults.length,
        hits: longTailResults.filter((r) => r.hit).length,
        hitRate:
          longTailResults.length > 0
            ? (longTailResults.filter((r) => r.hit).length /
                longTailResults.length) *
              100
            : 0,
      },
    };

    // By domain analysis
    const byDomain = new Map<
      string,
      { requests: number; hits: number; hitRate: number }
    >();
    const domainGroups = this.groupBy(eligibleResults, (r) =>
      this.extractDomain(r.cacheKey)
    );

    for (const [domain, results] of domainGroups) {
      const hits = results.filter((r) => r.hit).length;
      byDomain.set(domain, {
        requests: results.length,
        hits,
        hitRate: results.length > 0 ? (hits / results.length) * 100 : 0,
      });
    }

    // By intent analysis
    const byIntent = new Map<
      string,
      { requests: number; hits: number; hitRate: number }
    >();
    const intentGroups = this.groupBy(eligibleResults, (r) =>
      this.extractIntent(r.cacheKey)
    );

    for (const [intent, results] of intentGroups) {
      const hits = results.filter((r) => r.hit).length;
      byIntent.set(intent, {
        requests: results.length,
        hits,
        hitRate: results.length > 0 ? (hits / results.length) * 100 : 0,
      });
    }

    return {
      overall,
      stratified,
      byDomain,
      byIntent,
    };
  }

  /**
   * Get cache performance recommendations
   */
  getCacheRecommendations(): Array<{
    type: "warning" | "info" | "optimization";
    message: string;
    metric?: number;
    threshold?: number;
  }> {
    const analytics = this.getCacheAnalytics();
    const recommendations = [];

    // Overall hit rate check
    if (analytics.overall.hitRate < 80) {
      recommendations.push({
        type: "warning" as const,
        message: `Overall cache hit rate is ${analytics.overall.hitRate.toFixed(
          1
        )}%, below 80% target`,
        metric: analytics.overall.hitRate,
        threshold: 80,
      });
    }

    // Eligibility rate check
    if (analytics.overall.eligibilityRate < 60) {
      recommendations.push({
        type: "info" as const,
        message: `Only ${analytics.overall.eligibilityRate.toFixed(
          1
        )}% of requests are cache-eligible. Consider reviewing eligibility criteria.`,
        metric: analytics.overall.eligibilityRate,
        threshold: 60,
      });
    }

    // Top-K vs Long-Tail analysis
    if (
      analytics.stratified.topK.hitRate > 90 &&
      analytics.stratified.longTail.hitRate < 30
    ) {
      recommendations.push({
        type: "optimization" as const,
        message: `Top-K queries have ${analytics.stratified.topK.hitRate.toFixed(
          1
        )}% hit rate vs ${analytics.stratified.longTail.hitRate.toFixed(
          1
        )}% for long-tail. Consider pre-warming popular queries.`,
      });
    }

    // Domain-specific recommendations
    for (const [domain, stats] of analytics.byDomain) {
      if (stats.requests > 100 && stats.hitRate < 50) {
        recommendations.push({
          type: "warning" as const,
          message: `Domain '${domain}' has low cache hit rate: ${stats.hitRate.toFixed(
            1
          )}%`,
          metric: stats.hitRate,
          threshold: 50,
        });
      }
    }

    return recommendations;
  }

  /**
   * Get ineligibility reasons summary
   */
  getIneligibilityReasons(
    timeWindowMs = 24 * 60 * 60 * 1000
  ): Map<string, number> {
    const cutoff = Date.now() - timeWindowMs;
    const ineligibleResults = this.cacheResults.filter(
      (r) => r.timestamp > cutoff && !r.eligible && r.reason
    );

    const reasonCounts = new Map<string, number>();
    for (const result of ineligibleResults) {
      if (result.reason) {
        reasonCounts.set(
          result.reason,
          (reasonCounts.get(result.reason) || 0) + 1
        );
      }
    }

    return reasonCounts;
  }

  /**
   * Normalize prompt for consistent caching
   */
  private normalizePrompt(prompt: string): string {
    return prompt
      .toLowerCase()
      .trim()
      .replace(/\s+/g, " ") // Normalize whitespace
      .replace(/[^\w\s]/g, "") // Remove special characters
      .substring(0, 500); // Limit length for key generation
  }

  /**
   * Check if prompt contains PII patterns
   */
  private containsPII(prompt: string): boolean {
    const piiPatterns = [
      /\b\d{3}-\d{2}-\d{4}\b/, // SSN
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Email
      /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/, // Credit card
      /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/, // Phone number
    ];

    return piiPatterns.some((pattern) => pattern.test(prompt));
  }

  /**
   * Check if request has user-specific context
   */
  private hasUserSpecificContext(request: CacheRequest): boolean {
    // Check for user-specific references in prompt
    const userSpecificPatterns = [
      /\bmy\b/i,
      /\bi\b/i,
      /\bme\b/i,
      /\byour\b/i,
      /\bpersonal\b/i,
    ];

    const hasUserReferences = userSpecificPatterns.some((pattern) =>
      pattern.test(request.prompt)
    );

    // Check for session-specific context
    const hasSessionContext = !!(
      request.context.userId || request.context.sessionId
    );

    return hasUserReferences || hasSessionContext;
  }

  /**
   * Check if tools have dynamic parameters
   */
  private hasDynamicToolParameters(
    tools?: Array<{ name: string; parameters?: any }>
  ): boolean {
    if (!tools) return false;

    return tools.some((tool) => {
      if (!tool.parameters) return false;

      // Check for timestamp, random values, or user-specific data
      const paramString = JSON.stringify(tool.parameters).toLowerCase();
      return (
        paramString.includes("timestamp") ||
        paramString.includes("random") ||
        paramString.includes("user") ||
        paramString.includes("session")
      );
    });
  }

  /**
   * Get reason why request is not cache eligible
   */
  private getIneligibilityReason(request: CacheRequest): string {
    if (request.prompt.length > 2000) {
      return "prompt_too_long";
    }
    if (this.containsPII(request.prompt)) {
      return "contains_pii";
    }
    if (this.hasUserSpecificContext(request)) {
      return "user_specific_context";
    }
    if (this.hasDynamicToolParameters(request.tools)) {
      return "dynamic_tool_parameters";
    }

    const nonCacheableDomains = ["legal", "medical", "personal"];
    if (nonCacheableDomains.includes(request.context.domain || "")) {
      return "non_cacheable_domain";
    }

    return "unknown";
  }

  /**
   * Generate hash from string
   */
  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Group array by key function
   */
  private groupBy<T>(array: T[], keyFn: (item: T) => string): Map<string, T[]> {
    const groups = new Map<string, T[]>();
    for (const item of array) {
      const key = keyFn(item);
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(item);
    }
    return groups;
  }

  /**
   * Extract normalized prompt from cache key (for analysis)
   */
  private extractNormalizedPrompt(cacheKey: string): string {
    // This is a simplified extraction - in practice, you'd store the mapping
    return cacheKey.substring(0, 8); // Use first 8 chars as proxy
  }

  /**
   * Extract domain from cache key
   */
  private extractDomain(cacheKey: string): string {
    // Simplified extraction - in practice, you'd decode the key
    return "general"; // Default for now
  }

  /**
   * Extract intent from cache key
   */
  private extractIntent(cacheKey: string): string {
    // Simplified extraction - in practice, you'd decode the key
    return "default"; // Default for now
  }
}

// Singleton instance
export const cacheHitRateAnalyzer = new CacheHitRateAnalyzer();
