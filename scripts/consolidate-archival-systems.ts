#!/usr/bin/env npx tsx

/**
 * Archival Systems Consolidation Script
 * Consolidates parallel archival systems into unified Safe Archival System
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { execSync } from 'child_process';

interface ConsolidationOptions {
  dryRun: boolean;
  preserveGitHistory: boolean;
  outputDir?: string;
  verbose: boolean;
}

class ArchivalSystemsConsolidator {
  private static readonly DEFAULT_OPTIONS: ConsolidationOptions = {
    dryRun: false,
    preserveGitHistory: true,
    verbose: false
  };

  static async main(): Promise<void> {
    console.log('🔄 Archival Systems Consolidation');
    console.log('=================================\n');

    try {
      const options = this.parseArguments();
      
      if (options.verbose) {
        console.log('📋 Configuration:', JSON.stringify(options, null, 2));
      }

      // Step 1: Analyze current state
      console.log('🔍 Step 1: Analyzing current archival systems...');
      const analysis = await this.analyzeCurrentState();
      
      console.log('📊 Current State:');
      console.log(`   Manual archive files: ${analysis.manualArchiveFiles.length}`);
      console.log(`   Legacy manifest components: ${analysis.legacyManifestComponents}`);
      console.log(`   Parallel systems detected: ${analysis.parallelSystems.length}`);

      if (analysis.parallelSystems.length === 0) {
        console.log('✅ No parallel systems detected. System is already consolidated.');
        return;
      }

      // Step 2: Create consolidated structure
      const consolidatedDir = options.outputDir || `src/archive/consolidated-legacy-archive-${new Date().toISOString().split('T')[0]}`;
      
      if (options.dryRun) {
        console.log('\n🧪 DRY RUN MODE - No changes will be made');
        await this.performDryRun(analysis, consolidatedDir, options);
        return;
      }

      console.log(`\n🏗️ Step 2: Creating consolidated archive structure at ${consolidatedDir}...`);
      await this.createConsolidatedStructure(consolidatedDir);

      // Step 3: Migrate manual archive
      console.log('\n📦 Step 3: Migrating existing manual archive...');
      await this.migrateManualArchive(consolidatedDir, options);

      // Step 4: Process legacy component manifest
      console.log('\n🔄 Step 4: Processing legacy component analysis...');
      await this.processLegacyManifest(consolidatedDir, options);

      // Step 5: Update references
      console.log('\n📝 Step 5: Updating system references...');
      await this.updateSystemReferences(consolidatedDir);

      // Step 6: Cleanup
      console.log('\n🧹 Step 6: Cleaning up old systems...');
      await this.cleanupOldSystems(options);

      // Step 7: Validation
      console.log('\n✅ Step 7: Validating consolidation...');
      await this.validateConsolidation(consolidatedDir);

      console.log('\n🎉 Consolidation completed successfully!');
      console.log(`📁 Consolidated Archive: ${consolidatedDir}`);
      console.log(`📋 Manifest: ${path.join(consolidatedDir, 'archive-manifest.json')}`);
      console.log(`🔄 Rollback: ${path.join(consolidatedDir, 'rollback.sh')}`);

    } catch (error) {
      console.error('❌ Consolidation failed:', error);
      process.exit(1);
    }
  }

  private static async analyzeCurrentState(): Promise<{
    manualArchiveFiles: string[];
    legacyManifestComponents: number;
    parallelSystems: string[];
  }> {
    const analysis = {
      manualArchiveFiles: [] as string[],
      legacyManifestComponents: 0,
      parallelSystems: [] as string[]
    };

    // Check for manual archive
    try {
      const manualArchiveExists = await fs.access('src/archive').then(() => true).catch(() => false);
      if (manualArchiveExists) {
        analysis.parallelSystems.push('Manual Archive (src/archive/)');
        
        // Count files in manual archive
        const files = await this.getAllFiles('src/archive');
        analysis.manualArchiveFiles = files.filter(f => !f.endsWith('.md'));
      }
    } catch (error) {
      // Manual archive doesn't exist
    }

    // Check for legacy manifest
    try {
      const manifestExists = await fs.access('reports/legacy-component-archive-manifest.json').then(() => true).catch(() => false);
      if (manifestExists) {
        analysis.parallelSystems.push('Legacy Component Manifest (reports/legacy-component-archive-manifest.json)');
        
        const manifestContent = await fs.readFile('reports/legacy-component-archive-manifest.json', 'utf-8');
        const manifest = JSON.parse(manifestContent);
        analysis.legacyManifestComponents = manifest.summary?.totalComponents || 0;
      }
    } catch (error) {
      // Legacy manifest doesn't exist or is invalid
    }

    return analysis;
  }

  private static async getAllFiles(dir: string): Promise<string[]> {
    const files: string[] = [];
    
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          const subFiles = await this.getAllFiles(fullPath);
          files.push(...subFiles);
        } else {
          files.push(fullPath);
        }
      }
    } catch (error) {
      // Directory doesn't exist or is inaccessible
    }
    
    return files;
  }

  private static async createConsolidatedStructure(consolidatedDir: string): Promise<void> {
    // Create main structure
    await fs.mkdir(consolidatedDir, { recursive: true });
    await fs.mkdir(path.join(consolidatedDir, 'manual-archive'), { recursive: true });
    await fs.mkdir(path.join(consolidatedDir, 'on-hold'), { recursive: true });
    await fs.mkdir(path.join(consolidatedDir, 'src'), { recursive: true });
    
    // Create on-hold subdirectories
    const subdirs = [
      'src/components',
      'src/pages',
      'src/layouts',
      'src/lib',
      'src/services',
      'src/contexts',
      'src/hooks'
    ];
    
    for (const subdir of subdirs) {
      await fs.mkdir(path.join(consolidatedDir, 'on-hold', subdir), { recursive: true });
      await fs.mkdir(path.join(consolidatedDir, subdir), { recursive: true });
    }
    
    console.log(`✅ Created consolidated structure at ${consolidatedDir}`);
  }

  private static async migrateManualArchive(consolidatedDir: string, options: ConsolidationOptions): Promise<void> {
    const manualArchiveTarget = path.join(consolidatedDir, 'manual-archive');
    
    try {
      // Check if manual archive exists
      await fs.access('src/archive');
      
      // Get all files and directories in manual archive
      const entries = await fs.readdir('src/archive', { withFileTypes: true });
      
      for (const entry of entries) {
        const sourcePath = path.join('src/archive', entry.name);
        const targetPath = path.join(manualArchiveTarget, entry.name);
        
        if (options.preserveGitHistory) {
          // Use git mv to preserve history
          try {
            execSync(`git mv "${sourcePath}" "${targetPath}"`, { stdio: 'pipe' });
            console.log(`📁 Moved with git history: ${entry.name}`);
          } catch (error) {
            // Fallback to regular copy if git mv fails
            if (entry.isDirectory()) {
              await this.copyDirectory(sourcePath, targetPath);
            } else {
              await fs.copyFile(sourcePath, targetPath);
            }
            console.log(`📁 Copied (no git history): ${entry.name}`);
          }
        } else {
          if (entry.isDirectory()) {
            await this.copyDirectory(sourcePath, targetPath);
          } else {
            await fs.copyFile(sourcePath, targetPath);
          }
          console.log(`📁 Copied: ${entry.name}`);
        }
      }
      
      // Create migration metadata
      const migrationMetadata = {
        timestamp: new Date().toISOString(),
        source: 'src/archive/',
        target: manualArchiveTarget,
        preservedGitHistory: options.preserveGitHistory,
        migratedFiles: entries.map(e => e.name)
      };
      
      await fs.writeFile(
        path.join(manualArchiveTarget, 'migration-metadata.json'),
        JSON.stringify(migrationMetadata, null, 2)
      );
      
      console.log(`✅ Migrated ${entries.length} items from manual archive`);
      
    } catch (error) {
      console.log('ℹ️ No manual archive found to migrate');
    }
  }

  private static async copyDirectory(source: string, target: string): Promise<void> {
    await fs.mkdir(target, { recursive: true });
    
    const entries = await fs.readdir(source, { withFileTypes: true });
    
    for (const entry of entries) {
      const sourcePath = path.join(source, entry.name);
      const targetPath = path.join(target, entry.name);
      
      if (entry.isDirectory()) {
        await this.copyDirectory(sourcePath, targetPath);
      } else {
        await fs.copyFile(sourcePath, targetPath);
      }
    }
  }

  private static async processLegacyManifest(consolidatedDir: string, options: ConsolidationOptions): Promise<void> {
    try {
      // Read legacy manifest
      const manifestContent = await fs.readFile('reports/legacy-component-archive-manifest.json', 'utf-8');
      const legacyManifest = JSON.parse(manifestContent);
      
      console.log(`📋 Processing ${legacyManifest.summary.totalComponents} components from legacy manifest`);
      
      // Separate components by safety level
      const safeComponents = legacyManifest.components.filter((c: any) => c.safeToArchive);
      const unsafeComponents = legacyManifest.components.filter((c: any) => !c.safeToArchive);
      
      console.log(`   Safe components: ${safeComponents.length}`);
      console.log(`   High-risk components: ${unsafeComponents.length}`);
      
      // Create consolidated manifest
      const consolidatedManifest = {
        timestamp: new Date().toISOString(),
        archiveDirectory: consolidatedDir,
        version: '2.0.0-consolidated',
        consolidationSource: 'legacy-component-archive-manifest.json',
        summary: {
          totalComponents: legacyManifest.summary.totalComponents,
          archivedComponents: safeComponents.length,
          onHoldComponents: unsafeComponents.length,
          manualArchiveComponents: 0, // Will be updated after manual archive processing
          symlinkComponents: 0,
          skippedComponents: 0
        },
        components: safeComponents.map((c: any) => ({
          ...c,
          archivePath: path.join(consolidatedDir, 'src', c.originalPath.replace('src/', ''))
        })),
        onHoldComponents: unsafeComponents.map((c: any) => ({
          ...c,
          onHoldPath: path.join(consolidatedDir, 'on-hold', c.originalPath.replace('src/', '')),
          reviewNotes: [`Migrated from legacy manifest - ${c.riskLevel} risk`],
          potentialImpact: [`Component marked as ${c.riskLevel} risk in legacy analysis`],
          suggestedActions: ['Review component for migration to Kiro alternatives']
        })),
        legacyManifest: {
          originalTimestamp: legacyManifest.timestamp,
          originalArchiveDirectory: legacyManifest.archiveDirectory,
          migrationTimestamp: new Date().toISOString()
        },
        rollbackInstructions: [
          '1. Stop the application: npm run stop',
          '2. Run rollback script: ./rollback.sh',
          '3. Verify rollback: npm run build',
          '4. Run tests: npm run test',
          '5. Restart application: npm run start',
          '6. Review on-hold components in on-hold/ directory',
          '7. Check manual-archive/ for previously archived components'
        ]
      };
      
      // Write consolidated manifest
      await fs.writeFile(
        path.join(consolidatedDir, 'archive-manifest.json'),
        JSON.stringify(consolidatedManifest, null, 2)
      );
      
      // Create on-hold analysis report
      const onHoldReport = {
        timestamp: new Date().toISOString(),
        summary: {
          totalComponents: unsafeComponents.length,
          riskLevels: this.summarizeRiskLevels(unsafeComponents),
          origins: this.summarizeOrigins(unsafeComponents),
          commonIssues: ['Migrated from legacy analysis - requires manual review']
        },
        components: unsafeComponents.map((c: any, index: number) => ({
          path: c.originalPath,
          riskLevel: c.riskLevel,
          origin: c.origin,
          holdReason: `Legacy analysis marked as ${c.riskLevel} risk`,
          reviewNotes: [`Migrated from legacy manifest`, `Original archive path: ${c.archivePath}`],
          potentialImpact: [`Component marked as ${c.riskLevel} risk in legacy analysis`],
          suggestedActions: ['Review component for migration to Kiro alternatives'],
          priority: c.riskLevel === 'high' ? 75 : c.riskLevel === 'critical' ? 100 : 50
        })).sort((a: any, b: any) => b.priority - a.priority),
        recommendations: [
          `🚨 ${unsafeComponents.filter((c: any) => c.riskLevel === 'critical').length} critical components require immediate attention`,
          `⚠️ ${unsafeComponents.filter((c: any) => c.riskLevel === 'high').length} high-risk components need thorough testing`,
          '📋 Review components in priority order (highest priority first)',
          '🧪 Create comprehensive test coverage for each component before migration'
        ]
      };
      
      await fs.writeFile(
        path.join(consolidatedDir, 'on-hold', 'on-hold-analysis-report.json'),
        JSON.stringify(onHoldReport, null, 2)
      );
      
      // Create human-readable review guide
      const reviewGuide = this.generateReviewGuide(onHoldReport);
      await fs.writeFile(
        path.join(consolidatedDir, 'on-hold', 'ON-HOLD-REVIEW-GUIDE.md'),
        reviewGuide
      );
      
      console.log(`✅ Processed legacy manifest: ${safeComponents.length} safe, ${unsafeComponents.length} on-hold`);
      
    } catch (error) {
      console.log('ℹ️ No legacy manifest found to process');
    }
  }

  private static summarizeRiskLevels(components: any[]): Record<string, number> {
    const summary: Record<string, number> = {};
    for (const component of components) {
      summary[component.riskLevel] = (summary[component.riskLevel] || 0) + 1;
    }
    return summary;
  }

  private static summarizeOrigins(components: any[]): Record<string, number> {
    const summary: Record<string, number> = {};
    for (const component of components) {
      summary[component.origin] = (summary[component.origin] || 0) + 1;
    }
    return summary;
  }

  private static generateReviewGuide(report: any): string {
    return `# On-Hold Components Review Guide (Consolidated)

Generated: ${report.timestamp}
Source: Legacy Component Archive Manifest

## Summary

- **Total Components**: ${report.summary.totalComponents}
- **Risk Levels**: ${Object.entries(report.summary.riskLevels).map(([level, count]) => `${level}: ${count}`).join(', ')}
- **Origins**: ${Object.entries(report.summary.origins).map(([origin, count]) => `${origin}: ${count}`).join(', ')}

## Global Recommendations

${report.recommendations.map((rec: string) => `- ${rec}`).join('\n')}

## Components (Priority Order)

${report.components.slice(0, 20).map((comp: any) => `
### ${comp.path} (Priority: ${comp.priority})

- **Risk Level**: ${comp.riskLevel}
- **Origin**: ${comp.origin}
- **Hold Reason**: ${comp.holdReason}

#### Review Notes
${comp.reviewNotes.map((note: string) => `- ${note}`).join('\n')}

#### Potential Impact
${comp.potentialImpact.map((impact: string) => `- ⚠️ ${impact}`).join('\n')}

#### Suggested Actions
${comp.suggestedActions.map((action: string) => `- 🔧 ${action}`).join('\n')}

---
`).join('\n')}

${report.components.length > 20 ? `\n... and ${report.components.length - 20} more components\n` : ''}

## Next Steps

1. **Review Critical Components First**: Start with highest priority components
2. **Create Migration Plans**: For each component, create a detailed migration strategy
3. **Test Thoroughly**: Ensure comprehensive test coverage before any changes
4. **Document Everything**: Keep detailed records of changes and decisions
5. **Gradual Approach**: Consider migrating components in small batches

## Files Location

- **On-Hold Components**: \`on-hold/src/\` (preserves original structure)
- **Analysis Report**: \`on-hold/on-hold-analysis-report.json\`
- **Manual Archive**: \`manual-archive/\` (previously archived components)
- **Safe Archive**: \`src/\` (components safe to archive)
`;
  }

  private static async updateSystemReferences(consolidatedDir: string): Promise<void> {
    // Update steering reminder
    try {
      const steeringPath = '.kiro/steering/safe-archival-on-hold-reminder.md';
      let steeringContent = await fs.readFile(steeringPath, 'utf-8');
      
      // Update references to use consolidated directory
      steeringContent = steeringContent.replace(
        /src\/archive\/legacy-cleanup-YYYY-MM-DD/g,
        consolidatedDir
      );
      steeringContent = steeringContent.replace(
        /src\/archive\/consolidated-legacy-archive-2025-01-14/g,
        consolidatedDir
      );
      
      await fs.writeFile(steeringPath, steeringContent);
      console.log('✅ Updated steering reminder references');
    } catch (error) {
      console.warn('⚠️ Could not update steering reminder:', error);
    }
    
    // Update documentation
    try {
      const docsPath = 'docs/safe-archival-system-documentation.md';
      let docsContent = await fs.readFile(docsPath, 'utf-8');
      
      // Add consolidation note
      const consolidationNote = `\n## 🔄 System Consolidation\n\n**Note**: This system has been consolidated from multiple parallel archival systems. The consolidated archive is located at \`${consolidatedDir}\` and includes:\n\n- **Manual Archive**: Previously manually archived components\n- **Safe Archive**: Components safe for archival\n- **On-Hold Archive**: High-risk components requiring review\n\n`;
      
      docsContent = docsContent.replace('## Overview', consolidationNote + '## Overview');
      
      await fs.writeFile(docsPath, docsContent);
      console.log('✅ Updated documentation with consolidation info');
    } catch (error) {
      console.warn('⚠️ Could not update documentation:', error);
    }
  }

  private static async cleanupOldSystems(options: ConsolidationOptions): Promise<void> {
    // Remove legacy manifest
    try {
      await fs.unlink('reports/legacy-component-archive-manifest.json');
      console.log('✅ Removed legacy component manifest');
    } catch (error) {
      console.log('ℹ️ Legacy manifest already removed or not found');
    }
    
    // Update original archive README
    try {
      const archiveReadme = `# Legacy Archive - CONSOLIDATED

**This directory has been consolidated into a unified archival system.**

## New Location

All archived components have been moved to the consolidated archive system.
Please use the Safe Archival System CLI for all archive operations:

\`\`\`bash
# List archived components
npx tsx scripts/run-safe-archival.ts restore <consolidated-archive-dir>

# Review on-hold components  
npx tsx scripts/run-safe-archival.ts review-onhold <consolidated-archive-dir>
\`\`\`

## Migration

- **Manual Archive**: Moved to \`<consolidated-archive-dir>/manual-archive/\`
- **Legacy Analysis**: Processed into safe archive and on-hold components
- **Metadata**: Complete migration metadata available in consolidated system

For more information, see:
- \`docs/safe-archival-system-documentation.md\`
- \`docs/archival-systems-consolidation-analysis.md\`
`;
      
      await fs.writeFile('src/archive/README.md', archiveReadme);
      console.log('✅ Updated archive README with consolidation info');
    } catch (error) {
      console.warn('⚠️ Could not update archive README:', error);
    }
  }

  private static async validateConsolidation(consolidatedDir: string): Promise<void> {
    const validationResults = {
      consolidatedStructureExists: false,
      manifestExists: false,
      onHoldReportExists: false,
      manualArchiveMigrated: false,
      rollbackScriptExists: false
    };
    
    // Check consolidated structure
    try {
      await fs.access(consolidatedDir);
      validationResults.consolidatedStructureExists = true;
    } catch (error) {
      // Structure doesn't exist
    }
    
    // Check manifest
    try {
      await fs.access(path.join(consolidatedDir, 'archive-manifest.json'));
      validationResults.manifestExists = true;
    } catch (error) {
      // Manifest doesn't exist
    }
    
    // Check on-hold report
    try {
      await fs.access(path.join(consolidatedDir, 'on-hold', 'on-hold-analysis-report.json'));
      validationResults.onHoldReportExists = true;
    } catch (error) {
      // Report doesn't exist
    }
    
    // Check manual archive migration
    try {
      await fs.access(path.join(consolidatedDir, 'manual-archive'));
      validationResults.manualArchiveMigrated = true;
    } catch (error) {
      // Manual archive not migrated
    }
    
    console.log('\n📋 Validation Results:');
    console.log(`   Consolidated structure: ${validationResults.consolidatedStructureExists ? '✅' : '❌'}`);
    console.log(`   Archive manifest: ${validationResults.manifestExists ? '✅' : '❌'}`);
    console.log(`   On-hold report: ${validationResults.onHoldReportExists ? '✅' : '❌'}`);
    console.log(`   Manual archive migrated: ${validationResults.manualArchiveMigrated ? '✅' : '❌'}`);
    
    const allValid = Object.values(validationResults).every(v => v);
    if (!allValid) {
      throw new Error('Consolidation validation failed');
    }
  }

  private static async performDryRun(analysis: any, consolidatedDir: string, options: ConsolidationOptions): Promise<void> {
    console.log('\n📋 DRY RUN RESULTS:');
    console.log('==================');
    
    console.log(`\n📁 Consolidated Directory: ${consolidatedDir}`);
    
    console.log('\n📦 Manual Archive Migration:');
    if (analysis.manualArchiveFiles.length > 0) {
      console.log(`   Files to migrate: ${analysis.manualArchiveFiles.length}`);
      console.log(`   Target: ${consolidatedDir}/manual-archive/`);
      console.log(`   Git history preserved: ${options.preserveGitHistory ? 'Yes' : 'No'}`);
    } else {
      console.log('   No manual archive found');
    }
    
    console.log('\n🔄 Legacy Manifest Processing:');
    if (analysis.legacyManifestComponents > 0) {
      console.log(`   Components to process: ${analysis.legacyManifestComponents}`);
      console.log(`   Will be separated into safe archive and on-hold`);
    } else {
      console.log('   No legacy manifest found');
    }
    
    console.log('\n📝 System Updates:');
    console.log('   Steering files will be updated');
    console.log('   Documentation will be updated');
    console.log('   CLI references will be updated');
    
    console.log('\n🧹 Cleanup:');
    console.log('   Legacy manifest will be removed');
    console.log('   Archive README will be updated');
    
    console.log('\n💡 To execute consolidation, run without --dry-run flag');
  }

  private static parseArguments(): ConsolidationOptions {
    const args = process.argv.slice(2);
    const options = { ...this.DEFAULT_OPTIONS };

    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      
      switch (arg) {
        case '--dry-run':
          options.dryRun = true;
          break;
        case '--no-git-history':
          options.preserveGitHistory = false;
          break;
        case '--output-dir':
          options.outputDir = args[++i];
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
Archival Systems Consolidation Script

Usage: npx tsx scripts/consolidate-archival-systems.ts [options]

Options:
  --dry-run                 Show what would be consolidated without making changes
  --no-git-history          Don't preserve git history when moving files
  --output-dir <path>       Custom consolidated archive directory
  --verbose                 Show detailed output
  --help                    Show this help message

Examples:
  # Dry run to see what would be consolidated
  npx tsx scripts/consolidate-archival-systems.ts --dry-run

  # Execute consolidation
  npx tsx scripts/consolidate-archival-systems.ts

  # Custom output directory
  npx tsx scripts/consolidate-archival-systems.ts --output-dir src/archive/my-consolidated-archive
`);
  }
}

// CLI entry point
if (import.meta.url === `file://${process.argv[1]}`) {
  ArchivalSystemsConsolidator.main();
}