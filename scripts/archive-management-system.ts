#!/usr/bin/env tsx
/**
 * Archive Management System
 * 
 * Provides comprehensive archive management capabilities:
 * - Archive browser UI for easy component restoration
 * - Archive search and filter capabilities
 * - Dependency visualization for archived components
 * - Archive statistics and cleanup impact reports
 * - Automated archive cleanup (after 90 days confirmation)
 */

import { promises as fs } from 'fs';
import { join, dirname, basename, relative } from 'path';
import { execSync } from 'child_process';
import { createHash } from 'crypto';

interface ArchiveComponent {
  originalPath: string;
  archivePath: string;
  origin: string;
  safeToArchive: boolean;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  dependencies: string[];
  backendDependencies: string[];
  routeUsage: string[];
  checksum?: string;
  archivedAt: string;
  lastModified?: string;
  size?: number;
}

interface ArchiveManifest {
  timestamp: string;
  archiveDirectory: string;
  version: string;
  summary: {
    totalComponents: number;
    archivedComponents: number;
    onHoldComponents: number;
    manualArchiveComponents: number;
  };
  components: ArchiveComponent[];
}

interface SearchFilter {
  origin?: string;
  riskLevel?: string;
  hasBackendDependencies?: boolean;
  hasRouteUsage?: boolean;
  pathPattern?: string;
  dateRange?: {
    from: string;
    to: string;
  };
}

interface ArchiveStatistics {
  totalComponents: number;
  componentsByOrigin: Record<string, number>;
  componentsByRiskLevel: Record<string, number>;
  componentsByType: Record<string, number>;
  totalSize: number;
  averageSize: number;
  oldestComponent: string;
  newestComponent: string;
  dependencyGraph: DependencyNode[];
}

interface DependencyNode {
  path: string;
  dependencies: string[];
  dependents: string[];
  depth: number;
  isOrphan: boolean;
}

interface CleanupCandidate {
  path: string;
  reason: string;
  archivedAt: string;
  daysSinceArchived: number;
  safeToDelete: boolean;
  dependencies: string[];
}

class ArchiveManagementSystem {
  private archiveDirectory: string;
  private manifest: ArchiveManifest | null = null;

  constructor(archiveDirectory: string) {
    this.archiveDirectory = archiveDirectory;
  }

  /**
   * Initialize the archive management system
   */
  async initialize(): Promise<void> {
    console.log('📦 Initializing Archive Management System...');
    
    try {
      await this.loadManifest();
      console.log(`✅ Archive loaded: ${this.manifest?.summary.totalComponents} components`);
    } catch (error) {
      console.error('❌ Failed to initialize archive system:', error);
      throw error;
    }
  }

  /**
   * Search and filter archived components
   */
  async searchComponents(filter: SearchFilter): Promise<ArchiveComponent[]> {
    if (!this.manifest) {
      throw new Error('Archive not initialized');
    }

    let results = [...this.manifest.components];

    // Apply filters
    if (filter.origin) {
      results = results.filter(c => c.origin === filter.origin);
    }

    if (filter.riskLevel) {
      results = results.filter(c => c.riskLevel === filter.riskLevel);
    }

    if (filter.hasBackendDependencies !== undefined) {
      results = results.filter(c => 
        filter.hasBackendDependencies 
          ? c.backendDependencies.length > 0 
          : c.backendDependencies.length === 0
      );
    }

    if (filter.hasRouteUsage !== undefined) {
      results = results.filter(c => 
        filter.hasRouteUsage 
          ? c.routeUsage.length > 0 
          : c.routeUsage.length === 0
      );
    }

    if (filter.pathPattern) {
      const pattern = new RegExp(filter.pathPattern, 'i');
      results = results.filter(c => pattern.test(c.originalPath));
    }

    if (filter.dateRange) {
      const fromDate = new Date(filter.dateRange.from);
      const toDate = new Date(filter.dateRange.to);
      results = results.filter(c => {
        const archivedDate = new Date(c.archivedAt);
        return archivedDate >= fromDate && archivedDate <= toDate;
      });
    }

    return results;
  }

  /**
   * Generate comprehensive archive statistics
   */
  async generateStatistics(): Promise<ArchiveStatistics> {
    if (!this.manifest) {
      throw new Error('Archive not initialized');
    }

    console.log('📊 Generating archive statistics...');

    const components = this.manifest.components;
    
    // Basic counts
    const componentsByOrigin: Record<string, number> = {};
    const componentsByRiskLevel: Record<string, number> = {};
    const componentsByType: Record<string, number> = {};
    
    let totalSize = 0;
    let oldestDate = new Date();
    let newestDate = new Date(0);
    let oldestComponent = '';
    let newestComponent = '';

    for (const component of components) {
      // Count by origin
      componentsByOrigin[component.origin] = (componentsByOrigin[component.origin] || 0) + 1;
      
      // Count by risk level
      componentsByRiskLevel[component.riskLevel] = (componentsByRiskLevel[component.riskLevel] || 0) + 1;
      
      // Count by type (file extension)
      const ext = component.originalPath.split('.').pop() || 'unknown';
      componentsByType[ext] = (componentsByType[ext] || 0) + 1;
      
      // Size calculation
      if (component.size) {
        totalSize += component.size;
      }
      
      // Date tracking
      const archivedDate = new Date(component.archivedAt);
      if (archivedDate < oldestDate) {
        oldestDate = archivedDate;
        oldestComponent = component.originalPath;
      }
      if (archivedDate > newestDate) {
        newestDate = archivedDate;
        newestComponent = component.originalPath;
      }
    }

    // Generate dependency graph
    const dependencyGraph = await this.generateDependencyGraph();

    return {
      totalComponents: components.length,
      componentsByOrigin,
      componentsByRiskLevel,
      componentsByType,
      totalSize,
      averageSize: components.length > 0 ? totalSize / components.length : 0,
      oldestComponent,
      newestComponent,
      dependencyGraph
    };
  }

  /**
   * Generate dependency visualization graph
   */
  async generateDependencyGraph(): Promise<DependencyNode[]> {
    if (!this.manifest) {
      throw new Error('Archive not initialized');
    }

    console.log('🔗 Generating dependency graph...');

    const nodes: Map<string, DependencyNode> = new Map();
    
    // Initialize nodes
    for (const component of this.manifest.components) {
      nodes.set(component.originalPath, {
        path: component.originalPath,
        dependencies: [...component.dependencies],
        dependents: [],
        depth: 0,
        isOrphan: true
      });
    }

    // Build dependency relationships
    for (const component of this.manifest.components) {
      const node = nodes.get(component.originalPath);
      if (!node) continue;

      for (const dep of component.dependencies) {
        // Resolve dependency path
        const depPath = this.resolveDependencyPath(dep, component.originalPath);
        if (depPath && nodes.has(depPath)) {
          const depNode = nodes.get(depPath);
          if (depNode) {
            depNode.dependents.push(component.originalPath);
            node.isOrphan = false;
          }
        }
      }
    }

    // Calculate depths (distance from root nodes)
    const calculateDepth = (path: string, visited: Set<string> = new Set()): number => {
      if (visited.has(path)) return 0; // Circular dependency
      visited.add(path);
      
      const node = nodes.get(path);
      if (!node || node.dependencies.length === 0) return 0;
      
      let maxDepth = 0;
      for (const dep of node.dependencies) {
        const depPath = this.resolveDependencyPath(dep, path);
        if (depPath && nodes.has(depPath)) {
          maxDepth = Math.max(maxDepth, calculateDepth(depPath, new Set(visited)) + 1);
        }
      }
      
      return maxDepth;
    };

    for (const [path, node] of nodes) {
      node.depth = calculateDepth(path);
    }

    return Array.from(nodes.values());
  }

  /**
   * Generate cleanup impact report
   */
  async generateCleanupImpactReport(): Promise<{
    safeToDelete: CleanupCandidate[];
    requiresReview: CleanupCandidate[];
    totalSizeReduction: number;
  }> {
    if (!this.manifest) {
      throw new Error('Archive not initialized');
    }

    console.log('🧹 Generating cleanup impact report...');

    const now = new Date();
    const safeToDelete: CleanupCandidate[] = [];
    const requiresReview: CleanupCandidate[] = [];
    let totalSizeReduction = 0;

    for (const component of this.manifest.components) {
      const archivedDate = new Date(component.archivedAt);
      const daysSinceArchived = Math.floor((now.getTime() - archivedDate.getTime()) / (1000 * 60 * 60 * 24));
      
      const candidate: CleanupCandidate = {
        path: component.originalPath,
        reason: '',
        archivedAt: component.archivedAt,
        daysSinceArchived,
        safeToDelete: false,
        dependencies: component.dependencies
      };

      // Determine if safe to delete
      if (daysSinceArchived >= 90) {
        if (component.riskLevel === 'low' && 
            component.backendDependencies.length === 0 && 
            component.routeUsage.length === 0) {
          candidate.safeToDelete = true;
          candidate.reason = 'Low risk, no backend dependencies, archived >90 days';
          safeToDelete.push(candidate);
          
          if (component.size) {
            totalSizeReduction += component.size;
          }
        } else {
          candidate.reason = `Archived >90 days but has ${component.riskLevel} risk level`;
          if (component.backendDependencies.length > 0) {
            candidate.reason += ', backend dependencies';
          }
          if (component.routeUsage.length > 0) {
            candidate.reason += ', route usage';
          }
          requiresReview.push(candidate);
        }
      } else {
        candidate.reason = `Archived only ${daysSinceArchived} days ago (< 90 days)`;
        requiresReview.push(candidate);
      }
    }

    return {
      safeToDelete,
      requiresReview,
      totalSizeReduction
    };
  }

  /**
   * Browse archive with interactive interface
   */
  async browseArchive(): Promise<void> {
    if (!this.manifest) {
      throw new Error('Archive not initialized');
    }

    console.log('\n📦 Archive Browser');
    console.log('==================');
    console.log(`Total Components: ${this.manifest.summary.totalComponents}`);
    console.log(`Archive Directory: ${this.archiveDirectory}`);
    console.log(`Last Updated: ${this.manifest.timestamp}`);
    
    const statistics = await this.generateStatistics();
    
    console.log('\n📊 Statistics:');
    console.log(`  By Origin:`);
    for (const [origin, count] of Object.entries(statistics.componentsByOrigin)) {
      console.log(`    ${origin}: ${count}`);
    }
    
    console.log(`  By Risk Level:`);
    for (const [level, count] of Object.entries(statistics.componentsByRiskLevel)) {
      console.log(`    ${level}: ${count}`);
    }
    
    console.log(`  Total Size: ${this.formatBytes(statistics.totalSize)}`);
    console.log(`  Average Size: ${this.formatBytes(statistics.averageSize)}`);
    
    // Show recent components
    const recentComponents = this.manifest.components
      .sort((a, b) => new Date(b.archivedAt).getTime() - new Date(a.archivedAt).getTime())
      .slice(0, 10);
    
    console.log('\n🕒 Recently Archived:');
    for (const component of recentComponents) {
      const date = new Date(component.archivedAt).toLocaleDateString();
      console.log(`  ${component.originalPath} (${component.riskLevel}) - ${date}`);
    }
    
    // Show cleanup candidates
    const cleanupReport = await this.generateCleanupImpactReport();
    console.log(`\n🧹 Cleanup Candidates:`);
    console.log(`  Safe to delete: ${cleanupReport.safeToDelete.length} components`);
    console.log(`  Requires review: ${cleanupReport.requiresReview.length} components`);
    console.log(`  Potential size reduction: ${this.formatBytes(cleanupReport.totalSizeReduction)}`);
  }

  /**
   * Automated archive cleanup (90+ days old, low risk)
   */
  async performAutomatedCleanup(options: {
    dryRun?: boolean;
    force?: boolean;
  } = {}): Promise<{
    deleted: string[];
    errors: string[];
    sizeReduction: number;
  }> {
    console.log('🧹 Performing automated archive cleanup...');
    
    const cleanupReport = await this.generateCleanupImpactReport();
    const deleted: string[] = [];
    const errors: string[] = [];
    let sizeReduction = 0;

    if (options.dryRun) {
      console.log(`🧪 DRY RUN: Would delete ${cleanupReport.safeToDelete.length} components`);
      for (const candidate of cleanupReport.safeToDelete) {
        console.log(`  Would delete: ${candidate.path} (${candidate.reason})`);
      }
      return { deleted: [], errors: [], sizeReduction: cleanupReport.totalSizeReduction };
    }

    if (!options.force && cleanupReport.safeToDelete.length > 0) {
      console.log(`⚠️ About to delete ${cleanupReport.safeToDelete.length} archived components`);
      console.log('Use --force to proceed with deletion');
      return { deleted: [], errors: [], sizeReduction: 0 };
    }

    for (const candidate of cleanupReport.safeToDelete) {
      try {
        const component = this.manifest!.components.find(c => c.originalPath === candidate.path);
        if (component && component.archivePath) {
          await fs.unlink(component.archivePath);
          deleted.push(candidate.path);
          
          if (component.size) {
            sizeReduction += component.size;
          }
          
          console.log(`🗑️ Deleted: ${candidate.path}`);
        }
      } catch (error) {
        errors.push(`Failed to delete ${candidate.path}: ${error}`);
        console.error(`❌ Failed to delete ${candidate.path}:`, error);
      }
    }

    // Update manifest to remove deleted components
    if (deleted.length > 0) {
      this.manifest!.components = this.manifest!.components.filter(
        c => !deleted.includes(c.originalPath)
      );
      
      this.manifest!.summary.totalComponents -= deleted.length;
      this.manifest!.summary.archivedComponents -= deleted.length;
      this.manifest!.timestamp = new Date().toISOString();
      
      await this.saveManifest();
    }

    console.log(`✅ Cleanup completed: ${deleted.length} deleted, ${errors.length} errors`);
    console.log(`💾 Size reduction: ${this.formatBytes(sizeReduction)}`);

    return { deleted, errors, sizeReduction };
  }

  /**
   * Export archive report
   */
  async exportReport(format: 'json' | 'csv' | 'html' = 'json'): Promise<string> {
    if (!this.manifest) {
      throw new Error('Archive not initialized');
    }

    const statistics = await this.generateStatistics();
    const cleanupReport = await this.generateCleanupImpactReport();
    
    const report = {
      metadata: {
        generatedAt: new Date().toISOString(),
        archiveDirectory: this.archiveDirectory,
        version: this.manifest.version
      },
      summary: this.manifest.summary,
      statistics,
      cleanupReport,
      components: this.manifest.components
    };

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `archive-report-${timestamp}.${format}`;

    switch (format) {
      case 'json':
        await fs.writeFile(filename, JSON.stringify(report, null, 2));
        break;
        
      case 'csv':
        const csvContent = this.convertToCSV(this.manifest.components);
        await fs.writeFile(filename, csvContent);
        break;
        
      case 'html':
        const htmlContent = this.generateHTMLReport(report);
        await fs.writeFile(filename, htmlContent);
        break;
    }

    console.log(`📄 Report exported: ${filename}`);
    return filename;
  }

  // Private helper methods

  private async loadManifest(): Promise<void> {
    const manifestPath = join(this.archiveDirectory, 'archive-manifest.json');
    const content = await fs.readFile(manifestPath, 'utf-8');
    this.manifest = JSON.parse(content);
    
    // Enhance components with file information
    if (this.manifest) {
      for (const component of this.manifest.components) {
        try {
          const stats = await fs.stat(component.archivePath);
          component.size = stats.size;
          component.lastModified = stats.mtime.toISOString();
        } catch (error) {
          // File might not exist
        }
      }
    }
  }

  private async saveManifest(): Promise<void> {
    if (!this.manifest) return;
    
    const manifestPath = join(this.archiveDirectory, 'archive-manifest.json');
    await fs.writeFile(manifestPath, JSON.stringify(this.manifest, null, 2));
  }

  private resolveDependencyPath(dependency: string, fromPath: string): string | null {
    if (dependency.startsWith('@/')) {
      return dependency.replace('@/', 'src/');
    }
    
    if (dependency.startsWith('./') || dependency.startsWith('../')) {
      return join(dirname(fromPath), dependency);
    }
    
    return null;
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  private convertToCSV(components: ArchiveComponent[]): string {
    const headers = [
      'Original Path',
      'Archive Path', 
      'Origin',
      'Risk Level',
      'Safe To Archive',
      'Dependencies Count',
      'Backend Dependencies Count',
      'Route Usage Count',
      'Archived At',
      'Size (Bytes)'
    ];
    
    const rows = components.map(c => [
      c.originalPath,
      c.archivePath,
      c.origin,
      c.riskLevel,
      c.safeToArchive.toString(),
      c.dependencies.length.toString(),
      c.backendDependencies.length.toString(),
      c.routeUsage.length.toString(),
      c.archivedAt,
      (c.size || 0).toString()
    ]);
    
    return [headers, ...rows].map(row => 
      row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')
    ).join('\n');
  }

  private generateHTMLReport(report: any): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <title>Archive Management Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f5f5f5; padding: 20px; border-radius: 5px; }
        .section { margin: 20px 0; }
        .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; }
        .stat-card { background: #fff; border: 1px solid #ddd; padding: 15px; border-radius: 5px; }
        table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .risk-low { color: green; }
        .risk-medium { color: orange; }
        .risk-high { color: red; }
        .risk-critical { color: darkred; font-weight: bold; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Archive Management Report</h1>
        <p>Generated: ${report.metadata.generatedAt}</p>
        <p>Archive: ${report.metadata.archiveDirectory}</p>
    </div>
    
    <div class="section">
        <h2>Summary</h2>
        <div class="stats">
            <div class="stat-card">
                <h3>Total Components</h3>
                <p>${report.summary.totalComponents}</p>
            </div>
            <div class="stat-card">
                <h3>Archived Components</h3>
                <p>${report.summary.archivedComponents}</p>
            </div>
            <div class="stat-card">
                <h3>On-Hold Components</h3>
                <p>${report.summary.onHoldComponents}</p>
            </div>
        </div>
    </div>
    
    <div class="section">
        <h2>Cleanup Candidates</h2>
        <p>Safe to delete: ${report.cleanupReport.safeToDelete.length}</p>
        <p>Requires review: ${report.cleanupReport.requiresReview.length}</p>
        <p>Potential size reduction: ${this.formatBytes(report.cleanupReport.totalSizeReduction)}</p>
    </div>
</body>
</html>`;
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  const archiveDir = args.find(arg => arg.startsWith('--archive='))?.split('=')[1] || 
                     'src/archive/consolidated-legacy-archive-2025-09-18';
  
  const archiveSystem = new ArchiveManagementSystem(archiveDir);
  await archiveSystem.initialize();
  
  switch (command) {
    case 'browse':
      await archiveSystem.browseArchive();
      break;
      
    case 'search':
      const filter: SearchFilter = {};
      
      // Parse search filters from args
      args.forEach(arg => {
        if (arg.startsWith('--origin=')) filter.origin = arg.split('=')[1];
        if (arg.startsWith('--risk=')) filter.riskLevel = arg.split('=')[1];
        if (arg.startsWith('--pattern=')) filter.pathPattern = arg.split('=')[1];
        if (arg === '--has-backend-deps') filter.hasBackendDependencies = true;
        if (arg === '--has-routes') filter.hasRouteUsage = true;
      });
      
      const results = await archiveSystem.searchComponents(filter);
      console.log(`Found ${results.length} components:`);
      results.forEach(c => {
        console.log(`  ${c.originalPath} (${c.origin}, ${c.riskLevel})`);
      });
      break;
      
    case 'stats':
      const stats = await archiveSystem.generateStatistics();
      console.log('Archive Statistics:');
      console.log(JSON.stringify(stats, null, 2));
      break;
      
    case 'cleanup':
      const cleanupOptions = {
        dryRun: args.includes('--dry-run'),
        force: args.includes('--force')
      };
      
      await archiveSystem.performAutomatedCleanup(cleanupOptions);
      break;
      
    case 'export':
      const format = (args.find(arg => arg.startsWith('--format='))?.split('=')[1] || 'json') as 'json' | 'csv' | 'html';
      await archiveSystem.exportReport(format);
      break;
      
    default:
      console.log(`
Archive Management System - Usage:

  npx tsx scripts/archive-management-system.ts <command> [options]

Commands:
  browse                          Interactive archive browser
  search [filters]                Search archived components
  stats                           Generate archive statistics
  cleanup [options]               Automated cleanup (90+ days)
  export [options]                Export archive report

Search Filters:
  --origin=<origin>               Filter by origin (lovable, supabase, kiro, unknown)
  --risk=<level>                  Filter by risk level (low, medium, high, critical)
  --pattern=<regex>               Filter by path pattern
  --has-backend-deps              Components with backend dependencies
  --has-routes                    Components with route usage

Cleanup Options:
  --dry-run                       Show what would be deleted
  --force                         Proceed with deletion

Export Options:
  --format=<format>               Export format (json, csv, html)

Global Options:
  --archive=<path>                Archive directory path

Examples:
  npx tsx scripts/archive-management-system.ts browse
  npx tsx scripts/archive-management-system.ts search --origin=supabase --risk=high
  npx tsx scripts/archive-management-system.ts cleanup --dry-run
  npx tsx scripts/archive-management-system.ts export --format=html
      `);
  }
}

// Check if this file is being run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { ArchiveManagementSystem, ArchiveComponent, SearchFilter, ArchiveStatistics };