import { EvidentlyClient } from '@aws-sdk/client-evidently';
import { BanditLogger, ThompsonBandit } from '../bandit-controller';

// Mock AWS SDK
const mockSend = jest.fn();
jest.mock('@aws-sdk/client-evidently', () => ({
    EvidentlyClient: jest.fn().mockImplementation(() => ({
        send: mockSend
    })),
    PutProjectEventsCommand: jest.fn().mockImplementation((input) => ({ input }))
}));

describe('ThompsonBandit', () => {
    let bandit: ThompsonBandit;

    beforeEach(() => {
        bandit = new ThompsonBandit();
    });

    describe('Basic Bandit Operations', () => {
        it('should choose an arm', () => {
            const arm = bandit.choose();
            expect(['bedrock', 'google', 'meta']).toContain(arm);
        });

        it('should record outcomes', () => {
            const arm = bandit.choose();
            bandit.record(arm, true, 0.001, 500);

            const stats = bandit.getStats();
            expect(stats[arm].trials).toBe(1);
            expect(stats[arm].wins).toBe(1);
            expect(stats[arm].costEuro).toBe(0.001);
            expect(stats[arm].totalLatencyMs).toBe(500);
        });

        it('should calculate win rates correctly', () => {
            bandit.record('bedrock', true, 0.001, 500);
            bandit.record('bedrock', false, 0.001, 600);
            bandit.record('bedrock', true, 0.001, 550);

            const stats = bandit.getStats();
            expect(stats.bedrock.winRate).toBe(2 / 3);
            expect(stats.bedrock.avgLatency).toBe((500 + 600 + 550) / 3);
            expect(stats.bedrock.avgCost).toBe(0.001);
        });
    });

    describe('Contextual Bandit', () => {
        it('should handle different contexts', () => {
            const context1 = { domain: 'legal', budgetTier: 'premium' };
            const context2 = { domain: 'culinary', budgetTier: 'low' };

            const arm1 = bandit.choose(context1);
            const arm2 = bandit.choose(context2);

            expect(['bedrock', 'google', 'meta']).toContain(arm1);
            expect(['bedrock', 'google', 'meta']).toContain(arm2);
        });

        it('should maintain separate stats per context', () => {
            const context1 = { domain: 'legal' };
            const context2 = { domain: 'culinary' };

            bandit.record('bedrock', true, 0.001, 500, context1);
            bandit.record('google', true, 0.001, 600, context2);

            const stats1 = bandit.getStats(context1);
            const stats2 = bandit.getStats(context2);

            expect(stats1.bedrock.trials).toBe(1);
            expect(stats1.google.trials).toBe(0);
            expect(stats2.bedrock.trials).toBe(0);
            expect(stats2.google.trials).toBe(1);
        });

        it('should prefer appropriate models for contexts', () => {
            // Simulate legal domain preference for bedrock
            const legalContext = { domain: 'legal' };

            // Record many successful outcomes for bedrock in legal context
            for (let i = 0; i < 20; i++) {
                bandit.record('bedrock', true, 0.001, 500, legalContext);
                bandit.record('google', false, 0.001, 700, legalContext);
            }

            const bestArm = bandit.getBestArm(legalContext);
            expect(bestArm.arm).toBe('bedrock');
            expect(bestArm.confidence).toBeGreaterThan(0.8);
        });
    });

    describe('Context Key Generation', () => {
        it('should generate consistent context keys', () => {
            const context = { domain: 'legal', budgetTier: 'premium', requireTools: true };

            // Choose multiple times with same context
            bandit.record('bedrock', true, 0.001, 500, context);
            bandit.record('bedrock', true, 0.001, 500, context);

            const stats = bandit.getStats(context);
            expect(stats.bedrock.trials).toBe(2);
        });

        it('should handle undefined context', () => {
            bandit.record('bedrock', true, 0.001, 500);
            bandit.record('bedrock', true, 0.001, 500, undefined);

            const stats = bandit.getStats();
            expect(stats.bedrock.trials).toBe(2);
        });
    });

    describe('Best Arm Selection', () => {
        it('should return bedrock as default when no data', () => {
            const bestArm = bandit.getBestArm();
            expect(bestArm.arm).toBe('bedrock');
            expect(bestArm.confidence).toBe(0.5);
        });

        it('should identify best performing arm with sufficient data', () => {
            // Make google clearly better
            for (let i = 0; i < 15; i++) {
                bandit.record('google', true, 0.001, 400);
                bandit.record('bedrock', false, 0.002, 600);
                bandit.record('meta', false, 0.001, 800);
            }

            const bestArm = bandit.getBestArm();
            expect(bestArm.arm).toBe('google');
            expect(bestArm.confidence).toBeGreaterThan(0.8);
        });
    });

    describe('Context Reset', () => {
        it('should reset specific context', () => {
            const context = { domain: 'legal' };

            bandit.record('bedrock', true, 0.001, 500, context);
            expect(bandit.getStats(context).bedrock.trials).toBe(1);

            bandit.resetContext(context);
            expect(bandit.getStats(context).bedrock.trials).toBe(0);
        });

        it('should not affect other contexts when resetting', () => {
            const context1 = { domain: 'legal' };
            const context2 = { domain: 'culinary' };

            bandit.record('bedrock', true, 0.001, 500, context1);
            bandit.record('google', true, 0.001, 600, context2);

            bandit.resetContext(context1);

            expect(bandit.getStats(context1).bedrock.trials).toBe(0);
            expect(bandit.getStats(context2).google.trials).toBe(1);
        });
    });
});

describe('BanditLogger', () => {
    let logger: BanditLogger;
    let mockClient: jest.Mocked<EvidentlyClient>;

    beforeEach(() => {
        mockSend.mockClear();
        mockSend.mockResolvedValue({});

        mockClient = {
            send: mockSend
        };

        logger = new BanditLogger({
            project: 'test-project',
            client: mockClient,
        });
    });

    describe('Outcome Logging', () => {
        it('should log outcome to Evidently', async () => {
            await logger.logOutcome({
                userId: 'user123',
                arm: 'bedrock',
                success: true,
                latencyMs: 500,
                costEuro: 0.001,
                domain: 'legal',
                budgetTier: 'premium',
                requireTools: true,
                requestId: 'req123',
            });

            expect(mockClient.send).toHaveBeenCalledTimes(1);
            const call = mockClient.send.mock.calls[0][0];
            expect(call.input.project).toBe('test-project');
            expect(call.input.events).toHaveLength(1);

            const event = call.input.events[0];
            expect(event.data.model_route).toBe('bedrock');
            expect(event.data.success).toBe(true);
            expect(event.data.latency_ms).toBe(500);
            expect(event.data.cost_euro).toBe(0.001);
            expect(event.data.domain).toBe('legal');
            expect(event.entityId).toBe('user123');
        });

        it('should handle logging errors gracefully', async () => {
            mockClient.send.mockRejectedValue(new Error('Network error'));

            // Should not throw
            await expect(logger.logOutcome({
                arm: 'bedrock',
                success: true,
                latencyMs: 500,
                costEuro: 0.001,
            })).resolves.not.toThrow();
        });

        it('should generate entity ID when userId not provided', async () => {
            await logger.logOutcome({
                arm: 'bedrock',
                success: true,
                latencyMs: 500,
                costEuro: 0.001,
            });

            const call = mockClient.send.mock.calls[0][0];
            const event = call.input.events[0];
            expect(event.entityId).toBeDefined();
            expect(typeof event.entityId).toBe('string');
        });
    });

    describe('Experiment Logging', () => {
        it('should log experiment events', async () => {
            await logger.logExperimentEvent({
                userId: 'user123',
                experimentName: 'model-routing-test',
                variation: 'treatment-a',
                metricName: 'conversion_rate',
                metricValue: 0.85,
                context: { segment: 'premium' },
            });

            expect(mockClient.send).toHaveBeenCalledTimes(1);
            const call = mockClient.send.mock.calls[0][0];
            const event = call.input.events[0];

            expect(event.data.experiment_name).toBe('model-routing-test');
            expect(event.data.variation).toBe('treatment-a');
            expect(event.data.metric_name).toBe('conversion_rate');
            expect(event.data.metric_value).toBe(0.85);
            expect(event.data.segment).toBe('premium');
        });
    });

    describe('Batch Logging', () => {
        it('should log multiple events in batch', async () => {
            const events = [
                { arm: 'bedrock' as const, success: true, latencyMs: 500, costEuro: 0.001 },
                { arm: 'google' as const, success: false, latencyMs: 800, costEuro: 0.002 },
                { arm: 'meta' as const, success: true, latencyMs: 600, costEuro: 0.0005 },
            ];

            await logger.logBatch(events);

            expect(mockClient.send).toHaveBeenCalledTimes(1);
            const call = mockClient.send.mock.calls[0][0];
            expect(call.input.events).toHaveLength(3);
        });

        it('should handle empty batch', async () => {
            await logger.logBatch([]);
            expect(mockClient.send).not.toHaveBeenCalled();
        });
    });
});