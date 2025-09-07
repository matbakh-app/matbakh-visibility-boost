/**
 * Provider Selector
 * Intelligent provider selection based on cost, performance, and capabilities
 */

import { BaseAIProvider } from './base-provider';
import { AIRequest, ProviderSelection, AIProvider, ProviderLoadBalancing } from './types';

export class ProviderSelector {
  private providers: Map<string, BaseAIProvider> = new Map();
  private loadBalancingStrategy: ProviderLoadBalancing;
  private selectionHistory: Array<{
    requestId: string;
    selectedProvider: string;
    timestamp: string;
    score: number;
  }> = [];

  constructor(loadBalancingStrategy: ProviderLoadBalancing = { strategy: 'intelligent' }) {
    this.loadBalancingStrategy = loadBalancingStrategy;
  }

  /**
   * Register a provider
   */
  registerProvider(provider: BaseAIProvider): void {
    this.providers.set(provider.getProvider().id, provider);
    console.log(`Registered provider: ${provider.getProvider().id}`);
  }

  /**
   * Unregister a provider
   */
  unregisterProvider(providerId: string): void {
    this.providers.delete(providerId);
    console.log(`Unregistered provider: ${providerId}`);
  }

  /**
   * Get all registered providers
   */
  getProviders(): BaseAIProvider[] {
    return Array.from(this.providers.values());
  }

  /**
   * Get provider by ID
   */
  getProvider(providerId: string): BaseAIProvider | undefined {
    return this.providers.get(providerId);
  }

  /**
   * Select optimal provider for a request
   */
  selectProvider(request: AIRequest): ProviderSelection {
    const availableProviders = this.getAvailableProviders(request);
    
    if (availableProviders.length === 0) {
      throw new Error('No available providers for this request type');
    }

    if (availableProviders.length === 1) {
      const provider = availableProviders[0];
      return {
        selectedProvider: provider.getProvider(),
        score: provider.getProviderScore(request),
        reasoning: ['Only available provider'],
        alternatives: [],
      };
    }

    // Apply selection strategy
    switch (this.loadBalancingStrategy.strategy) {
      case 'round_robin':
        return this.selectRoundRobin(availableProviders, request);
      
      case 'weighted':
        return this.selectWeighted(availableProviders, request);
      
      case 'least_latency':
        return this.selectLeastLatency(availableProviders, request);
      
      case 'least_cost':
        return this.selectLeastCost(availableProviders, request);
      
      case 'intelligent':
      default:
        return this.selectIntelligent(availableProviders, request);
    }
  }

  /**
   * Get providers that can handle the request
   */
  private getAvailableProviders(request: AIRequest): BaseAIProvider[] {
    return Array.from(this.providers.values()).filter(provider => {
      const providerInfo = provider.getProvider();
      
      // Check if provider is active
      if (providerInfo.status !== 'active' && providerInfo.status !== 'degraded') {
        return false;
      }
      
      // Check if provider supports the request type
      if (!provider.supportsRequest(request)) {
        return false;
      }
      
      // Check user preferences
      if (request.preferences?.excludedProviders?.includes(providerInfo.id)) {
        return false;
      }
      
      // Check health requirements
      if (this.loadBalancingStrategy.healthCheckRequired && 
          providerInfo.healthCheck.status !== 'healthy') {
        return false;
      }
      
      return true;
    });
  }

  /**
   * Round robin selection
   */
  private selectRoundRobin(providers: BaseAIProvider[], request: AIRequest): ProviderSelection {
    // Simple round robin based on request count
    const providerIndex = this.selectionHistory.length % providers.length;
    const selectedProvider = providers[providerIndex];
    const providerInfo = selectedProvider.getProvider();
    
    const alternatives = providers
      .filter(p => p !== selectedProvider)
      .map(p => ({
        provider: p.getProvider(),
        score: p.getProviderScore(request),
        reason: 'Round robin alternative',
      }));

    const selection: ProviderSelection = {
      selectedProvider: providerInfo,
      score: selectedProvider.getProviderScore(request),
      reasoning: ['Round robin selection'],
      alternatives,
    };

    this.recordSelection(request.id, providerInfo.id, selection.score);
    return selection;
  }

  /**
   * Weighted selection based on configured weights
   */
  private selectWeighted(providers: BaseAIProvider[], request: AIRequest): ProviderSelection {
    const weights = this.loadBalancingStrategy.weights || {};
    
    // Calculate weighted scores
    const weightedProviders = providers.map(provider => {
      const providerInfo = provider.getProvider();
      const baseScore = provider.getProviderScore(request);
      const weight = weights[providerInfo.id] || 1;
      const weightedScore = baseScore * weight;
      
      return { provider, weightedScore, baseScore };
    });

    // Sort by weighted score
    weightedProviders.sort((a, b) => b.weightedScore - a.weightedScore);
    
    const selected = weightedProviders[0];
    const selectedProvider = selected.provider.getProvider();
    
    const alternatives = weightedProviders
      .slice(1)
      .map(item => ({
        provider: item.provider.getProvider(),
        score: item.baseScore,
        reason: `Weighted score: ${item.weightedScore.toFixed(2)}`,
      }));

    const selection: ProviderSelection = {
      selectedProvider,
      score: selected.baseScore,
      reasoning: [
        'Weighted selection',
        `Weight: ${weights[selectedProvider.id] || 1}`,
        `Weighted score: ${selected.weightedScore.toFixed(2)}`,
      ],
      alternatives,
    };

    this.recordSelection(request.id, selectedProvider.id, selection.score);
    return selection;
  }

  /**
   * Select provider with lowest latency
   */
  private selectLeastLatency(providers: BaseAIProvider[], request: AIRequest): ProviderSelection {
    const sortedProviders = providers.sort((a, b) => {
      const latencyA = a.getProvider().performance.averageLatency;
      const latencyB = b.getProvider().performance.averageLatency;
      return latencyA - latencyB;
    });

    const selectedProvider = sortedProviders[0].getProvider();
    
    const alternatives = sortedProviders
      .slice(1)
      .map(provider => ({
        provider: provider.getProvider(),
        score: provider.getProviderScore(request),
        reason: `Latency: ${provider.getProvider().performance.averageLatency}ms`,
      }));

    const selection: ProviderSelection = {
      selectedProvider,
      score: sortedProviders[0].getProviderScore(request),
      reasoning: [
        'Least latency selection',
        `Selected latency: ${selectedProvider.performance.averageLatency}ms`,
      ],
      alternatives,
    };

    this.recordSelection(request.id, selectedProvider.id, selection.score);
    return selection;
  }

  /**
   * Select provider with lowest cost
   */
  private selectLeastCost(providers: BaseAIProvider[], request: AIRequest): ProviderSelection {
    const providersWithCost = providers.map(provider => ({
      provider,
      estimatedCost: provider.estimateCost(request),
    }));

    providersWithCost.sort((a, b) => a.estimatedCost - b.estimatedCost);
    
    const selected = providersWithCost[0];
    const selectedProvider = selected.provider.getProvider();
    
    const alternatives = providersWithCost
      .slice(1)
      .map(item => ({
        provider: item.provider.getProvider(),
        score: item.provider.getProviderScore(request),
        reason: `Estimated cost: $${item.estimatedCost.toFixed(4)}`,
      }));

    const selection: ProviderSelection = {
      selectedProvider,
      score: selected.provider.getProviderScore(request),
      reasoning: [
        'Least cost selection',
        `Selected cost: $${selected.estimatedCost.toFixed(4)}`,
      ],
      alternatives,
    };

    this.recordSelection(request.id, selectedProvider.id, selection.score);
    return selection;
  }

  /**
   * Intelligent selection based on multiple factors
   */
  private selectIntelligent(providers: BaseAIProvider[], request: AIRequest): ProviderSelection {
    const scoredProviders = providers.map(provider => {
      const baseScore = provider.getProviderScore(request);
      const providerInfo = provider.getProvider();
      
      // Apply intelligent scoring adjustments
      let intelligentScore = baseScore;
      const reasoning: string[] = [`Base score: ${baseScore}`];
      
      // User preferences boost
      if (request.preferences?.preferredProviders?.includes(providerInfo.id)) {
        intelligentScore += 25;
        reasoning.push('User preference bonus: +25');
      }
      
      // Cost consideration
      const estimatedCost = provider.estimateCost(request);
      if (request.preferences?.maxCostPerRequest && estimatedCost > request.preferences.maxCostPerRequest) {
        intelligentScore -= 50;
        reasoning.push(`Cost penalty: -50 (exceeds ${request.preferences.maxCostPerRequest})`);
      }
      
      // Latency consideration
      if (request.preferences?.maxLatency && 
          providerInfo.performance.averageLatency > request.preferences.maxLatency) {
        intelligentScore -= 30;
        reasoning.push(`Latency penalty: -30 (exceeds ${request.preferences.maxLatency}ms)`);
      }
      
      // Quality threshold
      if (request.preferences?.qualityThreshold && 
          providerInfo.performance.successRate < request.preferences.qualityThreshold) {
        intelligentScore -= 40;
        reasoning.push(`Quality penalty: -40 (below ${request.preferences.qualityThreshold})`);
      }
      
      // Recent performance adjustment
      const recentFailures = providerInfo.healthCheck.consecutiveFailures;
      if (recentFailures > 0) {
        const penalty = recentFailures * 10;
        intelligentScore -= penalty;
        reasoning.push(`Recent failures penalty: -${penalty}`);
      }
      
      // Load balancing consideration
      if (this.loadBalancingStrategy.stickySession) {
        const recentSelections = this.selectionHistory
          .filter(h => h.timestamp > new Date(Date.now() - 300000).toISOString()) // Last 5 minutes
          .filter(h => h.selectedProvider === providerInfo.id);
        
        if (recentSelections.length > 0) {
          intelligentScore += 10;
          reasoning.push('Sticky session bonus: +10');
        }
      }
      
      return {
        provider,
        score: Math.max(0, intelligentScore),
        reasoning,
        estimatedCost,
      };
    });

    // Sort by intelligent score
    scoredProviders.sort((a, b) => b.score - a.score);
    
    const selected = scoredProviders[0];
    const selectedProvider = selected.provider.getProvider();
    
    const alternatives = scoredProviders
      .slice(1)
      .map(item => ({
        provider: item.provider.getProvider(),
        score: item.score,
        reason: `Intelligent score: ${item.score}`,
      }));

    const selection: ProviderSelection = {
      selectedProvider,
      score: selected.score,
      reasoning: [
        'Intelligent selection',
        ...selected.reasoning,
        `Final score: ${selected.score}`,
      ],
      alternatives,
    };

    this.recordSelection(request.id, selectedProvider.id, selection.score);
    return selection;
  }

  /**
   * Record selection for analytics and load balancing
   */
  private recordSelection(requestId: string, providerId: string, score: number): void {
    this.selectionHistory.push({
      requestId,
      selectedProvider: providerId,
      timestamp: new Date().toISOString(),
      score,
    });

    // Keep only recent history (last 1000 selections)
    if (this.selectionHistory.length > 1000) {
      this.selectionHistory = this.selectionHistory.slice(-1000);
    }
  }

  /**
   * Get selection statistics
   */
  getSelectionStatistics(timeWindowMinutes: number = 60): {
    totalSelections: number;
    providerDistribution: Record<string, number>;
    averageScore: number;
    timeWindow: string;
  } {
    const cutoffTime = new Date(Date.now() - timeWindowMinutes * 60000).toISOString();
    const recentSelections = this.selectionHistory.filter(h => h.timestamp > cutoffTime);
    
    const providerDistribution: Record<string, number> = {};
    let totalScore = 0;
    
    for (const selection of recentSelections) {
      providerDistribution[selection.selectedProvider] = 
        (providerDistribution[selection.selectedProvider] || 0) + 1;
      totalScore += selection.score;
    }
    
    return {
      totalSelections: recentSelections.length,
      providerDistribution,
      averageScore: recentSelections.length > 0 ? totalScore / recentSelections.length : 0,
      timeWindow: `${timeWindowMinutes} minutes`,
    };
  }

  /**
   * Update load balancing strategy
   */
  updateLoadBalancingStrategy(strategy: ProviderLoadBalancing): void {
    this.loadBalancingStrategy = strategy;
    console.log('Updated load balancing strategy:', strategy);
  }

  /**
   * Get current load balancing strategy
   */
  getLoadBalancingStrategy(): ProviderLoadBalancing {
    return { ...this.loadBalancingStrategy };
  }

  /**
   * Clear selection history
   */
  clearSelectionHistory(): void {
    this.selectionHistory = [];
    console.log('Selection history cleared');
  }
}