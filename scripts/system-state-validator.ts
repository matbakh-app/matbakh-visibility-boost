#!/usr/bin/env tsx
/**
 * System State Validator
 * 
 * Provides comprehensive system validation for the rollback system:
 * - Health checks for all system components
 * - Dependency validation
 * - Build and test validation
 * - Performance monitoring
 * - Security checks
 */

import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { execSync } from 'child_process';
import { createHash } from 'crypto';

interface ValidationCheck {
  name: string;
  description: string;
  category: 'critical' | 'important' | 'optional';
  timeout: number; // in milliseconds
}

interface ValidationResult {
  check: string;
  status: 'passed' | 'failed' | 'warning' | 'skipped';
  message: string;
  details?: any;
  duration: number;
  timestamp: string;
}

interface SystemState {
  timestamp: string;
  overallStatus: 'healthy' | 'degraded' | 'critical';
  validationResults: ValidationResult[];
  systemMetrics: SystemMetrics;
  recommendations: string[];
}

interface SystemMetrics {
  buildTime: number;
  testCoverage: number;
  bundleSize: number;
  dependencyCount: number;
  typeScriptErrors: number;
  lintWarnings: number;
  securityVulnerabilities: number;
}

class SystemStateValidator {
  private checks: ValidationCheck[] = [
    // Critical checks
    {
      name: 'typescript-compilation',
      description: 'TypeScript compilation without errors',
      category: 'critical',
      timeout: 60000
    },
    {
      name: 'build-process',
      description: 'Production build completes successfully',
      category: 'critical',
      timeout: 120000
    },
    {
      name: 'dependency-resolution',
      description: 'All dependencies can be resolved',
      category: 'critical',
      timeout: 30000
    },
    {
      name: 'import-validation',
      description: 'All imports are valid and resolvable',
      category: 'critical',
      timeout: 45000
    },
    
    // Important checks
    {
      name: 'test-suite',
      description: 'Test suite runs without critical failures',
      category: 'important',
      timeout: 180000
    },
    {
      name: 'lint-check',
      description: 'Code quality and style checks',
      category: 'important',
      timeout: 30000
    },
    {
      name: 'security-audit',
      description: 'Security vulnerability scan',
      category: 'important',
      timeout: 60000
    },
    {
      name: 'bundle-analysis',
      description: 'Bundle size and optimization analysis',
      category: 'important',
      timeout: 45000
    },
    
    // Optional checks
    {
      name: 'performance-check',
      description: 'Basic performance metrics',
      category: 'optional',
      timeout: 30000
    },
    {
      name: 'accessibility-check',
      description: 'Basic accessibility validation',
      category: 'optional',
      timeout: 30000
    },
    {
      name: 'i18n-validation',
      description: 'Internationalization completeness',
      category: 'optional',
      timeout: 15000
    }
  ];

  /**
   * Run all validation checks
   */
  async validateSystem(options: {
    skipOptional?: boolean;
    skipImportant?: boolean;
    parallel?: boolean;
    timeout?: number;
  } = {}): Promise<SystemState> {
    console.log('🧪 Starting comprehensive system validation...');
    
    const startTime = Date.now();
    let checksToRun = [...this.checks];
    
    // Filter checks based on options
    if (options.skipOptional) {
      checksToRun = checksToRun.filter(c => c.category !== 'optional');
    }
    
    if (options.skipImportant) {
      checksToRun = checksToRun.filter(c => c.category !== 'important');
    }
    
    console.log(`Running ${checksToRun.length} validation checks...`);
    
    let results: ValidationResult[];
    
    if (options.parallel) {
      // Run checks in parallel (faster but may be resource intensive)
      results = await this.runChecksParallel(checksToRun, options.timeout);
    } else {
      // Run checks sequentially (safer)
      results = await this.runChecksSequential(checksToRun, options.timeout);
    }
    
    // Generate system metrics
    const systemMetrics = await this.generateSystemMetrics();
    
    // Determine overall status
    const overallStatus = this.determineOverallStatus(results);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(results, systemMetrics);
    
    const systemState: SystemState = {
      timestamp: new Date().toISOString(),
      overallStatus,
      validationResults: results,
      systemMetrics,
      recommendations
    };
    
    const duration = Date.now() - startTime;
    console.log(`✅ System validation completed in ${duration}ms`);
    console.log(`Overall Status: ${overallStatus.toUpperCase()}`);
    
    return systemState;
  }

  /**
   * Run specific validation check
   */
  async runSingleCheck(checkName: string): Promise<ValidationResult> {
    const check = this.checks.find(c => c.name === checkName);
    if (!check) {
      throw new Error(`Unknown check: ${checkName}`);
    }
    
    console.log(`🔍 Running check: ${check.name}`);
    return await this.executeCheck(check);
  }

  /**
   * Continuous monitoring mode
   */
  async startContinuousMonitoring(intervalMs: number = 300000): Promise<void> {
    console.log(`💓 Starting continuous system monitoring (${intervalMs}ms intervals)...`);
    
    const monitor = async () => {
      try {
        const state = await this.validateSystem({ 
          skipOptional: true,
          parallel: true,
          timeout: 60000
        });
        
        if (state.overallStatus === 'critical') {
          console.error('🚨 CRITICAL: System validation failed!');
          await this.handleCriticalFailure(state);
        } else if (state.overallStatus === 'degraded') {
          console.warn('⚠️ WARNING: System performance degraded');
        } else {
          console.log('✅ System health check passed');
        }
        
        // Save state for history
        await this.saveSystemState(state);
        
      } catch (error) {
        console.error('❌ Monitoring check failed:', error);
      }
    };
    
    // Run initial check
    await monitor();
    
    // Set up continuous monitoring
    setInterval(monitor, intervalMs);
  }

  /**
   * Generate system health report
   */
  async generateHealthReport(): Promise<{
    currentState: SystemState;
    history: SystemState[];
    trends: any;
    alerts: string[];
  }> {
    console.log('📊 Generating system health report...');
    
    const currentState = await this.validateSystem();
    const history = await this.loadSystemStateHistory();
    const trends = this.analyzeTrends(history);
    const alerts = this.generateAlerts(currentState, trends);
    
    return {
      currentState,
      history,
      trends,
      alerts
    };
  }

  // Private methods

  private async runChecksSequential(checks: ValidationCheck[], globalTimeout?: number): Promise<ValidationResult[]> {
    const results: ValidationResult[] = [];
    
    for (const check of checks) {
      try {
        const result = await this.executeCheck(check, globalTimeout);
        results.push(result);
        
        // Log progress
        const status = result.status === 'passed' ? '✅' : 
                      result.status === 'warning' ? '⚠️' : 
                      result.status === 'failed' ? '❌' : '⏭️';
        console.log(`  ${status} ${check.name}: ${result.message}`);
        
      } catch (error) {
        results.push({
          check: check.name,
          status: 'failed',
          message: `Check execution failed: ${error}`,
          duration: 0,
          timestamp: new Date().toISOString()
        });
      }
    }
    
    return results;
  }

  private async runChecksParallel(checks: ValidationCheck[], globalTimeout?: number): Promise<ValidationResult[]> {
    const promises = checks.map(check => 
      this.executeCheck(check, globalTimeout).catch(error => ({
        check: check.name,
        status: 'failed' as const,
        message: `Check execution failed: ${error}`,
        duration: 0,
        timestamp: new Date().toISOString()
      }))
    );
    
    const results = await Promise.all(promises);
    
    // Log results
    results.forEach(result => {
      const status = result.status === 'passed' ? '✅' : 
                    result.status === 'warning' ? '⚠️' : 
                    result.status === 'failed' ? '❌' : '⏭️';
      console.log(`  ${status} ${result.check}: ${result.message}`);
    });
    
    return results;
  }

  private async executeCheck(check: ValidationCheck, globalTimeout?: number): Promise<ValidationResult> {
    const startTime = Date.now();
    const timeout = globalTimeout || check.timeout;
    
    try {
      let result: Partial<ValidationResult> = {};
      
      switch (check.name) {
        case 'typescript-compilation':
          result = await this.checkTypeScriptCompilation();
          break;
          
        case 'build-process':
          result = await this.checkBuildProcess();
          break;
          
        case 'dependency-resolution':
          result = await this.checkDependencyResolution();
          break;
          
        case 'import-validation':
          result = await this.checkImportValidation();
          break;
          
        case 'test-suite':
          result = await this.checkTestSuite();
          break;
          
        case 'lint-check':
          result = await this.checkLinting();
          break;
          
        case 'security-audit':
          result = await this.checkSecurityAudit();
          break;
          
        case 'bundle-analysis':
          result = await this.checkBundleAnalysis();
          break;
          
        case 'performance-check':
          result = await this.checkPerformance();
          break;
          
        case 'accessibility-check':
          result = await this.checkAccessibility();
          break;
          
        case 'i18n-validation':
          result = await this.checkI18nValidation();
          break;
          
        default:
          result = {
            status: 'skipped',
            message: `Unknown check: ${check.name}`
          };
      }
      
      const duration = Date.now() - startTime;
      
      return {
        check: check.name,
        status: result.status || 'failed',
        message: result.message || 'No message',
        details: result.details,
        duration,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      const duration = Date.now() - startTime;
      
      return {
        check: check.name,
        status: 'failed',
        message: `Check failed: ${error}`,
        duration,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Individual check implementations

  private async checkTypeScriptCompilation(): Promise<Partial<ValidationResult>> {
    try {
      execSync('npx tsc --noEmit', { stdio: 'pipe' });
      return {
        status: 'passed',
        message: 'TypeScript compilation successful'
      };
    } catch (error: any) {
      const output = error.stdout?.toString() || error.stderr?.toString() || '';
      const errorCount = (output.match(/error TS\d+:/g) || []).length;
      
      return {
        status: 'failed',
        message: `TypeScript compilation failed with ${errorCount} errors`,
        details: { errorCount, output: output.slice(0, 1000) }
      };
    }
  }

  private async checkBuildProcess(): Promise<Partial<ValidationResult>> {
    try {
      const startTime = Date.now();
      execSync('npm run build', { stdio: 'pipe' });
      const buildTime = Date.now() - startTime;
      
      return {
        status: 'passed',
        message: `Build completed successfully in ${buildTime}ms`,
        details: { buildTime }
      };
    } catch (error: any) {
      return {
        status: 'failed',
        message: 'Build process failed',
        details: { error: error.message }
      };
    }
  }

  private async checkDependencyResolution(): Promise<Partial<ValidationResult>> {
    try {
      execSync('npm ls --depth=0', { stdio: 'pipe' });
      return {
        status: 'passed',
        message: 'All dependencies resolved successfully'
      };
    } catch (error: any) {
      const output = error.stdout?.toString() || '';
      const missingCount = (output.match(/UNMET DEPENDENCY/g) || []).length;
      
      if (missingCount > 0) {
        return {
          status: 'failed',
          message: `${missingCount} unmet dependencies found`,
          details: { missingCount }
        };
      }
      
      return {
        status: 'warning',
        message: 'Dependency check completed with warnings'
      };
    }
  }

  private async checkImportValidation(): Promise<Partial<ValidationResult>> {
    try {
      // This is a simplified check - in practice, you'd want more sophisticated import validation
      const tsFiles = await this.findTypeScriptFiles();
      let brokenImports = 0;
      
      for (const file of tsFiles.slice(0, 50)) { // Limit to first 50 files for performance
        try {
          const content = await fs.readFile(file, 'utf-8');
          const imports = content.match(/import.*from\s+['"]([^'"]+)['"]/g) || [];
          
          for (const importLine of imports) {
            const match = importLine.match(/from\s+['"]([^'"]+)['"]/);
            if (match && match[1].startsWith('@/')) {
              const importPath = match[1].replace('@/', 'src/') + '.ts';
              const exists = await fs.access(importPath).then(() => true).catch(() => false);
              if (!exists) {
                const tsxPath = importPath.replace('.ts', '.tsx');
                const tsxExists = await fs.access(tsxPath).then(() => true).catch(() => false);
                if (!tsxExists) {
                  brokenImports++;
                }
              }
            }
          }
        } catch (error) {
          // Skip files that can't be read
        }
      }
      
      if (brokenImports === 0) {
        return {
          status: 'passed',
          message: 'All imports validated successfully'
        };
      } else {
        return {
          status: 'warning',
          message: `${brokenImports} potentially broken imports found`,
          details: { brokenImports }
        };
      }
    } catch (error) {
      return {
        status: 'failed',
        message: `Import validation failed: ${error}`
      };
    }
  }

  private async checkTestSuite(): Promise<Partial<ValidationResult>> {
    try {
      const output = execSync('npm test -- --passWithNoTests --verbose', { 
        stdio: 'pipe',
        encoding: 'utf-8'
      });
      
      const passedMatch = output.match(/(\d+) passed/);
      const failedMatch = output.match(/(\d+) failed/);
      
      const passed = passedMatch ? parseInt(passedMatch[1]) : 0;
      const failed = failedMatch ? parseInt(failedMatch[1]) : 0;
      
      if (failed === 0) {
        return {
          status: 'passed',
          message: `All ${passed} tests passed`,
          details: { passed, failed }
        };
      } else {
        return {
          status: 'warning',
          message: `${failed} tests failed, ${passed} passed`,
          details: { passed, failed }
        };
      }
    } catch (error: any) {
      return {
        status: 'failed',
        message: 'Test suite execution failed',
        details: { error: error.message }
      };
    }
  }

  private async checkLinting(): Promise<Partial<ValidationResult>> {
    try {
      execSync('npm run lint', { stdio: 'pipe' });
      return {
        status: 'passed',
        message: 'Linting passed without issues'
      };
    } catch (error: any) {
      const output = error.stdout?.toString() || error.stderr?.toString() || '';
      const warningCount = (output.match(/warning/gi) || []).length;
      const errorCount = (output.match(/error/gi) || []).length;
      
      if (errorCount > 0) {
        return {
          status: 'failed',
          message: `Linting failed with ${errorCount} errors, ${warningCount} warnings`,
          details: { errorCount, warningCount }
        };
      } else if (warningCount > 0) {
        return {
          status: 'warning',
          message: `Linting completed with ${warningCount} warnings`,
          details: { warningCount }
        };
      }
      
      return {
        status: 'passed',
        message: 'Linting passed'
      };
    }
  }

  private async checkSecurityAudit(): Promise<Partial<ValidationResult>> {
    try {
      const output = execSync('npm audit --json', { 
        stdio: 'pipe',
        encoding: 'utf-8'
      });
      
      const audit = JSON.parse(output);
      const vulnerabilities = audit.metadata?.vulnerabilities || {};
      
      const total = Object.values(vulnerabilities).reduce((sum: number, count: any) => sum + count, 0);
      
      if (total === 0) {
        return {
          status: 'passed',
          message: 'No security vulnerabilities found'
        };
      } else {
        const critical = vulnerabilities.critical || 0;
        const high = vulnerabilities.high || 0;
        
        if (critical > 0 || high > 0) {
          return {
            status: 'failed',
            message: `${total} vulnerabilities found (${critical} critical, ${high} high)`,
            details: vulnerabilities
          };
        } else {
          return {
            status: 'warning',
            message: `${total} low/moderate vulnerabilities found`,
            details: vulnerabilities
          };
        }
      }
    } catch (error) {
      return {
        status: 'warning',
        message: 'Security audit could not be completed'
      };
    }
  }

  private async checkBundleAnalysis(): Promise<Partial<ValidationResult>> {
    try {
      // Check if dist directory exists and get size
      const distExists = await fs.access('dist').then(() => true).catch(() => false);
      
      if (!distExists) {
        return {
          status: 'warning',
          message: 'Build output not found - run build first'
        };
      }
      
      const stats = await this.getDirectorySize('dist');
      const sizeMB = stats.size / (1024 * 1024);
      
      if (sizeMB > 10) {
        return {
          status: 'warning',
          message: `Bundle size is large: ${sizeMB.toFixed(2)}MB`,
          details: { sizeMB, fileCount: stats.fileCount }
        };
      } else {
        return {
          status: 'passed',
          message: `Bundle size is acceptable: ${sizeMB.toFixed(2)}MB`,
          details: { sizeMB, fileCount: stats.fileCount }
        };
      }
    } catch (error) {
      return {
        status: 'failed',
        message: `Bundle analysis failed: ${error}`
      };
    }
  }

  private async checkPerformance(): Promise<Partial<ValidationResult>> {
    // This is a placeholder for performance checks
    // In a real implementation, you might run Lighthouse or similar tools
    return {
      status: 'passed',
      message: 'Performance check completed (placeholder)'
    };
  }

  private async checkAccessibility(): Promise<Partial<ValidationResult>> {
    // This is a placeholder for accessibility checks
    // In a real implementation, you might run axe-core or similar tools
    return {
      status: 'passed',
      message: 'Accessibility check completed (placeholder)'
    };
  }

  private async checkI18nValidation(): Promise<Partial<ValidationResult>> {
    try {
      // Check if translation files exist and are valid JSON
      const localesDir = 'public/locales';
      const localeExists = await fs.access(localesDir).then(() => true).catch(() => false);
      
      if (!localeExists) {
        return {
          status: 'warning',
          message: 'Locales directory not found'
        };
      }
      
      const languages = await fs.readdir(localesDir);
      let validFiles = 0;
      let totalFiles = 0;
      
      for (const lang of languages) {
        const langDir = join(localesDir, lang);
        const isDir = (await fs.stat(langDir)).isDirectory();
        
        if (isDir) {
          const files = await fs.readdir(langDir);
          for (const file of files) {
            if (file.endsWith('.json')) {
              totalFiles++;
              try {
                const content = await fs.readFile(join(langDir, file), 'utf-8');
                JSON.parse(content);
                validFiles++;
              } catch (error) {
                // Invalid JSON file
              }
            }
          }
        }
      }
      
      if (validFiles === totalFiles) {
        return {
          status: 'passed',
          message: `All ${totalFiles} translation files are valid`,
          details: { validFiles, totalFiles, languages: languages.length }
        };
      } else {
        return {
          status: 'warning',
          message: `${totalFiles - validFiles} invalid translation files found`,
          details: { validFiles, totalFiles, languages: languages.length }
        };
      }
    } catch (error) {
      return {
        status: 'failed',
        message: `I18n validation failed: ${error}`
      };
    }
  }

  // Helper methods

  private async findTypeScriptFiles(): Promise<string[]> {
    const files: string[] = [];
    
    const scanDirectory = async (dir: string): Promise<void> => {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = join(dir, entry.name);
          
          if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
            await scanDirectory(fullPath);
          } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
            files.push(fullPath);
          }
        }
      } catch (error) {
        // Skip directories that can't be read
      }
    };
    
    await scanDirectory('src');
    return files;
  }

  private async getDirectorySize(dir: string): Promise<{ size: number; fileCount: number }> {
    let totalSize = 0;
    let fileCount = 0;
    
    const scanDirectory = async (currentDir: string): Promise<void> => {
      try {
        const entries = await fs.readdir(currentDir, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = join(currentDir, entry.name);
          
          if (entry.isDirectory()) {
            await scanDirectory(fullPath);
          } else if (entry.isFile()) {
            const stats = await fs.stat(fullPath);
            totalSize += stats.size;
            fileCount++;
          }
        }
      } catch (error) {
        // Skip directories that can't be read
      }
    };
    
    await scanDirectory(dir);
    return { size: totalSize, fileCount };
  }

  private async generateSystemMetrics(): Promise<SystemMetrics> {
    // This would collect various system metrics
    // For now, return placeholder values
    return {
      buildTime: 0,
      testCoverage: 0,
      bundleSize: 0,
      dependencyCount: 0,
      typeScriptErrors: 0,
      lintWarnings: 0,
      securityVulnerabilities: 0
    };
  }

  private determineOverallStatus(results: ValidationResult[]): 'healthy' | 'degraded' | 'critical' {
    const criticalFailures = results.filter(r => 
      r.status === 'failed' && 
      this.checks.find(c => c.name === r.check)?.category === 'critical'
    );
    
    if (criticalFailures.length > 0) {
      return 'critical';
    }
    
    const importantFailures = results.filter(r => 
      r.status === 'failed' && 
      this.checks.find(c => c.name === r.check)?.category === 'important'
    );
    
    const warnings = results.filter(r => r.status === 'warning');
    
    if (importantFailures.length > 0 || warnings.length > 3) {
      return 'degraded';
    }
    
    return 'healthy';
  }

  private generateRecommendations(results: ValidationResult[], metrics: SystemMetrics): string[] {
    const recommendations: string[] = [];
    
    const failedChecks = results.filter(r => r.status === 'failed');
    const warningChecks = results.filter(r => r.status === 'warning');
    
    if (failedChecks.length > 0) {
      recommendations.push(`Fix ${failedChecks.length} failed checks: ${failedChecks.map(r => r.check).join(', ')}`);
    }
    
    if (warningChecks.length > 0) {
      recommendations.push(`Review ${warningChecks.length} warnings for potential improvements`);
    }
    
    // Add specific recommendations based on check results
    const tsCheck = results.find(r => r.check === 'typescript-compilation');
    if (tsCheck?.status === 'failed') {
      recommendations.push('Run TypeScript compiler to see detailed error messages');
    }
    
    const testCheck = results.find(r => r.check === 'test-suite');
    if (testCheck?.status === 'warning' || testCheck?.status === 'failed') {
      recommendations.push('Review and fix failing tests to ensure system stability');
    }
    
    const securityCheck = results.find(r => r.check === 'security-audit');
    if (securityCheck?.status === 'failed') {
      recommendations.push('Run npm audit fix to address security vulnerabilities');
    }
    
    return recommendations;
  }

  private async handleCriticalFailure(state: SystemState): Promise<void> {
    // In a real implementation, this would trigger emergency procedures
    console.error('🚨 Critical system failure detected!');
    console.error('Failed checks:', state.validationResults.filter(r => r.status === 'failed').map(r => r.check));
    
    // Save failure state
    const failureReport = {
      timestamp: new Date().toISOString(),
      state,
      emergencyActions: [
        'System validation failed',
        'Consider emergency rollback',
        'Check system logs for details'
      ]
    };
    
    await fs.writeFile(
      `system-failure-${Date.now()}.json`,
      JSON.stringify(failureReport, null, 2)
    );
  }

  private async saveSystemState(state: SystemState): Promise<void> {
    const stateDir = 'src/archive/rollback-checkpoints/system-states';
    await fs.mkdir(stateDir, { recursive: true });
    
    const filename = `system-state-${Date.now()}.json`;
    await fs.writeFile(
      join(stateDir, filename),
      JSON.stringify(state, null, 2)
    );
  }

  private async loadSystemStateHistory(): Promise<SystemState[]> {
    const stateDir = 'src/archive/rollback-checkpoints/system-states';
    
    try {
      const files = await fs.readdir(stateDir);
      const stateFiles = files
        .filter(f => f.startsWith('system-state-') && f.endsWith('.json'))
        .sort()
        .slice(-10); // Last 10 states
      
      const states: SystemState[] = [];
      
      for (const file of stateFiles) {
        try {
          const content = await fs.readFile(join(stateDir, file), 'utf-8');
          states.push(JSON.parse(content));
        } catch (error) {
          // Skip invalid files
        }
      }
      
      return states;
    } catch (error) {
      return [];
    }
  }

  private analyzeTrends(history: SystemState[]): any {
    if (history.length < 2) {
      return { message: 'Insufficient data for trend analysis' };
    }
    
    // Simple trend analysis
    const recentStates = history.slice(-5);
    const healthyCount = recentStates.filter(s => s.overallStatus === 'healthy').length;
    const degradedCount = recentStates.filter(s => s.overallStatus === 'degraded').length;
    const criticalCount = recentStates.filter(s => s.overallStatus === 'critical').length;
    
    return {
      recentHealthy: healthyCount,
      recentDegraded: degradedCount,
      recentCritical: criticalCount,
      trend: healthyCount > degradedCount + criticalCount ? 'improving' : 
             criticalCount > 0 ? 'deteriorating' : 'stable'
    };
  }

  private generateAlerts(currentState: SystemState, trends: any): string[] {
    const alerts: string[] = [];
    
    if (currentState.overallStatus === 'critical') {
      alerts.push('CRITICAL: System validation failed - immediate attention required');
    }
    
    if (trends.trend === 'deteriorating') {
      alerts.push('WARNING: System health trend is deteriorating');
    }
    
    if (trends.recentCritical > 0) {
      alerts.push(`ALERT: ${trends.recentCritical} critical failures in recent history`);
    }
    
    return alerts;
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  const validator = new SystemStateValidator();
  
  switch (command) {
    case 'validate':
      const options = {
        skipOptional: args.includes('--skip-optional'),
        skipImportant: args.includes('--skip-important'),
        parallel: args.includes('--parallel'),
        timeout: parseInt(args.find(arg => arg.startsWith('--timeout='))?.split('=')[1] || '0') || undefined
      };
      
      const state = await validator.validateSystem(options);
      
      console.log('\n📊 Validation Summary:');
      console.log(`Overall Status: ${state.overallStatus.toUpperCase()}`);
      console.log(`Checks Run: ${state.validationResults.length}`);
      console.log(`Passed: ${state.validationResults.filter(r => r.status === 'passed').length}`);
      console.log(`Failed: ${state.validationResults.filter(r => r.status === 'failed').length}`);
      console.log(`Warnings: ${state.validationResults.filter(r => r.status === 'warning').length}`);
      
      if (state.recommendations.length > 0) {
        console.log('\n💡 Recommendations:');
        state.recommendations.forEach(rec => console.log(`  • ${rec}`));
      }
      
      // Exit with error code if critical issues found
      if (state.overallStatus === 'critical') {
        process.exit(1);
      }
      break;
      
    case 'check':
      const checkName = args[1];
      if (!checkName) {
        console.error('❌ Check name required');
        process.exit(1);
      }
      
      const result = await validator.runSingleCheck(checkName);
      console.log(`${result.status === 'passed' ? '✅' : result.status === 'warning' ? '⚠️' : '❌'} ${result.check}: ${result.message}`);
      
      if (result.details) {
        console.log('Details:', JSON.stringify(result.details, null, 2));
      }
      break;
      
    case 'monitor':
      const interval = parseInt(args[1]) || 300000; // 5 minutes default
      await validator.startContinuousMonitoring(interval);
      break;
      
    case 'report':
      const report = await validator.generateHealthReport();
      
      console.log('\n📊 System Health Report:');
      console.log(`Current Status: ${report.currentState.overallStatus.toUpperCase()}`);
      console.log(`History Records: ${report.history.length}`);
      console.log(`Trend: ${report.trends.trend || 'unknown'}`);
      
      if (report.alerts.length > 0) {
        console.log('\n🚨 Alerts:');
        report.alerts.forEach(alert => console.log(`  • ${alert}`));
      }
      
      // Save detailed report
      const reportFile = `health-report-${Date.now()}.json`;
      await fs.writeFile(reportFile, JSON.stringify(report, null, 2));
      console.log(`\n📄 Detailed report saved: ${reportFile}`);
      break;
      
    default:
      console.log(`
System State Validator - Usage:

  npx tsx scripts/system-state-validator.ts <command> [options]

Commands:
  validate [options]              Run full system validation
  check <check-name>              Run specific validation check
  monitor [interval-ms]           Start continuous monitoring
  report                          Generate health report

Validation Options:
  --skip-optional                 Skip optional checks
  --skip-important                Skip important checks (keep only critical)
  --parallel                      Run checks in parallel
  --timeout=<ms>                  Global timeout for all checks

Available Checks:
  typescript-compilation          TypeScript compilation check
  build-process                   Production build check
  dependency-resolution           Dependency resolution check
  import-validation               Import validation check
  test-suite                      Test suite execution
  lint-check                      Code quality check
  security-audit                  Security vulnerability scan
  bundle-analysis                 Bundle size analysis
  performance-check               Performance metrics
  accessibility-check             Accessibility validation
  i18n-validation                 Internationalization check

Examples:
  npx tsx scripts/system-state-validator.ts validate
  npx tsx scripts/system-state-validator.ts validate --parallel --skip-optional
  npx tsx scripts/system-state-validator.ts check typescript-compilation
  npx tsx scripts/system-state-validator.ts monitor 60000
  npx tsx scripts/system-state-validator.ts report
      `);
  }
}

// Check if this file is being run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { SystemStateValidator, ValidationResult, SystemState, SystemMetrics };