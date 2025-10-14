/**
 * Circuit Breaker Pattern Implementation
 *
 * Implements:
 * - Circuit breaker for provider resilience
 * - Automatic failure detection and recovery
 * - Configurable thresholds and timeouts
 * - Health check integration
 * - Fallback mechanism coordination
 */

import { Provider } from "./types";

export interface CircuitBreakerConfig {
  failureThreshold: number;
  recoveryTimeout: number;
  monitoringWindow: number;
  halfOpenMaxCalls: number;
  healthCheckInterval: number;
}

export interface CircuitBreakerState {
  provider: Provider;
  state: "closed" | "open" | "half-open";
  failureCount: number;
  lastFailureTime: number;
  lastSuccessTime: number;
  nextAttemptTime: number;
  totalRequests: number;
  successfulRequests: number;
  halfOpenAttempts: number;
}

export interface CircuitBreakerMetrics {
  provider: Provider;
  state: "closed" | "open" | "half-open";
  failureRate: number;
  uptime: number;
  lastFailure: Date | null;
  lastSuccess: Date | null;
  totalFailures: number;
  totalSuccesses: number;
  circuitOpenTime: number;
}

/**
 * Circuit Breaker for Provider Resilience
 */
export class CircuitBreaker {
  private config: CircuitBreakerConfig;
  private states: Map<Provider, CircuitBreakerState> = new Map();
  private healthCheckTimers: Map<Provider, NodeJS.Timeout> = new Map();

  constructor(config: Partial<CircuitBreakerConfig> = {}) {
    this.config = {
      failureThreshold: 5, // Open circuit after 5 failures
      recoveryTimeout: 60000, // 1 minute recovery timeout
      monitoringWindow: 300000, // 5 minute monitoring window
      halfOpenMaxCalls: 3, // Max calls in half-open state
      healthCheckInterval: 30000, // 30 second health check interval
      ...config,
    };

    this.initializeProviders();
  }

  /**
   * Check if circuit breaker is open for a provider
   */
  isOpen(provider: Provider): boolean {
    const state = this.getState(provider);
    return state.state === "open";
  }

  /**
   * Execute request through circuit breaker
   */
  async execute<T>(
    provider: Provider,
    operation: () => Promise<T>
  ): Promise<T> {
    const state = this.getState(provider);

    // Check if circuit is open
    if (state.state === "open") {
      if (Date.now() < state.nextAttemptTime) {
        throw new Error(
          `Circuit breaker is OPEN for provider ${provider}. Next attempt at ${new Date(
            state.nextAttemptTime
          )}`
        );
      } else {
        // Transition to half-open
        this.transitionToHalfOpen(provider);
      }
    }

    // Check half-open limits
    if (
      state.state === "half-open" &&
      state.halfOpenAttempts >= this.config.halfOpenMaxCalls
    ) {
      throw new Error(
        `Circuit breaker is HALF-OPEN for provider ${provider}. Max attempts reached.`
      );
    }

    try {
      // Execute the operation
      const startTime = Date.now();
      const result = await operation();
      const latency = Date.now() - startTime;

      // Record success
      this.recordSuccess(provider, latency);

      return result;
    } catch (error) {
      // Record failure
      this.recordFailure(provider, error);
      throw error;
    }
  }

  /**
   * Record successful operation
   */
  private recordSuccess(provider: Provider, latency: number): void {
    const state = this.getState(provider);

    state.successfulRequests++;
    state.totalRequests++;
    state.lastSuccessTime = Date.now();

    // Reset failure count on success
    state.failureCount = 0;

    // Transition from half-open to closed if successful
    if (state.state === "half-open") {
      state.halfOpenAttempts++;

      // If we've had enough successful attempts, close the circuit
      if (state.halfOpenAttempts >= this.config.halfOpenMaxCalls) {
        this.transitionToClosed(provider);
      }
    }

    this.updateState(provider, state);
  }

  /**
   * Record failed operation
   */
  private recordFailure(provider: Provider, error: any): void {
    const state = this.getState(provider);

    state.failureCount++;
    state.totalRequests++;
    state.lastFailureTime = Date.now();

    // Check if we should open the circuit
    if (
      state.state === "closed" &&
      state.failureCount >= this.config.failureThreshold
    ) {
      this.transitionToOpen(provider);
    } else if (state.state === "half-open") {
      // Any failure in half-open state should open the circuit
      this.transitionToOpen(provider);
    }

    this.updateState(provider, state);
  }

  /**
   * Transition circuit to OPEN state
   */
  private transitionToOpen(provider: Provider): void {
    const state = this.getState(provider);

    state.state = "open";
    state.nextAttemptTime = Date.now() + this.config.recoveryTimeout;
    state.halfOpenAttempts = 0;

    console.warn(
      `Circuit breaker OPENED for provider ${provider}. Next attempt at ${new Date(
        state.nextAttemptTime
      )}`
    );

    // Start health check timer
    this.startHealthCheck(provider);

    this.updateState(provider, state);
  }

  /**
   * Transition circuit to HALF-OPEN state
   */
  private transitionToHalfOpen(provider: Provider): void {
    const state = this.getState(provider);

    state.state = "half-open";
    state.halfOpenAttempts = 0;

    console.info(
      `Circuit breaker transitioned to HALF-OPEN for provider ${provider}`
    );

    this.updateState(provider, state);
  }

  /**
   * Transition circuit to CLOSED state
   */
  private transitionToClosed(provider: Provider): void {
    const state = this.getState(provider);

    state.state = "closed";
    state.failureCount = 0;
    state.halfOpenAttempts = 0;

    console.info(`Circuit breaker CLOSED for provider ${provider}`);

    // Stop health check timer
    this.stopHealthCheck(provider);

    this.updateState(provider, state);
  }

  /**
   * Start health check for provider
   */
  private startHealthCheck(provider: Provider): void {
    this.stopHealthCheck(provider); // Clear any existing timer

    const timer = setInterval(async () => {
      try {
        const healthy = await this.performHealthCheck(provider);

        if (healthy) {
          console.info(
            `Health check passed for provider ${provider}. Transitioning to HALF-OPEN.`
          );
          this.transitionToHalfOpen(provider);
        }
      } catch (error) {
        console.warn(`Health check failed for provider ${provider}:`, error);
      }
    }, this.config.healthCheckInterval);

    this.healthCheckTimers.set(provider, timer);
  }

  /**
   * Stop health check for provider
   */
  private stopHealthCheck(provider: Provider): void {
    const timer = this.healthCheckTimers.get(provider);
    if (timer) {
      clearInterval(timer);
      this.healthCheckTimers.delete(provider);
    }
  }

  /**
   * Perform health check for provider
   */
  private async performHealthCheck(provider: Provider): Promise<boolean> {
    // In production, this would make actual health check requests
    // For now, simulate health check

    const state = this.getState(provider);
    const timeSinceLastFailure = Date.now() - state.lastFailureTime;

    // Simple heuristic: if it's been long enough since last failure, consider healthy
    return timeSinceLastFailure > this.config.recoveryTimeout;
  }

  /**
   * Get circuit breaker state for provider
   */
  private getState(provider: Provider): CircuitBreakerState {
    let state = this.states.get(provider);

    if (!state) {
      state = {
        provider,
        state: "closed",
        failureCount: 0,
        lastFailureTime: 0,
        lastSuccessTime: Date.now(),
        nextAttemptTime: 0,
        totalRequests: 0,
        successfulRequests: 0,
        halfOpenAttempts: 0,
      };

      this.states.set(provider, state);
    }

    return state;
  }

  /**
   * Update state for provider
   */
  private updateState(provider: Provider, state: CircuitBreakerState): void {
    this.states.set(provider, state);
  }

  /**
   * Check if provider is available
   */
  isAvailable(provider: Provider): boolean {
    const state = this.getState(provider);

    if (state.state === "closed") {
      return true;
    }

    if (state.state === "half-open") {
      return state.halfOpenAttempts < this.config.halfOpenMaxCalls;
    }

    if (state.state === "open") {
      return Date.now() >= state.nextAttemptTime;
    }

    return false;
  }

  /**
   * Get circuit breaker metrics for provider
   */
  getMetrics(provider: Provider): CircuitBreakerMetrics {
    const state = this.getState(provider);

    const failureRate =
      state.totalRequests > 0
        ? (state.totalRequests - state.successfulRequests) / state.totalRequests
        : 0;

    const uptime =
      state.totalRequests > 0
        ? state.successfulRequests / state.totalRequests
        : 1;

    const circuitOpenTime =
      state.state === "open" ? Date.now() - state.lastFailureTime : 0;

    return {
      provider,
      state: state.state,
      failureRate,
      uptime,
      lastFailure:
        state.lastFailureTime > 0 ? new Date(state.lastFailureTime) : null,
      lastSuccess:
        state.lastSuccessTime > 0 ? new Date(state.lastSuccessTime) : null,
      totalFailures: state.totalRequests - state.successfulRequests,
      totalSuccesses: state.successfulRequests,
      circuitOpenTime,
    };
  }

  /**
   * Get all circuit breaker metrics
   */
  getAllMetrics(): CircuitBreakerMetrics[] {
    const providers: Provider[] = ["bedrock", "google", "meta"];
    return providers.map((provider) => this.getMetrics(provider));
  }

  /**
   * Get available providers
   */
  getAvailableProviders(): Provider[] {
    const providers: Provider[] = ["bedrock", "google", "meta"];
    return providers.filter((provider) => this.isAvailable(provider));
  }

  /**
   * Force open circuit for provider (for testing/maintenance)
   */
  forceOpen(provider: Provider): void {
    const state = this.getState(provider);
    state.state = "open";
    state.nextAttemptTime = Date.now() + this.config.recoveryTimeout;

    console.warn(`Circuit breaker FORCE OPENED for provider ${provider}`);

    this.startHealthCheck(provider);
    this.updateState(provider, state);
  }

  /**
   * Force close circuit for provider (for testing/maintenance)
   */
  forceClose(provider: Provider): void {
    const state = this.getState(provider);
    state.state = "closed";
    state.failureCount = 0;
    state.halfOpenAttempts = 0;

    console.info(`Circuit breaker FORCE CLOSED for provider ${provider}`);

    this.stopHealthCheck(provider);
    this.updateState(provider, state);
  }

  /**
   * Reset circuit breaker for provider
   */
  reset(provider: Provider): void {
    this.stopHealthCheck(provider);
    this.states.delete(provider);

    console.info(`Circuit breaker RESET for provider ${provider}`);
  }

  /**
   * Reset all circuit breakers
   */
  resetAll(): void {
    const providers: Provider[] = ["bedrock", "google", "meta"];
    providers.forEach((provider) => this.reset(provider));
  }

  /**
   * Initialize providers
   */
  private initializeProviders(): void {
    const providers: Provider[] = ["bedrock", "google", "meta"];
    providers.forEach((provider) => this.getState(provider));
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    // Clear all health check timers
    this.healthCheckTimers.forEach((timer) => {
      clearInterval(timer);
    });

    this.healthCheckTimers.clear();
    this.states.clear();
  }
}

/**
 * Factory function for creating circuit breaker
 */
export const createCircuitBreaker = (
  config?: Partial<CircuitBreakerConfig>
): CircuitBreaker => {
  return new CircuitBreaker(config);
};
