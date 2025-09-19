#!/usr/bin/env npx tsx

/**
 * Safe Archival System CLI
 * Command-line interface for executing safe archival with comprehensive backup and rollback
 */

import { SafeArchivalSystem, ArchivalOptions } from '../src/lib/architecture-scanner/safe-archival-system';
import { LegacyComponentDetector } from '../src/lib/architecture-scanner/legacy-component-detector';
import * as fs from 'fs/promises';
import * as path from 'path';

interface CLIOptions {
  dryRun: boolean;
  createSymlinks: boolean;
  skipValidation: boolean;
  skipRollbackScript: boolean;
  batchSize: number;
  testCommand?: string;
  outputDir?: string;
  includePatterns?: string[];
  excludePatterns?: string[];
  interactive: boolean;
  verbose: boolean;
}

class SafeArchivalCLI {
  private static readonly DEFAULT_OPTIONS: CLIOptions = {
    dryRun: false,
    createSymlinks: false,
    skipValidation: false,
    skipRollbackScript: false,
    batchSize: 10,
    testCommand: 'npm run test:quick',
    interactive: true,
    verbose: false
  };

  static async main(): Promise<void> {
    console.log('🏗️ Safe Archival System CLI');
    console.log('============================\n');

    try {
      const options = this.parseArguments();
      
      if (options.verbose) {
        console.log('📋 Configuration:', JSON.stringify(options, null, 2));
      }

      // Step 1: Scan for legacy components
      console.log('🔍 Step 1: Scanning for legacy components...');
      const archivalPlan = await LegacyComponentDetector.scanLegacyComponents({
        directories: [
          'src/pages',
          'src/components',
          'src/layouts',
          'src/lib',
          'src/services',
          'src/contexts',
          'src/hooks'
        ],
        excludePatterns: options.excludePatterns || [
          'node_modules',
          '.git',
          'dist',
          'build',
          '__tests__',
          '.test.',
          '.spec.',
          'archive',
          // Default exclusions for safer archival
          'src/pages/**', // Pages often have routing dependencies
          'src/components/**/index.ts', // Barrel files with re-exports
          'src/lib/architecture-scanner/**', // Don't archive the archival system itself
          'src/App.tsx', // Main app component
          'src/main.tsx', // Entry point
        ]
      });

      console.log(`📊 Scan Results:`);
      console.log(`   Total components: ${archivalPlan.summary.totalComponents}`);
      console.log(`   Safe to archive: ${archivalPlan.summary.safeToArchive}`);
      console.log(`   Requires review: ${archivalPlan.summary.requiresReview}`);
      console.log(`   High risk: ${archivalPlan.summary.highRisk}`);

      if (archivalPlan.summary.safeToArchive === 0 && archivalPlan.summary.requiresReview === 0) {
        console.log('✅ No components found for archival or review.');
        return;
      }

      // Step 2: Preflight import check - filter out components with active imports
      console.log('🔍 Step 2: Running preflight import analysis...');
      const safeComponentsCandidates = archivalPlan.components.filter(c => c.safeToArchive);
      
      let safeComponents: any[] = [];
      let unsafeComponents: any[] = [];
      
      if (safeComponentsCandidates.length > 0) {
        const activeRefs = await SafeArchivalSystem.findActiveImportRefs(
          safeComponentsCandidates.map(c => c.path),
          { root: process.cwd() }
        );
        
        // Filter out components that have active imports
        const blockedPaths = new Set(activeRefs.map(ref => ref.target));
        safeComponents = safeComponentsCandidates.filter(c => {
          const relativePath = path.relative(process.cwd(), c.path).replace(/\\/g, '/');
          return !blockedPaths.has(relativePath);
        });
        
        // Move blocked components to unsafe list
        const blockedComponents = safeComponentsCandidates.filter(c => {
          const relativePath = path.relative(process.cwd(), c.path).replace(/\\/g, '/');
          return blockedPaths.has(relativePath);
        });
        
        // Update their status and reason
        blockedComponents.forEach(c => {
          c.safeToArchive = false;
          c.archiveReason = 'Blocked by active imports - requires manual review';
          c.riskLevel = 'high';
        });
        
        unsafeComponents = [
          ...archivalPlan.components.filter(c => !c.safeToArchive),
          ...blockedComponents
        ];
        
        if (activeRefs.length > 0) {
          console.log(`⚠️ Found ${activeRefs.length} active import references:`);
          activeRefs.slice(0, 5).forEach(ref => {
            console.log(`   ${ref.importer}:${ref.line} -> ${ref.target}`);
          });
          if (activeRefs.length > 5) {
            console.log(`   ... and ${activeRefs.length - 5} more`);
          }
          console.log(`📦 Moved ${blockedComponents.length} components to on-hold due to active imports`);
        }
      } else {
        safeComponents = [];
        unsafeComponents = archivalPlan.components.filter(c => !c.safeToArchive);
      }

      // Step 3: Display components to be processed

      if (safeComponents.length > 0) {
        console.log('\n📦 Components to be archived:');
        for (const component of safeComponents) {
          console.log(`   ✅ ${component.path} (${component.origin}, ${component.riskLevel} risk)`);
          if (options.verbose) {
            console.log(`      Reason: ${component.archiveReason}`);
            console.log(`      Dependencies: ${component.dependencies.length}`);
            console.log(`      Backend deps: ${component.backendDependencies.length}`);
          }
        }
      }

      if (unsafeComponents.length > 0) {
        console.log('\n🔄 Components to be placed on-hold for review:');
        for (const component of unsafeComponents) {
          console.log(`   🔄 ${component.path} (${component.origin}, ${component.riskLevel} risk)`);
          if (options.verbose) {
            console.log(`      Reason: ${component.archiveReason}`);
            console.log(`      Dependencies: ${component.dependencies.length}`);
            console.log(`      Backend deps: ${component.backendDependencies.length}`);
          }
        }
        console.log(`\n💡 On-hold components will be preserved in 'on-hold/' directory with detailed analysis`);
      }

      // Step 3: Interactive confirmation
      if (options.interactive && !options.dryRun) {
        const confirmed = await this.confirmArchival(archivalPlan);
        if (!confirmed) {
          console.log('❌ Archival cancelled by user.');
          return;
        }
      }

      // Step 4: Dry run mode
      if (options.dryRun) {
        console.log('\n🧪 DRY RUN MODE - No changes will be made');
        await this.performDryRun(archivalPlan, options);
        return;
      }

      // Step 5: Execute archival
      console.log('\n🚀 Step 2: Executing safe archival...');
      const archivalOptions: ArchivalOptions = {
        createSymlinks: options.createSymlinks,
        validateAfterArchive: !options.skipValidation,
        generateRollbackScript: !options.skipRollbackScript,
        preserveGitHistory: true,
        batchSize: options.batchSize,
        testCommand: options.testCommand
      };

      const manifest = await SafeArchivalSystem.executeArchival(archivalPlan, archivalOptions);

      // Step 6: Display results
      console.log('\n✅ Safe Archival completed successfully!');
      console.log(`📁 Archive Directory: ${manifest.archiveDirectory}`);
      console.log(`📋 Manifest: ${path.join(manifest.archiveDirectory, 'archive-manifest.json')}`);
      console.log(`🔄 Rollback Script: ${path.join(manifest.archiveDirectory, 'rollback.sh')}`);
      
      console.log('\n📊 Summary:');
      console.log(`   Archived components: ${manifest.summary.archivedComponents}`);
      console.log(`   On-hold components: ${manifest.summary.onHoldComponents}`);
      console.log(`   Symlinked components: ${manifest.summary.symlinkComponents}`);
      console.log(`   Skipped components: ${manifest.summary.skippedComponents}`);
      console.log(`   Route redirects: ${manifest.routes.length}`);
      console.log(`   Dependency mappings: ${manifest.dependencies.length}`);

      // Step 7: Next steps
      console.log('\n🎯 Next Steps:');
      console.log('1. Test your application thoroughly');
      console.log('2. Monitor for any issues in the next 24 hours');
      
      if (manifest.summary.onHoldComponents > 0) {
        console.log('3. Review on-hold components:');
        console.log(`   📖 Review guide: ${path.join(manifest.archiveDirectory, 'on-hold', 'ON-HOLD-REVIEW-GUIDE.md')}`);
        console.log(`   📋 Analysis report: ${path.join(manifest.archiveDirectory, 'on-hold', 'on-hold-analysis-report.json')}`);
        console.log('4. Create migration plans for high-priority on-hold components');
        console.log('5. If issues occur, run the rollback script:');
      } else {
        console.log('3. If issues occur, run the rollback script:');
      }
      
      console.log(`   chmod +x ${path.join(manifest.archiveDirectory, 'rollback.sh')}`);
      console.log(`   ./${path.join(manifest.archiveDirectory, 'rollback.sh')}`);
      console.log(`${manifest.summary.onHoldComponents > 0 ? '6' : '4'}. After 30 days of stable operation, consider permanent cleanup`);

    } catch (error) {
      console.error('❌ Safe Archival failed:', error);
      process.exit(1);
    }
  }

  private static parseArguments(): CLIOptions {
    const args = process.argv.slice(2);
    const options = { ...this.DEFAULT_OPTIONS };

    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      
      switch (arg) {
        case '--dry-run':
          options.dryRun = true;
          break;
        case '--create-symlinks':
          options.createSymlinks = true;
          break;
        case '--skip-validation':
          options.skipValidation = true;
          break;
        case '--skip-rollback-script':
          options.skipRollbackScript = true;
          break;
        case '--batch-size':
          options.batchSize = parseInt(args[++i]) || 10;
          break;
        case '--test-command':
          options.testCommand = args[++i];
          break;
        case '--output-dir':
          options.outputDir = args[++i];
          break;
        case '--include':
          options.includePatterns = args[++i].split(',');
          break;
        case '--exclude':
          const newExcludes = args[++i].split(',');
          options.excludePatterns = options.excludePatterns ? 
            [...options.excludePatterns, ...newExcludes] : 
            newExcludes;
          break;
        case '--non-interactive':
          options.interactive = false;
          break;
        case '--verbose':
          options.verbose = true;
          break;
        case '--help':
          this.showHelp();
          process.exit(0);
          break;
        default:
          if (arg.startsWith('--')) {
            console.warn(`⚠️ Unknown option: ${arg}`);
          }
      }
    }

    return options;
  }

  private static showHelp(): void {
    console.log(`
Safe Archival System CLI

Usage: npx tsx scripts/run-safe-archival.ts [command] [options]

Commands:
  (default)                 Execute safe archival process
  restore <archive-dir> [component-path]  Restore components from archive
  review-onhold <archive-dir>             Review on-hold components
  onhold <archive-dir>                    Alias for review-onhold

Options:
  --dry-run                 Show what would be archived without making changes
  --create-symlinks         Create symlinks for gradual transition
  --skip-validation         Skip validation checks after archival
  --skip-rollback-script    Don't generate rollback script
  --batch-size <number>     Number of components to process per batch (default: 10)
  --test-command <command>  Command to run for validation (default: npm run test:quick)
  --output-dir <path>       Custom archive directory
  --include <patterns>      Comma-separated patterns to include
  --exclude <patterns>      Comma-separated patterns to exclude
  --non-interactive         Don't prompt for confirmation
  --verbose                 Show detailed output
  --help                    Show this help message

Examples:
  # Dry run to see what would be archived and placed on-hold
  npx tsx scripts/run-safe-archival.ts --dry-run

  # Execute archival with on-hold preservation
  npx tsx scripts/run-safe-archival.ts

  # Review on-hold components with analysis
  npx tsx scripts/run-safe-archival.ts review-onhold src/archive/legacy-cleanup-2025-01-14

  # Restore specific component
  npx tsx scripts/run-safe-archival.ts restore src/archive/legacy-cleanup-2025-01-14 src/components/Component.tsx

  # Archive with symlinks for gradual transition
  npx tsx scripts/run-safe-archival.ts --create-symlinks

  # Non-interactive mode for CI/CD
  npx tsx scripts/run-safe-archival.ts --non-interactive
`);
  }

  private static async confirmArchival(plan: any): Promise<boolean> {
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });

    return new Promise((resolve) => {
      readline.question(
        `\n❓ Archive ${plan.summary.safeToArchive} components? (y/N): `,
        (answer: string) => {
          readline.close();
          resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
        }
      );
    });
  }

  private static async performDryRun(plan: any, options: CLIOptions): Promise<void> {
    console.log('\n📋 DRY RUN RESULTS:');
    console.log('==================');

    // Show archive directory that would be created
    console.log(`\n📁 Archive Directory: ${plan.backupPlan.archiveDirectory}`);

    // Show components that would be archived
    console.log('\n📦 Components to Archive:');
    const safeComponents = plan.components.filter((c: any) => c.safeToArchive);
    for (const component of safeComponents) {
      console.log(`   ✓ ${component.path}`);
      console.log(`     Origin: ${component.origin}`);
      console.log(`     Risk: ${component.riskLevel}`);
      console.log(`     Reason: ${component.archiveReason}`);
      console.log(`     Size: ${(component.fileSize / 1024).toFixed(1)} KB`);
      
      if (component.backendDependencies.length > 0) {
        console.log(`     Backend deps: ${component.backendDependencies.map((d: any) => d.name).join(', ')}`);
      }
      
      if (component.routeUsage.length > 0) {
        console.log(`     Routes: ${component.routeUsage.map((r: any) => r.route).join(', ')}`);
      }
      
      console.log('');
    }

    // Show components that would be skipped
    const unsafeComponents = plan.components.filter((c: any) => !c.safeToArchive);
    if (unsafeComponents.length > 0) {
      console.log('\n⚠️ Components Requiring Review:');
      for (const component of unsafeComponents) {
        console.log(`   ⚠️ ${component.path}`);
        console.log(`     Risk: ${component.riskLevel}`);
        console.log(`     Reason: ${component.archiveReason}`);
        console.log('');
      }
    }

    // Show estimated impact
    const totalSize = safeComponents.reduce((sum: number, c: any) => sum + c.fileSize, 0);
    console.log('\n📊 Estimated Impact:');
    console.log(`   Files to archive: ${safeComponents.length}`);
    console.log(`   Total size: ${(totalSize / 1024).toFixed(1)} KB`);
    console.log(`   Batches: ${Math.ceil(safeComponents.length / options.batchSize)}`);
    
    if (options.createSymlinks) {
      console.log(`   Symlinks to create: ${safeComponents.length}`);
    }

    // Show validation checks that would run
    if (!options.skipValidation) {
      console.log('\n🧪 Validation Checks:');
      console.log('   ✓ TypeScript compilation');
      console.log('   ✓ Build process');
      console.log('   ✓ Import resolution');
      if (options.testCommand) {
        console.log(`   ✓ Test command: ${options.testCommand}`);
      }
    }

    console.log('\n💡 To execute the archival, run without --dry-run flag');
  }

  /**
   * Restore components from archive
   */
  static async restore(archiveDir: string, componentPath?: string): Promise<void> {
    console.log('🔄 Safe Archival System - Restore');
    console.log('==================================\n');

    try {
      if (componentPath) {
        // Restore single component
        console.log(`🔄 Restoring component: ${componentPath}`);
        const success = await SafeArchivalSystem.restoreComponent(archiveDir, componentPath);
        
        if (success) {
          console.log('✅ Component restored successfully');
        } else {
          console.log('❌ Failed to restore component');
          process.exit(1);
        }
      } else {
        // List all archived components
        console.log(`📋 Listing archived components in: ${archiveDir}`);
        const components = await SafeArchivalSystem.listArchivedComponents(archiveDir);
        
        if (components.length === 0) {
          console.log('📭 No archived components found');
          return;
        }

        console.log(`\n📦 Found ${components.length} archived components:`);
        for (const component of components) {
          console.log(`   ${component.originalPath} (${component.origin}, ${component.riskLevel} risk)`);
        }

        console.log('\n💡 To restore a specific component:');
        console.log(`npx tsx scripts/run-safe-archival.ts restore ${archiveDir} <component-path>`);
      }
    } catch (error) {
      console.error('❌ Restore failed:', error);
      process.exit(1);
    }
  }

  /**
   * Review on-hold components
   */
  static async reviewOnHold(archiveDir: string): Promise<void> {
    console.log('🔄 Safe Archival System - On-Hold Review');
    console.log('========================================\n');

    try {
      // Load on-hold components
      const onHoldComponents = await SafeArchivalSystem.listOnHoldComponents(archiveDir);
      
      if (onHoldComponents.length === 0) {
        console.log('📭 No on-hold components found');
        return;
      }

      // Load analysis report
      const report = await SafeArchivalSystem.getOnHoldAnalysisReport(archiveDir);
      
      if (report) {
        console.log(`📊 On-Hold Analysis Summary:`);
        console.log(`   Total components: ${report.summary.totalComponents}`);
        console.log(`   Risk levels: ${Object.entries(report.summary.riskLevels).map(([level, count]) => `${level}: ${count}`).join(', ')}`);
        console.log(`   Origins: ${Object.entries(report.summary.origins).map(([origin, count]) => `${origin}: ${count}`).join(', ')}`);
        
        if (report.summary.commonIssues.length > 0) {
          console.log('\n🚨 Common Issues:');
          for (const issue of report.summary.commonIssues) {
            console.log(`   - ${issue}`);
          }
        }
        
        console.log('\n🎯 Global Recommendations:');
        for (const rec of report.recommendations) {
          console.log(`   - ${rec}`);
        }
      }

      console.log(`\n🔄 On-Hold Components (${onHoldComponents.length} total):`);
      
      // Show top 10 highest priority components
      const sortedComponents = onHoldComponents
        .map(c => ({ ...c, priority: this.calculateDisplayPriority(c) }))
        .sort((a, b) => b.priority - a.priority)
        .slice(0, 10);

      for (const component of sortedComponents) {
        console.log(`\n📁 ${component.originalPath}`);
        console.log(`   Risk: ${component.riskLevel} | Origin: ${component.origin} | Priority: ${component.priority}`);
        console.log(`   Reason: ${component.holdReason}`);
        
        if (component.potentialImpact.length > 0) {
          console.log(`   Impact: ${component.potentialImpact.slice(0, 2).join(', ')}${component.potentialImpact.length > 2 ? '...' : ''}`);
        }
        
        if (component.suggestedActions.length > 0) {
          console.log(`   Actions: ${component.suggestedActions.slice(0, 2).join(', ')}${component.suggestedActions.length > 2 ? '...' : ''}`);
        }
      }

      if (onHoldComponents.length > 10) {
        console.log(`\n... and ${onHoldComponents.length - 10} more components`);
      }

      console.log('\n📖 For detailed analysis:');
      console.log(`   Review guide: ${path.join(archiveDir, 'on-hold', 'ON-HOLD-REVIEW-GUIDE.md')}`);
      console.log(`   Full report: ${path.join(archiveDir, 'on-hold', 'on-hold-analysis-report.json')}`);
      
    } catch (error) {
      console.error('❌ On-hold review failed:', error);
      process.exit(1);
    }
  }

  private static calculateDisplayPriority(component: any): number {
    let priority = 0;
    
    switch (component.riskLevel) {
      case 'critical': priority += 100; break;
      case 'high': priority += 75; break;
      case 'medium': priority += 50; break;
      case 'low': priority += 25; break;
    }
    
    priority += component.backendDependencies.length * 10;
    priority += component.routeUsage.filter((r: any) => r.isActive).length * 15;
    priority += component.potentialImpact.length * 5;
    
    return priority;
  }
}

// CLI entry point
if (import.meta.url === `file://${process.argv[1]}`) {
  const command = process.argv[2];
  
  if (command === 'restore') {
    const archiveDir = process.argv[3];
    const componentPath = process.argv[4];
    
    if (!archiveDir) {
      console.error('❌ Archive directory required for restore command');
      console.log('Usage: npx tsx scripts/run-safe-archival.ts restore <archive-dir> [component-path]');
      process.exit(1);
    }
    
    SafeArchivalCLI.restore(archiveDir, componentPath);
  } else if (command === 'review-onhold' || command === 'onhold') {
    const archiveDir = process.argv[3];
    
    if (!archiveDir) {
      console.error('❌ Archive directory required for on-hold review command');
      console.log('Usage: npx tsx scripts/run-safe-archival.ts review-onhold <archive-dir>');
      process.exit(1);
    }
    
    SafeArchivalCLI.reviewOnHold(archiveDir);
  } else {
    SafeArchivalCLI.main();
  }
}