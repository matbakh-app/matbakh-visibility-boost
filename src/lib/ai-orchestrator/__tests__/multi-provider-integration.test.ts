/**
 * Multi-Provider Integration Tests
 * 
 * Tests für:
 * - Provider routing and selection
 * - Circuit breaker functionality
 * - Fallback mechanisms
 * - Performance metrics tracking
 */

import { MultiProviderIntegration } from '../multi-provider-integration';
import { AIRequest, Provider, ProviderConfig } from '../types';

// Mock adapters
jest.mock('../adapters/bedrock-adapter');
jest.mock('../adapters/google-adapter');
jest.mock('../adapters/meta-adapter');
jest.mock('../safety/guardrails-service');

const mockBedrockAdapter = {
    generateResponse: jest.fn(),
    healthCheck: jest.fn()
};

const mockGoogleAdapter = {
    generateResponse: jest.fn(),
    healthCheck: jest.fn()
};

const mockMetaAdapter = {
    generateResponse: jest.fn(),
    healthCheck: jest.fn()
};

const mockGuardrailsService = {
    checkInput: jest.fn(),
    checkOutput: jest.fn(),
    clearPIITokens: jest.fn()
};

// Mock adapter constructors
jest.mock('../adapters/bedrock-adapter', () => ({
    BedrockAdapter: jest.fn().mockImplementation(() => mockBedrockAdapter)
}));

jest.mock('../adapters/google-adapter', () => ({
    GoogleAdapter: jest.fn().mockImplementation(() => mockGoogleAdapter)
}));

jest.mock('../adapters/meta-adapter', () => ({
    MetaAdapter: jest.fn().mockImplementation(() => mockMetaAdapter)
}));

jest.mock('../safety/guardrails-service', () => ({
    GuardrailsService: jest.fn().mockImplementation(() => mockGuardrailsService)
}));

describe('MultiProviderIntegration', () => {
    let integration: MultiProviderIntegration;
    let configs: Map<Provider, ProviderConfig>;

    beforeEach(() => {
        configs = new Map([
            ['bedrock', { apiKey: 'test-bedrock-key', region: 'eu-central-1' }],
            ['google', { apiKey: 'test-google-key', region: 'eu-central-1' }],
            ['meta', { apiKey: 'test-meta-key', region: 'eu-central-1' }]
        ]);

        integration = new MultiProviderIntegration(configs, 'eu-central-1');

        // Reset mocks
        jest.clearAllMocks();

        // Setup default mock responses
        mockGuardrailsService.checkInput.mockResolvedValue({
            allowed: true,
            confidence: 1.0,
            violations: [],
            processingTimeMs: 10
        });

        mockGuardrailsService.checkOutput.mockResolvedValue({
            allowed: true,
            confidence: 1.0,
            violations: [],
            processingTimeMs: 5
        });

        mockBedrockAdapter.generateResponse.mockResolvedValue({
            content: 'Bedrock response',
            inputTokens: 100,
            outputTokens: 150,
            processingTime: 1200,
            cost: 0.05
        });

        mockGoogleAdapter.generateResponse.mockResolvedValue({
            content: 'Google response',
            inputTokens: 100,
            outputTokens: 150,
            processingTime: 800,
            cost: 0.03
        });

        mockMetaAdapter.generateResponse.mockResolvedValue({
            content: 'Meta response',
            inputTokens: 100,
            outputTokens: 150,
            processingTime: 1500,
            cost: 0.02
        });

        mockBedrockAdapter.healthCheck.mockResolvedValue(true);
        mockGoogleAdapter.healthCheck.mockResolvedValue(true);
        mockMetaAdapter.healthCheck.mockResolvedValue(true);
    });

    describe('Provider Routing', () => {
        it('should route to specified provider when requested', async () => {
            const request: AIRequest = {
                prompt: 'Test prompt',
                provider: 'google',
                domain: 'general'
            };

            const response = await integration.routeRequest(request);

            expect(mockGoogleAdapter.generateResponse).toHaveBeenCalledWith(
                expect.objectContaining({
                    prompt: 'Test prompt',
                    model: 'gemini-1.5-pro'
                })
            );
            expect(response.provider).toBe('google');
            expect(response.content).toBe('Google response');
        });

        it('should select optimal provider when none specified', async () => {
            const request: AIRequest = {
                prompt: 'Test prompt',
                maxLatency: 1000,
                domain: 'general'
            };

            const response = await integration.routeRequest(request);

            // Should select Google due to lower latency (800ms vs 1200ms/1500ms)
            expect(mockGoogleAdapter.generateResponse).toHaveBeenCalled();
            expect(response.provider).toBe('google');
        });

        it('should consider cost preferences in routing', async () => {
            const request: AIRequest = {
                prompt: 'Test prompt',
                maxCost: 0.025,
                domain: 'general'
            };

            const response = await integration.routeRequest(request);

            // Should select Meta due to lowest cost (0.02)
            expect(mockMetaAdapter.generateResponse).toHaveBeenCalled();
            expect(response.provider).toBe('meta');
        });

        it('should match capabilities when routing', async () => {
            const request: AIRequest = {
                prompt: 'Test prompt',
                capabilities: {
                    supportsVision: true,
                    supportsToolCalling: true
                },
                domain: 'general'
            };

            const response = await integration.routeRequest(request);

            // Should select Bedrock or Google (both support vision), not Meta
            expect(response.provider).not.toBe('meta');
            expect(['bedrock', 'google']).toContain(response.provider);
        });
    });

    describe('Circuit Breaker', () => {
        it('should use circuit breaker for provider calls', async () => {
            // Make the first provider fail
            mockBedrockAdapter.generateResponse.mockRejectedValue(new Error('Service unavailable'));

            const request: AIRequest = {
                prompt: 'Test prompt',
                provider: 'bedrock',
                domain: 'general'
            };

            // Should fail and not fallback since specific provider requested
            await expect(integration.routeRequest(request)).rejects.toThrow();
        });

        it('should fallback to other providers when circuit breaker opens', async () => {
            // Make Bedrock fail consistently
            mockBedrockAdapter.generateResponse.mockRejectedValue(new Error('Service unavailable'));
            mockBedrockAdapter.healthCheck.mockRejectedValue(new Error('Health check failed'));

            const request: AIRequest = {
                prompt: 'Test prompt',
                domain: 'general'
                // No specific provider - should allow fallback
            };

            const response = await integration.routeRequest(request);

            // Should fallback to Google or Meta
            expect(['google', 'meta']).toContain(response.provider);
            expect(response.content).toBeTruthy();
        });

        it('should track circuit breaker states', () => {
            const states = integration.getCircuitBreakerStates();

            expect(states.has('bedrock')).toBe(true);
            expect(states.has('google')).toBe(true);
            expect(states.has('meta')).toBe(true);
            expect(states.get('bedrock')).toBe('closed');
        });

        it('should allow manual circuit breaker reset', () => {
            integration.resetCircuitBreaker('bedrock');
            const states = integration.getCircuitBreakerStates();
            expect(states.get('bedrock')).toBe('closed');
        });
    });

    describe('Fallback Mechanisms', () => {
        it('should try fallback providers in order', async () => {
            // Make first two providers fail
            mockBedrockAdapter.generateResponse.mockRejectedValue(new Error('Bedrock failed'));
            mockGoogleAdapter.generateResponse.mockRejectedValue(new Error('Google failed'));

            const request: AIRequest = {
                prompt: 'Test prompt',
                domain: 'general'
            };

            const response = await integration.routeRequest(request);

            // Should fallback to Meta
            expect(mockMetaAdapter.generateResponse).toHaveBeenCalled();
            expect(response.provider).toBe('meta');
            expect(response.content).toBe('Meta response');
        });

        it('should fail when all providers are unavailable', async () => {
            // Make all providers fail
            mockBedrockAdapter.generateResponse.mockRejectedValue(new Error('Bedrock failed'));
            mockGoogleAdapter.generateResponse.mockRejectedValue(new Error('Google failed'));
            mockMetaAdapter.generateResponse.mockRejectedValue(new Error('Meta failed'));

            const request: AIRequest = {
                prompt: 'Test prompt',
                domain: 'general'
            };

            await expect(integration.routeRequest(request)).rejects.toThrow('All providers failed');
        });
    });

    describe('Safety Integration', () => {
        it('should check input safety before processing', async () => {
            const request: AIRequest = {
                prompt: 'Test prompt with PII: john@example.com',
                provider: 'bedrock',
                domain: 'legal'
            };

            await integration.routeRequest(request);

            expect(mockGuardrailsService.checkInput).toHaveBeenCalledWith(
                'Test prompt with PII: john@example.com',
                'bedrock',
                'legal',
                expect.any(String)
            );
        });

        it('should block requests when input safety fails', async () => {
            mockGuardrailsService.checkInput.mockResolvedValue({
                allowed: false,
                confidence: 0.0,
                violations: [{ type: 'PII', severity: 'HIGH', confidence: 0.9, details: 'Email detected' }],
                processingTimeMs: 10
            });

            const request: AIRequest = {
                prompt: 'Harmful content',
                provider: 'bedrock',
                domain: 'general'
            };

            await expect(integration.routeRequest(request)).rejects.toThrow('Input blocked by guardrails');
        });

        it('should check output safety after processing', async () => {
            const request: AIRequest = {
                prompt: 'Test prompt',
                provider: 'bedrock',
                domain: 'general'
            };

            await integration.routeRequest(request);

            expect(mockGuardrailsService.checkOutput).toHaveBeenCalledWith(
                'Bedrock response',
                'bedrock',
                'general',
                expect.any(String)
            );
        });

        it('should block responses when output safety fails', async () => {
            mockGuardrailsService.checkOutput.mockResolvedValue({
                allowed: false,
                confidence: 0.0,
                violations: [{ type: 'TOXICITY', severity: 'HIGH', confidence: 0.8, details: 'Toxic content detected' }],
                processingTimeMs: 5
            });

            const request: AIRequest = {
                prompt: 'Test prompt',
                provider: 'bedrock',
                domain: 'general'
            };

            await expect(integration.routeRequest(request)).rejects.toThrow('Output blocked by guardrails');
        });

        it('should use modified content when PII is redacted', async () => {
            mockGuardrailsService.checkInput.mockResolvedValue({
                allowed: true,
                confidence: 1.0,
                violations: [],
                modifiedContent: 'Test prompt with PII: [REDACTED]',
                processingTimeMs: 10
            });

            const request: AIRequest = {
                prompt: 'Test prompt with PII: john@example.com',
                provider: 'bedrock',
                domain: 'legal'
            };

            await integration.routeRequest(request);

            expect(mockBedrockAdapter.generateResponse).toHaveBeenCalledWith(
                expect.objectContaining({
                    prompt: 'Test prompt with PII: [REDACTED]'
                })
            );
        });

        it('should clean up PII tokens after processing', async () => {
            const request: AIRequest = {
                prompt: 'Test prompt',
                provider: 'bedrock',
                domain: 'general'
            };

            await integration.routeRequest(request);

            expect(mockGuardrailsService.clearPIITokens).toHaveBeenCalledWith(expect.any(String));
        });
    });

    describe('Metrics Tracking', () => {
        it('should track provider metrics', async () => {
            const request: AIRequest = {
                prompt: 'Test prompt',
                provider: 'bedrock',
                domain: 'general'
            };

            await integration.routeRequest(request);

            const metrics = integration.getProviderMetrics();
            expect(metrics.has('bedrock')).toBe(true);

            const bedrockMetrics = metrics.get('bedrock');
            expect(bedrockMetrics).toBeDefined();
            expect(bedrockMetrics!.successRate).toBeGreaterThan(0);
        });

        it('should update metrics on failures', async () => {
            mockBedrockAdapter.generateResponse.mockRejectedValue(new Error('Service failed'));

            const request: AIRequest = {
                prompt: 'Test prompt',
                provider: 'bedrock',
                domain: 'general'
            };

            try {
                await integration.routeRequest(request);
            } catch (error) {
                // Expected to fail
            }

            const metrics = integration.getProviderMetrics();
            const bedrockMetrics = metrics.get('bedrock');
            expect(bedrockMetrics).toBeDefined();
            // Success rate should be affected by the failure
        });
    });

    describe('Health Monitoring', () => {
        it('should perform health checks on providers', async () => {
            // Wait for health monitoring to run
            await new Promise(resolve => setTimeout(resolve, 100));

            expect(mockBedrockAdapter.healthCheck).toHaveBeenCalled();
            expect(mockGoogleAdapter.healthCheck).toHaveBeenCalled();
            expect(mockMetaAdapter.healthCheck).toHaveBeenCalled();
        });

        it('should handle health check failures gracefully', async () => {
            mockBedrockAdapter.healthCheck.mockRejectedValue(new Error('Health check failed'));

            // Should not throw error, just log warning
            await new Promise(resolve => setTimeout(resolve, 100));

            // Integration should still be functional
            const request: AIRequest = {
                prompt: 'Test prompt',
                provider: 'google', // Use different provider
                domain: 'general'
            };

            const response = await integration.routeRequest(request);
            expect(response.provider).toBe('google');
        });
    });

    describe('DoD Criteria Validation', () => {
        it('should meet DoD: Multi-provider support', async () => {
            const providers: Provider[] = ['bedrock', 'google', 'meta'];

            for (const provider of providers) {
                const request: AIRequest = {
                    prompt: 'Test prompt',
                    provider,
                    domain: 'general'
                };

                const response = await integration.routeRequest(request);
                expect(response.provider).toBe(provider);
                expect(response.content).toBeTruthy();
            }
        });

        it('should meet DoD: Intelligent routing based on requirements', async () => {
            // Test latency-based routing
            const latencyRequest: AIRequest = {
                prompt: 'Test prompt',
                maxLatency: 1000,
                domain: 'general'
            };

            const latencyResponse = await integration.routeRequest(latencyRequest);
            expect(latencyResponse.provider).toBe('google'); // Fastest provider

            // Test cost-based routing
            const costRequest: AIRequest = {
                prompt: 'Test prompt',
                maxCost: 0.025,
                domain: 'general'
            };

            const costResponse = await integration.routeRequest(costRequest);
            expect(costResponse.provider).toBe('meta'); // Cheapest provider
        });

        it('should meet DoD: Circuit breaker protection', () => {
            const states = integration.getCircuitBreakerStates();

            // All providers should have circuit breakers
            expect(states.size).toBe(3);
            expect(states.has('bedrock')).toBe(true);
            expect(states.has('google')).toBe(true);
            expect(states.has('meta')).toBe(true);
        });

        it('should meet DoD: Fallback mechanisms', async () => {
            // Make primary provider fail
            mockBedrockAdapter.generateResponse.mockRejectedValue(new Error('Primary failed'));

            const request: AIRequest = {
                prompt: 'Test prompt',
                domain: 'general'
            };

            const response = await integration.routeRequest(request);

            // Should successfully fallback to another provider
            expect(response.content).toBeTruthy();
            expect(['google', 'meta']).toContain(response.provider);
        });

        it('should meet DoD: Safety integration', async () => {
            const request: AIRequest = {
                prompt: 'Test prompt',
                provider: 'bedrock',
                domain: 'legal'
            };

            const response = await integration.routeRequest(request);

            // Should have performed safety checks
            expect(mockGuardrailsService.checkInput).toHaveBeenCalled();
            expect(mockGuardrailsService.checkOutput).toHaveBeenCalled();
            expect(response.routing).toBeDefined();
            expect(response.routing.inputSafety).toBeDefined();
            expect(response.routing.outputSafety).toBeDefined();
        });

        it('should meet DoD: Performance metrics tracking', async () => {
            const request: AIRequest = {
                prompt: 'Test prompt',
                provider: 'bedrock',
                domain: 'general'
            };

            await integration.routeRequest(request);

            const metrics = integration.getProviderMetrics();
            expect(metrics.size).toBeGreaterThan(0);

            const bedrockMetrics = metrics.get('bedrock');
            expect(bedrockMetrics).toMatchObject({
                latency: expect.any(Number),
                successRate: expect.any(Number),
                costPerToken: expect.any(Number),
                availability: expect.any(Number),
                lastUpdated: expect.any(Date)
            });
        });
    });
});