interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  category: 'loading' | 'interaction' | 'error' | 'resource';
  metadata?: Record<string, any>;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private sessionId: string;
  private isEnabled: boolean = true;

  constructor() {
    // Use crypto.randomUUID() for secure session ID generation
    this.sessionId = typeof crypto !== 'undefined' && crypto.randomUUID 
      ? crypto.randomUUID() 
      : Date.now().toString(36) + '-' + Date.now().toString(36);
    this.initializeMonitoring();
  }

  private initializeMonitoring() {
    if (typeof window === 'undefined') return;

    // Basic Web Vitals
    this.observeWebVitals();
    
    // Error tracking
    this.observeErrors();
    
    // Resource timing
    this.observeResources();
  }

  private observeWebVitals() {
    // LCP - Largest Contentful Paint
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        this.recordMetric('LCP', entry.startTime, 'loading', {
          element: entry.element?.tagName
        });
      }
    }).observe({ entryTypes: ['largest-contentful-paint'] });

    // FID - First Input Delay
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        this.recordMetric('FID', entry.processingStart - entry.startTime, 'interaction');
      }
    }).observe({ entryTypes: ['first-input'] });

    // CLS - Cumulative Layout Shift
    new PerformanceObserver((list) => {
      let clsValue = 0;
      for (const entry of list.getEntries()) {
        clsValue += entry.value;
      }
      this.recordMetric('CLS', clsValue, 'loading');
    }).observe({ entryTypes: ['layout-shift'] });
  }

  private observeErrors() {
    window.addEventListener('error', (event) => {
      this.recordMetric('JavaScript Error', 1, 'error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.recordMetric('Promise Rejection', 1, 'error', {
        reason: event.reason?.toString()
      });
    });
  }

  private observeResources() {
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        this.recordMetric(`Resource: ${entry.name}`, entry.duration, 'resource', {
          type: entry.initiatorType,
          size: entry.transferSize
        });
      }
    }).observe({ entryTypes: ['resource'] });
  }

  recordMetric(name: string, value: number, category: PerformanceMetric['category'], metadata?: Record<string, any>) {
    if (!this.isEnabled) return;

    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      category,
      metadata
    };

    this.metrics.push(metric);

    // Keep only last 100 metrics
    if (this.metrics.length > 100) {
      this.metrics.shift();
    }

    // Send to analytics
    this.sendToAnalytics(metric);
  }

  private sendToAnalytics(metric: PerformanceMetric) {
    if (typeof window !== 'undefined' && (window as any).analytics) {
      (window as any).analytics.track('Performance Metric', {
        ...metric,
        sessionId: this.sessionId
      });
    }
  }

  getMetrics() {
    return [...this.metrics];
  }

  getMetricsByCategory(category: PerformanceMetric['category']) {
    return this.metrics.filter(m => m.category === category);
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