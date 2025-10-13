#!/usr/bin/env tsx
/**
 * Enhanced Rollback System Implementation (SAFE RECOVERY MODE)
 * 
 * Provides comprehensive rollback capabilities for the system architecture cleanup:
 * - Automated rollback scripts for each phase
 * - Emergency stop mechanisms
 * - System state validation checkpoints
 * - Rapid recovery procedures
 * - Archive-based recovery
 * - Component-level rollback
 * - Dependency chain restoration
 * - Health check integration
 */

import { promises as fs } from 'fs';
import { join, dirname, relative } from 'path';
import { execSync } from 'child_process';
import { createHash } from 'crypto';

interface RollbackConfig {
  archiveDirectory: string;
  backupDirectory: string;
  validationChecks: string[];
  emergencyContacts: string[];
  maxRollbackTime: number; // in minutes
}

interface ComponentInfo {
  originalPath: string;
  archivePath: string;
  checksum: string;
  dependencies: string[];
  backendDependencies: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  origin: string;
  timestamp: string;
}

interface RollbackState {
  phase: string;
  timestamp: string;
  components: ComponentInfo[];
  validationResults: ValidationResult[];
  rollbackAvailable: boolean;
  emergencyMode: boolean;
}

interface ValidationResult {
  check: string;
  status: 'passed' | 'failed' | 'warning';
  message: string;
  timestamp: string;
}

class EnhancedRollbackSystem {
  private config: RollbackConfig;
  private archiveManifest: any;
  private rollbackState: RollbackState;

  constructor(config: RollbackConfig) {
    this.config = config;
    this.rollbackState = {
      phase: 'initialization',
      timestamp: new Date().toISOString(),
      components: [],
      validationResults: [],
      rollbackAvailable: false,
      emergencyMode: false
    };
  }

  /**
   * Initialize the rollback system
   */
  async initialize(): Promise<void> {
    console.log('🔄 Initializing Enhanced Rollback System...');
    
    try {
      // Load archive manifest
      const manifestPath = join(this.config.archiveDirectory, 'archive-manifest.json');
      const manifestContent = await fs.readFile(manifestPath, 'utf-8');
      this.archiveManifest = JSON.parse(manifestContent);
      
      console.log(`📦 Loaded archive manifest: ${this.archiveManifest.summary.totalComponents} components`);
      
      // Create backup directory if it doesn't exist
      await fs.mkdir(this.config.backupDirectory, { recursive: true });
      
      // Initialize rollback state
      await this.saveRollbackState();
      
      console.log('✅ Enhanced Rollback System initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize rollback system:', error);
      throw error;
    }
  }

  /**
   * Create system state checkpoint
   */
  async createCheckpoint(phase: string): Promise<string> {
    console.log(`📸 Creating checkpoint for phase: ${phase}`);
    
    const checkpointId = `checkpoint-${phase}-${Date.now()}`;
    const checkpointDir = join(this.config.backupDirectory, checkpointId);
    
    await fs.mkdir(checkpointDir, { recursive: true });
    
    // Backup current system state
    await this.backupCurrentState(checkpointDir);
    
    // Update rollback state
    this.rollbackState.phase = phase;
    this.rollbackState.timestamp = new Date().toISOString();
    this.rollbackState.rollbackAvailable = true;
    
    await this.saveRollbackState();
    
    console.log(`✅ Checkpoint created: ${checkpointId}`);
    return checkpointId;
  }

  /**
   * Restore individual component from archive
   */
  async restoreComponent(componentPath: string, options: {
    dryRun?: boolean;
    force?: boolean;
    validateDependencies?: boolean;
  } = {}): Promise<boolean> {
    console.log(`🔄 Restoring component: ${componentPath}`);
    
    // Find component in archive manifest
    const component = this.archiveManifest.components.find((c: any) => 
      c.originalPath === componentPath || c.archivePath.endsWith(componentPath)
    );
    
    if (!component) {
      console.error(`❌ Component not found in archive: ${componentPath}`);
      return false;
    }
    
    if (options.dryRun) {
      console.log(`🧪 DRY RUN: Would restore ${component.originalPath} from ${component.archivePath}`);
      return true;
    }
    
    try {
      // Check if component exists in archive
      const archiveExists = await fs.access(component.archivePath).then(() => true).catch(() => false);
      if (!archiveExists) {
        console.error(`❌ Archive file not found: ${component.archivePath}`);
        return false;
      }
      
      // Validate dependencies if requested
      if (options.validateDependencies) {
        const dependenciesValid = await this.validateDependencies(component);
        if (!dependenciesValid && !options.force) {
          console.error(`❌ Dependency validation failed for ${componentPath}`);
          return false;
        }
      }
      
      // Create target directory
      await fs.mkdir(dirname(component.originalPath), { recursive: true });
      
      // Copy component back
      await fs.copyFile(component.archivePath, component.originalPath);
      
      // Verify checksum if available
      if (component.checksum) {
        const currentChecksum = await this.calculateChecksum(component.originalPath);
        if (currentChecksum !== component.checksum) {
          console.warn(`⚠️ Checksum mismatch for ${componentPath}`);
        }
      }
      
      console.log(`✅ Component restored: ${component.originalPath}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to restore component ${componentPath}:`, error);
      return false;
    }
  }

  /**
   * Restore dependency chain for a component
   */
  async restoreDependencyChain(componentPath: string, options: {
    dryRun?: boolean;
    maxDepth?: number;
  } = {}): Promise<string[]> {
    console.log(`🔗 Restoring dependency chain for: ${componentPath}`);
    
    const maxDepth = options.maxDepth || 5;
    const restored: string[] = [];
    const toRestore = new Set([componentPath]);
    const processed = new Set<string>();
    
    let depth = 0;
    while (toRestore.size > 0 && depth < maxDepth) {
      const current = Array.from(toRestore);
      toRestore.clear();
      
      for (const path of current) {
        if (processed.has(path)) continue;
        processed.add(path);
        
        // Find component and its dependencies
        const component = this.archiveManifest.components.find((c: any) => 
          c.originalPath === path || c.archivePath.endsWith(path)
        );
        
        if (component) {
          // Restore component
          const success = await this.restoreComponent(path, { dryRun: options.dryRun });
          if (success) {
            restored.push(path);
            
            // Add dependencies to restoration queue
            for (const dep of component.dependencies || []) {
              if (dep.startsWith('@/') || dep.startsWith('./') || dep.startsWith('../')) {
                const depPath = this.resolveDependencyPath(dep, path);
                if (depPath && !processed.has(depPath)) {
                  toRestore.add(depPath);
                }
              }
            }
          }
        }
      }
      
      depth++;
    }
    
    console.log(`✅ Dependency chain restoration complete: ${restored.length} components`);
    return restored;
  }

  /**
   * Emergency stop mechanism
   */
  async emergencyStop(reason: string): Promise<void> {
    console.log(`🚨 EMERGENCY STOP ACTIVATED: ${reason}`);
    
    this.rollbackState.emergencyMode = true;
    this.rollbackState.timestamp = new Date().toISOString();
    
    // Save emergency state
    await this.saveRollbackState();
    
    // Create emergency checkpoint
    const emergencyCheckpoint = await this.createCheckpoint('emergency-stop');
    
    // Notify emergency contacts
    await this.notifyEmergencyContacts(reason, emergencyCheckpoint);
    
    console.log('🚨 Emergency stop completed. System state preserved.');
  }

  /**
   * Rapid recovery procedure
   */
  async rapidRecovery(checkpointId?: string): Promise<boolean> {
    console.log('⚡ Initiating rapid recovery procedure...');
    
    try {
      // Find latest checkpoint if none specified
      if (!checkpointId) {
        checkpointId = await this.findLatestCheckpoint();
      }
      
      if (!checkpointId) {
        console.error('❌ No checkpoint available for recovery');
        return false;
      }
      
      const checkpointDir = join(this.config.backupDirectory, checkpointId);
      
      // Validate checkpoint exists
      const checkpointExists = await fs.access(checkpointDir).then(() => true).catch(() => false);
      if (!checkpointExists) {
        console.error(`❌ Checkpoint not found: ${checkpointId}`);
        return false;
      }
      
      // Restore from checkpoint
      await this.restoreFromCheckpoint(checkpointDir);
      
      // Run validation checks
      const validationResults = await this.runValidationChecks();
      const allPassed = validationResults.every(r => r.status === 'passed');
      
      if (allPassed) {
        console.log('✅ Rapid recovery completed successfully');
        this.rollbackState.emergencyMode = false;
        await this.saveRollbackState();
        return true;
      } else {
        console.error('❌ Validation failed after recovery');
        return false;
      }
    } catch (error) {
      console.error('❌ Rapid recovery failed:', error);
      return false;
    }
  }

  /**
   * Run comprehensive validation checks
   */
  async runValidationChecks(): Promise<ValidationResult[]> {
    console.log('🧪 Running validation checks...');
    
    const results: ValidationResult[] = [];
    
    for (const check of this.config.validationChecks) {
      try {
        console.log(`  Checking: ${check}`);
        
        let status: 'passed' | 'failed' | 'warning' = 'passed';
        let message = 'Check passed';
        
        switch (check) {
          case 'typescript':
            try {
              execSync('npx tsc --noEmit', { stdio: 'pipe' });
            } catch (error) {
              status = 'failed';
              message = 'TypeScript compilation failed';
            }
            break;
            
          case 'build':
            try {
              execSync('npm run build', { stdio: 'pipe' });
            } catch (error) {
              status = 'failed';
              message = 'Build process failed';
            }
            break;
            
          case 'tests':
            try {
              execSync('npm test -- --passWithNoTests', { stdio: 'pipe' });
            } catch (error) {
              status = 'warning';
              message = 'Some tests failed';
            }
            break;
            
          case 'lint':
            try {
              execSync('npm run lint', { stdio: 'pipe' });
            } catch (error) {
              status = 'warning';
              message = 'Linting issues found';
            }
            break;
            
          default:
            status = 'warning';
            message = `Unknown check: ${check}`;
        }
        
        results.push({
          check,
          status,
          message,
          timestamp: new Date().toISOString()
        });
        
        console.log(`    ${status === 'passed' ? '✅' : status === 'warning' ? '⚠️' : '❌'} ${check}: ${message}`);
      } catch (error) {
        results.push({
          check,
          status: 'failed',
          message: `Check failed: ${error}`,
          timestamp: new Date().toISOString()
        });
      }
    }
    
    this.rollbackState.validationResults = results;
    await this.saveRollbackState();
    
    return results;
  }

  /**
   * Health check integration
   */
  async continuousHealthCheck(intervalMs: number = 30000): Promise<void> {
    console.log(`💓 Starting continuous health monitoring (${intervalMs}ms intervals)...`);
    
    const healthCheck = async () => {
      try {
        const results = await this.runValidationChecks();
        const criticalFailures = results.filter(r => r.status === 'failed');
        
        if (criticalFailures.length > 0) {
          console.warn(`⚠️ Health check detected ${criticalFailures.length} critical failures`);
          
          // Auto-trigger emergency stop if too many failures
          if (criticalFailures.length >= 3) {
            await this.emergencyStop(`Critical health check failures: ${criticalFailures.map(f => f.check).join(', ')}`);
          }
        }
      } catch (error) {
        console.error('❌ Health check failed:', error);
      }
    };
    
    // Run initial health check
    await healthCheck();
    
    // Set up continuous monitoring
    setInterval(healthCheck, intervalMs);
  }

  // Private helper methods

  private async backupCurrentState(backupDir: string): Promise<void> {
    // Backup package.json files
    const packageFiles = ['package.json', 'package-lock.json', 'tsconfig.json'];
    for (const file of packageFiles) {
      try {
        await fs.copyFile(file, join(backupDir, file));
      } catch (error) {
        // File might not exist, continue
      }
    }
    
    // Backup critical configuration files
    const configFiles = [
      'vite.config.ts',
      'tailwind.config.ts',
      'jest.config.cjs',
      'components.json'
    ];
    
    for (const file of configFiles) {
      try {
        await fs.copyFile(file, join(backupDir, file));
      } catch (error) {
        // File might not exist, continue
      }
    }
    
    // Create state snapshot
    const stateSnapshot = {
      timestamp: new Date().toISOString(),
      rollbackState: this.rollbackState,
      archiveManifest: this.archiveManifest
    };
    
    await fs.writeFile(
      join(backupDir, 'state-snapshot.json'),
      JSON.stringify(stateSnapshot, null, 2)
    );
  }

  private async restoreFromCheckpoint(checkpointDir: string): Promise<void> {
    console.log(`🔄 Restoring from checkpoint: ${checkpointDir}`);
    
    // Restore configuration files
    const files = await fs.readdir(checkpointDir);
    for (const file of files) {
      if (file.endsWith('.json') || file.endsWith('.ts') || file.endsWith('.js')) {
        const sourcePath = join(checkpointDir, file);
        const targetPath = file;
        
        try {
          await fs.copyFile(sourcePath, targetPath);
          console.log(`  Restored: ${file}`);
        } catch (error) {
          console.warn(`  Failed to restore ${file}:`, error);
        }
      }
    }
  }

  private async validateDependencies(component: ComponentInfo): Promise<boolean> {
    // Check if all dependencies are available
    for (const dep of component.dependencies || []) {
      if (dep.startsWith('@/')) {
        const depPath = this.resolveDependencyPath(dep, component.originalPath);
        if (depPath) {
          const exists = await fs.access(depPath).then(() => true).catch(() => false);
          if (!exists) {
            console.warn(`⚠️ Missing dependency: ${dep} (${depPath})`);
            return false;
          }
        }
      }
    }
    
    return true;
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

  private async calculateChecksum(filePath: string): Promise<string> {
    const content = await fs.readFile(filePath);
    return createHash('sha256').update(content).digest('hex');
  }

  private async findLatestCheckpoint(): Promise<string | null> {
    try {
      const entries = await fs.readdir(this.config.backupDirectory, { withFileTypes: true });
      const checkpoints = entries
        .filter(entry => entry.isDirectory() && entry.name.startsWith('checkpoint-'))
        .map(entry => entry.name)
        .sort()
        .reverse();
      
      return checkpoints[0] || null;
    } catch (error) {
      return null;
    }
  }

  private async saveRollbackState(): Promise<void> {
    const statePath = join(this.config.backupDirectory, 'rollback-state.json');
    await fs.writeFile(statePath, JSON.stringify(this.rollbackState, null, 2));
  }

  private async notifyEmergencyContacts(reason: string, checkpointId: string): Promise<void> {
    console.log(`📧 Notifying emergency contacts: ${reason}`);
    
    // In a real implementation, this would send emails/notifications
    const notification = {
      timestamp: new Date().toISOString(),
      reason,
      checkpointId,
      contacts: this.config.emergencyContacts
    };
    
    const notificationPath = join(this.config.backupDirectory, 'emergency-notification.json');
    await fs.writeFile(notificationPath, JSON.stringify(notification, null, 2));
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  const config: RollbackConfig = {
    archiveDirectory: 'src/archive/consolidated-legacy-archive-2025-09-18',
    backupDirectory: 'src/archive/rollback-checkpoints',
    validationChecks: ['typescript', 'build', 'tests', 'lint'],
    emergencyContacts: ['admin@matbakh.app'],
    maxRollbackTime: 30
  };
  
  const rollbackSystem = new EnhancedRollbackSystem(config);
  await rollbackSystem.initialize();
  
  switch (command) {
    case 'checkpoint':
      const phase = args[1] || 'manual';
      await rollbackSystem.createCheckpoint(phase);
      break;
      
    case 'restore':
      const componentPath = args[1];
      if (!componentPath) {
        console.error('❌ Component path required');
        process.exit(1);
      }
      
      const options = {
        dryRun: args.includes('--dry-run'),
        force: args.includes('--force'),
        validateDependencies: args.includes('--validate-deps')
      };
      
      await rollbackSystem.restoreComponent(componentPath, options);
      break;
      
    case 'restore-chain':
      const chainPath = args[1];
      if (!chainPath) {
        console.error('❌ Component path required');
        process.exit(1);
      }
      
      await rollbackSystem.restoreDependencyChain(chainPath, {
        dryRun: args.includes('--dry-run'),
        maxDepth: parseInt(args.find(arg => arg.startsWith('--max-depth='))?.split('=')[1] || '5')
      });
      break;
      
    case 'emergency-stop':
      const reason = args[1] || 'Manual emergency stop';
      await rollbackSystem.emergencyStop(reason);
      break;
      
    case 'rapid-recovery':
      const checkpointId = args[1];
      await rollbackSystem.rapidRecovery(checkpointId);
      break;
      
    case 'validate':
      await rollbackSystem.runValidationChecks();
      break;
      
    case 'health-monitor':
      const interval = parseInt(args[1]) || 30000;
      await rollbackSystem.continuousHealthCheck(interval);
      break;
      
    default:
      console.log(`
Enhanced Rollback System - Usage:

  npx tsx scripts/enhanced-rollback-system.ts <command> [options]

Commands:
  checkpoint <phase>              Create system checkpoint
  restore <path> [options]        Restore single component
  restore-chain <path> [options]  Restore component with dependencies
  emergency-stop [reason]         Activate emergency stop
  rapid-recovery [checkpoint-id]  Rapid system recovery
  validate                        Run validation checks
  health-monitor [interval-ms]    Start continuous health monitoring

Options:
  --dry-run                       Show what would be done
  --force                         Force operation
  --validate-deps                 Validate dependencies
  --max-depth=N                   Maximum dependency depth (default: 5)

Examples:
  npx tsx scripts/enhanced-rollback-system.ts checkpoint phase-3
  npx tsx scripts/enhanced-rollback-system.ts restore src/components/auth/LoginForm.tsx --dry-run
  npx tsx scripts/enhanced-rollback-system.ts restore-chain src/pages/Dashboard.tsx --validate-deps
  npx tsx scripts/enhanced-rollback-system.ts emergency-stop "Critical system failure"
  npx tsx scripts/enhanced-rollback-system.ts rapid-recovery
  npx tsx scripts/enhanced-rollback-system.ts health-monitor 60000
      `);
  }
}

// Check if this file is being run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { EnhancedRollbackSystem, RollbackConfig, ComponentInfo, RollbackState, ValidationResult };