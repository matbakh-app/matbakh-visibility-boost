/**
 * Safe Archival System
 * Implements comprehensive backup creator, dependency resolver, route redirector,
 * instant rollback mechanism, and archive metadata with full restoration instructions
 * 
 * SAFE RECOVERY MODE: Archive-Only Strategy (NO DELETION)
 */

import { LegacyComponent, ArchivalPlan, BackupPlan } from './legacy-component-detector';
import * as fs from 'fs/promises';
import * as path from 'path';
import { execSync } from 'child_process';
import * as crypto from 'crypto';
import fg from 'fast-glob';

// setImmediate polyfill for JSDOM compatibility
const defer = typeof setImmediate === 'function'
  ? setImmediate
  : (fn: (...a: any[]) => void) => setTimeout(fn, 0);

export interface ArchiveManifest {
  timestamp: string;
  archiveDirectory: string;
  version: string;
  summary: {
    totalComponents: number;
    archivedComponents: number;
    symlinkComponents: number;
    skippedComponents: number;
    onHoldComponents: number;
  };
  components: ArchivedComponent[];
  onHoldComponents: OnHoldComponent[];
  dependencies: DependencyMapping[];
  routes: RouteRedirect[];
  rollbackInstructions: string[];
  validationChecks: ValidationCheck[];
}

export interface ArchivedComponent {
  originalPath: string;
  archivePath: string;
  symlinkPath?: string;
  origin: string;
  riskLevel: string;
  archiveReason: string;
  dependencies: string[];
  backendDependencies: any[];
  routeUsage: any[];
  fileSize: number;
  lastModified: string;
  checksum: string;
}

export interface OnHoldComponent {
  originalPath: string;
  onHoldPath: string;
  origin: string;
  riskLevel: string;
  holdReason: string;
  dependencies: string[];
  backendDependencies: any[];
  routeUsage: any[];
  fileSize: number;
  lastModified: string;
  checksum: string;
  reviewNotes: string[];
  potentialImpact: string[];
  suggestedActions: string[];
}

export interface DependencyMapping {
  component: string;
  dependencies: string[];
  dependents: string[];
  migrationPath?: string;
  isResolved: boolean;
}

export interface RouteRedirect {
  originalRoute: string;
  redirectTo: string;
  isActive: boolean;
  fallbackEnabled: boolean;
}

export interface ValidationCheck {
  name: string;
  description: string;
  command: string;
  expectedResult: string;
  isRequired: boolean;
}

export interface ArchivalOptions {
  createSymlinks: boolean;
  validateAfterArchive: boolean;
  generateRollbackScript: boolean;
  preserveGitHistory: boolean;
  batchSize: number;
  testCommand?: string;
}

export class SafeArchivalSystem {
  private static readonly DEFAULT_OPTIONS: ArchivalOptions = {
    createSymlinks: false,
    validateAfterArchive: true,
    generateRollbackScript: true,
    preserveGitHistory: true,
    batchSize: 10,
    testCommand: 'npm run test:quick'
  };

  private static readonly VALIDATION_CHECKS: ValidationCheck[] = [
    {
      name: 'TypeScript Compilation',
      description: 'Verify TypeScript compiles without errors',
      command: 'npx tsc --noEmit',
      expectedResult: 'exit code 0',
      isRequired: true
    },
    {
      name: 'Build Process',
      description: 'Verify application builds successfully',
      command: 'npm run build',
      expectedResult: 'exit code 0',
      isRequired: true
    },
    {
      name: 'Quick Tests',
      description: 'Run quick test suite to verify core functionality',
      command: 'npm run test:quick',
      expectedResult: 'all tests pass',
      isRequired: false
    },
    {
      name: 'Import Resolution',
      description: 'Check for broken imports after archival',
      command: 'npx eslint --ext .ts,.tsx src/ --no-eslintrc --config .eslintrc.imports.js',
      expectedResult: 'no import errors',
      isRequired: true
    }
  ];

  /**
   * Execute safe archival process with comprehensive backup and rollback
   */
  static async executeArchival(
    plan: ArchivalPlan,
    options: Partial<ArchivalOptions> = {}
  ): Promise<ArchiveManifest> {
    const opts = { ...this.DEFAULT_OPTIONS, ...options };
    
    console.log('🏗️ Starting Safe Archival System...');
    console.log(`📦 Archive Directory: ${plan.backupPlan.archiveDirectory}`);
    
    // Step 1: Create archive directory structure
    await this.createArchiveStructure(plan.backupPlan.archiveDirectory);
    
    // Step 2: Resolve dependencies to prevent breaking changes
    const dependencyMappings = await this.resolveDependencies(plan.components);
    
    // Step 3: Separate components by safety level
    const safeComponents = plan.components.filter(c => c.safeToArchive);
    const unsafeComponents = plan.components.filter(c => !c.safeToArchive);
    
    // Step 4: Create comprehensive backup for safe components
    const archivedComponents = await this.createComprehensiveBackup(
      safeComponents,
      plan.backupPlan.archiveDirectory,
      opts
    );
    
    // Step 5: Create on-hold archive for high-risk components
    const onHoldComponents = await this.createOnHoldArchive(
      unsafeComponents,
      plan.backupPlan.archiveDirectory,
      opts
    );
    
    // Step 6: Create route redirectors
    const routeRedirects = await this.createRouteRedirectors(plan.components);
    
    // Step 7: Generate archive manifest
    const manifest = await this.generateArchiveManifest(
      plan,
      archivedComponents,
      onHoldComponents,
      dependencyMappings,
      routeRedirects,
      opts
    );
    
    // Step 8: Create rollback mechanism
    if (opts.generateRollbackScript) {
      await this.createRollbackScript(manifest);
    }
    
    // Step 9: Validation gates
    if (opts.validateAfterArchive) {
      await this.runValidationChecks(manifest);
    }
    
    console.log('✅ Safe Archival System completed successfully');
    console.log(`📋 Manifest: ${path.join(plan.backupPlan.archiveDirectory, 'archive-manifest.json')}`);
    console.log(`🔄 On-Hold Components: ${onHoldComponents.length} components preserved for future review`);
    
    return manifest;
  }

  /**
   * Create archive directory structure preserving original layout
   */
  private static async createArchiveStructure(archiveDir: string): Promise<void> {
    console.log('📁 Creating archive directory structure...');
    
    await fs.mkdir(archiveDir, { recursive: true });
    
    // Create subdirectories to preserve structure
    const subdirs = [
      'src/components',
      'src/pages',
      'src/layouts',
      'src/lib',
      'src/services',
      'src/contexts',
      'src/hooks',
      'scripts',
      'docs'
    ];
    
    for (const subdir of subdirs) {
      await fs.mkdir(path.join(archiveDir, subdir), { recursive: true });
    }
    
    // Create on-hold directory structure
    const onHoldDir = path.join(archiveDir, 'on-hold');
    await fs.mkdir(onHoldDir, { recursive: true });
    
    for (const subdir of subdirs) {
      await fs.mkdir(path.join(onHoldDir, subdir), { recursive: true });
    }
    
    console.log(`✅ Archive structure created at ${archiveDir}`);
    console.log(`🔄 On-hold structure created at ${onHoldDir}`);
  }

  /**
   * Resolve dependencies to prevent breaking changes
   */
  private static async resolveDependencies(components: LegacyComponent[]): Promise<DependencyMapping[]> {
    console.log('🔗 Resolving component dependencies...');
    
    const mappings: DependencyMapping[] = [];
    
    for (const component of components) {
      const dependents = await this.findDependents(component.path, components);
      
      mappings.push({
        component: component.path,
        dependencies: component.dependencies,
        dependents: dependents.map(d => d.path),
        migrationPath: this.findMigrationPath(component),
        isResolved: this.checkDependencyResolved(component, dependents)
      });
    }
    
    // Check for circular dependencies
    const circularDeps = this.detectCircularDependencies(mappings);
    if (circularDeps.length > 0) {
      console.warn('⚠️ Circular dependencies detected:', circularDeps);
    }
    
    console.log(`✅ Resolved ${mappings.length} dependency mappings`);
    return mappings;
  }

  /**
   * Check if a component's dependencies are resolved
   */
  private static checkDependencyResolved(component: LegacyComponent, dependents: LegacyComponent[]): boolean {
    // If component has active backend dependencies, it's not resolved
    if (component.backendDependencies && component.backendDependencies.some(dep => dep.isActive)) {
      return false;
    }
    
    // If no dependents and no active backend deps, it's resolved
    if (dependents.length === 0) {
      return true;
    }
    
    // If has migration path, it's resolved
    return this.hasMigrationPath(component);
  }

  /**
   * Create on-hold archive for high-risk components
   */
  private static async createOnHoldArchive(
    components: LegacyComponent[],
    archiveDir: string,
    options: ArchivalOptions
  ): Promise<OnHoldComponent[]> {
    console.log('🔄 Creating on-hold archive for high-risk components...');
    
    const onHoldComponents: OnHoldComponent[] = [];
    const onHoldDir = path.join(archiveDir, 'on-hold');
    
    for (const component of components) {
      try {
        const onHoldComponent = await this.createOnHoldComponent(component, onHoldDir, options);
        onHoldComponents.push(onHoldComponent);
        
        console.log(`🔄 On-hold: ${component.path} (${component.riskLevel} risk)`);
        
      } catch (error) {
        console.error(`❌ Failed to create on-hold for ${component.path}:`, error);
        // Continue with other components, don't fail the entire process
      }
    }
    
    // Create on-hold analysis report
    await this.createOnHoldAnalysisReport(onHoldComponents, onHoldDir);
    
    console.log(`✅ Successfully created on-hold archive for ${onHoldComponents.length} components`);
    return onHoldComponents;
  }

  /**
   * Create comprehensive backup with checksums and metadata
   */
  private static async createComprehensiveBackup(
    components: LegacyComponent[],
    archiveDir: string,
    options: ArchivalOptions
  ): Promise<ArchivedComponent[]> {
    console.log('💾 Creating comprehensive backup...');
    
    const archivedComponents: ArchivedComponent[] = [];
    const batches = this.createBatches(components, options.batchSize);
    
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      console.log(`📦 Processing batch ${i + 1}/${batches.length} (${batch.length} components)`);
      
      for (const component of batch) {
        try {
          const archived = await this.archiveComponent(component, archiveDir, options);
          archivedComponents.push(archived);
          
          // Optional: Create symlink for gradual transition
          if (options.createSymlinks) {
            await this.createSymlink(archived);
          }
          
        } catch (error) {
          console.error(`❌ Failed to archive ${component.path}:`, error);
          throw new Error(`Archival failed for ${component.path}: ${error}`);
        }
      }
      
      // Validation gate after each batch
      if (options.validateAfterArchive && options.testCommand) {
        console.log('🧪 Running validation checks after batch...');
        try {
          await this.runValidationChecks({
            root: process.cwd(),
            archived: batch.map(c => c.path),
            testCommand: options.testCommand
          });
          console.log('✅ Batch validation passed');
        } catch (error) {
          console.error('❌ Batch validation failed, initiating rollback...');
          console.error(`Validation error: ${error.message}`);
          await this.rollbackBatch(archivedComponents.slice(-batch.length));
          throw new Error(`Validation failed after batch ${i + 1}: ${error.message}`);
        }
      }
    }
    
    console.log(`✅ Successfully archived ${archivedComponents.length} components`);
    return archivedComponents;
  }

  /**
   * Create on-hold component with analysis and recommendations
   */
  private static async createOnHoldComponent(
    component: LegacyComponent,
    onHoldDir: string,
    options: ArchivalOptions
  ): Promise<OnHoldComponent> {
    const onHoldPath = path.join(onHoldDir, component.path);
    
    // Ensure on-hold directory exists
    await fs.mkdir(path.dirname(onHoldPath), { recursive: true });
    
    // Copy file to on-hold archive
    await fs.copyFile(component.path, onHoldPath);
    
    // Generate checksum for integrity verification
    const content = await fs.readFile(component.path, 'utf-8');
    const checksum = this.generateChecksum(content);
    
    // Analyze component for review notes and suggestions
    const analysis = await this.analyzeHighRiskComponent(component, content);
    
    return {
      originalPath: component.path,
      onHoldPath,
      origin: component.origin,
      riskLevel: component.riskLevel,
      holdReason: component.archiveReason,
      dependencies: component.dependencies,
      backendDependencies: component.backendDependencies,
      routeUsage: component.routeUsage,
      fileSize: component.fileSize,
      lastModified: component.lastModified.toISOString(),
      checksum,
      reviewNotes: analysis.reviewNotes,
      potentialImpact: analysis.potentialImpact,
      suggestedActions: analysis.suggestedActions
    };
  }

  /**
   * Analyze high-risk component for detailed review information
   */
  private static async analyzeHighRiskComponent(
    component: LegacyComponent,
    content: string
  ): Promise<{
    reviewNotes: string[];
    potentialImpact: string[];
    suggestedActions: string[];
  }> {
    const reviewNotes: string[] = [];
    const potentialImpact: string[] = [];
    const suggestedActions: string[] = [];

    // Analyze backend dependencies
    if (component.backendDependencies.length > 0) {
      reviewNotes.push(`Has ${component.backendDependencies.length} backend dependencies`);
      
      for (const dep of component.backendDependencies) {
        if (dep.isActive && !dep.migrationPath) {
          potentialImpact.push(`Active ${dep.type} dependency '${dep.name}' without migration path`);
          suggestedActions.push(`Create migration path for ${dep.name} dependency`);
        }
      }
    }

    // Analyze route usage
    if (component.routeUsage.length > 0) {
      reviewNotes.push(`Used in ${component.routeUsage.length} routes`);
      
      for (const route of component.routeUsage) {
        if (route.isActive && !route.hasKiroAlternative) {
          potentialImpact.push(`Active route '${route.route}' without Kiro alternative`);
          suggestedActions.push(`Create Kiro alternative for route ${route.route}`);
        }
      }
    }

    // Analyze code complexity
    const lines = content.split('\n').length;
    const functions = (content.match(/function|const.*=.*=>/g) || []).length;
    const imports = (content.match(/import.*from/g) || []).length;
    
    if (lines > 200) {
      reviewNotes.push(`Large component (${lines} lines)`);
      potentialImpact.push('Complex component may have hidden dependencies');
      suggestedActions.push('Break down into smaller components before migration');
    }

    if (functions > 10) {
      reviewNotes.push(`High function count (${functions} functions)`);
      potentialImpact.push('Multiple functions may have different migration requirements');
      suggestedActions.push('Analyze each function individually for migration strategy');
    }

    if (imports > 15) {
      reviewNotes.push(`Many dependencies (${imports} imports)`);
      potentialImpact.push('Complex dependency tree may cause cascading issues');
      suggestedActions.push('Map all dependencies and their migration status');
    }

    // Analyze critical patterns
    const criticalPatterns = [
      { pattern: /auth\./i, impact: 'Authentication logic may affect user access', action: 'Verify auth flow compatibility' },
      { pattern: /database|db\./i, impact: 'Database operations may affect data integrity', action: 'Test database operations thoroughly' },
      { pattern: /payment|billing/i, impact: 'Payment logic may affect revenue', action: 'Extensive payment flow testing required' },
      { pattern: /admin|superuser/i, impact: 'Admin functionality may affect system management', action: 'Verify admin capabilities are preserved' },
      { pattern: /api\.|fetch\(/i, impact: 'API calls may fail with backend changes', action: 'Update API endpoints and test integration' }
    ];

    for (const { pattern, impact, action } of criticalPatterns) {
      if (pattern.test(content)) {
        potentialImpact.push(impact);
        suggestedActions.push(action);
      }
    }

    // Default suggestions if no specific issues found
    if (suggestedActions.length === 0) {
      suggestedActions.push('Perform thorough integration testing');
      suggestedActions.push('Create comprehensive test coverage');
      suggestedActions.push('Document component behavior before changes');
    }

    return { reviewNotes, potentialImpact, suggestedActions };
  }

  /**
   * Create on-hold analysis report
   */
  private static async createOnHoldAnalysisReport(
    onHoldComponents: OnHoldComponent[],
    onHoldDir: string
  ): Promise<void> {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalComponents: onHoldComponents.length,
        riskLevels: this.summarizeRiskLevels(onHoldComponents),
        origins: this.summarizeOrigins(onHoldComponents),
        commonIssues: this.identifyCommonIssues(onHoldComponents)
      },
      components: onHoldComponents.map(c => ({
        path: c.originalPath,
        riskLevel: c.riskLevel,
        origin: c.origin,
        holdReason: c.holdReason,
        reviewNotes: c.reviewNotes,
        potentialImpact: c.potentialImpact,
        suggestedActions: c.suggestedActions,
        priority: this.calculateReviewPriority(c)
      })).sort((a, b) => b.priority - a.priority), // Sort by priority
      recommendations: this.generateGlobalRecommendations(onHoldComponents)
    };

    const reportPath = path.join(onHoldDir, 'on-hold-analysis-report.json');
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    
    // Also create a human-readable markdown report
    const markdownReport = this.generateMarkdownReport(report);
    const markdownPath = path.join(onHoldDir, 'ON-HOLD-REVIEW-GUIDE.md');
    await fs.writeFile(markdownPath, markdownReport);
    
    console.log(`📋 On-hold analysis report created: ${reportPath}`);
    console.log(`📖 Review guide created: ${markdownPath}`);
  }

  /**
   * Archive a single component with full metadata
   */
  private static async archiveComponent(
    component: LegacyComponent,
    archiveDir: string,
    options: ArchivalOptions
  ): Promise<ArchivedComponent> {
    const archivePath = path.join(archiveDir, component.path);
    
    // Ensure archive directory exists
    await fs.mkdir(path.dirname(archivePath), { recursive: true });
    
    // Copy file to archive
    await fs.copyFile(component.path, archivePath);
    
    // Generate checksum for integrity verification
    const content = await fs.readFile(component.path, 'utf-8');
    const checksum = this.generateChecksum(content);
    
    // Preserve Git history if requested
    if (options.preserveGitHistory) {
      await this.preserveGitHistory(component.path, archivePath);
    }
    
    return {
      originalPath: component.path,
      archivePath,
      origin: component.origin,
      riskLevel: component.riskLevel,
      archiveReason: component.archiveReason,
      dependencies: component.dependencies,
      backendDependencies: component.backendDependencies,
      routeUsage: component.routeUsage,
      fileSize: component.fileSize,
      lastModified: component.lastModified.toISOString(),
      checksum
    };
  }

  /**
   * Create optional symlinks for gradual transition
   */
  private static async createSymlink(archived: ArchivedComponent): Promise<void> {
    try {
      // Create symlink from original location to archive
      const symlinkPath = archived.originalPath + '.symlink';
      await fs.symlink(path.resolve(archived.archivePath), symlinkPath);
      archived.symlinkPath = symlinkPath;
      
      console.log(`🔗 Created symlink: ${symlinkPath} -> ${archived.archivePath}`);
    } catch (error) {
      console.warn(`⚠️ Failed to create symlink for ${archived.originalPath}:`, error);
    }
  }

  /**
   * Create route redirectors to Kiro dashboards
   */
  private static async createRouteRedirectors(components: LegacyComponent[]): Promise<RouteRedirect[]> {
    console.log('🔀 Creating route redirectors...');
    
    const redirects: RouteRedirect[] = [];
    const routeMap = new Map<string, string>([
      ['/upload', '/upload'],
      ['/vc', '/vc/quick'],
      ['/onboarding', '/onboarding'],
      ['/reports', '/reports'],
      ['/dashboard', '/dashboard'],
      ['/auth/login', '/auth/login'],
      ['/auth/register', '/auth/register']
    ]);
    
    for (const component of components) {
      for (const route of component.routeUsage) {
        if (route.isActive && route.hasKiroAlternative) {
          redirects.push({
            originalRoute: route.route,
            redirectTo: route.alternativeRoute || this.findKiroAlternative(route.route, routeMap),
            isActive: true,
            fallbackEnabled: true
          });
        }
      }
    }
    
    // Generate redirect configuration file
    if (redirects.length > 0) {
      await this.generateRedirectConfig(redirects);
    }
    
    console.log(`✅ Created ${redirects.length} route redirectors`);
    return redirects;
  }

  /**
   * Generate comprehensive archive manifest
   */
  private static async generateArchiveManifest(
    plan: ArchivalPlan,
    archivedComponents: ArchivedComponent[],
    onHoldComponents: OnHoldComponent[],
    dependencyMappings: DependencyMapping[],
    routeRedirects: RouteRedirect[],
    options: ArchivalOptions
  ): Promise<ArchiveManifest> {
    const manifest: ArchiveManifest = {
      timestamp: plan.backupPlan.timestamp,
      archiveDirectory: plan.backupPlan.archiveDirectory,
      version: '1.0.0',
      summary: {
        totalComponents: plan.components.length,
        archivedComponents: archivedComponents.length,
        symlinkComponents: archivedComponents.filter(c => c.symlinkPath).length,
        skippedComponents: plan.components.length - archivedComponents.length - onHoldComponents.length,
        onHoldComponents: onHoldComponents.length
      },
      components: archivedComponents,
      onHoldComponents: onHoldComponents,
      dependencies: dependencyMappings,
      routes: routeRedirects,
      rollbackInstructions: [
        '1. Stop the application: npm run stop',
        '2. Run rollback script: ./rollback.sh',
        '3. Verify rollback: npm run build',
        '4. Run tests: npm run test',
        '5. Restart application: npm run start',
        '6. Monitor for issues in first 24 hours',
        '7. Review on-hold components in on-hold/ directory'
      ],
      validationChecks: this.VALIDATION_CHECKS
    };
    
    // Write manifest to archive directory
    const manifestPath = path.join(plan.backupPlan.archiveDirectory, 'archive-manifest.json');
    await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));
    
    console.log(`📋 Archive manifest created: ${manifestPath}`);
    return manifest;
  }

  /**
   * Create instant rollback mechanism
   */
  private static async createRollbackScript(manifest: ArchiveManifest): Promise<void> {
    console.log('🔄 Creating rollback script...');
    
    const rollbackScript = `#!/bin/bash
# Safe Archival System - Instant Rollback Script
# Generated: ${manifest.timestamp}
# Archive: ${manifest.archiveDirectory}

set -e

echo "🔄 Starting rollback process..."
echo "📦 Archive: ${manifest.archiveDirectory}"

# Function to restore a single component
restore_component() {
    local archive_path="$1"
    local original_path="$2"
    local checksum="$3"
    
    if [ -f "$archive_path" ]; then
        echo "📁 Restoring: $original_path"
        
        # Create directory if it doesn't exist
        mkdir -p "$(dirname "$original_path")"
        
        # Copy file back
        cp "$archive_path" "$original_path"
        
        # Verify checksum
        if command -v sha256sum >/dev/null 2>&1; then
            local current_checksum=$(sha256sum "$original_path" | cut -d' ' -f1)
            if [ "$current_checksum" != "$checksum" ]; then
                echo "⚠️ Checksum mismatch for $original_path"
            fi
        fi
        
        echo "✅ Restored: $original_path"
    else
        echo "❌ Archive file not found: $archive_path"
        return 1
    fi
}

# Restore all components
${manifest.components.map(c => 
  `restore_component "${c.archivePath}" "${c.originalPath}" "${c.checksum}"`
).join('\n')}

# Remove symlinks if they exist
${manifest.components.filter(c => c.symlinkPath).map(c => 
  `[ -L "${c.symlinkPath}" ] && rm "${c.symlinkPath}" && echo "🔗 Removed symlink: ${c.symlinkPath}"`
).join('\n')}

# Run validation checks
echo "🧪 Running validation checks..."
${manifest.validationChecks.filter(c => c.isRequired).map(c => 
  `echo "Checking: ${c.name}" && ${c.command}`
).join('\n')}

echo "✅ Rollback completed successfully!"
echo "📋 Restored ${manifest.summary.archivedComponents} components"
echo "🔍 Please verify application functionality"
`;

    const rollbackPath = path.join(manifest.archiveDirectory, 'rollback.sh');
    await fs.writeFile(rollbackPath, rollbackScript);
    
    // Make script executable
    try {
      execSync(`chmod +x "${rollbackPath}"`);
    } catch (error) {
      console.warn('⚠️ Could not make rollback script executable:', error);
    }
    
    console.log(`🔄 Rollback script created: ${rollbackPath}`);
  }

  /**
   * Run validation checks after archival
   */
  private static async runValidationChecks(manifest: ArchiveManifest): Promise<void> {
    console.log('🧪 Running validation checks...');
    
    const results: { check: string; passed: boolean; error?: string }[] = [];
    
    for (const check of manifest.validationChecks) {
      try {
        console.log(`🔍 ${check.name}: ${check.description}`);
        execSync(check.command, { stdio: 'pipe' });
        results.push({ check: check.name, passed: true });
        console.log(`✅ ${check.name} passed`);
      } catch (error) {
        const passed = !check.isRequired;
        results.push({ 
          check: check.name, 
          passed, 
          error: error instanceof Error ? error.message : String(error)
        });
        
        if (check.isRequired) {
          console.error(`❌ ${check.name} failed (required):`, error);
          throw new Error(`Required validation check failed: ${check.name}`);
        } else {
          console.warn(`⚠️ ${check.name} failed (optional):`, error);
        }
      }
    }
    
    // Save validation results
    const resultsPath = path.join(manifest.archiveDirectory, 'validation-results.json');
    await fs.writeFile(resultsPath, JSON.stringify(results, null, 2));
    
    console.log('✅ Validation checks completed');
  }

  /**
   * Rollback a batch of components in case of validation failure
   */
  private static async rollbackBatch(components: ArchivedComponent[]): Promise<void> {
    console.log('🔄 Rolling back batch due to validation failure...');
    
    for (const component of components) {
      try {
        // Restore original file
        await fs.copyFile(component.archivePath, component.originalPath);
        
        // Remove symlink if it exists
        if (component.symlinkPath) {
          try {
            await fs.unlink(component.symlinkPath);
          } catch (error) {
            // Symlink might not exist, ignore error
          }
        }
        
        console.log(`✅ Rolled back: ${component.originalPath}`);
      } catch (error) {
        console.error(`❌ Failed to rollback ${component.originalPath}:`, error);
      }
    }
  }

  // Helper methods
  private static async findDependents(componentPath: string, allComponents: LegacyComponent[]): Promise<LegacyComponent[]> {
    const dependents: LegacyComponent[] = [];
    
    for (const component of allComponents) {
      if (component.dependencies.some(dep => dep.includes(componentPath))) {
        dependents.push(component);
      }
    }
    
    return dependents;
  }

  private static findMigrationPath(component: LegacyComponent): string | undefined {
    // Check if component has backend dependencies with migration paths
    for (const dep of component.backendDependencies) {
      if (dep.migrationPath) {
        return dep.migrationPath;
      }
    }
    return undefined;
  }

  private static hasMigrationPath(component: LegacyComponent): boolean {
    return component.backendDependencies.some(dep => Boolean(dep.migrationPath));
  }

  private static detectCircularDependencies(mappings: DependencyMapping[]): string[] {
    // Simple circular dependency detection
    const circular: string[] = [];
    
    for (const mapping of mappings) {
      for (const dependent of mapping.dependents) {
        const dependentMapping = mappings.find(m => m.component === dependent);
        if (dependentMapping && dependentMapping.dependencies.includes(mapping.component)) {
          circular.push(`${mapping.component} <-> ${dependent}`);
        }
      }
    }
    
    return circular;
  }

  private static createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }

  private static generateChecksum(content: string): string {
    // Simple checksum using built-in crypto
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  /**
   * Find active import references to components that would be archived
   */
  public static async findActiveImportRefs(pathsToArchive: string[], options: { root: string }): Promise<Array<{ importer: string; target: string; line: number }>> {
    // Filter out invalid paths
    const validPaths = pathsToArchive.filter(p => p && typeof p === 'string' && p.length > 0);
    
    if (validPaths.length === 0) {
      return [];
    }

    const raw = await fg('src/**/*.{ts,tsx,js,jsx}', {
      cwd: options.root || process.cwd(),
      onlyFiles: true,
      dot: true,
      ignore: ['src/archive/**', '**/*.test.*', 'test/**', '__mocks__/**', '__tests__/**'],
      absolute: true
    });
    const files = Array.isArray(raw) ? raw : (raw ? [String(raw)] : []);

    const refs: Array<{ importer: string; target: string; line: number }> = [];

    // Create patterns for each path to archive
    const patterns = validPaths.map(p => {
      const rel = path.relative(options.root || process.cwd(), p).replace(/\\/g, '/');
      const noExt = rel.replace(/\.(tsx?|jsx?)$/, '');
      const fileName = path.basename(noExt);
      
      return {
        path: rel,
        patterns: [
          // Relative imports: from './Component' or from '../Component'
          new RegExp(`from\\s+['"]\\.\\.?[/\\\\]*${this.escapeRegex(noExt)}['"]`),
          // Alias imports: from '@/components/Component'
          new RegExp(`from\\s+['"]@/${this.escapeRegex(noExt.replace('src/', ''))}['"]`),
          // Direct file name imports
          new RegExp(`from\\s+['"][^'"]*/${this.escapeRegex(fileName)}['"]`),
          // Require statements
          new RegExp(`require\\(\\s*['"]\\.\\.?[/\\\\]*${this.escapeRegex(noExt)}['"]\\s*\\)`),
        ]
      };
    });

    for (const file of files) {
      try {
        const content = await fs.readFile(file, 'utf8');
        const lines = content.split('\n');
        
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          
          for (const { path: targetPath, patterns: targetPatterns } of patterns) {
            if (targetPatterns.some(pattern => pattern.test(line))) {
              refs.push({
                importer: path.relative(options.root, file),
                target: targetPath,
                line: i + 1
              });
            }
          }
        }
      } catch (error) {
        // Skip files that can't be read
        continue;
      }
    }

    return refs;
  }

  private static escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Run comprehensive validation checks after archiving a batch
   */
  private static async runValidationChecks(ctx: { root: string; archived: string[]; testCommand: string }): Promise<void> {
    const problems: string[] = [];

    // 1) Active import guard - check if archived files are still imported
    console.log('   🔍 Checking for active import references...');
    if (ctx.archived && ctx.archived.length > 0) {
      const refs = await this.findActiveImportRefs(ctx.archived, { root: ctx.root });
      if (refs.length > 0) {
        const refSummary = refs.slice(0, 10).map(r => `     - ${r.importer}:${r.line} -> ${r.target}`).join('\n');
        const moreCount = refs.length > 10 ? `\n     ... +${refs.length - 10} more references` : '';
        problems.push(`Active import references found:\n${refSummary}${moreCount}`);
      }
    }

    // 2) TypeScript compilation check
    console.log('   🔧 Running TypeScript compilation check...');
    try {
      execSync('npx tsc --noEmit --skipLibCheck', { 
        cwd: ctx.root, 
        stdio: 'pipe',
        timeout: 30000 // 30 second timeout
      });
      console.log('   ✅ TypeScript compilation passed');
    } catch (error) {
      const output = error.stdout?.toString() || error.stderr?.toString() || error.message;
      problems.push(`TypeScript compilation failed:\n${output}`);
    }

    // 3) Test command (if provided and not just tsc)
    if (ctx.testCommand && ctx.testCommand !== 'npx tsc --noEmit') {
      console.log(`   🧪 Running test command: ${ctx.testCommand}...`);
      try {
        execSync(ctx.testCommand, { 
          cwd: ctx.root, 
          stdio: 'pipe',
          timeout: 60000 // 60 second timeout
        });
        console.log('   ✅ Test command passed');
      } catch (error) {
        const output = error.stdout?.toString() || error.stderr?.toString() || error.message;
        problems.push(`Test command failed:\n${output}`);
      }
    }

    if (problems.length > 0) {
      throw new Error(`Validation failed:\n\n${problems.join('\n\n')}`);
    }
  }

  private static async preserveGitHistory(originalPath: string, archivePath: string): Promise<void> {
    try {
      // Get git log for the file
      const gitLog = execSync(`git log --oneline "${originalPath}"`, { encoding: 'utf-8' });
      
      // Save git history to archive
      const historyPath = archivePath + '.git-history';
      await fs.writeFile(historyPath, gitLog);
    } catch (error) {
      // Git history not available or file not in git, ignore
    }
  }

  private static findKiroAlternative(route: string, routeMap: Map<string, string>): string {
    // Find the best Kiro alternative for a route
    for (const [pattern, alternative] of routeMap.entries()) {
      if (route.includes(pattern)) {
        return alternative;
      }
    }
    return '/dashboard'; // Default fallback
  }

  private static async generateRedirectConfig(redirects: RouteRedirect[]): Promise<void> {
    const config = {
      redirects: redirects.map(r => ({
        source: r.originalRoute,
        destination: r.redirectTo,
        permanent: false,
        fallback: r.fallbackEnabled
      }))
    };
    
    await fs.writeFile('redirect-config.json', JSON.stringify(config, null, 2));
    console.log('🔀 Redirect configuration saved to redirect-config.json');
  }

  /**
   * Restore a single component from archive
   */
  static async restoreComponent(
    archiveDir: string,
    componentPath: string
  ): Promise<boolean> {
    try {
      const manifestPath = path.join(archiveDir, 'archive-manifest.json');
      const manifest: ArchiveManifest = JSON.parse(
        await fs.readFile(manifestPath, 'utf-8')
      );
      
      const component = manifest.components.find(c => c.originalPath === componentPath);
      if (!component) {
        throw new Error(`Component not found in archive: ${componentPath}`);
      }
      
      // Restore the component
      await fs.mkdir(path.dirname(component.originalPath), { recursive: true });
      await fs.copyFile(component.archivePath, component.originalPath);
      
      // Verify checksum
      const content = await fs.readFile(component.originalPath, 'utf-8');
      const checksum = this.generateChecksum(content);
      
      if (checksum !== component.checksum) {
        console.warn(`⚠️ Checksum mismatch for restored component: ${componentPath}`);
      }
      
      console.log(`✅ Restored component: ${componentPath}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to restore component ${componentPath}:`, error);
      return false;
    }
  }

  /**
   * List all archived components
   */
  static async listArchivedComponents(archiveDir: string): Promise<ArchivedComponent[]> {
    try {
      const manifestPath = path.join(archiveDir, 'archive-manifest.json');
      const manifest: ArchiveManifest = JSON.parse(
        await fs.readFile(manifestPath, 'utf-8')
      );
      
      return manifest.components;
    } catch (error) {
      console.error(`❌ Failed to list archived components:`, error);
      return [];
    }
  }

  /**
   * List all on-hold components
   */
  static async listOnHoldComponents(archiveDir: string): Promise<OnHoldComponent[]> {
    try {
      const manifestPath = path.join(archiveDir, 'archive-manifest.json');
      const manifest: ArchiveManifest = JSON.parse(
        await fs.readFile(manifestPath, 'utf-8')
      );
      
      return manifest.onHoldComponents || [];
    } catch (error) {
      console.error(`❌ Failed to list on-hold components:`, error);
      return [];
    }
  }

  /**
   * Get on-hold analysis report
   */
  static async getOnHoldAnalysisReport(archiveDir: string): Promise<any> {
    try {
      const reportPath = path.join(archiveDir, 'on-hold', 'on-hold-analysis-report.json');
      const report = JSON.parse(await fs.readFile(reportPath, 'utf-8'));
      return report;
    } catch (error) {
      console.error(`❌ Failed to load on-hold analysis report:`, error);
      return null;
    }
  }

  // Helper methods for on-hold analysis
  private static summarizeRiskLevels(components: OnHoldComponent[]): Record<string, number> {
    const summary: Record<string, number> = {};
    for (const component of components) {
      summary[component.riskLevel] = (summary[component.riskLevel] || 0) + 1;
    }
    return summary;
  }

  private static summarizeOrigins(components: OnHoldComponent[]): Record<string, number> {
    const summary: Record<string, number> = {};
    for (const component of components) {
      summary[component.origin] = (summary[component.origin] || 0) + 1;
    }
    return summary;
  }

  private static identifyCommonIssues(components: OnHoldComponent[]): string[] {
    const issueCount: Record<string, number> = {};
    
    for (const component of components) {
      for (const impact of component.potentialImpact) {
        issueCount[impact] = (issueCount[impact] || 0) + 1;
      }
    }
    
    // Return issues that affect more than 20% of components
    const threshold = Math.max(1, Math.floor(components.length * 0.2));
    return Object.entries(issueCount)
      .filter(([_, count]) => count >= threshold)
      .sort(([_, a], [__, b]) => b - a)
      .map(([issue, _]) => issue);
  }

  private static calculateReviewPriority(component: OnHoldComponent): number {
    let priority = 0;
    
    // Risk level priority
    switch (component.riskLevel) {
      case 'critical': priority += 100; break;
      case 'high': priority += 75; break;
      case 'medium': priority += 50; break;
      case 'low': priority += 25; break;
    }
    
    // Backend dependencies add priority
    priority += component.backendDependencies.length * 10;
    
    // Active routes add priority
    priority += component.routeUsage.filter(r => r.isActive).length * 15;
    
    // File size adds priority (larger files are more complex)
    priority += Math.min(component.fileSize / 1000, 20);
    
    // Potential impact adds priority
    priority += component.potentialImpact.length * 5;
    
    return priority;
  }

  private static generateGlobalRecommendations(components: OnHoldComponent[]): string[] {
    const recommendations: string[] = [];
    
    const criticalCount = components.filter(c => c.riskLevel === 'critical').length;
    const highCount = components.filter(c => c.riskLevel === 'high').length;
    
    if (criticalCount > 0) {
      recommendations.push(`🚨 ${criticalCount} critical components require immediate attention before any migration`);
    }
    
    if (highCount > 0) {
      recommendations.push(`⚠️ ${highCount} high-risk components need thorough testing and migration planning`);
    }
    
    const backendDepComponents = components.filter(c => c.backendDependencies.length > 0);
    if (backendDepComponents.length > 0) {
      recommendations.push(`🔗 ${backendDepComponents.length} components have backend dependencies - create migration paths first`);
    }
    
    const routeComponents = components.filter(c => c.routeUsage.length > 0);
    if (routeComponents.length > 0) {
      recommendations.push(`🔀 ${routeComponents.length} components handle routes - ensure Kiro alternatives exist`);
    }
    
    recommendations.push('📋 Review components in priority order (highest priority first)');
    recommendations.push('🧪 Create comprehensive test coverage for each component before migration');
    recommendations.push('📖 Document current behavior before making any changes');
    recommendations.push('🔄 Consider gradual migration approach for complex components');
    
    return recommendations;
  }

  private static generateMarkdownReport(report: any): string {
    return `# On-Hold Components Review Guide

Generated: ${report.timestamp}

## Summary

- **Total Components**: ${report.summary.totalComponents}
- **Risk Levels**: ${Object.entries(report.summary.riskLevels).map(([level, count]) => `${level}: ${count}`).join(', ')}
- **Origins**: ${Object.entries(report.summary.origins).map(([origin, count]) => `${origin}: ${count}`).join(', ')}

## Common Issues

${report.summary.commonIssues.map((issue: string) => `- ${issue}`).join('\n')}

## Global Recommendations

${report.recommendations.map((rec: string) => `- ${rec}`).join('\n')}

## Components (Priority Order)

${report.components.map((comp: any) => `
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

## Next Steps

1. **Review Critical Components First**: Start with highest priority components
2. **Create Migration Plans**: For each component, create a detailed migration strategy
3. **Test Thoroughly**: Ensure comprehensive test coverage before any changes
4. **Document Everything**: Keep detailed records of changes and decisions
5. **Gradual Approach**: Consider migrating components in small batches
6. **Monitor Impact**: Watch for issues after each component migration

## Files Location

- **Components**: \`on-hold/src/\` (preserves original structure)
- **Analysis Report**: \`on-hold/on-hold-analysis-report.json\`
- **This Guide**: \`on-hold/ON-HOLD-REVIEW-GUIDE.md\`
`;
  }
}