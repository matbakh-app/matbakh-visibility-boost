import { EvidentlyClient, PutProjectEventsCommand } from '@aws-sdk/client-evidently';
import { randomUUID } from 'crypto';

export interface ArmStats {
    wins: number;
    trials: number;
    costEuro: number;
    totalLatencyMs: number;
}

export type Arm = 'bedrock' | 'google' | 'meta';

export interface BanditContext {
    domain?: string;
    budgetTier?: string;
    requireTools?: boolean;
    userId?: string;
}

export class ThompsonBandit {
    private arms: Record<Arm, ArmStats> = {
        bedrock: { wins: 0, trials: 0, costEuro: 0, totalLatencyMs: 0 },
        google: { wins: 0, trials: 0, costEuro: 0, totalLatencyMs: 0 },
        meta: { wins: 0, trials: 0, costEuro: 0, totalLatencyMs: 0 },
    };

    // Contextual bandit - different arms for different contexts
    private contextualArms: Map<string, Record<Arm, ArmStats>> = new Map();

    choose(context?: BanditContext): Arm {
        const contextKey = this.getContextKey(context);
        const arms = this.getArmsForContext(contextKey);

        const sampleBeta = (alpha: number, beta: number) => {
            // Simple Beta(α, β) sampler via mean approximation for brevity
            // In production, use proper Beta distribution sampling
            if (alpha + beta === 0) return Math.random();
            return alpha / (alpha + beta) + (Math.random() - 0.5) * 0.1;
        };

        let best: Arm = 'bedrock';
        let bestScore = -1;

        (Object.keys(arms) as Arm[]).forEach(arm => {
            const stats = arms[arm];

            // Thompson Sampling with Beta distribution
            const alpha = 1 + stats.wins;
            const beta = 1 + (stats.trials - stats.wins);
            let score = sampleBeta(alpha, beta);

            // Adjust score based on context preferences
            score = this.adjustScoreForContext(score, arm, context);

            if (score > bestScore) {
                bestScore = score;
                best = arm;
            }
        });

        return best;
    }

    record(arm: Arm, win: boolean, costEuro: number, latencyMs: number, context?: BanditContext) {
        const contextKey = this.getContextKey(context);
        const arms = this.getArmsForContext(contextKey);

        const stats = arms[arm];
        stats.trials += 1;
        stats.wins += win ? 1 : 0;
        stats.costEuro += costEuro;
        stats.totalLatencyMs += latencyMs;

        // Also update global stats
        const globalStats = this.arms[arm];
        globalStats.trials += 1;
        globalStats.wins += win ? 1 : 0;
        globalStats.costEuro += costEuro;
        globalStats.totalLatencyMs += latencyMs;
    }

    getStats(context?: BanditContext): Record<Arm, ArmStats & { winRate: number; avgLatency: number; avgCost: number }> {
        const contextKey = this.getContextKey(context);
        const arms = this.getArmsForContext(contextKey);

        const result = {} as any;
        (Object.keys(arms) as Arm[]).forEach(arm => {
            const stats = arms[arm];
            result[arm] = {
                ...stats,
                winRate: stats.trials > 0 ? stats.wins / stats.trials : 0,
                avgLatency: stats.trials > 0 ? stats.totalLatencyMs / stats.trials : 0,
                avgCost: stats.trials > 0 ? stats.costEuro / stats.trials : 0,
            };
        });

        return result;
    }

    private getContextKey(context?: BanditContext): string {
        if (!context) return 'global';

        const parts = [
            context.domain || 'general',
            context.budgetTier || 'standard',
            context.requireTools ? 'tools' : 'no-tools'
        ];

        return parts.join('|');
    }

    private getArmsForContext(contextKey: string): Record<Arm, ArmStats> {
        if (!this.contextualArms.has(contextKey)) {
            this.contextualArms.set(contextKey, {
                bedrock: { wins: 0, trials: 0, costEuro: 0, totalLatencyMs: 0 },
                google: { wins: 0, trials: 0, costEuro: 0, totalLatencyMs: 0 },
                meta: { wins: 0, trials: 0, costEuro: 0, totalLatencyMs: 0 },
            });
        }
        return this.contextualArms.get(contextKey)!;
    }

    private adjustScoreForContext(score: number, arm: Arm, context?: BanditContext): number {
        if (!context) return score;

        // Domain-specific adjustments
        if (context.domain === 'legal' && arm === 'bedrock') {
            score += 0.1; // Prefer Claude for legal
        }
        if (context.domain === 'culinary' && arm === 'google') {
            score += 0.05; // Slight preference for Gemini in culinary
        }
        if (context.domain === 'medical' && arm !== 'bedrock') {
            score -= 0.2; // Strong preference for Claude in medical
        }

        // Budget tier adjustments
        if (context.budgetTier === 'low' && arm === 'meta') {
            score += 0.1; // Prefer cheaper models for low budget
        }
        if (context.budgetTier === 'premium' && arm === 'bedrock') {
            score += 0.05; // Slight preference for premium models
        }

        // Tool requirements
        if (context.requireTools && arm === 'meta') {
            score -= 0.3; // Meta doesn't support tools well
        }

        return Math.max(0, Math.min(1, score));
    }

    // Reset stats for a specific context (useful for A/B test resets)
    resetContext(context?: BanditContext) {
        const contextKey = this.getContextKey(context);
        this.contextualArms.delete(contextKey);
    }

    // Get the best performing arm for a context
    getBestArm(context?: BanditContext): { arm: Arm; confidence: number } {
        const stats = this.getStats(context);
        let bestArm: Arm = 'bedrock';
        let bestWinRate = -1;

        (Object.keys(stats) as Arm[]).forEach(arm => {
            const armStats = stats[arm];
            if (armStats.trials > 10 && armStats.winRate > bestWinRate) { // Minimum trials for confidence
                bestWinRate = armStats.winRate;
                bestArm = arm;
            }
        });

        const confidence = stats[bestArm].trials > 50 ?
            Math.min(0.95, stats[bestArm].winRate + 0.1) :
            Math.max(0.5, stats[bestArm].winRate);

        return { arm: bestArm, confidence };
    }
}

export interface BanditLoggerOpts {
    project: string; // Evidently project name
    client?: EvidentlyClient;
}

export class BanditLogger {
    private client: EvidentlyClient;

    constructor(private readonly opts: BanditLoggerOpts) {
        this.client = opts.client ?? new EvidentlyClient({});
    }

    async logOutcome(params: {
        userId?: string;
        arm: Arm;
        success: boolean;
        latencyMs: number;
        costEuro: number;
        domain?: string;
        budgetTier?: string;
        requireTools?: boolean;
        requestId?: string;
    }) {
        const {
            userId,
            arm,
            success,
            latencyMs,
            costEuro,
            domain,
            budgetTier,
            requireTools,
            requestId
        } = params;

        const entityId = userId ?? randomUUID();

        try {
            await this.client.send(new PutProjectEventsCommand({
                project: this.opts.project,
                events: [{
                    timestamp: new Date(),
                    type: 'aws.evidently.custom',
                    data: {
                        // Core metrics
                        model_route: arm,
                        success,
                        latency_ms: latencyMs,
                        cost_euro: costEuro,

                        // Context information
                        domain: domain || 'general',
                        budget_tier: budgetTier || 'standard',
                        require_tools: requireTools || false,

                        // Tracking
                        request_id: requestId || randomUUID(),
                        timestamp: Date.now(),
                    },
                    entityId,
                }],
            }));
        } catch (error) {
            // Log error but don't throw - logging failures shouldn't break the main flow
            console.error('Failed to log bandit outcome to Evidently:', error);
        }
    }

    async logExperimentEvent(params: {
        userId?: string;
        experimentName: string;
        variation: string;
        metricName: string;
        metricValue: number;
        context?: Record<string, any>;
    }) {
        const { userId, experimentName, variation, metricName, metricValue, context } = params;
        const entityId = userId ?? randomUUID();

        try {
            await this.client.send(new PutProjectEventsCommand({
                project: this.opts.project,
                events: [{
                    timestamp: new Date(),
                    type: 'aws.evidently.custom',
                    data: {
                        experiment_name: experimentName,
                        variation,
                        metric_name: metricName,
                        metric_value: metricValue,
                        ...context,
                    },
                    entityId,
                }],
            }));
        } catch (error) {
            console.error('Failed to log experiment event to Evidently:', error);
        }
    }

    // Batch logging for better performance
    async logBatch(events: Array<{
        userId?: string;
        arm: Arm;
        success: boolean;
        latencyMs: number;
        costEuro: number;
        domain?: string;
        requestId?: string;
    }>) {
        if (events.length === 0) return;

        try {
            const evidentlyEvents = events.map(event => ({
                timestamp: new Date(),
                type: 'aws.evidently.custom' as const,
                data: {
                    model_route: event.arm,
                    success: event.success,
                    latency_ms: event.latencyMs,
                    cost_euro: event.costEuro,
                    domain: event.domain || 'general',
                    request_id: event.requestId || randomUUID(),
                },
                entityId: event.userId ?? randomUUID(),
            }));

            await this.client.send(new PutProjectEventsCommand({
                project: this.opts.project,
                events: evidentlyEvents,
            }));
        } catch (error) {
            console.error('Failed to log batch events to Evidently:', error);
        }
    }
}