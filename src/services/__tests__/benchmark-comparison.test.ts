/**
 * Tests for Benchmark Comparison Service
 * Task 6.4.5: Industry Benchmark Comparison - AWS RDS Migration
 */

import { BenchmarkComparisonService, ScoreBenchmark, IndustryBenchmarkRequest } from '../benchmark-comparison';

// Mock AwsRdsClient
const mockRdsClient = {
  executeQuery: jest.fn(),
  mapRecord: jest.fn()
};

// Mock the AwsRdsClient constructor
jest.mock('../aws-rds-client', () => ({
  AwsRdsClient: jest.fn().mockImplementation(() => mockRdsClient)
}));

describe('BenchmarkComparisonService', () => {
  let service: BenchmarkComparisonService;

  beforeEach(() => {
    service = new BenchmarkComparisonService();
    jest.clearAllMocks();
  });

  describe('getIndustryBenchmarks', () => {
    it('should fetch benchmark data successfully', async () => {
      const mockBenchmark: ScoreBenchmark = {
        id: 'test-id',
        industry_id: 'restaurant',
        region_id: 'munich',
        score_type: 'visibility',
        benchmark_value: 75.0,
        percentile_25: 50.0,
        percentile_50: 70.0,
        percentile_75: 85.0,
        percentile_90: 95.0,
        sample_size: 200,
        last_updated: '2025-01-09T10:00:00Z',
        data_source: 'test_data'
      };

      // Mock RDS response
      mockRdsClient.executeQuery.mockResolvedValue({
        records: [mockBenchmark]
      });
      mockRdsClient.mapRecord.mockReturnValue(mockBenchmark);

      const result = await service.getIndustryBenchmarks('restaurant', 'munich', 'visibility');

      expect(result).toEqual(mockBenchmark);
      expect(mockRdsClient.executeQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM score_benchmarks'),
        ['restaurant', 'munich', 'visibility']
      );
    });

    it('should return null when benchmark not found', async () => {
      // Mock empty RDS response
      mockRdsClient.executeQuery.mockResolvedValue({
        records: []
      });

      const result = await service.getIndustryBenchmarks('restaurant', 'nonexistent', 'visibility');

      expect(result).toBeNull();
    });
  });

  describe('compareToBenchmark', () => {
    const mockBenchmark: ScoreBenchmark = {
      id: 'test-id',
      industry_id: 'restaurant',
      region_id: 'munich',
      score_type: 'visibility',
      benchmark_value: 75.0,
      percentile_25: 50.0,
      percentile_50: 70.0,
      percentile_75: 85.0,
      percentile_90: 95.0,
      sample_size: 200,
      last_updated: '2025-01-09T10:00:00Z',
      data_source: 'test_data'
    };

    beforeEach(() => {
      // Mock RDS response for benchmark data
      mockRdsClient.executeQuery.mockResolvedValue({
        records: [mockBenchmark]
      });
      mockRdsClient.mapRecord.mockReturnValue(mockBenchmark);
    });

    it('should calculate comparison for score above 75th percentile', async () => {
      const request: IndustryBenchmarkRequest = {
        business_id: 'test-business',
        industry_id: 'restaurant',
        region_id: 'munich',
        score_type: 'visibility',
        current_score: 90.0
      };

      const result = await service.compareToBenchmark(request);

      expect(result).toBeTruthy();
      expect(result!.business_score).toBe(90.0);
      expect(result!.benchmark_value).toBe(75.0);
      expect(result!.performance_category).toBe('above');
      expect(result!.percentile_rank).toBeGreaterThan(75);
      expect(result!.recommendations).toContain('Position halten und weiter ausbauen');
    });

    it('should calculate comparison for score below 25th percentile', async () => {
      const request: IndustryBenchmarkRequest = {
        business_id: 'test-business',
        industry_id: 'restaurant',
        region_id: 'munich',
        score_type: 'visibility',
        current_score: 30.0
      };

      const result = await service.compareToBenchmark(request);

      expect(result).toBeTruthy();
      expect(result!.business_score).toBe(30.0);
      expect(result!.performance_category).toBe('well_below');
      expect(result!.percentile_rank).toBeLessThan(25);
      expect(result!.recommendations).toContain('Sofortige Maßnahmen zur Verbesserung der Sichtbarkeit erforderlich');
    });

    it('should calculate comparison for average score', async () => {
      const request: IndustryBenchmarkRequest = {
        business_id: 'test-business',
        industry_id: 'restaurant',
        region_id: 'munich',
        score_type: 'visibility',
        current_score: 70.0
      };

      const result = await service.compareToBenchmark(request);

      expect(result).toBeTruthy();
      expect(result!.business_score).toBe(70.0);
      expect(result!.performance_category).toBe('average');
      expect(result!.percentile_rank).toBeGreaterThanOrEqual(40);
      expect(result!.percentile_rank).toBeLessThan(60);
    });

    it('should fallback to national benchmark when regional not available', async () => {
      // First call (regional) returns empty, second call (national) returns data
      mockRdsClient.executeQuery
        .mockResolvedValueOnce({ records: [] })
        .mockResolvedValueOnce({ records: [mockBenchmark] });
      
      mockRdsClient.mapRecord.mockReturnValue(mockBenchmark);

      const request: IndustryBenchmarkRequest = {
        business_id: 'test-business',
        industry_id: 'restaurant',
        region_id: 'nonexistent',
        score_type: 'visibility',
        current_score: 70.0
      };

      const result = await service.compareToBenchmark(request);

      expect(result).toBeTruthy();
      expect(mockRdsClient.executeQuery).toHaveBeenCalledTimes(2);
    });
  });

  describe('getMultiRegionBenchmarks', () => {
    it('should fetch benchmarks for multiple regions', async () => {
      const mockBenchmarks = [
        {
          id: 'test-1',
          industry_id: 'restaurant',
          region_id: 'munich',
          score_type: 'visibility',
          benchmark_value: 75.0,
          percentile_25: 50.0,
          percentile_50: 70.0,
          percentile_75: 85.0,
          percentile_90: 95.0,
          sample_size: 200,
          last_updated: '2025-01-09T10:00:00Z',
          data_source: 'test_data'
        },
        {
          id: 'test-2',
          industry_id: 'restaurant',
          region_id: 'berlin',
          score_type: 'visibility',
          benchmark_value: 72.0,
          percentile_25: 48.0,
          percentile_50: 68.0,
          percentile_75: 82.0,
          percentile_90: 92.0,
          sample_size: 180,
          last_updated: '2025-01-09T09:00:00Z',
          data_source: 'test_data'
        }
      ];

      mockRdsClient.executeQuery.mockResolvedValue({
        records: mockBenchmarks
      });
      mockRdsClient.mapRecord.mockImplementation((record) => record);

      const result = await service.getMultiRegionBenchmarks('restaurant', ['munich', 'berlin'], 'visibility');

      expect(result).toHaveProperty('munich');
      expect(result).toHaveProperty('berlin');
      expect(result.munich.benchmark_value).toBe(75.0);
      expect(result.berlin.benchmark_value).toBe(72.0);
    });

    it('should handle empty results gracefully', async () => {
      mockRdsClient.executeQuery.mockResolvedValue({
        records: []
      });

      const result = await service.getMultiRegionBenchmarks('restaurant', ['nonexistent'], 'visibility');

      expect(result).toEqual({});
    });
  });

  describe('updateBenchmark', () => {
    it('should update benchmark data successfully', async () => {
      mockRdsClient.executeQuery.mockResolvedValue({
        records: [],
        numberOfRecordsUpdated: 1
      });

      const benchmarkData = {
        industry_id: 'restaurant',
        region_id: 'munich',
        score_type: 'visibility' as const,
        benchmark_value: 76.0,
        percentile_25: 51.0,
        percentile_50: 71.0,
        percentile_75: 86.0,
        percentile_90: 96.0,
        sample_size: 210,
        data_source: 'updated_data'
      };

      const result = await service.updateBenchmark(benchmarkData);

      expect(result).toBe(true);
      expect(mockRdsClient.executeQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO score_benchmarks'),
        expect.arrayContaining([
          'restaurant',
          'munich',
          'visibility',
          76.0,
          51.0,
          71.0,
          86.0,
          96.0,
          210,
          'updated_data',
          expect.any(String)
        ])
      );
    });

    it('should handle update errors gracefully', async () => {
      mockRdsClient.executeQuery.mockRejectedValue(new Error('Update failed'));

      const benchmarkData = {
        industry_id: 'restaurant',
        region_id: 'munich',
        score_type: 'visibility' as const,
        benchmark_value: 76.0,
        percentile_25: 51.0,
        percentile_50: 71.0,
        percentile_75: 86.0,
        percentile_90: 96.0,
        sample_size: 210,
        data_source: 'updated_data'
      };

      const result = await service.updateBenchmark(benchmarkData);

      expect(result).toBe(false);
    });
  });

  describe('calculateComparison (private method testing via public interface)', () => {
    const mockBenchmark: ScoreBenchmark = {
      id: 'test-id',
      industry_id: 'restaurant',
      region_id: 'munich',
      score_type: 'visibility',
      benchmark_value: 75.0,
      percentile_25: 50.0,
      percentile_50: 70.0,
      percentile_75: 85.0,
      percentile_90: 95.0,
      sample_size: 200,
      last_updated: '2025-01-09T10:00:00Z',
      data_source: 'test_data'
    };

    beforeEach(() => {
      mockRdsClient.executeQuery.mockResolvedValue({
        records: [mockBenchmark]
      });
      mockRdsClient.mapRecord.mockReturnValue(mockBenchmark);
    });

    it('should generate appropriate recommendations for each performance category', async () => {
      const testCases = [
        { score: 20, expectedCategory: 'well_below', expectedRecommendation: 'Sofortige Maßnahmen' },
        { score: 40, expectedCategory: 'below', expectedRecommendation: 'Systematische Verbesserung' },
        { score: 70, expectedCategory: 'average', expectedRecommendation: 'Kontinuierliche Optimierung' },
        { score: 88, expectedCategory: 'above', expectedRecommendation: 'Position halten' },
        { score: 98, expectedCategory: 'well_above', expectedRecommendation: 'Marktführerposition' }
      ];

      for (const testCase of testCases) {
        const request: IndustryBenchmarkRequest = {
          business_id: 'test-business',
          industry_id: 'restaurant',
          region_id: 'munich',
          score_type: 'visibility',
          current_score: testCase.score
        };

        const result = await service.compareToBenchmark(request);

        expect(result!.performance_category).toBe(testCase.expectedCategory);
        expect(result!.recommendations.some(rec => 
          rec.toLowerCase().includes(testCase.expectedRecommendation.toLowerCase())
        )).toBe(true);
      }
    });

    it('should calculate improvement potential correctly', async () => {
      const request: IndustryBenchmarkRequest = {
        business_id: 'test-business',
        industry_id: 'restaurant',
        region_id: 'munich',
        score_type: 'visibility',
        current_score: 60.0
      };

      const result = await service.compareToBenchmark(request);

      expect(result!.improvement_potential).toBe(25.0); // 85.0 (75th percentile) - 60.0
    });

    it('should generate position descriptions correctly', async () => {
      const testCases = [
        { score: 98, expectedIndustry: 'Top 10%', expectedRegion: 'Top 10%' },
        { score: 88, expectedIndustry: 'Top 25%', expectedRegion: 'Top 25%' },
        { score: 75, expectedIndustry: 'Obere Hälfte', expectedRegion: 'Obere Hälfte' },
        { score: 40, expectedIndustry: 'Untere Hälfte', expectedRegion: 'Untere Hälfte' },
        { score: 20, expectedIndustry: 'Untere 25%', expectedRegion: 'Untere 25%' }
      ];

      for (const testCase of testCases) {
        const request: IndustryBenchmarkRequest = {
          business_id: 'test-business',
          industry_id: 'restaurant',
          region_id: 'munich',
          score_type: 'visibility',
          current_score: testCase.score
        };

        const result = await service.compareToBenchmark(request);

        expect(result!.industry_position).toContain(testCase.expectedIndustry);
        expect(result!.regional_position).toContain(testCase.expectedRegion);
      }
    });
  });
});