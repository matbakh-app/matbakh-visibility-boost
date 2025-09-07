/**
 * Graceful Degradation System
 * 
 * Implements graceful degradation for AI service failures
 * Provides fallback responses and maintains service availability
 */

import { responseCache } from './response-cache-system';
import { performanceMonitor } from './performance-monitoring';

export interface FallbackResponse {
  type: 'cached' | 'template' | 'simplified' | 'error';
  response: any;
  metadata: {
    fallbackReason: string;
    originalOperation: string;
    degradationLevel: 'none' | 'partial' | 'full';
    timestamp: number;
  };
}

export interface DegradationConfig {
  enableFallbacks: boolean;
  maxFailureRate: number; // 0.1 = 10%
  failureWindowMs: number; // 5 minutes
  circuitBreakerThreshold: number; // 5 consecutive failures
  fallbackTemplates: Record<string, any>;
}

export interface ServiceHealth {
  isHealthy: boolean;
  failureRate: number;
  consecutiveFailures: number;
  lastFailure?: number;
  circuitBreakerOpen: boolean;
  degradationLevel: 'none' | 'partial' | 'full';
}

export class GracefulDegradationSystem {
  private config: DegradationConfig;
  private serviceHealth: ServiceHealth;
  private recentFailures: number[] = [];
  private fallbackTemplates: Map<string, any> = new Map();

  constructor() {
    this.config = {
      enableFallbacks: process.env.ENABLE_FALLBACKS !== 'false',
      maxFailureRate: parseFloat(process.env.MAX_FAILURE_RATE || '0.1'),
      failureWindowMs: parseInt(process.env.FAILURE_WINDOW_MS || '300000'), // 5 minutes
      circuitBreakerThreshold: parseInt(process.env.CIRCUIT_BREAKER_THRESHOLD || '5'),
      fallbackTemplates: {}
    };

    this.serviceHealth = {
      isHealthy: true,
      failureRate: 0,
      consecutiveFailures: 0,
      circuitBreakerOpen: false,
      degradationLevel: 'none'
    };

    this.initializeFallbackTemplates();
  }

  /**
   * Initialize fallback templates for different operations
   */
  private initializeFallbackTemplates(): void {
    // VC Analysis fallback
    this.fallbackTemplates.set('vc-analysis', {
      summary: 'Aufgrund technischer Wartungsarbeiten können wir derzeit nur eine vereinfachte Analyse bereitstellen.',
      score: 'Nicht verfügbar',
      recommendations: [
        'Überprüfen Sie Ihre Google My Business Einträge',
        'Aktualisieren Sie Ihre Öffnungszeiten',
        'Fügen Sie aktuelle Fotos hinzu'
      ],
      nextSteps: 'Versuchen Sie es in wenigen Minuten erneut für eine detaillierte Analyse.'
    });

    // Content generation fallback
    this.fallbackTemplates.set('content-generation', {
      content: 'Entschuldigung, die KI-gestützte Content-Generierung ist momentan nicht verfügbar.',
      suggestions: [
        'Verwenden Sie bewährte Inhaltsvorlagen',
        'Teilen Sie aktuelle Angebote und Events',
        'Zeigen Sie Ihre Spezialitäten'
      ],
      templates: [
        'Heute haben wir [Gericht] für Sie zubereitet!',
        'Besuchen Sie uns für [Anlass] - wir freuen uns auf Sie!',
        'Frische Zutaten, traditionelle Rezepte - das ist unser [Restaurant Name]'
      ]
    });

    // Business framework fallback
    this.fallbackTemplates.set('business-framework', {
      analysis: 'Vereinfachte Analyse verfügbar',
      frameworks: {
        swot: {
          strengths: ['Bestehende Kundenbasis', 'Lokale Präsenz'],
          weaknesses: ['Detailanalyse nicht verfügbar'],
          opportunities: ['Digitale Präsenz ausbauen'],
          threats: ['Wettbewerb']
        }
      },
      recommendations: [
        'Fokussieren Sie sich auf Ihre Stammkunden',
        'Verbessern Sie Ihre Online-Präsenz',
        'Nutzen Sie lokale Marketing-Möglichkeiten'
      ]
    });

    // Persona detection fallback
    this.fallbackTemplates.set('persona-detection', {
      persona: 'Standard',
      confidence: 0,
      description: 'Aufgrund technischer Einschränkungen verwenden wir eine Standard-Persona.',
      recommendations: 'Allgemeine Empfehlungen für Restaurant-Betreiber'
    });
  }

  /**
   * Record service failure
   */
  recordFailure(operation: string, error: Error): void {
    const now = Date.now();
    this.recentFailures.push(now);
    this.serviceHealth.consecutiveFailures++;
    this.serviceHealth.lastFailure = now;

    // Clean old failures outside the window
    this.recentFailures = this.recentFailures.filter(
      timestamp => now - timestamp < this.config.failureWindowMs
    );

    // Calculate failure rate
    this.serviceHealth.failureRate = this.recentFailures.length / 
      Math.max(1, this.config.failureWindowMs / 60000); // failures per minute

    // Update health status
    this.updateHealthStatus();

    console.warn(`Service failure recorded for ${operation}:`, error.message);
    console.log(`Current failure rate: ${this.serviceHealth.failureRate.toFixed(2)}/min`);
  }

  /**
   * Record service success
   */
  recordSuccess(operation: string): void {
    this.serviceHealth.consecutiveFailures = 0;
    
    // If circuit breaker was open, consider partial recovery
    if (this.serviceHealth.circuitBreakerOpen) {
      console.log('Service success recorded, considering circuit breaker recovery');
    }

    this.updateHealthStatus();
  }

  /**
   * Update overall health status
   */
  private updateHealthStatus(): void {
    const wasHealthy = this.serviceHealth.isHealthy;
    const wasCircuitOpen = this.serviceHealth.circuitBreakerOpen;

    // Check circuit breaker
    this.serviceHealth.circuitBreakerOpen = 
      this.serviceHealth.consecutiveFailures >= this.config.circuitBreakerThreshold;

    // Determine degradation level
    if (this.serviceHealth.circuitBreakerOpen) {
      this.serviceHealth.degradationLevel = 'full';
      this.serviceHealth.isHealthy = false;
    } else if (this.serviceHealth.failureRate > this.config.maxFailureRate) {
      this.serviceHealth.degradationLevel = 'partial';
      this.serviceHealth.isHealthy = false;
    } else {
      this.serviceHealth.degradationLevel = 'none';
      this.serviceHealth.isHealthy = true;
    }

    // Log status changes
    if (wasHealthy !== this.serviceHealth.isHealthy) {
      console.log(`Service health changed: ${this.serviceHealth.isHealthy ? 'HEALTHY' : 'UNHEALTHY'}`);
    }

    if (wasCircuitOpen !== this.serviceHealth.circuitBreakerOpen) {
      console.log(`Circuit breaker ${this.serviceHealth.circuitBreakerOpen ? 'OPENED' : 'CLOSED'}`);
    }
  }

  /**
   * Get fallback response for failed operation
   */
  async getFallbackResponse(
    operation: string,
    originalPayload: any,
    error: Error,
    userId?: string,
    personaType?: string
  ): Promise<FallbackResponse> {
    if (!this.config.enableFallbacks) {
      return {
        type: 'error',
        response: { error: 'Service temporarily unavailable' },
        metadata: {
          fallbackReason: 'Fallbacks disabled',
          originalOperation: operation,
          degradationLevel: 'full',
          timestamp: Date.now()
        }
      };
    }

    // Try cached response first
    const cachedResponse = await this.getCachedFallback(operation, originalPayload, userId, personaType);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Try template fallback
    const templateResponse = this.getTemplateFallback(operation, originalPayload, personaType);
    if (templateResponse) {
      return templateResponse;
    }

    // Try simplified response
    const simplifiedResponse = this.getSimplifiedFallback(operation, originalPayload, error);
    if (simplifiedResponse) {
      return simplifiedResponse;
    }

    // Final error fallback
    return {
      type: 'error',
      response: {
        error: 'Service temporarily unavailable',
        message: 'Wir arbeiten an der Behebung des Problems. Bitte versuchen Sie es später erneut.',
        supportContact: 'support@matbakh.app'
      },
      metadata: {
        fallbackReason: 'All fallback methods exhausted',
        originalOperation: operation,
        degradationLevel: this.serviceHealth.degradationLevel,
        timestamp: Date.now()
      }
    };
  }

  /**
   * Try to get cached response as fallback
   */
  private async getCachedFallback(
    operation: string,
    payload: any,
    userId?: string,
    personaType?: string
  ): Promise<FallbackResponse | null> {
    try {
      // Try exact match first
      let cached = await responseCache.getCachedResponse(operation, payload, userId, personaType);
      
      if (!cached) {
        // Try without user-specific data
        cached = await responseCache.getCachedResponse(operation, payload);
      }

      if (!cached) {
        // Try similar requests (simplified payload)
        const simplifiedPayload = this.simplifyPayload(payload);
        cached = await responseCache.getCachedResponse(operation, simplifiedPayload);
      }

      if (cached) {
        return {
          type: 'cached',
          response: cached.response,
          metadata: {
            fallbackReason: 'Using cached response due to service failure',
            originalOperation: operation,
            degradationLevel: 'partial',
            timestamp: Date.now()
          }
        };
      }

    } catch (error) {
      console.error('Failed to get cached fallback:', error);
    }

    return null;
  }

  /**
   * Get template-based fallback
   */
  private getTemplateFallback(
    operation: string,
    payload: any,
    personaType?: string
  ): FallbackResponse | null {
    const template = this.fallbackTemplates.get(operation);
    if (!template) {
      return null;
    }

    // Customize template based on persona
    let customizedTemplate = { ...template };
    if (personaType) {
      customizedTemplate = this.customizeTemplateForPersona(template, personaType);
    }

    // Try to inject some payload data into template
    customizedTemplate = this.injectPayloadData(customizedTemplate, payload);

    return {
      type: 'template',
      response: customizedTemplate,
      metadata: {
        fallbackReason: 'Using template response due to service failure',
        originalOperation: operation,
        degradationLevel: 'partial',
        timestamp: Date.now()
      }
    };
  }

  /**
   * Get simplified fallback response
   */
  private getSimplifiedFallback(
    operation: string,
    payload: any,
    error: Error
  ): FallbackResponse | null {
    const simplifiedResponses: Record<string, any> = {
      'vc-analysis': {
        message: 'Vereinfachte Analyse verfügbar',
        status: 'Ihre Anfrage wird bearbeitet',
        nextSteps: 'Detaillierte Ergebnisse folgen per E-Mail'
      },
      'content-generation': {
        message: 'Content-Vorschläge temporär nicht verfügbar',
        alternatives: 'Nutzen Sie unsere Vorlagen-Bibliothek',
        support: 'Kontaktieren Sie unser Support-Team für Hilfe'
      },
      'business-framework': {
        message: 'Business-Analyse wird vereinfacht dargestellt',
        recommendation: 'Fokussieren Sie sich auf Ihre wichtigsten KPIs',
        followUp: 'Detaillierte Analyse wird nachgeliefert'
      }
    };

    const response = simplifiedResponses[operation];
    if (!response) {
      return null;
    }

    return {
      type: 'simplified',
      response,
      metadata: {
        fallbackReason: `Simplified response due to: ${error.message}`,
        originalOperation: operation,
        degradationLevel: 'partial',
        timestamp: Date.now()
      }
    };
  }

  /**
   * Customize template for specific persona
   */
  private customizeTemplateForPersona(template: any, personaType: string): any {
    const personaCustomizations: Record<string, any> = {
      'Der Skeptiker': {
        tone: 'data-driven',
        includeMetrics: true,
        language: 'technical'
      },
      'Der Überforderte': {
        tone: 'supportive',
        simplifyLanguage: true,
        includeSteps: true
      },
      'Der Zeitknappe': {
        tone: 'concise',
        prioritizeActions: true,
        quickWins: true
      },
      'Der Profi': {
        tone: 'professional',
        includeDetails: true,
        advancedOptions: true
      }
    };

    const customization = personaCustomizations[personaType];
    if (!customization) {
      return template;
    }

    // Apply customizations (simplified implementation)
    let customized = { ...template };
    
    if (customization.simplifyLanguage) {
      customized.summary = 'Einfache Erklärung: ' + (customized.summary || '');
    }
    
    if (customization.prioritizeActions && customized.recommendations) {
      customized.recommendations = customized.recommendations.slice(0, 3); // Top 3 only
    }

    return customized;
  }

  /**
   * Inject payload data into template
   */
  private injectPayloadData(template: any, payload: any): any {
    if (!payload || typeof template !== 'object') {
      return template;
    }

    let result = JSON.stringify(template);
    
    // Replace common placeholders
    if (payload.businessName) {
      result = result.replace(/\[Restaurant Name\]/g, payload.businessName);
    }
    
    if (payload.location) {
      result = result.replace(/\[Standort\]/g, payload.location);
    }

    try {
      return JSON.parse(result);
    } catch {
      return template;
    }
  }

  /**
   * Simplify payload for broader cache matching
   */
  private simplifyPayload(payload: any): any {
    if (!payload || typeof payload !== 'object') {
      return payload;
    }

    // Keep only essential fields
    const essential = ['operation', 'businessType', 'category', 'location'];
    const simplified: any = {};

    for (const key of essential) {
      if (payload[key]) {
        simplified[key] = payload[key];
      }
    }

    return simplified;
  }

  /**
   * Check if service should be degraded
   */
  shouldDegrade(): boolean {
    return !this.serviceHealth.isHealthy || this.serviceHealth.circuitBreakerOpen;
  }

  /**
   * Get current service health
   */
  getServiceHealth(): ServiceHealth {
    return { ...this.serviceHealth };
  }

  /**
   * Force circuit breaker open (for maintenance)
   */
  openCircuitBreaker(reason: string): void {
    this.serviceHealth.circuitBreakerOpen = true;
    this.serviceHealth.degradationLevel = 'full';
    this.serviceHealth.isHealthy = false;
    console.log(`Circuit breaker manually opened: ${reason}`);
  }

  /**
   * Force circuit breaker closed (after maintenance)
   */
  closeCircuitBreaker(): void {
    this.serviceHealth.circuitBreakerOpen = false;
    this.serviceHealth.consecutiveFailures = 0;
    this.recentFailures = [];
    this.updateHealthStatus();
    console.log('Circuit breaker manually closed');
  }

  /**
   * Get degradation statistics
   */
  getDegradationStats(): {
    totalFailures: number;
    recentFailures: number;
    failureRate: number;
    uptime: number;
    degradationLevel: string;
    circuitBreakerOpen: boolean;
  } {
    const now = Date.now();
    const recentFailures = this.recentFailures.length;
    
    return {
      totalFailures: this.serviceHealth.consecutiveFailures,
      recentFailures,
      failureRate: this.serviceHealth.failureRate,
      uptime: this.serviceHealth.isHealthy ? 100 : 0, // Simplified
      degradationLevel: this.serviceHealth.degradationLevel,
      circuitBreakerOpen: this.serviceHealth.circuitBreakerOpen
    };
  }
}

// Singleton instance
export const gracefulDegradation = new GracefulDegradationSystem();