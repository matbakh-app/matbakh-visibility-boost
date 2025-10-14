/**
 * Development utilities for enhanced debugging and development experience
 */

// Development environment detection
export const isDevelopment =
  typeof window !== "undefined"
    ? import.meta.env?.DEV ?? process.env.NODE_ENV === "development"
    : process.env.NODE_ENV === "development";
export const isProduction =
  typeof window !== "undefined"
    ? import.meta.env?.PROD ?? process.env.NODE_ENV === "production"
    : process.env.NODE_ENV === "production";
export const isTest =
  typeof window !== "undefined"
    ? import.meta.env?.MODE === "test" || process.env.NODE_ENV === "test"
    : process.env.NODE_ENV === "test";

// Enhanced console logging for development
export const devLog = {
  info: (message: string, ...args: unknown[]) => {
    if (isDevelopment) {
      console.log(`🔍 [DEV] ${message}`, ...args);
    }
  },

  warn: (message: string, ...args: unknown[]) => {
    if (isDevelopment) {
      console.warn(`⚠️ [DEV] ${message}`, ...args);
    }
  },

  error: (message: string, ...args: unknown[]) => {
    if (isDevelopment) {
      console.error(`❌ [DEV] ${message}`, ...args);
    }
  },

  performance: (label: string, fn: () => void) => {
    if (isDevelopment) {
      console.time(`⏱️ [PERF] ${label}`);
      fn();
      console.timeEnd(`⏱️ [PERF] ${label}`);
    } else {
      fn();
    }
  },

  group: (label: string, fn: () => void) => {
    if (isDevelopment) {
      console.group(`📁 [GROUP] ${label}`);
      fn();
      console.groupEnd();
    } else {
      fn();
    }
  },
};

// Component debugging utilities
export const debugComponent = (
  componentName: string,
  props?: Record<string, unknown>
) => {
  if (isDevelopment) {
    devLog.info(`Rendering component: ${componentName}`, props);
  }
};

// Hook debugging utilities
export const debugHook = (
  hookName: string,
  state?: Record<string, unknown>
) => {
  if (isDevelopment) {
    devLog.info(`Hook state: ${hookName}`, state);
  }
};

// API debugging utilities
export const debugApi = {
  request: (url: string, options?: RequestInit) => {
    if (isDevelopment) {
      devLog.info(`API Request: ${options?.method || "GET"} ${url}`, options);
    }
  },

  response: (url: string, response: Response, data?: unknown) => {
    if (isDevelopment) {
      devLog.info(`API Response: ${response.status} ${url}`, {
        response,
        data,
      });
    }
  },

  error: (url: string, error: Error) => {
    if (isDevelopment) {
      devLog.error(`API Error: ${url}`, error);
    }
  },
};

// Performance debugging utilities
export const performanceDebug = {
  mark: (name: string) => {
    if (isDevelopment && "performance" in window) {
      performance.mark(name);
    }
  },

  measure: (name: string, startMark: string, endMark?: string) => {
    if (isDevelopment && "performance" in window) {
      try {
        performance.measure(name, startMark, endMark);
        const measure = performance.getEntriesByName(name, "measure")[0];
        devLog.performance(
          `${name}: ${measure.duration.toFixed(2)}ms`,
          () => {}
        );
      } catch (error) {
        devLog.error(`Performance measure failed: ${name}`, error);
      }
    }
  },

  clearMarks: () => {
    if (isDevelopment && "performance" in window) {
      performance.clearMarks();
      performance.clearMeasures();
    }
  },
};

// Memory debugging utilities
export const memoryDebug = {
  logUsage: () => {
    if (isDevelopment && "performance" in window && "memory" in performance) {
      const memory = (performance as any).memory;
      devLog.info("Memory Usage", {
        used: `${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
        total: `${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
        limit: `${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB`,
      });
    }
  },

  trackComponent: (componentName: string) => {
    if (isDevelopment) {
      return {
        onMount: () => {
          devLog.info(`Component mounted: ${componentName}`);
          memoryDebug.logUsage();
        },
        onUnmount: () => {
          devLog.info(`Component unmounted: ${componentName}`);
          memoryDebug.logUsage();
        },
      };
    }
    return { onMount: () => {}, onUnmount: () => {} };
  },
};

// Error boundary debugging
export const errorDebug = {
  logError: (error: Error, errorInfo?: { componentStack: string }) => {
    if (isDevelopment) {
      devLog.error("Component Error", { error, errorInfo });
    }
  },

  logWarning: (warning: string, component?: string) => {
    if (isDevelopment) {
      devLog.warn(
        `Component Warning${component ? ` in ${component}` : ""}`,
        warning
      );
    }
  },
};

// Development tools integration
export const devTools = {
  // React DevTools integration
  enableReactDevTools: () => {
    if (isDevelopment && typeof window !== "undefined") {
      // Enable React DevTools profiler
      const hook = (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__;
      if (hook) {
        hook.onCommitFiberRoot = (
          id: number,
          root: any,
          priorityLevel: any
        ) => {
          devLog.info("React Fiber Root Commit", { id, root, priorityLevel });
        };
      }
    }
  },

  // Redux DevTools integration (if needed)
  enableReduxDevTools: () => {
    if (isDevelopment && typeof window !== "undefined") {
      return (window as any).__REDUX_DEVTOOLS_EXTENSION__?.();
    }
    return undefined;
  },

  // Performance observer
  enablePerformanceObserver: () => {
    if (isDevelopment && "PerformanceObserver" in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === "navigation") {
            devLog.performance("Navigation timing", () => {
              const navEntry = entry as PerformanceNavigationTiming;
              console.table({
                "DNS Lookup": `${
                  navEntry.domainLookupEnd - navEntry.domainLookupStart
                }ms`,
                "TCP Connection": `${
                  navEntry.connectEnd - navEntry.connectStart
                }ms`,
                Request: `${navEntry.responseStart - navEntry.requestStart}ms`,
                Response: `${navEntry.responseEnd - navEntry.responseStart}ms`,
                "DOM Processing": `${
                  navEntry.domContentLoadedEventEnd - navEntry.responseEnd
                }ms`,
                Total: `${navEntry.loadEventEnd - navEntry.fetchStart}ms`,
              });
            });
          }
        }
      });

      observer.observe({
        entryTypes: ["navigation", "paint", "largest-contentful-paint"],
      });
      return observer;
    }
    return null;
  },
};

// Source map utilities for better debugging
export const sourceMapUtils = {
  // Get original source location from stack trace
  getOriginalLocation: async (
    filename: string,
    line: number,
    column: number
  ) => {
    if (isDevelopment) {
      try {
        // This would integrate with source-map library if needed
        devLog.info("Source map lookup", { filename, line, column });
        return { filename, line, column };
      } catch (error) {
        devLog.error("Source map lookup failed", error);
        return null;
      }
    }
    return null;
  },
};

// Export all utilities
export default {
  devLog,
  debugComponent,
  debugHook,
  debugApi,
  performanceDebug,
  memoryDebug,
  errorDebug,
  devTools,
  sourceMapUtils,
  isDevelopment,
  isProduction,
  isTest,
};
