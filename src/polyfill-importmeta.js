// Polyfill for import.meta in Jest environment
if (typeof globalThis !== 'undefined' && typeof globalThis.import === 'undefined') {
  // Minimal shape for import.meta compatibility
  globalThis.import = {
    meta: {
      env: {}
    }
  };
}