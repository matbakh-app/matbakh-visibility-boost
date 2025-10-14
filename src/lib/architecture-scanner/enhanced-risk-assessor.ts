/**
 * Enhanced Risk Assessor
 * Provides more nuanced risk assessment to reduce false positives
 * and improve archival decision making
 */

import { ComponentOrigin, RiskLevel } from './types';
import { BackendDependency, RouteUsage } from './legacy-component-detector';
import * as fs from 'fs/promises';

export interface RiskAssessment {
  safeToArchive: boolean;
  reason: string;
  riskLevel: RiskLevel;
  riskFactors: RiskFactor[];
  mitigationSuggestions: string[];
  confidence: number;
}

export interface RiskFactor {
  type: 'critical_path' | 'backend_dependency' | 'active_route' | 'high_usage' | 'recent_modification' | 'test_coverage';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  weight: number;
}

export class EnhancedRiskAssessor {
  private static readonly CRITICAL_PATHS = [
    // Core system paths that should never be archived
    '/middleware',
    '/contexts/AuthContext',
    '/contexts/ErrorBoundary',
    '/services/auth',
    '/lib/auth',
    '/utils/auth'
  ];

  private static readonly HIGH_RISK_PATHS = [
    // Important but potentially archivable with review
    '/auth/',
    '/api/',
    'layout',
    'provider',
    'context'
  ];

  private static readonly SAFE_PATTERNS = [
    // Patterns that are generally safe to archive
    '/pages/dev/',
    '/pages/test',
    '/components/debug',
    '/components/legacy',
    'Debug.tsx',
    'Test.tsx',
    '.test.',
    '.spec.'
  ];

  private static readonly KIRO_ALTERNATIVES = new Map<string, string>([
    ['/login', '/auth/login'],
    ['/register', '/auth/register'],
    ['/dashboard/old', '/dashboard'],
    ['/upload/legacy', '/upload'],
    ['/vc/old', '/vc/quick'],
    ['/reports/legacy', '/reports'],
    ['/admin/old', '/admin'],
    ['/onboarding/legacy', '/onboarding']
  ]);

  /**
   * Enhanced risk assessment with nuanced classification
   */
  static async assessRisk(
    filePath: string,
    origin: ComponentOrigin,
    backendDependencies: BackendDependency[],
    routeUsage: RouteUsage[],
    fileContent?: string
  ): Promise<RiskAssessment> {
    const riskFactors: RiskFactor[] = [];
    let totalRiskScore = 0;

    // Factor 1: Critical path analysis
    const criticalPathFactor = this.assessCriticalPath(filePath);
    if (criticalPathFactor) {
      riskFactors.push(criticalPathFactor);
      totalRiskScore += criticalPathFactor.weight;
    }

    // Factor 2: Backend dependency analysis
    const backendDepFactor = this.assessBackendDependencies(backendDependencies);
    if (backendDepFactor) {
      riskFactors.push(backendDepFactor);
      totalRiskScore += backendDepFactor.weight;
    }

    // Factor 3: Route usage analysis with Kiro alternatives
    const routeFactor = this.assessRouteUsage(routeUsage);
    if (routeFactor) {
      riskFactors.push(routeFactor);
      totalRiskScore += routeFactor.weight;
    }

    // Factor 4: File modification recency
    const modificationFactor = await this.assessRecentModification(filePath);
    if (modificationFactor) {
      riskFactors.push(modificationFactor);
      totalRiskScore += modificationFactor.weight;
    }

    // Factor 5: Usage frequency analysis
    const usageFactor = this.assessUsageFrequency(filePath, fileContent);
    if (usageFactor) {
      riskFactors.push(usageFactor);
      totalRiskScore += usageFactor.weight;
    }

    // Factor 6: Safe pattern detection
    const safePatternFactor = this.assessSafePatterns(filePath);
    if (safePatternFactor) {
      riskFactors.push(safePatternFactor);
      totalRiskScore += safePatternFactor.weight; // Negative weight to reduce risk
    }

    // Calculate final risk assessment
    return this.calculateFinalAssessment(filePath, origin, riskFactors, totalRiskScore);
  }

  /**
   * Assess critical path risk with more nuanced classification
   */
  private static assessCriticalPath(filePath: string): RiskFactor | null {
    const lowerPath = filePath.toLowerCase();

    // Absolutely critical paths
    for (const criticalPath of this.CRITICAL_PATHS) {
      if (lowerPath.includes(criticalPath.toLowerCase())) {
        return {
          type: 'critical_path',
          severity: 'critical',
          description: `Core system component: ${criticalPath}`,
          weight: 100
        };
      }
    }

    // High-risk but potentially archivable paths
    for (const highRiskPath of this.HIGH_RISK_PATHS) {
      if (lowerPath.includes(highRiskPath.toLowerCase())) {
        // Special handling for specific cases
        if (lowerPath.includes('/pages/auth') && !lowerPath.includes('context')) {
          return {
            type: 'critical_path',
            severity: 'medium',
            description: `Auth page component - may have Kiro alternative`,
            weight: 30
          };
        }

        if (lowerPath.includes('/api/') && lowerPath.includes('/pages/')) {
          return {
            type: 'critical_path',
            severity: 'medium',
            description: `API page component - check for Kiro alternative`,
            weight: 40
          };
        }

        return {
          type: 'critical_path',
          severity: 'high',
          description: `High-risk system component: ${highRiskPath}`,
          weight: 60
        };
      }
    }

    return null;
  }

  /**
   * Assess backend dependencies with migration path consideration
   */
  private static assessBackendDependencies(dependencies: BackendDependency[]): RiskFactor | null {
    const activeDeps = dependencies.filter(dep => dep.isActive);
    
    if (activeDeps.length === 0) {
      return null;
    }

    const depsWithMigration = activeDeps.filter(dep => dep.migrationPath);
    const depsWithoutMigration = activeDeps.filter(dep => !dep.migrationPath);

    if (depsWithoutMigration.length === 0) {
      return {
        type: 'backend_dependency',
        severity: 'low',
        description: `${activeDeps.length} backend dependencies with migration paths`,
        weight: 10
      };
    }

    if (depsWithoutMigration.length <= 2) {
      return {
        type: 'backend_dependency',
        severity: 'medium',
        description: `${depsWithoutMigration.length} backend dependencies without migration paths`,
        weight: 30
      };
    }

    return {
      type: 'backend_dependency',
      severity: 'high',
      description: `${depsWithoutMigration.length} backend dependencies without migration paths`,
      weight: 50
    };
  }

  /**
   * Assess route usage with Kiro alternative detection
   */
  private static assessRouteUsage(routeUsage: RouteUsage[]): RiskFactor | null {
    const activeRoutes = routeUsage.filter(route => route.isActive);
    
    if (activeRoutes.length === 0) {
      return null;
    }

    // Check for Kiro alternatives
    const routesWithAlternatives = activeRoutes.filter(route => 
      route.hasKiroAlternative || this.hasKiroAlternative(route.route)
    );

    const routesWithoutAlternatives = activeRoutes.filter(route => 
      !route.hasKiroAlternative && !this.hasKiroAlternative(route.route)
    );

    if (routesWithoutAlternatives.length === 0) {
      return {
        type: 'active_route',
        severity: 'low',
        description: `${activeRoutes.length} active routes with Kiro alternatives`,
        weight: 5
      };
    }

    // Check if routes are development/debug routes
    const devRoutes = routesWithoutAlternatives.filter(route => 
      route.route.includes('/dev/') || 
      route.route.includes('/debug') || 
      route.route.includes('/test')
    );

    if (devRoutes.length === routesWithoutAlternatives.length) {
      return {
        type: 'active_route',
        severity: 'low',
        description: `${routesWithoutAlternatives.length} development/debug routes`,
        weight: 10
      };
    }

    if (routesWithoutAlternatives.length <= 2) {
      return {
        type: 'active_route',
        severity: 'medium',
        description: `${routesWithoutAlternatives.length} active routes without alternatives`,
        weight: 25
      };
    }

    return {
      type: 'active_route',
      severity: 'high',
      description: `${routesWithoutAlternatives.length} active routes without alternatives`,
      weight: 45
    };
  }

  /**
   * Assess recent modification risk
   */
  private static async assessRecentModification(filePath: string): Promise<RiskFactor | null> {
    try {
      const stats = await fs.stat(filePath);
      const daysSinceModification = (Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60 * 24);

      if (daysSinceModification < 7) {
        return {
          type: 'recent_modification',
          severity: 'medium',
          description: `Modified within last 7 days`,
          weight: 20
        };
      }

      if (daysSinceModification < 30) {
        return {
          type: 'recent_modification',
          severity: 'low',
          description: `Modified within last 30 days`,
          weight: 10
        };
      }

      // Old files are safer to archive
      if (daysSinceModification > 90) {
        return {
          type: 'recent_modification',
          severity: 'low',
          description: `Not modified in 90+ days - safer to archive`,
          weight: -10
        };
      }
    } catch (error) {
      // File stat error, assume medium risk
      return {
        type: 'recent_modification',
        severity: 'medium',
        description: `Cannot determine modification date`,
        weight: 15
      };
    }

    return null;
  }

  /**
   * Assess usage frequency based on file content
   */
  private static assessUsageFrequency(filePath: string, content?: string): RiskFactor | null {
    if (!content) {
      return null;
    }

    // Simple heuristics for usage frequency
    const lines = content.split('\n').length;
    const functions = (content.match(/function|const.*=.*=>/g) || []).length;
    const imports = (content.match(/import.*from/g) || []).length;
    const exports = (content.match(/export/g) || []).length;

    const complexityScore = lines + functions * 2 + imports + exports;

    if (complexityScore > 500) {
      return {
        type: 'high_usage',
        severity: 'medium',
        description: `High complexity component (${complexityScore} complexity score)`,
        weight: 20
      };
    }

    if (complexityScore < 50) {
      return {
        type: 'high_usage',
        severity: 'low',
        description: `Low complexity component - safer to archive`,
        weight: -5
      };
    }

    return null;
  }

  /**
   * Assess safe patterns that reduce risk
   */
  private static assessSafePatterns(filePath: string): RiskFactor | null {
    const lowerPath = filePath.toLowerCase();

    for (const safePattern of this.SAFE_PATTERNS) {
      if (lowerPath.includes(safePattern.toLowerCase())) {
        return {
          type: 'critical_path',
          severity: 'low',
          description: `Safe pattern detected: ${safePattern}`,
          weight: -20
        };
      }
    }

    return null;
  }

  /**
   * Check if route has a Kiro alternative
   */
  private static hasKiroAlternative(route: string): boolean {
    for (const [pattern, alternative] of this.KIRO_ALTERNATIVES.entries()) {
      if (route.includes(pattern)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Calculate final risk assessment
   */
  private static calculateFinalAssessment(
    filePath: string,
    origin: ComponentOrigin,
    riskFactors: RiskFactor[],
    totalRiskScore: number
  ): RiskAssessment {
    const mitigationSuggestions: string[] = [];
    
    // Generate mitigation suggestions based on risk factors
    for (const factor of riskFactors) {
      switch (factor.type) {
        case 'backend_dependency':
          mitigationSuggestions.push('Create migration paths for backend dependencies');
          break;
        case 'active_route':
          mitigationSuggestions.push('Implement route redirects to Kiro alternatives');
          break;
        case 'critical_path':
          mitigationSuggestions.push('Manual review required for critical system component');
          break;
        case 'recent_modification':
          mitigationSuggestions.push('Wait for component to stabilize before archiving');
          break;
        case 'high_usage':
          mitigationSuggestions.push('Ensure comprehensive testing before archiving');
          break;
      }
    }

    // Determine final classification based on total risk score
    let riskLevel: RiskLevel;
    let safeToArchive: boolean;
    let reason: string;
    let confidence: number;

    if (totalRiskScore >= 80) {
      riskLevel = 'critical';
      safeToArchive = false;
      reason = 'Critical system component';
      confidence = 0.95;
    } else if (totalRiskScore >= 50) {
      riskLevel = 'high';
      safeToArchive = false;
      reason = 'High-risk component requiring manual review';
      confidence = 0.85;
    } else if (totalRiskScore >= 25) {
      riskLevel = 'medium';
      safeToArchive = false;
      reason = 'Medium-risk component - review recommended';
      confidence = 0.75;
    } else if (totalRiskScore >= 0) {
      riskLevel = 'low';
      safeToArchive = true;
      reason = 'Low-risk component safe for archival';
      confidence = 0.80;
    } else {
      // Negative score means safe patterns detected
      riskLevel = 'low';
      safeToArchive = true;
      reason = 'Safe component with positive archival indicators';
      confidence = 0.90;
    }

    // Special handling for Kiro components
    if (origin === 'kiro') {
      riskLevel = 'low';
      safeToArchive = false;
      reason = 'Kiro component - should not be archived';
      confidence = 1.0;
    }

    // Special handling for components with clear Kiro alternatives
    if (origin === 'supabase' || origin === 'lovable') {
      const hasAlternatives = riskFactors.some(f => 
        f.description.includes('with Kiro alternatives') || 
        f.description.includes('with migration paths')
      );
      
      if (hasAlternatives && totalRiskScore < 40) {
        safeToArchive = true;
        reason = 'Kiro alternative available';
        confidence = Math.min(confidence + 0.1, 0.95);
      }
    }

    return {
      safeToArchive,
      reason,
      riskLevel,
      riskFactors,
      mitigationSuggestions: [...new Set(mitigationSuggestions)], // Remove duplicates
      confidence
    };
  }

  /**
   * Batch assess multiple components
   */
  static async batchAssessRisk(
    components: Array<{
      filePath: string;
      origin: ComponentOrigin;
      backendDependencies: BackendDependency[];
      routeUsage: RouteUsage[];
      content?: string;
    }>
  ): Promise<Map<string, RiskAssessment>> {
    const assessments = new Map<string, RiskAssessment>();
    
    for (const component of components) {
      const assessment = await this.assessRisk(
        component.filePath,
        component.origin,
        component.backendDependencies,
        component.routeUsage,
        component.content
      );
      
      assessments.set(component.filePath, assessment);
    }
    
    return assessments;
  }

  /**
   * Generate risk assessment report
   */
  static generateRiskReport(assessments: Map<string, RiskAssessment>): {
    summary: {
      total: number;
      safeToArchive: number;
      requiresReview: number;
      critical: number;
      high: number;
      medium: number;
      low: number;
    };
    recommendations: string[];
    topRiskFactors: { factor: string; count: number }[];
  } {
    const summary = {
      total: assessments.size,
      safeToArchive: 0,
      requiresReview: 0,
      critical: 0,
      high: 0,
      medium: 0,
      low: 0
    };

    const riskFactorCounts = new Map<string, number>();
    const recommendations = new Set<string>();

    for (const [filePath, assessment] of assessments) {
      if (assessment.safeToArchive) {
        summary.safeToArchive++;
      } else {
        summary.requiresReview++;
      }

      switch (assessment.riskLevel) {
        case 'critical':
          summary.critical++;
          break;
        case 'high':
          summary.high++;
          break;
        case 'medium':
          summary.medium++;
          break;
        case 'low':
          summary.low++;
          break;
      }

      // Count risk factors
      for (const factor of assessment.riskFactors) {
        const key = `${factor.type}:${factor.severity}`;
        riskFactorCounts.set(key, (riskFactorCounts.get(key) || 0) + 1);
      }

      // Collect recommendations
      for (const suggestion of assessment.mitigationSuggestions) {
        recommendations.add(suggestion);
      }
    }

    // Sort risk factors by frequency
    const topRiskFactors = Array.from(riskFactorCounts.entries())
      .map(([factor, count]) => ({ factor, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      summary,
      recommendations: Array.from(recommendations),
      topRiskFactors
    };
  }
}