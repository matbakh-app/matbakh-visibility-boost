/**
 * AI Service Manager - Central orchestrator for AI service availability and capabilities
 * Implements adaptive UI system that adjusts based on available AI services
 */

import { supabase } from '@/integrations/supabase/client';

export interface AIService {
  id: string;
  name: string;
  provider: 'bedrock' | 'gemini' | 'openai' | 'custom';
  status: 'active' | 'inactive' | 'maintenance' | 'error';
  capabilities: AICapability[];
  healthScore: number; // 0-100
  lastHealthCheck: Date;
  costTier: 'free' | 'basic' | 'premium' | 'enterprise';
  requiredFeatures?: string[];
}

export interface AICapability {
  id: string;
  name: string;
  description: string;
  category: 'analysis' | 'content' | 'recommendations' | 'automation' | 'insights';
  enabled: boolean;
  beta?: boolean;
}

export interface AIServicePortfolio {
  services: AIService[];
  totalCapabilities: number;
  activeServices: number;
  healthScore: number;
  lastUpdated: Date;
}

export interface PersonaAIConfig {
  personaType: 'Solo-Sarah' | 'Bewahrer-Ben' | 'Wachstums-Walter' | 'Ketten-Katrin';
  preferredServices: string[];
  complexityLevel: 'simple' | 'moderate' | 'advanced';
  priorityCapabilities: string[];
}

class AIServiceManager {
  private static instance: AIServiceManager;
  private portfolio: AIServicePortfolio | null = null;
  private listeners: ((portfolio: AIServicePortfolio) => void)[] = [];
  private healthCheckInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.initializeHealthChecks();
  }

  static getInstance(): AIServiceManager {
    if (!AIServiceManager.instance) {
      AIServiceManager.instance = new AIServiceManager();
    }
    return AIServiceManager.instance;
  }

  /**
   * Get current AI service portfolio with real-time availability
   */
  async getServicePortfolio(): Promise<AIServicePortfolio> {
    if (!this.portfolio) {
      await this.refreshPortfolio();
    }
    return this.portfolio!;
  }

  /**
   * Refresh service portfolio from database and health checks
   */
  async refreshPortfolio(): Promise<void> {
    try {
      // Get feature flags for AI services
      const { data: flags } = await supabase
        .from('feature_flags')
        .select('flag_name, enabled, value')
        .like('flag_name', '%bedrock%')
        .or('flag_name.like.%ai%,flag_name.like.%gemini%');

      // Build service portfolio based on available services
      const services: AIService[] = [];

      // Bedrock AI Core Service
      const bedrockEnabled = this.getFlagValue(flags, 'vc_bedrock_live', false);
      const bedrockRollout = this.getFlagValue(flags, 'vc_bedrock_rollout_percent', 0);
      
      if (bedrockEnabled && bedrockRollout > 0) {
        services.push(await this.buildBedrockService(bedrockRollout));
      }

      // Future: Gemini Service
      const geminiEnabled = this.getFlagValue(flags, 'gemini_enabled', false);
      if (geminiEnabled) {
        services.push(await this.buildGeminiService());
      }

      // Calculate portfolio metrics
      const activeServices = services.filter(s => s.status === 'active').length;
      const totalCapabilities = services.reduce((sum, s) => sum + s.capabilities.length, 0);
      const healthScore = services.length > 0 
        ? Math.round(services.reduce((sum, s) => sum + s.healthScore, 0) / services.length)
        : 0;

      this.portfolio = {
        services,
        totalCapabilities,
        activeServices,
        healthScore,
        lastUpdated: new Date()
      };

      // Notify listeners
      this.notifyListeners();
    } catch (error) {
      console.error('Failed to refresh AI service portfolio:', error);
      // Fallback to empty portfolio
      this.portfolio = {
        services: [],
        totalCapabilities: 0,
        activeServices: 0,
        healthScore: 0,
        lastUpdated: new Date()
      };
    }
  }

  /**
   * Build Bedrock service configuration
   */
  private async buildBedrockService(rolloutPercent: number): Promise<AIService> {
    const capabilities: AICapability[] = [
      {
        id: 'vc_analysis',
        name: 'Visibility Check Analysis',
        description: 'AI-powered business visibility analysis with SWOT, Porter\'s Five Forces',
        category: 'analysis',
        enabled: true
      },
      {
        id: 'persona_detection',
        name: 'Persona Detection',
        description: 'Automatic user persona identification and adaptive responses',
        category: 'insights',
        enabled: true
      },
      {
        id: 'content_generation',
        name: 'Content Generation',
        description: 'AI-generated social media posts and marketing content',
        category: 'content',
        enabled: true,
        beta: true
      },
      {
        id: 'business_recommendations',
        name: 'Business Recommendations',
        description: 'Strategic business recommendations with ROI projections',
        category: 'recommendations',
        enabled: true
      },
      {
        id: 'competitive_analysis',
        name: 'Competitive Analysis',
        description: 'Local competitor analysis and benchmarking',
        category: 'analysis',
        enabled: true,
        beta: true
      }
    ];

    // Health check for Bedrock service
    const healthScore = await this.checkBedrockHealth();

    return {
      id: 'bedrock_ai_core',
      name: 'Bedrock AI Core',
      provider: 'bedrock',
      status: healthScore > 70 ? 'active' : healthScore > 30 ? 'maintenance' : 'error',
      capabilities,
      healthScore,
      lastHealthCheck: new Date(),
      costTier: 'premium',
      requiredFeatures: ['ai_analysis', 'premium_features']
    };
  }

  /**
   * Build Gemini service configuration (future)
   */
  private async buildGeminiService(): Promise<AIService> {
    const capabilities: AICapability[] = [
      {
        id: 'image_analysis',
        name: 'Image Analysis',
        description: 'AI-powered image content analysis and optimization suggestions',
        category: 'analysis',
        enabled: false,
        beta: true
      },
      {
        id: 'multilingual_content',
        name: 'Multilingual Content',
        description: 'Content generation in multiple languages',
        category: 'content',
        enabled: false,
        beta: true
      }
    ];

    return {
      id: 'gemini_ai',
      name: 'Gemini AI',
      provider: 'gemini',
      status: 'inactive',
      capabilities,
      healthScore: 0,
      lastHealthCheck: new Date(),
      costTier: 'basic',
      requiredFeatures: ['ai_content', 'multimodal_ai']
    };
  }

  /**
   * Check Bedrock service health
   */
  private async checkBedrockHealth(): Promise<number> {
    try {
      // Simple health check - try to call a lightweight Bedrock endpoint
      const response = await fetch('/api/bedrock/health', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const data = await response.json();
        return data.healthScore || 100;
      }
      
      return 50; // Partial health if endpoint exists but returns error
    } catch (error) {
      console.warn('Bedrock health check failed:', error);
      return 25; // Low health if service is unreachable
    }
  }

  /**
   * Get capabilities available for a specific persona
   */
  getPersonaCapabilities(personaType: PersonaAIConfig['personaType']): AICapability[] {
    if (!this.portfolio) return [];

    const personaConfig = this.getPersonaConfig(personaType);
    const allCapabilities = this.portfolio.services.flatMap(s => s.capabilities);

    return allCapabilities.filter(cap => {
      // Filter by persona preferences
      if (personaConfig.priorityCapabilities.includes(cap.id)) return true;
      
      // Filter by complexity level
      if (personaConfig.complexityLevel === 'simple' && cap.beta) return false;
      
      return cap.enabled;
    });
  }

  /**
   * Get persona-specific configuration
   */
  private getPersonaConfig(personaType: PersonaAIConfig['personaType']): PersonaAIConfig {
    const configs: Record<PersonaAIConfig['personaType'], PersonaAIConfig> = {
      'Solo-Sarah': {
        personaType: 'Solo-Sarah',
        preferredServices: ['bedrock_ai_core'],
        complexityLevel: 'simple',
        priorityCapabilities: ['vc_analysis', 'business_recommendations']
      },
      'Bewahrer-Ben': {
        personaType: 'Bewahrer-Ben',
        preferredServices: ['bedrock_ai_core'],
        complexityLevel: 'moderate',
        priorityCapabilities: ['vc_analysis', 'competitive_analysis']
      },
      'Wachstums-Walter': {
        personaType: 'Wachstums-Walter',
        preferredServices: ['bedrock_ai_core', 'gemini_ai'],
        complexityLevel: 'advanced',
        priorityCapabilities: ['business_recommendations', 'competitive_analysis', 'content_generation']
      },
      'Ketten-Katrin': {
        personaType: 'Ketten-Katrin',
        preferredServices: ['bedrock_ai_core', 'gemini_ai'],
        complexityLevel: 'advanced',
        priorityCapabilities: ['competitive_analysis', 'business_recommendations', 'multilingual_content']
      }
    };

    return configs[personaType];
  }

  /**
   * Subscribe to portfolio changes
   */
  subscribe(listener: (portfolio: AIServicePortfolio) => void): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Initialize periodic health checks
   */
  private initializeHealthChecks(): void {
    // Check health every 5 minutes
    this.healthCheckInterval = setInterval(() => {
      this.refreshPortfolio();
    }, 5 * 60 * 1000);
  }

  /**
   * Notify all listeners of portfolio changes
   */
  private notifyListeners(): void {
    if (this.portfolio) {
      this.listeners.forEach(listener => listener(this.portfolio!));
    }
  }

  /**
   * Helper to get flag value from feature flags array
   */
  private getFlagValue(flags: any[] | null, flagName: string, defaultValue: any): any {
    if (!flags) return defaultValue;
    
    const flag = flags.find(f => f.flag_name === flagName);
    if (!flag || !flag.enabled) return defaultValue;
    
    // Parse boolean values
    if (typeof defaultValue === 'boolean') {
      const value = flag.value?.toString().toLowerCase();
      return ['true', '1', 'yes', 'on'].includes(value);
    }
    
    // Parse numeric values
    if (typeof defaultValue === 'number') {
      const parsed = Number(flag.value);
      return isNaN(parsed) ? defaultValue : parsed;
    }
    
    return flag.value || defaultValue;
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
    this.listeners = [];
  }
}

export const aiServiceManager = AIServiceManager.getInstance();
export default aiServiceManager;