/**
 * Architecture Scanner Engine
 * Main orchestrator for system architecture analysis and cleanup planning
 */

import { 
  ArchitectureMap, 
  ComponentInfo, 
  ComponentMap, 
  CleanupPriorityItem,
  RiskLevel,
  ScanOptions 
} from './types';
import { FileSystemCrawler } from './file-system-crawler';
import { OriginDetector } from './origin-detector';
import { UsageAnalyzer } from './usage-analyzer';
import { TestCoverageAnalyzer } from './test-coverage-analyzer';

export class ArchitectureScanner {
  /**
   * Perform complete architecture scan
   */
  static async scanArchitecture(options?: Partial<ScanOptions>): Promise<ArchitectureMap> {
    console.log('🔍 Starting architecture scan...');

    // 1. Crawl file system
    console.log('📁 Crawling file system...');
    const filePaths = await FileSystemCrawler.crawlFileSystem(options);
    console.log(`Found ${filePaths.length} files to analyze`);

    // 2. Load file contents
    console.log('📖 Loading file contents...');
    const fileContents = new Map<string, string>();
    const componentMap: ComponentMap = {};

    for (const filePath of filePaths) {
      try {
        const metadata = await FileSystemCrawler.getFileMetadata(filePath);
        fileContents.set(filePath, metadata.content);

        // 3. Analyze each component
        const componentInfo = await this.analyzeComponent(
          filePath,
          metadata.content,
          metadata.size,
          metadata.lastModified,
          fileContents
        );

        componentMap[filePath] = componentInfo;
      } catch (error) {
        console.warn(`Failed to analyze ${filePath}:`, error);
      }
    }

    // 4. Analyze test coverage
    console.log('🧪 Analyzing test coverage...');
    const testCoverage = await TestCoverageAnalyzer.analyzeTestCoverage(filePaths);

    // 5. Generate cleanup priorities
    console.log('📋 Generating cleanup priorities...');
    const cleanupPriority = this.generateCleanupPriority(componentMap);

    // 6. Calculate statistics
    const componentsByOrigin = this.calculateOriginStatistics(componentMap);

    const architectureMap: ArchitectureMap = {
      scanTimestamp: new Date().toISOString(),
      totalComponents: filePaths.length,
      componentsByOrigin,
      components: componentMap,
      cleanupPriority,
      testCoverage
    };

    console.log('✅ Architecture scan complete');
    return architectureMap;
  }

  /**
   * Analyze a single component
   */
  private static async analyzeComponent(
    filePath: string,
    content: string,
    fileSize: number,
    lastModified: Date,
    allFiles: Map<string, string>
  ): Promise<ComponentInfo> {
    // Detect origin
    const originResult = OriginDetector.detectOrigin(filePath, content);
    
    // Find Kiro alternative
    const kiroAlternative = OriginDetector.findKiroAlternative(filePath, originResult.origin);
    
    // Analyze usage
    const usageAnalysis = await UsageAnalyzer.analyzeComponentUsage(filePath, allFiles);
    
    // Analyze imports and exports
    const imports = UsageAnalyzer.analyzeImports(content);
    const exports = UsageAnalyzer.analyzeExports(content);
    
    // Calculate risk level
    const riskLevel = this.calculateRiskLevel(
      originResult.origin,
      usageAnalysis,
      filePath,
      originResult.confidence
    );
    
    // Determine recommended action
    const recommendedAction = this.determineRecommendedAction(
      originResult.origin,
      kiroAlternative,
      usageAnalysis,
      riskLevel
    );

    return {
      path: filePath,
      origin: originResult.origin,
      isActive: usageAnalysis.isImported || exports.length > 0,
      isTested: false, // Will be updated by test coverage analyzer
      hasKiroAlternative: !!kiroAlternative,
      kiroAlternative,
      dependencies: imports,
      riskLevel,
      recommendedAction,
      lastModified,
      fileSize,
      imports,
      exports
    };
  }

  /**
   * Calculate risk level for a component
   */
  private static calculateRiskLevel(
    origin: ComponentInfo['origin'],
    usage: any,
    filePath: string,
    confidence: number
  ): RiskLevel {
    // Kiro components are low risk
    if (origin === 'kiro') return 'low';

    // High risk factors
    const highRiskFactors = [
      usage.importedBy.length > 5, // Heavily used
      filePath.includes('/auth/'), // Authentication related
      filePath.includes('/api/'), // API related
      usage.circularDependencies.length > 0, // Has circular dependencies
      confidence > 0.8 // High confidence in legacy origin
    ];

    // Critical risk factors
    const criticalRiskFactors = [
      usage.importedBy.length > 10, // Very heavily used
      filePath.includes('Context.tsx'), // Context providers
      filePath.includes('/services/auth'), // Core auth services
      usage.circularDependencies.length > 2 // Multiple circular dependencies
    ];

    if (criticalRiskFactors.some(factor => factor)) {
      return 'critical';
    }

    if (highRiskFactors.filter(factor => factor).length >= 2) {
      return 'high';
    }

    if (usage.importedBy.length > 0 || origin !== 'unknown') {
      return 'medium';
    }

    return 'low';
  }

  /**
   * Determine recommended action for a component
   */
  private static determineRecommendedAction(
    origin: ComponentInfo['origin'],
    kiroAlternative: string | undefined,
    usage: any,
    riskLevel: RiskLevel
  ): ComponentInfo['recommendedAction'] {
    // Keep Kiro components
    if (origin === 'kiro') return 'keep';

    // Replace if Kiro alternative exists
    if (kiroAlternative) return 'replace_with_kiro';

    // Archive unused components
    if (!usage.isImported && usage.exportsUsed.length === 0) {
      return 'archive';
    }

    // Delete if very low risk and unused
    if (riskLevel === 'low' && !usage.isImported) {
      return 'delete';
    }

    // Default to archive for legacy components
    return 'archive';
  }

  /**
   * Generate cleanup priority list
   */
  private static generateCleanupPriority(componentMap: ComponentMap): CleanupPriorityItem[] {
    const items: CleanupPriorityItem[] = [];

    for (const [path, component] of Object.entries(componentMap)) {
      if (component.origin === 'kiro') continue; // Skip Kiro components

      let priority = 0;
      let reason = '';
      let effort: 'low' | 'medium' | 'high' = 'low';

      // Calculate priority based on various factors
      if (component.hasKiroAlternative) {
        priority += 10;
        reason = 'Has Kiro alternative available';
        effort = 'medium';
      }

      if (!component.isActive) {
        priority += 8;
        reason = reason ? `${reason}, unused component` : 'Unused component';
        effort = 'low';
      }

      if (component.riskLevel === 'low') {
        priority += 5;
      } else if (component.riskLevel === 'critical') {
        priority -= 5; // Lower priority for critical components (handle carefully)
        effort = 'high';
      }

      if (component.origin === 'supabase' || component.origin === 'lovable') {
        priority += 3;
        reason = reason ? `${reason}, legacy ${component.origin} component` : `Legacy ${component.origin} component`;
      }

      if (priority > 0) {
        items.push({
          component: path,
          priority,
          reason: reason || 'Legacy component cleanup',
          estimatedEffort: effort
        });
      }
    }

    // Sort by priority (highest first)
    return items.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Calculate origin statistics
   */
  private static calculateOriginStatistics(componentMap: ComponentMap) {
    const stats = {
      kiro: 0,
      supabase: 0,
      lovable: 0,
      unknown: 0
    };

    for (const component of Object.values(componentMap)) {
      stats[component.origin]++;
    }

    return stats;
  }

  /**
   * Generate enhanced architecture report with component classification
   */
  static async generateEnhancedReport(options?: Partial<ScanOptions>): Promise<ArchitectureMap & {
    componentClassification: any;
    dependencyGraph: any;
    riskAnalysis: any;
  }> {
    // Get base architecture map
    const baseMap = await this.scanArchitecture(options);
    
    console.log('🔍 Generating enhanced component classification...');
    
    try {
      // Import enhanced analysis modules
      const { ComponentClassificationSystem } = await import('./component-map');
      const { DependencyGraphBuilder } = await import('./dependency-graph');
      const { defaultRiskMatrix } = await import('./risk-matrix');
      
      // Convert base components to format expected by classifier
      const components = Object.entries(baseMap.components).map(([path, component]) => ({
        path,
        content: '', // Would need to be loaded if needed
        ...component
      }));
      
      // Generate component classification
      const classifier = new ComponentClassificationSystem();
      const componentClassification = await classifier.generateComponentMap(components);
      
      // Generate dependency graph
      const graphBuilder = new DependencyGraphBuilder();
      const dependencyGraph = await graphBuilder.generateDependencyGraph();
      
      // Generate risk analysis
      const riskAnalysis = {
        distribution: defaultRiskMatrix.getRiskDistribution(Object.values(componentClassification)),
        highRiskComponents: Object.entries(componentClassification)
          .filter(([_, component]) => component.riskLevel === 'high' || component.riskLevel === 'critical')
          .map(([name, component]) => ({
            name,
            riskScore: component.riskScore,
            riskLevel: component.riskLevel,
            topContributors: defaultRiskMatrix.getTopRiskContributors(component, 3)
          })),
        archiveCandidates: Object.entries(componentClassification)
          .filter(([_, component]) => component.archiveCandidate)
          .map(([name, component]) => ({ 
            name, 
            reason: this.getArchiveReason(component),
            riskLevel: component.riskLevel,
            hasKiroAlternative: component.kiroAlternative
          }))
      };
      
      console.log('✅ Enhanced analysis complete');
      console.log(`📊 Risk Distribution: ${JSON.stringify(riskAnalysis.distribution)}`);
      console.log(`🎯 Archive Candidates: ${riskAnalysis.archiveCandidates.length}`);
      
      return {
        ...baseMap,
        componentClassification,
        dependencyGraph,
        riskAnalysis
      };
      
    } catch (error) {
      console.warn('⚠️ Enhanced analysis failed, returning base report:', error);
      return {
        ...baseMap,
        componentClassification: {},
        dependencyGraph: { nodes: [], edges: [], metadata: {} },
        riskAnalysis: { distribution: {}, highRiskComponents: [], archiveCandidates: [] }
      };
    }
  }

  /**
   * Get archive reason for component
   */
  private static getArchiveReason(component: any): string {
    const reasons = [];
    
    if (component.usage === 'unused') reasons.push('unused');
    if (component.origin === 'Supabase' && component.kiroAlternative) reasons.push('has Kiro alternative');
    if (component.riskLevel === 'low' && !component.testCoverage) reasons.push('low risk, no tests');
    if (component.origin === 'Lovable') reasons.push('legacy Lovable component');
    
    return reasons.join(', ') || 'multiple factors';
  }

  /**
   * Export architecture map to JSON
   */
  static async exportArchitectureMap(
    architectureMap: ArchitectureMap,
    outputPath: string = 'architecture-map.json'
  ): Promise<void> {
    try {
      const { writeFile } = await import('fs/promises');
      const jsonData = JSON.stringify(architectureMap, null, 2);
      await writeFile(outputPath, jsonData, 'utf-8');
      console.log(`✅ Architecture map exported to ${outputPath}`);
    } catch (error) {
      console.error('Failed to export architecture map:', error);
      throw error;
    }
  }

  /**
   * Generate cleanup roadmap
   */
  static generateCleanupRoadmap(architectureMap: ArchitectureMap): {
    phase1: CleanupPriorityItem[];
    phase2: CleanupPriorityItem[];
    phase3: CleanupPriorityItem[];
    summary: {
      totalComponents: number;
      toCleanup: number;
      estimatedHours: number;
    };
  } {
    const { cleanupPriority } = architectureMap;
    
    // Divide into phases based on priority and effort
    const phase1 = cleanupPriority.filter(item => 
      item.priority >= 15 && item.estimatedEffort === 'low'
    );
    
    const phase2 = cleanupPriority.filter(item => 
      item.priority >= 10 && item.estimatedEffort === 'medium'
    );
    
    const phase3 = cleanupPriority.filter(item => 
      !phase1.includes(item) && !phase2.includes(item)
    );

    // Estimate hours
    const effortHours = { low: 0.5, medium: 2, high: 8 };
    const estimatedHours = cleanupPriority.reduce((total, item) => 
      total + effortHours[item.estimatedEffort], 0
    );

    return {
      phase1,
      phase2,
      phase3,
      summary: {
        totalComponents: architectureMap.totalComponents,
        toCleanup: cleanupPriority.length,
        estimatedHours: Math.round(estimatedHours * 10) / 10
      }
    };
  }
}