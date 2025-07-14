// Phase 5: Monitoring & Logging utility for Matbakh 3.0
// Structured logging with performance tracking

interface LogEvent {
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  context?: Record<string, any>;
  timestamp?: string;
  performance?: {
    startTime: number;
    duration?: number;
  };
}

class MonitoringService {
  private isDevelopment = import.meta.env.DEV;
  
  private log(event: LogEvent) {
    const logEntry = {
      ...event,
      timestamp: event.timestamp || new Date().toISOString(),
      environment: this.isDevelopment ? 'development' : 'production'
    };

    // Console output for development
    if (this.isDevelopment) {
      const logMethod = event.level === 'error' ? console.error : 
                       event.level === 'warn' ? console.warn : 
                       console.log;
      
      logMethod(`[${event.level.toUpperCase()}] ${event.message}`, 
                event.context ? event.context : '');
    }

    // In production, you could send to Sentry, LogRocket, etc.
    // if (!this.isDevelopment) {
    //   // Send to monitoring service
    // }
  }

  info(message: string, context?: Record<string, any>) {
    this.log({ level: 'info', message, context });
  }

  warn(message: string, context?: Record<string, any>) {
    this.log({ level: 'warn', message, context });
  }

  error(message: string, error?: Error, context?: Record<string, any>) {
    this.log({ 
      level: 'error', 
      message, 
      context: { 
        ...context, 
        error: error?.message,
        stack: error?.stack 
      } 
    });
  }

  // Performance tracking
  startTimer(label: string): () => void {
    const startTime = performance.now();
    return () => {
      const duration = performance.now() - startTime;
      this.log({
        level: 'info',
        message: `Performance: ${label}`,
        performance: { startTime, duration },
        context: { durationMs: Math.round(duration * 100) / 100 }
      });
    };
  }

  // Package loading metrics
  trackPackageLoad(packageCount: number, priceCount: number, loadTime: number) {
    this.info('Package Loading Metrics', {
      packageCount,
      priceCount,
      loadTimeMs: Math.round(loadTime * 100) / 100,
      success: packageCount > 0
    });
  }

  // User interaction tracking
  trackUserAction(action: string, context?: Record<string, any>) {
    this.info(`User Action: ${action}`, context);
  }
}

export const monitoring = new MonitoringService();