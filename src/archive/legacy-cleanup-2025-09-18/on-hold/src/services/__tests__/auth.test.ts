import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  startAuth,
  handleAuthCallback,
  isAuthenticated,
  getCurrentUser,
  signOut,
  getAuthEnvironmentInfo
} from '../auth';

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Mock fetch
global.fetch = jest.fn();

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    href: 'http://localhost:3000',
    hash: '',
    search: '',
  },
  writable: true,
});

describe('Auth Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockClear();
    mockLocalStorage.setItem.mockClear();
    mockLocalStorage.removeItem.mockClear();
    (global.fetch as jest.Mock).mockClear();
  });

  describe('startAuth', () => {
    it('should send magic link email successfully', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({ success: true, message: 'Magic link sent' }),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await startAuth('test@example.com', 'Test User');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/start'),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('"email":"test@example.com"'),
        })
      );
      expect(result).toEqual({ success: true, message: 'Magic link sent' });
    });

    it('should handle auth start errors', async () => {
      const mockResponse = {
        ok: false,
        status: 400,
        json: async () => ({ error: 'Invalid email' }),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      await expect(startAuth('invalid-email', 'Test User')).rejects.toThrow('Invalid email');
    });

    it('should handle network errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      await expect(startAuth('test@example.com')).rejects.toThrow('Network error');
    });
  });

  describe('handleAuthCallback', () => {
    it('should extract JWT token from URL fragment', () => {
      window.location.hash = '#<REDACTED_AWS_SECRET_ACCESS_KEY>.eyJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJpZCI6IjEyMyIsImlhdCI6MTYwMDAwMDAwMCwiZXhwIjoxNjAwMDA2MDAwfQ.test';

      const result = handleAuthCallback();

      expect(result.token).toBeTruthy();
      expect(result.error).toBeNull();
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'auth_token',
        expect.any(String)
      );
    });

    it('should handle missing token in URL', () => {
      window.location.hash = '';

      const result = handleAuthCallback();

      expect(result.token).toBeNull();
      expect(result.error).toBe('No token found in URL');
    });

    it('should handle invalid JWT token', () => {
      window.location.hash = '#sid=invalid-token';

      const result = handleAuthCallback();

      expect(result.token).toBeNull();
      expect(result.error).toBe('Invalid token format');
    });
  });

  describe('isAuthenticated', () => {
    it('should return true when valid token exists', () => {
      const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJpZCI6IjEyMyIsImlhdCI6MTYwMDAwMDAwMCwiZXhwIjo5OTk5OTk5OTk5fQ.test';
      mockLocalStorage.getItem.mockReturnValue(validToken);

      const result = isAuthenticated();

      expect(result).toBe(true);
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('auth_token');
    });

    it('should return false when no token exists', () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const result = isAuthenticated();

      expect(result).toBe(false);
    });

    it('should return false when token is expired', () => {
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJpZCI6IjEyMyIsImlhdCI6MTYwMDAwMDAwMCwiZXhwIjoxNjAwMDAwMDAwfQ.test';
      mockLocalStorage.getItem.mockReturnValue(expiredToken);

      const result = isAuthenticated();

      expect(result).toBe(false);
    });

    it('should return false when token is malformed', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid-token');

      const result = isAuthenticated();

      expect(result).toBe(false);
    });
  });

  describe('getCurrentUser', () => {
    it('should return user info from valid token', () => {
      const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJpZCI6IjEyMyIsIm5hbWUiOiJUZXN0IFVzZXIiLCJpYXQiOjE2MDAwMDAwMDAsImV4cCI6OTk5OTk5OTk5OX0.test';
      mockLocalStorage.getItem.mockReturnValue(validToken);

      const result = getCurrentUser();

      expect(result).toEqual({
        email: 'test@example.com',
        id: '123',
        name: 'Test User',
      });
    });

    it('should return null when no token exists', () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const result = getCurrentUser();

      expect(result).toBeNull();
    });

    it('should return null when token is invalid', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid-token');

      const result = getCurrentUser();

      expect(result).toBeNull();
    });

    it('should return null when token is expired', () => {
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJpZCI6IjEyMyIsImlhdCI6MTYwMDAwMDAwMCwiZXhwIjoxNjAwMDAwMDAwfQ.test';
      mockLocalStorage.getItem.mockReturnValue(expiredToken);

      const result = getCurrentUser();

      expect(result).toBeNull();
    });
  });

  describe('signOut', () => {
    it('should remove auth token from localStorage', () => {
      signOut();

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('auth_token');
    });

    it('should clear user session completely', () => {
      mockLocalStorage.getItem.mockReturnValue('some-token');

      signOut();

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('auth_token');
      
      // Verify user is no longer authenticated
      mockLocalStorage.getItem.mockReturnValue(null);
      expect(isAuthenticated()).toBe(false);
    });
  });

  describe('getAuthEnvironmentInfo', () => {
    it('should return environment info in test mode', () => {
      // In test environment, just verify the function works
      const result = getAuthEnvironmentInfo();

      expect(result).toBeDefined();
      // Test environment should return debug info
      expect(result).toHaveProperty('apiBase');
    });

    it('should handle environment variations', () => {
      // Test that the function doesn't crash
      const result = getAuthEnvironmentInfo();

      // Should always return something in test environment
      expect(result).toBeDefined();
    });
  });

  describe('Integration Tests', () => {
    it('should complete full auth flow: start -> callback -> authenticated', async () => {
      // 1. Start auth
      const mockStartResponse = {
        ok: true,
        json: async () => ({ success: true, message: 'Magic link sent' }),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockStartResponse);

      const startResult = await startAuth('test@example.com', 'Test User');
      expect(startResult.success).toBe(true);

      // 2. Handle callback with token
      window.location.hash = '#<REDACTED_AWS_SECRET_ACCESS_KEY>.eyJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJpZCI6IjEyMyIsIm5hbWUiOiJUZXN0IFVzZXIiLCJpYXQiOjE2MDAwMDAwMDAsImV4cCI6OTk5OTk5OTk5OX0.test';
      
      const callbackResult = handleAuthCallback();
      expect(callbackResult.token).toBeTruthy();
      expect(callbackResult.error).toBeNull();

      // 3. Verify authentication
      expect(isAuthenticated()).toBe(true);
      
      const user = getCurrentUser();
      expect(user).toEqual({
        email: 'test@example.com',
        id: '123',
        name: 'Test User',
      });

      // 4. Sign out
      signOut();
      expect(isAuthenticated()).toBe(false);
      expect(getCurrentUser()).toBeNull();
    });
  });
});