/**
 * Tests for monitoring-transport.ts
 * 
 * Tests the lossless client→server transport for metrics including:
 * - Beacon fallback behavior
 * - Retry logic with exponential backoff
 * - Queue persistence on failures
 * - Queue flushing functionality
 */

import { sendMetrics, flushQueue } from '../monitoring-transport';

// Mock navigator.sendBeacon
const mockSendBeacon = jest.fn();
Object.defineProperty(navigator, 'sendBeacon', {
  value: mockSendBeacon,
  writable: true,
});

// Mock fetch
global.fetch = jest.fn();

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

describe('monitoring-transport', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue('{"metrics":[]}');
  });

  describe('sendMetrics', () => {
    const testPayload = {
      metrics: [
        { metricName: 'test', value: 1, timestamp: Date.now() }
      ]
    };
    const testEndpoint = 'https://api.example.com/metrics';

    it('should use sendBeacon for HTTPS endpoints when available', async () => {
      mockSendBeacon.mockReturnValue(true);

      await sendMetrics(testPayload, testEndpoint);

      expect(mockSendBeacon).toHaveBeenCalledWith(
        testEndpoint,
        expect.any(Blob)
      );
      expect(fetch).not.toHaveBeenCalled();
    });

    it('should fallback to fetch when sendBeacon fails', async () => {
      mockSendBeacon.mockReturnValue(false);
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
      });

      await sendMetrics(testPayload, testEndpoint);

      expect(mockSendBeacon).toHaveBeenCalled();
      expect(fetch).toHaveBeenCalledWith(testEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testPayload),
        keepalive: true,
      });
    });

    it('should not use sendBeacon for non-HTTPS endpoints', async () => {
      const httpEndpoint = 'http://api.example.com/metrics';
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
      });

      await sendMetrics(testPayload, httpEndpoint);

      expect(mockSendBeacon).not.toHaveBeenCalled();
      expect(fetch).toHaveBeenCalledWith(httpEndpoint, expect.any(Object));
    });

    it('should retry with exponential backoff on fetch failures', async () => {
      mockSendBeacon.mockReturnValue(false);
      (fetch as jest.Mock)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
        });

      const startTime = Date.now();
      await sendMetrics(testPayload, testEndpoint);
      const endTime = Date.now();

      expect(fetch).toHaveBeenCalledTimes(3);
      // Should have some delay due to backoff (at least 200ms for first retry)
      expect(endTime - startTime).toBeGreaterThan(200);
    });

    it('should queue metrics after 3 failed attempts', async () => {
      mockSendBeacon.mockReturnValue(false);
      (fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      await sendMetrics(testPayload, testEndpoint);

      expect(fetch).toHaveBeenCalledTimes(3);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'metrics_queue_v1',
        expect.stringContaining('"metrics"')
      );
    });

    it('should handle HTTP error responses', async () => {
      mockSendBeacon.mockReturnValue(false);
      (fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: false, status: 500 })
        .mockResolvedValueOnce({ ok: false, status: 500 })
        .mockResolvedValueOnce({ ok: false, status: 500 });

      await sendMetrics(testPayload, testEndpoint);

      expect(fetch).toHaveBeenCalledTimes(3);
      expect(mockLocalStorage.setItem).toHaveBeenCalled();
    });

    it('should add jittered delay between retries', async () => {
      mockSendBeacon.mockReturnValue(false);
      (fetch as jest.Mock)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
        });

      const startTime = Date.now();
      await sendMetrics(testPayload, testEndpoint);
      const endTime = Date.now();

      // First retry should have delay between 200-480ms (200*2^1 + 0-80ms jitter)
      expect(endTime - startTime).toBeGreaterThan(200);
      expect(endTime - startTime).toBeLessThan(600);
    });
  });

  describe('flushQueue', () => {
    const testEndpoint = 'https://api.example.com/metrics';

    it('should do nothing when queue is empty', () => {
      mockLocalStorage.getItem.mockReturnValue('{"metrics":[]}');

      flushQueue(testEndpoint);

      expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
      expect(fetch).not.toHaveBeenCalled();
    });

    it('should send queued metrics and clear queue', () => {
      const queuedMetrics = {
        metrics: [
          { metricName: 'queued1', value: 1 },
          { metricName: 'queued2', value: 2 }
        ]
      };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(queuedMetrics));
      mockSendBeacon.mockReturnValue(true);

      flushQueue(testEndpoint);

      // Should clear the queue immediately
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'metrics_queue_v1',
        '{"metrics":[]}'
      );

      // Should attempt to send the queued metrics
      expect(mockSendBeacon).toHaveBeenCalledWith(
        testEndpoint,
        expect.any(Blob)
      );
    });

    it('should handle malformed queue data gracefully', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid json');

      expect(() => flushQueue(testEndpoint)).not.toThrow();
      expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
    });

    it('should handle localStorage errors gracefully', () => {
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('localStorage error');
      });

      expect(() => flushQueue(testEndpoint)).not.toThrow();
    });
  });

  describe('queue management', () => {
    it('should merge new metrics with existing queue on failure', async () => {
      const existingQueue = {
        metrics: [{ metricName: 'existing', value: 1 }]
      };
      const newPayload = {
        metrics: [{ metricName: 'new', value: 2 }]
      };

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(existingQueue));
      mockSendBeacon.mockReturnValue(false);
      (fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      await sendMetrics(newPayload, 'https://api.example.com/metrics');

      const setItemCall = mockLocalStorage.setItem.mock.calls[0];
      const savedQueue = JSON.parse(setItemCall[1]);
      
      expect(savedQueue.metrics).toHaveLength(2);
      expect(savedQueue.metrics[0].metricName).toBe('existing');
      expect(savedQueue.metrics[1].metricName).toBe('new');
    });

    it('should handle localStorage quota exceeded gracefully', async () => {
      mockSendBeacon.mockReturnValue(false);
      (fetch as jest.Mock).mockRejectedValue(new Error('Network error'));
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });

      // Should not throw even if localStorage fails
      await expect(sendMetrics(
        { metrics: [{ metricName: 'test', value: 1 }] },
        'https://api.example.com/metrics'
      )).resolves.toBeUndefined();
    });
  });

  describe('edge cases', () => {
    it('should handle missing navigator.sendBeacon gracefully', async () => {
      // Simulate older browser without sendBeacon
      Object.defineProperty(navigator, 'sendBeacon', {
        value: undefined,
        writable: true,
      });

      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
      });

      await sendMetrics(
        { metrics: [{ metricName: 'test', value: 1 }] },
        'https://api.example.com/metrics'
      );

      expect(fetch).toHaveBeenCalled();
    });

    it('should handle empty metrics array', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
      });

      await sendMetrics({ metrics: [] }, 'https://api.example.com/metrics');

      expect(fetch).toHaveBeenCalledWith(
        'https://api.example.com/metrics',
        expect.objectContaining({
          body: '{"metrics":[]}'
        })
      );
    });

    it('should handle very large payloads', async () => {
      const largePayload = {
        metrics: Array(1000).fill(0).map((_, i) => ({
          metricName: `metric_${i}`,
          value: i,
          dimensions: { test: 'a'.repeat(100) }
        }))
      };

      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
      });

      await sendMetrics(largePayload, 'https://api.example.com/metrics');

      expect(fetch).toHaveBeenCalled();
      const callArgs = (fetch as jest.Mock).mock.calls[0][1];
      expect(callArgs.body).toContain('metric_999');
    });
  });
});