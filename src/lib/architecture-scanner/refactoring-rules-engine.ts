/**
 * Refactoring Rules Engine
 * Generates concrete refactoring commands and cleanup actions
 */

import { ComponentInfo, ArchitectureMap } from './types';

export type RefactoringAction = 
  | 'replace_import'
  | 'replace_hook'
  | 'replace_service'
  | 'archive_component'
  | 'update_context'
  | 'migrate_auth'
  | 'consolidate_utils';

export interface RefactoringRule {
  id: string;
  name: string;
  description: string;
  action: RefactoringAction;
  pattern: RegExp;
  replacement: string;
  confidence: number;
  estimatedEffort: 'low' | 'medium' | 'high';
  prerequisites: string[];
  riskLevel: 'low' | 'medium' | 'high';
}

export interface RefactoringCommand {
  componentPath: string;
  rule: RefactoringRule;
  currentCode: string;
  suggestedCode: string;
  priority: number;
  safetyChecks: string[];
  rollbackInstructions: string;
}

export class RefactoringRulesEngine {
  private static readonly REFACTORING_RULES: RefactoringRule[] = [
    // Supabase to Kiro Auth Migration
    {
      id: 'supabase-auth-to-kiro',
      name: 'Migrate Supabase Auth to Kiro Auth',
      description: 'Replace Supabase authentication with Kiro AWS Cognito',
      action: 'migrate_auth',
      pattern: /// MIGRATED: Use AWS services instead
      replacement: "import { useAuthUnified } from '@/hooks/useAuthUnified';",
      confidence: 0.9,
      estimatedEffort: 'high',
      prerequisites: ['Kiro Auth system deployed', 'AWS Cognito configured'],
      riskLevel: 'high'
    },
    
    // Supabase Client to AWS RDS
    {
      id: 'supabase-client-to-aws-rds',
      name: 'Replace Supabase Client with AWS RDS',
      description: 'Migrate database calls from Supabase to AWS RDS',
      action: 'replace_service',
      pattern: /createClient\(['"].*['"],\s*['"].*['"]\)/g,
      replacement: "import { awsRdsClient } from '@/services/aws-rds-client';",
      confidence: 0.8,
      estimatedEffort: 'high',
      prerequisites: ['AWS RDS client configured', 'Database schema migrated'],
      riskLevel: 'high'
    },

    // Hook Replacements
    {
      id: 'use-supabase-to-use-kiro',
      name: 'Replace useSupabase with Kiro hooks',
      description: 'Replace Supabase hooks with Kiro equivalents',
      action: 'replace_hook',
      pattern: /useSupabase\(\)/g,
      replacement: 'useAuthUnified()',
      confidence: 0.7,
      estimatedEffort: 'medium',
      prerequisites: ['Kiro hooks available'],
      riskLevel: 'medium'
    },

    // Import Replacements
    {
      id: 'supabase-imports-to-kiro',
      name: 'Replace Supabase imports with Kiro',
      description: 'Update import statements to use Kiro services',
      action: 'replace_import',
      pattern: /from\s+['"]@\/integrations\/supabase\/client['"]/g,
      replacement: "from '@/services/aws-rds-client'",
      confidence: 0.8,
      estimatedEffort: 'low',
      prerequisites: ['Kiro services available'],
      riskLevel: 'low'
    },

    // Context Migration
    {
      id: 'supabase-context-to-kiro',
      name: 'Migrate Supabase Context to Kiro',
      description: 'Replace Supabase context providers with Kiro equivalents',
      action: 'update_context',
      pattern: /SupabaseProvider|SupabaseContext/g,
      replacement: 'AuthContext',
      confidence: 0.9,
      estimatedEffort: 'high',
      prerequisites: ['Kiro AuthContext implemented'],
      riskLevel: 'high'
    },

    // Utility Consolidation
    {
      id: 'consolidate-utils',
      name: 'Consolidate Utility Functions',
      description: 'Merge duplicate utility functions into shared modules',
      action: 'consolidate_utils',
      pattern: /export\s+(?:const|function)\s+(\w+)/g,
      replacement: "import { $1 } from '@/utils/shared';",
      confidence: 0.6,
      estimatedEffort: 'medium',
      prerequisites: ['Shared utils module created'],
      riskLevel: 'low'
    }
  ];

  /**
   * Generate refactoring commands for high-priority components
   */
  static generateRefactoringCommands(
    architectureMap: ArchitectureMap,
    priorityThreshold: number = 10
  ): RefactoringCommand[] {
    const commands: RefactoringCommand[] = [];

    // Filter high-priority components
    const highPriorityComponents = architectureMap.cleanupPriority
      .filter(item => item.priority >= priorityThreshold)
      .map(item => ({
        ...item,
        component: architectureMap.components[item.component]
      }))
      .filter(item => item.component); // Ensure component exists

    for (const priorityItem of highPriorityComponents) {
      const component = priorityItem.component as ComponentInfo;
      
      // Find applicable refactoring rules
      const applicableRules = this.findApplicableRules(component);
      
      for (const rule of applicableRules) {
        const command = this.generateCommand(component, rule, priorityItem.priority);
        if (command) {
          commands.push(command);
        }
      }
    }

    // Sort by priority and confidence
    return commands.sort((a, b) => {
      const priorityDiff = b.priority - a.priority;
      if (priorityDiff !== 0) return priorityDiff;
      return b.rule.confidence - a.rule.confidence;
    });
  }

  /**
   * Find applicable refactoring rules for a component
   */
  private static findApplicableRules(component: ComponentInfo): RefactoringRule[] {
    const applicableRules: RefactoringRule[] = [];

    for (const rule of this.REFACTORING_RULES) {
      if (this.isRuleApplicable(component, rule)) {
        applicableRules.push(rule);
      }
    }

    return applicableRules;
  }

  /**
   * Check if a refactoring rule is applicable to a component
   */
  private static isRuleApplicable(component: ComponentInfo, rule: RefactoringRule): boolean {
    // Skip if component is already Kiro
    if (component.origin === 'kiro') return false;

    // Check origin-specific rules
    if (rule.id.includes('supabase') && component.origin !== 'supabase') {
      return false;
    }

    if (rule.id.includes('lovable') && component.origin !== 'lovable') {
      return false;
    }

    // Check component type compatibility
    if (rule.action === 'migrate_auth' && !component.path.includes('/auth/')) {
      return false;
    }

    if (rule.action === 'update_context' && !component.path.includes('Context')) {
      return false;
    }

    return true;
  }

  /**
   * Generate a specific refactoring command
   */
  private static generateCommand(
    component: ComponentInfo,
    rule: RefactoringRule,
    priority: number
  ): RefactoringCommand | null {
    try {
      // This would normally read the actual file content
      // For now, we'll use a placeholder
      const currentCode = `// Current code for ${component.path}`;
      const suggestedCode = this.applySuggestion(currentCode, rule);

      const safetyChecks = this.generateSafetyChecks(component, rule);
      const rollbackInstructions = this.generateRollbackInstructions(component, rule);

      return {
        componentPath: component.path,
        rule,
        currentCode,
        suggestedCode,
        priority,
        safetyChecks,
        rollbackInstructions
      };
    } catch (error) {
      console.warn(`Failed to generate command for ${component.path}:`, error);
      return null;
    }
  }

  /**
   * Apply refactoring suggestion to code
   */
  private static applySuggestion(code: string, rule: RefactoringRule): string {
    return code.replace(rule.pattern, rule.replacement);
  }

  /**
   * Generate safety checks for a refactoring command
   */
  private static generateSafetyChecks(component: ComponentInfo, rule: RefactoringRule): string[] {
    const checks: string[] = [
      'Backup original file to archive',
      'Verify all imports are available',
      'Check TypeScript compilation',
      'Run affected tests'
    ];

    // Add rule-specific checks
    if (rule.action === 'migrate_auth') {
      checks.push(
        'Verify AWS Cognito configuration',
        'Test authentication flow',
        'Validate user session handling'
      );
    }

    if (rule.action === 'replace_service') {
      checks.push(
        'Verify database connection',
        'Test CRUD operations',
        'Validate data integrity'
      );
    }

    if (component.riskLevel === 'critical' || component.riskLevel === 'high') {
      checks.push(
        'Manual code review required',
        'Staged deployment recommended',
        'Monitor error rates post-deployment'
      );
    }

    return checks;
  }

  /**
   * Generate rollback instructions
   */
  private static generateRollbackInstructions(component: ComponentInfo, rule: RefactoringRule): string {
    const timestamp = new Date().toISOString().split('T')[0];
    const archivePath = `src/archive/legacy-cleanup-${timestamp}/${component.path}`;
    
    return `To rollback: cp ${archivePath} ${component.path} && npm run build && npm test`;
  }

  /**
   * Generate cleanup action plan
   */
  static generateCleanupActionPlan(
    architectureMap: ArchitectureMap,
    options: {
      priorityThreshold?: number;
      maxCommands?: number;
      includeHighRisk?: boolean;
    } = {}
  ): {
    commands: RefactoringCommand[];
    summary: {
      totalCommands: number;
      byAction: Record<RefactoringAction, number>;
      estimatedHours: number;
      riskDistribution: Record<string, number>;
    };
    phases: {
      phase1: RefactoringCommand[]; // Low risk, high confidence
      phase2: RefactoringCommand[]; // Medium risk
      phase3: RefactoringCommand[]; // High risk, manual review required
    };
  } {
    const {
      priorityThreshold = 8,
      maxCommands = 50,
      includeHighRisk = false
    } = options;

    let commands = this.generateRefactoringCommands(architectureMap, priorityThreshold);

    // Filter out high-risk commands if not included
    if (!includeHighRisk) {
      commands = commands.filter(cmd => cmd.rule.riskLevel !== 'high');
    }

    // Limit number of commands
    commands = commands.slice(0, maxCommands);

    // Calculate summary
    const byAction: Record<RefactoringAction, number> = {
      replace_import: 0,
      replace_hook: 0,
      replace_service: 0,
      archive_component: 0,
      update_context: 0,
      migrate_auth: 0,
      consolidate_utils: 0
    };

    const riskDistribution = { low: 0, medium: 0, high: 0 };
    const effortHours = { low: 0.5, medium: 2, high: 8 };
    let estimatedHours = 0;

    for (const command of commands) {
      byAction[command.rule.action]++;
      riskDistribution[command.rule.riskLevel]++;
      estimatedHours += effortHours[command.rule.estimatedEffort];
    }

    // Divide into phases
    const phase1 = commands.filter(cmd => 
      cmd.rule.riskLevel === 'low' && cmd.rule.confidence >= 0.8
    );
    
    const phase2 = commands.filter(cmd => 
      cmd.rule.riskLevel === 'medium' || 
      (cmd.rule.riskLevel === 'low' && cmd.rule.confidence < 0.8)
    );
    
    const phase3 = commands.filter(cmd => 
      cmd.rule.riskLevel === 'high'
    );

    return {
      commands,
      summary: {
        totalCommands: commands.length,
        byAction,
        estimatedHours: Math.round(estimatedHours * 10) / 10,
        riskDistribution
      },
      phases: { phase1, phase2, phase3 }
    };
  }

  /**
   * Generate specific refactoring commands for common patterns
   */
  static generateSpecificCommands(architectureMap: ArchitectureMap): {
    authMigration: string[];
    importReplacements: string[];
    hookReplacements: string[];
    serviceReplacements: string[];
    archivalCandidates: string[];
  } {
    const authMigration: string[] = [];
    const importReplacements: string[] = [];
    const hookReplacements: string[] = [];
    const serviceReplacements: string[] = [];
    const archivalCandidates: string[] = [];

    for (const [path, component] of Object.entries(architectureMap.components)) {
      if (component.origin === 'kiro') continue;

      // Auth migration commands
      if (component.path.includes('/auth/') || component.imports.some(imp => imp.includes('supabase'))) {
        authMigration.push(
          `# Migrate ${path}`,
          `# Replace: // MIGRATED: Use AWS services instead
          `# With: import { useAuthUnified } from '@/hooks/useAuthUnified'`,
          `# Action: Update authentication logic to use AWS Cognito`,
          ''
        );
      }

      // Import replacements
      if (component.imports.some(imp => imp.includes('supabase'))) {
        importReplacements.push(
          `# ${path}: Replace Supabase imports`,
          `sed -i 's|@/integrations/supabase/client|@/services/aws-rds-client|g' ${path}`,
          ''
        );
      }

      // Hook replacements
      if (component.path.includes('/hooks/') && component.origin === 'supabase') {
        hookReplacements.push(
          `# Replace ${path} with Kiro equivalent`,
          `# Consider: ${component.kiroAlternative || 'Create Kiro hook equivalent'}`,
          ''
        );
      }

      // Service replacements
      if (component.path.includes('/services/') && component.origin === 'supabase') {
        serviceReplacements.push(
          `# Migrate ${path} to AWS services`,
          `# Replace Supabase calls with AWS SDK calls`,
          `# Update error handling and response formats`,
          ''
        );
      }

      // Archival candidates (unused components)
      if (!component.isActive && component.origin !== 'kiro') {
        archivalCandidates.push(
          `# Archive unused component: ${path}`,
          `mkdir -p src/archive/legacy-cleanup-$(date +%Y-%m-%d)/$(dirname ${path})`,
          `mv ${path} src/archive/legacy-cleanup-$(date +%Y-%m-%d)/${path}`,
          ''
        );
      }
    }

    return {
      authMigration,
      importReplacements,
      hookReplacements,
      serviceReplacements,
      archivalCandidates
    };
  }

  /**
   * Export refactoring plan to executable script
   */
  static async exportRefactoringPlan(
    architectureMap: ArchitectureMap,
    outputPath: string = 'refactoring-plan.sh'
  ): Promise<void> {
    const actionPlan = this.generateCleanupActionPlan(architectureMap);
    const specificCommands = this.generateSpecificCommands(architectureMap);

    const scriptContent = `#!/bin/bash
# Architecture Cleanup Refactoring Plan
# Generated: ${new Date().toISOString()}
# Total Commands: ${actionPlan.summary.totalCommands}
# Estimated Hours: ${actionPlan.summary.estimatedHours}

set -e  # Exit on error

echo "🚀 Starting Architecture Cleanup with Safe Recovery Mode"
echo "📊 Total Components: ${architectureMap.totalComponents}"
echo "🔧 Cleanup Commands: ${actionPlan.summary.totalCommands}"
echo "⏱️  Estimated Time: ${actionPlan.summary.estimatedHours} hours"
echo ""

# Create archive directory
ARCHIVE_DIR="src/archive/legacy-cleanup-$(date +%Y-%m-%d)"
mkdir -p "$ARCHIVE_DIR"
echo "📁 Archive directory created: $ARCHIVE_DIR"

# Phase 1: Low Risk, High Confidence (${actionPlan.phases.phase1.length} items)
echo "🟢 Phase 1: Low Risk Refactoring"
${actionPlan.phases.phase1.map(cmd => `# ${cmd.componentPath}: ${cmd.rule.description}`).join('\n')}

# Phase 2: Medium Risk (${actionPlan.phases.phase2.length} items)  
echo "🟡 Phase 2: Medium Risk Refactoring (Manual Review Recommended)"
${actionPlan.phases.phase2.map(cmd => `# ${cmd.componentPath}: ${cmd.rule.description}`).join('\n')}

# Phase 3: High Risk (${actionPlan.phases.phase3.length} items)
echo "🔴 Phase 3: High Risk Refactoring (Manual Review Required)"
${actionPlan.phases.phase3.map(cmd => `# ${cmd.componentPath}: ${cmd.rule.description}`).join('\n')}

# Specific Commands
echo ""
echo "🔧 Specific Refactoring Commands:"

# Auth Migration
echo "## Auth Migration Commands"
${specificCommands.authMigration.join('\n')}

# Import Replacements  
echo "## Import Replacement Commands"
${specificCommands.importReplacements.join('\n')}

# Archival Candidates
echo "## Safe Archival Commands"
${specificCommands.archivalCandidates.join('\n')}

echo "✅ Refactoring plan generated successfully!"
echo "⚠️  IMPORTANT: Review all changes before execution"
echo "🔄 Rollback available from: $ARCHIVE_DIR"
`;

    try {
      const { writeFile } = await import('fs/promises');
      await writeFile(outputPath, scriptContent, 'utf-8');
      console.log(`✅ Refactoring plan exported to ${outputPath}`);
    } catch (error) {
      console.error('Failed to export refactoring plan:', error);
      throw error;
    }
  }
}