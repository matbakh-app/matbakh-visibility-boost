# Supabase-Vercel Cleanup Design

## Overview

This design document outlines the systematic approach to remove all Supabase and Vercel dependencies, configurations, and references from the matbakh.app codebase after successful migration to AWS infrastructure.

## Current State Analysis

### Legacy Dependencies Inventory

```mermaid
graph TB
    subgraph "Supabase Dependencies"
        A[Supabase Client Libraries]
        B[Supabase Auth SDK]
        C[Supabase Storage SDK]
        D[Supabase Realtime SDK]
        E[Supabase Edge Functions]
    end

    subgraph "Vercel Dependencies"
        F[Vercel CLI]
        G[Vercel Build Configs]
        H[Vercel Environment Variables]
        I[Vercel Deployment Scripts]
        J[Vercel Analytics]
    end

    subgraph "Configuration Files"
        K[Environment Variables]
        L[CI/CD Configurations]
        M[Docker Configurations]
        N[Package.json Dependencies]
        O[TypeScript Configurations]
    end

    A --> K
    B --> K
    F --> L
    G --> M
    H --> N
```

### Code Reference Analysis

```typescript
// Current problematic imports and usage
import { createClient } from "@supabase/supabase-js";
import { Auth } from "@supabase/auth-ui-react";
import { Database } from "@supabase/database-js";

// Vercel-specific imports
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

// Environment variable references
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const vercelUrl = process.env.VERCEL_URL;
```

## Cleanup Architecture Design

### Systematic Removal Strategy

```mermaid
flowchart TD
    A[Inventory Legacy Components] --> B[Categorize by Risk Level]
    B --> C[Create Removal Plan]
    C --> D[Execute Safe Removal]
    D --> E[Validate Functionality]
    E --> F[Update Documentation]

    subgraph "Risk Categories"
        G[Low Risk - Comments/Docs]
        H[Medium Risk - Unused Code]
        I[High Risk - Active Code]
        J[Critical Risk - Core Functions]
    end

    subgraph "Removal Methods"
        K[Automated Scripts]
        L[Manual Review]
        M[Gradual Replacement]
        N[Immediate Removal]
    end

    B --> G
    B --> H
    B --> I
    B --> J

    G --> N
    H --> K
    I --> L
    J --> M
```

### Dependency Cleanup Architecture

```mermaid
graph TB
    subgraph "Package.json Cleanup"
        A[Identify Supabase Packages]
        B[Identify Vercel Packages]
        C[Check Dependency Usage]
        D[Safe Removal Process]
    end

    subgraph "Code Reference Cleanup"
        E[Scan Import Statements]
        F[Find Function Calls]
        G[Locate Configuration Usage]
        H[Update or Remove References]
    end

    subgraph "Configuration Cleanup"
        I[Environment Variables]
        J[Build Configurations]
        K[Deployment Scripts]
        L[CI/CD Pipelines]
    end

    A --> E
    B --> F
    C --> G
    D --> H

    E --> I
    F --> J
    G --> K
    H --> L
```

## Implementation Design

### 1. Automated Scanning and Detection

#### Legacy Reference Scanner

```typescript
interface LegacyReference {
  file: string;
  line: number;
  column: number;
  type: "import" | "function_call" | "config" | "comment";
  content: string;
  riskLevel: "low" | "medium" | "high" | "critical";
  replacementSuggestion?: string;
}

class LegacyReferenceScanner {
  private supabasePatterns = [
    /import.*@supabase/,
    /createClient.*supabase/,
    /supabase\./,
    /SUPABASE_/,
    /\.supabase\./,
  ];

  private vercelPatterns = [
    /import.*@vercel/,
    /vercel\./,
    /VERCEL_/,
    /\.vercel\./,
    /vercel\.json/,
  ];

  async scanCodebase(): Promise<LegacyReference[]> {
    const files = await this.getAllTypeScriptFiles();
    const references: LegacyReference[] = [];

    for (const file of files) {
      const content = await fs.readFile(file, "utf-8");
      references.push(...this.scanFile(file, content));
    }

    return this.categorizeByRisk(references);
  }

  private scanFile(file: string, content: string): LegacyReference[] {
    const lines = content.split("\n");
    const references: LegacyReference[] = [];

    lines.forEach((line, index) => {
      // Check for Supabase patterns
      this.supabasePatterns.forEach((pattern) => {
        if (pattern.test(line)) {
          references.push({
            file,
            line: index + 1,
            column: line.search(pattern),
            type: this.determineType(line),
            content: line.trim(),
            riskLevel: this.assessRisk(line, pattern),
          });
        }
      });

      // Check for Vercel patterns
      this.vercelPatterns.forEach((pattern) => {
        if (pattern.test(line)) {
          references.push({
            file,
            line: index + 1,
            column: line.search(pattern),
            type: this.determineType(line),
            content: line.trim(),
            riskLevel: this.assessRisk(line, pattern),
          });
        }
      });
    });

    return references;
  }
}
```

### 2. Safe Removal Procedures

#### Risk-Based Removal Strategy

```typescript
class SafeRemovalManager {
  async executeRemoval(references: LegacyReference[]): Promise<RemovalReport> {
    const report: RemovalReport = {
      totalReferences: references.length,
      removed: 0,
      failed: 0,
      skipped: 0,
      errors: [],
    };

    // Sort by risk level (low risk first)
    const sortedRefs = this.sortByRisk(references);

    for (const ref of sortedRefs) {
      try {
        await this.removeReference(ref);
        report.removed++;
      } catch (error) {
        report.errors.push({ reference: ref, error: error.message });
        report.failed++;
      }
    }

    return report;
  }

  private async removeReference(ref: LegacyReference): Promise<void> {
    switch (ref.riskLevel) {
      case "low":
        await this.removeImmediately(ref);
        break;
      case "medium":
        await this.removeWithValidation(ref);
        break;
      case "high":
        await this.removeWithTesting(ref);
        break;
      case "critical":
        await this.removeWithFullValidation(ref);
        break;
    }
  }
}
```

#### Backup and Rollback System

```mermaid
sequenceDiagram
    participant Scanner as Reference Scanner
    participant Backup as Backup System
    participant Remover as Safe Remover
    participant Validator as Validator
    participant Rollback as Rollback System

    Scanner->>Backup: Create Pre-Cleanup Backup
    Backup->>Scanner: Backup Complete

    Scanner->>Remover: Execute Removal Plan
    Remover->>Validator: Validate Each Change
    Validator->>Remover: Validation Result

    alt Validation Success
        Remover->>Scanner: Continue Removal
    else Validation Failure
        Remover->>Rollback: Initiate Rollback
        Rollback->>Backup: Restore From Backup
        Backup->>Rollback: Restoration Complete
    end
```

### 3. Package.json and Dependency Cleanup

#### Dependency Analysis and Removal

```typescript
interface DependencyAnalysis {
  package: string;
  version: string;
  usageCount: number;
  files: string[];
  riskLevel: "safe" | "caution" | "dangerous";
  replacementAvailable: boolean;
  removalRecommendation: "immediate" | "gradual" | "manual_review";
}

class DependencyCleanupManager {
  private supabaseDependencies = [
    "@supabase/supabase-js",
    "@supabase/auth-ui-react",
    "@supabase/auth-ui-shared",
    "@supabase/gotrue-js",
    "@supabase/postgrest-js",
    "@supabase/realtime-js",
    "@supabase/storage-js",
  ];

  private vercelDependencies = [
    "@vercel/analytics",
    "@vercel/speed-insights",
    "vercel",
    "@vercel/node",
    "@vercel/edge-config",
  ];

  async analyzeDependencies(): Promise<DependencyAnalysis[]> {
    const packageJson = await this.loadPackageJson();
    const allDeps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    };

    const legacyDeps = Object.keys(allDeps).filter(
      (dep) =>
        this.supabaseDependencies.includes(dep) ||
        this.vercelDependencies.includes(dep)
    );

    const analysis: DependencyAnalysis[] = [];

    for (const dep of legacyDeps) {
      const usage = await this.analyzeUsage(dep);
      analysis.push({
        package: dep,
        version: allDeps[dep],
        usageCount: usage.count,
        files: usage.files,
        riskLevel: this.assessRemovalRisk(dep, usage),
        replacementAvailable: this.hasReplacement(dep),
        removalRecommendation: this.getRemovalStrategy(dep, usage),
      });
    }

    return analysis;
  }
}
```

### 4. Configuration File Cleanup

#### Environment Variable Cleanup

```typescript
// Environment variable cleanup strategy
const legacyEnvVars = [
  // Supabase variables
  "VITE_SUPABASE_URL",
  "VITE_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_JWT_SECRET",
  "SUPABASE_DB_URL",

  // Vercel variables
  "VERCEL_URL",
  "VERCEL_TOKEN",
  "VERCEL_PROJECT_ID",
  "VERCEL_ORG_ID",
  "VERCEL_GIT_COMMIT_SHA",
];

class EnvironmentCleanupManager {
  async cleanupEnvironmentFiles(): Promise<CleanupReport> {
    const envFiles = [
      ".env",
      ".env.local",
      ".env.production",
      ".env.development",
    ];
    const report: CleanupReport = { cleaned: [], errors: [] };

    for (const file of envFiles) {
      try {
        await this.cleanupEnvFile(file);
        report.cleaned.push(file);
      } catch (error) {
        report.errors.push({ file, error: error.message });
      }
    }

    return report;
  }

  private async cleanupEnvFile(filename: string): Promise<void> {
    if (!(await fs.pathExists(filename))) return;

    const content = await fs.readFile(filename, "utf-8");
    const lines = content.split("\n");

    const cleanedLines = lines.filter((line) => {
      const isLegacyVar = legacyEnvVars.some(
        (varName) =>
          line.startsWith(`${varName}=`) || line.includes(`${varName}=`)
      );
      return !isLegacyVar;
    });

    await fs.writeFile(filename, cleanedLines.join("\n"));
  }
}
```

### 5. CI/CD Pipeline Cleanup

#### Pipeline Configuration Updates

```yaml
# Before: Mixed AWS/Supabase/Vercel pipeline
name: Deploy
on: [push]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
      - name: Update Supabase
        run: supabase db push
      - name: Deploy to AWS
        run: aws s3 sync dist/ s3://bucket

# After: AWS-only pipeline
name: Deploy
on: [push]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Build Application
        run: npm run build
      - name: Deploy to AWS S3
        run: aws s3 sync dist/ s3://matbakh-bucket
      - name: Invalidate CloudFront
        run: aws cloudfront create-invalidation --distribution-id $DISTRIBUTION_ID --paths "/*"
      - name: Update RDS Schema
        run: npm run db:migrate
```

#### Monitoring and Alerting Updates

```mermaid
graph TB
    subgraph "Legacy Monitoring (Remove)"
        A[Supabase Dashboard]
        B[Vercel Analytics]
        C[Supabase Logs]
        D[Vercel Deployment Logs]
    end

    subgraph "AWS-Only Monitoring (Keep/Enhance)"
        E[CloudWatch Dashboards]
        F[CloudWatch Logs]
        G[X-Ray Tracing]
        H[AWS Cost Explorer]
    end

    subgraph "Alert Cleanup"
        I[Remove Supabase Alerts]
        J[Remove Vercel Alerts]
        K[Enhance AWS Alerts]
        L[Update Notification Channels]
    end

    A --> I
    B --> J
    C --> I
    D --> J

    E --> K
    F --> K
    G --> K
    H --> L
```

## Cleanup Implementation Strategy

### Phase-Based Cleanup Approach

```mermaid
gantt
    title Supabase-Vercel Cleanup Timeline
    dateFormat  YYYY-MM-DD
    section Phase 1: Analysis
    Inventory Legacy Components    :inventory, 2025-01-16, 1d
    Risk Assessment               :risk, after inventory, 1d

    section Phase 2: Safe Removal
    Low Risk Cleanup             :low, after risk, 1d
    Medium Risk Cleanup          :medium, after low, 1d

    section Phase 3: Critical Cleanup
    High Risk Cleanup            :high, after medium, 1d
    Critical Component Cleanup   :critical, after high, 1d

    section Phase 4: Validation
    Testing and Validation       :test, after critical, 1d
    Documentation Update         :docs, after test, 1d
```

### Automated Cleanup Tools

```typescript
class AutomatedCleanupTool {
  private cleanupRules: CleanupRule[] = [
    {
      pattern: /import.*@supabase/,
      action: "remove_line",
      riskLevel: "high",
      validation: "check_usage",
    },
    {
      pattern: /import.*@vercel/,
      action: "remove_line",
      riskLevel: "medium",
      validation: "check_build",
    },
    {
      pattern: /SUPABASE_|VERCEL_/,
      action: "remove_env_var",
      riskLevel: "medium",
      validation: "check_references",
    },
  ];

  async executeCleanup(): Promise<CleanupResult> {
    const result: CleanupResult = {
      filesModified: [],
      linesRemoved: 0,
      dependenciesRemoved: [],
      errors: [],
    };

    for (const rule of this.cleanupRules) {
      try {
        const ruleResult = await this.applyRule(rule);
        this.mergeResults(result, ruleResult);
      } catch (error) {
        result.errors.push({
          rule: rule.pattern.toString(),
          error: error.message,
        });
      }
    }

    return result;
  }
}
```

### 2. Service Decommissioning Design

#### Supabase Project Cleanup

```mermaid
sequenceDiagram
    participant Admin as Administrator
    participant Supabase as Supabase Console
    participant Backup as Backup System
    participant AWS as AWS Services

    Note over Admin,AWS: Pre-Decommissioning
    Admin->>Backup: Create Final Backup
    Backup->>AWS: Store in S3
    Admin->>Supabase: Export Project Data
    Supabase->>Backup: Final Data Export

    Note over Admin,AWS: Decommissioning
    Admin->>Supabase: Revoke API Keys
    Admin->>Supabase: Delete Edge Functions
    Admin->>Supabase: Remove Database
    Admin->>Supabase: Cancel Subscription

    Note over Admin,AWS: Validation
    Admin->>AWS: Verify AWS-Only Operation
    AWS->>Admin: Confirm Independence
```

#### Vercel Deployment Cleanup

```typescript
class VercelCleanupManager {
  async decommissionVercelServices(): Promise<DecommissionReport> {
    const report: DecommissionReport = {
      deploymentsRemoved: 0,
      domainsTransferred: 0,
      environmentVariablesCleared: 0,
      projectsDeleted: 0,
    };

    try {
      // Remove all deployments
      const deployments = await this.listVercelDeployments();
      for (const deployment of deployments) {
        await this.removeDeployment(deployment.id);
        report.deploymentsRemoved++;
      }

      // Transfer domains to AWS Route 53
      const domains = await this.listVercelDomains();
      for (const domain of domains) {
        await this.transferDomainToAWS(domain);
        report.domainsTransferred++;
      }

      // Clear environment variables
      await this.clearEnvironmentVariables();
      report.environmentVariablesCleared = await this.countEnvVars();

      // Delete projects
      const projects = await this.listVercelProjects();
      for (const project of projects) {
        await this.deleteProject(project.id);
        report.projectsDeleted++;
      }
    } catch (error) {
      throw new Error(`Vercel cleanup failed: ${error.message}`);
    }

    return report;
  }
}
```

### 3. Documentation and Reference Updates

#### Documentation Cleanup Strategy

```mermaid
flowchart TD
    A[Scan Documentation Files] --> B[Identify Legacy References]
    B --> C[Categorize Updates Needed]
    C --> D[Update Architecture Diagrams]
    C --> E[Update Setup Instructions]
    C --> F[Update API Documentation]
    C --> G[Update Troubleshooting Guides]

    D --> H[Validate Updated Docs]
    E --> H
    F --> H
    G --> H

    H --> I[Review and Approve]
    I --> J[Publish Updated Documentation]
```

#### README and Documentation Updates

```markdown
<!-- Before: Mixed architecture documentation -->

# matbakh.app

## Architecture

- Frontend: React + Vite
- Backend: Supabase + AWS Lambda
- Database: Supabase PostgreSQL
- Storage: Supabase Storage + AWS S3
- Deployment: Vercel + AWS

<!-- After: AWS-only architecture documentation -->

# matbakh.app

## Architecture

- Frontend: React + Vite
- Backend: AWS Lambda + API Gateway
- Database: Amazon RDS PostgreSQL
- Storage: Amazon S3 + CloudFront
- Authentication: Amazon Cognito
- Deployment: AWS S3 + CloudFront
```

## Validation and Testing Design

### Comprehensive Validation Framework

```typescript
class CleanupValidationFramework {
  async validateCleanup(): Promise<ValidationReport> {
    const report: ValidationReport = {
      codebaseClean: false,
      buildSuccessful: false,
      testsPass: false,
      deploymentWorks: false,
      performanceAcceptable: false,
      securityCompliant: false,
    };

    // Validate codebase is clean
    report.codebaseClean = await this.validateNoLegacyReferences();

    // Validate build process
    report.buildSuccessful = await this.validateBuildProcess();

    // Validate tests pass
    report.testsPass = await this.validateTestSuite();

    // Validate deployment
    report.deploymentWorks = await this.validateDeployment();

    // Validate performance
    report.performanceAcceptable = await this.validatePerformance();

    // Validate security
    report.securityCompliant = await this.validateSecurity();

    return report;
  }

  private async validateNoLegacyReferences(): Promise<boolean> {
    const scanner = new LegacyReferenceScanner();
    const references = await scanner.scanCodebase();
    return references.length === 0;
  }
}
```

### Testing Strategy

```mermaid
graph TB
    subgraph "Pre-Cleanup Testing"
        A[Baseline Test Suite]
        B[Performance Benchmarks]
        C[Security Scan]
        D[Build Verification]
    end

    subgraph "Post-Cleanup Testing"
        E[Regression Test Suite]
        F[Performance Comparison]
        G[Security Re-scan]
        H[Build Re-verification]
    end

    subgraph "Validation Criteria"
        I[Zero Legacy References]
        J[All Tests Pass]
        K[Performance Maintained]
        L[Security Improved]
    end

    A --> E
    B --> F
    C --> G
    D --> H

    E --> I
    F --> K
    G --> L
    H --> J
```

## Monitoring and Alerting Design

### Cleanup Progress Monitoring

```typescript
interface CleanupMetrics {
  totalReferencesFound: number;
  referencesRemoved: number;
  filesModified: number;
  dependenciesRemoved: number;
  configurationsCleaned: number;
  errorsEncountered: number;
  completionPercentage: number;
  estimatedTimeRemaining: number;
}

class CleanupProgressMonitor {
  private metrics: CleanupMetrics = {
    totalReferencesFound: 0,
    referencesRemoved: 0,
    filesModified: 0,
    dependenciesRemoved: 0,
    configurationsCleaned: 0,
    errorsEncountered: 0,
    completionPercentage: 0,
    estimatedTimeRemaining: 0,
  };

  updateProgress(update: Partial<CleanupMetrics>): void {
    Object.assign(this.metrics, update);
    this.calculateCompletion();
    this.estimateTimeRemaining();
    this.publishMetrics();
  }

  private calculateCompletion(): void {
    if (this.metrics.totalReferencesFound > 0) {
      this.metrics.completionPercentage =
        (this.metrics.referencesRemoved / this.metrics.totalReferencesFound) *
        100;
    }
  }
}
```

This comprehensive design provides a systematic, safe, and thorough approach to removing all Supabase and Vercel dependencies while ensuring system functionality is maintained and improved through the cleanup process.
