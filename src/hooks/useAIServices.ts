/**
 * React hook for AI service management and adaptive UI
 * Provides real-time AI service availability and capabilities
 */

import { useState, useEffect, useCallback } from 'react';
import { useFeatureAccess } from './useFeatureAccess';
import aiServiceManager, { 
  AIServicePortfolio, 
  AIService, 
  AICapability,
  PersonaAIConfig 
} from '@/services/ai-service-manager';

export interface AIOperationStatus {
  id: string;
  type: 'analysis' | 'content' | 'recommendations';
  status: 'pending' | 'running' | 'completed' | 'error';
  progress: number; // 0-100
  message: string;
  startTime: Date;
  estimatedCompletion?: Date;
}

export interface UseAIServicesReturn {
  // Service Portfolio
  portfolio: AIServicePortfolio | null;
  isLoading: boolean;
  error: string | null;
  
  // Service Queries
  getAvailableServices: () => AIService[];
  getServiceByProvider: (provider: string) => AIService | null;
  hasCapability: (capabilityId: string) => boolean;
  getCapabilitiesByCategory: (category: AICapability['category']) => AICapability[];
  
  // Persona Integration
  currentPersona: PersonaAIConfig['personaType'] | null;
  setPersona: (persona: PersonaAIConfig['personaType']) => void;
  getPersonaCapabilities: () => AICapability[];
  
  // Operation Status
  activeOperations: AIOperationStatus[];
  startOperation: (type: AIOperationStatus['type'], message: string) => string;
  updateOperation: (id: string, updates: Partial<AIOperationStatus>) => void;
  completeOperation: (id: string, message?: string) => void;
  
  // UI Helpers
  shouldShowWidget: (widgetId: string) => boolean;
  getWidgetPriority: (widgetId: string) => number;
  isServiceHealthy: (serviceId: string) => boolean;
  
  // Actions
  refreshServices: () => Promise<void>;
  checkServiceHealth: (serviceId: string) => Promise<number>;
}

export function useAIServices(): UseAIServicesReturn {
  const [portfolio, setPortfolio] = useState<AIServicePortfolio | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPersona, setCurrentPersona] = useState<PersonaAIConfig['personaType'] | null>(null);
  const [activeOperations, setActiveOperations] = useState<AIOperationStatus[]>([]);
  
  const { hasFeature, hasRole, access } = useFeatureAccess();

  // Initialize and subscribe to portfolio changes
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    const initializeServices = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Subscribe to portfolio changes
        unsubscribe = aiServiceManager.subscribe((newPortfolio) => {
          setPortfolio(newPortfolio);
          setIsLoading(false);
        });

        // Initial load
        const initialPortfolio = await aiServiceManager.getServicePortfolio();
        setPortfolio(initialPortfolio);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load AI services');
      } finally {
        setIsLoading(false);
      }
    };

    initializeServices();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  // Load persona from localStorage or user preferences
  useEffect(() => {
    const savedPersona = localStorage.getItem('ai_persona') as PersonaAIConfig['personaType'] | null;
    if (savedPersona) {
      setCurrentPersona(savedPersona);
    }
  }, []);

  // Service query functions
  const getAvailableServices = useCallback((): AIService[] => {
    if (!portfolio) return [];
    
    return portfolio.services.filter(service => {
      // Check if user has required features
      if (service.requiredFeatures) {
        return service.requiredFeatures.some(feature => hasFeature(feature));
      }
      
      // Check service status
      return service.status === 'active';
    });
  }, [portfolio, hasFeature]);

  const getServiceByProvider = useCallback((provider: string): AIService | null => {
    if (!portfolio) return null;
    return portfolio.services.find(s => s.provider === provider) || null;
  }, [portfolio]);

  const hasCapability = useCallback((capabilityId: string): boolean => {
    const availableServices = getAvailableServices();
    return availableServices.some(service => 
      service.capabilities.some(cap => cap.id === capabilityId && cap.enabled)
    );
  }, [getAvailableServices]);

  const getCapabilitiesByCategory = useCallback((category: AICapability['category']): AICapability[] => {
    const availableServices = getAvailableServices();
    const capabilities: AICapability[] = [];
    
    availableServices.forEach(service => {
      service.capabilities
        .filter(cap => cap.category === category && cap.enabled)
        .forEach(cap => capabilities.push(cap));
    });
    
    return capabilities;
  }, [getAvailableServices]);

  // Persona functions
  const setPersona = useCallback((persona: PersonaAIConfig['personaType']) => {
    setCurrentPersona(persona);
    localStorage.setItem('ai_persona', persona);
  }, []);

  const getPersonaCapabilities = useCallback((): AICapability[] => {
    if (!currentPersona) return [];
    return aiServiceManager.getPersonaCapabilities(currentPersona);
  }, [currentPersona]);

  // Operation management
  const startOperation = useCallback((
    type: AIOperationStatus['type'], 
    message: string
  ): string => {
    const id = `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const operation: AIOperationStatus = {
      id,
      type,
      status: 'pending',
      progress: 0,
      message,
      startTime: new Date()
    };
    
    setActiveOperations(prev => [...prev, operation]);
    return id;
  }, []);

  const updateOperation = useCallback((
    id: string, 
    updates: Partial<AIOperationStatus>
  ) => {
    setActiveOperations(prev => 
      prev.map(op => op.id === id ? { ...op, ...updates } : op)
    );
  }, []);

  const completeOperation = useCallback((id: string, message?: string) => {
    updateOperation(id, {
      status: 'completed',
      progress: 100,
      message: message || 'Operation completed successfully'
    });
    
    // Remove completed operations after 5 seconds
    setTimeout(() => {
      setActiveOperations(prev => prev.filter(op => op.id !== id));
    }, 5000);
  }, [updateOperation]);

  // UI helper functions
  const shouldShowWidget = useCallback((widgetId: string): boolean => {
    // Widget visibility rules based on AI capabilities and user access
    const widgetCapabilityMap: Record<string, string[]> = {
      'ai_recommendations': ['business_recommendations'],
      'ai_analysis': ['vc_analysis', 'competitive_analysis'],
      'ai_content': ['content_generation'],
      'ai_insights': ['persona_detection'],
      'ai_status': [] // Always show if any AI service is available
    };

    const requiredCapabilities = widgetCapabilityMap[widgetId] || [];
    
    // If no specific capabilities required, show if any AI service is available
    if (requiredCapabilities.length === 0) {
      return getAvailableServices().length > 0;
    }
    
    // Check if user has required capabilities
    return requiredCapabilities.some(cap => hasCapability(cap));
  }, [getAvailableServices, hasCapability]);

  const getWidgetPriority = useCallback((widgetId: string): number => {
    // Priority based on persona and available capabilities
    const basePriorities: Record<string, number> = {
      'ai_analysis': 100,
      'ai_recommendations': 90,
      'ai_insights': 80,
      'ai_content': 70,
      'ai_status': 60
    };

    let priority = basePriorities[widgetId] || 50;

    // Adjust based on persona
    if (currentPersona) {
      const personaAdjustments: Record<PersonaAIConfig['personaType'], Record<string, number>> = {
        'Solo-Sarah': {
          'ai_recommendations': 20,
          'ai_analysis': 10
        },
        'Bewahrer-Ben': {
          'ai_analysis': 15,
          'ai_insights': 10
        },
        'Wachstums-Walter': {
          'ai_content': 15,
          'ai_recommendations': 10
        },
        'Ketten-Katrin': {
          'ai_analysis': 20,
          'ai_content': 15
        }
      };

      const adjustment = personaAdjustments[currentPersona][widgetId] || 0;
      priority += adjustment;
    }

    return priority;
  }, [currentPersona]);

  const isServiceHealthy = useCallback((serviceId: string): boolean => {
    if (!portfolio) return false;
    const service = portfolio.services.find(s => s.id === serviceId);
    return service ? service.healthScore > 70 : false;
  }, [portfolio]);

  // Actions
  const refreshServices = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      await aiServiceManager.refreshPortfolio();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh services');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const checkServiceHealth = useCallback(async (serviceId: string): Promise<number> => {
    // This would trigger a health check for a specific service
    // For now, return the current health score
    if (!portfolio) return 0;
    const service = portfolio.services.find(s => s.id === serviceId);
    return service?.healthScore || 0;
  }, [portfolio]);

  return {
    // Service Portfolio
    portfolio,
    isLoading,
    error,
    
    // Service Queries
    getAvailableServices,
    getServiceByProvider,
    hasCapability,
    getCapabilitiesByCategory,
    
    // Persona Integration
    currentPersona,
    setPersona,
    getPersonaCapabilities,
    
    // Operation Status
    activeOperations,
    startOperation,
    updateOperation,
    completeOperation,
    
    // UI Helpers
    shouldShowWidget,
    getWidgetPriority,
    isServiceHealthy,
    
    // Actions
    refreshServices,
    checkServiceHealth
  };
}