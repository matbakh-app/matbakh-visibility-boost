#!/usr/bin/env tsx
/**
 * On-Hold Component Restoration Utility
 * 
 * Provides easy restoration of components from the on-hold archive
 * with dependency validation and safety checks.
 */

import { promises as fs } from 'fs';
import { join, dirname, relative } from 'path';
import { execSync } from 'child_process';

interface OnHoldComponent {
  originalPath: string;
  archivePath: string;
  onHoldPath: string;
  origin: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  dependencies: string[];
  backendDependencies: string[];
  routeUsage: string[];
  holdReason: string;
  priority: number;
}

interface RestorationResult {
  success: boolean;
  component: string;
  dependencies: string[];
  warnings: string[];
  errors: string[];
}

class OnHoldComponentRestorer {
  private archiveDirectory: string;
  private onHoldDirectory: string;
  private analysisReport: any;

  constructor(archiveDirectory: string) {
    this.archiveDirectory = archiveDirectory;
    this.onHoldDirectory = join(archiveDirectory, 'on-hold');
  }

  /**
   * Initialize the restorer
   */
  async initialize(): Promise<void> {
    console.log('🔄 Initializing On-Hold Component Restorer...');
    
    try {
      // Load on-hold analysis report
      const reportPath = join(this.onHoldDirectory, 'on-hold-analysis-report.json');
      const reportContent = await fs.readFile(reportPath, 'utf-8');
      this.analysisReport = JSON.parse(reportContent);
      
      console.log(`✅ Loaded ${this.analysisReport.components.length} on-hold components`);
    } catch (error) {
      console.error('❌ Failed to initialize restorer:', error);
      throw error;
    }
  }

  /**
   * List all on-hold components
   */
  async listOnHoldComponents(filter?: {
    riskLevel?: string;
    origin?: string;
    hasBackendDeps?: boolean;
    pathPattern?: string;
  }): Promise<OnHoldComponent[]> {
    let components = this.analysisReport.components || [];

    if (filter) {
      if (filter.riskLevel) {
        components = components.filter((c: any) => c.riskLevel === filter.riskLevel);
      }
      
      if (filter.origin) {
        components = components.filter((c: any) => c.origin === filter.origin);
      }
      
      if (filter.hasBackendDeps !== undefined) {
        components = components.filter((c: any) => 
          filter.hasBackendDeps 
            ? c.backendDependencies?.length > 0 
            : !c.backendDependencies?.length
        );
      }
      
      if (filter.pathPattern) {
        const pattern = new RegExp(filter.pathPattern, 'i');
        components = components.filter((c: any) => pattern.test(c.originalPath));
      }
    }

    return components
      .filter((c: any) => (c.originalPath || c.path) && typeof (c.originalPath || c.path) === 'string')
      .map((c: any) => {
        const componentPath = c.originalPath || c.path;
        return {
      originalPath: componentPath,
      archivePath: c.archivePath || join(this.onHoldDirectory, componentPath),
      onHoldPath: join(this.onHoldDirectory, componentPath),
      origin: c.origin || 'unknown',
      riskLevel: c.riskLevel || 'medium',
      dependencies: c.dependencies || [],
      backendDependencies: c.backendDependencies || [],
      routeUsage: c.routeUsage || [],
      holdReason: c.holdReason || 'Legacy analysis marked as high risk',
      priority: c.priority || 50
    };
      });
  }

  /**
   * Restore a single on-hold component
   */
  async restoreComponent(componentPath: string, options: {
    dryRun?: boolean;
    force?: boolean;
    validateDependencies?: boolean;
    restoreDependencies?: boolean;
  } = {}): Promise<RestorationResult> {
    console.log(`🔄 Restoring on-hold component: ${componentPath}`);
    
    const result: RestorationResult = {
      success: false,
      component: componentPath,
      dependencies: [],
      warnings: [],
      errors: []
    };

    try {
      // Find component in on-hold list
      const components = await this.listOnHoldComponents();
      const component = components.find(c => 
        c.originalPath === componentPath || 
        c.originalPath.endsWith(componentPath) ||
        componentPath.endsWith(c.originalPath.split('/').pop() || '')
      );

      if (!component) {
        result.errors.push(`Component not found in on-hold archive: ${componentPath}`);
        return result;
      }

      console.log(`📍 Found component: ${component.originalPath}`);
      console.log(`   Risk Level: ${component.riskLevel}`);
      console.log(`   Origin: ${component.origin}`);
      console.log(`   Hold Reason: ${component.holdReason}`);

      if (options.dryRun) {
        console.log(`🧪 DRY RUN: Would restore ${component.originalPath}`);
        result.success = true;
        return result;
      }

      // Check if component exists in on-hold directory
      const onHoldExists = await fs.access(component.onHoldPath).then(() => true).catch(() => false);
      if (!onHoldExists) {
        result.errors.push(`On-hold file not found: ${component.onHoldPath}`);
        return result;
      }

      // Validate dependencies if requested
      if (options.validateDependencies) {
        const depValidation = await this.validateDependencies(component);
        if (!depValidation.valid && !options.force) {
          result.errors.push('Dependency validation failed');
          result.errors.push(...depValidation.missing);
          return result;
        }
        
        if (depValidation.missing.length > 0) {
          result.warnings.push(...depValidation.missing.map(dep => `Missing dependency: ${dep}`));
        }
      }

      // Check if target already exists
      const targetExists = await fs.access(component.originalPath).then(() => true).catch(() => false);
      if (targetExists && !options.force) {
        result.errors.push(`Target file already exists: ${component.originalPath}`);
        result.errors.push('Use --force to overwrite');
        return result;
      }

      // Create target directory
      await fs.mkdir(dirname(component.originalPath), { recursive: true });

      // Copy component back to original location
      await fs.copyFile(component.onHoldPath, component.originalPath);
      console.log(`✅ Restored: ${component.originalPath}`);

      // Restore dependencies if requested
      if (options.restoreDependencies) {
        const depResults = await this.restoreDependencies(component, options);
        result.dependencies = depResults.restored;
        result.warnings.push(...depResults.warnings);
        result.errors.push(...depResults.errors);
      }

      // Run post-restoration validation
      const validation = await this.validateRestoration(component);
      if (!validation.success) {
        result.warnings.push(...validation.warnings);
        if (validation.critical) {
          result.errors.push(...validation.errors);
        }
      }

      result.success = true;
      console.log(`✅ Component restoration completed: ${component.originalPath}`);

    } catch (error) {
      result.errors.push(`Restoration failed: ${error}`);
      console.error(`❌ Failed to restore component:`, error);
    }

    return result;
  }

  /**
   * Restore multiple components by priority
   */
  async restoreByPriority(count: number = 5, options: {
    dryRun?: boolean;
    force?: boolean;
    validateDependencies?: boolean;
  } = {}): Promise<RestorationResult[]> {
    console.log(`🔄 Restoring top ${count} priority on-hold components...`);
    
    const components = await this.listOnHoldComponents();
    const sortedComponents = components
      .sort((a, b) => b.priority - a.priority)
      .slice(0, count);

    const results: RestorationResult[] = [];

    for (const component of sortedComponents) {
      console.log(`\n📦 Processing: ${component.originalPath} (Priority: ${component.priority})`);
      
      const result = await this.restoreComponent(component.originalPath, options);
      results.push(result);

      if (!result.success && !options.force) {
        console.log(`⚠️ Stopping due to failure. Use --force to continue.`);
        break;
      }
    }

    return results;
  }

  /**
   * Generate restoration report
   */
  async generateRestorationReport(): Promise<{
    totalOnHold: number;
    byRiskLevel: Record<string, number>;
    byOrigin: Record<string, number>;
    highPriorityComponents: OnHoldComponent[];
    restorationRecommendations: string[];
  }> {
    const components = await this.listOnHoldComponents();
    
    const byRiskLevel: Record<string, number> = {};
    const byOrigin: Record<string, number> = {};
    
    components.forEach(c => {
      byRiskLevel[c.riskLevel] = (byRiskLevel[c.riskLevel] || 0) + 1;
      byOrigin[c.origin] = (byOrigin[c.origin] || 0) + 1;
    });

    const highPriorityComponents = components
      .filter(c => c.priority >= 80)
      .sort((a, b) => b.priority - a.priority);

    const restorationRecommendations = [
      `Start with ${highPriorityComponents.length} high-priority components (priority >= 80)`,
      `Review ${components.filter(c => c.riskLevel === 'critical').length} critical risk components carefully`,
      `Consider batch restoration for ${components.filter(c => c.riskLevel === 'low').length} low-risk components`,
      `Validate backend dependencies for ${components.filter(c => c.backendDependencies.length > 0).length} components with backend deps`
    ];

    return {
      totalOnHold: components.length,
      byRiskLevel,
      byOrigin,
      highPriorityComponents,
      restorationRecommendations
    };
  }

  // Private helper methods

  private async validateDependencies(component: OnHoldComponent): Promise<{
    valid: boolean;
    missing: string[];
  }> {
    const missing: string[] = [];

    for (const dep of component.dependencies) {
      if (dep.startsWith('@/')) {
        const depPath = dep.replace('@/', 'src/');
        const exists = await fs.access(depPath).then(() => true).catch(() => false);
        if (!exists) {
          missing.push(dep);
        }
      }
    }

    return {
      valid: missing.length === 0,
      missing
    };
  }

  private async restoreDependencies(component: OnHoldComponent, options: any): Promise<{
    restored: string[];
    warnings: string[];
    errors: string[];
  }> {
    const restored: string[] = [];
    const warnings: string[] = [];
    const errors: string[] = [];

    for (const dep of component.dependencies) {
      if (dep.startsWith('@/')) {
        const depPath = dep.replace('@/', 'src/');
        
        try {
          const depResult = await this.restoreComponent(depPath, {
            ...options,
            restoreDependencies: false // Prevent infinite recursion
          });
          
          if (depResult.success) {
            restored.push(depPath);
          } else {
            warnings.push(`Failed to restore dependency: ${depPath}`);
          }
        } catch (error) {
          errors.push(`Error restoring dependency ${depPath}: ${error}`);
        }
      }
    }

    return { restored, warnings, errors };
  }

  private async validateRestoration(component: OnHoldComponent): Promise<{
    success: boolean;
    warnings: string[];
    errors: string[];
    critical: boolean;
  }> {
    const warnings: string[] = [];
    const errors: string[] = [];
    let critical = false;

    try {
      // Check if file was actually restored
      const exists = await fs.access(component.originalPath).then(() => true).catch(() => false);
      if (!exists) {
        errors.push('File was not successfully restored');
        critical = true;
      }

      // Try TypeScript compilation (non-blocking)
      try {
        execSync('npx tsc --noEmit', { stdio: 'pipe' });
      } catch (error) {
        warnings.push('TypeScript compilation issues detected');
      }

      // Check for import errors (basic syntax check)
      if (component.originalPath.endsWith('.tsx') || component.originalPath.endsWith('.ts')) {
        try {
          const content = await fs.readFile(component.originalPath, 'utf-8');
          const importLines = content.split('\n').filter(line => line.trim().startsWith('import'));
          
          for (const importLine of importLines) {
            if (importLine.includes('@/')) {
              const match = importLine.match(/@\/([^'"]+)/);
              if (match) {
                const importPath = `src/${match[1]}`;
                const exists = await fs.access(importPath).then(() => true).catch(() => false);
                if (!exists) {
                  warnings.push(`Import may be broken: ${match[0]}`);
                }
              }
            }
          }
        } catch (error) {
          warnings.push('Could not validate imports');
        }
      }

    } catch (error) {
      errors.push(`Validation error: ${error}`);
    }

    return {
      success: errors.length === 0,
      warnings,
      errors,
      critical
    };
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  const archiveDir = args.find(arg => arg.startsWith('--archive='))?.split('=')[1] || 
                     'src/archive/consolidated-legacy-archive-2025-09-18';
  
  const restorer = new OnHoldComponentRestorer(archiveDir);
  await restorer.initialize();
  
  switch (command) {
    case 'list':
      const filter: any = {};
      
      // Parse filters
      args.forEach(arg => {
        if (arg.startsWith('--risk=')) filter.riskLevel = arg.split('=')[1];
        if (arg.startsWith('--origin=')) filter.origin = arg.split('=')[1];
        if (arg.startsWith('--pattern=')) filter.pathPattern = arg.split('=')[1];
        if (arg === '--has-backend-deps') filter.hasBackendDeps = true;
        if (arg === '--no-backend-deps') filter.hasBackendDeps = false;
      });
      
      const components = await restorer.listOnHoldComponents(filter);
      console.log(`\nFound ${components.length} on-hold components:`);
      
      components.forEach(c => {
        console.log(`  ${c.originalPath}`);
        console.log(`    Risk: ${c.riskLevel}, Origin: ${c.origin}, Priority: ${c.priority}`);
        console.log(`    Dependencies: ${c.dependencies.length}, Backend: ${c.backendDependencies.length}`);
        console.log(`    Reason: ${c.holdReason}`);
        console.log();
      });
      break;
      
    case 'restore':
      const componentPath = args[1];
      if (!componentPath) {
        console.error('❌ Component path required');
        process.exit(1);
      }
      
      const restoreOptions = {
        dryRun: args.includes('--dry-run'),
        force: args.includes('--force'),
        validateDependencies: args.includes('--validate-deps'),
        restoreDependencies: args.includes('--restore-deps')
      };
      
      const result = await restorer.restoreComponent(componentPath, restoreOptions);
      
      if (result.success) {
        console.log(`✅ Restoration successful`);
        if (result.dependencies.length > 0) {
          console.log(`📦 Dependencies restored: ${result.dependencies.length}`);
        }
      } else {
        console.log(`❌ Restoration failed`);
        result.errors.forEach(error => console.log(`   Error: ${error}`));
      }
      
      if (result.warnings.length > 0) {
        console.log(`⚠️ Warnings:`);
        result.warnings.forEach(warning => console.log(`   ${warning}`));
      }
      break;
      
    case 'restore-priority':
      const count = parseInt(args[1]) || 5;
      const priorityOptions = {
        dryRun: args.includes('--dry-run'),
        force: args.includes('--force'),
        validateDependencies: args.includes('--validate-deps')
      };
      
      const results = await restorer.restoreByPriority(count, priorityOptions);
      
      console.log(`\n📊 Restoration Summary:`);
      console.log(`  Attempted: ${results.length}`);
      console.log(`  Successful: ${results.filter(r => r.success).length}`);
      console.log(`  Failed: ${results.filter(r => !r.success).length}`);
      break;
      
    case 'report':
      const report = await restorer.generateRestorationReport();
      
      console.log('\n📊 On-Hold Components Report:');
      console.log(`Total Components: ${report.totalOnHold}`);
      
      console.log('\nBy Risk Level:');
      Object.entries(report.byRiskLevel).forEach(([level, count]) => {
        console.log(`  ${level}: ${count}`);
      });
      
      console.log('\nBy Origin:');
      Object.entries(report.byOrigin).forEach(([origin, count]) => {
        console.log(`  ${origin}: ${count}`);
      });
      
      console.log(`\nHigh Priority Components (${report.highPriorityComponents.length}):`);
      report.highPriorityComponents.slice(0, 10).forEach(c => {
        console.log(`  ${c.originalPath} (Priority: ${c.priority})`);
      });
      
      console.log('\nRecommendations:');
      report.restorationRecommendations.forEach(rec => {
        console.log(`  • ${rec}`);
      });
      break;
      
    default:
      console.log(`
On-Hold Component Restorer - Usage:

  npx tsx scripts/restore-onhold-component.ts <command> [options]

Commands:
  list [filters]                  List on-hold components
  restore <path> [options]        Restore single component
  restore-priority <count>        Restore top priority components
  report                          Generate restoration report

List Filters:
  --risk=<level>                  Filter by risk level (low, medium, high, critical)
  --origin=<origin>               Filter by origin (lovable, supabase, kiro, unknown)
  --pattern=<regex>               Filter by path pattern
  --has-backend-deps              Components with backend dependencies
  --no-backend-deps               Components without backend dependencies

Restore Options:
  --dry-run                       Show what would be restored
  --force                         Force restoration (overwrite existing)
  --validate-deps                 Validate dependencies before restoration
  --restore-deps                  Also restore missing dependencies

Global Options:
  --archive=<path>                Archive directory path

Examples:
  npx tsx scripts/restore-onhold-component.ts list --risk=high
  npx tsx scripts/restore-onhold-component.ts restore src/components/auth/LoginForm.tsx --dry-run
  npx tsx scripts/restore-onhold-component.ts restore src/pages/Dashboard.tsx --validate-deps --restore-deps
  npx tsx scripts/restore-onhold-component.ts restore-priority 10 --force
  npx tsx scripts/restore-onhold-component.ts report
      `);
  }
}

// Check if this file is being run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { OnHoldComponentRestorer, OnHoldComponent, RestorationResult };