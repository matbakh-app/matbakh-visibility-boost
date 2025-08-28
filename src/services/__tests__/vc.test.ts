import { describe, it, expect, vi, beforeEach } from 'vitest';
import { startVisibilityCheck, getVCEnvironmentInfo } from '../vc';

// Mock environment variables
const mockEnv = {
  VITE_VC_API_PROVIDER: 'aws',
  VITE_PUBLIC_API_BASE: 'https://api.example.com/prod',
  MODE: 'test',
  PROD: false
};

// Mock import.meta.env
vi.stubGlobal('import', {
  meta: {
    env: mockEnv
  }
});

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('VC Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset env to valid state
    mockEnv.VITE_VC_API_PROVIDER = 'aws';
    mockEnv.VITE_PUBLIC_API_BASE = 'https://api.example.com/prod';
  });

  describe('startVisibilityCheck', () => {
    it('should construct correct URL and payload', async () => {
      const mockResponse = { ok: true, token: 'test-token' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      await startVisibilityCheck('test@example.com', 'Test User', true, 'de');

      expect(fetch).toHaveBeenCalledWith(
        'https://api.example.com/prod/vc/start',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Origin': 'http://localhost:3000'
          },
          body: JSON.stringify({
            email: 'test@example.com',
            name: 'Test User',
            marketing: true,
            locale: 'de'
          })
        }
      );
    });

    it('should handle successful response', async () => {
      const mockResponse = { ok: true, token: 'test-token' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await startVisibilityCheck('test@example.com');
      expect(result).toEqual(mockResponse);
    });

    it('should throw error for invalid provider', async () => {
      mockEnv.VITE_VC_API_PROVIDER = 'invalid';

      await expect(startVisibilityCheck('test@example.com')).rejects.toThrow(
        'Invalid VC API provider: invalid. Expected \'aws\''
      );
    });

    it('should throw error for missing API base', async () => {
      mockEnv.VITE_PUBLIC_API_BASE = '';

      await expect(startVisibilityCheck('test@example.com')).rejects.toThrow(
        'Missing VITE_PUBLIC_API_BASE environment variable'
      );
    });

    it('should handle HTTP 400 error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400
      });

      await expect(startVisibilityCheck('invalid-email')).rejects.toThrow(
        'Invalid email address'
      );
    });

    it('should handle HTTP 429 rate limit', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429
      });

      await expect(startVisibilityCheck('test@example.com')).rejects.toThrow(
        'Too many requests. Please try again later.'
      );
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new TypeError('Failed to fetch'));

      await expect(startVisibilityCheck('test@example.com')).rejects.toThrow(
        'Network error. Please check your internet connection.'
      );
    });
  });

  describe('getVCEnvironmentInfo', () => {
    it('should return environment info in development', () => {
      mockEnv.PROD = false;
      
      const info = getVCEnvironmentInfo();
      expect(info).toEqual({
        provider: 'aws',
        apiBase: 'https://api.example.com/prod',
        env: 'test'
      });
    });

    it('should return null in production', () => {
      mockEnv.PROD = true;
      
      const info = getVCEnvironmentInfo();
      expect(info).toBeNull();
    });
  });
});