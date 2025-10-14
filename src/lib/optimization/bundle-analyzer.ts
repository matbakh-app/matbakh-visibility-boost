/**
 * Bundle Analyzer
 * 
 * Provides intelligent bundle analysis and optimization recommendations
 * for webpack/Vite builds with focus on performance optimization.
 */

import type { OptimizationOpportunity } from './automatic-optimization-engine';

// Bundle analysis interfaces
export interface ModuleInfo {
  id: string;
  name: string;
  size: number;
  gzipSize?: number;
  chunks: string[];
  dependencies: string[];
  isDynamic: boolean;
  isEntry: boolean;
  reasons: ModuleReason[];
}

export interface ModuleReason {
  type: 'import' | 'require' | 'dynamic-import';
  module: string;
  location: string;
}

export interface ChunkInfo {
  id: string;
  name: string;
  size: number;
  modules: ModuleInfo[];
  isAsync: boolean;
  isEntry: boolean;
  parents: string[];
  children: string[];
  loadTime?: number;
}

export interface BundleStats {
  chunks: ChunkInfo[];
  modules: ModuleInfo[];
  assets: AssetInfo[];
  entrypoints: EntrypointInfo[];
  totalSize: number;
  gzipSize: number;
  duplicatedModules: DuplicatedModule[];
  unusedModules: string[];
  circularDependencies: CircularDependency[];
}

export interface AssetInfo {
  name: string;
  size: number;
  chunks: string[];
  type: 'js' | 'css' | 'image' | 'font' | 'other';
}

export interface EntrypointInfo {
  name: string;
  chunks: string[];
  assets: string[];
  size: number;
}

export interface DuplicatedModule {
  module: string;
  chunks: string[];
  totalSize: number;
  instances: number;
}

export interface CircularDependency {
  modules: string[];
  severity: 'low' | 'medium' | 'high';
}

export interface BundleAnalysisResult {
  stats: BundleStats;
  recommendations: OptimizationOpportunity[];
  score: number; // 0-100 bundle health score
  issues: BundleIssue[];
}

export interface BundleIssue {
  type: 'large_chunk' | 'duplicated_module' | 'unused_module' | 'circular_dependency' | 'inefficient_splitting';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  affectedFiles: string[];
  recommendation: string;
  estimatedImpact: number; // KB saved or ms improved
}

class BundleAnalyzer {
  private thresholds = {
    largeChunk: 250, // KB
    largeTotalBundle: 1000, // KB
    duplicatedModuleThreshold: 2, // instances
    unusedModuleAge: 30, // days
    circularDependencyDepth: 5
  };

  /**
   * Analyze bundle from webpack stats or Vite build info
   */
  public async analyzeBundleFromStats(statsData: any): Promise<BundleAnalysisResult> {
    console.log('Analyzing bundle from build stats...');

    try {
      const stats = this.parseStatsData(statsData);
      const issues = this.identifyIssues(stats);
      const recommendations = this.generateRecommendations(stats, issues);
      const score = this.calculateBundleScore(stats, issues);

      return {
        stats,
        recommendations,
        score,
        issues
      };
    } catch (error) {
      console.error('Bundle analysis failed:', error);
      throw new Error(`Bundle analysis failed: ${error}`);
    }
  }

  /**
   * Analyze bundle from runtime performance data
   */
  public async analyzeBundleFromRuntime(): Promise<BundleAnalysisResult> {
    console.log('Analyzing bundle from runtime data...');

    try {
      // Get performance entries for script resources
      const resourceEntries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      const scriptEntries = resourceEntries.filter(entry => 
        entry.name.includes('.js') && !entry.name.includes('node_modules')
      );

      // Build stats from runtime data
      const stats = await this.buildStatsFromRuntime(scriptEntries);
      const issues = this.identifyIssues(stats);
      const recommendations = this.generateRecommendations(stats, issues);
      const score = this.calculateBundleScore(stats, issues);

      return {
        stats,
        recommendations,
        score,
        issues
      };
    } catch (error) {
      console.error('Runtime bundle analysis failed:', error);
      throw new Error(`Runtime bundle analysis failed: ${error}`);
    }
  }

  /**
   * Parse webpack/Vite stats data
   */
  private parseStatsData(statsData: any): BundleStats {
    const chunks: ChunkInfo[] = [];
    const modules: ModuleInfo[] = [];
    const assets: AssetInfo[] = [];
    const entrypoints: EntrypointInfo[] = [];

    // Parse chunks
    if (statsData.chunks) {
      statsData.chunks.forEach((chunk: any) => {
        chunks.push({
          id: chunk.id?.toString() || chunk.name,
          name: chunk.name || `chunk-${chunk.id}`,
          size: chunk.size || 0,
          modules: [], // Will be populated later
          isAsync: !chunk.initial,
          isEntry: chunk.entry || false,
          parents: chunk.parents || [],
          children: chunk.children || []
        });
      });
    }

    // Parse modules
    if (statsData.modules) {
      statsData.modules.forEach((module: any) => {
        modules.push({
          id: module.id?.toString() || module.identifier,
          name: module.name || module.identifier,
          size: module.size || 0,
          chunks: module.chunks || [],
          dependencies: module.dependencies?.map((dep: any) => dep.module) || [],
          isDynamic: module.type === 'dynamic',
          isEntry: module.entry || false,
          reasons: module.reasons?.map((reason: any) => ({
            type: reason.type,
            module: reason.module,
            location: reason.loc
          })) || []
        });
      });
    }

    // Parse assets
    if (statsData.assets) {
      statsData.assets.forEach((asset: any) => {
        assets.push({
          name: asset.name,
          size: asset.size || 0,
          chunks: asset.chunks || [],
          type: this.getAssetType(asset.name)
        });
      });
    }

    // Parse entrypoints
    if (statsData.entrypoints) {
      Object.entries(statsData.entrypoints).forEach(([name, entry]: [string, any]) => {
        entrypoints.push({
          name,
          chunks: entry.chunks || [],
          assets: entry.assets || [],
          size: entry.assets?.reduce((sum: number, asset: any) => 
            sum + (statsData.assets?.find((a: any) => a.name === asset)?.size || 0), 0) || 0
        });
      });
    }

    // Calculate totals
    const totalSize = assets.reduce((sum, asset) => sum + asset.size, 0);
    const gzipSize = Math.round(totalSize * 0.3); // Rough estimate

    // Find duplicated modules
    const duplicatedModules = this.findDuplicatedModules(modules);

    // Find unused modules (simplified heuristic)
    const unusedModules = modules
      .filter(module => module.chunks.length === 0)
      .map(module => module.name);

    // Find circular dependencies
    const circularDependencies = this.findCircularDependencies(modules);

    return {
      chunks,
      modules,
      assets,
      entrypoints,
      totalSize,
      gzipSize,
      duplicatedModules,
      unusedModules,
      circularDependencies
    };
  }

  /**
   * Build stats from runtime performance data
   */
  private async buildStatsFromRuntime(scriptEntries: PerformanceResourceTiming[]): Promise<BundleStats> {
    const chunks: ChunkInfo[] = [];
    const modules: ModuleInfo[] = [];
    const assets: AssetInfo[] = [];
    const entrypoints: EntrypointInfo[] = [];

    let totalSize = 0;

    // Analyze each script resource
    for (const entry of scriptEntries) {
      const size = entry.transferSize || entry.encodedBodySize || 0;
      totalSize += size;

      const chunkName = this.extractChunkName(entry.name);
      const isAsync = entry.name.includes('chunk') || entry.name.includes('lazy');

      // Create chunk info
      chunks.push({
        id: chunkName,
        name: chunkName,
        size: size / 1024, // Convert to KB
        modules: [], // Runtime analysis can't easily determine modules
        isAsync,
        isEntry: entry.name.includes('index') || entry.name.includes('main'),
        parents: [],
        children: [],
        loadTime: entry.duration
      });

      // Create asset info
      assets.push({
        name: this.extractFileName(entry.name),
        size: size / 1024,
        chunks: [chunkName],
        type: 'js'
      });

      // Create simplified module info
      modules.push({
        id: chunkName,
        name: chunkName,
        size: size / 1024,
        chunks: [chunkName],
        dependencies: [],
        isDynamic: isAsync,
        isEntry: !isAsync,
        reasons: []
      });
    }

    // Identify main entrypoint
    const mainChunk = chunks.find(chunk => chunk.isEntry);
    if (mainChunk) {
      entrypoints.push({
        name: 'main',
        chunks: [mainChunk.id],
        assets: [mainChunk.name + '.js'],
        size: mainChunk.size
      });
    }

    return {
      chunks,
      modules,
      assets,
      entrypoints,
      totalSize: totalSize / 1024, // Convert to KB
      gzipSize: Math.round(totalSize * 0.3 / 1024), // Rough estimate
      duplicatedModules: [],
      unusedModules: [],
      circularDependencies: []
    };
  }

  /**
   * Extract chunk name from URL
   */
  private extractChunkName(url: string): string {
    const parts = url.split('/');
    const filename = parts[parts.length - 1];
    return filename.split('.')[0] || 'unknown';
  }

  /**
   * Extract filename from URL
   */
  private extractFileName(url: string): string {
    const parts = url.split('/');
    return parts[parts.length - 1] || 'unknown';
  }

  /**
   * Determine asset type from filename
   */
  private getAssetType(filename: string): 'js' | 'css' | 'image' | 'font' | 'other' {
    const ext = filename.split('.').pop()?.toLowerCase();
    
    switch (ext) {
      case 'js':
      case 'mjs':
        return 'js';
      case 'css':
        return 'css';
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif':
      case 'svg':
      case 'webp':
        return 'image';
      case 'woff':
      case 'woff2':
      case 'ttf':
      case 'eot':
        return 'font';
      default:
        return 'other';
    }
  }

  /**
   * Find duplicated modules across chunks
   */
  private findDuplicatedModules(modules: ModuleInfo[]): DuplicatedModule[] {
    const moduleMap = new Map<string, ModuleInfo[]>();

    // Group modules by name
    modules.forEach(module => {
      const key = module.name;
      if (!moduleMap.has(key)) {
        moduleMap.set(key, []);
      }
      moduleMap.get(key)!.push(module);
    });

    // Find duplicates
    const duplicates: DuplicatedModule[] = [];
    moduleMap.forEach((instances, moduleName) => {
      if (instances.length >= this.thresholds.duplicatedModuleThreshold) {
        const totalSize = instances.reduce((sum, instance) => sum + instance.size, 0);
        const chunks = [...new Set(instances.flatMap(instance => instance.chunks))];

        duplicates.push({
          module: moduleName,
          chunks,
          totalSize,
          instances: instances.length
        });
      }
    });

    return duplicates;
  }

  /**
   * Find circular dependencies (simplified detection)
   */
  private findCircularDependencies(modules: ModuleInfo[]): CircularDependency[] {
    const dependencies = new Map<string, string[]>();
    
    // Build dependency graph
    modules.forEach(module => {
      dependencies.set(module.name, module.dependencies);
    });

    const circularDeps: CircularDependency[] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const detectCycle = (module: string, path: string[]): void => {
      if (recursionStack.has(module)) {
        // Found cycle
        const cycleStart = path.indexOf(module);
        const cycle = path.slice(cycleStart).concat(module);
        
        circularDeps.push({
          modules: cycle,
          severity: cycle.length > this.thresholds.circularDependencyDepth ? 'high' : 'medium'
        });
        return;
      }

      if (visited.has(module)) return;

      visited.add(module);
      recursionStack.add(module);

      const deps = dependencies.get(module) || [];
      deps.forEach(dep => {
        detectCycle(dep, [...path, module]);
      });

      recursionStack.delete(module);
    };

    // Check each module for cycles
    modules.forEach(module => {
      if (!visited.has(module.name)) {
        detectCycle(module.name, []);
      }
    });

    return circularDeps;
  }

  /**
   * Identify bundle issues
   */
  private identifyIssues(stats: BundleStats): BundleIssue[] {
    const issues: BundleIssue[] = [];

    // Large chunks
    stats.chunks.forEach(chunk => {
      if (chunk.size > this.thresholds.largeChunk) {
        issues.push({
          type: 'large_chunk',
          severity: chunk.size > this.thresholds.largeChunk * 2 ? 'high' : 'medium',
          description: `Chunk "${chunk.name}" is ${chunk.size.toFixed(1)}KB (>${this.thresholds.largeChunk}KB)`,
          affectedFiles: [chunk.name],
          recommendation: 'Consider code splitting or lazy loading for this chunk',
          estimatedImpact: Math.max(0, chunk.size - this.thresholds.largeChunk)
        });
      }
    });

    // Large total bundle
    if (stats.totalSize > this.thresholds.largeTotalBundle) {
      issues.push({
        type: 'large_chunk',
        severity: 'high',
        description: `Total bundle size is ${stats.totalSize.toFixed(1)}KB (>${this.thresholds.largeTotalBundle}KB)`,
        affectedFiles: stats.assets.map(asset => asset.name),
        recommendation: 'Implement aggressive code splitting and tree shaking',
        estimatedImpact: stats.totalSize - this.thresholds.largeTotalBundle
      });
    }

    // Duplicated modules
    stats.duplicatedModules.forEach(dup => {
      issues.push({
        type: 'duplicated_module',
        severity: dup.instances > 3 ? 'high' : 'medium',
        description: `Module "${dup.module}" is duplicated ${dup.instances} times (${dup.totalSize.toFixed(1)}KB total)`,
        affectedFiles: dup.chunks,
        recommendation: 'Extract to shared chunk or use module federation',
        estimatedImpact: dup.totalSize * (dup.instances - 1) / dup.instances
      });
    });

    // Unused modules
    if (stats.unusedModules.length > 0) {
      issues.push({
        type: 'unused_module',
        severity: 'medium',
        description: `${stats.unusedModules.length} modules appear to be unused`,
        affectedFiles: stats.unusedModules,
        recommendation: 'Remove unused modules or implement tree shaking',
        estimatedImpact: 50 // Rough estimate
      });
    }

    // Circular dependencies
    stats.circularDependencies.forEach(circular => {
      issues.push({
        type: 'circular_dependency',
        severity: circular.severity,
        description: `Circular dependency detected: ${circular.modules.join(' → ')}`,
        affectedFiles: circular.modules,
        recommendation: 'Refactor to remove circular dependencies',
        estimatedImpact: 10 // Maintenance impact rather than size
      });
    });

    return issues;
  }

  /**
   * Generate optimization recommendations
   */
  private generateRecommendations(stats: BundleStats, issues: BundleIssue[]): OptimizationOpportunity[] {
    const recommendations: OptimizationOpportunity[] = [];

    // Code splitting recommendations
    const largeChunks = stats.chunks.filter(chunk => chunk.size > this.thresholds.largeChunk);
    if (largeChunks.length > 0) {
      recommendations.push({
        type: 'code_splitting',
        description: `Implement code splitting for ${largeChunks.length} large chunks`,
        impact: 'high',
        effort: 'medium',
        estimatedImprovement: largeChunks.reduce((sum, chunk) => sum + chunk.size, 0) * 0.3,
        implementation: `Split chunks: ${largeChunks.map(c => c.name).join(', ')}`
      });
    }

    // Bundle reduction recommendations
    if (stats.totalSize > this.thresholds.largeTotalBundle) {
      recommendations.push({
        type: 'bundle_reduction',
        description: 'Reduce overall bundle size through tree shaking and optimization',
        impact: 'high',
        effort: 'medium',
        estimatedImprovement: (stats.totalSize - this.thresholds.largeTotalBundle) * 10,
        implementation: 'Enable tree shaking, remove unused dependencies, optimize imports'
      });
    }

    // Lazy loading recommendations
    const asyncChunks = stats.chunks.filter(chunk => !chunk.isAsync && chunk.size > 100);
    if (asyncChunks.length > 0) {
      recommendations.push({
        type: 'lazy_loading',
        description: `Convert ${asyncChunks.length} chunks to lazy loading`,
        impact: 'medium',
        effort: 'low',
        estimatedImprovement: asyncChunks.reduce((sum, chunk) => sum + chunk.size, 0) * 0.2,
        implementation: `Use dynamic imports for: ${asyncChunks.map(c => c.name).join(', ')}`
      });
    }

    // Caching recommendations
    if (stats.assets.length > 10) {
      recommendations.push({
        type: 'caching',
        description: 'Implement intelligent caching for static assets',
        impact: 'medium',
        effort: 'low',
        estimatedImprovement: stats.totalSize * 0.5, // Perceived performance improvement
        implementation: 'Configure long-term caching for static assets with content hashing'
      });
    }

    // Preloading recommendations for critical chunks
    const criticalChunks = stats.chunks.filter(chunk => chunk.isEntry);
    if (criticalChunks.length > 0) {
      recommendations.push({
        type: 'preloading',
        description: 'Preload critical chunks for faster initial load',
        impact: 'medium',
        effort: 'low',
        estimatedImprovement: criticalChunks.reduce((sum, chunk) => sum + (chunk.loadTime || 0), 0) * 0.3,
        implementation: `Add preload hints for: ${criticalChunks.map(c => c.name).join(', ')}`
      });
    }

    return recommendations.sort((a, b) => {
      const impactScore = { high: 3, medium: 2, low: 1 };
      const effortScore = { low: 3, medium: 2, high: 1 };
      
      const scoreA = impactScore[a.impact] + effortScore[a.effort];
      const scoreB = impactScore[b.impact] + effortScore[b.effort];
      
      return scoreB - scoreA;
    });
  }

  /**
   * Calculate bundle health score (0-100)
   */
  private calculateBundleScore(stats: BundleStats, issues: BundleIssue[]): number {
    let score = 100;

    // Deduct points for issues
    issues.forEach(issue => {
      switch (issue.severity) {
        case 'critical':
          score -= 25;
          break;
        case 'high':
          score -= 15;
          break;
        case 'medium':
          score -= 10;
          break;
        case 'low':
          score -= 5;
          break;
      }
    });

    // Deduct points for large bundle size
    if (stats.totalSize > this.thresholds.largeTotalBundle) {
      const excess = stats.totalSize - this.thresholds.largeTotalBundle;
      score -= Math.min(20, excess / 100); // Max 20 points deduction
    }

    // Deduct points for too many chunks (complexity)
    if (stats.chunks.length > 20) {
      score -= Math.min(10, (stats.chunks.length - 20) / 2);
    }

    // Bonus points for good practices
    const asyncChunks = stats.chunks.filter(chunk => chunk.isAsync).length;
    const totalChunks = stats.chunks.length;
    
    if (totalChunks > 0 && asyncChunks / totalChunks > 0.5) {
      score += 5; // Bonus for good code splitting
    }

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  /**
   * Get bundle optimization summary
   */
  public getBundleOptimizationSummary(analysis: BundleAnalysisResult): {
    score: number;
    totalSize: number;
    chunksCount: number;
    issuesCount: number;
    recommendationsCount: number;
    potentialSavings: number;
  } {
    const potentialSavings = analysis.recommendations.reduce(
      (sum, rec) => sum + rec.estimatedImprovement, 0
    );

    return {
      score: analysis.score,
      totalSize: analysis.stats.totalSize,
      chunksCount: analysis.stats.chunks.length,
      issuesCount: analysis.issues.length,
      recommendationsCount: analysis.recommendations.length,
      potentialSavings
    };
  }
}

// Export singleton instance
export const bundleAnalyzer = new BundleAnalyzer();

// Export types
export type { BundleAnalysisResult, BundleIssue };
export { BundleAnalyzer };