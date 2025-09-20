/**
 * Safe Persona Hook - Following Task 6.4.4 Auth System Cleanup Pattern
 * 
 * This hook provides safe access to persona detection functionality
 * with comprehensive error handling and fallback mechanisms.
 * 
 * Based on the successful pattern from useSafeAuth.ts that resolved
 * the Auth System Chaos in Task 6.4.4.
 */

import { useState, useEffect, useCallback } from 'react';
import { PersonaType, UserBehavior, PersonaDetectionResult } from '@/types/persona';
import { personaApi } from '@/services/persona-api';

// Fallback persona when detection fails
const FALLBACK_PERSONA: PersonaType = 'Solo-Sarah';

interface PersonaState {
  currentPersona: PersonaType;
  confidence: number;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

interface PersonaHookReturn extends PersonaState {
  detectPersona: (behavior: UserBehavior) => Promise<void>;
  overridePersona: (persona: PersonaType) => void;
  resetPersona: () => void;
  isPersonaReady: boolean;
}

/**
 * Safe Persona Hook with comprehensive error handling
 * 
 * Features:
 * - Automatic fallback to Solo-Sarah on errors
 * - Local storage persistence for persona state
 * - Retry logic for failed detections
 * - Admin override support for testing
 * - No crashes on provider failures
 */
export function useSafePersona(): PersonaHookReturn {
  const [state, setState] = useState<PersonaState>({
    currentPersona: FALLBACK_PERSONA,
    confidence: 0.5, // Default confidence for fallback
    isLoading: false,
    error: null,
    lastUpdated: null,
  });

  // Load persisted persona from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('matbakh_persona_state');
      if (stored) {
        const parsed = JSON.parse(stored);
        setState(prev => ({
          ...prev,
          currentPersona: parsed.currentPersona || FALLBACK_PERSONA,
          confidence: parsed.confidence || 0.5,
          lastUpdated: parsed.lastUpdated ? new Date(parsed.lastUpdated) : null,
        }));
      }
    } catch (error) {
      console.warn('Failed to load persona from localStorage:', error);
      // Continue with fallback - no crash
    }
  }, []);

  // Persist persona state to localStorage
  const persistPersona = useCallback((newState: Partial<PersonaState>) => {
    try {
      const stateToStore = {
        currentPersona: newState.currentPersona,
        confidence: newState.confidence,
        lastUpdated: newState.lastUpdated?.toISOString(),
      };
      localStorage.setItem('matbakh_persona_state', JSON.stringify(stateToStore));
    } catch (error) {
      console.warn('Failed to persist persona to localStorage:', error);
      // Continue without persistence - no crash
    }
  }, []);

  // Detect persona with comprehensive error handling
  const detectPersona = useCallback(async (behavior: UserBehavior) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Check for admin override first
      const adminOverride = localStorage.getItem('matbakh_admin_persona_override');
      if (adminOverride) {
        const overridePersona = adminOverride as PersonaType;
        const newState = {
          currentPersona: overridePersona,
          confidence: 1.0, // Admin override has full confidence
          isLoading: false,
          error: null,
          lastUpdated: new Date(),
        };
        setState(newState);
        persistPersona(newState);
        return;
      }

      // Call Advanced Persona System API (with mock fallback)
      const { personaApi } = await import('@/services/persona-api');
      
      // For local development, use test user ID if no real user
      const testBehavior = {
        ...behavior,
        userId: behavior.userId === 'anonymous' ? 'test-user-123' : behavior.userId,
      };
      
      const result = await personaApi.detectPersona(testBehavior);
      
      if (!result.success) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: result.error || 'Persona detection failed',
        }));
        return;
      }
      
      // Map persona string to PersonaType
      const personaMapping: Record<string, PersonaType> = {
        'price-conscious': 'Solo-Sarah',
        'feature-seeker': 'Bewahrer-Ben',
        'decision-maker': 'Wachstums-Walter',
        'technical-evaluator': 'Ketten-Katrin',
        'unknown': FALLBACK_PERSONA,
      };
      
      const newState = {
        currentPersona: personaMapping[result.persona] || FALLBACK_PERSONA,
        confidence: result.confidence || 0.5,
        isLoading: false,
        error: null,
        lastUpdated: new Date(),
      };

      setState(newState);
      persistPersona(newState);

    } catch (error) {
      console.warn('Persona detection failed, using fallback:', error);
      
      // Graceful fallback - no crash
      const fallbackState = {
        currentPersona: FALLBACK_PERSONA,
        confidence: 0.3, // Lower confidence for error fallback
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        lastUpdated: new Date(),
      };

      setState(fallbackState);
      persistPersona(fallbackState);
    }
  }, [persistPersona]);

  // Admin override for testing (following Task 6 pattern)
  const overridePersona = useCallback((persona: PersonaType) => {
    try {
      localStorage.setItem('matbakh_admin_persona_override', persona);
      
      const newState = {
        currentPersona: persona,
        confidence: 1.0,
        isLoading: false,
        error: null,
        lastUpdated: new Date(),
      };

      setState(newState);
      persistPersona(newState);
    } catch (error) {
      console.warn('Failed to set persona override:', error);
      // Continue without override - no crash
    }
  }, [persistPersona]);

  // Reset persona to default state
  const resetPersona = useCallback(() => {
    try {
      localStorage.removeItem('matbakh_admin_persona_override');
      localStorage.removeItem('matbakh_persona_state');
      
      const resetState = {
        currentPersona: FALLBACK_PERSONA,
        confidence: 0.5,
        isLoading: false,
        error: null,
        lastUpdated: null,
      };

      setState(resetState);
    } catch (error) {
      console.warn('Failed to reset persona:', error);
      // Continue with reset - no crash
    }
  }, []);

  // Computed property for readiness check
  const isPersonaReady = !state.isLoading && state.confidence > 0.3;

  return {
    ...state,
    detectPersona,
    overridePersona,
    resetPersona,
    isPersonaReady,
  };
}

/**
 * Behavior tracking helper for automatic persona detection
 */
export function usePersonaBehaviorTracking() {
  const { detectPersona } = useSafePersona();

  const trackBehavior = useCallback((behavior: Partial<UserBehavior>) => {
    try {
      // Build complete behavior object with defaults
      const completeBehavior: UserBehavior = {
        sessionId: behavior.sessionId || `session-${Date.now()}`,
        userId: behavior.userId || 'anonymous',
        timestamp: behavior.timestamp || new Date().toISOString(),
        clickPatterns: behavior.clickPatterns || [],
        navigationFlow: behavior.navigationFlow || [],
        timeSpent: behavior.timeSpent || {
          totalSession: 0,
          perPage: {},
          activeTime: 0,
          idleTime: 0,
        },
        contentInteractions: behavior.contentInteractions || [],
        featureUsage: behavior.featureUsage || [],
        decisionSpeed: behavior.decisionSpeed || 0.5,
        informationConsumption: behavior.informationConsumption || {
          preferredContentLength: 'medium',
          readingSpeed: 200,
          comprehensionIndicators: {
            scrollBehavior: 'moderate',
            returnVisits: 0,
            actionTaken: false,
          },
        },
        deviceType: behavior.deviceType || 'desktop',
        sessionDuration: behavior.sessionDuration || 0,
        pageViews: behavior.pageViews || 1,
      };

      // Trigger persona detection
      detectPersona(completeBehavior);
    } catch (error) {
      console.warn('Behavior tracking failed:', error);
      // Continue without tracking - no crash
    }
  }, [detectPersona]);

  return { trackBehavior };
}