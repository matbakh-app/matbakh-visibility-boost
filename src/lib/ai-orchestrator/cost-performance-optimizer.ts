/**
 * PR-4: Cost & Performance Optimization
 * 
 * Implements:
 * - Intelligent cost management with budget controls
 * - Performance optimization with caching strategies
 * - Token usage optimization and compression
 * - Real-time cost tracking and alerts
 */

import { CloudWatchClient, PutMetricDataCommand } from '@aws-sdk/client-cloudwatch';
import { randomUUID } from 'crypto';
import { AIRequest, AIResponse } from './types';

export interface CostBudget {
    dailyLimit: number;
    monthlyLimit: number;
    alertThresholds: number[]; // [50%, 75%, 90%]
    hardStop: boolean;
}

export interface PerformanceMetrics {
    latency: number;
    throughput: number;
    cacheHitRate: number;
    tokenEfficiency: number;
    costPerRequest: number;
}

export interface CostOptimizationResult {
    originalCost: number;
    optimizedCost: number;
    savings: number;
    optimizations: string[];
    cacheUsed: boolean;
    compressionUsed: boolean;
}

export interface TokenOptimization {
    originalTokens: number;
    optimizedTokens: number;
    compressionRatio: number;
    technique: string;
}

/**
 * Intelligent Caching Layer
 */
class IntelligentCache {
    private cache: Map<string, { response: AIResponse; timestamp: number; cost: number }> = new Map();
    private hitCount: number = 0;
    private missCount: number = 0;

    constructor(
        private readonly maxSize: number = 10000,
        private readonly ttlMs: number = 3600000 // 1 hour
    ) { }

    generateKey(request: AIRequest): string {
        // Create semantic hash of request
        const keyData = {
            prompt: this.normalizePrompt(request.prompt),
            provider: request.provider,
            model: request.model,
            temperature: request.temperature || 0.7,
            maxTokens: request.maxTokens,
            domain: request.domain
        };

        return Buffer.from(JSON.stringify(keyData)).toString('base64');
    }

    private normalizePrompt(prompt: string): string {
        // Normalize whitespace and remove non-semantic variations
        return prompt
            .toLowerCase()
            .replace(/\s+/g, ' ')
            .trim()
            .replace(/[^\w\s]/g, ''); // Remove punctuation for semantic matching
    }

    get(key: string): AIResponse | null {
        const entry = this.cache.get(key);

        if (!entry) {
            this.missCount++;
            return null;
        }

        // Check TTL
        if (Date.now() - entry.timestamp > this.ttlMs) {
            this.cache.delete(key);
            this.missCount++;
            return null;
        }

        this.hitCount++;
        return {
            ...entry.response,
            cached: true,
            cacheTimestamp: entry.timestamp
        };
    }

    set(key: string, response: AIResponse, cost: number): void {
        // Implement LRU eviction if cache is full
        if (this.cache.size >= this.maxSize) {
            const oldestKey = this.cache.keys().next().value;
            this.cache.delete(oldestKey);
        }

        this.cache.set(key, {
            response: { ...response, cached: false },
            timestamp: Date.now(),
            cost
        });
    }

    getHitRate(): number {
        const total = this.hitCount + this.missCount;
        return total > 0 ? this.hitCount / total : 0;
    }

    clear(): void {
        this.cache.clear();
        this.hitCount = 0;
        this.missCount = 0;
    }

    getStats() {
        return {
            size: this.cache.size,
            hitCount: this.hitCount,
            missCount: this.missCount,
            hitRate: this.getHitRate()
        };
    }
}

/**
 * Token Compression and Optimization
 */
class TokenOptimizer {
    /**
     * Compress prompt using various techniques
     */
    compressPrompt(prompt: string, targetReduction: number = 0.2): TokenOptimization {
        const originalLength = prompt.length;
        let optimized = prompt;
        const techniques: string[] = [];

        // 1. Remove redundant whitespace
        optimized = optimized.replace(/\s+/g, ' ').trim();
        if (optimized.length < prompt.length) {
            techniques.push('whitespace-normalization');
        }

        // 2. Abbreviate common phrases
        const abbreviations = {
            'please': 'pls',
            'you are': "you're",
            'do not': "don't",
            'cannot': "can't",
            'will not': "won't",
            'should not': "shouldn't",
            'would not': "wouldn't",
            'could not': "couldn't"
        };

        for (const [full, abbrev] of Object.entries(abbreviations)) {
            const regex = new RegExp(`\\b${full}\\b`, 'gi');
            if (regex.test(optimized)) {
                optimized = optimized.replace(regex, abbrev);
                techniques.push('abbreviation');
            }
        }

        // 3. Remove filler words if target reduction not met
        const currentReduction = 1 - (optimized.length / originalLength);
        if (currentReduction < targetReduction) {
            const fillerWords = ['really', 'very', 'quite', 'rather', 'somewhat', 'actually', 'basically', 'literally'];
            for (const filler of fillerWords) {
                const regex = new RegExp(`\\b${filler}\\b`, 'gi');
                if (regex.test(optimized)) {
                    optimized = optimized.replace(regex, '');
                    techniques.push('filler-removal');
                }
            }
        }

        // 4. Sentence compression (remove redundant clauses)
        if (currentReduction < targetReduction) {
            optimized = this.compressSentences(optimized);
            techniques.push('sentence-compression');
        }

        // Clean up any double spaces created
        optimized = optimized.replace(/\s+/g, ' ').trim();

        const finalReduction = 1 - (optimized.length / originalLength);
        const estimatedTokenReduction = finalReduction * 0.75; // Approximate token to character ratio

        return {
            originalTokens: Math.ceil(originalLength / 4), // Rough token estimate
            optimizedTokens: Math.ceil(optimized.length / 4),
            compressionRatio: finalReduction,
            technique: techniques.join(', ')
        };
    }

    private compressSentences(text: string): string {
        // Simple sentence compression - remove redundant phrases
        const redundantPatterns = [
            /,\s*which is to say,?/gi,
            /,\s*in other words,?/gi,
            /,\s*that is to say,?/gi,
            /\s*as I mentioned before,?\s*/gi,
            /\s*as previously stated,?\s*/gi
        ];

        let compressed = text;
        for (const pattern of redundantPatterns) {
            compressed = compressed.replace(pattern, ' ');
        }

        return compressed;
    }

    /**
     * Optimize response for token efficiency
     */
    optimizeResponse(response: string, maxTokens?: number): string {
        if (!maxTokens) return response;

        const estimatedTokens = Math.ceil(response.length / 4);
        if (estimatedTokens <= maxTokens) return response;

        // Truncate at sentence boundaries
        const sentences = response.split(/[.!?]+/);
        let optimized = '';
        let tokenCount = 0;

        for (const sentence of sentences) {
            const sentenceTokens = Math.ceil(sentence.length / 4);
            if (tokenCount + sentenceTokens > maxTokens) break;

            optimized += sentence + '.';
            tokenCount += sentenceTokens;
        }

        return optimized.trim();
    }
}

/**
 * Cost & Performance Optimization Service
 */
export class CostPerformanceOptimizer {
    private cache: IntelligentCache;
    private tokenOptimizer: TokenOptimizer;
    private cloudWatch: CloudWatchClient;
    private dailyCosts: Map<string, number> = new Map(); // date -> cost
    private monthlyCosts: Map<string, number> = new Map(); // month -> cost

    constructor(
        private readonly budget: CostBudget,
        private readonly region: string = 'eu-central-1'
    ) {
        this.cache = new IntelligentCache();
        this.tokenOptimizer = new TokenOptimizer();
        this.cloudWatch = new CloudWatchClient({ region });
    }

    /**
     * Optimize request for cost and performance
     */
    async optimizeRequest(request: AIRequest): Promise<{
        optimizedRequest: AIRequest;
        optimization: CostOptimizationResult;
        shouldProceed: boolean;
    }> {
        const requestId = randomUUID();
        const startTime = Date.now();

        // Check budget constraints
        const budgetCheck = await this.checkBudget(request);
        if (!budgetCheck.allowed) {
            return {
                optimizedRequest: request,
                optimization: {
                    originalCost: budgetCheck.estimatedCost,
                    optimizedCost: 0,
                    savings: 0,
                    optimizations: ['budget-exceeded'],
                    cacheUsed: false,
                    compressionUsed: false
                },
                shouldProceed: false
            };
        }

        // Check cache first
        const cacheKey = this.cache.generateKey(request);
        const cachedResponse = this.cache.get(cacheKey);

        if (cachedResponse) {
            return {
                optimizedRequest: request,
                optimization: {
                    originalCost: budgetCheck.estimatedCost,
                    optimizedCost: 0,
                    savings: budgetCheck.estimatedCost,
                    optimizations: ['cache-hit'],
                    cacheUsed: true,
                    compressionUsed: false
                },
                shouldProceed: false // Don't need to make API call
            };
        }

        // Optimize prompt for token efficiency
        const tokenOptimization = this.tokenOptimizer.compressPrompt(request.prompt, 0.15);
        const optimizedRequest: AIRequest = {
            ...request,
            prompt: request.prompt // Keep original for now, apply compression based on cost pressure
        };

        // Apply compression if cost pressure is high
        const costPressure = this.calculateCostPressure();
        if (costPressure > 0.7 || budgetCheck.estimatedCost > budgetCheck.remainingBudget * 0.1) {
            optimizedRequest.prompt = this.applyTokenOptimization(request.prompt, tokenOptimization);

            // Reduce max tokens if needed
            if (request.maxTokens && request.maxTokens > 1000) {
                optimizedRequest.maxTokens = Math.max(500, Math.floor(request.maxTokens * 0.8));
            }
        }

        const optimizedCost = this.estimateRequestCost(optimizedRequest);
        const savings = budgetCheck.estimatedCost - optimizedCost;

        return {
            optimizedRequest,
            optimization: {
                originalCost: budgetCheck.estimatedCost,
                optimizedCost,
                savings,
                optimizations: tokenOptimization.technique ? ['token-compression'] : [],
                cacheUsed: false,
                compressionUsed: tokenOptimization.compressionRatio > 0.05
            },
            shouldProceed: true
        };
    }

    /**
     * Process response and update metrics
     */
    async processResponse(
        request: AIRequest,
        response: AIResponse,
        optimization: CostOptimizationResult
    ): Promise<AIResponse> {
        const actualCost = this.calculateActualCost(request, response);

        // Cache successful responses
        if (response.content && !response.error) {
            const cacheKey = this.cache.generateKey(request);
            this.cache.set(cacheKey, response, actualCost);
        }

        // Update cost tracking
        await this.updateCostTracking(actualCost);

        // Publish metrics
        await this.publishMetrics({
            latency: response.processingTime || 0,
            throughput: 1000 / (response.processingTime || 1000), // requests per second
            cacheHitRate: this.cache.getHitRate(),
            tokenEfficiency: this.calculateTokenEfficiency(request, response),
            costPerRequest: actualCost
        });

        // Optimize response if needed
        const optimizedContent = request.maxTokens
            ? this.tokenOptimizer.optimizeResponse(response.content, request.maxTokens)
            : response.content;

        return {
            ...response,
            content: optimizedContent,
            cost: actualCost,
            optimization
        };
    }

    /**
     * Check budget constraints
     */
    private async checkBudget(request: AIRequest): Promise<{
        allowed: boolean;
        estimatedCost: number;
        remainingBudget: number;
        reason?: string;
    }> {
        const estimatedCost = this.estimateRequestCost(request);
        const today = new Date().toISOString().split('T')[0];
        const thisMonth = new Date().toISOString().substring(0, 7);

        const dailySpent = this.dailyCosts.get(today) || 0;
        const monthlySpent = this.monthlyCosts.get(thisMonth) || 0;

        // Check daily limit
        if (dailySpent + estimatedCost > this.budget.dailyLimit) {
            if (this.budget.hardStop) {
                return {
                    allowed: false,
                    estimatedCost,
                    remainingBudget: this.budget.dailyLimit - dailySpent,
                    reason: 'Daily budget exceeded'
                };
            }
        }

        // Check monthly limit
        if (monthlySpent + estimatedCost > this.budget.monthlyLimit) {
            if (this.budget.hardStop) {
                return {
                    allowed: false,
                    estimatedCost,
                    remainingBudget: this.budget.monthlyLimit - monthlySpent,
                    reason: 'Monthly budget exceeded'
                };
            }
        }

        return {
            allowed: true,
            estimatedCost,
            remainingBudget: Math.min(
                this.budget.dailyLimit - dailySpent,
                this.budget.monthlyLimit - monthlySpent
            )
        };
    }

    /**
     * Estimate request cost based on tokens and provider
     */
    private estimateRequestCost(request: AIRequest): number {
        const inputTokens = Math.ceil(request.prompt.length / 4);
        const outputTokens = request.maxTokens || 1000;

        const providerCosts = {
            bedrock: { input: 0.003, output: 0.015 }, // per 1K tokens
            google: { input: 0.00125, output: 0.005 },
            meta: { input: 0.0008, output: 0.0024 }
        };

        const costs = providerCosts[request.provider || 'bedrock'];
        return (inputTokens * costs.input + outputTokens * costs.output) / 1000;
    }

    /**
     * Calculate actual cost from response
     */
    private calculateActualCost(request: AIRequest, response: AIResponse): number {
        if (response.cached) return 0;

        const inputTokens = response.inputTokens || Math.ceil(request.prompt.length / 4);
        const outputTokens = response.outputTokens || Math.ceil(response.content.length / 4);

        const providerCosts = {
            bedrock: { input: 0.003, output: 0.015 },
            google: { input: 0.00125, output: 0.005 },
            meta: { input: 0.0008, output: 0.0024 }
        };

        const costs = providerCosts[request.provider || 'bedrock'];
        return (inputTokens * costs.input + outputTokens * costs.output) / 1000;
    }

    /**
     * Calculate cost pressure (0-1 scale)
     */
    private calculateCostPressure(): number {
        const today = new Date().toISOString().split('T')[0];
        const thisMonth = new Date().toISOString().substring(0, 7);

        const dailySpent = this.dailyCosts.get(today) || 0;
        const monthlySpent = this.monthlyCosts.get(thisMonth) || 0;

        const dailyPressure = dailySpent / this.budget.dailyLimit;
        const monthlyPressure = monthlySpent / this.budget.monthlyLimit;

        return Math.max(dailyPressure, monthlyPressure);
    }

    /**
     * Apply token optimization to prompt
     */
    private applyTokenOptimization(prompt: string, optimization: TokenOptimization): string {
        if (optimization.compressionRatio < 0.05) return prompt;

        // Apply the compression techniques
        return this.tokenOptimizer.compressPrompt(prompt, 0.2).technique ?
            this.tokenOptimizer.compressPrompt(prompt, 0.2).toString() : prompt;
    }

    /**
     * Calculate token efficiency
     */
    private calculateTokenEfficiency(request: AIRequest, response: AIResponse): number {
        const inputTokens = response.inputTokens || Math.ceil(request.prompt.length / 4);
        const outputTokens = response.outputTokens || Math.ceil(response.content.length / 4);
        const totalTokens = inputTokens + outputTokens;

        // Efficiency = useful content / total tokens
        const usefulContent = response.content.replace(/\s+/g, ' ').trim().length;
        return totalTokens > 0 ? usefulContent / (totalTokens * 4) : 0;
    }

    /**
     * Update cost tracking
     */
    private async updateCostTracking(cost: number): Promise<void> {
        const today = new Date().toISOString().split('T')[0];
        const thisMonth = new Date().toISOString().substring(0, 7);

        // Update daily costs
        const currentDaily = this.dailyCosts.get(today) || 0;
        this.dailyCosts.set(today, currentDaily + cost);

        // Update monthly costs
        const currentMonthly = this.monthlyCosts.get(thisMonth) || 0;
        this.monthlyCosts.set(thisMonth, currentMonthly + cost);

        // Check alert thresholds
        await this.checkAlertThresholds(currentDaily + cost, currentMonthly + cost);
    }

    /**
     * Check budget alert thresholds
     */
    private async checkAlertThresholds(dailySpent: number, monthlySpent: number): Promise<void> {
        for (const threshold of this.budget.alertThresholds) {
            const dailyThreshold = this.budget.dailyLimit * (threshold / 100);
            const monthlyThreshold = this.budget.monthlyLimit * (threshold / 100);

            if (dailySpent >= dailyThreshold || monthlySpent >= monthlyThreshold) {
                await this.sendBudgetAlert(threshold, dailySpent, monthlySpent);
            }
        }
    }

    /**
     * Send budget alert
     */
    private async sendBudgetAlert(threshold: number, dailySpent: number, monthlySpent: number): Promise<void> {
        console.warn(`Budget alert: ${threshold}% threshold reached. Daily: $${dailySpent.toFixed(2)}, Monthly: $${monthlySpent.toFixed(2)}`);

        // Publish alert metric
        await this.cloudWatch.send(new PutMetricDataCommand({
            Namespace: 'AI/CostOptimization',
            MetricData: [{
                MetricName: 'BudgetAlert',
                Value: threshold,
                Unit: 'Percent',
                Timestamp: new Date(),
                Dimensions: [{
                    Name: 'AlertType',
                    Value: dailySpent >= this.budget.dailyLimit * (threshold / 100) ? 'Daily' : 'Monthly'
                }]
            }]
        }));
    }

    /**
     * Publish performance metrics
     */
    private async publishMetrics(metrics: PerformanceMetrics): Promise<void> {
        const metricData = [
            {
                MetricName: 'Latency',
                Value: metrics.latency,
                Unit: 'Milliseconds'
            },
            {
                MetricName: 'Throughput',
                Value: metrics.throughput,
                Unit: 'Count/Second'
            },
            {
                MetricName: 'CacheHitRate',
                Value: metrics.cacheHitRate * 100,
                Unit: 'Percent'
            },
            {
                MetricName: 'TokenEfficiency',
                Value: metrics.tokenEfficiency,
                Unit: 'None'
            },
            {
                MetricName: 'CostPerRequest',
                Value: metrics.costPerRequest,
                Unit: 'None'
            }
        ].map(metric => ({
            ...metric,
            Timestamp: new Date()
        }));

        await this.cloudWatch.send(new PutMetricDataCommand({
            Namespace: 'AI/Performance',
            MetricData: metricData
        }));
    }

    /**
     * Get current performance metrics
     */
    getPerformanceMetrics(): PerformanceMetrics {
        const cacheStats = this.cache.getStats();

        return {
            latency: 0, // Will be updated by actual requests
            throughput: 0, // Will be updated by actual requests
            cacheHitRate: cacheStats.hitRate,
            tokenEfficiency: 0, // Will be updated by actual requests
            costPerRequest: 0 // Will be updated by actual requests
        };
    }

    /**
     * Get cost summary
     */
    getCostSummary(): {
        daily: { spent: number; limit: number; remaining: number };
        monthly: { spent: number; limit: number; remaining: number };
        cacheStats: any;
    } {
        const today = new Date().toISOString().split('T')[0];
        const thisMonth = new Date().toISOString().substring(0, 7);

        const dailySpent = this.dailyCosts.get(today) || 0;
        const monthlySpent = this.monthlyCosts.get(thisMonth) || 0;

        return {
            daily: {
                spent: dailySpent,
                limit: this.budget.dailyLimit,
                remaining: this.budget.dailyLimit - dailySpent
            },
            monthly: {
                spent: monthlySpent,
                limit: this.budget.monthlyLimit,
                remaining: this.budget.monthlyLimit - monthlySpent
            },
            cacheStats: this.cache.getStats()
        };
    }

    /**
     * Clear cache
     */
    clearCache(): void {
        this.cache.clear();
    }

    /**
     * Reset cost tracking
     */
    resetCostTracking(): void {
        this.dailyCosts.clear();
        this.monthlyCosts.clear();
    }
}