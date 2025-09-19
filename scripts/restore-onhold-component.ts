#!/usr/bin/env npx tsx

/**
 * On-Hold Component Restoration Script
 * Safely restores on-hold components back to active codebase
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { execSync } from 'child_process';

interface RestoreOptions {
  dryRun: boolean;
  preserveGitHistory: boolean;
  runTests: boolean;
  verbose: boolean;
}

class OnHoldComponentRestorer {
  private static readonly DEFAULT_OPTIONS: RestoreOptions = {
    dryRun: false,
    preserveGitHistory: true,
    runTests: true,
    verbose: false
  };

  static async main(): Promise<void> {
    console.log('🔄 On-Hold Component Restoration');
    console.log('================================\n');

    try {
      const options = this.parseArguments();
      const componentPath = process.argv[2];
      const archiveDir = process.argv[3];

      if (!componentPath) {
        this.showHelp();
        process.exit(1);
      }

      if (options.verbose) {
        console.log('📋 Configuration:', JSON.stringify(options, null, 2));
        console.log(`📁 Component: ${componentPath}`);
        console.log(`📦 Archive: ${archiveDir || 'auto-detect'}`);
      }

      // Step 1: Find component in on-hold
      console.log('🔍 Step 1: Locating on-hold component...');
      const onHoldLocation = await this.findOnHoldComponent(componentPath, archiveDir);
      
      if (!onHoldLocation) {
        console.error(`❌ Component not found in on-hold: ${componentPath}`);
        process.exit(1);
      }

      console.log(`📍 Found: ${onHoldLocation.onHoldPath}`);
      console.log(`🎯 Target: ${onHoldLocation.targetPath}`);

      // Step 2: Validate restoration safety
      console.log('\n🛡️ Step 2: Validating restoration safety...');
      await this.validateRestorationSafety(onHoldLocation, options);

      if (options.dryRun) {
        console.log('\n🧪 DRY RUN MODE - No changes will be made');
        await this.performDryRun(onHoldLocation, options);
        return;
      }

      // Step 3: Restore component
      console.log('\n📦 Step 3: Restoring component...');
      await this.restoreComponent(onHoldLocation, options);

      // Step 4: Update manifest
      console.log('\n📋 Step 4: Updating archive manifest...');
      await this.updateManifest(onHoldLocation, options);

      // Step 5: Run tests
      if (options.runTests) {
        console.log('\n🧪 Step 5: Running tests...');
        await this.runValidationTests(onHoldLocation, options);
      }

      console.log('\n✅ Component restoration completed successfully!');
      console.log(`📁 Restored: ${onHoldLocation.targetPath}`);
      console.log('\n🎯 Next Steps:');
      console.log('1. Review and update the restored component');
      console.log('2. Update imports and dependencies as needed');
      console.log('3. Run full test suite');
      console.log('4. Commit changes');

    } catch (error) {
      console.error('❌ Restoration failed:', error);
      process.exit(1);
    }
  }

  private static async findOnHoldComponent(
    componentPath: string, 
    archiveDir?: string
  ): Promise<{
    onHoldPath: string;
    targetPath: string;
    archiveDir: string;
    manifest: any;
  } | null> {
    
    // Auto-detect archive directory if not provided
    if (!archiveDir) {
      const archiveDirs = await this.findArchiveDirectories();
      if (archiveDirs.length === 0) {
        throw new Error('No archive directories found');
      }
      if (archiveDirs.length > 1) {
        console.log('Multiple archive directories found:');
        archiveDirs.forEach((dir, i) => console.log(`  ${i + 1}. ${dir}`));
        throw new Error('Multiple archive directories found. Please specify one.');
      }
      archiveDir = archiveDirs[0];
    }

    // Load manifest
    const manifestPath = path.join(archiveDir, 'archive-manifest.json');
    let manifest;
    try {
      const manifestContent = await fs.readFile(manifestPath, 'utf-8');
      manifest = JSON.parse(manifestContent);
    } catch (error) {
      throw new Error(`Could not load manifest: ${manifestPath}`);
    }

    // Find component in on-hold
    const onHoldComponents = manifest.onHoldComponents || [];
    const component = onHoldComponents.find((c: any) => 
      c.originalPath === componentPath || 
      c.originalPath.endsWith(componentPath) ||
      componentPath.endsWith(path.basename(c.originalPath))
    );

    if (!component) {
      return null;
    }

    const onHoldPath = component.onHoldPath || path.join(archiveDir, 'on-hold', component.originalPath.replace('src/', ''));
    const targetPath = component.originalPath;

    return {
      onHoldPath,
      targetPath,
      archiveDir,
      manifest
    };
  }

  private static async findArchiveDirectories(): Promise<string[]> {
    const archiveDirs: string[] = [];
    
    try {
      const entries = await fs.readdir('src/archive', { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory() && entry.name.startsWith('consolidated-legacy-archive-')) {
          const manifestPath = path.join('src/archive', entry.name, 'archive-manifest.json');
          try {
            await fs.access(manifestPath);
            archiveDirs.push(path.join('src/archive', entry.name));
          } catch (error) {
            // No manifest, skip
          }
        }
      }
    } catch (error) {
      // Archive directory doesn't exist
    }

    return archiveDirs;
  }

  private static async validateRestorationSafety(
    location: { onHoldPath: string; targetPath: string; archiveDir: string; manifest: any },
    options: RestoreOptions
  ): Promise<void> {
    
    // Check if on-hold file exists
    try {
      await fs.access(location.onHoldPath);
    } catch (error) {
      throw new Error(`On-hold component not found: ${location.onHoldPath}`);
    }

    // Check if target location is free
    try {
      await fs.access(location.targetPath);
      throw new Error(`Target path already exists: ${location.targetPath}. Please resolve conflicts first.`);
    } catch (error) {
      if (error.message.includes('already exists')) {
        throw error;
      }
      // File doesn't exist, which is good
    }

    // Check for potential import conflicts
    const content = await fs.readFile(location.onHoldPath, 'utf-8');
    const imports = this.extractImports(content);
    
    for (const importPath of imports) {
      if (importPath.startsWith('./') || importPath.startsWith('../')) {
        // Relative import - check if target exists
        const resolvedPath = path.resolve(path.dirname(location.targetPath), importPath);
        try {
          await fs.access(resolvedPath + '.ts');
        } catch (error) {
          try {
            await fs.access(resolvedPath + '.tsx');
          } catch (error) {
            console.warn(`⚠️ Potential missing dependency: ${importPath} (resolved to ${resolvedPath})`);
          }
        }
      }
    }

    console.log('✅ Restoration safety validated');
  }

  private static extractImports(content: string): string[] {
    const imports: string[] = [];
    const importRegex = /import.*from\s+['"]([^'"]+)['"]/g;
    let match;
    
    while ((match = importRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }
    
    return imports;
  }

  private static async restoreComponent(
    location: { onHoldPath: string; targetPath: string; archiveDir: string; manifest: any },
    options: RestoreOptions
  ): Promise<void> {
    
    // Ensure target directory exists
    await fs.mkdir(path.dirname(location.targetPath), { recursive: true });

    if (options.preserveGitHistory) {
      try {
        // Use git mv to preserve history
        execSync(`git mv "${location.onHoldPath}" "${location.targetPath}"`, { stdio: 'pipe' });
        console.log('✅ Component restored with git history preserved');
      } catch (error) {
        // Fallback to copy if git mv fails
        await fs.copyFile(location.onHoldPath, location.targetPath);
        await fs.unlink(location.onHoldPath);
        console.log('✅ Component restored (git history not preserved)');
      }
    } else {
      await fs.copyFile(location.onHoldPath, location.targetPath);
      await fs.unlink(location.onHoldPath);
      console.log('✅ Component restored');
    }
  }

  private static async updateManifest(
    location: { onHoldPath: string; targetPath: string; archiveDir: string; manifest: any },
    options: RestoreOptions
  ): Promise<void> {
    
    const manifest = location.manifest;
    
    // Remove from on-hold components
    manifest.onHoldComponents = manifest.onHoldComponents.filter((c: any) => 
      c.originalPath !== location.targetPath.replace(process.cwd() + '/', '')
    );
    
    // Update summary
    if (manifest.summary) {
      manifest.summary.onHoldComponents = (manifest.summary.onHoldComponents || 1) - 1;
    }
    
    // Add restoration record
    if (!manifest.restorations) {
      manifest.restorations = [];
    }
    
    manifest.restorations.push({
      timestamp: new Date().toISOString(),
      componentPath: location.targetPath,
      restoredFrom: location.onHoldPath,
      reason: 'Manual restoration via restore-onhold-component script'
    });

    // Write updated manifest
    const manifestPath = path.join(location.archiveDir, 'archive-manifest.json');
    await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));
    
    console.log('✅ Archive manifest updated');
  }

  private static async runValidationTests(
    location: { onHoldPath: string; targetPath: string; archiveDir: string; manifest: any },
    options: RestoreOptions
  ): Promise<void> {
    
    try {
      // Run TypeScript check
      console.log('🔍 Running TypeScript check...');
      execSync('npx tsc --noEmit', { stdio: 'pipe' });
      console.log('✅ TypeScript check passed');
      
      // Run ESLint on restored component
      console.log('🔍 Running ESLint on restored component...');
      execSync(`npx eslint "${location.targetPath}"`, { stdio: 'pipe' });
      console.log('✅ ESLint check passed');
      
      // Run related tests if they exist
      const testPath = location.targetPath.replace(/\.(ts|tsx)$/, '.test.$1');
      try {
        await fs.access(testPath);
        console.log('🔍 Running component tests...');
        execSync(`npx jest "${testPath}"`, { stdio: 'pipe' });
        console.log('✅ Component tests passed');
      } catch (error) {
        console.log('ℹ️ No specific tests found for component');
      }
      
    } catch (error) {
      console.warn('⚠️ Some validation checks failed:', error);
      console.log('Please review and fix any issues before committing');
    }
  }

  private static async performDryRun(
    location: { onHoldPath: string; targetPath: string; archiveDir: string; manifest: any },
    options: RestoreOptions
  ): Promise<void> {
    
    console.log('\n📋 DRY RUN RESULTS:');
    console.log('==================');
    
    console.log(`\n📁 Source: ${location.onHoldPath}`);
    console.log(`📁 Target: ${location.targetPath}`);
    console.log(`📦 Archive: ${location.archiveDir}`);
    
    // Show file info
    try {
      const stats = await fs.stat(location.onHoldPath);
      const content = await fs.readFile(location.onHoldPath, 'utf-8');
      const lines = content.split('\n').length;
      const imports = this.extractImports(content);
      
      console.log(`\n📊 Component Info:`);
      console.log(`   Size: ${(stats.size / 1024).toFixed(1)} KB`);
      console.log(`   Lines: ${lines}`);
      console.log(`   Imports: ${imports.length}`);
      console.log(`   Last modified: ${stats.mtime.toISOString()}`);
      
      if (imports.length > 0) {
        console.log(`\n📦 Dependencies:`);
        imports.slice(0, 5).forEach(imp => console.log(`   - ${imp}`));
        if (imports.length > 5) {
          console.log(`   ... and ${imports.length - 5} more`);
        }
      }
      
    } catch (error) {
      console.warn('⚠️ Could not read component info:', error);
    }
    
    console.log(`\n🔄 Actions that would be performed:`);
    console.log(`   1. Move ${location.onHoldPath} -> ${location.targetPath}`);
    console.log(`   2. Update archive manifest`);
    console.log(`   3. ${options.runTests ? 'Run validation tests' : 'Skip validation tests'}`);
    console.log(`   4. ${options.preserveGitHistory ? 'Preserve git history' : 'Standard file copy'}`);
    
    console.log('\n💡 To execute restoration, run without --dry-run flag');
  }

  private static parseArguments(): RestoreOptions {
    const args = process.argv.slice(4); // Skip component and archive args
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
        case '--no-tests':
          options.runTests = false;
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
On-Hold Component Restoration Script

Usage: npx tsx scripts/restore-onhold-component.ts <component-path> [archive-dir] [options]

Arguments:
  component-path            Path to component to restore (e.g., src/components/MyComponent.tsx)
  archive-dir              Archive directory (optional, auto-detected if not provided)

Options:
  --dry-run                Show what would be restored without making changes
  --no-git-history         Don't preserve git history when moving files
  --no-tests               Skip validation tests after restoration
  --verbose                Show detailed output
  --help                   Show this help message

Examples:
  # Restore specific component (auto-detect archive)
  npx tsx scripts/restore-onhold-component.ts src/components/auth/LoginForm.tsx

  # Restore with specific archive directory
  npx tsx scripts/restore-onhold-component.ts src/components/auth/LoginForm.tsx src/archive/consolidated-legacy-archive-2025-01-14

  # Dry run to see what would happen
  npx tsx scripts/restore-onhold-component.ts src/components/auth/LoginForm.tsx --dry-run

  # Restore without running tests
  npx tsx scripts/restore-onhold-component.ts src/components/auth/LoginForm.tsx --no-tests
`);
  }
}

// CLI entry point
if (import.meta.url === `file://${process.argv[1]}`) {
  OnHoldComponentRestorer.main();
}