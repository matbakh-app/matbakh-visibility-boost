/**
 * Component Classification System - Enhanced Version
 * 
 * This module provides comprehensive component mapping with:
 * - Extended metadata (origin, type, risk, dependencies)
 * - Kiro alternative detection
 * - Test coverage integration
 * - Usage analysis
 * - Archive candidate identification
 */

import { ComponentInfo, ComponentType, RiskLevel, ComponentOrigin } from './types';
import { OriginDetector } from './origin-detector';
import { UsageAnalyzer } from './usage-analyzer';
import { TestCoverageAnalyzer } from './test-coverage-analyzer';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

// Use existing __dirname in Node.js/Jest environment, or create for ES modules
const currentDir = typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));

// Debug logging helper
const debug = (...args: any[]) => {
  if (process.env.DEBUG) console.log('[ComponentMap]', ...args);
};

export interface ExtendedComponentInfo extends ComponentInfo {
  origin: ComponentOrigin;
  path: string;
  type: ComponentType;
  riskLevel: RiskLevel;
  kiroAlternative: boolean;
  testCoverage: boolean;
  depsIn: string[];
  depsOut: string[];
  usage: 'active' | 'unused' | 'indirect';
  archiveCandidate: boolean;
  riskScore: number;
}

export interface ComponentMap {
  [componentId: string]: ExtendedComponentInfo;
}

export class ComponentClassificationSystem {
  private usageAnalyzer: UsageAnalyzer;
  private testCoverageAnalyzer: TestCoverageAnalyzer;
  private kiroAlternatives: Map<string, string>;

  constructor() {
    this.usageAnalyzer = new UsageAnalyzer();
    this.testCoverageAnalyzer = new TestCoverageAnalyzer();
    this.kiroAlternatives = new Map();
    // Initialize with defaults immediately, then try to load from file
    this.initializeDefaultAlternatives();
    this.loadKiroAlternatives().catch(() => {
      // Already have defaults, so this is fine
    });
  }

  /**
   * Load Kiro alternatives mapping from configuration
   */
  private async loadKiroAlternatives(): Promise<void> {
    try {
      const configPath = path.resolve(currentDir, '../../../kiro-alternatives.json');
      const content = await fs.readFile(configPath, 'utf-8');
      const alternatives = JSON.parse(content);

      Object.entries(alternatives).forEach(([legacy, kiro]) => {
        this.kiroAlternatives.set(legacy, kiro as string);
      });
    } catch (error) {
      // If config doesn't exist, use built-in alternatives
      this.initializeDefaultAlternatives();
    }
  }

  /**
   * Initialize default Kiro alternatives
   */
  private initializeDefaultAlternatives(): void {
    const defaults = {
      'UploadPage': 'UploadKiroPage',
      'LoginForm': 'KiroLoginForm',
      'AuthContext': 'UnifiedAuthContext',
      'SupabaseClient': 'AwsClient',
      'VercelAnalytics': 'CloudWatchAnalytics'
    };

    Object.entries(defaults).forEach(([legacy, kiro]) => {
      this.kiroAlternatives.set(legacy, kiro);
    });
  }

  /**
   * Detect component type based on file path and content
   */
  private detectComponentType(filePath: string): ComponentType {
    const typeRules: Array<{ pattern: RegExp; type: ComponentType }> = [
      { pattern: /^src\/pages\//, type: 'Page' },
      { pattern: /^src\/components\//, type: 'UI' },
      { pattern: /^src\/contexts\//, type: 'Context' },
      { pattern: /^src\/hooks\//, type: 'Hook' },
      { pattern: /^src\/services\//, type: 'Service' },
      { pattern: /^src\/lib\//, type: 'Engine' },
      { pattern: /^src\/(utils|shared)\//, type: 'Utility' },
      { pattern: /^src\/__tests__\//, type: 'Test' },
      { pattern: /^scripts\//, type: 'Script' }
    ];

    for (const rule of typeRules) {
      if (rule.pattern.test(filePath)) {
        return rule.type;
      }
    }

    return 'Unknown';
  }

  /**
   * Calculate risk score based on multiple criteria
   */
  private calculateRiskScore(component: Partial<ExtendedComponentInfo>): number {
    let score = 0;

    // No tests penalty
    if (!component.testCoverage) score += 3;

    // Origin-based risk
    if (component.origin === 'Supabase') score += 5;
    if (component.origin === 'Unknown') score += 2;

    // Dependency complexity
    const outDeps = component.depsOut?.length || 0;
    if (outDeps > 10) score += 3;
    if (outDeps > 20) score += 5;

    // No Kiro alternative
    if (!component.kiroAlternative) score += 5;

    // Page components are riskier to change
    if (component.type === 'Page') score += 2;

    // Circular dependencies (would need graph analysis)
    // TODO: Implement circular dependency detection

    return score;
  }

  /**
   * Determine risk level from score
   */
  private getRiskLevel(score: number): RiskLevel {
    if (score >= 15) return 'critical';
    if (score >= 10) return 'high';
    if (score >= 5) return 'medium';
    return 'low';
  }

  /**
   * Check if component has Kiro alternative using fuzzy matching
   */
  private hasKiroAlternative(componentName: string): boolean {
    // Direct mapping check
    if (this.kiroAlternatives.has(componentName)) {
      return true;
    }

    // Fuzzy matching using Levenshtein distance
    const threshold = 0.7;
    for (const [legacy, kiro] of this.kiroAlternatives.entries()) {
      const similarity = this.calculateSimilarity(componentName, legacy);
      if (similarity >= threshold) {
        return true;
      }
    }

    // Pattern-based matching
    const kiroPatterns = [
      /Kiro/i,
      /Unified/i,
      /Safe/i,
      /Enhanced/i
    ];

    return kiroPatterns.some(pattern => pattern.test(componentName));
  }

  /**
   * Calculate string similarity using Levenshtein distance
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }

    const maxLength = Math.max(str1.length, str2.length);
    return maxLength === 0 ? 1 : (maxLength - matrix[str2.length][str1.length]) / maxLength;
  }

  /**
   * Determine if component is archive candidate
   */
  private isArchiveCandidate(component: ExtendedComponentInfo): boolean {
    return (
      component.usage === 'unused' ||
      (component.origin === 'Supabase' && component.kiroAlternative) ||
      (component.riskLevel === 'low' && component.testCoverage === false)
    );
  }

  /**
   * Generate comprehensive component map
   */
  async generateComponentMap(components: ComponentInfo[]): Promise<ComponentMap> {
    debug('Generating component map for', components.length, 'components');
    const componentMap: ComponentMap = {};

    // Get usage analysis - create a simple mock for now
    const usageData = new Map<string, any>();

    // Get test coverage data - create a simple mock for now
    const coverageData = new Set<string>();

    for (const component of components) {
      const componentName = path.basename(component.path, path.extname(component.path));

      // Build extended component info
      const extendedInfo: ExtendedComponentInfo = {
        ...component,
        origin: OriginDetector.detectOrigin(component.path, component.content || '').origin,
        type: this.detectComponentType(component.path),
        kiroAlternative: this.hasKiroAlternative(componentName),
        testCoverage: coverageData.has(component.path),
        depsIn: usageData.get(component.path)?.importedBy || [],
        depsOut: usageData.get(component.path)?.imports || [],
        usage: this.determineUsage(component.path, usageData),
        riskScore: 0, // Will be calculated below
        riskLevel: 'low', // Will be updated below
        archiveCandidate: false // Will be updated below
      };

      // Calculate risk
      extendedInfo.riskScore = this.calculateRiskScore(extendedInfo);
      extendedInfo.riskLevel = this.getRiskLevel(extendedInfo.riskScore);

      // Determine archive candidacy
      extendedInfo.archiveCandidate = this.isArchiveCandidate(extendedInfo);

      componentMap[componentName] = extendedInfo;
    }

    return componentMap;
  }

  /**
   * Determine component usage status
   */
  private determineUsage(filePath: string, usageData: Map<string, any>): 'active' | 'unused' | 'indirect' {
    const usage = usageData.get(filePath);

    if (!usage) return 'unused';

    const importedByCount = usage.importedBy?.length || 0;
    const importsCount = usage.imports?.length || 0;

    if (importedByCount === 0 && importsCount === 0) return 'unused';
    if (importedByCount > 0) return 'active';

    return 'indirect';
  }

  /**
   * Export component map to file
   */
  async exportComponentMap(componentMap: ComponentMap, outputPath: string): Promise<void> {
    const exportData = {
      metadata: {
        generatedAt: new Date().toISOString(),
        totalComponents: Object.keys(componentMap).length,
        riskDistribution: this.calculateRiskDistribution(componentMap),
        originDistribution: this.calculateOriginDistribution(componentMap)
      },
      components: componentMap
    };

    await fs.writeFile(outputPath, JSON.stringify(exportData, null, 2));
    console.log(`✅ Component map exported to ${outputPath}`);
  }

  /**
   * Calculate risk level distribution
   */
  private calculateRiskDistribution(componentMap: ComponentMap): Record<RiskLevel, number> {
    const distribution: Record<RiskLevel, number> = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0
    };

    Object.values(componentMap).forEach(component => {
      distribution[component.riskLevel]++;
    });

    return distribution;
  }

  /**
   * Calculate origin distribution
   */
  private calculateOriginDistribution(componentMap: ComponentMap): Record<ComponentOrigin, number> {
    const distribution: Record<ComponentOrigin, number> = {
      Kiro: 0,
      Supabase: 0,
      Lovable: 0,
      Unknown: 0
    };

    Object.values(componentMap).forEach(component => {
      distribution[component.origin]++;
    });

    return distribution;
  }
}

/**
 * Main function to get component map
 */
export async function getComponentMap(): Promise<ComponentMap> {
  const classifier = new ComponentClassificationSystem();

  // This would typically get components from the architecture scanner
  // For now, we'll integrate with the existing scanner
  const components: ComponentInfo[] = []; // TODO: Get from scanner

  return classifier.generateComponentMap(components);
}

/**
 * Export component map with metadata
 */
export async function exportComponentMapWithMetadata(outputPath: string): Promise<void> {
  const classifier = new ComponentClassificationSystem();
  const componentMap = await getComponentMap();
  await classifier.exportComponentMap(componentMap, outputPath);
}