/**
 * Performance monitor with secure session id generation.
 */

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  category: 'loading' | 'interaction' | 'error' | 'resource';
  metadata?: Record<string, any>;
}

// Secure random string (no Math.random)
function getSecureRandomString(len = 16): string {
  const c = globalThis.crypto as Crypto | undefined;

  if (c?.randomUUID) {
    return c.randomUUID().replace(/-/g, '').slice(0, len);
  }

  if (c?.getRandomValues) {
    const bytes = new Uint8Array(len);
    c.getRandomValues(bytes);
    let out = '';
    for (const b of bytes) out += b.toString(16).padStart(2, '0');
    return out.slice(0, len);
  }

  // In environments without Web Crypto we fail closed rather than falling back to Math.random
  throw new Error('Secure randomness unavailable');
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private sessionId: string;
  private isEnabled: boolean = true;

  constructor() {
    this.sessionId = `${Date.now().toString(36)}-${getSecureRandomString(16)}`;
    this.initializeMonitoring();
  }

  private initializeMonitoring() {
    if (typeof window === 'undefined') return;

    this.observeWebVitals();
    this.observeErrors();
    this.observeResources();
  }

  private observeWebVitals() {
    // LCP - Largest Contentful Paint
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as any) {
        this.recordMetric('LCP', entry.startTime, 'loading', {
          element: entry.element?.tagName,
        });
      }
    }).observe({ type: 'largest-contentful-paint', buffered: true } as any);

    // FID - First Input Delay
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as any) {
        this.recordMetric('FID', entry.processingStart - entry.startTime, 'interaction');
      }
    }).observe({ type: 'first-input', buffered: true } as any);

    // CLS - Cumulative Layout Shift
    new PerformanceObserver((list) => {
      let clsValue = 0;
      for (const entry of list.getEntries() as any) {
        // only count if not triggered by recent user input
        if (!entry.hadRecentInput) clsValue += entry.value;
      }
      this.recordMetric('CLS', clsValue, 'loading');
    }).observe({ type: 'layout-shift', buffered: true } as any);
  }

  private observeErrors() {
    window.addEventListener('error', (event) => {
      this.recordMetric('JavaScript Error', 1, 'error', {
        message: event.message,
        filename: (event as ErrorEvent).filename,
        lineno: (event as ErrorEvent).lineno,
        colno: (event as ErrorEvent).colno,
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.recordMetric('Promise Rejection', 1, 'error', {
        reason: (event as PromiseRejectionEvent).reason?.toString(),
      });
    });
  }

  private observeResources() {
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as PerformanceResourceTiming[]) {
        this.recordMetric(`Resource: ${entry.name}`, entry.duration, 'resource', {
          type: entry.initiatorType,
          size: entry.transferSize,
        });
      }
    }).observe({ type: 'resource', buffered: true } as any);
  }

  recordMetric(
    name: string,
    value: number,
    category: PerformanceMetric['category'],
    metadata?: Record<string, any>
  ) {
    if (!this.isEnabled) return;

    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      category,
      metadata,
    };

    this.metrics.push(metric);

    // Keep only last 100 metrics
    if (this.metrics.length > 100) {
      this.metrics.shift();
    }

    this.sendToAnalytics(metric);
  }

  private sendToAnalytics(metric: PerformanceMetric) {
    if (typeof window !== 'undefined' && (window as any).analytics) {
      (window as any).analytics.track('Performance Metric', {
        ...metric,
        sessionId: this.sessionId,
      });
    }
  }

  getMetrics() {
    return [...this.metrics];
  }

  getMetricsByCategory(category: PerformanceMetric['category']) {
    return this.metrics.filter((m) => m.category === category);
  }

  clearMetrics() {
    this.metrics = [];
  }

  disable() {
    this.isEnabled = false;
  }

  enable() {
    this.isEnabled = true;
  }
}

// Global instance
export const performanceMonitor = new PerformanceMonitor();

// Convenience functions
export const recordPageLoad = (duration: number) =>
  performanceMonitor.recordMetric('Page Load', duration, 'loading');

export const recordUserInteraction = (action: string, duration: number) =>
  performanceMonitor.recordMetric(`User: ${action}`, duration, 'interaction');

export const recordWidgetLoad = (widgetName: string, duration: number) =>
  performanceMonitor.recordMetric(`Widget: ${widgetName}`, duration, 'loading');
