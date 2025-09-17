/**
 * Competitive Benchmarking Error Classes
 * JTBD: Clear error differentiation for reliable job completion
 */

export class BenchmarkingError extends Error {
  constructor(message: string, public statusCode = 500) {
    super(message);
    this.name = 'BenchmarkingError'; // 🛠️ wichtig!
  }
}

export class NoCompetitorsError extends BenchmarkingError {
  constructor(area?: string) {
    const message = area
      ? `No competitors found in the specified area: ${area}`
      : 'No competitors found in the specified area';
    super(message, 400);
    this.name = 'NoCompetitorsError'; // 🛠️ wichtig!
  }
}

export class InvalidPayloadError extends BenchmarkingError {
  constructor(details: string) {
    super(`Invalid request format: ${details}`, 400);
    this.name = 'InvalidPayloadError'; // 🛠️ wichtig!
  }
}

export class EngineFailureError extends BenchmarkingError {
  constructor(engine: string, originalError?: string) {
    const message = originalError
      ? `${engine} engine failed: ${originalError}`
      : `${engine} engine failed`;
    super(message, 500);
    this.name = 'EngineFailureError'; // 🛠️ wichtig!
  }
}

export class ConfigurationError extends BenchmarkingError {
  constructor(details: string) {
    super(`Configuration error: ${details}`, 500);
    this.name = 'ConfigurationError'; // 🛠️ wichtig!
  }
}

export class CacheError extends BenchmarkingError {
  constructor(operation: string) {
    super(`Cache ${operation} failed`, 500);
    this.name = 'CacheError'; // 🛠️ wichtig!
  }
}