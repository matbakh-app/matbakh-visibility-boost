/**
 * Risk Matrix Configuration
 * 
 * Configurable risk assessment logic for component classification
 */

import { ComponentOrigin, ComponentType, RiskLevel } from './types';
import { ExtendedComponentInfo } from './component-map';

export interface RiskCriteria {
  name: string;
  weight: number;
  calculate: (component: Partial<ExtendedComponentInfo>) => number;
}

export interface RiskThresholds {
  low: number;
  medium: number;
  high: number;
  critical: number;
}

export class RiskMatrix {
  private criteria: RiskCriteria[];
  private thresholds: RiskThresholds;

  constructor() {
    this.criteria = this.initializeDefaultCriteria();
    this.thresholds = {
      low: 4,
      medium: 9,
      high: 14,
      critical: Infinity
    };
  }

  /**
   * Initialize default risk criteria
   */
  private initializeDefaultCriteria(): RiskCriteria[] {
    return [
      {
        name: 'No Tests',
        weight: 3,
        calculate: (component) => component.testCoverage ? 0 : 1
      },
      {
        name: 'Supabase Origin',
        weight: 5,
        calculate: (component) => component.origin === 'Supabase' ? 1 : 0
      },
      {
        name: 'Unknown Origin',
        weight: 2,
        calculate: (component) => component.origin === 'Unknown' ? 1 : 0
      },
      {
        name: 'High Dependency Count',
        weight: 3,
        calculate: (component) => {
          const outDeps = component.depsOut?.length || 0;
          if (outDeps > 20) return 2;
          if (outDeps > 10) return 1;
          return 0;
        }
      },
      {
        name: 'No Kiro Alternative',
        weight: 5,
        calculate: (component) => component.kiroAlternative ? 0 : 1
      },
      {
        name: 'Page Component',
        weight: 2,
        calculate: (component) => component.type === 'Page' ? 1 : 0
      },
      {
        name: 'Critical Component Type',
        weight: 4,
        calculate: (component) => {
          const criticalTypes: ComponentType[] = ['Context', 'Service', 'Engine'];
          return criticalTypes.includes(component.type as ComponentType) ? 1 : 0;
        }
      },
      {
        name: 'Unused Component',
        weight: -2, // Negative weight - unused components are less risky to change
        calculate: (component) => component.usage === 'unused' ? 1 : 0
      },
      {
        name: 'High Incoming Dependencies',
        weight: 4,
        calculate: (component) => {
          const inDeps = component.depsIn?.length || 0;
          if (inDeps > 15) return 2;
          if (inDeps > 8) return 1;
          return 0;
        }
      },
      {
        name: 'Legacy Pattern Detection',
        weight: 3,
        calculate: (component) => {
          const legacyPatterns = [
            /supabase/i,
            /vercel/i,
            /legacy/i,
            /deprecated/i,
            /old/i
          ];
          const path = component.path || '';
          return legacyPatterns.some(pattern => pattern.test(path)) ? 1 : 0;
        }
      }
    ];
  }

  /**
   * Calculate risk score for a component
   */
  calculateRiskScore(component: Partial<ExtendedComponentInfo>): number {
    let totalScore = 0;

    for (const criterion of this.criteria) {
      const criterionScore = criterion.calculate(component);
      totalScore += criterionScore * criterion.weight;
    }

    return Math.max(0, totalScore); // Ensure non-negative score
  }

  /**
   * Determine risk level from score
   */
  getRiskLevel(score: number): RiskLevel {
    if (score > this.thresholds.high) return 'critical';
    if (score > this.thresholds.medium) return 'high';
    if (score > this.thresholds.low) return 'medium';
    return 'low';
  }

  /**
   * Get detailed risk breakdown
   */
  getRiskBreakdown(component: Partial<ExtendedComponentInfo>): Array<{
    criterion: string;
    score: number;
    weight: number;
    contribution: number;
  }> {
    return this.criteria.map(criterion => {
      const score = criterion.calculate(component);
      const contribution = score * criterion.weight;
      
      return {
        criterion: criterion.name,
        score,
        weight: criterion.weight,
        contribution
      };
    });
  }

  /**
   * Add custom risk criterion
   */
  addCriterion(criterion: RiskCriteria): void {
    this.criteria.push(criterion);
  }

  /**
   * Update risk thresholds
   */
  updateThresholds(thresholds: Partial<RiskThresholds>): void {
    this.thresholds = { ...this.thresholds, ...thresholds };
  }

  /**
   * Get risk distribution for a set of components
   */
  getRiskDistribution(components: Partial<ExtendedComponentInfo>[]): Record<RiskLevel, number> {
    const distribution: Record<RiskLevel, number> = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0
    };

    components.forEach(component => {
      const score = this.calculateRiskScore(component);
      const level = this.getRiskLevel(score);
      distribution[level]++;
    });

    return distribution;
  }

  /**
   * Get top risk contributors
   */
  getTopRiskContributors(component: Partial<ExtendedComponentInfo>, limit = 5): Array<{
    criterion: string;
    contribution: number;
    percentage: number;
  }> {
    const breakdown = this.getRiskBreakdown(component);
    const totalScore = this.calculateRiskScore(component);
    
    return breakdown
      .filter(item => item.contribution > 0)
      .sort((a, b) => b.contribution - a.contribution)
      .slice(0, limit)
      .map(item => ({
        criterion: item.criterion,
        contribution: item.contribution,
        percentage: totalScore > 0 ? (item.contribution / totalScore) * 100 : 0
      }));
  }

  /**
   * Export risk matrix configuration
   */
  exportConfiguration(): {
    criteria: Array<{ name: string; weight: number }>;
    thresholds: RiskThresholds;
  } {
    return {
      criteria: this.criteria.map(c => ({ name: c.name, weight: c.weight })),
      thresholds: this.thresholds
    };
  }
}

/**
 * Default risk matrix instance
 */
export const defaultRiskMatrix = new RiskMatrix();

/**
 * Calculate risk score using default matrix
 */
export function calculateRiskScore(component: Partial<ExtendedComponentInfo>): number {
  return defaultRiskMatrix.calculateRiskScore(component);
}

/**
 * Get risk level using default matrix
 */
export function getRiskLevel(score: number): RiskLevel {
  return defaultRiskMatrix.getRiskLevel(score);
}