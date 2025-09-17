/**
 * Test for BenchmarkingError classes
 * JTBD: Verify error handling works correctly
 */

import {
  BenchmarkingError,
  NoCompetitorsError,
  InvalidPayloadError,
  EngineFailureError,
  ConfigurationError
} from '../errors';

describe('BenchmarkingError Classes', () => {
  describe('NoCompetitorsError', () => {
    it('should set statusCode to 400', () => {
      const error = new NoCompetitorsError();
      expect(error.statusCode).toBe(400);
      expect(error.message).toContain('No competitors found');
    });

    it('should include area in message when provided', () => {
      const area = 'Berlin, Germany (radius: 2000m)';
      const error = new NoCompetitorsError(area);
      expect(error.statusCode).toBe(400);
      expect(error.message).toContain(area);
    });

    it('should be instance of BenchmarkingError', () => {
      const error = new NoCompetitorsError();
      expect(error).toBeInstanceOf(BenchmarkingError);
      expect(error).toBeInstanceOf(NoCompetitorsError);
    });
  });

  describe('InvalidPayloadError', () => {
    it('should set statusCode to 400', () => {
      const error = new InvalidPayloadError('Missing required field');
      expect(error.statusCode).toBe(400);
      expect(error.message).toContain('Invalid request format');
    });
  });

  describe('EngineFailureError', () => {
    it('should set statusCode to 500', () => {
      const error = new EngineFailureError('Discovery Engine', 'Connection timeout');
      expect(error.statusCode).toBe(500);
      expect(error.message).toContain('Discovery Engine');
      expect(error.message).toContain('Connection timeout');
    });
  });

  describe('ConfigurationError', () => {
    it('should set statusCode to 500', () => {
      const error = new ConfigurationError('Missing API key');
      expect(error.statusCode).toBe(500);
      expect(error.message).toContain('Configuration error');
    });
  });
});