#!/usr/bin/env tsx

/**
 * Dead Component Detector & Cleanup
 * 
 * Analyzes the codebase to identify components that are no longer used:
 * - No incoming imports (no other files use this component)
 * - No entry in routes (pages/ or App.tsx)
 * - No Kiro-linking or AI-routing relevance
 * - No ContentMap or RiskMap reference
 * - No tests or outdated tests
 * - Optional static hints (// legacy, // unused, // migrate)
 */

import fs from 'fs/promises';
import path from 'path';
import fg from 'fast-glob';

interface DeadComponent {
  name: string;
  filePath: string;
  type: 'Page' | 'Component' | 'Hook' | 'Service' | 'Context' | 'Utility' | 'Type';
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  reasons: string[];
  size: number;
  lastModified: Date;
  hasTests: boolean;
  hasStaticHints: boolean;
  staticHints: string[];
  dependencies: string[];
  exports: string[];
}

interface ComponentUsage {
  filePath: string;
  imports: string[];
  exports: string[];
  usedBy: string[];
  isRoute: boolean;
  isKiroRelevant: boolean;
  hasTests: boolean;
  staticHints: string[];
}

class DeadComponentDetector {
  private componentUsage: Map<string, ComponentUsage> = new Map();
  private deadComponents: DeadComponent[] = [];
  private routeFiles: Set<string> = new Set();
  private kiroRelevantFiles: Set<string> = new Set();

  /**
   * Main detection process
   */
  async detectDeadComponents(): Promise<void> {
    console.log('🔍 Starting dead component detection...');

    // Step 1: Scan all source files
    await this.scanSourceFiles();

    // Step 2: Identify route files
    await this.identifyRouteFiles();

    // Step 3: Identify Kiro-relevant files
    await this.identifyKiroRelevantFiles();

    // Step 4: Build usage graph
    await this.buildUsageGraph();

    // Step 5: Detect dead components
    await this.findDeadComponents();

    // Step 6: Classify risk levels
    this.classifyRiskLevels();

    console.log(`🎯 Found ${this.deadComponents.length} potentially dead components`);
  }

  /**
   * Scan all source files and extract metadata
   */
  private async scanSourceFiles(): Promise<void> {
    console.log('📂 Scanning source files...');

    // ✅ Correct glob pattern with proper options
    const files = await new Promise<string[]>((resolve, reject) => {
      glob('src/**/*.{ts,tsx}', {
        nodir: true,
        ignore: [
          'src/**/*.test.{ts,tsx}',
          'src/**/__tests__/**/*',
          'src/**/*.d.ts'
        ]
      }, (err, matches) => {
        if (err) reject(err);
        else resolve(matches);
      });
    });
    
    console.log(`📊 Found ${files.length} source files to analyze`);

    for (const filePath of files) {
      try {
        const content = await fs.readFile(filePath, 'utf-8');
        const stats = await fs.stat(filePath);
        
        const usage: ComponentUsage = {
          filePath,
          imports: this.extractImports(content),
          exports: this.extractExports(content),
          usedBy: [],
          isRoute: false,
          isKiroRelevant: false,
          hasTests: await this.checkForTests(filePath),
          staticHints: this.extractStaticHints(content)
        };

        this.componentUsage.set(filePath, usage);
      } catch (error) {
        console.warn(`⚠️ Failed to analyze ${filePath}:`, error);
      }
    }
  }

  /**
   * Identify files that are used as routes
   */
  private async identifyRouteFiles(): Promise<void> {
    console.log('🛣️ Identifying route files...');

    // Check App.tsx for route definitions
    try {
      const appContent = await fs.readFile('src/App.tsx', 'utf-8');
      const routeImports = this.extractRouteImports(appContent);
      routeImports.forEach(route => this.routeFiles.add(route));
    } catch (error) {
      console.warn('⚠️ Could not read App.tsx:', error);
    }

    // Check for pages directory
    try {
      const pageFiles = await new Promise<string[]>((resolve, reject) => {
        glob('src/pages/**/*.{ts,tsx}', { nodir: true }, (err, matches) => {
          if (err) reject(err);
          else resolve(matches);
        });
      });
      pageFiles.forEach(page => this.routeFiles.add(page));
    } catch (error) {
      console.warn('⚠️ Could not scan pages directory:', error);
    }

    console.log(`📍 Found ${this.routeFiles.size} route files`);
  }

  /**
   * Identify Kiro-relevant files
   */
  private async identifyKiroRelevantFiles(): Promise<void> {
    console.log('🤖 Identifying Kiro-relevant files...');

    const kiroPatterns = [
      '.kiro/**/*',
      'src/**/*kiro*',
      'src/**/*ai*',
      'src/**/*agent*',
      'src/**/*persona*'
    ];

    try {
      const allKiroFiles: string[] = [];
      for (const pattern of kiroPatterns) {
        const files = await new Promise<string[]>((resolve, reject) => {
          glob(pattern, { nodir: true }, (err, matches) => {
            if (err) reject(err);
            else resolve(matches);
          });
        });
        allKiroFiles.push(...files);
      }
      allKiroFiles.forEach(file => this.kiroRelevantFiles.add(file));
    } catch (error) {
      console.warn('⚠️ Could not scan Kiro files:', error);
    }

    console.log(`🤖 Found ${this.kiroRelevantFiles.size} Kiro-relevant files`);
  }

  /**
   * Build usage graph by analyzing imports
   */
  private async buildUsageGraph(): Promise<void> {
    console.log('🕸️ Building usage graph...');

    for (const [filePath, usage] of this.componentUsage) {
      // Mark as route if in route files
      usage.isRoute = this.routeFiles.has(filePath);
      
      // Mark as Kiro-relevant
      usage.isKiroRelevant = this.kiroRelevantFiles.has(filePath) || 
                            this.isKiroRelevant(filePath);

      // Find which files use this component
      for (const [otherPath, otherUsage] of this.componentUsage) {
        if (otherPath === filePath) continue;

        const relativePath = this.getRelativeImportPath(otherPath, filePath);
        if (otherUsage.imports.some(imp => this.matchesImport(imp, relativePath))) {
          usage.usedBy.push(otherPath);
        }
      }
    }
  }

  /**
   * Find components that appear to be dead
   */
  private async findDeadComponents(): Promise<void> {
    console.log('💀 Finding dead components...');

    for (const [filePath, usage] of this.componentUsage) {
      const reasons: string[] = [];

      // Check if component is used
      if (usage.usedBy.length === 0) {
        reasons.push('No incoming imports');
      }

      // Check if it's a route
      if (!usage.isRoute) {
        reasons.push('Not a route component');
      }

      // Check if it's Kiro-relevant
      if (!usage.isKiroRelevant) {
        reasons.push('Not Kiro-relevant');
      }

      // Check for tests
      if (!usage.hasTests) {
        reasons.push('No tests found');
      }

      // Check for static hints
      const hasDeadHints = usage.staticHints.some(hint => 
        hint.includes('unused') || 
        hint.includes('legacy') || 
        hint.includes('deprecated') ||
        hint.includes('migrate')
      );

      if (hasDeadHints) {
        reasons.push('Marked with dead code hints');
      }

      // Consider dead if it has multiple indicators
      const isLikelyDead = (
        usage.usedBy.length === 0 && 
        !usage.isRoute && 
        !usage.isKiroRelevant
      ) || hasDeadHints;

      if (isLikelyDead) {
        const stats = await fs.stat(filePath);
        
        const deadComponent: DeadComponent = {
          name: path.basename(filePath, path.extname(filePath)),
          filePath,
          type: this.determineComponentType(filePath),
          riskLevel: 'medium', // Will be classified later
          reasons,
          size: stats.size,
          lastModified: stats.mtime,
          hasTests: usage.hasTests,
          hasStaticHints: usage.staticHints.length > 0,
          staticHints: usage.staticHints,
          dependencies: usage.imports,
          exports: usage.exports
        };

        this.deadComponents.push(deadComponent);
      }
    }
  }

  /**
   * Classify risk levels for dead components
   */
  private classifyRiskLevels(): void {
    console.log('⚖️ Classifying risk levels...');

    for (const component of this.deadComponents) {
      let riskScore = 0;

      // Type-based risk
      if (component.type === 'Context' || component.type === 'Service') {
        riskScore += 3; // High risk for core infrastructure
      } else if (component.type === 'Hook') {
        riskScore += 2; // Medium risk for reusable logic
      } else if (component.type === 'Page') {
        riskScore += 1; // Lower risk for pages
      }

      // Auth/Security related
      if (this.isAuthRelated(component.filePath)) {
        riskScore += 3;
      }

      // Database/API related
      if (this.isDataRelated(component.filePath)) {
        riskScore += 2;
      }

      // Recently modified
      const daysSinceModified = (Date.now() - component.lastModified.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceModified < 30) {
        riskScore += 2; // Recently modified = higher risk
      } else if (daysSinceModified > 180) {
        riskScore -= 1; // Old = lower risk
      }

      // Has tests
      if (component.hasTests) {
        riskScore += 1; // Tested code = higher risk to remove
      }

      // Static hints
      if (component.hasStaticHints) {
        riskScore -= 1; // Explicitly marked = lower risk
      }

      // Classify based on score
      if (riskScore >= 6) {
        component.riskLevel = 'critical';
      } else if (riskScore >= 4) {
        component.riskLevel = 'high';
      } else if (riskScore >= 2) {
        component.riskLevel = 'medium';
      } else {
        component.riskLevel = 'low';
      }
    }

    // Sort by risk level and size
    this.deadComponents.sort((a, b) => {
      const riskOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      const riskDiff = riskOrder[b.riskLevel] - riskOrder[a.riskLevel];
      if (riskDiff !== 0) return riskDiff;
      return b.size - a.size; // Larger files first within same risk level
    });
  }

  /**
   * Generate comprehensive report
   */
  async generateReport(): Promise<void> {
    const timestamp = new Date().toISOString().split('T')[0];
    
    let content = `# Dead Component Detection Report

**Generated:** ${timestamp}  
**Total Components Analyzed:** ${this.componentUsage.size}  
**Dead Components Found:** ${this.deadComponents.length}

## 📊 Executive Summary

This report identifies components that appear to be no longer used in the codebase. Components are classified by risk level to help prioritize cleanup efforts.

### Risk Distribution
- **Critical Risk:** ${this.deadComponents.filter(c => c.riskLevel === 'critical').length} components
- **High Risk:** ${this.deadComponents.filter(c => c.riskLevel === 'high').length} components  
- **Medium Risk:** ${this.deadComponents.filter(c => c.riskLevel === 'medium').length} components
- **Low Risk:** ${this.deadComponents.filter(c => c.riskLevel === 'low').length} components

### Type Distribution
- **Pages:** ${this.deadComponents.filter(c => c.type === 'Page').length}
- **Components:** ${this.deadComponents.filter(c => c.type === 'Component').length}
- **Hooks:** ${this.deadComponents.filter(c => c.type === 'Hook').length}
- **Services:** ${this.deadComponents.filter(c => c.type === 'Service').length}
- **Contexts:** ${this.deadComponents.filter(c => c.type === 'Context').length}
- **Utilities:** ${this.deadComponents.filter(c => c.type === 'Utility').length}

## 🚨 Critical Risk Components

`;

    const criticalComponents = this.deadComponents.filter(c => c.riskLevel === 'critical');
    if (criticalComponents.length > 0) {
      for (const component of criticalComponents) {
        content += this.formatComponentEntry(component);
      }
    } else {
      content += '*No critical risk components found.*\n\n';
    }

    content += `## ⚠️ High Risk Components

`;

    const highRiskComponents = this.deadComponents.filter(c => c.riskLevel === 'high');
    if (highRiskComponents.length > 0) {
      for (const component of highRiskComponents.slice(0, 10)) { // Top 10
        content += this.formatComponentEntry(component);
      }
    } else {
      content += '*No high risk components found.*\n\n';
    }

    content += `## 📋 All Dead Components

| Risk | Component | Type | Size | Last Modified | Reasons |
|------|-----------|------|------|---------------|---------|
`;

    for (const component of this.deadComponents) {
      const riskEmoji = {
        critical: '🔴',
        high: '🟠', 
        medium: '🟡',
        low: '🟢'
      }[component.riskLevel];

      const sizeKB = Math.round(component.size / 1024);
      const lastMod = component.lastModified.toISOString().split('T')[0];
      const reasons = component.reasons.slice(0, 2).join(', ');

      content += `| ${riskEmoji} ${component.riskLevel} | **${component.name}** | ${component.type} | ${sizeKB}KB | ${lastMod} | ${reasons} |\n`;
    }

    content += `

## 🧹 Cleanup Recommendations

### Safe to Remove (Low Risk)
${this.deadComponents.filter(c => c.riskLevel === 'low').length} components can likely be removed safely:

`;

    const lowRiskComponents = this.deadComponents.filter(c => c.riskLevel === 'low');
    for (const component of lowRiskComponents.slice(0, 20)) {
      content += `- \`${component.filePath}\` - ${component.reasons.join(', ')}\n`;
    }

    content += `

### Requires Review (Medium+ Risk)
${this.deadComponents.filter(c => c.riskLevel !== 'low').length} components require manual review before removal.

### Cleanup Script
A cleanup script has been generated: \`scripts/cleanup-dead-components.sh\`

## 📈 Impact Analysis

### Disk Space Savings
- **Total Size:** ${Math.round(this.deadComponents.reduce((sum, c) => sum + c.size, 0) / 1024)}KB
- **Low Risk:** ${Math.round(lowRiskComponents.reduce((sum, c) => sum + c.size, 0) / 1024)}KB (safe to remove)

### Maintenance Reduction
Removing dead components will:
- Reduce cognitive load for developers
- Improve build times
- Simplify dependency management
- Reduce security surface area

## ⚠️ Important Notes

1. **Manual Verification Required:** Always verify components are truly unused before deletion
2. **Git History:** Consider keeping git history for reference
3. **Gradual Removal:** Remove components incrementally to avoid issues
4. **Test After Removal:** Run full test suite after each removal

---

*This report was automatically generated. Always verify findings before taking action.*
`;

    await fs.writeFile('reports/dead-components.md', content);
    console.log('✅ Dead component report generated: reports/dead-components.md');
  }

  /**
   * Generate cleanup script
   */
  async generateCleanupScript(): Promise<void> {
    const lowRiskComponents = this.deadComponents.filter(c => c.riskLevel === 'low');
    
    let script = `#!/bin/bash

# Dead Component Cleanup Script
# Generated: ${new Date().toISOString()}
# 
# This script removes low-risk dead components.
# ALWAYS review the list before running!

set -e

echo "🧹 Dead Component Cleanup"
echo "========================="
echo ""
echo "This will remove ${lowRiskComponents.length} low-risk dead components."
echo ""
read -p "Are you sure you want to continue? (y/N) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cleanup cancelled."
    exit 1
fi

echo ""
echo "🗑️ Removing dead components..."

`;

    for (const component of lowRiskComponents) {
      script += `
# Remove: ${component.name} (${component.type})
# Reasons: ${component.reasons.join(', ')}
if [ -f "${component.filePath}" ]; then
    echo "Removing ${component.filePath}..."
    rm "${component.filePath}"
else
    echo "⚠️ File not found: ${component.filePath}"
fi
`;
    }

    script += `
echo ""
echo "✅ Cleanup complete!"
echo "📊 Removed ${lowRiskComponents.length} components"
echo "💾 Freed ~${Math.round(lowRiskComponents.reduce((sum, c) => sum + c.size, 0) / 1024)}KB"
echo ""
echo "🧪 Next steps:"
echo "1. Run tests: npm test"
echo "2. Check build: npm run build"
echo "3. Commit changes: git add -A && git commit -m 'Remove dead components'"
`;

    await fs.writeFile('scripts/cleanup-dead-components.sh', script);
    await fs.chmod('scripts/cleanup-dead-components.sh', 0o755);
    console.log('✅ Cleanup script generated: scripts/cleanup-dead-components.sh');
  }

  // Helper methods
  private extractImports(content: string): string[] {
    const imports: string[] = [];
    const importRegex = /import\s+.*?\s+from\s+['"`]([^'"`]+)['"`]/g;
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }
    return imports;
  }

  private extractExports(content: string): string[] {
    const exports: string[] = [];
    const exportRegex = /export\s+(?:default\s+)?(?:const|function|class|interface|type)\s+(\w+)/g;
    let match;
    while ((match = exportRegex.exec(content)) !== null) {
      exports.push(match[1]);
    }
    return exports;
  }

  private extractRouteImports(content: string): string[] {
    const routes: string[] = [];
    // Look for React Router route patterns
    const routeRegex = /(?:element|component):\s*<(\w+)/g;
    let match;
    while ((match = routeRegex.exec(content)) !== null) {
      routes.push(match[1]);
    }
    return routes;
  }

  private extractStaticHints(content: string): string[] {
    const hints: string[] = [];
    const hintRegex = /\/\/\s*(legacy|unused|deprecated|migrate|todo|fixme|hack).*$/gim;
    let match;
    while ((match = hintRegex.exec(content)) !== null) {
      hints.push(match[0].trim());
    }
    return hints;
  }

  private async checkForTests(filePath: string): Promise<boolean> {
    const testPatterns = [
      filePath.replace(/\.(ts|tsx|js|jsx)$/, '.test.$1'),
      filePath.replace(/\.(ts|tsx|js|jsx)$/, '.spec.$1'),
      filePath.replace(/src\//, 'src/__tests__/').replace(/\.(ts|tsx|js|jsx)$/, '.test.$1'),
      filePath.replace(/src\//, 'test/').replace(/\.(ts|tsx|js|jsx)$/, '.test.$1')
    ];

    for (const testPath of testPatterns) {
      try {
        await fs.access(testPath);
        return true;
      } catch {
        // File doesn't exist, continue
      }
    }
    return false;
  }

  private determineComponentType(filePath: string): DeadComponent['type'] {
    if (filePath.includes('/pages/')) return 'Page';
    if (filePath.includes('/hooks/')) return 'Hook';
    if (filePath.includes('/services/')) return 'Service';
    if (filePath.includes('/contexts/')) return 'Context';
    if (filePath.includes('/utils/') || filePath.includes('/lib/')) return 'Utility';
    if (filePath.includes('/types/')) return 'Type';
    return 'Component';
  }

  private isKiroRelevant(filePath: string): boolean {
    const kiroKeywords = ['kiro', 'ai', 'agent', 'persona', 'bedrock', 'claude'];
    return kiroKeywords.some(keyword => 
      filePath.toLowerCase().includes(keyword)
    );
  }

  private isAuthRelated(filePath: string): boolean {
    const authKeywords = ['auth', 'login', 'session', 'token', 'cognito', 'supabase'];
    return authKeywords.some(keyword => 
      filePath.toLowerCase().includes(keyword)
    );
  }

  private isDataRelated(filePath: string): boolean {
    const dataKeywords = ['api', 'client', 'service', 'database', 'db', 'query', 'mutation'];
    return dataKeywords.some(keyword => 
      filePath.toLowerCase().includes(keyword)
    );
  }

  private getRelativeImportPath(fromPath: string, toPath: string): string {
    const from = path.dirname(fromPath);
    const to = toPath.replace(/\.(ts|tsx|js|jsx)$/, '');
    return path.relative(from, to);
  }

  private matchesImport(importPath: string, targetPath: string): boolean {
    // Normalize paths for comparison
    const normalizedImport = importPath.replace(/^\.\//, '').replace(/^\.\.\//, '');
    const normalizedTarget = targetPath.replace(/^\.\//, '').replace(/^\.\.\//, '');
    
    return normalizedImport === normalizedTarget ||
           normalizedImport.endsWith('/' + path.basename(normalizedTarget)) ||
           normalizedTarget.endsWith('/' + normalizedImport);
  }

  private formatComponentEntry(component: DeadComponent): string {
    const sizeKB = Math.round(component.size / 1024);
    const lastMod = component.lastModified.toISOString().split('T')[0];
    
    return `### ${component.name}

- **File:** \`${component.filePath}\`
- **Type:** ${component.type}
- **Size:** ${sizeKB}KB
- **Last Modified:** ${lastMod}
- **Has Tests:** ${component.hasTests ? '✅ Yes' : '❌ No'}
- **Static Hints:** ${component.hasStaticHints ? '⚠️ Yes' : '✅ No'}

**Reasons for Detection:**
${component.reasons.map(reason => `- ${reason}`).join('\n')}

**Dependencies:** ${component.dependencies.length} imports  
**Exports:** ${component.exports.join(', ') || 'None'}

${component.staticHints.length > 0 ? `**Static Hints Found:**\n${component.staticHints.map(hint => `- \`${hint}\``).join('\n')}\n` : ''}

---

`;
  }
}

async function main(): Promise<void> {
  console.log('💀 Starting Dead Component Detection...');

  try {
    const detector = new DeadComponentDetector();
    
    // Run detection
    await detector.detectDeadComponents();
    
    // Generate reports
    await detector.generateReport();
    await detector.generateCleanupScript();
    
    console.log('\n✅ Dead component detection complete!');
    console.log('📁 Generated files:');
    console.log('   📄 reports/dead-components.md - Detection report');
    console.log('   🧹 scripts/cleanup-dead-components.sh - Cleanup script');
    console.log('\n⚠️ Important: Always review findings before running cleanup!');
    
  } catch (error) {
    console.error('❌ Dead component detection failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  });
}