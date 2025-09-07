/**
 * Tests for VC Orchestrator - Production Ready
 */

import { VCOrchestrator, VCStartRequest } from '../vc-orchestrator';

// Mock AWS SDK clients
jest.mock('@aws-sdk/client-dynamodb');
jest.mock('@aws-sdk/client-s3');

describe('VCOrchestrator', () => {
  let orchestrator: VCOrchestrator;

  beforeEach(() => {
    orchestrator = new VCOrchestrator();
    
    // Mock environment variables
    process.env.VC_JOBS_TABLE = 'test-jobs-table';
    process.env.VC_CACHE_TABLE = 'test-cache-table';
    process.env.VC_RESULTS_BUCKET = 'test-results-bucket';
    process.env.TEMPLATE_VERSION = '1.0.0';
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('startVCAnalysis', () => {
    const validRequest: VCStartRequest = {
      business: {
        name: 'Test Restaurant',
        category: 'Restaurant',
        location: {
          city: 'München',
          country: 'Deutschland'
        }
      },
      persona_hint: 'Solo-Sarah',
      source: 'web'
    };

    it('should start new analysis successfully', async () => {
      const result = await orchestrator.startVCAnalysis(validRequest);

      expect(result.job_id).toBeDefined();
      expect(result.accepted_at).toBeDefined();
      expect(result.cached).toBe(false);
      expect(result.estimated_completion_time_seconds).toBeGreaterThan(0);
      expect(result.cost_estimate_cents).toBeGreaterThan(0);
    });

    it('should return cached result when available', async () => {
      const requestWithIdempotency: VCStartRequest = {
        ...validRequest,
        idempotency_key: 'test-key-123'
      };

      // First request
      const result1 = await orchestrator.startVCAnalysis(requestWithIdempotency);
      
      // Second request with same idempotency key should return cached
      const result2 = await orchestrator.startVCAnalysis(requestWithIdempotency);

      expect(result2.job_id).toBe(result1.job_id);
      expect(result2.cached).toBe(true);
    });

    it('should detect persona automatically when not provided', async () => {
      const requestWithoutPersona: VCStartRequest = {
        business: {
          name: 'Test Chain Restaurant',
          category: 'Restaurant'
        }
      };

      const result = await orchestrator.startVCAnalysis(requestWithoutPersona);

      expect(result.job_id).toBeDefined();
      expect(result.cost_estimate_cents).toBeGreaterThan(0);
    });

    it('should respect cost limits per persona', async () => {
      const expensiveRequest: VCStartRequest = {
        business: {
          name: 'Test Restaurant'
        },
        persona_hint: 'Solo-Sarah' // Has lower cost limit
      };

      // Mock high cost estimation
      jest.spyOn(orchestrator as any, 'estimateCost').mockReturnValue(1000); // High cost

      await expect(orchestrator.startVCAnalysis(expensiveRequest))
        .rejects.toThrow('Cost estimate');
    });

    it('should handle force_refresh parameter', async () => {
      const request: VCStartRequest = {
        ...validRequest,
        force_refresh: true
      };

      const result = await orchestrator.startVCAnalysis(request);

      expect(result.cached).toBe(false);
    });
  });

  describe('getVCResult', () => {
    it('should return job status for queued job', async () => {
      // Mock job state
      jest.spyOn(orchestrator as any, 'getJobState').mockResolvedValue({
        job_id: 'test-job-123',
        status: 'queued',
        progress: 0,
        template_version: '1.0.0',
        cost_estimate_cents: 50
      });

      const result = await orchestrator.getVCResult('test-job-123');

      expect(result.status).toBe('queued');
      expect(result.progress).toBe(0);
      expect(result.template.version).toBe('1.0.0');
    });

    it('should return analysis result for completed job', async () => {
      // Mock completed job state
      jest.spyOn(orchestrator as any, 'getJobState').mockResolvedValue({
        job_id: 'test-job-123',
        status: 'succeeded',
        progress: 100,
        template_version: '1.0.0',
        cost_estimate_cents: 50,
        result_s3_key: 'results/test-job-123.json'
      });

      // Mock S3 result
      jest.spyOn(orchestrator as any, 'getResultFromS3').mockResolvedValue({
        executive_summary: 'Test analysis completed',
        swot: {
          strengths: ['Good location'],
          weaknesses: ['Weak online presence'],
          opportunities: ['Social media'],
          threats: ['Competition']
        }
      });

      const result = await orchestrator.getVCResult('test-job-123');

      expect(result.status).toBe('succeeded');
      expect(result.progress).toBe(100);
      expect(result.result).toBeDefined();
      expect(result.result?.executive_summary).toBe('Test analysis completed');
    });

    it('should return error for failed job', async () => {
      // Mock failed job state
      jest.spyOn(orchestrator as any, 'getJobState').mockResolvedValue({
        job_id: 'test-job-123',
        status: 'failed',
        progress: 50,
        template_version: '1.0.0',
        cost_estimate_cents: 50,
        error_details: 'Analysis failed due to timeout',
        retry_count: 2
      });

      const result = await orchestrator.getVCResult('test-job-123');

      expect(result.status).toBe('failed');
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('Analysis failed due to timeout');
      expect(result.error?.retry_after_seconds).toBeGreaterThan(0);
    });

    it('should throw error for non-existent job', async () => {
      jest.spyOn(orchestrator as any, 'getJobState').mockResolvedValue(null);

      await expect(orchestrator.getVCResult('non-existent-job'))
        .rejects.toThrow('Job not found');
    });
  });

  describe('persona detection', () => {
    it('should detect Ketten-Katrin for chain restaurants', async () => {
      const detectPersona = (orchestrator as any).detectPersona.bind(orchestrator);
      
      const chainBusiness = {
        name: 'McDonald\'s Chain Restaurant',
        category: 'fast-food'
      };

      const persona = await detectPersona(chainBusiness);
      expect(persona).toBe('Ketten-Katrin');
    });

    it('should detect Wachstums-Walter for upscale restaurants', async () => {
      const detectPersona = (orchestrator as any).detectPersona.bind(orchestrator);
      
      const upscaleBusiness = {
        name: 'Fine Dining Restaurant',
        category: 'fine-dining',
        website_url: 'https://example.com'
      };

      const persona = await detectPersona(upscaleBusiness);
      expect(persona).toBe('Wachstums-Walter');
    });

    it('should default to Solo-Sarah for simple restaurants', async () => {
      const detectPersona = (orchestrator as any).detectPersona.bind(orchestrator);
      
      const simpleBusiness = {
        name: 'Local Café',
        category: 'cafe'
      };

      const persona = await detectPersona(simpleBusiness);
      expect(persona).toBe('Solo-Sarah');
    });
  });

  describe('cost estimation', () => {
    it('should estimate different costs for different personas', () => {
      const estimateCost = (orchestrator as any).estimateCost.bind(orchestrator);

      const sarahCost = estimateCost('Solo-Sarah');
      const walterCost = estimateCost('Wachstums-Walter');
      const katrinCost = estimateCost('Ketten-Katrin');

      expect(walterCost).toBeGreaterThan(sarahCost);
      expect(katrinCost).toBeGreaterThan(walterCost);
    });

    it('should return reasonable cost estimates', () => {
      const estimateCost = (orchestrator as any).estimateCost.bind(orchestrator);

      const cost = estimateCost('Solo-Sarah');
      
      expect(cost).toBeGreaterThan(0);
      expect(cost).toBeLessThan(1000); // Should be reasonable in cents
    });
  });

  describe('completion time estimation', () => {
    it('should estimate different completion times for different personas', () => {
      const estimateTime = (orchestrator as any).estimateCompletionTime.bind(orchestrator);

      const sarahTime = estimateTime('Solo-Sarah');
      const walterTime = estimateTime('Wachstums-Walter');
      const katrinTime = estimateTime('Ketten-Katrin');

      expect(walterTime).toBeGreaterThan(sarahTime);
      expect(katrinTime).toBeGreaterThan(walterTime);
    });

    it('should return reasonable time estimates', () => {
      const estimateTime = (orchestrator as any).estimateCompletionTime.bind(orchestrator);

      const time = estimateTime('Solo-Sarah');
      
      expect(time).toBeGreaterThan(10); // At least 10 seconds
      expect(time).toBeLessThan(300); // Less than 5 minutes
    });
  });

  describe('input normalization', () => {
    it('should normalize business input correctly', () => {
      const normalizeInput = (orchestrator as any).normalizeInput.bind(orchestrator);

      const request: VCStartRequest = {
        business: {
          name: '  Test Restaurant  ',
          category: 'Restaurant',
          location: {
            city: 'München',
            country: 'Deutschland'
          },
          website_url: 'https://example.com'
        }
      };

      const normalized = normalizeInput(request);

      expect(normalized.business_name).toBe('Test Restaurant'); // Trimmed
      expect(normalized.main_category).toBe('Restaurant');
      expect(normalized.address?.city).toBe('München');
      expect(normalized.website_url).toBe('https://example.com');
      expect(normalized.data_source).toBe('user_input');
      expect(normalized.last_updated).toBeDefined();
    });
  });

  describe('input hash generation', () => {
    it('should generate consistent hashes for same input', () => {
      const generateHash = (orchestrator as any).generateInputHash.bind(orchestrator);

      const request1: VCStartRequest = {
        business: { name: 'Test Restaurant', category: 'Restaurant' }
      };

      const request2: VCStartRequest = {
        business: { name: 'Test Restaurant', category: 'Restaurant' }
      };

      const hash1 = generateHash(request1);
      const hash2 = generateHash(request2);

      expect(hash1).toBe(hash2);
    });

    it('should generate different hashes for different input', () => {
      const generateHash = (orchestrator as any).generateInputHash.bind(orchestrator);

      const request1: VCStartRequest = {
        business: { name: 'Restaurant A', category: 'Restaurant' }
      };

      const request2: VCStartRequest = {
        business: { name: 'Restaurant B', category: 'Restaurant' }
      };

      const hash1 = generateHash(request1);
      const hash2 = generateHash(request2);

      expect(hash1).not.toBe(hash2);
    });

    it('should include template version in hash', () => {
      const generateHash = (orchestrator as any).generateInputHash.bind(orchestrator);

      const request: VCStartRequest = {
        business: { name: 'Test Restaurant' }
      };

      process.env.TEMPLATE_VERSION = '1.0.0';
      const hash1 = generateHash(request);

      process.env.TEMPLATE_VERSION = '1.1.0';
      const hash2 = generateHash(request);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('retry logic', () => {
    it('should calculate exponential backoff correctly', () => {
      const calculateRetryDelay = (orchestrator as any).calculateRetryDelay.bind(orchestrator);

      const delay0 = calculateRetryDelay(0);
      const delay1 = calculateRetryDelay(1);
      const delay2 = calculateRetryDelay(2);

      expect(delay1).toBeGreaterThan(delay0);
      expect(delay2).toBeGreaterThan(delay1);
      expect(delay2).toBeLessThanOrEqual(300); // Max 5 minutes
    });

    it('should identify retryable errors correctly', () => {
      const isRetryable = (orchestrator as any).isRetryableError.bind(orchestrator);

      expect(isRetryable({ name: 'ThrottlingException' })).toBe(true);
      expect(isRetryable({ name: 'ServiceUnavailableException' })).toBe(true);
      expect(isRetryable({ statusCode: 500 })).toBe(true);
      expect(isRetryable({ statusCode: 503 })).toBe(true);
      
      expect(isRetryable({ statusCode: 400 })).toBe(false);
      expect(isRetryable({ statusCode: 404 })).toBe(false);
      expect(isRetryable({ name: 'ValidationException' })).toBe(false);
    });
  });

  describe('result validation', () => {
    it('should validate and repair incomplete results', async () => {
      const validateAndRepair = (orchestrator as any).validateAndRepairResult.bind(orchestrator);

      const incompleteResult = {
        swot: {
          strengths: ['Good location'],
          weaknesses: [],
          opportunities: [],
          threats: []
        }
        // Missing executive_summary and disclaimers
      };

      const repaired = await validateAndRepair(incompleteResult);

      expect(repaired.executive_summary).toBeDefined();
      expect(repaired.disclaimers).toBeDefined();
      expect(repaired.disclaimers.length).toBeGreaterThan(0);
    });

    it('should preserve valid result data', async () => {
      const validateAndRepair = (orchestrator as any).validateAndRepairResult.bind(orchestrator);

      const validResult = {
        executive_summary: 'Complete analysis',
        swot: {
          strengths: ['Good location'],
          weaknesses: ['Weak online presence'],
          opportunities: ['Social media'],
          threats: ['Competition']
        },
        disclaimers: ['All estimates are non-binding']
      };

      const repaired = await validateAndRepair(validResult);

      expect(repaired.executive_summary).toBe('Complete analysis');
      expect(repaired.swot.strengths).toEqual(['Good location']);
      expect(repaired.disclaimers).toEqual(['All estimates are non-binding']);
    });
  });
});