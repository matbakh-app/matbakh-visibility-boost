/**
 * Persona Context - Following Task 6.4.4 Auth System Cleanup Pattern
 * 
 * This context provides persona detection and management functionality
 * following the successful unified provider pattern from AuthContext.tsx
 * that resolved the Auth System Chaos in Task 6.4.4.
 */

import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { PersonaType, UserBehavior, PersonaDetectionResult } from '@/types/persona';
import { useSafePersona } from '@/hooks/useSafePersona';

interface PersonaContextType {
  // Current persona state
  currentPersona: PersonaType;
  confidence: number;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  isPersonaReady: boolean;

  // Persona management functions
  detectPersona: (behavior: UserBehavior) => Promise<void>;
  overridePersona: (persona: PersonaType) => void;
  resetPersona: () => void;

  // Behavior tracking
  trackBehavior: (behavior: Partial<UserBehavior>) => void;

  // Persona-specific helpers
  getPersonaConfig: () => PersonaConfig;
  isPersona: (persona: PersonaType) => boolean;
  getPersonaPreferences: () => PersonaPreferences;
}

interface PersonaConfig {
  name: string;
  description: string;
  characteristics: string[];
  uiPreferences: {
    contentLength: 'short' | 'medium' | 'long';
    visualStyle: 'minimal' | 'standard' | 'rich';
    interactionStyle: 'guided' | 'exploratory' | 'expert';
  };
  onboardingStyle: {
    stepCount: 'minimal' | 'standard' | 'comprehensive';
    guidance: 'high' | 'medium' | 'low';
    pace: 'fast' | 'medium' | 'slow';
  };
}

interface PersonaPreferences {
  showDetailedAnalytics: boolean;
  preferQuickActions: boolean;
  needsGuidance: boolean;
  wantsAdvancedFeatures: boolean;
  timeConstraints: 'high' | 'medium' | 'low';
}

// Create the context with undefined default (will be checked by hook)
const PersonaContext = createContext<PersonaContextType | undefined>(undefined);

/**
 * Persona Provider Component
 * 
 * Provides persona detection and management functionality to the entire app.
 * Follows the same pattern as AuthProvider to ensure consistency.
 */
export function PersonaProvider({ children }: { children: ReactNode }) {
  const personaHook = useSafePersona();

  // Persona configurations based on research
  const personaConfigs: Record<PersonaType, PersonaConfig> = {
    'Solo-Sarah': {
      name: 'Solo Sarah',
      description: 'Time-pressed single restaurant owner',
      characteristics: [
        'Values efficiency and speed',
        'Prefers quick, actionable insights',
        'Limited time for complex analysis',
        'Needs mobile-friendly interface',
      ],
      uiPreferences: {
        contentLength: 'short',
        visualStyle: 'minimal',
        interactionStyle: 'guided',
      },
      onboardingStyle: {
        stepCount: 'minimal',
        guidance: 'high',
        pace: 'fast',
      },
    },
    'Bewahrer-Ben': {
      name: 'Bewahrer Ben',
      description: 'Security-focused traditional owner',
      characteristics: [
        'Values security and trust',
        'Prefers detailed explanations',
        'Cautious about new features',
        'Needs reassurance and guidance',
      ],
      uiPreferences: {
        contentLength: 'long',
        visualStyle: 'standard',
        interactionStyle: 'guided',
      },
      onboardingStyle: {
        stepCount: 'comprehensive',
        guidance: 'high',
        pace: 'slow',
      },
    },
    'Wachstums-Walter': {
      name: 'Wachstums Walter',
      description: 'Growth-oriented expansion-minded owner',
      characteristics: [
        'Focuses on growth metrics',
        'Wants strategic insights',
        'Interested in competitive analysis',
        'Values ROI and performance data',
      ],
      uiPreferences: {
        contentLength: 'medium',
        visualStyle: 'rich',
        interactionStyle: 'exploratory',
      },
      onboardingStyle: {
        stepCount: 'standard',
        guidance: 'medium',
        pace: 'medium',
      },
    },
    'Ketten-Katrin': {
      name: 'Ketten Katrin',
      description: 'Enterprise/chain management',
      characteristics: [
        'Manages multiple locations',
        'Needs aggregated data views',
        'Values advanced features',
        'Requires team collaboration tools',
      ],
      uiPreferences: {
        contentLength: 'long',
        visualStyle: 'rich',
        interactionStyle: 'expert',
      },
      onboardingStyle: {
        stepCount: 'comprehensive',
        guidance: 'low',
        pace: 'medium',
      },
    },
  };

  // Get current persona configuration
  const getPersonaConfig = (): PersonaConfig => {
    return personaConfigs[personaHook.currentPersona];
  };

  // Check if current persona matches given persona
  const isPersona = (persona: PersonaType): boolean => {
    return personaHook.currentPersona === persona;
  };

  // Get persona-specific preferences for UI adaptation
  const getPersonaPreferences = (): PersonaPreferences => {
    const config = getPersonaConfig();
    
    return {
      showDetailedAnalytics: config.uiPreferences.visualStyle === 'rich',
      preferQuickActions: config.uiPreferences.interactionStyle === 'guided',
      needsGuidance: config.onboardingStyle.guidance === 'high',
      wantsAdvancedFeatures: config.uiPreferences.interactionStyle === 'expert',
      timeConstraints: personaHook.currentPersona === 'Solo-Sarah' ? 'high' : 
                      personaHook.currentPersona === 'Bewahrer-Ben' ? 'low' : 'medium',
    };
  };

  // Behavior tracking helper
  const trackBehavior = (behavior: Partial<UserBehavior>) => {
    try {
      // Build complete behavior object with session context
      const sessionId = sessionStorage.getItem('matbakh_session_id') || `session-${Date.now()}`;
      const userId = localStorage.getItem('matbakh_user_id') || 'anonymous';

      const completeBehavior: UserBehavior = {
        sessionId,
        userId,
        timestamp: new Date().toISOString(),
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
        deviceType: behavior.deviceType || (window.innerWidth < 768 ? 'mobile' : 'desktop'),
        sessionDuration: behavior.sessionDuration || 0,
        pageViews: behavior.pageViews || 1,
      };

      // Trigger persona detection
      personaHook.detectPersona(completeBehavior);
    } catch (error) {
      console.warn('Behavior tracking failed:', error);
      // Continue without tracking - no crash
    }
  };

  // Auto-track basic behavior on mount
  useEffect(() => {
    // Set mock user ID for development if no auth user exists
    if (!localStorage.getItem('matbakh_user_id')) {
      localStorage.setItem('matbakh_user_id', 'dev-user-' + Date.now());
    }
    
    // Set session ID
    if (!sessionStorage.getItem('matbakh_session_id')) {
      sessionStorage.setItem('matbakh_session_id', 'session-' + Date.now());
    }

    const initialBehavior: Partial<UserBehavior> = {
      deviceType: window.innerWidth < 768 ? 'mobile' : 'desktop',
      pageViews: 1,
      sessionDuration: 0,
    };

    // Delay initial tracking to allow other providers to initialize
    const timer = setTimeout(() => {
      trackBehavior(initialBehavior);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Context value following the same pattern as AuthContext
  const contextValue: PersonaContextType = {
    // State from hook
    currentPersona: personaHook.currentPersona,
    confidence: personaHook.confidence,
    isLoading: personaHook.isLoading,
    error: personaHook.error,
    lastUpdated: personaHook.lastUpdated,
    isPersonaReady: personaHook.isPersonaReady,

    // Functions from hook
    detectPersona: personaHook.detectPersona,
    overridePersona: personaHook.overridePersona,
    resetPersona: personaHook.resetPersona,

    // Additional context functions
    trackBehavior,
    getPersonaConfig,
    isPersona,
    getPersonaPreferences,
  };

  return (
    <PersonaContext.Provider value={contextValue}>
      {children}
    </PersonaContext.Provider>
  );
}

/**
 * Hook to use Persona Context
 * 
 * Follows the same pattern as useAuth to ensure consistency.
 * Throws error if used outside PersonaProvider (same as AuthContext pattern).
 */
export function usePersona(): PersonaContextType {
  const context = useContext(PersonaContext);
  
  if (context === undefined) {
    throw new Error('usePersona must be used within a PersonaProvider');
  }
  
  return context;
}

/**
 * Safe hook that doesn't throw errors (alternative to usePersona)
 * 
 * Returns null if used outside PersonaProvider, allowing for graceful handling.
 * Useful for optional persona features.
 */
export function usePersonaSafe(): PersonaContextType | null {
  const context = useContext(PersonaContext);
  return context || null;
}