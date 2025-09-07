/**
 * Circuit Breaker Pattern Implementation for Bedrock AI
 * Provides resilience and graceful degradation when AI services fail
 */

export interface CircuitBreakerConfig {
  failureThreshold: number;
  recoveryTimeout: number;
  monitoringWindow: number;
  halfOpenMaxCalls: number;
}

export interface CircuitBreakerState {
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  failureCount: number;
  lastFailureTime: number;
  nextAttemptTime: number;
  successCount: number;
  totalCalls: number;
}

export interface FallbackResponse {
  content: string;
  fallback: true;
  reason: string;
  timestamp: string;
  requestType: string;
}

// Default configuration
const DEFAULT_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 5,        // Open circuit after 5 failures
  recoveryTimeout: 60000,     // Wait 60 seconds before trying again
  monitoringWindow: 300000,   // 5-minute monitoring window
  halfOpenMaxCalls: 3,        // Allow 3 calls in half-open state
};

// In-memory state storage (in production, use Redis or DynamoDB)
const circuitStates = new Map<string, CircuitBreakerState>();

/**
 * Get or create circuit breaker state for a service
 */
function getCircuitState(serviceKey: string): CircuitBreakerState {
  if (!circuitStates.has(serviceKey)) {
    circuitStates.set(serviceKey, {
      state: 'CLOSED',
      failureCount: 0,
      lastFailureTime: 0,
      nextAttemptTime: 0,
      successCount: 0,
      totalCalls: 0,
    });
  }
  return circuitStates.get(serviceKey)!;
}

/**
 * Update circuit breaker state
 */
function updateCircuitState(serviceKey: string, state: Partial<CircuitBreakerState>): void {
  const currentState = getCircuitState(serviceKey);
  circuitStates.set(serviceKey, { ...currentState, ...state });
}

/**
 * Check if circuit should be opened due to failures
 */
function shouldOpenCircuit(
  state: CircuitBreakerState,
  config: CircuitBreakerConfig
): boolean {
  const now = Date.now();
  const windowStart = now - config.monitoringWindow;
  
  // Reset failure count if outside monitoring window
  if (state.lastFailureTime < windowStart) {
    return false;
  }
  
  return state.failureCount >= config.failureThreshold;
}

/**
 * Check if circuit should transition to half-open
 */
function shouldTryHalfOpen(
  state: CircuitBreakerState,
  config: CircuitBreakerConfig
): boolean {
  const now = Date.now();
  return state.state === 'OPEN' && now >= state.nextAttemptTime;
}

/**
 * Generate fallback response based on request type
 */
function generateFallbackResponse(
  requestType: string,
  reason: string
): FallbackResponse {
  const fallbackContent = getFallbackContent(requestType);
  
  return {
    content: fallbackContent,
    fallback: true,
    reason,
    timestamp: new Date().toISOString(),
    requestType,
  };
}

/**
 * Get fallback content based on request type
 */
function getFallbackContent(requestType: string): string {
  switch (requestType) {
    case 'vc_analysis':
      return `Entschuldigung, die KI-gestützte Sichtbarkeitsanalyse ist vorübergehend nicht verfügbar. 
      
Hier sind einige grundlegende Empfehlungen:
• Überprüfen Sie Ihr Google My Business Profil auf Vollständigkeit
• Stellen Sie sicher, dass Ihre Kontaktdaten aktuell sind
• Sammeln Sie aktiv Kundenbewertungen
• Posten Sie regelmäßig Updates und Fotos

Für eine detaillierte Analyse versuchen Sie es bitte später erneut oder kontaktieren Sie unseren Support.`;

    case 'content_generation':
      return `Die KI-gestützte Content-Erstellung ist vorübergehend nicht verfügbar.

Hier sind einige Tipps für die manuelle Content-Erstellung:
• Verwenden Sie authentische, persönliche Sprache
• Zeigen Sie Ihre Gerichte und Ihr Team
• Teilen Sie Geschichten über Ihre Zutaten und Zubereitungsart
• Nutzen Sie lokale Hashtags und Erwähnungen

Versuchen Sie es später erneut für automatisierte Unterstützung.`;

    case 'persona_detection':
      return `Die Persona-Erkennung ist vorübergehend nicht verfügbar. 

Wir verwenden Standard-Empfehlungen, die für die meisten Gastronomiebetriebe geeignet sind:
• Fokus auf lokale Sichtbarkeit
• Betonung von Qualität und Service
• Regelmäßige Kommunikation mit Gästen
• Aufbau einer starken Online-Präsenz

Für personalisierte Empfehlungen versuchen Sie es später erneut.`;

    case 'text_rewrite':
      return `Die KI-gestützte Textoptimierung ist vorübergehend nicht verfügbar.

Tipps für die manuelle Textverbesserung:
• Verwenden Sie klare, verständliche Sprache
• Strukturieren Sie Texte mit Absätzen und Listen
• Fügen Sie relevante Keywords natürlich ein
• Schreiben Sie für Ihre Zielgruppe, nicht für Suchmaschinen

Versuchen Sie es später für automatisierte Optimierung erneut.`;

    default:
      return `Der KI-Service ist vorübergehend nicht verfügbar. Bitte versuchen Sie es später erneut oder kontaktieren Sie unseren Support für weitere Hilfe.`;
  }
}

/**
 * Circuit breaker wrapper for AI operations
 */
export async function withCircuitBreaker<T>(
  serviceKey: string,
  operation: () => Promise<T>,
  requestType: string,
  config: Partial<CircuitBreakerConfig> = {}
): Promise<T | FallbackResponse> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const state = getCircuitState(serviceKey);
  const now = Date.now();

  // Increment total calls
  updateCircuitState(serviceKey, { totalCalls: state.totalCalls + 1 });

  // Check circuit state
  switch (state.state) {
    case 'OPEN':
      if (shouldTryHalfOpen(state, finalConfig)) {
        console.log(`Circuit breaker transitioning to HALF_OPEN for ${serviceKey}`);
        updateCircuitState(serviceKey, { 
          state: 'HALF_OPEN',
          successCount: 0,
        });
        break; // Continue to execute operation
      } else {
        console.log(`Circuit breaker OPEN for ${serviceKey}, returning fallback`);
        return generateFallbackResponse(requestType, 'Circuit breaker is open due to repeated failures');
      }

    case 'HALF_OPEN':
      if (state.successCount >= finalConfig.halfOpenMaxCalls) {
        console.log(`Circuit breaker HALF_OPEN max calls reached for ${serviceKey}, returning fallback`);
        return generateFallbackResponse(requestType, 'Circuit breaker is in half-open state, limiting calls');
      }
      break;

    case 'CLOSED':
      // Check if we should open the circuit
      if (shouldOpenCircuit(state, finalConfig)) {
        console.log(`Opening circuit breaker for ${serviceKey} due to failure threshold`);
        updateCircuitState(serviceKey, {
          state: 'OPEN',
          nextAttemptTime: now + finalConfig.recoveryTimeout,
        });
        return generateFallbackResponse(requestType, 'Circuit breaker opened due to failure threshold');
      }
      break;
  }

  // Execute the operation
  try {
    console.log(`Executing operation for ${serviceKey} (state: ${state.state})`);
    const result = await operation();

    // Operation succeeded
    if (state.state === 'HALF_OPEN') {
      const newSuccessCount = state.successCount + 1;
      if (newSuccessCount >= finalConfig.halfOpenMaxCalls) {
        console.log(`Circuit breaker closing for ${serviceKey} after successful recovery`);
        updateCircuitState(serviceKey, {
          state: 'CLOSED',
          failureCount: 0,
          successCount: 0,
        });
      } else {
        updateCircuitState(serviceKey, { successCount: newSuccessCount });
      }
    } else if (state.state === 'CLOSED') {
      // Reset failure count on success
      updateCircuitState(serviceKey, { failureCount: 0 });
    }

    return result;

  } catch (error) {
    console.error(`Operation failed for ${serviceKey}:`, error);

    // Operation failed
    const newFailureCount = state.failureCount + 1;
    const shouldOpen = newFailureCount >= finalConfig.failureThreshold;

    if (shouldOpen) {
      console.log(`Opening circuit breaker for ${serviceKey} after ${newFailureCount} failures`);
      updateCircuitState(serviceKey, {
        state: 'OPEN',
        failureCount: newFailureCount,
        lastFailureTime: now,
        nextAttemptTime: now + finalConfig.recoveryTimeout,
      });
    } else {
      updateCircuitState(serviceKey, {
        failureCount: newFailureCount,
        lastFailureTime: now,
      });
    }

    // Return fallback response instead of throwing
    return generateFallbackResponse(
      requestType,
      `Service temporarily unavailable: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Get circuit breaker metrics for monitoring
 */
export function getCircuitBreakerMetrics(): Record<string, {
  state: string;
  failureCount: number;
  successRate: number;
  totalCalls: number;
  lastFailureTime: string;
}> {
  const metrics: Record<string, any> = {};

  for (const [serviceKey, state] of circuitStates.entries()) {
    const successRate = state.totalCalls > 0 
      ? ((state.totalCalls - state.failureCount) / state.totalCalls) * 100 
      : 100;

    metrics[serviceKey] = {
      state: state.state,
      failureCount: state.failureCount,
      successRate: Math.round(successRate * 100) / 100,
      totalCalls: state.totalCalls,
      lastFailureTime: state.lastFailureTime > 0 
        ? new Date(state.lastFailureTime).toISOString() 
        : 'never',
    };
  }

  return metrics;
}

/**
 * Reset circuit breaker state (for testing or manual recovery)
 */
export function resetCircuitBreaker(serviceKey: string): void {
  console.log(`Manually resetting circuit breaker for ${serviceKey}`);
  updateCircuitState(serviceKey, {
    state: 'CLOSED',
    failureCount: 0,
    lastFailureTime: 0,
    nextAttemptTime: 0,
    successCount: 0,
  });
}

/**
 * Check if response is a fallback
 */
export function isFallbackResponse(response: any): response is FallbackResponse {
  return response && typeof response === 'object' && response.fallback === true;
}