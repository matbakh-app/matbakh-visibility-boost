import { RouterPolicyEngine } from '../router-policy-engine';
import { ModelSpec } from '../types';

describe('RouterPolicyEngine', () => {
    const models: ModelSpec[] = [
        {
            provider: 'bedrock',
            modelId: 'anthropic.claude-3-5-sonnet',
            capability: {
                contextTokens: 200000,
                supportsTools: true,
                supportsJson: true,
                supportsVision: true,
                defaultLatencyMs: 600,
                costPer1kInput: 0.003,
                costPer1kOutput: 0.015
            }
        },
        {
            provider: 'google',
            modelId: 'gemini-1.5-pro',
            capability: {
                contextTokens: 100000,
                supportsTools: true,
                supportsJson: true,
                supportsVision: true,
                defaultLatencyMs: 700,
                costPer1kInput: 0.002,
                costPer1kOutput: 0.010
            }
        },
        {
            provider: 'meta',
            modelId: 'llama-3-70b',
            capability: {
                contextTokens: 32768,
                supportsTools: false,
                supportsJson: false,
                supportsVision: false,
                defaultLatencyMs: 800,
                costPer1kInput: 0.001,
                costPer1kOutput: 0.006
            }
        },
    ];

    let engine: RouterPolicyEngine;

    beforeEach(() => {
        engine = new RouterPolicyEngine({ models, defaultTemperature: 0.2 });
    });

    describe('Basic Routing', () => {
        it('should pick a candidate that satisfies tool requirements', () => {
            const decision = engine.decide({ requireTools: true, slaMs: 1200 });

            expect(['bedrock', 'google']).toContain(decision.provider);
            expect(decision.temperature).toBeDefined();
            expect(decision.reason).toContain('picked');
        });

        it('should respect budget constraints', () => {
            const decision = engine.decide({
                maxCostEuro: 0.002,
                budgetTier: 'low'
            });

            // Should prefer cheaper models
            expect(['google', 'meta']).toContain(decision.provider);
        });

        it('should handle latency requirements', () => {
            const decision = engine.decide({ slaMs: 500 });

            // Should prefer faster models (Bedrock has lowest latency)
            expect(decision.provider).toBe('bedrock');
        });
    });

    describe('Domain-Specific Routing', () => {
        it('should prefer Claude for legal domain', () => {
            const decision = engine.decide({ domain: 'legal' });

            expect(decision.provider).toBe('bedrock');
        });

        it('should prefer Gemini for culinary domain', () => {
            const decision = engine.decide({ domain: 'culinary' });

            expect(decision.provider).toBe('google');
        });

        it('should only use Claude for medical domain', () => {
            const decision = engine.decide({ domain: 'medical' });

            expect(decision.provider).toBe('bedrock');
        });
    });

    describe('Temperature Adjustment', () => {
        it('should use lower temperature for legal domain', () => {
            const decision = engine.decide({ domain: 'legal' });

            expect(decision.temperature).toBeLessThanOrEqual(0.1);
        });

        it('should use higher temperature for culinary domain', () => {
            const decision = engine.decide({ domain: 'culinary' });

            expect(decision.temperature).toBeGreaterThan(0.2);
        });

        it('should use default temperature for general domain', () => {
            const decision = engine.decide({ domain: 'general' });

            expect(decision.temperature).toBe(0.2);
        });
    });

    describe('Constraint Handling', () => {
        it('should throw error when no models match constraints', () => {
            expect(() => {
                engine.decide({
                    requireTools: true,
                    maxCostEuro: 0.0005 // Too low for any tool-supporting model
                });
            }).toThrow('No model candidates match constraints');
        });

        it('should filter out Meta for tool requirements', () => {
            const availableModels = engine.getAvailableModels({ requireTools: true });

            expect(availableModels).toHaveLength(2);
            expect(availableModels.every(m => m.provider !== 'meta')).toBe(true);
        });
    });

    describe('Model Capability Updates', () => {
        it('should update model capabilities', () => {
            const originalLatency = models[0].capability.defaultLatencyMs;

            engine.updateModelCapability('bedrock', 'anthropic.claude-3-5-sonnet', {
                defaultLatencyMs: 400
            });

            expect(models[0].capability.defaultLatencyMs).toBe(400);
            expect(models[0].capability.defaultLatencyMs).not.toBe(originalLatency);
        });

        it('should not update non-existent models', () => {
            expect(() => {
                engine.updateModelCapability('nonexistent', 'model', { defaultLatencyMs: 100 });
            }).not.toThrow();
        });
    });

    describe('Available Models', () => {
        it('should return all models for unconstrained context', () => {
            const available = engine.getAvailableModels({});

            expect(available).toHaveLength(3);
        });

        it('should filter models based on tool requirements', () => {
            const available = engine.getAvailableModels({ requireTools: true });

            expect(available).toHaveLength(2);
            expect(available.every(m => m.capability.supportsTools)).toBe(true);
        });

        it('should filter models based on budget constraints', () => {
            const available = engine.getAvailableModels({ maxCostEuro: 0.002 });

            expect(available.every(m => m.capability.costPer1kInput <= 0.002)).toBe(true);
        });
    });
});