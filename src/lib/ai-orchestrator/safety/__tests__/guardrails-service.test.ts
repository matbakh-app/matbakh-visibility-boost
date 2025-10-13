/**
 * Guardrails Service Tests
 * 
 * Tests für:
 * - Bedrock Guardrails Integration
 * - Multi-Provider Safety Checks
 * - PII Sanitization
 * - Error Handling
 */

import {
    BedrockGuardrailsService,
    GuardrailsService
} from '../guardrails-service';

// Mock AWS SDK
jest.mock('@aws-sdk/client-bedrock-runtime');
jest.mock('@aws-sdk/client-comprehend');

const mockBedrockSend = jest.fn();

jest.mock('@aws-sdk/client-bedrock-runtime', () => ({
    BedrockRuntimeClient: jest.fn().mockImplementation(() => ({
        send: mockBedrockSend
    })),
    ApplyGuardrailCommand: jest.fn().mockImplementation((input) => ({ input }))
}));

describe('BedrockGuardrailsService', () => {
    let service: BedrockGuardrailsService;

    beforeEach(() => {
        service = new BedrockGuardrailsService('eu-central-1');
        mockBedrockSend.mockClear();
    });

    describe('Content Checking', () => {
        it('should allow safe content', async () => {
            mockBedrockSend.mockResolvedValue({
                action: 'NONE',
                assessments: []
            });

            const result = await service.checkContent('Hello, how are you?', 'general');

            expect(result.allowed).toBe(true);
            expect(result.confidence).toBe(1.0);
            expect(result.violations).toHaveLength(0);
            expect(mockBedrockSend).toHaveBeenCalledWith(
                expect.objectContaining({
                    input: expect.objectContaining({
                        guardrailIdentifier: 'general-domain-guardrail-v1',
                        source: 'INPUT',
                        content: [{ text: { text: 'Hello, how are you?' } }]
                    })
                })
            );
        });

        it('should block harmful content', async () => {
            mockBedrockSend.mockResolvedValue({
                action: 'GUARDRAIL_INTERVENED',
                assessments: [
                    {
                        contentPolicy: {
                            filters: [
                                {
                                    type: 'HATE',
                                    confidence: 0.9,
                                    action: 'BLOCKED'
                                }
                            ]
                        }
                    }
                ]
            });

            const result = await service.checkContent('Harmful content here', 'general');

            expect(result.allowed).toBe(false);
            expect(result.confidence).toBe(0.0);
            expect(result.violations).toHaveLength(1);
            expect(result.violations[0]).toMatchObject({
                type: 'HATE_SPEECH',
                severity: 'CRITICAL',
                confidence: 0.9
            });
        });

        it('should detect PII violations', async () => {
            mockBedrockSend.mockResolvedValue({
                action: 'GUARDRAIL_INTERVENED',
                assessments: [
                    {
                        sensitiveInformationPolicy: {
                            piiEntities: [
                                {
                                    type: 'EMAIL',
                                    match: {
                                        start: 10,
                                        end: 25
                                    }
                                }
                            ]
                        }
                    }
                ]
            });

            const result = await service.checkContent('Contact me at test@example.com', 'legal');

            expect(result.allowed).toBe(false);
            expect(result.violations).toHaveLength(1);
            expect(result.violations[0]).toMatchObject({
                type: 'PII',
                severity: 'HIGH',
                details: 'PII detected: EMAIL',
                position: { start: 10, end: 25 }
            });
        });

        it('should handle service errors gracefully', async () => {
            mockBedrockSend.mockRejectedValue(new Error('Service unavailable'));

            const result = await service.checkContent('Test content', 'general');

            expect(result.allowed).toBe(false);
            expect(result.confidence).toBe(0.0);
            expect(result.violations).toHaveLength(1);
            expect(result.violations[0]).toMatchObject({
                type: 'CUSTOM',
                severity: 'CRITICAL',
                details: 'Guardrails service error: Service unavailable'
            });
        });
    });

    describe('Domain-specific Configuration', () => {
        it('should use legal domain configuration', async () => {
            mockBedrockSend.mockResolvedValue({
                action: 'NONE',
                assessments: []
            });

            await service.checkContent('Legal content', 'legal');

            expect(mockBedrockSend).toHaveBeenCalledWith(
                expect.objectContaining({
                    input: expect.objectContaining({
                        guardrailIdentifier: 'legal-domain-guardrail-v1'
                    })
                })
            );
        });

        it('should use medical domain configuration', async () => {
            mockBedrockSend.mockResolvedValue({
                action: 'NONE',
                assessments: []
            });

            await service.checkContent('Medical content', 'medical');

            expect(mockBedrockSend).toHaveBeenCalledWith(
                expect.objectContaining({
                    input: expect.objectContaining({
                        guardrailIdentifier: 'medical-domain-guardrail-v1'
                    })
                })
            );
        });

        it('should fallback to general domain for unknown domains', async () => {
            mockBedrockSend.mockResolvedValue({
                action: 'NONE',
                assessments: []
            });

            await service.checkContent('Unknown domain content', 'unknown');

            expect(mockBedrockSend).toHaveBeenCalledWith(
                expect.objectContaining({
                    input: expect.objectContaining({
                        guardrailIdentifier: 'general-domain-guardrail-v1'
                    })
                })
            );
        });
    });
});

describe('GuardrailsService', () => {
    let service: GuardrailsService;

    beforeEach(() => {
        service = new GuardrailsService('eu-central-1');
        mockBedrockSend.mockClear();
    });

    describe('Multi-Provider Support', () => {
        it('should handle Bedrock provider input checks', async () => {
            mockBedrockSend.mockResolvedValue({
                action: 'NONE',
                assessments: []
            });

            const result = await service.checkInput('Test content', 'bedrock', 'general');

            expect(result.allowed).toBe(true);
            expect(mockBedrockSend).toHaveBeenCalled();
        });

        it('should handle Google provider input checks', async () => {
            const result = await service.checkInput('Test content', 'google', 'general');

            expect(result.allowed).toBe(true);
            expect(result.confidence).toBe(1.0);
            expect(result.violations).toHaveLength(0);
            // Google sollte keine Bedrock-Calls machen
            expect(mockBedrockSend).not.toHaveBeenCalled();
        });

        it('should handle Meta provider input checks', async () => {
            const result = await service.checkInput('Test content', 'meta', 'general');

            expect(result.allowed).toBe(true);
            expect(result.confidence).toBe(1.0);
            expect(result.violations).toHaveLength(0);
            // Meta sollte keine Bedrock-Calls machen
            expect(mockBedrockSend).not.toHaveBeenCalled();
        });

        it('should throw error for unsupported providers', async () => {
            await expect(
                service.checkInput('Test content', 'unsupported' as any, 'general')
            ).rejects.toThrow('Unsupported provider for guardrails: unsupported');
        });
    });

    describe('Output Checking', () => {
        it('should handle Bedrock provider output checks', async () => {
            mockBedrockSend.mockResolvedValue({
                action: 'NONE',
                assessments: []
            });

            const result = await service.checkOutput('Test output', 'bedrock', 'general');

            expect(result.allowed).toBe(true);
            expect(mockBedrockSend).toHaveBeenCalledWith(
                expect.objectContaining({
                    input: expect.objectContaining({
                        source: 'OUTPUT'
                    })
                })
            );
        });

        it('should handle Google provider output checks', async () => {
            const result = await service.checkOutput('Test output', 'google', 'general');

            expect(result.allowed).toBe(true);
            expect(result.confidence).toBe(1.0);
            expect(mockBedrockSend).not.toHaveBeenCalled();
        });

        it('should handle Meta provider output checks', async () => {
            const result = await service.checkOutput('Test output', 'meta', 'general');

            expect(result.allowed).toBe(true);
            expect(result.confidence).toBe(1.0);
            expect(mockBedrockSend).not.toHaveBeenCalled();
        });
    });

    describe('PII Sanitization', () => {
        it('should sanitize email addresses', async () => {
            const content = 'Contact me at john.doe@example.com for more info';
            const sanitized = await service.sanitizeForLogging(content);

            expect(sanitized).toBe('Contact me at [REDACTED] for more info');
        });

        it('should sanitize SSN numbers', async () => {
            const content = 'My SSN is 123-45-6789';
            const sanitized = await service.sanitizeForLogging(content);

            expect(sanitized).toBe('My SSN is [REDACTED]');
        });

        it('should sanitize credit card numbers', async () => {
            const content = 'Card number: 1234 5678 9012 3456';
            const sanitized = await service.sanitizeForLogging(content);

            expect(sanitized).toBe('Card number: [REDACTED]');
        });

        it('should sanitize multiple PII types', async () => {
            const content = 'Email: test@example.com, SSN: 123-45-6789, Card: 1234-5678-9012-3456';
            const sanitized = await service.sanitizeForLogging(content);

            expect(sanitized).toBe('Email: [REDACTED], SSN: [REDACTED], Card: [REDACTED]');
        });

        it('should handle content without PII', async () => {
            const content = 'This is a normal message without sensitive information';
            const sanitized = await service.sanitizeForLogging(content);

            expect(sanitized).toBe(content);
        });
    });

    describe('Performance', () => {
        it('should complete input checks within reasonable time', async () => {
            mockBedrockSend.mockResolvedValue({
                action: 'NONE',
                assessments: []
            });

            const startTime = Date.now();
            await service.checkInput('Test content', 'bedrock', 'general');
            const endTime = Date.now();

            expect(endTime - startTime).toBeLessThan(1000); // < 1 second for mocked call
        });

        it('should complete output checks within reasonable time', async () => {
            mockBedrockSend.mockResolvedValue({
                action: 'NONE',
                assessments: []
            });

            const startTime = Date.now();
            await service.checkOutput('Test output', 'bedrock', 'general');
            const endTime = Date.now();

            expect(endTime - startTime).toBeLessThan(1000); // < 1 second for mocked call
        });

        it('should complete PII sanitization quickly', async () => {
            const content = 'Email: test@example.com, SSN: 123-45-6789'.repeat(100);

            const startTime = Date.now();
            await service.sanitizeForLogging(content);
            const endTime = Date.now();

            expect(endTime - startTime).toBeLessThan(100); // < 100ms for regex operations
        });
    });

    describe('DoD Criteria Validation', () => {
        it('should meet DoD: Multi-provider safety coverage', async () => {
            const providers = ['bedrock', 'google', 'meta'] as const;

            for (const provider of providers) {
                const result = await service.checkInput('Test content', provider, 'general');
                expect(result).toHaveProperty('allowed');
                expect(result).toHaveProperty('confidence');
                expect(result).toHaveProperty('violations');
                expect(result).toHaveProperty('processingTimeMs');
            }
        });

        it('should meet DoD: Domain-specific configurations', async () => {
            mockBedrockSend.mockResolvedValue({
                action: 'NONE',
                assessments: []
            });

            const domains = ['legal', 'medical', 'culinary', 'general'];

            for (const domain of domains) {
                const result = await service.checkInput('Test content', 'bedrock', domain);
                expect(result.allowed).toBe(true);
            }
        });

        it('should meet DoD: PII redaction for logging', async () => {
            const sensitiveContent = 'User email: user@example.com, SSN: 123-45-6789';
            const sanitized = await service.sanitizeForLogging(sensitiveContent);

            expect(sanitized).not.toContain('user@example.com');
            expect(sanitized).not.toContain('123-45-6789');
            expect(sanitized).toContain('[REDACTED]');
        });

        it('should meet DoD: Fail-safe error handling', async () => {
            mockBedrockSend.mockRejectedValue(new Error('Network error'));

            const result = await service.checkInput('Test content', 'bedrock', 'general');

            // Bei Fehlern sollte der Service sicherheitshalber blockieren
            expect(result.allowed).toBe(false);
            expect(result.violations).toHaveLength(1);
            expect(result.violations[0].severity).toBe('CRITICAL');
        });
    });
});