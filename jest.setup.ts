/**
 * Jest Setup File
 * Global polyfills and test environment configuration
 */

// setImmediate polyfill for JSDOM compatibility
if (typeof (global as any).setImmediate !== 'function') {
  (global as any).setImmediate = (fn: (...a: any[]) => void, ...a: any[]) =>
    setTimeout(fn, 0, ...a);
}

// Mock window.location methods (location object already exists in JSDOM)
if (typeof window !== 'undefined' && window.location) {
  // Only mock the methods if they don't exist or aren't functions
  if (typeof window.location.assign !== 'function') {
    window.location.assign = jest.fn();
  }
  if (typeof window.location.reload !== 'function') {
    window.location.reload = jest.fn();
  }
  if (typeof window.location.replace !== 'function') {
    window.location.replace = jest.fn();
  }
}