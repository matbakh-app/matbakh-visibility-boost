/**
 * Legacy Component Detector
 * Identifies legacy components for safe archival (NO DELETION)
 * Implements Supabase/Lovable marker scanner, backend dependency checker,
 * route usage analyzer, and safe-to-archive classifier
 */

import { ComponentOrigin, RiskLevel } from './types';
import { OriginDetector } from './origin-detector';
import { FileSystemCrawler } from './file-system-crawler';
import { EnhancedRiskAssessor } from './enhanced-risk-assessor';
import * as fs from 'fs/promises';

export interface LegacyComponent {
  path: string;
  origin: ComponentOrigin;
  confidence: number;
  markers: string[];
  dependencies: string[];
  backendDependencies: BackendDependency[];
  routeUsage: RouteUsage[];
  safeToArchive: boolean;
  archiveReason: string;
  riskLevel: RiskLevel;
  lastModified: Date;
  fileSize: number;
}

export interface BackendDependency {
  type: 'database' | 'api' | 'service' | 'lambda' | 'storage';
  name: string;
  isActive: boolean;
  migrationPath?: string;
}

export interface RouteUsage {
  route: string;
  isActive: boolean;
  hasKiroAlternative: boolean;
  alternativeRoute?: string;
  usageCount: number;
}

export interface ArchivalPlan {
  components: LegacyComponent[];
  summary: {
    totalComponents: number;
    safeToArchive: number;
    requiresReview: number;
    highRisk: number;
  };
  archiveGroups: {
    supabaseComponents: LegacyComponent[];
    lovableComponents: LegacyComponent[];
    unknownComponents: LegacyComponent[];
  };
  backupPlan: BackupPlan;
}

export interface BackupPlan {
  archiveDirectory: string;
  timestamp: string;
  manifestFile: string;
  rollbackScript: string;
}

export class LegacyComponentDetector {
  private static readonly BACKEND_DEPENDENCY_PATTERNS = [
    // Supabase patterns
    { pattern: /createClient.*supabase/i, type: 'database' as const, name: 'supabase' },
    { pattern: /\.from\(['"][^'"]*['"]?\)/g, type: 'database' as const, name: 'supabase-table' },
    { pattern: /supabase\.auth/i, type: 'service' as const, name: 'supabase-auth' },
    { pattern: /supabase\.storage/i, type: 'storage' as const, name: 'supabase-storage' },
    
    // Lovable patterns
    { pattern: /lovable-uploads/i, type: 'storage' as const, name: 'lovable-storage' },
    { pattern: /@\/lovable/i, type: 'service' as const, name: 'lovable-service' },
    
    // API patterns
    { pattern: /fetch.*\/api\//i, type: 'api' as const, name: 'legacy-api' },
    { pattern: /axios.*\/api\//i, type: 'api' as const, name: 'legacy-api' },
    
    // Lambda patterns
    { pattern: /invoke.*lambda/i, type: 'lambda' as const, name: 'aws-lambda' }
  ];

  private static readonly ROUTE_PATTERNS = [
    // Legacy routes that should be redirected
    { pattern: /\/login/i, alternative: '/auth/login' },
    { pattern: /\/signup/i, alternative: '/auth/register' },
    { pattern: /\/dashboard\/old/i, alternative: '/dashboard' },
    { pattern: /\/upload\/legacy/i, alternative: '/upload' },
    { pattern: /\/vc\/old/i, alternative: '/vc/quick' },
    { pattern: /\/reports\/legacy/i, alternative: '/reports' }
  ];

  /**
   * Scan for legacy components across the system
   */
  static async scanLegacyComponents(options?: {
    directories?: string[];
    excludePatterns?: string[];
  }): Promise<ArchivalPlan> {
    console.log('🔍 Starting legacy component detection...');
    
    const directories = options?.directories || [
      'src/pages',
      'src/components',
      'src/layouts',
      'src/lib',
      'src/services',
      'src/contexts',
      'src/hooks'
    ];

    const excludePatterns = options?.excludePatterns || [
      'node_modules',
      '.git',
      'dist',
      'build',
      '__tests__',
      '.test.',
      '.spec.'
    ];

    const legacyComponents: LegacyComponent[] = [];
    
    // Crawl file system
    const files = await FileSystemCrawler.crawlFileSystem({
      directories,
      excludePatterns,
      includePatterns: ['\\.tsx?$', '\\.jsx?$'],
      followSymlinks: false,
      maxDepth: 10
    });

    console.log(`📁 Found ${files.length} files to analyze`);

    // Analyze each file
    for (const filePath of files) {
      try {
        const component = await this.analyzeComponent(filePath);
        if (component && (component.origin === 'supabase' || component.origin === 'lovable' || component.origin === 'unknown')) {
          legacyComponents.push(component);
        }
      } catch (error) {
        console.warn(`⚠️ Failed to analyze ${filePath}:`, error);
      }
    }

    console.log(`🎯 Identified ${legacyComponents.length} legacy components`);

    return this.createArchivalPlan(legacyComponents);
  }

  /**
   * Analyze a single component for legacy markers and dependencies
   */
  private static async analyzeComponent(filePath: string): Promise<LegacyComponent | null> {
    const content = await fs.readFile(filePath, 'utf-8');
    const stats = await fs.stat(filePath);
    
    // Detect origin
    const originResult = OriginDetector.detectOrigin(filePath, content);
    
    // Skip Kiro components
    if (originResult.origin === 'kiro') {
      return null;
    }

    // Analyze backend dependencies
    const backendDependencies = this.analyzeBackendDependencies(content);
    
    // Analyze route usage
    const routeUsage = this.analyzeRouteUsage(filePath, content);
    
    // Enhanced risk assessment
    const riskAssessment = await EnhancedRiskAssessor.assessRisk(
      filePath,
      originResult.origin,
      backendDependencies,
      routeUsage,
      content
    );

    return {
      path: filePath,
      origin: originResult.origin,
      confidence: originResult.confidence,
      markers: originResult.markers,
      dependencies: await this.extractDependencies(content),
      backendDependencies,
      routeUsage,
      safeToArchive: riskAssessment.safeToArchive,
      archiveReason: riskAssessment.reason,
      riskLevel: riskAssessment.riskLevel,
      lastModified: stats.mtime,
      fileSize: stats.size
    };
  }

  /**
   * Analyze backend dependencies in component content
   */
  private static analyzeBackendDependencies(content: string): BackendDependency[] {
    const dependencies: BackendDependency[] = [];
    
    for (const pattern of this.BACKEND_DEPENDENCY_PATTERNS) {
      const matches = content.match(pattern.pattern);
      if (matches) {
        dependencies.push({
          type: pattern.type,
          name: pattern.name,
          isActive: true, // Assume active if found in code
          migrationPath: this.getMigrationPath(pattern.name)
        });
      }
    }

    return dependencies;
  }

  /**
   * Analyze route usage patterns
   */
  private static analyzeRouteUsage(filePath: string, content: string): RouteUsage[] {
    const routeUsage: RouteUsage[] = [];
    
    // Check if this is a route component
    if (filePath.includes('/pages/') || filePath.includes('/routes/')) {
      const routePath = this.extractRoutePath(filePath);
      
      for (const routePattern of this.ROUTE_PATTERNS) {
        if (routePattern.pattern.test(routePath)) {
          routeUsage.push({
            route: routePath,
            isActive: true,
            hasKiroAlternative: !!routePattern.alternative,
            alternativeRoute: routePattern.alternative,
            usageCount: this.estimateUsageCount(content)
          });
        }
      }
    }

    // Check for route references in content
    const routeReferences = content.match(/['"`]\/[^'"`\s]*['"`]/g) || [];
    for (const ref of routeReferences) {
      const route = ref.slice(1, -1); // Remove quotes
      if (route.startsWith('/') && route.length > 1) {
        const existingUsage = routeUsage.find(r => r.route === route);
        if (!existingUsage) {
          routeUsage.push({
            route,
            isActive: true,
            hasKiroAlternative: false,
            usageCount: 1
          });
        }
      }
    }

    return routeUsage;
  }

  /**
   * Classify if component is safe to archive (NO DELETION)
   */
  private static classifySafeToArchive(
    filePath: string,
    origin: ComponentOrigin,
    backendDependencies: BackendDependency[],
    routeUsage: RouteUsage[]
  ): { safeToArchive: boolean; reason: string; riskLevel: RiskLevel } {
    
    // High-risk components that should NOT be archived without review
    const criticalPaths = [
      '/auth/',
      '/api/',
      '/middleware',
      'layout',
      'provider',
      'context'
    ];

    const isCriticalPath = criticalPaths.some(critical => 
      filePath.toLowerCase().includes(critical)
    );

    if (isCriticalPath) {
      return {
        safeToArchive: false,
        reason: 'Critical system component – manual review required',
        riskLevel: 'critical'
      };
    }

    // Check for active backend dependencies
    const activeBackendDeps = backendDependencies.filter(dep => dep.isActive);
    if (activeBackendDeps.length > 0 && !activeBackendDeps.every(dep => dep.migrationPath)) {
      return {
        safeToArchive: false,
        reason: 'active backend dependencies – manual review',
        riskLevel: 'medium'
      };
    }

    // Check for active routes without alternatives
    const activeRoutesWithoutAlternatives = routeUsage.filter(
      route => route.isActive && !route.hasKiroAlternative
    );
    
    if (activeRoutesWithoutAlternatives.length > 0) {
      return {
        safeToArchive: false,
        reason: 'Contains active routes without Kiro alternatives',
        riskLevel: 'high'
      };
    }

    // Safe to archive conditions
    if (origin === 'supabase' || origin === 'lovable') {
      const hasKiroAlternative = OriginDetector.findKiroAlternative(filePath, origin);
      if (hasKiroAlternative) {
        return {
          safeToArchive: true,
          reason: 'Kiro alternative available — safe to archive',
          riskLevel: 'low'
        };
      }
    }

    // Unknown origin components with no critical dependencies
    if (origin === 'unknown' && activeBackendDeps.length === 0) {
      return {
        safeToArchive: true,
        reason: 'Unknown origin component with no active dependencies',
        riskLevel: 'medium'
      };
    }

    return {
      safeToArchive: false,
      reason: 'Requires manual review before archival',
      riskLevel: 'medium'
    };
  }

  /**
   * Create comprehensive archival plan
   */
  private static createArchivalPlan(components: LegacyComponent[]): ArchivalPlan {
    const safeToArchive = components.filter(c => c.safeToArchive);
    const requiresReview = components.filter(c => !c.safeToArchive);
    const highRisk = components.filter(c => c.riskLevel === 'high' || c.riskLevel === 'critical');

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const archiveDirectory = `src/archive/legacy-cleanup-${timestamp.split('T')[0]}`;

    return {
      components,
      summary: {
        totalComponents: components.length,
        safeToArchive: safeToArchive.length,
        requiresReview: requiresReview.length,
        highRisk: highRisk.length
      },
      archiveGroups: {
        supabaseComponents: components.filter(c => c.origin === 'supabase'),
        lovableComponents: components.filter(c => c.origin === 'lovable'),
        unknownComponents: components.filter(c => c.origin === 'unknown')
      },
      backupPlan: {
        archiveDirectory,
        timestamp,
        manifestFile: `${archiveDirectory}/archive-manifest.json`,
        rollbackScript: `${archiveDirectory}/rollback.sh`
      }
    };
  }

  /**
   * Extract dependencies from component content
   */
  private static async extractDependencies(content: string): Promise<string[]> {
    const dependencies: string[] = [];
    
    // Extract import statements
    const importMatches = content.match(/import.*from\s+['"][^'"]+['"]/g) || [];
    for (const importMatch of importMatches) {
      const match = importMatch.match(/from\s+['"]([^'"]+)['"]/);
      if (match) {
        dependencies.push(match[1]);
      }
    }

    return [...new Set(dependencies)]; // Remove duplicates
  }

  /**
   * Get migration path for backend dependency
   */
  private static getMigrationPath(dependencyName: string): string | undefined {
    const migrationPaths: Record<string, string> = {
      'supabase': 'src/services/aws-rds-client.ts',
      'supabase-auth': 'src/services/cognito-auth.ts',
      'supabase-storage': 'src/services/s3-upload.ts',
      'lovable-storage': 'src/services/s3-upload.ts',
      'legacy-api': 'src/services/kiro-api.ts'
    };

    return migrationPaths[dependencyName];
  }

  /**
   * Extract route path from file path
   */
  private static extractRoutePath(filePath: string): string {
    // Convert file path to route path
    // e.g., src/pages/auth/login.tsx -> /auth/login
    const routePart = filePath
      .replace(/^src\/pages/, '')
      .replace(/\.(tsx?|jsx?)$/, '')
      .replace(/\/index$/, '')
      .replace(/\\/g, '/');
    
    return routePart || '/';
  }

  /**
   * Estimate usage count based on content complexity
   */
  private static estimateUsageCount(content: string): number {
    // Simple heuristic based on content size and complexity
    const lines = content.split('\n').length;
    const functions = (content.match(/function|const.*=.*=>/g) || []).length;
    const components = (content.match(/export.*function|export.*const.*=.*=>/g) || []).length;
    
    return Math.max(1, Math.floor((lines + functions * 2 + components * 3) / 50));
  }

  /**
   * Generate archive manifest for rollback capability
   */
  static generateArchiveManifest(plan: ArchivalPlan): object {
    return {
      timestamp: plan.backupPlan.timestamp,
      archiveDirectory: plan.backupPlan.archiveDirectory,
      summary: plan.summary,
      components: plan.components.map(component => ({
        originalPath: component.path,
        archivePath: component.path.replace('src/', `${plan.backupPlan.archiveDirectory}/`),
        origin: component.origin,
        safeToArchive: component.safeToArchive,
        riskLevel: component.riskLevel,
        dependencies: component.dependencies,
        backendDependencies: component.backendDependencies,
        routeUsage: component.routeUsage
      })),
      rollbackInstructions: [
        '1. Stop the application',
        '2. Run the rollback script: ./rollback.sh',
        '3. Restart the application',
        '4. Verify functionality'
      ]
    };
  }
}