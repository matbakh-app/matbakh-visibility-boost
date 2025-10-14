import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { startVisibilityCheck, getVCEnvironmentInfo } from '../vc';

// Mock fetch globally
global.fetch = jest.fn();

describe('VC Service - Core Business Logic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset fetch mock
    (global.fetch as jest.Mock).mockClear();
  });

  describe('startVisibilityCheck', () => {
    it('should construct correct API request with all parameters', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({ success: true, token: 'vc-token-123', checkId: 'check-456' }),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await startVisibilityCheck('test@restaurant.com', 'Test Restaurant', true, 'de');
      
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/vc/start'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: expect.stringContaining('"email":"test@restaurant.com"'),
        })
      );
      expect(result).toEqual({ 
        success: true, 
        token: 'vc-token-123', 
        checkId: 'check-456' 
      });
    });

    it('should handle successful visibility check initiation', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({ 
          success: true, 
          token: 'abc123',
          message: 'Visibility check started successfully'
        }),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await startVisibilityCheck('owner@bistro.de', 'Bistro Berlin', true, 'de');
      
      expect(result.success).toBe(true);
      expect(result.token).toBe('abc123');
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should handle API errors gracefully', async () => {
      const mockResponse = {
        ok: false,
        status: 400,
        json: async () => ({ error: 'Invalid email format' }),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      await expect(
        startVisibilityCheck('invalid-email', 'Test Restaurant', true, 'de')
      ).rejects.toThrow('Invalid email format');
    });

    it('should handle network errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network timeout'));

      await expect(
        startVisibilityCheck('test@test.com', 'Test Restaurant', true, 'de')
      ).rejects.toThrow('Network timeout');
    });

    it('should validate required parameters', async () => {
      await expect(
        startVisibilityCheck('', 'Test Restaurant', true, 'de')
      ).rejects.toThrow();
    });

    it('should handle different locales correctly', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({ success: true, token: 'token-en' }),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      await startVisibilityCheck('test@restaurant.com', 'Test Restaurant', true, 'en');
      
      const callArgs = (global.fetch as jest.Mock).mock.calls[0];
      const requestBody = JSON.parse(callArgs[1].body);
      expect(requestBody.locale).toBe('en');
    });
  });

  describe('getVCEnvironmentInfo', () => {
    it('should return environment info in development mode', () => {
      // Mock development environment
      const originalEnv = (globalThis as any).importMetaEnv?.MODE;
      (globalThis as any).importMetaEnv = { ...(globalThis as any).importMetaEnv, MODE: 'development' };
      
      const result = getVCEnvironmentInfo();
      
      expect(result).toBeDefined();
      expect(result).toHaveProperty('mode');
      expect(result).toHaveProperty('apiBase');
      
      // Restore
      if (originalEnv !== undefined) {
        (globalThis as any).importMetaEnv.MODE = originalEnv;
      }
    });

    it('should return null in production mode', () => {
      // Mock production environment
      const originalEnv = (globalThis as any).importMetaEnv?.MODE;
      (globalThis as any).importMetaEnv = { ...(globalThis as any).importMetaEnv, MODE: 'production' };
      
      const result = getVCEnvironmentInfo();
      
      expect(result).toBeNull();
      
      // Restore
      if (originalEnv !== undefined) {
        (globalThis as any).importMetaEnv.MODE = originalEnv;
      }
    });

    it('should include correct environment variables', () => {
      const originalEnv = (globalThis as any).importMetaEnv?.MODE;
      (globalThis as any).importMetaEnv = { ...(globalThis as any).importMetaEnv, MODE: 'development' };
      
      const result = getVCEnvironmentInfo();
      
      if (result) {
        expect(result.apiBase).toBeDefined();
        expect(result.mode).toBe('development');
      }
      
      // Restore
      if (originalEnv !== undefined) {
        (globalThis as any).importMetaEnv.MODE = originalEnv;
      }
    });
  });

  describe('Error Handling & Edge Cases', () => {
    it('should handle malformed API responses', async () => {
      const mockResponse = {
        ok: true,
        json: async () => { throw new Error('Invalid JSON'); },
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      await expect(
        startVisibilityCheck('test@restaurant.com', 'Test Restaurant', true, 'de')
      ).rejects.toThrow('Invalid JSON');
    });

    it('should handle rate limiting', async () => {
      const mockResponse = {
        ok: false,
        status: 429,
        json: async () => ({ error: 'Rate limit exceeded' }),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      await expect(
        startVisibilityCheck('test@restaurant.com', 'Test Restaurant', true, 'de')
      ).rejects.toThrow('Rate limit exceeded');
    });

    it('should handle server errors', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        json: async () => ({ error: 'Internal server error' }),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      await expect(
        startVisibilityCheck('test@restaurant.com', 'Test Restaurant', true, 'de')
      ).rejects.toThrow('Internal server error');
    });
  });
});