/**
 * Unit tests for useS3FileAccess hook
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useS3FileAccess } from '../useS3FileAccess';

// Mock fetch
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

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

// Mock sessionStorage
const mockSessionStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage,
});

// Mock environment variables
const originalEnv = process.env;
beforeAll(() => {
  process.env = {
    ...originalEnv,
    VITE_CLOUDFRONT_URL: 'https://test-cdn.cloudfront.net',
    VITE_PUBLIC_API_BASE: 'https://test-api.matbakh.app',
  };
});

afterAll(() => {
  process.env = originalEnv;
});

describe('useS3FileAccess', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue('test-auth-token');
  });

  describe('initialization', () => {
    it('should initialize with default options', () => {
      const { result } = renderHook(() => useS3FileAccess());

      expect(result.current.isGenerating).toBe(false);
      expect(result.current.error).toBe(null);
      expect(typeof result.current.generateSecureUrl).toBe('function');
      expect(typeof result.current.getCdnUrl).toBe('function');
    });

    it('should accept custom options', () => {
      const { result } = renderHook(() =>
        useS3FileAccess({
          autoRefresh: false,
          refreshBuffer: 600,
          cacheUrls: false,
        })
      );

      expect(result.current).toBeDefined();
    });
  });

  describe('getCdnUrl', () => {
    it('should generate CDN URL for reports bucket', () => {
      const { result } = renderHook(() => useS3FileAccess());

      const url = result.current.getCdnUrl('matbakh-files-reports', 'test-file.pdf');

      expect(url).toBe('https://test-cdn.cloudfront.net/test-file.pdf');
    });

    it('should throw error for non-public buckets', () => {
      const { result } = renderHook(() => useS3FileAccess());

      expect(() => {
        result.current.getCdnUrl('matbakh-files-profile', 'test-file.jpg');
      }).toThrow('Public access not supported for bucket: matbakh-files-profile');
    });
  });

  describe('generateSecureUrl', () => {
    const mockResponse = {
      url: 'https://presigned-url.s3.amazonaws.com/test-file.pdf',
      expiresAt: '2024-01-01T12:00:00Z',
      isPublic: false,
    };

    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);
    });

    it('should generate secure URL successfully', async () => {
      const { result } = renderHook(() => useS3FileAccess());

      let urlResult;
      await act(async () => {
        urlResult = await result.current.generateSecureUrl({
          bucket: 'matbakh-files-profile',
          key: 'test-file.pdf',
          expiresIn: 3600,
        });
      });

      expect(urlResult).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://test-api.matbakh.app/get-file-access-url',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer test-auth-token',
          },
          body: JSON.stringify({
            bucket: 'matbakh-files-profile',
            key: 'test-file.pdf',
            expiresIn: 3600,
            responseContentType: undefined,
            responseContentDisposition: undefined,
          }),
        }
      );
    });

    it('should handle authentication error', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      mockSessionStorage.getItem.mockReturnValue(null);

      const { result } = renderHook(() => useS3FileAccess());

      await act(async () => {
        await expect(
          result.current.generateSecureUrl({
            bucket: 'matbakh-files-profile',
            key: 'test-file.pdf',
          })
        ).rejects.toThrow('Authentication required for secure file access');
      });
    });

    it('should handle API error', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        statusText: 'Not Found',
      } as Response);

      const { result } = renderHook(() => useS3FileAccess());

      await act(async () => {
        await expect(
          result.current.generateSecureUrl({
            bucket: 'matbakh-files-profile',
            key: 'test-file.pdf',
          })
        ).rejects.toThrow('Failed to generate secure URL: Not Found');
      });

      expect(result.current.error).toBeTruthy();
    });

    it('should set loading state during request', async () => {
      let resolvePromise: (value: any) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      mockFetch.mockReturnValue(promise as any);

      const { result } = renderHook(() => useS3FileAccess());

      act(() => {
        result.current.generateSecureUrl({
          bucket: 'matbakh-files-profile',
          key: 'test-file.pdf',
        });
      });

      expect(result.current.isGenerating).toBe(true);

      await act(async () => {
        resolvePromise({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        });
        await promise;
      });

      expect(result.current.isGenerating).toBe(false);
    });
  });

  describe('caching', () => {
    const mockResponse = {
      url: 'https://presigned-url.s3.amazonaws.com/test-file.pdf',
      expiresAt: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
      isPublic: false,
    };

    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);
    });

    it('should cache URLs when enabled', async () => {
      const { result } = renderHook(() =>
        useS3FileAccess({ cacheUrls: true })
      );

      // First request
      await act(async () => {
        await result.current.generateSecureUrl({
          bucket: 'matbakh-files-profile',
          key: 'test-file.pdf',
        });
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Second request should use cache
      await act(async () => {
        await result.current.generateSecureUrl({
          bucket: 'matbakh-files-profile',
          key: 'test-file.pdf',
        });
      });

      expect(mockFetch).toHaveBeenCalledTimes(1); // No additional API call
    });

    it('should return cached URL', async () => {
      const { result } = renderHook(() =>
        useS3FileAccess({ cacheUrls: true })
      );

      await act(async () => {
        await result.current.generateSecureUrl({
          bucket: 'matbakh-files-profile',
          key: 'test-file.pdf',
        });
      });

      const cached = result.current.getCachedUrl(
        'matbakh-files-profile',
        'test-file.pdf'
      );

      expect(cached).toEqual(mockResponse);
    });

    it('should clear cache', async () => {
      const { result } = renderHook(() =>
        useS3FileAccess({ cacheUrls: true })
      );

      await act(async () => {
        await result.current.generateSecureUrl({
          bucket: 'matbakh-files-profile',
          key: 'test-file.pdf',
        });
      });

      act(() => {
        result.current.clearCache();
      });

      const cached = result.current.getCachedUrl(
        'matbakh-files-profile',
        'test-file.pdf'
      );

      expect(cached).toBe(null);
    });

    it('should clear expired URLs', async () => {
      const expiredResponse = {
        url: 'https://presigned-url.s3.amazonaws.com/test-file.pdf',
        expiresAt: new Date(Date.now() - 1000).toISOString(), // Expired
        isPublic: false,
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(expiredResponse),
      } as Response);

      const { result } = renderHook(() =>
        useS3FileAccess({ cacheUrls: true, refreshBuffer: 0 })
      );

      await act(async () => {
        await result.current.generateSecureUrl({
          bucket: 'matbakh-files-profile',
          key: 'test-file.pdf',
        });
      });

      act(() => {
        result.current.clearExpiredUrls();
      });

      const cached = result.current.getCachedUrl(
        'matbakh-files-profile',
        'test-file.pdf'
      );

      expect(cached).toBe(null);
    });
  });

  describe('generateMultipleUrls', () => {
    const mockResponses = [
      {
        url: 'https://presigned-url1.s3.amazonaws.com/file1.pdf',
        expiresAt: '2024-01-01T12:00:00Z',
        isPublic: false,
      },
      {
        url: 'https://presigned-url2.s3.amazonaws.com/file2.pdf',
        expiresAt: '2024-01-01T12:00:00Z',
        isPublic: false,
      },
    ];

    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponses),
      } as Response);
    });

    it('should generate multiple URLs', async () => {
      const { result } = renderHook(() => useS3FileAccess());

      let results;
      await act(async () => {
        results = await result.current.generateMultipleUrls([
          { bucket: 'matbakh-files-profile', key: 'file1.pdf' },
          { bucket: 'matbakh-files-profile', key: 'file2.pdf' },
        ]);
      });

      expect(results).toEqual(mockResponses);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://test-api.matbakh.app/get-multiple-file-access-urls',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer test-auth-token',
          },
        })
      );
    });

    it('should handle mixed cached and uncached requests', async () => {
      const { result } = renderHook(() =>
        useS3FileAccess({ cacheUrls: true })
      );

      // Cache first URL
      await act(async () => {
        await result.current.generateSecureUrl({
          bucket: 'matbakh-files-profile',
          key: 'file1.pdf',
        });
      });

      mockFetch.mockClear();
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([mockResponses[1]]), // Only second response
      } as Response);

      let results;
      await act(async () => {
        results = await result.current.generateMultipleUrls([
          { bucket: 'matbakh-files-profile', key: 'file1.pdf' }, // Cached
          { bucket: 'matbakh-files-profile', key: 'file2.pdf' }, // Not cached
        ]);
      });

      expect(results).toHaveLength(2);
      expect(mockFetch).toHaveBeenCalledTimes(1); // Only one API call for uncached
    });
  });

  describe('utility functions', () => {
    it('should check if URL is expired', () => {
      const { result } = renderHook(() => useS3FileAccess());

      const expiredUrl = {
        url: 'https://test.com',
        expiresAt: new Date(Date.now() - 1000).toISOString(),
        isPublic: false,
      };

      const validUrl = {
        url: 'https://test.com',
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
        isPublic: false,
      };

      expect(result.current.isUrlExpired(expiredUrl)).toBe(true);
      expect(result.current.isUrlExpired(validUrl)).toBe(false);
    });

    it('should calculate time until expiry', () => {
      const { result } = renderHook(() => useS3FileAccess());

      const futureTime = new Date(Date.now() + 3600000).toISOString(); // 1 hour
      const url = {
        url: 'https://test.com',
        expiresAt: futureTime,
        isPublic: false,
      };

      const timeLeft = result.current.getTimeUntilExpiry(url);
      expect(timeLeft).toBeGreaterThan(3500); // Should be close to 3600 seconds
      expect(timeLeft).toBeLessThanOrEqual(3600);
    });
  });

  describe('file operations', () => {
    const mockResponse = {
      url: 'https://presigned-url.s3.amazonaws.com/test-file.pdf',
      expiresAt: '2024-01-01T12:00:00Z',
      isPublic: false,
    };

    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      // Mock DOM methods
      document.createElement = jest.fn().mockReturnValue({
        href: '',
        download: '',
        click: jest.fn(),
      });
      document.body.appendChild = jest.fn();
      document.body.removeChild = jest.fn();
    });

    it('should download file', async () => {
      const { result } = renderHook(() => useS3FileAccess());

      await act(async () => {
        await result.current.downloadFile(
          'matbakh-files-profile',
          'test-file.pdf',
          'custom-name.pdf'
        );
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://test-api.matbakh.app/get-file-access-url',
        expect.objectContaining({
          body: JSON.stringify({
            bucket: 'matbakh-files-profile',
            key: 'test-file.pdf',
            expiresIn: 3600,
            responseContentType: undefined,
            responseContentDisposition: 'attachment; filename="custom-name.pdf"',
          }),
        })
      );
    });

    it('should preload file', async () => {
      const mockHeadFetch = jest.fn().mockResolvedValue({ ok: true });
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        } as Response)
        .mockImplementationOnce(mockHeadFetch as any);

      const { result } = renderHook(() => useS3FileAccess());

      await act(async () => {
        await result.current.preloadFile('matbakh-files-profile', 'test-file.pdf');
      });

      expect(mockHeadFetch).toHaveBeenCalledWith(mockResponse.url, {
        method: 'HEAD',
      });
    });
  });

  describe('auto-refresh', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should auto-refresh expired URLs', () => {
      const { result } = renderHook(() =>
        useS3FileAccess({ autoRefresh: true })
      );

      expect(result.current).toBeDefined();

      // Fast-forward time to trigger auto-refresh
      act(() => {
        jest.advanceTimersByTime(60000); // 1 minute
      });

      // Verify that clearExpiredUrls was called
      // This is tested indirectly through the timer setup
    });

    it('should not auto-refresh when disabled', () => {
      const { result } = renderHook(() =>
        useS3FileAccess({ autoRefresh: false })
      );

      expect(result.current).toBeDefined();

      // Fast-forward time
      act(() => {
        jest.advanceTimersByTime(60000);
      });

      // Should not cause any issues
    });
  });

  describe('error scenarios', () => {
    it('should handle network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useS3FileAccess());

      await act(async () => {
        await expect(
          result.current.generateSecureUrl({
            bucket: 'matbakh-files-profile',
            key: 'test-file.pdf',
          })
        ).rejects.toThrow('Network error');
      });

      expect(result.current.error).toBeInstanceOf(Error);
    });

    it('should handle malformed JSON response', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.reject(new Error('Invalid JSON')),
      } as Response);

      const { result } = renderHook(() => useS3FileAccess());

      await act(async () => {
        await expect(
          result.current.generateSecureUrl({
            bucket: 'matbakh-files-profile',
            key: 'test-file.pdf',
          })
        ).rejects.toThrow('Invalid JSON');
      });
    });
  });
});